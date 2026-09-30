import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const caminho = process.env.DB_PATH ?? path.join(process.cwd(), "data", "relatorios.db");

if (caminho !== ":memory:") {
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
}

export const db = new Database(caminho);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS categorias (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT NOT NULL,
    descricao TEXT
  );

  CREATE TABLE IF NOT EXISTS destinatarios (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    nome  TEXT NOT NULL,
    email TEXT NOT NULL,
    orgao TEXT
  );

  CREATE TABLE IF NOT EXISTS relatorios (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo             TEXT NOT NULL,
    descricao          TEXT,
    categoria_id       INTEGER NOT NULL REFERENCES categorias(id)    ON DELETE RESTRICT,
    destinatario_id    INTEGER NOT NULL REFERENCES destinatarios(id) ON DELETE RESTRICT,
    arquivo_nome       TEXT NOT NULL,
    arquivo_tipo       TEXT NOT NULL,
    arquivo_tamanho_kb REAL NOT NULL,
    status             TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado')),
    criado_em          TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
