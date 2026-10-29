import { expect, type Page, test } from "@playwright/test";
import { ROUTES } from "./routes";

// The service worker would answer later routes itself, past the interception below.
test.use({ serviceWorkers: "block" });

// vite preview sends no headers, so serve every response with the Content-Security-Policy
// from the built _headers file, the one Cloudflare Pages serves, and collect each
// violation the page reports. Both run before the first load.
async function underPolicy(page: Page) {
  const headersFile = await (await page.request.get("/_headers")).text();
  const policy = headersFile.match(/Content-Security-Policy:\s*(.+)/)?.[1] as string;
  await page.route("**/*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), "content-security-policy": policy },
    });
  });
  const violations: string[] = [];
  await page.exposeFunction("reportViolation", (text: string) => violations.push(text));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { reportViolation: (t: string) => void }).reportViolation(
        `${event.violatedDirective} ${event.blockedURI}`,
      );
    });
  });
  return { headersFile, policy, violations };
}

test("the built app runs under its own Content-Security-Policy", async ({ page }) => {
  const { headersFile, policy, violations } = await underPolicy(page);
  expect(policy).toContain("script-src 'self';");
  for (const name of [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Cross-Origin-Opener-Policy",
    "Cross-Origin-Resource-Policy",
    "Permissions-Policy",
    "Strict-Transport-Security",
  ]) {
    expect(headersFile, name).toMatch(new RegExp(`^\\s+${name}:`, "m"));
  }

  for (const path of ROUTES) {
    const response = await page.goto(path);
    expect(response?.headers()["content-security-policy"]).toBe(policy);
    await expect(page.getByRole("main")).toBeVisible();
  }
  expect(violations).toEqual([]);

  // An injected inline <script> is reported, so the listener works and the
  // policy really blocks inline scripts.
  await page.evaluate(() => {
    const script = document.createElement("script");
    script.textContent = "void 0";
    document.head.append(script);
  });
  await expect.poll(() => violations).toEqual([expect.stringMatching(/^script-src-elem inline/)]);
});

// Styles and scripts can also be added after load, by a sheet, a round or a lazy
// chunk, so walk through each of them under the policy too.
test("a round and the sheets run under the Content-Security-Policy", async ({ page }) => {
  test.slow();
  const { violations } = await underPolicy(page);
  await page.goto("/");

  // First run opens the rules as a welcome sheet.
  const howTo = page.getByRole("dialog", { name: "How to play" });
  await expect(howTo).toBeVisible();
  await howTo.getByRole("button", { name: "Close this window" }).click();

  // Shortest round the settings allow, then the theme switch.
  await page.getByRole("button", { name: "Settings" }).click();
  const settings = page.getByRole("dialog", { name: "Settings" });
  await settings.getByLabel("Round length").fill("10");
  await settings.getByLabel("Get ready").fill("0");
  await settings.getByRole("radio", { name: "Dark" }).check();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "dark");
  await settings.getByRole("radio", { name: "Light" }).check();
  await settings.getByRole("button", { name: "Close this window" }).click();

  // One full round: roll a letter and let the clock run out.
  await page.getByRole("button", { name: "Roll a letter" }).click();
  await expect(page.getByRole("timer")).toContainText("Time's up!", { timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Next round" }).first()).toBeEnabled();

  // The rules from the ? button, every section open.
  await page.getByRole("button", { name: "How to play" }).click();
  for (const summary of await howTo.locator("summary").all()) {
    await summary.click();
  }
  await howTo.getByRole("button", { name: "Close this window" }).click();

  // The language switch loads another locale's chunk.
  await page.getByRole("button", { name: "Settings" }).click();
  await settings.getByLabel("Language").selectOption("de");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");

  // Violation events arrive a moment after their cause, so an empty list proves
  // nothing yet. Trigger a known one: events are delivered in order, so once it
  // shows up any earlier violation would be listed ahead of it.
  await page.evaluate(() => {
    const script = document.createElement("script");
    script.textContent = "void 0";
    document.head.append(script);
  });
  await expect.poll(() => violations).toEqual([expect.stringMatching(/^script-src-elem inline/)]);
});
