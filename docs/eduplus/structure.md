# EduPlus – Project Structure

This structure balances Expo Router conventions with a scalable, feature-conscious layout. It draws on patterns from Ignite, TheCodingMachine RN boilerplate, and large OSS apps.

## High-level layout
- app/                     # Expo Router routes (student/teacher tab groups, stacks)
- components/              # Reusable UI components
  - ui/                    # Design primitives (Card, Button, SectionHeader, states)
- content/                 # Static JSON for lessons/decks/rubrics used in mock mode
- data/                    # Mock datasets (academics, sample stats)
- docs/                    # Documentation (screens, flows, schema, UI guidelines)
- hooks/                   # Reusable hooks
- providers/               # App-wide providers (theme, query, etc.)
- scripts/                 # Node scripts (PDF generators, seeders)
- services/                # Service contracts + mock/live providers
- store/                   # Zustand stores (UI/feature states)
- theme/                   # Theme tokens/utilities (future)
- types/                   # Shared TypeScript types (e.g., tasks)
- utils/                   # Small utilities (date, tasks)

## Routing (feature entrypoints)
- app/(student)/(tabs)/...    # Student tabs
- app/(student)/course/...    # Course hub and flows
- app/(teacher)/(tabs)/...    # Teacher tabs
- app/(auth)/...              # Auth flows (sign-in/role select)

Feature logic should live near services/store/utils, while screens remain thin and declarative.

## Services and state
- services/contracts.ts       # Interfaces for Auth, Courses, Assignments, Content, etc.
- services/providers.ts       # env switch (mock/live) and adapter wiring
- services/mock/*             # Mock adapters backed by data/ + content/
- store/*                     # UI + ephemeral state via Zustand

Keep service interfaces stable; swap providers without changing screens.

## UI system
- components/ui/*             # Primitives only; no business logic
- components/*                # Feature-agnostic building blocks (Charts, Slides, etc.)

Prefer primitives over ad-hoc styles for consistency and speed.

## Scaling tips
- Group complex domain logic under features if shared across routes (e.g., features/assignments with hooks, mappers, service facades). Create a top-level features/ only when needed.
- Add barrels (index.ts) for commonly imported modules.
- Introduce a /src alias only if we outgrow the current Expo Router layout. Current @/ alias points to repo root to keep imports short.
- Keep tests near code or under __tests__/ subfolders.

## Linting/formatting/testing
- ESLint + Prettier recommended; jest-expo with @testing-library/react-native for components
- Consider MSW for request mocking in tests

## Backend integration
- Mirror service contracts to your backend API (OpenAPI recommended)
- For hierarchical tasks, use a separate collection (section_tasks) with parentId and path fields; see schema.md

## References
- Ignite by Infinite Red – opinionated large-scale structure
- TheCodingMachine RN Boilerplate – clear separation by feature and layer
- Rocket.Chat.ReactNative – real-world, performance-oriented app
- Bluesky Social App – modern RN app architecture
- Gluestack UI – component-driven examples
