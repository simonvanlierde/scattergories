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
