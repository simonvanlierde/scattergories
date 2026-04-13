import { useTranslation } from 'react-i18next';
import type { CategoryMode } from '../hooks/useSettings';

interface CategoriesPanelProps {
  categoryMode: CategoryMode;
  catCountInput: string;
  customCategories: string[];
  drawnCategories: string[];
  availableCount: number;
  usedLetters: string[];
  newCategoryInput: string;
  onCategoryModeChange: (mode: CategoryMode) => void;
  onCatCountChange: (value: string) => void;
  onCatCountBlur: () => void;
  onShuffle: () => void;
  onAddCustom: () => void;
  onRemoveCustom: (category: string) => void;
  onNewCategoryInputChange: (value: string) => void;
}

export function CategoriesPanel(props: CategoriesPanelProps) {
  const { t } = useTranslation();
  const {
    categoryMode,
    catCountInput,
    customCategories,
    drawnCategories,
    availableCount,
    usedLetters,
    newCategoryInput,
  } = props;

  return (
    <section className="categories-section" aria-label="Categories">
      <h2>{t('categories.title')}</h2>
      <div className="source-controls">
        <label htmlFor="categoryMode">{t('settings.categorySource')}</label>
        <select
          id="categoryMode"
          value={categoryMode}
          onChange={(event) => props.onCategoryModeChange(event.target.value as CategoryMode)}
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
          onChange={(event) => props.onCatCountChange(event.target.value)}
          onBlur={props.onCatCountBlur}
        />
        <button
          id="catBtn"
          type="button"
          className="btn-secondary cat-shuffle"
          onClick={props.onShuffle}
        >
          {t('buttons.shuffle')}
        </button>
      </div>
      <div className="custom-categories">
        <label htmlFor="newCategory">{t('settings.addCustom')}</label>
        <div className="custom-category-input-row">
          <input
            id="newCategory"
            type="text"
            value={newCategoryInput}
            maxLength={50}
            placeholder={t('settings.placeholder')}
            onChange={(event) => props.onNewCategoryInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                props.onAddCustom();
              }
            }}
          />
          <button
            type="button"
            className="btn-secondary add-category-btn"
            onClick={props.onAddCustom}
          >
            {t('buttons.add')}
          </button>
        </div>
        {customCategories.length > 0 ? (
          <ul className="custom-list" aria-label="Custom categories">
            {customCategories.map((category) => (
              <li key={category}>
                <span>{category}</span>
                <button
                  type="button"
                  className="remove-btn"
                  aria-label={`${t('buttons.remove')} ${category}`}
                  onClick={() => props.onRemoveCustom(category)}
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

      {availableCount === 0 ? (
        <p className="custom-empty">{t('categories.minimumRequired')}</p>
      ) : null}

      <ul className="cat-list" id="catList">
        {drawnCategories.map((category, index) => (
          <li key={category}>
            <span className="cat-index">{index + 1}.</span>
            <span>{category}</span>
          </li>
        ))}
      </ul>

      <p className="used-letters">
        {t('usedLetters', {
          letters: usedLetters.length > 0 ? usedLetters.join(', ') : '',
          empty: usedLetters.length > 0 ? '' : t('usedLettersEmpty'),
        })}
      </p>
    </section>
  );
}
