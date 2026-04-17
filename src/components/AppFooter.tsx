import { useTranslation } from 'react-i18next';
import type { Theme } from '../hooks/useSettings';

interface AppFooterProps {
  currentLanguage: string;
  isLanguagePending: boolean;
  languageOptions: Array<{
    code: string;
    isDisabled: boolean;
    nativeName: string;
  }>;
  theme: Theme;
  onLanguageChange: (language: string) => void;
  onToggleTheme: () => void;
  onShowHowToPlay: () => void;
}

function AppFooter({
  currentLanguage,
  isLanguagePending,
  languageOptions,
  theme,
  onLanguageChange,
  onToggleTheme,
  onShowHowToPlay,
}: AppFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="app-footer card-surface">
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
          className="footer-link footer-toggle"
          onClick={onToggleTheme}
          aria-pressed={theme === 'dark'}
        >
          <span className="footer-toggle__label">
            {t('theme.toggleLabel', { defaultValue: 'Theme' })}
          </span>
          <strong>
            {theme === 'light'
              ? t('theme.dark', { defaultValue: 'Dark' })
              : t('theme.light', { defaultValue: 'Light' })}
          </strong>
        </button>
        <select
          className="footer-link language-selector"
          aria-label={t('language.label')}
          value={currentLanguage}
          disabled={isLanguagePending}
          onChange={(event) => onLanguageChange(event.target.value)}
        >
          {languageOptions.map((option) => (
            <option key={option.code} value={option.code} disabled={option.isDisabled}>
              {option.nativeName}
            </option>
          ))}
        </select>
      </div>
      <div className="footer-privacy">{t('footer.privacy')}</div>
    </footer>
  );
}

export { AppFooter };
