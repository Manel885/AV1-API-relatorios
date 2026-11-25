// Formatos devolvidos pela API (pasta api/). Campos opcionais vazios não vêm na resposta.

export type Usuario = { id: number; nome: string; email: string; criadoEm?: string };

export type Categoria = { id: number; nome: string; descricao?: string };

export type Destinatario = { id: number; nome: string; email: string; orgao?: string };

export type StatusRelatorio = "pendente" | "enviado";

export type Relatorio = {
  id: number;
  titulo: string;
  descricao?: string;
  status: StatusRelatorio;
  criadoEm: string;
  arquivo: { nome: string; tipo: string; tamanhoKb: number };
  categoriaId: number;
  categoriaNome: string; // vem do JOIN com categorias
  destinatarioId: number;
  destinatarioNome: string; // vem do JOIN com destinatarios
};

export type RespostaLogin = { token: string; usuario: Usuario };
