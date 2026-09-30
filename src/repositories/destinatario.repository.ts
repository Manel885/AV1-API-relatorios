import { db } from "../database/db";
import type { CriarDestinatarioDTO } from "../schemas/destinatario.schema";

export type Destinatario = CriarDestinatarioDTO & { id: number };

type Linha = { id: number; nome: string; email: string; orgao: string | null };

const paraDestinatario = (l: Linha): Destinatario => ({
  id: l.id,
  nome: l.nome,
  email: l.email,
  orgao: l.orgao ?? undefined,
});

const stmtListar = db.prepare("SELECT * FROM destinatarios ORDER BY id");
const stmtBuscar = db.prepare("SELECT * FROM destinatarios WHERE id = ?");
const stmtCriar = db.prepare("INSERT INTO destinatarios (nome, email, orgao) VALUES (?, ?, ?)");
const stmtAtualizar = db.prepare(
  "UPDATE destinatarios SET nome = ?, email = ?, orgao = ? WHERE id = ?",
);
const stmtRemover = db.prepare("DELETE FROM destinatarios WHERE id = ?");

export const destinatarioRepository = {
  listar: (): Destinatario[] => (stmtListar.all() as Linha[]).map(paraDestinatario),

  buscarPorId: (id: number): Destinatario | undefined => {
    const linha = stmtBuscar.get(id) as Linha | undefined;
    return linha && paraDestinatario(linha);
  },

  criar: (dados: CriarDestinatarioDTO): Destinatario => {
    const info = stmtCriar.run(dados.nome, dados.email, dados.orgao ?? null);
    return destinatarioRepository.buscarPorId(Number(info.lastInsertRowid))!;
  },

  atualizar: (id: number, dados: CriarDestinatarioDTO): Destinatario | undefined => {
    const info = stmtAtualizar.run(dados.nome, dados.email, dados.orgao ?? null, id);
    if (info.changes === 0) return undefined;
    return destinatarioRepository.buscarPorId(id);
  },

  remover: (id: number): boolean => stmtRemover.run(id).changes > 0,
};
