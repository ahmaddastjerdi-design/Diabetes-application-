import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed reference/dev data only. NEVER seed real PHI (docs/DATABASE_SCHEMA.md §6).
 * V1 has no reference tables that require seeding yet; this is a safe no-op that
 * verifies connectivity and provides a home for future value-set seeds.
 */
async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.warn('Seed complete: no reference data required for V1.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
