import { screen, within } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { openSettings, renderApp, resetAppTestState } from "./test/renderApp";

beforeEach(resetAppTestState);

it("reveals category tools with the category shortcut", async () => {
  const { user } = await renderApp();

  await user.click(screen.getByRole("button", { name: "Hide categories" }));
  expect(screen.getByRole("button", { name: "Open categories" })).toHaveAttribute("aria-expanded", "false");

  await user.keyboard("c");

  expect(screen.getByRole("button", { name: "Hide categories" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "Customize deck" })).toBeVisible();
});

it("toggles categories and mute from user controls", async () => {
  const { user } = await renderApp();

  await user.keyboard("c");
  expect(screen.getByRole("button", { name: "Open categories" })).toHaveAttribute("aria-expanded", "false");

  await user.keyboard("c");
  expect(screen.getByRole("button", { name: "Hide categories" })).toHaveAttribute("aria-expanded", "true");

  await user.click(screen.getByRole("button", { name: "Mute" }));
  expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
});

it("turns every shortcut off from settings and keeps the choice", async () => {
  const { user, view } = await renderApp();
  const settings = await openSettings(user);
  const toggle = within(settings).getByRole("checkbox", { name: /Keyboard shortcuts/ });
  expect(toggle).toBeChecked();
  await user.click(toggle);
  await user.keyboard("{Escape}");

  await user.keyboard("c");
  expect(screen.getByRole("button", { name: "Hide categories" })).toHaveAttribute("aria-expanded", "true");

  view.unmount();
  await renderApp();
  await user.keyboard("c");
  expect(screen.getByRole("button", { name: "Hide categories" })).toHaveAttribute("aria-expanded", "true");
});
