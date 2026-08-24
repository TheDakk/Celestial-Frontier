/* Pure Arc 7 audio-lab evidence. The lab consumes diagnostics from the real
   injected runtime but owns no AudioContext, timer, filesystem, browser, or
   content. Its certificate is intentionally narrow: two identical synthetic
   workload cycles prove package lifecycle/accounting plateau; browser bytes,
   device heat, listening, and unimplemented accessibility modes stay open. */
import { AUDIO_CATEGORIES } from './runtime.js';
import type {
  AudioActivationState,
  AudioCategory,
  AudioMeter,
  AudioRuntime,
  AudioRuntimeDiagnostics,
  AudioRuntimeFault,
} from './runtime.js';

export const AUDIO_SETTING_ACCESSIBILITY_DIAGNOSTICS = Object.freeze({
  masterMute: 'runtime-implemented',
  masterGain: 'runtime-implemented',
  categoryGains: 'runtime-implemented',
  meaningfulCounterpart: 'runtime-verifier-required',
  captions: 'app-integration-required',
  mono: 'not-implemented',
  dynamicRange: 'not-implemented',
  reducedIntensity: 'not-implemented',
  highFrequencyComfort: 'content-and-human-review-required',
} as const);

export const AUDIO_RESOURCE_MEASUREMENT_DIAGNOSTICS = Object.freeze({
  encodedBytes: 'measurement-required',
  decodedBytes: 'measurement-required',
  browserWarmPlateau: 'measurement-required',
  deviceHeatBattery: 'physical-device-required',
} as const);

export type AudioLabPhase =
  | 'pre-activation'
  | 'running-loaded'
  | 'hidden-clean'
  | 'restart-loaded'
  | 'disposed-clean';

export interface AudioLabSample {
  readonly phase: AudioLabPhase;
  readonly diagnostics: AudioRuntimeDiagnostics;
}

export interface AudioLabLifecycleAudit {
  readonly sampleCount: 5;
  readonly loadedCycles: 2;
  readonly contextGenerations: 2;
  readonly pureWarmPlateau: Readonly<{
    nodes: number;
    voices: number;
    creatureEmitters: number;
    cacheEntries: number;
  }>;
  readonly settingsAccessibility: typeof AUDIO_SETTING_ACCESSIBILITY_DIAGNOSTICS;
  readonly resourceMeasurement: typeof AUDIO_RESOURCE_MEASUREMENT_DIAGNOSTICS;
}

const REQUIRED_PHASES = Object.freeze([
  'pre-activation',
  'running-loaded',
  'hidden-clean',
  'restart-loaded',
  'disposed-clean',
] as const satisfies readonly AudioLabPhase[]);

const SAMPLE_KEYS = Object.freeze(['phase', 'diagnostics'] as const);
const DIAGNOSTIC_KEYS = Object.freeze([
  'state', 'contextState', 'contextGeneration', 'muted', 'hidden', 'gains',
  'nodes', 'cache', 'voices', 'creatureEmitters', 'cooldowns', 'reservations',
  'cleanup', 'peaks', 'faults',
] as const);
const GAIN_KEYS = Object.freeze(['master', 'effectiveMaster', 'categories'] as const);
const LEVEL_KEYS = Object.freeze(['active', 'peak', 'budget'] as const);
const CACHE_KEYS = Object.freeze(['active', 'peak', 'budget', 'evictions'] as const);
const VOICE_KEYS = Object.freeze([
  'active', 'peak', 'budget', 'ids', 'started', 'completed', 'stopped', 'stolen',
  'cooldownRejects', 'concurrencyRejects',
] as const);
const COOLDOWN_KEYS = Object.freeze(['active', 'budget'] as const);
const RESERVATION_KEYS = Object.freeze(['voices', 'nodes'] as const);
const RESERVATION_LEVEL_KEYS = Object.freeze([
  'active', 'peak', 'activePlusReservedPeak',
] as const);
const CLEANUP_KEYS = Object.freeze([
  'sourceStopFailures', 'nodeDisconnectFailures', 'cacheReleaseFailures',
] as const);
const FAULTS_KEYS = Object.freeze(['total', 'retained', 'budget'] as const);
const FAULT_KEYS = Object.freeze(['ordinal', 'kind', 'message'] as const);
const METERS = Object.freeze(['master', ...AUDIO_CATEGORIES] as const);
const ACTIVATION_STATES = Object.freeze([
  'blocked', 'suspended', 'running', 'disposed',
] as const satisfies readonly AudioActivationState[]);

function exactPlainData(
  value: unknown,
  expected: readonly string[],
  label: string,
): Readonly<Record<string, unknown>> {
  try {
    if (value === null || typeof value !== 'object' || Array.isArray(value)
      || Object.getPrototypeOf(value) !== Object.prototype) {
      throw new TypeError(`${label} must be an exact plain data object`);
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

function arrayValues(value: unknown, label: string): readonly unknown[] {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
      throw new TypeError(`${label} must be a dense plain array`);
    }
    const keys = Reflect.ownKeys(value);
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
    if (!lengthDescriptor || !Object.hasOwn(lengthDescriptor, 'value')
      || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0) {
      throw new TypeError(`${label} must have a data length`);
    }
    const expected = Array.from({ length: lengthDescriptor.value }, (_, index) => String(index));
    if (keys.length !== expected.length + 1 || !keys.includes('length')
      || expected.some((key) => !keys.includes(key))) {
      throw new TypeError(`${label} must be a dense plain array`);
    }
    return expected.map((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) {
        throw new TypeError(`${label}[${key}] must be an enumerable data property`);
      }
      return descriptor.value;
    });
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError(`${label} could not be inspected`);
  }
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new TypeError(`${label} must be boolean`);
  return value;
}

function finiteValue(value: unknown, label: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)
    || value < minimum || value > maximum) {
    throw new TypeError(`${label} is outside its finite range`);
  }
  return value;
}

function boundedString(value: unknown, label: string, maximum: number, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && value.length < 1) || value.length > maximum
    || value.normalize('NFC') !== value || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} is not a bounded canonical string`);
  }
  return value;
}

function canonicalLevel(value: unknown, label: string): Readonly<{
  active: number;
  peak: number;
  budget: number;
}> {
  const input = exactPlainData(value, LEVEL_KEYS, label);
  return Object.freeze({
    active: finiteCount(input.active, `${label} active`),
    peak: finiteCount(input.peak, `${label} peak`),
    budget: finiteCount(input.budget, `${label} budget`),
  });
}

function canonicalReservationLevel(value: unknown, label: string): Readonly<{
  active: number;
  peak: number;
  activePlusReservedPeak: number;
}> {
  const input = exactPlainData(value, RESERVATION_LEVEL_KEYS, label);
  return Object.freeze({
    active: finiteCount(input.active, `${label} active`),
    peak: finiteCount(input.peak, `${label} peak`),
    activePlusReservedPeak: finiteCount(
      input.activePlusReservedPeak,
      `${label} active plus reserved peak`,
    ),
  });
}

function canonicalFault(value: unknown, index: number, label: string): AudioRuntimeFault {
  const input = exactPlainData(value, FAULT_KEYS, `${label} retained fault ${index}`);
  return Object.freeze({
    ordinal: finiteCount(input.ordinal, `${label} retained fault ${index} ordinal`),
    kind: boundedString(input.kind, `${label} retained fault ${index} kind`, 128),
    message: boundedString(input.message, `${label} retained fault ${index} message`, 192, true),
  });
}

function canonicalDiagnostics(value: unknown, label: string): AudioRuntimeDiagnostics {
  const input = exactPlainData(value, DIAGNOSTIC_KEYS, label);
  if (!(ACTIVATION_STATES as readonly unknown[]).includes(input.state)) {
    throw new TypeError(`${label} state is invalid`);
  }
  const state = input.state as AudioActivationState;
  const contextState = input.contextState === null
    ? null
    : boundedString(input.contextState, `${label} context state`, 64);
  const contextGeneration = finiteCount(input.contextGeneration, `${label} context generation`);
  const muted = booleanValue(input.muted, `${label} muted`);
  const hidden = booleanValue(input.hidden, `${label} hidden`);

  const gainInput = exactPlainData(input.gains, GAIN_KEYS, `${label} gains`);
  const categoryInput = exactPlainData(
    gainInput.categories,
    AUDIO_CATEGORIES,
    `${label} category gains`,
  );
  const categories = Object.freeze(Object.fromEntries(AUDIO_CATEGORIES.map((name) => [
    name,
    finiteValue(categoryInput[name], `${label} ${name} gain`, 0, 1),
  ]))) as Readonly<Record<AudioCategory, number>>;
  const master = finiteValue(gainInput.master, `${label} master gain`, 0, 1);
  const effectiveMaster = finiteValue(
    gainInput.effectiveMaster,
    `${label} effective master gain`,
    0,
    1,
  );
  if (effectiveMaster !== (muted ? 0 : master)) {
    throw new RangeError(`${label} effective master gain contradicts mute policy`);
  }

  const nodes = canonicalLevel(input.nodes, `${label} nodes`);
  const cacheInput = exactPlainData(input.cache, CACHE_KEYS, `${label} cache`);
  const cache = Object.freeze({
    active: finiteCount(cacheInput.active, `${label} cache active`),
    peak: finiteCount(cacheInput.peak, `${label} cache peak`),
    budget: finiteCount(cacheInput.budget, `${label} cache budget`),
    evictions: finiteCount(cacheInput.evictions, `${label} cache evictions`),
  });
  const voiceInput = exactPlainData(input.voices, VOICE_KEYS, `${label} voices`);
  const ids = Object.freeze(arrayValues(voiceInput.ids, `${label} voice ids`).map((id, index) =>
    boundedString(id, `${label} voice id ${index}`, 128)));
  if (new Set(ids).size !== ids.length) throw new RangeError(`${label} voice ids contain duplicates`);
  const voices = Object.freeze({
    active: finiteCount(voiceInput.active, `${label} voices active`),
    peak: finiteCount(voiceInput.peak, `${label} voices peak`),
    budget: finiteCount(voiceInput.budget, `${label} voices budget`),
    ids,
    started: finiteCount(voiceInput.started, `${label} voices started`),
    completed: finiteCount(voiceInput.completed, `${label} voices completed`),
    stopped: finiteCount(voiceInput.stopped, `${label} voices stopped`),
    stolen: finiteCount(voiceInput.stolen, `${label} voices stolen`),
    cooldownRejects: finiteCount(
      voiceInput.cooldownRejects,
      `${label} cooldown rejects`,
    ),
    concurrencyRejects: finiteCount(
      voiceInput.concurrencyRejects,
      `${label} concurrency rejects`,
    ),
  });
  const creatureEmitters = canonicalLevel(
    input.creatureEmitters,
    `${label} creature emitters`,
  );
  const cooldownInput = exactPlainData(input.cooldowns, COOLDOWN_KEYS, `${label} cooldowns`);
  const cooldowns = Object.freeze({
    active: finiteCount(cooldownInput.active, `${label} cooldowns active`),
    budget: finiteCount(cooldownInput.budget, `${label} cooldowns budget`),
  });
  const reservationInput = exactPlainData(
    input.reservations,
    RESERVATION_KEYS,
    `${label} reservations`,
  );
  const reservations = Object.freeze({
    voices: canonicalReservationLevel(
      reservationInput.voices,
      `${label} voice reservations`,
    ),
    nodes: canonicalReservationLevel(
      reservationInput.nodes,
      `${label} node reservations`,
    ),
  });
  const cleanupInput = exactPlainData(input.cleanup, CLEANUP_KEYS, `${label} cleanup`);
  const cleanup = Object.freeze({
    sourceStopFailures: finiteCount(
      cleanupInput.sourceStopFailures,
      `${label} source stop failures`,
    ),
    nodeDisconnectFailures: finiteCount(
      cleanupInput.nodeDisconnectFailures,
      `${label} node disconnect failures`,
    ),
    cacheReleaseFailures: finiteCount(
      cleanupInput.cacheReleaseFailures,
      `${label} cache release failures`,
    ),
  });
  const peakInput = exactPlainData(input.peaks, METERS, `${label} peaks`);
  const peaks = Object.freeze(Object.fromEntries(METERS.map((meter) => [
    meter,
    finiteValue(peakInput[meter], `${label} ${meter} peak`, 0, 1),
  ]))) as Readonly<Record<AudioMeter, number>>;
  const faultInput = exactPlainData(input.faults, FAULTS_KEYS, `${label} faults`);
  const retained = Object.freeze(arrayValues(
    faultInput.retained,
    `${label} retained faults`,
  ).map((fault, index) => canonicalFault(fault, index, label)));
  const faults = Object.freeze({
    total: finiteCount(faultInput.total, `${label} fault total`),
    retained,
    budget: finiteCount(faultInput.budget, `${label} fault budget`),
  });

  return Object.freeze({
    state,
    contextState,
    contextGeneration,
    muted,
    hidden,
    gains: Object.freeze({ master, effectiveMaster, categories }),
    nodes,
    cache,
    voices,
    creatureEmitters,
    cooldowns,
    reservations,
    cleanup,
    peaks,
    faults,
  });
}

function canonicalSample(value: unknown, index: number): AudioLabSample {
  const input = exactPlainData(value, SAMPLE_KEYS, `audio lab sample ${index}`);
  if (!(REQUIRED_PHASES as readonly unknown[]).includes(input.phase)) {
    throw new TypeError(`audio lab sample ${index} phase is invalid`);
  }
  return Object.freeze({
    phase: input.phase as AudioLabPhase,
    diagnostics: canonicalDiagnostics(input.diagnostics, `audio lab sample ${index} diagnostics`),
  });
}

function readRuntimeDiagnostics(runtime: Pick<AudioRuntime, 'diagnostics'>): unknown {
  if (runtime === null || (typeof runtime !== 'object' && typeof runtime !== 'function')) {
    throw new TypeError('audio lab sample requires runtime diagnostics');
  }
  try {
    const visited = new Set<object>();
    let owner: object | null = runtime;
    while (owner !== null && !visited.has(owner)) {
      visited.add(owner);
      const descriptor = Object.getOwnPropertyDescriptor(owner, 'diagnostics');
      if (descriptor) {
        if (!Object.hasOwn(descriptor, 'value') || typeof descriptor.value !== 'function') {
          throw new TypeError('audio runtime diagnostics must be a data method');
        }
        return descriptor.value.call(runtime);
      }
      owner = Object.getPrototypeOf(owner);
    }
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError('audio runtime diagnostics could not be inspected');
  }
  throw new TypeError('audio runtime diagnostics method is missing');
}

function finiteCount(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer`);
  }
  return value as number;
}

function assertBoundedLevel(
  label: string,
  value: Readonly<{ active: number; peak: number; budget: number }>,
): void {
  const active = finiteCount(value.active, `${label} active`);
  const peak = finiteCount(value.peak, `${label} peak`);
  const budget = finiteCount(value.budget, `${label} budget`);
  if (budget < 1 || active > peak || peak > budget) {
    throw new RangeError(`${label} diagnostics exceed their declared budget`);
  }
}

function assertSampleBudgets(sample: AudioLabSample): void {
  const diagnostics = sample.diagnostics;
  assertBoundedLevel(`${sample.phase} nodes`, diagnostics.nodes);
  assertBoundedLevel(`${sample.phase} voices`, diagnostics.voices);
  assertBoundedLevel(`${sample.phase} creature emitters`, diagnostics.creatureEmitters);
  const cacheBudget = finiteCount(diagnostics.cache.budget, `${sample.phase} cache budget`);
  const cacheActive = finiteCount(diagnostics.cache.active, `${sample.phase} cache active`);
  const cachePeak = finiteCount(diagnostics.cache.peak, `${sample.phase} cache peak`);
  if (cacheActive > cachePeak || cachePeak > cacheBudget) {
    throw new RangeError(`${sample.phase} cache diagnostics exceed their declared budget`);
  }
  const cooldownActive = finiteCount(
    diagnostics.cooldowns.active,
    `${sample.phase} cooldown active`,
  );
  const cooldownBudget = finiteCount(
    diagnostics.cooldowns.budget,
    `${sample.phase} cooldown budget`,
  );
  if (cooldownActive > cooldownBudget) {
    throw new RangeError(`${sample.phase} cooldown diagnostics exceed their declared budget`);
  }
  const voiceReservations = diagnostics.reservations.voices;
  const nodeReservations = diagnostics.reservations.nodes;
  if (finiteCount(voiceReservations.active, `${sample.phase} reserved voices`)
      > finiteCount(voiceReservations.peak, `${sample.phase} peak reserved voices`)
    || finiteCount(
      voiceReservations.activePlusReservedPeak,
      `${sample.phase} voices plus reservations`,
    ) > diagnostics.voices.budget
    || finiteCount(nodeReservations.active, `${sample.phase} reserved nodes`)
      > finiteCount(nodeReservations.peak, `${sample.phase} peak reserved nodes`)
    || finiteCount(
      nodeReservations.activePlusReservedPeak,
      `${sample.phase} nodes plus reservations`,
    ) > diagnostics.nodes.budget) {
    throw new RangeError(`${sample.phase} reservation diagnostics exceed their declared budget`);
  }
  const retainedFaults = diagnostics.faults.retained.length;
  if (diagnostics.cache.budget < 1 || diagnostics.cooldowns.budget < 1
    || diagnostics.faults.budget < 1
    || diagnostics.voices.active !== diagnostics.voices.ids.length
    || diagnostics.voices.started !== diagnostics.voices.completed
      + diagnostics.voices.stopped + diagnostics.voices.active
    || diagnostics.voices.stolen > diagnostics.voices.stopped
    || diagnostics.creatureEmitters.active > diagnostics.voices.active
    || diagnostics.creatureEmitters.peak > diagnostics.voices.peak
    || retainedFaults > diagnostics.faults.budget
    || retainedFaults > diagnostics.faults.total) {
    throw new RangeError(`${sample.phase} audio accounting is incoherent`);
  }
  if (diagnostics.reservations.voices.activePlusReservedPeak
      < Math.max(diagnostics.voices.peak, diagnostics.reservations.voices.peak)
    || diagnostics.reservations.nodes.activePlusReservedPeak
      < Math.max(diagnostics.nodes.peak, diagnostics.reservations.nodes.peak)) {
    throw new RangeError(`${sample.phase} reservation diagnostics are incoherent`);
  }
  const cleanupFaults = diagnostics.cleanup.sourceStopFailures
    + diagnostics.cleanup.nodeDisconnectFailures
    + diagnostics.cleanup.cacheReleaseFailures;
  if (cleanupFaults > diagnostics.faults.total) {
    throw new RangeError(`${sample.phase} cleanup diagnostics exceed total faults`);
  }
  if (diagnostics.cleanup.sourceStopFailures !== 0
    || diagnostics.cleanup.nodeDisconnectFailures !== 0
    || diagnostics.cleanup.cacheReleaseFailures !== 0
    || diagnostics.faults.total !== 0) {
    throw new RangeError(`${sample.phase} is not a clean audio-lab sample`);
  }
}

function assertNoLiveOwners(sample: AudioLabSample): void {
  const diagnostics = sample.diagnostics;
  if (diagnostics.contextState !== null
    || diagnostics.nodes.active !== 0
    || diagnostics.voices.active !== 0
    || diagnostics.creatureEmitters.active !== 0
    || diagnostics.cache.active !== 0
    || diagnostics.cooldowns.active !== 0
    || diagnostics.reservations.voices.active !== 0
    || diagnostics.reservations.nodes.active !== 0) {
    throw new RangeError(`${sample.phase} retained an audio owner`);
  }
}

function assertLoaded(sample: AudioLabSample): void {
  const diagnostics = sample.diagnostics;
  if (diagnostics.state !== 'running' || diagnostics.contextState !== 'running'
    || diagnostics.hidden || diagnostics.muted
    || diagnostics.nodes.active < 1
    || diagnostics.voices.active < 1
    || diagnostics.creatureEmitters.active < 1
    || diagnostics.cache.active < 1
    || diagnostics.reservations.voices.active !== 0
    || diagnostics.reservations.nodes.active !== 0) {
    throw new RangeError(`${sample.phase} did not exercise a loaded running cycle`);
  }
}

/** Capture one immutable runtime diagnostic sample for a later pure audit. */
export function captureAudioLabSample(
  phase: AudioLabPhase,
  runtime: Pick<AudioRuntime, 'diagnostics'>,
): AudioLabSample {
  if (!(REQUIRED_PHASES as readonly string[]).includes(phase)) {
    throw new TypeError('audio lab sample requires a known phase and runtime diagnostics');
  }
  return Object.freeze({
    phase,
    diagnostics: canonicalDiagnostics(readRuntimeDiagnostics(runtime), `${phase} diagnostics`),
  });
}

/** Prove a clean two-cycle package trace without calling it browser/device
 * evidence or inventing encoded/decoded-byte ceilings. */
export function auditAudioLabLifecycleTrace(
  samples: readonly AudioLabSample[],
): AudioLabLifecycleAudit {
  const rawSamples = arrayValues(samples, 'audio lab trace');
  if (rawSamples.length !== REQUIRED_PHASES.length) {
    throw new RangeError(`audio lab trace requires exactly ${REQUIRED_PHASES.length} samples`);
  }
  const trace = Object.freeze(rawSamples.map(canonicalSample));
  for (const [index, phase] of REQUIRED_PHASES.entries()) {
    const sample = trace[index]!;
    if (sample.phase !== phase) {
      throw new TypeError(`audio lab sample ${index} must be ${phase}`);
    }
    assertSampleBudgets(sample);
  }

  const pre = trace[0]!;
  const first = trace[1]!;
  const hidden = trace[2]!;
  const restart = trace[3]!;
  const disposed = trace[4]!;

  const budgetShape = (sample: AudioLabSample): readonly number[] => [
    sample.diagnostics.nodes.budget,
    sample.diagnostics.voices.budget,
    sample.diagnostics.creatureEmitters.budget,
    sample.diagnostics.cache.budget,
    sample.diagnostics.cooldowns.budget,
    sample.diagnostics.faults.budget,
  ];
  const configuredBudgets = budgetShape(pre);
  if (trace.some((sample) => budgetShape(sample).some(
    (value, index) => value !== configuredBudgets[index],
  ))) {
    throw new RangeError('audio lab configured budgets changed across the trace');
  }

  const cumulativeValues = (sample: AudioLabSample): readonly number[] => {
    const diagnostics = sample.diagnostics;
    return [
      diagnostics.nodes.peak,
      diagnostics.voices.peak,
      diagnostics.creatureEmitters.peak,
      diagnostics.cache.peak,
      diagnostics.cache.evictions,
      diagnostics.voices.started,
      diagnostics.voices.completed,
      diagnostics.voices.stopped,
      diagnostics.voices.stolen,
      diagnostics.voices.cooldownRejects,
      diagnostics.voices.concurrencyRejects,
      diagnostics.reservations.voices.peak,
      diagnostics.reservations.voices.activePlusReservedPeak,
      diagnostics.reservations.nodes.peak,
      diagnostics.reservations.nodes.activePlusReservedPeak,
      diagnostics.cleanup.sourceStopFailures,
      diagnostics.cleanup.nodeDisconnectFailures,
      diagnostics.cleanup.cacheReleaseFailures,
      diagnostics.faults.total,
      ...METERS.map((meter) => diagnostics.peaks[meter]),
    ];
  };
  for (let index = 1; index < trace.length; index++) {
    const previous = cumulativeValues(trace[index - 1]!);
    const current = cumulativeValues(trace[index]!);
    if (current.some((value, valueIndex) => value < previous[valueIndex]!)) {
      throw new RangeError(`audio lab cumulative diagnostics regressed at sample ${index}`);
    }
  }

  if (pre.diagnostics.state !== 'blocked' || pre.diagnostics.hidden
    || pre.diagnostics.contextGeneration !== 0) {
    throw new RangeError('audio lab pre-activation state is not cold and blocked');
  }
  assertNoLiveOwners(pre);
  assertLoaded(first);
  if (first.diagnostics.contextGeneration !== 1) {
    throw new RangeError('audio lab first cycle did not own exactly one context generation');
  }
  if (hidden.diagnostics.state !== 'suspended' || !hidden.diagnostics.hidden
    || hidden.diagnostics.contextGeneration !== 1) {
    throw new RangeError('audio lab hidden cycle did not shut down explicitly');
  }
  assertNoLiveOwners(hidden);
  assertLoaded(restart);
  if (restart.diagnostics.contextGeneration !== 2) {
    throw new RangeError('audio lab restart did not create exactly one replacement context');
  }
  if (disposed.diagnostics.state !== 'disposed' || disposed.diagnostics.hidden
    || disposed.diagnostics.contextGeneration !== 2
    || disposed.diagnostics.cooldowns.active !== 0) {
    throw new RangeError('audio lab dispose cycle is not terminal and clean');
  }
  assertNoLiveOwners(disposed);

  const firstPeaks = [
    first.diagnostics.nodes.peak,
    first.diagnostics.voices.peak,
    first.diagnostics.creatureEmitters.peak,
    first.diagnostics.cache.peak,
  ] as const;
  const restartPeaks = [
    restart.diagnostics.nodes.peak,
    restart.diagnostics.voices.peak,
    restart.diagnostics.creatureEmitters.peak,
    restart.diagnostics.cache.peak,
  ] as const;
  const firstActive = [
    first.diagnostics.nodes.active,
    first.diagnostics.voices.active,
    first.diagnostics.creatureEmitters.active,
    first.diagnostics.cache.active,
    first.diagnostics.cooldowns.active,
  ] as const;
  const restartActive = [
    restart.diagnostics.nodes.active,
    restart.diagnostics.voices.active,
    restart.diagnostics.creatureEmitters.active,
    restart.diagnostics.cache.active,
    restart.diagnostics.cooldowns.active,
  ] as const;
  if (firstActive.some((value, index) => value !== restartActive[index])) {
    throw new RangeError('audio lab loaded workload changed between cycles');
  }
  if (firstPeaks.some((value, index) => value !== restartPeaks[index])) {
    throw new RangeError('audio lab synthetic workload did not plateau after warmup');
  }
  if (firstPeaks.some((value, index) => value !== firstActive[index])) {
    throw new RangeError('audio lab warmup peak does not describe its loaded workload');
  }

  return Object.freeze({
    sampleCount: 5,
    loadedCycles: 2,
    contextGenerations: 2,
    pureWarmPlateau: Object.freeze({
      nodes: restart.diagnostics.nodes.peak,
      voices: restart.diagnostics.voices.peak,
      creatureEmitters: restart.diagnostics.creatureEmitters.peak,
      cacheEntries: restart.diagnostics.cache.peak,
    }),
    settingsAccessibility: AUDIO_SETTING_ACCESSIBILITY_DIAGNOSTICS,
    resourceMeasurement: AUDIO_RESOURCE_MEASUREMENT_DIAGNOSTICS,
  });
}
