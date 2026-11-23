import { describe, expect, it } from 'vitest';
import { measureText, parseInterfaceSheet } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { wrapWords } from '../src/space/label-place';
import { artGrid, artScale } from '../src/space/project';

const font = parseInterfaceSheet(testInterfaceSheetText()).font;
const widthOf = (text: string): number => measureText(font, text).w;
const QUASAR = 'quasar — a feeding black hole outshining its galaxy';

describe('words wider than the view', () => {
  it('the quasar caption wraps onto lines that each fit a view narrower than it', () => {
    // On a phone held upright (390 by 844 at 3 device pixels, an art pixel covering 4 of them) the placeholder font
    // letters it 257 art pixels wide: about 343 screen pixels, which fits. A font with wider letters would not.
    const scale = artScale(390, 844, 3);
    const grid = artGrid(390, 844, 3, scale);
    expect([widthOf(QUASAR), grid.w]).toEqual([257, 293]);
    expect(wrapWords(QUASAR, widthOf, grid.w - 8)).toEqual([QUASAR]);
    const max = 200;
    const lines = wrapWords(QUASAR, widthOf, max);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe(QUASAR);
    for (const line of lines) expect(widthOf(line), line).toBeLessThanOrEqual(max);
    // No line could have taken the first word of the next.
    for (let i = 0; i + 1 < lines.length; i++) expect(widthOf(`${lines[i]} ${lines[i + 1]!.split(' ')[0]}`)).toBeGreaterThan(max);
  });

  it('words that fit stay on one line; a single word wider than the view is left whole', () => {
    expect(wrapWords(QUASAR, widthOf, widthOf(QUASAR))).toEqual([QUASAR]);
    expect(wrapWords('Earth', widthOf, 400)).toEqual(['Earth']);
    expect(wrapWords('Andromeda far', widthOf, 3)).toEqual(['Andromeda', 'far']);
  });
});
