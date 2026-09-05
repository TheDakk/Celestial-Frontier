import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  commitStarterCharterAcceptV1,
  projectStarterCharterBoardV1,
  publishStarterCharterAcceptFieldsV1,
  renderStarterCharterBoardV1,
  stageStarterCharterAcceptV1,
  stageStarterCharterEventV1,
} from '../apps/game/src/starter-charters.js';
import { stageStarterCharterActionV1 } from '../apps/game/src/starter-charter-action.js';
import {
  applyV5ExtensionWrites,
  createEmptyWorldIdentityState,
  createMemoryBackend,
  createRevisionedRepository,
  encodeWorldIdentityExtensionWrites,
  migrateStoredV4ToV5,
  prepareArc2LootLegacyMigration,
  prepareArc2LootInventoryWrite,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  projectArc2LootLegacyMirror,
  recordCanonicalWorldLanding,
  readArc2Loot,
  V4_PRIMARY_KEY,
  type ContentRegistry,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import {
  createGearInstance,
  getFixedCraftGenerationPlan,
  makeGearSourceActionId,
} from '@cf/domain-loot';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  createF4RuntimeAuthority,
  type F4RuntimeAuthority,
} from '../apps/game/src/f4-runtime-authority.js';
import REGISTRY_JSON from '../../baseline-v1.8.9/content-registry.json';

const REGISTRY = REGISTRY_JSON as unknown as ContentRegistry;
const VETERAN_CODEC_NOW = 1_700_000_000_000;

beforeAll(() => installCaptureHooks());

function state(): SaveStateV2 {
  return {
    EPOCH_BASE: 0, essence: 10, explorerName: 'Dakk', lastAnomKey: null,
    stats: { essenceEarned: 20, bestRank: 0 }, pstats: {}, hp: 10, HP_MAX: 10,
    customNames: [], conquered: [], cargo: [], cgx: [], items: [], equip: {}, equipAff: {},
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
  };
}

const EXTENSIONS = {} as V5Extensions;
type CommittedAction = Extract<
  Awaited<ReturnType<F4RuntimeAuthority['commitAction']>>,
  { readonly kind: 'committed' }
>;

function exactAddress(candidate: unknown): CanonicalCF1WorldAddress {
  const address = resolveCF1WorldAddress(candidate);
  if (!address.ok) throw new Error(`starter Charter world fixture failed: ${address.reason}`);
  return address.address;
}

function solWorld(planetSeed: number): CanonicalCF1WorldAddress {
  return exactAddress({
    galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 424242, x: 560, y: 170 },
    planet: { seed: planetSeed },
  });
}

function foreignWorld(planetSeed: number): CanonicalCF1WorldAddress {
  return exactAddress({
    galaxy: { seed: 3_959_248_028, x: -6_974_362.37248769, y: 4_279_128.574915975 },
    star: { seed: 1_420_541_153, x: 100.5842142929323, y: -1_171.697432242334 },
    planet: { seed: planetSeed },
  });
}

function landedIdentityExtensions(candidate: unknown): V5Extensions {
  const address = exactAddress(candidate);
  const landed = recordCanonicalWorldLanding(
    createEmptyWorldIdentityState(), address, {},
  );
  if (landed.capacityProtected) throw new Error('starter Charter world fixture exceeded capacity');
  return applyV5ExtensionWrites({}, encodeWorldIdentityExtensionWrites(landed.state)).extensions;
}

async function fixture(save: SaveStateV2, codecNow = 10) {
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xC4A7_0001).state(),
  );
  const loot = prepareArc2LootLegacyMigration({
    extensions: f4.extensions,
    legacy: { items: save.items, equip: save.equip, equipAff: save.equipAff },
    capacity: 12,
  });
  if (loot.kind !== 'prepared') throw new Error(`starter Charter loot fixture was ${loot.kind}`);
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state: save, extensions: loot.extensions }, REGISTRY, codecNow);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(backend, REGISTRY, codecNow);
  if (migration.kind !== 'migrated') throw new Error(`starter Charter fixture was ${migration.kind}`);
  await backend.apply(initial.operations);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY, initialRevision: 0,
    initialExtensions: loot.extensions, initialState: initial.canonicalState,
    restoredAuthority: f4.authority, freshSessionSeed: 0,
    ownerId: 'starter-charter-test', token: 'starter-charter-document',
    leaseTtlMs: 1_000_000, now: () => 10, visible: true, answerable: true,
  });
  expect((await runtime.heartbeat()).kind).toBe('owned');
  return { runtime, repository, state: initial.canonicalState };
}

describe('starter Charters', () => {
  it('reveals one live link per chain, exposes st-scan only in sequence, and enforces the three-slot cap', () => {
    const fresh = projectStarterCharterBoardV1(state());
    expect(fresh.kind).toBe('projected');
    if (fresh.kind !== 'projected') return;
    expect(fresh.board.rows.map(({ definition, status }) => [definition.id, status])).toEqual([
      ['st-land', 'available'], ['st-mercury', 'available'],
    ]);
    const blocked = state();
    blocked.chDone = ['st-land', 'st-mine'];
    const scan = projectStarterCharterBoardV1(blocked);
    expect(scan.kind === 'projected' && scan.board.rows[0]).toMatchObject({
      definition: { id: 'st-scan', event: 'bioscan' }, status: 'available',
    });
    const full = state();
    full.chacc = ['wk-land', 'wk-mine', 'wk-scan'];
    const acceptance = stageStarterCharterAcceptV1({
      draft: structuredClone(full), extensions: EXTENSIONS, id: 'st-land', receiptOrdinal: 1,
    });
    expect(acceptance).toMatchObject({ kind: 'refused', reason: 'three accepted Charters is the exact cap' });
    expect(renderStarterCharterBoardV1(fresh.board)).toContain('data-starter-charter-accept="st-land"');
  });

  it('makes st-scan count from acceptance and never backfills an older Survey record', () => {
    const scannedBeforeAcceptance = state();
    scannedBeforeAcceptance.chDone = ['st-land', 'st-mine'];
    scannedBeforeAcceptance.surveyedSet = [foreignWorld(133).key];
    const accepted = stageStarterCharterAcceptV1({
      draft: scannedBeforeAcceptance,
      extensions: EXTENSIONS,
      id: 'st-scan',
      receiptOrdinal: 1,
    });
    expect(accepted.kind).toBe('ready');
    expect(scannedBeforeAcceptance).toMatchObject({
      chacc: ['st-scan'],
      chDone: ['st-land', 'st-mine'],
      chProg: {},
      essence: 10,
    });
  });

  it('keeps generic Charter witness composition JSON-only and duplicate-key protected', () => {
    for (const predecessorWitness of [
      'opaque-witness',
      JSON.stringify({ starterCharter: { forged: true } }),
    ]) {
      const draft = state();
      draft.chacc = ['st-land'];
      const staged = stageStarterCharterActionV1({
        draft,
        extensions: EXTENSIONS,
        predecessorWrites: Object.freeze([]),
        predecessorWitness,
        event: { kind: 'landfall', address: foreignWorld(133) },
        receiptOrdinal: 2,
      });
      expect(staged.kind).toBe('refused');
    }
  });

  it('accepts a live row, completes already-proven work atomically, and never counts training Earth', () => {
    const fresh = state();
    const accepted = stageStarterCharterAcceptV1({
      draft: fresh, extensions: EXTENSIONS, id: 'st-land', receiptOrdinal: 1,
    });
    expect(accepted.kind).toBe('ready');
    expect(fresh.chacc).toEqual(['st-land']);
    expect(fresh.chDone).toEqual([]);
    expect(fresh.essence).toBe(10);

    const proven = state();
    proven.surfSeen.push(134);
    const completed = stageStarterCharterAcceptV1({
      draft: proven, extensions: EXTENSIONS, id: 'st-land', receiptOrdinal: 2,
    });
    expect(completed.kind).toBe('ready');
    expect(proven.chDone).toEqual(['st-land']);
    expect(proven.chacc).toEqual([]);
    expect(proven.essence).toBe(20);
    expect(proven.stats).toMatchObject({ essenceEarned: 30, charters: 1 });
  });

  it('uses exact current-world identity for proven landfalls instead of leaf-only Earth identity', () => {
    const mars = landedIdentityExtensions({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424242, x: 560, y: 170 },
      planet: { seed: 134 },
    });
    const current = state();
    const completed = stageStarterCharterAcceptV1({
      draft: current, extensions: mars, id: 'st-land', receiptOrdinal: 2,
    });
    expect(completed.kind).toBe('ready');
    expect(current).toMatchObject({ chDone: ['st-land'], chacc: [], essence: 20 });

    const foreignEarthSeed = landedIdentityExtensions({
      galaxy: { seed: 3_959_248_028, x: -6_974_362.37248769, y: 4_279_128.574915975 },
      star: { seed: 1_420_541_153, x: 100.5842142929323, y: -1_171.697432242334 },
      planet: { seed: 133 },
    });
    const aliased = state();
    const accepted = stageStarterCharterAcceptV1({
      draft: aliased, extensions: foreignEarthSeed, id: 'st-land', receiptOrdinal: 3,
    });
    expect(accepted.kind).toBe('ready');
    expect(aliased.chacc).toEqual([]);
    expect(aliased.chDone).toEqual(['st-land']);
    expect(aliased.essence).toBe(20);
  });

  it('settles matching event filters and counts giant Mine presses rather than auto loads', () => {
    const mine = state();
    mine.chDone = ['st-mercury', 'st-mars'];
    mine.chacc = ['st-giants'];
    mine.chProg = { 'st-giants': 3 };
    const offworld = stageStarterCharterEventV1({
      draft: mine, extensions: EXTENSIONS,
      event: { kind: 'mined', address: solWorld(134) }, receiptOrdinal: 3,
    });
    expect(offworld.kind).toBe('current');
    expect(mine.chProg['st-giants']).toBe(3);
    const giant = stageStarterCharterEventV1({
      draft: mine, extensions: EXTENSIONS,
      event: { kind: 'mined', address: solWorld(135) }, receiptOrdinal: 4,
    });
    expect(giant.kind).toBe('ready');
    expect(mine.chProg['st-giants']).toBe(4);
    expect(mine.chDone).toEqual(['st-mercury', 'st-mars']);
  });

  it('rejects canonical Earth and foreign leaf-seed aliases from Sol-tour event credit', () => {
    const earth = state();
    earth.chacc = ['st-land'];
    expect(stageStarterCharterEventV1({
      draft: earth, extensions: EXTENSIONS,
      event: { kind: 'landfall', address: solWorld(133) }, receiptOrdinal: 5,
    }).kind).toBe('current');
    expect(earth).toMatchObject({ chacc: ['st-land'], chDone: [], essence: 10 });

    const falseMercury = state();
    falseMercury.chacc = ['st-mercury'];
    const foreignBase = foreignWorld(133);
    const foreignMercuryLeafAlias = Object.freeze({
      ...solWorld(131),
      galaxy: foreignBase.galaxy,
      star: foreignBase.star,
    }) as CanonicalCF1WorldAddress;
    expect(stageStarterCharterEventV1({
      draft: falseMercury, extensions: EXTENSIONS,
      event: { kind: 'landfall', address: foreignMercuryLeafAlias }, receiptOrdinal: 6,
    }).kind).toBe('current');
    expect(falseMercury).toMatchObject({ chacc: ['st-mercury'], chDone: [], essence: 10 });

    const wrongOrdinal = state();
    wrongOrdinal.chacc = ['st-mercury'];
    const mercury = solWorld(131);
    const wrongMercuryOrdinal = Object.freeze({
      ...mercury,
      planet: Object.freeze({ ...mercury.planet, ordinal: mercury.planet.ordinal + 1 }),
    }) as CanonicalCF1WorldAddress;
    expect(stageStarterCharterEventV1({
      draft: wrongOrdinal, extensions: EXTENSIONS,
      event: { kind: 'landfall', address: wrongMercuryOrdinal }, receiptOrdinal: 7,
    }).kind).toBe('current');
    expect(wrongOrdinal).toMatchObject({ chacc: ['st-mercury'], chDone: [], essence: 10 });
  });

  it('does not let landfall counterfeit an accepted Discover Life Charter', () => {
    const landing = state();
    landing.chacc = ['st-land', 'st-scan'];
    const result = stageStarterCharterEventV1({
      draft: landing, extensions: EXTENSIONS,
      event: { kind: 'landfall', address: solWorld(131) }, receiptOrdinal: 5,
    });
    expect(result).toMatchObject({ kind: 'ready' });
    expect(landing.chDone).toContain('st-land');
    expect(landing.chDone).not.toContain('st-scan');
    expect(landing.chacc).toContain('st-scan');
  });

  it('protects a multi-row landfall reward when its exact gear carrier is absent', () => {
    const landing = state();
    landing.chacc = ['st-land', 'st-mercury', 'st-scan'];
    const result = stageStarterCharterEventV1({
      draft: landing, extensions: EXTENSIONS,
      event: { kind: 'landfall', address: solWorld(131) }, receiptOrdinal: 5,
    });
    /* Mercury includes gear, so an absent Arc 2 carrier protects the whole
       reward instead of paying a partial Stardust/gear successor. */
    expect(result).toMatchObject({ kind: 'refused', reason: 'starter-gear:absent' });
    expect(landing.chDone).toContain('st-land');
    expect(landing.chDone).not.toContain('st-scan');
  });

  it('accepts through one receipt/CAS, publishes only after durability, and is replay-free', async () => {
    const built = await fixture(state());
    const before = JSON.stringify(built.state);
    const ordinal = built.runtime.sessionRng.ordinal;
    const outcome = await commitStarterCharterAcceptV1({
      state: built.state, id: 'st-land', codecNow: 10, authority: built.runtime,
    });
    expect(outcome.kind).toBe('committed');
    expect(JSON.stringify(built.state)).toBe(before);
    if (outcome.kind !== 'committed') return;
    expect(outcome.state.chacc).toEqual(['st-land']);
    expect(outcome.transaction.receipt.kind).toBe('arc8-starter-charter-accept-v1');
    expect(built.runtime.sessionRng).toMatchObject({ ordinal: ordinal + 1, draws: {} });
    publishStarterCharterAcceptFieldsV1(built.state, outcome);
    expect(built.state.chacc).toEqual(['st-land']);
    expect((await commitStarterCharterAcceptV1({
      state: built.state, id: 'st-land', codecNow: 10, authority: built.runtime,
    })).kind).toBe('current');
    expect(built.runtime.sessionRng.ordinal).toBe(ordinal + 1);
    await built.runtime.release();
  });

  it('commits the codec-canonical acceptance when an unrelated veteran mining stamp moves', async () => {
    const save = state();
    save.mined = [['veteran-clock-floor', VETERAN_CODEC_NOW - 30 * 6e5]];
    save.mineX = [['veteran-clock-floor', 1]];
    const built = await fixture(save, VETERAN_CODEC_NOW);
    const before = JSON.stringify(built.state);
    const outcome = await commitStarterCharterAcceptV1({
      state: built.state,
      id: 'st-land',
      codecNow: VETERAN_CODEC_NOW + 1,
      authority: built.runtime,
    });

    expect(outcome.kind).toBe('committed');
    expect(JSON.stringify(built.state)).toBe(before);
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction.state).toEqual(outcome.transaction.saved.canonicalState);
    expect(new Map(outcome.transaction.state.mined).get('veteran-clock-floor'))
      .toBe(VETERAN_CODEC_NOW + 1 - 30 * 6e5);
    await built.runtime.release();
  });

  it('settles already-proven Mercury plus its exact gear in the same acceptance receipt', async () => {
    const source = state();
    source.surfSeen.push(131);
    const built = await fixture(source);
    const outcome = await commitStarterCharterAcceptV1({
      state: built.state, id: 'st-mercury', codecNow: 10, authority: built.runtime,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.state).toMatchObject({
      chDone: ['st-mercury'], chacc: [], essence: 20,
      stats: { essenceEarned: 30, charters: 1 },
      items: [['headlamp', 1]], equip: { helmet: 'headlamp' },
    });
    const loot = readArc2Loot(built.runtime.extensions);
    expect(loot.kind).toBe('loaded');
    if (loot.kind === 'loaded' && loot.state.kind === 'inventory') {
      expect(loot.state.inventory.entries[0]?.instance).toMatchObject({
        baseId: 'headlamp', provenance: { kind: 'expedition' },
      });
      expect(loot.state.inventory.equipped[0]).toMatchObject({ slot: 'helmet' });
    }
    await built.runtime.release();
  });

  it('requires the exact committed starter gear carrier, not only its legacy mirror', async () => {
    const source = state();
    source.surfSeen.push(131);
    const built = await fixture(source);
    const authority: Pick<F4RuntimeAuthority, 'commitAction'> = Object.freeze({
      commitAction: async (input) => {
        const committed = await built.runtime.commitAction(input);
        if (committed.kind !== 'committed') return committed;
        const loaded = readArc2Loot(committed.saved.extensions);
        if (loaded.kind !== 'loaded' || loaded.state.kind !== 'inventory') return committed;
        const original = loaded.state.inventory.entries[0]?.instance;
        if (!original) return committed;
        const replacement = createGearInstance(makeGearSourceActionId({
          kind: 'expedition', ownerId: 'starter-accept-postcommit-substitution',
          actionKey: 'wrong-headlamp', receiptId: 'fixture',
        }), 0, getFixedCraftGenerationPlan('headlamp', original.generation.seed));
        const inventory = Object.freeze({
          ...loaded.state.inventory,
          entries: loaded.state.inventory.entries.map((entry) => Object.freeze({
            ...entry,
            instance: entry.instance.instanceId === original.instanceId ? replacement : entry.instance,
          })),
          equipped: loaded.state.inventory.equipped.map((binding) => Object.freeze({
            ...binding,
            instanceId: binding.instanceId === original.instanceId
              ? replacement.instanceId : binding.instanceId,
          })),
        });
        const altered = prepareArc2LootInventoryWrite({
          extensions: committed.saved.extensions,
          inventory,
          stackableCounts: loaded.state.stackableCounts,
        });
        if (altered.kind !== 'prepared') throw new Error(altered.kind);
        expect(projectArc2LootLegacyMirror(altered.state)).toEqual({
          items: committed.state.items,
          equip: committed.state.equip,
          equipAff: committed.state.equipAff,
        });
        return Object.freeze({
          ...committed,
          saved: Object.freeze({ ...committed.saved, extensions: altered.extensions }),
        });
      },
    });
    const outcome = await commitStarterCharterAcceptV1({
      state: built.state, id: 'st-mercury', codecNow: 10, authority,
    });
    expect(outcome).toMatchObject({
      kind: 'committed-convergence', detail: 'committed-verification-mismatch',
    });
    expect(await built.repository.revision()).toBe(1);
    await built.runtime.release();
  });

  it('refuses a divergent parent Arc 2 mirror before acceptance or receipt durability', async () => {
    const built = await fixture(state());
    built.state.items = [['headlamp', 1]];
    const before = JSON.stringify(built.state);
    const ordinal = built.runtime.sessionRng.ordinal;
    const outcome = await commitStarterCharterAcceptV1({
      state: built.state, id: 'st-land', codecNow: 10, authority: built.runtime,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', detail: 'rejected',
      transaction: {
        kind: 'rejected', stage: 'derive',
        message: 'starter Charter Arc 2 authority diverged',
      },
    });
    expect(JSON.stringify(built.state)).toBe(before);
    expect(await built.repository.revision()).toBe(0);
    expect(await built.repository.readReceipt(ordinal)).toBeUndefined();
    expect(built.runtime.sessionRng).toMatchObject({ ordinal, draws: {} });
    await built.runtime.release();
  });

  it('keeps an eligible acceptance unpublished on stale authority', async () => {
    const built = await fixture(state());
    expect((await built.repository.mutate({ expectedRevision: 0, writes: [] })).kind).toBe('committed');
    const before = JSON.stringify(built.state);
    const outcome = await commitStarterCharterAcceptV1({
      state: built.state, id: 'st-land', codecNow: 10, authority: built.runtime,
    });
    expect(outcome).toMatchObject({ kind: 'refused', detail: 'stale' });
    expect(JSON.stringify(built.state)).toBe(before);
    await built.runtime.release();
  });

  it('converges after durability on forged operation, receipt, canonical save, or state hitchhikes', async () => {
    const mutations: ReadonlyArray<Readonly<{
      name: string;
      mutate: (outcome: CommittedAction) => CommittedAction;
    }>> = [
      {
        name: 'operation',
        mutate: (outcome) => Object.freeze({
          ...outcome,
          plan: Object.freeze({ ...outcome.plan, operation: 'forged-starter-operation' }),
        }),
      },
      {
        name: 'receipt kind',
        mutate: (outcome) => Object.freeze({
          ...outcome,
          receipt: Object.freeze({ ...outcome.receipt, kind: 'forged-starter-receipt' }),
        }),
      },
      {
        name: 'plan receipt ordinal',
        mutate: (outcome) => Object.freeze({
          ...outcome,
          plan: Object.freeze({
            ...outcome.plan,
            receiptOrdinal: outcome.plan.receiptOrdinal + 1,
          }),
        }),
      },
      {
        name: 'canonical save',
        mutate: (outcome) => Object.freeze({
          ...outcome,
          saved: Object.freeze({
            ...outcome.saved,
            canonicalState: Object.freeze({ ...outcome.saved.canonicalState, hp: 9 }),
          }),
        }),
      },
      {
        name: 'unrelated state',
        mutate: (outcome) => {
          const forgedState = Object.freeze({ ...outcome.state, hp: 9 });
          return Object.freeze({
            ...outcome,
            state: forgedState,
            saved: Object.freeze({ ...outcome.saved, canonicalState: forgedState }),
          });
        },
      },
    ];
    for (const mutation of mutations) {
      const built = await fixture(state());
      const authority: Pick<F4RuntimeAuthority, 'commitAction'> = Object.freeze({
        commitAction: async (input) => {
          const outcome = await built.runtime.commitAction(input);
          return outcome.kind === 'committed' ? mutation.mutate(outcome) : outcome;
        },
      });
      const outcome = await commitStarterCharterAcceptV1({
        state: built.state, id: 'st-land', codecNow: 10, authority,
      });
      expect(outcome, mutation.name).toMatchObject({
        kind: 'committed-convergence', detail: 'committed-verification-mismatch',
      });
      await built.runtime.release();
    }
  });
});
