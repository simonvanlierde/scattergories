import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettings } from './useSettings';

const STORAGE_KEY = 'scattergories.settings.v1';

import { settingsStore } from './useSettings';

beforeEach(() => {
  window.localStorage.clear();
  settingsStore.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSettings', () => {
  describe('defaults', () => {
    it('returns factory defaults when localStorage is empty', () => {
      const { result } = renderHook(() => useSettings());
      const { settings } = result.current;
      expect(settings.durationInput).toBe('90');
      expect(settings.catCountInput).toBe('12');
      expect(settings.totalRoundsInput).toBe('3');
      expect(settings.categoryMode).toBe('default');
      expect(settings.customCategories).toEqual([]);
      expect(settings.isMuted).toBe(false);
    });

    // The test matchMedia stub (setupTests.ts) returns matches:false for all
    // queries, including '(prefers-color-scheme: light)'. preferredTheme()
    // checks that query, so false → 'dark' in test environments.
    it('defaults theme to dark when matchMedia.matches is false for light query', () => {
      const { result } = renderHook(() => useSettings());
      expect(result.current.settings.theme).toBe('dark');
    });

    it('defaults theme to light when OS prefers light', () => {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      const { result } = renderHook(() => useSettings());
      expect(result.current.settings.theme).toBe('light');
    });
  });

  describe('persistence', () => {
    it('persists settings to localStorage on change', () => {
      const { result } = renderHook(() => useSettings());
      act(() => {
        result.current.update('isMuted', true);
      });
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
      expect(stored.isMuted).toBe(true);
    });

    it('hydrates from existing localStorage on mount', () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ durationInput: '120', isMuted: true }),
      );
      const { result } = renderHook(() => useSettings());
      expect(result.current.settings.durationInput).toBe('120');
      expect(result.current.settings.isMuted).toBe(true);
    });

    it('falls back to defaults on malformed JSON and writes valid defaults back', () => {
      window.localStorage.setItem(STORAGE_KEY, '{not valid json}');
      const { result } = renderHook(() => useSettings());
      expect(result.current.settings.durationInput).toBe('90');
      // The useEffect immediately re-persists the defaults, so the key is
      // present again — but now contains valid JSON with default values.
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
      expect(stored).not.toBeNull();
      expect(stored.durationInput).toBe('90');
    });
  });

  describe('update', () => {
    it('updates a single field without touching others', () => {
      const { result } = renderHook(() => useSettings());
      act(() => {
        result.current.update('durationInput', '60');
      });
      expect(result.current.settings.durationInput).toBe('60');
      expect(result.current.settings.catCountInput).toBe('12');
    });
  });

  describe('addCustomCategory', () => {
    it('adds a trimmed, non-empty category', () => {
      const { result } = renderHook(() => useSettings());
      act(() => {
        result.current.addCustomCategory('  Science  ');
      });
      expect(result.current.settings.customCategories).toEqual(['Science']);
    });

    it('ignores empty or whitespace-only input', () => {
      const { result } = renderHook(() => useSettings());
      act(() => {
        result.current.addCustomCategory('   ');
      });
      expect(result.current.settings.customCategories).toEqual([]);
    });

    it('deduplicates case-insensitively', () => {
      const { result } = renderHook(() => useSettings());
      act(() => {
        result.current.addCustomCategory('Science');
        result.current.addCustomCategory('science');
      });
      expect(result.current.settings.customCategories).toEqual(['Science']);
    });
  });

  describe('removeCustomCategory', () => {
    it('removes an existing category', () => {
      const { result } = renderHook(() => useSettings());
      act(() => {
        result.current.addCustomCategory('Science');
        result.current.addCustomCategory('Art');
      });
      act(() => {
        result.current.removeCustomCategory('Science');
      });
      expect(result.current.settings.customCategories).toEqual(['Art']);
    });
  });
});
