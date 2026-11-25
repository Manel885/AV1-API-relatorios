import { db } from "../database/db";

// O que a API devolve: nunca inclui o hash da senha
export type Usuario = { id: number; nome: string; email: string; criadoEm: string };

type Linha = { id: number; nome: string; email: string; senha_hash: string; criado_em: string };

const paraUsuario = (l: Linha): Usuario => ({
  id: l.id,
  nome: l.nome,
  email: l.email,
  criadoEm: l.criado_em,
});

const stmtListar = db.prepare("SELECT * FROM usuarios ORDER BY id");
const stmtBuscar = db.prepare("SELECT * FROM usuarios WHERE id = ?");
const stmtBuscarPorEmail = db.prepare("SELECT * FROM usuarios WHERE email = ?");
const stmtCriar = db.prepare("INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)");
const stmtAtualizar = db.prepare(
  "UPDATE usuarios SET nome = ?, email = ?, senha_hash = ? WHERE id = ?",
);
const stmtRemover = db.prepare("DELETE FROM usuarios WHERE id = ?");

export const usuarioRepository = {
  listar: (): Usuario[] => (stmtListar.all() as Linha[]).map(paraUsuario),

  buscarPorId: (id: number): Usuario | undefined => {
    const linha = stmtBuscar.get(id) as Linha | undefined;
    return linha && paraUsuario(linha);
  },

  // Usado só no login e nas checagens: devolve a linha completa (com o hash)
  buscarPorEmailComSenha: (email: string): Linha | undefined =>
    stmtBuscarPorEmail.get(email) as Linha | undefined,

  buscarHashDaSenha: (id: number): string | undefined =>
    (stmtBuscar.get(id) as Linha | undefined)?.senha_hash,

  criar: (nome: string, email: string, senhaHash: string): Usuario => {
    const info = stmtCriar.run(nome, email, senhaHash);
    return usuarioRepository.buscarPorId(Number(info.lastInsertRowid))!;
  },

  atualizar: (id: number, nome: string, email: string, senhaHash: string): Usuario | undefined => {
    const info = stmtAtualizar.run(nome, email, senhaHash, id);
    if (info.changes === 0) return undefined;
    return usuarioRepository.buscarPorId(id);
  },

  remover: (id: number): boolean => stmtRemover.run(id).changes > 0,
};
