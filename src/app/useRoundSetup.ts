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
import { getPackCategories } from '@/shared/lib/categoryPacks';

function getNormalizedCategoryCount(categoryCount: number, availableCount: number): number {
  return Math.min(categoryCount, Math.max(catCountMin, availableCount));
}

function useRoundSetup(settings: {
  catCountInput: string;
  includePackCategories: boolean;
  activePack: string;
  customCategories: string[];
  durationInput: string;
}) {
  const gameSeconds = clampInt(settings.durationInput, durationMin, durationMax, durationDefault);
  const categoryCount = clampInt(settings.catCountInput, catCountMin, catCountMax, catCountDefault);

  // Custom categories always appear in the deck; pack categories fill the rest.
  // Exclude any pack entry that duplicates a custom one so a slot isn't shown twice.
  const packCategories = useMemo(() => {
    const customSet = new Set(settings.customCategories);
    return getPackCategories(settings.activePack, categories).filter(
      (name) => !customSet.has(name),
    );
  }, [settings.activePack, settings.customCategories]);

  const availableCount =
    settings.customCategories.length + (settings.includePackCategories ? packCategories.length : 0);
  const normalizedCategoryCount = getNormalizedCategoryCount(categoryCount, availableCount);

  return {
    packCategories,
    customCategories: settings.customCategories,
    includePackCategories: settings.includePackCategories,
    gameSeconds,
    normalizedCategoryCount,
    availableCount,
  };
}

export { useRoundSetup };
