# Customer Feedback Portal (MVP)

A minimal fullstack portal for submitting and tracking product problems.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma + SQLite
- Tailwind CSS

## Setup

```bash
cp .env.example .env
npm install
npm run db:init   # migrate + seed
npm run build
npm start
```

## Seed Data

- **Products**: WMS, Roteirização, ERP
- **Internal user**: admin@example.com
- **Customer user**: customer@example.com
- **Sample data**: seeded problems, interests, roadmap link, and comments for visual testing

Users authenticate via magic link. For local dev without email provider, the API returns
a preview link in the login response and logs it to the server console.

## Pages

- `/` - Dashboard with metrics and recent problems
- `/login` - Magic link login
- `/positioning` - Product principles and focus
- `/problems` - List with filters (product, status, search)
- `/problems/new` - Submit a problem (requires login)
- `/problems/[id]` - Detail + "me afeta" + comments
- `/roadmap` - Roadmap by product
- `/admin` - Internal only: update status, add roadmap items, merge duplicates

UX notes:
- Inline feedback + toast notifications for key actions
- `/problems` filters persist in URL (shareable links)
- `/problems` supports pagination (numeric) + page size + sort (recent / interested / commented)
- optional "Only my interests" filter when logged in
- server-side persisted problem preferences per user (`/api/me/preferences/problems`)
- My Workspace saved views (favorite + apply + delete)
- CSV export from the currently filtered list (`/api/problems/export`)
- Keyboard-friendly focus states enabled globally

See the complete usage flow: [`WALKTHROUGH.md`](./WALKTHROUGH.md)

## API Routes

- `POST /api/auth/request-link` - Generate/send magic link
- `GET /api/auth/callback` - Validate magic link + start session
- `POST /api/auth/logout` - End session
- `GET /api/me` - Current user
- `GET/PUT /api/me/preferences/problems` - User-level persisted problem list preferences
- `GET/POST /api/me/workspace/views` - List/create saved workspace views
- `PATCH/DELETE /api/me/workspace/views/[id]` - Update/delete a saved view
- `GET/POST /api/problems` - List/create problems
- `GET /api/problems/export` - Export current filtered list as CSV
- `GET /api/problems/[id]` - Problem detail
- `POST /api/problems/[id]/comments` - Add comment to problem
- `POST/DELETE /api/problems/[id]/interest` - Me afeta
- `GET /api/roadmap` - Public roadmap
- `POST /api/admin/roadmap` - Add roadmap item (internal)
- `POST /api/admin/problems/[id]/status` - Update status (internal)
- `POST /api/admin/problems/[id]/merge` - Merge duplicate problem into target (internal)
