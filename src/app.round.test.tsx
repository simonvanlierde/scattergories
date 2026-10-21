import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { renderApp, resetAppTestState, SELECTED_CATEGORIES } from "./test/renderApp";

const defaultMatchMedia = window.matchMedia;

beforeEach(resetAppTestState);
// One test turns on reduced motion; the rest need the roll animation back.
afterEach(() => {
  window.matchMedia = defaultMatchMedia;
});

it("persists the category panel preference across remount with the same localStorage", async () => {
  const first = await renderApp();

  await first.user.click(screen.getByRole("button", { name: "Hide categories" }));
  expect(screen.getByRole("button", { name: "Open categories" })).toHaveAttribute("aria-expanded", "false");

  first.view.unmount();

  await renderApp();
  expect(screen.getByRole("button", { name: "Open categories" })).toHaveAttribute("aria-expanded", "false");
});

it("redraws categories on a fresh round but keeps them when rerolling the letter", async () => {
  // Make category redraws instant (skip the roll animation) for deterministic assertions.
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;

  const { user } = await renderApp();
  const drawnList = screen.getByRole("list", { name: SELECTED_CATEGORIES });
  const items = () =>
    within(drawnList)
      .getAllByRole("listitem")
      .map((item) => item.textContent);

  await waitFor(() => {
    expect(items().length).toBeGreaterThan(0);
  });
  const initialCategories = items();

  // Starting a fresh round reshuffles the (unpinned) categories.
  await user.click(screen.getByRole("button", { name: "Roll a letter" }));
  await waitFor(() => {
    expect(items()).not.toEqual(initialCategories);
  });
  const afterStart = items();

  // Pause, then reroll the letter — categories stay the same.
  await user.click(screen.getByRole("button", { name: "Pause" }));
  await user.click(screen.getByRole("button", { name: "New letter" }));
  await waitFor(() => {
    expect(items()).toEqual(afterStart);
  });
});

it("locks the category pins while the clock runs and unlocks them on pause", async () => {
  const { user } = await renderApp();
  const pinButtons = () => within(screen.getByRole("list", { name: SELECTED_CATEGORIES })).getAllByRole("button");

  await user.click(screen.getByRole("button", { name: "Roll a letter" }));
  const pause = await screen.findByRole("button", { name: "Pause" });

  for (const chip of pinButtons()) {
    expect(chip).toBeDisabled();
  }
  expect(screen.getByRole("button", { name: "Pin all" })).toBeDisabled();

  await user.click(pause);
  for (const chip of pinButtons()) {
    expect(chip).toBeEnabled();
  }
});

it("locks the pins while the categories roll, so a tap cannot pin a passing name", async () => {
  const { user } = await renderApp();
  const pinButtons = () => within(screen.getByRole("list", { name: SELECTED_CATEGORIES })).getAllByRole("button");

  await user.click(screen.getByRole("button", { name: "Redraw" }));

  for (const chip of pinButtons()) {
    expect(chip).toBeDisabled();
  }
  expect(screen.getByRole("button", { name: "Pin all" })).toBeDisabled();

  await waitFor(() => {
    for (const chip of pinButtons()) {
      expect(chip).toBeEnabled();
    }
  });
});

it("keeps the board in place when pins change during a paused round", async () => {
  const { user } = await renderApp();
  const drawnList = screen.getByRole("list", { name: SELECTED_CATEGORIES });
  const names = () =>
    within(drawnList)
      .getAllByRole("listitem")
      .map((item) => item.textContent);

  await user.click(screen.getByRole("button", { name: "Roll a letter" }));
  await user.click(await screen.findByRole("button", { name: "Pause" }));
  await waitFor(() => expect(within(drawnList).getAllByRole("button")[0]).toBeEnabled());
  const board = names();

  const [first, second] = within(drawnList).getAllByRole("button");
  await user.click(first as HTMLElement);
  await user.click(second as HTMLElement);
  await user.click(first as HTMLElement);
  await user.click(screen.getByRole("button", { name: "Resume" }));

  expect(names()).toEqual(board);
  expect(second).toHaveAttribute("aria-pressed", "true");
  expect(first).toHaveAttribute("aria-pressed", "false");
});

it("shows the skip confirmation as visible text while armed", async () => {
  // No get-ready countdown, so the letter lands straight into the live clock.
  window.localStorage.setItem("scattergories.settings.v1", JSON.stringify({ bufferSecondsInput: "0" }));
  const { user } = await renderApp();

  await user.click(screen.getByRole("button", { name: "Roll a letter" }));
  await screen.findByRole("button", { name: "Pause" });
  expect(screen.queryByText("Tap again to skip this round")).not.toBeInTheDocument();
  // A live region only speaks about changes, so it must be there before the tap.
  const live = document.querySelector('.action-bar [aria-live="polite"]');
  expect(live).toBeEmptyDOMElement();

  await user.click(screen.getByRole("button", { name: "Next round" }));

  const prompt = screen.getByText("Tap again to skip this round");
  expect(prompt).toBeVisible();
  // Screen readers hear it too: a focused button's new label is often not read out.
  expect(live).toContainElement(prompt);
  expect(prompt.closest('[aria-hidden="true"]')).toBeNull();
});
