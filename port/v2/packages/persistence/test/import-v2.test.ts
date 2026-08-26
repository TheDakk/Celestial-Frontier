import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canon } from '../../../tests/parity.js';
import { battleStats } from '@cf/domain-combatcore';
import { describeSpecies } from '@cf/domain-genome';
import { harvestReady } from '@cf/domain-progression';
import {
  exportSaveV2, importSaveV2, isLegacySliceEnvelope, isPlausibleSaveEnvelope,
  isKnownFrontierEndingId, sanitizeImportedGenomeV2,
  type ContentRegistry, type SaveStateV2,
} from '@cf/persistence';

/* ═══ THE LOAD-PATH PARITY TEST: importSaveV2 vs save-fixtures.json ═══
   The fixture holds post-boot state captured from the REAL
   loadSaveWithRecovery over 9 curated saves (tools/savefixtures.js) — the
   importer is tested against that truth, never against itself.

   FIELD MAP: snapshot name -> SaveStateV2 projection. Fields the importer
   does not implement are in UNIMPLEMENTED with the reason — recorded, not
   silent; the completeness test fails if a snapshot field is neither. */

const here = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const FX = JSON.parse(fs.readFileSync(path.join(base, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, unknown>; results: Record<string, Record<string, string>>;
};
const REGISTRY = JSON.parse(fs.readFileSync(path.join(base, 'content-registry.json'), 'utf8')) as ContentRegistry;

/* the fixtures' fixed wall-clock anchor (tools/savefixtures.js AT) — the
   capture ran later than this, and every clamp that reads "now" saturates
   identically for any now > every fixture stamp; the boot happened at
   capture time, so any post-anchor now reproduces the captured clamps
   EXCEPT t-above-now cases, which the fixtures deliberately avoid. */
const NOW = 1753900000000 + 60e3;

type Snap = (s: SaveStateV2) => unknown;
const FIELD_MAP: Record<string, Snap> = {
  EPOCH_BASE: (s) => s.EPOCH_BASE,
  COSMIC_EPOCH: (s) => s.EPOCH_BASE,          /* boot: COSMIC_EPOCH=EPOCH_BASE */
  essence: (s) => s.essence,
  explorerName: (s) => s.explorerName,
  lastAnomKey: (s) => s.lastAnomKey,
  stats: (s) => s.stats,
  pstats: (s) => s.pstats,
  hp: (s) => s.hp, HP_MAX: (s) => s.HP_MAX,
  customNames: (s) => s.customNames,
  conquered: (s) => s.conquered,
  cargo: (s) => s.cargo, cgx: (s) => s.cgx,
  items: (s) => s.items, equip: (s) => s.equip, equipAff: (s) => s.equipAff,
  pinnedRecipe: (s) => s.pinnedRecipe, cargoTab: (s) => s.cargoTab,
  seenSp: (s) => s.seenSp, journal: (s) => s.journal,
  mined: (s) => s.mined, mineX: (s) => s.mineX, skimX: (s) => s.skimX,
  bioX: (s) => s.bioX,
  techOwned: (s) => s.techOwned, claimedSets: (s) => s.claimedSets,
  ascCh: (s) => s.ascCh, ascProg: (s) => s.ascProg,
  nameHue: (s) => s.nameHue, _savedView: (s) => s.savedView,
  fsMode: (s) => s.fsMode, toneMode: (s) => s.toneMode, fontMode: (s) => s.fontMode,
  sndOn: (s) => s.sndOn, fxOn: (s) => s.fxOn, chartsOn: (s) => s.chartsOn,
  shakeOn: (s) => s.shakeOn, salvageConfirm: (s) => s.salvageConfirm,
  notifOn: (s) => s.notifOn, tipsOn: (s) => s.tipsOn,
  sfxVol: (s) => s.sfxVol, glassTint: (s) => s.glassTint,
  motionMode: (s) => s.motionMode, cardExpand: (s) => s.cardExpand,
  notifications: (s) => s.notifications,
  surveyedSet: (s) => s.surveyedSet, galSeen: (s) => s.galSeen, surfSeen: (s) => s.surfSeen,
  xpFirsts: (s) => s.xpFirsts, sysSeen: (s) => s.sysSeen,
  starKindsSeen: (s) => s.starKindsSeen, ptypesSeen: (s) => s.ptypesSeen,
  eventKeysSeen: (s) => s.eventKeysSeen, _evAnnounced: (s) => s.evAnnounced,
  unlocked: (s) => s.unlocked, landed: (s) => s.landed, contacted: (s) => s.contacted,
  _waveOffs: (s) => s.waveOffs, primeFill: (s) => s.primeFill,
  frontierUnlocked: (s) => s.frontierUnlocked, frontierEnding: (s) => s.frontierEnding,
  seenGuide: (s) => s.seenGuide, tutDone: (s) => s.tutDone, _rnSeen: (s) => s.rnSeen,
  _tutSnapPending: (s) => s.tutSnapPending, scoutId: (s) => s.scoutId,
  chWeek: (s) => s.chWeek, chProg: (s) => s.chProg, chacc: (s) => s.chacc, chDone: (s) => s.chDone,
  homeId: (s) => s.homeId, voiceOn: (s) => s.voiceOn, combatSfxOn: (s) => s.combatSfxOn,
  logMap: (s) => s.logMap,
  /* probe codex shape: [id, {name,kind,tier,realm,sapient,from,hybrid,g}] — no id inside */
  codex: (s) => s.codex.map(([id, e]) => [id, { name: e.name, kind: e.kind, tier: e.tier, realm: e.realm, sapient: e.sapient, from: e.from, hybrid: e.hybrid, g: e.g }]),
};
const UNIMPLEMENTED: Record<string, string> = {};

const FIXTURE_NAMES = ['empty_object', 'veteran_rich', 'hostile_shapes', 'hostile_markup_caps',
  'pre_v17_veteran', 'hostile_arrays_as_objects', 'tut_midtraining', 'settings_spread', 'equip_integrity'] as const;

/* The baseline is immutable v1.8.9 truth. D-9i is one deliberate v2
   correction: that build retained hostile `gen:"2"` as a string in both
   the codex genome and stats.maxGen. Project only those two exact leaves to
   the approved numeric value; every other byte must still match. */
const approvedExpected = (fixture: typeof FIXTURE_NAMES[number], field: string, encoded: string): string => {
  /* D-SAVE-OPTIONAL-ID: v1's `num(v, NaN)` accidentally fell back through
     `(d || 0)`, manufacturing zero-valued Atlas identity fields that were not
     in the save. v2 preserves explicit zero but no longer invents absent
     pseed-adjacent fields. These are the only immutable fixtures containing
     such absent fields. */
  if (field === 'logMap' && (fixture === 'veteran_rich' || fixture === 'hostile_markup_caps')) {
    const value = JSON.parse(encoded) as Array<[string, { where?: Record<string, unknown> }]>;
    for (const [, entry] of value) {
      for (const key of ['m', 'orb', 'pi', 'seed', 'sseed']) delete entry.where?.[key];
      if (entry.where?.star && typeof entry.where.star === 'object') {
        Object.assign(entry.where.star, { x: 560, y: 170 });
      }
    }
    return canon(value);
  }
  /* D-IMPORT: keyed progression carriers are records. v1's `typeof` gate
     accidentally treated array indices as user-owned keys; v2 contains the
     malformed field instead of manufacturing numeric-looking progress. */
  if (fixture === 'hostile_arrays_as_objects' && (field === 'ascProg' || field === 'chProg')) {
    return canon({});
  }
  if (fixture !== 'hostile_markup_caps' || (field !== 'stats' && field !== 'codex')) return encoded;
  const value = JSON.parse(encoded) as Record<string, unknown> | Array<[string, { g: Record<string, unknown> }]>;
  if (field === 'stats') (value as Record<string, unknown>).maxGen = 2;
  else for (const [, entry] of value as Array<[string, { g: Record<string, unknown> }]>) entry.g.gen = 2;
  return canon(value);
};

describe('importSaveV2 — parity against the REAL load path (save-fixtures.json)', () => {
  it('every snapshot field is mapped or explicitly unimplemented (no silent gaps)', () => {
    const snapshotFields = Object.keys(FX.results.empty_object!);
    const unknown = snapshotFields.filter((f) => !(f in FIELD_MAP) && !(f in UNIMPLEMENTED));
    expect(unknown, 'snapshot fields with neither mapping nor recorded reason').toEqual([]);
  });
  for (const name of FIXTURE_NAMES) {
    it(`${name}: all mapped fields byte-identical to the captured truth`, () => {
      const res = importSaveV2(JSON.stringify(FX.inputs[name]), REGISTRY, NOW);
      expect(res.ok, 'importer refused a fixture the game loaded').toBe(true);
      const state = (res as { ok: true; state: SaveStateV2 }).state;
      const want = FX.results[name]!;
      const bad: string[] = [];
      for (const [field, project] of Object.entries(FIELD_MAP)) {
        if (!(field in want)) continue;
        const got = canon(project(state));
        const expected = approvedExpected(name, field, want[field]!);
        if (got !== expected) bad.push(field + '\n  want ' + expected.slice(0, 220) + '\n  got  ' + got.slice(0, 220));
      }
      expect(bad, bad.join('\n')).toEqual([]);
    });
  }
  it('recovery_from_backup: the importer refuses the corrupt primary; the BACKUP loads to the captured truth (repository owns the swap)', () => {
    const inp = FX.inputs.recovery_from_backup as { primary: string; backup: string };
    expect(importSaveV2(inp.primary, REGISTRY, NOW).ok).toBe(false);
    const res = importSaveV2(inp.backup, REGISTRY, NOW);
    expect(res.ok).toBe(true);
    const state = (res as { ok: true; state: SaveStateV2 }).state;
    const want = FX.results.recovery_from_backup!;
    /* the recovery boot ALSO minted its loud notification — importer output
       must match every field EXCEPT that boot-minted tray entry */
    const bad: string[] = [];
    for (const [field, project] of Object.entries(FIELD_MAP)) {
      if (!(field in want) || field === 'notifications') continue;
      const got = canon(project(state));
      if (got !== want[field]) bad.push(field);
    }
    expect(bad, bad.join(', ')).toEqual([]);
    expect(want.notifications).toContain('minted-at-boot');   /* the loud restore really happened */
  });
  it('defect injection: a future-t conquest stamp clamps to the injected now (deliberately not fixture-pinned)', () => {
    const res = importSaveV2(JSON.stringify({ at: NOW - 1000, conq: [[7, { t: NOW + 999999, tier: 3 }]] }), REGISTRY, NOW);
    expect(res.ok).toBe(true);
    const row = (res as { ok: true; state: SaveStateV2 }).state.conquered[0]![1];
    expect(row.t).toBe(NOW);
    expect(row.e).toBeUndefined();
  });
  it('Gate C: conq[].e migration preserves one ready legacy cycle, clamps hostile bounds, and round-trips', () => {
    const source = structuredClone(FX.inputs.veteran_rich) as Record<string, unknown>;
    source.epoch = 1;
    source.conq = [
      ['absent', { t: NOW, tier: 1 }],
      ['null', { t: NOW, tier: 1, e: null }],
      ['zero', { t: NOW, tier: 1, e: 0 }],
      ['boundary', { t: NOW, tier: 1, e: 1 }],
      ['future', { t: NOW, tier: 1, e: 1_000_000_000 }],
      ['negative', { t: NOW, tier: 1, e: -7 }],
      ['malformed', { t: NOW, tier: 1, e: 'not-an-epoch' }],
    ];

    const imported = importSaveV2(JSON.stringify(source), REGISTRY, NOW);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.state.EPOCH_BASE).toBe(1);
    const rows = new Map(imported.state.conquered);
    const row = (id: string) => rows.get(id)!;

    /* Mutation control: assigning `e = 0` unconditionally would erase the
       absent/null migration signal and make these rows unready at epoch 1. */
    for (const id of ['absent', 'null']) {
      expect(Object.hasOwn(row(id), 'e'), `${id} must retain absent e`).toBe(false);
      expect(harvestReady(row(id), imported.state.EPOCH_BASE), `${id} must be ready once`).toBe(true);
    }

    expect(Object.hasOwn(row('zero'), 'e')).toBe(true);
    expect(row('zero').e).toBe(0);
    expect(Object.hasOwn(row('boundary'), 'e')).toBe(true);
    expect(row('boundary').e).toBe(1);
    expect(harvestReady(row('zero'), imported.state.EPOCH_BASE)).toBe(false);
    expect(harvestReady(row('boundary'), imported.state.EPOCH_BASE)).toBe(false);

    /* Mutation controls: a missing upper clamp cannot retain the hostile
       future value, and a missing lower clamp cannot retain the negative. */
    expect(row('future').e).toBe(1);
    expect(row('negative').e).toBe(0);
    expect(row('malformed').e).toBe(0);
    for (const id of ['future', 'negative', 'malformed']) {
      expect(Object.hasOwn(row(id), 'e'), `${id} must remain a present sanitized stamp`).toBe(true);
      expect(harvestReady(row(id), imported.state.EPOCH_BASE), `${id} must not impersonate absent`).toBe(false);
    }

    const reloaded = importSaveV2(exportSaveV2(imported.state, NOW), REGISTRY, NOW);
    expect(reloaded.ok).toBe(true);
    if (!reloaded.ok) return;
    expect(reloaded.state.conquered).toEqual(imported.state.conquered);
    const reloadedRows = new Map(reloaded.state.conquered);
    expect(Object.hasOwn(reloadedRows.get('absent')!, 'e')).toBe(false);
    expect(Object.hasOwn(reloadedRows.get('null')!, 'e')).toBe(false);
  });
  it('D-9i: generation strings become numbers and invalid counters cannot poison maxGen', () => {
    const baseInput = FX.inputs.hostile_markup_caps as { codex: Array<{ g: Record<string, unknown> }> };
    const importedGen = (value: unknown): { genome: unknown; max: unknown } => {
      const input = structuredClone(baseInput);
      input.codex[0]!.g.gen = value;
      const res = importSaveV2(JSON.stringify(input), REGISTRY, NOW);
      expect(res.ok).toBe(true);
      const state = (res as { ok: true; state: SaveStateV2 }).state;
      return { genome: state.codex[0]![1].g.gen, max: state.stats.maxGen };
    };
    expect(importedGen('2')).toEqual({ genome: 2, max: 2 });
    for (const poison of [-1, 2.5, 'not-a-number', Number.MAX_SAFE_INTEGER + 1]) {
      expect(importedGen(poison), String(poison)).toEqual({ genome: 0, max: 0 });
    }
  });
  it('future save versions fail distinctly while current and legacy payloads remain loadable', () => {
    expect(importSaveV2('{"v":5,"epoch":1,"codex":[],"land":[]}', REGISTRY, NOW))
      .toEqual({ ok: false, reason: 'future-version' });
    expect(importSaveV2('{"v":4,"epoch":1,"codex":[],"land":[]}', REGISTRY, NOW).ok).toBe(true);
    expect(importSaveV2('{"epoch":1,"codex":[],"land":[]}', REGISTRY, NOW).ok).toBe(true);
    for (const primitive of ['[]', '1', '"x"', 'true', 'null']) {
      expect(importSaveV2(primitive, REGISTRY, NOW), primitive).toEqual({ ok: false, reason: 'invalid' });
    }
  });
  it('epoch import is an integer with a bounded evolution cost', () => {
    const epochOf = (epoch: unknown): number => {
      const result = importSaveV2(JSON.stringify({ epoch, codex: [], land: [] }), REGISTRY, NOW);
      expect(result.ok).toBe(true);
      return (result as { ok: true; state: SaveStateV2 }).state.EPOCH_BASE;
    };
    expect(epochOf(12)).toBe(12);
    expect(epochOf('12')).toBe(12);
    expect(epochOf(1.1)).toBe(0);
    expect(epochOf(-1)).toBe(0);
    expect(epochOf(1e12)).toBe(10_000);
  });
  it('repairs unsafe descriptor/combat indices and contains irreparable Codex rows without losing the expedition', () => {
    const input = structuredClone(FX.inputs.veteran_rich) as { codex: Array<Record<string, unknown>> };
    const expected = importSaveV2(JSON.stringify(input), REGISTRY, NOW);
    expect(expected.ok).toBe(true);
    const expectedState = (expected as { ok: true; state: SaveStateV2 }).state;
    const baseGenome = structuredClone((input.codex[0] as { g: Record<string, unknown> }).g);
    input.codex.unshift(
      { g: { ...baseGenome, seed: 'not-finite' }, f: 'bad seed' },
      { g: { ...baseGenome, seed: 8675308, kingdom: 'virus' }, f: 'bad kingdom' },
      { g: {
        ...baseGenome,
        seed: 8675309,
        color: -2.9,
        body: '3',
        diet: 'not-a-number',
        metab: -1,
        size: 11,
        /* Not descriptor/combat indices: the bounded repair must not casually
           rewrite unrelated honest/legacy genome bytes. */
        limbs: 'legacy-limbs',
        accent: 'legacy-accent',
      }, f: 'repairable row' },
    );
    const recovered = importSaveV2(JSON.stringify(input), REGISTRY, NOW);
    expect(recovered.ok).toBe(true);
    const state = (recovered as { ok: true; state: SaveStateV2 }).state;
    expect(state.codex.filter(([id]) => id !== 's8675309')).toEqual(expectedState.codex);
    expect(state.codex.some(([id]) => id === 'snot-finite' || id === 's8675308')).toBe(false);
    const repaired = new Map(state.codex).get('s8675309')!;
    expect(repaired.g).toMatchObject({
      color: 2, body: 3, diet: 0, metab: 1, size: 11,
      limbs: 'legacy-limbs', accent: 'legacy-accent',
    });
    expect(describeSpecies(repaired.g as never).desc).not.toContain('undefined');
    const combat = battleStats(repaired.g);
    for (const field of ['vit', 'fer', 'res', 'agi', 'ins', 'tier', 'total'] as const) {
      expect(Number.isFinite(combat[field]), field).toBe(true);
    }
    expect(state.essence).toBe(expectedState.essence);
    expect(state.landed).toEqual(expectedState.landed);
  });
  it('clones before the lifted mutating genome hardener and preserves valid unwrapped size exactly', () => {
    const source = Object.freeze({
      seed: 91, kingdom: 'fauna', color: -2.9, form: 1, body: 1, loco: 1,
      trait: 1, size: 11, diet: '2', head: 1, limbs: 1, skin: 1, tail: 1,
      pattern: 1, eyes: 1, behavior: 1, habitat: 1, detail: 1, accent: 1,
      temper: 1, sense: 1, repro: 1, life: 1, metab: -1, lumin: false,
      gen: 0, heat: 0.6, brood: 999, _mult: 4, _wf: 'lava',
    });
    const before = structuredClone(source);
    const sanitized = sanitizeImportedGenomeV2(source)!;
    expect(source).toEqual(before);
    expect(sanitized).not.toBe(source);
    expect(sanitized).toMatchObject({ color: 2, diet: 2, metab: 1, size: 11, brood: 200 });
    expect(sanitized).not.toHaveProperty('_mult');
    expect(sanitized).not.toHaveProperty('_wf');
    expect(source).toHaveProperty('_mult', 4);
    expect(source).toHaveProperty('_wf', 'lava');
  });
  it('reconstructs every duplicate-prone legacy Map/Set carrier before projecting DTO arrays', () => {
    const [techA, techB] = REGISTRY.techs;
    const [setA, setB] = REGISTRY.binderSets;
    const [starterA, starterB] = REGISTRY.charterStarters;
    const [weeklyA, weeklyB] = REGISTRY.charterPool;
    const [materialA, materialB] = REGISTRY.materials;
    const [itemA, itemB] = Object.keys(REGISTRY.items);
    const codexGenome = structuredClone(
      ((FX.inputs.veteran_rich as { codex: Array<{ g: Record<string, unknown> }> }).codex[0]!.g),
    );
    expect([techA, techB, setA, setB, starterA, starterB, weeklyA, weeklyB,
      materialA, materialB, itemA, itemB].every(Boolean)).toBe(true);
    const result = importSaveV2(JSON.stringify({
      epoch: 10,
      at: NOW,
      names: [['place', 'first'], ['other', 'middle'], ['place', 'last']],
      conq: [[7, { t: 1, tier: 1, e: 1 }], [8, { t: 2, tier: 2, e: 2 }], [7, { t: 3, tier: 4, e: 3 }]],
      setsc: [setA, setB, setA],
      cargo: [[materialA, 1], [materialB, 2], [materialA, 3]],
      cgx: [[materialA, 1], [materialB, 1], [materialA, 2]],
      minedw: [[7, 1], [8, 2], [7, 3]],
      mx: [[7, 1], [8, 2], [7, 4]],
      skx: [[7, 1], [8, 2], [7, 5]],
      bx: [[7, [1, 1]], [8, [2, 2]], ['7', [3, 3]]],
      tech: [techA, techB, techA],
      items: [[itemA, 1], [itemB, 2], [itemA, 3]],
      seen: ['s1', 's2', 's1'],
      surveyed: ['p1', 'p2', 'p1'],
      gals: [1, 2, 1], surf: [3, 4, 3], xpf: ['x1', 'x2', 'x1'],
      sysv: [5, 6, 5], starK: ['G', 'K', 'G'], ptypes: ['rock', 'gas', 'rock'],
      evts: ['e1', 'e2', 'e1'], evann: ['a1', 'a2', 'a1'], ach: ['u1', 'u2', 'u1'],
      chs: [starterA, starterB, starterA],
      chacc: [starterA, weeklyA, weeklyB, weeklyA, starterB],
      land: [7, 8, 7], cont: [9, 10, 9],
      wvo: [[7, 1], [8, 2], ['7', 5]],
      log: [{ id: 'dup', title: 'first' }, { id: 'middle', title: 'middle' }, { id: 'dup', title: 'last' }],
      codex: [
        { g: { ...codexGenome, seed: 424200, size: 6 }, f: 'first sighting' },
        { g: { ...codexGenome, seed: 424200, size: 9 }, f: 'later duplicate' },
      ],
    }), REGISTRY, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const s = result.state;
    /* Map: first insertion slot, last value. */
    expect(s.customNames).toEqual([['place', 'last'], ['other', 'middle']]);
    expect(s.conquered.map(([key, row]) => [key, row.tier, row.e])).toEqual([[7, 4, 3], [8, 2, 2]]);
    expect(s.cargo).toEqual([[materialA!, 3], [materialB!, 2]]);
    expect(s.cgx).toEqual([[materialA!, 2], [materialB!, 1]]);
    expect(s.mined.map(([key]) => key)).toEqual([7, 8]);
    expect(s.mineX).toEqual([[7, 4], [8, 2]]);
    expect(s.skimX).toEqual([[7, 5], [8, 2]]);
    expect(s.bioX).toEqual([[7, [3, 3]], [8, [2, 2]]]);
    expect(s.items).toEqual([[itemA!, 3], [itemB!, 2]]);
    expect(s.waveOffs).toEqual([[7, 5], [8, 2]]);
    expect(s.logMap.map(([id, entry]) => [id, entry.title])).toEqual([['dup', 'last'], ['middle', 'middle']]);
    expect(s.codex).toHaveLength(1);
    expect(s.codex[0]![1]).toMatchObject({ from: 'first sighting', g: { size: 6 } });
    /* Set: first accepted occurrence, duplicates collapse. Completed Charter
       ids also exclude the corresponding accepted rows exactly as v1 did. */
    expect(s.claimedSets).toEqual([setA, setB]);
    expect(s.techOwned).toEqual([techA, techB]);
    expect(s.chDone).toEqual([starterA, starterB]);
    expect(s.chacc).toEqual([weeklyA, weeklyB]);
    expect(s.seenSp).toEqual(['s1', 's2']);
    expect(s.surveyedSet).toEqual(['p1', 'p2']);
    expect(s.galSeen).toEqual([1, 2]); expect(s.surfSeen).toEqual([3, 4]);
    expect(s.xpFirsts).toEqual(['x1', 'x2']); expect(s.sysSeen).toEqual([5, 6]);
    expect(s.starKindsSeen).toEqual(['G', 'K']); expect(s.ptypesSeen).toEqual(['rock', 'gas']);
    expect(s.eventKeysSeen).toEqual(['e1', 'e2']); expect(s.evAnnounced).toEqual(['a1', 'a2']);
    expect(s.unlocked).toEqual(['u1', 'u2']); expect(s.landed).toEqual([7, 8]);
    expect(s.contacted).toEqual([9, 10]);
  });
  it('rejects array indices as progression/signature keys while retaining real record keys', () => {
    const numericSignatureRegistry: ContentRegistry = {
      ...REGISTRY,
      sigIds: [...REGISTRY.sigIds, '0'],
    };
    const primeRow = {
      title: 'Numeric signature', sub: 'record only', tier: 7, hex: '#abc', where: null,
    };
    const fromArrays = importSaveV2(JSON.stringify({
      epoch: 0, codex: [], land: [], ascp: [3, 9], chp: [7], prime: [primeRow],
    }), numericSignatureRegistry, NOW);
    expect(fromArrays.ok).toBe(true);
    if (!fromArrays.ok) return;
    expect(fromArrays.state.ascProg).toEqual({});
    expect(fromArrays.state.chProg).toEqual({});
    expect(fromArrays.state.primeFill).toEqual({});

    /* Hostile control: "0" is deliberately a valid injected signature id,
       so this only stays empty above when the array carrier itself is
       rejected. The same numeric-looking keys remain valid on real records. */
    const fromRecords = importSaveV2(JSON.stringify({
      epoch: 0, codex: [], land: [],
      ascp: { 0: 3, 1: 9 }, chp: { 0: 7 }, prime: { 0: primeRow },
    }), numericSignatureRegistry, NOW);
    expect(fromRecords.ok).toBe(true);
    if (!fromRecords.ok) return;
    expect(fromRecords.state.ascProg).toEqual({ 0: 3, 1: 9 });
    expect(fromRecords.state.chProg).toEqual({ 0: 7 });
    expect(fromRecords.state.primeFill).toEqual({
      0: { title: 'Numeric signature', sub: 'record only', tier: 7, hex: '#abc', where: null },
    });
  });
  it('bounds opaque legacy anomaly/ending tokens and requires a separate known-ending resolver', () => {
    for (const [input, expected] of [
      [0, 0], [5_555_555, 5_555_555], ['42', '42'], ['k1', 'k1'],
      ['', null], [-1, null], [1.5, null], [Number.MAX_VALUE, null], ['bad key', null],
      [true, null], [{ value: 42 }, null],
    ] as const) {
      const imported = importSaveV2(JSON.stringify({
        epoch: 0, codex: [], land: [], anomKey: input,
      }), REGISTRY, NOW);
      expect(imported.ok, `anomaly ${JSON.stringify(input)}`).toBe(true);
      if (!imported.ok) continue;
      expect(imported.state.lastAnomKey).toBe(expected);
      const reloaded = importSaveV2(exportSaveV2(imported.state, NOW), REGISTRY, NOW);
      expect(reloaded.ok).toBe(true);
      if (reloaded.ok) expect(reloaded.state.lastAnomKey).toBe(expected);
    }

    for (const ending of ['conquer', 'protect', 'terraform', 'preserve', 'balance', 'dawn'] as const) {
      const imported = importSaveV2(JSON.stringify({
        epoch: 0, codex: [], land: [], frontier: 1, ending,
      }), REGISTRY, NOW);
      expect(imported.ok).toBe(true);
      if (!imported.ok) continue;
      expect(imported.state.frontierEnding).toBe(ending);
      expect(isKnownFrontierEndingId(imported.state.frontierEnding)).toBe(ending !== 'dawn');
      const reloaded = importSaveV2(exportSaveV2(imported.state, NOW), REGISTRY, NOW);
      expect(reloaded.ok).toBe(true);
      if (reloaded.ok) expect(reloaded.state.frontierEnding).toBe(ending);
    }
    for (const ending of ['', 'UPPER', 'bad ending', 'x'.repeat(33), 1, true, { id: 'balance' }]) {
      const imported = importSaveV2(JSON.stringify({
        epoch: 0, codex: [], land: [], frontier: 1, ending,
      }), REGISTRY, NOW);
      expect(imported.ok).toBe(true);
      if (imported.ok) expect(imported.state.frontierEnding).toBeNull();
    }
  });
  it('valid unwrapped size is an import/export fixed point across honest and large values', () => {
    const template = structuredClone(
      ((FX.inputs.veteran_rich as { codex: Array<{ g: Record<string, unknown> }> }).codex[0]!.g),
    );
    for (const size of [6, 9, 11, 1_000_000]) {
      const first = importSaveV2(JSON.stringify({
        epoch: 0, codex: [{ g: { ...template, seed: 9000000 + size, size } }], land: [],
      }), REGISTRY, NOW);
      expect(first.ok, `first import size ${size}`).toBe(true);
      if (!first.ok) continue;
      expect(first.state.codex[0]![1].g.size).toBe(size);
      const second = importSaveV2(exportSaveV2(first.state, NOW), REGISTRY, NOW);
      expect(second.ok, `round-trip size ${size}`).toBe(true);
      if (!second.ok) continue;
      expect(second.state.codex[0]![1].g.size).toBe(size);
      expect(canon(second.state.codex[0]![1].g)).toBe(canon(first.state.codex[0]![1].g));
    }
  });
  it('Atlas travel keeps complete star identity and rejects partial route identities', () => {
    const route = {
      type: 'planet',
      gal: { x: 90, y: -60, seed: 999, size: 14.5 },
      star: { x: 560, y: 170, seed: 424242 },
      pseed: 0,
    };
    const raw = { epoch: 0, view: route, codex: [], land: [], log: [
      { id: 'good', title: 'good', where: route },
      { id: 'bad-gal', title: 'bad', where: { type: 'galaxy', gal: {} } },
      { id: 'bad-star', title: 'bad', where: { type: 'star', gal: route.gal, star: { seed: 1 } } },
      { id: 'bad-planet', title: 'bad', where: { type: 'planet', gal: route.gal, star: route.star } },
    ] };
    const result = importSaveV2(JSON.stringify(raw), REGISTRY, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const rows = new Map(result.state.logMap);
    expect(rows.get('good')?.where).toEqual(route);
    expect(rows.get('bad-gal')?.where).toBeNull();
    expect(rows.get('bad-star')?.where).toBeNull();
    expect(rows.get('bad-planet')?.where).toBeNull();
    const routeEvidence = {
      type: 'planet',
      gal: { x: 90, y: -60, seed: 999 },
      star: { x: 560, y: 170, seed: 424242 },
      pseed: 0,
    };
    expect(result.ingress.savedView).toEqual(routeEvidence);
    for (const [, entry] of result.state.logMap) {
      expect(result.ingress.atlasWhere.has(entry)).toBe(true);
    }
    expect(result.ingress.atlasWhere.get(rows.get('good')!)).toEqual(routeEvidence);
  });
  it('retains malformed pre-sanitizer evidence instead of mistaking fabricated defaults for identity', () => {
    const rawView = {
      type: 'star',
      gal: { x: '90', y: -60, seed: 999 },
      star: {},
      proven: 'raw-only',
    };
    const result = importSaveV2(JSON.stringify({
      epoch: 0, view: rawView, codex: [], land: [],
      log: [{ id: 'stub', where: rawView }],
    }), REGISTRY, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const projected = {
      type: 'star',
      gal: {
        x: { kind: 'invalid-route-value', valueType: 'string' },
        y: -60,
        seed: 999,
      },
      star: {},
    };
    expect(result.ingress.savedView).toEqual(projected);
    expect(result.state.savedView?.star).toEqual({ x: 0, y: 0, seed: 1 });
    expect(result.state.savedView).not.toHaveProperty('proven');
    const entry = result.state.logMap[0]![1];
    expect(entry.where).toBeNull();
    expect(result.ingress.atlasWhere.get(entry)).toEqual(projected);
    expect(result.ingress.savedView).not.toHaveProperty('proven');
  });
  it('bounds raw route retention to deeply frozen proof fields and a frozen lookup', () => {
    const hostile = 'x'.repeat(500_000);
    const rawRoute = {
      type: 'planet',
      gal: { x: 90, y: -60, seed: 999, unrelated: { hostile } },
      star: { x: hostile, y: 170, seed: 424242, unrelated: [hostile] },
      pseed: 133,
      unrelated: { nested: { hostile } },
    };
    const result = importSaveV2(JSON.stringify({
      epoch: 0, view: rawRoute, codex: [], land: [],
      log: [{ id: 'hostile', where: rawRoute }],
    }), REGISTRY, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const projected = result.ingress.savedView as {
      gal: Record<string, unknown>;
      star: Record<string, unknown>;
    };
    expect(projected).toEqual({
      type: 'planet',
      gal: { x: 90, y: -60, seed: 999 },
      star: {
        x: { kind: 'invalid-route-value', valueType: 'string' },
        y: 170,
        seed: 424242,
      },
      pseed: 133,
    });
    expect(JSON.stringify(projected).length).toBeLessThan(220);
    expect(Object.isFrozen(result.ingress)).toBe(true);
    expect(Object.isFrozen(projected)).toBe(true);
    expect(Object.isFrozen(projected.gal)).toBe(true);
    expect(Object.isFrozen(projected.star)).toBe(true);
    expect(Object.isFrozen(projected.star.x)).toBe(true);
    expect(() => { (projected.gal as { x: number }).x = 1; }).toThrow(TypeError);
    expect(result.ingress.atlasWhere).not.toHaveProperty('set');
    expect(result.ingress.atlasWhere).not.toHaveProperty('delete');
    expect(Object.isFrozen(result.ingress.atlasWhere)).toBe(true);
    const entry = result.state.logMap[0]![1];
    expect(result.ingress.atlasWhere.get(entry)).toEqual(projected);
    expect(result.ingress.atlasWhere.has({ ...entry })).toBe(false);
  });
  it('binds bounded raw Atlas evidence to final cleaned-id, last-write entry objects', () => {
    const firstWhere = { type: 'galaxy', gal: { x: 1, y: 1, seed: 1 }, marker: 'first' };
    const finalWhere = { type: 'galaxy', gal: { x: 2, y: 2, seed: 2 }, marker: 'final' };
    const log = [
      { id: 'd<u>p', title: 'first', where: firstWhere },
      { id: 'dup', title: 'final', where: finalWhere },
      ...Array.from({ length: 149 }, (_, i) => ({
        id: 'row-' + i,
        title: 'row ' + i,
        where: { type: 'galaxy', gal: { x: i, y: -i, seed: i }, marker: 'row-' + i },
      })),
    ];
    const result = importSaveV2(JSON.stringify({ epoch: 0, codex: [], land: [], log }), REGISTRY, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    /* Only the first 150 raw rows enter the importer. The cleaned duplicate
       collapses last-write-wins, leaving 149 final entry objects. */
    expect(result.state.logMap).toHaveLength(149);
    expect(result.ingress.atlasWhere.size).toBe(149);
    const finalEntries = result.state.logMap.map(([, entry]) => entry);
    expect(finalEntries.every((entry) => result.ingress.atlasWhere.has(entry))).toBe(true);
    const duplicate = result.state.logMap.find(([id]) => id === 'dup')![1];
    expect(duplicate.title).toBe('final');
    expect(result.ingress.atlasWhere.get(duplicate)).toEqual({
      type: 'galaxy', gal: { x: 2, y: 2, seed: 2 },
    });
    for (const i of [0, 73, 147]) {
      const entry = result.state.logMap.find(([id]) => id === 'row-' + i)![1];
      expect(result.ingress.atlasWhere.get(entry), `raw route association for row-${i}`).toEqual({
        type: 'galaxy', gal: { x: i, y: i === 0 ? 0 : -i, seed: i },
      });
    }
    expect(result.state.logMap.some(([id]) => id === 'row-148')).toBe(false);
    expect(result.ingress.atlasWhere.has({ ...duplicate })).toBe(false);
    expect(Object.isFrozen(result.ingress.atlasWhere)).toBe(true);
  });
  it('classifies only the exact current Training {view} snapshot and preserves richer snapshots', () => {
    const view = { type: 'galaxy', gal: { x: 90, y: -60, seed: 999 } };
    const current = importSaveV2(JSON.stringify({ epoch: 0, tut: 0, tsnap: { view } }), REGISTRY, NOW);
    expect(current.ok).toBe(true);
    if (current.ok) {
      expect(current.ingress.trainingSnapshot).toEqual({ kind: 'current-view', view });
      expect(current.state.tutSnapPending).toEqual({ view });
    }
    const richSnapshot = { view, codex: [], essence: 10, marker: 'pre-training-expedition' };
    const rich = importSaveV2(JSON.stringify({ epoch: 0, tut: 0, tsnap: richSnapshot }), REGISTRY, NOW);
    expect(rich.ok).toBe(true);
    if (rich.ok) {
      expect(rich.ingress.trainingSnapshot).toEqual({
        kind: 'legacy-or-unknown',
        snapshot: richSnapshot,
      });
      expect(rich.state.tutSnapPending).toEqual(richSnapshot);
    }
    const completed = importSaveV2(JSON.stringify({ epoch: 0, tut: 1, tsnap: { view } }), REGISTRY, NOW);
    expect(completed.ok).toBe(true);
    if (completed.ok) {
      expect(completed.ingress.trainingSnapshot).toEqual({ kind: 'none' });
      expect(completed.state.tutSnapPending).toBeNull();
    }
  });
  it('recognizes only the exact historical two-field development-slice envelopes for all four nav modes', () => {
    const gal = Object.freeze({ x: 90, y: -60, seed: 999, size: 78 });
    const star = Object.freeze({ x: 560, y: 170, seed: 424242, kind: 'G' });
    const cases = [
      {
        nav: { mode: 'universe', gal: null, star: null, planet: null },
        view: null,
      },
      {
        nav: { mode: 'galaxy', gal, star: null, planet: null },
        view: { type: 'galaxy', gal: { ...gal }, harmlessLegacyField: true },
      },
      {
        nav: { mode: 'system', gal, star, planet: null },
        view: { type: 'star', gal: { ...gal }, star: { ...star } },
      },
      {
        nav: { mode: 'surface', gal, star, planet: { seed: 133, name: 'Earth' } },
        view: { type: 'planet', gal: { ...gal }, star: { ...star }, pseed: 133 },
      },
    ];
    for (const value of cases) {
      expect(isLegacySliceEnvelope(value), JSON.stringify(value)).toBe(true);
      expect(isPlausibleSaveEnvelope(value), 'slice bridge must stay distinct from whole-v4 proof').toBe(false);
      expect(importSaveV2(JSON.stringify(value), REGISTRY, NOW).ok).toBe(true);
    }
  });
  it('rejects sparse lookalikes, extra authority fields, and mismatched/non-finite slice identity', () => {
    const gal = { x: 90, y: -60, seed: 999 };
    const star = { x: 560, y: 170, seed: 424242 };
    const surface = {
      nav: { mode: 'surface', gal, star, planet: { seed: 133 } },
      view: { type: 'planet', gal: { ...gal }, star: { ...star }, pseed: 133 },
    };
    const bad: unknown[] = [
      null, [], {}, { view: null }, { nav: surface.nav },
      { ...surface, extra: true },
      { nav: { ...surface.nav, extra: true }, view: surface.view },
      { nav: { ...surface.nav, mode: 'planet' }, view: surface.view },
      { nav: { mode: 'universe', gal: null, star: null, planet: null }, view: {} },
      { nav: { mode: 'universe', gal, star: null, planet: null }, view: null },
      { nav: { mode: 'galaxy', gal, star: null, planet: null }, view: { type: 'star', gal } },
      { nav: { mode: 'galaxy', gal, star: null, planet: null }, view: { type: 'galaxy', gal: { ...gal, x: 91 } } },
      { nav: { mode: 'galaxy', gal: { ...gal, seed: '999' }, star: null, planet: null }, view: { type: 'galaxy', gal } },
      { nav: { mode: 'galaxy', gal: { ...gal, x: Number.NaN }, star: null, planet: null }, view: { type: 'galaxy', gal: { ...gal, x: Number.NaN } } },
      { nav: { mode: 'galaxy', gal: { ...gal, y: Number.POSITIVE_INFINITY }, star: null, planet: null }, view: { type: 'galaxy', gal: { ...gal, y: Number.POSITIVE_INFINITY } } },
      { nav: { mode: 'system', gal, star, planet: null }, view: { type: 'star', gal, star: { ...star, seed: 1 } } },
      { nav: { mode: 'system', gal, star, planet: { seed: 133 } }, view: { type: 'star', gal, star } },
      { nav: { ...surface.nav, planet: null }, view: surface.view },
      { nav: { ...surface.nav, planet: { seed: 134 } }, view: surface.view },
      { nav: surface.nav, view: { ...surface.view, pseed: '133' } },
    ];
    for (const value of bad) expect(isLegacySliceEnvelope(value), JSON.stringify(value)).toBe(false);
  });
  it('destructive-import envelope rejects sparse lookalikes but accepts real current and veteran saves', () => {
    for (const bad of [null, [], 1, 'x', true, {}, { view: null }, { codex: {} }, { epoch: 0 }, { epoch: 0, codex: [], land: {} }]) {
      expect(isPlausibleSaveEnvelope(bad), JSON.stringify(bad)).toBe(false);
    }
    expect(isPlausibleSaveEnvelope({ epoch: 0, codex: [], land: [] })).toBe(false);
    expect(isPlausibleSaveEnvelope({ v: 4, epoch: 0, codex: [], land: [] })).toBe(false);
    expect(isPlausibleSaveEnvelope({
      v: 4, epoch: 0, view: null, codex: [], land: [], items: [], log: [],
      pstats: {}, me: 'Explorer', hp: 1, essence: 0, asc: 0, ascp: {},
    })).toBe(false);
    const current = { ...(FX.inputs.veteran_rich as Record<string, unknown>), v: 4 };
    expect(isPlausibleSaveEnvelope(current)).toBe(true);
    expect(isPlausibleSaveEnvelope(FX.inputs.veteran_rich)).toBe(true);
    const oneBadField = { ...current, cargo: {} };
    expect(isPlausibleSaveEnvelope(oneBadField)).toBe(true);
    const repaired = importSaveV2(JSON.stringify(oneBadField), REGISTRY, NOW);
    expect(repaired.ok).toBe(true);
    if (repaired.ok) expect(repaired.state.cargo).toEqual([]);
  });
});
