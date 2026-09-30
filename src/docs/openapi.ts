import { z } from "zod";
import { criarCategoriaSchema } from "../schemas/categoria.schema";
import { criarDestinatarioSchema } from "../schemas/destinatario.schema";
import { criarRelatorioSchema, statusRelatorio } from "../schemas/relatorio.schema";


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

const ref = (nome: string) => ({ $ref: `#/components/schemas/${nome}` });
const refResposta = (nome: string) => ({ $ref: `#/components/responses/${nome}` });
const json = (schema: Json, example?: unknown) => ({
  "application/json": { schema, ...(example !== undefined && { example }) },
});

// ---------- Fábrica de rotas: os 3 CRUDs têm o MESMO formato ----------
type Recurso = {
  tag: string; // agrupador no Swagger
  caminho: string; // "/categorias"
  um: "um" | "uma"; // para os textos ("Cria uma categoria")
  singular: string; // "categoria"
  plural: string; // "categorias"
  nomeId: string; // "Categoria" (usado em operationId, sem acento)
  entrada: string; // nome do schema de entrada em components
  saida: string; // nome do schema de saída em components
  exemplo: Json; // corpo de exemplo para o "Try it out"
  descricaoLista?: string;
  descricaoCriar?: string;
  descricaoAtualizar?: string;
  parametrosLista?: Json[];
  erro400Vinculo?: boolean; // POST/PUT podem dar 400 por categoriaId/destinatarioId inexistente
  conflitoNoDelete?: string; // DELETE pode dar 409
};

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
        requestBody: corpo,
        responses: {
          "200": { description: "Atualizado", content: json(ref(r.saida)) },
          "400": refResposta("Erro400"),
          "404": refResposta("NaoEncontrado404"),
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
    ].join("\n"),
  },
  servers: [{ url: "/", description: "Servidor atual" }],
  tags: [
    { name: "Sistema", description: "Verificação de disponibilidade" },
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
  },

  components: {
    schemas: {
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
