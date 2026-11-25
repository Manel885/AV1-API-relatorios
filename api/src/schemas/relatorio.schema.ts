import { z } from "zod";

export const statusRelatorio = z.enum(["pendente", "enviado"]);

export const criarRelatorioSchema = z.object({
  titulo: z.string().min(3, "O título precisa de ao menos 3 letras"),
  descricao: z.string().optional(),
  categoriaId: z.number().int().positive(),
  destinatarioId: z.number().int().positive(),
  arquivo: z.object({
    nome: z.string().min(1),
    tipo: z.string().min(1), // ex.: "application/pdf"
    tamanhoKb: z.number().positive(),
  }),
  status: statusRelatorio.default("pendente"),
});

// Filtro da 1ª tela: GET /relatorios?status=pendente
export const listarRelatoriosQuerySchema = z.object({
  status: statusRelatorio.optional(),
});

export type CriarRelatorioDTO = z.infer<typeof criarRelatorioSchema>;
