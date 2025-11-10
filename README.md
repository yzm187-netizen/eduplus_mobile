# eduplus_mobile

EduPlus mobile app built with Expo Router (tabs), NativeWind, React Query, and Zustand.

## Configuration

- API base URL
	- Set under `app.json` at `expo.extra.API_BASE_URL`.
	- Read by `CONFIG.API_BASE_URL` (see `utils/config.ts`) and used by `lib/http.ts` for live service calls.
- Data source mode
	- Global: `EXPO_PUBLIC_API_MODE` in `.env` — `mock` (default) or `live`.
	- Per-service override (chat): `EXPO_PUBLIC_CHAT_MODE` in `.env` — `mock` or `live`. When set to `live`, chat uses the live adapter even if the global mode is `mock`.
- Where it’s wired
	- Services are selected in `services/providers.ts` based on these env flags.
	- Live chat adapter is implemented in `services/live/chat.ts` and uses `lib/http.ts`.

Example `.env`:

```
EXPO_PUBLIC_API_MODE=mock
EXPO_PUBLIC_CHAT_MODE=mock
```

Example `app.json` extra:

```
{
	"expo": {
		"extra": {
			"API_BASE_URL": "http://localhost:3000"
		}
	}
}
```

## Quick start

- Install deps: `npm install`
- Start Expo (clear cache): `npx expo start -c`
- Open in Expo Go and scan the QR

### Troubleshooting

- If Metro says a port is in use, accept the prompt to use a different port.
- If styles don’t apply, ensure NativeWind Babel preset is present in `babel.config.js` and restart with cache clear.

## Notes

- Backend services are stubbed. The Sign In screen is UI-only and shows mock-mode behavior.
- When ready, wire your auth/profile logic in `services/auth.ts` and `services/profile.ts`.
- Tabs are role-based under `app/(student)/(tabs)` and `app/(teacher)/(tabs)`.

### What’s implemented now

- Student Home: banner snapshot (3 metrics), scrollable notifications with badges, and course cards; taps route into stub course/assignment screens. Pull-to-refresh and relative timestamps for notifications are included.
- Calendar: agenda list + month/grid toggle, with marked due dates. Pull-to-refresh. Due dates show formatted date plus relative time (e.g., “Due Nov 12, 09:00 · in 5d”).
- Course/Assignment flows: `/(student)/course/[courseId]` and `/(student)/course/[courseId]/assignments/[assignmentId]`. Assignments list uses pull-to-refresh and relative due dates.
- Lessons: Course lessons outline + Notes list; tap opens an in-app note viewer (markdown/plain text). PDF preview is supported via a WebView-based screen when provided a remote URL (see Content & Preview).

### Switching between mock and live services

- We use a provider to swap data sources without touching UI.
- Set `EXPO_PUBLIC_API_MODE=mock` (default) or `live` in your `.env`.
- UI calls `Services.*` (see `services/providers.ts`). Implement live adapters under `services/*` when backend is ready.

### Demo data and persistence

- Mock data is interactive and persisted locally with AsyncStorage via Zustand. This includes:
	- Profile: name, email, avatar image
	- Assignments: section versions, nested checklist states, and progress
	- Settings: theme, notifications, large text, language
	- Chat: threads and messages
- You can reset demo data from the Profile tab ("Reset demo data"). This restores assignment progress and chat to defaults.

### Minor utilities

- Date helpers in `utils/date.ts`: `formatDateTime` and `formatRelativeShort` used across Home, Calendar, and Assignments for consistent display without extra deps.

### Content & Preview
- In Expo Go, native document viewers aren’t available. We render notes as markdown/plain text. Images are supported via the Image component.
- For PDFs: use a WebView with a remote URL (a PDF viewer route is available), or switch to a dev client with a native PDF module (e.g., react-native-pdf) if needed.

### Mock Academic Dataset
- `data/academics.ts` includes: teachers, students (with programs), enrollments per course (program-consistent cohorts), lessons, notes (teacher vs student; visibility), and assignment rubrics.
- `Services.content` exposes: listLessons, listNotes, getNote, getRubric, and listPeople.

## Design & Structure docs
- UI Guidelines: `docs/eduplus/ui-guidelines.md` — tokens, primitives, and patterns for a sleek, consistent UI.
- Project Structure: `docs/eduplus/structure.md` — folder purposes, scaling tips, and references (Ignite, TCM boilerplate, Rocket.Chat, Bluesky, Gluestack UI).

## Contributing
- See `CONTRIBUTING.md` for local setup, scripts, UI conventions, and a PR checklist.
- TL;DR: keep changes small, run `npm run lint && npm run typecheck`, and avoid copy that promises "later"—either implement a thin working slice or clearly mark it as mock.
