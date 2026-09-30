import { app } from "./app";
import { db } from "./database/db";

const PORTA = Number(process.env.PORT ?? 3000);

const servidor = app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
  console.log(`Documentação Swagger em http://localhost:${PORTA}/docs`);
});

// Encerramento limpo: fecha o servidor e o banco (Ctrl+C)
function encerrar() {
  servidor.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
