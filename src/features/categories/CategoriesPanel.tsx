import { useLingui } from "@lingui/react";
import { ChevronDown, Pin, Plus, RefreshCw, SlidersHorizontal, Tags, Trash2 } from "lucide-react";
import { useState } from "react";
import { PACKS } from "@/domain/deck";
import { catCountDefault, catCountMax, catCountMin } from "@/domain/game/constants";
import { useSettings } from "@/features/settings/SettingsProvider";
import { Button } from "@/shared/ui/Button";
import { cx } from "@/shared/ui/cx";
import { DebouncedNumberField } from "@/shared/ui/DebouncedNumberField";
import { Icon } from "@/shared/ui/Icon";
import { IconButton } from "@/shared/ui/IconButton";
import { Sheet } from "@/shared/ui/Sheet";
import { useConfirmTap } from "@/shared/ui/useConfirmTap";
import { CategoryChecklist } from "./CategoryChecklist";
import type { CategoryBoard } from "./useCategoryBoard";

interface CategoriesPanelProps {
  board: CategoryBoard;
  availableCount: number;
  isPromptDeckOpen: boolean;
  /** `canEditDeck`: false while the clock counts down. Opening the deck then pauses the round. */
  canEdit: boolean;
  onTogglePromptDeck: () => void;
  onTogglePause: () => void;
}

function DeckSettings() {
  const { _: t } = useLingui();
  const { settings, update } = useSettings();
  return (
    <div className="deck-settings">
      <DebouncedNumberField
        id="catCount"
        label={t("settings.categoryDraw")}
        value={settings.catCountInput}
        min={catCountMin}
        max={catCountMax}
        fallback={catCountDefault}
        suffix={t("categories.drawUnit")}
        onCommit={(value) => update("catCountInput", value)}
      />
    </div>
  );
}

function AddCustomRow() {
  const { _: t } = useLingui();
  const { addCustom } = useSettings();
  // Local state keeps keystrokes from re-rendering the (large) deck list.
  const [value, setValue] = useState("");
  const submit = () => {
    addCustom(value);
    setValue("");
  };
  return (
    <div className="deck-add__custom">
      <input
        id="newCategory"
        type="text"
        value={value}
        aria-label={t("settings.addCustom")}
        maxLength={50}
        placeholder={`${t("settings.addCustom")}...`}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
      />
      <Button
        variant="primary"
        onClick={submit}
        leadingIcon={<Icon icon={Plus} size={18} />}
        aria-label={t("buttons.add")}
        title={t("buttons.addTooltip")}
      />
    </div>
  );
}

function AddCategories() {
  const { _: t } = useLingui();
  return (
    <section className="deck-section">
      <h3 className="deck-section__title">{t("categories.addSectionTitle")}</h3>
      <div className="deck-add">
        <AddPackField />
        <AddCustomRow />
      </div>
    </section>
  );
}

function AddPackField() {
  const { _: t, i18n } = useLingui();
  const { addPack } = useSettings();
  const packs = [...PACKS]
    .map((pack) => ({
      id: pack.id,
      label: `${t(pack.labelKey)} · ${t(pack.hintKey)}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, i18n.locale));
  return (
    <label className="deck-list__pack" htmlFor="addPack">
      <span className="sr-only">{t("categories.addPack")}</span>
      <select
        id="addPack"
        className="settings-select"
        value=""
        onChange={(event) => {
          if (event.target.value) {
            addPack(event.target.value);
          }
        }}
      >
        <option value="">{t("categories.addPackPlaceholder")}</option>
        {packs.map((pack) => (
          <option key={pack.id} value={pack.id}>
            {pack.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface DeckRow {
  name: string;
  label: string;
  isCustom: boolean;
}

function DeckListItem({ row, isPinned }: { row: DeckRow; isPinned: boolean }) {
  const { _: t } = useLingui();
  const { togglePin, removeCustom, removeBuiltin } = useSettings();
  return (
    <li className={cx("deck-list__item", row.isCustom && "deck-list__item--custom")}>
      <span className="deck-list__label" title={row.label}>
        {row.label}
      </span>
      <span className="deck-list__actions">
        <IconButton
          label={t("categories.pinOne", { name: row.label })}
          icon={<Icon icon={Pin} size={16} />}
          aria-pressed={isPinned}
          onClick={() => togglePin(row.name)}
        />
        <IconButton
          label={t("buttons.remove")}
          icon={<Icon icon={Trash2} size={16} />}
          onClick={() => (row.isCustom ? removeCustom(row.name) : removeBuiltin(row.name))}
        />
      </span>
    </li>
  );
}

function DeckBulkActions({ hasCustom, hasBuiltins }: { hasCustom: boolean; hasBuiltins: boolean }) {
  const { _: t } = useLingui();
  const { removeAllCustom, removeAllBuiltins } = useSettings();
  if (!(hasCustom || hasBuiltins)) {
    return null;
  }
  return (
    <div className="deck-list__bulk">
      {hasCustom ? <BulkRemoveButton label={t("categories.removeAllCustom")} onRemove={removeAllCustom} /> : null}
      {hasBuiltins ? <BulkRemoveButton label={t("categories.removeAllBuiltins")} onRemove={removeAllBuiltins} /> : null}
    </div>
  );
}

/** Bulk removal is two taps: the first arms the button, the second (within 3s) fires. */
function BulkRemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { _: t } = useLingui();
  const confirm = useConfirmTap(onRemove);
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cx("deck-bulk-action", confirm.armed && "deck-bulk-action--armed")}
      aria-live="polite"
      onClick={confirm.onClick}
    >
      {confirm.armed ? t("buttons.removeAllConfirm") : label}
    </Button>
  );
}

function DeckList() {
  const { _: t, i18n } = useLingui();
  const { customCategories, deckBuiltins, pinned } = useSettings().settings;
  const pinnedSet = new Set(pinned);
  // Within each group: pinned first, then alphabetical.
  const byPinThenLabel = (a: DeckRow, b: DeckRow) => {
    const aPinned = pinnedSet.has(a.name);
    const bPinned = pinnedSet.has(b.name);
    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }
    return a.label.localeCompare(b.label, i18n.locale);
  };
  const customs = customCategories.map((name) => ({ name, label: name, isCustom: true })).sort(byPinThenLabel);
  const builtins = deckBuiltins
    .map((name) => ({ name, label: t(`category.${name}`), isCustom: false }))
    .sort(byPinThenLabel);
  const rows: DeckRow[] = [...customs, ...builtins];

  const hasCustom = customCategories.length > 0;
  const hasBuiltins = deckBuiltins.length > 0;

  return (
    <section className="deck-section">
      <div className="deck-section__head">
        <h3 className="deck-section__title">{t("categories.deckSectionTitle")}</h3>
        <span className="deck-list__count">
          {t("categories.deckCount", {
            custom: customCategories.length,
            builtin: deckBuiltins.length,
          })}
        </span>
      </div>
      <ul className="deck-list__items" aria-label={t("categories.deckLabel")}>
        {rows.length === 0 ? (
          <li className="deck-list__empty">{t("categories.emptyDeck")}</li>
        ) : (
          rows.map((row) => (
            <DeckListItem
              key={`${row.isCustom ? "c" : "b"}:${row.name}`}
              row={row}
              isPinned={pinnedSet.has(row.name)}
            />
          ))
        )}
      </ul>
      <DeckBulkActions hasCustom={hasCustom} hasBuiltins={hasBuiltins} />
    </section>
  );
}

function CustomizeSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { _: t } = useLingui();
  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title={t("categories.customizeTitle")}
      closeLabel={t("buttons.closeTooltip")}
    >
      <DeckSettings />
      <AddCategories />
      <DeckList />
    </Sheet>
  );
}

function CategoriesCardHeader({
  panel,
  deckToggleLabel,
  allPinned,
  onCustomize,
}: {
  panel: CategoriesPanelProps;
  deckToggleLabel: string;
  allPinned: boolean;
  onCustomize: () => void;
}) {
  const { _: t } = useLingui();
  const { togglePinAll } = useSettings();
  const { board, canEdit, isPromptDeckOpen } = panel;
  return (
    <div className="categories-card__header">
      <div className="categories-card__heading">
        <h2 id="categories-panel-title">
          <Icon icon={Tags} size={22} />
          <span className="categories-card__title-text">{t("categories.title")}</span>
        </h2>
        <IconButton
          label={deckToggleLabel}
          icon={<Icon icon={ChevronDown} size={20} className="categories-card__chevron" />}
          aria-controls="categories-panel-content"
          aria-expanded={isPromptDeckOpen}
          onClick={panel.onTogglePromptDeck}
        />
      </div>
      {isPromptDeckOpen ? (
        <div className="categories-card__header-actions">
          <IconButton
            label={t("buttons.redraw")}
            icon={<Icon icon={RefreshCw} size={18} />}
            disabled={!canEdit}
            onClick={() => board.redrawCategories(true)}
          />
          <IconButton
            label={t("categories.pinAll")}
            icon={<Icon icon={Pin} size={18} />}
            aria-pressed={allPinned}
            disabled={!canEdit || board.spinning}
            onClick={() => togglePinAll(board.drawnCategories)}
          />
          <IconButton
            label={t("categories.customize")}
            icon={<Icon icon={SlidersHorizontal} size={18} />}
            onClick={onCustomize}
          />
        </div>
      ) : null}
    </div>
  );
}

function CategoriesPanel(props: CategoriesPanelProps) {
  const { board, availableCount, isPromptDeckOpen, canEdit, onTogglePause } = props;
  const { _: t } = useLingui();
  const { settings, togglePin } = useSettings();
  const { drawnCategories } = board;
  const pinnedSet = new Set(settings.pinned);
  // Decoration uses the frozen draw-time snapshot, not the live deck, so editing
  // the deck mid-round never re-styles (or blanks) the categories already drawn.
  const customSet = new Set(board.drawnCustom);
  // A fixed name: aria-expanded carries the state, so "Hide/Open" would contradict it.
  const deckToggleLabel = t("categories.title");
  const allPinned = drawnCategories.length > 0 && drawnCategories.every((name) => pinnedSet.has(name));
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Editing the deck mid-round auto-pauses the clock; the edits themselves only
  // take effect on the next redraw (handled in useCategoryBoard).
  const openCustomize = () => {
    if (!canEdit) {
      onTogglePause();
    }
    setIsCustomizing(true);
  };

  return (
    <section
      className={cx("categories-card", !isPromptDeckOpen && "categories-card--collapsed")}
      aria-labelledby="categories-panel-title"
      data-open={isPromptDeckOpen ? "true" : "false"}
    >
      <CategoriesCardHeader
        panel={props}
        deckToggleLabel={deckToggleLabel}
        allPinned={allPinned}
        onCustomize={openCustomize}
      />
      <CustomizeSheet isOpen={isCustomizing} onClose={() => setIsCustomizing(false)} />

      {isPromptDeckOpen ? (
        <div className="categories-card__content categories-card__content--prompts-first">
          <div className="drawn-categories" id="categories-panel-content">
            <CategoryChecklist
              categories={drawnCategories}
              availableCount={availableCount}
              landing={board.landing}
              pinnedSet={pinnedSet}
              customSet={customSet}
              // A tap mid-roll would pin whichever name was passing through.
              disabled={!canEdit || board.spinning}
              onTogglePin={togglePin}
              onCustomize={openCustomize}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { CategoriesPanel };
