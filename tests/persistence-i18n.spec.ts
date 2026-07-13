import { expect } from "@playwright/test";
import { test } from "./fixtures";

// spell-checker: ignore Configuración, Idioma, Sortear, Letra

test("@smoke persists the timer setting across reload", async ({ app, page }) => {
  await app.openSettings();
  await expect(app.settingsSheet.getByLabel("Round", { exact: true })).toHaveValue("90");
  await app.closeSettings();

  await app.setTimer("130");
  await page.reload();
  await app.waitUntilReady();

  await app.openSettings();
  await expect(app.settingsSheet.getByLabel("Round", { exact: true })).toHaveValue("130");
  await app.closeSettings();
});

test("@smoke persists a non-English language selection across reload", async ({ app, page }) => {
  await app.switchLanguage("es");
  await expect(page.getByRole("button", { name: "Sortear Letra" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cómo Jugar" })).toBeVisible();
  await app.openSettings();
  await expect(app.settingsSheet.locator("select.settings-select")).toHaveValue("es");
  await app.closeSettings();

  await page.reload();
  await app.waitUntilReady();
  await app.openSettings();

  await expect(page.getByRole("button", { name: "Sortear Letra" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cómo Jugar" })).toBeVisible();
  await expect(app.settingsSheet.locator("select.settings-select")).toHaveValue("es");
  await app.closeSettings();
});
