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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catCountMax, catCountMin } from '@/domain/game/constants';
import type { CategoryRefreshMode } from '@/features/settings/schema';
import { PACKS } from '@/shared/lib/categoryPacks';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { Sheet } from '@/shared/ui/Sheet';
import { CategoryChecklist } from './CategoryChecklist';

interface CategoriesState {
  includePackCategories: boolean;
  refreshMode: CategoryRefreshMode;
  catCountInput: string;
  customCategories: string[];
  availableCount: number;
  drawnCategories: string[];
  customCount: number;
  isLanding: boolean;
  isPromptDeckOpen: boolean;
  newCategoryInput: string;
  activePack: string;
  canEditRoundSettings: boolean;
}

interface CategoriesActions {
  onIncludePackChange: (value: boolean) => void;
  onCategoryRefreshModeChange: (mode: CategoryRefreshMode) => void;
  onCatCountChange: (value: string) => void;
  onCatCountBlur: () => void;
  onRedraw: () => void;
  onAddCustom: () => void;
  onRemoveCustom: (category: string) => void;
  onNewCategoryInputChange: (value: string) => void;
  onTogglePromptDeck: () => void;
  onActivePackChange: (packId: string) => void;
}

function PackSection({
  activePack,
  canEditRoundSettings,
  onActivePackChange,
}: {
  activePack: string;
  canEditRoundSettings: boolean;
  onActivePackChange: (packId: string) => void;
}) {
  const { t } = useTranslation();
  const activeMeta = PACKS.find((pack) => pack.id === activePack);

  return (
    <div className="custom-categories">
      <label className="field-shell" htmlFor="categoryPack">
        <span>{t('packs.sectionTitle', { defaultValue: 'Category pack' })}</span>
        <select
          id="categoryPack"
          aria-label={t('packs.sectionTitle', { defaultValue: 'Category pack' })}
          value={activePack}
          disabled={!canEditRoundSettings}
          onChange={(event) => onActivePackChange(event.target.value)}
        >
          {PACKS.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {t(pack.labelKey, { defaultValue: pack.fallbackLabel })}
            </option>
          ))}
        </select>
      </label>
      {activeMeta ? (
        <p className="custom-empty">
          {t(activeMeta.descriptionKey, { defaultValue: activeMeta.fallbackDescription })}
        </p>
      ) : null}
    </div>
  );
}

interface CategoriesPanelProps {
  categories: CategoriesState;
  actions: CategoriesActions;
  inputRef: RefObject<HTMLInputElement | null>;
}

function CategoryToolbar({
  actions,
  catCountInput,
  includePackCategories,
}: Pick<CategoriesState, 'catCountInput' | 'includePackCategories'> & {
  actions: CategoriesActions;
}) {
  const { t } = useTranslation();

  return (
    <div className="category-toolbar category-toolbar--setup">
      <label className="field-shell field-shell--toggle" htmlFor="includePack">
        <span>{t('categories.includePack', { defaultValue: 'Include pack categories' })}</span>
        <input
          id="includePack"
          type="checkbox"
          checked={includePackCategories}
          onChange={(event) => actions.onIncludePackChange(event.target.checked)}
        />
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
      <p className="custom-empty">
        {t('categories.customAlwaysShown', {
          defaultValue: 'Custom categories always appear in the deck.',
        })}
      </p>
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

function CustomizeSheetBlock({
  actions,
  catCountInput,
  includePackCategories,
  customCategories,
  newCategoryInput,
  inputRef,
  activePack,
  canEditRoundSettings,
}: {
  actions: CategoriesActions;
  catCountInput: string;
  includePackCategories: boolean;
  customCategories: string[];
  newCategoryInput: string;
  inputRef: RefObject<HTMLInputElement | null>;
  activePack: string;
  canEditRoundSettings: boolean;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <IconButton
        label={t('categories.customize', { defaultValue: 'Customize deck' })}
        icon={<Icon icon={SlidersHorizontal} size={18} />}
        onClick={() => setIsOpen(true)}
      />
      <Sheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('categories.customizeTitle', { defaultValue: 'Customize deck' })}
        closeLabel={t('buttons.closeTooltip', { defaultValue: 'Close' })}
      >
        <PackSection
          activePack={activePack}
          canEditRoundSettings={canEditRoundSettings}
          onActivePackChange={actions.onActivePackChange}
        />
        <CategoryToolbar
          actions={actions}
          catCountInput={catCountInput}
          includePackCategories={includePackCategories}
        />
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
    includePackCategories,
    refreshMode,
    catCountInput,
    customCategories,
    availableCount,
    drawnCategories,
    customCount,
    isLanding,
    isPromptDeckOpen,
    newCategoryInput,
  } = categories;
  const deckToggleLabel = isPromptDeckOpen
    ? t('categories.hideDeck', { defaultValue: 'Hide categories' })
    : t('categories.showDeck', { defaultValue: 'Show categories' });
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
        <IconButton
          label={deckToggleLabel}
          icon={<Icon icon={isPromptDeckOpen ? ChevronUp : ChevronDown} size={20} />}
          aria-controls="categories-panel-content"
          aria-expanded={isPromptDeckOpen}
          onClick={actions.onTogglePromptDeck}
        />
      </div>

      {isPromptDeckOpen ? (
        <div className="categories-card__content categories-card__content--prompts-first">
          <div className="drawn-categories" id="categories-panel-content">
            <CategoryChecklist
              categories={drawnCategories}
              availableCount={availableCount}
              customCount={customCount}
              landing={isLanding}
            />
          </div>

          <div className="categories-card__actions">
            <IconButton
              label={pinButtonLabel}
              icon={<Icon icon={isPinned ? PinOff : Pin} size={18} />}
              aria-pressed={isPinned}
              onClick={() => actions.onCategoryRefreshModeChange(isPinned ? 'auto' : 'pinned')}
            />
            <IconButton
              label={t('buttons.redraw', { defaultValue: 'Redraw' })}
              icon={<Icon icon={RefreshCw} size={18} />}
              onClick={actions.onRedraw}
            />
            <CustomizeSheetBlock
              actions={actions}
              catCountInput={catCountInput}
              includePackCategories={includePackCategories}
              customCategories={customCategories}
              newCategoryInput={newCategoryInput}
              inputRef={inputRef}
              activePack={categories.activePack}
              canEditRoundSettings={categories.canEditRoundSettings}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { CategoriesPanel };
