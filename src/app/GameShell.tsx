import { HelpCircle } from 'lucide-react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { canEditDeck } from '@/domain/game/roundReducer';
import { CategoriesPanel } from '@/features/categories/CategoriesPanel';
import { Playmat } from '@/features/round/Playmat';
import { SettingsCluster } from '@/features/settings/SettingsCluster';
import { BrandMark } from '@/shared/ui/BrandMark';
import { Button } from '@/shared/ui/Button';
import { cx } from '@/shared/ui/cx';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import type { GameController } from './useGameController';

interface GameShellProps {
  game: GameController;
}

function ControlBar({ game }: { game: GameController }) {
  const { t, i18n } = useTranslation();

  return (
    <footer className="controlbar">
      <div className="controlbar__brand">
        <BrandMark />
        <h1>{t('title')}</h1>
      </div>

      <div className="controlbar__actions">
        <SettingsCluster
          language={i18n.resolvedLanguage ?? i18n.language}
          isLanguagePending={game.flags.isLanguagePending}
          theme={game.settings.theme}
          isMuted={game.settings.isMuted}
          avoidRepeats={game.settings.avoidRepeats}
          durationInput={game.settings.durationInput}
          bufferSecondsInput={game.settings.bufferSecondsInput}
          onLanguageChange={game.controls.onLanguageChange}
          onToggleTheme={game.controls.onToggleTheme}
          onToggleMute={game.controls.onToggleMute}
          onToggleAvoidRepeats={game.controls.onToggleAvoidRepeats}
          onUpdateTimingField={game.controls.onUpdateField}
        />
        <IconButton
          label={t('buttons.howToPlay')}
          icon={<Icon icon={HelpCircle} size={20} />}
          onClick={game.controls.onOpenHowToPlay}
        />
      </div>
    </footer>
  );
}

function ChunkErrorBanner({ onReload }: { onReload: () => void }) {
  const { t } = useTranslation();

  return (
    <section className="banner banner--danger" role="alert" aria-label={t('errors.chunkTitle')}>
      <div>
        <strong>{t('errors.chunkTitle')}</strong>
        <p>{t('errors.chunkBody')}</p>
      </div>
      <Button variant="primary" onClick={onReload}>
        {t('errors.reload')}
      </Button>
    </section>
  );
}

interface PlayGridProps {
  game: GameShellProps['game'];
}

function PlayGrid({ game }: PlayGridProps) {
  const canEdit = canEditDeck(game.round.phase, game.round.isPaused);

  return (
    <section
      className={cx('play-grid', !game.flags.isPromptDeckOpen && 'play-grid--deck-collapsed')}
    >
      <Playmat game={game} />

      <CategoriesPanel
        categories={{
          availableCount: game.categories.availableCount,
          catCountInput: game.settings.catCountInput,
          customCategories: game.settings.customCategories,
          deckBuiltins: game.settings.deckBuiltins,
          pinned: game.settings.pinned,
          drawnCategories: game.categories.drawnCategories,
          drawnCustomCategories: game.categories.drawnCustomCategories,
          isLanding: game.categories.isLanding,
          isPromptDeckOpen: game.flags.isPromptDeckOpen,
          canEdit,
        }}
        inputRef={game.categories.inputRef}
        actions={{
          onAddCustom: game.controls.onAddCustomCategory,
          onRemoveCustom: game.controls.onRemoveCustomCategory,
          onRemoveBuiltin: game.controls.onRemoveBuiltin,
          onTogglePin: game.controls.onTogglePin,
          onAddPack: game.controls.onAddPack,
          onRemoveAllCustom: game.controls.onRemoveAllCustom,
          onRemoveAllBuiltins: game.controls.onRemoveAllBuiltins,
          onCatCountChange: (value) => game.controls.onUpdateField('catCountInput', value),
          onRedraw: game.controls.onRedrawCategories,
          onTogglePinAll: game.controls.onTogglePinAll,
          onTogglePromptDeck: game.controls.onTogglePromptDeck,
          onTogglePause: game.controls.onTogglePause,
        }}
      />
    </section>
  );
}

function GameShell({ game }: GameShellProps) {
  const { t } = useTranslation();

  return (
    <main
      className={cx('app-shell', game.round.alarmOn && 'alarm')}
      data-theme={game.settings.theme}
    >
      <div className="app">
        {game.flags.hasChunkError ? (
          <ChunkErrorBanner onReload={game.controls.onReloadAfterChunkError} />
        ) : null}

        <PlayGrid game={game} />

        <ControlBar game={game} />
      </div>

      {game.flags.isHowToPlayOpen ? (
        <Suspense
          fallback={
            <div className="modal-loading" role="status" aria-live="polite">
              {t('modal.loading')}
            </div>
          }
        >
          <game.howToPlayDialog onClose={game.controls.onCloseHowToPlay} />
        </Suspense>
      ) : null}
    </main>
  );
}

export { GameShell };
