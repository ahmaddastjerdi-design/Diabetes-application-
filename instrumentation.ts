/**
 * Runs once when the server starts. Importing the env module validates the
 * environment (and throws on invalid config outside the build phase).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('@/lib/security/env');
  }
}
