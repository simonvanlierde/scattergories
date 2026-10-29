import { render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SETTINGS_STORAGE_KEY } from "@/features/settings/schema";
import { LegalPage } from "./LegalPages";

afterEach(() => {
  window.history.pushState({}, "", "/");
  window.localStorage.clear();
});

it("takes the theme the player saved over the system's", () => {
  // The test setup reports a light system theme.
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme: "dark", themeSource: "user" }));
  window.history.pushState({}, "", "/privacy");
  render(<LegalPage />);

  expect(screen.getByRole("main").closest(".app-shell")).toHaveAttribute("data-theme", "dark");
});
