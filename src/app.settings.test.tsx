// spell-checker: ignore Sortear, letra, unmutes
import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { i18n } from "@/i18n/config";
import { BUFFER_SECONDS, DEFAULT_TIMER_SECONDS } from "./test/gameConstants";
import { openSettings, renderApp, resetAppTestState } from "./test/renderApp";

beforeEach(resetAppTestState);

// i18next is module-global, so a language switch here would otherwise leak into
// every test that runs after it.
afterEach(async () => {
  if (i18n.resolvedLanguage !== "en") {
    await i18n.changeLanguage("en");
  }
});

it("groups the gameplay settings with their defaults and hints", async () => {
  const { user } = await renderApp();
  const settings = await openSettings(user);

  const roundLength = within(settings).getByLabelText("Round length");
  expect(roundLength).toHaveValue(DEFAULT_TIMER_SECONDS);
  expect(roundLength).toHaveAccessibleDescription("How long each round lasts.");

  const getReady = within(settings).getByLabelText("Get ready");
  expect(getReady).toHaveValue(BUFFER_SECONDS);
  expect(getReady).toHaveAccessibleDescription("Countdown before the timer starts.");

  expect(within(settings).getByRole("checkbox", { name: /Avoid letter repeats/ })).toBeChecked();
});

it("commits a new round length", async () => {
  const { user } = await renderApp();
  const settings = await openSettings(user);

  const roundLength = within(settings).getByLabelText("Round length");
  await user.clear(roundLength);
  await user.type(roundLength, "120");
  await user.tab();

  expect(roundLength).toHaveValue(120);
});

it("toggles avoid letter repeats", async () => {
  const { user } = await renderApp();
  const settings = await openSettings(user);

  const avoidRepeats = within(settings).getByRole("checkbox", { name: /Avoid letter repeats/ });
  await user.click(avoidRepeats);

  expect(avoidRepeats).not.toBeChecked();
});

it("switches theme from the appearance control", async () => {
  const { user } = await renderApp();
  const shell = screen.getByRole("main");
  expect(shell).toHaveAttribute("data-theme", "light");

  const settings = await openSettings(user);
  await user.click(within(settings).getByRole("radio", { name: "Dark" }));

  expect(shell).toHaveAttribute("data-theme", "dark");
  expect(within(settings).getByRole("radio", { name: "Dark" })).toBeChecked();
});

it("switches language from the dropdown", async () => {
  const { user } = await renderApp();
  const settings = await openSettings(user);

  const select = within(settings).getByRole("combobox", { name: "Language" });
  expect(select).toHaveValue("en");

  await user.selectOptions(select, "es");

  // The whole UI re-renders in the new language; the primary action is the proof.
  expect(await screen.findByRole("button", { name: "Sortear letra" })).toBeInTheDocument();
});

it("mutes and unmutes from the footer", async () => {
  const { user } = await renderApp();

  const mute = screen.getByRole("button", { name: "Mute" });
  expect(mute).toHaveAttribute("aria-pressed", "false");

  await user.click(mute);

  expect(screen.getByRole("button", { name: "Unmute" })).toHaveAttribute("aria-pressed", "true");
});
