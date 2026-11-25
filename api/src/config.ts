// Carrega o arquivo .env (se existir) com o recurso nativo do Node (>= 20.12).
// Este arquivo é importado primeiro no server.ts, antes de abrir o banco.
try {
  process.loadEnvFile();
} catch {
  // sem .env: usa as variáveis do ambiente ou os valores padrão
}

export const config = {
  jwtSecret: process.env.JWT_SECRET ?? "segredo-de-desenvolvimento",
  jwtExpiraEm: process.env.JWT_EXPIRA_EM ?? "1d",
};

if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET não definido no .env: usando um segredo de desenvolvimento.");
}
