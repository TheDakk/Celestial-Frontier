export interface PaintSkinPart {id:string;vertices:Array<{triangle:[number,number,number];barycentric:[number,number,number]}>;indices:number[];}
export interface PaintSkin {schema:'cf.paint-skin/v1';vertices:Array<{x:number;y:number;weights:Array<[string,number]>}>;parts:PaintSkinPart[];}
export function applyPaintSkin(skin:PaintSkin,matrices:Readonly<Record<string,readonly number[]>>,width:number,height:number,output:Float32Array):void;
export function applyPaintPart(part:PaintSkinPart,field:Float32Array,output:Float32Array):void;
export function validatePaintSkin(skin:PaintSkin,parts:ReadonlyArray<{id:string;kind:string;cutout:{x:number;y:number;width:number;height:number}}>,width:number,height:number,joints:string[]):{vertices:number;partVertices:number;parts:number};
export function assertPaintPartShape(part:PaintSkinPart,skin:PaintSkin,positions:Float32Array,width:number,height:number,areas?:Float64Array):void;
export function paintPartAreas(part:PaintSkinPart,skin:PaintSkin):Float64Array;
