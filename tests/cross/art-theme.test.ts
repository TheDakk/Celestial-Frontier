/* The renderer holds its own copy of the game's ability-theme rule (the art packages may not import the domain
   combat package); these tests hold the copy to the game's own table and rule. */
import { describe, expect, it } from 'vitest';
import { colourTable, PIXEL_DEEP, THEME_COLOURS, THEME_NAMES } from '@cf/art-format';
import { testCatalogue } from '@cf/art-testparts';
import { THEME_BY_HABITAT, themeOf, wrap } from '@cf/art-recipe';
import { ABILITY_THEMES, abilityTheme } from '@cf/domain-combatcore';

/** Every habitat and movement gene, unmarked and marked as an extremophile. */
const GENOMES = [undefined, 1].flatMap((x) =>
  Array.from({ length: 19 }, (_, habitat) => Array.from({ length: 18 }, (_, loco) => ({ kingdom: 'fauna', habitat, loco, ...(x === undefined ? {} : { x }) }))).flat());

/** The genomes whose theme differs from the game's abilityTheme. */
const mismatches = (theme: (g: Record<string, unknown>) => string): string[] =>
  GENOMES.flatMap((g) => (theme(g) === abilityTheme(g) ? [] : [JSON.stringify(g)]));

// The movement overrides as the game writes them, for the planted fault below.
const LOCO_OVERRIDE: Readonly<Record<number, string>> = { 3: 'storm', 4: 'tide', 13: 'tide', 5: 'psionic', 11: 'psionic', 17: 'psionic', 1: 'stone' };

describe('the theme', () => {
  it('THEME_NAMES are the game\'s ability themes', () => {
    expect(new Set(THEME_NAMES)).toEqual(new Set(Object.keys(ABILITY_THEMES)));
    expect(THEME_NAMES.length).toBe(Object.keys(ABILITY_THEMES).length);
  });

  it('THEME_COLOURS are the game\'s theme colours', () => {
    expect(Object.keys(THEME_COLOURS)).toEqual([...THEME_NAMES]);
    for (const name of THEME_NAMES) expect(THEME_COLOURS[name], name).toBe(parseInt((ABILITY_THEMES[name] as { col: string }).col.slice(1), 16));
  });

  it('themeOf equals abilityTheme for every habitat and movement gene, marked or not', () => {
    expect(GENOMES.length).toBe(19 * 18 * 2);
    expect(mismatches(themeOf)).toEqual([]);
  });

  it('the comparison catches a habitat table with one row changed (planted fault)', () => {
    const drifted = [...THEME_BY_HABITAT];
    drifted[9] = 'frost';
    const faulty = (g: Record<string, unknown>): string => LOCO_OVERRIDE[wrap(g['loco'], 18)] ?? drifted[wrap(g['habitat'], 19)]!;
    // Habitat 9 meets eleven movement genes that do not override it, unmarked and marked.
    expect(mismatches(faulty).length).toBe(2 * 11);
    // The same rule over the true table passes, so the fault and nothing else is what fails.
    expect(mismatches((g) => LOCO_OVERRIDE[wrap(g['loco'], 18)] ?? THEME_BY_HABITAT[wrap(g['habitat'], 19)]!)).toEqual([]);
  });

  it('on the placeholder palette, a table without a tint is today\'s, and every theme tints only 1 to 12 and deep (25 to 28), which follows the primary ramp', () => {
    /** The primary entries with each channel at round(55c / 100), halves up: deep, for the test only. */
    const deepOf = (table: readonly number[]): number[] => table.slice(1, 5).map((c) => [16, 8, 0].reduce((out, s) => out | (Math.floor((55 * ((c >> s) & 255) + 50) / 100) << s), 0));
    const { palette } = testCatalogue();
    const names = [...Object.keys(palette.ramps), 'no-such-ramp'];
    expect(names.length).toBeGreaterThan(40);
    for (let i = 0; i < names.length; i++) {
      const ramps = { primary: names[i]!, accent: names[(i + 1) % names.length]!, underside: names[(i + 2) % names.length]!, iris: names[(i + 3) % names.length]! };
      const today = colourTable(palette, ramps);
      expect(colourTable(palette, ramps, undefined), JSON.stringify(ramps)).toEqual(today);
      expect(today.table.slice(PIXEL_DEEP)).toEqual(deepOf(today.table));
      for (const theme of THEME_NAMES) {
        const tinted = colourTable(palette, ramps, THEME_COLOURS[theme]);
        expect([tinted.table[0], ...tinted.table.slice(13, PIXEL_DEEP)], theme).toEqual([today.table[0], ...today.table.slice(13, PIXEL_DEEP)]);
        expect(tinted.table.slice(PIXEL_DEEP), theme).toEqual(deepOf(tinted.table));
        expect(tinted.unknown).toEqual(today.unknown);
      }
    }
  });
});
