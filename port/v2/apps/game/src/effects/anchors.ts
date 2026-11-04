/* Effects anchors contract (cf.effect-sequence-anchors/v1) — parse, validate and place.
 * This owner never reads images, never reads a clock and never invents a phase:
 * it refuses with a named reason, or returns a frozen, fully-typed record.
 * Arena space: normalized [0,1] on both axes, ground line at y = 0.78 (arena recipe). */

export const EFFECT_ANCHORS_SCHEMA = 'cf.effect-sequence-anchors/v1' as const;
export const EFFECT_PLACEMENT_SCHEMA = 'cf.effect-sequence-placement/v1' as const;
export const ARENA_GROUND_LINE_Y = 0.78 as const;
export const EFFECT_PHASE_NAMES = Object.freeze(['launch', 'travel', 'impact'] as const);
export type EffectPhaseName = (typeof EFFECT_PHASE_NAMES)[number];

export interface NormalizedPoint { readonly x: number; readonly y: number; }
export interface CanvasSize { readonly width: number; readonly height: number; }
export interface PixelBounds { readonly x: number; readonly y: number; readonly width: number; readonly height: number; }

export interface EffectPhaseAnchors {
  readonly phase: EffectPhaseName;
  readonly image: string;
  readonly keyedImage: string;
  readonly canvasSize: CanvasSize;
  readonly originAnchor: NormalizedPoint;
  readonly contactAnchor: NormalizedPoint;
  readonly alphaBoundsPixels: PixelBounds;
}

export interface EffectSequenceAnchors {
  readonly schema: typeof EFFECT_ANCHORS_SCHEMA;
  readonly sequenceId: string;
  readonly theme: string;
  readonly phaseOrder: readonly EffectPhaseName[];
  readonly canvasSize: CanvasSize;
  readonly originAnchor: NormalizedPoint;
  readonly contactAnchor: NormalizedPoint;
  readonly phases: readonly EffectPhaseAnchors[];
}

export type EffectAnchorsParse =
  | { readonly ok: true; readonly anchors: EffectSequenceAnchors }
  | { readonly ok: false; readonly reason: string };

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isFinite01 = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const isPosInt = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) > 0;
const isName = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9._\/-]*$/.test(v);

class Refusal extends Error {}
const refuse = (reason: string): never => { throw new Refusal(reason); };

function point(v: unknown, at: string): NormalizedPoint {
  if (!Array.isArray(v) || v.length !== 2 || !isFinite01(v[0]) || !isFinite01(v[1])) {
    return refuse(`${at}: expected [x, y] normalized in [0,1]`);
  }
  return Object.freeze({ x: v[0], y: v[1] });
}

function canvas(v: unknown, at: string): CanvasSize {
  if (!isRec(v) || !isPosInt(v.width) || !isPosInt(v.height)) return refuse(`${at}: expected positive integer width/height`);
  return Object.freeze({ width: v.width, height: v.height });
}

function bounds(v: unknown, size: CanvasSize, at: string): PixelBounds {
  if (!isRec(v) || ![v.x, v.y, v.width, v.height].every((n) => Number.isSafeInteger(n))) {
    return refuse(`${at}: expected integer x/y/width/height`);
  }
  const b = v as unknown as PixelBounds;
  if (b.x < 0 || b.y < 0 || b.width <= 0 || b.height <= 0 || b.x + b.width > size.width || b.y + b.height > size.height) {
    return refuse(`${at}: bounds fall outside the ${size.width}x${size.height} canvas`);
  }
  return Object.freeze({ x: b.x, y: b.y, width: b.width, height: b.height });
}

function phaseOrder(v: unknown): readonly EffectPhaseName[] {
  if (!Array.isArray(v) || v.length < 3) return refuse('phaseOrder: expected [launch, travel..., impact]');
  const names = v as unknown[];
  if (names[0] !== 'launch') return refuse('phaseOrder: must begin with launch');
  if (names[names.length - 1] !== 'impact') return refuse('phaseOrder: must end with impact');
  for (let i = 1; i < names.length - 1; i++) if (names[i] !== 'travel') return refuse(`phaseOrder[${i}]: only extra travel frames may sit between launch and impact`);
  return Object.freeze(names as EffectPhaseName[]);
}

function phase(v: unknown, expected: EffectPhaseName, i: number): EffectPhaseAnchors {
  const at = `phases[${i}]`;
  if (!isRec(v)) return refuse(`${at}: expected an object`);
  if (v.phase !== expected) return refuse(`${at}.phase: expected ${expected}, got ${String(v.phase)}`);
  if (!isName(v.image)) return refuse(`${at}.image: expected an image file name`);
  if (!isName(v.keyedImage)) return refuse(`${at}.keyedImage: expected a keyed image file name`);
  const size = canvas(v.canvasSize, `${at}.canvasSize`);
  return Object.freeze({
    phase: expected, image: v.image, keyedImage: v.keyedImage, canvasSize: size,
    originAnchor: point(v.originAnchor, `${at}.originAnchor`),
    contactAnchor: point(v.contactAnchor, `${at}.contactAnchor`),
    alphaBoundsPixels: bounds(v.alphaBoundsPixels, size, `${at}.alphaBoundsPixels`),
  });
}

/** Parse an anchors JSON document. Never throws: refusals carry a named reason. */
export function parseEffectSequenceAnchors(input: unknown): EffectAnchorsParse {
  try {
    if (!isRec(input)) return refuse('anchors: expected an object');
    if (input.schema !== EFFECT_ANCHORS_SCHEMA) return refuse(`schema: expected ${EFFECT_ANCHORS_SCHEMA}`);
    if (!isName(input.sequenceId)) return refuse('sequenceId: expected a non-empty name');
    if (typeof input.theme !== 'string' || !/^[a-z]+$/.test(input.theme)) return refuse('theme: expected a lowercase theme key');
    const order = phaseOrder(input.phaseOrder);
    const size = canvas(input.canvasSize, 'canvasSize');
    if (!Array.isArray(input.phases)) return refuse('phases: expected an array');
    if (input.phases.length !== order.length) return refuse(`phases: expected ${order.length} entries to match phaseOrder, got ${input.phases.length}`);
    const phases = Object.freeze(order.map((name, i) => phase((input.phases as unknown[])[i], name, i)));
    const images = new Set(phases.map((p) => p.image));
    if (images.size !== phases.length) return refuse('phases: image names must be distinct');
    const anchors: EffectSequenceAnchors = Object.freeze({
      schema: EFFECT_ANCHORS_SCHEMA, sequenceId: input.sequenceId, theme: input.theme, phaseOrder: order, canvasSize: size,
      originAnchor: point(input.originAnchor, 'originAnchor'), contactAnchor: point(input.contactAnchor, 'contactAnchor'), phases,
    });
    if (anchors.originAnchor.x === anchors.contactAnchor.x && anchors.originAnchor.y === anchors.contactAnchor.y) {
      return refuse('originAnchor/contactAnchor: the sequence span must be non-zero');
    }
    return { ok: true, anchors };
  } catch (error) {
    if (error instanceof Refusal) return { ok: false, reason: error.message };
    throw error;
  }
}

/* ---------- placement in arena space ---------- */

export interface StandPoints { readonly attacker: NormalizedPoint; readonly target: NormalizedPoint; }
export interface PlacementOptions {
  readonly groundLineY?: number;
  readonly minScale?: number;
  readonly maxScale?: number;
}
export interface PhasePlacement {
  readonly phase: EffectPhaseName;
  readonly index: number;
  /** Sprite registration point inside the phase image, normalized. */
  readonly anchor: NormalizedPoint;
  /** Arena-normalized position of that registration point at the phase start and end. */
  readonly from: NormalizedPoint;
  readonly to: NormalizedPoint;
}
export interface SequencePlacement {
  readonly schema: typeof EFFECT_PLACEMENT_SCHEMA;
  readonly sequenceId: string;
  readonly groundLineY: number;
  readonly standDistance: number;
  /** Sprite width as a fraction of arena width so origin→contact spans the stand distance (capped). */
  readonly scale: number;
  readonly scaleCapped: boolean;
  readonly flipX: boolean;
  readonly launch: PhasePlacement;
  readonly travel: readonly PhasePlacement[];
  readonly impact: PhasePlacement;
}

export const DEFAULT_PLACEMENT = Object.freeze({ groundLineY: ARENA_GROUND_LINE_Y, minScale: 0.2, maxScale: 1.25 });

const assertPoint = (p: NormalizedPoint, at: string): void => {
  if (!isFinite01(p.x) || !isFinite01(p.y)) throw new TypeError(`${at}: stand point must be normalized in [0,1]`);
};

/** Launch at the attacker origin, travel origin→contact, impact at the target contact on the ground line. */
export function placeEffectSequence(anchors: EffectSequenceAnchors, stands: StandPoints, options: PlacementOptions = {}): SequencePlacement {
  const groundLineY = options.groundLineY ?? DEFAULT_PLACEMENT.groundLineY;
  const minScale = options.minScale ?? DEFAULT_PLACEMENT.minScale;
  const maxScale = options.maxScale ?? DEFAULT_PLACEMENT.maxScale;
  assertPoint(stands.attacker, 'attacker'); assertPoint(stands.target, 'target');
  if (!isFinite01(groundLineY) || !(minScale > 0) || !(maxScale >= minScale)) throw new TypeError('placement options out of range');
  const dx = stands.target.x - stands.attacker.x, dy = stands.target.y - stands.attacker.y;
  const standDistance = Math.hypot(dx, dy);
  if (standDistance === 0) throw new TypeError('attacker and target stand points must differ');
  const span = Math.hypot(anchors.contactAnchor.x - anchors.originAnchor.x, anchors.contactAnchor.y - anchors.originAnchor.y);
  const rawScale = standDistance / span;
  const scale = Math.min(maxScale, Math.max(minScale, rawScale));
  const origin: NormalizedPoint = Object.freeze({ x: stands.attacker.x, y: stands.attacker.y });
  const contact: NormalizedPoint = Object.freeze({ x: stands.target.x, y: groundLineY });
  const travelPhases = anchors.phases.filter((p) => p.phase === 'travel');
  const placeTravel = (p: EffectPhaseAnchors, k: number): PhasePlacement => {
    const t0 = k / travelPhases.length, t1 = (k + 1) / travelPhases.length;
    const lerp = (t: number): NormalizedPoint => Object.freeze({ x: origin.x + (contact.x - origin.x) * t, y: origin.y + (contact.y - origin.y) * t });
    return Object.freeze({ phase: 'travel' as const, index: anchors.phases.indexOf(p), anchor: p.originAnchor, from: lerp(t0), to: lerp(t1) });
  };
  const launchPhase = anchors.phases[0]!, impactPhase = anchors.phases[anchors.phases.length - 1]!;
  return Object.freeze({
    schema: EFFECT_PLACEMENT_SCHEMA, sequenceId: anchors.sequenceId, groundLineY, standDistance, scale,
    scaleCapped: scale !== rawScale, flipX: dx < 0,
    launch: Object.freeze({ phase: 'launch' as const, index: 0, anchor: launchPhase.originAnchor, from: origin, to: origin }),
    travel: Object.freeze(travelPhases.map(placeTravel)),
    impact: Object.freeze({ phase: 'impact' as const, index: anchors.phases.length - 1, anchor: impactPhase.contactAnchor, from: contact, to: contact }),
  });
}
