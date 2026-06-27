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
} from '@/domain/game/constants';
import { clampInt } from '@/domain/game/utils';

function getNormalizedCategoryCount(categoryCount: number, availableCount: number): number {
  return Math.min(categoryCount, Math.max(catCountMin, availableCount));
}

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

  const availableCount = new Set([...settings.customCategories, ...settings.deckBuiltins]).size;
  const normalizedCategoryCount = getNormalizedCategoryCount(categoryCount, availableCount);

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
