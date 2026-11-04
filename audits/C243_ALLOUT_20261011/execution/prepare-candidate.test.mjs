import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

// Exercise actual prompt/request output. Only the costly canonical compiler is
// replaced by its minimal on-disk packet boundary; no image or static job runs.
async function prepare(round,candidate){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'c243-history-'));
 try{
  const batch=path.join(root,'batch01');fs.mkdirSync(batch);
  fs.mkdirSync(path.join(root,'incoming-reviews'));
  fs.writeFileSync(path.join(root,'ledger.json'),JSON.stringify({batches:[{batch:1,species:[{name:'Mite',packets:[]}]}]}));
  fs.writeFileSync(path.join(batch,'attempts.json'),JSON.stringify([
   {name:'Mite',round:1,candidate:1,reasons:['missing-anatomy: part leg4 (leg4Foot) absent'],visualHold:'Only six walking legs painted'},
   {name:'Mite',round:1,candidate:2,reasons:['unexplained-anatomy: previous body paint']},
   {name:'Mite',round:2,candidate:1,reasons:['CURRENT_ROUND_EARLIER']},
   {name:'Mite',round:2,candidate:3,reasons:['FUTURE_ATTEMPT']},
   {name:'Other',round:1,candidate:1,reasons:['OTHER_SPECIES']}
  ]));
  fs.writeFileSync(path.join(batch,'repaint-notes.json'),JSON.stringify({Mite:'Expose the eight real walking legs'}));
  fs.writeFileSync(path.join(root,'incoming-reviews/C999.json'),JSON.stringify({holds:{Mite:'Detached head in victory',Other:'OTHER_REVIEW'}}));
  let source=fs.readFileSync(new URL('./prepare-candidate.mjs',import.meta.url),'utf8');
  source=source.replace(/^import .*;\n/gm,'');
  const anchor="const base='audits/C243_ALLOUT_20261011/execution';";
  assert.equal(source.split(anchor).length,2);
  source=source.replace(anchor,'const base='+JSON.stringify(root)+';');
  const compileLibraryMaster=async(name,out)=>{
   fs.mkdirSync(out);fs.writeFileSync(out+'/prompt.txt','Canonical anatomy and kit authority.');
   fs.writeFileSync(out+'/subject-source.json',JSON.stringify({family:'arachnid',species:{mustRead:['eight short legs']}}));
   fs.writeFileSync(out+'/request.json',JSON.stringify({promptSha256:'compiler-hash'}));
  };
  await vm.runInNewContext('(async()=>{'+source+'})()',{
   fs,createHash,compileLibraryMaster,process:{argv:['node','prepare','1','1',String(round),String(candidate)]},console:{log(){}}
  });
  const packet=path.join(batch,`c243b01r${round}c${candidate}-01-mite`);
  return {prompt:fs.readFileSync(packet+'/prompt.txt','utf8'),request:JSON.parse(fs.readFileSync(packet+'/request.json','utf8'))};
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}

test('final-round first prompt carries earlier refusals and actual source/reviewer holds',async()=>{
 const {prompt,request}=await prepare(2,1);
 assert.ok(request.repaint.priorRefusals.includes('missing-anatomy: part leg4 (leg4Foot) absent'));
 assert.match(prompt,/leg4/);
 assert.match(prompt,/Only six walking legs painted/);
 assert.match(prompt,/Detached head in victory/);
 assert.match(prompt,/Expose the eight real walking legs/);
 assert.doesNotMatch(prompt,/OTHER_SPECIES|OTHER_REVIEW|FUTURE_ATTEMPT|CURRENT_ROUND_EARLIER/);
 assert.match(prompt,/Never invent a missing part/);
});

test('first-round first prompt excludes future attempts and retry-only guidance',async()=>{
 const {prompt,request}=await prepare(1,1);
 assert.equal(request.repaint.priorRefusals.length,0);
 assert.doesNotMatch(prompt,/previous body paint|Only six|Detached head|Expose the eight|FUTURE_ATTEMPT|OTHER_SPECIES/);
});

test('later first-round prompt includes earlier same-round evidence only',async()=>{
 const {prompt,request}=await prepare(1,2);
 assert.ok(request.repaint.priorRefusals.includes('missing-anatomy: part leg4 (leg4Foot) absent'));
 assert.match(prompt,/Only six walking legs painted/);
 assert.doesNotMatch(prompt,/previous body paint|Detached head|FUTURE_ATTEMPT|CURRENT_ROUND_EARLIER|OTHER_SPECIES/);
});
