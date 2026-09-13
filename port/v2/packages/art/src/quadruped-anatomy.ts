/** Draw-time observation owned by the selected painter, before intake/fitting.
 * No classifier, genome overrides, clock, clip keys or animation dependencies. */
export interface QuadrupedDrawnGeometry {
  readonly ownerId: string;
  readonly kind: 'quadruped';
  readonly width: number;
  readonly groundLineY: number;
  readonly landmarks: Readonly<Record<string, readonly [number, number]>>;
  readonly materials: Readonly<{ surface: string; paletteSource: string }>;
  readonly partMasks?: import('./painter-part-capture.js').PaintedPartMasks;
}
export type QuadrupedAnatomyObserver = (geometry: QuadrupedDrawnGeometry) => void;
