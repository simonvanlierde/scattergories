import { Pin, PinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/ui/Icon';

interface CategoryChecklistProps {
  categories: string[];
  availableCount: number;
  landing: boolean;
  pinnedSet: Set<string>;
  customSet: Set<string>;
  onTogglePin: (name: string) => void;
}

export function CategoryChecklist({
  categories,
  availableCount,
  landing,
  pinnedSet,
  customSet,
  onTogglePin,
}: CategoryChecklistProps) {
  const { t } = useTranslation();

  // Only show the "not enough categories" notice when nothing is drawn — a round
  // already in progress keeps showing its drawn cards even if the deck is emptied.
  if (availableCount === 0 && categories.length === 0) {
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
      >
        {categories.map((category, index) => {
          const isPinned = pinnedSet.has(category);
          // Only unpinned slots roll and land; pinned slots hold still.
          const isFillSlot = !isPinned;
          const isCustom = customSet.has(category);
          const label = isCustom ? category : t(category, { ns: 'categories' });
          const labelClass =
            landing && isFillSlot
              ? 'category-checklist__label category-checklist__label--landing'
              : 'category-checklist__label';
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: Stable slot positions keep the roll animation in place while labels change.
              key={index}
              className={`category-checklist__item${isPinned ? ' category-checklist__item--pinned' : ''}${isCustom ? ' category-checklist__item--custom' : ''}`}
            >
              <button
                type="button"
                className="category-checklist__chip"
                aria-pressed={isPinned}
                aria-label={
                  isPinned
                    ? t('categories.unpinOne', { defaultValue: 'Unpin {{name}}', name: label })
                    : t('categories.pinOne', { defaultValue: 'Pin {{name}}', name: label })
                }
                onClick={() => onTogglePin(category)}
              >
                <span className="category-checklist__mark" aria-hidden="true">
                  {index + 1}
                </span>
                <span className={labelClass}>{label}</span>
                <Icon
                  icon={isPinned ? Pin : PinOff}
                  size={16}
                  className="category-checklist__pin"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
