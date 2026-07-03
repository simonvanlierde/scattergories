import type { i18n as I18nInstance } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { useSettings } from '@/features/settings/SettingsProvider';
import { type NumericFieldName, sanitizeNumericField } from '@/features/settings/schema';
import { ensureLanguageLoaded, persistLanguage } from '@/i18n/config';

const SCATTERGORIES_PRELOAD_ERROR_EVENTS = [
  'vite:preloadError',
  'scattergories:chunk-error',
] as const;

function useChunkErrorListener(setHasChunkError: (value: boolean) => void): void {
  useEffect(() => {
    function onPreloadError(event: Event) {
      event.preventDefault();
      setHasChunkError(true);
    }

    for (const eventName of SCATTERGORIES_PRELOAD_ERROR_EVENTS) {
      window.addEventListener(eventName, onPreloadError);
    }

    return () => {
      for (const eventName of SCATTERGORIES_PRELOAD_ERROR_EVENTS) {
        window.removeEventListener(eventName, onPreloadError);
      }
    };
  }, [setHasChunkError]);
}

function useLanguageSwitcher(
  i18n: I18nInstance,
  setIsLanguagePending: (value: boolean) => void,
  setHasChunkError: (value: boolean) => void,
) {
  return useCallback(
    (language: string) => {
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
    },
    [i18n, setHasChunkError, setIsLanguagePending],
  );
}

function useAppControls(params: {
  i18n: I18nInstance;
  settings: {
    catCountInput: string;
    durationInput: string;
    bufferSecondsInput: string;
  };
  update: ReturnType<typeof useSettings>['update'];
}) {
  const [hasChunkError, setHasChunkError] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isLanguagePending, setIsLanguagePending] = useState(false);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);
  const blurNumericField = useCallback(
    (field: NumericFieldName) => {
      params.update(field, sanitizeNumericField(field, params.settings[field]));
    },
    [params.settings, params.update],
  );
  const handleLanguageChange = useLanguageSwitcher(
    params.i18n,
    setIsLanguagePending,
    setHasChunkError,
  );

  useChunkErrorListener(setHasChunkError);

  return {
    newCategoryInputRef,
    blurNumericField,
    handleLanguageChange,
    hasChunkError,
    isHowToPlayOpen,
    isLanguagePending,
    setIsHowToPlayOpen,
  };
}

export { useAppControls };
