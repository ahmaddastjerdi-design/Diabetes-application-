import { NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { LOCALES, type LocaleCode } from '../i18n/types';
import { useTheme } from '../ui/theme';
import { NAV_ITEMS } from './navigation';
import './AppLayout.css';

function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const { t } = useI18n();
  const next =
    preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light';
  const glyph = preference === 'dark' ? '🌙' : preference === 'light' ? '☀️' : '🌓';
  return (
    <button
      type="button"
      className="hp-iconbtn"
      onClick={() => setPreference(next)}
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}

function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="hp-iconbtn" style={{ padding: 0 }}>
      <span className="hp-visually-hidden">{t('language.label')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as LocaleCode)}
        aria-label={t('language.label')}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '0 8px',
          minHeight: 44,
          color: 'var(--hp-text-muted)',
          fontWeight: 600,
        }}
      >
        {Object.values(LOCALES).map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AppLayout() {
  const { t } = useI18n();
  return (
    <>
      <a className="hp-skip-link" href="#main">
        {t('common.skipToContent')}
      </a>
      <header className="hp-appbar">
        <span className="hp-appbar__brand">
          <img
            className="hp-appbar__logo"
            src="/icon.svg"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
          />
          {t('app.name')}
        </span>
        <div className="hp-appbar__actions">
          <LanguagePicker />
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className="hp-main">
        <Outlet />
      </main>

      <p className="hp-disclaimer-strip">{t('disclaimer.short')}</p>

      <nav className="hp-bottomnav" aria-label={t('app.name')}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className="hp-navlink"
          >
            <span className="hp-navlink__icon" aria-hidden="true">
              {item.icon}
            </span>
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
