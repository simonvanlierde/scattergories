import { useTranslation } from 'react-i18next';

interface CategoryChecklistProps {
  categories: string[];
  availableCount: number;
  customCount?: number;
  landing?: boolean;
}

export function CategoryChecklist({
  categories,
  availableCount,
  customCount = 0,
  landing = false,
}: CategoryChecklistProps) {
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
        {categories.map((category, index) => {
          // Only pack-filled slots (after the custom ones) roll and land.
          const isPackSlot = index >= customCount;
          const labelClass =
            landing && isPackSlot
              ? 'category-checklist__label category-checklist__label--landing'
              : 'category-checklist__label';
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: Stable slot positions keep the roll animation in place while labels change.
            <li key={index} className="category-checklist__item">
              <div className="category-checklist__row">
                <span className="category-checklist__mark" aria-hidden="true">
                  {index + 1}
                </span>
                <span className={labelClass}>{t(category, { ns: 'categories' })}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
