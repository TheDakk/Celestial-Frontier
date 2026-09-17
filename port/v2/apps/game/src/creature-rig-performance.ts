import type {CreaturePoseV1,CreatureRigRecordV1,CreatureRigV1} from './creature-rig.js';
/** A template's compiled player supplies all body/appendage curves. This owner
 * changes actions and publishes one complete pose; it never authors species clips. */
export interface CreatureActionPlayer {
 readonly id:string;readonly durationMs:number;readonly loop:boolean;
 seek(ms:number,target:{setJoint(name:string,rotation:number,dx?:number,dy?:number):void}):void;
 dispose():void;
}
const need=(value:unknown,message:string):void=>{if(!value)throw Error('Creature performance: '+message);};
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
/** Explicit elapsed time only. A new action samples the old action at the actual
 * transition instant, not its last rendered frame; 30/60/120 Hz stay equivalent.
 * A view change belongs to a source-bound view rig, not a negative sprite scale. */
export function createCreatureRigPerformance(record:CreatureRigRecordV1,rig:CreatureRigV1,players:ReadonlyArray<CreatureActionPlayer>){
 need(record.recipeHash===rig.recipeHash&&record.template.id===rig.templateId,'record/rig identity mismatch');
 const joints=new Set(Object.keys(record.landmarks)),actions=new Map<string,CreatureActionPlayer>();
 need(joints.has('root')&&joints.size<=256,'joint inventory');
 for(const p of players){need(p.id&&!actions.has(p.id)&&Number.isFinite(p.durationMs)&&p.durationMs>0,'action identity/duration');actions.set(p.id,p);}
 need(actions.size>0&&actions.size<=128,'action budget');
 let current:{player:CreatureActionPlayer;start:number;blend:number;from:CreaturePoseV1}|null=null,disposed=false;
 const alive=()=>need(!disposed,'disposed');
 const read=(p:CreatureActionPlayer,ms:number):CreaturePoseV1=>{
  const pose:Record<string,{rotation:number;dx:number;dy:number}>={},seen=new Set<string>();
  p.seek(p.loop?ms%p.durationMs:Math.min(ms,p.durationMs),{setJoint(name,rotation,dx=0,dy=0){
   need(joints.has(name)&&!seen.has(name),'unknown or duplicate joint '+name);seen.add(name);
   need([rotation,dx,dy].every(Number.isFinite),'nonfinite joint '+name);pose[name]={rotation,dx,dy};
  }});
  // Missing joints are reset, not inherited from the previous animal action.
  for(const name of joints)if(!seen.has(name))pose[name]={rotation:0,dx:0,dy:0};
  return pose;
 };
 const evaluate=(ms:number):CreaturePoseV1=>{
  alive();need(Number.isFinite(ms)&&ms>=0,'elapsed time');if(!current)return {};
  need(ms>=current.start,'time before current action; replay the command sequence to rewind');
  const next=read(current.player,ms-current.start),t=current.blend===0?1:smooth((ms-current.start)/current.blend);
  if(t===1)return next;
  return Object.fromEntries([...joints].map(j=>{const a=current!.from[j],b=next[j]!;return[j,{rotation:(a?.rotation??0)+(b.rotation-(a?.rotation??0))*t,dx:(a?.dx??0)+((b.dx??0)-(a?.dx??0))*t,dy:(a?.dy??0)+((b.dy??0)-(a?.dy??0))*t}];}));
 };
 return {
  play(id:string,atMs:number,transitionMs:number){
   alive();const player=actions.get(id);need(player,'unknown action '+id);need(Number.isFinite(atMs)&&atMs>=0&&Number.isFinite(transitionMs)&&transitionMs>=0&&transitionMs<=player!.durationMs,'transition time');
   const from=evaluate(atMs);read(player!,0); // Refuse a bad producer before changing state.
   current={player:player!,start:atMs,blend:transitionMs,from};
  },
  sample:evaluate,
  update(ms:number,resolve?:(pose:CreaturePoseV1,context:{actionId:string;elapsedMs:number;durationMs:number;loop:boolean})=>CreaturePoseV1){
   const pose=evaluate(ms),resolved=resolve?resolve(pose,{actionId:current?.player.id??'rest',elapsedMs:current?ms-current.start:0,durationMs:current?.player.durationMs??1,loop:current?.player.loop??false}):pose;
   // The existing rig validates the complete final pose before changing any display.
   rig.applyPose(resolved);return resolved;
  },
  reset(){alive();rig.applyPose({});current=null;},
  dispose(){if(disposed)return;disposed=true;current=null;for(const p of actions.values())p.dispose();},
 };
}
