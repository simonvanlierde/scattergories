import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("@/i18n/config", async (importActual) => ({
  ...(await importActual<typeof import("@/i18n/config")>()),
  bootLanguage: "de",
  initI18n: () => Promise.reject(new Error("chunk 404 at /assets/de.js")),
}));

it("shows a localized recovery screen without the raw error", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<App />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Die App konnte nicht starten.");
  expect(screen.getByRole("button", { name: "App neu laden" })).toBeInTheDocument();
  expect(alert).not.toHaveTextContent("chunk 404");
});

it("shows the loading screen in the boot language", () => {
  render(<App />);

  expect(screen.getByRole("status")).toHaveTextContent("Dein Spieleabend wird geladen...");
});
