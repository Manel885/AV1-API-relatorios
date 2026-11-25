# API de Relatórios — Express + TypeScript + Zod + SQLite + JWT

Implementação do guia "Construindo uma API em TypeScript (CRUDs + Zod)", rodando sobre **SQLite**, com **4 CRUDs** e **autenticação JWT**.
O aplicativo que consome esta API fica em [`../mobile`](../mobile).

## Como rodar

```bash
npm install
copy .env.example .env   # (Linux/Mac: cp .env.example .env) e troque o JWT_SECRET
npm run dev              # servidor com reinício automático em http://localhost:3000
```

O banco é criado sozinho em `data/relatorios.db` na primeira execução.
Configurações no `.env`: `PORT`, `DB_PATH`, `JWT_SECRET` e `JWT_EXPIRA_EM` (ex.: `1d`, `8h`).

Teste automático de ponta a ponta (com o servidor rodando): `npm run smoke`.

## Autenticação (JWT)

1. `POST /auth/registrar` com `{ nome, email, senha }` **ou** `POST /auth/login` com `{ email, senha }`.
2. A resposta traz `{ token, usuario }`.
3. Envie o token nas demais rotas: `Authorization: Bearer <token>`.

Sem token, ou com token inválido/expirado → `401`. As senhas são salvas com hash (bcrypt) e nunca são devolvidas.
Rotas públicas: `GET /`, `/docs`, `/docs.json`, `POST /auth/registrar` e `POST /auth/login`.

## Documentação Swagger

Com o servidor rodando:

- **Interface interativa:** http://localhost:3000/docs
- **Documento OpenAPI (JSON):** http://localhost:3000/docs.json (serve para importar no Postman, Insomnia etc.)

Para testar pela interface: execute `POST /auth/registrar`, copie o `token`, clique em **Authorize** (cadeado) e cole o token. Depois abra uma rota, clique em **Try it out** e em **Execute**.
Ordem sugerida: `POST /categorias` → `POST /destinatarios` → `POST /relatorios`.

A documentação é **gerada a partir dos schemas Zod** (`z.toJSONSchema`, em `src/docs/openapi.ts`): alterou um schema, a documentação acompanha. Para uma rota nova, basta chamar `crud({...})` com os dados do recurso.

## Os 4 CRUDs → rotas

| CRUD | Rotas |
|------|------|
| Relatórios | `GET /relatorios?status=pendente` · `GET /relatorios/:id` · `POST /relatorios` · `PUT /relatorios/:id` · `DELETE /relatorios/:id` |
| Categorias | `GET /categorias` · `GET /categorias/:id` · `POST /categorias` · `PUT /categorias/:id` · `DELETE /categorias/:id` |
| Destinatários | `GET /destinatarios` · `GET /destinatarios/:id` · `POST /destinatarios` · `PUT /destinatarios/:id` · `DELETE /destinatarios/:id` |
| Usuários | `GET /usuarios` · `GET /usuarios/:id` · `POST /usuarios` · `PUT /usuarios/:id` · `DELETE /usuarios/:id` |

Telas do app ligadas aos relatórios:

| Tela | Rota |
|------|------|
| 1ª — lista de relatórios a enviar | `GET /relatorios?status=pendente` |
| 2ª — adicionar relatório + arquivo | `POST /relatorios` |
| 3ª — atualizar um registro | `PUT /relatorios/:id` |

### Regras de negócio

- **Relação:** todo relatório pertence a uma categoria e a um destinatário. `categoriaId`/`destinatarioId` inexistente → `400`.
- Categoria ou destinatário com relatórios vinculados não pode ser excluído → `409`.
- E-mail de usuário repetido → `409`. O usuário logado não pode excluir a própria conta → `409`.
- `PUT` substitui todos os campos. Em usuários a `senha` é opcional no `PUT` (sem senha = mantém a atual).
- Dados inválidos → `400` com a lista de erros do Zod (`{ erros: [...] }`).

## Estrutura

```
src/
  app.ts  server.ts  config.ts   ← config.ts carrega o .env
  database/db.ts            ← abre o SQLite e cria as tabelas
  schemas/                  ← regras Zod (+ tipos via z.infer)
  repositories/             ← camada SQL
  services/                 ← regras de negócio (auth.service gera/verifica o JWT)
  controllers/              ← HTTP (recebe/responde)
  routes/                   ← mapa dos verbos → função
  middlewares/              ← validação (Zod), autenticação (JWT) e erro (tratador central)
  docs/openapi.ts           ← documento OpenAPI gerado dos schemas Zod (Swagger)
  errors/ErroHttp.ts  utils/lerId.ts
scripts/smoke.ts            ← teste de ponta a ponta (auth + 4 CRUDs)
requests.http               ← requisições prontas (extensão REST Client do VS Code)
```
