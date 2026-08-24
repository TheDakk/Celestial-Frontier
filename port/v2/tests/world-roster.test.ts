import { describe, expect, it } from 'vitest';
import { PLANETSIDE_PREVIEW_LIMIT, worldRosterView } from '../apps/game/src/world-roster.js';

describe('MAIN-3 — full world roster vs Planetside preview', () => {
  it('preserves every canonical row while bounding only the thumbnail view', () => {
    const source = Array.from({ length: 13 }, (_, index) => ({ id: `species-${index}` }));
    const view = worldRosterView(source);
    expect(view.all.map((row) => row.id)).toEqual(source.map((row) => row.id));
    expect(view.preview.map((row) => row.id)).toEqual(source.slice(0, 8).map((row) => row.id));
    expect(view.total).toBe(13);
    expect(view.hiddenFromPreview).toBe(5);
    expect(PLANETSIDE_PREVIEW_LIMIT).toBe(8);
  });

  it('does not let caller or preview-array mutation rewrite the canonical roster snapshot', () => {
    const source = [{ id: 'a' }, { id: 'b' }];
    const view = worldRosterView(source);
    source.push({ id: 'c' });
    expect(view.all.map((row) => row.id)).toEqual(['a', 'b']);
    expect(Object.isFrozen(view.all)).toBe(true);
    expect(Object.isFrozen(view.preview)).toBe(true);
  });

  it('keeps short/empty rosters exact and rejects non-arrays', () => {
    expect(worldRosterView([])).toEqual({ all: [], preview: [], total: 0, hiddenFromPreview: 0 });
    expect(worldRosterView([{ id: 1 }]).preview).toEqual([{ id: 1 }]);
    expect(() => worldRosterView(null as never)).toThrow('world roster must be an array');
  });
});
