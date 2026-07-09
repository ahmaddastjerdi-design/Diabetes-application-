import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';

// jsdom ships a Crypto with getRandomValues but no SubtleCrypto. Provide the
// Node Web Crypto implementation so the encryption layer runs under test.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

// jsdom does not implement matchMedia; provide a no-op so components that
// query reduced-motion / color-scheme preferences work under test.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
