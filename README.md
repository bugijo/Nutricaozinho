# Nutriçãozinho

Sistema web para calcular alimentação natural de cães e gerenciar a produção de um pet shop.
Substitui as planilhas de cálculo: cadastra ingredientes, monta dietas, calcula receitas,
gera fichas de cozinha, lista de compras, precificação e avisos de recompra.

A interface é **simples e linear (passo a passo)**, com fontes grandes, alto contraste e botões
largos — pensada para um usuário de 60 anos.

## Stack

- **Backend:** Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, Zod, Vitest.
- **Frontend:** React, Vite, TailwindCSS, React Router.

## Estrutura (monorepo)

```
backend/    API REST + motor de cálculo (Prisma, services, rotas)
frontend/   App React acessível (fluxo passo a passo)
docker-compose.yml   PostgreSQL 16 para desenvolvimento
```

## Como rodar

Pré-requisitos: Node 18+ e Docker (ou um PostgreSQL próprio).

### 1. Banco de dados

```bash
docker compose up -d   # sobe o PostgreSQL em localhost:5432
```

Para usar outro Postgres (Neon, Railway, etc.), basta apontar a `DATABASE_URL` no `.env`.

### 2. Backend

```bash
cd backend
cp .env.example .env          # ajuste a DATABASE_URL se necessário
npm install
npx prisma migrate deploy     # cria as tabelas
npm run seed                  # configurações iniciais (opcional)
npm run dev                   # API em http://localhost:3333
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # app em http://localhost:5173
```

O Vite faz proxy de `/api` para a API em `:3333`.

## Testes

```bash
cd backend && npm test        # testes do motor de cálculo (Vitest)
```

## Módulos

1. **Ingredientes** — preço por peso e tabela nutricional (Kcal, proteína, fibra, carbo por 100g).
2. **Cliente e Pet** — dono + pet (peso, fator de atividade).
3. **Dieta** — proporção de macros (ex: 35/30/30) e ingredientes escolhidos.
4. **Lotes / Produção** — pedidos (ex: 30 pacotes de 350g) e Ficha de Cozinha em letras grandes.
5. **Lista de Compras** — agrega os lotes da semana e mostra quanto comprar.
6. **Precificação** — ingredientes + embalagem + mão de obra + margem → preço de venda sugerido.
7. **CRM / Avisos** — alerta de recompra antes da comida do cliente acabar.

## Fórmula nutricional

Necessidade Energética de Manutenção (NEM):

```
NEM (kcal/dia) = 70 × (peso_kg ^ 0.75) × fator_atividade
```

As calorias da NEM são distribuídas pelas proporções da dieta e convertidas em gramas reais
de cada ingrediente (`gramas = kcal_do_ingrediente / kcal_por_100g × 100`).
