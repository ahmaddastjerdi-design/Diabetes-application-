/**
 * hash.ts — tiny dependency-free deterministic hash for idempotency keys and the
 * audit hash-chain (Vol 4). NOT a cryptographic hash; the real audit chain upgrades
 * this to SHA-256 once the Node crypto layer is wired (see server.ts / Vol 8).
 */
export function djb2(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}
