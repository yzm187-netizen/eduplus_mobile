# Contributing to EduPlus Mobile

Thanks for helping improve EduPlus! This guide covers local setup, code style, and what we look for in pull requests.

## Setup
- Node 18+ recommended.
- Install deps: `npm install`
- Start the app: `npm start`
- Open in Expo Go (QR) or a simulator.

## Scripts
- Lint: `npm run lint`
- Format: `npm run format`
- Typecheck: `npm run typecheck`

Run lint and typecheck before pushing.

## Code style
- ESLint and Prettier are configured; commit formatted code.
- Prefer TypeScript types and narrow props.
- Keep components small and composable; extract UI primitives when reused.

## UI guidelines
- Use the shared primitives in `components/ui` (Button, Card, SectionHeader, EmptyState, ErrorState, LoadingSpinner) for consistency.
- See `docs/eduplus/ui-guidelines.md` for spacing, typography, and tone.

## Architecture
- Expo Router for navigation (tabs + stacks). Student/Teacher routes are split using route groups.
- State: Zustand (lightweight global state) + React Query for async/cache.
- Services: UI calls `services/providers.ts` which swaps `mock` vs `live` adapters via `EXPO_PUBLIC_API_MODE`.
- Data shapes and flows: `docs/eduplus/structure.md` and `docs/eduplus/flows.md`.

## Folder roles & boundaries
Keep one folder per purpose. If in doubt, prefer these homes:

- app/ — Routes and screens (navigation only). Do not import from here; move shared code elsewhere.
- assets/ — Static media (images, fonts).
- components/ — Reusable UI. Use `components/ui` for primitives and feature subfolders (e.g., `components/chat`).
- store/ — Global state (Zustand).
- services/ — API contracts (`contracts.ts`) and implementations (`mock/`, `live/`).
- providers/ — App-level providers/DI wiring around services.
- data/ — Mock/sample data consumed at runtime.
- lib/ — Reusable pure helpers (date, tasks, config, formatting). Prefer this over `utils/`.
- styles/ — Styling system wiring (NativeWind/Tailwind interop, theme tokens).
- constants/ — Static constants (no env access).
- types/ — Shared TS types and env declarations.
- scripts/ — Node scripts (seed, generate).
- docs/ — Documentation (flows, schema, screens, architecture).

Light guardrails (warn-only in ESLint):
- Avoid importing from `@/utils/*` — prefer `@/lib/*`.
- Avoid importing from `@/app/*` — screens should export nothing for reuse; move shared logic to `components/`, `lib/`, `services/`, or `providers/`.

## Content & preview
- In Expo Go, documents render via in-app viewers. PDFs are previewed using a WebView with a remote URL. For native PDF modules, use a dev client.

## Data & content conventions

- Domain seeds (typed lists that mirror backend rows): put in `data/*.ts`.
	- Examples: courses, assignments (title, dueAt, description), people, schedules, enrollments.
	- Why TS: strong typing, refactors safely, keeps shapes evolving with the app.
- Content assets (large/editor-authored blobs): put in `content/**/*.json`.
	- Examples: rubrics JSON, slide decks JSON, long-form text or docs.
	- Why JSON: language-agnostic, easy to author and to seed into a backend.
- Access via services only: components/pages call `Services.*`.
	- Mock services read from `data/*` and `content/*`.
	- Live services call a backend (HTTP/Appwrite). UI doesn’t import files directly.
- Naming conventions
	- Rubrics: `content/rubrics/<assignmentId>_rubric.json`
	- Decks: `content/slides/<courseId>_<lessonId>_deck.json`

### Seeding a backend (Appwrite)

- Keep `data/*` and `content/*` as the single source for mock mode and seeding.
- Use a seed script to upsert these into Appwrite so teachers can edit them later.
	- See `scripts/seed-appwrite.ts` for a typed seed payload and adapter interface.
	- Implement an Appwrite adapter (create/update) and run in a Node/CI context.
	- After seeding, flip env flags to live (globally or per service) with no UI changes.

## PR checklist
- [ ] Clear, user-facing summary of change (what the user sees/gets)
- [ ] Screenshots or short screen capture for UI changes
- [ ] Lint + typecheck pass locally (`npm run lint && npm run typecheck`)
- [ ] No dead-ends: copy should not say “will add later.” Prefer "mocked" or implement a thin placeholder that actually works.
- [ ] Updated docs if behavior or contracts changed (`docs/eduplus/*`)

## Testing
- Unit tests are welcome for utilities (e.g., `utils/tasks.ts`). If adding tests, colocate under the relevant folder in a `__tests__` subfolder.

## Branching
- Use short, descriptive branches like `feat/assignments-persist`, `fix/pdf-viewer-params`, or `docs/ui-guidelines`.
- Squash merge preferred.

## Questions
Open an issue or start a draft PR to discuss approach early. We value small, focused PRs with clear scope.
