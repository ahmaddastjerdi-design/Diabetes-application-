/**
 * db.ts — the Postgres connection pool (Vol 4 §database). Infra layer: requires `pg`
 * and is built via tsconfig.full.json (CI/production), not the sandbox core typecheck.
 */
import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // TODO(Vol 8): require TLS to the database in production (ssl: { rejectUnauthorized: true }).
});

export type { Pool } from "pg";
