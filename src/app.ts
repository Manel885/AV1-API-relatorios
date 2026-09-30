import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./docs/openapi";
import { tratadorDeErros } from "./middlewares/erro";
import { categoriaRouter } from "./routes/categoria.routes";
import { destinatarioRouter } from "./routes/destinatario.routes";
import { relatorioRouter } from "./routes/relatorio.routes";

export const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ mensagem: "API de relatórios no ar!", docs: "/docs" });
});

app.get("/docs.json", (req, res) => {
  res.json(openApiDocument);
});
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "API de Relatórios — Documentação",
    swaggerOptions: { docExpansion: "list", displayRequestDuration: true },
  }),
);

app.use("/relatorios", relatorioRouter);
app.use("/categorias", categoriaRouter);
app.use("/destinatarios", destinatarioRouter);

app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.use(tratadorDeErros);
