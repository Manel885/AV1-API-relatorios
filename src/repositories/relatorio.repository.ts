import { db } from "../database/db";
import type { CriarRelatorioDTO } from "../schemas/relatorio.schema";

// O que a API devolve: o DTO + id + dados extras úteis para o 1ª CRUD
export type Relatorio = CriarRelatorioDTO & {
  id: number;
  categoriaNome: string;
  destinatarioNome: string;
  criadoEm: string;
};

type Linha = {
  id: number;
  titulo: string;
  descricao: string | null;
  categoria_id: number;
  destinatario_id: number;
  arquivo_nome: string;
  arquivo_tipo: string;
  arquivo_tamanho_kb: number;
  status: "pendente" | "enviado";
  criado_em: string;
  categoria_nome: string;
  destinatario_nome: string;
};

const paraRelatorio = (l: Linha): Relatorio => ({
  id: l.id,
  titulo: l.titulo,
  descricao: l.descricao ?? undefined,
  categoriaId: l.categoria_id,
  categoriaNome: l.categoria_nome,
  destinatarioId: l.destinatario_id,
  destinatarioNome: l.destinatario_nome,
  arquivo: { nome: l.arquivo_nome, tipo: l.arquivo_tipo, tamanhoKb: l.arquivo_tamanho_kb },
  status: l.status,
  criadoEm: l.criado_em,
});

// JOIN: traz o nome da categoria e do destinatário junto, sem 2 consultas extras
const SELECT_BASE = `
  SELECT r.*, c.nome AS categoria_nome, d.nome AS destinatario_nome
  FROM relatorios r
  JOIN categorias c    ON c.id = r.categoria_id
  JOIN destinatarios d ON d.id = r.destinatario_id
`;

const stmtListar = db.prepare(`${SELECT_BASE} ORDER BY r.id`);
const stmtListarPorStatus = db.prepare(`${SELECT_BASE} WHERE r.status = ? ORDER BY r.id`);
const stmtBuscar = db.prepare(`${SELECT_BASE} WHERE r.id = ?`);
const stmtCriar = db.prepare(`
  INSERT INTO relatorios
    (titulo, descricao, categoria_id, destinatario_id, arquivo_nome, arquivo_tipo, arquivo_tamanho_kb, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const stmtAtualizar = db.prepare(`
  UPDATE relatorios SET
    titulo = ?, descricao = ?, categoria_id = ?, destinatario_id = ?,
    arquivo_nome = ?, arquivo_tipo = ?, arquivo_tamanho_kb = ?, status = ?
  WHERE id = ?
`);
const stmtRemover = db.prepare("DELETE FROM relatorios WHERE id = ?");
const stmtContarPorCategoria = db.prepare(
  "SELECT COUNT(*) AS total FROM relatorios WHERE categoria_id = ?",
);
const stmtContarPorDestinatario = db.prepare(
  "SELECT COUNT(*) AS total FROM relatorios WHERE destinatario_id = ?",
);

const valores = (d: CriarRelatorioDTO) =>
  [
    d.titulo,
    d.descricao ?? null,
    d.categoriaId,
    d.destinatarioId,
    d.arquivo.nome,
    d.arquivo.tipo,
    d.arquivo.tamanhoKb,
    d.status,
  ] as const;

export const relatorioRepository = {
  listar: (status?: "pendente" | "enviado"): Relatorio[] => {
    const linhas = (status ? stmtListarPorStatus.all(status) : stmtListar.all()) as Linha[];
    return linhas.map(paraRelatorio);
  },

  buscarPorId: (id: number): Relatorio | undefined => {
    const linha = stmtBuscar.get(id) as Linha | undefined;
    return linha && paraRelatorio(linha);
  },

  criar: (dados: CriarRelatorioDTO): Relatorio => {
    const info = stmtCriar.run(...valores(dados));
    return relatorioRepository.buscarPorId(Number(info.lastInsertRowid))!;
  },

  atualizar: (id: number, dados: CriarRelatorioDTO): Relatorio | undefined => {
    const info = stmtAtualizar.run(...valores(dados), id);
    if (info.changes === 0) return undefined;
    return relatorioRepository.buscarPorId(id);
  },

  remover: (id: number): boolean => stmtRemover.run(id).changes > 0,

  contarPorCategoria: (categoriaId: number): number =>
    (stmtContarPorCategoria.get(categoriaId) as { total: number }).total,

  contarPorDestinatario: (destinatarioId: number): number =>
    (stmtContarPorDestinatario.get(destinatarioId) as { total: number }).total,
};
