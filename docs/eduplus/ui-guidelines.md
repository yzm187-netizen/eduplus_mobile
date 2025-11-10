# EduPlus – UI Guidelines

These guidelines keep the app sleek, consistent, and fast to build. They align with NativeWind (Tailwind for RN) and our minimal UI primitives.

## Core principles
- Prioritize clarity and function over decoration
- Use consistent radii, spacing, and typography
- Keep contrast and accessibility (dark mode first-class)
- Prefer our primitives (Card, Button, SectionHeader, Empty/Error/Loading) before bespoke UI

## Design tokens (Tailwind classes)
- Radius: rounded-2xl for primary surfaces; rounded-xl for chips/pills; rounded-md for controls
- Spacing: default padding p-4 on cards; gutters gap-3/4; page padding px-4
- Colors:
  - Primary: emerald-600 (actions), emerald-700 (press), emerald-500 (hover/web)
  - Surfaces: bg-white dark:bg-neutral-900; page: bg-neutral-50 dark:bg-black
  - Borders: border-neutral-200 dark:border-neutral-800
  - Text: neutral-800/700; subdued: neutral-500; dark: neutral-100/300/400
- Shadows: avoid heavy shadows on RN; use subtle borders and elevation when needed
- Icons: Ionicons by default; keep size 16–24px, neutral-500 for secondary

## Primitives usage
- Card
  - Rounded surface with border and background; default padded
  - Use Card for any grouped content block (lists, forms, summaries)
- Button
  - Variants: primary, secondary, ghost, danger; sizes sm/md/lg
  - Don’t use raw Pressable with ad-hoc styles for call-to-actions
- SectionHeader
  - Consistent section title + optional subtitle/right action
- EmptyState / ErrorState / LoadingSpinner
  - Use across lists and detail views; avoid inline text-only placeholders

## Patterns
- Lists in cards
  - Use one Card wrapping the list; rows separated by a thin divider (border-neutral-100 dark:border-neutral-800)
- Pills and chips
  - Use rounded-full/rounded-xl; keep compact (px-3 py-1, text-xs)
- Progress
  - Use the shared ProgressBar; keep labels compact (text-xs) and neutral-500
- Forms and actions
  - Group controls in a Card; primary action at the bottom or top-right via Button

## Dark mode
- Always pair bg/text/border with dark: variants
- Avoid pure black text on white; use neutral-800/700 for better reading

## Do / Don’t
- Do: reuse Card/SectionHeader for consistency
- Do: keep paddings to p-4; use consistent gaps
- Don’t: mix multiple corner radii in the same block
- Don’t: introduce new ad-hoc colors without mapping to tokens

## References
- Gluestack UI (NativeWind-based) – modern, accessible patterns
- BNA UI – clean primitives with Expo/TypeScript
- React Native Reusables – accessible components with NativeWind
