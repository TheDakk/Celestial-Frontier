import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canon } from '../../../tests/parity.js';
import { importSaveV2, isPlausibleSaveEnvelope, type ContentRegistry, type SaveStateV2 } from '@cf/persistence';

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
  it('one malformed codex genome cannot reject the rest of a valid expedition', () => {
    const input = structuredClone(FX.inputs.veteran_rich) as { codex: Array<Record<string, unknown>> };
    const expected = importSaveV2(JSON.stringify(input), REGISTRY, NOW);
    expect(expected.ok).toBe(true);
    const expectedState = (expected as { ok: true; state: SaveStateV2 }).state;
    input.codex.unshift({ g: { seed: 8675309, kingdom: 'fauna', metab: -1 }, f: 'hostile row' });
    const recovered = importSaveV2(JSON.stringify(input), REGISTRY, NOW);
    expect(recovered.ok).toBe(true);
    const state = (recovered as { ok: true; state: SaveStateV2 }).state;
    expect(state.codex).toEqual(expectedState.codex);
    expect(state.essence).toBe(expectedState.essence);
    expect(state.landed).toEqual(expectedState.landed);
  });
  it('Atlas travel keeps complete star identity and rejects partial route identities', () => {
    const route = {
      type: 'planet',
      gal: { x: 90, y: -60, seed: 999, size: 14.5 },
      star: { x: 560, y: 170, seed: 424242 },
      pseed: 0,
    };
    const raw = { epoch: 0, codex: [], land: [], log: [
      { id: 'good', title: 'good', where: route },
      { id: 'bad-gal', title: 'bad', where: { type: 'galaxy', gal: {} } },
      { id: 'bad-star', title: 'bad', where: { type: 'star', gal: route.gal, star: { seed: 1 } } },
      { id: 'bad-planet', title: 'bad', where: { type: 'planet', gal: route.gal, star: route.star } },
    ] };
    const result = importSaveV2(JSON.stringify(raw), REGISTRY, NOW);
    expect(result.ok).toBe(true);
    const rows = new Map((result as { ok: true; state: SaveStateV2 }).state.logMap);
    expect(rows.get('good')?.where).toEqual(route);
    expect(rows.get('bad-gal')?.where).toBeNull();
    expect(rows.get('bad-star')?.where).toBeNull();
    expect(rows.get('bad-planet')?.where).toBeNull();
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
