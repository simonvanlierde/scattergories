// @vitest-environment node
// biome-ignore-all lint/correctness/noNodejsModules: reads the published security.txt from disk.
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const RENEW_WINDOW_DAYS = 60;
const DAY_MS = 86_400_000;

// RFC 9116 treats an expired file as invalid, so renew it well before the date.
it("security.txt does not expire within the renewal window", () => {
  const file = readFileSync(new URL("../../public/.well-known/security.txt", import.meta.url), "utf8");
  const expires = /^Expires:\s*(\S+)/m.exec(file)?.[1];
  expect(expires, "security.txt needs an Expires line").toBeDefined();
  const daysLeft = (Date.parse(expires as string) - Date.now()) / DAY_MS;
  expect(daysLeft, `security.txt expires ${expires}: renew it`).toBeGreaterThan(RENEW_WINDOW_DAYS);
});
