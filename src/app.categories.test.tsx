// spell-checker: ignore Ñandú
import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ensureLanguageLoaded, i18n } from "@/i18n/config";
import { CUSTOM_CATEGORY, KEYBOARD_CATEGORY, ONLY_CUSTOM_CATEGORY, PERSISTED_CATEGORY } from "./test/constants";
import { DEFAULT_DRAW_COUNT } from "./test/gameConstants";
import {
  openCustomizeDeck,
  renderApp,
  resetAppTestState,
  SELECTED_CATEGORIES,
  selectedCategoryItems,
} from "./test/renderApp";

const DECK_LABEL = "Category deck";
const EMPTY_DECK = /deck is empty/i;
const MIN_VISIBLE_BOARD_ITEMS = 1;

beforeEach(resetAppTestState);
// Lingui is module-global: put English back so later tests find their labels.
afterEach(async () => {
  cleanup();
  if (i18n.locale !== "en") {
    await i18n.activate("en");
  }
});

// Bulk removal is a two-tap action: the first tap arms, the second confirms.
async function removeAllBuiltins(user: Awaited<ReturnType<typeof renderApp>>["user"], dialog: HTMLElement) {
  const button = within(dialog).getByRole("button", { name: "Remove all built-in" });
  await user.click(button);
  await user.click(button);
}

function deckRow(dialog: HTMLElement, name: string): HTMLElement {
  const deck = within(dialog).getByRole("list", { name: DECK_LABEL });
  const row = within(deck).getByText(name).closest("li");
  if (!row) {
    throw new Error(`No deck row for ${name}`);
  }
  return row as HTMLElement;
}

it("adds and removes a custom category from the deck", async () => {
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);

  const input = within(dialog).getByRole("textbox", { name: "Add custom category" });
  await user.type(input, CUSTOM_CATEGORY);
  await user.click(within(dialog).getByRole("button", { name: "Add" }));

  expect(within(dialog).getByRole("list", { name: DECK_LABEL })).toHaveTextContent(CUSTOM_CATEGORY);

  await user.click(within(deckRow(dialog, CUSTOM_CATEGORY)).getByRole("button", { name: "Remove" }));

  expect(within(dialog).getByRole("list", { name: DECK_LABEL })).not.toHaveTextContent(CUSTOM_CATEGORY);
});

it("shows guidance when the deck is emptied and accepts a custom entry", async () => {
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);

  // Clearing built-ins (with no customs) empties the deck.
  await removeAllBuiltins(user, dialog);
  expect(within(dialog).getByText(EMPTY_DECK)).toBeInTheDocument();

  const input = within(dialog).getByRole("textbox", { name: "Add custom category" });
  await user.type(input, `${KEYBOARD_CATEGORY}{Enter}`);

  expect(within(dialog).getByRole("list", { name: DECK_LABEL })).toHaveTextContent(KEYBOARD_CATEGORY);
});

it("offers the deck sheet from the empty board", async () => {
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);
  await removeAllBuiltins(user, dialog);
  await user.click(within(dialog).getByRole("button", { name: "Close this window" }));

  const empty = screen.getByText("Add categories to your deck to play.").parentElement as HTMLElement;
  await user.click(within(empty).getByRole("button", { name: "Customize deck" }));
  expect(await screen.findByRole("dialog", { name: "Customize deck" })).toBeVisible();
});

it("always shows custom categories and lets built-ins be cleared and re-added", async () => {
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);

  await user.type(within(dialog).getByRole("textbox", { name: "Add custom category" }), ONLY_CUSTOM_CATEGORY);
  await user.click(within(dialog).getByRole("button", { name: "Add" }));

  // The custom category appears in the drawn deck alongside built-ins.
  const drawnList = screen.getByRole("list", { name: SELECTED_CATEGORIES });
  expect(drawnList).toHaveTextContent(ONLY_CUSTOM_CATEGORY);
  expect(within(drawnList).getAllByRole("listitem").length).toBeGreaterThan(MIN_VISIBLE_BOARD_ITEMS);

  // Clearing built-ins leaves only the custom one.
  await removeAllBuiltins(user, dialog);
  expect(within(drawnList).getAllByRole("listitem")).toHaveLength(MIN_VISIBLE_BOARD_ITEMS);
  expect(drawnList).toHaveTextContent(ONLY_CUSTOM_CATEGORY);

  // Adding a pack restores built-in fill.
  await user.selectOptions(within(dialog).getByLabelText("Add a category pack"), "foodie");
  await waitFor(() => {
    expect(selectedCategoryItems().length).toBeGreaterThan(MIN_VISIBLE_BOARD_ITEMS);
  });
});

it("updates the drawn category count", async () => {
  const { user } = await renderApp();

  await waitFor(() => expect(selectedCategoryItems()).toHaveLength(DEFAULT_DRAW_COUNT));

  const dialog = await openCustomizeDeck(user);
  const drawInput = within(dialog).getByLabelText("Draw");
  await user.clear(drawInput);
  await user.type(drawInput, String(4));
  await user.tab();

  expect(selectedCategoryItems()).toHaveLength(4);
});

it("persists custom categories across remount with the same localStorage", async () => {
  const first = await renderApp();
  const dialog = await openCustomizeDeck(first.user);

  await first.user.type(within(dialog).getByRole("textbox", { name: "Add custom category" }), PERSISTED_CATEGORY);
  await first.user.click(within(dialog).getByRole("button", { name: "Add" }));

  first.view.unmount();

  const second = await renderApp();
  const remountedDialog = await openCustomizeDeck(second.user);
  expect(within(remountedDialog).getByRole("list", { name: DECK_LABEL })).toHaveTextContent(PERSISTED_CATEGORY);
});

it("sorts the deck list by the active language", async () => {
  // Spanish puts Ñ after N; the default collation would put Ñandú before Nz.
  window.localStorage.setItem(
    "scattergories.settings.v1",
    JSON.stringify({ customCategories: ["Ñandú", "Nz"], pinned: ["Ñandú", "Nz"], deckBuiltins: [] }),
  );
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);
  await act(async () => {
    await ensureLanguageLoaded("es");
    await i18n.activate("es");
  });

  const labels = [...dialog.querySelectorAll(".deck-list__label")].map((label) => label.textContent);
  expect(labels).toEqual(["Nz", "Ñandú"]);
});
