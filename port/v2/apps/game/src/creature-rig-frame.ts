import type {CreatureRigV1,CreaturePoseV1} from './creature-rig.js';
/** PoseTarget-compatible producer sink. The frame owner calls sample then flush;
 * no clock, microtask or per-joint renderer work, and no CreatureRigV1 change. */
export function createCreatureRigFrameTarget(rig:CreatureRigV1){
 let pending:Record<string,{rotation:number;dx:number;dy:number}>={};
 let disposed=false;
 const alive=()=>{if(disposed)throw Error('Creature frame target disposed');};
 return {
  setJoint(name:string,rotation:number,dx=0,dy=0){alive();if(!name||![rotation,dx,dy].every(Number.isFinite))throw Error('Invalid creature frame joint');pending[name]={rotation,dx,dy};},
  flush(){alive();const next:CreaturePoseV1=pending;rig.applyPose(next);pending={};},
  sample(produce:()=>void){alive();pending={};try{produce();rig.applyPose(pending);pending={};}catch(error){pending={};throw error;}},
  reset(){alive();rig.applyPose({});pending={};},
  dispose(){pending={};disposed=true;},
 };
}
