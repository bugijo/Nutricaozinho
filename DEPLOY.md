# Guia de Publicação (Deploy) — Nutriçãozinho

Este guia coloca o sistema online **de graça**, do zero, sem pular etapas.
São duas opções:

- **Opção A — Demonstração online em ~5 min** (só o front, com dados de exemplo/mock, **sem backend**). Ótimo para o cliente já clicar e ver.
- **Opção B — Sistema completo** (banco de dados + API + front, dados reais e salvos). Recomendado para uso de verdade.

Pré-requisito comum: o código precisa estar no **GitHub** (este repositório já está).

---

## Opção A — Demonstração online em ~5 minutos (Vercel, modo mock)

Publica só o frontend em modo demonstração (dados falsos em memória). Não precisa de banco nem API.

1. Acesse **https://vercel.com** e entre com sua conta do GitHub.
2. Clique em **Add New… → Project** e **importe** o repositório `Nutricaozinho`.
3. Em **Configure Project**, preencha exatamente:
   - **Root Directory:** `frontend`  ← clique em "Edit" e selecione a pasta `frontend`.
   - **Framework Preset:** `Vite` (a Vercel detecta sozinho).
   - **Build Command:** `npm run build` (padrão).
   - **Output Directory:** `dist` (padrão).
4. Abra **Environment Variables** e adicione:
   - **Name:** `VITE_USE_MOCK`  **Value:** `true`
5. Clique em **Deploy**. Em ~1 min você recebe uma URL tipo `https://nutricaozinho.vercel.app`.
6. Pronto — mande essa URL para o cliente testar. (Lembrete: no modo mock os dados não são salvos de verdade; ao recarregar, volta ao exemplo.)

> Para virar o sistema "de verdade" depois, é só fazer a **Opção B** e trocar a variável (passo final).

---

## Opção B — Sistema completo (banco + API + front)

Arquitetura: **Banco no Neon** → **API no Render** → **Front na Vercel**. Tudo no plano gratuito.

> Por que Neon para o banco? É Postgres grátis, rápido e sem o limite de "2 projetos ativos" que a Supabase impõe no plano free. Se preferir Supabase ou o Postgres do próprio Render, funciona igual — só troque a connection string.

### Passo 1 — Banco de dados (Neon)

1. Acesse **https://neon.tech** e crie conta (pode usar o GitHub).
2. **Create Project** (região mais perto do Brasil, ex.: AWS São Paulo se disponível, senão US East).
3. Na tela do projeto, copie a **Connection String** (formato `postgresql://usuario:senha@host/db?sslmode=require`). Guarde — é o seu `DATABASE_URL`.

### Passo 2 — API (Render)

1. Acesse **https://render.com**, entre com o GitHub.
2. **New → Web Service** e selecione o repositório `Nutricaozinho`.
3. Preencha exatamente:
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:**
     ```
     npm install && npx prisma generate && npx prisma migrate deploy && npm run build
     ```
   - **Start Command:**
     ```
     node dist/server.js
     ```
   - **Instance Type:** `Free`
4. Em **Environment**, adicione a variável:
   - **Key:** `DATABASE_URL`  **Value:** *(a connection string do Neon do Passo 1)*
   - (Não precisa definir `PORT` — o Render injeta automaticamente e o servidor já usa essa porta.)
5. Clique em **Create Web Service**. O Render instala, **roda as migrations** (cria as tabelas no Neon) e sobe a API.
6. Quando terminar, copie a URL pública da API, ex.: `https://nutricaozinho-api.onrender.com`.
7. Teste no navegador: abra `https://SUA-API.onrender.com/health` → deve responder `{"status":"ok"}`.

> Observação do plano free do Render: após ~15 min sem uso a API "dorme"; a primeira chamada seguinte demora alguns segundos para acordar. É normal.

> (Opcional) Dados iniciais de configuração: na aba **Shell** do serviço no Render, rode `npm run seed`.

### Passo 3 — Frontend (Vercel)

1. Em **https://vercel.com**, **Add New… → Project** e importe `Nutricaozinho`.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build` · **Output Directory:** `dist`
3. Em **Environment Variables**, adicione (atenção: termina com `/api`):
   - **Name:** `VITE_API_URL`  **Value:** `https://SUA-API.onrender.com/api`
   - **Não** defina `VITE_USE_MOCK` (ou deixe `false`) para usar o banco real.
4. **Deploy**. A URL final (ex.: `https://nutricaozinho.vercel.app`) é o link do cliente.

Pronto: o front na Vercel conversa com a API no Render, que salva tudo no banco Neon.

---

## Conferência final (checklist à prova de erro)

- [ ] `https://SUA-API.onrender.com/health` responde `{"status":"ok"}`.
- [ ] No site da Vercel, cadastrar um ingrediente e recarregar a página — ele continua lá (prova de que salva no banco).
- [ ] Montar uma dieta e ver a "Receita por dia" com as gramas.
- [ ] Criar um lote e abrir a "Ficha de Cozinha".

## Erros comuns e soluções

| Sintoma | Causa provável | Solução |
|---|---|---|
| Front abre mas dá erro ao salvar | `VITE_API_URL` errado ou sem `/api` no final | Corrija a variável na Vercel e clique em **Redeploy**. |
| Telas internas dão 404 ao recarregar | Faltou o roteamento SPA | Já incluímos `frontend/vercel.json`; confirme que o Root Directory é `frontend`. |
| API não sobe / erro de tabela | Migrations não rodaram | Confirme o **Build Command** do Render (com `prisma migrate deploy`) e que `DATABASE_URL` está correta. |
| `Can't reach database server` | Connection string incorreta | Copie novamente a string do Neon (com `?sslmode=require`). |
| Primeira chamada lenta | API "dormindo" (plano free Render) | Normal; aguarde alguns segundos. |

## Variáveis de ambiente (resumo)

| Onde | Variável | Exemplo | Para quê |
|---|---|---|---|
| Render (API) | `DATABASE_URL` | `postgresql://...@...neon.tech/...?sslmode=require` | Conexão com o banco |
| Vercel (front) | `VITE_API_URL` | `https://nutricaozinho-api.onrender.com/api` | Endereço da API |
| Vercel (front, só demo) | `VITE_USE_MOCK` | `true` | Liga o modo demonstração (sem backend) |
