import { redirect } from 'next/navigation';
import { auth } from '@/auth';

/**
 * Fetch the current session's user or redirect to login. Use in Server
 * Components / Server Actions that require an authenticated patient. This is the
 * server-side authorization boundary — never trust the client (SECURITY §2).
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  return session.user;
}

/** The current user id, or null if unauthenticated. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
