import type{PaintSkin}from'./paint-skin.mjs';
export interface RigidParentGroup{id:string;joint:string;parentJoint:string;parentPart:string;rest:Float32Array;anchorRest:number[];width:number;height:number;at:(positions:Float32Array)=>number[];}
export function compileRigidParentFrames(skin:PaintSkin,owners:ReadonlyArray<{id:string;joint:string}>,definition:{graph:ReadonlyArray<readonly[string,string]>},width:number,height:number):RigidParentGroup[];
export function applyRigidParentFrames(groups:RigidParentGroup[],matrices:Readonly<Record<string,readonly number[]>>,positions:Record<string,Float32Array>):void;
