import { useEffect } from 'react';

// Keep auth initialization side-effect free until a real backend is wired.
// This hook intentionally does nothing so the app can render the sign-in UI
// without attempting any network calls or mock behavior.
export function useAuthInit() {
  useEffect(() => {
    // no-op
  }, []);
}
