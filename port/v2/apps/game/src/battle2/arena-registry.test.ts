/** Home-ground arena routing and the plate-set delivery check (2026-10-01). Outcomes, not code paths: which plates a battle
 * fetches, on which world, and why; that every registered set passes the delivery contract from its real files; and that the
 * contract REJECTS each way a delivery can be wrong (every check below has a mutant that must fail it). */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BIOME_PROFILE_KEYS_V1, type BiomeProfileKeyV1 } from '@cf/domain-biome-profile';
import { compileHabitatBattle, type ArenaWorld } from '../battle-habitat.js';
import { BATTLE2_ASSETS } from '../battle2-wiring.js';
import { decodePng } from '../morph/png-decode.js';
import { ARENA_BIOME_WORLD_TYPE, ARENA_FALLBACK_ASSETS, ARENA_FALLBACK_SET_ID, ARENA_SETS, ARENA_WORLD_TYPES, arenaSetAssets, fightWorld, parseArenaSets, selectArena, type ArenaKind, type ArenaSelectionContext, type ArenaSetRow } from './arena-registry.js';
import { ARENA_KIT_CANVAS, validateArenaDelivery, type ArenaDeliveryInput, type ArenaPlateImage } from './arena-delivery.js';
import { PORTRAIT_GROUND_HABITAT } from './habitat-arena.js';
import MANIFEST from './arena-sets.generated.json';
import { arenaSetsSource, checkArenaDelivery } from '../../../../tools/morph/arena-sets.mjs';

const REPO = new URL('../../../../../../', import.meta.url), REPO_PATH = decodeURIComponent(REPO.pathname);
const bytes = (rel: string): Uint8Array => new Uint8Array(readFileSync(new URL(rel, REPO)));
const json = (rel: string): unknown => JSON.parse(readFileSync(new URL(rel, REPO), 'utf8'));
const sha = (b: Uint8Array): string => createHash('sha256').update(b).digest('hex');
const png = async (rel: string): Promise<ArenaPlateImage> => decodePng(bytes(rel));
const LIQUID: ReadonlySet<string> = new Set(['opensea', 'archipelago', 'coral', 'stormsea', 'volcisle', 'abyssal', 'milksea']);
const world = (biome: BiomeProfileKeyV1, seed = 7, key = `w:${biome}:${seed}`): ArenaWorld => Object.freeze({ key, biome, seed, solid: true, atmosphere: true, liquid: LIQUID.has(biome) ? 'water' : null, surfaceWater: LIQUID.has(biome), signature: biome, cardHash: 'c-' + key });
const ctx = (kind: ArenaKind, home: ArenaWorld | null, visitor: ArenaWorld | null = home, extra: Partial<ArenaSelectionContext> = {}): ArenaSelectionContext => ({ kind, contextId: 'battle-1', seed: 42, round: 0, worlds: home && visitor ? { home, visitor } : null, ...extra });

describe('the arena biome vocabulary is the generator\'s', () => {
  it('43 live biomes in 8 world types, equal to BIOME_PROFILE_KEYS_V1', () => {
    expect(Object.keys(ARENA_BIOME_WORLD_TYPE).sort()).toEqual([...BIOME_PROFILE_KEYS_V1].sort());
    expect(Object.keys(ARENA_BIOME_WORLD_TYPE)).toHaveLength(43);
    expect(new Set(Object.values(ARENA_BIOME_WORLD_TYPE))).toEqual(new Set(ARENA_WORLD_TYPES));
    expect([ARENA_BIOME_WORLD_TYPE.temperate, ARENA_BIOME_WORLD_TYPE.opensea, ARENA_BIOME_WORLD_TYPE.blueice, ARENA_BIOME_WORLD_TYPE.glass, ARENA_BIOME_WORLD_TYPE.carbon, ARENA_BIOME_WORLD_TYPE.abyssgreen, ARENA_BIOME_WORLD_TYPE.magmasea, ARENA_BIOME_WORLD_TYPE.hotglow])
      .toEqual(['terran', 'ocean', 'ice', 'desert', 'rocky', 'venus', 'lava', 'gas']);
  });
});

describe('registered plate sets pass the delivery contract from their real files', () => {
  it('the manifest parses; the fallback set is registered', () => {
    expect(ARENA_SETS.map((s) => s.id)).toContain(ARENA_FALLBACK_SET_ID);
    expect(ARENA_SETS).toHaveLength((MANIFEST as { sets: unknown[] }).sets.length);
  });
  it('drift gate: arena-sets.generated.json is exactly tools/morph/arena-sets.mjs\'s output from the registered delivery manifests', () => {
    expect(readFileSync(new URL('./arena-sets.generated.json', import.meta.url), 'utf8')).toBe(arenaSetsSource(REPO_PATH));
  });
  for (const row of ARENA_SETS) it(`${row.id} (${row.biome}): recipe, runtime plates, painted masters, acceptance, shipped mirror`, async () => {
    const recipe = json(row.recipe) as { battleContext: { biomeFamily: string }; plates: { image: string; sha256: string }[] }, acceptance = json(row.acceptance);
    expect(recipe.battleContext.biomeFamily, 'row biome = recipe biomeFamily').toBe(row.biome);
    // the runtime set (FAR opaque, MID/NEAR keyed to alpha) and the painted masters (MID/NEAR on magenta) both pass
    const runtime = validateArenaDelivery({ recipe, acceptance, plates: { far: await png(row.far), mid: await png(row.mid), near: await png(row.near) } });
    expect(runtime.failures).toEqual([]);
    const masters = validateArenaDelivery({ recipe, acceptance, plates: { far: await png(row.masters.far), mid: await png(row.masters.mid), near: await png(row.masters.near) } });
    expect(masters.failures).toEqual([]);
    // the recipe's master hashes are the masters' bytes
    expect([sha(bytes(row.masters.far)), sha(bytes(row.masters.mid)), sha(bytes(row.masters.near))]).toEqual(recipe.plates.map((p) => p.sha256));
    // the shipped mirror (public/battle2, served at /battle2/) carries the runtime files byte for byte
    for (const f of [row.recipe, row.far, row.mid, row.near]) expect(sha(bytes('port/v2/apps/game/public/battle2/' + f)), `shipped ${f}`).toBe(sha(bytes(f)));
  }, 60_000);
  it('the temperate set: the wiring fetches its delivery manifest\'s runtime paths (recipe/FAR/NEAR as always; MID = the approved despilled copy)', () => {
    expect(arenaSetAssets(ARENA_SETS.find((s) => s.id === ARENA_FALLBACK_SET_ID)!)).toEqual(ARENA_FALLBACK_ASSETS);
    expect({ recipe: BATTLE2_ASSETS.recipe, far: BATTLE2_ASSETS.far, mid: BATTLE2_ASSETS.mid, near: BATTLE2_ASSETS.near }).toEqual(ARENA_FALLBACK_ASSETS);
    expect(ARENA_FALLBACK_ASSETS).toEqual({ recipe: 'arena-recipe.json', far: 'arena-far.png', mid: '../ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png', near: 'keyed/arena-near.png' });
  });
  it('the despilled MID is the old keyed MID with the same alpha and at most the 190 approved RGB edge pixels changed (the only pixel change to today\'s battles)', async () => {
    const before = await png('audits/ARENA_EFFECTS_V42_PROOF_20260912/keyed/arena-mid.png'), after = await png('audits/ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png');
    expect([after.width, after.height]).toEqual([before.width, before.height]);
    let alpha = 0, rgb = 0; for (let i = 0; i < before.rgba.length; i += 4) { if (before.rgba[i + 3] !== after.rgba[i + 3]) alpha++; if (before.rgba[i + 3]! > 0 && (before.rgba[i] !== after.rgba[i] || before.rgba[i + 1] !== after.rgba[i + 1] || before.rgba[i + 2] !== after.rgba[i + 2])) rgb++; }
    expect(alpha).toBe(0); expect(rgb).toBeGreaterThan(0); expect(rgb).toBeLessThanOrEqual(190);
  }, 30_000);
  it('a delivery manifest is refused by name: wrong runtime hash, missing plate, a path outside audits/', () => {
    const d = json('audits/ARENA_ROUTING_20261001/earth-temperate-v1.delivery.json') as { plates: Record<string, Record<string, string>> };
    expect(checkArenaDelivery(REPO_PATH, 'control', d).mid).toBe('audits/ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png');
    expect(() => checkArenaDelivery(REPO_PATH, 'x', { ...d, plates: { ...d.plates, mid: { ...d.plates.mid, runtimeSha256: 'f'.repeat(64) } } })).toThrow(/plates\.mid\.runtime .* hashes d9a3690dceb7…, the manifest says ffffffffffff…/);
    expect(() => checkArenaDelivery(REPO_PATH, 'x', { ...d, plates: { far: d.plates.far, mid: d.plates.mid } })).toThrow(/plates\.near missing/);
    expect(() => checkArenaDelivery(REPO_PATH, 'x', { ...d, recipe: '/etc/arena-recipe.json' })).toThrow(/recipe must be repo-relative under audits/);
    expect(() => checkArenaDelivery(REPO_PATH, 'x', { ...d, plates: { ...d.plates, far: { ...d.plates.far, runtime: 'audits/NOPE/arena-far.png' } } })).toThrow(/runtime audits\/NOPE\/arena-far\.png is missing/);
  });
  it('a set outside the proof directory resolves relative to it (one manifest row, zero code)', () => {
    const O = 'audits/ARENA_OPENSEA_20261002/';
    const [row] = parseArenaSets({ schema: 'cf.arena-sets/v1', sets: [...(MANIFEST as { sets: object[] }).sets, { id: 'opensea-v1', biome: 'opensea', delivery: O + 'delivery.json', recipe: O + 'arena-recipe.json', far: O + 'arena-far.png', mid: O + 'keyed/arena-mid.png', near: O + 'keyed/arena-near.png', masters: { far: O + 'arena-far.png', mid: O + 'arena-mid.png', near: O + 'arena-near.png' }, acceptance: O + 'acceptance.json' }] }).slice(-1);
    expect(arenaSetAssets(row!)).toEqual({ recipe: '../ARENA_OPENSEA_20261002/arena-recipe.json', far: '../ARENA_OPENSEA_20261002/arena-far.png', mid: '../ARENA_OPENSEA_20261002/keyed/arena-mid.png', near: '../ARENA_OPENSEA_20261002/keyed/arena-near.png' });
  });
  it('the generated sets refuse an unknown biome, a duplicate id, an escaping path and a missing fallback', () => {
    const base = (MANIFEST as { sets: Record<string, unknown>[] }).sets[0]!;
    expect(() => parseArenaSets({ schema: 'cf.arena-sets/v1', sets: [base, { ...base, id: 'x', biome: 'moonbase' }] })).toThrow(/43 live biomes/);
    expect(() => parseArenaSets({ schema: 'cf.arena-sets/v1', sets: [base, base] })).toThrow(/duplicate id/);
    expect(() => parseArenaSets({ schema: 'cf.arena-sets/v1', sets: [base, { ...base, id: 'y', far: 'audits/../etc/arena-far.png' }] })).toThrow(/"far" must be a repo-relative path under audits/);
    expect(() => parseArenaSets({ schema: 'cf.arena-sets/v1', sets: [{ ...base, id: 'z' }] })).toThrow(/fallback set/);
    expect(() => parseArenaSets({ schema: 'cf.arena-sets/v2', sets: [base] })).toThrow(/schema/);
  });
});

describe('selectArena: home ground by fight kind', () => {
  afterEach(() => vi.restoreAllMocks());
  it('no world context: the accepted temperate set, labelled default (today\'s game, unchanged)', () => {
    const s = selectArena(ctx('wild', null));
    expect([s.set.id, s.owner, s.match, s.world]).toEqual([ARENA_FALLBACK_SET_ID, 'default', 'default', null]);
    expect(s.reason).toMatch(/no world context/);
  });
  it('wild: the wild creature\'s world (home), never the visitor', () => {
    const s = selectArena(ctx('wild', world('temperate'), world('opensea')));
    expect([s.owner, s.world?.biome, s.match, s.set.id]).toEqual(['wild-world', 'temperate', 'biome', 'earth-temperate-v1']);
    for (let round = 0; round < 6; round++) expect(selectArena(ctx('wild', world('temperate'), world('opensea'), { round })).world?.biome).toBe('temperate');
  });
  it('guardian: its lair (home); an unpainted ocean lair falls back to temperate plates with the wet-arena reason', () => {
    const s = selectArena(ctx('guardian', world('abyssal'), world('temperate')));
    expect([s.owner, s.world?.biome, s.match, s.set.id, s.worldType]).toEqual(['lair', 'abyssal', 'fallback', 'earth-temperate-v1', 'ocean']);
    expect(s.reason).toMatch(/guardian's lair .*no painted ocean set yet; fallback accepted earth-temperate-v1 plates; world liquid water: the stage's procedural wet arena/);
  });
  it('duel: a seeded first host, then host and visitor alternate by round', () => {
    const firsts = new Set<string>();
    for (let i = 0; i < 64; i++) {
      const owners = [0, 1, 2, 3].map((round) => selectArena({ kind: 'duel', contextId: `duel-${i}`, seed: 9, round, worlds: { home: world('savanna'), visitor: world('dunesea') } }));
      expect(owners.map((o) => o.owner)).toEqual(owners[0]!.owner === 'host' ? ['host', 'visitor', 'host', 'visitor'] : ['visitor', 'host', 'visitor', 'host']);
      expect(owners.map((o) => o.world?.biome)).toEqual(owners.map((o) => (o.owner === 'host' ? 'savanna' : 'dunesea')));
      firsts.add(owners[0]!.owner);
    }
    expect(firsts, 'the first host is seeded, not always the host').toEqual(new Set(['host', 'visitor']));
  });
  it('the fight world is the habitat compiler\'s world, for every kind, round and seed (one rule, not two)', () => {
    let n = 0;
    for (const kind of ['wild', 'guardian', 'duel'] as const) for (let i = 0; i < 120; i++) for (let round = 0; round < 3; round++) {
      const home = world('temperate', i, `home-${i}`), visitor = world('canyon', i + 1, `visitor-${i}`), contextId = `ctx-${kind}-${i}`, seed = (i * 2654435761) >>> 0;
      const compiled = compileHabitatBattle({ contextId, seed, round, kind, home, visitor, left: PORTRAIT_GROUND_HABITAT, right: PORTRAIT_GROUND_HABITAT });
      expect(compiled.status).toBe('READY');
      expect(selectArena({ kind, contextId, seed, round, worlds: { home, visitor } }).world?.key).toBe(compiled.worldKey);
      expect(fightWorld(kind, contextId, seed, round) === 'home' ? home.key : visitor.key).toBe(compiled.worldKey); n++;
    }
    expect(n).toBe(1080);
  });
  it('deterministic: the same context gives the same arena; no clock, no Math.random', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Math.random read'); });
    vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Date.now read'); });
    // also with SEVERAL sets per biome, so the seeded pick itself runs (with one set it short-circuits; the first control run caught that)
    const base = (MANIFEST as { sets: Record<string, unknown>[] }).sets[0]!;
    const many = parseArenaSets({ schema: 'cf.arena-sets/v1', sets: [base, ...BIOME_PROFILE_KEYS_V1.flatMap((b) => [{ ...base, id: `${b}-a`, biome: b }, { ...base, id: `${b}-b`, biome: b }])] });
    for (const sets of [ARENA_SETS, many]) for (const b of BIOME_PROFILE_KEYS_V1) {
      const c = ctx('duel', world(b, 3), world('temperate', 4), { contextId: 'd-' + b, round: 1 });
      expect(selectArena(c, sets)).toEqual(selectArena(c, sets));
    }
  });
  it('fallback reasons for all 43 biomes: own set → biome, same world type → kin, otherwise fallback (named)', () => {
    for (const b of BIOME_PROFILE_KEYS_V1) {
      const s = selectArena(ctx('wild', world(b))), type = ARENA_BIOME_WORLD_TYPE[b];
      const expected = ARENA_SETS.some((r) => r.biome === b) ? 'biome' : ARENA_SETS.some((r) => ARENA_BIOME_WORLD_TYPE[r.biome] === type) ? 'kin' : 'fallback';
      expect(s.match, b).toBe(expected);
      if (expected === 'fallback') { expect(s.set.id).toBe(ARENA_FALLBACK_SET_ID); expect(s.reason).toContain(`no painted ${type} set yet`); expect(s.reason.includes('wet arena')).toBe(LIQUID.has(b)); }
      if (expected === 'kin') expect(s.reason).toMatch(new RegExp(`no ${b} set yet; nearest kin`));
    }
    // with only the temperate set registered today: 1 biome, 10 terran kin, 32 fallbacks
    const counts = { biome: 0, kin: 0, fallback: 0, default: 0 }; for (const b of BIOME_PROFILE_KEYS_V1) counts[selectArena(ctx('wild', world(b))).match]++;
    if (ARENA_SETS.length === 1) expect(counts).toEqual({ biome: 1, kin: 10, fallback: 32, default: 0 });
  });
  it('a newly registered set is used with zero code changes; several sets for one biome are picked per WORLD (stable home ground)', () => {
    const base = (MANIFEST as { sets: Record<string, unknown>[] }).sets[0]!;
    const sets: readonly ArenaSetRow[] = parseArenaSets({ schema: 'cf.arena-sets/v1', sets: [base, { ...base, id: 'opensea-a', biome: 'opensea' }, { ...base, id: 'opensea-b', biome: 'opensea' }] });
    const coral = selectArena(ctx('wild', world('coral')), sets);
    expect([coral.match, coral.set.biome]).toEqual(['kin', 'opensea']);
    const used = new Set<string>();
    for (let s = 0; s < 200; s++) {
      const w = world('opensea', s), picks = [0, 1, 2].map((round) => selectArena({ kind: 'duel', contextId: 'c' + round, seed: round, round, worlds: { home: w, visitor: w } }, sets).set.id);
      expect(new Set(picks).size, 'one world, one home ground').toBe(1); used.add(picks[0]!);
    }
    expect(used).toEqual(new Set(['opensea-a', 'opensea-b']));
  });
  it('refuses a bad context by name', () => {
    expect(() => selectArena({ ...ctx('wild', null), kind: 'raid' as never })).toThrow(/unknown encounter kind/);
    expect(() => selectArena({ ...ctx('wild', null), seed: 1.5 })).toThrow(/seed/);
    expect(() => selectArena({ ...ctx('duel', null), round: -1 })).toThrow(/round/);
    expect(() => selectArena(ctx('wild', { ...world('temperate'), biome: 'moon' as never }))).toThrow(/live biome/);
  });
});

describe('the delivery check rejects every way a delivery can be wrong (mutants of the accepted set)', () => {
  const T = ARENA_SETS.find((s) => s.id === ARENA_FALLBACK_SET_ID)!;
  const load = async (): Promise<ArenaDeliveryInput & { recipe: Record<string, unknown>; plates: Record<'far' | 'mid' | 'near', ArenaPlateImage> }> =>
    ({ recipe: json(T.recipe) as Record<string, unknown>, acceptance: json(T.acceptance), plates: { far: await png(T.far), mid: await png(T.mid), near: await png(T.near) } });
  const fails = (input: ArenaDeliveryInput, pattern: RegExp): void => { const v = validateArenaDelivery(input); expect(v.ok, 'mutant must fail').toBe(false); expect(v.failures.join('\n')).toMatch(pattern); };
  const crop = (p: ArenaPlateImage, h: number): ArenaPlateImage => ({ width: p.width, height: h, rgba: p.rgba.slice(0, p.width * h * 4) });
  const shiftDown = (p: ArenaPlateImage, dy: number): ArenaPlateImage => { const out = new Uint8Array(p.rgba.length), row = p.width * 4; out.set(p.rgba.subarray(0, (p.height - dy) * row), dy * row); return { ...p, rgba: out }; };
  const opaque = (p: ArenaPlateImage): ArenaPlateImage => { const out = new Uint8Array(p.rgba); for (let i = 0; i < out.length; i += 4) { out[i] = 90; out[i + 1] = 120; out[i + 2] = 80; out[i + 3] = 255; } return { ...p, rgba: out }; };
  it('control: the accepted set itself passes', async () => { expect(validateArenaDelivery(await load()).failures).toEqual([]); }, 30_000);
  it('wrong size: a cropped plate, and a recipe canvas that is neither the kit size nor the exempt accepted bytes', async () => {
    const d = await load();
    fails({ ...d, plates: { ...d.plates, mid: crop(d.plates.mid, 900) } }, /plate mid: 1672×900 ≠ recipe canvas 1672×941/);
    // a look-alike at the accepted size with other master bytes does not inherit the exemption
    const plates = (d.recipe.plates as Record<string, unknown>[]).map((p, i) => (i === 1 ? { ...p, sha256: 'a'.repeat(64) } : p));
    fails({ ...d, recipe: { ...d.recipe, plates }, acceptance: undefined }, /canvas: 1672×941 ≠ the kit's 2560×1440/);
  }, 30_000);
  it('opaque MID (a scene instead of key-painted terrain), and FAR with a key field / transparency', async () => {
    const d = await load();
    fails({ ...d, plates: { ...d.plates, mid: opaque(d.plates.mid) } }, /plate mid: only 0\.0 % key .* not an opaque scene/);
    fails({ ...d, plates: { ...d.plates, far: d.plates.mid } }, /plate far: \d+ pixels are not opaque/);
  }, 30_000);
  it('missing plate, and a recipe listing two plates', async () => {
    const d = await load();
    fails({ ...d, plates: { far: d.plates.far, mid: d.plates.mid } }, /plate near: missing/);
    fails({ ...d, recipe: { ...d.recipe, plates: (d.recipe.plates as unknown[]).slice(0, 2) } }, /recipe\.plates: 2 plates; exactly three/);
  }, 30_000);
  it('wrong ground line: declared (recipe and a plate), and painted (the MID terrain registered below 0.78)', async () => {
    const d = await load();
    fails({ ...d, recipe: { ...d.recipe, groundLineNormalized: 0.7 } }, /recipe\.groundLineNormalized: 0\.7 ≠ 0\.78/);
    fails({ ...d, recipe: { ...d.recipe, plates: (d.recipe.plates as Record<string, unknown>[]).map((p, i) => (i === 2 ? { ...p, groundLineNormalized: 0.8 } : p)) } }, /\(near\)\.groundLineNormalized: 0\.8 ≠ 0\.78/);
    fails({ ...d, plates: { ...d.plates, mid: shiftDown(d.plates.mid, Math.round(0.25 * d.plates.mid.height)) } }, /plate mid: .* terrain on the ground line y = 0\.78 across the fighting path/);
  }, 30_000);
  it('NEAR covering the stands, painted sky in the key, and an unaccepted or mismatched acceptance record', async () => {
    const d = await load();
    fails({ ...d, plates: { ...d.plates, near: d.plates.mid } }, /plate near: content at the left stand starts at y = 0\.5\d\d/);
    const sky = new Uint8Array(d.plates.near.rgba); for (let i = 0; i < d.plates.near.width * 4; i += 4) { sky[i] = 120; sky[i + 1] = 160; sky[i + 2] = 220; sky[i + 3] = 255; }
    fails({ ...d, plates: { ...d.plates, near: { ...d.plates.near, rgba: sky } } }, /plate near: top row 0\.0 % key/);
    fails({ ...d, acceptance: { ...(d.acceptance as object), qualityAccepted: false } }, /acceptance\.qualityAccepted: not true/);
    const a = d.acceptance as { plates: Record<string, unknown>[] };
    fails({ ...d, acceptance: { ...a, plates: a.plates.map((p) => (p.name === 'arena-far' ? { ...p, masterSha256: 'b'.repeat(64) } : p)) } }, /acceptance arena-far: masterSha256 bbbbbbbbbbbb… ≠ recipe/);
    fails({ ...d, recipe: { ...d.recipe, battleContext: { biomeFamily: 'moonbase' } } }, /biomeFamily: "moonbase" is not one of the 43 live biomes/);
  }, 30_000);
  it('a synthetic kit-size delivery (2560 × 1440, new biome) passes — the contract is the kit, not the temperate pixels', async () => {
    const d = await load(), { width: W, height: H } = ARENA_KIT_CANVAS;
    const make = (top: number, standGap = false): ArenaPlateImage => { const px = new Uint8Array(W * H * 4); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, content = top < 0 || (y / H >= top && !(standGap && y / H < 0.8 && Math.abs(x / W - 0.5) > 0.1));
      px[i] = content ? 60 + (x % 50) : 255; px[i + 1] = content ? 90 : 0; px[i + 2] = content ? 70 : 255; px[i + 3] = 255; } return { width: W, height: H, rgba: px }; };
    const far = make(-1), mid = make(0.6), nearPlate = make(0.82);
    const recipe = { ...d.recipe, battleContext: { biomeFamily: 'savanna' }, canvasSize: { width: W, height: H }, plates: (d.recipe.plates as Record<string, unknown>[]).map((p, i) => ({ ...p, sha256: String(i).repeat(64) })) };
    const v = validateArenaDelivery({ recipe, plates: { far, mid, near: nearPlate } });
    expect(v.failures).toEqual([]); expect(v.biome).toBe('savanna');
    // and the same synthetic delivery at the old 1672 × 941 size is refused (no exemption without the accepted bytes)
    fails({ recipe: { ...recipe, canvasSize: { width: 1672, height: 941 } }, plates: { far: d.plates.far, mid: d.plates.mid, near: d.plates.near } }, /canvas: 1672×941 ≠ the kit's/);
  }, 60_000);
});
