/** Draw-time observation owned by the selected painter, before intake/fitting.
 * No classifier, genome overrides, clock, clip keys or animation dependencies. */
export interface QuadrupedDrawnGeometry {
  readonly ownerId: string;
  readonly kind: 'quadruped';
  readonly width: number;
  readonly groundLineY: number;
  readonly landmarks: Readonly<Record<string, readonly [number, number]>>;
  readonly materials: Readonly<{ surface: string; paletteSource: string }>;
  readonly weapons?: readonly DrawnQuadrupedWeapon[];
  readonly partMasks?: import('./painter-part-capture.js').PaintedPartMasks;
}
export type QuadrupedAnatomyObserver = (geometry: QuadrupedDrawnGeometry) => void;

/** The foot branch has already been resolved by the painter. This observes
 * visible claw strokes, not a genome's nominal weapon or a family default. */
export interface DrawnQuadrupedWeapon {readonly kind:'bite'|'claw'|'kick';readonly contactJoint:string;readonly source:string;}
export function observeQuadrupedWeapons(foot:string,landmarks:Readonly<Record<string,readonly [number,number]>>):readonly DrawnQuadrupedWeapon[]{
 const result:DrawnQuadrupedWeapon[]=[];
 if(landmarks.jaw)result.push({kind:'bite',contactJoint:'jaw',source:'painted jaw contact; no claim of teeth'});
 if(['paw','plantigrade','claw'].includes(foot)&&landmarks.foreNearPaw)result.push({kind:'claw',contactJoint:'foreNearPaw',source:'painted '+foot+' claw strokes'});
 if(['hoof','cloven'].includes(foot)&&landmarks.foreNearPaw)result.push({kind:'kick',contactJoint:'foreNearPaw',source:'painted '+foot+' contact'});
 return Object.freeze(result.map(w=>Object.freeze(w)));
}
