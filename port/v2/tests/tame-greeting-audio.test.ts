import { beforeAll, describe, expect, it, vi } from 'vitest';
import type {
  AudioAnalyserNodeLike,
  AudioContextLike,
  AudioGainNodeLike,
  AudioLimiterNodeLike,
  AudioNodeLike,
  AudioParamLike,
  AudioScheduledSourceLike,
} from '@cf/audio';
import {
  canonicalGenomeIdentityV1,
  createBiosphereProgressV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createWorldDiscoveryRecordV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  createCreatureInstanceV2,
  createOwnershipSuccessorV2,
  ownershipSourceStateV1,
} from '../packages/domain/acquisition/src/model-v2.js';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome } from '@cf/domain-genome';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  createTameGreetingAudioOwner,
  type FeedExpressionOutcome,
  type TameGreetingAudioPolicy,
  type TameGreetingCaptureOutcome,
} from '../apps/game/src/tame-greeting-audio.js';

vi.mock('@cf/domain-sessionrng', () => {
  throw new Error('tame greeting audio imported gameplay SessionRNG');
});

beforeAll(() => installCaptureHooks());

class FakeParam implements AudioParamLike {
  value = 0;
  setValueAtTime(value: number): void { this.value = value; }
  linearRampToValueAtTime(value: number): void { this.value = value; }
}

class FakeNode implements AudioNodeLike {
  connects = 0;
  disconnects = 0;
  readonly connections: AudioNodeLike[] = [];
  connect(destination: AudioNodeLike): AudioNodeLike {
    this.connects++;
    this.connections.push(destination);
    return this;
  }
  disconnect(): void { this.disconnects++; }
}

function routesTo(
  source: FakeNode,
  destination: FakeNode,
  visited = new Set<FakeNode>(),
): boolean {
  if (source === destination) return true;
  if (visited.has(source)) return false;
  visited.add(source);
  return source.connections.some(
    (next) => next instanceof FakeNode && routesTo(next, destination, visited),
  );
}

class FakeGain extends FakeNode implements AudioGainNodeLike {
  readonly gain = new FakeParam();
}

class FakeAnalyser extends FakeNode implements AudioAnalyserNodeLike {
  fftSize = 0;
  smoothingTimeConstant = 0;
  readonly frequencyBinCount = 16;
  getFloatTimeDomainData(target: Float32Array): void { target.fill(0); }
}

class FakeLimiter extends FakeNode implements AudioLimiterNodeLike {
  readonly threshold = new FakeParam();
  readonly knee = new FakeParam();
  readonly ratio = new FakeParam();
  readonly attack = new FakeParam();
  readonly release = new FakeParam();
}

class FakeOscillator extends FakeNode implements AudioScheduledSourceLike {
  onended: (() => void) | null = null;
  readonly frequency = new FakeParam();
  type: OscillatorType = 'sine';
  starts = 0;
  stops = 0;
  start(): void { this.starts++; }
  stop(): void { this.stops++; }
}

class FakeContext implements AudioContextLike {
  readonly currentTime = 0;
  readonly destination = new FakeNode();
  state = 'running';
  closeCalls = 0;
  readonly oscillators: FakeOscillator[] = [];
  createGain(): FakeGain { return new FakeGain(); }
  createAnalyser(): FakeAnalyser { return new FakeAnalyser(); }
  createDynamicsCompressor(): FakeLimiter { return new FakeLimiter(); }
  createOscillator(): FakeOscillator {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }
  async resume(): Promise<void> { this.state = 'running'; }
  async close(): Promise<void> { this.closeCalls++; this.state = 'closed'; }
}

function fixture() {
  const resolved = resolveCF1WorldAddress({
    galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 424242, x: 560, y: 170 },
    planet: { seed: 133 },
  });
  if (!resolved.ok) throw new Error(resolved.reason);
  const identity = canonicalGenomeIdentityV1(makeGenome(68, 'fauna', 1));
  const discovery = createWorldDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', 'tame-greeting') as DiscoveryRecordId,
    speciesId: identity.speciesId,
    verb: 'tame',
    worldAddress: resolved.address,
    cycle: 0,
    sourceOrdinal: 5,
    firstForSpecies: true,
  });
  const creatureId = ownershipContentId('creature', 'tame-greeting') as CreatureInstanceId;
  const creature = createCreatureInstanceV1({
    creatureId,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: null,
    origin: 'wild',
    acquisitionRecordId: discovery.recordId,
    lineage: { kind: 'none', generation: 0 },
    xp: null,
    hurt: null,
    fed: 1,
    brood: null,
    assignment: null,
    bond: null,
  });
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity,
      alias: null,
      firstObservationId: discovery.recordId,
    })],
    discoveries: [discovery],
    creatures: [creature],
    specimenLots: [],
    biosphereProgress: [createBiosphereProgressV1({
      worldAddress: resolved.address,
      cycle: 0,
      used: 1,
      successful: [{ speciesId: identity.speciesId, source: 'tame' }],
    })],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  const initial = migrateOwnershipStateV1ToV2(source);
  const state = createOwnershipSuccessorV2(initial, {
    source: ownershipSourceStateV1(initial),
    bredAcquisitions: initial.bredAcquisitions,
    creatures: initial.creatures,
    creatureTombstones: initial.creatureTombstones,
    specimenLots: initial.specimenLots,
    specimenTombstones: initial.specimenTombstones,
    scoutCreatureId: initial.scoutCreatureId,
  });
  const outcome: TameGreetingCaptureOutcome = Object.freeze({
    kind: 'committed',
    durability: 'committed',
    convergence: 'none',
    verb: 'tame',
    result: Object.freeze({
      hit: true,
      speciesId: identity.speciesId,
      kingdom: 'fauna',
      worldKey: resolved.address.key,
      ownedRowId: creatureId,
      revision: state.revision + 37,
      ownershipRevision: state.revision,
    }),
  });
  return { state, outcome, discovery, creatureId, worldKey: resolved.address.key };
}

type MutablePolicy = { -readonly [Key in keyof TameGreetingAudioPolicy]: TameGreetingAudioPolicy[Key] };

function harness(policyPatch: Partial<TameGreetingAudioPolicy> = {}) {
  const data = fixture();
  const policy: MutablePolicy = {
    soundOn: true,
    creatureVoicesOn: true,
    visible: true,
    answerable: true,
    masterGain: 0.64,
    routeKey: data.worldKey,
    ...policyPatch,
  };
  const contexts: FakeContext[] = [];
  let nowMs = 100;
  let liveCounterpart = true;
  const owner = createTameGreetingAudioOwner({
    createContext: () => {
      const context = new FakeContext();
      contexts.push(context);
      return context;
    },
    nowMs: () => nowMs,
    readPolicy: () => policy,
    verifyCounterpart: () => liveCounterpart,
  });
  return {
    ...data,
    owner,
    policy,
    contexts,
    advance: (elapsedMs: number) => { nowMs += elapsedMs; },
    loseCounterpart: () => { liveCounterpart = false; owner.counterpartLost(); },
  };
}

function counterpart(eventKey: string) {
  return Object.freeze({ counterpartKey: 'capture-toast:7', eventKey, generation: 7 });
}

function feedOutcome(
  data: Pick<ReturnType<typeof fixture>, 'creatureId' | 'state'>,
  patch: Partial<NonNullable<FeedExpressionOutcome['result']>> = {},
): FeedExpressionOutcome {
  return Object.freeze({
    kind: 'committed',
    durability: 'committed',
    convergence: 'none',
    result: Object.freeze({
      creatureId: data.creatureId,
      fedBefore: 0,
      fedAfter: 1,
      receiptOrdinal: 4,
      revision: data.state.revision + 50,
      ownershipRevision: data.state.revision,
      ...patch,
    }),
  });
}

function feedSuccessor(
  parent: OwnershipStateV2,
  creatureId: CreatureInstanceId,
  fed: number,
): OwnershipStateV2 {
  return createOwnershipSuccessorV2(parent, {
    source: ownershipSourceStateV1(parent),
    bredAcquisitions: parent.bredAcquisitions,
    creatures: parent.creatures.map((row) => row.creatureId === creatureId
      ? createCreatureInstanceV2({ ...row, fed })
      : row),
    creatureTombstones: parent.creatureTombstones,
    specimenLots: parent.specimenLots,
    specimenTombstones: parent.specimenTombstones,
    scoutCreatureId: parent.scoutCreatureId,
  });
}

describe('Arc 7/8 player-live Tame greeting owner', () => {
  it('claims the exact registered wild Tame event before await and starts one synthesized voice', async () => {
    const h = harness();
    const beforeState = JSON.stringify(h.state);
    const beforeOutcome = JSON.stringify(h.outcome);
    expect(h.outcome.result).toMatchObject({
      revision: h.state.revision + 37,
      ownershipRevision: h.state.revision,
    });
    expect(h.outcome.result!.revision).not.toBe(h.outcome.result!.ownershipRevision);
    expect(h.owner.armNativeTameGesture()).toBe(true);
    expect(h.contexts).toHaveLength(1);
    const claim = h.owner.claimCommittedTameGreeting(h.outcome, h.state);
    expect(claim).toEqual({
      eventKey: `arc4:taming-succeeded:${h.discovery.recordId}`,
      worldKey: h.worldKey,
    });
    if (!claim) throw new Error('expected greeting claim');
    await expect(h.owner.playClaimedTameGreeting(claim, counterpart(claim.eventKey)))
      .resolves.toMatchObject({ kind: 'started' });
    expect(h.contexts[0]!.oscillators).toHaveLength(1);
    expect(h.contexts[0]!.oscillators[0]!.starts).toBe(1);
    expect(h.owner.diagnostics()).toMatchObject({
      armed: 0,
      claimedEvents: 1,
      lastDisposition: 'voice-started',
      counterpart: { key: 'capture-toast:7', generation: 7, status: 'live' },
      runtime: {
        voices: { active: 1, started: 1 },
        creatureEmitters: { active: 1 },
      },
    });
    await expect(h.owner.playClaimedTameGreeting(claim, counterpart(claim.eventKey)))
      .resolves.toEqual({ kind: 'silent', reason: 'claim-invalid' });
    expect(JSON.stringify(h.state)).toBe(beforeState);
    expect(JSON.stringify(h.outcome)).toBe(beforeOutcome);
  });

  it('fences the ownership revision without conflating the independent global revision', async () => {
    const stale = harness();
    expect(stale.owner.armNativeTameGesture()).toBe(true);
    const staleOwnership = Object.freeze({
      ...stale.outcome,
      result: Object.freeze({
        ...stale.outcome.result!,
        ownershipRevision: stale.state.revision + 1,
      }),
    });
    expect(stale.owner.claimCommittedTameGreeting(staleOwnership, stale.state)).toBeNull();
    expect(stale.owner.diagnostics().lastDisposition).toBe('ownership-stale');
    await Promise.resolve();
    expect(stale.contexts[0]!.closeCalls).toBe(1);

    const independentGlobal = harness();
    expect(independentGlobal.owner.armNativeTameGesture()).toBe(true);
    const differentGlobal = Object.freeze({
      ...independentGlobal.outcome,
      result: Object.freeze({
        ...independentGlobal.outcome.result!,
        revision: independentGlobal.outcome.result!.revision + 1_000,
      }),
    });
    const claim = independentGlobal.owner.claimCommittedTameGreeting(
      differentGlobal,
      independentGlobal.state,
    );
    expect(claim).not.toBeNull();
    expect(independentGlobal.owner.diagnostics().lastDisposition).toBe('event-claimed');
    await expect(independentGlobal.owner.playClaimedTameGreeting(
      claim!,
      counterpart(claim!.eventKey),
    )).resolves.toMatchObject({ kind: 'started' });
  });

  it('preserves a newly claimed Tame greeting while Main replaces an older toast counterpart', async () => {
    const h = harness();
    h.owner.armNativeTameGesture();
    const claim = h.owner.claimCommittedTameGreeting(h.outcome, h.state)!;
    /* Main claims before showToast; showToast first reports the prior toast
       lost, then binds the new claim to its freshly painted counterpart. */
    h.owner.counterpartLost();
    await expect(h.owner.playClaimedTameGreeting(claim, counterpart(claim.eventKey)))
      .resolves.toMatchObject({ kind: 'started' });
    expect(h.contexts[0]!.oscillators).toHaveLength(1);
  });

  it.each([
    ['Sound off', { soundOn: false }],
    ['Creature voices off', { creatureVoicesOn: false }],
    ['hidden', { visible: false }],
    ['unanswerable', { answerable: false }],
    ['no route', { routeKey: null }],
  ] as const)('creates no context when %s is already known at the gesture', (_label, patch) => {
    const h = harness(patch);
    expect(h.owner.armNativeTameGesture()).toBe(false);
    expect(h.contexts).toHaveLength(0);
    expect(h.owner.claimCommittedTameGreeting(h.outcome, h.state)).toBeNull();
    expect(h.contexts).toHaveLength(0);
  });

  it.each([
    ['miss', (outcome: TameGreetingCaptureOutcome) => ({
      ...outcome, result: { ...outcome.result!, hit: false },
    })],
    ['Scavenge', (outcome: TameGreetingCaptureOutcome) => ({
      ...outcome, verb: 'scavenge' as const,
    })],
    ['convergence', (outcome: TameGreetingCaptureOutcome) => ({
      ...outcome, convergence: 'read-only-reload' as const,
    })],
    ['result species mismatch', (outcome: TameGreetingCaptureOutcome) => ({
      ...outcome,
      result: {
        ...outcome.result!,
        speciesId: `species-v1:${'f'.repeat(64)}`,
      },
    })],
  ])('keeps an armed %s outcome silent and closes its prepared context', async (_label, mutate) => {
    const h = harness();
    expect(h.owner.armNativeTameGesture()).toBe(true);
    const outcome = mutate(h.outcome) as TameGreetingCaptureOutcome;
    expect(h.owner.claimCommittedTameGreeting(outcome, h.state)).toBeNull();
    await Promise.resolve();
    expect(h.contexts[0]!.closeCalls).toBe(1);
    expect(h.owner.diagnostics().runtime.voices.started).toBe(0);
  });

  it('fault-contains stale counterpart and synchronously stops on voice-off, hidden, and route loss', async () => {
    const stale = harness();
    stale.owner.armNativeTameGesture();
    const staleClaim = stale.owner.claimCommittedTameGreeting(stale.outcome, stale.state)!;
    stale.loseCounterpart();
    await expect(stale.owner.playClaimedTameGreeting(
      staleClaim,
      counterpart(staleClaim.eventKey),
    )).resolves.toMatchObject({ kind: 'silent' });
    expect(stale.contexts[0]!.oscillators).toHaveLength(0);

    for (const stop of ['voice', 'hidden', 'route'] as const) {
      const h = harness();
      h.owner.armNativeTameGesture();
      const claim = h.owner.claimCommittedTameGreeting(h.outcome, h.state)!;
      await h.owner.playClaimedTameGreeting(claim, counterpart(claim.eventKey));
      expect(h.owner.diagnostics().runtime.voices.active).toBe(1);
      if (stop === 'voice') {
        h.policy.creatureVoicesOn = false;
        h.owner.syncSettings();
      } else if (stop === 'hidden') h.owner.setHidden(true);
      else h.owner.syncRoute('cf1:replacement-world');
      expect(h.owner.diagnostics().runtime.voices.active).toBe(0);
      expect(h.contexts[0]!.oscillators[0]!.stops).toBeGreaterThan(0);
    }
  });
});

describe('Arc 7/8 player-live Feed expression on the shared Tame owner', () => {
  it('claims the exact successor, emits feed-completed after its counterpart, and reuses one runtime/context', async () => {
    const h = harness();
    h.owner.armNativeTameGesture();
    const tameClaim = h.owner.claimCommittedTameGreeting(h.outcome, h.state)!;
    await expect(h.owner.playClaimedTameGreeting(
      tameClaim,
      counterpart(tameClaim.eventKey),
    )).resolves.toMatchObject({ kind: 'started' });
    h.advance(1_000_000);

    expect(h.owner.armNativeFeedGesture()).toBe(true);
    const outcome = feedOutcome(h);
    const claim = h.owner.claimCommittedFeedExpression(outcome, h.state);
    expect(claim).toEqual({
      eventKey: `arc5:feed-completed:${outcome.result!.revision}:4:${h.creatureId}`,
      routeKey: h.worldKey,
    });
    if (!claim) throw new Error('expected Feed expression claim');
    const receipt = Object.freeze({
      counterpartKey: `feed-status:${outcome.result!.revision}:4`,
      eventKey: claim.eventKey,
      generation: 9,
    });
    await expect(h.owner.playClaimedFeedExpression(claim, receipt))
      .resolves.toMatchObject({ kind: 'started' });

    expect(h.contexts).toHaveLength(1);
    expect(h.contexts[0]!.oscillators).toHaveLength(2);
    expect(h.contexts[0]!.oscillators[1]!.starts).toBe(1);
    expect(routesTo(
      h.contexts[0]!.oscillators[1]!,
      h.contexts[0]!.destination,
    )).toBe(true);
    expect(h.owner.diagnostics()).toMatchObject({
      armed: 0,
      claimedEvents: 2,
      lastEventKey: claim.eventKey,
      lastEventKind: 'feed-completed',
      lastDisposition: 'voice-started',
      counterpart: {
        key: receipt.counterpartKey,
        generation: receipt.generation,
        status: 'live',
      },
      runtime: {
        contextGeneration: 1,
        voices: { active: 1, started: 2 },
        creatureEmitters: { active: 1 },
      },
    });
  });

  it.each([
    ['pending/unavailable', (value: FeedExpressionOutcome) => ({
      ...value, kind: 'unavailable' as const, durability: 'none' as const, result: null,
    })],
    ['refusal', (value: FeedExpressionOutcome) => ({
      ...value, kind: 'refused' as const, durability: 'none' as const, result: null,
    })],
    ['convergence', (value: FeedExpressionOutcome) => ({
      ...value, convergence: 'read-only-reload' as const,
    })],
    ['stale ownership', (value: FeedExpressionOutcome) => ({
      ...value,
      result: { ...value.result!, ownershipRevision: value.result!.ownershipRevision + 1 },
    })],
    ['wrong creature successor', (value: FeedExpressionOutcome) => ({
      ...value, result: { ...value.result!, creatureId: 'creature-v1:wrong-successor' },
    })],
    ['wrong fed successor', (value: FeedExpressionOutcome) => ({
      ...value, result: { ...value.result!, fedBefore: 1, fedAfter: 2 },
    })],
  ])('keeps an armed %s terminal silent and tears down its prepared context', async (_label, mutate) => {
    const h = harness();
    expect(h.owner.armNativeFeedGesture()).toBe(true);
    const outcome = mutate(feedOutcome(h)) as FeedExpressionOutcome;
    expect(h.owner.claimCommittedFeedExpression(outcome, h.state)).toBeNull();
    await Promise.resolve();
    expect(h.contexts[0]!.oscillators).toHaveLength(0);
    expect(h.contexts[0]!.closeCalls).toBe(1);
    expect(h.owner.diagnostics().lastEventKind).toBeNull();
  });

  it('rejects replay and a missing accessible counterpart without a second source', async () => {
    const h = harness();
    const outcome = feedOutcome(h);
    h.owner.armNativeFeedGesture();
    const claim = h.owner.claimCommittedFeedExpression(outcome, h.state)!;
    h.loseCounterpart();
    await expect(h.owner.playClaimedFeedExpression(claim, Object.freeze({
      counterpartKey: 'feed-status:stale',
      eventKey: claim.eventKey,
      generation: 3,
    }))).resolves.toMatchObject({ kind: 'silent' });
    expect(h.contexts[0]!.oscillators).toHaveLength(0);

    const replay = harness();
    const replayOutcome = feedOutcome(replay);
    replay.owner.armNativeFeedGesture();
    const first = replay.owner.claimCommittedFeedExpression(replayOutcome, replay.state)!;
    await replay.owner.playClaimedFeedExpression(first, Object.freeze({
      counterpartKey: 'feed-status:first', eventKey: first.eventKey, generation: 4,
    }));
    replay.advance(1_000_000);
    replay.owner.armNativeFeedGesture();
    expect(replay.owner.claimCommittedFeedExpression(replayOutcome, replay.state)).toBeNull();
    await Promise.resolve();
    expect(replay.contexts).toHaveLength(1);
    expect(replay.contexts[0]!.oscillators).toHaveLength(1);
    expect(replay.owner.diagnostics().lastDisposition).toBe('event-already-claimed');
  });

  it('retains only the latest Feed ownership while rejecting current and older replays', async () => {
    const h = harness();
    let state = h.state;
    let firstState: OwnershipStateV2 | null = null;
    let firstOutcome: FeedExpressionOutcome | null = null;
    let latestOutcome: FeedExpressionOutcome | null = null;
    for (let fedAfter = 1; fedAfter <= 12; fedAfter++) {
      if (fedAfter > 1) state = feedSuccessor(state, h.creatureId, fedAfter);
      const outcome = feedOutcome({ creatureId: h.creatureId, state }, {
        fedBefore: fedAfter - 1,
        fedAfter,
        receiptOrdinal: 3 + fedAfter,
        revision: 50 + fedAfter,
        ownershipRevision: state.revision,
      });
      if (firstState === null) {
        firstState = state;
        firstOutcome = outcome;
      }
      latestOutcome = outcome;
      expect(h.owner.armNativeFeedGesture()).toBe(true);
      const claim = h.owner.claimCommittedFeedExpression(outcome, state);
      expect(claim).not.toBeNull();
      await expect(h.owner.playClaimedFeedExpression(claim!, Object.freeze({
        counterpartKey: `feed-status:${fedAfter}`,
        eventKey: claim!.eventKey,
        generation: fedAfter,
      }))).resolves.toMatchObject({ kind: 'started' });
      expect(h.owner.diagnostics().claimedEvents).toBe(1);
      h.advance(1_000_000);
    }
    if (firstState === null || firstOutcome === null || latestOutcome === null) {
      throw new Error('expected Feed ownership sequence');
    }

    h.owner.armNativeFeedGesture();
    expect(h.owner.claimCommittedFeedExpression(latestOutcome, state)).toBeNull();
    expect(h.owner.diagnostics()).toMatchObject({
      claimedEvents: 1,
      lastDisposition: 'event-already-claimed',
    });

    h.owner.armNativeFeedGesture();
    expect(h.owner.claimCommittedFeedExpression(firstOutcome, firstState)).toBeNull();
    expect(h.owner.diagnostics()).toMatchObject({
      claimedEvents: 1,
      lastDisposition: 'feed-ownership-not-advanced',
    });
  });

  it('cancels a claimed Feed attempt when its settled counterpart cannot bind', async () => {
    const h = harness();
    h.owner.armNativeFeedGesture();
    const claim = h.owner.claimCommittedFeedExpression(feedOutcome(h), h.state)!;
    h.owner.cancelFeedAttempt('counterpart-unavailable');
    await Promise.resolve();
    await expect(h.owner.playClaimedFeedExpression(claim, Object.freeze({
      counterpartKey: 'feed-status:late', eventKey: claim.eventKey, generation: 6,
    }))).resolves.toEqual({ kind: 'silent', reason: 'claim-invalid' });
    expect(h.contexts[0]!.oscillators).toHaveLength(0);
    expect(h.contexts[0]!.closeCalls).toBe(1);
    expect(h.owner.diagnostics()).toMatchObject({
      lastDisposition: 'feed-cancelled:counterpart-unavailable',
      counterpart: { status: 'rejected' },
      runtime: { voices: { started: 0 } },
    });
  });

  it.each(['mute', 'hidden', 'route'] as const)(
    'invalidates a claimed Feed event when %s changes before playback',
    async (change) => {
      const h = harness();
      h.owner.armNativeFeedGesture();
      const claim = h.owner.claimCommittedFeedExpression(feedOutcome(h), h.state)!;
      if (change === 'mute') {
        h.policy.soundOn = false;
        h.owner.syncSettings();
      } else if (change === 'hidden') {
        h.owner.setHidden(true);
      } else {
        h.policy.routeKey = 'cf-route:replacement';
        h.owner.syncRoute(h.policy.routeKey);
      }
      await expect(h.owner.playClaimedFeedExpression(claim, Object.freeze({
        counterpartKey: 'feed-status:late', eventKey: claim.eventKey, generation: 7,
      }))).resolves.toEqual({ kind: 'silent', reason: 'claim-invalid' });
      expect(h.contexts[0]!.oscillators).toHaveLength(0);
    },
  );

  it.each([
    ['Sound off', { soundOn: false }],
    ['Creature voices off', { creatureVoicesOn: false }],
    ['hidden', { visible: false }],
    ['unanswerable', { answerable: false }],
    ['no route', { routeKey: null }],
  ] as const)('creates no context for Feed when %s is already known', (_label, patch) => {
    const h = harness(patch);
    expect(h.owner.armNativeFeedGesture()).toBe(false);
    expect(h.contexts).toHaveLength(0);
    expect(h.owner.claimCommittedFeedExpression(feedOutcome(h), h.state)).toBeNull();
  });

  it('stays silent across route loss and stops a started Feed voice on later route loss', async () => {
    const before = harness();
    before.owner.armNativeFeedGesture();
    before.policy.routeKey = 'cf-route:replacement';
    expect(before.owner.claimCommittedFeedExpression(feedOutcome(before), before.state)).toBeNull();
    await Promise.resolve();
    expect(before.contexts[0]!.oscillators).toHaveLength(0);

    const after = harness();
    after.owner.armNativeFeedGesture();
    const claim = after.owner.claimCommittedFeedExpression(feedOutcome(after), after.state)!;
    await after.owner.playClaimedFeedExpression(claim, Object.freeze({
      counterpartKey: 'feed-status:live', eventKey: claim.eventKey, generation: 5,
    }));
    expect(after.owner.diagnostics().runtime.voices.active).toBe(1);
    after.owner.syncRoute('cf-route:replacement');
    expect(after.owner.diagnostics().runtime.voices.active).toBe(0);
    expect(after.contexts[0]!.oscillators[0]!.stops).toBeGreaterThan(0);
  });
});
