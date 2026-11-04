import type {PaintSkin} from './paint-skin.mjs';
export interface SamplingGuardReceipt {
 readonly schema:'cf.opaque-seam-sampling-guard/v1';readonly sourceAtlasSha256:string;readonly bindingHash:string;
 readonly guardTexels:number;readonly opaqueEdges:number;
 readonly joins:ReadonlyArray<{readonly name:string;readonly rule:string;readonly opaqueEdges:number;readonly maxBasisDifference:number}>;
 readonly policy:string;
}
export interface SamplingGuardPlan {readonly pixels:ReadonlyArray<{readonly x:number;readonly y:number;readonly rgba:readonly number[];readonly partId:string;readonly source:readonly number[]}>;readonly receipt:SamplingGuardReceipt;}
export function createOpaqueSeamSamplingGuard(input:{
 record:{readonly recipeHash:string;readonly geometry:{readonly width:number;readonly height:number}};
 binding:{readonly recordRecipeHash:string;readonly bindingHash:string;readonly atlasSha256:string;readonly atlasSize:{readonly width:number;readonly height:number};readonly paintSkin?:PaintSkin;readonly parts:ReadonlyArray<{readonly id:string;readonly joint:string;readonly kind:string;readonly cutout:{readonly x:number;readonly y:number;readonly width:number;readonly height:number};readonly frame:{readonly x:number;readonly y:number;readonly width:number;readonly height:number}}>};
 atlas:{readonly rgba:Uint8Array|Uint8ClampedArray;readonly width:number;readonly height:number};
}):SamplingGuardPlan;
export function applyOpaqueSeamSamplingGuard(rgba:Uint8Array|Uint8ClampedArray,width:number,height:number,plan:SamplingGuardPlan):Uint8Array|Uint8ClampedArray;
