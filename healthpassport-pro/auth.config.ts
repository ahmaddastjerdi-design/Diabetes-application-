import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@prisma/client';

/** Route groups that require an authenticated session. */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/onboarding',
  '/profile',
  '/records',
  '/track',
  '/guide',
  '/reports',
  '/settings',
  '/privacy-security',
];

/**
 * Edge-safe base config shared by middleware and the Node auth instance. It
 * contains NO database or Node-only code (bcrypt/Prisma live in auth.ts), so it
 * can run in the middleware/edge runtime.
 */
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    // Server-side route protection. Returning false redirects to signIn.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isProtected = PROTECTED_PREFIXES.some(
        (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(`${p}/`),
      );
      if (isProtected) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.role =
          (token.role as Role | undefined) ?? session.user.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
