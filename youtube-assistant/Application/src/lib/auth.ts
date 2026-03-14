import { auth } from '@/auth';

export interface SessionUser {
  email: string;
  name: string;
  image: string;
  isAdmin: boolean;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  return {
    email: session.user.email,
    name: session.user.name || '',
    image: session.user.image || '',
    isAdmin: (session.user as unknown as Record<string, unknown>).isAdmin === true,
  };
}

export function isAdmin(user: SessionUser): boolean {
  return user.isAdmin;
}
