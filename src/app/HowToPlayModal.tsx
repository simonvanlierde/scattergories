import {
  ChevronDown,
  ExternalLink,
  Globe,
  Info,
  Keyboard,
  ListChecks,
  type LucideIcon,
  Settings,
  SunMoon,
  Tags,
  Timer,
  Volume2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/ui/Icon';
import { Sheet } from '@/shared/ui/Sheet';

interface HowToPlayModalProps {
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
  { keys: '?', labelKey: 'rail.shortcuts.help', fallbackLabel: 'Open this help dialog' },
]);

// One icon per setting, matching the order of `modal.settingsItems`
// (round timer, language, sound, theme) and the controls in the footer.
const SETTINGS_ICONS: readonly LucideIcon[] = [Timer, Globe, Volume2, SunMoon];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

interface SectionProps {
  icon: LucideIcon;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function Section({ icon, title, defaultOpen = false, children }: SectionProps) {
  return (
    <details className="howto__section" open={defaultOpen}>
      <summary className="howto__summary">
        <Icon icon={icon} size={18} className="howto__summary-icon" />
        <span className="howto__summary-title">{title}</span>
        <Icon icon={ChevronDown} size={18} className="howto__chevron" />
      </summary>
      <div className="howto__panel">{children}</div>
    </details>
  );
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const { t } = useTranslation();
  const gameplayPoints = toStringArray(t('modal.gameplayPoints', { returnObjects: true }));
  const settingsItems = toStringArray(t('modal.settingsItems', { returnObjects: true }));

  return (
    <Sheet
      open={true}
      onClose={onClose}
      title={t('modal.title')}
      closeLabel={t('buttons.closeTooltip', { defaultValue: t('buttons.close') })}
    >
      <div className="howto">
        <p className="howto__lead">{t('modal.objectiveText')}</p>

        <Section icon={ListChecks} title={t('modal.gameplay')} defaultOpen={true}>
          <ol className="howto__steps">
            {gameplayPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </Section>

        <Section icon={Tags} title={t('modal.categories')}>
          <p>{t('modal.categoriesText')}</p>
        </Section>

        <Section icon={Settings} title={t('modal.settings')}>
          <p>{t('modal.settingsIntro')}</p>
          <ul className="howto__settings">
            {settingsItems.map((item, index) => (
              <li key={item}>
                <Icon
                  icon={SETTINGS_ICONS[index] ?? Settings}
                  size={16}
                  className="howto__settings-icon"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Keyboard} title={t('modal.shortcuts')}>
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
        </Section>

        <Section icon={Info} title={t('modal.about')}>
          <ul className="about-links">
            <li>
              <a
                href="https://hasbrogames.com/scattergories"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link"
              >
                <Icon icon={ExternalLink} size={16} />
                {t('modal.officialGame')}
                <span className="sr-only"> {t('modal.opensInNewTab')}</span>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/simonvanlierde/scattergories"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link"
              >
                <Icon icon={ExternalLink} size={16} />
                {t('modal.sourceCode')}
                <span className="sr-only"> {t('modal.opensInNewTab')}</span>
              </a>
            </li>
          </ul>
          <p className="modal-privacy">{t('modal.privacy')}</p>
          <p className="modal-version">{t('modal.version', { version: __APP_VERSION__ })}</p>
        </Section>
      </div>
    </Sheet>
  );
}
