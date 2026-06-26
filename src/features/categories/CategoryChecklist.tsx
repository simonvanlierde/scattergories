import { Pin, PinOff, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';

interface CategoryChecklistProps {
  categories: string[];
  availableCount: number;
  pinnedCount?: number;
  landing?: boolean;
  canEdit?: boolean;
  pinnedSet?: Set<string>;
  customSet?: Set<string>;
  onTogglePin?: (name: string) => void;
  onRedrawSlot?: (index: number) => void;
}

function ChecklistRowControls({
  category,
  label,
  isPinned,
  onTogglePin,
  onRedrawSlot,
  index,
}: {
  category: string;
  label: string;
  isPinned: boolean;
  onTogglePin?: (name: string) => void;
  onRedrawSlot?: (index: number) => void;
  index: number;
}) {
  const { t } = useTranslation();
  return (
    <span className="category-checklist__actions">
      <IconButton
        label={
          isPinned
            ? t('categories.unpinOne', { defaultValue: 'Unpin {{name}}', name: label })
            : t('categories.pinOne', { defaultValue: 'Pin {{name}}', name: label })
        }
        icon={<Icon icon={isPinned ? Pin : PinOff} size={16} />}
        aria-pressed={isPinned}
        onClick={() => onTogglePin?.(category)}
      />
      <IconButton
        label={t('categories.redrawOne', { defaultValue: 'Replace {{name}}', name: label })}
        icon={<Icon icon={Trash2} size={16} />}
        disabled={isPinned}
        onClick={() => onRedrawSlot?.(index)}
      />
    </span>
  );
}

export function CategoryChecklist({
  categories,
  availableCount,
  pinnedCount = 0,
  landing = false,
  canEdit = false,
  pinnedSet,
  customSet,
  onTogglePin,
  onRedrawSlot,
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
          // Only unpinned fill slots (after the pinned ones) roll and land.
          const isFillSlot = index >= pinnedCount;
          const isPinned = pinnedSet?.has(category) ?? false;
          const isCustom = customSet?.has(category) ?? false;
          const label = isCustom ? category : t(category, { ns: 'categories' });
          const labelClass =
            landing && isFillSlot
              ? 'category-checklist__label category-checklist__label--landing'
              : 'category-checklist__label';
          const itemClass = `category-checklist__item${isCustom ? ' category-checklist__item--custom' : ''}`;
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: Stable slot positions keep the roll animation in place while labels change.
              key={index}
              className={itemClass}
            >
              <div className="category-checklist__row">
                <span className="category-checklist__mark" aria-hidden="true">
                  {index + 1}
                </span>
                <span className={labelClass}>{label}</span>
                {canEdit ? (
                  <ChecklistRowControls
                    category={category}
                    label={label}
                    isPinned={isPinned}
                    onTogglePin={onTogglePin}
                    onRedrawSlot={onRedrawSlot}
                    index={index}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
