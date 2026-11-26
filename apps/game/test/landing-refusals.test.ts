// A landing that cannot be stored writes nothing, and a stored result that is not the landing's own is not taken
// for it. The save rules are this game's (one product action at a time, never under a hold, the lease).
import { describe, expect, it } from 'vitest';
import { commitLandingActionV1, type LandingAuthorityV1, type LandingTransactionV1 } from '../src/landing';
import { stageStarterCharterEventV1 } from '../src/guidance';
import { applyV5ExtensionWrites, prepareDescentWaveOffMutationV1 } from '@cf/persistence';
import { LEASE_TTL_MS, REGISTRY, createSaveRuntime } from '../src/save/index';
import { SOL, landingPage, landingSession, solWorld, waveOffSession, type LandingPage } from './landing-support';
import { NOW, dump } from './save-support';

type Committed = Extract<LandingTransactionV1, { readonly kind: 'committed' }>;
const direct = (page: LandingPage, seed: number, runtime: LandingAuthorityV1 = page.runtime) => commitLandingActionV1({
  runtime, state: page.durable(), address: solWorld(seed), worldName: 'A world', view: 1, codecNow: NOW, charters: stageStarterCharterEventV1,
});

describe('a landing that cannot be stored changes nothing', () => {
  it('a refused landing (lease lost) writes nothing and emits outcome:refused', async () => {
    for (const seed of [SOL.earth, SOL.venus]) { // the unrolled path and the rolled one
      const page = await landingPage();
      const successor = createSaveRuntime({
        backend: page.backend, registry: REGISTRY, initialRevision: page.runtime.revision, initialExtensions: page.runtime.extensions,
        initialState: page.durable(), restoredAuthority: null, freshSessionSeed: 9,
        ownerId: 'tab', token: 'document-b', leaseTtlMs: LEASE_TTL_MS, now: page.time.now, visible: true, answerable: true,
      });
      await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'held-by-other' });
      page.time.advance(LEASE_TTL_MS + 1); // this page's lease ran out unrenewed
      await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
      const before = await dump(page.backend);
      const live = JSON.stringify(page.live);
      expect(await page.land(solWorld(seed))).toMatchObject({ kind: 'refused', detail: 'lost' });
      expect(await dump(page.backend)).toEqual(before);
      expect(JSON.stringify(page.live)).toBe(live);
      expect(page.outcomes.refused).toEqual([{ kind: 'landing', reason: 'lost' }]);
      expect(page.outcomes.committed).toEqual([]);
      expect(page.arrived).toEqual([]);
      expect(page.views.count).toBe(0);
      expect(page.runtime.diagnostics()).toMatchObject({ sessionOrdinal: 0, sessionDraws: {} });
    }
  });

  it('under a write hold the landing is refused and storage is not touched', async () => {
    const page = await landingPage();
    page.gate.holdTransient('storage failed');
    const before = await dump(page.backend);
    expect(await page.land(solWorld(SOL.earth))).toEqual({ kind: 'refused', detail: 'held', transaction: null });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.outcomes.refused).toEqual([{ kind: 'landing', reason: 'held' }]);
  });

  it('a second press while a landing is in flight is refused as busy and spends nothing', async () => {
    const page = await landingPage();
    const [first, second] = await Promise.all([page.land(solWorld(SOL.venus)), page.land(solWorld(SOL.venus))]);
    expect(first.kind).toBe('committed');
    expect(second).toEqual({ kind: 'refused', detail: 'busy', transaction: null });
    expect(await page.receipts()).toHaveLength(1);
    expect(page.runtime.diagnostics().sessionDraws).toEqual({ 'descent.success': 1, 'descent.damage': 1 });
  });

  it('a landing on a save another page has moved is refused, draws nothing and asks for a reload', async () => {
    const page = await landingPage();
    expect((await page.repository.mutate({ expectedRevision: page.runtime.revision, writes: [] })).kind).toBe('committed');
    const receipts = await page.receipts();
    expect(await page.land(solWorld(SOL.venus))).toMatchObject({ kind: 'refused', detail: 'stale' });
    expect(await page.receipts()).toEqual(receipts);
    expect(page.live.waveOffs).toEqual([]);
    expect(page.reloads).toHaveLength(1);
  });

  it('a save with no world identity carrier is refused by name, and nothing is drawn', async () => {
    const page = await landingPage();
    const before = await dump(page.backend);
    const stripped: LandingAuthorityV1 = {
      extensions: { ...page.runtime.extensions, catalog: {} },
      commitAction: (input) => page.runtime.commitAction(input),
      commitMultiOutcome: (input) => page.runtime.commitMultiOutcome(input),
    };
    expect(await direct(page, SOL.venus, stripped)).toMatchObject({ kind: 'refused', detail: 'world-identity:absent' });
    expect(await dump(page.backend)).toEqual(before);
  });

  it('a state whose gear disagrees with its carrier is refused before anything is written', async () => {
    const page = await landingPage();
    const before = await dump(page.backend);
    const outcome = await commitLandingActionV1({
      runtime: page.runtime, state: { ...page.durable(), items: [['headlamp', 1]] }, address: solWorld(SOL.earth),
      worldName: 'Earth', view: 1, codecNow: NOW, charters: stageStarterCharterEventV1,
    });
    expect(outcome).toMatchObject({ kind: 'refused', detail: 'gear:mirror-diverged' });
    expect(await dump(page.backend)).toEqual(before);
  });
});

describe('what was stored is checked against what the landing staged', () => {
  const forgeries: ReadonlyArray<readonly [string, (outcome: Committed) => Committed]> = [
    ['receipt kind', (o) => ({ ...o, receipt: { ...o.receipt, kind: 'forged' } })],
    ['receipt witness', (o) => ({ ...o, receipt: { ...o.receipt, witness: `${o.receipt.witness} ` } })],
    ['receipt ordinal', (o) => ({ ...o, receipt: { ...o.receipt, ordinal: o.receipt.ordinal + 1 } })],
    ['stored state', (o) => ({ ...o, saved: { ...o.saved, canonicalState: { ...o.saved.canonicalState, essence: 999 } } })],
    ['landed set', (o) => { const state = { ...o.state, landed: [] }; return { ...o, state, saved: { ...o.saved, canonicalState: state } }; }],
    ['stood-on set', (o) => { const state = { ...o.state, surfSeen: [] }; return { ...o, state, saved: { ...o.saved, canonicalState: state } }; }],
    ['journal', (o) => { const state = { ...o.state, journal: [] }; return { ...o, state, saved: { ...o.saved, canonicalState: state } }; }],
    ['achievement', (o) => { const state = { ...o.state, unlocked: [] }; return { ...o, state, saved: { ...o.saved, canonicalState: state } }; }],
    ['health', (o) => { const state = { ...o.state, hp: o.state.hp - 1 }; return { ...o, state, saved: { ...o.saved, canonicalState: state } }; }],
    ['world identity', (o) => ({ ...o, saved: { ...o.saved, extensions: { ...o.saved.extensions, catalog: {} } } })],
  ];
  for (const [name, forge] of forgeries) {
    it(`a forged ${name} is not taken for the landing`, async () => {
      const page = await landingPage();
      const forging: LandingAuthorityV1 = {
        extensions: page.runtime.extensions,
        commitAction: async (input) => { const outcome = await page.runtime.commitAction(input); return outcome.kind === 'committed' ? forge(outcome) : outcome; },
        commitMultiOutcome: (input) => page.runtime.commitMultiOutcome(input),
      };
      expect(await direct(page, SOL.earth, forging)).toMatchObject({ kind: 'committed-convergence', result: 'landed' });
    });
  }

  it('an untouched result is the landing\'s own', async () => {
    const page = await landingPage();
    expect((await direct(page, SOL.earth)).kind).toBe('committed');
  });

  it('a forged wave-off (health, or the count remembered) is not taken for the press', async () => {
    for (const forge of [
      (o: Committed): Committed => { const state = { ...o.state, hp: o.state.hp + 1 }; return { ...o, state, saved: { ...o.saved, canonicalState: state } }; },
      (o: Committed): Committed => { // the count forgotten, in the carrier and in the state alike
        const { 'descent.wave-offs': _dropped, ...catalog } = o.saved.extensions.catalog as Record<string, { version: number; json: string }>;
        const state = { ...o.state, waveOffs: [] };
        return { ...o, state, saved: { ...o.saved, canonicalState: state, extensions: { ...o.saved.extensions, catalog } } };
      },
      (o: Committed): Committed => { // the state forgets what the carrier remembers
        const state = { ...o.state, waveOffs: [] };
        return { ...o, state, saved: { ...o.saved, canonicalState: state } };
      },
      (o: Committed): Committed => { // the carrier remembers one more than the state does
        const more = prepareDescentWaveOffMutationV1({ extensions: o.saved.extensions, legacyWaveOffs: o.state.waveOffs, address: solWorld(SOL.venus), outcome: 'failure' });
        if (more.kind !== 'prepared') throw new Error(more.reason);
        return { ...o, saved: { ...o.saved, extensions: applyV5ExtensionWrites(o.saved.extensions, more.writes).extensions } };
      },
    ]) {
      const page = await landingPage({ sessionSeed: waveOffSession() });
      const forging: LandingAuthorityV1 = {
        extensions: page.runtime.extensions,
        commitAction: (input) => page.runtime.commitAction(input),
        commitMultiOutcome: async (input) => { const outcome = await page.runtime.commitMultiOutcome(input); return outcome.kind === 'committed' ? forge(outcome) : outcome; },
      };
      expect(await direct(page, SOL.venus, forging)).toMatchObject({ kind: 'committed-convergence', result: 'wave-off' });
    }
  });

  it('a forged first landing (its samples, its Ascent progress, its Charter) is not taken for the landing', async () => {
    const forged = (change: (state: Committed['state']) => Partial<Committed['state']>) => (o: Committed): Committed => {
      const state = { ...o.state, ...change(o.state) };
      return { ...o, state, saved: { ...o.saved, canonicalState: state } };
    };
    for (const [mismatch, forge] of [
      ['samples', forged((state) => ({ essence: state.essence - 1 }))],
      ['samples', forged((state) => ({ stats: { ...state.stats, landings: 0 } }))],
      ['samples', forged(() => ({ cargo: [] }))],
      ['ascent', forged(() => ({ ascProg: {} }))],
      ['ascent', forged((state) => ({ ascCh: state.ascCh + 1 }))],
      ['charters', forged(() => ({ chDone: [] }))],
    ] as const) {
      const page = await landingPage({ sessionSeed: landingSession(), change: (state) => { state.chacc = ['st-land']; } });
      const forging: LandingAuthorityV1 = {
        extensions: page.runtime.extensions,
        commitAction: (input) => page.runtime.commitAction(input),
        commitMultiOutcome: async (input) => { const outcome = await page.runtime.commitMultiOutcome(input); return outcome.kind === 'committed' ? forge(outcome) : outcome; },
      };
      expect(await direct(page, SOL.mars, forging)).toEqual(expect.objectContaining({ kind: 'committed-convergence', detail: `postcommit:${mismatch}`, result: 'landed' }));
    }
  });
});
