# AV1 — Sistema de Relatórios (API Node.js + App React Native)

```
AV1-API-relatorios/
├─ api/      API REST — Express + TypeScript + Zod + SQLite + JWT (documentação Swagger)
└─ mobile/   Aplicativo — React Native com Expo
```

## Requisitos da atividade

| Requisito | Onde está |
|---|---|
| **4 CRUDs** | Relatórios, Categorias, Destinatários e Usuários (`api/src/routes/`) |
| **Relação entre eles** | Relatório → Categoria e Relatório → Destinatário (chave estrangeira em `api/src/database/db.ts`; o JOIN traz os nomes) |
| **Zod** | Validação da API em `api/src/schemas/` + `api/src/middlewares/validar.ts`; o app valida os formulários com Zod em `mobile/src/schemas.ts` |
| **JWT** | `POST /auth/registrar` e `POST /auth/login` devolvem o token; `api/src/middlewares/autenticar.ts` protege todos os CRUDs |

## Como rodar

Requer Node.js 22 ou superior.

### 1. API (terminal 1)

```powershell
cd api
npm install
copy .env.example .env
npm run dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs (crie a conta em `/auth/registrar`, copie o token e clique em **Authorize**)
- Teste automático (com a API rodando): `npm run smoke`

### 2. App (terminal 2)

```powershell
cd mobile
npm install
npx expo start
```

- **Celular:** abra o **Expo Go** e leia o QR Code. O celular precisa estar na mesma rede Wi-Fi do computador; o app usa automaticamente o IP do computador na porta 3000. Se o Firewall do Windows perguntar, permita o Node na rede privada.
- **Navegador:** aperte `w` no terminal do Expo.
- **Outro endereço de API:** crie `mobile/.env` com `EXPO_PUBLIC_API_URL=http://SEU_IP:3000`.

No app: crie uma conta, cadastre uma categoria e um destinatário, depois cadastre os relatórios.

Mais detalhes da API (rotas, regras e estrutura das pastas) em [api/README.md](api/README.md).
