import { useMemo } from 'react';
import {
  catCountDefault,
  catCountMax,
  catCountMin,
  categories,
  durationDefault,
  durationMax,
  durationMin,
} from '@/domain/game/constants';
import { clampInt } from '@/domain/game/utils';
import type { CategoryMode } from '@/features/settings/schema';
import { getPackCategories } from '@/shared/lib/categoryPacks';

function getAvailableCategories(
  categoryMode: CategoryMode,
  activePack: string,
  customCategories: string[],
): string[] {
  const packCategories = getPackCategories(activePack, categories);

  if (categoryMode === 'default') {
    return packCategories;
  }

  if (categoryMode === 'custom') {
    return [...customCategories];
  }

  return Array.from(new Set([...packCategories, ...customCategories]));
}

function getNormalizedCategoryCount(categoryCount: number, availableCount: number): number {
  return Math.min(categoryCount, Math.max(catCountMin, availableCount));
}

function useRoundSetup(settings: {
  catCountInput: string;
  categoryMode: CategoryMode;
  activePack: string;
  customCategories: string[];
  durationInput: string;
}) {
  const gameSeconds = clampInt(settings.durationInput, durationMin, durationMax, durationDefault);
  const categoryCount = clampInt(settings.catCountInput, catCountMin, catCountMax, catCountDefault);
  const availableCategories = useMemo(
    () =>
      getAvailableCategories(settings.categoryMode, settings.activePack, settings.customCategories),
    [settings.categoryMode, settings.activePack, settings.customCategories],
  );
  const normalizedCategoryCount = useMemo(
    () => getNormalizedCategoryCount(categoryCount, availableCategories.length),
    [availableCategories.length, categoryCount],
  );

  return {
    availableCategories,
    gameSeconds,
    normalizedCategoryCount,
  };
}

export { useRoundSetup };
