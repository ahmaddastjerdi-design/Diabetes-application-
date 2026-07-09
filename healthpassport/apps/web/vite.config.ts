import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// HealthPassport Pro — patient PWA build config.
// Offline-first: the app shell is precached; data lives locally (encrypted).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Pin esbuild's tsconfig for app-code transforms so it doesn't inherit the
  // sibling Expo project's config. (A cosmetic esbuild warning about
  // "expo/tsconfig.base" can still appear during config bundling because this
  // product is nested inside that repo; it does not affect the build output.)
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        jsx: 'react-jsx',
        useDefineForClassFields: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icon.svg', 'robots.txt'],
      manifest: {
        name: 'HealthPassport Pro',
        short_name: 'HealthPassport',
        description:
          'Own your personal health record and manage chronic conditions — private, offline-first, and physician-ready.',
        theme_color: '#0e7490',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['health', 'medical', 'lifestyle'],
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // PHI is never cached in the service worker — it lives only in the
        // encrypted IndexedDB store. We precache the app shell and static assets.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/safety/**', 'src/infrastructure/**'],
    },
  },
});
