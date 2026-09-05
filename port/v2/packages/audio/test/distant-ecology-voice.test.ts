import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BIOME_PROFILE_AUTHORITY_V1 } from '@cf/domain-biome-profile';
import {
  AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1,
  auditAudioStaticPurity,
  createAudioRuntime,
  createDistantEcologyVoiceRequest,
  type AudioAnalyserNodeLike,
  type AudioContextLike,
  type AudioCounterpartReceipt,
  type AudioGainNodeLike,
  type AudioLimiterNodeLike,
  type AudioNodeLike,
  type AudioParamLike,
  type AudioScheduledSourceLike,
  type AudioVoiceReservation,
} from '../src/index.js';
import { createDistantEcologyHintPlan } from '../src/ecology.js';

interface AutomationEvent {
  readonly kind: 'set' | 'ramp';
  readonly value: number;
  readonly time: number;
}

class FakeParam implements AudioParamLike {
  value = 0;
  readonly events: AutomationEvent[] = [];

  setValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ kind: 'set', value, time });
  }

  linearRampToValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ kind: 'ramp', value, time });
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

  getFloatTimeDomainData(target: Float32Array): void {
    target.fill(0);
  }
}

class FakeLimiter extends FakeNode implements AudioLimiterNodeLike {
  readonly threshold = new FakeParam();
  readonly knee = new FakeParam();
  readonly ratio = new FakeParam();
  readonly attack = new FakeParam();
  readonly release = new FakeParam();
}

class FakeOscillator extends FakeNode implements AudioScheduledSourceLike {
  readonly frequency = new FakeParam();
  type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine';
  onended: (() => void) | null = null;
  readonly startWhens: Array<number | undefined> = [];
  readonly stopWhens: Array<number | undefined> = [];

  start(when?: number): void {
    this.startWhens.push(when);
  }

  stop(when?: number): void {
    this.stopWhens.push(when);
  }

  finish(): void {
    this.onended?.();
  }
}

class SynthesisContext implements AudioContextLike {
  readonly currentTime = 6;
  readonly destination = new FakeNode();
  readonly gains: FakeGain[] = [];
  readonly analysers: FakeAnalyser[] = [];
  readonly limiters: FakeLimiter[] = [];
  readonly oscillators: FakeOscillator[] = [];
  state = 'running';

  createGain(): FakeGain {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  createAnalyser(): FakeAnalyser {
    const analyser = new FakeAnalyser();
    this.analysers.push(analyser);
    return analyser;
  }

  createDynamicsCompressor(): FakeLimiter {
    const limiter = new FakeLimiter();
    this.limiters.push(limiter);
    return limiter;
  }

  createOscillator(): FakeOscillator {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  async resume(): Promise<void> {
    this.state = 'running';
  }

  async close(): Promise<void> {
    this.state = 'closed';
  }
}

function pipeline(
  worldSuffix = 'earth',
  source: 'approach-lead' | 'survey-roster' = 'survey-roster',
) {
  const plan = createDistantEcologyHintPlan({
    canonicalWorldKey: `galaxy:999/system:424242/world:${worldSuffix}`,
    biomeProfile: Object.freeze({
      schema: BIOME_PROFILE_AUTHORITY_V1.schema,
      digest: BIOME_PROFILE_AUTHORITY_V1.digest,
      key: 'temperate',
    }),
    surfaced: Object.freeze({
      source,
      evidenceKey: `${source}:environment-${worldSuffix}:biosphere:living`,
      granularity: 'biosphere',
    }),
  });
  const counterpart = Object.freeze({
    counterpartKey: plan.evidenceKey,
    eventKey: plan.planId,
    generation: 4,
  });
  return { plan, counterpart };
}

const RESERVATION: AudioVoiceReservation = Object.freeze({
  id: 'reservation-distant-ecology',
  graphNodes: 2,
  totalNodes: 3,
});

describe('Arc 7 distant-ecology generic voice request owner', () => {
  it('recanonicalizes one biosphere plan into stable bounded generic output', () => {
    const input = pipeline();
    const first = createDistantEcologyVoiceRequest(input);
    const second = createDistantEcologyVoiceRequest(structuredClone(input));
    const { create: firstCreate, ...firstPolicy } = first;
    const { create: secondCreate, ...secondPolicy } = second;
    expect(secondPolicy).toEqual(firstPolicy);
    expect(firstPolicy).toEqual({
      key: `distant-ecology:${input.plan.planId}`,
      category: 'ambience',
      priority: 10,
      cooldownGroup: `distant-ecology:${input.plan.planId}`,
      cooldownMs: 0,
      concurrencyGroup: 'distant-ecology',
      maxConcurrent: 1,
      nodeCount: 2,
      maxDurationMs: expect.any(Number),
      mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1,
      meaning: { kind: 'meaningful', counterpart: input.counterpart },
    });
    expect(input.plan).toMatchObject({
      source: 'survey-roster',
      granularity: 'biosphere',
      kingdom: null,
      palettePolicy: 'generic-ecology',
      route: 'ambience',
      familyKey: null,
      identityKey: null,
    });

    const firstContext = new SynthesisContext();
    const secondContext = new SynthesisContext();
    const firstGraph = firstCreate(firstContext, RESERVATION);
    const secondGraph = secondCreate(secondContext, RESERVATION);
    expect(firstGraph).toMatchObject({ reservation: RESERVATION });
    expect(firstGraph.nodes).toHaveLength(2);
    expect(firstGraph.sources).toEqual([firstGraph.source]);
    expect(firstGraph.output).toBe(firstContext.gains[0]);
    expect(firstContext.oscillators[0]!.connections).toEqual([firstContext.gains[0]]);
    expect(firstContext.oscillators[0]!.type).toBe('sine');
    expect(firstContext.oscillators[0]!.frequency.events)
      .toEqual(secondContext.oscillators[0]!.frequency.events);
    expect(firstContext.gains[0]!.gain.events).toEqual(secondContext.gains[0]!.gain.events);
    expect(firstContext.oscillators[0]!.frequency.events).toHaveLength(2);
    expect(firstContext.gains[0]!.gain.events).toHaveLength(4);
    expect(Math.max(...firstContext.gains[0]!.gain.events.map((event) => event.value))).toBe(0.018);

    firstGraph.source.start();
    secondGraph.source.start();
    expect(firstContext.oscillators[0]!.startWhens).toEqual([undefined]);
    expect(firstContext.oscillators[0]!.stopWhens).toEqual(secondContext.oscillators[0]!.stopWhens);
    expect(firstContext.oscillators[0]!.stopWhens[0]).toBeGreaterThan(firstContext.currentTime);
    const finalStopMs = (firstContext.oscillators[0]!.stopWhens[0]! - firstContext.currentTime) * 1_000;
    expect(Number.isSafeInteger(first.maxDurationMs)).toBe(true);
    expect(first.maxDurationMs! - finalStopMs).toBeGreaterThanOrEqual(249.999);
    expect(first.maxDurationMs! - finalStopMs).toBeLessThan(251.001);

    const changed = createDistantEcologyVoiceRequest(pipeline('pertar'));
    const changedContext = new SynthesisContext();
    changed.create(changedContext, RESERVATION);
    expect(changed.key).not.toBe(first.key);
    expect(changedContext.oscillators[0]!.frequency.events)
      .not.toEqual(firstContext.oscillators[0]!.frequency.events);
  });

  it('accepts the same generic contract from an exact orbital approach lead', () => {
    const input = pipeline('earth', 'approach-lead');
    const request = createDistantEcologyVoiceRequest(input);
    expect(input.plan).toMatchObject({
      source: 'approach-lead',
      granularity: 'biosphere',
      kingdom: null,
      familyKey: null,
      identityKey: null,
      palettePolicy: 'generic-ecology',
      route: 'ambience',
    });
    expect(request.meaning).toEqual({ kind: 'meaningful', counterpart: input.counterpart });
    const context = new SynthesisContext();
    request.create(context, RESERVATION);
    expect(context.oscillators).toHaveLength(1);
    expect(Math.max(...context.gains[0]!.gain.events.map((event) => event.value))).toBe(0.018);
  });

  it('rejects forged plans, hidden ecology detail, and either side of counterpart drift', () => {
    const input = pipeline();
    const forgedPlan = { ...input.plan, planId: `${input.plan.planId}-forged` };
    expect(() => createDistantEcologyVoiceRequest({
      plan: forgedPlan,
      counterpart: { ...input.counterpart, eventKey: forgedPlan.planId },
    })).toThrow(/canonical surfaced evidence/u);
    expect(() => createDistantEcologyVoiceRequest({
      ...input,
      plan: { ...input.plan, identityKey: 'cf.audio.signature/v1:hidden-species' },
    } as never)).toThrow(/generic biosphere ecology plan/u);
    expect(() => createDistantEcologyVoiceRequest({
      ...input,
      plan: { ...input.plan, kingdom: 'fauna', familyKey: 'hidden-fauna', route: 'creature' },
    } as never)).toThrow(/generic biosphere ecology plan/u);
    expect(() => createDistantEcologyVoiceRequest({
      ...input,
      plan: { ...input.plan, hiddenSpecies: 'Tardigrade' },
    } as never)).toThrow(/generic biosphere ecology plan/u);
    expect(() => createDistantEcologyVoiceRequest({
      ...input,
      plan: { ...input.plan, source: 'combat-reveal' },
    } as never)).toThrow(/generic biosphere ecology plan/u);
    const nonEnumerablePlan = { ...input.plan };
    Object.defineProperty(nonEnumerablePlan, 'hiddenSpecies', {
      value: 'Tardigrade',
      enumerable: false,
    });
    expect(() => createDistantEcologyVoiceRequest({
      ...input,
      plan: nonEnumerablePlan,
    })).toThrow(/generic biosphere ecology plan/u);
    const symbolPlan = { ...input.plan, [Symbol('hidden-species')]: 'Tardigrade' };
    expect(() => createDistantEcologyVoiceRequest({
      ...input,
      plan: symbolPlan,
    })).toThrow(/generic biosphere ecology plan/u);
    expect(() => createDistantEcologyVoiceRequest({
      ...input,
      counterpart: { ...input.counterpart, counterpartKey: 'survey-roster:other' },
    })).toThrow(/does not own/u);
    expect(() => createDistantEcologyVoiceRequest({
      ...input,
      counterpart: { ...input.counterpart, eventKey: 'deh1-other-plan' },
    })).toThrow(/does not own/u);
    expect(() => createDistantEcologyVoiceRequest({
      ...input,
      counterpart: { ...input.counterpart, generation: 0 },
    })).toThrow(/does not own/u);
    expect(() => createDistantEcologyVoiceRequest({
      ...input,
      futurePolicy: true,
    } as never)).toThrow(/input is invalid/u);
  });

  it('releases every partially-created node when gain automation is unavailable', () => {
    const request = createDistantEcologyVoiceRequest(pipeline());
    const context = new SynthesisContext();
    const createGain = context.createGain.bind(context);
    context.createGain = () => {
      const gain = createGain();
      Object.defineProperty(gain.gain, 'linearRampToValueAtTime', { value: undefined });
      return gain;
    };

    expect(() => request.create(context, RESERVATION)).toThrow(/gain automation/u);
    expect(context.oscillators[0]!.disconnectCalls).toBe(1);
    expect(context.gains[0]!.disconnectCalls).toBe(1);
  });

  it('binds runtime verification and naturally cleans the exact three-node admitted graph', async () => {
    const input = pipeline();
    const request = createDistantEcologyVoiceRequest(input);
    const context = new SynthesisContext();
    const runtime = createAudioRuntime({
      createContext: () => context,
      nowMs: () => 200,
      scheduleVoiceDeadline: () => () => {},
      verifyCounterpart: (receipt: AudioCounterpartReceipt) =>
        receipt.counterpartKey === input.counterpart.counterpartKey
        && receipt.eventKey === input.counterpart.eventKey
        && receipt.generation === input.counterpart.generation,
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    const runtimeGainCount = context.gains.length;
    expect(runtime.playVoice(request)).toEqual({ kind: 'started', voiceId: 'voice-000001' });
    expect(context.gains).toHaveLength(runtimeGainCount + 2);
    const envelope = context.gains[runtimeGainCount]!;
    const voiceGain = context.gains[runtimeGainCount + 1]!;
    expect(context.oscillators[0]!.connections).toEqual([envelope]);
    expect(envelope.connections).toEqual([voiceGain]);
    expect(voiceGain.connections).toEqual([context.gains[2]]);
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 16 },
      voices: { active: 1, started: 1 },
      creatureEmitters: { active: 0 },
      voiceMix: { activeOwners: 1, factors: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1.factors },
    });

    context.oscillators[0]!.finish();
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 13 },
      voices: { active: 0, completed: 1 },
      creatureEmitters: { active: 0 },
      voiceMix: { activeOwners: 0, factors: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1.factors },
    });
    expect(context.oscillators[0]!.disconnectCalls).toBe(1);
    expect(envelope.disconnectCalls).toBe(1);
    expect(voiceGain.disconnectCalls).toBe(1);

    const rejectedContext = new SynthesisContext();
    const rejectedRuntime = createAudioRuntime({
      createContext: () => rejectedContext,
      nowMs: () => 200,
      scheduleVoiceDeadline: () => () => {},
      verifyCounterpart: () => false,
    });
    await rejectedRuntime.activate();
    expect(rejectedRuntime.playVoice(request)).toEqual({ kind: 'rejected', reason: 'missing-counterpart' });
    expect(rejectedContext.oscillators).toHaveLength(0);
  });

  it('passes the package purity owner without ambient clocks, entropy, DOM, or gameplay RNG', () => {
    const sourceText = readFileSync(fileURLToPath(
      new URL('../src/distant-ecology-voice.ts', import.meta.url),
    ), 'utf8');
    expect(auditAudioStaticPurity([{ sourceId: 'distant-ecology-voice.ts', sourceText }])).toEqual({
      sourceCount: 1,
      ruleCount: 10,
      violationCount: 0,
    });
  });
});
