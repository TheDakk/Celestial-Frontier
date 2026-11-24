import { describe, expect, it } from 'vitest';
import { parseCatalogueText, partId } from '@cf/art-format';
import type { Catalogue, SlotName } from '@cf/art-format';
import { bodyOf, buildRecipe, type Recipe } from '../src/recipe';
import { identityKey, LIFE_STATE_KEYS } from '../src/streams';

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\ncolour 2 eeeeee\ncolour 3 00ff00\ncolour 4 111111\nramp r 1 2 3 4\noutline 0\neye 1\neyeHighlight 2\nglow 3\n';
const partText = (id: string): string => `part ${id}\nframe rest anchor=0,0\n1\n`;
const SCAFFOLD = 'scaffold quadruped/sturdy/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n';
const q = (slot: SlotName, kind: string, variant: number): string => partId('quadruped', slot, kind, 'medium', variant);
const ids: string[] = [];
for (let v = 0; v < 3; v++) ids.push(q('torso', 'sturdy', v), q('head', 'h3', v));
for (let v = 0; v < 2; v++) ids.push(q('tail', 't2', v), q('farLimbs', 'leg', v), q('nearLimbs', 'leg', v));
ids.push(q('eyes', 'eye', 0));
const catalogue: Catalogue = parseCatalogueText(HEADER + ids.map(partText).join('\n') + '\n' + SCAFFOLD);

// A bred creature as the current game stores it: genes plus set-once lineage metadata.
const genome: Readonly<Record<string, unknown>> = {
  seed: 912345, kingdom: 'fauna', body: 0, loco: 0, size: 2, head: 3, tail: 2, limbs: 4, eyes: 0, color: 3, accent: 5,
  pattern: 2, lumin: false, gen: 2, parents: [11, 22], _earthBlend: 'Tiger', _anchorVal: 0.63,
};
const lineage = ['11', '22'];

// Two distinct values for every excluded key, shaped as the current game writes them.
const LIFE_VALUES: Readonly<Record<string, readonly [unknown, unknown]>> = {
  _mult: [1.15, 1.42],
  _wf: ['lava', 'ice'],
  assignment: [{ kind: 'mission', missionId: 'm-1' }, { kind: 'recovery', readyAtActivePlayMs: 480000 }],
  bond: [
    { level: 1, memories: [], preferredRole: null, worldsSurvived: 0, guardianVictories: 0, mementoIds: [] },
    { level: 3, memories: [{ id: 'fed', kind: 'care', worldKey: null, atActivePlayMs: 9 }], preferredRole: 'guard', worldsSurvived: 2, guardianVictories: 1, mementoIds: ['a'] },
  ],
  brood: [1, 7],
  fed: [0, 120],
  hurt: [0, 0.35],
  xp: [2, 486],
};

const withKey = (key: string, value: unknown): Record<string, unknown> => ({ ...genome, [key]: value });

describe('LIFE_STATE_KEYS', () => {
  it('is frozen, sorted and the exact list for renderer version 1', () => {
    expect(Object.isFrozen(LIFE_STATE_KEYS)).toBe(true);
    expect([...LIFE_STATE_KEYS]).toEqual([...LIFE_STATE_KEYS].sort());
    expect([...LIFE_STATE_KEYS]).toEqual(['_mult', '_wf', 'assignment', 'bond', 'brood', 'fed', 'hurt', 'xp']);
    expect(Object.keys(LIFE_VALUES).sort()).toEqual([...LIFE_STATE_KEYS]);
  });

  // Iterates the expected keys, not the exported list, so dropping a key from the list fails its own tests.
  for (const key of Object.keys(LIFE_VALUES).sort()) {
    describe(`life-state key ${key}`, () => {
      const [first, second] = LIFE_VALUES[key]!;
      const plainKey = identityKey(genome, lineage);
      const plainRecipe = buildRecipe(genome, lineage, catalogue);

      it('adding it leaves the identity and the recipe unchanged', () => {
        expect(identityKey(withKey(key, first), lineage)).toBe(plainKey);
        expect(buildRecipe(withKey(key, first), lineage, catalogue)).toEqual(plainRecipe);
      });

      it('changing it leaves the identity and the recipe unchanged', () => {
        expect(identityKey(withKey(key, second), lineage)).toBe(identityKey(withKey(key, first), lineage));
        expect(buildRecipe(withKey(key, second), lineage, catalogue)).toEqual(buildRecipe(withKey(key, first), lineage, catalogue));
      });

      it('removing it leaves the identity and the recipe unchanged', () => {
        const { [key]: _removed, ...without } = withKey(key, second);
        expect(identityKey(without, lineage)).toBe(identityKey(withKey(key, second), lineage));
        expect(buildRecipe(without, lineage, catalogue)).toEqual(buildRecipe(withKey(key, second), lineage, catalogue));
      });
    });
  }

  it('skips only top-level keys: a life-state name nested deeper still counts', () => {
    expect(identityKey({ ...genome, _src: { xp: 0 } }, lineage)).not.toBe(identityKey({ ...genome, _src: { xp: 1 } }, lineage));
  });
});

describe('every other key is part of the identity', () => {
  // [key, a value different from the base genome's (or a value for a key the base lacks)]
  const changes: ReadonlyArray<readonly [string, unknown]> = [
    ['seed', 912346], ['kingdom', 'flora'], ['body', 1], ['head', 4], ['color', 4], ['eyes', 1], ['lumin', true],
    ['gen', 3], ['parents', [22, 11]], ['par', 9], ['apex', 12], ['ep', 3], ['wild', 1], ['x', 1], ['aq', 1],
    ['_anchorVal', 0.7], ['_earthBlend', 'Lion'], ['_earthName', 'Tiger'], ['_cradle', 1], ['_titan', 'flame'],
    ['_src', { color: 1 }], ['_pa', 'Rex'], ['evolved', true], ['exhibit', true], ['nickname', 'Rex'], ['inventedKey', 0],
  ];
  it('keeps an own __proto__ key as data, as before the life-state filter', () => {
    expect(identityKey(JSON.parse('{"__proto__":1,"seed":1}') as Record<string, unknown>, []))
      .toBe('["object",[["__proto__",["number","1"]],["seed",["number","1"]]]]|[]');
  });
  for (const [key, value] of changes) {
    it(`changing ${key} changes identityKey`, () => {
      expect(identityKey(withKey(key, value), lineage)).not.toBe(identityKey(genome, lineage));
    });
  }
});

describe('the bulk step', () => {
  const nonTorso = (r: Recipe): unknown => r.parts.filter((p) => p.slot !== 'torso');

  it('the bulk step changes only the torso', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const g = { ...genome, seed, pattern: 2 };
      const [lean, normal, heavy] = ([0, 1, 2] as const).map((bulk) => buildRecipe(g, lineage, catalogue, { bulk }));
      for (const r of [lean!, heavy!]) {
        expect([r.marking, r.shift, r.ramps, nonTorso(r)], `seed ${seed}`).toEqual([normal!.marking, normal!.shift, normal!.ramps, nonTorso(normal!)]);
      }
      expect([lean!, normal!, heavy!].map((r) => r.parts.find((p) => p.slot === 'torso')!.partId), `seed ${seed}`)
        .toEqual([0, 1, 2].map((v) => q('torso', 'sturdy', v)));
    }
  });

  it('fed and hurt in the genome do not change the bulk (only the caller does)', () => {
    for (const bulk of [0, 1, 2] as const) {
      const plain = buildRecipe(genome, lineage, catalogue, { bulk });
      for (const [fed, hurt] of [[0, 0], [120, 0], [0, 0.35], [120, 0.35]] as const) {
        expect(buildRecipe({ ...genome, fed, hurt }, lineage, catalogue, { bulk }), `bulk ${bulk} fed ${fed} hurt ${hurt}`).toEqual(plain);
      }
    }
    expect(buildRecipe({ ...genome, fed: 120, hurt: 0.35 }, lineage, catalogue)).toEqual(buildRecipe(genome, lineage, catalogue, { bulk: 1 }));
  });
});

describe('the shape of a body with more than one', () => {
  it('the shape survives a save, a load and every life-state key', () => {
    for (const body of [1, 3, 4, 5, 15]) {
      const shapes = new Set<string>();
      let moved = 0;
      for (let seed = 1; seed <= 50; seed++) {
        const g: Record<string, unknown> = { ...genome, body, seed };
        const b = bodyOf(g);
        expect(bodyOf(JSON.parse(JSON.stringify(g)) as Record<string, unknown>), `body ${body} seed ${seed} saved`).toEqual(b);
        expect(bodyOf({ ...g, xp: 9, hurt: 3, fed: 2, brood: 1, bond: 4 }), `body ${body} seed ${seed} life state`).toEqual(b);
        shapes.add(b.torso);
        if (bodyOf({ ...g, seed: seed + 1 }).torso !== b.torso) moved++;
      }
      // Planted fault: a shape that does not follow the seed would pass the two checks above; across these seeds
      // a change of seed changes at least one shape.
      expect(moved, `body ${body}`).toBeGreaterThan(0);
      expect(shapes.size, `body ${body}`).toBeGreaterThan(1);
    }
  });
});
