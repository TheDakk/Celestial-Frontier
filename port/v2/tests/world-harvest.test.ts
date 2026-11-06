import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  createMemoryBackend, createRevisionedRepository, migrateStoredV4ToV5, prepareArc2LootLegacyMigration,
  prepareF4AuthorityUpdate, prepareV5SaveWrite, readSaveV5, V4_PRIMARY_KEY, type ContentRegistry, type SaveStateV2,
} from '@cf/persistence';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { HARVEST_EPOCHS } from '@cf/domain-progression';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  commitWorldHarvestV1, projectWorldHarvestV1, publishWorldHarvestFieldsV1, worldHarvestYieldV1, WORLD_HARVEST_RECEIPT_KIND_V1,
} from '../apps/game/src/world-harvest.js';
import REGISTRY_JSON from '../../baseline-v1.8.9/content-registry.json';
const REGISTRY = REGISTRY_JSON as unknown as ContentRegistry;
beforeAll(() => installCaptureHooks());

const WORLD = 134, OTHER = 135;
function state(conquered: SaveStateV2['conquered'] = [[WORLD, { t: 0, tier: 3 }]]): SaveStateV2 {
  return {
    EPOCH_BASE: 5, essence: 10, explorerName: 'Dakk', lastAnomKey: null,
    stats: { essenceEarned: 20, bestRank: 0, harvests: 0 }, pstats: {}, hp: 10, HP_MAX: 10,
    customNames: [], conquered, cargo: [], cgx: [], items: [], equip: {}, equipAff: {},
    pinnedRecipe: null, cargoTab: 'mat', seenSp: [], journal: [], mined: [], mineX: [], skimX: [],
    bioX: [], techOwned: [], claimedSets: [], ascCh: 0, ascProg: {}, nameHue: -1,
    savedView: null, fsMode: '', toneMode: '', fontMode: '', sndOn: true, fxOn: true,
    chartsOn: true, shakeOn: true, salvageConfirm: true, notifOn: true, tipsOn: true,
    sfxVol: 1, glassTint: 0, motionMode: 0, cardExpand: 0, notifications: [],
    surveyedSet: [], galSeen: [], surfSeen: [133], xpFirsts: [], sysSeen: [], starKindsSeen: [],
    ptypesSeen: [], eventKeysSeen: [], evAnnounced: [], unlocked: [], landed: [], contacted: [],
    waveOffs: [], primeFill: {}, frontierUnlocked: false, frontierEnding: null, seenGuide: false,
    tutDone: true, rnSeen: '', tutSnapPending: null, scoutId: null, chWeek: -1, chProg: {},
    chacc: [], chDone: [], homeId: null, voiceOn: true, combatSfxOn: true, logMap: [], codex: [],
  } as SaveStateV2;
}
async function fixture(save: SaveStateV2) {
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 1_000 }, createSessionRNG(0xC4A7_0003).state());
  const loot = prepareArc2LootLegacyMigration({ extensions: f4.extensions, legacy: { items: save.items, equip: save.equip, equipAff: save.equipAff }, capacity: 12 });
  if (loot.kind !== 'prepared') throw new Error(`harvest loot fixture was ${loot.kind}`);
  const backend = createMemoryBackend(), initial = prepareV5SaveWrite({ state: save, extensions: loot.extensions }, REGISTRY, 10);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(backend, REGISTRY, 10); if (migration.kind !== 'migrated') throw new Error(`harvest fixture was ${migration.kind}`);
  await backend.apply(initial.operations);
  const runtime = createF4RuntimeAuthority({ backend, repository: createRevisionedRepository(backend), registry: REGISTRY, initialRevision: 0,
    initialExtensions: loot.extensions, initialState: initial.canonicalState, restoredAuthority: f4.authority, freshSessionSeed: 0,
    ownerId: 'harvest-test', token: 'harvest-document', leaseTtlMs: 1_000_000, now: () => 10, visible: true, answerable: true });
  expect((await runtime.heartbeat()).kind).toBe('owned');
  return { runtime, backend, state: initial.canonicalState };
}

describe('play-time Stardust harvest from a conquered world (v1.8.9 parity, active-play epochs)', () => {
  it('v1 numbers: yield 6 + 4 × tier; a row with no epoch is ready; readiness returns HARVEST_EPOCHS after the last harvest', () => {
    expect([0, 1, 3, 7].map(worldHarvestYieldV1)).toEqual([6, 10, 18, 34]);
    expect(projectWorldHarvestV1(state(), WORLD, 5)).toEqual({ kind: 'ready', yield: 18, tier: 3 });
    expect(projectWorldHarvestV1(state(), OTHER, 5)).toEqual({ kind: 'not-conquered' });
    const harvested = state([[WORLD, { t: 0, tier: 3, e: 5 }]]);
    expect(projectWorldHarvestV1(harvested, WORLD, 5)).toMatchObject({ kind: 'replenishing', epochsLeft: 2, minutesLeft: 40 });
    expect(projectWorldHarvestV1(harvested, WORLD, 5 + HARVEST_EPOCHS - 1)).toMatchObject({ kind: 'replenishing', epochsLeft: 1 });
    expect(projectWorldHarvestV1(harvested, WORLD, 5 + HARVEST_EPOCHS).kind).toBe('ready');
  });

  it('one harvest commits durably: Stardust into current and lifetime, the harvest count, the epoch stamped on the row; the same epoch cannot pay twice', async () => {
    const f = await fixture(state());
    const outcome = await commitWorldHarvestV1({ state: f.state, planetSeed: WORLD, epoch: 5, codecNow: 1_700_000_000_000, authority: f.runtime });
    if (outcome.kind !== 'committed') throw new Error(`harvest was ${outcome.kind}`);
    expect(outcome.facts).toMatchObject({ stardust: 18, essenceBefore: 10, essenceAfter: 28, earnedAfter: 38, harvestsAfter: 1, epoch: 5, priorEpoch: null });
    expect(outcome.transaction.receipt.kind).toBe(WORLD_HARVEST_RECEIPT_KIND_V1);
    const saved = await readSaveV5(f.backend, REGISTRY, 20);
    if (saved.kind !== 'loaded') throw new Error(`read was ${saved.kind}`);
    expect(saved.state.essence).toBe(28); expect(saved.state.stats.essenceEarned).toBe(38); expect(saved.state.stats.harvests).toBe(1);
    expect(saved.state.conquered.find(([k]) => Number(k) === WORLD)![1].e).toBe(5);
    const again = await commitWorldHarvestV1({ state: outcome.state, planetSeed: WORLD, epoch: 5, codecNow: 1_700_000_000_001, authority: f.runtime });
    expect(again.kind).toBe('not-ready');
    // an epoch the save has not published yet is refused, never committed-then-clamped
    expect(await commitWorldHarvestV1({ state: outcome.state, planetSeed: WORLD, epoch: 5 + HARVEST_EPOCHS, codecNow: 2, authority: f.runtime }))
      .toEqual({ kind: 'refused', detail: 'epoch-not-published' });
    // two epochs of play later (published as the save's EPOCH_BASE), the world pays again
    const replenished = state([[WORLD, { t: 0, tier: 3, e: 5 }]]); replenished.EPOCH_BASE = 5 + HARVEST_EPOCHS; replenished.essence = 28;
    const g = await fixture(replenished);
    const later = await commitWorldHarvestV1({ state: g.state, planetSeed: WORLD, epoch: 5 + HARVEST_EPOCHS, codecNow: 1_700_000_000_002, authority: g.runtime });
    if (later.kind !== 'committed') throw new Error(`later harvest was ${later.kind}`);
    expect(later.facts).toMatchObject({ essenceAfter: 46, priorEpoch: 5, epoch: 7 });
  });

  it('THE CLOCK LAW: winding the device clock a year forward grants nothing; only the published epoch readies a world', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(4_000_000_000_000);
    try {
      const harvested = state([[WORLD, { t: 0, tier: 3, e: 5 }]]);
      expect(projectWorldHarvestV1(harvested, WORLD, 5).kind).toBe('replenishing');
      const f = await fixture(harvested);
      const outcome = await commitWorldHarvestV1({ state: f.state, planetSeed: WORLD, epoch: 5, codecNow: 4_000_000_000_000, authority: f.runtime });
      expect(outcome.kind).toBe('not-ready');
    } finally { now.mockRestore(); }
  });

  it('refuses an unconquered world and writes nothing; publication requires the exact live parent', async () => {
    const f = await fixture(state());
    expect(await commitWorldHarvestV1({ state: f.state, planetSeed: OTHER, epoch: 5, codecNow: 1, authority: f.runtime })).toEqual({ kind: 'refused', detail: 'not-conquered' });
    const outcome = await commitWorldHarvestV1({ state: f.state, planetSeed: WORLD, epoch: 5, codecNow: 1, authority: f.runtime });
    if (outcome.kind !== 'committed') throw new Error(outcome.kind);
    const live = structuredClone(f.state); publishWorldHarvestFieldsV1(live, outcome);
    expect(live.essence).toBe(28); expect(live.conquered[0]![1].e).toBe(5);
    const stale = structuredClone(f.state); stale.essence = 99;
    expect(() => publishWorldHarvestFieldsV1(stale, outcome)).toThrow(/exact live parent/);
  });
});
