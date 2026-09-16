import type {PaintSkin,PaintSkinPart} from './paint-skin.mjs';
export interface CompiledPaintPart {readonly vertexCount:number;readonly triangleCount:number;readonly fieldLength:number;}
export function createCompiledPaintPart(part:PaintSkinPart,skin:PaintSkin,width:number,height:number):CompiledPaintPart;
export function applyCompiledPaintPart(state:CompiledPaintPart,field:Float32Array|Float64Array,output:Float32Array|Float64Array):void;
