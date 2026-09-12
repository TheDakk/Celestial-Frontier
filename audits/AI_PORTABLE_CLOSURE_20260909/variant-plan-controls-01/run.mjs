import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {acquireWorkspaceLock} from '../../../port/v2/tools/workspacelock.mjs';
import {buildBrowserVariantPlan} from '../../../tools/local-image-generation/browser-variant-plan.mjs';
const output=new URL('./',import.meta.url),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const names=['tools/local-image-generation/browser-variant-plan.mjs','tools/local-image-generation/browser-variant-plan.test.mjs','tools/local-image-repack/model.mjs','tools/local-image-repack/protobuf.mjs','tools/local-image-repack/parent-contract.json','tools/local-image-generation/q8-block32-manifest.json','tools/local-image-generation/model-manifest.json'];
const receipt={status:'FAIL',startedAt:new Date().toISOString(),sources:[],steps:[],scope:'Metadata graph plan and pure controls only; no model/shard scan, browser or inference.'};
const release=acquireWorkspaceLock('browser variant plan controls01');
try{
 for(const name of names){const bytes=await fs.readFile(name);receipt.sources.push({path:name,bytes:bytes.length,sha256:hash(bytes)});}
 await fs.writeFile(new URL('start.json',output),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 const test=spawnSync(process.execPath,['--test','tools/local-image-generation/browser-variant-plan.test.mjs'],{encoding:'utf8',timeout:60000});
 await fs.writeFile(new URL('focused.log',output),test.stdout+test.stderr,{flag:'wx'});receipt.steps.push({name:'pure-controls',exitCode:test.status});
 if(test.status!==0)throw Error('First focused controls failed');
 const base='port/v2/apps/game/smoke/local-image-generation/';
 const parent=await fs.readFile(base+'cgb--flux2-klein-4b-onnx-webgpu/3bffc0efef1d9f84727036cdbc44df3b6ab51131/transformer_q8.onnx');
 const derived=await fs.readFile(base+'derivatives/flux2-klein-4b-block32-v1/transformer-q8-block32.onnx');
 const result=buildBrowserVariantPlan(parent,derived);const planPath='/private/tmp/cf-browser-variant-plan-20260909-01.json';
 await fs.writeFile(planPath,result.planJson,{flag:'wx'});if(hash(await fs.readFile(planPath))!==result.planSha256)throw Error('Plan readback differs');
 receipt.plan={path:planPath,planSha256:result.planSha256,planBytes:result.planBytes,literalBytes:result.literalBytes,patchCount:result.plan.patches.length,rangeCount:result.plan.ranges.length,parentGraphSha256:hash(parent),derivedGraphSha256:hash(derived),sourceManifestSha256:result.plan.parent.sourceManifestSha256};
 receipt.status='PASS';
}catch(error){receipt.error=String(error.stack??error);process.exitCode=1;}
finally{
 receipt.sourcesUnchanged=true;for(const row of receipt.sources){if(hash(await fs.readFile(row.path))!==row.sha256){receipt.sourcesUnchanged=false;receipt.status='FAIL';process.exitCode=1;}}
 release();receipt.workspaceReleased=true;receipt.finishedAt=new Date().toISOString();
 await fs.writeFile(new URL('result.json',output),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
}
