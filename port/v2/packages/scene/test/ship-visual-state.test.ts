import { describe, expect, it } from 'vitest';
import {
  ASC_CHAPTER_COUNT,
  ascAllowsStar,
  ascStageOf,
  shipVisualStateOf,
  type NormalizedShipVisualInput,
  type ShipVisualState,
} from '@cf/scene';
import { ASC_RING_R } from '@cf/domain-strays';
import {
  HOME_GAL_SEED, SOL_POS, SOL_SEED,
} from '@cf/domain-worldconfig';

/* The legacy ship painter's stable seed; separate from PLAYER_SEED, which is
   combat/avatar authority rather than ship-livery authority. */
const LIVERY_SEED = 0x5111;

function input(
  ids: readonly string[],
  ascCh = 0,
  liverySeed = LIVERY_SEED,
): NormalizedShipVisualInput {
  return {
    items: ids.map((id) => [id, 1]),
    ascCh,
    liverySeed,
  };
}

function agreesWithTravel(
  candidate: ShipVisualState,
  source: NormalizedShipVisualInput,
): boolean {
  const travelStage = ascStageOf(source.items, source.ascCh);
  const stars = [
    { galSeed: HOME_GAL_SEED, star: { ...SOL_POS, seed: SOL_SEED } },
    {
      galSeed: HOME_GAL_SEED,
      star: { x: SOL_POS.x + (ASC_RING_R as number) * 0.9, y: SOL_POS.y, seed: 7 },
    },
    {
      galSeed: HOME_GAL_SEED,
      star: { x: SOL_POS.x + (ASC_RING_R as number) * 1.1, y: SOL_POS.y, seed: 8 },
    },
    { galSeed: HOME_GAL_SEED + 1, star: { ...SOL_POS, seed: SOL_SEED } },
  ];
  return candidate.chassisStage === travelStage
    && stars.every(({ galSeed, star }) =>
      ascAllowsStar(candidate.chassisStage, galSeed, star)
        === ascAllowsStar(travelStage, galSeed, star));
}

describe('@cf/scene — ShipVisualState', () => {
  it('projects every chassis stage from the one travel-stage authority', () => {
    const cases: Array<[NormalizedShipVisualInput, ShipVisualState['chassisStage'], ShipVisualState['provenance']]> = [
      [input([]), 0, 'owned-items'],
      [input(['jumpdrive']), 1, 'owned-items'],
      [input(['array']), 2, 'owned-items'],
      [input(['igdrive']), 3, 'owned-items'],
      [input([], ASC_CHAPTER_COUNT), 3, 'legacy-charter-refit'],
    ];
    for (const [source, stage, provenance] of cases) {
      const state = shipVisualStateOf(source);
      expect(state.chassisStage).toBe(stage);
      expect(state.provenance).toBe(provenance);
      expect(agreesWithTravel(state, source)).toBe(true);
    }
  });

  it('covers every normalized drive/tool permutation and keeps hardpoints exact', () => {
    const stages = new Set<number>();
    const hardpointPermutations = new Set<string>();
    let cases = 0;
    for (const terminal of [false, true]) {
      for (let driveMask = 0; driveMask < 8; driveMask++) {
        for (let toolMask = 0; toolMask < 4; toolMask++) {
          const jump = !!(driveMask & 1);
          const array = !!(driveMask & 2);
          const ig = !!(driveMask & 4);
          const autoext = !!(toolMask & 1);
          const cscoop = !!(toolMask & 2);
          const ids = [
            ...(jump ? ['jumpdrive'] : []),
            ...(array ? ['array'] : []),
            ...(ig ? ['igdrive'] : []),
            ...(autoext ? ['autoext'] : []),
            ...(cscoop ? ['cscoop'] : []),
          ];
          const source = input(ids, terminal ? ASC_CHAPTER_COUNT : 0);
          const state = shipVisualStateOf(source);
          const itemStage = ig ? 3 : array ? 2 : jump ? 1 : 0;
          const expectedStage = terminal ? 3 : itemStage;

          expect(state).toEqual({
            chassisStage: expectedStage,
            hardpoints: { array, autoext, cscoop },
            installedSystemIds: ids,
            liverySeed: LIVERY_SEED,
            provenance: terminal && !ig ? 'legacy-charter-refit' : 'owned-items',
          });
          expect(agreesWithTravel(state, source)).toBe(true);
          expect(Object.isFrozen(state)).toBe(true);
          expect(Object.isFrozen(state.hardpoints)).toBe(true);
          expect(Object.isFrozen(state.installedSystemIds)).toBe(true);
          stages.add(state.chassisStage);
          hardpointPermutations.add(`${+array}${+autoext}${+cscoop}`);
          cases++;
        }
      }
    }
    expect(cases).toBe(64);
    expect([...stages].sort()).toEqual([0, 1, 2, 3]);
    expect(hardpointPermutations.size).toBe(8);
  });

  it('uses a generic terminal refit only when chapter reach outruns owned items', () => {
    const nonterminal = shipVisualStateOf(input([], ASC_CHAPTER_COUNT - 1));
    expect(nonterminal).toMatchObject({ chassisStage: 0, provenance: 'owned-items' });

    const fallback = shipVisualStateOf(input(['autoext', 'cscoop'], ASC_CHAPTER_COUNT));
    expect(fallback).toEqual({
      chassisStage: 3,
      hardpoints: { array: false, autoext: true, cscoop: true },
      installedSystemIds: ['autoext', 'cscoop'],
      liverySeed: LIVERY_SEED,
      provenance: 'legacy-charter-refit',
    });

    const owned = shipVisualStateOf(input(['igdrive'], ASC_CHAPTER_COUNT));
    expect(owned).toMatchObject({ chassisStage: 3, provenance: 'owned-items' });
  });

  it('reconstructs identically after a reload-shaped clone and ignores unrelated save fields', () => {
    const source: NormalizedShipVisualInput & {
      equip: Record<string, string>;
      equipAff: Record<string, { k: string; v: number; forId: string }>;
      techOwned: string[];
      ascProg: Record<string, number>;
      explorerName: string;
      nameHue: number;
      route: Record<string, unknown>;
    } = {
      ...input(['jumpdrive', 'array', 'autoext'], 2),
      equip: { tool: 'rig3' },
      equipAff: { tool: { k: 'yield', v: 2, forId: 'rig3' } },
      techOwned: ['deepScan'],
      ascProg: { 'c3-ig': 999 },
      explorerName: 'A renamed explorer',
      nameHue: 7,
      route: { type: 'planet', pseed: 133 },
    };
    const before = shipVisualStateOf(source);
    const reloaded = JSON.parse(JSON.stringify(source)) as typeof source;
    reloaded.equip = { tool: 'something-else' };
    reloaded.equipAff = {};
    reloaded.techOwned = ['everything'];
    reloaded.ascProg = { 'c1-jump': 999, 'c3-ig': 999 };
    reloaded.explorerName = 'Different';
    reloaded.nameHue = -1;
    reloaded.route = { type: 'galaxy', pseed: 999 };
    const after = shipVisualStateOf(reloaded);

    expect(after).toEqual(before);
    expect(after).not.toBe(before);
    expect(after.hardpoints).not.toBe(before.hardpoints);
  });

  it('negative control rejects both common mismatched stage selectors', () => {
    const nonterminal = input([], 2);
    const correctNonterminal = shipVisualStateOf(nonterminal);
    const chapterNumberMistake: ShipVisualState = {
      ...correctNonterminal,
      chassisStage: 2,
    };
    expect(agreesWithTravel(correctNonterminal, nonterminal)).toBe(true);
    expect(agreesWithTravel(chapterNumberMistake, nonterminal)).toBe(false);

    const veteran = input([], ASC_CHAPTER_COUNT);
    const correctVeteran = shipVisualStateOf(veteran);
    const itemsOnlyMistake: ShipVisualState = {
      ...correctVeteran,
      chassisStage: 0,
    };
    expect(agreesWithTravel(correctVeteran, veteran)).toBe(true);
    expect(agreesWithTravel(itemsOnlyMistake, veteran)).toBe(false);
  });
});
