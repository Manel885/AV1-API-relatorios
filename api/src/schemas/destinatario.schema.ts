import { z } from "zod";

export const criarDestinatarioSchema = z.object({
  nome: z.string().min(2, "O nome precisa de ao menos 2 letras"),
  email: z.email("E-mail inválido"),
  orgao: z.string().optional(),
});

export type CriarDestinatarioDTO = z.infer<typeof criarDestinatarioSchema>;
