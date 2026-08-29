/* Allocation-free finishing pass for already-painted canvases. The pass may
   grade existing pixels, but it cannot change alpha, draw a path, read pixels,
   allocate another surface, or become an alternate geometry owner. */
import {
  VISUAL_TREATMENT_AXES_V1,
  VISUAL_TREATMENT_LEVELS_V1,
  VISUAL_TREATMENT_SCOPES_V1,
  type VisualTreatmentAxisV1,
  type VisualTreatmentV1,
} from './visual-treatment.js';

export interface CanvasVisualGradientV1 {
  addColorStop(offset: number, color: string): void;
}

export interface CanvasVisualContextV1 {
  globalAlpha: number;
  globalCompositeOperation: string;
  fillStyle: unknown;
  save(): void;
  restore(): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasVisualGradientV1;
  createRadialGradient(
    x0: number, y0: number, r0: number,
    x1: number, y1: number, r1: number,
  ): CanvasVisualGradientV1;
}

export interface CanvasVisualSurfaceV1 {
  readonly width: number;
  readonly height: number;
  getContext(contextId: '2d'): CanvasVisualContextV1 | null;
}

function checkedTreatment(treatment: VisualTreatmentV1): VisualTreatmentV1 {
  if (treatment === null || typeof treatment !== 'object' || Array.isArray(treatment)
    || treatment.schema !== 'cf.art.visual-treatment.v1'
    || treatment.identity === null || typeof treatment.identity !== 'object'
    || !VISUAL_TREATMENT_SCOPES_V1.includes(treatment.identity.scope)
    || typeof treatment.identity.key !== 'string' || treatment.identity.key.length === 0
    || treatment.grade === null || typeof treatment.grade !== 'object') {
    throw new TypeError('canvas treatment: invalid visual treatment');
  }
  const axes = Object.keys(treatment.grade).sort();
  if (axes.length !== VISUAL_TREATMENT_AXES_V1.length
    || axes.some((axis, index) => axis !== [...VISUAL_TREATMENT_AXES_V1].sort()[index])) {
    throw new TypeError('canvas treatment: visual treatment has the wrong axes');
  }
  for (const axis of VISUAL_TREATMENT_AXES_V1) {
    if (!VISUAL_TREATMENT_LEVELS_V1.includes(treatment.grade[axis])) {
      throw new TypeError(`canvas treatment: invalid ${axis} level`);
    }
  }
  return treatment;
}

function checkedSurface<T extends CanvasVisualSurfaceV1>(surface: T): T {
  if (surface === null || typeof surface !== 'object'
    || typeof surface.getContext !== 'function'
    || !Number.isInteger(surface.width) || surface.width < 1
    || !Number.isInteger(surface.height) || surface.height < 1) {
    throw new TypeError('canvas treatment: invalid positive canvas surface');
  }
  return surface;
}

function paintAxis(
  context: CanvasVisualContextV1,
  axis: VisualTreatmentAxisV1,
  width: number,
  height: number,
): void {
  let gradient: CanvasVisualGradientV1;
  if (axis === 'color') {
    gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(255,184,104,0.070)');
    gradient.addColorStop(0.48, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(74,210,255,0.075)');
  } else if (axis === 'contrast') {
    gradient = context.createRadialGradient(
      width * 0.5, height * 0.42, 0,
      width * 0.5, height * 0.48, Math.max(width, height) * 0.72,
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.038)');
    gradient.addColorStop(0.56, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(3,5,18,0.145)');
  } else if (axis === 'lighting') {
    gradient = context.createRadialGradient(
      width * 0.27, height * 0.18, 0,
      width * 0.34, height * 0.28, Math.max(width, height) * 0.74,
    );
    gradient.addColorStop(0, 'rgba(255,246,224,0.120)');
    gradient.addColorStop(0.38, 'rgba(255,238,212,0.035)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
  } else if (axis === 'material') {
    gradient = context.createLinearGradient(width * 0.06, 0, width * 0.88, height);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.055)');
    gradient.addColorStop(0.52, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(125,190,255,0.025)');
  } else {
    gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(100,130,220,0.030)');
    gradient.addColorStop(0.54, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(4,8,24,0.085)');
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

/* The universe-wide preset selects all five axes. Compile that common case
   into one off-center warm/cool depth field instead of five full-surface
   blends. This keeps the shared grade cheap on phone-sized canvases. */
function paintCombinedPolish(
  context: CanvasVisualContextV1,
  width: number,
  height: number,
): void {
  const depth = context.createRadialGradient(
    width * 0.25, height * 0.16, 0,
    width * 0.44, height * 0.42, Math.max(width, height) * 0.86,
  );
  depth.addColorStop(0, 'rgba(255,238,204,0.115)');
  depth.addColorStop(0.28, 'rgba(255,203,142,0.042)');
  depth.addColorStop(0.54, 'rgba(255,255,255,0)');
  depth.addColorStop(0.78, 'rgba(74,188,255,0.038)');
  depth.addColorStop(1, 'rgba(3,7,24,0.140)');
  context.fillStyle = depth;
  context.fillRect(0, 0, width, height);
}

/** Apply only explicitly polished axes. Identity is a byte/command no-op and
 * returns before asking the surface for a context. `source-atop` preserves the
 * exact existing alpha silhouette while either the combined full grade or an
 * individual axis adds no composition, anatomy, placement, or interaction
 * geometry. */
export function applyCanvasVisualTreatmentV1<T extends CanvasVisualSurfaceV1>(
  surfaceInput: T,
  treatmentInput: VisualTreatmentV1,
): T {
  const surface = checkedSurface(surfaceInput);
  const treatment = checkedTreatment(treatmentInput);
  const polished = VISUAL_TREATMENT_AXES_V1.filter((axis) => (
    treatment.grade[axis] === 'polished'
  ));
  if (polished.length === 0) return surface;

  const context = surface.getContext('2d') as CanvasVisualContextV1 | null;
  if (!context) throw new Error('canvas treatment: 2D context unavailable');
  context.save();
  try {
    /* Lifted painters may intentionally retain a translated/rotated current
       transform after completing their own drawing. The grade is surface-
       space, so neutralize that producer state inside this saved scope. */
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-atop';
    if (polished.length === VISUAL_TREATMENT_AXES_V1.length) {
      paintCombinedPolish(context, surface.width, surface.height);
    } else {
      for (const axis of polished) paintAxis(context, axis, surface.width, surface.height);
    }
  } finally {
    context.restore();
  }
  return surface;
}
