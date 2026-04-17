import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import type { CategoryMode } from '../hooks/useSettings';

interface CategoriesState {
  mode: CategoryMode;
  catCountInput: string;
  customCategories: string[];
  drawnCategories: string[];
  availableCount: number;
  usedLetters: string[];
  newCategoryInput: string;
}

interface CategoriesActions {
  onCategoryModeChange: (mode: CategoryMode) => void;
  onCatCountChange: (value: string) => void;
  onCatCountBlur: () => void;
  onShuffle: () => void;
  onAddCustom: () => void;
  onRemoveCustom: (category: string) => void;
  onNewCategoryInputChange: (value: string) => void;
}

interface CategoriesPanelProps {
  categories: CategoriesState;
  actions: CategoriesActions;
  inputRef: RefObject<HTMLInputElement | null>;
}

function CategoriesMeta({
  availableCount,
  usedLetters,
}: Pick<CategoriesState, 'availableCount' | 'usedLetters'>) {
  const { t } = useTranslation();

  return (
    <div className="categories-meta">
      <p className="used-letters" aria-live="polite">
        {t('usedLetters', {
          letters: usedLetters.length > 0 ? usedLetters.join(', ') : '',
          empty: usedLetters.length > 0 ? '' : t('usedLettersEmpty'),
        })}
      </p>
      <p className="category-count">
        {t('categories.availableSummary', {
          defaultValue: '{{count}} prompts ready',
          count: availableCount,
        })}
      </p>
    </div>
  );
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
    <div className="category-toolbar card-surface">
      <div className="source-controls">
        <label htmlFor="categoryMode">{t('settings.categorySource')}</label>
        <select
          id="categoryMode"
          value={mode}
          onChange={(event) => actions.onCategoryModeChange(event.target.value as CategoryMode)}
        >
          <option value="default">{t('categories.default')}</option>
          <option value="custom">{t('categories.custom')}</option>
          <option value="mixed">{t('categories.mixed')}</option>
        </select>
      </div>
      <div className="cat-controls">
        <label htmlFor="catCount">{t('settings.categoryDraw')}</label>
        <input
          type="number"
          id="catCount"
          min={1}
          max={25}
          value={catCountInput}
          onChange={(event) => actions.onCatCountChange(event.target.value)}
          onBlur={actions.onCatCountBlur}
        />
        <button
          id="catBtn"
          type="button"
          className="btn-secondary cat-shuffle"
          onClick={actions.onShuffle}
        >
          {t('buttons.shuffle')}
        </button>
      </div>
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
    <div className="custom-categories card-surface">
      <label htmlFor="newCategory">{t('settings.addCustom')}</label>
      <div className="custom-category-input-row">
        <input
          ref={inputRef}
          id="newCategory"
          type="text"
          value={newCategoryInput}
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
        <button
          type="button"
          className="btn-secondary add-category-btn"
          onClick={actions.onAddCustom}
          title={t('buttons.addTooltip', { defaultValue: t('buttons.add') })}
        >
          {t('buttons.add')}
        </button>
      </div>
      {customCategories.length > 0 ? (
        <ul
          className="custom-list"
          aria-label={t('categories.customListLabel', { defaultValue: 'Custom categories' })}
        >
          {customCategories.map((category) => (
            <li key={category}>
              <span>{category}</span>
              <button
                type="button"
                className="remove-btn"
                aria-label={`${t('buttons.remove')} ${category}`}
                onClick={() => actions.onRemoveCustom(category)}
              >
                {t('buttons.remove')}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="custom-empty">{t('categories.noCustom')}</p>
      )}
    </div>
  );
}

function DrawnCategories({
  availableCount,
  drawnCategories,
}: Pick<CategoriesState, 'availableCount' | 'drawnCategories'>) {
  const { t } = useTranslation();

  return (
    <>
      {availableCount === 0 ? (
        <p className="empty-state">{t('categories.minimumRequired')}</p>
      ) : null}

      <ul
        className="category-list"
        aria-label={t('categories.drawnListLabel', { defaultValue: 'Category board' })}
      >
        {drawnCategories.map((category, index) => (
          <li key={category}>
            <span className="cat-index">{`${index + 1}.`}</span>
            <span>{t(category, { ns: 'categories' })}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function CategoriesPanel({ categories, actions, inputRef }: CategoriesPanelProps) {
  const { t } = useTranslation();
  const {
    mode,
    catCountInput,
    customCategories,
    drawnCategories,
    availableCount,
    usedLetters,
    newCategoryInput,
  } = categories;

  return (
    <section className="categories-card" aria-labelledby="categories-panel-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t('categories.eyebrow', { defaultValue: 'Prompt deck' })}</p>
          <h2 id="categories-panel-title">{t('categories.title')}</h2>
        </div>
        <p>
          {t('categories.description', {
            defaultValue:
              'Mix official and custom prompts, then reshuffle a fresh board whenever the table needs a reset.',
          })}
        </p>
      </div>

      <CategoriesMeta availableCount={availableCount} usedLetters={usedLetters} />

      <CategoryToolbar actions={actions} catCountInput={catCountInput} mode={mode} />

      <CustomCategories
        actions={actions}
        customCategories={customCategories}
        inputRef={inputRef}
        newCategoryInput={newCategoryInput}
      />

      <DrawnCategories availableCount={availableCount} drawnCategories={drawnCategories} />
    </section>
  );
}

export { CategoriesPanel };
