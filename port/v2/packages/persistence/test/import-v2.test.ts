import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canon } from '../../../tests/parity.js';
import { importSaveV2, type ContentRegistry, type SaveStateV2 } from '@cf/persistence';

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
  'pre_v17_veteran', 'tut_midtraining', 'settings_spread', 'equip_integrity'] as const;

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
        if (got !== want[field]) bad.push(field + '\n  want ' + String(want[field]).slice(0, 220) + '\n  got  ' + got.slice(0, 220));
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
});
