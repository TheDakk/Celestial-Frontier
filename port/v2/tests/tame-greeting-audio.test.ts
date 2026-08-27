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
} from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome } from '@cf/domain-genome';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  createTameGreetingAudioOwner,
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
  connect(_destination: AudioNodeLike): AudioNodeLike { this.connects++; return this; }
  disconnect(): void { this.disconnects++; }
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
    fed: null,
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
  const state = migrateOwnershipStateV1ToV2(source);
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
  return { state, outcome, discovery, worldKey: resolved.address.key };
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
  let liveCounterpart = true;
  const owner = createTameGreetingAudioOwner({
    createContext: () => {
      const context = new FakeContext();
      contexts.push(context);
      return context;
    },
    nowMs: () => 100,
    readPolicy: () => policy,
    verifyCounterpart: () => liveCounterpart,
  });
  return {
    ...data,
    owner,
    policy,
    contexts,
    loseCounterpart: () => { liveCounterpart = false; owner.counterpartLost(); },
  };
}

function counterpart(eventKey: string) {
  return Object.freeze({ counterpartKey: 'capture-toast:7', eventKey, generation: 7 });
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
