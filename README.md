# jgcalice-agents

A framework of **10 senior AI agents** you can run as a collaborative team inside Claude Code, OpenClaw, or Cursor. Give it a product plan and it spins up a full tech team — tech-lead, backend, frontend, mobile, architect, QA, DevOps, designer, PM, security — each with 20+ years of encoded experience, working in parallel.

**This is not a runnable application.** It's agent definitions that you load into your AI environment to give yourself a senior tech team.

---

## Prerequisites

| Requirement | Install |
|---|---|
| **Claude Code CLI** | `npm install -g @anthropic-ai/claude-code` |
| **Anthropic API key** | [console.anthropic.com](https://console.anthropic.com) → set `ANTHROPIC_API_KEY` |
| **tmux** (for split-pane agent teams) | macOS: `brew install tmux` · Ubuntu/Debian: `sudo apt install tmux` · Windows: use WSL then `sudo apt install tmux` |
| **git** | Likely already installed |

> **iTerm2 alternative** — if you're on macOS with iTerm2, install the [`it2` CLI](https://github.com/mkusaka/it2) and enable the Python API in iTerm2 → Settings → General → Magic. You can use iTerm2 instead of tmux.

---

## Quick Start — Claude Code Agent Teams (primary path)

Agent teams are the most powerful way to use this repo. Multiple Claude Code sessions work in parallel, share a task list, and talk to each other.

### Step 1 — Clone the repo

```bash
git clone https://github.com/jgcalice/jgcalice-agents.git
cd jgcalice-agents
```

### Step 2 — Enable agent teams

Agent teams are experimental and disabled by default. Copy the example config:

```bash
mkdir -p .claude
cp .claude/settings.json.example .claude/settings.json
```

The example config enables agent teams and sets tmux as the display mode. If you prefer in-process mode (single terminal, use Shift+Down to cycle agents), edit `.claude/settings.json` and change `"teammateMode"` to `"in-process"`.

### Step 3 — Open Claude Code inside the repo

```bash
claude
```

> Make sure you're in the `jgcalice-agents` root when you run `claude`. All agents load project context from this directory.

### Step 4 — Build the Calendar Assistant example

Type this into Claude Code:

```
/build examples/calendar-assistant-plan.md
```

The `/build` skill (at `skills/build/SKILL.md`) will:
1. Read the plan and extract what to build
2. Select the right agents from the roster
3. Define API contracts between agents (contract-first)
4. Create a shared task list
5. Spawn all agents in parallel using tmux split panes
6. Monitor, relay messages, and coordinate until done

### Step 5 — What to expect

- Your terminal splits into panes — one per agent (backend, frontend, mobile, etc.)
- Each agent reads its identity (`SOUL.md`), communication protocols (`AGENTS.md`), and playbooks (`SKILL.md`)
- Agents self-claim tasks from the shared list and message each other directly
- The tech-lead coordinates and synthesizes; you can message any agent directly with Shift+Down
- When all tasks are done, the lead cleans up and returns control to you

> **Token cost note**: Agent teams use 2–4× more tokens than a single session. For a full-stack build like the calendar assistant, budget accordingly. For smaller tasks, use 3 agents instead of the full 10.

### Interacting with the team

```
# Navigate between agents (in-process mode)
Shift+Down          — cycle to next agent
Escape              — interrupt current turn

# Navigate between tmux panes
Ctrl+B, arrow key   — move between panes
Ctrl+B, z           — zoom into one pane

# Task list
Ctrl+T              — toggle task list view

# Direct instructions
Click a pane (split mode) or Shift+Down to a teammate, then type directly
```

---

## Quick Start — Cursor

1. Clone the repo (same as above)
2. Open your project in Cursor
3. Rules in `rules/` auto-activate based on file context — no config needed:
   - Editing `*.test.*` files? The QA rule activates
   - Editing `Dockerfile` or CI config? The DevOps rule activates
   - Editing component files? The Frontend rule activates
4. Invoke a specific role manually: open the Cursor chat, type `@rules/backend.md` (or any other rule file) to bring that agent's expertise into context

---

## Quick Start — OpenClaw

1. Clone the repo
2. Open [OpenClaw](https://docs.openclaw.ai/) and import this repo
3. The `openclaw-config.json5` file at the root configures agent routing automatically
4. Start a conversation — OpenClaw will route to the right agent based on your message

---

## The Team

| Agent | Identity | Communication | Playbook | When to use |
|---|---|---|---|---|
| **tech-lead** | [SOUL](agents/tech-lead/SOUL.md) | [AGENTS](agents/tech-lead/AGENTS.md) | [SKILL](agents/tech-lead/skills/tech-lead/SKILL.md) | Always — lead orchestrator |
| **backend** | [SOUL](agents/backend/SOUL.md) | [AGENTS](agents/backend/AGENTS.md) | [SKILL](agents/backend/skills/backend/SKILL.md) | APIs, databases, business logic |
| **frontend** | [SOUL](agents/frontend/SOUL.md) | [AGENTS](agents/frontend/AGENTS.md) | [SKILL](agents/frontend/skills/frontend/SKILL.md) | Web UI, dashboards, forms |
| **mobile** | [SOUL](agents/mobile/SOUL.md) | [AGENTS](agents/mobile/AGENTS.md) | [SKILL](agents/mobile/skills/mobile/SKILL.md) | iOS/Android, offline-first |
| **architect** | [SOUL](agents/architect/SOUL.md) | [AGENTS](agents/architect/AGENTS.md) | [SKILL](agents/architect/skills/architect/SKILL.md) | System design, ADRs, scaling |
| **qa** | [SOUL](agents/qa/SOUL.md) | [AGENTS](agents/qa/AGENTS.md) | [SKILL](agents/qa/skills/qa/SKILL.md) | Always — test strategy, automation |
| **devops** | [SOUL](agents/devops/SOUL.md) | [AGENTS](agents/devops/AGENTS.md) | [SKILL](agents/devops/skills/devops/SKILL.md) | CI/CD, infra, observability |
| **designer** | [SOUL](agents/designer/SOUL.md) | [AGENTS](agents/designer/AGENTS.md) | [SKILL](agents/designer/skills/designer/SKILL.md) | UX/UI, flows, design system |
| **pm** | [SOUL](agents/pm/SOUL.md) | [AGENTS](agents/pm/AGENTS.md) | [SKILL](agents/pm/skills/pm/SKILL.md) | Discovery, specs, roadmap |
| **security** | [SOUL](agents/security/SOUL.md) | [AGENTS](agents/security/AGENTS.md) | [SKILL](agents/security/skills/security/SKILL.md) | Auth, threat model, compliance |

---

## How It Works

The key is **contract-first spawning**. The tech-lead:

1. Reads your plan and extracts components and their dependencies
2. Authors integration contracts upfront (exact API URLs, JSON shapes, data models) — before any agent writes code
3. Spawns all agents in parallel, each with their contract to produce AND the contracts they consume
4. Agents build simultaneously to agreed interfaces — no guessing, minimal integration mismatches

This is what makes the team work at senior level: agents don't start with a blank slate. Each loads its `SOUL.md` (identity and quality bar), `AGENTS.md` (how to communicate), and `SKILL.md` (operational playbooks for their domain).

Read the full build orchestration guide at [`skills/build/SKILL.md`](skills/build/SKILL.md).

---

## Example: Calendar Assistant

A smart calendar app with natural language event creation, recurring events, timezone support, and bidirectional Google Calendar / Outlook sync. Mobile-first with offline support.

**Full plan:** [`examples/calendar-assistant-plan.md`](examples/calendar-assistant-plan.md)

**Run it:**
```
/build examples/calendar-assistant-plan.md
```

**Team the plan spawns:** backend, frontend, mobile, architect, QA, DevOps, designer, security (+ tech-lead coordinating)

---

## Build Your Own Product

1. **Write a plan** — use `examples/calendar-assistant-plan.md` as a template. Include: what you're building, stack, components, dependencies, acceptance criteria.

2. **Run the build skill:**
   ```
   /build path/to/your-plan.md
   ```

3. **Optionally specify team size:**
   ```
   /build path/to/your-plan.md 4
   ```
   Limits the team to 4 agents (tech-lead always included). Useful for smaller features or when managing token cost.

4. **Let the team work** — watch agents coordinate in real time. Redirect any agent directly if needed.

---

## Repo Structure

```
jgcalice-agents/
├── agents/                  Agent definitions
│   ├── {role}/
│   │   ├── SOUL.md          Identity, quality bar, decision heuristics
│   │   ├── AGENTS.md        Communication protocols with other agents
│   │   ├── USER.md          Who you're helping (fill this in per project)
│   │   ├── MEMORY.md        Long-term decisions, ADRs, lessons
│   │   ├── memory/          Daily session notes (YYYY-MM-DD.md)
│   │   ├── skills/{role}/
│   │   │   └── SKILL.md     Operational playbooks and templates
│   │   └── tasks/
│   │       ├── todo.md      Current task tracking
│   │       └── lessons.md   Patterns learned from corrections
│
├── examples/
│   └── calendar-assistant-plan.md   Worked build plan (use as template)
│
├── rules/                   Cursor rules (auto-activate by file context)
│   └── {role}.md
│
├── skills/
│   └── build/
│       └── SKILL.md         /build command — orchestrates full team builds
│
├── .claude/
│   └── settings.json.example  Copy to settings.json to enable agent teams
│
├── deprecated/              Files no longer in active use (kept for reference)
│
├── openclaw-config.json5    OpenClaw workspace configuration
├── Claude.md                Project context (loaded by Claude on every session)
└── README.md                This file
```

---

## Troubleshooting

**Agent teams not appearing after enabling**
- Check that `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set in your `.claude/settings.json`
- Press Shift+Down — teammates may already be running in-process but not visible
- Verify tmux is installed: `which tmux`

**tmux panes not opening**
- Ensure you're already inside a tmux session before starting `claude`, OR let Claude create the tmux session itself
- Alternative: set `"teammateMode": "in-process"` in `.claude/settings.json`

**Permission prompts interrupting agents**
- Pre-approve common file operations before spawning. In Claude Code: run with `--dangerously-skip-permissions` flag only if you understand the risk, or approve individual operations as they appear

**Agents stopping on errors**
- Navigate to the stuck agent (Shift+Down or Ctrl+B arrow), read their output, and send them a message with additional context or instructions
- Spawn a replacement teammate to continue the work if needed

**Orphaned tmux sessions after team cleanup**
```bash
tmux ls                          # list all sessions
tmux kill-session -t <session>   # kill the orphaned one
```

---

## References

- [Claude Code agent teams docs](https://code.claude.com/docs/en/agent-teams)
- [OpenClaw docs](https://docs.openclaw.ai/)
- [Anthropic skills (GitHub)](https://github.com/anthropics/skills/tree/main/skills)
- [Create custom skills (Claude)](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)

---

## License

Use and adapt for your own applications. Replace this section with your chosen license if you publish the repo.
