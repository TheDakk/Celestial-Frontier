import { beforeAll, describe, expect, it, vi } from 'vitest';
import type {
  AudioAnalyserNodeLike,
  AudioContextLike,
  AudioGainNodeLike,
  AudioLimiterNodeLike,
  AudioNodeLike,
  AudioParamLike,
  AudioScheduledSourceLike,
  CombatCuePlanV1,
  CombatCueV1,
} from '@cf/audio';
import {
  combatCuePlan,
  projectCombatCueParticipantsV1,
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
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
  type SpeciesId,
} from '@cf/domain-acquisition';
import {
  createCreatureInstanceV2,
  createOwnershipSuccessorV2,
  ownershipSourceStateV1,
} from '../packages/domain/acquisition/src/model-v2.js';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import {
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
  type CombatSettlementChampionV1,
  type CombatSettlementOutcomeV1,
  type CombatSettlementPlanV1,
} from '@cf/domain-combatcore';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  createTameGreetingAudioOwner,
  type FeedExpressionOutcome,
  type TameGreetingAudioPolicy,
  type TameGreetingCaptureOutcome,
} from '../apps/game/src/tame-greeting-audio.js';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';
import {
  createCurrentWorldApproachDistantEcologyPlaybackV1,
  createCurrentWorldDistantEcologyPlaybackV1,
} from '../apps/game/src/biome-ecology-audio.js';
import type { Arc6CombatActionOutcomeV1 } from '../apps/game/src/arc6-combat-action.js';

vi.mock('@cf/domain-sessionrng', () => {
  throw new Error('tame greeting audio imported gameplay SessionRNG');
});

beforeAll(() => installCaptureHooks());

class FakeParam implements AudioParamLike {
  value = 0;
  setValueAtTime(value: number): void { this.value = value; }
  linearRampToValueAtTime(value: number): void { this.value = value; }
  exponentialRampToValueAtTime(value: number): void { this.value = value; }
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

class FakeBuffer {
  readonly channel: Float32Array;
  constructor(length: number) { this.channel = new Float32Array(length); }
  getChannelData(channel: number): Float32Array {
    if (channel !== 0) throw new RangeError('only mono combat buffers are supported');
    return this.channel;
  }
}

class FakeBufferSource extends FakeNode implements AudioScheduledSourceLike {
  onended: (() => void) | null = null;
  buffer: FakeBuffer | null = null;
  starts = 0;
  stops = 0;
  start(): void { this.starts++; }
  stop(): void { this.stops++; }
}

class FakeBiquad extends FakeNode {
  type: 'bandpass' = 'bandpass';
  readonly frequency = new FakeParam();
  readonly Q = new FakeParam();
}

class FakeContext implements AudioContextLike {
  readonly currentTime = 0;
  readonly sampleRate = 48_000;
  readonly destination = new FakeNode();
  state = 'running';
  closeCalls = 0;
  readonly oscillators: FakeOscillator[] = [];
  readonly bufferSources: FakeBufferSource[] = [];
  readonly buffers: FakeBuffer[] = [];
  readonly filters: FakeBiquad[] = [];
  createGain(): FakeGain { return new FakeGain(); }
  createAnalyser(): FakeAnalyser { return new FakeAnalyser(); }
  createDynamicsCompressor(): FakeLimiter { return new FakeLimiter(); }
  createOscillator(): FakeOscillator {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }
  createBuffer(channels: number, length: number, sampleRate: number): FakeBuffer {
    if (channels !== 1 || sampleRate !== this.sampleRate) {
      throw new TypeError('invalid combat buffer request');
    }
    const buffer = new FakeBuffer(length);
    this.buffers.push(buffer);
    return buffer;
  }
  createBufferSource(): FakeBufferSource {
    const source = new FakeBufferSource();
    this.bufferSources.push(source);
    return source;
  }
  createBiquadFilter(): FakeBiquad {
    const filter = new FakeBiquad();
    this.filters.push(filter);
    return filter;
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
  return {
    state, outcome, discovery, creatureId,
    worldKey: resolved.address.key,
    address: resolved.address,
  };
}

type MutablePolicy = { -readonly [Key in keyof TameGreetingAudioPolicy]: TameGreetingAudioPolicy[Key] };

function harness(policyPatch: Partial<TameGreetingAudioPolicy> = {}, browserDeadline = false) {
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
  const deadlines = new Set<{ callback: () => void; at: number }>();
  const owner = createTameGreetingAudioOwner({
    createContext: () => {
      const context = new FakeContext();
      contexts.push(context);
      return context;
    },
    nowMs: () => nowMs,
    ...(browserDeadline ? {} : {
      scheduleVoiceDeadline: (callback: () => void, delayMs: number) => {
        const deadline = { callback, at: nowMs + delayMs };
        deadlines.add(deadline);
        return () => { deadlines.delete(deadline); };
      },
    }),
    readPolicy: () => policy,
    verifyCounterpart: () => liveCounterpart,
  });
  return {
    ...data,
    owner,
    policy,
    contexts,
    pendingDeadlines: () => deadlines.size,
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

interface CombatSessionFixture {
  readonly settlement: CombatSettlementPlanV1;
  readonly cuePlan: CombatCuePlanV1;
  readonly damageCues: readonly CombatCueV1[];
  readonly outcome: Extract<Arc6CombatActionOutcomeV1, { readonly kind: 'committed' }>;
  readonly routeKey: string;
}

const COMBAT_WORLD = Object.freeze({
  galaxy: Object.freeze({ seed: 1594395733, x: -5501.81, y: -11753.64 }),
  star: Object.freeze({ seed: 4077594722, x: -271.54, y: -67.36 }),
  planet: Object.freeze({ seed: 488332735 }),
});
let COMBAT_PLAN: Readonly<{
  settlement: CombatSettlementPlanV1;
  cuePlan: CombatCuePlanV1;
  damageCues: readonly CombatCueV1[];
}> | null = null;

function registeredCombatPlan(): NonNullable<typeof COMBAT_PLAN> {
  if (COMBAT_PLAN !== null) return COMBAT_PLAN;
  const resolved = resolveCF1WorldAddress(COMBAT_WORLD);
  if (!resolved.ok) throw new Error(`combat audio world failed: ${resolved.reason}`);
  const defenderGenome = makeGenome(999, 'fauna', 0.5);
  const encounter = projectGuardianPrimeEncounterV1({
    world: resolved.address,
    descriptor: { worldType: 'airless' },
    regionIndex: 0,
    faunaRoster: [{ speciesId: 'combat-audio-defender', genome: defenderGenome }],
    claimedSignatureIds: [],
    conquered: false,
  });
  if (encounter === null) throw new Error('combat audio encounter failed');
  for (let seed = 1; seed <= 768; seed++) {
    const genome = makeGenome(seed, 'fauna', 0.5);
    const champion: CombatSettlementChampionV1 = Object.freeze({
      kind: 'owned-fauna',
      creatureId: `combat-audio-champion-${seed}`,
      name: `Combat Audio Champion ${seed}`,
      genome,
      legacyBredLineage: true,
    });
    const transcript = runDuel(
      { name: champion.name, genome },
      { name: encounter.defender.name, genome: encounter.defender.battleGenome as Genome },
    );
    const winner = transcript.winner;
    const settledOutcome: CombatSettlementOutcomeV1 = winner === 'A' ? 'champion-win'
      : winner === 'B' ? 'defender-win' : 'draw';
    const planned = planCombatSettlementV1({
      battleId: `combat-audio-battle-${seed}`,
      receiptOrdinal: 17,
      encounter,
      champion,
      transcript,
      outcome: settledOutcome,
      worldTier: 4,
      authority: {
        worldConquered: false,
        claimedPrimeSignatureIds: [],
        lossXp: { kind: 'known-target', awardedTarget: 0 },
      },
    });
    if (planned.status !== 'planned') continue;
    const cuePlan = combatCuePlan(planned, projectCombatCueParticipantsV1(planned));
    const damageCues = cuePlan.cues.filter((cue) => cue.impact !== null);
    if (damageCues.length < 3
      || !damageCues.some((cue) => cue.impact?.critical || cue.impact?.abilityProc)) continue;
    COMBAT_PLAN = Object.freeze({
      settlement: planned,
      cuePlan,
      damageCues: Object.freeze(damageCues),
    });
    return COMBAT_PLAN;
  }
  throw new Error('bounded combat audio fixture has fewer than three damage cues');
}

function combatSessionFixture(revision = 61): CombatSessionFixture {
  const registered = registeredCombatPlan();
  const canonicalState = Object.freeze({ combatAudioState: revision });
  const persisted = Object.freeze({
    revision,
    receipt: registered.settlement.receipt,
    saved: Object.freeze({ canonicalState }),
  });
  const transaction = Object.freeze({
    kind: 'committed',
    durability: 'committed',
    convergence: 'verification-required',
    revision,
    plan: registered.settlement,
    transaction: persisted,
  });
  const verification = Object.freeze({
    kind: 'verified',
    convergence: 'none',
    revision,
    plan: registered.settlement,
    state: canonicalState,
    ownershipV2: null,
    guardianAcquisitions: null,
    brinkAchievement: null,
    starterConquestCharter: null,
  });
  const outcome = Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none',
    transaction, verification,
  }) as unknown as Extract<Arc6CombatActionOutcomeV1, { readonly kind: 'committed' }>;
  return Object.freeze({
    ...registered,
    outcome,
    routeKey: registered.settlement.encounter.identity.world.key,
  });
}

function combatCounterpart(cue: CombatCueV1, generation = 11) {
  const damage = cue.counterparts.find((row) => row.family === 'damage');
  if (damage === undefined) throw new Error('combat damage counterpart missing');
  return Object.freeze({
    counterpartKey: damage.captionToken,
    eventKey: cue.cueId,
    generation,
  });
}

describe('Arc 7/8 player-live Tame greeting owner', () => {
  it('releases an idle finite voice through the default browser deadline when onended is lost', async () => {
    vi.useFakeTimers();
    const h = harness({}, true);
    try {
      expect(h.owner.armNativeTameGesture()).toBe(true);
      const claim = h.owner.claimCommittedTameGreeting(h.outcome, h.state)!;
      await expect(h.owner.playClaimedTameGreeting(claim, counterpart(claim.eventKey)))
        .resolves.toMatchObject({ kind: 'started' });
      const oscillator = h.contexts[0]!.oscillators[0]!;
      expect(oscillator.starts).toBe(1);
      expect(oscillator.stops).toBe(1); // authored stop was scheduled, but no onended arrives
      expect(vi.getTimerCount()).toBe(1);
      // No next play request, diagnostic poll, route change, or visibility event
      // drives expiry. Only the browser timer and injected monotonic clock do.
      h.advance(10_000);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(oscillator.stops).toBe(2);
      // This suite's node fake retains connection history after disconnect.
      expect(oscillator.disconnects).toBe(1);
      expect(h.owner.diagnostics().runtime).toMatchObject({
        voices: { active: 0 }, creatureEmitters: { active: 0 },
        nodes: { active: 13 }, voiceMix: { activeOwners: 0 },
      });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      await h.owner.dispose();
      vi.useRealTimers();
    }
  });

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
      expect(h.pendingDeadlines()).toBe(0);
    }
  });
});

describe('Arc 7 explicit noncombat audition and ecology playback', () => {
  function auditionRequest(h: ReturnType<typeof harness>) {
    const creature = h.state.creatures.find((row) => row.creatureId === h.creatureId)!;
    return Object.freeze({
      surface: Object.freeze({
        generation: 7,
        logicalId: 'codex-fauna',
        speciesId: creature.speciesId,
        surfaceKey: JSON.stringify([7, 'codex-fauna', creature.speciesId]),
      }),
      contextKey: 'audition-context',
      ownershipRevision: h.state.revision,
      ownershipDigest: ownershipStateDigestV2(h.state),
      creatureId: h.creatureId,
      label: 'Exact companion',
      eventKey: `arc7:compendium-audition:${h.creatureId}`,
    });
  }

  it('auditions one exact current fauna call only after a fresh explicit gesture', async () => {
    const h = harness();
    const before = JSON.stringify(h.state);
    const request = auditionRequest(h);
    expect(h.owner.claimCompendiumAudition(request, h.state)).toBeNull();
    expect(h.contexts).toHaveLength(0);

    expect(h.owner.armNativeCompendiumAuditionGesture()).toBe(true);
    const claim = h.owner.claimCompendiumAudition(request, h.state);
    expect(claim).toEqual({ eventKey: request.eventKey, routeKey: h.worldKey });
    if (!claim) throw new Error('expected Compendium audition claim');
    const receipt = Object.freeze({
      counterpartKey: `compendium-audition:7:${h.creatureId}`,
      eventKey: claim.eventKey,
      generation: 7,
    });
    await expect(h.owner.playClaimedCompendiumAudition(claim, receipt))
      .resolves.toMatchObject({ kind: 'started' });
    expect(h.contexts[0]!.oscillators).toHaveLength(1);
    const firstFrequency = h.contexts[0]!.oscillators[0]!.frequency.value;

    h.advance(10_000);
    expect(h.owner.armNativeCompendiumAuditionGesture()).toBe(true);
    const replay = h.owner.claimCompendiumAudition(request, h.state)!;
    await expect(h.owner.playClaimedCompendiumAudition(replay, receipt))
      .resolves.toMatchObject({ kind: 'started' });
    expect(h.contexts[0]!.oscillators).toHaveLength(2);
    expect(h.contexts[0]!.oscillators[1]!.frequency.value).toBe(firstFrequency);
    expect(h.owner.diagnostics()).toMatchObject({
      claimedEvents: 2,
      lastEventKind: 'selected',
      counterpart: { status: 'live' },
    });
    expect(JSON.stringify(h.state)).toBe(before);
  });

  it('rejects either ownership side of a forged Compendium audition', async () => {
    const stale = harness();
    stale.owner.armNativeCompendiumAuditionGesture();
    expect(stale.owner.claimCompendiumAudition(Object.freeze({
      ...auditionRequest(stale),
      ownershipDigest: 'stale-digest',
    }), stale.state)).toBeNull();
    await Promise.resolve();
    expect(stale.contexts[0]!.oscillators).toHaveLength(0);

    const wrongSpecies = harness();
    const wrongRequest = auditionRequest(wrongSpecies);
    wrongSpecies.owner.armNativeCompendiumAuditionGesture();
    expect(wrongSpecies.owner.claimCompendiumAudition(Object.freeze({
      ...wrongRequest,
      surface: Object.freeze({
        ...wrongRequest.surface,
        speciesId: 'species-v1:wrong' as SpeciesId,
      }),
    }), wrongSpecies.state)).toBeNull();
    await Promise.resolve();
    expect(wrongSpecies.contexts[0]!.oscillators).toHaveLength(0);
  });

  it('plays only generic current-world ecology from the canonical visible receipt', async () => {
    const h = harness({ creatureVoicesOn: false });
    const rosterResult = canonicalWorldRoster(h.address, 0);
    expect(rosterResult.ok).toBe(true);
    if (!rosterResult.ok) return;
    const playback = createCurrentWorldDistantEcologyPlaybackV1(
      rosterResult.roster,
      Object.freeze({
        generation: 9,
        worldKey: rosterResult.roster.worldKey,
        environmentFingerprint: rosterResult.roster.environmentFingerprint,
        biosphereKey: rosterResult.roster.biosphereKey,
        granularity: 'biosphere',
        visible: true,
      }),
    );
    expect(playback.plan).toMatchObject({
      granularity: 'biosphere', kingdom: null, familyKey: null,
      identityKey: null, route: 'ambience',
    });
    expect(h.owner.armNativeCompendiumAuditionGesture()).toBe(false);
    expect(h.owner.armNativeDistantEcologyGesture()).toBe(true);
    const claim = h.owner.claimCurrentWorldDistantEcology(playback);
    expect(claim).toEqual({
      eventKey: playback.plan.planId,
      worldKey: h.worldKey,
      routeKey: h.worldKey,
    });
    if (!claim) throw new Error('expected distant ecology claim');
    await expect(h.owner.playClaimedDistantEcology(claim, playback.counterpart))
      .resolves.toMatchObject({ kind: 'started' });
    expect(h.contexts[0]!.oscillators).toHaveLength(1);
    expect(h.owner.diagnostics()).toMatchObject({
      lastEventKind: 'distant-ecology',
      runtime: { voices: { active: 1 }, creatureEmitters: { active: 0 } },
    });

    h.owner.syncSettings();
    expect(h.owner.diagnostics().runtime.voices.active).toBe(1);
    h.policy.soundOn = false;
    h.owner.syncSettings();
    expect(h.owner.diagnostics().runtime.voices.active).toBe(0);
  });

  it('keeps orbital approach owned by its system route while targeting the exact planet', async () => {
    const systemRoute = 'cf-route:system:galaxy-home:star-sol';
    const h = harness({ routeKey: systemRoute, creatureVoicesOn: false });
    const rosterResult = canonicalWorldRoster(h.address, 0);
    expect(rosterResult.ok).toBe(true);
    if (!rosterResult.ok) return;
    const playback = createCurrentWorldApproachDistantEcologyPlaybackV1(
      rosterResult.roster,
      Object.freeze({
        generation: 14,
        worldKey: rosterResult.roster.worldKey,
        environmentFingerprint: rosterResult.roster.environmentFingerprint,
        biosphereKey: rosterResult.roster.biosphereKey,
        granularity: 'biosphere',
        surface: 'approach',
        visible: true,
      }),
    );
    expect(h.owner.armNativeDistantEcologyGesture()).toBe(true);
    const claim = h.owner.claimCurrentWorldDistantEcology(playback);
    expect(claim).toEqual({
      eventKey: playback.eventKey,
      worldKey: h.worldKey,
      routeKey: systemRoute,
    });
    if (!claim) throw new Error('expected orbital approach ecology claim');
    await expect(h.owner.playClaimedDistantEcology(claim, playback.counterpart))
      .resolves.toMatchObject({ kind: 'started' });
    expect(h.contexts[0]!.oscillators).toHaveLength(1);
    h.policy.routeKey = 'cf-route:system:replacement';
    h.owner.syncRoute(h.policy.routeKey);
    expect(h.owner.diagnostics().runtime.voices.active).toBe(0);
  });

  it('rejects orbital approach when its system route changes before playback starts', async () => {
    const systemRoute = 'cf-route:system:galaxy-home:star-sol';
    const h = harness({ routeKey: systemRoute, creatureVoicesOn: false });
    const rosterResult = canonicalWorldRoster(h.address, 0);
    expect(rosterResult.ok).toBe(true);
    if (!rosterResult.ok) return;
    const playback = createCurrentWorldApproachDistantEcologyPlaybackV1(
      rosterResult.roster,
      Object.freeze({
        generation: 15,
        worldKey: rosterResult.roster.worldKey,
        environmentFingerprint: rosterResult.roster.environmentFingerprint,
        biosphereKey: rosterResult.roster.biosphereKey,
        granularity: 'biosphere',
        surface: 'approach',
        visible: true,
      }),
    );
    h.owner.armNativeDistantEcologyGesture();
    const claim = h.owner.claimCurrentWorldDistantEcology(playback);
    expect(claim?.routeKey).toBe(systemRoute);
    if (!claim) return;
    h.policy.routeKey = 'cf-route:system:replacement';
    await expect(h.owner.playClaimedDistantEcology(claim, playback.counterpart))
      .resolves.toEqual({ kind: 'silent', reason: 'policy-changed' });
    expect(h.contexts[0]!.oscillators).toHaveLength(0);
  });

  it('rejects an unregistered ecology clone and route loss before graph creation', async () => {
    const h = harness();
    const rosterResult = canonicalWorldRoster(h.address, 0);
    expect(rosterResult.ok).toBe(true);
    if (!rosterResult.ok) return;
    const playback = createCurrentWorldDistantEcologyPlaybackV1(
      rosterResult.roster,
      Object.freeze({
        generation: 3,
        worldKey: rosterResult.roster.worldKey,
        environmentFingerprint: rosterResult.roster.environmentFingerprint,
        biosphereKey: rosterResult.roster.biosphereKey,
        granularity: 'biosphere',
        visible: true,
      }),
    );
    h.owner.armNativeDistantEcologyGesture();
    expect(h.owner.claimCurrentWorldDistantEcology({ ...playback } as never)).toBeNull();
    await Promise.resolve();
    expect(h.contexts[0]!.oscillators).toHaveLength(0);

    const changed = harness();
    changed.owner.armNativeDistantEcologyGesture();
    changed.policy.routeKey = 'cf-route:replacement';
    expect(changed.owner.claimCurrentWorldDistantEcology(playback)).toBeNull();
    await Promise.resolve();
    expect(changed.contexts[0]!.oscillators).toHaveLength(0);
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

describe('Arc 8 committed conquest-combat playback on the shared audio owner', () => {
  async function startedCombat() {
    const combat = combatSessionFixture();
    const h = harness({ routeKey: combat.routeKey });
    expect(h.owner.armNativeCombatGesture()).toBe(true);
    const claim = h.owner.claimCommittedCombatSession(combat.outcome, combat.cuePlan);
    if (claim === null) throw new Error('expected committed combat session claim');
    const cue = combat.damageCues[0]!;
    const receipt = combatCounterpart(cue);
    await expect(h.owner.playClaimedCombatCue(claim, cue, receipt))
      .resolves.toMatchObject({ kind: 'started' });
    return { combat, h, claim, cue, receipt };
  }

  it('claims one exact durable/current session and renders combat on master Sound, not Creature Voices', async () => {
    const combat = combatSessionFixture();
    const h = harness({ routeKey: combat.routeKey, creatureVoicesOn: false });
    expect(h.owner.armNativeTameGesture()).toBe(false);
    expect(h.owner.armNativeCombatGesture()).toBe(true);
    expect(h.contexts).toHaveLength(1);
    const claim = h.owner.claimCommittedCombatSession(combat.outcome, combat.cuePlan);
    expect(claim).toEqual({
      eventKey: combat.cuePlan.planId,
      routeKey: combat.routeKey,
      battleId: combat.settlement.battleId,
      revision: 61,
    });
    if (claim === null) throw new Error('expected exact combat claim');
    const cue = combat.damageCues.find((candidate) =>
      candidate.impact?.critical || candidate.impact?.abilityProc)!;
    const receipt = combatCounterpart(cue);
    await expect(h.owner.playClaimedCombatCue(claim, cue, receipt))
      .resolves.toMatchObject({ kind: 'started' });
    const expectedOscillators = 1 + (cue.impact!.critical ? 1 : 0)
      + (cue.impact!.abilityProc ? 1 : 0);
    expect(h.contexts[0]!.oscillators).toHaveLength(expectedOscillators);
    expect(h.contexts[0]!.bufferSources).toHaveLength(1);
    expect(h.contexts[0]!.oscillators.every((source) =>
      routesTo(source, h.contexts[0]!.destination))).toBe(true);
    expect(h.owner.diagnostics()).toMatchObject({
      activeVoiceId: null,
      activeCombatVoiceIds: ['voice-000001'],
      lastEventKey: cue.cueId,
      lastEventKind: 'combat-cue',
      lastDisposition: 'combat-voice-started',
      counterpart: {
        key: receipt.counterpartKey,
        generation: receipt.generation,
        status: 'live',
      },
      runtime: {
        gains: { categories: { creature: 0, 'combat-gameplay': 1 } },
        voices: { active: 1, started: 1 },
        creatureEmitters: { active: 0 },
      },
    });
  });

  it('rejects unarmed, non-durable, stale, route-drifted, and unregistered session evidence', async () => {
    const combat = combatSessionFixture();
    const unarmed = harness({ routeKey: combat.routeKey });
    expect(unarmed.owner.claimCommittedCombatSession(combat.outcome, combat.cuePlan)).toBeNull();
    expect(unarmed.contexts).toHaveLength(0);

    const convergence = harness({ routeKey: combat.routeKey });
    convergence.owner.armNativeCombatGesture();
    expect(convergence.owner.claimCommittedCombatSession(Object.freeze({
      ...combat.outcome,
      kind: 'committed-convergence',
      convergence: 'read-only-reload',
      detail: 'mutation-control',
    }) as never, combat.cuePlan)).toBeNull();

    const stale = harness({ routeKey: combat.routeKey });
    stale.owner.armNativeCombatGesture();
    expect(stale.owner.claimCommittedCombatSession(Object.freeze({
      ...combat.outcome,
      transaction: Object.freeze({
        ...combat.outcome.transaction,
        revision: combat.outcome.transaction.revision + 1,
      }),
    }) as never, combat.cuePlan)).toBeNull();

    const unregistered = harness({ routeKey: combat.routeKey });
    unregistered.owner.armNativeCombatGesture();
    expect(unregistered.owner.claimCommittedCombatSession(
      combat.outcome,
      { ...combat.cuePlan } as never,
    )).toBeNull();

    const route = harness();
    route.owner.armNativeCombatGesture();
    expect(route.owner.claimCommittedCombatSession(combat.outcome, combat.cuePlan)).toBeNull();

    const replay = harness({ routeKey: combat.routeKey });
    replay.owner.armNativeCombatGesture();
    expect(replay.owner.claimCommittedCombatSession(combat.outcome, combat.cuePlan)).not.toBeNull();
    replay.owner.cancelCombatPlayback('close');
    replay.owner.armNativeCombatGesture();
    expect(replay.owner.claimCommittedCombatSession(combat.outcome, combat.cuePlan)).toBeNull();
    expect(replay.owner.diagnostics().lastDisposition).toBe('combat-session-not-current');
    await Promise.resolve();
    for (const candidate of [convergence, stale, unregistered, route, replay]) {
      expect(candidate.owner.diagnostics().runtime.voices.started).toBe(0);
    }
  });

  it('admits only canonical ordered cue members with their exact primary caption counterpart', async () => {
    const combat = combatSessionFixture();
    const cloned = harness({ routeKey: combat.routeKey });
    cloned.owner.armNativeCombatGesture();
    const clonedClaim = cloned.owner.claimCommittedCombatSession(combat.outcome, combat.cuePlan)!;
    const first = combat.damageCues[0]!;
    await expect(cloned.owner.playClaimedCombatCue(
      clonedClaim,
      { ...first } as never,
      combatCounterpart(first),
    )).resolves.toEqual({ kind: 'silent', reason: 'combat-cue-or-counterpart-invalid' });
    expect(cloned.contexts[0]!.oscillators).toHaveLength(0);

    const nonImpact = harness({ routeKey: combat.routeKey });
    nonImpact.owner.armNativeCombatGesture();
    const nonImpactClaim = nonImpact.owner.claimCommittedCombatSession(
      combat.outcome,
      combat.cuePlan,
    )!;
    const nonImpactCue = combat.cuePlan.cues.find((cue) => cue.impact === null)!;
    const nonImpactCounterpart = nonImpactCue.counterparts[0]!;
    await expect(nonImpact.owner.playClaimedCombatCue(
      nonImpactClaim,
      nonImpactCue,
      Object.freeze({
        counterpartKey: nonImpactCounterpart.captionToken,
        eventKey: nonImpactCue.cueId,
        generation: 11,
      }),
    )).resolves.toMatchObject({ kind: 'started' });
    expect(nonImpact.contexts[0]!.oscillators.length
      + nonImpact.contexts[0]!.bufferSources.length).toBeGreaterThan(0);

    const drift = await startedCombat();
    const second = drift.combat.damageCues[1]!;
    await expect(drift.h.owner.playClaimedCombatCue(
      drift.claim,
      second,
      Object.freeze({
        ...combatCounterpart(second),
        counterpartKey: 'combat-caption:foreign',
      }),
    )).resolves.toEqual({ kind: 'silent', reason: 'combat-cue-or-counterpart-invalid' });
    expect(drift.h.owner.diagnostics()).toMatchObject({
      activeCombatVoiceIds: [],
      runtime: { voices: { active: 0, stopped: 1 } },
    });
  });

  it('retains at most the request-owned two concurrent combat voices and stops both on Skip', async () => {
    const combat = combatSessionFixture();
    const h = harness({ routeKey: combat.routeKey });
    h.owner.armNativeCombatGesture();
    const claim = h.owner.claimCommittedCombatSession(combat.outcome, combat.cuePlan)!;
    await expect(h.owner.playClaimedCombatCue(
      claim, combat.damageCues[0]!, combatCounterpart(combat.damageCues[0]!),
    )).resolves.toMatchObject({ kind: 'started' });
    await expect(h.owner.playClaimedCombatCue(
      claim, combat.damageCues[1]!, combatCounterpart(combat.damageCues[1]!),
    )).resolves.toMatchObject({ kind: 'started' });
    await expect(h.owner.playClaimedCombatCue(
      claim, combat.damageCues[2]!, combatCounterpart(combat.damageCues[2]!),
    )).resolves.toEqual({ kind: 'silent', reason: 'runtime-rejected:concurrency' });
    expect(h.owner.diagnostics()).toMatchObject({
      activeCombatVoiceIds: ['voice-000001', 'voice-000002'],
      runtime: {
        voices: { active: 2, started: 2, concurrencyRejects: 1 },
        creatureEmitters: { active: 0 },
      },
    });
    h.owner.cancelCombatPlayback('skip');
    expect(h.owner.diagnostics()).toMatchObject({
      activeCombatVoiceIds: [],
      runtime: { voices: { active: 0, stopped: 2 } },
    });
    expect(h.contexts[0]!.oscillators.every((source) => source.stops > 0)).toBe(true);
    expect(h.contexts[0]!.bufferSources.every((source) => source.stops > 0)).toBe(true);
  });

  it.each([
    ['close', (value: Awaited<ReturnType<typeof startedCombat>>) =>
      value.h.owner.cancelCombatPlayback('close')],
    ['hidden', (value: Awaited<ReturnType<typeof startedCombat>>) =>
      value.h.owner.setHidden(true)],
    ['route loss', (value: Awaited<ReturnType<typeof startedCombat>>) =>
      value.h.owner.syncRoute('cf-route:replacement')],
    ['counterpart loss', (value: Awaited<ReturnType<typeof startedCombat>>) =>
      value.h.owner.counterpartLost()],
    ['answerability loss', (value: Awaited<ReturnType<typeof startedCombat>>) =>
      value.h.owner.setAnswerable(false)],
    ['Sound Off', (value: Awaited<ReturnType<typeof startedCombat>>) => {
      value.h.policy.soundOn = false;
      value.h.owner.syncSettings();
    }],
    ['replacement', (value: Awaited<ReturnType<typeof startedCombat>>) => {
      expect(value.h.owner.armNativeCombatGesture()).toBe(true);
    }],
    ['context loss', (value: Awaited<ReturnType<typeof startedCombat>>) => {
      value.h.contexts[0]!.state = 'closed';
      value.h.owner.diagnostics();
    }],
  ] as const)('stops every live combat voice on %s', async (_label, stop) => {
    const value = await startedCombat();
    stop(value);
    await Promise.resolve();
    expect(value.h.owner.diagnostics()).toMatchObject({
      activeCombatVoiceIds: [],
      runtime: { voices: { active: 0 } },
    });
    await expect(value.h.owner.playClaimedCombatCue(
      value.claim,
      value.combat.damageCues[1]!,
      combatCounterpart(value.combat.damageCues[1]!),
    )).resolves.toEqual({ kind: 'silent', reason: 'claim-invalid' });
  });

  it('stops on dispose and never allocates or replays from unmute/Creature Voices On', async () => {
    const combat = combatSessionFixture();
    const inert = harness({ routeKey: combat.routeKey, creatureVoicesOn: false });
    inert.owner.syncSettings();
    inert.policy.creatureVoicesOn = true;
    inert.owner.syncSettings();
    expect(inert.contexts).toHaveLength(0);
    expect(inert.owner.diagnostics().runtime.voices.started).toBe(0);

    const value = await startedCombat();
    value.h.policy.creatureVoicesOn = false;
    value.h.owner.syncSettings();
    value.h.policy.creatureVoicesOn = true;
    value.h.owner.syncSettings();
    expect(value.h.owner.diagnostics().runtime.voices.active).toBe(1);
    expect(value.h.contexts).toHaveLength(1);
    expect(value.h.owner.diagnostics().runtime.voices.started).toBe(1);

    value.h.policy.soundOn = false;
    value.h.owner.syncSettings();
    await Promise.resolve();
    value.h.policy.soundOn = true;
    value.h.owner.syncSettings();
    expect(value.h.contexts).toHaveLength(1);
    expect(value.h.owner.diagnostics()).toMatchObject({
      activeCombatVoiceIds: [],
      runtime: { voices: { active: 0, started: 1 } },
    });

    const disposed = await startedCombat();
    await disposed.h.owner.dispose();
    expect(disposed.h.owner.diagnostics()).toMatchObject({
      disposed: true,
      activeCombatVoiceIds: [],
      runtime: { state: 'disposed', voices: { active: 0 } },
    });
  });
});
