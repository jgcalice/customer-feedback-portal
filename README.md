# jgcalice-agents

A senior tech-team of AI agents (tech-lead, backend, frontend, mobile, architect, QA, DevOps, designer, PM) you can use to build any digital product. Use this repo as the starting point for **any application** — for example, a **calendar assistant**, a marketplace, a SaaS, or a mobile app.

---

## How to Use With Any Application

### 1. Pick your product idea

Define the application you want to build. Example:

**Example: Calendar Assistant**

- **What:** A smart calendar assistant that schedules meetings, finds free slots, sends reminders, and suggests focus blocks.
- **Who:** Busy professionals and small teams.
- **Outcome:** Less scheduling friction and fewer no-shows.

You can replace this with your own idea (e.g. task manager, booking system, learning platform).

### 2. Use the agents as your team

This repo provides:

| Role        | Focus |
|------------|--------|
| **Tech-lead** | Breaks down the product into workstreams and assigns tasks to the right agents. |
| **Product Manager** | Discovery, outcomes, roadmap, and prioritization. |
| **Architect** | System design, APIs, and technical strategy. |
| **Backend** | APIs, data models, business logic, integrations. |
| **Frontend** | Web UI, state, and UX. |
| **Mobile** | Native or cross-platform mobile apps. |
| **Designer** | UX/UI, flows, and visual consistency. |
| **QA** | Test strategy, automation, and quality gates. |
| **DevOps** | CI/CD, environments, observability, and deployment. |

Start by describing your product (like the calendar assistant above) to the **Tech-lead** or **PM**; they’ll help you scope and then involve the right agents.

### 3. Where these agents live

- **OpenClaw:** Use these agents inside [OpenClaw](https://docs.openclaw.ai/) by importing this repo’s agents/skills/rules.
- **Cursor / IDE:** Use the `rules/` and agent definitions as Cursor rules or custom skills so the right “role” is active for each file or task.

### 4. Quick start (example: Calendar Assistant)

1. **Clone this repo** (or use it inside your OpenClaw workspace).
2. **Define the product** in one sentence, e.g.  
   *“I want a calendar assistant that finds free slots, sends reminders, and blocks focus time.”*
3. **Start with the PM or Tech-lead**  
   - PM: outcomes, user problems, success metrics.  
   - Tech-lead: high-level workstreams (backend API, frontend, mobile, infra).
4. **Hand off to specialists**  
   - Architect: calendar data model, sync strategy, external APIs (Google Calendar, etc.).  
   - Backend: events CRUD, availability, reminders, webhooks.  
   - Frontend: calendar views, scheduling UI, settings.  
   - Mobile: same flows for iOS/Android.  
   - Designer: flows and UI for scheduling and reminders.  
   - QA: test plan and automation.  
   - DevOps: deploy, envs, monitoring.

Same flow works for any other app — replace “calendar assistant” with your product.

---

## Repo structure

- **`agents/`** — Role-specific agents (AGENTS.md, SOUL.md, skills, tasks).
- **`rules/`** — Cursor/IDE rules so the right role is applied by file or context.
- **`CLAUDE.md`** — Project context and references.

---

## References

- [OpenClaw docs](https://docs.openclaw.ai/)
- [Anthropic skills (GitHub)](https://github.com/anthropics/skills/tree/main/skills)
- [Create custom skills (Claude)](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)

---

## License

Use and adapt for your own applications. Replace this section with your chosen license if you publish the repo.
