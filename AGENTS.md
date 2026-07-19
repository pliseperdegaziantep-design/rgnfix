# AGENTS.md

## Project overview

RGN AI is a Turkish full-stack web application for plise curtain consultation, measurement, pricing, color advice, installation guidance, dealer discovery, and ordering.

## Working agreements

- Use Turkish for user-facing product copy unless the task explicitly asks otherwise.
- Preserve the React + Vite + Express + tRPC architecture.
- Prefer `pnpm` and keep `pnpm-lock.yaml` in sync when dependencies change.
- Do not add production dependencies without a clear reason.
- Keep demo-mode fallbacks working when `DATABASE_URL`, OAuth, AI, map, or storage variables are missing.

## Commands

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Type check: `pnpm check`
- Tests: `pnpm test`
- Production build: `pnpm build`
- Production start: `pnpm start`
- Database migrations: `pnpm db:push`

## Environment

- Copy `.env.example` to `.env` for local development.
- `DATABASE_URL` is optional for demo mode but required for persistent data.
- OAuth variables are optional because guest checkout is supported.
- Forge/Manus-compatible AI, map, and storage variables are optional; the app has visible fallbacks when they are absent.

## Code style

- Keep TypeScript strictness compatible with the existing `tsconfig.json`.
- Use existing UI primitives from `client/src/components/ui` before introducing new component libraries.
- Keep business rules for fabrics, measurement, and pricing aligned across shared constants, server routes, and client pages.
- Price calculations must preserve the existing rules:
  - round dimensions up to the nearest 5 cm,
  - minimum billable area is 1 m²,
  - shipping is free above 3,000 ₺,
  - slim case surcharge is 60 ₺/m².

## Validation checklist

Before handing off changes, run when dependencies are available:

1. `pnpm check`
2. `pnpm test`
3. `pnpm build`

If a command cannot be run, state the reason clearly in the handoff.
