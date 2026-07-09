import type { LocaleCode } from '../i18n/types';

// Persian uses the Gregorian calendar here for clinical clarity; digit shaping
// follows the locale. Swap to a Persian calendar in a later localization pass.
function intlLocale(locale: LocaleCode): string {
  return locale === 'fa' ? 'fa-IR' : 'en-US';
}

export function formatDate(iso: string | undefined, locale: LocaleCode): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(iso: string, locale: LocaleCode): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
