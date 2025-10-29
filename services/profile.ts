// Empty profile service stubs: keep types simple and avoid external SDKs.
export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
};

export async function getProfile(_userId: string): Promise<UserProfile | null> {
  return null;
}

export async function createProfile(_params: { id: string; name: string; email: string; role?: UserProfile['role'] }) {
  throw new Error('Profile connection not configured yet');
}

export async function getOrCreateProfile(_user: { $id: string; name: string; email: string }): Promise<UserProfile> {
  throw new Error('Profile connection not configured yet');
}
