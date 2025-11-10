import type { AuthService } from '@/services/contracts';

export const mockAuth: AuthService = {
  async signIn(email: string, _password: string) {
    // Return a deterministic student user for UI exploration
    return {
      id: 'u-student-1',
      name: email.split('@')[0] || 'Student',
      email,
      role: 'student',
    };
  },
  async signOut() {
    // no-op
  },
  async getSession() {
    // Start unauthenticated by default to keep Sign-In UI
    return null;
  },
};
