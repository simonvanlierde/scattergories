import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import heroArt from './assets/hero.png';
import { AppFooter } from './components/AppFooter';
import { CategoriesPanel } from './components/CategoriesPanel';
import { TimerPanel } from './components/TimerPanel';
import {
  CAT_COUNT_DEFAULT,
  CAT_COUNT_MAX,
  CAT_COUNT_MIN,
  CATEGORIES,
  DURATION_DEFAULT,
  DURATION_MAX,
  DURATION_MIN,
  ROUNDS_DEFAULT,
  ROUNDS_MAX,
  ROUNDS_MIN,
} from './game/constants';
import { clampInt, shuffleFisherYates } from './game/utils';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useRound } from './hooks/useRound';
import { useSettings } from './hooks/useSettings';
import { startupLocaleWarning } from './i18n/config';

const HowToPlayModal = lazy(() => import('./components/HowToPlayModal'));

function App() {
  const { t, i18n } = useTranslation();
  const { settings, update, addCustomCategory, removeCustomCategory } = useSettings();
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [drawnCategories, setDrawnCategories] = useState<string[]>([]);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const gameSeconds = useMemo(
    () => clampInt(settings.durationInput, DURATION_MIN, DURATION_MAX, DURATION_DEFAULT),
    [settings.durationInput],
  );
  const categoryCount = useMemo(
    () => clampInt(settings.catCountInput, CAT_COUNT_MIN, CAT_COUNT_MAX, CAT_COUNT_DEFAULT),
    [settings.catCountInput],
  );
  const totalRounds = useMemo(
    () => clampInt(settings.totalRoundsInput, ROUNDS_MIN, ROUNDS_MAX, ROUNDS_DEFAULT),
    [settings.totalRoundsInput],
  );

  const availableCategories = useMemo(() => {
    if (settings.categoryMode === 'default') {
      return CATEGORIES;
    }
    if (settings.categoryMode === 'custom') {
      return settings.customCategories;
    }
    return Array.from(new Set([...CATEGORIES, ...settings.customCategories]));
  }, [settings.categoryMode, settings.customCategories]);

  const normalizedCategoryCount = Math.min(
    categoryCount,
    Math.max(CAT_COUNT_MIN, availableCategories.length),
  );

  const round = useRound({
    gameSeconds,
    totalRounds,
    isMuted: settings.isMuted,
    locale: i18n.resolvedLanguage ?? i18n.language,
  });

  const drawCategories = useCallback(() => {
    if (availableCategories.length === 0) {
      setDrawnCategories([]);
      return;
    }
    setDrawnCategories(shuffleFisherYates(availableCategories).slice(0, normalizedCategoryCount));
  }, [availableCategories, normalizedCategoryCount]);

  useEffect(() => {
    drawCategories();
  }, [drawCategories]);

  const handleAddCustom = useCallback(() => {
    addCustomCategory(newCategoryInput);
    setNewCategoryInput('');
  }, [addCustomCategory, newCategoryInput]);

  const handleNewGame = useCallback(() => {
    drawCategories();
    round.newGame();
  }, [drawCategories, round]);

  useKeyboardShortcuts({
    onSpace: round.startRound,
    onR: round.rerollLetter,
    onN: handleNewGame,
    onP: round.togglePause,
    onC: drawCategories,
    onA: () => {
      const input = document.getElementById('newCategory') as HTMLInputElement | null;
      input?.focus();
    },
  });

  return (
    <main className={`app-shell${round.alarmOn ? ' alarm' : ''}`} data-theme={settings.theme}>
      <div className="app">
        <header className="app-header">
          <img className="app-mark" src={heroArt} alt="" aria-hidden="true" />
          <h1>{t('title')}</h1>
        </header>
        {startupLocaleWarning ? (
          <p className="locale-warning" role="alert">
            {startupLocaleWarning}
          </p>
        ) : null}

        <TimerPanel
          round={{
            phase: round.phase,
            secondsLeft: round.secondsLeft,
            isPaused: round.isPaused,
            letter: round.letter,
            letterVisible: round.letterVisible,
            letterLanding: round.letterLanding,
            roundCount: round.roundCount,
            hasMoreRounds: round.hasMoreRounds,
            statusKey: round.statusKey,
          }}
          settings={{
            isMuted: settings.isMuted,
            durationInput: settings.durationInput,
            totalRoundsInput: settings.totalRoundsInput,
            totalRounds,
          }}
          actions={{
            onStart: round.startRound,
            onSkip: round.rerollLetter,
            onReset: round.resetRound,
            onPause: round.togglePause,
            onNewGame: handleNewGame,
            onToggleMute: () => update('isMuted', !settings.isMuted),
            onDurationChange: (value) => update('durationInput', value),
            onDurationBlur: () =>
              update(
                'durationInput',
                String(
                  clampInt(settings.durationInput, DURATION_MIN, DURATION_MAX, DURATION_DEFAULT),
                ),
              ),
            onTotalRoundsChange: (value) => update('totalRoundsInput', value),
            onTotalRoundsBlur: () =>
              update(
                'totalRoundsInput',
                String(clampInt(settings.totalRoundsInput, ROUNDS_MIN, ROUNDS_MAX, ROUNDS_DEFAULT)),
              ),
          }}
        />

        <CategoriesPanel
          categories={{
            mode: settings.categoryMode,
            catCountInput: settings.catCountInput,
            customCategories: settings.customCategories,
            drawnCategories,
            availableCount: availableCategories.length,
            usedLetters: round.usedLetters,
            newCategoryInput,
          }}
          actions={{
            onCategoryModeChange: (mode) => update('categoryMode', mode),
            onCatCountChange: (value) => update('catCountInput', value),
            onCatCountBlur: () =>
              update(
                'catCountInput',
                String(
                  clampInt(settings.catCountInput, CAT_COUNT_MIN, CAT_COUNT_MAX, CAT_COUNT_DEFAULT),
                ),
              ),
            onShuffle: drawCategories,
            onAddCustom: handleAddCustom,
            onRemoveCustom: removeCustomCategory,
            onNewCategoryInputChange: setNewCategoryInput,
          }}
        />

        <p className="shortcut-hint">{t('shortcuts')}</p>
      </div>

      <AppFooter
        theme={settings.theme}
        onToggleTheme={() => update('theme', settings.theme === 'light' ? 'dark' : 'light')}
        onShowHowToPlay={() => setShowHowToPlay(true)}
      />

      {showHowToPlay && (
        <Suspense fallback={null}>
          <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
        </Suspense>
      )}
    </main>
  );
}

export { App };
