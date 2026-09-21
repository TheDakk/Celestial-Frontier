import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
import{createFamilyContactSolver as before}from'./solver-before.ts';
import{createFamilyContactSolver as after,observedContactSupports}from'../../port/v2/apps/game/src/creature-rig-contact.ts';
import{compileBodyCard}from'../../port/v2/apps/game/src/motion/body-card.ts';import{buildTimeline,sampleTimeline}from'../../port/v2/apps/game/src/motion/timeline.ts';
import{measureStanceReach}from'../../port/v2/apps/game/src/creature-stance-reach.ts';
const out='audits/BEAR_CONTACT_DIAGNOSTICS_20260922',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),report:any={producer:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),subjects:[],helperBefore:[]};
const receipts=read(out+'/history-source-receipts.json');assert.equal(receipts[1].sha256,receipts[2].sha256,'1ff30009 did not change solver');
for(const subject of ['crab','coconut-crab','freshwater-crab','mud-crab','vent-crab','civet']){const dir=subject==='civet'?'audits/ANATOMY_SINGLE_RUN_20260919/R3-S/civet-input-01':'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/'+subject,record=read(dir+'/record.json'),binding=read(dir+'/binding.json'),card=compileBodyCard(record,record.genome),tl=buildTimeline(card,'approach',5),row:any={subject,recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,anatomy:record.anatomy??null,models:[]};
 for(const mode of ['rest','observed']){const supports=mode==='rest'?{}:observedContactSupports(record,binding),runs=[];
  for(const[label,create]of[['before',before],['after',after]]as const){const solver=create(record,supports),trace:any[]=[],groups:any[]=[];
   for(const[scope,fractions]of[['second-half',[.55,.75,.95]],['first-half',[.05,.25,.45]],['both-halves',[.05,.25,.45,.55,.75,.95]]]as const){let reach=.5;const samples=[];
    for(const frac of fractions){const ms=tl.durationMs*frac,p=sampleTimeline(tl,ms),pose:any=Object.fromEntries(Object.entries(p.joints).filter(([j])=>j!=='root').map(([j,r])=>[j,{rotation:r}]));pose.root={rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy};let refusal=null;
     const ok=(d)=>{try{const result=solver.resolve(pose,{actionId:tl.actionId,elapsedMs:ms,durationMs:tl.durationMs,weight:1,realm:card.realm,travel:'stage',stageDisplacement:d});trace.push({frac,d,result});return true;}catch(e){refusal=String(e);trace.push({frac,d,error:refusal});return false;}};
     let lo=0,hi=reach;if(ok(hi)){lo=hi;}else{for(let i=0;i<8;i++){const mid=(lo+hi)/2;if(ok(mid))lo=mid;else hi=mid;}}reach=Math.min(reach,lo);samples.push({frac,admitted:lo,refusedAt:hi,refusal});
    }groups.push({scope,unmargined:reach,margin90:reach*.9,samples});
   }runs.push({label,traceHash:hash(trace),groups});
  }assert.deepEqual(runs[0].groups,runs[1].groups,subject+' stage reach changed');assert.equal(runs[0].traceHash,runs[1].traceHash,subject+' stage result changed');row.models.push({mode,before:runs[0],after:runs[1],identical:true});
 }report.subjects.push(row);console.log(JSON.stringify({subject,models:row.models.map(m=>({mode:m.mode,identical:m.identical,groups:m.after.groups}))}));
 if(['freshwater-crab','mud-crab','vent-crab'].includes(subject)){const rest=measureStanceReach(record),observed=measureStanceReach(record,observedContactSupports(record,binding));report.helperBefore.push({subject,recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,rest,observed});}
}
fs.writeFileSync(out+'/reach-history.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
