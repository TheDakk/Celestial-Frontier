// Outcomes committed with receipts: the four paths of the save runtime over the persistence owners, and the save
// loop's one door for a product action (the write hold, one action at a time, checkpoints held meanwhile).
// The runtime tests are ported from the painted port's tests/f4-runtime-authority.test.ts (its outcome, ordered
// outcome, pre-draw and action cases), re-pointed at this game's boot.
import { describe, expect, it } from 'vitest';
import {
  createMemoryBackend,
  createRevisionedRepository,
  prepareF4AuthorityUpdate,
  readF4Authority,
  readRevisionedSaveV5WithRecovery,
  type StorageBackend,
} from '@cf/persistence';
import {
  LEASE_TTL_MS, REGISTRY, createProductActionCoordinator, createSaveRuntime, type PreDrawMultiOutcomeInput, type SaveRuntime,
} from '../src/save/index';
import { bootedHarness, pausable } from './save-loop-support';
import { NOW, bootedPage, dump } from './save-support';

/** A page holding the lease whose session seed is stored: the state outcomes are committed from. */
async function seeded(backend: StorageBackend = createMemoryBackend()) {
  const page = await bootedPage(backend);
  expect((await page.runtime.commit(page.live, NOW)).kind).toBe('committed');
  return page;
}
async function stored(backend: StorageBackend) {
  const read = await readRevisionedSaveV5WithRecovery(backend, REGISTRY, NOW);
  if (read.kind !== 'loaded') throw new Error(`stored save was ${read.kind}`);
  return read;
}
/** A pre-draw policy that is ready and adds `amount` Stardust, as the painted port's test wrote it. */
const readyToAdd = (amount: number): PreDrawMultiOutcomeInput<Readonly<{ witness: string }>, string>['preDraw'] => (input, authorizer) => {
  const expectedF4 = prepareF4AuthorityUpdate(input.extensions, { activePlayMs: input.activePlayMs }, input.nextSessionRng);
  const expectedPrepared = input.codec.prepare({
    state: { ...input.draft, essence: input.draft.essence + amount },
    extensions: expectedF4.extensions,
  });
  return authorizer.ready(Object.freeze({ witness: 'capture' }), ({ draft, draws }, settlement) => {
    expect(draws.length).toBe(input.domains.length);
    draft.essence += amount;
    return settlement.authorize({ state: draft, witness: 'capture' }, expectedPrepared);
  });
};
const receipts = async (backend: StorageBackend): Promise<string[]> => [...await backend.keys('receipts')].sort();
const rng = (runtime: SaveRuntime) => { const d = runtime.diagnostics(); return { ordinal: d.sessionOrdinal, draws: d.sessionDraws }; };

describe('save runtime: outcomes with receipts', () => {
  it('an outcome commit writes the state and its receipt in one revision, and the receipt ordinal rises by exactly one', async () => {
    const { backend, runtime, live } = await seeded();
    const repository = createRevisionedRepository(backend);
    const before = { revision: runtime.revision, essence: live.essence };
    let derivations = 0;

    const first = await runtime.commitOutcome({
      state: live, domain: 'loot.rarity', receiptKind: 'loot-settlement', codecNow: NOW,
      derive: ({ draft, value, receiptOrdinal }) => {
        derivations++;
        draft.essence += value < 0.5 ? 1 : 2;
        return { state: draft, witness: `loot:${receiptOrdinal}:${draft.essence}` };
      },
    });
    expect(first.kind).toBe('committed');
    if (first.kind !== 'committed') return;
    expect(derivations).toBe(1);
    expect(runtime.revision).toBe(before.revision + 1);
    expect(first.receipt.ordinal).toBe(0);
    expect(first.state.essence).toBe(before.essence + (first.plan.value < 0.5 ? 1 : 2));
    // The caller's state is not touched: it publishes the committed one.
    expect(live.essence).toBe(before.essence);
    expect(await repository.readReceipt(0)).toEqual(first.receipt);
    expect((await stored(backend)).state.essence).toBe(first.state.essence);
    expect(rng(runtime)).toEqual({ ordinal: 1, draws: { 'loot.rarity': 1 } });
    expect(runtime.checkpointParent()).toEqual(first.state);

    const second = await runtime.commitOutcome({
      state: first.state, domain: 'loot.rarity', receiptKind: 'loot-settlement', codecNow: NOW,
      derive: ({ draft }) => ({ state: draft, witness: 'loot:again' }),
    });
    expect(second.kind === 'committed' && second.receipt.ordinal).toBe(1);
    expect(runtime.revision).toBe(before.revision + 2);
    expect(await receipts(backend)).toEqual(['receipt:0', 'receipt:1']);
    expect(readF4Authority((await stored(backend)).extensions)).toMatchObject({
      kind: 'loaded', authority: { sessionRng: { ordinal: 2, draws: { 'loot.rarity': 2 } } },
    });
  });

  it('before the session seed is stored an outcome is refused, its policy never runs, and nothing is written', async () => {
    const { backend, runtime, live } = await bootedPage();
    const before = await dump(backend);
    let derivations = 0;
    await expect(runtime.commitOutcome({
      state: live, domain: 'loot.rarity', receiptKind: 'loot-settlement', codecNow: NOW,
      derive: ({ draft }) => { derivations++; return { state: draft, witness: 'never' }; },
    })).resolves.toEqual({ kind: 'protected', reason: 'authority-absent' });
    expect(derivations).toBe(0);
    expect(await dump(backend)).toEqual(before);
    // The page keeps its lease: the seed's first checkpoint can still be stored.
    expect(runtime.diagnostics()).toMatchObject({ leaseOwned: true, staleBlocked: false });
  });

  it('two outcomes submitted against the same parent: the second is stale and cannot erase the first', async () => {
    const { backend, runtime, live } = await seeded();
    const beforeEssence = live.essence;
    const add = (amount: number, name: string) => runtime.commitOutcome({
      state: live, domain: `concurrent.${name}`, receiptKind: `concurrent-${name}`, codecNow: NOW,
      derive: ({ draft }) => { draft.essence += amount; return { state: draft, witness: `${name}:${draft.essence}` }; },
    });
    const [winner, loser] = await Promise.all([add(11, 'first'), add(101, 'second')]);
    expect(winner.kind).toBe('committed');
    expect(loser).toMatchObject({ kind: 'stale', plan: { domain: 'concurrent.second', receiptOrdinal: 0 } });
    expect(runtime.diagnostics()).toMatchObject({ staleWrites: 1, staleBlocked: true, leaseOwned: false, sessionOrdinal: 1, sessionDraws: { 'concurrent.first': 1 } });
    expect(await receipts(backend)).toEqual(['receipt:0']);
    expect((await stored(backend)).state.essence).toBe(beforeEssence + 11);
  });

  it('an ordered group of draws is one receipt and one revision; the same domain twice is two draws', async () => {
    const { backend, runtime, live } = await seeded();
    const revision = runtime.revision;
    const domains = ['capture.candidate', 'capture.success', 'capture.candidate'];
    const pending = runtime.commitMultiOutcome({
      state: live, domains, receiptKind: 'capture-attempt', codecNow: NOW,
      derive: ({ draft, draws }) => {
        expect(draws.map((d) => d.domain)).toEqual(['capture.candidate', 'capture.success', 'capture.candidate']);
        expect(draws[0]!.value).not.toBe(draws[2]!.value);
        draft.essence += draws.length;
        return { state: draft, witness: 'capture:3' };
      },
    });
    domains.length = 0; // the order was bound when the caller submitted
    const outcome = await pending;
    expect(outcome.kind).toBe('committed');
    expect(runtime.revision).toBe(revision + 1);
    expect(await receipts(backend)).toEqual(['receipt:0']);
    expect(rng(runtime)).toEqual({ ordinal: 1, draws: { 'capture.candidate': 2, 'capture.success': 1 } });
    expect(() => runtime.commitMultiOutcome({ state: live, domains: null as never, receiptKind: 'x', codecNow: NOW, derive: ({ draft }) => ({ state: draft, witness: 'x' }) }))
      .toThrow(/draw plan/);
  });

  it('a pre-draw refusal draws nothing and writes nothing; a ready plan commits its draws under one receipt', async () => {
    const { backend, runtime, live } = await seeded();
    const before = { dump: await dump(backend), revision: runtime.revision, rng: rng(runtime) };
    const domains = ['capture.candidate', 'capture.success'];
    await expect(runtime.commitPreDrawMultiOutcome({
      state: live, domains, receiptKind: 'capture-attempt', codecNow: NOW,
      preDraw: (input) => {
        expect(JSON.stringify(input)).not.toContain('"value"');
        return { kind: 'refused', reason: 'capacity' };
      },
    })).resolves.toEqual({ kind: 'pre-draw-refused', reason: 'capacity' });
    expect(await dump(backend)).toEqual(before.dump);
    expect([runtime.revision, rng(runtime)]).toEqual([before.revision, before.rng]);

    const committed = await runtime.commitPreDrawMultiOutcome({
      state: live, domains, receiptKind: 'capture-attempt', codecNow: NOW,
      preDraw: readyToAdd(1),
    });
    expect(committed.kind).toBe('committed');
    expect(runtime.revision).toBe(before.revision + 1);
    expect(await receipts(backend)).toEqual(['receipt:0']);
    expect(rng(runtime)).toEqual({ ordinal: 1, draws: { 'capture.candidate': 1, 'capture.success': 1 } });
  });

  it('an action takes a receipt ordinal and no random draw', async () => {
    const { backend, runtime, live } = await seeded();
    const revision = runtime.revision;
    const outcome = await runtime.commitAction({
      state: live, operation: 'charter.accept', receiptKind: 'charter-accept', codecNow: NOW,
      derive: ({ draft, operation, receiptOrdinal }) => {
        draft.essence += 5;
        return { state: draft, witness: `${operation}:${receiptOrdinal}` };
      },
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.receipt).toEqual({ ordinal: 0, kind: 'charter-accept', witness: 'charter.accept:0' });
    expect(runtime.revision).toBe(revision + 1);
    expect(rng(runtime)).toEqual({ ordinal: 1, draws: {} });
    expect((await stored(backend)).state.essence).toBe(live.essence + 5);
  });

  it('a policy that throws is rejected: nothing is written, no draw is spent, and the page can still write', async () => {
    const { backend, runtime, live } = await seeded();
    const before = { dump: await dump(backend), rng: rng(runtime) };
    const outcome = await runtime.commitOutcome({
      state: live, domain: 'loot.rarity', receiptKind: 'loot-settlement', codecNow: NOW,
      derive: () => { throw new Error('policy refused'); },
    });
    expect(outcome).toMatchObject({ kind: 'rejected', stage: 'derive' });
    expect(await dump(backend)).toEqual(before.dump);
    expect(rng(runtime)).toEqual(before.rng);
    expect((await runtime.commit(live, NOW)).kind).toBe('committed');
  });

  it('a commit after the lease is lost is refused and writes nothing, on each of the four paths', async () => {
    for (const path of ['outcome', 'multi', 'pre-draw', 'action'] as const) {
      const backend = createMemoryBackend();
      const first = await seeded(backend);
      const time = first.time;
      const successor = createSaveRuntime({
        backend, registry: REGISTRY, initialRevision: first.runtime.revision, initialExtensions: first.runtime.extensions,
        initialState: first.live, restoredAuthority: null, freshSessionSeed: 9,
        ownerId: 'tab', token: 'document-b', leaseTtlMs: LEASE_TTL_MS, now: time.now, visible: true, answerable: true,
      });
      await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'held-by-other' });
      time.advance(LEASE_TTL_MS + 1); // the first page's lease ran out unrenewed
      await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
      const before = await dump(backend);
      let derivations = 0;
      const derive = ({ draft }: { draft: typeof first.live }) => { derivations++; draft.essence = 999; return { state: draft, witness: 'late' }; };
      const base = { state: first.live, receiptKind: 'late', codecNow: NOW };
      const outcome = path === 'outcome' ? await first.runtime.commitOutcome({ ...base, domain: 'late.press', derive })
        : path === 'multi' ? await first.runtime.commitMultiOutcome({ ...base, domains: ['late.press'], derive })
        : path === 'action' ? await first.runtime.commitAction({ ...base, operation: 'late.press', derive })
        : await first.runtime.commitPreDrawMultiOutcome({
          ...base, domains: ['late.press'],
          preDraw: readyToAdd(1),
        });
      expect(outcome, path).toMatchObject({ kind: 'lost', reason: 'lease-lost' });
      expect(await dump(backend), path).toEqual(before);
      expect(first.runtime.diagnostics(), path).toMatchObject({ leaseOwned: false, accruing: false, sessionOrdinal: 0 });
      // With no lease left, the next press does not reach storage at all.
      await expect(first.runtime.commitAction({ ...base, operation: 'late.press', derive })).resolves.toEqual({ kind: 'lease-unavailable' });
      expect(derivations, path).toBeLessThanOrEqual(1);
    }
  });
});

describe('one product action at a time', () => {
  it('two claims at once: the second is refused until the first settles', () => {
    const coordinator = createProductActionCoordinator();
    const first = coordinator.tryClaim('capture.tame');
    expect(first).not.toBeNull();
    expect(coordinator.tryClaim('survey')).toBeNull();
    expect(coordinator).toMatchObject({ busy: true, operation: 'capture.tame' });
    first!.settle();
    expect(coordinator).toMatchObject({ busy: false, operation: null });
    expect(coordinator.tryClaim('survey')).not.toBeNull();
    expect(() => first!.settle()).toThrow(/no longer active/);
    expect(() => coordinator.tryClaim('')).toThrow(RangeError);
  });

  it('idle resolves at once when nothing is claimed, and otherwise when the claim settles', async () => {
    const coordinator = createProductActionCoordinator();
    await coordinator.idle();
    const claim = coordinator.tryClaim('survey')!;
    let waited = false;
    const waiting = coordinator.idle().then(() => { waited = true; });
    await Promise.resolve();
    expect(waited).toBe(false);
    claim.settle();
    await waiting;
    expect(waited).toBe(true);
  });
});

describe('save loop: settling a product action', () => {
  const addEssence = (amount: number) => (runtime: SaveRuntime, durable: Parameters<SaveRuntime['commit']>[0]) => runtime.commitAction({
    state: durable, operation: 'test.add', receiptKind: 'test-add', codecNow: NOW,
    derive: ({ draft }) => { draft.essence += amount; return { state: draft, witness: `add:${amount}` }; },
  });
  const heard = (h: Awaited<ReturnType<typeof bootedHarness>>) => {
    const events: unknown[] = [];
    h.bus.on('outcome:committed', (e) => { events.push(['committed', e]); });
    h.bus.on('outcome:refused', (e) => { events.push(['refused', e]); });
    return events;
  };

  it('a committed action is published into the live state, with its receipt named on the bus; unsaved settings stay', async () => {
    const h = await bootedHarness();
    const events = heard(h);
    const essence = h.live.essence;
    h.live.sfxVol = 0.25; // a settings change no checkpoint has stored yet
    const outcome = await h.loop.settle('test.add', addEssence(7));
    expect(outcome.kind).toBe('committed');
    expect(h.live.essence).toBe(essence + 7);
    expect(h.live.sfxVol).toBe(0.25);
    expect(events).toEqual([['committed', { kind: 'test.add', receiptOrdinal: 0 }]]);
    expect(h.committed).toEqual([h.runtime.revision]);
    // The next ordinary checkpoint stores the setting on top of the committed outcome.
    await expect(h.loop.request('settings')).resolves.toBe(true);
    const read = await readRevisionedSaveV5WithRecovery(h.backend, REGISTRY, NOW);
    expect(read.kind === 'loaded' && [read.state.essence, read.state.sfxVol]).toEqual([essence + 7, 0.25]);
    expect(h.reloads).toEqual([]);
  });

  it('a commit while the write hold is on is refused, and storage is not touched', async () => {
    const h = await bootedHarness();
    const events = heard(h);
    h.gate.holdTransient('storage failed');
    const before = await dump(h.backend);
    let ran = false;
    await expect(h.loop.settle('test.add', async (runtime, durable) => { ran = true; return addEssence(1)(runtime, durable); }))
      .resolves.toEqual({ kind: 'refused', reason: 'held' });
    expect(ran).toBe(false);
    expect(await dump(h.backend)).toEqual(before);
    expect(events).toEqual([['refused', { kind: 'test.add', reason: 'held' }]]);
  });

  it('a second action pressed while one is in flight is refused as busy and spends nothing', async () => {
    const paused = pausable();
    const h = await bootedHarness(paused.backend);
    const events = heard(h);
    const essence = h.live.essence;
    const entered = paused.pauseNext();
    const first = h.loop.settle('test.add', addEssence(3));
    await entered;
    expect(h.loop.actionInFlight).toBe('test.add');
    await expect(h.loop.settle('test.other', addEssence(100))).resolves.toEqual({ kind: 'refused', reason: 'busy' });
    paused.release();
    expect((await first).kind).toBe('committed');
    expect(h.loop.actionInFlight).toBeNull();
    expect(h.live.essence).toBe(essence + 3);
    expect(events).toEqual([
      ['refused', { kind: 'test.other', reason: 'busy' }],
      ['committed', { kind: 'test.add', receiptOrdinal: 0 }],
    ]);
    expect((await h.loop.settle('test.other', addEssence(1))).kind).toBe('committed');
  });

  it('a checkpoint asked for during an action waits for it; neither is stale and both are stored', async () => {
    const paused = pausable();
    const h = await bootedHarness(paused.backend);
    const essence = h.live.essence;
    const entered = paused.pauseNext();
    const action = h.loop.settle('test.add', addEssence(4));
    await entered;
    h.live.sfxVol = 0.5;
    const checkpoint = h.loop.request('settings');
    paused.release();
    expect((await action).kind).toBe('committed');
    await expect(checkpoint).resolves.toBe(true);
    expect(h.reloads).toEqual([]);
    const read = await readRevisionedSaveV5WithRecovery(h.backend, REGISTRY, NOW);
    expect(read.kind === 'loaded' && [read.state.essence, read.state.sfxVol]).toEqual([essence + 4, 0.5]);
  });

  it('an action pressed during a checkpoint waits for it and then commits on top of it', async () => {
    const paused = pausable();
    const h = await bootedHarness(paused.backend);
    const essence = h.live.essence;
    h.live.sfxVol = 0.75;
    const entered = paused.pauseNext();
    const checkpoint = h.loop.request('settings');
    await entered;
    const action = h.loop.settle('test.add', addEssence(2));
    paused.release();
    await expect(checkpoint).resolves.toBe(true);
    expect((await action).kind).toBe('committed');
    expect(h.reloads).toEqual([]);
    const read = await readRevisionedSaveV5WithRecovery(h.backend, REGISTRY, NOW);
    expect(read.kind === 'loaded' && [read.state.essence, read.state.sfxVol]).toEqual([essence + 2, 0.75]);
  });

  it('a stale press (another page moved the save) is refused, spends nothing, and the page asks for a reload', async () => {
    const h = await bootedHarness();
    const events = heard(h);
    const essence = h.live.essence;
    // Another writer moves the stored revision under this page.
    const moved = await createRevisionedRepository(h.backend).mutate({ expectedRevision: h.runtime.revision, writes: [] });
    expect(moved.kind).toBe('committed');
    const receiptsBefore = await receipts(h.backend);
    const outcome = await h.loop.settle('test.add', addEssence(50));
    expect(outcome.kind).toBe('stale');
    expect(h.live.essence).toBe(essence);
    expect(await receipts(h.backend)).toEqual(receiptsBefore);
    expect(events).toEqual([['refused', { kind: 'test.add', reason: 'stale' }]]);
    expect(h.reloads.length).toBe(1);
    expect(h.loop.status).toBe('reload-required');
    await expect(h.loop.settle('test.add', addEssence(1))).resolves.toEqual({ kind: 'refused', reason: 'reload-required' });
  });

  it('a policy refusal leaves the page writable and owes no reload', async () => {
    const h = await bootedHarness();
    const events = heard(h);
    const outcome = await h.loop.settle('test.add', (runtime, durable) => runtime.commitAction({
      state: durable, operation: 'test.add', receiptKind: 'test-add', codecNow: NOW,
      derive: () => { throw new Error('not enough Yield'); },
    }));
    expect(outcome.kind).toBe('rejected');
    expect(events).toEqual([['refused', { kind: 'test.add', reason: 'rejected' }]]);
    expect(h.reloads).toEqual([]);
    expect(h.loop.mayWrite()).toBe(true);
    expect((await h.loop.settle('test.add', addEssence(1))).kind).toBe('committed');
  });
});
