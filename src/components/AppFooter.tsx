import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../hooks/useSettings';
import { ensureLanguageLoaded } from '../i18n/config';
import { getEnabledLocales, isLocaleEnabled } from '../i18n/localeHealth';
import { getNativeName, SUPPORTED_LOCALES } from '../i18n/localeRegistry';

interface AppFooterProps {
  theme: Theme;
  onToggleTheme: () => void;
  onShowHowToPlay: () => void;
}

const LANGUAGE_CODES = SUPPORTED_LOCALES;

export const AppFooter = memo(function AppFooter({
  theme,
  onToggleTheme,
  onShowHowToPlay,
}: AppFooterProps) {
  const { t, i18n } = useTranslation();
  const enabledLocales = getEnabledLocales();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <button type="button" className="footer-link" onClick={onShowHowToPlay}>
          {t('footer.howToPlay')}
        </button>
        <a
          href="https://hasbrogames.com/scattergories"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          {t('footer.officialGame')}
        </a>
        <a
          href="https://github.com/simonvanlierde/scattergories"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          {t('footer.sourceCode')}
        </a>
        <button
          type="button"
          className="footer-link theme-toggle"
          onClick={onToggleTheme}
          title={t('theme.toggleTooltip', { defaultValue: t('theme.toggle') })}
          aria-label={t('theme.toggleTooltip', { defaultValue: t('theme.toggle') })}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <select
          className="footer-link language-selector"
          aria-label={t('language.label')}
          value={i18n.resolvedLanguage ?? i18n.language}
          onChange={async (event) => {
            if (!isLocaleEnabled(event.target.value)) {
              return;
            }
            const language = await ensureLanguageLoaded(event.target.value);
            await i18n.changeLanguage(language);
            window.localStorage.setItem('scattergories.language', language);
          }}
        >
          {LANGUAGE_CODES.map((code) => (
            <option key={code} value={code} disabled={!enabledLocales.includes(code)}>
              {getNativeName(code)}
            </option>
          ))}
        </select>
      </div>
      <div className="footer-privacy">{t('footer.privacy')}</div>
    </footer>
  );
});
