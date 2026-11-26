// Accepting a Charter (and claiming one whose deed is already done) is one committed action: the accept, any
// completion it proves, its Stardust and gear, and the receipt land in one revision or not at all.
// LEGACY celestial-frontier.html, v1.8.9: `chAccept` 24878-24906, `_chComplete` 24865-24877.
// Ported from the painted port's tests/starter-charters.test.ts (its eight commit cases), re-pointed at this
// game's save loop.
import { describe, expect, it } from 'vitest';
import { createGearInstance, getFixedCraftGenerationPlan, makeGearSourceActionId } from '@cf/domain-loot';
import {
  WEEKLY_CHARTER_CYCLE_ACTIVE_MS,
  prepareArc2LootInventoryWrite,
  projectArc2LootLegacyMirror,
  readArc2Loot,
  weeklyCharterSlateV1,
  type SaveStateV2,
} from '@cf/persistence';
import {
  STARTER_CHARTER_ACCEPT_RECEIPT_KIND_V1,
  commitStarterCharterAcceptV1,
  operationForWeeklyCharterAcceptV1,
  settleCharterAcceptV1,
  type CharterAcceptAuthorityV1,
} from '../src/guidance';
import { LEASE_TTL_MS, REGISTRY, createSaveRuntime } from '../src/save/index';
import { actionPage, type ActionPage } from './action-support';
import { NOW, dump } from './save-support';

const TRADES_DONE = ['st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq'];
type Committed = Extract<Awaited<ReturnType<CharterAcceptAuthorityV1['commitAction']>>, { readonly kind: 'committed' }>;

/** The accept as the page makes it: against the stored state and the runtime's own extensions. */
const accept = (page: ActionPage, id: Parameters<typeof commitStarterCharterAcceptV1>[0]['id'], authority: CharterAcceptAuthorityV1 = page.runtime, state: SaveStateV2 = page.durable()) =>
  commitStarterCharterAcceptV1({ state, extensions: page.runtime.extensions, id, codecNow: NOW, authority, activePlayMs: page.runtime.activePlayMs() });

describe('accepting a Charter is one committed action', () => {
  it('an accept writes the state and its receipt in one revision, and the receipt ordinal rises by exactly one', async () => {
    const page = await actionPage();
    const before = { revision: page.runtime.revision, ordinal: page.runtime.diagnostics().sessionOrdinal, live: JSON.stringify(page.live) };
    const outcome = await settleCharterAcceptV1(page.loop, { id: 'st-land', codecNow: NOW });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.state.chacc).toEqual(['st-land']);
    expect(outcome.transaction.receipt).toMatchObject({ kind: STARTER_CHARTER_ACCEPT_RECEIPT_KIND_V1, ordinal: before.ordinal });
    expect(page.runtime.revision).toBe(before.revision + 1);
    // No random value is drawn: only the receipt ordinal moves.
    expect(page.runtime.diagnostics()).toMatchObject({ sessionOrdinal: before.ordinal + 1, sessionDraws: {} });
    expect(await page.repository.readReceipt(before.ordinal)).toEqual(outcome.transaction.receipt);
    expect((await page.stored()).state.chacc).toEqual(['st-land']);
    // The page sees what was stored, and hears of it once.
    expect(page.live.chacc).toEqual(['st-land']);
    expect(page.outcomes.committed).toEqual([{ kind: 'charter-accept', receiptOrdinal: before.ordinal }]);

    // The same accept again changes nothing and takes no receipt.
    const again = await settleCharterAcceptV1(page.loop, { id: 'st-land', codecNow: NOW });
    expect(again).toEqual({ kind: 'current', id: 'st-land' });
    expect(page.runtime.revision).toBe(before.revision + 1);
    expect(page.runtime.diagnostics().sessionOrdinal).toBe(before.ordinal + 1);
  });

  it('the stored accept is the codec\'s own form of the state when an unrelated mining stamp moves', async () => {
    const page = await actionPage({ change: (state) => { state.mined = [['veteran-clock-floor', NOW - 30 * 6e5]]; state.mineX = [['veteran-clock-floor', 1]]; } });
    const outcome = await commitStarterCharterAcceptV1({
      state: page.durable(), extensions: page.runtime.extensions, id: 'st-land', codecNow: NOW + 1, authority: page.runtime,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.state).toEqual(outcome.transaction.saved.canonicalState);
    expect(new Map(outcome.state.mined).get('veteran-clock-floor')).toBe(NOW + 1 - 30 * 6e5);
  });

  it('a claim: a Charter whose deed is already done is completed, paid and outfitted in the accept\'s own receipt', async () => {
    const page = await actionPage({ change: (state) => { state.essence = 10; state.stats.essenceEarned = 20; state.surfSeen.push(131); } });
    const outcome = await settleCharterAcceptV1(page.loop, { id: 'st-mercury', codecNow: NOW });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.facts.stage.completions).toMatchObject([{ id: 'st-mercury', alreadyProven: true, stardust: 10, gearId: 'headlamp' }]);
    expect(outcome.state).toMatchObject({
      chDone: ['st-mercury'], chacc: [], essence: 20,
      stats: { essenceEarned: 30, charters: 1 },
      items: [['headlamp', 1]], equip: { helmet: 'headlamp' },
    });
    expect(page.live).toMatchObject({ chDone: ['st-mercury'], essence: 20, items: [['headlamp', 1]] });
    const loot = readArc2Loot(page.runtime.extensions);
    expect(loot.kind === 'loaded' && loot.state.kind === 'inventory' && loot.state.inventory.entries[0]?.instance)
      .toMatchObject({ baseId: 'headlamp', provenance: { kind: 'expedition' } });
    expect(await page.receipts()).toHaveLength(1);
  });

  it('a stored gear carrier that is not the one the accept made is not taken for it', async () => {
    const page = await actionPage({ change: (state) => { state.surfSeen.push(131); } });
    const authority: CharterAcceptAuthorityV1 = {
      commitAction: async (input) => {
        const committed = await page.runtime.commitAction(input);
        if (committed.kind !== 'committed') return committed;
        const loaded = readArc2Loot(committed.saved.extensions);
        if (loaded.kind !== 'loaded' || loaded.state.kind !== 'inventory') return committed;
        const original = loaded.state.inventory.entries[0]!.instance;
        const replacement = createGearInstance(makeGearSourceActionId({
          kind: 'expedition', ownerId: 'starter-accept-postcommit-substitution', actionKey: 'wrong-headlamp', receiptId: 'fixture',
        }), 0, getFixedCraftGenerationPlan('headlamp', original.generation.seed));
        const altered = prepareArc2LootInventoryWrite({
          extensions: committed.saved.extensions,
          inventory: {
            ...loaded.state.inventory,
            entries: loaded.state.inventory.entries.map((entry) => ({ ...entry, instance: replacement })),
            equipped: loaded.state.inventory.equipped.map((binding) => ({ ...binding, instanceId: replacement.instanceId })),
          },
          stackableCounts: loaded.state.stackableCounts,
        });
        if (altered.kind !== 'prepared') throw new Error(altered.kind);
        // The altered carrier still mirrors the same items: only the exact carrier tells them apart.
        expect(projectArc2LootLegacyMirror(altered.state)).toEqual({
          items: committed.state.items, equip: committed.state.equip, equipAff: committed.state.equipAff,
        });
        return { ...committed, saved: { ...committed.saved, extensions: altered.extensions } };
      },
    };
    expect(await accept(page, 'st-mercury', authority)).toMatchObject({ kind: 'committed-convergence', detail: 'committed-verification-mismatch' });
  });

  it('a state whose gear disagrees with its carrier is refused before anything is written', async () => {
    const page = await actionPage();
    const before = await dump(page.backend);
    const ordinal = page.runtime.diagnostics().sessionOrdinal;
    const diverged = { ...page.durable(), items: [['headlamp', 1]] as Array<[string, number]> };
    expect(await accept(page, 'st-land', page.runtime, diverged)).toMatchObject({
      kind: 'refused', detail: 'rejected',
      transaction: { kind: 'rejected', stage: 'derive', message: 'starter Charter gear carrier diverged' },
    });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.runtime.diagnostics()).toMatchObject({ sessionOrdinal: ordinal, sessionDraws: {} });
  });

  it('an accept on a save another page has moved is refused, writes nothing and is not shown', async () => {
    const page = await actionPage();
    expect((await page.repository.mutate({ expectedRevision: page.runtime.revision, writes: [] })).kind).toBe('committed');
    const receipts = await page.receipts();
    const outcome = await settleCharterAcceptV1(page.loop, { id: 'st-land', codecNow: NOW });
    expect(outcome).toMatchObject({ kind: 'refused', detail: 'stale' });
    expect(page.live.chacc).toEqual([]);
    expect(await page.receipts()).toEqual(receipts);
    expect(page.outcomes.refused).toEqual([{ kind: 'charter-accept', reason: 'stale' }]);
    expect(page.reloads).toHaveLength(1);
  });

  it('a stored result that is not the accept\'s own (operation, receipt, ordinal, stored state, any other field) is not taken for it', async () => {
    const forgeries: ReadonlyArray<readonly [string, (outcome: Committed) => Committed]> = [
      ['operation', (o) => ({ ...o, plan: { ...o.plan, operation: 'forged-starter-operation' } })],
      ['receipt kind', (o) => ({ ...o, receipt: { ...o.receipt, kind: 'forged-starter-receipt' } })],
      ['plan receipt ordinal', (o) => ({ ...o, plan: { ...o.plan, receiptOrdinal: o.plan.receiptOrdinal + 1 } })],
      ['stored state', (o) => ({ ...o, saved: { ...o.saved, canonicalState: { ...o.saved.canonicalState, hp: 9 } } })],
      ['another field', (o) => { const forged = { ...o.state, hp: 9 }; return { ...o, state: forged, saved: { ...o.saved, canonicalState: forged } }; }],
    ];
    for (const [name, forge] of forgeries) {
      const page = await actionPage();
      const authority: CharterAcceptAuthorityV1 = {
        commitAction: async (input) => {
          const outcome = await page.runtime.commitAction(input);
          return outcome.kind === 'committed' ? forge(outcome) : outcome;
        },
      };
      expect(await accept(page, 'st-land', authority), name).toMatchObject({ kind: 'committed-convergence', detail: 'committed-verification-mismatch' });
    }
  });

  it('a weekly Charter is accepted on the receipt\'s own active play, once a board', async () => {
    const at = 6 * WEEKLY_CHARTER_CYCLE_ACTIVE_MS + 1234;
    const [first, second] = weeklyCharterSlateV1(6);
    const page = await actionPage({ activePlayMs: at, change: (state) => { state.chDone = [...TRADES_DONE]; } });
    const outcome = await settleCharterAcceptV1(page.loop, { id: first!, codecNow: NOW, activePlayMs: page.runtime.activePlayMs() });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.state.chacc).toContain(first);
    expect(outcome.state.chWeek).toBe(6);
    expect(outcome.transaction.plan.operation).toBe(`arc8.starter-charter-accept:${first}@6`);
    expect(operationForWeeklyCharterAcceptV1(first!, 7)).toBe(`arc8.starter-charter-accept:${first}@7`);
    expect(page.live.chWeek).toBe(6);
    expect(await settleCharterAcceptV1(page.loop, { id: first!, codecNow: NOW, activePlayMs: page.runtime.activePlayMs() })).toEqual({ kind: 'current', id: first });
    // Without the board's clock a weekly accept is refused, not guessed.
    expect((await settleCharterAcceptV1(page.loop, { id: second!, codecNow: NOW })).kind).toBe('refused');
  });
});

describe('an accept that cannot be stored changes nothing', () => {
  it('a fourth accept is refused with the legacy game\'s words and takes no receipt', async () => {
    const page = await actionPage({ change: (state) => { state.chDone = ['st-land', 'st-mine', 'st-scan']; state.chacc = ['wk-land', 'wk-mine', 'wk-scan']; } });
    const before = await dump(page.backend);
    expect(await settleCharterAcceptV1(page.loop, { id: 'st-scout', codecNow: NOW }))
      .toEqual({ kind: 'refused', detail: 'Three charters is a full slate — see one through first.' });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.outcomes.refused).toEqual([{ kind: 'charter-accept', reason: 'declined:Three charters is a full slate — see one through first.' }]);
    expect(page.loop.mayWrite()).toBe(true);
  });

  it('during training the board is inert, except for the accept that ends it', async () => {
    const page = await actionPage({ change: (state) => { state.tutDone = false; } });
    const before = await dump(page.backend);
    expect(await settleCharterAcceptV1(page.loop, { id: 'st-land', codecNow: NOW }))
      .toEqual({ kind: 'refused', detail: 'the board is inert until training ends' });
    expect(await dump(page.backend)).toEqual(before);
    expect((await settleCharterAcceptV1(page.loop, { id: 'st-land', codecNow: NOW, graduation: true })).kind).toBe('committed');
    expect(page.live.chacc).toEqual(['st-land']);
  });

  it('under a write hold the accept is refused and storage is not touched', async () => {
    const page = await actionPage();
    page.gate.holdTransient('storage failed');
    const before = await dump(page.backend);
    expect(await settleCharterAcceptV1(page.loop, { id: 'st-land', codecNow: NOW })).toEqual({ kind: 'refused', detail: 'held' });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.outcomes.refused).toEqual([{ kind: 'charter-accept', reason: 'held' }]);
  });

  it('after the lease is lost the accept is refused, writes nothing and says so', async () => {
    const page = await actionPage();
    const successor = createSaveRuntime({
      backend: page.backend, registry: REGISTRY, initialRevision: page.runtime.revision, initialExtensions: page.runtime.extensions,
      initialState: page.durable(), restoredAuthority: null, freshSessionSeed: 9,
      ownerId: 'tab', token: 'document-b', leaseTtlMs: LEASE_TTL_MS, now: page.time.now, visible: true, answerable: true,
    });
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'held-by-other' });
    page.time.advance(LEASE_TTL_MS + 1); // this page's lease ran out unrenewed
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    const before = await dump(page.backend);
    expect(await settleCharterAcceptV1(page.loop, { id: 'st-land', codecNow: NOW })).toMatchObject({ kind: 'refused', detail: 'lost' });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.live.chacc).toEqual([]);
    expect(page.outcomes.refused).toEqual([{ kind: 'charter-accept', reason: 'lost' }]);
  });

  it('while another action is in flight the accept is refused as busy and spends nothing', async () => {
    const page = await actionPage();
    const [first, second] = await Promise.all([
      settleCharterAcceptV1(page.loop, { id: 'st-land', codecNow: NOW }),
      settleCharterAcceptV1(page.loop, { id: 'st-mercury', codecNow: NOW }),
    ]);
    expect(first.kind).toBe('committed');
    expect(second).toEqual({ kind: 'refused', detail: 'busy' });
    expect(page.live.chacc).toEqual(['st-land']);
    expect(await page.receipts()).toHaveLength(1);
  });
});
