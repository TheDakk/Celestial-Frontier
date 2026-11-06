import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {publishWorkspaceOwner} from '../../port/v2/tools/workspacelock.mjs';
import {admitKitEngineJob} from './kit-engine-math.mjs';
const root=new URL('../../',import.meta.url);
test('complete owner publishes without an empty window and cannot replace a live or unreadable owner',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cf-lock-publication-')),lock=path.join(dir,'unit-only.lock');
 try {
  const owner={pid:process.pid,token:'first',label:'unit fixture'};publishWorkspaceOwner(lock,owner);assert.deepEqual(JSON.parse(fs.readFileSync(lock)),owner);
  assert.throws(()=>publishWorkspaceOwner(lock,{...owner,token:'second'}),{code:'EEXIST'});assert.deepEqual(JSON.parse(fs.readFileSync(lock)),owner);
  fs.writeFileSync(lock,'');assert.throws(()=>publishWorkspaceOwner(lock,{...owner,token:'third'}),{code:'EEXIST'});assert.equal(fs.readFileSync(lock,'utf8'),'');
 } finally {fs.rmSync(dir,{recursive:true});}
});
test('four parallel unit suites cannot acquire the checkout lease; injected acquisition is rejected',()=>{
 const admits=source=>!source.includes('acquireWorkspaceLock');
 for(const name of ['runtime-pack','mobile-pack-package','frozen-preview-client','species-references']) {
  const source=fs.readFileSync(new URL(name+'.test.mjs',import.meta.url),'utf8');assert.ok(admits(source));assert.ok(!admits(source+'\nacquireWorkspaceLock("control")'));
 }
});
test('shipped fitted pixels equal accepted inputs; wrong fitted geometry and URL traversal refuse admission',()=>{
 const job=JSON.parse(fs.readFileSync(new URL('audits/ART_KIT_CONTACT_REVISION_20260912/prepared/recipe.json',root)));
 const app=JSON.parse(fs.readFileSync(new URL('port/v2/apps/game/src/kit-earth-assets.json',root)));
 const refs=[app.plate,app.atlas,app.triptych,app.foreground,...Object.values(app.residents)];
 for(const ref of refs){const b=fs.readFileSync(new URL('port/v2/apps/game/public'+ref.url,root));assert.equal(b.length,ref.width*ref.height*4);assert.equal(createHash('sha256').update(b).digest('hex'),ref.sha256);}
 admitKitEngineJob(job);
 const wrong=structuredClone(job);wrong.passes[0].reference.width=383;assert.throws(()=>admitKitEngineJob(wrong),/fitted|pre-fit/);
 const escaped=structuredClone(job);escaped.plate.url='/inputs/../arbitrary.rgba';assert.throws(()=>admitKitEngineJob(escaped),/fitted/);
});

test('preview boot admits the actual repository tracked inventory beyond the child-process default buffer',async()=>{
 const {assertTrackedKitSources}=await import('./kit-tracked-inputs.mjs');
 assert.equal(assertTrackedKitSources(root).tracked,true);
});

test('preview boot refuses each omitted load-bearing source, including the ten checkpoint files',async()=>{
 const {KIT_TRACKED_SOURCES,assertTrackedKitSources}=await import('./kit-tracked-inputs.mjs');
 assert.equal(assertTrackedKitSources('.',KIT_TRACKED_SOURCES).tracked,true);
 for(const missing of KIT_TRACKED_SOURCES)assert.throws(()=>assertTrackedKitSources('.',KIT_TRACKED_SOURCES.filter(p=>p!==missing)),/Untracked/);
});

test('shipped worker refuses a legacy scene job and reuses the same engine for two kit jobs',async()=>{
 const source=fs.readFileSync(new URL('kit-stage-worker.mjs',import.meta.url),'utf8').replace(/^import .*;$/gm,'');
 const messages=[];let creates=0,paints=0;
 const handler=new Function('ort','Tokenizer','admitKitEngineJob','createKitWorkerEngine','postMessage','let onmessage;'+source+';return onmessage;')({},class{},()=>{},async()=>{creates++;return {paint:async()=>{paints++;return {schema:'unit-result'}},dispose:async()=>{}}},m=>messages.push(m));
 await handler({data:{stage:'denoise',requestId:1}});assert.equal(creates,0);assert.equal(messages[0].type,'error');
 for(let requestId=2;requestId<4;requestId++)await handler({data:{stage:'kit-v4',requestId,recipe:{}}});
 assert.equal(creates,1);assert.equal(paints,2);assert.equal(messages.filter(m=>m.type==='complete').length,2);
});
