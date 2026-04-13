import { useTranslation } from 'react-i18next';
import type { Theme } from '../hooks/useSettings';

interface AppFooterProps {
  theme: Theme;
  onToggleTheme: () => void;
  onShowHowToPlay: () => void;
}

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
];

export function AppFooter({ theme, onToggleTheme, onShowHowToPlay }: AppFooterProps) {
  const { t, i18n } = useTranslation();

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
          href="https://github.com/simonfong6/scattegories"
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
          aria-label={t('language')}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <select
          className="footer-link language-selector"
          aria-label={t('language')}
          value={i18n.language}
          onChange={(event) => {
            i18n.changeLanguage(event.target.value);
            window.localStorage.setItem('scattegories.language', event.target.value);
          }}
        >
          {LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="footer-privacy">{t('footer.privacy')}</div>
    </footer>
  );
}
