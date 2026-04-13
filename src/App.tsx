import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import { AppFooter } from './components/AppFooter';
import { CategoriesPanel } from './components/CategoriesPanel';
import { HowToPlayModal } from './components/HowToPlayModal';
import { TimerPanel } from './components/TimerPanel';
import { CATEGORIES } from './game/constants';
import { clampInt, shuffleFisherYates } from './game/utils';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useRound } from './hooks/useRound';
import { useSettings } from './hooks/useSettings';

function App() {
  const { t } = useTranslation();
  const { settings, update, addCustomCategory, removeCustomCategory } = useSettings();
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [drawnCategories, setDrawnCategories] = useState<string[]>([]);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const gameSeconds = useMemo(
    () => clampInt(settings.durationInput, 10, 600, 90),
    [settings.durationInput],
  );
  const categoryCount = useMemo(
    () => clampInt(settings.catCountInput, 1, 25, 12),
    [settings.catCountInput],
  );
  const totalRounds = useMemo(
    () => clampInt(settings.totalRoundsInput, 1, 10, 3),
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

  const normalizedCategoryCount = Math.min(categoryCount, Math.max(1, availableCategories.length));

  const round = useRound({ gameSeconds, totalRounds, isMuted: settings.isMuted });

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
        <h1>{t('title')}</h1>

        <TimerPanel
          phase={round.phase}
          secondsLeft={round.secondsLeft}
          isPaused={round.isPaused}
          letter={round.letter}
          letterVisible={round.letterVisible}
          letterLanding={round.letterLanding}
          roundCount={round.roundCount}
          totalRounds={totalRounds}
          hasMoreRounds={round.hasMoreRounds}
          statusKey={round.statusKey}
          isMuted={settings.isMuted}
          durationInput={settings.durationInput}
          totalRoundsInput={settings.totalRoundsInput}
          onStart={round.startRound}
          onSkip={round.rerollLetter}
          onReset={round.resetRound}
          onPause={round.togglePause}
          onNewGame={handleNewGame}
          onToggleMute={() => update('isMuted', !settings.isMuted)}
          onDurationChange={(value) => update('durationInput', value)}
          onDurationBlur={() =>
            update('durationInput', String(clampInt(settings.durationInput, 10, 600, 90)))
          }
          onTotalRoundsChange={(value) => update('totalRoundsInput', value)}
          onTotalRoundsBlur={() =>
            update('totalRoundsInput', String(clampInt(settings.totalRoundsInput, 1, 10, 3)))
          }
        />

        <hr />

        <CategoriesPanel
          categoryMode={settings.categoryMode}
          catCountInput={settings.catCountInput}
          customCategories={settings.customCategories}
          drawnCategories={drawnCategories}
          availableCount={availableCategories.length}
          usedLetters={round.usedLetters}
          newCategoryInput={newCategoryInput}
          onCategoryModeChange={(mode) => update('categoryMode', mode)}
          onCatCountChange={(value) => update('catCountInput', value)}
          onCatCountBlur={() =>
            update('catCountInput', String(clampInt(settings.catCountInput, 1, 25, 12)))
          }
          onShuffle={drawCategories}
          onAddCustom={handleAddCustom}
          onRemoveCustom={removeCustomCategory}
          onNewCategoryInputChange={setNewCategoryInput}
        />

        <p className="shortcut-hint">{t('shortcuts')}</p>
      </div>

      <AppFooter
        theme={settings.theme}
        onToggleTheme={() => update('theme', settings.theme === 'light' ? 'dark' : 'light')}
        onShowHowToPlay={() => setShowHowToPlay(true)}
      />

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </main>
  );
}

export default App;
