import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSwipeToggle } from '../hooks/useSwipeToggle';
import { vibrate } from '../lib/haptics';
import { Icon } from './ui/Icon';

interface CategoryChecklistProps {
  categories: string[];
  availableCount: number;
  isStruck: (category: string) => boolean;
  onToggle: (category: string) => void;
}

interface CategoryChecklistItemProps {
  category: string;
  index: number;
  struck: boolean;
  onToggle: (category: string) => void;
}

function joinClassNames(...tokens: (string | false | null | undefined)[]): string {
  return tokens.filter(Boolean).join(' ');
}

function CategoryChecklistItem({ category, index, struck, onToggle }: CategoryChecklistItemProps) {
  const { t } = useTranslation();
  const { bindings, style, isDragging, direction, guardClick } = useSwipeToggle({
    onCommit: () => {
      vibrate('tap');
      onToggle(category);
    },
  });

  return (
    <li className="category-checklist__item">
      <button
        type="button"
        className={joinClassNames(
          'category-checklist__button',
          struck && 'category-checklist__button--struck',
        )}
        aria-pressed={struck}
        data-dragging={isDragging || undefined}
        data-direction={direction ?? undefined}
        style={style}
        {...bindings}
        onClick={() =>
          guardClick(() => {
            vibrate('tap');
            onToggle(category);
          })
        }
      >
        <span className="category-checklist__mark" aria-hidden="true">
          {struck ? <Icon icon={Check} size={18} strokeWidth={3} /> : index + 1}
        </span>
        <span className="category-checklist__label">{t(category, { ns: 'categories' })}</span>
      </button>
    </li>
  );
}

export function CategoryChecklist({
  categories,
  availableCount,
  isStruck,
  onToggle,
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
        aria-label={t('categories.drawnListLabel', { defaultValue: 'Category board' })}
      >
        {categories.map((category, index) => (
          <CategoryChecklistItem
            key={category}
            category={category}
            index={index}
            struck={isStruck(category)}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </section>
  );
}
