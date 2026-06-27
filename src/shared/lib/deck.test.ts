import { describe, expect, it } from 'vitest';
import { composeDeck } from './deck';

describe('composeDeck', () => {
  it('includes every pinned category and fills up to count', () => {
    const { deck } = composeDeck({
      customCategories: [],
      deckBuiltins: ['a', 'b', 'c', 'd', 'e'],
      pinned: ['a'],
      count: 3,
    });
    expect(deck).toHaveLength(3);
    expect(deck).toContain('a');
  });

  it('keeps a pinned category in its current slot on redraw (no hopping)', () => {
    const previous = ['x', 'p', 'y'];
    const { deck } = composeDeck({
      customCategories: [],
      deckBuiltins: ['p', 'x', 'y', 'z', 'w', 'v'],
      pinned: ['p'],
      count: 3,
      previous,
    });
    expect(deck[1]).toBe('p');
    expect(deck).toHaveLength(3);
  });

  it('keeps multiple pinned categories in their existing positions', () => {
    const previous = ['p1', 'u', 'p2', 'v'];
    const { deck } = composeDeck({
      customCategories: [],
      deckBuiltins: ['p1', 'p2', 'u', 'v', 'w', 'x'],
      pinned: ['p1', 'p2'],
      count: 4,
      previous,
    });
    expect(deck[0]).toBe('p1');
    expect(deck[2]).toBe('p2');
  });

  it('seats a freshly pinned category that is not yet on the board', () => {
    const { deck } = composeDeck({
      customCategories: ['new'],
      deckBuiltins: ['x', 'y', 'z', 'w'],
      pinned: ['new'],
      count: 3,
      previous: ['x', 'y', 'z'],
    });
    expect(deck).toContain('new');
    expect(deck).toHaveLength(3);
  });

  it('collapses to just the pinned categories when the pool is empty', () => {
    const { deck } = composeDeck({
      customCategories: ['only'],
      deckBuiltins: [],
      pinned: ['only'],
      count: 8,
      previous: ['only', 'a', 'b'],
    });
    expect(deck).toEqual(['only']);
  });

  it('only exposes unpinned categories in the reroll pool', () => {
    const { pool } = composeDeck({
      customCategories: [],
      deckBuiltins: ['a', 'b', 'c'],
      pinned: ['a'],
      count: 3,
    });
    expect(pool).not.toContain('a');
    expect(pool).toEqual(expect.arrayContaining(['b', 'c']));
  });
});
