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

export const AUDIO_VOICE_MIX_INTENT_SCHEMA_V1 = 'cf.audio.voice-mix-intent/v1' as const;

/** Exact, immutable category factors owned by one admitted voice. A factor of
 * one is neutral; lower factors duck that bus while the owning voice is live. */
export interface AudioVoiceMixIntentV1 {
  readonly schema: typeof AUDIO_VOICE_MIX_INTENT_SCHEMA_V1;
  readonly factors: Readonly<Record<AudioCategory, number>>;
}

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
  /** Optional monotonic lifetime from source start, including its cleanup tail. */
  readonly maxDurationMs?: number;
  readonly concurrencyGroup: string;
  readonly maxConcurrent: number;
  /** Exact graph node count, excluding the runtime-created per-voice gain. */
  readonly nodeCount: number;
  /** Versioned, immutable bus policy released with this exact voice owner. */
  readonly mixIntent: AudioVoiceMixIntentV1;
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
  readonly voiceMix: Readonly<{
    readonly schema: typeof AUDIO_VOICE_MIX_INTENT_SCHEMA_V1;
    readonly activeOwners: number;
    readonly owners: readonly Readonly<{
      readonly voiceId: string;
      readonly factors: Readonly<Record<AudioCategory, number>>;
    }>[];
    /** Deterministic minimum across active owners; one when none are active. */
    readonly factors: Readonly<Record<AudioCategory, number>>;
    /** Saved category gain multiplied by the aggregate owner factor. */
    readonly effectiveCategoryGains: Readonly<Record<AudioCategory, number>>;
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

/** Schedule asynchronously and return exact cancellation ownership. */
export type AudioVoiceDeadlineScheduler = (callback: () => void, delayMs: number) => () => void;

export interface AudioRuntimeOptions {
  readonly createContext: () => AudioContextLike;
  readonly nowMs: () => number;
  /** Required only for requests with maxDurationMs; the runtime owns at most one wake. */
  readonly scheduleVoiceDeadline?: AudioVoiceDeadlineScheduler;
  readonly initialMuted?: boolean;
  readonly initialMasterGain?: number;
  readonly categoryGains?: Readonly<Partial<Record<AudioCategory, number>>>;
  readonly budgets?: Readonly<Partial<AudioRuntimeBudgets>>;
  /** Pure lookup against the current visual/text owner registry. */
  readonly verifyCounterpart?: (receipt: AudioCounterpartReceipt) => boolean;
}

export interface AudioRuntime {
  activate(): Promise<AudioActivationResult>;
  /** Immediate zero/stop plus settled teardown of every owned context. */
  setMuted(muted: boolean): Promise<void>;
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
const MAX_CATEGORY_MIX_PASSES = 12;
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
  readonly mixIntent: AudioVoiceMixIntentV1;
  readonly source: AudioScheduledSourceLike;
  readonly sources: readonly AudioScheduledSourceLike[];
  readonly nodes: readonly AudioNodeLike[];
  readonly voiceGain: AudioGainNodeLike;
  readonly nodeCount: number;
  readonly expiresAtMs: number | null;
  cleaned: boolean;
}

interface VoiceDeadlineWake {
  readonly expiresAtMs: number;
  cancel: (() => void) | null;
  arming: boolean;
}

interface CacheEntry {
  readonly value: unknown;
  readonly release: ((value: unknown) => void) | null;
}

interface CooldownEntry {
  readonly untilMs: number;
}

interface PendingActivation {
  readonly lifecycle: number;
  promise: Promise<AudioActivationResult> | null;
  context: AudioContextLike | null;
  published: boolean;
  cancelled: boolean;
  readonly cancellation: Promise<void>;
  readonly cancel: () => void;
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

type CategoryMixWriteResult =
  | Readonly<{ kind: 'applied' }>
  | Readonly<{ kind: 'reentrant' }>
  | Readonly<{ kind: 'failed'; error: unknown }>;

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

function exactDataFields(
  value: unknown,
  expected: readonly string[],
  label: string,
  requireFrozen: boolean,
): Readonly<Record<string, unknown>> {
  try {
    if (value === null || typeof value !== 'object' || Array.isArray(value)
      || Object.getPrototypeOf(value) !== Object.prototype
      || (requireFrozen && !Object.isFrozen(value))) {
      throw new TypeError(`${label} must be an exact${requireFrozen ? ' immutable' : ''} data object`);
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length !== expected.length
      || keys.some((key) => typeof key !== 'string' || !expected.includes(key))) {
      throw new TypeError(`${label} has unexpected fields`);
    }
    const output: Record<string, unknown> = {};
    for (const key of expected) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) {
        throw new TypeError(`${label}.${key} must be an enumerable data property`);
      }
      output[key] = descriptor.value;
    }
    return output;
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError(`${label} could not be inspected`);
  }
}

function voiceMixFactor(value: unknown, categoryName: AudioCategory): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new TypeError(`${categoryName} voice mix factor is outside [0, 1]`);
  }
  return Object.is(value, -0) ? 0 : value;
}

function snapshotVoiceMixFactors(
  value: unknown,
  requireFrozen: boolean,
): Readonly<Record<AudioCategory, number>> {
  const input = exactDataFields(value, AUDIO_CATEGORIES, 'audio voice mix factors', requireFrozen);
  return Object.freeze(Object.fromEntries(AUDIO_CATEGORIES.map((name) => [
    name,
    voiceMixFactor(input[name], name),
  ]))) as Readonly<Record<AudioCategory, number>>;
}

function voiceMixIntent(value: unknown): AudioVoiceMixIntentV1 {
  const input = exactDataFields(
    value,
    ['schema', 'factors'],
    'audio voice mix intent',
    true,
  );
  if (input.schema !== AUDIO_VOICE_MIX_INTENT_SCHEMA_V1) {
    throw new TypeError('audio voice mix intent schema is unsupported');
  }
  return Object.freeze({
    schema: AUDIO_VOICE_MIX_INTENT_SCHEMA_V1,
    factors: snapshotVoiceMixFactors(input.factors, true),
  });
}

/** Mint a detached immutable v1 intent from one exact full category map. */
export function createAudioVoiceMixIntentV1(
  factors: Readonly<Record<AudioCategory, number>>,
): AudioVoiceMixIntentV1 {
  return Object.freeze({
    schema: AUDIO_VOICE_MIX_INTENT_SCHEMA_V1,
    factors: snapshotVoiceMixFactors(factors, false),
  });
}

export const AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1 = createAudioVoiceMixIntentV1(Object.freeze({
  music: 1,
  ambience: 1,
  creature: 1,
  'combat-gameplay': 1,
  ui: 1,
}));

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
      8,
    ),
    maxNodes: boundedInteger(input?.maxNodes ?? DEFAULT_BUDGETS.maxNodes, 'audio node budget', GRAPH_NODES + 2, 120),
    maxCacheEntries: boundedInteger(input?.maxCacheEntries ?? DEFAULT_BUDGETS.maxCacheEntries, 'audio cache budget', 0, 256),
    maxCooldownGroups: boundedInteger(input?.maxCooldownGroups ?? DEFAULT_BUDGETS.maxCooldownGroups, 'audio cooldown budget', 1, 512),
    maxFaults: boundedInteger(input?.maxFaults ?? DEFAULT_BUDGETS.maxFaults, 'audio fault budget', 1, 64),
  });
}

class InjectedAudioRuntime implements AudioRuntime {
  private readonly createContext: () => AudioContextLike;
  private readonly nowMs: () => number;
  private readonly verifyCounterpart: ((receipt: AudioCounterpartReceipt) => boolean) | null;
  private readonly scheduleVoiceDeadline: AudioVoiceDeadlineScheduler | null;
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
  private activation: PendingActivation | null = null;
  private readonly pendingActivations = new Set<PendingActivation>();
  private readonly failedTeardownContexts = new Set<AudioContextLike>();
  private readonly closeSettlements = new Map<AudioContextLike, Promise<void>>();
  private muteSettlement: Promise<void> | null = null;
  private disposeSettlement: Promise<void> | null = null;
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
  private categoryMixApplying = false;
  private categoryMixDirty = false;
  private categoryPolicyGeneration = 0;
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
  private deadlineWake: VoiceDeadlineWake | null = null;
  private deadlineReconciling = false;
  private deadlineDirty = false;
  private deadlineFailed = false;

  constructor(options: AudioRuntimeOptions) {
    if (options === null || typeof options !== 'object') {
      throw new TypeError('audio runtime requires injected context and clock factories');
    }
    let createContext: unknown;
    let nowMs: unknown;
    let verifyCounterpart: unknown;
    let scheduleVoiceDeadline: unknown;
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
      scheduleVoiceDeadline = options.scheduleVoiceDeadline;
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
    if (scheduleVoiceDeadline !== undefined && typeof scheduleVoiceDeadline !== 'function') {
      throw new TypeError('audio voice deadline scheduler must be a function');
    }
    this.scheduleVoiceDeadline = (scheduleVoiceDeadline as AudioVoiceDeadlineScheduler | undefined) ?? null;
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
    if (this.activation
      && (this.activation.lifecycle === this.lifecycleGeneration || this.context !== null)) {
      return this.activation.promise!;
    }
    const lifecycle = this.lifecycleGeneration;
    let resolveCancellation!: () => void;
    const cancellation = new Promise<void>((resolve) => {
      resolveCancellation = resolve;
    });
    const record: PendingActivation = {
      lifecycle,
      promise: null,
      context: null,
      published: false,
      cancelled: false,
      cancellation,
      cancel: () => {
        if (record.cancelled) return;
        record.cancelled = true;
        resolveCancellation();
      },
    };
    /* Register before invoking an injected factory. Besides making ordinary
       activation coalescing exact, this lets reentrant mute/dispose calls own
       the still-unpublished context through this record. */
    let resolveActivation!: (result: AudioActivationResult) => void;
    let rejectActivation!: (error: unknown) => void;
    const pending = new Promise<AudioActivationResult>((resolve, reject) => {
      resolveActivation = resolve;
      rejectActivation = reject;
    });
    record.promise = pending;
    this.activation = record;
    this.pendingActivations.add(record);
    const clear = (): void => {
      this.pendingActivations.delete(record);
      if (this.activation === record) this.activation = null;
    };
    void pending.then(clear, clear);
    void this.activateInner(record).then(resolveActivation, rejectActivation);
    return pending;
  }

  private async activateInner(record: PendingActivation): Promise<AudioActivationResult> {
    const lifecycle = record.lifecycle;
    if (this.isDisposed()) return Object.freeze({ kind: 'disposed' });
    if (record.cancelled || lifecycle !== this.lifecycleGeneration) {
      return this.activationResultForCurrentPolicy();
    }
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
      if (this.failedTeardownContexts.size > 0) {
        const retryOutcome = await Promise.race([
          Promise.all(this.retryFailedTeardownContexts()).then(
            () => Object.freeze({ kind: 'settled' as const }),
          ),
          record.cancellation.then(() => Object.freeze({ kind: 'cancelled' as const })),
        ]);
        if (retryOutcome.kind === 'cancelled' || record.cancelled
          || lifecycle !== this.lifecycleGeneration
          || this.isDisposed() || this.hidden || this.muted) {
          return this.activationResultForCurrentPolicy();
        }
        /* A context that refused teardown is silent and quarantined. Never
           allocate or republish another context while that retained owner is
           still running; a later eligible activation may retry the same one. */
        if (this.failedTeardownContexts.size > 0) {
          this.state = 'blocked';
          return Object.freeze({ kind: 'blocked', reason: 'context-unavailable' });
        }
      }
      /* One detached physical owner is the hard bound. Until its close has
         actually settled, another gesture cannot allocate a replacement. */
      if (this.closeSettlements.size > 0) {
        this.state = 'blocked';
        return Object.freeze({ kind: 'blocked', reason: 'context-unavailable' });
      }
      let context: AudioContextLike | null = null;
      try {
        context = this.createContext();
        record.context = context;
        this.contextGeneration++;
        /* A singleton/hostile factory may return the exact context whose close
           is unresolved or already failed. It remains non-publishable. */
        if (this.closeSettlements.has(context) || this.failedTeardownContexts.has(context)) {
          this.state = 'blocked';
          return Object.freeze({ kind: 'blocked', reason: 'context-unavailable' });
        }
        const graph = createGraph(context, this.masterGain, this.gains);
        /* Context/node factories are injected and may call back into lifecycle
           policy synchronously. A context created by an overtaken gesture is
           never published, even when the final policy is enabled again. */
        if (lifecycle !== this.lifecycleGeneration || this.isDisposed()
          || this.hidden || this.muted) {
          await this.closeUnpublishedContext(context, graph);
          return this.activationResultForCurrentPolicy();
        }
        this.context = context;
        this.graph = graph;
        record.published = true;
        this.attachStateListener(context);
        this.observeBudgets();
        if (record.cancelled || lifecycle !== this.lifecycleGeneration
          || this.isDisposed() || this.hidden || this.muted
          || this.context !== context || this.graph !== graph) {
          return this.activationResultForCurrentPolicy();
        }
      } catch (error) {
        this.recordFault('context-create', error);
        const publishedHere = context !== null && this.context === context;
        if (context && publishedHere) {
          try { this.detachStateListener(context); } catch (detachError) {
            this.recordFault('context-listener-remove', detachError);
          }
        }
        const failedGraph = publishedHere ? this.graph : null;
        if (publishedHere) {
          this.context = null;
          this.graph = null;
        }
        if (failedGraph) this.disconnectOwned(failedGraph.nodes, 'graph-disconnect');
        if (context) await this.closeContext(context);
        if (lifecycle !== this.lifecycleGeneration) {
          return this.activationResultForCurrentPolicy();
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
    record.context = context;
    record.published = true;
    if (context.state === 'suspended') {
      this.state = 'suspended';
      let resumeOutcome:
        | Readonly<{ kind: 'resumed' }>
        | Readonly<{ kind: 'cancelled' }>
        | Readonly<{ kind: 'failed'; error: unknown }>;
      try {
        const resume = context.resume();
        const resumeAttempt = Promise.resolve(resume).then(
          () => Object.freeze({ kind: 'resumed' as const }),
          (error) => Object.freeze({ kind: 'failed' as const, error }),
        );
        /* Install the rejection observer before consulting synchronous
           cancellation: resume() may itself invoke mute/dispose and then
           return an already-rejected promise. */
        if (record.cancelled) return this.activationResultForCurrentPolicy();
        resumeOutcome = await Promise.race([
          resumeAttempt,
          record.cancellation.then(() => Object.freeze({ kind: 'cancelled' as const })),
        ]);
      } catch (error) {
        resumeOutcome = Object.freeze({ kind: 'failed', error });
      }
      if (resumeOutcome.kind === 'cancelled' || record.cancelled) {
        return this.activationResultForCurrentPolicy();
      }
      if (resumeOutcome.kind === 'failed') {
        const { error } = resumeOutcome;
        this.resumeBlocked = true;
        this.recordFault('resume', error);
        if (lifecycle !== this.lifecycleGeneration) {
          await this.shutdownContext('stale-activation', context);
          return this.activationResultForCurrentPolicy();
        }
        if (this.isDisposed()) return Object.freeze({ kind: 'disposed' });
        if (this.hidden) {
          this.state = 'suspended';
          return Object.freeze({ kind: 'suspended', reason: 'hidden' });
        }
        if (this.context === context && !this.isDisposed()) this.state = 'blocked';
        return Object.freeze({ kind: 'blocked', reason: 'resume-failed' });
      }
      this.resumeBlocked = false;
    }
    if (record.cancelled || lifecycle !== this.lifecycleGeneration) {
      await this.shutdownContext('stale-activation', context);
      return this.activationResultForCurrentPolicy();
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

  setMuted(muted: boolean): Promise<void> {
    const next = muted === true;
    /* No call made during a physical close may await that close's owning
       lifecycle settlement: injected close implementations can call back
       synchronously or asynchronously and would otherwise self-cycle. The
       requested policy and synchronous cleanup are authoritative immediately;
       the already-owned close continues independently. */
    if (next && this.closeSettlements.size > 0) {
      if (this.isDisposed()) return Promise.resolve();
      if (!this.muted) {
        this.lifecycleGeneration++;
        this.muted = true;
        this.cancelPendingActivations();
      }
      this.state = this.hidden ? 'suspended' : 'blocked';
      this.applyMasterMute();
      void this.shutdownContext('mute');
      return Promise.resolve();
    }
    if (this.isDisposed()) {
      if (next && this.failedTeardownContexts.size > 0) {
        return this.dispose();
      }
      return Promise.resolve();
    }
    if (this.muted === next) {
      if (!next) return Promise.resolve();
      if (this.muteSettlement) return this.muteSettlement;
      if (this.failedTeardownContexts.size === 0) return Promise.resolve();
      return this.beginMasterMuteSettlement(this.lifecycleGeneration, null);
    }
    const lifecycle = ++this.lifecycleGeneration;
    this.muted = next;
    this.cancelPendingActivations();
    if (!this.muted) {
      this.applyMasterMute();
      this.syncContextState();
      if (!this.context) this.state = this.hidden ? 'suspended' : 'blocked';
      return Promise.resolve();
    }

    return this.beginMasterMuteSettlement(lifecycle, this.muteSettlement);
  }

  private beginMasterMuteSettlement(
    lifecycle: number,
    prior: Promise<void> | null,
  ): Promise<void> {
    let resolveSettlement!: () => void;
    let rejectSettlement!: (error: unknown) => void;
    const settlement = new Promise<void>((resolve, reject) => {
      resolveSettlement = resolve;
      rejectSettlement = reject;
    });
    /* Publish before any injected source.stop() or context.close() callback.
       Source-stop reentrancy shares this attempt. Once a physical close is
       unresolved, mute/dispose reentrancy uses the explicit immediate-result
       exception above and cannot self-await this settlement. */
    this.muteSettlement = settlement;
    const clear = (): void => {
      if (this.muteSettlement === settlement) this.muteSettlement = null;
    };
    void settlement.then(clear, clear);
    /* Gain zero and source cleanup are synchronous. Context close is awaited
       by the returned settlement, so Settings can truthfully report that no
       running context remains without making unmute allocate one. */
    this.state = this.hidden ? 'suspended' : 'blocked';
    this.applyMasterMute();
    const unpublishedActivations = this.unpublishedActivationPromises();
    const failedContexts = [...this.failedTeardownContexts];
    const context = this.context;
    const closing = context
      ? this.shutdownContext('mute', context)
      : Promise.resolve();
    const failedTeardowns = this.retryFailedTeardownContexts(failedContexts);
    const operation = this.settleMasterMute(
      lifecycle,
      prior,
      unpublishedActivations,
      closing,
      failedTeardowns,
    );
    void operation.then(resolveSettlement, rejectSettlement);
    return settlement;
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
    this.categoryPolicyGeneration++;
    this.reconcileCurrentCategoryMix(null, [name]);
  }

  async setHidden(hidden: boolean): Promise<void> {
    if (this.isDisposed()) return;
    const lifecycle = ++this.lifecycleGeneration;
    this.hidden = hidden === true;
    this.cancelPendingActivations();
    if (!this.hidden) return;
    this.state = 'suspended';
    /* A published activation may be awaiting resume forever. Detaching its
       exact context cancels that wait; only a still-unpublished factory needs
       to finish before hidden settlement can be truthful. */
    if (this.context) await this.shutdownContext('hidden', this.context);
    else if (this.activation?.promise) await this.activation.promise;
    if (this.isDisposed() || lifecycle !== this.lifecycleGeneration || !this.hidden) return;
    if (this.context) await this.shutdownContext('hidden', this.context);
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
    let maxDurationMs: number | null;
    let concurrencyGroup: string;
    let maxConcurrent: number;
    let nodeCount: number;
    let mixIntent: AudioVoiceMixIntentV1;
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
      const maxDurationMsValue = request.maxDurationMs;
      const concurrencyGroupValue = request.concurrencyGroup;
      const maxConcurrentValue = request.maxConcurrent;
      const nodeCountValue = request.nodeCount;
      const mixIntentValue = request.mixIntent;
      const meaningValue = request.meaning;
      const createValue = request.create;
      key = boundedAudioKey(keyValue, 'audio voice key', 192);
      categoryName = category(categoryValue);
      priority = boundedInteger(priorityValue, 'audio voice priority', -1_000, 1_000);
      cooldownGroup = boundedAudioKey(cooldownGroupValue, 'audio cooldown group', 128);
      cooldownMs = boundedInteger(cooldownMsValue, 'audio cooldown', 0, 600_000);
      maxDurationMs = maxDurationMsValue === undefined ? null
        : boundedInteger(maxDurationMsValue, 'audio voice maximum duration', 1, 2_147_483_647);
      if (maxDurationMs !== null && (!this.scheduleVoiceDeadline || this.deadlineFailed)) {
        throw new TypeError('bounded audio voices require an available deadline scheduler');
      }
      concurrencyGroup = boundedAudioKey(concurrencyGroupValue, 'audio concurrency group', 128);
      maxConcurrent = boundedInteger(
        maxConcurrentValue,
        'audio group concurrency',
        1,
        this.budgets.maxVoices,
      );
      nodeCount = boundedInteger(nodeCountValue, 'audio graph node reservation', 1, MAX_VOICE_GRAPH_NODES);
      mixIntent = voiceMixIntent(mixIntentValue);
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
    this.reconcileVoiceDeadline();
    this.syncContextState();
    const postDeadlineUnavailable = this.voiceUnavailableResult();
    if (postDeadlineUnavailable) return postDeadlineUnavailable;
    if (maxDurationMs !== null && this.deadlineFailed) {
      return Object.freeze({ kind: 'rejected', reason: 'invalid-request' });
    }
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

      let expiresAtMs: number | null = null;
      if (maxDurationMs !== null) {
        try {
          expiresAtMs = this.readMonotonicNow() + maxDurationMs;
          if (!Number.isFinite(expiresAtMs) || expiresAtMs > Number.MAX_SAFE_INTEGER) {
            throw new TypeError('audio voice deadline is outside the safe clock range');
          }
        } catch (error) {
          this.disconnectOwned([voiceGain, ...nodes], 'voice-disconnect');
          this.recordFault('clock', error);
          return Object.freeze({ kind: 'fault', reason: 'clock' });
        }
        this.syncContextState();
        const clockUnavailable = this.voiceUnavailableResult(context, runtimeGraph);
        if (clockUnavailable) {
          this.disconnectOwned([voiceGain, ...nodes], 'voice-discard');
          return clockUnavailable;
        }
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
        mixIntent,
        source: validated.source,
        sources,
        nodes,
        voiceGain,
        nodeCount: reservationNodes,
        expiresAtMs,
        cleaned: false,
      };
      /* Establish the replacement's exact bus policy while both its own gain
         and sources remain inaudible. A failed/unstable bus write is rolled
         back before the incumbent can be stolen. */
      const previousMixFactors = this.voiceMixFactors();
      const prospectiveMixFactors = this.voiceMixFactors(
        mixIntent,
        finalAdmission.victim?.id ?? null,
      );
      const discardCandidate = (): void => {
        this.clearSourceEndedHandlers(sources!, 'voice-handler-clear');
        this.stopSources(sources!, 'voice-stop');
        this.disconnectOwned([voiceGain!, ...nodes!], 'voice-disconnect');
      };
      if (!this.applyProspectiveCategoryMix(prospectiveMixFactors, previousMixFactors)) {
        discardCandidate();
        this.reconcileCurrentCategoryMix(null);
        return Object.freeze({ kind: 'fault', reason: 'voice-start' });
      }
      let admittedPolicyGeneration = this.categoryPolicyGeneration;
      if (finalAdmission.victim) {
        this.finishVoice(finalAdmission.victim.id, 'stolen', true);
        const expectedGeneration = admittedPolicyGeneration + 1;
        if (this.categoryPolicyGeneration !== expectedGeneration) {
          discardCandidate();
          this.reconcileCurrentCategoryMix(null);
          this.recordFault(
            'category-mix-reentrant',
            new Error('replacement cleanup changed category policy during admission'),
          );
          return Object.freeze({ kind: 'fault', reason: 'voice-start' });
        }
        admittedPolicyGeneration = expectedGeneration;
      }
      this.syncContextState();
      const postMixUnavailable = this.voiceUnavailableResult(context, runtimeGraph);
      if (postMixUnavailable) {
        discardCandidate();
        this.reconcileCurrentCategoryMix(null);
        return postMixUnavailable;
      }
      if (endedDuringStart) {
        discardCandidate();
        this.reconcileCurrentCategoryMix(null);
        this.recordFault('voice-start', new Error('audio completion source ended during mix admission'));
        return Object.freeze({ kind: 'fault', reason: 'voice-start' });
      }
      try {
        setParam(voiceGain.gain, 1, context.currentTime);
      } catch (error) {
        discardCandidate();
        this.reconcileCurrentCategoryMix(null);
        this.recordFault('voice-start', error);
        return Object.freeze({ kind: 'fault', reason: 'voice-start' });
      }
      this.syncContextState();
      const postGainUnavailable = this.voiceUnavailableResult(context, runtimeGraph);
      if (postGainUnavailable) {
        discardCandidate();
        this.reconcileCurrentCategoryMix(null);
        return postGainUnavailable;
      }
      if (endedDuringStart || this.categoryPolicyGeneration !== admittedPolicyGeneration) {
        discardCandidate();
        this.reconcileCurrentCategoryMix(null);
        this.recordFault(
          'voice-start',
          new Error(endedDuringStart
            ? 'audio completion source ended during gain admission'
            : 'category policy changed during voice gain admission'),
        );
        return Object.freeze({ kind: 'fault', reason: 'voice-start' });
      }
      this.endReservation(reservationNodes);
      reservationActive = false;
      this.active.set(id, active);
      this.categoryPolicyGeneration++;
      installed = true;
      this.voicesStarted++;
      this.reconcileVoiceDeadline();
      if (!this.active.has(id)) {
        return Object.freeze({ kind: 'fault', reason: 'voice-start' });
      }
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
    const voiceIds = Object.freeze([...this.active.keys()]);
    const mixFactors = this.voiceMixFactors();
    const mixOwners = Object.freeze([...this.active.values()].map((voice) => Object.freeze({
      voiceId: voice.id,
      factors: Object.freeze({ ...voice.mixIntent.factors }),
    })));
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
      voiceMix: Object.freeze({
        schema: AUDIO_VOICE_MIX_INTENT_SCHEMA_V1,
        activeOwners: mixOwners.length,
        owners: mixOwners,
        factors: mixFactors,
        effectiveCategoryGains: this.effectiveCategoryGains(mixFactors),
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
        ids: voiceIds,
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

  dispose(): Promise<void> {
    /* This is the disposal counterpart to setMuted's close reentrancy rule.
       A close callback receives an immediate terminal result and never the
       settlement that is waiting for that same callback. Any independently
       attached context is detached synchronously and closes in the background. */
    if (this.closeSettlements.size > 0) {
      if (!this.disposedTerminal) {
        this.disposedTerminal = true;
        this.lifecycleGeneration++;
        this.cancelPendingActivations();
      }
      this.state = 'disposed';
      void this.shutdownContext('dispose');
      this.clearCache();
      this.cooldowns.clear();
      return Promise.resolve();
    }
    if (this.disposeSettlement) return this.disposeSettlement;
    let resolveSettlement!: () => void;
    let rejectSettlement!: (error: unknown) => void;
    const settlement = new Promise<void>((resolve, reject) => {
      resolveSettlement = resolve;
      rejectSettlement = reject;
    });
    this.disposeSettlement = settlement;
    const firstDisposal = !this.disposedTerminal;
    if (firstDisposal) {
      this.disposedTerminal = true;
      this.lifecycleGeneration++;
      this.cancelPendingActivations();
    }
    this.state = 'disposed';
    const unpublishedActivations = this.unpublishedActivationPromises();
    const failedContexts = [...this.failedTeardownContexts];
    const closing = this.shutdownContext('dispose');
    const failedTeardowns = this.retryFailedTeardownContexts(failedContexts);
    const obligations: Promise<unknown>[] = [
      closing,
      ...unpublishedActivations,
      ...failedTeardowns,
    ];
    if (this.muteSettlement) obligations.push(this.muteSettlement);
    const operation = Promise.all(obligations).then(() => {
      this.clearCache();
      this.cooldowns.clear();
      this.state = 'disposed';
    });
    const clear = (): void => {
      if (this.disposeSettlement === settlement) this.disposeSettlement = null;
    };
    void settlement.then(clear, clear);
    void operation.then(resolveSettlement, rejectSettlement);
    return settlement;
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

  private cancelVoiceDeadline(): void {
    const wake = this.deadlineWake;
    this.deadlineWake = null; // stale callbacks lose ownership before injected cancellation.
    if (wake?.cancel) wake.cancel();
  }

  private failVoiceDeadline(error: unknown): void {
    this.deadlineFailed = true;
    this.recordFault('voice-watchdog', error);
    try { this.cancelVoiceDeadline(); } catch (cancelError) {
      this.recordFault('voice-watchdog-cancel', cancelError);
    }
    for (const voice of [...this.active.values()]) {
      if (voice.expiresAtMs !== null) this.finishVoice(voice.id, 'watchdog');
    }
  }

  private reconcileVoiceDeadline(): void {
    this.deadlineDirty = true;
    if (this.deadlineReconciling) return;
    this.deadlineReconciling = true;
    try {
      // Reentrant source/cancellation adapters may change the set. Bound convergence,
      // as with category mix ownership, rather than recursively scheduling callbacks.
      for (let pass = 0; pass < 12; pass++) {
        this.deadlineDirty = false;
        if (this.isDisposed() || this.muted || this.hidden || !this.context) {
          this.cancelVoiceDeadline();
          return;
        }
        const bounded = [...this.active.values()].filter((voice) => voice.expiresAtMs !== null);
        if (bounded.length === 0) {
          this.cancelVoiceDeadline();
          if (this.deadlineDirty) continue;
          return;
        }
        if (this.deadlineFailed || !this.scheduleVoiceDeadline) {
          throw new Error('audio voice watchdog is unavailable');
        }
        const now = this.readMonotonicNow();
        if (this.deadlineDirty) continue;
        const expired = bounded.filter((voice) => voice.expiresAtMs! <= now);
        if (expired.length) {
          for (const voice of expired) this.finishVoice(voice.id, 'watchdog');
          continue;
        }
        const expiresAtMs = Math.min(...bounded.map((voice) => voice.expiresAtMs!));
        if (this.deadlineWake?.expiresAtMs === expiresAtMs) return;
        this.cancelVoiceDeadline();
        if (this.deadlineDirty) continue;
        const wake: VoiceDeadlineWake = { expiresAtMs, cancel: null, arming: true };
        this.deadlineWake = wake;
        let synchronousWake = false;
        const cancel = this.scheduleVoiceDeadline(() => {
          if (this.deadlineWake !== wake) return;
          if (wake.arming) { synchronousWake = true; return; }
          this.deadlineWake = null;
          this.reconcileVoiceDeadline();
        }, Math.min(2_147_483_647, Math.ceil(expiresAtMs - now)));
        wake.arming = false;
        if (typeof cancel !== 'function') throw new TypeError('audio watchdog cancellation is missing');
        wake.cancel = cancel;
        if (synchronousWake) throw new Error('audio watchdog scheduler called synchronously');
        if (this.deadlineWake !== wake) cancel();
        if (!this.deadlineDirty) return;
      }
      throw new Error('audio voice watchdog ownership did not settle');
    } catch (error) {
      this.failVoiceDeadline(error);
    } finally {
      this.deadlineReconciling = false;
    }
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

  private voiceMixFactors(
    additionalIntent: AudioVoiceMixIntentV1 | null = null,
    excludedVoiceId: string | null = null,
  ): Readonly<Record<AudioCategory, number>> {
    const factors = Object.fromEntries(
      AUDIO_CATEGORIES.map((name) => [name, 1]),
    ) as Record<AudioCategory, number>;
    const apply = (intent: AudioVoiceMixIntentV1): void => {
      for (const name of AUDIO_CATEGORIES) {
        factors[name] = Math.min(factors[name], intent.factors[name]);
      }
    };
    for (const voice of this.active.values()) {
      if (voice.id !== excludedVoiceId) apply(voice.mixIntent);
    }
    if (additionalIntent) apply(additionalIntent);
    return Object.freeze(factors);
  }

  private effectiveCategoryGains(
    factors: Readonly<Record<AudioCategory, number>>,
  ): Readonly<Record<AudioCategory, number>> {
    return Object.freeze(Object.fromEntries(AUDIO_CATEGORIES.map((name) => [
      name,
      this.gains[name] * factors[name],
    ]))) as Readonly<Record<AudioCategory, number>>;
  }

  private writeCategoryMixTarget(
    factors: Readonly<Record<AudioCategory, number>>,
    previousFactors: Readonly<Record<AudioCategory, number>> | null,
    categories: readonly AudioCategory[],
    expectedGeneration: number,
  ): CategoryMixWriteResult {
    if (this.categoryMixApplying) {
      this.categoryMixDirty = true;
      return Object.freeze({ kind: 'reentrant' });
    }
    const context = this.context;
    const graph = this.graph;
    if (!context || !graph) return Object.freeze({ kind: 'applied' });
    const targetGains = this.effectiveCategoryGains(factors);
    this.categoryMixApplying = true;
    this.categoryMixDirty = false;
    try {
      for (const name of categories) {
        if (previousFactors && previousFactors[name] === factors[name]) continue;
        if (this.categoryMixDirty || this.categoryPolicyGeneration !== expectedGeneration
          || this.context !== context || this.graph !== graph) {
          return Object.freeze({ kind: 'reentrant' });
        }
        setParam(
          graph.categories[name].gain,
          targetGains[name],
          context.currentTime,
        );
        if (this.categoryMixDirty || this.categoryPolicyGeneration !== expectedGeneration
          || this.context !== context || this.graph !== graph) {
          return Object.freeze({ kind: 'reentrant' });
        }
      }
      return Object.freeze({ kind: 'applied' });
    } catch (error) {
      return Object.freeze({ kind: 'failed', error });
    } finally {
      this.categoryMixApplying = false;
    }
  }

  private reconcileCurrentCategoryMix(
    previousFactors: Readonly<Record<AudioCategory, number>> | null,
    categories: readonly AudioCategory[] = AUDIO_CATEGORIES,
  ): boolean {
    if (this.categoryMixApplying) {
      this.categoryMixDirty = true;
      return true;
    }
    let comparison = previousFactors;
    let selected = categories;
    let firstFailure: unknown = null;
    for (let pass = 0; pass < MAX_CATEGORY_MIX_PASSES; pass++) {
      const generation = this.categoryPolicyGeneration;
      const result = this.writeCategoryMixTarget(
        this.voiceMixFactors(),
        comparison,
        selected,
        generation,
      );
      if (result.kind === 'applied') return true;
      if (result.kind === 'failed' && firstFailure === null) {
        firstFailure = result.error;
        this.recordFault('category-mix-gain', result.error);
      }
      /* An earlier setter may already have published part of a stale target,
         or may have thrown after mutating its AudioParam. The next pass writes
         every bus from one fresh generation instead of resuming mid-snapshot. */
      comparison = null;
      selected = AUDIO_CATEGORIES;
    }
    this.quarantineCategoryMixer(firstFailure ?? new Error('category mix reentrancy did not settle'));
    return false;
  }

  private applyProspectiveCategoryMix(
    factors: Readonly<Record<AudioCategory, number>>,
    previousFactors: Readonly<Record<AudioCategory, number>>,
  ): boolean {
    if (this.categoryMixApplying) {
      this.categoryMixDirty = true;
      this.recordFault('category-mix-reentrant', new Error('prospective category mix was reentrant'));
      return false;
    }
    const generation = this.categoryPolicyGeneration;
    const result = this.writeCategoryMixTarget(
      factors,
      previousFactors,
      AUDIO_CATEGORIES,
      generation,
    );
    if (result.kind === 'applied') return true;
    if (result.kind === 'failed') this.recordFault('category-mix-gain', result.error);
    else this.recordFault(
      'category-mix-reentrant',
      new Error('prospective category mix policy changed during admission'),
    );
    /* Admission never proceeds on a partial/stale write. Restore the exact
       current owners and saved bases; a persistent setter failure quarantines
       the whole graph through reconcileCurrentCategoryMix(). */
    this.reconcileCurrentCategoryMix(null);
    return false;
  }

  private quarantineCategoryMixer(error: unknown): void {
    const context = this.context;
    if (!context || !this.graph) return;
    this.recordFault('category-mix-quarantine', error);
    this.state = 'suspended';
    void this.shutdownContext('stale-activation', context);
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

  private async settleMasterMute(
    lifecycle: number,
    prior: Promise<void> | null,
    unpublishedActivations: readonly Promise<AudioActivationResult>[],
    closing: Promise<void>,
    failedTeardowns: readonly Promise<void>[],
  ): Promise<void> {
    /* These are context-specific teardown obligations. A later unmute or
       lifecycle generation may change final policy, but cannot cancel closing
       the context that observed this mute. */
    const obligations: Promise<unknown>[] = [
      closing,
      ...unpublishedActivations,
      ...failedTeardowns,
    ];
    if (prior) obligations.push(prior);
    await Promise.all(obligations);
    if (!this.isDisposed() && lifecycle === this.lifecycleGeneration && this.muted) {
      this.state = this.hidden ? 'suspended' : 'blocked';
    }
  }

  private unpublishedActivationPromises(): readonly Promise<AudioActivationResult>[] {
    const pending: Promise<AudioActivationResult>[] = [];
    for (const record of this.pendingActivations) {
      if (!record.published && record.promise) pending.push(record.promise);
    }
    return pending;
  }

  private retryFailedTeardownContexts(
    contexts: readonly AudioContextLike[] = [...this.failedTeardownContexts],
  ): readonly Promise<void>[] {
    return contexts.map((context) => this.closeContext(context));
  }

  private cancelActivationsForContext(
    context: AudioContextLike,
  ): readonly Promise<AudioActivationResult>[] {
    const pending: Promise<AudioActivationResult>[] = [];
    for (const record of this.pendingActivations) {
      if (record.context !== context) continue;
      record.cancel();
      if (record.promise) pending.push(record.promise);
    }
    return pending;
  }

  private cancelPendingActivations(): void {
    for (const record of this.pendingActivations) record.cancel();
  }

  private activationResultForCurrentPolicy(): AudioActivationResult {
    if (this.isDisposed()) return Object.freeze({ kind: 'disposed' });
    if (this.hidden) {
      if (!this.context) this.state = 'suspended';
      return Object.freeze({ kind: 'suspended', reason: 'hidden' });
    }
    if (!this.context) this.state = 'blocked';
    return this.muted
      ? Object.freeze({ kind: 'blocked', reason: 'muted' })
      : Object.freeze({ kind: 'blocked', reason: 'context-unavailable' });
  }

  private async closeUnpublishedContext(
    context: AudioContextLike,
    graph: RuntimeGraph,
  ): Promise<void> {
    this.disconnectOwned(graph.nodes, 'graph-disconnect');
    await this.closeContext(context);
  }

  private closeContext(context: AudioContextLike): Promise<void> {
    if (context.state === 'closed') {
      this.failedTeardownContexts.delete(context);
      return Promise.resolve();
    }
    const existing = this.closeSettlements.get(context);
    if (existing) return existing;
    let resolveSettlement!: () => void;
    const settlement = new Promise<void>((resolve) => {
      resolveSettlement = resolve;
    });
    this.closeSettlements.set(context, settlement);
    let settled = false;
    const finish = (error?: unknown): void => {
      if (settled) return;
      settled = true;
      if (error !== undefined) this.recordFault('context-close', error);
      if (context.state === 'closed') this.failedTeardownContexts.delete(context);
      else this.failedTeardownContexts.add(context);
      if (this.closeSettlements.get(context) === settlement) {
        this.closeSettlements.delete(context);
      }
      resolveSettlement();
    };
    let pending: Promise<void>;
    try {
      pending = context.close();
    } catch (error) {
      finish(error);
      return settlement;
    }
    void Promise.resolve(pending).then(() => {
      if (context.state !== 'closed') {
        finish(new Error(`audio context close resolved in ${context.state}`));
        return;
      }
      finish();
    }, finish);
    return settlement;
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
      this.state = 'suspended';
      const detached = this.detachContextOwnership('context-loss', context);
      if (lostState !== 'closed') {
        void this.closeContext(context);
      }
      if (detached) void this.settleCancelledActivations(detached.activations);
      return;
    }
    this.state = 'blocked';
  }

  private async shutdownContext(
    reason: 'mute' | 'hidden' | 'dispose' | 'stale-activation',
    expectedContext?: AudioContextLike,
  ): Promise<void> {
    const detached = this.detachContextOwnership(reason, expectedContext);
    if (!detached) return;
    const obligations: Promise<unknown>[] = [];
    if (detached.context) obligations.push(this.closeContext(detached.context));
    /* A stale activation cannot await its own public promise. External
       lifecycle owners do await cancellation so their settled result leaves
       no retained activation record, even when resume never resolves. */
    if (reason !== 'stale-activation') {
      obligations.push(this.settleCancelledActivations(detached.activations));
    }
    await Promise.all(obligations);
  }

  private detachContextOwnership(
    reason: 'mute' | 'hidden' | 'dispose' | 'stale-activation' | 'context-loss',
    expectedContext?: AudioContextLike,
  ): Readonly<{
    context: AudioContextLike | null;
    activations: readonly Promise<AudioActivationResult>[];
  }> | null {
    if (expectedContext && this.context !== expectedContext) return null;
    const context = this.context;
    const graph = this.graph;
    if (context) this.detachStateListener(context);
    this.context = null;
    this.graph = null;
    this.resumeBlocked = false;
    const activations = context ? this.cancelActivationsForContext(context) : [];
    /* Detach both context and graph before any injected release/stop callback.
       A reentrant unmute + activate can then publish only a new graph, never
       the context this lifecycle owner is about to close. */
    this.clearCache();
    this.stopAllVoices(reason);
    if (graph) this.disconnectOwned(graph.nodes, 'graph-disconnect');
    return Object.freeze({ context, activations: Object.freeze(activations) });
  }

  private async settleCancelledActivations(
    activations: readonly Promise<AudioActivationResult>[],
  ): Promise<void> {
    for (const activation of activations) {
      try {
        await activation;
      } catch (error) {
        this.recordFault('activation-shutdown', error);
      }
    }
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
    reason: 'natural' | 'manual' | 'stolen' | 'mute' | 'hidden' | 'dispose'
      | 'context-loss' | 'stale-activation' | 'watchdog',
    mixAlreadyApplied = false,
  ): void {
    const voice = this.active.get(id);
    if (!voice || voice.cleaned) return;
    const previousMixFactors = mixAlreadyApplied ? null : this.voiceMixFactors();
    voice.cleaned = true;
    this.active.delete(id);
    this.categoryPolicyGeneration++;
    if (previousMixFactors) this.reconcileCurrentCategoryMix(previousMixFactors);
    this.clearSourceEndedHandlers(voice.sources, 'voice-handler-clear');
    this.stopSources(voice.sources, 'voice-stop');
    this.disconnectOwned([voice.voiceGain, ...voice.nodes], 'voice-disconnect');
    if (reason === 'natural') this.voicesCompleted++;
    else {
      this.voicesStopped++;
      if (reason === 'stolen') this.voicesStolen++;
    }
    this.reconcileVoiceDeadline();
  }

  private stopAllVoices(
    reason: 'mute' | 'hidden' | 'dispose' | 'context-loss' | 'stale-activation',
  ): void {
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
