# jgcalice-agents

A senior tech-team of AI agents (tech-lead, backend, frontend, mobile, architect, QA, DevOps, designer, PM, security) you can use to build any digital product. Use this repo as the starting point for **any application** — for example, a **calendar assistant**, a marketplace, a SaaS, or a mobile app.

---

## The Team

| Role | Focus |
|---|---|
| **Tech-lead** | Breaks down the product into workstreams, assigns tasks, tracks progress. |
| **Product Manager** | Discovery, outcomes, roadmap, and prioritization. |
| **Architect** | System design, APIs, and technical strategy. |
| **Backend** | APIs, data models, business logic, integrations. |
| **Frontend** | Web UI, state management, and UX. |
| **Mobile** | Native or cross-platform mobile apps. |
| **Designer** | UX/UI, flows, and visual consistency. |
| **QA** | Test strategy, automation, and quality gates. |
| **DevOps** | CI/CD, environments, observability, and deployment. |
| **Security** | Threat modelling, auth, input validation, compliance. |

---

## Worked Example: Calendar Assistant

> See the full build plan in [`examples/calendar-assistant-plan.md`](examples/calendar-assistant-plan.md).

### What We're Building

A calendar application with **natural language event creation**, recurring events, timezone support, and multi-provider sync (Google Calendar, Outlook). Users say *"Lunch with Ana tomorrow at noon"* and the event is created, synced, and available offline on mobile.

### Why

Most calendar apps treat event creation as a form. We treat it as a conversation. The Calendar Assistant understands natural language, handles timezone complexity transparently, and works offline on mobile — syncing seamlessly when connectivity returns.

### Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router) + shadcn/ui + Tailwind CSS |
| **Backend** | Python FastAPI + SQLite (aiosqlite) + Pydantic |
| **Mobile** | React Native (Expo) + Expo SQLite (offline) + Expo Notifications |
| **Auth** | OAuth 2.0 (Google Calendar API, Microsoft Graph API) |
| **NL Processing** | Claude API — natural language → structured event |

### How the Team Collaborates

```
PM  ──► defines outcomes, user problems, success metrics
  │
  └──► Tech-lead  ──► breaks product into workstreams
           │
           ├──► Architect   ──► calendar data model, sync strategy, external APIs
           ├──► Backend     ──► events CRUD, availability, reminders, webhooks
           ├──► Frontend    ──► month/week/day views, NL input bar, drag-and-drop
           ├──► Mobile      ──► offline-first, push notifications, deep links
           ├──► Designer    ──► scheduling flows, event modals, empty states
           ├──► QA          ──► NL parsing tests, recurrence edge cases, offline scenarios
           ├──► DevOps      ──► deploy, environments, monitoring
           └──► Security    ──► OAuth flow, input sanitisation, rate limiting
```

### Key Components

**Database**
- `events` — id, title, start_at (UTC), end_at (UTC), timezone, recurrence_rule, provider_id
- `recurrence_exceptions` — skip or modify individual occurrences in a series
- `users` — default_timezone, connected providers
- `sync_log` — bidirectional sync history per provider

**Backend API**
```
POST   /api/events/         Create event (accepts NL text OR structured JSON)
GET    /api/events/         List events (query: start, end, timezone)
GET    /api/events/{id}     Get event with recurrence expansion
PUT    /api/events/{id}     Update event
DELETE /api/events/{id}     Delete event (single or full series)
POST   /api/events/parse    Parse natural language → structured event JSON
POST   /api/sync/{provider} Trigger sync with external calendar
GET    /api/health          Health check
```

**Frontend (Web)**
- Month / week / day views — switchable
- Natural language input bar — always visible at the top
- Drag-and-drop to reschedule events
- Event detail modal (create / edit / delete)
- Settings: timezone, connected providers, notification preferences

**Mobile App**
- Same views optimised for touch
- Offline-first: events stored locally, synced on reconnect
- Push notifications: 15 min before event (configurable)
- Swipe gestures: left to delete, right to edit

### Acceptance Criteria

1. **NL event creation** — *"Lunch with Ana tomorrow at noon at Pasta Place"* → event created with correct date, time, title, and location.
2. **Recurring events** — *"Team standup every weekday at 9am"* → Mon-Fri recurrence rule; individual occurrences can be skipped.
3. **Timezone handling** — São Paulo user sees 14:00 BRT; same event stored as 17:00 UTC; NYC collaborator sees 13:00 EST.
4. **Offline mobile** — create event offline → saved locally → synced on reconnect → no duplicates.
5. **Multi-provider sync** — Google Calendar events appear in the app; events created in the app appear in Google Calendar (bidirectional).
6. **Drag-and-drop** — drag event from Monday to Wednesday → API call triggered, database updated, sync triggered.
7. **Performance** — API p95 < 200 ms; initial web load < 3 s; mobile cold start < 2 s.
8. **Accessibility** — keyboard-navigable, screen reader support, WCAG AA contrast.

### Quick Validation

```bash
# Backend — start server
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Health check
curl -s http://localhost:8000/api/health | jq .

# Create event via natural language
curl -s -X POST http://localhost:8000/api/events/ \
  -H "Content-Type: application/json" \
  -d '{"text": "Lunch tomorrow at noon"}' | jq .

# Parse NL without creating
curl -s -X POST http://localhost:8000/api/events/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Team standup every weekday at 9am"}' | jq .

# Frontend — TypeScript check + build
cd frontend && npx tsc --noEmit && npm run build

# Mobile — start Expo dev server
cd mobile && npx expo start
```

---

## Using This Repo for Any Application

Replace *"calendar assistant"* with your own idea (task manager, booking system, marketplace, learning platform) and follow the same flow:

1. **Define the product** in one sentence — what it does, who it's for, and what outcome it delivers.
2. **Start with PM or Tech-lead** — scope, user problems, success metrics, and workstreams.
3. **Hand off to specialists** — each agent owns their layer; the Tech-lead coordinates.
4. **Ship** — DevOps handles deploy, QA sets quality gates, Security signs off on auth and data handling.

---

## Repo Structure

```
agents/          Role-specific agents (AGENTS.md, SOUL.md, skills, tasks)
  ├── architect/
  ├── backend/
  ├── designer/
  ├── devops/
  ├── frontend/
  ├── mobile/
  ├── pm/
  ├── qa/
  ├── security/
  └── tech-lead/
examples/        Worked build plans (e.g. calendar-assistant-plan.md)
rules/           Cursor/IDE rules — right role applied by file or context
skills/          Reusable operational playbooks and checklists
Claude.md        Project context and references
```

---

## Where to Use These Agents

- **OpenClaw** — import this repo's agents, skills, and rules into your [OpenClaw](https://docs.openclaw.ai/) workspace.
- **Cursor / IDE** — use the `rules/` definitions and agent files as Cursor rules so the correct role is active for each file or task.

---

## References

- [OpenClaw docs](https://docs.openclaw.ai/)
- [Anthropic skills (GitHub)](https://github.com/anthropics/skills/tree/main/skills)
- [Create custom skills (Claude)](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)

---

## License

Use and adapt for your own applications. Replace this section with your chosen license if you publish the repo.
