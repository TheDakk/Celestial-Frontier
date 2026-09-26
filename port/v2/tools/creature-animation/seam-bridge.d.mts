import type {CreatureSeamGroupV1,CreaturePartsBindingV1} from '../../apps/game/src/creature-rig.js';
import type {Affine2} from './kinematics.js';
export function validateSeamBridges(groups:readonly CreatureSeamGroupV1[],parts:CreaturePartsBindingV1['parts'],width:number,height:number,atlasSize:{width:number;height:number},joints:readonly string[]):number;
export function createSeamGeometry(group:CreatureSeamGroupV1,parts:CreaturePartsBindingV1['parts'],width:number,height:number,atlasSize:{width:number;height:number}):{positions:Float32Array;pending:Float32Array;uvs:Float32Array;indices:Uint32Array};
export function writeSeamPose(group:CreatureSeamGroupV1,matrices:Record<string,Affine2>,width:number,height:number,output:Float32Array,staticBox:{x:number;y:number;width:number;height:number}):void;
