import { GR } from '@cf/scene';
import type { ZoomMode } from '@cf/scene';
import { SYS_R } from '@cf/domain-worldconfig';

/** A view of a map: the world point at the centre of the view, and the screen pixels per world unit. */
export interface Camera { x: number; y: number; z: number }
export interface Viewport { w: number; h: number }
/** A camera change that eases: the view jumps to `from` and travels to `to`. */
export interface CameraMove { from: Camera; to: Camera }

/** The shorter side of the view, never under 80: a view with no size must not give a zoom of zero. */
export function minSideOf(view: Viewport): number {
  return Math.max(80, Math.min(view.w, view.h));
}

/** The zoom a galaxy or a system is entered at; the zoom limits and the zoom-out ascent are measured from it. */
export function entryZoom(mode: 'galaxy' | 'system', minSide: number): number {
  return mode === 'galaxy' ? 0.42 * minSide / GR : 0.40 * minSide / SYS_R;
}

/** The lowest and highest zoom of a mode. `base` is the entry zoom of a galaxy or a system. */
export function zoomLimits(mode: ZoomMode, minSide: number, base: number): readonly [number, number] {
  if (mode === 'universe') return [0.0024, 40];
  if (mode === 'galaxy') return [base * 0.5, minSide / 2.5];
  if (mode === 'system') return [base * 0.5, minSide / 3];
  return [0.45, Math.max(0.9, (minSide / 420) * 1.6)];
}

/** Zoom by `factor`, held within `limits`, keeping in place the world point that is `sx`, `sy` screen pixels
 *  from the centre of the view. */
export function zoomAbout(cam: Camera, factor: number, sx: number, sy: number, limits: readonly [number, number]): Camera {
  const z = Math.min(limits[1], Math.max(limits[0], cam.z * factor));
  const wx = cam.x + sx / cam.z;
  const wy = cam.y + sy / cam.z;
  return { x: wx - sx / z, y: wy - sy / z, z };
}

/** Where a world point falls on the screen. */
export function toScreen(cam: Camera, view: Viewport, wx: number, wy: number): { x: number; y: number } {
  return { x: view.w / 2 + (wx - cam.x) * cam.z, y: view.h / 2 + (wy - cam.y) * cam.z };
}

/** Entering a galaxy or a system: centred, starting wide and easing in to just above the entry zoom. */
export function descentCamera(mode: 'galaxy' | 'system', minSide: number): CameraMove {
  const base = entryZoom(mode, minSide);
  return { from: { x: 0, y: 0, z: base * 0.35 }, to: { x: 0, y: 0, z: base * 1.05 } };
}

/** Leaving a galaxy or a system: the outer map is centred on what was left, starting close and easing out. */
export function ascentCamera(left: { kind: 'galaxy'; x: number; y: number; size: number } | { kind: 'star'; x: number; y: number },
  minSide: number): CameraMove {
  const z = left.kind === 'galaxy' ? (0.55 * minSide / (left.size || 40)) * 0.8 : (minSide / 34) * 0.8;
  return { from: { x: left.x, y: left.y, z: z * (left.kind === 'galaxy' ? 1.6 : 1.4) }, to: { x: left.x, y: left.y, z } };
}
