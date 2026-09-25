/** One-time gait envelope measurement. No per-species constants or altered
 * limits. Resolve the record's authored approach at 121 phases; bisect the
 * contiguous admitted displacement interval against the existing solver.
 * This is sampled admission, not a proof for arbitrary clips between samples. */
import type {CreaturePoseV1,CreatureRigRecordV1} from './creature-rig-types.js';
import {createFamilyContactSolver,type ContactSupport} from './creature-rig-contact.js';
import {compileBodyCard,type ResolvedAnatomyRecord} from './motion/body-card.js';
import {buildTimeline} from './motion/timeline.js';
import {createGsapPlayer} from './motion/gsap-adapter.js';
export function measureStanceReach(record:ResolvedAnatomyRecord & CreatureRigRecordV1 & {genome?:Parameters<typeof compileBodyCard>[1]},supports:Readonly<Record<string,ContactSupport>>={}){
 const solver=createFamilyContactSolver(record,supports),card=compileBodyCard(record,record.genome);
 if(!solver.chains.length)return{applicable:false,forward:0,backward:0,samples:0,bodyPlanted:[],limits:[]};
 const tl=buildTimeline(card,'approach',record.identity.seed),poses:{pose:CreaturePoseV1;ms:number}[]=[];let raw:Record<string,{rotation:number;dx?:number;dy?:number}>={};
 const player=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){raw[j]={rotation,dx,dy};}},{now:()=>0});
 try{for(let i=0;i<=120;i++){raw={};const ms=tl.durationMs*i/120;player.seek(ms);poses.push({pose:raw,ms});}}finally{player.stop();}
 const bodyPlanted=record.anatomy?.schema==='cf.anatomy-presence/v2'?[...(record.anatomy.folded??[])]:[];
 const check=(d:number)=>{for(const row of poses){try{solver.resolve(row.pose,{actionId:tl.actionId,elapsedMs:row.ms,durationMs:tl.durationMs,realm:card.realm,travel:'stage',stageDisplacement:d});}catch(e){return{ms:row.ms,displacement:d,error:String(e)};}}return null;};
 const restFailure=check(0);if(restFailure)throw Error('Stance reach: zero-displacement gait refuses '+JSON.stringify(restFailure));
 const maximum=Math.max(...solver.chains.map(c=>(c.chain.lengths.upper+c.chain.lengths.lower)/solver.scaleLength))*2;
 const limits=[];for(const direction of [1,-1]){let lo=0,hi=maximum,refusal=check(direction*hi);if(!refusal)throw Error('Stance reach: missing finite refusal bracket');
  for(let n=0;n<24;n++){const mid=(lo+hi)/2,failure=check(direction*mid);if(failure){hi=mid;refusal=failure;}else lo=mid;}
  const admitted=Math.floor(lo*1e6)/1e6;if(!(admitted>0))throw Error('Stance reach: no positive admitted cadence');
  limits.push({direction,admitted,refusedAt:hi,refusal});
 }
 return{applicable:true,forward:limits[0]!.admitted,backward:limits[1]!.admitted,samples:poses.length,bodyPlanted,limits};
}
