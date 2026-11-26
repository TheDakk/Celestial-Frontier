// One press of Tame, Scavenge or Sample is one committed receipt of two draws. A species the Compendium holds
// is never offered again; an attempt is spent hit or miss; a press not allowed spends nothing.
// LEGACY celestial-frontier.html, v1.8.9: `tryCapture` 14865-14887, the card 13973-13988, the gates 13798 and 13734.
import { describe, expect, it } from 'vitest';
import { SCENE_OWNERSHIP_ADDRESS_RESOLVER, captureChanceV1, preflightCaptureV1, projectCaptureCapacityScenariosV1 } from '@cf/domain-acquisition';
import { resolveCF1WorldAddress } from '@cf/scene';
import { arc4OwnershipLegacyMirrorMatches, readArc4Ownership } from '@cf/persistence';
import { CAPTURE_RECEIPT_KIND_V1, captureGateV1, captureResultNotices, commitCaptureV1, type CaptureAuthorityV1, type CaptureTransactionV1 } from '../src/capture';
import { LEASE_TTL_MS, REGISTRY, createSaveRuntime } from '../src/save/index';
import { EARTH, capturePage, captureSession, earthRows, rosterFor, type CapturePage } from './capture-support';
import { SOL, solWorld } from './landing-support';
import { NOW, dump } from './save-support';

type Press = Awaited<ReturnType<CapturePage['press']>>;
const committed = (outcome: Press): Extract<Press, { readonly kind: 'committed' }> => {
  if (outcome.kind !== 'committed') throw new Error(`press was ${outcome.kind}: ${'detail' in outcome ? outcome.detail : ''}`);
  return outcome;
};
/** Sessions whose first press on Earth surely hits (every chance there is at least 0.02) or surely misses (at most 0.95). */
const HIT = { sessionSeed: captureSession((success) => success < 0.02) };
const MISS = { sessionSeed: captureSession((success) => success > 0.96) };
const yieldUsed = (page: CapturePage): number => page.durable().bioX.find(([seed]) => seed === SOL.earth)?.[1][0] ?? 0;
const ownershipOf = (page: CapturePage) => {
  const read = readArc4Ownership(page.runtime.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (read.kind !== 'loaded') throw new Error(`ownership was ${read.kind}`);
  return read.state;
};

describe('the card of a scanned, grounded world', () => {
  it('on Earth at epoch 0: 8 tame candidates, 8 scavenge candidates (6 flora, 2 fungi), 3 sample candidates', async () => {
    const page = await capturePage();
    const kingdoms = page.snapshot().candidates.map((candidate) => candidate.identity.kingdom);
    const count = (kingdom: string) => kingdoms.filter((k) => k === kingdom).length;
    expect([count('fauna'), count('flora'), count('fungi'), count('microbe')]).toEqual([8, 6, 2, 3]);
    const card = page.card();
    expect(card.offered).toEqual(['tame', 'scavenge', 'sample']);
    expect(card).toMatchObject({ total: 19, catalogued: 0, left: 16, digest: '0 / 19 in your Compendium — tame and scavenge the rest · 16 attempts left' });
    expect(card.fence).not.toBeNull();
  });

  it('a verb is offered only while its kind has a species the Compendium does not hold', async () => {
    const page = await capturePage(HIT);
    for (let press = 0; press < 3; press++) await page.press('sample');
    const caught = page.durable().codex.length;
    const card = page.card();
    expect(card.catalogued).toBe(caught);
    expect(card.offered.includes('sample')).toBe(caught < 3);
    expect(card.digest).toBe(`${caught} / 19 in your Compendium — tame and scavenge the rest · 13 attempts left`);
  });

  it('a world not landed on, not scanned, or met in training offers nothing and has no fence', async () => {
    const mars = solWorld(SOL.mars);
    const page = await capturePage();
    expect(captureGateV1(page.durable(), page.runtime.extensions, mars)).toBe('not-landed');
    expect(captureGateV1((await capturePage({ scanned: [] })).durable(), page.runtime.extensions, EARTH)).toBe('not-scanned');
    expect(captureGateV1((await capturePage({ change: (state) => { state.tutDone = false; } })).durable(), page.runtime.extensions, EARTH)).toBe('training');
    expect(captureGateV1(page.durable(), page.runtime.extensions, EARTH)).toBeNull();
    const landedScanned = await capturePage({ scanned: [SOL.mars], change: (state) => { state.landed = [SOL.mars]; } });
    expect(captureGateV1(landedScanned.durable(), landedScanned.runtime.extensions, mars)).toBeNull();
    // A conquered world is grounded too, landed set or not (13796-13798).
    const scanned = await capturePage({ scanned: [SOL.mars] });
    expect(captureGateV1(scanned.durable(), scanned.runtime.extensions, mars)).toBe('not-landed');
    expect(captureGateV1({ ...scanned.durable(), conquered: [[SOL.mars, { t: 0, tier: 1 }]] }, scanned.runtime.extensions, mars)).toBeNull();
    expect((await capturePage({ scanned: [] })).card()).toMatchObject({ offered: [], fence: null, left: null });
  });
});

describe('a press is one committed receipt', () => {
  it('a hit: two draws, pick then success; one attempt spent; the species in the Compendium with the roster\'s genome', async () => {
    const page = await capturePage(HIT);
    const before = { revision: page.runtime.revision, ordinal: page.runtime.diagnostics().sessionOrdinal, state: page.durable() };
    const outcome = committed(await page.press('tame'));
    expect(outcome.transaction.plan).toMatchObject({ draws: [{ domain: 'capture.candidate' }, { domain: 'capture.success' }] });
    const [pick, success] = outcome.transaction.plan.draws.map(({ value }) => value);
    const { facts } = outcome;
    // The pick is the first value over the pool in roster order (14873); the pool is Earth's eight fauna, rows 11 to 18.
    expect(facts.sourceOrdinal).toBe(11 + ((pick! * 8) | 0));
    expect(facts.chance).toBe(captureChanceV1({ verb: 'tame', tier: facts.tier as 0, ring: 0, contactCapturePoints: 0 }));
    expect(facts.hit).toBe(success! < facts.chance);
    expect(facts.hit).toBe(true);
    // One revision, one receipt.
    expect(page.runtime.revision).toBe(before.revision + 1);
    expect(outcome.transaction.receipt).toMatchObject({ kind: CAPTURE_RECEIPT_KIND_V1, ordinal: before.ordinal });
    expect(await page.repository.readReceipt(before.ordinal)).toEqual(outcome.transaction.receipt);
    expect(page.runtime.diagnostics().sessionDraws).toEqual({ 'capture.candidate': 1, 'capture.success': 1 });
    const stored = (await page.stored()).state;
    expect(stored).toEqual(outcome.state);
    // The Compendium holds the species, by the roster's own genome and its Earth name.
    const row = earthRows()[facts.sourceOrdinal]!;
    expect(stored.codex).toHaveLength(1);
    expect(stored.codex[0]![0]).toBe(`s${row.seed as number}`);
    expect(stored.codex[0]![1].g).toMatchObject({ seed: row.seed, kingdom: 'fauna' });
    expect(facts.name).toBe(row._earthName);
    expect(stored.bioX).toEqual([[SOL.earth, [1, 0]]]);
    expect(facts.left).toBe(15);
    // The carrier and the state agree, and the carrier holds one creature.
    expect(arc4OwnershipLegacyMirrorMatches(ownershipOf(page), stored)).toBe(true);
    expect(ownershipOf(page).creatures).toHaveLength(1);
    // Nothing else of the save moves.
    expect({ ...stored, codex: before.state.codex, bioX: before.state.bioX, stats: before.state.stats, unlocked: before.state.unlocked, seenSp: before.state.seenSp })
      .toEqual(before.state);
    expect(page.live.codex).toHaveLength(1);
    expect(page.outcomes.committed).toEqual([{ kind: 'capture.tame', receiptOrdinal: before.ordinal }]);
    expect(captureResultNotices(facts)[0]).toMatchObject({ title: 'Species Catalogued', message: [`${facts.name} — view it in your Compendium.`] });
  });

  it('a rare first catch raises the best find and unlocks its rarity achievements in the same press', async () => {
    // LEGACY 16474-16480: storing a species raises `stats.best` to its tier, then every achievement is looked at;
    // `rare` asks for a best of 3, `legend` for 5 (16355-16356). Kaum, in the home galaxy, has fauna of tier 5.
    const resolved = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 2737406570, x: 160.5956227169372, y: -89.13221201486886 }, planet: { seed: 1757105165 } });
    if (!resolved.ok) throw new Error(resolved.reason);
    const kaum = resolved.address;
    const grounded = { scanned: [kaum.planet.seed], change: (state: { landed: number[] }) => { state.landed = [kaum.planet.seed]; } };
    const preflight = preflightCaptureV1((await capturePage(grounded)).snapshot(kaum), 'tame');
    if (preflight.kind !== 'ready') throw new Error(preflight.reason);
    const tiers = projectCaptureCapacityScenariosV1(preflight, 0).scenarios.slice(1).map(({ tier }) => tier!);
    const wanted = tiers.findIndex((tier) => tier >= 5);
    expect(wanted).toBeGreaterThanOrEqual(0);
    // A session whose first press picks that species and surely lands.
    const page = await capturePage({ ...grounded, sessionSeed: captureSession((success, pick) => success < 0.02 && ((pick * tiers.length) | 0) === wanted) });
    const before = page.durable();
    const { facts, state } = committed(await page.press('tame', kaum));
    expect(facts).toMatchObject({ hit: true, tier: tiers[wanted], stardust: tiers[wanted]! - 3 });
    expect(state.essence).toBe(before.essence + facts.stardust);
    expect(state.stats.best).toBe(facts.tier);
    expect(facts.achievementIds).toEqual(expect.arrayContaining(['first', 'rare', 'legend']));
    expect(state.unlocked).toEqual(expect.arrayContaining(['first', 'rare', 'legend']));
    expect(page.live.unlocked).toEqual(expect.arrayContaining(['rare', 'legend']));
  });

  it('a miss lowers the remaining Yield by one and adds nothing', async () => {
    const page = await capturePage(MISS);
    const before = page.durable();
    const outcome = committed(await page.press('tame'));
    expect(outcome.facts).toMatchObject({ hit: false, left: 15, stardust: 0 });
    expect({ ...outcome.state, bioX: before.bioX }).toEqual(before);
    expect(outcome.state.bioX).toEqual([[SOL.earth, [1, 0]]]);
    expect(ownershipOf(page)).toMatchObject({ creatures: [], catalogSpecies: [] });
    expect(page.card().left).toBe(15);
    // The species that slipped away stays in the pool.
    expect(page.snapshot().candidates.filter((c) => c.identity.kingdom === 'fauna')).toHaveLength(8);
    expect(page.card().offered).toContain('tame');
    expect(await page.receipts()).toHaveLength(1);
  });

  it('a species once caught is never offered again; with all of a kind caught the press says so and spends nothing', async () => {
    const page = await capturePage(HIT);
    const caught: number[] = [];
    let refusal: Press | null = null;
    for (let press = 0; press < 16 && refusal === null; press++) {
      const outcome = await page.press('sample');
      if (outcome.kind !== 'committed') refusal = outcome;
      else if (outcome.facts.hit) {
        expect(caught).not.toContain(outcome.facts.sourceOrdinal);
        caught.push(outcome.facts.sourceOrdinal);
      }
    }
    expect([...caught].sort()).toEqual([10, 8, 9]);
    const used = yieldUsed(page);
    const before = await dump(page.backend);
    expect(refusal).toEqual({ kind: 'refused', detail: 'empty', transaction: null });
    expect(await dump(page.backend)).toEqual(before);
    expect(yieldUsed(page)).toBe(used);
    expect(page.outcomes.refused.at(-1)).toEqual({ kind: 'capture.sample', reason: 'declined:empty' });
  });

  it('at zero Yield every verb is depleted, and the pool refills at 1,200,000 ms of active play', async () => {
    const page = await capturePage({ activePlayMs: 1_199_000 });
    for (let press = 0; press < 16; press++) committed(await page.press(page.card().offered[0]!));
    expect(yieldUsed(page)).toBe(16);
    expect(page.card()).toMatchObject({ left: 0 });
    expect(page.card().digest.endsWith(' · worked out')).toBe(true);
    const offered = page.card().offered;
    expect(offered.length).toBeGreaterThan(0);
    const before = await dump(page.backend);
    // A kind with nothing left says so first; any other is worked out (14868-14872).
    for (const verb of ['tame', 'scavenge', 'sample'] as const) {
      expect(await page.press(verb)).toEqual({ kind: 'refused', detail: offered.includes(verb) ? 'depleted' : 'empty', transaction: null });
    }
    expect(await dump(page.backend)).toEqual(before);
    // One millisecond short of the next period the world is still spent; at it, the pool is whole again.
    page.time.advance(999);
    expect(page.runtime.activePlayMs()).toBe(1_199_999);
    expect(page.card().left).toBe(0);
    page.time.advance(1);
    expect(page.runtime.activePlayMs()).toBe(1_200_000);
    expect(page.card().left).toBe(16);
    // What was caught before the refill is still not offered: every later pick is a species not yet held.
    const held = new Set(page.durable().codex.map(([id]) => id));
    expect(held.size).toBeGreaterThan(0);
    for (let press = 0; press < 6 && page.card().offered.length > 0; press++) {
      const outcome = committed(await page.press(page.card().offered[0]!));
      expect(held.has(outcome.facts.speciesId)).toBe(false);
      if (outcome.facts.hit) held.add(outcome.facts.speciesId);
      expect(outcome.facts.left).toBe(15 - press);
      expect(outcome.state.bioX).toEqual([[SOL.earth, [press + 1, 1]]]);
    }
  });
});

describe('a press that is not allowed spends nothing', () => {
  const refusedWhole = async (page: CapturePage, press: () => Promise<Press>, detail: string) => {
    const before = await dump(page.backend);
    expect(await press()).toEqual({ kind: 'refused', detail, transaction: null });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.runtime.diagnostics().sessionDraws).toEqual({});
  };

  it('in training, on a world not landed on, and on a world not scanned', async () => {
    const training = await capturePage({ change: (state) => { state.tutDone = false; } });
    await refusedWhole(training, () => training.press('tame', EARTH, 'any'), 'training');
    const page = await capturePage({ scanned: [SOL.earth, SOL.mars] });
    await refusedWhole(page, () => page.press('tame', solWorld(SOL.mars), 'any'), 'not-landed');
    const unscanned = await capturePage({ scanned: [] });
    await refusedWhole(unscanned, () => unscanned.press('tame', EARTH, 'any'), 'not-scanned');
  });

  it('a press after the epoch turned is refused with the fence\'s reason and the Yield is unchanged', async () => {
    const shown = (await capturePage()).card().fence!;
    const turned = await capturePage({ change: (state) => { state.EPOCH_BASE = 1; } });
    expect(turned.card().fence).not.toBe(shown);
    await refusedWhole(turned, () => turned.press('tame', EARTH, shown), 'presentation:changed');
    expect(yieldUsed(turned)).toBe(0);
  });

  it('a press on a card that another press has since changed is refused', async () => {
    const page = await capturePage(HIT);
    const shown = page.card().fence!;
    committed(await page.press('tame', EARTH, shown));
    const before = await dump(page.backend);
    expect(await page.press('tame', EARTH, shown)).toEqual({ kind: 'refused', detail: 'presentation:changed', transaction: null });
    expect(await dump(page.backend)).toEqual(before);
  });

  it('after the lease is lost, under a write hold, and while another press is in flight', async () => {
    const lost = await capturePage();
    const successor = createSaveRuntime({
      backend: lost.backend, registry: REGISTRY, initialRevision: lost.runtime.revision, initialExtensions: lost.runtime.extensions,
      initialState: lost.durable(), restoredAuthority: null, freshSessionSeed: 9,
      ownerId: 'tab', token: 'document-b', leaseTtlMs: LEASE_TTL_MS, now: lost.time.now, visible: true, answerable: true,
    });
    const shown = lost.card().fence!;
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'held-by-other' });
    lost.time.advance(LEASE_TTL_MS + 1); // this page's lease ran out unrenewed
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    const before = await dump(lost.backend);
    expect(await lost.press('tame', EARTH, shown)).toMatchObject({ kind: 'refused', detail: 'lost' });
    expect(await dump(lost.backend)).toEqual(before);
    expect(lost.outcomes.refused).toEqual([{ kind: 'capture.tame', reason: 'lost' }]);
    expect(lost.live.bioX).toEqual([]);

    const held = await capturePage();
    const heldShown = held.card().fence!;
    held.gate.holdTransient('storage failed');
    const heldBefore = await dump(held.backend);
    expect(await held.press('tame', EARTH, heldShown)).toEqual({ kind: 'refused', detail: 'held', transaction: null });
    expect(await dump(held.backend)).toEqual(heldBefore);

    const busy = await capturePage();
    const [first, second] = await Promise.all([busy.press('tame'), busy.press('scavenge')]);
    expect(first.kind).toBe('committed');
    expect(second).toEqual({ kind: 'refused', detail: 'busy', transaction: null });
    expect(await busy.receipts()).toHaveLength(1);
  });

  it('two values that are not the receipt\'s own are refused, and nothing is written', async () => {
    const page = await capturePage();
    const before = await dump(page.backend);
    const other: CaptureAuthorityV1 = {
      extensions: page.runtime.extensions,
      activePlayMs: () => page.runtime.activePlayMs(),
      commitMultiOutcome: (input) => page.runtime.commitMultiOutcome({
        ...input, derive: (receipt) => input.derive({ ...receipt, draws: receipt.draws.map((draw) => ({ ...draw, value: 0.5 })) }),
      }),
    };
    expect(await commitCaptureV1({ runtime: other, state: page.durable(), address: EARTH, verb: 'tame', shown: page.card().fence!, codecNow: NOW, rosterFor }))
      .toMatchObject({ kind: 'refused', detail: 'draws:not-the-receipts' });
    expect(await dump(page.backend)).toEqual(before);
  });

  it('a checkpoint and a press asked for in the same turn are both stored, each once, and no reload is asked', async () => {
    const page = await capturePage();
    const shown = page.card().fence!;
    page.live.sfxVol = 0.4;
    const [saved, outcome] = await Promise.all([page.loop.request('settings'), page.press('tame', EARTH, shown)]);
    expect(saved).toBe(true);
    expect(outcome.kind).toBe('committed');
    expect((await page.stored()).state).toMatchObject({ sfxVol: 0.4, bioX: [[SOL.earth, [1, 0]]] });
    expect(await page.receipts()).toHaveLength(1);
    expect(page.reloads).toEqual([]);
  });
});

describe('what was stored is checked against what the press staged', () => {
  type Committed = Extract<CaptureTransactionV1, { readonly kind: 'committed' }>;
  const forged = (change: (state: Committed['state']) => Partial<Committed['state']>) => (o: Committed): Committed => {
    const state = { ...o.state, ...change(o.state) };
    return { ...o, state, saved: { ...o.saved, canonicalState: state } };
  };
  const forgeries: ReadonlyArray<readonly [string, string, (outcome: Committed) => Committed]> = [
    ['receipt kind', 'receipt', (o) => ({ ...o, receipt: { ...o.receipt, kind: 'forged' } })],
    ['receipt witness', 'receipt', (o) => ({ ...o, receipt: { ...o.receipt, witness: 'forged' } })],
    ['receipt ordinal', 'receipt', (o) => ({ ...o, receipt: { ...o.receipt, ordinal: o.receipt.ordinal + 1 } })],
    ['stored state', 'state-not-stored', (o) => ({ ...o, saved: { ...o.saved, canonicalState: { ...o.saved.canonicalState, hp: 1 } } })],
    ['attempts spent', 'yield', forged(() => ({ bioX: [] }))],
    ['Compendium', 'compendium', forged(() => ({ codex: [] }))],
    ['Stardust', 'stardust', forged((state) => ({ essence: state.essence + 5 }))],
  ];
  for (const [name, mismatch, forge] of forgeries) {
    it(`a forged ${name} is not taken for the press`, async () => {
      const page = await capturePage(HIT);
      const forging: CaptureAuthorityV1 = {
        extensions: page.runtime.extensions,
        activePlayMs: () => page.runtime.activePlayMs(),
        commitMultiOutcome: async (input) => { const outcome = await page.runtime.commitMultiOutcome(input); return outcome.kind === 'committed' ? forge(outcome) : outcome; },
      };
      const outcome = await commitCaptureV1({
        runtime: forging, state: page.durable(), address: EARTH, verb: 'tame', shown: page.card().fence!, codecNow: NOW, rosterFor,
      });
      expect(outcome).toMatchObject({ kind: 'committed-convergence', detail: `postcommit:${mismatch}` });
    });
  }
});
