import { describe, expect, it } from 'vitest';
import { drawText, parseInterfaceSheet } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { CAPTION_EDGE, edged } from '../src/ui/caption';

const sheet = parseInterfaceSheet(testInterfaceSheetText());
const words = drawText(sheet.font, 'Milky Way — you are here', { glyphs: [], icons: [], elements: [] });

describe('the dark edge about the words of the map', () => {
  const caption = edged(words);
  const value = (x: number, y: number): number => (x < 0 || y < 0 || x >= caption.w || y >= caption.h ? 0 : caption.pixels[y * caption.w + x]!);
  const lettered = (v: number): boolean => v !== 0 && v !== CAPTION_EDGE;

  it('is one pixel on every side of the picture, and leaves every letter as it was drawn', () => {
    expect([caption.w, caption.h]).toEqual([words.w + 2, words.h + 2]);
    let letters = 0;
    for (let y = 0; y < words.h; y++) for (let x = 0; x < words.w; x++) {
      const drawn = words.pixels[y * words.w + x]!;
      if (drawn !== 0) { letters++; expect(value(x + 1, y + 1)).toBe(drawn); } else expect(lettered(value(x + 1, y + 1))).toBe(false);
    }
    expect(letters).toBeGreaterThan(200);
    expect(CAPTION_EDGE).toBeGreaterThan(8);
  });

  it('no lettered pixel touches what lies behind the words, not even at a corner; and the edge is no wider than one pixel', () => {
    for (let y = 0; y < caption.h; y++) for (let x = 0; x < caption.w; x++) {
      const around = [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => value(x + dx, y + dy)));
      if (lettered(value(x, y))) expect(around.every((v) => v !== 0), `letter at ${x},${y}`).toBe(true);
      if (value(x, y) === CAPTION_EDGE) expect(around.some(lettered), `edge at ${x},${y}`).toBe(true);
    }
  });

  it('over a field as white as paper the words still read: every letter stands on dark, at the 0.8 the map shows its words', () => {
    // The colours the map screen gives the picture: the sheet's ink for the letters, the colour of space for the edge.
    const ink = sheet.palette.colours[sheet.palette.ramps.ink![0]!]!;
    const edge = sheet.palette.colours[0]!;
    const over = (colour: number): number[] => [16, 8, 0].map((shift) => (((colour >> shift) & 255) * 0.8 + 255 * 0.2) / 255);
    const luminance = (colour: number): number => {
      const [r, g, b] = over(colour).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a: number, b: number): number => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
    // Without the edge the letters are all but the white under them; with it they stand out as text must.
    expect((1 + 0.05) / (luminance(ink) + 0.05)).toBeLessThan(1.5);
    expect(contrast(ink, edge)).toBeGreaterThan(4.5);
  });

  it('a picture with nothing lettered has no edge', () => {
    expect([...edged({ w: 3, h: 2, pixels: new Uint8Array(6) }).pixels]).toEqual(Array.from({ length: 20 }, () => 0));
  });
});
