# Study Planner

A personal academic organizer for students to plan their semester, track study progress, keep notes, and prepare for exams.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/study-planner run dev` — run the frontend (port 18986)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- DB schema: `lib/db/src/schema/index.ts`
- API spec: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/api.ts`
- Frontend: `artifacts/study-planner/src/`
- Backend routes: `artifacts/api-server/src/routes/`

## Architecture decisions

- All data stored in PostgreSQL via Drizzle ORM — no localStorage
- Themes (5 variants) applied via CSS variables on the body element
- Photo uploads in notes stored as base64 data URLs in the DB
- Data backup via JSON export/import through the API
- Progress computed server-side by counting completed topics per subject

## Product

- **Home**: Exam countdown, today's task list, course progress per subject
- **Course Outline**: Subjects + topics with checkboxes (edit/delete inline)
- **Notes**: Per-subject notes with photo attachment support
- **Weekly Routine**: Saturday–Friday schedule builder
- **Resources**: Free/paid external links per subject and topic
- **Backup**: JSON export/import, Gmail summary link, full data reset

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before touching the frontend
- The `data/reset` route deletes subjects (which cascades), exams, and settings

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
