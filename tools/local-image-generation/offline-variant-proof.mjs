/** Actual UI owns derivation. This observer only reads native OPFS and hashes
 * complete output bytes with the compiled production SHA owner. No model injection. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {PINNED_LOCAL_MODEL_MANIFEST_V1 as MODEL} from '../../port/v2/apps/game/src/local-model-manifest.ts';
import {BROWSER_VARIANT_DESCRIPTOR} from './browser-variant-source.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const need=(value,message)=>{if(!value)throw Error(message);};
const FILES=Object.freeze([
  {path:'transformer-q8-block32.onnx',bytes:4991273,sha256:'cda0a0e0d2778f83236557bcde8d474fed89a2fcbc817ea04f4758d2a064aed8'},
  {path:'repacked-scale-zero.data',bytes:347332608,sha256:'5ba0370ea1eb7af85042aea2a143398990d87759efaf5f36857ad019ce066d82'},
]);
export async function readNativeVariant({planSha256,files,shaModule}){
  return navigator.locks.request('cf-local-model-delivery-v1',{mode:'exclusive'},async()=>{
  const namespace=await(await navigator.storage.getDirectory()).getDirectoryHandle('cf-local-model-variants-v1');
  const json=async(dir,name)=>{const file=await(await dir.getFileHandle(name)).getFile();
    if(file.size<1||file.size>65536)throw Error('Invalid native variant marker size');return JSON.parse(await file.text());};
  const pointer=await json(namespace,'ready-'+planSha256+'.json');
  if(typeof pointer.attemptId!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(pointer.attemptId))throw Error('Invalid native variant attempt');
  const attempt=await namespace.getDirectoryHandle('attempt-'+pointer.attemptId);
  const entries=[];for await(const[name,entry]of attempt.entries()){
    if(entry.kind!=='file'||entries.length>400)throw Error('Unexpected native variant inventory');entries.push(name);}
  if(entries.includes('revoked.json'))throw Error('Native variant attempt is revoked');
  const marker=await json(attempt,'ready.json'),binding=await json(attempt,'attempt.json');
  const url=URL.createObjectURL(new Blob([shaModule],{type:'text/javascript'})),output=[],expectedNames=['ready.json','attempt.json'];
  try{
    const {LocalModelSha256V1}=await import(url);
    for(let index=0;index<files.length;index++){
      const expected=files[index],digest=new LocalModelSha256V1();let bytes=0,chunks=0;
      while(bytes<expected.bytes){const name=`f${index}-c${chunks}`,file=await(await attempt.getFileHandle(name)).getFile();
        const length=Math.min(1048576,expected.bytes-bytes);
        if(file.size!==length)throw Error('Native variant chunk length mismatch');
        const data=new Uint8Array(await file.arrayBuffer());if(data.length!==length)throw Error('Native variant short read');
        digest.update(data);bytes+=data.length;chunks++;expectedNames.push(name);}
      output.push({path:expected.path,bytes,chunks,sha256:digest.digestHex()});
    }
  }finally{URL.revokeObjectURL(url);}
  if(JSON.stringify(entries.sort())!==JSON.stringify(expectedNames.sort()))throw Error('Uninventoried variant output');
  const finalEntries=[];for await(const[name,entry]of attempt.entries()){if(entry.kind!=='file'||finalEntries.length>400)throw Error('Changed native variant inventory');finalEntries.push(name);}
  if(JSON.stringify(finalEntries.sort())!==JSON.stringify(entries.sort())
    ||JSON.stringify(await json(namespace,'ready-'+planSha256+'.json'))!==JSON.stringify(pointer)
    ||JSON.stringify(await json(attempt,'ready.json'))!==JSON.stringify(marker)
    ||JSON.stringify(await json(attempt,'attempt.json'))!==JSON.stringify(binding))throw Error('Native variant changed during hashing');
  return {pointer,marker,binding,files:output,entries,totalBytes:output.reduce((n,row)=>n+row.bytes,0)};
  });
}
export function assessNativeVariant(value,parentAttemptId){
  const marker=value?.marker;
  need(marker?.schema==='cf.local-model-variant-ready.v1'&&marker.variant==='q8-block32-repacked-v1'
    &&marker.planSha256===BROWSER_VARIANT_DESCRIPTOR.sha256&&marker.parentManifestSha256===hash(JSON.stringify(MODEL))
    &&marker.parentAttemptId===parentAttemptId&&marker.sourceManifestSha256===MODEL.sourceManifestSha256
    &&marker.payloadBytes===BROWSER_VARIANT_DESCRIPTOR.payloadBytes&&marker.qualityAccepted===false&&marker.deviceQualified===false
    &&JSON.stringify(marker.files)===JSON.stringify(FILES),'Native variant marker identity mismatch');
  need(value.pointer?.schema==='cf.local-model-variant-pointer.v1'
    &&typeof value.pointer.attemptId==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(value.pointer.attemptId)
    &&JSON.stringify(value.pointer.marker)===JSON.stringify(marker),'Native variant pointer mismatch');
  need(JSON.stringify(value.binding)===JSON.stringify({schema:'cf.local-model-variant-attempt.v1',
    attemptId:value.pointer.attemptId,planSha256:marker.planSha256,parentManifestSha256:marker.parentManifestSha256,
    parentAttemptId}),'Native variant attempt binding mismatch');
  need(value.totalBytes===BROWSER_VARIANT_DESCRIPTOR.payloadBytes&&value.files?.length===FILES.length
    &&value.files.every((row,i)=>row.path===FILES[i].path&&row.bytes===FILES[i].bytes&&row.sha256===FILES[i].sha256
      &&row.chunks===Math.ceil(row.bytes/1048576)),'Native variant full output hash mismatch');
  const entries=['attempt.json','ready.json'];
  for(let i=0;i<FILES.length;i++)for(let part=0;part<Math.ceil(FILES[i].bytes/1048576);part++)entries.push(`f${i}-c${part}`);
  need(Array.isArray(value.entries)&&JSON.stringify([...value.entries].sort())===JSON.stringify(entries.sort()),'Native variant inventory differs');
}
export async function runOfflineVariantProof({evaluate,until,click,screenshot,receipt,output,shaModule,modelRequests,cdp,sessionId,openStorage,requireController}){
  const proof={status:'FAIL',scope:'Actual explicit browser derivation and complete native OPFS output hash; desktop only.',
    additionalBytes:BROWSER_VARIANT_DESCRIPTOR.payloadBytes,qualityAccepted:false,physicalPhoneQualified:false};
  receipt.variant=proof;const before=modelRequests(),started=performance.now();
  need(receipt.cleanup.staticServerClosedBeforeOffline&&receipt.cleanup.mirrorClosedBeforeOffline,'Variant proof requires true offline origin');
  await click('#notificationpanel [data-ai-act="prepare-variant"]','Explicitly prepare faster drawing from installed browser bytes');
  proof.ui=await until('actual offline derived representation ready',`(()=>{const e=document.querySelector('#notificationpanel [data-local-ai]');
    if(e?.dataset.aiStorageError)throw Error(e.dataset.aiStorageError);
    if(e?.dataset.aiModelSelection!=='browser-block32'||e.dataset.aiVariantReady!=='true'||e.querySelector('[data-ai-act="stop-download"]'))return null;
    return {selection:e.dataset.aiModelSelection,ready:e.dataset.aiVariantReady,text:e.textContent};})()`,900000);
  proof.prepareMs=performance.now()-started;
  proof.readback=await evaluate(`(${readNativeVariant.toString()})(${JSON.stringify({planSha256:BROWSER_VARIANT_DESCRIPTOR.sha256,files:FILES,shaModule})})`);
  assessNativeVariant(proof.readback,receipt.readback.status.attemptId);
  const mutant=structuredClone(proof.readback);mutant.files[1].sha256='0'.repeat(64);
  let refused=false;try{assessNativeVariant(mutant,receipt.readback.status.attemptId);}catch{refused=true;}
  need(refused,'Native variant hash corruption was accepted');proof.outputHashMutationRejected=true;
  assessNativeVariant(proof.readback,receipt.readback.status.attemptId);
  need(modelRequests()===before,'Offline derivation requested external model bytes');
  await screenshot('04b-offline-derived-model-ready.png');
  const oldDocument=await evaluate('window.__CF_SLICE__.documentToken');
  await cdp.send('Page.reload',{ignoreCache:false},sessionId);
  await until('new offline document before variant verification',`window.__CF_SLICE__?.documentToken!==${JSON.stringify(oldDocument)}&&window.__CF_SLICE__?.api.state().localAi.available`,120000);
  proof.controller=await requireController('offline reloaded variant before explicit verification',oldDocument);
  await openStorage();
  need(await evaluate(`document.querySelector('#notificationpanel [data-local-ai]')?.dataset.aiVariantReady==='false'`),'Reload trusted variant metadata without verification');
  await click('#notificationpanel [data-ai-act="verify"]','Verify parent again in the new offline document');
  await until('reloaded offline parent verification',`(()=>{const e=document.querySelector('#notificationpanel [data-local-ai]');if(e?.dataset.aiStorageError)throw Error(e.dataset.aiStorageError);return /Model ready/.test(e?.textContent??'')&&!e.querySelector('[data-ai-act="stop-download"]');})()`,900000);
  await click('#notificationpanel [data-ai-act="verify-variant"]','Explicitly verify retained faster drawing after offline reload');
  proof.reloadedUi=await until('retained native variant rehashed before selection',`(()=>{const e=document.querySelector('#notificationpanel [data-local-ai]');
    if(e?.dataset.aiStorageError)throw Error(e.dataset.aiStorageError);
    if(e?.dataset.aiModelSelection!=='browser-block32'||e.dataset.aiVariantReady!=='true'||e.querySelector('[data-ai-act="stop-download"]'))return null;
    return {selection:e.dataset.aiModelSelection,ready:e.dataset.aiVariantReady,text:e.textContent};})()`,900000);
  proof.reloadedReadback=await evaluate(`(${readNativeVariant.toString()})(${JSON.stringify({planSha256:BROWSER_VARIANT_DESCRIPTOR.sha256,files:FILES,shaModule})})`);
  assessNativeVariant(proof.reloadedReadback,receipt.readback.status.attemptId);
  need(JSON.stringify(proof.reloadedReadback)===JSON.stringify(proof.readback),'Offline reload changed the exact retained native variant');
  need(modelRequests()===before,'Offline variant reload attempted a model request');
  await screenshot('04c-offline-variant-reverified.png');
  proof.status='VERIFIED_NATIVE_VARIANT';
  await fs.writeFile(path.join(output,'native-variant.json'),JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
  return proof;
}
