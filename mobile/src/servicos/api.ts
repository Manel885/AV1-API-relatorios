import { Platform } from "react-native";
import Constants from "expo-constants";

// Descobre o endereço da API:
// 1) EXPO_PUBLIC_API_URL no .env do app, se existir;
// 2) no navegador, localhost;
// 3) no celular (Expo Go), o mesmo IP do computador que está rodando o Expo.
function descobrirUrlApi() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === "web") return "http://localhost:3000";

  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) return `http://${host}:3000`;
  return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
}

export const URL_API = descobrirUrlApi();

export type ErroCampo = { campo: string; mensagem: string };

// Erro devolvido pela API, já com os detalhes do Zod (se houver)
export class ErroApi extends Error {
  constructor(
    public status: number,
    mensagem: string,
    public detalhes: ErroCampo[] = [],
  ) {
    super(mensagem);
  }
}

let tokenAtual: string | null = null;
let aoExpirarSessao: (() => void) | null = null;

export function definirToken(token: string | null) {
  tokenAtual = token;
}

export function quandoSessaoExpirar(callback: () => void) {
  aoExpirarSessao = callback;
}

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        ...(tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {}),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi(0, `Não foi possível conectar à API em ${URL_API}`);
  }

  if (resposta.status === 204) return undefined as T;

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    // Token vencido/inválido numa rota protegida: volta para o login
    if (resposta.status === 401 && tokenAtual) aoExpirarSessao?.();

    // A API responde de dois jeitos:
    //  { erro: "texto" }                          → 401, 404, 409, id inválido...
    //  { erros: [{ path: ["campo"], message }] }  → falha de validação do Zod (400)
    const detalhes: ErroCampo[] = Array.isArray(dados.erros)
      ? dados.erros.map((e: { path?: (string | number)[]; message: string }) => ({
          campo: (e.path ?? []).join("."),
          mensagem: e.message,
        }))
      : [];
    const mensagem = dados.erro ?? (detalhes.length ? "Dados inválidos" : "Erro inesperado");
    throw new ErroApi(resposta.status, mensagem, detalhes);
  }

  return dados as T;
}

export const api = {
  get: <T>(caminho: string) => requisicao<T>("GET", caminho),
  post: <T>(caminho: string, corpo: unknown) => requisicao<T>("POST", caminho, corpo),
  put: <T>(caminho: string, corpo: unknown) => requisicao<T>("PUT", caminho, corpo),
  delete: (caminho: string) => requisicao<void>("DELETE", caminho),
};
