# API de Relatórios — Express + TypeScript + Zod + SQLite

Implementação do guia "Construindo uma API em TypeScript (3 CRUDs + Zod)", já rodando sobre **SQLite**.

## Como rodar

```bash
npm install
npm run dev        # servidor com reinício automático em http://localhost:3000
```

O banco é criado sozinho em `data/relatorios.db` na primeira execução. Para usar outro caminho: `DB_PATH=/caminho/x.db`. Porta: `PORT=4000`.

## Documentação Swagger

Com o servidor rodando:

- **Interface interativa:** http://localhost:3000/docs
- **Documento OpenAPI (JSON):** http://localhost:3000/docs.json (serve para importar no Postman, Insomnia etc.)

Para testar pela interface: abra uma rota, clique em **Try it out** e depois em **Execute**. Os corpos de exemplo já vêm preenchidos.
Ordem sugerida: `POST /categorias` → `POST /destinatarios` → `POST /relatorios`. O exemplo do relatório usa `categoriaId: 1` e `destinatarioId: 1`, que existem se você criou esses dois primeiro num banco novo.

A documentação é **gerada a partir dos schemas Zod** (`z.toJSONSchema`, em `src/docs/openapi.ts`). As regras que validam a API (mínimo de letras, e-mail, enum...) são as mesmas que aparecem no Swagger: alterou um schema, a documentação acompanha. Para uma rota nova, basta chamar `crud({...})` com os dados do recurso.

## As 3 CRUDs → rotas

| CRUD | Rota |
|------|------|
| 1º — lista de relatórios a enviar | `GET /relatorios?status=pendente` |
| 2º — adicionar relatório + arquivo | `POST /relatorios` |
| 3º — atualizar um registro | `PUT /relatorios/:id` |

Os 3 CRUDs (`/relatorios`, `/categorias`, `/destinatarios`) têm os cinco verbos: `GET`, `GET /:id`, `POST`, `PUT /:id`, `DELETE /:id`.

## Estrutura

```
src/
  app.ts  server.ts
  database/db.ts            ← abre o SQLite e cria as tabelas
  schemas/                  ← regras Zod (+ tipos via z.infer)
  repositories/             ← camada  SQL
  services/                 ← regras de negócio
  controllers/              ← HTTP (recebe/responde)
  routes/                   ← mapa dos verbos → função
  middlewares/              ← validação (Zod) e erro (tratador central)
  docs/openapi.ts           ← documento OpenAPI gerado dos schemas Zod (Swagger)
  errors/ErroHttp.ts  utils/lerId.ts
scripts/smoke.ts            ← teste das 3 CRUDs
requests.http               ← requisições prontas (extensão REST Client do VS Code) => exemplos
```

