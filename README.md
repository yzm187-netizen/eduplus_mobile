# eduplus_mobile

EduPlus mobile app built with Expo Router (tabs), NativeWind, React Query, and Zustand.

## Quick start

- Install deps: `npm install`
- Start Expo (clear cache): `npx expo start -c`
- Open in Expo Go and scan the QR

### Troubleshooting

- If Metro says a port is in use, accept the prompt to use a different port.
- If styles don’t apply, ensure NativeWind Babel preset is present in `babel.config.js` and restart with cache clear.

## Notes

- Backend services are stubbed. The Sign In screen is UI-only and shows a placeholder.
- When ready, wire your auth/profile logic in `services/auth.ts` and `services/profile.ts`.
- Tabs are role-based under `app/(student)/(tabs)` and `app/(teacher)/(tabs)`.
