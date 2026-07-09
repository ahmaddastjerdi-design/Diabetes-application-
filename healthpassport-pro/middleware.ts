import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Runs the edge-safe auth (the `authorized` callback protects app routes).
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((_req) => {
  // The `authorized` callback in authConfig handles allow/redirect. Nothing
  // more to do here; returning undefined lets the request proceed.
});

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
