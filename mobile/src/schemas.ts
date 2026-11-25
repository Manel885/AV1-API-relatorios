import { z } from "zod";

// Mesmas regras da API: o app valida antes de enviar,
// e a API valida de novo (nunca confie só no cliente).
z.config(z.locales.pt());

export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export const registroSchema = z.object({
  nome: z.string().trim().min(3, "O nome precisa de ao menos 3 letras"),
  email: z.email("E-mail inválido"),
  senha: z.string().min(6, "A senha precisa de ao menos 6 caracteres"),
});

// Na edição a senha é opcional (vazia = mantém a atual)
export const usuarioEdicaoSchema = registroSchema.extend({
  senha: registroSchema.shape.senha.optional(),
});

export const categoriaSchema = z.object({
  nome: z.string().trim().min(2, "O nome precisa de ao menos 2 letras"),
  descricao: z.string().trim().optional(),
});

export const destinatarioSchema = z.object({
  nome: z.string().trim().min(2, "O nome precisa de ao menos 2 letras"),
  email: z.email("E-mail inválido"),
  orgao: z.string().trim().optional(),
});

const idSelecionado = (mensagem: string) =>
  z.number({ error: mensagem }).int().positive(mensagem);

export const relatorioSchema = z.object({
  titulo: z.string().trim().min(3, "O título precisa de ao menos 3 letras"),
  descricao: z.string().trim().optional(),
  categoriaId: idSelecionado("Selecione uma categoria"),
  destinatarioId: idSelecionado("Selecione um destinatário"),
  arquivo: z.object({
    nome: z.string().trim().min(1, "Informe o nome do arquivo"),
    tipo: z.string().trim().min(1, "Informe o tipo do arquivo"),
    tamanhoKb: z.number({ error: "Informe um número" }).positive("Precisa ser maior que zero"),
  }),
  status: z.enum(["pendente", "enviado"]),
});

export type ErrosForm = Record<string, string>;

// Valida com o Zod e devolve { dados } ou { erros: { "campo": "mensagem" } }
export function validar<T extends z.ZodType>(schema: T, valores: unknown) {
  const resultado = schema.safeParse(valores);
  if (resultado.success) return { dados: resultado.data as z.infer<T>, erros: null };

  const erros: ErrosForm = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path.join(".");
    erros[campo] ??= issue.message;
  }
  return { dados: null, erros };
}

// Texto vazio vira undefined (para campos opcionais)
export const textoOuUndefined = (texto: string) => (texto.trim() === "" ? undefined : texto);
