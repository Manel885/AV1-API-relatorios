import { db } from "../database/db";
import type { CriarCategoriaDTO } from "../schemas/categoria.schema";

export type Categoria = CriarCategoriaDTO & { id: number };

type Linha = { id: number; nome: string; descricao: string | null };

const paraCategoria = (l: Linha): Categoria => ({
  id: l.id,
  nome: l.nome,
  descricao: l.descricao ?? undefined,
});

const stmtListar = db.prepare("SELECT * FROM categorias ORDER BY id");
const stmtBuscar = db.prepare("SELECT * FROM categorias WHERE id = ?");
const stmtCriar = db.prepare("INSERT INTO categorias (nome, descricao) VALUES (?, ?)");
const stmtAtualizar = db.prepare("UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?");
const stmtRemover = db.prepare("DELETE FROM categorias WHERE id = ?");

export const categoriaRepository = {
  listar: (): Categoria[] => (stmtListar.all() as Linha[]).map(paraCategoria),

  buscarPorId: (id: number): Categoria | undefined => {
    const linha = stmtBuscar.get(id) as Linha | undefined;
    return linha && paraCategoria(linha);
  },

  criar: (dados: CriarCategoriaDTO): Categoria => {
    const info = stmtCriar.run(dados.nome, dados.descricao ?? null);
    return categoriaRepository.buscarPorId(Number(info.lastInsertRowid))!;
  },

  atualizar: (id: number, dados: CriarCategoriaDTO): Categoria | undefined => {
    const info = stmtAtualizar.run(dados.nome, dados.descricao ?? null, id);
    if (info.changes === 0) return undefined; // nenhuma linha afetada = id não existe
    return categoriaRepository.buscarPorId(id);
  },

  remover: (id: number): boolean => stmtRemover.run(id).changes > 0,
};
