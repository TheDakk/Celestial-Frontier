import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { makeGenome } from '@cf/domain-genome';
import { hashInt } from '@cf/domain-rand';
import {
  ABILITY_THEMES,
  PLAYER_SEED,
  PRIME_SIGNATURES_V1,
  STAT_HUES,
  STAT_NAMES,
  abilityOf,
  abilityTheme,
  battleStats,
  decodeCreature,
  encodeCreature,
  levelOf,
  normGenome,
  projectCreatureInnateArts,
  projectOrdinaryGuardianV1,
  projectTitanPlacementFactsV1,
  runDuel,
} from '@cf/domain-combatcore';

/* fixtures/current/combat.json was recorded from the unmodified current game by
   tools/record-fixtures.mjs (the combat recorder). It holds each input beside its outputs, and
   this file rebuilds every output from the recorded input with the same calls the recorder made. */
interface GenomeInput { seed: number; kingdom: string; heat: number; xp: number; extra: Record<string, unknown> }
interface CombatFixture {
  constants: Record<string, unknown>;
  levels: number[];
  levelEdges: Array<{ input: { xp?: unknown; nan?: true }; level: number }>;
  stats: Array<{ input: GenomeInput } & Record<string, unknown>>;
  duels: Array<{ a: GenomeInput; b: GenomeInput; withStats: boolean; result: Record<string, unknown> }>;
  codes: Array<{ input: GenomeInput; name: string; champ: boolean } & Record<string, unknown>>;
  badCodes: Array<{ code: string; decoded: unknown }>;
  guardians: Record<string, { planetSeed: number; worldType: string } & Record<string, unknown>>;
  titans: { mirrored: Array<TitanBuild & TitanAt>; real: Array<{ planetSeed: number; worldType: string; regionIndex: number; signatureId: string; defender: TitanBuild & { kind: string; signatureId: string } }> };
}
interface TitanBuild { battleGenome: Record<string, unknown>; capturableGenome: Record<string, unknown>; power: number }
interface TitanAt { planetSeed: number; signatureId: string; regionIndex: number }

const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/combat.json', import.meta.url), 'utf8'),
) as CombatFixture;

/** The fixture is JSON, which cannot hold undefined: compare both sides through the same round trip. */
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');
const genomeOf = (input: GenomeInput) =>
  Object.assign(makeGenome(input.seed, input.kingdom, input.heat), { xp: input.xp }, structuredClone(input.extra));
const attempt = (fn: () => unknown): unknown => {
  try { return fn(); } catch (error) { return { throws: String((error as Error).message) }; }
};

function recordCombat(source: CombatFixture) {
  const stats = source.stats.map(({ input }) => {
    const g = genomeOf(input);
    return {
      input,
      battleStats: battleStats(g),
      abilityOf: abilityOf(g),
      abilityTheme: abilityTheme(g),
      levelOf: levelOf(g),
      innateArts: attempt(() => projectCreatureInnateArts(g)),
    };
  });
  const duels = source.duels.map(({ a, b, withStats }) => {
    const ga = genomeOf(a);
    const gb = genomeOf(b);
    const r = runDuel(
      { name: 'A', genome: ga, ...(withStats ? { stats: battleStats(ga) } : {}) },
      { name: 'B', genome: gb, ...(withStats ? { stats: battleStats(gb) } : {}) },
    );
    return { a, b, withStats, result: { winner: r.winner, hpA: r.hpA, hpB: r.hpB, maxA: r.maxA, maxB: r.maxB, turnA0: r.turnA0, log: r.log } };
  });
  const codes = source.codes.map(({ input, name, champ }) => {
    const g = genomeOf(input);
    const code = encodeCreature({ name, genome: g }, champ);
    return { input, name, champ, code, decoded: decodeCreature(code), normalized: normGenome(g) };
  });
  const badCodes = source.badCodes.map(({ code }) => ({ code, decoded: decodeCreature(code) }));
  const guardians = Object.fromEntries(Object.entries(source.guardians).map(([name, { planetSeed, worldType }]) => {
    const ordinary = projectOrdinaryGuardianV1(planetSeed);
    const regions = [0, 1, 2, 3, 4, 5];
    return [name, {
      planetSeed,
      worldType,
      ordinary,
      titanPlacement: regions.map((regionIndex) => projectTitanPlacementFactsV1({ planetSeed, worldType, regionIndex, claimedSignatureIds: [] })),
      regionBattleStats: regions.map((r) => battleStats(r > 0 ? { ...ordinary!.genome, _mult: 1 + r * 0.14 } : { ...ordinary!.genome })),
    }];
  }));
  return plain({
    constants: { STAT_NAMES, STAT_HUES, ABILITY_THEMES, PLAYER_SEED },
    levels: Array.from({ length: 487 }, (_, xp) => levelOf({ xp })),
    levelEdges: source.levelEdges.map(({ input }) => ({
      input,
      level: levelOf(input.nan ? { xp: NaN } : 'xp' in input ? { xp: input.xp } : {}),
    })),
    stats,
    duels,
    codes,
    badCodes,
    guardians,
  }) as CombatFixture;
}

const actual = recordCombat(fixture);

/** Exact-mirror duel rows (every 20th) whose two combatants differ. */
const mirrorMismatches = (f: CombatFixture): number[] =>
  f.duels.flatMap((row, i) => (i % 20 === 0 && JSON.stringify(row.a) !== JSON.stringify(row.b) ? [i] : []));

/* The Titan battle genomes were recorded from SOURCE (the `real` rows are its own titanDefender
   output; the recorder checked every one against the `mirrored` build). Without minting an address,
   the package must give each recorded genome the recorded power, strip exactly the battlefield
   modifiers for the capturable genome, and select each real Titan at its recorded seed. */
function titanMismatches(f: CombatFixture): string[] {
  const out: string[] = [];
  const check = (label: string, build: TitanBuild) => {
    if (battleStats(build.battleGenome).total !== build.power) out.push(`${label}: power`);
    const { _mult, _wf, ...portable } = build.battleGenome;
    if (JSON.stringify(portable) !== JSON.stringify(build.capturableGenome)) out.push(`${label}: capturable`);
  };
  f.titans.mirrored.forEach((row, i) => check(`mirrored ${i}`, row));
  f.titans.real.forEach((row, i) => {
    check(`real ${i}`, row.defender);
    if (row.defender.kind !== 'titan' || row.defender.signatureId !== row.signatureId) out.push(`real ${i}: kind`);
    const facts = projectTitanPlacementFactsV1({ planetSeed: row.planetSeed, worldType: row.worldType, regionIndex: row.regionIndex, claimedSignatureIds: [] });
    if (facts.find((fact) => fact.selected)?.signatureId !== row.signatureId) out.push(`real ${i}: selected`);
  });
  return out;
}

/* The Titan build, step by step as the recorder's `titanBuild` (tools/record-fixtures.mjs) makes it: every
   recorded row, mirrored and real, must equal this build from its own (planetSeed, signature, region). */
function titanBuild(planetSeed: number, signatureId: string, regionIndex: number): TitanBuild {
  const definition = PRIME_SIGNATURES_V1.find((row) => row.id === signatureId)!;
  const heat = signatureId === 'flame' ? 2 : (signatureId === 'mind' || signatureId === 'void') ? 0 : 1;
  const g: Record<string, unknown> = makeGenome(hashInt(planetSeed >>> 0, 0x7174, 0x99) >>> 0, 'fauna', heat);
  Object.assign(g, { size: 5, lumin: true, wild: 1, apex: 14, _titan: signatureId, color: definition.titanColorIndex });
  if (definition.battlefieldWorldField !== null) g._wf = definition.battlefieldWorldField;
  g._mult = 1.15 + regionIndex * 0.03;
  const battleGenome = JSON.parse(JSON.stringify(g)) as Record<string, unknown>;
  const capturableGenome = JSON.parse(JSON.stringify(g)) as Record<string, unknown>;
  delete capturableGenome._mult;
  delete capturableGenome._wf;
  return { battleGenome, capturableGenome, power: battleStats(battleGenome).total };
}

/** Rows whose recorded genomes or power differ from the build. */
function titanBuildMismatches(f: CombatFixture): string[] {
  const out: string[] = [];
  const same = (label: string, at: TitanAt, recorded: TitanBuild) => {
    const { battleGenome, capturableGenome, power } = recorded;
    if (JSON.stringify(titanBuild(at.planetSeed, at.signatureId, at.regionIndex)) !== JSON.stringify({ battleGenome, capturableGenome, power })) out.push(label);
  };
  f.titans.mirrored.forEach((row, i) => same(`mirrored ${i}`, row, row));
  f.titans.real.forEach((row, i) => same(`real ${i}`, row, row.defender));
  return out;
}

describe('@cf/domain-combatcore — pinned against the current game', () => {
  it('has the recorded input counts', () => {
    expect([fixture.stats.length, fixture.duels.length, fixture.codes.length, fixture.levels.length])
      .toEqual([200, 200, 100, 487]);
    expect(new Set(fixture.stats.map((row) => row.input.kingdom))).toEqual(new Set(['fauna', 'flora', 'fungi', 'microbe']));
    expect(Object.keys(fixture.guardians).sort()).toEqual(['kaum', 'osum']);
    expect(fixture.titans.mirrored).toHaveLength(2 * 9 * 6);
    expect(new Set(fixture.titans.real.map((row) => row.signatureId)).size).toBe(9);
  });
  it('the ten exact-mirror duels have identical combatants', () => {
    expect(mirrorMismatches(fixture)).toEqual([]);
  });
  it('the constant tables and PLAYER_SEED are as in the current game', () => {
    expect(actual.constants).toEqual(fixture.constants);
  });
  it('levelOf for every xp from 0 to 486 is as in the current game', () => {
    expect(actual.levels).toEqual(fixture.levels);
  });
  it('levelOf caps at 9 and coerces non-integer, negative, string and missing xp as in the current game', () => {
    expect(fixture.levelEdges.map((row) => row.level)).toContain(9);
    expect(actual.levelEdges).toEqual(fixture.levelEdges);
  });
  it('battleStats, abilityOf, abilityTheme, levelOf and the innate arts of 200 genomes are as in the current game', () => {
    expect(actual.stats).toEqual(fixture.stats);
  });
  it('200 duels end with the recorded winner, hit points and full log', () => {
    expect(actual.duels).toEqual(fixture.duels);
  });
  it('100 share codes encode, decode and normalise as in the current game, and refused codes stay refused', () => {
    expect(actual.codes).toEqual(fixture.codes);
    expect(actual.badCodes).toEqual(fixture.badCodes);
  });
  it('the Kaum and Osum Guardians, Titan placement and region-scaled power are as in the current game', () => {
    expect(actual.guardians).toEqual(fixture.guardians);
  });
  it('every recorded Titan defender has the recorded power, capturable genome and placement', () => {
    expect(titanMismatches(fixture)).toEqual([]);
  });
  it('every recorded Titan defender, mirrored and real, equals the Titan build from its planet, signature and region', () => {
    expect(fixture.titans.real.length).toBeGreaterThan(9);
    expect(titanBuildMismatches(fixture)).toEqual([]);
  });
  it('notices one changed recorded value in each section (negative control)', () => {
    const changes: Array<[string, (f: CombatFixture) => void]> = [
      ['constants', (f) => { (f.constants.STAT_NAMES as string[])[0] += '!'; }],
      ['levels', (f) => { f.levels[54] = f.levels[54]! + 1; }],
      ['levelEdges', (f) => { f.levelEdges[0]!.level += 1; }],
      ['stats', (f) => { (f.stats[0]!.battleStats as { vit: number }).vit += 1; }],
      ['duels', (f) => { f.duels[0]!.result.hpA = (f.duels[0]!.result.hpA as number) + 1; }],
      ['codes', (f) => { f.codes[0]!.code += 'A'; }],
      ['badCodes', (f) => { f.badCodes[0]!.decoded = {}; }],
      ['guardians', (f) => { (f.guardians.kaum!.ordinary as { tier: number }).tier += 1; }],
    ];
    for (const [section, change] of changes) {
      const mutated = structuredClone(fixture);
      change(mutated);
      const key = section as keyof CombatFixture;
      expect(actual[key], section).toEqual(fixture[key]);
      expect(actual[key], section).not.toEqual(mutated[key]);
    }
    const titan = structuredClone(fixture);
    titan.titans.real[0]!.defender.power += 1;
    titan.titans.mirrored[0]!.capturableGenome._wf = 'lava';
    expect(titanMismatches(titan)).toEqual(['mirrored 0: capturable', 'real 0: power']);
    const build = structuredClone(fixture);
    build.titans.mirrored[1]!.battleGenome.apex = 15;
    build.titans.real[2]!.regionIndex += 1;
    expect(titanBuildMismatches(build)).toEqual(['mirrored 1', 'real 2']);
    const mirror = structuredClone(fixture);
    mirror.duels[20]!.b.extra._wf = 'ice';
    expect(mirrorMismatches(mirror)).toEqual([20]);
  });
});
