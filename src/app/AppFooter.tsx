import { useTranslation } from 'react-i18next';

function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <div className="app-footer__links">
        <a
          href="https://hasbrogames.com/scattergories"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link footer-link--text"
        >
          {t('footer.officialGame')}
        </a>
        <a
          href="https://github.com/simonvanlierde/scattergories"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link footer-link--text"
        >
          {t('footer.sourceCode')}
        </a>
      </div>
      <p className="footer-privacy">{t('footer.privacy')}</p>
    </footer>
  );
}

export { AppFooter };
