import { useTranslation } from 'react-i18next';
import { Sheet } from '@/shared/ui/Sheet';

interface ShortcutsSheetProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutDefinition {
  keys: string;
  labelKey: string;
  fallbackLabel: string;
}

const SHORTCUTS: readonly ShortcutDefinition[] = Object.freeze([
  { keys: 'Space', labelKey: 'rail.shortcuts.space', fallbackLabel: 'Start or advance a round' },
  { keys: 'R', labelKey: 'rail.shortcuts.r', fallbackLabel: 'Re-roll the current letter' },
  { keys: 'P', labelKey: 'rail.shortcuts.p', fallbackLabel: 'Pause or resume' },
  { keys: 'C', labelKey: 'rail.shortcuts.c', fallbackLabel: 'Toggle the categories panel' },
  { keys: 'A', labelKey: 'rail.shortcuts.a', fallbackLabel: 'Add a custom category' },
  { keys: '?', labelKey: 'rail.shortcuts.help', fallbackLabel: 'Open this shortcut list' },
]);

export function ShortcutsSheet({ open, onClose }: ShortcutsSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('rail.shortcuts.title', { defaultValue: 'Keyboard shortcuts' })}
      closeLabel={t('buttons.closeTooltip', { defaultValue: 'Close' })}
    >
      <dl className="shortcuts-list">
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.keys} className="shortcuts-list__row">
            <dt className="shortcuts-list__key">
              <kbd>{shortcut.keys}</kbd>
            </dt>
            <dd className="shortcuts-list__label">
              {t(shortcut.labelKey, { defaultValue: shortcut.fallbackLabel })}
            </dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
