import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, definirToken, quandoSessaoExpirar } from "../servicos/api";
import { apagarToken, lerToken, salvarToken } from "../servicos/armazenamento";
import type { RespostaLogin, Usuario } from "../tipos";

type AuthContexto = {
  usuario: Usuario | null;
  carregando: boolean; // true enquanto verifica se já existe um token salvo
  entrar: (email: string, senha: string) => Promise<void>;
  registrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

const Contexto = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function sair() {
    definirToken(null);
    await apagarToken();
    setUsuario(null);
  }

  async function iniciarSessao({ token, usuario }: RespostaLogin) {
    definirToken(token);
    await salvarToken(token);
    setUsuario(usuario);
  }

  // Ao abrir o app: se houver token salvo, confere com a API (GET /auth/me)
  useEffect(() => {
    quandoSessaoExpirar(() => void sair());

    (async () => {
      try {
        const token = await lerToken();
        if (token) {
          definirToken(token);
          setUsuario(await api.get<Usuario>("/auth/me"));
        }
      } catch {
        await sair();
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const valor: AuthContexto = {
    usuario,
    carregando,
    entrar: async (email, senha) =>
      iniciarSessao(await api.post<RespostaLogin>("/auth/login", { email, senha })),
    registrar: async (nome, email, senha) =>
      iniciarSessao(await api.post<RespostaLogin>("/auth/registrar", { nome, email, senha })),
    sair,
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useAuth precisa estar dentro do AuthProvider");
  return contexto;
}
