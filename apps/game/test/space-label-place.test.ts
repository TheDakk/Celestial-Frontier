import { describe, expect, it } from 'vitest';
import { measureText, parseInterfaceSheet } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { overlaps, placeLabels, reaches, wrapWords, type Box, type LabelSpec, type PlacedLabel, type Surroundings } from '../src/space/label-place';
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

const VIEW = { w: 300, h: 200 };
const NONE: Surroundings = { view: VIEW, keepOut: [], discs: [] };
const spec = (over: Partial<LabelSpec>): LabelSpec => ({ text: 'a', w: 40, h: 12, x: 150, y: 100, clear: 10, side: 'below', rank: 1, size: 5, ...over });
const sideOf = (placed: readonly PlacedLabel[], text: string): string | null => placed.find((label) => label.text === text)?.side ?? null;

describe('where the words of a map stand', () => {
  it('a label alone stands on the side the game letters it, at the game\'s offset from its body', () => {
    expect(placeLabels([spec({})], NONE)).toEqual([{ text: 'a', side: 'below', x: 130, y: 110, w: 40, h: 12 }]);
    expect(placeLabels([spec({ side: 'above' })], NONE)).toEqual([{ text: 'a', side: 'above', x: 130, y: 78, w: 40, h: 12 }]);
    expect(placeLabels([spec({ side: 'centre', clear: 0 })], NONE)).toEqual([{ text: 'a', side: 'centre', x: 130, y: 94, w: 40, h: 12 }]);
  });

  it('a label whose side is taken by other words moves to the next free of below, above, right and left', () => {
    const first = spec({ text: 'first', size: 9 });
    // Each case blocks one side more for the second body, 8 pixels to the right of the first.
    const second = spec({ text: 'second', x: 158 });
    expect(sideOf(placeLabels([second, first], NONE), 'second')).toBe('above');
    const over = spec({ text: 'over', x: 150, y: 70, clear: 4, side: 'below', rank: 0 });
    expect(placeLabels([second, first, over], NONE).map((label) => [label.text, label.side])).toEqual([['over', 'below'], ['first', 'below'], ['second', 'right']]);
    const beside = spec({ text: 'beside', x: 200, y: 100, clear: 0, side: 'centre', rank: 0 });
    expect(sideOf(placeLabels([second, first, over, beside], NONE), 'second')).toBe('left');
  });

  it('no two placed labels overlap, and a label is left out only when none of its four sides is free', () => {
    const bars: Box[] = [{ x: 0, y: 110, w: 300, h: 12 }, { x: 0, y: 78, w: 300, h: 12 }, { x: 160, y: 94, w: 140, h: 12 }];
    expect(sideOf(placeLabels([spec({})], { ...NONE, keepOut: bars }), 'a')).toBe('left');
    expect(placeLabels([spec({})], { ...NONE, keepOut: [...bars, { x: 0, y: 94, w: 140, h: 12 }] })).toEqual([]);
    // A crowd: whatever is placed, no two share a pixel.
    const crowd = Array.from({ length: 30 }, (_, i) => spec({ text: `body ${i}`, x: 40 + (i % 6) * 37, y: 30 + (i >> 1) * 9, size: i % 4 }));
    const placed = placeLabels(crowd, NONE);
    expect(placed.length).toBeGreaterThan(5);
    expect(placed.length).toBeLessThan(30);
    for (const a of placed) for (const b of placed) if (a !== b) expect(overlaps(a, b), `${a.text} and ${b.text}`).toBe(false);
  });

  it('with a gap asked for, two names on one line stand at least that far apart, or one of them moves', () => {
    // Two bodies whose names, each under its own, would end and begin one pixel apart on the same line.
    const left = spec({ text: 'Earth', x: 100, size: 9 });
    const right = spec({ text: 'Mercury', x: 141 });
    const butting = placeLabels([left, right], NONE);
    expect(butting.map((label) => [label.text, label.side, label.x, label.x + label.w])).toEqual([['Earth', 'below', 80, 120], ['Mercury', 'below', 121, 161]]);
    const apart = placeLabels([left, right], { ...NONE, apart: 4 });
    expect(apart.map((label) => [label.text, label.side])).toEqual([['Earth', 'below'], ['Mercury', 'above']]);
    // Exactly the gap apart is apart enough; so are names on different lines, however near.
    expect(sideOf(placeLabels([left, spec({ text: 'Mercury', x: 144 })], { ...NONE, apart: 4 }), 'Mercury')).toBe('below');
    expect(sideOf(placeLabels([left, spec({ text: 'Mercury', x: 143 })], { ...NONE, apart: 4 }), 'Mercury')).toBe('above');
    expect(sideOf(placeLabels([left, spec({ text: 'Mercury', x: 141, y: 112 })], { ...NONE, apart: 4 }), 'Mercury')).toBe('below');
    // A name with no side a gap clear of the others still stands, where it overlaps none of them.
    const walls: Box[] = [{ x: 0, y: 78, w: 300, h: 12 }, { x: 0, y: 94, w: 300, h: 12 }];
    expect(placeLabels([left, right], { ...NONE, apart: 4, keepOut: walls }).map((label) => [label.text, label.side, label.x])).toEqual([['Earth', 'below', 80], ['Mercury', 'below', 121]]);
    // Whatever is placed, no two names on one line are nearer than the gap.
    const crowd = Array.from({ length: 30 }, (_, i) => spec({ text: `body ${i}`, x: 40 + (i % 6) * 37, y: 30 + (i >> 1) * 9, size: i % 4 }));
    const placed = placeLabels(crowd, { ...NONE, apart: 4 });
    expect(placed.length).toBeGreaterThan(5);
    for (const a of placed) for (const b of placed) {
      if (a === b || a.y >= b.y + b.h || b.y >= a.y + a.h) continue;
      expect(Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)), `${a.text} and ${b.text}`).toBeGreaterThanOrEqual(4);
    }
  });

  it('words never stand on the top bar or the dock', () => {
    const bar: Box = { x: 0, y: 0, w: 300, h: 30 };
    const under = spec({ y: 34, clear: 6, side: 'above' });
    expect(placeLabels([under], NONE)[0]).toMatchObject({ side: 'above', y: 16 });
    const moved = placeLabels([under], { ...NONE, keepOut: [bar] })[0]!;
    expect(overlaps(moved, bar)).toBe(false);
    expect(moved).toMatchObject({ side: 'below', y: 40 });
    // A body under the bar itself has no free side.
    expect(placeLabels([spec({ y: 10, clear: 2 })], { ...NONE, keepOut: [bar] })).toEqual([]);
  });

  it('the lower rank is placed first, then the larger body, then the one nearer the middle of the view', () => {
    const at = (text: string, over: Partial<LabelSpec>): LabelSpec => spec({ text, ...over });
    const own = (list: LabelSpec[]): string => placeLabels(list, NONE).find((label) => label.side === 'below')!.text;
    expect(own([at('far rank', { rank: 2 }), at('near rank', { rank: 1, x: 152 })])).toBe('near rank');
    expect(own([at('small', { size: 3 }), at('large', { size: 8, x: 152 })])).toBe('large');
    expect(own([at('edge', { x: 140 }), at('middle', { x: 152 })])).toBe('middle');
    // The same bodies in any order stand in the same places.
    const list = [at('b', { x: 152 }), at('a', {}), at('c', { x: 148, size: 6 })];
    expect(placeLabels([...list].reverse(), NONE)).toEqual(placeLabels(list, NONE));
  });

  it('a side wholly in the view and off every body is taken before one that is not; a label is never left out for that', () => {
    const neighbour = { x: 150, y: 116, r: 8 };
    expect(reaches({ x: 130, y: 110, w: 40, h: 12 }, neighbour)).toBe(true);
    expect(sideOf(placeLabels([spec({})], { ...NONE, discs: [neighbour] }), 'a')).toBe('above');
    // At the foot of the view the words under a body would be cut off: they stand over it.
    expect(sideOf(placeLabels([spec({ y: 185 })], NONE), 'a')).toBe('above');
    // Bodies on every side: the game's own side stands.
    const ringOf = [{ x: 150, y: 116, r: 8 }, { x: 150, y: 84, r: 8 }, { x: 180, y: 100, r: 8 }, { x: 120, y: 100, r: 8 }];
    expect(sideOf(placeLabels([spec({})], { ...NONE, discs: ringOf }), 'a')).toBe('below');
    // Its own body, a disc as wide as the offset, is never in its way.
    expect(sideOf(placeLabels([spec({})], { ...NONE, discs: [{ x: 150, y: 100, r: 10 }] }), 'a')).toBe('below');
  });

  it('words by a body in the view are slid sideways to stay in the view; those of a body outside it are not', () => {
    expect(placeLabels([spec({ x: 5 })], NONE)[0]).toMatchObject({ side: 'below', x: 0 });
    expect(placeLabels([spec({ x: 295 })], NONE)[0]).toMatchObject({ side: 'below', x: 260 });
    expect(placeLabels([spec({ x: -30 })], NONE)[0]).toMatchObject({ side: 'below', x: -50 });
    expect(placeLabels([spec({ x: 20, w: 320 })], NONE)[0]!.x).toBe(-140);
  });
});
