import { startTransition, useCallback, useEffect, useState } from 'react';
import { shuffleFisherYates } from '@/domain/game/utils';

function useCategoryBoard(params: {
  availableCategories: string[];
  normalizedCategoryCount: number;
}) {
  const [drawnCategories, setDrawnCategories] = useState<string[]>([]);

  const redrawCategories = useCallback(() => {
    startTransition(() => {
      if (params.availableCategories.length === 0) {
        setDrawnCategories([]);
        return;
      }

      setDrawnCategories(
        shuffleFisherYates(params.availableCategories).slice(0, params.normalizedCategoryCount),
      );
    });
  }, [params.availableCategories, params.normalizedCategoryCount]);

  useEffect(() => {
    redrawCategories();
  }, [redrawCategories]);

  return {
    drawnCategories,
    redrawCategories,
  };
}

export { useCategoryBoard };
