/** Generate a RFC-4122 v4 id using the platform CSPRNG. */
export function newId(): string {
  // crypto.randomUUID is available in all PWA-capable browsers and Node 20+.
  return crypto.randomUUID();
}

/** ISO-8601 instant for "now". */
export function nowInstant(): string {
  return new Date().toISOString();
}
