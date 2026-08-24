import { describe, expect, it } from "vitest";
import { CATEGORY_KEYS } from "@/domain/game/categoryKeys";
import { CLASSIC_PACK_ID, getPackCategories, PACKS } from "./categoryPacks";

describe("category packs", () => {
  // A typo in a pack key silently shrinks that pack instead of failing loudly,
  // because getPackCategories filters unknown keys out.
  it.each(PACKS)("$id only lists keys the domain knows about", (pack) => {
    const unknown = pack.keys.filter((key) => !CATEGORY_KEYS.includes(key));
    expect(unknown).toEqual([]);
  });

  it("the classic pack means every category", () => {
    expect(getPackCategories(CLASSIC_PACK_ID, CATEGORY_KEYS)).toEqual([...CATEGORY_KEYS]);
  });
});
