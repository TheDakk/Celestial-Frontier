import { describe, expect, it } from 'vitest';
import REGISTRY_JSON from '../../baseline-v1.8.9/content-registry.json';
import {
  createF4RuntimeAuthority,
  type F4RuntimeAuthority,
} from '../apps/game/src/f4-runtime-authority.js';
import {
  ARC9_BINDER_CLAIMABLE_SET_IDS_V1,
  commitArc9BinderSetClaimV1,
  projectArc9BinderReadModelV1,
  publishArc9BinderSetClaimFieldsV1,
  renderArc9BinderPanelV1,
} from '../apps/game/src/binder-sets.js';
import {
  createMemoryBackend,
  createRevisionedRepository,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  V4_PRIMARY_KEY,
  type ContentRegistry,
  type SaveStateV2,
} from '@cf/persistence';
import { makeGenome } from '@cf/domain-genome';
import { createSessionRNG } from '@cf/domain-sessionrng';

const REGISTRY = REGISTRY_JSON as unknown as ContentRegistry;
type CommittedAction = Extract<
  Awaited<ReturnType<F4RuntimeAuthority['commitAction']>>,
  { readonly kind: 'committed' }
>;

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
    surveyedSet: [], galSeen: [], surfSeen: [], xpFirsts: [], sysSeen: [], starKindsSeen: [],
    ptypesSeen: [], eventKeysSeen: [], evAnnounced: [], unlocked: [], landed: [], contacted: [],
    waveOffs: [], primeFill: {}, frontierUnlocked: false, frontierEnding: null, seenGuide: false,
    tutDone: true, rnSeen: '', tutSnapPending: null, scoutId: null, chWeek: -1, chProg: {},
    chacc: [], chDone: [], homeId: null, voiceOn: true, combatSfxOn: true, logMap: [], codex: [],
  };
}

function kingdomCodex(): SaveStateV2['codex'] {
  return ['fauna', 'flora', 'fungi', 'microbe'].map((kingdom, index) => {
    const g = makeGenome(100 + index, kingdom, 0.5) as unknown as Record<string, unknown>;
    return [`s${100 + index}`, {
      id: `s${100 + index}`, name: `Species ${index}`,
      kind: kingdom[0]!.toUpperCase() + kingdom.slice(1), tier: 1,
      realm: 'Forest', sapient: 0, from: 'Test', hybrid: false, g, where: null,
    }];
  }) as SaveStateV2['codex'];
}

async function fixture(save: SaveStateV2): Promise<Readonly<{
  runtime: F4RuntimeAuthority;
  state: SaveStateV2;
  repository: ReturnType<typeof createRevisionedRepository>;
}>> {
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xB1D3_0001).state(),
  );
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state: save, extensions: f4.extensions }, REGISTRY, 10);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(backend, REGISTRY, 10);
  if (migration.kind !== 'migrated') throw new Error(`Binder fixture was ${migration.kind}`);
  await backend.apply(initial.operations);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY, initialRevision: 0,
    initialExtensions: f4.extensions, initialState: initial.canonicalState,
    restoredAuthority: f4.authority, freshSessionSeed: 123,
    ownerId: 'binder-test', token: 'binder-token', leaseTtlMs: 1_000,
    now: () => 10, visible: true, answerable: true,
  });
  expect((await runtime.heartbeat()).kind).toBe('owned');
  return Object.freeze({ runtime, state: initial.canonicalState, repository });
}

describe('Arc 9 Binder', () => {
  it('projects canonical pages, seven claimable sets, and an honest Paragon boundary', () => {
    const save = state();
    save.codex = kingdomCodex();
    save.claimedSets = ['para10'];
    const projected = projectArc9BinderReadModelV1(save);
    expect(projected.kind).toBe('projected');
    if (projected.kind !== 'projected') return;
    expect(projected.model.pages.map(({ id }) => id)).toEqual([
      'spectrum', 'realms', 'bodies', 'themes', 'flavors', 'sizes',
    ]);
    expect(projected.model.sets.map(({ id }) => id)).toEqual(ARC9_BINDER_CLAIMABLE_SET_IDS_V1);
    expect(projected.model.sets.find(({ id }) => id === 'kingdoms')).toMatchObject({
      complete: true, claimed: false, stardust: 25,
    });
    expect(projected.model.pages.find(({ id }) => id === 'flavors')?.slots.map(({ color }) => color))
      .toEqual(['#7fe6a0', '#ff8a72', '#8fb4ff', '#ffd96a', '#c79fff']);
    expect(projected.model.paragon).toMatchObject({ status: 'unavailable', preservedClaim: true });
    const html = renderArc9BinderPanelV1(projected.model);
    expect(html).toContain('data-binder-claim="kingdoms"');
    expect(html).toContain('The Fifty Paragons');
    expect(html).not.toContain('data-binder-claim="para10"');
  });

  it('claims one currently-proven set with Stardust, lifetime total, receipt, and no replay', async () => {
    const save = state();
    save.codex = kingdomCodex();
    const built = await fixture(save);
    const { runtime } = built;
    const live = built.state;
    const priorOrdinal = runtime.sessionRng.ordinal;
    const claimed = await commitArc9BinderSetClaimV1({
      state: live, setId: 'kingdoms', codecNow: 10, authority: runtime,
    });
    expect(claimed.kind).toBe('committed');
    if (claimed.kind !== 'committed') return;
    expect(claimed.state.claimedSets).toEqual(['kingdoms']);
    expect(claimed.state.essence).toBe(35);
    expect(claimed.state.stats.essenceEarned).toBe(45);
    expect(claimed.transaction.receipt.kind).toBe('arc9-binder-set-claim-v1');
    expect(runtime.sessionRng.ordinal).toBe(priorOrdinal + 1);
    expect(runtime.sessionRng.draws).toEqual({});
    publishArc9BinderSetClaimFieldsV1(live, claimed);
    expect(live.claimedSets).toEqual(['kingdoms']);
    expect((await commitArc9BinderSetClaimV1({
      state: live, setId: 'kingdoms', codecNow: 10, authority: runtime,
    })).kind).toBe('current');
    expect(runtime.sessionRng.ordinal).toBe(priorOrdinal + 1);
    await runtime.release();
  });

  it('refuses incomplete, Paragon, corrupt and stale writes without publishing a reward', async () => {
    const save = state();
    const built = await fixture(save);
    const { runtime } = built;
    expect((await commitArc9BinderSetClaimV1({
      state: built.state, setId: 'kingdoms', codecNow: 10, authority: runtime,
    })).kind).toBe('refused');
    await expect(commitArc9BinderSetClaimV1({
      state: save, setId: 'para10' as never, codecNow: 10, authority: runtime,
    })).rejects.toThrow();
    const corrupt = state();
    corrupt.codex = [["dup", kingdomCodex()[0]![1]], ["dup", kingdomCodex()[1]![1]]];
    expect(projectArc9BinderReadModelV1(corrupt).kind).toBe('protected');

    const eligible = state();
    eligible.codex = kingdomCodex();
    const staleBuilt = await fixture(eligible);
    const staleRuntime = staleBuilt.runtime;
    await staleBuilt.repository.mutate({ expectedRevision: 0, writes: [] });
    const before = JSON.stringify(staleBuilt.state);
    const stale = await commitArc9BinderSetClaimV1({
      state: staleBuilt.state, setId: 'kingdoms', codecNow: 10, authority: staleRuntime,
    });
    expect(stale).toMatchObject({ kind: 'refused', detail: 'stale' });
    expect(JSON.stringify(staleBuilt.state)).toBe(before);
    await runtime.release();
    await staleRuntime.release();
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
          plan: Object.freeze({ ...outcome.plan, operation: 'forged-binder-operation' }),
        }),
      },
      {
        name: 'receipt kind',
        mutate: (outcome) => Object.freeze({
          ...outcome,
          receipt: Object.freeze({ ...outcome.receipt, kind: 'forged-binder-receipt' }),
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
      const save = state();
      save.codex = kingdomCodex();
      const built = await fixture(save);
      const authority: Pick<F4RuntimeAuthority, 'commitAction'> = Object.freeze({
        commitAction: async (input) => {
          const outcome = await built.runtime.commitAction(input);
          return outcome.kind === 'committed' ? mutation.mutate(outcome) : outcome;
        },
      });
      const outcome = await commitArc9BinderSetClaimV1({
        state: built.state, setId: 'kingdoms', codecNow: 10, authority,
      });
      expect(outcome, mutation.name).toMatchObject({
        kind: 'committed-convergence', detail: 'committed-verification-mismatch',
      });
      await built.runtime.release();
    }
  });
});
