# Repository Guidelines

## Project Structure & Module Organization
- Root docs: `Blueprint.md` defines product scope and flows.
- Suggested layout as code lands:
  - `apps/web` (buyer + builder UI, e.g., Next.js)
  - `apps/api` (SaaS backend/API)
  - `packages/ui` (shared React/UI components)
  - `packages/core` (domain models, validation, CSV import)
  - `tests/` (cross‑app e2e + utilities)
  - `infra/` (IaC, Docker, DB migrations)
  - `scripts/` (CLIs, data import/export)

## Build, Test, and Development Commands
- Node monorepo (recommended):
  - `pnpm i` — install deps.
  - `pnpm dev` — start all apps in watch mode.
  - `pnpm build` — production build for all packages.
  - `pnpm test` — run unit tests; `pnpm test:e2e` for end‑to‑end.
  - `pnpm lint` / `pnpm format` — lint and format.
- Docker (optional):
  - `docker compose up -d` — bring up DB and dependencies.

Add matching scripts in each app/package to keep these commands consistent.

## Coding Style & Naming Conventions
- Languages: TypeScript first for apps/packages; keep strict type checking on.
- Formatting: Prettier; 2‑space indent; LF line endings; `.editorconfig` required.
- Linting: ESLint with TypeScript rules; no unused exports; no `any`.
- Naming: `kebab-case` for files/dirs, `camelCase` for vars/functions, `PascalCase` for React components/types, `UPPER_SNAKE_CASE` for env.
- Modules: keep domain logic in `packages/core`; UI is dumb/presentational when possible.

## Testing Guidelines
- Unit: Jest/Vitest; files `*.spec.ts` colocated with source.
- E2E: Playwright in `tests/e2e`; files `*.e2e.ts`.
- Coverage: target ≥80% lines/branches for core logic; exclude generated code.
- Commands: `pnpm test -- --watch`, `pnpm test:coverage`.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat(api): csv import validation`).
- PRs: clear summary, linked issue, steps to test, screenshots for UI, and notes on data/infra migrations. Keep PRs focused and <500 LOC when feasible.
- CI must pass: lint, typecheck, tests, and build.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` for dev; load via `dotenv`. Store prod secrets in your secret manager.
- Validate external input (CSV uploads, forms) with a schema (e.g., Zod) at API boundaries.
- Add role checks for builder vs. buyer surfaces; audit log sensitive actions.

## Agent Notes
- Treat `Blueprint.md` as the product source of truth.
- Prefer minimal, targeted changes; do not rename files or move modules broadly without discussion.
- Before adding deps or scaffolding, propose the plan in the PR description.

## Agent-Specific Instructions
- Ask fewer questions: default to sensible assumptions and proceed. Only ask when a decision blocks progress or has high impact.
- Always create and maintain a concise task list (plan) with clear statuses (pending/in_progress/completed).
- Use short progress updates and preambles; keep responses action-oriented and brief.
- Avoid placeholders and TODOs; deliver complete implementations or clearly state constraints and chosen assumptions.

## Working Style
- Be concise and decisive: ship value in small, verifiable increments.
- Prefer surgical changes over broad refactors; minimize churn and preserve style.
- Keep PRs focused with clear scope, rationale, and step-by-step plan updates.
- Validate changes where possible (build, migrate, minimal runbooks); document assumptions.
- Communicate blockers early with proposed options and a recommendation.
