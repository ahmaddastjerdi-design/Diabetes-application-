import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // This app is nested inside a larger repo with its own lockfile; pin the
  // tracing root to this project so Next doesn't infer the parent directory.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Security headers applied to every route. CSP is intentionally strict; it is
  // revisited when third-party origins (if any) are introduced.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Frame-Options', value: 'DENY' },
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
