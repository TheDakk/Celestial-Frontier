import { describe, expect, it } from 'vitest';
import {
  colourTable, parseCatalogueText, PIXEL_ACCENT, PIXEL_CHARS, PIXEL_EYE, PIXEL_EYE_HIGHLIGHT, PIXEL_GLOW, PIXEL_OUTLINE,
  PIXEL_PRIMARY, PIXEL_TRANSPARENT, PIXEL_UNDERSIDE, PIXEL_IRIS, IRIS_RAMP_COUNT,
} from '@cf/art-format';

// Every colour is distinct, so a value mapped to the wrong palette entry shows as a wrong number.
const { palette } = parseCatalogueText(`palette
colour 0 000010
colour 1 000011
colour 2 000012
colour 3 000013
colour 4 000014
colour 10 000020
colour 11 000021
colour 12 000022
colour 13 000023
colour 20 000030
colour 21 000031
colour 22 000032
colour 23 000033
colour 30 000040
colour 31 000041
colour 32 000042
ramp body 1 2 3 4
ramp spots 10 11 12 13
ramp belly 20 21 22 23
ramp ring 30 31 32 12
outline 30
eye 31
eyeHighlight 32
glow 0
`);

describe('pixel values', () => {
  it('names the fixed values from the spec', () => {
    expect([PIXEL_TRANSPARENT, PIXEL_PRIMARY, PIXEL_ACCENT, PIXEL_UNDERSIDE, PIXEL_EYE, PIXEL_EYE_HIGHLIGHT, PIXEL_GLOW, PIXEL_OUTLINE])
      .toEqual([0, 1, 5, 9, 13, 14, 15, 16]);
  });
  it('has one text character per value 0-20', () => {
    expect(PIXEL_CHARS).toBe('.123456789abcdefghijk');
    expect(PIXEL_CHARS[PIXEL_OUTLINE]).toBe('g');
    expect(PIXEL_CHARS[PIXEL_IRIS]).toBe('h');
    expect(PIXEL_CHARS[PIXEL_IRIS + 3]).toBe('k');
  });
  it('fixes the iris value and the ramp count', () => {
    expect(PIXEL_IRIS).toBe(17);
    expect(IRIS_RAMP_COUNT).toBe(8);
  });
});

describe('colourTable', () => {
  it('maps 17-20 to the iris ramp', () => {
    const { table } = colourTable(palette, { primary: 'body', accent: 'spots', underside: 'belly', iris: 'ring' });
    expect(table).toHaveLength(21);
    expect(table.slice(PIXEL_IRIS, PIXEL_IRIS + 4)).toEqual([0x000040, 0x000041, 0x000042, 0x000022]);
  });
  it('reports an unknown iris ramp with four zeros, without throwing', () => {
    const { table, unknown } = colourTable(palette, { primary: 'body', accent: 'spots', underside: 'belly', iris: 'nope' });
    expect(unknown).toEqual(['nope']);
    expect(table.slice(PIXEL_IRIS)).toEqual([0, 0, 0, 0]);
    expect(table).toHaveLength(21);
  });
  it('maps values 1-16 to the right palette entries and keeps 0 transparent', () => {
    const { table, unknown } = colourTable(palette, { primary: 'body', accent: 'spots', underside: 'belly', iris: 'ring' });
    expect(table).toEqual([
      0,
      0x000011, 0x000012, 0x000013, 0x000014, // 1-4 primary ramp
      0x000020, 0x000021, 0x000022, 0x000023, // 5-8 accent ramp
      0x000030, 0x000031, 0x000032, 0x000033, // 9-12 underside ramp
      0x000041, 0x000042, 0x000010, 0x000040, // 13 eye, 14 highlight, 15 glow, 16 outline
      0x000040, 0x000041, 0x000042, 0x000022, // 17-20 iris ramp
    ]);
    expect(unknown).toEqual([]);
  });
  it('reports an unknown ramp name, including an inherited one, without throwing', () => {
    const { table, unknown } = colourTable(palette, { primary: 'body', accent: 'nope', underside: 'toString', iris: 'ring' });
    expect(unknown).toEqual(['nope', 'toString']);
    expect(table).toHaveLength(21);
    expect(table.slice(PIXEL_ACCENT, PIXEL_EYE)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(table[PIXEL_PRIMARY]).toBe(0x000011);
  });
  it('reports an inherited name even when the ramps record has a prototype', () => {
    const plain = { ...palette, ramps: { body: [1, 2, 3, 4] as const } };
    expect(colourTable(plain, { primary: 'body', accent: 'constructor', underside: 'body', iris: 'body' }).unknown).toEqual(['constructor']);
  });
});
