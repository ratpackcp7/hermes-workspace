# AGENTS.md — Hermes Workspace

## Purpose

React/TanStack Start frontend for Hermes Agent. Provides a unified workspace with chat interface, memory browser, skills explorer, terminal, and orchestration UI. Connects to the Hermes gateway via SSE streaming.

Serves as the primary web interface for interacting with Bob (Hermes agent), viewing session history, and managing agent skills and memory. Accessed directly via Tailscale at port 3002.

## Before You Start

> **Agent pre-flight:**
> 1. Read `HANDOFF.md` — current branch state, done/in-flight tasks, next steps
> 2. Run `git log --oneline -10` — confirms actual committed state
> Do NOT assume feature status from the README — HANDOFF.md is the source of truth.

- Read `HANDOFF.md` for current work status (branch, done/in-flight/next)
- Read `FEATURES-INVENTORY.md` for full feature list
- Read `FUTURE-FEATURES.md` for backlog

## Key Facts
- **Port**: 3002 | **URL**: hermes-workspace is accessed directly via Tailscale (no cp7.dev tunnel)
- **Stack**: React 19, TanStack Start, TanStack Router, Vite 7, TypeScript, Tailwind v4, pnpm
- **Database**: None — all state in Hermes gateway (`localhost:8642`)
- **Deploy**: `pnpm dev` (dev) | `pnpm build && pnpm start` (prod)
- **Tests**: `pnpm test` (vitest — 25 tests)
- **Gateway dependency**: Hermes Agent gateway must be running at `localhost:8642`

## Architecture

```
src/
  routes/          — TanStack Router file-based routes
    _app/          — authenticated shell (WorkspaceShell)
    api/           — server-side API routes (SSE proxy, model-info, etc.)
  components/      — shared UI components
  stores/          — Zustand global state
  lib/             — gateway client, SSE streaming, auth
vite.config.ts     — custom plugin: spawns companion gateway on dev start
```

SSE streaming flows: Hermes gateway → `/api/stream` proxy → client EventSource → chat message renderer.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Dev/prod server port |
| `HERMES_GATEWAY_URL` | `http://localhost:8642` | Hermes gateway base URL |
| `VITE_AUTH_SECRET` | — | Auth token for API routes |

See `.env.example` for full list.

## Deployment

```bash
# Dev
pnpm dev

# Production build
pnpm build
pnpm start

# Docker (pulls pre-built image)
docker compose up
```

## External Dependencies
- **Hermes gateway** (`localhost:8642`) — all chat, memory, skills, jobs, sessions. Workspace is non-functional without it.
- **Honcho** (`localhost:8000`) — memory backend, accessed via gateway

## Agents and Crons

None.

## Gotchas

- Workspace is non-functional without Hermes gateway running at `localhost:8642`.
- SSE streaming requires a live gateway connection — dropped connections manifest as silent chat failures.
- `pnpm build` must succeed before tagging a release.
- Do not commit to `main` directly — work on feature branches.

## Active Work

See `HANDOFF.md` for current work status and next steps.

## Decisions

See docs/decisions/.
No ADRs exist yet.

## Rules
- One commit per task
- `pnpm test` must pass before committing (25/25)
- `pnpm build` must succeed before tagging a release
- Do not commit to `main` directly — work on feature branches

<!-- CP7-AGENT-STANDARDS:START -->

## CP7 Agent Standard

Before behavior changes, read `/home/chris/cp7-bridge/docs/agent-standards/AGENT-OPERATING-STANDARD.md`, this project's README/HANDOFF, and `docs/decisions/`.

Create or update an ADR for changes to ports, bind addresses, tunnels, Docker Compose, volumes, healthchecks, systemd, timers, persistent data paths, MCP tools, auth, allowlists, writable roots, or unusual config.

Every change report must include what changed, why, verification, rollback, and touched files/services.

Verifier:

```bash
/home/chris/cp7-bridge/scripts/verify_agent_standards.sh
```

<!-- CP7-AGENT-STANDARDS:END -->
