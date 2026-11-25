import { z } from "zod";

export const criarUsuarioSchema = z.object({
  nome: z.string().min(3, "O nome precisa de ao menos 3 letras"),
  email: z.email("E-mail inválido"),
  senha: z.string().min(6, "A senha precisa de ao menos 6 caracteres"),
});

// PUT: nome e e-mail obrigatórios; senha opcional (sem senha = mantém a atual)
export const atualizarUsuarioSchema = criarUsuarioSchema.extend({
  senha: criarUsuarioSchema.shape.senha.optional(),
});

export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export type CriarUsuarioDTO = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioDTO = z.infer<typeof atualizarUsuarioSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
