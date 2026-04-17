import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./i18n/config', () => ({
  startupLocaleWarning: 'Missing letter weights for fr; using en instead.',
}));

vi.mock('./i18n/localeHealth', () => ({
  getEnabledLocales: () => ['en', 'es', 'de', 'it', 'nl', 'pl', 'pt', 'el'],
  isLocaleEnabled: (locale: string) => locale !== 'fr',
}));

describe('locale startup validation', () => {
  it('shows a startup warning and disables incomplete locales', async () => {
    const { App } = await import('./App');
    render(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent('Missing letter weights for fr');
    const languageSelector = screen.getByLabelText('Language');
    expect(languageSelector).toBeInTheDocument();
    const frOption = screen
      .getAllByRole('option')
      .find((option) => option.getAttribute('value') === 'fr');
    expect(frOption).toBeDisabled();
  }, 15_000);
});
