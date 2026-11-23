// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { REQUIRED_GLYPHS, drawText, parseInterfaceSheet } from '@cf/art-interface';
import { DISPLAY_HEADINGS, currentSheet, displayText, drawLines, interfaceGaps, placeholderSheet, sheetState, useSheet } from '../src/ui';
import { paintedBy, recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
afterEach(() => { useSheet(null); interfaceGaps.glyphs.length = 0; interfaceGaps.icons.length = 0; });

describe('displayText', () => {
  it('lines of text are one picture: a line box each, every line centred, a missing glyph counted', () => {
    const font = currentSheet().font;
    const gaps = { glyphs: [] as number[], icons: [], elements: [] };
    const wide = drawText(font, 'Agate', gaps);
    const narrow = drawText(font, 'A', gaps);
    const both = drawLines(font, ['Agate', 'A'], gaps);
    expect([both.w, both.h, both.pixels.length]).toEqual([wide.w, 2 * font.line, wide.w * 2 * font.line]);
    const row = (y: number): number[] => [...both.pixels.subarray(y * both.w, (y + 1) * both.w)];
    const left = (wide.w - narrow.w) >> 1;
    for (let y = 0; y < font.line; y++) {
      expect(row(y), `first line, row ${y}`).toEqual([...wide.pixels.subarray(y * wide.w, (y + 1) * wide.w)]);
      const second = new Array<number>(both.w).fill(0);
      second.splice(left, narrow.w, ...narrow.pixels.subarray(y * narrow.w, (y + 1) * narrow.w));
      expect(row(font.line + y), `second line, row ${y}`).toEqual(second);
    }
    expect(narrow.pixels.some((value) => value !== 0)).toBe(true);
    drawLines(font, ['é'], gaps);
    expect(gaps.glyphs).toEqual([0xe9]);
  });

  it('a display heading exposes exactly its text to a reader and hides its canvas', () => {
    for (const level of [1, 2, 3] as const) {
      const el = displayText('Celestial Frontier', { level });
      expect(el.tagName).toBe(`H${level}`);
      expect(el.textContent).toBe('Celestial Frontier');
      const canvases = el.querySelectorAll('canvas');
      expect(canvases).toHaveLength(1);
      expect(canvases[0]!.getAttribute('aria-hidden')).toBe('true');
      // Nothing else is hidden from a reader, and the heading itself carries no other name.
      expect(el.querySelectorAll('[aria-hidden]')).toHaveLength(1);
      expect(el.hasAttribute('aria-label')).toBe(false);
    }
  });
  it('the canvas holds the text as the sheet draws it, in the ink ramp, one canvas pixel per art pixel', () => {
    const sheet = currentSheet();
    const canvas = displayText('Ag', { level: 1 }).querySelector('canvas')!;
    const drawn = drawText(sheet.font, 'Ag', { glyphs: [], icons: [], elements: [] });
    expect([canvas.width, canvas.height]).toEqual([drawn.w, 12]);
    const painted = paintedBy(canvas);
    const ink = sheet.palette.ramps['ink']!.map((i) => sheet.palette.colours[i]!);
    expect(painted).toHaveLength(drawn.pixels.length);
    expect(painted).toEqual(Array.from(drawn.pixels, (v) => (v === 0 ? null : ink[v - 1])));
    expect(painted.filter((c) => c !== null).length).toBeGreaterThan(20);
  });
  it('is shown at a whole number of screen pixels per art pixel, from --display-scale', () => {
    const canvas = displayText('A', { level: 2 }).querySelector('canvas')!;
    expect(canvas.style.width).toBe(`calc(${canvas.width}px * var(--display-scale, 2))`);
    expect(canvas.style.height).toBe('calc(12px * var(--display-scale, 2))');
    expect(canvas.style.imageRendering).toBe('pixelated');
  });
  it('a character the sheet has no glyph for is counted as a gap, once per use', () => {
    displayText('café é', { level: 1 });
    expect(interfaceGaps.glyphs).toEqual([0xe9, 0xe9]);
  });
  it('every character used in a display heading has a required glyph', () => {
    const missing = (strings: readonly string[]): string[] =>
      [...new Set(strings.flatMap((s) => [...s]))].filter((c) => !REQUIRED_GLYPHS.includes(c.codePointAt(0)!));
    expect(Object.values(DISPLAY_HEADINGS).length).toBeGreaterThan(0);
    expect(missing(Object.values(DISPLAY_HEADINGS))).toEqual([]);
    // Control: a heading with a character outside the list is caught.
    expect(missing(['Celestial Frontier', 'Café'])).toEqual(['é']);
  });
});

describe('the current sheet', () => {
  it('is the placeholder, marked standin, until a pack sheet is given; and again when it is taken away', () => {
    expect(sheetState()).toBe('standin');
    expect(currentSheet()).toBe(placeholderSheet());
    const pack = parseInterfaceSheet([
      'interface 1', 'palette', 'colour 1 ff0000', 'ramp ink 1 1 1 1', 'ramp accent 1 1 1 1',
      'font display line=2 base=2 gap=0 space=1', 'glyph U+0041', '4', '', 'glyph U+FFFD', '11', '', 'icon missing size=1', '1',
    ].join('\n'));
    useSheet(pack);
    expect(sheetState()).toBe('pack');
    expect(currentSheet()).toBe(pack);
    const canvas = displayText('A', { level: 1 }).querySelector('canvas')!;
    expect([canvas.width, canvas.height, paintedBy(canvas)]).toEqual([1, 2, [0xff0000, null]]);
    useSheet(null);
    expect(sheetState()).toBe('standin');
    expect(currentSheet()).toBe(placeholderSheet());
  });
});
