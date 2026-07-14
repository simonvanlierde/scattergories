import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { resetSettingsToStorage } from "@/features/settings/SettingsProvider";
import { App } from "./App";
import { ONBOARDED_KEY } from "./useOnboarding";

beforeEach(() => {
  window.localStorage.clear();
  resetSettingsToStorage();
});

it("shows the first-run welcome and starts play when dismissed", async () => {
  const user = userEvent.setup();
  render(<App />);

  const welcome = await screen.findByRole("dialog");
  expect(within(welcome).getByText(/Score points/i)).toBeInTheDocument();

  await user.click(within(welcome).getByRole("button", { name: "Roll a letter" }));

  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  expect(window.localStorage.getItem(ONBOARDED_KEY)).toBe("1");
});

it("does not show the welcome once onboarded", async () => {
  window.localStorage.setItem(ONBOARDED_KEY, "1");
  render(<App />);

  await screen.findByRole("heading", { level: 1, name: "Scattergories" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

// The rules double as the welcome, so the same dialog has to drop the CTA once
// the player is past their first run — otherwise help would restart the round.
it("opens the same rules from the help button, without the first-run CTA", async () => {
  window.localStorage.setItem(ONBOARDED_KEY, "1");
  const user = userEvent.setup();
  render(<App />);

  await screen.findByRole("heading", { level: 1, name: "Scattergories" });
  await user.click(screen.getByRole("button", { name: "How to play" }));

  const rules = await screen.findByRole("dialog", { name: "How to play" });
  expect(within(rules).getByText(/Score points/i)).toBeInTheDocument();
  expect(within(rules).queryByRole("button", { name: "Roll a letter" })).not.toBeInTheDocument();
});
