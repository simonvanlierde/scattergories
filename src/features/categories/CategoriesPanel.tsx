import {
  ChevronDown,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Tags,
  Trash2,
} from 'lucide-react';
import type { RefObject } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catCountDefault, catCountMax, catCountMin } from '@/domain/game/constants';
import { PACKS } from '@/shared/lib/categoryPacks';
import { Button } from '@/shared/ui/Button';
import { cx } from '@/shared/ui/cx';
import { DebouncedNumberField } from '@/shared/ui/DebouncedNumberField';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { Sheet } from '@/shared/ui/Sheet';
import { CategoryChecklist } from './CategoryChecklist';

interface CategoriesState {
  drawnCategories: string[];
  /** Which drawn names were custom at draw time (frozen — survives mid-round deck edits). */
  drawnCustomCategories: string[];
  isLanding: boolean;
  availableCount: number;
  customCategories: string[];
  deckBuiltins: string[];
  pinned: string[];
  catCountInput: string;
  isPromptDeckOpen: boolean;
  canEdit: boolean;
}

interface CategoriesActions {
  onAddCustom: (name: string) => void;
  onRemoveCustom: (name: string) => void;
  onRemoveBuiltin: (name: string) => void;
  onTogglePin: (name: string) => void;
  onAddPack: (packId: string) => void;
  onRemoveAllCustom: () => void;
  onRemoveAllBuiltins: () => void;
  onCatCountChange: (value: string) => void;
  onRedraw: () => void;
  onTogglePinAll: (names: string[]) => void;
  onTogglePromptDeck: () => void;
  onTogglePause: () => void;
}

interface CategoriesPanelProps {
  categories: CategoriesState;
  actions: CategoriesActions;
  inputRef: RefObject<HTMLInputElement | null>;
}

function DeckSettings({
  catCountInput,
  actions,
}: Pick<CategoriesState, 'catCountInput'> & {
  actions: CategoriesActions;
}) {
  const { t } = useTranslation();
  return (
    <div className="deck-settings">
      <DebouncedNumberField
        id="catCount"
        label={t('settings.categoryDraw')}
        value={catCountInput}
        min={catCountMin}
        max={catCountMax}
        fallback={catCountDefault}
        suffix={t('categories.drawUnit', { defaultValue: 'cards' })}
        onCommit={actions.onCatCountChange}
      />
    </div>
  );
}

function AddCustomRow({
  inputRef,
  onAddCustom,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  onAddCustom: (name: string) => void;
}) {
  const { t } = useTranslation();
  // Local state keeps keystrokes from re-rendering the (large) deck list.
  const [value, setValue] = useState('');
  const submit = () => {
    onAddCustom(value);
    setValue('');
  };
  return (
    <div className="deck-add__custom">
      <input
        ref={inputRef}
        id="newCategory"
        type="text"
        value={value}
        aria-label={t('settings.addCustom')}
        maxLength={50}
        placeholder={`${t('settings.addCustom')}...`}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submit();
          }
        }}
      />
      <Button
        variant="primary"
        onClick={submit}
        leadingIcon={<Icon icon={Plus} size={18} />}
        aria-label={t('buttons.add')}
        title={t('buttons.addTooltip', { defaultValue: t('buttons.add') })}
      />
    </div>
  );
}

function AddCategories({
  actions,
  inputRef,
}: {
  actions: CategoriesActions;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const { t } = useTranslation();
  return (
    <section className="deck-section">
      <h3 className="deck-section__title">
        {t('categories.addSectionTitle', { defaultValue: 'Add categories' })}
      </h3>
      <div className="deck-add">
        <AddPackField actions={actions} />
        <AddCustomRow inputRef={inputRef} onAddCustom={actions.onAddCustom} />
      </div>
    </section>
  );
}

function AddPackField({ actions }: { actions: CategoriesActions }) {
  const { t } = useTranslation();
  const packs = useMemo(
    () =>
      [...PACKS]
        .map((pack) => ({
          id: pack.id,
          label: t(pack.labelKey, { defaultValue: pack.fallbackLabel }),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [t],
  );
  return (
    <label className="settings-select deck-list__pack" htmlFor="addPack">
      <span className="sr-only">
        {t('categories.addPack', { defaultValue: 'Add a category pack' })}
      </span>
      <select
        id="addPack"
        value=""
        onChange={(event) => {
          if (event.target.value) {
            actions.onAddPack(event.target.value);
          }
        }}
      >
        <option value="">
          {t('categories.addPackPlaceholder', { defaultValue: 'Add a pack…' })}
        </option>
        {packs.map((pack) => (
          <option key={pack.id} value={pack.id}>
            {pack.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface DeckRow {
  name: string;
  label: string;
  isCustom: boolean;
}

function DeckListItem({
  row,
  isPinned,
  actions,
}: {
  row: DeckRow;
  isPinned: boolean;
  actions: CategoriesActions;
}) {
  const { t } = useTranslation();
  return (
    <li className={cx('deck-list__item', row.isCustom && 'deck-list__item--custom')}>
      <span className="deck-list__label">{row.label}</span>
      <span className="deck-list__actions">
        <IconButton
          label={
            isPinned
              ? t('categories.unpinOne', { defaultValue: 'Unpin {{name}}', name: row.label })
              : t('categories.pinOne', { defaultValue: 'Pin {{name}}', name: row.label })
          }
          icon={<Icon icon={isPinned ? Pin : PinOff} size={16} />}
          aria-pressed={isPinned}
          onClick={() => actions.onTogglePin(row.name)}
        />
        <IconButton
          label={t('buttons.remove', { defaultValue: 'Remove' })}
          icon={<Icon icon={Trash2} size={16} />}
          onClick={() =>
            row.isCustom ? actions.onRemoveCustom(row.name) : actions.onRemoveBuiltin(row.name)
          }
        />
      </span>
    </li>
  );
}

function DeckBulkActions({
  hasCustom,
  hasBuiltins,
  actions,
}: {
  hasCustom: boolean;
  hasBuiltins: boolean;
  actions: CategoriesActions;
}) {
  const { t } = useTranslation();
  if (!(hasCustom || hasBuiltins)) {
    return null;
  }
  return (
    <div className="deck-list__bulk">
      {hasCustom ? (
        <Button
          variant="ghost"
          size="sm"
          className="deck-bulk-action"
          onClick={actions.onRemoveAllCustom}
        >
          {t('categories.removeAllCustom', { defaultValue: 'Remove all custom' })}
        </Button>
      ) : null}
      {hasBuiltins ? (
        <Button
          variant="ghost"
          size="sm"
          className="deck-bulk-action"
          onClick={actions.onRemoveAllBuiltins}
        >
          {t('categories.removeAllBuiltins', { defaultValue: 'Remove all built-in' })}
        </Button>
      ) : null}
    </div>
  );
}

function DeckList({
  customCategories,
  deckBuiltins,
  pinned,
  actions,
}: Pick<CategoriesState, 'customCategories' | 'deckBuiltins' | 'pinned'> & {
  actions: CategoriesActions;
}) {
  const { t } = useTranslation();
  const pinnedSet = useMemo(() => new Set(pinned), [pinned]);
  const rows = useMemo<DeckRow[]>(() => {
    // Within each group: pinned first, then alphabetical.
    const byPinThenLabel = (a: DeckRow, b: DeckRow) => {
      const aPinned = pinnedSet.has(a.name);
      const bPinned = pinnedSet.has(b.name);
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    };
    const customs = customCategories
      .map((name) => ({ name, label: name, isCustom: true }))
      .sort(byPinThenLabel);
    const builtins = deckBuiltins
      .map((name) => ({ name, label: t(name, { ns: 'categories' }), isCustom: false }))
      .sort(byPinThenLabel);
    return [...customs, ...builtins];
  }, [customCategories, deckBuiltins, pinnedSet, t]);

  const hasCustom = customCategories.length > 0;
  const hasBuiltins = deckBuiltins.length > 0;

  return (
    <section className="deck-section">
      <div className="deck-section__head">
        <h3 className="deck-section__title">
          {t('categories.deckSectionTitle', { defaultValue: 'Your deck' })}
        </h3>
        <span className="deck-list__count">
          {t('categories.deckCount', {
            defaultValue: '{{custom}} custom · {{builtin}} built-in',
            custom: customCategories.length,
            builtin: deckBuiltins.length,
          })}
        </span>
      </div>
      <ul
        className="deck-list__items"
        aria-label={t('categories.deckLabel', { defaultValue: 'Category deck' })}
      >
        {rows.length === 0 ? (
          <li className="deck-list__empty">
            {t('categories.emptyDeck', {
              defaultValue: 'The deck is empty. Add a pack or a custom category.',
            })}
          </li>
        ) : (
          rows.map((row) => (
            <DeckListItem
              key={`${row.isCustom ? 'c' : 'b'}:${row.name}`}
              row={row}
              isPinned={pinnedSet.has(row.name)}
              actions={actions}
            />
          ))
        )}
      </ul>
      <DeckBulkActions hasCustom={hasCustom} hasBuiltins={hasBuiltins} actions={actions} />
    </section>
  );
}

function CustomizeSheetBlock({
  categories,
  actions,
  inputRef,
}: {
  categories: CategoriesState;
  actions: CategoriesActions;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Editing the deck mid-round auto-pauses the clock; the edits themselves only
  // take effect on the next redraw (handled in useCategoryBoard).
  const openSheet = () => {
    if (!categories.canEdit) {
      actions.onTogglePause();
    }
    setIsOpen(true);
  };

  return (
    <>
      <IconButton
        label={t('categories.customize', { defaultValue: 'Customize deck' })}
        icon={<Icon icon={SlidersHorizontal} size={18} />}
        onClick={openSheet}
      />
      <Sheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('categories.customizeTitle', { defaultValue: 'Customize deck' })}
        closeLabel={t('buttons.closeTooltip', { defaultValue: 'Close' })}
      >
        <DeckSettings catCountInput={categories.catCountInput} actions={actions} />
        <AddCategories actions={actions} inputRef={inputRef} />
        <DeckList
          customCategories={categories.customCategories}
          deckBuiltins={categories.deckBuiltins}
          pinned={categories.pinned}
          actions={actions}
        />
      </Sheet>
    </>
  );
}

function CategoriesCardHeader({
  isPromptDeckOpen,
  deckToggleLabel,
  allPinned,
  categories,
  actions,
  inputRef,
}: {
  isPromptDeckOpen: boolean;
  deckToggleLabel: string;
  allPinned: boolean;
  categories: CategoriesState;
  actions: CategoriesActions;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const { t } = useTranslation();
  const { canEdit, drawnCategories } = categories;
  return (
    <div className="categories-card__header">
      <div className="categories-card__heading">
        <h2 id="categories-panel-title">
          <Icon icon={Tags} size={22} />
          <span className="sr-only">{t('categories.title')}</span>
        </h2>
        <IconButton
          label={deckToggleLabel}
          icon={<Icon icon={ChevronDown} size={20} className="categories-card__chevron" />}
          aria-controls="categories-panel-content"
          aria-expanded={isPromptDeckOpen}
          onClick={actions.onTogglePromptDeck}
        />
      </div>
      {isPromptDeckOpen ? (
        <div className="categories-card__header-actions">
          <IconButton
            label={t('buttons.redraw', { defaultValue: 'Redraw' })}
            icon={<Icon icon={RefreshCw} size={18} />}
            disabled={!canEdit}
            onClick={actions.onRedraw}
          />
          <IconButton
            label={
              allPinned
                ? t('categories.unpinAll', { defaultValue: 'Unpin all' })
                : t('categories.pinAll', { defaultValue: 'Pin all' })
            }
            icon={<Icon icon={allPinned ? Pin : PinOff} size={18} />}
            aria-pressed={allPinned}
            onClick={() => actions.onTogglePinAll(drawnCategories)}
          />
          <CustomizeSheetBlock categories={categories} actions={actions} inputRef={inputRef} />
        </div>
      ) : null}
    </div>
  );
}

function CategoriesPanel({ categories, actions, inputRef }: CategoriesPanelProps) {
  const { t } = useTranslation();
  const { isPromptDeckOpen, drawnCategories } = categories;
  const pinnedSet = useMemo(() => new Set(categories.pinned), [categories.pinned]);
  // Decoration uses the frozen draw-time snapshot, not the live deck, so editing
  // the deck mid-round never re-styles (or blanks) the categories already drawn.
  const customSet = useMemo(
    () => new Set(categories.drawnCustomCategories),
    [categories.drawnCustomCategories],
  );
  const deckToggleLabel = isPromptDeckOpen
    ? t('categories.hideDeck', { defaultValue: 'Hide categories' })
    : t('categories.showDeck', { defaultValue: 'Show categories' });
  const allPinned =
    drawnCategories.length > 0 && drawnCategories.every((name) => pinnedSet.has(name));

  return (
    <section
      className={cx('categories-card', !isPromptDeckOpen && 'categories-card--collapsed')}
      aria-labelledby="categories-panel-title"
      data-open={isPromptDeckOpen ? 'true' : 'false'}
    >
      <CategoriesCardHeader
        isPromptDeckOpen={isPromptDeckOpen}
        deckToggleLabel={deckToggleLabel}
        allPinned={allPinned}
        categories={categories}
        actions={actions}
        inputRef={inputRef}
      />

      {isPromptDeckOpen ? (
        <div className="categories-card__content categories-card__content--prompts-first">
          <div className="drawn-categories" id="categories-panel-content">
            <CategoryChecklist
              categories={drawnCategories}
              availableCount={categories.availableCount}
              landing={categories.isLanding}
              pinnedSet={pinnedSet}
              customSet={customSet}
              onTogglePin={actions.onTogglePin}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { CategoriesPanel };
