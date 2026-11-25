import { z } from "zod";

export const criarCategoriaSchema = z.object({
  nome: z.string().min(2, "O nome precisa de ao menos 2 letras"),
  descricao: z.string().optional(),
});

export type CriarCategoriaDTO = z.infer<typeof criarCategoriaSchema>;
