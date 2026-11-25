import { z } from "zod";
import { criarCategoriaSchema } from "../schemas/categoria.schema";
import { criarDestinatarioSchema } from "../schemas/destinatario.schema";
import { criarRelatorioSchema, statusRelatorio } from "../schemas/relatorio.schema";
import {
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  loginSchema,
} from "../schemas/usuario.schema";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function limpar(no: any): any {
  if (Array.isArray(no)) return no.map(limpar);
  if (no && typeof no === "object") {
    const saida: Json = {};
    for (const [chave, valor] of Object.entries(no)) {
      if (chave === "pattern" && no.format === "email") continue;
      if (chave === "maximum" && valor === Number.MAX_SAFE_INTEGER) continue;
      saida[chave] = limpar(valor);
    }
    return saida;
  }
  return no;
}

// "input" = o que a API RECEBE (campos com default ficam opcionais)
// "output" = o que a API DEVOLVE (campos com default sempre presentes)
const paraOpenApi = (schema: z.ZodType, io: "input" | "output") =>
  limpar(z.toJSONSchema(schema, { target: "openapi-3.0", io }));

// ---------- Schemas de resposta (o que a API devolve) ----------
const categoriaSaida = criarCategoriaSchema.extend({ id: z.number().int() });
const destinatarioSaida = criarDestinatarioSchema.extend({ id: z.number().int() });
const relatorioSaida = criarRelatorioSchema.extend({
  id: z.number().int(),
  categoriaNome: z.string(),
  destinatarioNome: z.string(),
  criadoEm: z.string().describe("Data/hora de criação (UTC), ex.: 2026-09-30 14:05:00"),
});
// Usuário devolvido pela API: sem a senha
const usuarioSaida = criarUsuarioSchema.omit({ senha: true }).extend({
  id: z.number().int(),
  criadoEm: z.string(),
});

const ref = (nome: string) => ({ $ref: `#/components/schemas/${nome}` });
const refResposta = (nome: string) => ({ $ref: `#/components/responses/${nome}` });
const json = (schema: Json, example?: unknown) => ({
  "application/json": { schema, ...(example !== undefined && { example }) },
});

// ---------- Fábrica de rotas: os 4 CRUDs têm o MESMO formato ----------
type Recurso = {
  tag: string; // agrupador no Swagger
  caminho: string; // "/categorias"
  um: "um" | "uma"; // para os textos ("Cria uma categoria")
  singular: string; // "categoria"
  plural: string; // "categorias"
  nomeId: string; // "Categoria" (usado em operationId, sem acento)
  entrada: string; // nome do schema de entrada em components
  entradaPut?: string; // schema do PUT, quando for diferente do POST
  saida: string; // nome do schema de saída em components
  exemplo: Json; // corpo de exemplo para o "Try it out"
  descricaoLista?: string;
  descricaoCriar?: string;
  descricaoAtualizar?: string;
  parametrosLista?: Json[];
  erro400Vinculo?: boolean; // POST/PUT podem dar 400 por categoriaId/destinatarioId inexistente
  conflitoNoDelete?: string; // DELETE pode dar 409
  conflitoNoSalvar?: boolean; // POST/PUT podem dar 409 (ex.: e-mail repetido)
};

// Toda rota dos CRUDs exige token: 401 se faltar ou for inválido
const resposta401 = { "401": { $ref: "#/components/responses/NaoAutorizado401" } };

function crud(r: Recurso): Json {
  const parametroId = {
    name: "id",
    in: "path",
    required: true,
    description: `ID numérico d${r.um === "um" ? "o" : "a"} ${r.singular}`,
    schema: { type: "integer", minimum: 1 },
    example: 1,
  };

  const corpo = {
    required: true,
    content: json(ref(r.entrada), r.exemplo),
  };
  const corpoPut = r.entradaPut
    ? { required: true, content: json(ref(r.entradaPut), r.exemplo) }
    : corpo;
  const resposta409Salvar = r.conflitoNoSalvar && { "409": refResposta("Conflito409") };

  const desc400Vinculo = r.erro400Vinculo
    ? " Também retorna 400 se `categoriaId` ou `destinatarioId` não existirem."
    : "";

  return {
    [r.caminho]: {
      get: {
        tags: [r.tag],
        operationId: `listar${r.nomeId}s`,
        summary: `Lista ${r.plural}`,
        description: r.descricaoLista,
        ...(r.parametrosLista && { parameters: r.parametrosLista }),
        responses: {
          "200": {
            description: `Lista de ${r.plural}`,
            content: json({ type: "array", items: ref(r.saida) }),
          },
          ...(r.parametrosLista && { "400": refResposta("Erro400") }),
          ...resposta401,
        },
      },
      post: {
        tags: [r.tag],
        operationId: `criar${r.nomeId}`,
        summary: `Cria ${r.um} ${r.singular}`,
        description: (r.descricaoCriar ?? "") + desc400Vinculo || undefined,
        requestBody: corpo,
        responses: {
          "201": {
            description: `${r.singular[0].toUpperCase()}${r.singular.slice(1)} criad${r.um === "um" ? "o" : "a"}`,
            content: json(ref(r.saida)),
          },
          "400": refResposta("Erro400"),
          ...resposta401,
          ...resposta409Salvar,
        },
      },
    },
    [`${r.caminho}/{id}`]: {
      get: {
        tags: [r.tag],
        operationId: `buscar${r.nomeId}`,
        summary: `Busca ${r.um} ${r.singular} pelo id`,
        parameters: [parametroId],
        responses: {
          "200": { description: "Encontrado", content: json(ref(r.saida)) },
          "400": refResposta("Erro400"),
          ...resposta401,
          "404": refResposta("NaoEncontrado404"),
        },
      },
      put: {
        tags: [r.tag],
        operationId: `atualizar${r.nomeId}`,
        summary: `Atualiza ${r.um} ${r.singular}`,
        description:
          `Substitui **todos** os campos (é um PUT completo, não parcial). ${r.descricaoAtualizar ?? ""}${desc400Vinculo}`.trim(),
        parameters: [parametroId],
        requestBody: corpoPut,
        responses: {
          "200": { description: "Atualizado", content: json(ref(r.saida)) },
          "400": refResposta("Erro400"),
          ...resposta401,
          "404": refResposta("NaoEncontrado404"),
          ...resposta409Salvar,
        },
      },
      delete: {
        tags: [r.tag],
        operationId: `remover${r.nomeId}`,
        summary: `Remove ${r.um} ${r.singular}`,
        parameters: [parametroId],
        responses: {
          "204": { description: "Removido com sucesso (sem corpo na resposta)" },
          "400": refResposta("Erro400"),
          ...resposta401,
          "404": refResposta("NaoEncontrado404"),
          ...(r.conflitoNoDelete && { "409": refResposta("Conflito409") }),
        },
      },
    },
  };
}

// ---------- O documento OpenAPI ----------
export const openApiDocument: Json = {
  openapi: "3.0.3",
  info: {
    title: "API de Relatórios",
    version: "1.0.0",
    description: [
      "API para gerenciar **relatórios a enviar**, suas **categorias** e **destinatários**.",
      "",
      "Fluxo das telas do aplicativo:",
      "1. **Lista de relatórios a enviar** → `GET /relatorios?status=pendente`",
      "2. **Adicionar relatório + arquivo** → `POST /relatorios`",
      "3. **Atualizar um registro** → `PUT /relatorios/{id}`",
      "",
      "Antes de criar um relatório, crie ao menos uma categoria e um destinatário.",
      "O arquivo é registrado por seus metadados (nome, tipo, tamanho).",
      "",
      "**Autenticação (JWT):** crie uma conta em `POST /auth/registrar` ou entre em `POST /auth/login`,",
      "copie o `token` da resposta, clique em **Authorize** (cadeado) e cole o token.",
      "Todas as rotas dos CRUDs exigem o cabeçalho `Authorization: Bearer <token>`.",
    ].join("\n"),
  },
  servers: [{ url: "/", description: "Servidor atual" }],
  // Por padrão toda rota exige token; as públicas sobrescrevem com security: []
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Sistema", description: "Verificação de disponibilidade" },
    { name: "Autenticação", description: "Cadastro, login e token JWT" },
    { name: "Usuários", description: "Contas com acesso ao sistema" },
    { name: "Relatórios", description: "Registro principal: um arquivo a enviar a um destinatário" },
    { name: "Categorias", description: "Classificam os relatórios" },
    { name: "Destinatários", description: "Para quem cada relatório será enviado" },
  ],
  paths: {
    "/": {
      get: {
        tags: ["Sistema"],
        operationId: "verificarSaude",
        summary: "Verifica se a API está no ar",
        security: [],
        responses: {
          "200": {
            description: "API disponível",
            content: json(
              {
                type: "object",
                properties: { mensagem: { type: "string" }, docs: { type: "string" } },
                required: ["mensagem"],
              },
              { mensagem: "API de relatórios no ar!", docs: "/docs" },
            ),
          },
        },
      },
    },

    "/auth/registrar": {
      post: {
        tags: ["Autenticação"],
        operationId: "registrar",
        summary: "Cria uma conta e devolve o token JWT",
        security: [],
        requestBody: {
          required: true,
          content: json(ref("UsuarioEntrada"), {
            nome: "Maria Silva",
            email: "maria@exemplo.com",
            senha: "123456",
          }),
        },
        responses: {
          "201": { description: "Conta criada", content: json(ref("RespostaLogin")) },
          "400": refResposta("Erro400"),
          "409": refResposta("Conflito409"),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Autenticação"],
        operationId: "login",
        summary: "Entra com e-mail e senha e devolve o token JWT",
        security: [],
        requestBody: {
          required: true,
          content: json(ref("LoginEntrada"), { email: "maria@exemplo.com", senha: "123456" }),
        },
        responses: {
          "200": { description: "Login feito", content: json(ref("RespostaLogin")) },
          "400": refResposta("Erro400"),
          "401": {
            description: "E-mail ou senha inválidos",
            content: json(ref("ErroSimples"), { erro: "E-mail ou senha inválidos" }),
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Autenticação"],
        operationId: "usuarioLogado",
        summary: "Devolve o usuário dono do token",
        responses: {
          "200": {
            description: "Usuário do token",
            content: json({
              type: "object",
              properties: {
                id: { type: "integer" },
                nome: { type: "string" },
                email: { type: "string" },
              },
            }),
          },
          ...resposta401,
        },
      },
    },

    ...crud({
      tag: "Relatórios",
      caminho: "/relatorios",
      um: "um",
      singular: "relatório",
      plural: "relatórios",
      nomeId: "Relatorio",
      entrada: "RelatorioEntrada",
      saida: "Relatorio",
      exemplo: {
        titulo: "Balanço Anual",
        descricao: "Exercício 2025",
        categoriaId: 1,
        destinatarioId: 1,
        arquivo: { nome: "balanco.pdf", tipo: "application/pdf", tamanhoKb: 320 },
        status: "pendente",
      },
      descricaoLista:
        "**1ª tela.** Devolve os relatórios com o nome da categoria e do destinatário já incluídos. " +
        "Use `?status=pendente` para listar só os que ainda faltam enviar.",
      descricaoCriar:
        "**2ª tela.** Cadastra o relatório e os dados do arquivo. Se `status` for omitido, assume `pendente`.",
      descricaoAtualizar: "**3ª tela.** Use para editar dados, trocar o arquivo ou marcar como `enviado`.",
      parametrosLista: [
        {
          name: "status",
          in: "query",
          required: false,
          description: "Filtra pelo status do relatório",
          schema: paraOpenApi(statusRelatorio, "input"),
        },
      ],
      erro400Vinculo: true,
    }),

    ...crud({
      tag: "Categorias",
      caminho: "/categorias",
      um: "uma",
      singular: "categoria",
      plural: "categorias",
      nomeId: "Categoria",
      entrada: "CategoriaEntrada",
      saida: "Categoria",
      exemplo: { nome: "Financeiro", descricao: "Balanços e prestações de contas" },
      conflitoNoDelete: "Categoria com relatórios vinculados não pode ser removida",
    }),

    ...crud({
      tag: "Destinatários",
      caminho: "/destinatarios",
      um: "um",
      singular: "destinatário",
      plural: "destinatários",
      nomeId: "Destinatario",
      entrada: "DestinatarioEntrada",
      saida: "Destinatario",
      exemplo: { nome: "Tribunal de Contas", email: "contato@tc.gov.br", orgao: "TCE" },
      conflitoNoDelete: "Destinatário com relatórios vinculados não pode ser removido",
    }),

    ...crud({
      tag: "Usuários",
      caminho: "/usuarios",
      um: "um",
      singular: "usuário",
      plural: "usuários",
      nomeId: "Usuario",
      entrada: "UsuarioEntrada",
      entradaPut: "UsuarioAtualizar",
      saida: "Usuario",
      exemplo: { nome: "João Souza", email: "joao@exemplo.com", senha: "123456" },
      descricaoCriar: "A senha é salva com hash (bcrypt) e nunca é devolvida. Retorna 409 se o e-mail já existir.",
      descricaoAtualizar: "A `senha` é opcional: se não vier, a atual é mantida.",
      conflitoNoDelete: "Não é possível excluir o próprio usuário",
      conflitoNoSalvar: true,
    }),
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      UsuarioEntrada: paraOpenApi(criarUsuarioSchema, "input"),
      UsuarioAtualizar: paraOpenApi(atualizarUsuarioSchema, "input"),
      Usuario: paraOpenApi(usuarioSaida, "output"),
      LoginEntrada: paraOpenApi(loginSchema, "input"),
      RespostaLogin: {
        type: "object",
        properties: { token: { type: "string" }, usuario: ref("Usuario") },
        required: ["token", "usuario"],
      },
      RelatorioEntrada: paraOpenApi(criarRelatorioSchema, "input"),
      Relatorio: paraOpenApi(relatorioSaida, "output"),
      CategoriaEntrada: paraOpenApi(criarCategoriaSchema, "input"),
      Categoria: paraOpenApi(categoriaSaida, "output"),
      DestinatarioEntrada: paraOpenApi(criarDestinatarioSchema, "input"),
      Destinatario: paraOpenApi(destinatarioSaida, "output"),

      ErroSimples: {
        type: "object",
        properties: { erro: { type: "string" } },
        required: ["erro"],
      },
      ErroValidacao: {
        type: "object",
        description: "Lista de problemas encontrados pelo Zod",
        properties: {
          erros: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string", example: "too_small" },
                path: {
                  type: "array",
                  items: { oneOf: [{ type: "string" }, { type: "integer" }] },
                  example: ["titulo"],
                },
                message: { type: "string", example: "O título precisa de ao menos 3 letras" },
              },
            },
          },
        },
        required: ["erros"],
      },
    },
    responses: {
      Erro400: {
        description:
          "Requisição inválida. Dados que não passaram no Zod devolvem `erros` (lista); " +
          "`id` inválido ou vínculo inexistente devolvem `erro` (texto).",
        content: json({ oneOf: [ref("ErroValidacao"), ref("ErroSimples")] }, {
          erros: [
            {
              code: "too_small",
              path: ["titulo"],
              message: "O título precisa de ao menos 3 letras",
            },
          ],
        }),
      },
      NaoAutorizado401: {
        description: "Token JWT ausente, inválido ou expirado",
        content: json(ref("ErroSimples"), { erro: "Token não informado" }),
      },
      NaoEncontrado404: {
        description: "Registro não encontrado",
        content: json(ref("ErroSimples"), { erro: "Relatório não encontrado" }),
      },
      Conflito409: {
        description: "Conflito: o registro está em uso e não pode ser removido",
        content: json(ref("ErroSimples"), {
          erro: "Categoria em uso: existem relatórios vinculados a ela",
        }),
      },
    },
  },
};
