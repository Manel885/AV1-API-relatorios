import { useEffect, useState } from "react";
import type { z } from "zod";
import { ErroApi } from "../servicos/api";
import { validar, type ErrosForm } from "../schemas";

// Cuida do que todo formulário precisa: carregar item (edição),
// validar com Zod, enviar para a API e mostrar os erros.
export function useFormulario<S extends z.ZodType>(opcoes: {
  schema: S;
  carregar?: () => Promise<void>; // só na edição
  enviar: (dados: z.infer<S>) => Promise<void>;
}) {
  const [erros, setErros] = useState<ErrosForm>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(!!opcoes.carregar);

  useEffect(() => {
    if (!opcoes.carregar) return;
    opcoes
      .carregar()
      .catch((e) => setErroGeral(e instanceof ErroApi ? e.message : "Erro ao carregar"))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvar(valores: unknown) {
    setErroGeral(null);

    // 1) Validação no app com Zod
    const { dados, erros } = validar(opcoes.schema, valores);
    if (erros) {
      setErros(erros);
      return;
    }
    setErros({});

    // 2) Envia para a API (que valida de novo com Zod)
    setSalvando(true);
    try {
      await opcoes.enviar(dados);
    } catch (e) {
      if (e instanceof ErroApi) {
        const doServidor: ErrosForm = {};
        e.detalhes.forEach((d) => (doServidor[d.campo] ??= d.mensagem));
        setErros(doServidor);
        setErroGeral(e.message);
      } else {
        setErroGeral("Erro inesperado");
      }
    } finally {
      setSalvando(false);
    }
  }

  return { erros, erroGeral, salvando, carregando, salvar };
}
