// Teste de ponta a ponta: autenticação JWT, as 3 telas, os 4 CRUDs e casos de erro.
// Uso: com o servidor rodando (npm run dev), execute:  npm run smoke
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

let token: string | null = null; // preenchido depois do registro

async function chamar(metodo: string, caminho: string, corpo?: unknown) {
  const resp = await fetch(BASE + caminho, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resp.text();
  return { status: resp.status, dados: texto ? JSON.parse(texto) : null };
}

let passos = 0;
function ok(descricao: string) {
  passos++;
  console.log(`  ✔ ${String(passos).padStart(2, "0")} ${descricao}`);
}

async function main() {
  console.log(`\nTestando ${BASE}\n`);

  // --- Autenticação (JWT) ---
  assert.equal((await chamar("GET", "/categorias")).status, 401);
  ok("GET /categorias sem token → 401");

  const email = `smoke${Date.now()}@teste.com`;
  const registro = await chamar("POST", "/auth/registrar", {
    nome: "Teste Smoke",
    email,
    senha: "123456",
  });
  assert.equal(registro.status, 201);
  assert.ok(registro.dados.token);
  assert.equal(registro.dados.usuario.senha, undefined); // a senha nunca volta
  ok("POST /auth/registrar → 201 com token");

  assert.equal((await chamar("POST", "/auth/registrar", { nome: "X", email: "x", senha: "1" })).status, 400);
  ok("POST /auth/registrar inválido → 400");

  assert.equal((await chamar("POST", "/auth/login", { email, senha: "errada" })).status, 401);
  ok("POST /auth/login com senha errada → 401");

  const login = await chamar("POST", "/auth/login", { email, senha: "123456" });
  assert.equal(login.status, 200);
  token = login.dados.token;
  ok("POST /auth/login → 200 com token");

  const eu = await chamar("GET", "/auth/me");
  assert.equal(eu.dados.email, email);
  ok("GET /auth/me → dono do token");

  const tokenValido = token;
  token = "token-falso";
  assert.equal((await chamar("GET", "/relatorios")).status, 401);
  token = tokenValido;
  ok("Token inválido → 401");

  // --- 4º CRUD: usuários ---
  const outro = await chamar("POST", "/usuarios", {
    nome: "Outro Usuário",
    email: `outro${Date.now()}@teste.com`,
    senha: "abcdef",
  });
  assert.equal(outro.status, 201);
  ok("POST /usuarios → 201");

  assert.equal((await chamar("POST", "/usuarios", { nome: "Repetido", email, senha: "123456" })).status, 409);
  ok("POST /usuarios com e-mail repetido → 409");

  const outroAtual = await chamar("PUT", `/usuarios/${outro.dados.id}`, {
    nome: "Outro (editado)",
    email: outro.dados.email,
  });
  assert.equal(outroAtual.status, 200);
  assert.equal(outroAtual.dados.nome, "Outro (editado)");
  ok("PUT /usuarios/:id sem senha → 200 (mantém a senha)");

  const usuarios = await chamar("GET", "/usuarios");
  assert.ok(usuarios.dados.some((u: { id: number }) => u.id === outro.dados.id));
  assert.equal((await chamar("GET", `/usuarios/${outro.dados.id}`)).status, 200);
  ok("GET /usuarios e GET /usuarios/:id → 200");

  assert.equal((await chamar("DELETE", `/usuarios/${login.dados.usuario.id}`)).status, 409);
  ok("DELETE do próprio usuário → 409");

  assert.equal((await chamar("DELETE", `/usuarios/${outro.dados.id}`)).status, 204);
  ok("DELETE /usuarios/:id → 204");

  // --- Preparação: categoria e destinatário ---
  const cat = await chamar("POST", "/categorias", { nome: "Financeiro", descricao: "Balanços" });
  assert.equal(cat.status, 201);
  ok("POST /categorias → 201");

  const dest = await chamar("POST", "/destinatarios", {
    nome: "Tribunal de Contas",
    email: "contato@tc.gov.br",
    orgao: "TCE",
  });
  assert.equal(dest.status, 201);
  ok("POST /destinatarios → 201");

  // --- Zod barrando dados inválidos ---
  const destRuim = await chamar("POST", "/destinatarios", { nome: "X", email: "nao-e-email" });
  assert.equal(destRuim.status, 400);
  assert.ok(destRuim.dados.erros.length >= 2);
  ok("POST /destinatarios inválido → 400 com lista de erros do Zod");

  // --- 2ª tela: adicionar relatório + arquivo ---
  const relatorio = {
    titulo: "Balanço Anual",
    descricao: "Exercício 2025",
    categoriaId: cat.dados.id,
    destinatarioId: dest.dados.id,
    arquivo: { nome: "balanco.pdf", tipo: "application/pdf", tamanhoKb: 320 },
  };
  const criado = await chamar("POST", "/relatorios", relatorio);
  assert.equal(criado.status, 201);
  assert.equal(criado.dados.status, "pendente"); // default do Zod
  assert.equal(criado.dados.categoriaNome, "Financeiro"); // JOIN do SQLite
  assert.equal(criado.dados.arquivo.nome, "balanco.pdf");
  ok("POST /relatorios → 201 (status 'pendente' por default, nomes vindos do JOIN)");

  const id = criado.dados.id;

  const invalido = await chamar("POST", "/relatorios", { titulo: "oi", categoriaId: -5 });
  assert.equal(invalido.status, 400);
  ok("POST /relatorios inválido → 400");

  const semCategoria = await chamar("POST", "/relatorios", { ...relatorio, categoriaId: 9999 });
  assert.equal(semCategoria.status, 400);
  ok("POST /relatorios com categoriaId inexistente → 400");

  // --- 1ª tela: listar relatórios a enviar ---
  const pendentes = await chamar("GET", "/relatorios?status=pendente");
  assert.equal(pendentes.status, 200);
  assert.ok(pendentes.dados.some((r: { id: number }) => r.id === id));
  ok("GET /relatorios?status=pendente → lista contém o relatório");

  const filtroRuim = await chamar("GET", "/relatorios?status=qualquer");
  assert.equal(filtroRuim.status, 400);
  ok("GET /relatorios?status=qualquer → 400");

  // --- GET /:id ---
  const um = await chamar("GET", `/relatorios/${id}`);
  assert.equal(um.status, 200);
  assert.equal(um.dados.titulo, "Balanço Anual");
  ok("GET /relatorios/:id → 200");

  assert.equal((await chamar("GET", "/relatorios/999999")).status, 404);
  ok("GET /relatorios/999999 → 404");

  assert.equal((await chamar("GET", "/relatorios/abc")).status, 400);
  ok("GET /relatorios/abc → 400 (id inválido)");

  // --- 3ª tela: atualizar registro ---
  const atualizado = await chamar("PUT", `/relatorios/${id}`, {
    ...relatorio,
    titulo: "Balanço Anual (revisado)",
    arquivo: { nome: "balanco_v2.pdf", tipo: "application/pdf", tamanhoKb: 410 },
    status: "enviado",
  });
  assert.equal(atualizado.status, 200);
  assert.equal(atualizado.dados.status, "enviado");
  assert.equal(atualizado.dados.arquivo.nome, "balanco_v2.pdf");
  ok("PUT /relatorios/:id → 200 (status 'enviado', arquivo trocado)");

  assert.equal((await chamar("PUT", "/relatorios/999999", relatorio)).status, 404);
  ok("PUT /relatorios/999999 → 404");

  const aindaPendentes = await chamar("GET", "/relatorios?status=pendente");
  assert.ok(!aindaPendentes.dados.some((r: { id: number }) => r.id === id));
  ok("Relatório enviado saiu da lista de pendentes");

  // --- Regra de negócio: categoria em uso não pode ser apagada ---
  assert.equal((await chamar("DELETE", `/categorias/${cat.dados.id}`)).status, 409);
  ok("DELETE /categorias/:id em uso → 409");
  assert.equal((await chamar("DELETE", `/destinatarios/${dest.dados.id}`)).status, 409);
  ok("DELETE /destinatarios/:id em uso → 409");

  // --- CRUD completo de categorias e destinatários (PUT / GET :id) ---
  const catAtual = await chamar("PUT", `/categorias/${cat.dados.id}`, { nome: "Financeiro 2" });
  assert.equal(catAtual.status, 200);
  assert.equal(catAtual.dados.nome, "Financeiro 2");
  ok("PUT /categorias/:id → 200");

  const destAtual = await chamar("PUT", `/destinatarios/${dest.dados.id}`, {
    nome: "TCE-RJ",
    email: "tce@rj.gov.br",
  });
  assert.equal(destAtual.status, 200);
  assert.equal((await chamar("GET", `/destinatarios/${dest.dados.id}`)).dados.nome, "TCE-RJ");
  ok("PUT + GET /destinatarios/:id → 200");

  // --- Limpeza: DELETE em ordem (relatório primeiro, depois os vínculos) ---
  assert.equal((await chamar("DELETE", `/relatorios/${id}`)).status, 204);
  ok("DELETE /relatorios/:id → 204");
  assert.equal((await chamar("GET", `/relatorios/${id}`)).status, 404);
  ok("GET do relatório apagado → 404");

  assert.equal((await chamar("DELETE", `/categorias/${cat.dados.id}`)).status, 204);
  assert.equal((await chamar("DELETE", `/destinatarios/${dest.dados.id}`)).status, 204);
  ok("DELETE /categorias e /destinatarios livres → 204");

  // --- Documentação Swagger ---
  const docs = await chamar("GET", "/docs.json");
  assert.equal(docs.status, 200);
  assert.ok(String(docs.dados.openapi).startsWith("3."));
  assert.ok(Object.keys(docs.dados.paths).length >= 12);
  ok("GET /docs.json → documento OpenAPI com as rotas");

  const ui = await fetch(BASE + "/docs/");
  assert.equal(ui.status, 200);
  assert.ok((await ui.text()).includes("swagger-ui"));
  ok("GET /docs/ → interface Swagger UI");

  // --- Rota inexistente ---
  assert.equal((await chamar("GET", "/nada")).status, 404);
  ok("Rota inexistente → 404");

  console.log(`\n🎉 ${passos} verificações passaram.\n`);
}

main().catch((erro) => {
  console.error("\n❌ Falhou:", erro.message ?? erro);
  process.exit(1);
});
