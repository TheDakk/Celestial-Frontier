import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  ARC2_LOOT_NAMESPACE,
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC4_OWNERSHIP_MANIFEST_NAMESPACE,
  ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
  arc4OwnershipLegacyMirrorMatches,
  arc2LootLegacyMirrorMatches,
  canonicalizeV5Extensions,
  classifyLegacyTrainingCheckpointV1,
  exportSaveV2,
  importSaveV2,
  migrateLegacyOwnership,
  prepareArc4OwnershipLegacyMigration,
  prepareArc5OwnershipMigration,
  prepareArc2LootLegacyMigration,
  projectArc2LootLegacyMirror,
  type ContentRegistry,
  type LegacyTrainingCheckpointV1,
  type SaveStateV2,
} from '@cf/persistence';
import { navToView, resolveViewToNav } from '@cf/scene';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
} from '@cf/domain-acquisition';
import {
  buildLegacyTrainingRestoreCandidate,
  committedTrainingArc4State,
  committedTrainingArc5State,
  committedTrainingArc2State,
  prepareTrainingArc4Restore,
  prepareTrainingArc5Restore,
  prepareTrainingArc2Restore,
  type PreparedTrainingArc4Restore,
  type PreparedTrainingArc5Restore,
} from '../apps/game/src/training-restore.js';

interface TrainingFixture {
  snapshot: Record<string, unknown>;
}
interface SaveFixtures {
  inputs: Record<string, Record<string, unknown>>;
}

const baselineUrl = new URL('../../baseline-v1.8.9/', import.meta.url);
const fixture = JSON.parse(fs.readFileSync(
  fileURLToPath(new URL('training-restart-fixture.json', baselineUrl)),
  'utf8',
)) as TrainingFixture;
const saves = JSON.parse(fs.readFileSync(
  fileURLToPath(new URL('save-fixtures.json', baselineUrl)),
  'utf8',
)) as SaveFixtures;
const registry = JSON.parse(fs.readFileSync(
  fileURLToPath(new URL('content-registry.json', baselineUrl)),
  'utf8',
)) as ContentRegistry;
const veteranRaw = saves.inputs.veteran_rich!;
const NOW = 1_753_900_060_000;
const COMMIT_EPOCH = 8_765;
const MAIN_SOURCE = fs.readFileSync(
  fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)),
  'utf8',
);

beforeAll(() => installCaptureHooks());

function importVeteran(): SaveStateV2 {
  const imported = importSaveV2(JSON.stringify(veteranRaw), registry, NOW);
  if (!imported.ok) throw new Error(`veteran fixture did not import: ${imported.reason}`);
  return imported.state;
}

function checkpointFrom(value: unknown = fixture.snapshot): LegacyTrainingCheckpointV1 {
  const checkpoint = classifyLegacyTrainingCheckpointV1(value);
  if (!checkpoint) throw new Error('fixture did not classify as a legacy Training checkpoint');
  return checkpoint;
}

function canonicalView(value: unknown): Record<string, unknown> {
  const resolved = resolveViewToNav(value);
  if (!resolved.ok) throw new Error(`fixture view did not source-prove: ${resolved.reason}`);
  const view = navToView(resolved.state);
  if (!view) throw new Error('fixture route unexpectedly resolved to Cosmos');
  return view;
}

function canonicalViews(): {
  earth: Record<string, unknown>;
  completion: Record<string, unknown>;
} {
  const earth = canonicalView(veteranRaw.view);
  const completionRaw = structuredClone(veteranRaw.view) as Record<string, unknown>;
  completionRaw.type = 'star';
  delete completionRaw.pseed;
  return { earth, completion: canonicalView(completionRaw) };
}

interface TrainingCurrent {
  current: SaveStateV2;
  nonEarthRow: [string, Record<string, unknown>];
  nonEarthEntry: Record<string, unknown>;
  trainingEarth: Record<string, unknown>;
}

function trainingCurrent(checkpoint: LegacyTrainingCheckpointV1): TrainingCurrent {
  const base = importVeteran();
  const nonEarthEntry: Record<string, unknown> = {
    id: 'p900', title: 'Outer sentinel', sub: 'Must keep identity', badge: 'Held',
    star: 'Elsewhere', thumb: null, sq: false, fav: false, t: NOW - 20,
    where: { type: 'planet', gal: { x: 1, y: 2, seed: 3 }, star: { x: 4, y: 5, seed: 6 }, pseed: 900 },
  };
  const nonEarthRow: [string, Record<string, unknown>] = ['p900', nonEarthEntry];
  const trainingEarth: Record<string, unknown> = {
    id: 'p133', title: 'Earth', sub: 'Training stub', badge: 'Surveyed',
    star: 'Current Sol', thumb: 'training-thumb', sq: true, fav: false, t: NOW,
    where: { type: 'planet', gal: { x: 99, y: 99, seed: 999 }, star: { x: 0, y: 0, seed: 424242 }, pseed: 133 },
  };
  const current: SaveStateV2 = {
    ...base,
    EPOCH_BASE: 77,
    stats: {
      ...base.stats,
      shares: 999, jumps: 999, hybrids: 99, best: 99, maxGen: 99, surveys: 99,
    },
    pstats: { vit: 330, fer: 330, res: 330, agi: 330, ins: 330 },
    HP_MAX: 660,
    hp: 55,
    essence: 1,
    unlocked: ['training-only'],
    codex: [],
    cargo: [['Au', 1]],
    cgx: [['Au', 1]],
    items: [['visor', 1]],
    equip: { helmet: 'visor' },
    equipAff: {},
    conquered: [[902, { t: NOW - 10, tier: 2 }]],
    landed: [901],
    mined: [[903, NOW - 30]],
    surveyedSet: ['outer:a', 'outer:b', 'outer:c', 'outer:d'],
    journal: [{ s: 7, n: 'Outer journal', w: 'Sentinel', t: NOW - 50 }],
    notifications: [{ id: 71, tt: 'Outer', ms: 'Sentinel', t: NOW - 60, read: false }],
    primeFill: {
      stone: { title: 'Outer Prime', sub: 'Sentinel', tier: 1, hex: '#abcdef', where: null },
    },
    logMap: [nonEarthRow, ['p133', trainingEarth]],
    homeId: null,
    savedView: null,
    tutDone: false,
    tutSnapPending: checkpoint,
  };
  return { current, nonEarthRow, nonEarthEntry, trainingEarth };
}

function restore(
  current: SaveStateV2,
  checkpoint: LegacyTrainingCheckpointV1,
) {
  const views = canonicalViews();
  const viewsBefore = JSON.stringify(views);
  const result = buildLegacyTrainingRestoreCandidate({
    current,
    checkpoint,
    registry,
    now: NOW,
    epoch: COMMIT_EPOCH,
    canonicalEarthView: views.earth,
    completionView: views.completion,
  });
  if (!result.ok) throw new Error('legacy Training restore candidate was refused');
  return { ...result, views, viewsBefore };
}

function allObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== 'object') return keys;
  if (Array.isArray(value)) {
    for (const item of value) allObjectKeys(item, keys);
    return keys;
  }
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    allObjectKeys(child, keys);
  }
  return keys;
}

describe('legacy Field Training checkpoint restoration candidate', () => {
  it('keeps the Arc 2 write inside Training single-write durability and publishes it afterward', () => {
    const start = MAIN_SOURCE.indexOf('async function completeTraining(');
    const end = MAIN_SOURCE.indexOf("const F4_FRESH_RACE_RELEASE_KEY", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const source = MAIN_SOURCE.slice(start, end);
    const prepare = source.indexOf('prepareTrainingArc2Restore(');
    const write = source.indexOf('await f4Runtime!.commit(');
    const coupled = source.indexOf('[preparedLoot.write]', write);
    const durable = source.indexOf('durablyWritten = true', write);
    const injectedPostDurable = source.indexOf('smokeRejectNextTrainingPublish', durable);
    const verify = source.indexOf('committedTrainingArc2State(', injectedPostDurable);
    const publishSave = source.indexOf('save = prepared.state', verify);
    const publishLoot = source.indexOf('arc2LootState = restoredLoot', publishSave);
    const publishPanel = source.indexOf('inventoryPanelController.setState(arc2LootState)', publishLoot);
    const anchors = [
      prepare, write, coupled, durable, injectedPostDurable,
      verify, publishSave, publishLoot, publishPanel,
    ];
    expect(anchors.every((anchor) => anchor >= 0)).toBe(true);
    for (let index = 1; index < anchors.length; index++) {
      expect(anchors[index]).toBeGreaterThan(anchors[index - 1]!);
    }
  });

  it('restores exactly checkpoint-owned state while retaining outer expedition identity', () => {
    const checkpoint = checkpointFrom();
    const { current, nonEarthRow, nonEarthEntry, trainingEarth } = trainingCurrent(checkpoint);
    const currentBefore = JSON.stringify(current);
    const checkpointBefore = JSON.stringify(checkpoint);
    const { state, earthEntry, views, viewsBefore } = restore(current, checkpoint);

    expect(state).not.toBe(current);
    expect(state.EPOCH_BASE).toBe(COMMIT_EPOCH);
    expect(state.savedView).toBe(views.completion);
    expect(state.tutDone).toBe(true);
    expect(state.tutSnapPending).toBeNull();
    expect(state.homeId).toBe('p133');

    const directStats = [
      'shares', 'jumps', 'anomalies', 'events', 'duels', 'duelwins',
      'breeds', 'breedwins', 'feeds', 'feedfails', 'harvests',
      'essenceEarned', 'guardians', 'paragons', 'mines', 'crafts',
      'minedout', 'skims', 'cosmics', 'landings', 'charters', 'bestRank',
    ] as const;
    for (const key of directStats) expect(state.stats[key], key).toBe(checkpoint.st[key]);
    expect(state.stats.surveys).toBe(current.surveyedSet.length);
    expect(state.stats.hybrids).toBe(checkpoint.st.hybrids);
    expect(state.stats.maxGen).toBe(checkpoint.st.maxGen);
    expect(state.stats.best).toBe(checkpoint.st.best);
    expect(state.stats).toMatchObject({
      surveys: 4,
      hybrids: 1,
      best: 4,
      maxGen: 3,
      arrivals: current.sysSeen.length,
    });

    expect(state.pstats).toEqual({ vit: 80, fer: 60, res: 70, agi: 50, ins: 40 });
    expect(state.HP_MAX).toBe(160);
    expect(state.hp).toBe(55);
    expect(state.unlocked).toEqual(['first', 'field10', 'fake']);
    expect(state.essence).toBe(5_000);
    expect(state.codex.map(([id]) => id)).toEqual(['s1234', 's777', 's4242']);
    const longBloodline = state.codex.find(([id]) => id === 's4242')?.[1].g;
    expect(longBloodline).toMatchObject({ seed: 4242, size: 9, gen: 3, parents: [1, 2] });
    expect(state.cargo).toEqual([['Fe', 40], ['Si', 12]]);
    expect(state.cgx).toEqual([['Fe', 5], ['Si', 12]]);
    expect(state.items).toEqual([['plate', 3], ['lens', 1], ['cell', 2], ['headlamp', 1]]);
    expect(state.equip).toEqual({ helmet: 'headlamp' });
    expect(state.equipAff).toEqual({ helmet: { k: 'strike', v: 0.05, forId: 'headlamp' } });

    expect(earthEntry).not.toBe(trainingEarth);
    expect(earthEntry).toMatchObject({
      id: 'p133', title: 'Earth', sub: 'The cradle', badge: 'Home',
      star: 'Current Sol', fav: true, t: 1_753_899_100_000,
    });
    expect(earthEntry.where).toBe(views.earth);
    expect((earthEntry.where as { star: { x: number; y: number } }).star).toEqual(
      expect.objectContaining({ x: 560, y: 170 }),
    );
    expect((checkpoint.e?.where as { star: { x: number; y: number } }).star).toEqual(
      expect.objectContaining({ x: 0, y: 0 }),
    );

    expect(state.logMap).not.toBe(current.logMap);
    expect(state.logMap[0]).toBe(nonEarthRow);
    expect(state.logMap[0]![1]).toBe(nonEarthEntry);
    const unrelatedIdentityFields = [
      'customNames', 'conquered', 'landed', 'mined', 'surveyedSet',
      'journal', 'notifications', 'primeFill', 'seenSp', 'techOwned',
    ] as const;
    for (const key of unrelatedIdentityFields) expect(state[key], key).toBe(current[key]);
    expect(state.conquered.some(([id]) => id === 133)).toBe(false);
    expect(state.landed.includes(133)).toBe(false);
    expect(state.unlocked).not.toContain('training-only');

    expect(JSON.stringify(current)).toBe(currentBefore);
    expect(JSON.stringify(checkpoint)).toBe(checkpointBefore);
    expect(JSON.stringify(views)).toBe(viewsBefore);

    const raw = exportSaveV2(state, NOW);
    const exported = JSON.parse(raw) as Record<string, unknown>;
    expect(exported.tut).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(exported, 'tsnap')).toBe(false);
    expect(exported.ach).toEqual(['first', 'field10', 'fake']);
    expect(exported.conq).toEqual(current.conquered);
    expect(exported.land).not.toContain(133);
    const exportedEarth = (exported.log as Array<Record<string, unknown>>)
      .find((entry) => entry.id === 'p133');
    expect(exportedEarth?.where).toEqual(views.earth);
    const keys = allObjectKeys(exported);
    for (const privateKey of ['parentCell', 'ordinal', 'layer', 'format']) {
      expect(keys.has(privateKey), privateKey).toBe(false);
    }
  });

  it('durably retains cumulative records after their record holders are gone', () => {
    const rawCheckpoint = structuredClone(fixture.snapshot);
    const rawStats = rawCheckpoint.st as Record<string, unknown>;
    rawStats.hybrids = 17;
    rawStats.best = 8;
    rawStats.maxGen = 12;
    rawStats.scanhits = 23;
    const checkpoint = checkpointFrom(rawCheckpoint);
    const { current } = trainingCurrent(checkpoint);
    const { state } = restore(current, checkpoint);

    const derived = {
      hybrids: state.codex.filter(([, entry]) => entry.hybrid).length,
      best: Math.max(...state.codex.map(([, entry]) => entry.tier ?? 0)),
      maxGen: Math.max(...state.codex.map(([, entry]) => Number(entry.g.gen) || 0)),
    };
    expect(derived).toEqual({ hybrids: 1, best: 4, maxGen: 3 });
    expect(state.stats).toMatchObject({ hybrids: 17, best: 8, maxGen: 12, scanhits: 23 });

    const committed = exportSaveV2(state, NOW);
    expect((JSON.parse(committed) as Record<string, unknown>).ever).toEqual({
      v: 1,
      hybrids: 17,
      best: 8,
      maxGen: 12,
      scanhits: 23,
      arrivals: current.sysSeen.length,
    });
    const reloaded = importSaveV2(committed, registry, NOW);
    expect(reloaded.ok).toBe(true);
    if (!reloaded.ok) return;
    expect(reloaded.state.stats).toMatchObject({
      hybrids: 17,
      best: 8,
      maxGen: 12,
      scanhits: 23,
      arrivals: current.sysSeen.length,
    });

    const withoutCarrier = JSON.parse(committed) as Record<string, unknown>;
    delete withoutCarrier.ever;
    const demoted = importSaveV2(JSON.stringify(withoutCarrier), registry, NOW);
    expect(demoted.ok).toBe(true);
    if (!demoted.ok) return;
    expect(demoted.state.stats).toMatchObject(derived);
    expect(Object.prototype.hasOwnProperty.call(demoted.state.stats, 'scanhits')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(demoted.state.stats, 'arrivals')).toBe(false);

    const underReported = JSON.parse(committed) as Record<string, unknown>;
    underReported.ever = {
      v: 1,
      hybrids: 0,
      best: 0,
      maxGen: 0,
      scanhits: 11,
      arrivals: 999_999,
    };
    const sourceFloor = importSaveV2(JSON.stringify(underReported), registry, NOW);
    expect(sourceFloor.ok).toBe(true);
    if (!sourceFloor.ok) return;
    expect(sourceFloor.state.stats).toMatchObject({
      ...derived,
      scanhits: 11,
      arrivals: current.sysSeen.length,
    });

    const wrongVersion = JSON.parse(committed) as Record<string, unknown>;
    wrongVersion.ever = { v: 2, hybrids: 17, best: 8, maxGen: 12 };
    const versionRejected = importSaveV2(JSON.stringify(wrongVersion), registry, NOW);
    expect(versionRejected).toEqual({ ok: false, reason: 'future-version' });

    const malformed = JSON.parse(committed) as Record<string, unknown>;
    malformed.ever = {
      v: 1,
      hybrids: 17,
      best: '8',
      maxGen: 12,
      scanhits: -1,
      arrivals: 2,
    };
    const malformedRejected = importSaveV2(JSON.stringify(malformed), registry, NOW);
    expect(malformedRejected.ok).toBe(true);
    if (!malformedRejected.ok) return;
    expect(malformedRejected.state.stats).toMatchObject({
      hybrids: 17,
      best: derived.best,
      maxGen: 12,
      arrivals: current.sysSeen.length,
    });
    expect(Object.prototype.hasOwnProperty.call(malformedRejected.state.stats, 'scanhits')).toBe(false);

    const overCap = JSON.parse(committed) as Record<string, unknown>;
    overCap.ever = {
      v: 1,
      hybrids: 1_000_000_001,
      best: registry.tierMax + 1,
      maxGen: 1_000_000_001,
      scanhits: 1_000_000_001,
      arrivals: 1_000_000_001,
    };
    const capped = importSaveV2(JSON.stringify(overCap), registry, NOW);
    expect(capped.ok).toBe(true);
    if (!capped.ok) return;
    expect(capped.state.stats).toMatchObject({
      hybrids: 1_000_000_000,
      best: registry.tierMax,
      maxGen: 1_000_000_000,
      scanhits: 1_000_000_000,
      arrivals: current.sysSeen.length,
    });
  });

  it('sanitizes malformed checkpoint-owned values without mutating their evidence', () => {
    const malformed = structuredClone(fixture.snapshot);
    const stats = malformed.st as Record<string, unknown>;
    stats.shares = '12';
    stats.jumps = 'not-a-number';
    stats.bestRank = 99_999;
    malformed.ps = { vit: 9_999, fer: -10, res: 2.7, agi: 'bad', ins: null };
    malformed.es = -25;
    malformed.ca = [['Fe', 2_000_000], ['not-a-material', 7]];
    malformed.cx = [['Fe', 9_000_000], ['not-a-material', 7]];
    malformed.it = [['headlamp', 5_000], ['not-an-item', 2]];
    malformed.eq = { helmet: 'headlamp', tool: 'not-an-item' };
    malformed.ea = {
      helmet: { k: 'strike', v: 99, forId: 'headlamp' },
      tool: { k: 'yield', v: 99, forId: 'not-an-item' },
    };
    (malformed.c as unknown[]).push(null);
    malformed.e = {
      ...(malformed.e as Record<string, unknown>),
      sub: 'S'.repeat(180), badge: 'B'.repeat(30), star: 'A'.repeat(40), t: '123',
    };
    const checkpoint = checkpointFrom(malformed);
    const evidenceBefore = JSON.stringify(checkpoint);
    const { current } = trainingCurrent(checkpoint);
    const { state, earthEntry } = restore(current, checkpoint);

    expect(state.stats.shares).toBe(12);
    expect(state.stats.jumps).toBe(0);
    expect(state.stats.bestRank).toBe(registry.rankHuesLen - 1);
    expect(state.pstats).toEqual({ vit: 330, fer: 1, res: 3, agi: 50, ins: 50 });
    expect(state.HP_MAX).toBe(660);
    expect(state.hp).toBe(55);
    expect(state.essence).toBe(0);
    expect(state.codex).toHaveLength(3);
    expect(state.codex.find(([id]) => id === 's4242')?.[1].g).toMatchObject({
      size: 9, parents: [1, 2],
    });
    expect(state.cargo).toEqual([['Fe', 1_000_000]]);
    expect(state.cgx).toEqual([['Fe', 1_000_000]]);
    expect(state.items).toEqual([['headlamp', 999]]);
    expect(state.equip).toEqual({ helmet: 'headlamp' });
    expect(state.equipAff).toEqual({ helmet: { k: 'strike', v: 0.06, forId: 'headlamp' } });
    expect(earthEntry).toMatchObject({
      sub: 'S'.repeat(120), badge: 'B'.repeat(18), star: 'A'.repeat(24), t: 123,
    });
    expect(JSON.stringify(checkpoint)).toBe(evidenceBefore);
  });

  it('clamps HP down to the restored Vitality ceiling but never heals a lower value', () => {
    const checkpoint = checkpointFrom();
    const low = trainingCurrent(checkpoint).current;
    expect(restore(low, checkpoint).state.hp).toBe(55);

    const high: SaveStateV2 = { ...trainingCurrent(checkpoint).current, hp: 600 };
    const restored = restore(high, checkpoint).state;
    expect(restored.HP_MAX).toBe(160);
    expect(restored.hp).toBe(160);
    expect(high.hp).toBe(600);
  });

  it('handles a legacy null Earth row with and without retained live history', () => {
    const rawCheckpoint = structuredClone(fixture.snapshot);
    rawCheckpoint.e = null;
    const checkpoint = checkpointFrom(rawCheckpoint);

    const withLiveEarth = trainingCurrent(checkpoint).current;
    const retained = restore(withLiveEarth, checkpoint).earthEntry;
    expect(retained).toMatchObject({
      id: 'p133',
      title: 'Earth',
      sub: 'Training stub',
      badge: 'Surveyed',
      star: 'Current Sol',
      fav: false,
      t: NOW,
    });
    expect(retained.where).toEqual(canonicalViews().earth);

    const withoutLiveEarth = trainingCurrent(checkpoint).current;
    withoutLiveEarth.logMap = withoutLiveEarth.logMap.filter(([id]) => id !== 'p133');
    withoutLiveEarth.homeId = null;
    const created = restore(withoutLiveEarth, checkpoint);
    expect(created.earthEntry).toMatchObject({
      id: 'p133',
      title: 'Earth',
      sub: 'Terran World',
      badge: 'Home',
      star: '',
      fav: false,
      t: NOW,
    });
    expect(created.earthEntry.where).toEqual(canonicalViews().earth);
    expect(created.state.homeId).toBe('p133');
    expect(created.state.logMap.filter(([id]) => id === 'p133')).toHaveLength(1);
  });

  it('reserves one capped Atlas slot for checkpoint-owned Earth history', () => {
    const checkpoint = checkpointFrom();
    const current = trainingCurrent(checkpoint).current;
    const earth = current.logMap.find(([id]) => id === 'p133')!;
    current.logMap = Array.from({ length: 130 }, (_, index) => [
      `p${10_000 + index}`,
      {
        id: `p${10_000 + index}`, title: `Newer ${index}`, sub: '', badge: '',
        thumb: null, sq: false, fav: false, t: NOW + index + 1, where: null,
      },
    ] as [string, Record<string, unknown>]).concat([earth]);

    const restored = restore(current, checkpoint).state;
    expect(restored.logMap).toHaveLength(120);
    expect(restored.logMap.filter(([id]) => id === 'p133')).toHaveLength(1);
    expect(restored.logMap.some(([id]) => id === 'p10000')).toBe(false);
    expect(restored.logMap.some(([id]) => id === 'p10129')).toBe(true);
    const exported = JSON.parse(exportSaveV2(restored, NOW)) as {
      log: Array<Record<string, unknown>>;
    };
    expect(exported.log).toHaveLength(120);
    expect(exported.log.some((entry) => entry.id === 'p133')).toBe(true);
  });

  it('couples restored checkpoint gear to one exact Arc 2 carrier and publishes only matching durable bytes', () => {
    const checkpoint = checkpointFrom();
    const current = trainingCurrent(checkpoint).current;
    const restoredState = restore(current, checkpoint).state;
    const baseExtensions = canonicalizeV5Extensions({
      player: {
        'f4.authority': {
          version: 1,
          json: '{"activePlayMs":77,"sessionRng":{"seed":5,"ordinal":3,"draws":{"prior":2}}}',
        },
        'future.player': { version: 41, json: '{"opaque":"keep"}' },
      },
      settings: { 'arc7.audio': { version: 2, json: '{"gain":0.4}' } },
    });
    const old = prepareArc2LootLegacyMigration({
      extensions: baseExtensions,
      legacy: current,
      capacity: 200,
    });
    if (old.kind !== 'prepared') throw new Error(`old Training carrier was ${old.kind}`);
    const oldBytes = JSON.stringify(old.extensions);

    expect(prepareTrainingArc2Restore('none', false, restoredState, old.extensions)).toBeNull();
    expect(prepareTrainingArc2Restore('current-view', false, restoredState, old.extensions)).toBeNull();
    expect(prepareTrainingArc2Restore('legacy-v1', false, restoredState, old.extensions)).toBeNull();
    const prepared = prepareTrainingArc2Restore('legacy-v1', true, restoredState, old.extensions);
    expect(prepared?.kind).toBe('prepared');
    if (prepared?.kind !== 'prepared') return;
    expect(JSON.stringify(old.extensions)).toBe(oldBytes);
    expect(prepared.write.carrier).not.toEqual(old.write.carrier);
    expect(prepared.extensions.player).toEqual(baseExtensions.player);
    expect(prepared.extensions.settings).toEqual(baseExtensions.settings);
    expect(prepared.extensions.inventory?.[ARC2_LOOT_NAMESPACE]).toEqual(prepared.write.carrier);
    expect(projectArc2LootLegacyMirror(prepared.state)).toEqual({
      items: restoredState.items,
      equip: restoredState.equip,
      equipAff: restoredState.equipAff,
    });
    expect(arc2LootLegacyMirrorMatches(prepared.state, restoredState)).toBe(true);

    const published = committedTrainingArc2State(restoredState, prepared, prepared.extensions);
    expect(published).toEqual(prepared.state);
    expect(committedTrainingArc2State(restoredState, prepared, old.extensions)).toBeNull();
    expect(committedTrainingArc2State(current, prepared, prepared.extensions)).toBeNull();

    const wrongCarrier = canonicalizeV5Extensions({
      ...prepared.extensions,
      inventory: {
        ...prepared.extensions.inventory,
        [ARC2_LOOT_NAMESPACE]: old.write.carrier,
      },
    });
    expect(committedTrainingArc2State(restoredState, prepared, wrongCarrier)).toBeNull();

    const future = canonicalizeV5Extensions({ inventory: {
      [ARC2_LOOT_NAMESPACE]: { version: 2, json: '{"opaque":"future"}' },
    } });
    expect(prepareTrainingArc2Restore('legacy-v1', true, restoredState, future)).toEqual({
      kind: 'protected', reason: 'target-future', version: 2,
    });
    const corrupt = canonicalizeV5Extensions({ inventory: {
      [ARC2_LOOT_NAMESPACE]: { version: 1, json: '{"kind":"inventory"}' },
    } });
    expect(prepareTrainingArc2Restore('legacy-v1', true, restoredState, corrupt)).toEqual({
      kind: 'protected', reason: 'target-corrupt',
    });
  });

  it('bootstraps restored legacy ownership once and verifies all 18 durable carriers plus its mirror', () => {
    const checkpoint = checkpointFrom();
    const current = trainingCurrent(checkpoint).current;
    const restoredState = restore(current, checkpoint).state;
    const baseExtensions = canonicalizeV5Extensions({
      player: {
        'f4.authority': {
          version: 1,
          json: '{"activePlayMs":77,"sessionRng":{"seed":5,"ordinal":3,"draws":{"prior":2}}}',
        },
      },
      inventory: { 'arc2.keep': { version: 1, json: '{"exact":"inventory"}' } },
      settings: { 'arc7.audio': { version: 2, json: '{"gain":0.4}' } },
    });

    expect(prepareTrainingArc4Restore('none', false, restoredState, baseExtensions)).toBeNull();
    expect(prepareTrainingArc4Restore('current-view', false, restoredState, baseExtensions)).toBeNull();
    expect(prepareTrainingArc4Restore('source-deferred', false, restoredState, baseExtensions)).toBeNull();
    expect(prepareTrainingArc4Restore('legacy-or-unknown', false, restoredState, baseExtensions)).toBeNull();
    expect(prepareTrainingArc4Restore('legacy-v1', false, restoredState, baseExtensions)).toBeNull();

    const prepared = prepareTrainingArc4Restore(
      'legacy-v1', true, restoredState, baseExtensions,
    );
    expect(prepared?.kind).toBe('prepared');
    if (prepared?.kind !== 'prepared') return;
    expect(prepared.migration).toBe('migrated');
    const migrated = migrateLegacyOwnership(restoredState);
    expect(migrated.kind).toBe('migrated');
    if (migrated.kind !== 'migrated') return;
    expect(prepared.migrationSourceEvidence).toEqual(migrated.sourceEvidence);
    expect(prepared.writes).toHaveLength(ARC4_OWNERSHIP_EXTENSION_TARGETS.length);
    expect(prepared.writes).toHaveLength(18);
    expect(prepared.extensions.settings).toEqual(baseExtensions.settings);
    expect(prepared.extensions.inventory?.['arc2.keep']).toEqual(
      baseExtensions.inventory?.['arc2.keep'],
    );
    expect(arc4OwnershipLegacyMirrorMatches(prepared.state, restoredState)).toBe(true);
    expect(committedTrainingArc4State(restoredState, prepared, prepared.extensions)).toEqual(
      prepared.state,
    );
    const changedEpoch = { ...restoredState, EPOCH_BASE: restoredState.EPOCH_BASE + 1 };
    expect(arc4OwnershipLegacyMirrorMatches(prepared.state, changedEpoch)).toBe(true);
    const changedEpochMigration = migrateLegacyOwnership(changedEpoch);
    expect(changedEpochMigration.kind).toBe('migrated');
    if (changedEpochMigration.kind !== 'migrated') return;
    expect(ownershipStateDigestV1(changedEpochMigration.state))
      .toBe(ownershipStateDigestV1(prepared.state));
    expect(changedEpochMigration.sourceEvidence.digest)
      .not.toBe(prepared.migrationSourceEvidence?.digest);
    expect(committedTrainingArc4State(
      changedEpoch,
      prepared,
      prepared.extensions,
    )).toBeNull();
    expect(committedTrainingArc4State(current, prepared, prepared.extensions)).toBeNull();
    expect(committedTrainingArc4State(restoredState, prepared, baseExtensions)).toBeNull();
    expect(committedTrainingArc4State(restoredState, {
      ...prepared,
      migration: 'legacy-protected',
    }, prepared.extensions)).toBeNull();
    const currentMissingMigration = { ...prepared } as Record<string, unknown>;
    delete currentMissingMigration.migration;
    expect(committedTrainingArc4State(
      restoredState,
      currentMissingMigration as unknown as PreparedTrainingArc4Restore,
      prepared.extensions,
    )).toBeNull();
    const currentMissingEvidence = { ...prepared } as Record<string, unknown>;
    delete currentMissingEvidence.migrationSourceEvidence;
    expect(committedTrainingArc4State(
      restoredState,
      currentMissingEvidence as unknown as PreparedTrainingArc4Restore,
      prepared.extensions,
    )).toBeNull();
    expect(committedTrainingArc4State(restoredState, {
      ...prepared,
      migrationSourceEvidence: {
        ...prepared.migrationSourceEvidence!,
        digest: '0'.repeat(64),
      },
    }, prepared.extensions)).toBeNull();
    let evidenceGetterReads = 0;
    const hostileEvidence = { ...prepared } as Record<string, unknown>;
    Object.defineProperty(hostileEvidence, 'migrationSourceEvidence', {
      enumerable: true,
      get() {
        evidenceGetterReads++;
        return prepared.migrationSourceEvidence;
      },
    });
    expect(committedTrainingArc4State(
      restoredState,
      hostileEvidence as unknown as PreparedTrainingArc4Restore,
      prepared.extensions,
    )).toBeNull();
    expect(evidenceGetterReads).toBe(0);
    expect(committedTrainingArc4State(restoredState, {
      ...prepared,
      writes: prepared.writes.slice(0, -1),
    } as PreparedTrainingArc4Restore, prepared.extensions)).toBeNull();
    expect(committedTrainingArc4State(restoredState, {
      ...prepared,
      writes: [prepared.writes[1]!, prepared.writes[0]!, ...prepared.writes.slice(2)],
    } as PreparedTrainingArc4Restore, prepared.extensions)).toBeNull();
    expect(committedTrainingArc4State(restoredState, {
      ...prepared,
      writes: [...prepared.writes, prepared.writes[0]!],
    } as PreparedTrainingArc4Restore, prepared.extensions)).toBeNull();

    const corruptCommitted = canonicalizeV5Extensions({
      ...prepared.extensions,
      player: {
        ...prepared.extensions.player,
        [ARC4_OWNERSHIP_MANIFEST_NAMESPACE]: { version: 1, json: '{}' },
      },
    });
    expect(committedTrainingArc4State(restoredState, prepared, corruptCommitted)).toBeNull();

    const existing = prepareArc4OwnershipLegacyMigration({
      extensions: baseExtensions,
      legacy: current,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (existing.kind !== 'prepared') throw new Error(`existing ownership was ${existing.kind}`);
    const existingBytes = JSON.stringify(existing.extensions);
    expect(prepareTrainingArc4Restore(
      'legacy-v1', true, restoredState, existing.extensions,
    )).toEqual({
      kind: 'protected', reason: 'target-loaded', mode: existing.state.mode,
      actualRevision: existing.state.revision,
    });
    expect(JSON.stringify(existing.extensions)).toBe(existingBytes);

    const existingManifest = existing.extensions.player![ARC4_OWNERSHIP_MANIFEST_NAMESPACE]!;
    const future = canonicalizeV5Extensions({
      ...existing.extensions,
      player: {
        ...existing.extensions.player,
        [ARC4_OWNERSHIP_MANIFEST_NAMESPACE]: { ...existingManifest, version: 2 },
      },
    });
    expect(prepareTrainingArc4Restore('legacy-v1', true, restoredState, future)).toEqual({
      kind: 'protected', reason: 'target-future', version: 2,
    });
    const corrupt = canonicalizeV5Extensions({
      ...existing.extensions,
      player: {
        ...existing.extensions.player,
        [ARC4_OWNERSHIP_MANIFEST_NAMESPACE]: { version: 1, json: '{}' },
      },
    });
    expect(prepareTrainingArc4Restore('legacy-v1', true, restoredState, corrupt)).toEqual({
      kind: 'protected', reason: 'target-corrupt',
    });
  });

  it('couples one fresh Arc 5 certificate to Training legacy replacement and verifies durable Arc 4 + Arc 5', () => {
    const checkpoint = checkpointFrom();
    const restoredState = restore(trainingCurrent(checkpoint).current, checkpoint).state;
    const baseExtensions = canonicalizeV5Extensions({
      player: {
        'f4.authority': {
          version: 1,
          json: '{"activePlayMs":77,"sessionRng":{"seed":5,"ordinal":3,"draws":{"prior":2}}}',
        },
      },
      inventory: { 'arc2.keep': { version: 1, json: '{"exact":"inventory"}' } },
      settings: { 'arc7.audio': { version: 2, json: '{"gain":0.4}' } },
    });
    const arc4 = prepareTrainingArc4Restore(
      'legacy-v1', true, restoredState, baseExtensions,
    );
    expect(arc4?.kind).toBe('prepared');
    if (arc4?.kind !== 'prepared') return;
    const arc5 = prepareTrainingArc5Restore({
      checkpointKind: 'legacy-v1',
      legacyFieldsRestored: true,
      baseExtensions,
      arc4Preparation: arc4,
    });
    expect(arc5.kind).toBe('prepared');
    if (arc5.kind !== 'prepared') return;
    expect(arc5.writes).toHaveLength(1);
    expect(arc5.writes[0]).toMatchObject({
      segment: 'player', namespace: ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
    });
    expect(arc5.extensions.player?.[ARC5_OWNERSHIP_MIGRATION_NAMESPACE])
      .toEqual(arc5.writes[0]!.carrier);
    expect(arc5.extensions.settings).toEqual(baseExtensions.settings);
    expect(arc5.extensions.inventory?.['arc2.keep'])
      .toEqual(baseExtensions.inventory?.['arc2.keep']);
    const committedArc4 = committedTrainingArc4State(restoredState, arc4, arc5.extensions);
    const committedArc5 = committedTrainingArc5State(arc5, arc5.extensions);
    expect(committedArc4).toEqual(arc4.state);
    expect(committedArc5).not.toBeNull();
    if (committedArc4 && committedArc5) {
      expect(ownershipStateDigestV1(ownershipSourceStateV1(committedArc5)))
        .toBe(ownershipStateDigestV1(committedArc4));
      expect(ownershipStateDigestV2(committedArc5)).toBe(ownershipStateDigestV2(arc5.state));
    }
    expect(committedTrainingArc5State(arc5, arc4.extensions)).toBeNull();
    expect(committedTrainingArc5State({
      ...arc5,
      writes: [],
    } as unknown as PreparedTrainingArc5Restore, arc5.extensions)).toBeNull();
    const corruptCommitted = canonicalizeV5Extensions({
      ...arc5.extensions,
      player: {
        ...arc5.extensions.player,
        [ARC5_OWNERSHIP_MIGRATION_NAMESPACE]: { version: 1, json: '{}' },
      },
    });
    expect(committedTrainingArc5State(arc5, corruptCommitted)).toBeNull();
  });

  it('preserves aligned Arc 5, defers source-held absence, and refuses every ambiguous Training carrier', () => {
    const checkpoint = checkpointFrom();
    const current = trainingCurrent(checkpoint).current;
    const restoredState = restore(current, checkpoint).state;
    const arc4 = prepareArc4OwnershipLegacyMigration({
      extensions: {},
      legacy: current,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (arc4.kind !== 'prepared') throw new Error(`Arc 4 fixture failed: ${arc4.kind}`);
    const arc5 = prepareArc5OwnershipMigration({
      extensions: arc4.extensions,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (arc5.kind !== 'prepared') throw new Error(`Arc 5 fixture failed: ${arc5.kind}`);

    const preserved = prepareTrainingArc5Restore({
      checkpointKind: 'current-view',
      legacyFieldsRestored: false,
      baseExtensions: arc5.extensions,
      arc4Preparation: null,
    });
    expect(preserved.kind).toBe('preserved');
    if (preserved.kind === 'preserved') {
      expect(preserved.writes).toEqual([]);
      expect(preserved.extensions).toEqual(arc5.extensions);
      expect(ownershipStateDigestV2(preserved.state)).toBe(ownershipStateDigestV2(arc5.state));
    }
    expect(prepareTrainingArc5Restore({
      checkpointKind: 'current-view',
      legacyFieldsRestored: false,
      baseExtensions: arc4.extensions,
      arc4Preparation: null,
    })).toEqual({ kind: 'protected', reason: 'target-absent' });

    const deferredAbsent = prepareTrainingArc5Restore({
      checkpointKind: 'source-deferred',
      legacyFieldsRestored: false,
      baseExtensions: {},
      arc4Preparation: null,
    });
    expect(deferredAbsent).toEqual({
      kind: 'deferred', reason: 'source-deferred', state: null,
      writes: [], extensions: {},
    });
    const deferredAligned = prepareTrainingArc5Restore({
      checkpointKind: 'source-deferred',
      legacyFieldsRestored: false,
      baseExtensions: arc5.extensions,
      arc4Preparation: null,
    });
    expect(deferredAligned.kind).toBe('deferred');
    if (deferredAligned.kind === 'deferred') {
      expect(deferredAligned.state).not.toBeNull();
      expect(deferredAligned.writes).toEqual([]);
      expect(deferredAligned.extensions).toEqual(arc5.extensions);
    }

    const carrier = arc5.extensions.player![ARC5_OWNERSHIP_MIGRATION_NAMESPACE]!;
    const future = canonicalizeV5Extensions({
      ...arc5.extensions,
      player: {
        ...arc5.extensions.player,
        [ARC5_OWNERSHIP_MIGRATION_NAMESPACE]: { ...carrier, version: 2 },
      },
    });
    const corrupt = canonicalizeV5Extensions({
      ...arc5.extensions,
      player: {
        ...arc5.extensions.player,
        [ARC5_OWNERSHIP_MIGRATION_NAMESPACE]: { version: 1, json: '{}' },
      },
    });
    const misplaced = canonicalizeV5Extensions({
      ...arc4.extensions,
      catalog: {
        ...arc4.extensions.catalog,
        [ARC5_OWNERSHIP_MIGRATION_NAMESPACE]: carrier,
      },
    });
    for (const [label, extensions, expected] of [
      ['future', future, { kind: 'protected', reason: 'target-future', version: 2 }],
      ['corrupt', corrupt, { kind: 'protected', reason: 'target-corrupt' }],
      ['misplaced', misplaced, { kind: 'protected', reason: 'target-corrupt' }],
    ] as const) {
      expect(prepareTrainingArc5Restore({
        checkpointKind: 'source-deferred',
        legacyFieldsRestored: false,
        baseExtensions: extensions,
        arc4Preparation: null,
      }), label).toEqual(expected);
    }

    const restoredArc4 = prepareTrainingArc4Restore(
      'legacy-v1', true, restoredState, {},
    );
    if (restoredArc4?.kind !== 'prepared') throw new Error('restored Arc 4 fixture failed');
    expect(prepareTrainingArc5Restore({
      checkpointKind: 'legacy-v1',
      legacyFieldsRestored: true,
      baseExtensions: {},
      arc4Preparation: null,
    })).toEqual({ kind: 'protected', reason: 'arc4-preparation-missing' });
    expect(prepareTrainingArc5Restore({
      checkpointKind: 'legacy-v1',
      legacyFieldsRestored: true,
      baseExtensions: canonicalizeV5Extensions({
        settings: { 'unexpected.keep': { version: 1, json: '{"keep":true}' } },
      }),
      arc4Preparation: restoredArc4,
    })).toEqual({ kind: 'protected', reason: 'arc4-preparation-unexpected' });
    expect(prepareTrainingArc5Restore({
      checkpointKind: 'current-view',
      legacyFieldsRestored: false,
      baseExtensions: arc5.extensions,
      arc4Preparation: restoredArc4,
    })).toEqual({ kind: 'protected', reason: 'arc4-preparation-unexpected' });
    expect(prepareTrainingArc5Restore({
      checkpointKind: 'legacy-v1',
      legacyFieldsRestored: true,
      baseExtensions: arc5.extensions,
      arc4Preparation: restoredArc4,
    })).toEqual({ kind: 'protected', reason: 'target-loaded' });
  });

  it('accepts an exact lossless Training protection carrier without inventing a mirror', () => {
    const checkpoint = checkpointFrom();
    const restoredState = restore(trainingCurrent(checkpoint).current, checkpoint).state;
    const template = restoredState.codex[0]![1];
    const padding = 'x'.repeat(1_800);
    const oversizedCodex: SaveStateV2['codex'] = Array.from({ length: 700 }, (_, index) => {
      const id = `s${index + 20_000}`;
      return [id, {
        ...template,
        id,
        name: id,
        g: {
          seed: index + 20_000,
          kingdom: index === 0 ? 'fauna' : 'flora',
          form: index,
          note: padding,
        },
      }];
    });
    const oversizedState: SaveStateV2 = {
      ...restoredState,
      codex: oversizedCodex,
      customNames: [],
      bioX: [],
      scoutId: null,
    };
    const prepared = prepareTrainingArc4Restore('legacy-v1', true, oversizedState, {});
    expect(prepared).toMatchObject({
      kind: 'prepared', migration: 'legacy-protected',
      state: { mode: 'legacy-protected' },
    });
    if (prepared?.kind !== 'prepared') return;
    expect(prepared.writes).toHaveLength(18);
    expect(prepared.migrationSourceEvidence).toEqual(prepared.state.legacyProtection);
    expect(arc4OwnershipLegacyMirrorMatches(prepared.state, oversizedState)).toBe(false);
    expect(committedTrainingArc4State(oversizedState, prepared, prepared.extensions)).toEqual(
      prepared.state,
    );
    expect(committedTrainingArc4State(oversizedState, {
      ...prepared,
      migration: 'migrated',
    }, prepared.extensions)).toBeNull();
    const protectedMissingMigration = { ...prepared } as Record<string, unknown>;
    delete protectedMissingMigration.migration;
    expect(committedTrainingArc4State(
      oversizedState,
      protectedMissingMigration as unknown as PreparedTrainingArc4Restore,
      prepared.extensions,
    )).toBeNull();

    const sourceMutations: readonly Readonly<{
      label: string;
      mutate(state: SaveStateV2): void;
    }>[] = [
      {
        label: 'genome',
        mutate(state) { state.codex[0]![1].g.note = `${String(state.codex[0]![1].g.note)}!`; },
      },
      {
        label: 'from',
        mutate(state) { state.codex[0]![1].from = 'Changed source'; },
      },
      {
        label: 'where',
        mutate(state) { state.codex[0]![1].where = { type: 'audit', marker: 1 }; },
      },
      {
        label: 'alias',
        mutate(state) { state.customNames = [['cs20000', 'Changed Alias']]; },
      },
      {
        label: 'bioX',
        mutate(state) { state.bioX = [[133, [1, 0]]]; },
      },
      {
        label: 'scout',
        mutate(state) { state.scoutId = 's20000'; },
      },
      {
        label: 'epoch',
        mutate(state) { state.EPOCH_BASE += 1; },
      },
    ];
    for (const { label, mutate } of sourceMutations) {
      const changed = structuredClone(oversizedState);
      mutate(changed);
      const remigrated = migrateLegacyOwnership(changed);
      expect(remigrated.kind, label).toBe('legacy-protected');
      if (remigrated.kind === 'legacy-protected') {
        expect(remigrated.sourceEvidence.digest, label)
          .not.toBe(prepared.state.legacyProtection?.digest);
      }
      expect(
        committedTrainingArc4State(changed, prepared, prepared.extensions),
        label,
      ).toBeNull();
    }

    let codexGetterReads = 0;
    const hostile = { ...oversizedState } as Record<string, unknown>;
    Object.defineProperty(hostile, 'codex', {
      enumerable: true,
      get() {
        codexGetterReads++;
        return oversizedState.codex;
      },
    });
    expect(committedTrainingArc4State(
      hostile as unknown as SaveStateV2,
      prepared,
      prepared.extensions,
    )).toBeNull();
    expect(codexGetterReads).toBe(0);
  }, 20_000);
});
