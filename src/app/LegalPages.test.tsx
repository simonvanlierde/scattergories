import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SETTINGS_STORAGE_KEY } from "@/features/settings/schema";
import { ensureLanguageLoaded, i18n } from "@/i18n/config";
import { App } from "./App";

vi.mock("./useGameController", () => ({
  useGameController: () => {
    throw new Error("game state must not initialize on document routes");
  },
}));

afterEach(() => {
  i18n.activate("en");
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
});

it.each([
  ["/privacy", "Privacy statement", "Privacy (English)"],
  ["/accessibility", "Accessibility statement", "Accessibility (English)"],
])("opens %s in the saved theme without initializing a round", async (path, title, navName) => {
  window.history.replaceState(null, "", path);
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme: "dark", themeSource: "user" }));
  render(<App />);

  expect(await screen.findByRole("heading", { level: 1, name: title })).toBeVisible();
  const main = screen.getByRole("main");
  // Metadata and focus are applied by an effect after the heading is rendered.
  await waitFor(() => {
    expect(document.title).toBe(`${title} — Scattergories`);
    expect(document.documentElement.lang).toBe("en");
    expect(main).toHaveFocus();
  });
  expect(main.closest(".app-shell")).toHaveAttribute("data-theme", "dark");
  expect(screen.getByRole("link", { name: navName })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Back to the game" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "Made by Simon van Lierde" })).toHaveAttribute(
    "href",
    "https://simonvanlierde.com",
  );
  expect(screen.getByRole("link", { name: "Source code" })).toHaveAttribute(
    "href",
    "https://github.com/simonvanlierde/scattergories",
  );
  expect(document.querySelector('.legal-page__credit a[href$="/LICENSE"]')).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("translates the page frame and keeps the statement in English", async () => {
  window.history.replaceState(null, "", "/privacy");
  render(<App />);

  expect(await screen.findByRole("heading", { level: 1, name: "Privacy statement" })).toBeVisible();
  await act(async () => {
    await ensureLanguageLoaded("de");
    i18n.activate("de");
  });
  // cspell:disable-next-line
  expect(screen.getByRole("link", { name: "Zurück zum Spiel" })).toHaveAttribute("href", "/");
  // cspell:disable-next-line
  expect(screen.getByRole("link", { name: "Datenschutz (Englisch)" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("main").closest(".app-shell")).toHaveAttribute("lang", "de");
  expect(screen.getByRole("main").querySelector("article")).toHaveAttribute("lang", "en");
});
