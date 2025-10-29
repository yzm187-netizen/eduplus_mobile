# eduplus_mobile

EduPlus mobile app built with Expo Router (tabs), NativeWind, React Query, and Zustand.

Quick start

- Install deps: npm install
- Start Expo (clear cache): npx expo start -c
- Open in Expo Go and scan the QR

Notes

- Backend services are stubbed. The Sign In screen is UI-only and shows a placeholder.
- When ready, wire your auth/profile logic in `services/auth.ts` and `services/profile.ts`.
- Tabs are role-based under `app/(student)/(tabs)` and `app/(teacher)/(tabs)`.
