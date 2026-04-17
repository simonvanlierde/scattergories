import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SETTINGS_STORAGE_KEY } from '../settings/schema';
import { SettingsProvider, useSettings } from './useSettings';

function wrapper({ children }: { children: ReactNode }) {
  return React.createElement(SettingsProvider, null, children);
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSettings', () => {
  describe('defaults', () => {
    it('returns factory defaults when localStorage is empty', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
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
    // checks the dark query, so false → 'light' in test environments.
    it('defaults theme to light when matchMedia.matches is false for dark query', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.settings.theme).toBe('light');
    });

    it('defaults theme to dark when OS prefers dark', () => {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.settings.theme).toBe('dark');
    });
  });

  describe('persistence', () => {
    it('persists settings to localStorage on change', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      act(() => {
        result.current.update('isMuted', true);
      });
      const stored = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
      expect(stored.isMuted).toBe(true);
    });

    it('hydrates from existing localStorage on mount', () => {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ durationInput: '120', isMuted: true }),
      );
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.settings.durationInput).toBe('120');
      expect(result.current.settings.isMuted).toBe(true);
    });

    it('falls back to defaults on malformed JSON and rewrites storage', () => {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, '{not valid json}');
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.settings.durationInput).toBe('90');
      const stored = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? 'null');
      expect(stored).not.toBeNull();
      expect(stored.durationInput).toBe('90');
    });

    it('syncs when another tab updates localStorage', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        window.localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify({ durationInput: '45', theme: 'dark' }),
        );
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: SETTINGS_STORAGE_KEY,
            newValue: window.localStorage.getItem(SETTINGS_STORAGE_KEY),
          }),
        );
      });

      await waitFor(() => {
        expect(result.current.settings.durationInput).toBe('45');
        expect(result.current.settings.theme).toBe('dark');
      });
    });
  });

  describe('update', () => {
    it('updates a single field without touching others', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      act(() => {
        result.current.update('durationInput', '60');
      });
      expect(result.current.settings.durationInput).toBe('60');
      expect(result.current.settings.catCountInput).toBe('12');
    });
  });

  describe('addCustomCategory', () => {
    it('adds a trimmed, non-empty category', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      act(() => {
        result.current.addCustomCategory('  Science  ');
      });
      expect(result.current.settings.customCategories).toEqual(['Science']);
    });

    it('ignores empty or whitespace-only input', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      act(() => {
        result.current.addCustomCategory('   ');
      });
      expect(result.current.settings.customCategories).toEqual([]);
    });

    it('deduplicates case-insensitively', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      act(() => {
        result.current.addCustomCategory('Science');
        result.current.addCustomCategory('science');
      });
      expect(result.current.settings.customCategories).toEqual(['Science']);
    });
  });

  describe('removeCustomCategory', () => {
    it('removes an existing category', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
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
