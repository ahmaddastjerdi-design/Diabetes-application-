/**
 * migrate.ts — minimal forward-only migration runner (Vol 4 §database).
 * Applies db/migrations/*.sql in order inside a transaction, tracking applied files in
 * schema_migrations. Idempotent: re-running applies only new migrations. Run via
 * `npm run migrate` (after `npm run build:full`).
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const migrationsDir = fileURLToPath(new URL("../../db/migrations/", import.meta.url));

export async function migrate(): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())"
    );
    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const { rowCount } = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [file]);
      if (rowCount) continue;
      const sql = await readFile(new URL(file, new URL("../../db/migrations/", import.meta.url)), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        applied.push(file);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
    return applied;
  } finally {
    client.release();
  }
}

// Allow running directly: `node dist-full/infra/migrate.js`.
if (process.argv[1] && process.argv[1].endsWith("migrate.js")) {
  migrate()
    .then((applied) => {
      console.log(applied.length ? `Applied: ${applied.join(", ")}` : "No new migrations.");
      return pool.end();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
