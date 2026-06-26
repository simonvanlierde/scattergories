import {
  ChevronDown,
  ChevronUp,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import type { RefObject } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catCountMax, catCountMin } from '@/domain/game/constants';
import { PACKS } from '@/shared/lib/categoryPacks';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { Sheet } from '@/shared/ui/Sheet';
import { CategoryChecklist } from './CategoryChecklist';

interface CategoriesState {
  drawnCategories: string[];
  pinnedCount: number;
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
  onCatCountBlur: () => void;
  onRedraw: () => void;
  onTogglePinAll: (names: string[]) => void;
  onTogglePromptDeck: () => void;
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
      <Field
        id="catCount"
        label={t('settings.categoryDraw')}
        type="number"
        inputMode="numeric"
        min={catCountMin}
        max={catCountMax}
        value={catCountInput}
        onChange={(event) => actions.onCatCountChange(event.target.value)}
        onBlur={actions.onCatCountBlur}
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
    <li className="deck-list__add">
      <input
        ref={inputRef}
        id="newCategory"
        type="text"
        value={value}
        aria-label={t('settings.addCustom')}
        maxLength={50}
        placeholder={t('settings.placeholder')}
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
        title={t('buttons.addTooltip', { defaultValue: t('buttons.add') })}
      >
        {t('buttons.add')}
      </Button>
    </li>
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

function DeckList({
  customCategories,
  deckBuiltins,
  pinned,
  actions,
  inputRef,
}: Pick<CategoriesState, 'customCategories' | 'deckBuiltins' | 'pinned'> & {
  actions: CategoriesActions;
  inputRef: RefObject<HTMLInputElement | null>;
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

  return (
    <div className="deck-list">
      <div className="deck-list__toolbar">
        <AddPackField actions={actions} />
        <span className="deck-list__count">
          {t('categories.deckCount', {
            defaultValue: '{{custom}} custom / {{builtin}} built-in',
            custom: customCategories.length,
            builtin: deckBuiltins.length,
          })}
        </span>
        <div className="deck-list__bulk">
          <Button variant="ghost" onClick={actions.onRemoveAllCustom}>
            {t('categories.removeAllCustom', { defaultValue: 'Remove custom' })}
          </Button>
          <Button variant="ghost" onClick={actions.onRemoveAllBuiltins}>
            {t('categories.removeAllBuiltins', { defaultValue: 'Remove built-in' })}
          </Button>
        </div>
      </div>
      <ul
        className="deck-list__items"
        aria-label={t('categories.deckLabel', { defaultValue: 'Category deck' })}
      >
        <AddCustomRow inputRef={inputRef} onAddCustom={actions.onAddCustom} />
        {rows.length === 0 ? (
          <li className="deck-list__empty">
            {t('categories.emptyDeck', {
              defaultValue: 'The deck is empty. Add a pack or a custom category.',
            })}
          </li>
        ) : (
          rows.map((row) => {
            const isPinned = pinnedSet.has(row.name);
            return (
              <li
                key={`${row.isCustom ? 'c' : 'b'}:${row.name}`}
                className={`deck-list__item${row.isCustom ? ' deck-list__item--custom' : ''}`}
              >
                <span className="deck-list__label">{row.label}</span>
                <span className="deck-list__actions">
                  <IconButton
                    label={
                      isPinned
                        ? t('categories.unpinOne', {
                            defaultValue: 'Unpin {{name}}',
                            name: row.label,
                          })
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
                      row.isCustom
                        ? actions.onRemoveCustom(row.name)
                        : actions.onRemoveBuiltin(row.name)
                    }
                  />
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function CustomizeSheetBlock({
  categories,
  actions,
  inputRef,
  disabled,
}: {
  categories: CategoriesState;
  actions: CategoriesActions;
  inputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <IconButton
        label={t('categories.customize', { defaultValue: 'Customize deck' })}
        icon={<Icon icon={SlidersHorizontal} size={18} />}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      />
      <Sheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('categories.customizeTitle', { defaultValue: 'Customize deck' })}
        closeLabel={t('buttons.closeTooltip', { defaultValue: 'Close' })}
      >
        <DeckSettings catCountInput={categories.catCountInput} actions={actions} />
        <DeckList
          customCategories={categories.customCategories}
          deckBuiltins={categories.deckBuiltins}
          pinned={categories.pinned}
          actions={actions}
          inputRef={inputRef}
        />
      </Sheet>
    </>
  );
}

function CategoriesPanel({ categories, actions, inputRef }: CategoriesPanelProps) {
  const { t } = useTranslation();
  const { isPromptDeckOpen, canEdit, drawnCategories } = categories;
  const pinnedSet = useMemo(() => new Set(categories.pinned), [categories.pinned]);
  const customSet = useMemo(
    () => new Set(categories.customCategories),
    [categories.customCategories],
  );
  const deckToggleLabel = isPromptDeckOpen
    ? t('categories.hideDeck', { defaultValue: 'Hide categories' })
    : t('categories.showDeck', { defaultValue: 'Show categories' });
  const allPinned =
    drawnCategories.length > 0 && drawnCategories.every((name) => pinnedSet.has(name));

  return (
    <section
      className={`categories-card${isPromptDeckOpen ? '' : ' categories-card--collapsed'}`}
      aria-labelledby="categories-panel-title"
      data-open={isPromptDeckOpen ? 'true' : 'false'}
    >
      <div className="categories-card__header">
        <h2 id="categories-panel-title">{t('categories.title')}</h2>
        <div className="categories-card__header-actions">
          {isPromptDeckOpen ? (
            <>
              <IconButton
                label={t('buttons.redraw', { defaultValue: 'Redraw' })}
                icon={<Icon icon={RefreshCw} size={18} />}
                disabled={!canEdit}
                onClick={actions.onRedraw}
              />
              <CustomizeSheetBlock
                categories={categories}
                actions={actions}
                inputRef={inputRef}
                disabled={!canEdit}
              />
              <IconButton
                label={
                  allPinned
                    ? t('categories.unpinAll', { defaultValue: 'Unpin all' })
                    : t('categories.pinAll', { defaultValue: 'Pin all' })
                }
                icon={<Icon icon={allPinned ? Pin : PinOff} size={18} />}
                aria-pressed={allPinned}
                disabled={!canEdit}
                onClick={() => actions.onTogglePinAll(drawnCategories)}
              />
            </>
          ) : null}
          <IconButton
            label={deckToggleLabel}
            icon={<Icon icon={isPromptDeckOpen ? ChevronUp : ChevronDown} size={20} />}
            aria-controls="categories-panel-content"
            aria-expanded={isPromptDeckOpen}
            onClick={actions.onTogglePromptDeck}
          />
        </div>
      </div>

      {isPromptDeckOpen ? (
        <div className="categories-card__content categories-card__content--prompts-first">
          <div className="drawn-categories" id="categories-panel-content">
            <CategoryChecklist
              categories={drawnCategories}
              availableCount={categories.availableCount}
              pinnedCount={categories.pinnedCount}
              landing={categories.isLanding}
              canEdit={canEdit}
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
