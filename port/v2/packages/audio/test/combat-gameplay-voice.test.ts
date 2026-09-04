import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
  type CombatSettlementChampionV1,
  type CombatSettlementOutcomeV1,
  type CombatSettlementPlanV1,
  type DuelResult,
  type GuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import {
  AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1,
  auditAudioStaticPurity,
  combatCuePlan,
  createAudioRuntime,
  createCombatGameplayVoiceRequest,
  inspectAudioStaticPurity,
  projectCombatCueParticipantsV1,
  type AudioAnalyserNodeLike,
  type AudioContextLike,
  type AudioCounterpartReceipt,
  type AudioGainNodeLike,
  type AudioLimiterNodeLike,
  type AudioNodeLike,
  type AudioParamLike,
  type AudioScheduledSourceLike,
  type AudioVoiceReservation,
  type CombatCuePlanV1,
  type CombatCueV1,
} from '../src/index.js';

beforeAll(() => installCaptureHooks());

type AutomationEvent = Readonly<{ kind: 'set' | 'exponential'; value: number; time: number }>;

class FakeParam implements AudioParamLike {
  value = 0;
  readonly events: AutomationEvent[] = [];

  setValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ kind: 'set', value, time });
  }

  exponentialRampToValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ kind: 'exponential', value, time });
  }
}

class FakeNode implements AudioNodeLike {
  readonly connections: AudioNodeLike[] = [];
  disconnectCalls = 0;

  connect(destination: AudioNodeLike): AudioNodeLike {
    this.connections.push(destination);
    return destination;
  }

  disconnect(): void {
    this.disconnectCalls++;
    this.connections.length = 0;
  }
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

class FakeScheduledNode extends FakeNode implements AudioScheduledSourceLike {
  onended: (() => void) | null = null;
  readonly startWhens: Array<number | undefined> = [];
  readonly stopWhens: Array<number | undefined> = [];
  failStart = false;

  start(when?: number): void {
    this.startWhens.push(when);
    if (this.failStart) throw new Error('injected combat source start fault');
  }

  stop(when?: number): void { this.stopWhens.push(when); }
  finish(): void { this.onended?.(); }
}

class FakeOscillator extends FakeScheduledNode {
  readonly frequency = new FakeParam();
  type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine';
}

class FakeBufferSource extends FakeScheduledNode {
  buffer: FakeBuffer | null = null;
}

class FakeBuffer {
  readonly channel: Float32Array;
  constructor(length: number) { this.channel = new Float32Array(length); }
  getChannelData(channel: number): Float32Array {
    if (channel !== 0) throw new RangeError('only mono combat buffers are supported');
    return this.channel;
  }
}

class FakeBiquad extends FakeNode {
  type: 'bandpass' = 'bandpass';
  readonly frequency = new FakeParam();
  readonly Q = new FakeParam();
}

class SynthesisContext implements AudioContextLike {
  readonly currentTime = 6;
  readonly sampleRate = 48_000;
  readonly destination = new FakeNode();
  readonly gains: FakeGain[] = [];
  readonly analysers: FakeAnalyser[] = [];
  readonly limiters: FakeLimiter[] = [];
  readonly oscillators: FakeOscillator[] = [];
  readonly bufferSources: FakeBufferSource[] = [];
  readonly buffers: FakeBuffer[] = [];
  readonly filters: FakeBiquad[] = [];
  state = 'running';

  createGain(): FakeGain {
    const node = new FakeGain();
    this.gains.push(node);
    return node;
  }
  createAnalyser(): FakeAnalyser {
    const node = new FakeAnalyser();
    this.analysers.push(node);
    return node;
  }
  createDynamicsCompressor(): FakeLimiter {
    const node = new FakeLimiter();
    this.limiters.push(node);
    return node;
  }
  createOscillator(): FakeOscillator {
    const node = new FakeOscillator();
    this.oscillators.push(node);
    return node;
  }
  createBuffer(channels: number, length: number, sampleRate: number): FakeBuffer {
    if (channels !== 1 || sampleRate !== this.sampleRate) throw new TypeError('invalid combat buffer request');
    const buffer = new FakeBuffer(length);
    this.buffers.push(buffer);
    return buffer;
  }
  createBufferSource(): FakeBufferSource {
    const node = new FakeBufferSource();
    this.bufferSources.push(node);
    return node;
  }
  createBiquadFilter(): FakeBiquad {
    const node = new FakeBiquad();
    this.filters.push(node);
    return node;
  }
  async resume(): Promise<void> { this.state = 'running'; }
  async close(): Promise<void> { this.state = 'closed'; }
}

interface DamageFixture {
  readonly plan: CombatCuePlanV1;
  readonly cue: CombatCueV1;
  readonly counterpart: AudioCounterpartReceipt;
}

const WORLD = Object.freeze({
  galaxy: Object.freeze({ seed: 1594395733, x: -5501.81, y: -11753.64 }),
  star: Object.freeze({ seed: 4077594722, x: -271.54, y: -67.36 }),
  planet: Object.freeze({ seed: 488332735 }),
});
const GUARDIAN_WORLD = Object.freeze({
  galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
  star: Object.freeze({ seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }),
  planet: Object.freeze({ seed: 2456455053 }),
});
const TITAN_WORLD = Object.freeze({
  galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
  star: Object.freeze({ seed: 2198479616, x: -801.6800962826237, y: -253.19977576704696 }),
  planet: Object.freeze({ seed: 2481585519 }),
});
let TARGET: GuardianPrimeEncounterV1 | null = null;
let GUARDIAN_TARGET: GuardianPrimeEncounterV1 | null = null;
let TITAN_TARGET: GuardianPrimeEncounterV1 | null = null;
const FIXTURES = new Map<string, DamageFixture>();

function target(): GuardianPrimeEncounterV1 {
  if (TARGET !== null) return TARGET;
  const resolved = resolveCF1WorldAddress(WORLD);
  if (!resolved.ok) throw new Error(`failed to resolve audio world: ${resolved.reason}`);
  TARGET = projectGuardianPrimeEncounterV1({
    world: resolved.address, descriptor: { worldType: 'airless' }, regionIndex: 0,
    faunaRoster: [{ speciesId: 'audio-impact-defender', genome: makeGenome(999, 'fauna', 0.5) }],
    claimedSignatureIds: [], conquered: false,
  });
  if (TARGET === null) throw new Error('failed to project audio impact target');
  return TARGET;
}

function guardianTarget(): GuardianPrimeEncounterV1 {
  if (GUARDIAN_TARGET !== null) return GUARDIAN_TARGET;
  const resolved = resolveCF1WorldAddress(GUARDIAN_WORLD);
  if (!resolved.ok) throw new Error(`failed to resolve Guardian audio world: ${resolved.reason}`);
  GUARDIAN_TARGET = projectGuardianPrimeEncounterV1({
    world: resolved.address, descriptor: { worldType: 'airless' }, regionIndex: 0,
    faunaRoster: [{ speciesId: 'audio-guardian-defender', genome: makeGenome(1, 'fauna', 0.5) }],
    claimedSignatureIds: [], conquered: false,
  });
  if (GUARDIAN_TARGET === null) throw new Error('failed to project Guardian audio target');
  return GUARDIAN_TARGET;
}

function titanTarget(): GuardianPrimeEncounterV1 {
  if (TITAN_TARGET !== null) return TITAN_TARGET;
  const resolved = resolveCF1WorldAddress(TITAN_WORLD);
  if (!resolved.ok) throw new Error(`failed to resolve Titan audio world: ${resolved.reason}`);
  TITAN_TARGET = projectGuardianPrimeEncounterV1({
    world: resolved.address, descriptor: { worldType: 'lava' }, regionIndex: 0,
    faunaRoster: [], claimedSignatureIds: [], conquered: false,
  });
  if (TITAN_TARGET === null) throw new Error('failed to project Titan audio target');
  return TITAN_TARGET;
}

function settlement(
  seed: number,
  encounter: GuardianPrimeEncounterV1 = target(),
  strengthen = false,
): CombatSettlementPlanV1 {
  const genome = makeGenome(seed, 'fauna', 0.5);
  if (strengthen) {
    genome.brood = 200;
    genome.fed = 200;
    genome.xp = 486;
  }
  const champion: CombatSettlementChampionV1 = {
    kind: 'owned-fauna', creatureId: `voice-champion-${seed}`,
    name: `Voice Champion ${seed}`, genome, legacyBredLineage: true,
  };
  const transcript: DuelResult = runDuel(
    { name: champion.name, genome },
    { name: encounter.defender.name, genome: encounter.defender.battleGenome as Genome },
  );
  const winner = (transcript as { winner?: unknown }).winner;
  const outcome: CombatSettlementOutcomeV1 = winner === 'A' ? 'champion-win'
    : winner === 'B' ? 'defender-win' : 'draw';
  const planned = planCombatSettlementV1({
    battleId: `voice-battle-${seed}`, receiptOrdinal: 41, encounter, champion, transcript,
    outcome, worldTier: 4,
    authority: {
      worldConquered: false, claimedPrimeSignatureIds: [],
      lossXp: { kind: 'known-target', awardedTarget: 0 },
    },
  });
  if (planned.status !== 'planned') throw new Error(`voice settlement refused: ${planned.reason}`);
  return planned;
}

function damageFixture(kind: 'plain' | 'critical-ability' | 'different'): DamageFixture {
  const cached = FIXTURES.get(kind);
  if (cached !== undefined) return cached;
  for (let seed = kind === 'different' ? 769 : 1; seed <= (kind === 'different' ? 1_536 : 768); seed++) {
    const settled = settlement(seed);
    const plan = combatCuePlan(settled, projectCombatCueParticipantsV1(settled));
    const cue = plan.cues.find((candidate) => {
      if (candidate.impact === null) return false;
      if (kind === 'plain') return !candidate.impact.critical && !candidate.impact.abilityProc;
      if (kind === 'critical-ability') return candidate.impact.critical && candidate.impact.abilityProc;
      return true;
    });
    if (cue === undefined) continue;
    const damage = cue.counterparts.find((row) => row.family === 'damage')!;
    const fixture = Object.freeze({
      plan, cue,
      counterpart: Object.freeze({
        counterpartKey: damage.captionToken, eventKey: cue.cueId, generation: 3,
      }),
    });
    FIXTURES.set(kind, fixture);
    return fixture;
  }
  throw new Error(`no bounded ${kind} combat impact fixture found`);
}

function reservationFor(fixture: DamageFixture): AudioVoiceReservation {
  const request = createCombatGameplayVoiceRequest(fixture);
  return Object.freeze({
    id: `reservation-${fixture.cue.ordinal}`,
    graphNodes: request.nodeCount,
    totalNodes: request.nodeCount + 1,
  });
}

describe('Arc 8 source-authored combat gameplay voice', () => {
  it('renders the exact legacy impact/critical/ability formulas with deterministic cue-keyed noise', () => {
    const fixture = damageFixture('critical-ability');
    const request = createCombatGameplayVoiceRequest(fixture);
    const { create, ...policy } = request;
    expect(policy).toEqual({
      key: `combat-gameplay:${fixture.cue.cueId}`,
      category: 'combat-gameplay', priority: 80,
      cooldownGroup: `combat-gameplay:${fixture.cue.cueId}`, cooldownMs: 0,
      concurrencyGroup: 'combat-gameplay-impact', maxConcurrent: 2,
      nodeCount: 11,
      mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1,
      meaning: { kind: 'meaningful', counterpart: fixture.counterpart },
    });
    const reservation = reservationFor(fixture);
    const firstContext = new SynthesisContext();
    const secondContext = new SynthesisContext();
    const first = create(firstContext, reservation);
    create(secondContext, reservation);
    expect(first).toMatchObject({ reservation });
    expect(first.nodes).toHaveLength(11);
    expect(first.sources).toHaveLength(4);
    expect(first.sources).toContain(first.source);
    expect(first.output).toBe(firstContext.gains[0]);
    expect(firstContext.oscillators.map((node) => node.type))
      .toEqual(['triangle', 'sine', 'sawtooth']);

    const fraction = fixture.cue.impact!.damageFraction;
    const heavy = Math.max(0.15, Math.min(1, fraction || 0.3));
    const t = firstContext.currentTime + 0.01;
    expect(firstContext.gains[1]!.gain.events).toEqual([
      { kind: 'set', value: 0.0001, time: t },
      { kind: 'exponential', value: 0.16 + heavy * 0.3, time: t + 0.008 },
      { kind: 'exponential', value: 0.0001, time: t + 0.10 + heavy * 0.22 },
    ]);
    expect(firstContext.oscillators[0]!.frequency.events).toEqual([
      { kind: 'set', value: 220 - heavy * 120, time: t },
      { kind: 'exponential', value: Math.max(40, 70 - heavy * 25), time: t + 0.09 + heavy * 0.14 },
    ]);
    expect(firstContext.filters.map((node) => [node.frequency.value, node.Q.value]))
      .toEqual([[2600, 2.2], [1200, 4]]);
    expect(firstContext.gains[2]!.gain.value).toBe(0.5);
    expect(firstContext.oscillators[1]!.frequency.events).toEqual([
      { kind: 'set', value: 1760, time: t },
      { kind: 'exponential', value: 2640, time: t + 0.14 },
    ]);
    expect(firstContext.oscillators[2]!.frequency.events).toEqual([
      { kind: 'set', value: 330, time: t + 0.02 },
      { kind: 'exponential', value: 880, time: t + 0.16 },
    ]);
    expect(firstContext.buffers[0]!.channel).toEqual(secondContext.buffers[0]!.channel);
    expect([...firstContext.buffers[0]!.channel].some((sample) => sample !== 0)).toBe(true);
    const different = damageFixture('different');
    const differentContext = new SynthesisContext();
    createCombatGameplayVoiceRequest(different).create(differentContext, reservationFor(different));
    expect(differentContext.buffers[0]!.channel).not.toEqual(firstContext.buffers[0]!.channel);

    for (const source of first.sources) source.start();
    expect(firstContext.oscillators[0]!.startWhens).toEqual([t]);
    expect(firstContext.bufferSources[0]!.startWhens).toEqual([t]);
    expect(firstContext.oscillators[1]!.startWhens).toEqual([t]);
    expect(firstContext.oscillators[2]!.startWhens).toEqual([t + 0.02]);
    expect(firstContext.oscillators[0]!.stopWhens).toEqual([t + 0.12 + heavy * 0.22]);
    expect(firstContext.bufferSources[0]!.stopWhens).toEqual([t + 0.08]);
    expect(firstContext.oscillators[1]!.stopWhens).toEqual([t + 0.22]);
    expect(firstContext.oscillators[2]!.stopWhens).toEqual([t + 0.24]);
  });

  it('refuses structural cue/plan clones and counterpart drift while admitting registered non-impact cues', () => {
    const fixture = damageFixture('plain');
    expect(() => createCombatGameplayVoiceRequest({ ...fixture, plan: { ...fixture.plan } as never }))
      .toThrow(/registered combat cue plan/u);
    expect(() => createCombatGameplayVoiceRequest({ ...fixture, cue: { ...fixture.cue } }))
      .toThrow(/registered settled combat cue/u);
    const nonImpact = fixture.plan.cues.find((cue) => cue.impact === null)!;
    const primary = nonImpact.counterparts[0]!;
    const nonImpactInput = Object.freeze({
      plan: fixture.plan,
      cue: nonImpact,
      counterpart: Object.freeze({
        counterpartKey: primary.captionToken,
        eventKey: nonImpact.cueId,
        generation: fixture.counterpart.generation,
      }),
    });
    const nonImpactRequest = createCombatGameplayVoiceRequest(nonImpactInput);
    const nonImpactContext = new SynthesisContext();
    const graph = nonImpactRequest.create(nonImpactContext, Object.freeze({
      id: 'non-impact', graphNodes: nonImpactRequest.nodeCount,
      totalNodes: nonImpactRequest.nodeCount + 1,
    }));
    expect(graph.nodes).toHaveLength(nonImpactRequest.nodeCount);
    expect(graph.sources.length).toBeGreaterThan(0);
    expect(() => createCombatGameplayVoiceRequest({
      ...fixture,
      counterpart: { ...fixture.counterpart, counterpartKey: 'combat:other-caption' },
    })).toThrow(/does not own/u);
    expect(() => createCombatGameplayVoiceRequest({
      ...fixture, counterpart: { ...fixture.counterpart, eventKey: 'combat-cue:other' },
    })).toThrow(/does not own/u);
    expect(() => createCombatGameplayVoiceRequest({
      ...fixture, counterpart: { ...fixture.counterpart, generation: 0 },
    })).toThrow(/does not own/u);
    expect(() => createCombatGameplayVoiceRequest({ ...fixture, futurePolicy: true } as never))
      .toThrow(/input is invalid/u);
  });

  it('renders every modelled non-impact family and all four Guardian/Titan motif contours', () => {
    const wanted = new Set(['initiative', 'dodge', 'stun-skipped', 'burn', 'regen', 'resolution']);
    const found = new Map<string, Readonly<{ plan: CombatCuePlanV1; cue: CombatCueV1 }>>();
    for (let seed = 1; seed <= 768 && found.size < wanted.size; seed++) {
      const settled = settlement(seed);
      const plan = combatCuePlan(settled, projectCombatCueParticipantsV1(settled));
      for (const cue of plan.cues) {
        const primary = cue.families[0]!;
        if (wanted.has(primary) && !found.has(primary)) found.set(primary, { plan, cue });
      }
    }
    expect(new Set(found.keys())).toEqual(wanted);

    const guardianSettlement = settlement(7, guardianTarget(), true);
    const guardianPlan = combatCuePlan(
      guardianSettlement,
      projectCombatCueParticipantsV1(guardianSettlement),
    );
    const titanSettlement = settlement(1, titanTarget());
    const titanPlan = combatCuePlan(titanSettlement, projectCombatCueParticipantsV1(titanSettlement));
    const motifs = [...guardianPlan.cues, ...titanPlan.cues]
      .filter((cue) => cue.guardianMotif !== null);
    expect(new Set(motifs.map((cue) => cue.guardianMotif!.motif)))
      .toEqual(new Set(['entrance', 'phase', 'victory', 'defeat']));

    const samples = [...found.values(), ...motifs.map((cue) => ({
      plan: cue.guardianMotif?.kind === 'titan' ? titanPlan : guardianPlan,
      cue,
    }))];
    for (const [index, sample] of samples.entries()) {
      const counterpart = sample.cue.counterparts[0]!;
      const request = createCombatGameplayVoiceRequest({
        ...sample,
        counterpart: Object.freeze({
          counterpartKey: counterpart.captionToken,
          eventKey: sample.cue.cueId,
          generation: 19,
        }),
      });
      const context = new SynthesisContext();
      const graph = request.create(context, Object.freeze({
        id: `family-${index}`,
        graphNodes: request.nodeCount,
        totalNodes: request.nodeCount + 1,
      }));
      expect(graph.nodes).toHaveLength(request.nodeCount);
      expect(graph.sources.length).toBeGreaterThan(0);
      expect(request.nodeCount).toBeLessThanOrEqual(11);
      for (const source of graph.sources) source.start();
      expect([...context.oscillators, ...context.bufferSources]
        .every((source) => source.stopWhens.length === 1)).toBe(true);
    }
  });

  it('releases every partially-created graph node when synthesis construction fails', () => {
    const fixture = damageFixture('plain');
    const request = createCombatGameplayVoiceRequest(fixture);
    const context = new SynthesisContext();
    const createGain = context.createGain.bind(context);
    let gains = 0;
    context.createGain = () => {
      const gain = createGain();
      gains++;
      if (gains === 2) {
        Object.defineProperty(gain.gain, 'exponentialRampToValueAtTime', { value: undefined });
      }
      return gain;
    };
    expect(() => request.create(context, reservationFor(fixture)))
      .toThrow(/impact gain automation/u);
    expect(context.gains).toHaveLength(2);
    expect(context.gains.every((node) => node.disconnectCalls === 1)).toBe(true);
    expect(context.oscillators).toHaveLength(0);
  });

  it('routes through combat-gameplay and naturally cleans the exact admitted graph', async () => {
    const fixture = damageFixture('critical-ability');
    const request = createCombatGameplayVoiceRequest(fixture);
    const context = new SynthesisContext();
    const runtime = createAudioRuntime({
      createContext: () => context,
      nowMs: () => 400,
      verifyCounterpart: (receipt: AudioCounterpartReceipt) =>
        receipt.counterpartKey === fixture.counterpart.counterpartKey
        && receipt.eventKey === fixture.counterpart.eventKey
        && receipt.generation === fixture.counterpart.generation,
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    const runtimeGainCount = context.gains.length;
    expect(runtime.playVoice(request)).toEqual({ kind: 'started', voiceId: 'voice-000001' });
    const output = context.gains[runtimeGainCount]!;
    const voiceGain = context.gains[runtimeGainCount + 5]!;
    expect(output.connections).toEqual([voiceGain]);
    expect(voiceGain.connections).toEqual([context.gains[4]]);
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 25 },
      voices: { active: 1, started: 1 },
      creatureEmitters: { active: 0 },
      voiceMix: { activeOwners: 1, factors: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1.factors },
    });
    const rawSources: FakeScheduledNode[] = [
      ...context.oscillators,
      ...context.bufferSources,
    ];
    const completion = rawSources.reduce((latest, source) =>
      source.stopWhens[0]! > latest.stopWhens[0]! ? source : latest);
    completion.finish();
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 13 },
      voices: { active: 0, completed: 1 },
      voiceMix: { activeOwners: 0, factors: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1.factors },
    });
    expect(rawSources.every((source) => source.disconnectCalls === 1)).toBe(true);
    expect(context.filters.every((node) => node.disconnectCalls === 1)).toBe(true);
    expect(output.disconnectCalls).toBe(1);
    expect(voiceGain.disconnectCalls).toBe(1);

    const rejectedContext = new SynthesisContext();
    const rejectedRuntime = createAudioRuntime({
      createContext: () => rejectedContext, nowMs: () => 400, verifyCounterpart: () => false,
    });
    await rejectedRuntime.activate();
    expect(rejectedRuntime.playVoice(request))
      .toEqual({ kind: 'rejected', reason: 'missing-counterpart' });
    expect(rejectedContext.oscillators).toHaveLength(0);
  });

  it('cleans every source/node on start fault and on explicit stop', async () => {
    const fixture = damageFixture('plain');
    const request = createCombatGameplayVoiceRequest(fixture);
    const faultContext = new SynthesisContext();
    const createOscillator = faultContext.createOscillator.bind(faultContext);
    faultContext.createOscillator = () => {
      const node = createOscillator();
      node.failStart = true;
      return node;
    };
    const faultRuntime = createAudioRuntime({
      createContext: () => faultContext, nowMs: () => 500,
      verifyCounterpart: () => true,
    });
    await faultRuntime.activate();
    expect(faultRuntime.playVoice(request)).toEqual({ kind: 'fault', reason: 'voice-start' });
    expect(faultRuntime.diagnostics()).toMatchObject({
      nodes: { active: 13 }, voices: { active: 0, started: 0 },
    });
    expect(faultContext.oscillators.every((node) => node.disconnectCalls === 1)).toBe(true);
    expect(faultContext.bufferSources.every((node) => node.disconnectCalls === 1)).toBe(true);

    const stopContext = new SynthesisContext();
    const stopRuntime = createAudioRuntime({
      createContext: () => stopContext, nowMs: () => 500,
      verifyCounterpart: () => true,
    });
    await stopRuntime.activate();
    expect(stopRuntime.playVoice(request)).toEqual({ kind: 'started', voiceId: 'voice-000001' });
    expect(stopRuntime.stopVoice('voice-000001')).toBe(true);
    expect(stopRuntime.diagnostics()).toMatchObject({
      nodes: { active: 13 }, voices: { active: 0, stopped: 1 },
    });
    expect(stopContext.oscillators.every((node) => node.disconnectCalls === 1)).toBe(true);
    expect(stopContext.bufferSources.every((node) => node.disconnectCalls === 1)).toBe(true);
  });

  it('passes static purity and rejects entropy/clock/gameplay-RNG mutants', () => {
    const sourceText = readFileSync(fileURLToPath(
      new URL('../src/combat-gameplay-voice.ts', import.meta.url),
    ), 'utf8');
    expect(auditAudioStaticPurity([{ sourceId: 'combat-gameplay-voice.ts', sourceText }])).toEqual({
      sourceCount: 1, ruleCount: 10, violationCount: 0,
    });
    const mutants = [
      ['math-random', '\nconst mutation = Math.random();'],
      ['date-now', '\nconst mutation = Date.now();'],
      ['rng-import', "\nimport { mulberry32 } from '@cf/domain-rand';"],
    ] as const;
    for (const [rule, mutation] of mutants) {
      const sources = [{ sourceId: `combat-voice-${rule}.ts`, sourceText: sourceText + mutation }];
      expect(inspectAudioStaticPurity(sources)).toMatchObject([{ rule }]);
      expect(() => auditAudioStaticPurity(sources)).toThrow(rule);
    }
  });
});
