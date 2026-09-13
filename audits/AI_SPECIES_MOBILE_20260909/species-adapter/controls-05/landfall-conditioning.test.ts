import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { speciesVisualKey } from '@cf/art/species-identity';
import { buildBiomeVistaRenderRequestV1 } from '../apps/game/src/biome-vista-surface.js';
import { canonicalWorldRoster, isCanonicalWorldRoster } from '../apps/game/src/world-roster.js';
import { buildLandfallAppearanceSnapshotV1, type LandfallAppearanceSnapshotV1 } from '../apps/game/src/landfall-appearance-snapshot.js';
import { buildCanonicalLandfallConditioningV1, buildLandfallConditioningV1, buildCanonicalLandfallConditioningV2, buildLandfallConditioningV2,
  type LandfallConditioningResultV1 } from '../apps/game/src/landfall-conditioning.js';

beforeAll(() => installCaptureHooks());
function fixture(seed = 133, epoch = 0) {
  const star = { seed: 424242, x: 560, y: 170 };
  const address = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star, planet: { seed } });
  const planet = systemScene(star.seed).planets.find(row => row.seed === seed);
  if (!address.ok || !planet) throw Error('Missing canonical fixture');
  const built = canonicalWorldRoster(address.address, epoch);
  if (!built.ok) throw Error('Missing canonical roster');
  const request = buildBiomeVistaRenderRequestV1(planet, star.seed, built.roster.worldKey,
    systemFor(star.seed) as unknown as Record<string, unknown>, built.roster);
  return { request, roster: built.roster };
}
function snapshot() {
  const source = fixture();
  const result = buildLandfallAppearanceSnapshotV1(source.request, source.roster);
  if (!result.ok) throw Error('Missing admitted snapshot');
  return result.snapshot;
}
function accepted(value: LandfallConditioningResultV1) {
  expect(value.ok).toBe(true);
  if (!value.ok) throw Error(value.reason);
  return value;
}
function mutable(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
function objects(value: unknown, found = new Set<object>()): Set<object> {
  if (value !== null && typeof value === 'object' && !found.has(value)) {
    found.add(value);for (const child of Object.values(value)) objects(child, found);
  }
  return found;
}

describe('source-driven Earth landfall conditioning; no model or image acceptance', () => {
  it('compiles all six exact residents from the actual game authority and retained full19 source', () => {
    const source = fixture(), before = JSON.stringify(source);
    const result = accepted(buildCanonicalLandfallConditioningV1(source.request, source.roster));
    const retained = JSON.parse(readFileSync(new URL('../../../audits/AV_EARTH_LAYERED_SCENE_20260908/canonical-earth.json', import.meta.url), 'utf8')) as {
      roster: { view: { all: unknown[]; total: number } };
    };
    expect(result.recipe.residents.map(row => row.name)).toEqual(['Civet', 'Persimmon', 'Platypus', 'Frog', "Devil's Club", 'Cranberry']);
    expect(result.recipe.sourceSnapshot.roster.view.all).toEqual(retained.roster.view.all);
    expect(result.recipe.sourceSnapshot.roster.view.total).toBe(19);
    expect(result.recipe.sourceSnapshot.roster.ecologyEpoch).toBe(0);
    expect(JSON.stringify(source)).toBe(before);
    expect(result.recipe.prompt).toContain('rainy temperate riverbank');
    expect(result.recipe.prompt).toContain('Daylight');
    for (const row of result.recipe.residents) expect(result.recipe.prompt.split(`One ${row.name} at `)).toHaveLength(2);
  });

  it('uses full species identity rather than seed/name or a reduced anatomy record', () => {
    const input = snapshot(), result = accepted(buildLandfallConditioningV1(input));
    for (let index = 0; index < result.recipe.residents.length; index++) {
      const row = result.recipe.residents[index]!, source = input.displayPlan.residents[index]!;
      expect(row.genome).toEqual(source.genome);
      expect(Object.keys(row.genome)).toHaveLength(29);
      expect(row.identityKey).toBe(speciesVisualKey(JSON.parse(JSON.stringify(source.genome)) as Record<string, unknown>));
      expect(row.identityKey).not.toBe(String(source.genome.seed));
    }
    expect(isCanonicalWorldRoster(result.recipe.sourceSnapshot.roster)).toBe(false);
  });

  it('preserves accepted placements and left-facing Platypus without deriving size from random Earth genes', () => {
    const result = accepted(buildLandfallConditioningV1(snapshot()));
    expect(result.recipe.residents.map(row => [row.name, row.placement])).toEqual([
      ['Civet', { x: .72, groundY: .77, width: .15, flip: false }],
      ['Persimmon', { x: .13, groundY: .78, width: .21, flip: false }],
      ['Platypus', { x: .43, groundY: .86, width: .2, flip: true }],
      ['Frog', { x: .25, groundY: .87, width: .07, flip: false }],
      ["Devil's Club", { x: .87, groundY: .88, width: .16, flip: false }],
      ['Cranberry', { x: .34, groundY: .9, width: .11, flip: false }],
    ]);
    expect(result.recipe.prompt).toContain('One Platypus at 43% across, base 86% down, 20% wide, facing left:');
  });

  it('emits defining Earth anatomy/botany and explicit substitution exclusions', () => {
    const { recipe } = accepted(buildLandfallConditioningV1(snapshot()));
    const requirements = (name: string) => recipe.residents.find(row => row.name === name)!.namedRule.diagnostics.map(row => row.required).join(' ');
    expect(requirements('Platypus')).toMatch(/rubbery duck bill/);
    expect(requirements('Platypus')).toMatch(/webbed clawed feet/);
    expect(requirements('Platypus')).toMatch(/flat blunt paddle tail/);
    expect(requirements('Civet')).toMatch(/one pointed muzzle.*four short legs.*one long ringed tail/);
    expect(requirements('Frog')).toMatch(/two domed eyes.*long folded hind legs/);
    expect(requirements('Persimmon')).toMatch(/branching woody tree.*simple oval.*four-lobed calyx/);
    expect(requirements('Cranberry')).toMatch(/low creeping runners.*small simple oval.*close to the ground/);
    expect(requirements("Devil's Club")).toMatch(/spiny canes.*palmate lobed.*terminal red berry cones/);
    expect(recipe.negativePrompt).toContain('Platypus: rodent muzzle');
    expect(recipe.negativePrompt).toContain('Persimmon: pinnate compound leaves');
    expect(recipe.negativePrompt).toContain('Cranberry: tall woody bush');
  });

  it('does not turn raw Earth limb/eye/color genes into the named body plan', () => {
    const { recipe } = accepted(buildLandfallConditioningV1(snapshot()));
    const platypus = recipe.residents.find(row => row.name === 'Platypus')!;
    expect(platypus.genome.limbs).toBe(0);expect(platypus.genome.eyes).toBe(0);
    expect(platypus.rawGenomicVisualPolicy).toBe('preserve-identity-use-named-earth-anatomy');
    expect(recipe.prompt).toContain('four short limbs with webbed clawed feet');
    expect(recipe.prompt).not.toContain('no eyes');
    expect(recipe.residents.every(row => row.namedRule.sourceOwners.length > 0)).toBe(true);
  });

  it('requires a reviewed exact Platypus image in slot1 without declaring references or art accepted', () => {
    const { recipe } = accepted(buildLandfallConditioningV1(snapshot()));
    const platypus = recipe.residents.find(row => row.name === 'Platypus')!;
    expect(recipe.referenceRequirements).toHaveLength(1);
    expect(recipe.referenceRequirements[0]).toMatchObject({ imageIndex: 1, name: 'Platypus',
      subjectIdentityKey: platypus.identityKey, fullGenome: platypus.genome,
      acceptance: 'reviewed-exact-identity-reference-required' });
    expect(recipe.referenceRequirements[0]!.requiredFeatures.join(' ')).toContain('duck bill');
    expect(recipe.referenceStatus).toBe('unresolved');expect(recipe.qualityAccepted).toBe(false);
    expect(recipe.fidelityGuarantee).toBe('none-prose-and-reference-require-outcome-review');
    expect(recipe.prompt).toContain('Image 1 guides ONLY the Platypus');
    expect(recipe.prompt).toContain('exactly three separate animals');
    expect(recipe.prompt).toContain('Do not give the Civet a bill');
  });

  it('preserves deterministic canonical recipe bytes across normal/null-prototype transport', () => {
    const source = snapshot();
    const first = accepted(buildLandfallConditioningV1(source));
    const second = accepted(buildLandfallConditioningV1(JSON.parse(JSON.stringify(source))));
    expect(second.canonicalJson).toBe(first.canonicalJson);expect(second.recipeKey).toBe(first.recipeKey);
    expect(first.recipeKey).toBe(`lfc1:${first.canonicalJson}`);
    expect(first.snapshotKey).toBe(`lfas1:${JSON.stringify(source)}`);
    expect(JSON.parse(first.canonicalJson)).toEqual(first.recipe);
    expect(JSON.parse(first.canonicalJson).sourceSnapshot.roster.view.all).toHaveLength(19);
  });

  it('deep-freezes detached output while preserving source data untouched', () => {
    const input = snapshot(), before = JSON.stringify(input);
    const result = accepted(buildLandfallConditioningV1(input));
    const sourceObjects = objects(input);
    for (const value of objects(result)) { expect(Object.isFrozen(value)).toBe(true);expect(sourceObjects.has(value)).toBe(false); }
    expect(JSON.stringify(input)).toBe(before);
    expect(() => Object.defineProperty(result.recipe.residents[0]!.genome, 'seed', { value: 1 })).toThrow();
  });

  it('refuses schema or recipe versions it does not own', () => {
    for (const field of ['schema', 'recipeId']) {
      const data = mutable(snapshot());data[field] = 'unsupported-v2';
      expect(buildLandfallConditioningV1(data)).toEqual({ ok: false, reason: 'unsupported-schema' });
    }
  });

  it('rejects all changed resident genomes, even with preserved seed/name/fingerprints', () => {
    const original = snapshot();
    for (let index = 0; index < 6; index++) {
      const data = mutable(original);
      const plan = data.displayPlan as { residents: Array<{ genome: Record<string, unknown> }> };
      plan.residents[index]!.genome.heat = 2;
      expect(buildLandfallConditioningV1(data)).toEqual({ ok: false, reason: 'unsupported-snapshot' });
    }
  });

  it('rejects nondisplayed full-roster changes, order changes, hidden omissions and lineage additions', () => {
    const changes: Array<(snapshot: Record<string, unknown>) => void> = [
      data => { const roster = data.roster as { view: { all: Array<Record<string, unknown>> } };roster.view.all[3]!.heat = 2; },
      data => { const roster = data.roster as { view: { all: unknown[] } };roster.view.all.reverse(); },
      data => { const roster = data.roster as { view: { all: unknown[]; total: number } };roster.view.all.length = 8;roster.view.total = 8; },
      data => { const plan = data.displayPlan as { residents: Array<{ genome: Record<string, unknown> }> };plan.residents[0]!.genome.parents = ['new-lineage']; },
    ];
    for (const change of changes) { const data = mutable(snapshot());change(data);expect(buildLandfallConditioningV1(data)).toEqual({ ok: false, reason: 'unsupported-snapshot' }); }
  });

  it('refuses unknown names or taxonomy rather than substituting generic species', () => {
    for (const [key, value] of [['name', 'Unknown mammal'], ['family', 'bird'], ['kingdom', 'fungi']]) {
      const data = mutable(snapshot());const plan = data.displayPlan as { residents: Array<Record<string, unknown>> };
      plan.residents[0]![key!] = value;
      expect(buildLandfallConditioningV1(data)).toEqual({ ok: false, reason: 'unsupported-species' });
    }
  });

  it('refuses changed placement/weather/environment and unsupported envelope data', () => {
    const changes: Array<(snapshot: Record<string, unknown>) => void> = [
      data => { (data.displayPlan as { residents: Array<Record<string, unknown>> }).residents[0]!.x = .5; },
      data => { (data.request as { options: Record<string, unknown> }).options.wx = null; },
      data => { (data.roster as Record<string, unknown>).environmentFingerprint = 'changed'; },
      data => { data.qualityAccepted = true; }, data => { data.extra = 'unowned'; },
      data => { ((data.roster as Record<string, unknown>).view as Record<string, unknown>).preview = []; },
    ];
    for (const change of changes) { const data = mutable(snapshot());change(data);expect(buildLandfallConditioningV1(data)).toEqual({ ok: false, reason: 'unsupported-snapshot' }); }
  });

  it('never upgrades transported data to live game authority or widens world/epoch support', () => {
    const input = snapshot();
    expect(buildCanonicalLandfallConditioningV1(input.request, input.roster)).toEqual({ ok: false, reason: 'unproven-roster' });
    for (const source of [fixture(134), fixture(133, 1)])
      expect(buildCanonicalLandfallConditioningV1(source.request, source.roster)).toEqual({ ok: false, reason: 'unsupported-snapshot' });
  });

  it('does not invoke hostile input getters/serialization hooks and refuses bounded-data violations', () => {
    const getter = vi.fn(() => 'cf.art.landfall-snapshot.v1'), hook = vi.fn();
    const accessor = mutable(snapshot());Object.defineProperty(accessor, 'schema', { get: getter, enumerable: true });
    const hooked = mutable(snapshot());hooked.toJSON = hook;
    const revoked = Proxy.revocable(mutable(snapshot()), {});revoked.revoke();
    const oversized = mutable(snapshot());oversized.extra = 'x'.repeat(4097);
    for (const input of [accessor, hooked, revoked.proxy, oversized, null, undefined])
      expect(buildLandfallConditioningV1(input)).toEqual({ ok: false, reason: 'unsupported-snapshot' });
    expect(getter).not.toHaveBeenCalled();expect(hook).not.toHaveBeenCalled();
  });

  it('compilation consults no ambient random or wall clock', () => {
    const source: LandfallAppearanceSnapshotV1 = snapshot();
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('ambient random'); });
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('wall clock'); });
    try {
      const first = buildLandfallConditioningV1(source), second = buildLandfallConditioningV1(source);
      expect(first.ok).toBe(true);expect(second).toEqual(first);
      expect(random).not.toHaveBeenCalled();expect(clock).not.toHaveBeenCalled();
    } finally { random.mockRestore();clock.mockRestore(); }
  });
});


describe('ordered individual species conditioning V2', () => {
  it('preserves the exact historical V1 bytes and shares its full nineteen-species snapshot', () => {
    const retained = JSON.parse(readFileSync(new URL('../../../audits/AI_GAME_INTEGRATION_20260909/native-game-02/actual-landfall-recipe.json', import.meta.url), 'utf8'));
    const source = fixture(), v1 = accepted(buildCanonicalLandfallConditioningV1(source.request, source.roster));
    expect(v1.canonicalJson).toBe(JSON.stringify(retained.conditioning));
    const v2 = buildCanonicalLandfallConditioningV2(source.request, source.roster);
    if (!v2.ok) throw Error(v2.reason);
    expect(v2.recipe.schema).toBe('cf.art.landfall-conditioning.v2');
    expect(v2.snapshotKey).toBe(v1.snapshotKey);
    expect(v2.recipe.sourceSnapshot).toEqual(v1.recipe.sourceSnapshot);
    expect(v2.recipe.residents).toEqual(v1.recipe.residents);
    expect(v2.recipeKey).toBe('lfc2:' + v2.canonicalJson);
    expect(buildLandfallConditioningV2(JSON.parse(JSON.stringify(snapshot())))).toEqual(v2);
  });

  it('binds each canonical full identity and its diagnostics to one stable image slot', () => {
    const result = buildLandfallConditioningV2(snapshot()); if (!result.ok) throw Error(result.reason);
    expect(result.recipe.referenceRequirements.map(row => [row.imageIndex, row.name])).toEqual([
      [1, 'Civet'], [2, 'Persimmon'], [3, 'Platypus'], [4, 'Frog'], [5, "Devil's Club"], [6, 'Cranberry'],
    ]);
    result.recipe.referenceRequirements.forEach((row, index) => {
      const resident = result.recipe.residents[index]!;
      expect(row.subjectIdentityKey).toBe(speciesVisualKey(resident.genome));
      expect(row.fullGenome).toEqual(resident.genome);
      expect(row.requiredFeatures).toEqual(resident.namedRule.diagnostics.map(diagnostic => diagnostic.required));
      expect(result.recipe.prompt).toContain(`Image ${index + 1} guides ONLY ${resident.name}.`);
    });
    expect(objects(result).size).toBeGreaterThan(19);
    for (const object of objects(result)) expect(Object.isFrozen(object)).toBe(true);
    expect(result.recipe.qualityAccepted).toBe(false);
    expect(result.recipe.referenceStatus).toBe('unresolved');
    expect(result.recipe.fidelityGuarantee).toBe('none-prose-and-reference-require-outcome-review');
  });

  it('refuses partial, reordered, substituted or noncanonical snapshots without admitting a future world', () => {
    const source = fixture(134);
    expect(buildCanonicalLandfallConditioningV2(source.request, source.roster).ok).toBe(false);
    for (const mutate of [
      (rows: Array<Record<string, unknown>>) => rows.pop(),
      (rows: Array<Record<string, unknown>>) => rows.reverse(),
      (rows: Array<Record<string, unknown>>) => { rows[0]!.genome = rows[1]!.genome; },
    ]) {
      const data = mutable(snapshot()); mutate((data.displayPlan as { residents: Array<Record<string, unknown>> }).residents);
      expect(buildLandfallConditioningV2(data).ok).toBe(false);
    }
    expect(buildCanonicalLandfallConditioningV2(fixture().request, JSON.parse(JSON.stringify(fixture().roster))))
      .toEqual({ ok: false, reason: 'unproven-roster' });
  });
});
