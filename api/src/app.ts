import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./docs/openapi";
import { autenticar } from "./middlewares/autenticar";
import { tratadorDeErros } from "./middlewares/erro";
import { authRouter } from "./routes/auth.routes";
import { categoriaRouter } from "./routes/categoria.routes";
import { destinatarioRouter } from "./routes/destinatario.routes";
import { relatorioRouter } from "./routes/relatorio.routes";
import { usuarioRouter } from "./routes/usuario.routes";

export const app = express();

app.use(cors()); // libera o acesso do aplicativo (Expo web / outro endereço)
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

// Rotas públicas de autenticação (registrar e login devolvem o token JWT)
app.use("/auth", authRouter);

// Rotas protegidas: exigem "Authorization: Bearer <token>"
app.use("/relatorios", autenticar, relatorioRouter);
app.use("/categorias", autenticar, categoriaRouter);
app.use("/destinatarios", autenticar, destinatarioRouter);
app.use("/usuarios", autenticar, usuarioRouter);

app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.use(tratadorDeErros);
