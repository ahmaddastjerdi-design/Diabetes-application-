import bcrypt from 'bcryptjs';

// bcryptjs is a pure-JS implementation (no native build) — portable across
// serverless/edge-adjacent runtimes. Cost 12 balances security and latency.
const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
