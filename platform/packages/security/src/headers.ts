/**
 * headers.ts — baseline HTTP security headers (Vol 8 / OWASP). Servers apply these to
 * every response. API responses carry no HTML, so the CSP is maximally restrictive.
 */
export function securityHeaders(): Record<string, string> {
  return {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
  };
}
