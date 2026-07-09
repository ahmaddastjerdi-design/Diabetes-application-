import type { TranslationKey } from '../i18n/types';

export interface NavItem {
  path: string;
  labelKey: TranslationKey;
  icon: string; // emoji glyph; swapped for an icon set in a later polish pass
}

/** Primary navigation — the five top-level sections of the patient app. */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: '🏠' },
  { path: '/record', labelKey: 'nav.record', icon: '📁' },
  { path: '/care', labelKey: 'nav.care', icon: '🩺' },
  { path: '/learn', labelKey: 'nav.learn', icon: '📚' },
  { path: '/report', labelKey: 'nav.report', icon: '📄' },
] as const;
