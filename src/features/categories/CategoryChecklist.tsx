import { useTranslation } from 'react-i18next';

interface CategoryChecklistProps {
  categories: string[];
  availableCount: number;
}

export function CategoryChecklist({ categories, availableCount }: CategoryChecklistProps) {
  const { t } = useTranslation();

  if (availableCount === 0) {
    return (
      <section className="category-checklist category-checklist--empty">
        <p className="category-checklist__empty">{t('categories.minimumRequired')}</p>
      </section>
    );
  }

  return (
    <section className="category-checklist">
      <ul
        className="category-checklist__list"
        aria-label={t('categories.drawnListLabel', { defaultValue: 'Selected categories' })}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: The desktop category list can become scrollable and needs a keyboard-focus target for Safari/axe.
        tabIndex={0}
      >
        {categories.map((category, index) => (
          <li key={category} className="category-checklist__item">
            <div className="category-checklist__row">
              <span className="category-checklist__mark" aria-hidden="true">
                {index + 1}
              </span>
              <span className="category-checklist__label">{t(category, { ns: 'categories' })}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
