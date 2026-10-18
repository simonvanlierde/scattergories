import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, expect, it } from "vitest";
import { i18n, initI18n } from "@/i18n/config";
import { LetterHero } from "./LetterHero";

beforeAll(async () => {
  await initI18n();
});

function liveRegion(letter: string, visible: boolean, landing: boolean) {
  const { container } = render(
    <I18nextProvider i18n={i18n}>
      <LetterHero letter={letter} visible={visible} landing={landing} />
    </I18nextProvider>,
  );
  const region = container.querySelector('[aria-live="polite"]');
  if (!region) {
    throw new Error("no live region");
  }
  // What a screen reader reads: the region minus anything hidden from it.
  const clone = region.cloneNode(true) as HTMLElement;
  for (const hidden of clone.querySelectorAll('[aria-hidden="true"]')) {
    hidden.remove();
  }
  return clone.textContent ?? "";
}

it("stays silent while the letter flips", () => {
  expect(liveRegion("K", true, false)).toBe("");
});

it("stays silent before the first roll", () => {
  expect(liveRegion("?", false, false)).toBe("");
});

it("announces the letter once it lands", () => {
  expect(liveRegion("K", true, true)).toBe("Current letter K");
});
