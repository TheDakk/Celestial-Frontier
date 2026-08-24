/* Arc 7 typed Web Audio runtime foundation.

   The engine owns lifecycle, routing, bounded diagnostics, and every node in
   an accepted voice graph. Context construction and the monotonic clock are
   injected, so policy tests never need a browser, gesture, wall clock, or
   ambient global. Recorded assets, authored synthesis, and listening proof
   deliberately remain outside this foundation. */
import { boundedAudioKey } from './identity.js';

export const AUDIO_CATEGORIES = Object.freeze([
  'music', 'ambience', 'creature', 'combat-gameplay', 'ui',
] as const);

export type AudioCategory = typeof AUDIO_CATEGORIES[number];
export type AudioActivationState = 'blocked' | 'suspended' | 'running' | 'disposed';
export type AudioMeter = 'master' | AudioCategory;

export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, time: number): unknown;
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike): unknown;
  disconnect(): void;
}

export interface AudioGainNodeLike extends AudioNodeLike {
  readonly gain: AudioParamLike;
}

export interface AudioAnalyserNodeLike extends AudioNodeLike {
  fftSize: number;
  smoothingTimeConstant: number;
  readonly frequencyBinCount: number;
  getFloatTimeDomainData(target: Float32Array): void;
}

export interface AudioLimiterNodeLike extends AudioNodeLike {
  readonly threshold: AudioParamLike;
  readonly knee: AudioParamLike;
  readonly ratio: AudioParamLike;
  readonly attack: AudioParamLike;
  readonly release: AudioParamLike;
}

export interface AudioScheduledSourceLike extends AudioNodeLike {
  onended: (() => void) | null;
  start(when?: number): void;
  stop(when?: number): void;
}

/** Receipt minted by the visual/text owner of one meaningful event. The
 * injected verifier decides whether this exact owner generation is still
 * current; a well-formed key by itself is never accessibility evidence. */
export interface AudioCounterpartReceipt {
  readonly counterpartKey: string;
  readonly eventKey: string;
  readonly generation: number;
}

/** Exact allocation admitted before a voice factory may create nodes. */
export interface AudioVoiceReservation {
  readonly id: string;
  /** Nodes owned by the returned graph. The runtime's per-voice gain is extra. */
  readonly graphNodes: number;
  readonly totalNodes: number;
}

/** Structural subset intentionally implemented by deterministic test fakes
 * and readily adapted from a browser AudioContext. */
export interface AudioContextLike {
  readonly currentTime: number;
  readonly destination: AudioNodeLike;
  readonly state: string;
  createGain(): AudioGainNodeLike;
  createAnalyser(): AudioAnalyserNodeLike;
  createDynamicsCompressor(): AudioLimiterNodeLike;
  resume(): Promise<void>;
  close(): Promise<void>;
  addEventListener?(type: 'statechange', listener: () => void): void;
  removeEventListener?(type: 'statechange', listener: () => void): void;
}

export interface AudioVoiceGraph {
  /** The scheduled source whose natural completion closes the whole voice. */
  readonly source: AudioScheduledSourceLike;
  /** Every scheduled source/LFO owned by the voice, in deterministic start order. */
  readonly sources: readonly AudioScheduledSourceLike[];
  /** The last owned node; the runtime connects it to the requested bus. */
  readonly output: AudioNodeLike;
  /** Exact, unique ownership list, including both source and output. */
  readonly nodes: readonly AudioNodeLike[];
  /** Exact identity of the runtime-owned preflight reservation. */
  readonly reservation: AudioVoiceReservation;
}

export type AudioVoiceMeaning =
  | Readonly<{ kind: 'decorative' }>
  | Readonly<{ kind: 'meaningful'; counterpart: AudioCounterpartReceipt }>;

export interface AudioVoiceRequest {
  readonly key: string;
  readonly category: AudioCategory;
  readonly priority: number;
  readonly cooldownGroup: string;
  readonly cooldownMs: number;
  readonly concurrencyGroup: string;
  readonly maxConcurrent: number;
  /** Exact graph node count, excluding the runtime-created per-voice gain. */
  readonly nodeCount: number;
  readonly meaning: AudioVoiceMeaning;
  readonly create: (
    context: AudioContextLike,
    reservation: AudioVoiceReservation,
  ) => AudioVoiceGraph;
}

export type AudioVoiceStartResult =
  | Readonly<{ kind: 'started'; voiceId: string }>
  | Readonly<{
    kind: 'rejected';
    reason: 'disposed' | 'muted' | 'not-running' | 'invalid-request'
      | 'missing-counterpart' | 'cooldown' | 'concurrency'
      | 'creature-budget' | 'voice-budget' | 'node-budget' | 'reentrant';
  }>
  | Readonly<{
    kind: 'fault';
    reason: 'clock' | 'counterpart-verify' | 'voice-create' | 'voice-connect' | 'voice-start';
  }>;

export type AudioActivationResult =
  | Readonly<{ kind: 'running' }>
  | Readonly<{ kind: 'blocked'; reason: 'muted' | 'context-create' | 'resume-failed' | 'context-unavailable' }>
  | Readonly<{ kind: 'suspended'; reason: 'hidden' }>
  | Readonly<{ kind: 'disposed' }>;

export interface AudioRuntimeBudgets {
  readonly maxVoices: number;
  readonly maxCreatureEmitters: number;
  readonly maxNodes: number;
  readonly maxCacheEntries: number;
  readonly maxCooldownGroups: number;
  readonly maxFaults: number;
}

export interface AudioRuntimeFault {
  readonly ordinal: number;
  readonly kind: string;
  readonly message: string;
}

export interface AudioRuntimeDiagnostics {
  readonly state: AudioActivationState;
  readonly contextState: string | null;
  readonly contextGeneration: number;
  readonly muted: boolean;
  readonly hidden: boolean;
  readonly gains: Readonly<{
    /** Saved master policy; mute is represented separately and never overwrites it. */
    master: number;
    /** Mute-adjusted master policy, reported even before a context is created. */
    effectiveMaster: number;
    categories: Readonly<Record<AudioCategory, number>>;
  }>;
  readonly nodes: Readonly<{ active: number; peak: number; budget: number }>;
  readonly cache: Readonly<{ active: number; peak: number; budget: number; evictions: number }>;
  readonly voices: Readonly<{
    active: number;
    peak: number;
    budget: number;
    ids: readonly string[];
    started: number;
    completed: number;
    stopped: number;
    stolen: number;
    cooldownRejects: number;
    concurrencyRejects: number;
  }>;
  readonly creatureEmitters: Readonly<{ active: number; peak: number; budget: number }>;
  readonly cooldowns: Readonly<{ active: number; budget: number }>;
  readonly reservations: Readonly<{
    voices: Readonly<{ active: number; peak: number; activePlusReservedPeak: number }>;
    nodes: Readonly<{ active: number; peak: number; activePlusReservedPeak: number }>;
  }>;
  readonly cleanup: Readonly<{
    sourceStopFailures: number;
    nodeDisconnectFailures: number;
    cacheReleaseFailures: number;
  }>;
  readonly peaks: Readonly<Record<AudioMeter, number>>;
  readonly faults: Readonly<{ total: number; retained: readonly AudioRuntimeFault[]; budget: number }>;
}

export interface AudioRuntimeOptions {
  readonly createContext: () => AudioContextLike;
  readonly nowMs: () => number;
  readonly initialMuted?: boolean;
  readonly initialMasterGain?: number;
  readonly categoryGains?: Readonly<Partial<Record<AudioCategory, number>>>;
  readonly budgets?: Readonly<Partial<AudioRuntimeBudgets>>;
  /** Pure lookup against the current visual/text owner registry. */
  readonly verifyCounterpart?: (receipt: AudioCounterpartReceipt) => boolean;
}

export interface AudioRuntime {
  activate(): Promise<AudioActivationResult>;
  setMuted(muted: boolean): void;
  setMasterGain(gain: number): void;
  setCategoryGain(category: AudioCategory, gain: number): void;
  setHidden(hidden: boolean): Promise<void>;
  playVoice(request: AudioVoiceRequest): AudioVoiceStartResult;
  stopVoice(voiceId: string): boolean;
  /** Entry-bounded metadata/profile cache. This is not a decoded-byte budget. */
  putCached<T>(key: string, value: T, release?: (value: T) => void): boolean;
  getCached<T>(key: string): T | undefined;
  deleteCached(key: string): boolean;
  clearCache(): void;
  diagnostics(): AudioRuntimeDiagnostics;
  dispose(): Promise<void>;
}

const GRAPH_NODES = 13;
const MAX_VOICE_GRAPH_NODES = 32;
const METERS = Object.freeze(['master', ...AUDIO_CATEGORIES] as const);
const DEFAULT_BUDGETS: AudioRuntimeBudgets = Object.freeze({
  maxVoices: 24,
  maxCreatureEmitters: 8,
  maxNodes: 96,
  maxCacheEntries: 32,
  maxCooldownGroups: 128,
  maxFaults: 20,
});

interface MeterNode {
  readonly analyser: AudioAnalyserNodeLike;
  readonly samples: Float32Array;
}

interface RuntimeGraph {
  readonly master: AudioGainNodeLike;
  readonly limiter: AudioLimiterNodeLike;
  readonly categories: Readonly<Record<AudioCategory, AudioGainNodeLike>>;
  readonly meters: Readonly<Record<AudioMeter, MeterNode>>;
  readonly nodes: readonly AudioNodeLike[];
}

interface ActiveVoice {
  readonly id: string;
  readonly key: string;
  readonly ordinal: number;
  readonly priority: number;
  readonly category: AudioCategory;
  readonly concurrencyGroup: string;
  readonly source: AudioScheduledSourceLike;
  readonly sources: readonly AudioScheduledSourceLike[];
  readonly nodes: readonly AudioNodeLike[];
  readonly voiceGain: AudioGainNodeLike;
  readonly nodeCount: number;
  cleaned: boolean;
}

interface CacheEntry {
  readonly value: unknown;
  readonly release: ((value: unknown) => void) | null;
}

interface CooldownEntry {
  readonly untilMs: number;
}

type VoiceAdmission = Readonly<{
  victim: ActiveVoice | null;
  reason: 'concurrency' | 'creature-budget' | 'voice-budget' | null;
}>;

type VoiceGraphValidation = Readonly<{
  source: AudioScheduledSourceLike;
  output: AudioNodeLike;
  nodes: readonly AudioNodeLike[];
  sources: readonly AudioScheduledSourceLike[];
}>;

type VoiceGraphSnapshot = Readonly<{
  source: unknown;
  sources: unknown;
  output: unknown;
  nodes: unknown;
  reservation: unknown;
}>;

function boundedInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new TypeError(`${label} is outside its bounded integer range`);
  }
  return value as number;
}

function boundedGain(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${label} is not finite`);
  }
  return Math.max(0, Math.min(1, value));
}

function category(value: unknown): AudioCategory {
  if (!(AUDIO_CATEGORIES as readonly unknown[]).includes(value)) {
    throw new TypeError('audio category is invalid');
  }
  return value as AudioCategory;
}

function errorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 192);
}

function isNode(value: unknown): value is AudioNodeLike {
  return value !== null && typeof value === 'object'
    && typeof (value as AudioNodeLike).connect === 'function'
    && typeof (value as AudioNodeLike).disconnect === 'function';
}

function isScheduledSource(value: unknown): value is AudioScheduledSourceLike {
  return isNode(value) && typeof (value as AudioScheduledSourceLike).start === 'function'
    && typeof (value as AudioScheduledSourceLike).stop === 'function'
    && 'onended' in value;
}

function hasExactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sorted = [...expected].sort();
  return actual.length === sorted.length
    && actual.every((key, index) => key === sorted[index]);
}

function counterpartReceipt(value: unknown): AudioCounterpartReceipt {
  if (value === null || typeof value !== 'object'
    || !hasExactKeys(value, ['counterpartKey', 'eventKey', 'generation'])) {
    throw new TypeError('meaningful audio counterpart receipt is invalid');
  }
  const input = value as Record<string, unknown>;
  return Object.freeze({
    counterpartKey: boundedAudioKey(input.counterpartKey, 'meaningful audio counterpart', 192),
    eventKey: boundedAudioKey(input.eventKey, 'meaningful audio event', 192),
    generation: boundedInteger(input.generation, 'meaningful audio counterpart generation', 1, Number.MAX_SAFE_INTEGER),
  });
}

function setParam(param: AudioParamLike, value: number, time: number): void {
  param.setValueAtTime(value, time);
}

function disconnectQuietly(nodes: readonly AudioNodeLike[]): void {
  for (let index = nodes.length - 1; index >= 0; index--) {
    try { nodes[index]!.disconnect(); } catch { /* activation owns diagnosis */ }
  }
}

function createGraph(
  context: AudioContextLike,
  masterGain: number,
  gains: Readonly<Record<AudioCategory, number>>,
): RuntimeGraph {
  const nodes: AudioNodeLike[] = [];
  const own = <T extends AudioNodeLike>(node: T): T => {
    nodes.push(node);
    return node;
  };
  try {
    const master = own(context.createGain());
    const masterAnalyser = own(context.createAnalyser());
    const limiter = own(context.createDynamicsCompressor());
    const categories = {} as Record<AudioCategory, AudioGainNodeLike>;
    const meters = {} as Record<AudioMeter, MeterNode>;

    setParam(master.gain, masterGain, context.currentTime);
    setParam(limiter.threshold, -1, context.currentTime);
    setParam(limiter.knee, 0, context.currentTime);
    setParam(limiter.ratio, 20, context.currentTime);
    setParam(limiter.attack, 0.003, context.currentTime);
    setParam(limiter.release, 0.1, context.currentTime);
    masterAnalyser.fftSize = 32;
    masterAnalyser.smoothingTimeConstant = 0.8;
    meters.master = {
      analyser: masterAnalyser,
      samples: new Float32Array(Math.max(1, Math.min(1_024, masterAnalyser.frequencyBinCount))),
    };

    for (const name of AUDIO_CATEGORIES) {
      const bus = own(context.createGain());
      const analyser = own(context.createAnalyser());
      analyser.fftSize = 32;
      analyser.smoothingTimeConstant = 0.8;
      setParam(bus.gain, gains[name], context.currentTime);
      bus.connect(analyser);
      analyser.connect(master);
      categories[name] = bus;
      meters[name] = {
        analyser,
        samples: new Float32Array(Math.max(1, Math.min(1_024, analyser.frequencyBinCount))),
      };
    }
    master.connect(masterAnalyser);
    masterAnalyser.connect(limiter);
    limiter.connect(context.destination);
    if (nodes.length !== GRAPH_NODES) throw new Error('audio graph node budget invariant failed');
    return {
      master,
      limiter,
      categories: Object.freeze(categories),
      meters: Object.freeze(meters),
      nodes: Object.freeze(nodes),
    };
  } catch (error) {
    disconnectQuietly(nodes);
    throw error;
  }
}

function resolvedBudgets(input: AudioRuntimeOptions['budgets']): AudioRuntimeBudgets {
  return Object.freeze({
    maxVoices: boundedInteger(input?.maxVoices ?? DEFAULT_BUDGETS.maxVoices, 'audio voice budget', 1, 64),
    maxCreatureEmitters: boundedInteger(
      input?.maxCreatureEmitters ?? DEFAULT_BUDGETS.maxCreatureEmitters,
      'audio creature-emitter budget',
      1,
      64,
    ),
    maxNodes: boundedInteger(input?.maxNodes ?? DEFAULT_BUDGETS.maxNodes, 'audio node budget', GRAPH_NODES + 2, 512),
    maxCacheEntries: boundedInteger(input?.maxCacheEntries ?? DEFAULT_BUDGETS.maxCacheEntries, 'audio cache budget', 0, 256),
    maxCooldownGroups: boundedInteger(input?.maxCooldownGroups ?? DEFAULT_BUDGETS.maxCooldownGroups, 'audio cooldown budget', 1, 512),
    maxFaults: boundedInteger(input?.maxFaults ?? DEFAULT_BUDGETS.maxFaults, 'audio fault budget', 1, 64),
  });
}

class InjectedAudioRuntime implements AudioRuntime {
  private readonly createContext: () => AudioContextLike;
  private readonly nowMs: () => number;
  private readonly verifyCounterpart: ((receipt: AudioCounterpartReceipt) => boolean) | null;
  private readonly budgets: AudioRuntimeBudgets;
  private readonly gains: Record<AudioCategory, number>;
  private readonly active = new Map<string, ActiveVoice>();
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cooldowns = new Map<string, CooldownEntry>();
  private readonly peakLevels: Record<AudioMeter, number>;
  private readonly retainedFaults: AudioRuntimeFault[] = [];
  private context: AudioContextLike | null = null;
  private graph: RuntimeGraph | null = null;
  private state: AudioActivationState = 'blocked';
  private muted: boolean;
  private masterGain: number;
  private hidden = false;
  private disposedTerminal = false;
  private resumeBlocked = false;
  private activation: Promise<AudioActivationResult> | null = null;
  private stateListener: (() => void) | null = null;
  private contextGeneration = 0;
  private lifecycleGeneration = 0;
  private voiceOrdinal = 0;
  private reservationOrdinal = 0;
  private faultOrdinal = 0;
  private totalFaults = 0;
  private peakNodes = 0;
  private peakVoices = 0;
  private peakCreatureEmitters = 0;
  private peakCache = 0;
  private cacheEvictions = 0;
  private voicesStarted = 0;
  private voicesCompleted = 0;
  private voicesStopped = 0;
  private voicesStolen = 0;
  private cooldownRejects = 0;
  private concurrencyRejects = 0;
  private voiceAdmissionInProgress = false;
  private reservedVoices = 0;
  private reservedNodes = 0;
  private peakReservedVoices = 0;
  private peakReservedNodes = 0;
  private peakVoicesWithReservations = 0;
  private peakNodesWithReservations = 0;
  private sourceStopFailures = 0;
  private nodeDisconnectFailures = 0;
  private cacheReleaseFailures = 0;
  private lastNowMs: number | null = null;

  constructor(options: AudioRuntimeOptions) {
    if (options === null || typeof options !== 'object') {
      throw new TypeError('audio runtime requires injected context and clock factories');
    }
    let createContext: unknown;
    let nowMs: unknown;
    let verifyCounterpart: unknown;
    let budgets: AudioRuntimeOptions['budgets'];
    let initialMuted: unknown;
    let initialMasterGain: unknown;
    let categoryGains: AudioRuntimeOptions['categoryGains'];
    try {
      /* Runtime options may cross an app/plugin boundary. Snapshot every
         structured field once so accessors cannot pass validation and then
         substitute a different factory or policy value. */
      createContext = options.createContext;
      nowMs = options.nowMs;
      verifyCounterpart = options.verifyCounterpart;
      budgets = options.budgets;
      initialMuted = options.initialMuted;
      initialMasterGain = options.initialMasterGain;
      categoryGains = options.categoryGains;
    } catch {
      throw new TypeError('audio runtime options could not be read');
    }
    if (typeof createContext !== 'function' || typeof nowMs !== 'function') {
      throw new TypeError('audio runtime requires injected context and clock factories');
    }
    this.createContext = createContext as () => AudioContextLike;
    this.nowMs = nowMs as () => number;
    if (verifyCounterpart !== undefined && typeof verifyCounterpart !== 'function') {
      throw new TypeError('audio counterpart verifier must be a function');
    }
    this.verifyCounterpart = (verifyCounterpart as (
      ((receipt: AudioCounterpartReceipt) => boolean) | undefined
    )) ?? null;
    this.budgets = resolvedBudgets(budgets);
    this.muted = initialMuted === true;
    this.masterGain = boundedGain(initialMasterGain ?? 1, 'master gain');
    this.gains = Object.fromEntries(AUDIO_CATEGORIES.map((name) => [
      name,
      boundedGain(categoryGains?.[name] ?? 1, `${name} category gain`),
    ])) as Record<AudioCategory, number>;
    this.peakLevels = Object.fromEntries(METERS.map((name) => [name, 0])) as Record<AudioMeter, number>;
  }

  activate(): Promise<AudioActivationResult> {
    if (this.activation) return this.activation;
    const pending = this.activateInner();
    this.activation = pending;
    const clear = (): void => { if (this.activation === pending) this.activation = null; };
    void pending.then(clear, clear);
    return pending;
  }

  private async activateInner(): Promise<AudioActivationResult> {
    if (this.isDisposed()) return Object.freeze({ kind: 'disposed' });
    if (this.hidden) {
      this.state = 'suspended';
      return Object.freeze({ kind: 'suspended', reason: 'hidden' });
    }
    if (this.muted) {
      this.state = 'blocked';
      return Object.freeze({ kind: 'blocked', reason: 'muted' });
    }
    this.syncContextState();
    if (!this.context) {
      let context: AudioContextLike | null = null;
      try {
        context = this.createContext();
        this.contextGeneration++;
        const graph = createGraph(context, this.masterGain, this.gains);
        this.context = context;
        this.graph = graph;
        this.attachStateListener(context);
        this.observeBudgets();
      } catch (error) {
        this.recordFault('context-create', error);
        if (context && this.context === context) {
          try { this.detachStateListener(context); } catch (detachError) {
            this.recordFault('context-listener-remove', detachError);
          }
        }
        const failedGraph = this.graph;
        this.context = null;
        this.graph = null;
        if (failedGraph) this.disconnectOwned(failedGraph.nodes, 'graph-disconnect');
        if (context && context.state !== 'closed') {
          try { await context.close(); } catch (closeError) { this.recordFault('context-close', closeError); }
        }
        if (this.isDisposed()) return Object.freeze({ kind: 'disposed' });
        this.state = this.hidden ? 'suspended' : 'blocked';
        return Object.freeze({ kind: 'blocked', reason: 'context-create' });
      }
    }
    const context = this.context;
    if (!context || !this.graph) {
      this.state = 'blocked';
      return Object.freeze({ kind: 'blocked', reason: 'context-unavailable' });
    }
    if (context.state === 'suspended') {
      this.state = 'suspended';
      try {
        await context.resume();
        this.resumeBlocked = false;
      } catch (error) {
        this.resumeBlocked = true;
        this.recordFault('resume', error);
        if (this.isDisposed()) return Object.freeze({ kind: 'disposed' });
        if (this.hidden) {
          this.state = 'suspended';
          return Object.freeze({ kind: 'suspended', reason: 'hidden' });
        }
        if (this.context === context && !this.isDisposed()) this.state = 'blocked';
        return Object.freeze({ kind: 'blocked', reason: 'resume-failed' });
      }
    }
    if (this.isDisposed()) return Object.freeze({ kind: 'disposed' });
    if (this.hidden) {
      this.state = 'suspended';
      return Object.freeze({ kind: 'suspended', reason: 'hidden' });
    }
    if (this.muted) {
      this.state = 'blocked';
      this.applyMasterMute();
      return Object.freeze({ kind: 'blocked', reason: 'muted' });
    }
    if (this.context !== context || context.state !== 'running') {
      this.syncContextState();
      if (!this.isDisposed()) this.state = 'blocked';
      return Object.freeze({ kind: 'blocked', reason: 'context-unavailable' });
    }
    this.state = 'running';
    this.applyMasterMute();
    return Object.freeze({ kind: 'running' });
  }

  setMuted(muted: boolean): void {
    if (this.isDisposed()) return;
    this.muted = muted === true;
    if (this.muted) this.stopAllVoices('mute');
    this.applyMasterMute();
    this.syncContextState();
  }

  setMasterGain(gain: number): void {
    if (this.isDisposed()) return;
    this.masterGain = boundedGain(gain, 'master gain');
    this.applyMasterMute();
  }

  setCategoryGain(categoryValue: AudioCategory, gain: number): void {
    if (this.isDisposed()) return;
    const name = category(categoryValue);
    const value = boundedGain(gain, `${name} category gain`);
    this.gains[name] = value;
    if (this.graph && this.context) setParam(this.graph.categories[name].gain, value, this.context.currentTime);
  }

  async setHidden(hidden: boolean): Promise<void> {
    if (this.isDisposed()) return;
    const lifecycle = ++this.lifecycleGeneration;
    this.hidden = hidden === true;
    if (!this.hidden) return;
    this.state = 'suspended';
    if (this.activation) await this.activation;
    if (this.isDisposed() || lifecycle !== this.lifecycleGeneration || !this.hidden) return;
    await this.shutdownContext('hidden');
    if (!this.isDisposed() && lifecycle === this.lifecycleGeneration && this.hidden) {
      this.state = 'suspended';
    }
  }

  playVoice(request: AudioVoiceRequest): AudioVoiceStartResult {
    if (this.isDisposed()) return Object.freeze({ kind: 'rejected', reason: 'disposed' });
    if (this.muted) return Object.freeze({ kind: 'rejected', reason: 'muted' });
    this.syncContextState();
    if (this.state !== 'running' || !this.context || !this.graph || this.hidden) {
      return Object.freeze({ kind: 'rejected', reason: 'not-running' });
    }
    if (this.voiceAdmissionInProgress) {
      return Object.freeze({ kind: 'rejected', reason: 'reentrant' });
    }
    this.voiceAdmissionInProgress = true;
    try {
      return this.playVoiceInner(request);
    } finally {
      this.voiceAdmissionInProgress = false;
    }
  }

  private playVoiceInner(request: AudioVoiceRequest): AudioVoiceStartResult {
    let key: string;
    let categoryName: AudioCategory;
    let priority: number;
    let cooldownGroup: string;
    let cooldownMs: number;
    let concurrencyGroup: string;
    let maxConcurrent: number;
    let nodeCount: number;
    let counterpart: AudioCounterpartReceipt | null = null;
    let create: AudioVoiceRequest['create'];
    try {
      if (request === null || typeof request !== 'object') {
        throw new TypeError('audio voice request is incomplete');
      }
      /* Snapshot each request/meaning field exactly once. Besides making the
         validation decision stable, this prevents a Proxy or accessor from
         swapping the factory after it has passed the function check. */
      const keyValue = request.key;
      const categoryValue = request.category;
      const priorityValue = request.priority;
      const cooldownGroupValue = request.cooldownGroup;
      const cooldownMsValue = request.cooldownMs;
      const concurrencyGroupValue = request.concurrencyGroup;
      const maxConcurrentValue = request.maxConcurrent;
      const nodeCountValue = request.nodeCount;
      const meaningValue = request.meaning;
      const createValue = request.create;
      key = boundedAudioKey(keyValue, 'audio voice key', 192);
      categoryName = category(categoryValue);
      priority = boundedInteger(priorityValue, 'audio voice priority', -1_000, 1_000);
      cooldownGroup = boundedAudioKey(cooldownGroupValue, 'audio cooldown group', 128);
      cooldownMs = boundedInteger(cooldownMsValue, 'audio cooldown', 0, 600_000);
      concurrencyGroup = boundedAudioKey(concurrencyGroupValue, 'audio concurrency group', 128);
      maxConcurrent = boundedInteger(
        maxConcurrentValue,
        'audio group concurrency',
        1,
        this.budgets.maxVoices,
      );
      nodeCount = boundedInteger(nodeCountValue, 'audio graph node reservation', 1, MAX_VOICE_GRAPH_NODES);
      if (typeof createValue !== 'function' || meaningValue === null || typeof meaningValue !== 'object') {
        throw new TypeError('audio voice request is incomplete');
      }
      create = createValue;
      const meaningKind = meaningValue.kind;
      if (meaningKind === 'meaningful') {
        counterpart = counterpartReceipt(meaningValue.counterpart);
      } else if (meaningKind !== 'decorative') {
        throw new TypeError('audio voice meaning is invalid');
      }
    } catch {
      return Object.freeze({ kind: 'rejected', reason: 'invalid-request' });
    }

    const counterpartResult = this.counterpartResult(counterpart);
    if (counterpartResult) return counterpartResult;
    this.syncContextState();
    const unavailable = this.voiceUnavailableResult();
    if (unavailable) return unavailable;

    let now: number;
    try {
      now = this.readMonotonicNow();
    } catch (error) {
      this.recordFault('clock', error);
      return Object.freeze({ kind: 'fault', reason: 'clock' });
    }
    this.purgeCooldowns(now);
    const cooldown = this.cooldowns.get(cooldownGroup);
    if (cooldown && cooldown.untilMs > now) {
      this.cooldownRejects++;
      return Object.freeze({ kind: 'rejected', reason: 'cooldown' });
    }

    const initialAdmission = this.voiceAdmission(
      priority,
      categoryName,
      concurrencyGroup,
      maxConcurrent,
    );
    if (initialAdmission.reason) return this.admissionRejection(initialAdmission.reason);
    const reservationNodes = nodeCount + 1;
    if (this.currentNodeCount() + this.reservedNodes + reservationNodes > this.budgets.maxNodes) {
      return Object.freeze({ kind: 'rejected', reason: 'node-budget' });
    }

    const reservation = Object.freeze({
      id: `reservation-${(++this.reservationOrdinal).toString(36).padStart(6, '0')}`,
      graphNodes: nodeCount,
      totalNodes: reservationNodes,
    });
    this.beginReservation(reservationNodes);
    let reservationActive = true;
    let voiceGraph: AudioVoiceGraph | null = null;
    let nodes: readonly AudioNodeLike[] | null = null;
    let sources: readonly AudioScheduledSourceLike[] | null = null;
    let voiceGain: AudioGainNodeLike | null = null;
    const context = this.context!;
    const runtimeGraph = this.graph!;
    try {
      try {
        voiceGraph = create(context, reservation);
      } catch (error) {
        this.recordFault('voice-create', error);
        return Object.freeze({ kind: 'fault', reason: 'voice-create' });
      }
      const snapshot = this.snapshotVoiceGraph(voiceGraph);
      const validated = snapshot ? this.validateVoiceGraph(snapshot, reservation) : null;
      if (!validated) {
        if (snapshot) this.discardVoiceGraph(snapshot);
        this.recordFault('voice-create', new TypeError('voice graph ownership/reservation is invalid'));
        return Object.freeze({ kind: 'fault', reason: 'voice-create' });
      }
      nodes = validated.nodes;
      sources = validated.sources;

      try {
        voiceGain = context.createGain();
        setParam(voiceGain.gain, 0, context.currentTime);
        validated.output.connect(voiceGain);
        voiceGain.connect(runtimeGraph.categories[categoryName]);
      } catch (error) {
        this.disconnectOwned(voiceGain ? [voiceGain, ...nodes] : nodes, 'voice-connect');
        this.recordFault('voice-connect', error);
        return Object.freeze({ kind: 'fault', reason: 'voice-connect' });
      }

      this.syncContextState();
      const postCreateUnavailable = this.voiceUnavailableResult(context, runtimeGraph);
      if (postCreateUnavailable) {
        this.disconnectOwned([voiceGain, ...nodes], 'voice-discard');
        return postCreateUnavailable;
      }
      const postCreateCounterpart = this.counterpartResult(counterpart);
      if (postCreateCounterpart) {
        this.disconnectOwned([voiceGain, ...nodes], 'voice-discard');
        return postCreateCounterpart;
      }
      const finalAdmission = this.voiceAdmission(
        priority,
        categoryName,
        concurrencyGroup,
        maxConcurrent,
      );
      if (finalAdmission.reason) {
        this.disconnectOwned([voiceGain, ...nodes], 'voice-discard');
        return this.admissionRejection(finalAdmission.reason);
      }
      if (this.currentNodeCount() + this.reservedNodes > this.budgets.maxNodes) {
        this.disconnectOwned([voiceGain, ...nodes], 'voice-discard');
        return Object.freeze({ kind: 'rejected', reason: 'node-budget' });
      }

      const ordinal = ++this.voiceOrdinal;
      const id = `voice-${ordinal.toString(36).padStart(6, '0')}`;
      let installed = false;
      let endedDuringStart = false;
      const startedSources: AudioScheduledSourceLike[] = [];
      try {
        validated.source.onended = () => {
          if (installed) this.finishVoice(id, 'natural');
          else endedDuringStart = true;
        };
        for (const source of sources) {
          source.start();
          startedSources.push(source);
        }
        if (endedDuringStart) throw new Error('audio completion source ended during start');
      } catch (error) {
        this.clearSourceEndedHandlers(sources, 'voice-handler-clear');
        this.stopSources(startedSources, 'voice-stop');
        this.disconnectOwned([voiceGain, ...nodes], 'voice-disconnect');
        this.recordFault('voice-start', error);
        return Object.freeze({ kind: 'fault', reason: 'voice-start' });
      }

      /* A hostile adapter can synchronously change lifecycle or counterpart
         ownership from start(). The voice is still behind zero gain here, so
         recheck before stealing an incumbent or making the voice audible. */
      this.syncContextState();
      const postStartUnavailable = this.voiceUnavailableResult(context, runtimeGraph);
      if (postStartUnavailable) {
        this.clearSourceEndedHandlers(sources, 'voice-handler-clear');
        this.stopSources(sources, 'voice-stop');
        this.disconnectOwned([voiceGain, ...nodes], 'voice-discard');
        return postStartUnavailable;
      }
      const postStartCounterpart = this.counterpartResult(counterpart);
      if (postStartCounterpart) {
        this.clearSourceEndedHandlers(sources, 'voice-handler-clear');
        this.stopSources(sources, 'voice-stop');
        this.disconnectOwned([voiceGain, ...nodes], 'voice-discard');
        return postStartCounterpart;
      }

      const active: ActiveVoice = {
        id,
        key,
        ordinal,
        priority,
        category: categoryName,
        concurrencyGroup,
        source: validated.source,
        sources,
        nodes,
        voiceGain,
        nodeCount: reservationNodes,
        cleaned: false,
      };
      /* A replacement may be constructed and started behind its zero gain so
         start failure keeps the incumbent. The incumbent is stopped before the
         replacement becomes audible, so the admitted emitter count never has
         a ninth audible creature at the eight-emitter boundary. */
      if (finalAdmission.victim) this.finishVoice(finalAdmission.victim.id, 'stolen');
      try {
        setParam(voiceGain.gain, 1, context.currentTime);
      } catch (error) {
        this.clearSourceEndedHandlers(sources, 'voice-handler-clear');
        this.stopSources(sources, 'voice-stop');
        this.disconnectOwned([voiceGain, ...nodes], 'voice-disconnect');
        this.recordFault('voice-start', error);
        return Object.freeze({ kind: 'fault', reason: 'voice-start' });
      }
      this.endReservation(reservationNodes);
      reservationActive = false;
      this.active.set(id, active);
      installed = true;
      this.voicesStarted++;
      if (cooldownMs > 0) this.stampCooldown(cooldownGroup, now + cooldownMs);
      this.observeBudgets();
      return Object.freeze({ kind: 'started', voiceId: id });
    } finally {
      if (reservationActive) this.endReservation(reservationNodes);
    }
  }

  stopVoice(voiceId: string): boolean {
    const voice = this.active.get(voiceId);
    if (!voice) return false;
    this.finishVoice(voiceId, 'manual');
    return true;
  }

  putCached<T>(keyValue: string, value: T, release?: (value: T) => void): boolean {
    if (this.isDisposed() || this.hidden || this.budgets.maxCacheEntries === 0) return false;
    const key = boundedAudioKey(keyValue, 'audio cache key', 192);
    const existing = this.cache.get(key);
    if (existing) {
      this.cache.delete(key);
      this.releaseCacheEntry(existing);
    }
    while (this.cache.size >= this.budgets.maxCacheEntries) {
      const oldest = this.cache.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      const entry = this.cache.get(oldest)!;
      this.cache.delete(oldest);
      this.cacheEvictions++;
      this.releaseCacheEntry(entry);
    }
    this.cache.set(key, {
      value,
      release: release ? release as (value: unknown) => void : null,
    });
    this.observeBudgets();
    return true;
  }

  getCached<T>(keyValue: string): T | undefined {
    const key = boundedAudioKey(keyValue, 'audio cache key', 192);
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value as T;
  }

  deleteCached(keyValue: string): boolean {
    const key = boundedAudioKey(keyValue, 'audio cache key', 192);
    const entry = this.cache.get(key);
    if (!entry) return false;
    this.cache.delete(key);
    this.releaseCacheEntry(entry);
    return true;
  }

  clearCache(): void {
    const entries = [...this.cache.values()];
    this.cache.clear();
    for (const entry of entries) this.releaseCacheEntry(entry);
  }

  diagnostics(): AudioRuntimeDiagnostics {
    this.syncContextState();
    this.samplePeaks();
    this.observeBudgets();
    const peaks = Object.freeze({ ...this.peakLevels });
    return Object.freeze({
      state: this.state,
      contextState: this.context?.state ?? null,
      contextGeneration: this.contextGeneration,
      muted: this.muted,
      hidden: this.hidden,
      gains: Object.freeze({
        master: this.masterGain,
        effectiveMaster: this.muted ? 0 : this.masterGain,
        categories: Object.freeze({ ...this.gains }),
      }),
      nodes: Object.freeze({ active: this.currentNodeCount(), peak: this.peakNodes, budget: this.budgets.maxNodes }),
      cache: Object.freeze({
        active: this.cache.size,
        peak: this.peakCache,
        budget: this.budgets.maxCacheEntries,
        evictions: this.cacheEvictions,
      }),
      voices: Object.freeze({
        active: this.active.size,
        peak: this.peakVoices,
        budget: this.budgets.maxVoices,
        ids: Object.freeze([...this.active.keys()]),
        started: this.voicesStarted,
        completed: this.voicesCompleted,
        stopped: this.voicesStopped,
        stolen: this.voicesStolen,
        cooldownRejects: this.cooldownRejects,
        concurrencyRejects: this.concurrencyRejects,
      }),
      creatureEmitters: Object.freeze({
        active: this.currentCreatureEmitterCount(),
        peak: this.peakCreatureEmitters,
        budget: this.budgets.maxCreatureEmitters,
      }),
      cooldowns: Object.freeze({ active: this.cooldowns.size, budget: this.budgets.maxCooldownGroups }),
      reservations: Object.freeze({
        voices: Object.freeze({
          active: this.reservedVoices,
          peak: this.peakReservedVoices,
          activePlusReservedPeak: this.peakVoicesWithReservations,
        }),
        nodes: Object.freeze({
          active: this.reservedNodes,
          peak: this.peakReservedNodes,
          activePlusReservedPeak: this.peakNodesWithReservations,
        }),
      }),
      cleanup: Object.freeze({
        sourceStopFailures: this.sourceStopFailures,
        nodeDisconnectFailures: this.nodeDisconnectFailures,
        cacheReleaseFailures: this.cacheReleaseFailures,
      }),
      peaks,
      faults: Object.freeze({
        total: this.totalFaults,
        retained: Object.freeze(this.retainedFaults.map((fault) => Object.freeze({ ...fault }))),
        budget: this.budgets.maxFaults,
      }),
    });
  }

  async dispose(): Promise<void> {
    if (this.isDisposed()) return;
    this.disposedTerminal = true;
    this.lifecycleGeneration++;
    this.state = 'disposed';
    if (this.activation) await this.activation;
    await this.shutdownContext('dispose');
    this.clearCache();
    this.cooldowns.clear();
    this.state = 'disposed';
  }

  private counterpartResult(counterpart: AudioCounterpartReceipt | null): AudioVoiceStartResult | null {
    if (!counterpart) return null;
    if (!this.verifyCounterpart) {
      return Object.freeze({ kind: 'rejected', reason: 'missing-counterpart' });
    }
    try {
      if (this.verifyCounterpart(counterpart) !== true) {
        return Object.freeze({ kind: 'rejected', reason: 'missing-counterpart' });
      }
      return null;
    } catch (error) {
      this.recordFault('counterpart-verify', error);
      return Object.freeze({ kind: 'fault', reason: 'counterpart-verify' });
    }
  }

  private voiceUnavailableResult(
    expectedContext?: AudioContextLike,
    expectedGraph?: RuntimeGraph,
  ): AudioVoiceStartResult | null {
    if (this.isDisposed()) return Object.freeze({ kind: 'rejected', reason: 'disposed' });
    if (this.muted) return Object.freeze({ kind: 'rejected', reason: 'muted' });
    if (this.hidden || this.state !== 'running' || !this.context || !this.graph
      || (expectedContext !== undefined && this.context !== expectedContext)
      || (expectedGraph !== undefined && this.graph !== expectedGraph)) {
      return Object.freeze({ kind: 'rejected', reason: 'not-running' });
    }
    return null;
  }

  private readMonotonicNow(): number {
    const now = this.nowMs();
    if (!Number.isFinite(now) || now < 0
      || (this.lastNowMs !== null && now < this.lastNowMs)) {
      throw new TypeError('audio clock is not monotonic-finite');
    }
    this.lastNowMs = now;
    return now;
  }

  private voiceAdmission(
    priority: number,
    categoryName: AudioCategory,
    concurrencyGroup: string,
    maxConcurrent: number,
  ): VoiceAdmission {
    const active = [...this.active.values()];
    const groupFull = active.filter(
      (voice) => voice.concurrencyGroup === concurrencyGroup,
    ).length >= maxConcurrent;
    const creatureFull = categoryName === 'creature'
      && this.currentCreatureEmitterCount() >= this.budgets.maxCreatureEmitters;
    const voiceFull = active.length >= this.budgets.maxVoices;
    if (!groupFull && !creatureFull && !voiceFull) {
      return Object.freeze({ victim: null, reason: null });
    }

    /* One replacement may evict exactly one incumbent. The candidate therefore
       has to release every saturated scope at once. Rejection diagnosis follows
       narrowest-to-broadest policy: request group, creature category, full mix. */
    const rejectionReason: Exclude<VoiceAdmission['reason'], null> = groupFull
      ? 'concurrency'
      : creatureFull ? 'creature-budget' : 'voice-budget';
    const candidate = active
      .filter((voice) => (!groupFull || voice.concurrencyGroup === concurrencyGroup)
        && (!creatureFull || voice.category === 'creature'))
      .sort((left, right) => left.priority - right.priority || left.ordinal - right.ordinal)[0];
    if (!candidate || priority <= candidate.priority) {
      return Object.freeze({ victim: null, reason: rejectionReason });
    }
    return Object.freeze({ victim: candidate, reason: null });
  }

  private admissionRejection(
    reason: Exclude<VoiceAdmission['reason'], null>,
  ): AudioVoiceStartResult {
    if (reason === 'concurrency') this.concurrencyRejects++;
    return Object.freeze({ kind: 'rejected', reason });
  }

  private beginReservation(nodes: number): void {
    this.reservedVoices++;
    this.reservedNodes += nodes;
    this.peakReservedVoices = Math.max(this.peakReservedVoices, this.reservedVoices);
    this.peakReservedNodes = Math.max(this.peakReservedNodes, this.reservedNodes);
    this.peakVoicesWithReservations = Math.max(
      this.peakVoicesWithReservations,
      this.active.size + this.reservedVoices,
    );
    this.peakNodesWithReservations = Math.max(
      this.peakNodesWithReservations,
      this.currentNodeCount() + this.reservedNodes,
    );
  }

  private endReservation(nodes: number): void {
    this.reservedVoices--;
    this.reservedNodes -= nodes;
    if (this.reservedVoices < 0 || this.reservedNodes < 0) {
      this.reservedVoices = Math.max(0, this.reservedVoices);
      this.reservedNodes = Math.max(0, this.reservedNodes);
      this.recordFault('reservation-release', new Error('audio reservation accounting underflow'));
    }
  }

  private applyMasterMute(): void {
    if (!this.graph || !this.context) return;
    try {
      setParam(this.graph.master.gain, this.muted ? 0 : this.masterGain, this.context.currentTime);
    } catch (error) {
      this.recordFault('master-gain', error);
    }
  }

  private isDisposed(): boolean {
    return this.disposedTerminal;
  }

  private attachStateListener(context: AudioContextLike): void {
    if (!context.addEventListener) return;
    const listener = (): void => {
      if (this.context !== context || this.isDisposed()) return;
      this.syncContextState();
    };
    context.addEventListener('statechange', listener);
    this.stateListener = listener;
  }

  private detachStateListener(context: AudioContextLike): void {
    if (this.stateListener && context.removeEventListener) {
      try {
        context.removeEventListener('statechange', this.stateListener);
      } catch (error) {
        this.recordFault('context-listener-remove', error);
      }
    }
    this.stateListener = null;
  }

  private syncContextState(): void {
    const context = this.context;
    if (!context || this.isDisposed()) return;
    if (context.state === 'running') {
      this.resumeBlocked = false;
      this.state = this.hidden ? 'suspended' : this.muted ? 'blocked' : 'running';
      return;
    }
    if (context.state === 'suspended') {
      this.state = this.hidden ? 'suspended'
        : (this.resumeBlocked || this.muted) ? 'blocked' : 'suspended';
      return;
    }
    if (context.state === 'closed' || context.state === 'interrupted') {
      const lostState = context.state;
      this.recordFault('context-loss', new Error(`audio context entered ${lostState}`));
      this.detachStateListener(context);
      this.context = null;
      this.resumeBlocked = false;
      this.stopAllVoices('context-loss');
      this.disconnectRuntimeGraph();
      this.clearCache();
      this.state = 'suspended';
      if (lostState !== 'closed') {
        void context.close().catch((error) => { this.recordFault('context-close', error); });
      }
      return;
    }
    this.state = 'blocked';
  }

  private async shutdownContext(reason: 'hidden' | 'dispose'): Promise<void> {
    const context = this.context;
    if (context) this.detachStateListener(context);
    this.context = null;
    this.resumeBlocked = false;
    this.stopAllVoices(reason);
    this.disconnectRuntimeGraph();
    this.clearCache();
    if (context && context.state !== 'closed') {
      try { await context.close(); } catch (error) { this.recordFault('context-close', error); }
    }
  }

  private disconnectRuntimeGraph(): void {
    const graph = this.graph;
    this.graph = null;
    if (graph) this.disconnectOwned(graph.nodes, 'graph-disconnect');
  }

  private snapshotVoiceGraph(graph: unknown): VoiceGraphSnapshot | null {
    if (graph === null || typeof graph !== 'object') return null;
    try {
      const value = graph as AudioVoiceGraph;
      const source = value.source;
      const sources = value.sources;
      const output = value.output;
      const nodes = value.nodes;
      const graphReservation = value.reservation;
      return Object.freeze({
        source,
        sources: Array.isArray(sources) ? Object.freeze([...sources]) : sources,
        output,
        nodes: Array.isArray(nodes) ? Object.freeze([...nodes]) : nodes,
        reservation: graphReservation,
      });
    } catch {
      return null;
    }
  }

  private validateVoiceGraph(
    graph: VoiceGraphSnapshot,
    reservation: AudioVoiceReservation,
  ): VoiceGraphValidation | null {
    try {
      if (!graph || typeof graph !== 'object' || graph.reservation !== reservation
        || !isScheduledSource(graph.source) || !isNode(graph.output)
        || !Array.isArray(graph.nodes) || graph.nodes.length !== reservation.graphNodes
        || !Array.isArray(graph.sources) || graph.sources.length < 1) return null;
      const nodes = [...graph.nodes];
      const sources = [...graph.sources];
      if (nodes.some((node) => this.isProtectedRuntimeNode(node) || !isNode(node))
        || new Set(nodes).size !== nodes.length
        || sources.some((source) => !isScheduledSource(source) || source.onended !== null)
        || new Set(sources).size !== sources.length
        || !sources.includes(graph.source) || !nodes.includes(graph.source)
        || !nodes.includes(graph.output) || sources.some((source) => !nodes.includes(source))
        || nodes.some((node) => isScheduledSource(node) && !sources.includes(node))) return null;
      return Object.freeze({
        source: graph.source,
        output: graph.output,
        nodes: Object.freeze(nodes),
        sources: Object.freeze(sources),
      });
    } catch {
      return null;
    }
  }

  private discardVoiceGraph(graph: VoiceGraphSnapshot): void {
    const candidates: unknown[] = [];
    try { if (Array.isArray(graph.nodes)) candidates.push(...graph.nodes); } catch { /* hostile array */ }
    try { if (Array.isArray(graph.sources)) candidates.push(...graph.sources); } catch { /* hostile array */ }
    candidates.push(graph.source, graph.output);
    const disposable: AudioNodeLike[] = [];
    for (const candidate of candidates) {
      try {
        if (!this.isProtectedRuntimeNode(candidate) && isNode(candidate)) disposable.push(candidate);
      } catch { /* hostile node */ }
    }
    this.disconnectOwned([...new Set(disposable)], 'voice-discard');
  }

  private finishVoice(
    id: string,
    reason: 'natural' | 'manual' | 'stolen' | 'mute' | 'hidden' | 'dispose' | 'context-loss',
  ): void {
    const voice = this.active.get(id);
    if (!voice || voice.cleaned) return;
    voice.cleaned = true;
    this.active.delete(id);
    this.clearSourceEndedHandlers(voice.sources, 'voice-handler-clear');
    this.stopSources(voice.sources, 'voice-stop');
    this.disconnectOwned([voice.voiceGain, ...voice.nodes], 'voice-disconnect');
    if (reason === 'natural') this.voicesCompleted++;
    else {
      this.voicesStopped++;
      if (reason === 'stolen') this.voicesStolen++;
    }
  }

  private stopAllVoices(reason: 'mute' | 'hidden' | 'dispose' | 'context-loss'): void {
    for (const id of [...this.active.keys()]) this.finishVoice(id, reason);
  }

  private clearSourceEndedHandlers(
    sources: readonly AudioScheduledSourceLike[],
    faultKind: string,
  ): void {
    for (const source of [...new Set(sources)]) {
      try { source.onended = null; } catch (error) { this.recordFault(faultKind, error); }
    }
  }

  private isProtectedRuntimeNode(node: unknown): boolean {
    if (this.context?.destination === node
      || this.graph?.nodes.some((candidate) => candidate === node)) return true;
    for (const voice of this.active.values()) {
      if (voice.voiceGain === node || voice.nodes.some((candidate) => candidate === node)) return true;
    }
    return false;
  }

  private stopSources(sources: readonly AudioScheduledSourceLike[], faultKind: string): void {
    for (const source of [...new Set(sources)]) {
      try {
        source.stop();
      } catch (error) {
        this.sourceStopFailures++;
        this.recordFault(faultKind, error);
      }
    }
  }

  private disconnectOwned(nodes: readonly AudioNodeLike[], faultKind: string): void {
    const unique = [...new Set(nodes)];
    for (let index = unique.length - 1; index >= 0; index--) {
      try { unique[index]!.disconnect(); } catch (error) {
        this.nodeDisconnectFailures++;
        this.recordFault(faultKind, error);
      }
    }
  }

  private stampCooldown(group: string, untilMs: number): void {
    if (this.cooldowns.has(group)) this.cooldowns.delete(group);
    while (this.cooldowns.size >= this.budgets.maxCooldownGroups) {
      const oldest = this.cooldowns.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.cooldowns.delete(oldest);
    }
    this.cooldowns.set(group, { untilMs });
  }

  private purgeCooldowns(now: number): void {
    for (const [group, entry] of this.cooldowns) {
      if (entry.untilMs <= now) this.cooldowns.delete(group);
    }
  }

  private releaseCacheEntry(entry: CacheEntry): void {
    if (!entry.release) return;
    try { entry.release(entry.value); } catch (error) {
      this.cacheReleaseFailures++;
      this.recordFault('cache-release', error);
    }
  }

  private samplePeaks(): void {
    if (!this.graph) return;
    for (const meter of METERS) {
      const entry = this.graph.meters[meter];
      try {
        entry.analyser.getFloatTimeDomainData(entry.samples);
        let peak = 0;
        for (const sample of entry.samples) {
          if (Number.isFinite(sample)) peak = Math.max(peak, Math.min(1, Math.abs(sample)));
        }
        this.peakLevels[meter] = Math.max(this.peakLevels[meter], peak);
      } catch (error) {
        this.recordFault('peak-sample', error);
      }
    }
  }

  private currentNodeCount(): number {
    let count = this.graph?.nodes.length ?? 0;
    for (const voice of this.active.values()) count += voice.nodeCount;
    return count;
  }

  private currentCreatureEmitterCount(): number {
    let count = 0;
    for (const voice of this.active.values()) {
      if (voice.category === 'creature') count++;
    }
    return count;
  }

  private observeBudgets(): void {
    this.peakNodes = Math.max(this.peakNodes, this.currentNodeCount());
    this.peakVoices = Math.max(this.peakVoices, this.active.size);
    this.peakCreatureEmitters = Math.max(
      this.peakCreatureEmitters,
      this.currentCreatureEmitterCount(),
    );
    this.peakCache = Math.max(this.peakCache, this.cache.size);
    this.peakVoicesWithReservations = Math.max(
      this.peakVoicesWithReservations,
      this.active.size + this.reservedVoices,
    );
    this.peakNodesWithReservations = Math.max(
      this.peakNodesWithReservations,
      this.currentNodeCount() + this.reservedNodes,
    );
  }

  private recordFault(kind: string, error: unknown): void {
    this.totalFaults++;
    const fault = Object.freeze({
      ordinal: ++this.faultOrdinal,
      kind,
      message: errorMessage(error),
    });
    this.retainedFaults.push(fault);
    if (this.retainedFaults.length > this.budgets.maxFaults) this.retainedFaults.shift();
  }
}

export function createAudioRuntime(options: AudioRuntimeOptions): AudioRuntime {
  return new InjectedAudioRuntime(options);
}
