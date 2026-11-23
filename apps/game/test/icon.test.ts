// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { currentSheet, icon, interfaceGaps } from '../src/ui';
import { paintedBy, recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
afterEach(() => { interfaceGaps.glyphs.length = 0; interfaceGaps.icons.length = 0; });

/** The colours the current sheet shows a drawing in: null where it is transparent, the ink ramp for 1-4, the accent ramp for 5-8. */
function shown(name: string): Array<number | null> {
  const sheet = currentSheet();
  const colour = (ramp: string, step: number): number => sheet.palette.colours[sheet.palette.ramps[ramp]![step]!]!;
  return Array.from(sheet.icons.get(name)!.pixels, (v) => (v === 0 ? null : v <= 4 ? colour('ink', v - 1) : colour('accent', v - 5)));
}

describe('icon', () => {
  it('an icon with a label is an image with that name; a decorative icon is hidden from a reader', () => {
    const labelled = icon('settings', { label: 'Settings' });
    expect(labelled.getAttribute('role')).toBe('img');
    expect(labelled.getAttribute('aria-label')).toBe('Settings');
    expect(labelled.hasAttribute('aria-hidden')).toBe(false);
    expect(labelled.textContent).toBe('');
    const decorative = icon('settings', { decorative: true });
    expect(decorative.getAttribute('aria-hidden')).toBe('true');
    expect(decorative.hasAttribute('role')).toBe(false);
    expect(decorative.hasAttribute('aria-label')).toBe(false);
  });
  it('draws the named icon from the current sheet, in the ink and accent ramps, at its own size', () => {
    const canvas = icon('settings', { decorative: true }).querySelector('canvas')!;
    expect([canvas.width, canvas.height, canvas.style.width, canvas.style.height]).toEqual([16, 16, '16px', '16px']);
    expect(paintedBy(canvas)).toEqual(shown('settings'));
    expect(new Set(paintedBy(canvas)).size).toBeGreaterThan(3);
    expect(interfaceGaps.icons).toEqual([]);
  });
  it('an icon name with no drawing shows the stand-in and adds one gap', () => {
    const el = icon('rocket', { label: 'Launch' });
    expect(paintedBy(el.querySelector('canvas')!)).toEqual(shown('missing'));
    expect(el.getAttribute('aria-label')).toBe('Launch');
    expect(interfaceGaps.icons).toEqual(['rocket']);
  });
});
