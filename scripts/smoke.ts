// Teste de ponta a ponta: simula as 3 telas + casos de erro.
// Uso: com o servidor rodando (npm run dev), execute:  npm run smoke
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function chamar(metodo: string, caminho: string, corpo?: unknown) {
  const resp = await fetch(BASE + caminho, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
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
  assert.ok(Object.keys(docs.dados.paths).length >= 7);
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
