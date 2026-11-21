/* The renderer holds its own copy of the game's ability-theme rule (the art packages may not import the domain
   combat package); these tests hold the copy to the game's own table and rule. */
import { describe, expect, it } from 'vitest';
import { THEME_COLOURS, THEME_NAMES } from '@cf/art-format';
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
});
