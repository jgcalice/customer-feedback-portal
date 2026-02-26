# Customer Feedback Portal (MVP)

A minimal fullstack portal for submitting and tracking product problems.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma + SQLite
- Tailwind CSS

## Setup

```bash
npm install
npm run db:init   # migrate + seed
npm run build
npm start
```

## Seed Data

- **Products**: WMS, Roteirização, ERP
- **Internal user**: admin@example.com / admin123
- **Customer user**: customer@example.com / customer123

## Pages

- `/login` - Email/password login
- `/positioning` - Product principles and focus
- `/problems` - List with filters (product, status, search)
- `/problems/new` - Submit a problem (requires login)
- `/problems/[id]` - Detail + "me afeta" button
- `/roadmap` - Roadmap by product
- `/admin` - Internal only: update status, add roadmap items

## API Routes

- `POST /api/auth/request-link` - Login (email + password)
- `GET /api/auth/callback` - Magic link callback (stub)
- `GET /api/me` - Current user
- `GET/POST /api/problems` - List/create problems
- `GET /api/problems/[id]` - Problem detail
- `POST/DELETE /api/problems/[id]/interest` - Me afeta
- `GET /api/roadmap` - Public roadmap
- `POST /api/admin/roadmap` - Add roadmap item (internal)
- `POST /api/admin/problems/[id]/status` - Update status (internal)
