# Customer Feedback Portal — Build Plan (MVP Simples)

## What We’re Building

Um **portal web simples** onde clientes conseguem:

* Ver o **posicionamento** do produto (princípios + foco atual)
* **Submeter problemas** (com contexto e impacto)
* Ver uma lista de problemas existentes e marcar **“me afeta”** (interesse)
* Acompanhar **status** do que está sendo avaliado / planejado / em andamento / entregue

Formato inspirado no plano de referência. 

---

## Why

Hoje os pedidos chegam espalhados (e-mail, WhatsApp, calls) e você precisa:

* Centralizar tudo em 1 lugar
* Reduzir duplicidade de requests
* Dar transparência e previsibilidade (sem prometer demais)
* Transformar “feature request” em **problema com evidência** (impacto, frequência, workaround)

---

## Stack (infra mais simples possível)

* **Frontend + Backend**: Next.js (fullstack, App Router) + TypeScript
* **Database**: SQLite (file) com Prisma (ou Drizzle)
* **Deploy**: Vercel (ou Render/Fly.io) — 1 app só
* **Auth (MVP)**: login por **link mágico via e-mail** (sem OAuth) *ou* senha simples (dependendo do tempo)
* **E-mail**: Resend (ou SMTP básico)

> Ideia: um “site qualquer”, 1 repo, 1 deploy, mínimo de moving parts.

---

## Components

### 1) Database Layer (SQLite)

Tabelas mínimas:

* `users`: id, email, name, role (`customer` | `internal`), created_at
* `products`: id, name (WMS, Roteirização, ERP…), created_at
* `problems`: id, product_id, title, problem_statement, impact, frequency, workaround, status, created_by, created_at, updated_at
* `interests`: id, problem_id, user_id, created_at  *(unique: problem_id + user_id)*
* `roadmap_items`: id, product_id, title, description, status, target_month_or_quarter, created_at
* `problem_roadmap`: problem_id, roadmap_item_id
* (opcional) `comments`: id, problem_id, user_id, text, created_at

### 2) Backend (Next.js API Routes)

Endpoints MVP:

* `POST /api/auth/request-link` — envia link mágico

* `GET /api/auth/callback` — valida token e cria sessão

* `GET /api/me` — usuário logado

* `GET /api/products` — lista produtos

* `POST /api/problems` — cria problema

* `GET /api/problems` — lista + filtros (produto, status, busca)

* `GET /api/problems/:id` — detalhe + contagem de “me afeta”

* `POST /api/problems/:id/interest` — marcar “me afeta”

* `DELETE /api/problems/:id/interest` — remover

* `GET /api/roadmap` — roadmap público no portal

* `POST /api/admin/roadmap` — CRUD roadmap (somente interno)

* `POST /api/admin/problems/:id/status` — atualizar status (somente interno)

* `POST /api/admin/problems/:id/merge` — (opcional MVP) consolidar duplicados

### 3) Frontend (Web)

Páginas:

* `/login`
* `/positioning` (público dentro do portal)
* `/problems` (lista + filtros + busca)
* `/problems/new` (form orientado a problema)
* `/problems/[id]` (detalhe + “me afeta” + status)
* `/roadmap` (itens por produto)
* `/admin` (interno: status, roadmap)

Estados de UI obrigatórios:

* loading / empty / error / success toast

### 4) Infra / Operação (mínimo)

* 1 projeto na Vercel (preview deployments automáticos)
* SQLite como arquivo no deploy **(ok para MVP)**

  * Se precisar de persistência robusta rapidamente: trocar SQLite → Postgres gerenciado (Neon/Supabase) sem mudar muito o app.

---

## Dependencies Between Components

```
DB schema (Prisma) → API routes (CRUD)
API contract → Pages (list/detail/create)
Auth (magic link) → Middleware → Proteção de rotas
Admin role → endpoints admin + página /admin
```

---

## Acceptance Criteria (MVP)

1. Cliente faz login e **submete um problema** com: produto, descrição, impacto, frequência, workaround
2. Outro cliente consegue ver o problema e marcar **“me afeta”**
3. Interno (PM) altera o **status** do problema e todos veem atualizado
4. Roadmap aparece no portal com itens por produto e status
5. A listagem tem filtro por produto/status e busca por texto
6. Permissões: cliente não acessa `/admin`

---

## Risks and Mitigations

| Risco                            | Impacto | Mitigação                                                            |
| -------------------------------- | ------- | -------------------------------------------------------------------- |
| Vira “portal de feature request” | bagunça | formulário exige “problema + impacto + frequência”                   |
| Spam / ruído                     | médio   | rate limit simples + validação + moderação (interno)                 |
| Duplicidade alta                 | médio   | busca antes de criar + merge manual no admin                         |
| Promessas de prazo               | alto    | no MVP, mostrar “planejado / em andamento” e **evitar datas exatas** |

---

## Validation

### Local

```bash
npm install
npx prisma migrate dev
npm run dev
```

### Quick checks

```bash
# criar problema
curl -s -X POST http://localhost:3000/api/problems \
  -H "Content-Type: application/json" \
  -d '{"productId":"wms","title":"Separação lenta","problemStatement":"...","impact":"...","frequency":"daily","workaround":"..."}'
```

### Manual E2E (5 minutos)

1. Login → criar problema
2. Abrir lista → encontrar problema → “me afeta”
3. Login interno → mudar status
4. Voltar como cliente → ver status atualizado
5. Ver `/roadmap`