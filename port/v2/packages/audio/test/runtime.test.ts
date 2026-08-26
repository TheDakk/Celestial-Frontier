import { describe, expect, it } from 'vitest';
import {
  AUDIO_CATEGORIES,
  AUDIO_RESOURCE_MEASUREMENT_DIAGNOSTICS,
  AUDIO_SETTING_ACCESSIBILITY_DIAGNOSTICS,
  auditAudioLabLifecycleTrace,
  captureAudioLabSample,
  createAudioRuntime,
  type AudioCounterpartReceipt,
  type AudioAnalyserNodeLike,
  type AudioContextLike,
  type AudioLabSample,
  type AudioGainNodeLike,
  type AudioLimiterNodeLike,
  type AudioNodeLike,
  type AudioParamLike,
  type AudioScheduledSourceLike,
  type AudioVoiceRequest,
  type AudioVoiceReservation,
} from '../src/index.js';

class FakeParam implements AudioParamLike {
  value = 0;
  readonly values: number[] = [];

  setValueAtTime(value: number): void {
    this.value = value;
    this.values.push(value);
  }
}

class FakeNode implements AudioNodeLike {
  readonly connections: AudioNodeLike[] = [];
  disconnectCalls = 0;
  throwConnect = false;
  throwDisconnect = false;

  constructor(readonly label: string) {}

  connect(destination: AudioNodeLike): AudioNodeLike {
    if (this.throwConnect) throw new Error(`${this.label} connect refusal`);
    this.connections.push(destination);
    return destination;
  }

  disconnect(): void {
    this.disconnectCalls++;
    if (this.throwDisconnect) throw new Error(`${this.label} disconnect refusal`);
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
  samples: readonly number[] = [];

  getFloatTimeDomainData(target: Float32Array): void {
    target.fill(0);
    for (let index = 0; index < Math.min(target.length, this.samples.length); index++) {
      target[index] = this.samples[index]!;
    }
  }
}

class FakeLimiter extends FakeNode implements AudioLimiterNodeLike {
  readonly threshold = new FakeParam();
  readonly knee = new FakeParam();
  readonly ratio = new FakeParam();
  readonly attack = new FakeParam();
  readonly release = new FakeParam();
}

class FakeSource extends FakeNode implements AudioScheduledSourceLike {
  onended: (() => void) | null = null;
  startCalls = 0;
  stopCalls = 0;
  throwStart = false;
  throwStop = false;

  start(): void {
    this.startCalls++;
    if (this.throwStart) throw new Error(`${this.label} start refusal`);
  }

  stop(): void {
    this.stopCalls++;
    if (this.throwStop) throw new Error(`${this.label} stop refusal`);
  }

  finish(): void {
    this.onended?.();
  }
}

type ResumeOutcome = 'running' | 'reject' | 'stay-suspended';

class FakeContext implements AudioContextLike {
  readonly currentTime = 12;
  readonly destination = new FakeNode('destination');
  readonly gains: FakeGain[] = [];
  readonly analysers: FakeAnalyser[] = [];
  readonly limiters: FakeLimiter[] = [];
  readonly listeners = new Set<() => void>();
  readonly resumeOutcomes: ResumeOutcome[];
  state: string;
  resumeCalls = 0;
  closeCalls = 0;

  constructor(state = 'running', resumeOutcomes: ResumeOutcome[] = []) {
    this.state = state;
    this.resumeOutcomes = [...resumeOutcomes];
  }

  createGain(): FakeGain {
    const gain = new FakeGain(`gain-${this.gains.length}`);
    this.gains.push(gain);
    return gain;
  }

  createAnalyser(): FakeAnalyser {
    const analyser = new FakeAnalyser(`analyser-${this.analysers.length}`);
    this.analysers.push(analyser);
    return analyser;
  }

  createDynamicsCompressor(): FakeLimiter {
    const limiter = new FakeLimiter(`limiter-${this.limiters.length}`);
    this.limiters.push(limiter);
    return limiter;
  }

  async resume(): Promise<void> {
    this.resumeCalls++;
    const outcome = this.resumeOutcomes.shift() ?? 'running';
    if (outcome === 'reject') throw new Error('injected resume refusal');
    if (outcome === 'running') this.state = 'running';
    this.emit();
  }

  async close(): Promise<void> {
    this.closeCalls++;
    this.state = 'closed';
    this.emit();
  }

  addEventListener(_type: 'statechange', listener: () => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'statechange', listener: () => void): void {
    this.listeners.delete(listener);
  }

  forceState(state: string): void {
    this.state = state;
    this.emit();
  }

  private emit(): void {
    for (const listener of [...this.listeners]) listener();
  }
}

class DeferredContext extends FakeContext {
  private resumeGate: Promise<void> | null = null;
  private releaseResumeGate: (() => void) | null = null;
  private closeGate: Promise<void> | null = null;
  private releaseCloseGate: (() => void) | null = null;

  deferResume(): void {
    this.resumeGate = new Promise((resolve) => { this.releaseResumeGate = () => { resolve(); }; });
  }

  releaseResume(): void {
    this.releaseResumeGate?.();
    this.releaseResumeGate = null;
  }

  deferClose(): void {
    this.closeGate = new Promise((resolve) => { this.releaseCloseGate = () => { resolve(); }; });
  }

  releaseClose(): void {
    this.releaseCloseGate?.();
    this.releaseCloseGate = null;
  }

  override async resume(): Promise<void> {
    this.resumeCalls++;
    if (this.resumeGate) await this.resumeGate;
    this.resumeGate = null;
    this.forceState('running');
  }

  override async close(): Promise<void> {
    this.closeCalls++;
    if (this.closeGate) await this.closeGate;
    this.closeGate = null;
    this.forceState('closed');
  }
}

class RetryCloseContext extends FakeContext {
  private remainingFailures: number;

  constructor(failures: number) {
    super();
    this.remainingFailures = failures;
  }

  override async close(): Promise<void> {
    this.closeCalls++;
    if (this.remainingFailures > 0) {
      this.remainingFailures--;
      throw new Error('injected close refusal');
    }
    this.forceState('closed');
  }
}

class PermanentCloseContext extends FakeContext {
  override async close(): Promise<void> {
    this.closeCalls++;
    throw new Error('injected permanent close refusal');
  }
}

class NeverResumeContext extends FakeContext {
  override resume(): Promise<void> {
    this.resumeCalls++;
    return new Promise<void>(() => { /* deliberately never settles */ });
  }
}

class NeverCloseContext extends FakeContext {
  override close(): Promise<void> {
    this.closeCalls++;
    return new Promise<void>(() => { /* deliberately never settles */ });
  }
}

class RejectThenNeverCloseContext extends FakeContext {
  override close(): Promise<void> {
    this.closeCalls++;
    if (this.closeCalls === 1) return Promise.reject(new Error('injected first close refusal'));
    return new Promise<void>(() => { /* deliberately never settles */ });
  }
}

class ReentrantRejectResumeContext extends FakeContext {
  resumeHook: (() => void) | null = null;

  override resume(): Promise<void> {
    this.resumeCalls++;
    this.resumeHook?.();
    return Promise.reject(new Error('resume rejected after cancellation'));
  }
}

class ReentrantCloseContext extends FakeContext {
  closeHook: (() => Promise<void>) | null = null;

  override async close(): Promise<void> {
    this.closeCalls++;
    if (this.closeHook) await this.closeHook();
    this.forceState('closed');
  }
}

function contextFactory(contexts: readonly FakeContext[]): {
  readonly create: () => AudioContextLike;
  readonly created: () => number;
} {
  let count = 0;
  return {
    create: () => {
      const context = contexts[count];
      if (!context) throw new Error('unexpected context creation');
      count++;
      return context;
    },
    created: () => count,
  };
}

interface RequestOptions {
  key?: string;
  category?: AudioVoiceRequest['category'];
  priority?: number;
  cooldownGroup?: string;
  cooldownMs?: number;
  concurrencyGroup?: string;
  maxConcurrent?: number;
  meaning?: AudioVoiceRequest['meaning'];
  output?: FakeNode;
  nodes?: readonly FakeNode[];
  sources?: readonly FakeSource[];
  nodeCount?: number;
  create?: (reservation: AudioVoiceReservation) => void;
}

function request(source: FakeSource, options: RequestOptions = {}): AudioVoiceRequest {
  const output = options.output ?? source;
  const nodes = options.nodes ?? [source];
  const sources = options.sources ?? [source];
  return {
    key: options.key ?? source.label,
    category: options.category ?? 'ui',
    priority: options.priority ?? 1,
    cooldownGroup: options.cooldownGroup ?? `cooldown:${source.label}`,
    cooldownMs: options.cooldownMs ?? 0,
    concurrencyGroup: options.concurrencyGroup ?? 'default',
    maxConcurrent: options.maxConcurrent ?? 4,
    nodeCount: options.nodeCount ?? nodes.length,
    meaning: options.meaning ?? { kind: 'decorative' },
    create: (_context, reservation) => {
      options.create?.(reservation);
      return { source, sources, output, nodes, reservation };
    },
  };
}

async function createAudioLabTrace(): Promise<AudioLabSample[]> {
  const first = new FakeContext();
  const second = new FakeContext();
  const factory = contextFactory([first, second]);
  const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
  const samples: AudioLabSample[] = [captureAudioLabSample('pre-activation', runtime)];

  await runtime.activate();
  expect(runtime.playVoice(request(new FakeSource('lab-creature-1'), {
    category: 'creature',
    concurrencyGroup: 'lab-creature',
  })).kind).toBe('started');
  expect(runtime.putCached('lab-cache-1', 'first')).toBe(true);
  samples.push(captureAudioLabSample('running-loaded', runtime));

  await runtime.setHidden(true);
  samples.push(captureAudioLabSample('hidden-clean', runtime));
  await runtime.setHidden(false);
  await runtime.activate();
  expect(runtime.playVoice(request(new FakeSource('lab-creature-2'), {
    category: 'creature',
    concurrencyGroup: 'lab-creature',
  })).kind).toBe('started');
  expect(runtime.putCached('lab-cache-2', 'second')).toBe(true);
  samples.push(captureAudioLabSample('restart-loaded', runtime));

  await runtime.dispose();
  samples.push(captureAudioLabSample('disposed-clean', runtime));
  return samples;
}

function counterpart(
  counterpartKey: string,
  eventKey = 'event:creature:selected',
  generation = 1,
): AudioCounterpartReceipt {
  return Object.freeze({ counterpartKey, eventKey, generation });
}

describe('Arc 7 injected audio runtime', () => {
  it('rejects creature and node policies above the absolute Gate G caps before context creation', () => {
    let contextCalls = 0;
    const createContext = (): AudioContextLike => {
      contextCalls++;
      return new FakeContext();
    };

    const exact = createAudioRuntime({
      createContext,
      nowMs: () => 0,
      budgets: { maxCreatureEmitters: 8, maxNodes: 120 },
    });
    expect(exact.diagnostics()).toMatchObject({
      creatureEmitters: { budget: 8 },
      nodes: { budget: 120 },
    });
    expect(contextCalls).toBe(0);

    expect(() => createAudioRuntime({
      createContext,
      nowMs: () => 0,
      budgets: { maxCreatureEmitters: 9, maxNodes: 120 },
    })).toThrow(/creature-emitter budget/u);
    expect(contextCalls).toBe(0);

    expect(() => createAudioRuntime({
      createContext,
      nowMs: () => 0,
      budgets: { maxCreatureEmitters: 8, maxNodes: 121 },
    })).toThrow(/node budget/u);
    expect(contextCalls).toBe(0);

    expect(() => createAudioRuntime({
      createContext,
      nowMs: () => 0,
      budgets: { maxCreatureEmitters: 9, maxNodes: 15 },
    })).toThrow(/creature-emitter budget/u);
    expect(() => createAudioRuntime({
      createContext,
      nowMs: () => 0,
      budgets: { maxCreatureEmitters: 1, maxNodes: 14 },
    })).toThrow(/node budget/u);
    expect(contextCalls).toBe(0);
  });

  it('mutes before creation, builds the complete limited mixer, routes real categories, and meters peaks', async () => {
    const context = new FakeContext();
    const factory = contextFactory([context]);
    const runtime = createAudioRuntime({
      createContext: factory.create,
      nowMs: () => 100,
      initialMuted: true,
      categoryGains: { music: 0.4 },
    });

    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', contextState: null, nodes: { active: 0 }, muted: true,
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'blocked', reason: 'muted' });
    expect(factory.created()).toBe(0);

    await runtime.setMuted(false);
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(factory.created()).toBe(1);
    expect(context.gains).toHaveLength(6); // master + five category buses
    expect(context.analysers).toHaveLength(6); // master + five category meters
    expect(context.limiters).toHaveLength(1);
    expect(context.gains[0]!.connections).toEqual([context.analysers[0]]);
    expect(context.analysers[0]!.connections).toEqual([context.limiters[0]]);
    expect(context.limiters[0]!.connections).toEqual([context.destination]);
    expect(context.limiters[0]!.threshold.value).toBe(-1);
    expect(context.limiters[0]!.ratio.value).toBe(20);
    for (let index = 0; index < AUDIO_CATEGORIES.length; index++) {
      const bus = context.gains[index + 1]!;
      const meter = context.analysers[index + 1]!;
      expect(bus.connections, AUDIO_CATEGORIES[index]).toEqual([meter]);
      expect(meter.connections, AUDIO_CATEGORIES[index]).toEqual([context.gains[0]]);
    }
    expect(context.gains[1]!.gain.value).toBe(0.4);

    runtime.setCategoryGain('ui', 0.25);
    expect(context.gains[5]!.gain.value).toBe(0.25);
    const source = new FakeSource('ui-confirm');
    expect(runtime.playVoice(request(source, { category: 'ui' }))).toEqual({
      kind: 'started', voiceId: 'voice-000001',
    });
    const perVoiceGain = context.gains[6]!;
    expect(source.connections).toEqual([perVoiceGain]);
    expect(perVoiceGain.connections).toEqual([context.gains[5]]);
    expect(source.startCalls).toBe(1);

    context.analysers[0]!.samples = [0, -0.6, 0.2];
    context.analysers[5]!.samples = [0.8, -0.1];
    const diagnostics = runtime.diagnostics();
    expect(diagnostics.nodes).toEqual({ active: 15, peak: 15, budget: 96 });
    expect(diagnostics.voices).toMatchObject({ active: 1, peak: 1, started: 1 });
    expect(diagnostics.peaks.master).toBeCloseTo(0.6);
    expect(diagnostics.peaks.ui).toBeCloseTo(0.8);

    const muting = runtime.setMuted(true);
    const repeatedDuringClose = runtime.setMuted(true);
    expect(repeatedDuringClose).not.toBe(muting);
    await expect(repeatedDuringClose).resolves.toBeUndefined();
    expect(source.stopCalls).toBe(1);
    expect(source.disconnectCalls).toBe(1);
    expect(perVoiceGain.disconnectCalls).toBe(1);
    expect(context.gains[0]!.gain.value).toBe(0);
    expect(runtime.playVoice(request(new FakeSource('muted')))).toEqual({ kind: 'rejected', reason: 'muted' });
    await muting;
    expect(context.closeCalls).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', contextState: null, nodes: { active: 0 }, voices: { active: 0 },
    });
  });

  it('preserves exact master and category gains before activation, through mute, and across context recovery', async () => {
    const first = new FakeContext();
    const second = new FakeContext();
    const third = new FakeContext();
    const factory = contextFactory([first, second, third]);
    const runtime = createAudioRuntime({
      createContext: factory.create,
      nowMs: () => 0,
      initialMuted: true,
      initialMasterGain: 0.37,
      categoryGains: { music: 0.41 },
    });

    expect(runtime.diagnostics().gains).toEqual({
      master: 0.37,
      effectiveMaster: 0,
      categories: {
        music: 0.41,
        ambience: 1,
        creature: 1,
        'combat-gameplay': 1,
        ui: 1,
      },
    });
    runtime.setMasterGain(0.29);
    runtime.setCategoryGain('ui', 0.17);
    await expect(runtime.activate()).resolves.toEqual({ kind: 'blocked', reason: 'muted' });
    expect(factory.created()).toBe(0);
    expect(runtime.diagnostics().gains).toMatchObject({ master: 0.29, effectiveMaster: 0 });

    await runtime.setMuted(false);
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(first.gains[0]!.gain.value).toBe(0.29);
    expect(first.gains[5]!.gain.value).toBe(0.17);
    expect(runtime.diagnostics().gains).toMatchObject({ master: 0.29, effectiveMaster: 0.29 });

    runtime.setMasterGain(0.23);
    expect(first.gains[0]!.gain.value).toBe(0.23);
    const muting = runtime.setMuted(true);
    expect(first.gains[0]!.gain.value).toBe(0);
    runtime.setMasterGain(0.19);
    expect(first.gains[0]!.gain.value).toBe(0);
    expect(runtime.diagnostics().gains).toMatchObject({ master: 0.19, effectiveMaster: 0 });
    await muting;
    expect(first.closeCalls).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({ contextState: null, nodes: { active: 0 } });

    await runtime.setMuted(false);
    expect(factory.created()).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({ state: 'blocked', contextState: null });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(second.gains[0]!.gain.value).toBe(0.19);
    expect(second.gains[1]!.gain.value).toBe(0.41);
    expect(second.gains[5]!.gain.value).toBe(0.17);

    second.forceState('closed');
    expect(runtime.diagnostics()).toMatchObject({ contextState: null, nodes: { active: 0 } });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(third.gains[0]!.gain.value).toBe(0.19);
    expect(third.gains[1]!.gain.value).toBe(0.41);
    expect(third.gains[5]!.gain.value).toBe(0.17);
    expect(runtime.diagnostics().gains).toEqual({
      master: 0.19,
      effectiveMaster: 0.19,
      categories: {
        music: 0.41,
        ambience: 1,
        creature: 1,
        'combat-gameplay': 1,
        ui: 0.17,
      },
    });

    await runtime.dispose();
    expect(runtime.diagnostics().gains).toMatchObject({ master: 0.19, effectiveMaster: 0.19 });
  });

  it('keeps the original close obligation when unmute wins in the same turn', async () => {
    const first = new DeferredContext();
    const second = new FakeContext();
    const factory = contextFactory([first, second]);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    await runtime.activate();
    const source = new FakeSource('same-turn-mute-voice');
    expect(runtime.playVoice(request(source)).kind).toBe('started');
    first.deferClose();

    let muteSettled = false;
    const muting = runtime.setMuted(true);
    void muting.then(() => { muteSettled = true; });
    const unmuting = runtime.setMuted(false);
    expect(source.stopCalls).toBe(1);
    expect(first.gains[0]!.gain.value).toBe(0);
    expect(first.closeCalls).toBe(1);
    expect(factory.created()).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', muted: false, contextState: null,
      nodes: { active: 0 }, voices: { active: 0 },
    });
    await Promise.resolve();
    expect(muteSettled).toBe(false);
    await unmuting;
    expect(factory.created()).toBe(1);

    first.releaseClose();
    await muting;
    expect(muteSettled).toBe(true);
    expect(first.state).toBe('closed');
    expect(factory.created()).toBe(1);
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(factory.created()).toBe(2);
  });

  it('shares the outer mute settlement with source-stop reentrancy', async () => {
    const context = new DeferredContext();
    context.deferClose();
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 0 });
    await runtime.activate();
    const source = new FakeSource('reentrant-mute-voice');
    const originalStop = source.stop.bind(source);
    let nested: Promise<void> | null = null;
    source.stop = () => {
      nested = runtime.setMuted(true);
      originalStop();
    };
    expect(runtime.playVoice(request(source)).kind).toBe('started');

    const outer = runtime.setMuted(true);
    expect(nested).toBe(outer);
    let nestedSettled = false;
    void nested!.then(() => { nestedSettled = true; });
    await Promise.resolve();
    expect(nestedSettled).toBe(false);
    expect(context.closeCalls).toBe(1);
    context.releaseClose();
    await outer;
    expect(nestedSettled).toBe(true);
  });

  it('detaches the closing graph before source-stop reentrant unmute and activation', async () => {
    const first = new FakeContext();
    const second = new FakeContext();
    const factory = contextFactory([first, second]);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    await runtime.activate();
    const source = new FakeSource('source-stop-reactivation');
    const originalStop = source.stop.bind(source);
    let nestedActivation: Promise<unknown> | null = null;
    source.stop = () => {
      void runtime.setMuted(false);
      nestedActivation = runtime.activate();
      originalStop();
    };
    expect(runtime.playVoice(request(source)).kind).toBe('started');

    await runtime.setMuted(true);
    expect(nestedActivation).not.toBeNull();
    await expect(nestedActivation!).resolves.toEqual({ kind: 'running' });
    expect(first.closeCalls).toBe(1);
    expect(first.state).toBe('closed');
    expect(second.closeCalls).toBe(0);
    expect(factory.created()).toBe(2);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'running', muted: false, contextState: 'running', contextGeneration: 2,
      nodes: { active: 13 }, voices: { active: 0 },
    });
  });

  it('retries a retained silent teardown before activation can allocate a replacement', async () => {
    const first = new RetryCloseContext(1);
    const second = new FakeContext();
    const factory = contextFactory([first, second]);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    await runtime.activate();

    await expect(runtime.setMuted(true)).resolves.toBeUndefined();
    expect(first.closeCalls).toBe(1);
    expect(first.state).toBe('running');
    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', contextState: null, nodes: { active: 0 }, faults: { total: 1 },
    });
    await runtime.setMuted(false);
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(factory.created()).toBe(2);
    expect(first.closeCalls).toBe(2);
    expect(first.state).toBe('closed');
    expect(runtime.diagnostics()).toMatchObject({ state: 'running', contextState: 'running' });

    await expect(runtime.setMuted(true)).resolves.toBeUndefined();
    expect(first.closeCalls).toBe(2);
    expect(second.closeCalls).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', contextState: null, nodes: { active: 0 }, faults: { total: 1 },
    });
    expect(factory.created()).toBe(2);
  });

  it('fails closed on permanent close refusal without growing contexts or retained teardown owners', async () => {
    const contexts = Array.from({ length: 6 }, () => new PermanentCloseContext());
    const factory = contextFactory(contexts);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });

    for (let cycle = 0; cycle < 5; cycle++) {
      await expect(runtime.setMuted(true)).resolves.toBeUndefined();
      await runtime.setMuted(false);
      await expect(runtime.activate()).resolves.toEqual({
        kind: 'blocked', reason: 'context-unavailable',
      });
      expect(factory.created(), `factory cycle ${cycle}`).toBe(1);
      expect(runtime.playVoice(request(new FakeSource(`permanent-${cycle}`)))).toEqual({
        kind: 'rejected', reason: 'not-running',
      });
    }

    const internals = runtime as unknown as {
      failedTeardownContexts: Set<AudioContextLike>;
      pendingActivations: Set<unknown>;
    };
    expect(internals.failedTeardownContexts.size).toBe(1);
    expect(internals.pendingActivations.size).toBe(0);
    expect(contexts[0]!.closeCalls).toBe(10);
    expect(contexts[0]!.state).toBe('running');
    expect(contexts.slice(1).every((context) => context.closeCalls === 0)).toBe(true);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', contextState: null, contextGeneration: 1,
      nodes: { active: 0 }, faults: { total: 10 },
    });
  });

  it('fails closed before the factory while any physical context close is unresolved', async () => {
    const contexts = Array.from({ length: 5 }, () => new NeverCloseContext());
    const factory = contextFactory(contexts);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    void runtime.setMuted(true);
    expect(contexts[0]!.closeCalls).toBe(1);

    for (let cycle = 0; cycle < 5; cycle++) {
      await runtime.setMuted(false);
      await expect(runtime.activate()).resolves.toEqual({
        kind: 'blocked', reason: 'context-unavailable',
      });
      expect(factory.created(), `factory cycle ${cycle}`).toBe(1);
      await expect(runtime.setMuted(true)).resolves.toBeUndefined();
    }

    const internals = runtime as unknown as {
      closeSettlements: Map<AudioContextLike, Promise<void>>;
      failedTeardownContexts: Set<AudioContextLike>;
      pendingActivations: Set<unknown>;
    };
    expect(internals.closeSettlements.size).toBe(1);
    expect(internals.failedTeardownContexts.size).toBe(0);
    expect(internals.pendingActivations.size).toBe(0);
    expect(contexts[0]!.state).toBe('running');
    expect(contexts.slice(1).every((context) => context.closeCalls === 0)).toBe(true);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', muted: true, contextState: null, contextGeneration: 1,
      nodes: { active: 0 }, faults: { total: 0 },
    });
  });

  it('cancels activation waiting on a retained close retry when disposal wins', async () => {
    const context = new RejectThenNeverCloseContext();
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 0 });
    await runtime.activate();
    await expect(runtime.setMuted(true)).resolves.toBeUndefined();
    expect(context.closeCalls).toBe(1);
    await runtime.setMuted(false);

    const activation = runtime.activate();
    expect(context.closeCalls).toBe(2);
    await expect(runtime.dispose()).resolves.toBeUndefined();
    await expect(activation).resolves.toEqual({ kind: 'disposed' });
    const internals = runtime as unknown as {
      closeSettlements: Map<AudioContextLike, Promise<void>>;
      failedTeardownContexts: Set<AudioContextLike>;
      pendingActivations: Set<unknown>;
    };
    expect(internals.pendingActivations.size).toBe(0);
    expect(internals.closeSettlements.size).toBe(1);
    expect(internals.failedTeardownContexts.size).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'disposed', contextState: null, contextGeneration: 1,
      nodes: { active: 0 }, faults: { total: 1 },
    });
  });

  it('returns immediate mute results throughout an unresolved close instead of self-awaiting', async () => {
    const context = new ReentrantCloseContext();
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 0 });
    await runtime.activate();
    let nested: Promise<void> | null = null;
    context.closeHook = () => {
      nested = runtime.setMuted(true);
      return nested;
    };

    const outer = runtime.setMuted(true);
    const externalRepeat = runtime.setMuted(true);
    expect(nested).not.toBeNull();
    expect(nested).not.toBe(outer);
    expect(externalRepeat).not.toBe(outer);
    let nestedSettled = false;
    void nested!.then(() => { nestedSettled = true; });
    await Promise.resolve();
    expect(nestedSettled).toBe(true);
    await expect(externalRepeat).resolves.toBeUndefined();
    await outer;
    expect(context.closeCalls).toBe(1);
    expect(context.state).toBe('closed');
    expect(runtime.diagnostics().faults.total).toBe(0);
  });

  it('keeps synchronous and asynchronous close callbacks from cycling through mute or dispose', async () => {
    const outerKinds = ['mute', 'dispose'] as const;
    const nestedKinds = ['mute', 'dispose'] as const;
    const timings = ['sync', 'async'] as const;

    for (const outerKind of outerKinds) {
      for (const nestedKind of nestedKinds) {
        for (const timing of timings) {
          const context = new ReentrantCloseContext();
          const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 0 });
          await runtime.activate();
          let nested: Promise<void> | null = null;
          context.closeHook = async () => {
            if (timing === 'async') await Promise.resolve();
            nested = nestedKind === 'mute' ? runtime.setMuted(true) : runtime.dispose();
            await nested;
          };

          const outer = outerKind === 'mute' ? runtime.setMuted(true) : runtime.dispose();
          await Promise.resolve();
          await Promise.resolve();
          expect(nested, `${outerKind}/${nestedKind}/${timing}`).not.toBeNull();
          expect(nested, `${outerKind}/${nestedKind}/${timing}`).not.toBe(outer);
          await expect(nested!).resolves.toBeUndefined();
          await expect(outer).resolves.toBeUndefined();
          expect(context.closeCalls, `${outerKind}/${nestedKind}/${timing}`).toBe(1);
          expect(context.state, `${outerKind}/${nestedKind}/${timing}`).toBe('closed');
          expect(runtime.diagnostics()).toMatchObject({
            state: outerKind === 'dispose' || nestedKind === 'dispose' ? 'disposed' : 'blocked',
            contextState: null,
            nodes: { active: 0 },
            faults: { total: 0 },
          });
        }
      }
    }
  });

  it('snapshots hostile option, request, meaning, and graph fields exactly once', async () => {
    const context = new FakeContext();
    const optionReads = new Map<PropertyKey, number>();
    const options = new Proxy({
      createContext: () => context,
      nowMs: () => 0,
      initialMuted: false,
      initialMasterGain: 0.5,
      categoryGains: { creature: 0.25 },
      budgets: { maxCreatureEmitters: 8 },
      verifyCounterpart: (_receipt: AudioCounterpartReceipt) => true,
    }, {
      get(target, key, receiver) {
        optionReads.set(key, (optionReads.get(key) ?? 0) + 1);
        return Reflect.get(target, key, receiver);
      },
    });
    const runtime = createAudioRuntime(options);
    expect([...optionReads.entries()]).toEqual([
      ['createContext', 1], ['nowMs', 1], ['verifyCounterpart', 1], ['budgets', 1],
      ['initialMuted', 1], ['initialMasterGain', 1], ['categoryGains', 1],
    ]);
    await runtime.activate();

    const source = new FakeSource('read-once-source');
    const meaningReads = new Map<PropertyKey, number>();
    const meaning = new Proxy({
      kind: 'meaningful' as const,
      counterpart: counterpart('caption:read-once', 'event:read-once'),
    }, {
      get(target, key, receiver) {
        meaningReads.set(key, (meaningReads.get(key) ?? 0) + 1);
        return Reflect.get(target, key, receiver);
      },
    });
    const requestReads = new Map<PropertyKey, number>();
    const graphReads = new Map<PropertyKey, number>();
    const requestTarget: AudioVoiceRequest = {
      ...request(source, { meaning }),
      create: (_context, reservation) => new Proxy({
        source,
        sources: [source],
        output: source,
        nodes: [source],
        reservation,
      }, {
        get(target, key, receiver) {
          graphReads.set(key, (graphReads.get(key) ?? 0) + 1);
          return Reflect.get(target, key, receiver);
        },
      }),
    };
    const requestValue = new Proxy(requestTarget, {
      get(target, key, receiver) {
        requestReads.set(key, (requestReads.get(key) ?? 0) + 1);
        return Reflect.get(target, key, receiver);
      },
    });

    expect(runtime.playVoice(requestValue)).toEqual({ kind: 'started', voiceId: 'voice-000001' });
    expect([...requestReads.entries()]).toEqual([
      ['key', 1], ['category', 1], ['priority', 1], ['cooldownGroup', 1],
      ['cooldownMs', 1], ['concurrencyGroup', 1], ['maxConcurrent', 1],
      ['nodeCount', 1], ['meaning', 1], ['create', 1],
    ]);
    expect([...meaningReads.entries()]).toEqual([['kind', 1], ['counterpart', 1]]);
    expect([...graphReads.entries()]).toEqual([
      ['source', 1], ['sources', 1], ['output', 1], ['nodes', 1], ['reservation', 1],
    ]);
    source.finish();
    expect(runtime.diagnostics().voices).toMatchObject({ active: 0, completed: 1 });

    let requestFactoryCalls = 0;
    const throwingRequest = new Proxy(request(new FakeSource('throwing-request'), {
      create: () => { requestFactoryCalls++; },
    }), {
      get(target, key, receiver) {
        if (key === 'meaning') throw new Error('hostile request getter');
        return Reflect.get(target, key, receiver);
      },
    });
    expect(runtime.playVoice(throwingRequest)).toEqual({ kind: 'rejected', reason: 'invalid-request' });
    expect(requestFactoryCalls).toBe(0);

    const throwingGraphSource = new FakeSource('throwing-graph');
    expect(runtime.playVoice({
      ...request(throwingGraphSource),
      create: (_context, reservation) => new Proxy({
        source: throwingGraphSource,
        sources: [throwingGraphSource],
        output: throwingGraphSource,
        nodes: [throwingGraphSource],
        reservation,
      }, {
        get(target, key, receiver) {
          if (key === 'nodes') throw new Error('hostile graph getter');
          return Reflect.get(target, key, receiver);
        },
      }),
    })).toEqual({ kind: 'fault', reason: 'voice-create' });
    expect(throwingGraphSource.startCalls).toBe(0);
    expect(throwingGraphSource.disconnectCalls).toBe(0);

    const incumbent = new FakeSource('protected-incumbent');
    expect(runtime.playVoice(request(incumbent, {
      concurrencyGroup: 'protected-incumbent',
    }))).toEqual({ kind: 'started', voiceId: 'voice-000002' });
    const disposable = new FakeSource('disposable-invalid-node');
    expect(runtime.playVoice(request(disposable, {
      concurrencyGroup: 'protected-invalid',
      nodes: [incumbent, disposable],
      sources: [incumbent, disposable],
      nodeCount: 2,
    }))).toEqual({ kind: 'fault', reason: 'voice-create' });
    expect(incumbent.stopCalls).toBe(0);
    expect(incumbent.disconnectCalls).toBe(0);
    expect(disposable.disconnectCalls).toBe(1);
    expect(runtime.diagnostics().voices.ids).toEqual(['voice-000002']);

    const handlerRefusal = new FakeSource('handler-refusal');
    let handler: (() => void) | null = null;
    Object.defineProperty(handlerRefusal, 'onended', {
      configurable: true,
      enumerable: true,
      get: () => handler,
      set: (value: (() => void) | null) => {
        if (value !== null) throw new Error('hostile onended setter');
        handler = value;
      },
    });
    expect(runtime.playVoice(request(handlerRefusal, {
      concurrencyGroup: 'handler-refusal',
    }))).toEqual({ kind: 'fault', reason: 'voice-start' });
    expect(handlerRefusal.startCalls).toBe(0);
    expect(handlerRefusal.stopCalls).toBe(0);
    expect(handlerRefusal.disconnectCalls).toBe(1);
    expect(runtime.diagnostics().reservations).toMatchObject({
      voices: { active: 0 }, nodes: { active: 0 },
    });
  });

  it('reports blocked/suspended/running explicitly and retries a failed resume on the same context', async () => {
    const context = new FakeContext('suspended', ['reject', 'running', 'running']);
    const factory = contextFactory([context]);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });

    await expect(runtime.activate()).resolves.toEqual({ kind: 'blocked', reason: 'resume-failed' });
    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', contextState: 'suspended', nodes: { active: 13 },
      faults: { total: 1 },
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(factory.created()).toBe(1);
    expect(context.resumeCalls).toBe(2);

    context.forceState('suspended');
    expect(runtime.diagnostics().state).toBe('suspended');
    expect(runtime.playVoice(request(new FakeSource('suspended')))).toEqual({
      kind: 'rejected', reason: 'not-running',
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(context.resumeCalls).toBe(3);
  });

  it('does not report running when mute wins a deferred activation race', async () => {
    const first = new DeferredContext('suspended');
    const second = new FakeContext();
    first.deferResume();
    first.deferClose();
    const factory = contextFactory([first, second]);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    const activation = runtime.activate();
    const muting = runtime.setMuted(true);
    await Promise.resolve();
    expect(first.closeCalls).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', muted: true, contextState: null, nodes: { active: 0 },
    });
    await expect(activation).resolves.toEqual({ kind: 'blocked', reason: 'muted' });

    await runtime.setMuted(false);
    expect(factory.created()).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({ state: 'blocked', contextState: null });
    await expect(runtime.activate()).resolves.toEqual({
      kind: 'blocked', reason: 'context-unavailable',
    });
    expect(factory.created()).toBe(1);
    first.releaseClose();
    await muting;
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(factory.created()).toBe(2);
    first.releaseResume();
    await Promise.resolve();
    expect(runtime.diagnostics()).toMatchObject({
      state: 'running', muted: false, contextState: 'running', contextGeneration: 2,
    });
  });

  it('cancels never-settling resumes on mute and dispose without retaining activation records', async () => {
    const contexts = Array.from({ length: 5 }, () => new NeverResumeContext('suspended'));
    const factory = contextFactory(contexts);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    const internals = runtime as unknown as { pendingActivations: Set<unknown> };

    for (let cycle = 0; cycle < 4; cycle++) {
      const activation = runtime.activate();
      expect(contexts[cycle]!.resumeCalls).toBe(1);
      await expect(runtime.setMuted(true)).resolves.toBeUndefined();
      await expect(activation).resolves.toEqual({ kind: 'blocked', reason: 'muted' });
      expect(contexts[cycle]!.closeCalls).toBe(1);
      expect(contexts[cycle]!.state).toBe('closed');
      expect(internals.pendingActivations.size).toBe(0);
      await runtime.setMuted(false);
    }

    const finalActivation = runtime.activate();
    expect(contexts[4]!.resumeCalls).toBe(1);
    await expect(runtime.dispose()).resolves.toBeUndefined();
    await expect(finalActivation).resolves.toEqual({ kind: 'disposed' });
    expect(contexts[4]!.closeCalls).toBe(1);
    expect(contexts[4]!.state).toBe('closed');
    expect(internals.pendingActivations.size).toBe(0);
    expect(factory.created()).toBe(5);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'disposed', contextState: null, contextGeneration: 5,
      nodes: { active: 0 }, faults: { total: 0 },
    });
  });

  it('observes a resume rejection before honoring synchronous mute cancellation', async () => {
    const context = new ReentrantRejectResumeContext('suspended');
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 0 });
    let muting: Promise<void> | null = null;
    context.resumeHook = () => { muting = runtime.setMuted(true); };
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown): void => { unhandled.push(reason); };
    process.on('unhandledRejection', onUnhandled);
    try {
      await expect(runtime.activate()).resolves.toEqual({ kind: 'blocked', reason: 'muted' });
      await expect(muting!).resolves.toBeUndefined();
      await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
      expect(unhandled).toEqual([]);
      expect(context.closeCalls).toBe(1);
      expect(runtime.diagnostics()).toMatchObject({
        state: 'blocked', muted: true, contextState: null,
        nodes: { active: 0 }, faults: { total: 0 },
      });
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('shuts down while hidden, requires an explicit restart, and recreates after context loss', async () => {
    const first = new FakeContext();
    const second = new FakeContext();
    const third = new FakeContext();
    const factory = contextFactory([first, second, third]);
    const released: string[] = [];
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 10 });
    await runtime.activate();

    const hiddenVoice = new FakeSource('hidden-voice');
    const hiddenStart = runtime.playVoice(request(hiddenVoice));
    expect(hiddenStart.kind).toBe('started');
    runtime.putCached('buffer:hidden', 'hidden', (value) => { released.push(value); });
    await runtime.setHidden(true);
    expect(first.closeCalls).toBe(1);
    expect(hiddenVoice.stopCalls).toBe(1);
    expect(hiddenVoice.disconnectCalls).toBe(1);
    expect([...first.gains, ...first.analysers, ...first.limiters]
      .every((node) => node.disconnectCalls === 1)).toBe(true);
    expect(released).toEqual(['hidden']);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'suspended', contextState: null, nodes: { active: 0 }, cache: { active: 0 },
    });

    await runtime.setHidden(false);
    expect(factory.created()).toBe(1);
    expect(runtime.playVoice(request(new FakeSource('before-restart')))).toEqual({
      kind: 'rejected', reason: 'not-running',
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(factory.created()).toBe(2);

    const lostVoice = new FakeSource('lost-voice');
    expect(runtime.playVoice(request(lostVoice)).kind).toBe('started');
    runtime.putCached('buffer:lost', 'lost', (value) => { released.push(value); });
    second.forceState('closed');
    expect(lostVoice.stopCalls).toBe(1);
    expect(lostVoice.disconnectCalls).toBe(1);
    expect(released).toEqual(['hidden', 'lost']);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'suspended', contextState: null, contextGeneration: 2,
      nodes: { active: 0 }, faults: { total: 1 },
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(factory.created()).toBe(3);
    expect(runtime.diagnostics().contextGeneration).toBe(3);
  });

  it('fences a stale activation when visibility returns and lets the next gesture reactivate', async () => {
    const first = new DeferredContext('suspended');
    const second = new FakeContext();
    first.deferResume();
    const factory = contextFactory([first, second]);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });

    const activation = runtime.activate();
    const hiding = runtime.setHidden(true);
    await runtime.setHidden(false);
    first.releaseResume();

    await expect(activation).resolves.toEqual({ kind: 'blocked', reason: 'context-unavailable' });
    await hiding;
    expect(first.closeCalls).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', hidden: false, contextState: null, contextGeneration: 1,
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(factory.created()).toBe(2);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'running', hidden: false, contextState: 'running', contextGeneration: 2,
    });
  });

  it('does not allocate a replacement until a deferred mute close settles', async () => {
    const first = new DeferredContext();
    const second = new FakeContext();
    const factory = contextFactory([first, second]);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    await runtime.activate();
    first.deferClose();

    const muting = runtime.setMuted(true);
    await Promise.resolve();
    expect(first.closeCalls).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'blocked', muted: true, contextState: null, nodes: { active: 0 },
    });
    await runtime.setMuted(false);
    await expect(runtime.activate()).resolves.toEqual({
      kind: 'blocked', reason: 'context-unavailable',
    });
    expect(factory.created()).toBe(1);

    first.releaseClose();
    await muting;
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(factory.created()).toBe(2);
    expect(second.closeCalls).toBe(0);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'running', muted: false, contextState: 'running', contextGeneration: 2,
    });
  });

  it('makes disposal terminal while a deferred mute close blocks replacement allocation', async () => {
    const first = new DeferredContext();
    const second = new FakeContext();
    const factory = contextFactory([first, second]);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    await runtime.activate();
    first.deferClose();

    const muting = runtime.setMuted(true);
    await Promise.resolve();
    await runtime.setMuted(false);
    await expect(runtime.activate()).resolves.toEqual({
      kind: 'blocked', reason: 'context-unavailable',
    });
    expect(factory.created()).toBe(1);
    const disposing = runtime.dispose();
    await Promise.resolve();
    expect(second.closeCalls).toBe(0);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'disposed', contextState: null, nodes: { active: 0 },
    });

    first.releaseClose();
    await Promise.all([muting, disposing]);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'disposed', contextState: null, nodes: { active: 0 },
    });
  });

  it('blocks replacement during a deferred hide close and never resurrects disposal', async () => {
    const first = new DeferredContext();
    const second = new FakeContext();
    const factory = contextFactory([first, second]);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    await runtime.activate();
    first.deferClose();

    const hiding = runtime.setHidden(true);
    expect(first.closeCalls).toBe(1);
    await runtime.setHidden(false);
    await expect(runtime.activate()).resolves.toEqual({
      kind: 'blocked', reason: 'context-unavailable',
    });
    expect(factory.created()).toBe(1);

    first.releaseClose();
    await hiding;
    await expect(runtime.activate()).resolves.toEqual({ kind: 'running' });
    expect(runtime.diagnostics()).toMatchObject({ state: 'running', contextGeneration: 2 });
    await runtime.dispose();
    expect(second.closeCalls).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'disposed', hidden: false, contextState: null, nodes: { active: 0 },
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'disposed' });
  });

  it('does not settle reentrant factory disposal before its unpublished context closes', async () => {
    const context = new DeferredContext();
    context.deferClose();
    let runtime!: ReturnType<typeof createAudioRuntime>;
    let reentrantDisposal: Promise<void> | null = null;
    runtime = createAudioRuntime({
      createContext: () => {
        reentrantDisposal = runtime.dispose();
        return context;
      },
      nowMs: () => 0,
    });

    const activation = runtime.activate();
    expect(reentrantDisposal).not.toBeNull();
    const repeatedDuringClose = runtime.dispose();
    expect(repeatedDuringClose).not.toBe(reentrantDisposal);
    await expect(repeatedDuringClose).resolves.toBeUndefined();
    expect(context.closeCalls).toBe(1);
    expect(context.state).toBe('running');
    let disposalSettled = false;
    void reentrantDisposal!.then(() => { disposalSettled = true; });
    await Promise.resolve();
    expect(disposalSettled).toBe(false);

    context.releaseClose();
    await expect(activation).resolves.toEqual({ kind: 'disposed' });
    await reentrantDisposal;
    expect(disposalSettled).toBe(true);
    expect(context.state).toBe('closed');
    expect(runtime.diagnostics()).toMatchObject({
      state: 'disposed', contextState: null, nodes: { active: 0 },
    });
  });

  it('fault-contains a failed disposal close and retries it on later disposal', async () => {
    const context = new RetryCloseContext(1);
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 0 });
    await runtime.activate();

    await expect(runtime.dispose()).resolves.toBeUndefined();
    expect(context.closeCalls).toBe(1);
    expect(context.state).toBe('running');
    expect(runtime.diagnostics()).toMatchObject({
      state: 'disposed', contextState: null, nodes: { active: 0 }, faults: { total: 1 },
    });
    await expect(runtime.dispose()).resolves.toBeUndefined();
    expect(context.closeCalls).toBe(2);
    expect(context.state).toBe('closed');
    expect(runtime.diagnostics().faults.total).toBe(1);
  });

  it('disposes idempotently with exact voice, cache, graph, and context ownership', async () => {
    const context = new FakeContext();
    const factory = contextFactory([context]);
    const released: string[] = [];
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    await runtime.activate();
    const source = new FakeSource('dispose-voice');
    const started = runtime.playVoice(request(source));
    expect(started.kind).toBe('started');
    runtime.putCached('buffer:dispose', 'owned', (value) => { released.push(value); });

    await runtime.dispose();
    await runtime.dispose();
    expect(source.stopCalls).toBe(1);
    expect(source.disconnectCalls).toBe(1);
    expect(context.gains[6]!.disconnectCalls).toBe(1);
    expect(context.gains.slice(0, 6).every((node) => node.disconnectCalls === 1)).toBe(true);
    expect(context.closeCalls).toBe(1);
    expect(released).toEqual(['owned']);
    expect(runtime.diagnostics()).toMatchObject({
      state: 'disposed', contextState: null, nodes: { active: 0 }, voices: { active: 0 },
    });
    await expect(runtime.activate()).resolves.toEqual({ kind: 'disposed' });
    expect(runtime.playVoice(request(new FakeSource('after-dispose')))).toEqual({
      kind: 'rejected', reason: 'disposed',
    });
    expect(runtime.putCached('buffer:after-dispose', 'caller-owned')).toBe(false);
  });

  it('applies deterministic concurrency priority, stealing, natural completion, and exact disconnects', async () => {
    const context = new FakeContext();
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 100 });
    await runtime.activate();
    const first = new FakeSource('first');
    const firstFilter = new FakeNode('first-filter');
    first.connect(firstFilter);
    const second = new FakeSource('second');
    const firstResult = runtime.playVoice(request(first, {
      priority: 1, concurrencyGroup: 'creatures', maxConcurrent: 2,
      output: firstFilter, nodes: [first, firstFilter],
    }));
    const secondResult = runtime.playVoice(request(second, {
      priority: 2, concurrencyGroup: 'creatures', maxConcurrent: 2,
    }));
    expect(firstResult.kind).toBe('started');
    expect(secondResult.kind).toBe('started');

    let rejectedFactoryCalls = 0;
    const rejected = new FakeSource('rejected-equal-priority');
    expect(runtime.playVoice(request(rejected, {
      priority: 1, concurrencyGroup: 'creatures', maxConcurrent: 2,
      create: () => { rejectedFactoryCalls++; },
    }))).toEqual({ kind: 'rejected', reason: 'concurrency' });
    expect(rejectedFactoryCalls).toBe(0);

    const winner = new FakeSource('winner');
    const winnerResult = runtime.playVoice(request(winner, {
      priority: 3, concurrencyGroup: 'creatures', maxConcurrent: 2,
    }));
    expect(winnerResult).toEqual({ kind: 'started', voiceId: 'voice-000003' });
    expect(first.stopCalls).toBe(1);
    expect(first.disconnectCalls).toBe(1);
    expect(firstFilter.disconnectCalls).toBe(1);
    expect(context.gains[6]!.disconnectCalls).toBe(1);
    expect(second.stopCalls).toBe(0);
    expect(runtime.diagnostics().voices).toMatchObject({
      active: 2, started: 3, stolen: 1, concurrencyRejects: 1,
      ids: ['voice-000002', 'voice-000003'],
    });

    second.finish();
    expect(second.stopCalls).toBe(1);
    expect(second.disconnectCalls).toBe(1);
    expect(context.gains[7]!.disconnectCalls).toBe(1);
    expect(runtime.stopVoice('voice-000003')).toBe(true);
    expect(runtime.stopVoice('voice-000003')).toBe(false);
    expect(winner.stopCalls).toBe(1);
    expect(winner.disconnectCalls).toBe(1);
    expect(context.gains[8]!.disconnectCalls).toBe(1);
    expect(runtime.diagnostics().voices).toMatchObject({ active: 0, completed: 1, stopped: 2 });
  });

  it('reserves before construction, rejects reentrant admission, and reports transition peaks', async () => {
    const context = new FakeContext();
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 0 });
    await runtime.activate();
    let nestedResult: ReturnType<typeof runtime.playVoice> | null = null;
    let duringReservation: ReturnType<typeof runtime.diagnostics> | null = null;
    const outer = new FakeSource('reservation-outer');
    const result = runtime.playVoice(request(outer, {
      create: () => {
        duringReservation = runtime.diagnostics();
        nestedResult = runtime.playVoice(request(new FakeSource('reservation-nested')));
      },
    }));

    expect(result).toEqual({ kind: 'started', voiceId: 'voice-000001' });
    expect(nestedResult).toEqual({ kind: 'rejected', reason: 'reentrant' });
    expect(duringReservation).toMatchObject({
      nodes: { active: 13 },
      voices: { active: 0 },
      reservations: {
        voices: { active: 1, peak: 1, activePlusReservedPeak: 1 },
        nodes: { active: 2, peak: 2, activePlusReservedPeak: 15 },
      },
    });
    expect(runtime.diagnostics().reservations).toEqual({
      voices: { active: 0, peak: 1, activePlusReservedPeak: 1 },
      nodes: { active: 0, peak: 2, activePlusReservedPeak: 15 },
    });
  });

  it('owns every declared scheduled source and rejects an undeclared lifetime owner', async () => {
    const context = new FakeContext();
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 0 });
    await runtime.activate();
    const completion = new FakeSource('layered-completion');
    const lfo = new FakeSource('layered-lfo');
    const started = runtime.playVoice(request(completion, {
      nodes: [completion, lfo], sources: [lfo, completion], nodeCount: 2,
    }));
    expect(started).toEqual({ kind: 'started', voiceId: 'voice-000001' });
    expect(lfo.startCalls).toBe(1);
    expect(completion.startCalls).toBe(1);
    expect(runtime.stopVoice('voice-000001')).toBe(true);
    expect(lfo.stopCalls).toBe(1);
    expect(completion.stopCalls).toBe(1);
    expect(lfo.disconnectCalls).toBe(1);
    expect(completion.disconnectCalls).toBe(1);

    const declared = new FakeSource('declared-source');
    const undeclared = new FakeSource('undeclared-lfo');
    expect(runtime.playVoice(request(declared, {
      nodes: [declared, undeclared], sources: [declared], nodeCount: 2,
    }))).toEqual({ kind: 'fault', reason: 'voice-create' });
    expect(declared.startCalls).toBe(0);
    expect(undeclared.startCalls).toBe(0);
    expect(declared.disconnectCalls).toBe(1);
    expect(undeclared.disconnectCalls).toBe(1);

    const mismatchedReservation = new FakeSource('mismatched-reservation');
    const base = request(mismatchedReservation);
    expect(runtime.playVoice({
      ...base,
      create: (_context, reservation) => ({
        source: mismatchedReservation,
        sources: [mismatchedReservation],
        output: mismatchedReservation,
        nodes: [mismatchedReservation],
        reservation: Object.freeze({ ...reservation }),
      }),
    })).toEqual({ kind: 'fault', reason: 'voice-create' });
    expect(mismatchedReservation.startCalls).toBe(0);
    expect(mismatchedReservation.disconnectCalls).toBe(1);
  });

  it('keeps the incumbent when any replacement source fails to start', async () => {
    const context = new FakeContext();
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 0 });
    await runtime.activate();
    const incumbent = new FakeSource('incumbent');
    expect(runtime.playVoice(request(incumbent, {
      priority: 1, concurrencyGroup: 'single', maxConcurrent: 1,
    })).kind).toBe('started');

    const replacement = new FakeSource('replacement');
    const failingLayer = new FakeSource('replacement-failing-layer');
    failingLayer.throwStart = true;
    expect(runtime.playVoice(request(replacement, {
      priority: 2,
      concurrencyGroup: 'single',
      maxConcurrent: 1,
      nodes: [replacement, failingLayer],
      sources: [replacement, failingLayer],
      nodeCount: 2,
    }))).toEqual({ kind: 'fault', reason: 'voice-start' });
    expect(incumbent.stopCalls).toBe(0);
    expect(replacement.startCalls).toBe(1);
    expect(replacement.stopCalls).toBe(1);
    expect(failingLayer.startCalls).toBe(1);
    expect(failingLayer.stopCalls).toBe(0);
    expect(runtime.diagnostics().voices).toMatchObject({
      active: 1, started: 1, stopped: 0, stolen: 0, ids: ['voice-000001'],
    });
    expect(context.gains[7]!.gain.value).toBe(0);
    expect(runtime.diagnostics().reservations).toMatchObject({
      voices: { active: 0 }, nodes: { active: 0 },
    });
  });

  it('starts a creature replacement at zero gain, steals, then makes it audible without a ninth emitter', async () => {
    const context = new FakeContext();
    const runtime = createAudioRuntime({
      createContext: () => context,
      nowMs: () => 0,
      budgets: { maxVoices: 2, maxCreatureEmitters: 1 },
    });
    await runtime.activate();
    const incumbent = new FakeSource('ordered-incumbent');
    expect(runtime.playVoice(request(incumbent, {
      category: 'creature', priority: 1, concurrencyGroup: 'incumbent', maxConcurrent: 2,
    }))).toEqual({ kind: 'started', voiceId: 'voice-000001' });

    const replacement = new FakeSource('ordered-replacement');
    const originalReplacementStart = replacement.start.bind(replacement);
    replacement.start = () => {
      expect(context.gains[7]!.gain.value).toBe(0);
      expect(incumbent.stopCalls).toBe(0);
      originalReplacementStart();
    };
    const originalIncumbentStop = incumbent.stop.bind(incumbent);
    incumbent.stop = () => {
      expect(replacement.startCalls).toBe(1);
      expect(context.gains[7]!.gain.value).toBe(0);
      originalIncumbentStop();
    };
    expect(runtime.playVoice(request(replacement, {
      category: 'creature', priority: 2, concurrencyGroup: 'replacement', maxConcurrent: 2,
    }))).toEqual({ kind: 'started', voiceId: 'voice-000002' });
    expect(context.gains[7]!.gain.values).toEqual([0, 1]);
    expect(runtime.diagnostics()).toMatchObject({
      voices: { active: 1, peak: 1, stolen: 1 },
      creatureEmitters: { active: 1, peak: 1, budget: 1 },
      reservations: { voices: { active: 0 }, nodes: { active: 0 } },
    });
  });

  it('cleans a zero-gain replacement when mute, hide, context loss, or dispose wins during start', async () => {
    const transitions = ['mute', 'hide', 'context-loss', 'dispose'] as const;
    for (const transition of transitions) {
      const context = new FakeContext();
      const runtime = createAudioRuntime({
        createContext: () => context,
        nowMs: () => 0,
        budgets: { maxCreatureEmitters: 1 },
      });
      await runtime.activate();
      const incumbent = new FakeSource(`${transition}-incumbent`);
      expect(runtime.playVoice(request(incumbent, {
        category: 'creature', priority: 1, concurrencyGroup: 'incumbent', maxConcurrent: 24,
      })).kind).toBe('started');

      const replacement = new FakeSource(`${transition}-replacement`);
      const originalStart = replacement.start.bind(replacement);
      let transitionDone: Promise<void> | null = null;
      replacement.start = () => {
        originalStart();
        if (transition === 'mute') transitionDone = runtime.setMuted(true);
        else if (transition === 'hide') transitionDone = runtime.setHidden(true);
        else if (transition === 'context-loss') context.forceState('closed');
        else transitionDone = runtime.dispose();
      };
      expect(runtime.playVoice(request(replacement, {
        category: 'creature', priority: 2, concurrencyGroup: 'replacement', maxConcurrent: 24,
      }))).toEqual({
        kind: 'rejected',
        reason: transition === 'mute' ? 'muted'
          : transition === 'dispose' ? 'disposed' : 'not-running',
      });
      if (transitionDone) await transitionDone;
      expect(incumbent.stopCalls, transition).toBe(1);
      expect(replacement.startCalls, transition).toBe(1);
      expect(replacement.stopCalls, transition).toBe(1);
      expect(replacement.disconnectCalls, transition).toBe(1);
      expect(runtime.diagnostics(), transition).toMatchObject({
        voices: { active: 0 }, creatureEmitters: { active: 0 },
        reservations: { voices: { active: 0 }, nodes: { active: 0 } },
      });
    }
  });

  it('enforces cooldown before construction and never advances it on rejected attempts', async () => {
    const context = new FakeContext();
    let now = 1_000;
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => now });
    await runtime.activate();
    const first = new FakeSource('cooldown-first');
    const settings = {
      cooldownGroup: 'creature:identity-1', cooldownMs: 500,
      concurrencyGroup: 'creature:identity-1', maxConcurrent: 1,
    } as const;
    expect(runtime.playVoice(request(first, settings)).kind).toBe('started');
    first.finish();

    now = 1_499;
    let rejectedFactoryCalls = 0;
    expect(runtime.playVoice(request(new FakeSource('cooldown-rejected'), {
      ...settings, create: () => { rejectedFactoryCalls++; },
    }))).toEqual({ kind: 'rejected', reason: 'cooldown' });
    expect(rejectedFactoryCalls).toBe(0);
    now = 1_500;
    const afterExpiry = new FakeSource('cooldown-expired');
    expect(runtime.playVoice(request(afterExpiry, settings))).toEqual({
      kind: 'started', voiceId: 'voice-000002',
    });
    expect(runtime.diagnostics().voices.cooldownRejects).toBe(1);

    now = 1_200;
    let backwardFactoryCalls = 0;
    expect(runtime.playVoice(request(new FakeSource('backward-clock'), {
      ...settings, create: () => { backwardFactoryCalls++; },
    }))).toEqual({ kind: 'fault', reason: 'clock' });
    expect(backwardFactoryCalls).toBe(0);
    expect(runtime.diagnostics().faults.retained.at(-1)).toMatchObject({ kind: 'clock' });
  });

  it('enforces the global active-voice budget with the same deterministic priority policy', async () => {
    const context = new FakeContext();
    const runtime = createAudioRuntime({
      createContext: () => context,
      nowMs: () => 0,
      budgets: { maxVoices: 2 },
    });
    await runtime.activate();
    const low = new FakeSource('global-low');
    const high = new FakeSource('global-high');
    expect(runtime.playVoice(request(low, {
      priority: 1, concurrencyGroup: 'music', maxConcurrent: 2,
    })).kind).toBe('started');
    expect(runtime.playVoice(request(high, {
      priority: 4, concurrencyGroup: 'ambience', maxConcurrent: 2,
    })).kind).toBe('started');

    let rejectedFactoryCalls = 0;
    expect(runtime.playVoice(request(new FakeSource('global-rejected'), {
      priority: 1, concurrencyGroup: 'ui', maxConcurrent: 2,
      create: () => { rejectedFactoryCalls++; },
    }))).toEqual({ kind: 'rejected', reason: 'voice-budget' });
    expect(rejectedFactoryCalls).toBe(0);

    const replacement = new FakeSource('global-replacement');
    expect(runtime.playVoice(request(replacement, {
      priority: 2, concurrencyGroup: 'combat', maxConcurrent: 2,
    }))).toEqual({ kind: 'started', voiceId: 'voice-000003' });
    expect(low.stopCalls).toBe(1);
    expect(high.stopCalls).toBe(0);
    expect(runtime.diagnostics().voices).toMatchObject({
      active: 2, peak: 2, budget: 2, stolen: 1,
      ids: ['voice-000002', 'voice-000003'],
    });
  });

  it('caps creature emitters at eight without consuming the remaining full-mix capacity', async () => {
    const first = new FakeContext();
    const second = new FakeContext();
    const third = new FakeContext();
    const factory = contextFactory([first, second, third]);
    const runtime = createAudioRuntime({ createContext: factory.create, nowMs: () => 0 });
    await runtime.activate();

    const creatures = Array.from({ length: 8 }, (_, index) => new FakeSource(`creature-${index}`));
    for (const [index, source] of creatures.entries()) {
      expect(runtime.playVoice(request(source, {
        category: 'creature',
        priority: 1,
        concurrencyGroup: `creature-family-${index}`,
        maxConcurrent: 24,
      }))).toEqual({
        kind: 'started', voiceId: `voice-${(index + 1).toString(36).padStart(6, '0')}`,
      });
    }
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 29, budget: 96 },
      voices: { active: 8, budget: 24 },
      creatureEmitters: { active: 8, peak: 8, budget: 8 },
    });

    let equalPriorityFactoryCalls = 0;
    expect(runtime.playVoice(request(new FakeSource('creature-equal-priority'), {
      category: 'creature',
      priority: 1,
      concurrencyGroup: 'creature-family-equal',
      maxConcurrent: 24,
      create: () => { equalPriorityFactoryCalls++; },
    }))).toEqual({ kind: 'rejected', reason: 'creature-budget' });
    expect(equalPriorityFactoryCalls).toBe(0);

    const ui = new FakeSource('ui-still-has-capacity');
    expect(runtime.playVoice(request(ui, {
      category: 'ui', concurrencyGroup: 'ui', maxConcurrent: 24,
    }))).toEqual({ kind: 'started', voiceId: 'voice-000009' });
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 31 },
      voices: { active: 9 },
      creatureEmitters: { active: 8, peak: 8, budget: 8 },
    });

    const higherPriority = new FakeSource('creature-higher-priority');
    expect(runtime.playVoice(request(higherPriority, {
      category: 'creature',
      priority: 2,
      concurrencyGroup: 'creature-family-winner',
      maxConcurrent: 24,
    }))).toEqual({ kind: 'started', voiceId: 'voice-00000a' });
    expect(creatures[0]!.stopCalls).toBe(1);
    expect(creatures[0]!.disconnectCalls).toBe(1);
    expect(creatures.slice(1).every((source) => source.stopCalls === 0)).toBe(true);
    expect(ui.stopCalls).toBe(0);
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 31 },
      voices: { active: 9, stolen: 1 },
      creatureEmitters: { active: 8, peak: 8, budget: 8 },
      reservations: { voices: { active: 0 }, nodes: { active: 0 } },
    });

    await runtime.setHidden(true);
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 0 }, voices: { active: 0 }, creatureEmitters: { active: 0 },
      reservations: { voices: { active: 0 }, nodes: { active: 0 } },
    });
    await runtime.setHidden(false);
    await runtime.activate();
    expect(runtime.playVoice(request(new FakeSource('creature-before-loss'), {
      category: 'creature', concurrencyGroup: 'creature-before-loss', maxConcurrent: 24,
    })).kind).toBe('started');
    second.forceState('closed');
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 0 }, voices: { active: 0 }, creatureEmitters: { active: 0 },
      reservations: { voices: { active: 0 }, nodes: { active: 0 } },
    });
    await runtime.activate();
    expect(runtime.playVoice(request(new FakeSource('creature-before-dispose'), {
      category: 'creature', concurrencyGroup: 'creature-before-dispose', maxConcurrent: 24,
    })).kind).toBe('started');
    await runtime.dispose();
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 0 }, voices: { active: 0 }, creatureEmitters: { active: 0 },
      reservations: { voices: { active: 0 }, nodes: { active: 0 } },
    });
  });

  it('keeps the node budget independent from creature-emitter headroom', async () => {
    const context = new FakeContext();
    const runtime = createAudioRuntime({
      createContext: () => context,
      nowMs: () => 0,
      budgets: { maxNodes: 15 },
    });
    await runtime.activate();
    expect(runtime.playVoice(request(new FakeSource('one-creature'), {
      category: 'creature', concurrencyGroup: 'creature-one', maxConcurrent: 24,
    })).kind).toBe('started');

    let factoryCalls = 0;
    expect(runtime.playVoice(request(new FakeSource('node-limited-creature'), {
      category: 'creature',
      concurrencyGroup: 'creature-two',
      maxConcurrent: 24,
      create: () => { factoryCalls++; },
    }))).toEqual({ kind: 'rejected', reason: 'node-budget' });
    expect(factoryCalls).toBe(0);
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 15, peak: 15, budget: 15 },
      voices: { active: 1, budget: 24 },
      creatureEmitters: { active: 1, peak: 1, budget: 8 },
      reservations: { voices: { active: 0 }, nodes: { active: 0 } },
    });
  });

  it('resolves simultaneous creature and global pressure without stealing the wrong category', async () => {
    const context = new FakeContext();
    const runtime = createAudioRuntime({
      createContext: () => context,
      nowMs: () => 0,
      budgets: { maxVoices: 3, maxCreatureEmitters: 2 },
    });
    await runtime.activate();
    const creatureHigh = new FakeSource('creature-high');
    const creatureLow = new FakeSource('creature-low');
    const uiLowest = new FakeSource('ui-lowest');
    expect(runtime.playVoice(request(creatureHigh, {
      category: 'creature', priority: 4, concurrencyGroup: 'creature-high', maxConcurrent: 3,
    })).kind).toBe('started');
    expect(runtime.playVoice(request(creatureLow, {
      category: 'creature', priority: 1, concurrencyGroup: 'creature-low', maxConcurrent: 3,
    })).kind).toBe('started');
    expect(runtime.playVoice(request(uiLowest, {
      category: 'ui', priority: -5, concurrencyGroup: 'ui-lowest', maxConcurrent: 3,
    })).kind).toBe('started');

    const creatureReplacement = new FakeSource('creature-replacement');
    expect(runtime.playVoice(request(creatureReplacement, {
      category: 'creature', priority: 2, concurrencyGroup: 'creature-replacement', maxConcurrent: 3,
    }))).toEqual({ kind: 'started', voiceId: 'voice-000004' });
    expect(creatureLow.stopCalls).toBe(1);
    expect(creatureHigh.stopCalls).toBe(0);
    expect(uiLowest.stopCalls).toBe(0);

    const uiReplacement = new FakeSource('ui-replacement');
    expect(runtime.playVoice(request(uiReplacement, {
      category: 'ui', priority: 0, concurrencyGroup: 'ui-replacement', maxConcurrent: 3,
    }))).toEqual({ kind: 'started', voiceId: 'voice-000005' });
    expect(uiLowest.stopCalls).toBe(1);
    expect(runtime.diagnostics()).toMatchObject({
      voices: { active: 3, peak: 3, stolen: 2 },
      creatureEmitters: { active: 2, peak: 2, budget: 2 },
    });
  });

  it('bounds cache/nodes/fault retention and rejects meaningful audio without a counterpart', async () => {
    const context = new FakeContext();
    const released: string[] = [];
    const counterpartGenerations = new Map<string, number>();
    const runtime = createAudioRuntime({
      createContext: () => context,
      nowMs: () => 0,
      budgets: { maxCacheEntries: 2, maxNodes: 15, maxFaults: 2 },
      verifyCounterpart: (receipt) => counterpartGenerations.get(
        `${receipt.counterpartKey}|${receipt.eventKey}`,
      ) === receipt.generation,
    });
    await runtime.activate();
    const release = (value: string): void => { released.push(value); };
    runtime.putCached('buffer:a', 'a', release);
    runtime.putCached('buffer:b', 'b', release);
    expect(runtime.getCached('buffer:a')).toBe('a'); // a is now newest
    runtime.putCached('buffer:c', 'c', release);
    expect(released).toEqual(['b']);
    expect(runtime.getCached('buffer:b')).toBeUndefined();

    let audioOnlyFactoryCalls = 0;
    expect(runtime.playVoice(request(new FakeSource('audio-only'), {
      meaning: { kind: 'meaningful', counterpart: counterpart('caption:creature:selected') },
      create: () => { audioOnlyFactoryCalls++; },
    }))).toEqual({ kind: 'rejected', reason: 'missing-counterpart' });
    expect(audioOnlyFactoryCalls).toBe(0);

    counterpartGenerations.set('caption:creature:selected|event:creature:selected', 2);
    expect(runtime.playVoice(request(new FakeSource('stale-counterpart'), {
      meaning: { kind: 'meaningful', counterpart: counterpart('caption:creature:selected') },
      create: () => { audioOnlyFactoryCalls++; },
    }))).toEqual({ kind: 'rejected', reason: 'missing-counterpart' });
    expect(audioOnlyFactoryCalls).toBe(0);

    const meaningful = new FakeSource('meaningful-with-visual');
    expect(runtime.playVoice(request(meaningful, {
      meaning: {
        kind: 'meaningful',
        counterpart: counterpart('caption:creature:selected', 'event:creature:selected', 2),
      },
    })).kind).toBe('started');
    const overBudget = new FakeSource('over-node-budget');
    let overBudgetFactoryCalls = 0;
    expect(runtime.playVoice(request(overBudget, {
      concurrencyGroup: 'other', maxConcurrent: 1,
      create: () => { overBudgetFactoryCalls++; },
    }))).toEqual({ kind: 'rejected', reason: 'node-budget' });
    expect(overBudgetFactoryCalls).toBe(0);
    expect(overBudget.startCalls).toBe(0);
    expect(overBudget.stopCalls).toBe(0);
    expect(overBudget.disconnectCalls).toBe(0);
    meaningful.finish();

    for (let index = 0; index < 3; index++) {
      expect(runtime.playVoice({
        ...request(new FakeSource(`fault-${index}`)),
        create: () => { throw new Error(`factory fault ${index}`); },
      })).toEqual({ kind: 'fault', reason: 'voice-create' });
    }
    const diagnostics = runtime.diagnostics();
    expect(diagnostics.nodes).toEqual({ active: 13, peak: 15, budget: 15 });
    expect(diagnostics.cache).toEqual({ active: 2, peak: 2, budget: 2, evictions: 1 });
    expect(diagnostics.faults.total).toBe(3);
    expect(diagnostics.faults.retained.map((fault) => fault.message)).toEqual([
      'factory fault 1', 'factory fault 2',
    ]);
    expect(diagnostics.faults.retained).toHaveLength(diagnostics.faults.budget);
  });

  it('re-verifies the exact counterpart before start and diagnoses verifier failure', async () => {
    const context = new FakeContext();
    let currentGeneration = 3;
    let verifierThrows = false;
    const runtime = createAudioRuntime({
      createContext: () => context,
      nowMs: () => 0,
      verifyCounterpart: (receipt) => {
        if (verifierThrows) throw new Error('counterpart registry unavailable');
        return receipt.counterpartKey === 'caption:event'
          && receipt.eventKey === 'event:exact'
          && receipt.generation === currentGeneration;
      },
    });
    await runtime.activate();
    const staleDuringCreate = new FakeSource('stale-during-create');
    let constructed = 0;
    expect(runtime.playVoice(request(staleDuringCreate, {
      meaning: {
        kind: 'meaningful', counterpart: counterpart('caption:event', 'event:exact', 3),
      },
      create: () => { constructed++; currentGeneration = 4; },
    }))).toEqual({ kind: 'rejected', reason: 'missing-counterpart' });
    expect(constructed).toBe(1);
    expect(staleDuringCreate.startCalls).toBe(0);
    expect(staleDuringCreate.disconnectCalls).toBe(1);

    verifierThrows = true;
    let throwingFactoryCalls = 0;
    expect(runtime.playVoice(request(new FakeSource('verifier-fault'), {
      meaning: {
        kind: 'meaningful', counterpart: counterpart('caption:event', 'event:exact', 4),
      },
      create: () => { throwingFactoryCalls++; },
    }))).toEqual({ kind: 'fault', reason: 'counterpart-verify' });
    expect(throwingFactoryCalls).toBe(0);
    expect(runtime.diagnostics().faults.retained.at(-1)).toMatchObject({
      kind: 'counterpart-verify', message: 'counterpart registry unavailable',
    });
  });

  it('surfaces stop, disconnect, and cache-release cleanup failures without retaining logical owners', async () => {
    const context = new FakeContext();
    const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => 0 });
    await runtime.activate();
    const source = new FakeSource('cleanup-fault-source');
    source.throwStop = true;
    source.throwDisconnect = true;
    const started = runtime.playVoice(request(source));
    expect(started).toEqual({ kind: 'started', voiceId: 'voice-000001' });
    runtime.putCached('cache:fault', 'owned', () => { throw new Error('release refusal'); });

    expect(runtime.stopVoice('voice-000001')).toBe(true);
    runtime.clearCache();
    expect(runtime.diagnostics()).toMatchObject({
      nodes: { active: 13 },
      voices: { active: 0 },
      cache: { active: 0 },
      cleanup: {
        sourceStopFailures: 1,
        nodeDisconnectFailures: 1,
        cacheReleaseFailures: 1,
      },
      faults: { total: 3 },
    });
  });

  it('certifies a two-cycle pure lab plateau while keeping browser bytes and accessibility gaps open', async () => {
    const samples = await createAudioLabTrace();
    const audit = auditAudioLabLifecycleTrace(samples);
    expect(audit).toEqual({
      sampleCount: 5,
      loadedCycles: 2,
      contextGenerations: 2,
      pureWarmPlateau: { nodes: 15, voices: 1, creatureEmitters: 1, cacheEntries: 1 },
      settingsAccessibility: AUDIO_SETTING_ACCESSIBILITY_DIAGNOSTICS,
      resourceMeasurement: AUDIO_RESOURCE_MEASUREMENT_DIAGNOSTICS,
    });
    expect(audit.settingsAccessibility).toMatchObject({
      meaningfulCounterpart: 'runtime-verifier-required',
      captions: 'app-integration-required',
      mono: 'not-implemented',
      dynamicRange: 'not-implemented',
      reducedIntensity: 'not-implemented',
    });
    expect(audit.resourceMeasurement).toEqual({
      encodedBytes: 'measurement-required',
      decodedBytes: 'measurement-required',
      browserWarmPlateau: 'measurement-required',
      deviceHeatBattery: 'physical-device-required',
    });

    const missingHidden = samples.filter((sample) => sample.phase !== 'hidden-clean');
    expect(() => auditAudioLabLifecycleTrace(missingHidden)).toThrow(/exactly 5 samples/);
    const falsePlateau = samples.map((sample, index) => index === 3 || index === 4
      ? {
        ...sample,
        diagnostics: {
          ...sample.diagnostics,
          nodes: { ...sample.diagnostics.nodes, peak: sample.diagnostics.nodes.peak + 1 },
          reservations: {
            ...sample.diagnostics.reservations,
            nodes: {
              ...sample.diagnostics.reservations.nodes,
              activePlusReservedPeak:
                sample.diagnostics.reservations.nodes.activePlusReservedPeak + 1,
            },
          },
        },
      }
      : sample);
    expect(() => auditAudioLabLifecycleTrace(falsePlateau)).toThrow(/did not plateau/);
    const leakedHidden = samples.map((sample, index) => index === 2
      ? {
        ...sample,
        diagnostics: {
          ...sample.diagnostics,
          cache: { ...sample.diagnostics.cache, active: 1 },
        },
      }
      : sample);
    expect(() => auditAudioLabLifecycleTrace(leakedHidden)).toThrow(/retained an audio owner/);
    const hiddenCleanupFault = samples.map((sample, index) => index === 2
      ? {
        ...sample,
        diagnostics: {
          ...sample.diagnostics,
          cleanup: { ...sample.diagnostics.cleanup, nodeDisconnectFailures: 1 },
          faults: { ...sample.diagnostics.faults, total: 1 },
        },
      }
      : sample);
    expect(() => auditAudioLabLifecycleTrace(hiddenCleanupFault)).toThrow(/not a clean/);
  });

  it('rejects accessor diagnostics without invoking them and snapshots portable proxies by descriptor', async () => {
    const samples = await createAudioLabTrace();
    let accessorReads = 0;
    const accessorDiagnostics = { ...samples[1]!.diagnostics };
    Object.defineProperty(accessorDiagnostics, 'nodes', {
      enumerable: true,
      get: () => {
        accessorReads++;
        return samples[1]!.diagnostics.nodes;
      },
    });
    const accessorTrace = samples.map((sample, index) => index === 1
      ? { ...sample, diagnostics: accessorDiagnostics }
      : sample) as AudioLabSample[];
    expect(() => auditAudioLabLifecycleTrace(accessorTrace)).toThrow(/data property/);
    expect(accessorReads).toBe(0);

    let proxyReads = 0;
    const proxyDiagnostics = new Proxy(samples[0]!.diagnostics, {
      get: () => {
        proxyReads++;
        throw new Error('diagnostic getter must not run');
      },
    });
    const proxyTrace = samples.map((sample, index) => index === 0
      ? { ...sample, diagnostics: proxyDiagnostics }
      : sample);
    expect(auditAudioLabLifecycleTrace(proxyTrace).sampleCount).toBe(5);
    expect(proxyReads).toBe(0);

    let runtimeGetterReads = 0;
    const hostileRuntime = {} as Pick<ReturnType<typeof createAudioRuntime>, 'diagnostics'>;
    Object.defineProperty(hostileRuntime, 'diagnostics', {
      get: () => {
        runtimeGetterReads++;
        return () => samples[0]!.diagnostics;
      },
    });
    expect(() => captureAudioLabSample('pre-activation', hostileRuntime)).toThrow(/data method/);
    expect(runtimeGetterReads).toBe(0);
  });

  it('rejects a configured-budget change independently of bounded sample values', async () => {
    const samples = await createAudioLabTrace();
    const changedBudget = samples.map((sample, index) => index === 3
      ? {
        ...sample,
        diagnostics: {
          ...sample.diagnostics,
          nodes: { ...sample.diagnostics.nodes, budget: sample.diagnostics.nodes.budget + 1 },
        },
      }
      : sample);
    expect(() => auditAudioLabLifecycleTrace(changedBudget)).toThrow(/configured budgets changed/);
  });

  it('rejects a different loaded-cycle active workload even when cumulative peaks match', async () => {
    const samples = await createAudioLabTrace();
    const changedWorkload = samples.map((sample, index) => index === 3
      ? {
        ...sample,
        diagnostics: {
          ...sample.diagnostics,
          nodes: { ...sample.diagnostics.nodes, active: sample.diagnostics.nodes.active - 1 },
        },
      }
      : sample);
    expect(() => auditAudioLabLifecycleTrace(changedWorkload)).toThrow(/loaded workload changed/);
  });

  it('rejects incoherent voice, reservation, and integer fault accounting independently', async () => {
    const samples = await createAudioLabTrace();
    const brokenVoices = samples.map((sample, index) => index === 3
      ? {
        ...sample,
        diagnostics: {
          ...sample.diagnostics,
          voices: { ...sample.diagnostics.voices, stopped: 999 },
        },
      }
      : sample);
    expect(() => auditAudioLabLifecycleTrace(brokenVoices)).toThrow(/accounting is incoherent/);

    const brokenReservation = samples.map((sample, index) => index === 1
      ? {
        ...sample,
        diagnostics: {
          ...sample.diagnostics,
          reservations: {
            ...sample.diagnostics.reservations,
            nodes: {
              ...sample.diagnostics.reservations.nodes,
              activePlusReservedPeak: 0,
            },
          },
        },
      }
      : sample);
    expect(() => auditAudioLabLifecycleTrace(brokenReservation)).toThrow(/reservation diagnostics/);

    const fractionalFaultBudget = samples.map((sample, index) => index === 2
      ? {
        ...sample,
        diagnostics: {
          ...sample.diagnostics,
          faults: { ...sample.diagnostics.faults, budget: 0.5 },
        },
      }
      : sample);
    expect(() => auditAudioLabLifecycleTrace(fractionalFaultBudget)).toThrow(/fault budget/);
  });

  it('rejects regressing cumulative diagnostics independently of final plateau equality', async () => {
    const samples = await createAudioLabTrace();
    const regressing = samples.map((sample, index) => {
      const cooldownRejects = index === 1 || index === 2 ? 1 : 0;
      return {
        ...sample,
        diagnostics: {
          ...sample.diagnostics,
          voices: { ...sample.diagnostics.voices, cooldownRejects },
        },
      };
    });
    expect(() => auditAudioLabLifecycleTrace(regressing)).toThrow(/cumulative diagnostics regressed/);
  });
});
