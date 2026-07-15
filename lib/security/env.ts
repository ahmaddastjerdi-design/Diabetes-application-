import { z } from 'zod';

/**
 * Server-side environment validation. The app refuses to start with invalid
 * config (docs/SECURITY_CHECKLIST.md §5). Validation is skipped during the
 * Next.js build phase, where secrets are not present and no requests run.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  AUTH_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function loadEnv(): ServerEnv {
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const skip = process.env.SKIP_ENV_VALIDATION === 'true' || isBuildPhase;

  // NextAuth accepts AUTH_SECRET or NEXTAUTH_SECRET; normalize.
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: secret,
    AUTH_URL: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    if (skip) {
      // Return a permissive shape during build; runtime paths re-validate.
      return {
        DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://build:build@localhost:5432/build',
        AUTH_SECRET: secret ?? 'build-placeholder',
        NODE_ENV: (process.env.NODE_ENV as ServerEnv['NODE_ENV']) ?? 'production',
      };
    }
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment configuration. See docs/DEPLOYMENT.md.');
  }
  return parsed.data;
}

export const env = loadEnv();
