/* Living-species selected-detail pilot.

   This owner animates the already-reviewed 440px portrait as one bounded,
   presentation-only surface. It does not alter the portrait painter, anatomy,
   genome, gameplay RNG, or persistence. A later Canvas/Pixi adapter may
   implement the injected renderer seam; this foundation imports neither. */
import type { Portrait440 } from '@cf/art/species-broker';
import {
  snapshotSpeciesGenome,
  speciesVisualKey,
  type SpeciesVisualKey,
} from '@cf/art/species-identity';
import {
  FA_BODY,
  FUNGI_FORM,
  MICROBE_FORM,
  floraFormOf,
  locoOf,
} from '@cf/domain-speciestraits';

export const LIVING_SPECIES_MOTION_SCHEMA_V1 = 'cf.app.living-species-motion.v1' as const;
export const LIVING_SPECIES_PREVIEW_DIAGNOSTICS_SCHEMA_V1 =
  'cf.app.living-species-preview-diagnostics.v1' as const;

export type LivingSpeciesKingdomV1 = 'fauna' | 'flora' | 'fungi' | 'microbe';
export type LivingSpeciesMotionKindV1 = 'breathe' | 'sway' | 'pulse' | 'drift';

export interface LivingSpeciesMotionPlanV1 {
  readonly schema: typeof LIVING_SPECIES_MOTION_SCHEMA_V1;
  /** Complete canonical genome identity. A seed alone is never sufficient. */
  readonly identityKey: SpeciesVisualKey;
  readonly kingdom: LivingSpeciesKingdomV1;
  /** Presentation hint from the existing body/form tables; never gameplay state. */
  readonly anatomyCue: string;
  readonly locomotionCue: string | null;
  readonly primaryMotion: LivingSpeciesMotionKindV1;
  readonly channels: Readonly<{
    breathe: Readonly<{
      periodMs: number;
      phase: number;
      scaleY: number;
      liftPx: number;
    }>;
    sway: Readonly<{
      periodMs: number;
      phase: number;
      degrees: number;
      translateXPx: number;
    }>;
    pulse: Readonly<{
      periodMs: number;
      phase: number;
      scale: number;
      opacityDip: number;
    }>;
    drift: Readonly<{
      periodMs: number;
      phaseX: number;
      phaseY: number;
      translateXPx: number;
      translateYPx: number;
    }>;
  }>;
}

export interface LivingSpeciesMotionFrameV1 {
  readonly mode: 'static' | 'animated';
  readonly translateX: number;
  readonly translateY: number;
  readonly rotationDegrees: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly opacity: number;
}

interface MotionWeights {
  readonly primaryMotion: LivingSpeciesMotionKindV1;
  readonly breathe: number;
  readonly sway: number;
  readonly pulse: number;
  readonly drift: number;
}

const MOTION_PLANS = new WeakSet<object>();
const KINGDOMS = new Set<LivingSpeciesKingdomV1>(['fauna', 'flora', 'fungi', 'microbe']);
const TAU = Math.PI * 2;
const MAX_GENOME_KEY_LENGTH = 131_072;
const MAX_TICK_DELTA_MS = 100;

const STATIC_FRAME: LivingSpeciesMotionFrameV1 = Object.freeze({
  mode: 'static' as const,
  translateX: 0,
  translateY: 0,
  rotationDegrees: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
});

function checkedGenomeRecord(value: Record<string, unknown>): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('living species motion requires one genome object');
  }
  const snapshot = snapshotSpeciesGenome(value);
  const kingdom = snapshot.kingdom;
  if (typeof kingdom !== 'string' || !KINGDOMS.has(kingdom as LivingSpeciesKingdomV1)) {
    throw new TypeError('living species motion requires fauna, flora, fungi, or microbe');
  }
  for (const field of ['seed', 'form', 'body', 'loco'] as const) {
    const gene = snapshot[field];
    if (typeof gene !== 'number' || !Number.isSafeInteger(gene)) {
      throw new TypeError(`living species motion requires an integer ${field} gene`);
    }
  }
  const key = speciesVisualKey(snapshot);
  if (key.length < 1 || key.length > MAX_GENOME_KEY_LENGTH) {
    throw new RangeError('living species genome identity is outside the presentation bound');
  }
  return snapshot;
}

function positiveIndex(value: number, length: number): number {
  return ((value % length) + length) % length;
}

function namedGene(values: readonly string[], gene: number, fallback: string): string {
  return values[positiveIndex(gene, values.length)] ?? fallback;
}

function anatomyCues(genome: Record<string, unknown>): Readonly<{
  anatomyCue: string;
  locomotionCue: string | null;
}> {
  const kingdom = genome.kingdom as LivingSpeciesKingdomV1;
  const form = genome.form as number;
  if (kingdom === 'fauna') {
    return Object.freeze({
      anatomyCue: namedGene(FA_BODY, genome.body as number, 'fauna-body'),
      locomotionCue: locoOf(genome) || 'fauna-motion',
    });
  }
  if (kingdom === 'flora') {
    return Object.freeze({
      anatomyCue: floraFormOf(genome) || 'flora-growth',
      locomotionCue: null,
    });
  }
  if (kingdom === 'fungi') {
    return Object.freeze({
      anatomyCue: namedGene(FUNGI_FORM, form, 'fungal-growth'),
      locomotionCue: null,
    });
  }
  return Object.freeze({
    anatomyCue: namedGene(MICROBE_FORM, form, 'microbial-form'),
    locomotionCue: null,
  });
}

function motionWeights(
  kingdom: LivingSpeciesKingdomV1,
  anatomyCue: string,
  locomotionCue: string | null,
): MotionWeights {
  if (kingdom === 'fauna') {
    const drifting = /glider|swimmer|floater|drifter|jet-propelled|current/iu
      .test(locomotionCue ?? '');
    const flexible = /tentacled|serpentine|many-segmented|spindly|radially symmetric/iu
      .test(anatomyCue);
    const soft = /gelatinous|membranous/iu.test(anatomyCue);
    if (drifting) {
      return Object.freeze({
        primaryMotion: 'drift', breathe: 0.45, sway: 0.48, pulse: soft ? 0.6 : 0.18, drift: 0.92,
      });
    }
    if (flexible) {
      return Object.freeze({
        primaryMotion: 'sway', breathe: 0.38, sway: 0.94, pulse: 0.2, drift: 0.28,
      });
    }
    if (soft) {
      return Object.freeze({
        primaryMotion: 'pulse', breathe: 0.48, sway: 0.34, pulse: 0.86, drift: 0.3,
      });
    }
    return Object.freeze({
      primaryMotion: 'breathe', breathe: 0.88, sway: 0.38, pulse: 0.16, drift: 0.18,
    });
  }
  if (kingdom === 'flora') {
    if (/mat|moss|lichen|carpet|cushion|crystalline|needle/iu.test(anatomyCue)) {
      return Object.freeze({
        primaryMotion: 'pulse', breathe: 0.2, sway: 0.2, pulse: 0.68, drift: 0.1,
      });
    }
    if (/balloon|sail|vine|canopy/iu.test(anatomyCue)) {
      return Object.freeze({
        primaryMotion: 'sway', breathe: 0.24, sway: 0.9, pulse: 0.24, drift: 0.46,
      });
    }
    return Object.freeze({
      primaryMotion: 'sway', breathe: 0.22, sway: 0.82, pulse: 0.28, drift: 0.14,
    });
  }
  if (kingdom === 'fungi') {
    const spreading = /web|mat|terrace/iu.test(anatomyCue);
    return Object.freeze({
      primaryMotion: 'pulse',
      breathe: 0.18,
      sway: spreading ? 0.18 : 0.42,
      pulse: 0.84,
      drift: spreading ? 0.26 : 0.1,
    });
  }
  if (/swarm|plankton|bloom|colony|slime/iu.test(anatomyCue)) {
    return Object.freeze({
      primaryMotion: 'drift', breathe: 0.08, sway: 0.12, pulse: 0.72, drift: 0.94,
    });
  }
  return Object.freeze({
    primaryMotion: 'pulse', breathe: 0.08, sway: 0.08, pulse: 0.9, drift: 0.48,
  });
}

/** FNV-1a plus a full 32-bit avalanche. These values only vary presentation;
 * they are not SessionRNG/gameplay draws and cannot affect saved outcomes. */
function hashIdentity(identityKey: string): number {
  let value = 2_166_136_261;
  for (let index = 0; index < identityKey.length; index += 1) {
    value = Math.imul(value ^ identityKey.charCodeAt(index), 16_777_619) >>> 0;
  }
  return value;
}

function mix32(value: number): number {
  let mixed = value >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb_352d) >>> 0;
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846c_a68b) >>> 0;
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

function unit(base: number, salt: number): number {
  return mix32((base ^ salt) >>> 0) / 0x1_0000_0000;
}

function phase(base: number, salt: number): number {
  return Math.floor(unit(base, salt) * 4_096) / 4_096;
}

function period(base: number, salt: number, low: number, span: number): number {
  return low + Math.floor(unit(base, salt) * span);
}

function scaled(base: number, salt: number, low: number, span: number, weight: number): number {
  return (low + unit(base, salt) * span) * weight;
}

function projectFromSnapshot(genome: Record<string, unknown>): LivingSpeciesMotionPlanV1 {
  const identityKey = speciesVisualKey(genome);
  const kingdom = genome.kingdom as LivingSpeciesKingdomV1;
  const cues = anatomyCues(genome);
  const weights = motionWeights(kingdom, cues.anatomyCue, cues.locomotionCue);
  const base = hashIdentity(identityKey);
  const plan: LivingSpeciesMotionPlanV1 = Object.freeze({
    schema: LIVING_SPECIES_MOTION_SCHEMA_V1,
    identityKey,
    kingdom,
    anatomyCue: cues.anatomyCue,
    locomotionCue: cues.locomotionCue,
    primaryMotion: weights.primaryMotion,
    channels: Object.freeze({
      breathe: Object.freeze({
        periodMs: period(base, 0x11ad_b101, 3_200, 1_801),
        phase: phase(base, 0x11ad_b102),
        scaleY: scaled(base, 0x11ad_b103, 0.007, 0.005, weights.breathe),
        liftPx: scaled(base, 0x11ad_b104, 0.35, 0.45, weights.breathe),
      }),
      sway: Object.freeze({
        periodMs: period(base, 0x52a7_2101, 5_200, 2_801),
        phase: phase(base, 0x52a7_2102),
        degrees: scaled(base, 0x52a7_2103, 0.35, 0.65, weights.sway),
        translateXPx: scaled(base, 0x52a7_2104, 0.25, 0.55, weights.sway),
      }),
      pulse: Object.freeze({
        periodMs: period(base, 0x9a15_e101, 2_800, 2_401),
        phase: phase(base, 0x9a15_e102),
        scale: scaled(base, 0x9a15_e103, 0.003, 0.005, weights.pulse),
        opacityDip: scaled(base, 0x9a15_e104, 0.002, 0.003, weights.pulse),
      }),
      drift: Object.freeze({
        periodMs: period(base, 0xd21f_7101, 6_500, 3_501),
        phaseX: phase(base, 0xd21f_7102),
        phaseY: phase(base, 0xd21f_7103),
        translateXPx: scaled(base, 0xd21f_7104, 0.7, 1.5, weights.drift),
        translateYPx: scaled(base, 0xd21f_7105, 0.5, 1.2, weights.drift),
      }),
    }),
  });
  MOTION_PLANS.add(plan);
  return plan;
}

/** Build one deterministic motion identity from every field present in the
 * canonical genome. The returned plan has no mutable/gameplay authority. */
export function projectLivingSpeciesMotionV1(
  genomeValue: Record<string, unknown>,
): LivingSpeciesMotionPlanV1 {
  return projectFromSnapshot(checkedGenomeRecord(genomeValue));
}

export function isLivingSpeciesMotionPlanV1(value: unknown): value is LivingSpeciesMotionPlanV1 {
  return value !== null && typeof value === 'object' && MOTION_PLANS.has(value as object);
}

function oscillation(elapsedMs: number, periodMs: number, phase0: number): number {
  return Math.sin(TAU * ((elapsedMs / periodMs) + phase0));
}

function bounded(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/** Pure frame projection. Reduced Motion always returns the exact neutral
 * frame, independent of elapsed time and without starting a ticker. */
export function projectLivingSpeciesFrameV1(
  plan: LivingSpeciesMotionPlanV1,
  elapsedMs: number,
  reducedMotion = false,
): LivingSpeciesMotionFrameV1 {
  if (!isLivingSpeciesMotionPlanV1(plan)) {
    throw new TypeError('living species frame requires a registered motion plan');
  }
  if (typeof reducedMotion !== 'boolean') {
    throw new TypeError('living species Reduced Motion state must be boolean');
  }
  if (reducedMotion) return STATIC_FRAME;
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError('living species elapsed time must be finite and non-negative');
  }
  const { breathe, sway, pulse, drift } = plan.channels;
  const breatheWave = oscillation(elapsedMs, breathe.periodMs, breathe.phase);
  const swayWave = oscillation(elapsedMs, sway.periodMs, sway.phase);
  const pulseWave = oscillation(elapsedMs, pulse.periodMs, pulse.phase);
  const driftXWave = oscillation(elapsedMs, drift.periodMs, drift.phaseX);
  const driftYWave = oscillation(elapsedMs, drift.periodMs * 1.13, drift.phaseY);
  const pulseLift = (pulseWave + 1) / 2;
  return Object.freeze({
    mode: 'animated' as const,
    translateX: rounded(bounded(
      swayWave * sway.translateXPx + driftXWave * drift.translateXPx,
      -3,
      3,
    )),
    translateY: rounded(bounded(
      -breatheWave * breathe.liftPx + driftYWave * drift.translateYPx,
      -2.6,
      2.6,
    )),
    rotationDegrees: rounded(bounded(swayWave * sway.degrees, -1, 1)),
    scaleX: rounded(bounded(
      1 - breatheWave * breathe.scaleY * 0.2 + pulseWave * pulse.scale,
      0.98,
      1.02,
    )),
    scaleY: rounded(bounded(
      1 + breatheWave * breathe.scaleY + pulseWave * pulse.scale,
      0.98,
      1.02,
    )),
    opacity: rounded(bounded(1 - pulseLift * pulse.opacityDip, 0.99, 1)),
  });
}

export interface LivingSpeciesPreviewEnvironmentV1 {
  snapshot(): Readonly<{
    connected: boolean;
    visible: boolean;
    reducedMotion: boolean;
  }>;
  subscribe(listener: () => void): () => void;
}

export interface LivingSpeciesPreviewTickerV1 {
  /** Delta is presentation time supplied by the existing app ticker. */
  subscribe(listener: (deltaMs: number) => void): () => void;
}

export type LivingSpeciesPortraitListenerV1 = (asset: Portrait440 | null, error?: unknown) => void;

export interface LivingSpeciesPortraitRequestV1 {
  readonly key: SpeciesVisualKey;
  readonly current: Portrait440 | null;
  cancel(): void;
}

export type LivingSpeciesPortraitRequesterV1 = (
  owner: string,
  genome: Record<string, unknown>,
  listener: LivingSpeciesPortraitListenerV1,
) => LivingSpeciesPortraitRequestV1;

export interface LivingSpeciesPreviewRendererV1 {
  readonly identityKey: SpeciesVisualKey;
  /** Exactly one existing image OR one future canvas/texture is owned. */
  readonly resourceKind: 'image' | 'canvas' | 'texture';
  /** Attach the already-prepared candidate to the current selected detail. */
  attach(): void;
  draw(frame: LivingSpeciesMotionFrameV1): void;
  destroy(): void;
}

export type LivingSpeciesPreviewRendererFactoryV1 = (
  asset: Portrait440,
  plan: LivingSpeciesMotionPlanV1,
  generation: number,
) => LivingSpeciesPreviewRendererV1;

export interface LivingSpeciesPreviewControllerOptionsV1 {
  readonly owner: string;
  readonly requestPortrait: LivingSpeciesPortraitRequesterV1;
  readonly createRenderer: LivingSpeciesPreviewRendererFactoryV1;
  readonly ticker: LivingSpeciesPreviewTickerV1;
  readonly environment: LivingSpeciesPreviewEnvironmentV1;
  readonly onFault?: (error: Error) => void;
}

export interface LivingSpeciesPreviewSelectionV1 {
  readonly generation: number;
  readonly identityKey: SpeciesVisualKey;
  readonly plan: LivingSpeciesMotionPlanV1;
}

export interface LivingSpeciesPreviewDiagnosticsV1 {
  readonly schema: typeof LIVING_SPECIES_PREVIEW_DIAGNOSTICS_SCHEMA_V1;
  readonly state: 'idle' | 'waiting' | 'loading' | 'paused' | 'static' | 'animating' | 'error' | 'disposed';
  readonly generation: number;
  readonly identityKey: SpeciesVisualKey | null;
  readonly kingdom: LivingSpeciesKingdomV1 | null;
  readonly primaryMotion: LivingSpeciesMotionKindV1 | null;
  readonly live: Readonly<{
    portraitRequestCount: 0 | 1;
    acceptedAssetCount: 0 | 1;
    rendererCount: 0 | 1;
    imageCount: 0 | 1;
    textureCount: 0 | 1;
    canvasCount: 0 | 1;
    tickerCount: 0 | 1;
  }>;
  readonly totals: Readonly<{
    selections: number;
    portraitRequests: number;
    portraitCancellations: number;
    rendererCreates: number;
    rendererAttaches: number;
    rendererDestroys: number;
    tickerStarts: number;
    tickerStops: number;
    animatedFrames: number;
    staticFrames: number;
    staleCompletionDrops: number;
    invalidCompletions: number;
    hiddenStops: number;
    detachedStops: number;
    faults: number;
  }>;
  readonly peaks: Readonly<{
    rendererCount: 0 | 1;
    imageCount: 0 | 1;
    textureCount: 0 | 1;
    canvasCount: 0 | 1;
    tickerCount: 0 | 1;
  }>;
}

interface OwnedRenderer {
  readonly handle: LivingSpeciesPreviewRendererV1;
  readonly resourceKind: LivingSpeciesPreviewRendererV1['resourceKind'];
  attached: boolean;
}

interface ActiveSelection {
  readonly publicSelection: LivingSpeciesPreviewSelectionV1;
  readonly genome: Record<string, unknown>;
  requestStarted: boolean;
  requestEpoch: number;
  requestCancel: (() => void) | null;
  acceptedAsset: Portrait440 | null;
  renderer: OwnedRenderer | null;
  elapsedMs: number;
  failed: boolean;
}

type EnvironmentSnapshot = ReturnType<LivingSpeciesPreviewEnvironmentV1['snapshot']>;

function checkedEnvironment(value: EnvironmentSnapshot): EnvironmentSnapshot {
  if (value === null || typeof value !== 'object'
    || typeof value.connected !== 'boolean'
    || typeof value.visible !== 'boolean'
    || typeof value.reducedMotion !== 'boolean'
    || (value.visible && !value.connected)) {
    throw new TypeError('living species preview environment returned an invalid snapshot');
  }
  return Object.freeze({
    connected: value.connected,
    visible: value.visible,
    reducedMotion: value.reducedMotion,
  });
}

function once(effect: () => void): () => void {
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    effect();
  };
}

function errorOf(value: unknown, fallback: string): Error {
  return value instanceof Error ? value : new Error(
    typeof value === 'string' && value ? value : fallback,
  );
}

function validPortrait(asset: Portrait440, identityKey: SpeciesVisualKey): boolean {
  return asset !== null && typeof asset === 'object'
    && String(asset.key) === String(identityKey)
    && typeof asset.url === 'string' && asset.url.length > 0
    && asset.width === 440 && asset.height === 440
    && Number.isSafeInteger(asset.encodedBytes) && asset.encodedBytes > 0
    && asset.decodedPixels === 440 * 440;
}

/** One selected-detail owner. All browser/renderer mechanics are injected so
 * lifecycle and stale-result behavior remain browser-free testable. */
export class LivingSpeciesPreviewControllerV1 {
  readonly #options: LivingSpeciesPreviewControllerOptionsV1;
  readonly #environmentRelease: () => void;
  readonly #destroyedRenderers = new WeakSet<object>();
  #current: ActiveSelection | null = null;
  #lastEnvironment: EnvironmentSnapshot;
  #generation = 0;
  #tickerRelease: (() => void) | null = null;
  #tickerLive = false;
  #tickerToken = 0;
  #creatingRenderer = false;
  #disposed = false;
  readonly #totals = {
    selections: 0,
    portraitRequests: 0,
    portraitCancellations: 0,
    rendererCreates: 0,
    rendererAttaches: 0,
    rendererDestroys: 0,
    tickerStarts: 0,
    tickerStops: 0,
    animatedFrames: 0,
    staticFrames: 0,
    staleCompletionDrops: 0,
    invalidCompletions: 0,
    hiddenStops: 0,
    detachedStops: 0,
    faults: 0,
  };
  readonly #peaks = {
    rendererCount: 0 as 0 | 1,
    imageCount: 0 as 0 | 1,
    textureCount: 0 as 0 | 1,
    canvasCount: 0 as 0 | 1,
    tickerCount: 0 as 0 | 1,
  };

  constructor(options: LivingSpeciesPreviewControllerOptionsV1) {
    if (!options || typeof options !== 'object') {
      throw new TypeError('living species preview options are required');
    }
    if (typeof options.owner !== 'string' || options.owner.length < 1 || options.owner.length > 128) {
      throw new TypeError('living species preview owner must be a bounded non-empty string');
    }
    if (typeof options.requestPortrait !== 'function'
      || typeof options.createRenderer !== 'function'
      || !options.ticker || typeof options.ticker.subscribe !== 'function'
      || !options.environment || typeof options.environment.snapshot !== 'function'
      || typeof options.environment.subscribe !== 'function'
      || (options.onFault !== undefined && typeof options.onFault !== 'function')) {
      throw new TypeError('living species preview dependencies must be callable');
    }
    this.#options = options;
    this.#lastEnvironment = checkedEnvironment(options.environment.snapshot());
    const release = options.environment.subscribe(this.#onEnvironmentChange);
    if (typeof release !== 'function') {
      throw new TypeError('living species environment subscription must return cleanup');
    }
    this.#environmentRelease = once(release);
  }

  select(genomeValue: Record<string, unknown>): LivingSpeciesPreviewSelectionV1 {
    this.#assertLive();
    const genome = checkedGenomeRecord(genomeValue);
    const environment = checkedEnvironment(this.#options.environment.snapshot());
    if (!environment.connected) {
      this.#lastEnvironment = environment;
      if (this.#current !== null) this.#totals.detachedStops++;
      this.#releaseCurrent('detached-select');
      throw new Error('living species preview target is detached');
    }
    const plan = projectFromSnapshot(genome);
    this.#releaseCurrent('replace');
    const publicSelection: LivingSpeciesPreviewSelectionV1 = Object.freeze({
      generation: ++this.#generation,
      identityKey: plan.identityKey,
      plan,
    });
    this.#current = {
      publicSelection,
      genome,
      requestStarted: false,
      requestEpoch: 0,
      requestCancel: null,
      acceptedAsset: null,
      renderer: null,
      elapsedMs: 0,
      failed: false,
    };
    this.#totals.selections++;
    this.#lastEnvironment = environment;
    this.#reconcile(environment);
    return publicSelection;
  }

  close(): void {
    if (this.#disposed) return;
    this.#releaseCurrent('close');
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#releaseCurrent('dispose');
    this.#environmentRelease();
    this.#disposed = true;
  }

  diagnostics(): LivingSpeciesPreviewDiagnosticsV1 {
    const renderer = this.#current?.renderer ?? null;
    const state: LivingSpeciesPreviewDiagnosticsV1['state'] = this.#disposed ? 'disposed'
      : this.#current === null ? 'idle'
        : this.#current.failed ? 'error'
          : !this.#lastEnvironment.visible ? 'paused'
            : renderer === null
              ? this.#current.requestStarted ? 'loading' : 'waiting'
              : this.#lastEnvironment.reducedMotion ? 'static'
                : this.#tickerLive ? 'animating' : 'waiting';
    return Object.freeze({
      schema: LIVING_SPECIES_PREVIEW_DIAGNOSTICS_SCHEMA_V1,
      state,
      generation: this.#generation,
      identityKey: this.#current?.publicSelection.identityKey ?? null,
      kingdom: this.#current?.publicSelection.plan.kingdom ?? null,
      primaryMotion: this.#current?.publicSelection.plan.primaryMotion ?? null,
      live: Object.freeze({
        portraitRequestCount: this.#current?.requestStarted ? 1 as const : 0 as const,
        acceptedAssetCount: this.#current?.acceptedAsset ? 1 as const : 0 as const,
        rendererCount: renderer ? 1 as const : 0 as const,
        imageCount: renderer?.resourceKind === 'image' ? 1 as const : 0 as const,
        textureCount: renderer?.resourceKind === 'texture' ? 1 as const : 0 as const,
        canvasCount: renderer?.resourceKind === 'canvas' ? 1 as const : 0 as const,
        tickerCount: this.#tickerLive ? 1 as const : 0 as const,
      }),
      totals: Object.freeze({ ...this.#totals }),
      peaks: Object.freeze({ ...this.#peaks }),
    });
  }

  readonly #onEnvironmentChange = (): void => {
    if (this.#disposed) return;
    try {
      const environment = checkedEnvironment(this.#options.environment.snapshot());
      this.#lastEnvironment = environment;
      this.#reconcile(environment);
    } catch (error) {
      this.#recordFault(errorOf(error, 'living species environment failed'));
      this.#releaseCurrent('environment-fault');
    }
  };

  #assertLive(): void {
    if (this.#disposed) throw new Error('living species preview controller is disposed');
  }

  #reconcile(environment: EnvironmentSnapshot): void {
    const active = this.#current;
    if (active === null) return;
    if (!environment.connected) {
      this.#totals.detachedStops++;
      this.#releaseCurrent('detached');
      return;
    }
    if (!environment.visible) {
      if (this.#tickerLive) this.#totals.hiddenStops++;
      this.#stopTicker();
      if (active.renderer === null && active.acceptedAsset === null) this.#cancelRequest(active);
      return;
    }
    if (active.failed) return;
    if (active.renderer !== null) {
      if (environment.reducedMotion) {
        this.#stopTicker();
        this.#draw(active, true);
      } else {
        this.#draw(active, false);
        this.#startTicker(active);
      }
      return;
    }
    if (active.acceptedAsset !== null) {
      this.#attachAcceptedAsset(active, environment);
      return;
    }
    if (!active.requestStarted) this.#requestPortrait(active);
  }

  #requestPortrait(active: ActiveSelection): void {
    if (this.#current !== active || active.requestStarted || active.failed) return;
    active.requestStarted = true;
    const requestEpoch = ++active.requestEpoch;
    this.#totals.portraitRequests++;
    let returned = false;
    let synchronousOverflow = false;
    const synchronous: Array<Readonly<{ asset: Portrait440 | null; error?: unknown }>> = [];
    const listener: LivingSpeciesPortraitListenerV1 = (asset, error) => {
      if (!returned) {
        if (synchronous.length >= 2) synchronousOverflow = true;
        else synchronous.push(error === undefined ? { asset } : { asset, error });
        return;
      }
      this.#receivePortrait(active, requestEpoch, asset, error);
    };
    let request: LivingSpeciesPortraitRequestV1;
    try {
      request = this.#options.requestPortrait(
        this.#options.owner,
        active.genome,
        listener,
      );
    } catch (error) {
      returned = true;
      if (this.#current === active && active.requestEpoch === requestEpoch) {
        this.#failActive(active, errorOf(error, 'living species portrait request failed'));
      } else {
        this.#totals.staleCompletionDrops++;
      }
      return;
    }
    returned = true;
    const rawCancel = request !== null && typeof request === 'object'
      && typeof request.cancel === 'function'
      ? () => { request.cancel(); }
      : () => {};
    const cancel = once(() => {
      this.#totals.portraitCancellations++;
      rawCancel();
    });
    if (this.#current !== active || active.requestEpoch !== requestEpoch || !active.requestStarted) {
      cancel();
      this.#totals.staleCompletionDrops += synchronous.length;
      return;
    }
    if (!request || typeof request !== 'object' || typeof request.cancel !== 'function'
      || String(request.key) !== String(active.publicSelection.identityKey)) {
      cancel();
      this.#totals.invalidCompletions++;
      this.#failActive(active, new Error('living species portrait request identity mismatch'));
      return;
    }
    active.requestCancel = cancel;
    if (synchronousOverflow) {
      this.#totals.invalidCompletions++;
      this.#failActive(active, new Error('living species portrait request synchronously over-published'));
      return;
    }
    for (const completion of synchronous) {
      this.#receivePortrait(active, requestEpoch, completion.asset, completion.error);
    }
    if (request.current !== null) {
      this.#receivePortrait(active, requestEpoch, request.current);
    }
  }

  #receivePortrait(
    active: ActiveSelection,
    requestEpoch: number,
    asset: Portrait440 | null,
    error?: unknown,
  ): void {
    if (this.#current !== active || active.requestEpoch !== requestEpoch
      || !active.requestStarted || active.failed) {
      this.#totals.staleCompletionDrops++;
      return;
    }
    if (error !== undefined) {
      this.#failActive(active, errorOf(error, 'living species portrait producer failed'));
      return;
    }
    if (asset === null || !validPortrait(asset, active.publicSelection.identityKey)) {
      this.#totals.invalidCompletions++;
      this.#failActive(active, new Error('living species portrait completion was invalid'));
      return;
    }
    if (active.acceptedAsset !== null || active.renderer !== null) {
      this.#totals.invalidCompletions++;
      return;
    }
    active.acceptedAsset = asset;
    let environment: EnvironmentSnapshot;
    try {
      environment = checkedEnvironment(this.#options.environment.snapshot());
      this.#lastEnvironment = environment;
    } catch (environmentError) {
      this.#failActive(active, errorOf(environmentError, 'living species environment failed'));
      return;
    }
    if (!environment.connected) {
      this.#totals.detachedStops++;
      this.#releaseCurrent('detached-completion');
      return;
    }
    if (environment.visible) this.#attachAcceptedAsset(active, environment);
  }

  #attachAcceptedAsset(active: ActiveSelection, environment: EnvironmentSnapshot): void {
    if (this.#current !== active || active.renderer !== null || active.acceptedAsset === null
      || active.failed || !environment.connected || !environment.visible) return;
    if (this.#creatingRenderer) return;
    this.#creatingRenderer = true;
    const asset = active.acceptedAsset;
    let candidate: LivingSpeciesPreviewRendererV1 | null = null;
    let owned: OwnedRenderer | null = null;
    try {
      candidate = this.#options.createRenderer(
        asset,
        active.publicSelection.plan,
        active.publicSelection.generation,
      );
      this.#totals.rendererCreates++;
      owned = this.#validateRenderer(candidate, active.publicSelection.identityKey);
      this.#recordResourcePeaks(owned);
    } catch (error) {
      if (candidate !== null && typeof candidate === 'object') {
        this.#destroyLooseRenderer(candidate);
      }
      if (this.#current === active) {
        this.#failActive(active, errorOf(error, 'living species renderer creation failed'));
      } else {
        this.#totals.staleCompletionDrops++;
      }
      this.#creatingRenderer = false;
      this.#reconcileLatest();
      return;
    }
    this.#creatingRenderer = false;
    if (this.#current !== active || active.failed) {
      this.#destroyOwnedRenderer(owned);
      this.#totals.staleCompletionDrops++;
      this.#reconcileLatest();
      return;
    }
    active.renderer = owned;
    try {
      owned.handle.attach();
    } catch (error) {
      this.#failActive(active, errorOf(error, 'living species renderer attach failed'));
      this.#reconcileLatest();
      return;
    }
    if (this.#current !== active || active.renderer !== owned) {
      this.#destroyOwnedRenderer(owned);
      this.#totals.staleCompletionDrops++;
      this.#reconcileLatest();
      return;
    }
    owned.attached = true;
    this.#totals.rendererAttaches++;
    let currentEnvironment: EnvironmentSnapshot;
    try {
      currentEnvironment = checkedEnvironment(this.#options.environment.snapshot());
      this.#lastEnvironment = currentEnvironment;
    } catch (error) {
      this.#failActive(active, errorOf(error, 'living species environment failed'));
      return;
    }
    if (!currentEnvironment.connected) {
      this.#totals.detachedStops++;
      this.#releaseCurrent('detached-after-attach');
      return;
    }
    if (!currentEnvironment.visible) return;
    this.#draw(active, currentEnvironment.reducedMotion);
    if (!currentEnvironment.reducedMotion) this.#startTicker(active);
  }

  #validateRenderer(
    renderer: LivingSpeciesPreviewRendererV1,
    identityKey: SpeciesVisualKey,
  ): OwnedRenderer {
    if (!renderer || typeof renderer !== 'object'
      || String(renderer.identityKey) !== String(identityKey)
      || typeof renderer.attach !== 'function'
      || typeof renderer.draw !== 'function'
      || typeof renderer.destroy !== 'function') {
      throw new TypeError('living species renderer did not bind the selected identity');
    }
    if (renderer.resourceKind !== 'image'
      && renderer.resourceKind !== 'canvas'
      && renderer.resourceKind !== 'texture') {
      throw new RangeError('living species renderer did not declare one bounded visual resource');
    }
    return {
      handle: renderer,
      resourceKind: renderer.resourceKind,
      attached: false,
    };
  }

  #recordResourcePeaks(renderer: OwnedRenderer): void {
    this.#peaks.rendererCount = 1;
    if (renderer.resourceKind === 'image') this.#peaks.imageCount = 1;
    if (renderer.resourceKind === 'texture') this.#peaks.textureCount = 1;
    if (renderer.resourceKind === 'canvas') this.#peaks.canvasCount = 1;
  }

  #draw(active: ActiveSelection, reducedMotion: boolean): void {
    const renderer = active.renderer;
    if (this.#current !== active || renderer === null || !renderer.attached || active.failed) return;
    const frame = projectLivingSpeciesFrameV1(
      active.publicSelection.plan,
      active.elapsedMs,
      reducedMotion,
    );
    try {
      renderer.handle.draw(frame);
      if (frame.mode === 'static') this.#totals.staticFrames++;
      else this.#totals.animatedFrames++;
    } catch (error) {
      this.#failActive(active, errorOf(error, 'living species renderer draw failed'));
    }
  }

  #startTicker(active: ActiveSelection): void {
    if (this.#current !== active || active.renderer === null || active.failed || this.#tickerLive) return;
    const token = ++this.#tickerToken;
    this.#tickerLive = true;
    this.#totals.tickerStarts++;
    this.#peaks.tickerCount = 1;
    let release: (() => void) | null = null;
    try {
      release = this.#options.ticker.subscribe((deltaMs) => {
        if (!this.#tickerLive || token !== this.#tickerToken || this.#current !== active) return;
        this.#onTick(active, deltaMs);
      });
      if (typeof release !== 'function') {
        throw new TypeError('living species ticker subscription must return cleanup');
      }
    } catch (error) {
      this.#tickerLive = false;
      this.#tickerToken++;
      this.#recordFault(errorOf(error, 'living species ticker failed'));
      return;
    }
    const ownedRelease = once(release);
    if (!this.#tickerLive || token !== this.#tickerToken || this.#current !== active) {
      ownedRelease();
      return;
    }
    this.#tickerRelease = ownedRelease;
  }

  #onTick(active: ActiveSelection, deltaMs: number): void {
    let environment: EnvironmentSnapshot;
    try {
      environment = checkedEnvironment(this.#options.environment.snapshot());
      this.#lastEnvironment = environment;
    } catch (error) {
      this.#recordFault(errorOf(error, 'living species environment failed'));
      this.#releaseCurrent('environment-fault');
      return;
    }
    if (!environment.connected) {
      this.#totals.detachedStops++;
      this.#releaseCurrent('detached-tick');
      return;
    }
    if (!environment.visible) {
      this.#totals.hiddenStops++;
      this.#stopTicker();
      return;
    }
    if (environment.reducedMotion) {
      this.#stopTicker();
      this.#draw(active, true);
      return;
    }
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      this.#recordFault(new RangeError('living species ticker delta must be finite and non-negative'));
      this.#stopTicker();
      return;
    }
    active.elapsedMs += Math.min(deltaMs, MAX_TICK_DELTA_MS);
    this.#draw(active, false);
  }

  #stopTicker(): void {
    if (!this.#tickerLive && this.#tickerRelease === null) return;
    const release = this.#tickerRelease;
    this.#tickerRelease = null;
    if (this.#tickerLive) {
      this.#tickerLive = false;
      this.#totals.tickerStops++;
    }
    this.#tickerToken++;
    if (release !== null) {
      try { release(); } catch (error) {
        this.#recordFault(errorOf(error, 'living species ticker cleanup failed'));
      }
    }
  }

  #cancelRequest(active: ActiveSelection): void {
    if (!active.requestStarted && active.requestCancel === null) return;
    active.requestStarted = false;
    active.requestEpoch++;
    const cancel = active.requestCancel;
    active.requestCancel = null;
    if (cancel !== null) {
      try { cancel(); } catch (error) {
        this.#recordFault(errorOf(error, 'living species portrait cancellation failed'));
      }
    }
  }

  #destroyLooseRenderer(renderer: LivingSpeciesPreviewRendererV1): void {
    if (this.#destroyedRenderers.has(renderer)) return;
    this.#destroyedRenderers.add(renderer);
    this.#totals.rendererDestroys++;
    try {
      if (typeof renderer.destroy === 'function') renderer.destroy();
    } catch (error) {
      this.#recordFault(errorOf(error, 'living species renderer cleanup failed'));
    }
  }

  #destroyOwnedRenderer(renderer: OwnedRenderer): void {
    this.#destroyLooseRenderer(renderer.handle);
  }

  #failActive(active: ActiveSelection, error: Error): void {
    if (this.#current !== active || active.failed) return;
    active.failed = true;
    this.#stopTicker();
    this.#cancelRequest(active);
    if (active.renderer !== null) {
      const renderer = active.renderer;
      active.renderer = null;
      this.#destroyOwnedRenderer(renderer);
    }
    active.acceptedAsset = null;
    this.#recordFault(error);
  }

  #recordFault(error: Error): void {
    this.#totals.faults++;
    try { this.#options.onFault?.(error); } catch { /* diagnostic callback has no authority */ }
  }

  #releaseCurrent(_reason: string): void {
    const active = this.#current;
    if (active === null) {
      this.#stopTicker();
      return;
    }
    this.#current = null;
    this.#stopTicker();
    this.#cancelRequest(active);
    if (active.renderer !== null) {
      const renderer = active.renderer;
      active.renderer = null;
      this.#destroyOwnedRenderer(renderer);
    }
    active.acceptedAsset = null;
  }

  #reconcileLatest(): void {
    if (this.#disposed || this.#creatingRenderer || this.#current === null) return;
    try {
      const environment = checkedEnvironment(this.#options.environment.snapshot());
      this.#lastEnvironment = environment;
      this.#reconcile(environment);
    } catch (error) {
      this.#recordFault(errorOf(error, 'living species environment failed'));
      this.#releaseCurrent('environment-fault');
    }
  }
}
