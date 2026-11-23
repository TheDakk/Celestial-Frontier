import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sizeClass } from '../src/layout/size-class';
import { LAYOUT_SIZES, checkLayout, type Box, type LayoutProblem } from '../src/layoutcheck/check';
import { FAULTS, FAULT_KINDS } from '../src/layoutcheck/faults';
import { alphaOf } from '../src/layoutcheck/probe';

const VIEW = { w: 390, h: 844 };
const box = (over: Partial<Box>): Box => ({
  id: 'a', x: 20, y: 100, w: 120, h: 48, interactive: false, hasText: false, overflowX: 0, overflowY: 0,
  ancestors: [], allow: [], inScroll: false, backed: true, caption: false, ...over,
});
const kinds = (problems: readonly LayoutProblem[]): string[] => problems.map((p) => `${p.kind}: ${p.ids.join(' + ')}`);
const check = (boxes: Box[], input: 'touch' | 'mouse' = 'mouse'): string[] => kinds(checkLayout(boxes, VIEW, input));

describe('the layout check', () => {
  it('a text box overflowing by 4 px is clipped-text; inside a marked scroll area it is not', () => {
    expect(check([box({ id: 'label', hasText: true, overflowX: 4 })])).toEqual(['clipped-text: label']);
    expect(check([box({ id: 'label', hasText: true, overflowY: 4 })])).toEqual(['clipped-text: label']);
    expect(check([box({ id: 'list', hasText: true, overflowY: 400, allow: ['scroll'] })])).toEqual([]);
    // A pixel of rounding is not a fault, and a box without text clips nothing.
    expect(check([box({ hasText: true, overflowX: 1 }), box({ id: 'b', y: 200, overflowX: 40 })])).toEqual([]);
    expect(checkLayout([box({ id: 'label', hasText: true, overflowX: 4 })], VIEW, 'mouse')[0]!.detail).toBe('content runs 4 px past its width and 0 px past its height');
  });

  it('two buttons sharing 10 px overlap; a button inside a panel does not overlap the panel', () => {
    const first = box({ id: 'first', interactive: true });
    expect(check([first, box({ id: 'second', interactive: true, x: 130, y: 110 })])).toEqual(['overlap: first + second']);
    expect(check([first, box({ id: 'beside', interactive: true, x: 140 })])).toEqual([]);
    expect(check([first, box({ id: 'touching', interactive: true, x: 139 })])).toEqual([]);
    expect(check([box({ id: 'panel', interactive: true, w: 300, h: 300 }), box({ id: 'inside', interactive: true, ancestors: ['panel'] })])).toEqual([]);
    // Text under a control is as much a fault as a control under one; its own words are not.
    expect(check([first, box({ id: 'title', hasText: true, x: 130, y: 110 })])).toEqual(['overlap: first + title']);
    expect(check([first, box({ id: 'its words', hasText: true, x: 30, y: 110, w: 60, h: 20, ancestors: ['first'] })])).toEqual([]);
    expect(check([box({ id: 'title', hasText: true }), box({ id: 'words', hasText: true, x: 130, y: 110 })])).toEqual([]);
    // Something that is not a control may lie under one; an excused pair is not reported.
    expect(check([first, box({ id: 'picture', x: 130, y: 110 })])).toEqual([]);
    expect(check([first, box({ id: 'second', interactive: true, x: 130, y: 110, allow: ['overlap'] })])).toEqual([]);
  });

  it('a 30 px button is a small target under touch and passes under mouse', () => {
    const small = box({ id: 'small', interactive: true, w: 30, h: 30 });
    expect(check([small], 'touch')).toEqual(['small-target: small']);
    expect(check([small], 'mouse')).toEqual([]);
    expect(check([box({ id: 'low', interactive: true, w: 120, h: 43 })], 'touch')).toEqual(['small-target: low']);
    expect(check([box({ interactive: true, w: 44, h: 44 }), box({ id: 'words', y: 300, w: 30, h: 12 }), box({ id: 'excused', y: 400, interactive: true, w: 30, h: 30, allow: ['small'] })], 'touch')).toEqual([]);
  });

  it('a box 2 px outside the viewport is off-screen', () => {
    expect(check([box({ id: 'right', x: 272 })])).toEqual(['off-screen: right']);
    expect(check([box({ id: 'left', x: -2 })])).toEqual(['off-screen: left']);
    expect(check([box({ id: 'foot', y: 798 })])).toEqual(['off-screen: foot']);
    expect(check([box({ x: 271 }), box({ id: 'edge', x: 270, y: 796 })])).toEqual([]);
    // Inside a scroll area it is only scrolled away. The safe area is not part of the view.
    expect(check([box({ id: 'row', y: 1200, inScroll: true })])).toEqual([]);
    const notched = { ...VIEW, safe: { top: 47, right: 0, bottom: 34, left: 0 } };
    expect(kinds(checkLayout([box({ id: 'under the notch', y: 20 }), box({ id: 'clear', y: 60 })], notched, 'mouse'))).toEqual(['off-screen: under the notch']);
  });

  it('text with no solid surface under it is see-through; words of the map are never asked for one', () => {
    expect(check([box({ id: 'card text', hasText: true, backed: false })])).toEqual(['see-through: card text']);
    expect(check([box({ id: 'card text', hasText: true }), box({ id: 'picture', y: 300, backed: false })])).toEqual([]);
    expect(check([box({ id: 'Earth', caption: true, hasText: true, backed: false })])).toEqual([]);
  });

  it('words of the map wider than the view are a wide caption; running off its edge they are not a fault', () => {
    expect(check([box({ id: 'quasar', caption: true, hasText: true, backed: false, x: -9, w: 408 })])).toEqual(['wide-caption: quasar']);
    expect(check([box({ id: 'Neptune', caption: true, hasText: true, backed: false, x: 360, w: 60 })])).toEqual([]);
  });

  it('every layout size maps to its intended class and all three classes are covered', () => {
    expect(LAYOUT_SIZES.map((size) => sizeClass(size.w, size.h))).toEqual(['compact', 'compact', 'medium', 'medium', 'wide', 'wide']);
  });

  it('a colour is solid only without an alpha under 1, however the browser writes it', () => {
    expect(['rgb(10, 16, 30)', 'rgba(10, 16, 30, 1)', 'rgb(10 16 30)', 'rgb(10 16 30 / 100%)', 'color(srgb 0.1 0.2 0.3)'].map(alphaOf)).toEqual([1, 1, 1, 1, 1]);
    expect(['rgba(10, 16, 30, 0.84)', 'rgb(10 16 30 / 0.84)', 'rgb(10 16 30 / 84%)', 'color(srgb 0.1 0.2 0.3 / 0.84)'].map(alphaOf)).toEqual([0.84, 0.84, 0.84, 0.84]);
    expect(['rgba(0, 0, 0, 0)', 'transparent', ''].map(alphaOf)).toEqual([0, 0, 0]);
  });

  it('the job lays out the sizes and plants the faults this folder names', () => {
    const job = readFileSync(new URL('../../../tools/layout-check.mjs', import.meta.url), 'utf8');
    const sizes = /const SIZES = (\[\[.*\]\]);/.exec(job)?.[1];
    expect(JSON.parse(sizes ?? 'null')).toEqual(LAYOUT_SIZES.map((size) => [size.w, size.h]));
    const faults = /const FAULTS = (\{.*\});/.exec(job)?.[1];
    expect(new Function(`return ${faults}`)()).toEqual(FAULT_KINDS);
    expect(Object.keys(FAULT_KINDS)).toEqual([...FAULTS]);
  });
});
