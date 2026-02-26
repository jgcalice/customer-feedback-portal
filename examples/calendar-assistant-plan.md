# Calendar Assistant — Build Plan

## What We're Building

A calendar application with natural language event creation, recurring events, timezone support, and multi-provider sync (Google Calendar, Outlook). Users can say "Lunch with Ana tomorrow at noon" and the event is created, synced, and available offline on mobile.

## Why

Most calendar apps treat event creation as a form. We treat it as a conversation. The Calendar Assistant understands natural language, handles timezone complexity transparently, and works offline on mobile — syncing seamlessly when connectivity returns.

## Stack

- **Frontend**: Next.js 15 (App Router) + shadcn/ui + Tailwind CSS
- **Backend**: Python FastAPI + SQLite (aiosqlite) + Pydantic
- **Mobile**: React Native (Expo) + Expo SQLite (offline) + Expo Notifications
- **Auth**: OAuth 2.0 (Google Calendar API, Microsoft Graph API)
- **NL Processing**: Claude API for natural language → structured event parsing

## Components

### 1. Database Layer
- `events` table: id, title, description, start_at (UTC), end_at (UTC), timezone, location, recurrence_rule, provider_id, user_id, created_at, updated_at
- `recurrence_exceptions` table: id, event_id, original_date, action (skip | modify), modified_event JSON
- `users` table: id, email, name, default_timezone, providers JSON
- `sync_log` table: id, event_id, provider, direction (push | pull), status, timestamp

### 2. Backend API
- `POST /api/events/` — Create event (accepts NL text OR structured JSON)
- `GET /api/events/` — List events (query: start, end, timezone)
- `GET /api/events/{id}` — Get single event with recurrence expansion
- `PUT /api/events/{id}` — Update event
- `DELETE /api/events/{id}` — Delete event (single or series)
- `POST /api/events/parse` — Parse natural language → structured event JSON
- `POST /api/auth/{provider}/callback` — OAuth callback
- `GET /api/auth/{provider}/url` — Get OAuth redirect URL
- `POST /api/sync/{provider}` — Trigger sync with external calendar
- `GET /api/health` — Health check

### 3. Frontend (Web)
- Month view (default), week view, day view — switchable
- Drag-and-drop to reschedule events
- Natural language input bar (always visible, top of screen)
- Event detail modal (create/edit/delete)
- Settings page: timezone, connected providers, notification preferences
- States: loading skeleton, empty calendar, error toast, conflict warning

### 4. Mobile App
- Same views as web (month/week/day) optimized for touch
- Offline-first: events stored locally, synced on reconnect
- Push notifications: 15 min before event (configurable)
- Deep links: `calendar://event/{id}` opens event detail
- Swipe gestures: left to delete, right to edit

### 5. Auth & Security
- OAuth 2.0 flow for Google Calendar and Microsoft Outlook
- Token refresh with retry logic
- RBAC: owner (full), viewer (read-only) for shared calendars
- All dates stored as UTC; displayed in user's timezone
- Rate limiting on API endpoints
- Input sanitization for NL input (prevent prompt injection on Claude API calls)

## Dependencies Between Components

```
Database schema → Backend (data models, CRUD)
Backend API contract → Frontend (fetch calls)
Backend API contract → Mobile (API client)
Auth flow (security) → Backend middleware → Frontend/Mobile auth state
Designer states → Frontend component states + Mobile component states
NL parsing (backend + Claude API) → Frontend NL input bar + Mobile NL input
```

## Acceptance Criteria

1. **NL event creation**: User types "Lunch with Ana tomorrow at noon at Pasta Place" → event created with correct date, time (in user's timezone), title, and location
2. **Recurring events**: User creates "Team standup every weekday at 9am" → recurring event with Mon-Fri recurrence rule; can skip individual occurrences
3. **Timezone handling**: User in São Paulo sees event at 14:00 BRT; same event shows as 17:00 UTC in the database; collaborator in NYC sees it at 13:00 EST
4. **Offline mobile**: User creates event while offline → event saved locally → synced to server when connectivity returns → no duplicates
5. **Multi-provider sync**: Connected Google Calendar events appear in the app; events created in the app appear in Google Calendar (bidirectional)
6. **Drag-and-drop**: User drags event from Monday to Wednesday on week view → event rescheduled, API called, sync triggered
7. **Performance**: API response < 200ms (p95); initial web load < 3s; mobile cold start < 2s
8. **Accessibility**: All interactive elements keyboard-navigable; screen reader support; WCAG AA contrast

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| NL parsing ambiguity ("next Friday" — which one?) | Wrong event date | Always show parsed result for confirmation before creating |
| OAuth token expiry during sync | Failed sync, data loss | Retry with refresh token; queue failed syncs for retry |
| Offline conflict (event edited on both mobile and web) | Data inconsistency | Last-write-wins with conflict notification to user |
| Timezone DST transitions | Events at wrong time | Use IANA timezone database; never store local times |
| Claude API rate limits on NL parsing | Degraded UX | Fallback to structured form when API unavailable |

## Validation

### Database Validation
```bash
# Schema creates without errors
python -c "from app.database import init_db; import asyncio; asyncio.run(init_db())"

# CRUD operations work
python -m pytest tests/test_database.py -v
```

### Backend Validation
```bash
# Server starts
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
sleep 2

# Health check
curl -s http://localhost:8000/api/health | jq .

# Create event via NL
curl -s -X POST http://localhost:8000/api/events/ \
  -H "Content-Type: application/json" \
  -d '{"text": "Lunch tomorrow at noon"}' | jq .

# List events
curl -s "http://localhost:8000/api/events/?start=2026-02-26&end=2026-03-05" | jq .

# Parse NL without creating
curl -s -X POST http://localhost:8000/api/events/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Team standup every weekday at 9am"}' | jq .
```

### Frontend Validation
```bash
cd frontend
npx tsc --noEmit        # TypeScript compiles
npm run build           # Build succeeds
npm run dev &           # Dev server starts
# Verify: month view renders, NL input bar visible, no console errors
```

### Mobile Validation
```bash
cd mobile
npx expo start          # Expo dev server starts
# Test on iOS simulator and Android emulator
# Verify: offline event creation, push notification, deep link
```

### End-to-End Validation
1. Start database + backend + frontend
2. Create event via NL input → verify it appears in calendar view
3. Edit event via drag-and-drop → verify API call and database update
4. Create recurring event → verify recurrence expansion in week view
5. Test offline: disconnect network → create event on mobile → reconnect → verify sync
6. Connect Google Calendar → verify bidirectional sync
