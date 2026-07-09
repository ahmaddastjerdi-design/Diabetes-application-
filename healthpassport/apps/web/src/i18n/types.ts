import type { en } from './locales/en';

/** The English dictionary defines the required shape for every locale. */
export type Dict = {
  [K in keyof typeof en]: { [P in keyof (typeof en)[K]]: string };
};

export type LocaleCode = 'en' | 'fa';
export type TextDirection = 'ltr' | 'rtl';

export interface LocaleMeta {
  code: LocaleCode;
  /** Native name shown in the language picker. */
  nativeName: string;
  dir: TextDirection;
}

export const LOCALES: Record<LocaleCode, LocaleMeta> = {
  en: { code: 'en', nativeName: 'English', dir: 'ltr' },
  fa: { code: 'fa', nativeName: 'فارسی', dir: 'rtl' },
};

/** Dot-path into the dictionary, e.g. "nav.home". */
export type TranslationKey = {
  [K in keyof Dict]: `${K & string}.${keyof Dict[K] & string}`;
}[keyof Dict];
