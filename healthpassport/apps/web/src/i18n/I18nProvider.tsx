import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { en } from './locales/en';
import { fa } from './locales/fa';
import {
  LOCALES,
  type Dict,
  type LocaleCode,
  type TranslationKey,
} from './types';

const DICTS: Record<LocaleCode, Dict> = { en, fa };
const STORAGE_KEY = 'hp.locale'; // non-PHI UI preference — plain storage is fine

type Vars = Record<string, string | number>;

interface I18nContextValue {
  locale: LocaleCode;
  dir: 'ltr' | 'rtl';
  setLocale: (code: LocaleCode) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolve(dict: Dict, key: TranslationKey): string {
  const [section, item] = key.split('.') as [keyof Dict, string];
  const group = dict[section] as Record<string, string> | undefined;
  return group?.[item] ?? key;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

function detectInitialLocale(): LocaleCode {
  const stored =
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY) as LocaleCode | null)
      : null;
  if (stored && stored in DICTS) return stored;
  const nav =
    typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
  return (nav in DICTS ? nav : 'en') as LocaleCode;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(detectInitialLocale);

  const dir = LOCALES[locale].dir;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage may be unavailable (private mode) — non-fatal */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) =>
      interpolate(resolve(DICTS[locale], key), vars),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir, setLocale, t }),
    [locale, dir, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
