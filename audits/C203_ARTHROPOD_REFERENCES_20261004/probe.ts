/** Actual source-bound contact outcomes. No native, mesh or acceptance claim. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import{compileBodyCard}from'../../port/v2/apps/game/src/motion/body-card.ts';
import{withPaintedContactSupports}from'../../port/v2/apps/game/src/motion/painted-supports.ts';
import{buildActionTimeline,sampleTimeline}from'../../port/v2/apps/game/src/motion/timeline.ts';
import{actionsFor}from'../../port/v2/apps/game/src/motion/family-actions.ts';
import{createFamilyContactSolver,observedContactSupports,predictContactSupport}from'../../port/v2/apps/game/src/creature-rig-contact.ts';
import{familyContractForRecord}from'../../port/v2/tools/creature-animation/family-contracts.mjs';
import{createSkeletonPoseProgram}from'../../port/v2/tools/creature-animation/skeleton-pose.mjs';
const [fit,out]=process.argv.slice(2),read=(f:string)=>JSON.parse(fs.readFileSync(f,'utf8')),sha=(b:any)=>createHash('sha256').update(b).digest('hex');
const record=read(fit+'/record.json'),binding=read(fit+'/binding.json'),bytesBefore=JSON.stringify({record,binding}),controls:any[]=[];
function control(name:string,check:()=>void){check();controls.push({name,status:'PASS'});}
const malformed=structuredClone(record);delete malformed.geometry.fixedAttachments.legHindNearKnee;
control('missing observed socket refuses; no legacy fallback',()=>assert.throws(()=>compileBodyCard(malformed),/socket inventory/));
control('extra observed socket refuses',()=>{const r=structuredClone(record);r.geometry.fixedAttachments.extra=[.5,.5];assert.throws(()=>compileBodyCard(r),/socket inventory/);});
control('nonfinite observed socket refuses',()=>{const r=structuredClone(record);r.geometry.fixedAttachments.legHindNearKnee=[NaN,.5];assert.throws(()=>compileBodyCard(r),/normalized finite socket/);});
const definition=familyContractForRecord(record),legacy=read('port/v2/tools/creature-animation/test-fixtures/family-records.json').records.insect;
control('legacy insect does not acquire lift declaration',()=>assert.equal(familyContractForRecord(legacy).contactStance?.swingLift,undefined));
if(definition.contactStance?.swingLift==='invalid-audit-control'){
 control('invalid lift declaration refuses before solving',()=>assert.throws(()=>createFamilyContactSolver(record,observedContactSupports(record,binding)),/invalid swing lift declaration/));
 fs.writeFileSync(out,JSON.stringify({status:'CONTROL_PASS',controls},null,2)+'\n',{flag:'wx'});
}else{
 const card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),raw=actionsFor('insect',card.anatomy)!.hit!,torso=new Set(['root','thorax']),program=createSkeletonPoseProgram(definition,record.landmarks),supports=observedContactSupports(record,binding);
 const scaled=(gain:number)=>({...raw,poses:raw.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,v*(torso.has(j)?gain:1)])),root:{dx:p.root.dx*gain,dy:p.root.dy*gain}}))});
 const modes:any[]=[];
 for(const gain of [1,0])for(const travel of ['solver','stage']as const){
  const tl=buildActionTimeline(card,scaled(gain),card.identity.seed),solver=createFamilyContactSolver(record,supports);let checked=0,maxCompression=0,maxPaintErrorPx=0,refusal=null;
  for(let i=0;i<=480;i++){
   const ms=tl.durationMs*i/480,p=sampleTimeline(tl,ms),pose={...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:p.root};
   try{const r=solver.resolve(pose,{actionId:'hit',elapsedMs:ms,durationMs:tl.durationMs,realm:card.realm,weight:1,travel});assert((r.maxError??0)<=1e-8);maxCompression=Math.max(maxCompression,r.compression??0);const m=program.evaluate(r.pose);
    for(const c of r.contacts){const chain=solver.chains.find(x=>x.end===c.joint)!,actual=predictContactSupport(chain.model,m),error=Math.hypot((actual.x-c.paintedTarget.x)*record.geometry.width,(actual.y-c.paintedTarget.y)*record.geometry.height);assert(error<=.25);maxPaintErrorPx=Math.max(maxPaintErrorPx,error);}checked++;
   }catch(e){refusal={ms,error:String(e).split('\n')[0]};break;}
  }
  modes.push({gain,travel,checked,total:481,maxCompression,compressionLimit:solver.scaleLength*.08,maxPaintErrorPx,refusal});
 }
 const solver=createFamilyContactSolver(record,supports),swingDirections:any[]=[];
 for(const ms of [250,750]){
  const r=solver.resolve({},{actionId:'approach:crawl',elapsedMs:ms,durationMs:1000,realm:'land',travel:'stage'});
  for(const c of r.contacts.filter(x=>!x.stance)){const chain=solver.chains.find(x=>x.end===c.joint)!,delta=c.target.y-chain.endPoint.y,toward=Math.sign(chain.root.y-chain.endPoint.y);assert.notEqual(delta,0);swingDirections.push({joint:c.joint,ms,delta,toward,towardSocket:Math.sign(delta)===toward});}
 }
 control('all six complete source chains observed during swing',()=>assert.equal(new Set(swingDirections.map(x=>x.joint)).size,6));
 if(definition.contactStance?.swingLift==='toward-socket')control('above and below socket feet retract toward their actual socket',()=>{assert(swingDirections.every(x=>x.towardSocket));assert(swingDirections.some(x=>x.delta>0));assert(swingDirections.some(x=>x.delta<0));});
 else control('old screen-up mutant exposes wrong-direction far-foot lift',()=>assert(swingDirections.some(x=>!x.towardSocket)));
 control('unreachable displacement remains a refusal',()=>assert.throws(()=>solver.resolve({root:{rotation:0,dx:99}},{actionId:'idle',elapsedMs:0,durationMs:1000,realm:'land'}),/reach/));
 control('record and paint binding never mutated',()=>assert.equal(JSON.stringify({record,binding}),bytesBefore));
 const legacySolver=createFamilyContactSolver(legacy),legacyOut=legacySolver.resolve({},{actionId:'approach:crawl',elapsedMs:250,durationMs:1000,realm:'land',travel:'stage'});
 fs.writeFileSync(out,JSON.stringify({schema:'cf.c203-socket-lift-contact-proof/v1',scope:'Source-bound pure contact outcomes; no mesh/native/visual qualification',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,inputs:['record.json','binding.json'].map(f=>({path:path.relative(process.cwd(),fit+'/'+f),sha256:sha(fs.readFileSync(fit+'/'+f))})),definition:{anatomyModel:definition.anatomyModel,swingLift:definition.contactStance?.swingLift??null},modes,swingDirections,legacyOutputSha256:sha(JSON.stringify(legacyOut)),controls,qualifiedReferencePool:[]},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({modes,controls:controls.length}));
}
