import type { i18n as I18nInstance } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { ensureLanguageLoaded, persistLanguage } from '@/i18n/config';

function useChunkErrorListener(setHasChunkError: (value: boolean) => void): void {
  useEffect(() => {
    function onPreloadError(event: Event) {
      event.preventDefault();
      setHasChunkError(true);
    }

    window.addEventListener('vite:preloadError', onPreloadError);
    return () => window.removeEventListener('vite:preloadError', onPreloadError);
  }, [setHasChunkError]);
}

function useLanguageSwitcher(
  i18n: I18nInstance,
  setIsLanguagePending: (value: boolean) => void,
  setHasChunkError: (value: boolean) => void,
) {
  return (language: string) => {
    setIsLanguagePending(true);

    async function switchLanguage() {
      try {
        persistLanguage(language);
        const resolved = await ensureLanguageLoaded(language);
        await i18n.changeLanguage(resolved);
        persistLanguage(resolved);
      } catch {
        setHasChunkError(true);
      } finally {
        setIsLanguagePending(false);
      }
    }

    switchLanguage().catch(() => undefined);
  };
}

function useAppControls(params: { i18n: I18nInstance }) {
  const [hasChunkError, setHasChunkError] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isLanguagePending, setIsLanguagePending] = useState(false);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);
  const handleLanguageChange = useLanguageSwitcher(
    params.i18n,
    setIsLanguagePending,
    setHasChunkError,
  );

  useChunkErrorListener(setHasChunkError);

  return {
    newCategoryInputRef,
    handleLanguageChange,
    hasChunkError,
    isHowToPlayOpen,
    isLanguagePending,
    setIsHowToPlayOpen,
  };
}

export { useAppControls };
