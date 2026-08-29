import { describe, expect, it } from 'vitest';
import {
  AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1,
  createAudioIdentityProfile,
  createAudioRuntime,
  createAudioSignature,
  createCreatureCallPlan,
  createCreatureExpressionCue,
  createCreatureExpressionVoiceRequest,
  type AudioAnalyserNodeLike,
  type AudioContextLike,
  type AudioCounterpartReceipt,
  type AudioGainNodeLike,
  type AudioLimiterNodeLike,
  type AudioNodeLike,
  type AudioParamLike,
  type AudioScheduledSourceLike,
  type AudioVoiceReservation,
  type ImmutableAudioPhenotype,
} from '../src/index.js';

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
  readonly currentTime = 4;
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

const PHENOTYPE: ImmutableAudioPhenotype = Object.freeze({
  seed: 0xC0FFEE,
  kingdom: 'fauna',
  color: 2,
  accent: 7,
  form: 3,
  body: 5,
  loco: 1,
  trait: 8,
  size: 4,
  diet: 2,
  head: 6,
  limbs: 3,
  skin: 4,
  tail: 2,
  pattern: 7,
  behavior: 5,
  habitat: 4,
  temper: 6,
  sense: 2,
  metab: 3,
  lumin: true,
  heatBand: 1,
});

function pipeline(kingdom: 'fauna' | 'flora' = 'fauna') {
  const signature = createAudioSignature({
    owner: kingdom === 'fauna'
      ? { route: 'catalogue', kingdom, name: 'Tardigrade' }
      : { route: 'catalogue', kingdom, name: 'Apple' },
    phenotype: { ...PHENOTYPE, kingdom },
    lineage: { parentSeeds: null, anchorBasisPoints: null },
  });
  const profile = createAudioIdentityProfile(signature);
  const callPlan = createCreatureCallPlan(profile);
  const cue = createCreatureExpressionCue(callPlan, {
    kind: 'taming-succeeded',
    eventKey: 'tame:world-133:slot-4',
    captionKey: 'notice:tame:world-133:slot-4',
  });
  const counterpart = Object.freeze({
    counterpartKey: cue.captionKey,
    eventKey: cue.eventKey,
    generation: 7,
  });
  return { profile, callPlan, cue, counterpart };
}

const RESERVATION: AudioVoiceReservation = Object.freeze({
  id: 'reservation-test',
  graphNodes: 2,
  totalNodes: 3,
});

describe('Arc 7 creature-expression voice request owner', () => {
  it('deterministically renders one bounded fauna oscillator and gain envelope', () => {
    const input = pipeline();
    const first = createCreatureExpressionVoiceRequest(input);
    const second = createCreatureExpressionVoiceRequest(structuredClone(input));
    const { create: firstCreate, ...firstPolicy } = first;
    const { create: secondCreate, ...secondPolicy } = second;
    expect(secondPolicy).toEqual(firstPolicy);
    expect(firstPolicy).toEqual({
      key: `creature-expression:${input.cue.cueId}`,
      category: 'creature',
      priority: 40,
      cooldownGroup: input.callPlan.cooldownGroup,
      cooldownMs: input.callPlan.cooldownMs,
      concurrencyGroup: 'creature-expression',
      maxConcurrent: 1,
      nodeCount: 2,
      mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1,
      meaning: { kind: 'meaningful', counterpart: input.counterpart },
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
    expect(firstContext.oscillators[0]!.frequency.events).toHaveLength(input.cue.phrase.durationsMs.length);
    expect(firstContext.gains[0]!.gain.events).toHaveLength(input.cue.phrase.durationsMs.length * 4);
    expect(Math.max(...firstContext.gains[0]!.gain.events.map((event) => event.value))).toBeLessThan(0.04);

    let ended = 0;
    firstGraph.source.onended = () => { ended++; };
    firstGraph.source.start();
    secondGraph.source.start();
    expect(firstContext.oscillators[0]!.startWhens).toEqual([undefined]);
    expect(firstContext.oscillators[0]!.stopWhens).toHaveLength(1);
    expect(firstContext.oscillators[0]!.stopWhens[0]).toBeGreaterThan(firstContext.currentTime);
    expect(firstContext.oscillators[0]!.stopWhens).toEqual(secondContext.oscillators[0]!.stopWhens);
    firstContext.oscillators[0]!.finish();
    expect(ended).toBe(1);
    firstGraph.source.stop();
    expect(firstContext.oscillators[0]!.stopWhens).toHaveLength(1);
  });

  it('rejects non-fauna, mutated identity/cue data, and an unowned counterpart', () => {
    const input = pipeline();
    expect(() => createCreatureExpressionVoiceRequest({
      ...pipeline('flora'),
    })).toThrow(/fauna audio identity/u);
    expect(() => createCreatureExpressionVoiceRequest({
      ...input,
      profile: { ...input.profile, register: { ...input.profile.register, centerHz: 999 } },
    })).toThrow(/fauna audio identity/u);
    expect(() => createCreatureExpressionVoiceRequest({
      ...input,
      callPlan: { ...input.callPlan, cooldownMs: input.callPlan.cooldownMs + 1 },
    })).toThrow(/call plan/u);
    expect(() => createCreatureExpressionVoiceRequest({
      ...input,
      cue: {
        ...input.cue,
        expression: { ...input.cue.expression, gainPermille: input.cue.expression.gainPermille + 1 },
      },
    })).toThrow(/settled event/u);
    expect(() => createCreatureExpressionVoiceRequest({
      ...input,
      counterpart: { ...input.counterpart, generation: 0 },
    })).toThrow(/does not own/u);
    expect(() => createCreatureExpressionVoiceRequest({
      ...input,
      counterpart: { ...input.counterpart, counterpartKey: 'notice:some-other-event' },
    })).toThrow(/does not own/u);
    expect(() => createCreatureExpressionVoiceRequest({
      ...input,
      futurePolicy: true,
    } as never)).toThrow(/input is invalid/u);
  });

  it('releases every partially-created node when required gain automation is unavailable', () => {
    const request = createCreatureExpressionVoiceRequest(pipeline());
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

  it('integrates with runtime ownership, counterpart verification, and natural cleanup', async () => {
    const input = pipeline();
    const request = createCreatureExpressionVoiceRequest(input);
    const context = new SynthesisContext();
    const runtime = createAudioRuntime({
      createContext: () => context,
      nowMs: () => 100,
      verifyCounterpart: (receipt: AudioCounterpartReceipt) =>
        receipt.counterpartKey === input.counterpart.counterpartKey
        && receipt.eventKey === input.counterpart.eventKey
        && receipt.generation === input.counterpart.generation,
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(context.gains[3]!.gain.events).toEqual([{ kind: 'set', value: 1, time: 4 }]);
    expect(runtime.playVoice(request)).toEqual({ kind: 'started', voiceId: 'voice-000001' });
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]!.startWhens).toEqual([undefined]);
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 16 }, voices: { active: 1, started: 1 }, creatureEmitters: { active: 1 },
      voiceMix: {
        activeOwners: 1,
        factors: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1.factors,
        effectiveCategoryGains: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1.factors,
      },
    });
    expect(context.gains[3]!.gain.events).toEqual([{ kind: 'set', value: 1, time: 4 }]);
    context.oscillators[0]!.finish();
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 13 }, voices: { active: 0, completed: 1 }, creatureEmitters: { active: 0 },
      voiceMix: { activeOwners: 0, factors: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1.factors },
    });

    const rejectedContext = new SynthesisContext();
    const rejectedRuntime = createAudioRuntime({
      createContext: () => rejectedContext,
      nowMs: () => 100,
      verifyCounterpart: () => false,
    });
    await rejectedRuntime.activate();
    expect(rejectedRuntime.playVoice(request)).toEqual({ kind: 'rejected', reason: 'missing-counterpart' });
    expect(rejectedContext.oscillators).toHaveLength(0);
  });
});
