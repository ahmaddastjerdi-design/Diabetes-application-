import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Content-Security-Policy. No third-party origins are used, so everything is
// same-origin. NOTE: 'unsafe-inline' on script-src is required because Next's
// framework bootstrap uses inline scripts without a nonce; upgrading to a
// nonce-based CSP (via middleware) is a tracked follow-up (SECURITY_CHECKLIST §6).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // (HTTPS is enforced by HSTS + the hosting layer; 'upgrade-insecure-requests'
  // is omitted so the app also works over plain HTTP in CI/local.)
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // This app is nested inside a larger repo with its own lockfile; pin the
  // tracing root to this project so Next doesn't infer the parent directory.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Security headers applied to every route.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), camera=(), microphone=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
