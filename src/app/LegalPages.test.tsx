import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SETTINGS_STORAGE_KEY } from "@/features/settings/schema";
import { App } from "./App";

vi.mock("./useGameController", () => ({
  useGameController: () => {
    throw new Error("game state must not initialize on document routes");
  },
}));

afterEach(() => {
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
});

it.each([
  ["/privacy", "Privacy statement"],
  ["/accessibility", "Accessibility statement"],
])("opens %s in the saved theme without initializing a round", async (path, title) => {
  window.history.replaceState(null, "", path);
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme: "dark", themeSource: "user" }));
  render(<App />);

  expect(await screen.findByRole("heading", { level: 1, name: title })).toBeVisible();
  expect(document.title).toBe(`${title} — Scattergories`);
  expect(document.documentElement.lang).toBe("en");
  const main = screen.getByRole("main");
  expect(main).toHaveFocus();
  expect(main.closest(".app-shell")).toHaveAttribute("data-theme", "dark");
  expect(screen.getByRole("link", { name: title })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Back to the game" })).toHaveAttribute("href", "/");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
