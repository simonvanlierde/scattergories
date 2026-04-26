import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCALE_VALIDATION_TIMEOUT_MS } from './test/constants';

vi.mock('./i18n/localeHealth', async () => {
  const actual = await vi.importActual<typeof import('./i18n/localeHealth')>('./i18n/localeHealth');

  return {
    ...actual,
    getBootstrapLocaleWarning: () => 'Missing letter weights for fr; using en instead.',
    getEnabledLocales: () => ['en', 'es', 'de', 'it', 'nl', 'pl', 'pt', 'el'],
    isLocaleEnabled: (locale: string) => locale !== 'fr',
    resolveLocale: () => 'en',
  };
});

describe('locale startup validation', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it(
    'shows a startup warning and disables incomplete locales',
    async () => {
      const { App } = await import('@/app/App');
      const user = userEvent.setup();

      await Promise.resolve();
      render(<App />);

      await screen.findByRole('button', { name: 'Settings' });
      await user.click(screen.getByRole('button', { name: 'Settings' }));

      const languageSelector = await screen.findByRole('combobox', { name: 'Language' });
      expect(screen.getByRole('alert')).toHaveTextContent('Missing letter weights for fr');
      expect(languageSelector).toBeInTheDocument();
      const frOption = screen
        .getAllByRole('option')
        .find((option) => option.getAttribute('value') === 'fr');
      expect(frOption).toBeDisabled();
    },
    LOCALE_VALIDATION_TIMEOUT_MS,
  );
});
