/** Measure a stage gait with its additive idle underneath. This is a sampled
 * motion envelope, not a replacement for contact/skin admission at publication.
 * The caller keeps its existing stance cap and reserve. Historical isolated
 * measureStanceReach and all contact/override limits remain unchanged. */
import type {CreaturePoseV1,CreatureRigRecordV1} from './creature-rig-types.js';
import {createFamilyContactSolver,type ContactSupport} from './creature-rig-contact.js';
import {compileBodyCard,type BodyCard,type ResolvedAnatomyRecord} from './motion/body-card.js';
import {buildTimeline,sampleTimeline,type MotionTimeline} from './motion/timeline.js';

const GAIT_STEPS=120,IDLE_STEPS=32,BISECTIONS=8;
type RecordInput=ResolvedAnatomyRecord&CreatureRigRecordV1&{genome?:Parameters<typeof compileBodyCard>[1]};
function poseAt(timeline:MotionTimeline,ms:number):CreaturePoseV1 {
 const p=sampleTimeline(timeline,ms),out:Record<string,{rotation:number;dx?:number;dy?:number}>={};
 for(const[j,rotation]of Object.entries(p.joints))if(j!=='root')out[j]={rotation};
 out.root={rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy};return out;
}
function layered(a:CreaturePoseV1,b:CreaturePoseV1):CreaturePoseV1 {
 const out:Record<string,{rotation:number;dx?:number;dy?:number}>={};
 for(const p of[a,b])for(const[j,v]of Object.entries(p)){const old=out[j]??{rotation:0};out[j]={rotation:old.rotation+v.rotation,dx:(old.dx??0)+(v.dx??0),dy:(old.dy??0)+(v.dy??0)};}
 return out;
}
export function measureLayeredStanceReach(record:RecordInput,supports:Readonly<Record<string,ContactSupport>>,maximumPerStance:number,card:BodyCard=compileBodyCard(record,record.genome)){
 if(!Number.isFinite(maximumPerStance)||maximumPerStance<=0||maximumPerStance>.5)throw Error('Layered stance reach: existing stage cap required');
 if(card.recipeHash!==record.recipeHash)throw Error('Layered stance reach: card/record identity mismatch');
 const solver=createFamilyContactSolver(record,supports);
 if(!solver.chains.length||!['land','amphibious'].includes(card.realm))return{applicable:false,admitted:0,poseSamples:0,firstRefusal:null};
 const gait=buildTimeline(card,'approach',5),idle=buildTimeline(card,'idle',5);
 const idlePoses=Array.from({length:IDLE_STEPS},(_,i)=>poseAt(idle,idle.durationMs*i/IDLE_STEPS));
 const poses=Array.from({length:GAIT_STEPS+1},(_,i)=>{const ms=gait.durationMs*i/GAIT_STEPS;return{ms,pose:poseAt(gait,ms)};}).flatMap(({ms,pose})=>idlePoses.map((p,k)=>({ms,idleFraction:k/IDLE_STEPS,pose:layered(p,pose)})));
 // Test a full constant displacement at every gait/idle phase. This is more
 // conservative than testing only the growing displacement of one cadence.
 const checkRow=(row:typeof poses[number],d:number)=>{try{solver.resolve(row.pose,{actionId:gait.actionId,elapsedMs:row.ms,durationMs:gait.durationMs,weight:1,realm:card.realm,travel:'stage',stageDisplacement:d});return null;}catch(e){return{ms:row.ms,idleFraction:row.idleFraction,displacement:d,error:String(e)};}};
 for(const row of poses){const rest=checkRow(row,0);if(rest)throw Error('Layered stance reach: zero-displacement composite refuses '+JSON.stringify(rest));}
 // Preserve the full sample lattice and contact solver; reduce repeated scans.
 const grid=2**BISECTIONS;
 const {gridIndex,firstRefusal}=measureCommonSampleGrid(poses,grid,(row,index)=>checkRow(row,maximumPerStance*index/grid));
 const lo=maximumPerStance*gridIndex/grid;
 return{applicable:true,admitted:lo,poseSamples:poses.length,firstRefusal};
}

/** A common positive sample grid; earlier passes are not assumed monotone.
 * Exported for adversarial non-monotone controls. */
export function measureCommonSampleGrid<T,F>(poses:readonly T[],grid:number,checkRow:(row:T,index:number)=>F|null){
 if(!Number.isInteger(grid)||grid<1||poses.length===0)throw Error('Layered stance reach: invalid sample grid');
 let candidate=grid,firstRefusal:F | null=null;
 const restrict=(row:T)=>{
  let low=0,high=candidate;
  while(high-low>1){const middle=Math.floor((low+high)/2),failure=checkRow(row,middle);if(failure){high=middle;firstRefusal=failure;}else low=middle;}
  candidate=low;if(!candidate)throw Error('Layered stance reach: no positive admitted cadence');
 };
 let earlierRowsThrough=-1;
 for(let i=0;i<poses.length;i++){const row=poses[i]!,failure=checkRow(row,candidate);if(failure){firstRefusal=failure;restrict(row);earlierRowsThrough=i;}}
 // Rows after the last restriction already passed at the final candidate.
 // Revalidate only its earlier prefix. If that changes the candidate again,
 // invalidate the entire prior pass, including its suffix, and restart.
 for(let i=0;i<=earlierRowsThrough;i++){const row=poses[i]!,failure=checkRow(row,candidate);if(failure){firstRefusal=failure;restrict(row);earlierRowsThrough=poses.length-1;i=-1;}}
 return {gridIndex:candidate,firstRefusal};
}
