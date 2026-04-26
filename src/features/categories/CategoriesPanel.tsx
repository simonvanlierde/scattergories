import { Pin, PinOff, Plus, Shuffle, SlidersHorizontal, Trash2 } from 'lucide-react';
import type { RefObject } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catCountMax, catCountMin } from '@/domain/game/constants';
import type { CategoryMode, CategoryRefreshMode } from '@/features/settings/schema';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { Sheet } from '@/shared/ui/Sheet';
import { CategoryChecklist } from './CategoryChecklist';

interface CategoriesState {
  mode: CategoryMode;
  refreshMode: CategoryRefreshMode;
  catCountInput: string;
  customCategories: string[];
  availableCount: number;
  drawnCategories: string[];
  isPromptDeckOpen: boolean;
  newCategoryInput: string;
}

interface CategoriesActions {
  onCategoryModeChange: (mode: CategoryMode) => void;
  onCategoryRefreshModeChange: (mode: CategoryRefreshMode) => void;
  onCatCountChange: (value: string) => void;
  onCatCountBlur: () => void;
  onShuffle: () => void;
  onAddCustom: () => void;
  onRemoveCustom: (category: string) => void;
  onNewCategoryInputChange: (value: string) => void;
  onTogglePromptDeck: () => void;
}

interface CategoriesPanelProps {
  categories: CategoriesState;
  actions: CategoriesActions;
  inputRef: RefObject<HTMLInputElement | null>;
}

function CategoryToolbar({
  actions,
  catCountInput,
  mode,
}: Pick<CategoriesState, 'catCountInput' | 'mode'> & {
  actions: CategoriesActions;
}) {
  const { t } = useTranslation();

  return (
    <div className="category-toolbar category-toolbar--setup">
      <label className="field-shell" htmlFor="categoryMode">
        <span>{t('settings.categorySource')}</span>
        <select
          id="categoryMode"
          aria-label={t('settings.categorySource')}
          value={mode}
          onChange={(event) => actions.onCategoryModeChange(event.target.value as CategoryMode)}
        >
          <option value="default">{t('categories.default')}</option>
          <option value="custom">{t('categories.custom')}</option>
          <option value="mixed">{t('categories.mixed')}</option>
        </select>
      </label>
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

function CustomCategories({
  actions,
  customCategories,
  inputRef,
  newCategoryInput,
}: {
  actions: CategoriesActions;
  customCategories: string[];
  inputRef: RefObject<HTMLInputElement | null>;
  newCategoryInput: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="custom-categories">
      <label htmlFor="newCategory" className="section-label">
        {t('settings.addCustom')}
      </label>
      <div className="custom-category-input-row">
        <input
          ref={inputRef}
          id="newCategory"
          type="text"
          value={newCategoryInput}
          aria-label={t('settings.addCustom')}
          maxLength={50}
          placeholder={t('settings.placeholder')}
          onChange={(event) => actions.onNewCategoryInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              actions.onAddCustom();
            }
          }}
        />
        <Button
          variant="primary"
          onClick={actions.onAddCustom}
          leadingIcon={<Icon icon={Plus} size={18} />}
          title={t('buttons.addTooltip', { defaultValue: t('buttons.add') })}
        >
          {t('buttons.add')}
        </Button>
      </div>
      {customCategories.length > 0 ? (
        <ul
          className="custom-list"
          aria-label={t('categories.customListLabel', { defaultValue: 'Custom categories' })}
        >
          {customCategories.map((category) => (
            <li key={category}>
              <span>{category}</span>
              <IconButton
                label={`${t('buttons.remove')} ${category}`}
                icon={<Icon icon={Trash2} size={18} />}
                onClick={() => actions.onRemoveCustom(category)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="custom-empty">{t('categories.noCustom')}</p>
      )}
    </div>
  );
}

interface CustomizeSheetBlockProps {
  actions: CategoriesActions;
  catCountInput: string;
  mode: CategoryMode;
  customCategories: string[];
  newCategoryInput: string;
  inputRef: RefObject<HTMLInputElement | null>;
}

function CustomizeSheetBlock({
  actions,
  catCountInput,
  mode,
  customCategories,
  newCategoryInput,
  inputRef,
}: CustomizeSheetBlockProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        fullWidth={true}
        onClick={() => setIsOpen(true)}
        leadingIcon={<Icon icon={SlidersHorizontal} size={18} />}
        className="categories-card__customize"
      >
        {t('categories.customize', { defaultValue: 'Customize deck' })}
      </Button>
      <Sheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('categories.customizeTitle', { defaultValue: 'Customize deck' })}
        closeLabel={t('buttons.closeTooltip', { defaultValue: 'Close' })}
      >
        <CategoryToolbar actions={actions} catCountInput={catCountInput} mode={mode} />
        <CustomCategories
          actions={actions}
          customCategories={customCategories}
          inputRef={inputRef}
          newCategoryInput={newCategoryInput}
        />
      </Sheet>
    </>
  );
}

function CategoriesPanel({ categories, actions, inputRef }: CategoriesPanelProps) {
  const { t } = useTranslation();
  const {
    mode,
    refreshMode,
    catCountInput,
    customCategories,
    availableCount,
    drawnCategories,
    isPromptDeckOpen,
    newCategoryInput,
  } = categories;
  const deckButtonLabel = isPromptDeckOpen
    ? t('categories.hideDeck', { defaultValue: 'Hide prompts' })
    : t('categories.showDeck', { defaultValue: 'Open prompts' });
  const isPinned = refreshMode === 'pinned';
  const pinButtonLabel = isPinned
    ? t('categories.unpin', { defaultValue: 'Unpin categories' })
    : t('categories.pin', { defaultValue: 'Pin categories' });

  return (
    <section
      className={`categories-card${isPromptDeckOpen ? '' : ' categories-card--collapsed'}`}
      aria-labelledby="categories-panel-title"
      data-open={isPromptDeckOpen ? 'true' : 'false'}
    >
      <div className="categories-card__header">
        <h2 id="categories-panel-title">{t('categories.title')}</h2>
        <button
          type="button"
          className="btn-secondary panel-action"
          aria-controls="categories-panel-content"
          aria-expanded={isPromptDeckOpen}
          onClick={actions.onTogglePromptDeck}
        >
          {deckButtonLabel}
        </button>
      </div>

      {isPromptDeckOpen ? (
        <div className="categories-card__content categories-card__content--prompts-first">
          <div className="drawn-categories" id="categories-panel-content">
            <CategoryChecklist categories={drawnCategories} availableCount={availableCount} />
          </div>

          <div className="categories-card__actions">
            <Button
              variant={isPinned ? 'primary' : 'secondary'}
              onClick={() => actions.onCategoryRefreshModeChange(isPinned ? 'auto' : 'pinned')}
              leadingIcon={<Icon icon={isPinned ? PinOff : Pin} size={18} />}
              aria-pressed={isPinned}
            >
              {pinButtonLabel}
            </Button>
            <Button
              variant="secondary"
              onClick={actions.onShuffle}
              leadingIcon={<Icon icon={Shuffle} size={18} />}
            >
              {t('buttons.shuffle')}
            </Button>
            <CustomizeSheetBlock
              actions={actions}
              catCountInput={catCountInput}
              mode={mode}
              customCategories={customCategories}
              newCategoryInput={newCategoryInput}
              inputRef={inputRef}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { CategoriesPanel };
