import type { TFunction } from "i18next";
import { expect, test } from "vitest";

test("t only accepts keys from the English resources", () => {
  // Type-level guard: tsc -b fails here if the CustomTypeOptions augmentation stops applying.
  const check = (t: TFunction) => {
    t("modal.odds");
    // @ts-expect-error unknown translation key
    t("this.key.does.not.exist");
  };
  expect(check).toBeTypeOf("function");
});
