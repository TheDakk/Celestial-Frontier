/** Renderer-free structural record, pose and binding contracts. No Pixi import. */
import type {PaintSkin} from '../../../tools/creature-animation/paint-skin.mjs';

export type CreaturePoseV1 = Readonly<Record<string, {rotation:number; dx?:number; dy?:number}>>;

export interface CreaturePaintContact {readonly joint:string;readonly paintedTarget:{readonly x:number;readonly y:number};readonly stance:boolean;}

export interface CreatureRigRecordV1 {
  readonly anatomy?:import('../../../tools/creature-animation/anatomy-inventory.mjs').AnatomyPresence;
  readonly recipeHash:string;
  readonly template:{id:string;version:number};
  readonly geometry:{width:number;height:number;groundLineY:number;cutoutAssetHash:string;fixedAttachments?:Readonly<Record<string,readonly [number,number]>>;contactPads?:{readonly schema:'cf.terminal-pad-support/v1';readonly kind:'adhesive';readonly points:Readonly<Record<string,readonly [number,number]>>}};
  readonly landmarks:Readonly<Record<string,readonly [number,number]>>;
}
export interface Box {readonly x:number;readonly y:number;readonly width:number;readonly height:number;}
export interface CreatureSeamGroupV1 {
 readonly id:string;readonly ancestorJoint:string;readonly layer:'far'|'near';readonly rigidUnderlap?:boolean;
 readonly junctions?:ReadonlyArray<{readonly point:readonly [number,number];readonly ancestorPart:string;readonly parts:ReadonlyArray<string>;readonly joints:ReadonlyArray<string>;readonly sourcePart:string;readonly sourcePixel:readonly [number,number]}>;
 readonly edges:ReadonlyArray<{readonly ancestorPart:string;readonly sourcePart:string;readonly descendantJoint:string;readonly ancestorOverlap?:boolean;
 readonly edge:readonly [readonly [number,number],readonly [number,number]];readonly sourcePixel:readonly [number,number];readonly interiorPixel?:readonly [number,number];readonly sourceDepthPx:number}>;
}
/** Produced offline from masks/joint patches and the pinned, unrotated atlas.
 * No anatomy, poses, genes or clip tuning may be supplied by this binding. */
export interface CreaturePartsBindingV1 {
  readonly schema:'cf.creature-parts/v1';
  readonly bindingHash:string;
  readonly recordRecipeHash:string;
  readonly atlasSha256:string;
  readonly atlasSize:{width:number;height:number};
  readonly paintSkin?:PaintSkin;
  /** Hash-bound source owner for root/pelvis ink on non-quadruped skins. */
  readonly sourceJoinTopology?:{readonly remainderPartId:string};
  readonly seamBridges?:{readonly schema:'cf.seam-bridges/v1';readonly groups:ReadonlyArray<CreatureSeamGroupV1>};
  readonly parts:ReadonlyArray<{id:string;joint:string;layer:'far'|'near';frame:Box;cutout:Box;kind:'part'|'joint-patch'}>;
}
