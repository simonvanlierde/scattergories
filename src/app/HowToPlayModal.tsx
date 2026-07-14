import {
  ChevronDown,
  Info,
  Keyboard,
  type LucideIcon,
  Pin,
  RefreshCw,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import type { ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { BrandMark } from "@/shared/ui/BrandMark";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Sheet } from "@/shared/ui/Sheet";

const OFFICIAL_GAME_URL = "https://hasbrogames.com/scattergories";
const SOURCE_CODE_URL = "https://github.com/simonvanlierde/scattergories";
const LICENSE_URL = "https://github.com/simonvanlierde/scattergories/blob/main/LICENSE";

interface HowToPlayModalProps {
  onClose: () => void;
  /**
   * First run only: the rules double as the welcome, so they get a CTA that
   * rolls the opening letter. Absent when opened from the footer's ? button.
   */
  onStart?: () => void;
}

interface ShortcutDefinition {
  keys: string;
  labelKey: string;
}

const SHORTCUTS: readonly ShortcutDefinition[] = [
  { keys: "Space", labelKey: "rail.shortcuts.space" },
  { keys: "R", labelKey: "rail.shortcuts.r" },
  { keys: "P", labelKey: "rail.shortcuts.p" },
  { keys: "C", labelKey: "rail.shortcuts.c" },
  { keys: "?", labelKey: "rail.shortcuts.help" },
];

// One icon per mechanic, matching the order of `modal.categoriesItems`
// (customize deck, pin, reroll) and the controls in the categories panel.
const CATEGORY_ICONS: readonly LucideIcon[] = [SlidersHorizontal, Pin, RefreshCw];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

interface SectionProps {
  icon: LucideIcon;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function ExternalAnchor({ href, children }: { href: string; children?: ReactNode }) {
  // `children` is the link text <Trans> injects from the translated message.
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="about-link-inline">
      {children}
    </a>
  );
}

function Attribution() {
  return (
    <p className="modal-attribution">
      <Trans
        i18nKey="modal.attribution"
        components={{
          official: <ExternalAnchor href={OFFICIAL_GAME_URL} />,
          repo: <ExternalAnchor href={SOURCE_CODE_URL} />,
          license: <ExternalAnchor href={LICENSE_URL} />,
        }}
      />
    </p>
  );
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

export function HowToPlayModal({ onClose, onStart }: HowToPlayModalProps) {
  const { t } = useTranslation();
  const gameplayPoints = toStringArray(t("modal.gameplayPoints", { returnObjects: true }));
  const categoriesItems = toStringArray(t("modal.categoriesItems", { returnObjects: true }));

  return (
    <Sheet
      open={true}
      onClose={onClose}
      title={t("modal.title")}
      closeLabel={t("buttons.closeTooltip")}
    >
      <div className="howto">
        <p className="howto__masthead">
          <BrandMark size={72} />
          <span>{t("title")}</span>
        </p>

        <p className="howto__lead">{t("modal.objectiveText")}</p>

        {/* One numbered list, not a hero summary plus a Gameplay section saying
            the same thing twice. These points carry the actual rules. */}
        <ol className="howto__beats">
          {gameplayPoints.map((point, index) => (
            <li key={point} className="howto__beat">
              <span className="howto__beat-num" aria-hidden="true">
                {index + 1}
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ol>

        {onStart ? (
          <Button
            variant="primary"
            size="lg"
            className="howto__start"
            onClick={onStart}
            data-autofocus
          >
            {t("buttons.startRound")}
          </Button>
        ) : null}

        <Section icon={Tags} title={t("modal.categories")}>
          <p>{t("modal.categoriesText")}</p>
          <ul className="howto__settings">
            {categoriesItems.map((item, index) => (
              <li key={item}>
                <Icon
                  icon={CATEGORY_ICONS[index] ?? Tags}
                  size={16}
                  className="howto__settings-icon"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Keyboard} title={t("modal.shortcuts")}>
          <dl className="shortcuts-list">
            {SHORTCUTS.map((shortcut) => (
              <div key={shortcut.keys} className="shortcuts-list__row">
                <dt className="shortcuts-list__key">
                  <kbd>{shortcut.keys}</kbd>
                </dt>
                <dd className="shortcuts-list__label">{t(shortcut.labelKey)}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section icon={Info} title={t("modal.about")}>
          <Attribution />
          <p className="modal-privacy">{t("modal.privacy")}</p>
          <p className="modal-version">{t("modal.version", { version: __APP_VERSION__ })}</p>
        </Section>
      </div>
    </Sheet>
  );
}
