#!/bin/sh
# Container entrypoint: apply migrations, optionally seed a synthetic demo
# patient, then start the server. Never seeds real PHI (SEED_DEMO gates it).
set -e

echo "→ Applying database migrations (prisma migrate deploy)…"
n=0
until npx prisma migrate deploy; do
  n=$((n + 1))
  if [ "$n" -ge 12 ]; then
    echo "✗ Database not reachable after retries — check DATABASE_URL." >&2
    exit 1
  fi
  echo "  database not ready yet, retrying in 3s ($n/12)…"
  sleep 3
done

if [ "$SEED_DEMO" = "true" ]; then
  echo "→ Seeding a synthetic demo patient (SEED_DEMO=true)…"
  node prisma/demo-seed.mjs || echo "  (demo seed skipped/failed — continuing)"
fi

echo "→ Starting HealthPassport Pro on http://0.0.0.0:3000"
exec npx next start -H 0.0.0.0 -p 3000
