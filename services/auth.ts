import { useAuthStore } from '@/store/useAuthStore';

// Empty service stubs: no external connections, safe to import, compile-only.
export async function signUpWithEmail(_email: string, _password: string, _name?: string) {
  throw new Error('Auth connection not configured yet');
}

export async function signInWithEmail(_email: string, _password: string) {
  throw new Error('Auth connection not configured yet');
}

export async function getCurrentUser(): Promise<null> {
  return null;
}

export async function signOut() {
  // Local sign-out only; no backend call
  useAuthStore.getState().signOut();
}

export async function initAuthFromSession() {
  // No session probing until a backend is wired
  useAuthStore.getState().setUser(null);
}
