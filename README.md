# NutricaAi — Sistema de Gestão Nutricional

Sistema clínico completo para nutricionistas com autenticação segura, dashboard em tempo real, acompanhamento de pacientes e histórico de consultas.

---

## 🔒 Segurança e Variáveis de Ambiente

As credenciais do banco e chaves de API **não** são versionadas no Git. Elas ficam salvas localmente em `.env.local` (ignorado pelo `.gitignore`) e devem ser configuradas nas variáveis de ambiente da plataforma de hospedagem (como **Vercel**).

### Template de variáveis (`.env.example`):
```env
VITE_NEON_AUTH_URL=https://ep-fragrant-leaf-b6br2b5c.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth
VITE_NEON_PROJECT_ID=summer-cake-97999509
VITE_NEON_DATABASE_URL=postgresql://usuario:senha@ep-fragrant-leaf-b6br2b5c-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 🚀 Como Fazer o Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
2. Clique em **"Add New..."** > **"Project"**.
3. Selecione o repositório `Isabela00123/Sistema_Nutrica`.
4. Em **Framework Preset**, deixe como `Vite`.
5. Em **Environment Variables**, adicione as três chaves:
   - `VITE_NEON_AUTH_URL`
   - `VITE_NEON_PROJECT_ID`
   - `VITE_NEON_DATABASE_URL`
6. Clique em **Deploy**.

---

## 💻 Como Rodar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/Isabela00123/Sistema_Nutrica.git
cd Sistema_Nutrica
```

2. Instale as dependências:
```bash
npm install
```

3. Crie seu arquivo `.env.local`:
```bash
cp .env.example .env.local
```
Preencha o `.env.local` com a sua connection string real do Neon.

4. Inicie o servidor:
```bash
npm run dev
```
O sistema estará disponível em `http://localhost:5173/`.
