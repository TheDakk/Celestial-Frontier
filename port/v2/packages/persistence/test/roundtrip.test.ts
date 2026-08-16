import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canon } from '../../../tests/parity.js';
import {
  importSaveV2, exportSaveV2, isPlausibleSaveEnvelope,
  createSaveRepository, createMemoryBackend, type ContentRegistry, type SaveStateV2,
} from '@cf/persistence';

/* ═══ THE ROUND-TRIP INVARIANT: import → export → import reaches a FIXED
   POINT after one pass. Round one legitimately moves data the way a live
   doSave does (thumb strip, land union, seen filter, bounded slices);
   from round two on, NOTHING may move — a field still drifting at round
   three is a lossy codec, the class of bug that silently eats saves. ═══ */

const here = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const FX = JSON.parse(fs.readFileSync(path.join(base, 'save-fixtures.json'), 'utf8')) as { inputs: Record<string, unknown> };
const REGISTRY = JSON.parse(fs.readFileSync(path.join(base, 'content-registry.json'), 'utf8')) as ContentRegistry;
const NOW = 1753900000000 + 60e3;

const importOk = (raw: string): SaveStateV2 => {
  const r = importSaveV2(raw, REGISTRY, NOW);
  expect(r.ok).toBe(true);
  return (r as { ok: true; state: SaveStateV2 }).state;
};

const FIXTURES = ['empty_object', 'veteran_rich', 'hostile_shapes', 'hostile_markup_caps',
  'pre_v17_veteran', 'hostile_arrays_as_objects', 'tut_midtraining', 'settings_spread', 'equip_integrity'] as const;

describe('import → export → import: the fixed point', () => {
  for (const name of FIXTURES) {
    it(`${name}: stable from round two on`, () => {
      const s1 = importOk(JSON.stringify(FX.inputs[name]));
      const s2 = importOk(exportSaveV2(s1, NOW));
      const s3 = importOk(exportSaveV2(s2, NOW));
      const c2 = canon(s2), c3 = canon(s3);
      if (c2 !== c3) {
        const o2 = JSON.parse(c2) as Record<string, unknown>, o3 = JSON.parse(c3) as Record<string, unknown>;
        const drift = Object.keys(o2).filter((k) => JSON.stringify(o2[k]) !== JSON.stringify(o3[k]));
        expect.fail('fields still drifting at round three (lossy codec): ' + drift.join(', '));
      }
    });
    it(`${name}: every app-produced export satisfies the boot envelope`, () => {
      const state = importOk(JSON.stringify(FX.inputs[name]));
      const exported = exportSaveV2(state, NOW);
      expect(isPlausibleSaveEnvelope(JSON.parse(exported)),
        'exportSaveV2 emitted bytes the next boot would classify as invalid').toBe(true);
    });
  }
  it('veteran_rich: the fields that must survive round ONE exactly (no live-write transform touches them)', () => {
    const s1 = importOk(JSON.stringify(FX.inputs.veteran_rich));
    const s2 = importOk(exportSaveV2(s1, NOW));
    for (const f of ['EPOCH_BASE', 'essence', 'explorerName', 'stats', 'pstats', 'hp',
      'cargo', 'cgx', 'items', 'equip', 'equipAff', 'customNames', 'journal', 'techOwned',
      'claimedSets', 'ascCh', 'ascProg', 'primeFill', 'chDone', 'chacc', 'chWeek', 'chProg',
      'tutDone', 'frontierUnlocked', 'frontierEnding', 'homeId', 'sfxVol', 'glassTint',
      'cardExpand', 'motionMode', 'fsMode', 'toneMode', 'fontMode', 'savedView'] as const) {
      expect(canon(s2[f as keyof SaveStateV2]), f).toBe(canon(s1[f as keyof SaveStateV2]));
    }
    /* Atlas thumbnails are the authorized first-pass transform; route bytes
       are not. Keep that distinction direct so deleting every destination
       cannot hide behind a stable second round. */
    expect(canon(s2.logMap.map(([id, entry]) => [id, entry.where])))
      .toBe(canon(s1.logMap.map(([id, entry]) => [id, entry.where])));
    /* the codex GENOMES are the crown jewels — byte-identical incl. the
       drifted size:9 (a lossy genome codec is the v1.8.6 corruption again) */
    expect(canon(s2.codex.map(([, e]) => e.g))).toBe(canon(s1.codex.map(([, e]) => e.g)));
    /* conquest: the GATE fields (tier, e) survive exactly. `t` is a display
       stamp whose anti-edit floor tracks the NEWEST save stamp — each
       save/load cycle legitimately drags ancient stamps up to the floor
       (real doSave behavior; first asserted wrongly as frozen, the test
       caught the spec error, not a bug). */
    expect(canon(s2.conquered.map(([k, r]) => [k, { tier: r.tier, e: r.e }])))
      .toBe(canon(s1.conquered.map(([k, r]) => [k, { tier: r.tier, e: r.e }])));
  });
  it('round one moves EXACTLY what doSave moves: thumb strip, land union, seen filter', () => {
    const s1 = importOk(JSON.stringify(FX.inputs.veteran_rich));
    const s2 = importOk(exportSaveV2(s1, NOW));
    /* p-prefixed Atlas thumb regenerates → stripped on export */
    expect((s1.logMap[0]![1] as { thumb: unknown }).thumb).toBeTruthy();
    expect((s2.logMap[0]![1] as { thumb: unknown }).thumb).toBeNull();
    /* land unions in conquered + mined keys */
    const l2 = new Set(s2.landed);
    for (const [k] of s1.conquered) expect(l2.has(k as number), 'conquered key in land').toBe(true);
    for (const [k] of s1.mined) expect(l2.has(k as number), 'mined key in land').toBe(true);
    /* seen filters to codex-held ids (the fixture's f1234 is not a codex id) */
    expect(s1.seenSp).toContain('f1234');
    expect(s2.seenSp).not.toContain('f1234');
  });
  it('current and rich Training snapshots survive the first pass without schema drift', () => {
    const view = {
      type: 'planet',
      gal: { x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, seed: 999, home: true },
      star: { x: 560, y: 170, seed: 424242 },
      pseed: 133,
    };
    for (const snapshot of [
      { view },
      { view, codex: [], essence: 10, marker: 'pre-training-expedition' },
    ]) {
      const s1 = importOk(JSON.stringify({ epoch: 0, tut: 0, tsnap: snapshot }));
      const raw2 = exportSaveV2(s1, NOW);
      const s2 = importOk(raw2);
      expect(canon(s2.tutSnapPending), JSON.stringify(snapshot)).toBe(canon(s1.tutSnapPending));
      expect(canon((JSON.parse(raw2) as { tsnap: unknown }).tsnap)).toBe(canon(snapshot));
    }
  });
  it('raw ingress evidence stays outside SaveStateV2 and exported v4 JSON', () => {
    const rawView = {
      type: 'planet',
      gal: { x: 90, y: -60, seed: 999, parentCell: { x: 0, y: 0 } },
      star: { x: 560, y: 170, seed: 424242, layer: 'coarse' },
      pseed: 133,
      key: 'raw-saved-view-key',
      ordinal: 2,
      proven: true,
    };
    const rawWhere = { ...rawView, key: 'raw-atlas-key' };
    const result = importSaveV2(JSON.stringify({
      epoch: 0, view: rawView, codex: [], land: [],
      log: [{ id: 'p133', title: 'Earth', where: rawWhere, t: 1 }],
    }), REGISTRY, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const entry = result.state.logMap[0]![1];
    const routeEvidence = {
      type: 'planet',
      gal: { x: 90, y: -60, seed: 999 },
      star: { x: 560, y: 170, seed: 424242 },
      pseed: 133,
    };
    expect(result.ingress.savedView).toEqual(routeEvidence);
    expect(result.ingress.atlasWhere.get(entry)).toEqual(routeEvidence);
    expect(Object.isFrozen(result.ingress.savedView)).toBe(true);
    expect(Object.isFrozen(result.ingress.atlasWhere.get(entry))).toBe(true);
    expect(result.state).not.toHaveProperty('ingress');
    const exported = JSON.parse(exportSaveV2(result.state, NOW)) as {
      ingress?: unknown;
      view: Record<string, unknown>;
      log: Array<{ where: Record<string, unknown> }>;
    };
    expect(exported).not.toHaveProperty('ingress');
    for (const route of [exported.view, exported.log[0]!.where]) {
      expect(route).not.toHaveProperty('key');
      expect(route).not.toHaveProperty('ordinal');
      expect(route).not.toHaveProperty('proven');
      expect(route.gal).not.toHaveProperty('parentCell');
      expect(route.star).not.toHaveProperty('layer');
    }
  });
  it('Atlas capacity keeps a newly charted timestamped row and evicts the oldest', () => {
    const state = importOk(JSON.stringify(FX.inputs.veteran_rich));
    state.logMap = Array.from({ length: 120 }, (_, i) => [
      'p' + i, { id: 'p' + i, title: 'old ' + i, t: i, where: null },
    ] as [string, Record<string, unknown>]);
    state.logMap.push(['p-new', { id: 'p-new', title: 'new', t: NOW, where: null }]);
    const output = JSON.parse(exportSaveV2(state, NOW)) as { log: Array<{ id: string }> };
    expect(output.log).toHaveLength(120);
    expect(output.log.some((row) => row.id === 'p-new')).toBe(true);
    expect(output.log.some((row) => row.id === 'p0')).toBe(false);
  });
});

describe('the repository flow, end to end (Phase 2 wiring)', () => {
  it('boot → import → promote → corrupt write → recover → import: the veteran survives', async () => {
    const repo = createSaveRepository(createMemoryBackend());
    /* a device writes the save; boot imports it; a PROVEN load promotes */
    await repo.write(JSON.stringify(FX.inputs.veteran_rich));
    const raw1 = await repo.readPrimary();
    const s1 = importOk(raw1!);
    await repo.promoteLastKnownGood(raw1!);
    /* a later write corrupts (quota, crash mid-write) */
    await repo.write('{"epoch": CORRUPT');
    expect(importSaveV2(await repo.readPrimary(), REGISTRY, NOW).ok).toBe(false);
    /* CF-RR-002: recovery restores the last payload that PROVED it loads */
    const recovered = await repo.recover((raw) => importSaveV2(raw, REGISTRY, NOW).ok);
    expect(recovered).toBeDefined();
    const s2 = importOk(recovered!);
    expect(canon(s2)).toBe(canon(s1));
    expect(s2.essence).toBe(5000);
  });
});
