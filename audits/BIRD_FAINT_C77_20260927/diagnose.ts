/** Actual GSAP poses and contact outcomes; observation hooks do not alter the solver. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer,actionsFor} from '../../port/v2/apps/game/src/motion/index.ts';
import {createFamilyContactSolver,observedContactSupports} from '../../port/v2/apps/game/src/creature-rig-contact.ts';
import {withPaintedContactSupports} from '../../port/v2/apps/game/src/motion/painted-supports.ts';
const base=path.resolve('audits/BIRD_FAINT_C77_20260927'),sha=b=>createHash('sha256').update(b).digest('hex');
const cases=JSON.parse(fs.readFileSync(base+'/inputs.json','utf8')).cases;
const results=[];
for(const[name,dir]of cases){
 const read=file=>JSON.parse(fs.readFileSync(path.join(dir,file),'utf8')),record=read('record.json'),binding=read('binding.json'),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),supports=observedContactSupports(record,binding),solver=createFamilyContactSolver(record,supports),before=JSON.stringify({record,binding,supports});
 const rows=[];
 for(const id of Object.keys(actionsFor(card.template.id,card.anatomy))){
  const timeline=buildTimeline(card,id,record.identity.seed);let pose:any={};
  const player=createGsapPlayer(timeline,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});
  let first:any=null,passed=0,maxCompression=0;
  try{for(let i=0;i<=120;i++){
   pose={};const ms=timeline.durationMs*i/120;player.seek(ms);
   const phase={actionId:id,elapsedMs:ms,durationMs:timeline.durationMs,realm:card.realm,...id.startsWith('melee:')?{travel:'stage' as const}:{}};
   const snapshot=JSON.stringify(pose);let error:any=null,trace:any[]=[];
   (globalThis as any).__contactTrace=(event,data)=>trace.push({event,...structuredClone(data)});
   try{const result=solver.resolve(pose,phase);passed++;maxCompression=Math.max(maxCompression,result.compression??0);}
   catch(e){error={message:String(e),cause:e.cause?String(e.cause):null};}
   finally{delete(globalThis as any).__contactTrace;}
   assert.equal(JSON.stringify(pose),snapshot,'Solver preserves input pose');
   if(error){first={ms,index:i,phase,attemptedPose:pose,error,trace};break;}
  }}finally{player.stop();}
  rows.push({id,passed,maxCompression,status:first?'REFUSED':'PASS_CONTACT_ONLY',first});
 }
 assert.equal(JSON.stringify({record,binding,supports}),before,'Inputs unchanged');
 const result={name,dir,scope:'Actual GSAP/contact 121 samples per action; no ARAP, blended stage, film or visual acceptance',recordHash:sha(fs.readFileSync(path.join(dir,'record.json'))),bindingHash:sha(fs.readFileSync(path.join(dir,'binding.json'))),scaleLength:solver.scaleLength,compressionBound:solver.scaleLength*.08,chains:solver.chains.map(c=>({id:c.id,root:c.root,joint:c.joint,end:c.endPoint,support:c.support,lengths:c.chain.lengths,endpointOnly:c.endpointOnly})),rows};
 results.push(result);console.log(JSON.stringify({name,rows:rows.filter(r=>r.first).map(r=>({id:r.id,ms:r.first.ms,...r.first.error}))}));
}
fs.writeFileSync(base+'/'+(process.argv[2]??'diagnosis')+'.json',JSON.stringify(results,null,2)+'\n',{flag:'wx'});
