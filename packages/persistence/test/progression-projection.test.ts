// Ported from SOURCE tests/arc9-progression.test.ts (module SOURCE apps/game/src/arc9-progression-projection.ts),
// as far as it tests the projection alone: the refresh that settles achievements and rank from a save state.
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
import {
  ARC9_SUPPORTED_EVENT_ACHIEVEMENT_OWNERS_V1,
  importSaveV2,
  prepareArc9EventAchievementJoinV1,
  prepareArc9ProgressionRefreshV1,
  projectArc9ProgressionStateV1,
  type ContentRegistry,
  type SaveStateV2,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', '..', 'fixtures', 'v1', 'content-registry.json',
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
      survivor: 'survival:hostile-field-strike',
      fieldmedic: 'care:flora-heal',
      gambler: 'care:high-risk-flora-heal',
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

describe('Arc 9 aggregate progression refresh, prepared from a state', () => {
  it('appends every newly proven aggregate id after the saved ids, raises the best rank, and leaves the caller state alone', () => {
    const state = richState();
    state.unlocked.push('home');
    const before = JSON.stringify(state);
    const refresh = prepareArc9ProgressionRefreshV1(state);
    expect(JSON.stringify(state)).toBe(before);
    expect(refresh.kind).toBe('ready');
    if (refresh.kind !== 'ready') return;
    // SOURCE tests/arc9-progression.test.ts:363-370, asserted there on the committed outcome of the same refresh.
    expect(refresh.addedAchievementIds.length).toBeGreaterThan(20);
    expect(refresh.addedAchievementIds.some((id) => EVENT_IDS.has(id))).toBe(false);
    expect(refresh.successor.unlockedIds.slice(0, 2)).toEqual(['compat:future-proof', 'home']);
    expect(refresh.successorState.unlocked).toEqual(refresh.successor.unlockedIds);
    expect(refresh.successor.achievements.eligibleProjectionCount).toBe(0);
    expect(refresh.successor.achievements.eventOwnerRequiredCount).toBe(EVENT_OWNED_ACHIEVEMENT_COUNT - 1);
    expect(refresh.nextBestRankIndex).toBeGreaterThan(refresh.priorBestRankIndex);
    expect(refresh.successorState.stats.bestRank).toBe(refresh.nextBestRankIndex);
    // SOURCE tests/arc9-progression.test.ts:383-388: the settled state has nothing left to refresh.
    expect(prepareArc9ProgressionRefreshV1(refresh.successorState).kind).toBe('current');
  });
});
