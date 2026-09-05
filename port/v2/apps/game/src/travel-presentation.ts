/* Hyperlane travel presentation.

   Navigation and durability publish before this owner is called. This module
   consequently owns no route callback, persistence callback, timer, or
   artificial delay: the app ticker may paint a bounded, skippable overlay
   after a successful publication, and may drop it at any time. */
import { isEngineeringCapabilitySnapshot, type EngineeringCapabilitySnapshot } from '@cf/domain-loot';
import { isEngineeringState, type EngineeringStateV2 } from '@cf/domain-opportunity';
import { clamp, mulberry32, TAU } from '@cf/domain-rand';
import type { VisualEffectPolicyV1 } from './visual-effect-policy.js';

const DEFAULT_TRAVEL_COLOR = '#cfe0ff';
const LEGACY_STREAK_LIMIT = 90;

export interface TravelPresentationRequest {
  /** Distance in the source camera's canonical world units. */
  readonly distance: number;
  /** Stable canonical route identity. It seeds treatment only. */
  readonly destinationKey: string;
  readonly destinationColor?: string;
  readonly engineeringState: EngineeringStateV2;
  readonly capabilities: EngineeringCapabilitySnapshot;
}

export interface TravelPresentationPlan {
  readonly distance: number;
  readonly researchSpeedMultiplier: 1 | 2 | 4 | 8;
  readonly equippedSpeedBonus: number;
  readonly speedMultiplier: number;
  readonly durationMs: number;
  readonly longBurn: boolean;
  readonly destinationSeed: number;
  readonly destinationColor: string;
}

export interface TravelPresentationViewport {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

export interface TravelPresentationOwnerOptions {
  readonly document: Document;
  readonly now: () => number;
  readonly currentVisualEffectPolicy: () => VisualEffectPolicyV1;
  readonly viewport: () => TravelPresentationViewport;
  readonly mount?: HTMLElement;
}

export interface TravelPresentationStatus {
  readonly active: boolean;
  readonly plan: TravelPresentationPlan | null;
  readonly particleMode: 'off' | 'static' | 'animated';
  readonly particleCount: number;
}

export interface TravelPresentationOwner {
  /** Starts treatment synchronously after a route has already published. */
  start(request: TravelPresentationRequest): TravelPresentationPlan | null;
  /** Called by the existing app ticker; returns whether treatment remains. */
  tick(nowMs?: number): boolean;
  cancel(): void;
  status(): TravelPresentationStatus;
  dispose(): void;
}

interface Streak {
  readonly angle: number;
  readonly fraction: number;
  readonly speed: number;
  readonly alpha: number;
  readonly lineWidth: number;
}

interface ActiveTravelPresentation {
  readonly plan: TravelPresentationPlan;
  readonly startedAtMs: number;
  readonly particleMode: 'static' | 'animated';
  readonly streaks: readonly Streak[];
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  gradient: CanvasGradient | null;
}

function checkedFiniteNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be finite and non-negative`);
  }
  return value;
}

function checkedColor(value: string | undefined): string {
  const color = value ?? DEFAULT_TRAVEL_COLOR;
  if (!/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/iu.test(color)) {
    throw new TypeError('travel destination color must be a three- or six-digit hex color');
  }
  return color;
}

function checkedDestinationKey(value: string): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 4_096) {
    throw new TypeError('travel destination key must be a bounded non-empty string');
  }
  return value;
}

/** The legacy destination hash recurrence, now over a canonical route key. */
export function travelDestinationSeed(destinationKey: string): number {
  const key = checkedDestinationKey(destinationKey);
  let hash = 7;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** Exact v1.8.9 drive ladder, including sparse veteran research subsets. */
export function researchTravelSpeedMultiplier(
  engineeringState: EngineeringStateV2,
): 1 | 2 | 4 | 8 {
  if (!isEngineeringState(engineeringState)) {
    throw new TypeError('travel speed requires a registered engineering state');
  }
  return engineeringState.research.includes('drive3') ? 8
    : engineeringState.research.includes('drive2') ? 4
      : engineeringState.research.includes('drive1') ? 2 : 1;
}

/** Exact legacy `driveMult`: research base plus the worn `speed` effect. */
export function planTravelPresentation(request: TravelPresentationRequest): TravelPresentationPlan {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new TypeError('travel presentation request must be an object');
  }
  const distance = checkedFiniteNonNegative(request.distance, 'travel distance');
  const researchSpeedMultiplier = researchTravelSpeedMultiplier(request.engineeringState);
  if (!isEngineeringCapabilitySnapshot(request.capabilities)) {
    throw new TypeError('travel speed bonus requires a registered engineering capability snapshot');
  }
  const equippedSpeedBonus = checkedFiniteNonNegative(
    request.capabilities.travelSpeedBonus,
    'equipped travel speed bonus',
  );
  const speedMultiplier = checkedFiniteNonNegative(
    researchSpeedMultiplier + equippedSpeedBonus,
    'travel speed multiplier',
  );
  /* Matches main.js travelTo exactly: distance changes the uncapped duration,
     while drive speed shrinks both that duration and the upper cap. */
  const durationMs = clamp(
    800 + (distance * 3) / speedMultiplier,
    800,
    Math.max(1_200, 8_000 / speedMultiplier),
  );
  return Object.freeze({
    distance,
    researchSpeedMultiplier,
    equippedSpeedBonus,
    speedMultiplier,
    durationMs,
    longBurn: distance > 1_400 && speedMultiplier === 1,
    destinationSeed: travelDestinationSeed(request.destinationKey),
    destinationColor: checkedColor(request.destinationColor),
  });
}

function checkedViewport(value: TravelPresentationViewport): TravelPresentationViewport {
  if (!value || typeof value !== 'object') throw new TypeError('travel viewport must be an object');
  const width = checkedFiniteNonNegative(value.width, 'travel viewport width');
  const height = checkedFiniteNonNegative(value.height, 'travel viewport height');
  const dpr = checkedFiniteNonNegative(value.dpr, 'travel viewport DPR');
  if (width < 1 || height < 1 || dpr < 1 || dpr > 3
    || width * dpr > 32_768 || height * dpr > 32_768) {
    throw new RangeError('travel viewport is outside the renderer safety bounds');
  }
  return { width, height, dpr };
}

function activeParticlePolicy(policy: VisualEffectPolicyV1): Readonly<{
  mode: 'static' | 'animated';
  count: number;
}> | null {
  if (!policy || policy.schema !== 'cf.app.visual-effect-policy.v1'
    || !policy.input.effectsOn || policy.input.motion !== 'full'
    || policy.particles.mode === 'off' || policy.bloom.mode === 'off') return null;
  const count = policy.particles.maximumCount;
  if (!Number.isInteger(count) || count < 1 || count > LEGACY_STREAK_LIMIT) return null;
  return { mode: policy.particles.mode, count };
}

function seededStreaks(seed: number, count: number): readonly Streak[] {
  const random = mulberry32((0x7261 ^ seed) >>> 0);
  return Object.freeze(Array.from({ length: count }, () => Object.freeze({
    angle: random() * TAU,
    fraction: random(),
    speed: 0.5 + random(),
    alpha: 0.25 + random() * 0.75,
    lineWidth: 0.6 + random() * 1.6,
  })));
}

function configureCanvas(active: ActiveTravelPresentation, viewport: TravelPresentationViewport): void {
  if (active.width === viewport.width && active.height === viewport.height && active.dpr === viewport.dpr) return;
  active.width = viewport.width;
  active.height = viewport.height;
  active.dpr = viewport.dpr;
  active.canvas.width = Math.round(viewport.width * viewport.dpr);
  active.canvas.height = Math.round(viewport.height * viewport.dpr);
  active.canvas.style.width = `${viewport.width}px`;
  active.canvas.style.height = `${viewport.height}px`;
  active.gradient = null;
}

function drawFrame(active: ActiveTravelPresentation, elapsedMs: number): void {
  const { context, plan } = active;
  const width = active.width;
  const height = active.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const minimumDimension = Math.min(width, height);
  const normalized = active.particleMode === 'static'
    ? 0.5
    : clamp(elapsedMs / plan.durationMs, 0, 1);
  const velocity = clamp(normalized < 0.32 ? normalized / 0.32 : (1 - normalized) / 0.68, 0, 1);
  const opacity = velocity * 0.85;
  const rush = active.particleMode === 'static' ? 0 : elapsedMs * 0.00085;
  const span = minimumDimension * 0.55;

  context.setTransform(active.dpr, 0, 0, active.dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.save();
  context.globalCompositeOperation = 'lighter';
  context.strokeStyle = plan.destinationColor;
  for (const streak of active.streaks) {
    const radius = 36 + ((streak.fraction + rush * streak.speed) % 1) * span;
    const length = (18 + radius * 0.9) * velocity * streak.speed;
    context.globalAlpha = opacity * streak.alpha;
    context.lineWidth = streak.lineWidth;
    context.beginPath();
    context.moveTo(centerX + Math.cos(streak.angle) * radius, centerY + Math.sin(streak.angle) * radius);
    context.lineTo(
      centerX + Math.cos(streak.angle) * (radius + length),
      centerY + Math.sin(streak.angle) * (radius + length),
    );
    context.stroke();
  }
  context.globalAlpha = opacity * 0.45;
  if (active.gradient === null) {
    active.gradient = context.createRadialGradient(
      centerX, centerY, 0, centerX, centerY, minimumDimension * 0.42,
    );
    active.gradient.addColorStop(0, plan.destinationColor);
    active.gradient.addColorStop(1, 'rgba(2,2,8,0)');
  }
  context.fillStyle = active.gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

/** Create one app-lifetime owner. Pointer/Escape skip only its overlay and
 * never prevent the underlying product action from landing. */
export function createTravelPresentationOwner(
  options: TravelPresentationOwnerOptions,
): TravelPresentationOwner {
  if (!options || typeof options !== 'object' || !options.document
    || typeof options.now !== 'function'
    || typeof options.currentVisualEffectPolicy !== 'function'
    || typeof options.viewport !== 'function') {
    throw new TypeError('travel presentation owner options are incomplete');
  }
  const document = options.document;
  const mount = options.mount ?? document.body;
  let active: ActiveTravelPresentation | null = null;
  let disposed = false;

  const cancel = (): void => {
    active?.canvas.remove();
    active = null;
  };
  const skipOnPointer = (): void => { cancel(); };
  const skipOnKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') cancel();
  };
  const cancelOnHidden = (): void => {
    if (document.visibilityState === 'hidden') cancel();
  };
  const cancelOnPageHide = (): void => { cancel(); };
  document.addEventListener('pointerdown', skipOnPointer, true);
  document.addEventListener('keydown', skipOnKey, true);
  document.addEventListener('visibilitychange', cancelOnHidden);
  document.defaultView?.addEventListener('pagehide', cancelOnPageHide);

  return Object.freeze({
    start(request: TravelPresentationRequest): TravelPresentationPlan | null {
      if (disposed) return null;
      cancel();
      try {
        const plan = planTravelPresentation(request);
        const particlePolicy = activeParticlePolicy(options.currentVisualEffectPolicy());
        if (particlePolicy === null) return null;
        const startedAtMs = options.now();
        if (!Number.isFinite(startedAtMs)) return null;
        const viewport = checkedViewport(options.viewport());
        const canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        canvas.dataset.cfTravelPresentation = 'v1';
        canvas.style.cssText = [
          'position:fixed', 'inset:0', 'pointer-events:none', 'z-index:2',
        ].join(';');
        const context = canvas.getContext('2d');
        if (context === null) return null;
        const next: ActiveTravelPresentation = {
          plan,
          startedAtMs,
          particleMode: particlePolicy.mode,
          streaks: seededStreaks(plan.destinationSeed, particlePolicy.count),
          canvas,
          context,
          width: 0,
          height: 0,
          dpr: 0,
          gradient: null,
        };
        configureCanvas(next, viewport);
        active = next;
        mount.append(canvas);
        if (next.particleMode === 'static') drawFrame(next, 0);
        return plan;
      } catch {
        cancel();
        return null;
      }
    },
    tick(nowMs = options.now()): boolean {
      if (disposed || active === null) return false;
      try {
        if (!Number.isFinite(nowMs)) { cancel(); return false; }
        const policy = activeParticlePolicy(options.currentVisualEffectPolicy());
        if (policy === null || policy.mode !== active.particleMode
          || policy.count < active.streaks.length) {
          cancel();
          return false;
        }
        const elapsedMs = nowMs - active.startedAtMs;
        if (elapsedMs < 0 || elapsedMs >= active.plan.durationMs) {
          cancel();
          return false;
        }
        configureCanvas(active, checkedViewport(options.viewport()));
        if (active.particleMode === 'animated') drawFrame(active, elapsedMs);
        return true;
      } catch {
        cancel();
        return false;
      }
    },
    cancel,
    status(): TravelPresentationStatus {
      return Object.freeze({
        active: active !== null,
        plan: active?.plan ?? null,
        particleMode: active?.particleMode ?? 'off',
        particleCount: active?.streaks.length ?? 0,
      });
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      cancel();
      document.removeEventListener('pointerdown', skipOnPointer, true);
      document.removeEventListener('keydown', skipOnKey, true);
      document.removeEventListener('visibilitychange', cancelOnHidden);
      document.defaultView?.removeEventListener('pagehide', cancelOnPageHide);
    },
  });
}
