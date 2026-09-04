import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATALOGUE_SIZE,
  EVENT_OWNED_ACHIEVEMENT_COUNT,
} from '@cf/domain-progression';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  V4_PRIMARY_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  ARC9_PROGRESSION_REFRESH_OPERATION_V1,
  ARC9_PROGRESSION_REFRESH_RECEIPT_KIND_V1,
  commitArc9ProgressionRefreshV1,
} from '../apps/game/src/arc9-progression-action.js';
import {
  ARC9_SUPPORTED_EVENT_ACHIEVEMENT_OWNERS_V1,
  prepareArc9EventAchievementJoinV1,
  prepareArc9ProgressionRefreshV1,
  projectArc9ProgressionStateV1,
} from '../apps/game/src/arc9-progression-projection.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { projectArc9RecordsRankReadModelV1 } from '../apps/game/src/records-rank-model.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;
const EVENT_IDS = new Set(ACHIEVEMENTS
  .filter(({ evaluation }) => evaluation.kind === 'event-owner')
  .map(({ id }) => id));

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Arc 9 base save failed: ${imported.reason}`);
  return imported.state;
}

function sequence(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}:${index}`);
}

function richState(): SaveStateV2 {
  const state = baseState();
  state.stats = {
    ...state.stats,
    hybrids: 10,
    maxGen: 10,
    best: 14,
    crafts: 25,
    minedout: 1,
    mines: 250,
    cosmics: 1,
    skims: 1,
    anomalies: 25,
    events: 25,
    guardians: 5,
    harvests: 10,
    essenceEarned: 500,
    breeds: 11,
    breedwins: 10,
    feeds: 5,
    feedfails: 1,
    duels: 25,
    duelwins: 25,
    shares: 5,
    jumps: 5,
    bestRank: 0,
  };
  state.surveyedSet = sequence('survey', 5);
  state.ptypesSeen = sequence('ptype', 8);
  state.surfSeen = sequence('surface', 5);
  state.starKindsSeen = sequence('star-kind', 8);
  state.galSeen = sequence('galaxy', 5);
  state.conquered = Array.from({ length: 5 }, (_, index) => [
    `settlement:${index}`, { t: NOW, tier: index },
  ]);
  state.customNames = Array.from({ length: 5 }, (_, index) => [
    `place:${index}`, `Place ${index}`,
  ]);
  state.items = [
    ['jumpdrive', 1], ['array', 1], ['igdrive', 1], ['cg-proto', 1],
  ];
  state.equip = { suit: 'cg-proto' };
  state.ascCh = 3;
  state.unlocked = ['compat:future-proof'];
  return state;
}

async function runtimeFixture(options: Readonly<{ failStorage?: boolean }> = {}) {
  const sourceState = richState();
  /* A durable event-owned row is compatibility evidence this aggregate
     writer must carry through byte-for-byte, never re-derive or discard. */
  sourceState.unlocked.push('home');
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xA9000001).state(),
  );
  const base = createMemoryBackend();
  const initialSave = prepareV5SaveWrite({ state: sourceState, extensions: f4.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initialSave.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`Arc 9 v5 fixture was ${migration.kind}`);
  await base.apply(initialSave.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failStorage === true) throw new Error('forced Arc 9 progression storage failure');
      }
      return base.compareAndApply(checks, operations, clearStores);
    },
  };
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend,
    repository,
    registry: REGISTRY,
    initialRevision: 0,
    initialExtensions: f4.extensions,
    restoredAuthority: f4.authority,
    freshSessionSeed: 0,
    ownerId: 'arc9-progression-tab',
    token: 'arc9-progression-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Arc 9 runtime lease was ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state: initialSave.canonicalState,
    receiptCas: () => receiptCas,
  };
}

describe('Arc 9 sanitized save progression projection', () => {
  it('derives collection facts from codec-sanitized Compendium rows, not claimed counters', () => {
    const raw = JSON.stringify({
      codex: ['microbe', 'flora', 'fungi', 'fauna'].map((kingdom, index) => ({
        g: makeGenome(70_000 + index, kingdom, 0.2 + index * 0.2),
        f: 'Projection fixture',
        w: null,
      })),
      ever: { v: 1, hybrids: 7, best: 12, maxGen: 5, scanhits: 0 },
    });
    const imported = importSaveV2(raw, REGISTRY, NOW);
    if (!imported.ok) throw new Error(`Arc 9 Compendium fixture failed: ${imported.reason}`);
    imported.state.stats.surveys = 999_999_999;
    const outcome = projectArc9ProgressionStateV1(imported.state);
    expect(outcome.kind).toBe('projected');
    if (outcome.kind !== 'projected') return;
    expect(outcome.projection.snapshot).toMatchObject({
      cataloguedSpeciesCount: 4,
      ownedKingdomCount: 4,
      hybridCount: 7,
      maxGeneration: 5,
      bestRawRarityTier: 12,
      surveyedLivingWorldCount: 0,
    });
    expect(outcome.projection.rankRecord.cataloguedSpeciesCount).toBe(4);
  });

  it('maps exact save owners into bounded aggregate facts without laundering event ids', () => {
    const state = richState();
    const outcome = projectArc9ProgressionStateV1(state);
    expect(outcome.kind).toBe('projected');
    if (outcome.kind !== 'projected') return;
    expect(outcome.projection.snapshot).toMatchObject({
      cataloguedSpeciesCount: 0,
      hybridCount: 10,
      maxGeneration: 10,
      bestRawRarityTier: 14,
      surveyedLivingWorldCount: 5,
      surveyedWorldTypeCount: 8,
      surfaceWorldCount: 5,
      surveyedStarClassCount: 8,
      galaxyCount: 5,
      craftCount: 25,
      equippedGearCount: 1,
      ascentChapterIndex: 3,
      hasJumpDrive: true,
      hasLongRangeArray: true,
      hasIntergalacticDrive: true,
      hasCosmicGear: true,
    });
    expect(outcome.projection.achievements.unsupportedUnlockedIds).toEqual(['compat:future-proof']);
    expect(outcome.projection.achievements.rankCreditCount).toBe(1);
    expect(outcome.projection.achievements.eventOwnerRequiredCount)
      .toBe(EVENT_OWNED_ACHIEVEMENT_COUNT);
    const eligible = outcome.projection.achievements.rows
      .filter(({ status }) => status === 'eligible')
      .map(({ id }) => id);
    expect(eligible.length).toBeGreaterThan(20);
    expect(eligible.some((id) => EVENT_IDS.has(id))).toBe(false);
  });

  it('exposes one bounded DOM-free Records/rank component with exact factor math and all rows', () => {
    const outcome = projectArc9RecordsRankReadModelV1(richState());
    expect(outcome.kind).toBe('projected');
    if (outcome.kind !== 'projected') return;
    expect(outcome.model.achievements).toHaveLength(13);
    expect(outcome.model.achievements.flatMap(({ rows }) => rows))
      .toHaveLength(ACHIEVEMENT_CATALOGUE_SIZE);
    expect(outcome.model.factors.reduce((sum, row) => sum + row.scoreContribution, 0))
      .toBe(outcome.model.rank.score);
    expect(outcome.model.unsupportedUnlockedIds).toEqual(['compat:future-proof']);
    expect(outcome.model.aggregateRefreshAvailable).toBe(true);
    expect(outcome.model.eventOwnerRequiredCount).toBe(EVENT_OWNED_ACHIEVEMENT_COUNT);
  });

  it('prepares only the exact transaction-owner joins without inference or caller mutation', () => {
    expect(ARC9_SUPPORTED_EVENT_ACHIEVEMENT_OWNERS_V1).toEqual({
      home: 'landing:earth',
      curator: 'atlas:first-favorite',
      civ: 'survey:world-civilized',
      spacefar: 'survey:world-spacefaring',
      sol: 'survey:star-sol',
      binary: 'survey:star-binary',
      seebh: 'survey:star-black-hole',
      seens: 'survey:star-neutron-star',
      seemag: 'survey:star-magnetar',
      seewd: 'survey:star-white-dwarf',
      seerg: 'survey:star-red-giant',
      seesg: 'survey:star-red-supergiant',
      seeproto: 'survey:star-protostar',
      seebd: 'survey:star-brown-dwarf',
      namer: 'naming:first-discovery-name',
      bredlegend: 'breed:legendary-pair',
      brink: 'survival:below-twenty-hp',
      share: 'sharing:first-code-sent',
      wayfarer: 'sharing:first-code-followed',
      worm: 'travel:wormhole',
      quasar: 'travel:quasar-galaxy',
      dwarfg: 'travel:dwarf-galaxy',
    });
    for (const [id, owner] of Object.entries(ARC9_SUPPORTED_EVENT_ACHIEVEMENT_OWNERS_V1)) {
      expect(ACHIEVEMENTS.find((definition) => definition.id === id)?.evaluation)
        .toEqual({ kind: 'event-owner', owner });
    }
    const state = richState();
    const before = JSON.stringify(state);
    const home = prepareArc9EventAchievementJoinV1(state, 'home');
    expect(home).toMatchObject({
      kind: 'prepared',
      achievementId: 'home',
      owner: 'landing:earth',
      added: true,
      priorUnlockedCount: 1,
      nextUnlockedIds: ['compat:future-proof', 'home'],
    });
    expect(JSON.stringify(state)).toBe(before);
    if (home.kind !== 'prepared') return;
    const durableHome = { ...state, unlocked: [...home.nextUnlockedIds] };
    expect(prepareArc9EventAchievementJoinV1(durableHome, 'home')).toMatchObject({
      kind: 'prepared', added: false, priorUnlockedCount: 2,
      nextUnlockedIds: ['compat:future-proof', 'home'],
    });
    expect(prepareArc9EventAchievementJoinV1(durableHome, 'namer')).toMatchObject({
      kind: 'prepared', achievementId: 'namer', owner: 'naming:first-discovery-name',
      added: true, nextUnlockedIds: ['compat:future-proof', 'home', 'namer'],
    });
    expect(prepareArc9EventAchievementJoinV1(durableHome, 'curator')).toMatchObject({
      kind: 'prepared', achievementId: 'curator', owner: 'atlas:first-favorite',
      added: true, nextUnlockedIds: ['compat:future-proof', 'home', 'curator'],
    });
    expect(prepareArc9EventAchievementJoinV1(durableHome, 'bredlegend')).toMatchObject({
      kind: 'prepared', achievementId: 'bredlegend', owner: 'breed:legendary-pair',
      added: true, nextUnlockedIds: ['compat:future-proof', 'home', 'bredlegend'],
    });
    expect(prepareArc9EventAchievementJoinV1(durableHome, 'brink')).toMatchObject({
      kind: 'prepared', achievementId: 'brink', owner: 'survival:below-twenty-hp',
      added: true, nextUnlockedIds: ['compat:future-proof', 'home', 'brink'],
    });
    expect(prepareArc9EventAchievementJoinV1(durableHome, 'share')).toMatchObject({
      kind: 'prepared', achievementId: 'share', owner: 'sharing:first-code-sent',
      added: true, nextUnlockedIds: ['compat:future-proof', 'home', 'share'],
    });
    expect(prepareArc9EventAchievementJoinV1(durableHome, 'wayfarer')).toMatchObject({
      kind: 'prepared', achievementId: 'wayfarer', owner: 'sharing:first-code-followed',
      added: true, nextUnlockedIds: ['compat:future-proof', 'home', 'wayfarer'],
    });
    expect(prepareArc9EventAchievementJoinV1(state, 'settle1' as never)).toEqual({
      kind: 'protected', reason: 'event-achievement-unsupported',
    });
  });

  it('protects malformed ids, sparse carriers, and an all-or-nothing capacity overflow', () => {
    const duplicate = richState();
    duplicate.unlocked = ['first', 'first'];
    expect(projectArc9ProgressionStateV1(duplicate)).toEqual({
      kind: 'protected', reason: 'achievement-id-shape',
    });

    const sparse = richState();
    sparse.surveyedSet = Array(5) as string[];
    expect(projectArc9ProgressionStateV1(sparse)).toEqual({
      kind: 'protected', reason: 'collection-shape',
    });

    const full = richState();
    full.unlocked = Array.from({ length: ACHIEVEMENT_CATALOGUE_SIZE + 50 }, (_, index) => (
      `compat:${index}`
    ));
    expect(prepareArc9ProgressionRefreshV1(full)).toEqual({
      kind: 'protected', reason: 'achievement-capacity',
    });
  });
});

describe('Arc 9 durable aggregate progression refresh', () => {
  it('commits one receipt/CAS, preserves caller state and event ownership, and reopens fixed', async () => {
    const fixture = await runtimeFixture();
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof fixture.runtime.commitAction>[0]) {
        commitCalls++;
        return fixture.runtime.commitAction(input);
      },
    };
    const callerBefore = JSON.stringify(fixture.state);
    const pending = commitArc9ProgressionRefreshV1({
      runtime,
      state: fixture.state,
      codecNow: NOW,
    });
    expect(JSON.stringify(fixture.state)).toBe(callerBefore);
    const outcome = await pending;
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome).toMatchObject({
      durability: 'committed',
      convergence: 'none',
      transaction: {
        revision: 1,
        plan: { operation: ARC9_PROGRESSION_REFRESH_OPERATION_V1, receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC9_PROGRESSION_REFRESH_RECEIPT_KIND_V1 },
      },
    });
    expect(outcome.addedAchievementIds.length).toBeGreaterThan(20);
    expect(outcome.addedAchievementIds.some((id) => EVENT_IDS.has(id))).toBe(false);
    expect(outcome.projection.unlockedIds[0]).toBe('compat:future-proof');
    expect(outcome.projection.unlockedIds[1]).toBe('home');
    expect(outcome.projection.achievements.eligibleProjectionCount).toBe(0);
    expect(outcome.projection.achievements.eventOwnerRequiredCount)
      .toBe(EVENT_OWNED_ACHIEVEMENT_COUNT - 1);
    expect(outcome.nextBestRankIndex).toBeGreaterThan(outcome.priorBestRankIndex);
    expect(commitCalls).toBe(1);
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    expect(JSON.stringify(fixture.state)).toBe(callerBefore);
    expect(fixture.runtime.sessionRng).toEqual({ seed: 0xA9000001, ordinal: 1, draws: {} });

    const saved = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') {
      expect(saved.state.unlocked).toEqual(outcome.projection.unlockedIds);
      expect(saved.state.stats.bestRank).toBe(outcome.nextBestRankIndex);
    }
    const second = await commitArc9ProgressionRefreshV1({
      runtime,
      state: outcome.transaction.state,
      codecNow: NOW,
    });
    expect(second).toMatchObject({ kind: 'current', durability: 'none', transaction: null });
    expect(commitCalls).toBe(1);
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.repository.readReceipt(1)).toBeUndefined();
    await fixture.runtime.release();
  });

  it('fails stale once without retry, receipt, rank mirror, or caller mutation', async () => {
    const fixture = await runtimeFixture();
    const callerBefore = JSON.stringify(fixture.state);
    await fixture.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'arc9-race-winner', value: 'other-tab' }],
    });
    const outcome = await commitArc9ProgressionRefreshV1({
      runtime: fixture.runtime,
      state: fixture.state,
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(fixture.state)).toBe(callerBefore);
  });

  it('contains one storage failure without receipt or optimistic progression', async () => {
    const fixture = await runtimeFixture({ failStorage: true });
    const callerBefore = JSON.stringify(fixture.state);
    const outcome = await commitArc9ProgressionRefreshV1({
      runtime: fixture.runtime,
      state: fixture.state,
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 9 progression storage failure',
    });
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.repository.revision()).toBe(0);
    expect(await fixture.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(fixture.state)).toBe(callerBefore);
  });

  it('rejects accessors before invocation and never enters the transaction owner', async () => {
    let getterTouched = false;
    let commitCalls = 0;
    const hostile = richState() as SaveStateV2 & { hostile?: unknown };
    Object.defineProperty(hostile, 'hostile', {
      enumerable: true,
      get() { getterTouched = true; return 'no'; },
    });
    const outcome = await commitArc9ProgressionRefreshV1({
      runtime: {
        async commitAction() {
          commitCalls++;
          return { kind: 'lease-unavailable' };
        },
      },
      state: hostile,
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', detail: 'input:invalid-or-unregistered', transaction: null,
    });
    expect(getterTouched).toBe(false);
    expect(commitCalls).toBe(0);
  });
});

describe('Arc 9 dependency and browser-free sentinels', () => {
  it('keeps the new component disconnected from main, DOM, clocks, entropy, and storage globals', () => {
    for (const file of [
      'arc9-progression-projection.ts',
      'arc9-progression-action.ts',
      'records-rank-model.ts',
    ]) {
      const source = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', file), 'utf8');
      expect(source).not.toMatch(/from ['"]\.\/main\.js['"]/u);
      expect(source).not.toMatch(/\bdocument\s*\.|\bwindow\s*\.|\blocalStorage\b/u);
      expect(source).not.toMatch(/\bMath\s*\.\s*random\s*\(|\bDate\s*\.\s*now\s*\(/u);
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(
      here, '..', 'apps', 'game', 'package.json',
    ), 'utf8')) as { dependencies: Record<string, string> };
    expect(manifest.dependencies).toMatchObject({
      '@cf/domain-acquisition': '*',
      '@cf/domain-progression': '*',
      '@cf/persistence': '*',
    });
  });
});
