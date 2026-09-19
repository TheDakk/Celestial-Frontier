/** Exhaust every admitted soft-appendage count. Synthetic landmarks only. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {rolldown} from 'rolldown';
import {familyContractForRecord} from '../creature-animation/family-contracts.mjs';
import {checkFamilyGeometry} from '../creature-animation/family-record.mjs';
import {createSkeletonPoseProgram} from '../creature-animation/skeleton-pose.mjs';
const root=path.resolve(import.meta.dirname,'../../../..'),out=process.argv[2];if(!out||fs.existsSync(out))throw Error('new output required');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-counted-motion-')),sources=new Map(),sha=b=>createHash('sha256').update(b).digest('hex');
for(const name of ['family-contracts.mjs','family-record.mjs','quadruped-template.mjs','pose-projection.mjs']){const file=path.resolve(import.meta.dirname,'../creature-animation',name);sources.set(file,sha(fs.readFileSync(file)));}
sources.set(import.meta.filename,sha(fs.readFileSync(import.meta.filename)));
try{
 const bundle=await rolldown({input:path.join(root,'port/v2/apps/game/src/motion/index.ts'),platform:'node',plugins:[{name:'hashes',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));}}]});
 try{await bundle.write({dir:scratch,format:'es',entryFileNames:'motion.mjs'});}finally{await bundle.close();}
 const m=await import(pathToFileURL(path.join(scratch,'motion.mjs'))),fixture=path.join(root,'port/v2/tools/creature-animation/test-fixtures/family-records.json');sources.set(fixture,sha(fs.readFileSync(fixture)));
 const {records}=JSON.parse(fs.readFileSync(fixture)),rows=[],rejected=[];
 for(const id of ['radial','cephalopod'])for(let arms=2;arms<=20;arms++)for(let feedingTentacles=0;feedingTentacles<=(id==='radial'?0:4);feedingTentacles++){
  const r=structuredClone(records[id]);r.anatomy={schema:'cf.anatomy-presence/v2',absent:[],appendages:{arms,...id==='cephalopod'?{feedingTentacles}:{}}};
  let contract;try{contract=familyContractForRecord(r);}catch(e){if(!String(e).includes('64-joint budget'))throw e;rejected.push({id,arms,feedingTentacles,reason:String(e)});continue;}
  const old=r.landmarks;r.landmarks=Object.fromEntries(contract.joints.map(j=>[j,old[j]??old[j.replace(/^arm(\d+)/,(_,n)=>'arm'+Number(n)%(id==='radial'?6:8)).replace(/^tentacle(\d+)/,(_,n)=>'arm'+(3+Number(n)%2))]]));
  r.recipeHash=sha(JSON.stringify(r));checkFamilyGeometry(r);const c=m.compileBodyCard(r),program=createSkeletonPoseProgram(contract,r.landmarks);
  if(JSON.stringify(c.parts.map(p=>[p.joint,p.parent]))!==JSON.stringify(contract.graph))throw Error('owner graph mismatch');
  const row={id,arms,feedingTentacles,joints:contract.joints.length,actions:0,samples:0,maxParityError:0,activeAppendages:[]},active=new Set();
  for(const action of Object.keys(m.actionsFor(id,r.anatomy))){
   const tl=m.buildTimeline(c,action,31),observed={},player=m.createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){observed[j]={rotation,dx,dy};}},{now:()=>0});row.actions++;
   try{for(let i=0;i<=120;i++){
    const ms=tl.durationMs*i/120,p=m.sampleTimeline(tl,ms);player.seek(ms);
    if(Object.keys(p.joints).sort().join()!==[...contract.joints].sort().join())throw Error('dropped joint');
    for(const[j,v]of Object.entries(p.joints)){
     const limit=tl.limitsRad[j],q=observed[j];if(!Number.isFinite(v)||v<limit.min||v>limit.max||j!=='root'&&(q.dx!==0||q.dy!==0))throw Error('invalid pose '+j);
     row.maxParityError=Math.max(row.maxParityError,Math.abs(q.rotation-v));if(Math.abs(v)>1e-6&&/^(arm|tentacle)/.test(j))active.add(j);
    }
    if(!Object.values(program.evaluate(observed)).flat().every(Number.isFinite))throw Error('non-finite inherited transform');row.samples++;
   }
   if(m.buildTimeline(c,action,31).hash!==tl.hash)throw Error('nondeterministic recipe');
   if(!tl.loop&&['melee','hit','dodge','cast'].includes(tl.family)){const p=m.sampleTimeline(tl,tl.durationMs);if(Object.values(p.joints).some(v=>Math.abs(v)>1e-8)||Math.abs(p.root.dx)>1e-8||Math.abs(p.root.dy)>1e-8)throw Error('not settled');}
   }finally{player.stop();}
  }
  row.activeAppendages=[...active].sort();if(active.size!==3*(arms+feedingTentacles)||row.maxParityError>=2e-5)throw Error('static appendage / parity failure');rows.push(row);
 }
 for(const[p,h]of sources)if(sha(fs.readFileSync(p))!==h)throw Error('source changed during audit');
 const report={schema:'cf.counted-anatomy-audit/v1',status:'PASS',scope:'Every supported radial and cephalopod count; synthetic geometry, not painted fits, visible skin or phone performance.',rows,rejected,sources:[...sources].map(([p,sha256])=>({path:path.relative(root,p),sha256}))};
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,variants:rows.length,budgetRefusals:rejected.length,actions:rows.reduce((s,r)=>s+r.actions,0),samples:rows.reduce((s,r)=>s+r.samples,0),maxParityError:Math.max(...rows.map(r=>r.maxParityError))}));
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
