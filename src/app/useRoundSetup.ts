import { getDeckSize, getDrawCount } from "@/domain/deck";
import {
  bufferSecondsDefault,
  bufferSecondsMax,
  bufferSecondsMin,
  catCountDefault,
  catCountMax,
  catCountMin,
  durationDefault,
  durationMax,
  durationMin,
} from "@/domain/game/constants";
import { clampInt } from "@/domain/game/utils";

function useRoundSetup(settings: {
  catCountInput: string;
  durationInput: string;
  bufferSecondsInput: string;
  deckBuiltins: string[];
  customCategories: string[];
  pinned: string[];
}) {
  const gameSeconds = clampInt(settings.durationInput, durationMin, durationMax, durationDefault);
  const bufferSeconds = clampInt(
    settings.bufferSecondsInput,
    bufferSecondsMin,
    bufferSecondsMax,
    bufferSecondsDefault,
  );
  const categoryCount = clampInt(settings.catCountInput, catCountMin, catCountMax, catCountDefault);

  const availableCount = getDeckSize(settings.customCategories, settings.deckBuiltins);
  const normalizedCategoryCount = getDrawCount(categoryCount, availableCount);

  return {
    deckBuiltins: settings.deckBuiltins,
    customCategories: settings.customCategories,
    pinned: settings.pinned,
    gameSeconds,
    bufferSeconds,
    normalizedCategoryCount,
    availableCount,
  };
}

export { useRoundSetup };
