import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createRequire} from 'node:module';
import {inspectArtBatch} from './art-batch.mjs';import {sha256} from './contracts.mjs';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
test('closed twelve-at-a-time inventory retains original bytes and refuses missing, duplicate, reordered and stale inputs',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cf-art-batch-test-'));try{
  const masters=[];for(let i=0;i<12;i++){const im=new PNG({width:384,height:384});im.data[0]=i;const bytes=PNG.sync.write(im),name='fixture-'+i+'.png';fs.writeFileSync(path.join(root,name),bytes);masters.push({sourceKey:'test-only-'+i,path:name,kind:'cutout',sha256:sha256(bytes)});}
  const plan={schema:'cf.art-review-plan/v1',slots:masters.map(({sourceKey,kind})=>({sourceKey,kind}))};const planBytes=Buffer.from(JSON.stringify(plan));fs.writeFileSync(path.join(root,'plan.json'),planBytes);
  const batch={schema:'cf.art-review-batch/v1',batchId:'test-only',plan:{path:'plan.json',sha256:sha256(planBytes)},masters};
  const good=inspectArtBatch(root,batch);assert.equal(good.masters.length,12);assert.equal(good.qualityAccepted,false);
  for(const mutate of [b=>b.masters.pop(),b=>b.masters.reverse(),b=>b.masters[1].path=b.masters[0].path,b=>b.masters[1].sha256=b.masters[0].sha256,b=>b.masters[0].sha256='0'.repeat(64),b=>b.plan.sha256='0'.repeat(64)]){const b=structuredClone(batch);mutate(b);assert.throws(()=>inspectArtBatch(root,b));}
  const excess={...plan,slots:[...plan.slots,{sourceKey:'test-only-13',kind:'cutout'}]},excessBytes=Buffer.from(JSON.stringify(excess));fs.writeFileSync(path.join(root,'too-many.json'),excessBytes);
  assert.throws(()=>inspectArtBatch(root,{...batch,plan:{path:'too-many.json',sha256:sha256(excessBytes)}}),/twelve/);
  const invalid={...plan,slots:[{sourceKey:'x',kind:'made-up-class'}]},invalidBytes=Buffer.from(JSON.stringify(invalid));fs.writeFileSync(path.join(root,'invalid.json'),invalidBytes);
  assert.throws(()=>inspectArtBatch(root,{...batch,plan:{path:'invalid.json',sha256:sha256(invalidBytes)}}),/category/);
  for(const r of masters)assert.equal(sha256(fs.readFileSync(path.join(root,r.path))),r.sha256);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
