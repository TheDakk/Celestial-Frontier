/** Readback assessor controls. Synthetic metadata is not native OPFS proof. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {assessNativeVariant} from './offline-variant-proof.mjs';
import {BROWSER_VARIANT_DESCRIPTOR,assertBrowserVariantPlan} from './browser-variant-source.mjs';
import {PINNED_LOCAL_MODEL_MANIFEST_V1 as MODEL} from '../../port/v2/apps/game/src/local-model-manifest.ts';
const plan=JSON.parse(await fs.readFile(new URL('./browser-variant-plan.json',import.meta.url),'utf8'));
const parent='exact-parent-attempt';
function fixture(){
  const marker={schema:'cf.local-model-variant-ready.v1',variant:'q8-block32-repacked-v1',
    planSha256:BROWSER_VARIANT_DESCRIPTOR.sha256,parentManifestSha256:createHash('sha256').update(JSON.stringify(MODEL)).digest('hex'),
    parentAttemptId:parent,sourceManifestSha256:MODEL.sourceManifestSha256,files:plan.files,
    payloadBytes:BROWSER_VARIANT_DESCRIPTOR.payloadBytes,qualityAccepted:false,deviceQualified:false};
  const pointer={schema:'cf.local-model-variant-pointer.v1',attemptId:'variant-attempt',marker};
  const binding={schema:'cf.local-model-variant-attempt.v1',attemptId:pointer.attemptId,
    planSha256:marker.planSha256,parentManifestSha256:marker.parentManifestSha256,parentAttemptId:parent};
  const files=plan.files.map(row=>({...row,chunks:Math.ceil(row.bytes/1048576)})),entries=['ready.json','attempt.json'];
  for(let i=0;i<files.length;i++)for(let part=0;part<files[i].chunks;part++)entries.push(`f${i}-c${part}`);
  return structuredClone({marker,pointer,binding,files,entries,totalBytes:marker.payloadBytes});
}
test('exact ordered full-file readback and parent-bound markers pass without granting phone/art acceptance',()=>{
  assert.doesNotThrow(()=>assessNativeVariant(fixture(),parent));
});
test('rejects altered full bytes, missing/inconsistent chunks, marker/parent changes and extra/missing inventory',()=>{
  for(const change of [v=>v.files[1].sha256='0'.repeat(64),v=>v.files[0].bytes--,v=>v.files[1].chunks--,
    v=>v.files.reverse(),v=>v.files.pop(),v=>v.totalBytes--,v=>v.marker.qualityAccepted=true,
    v=>v.marker.deviceQualified=true,v=>v.marker.parentAttemptId='another',v=>v.marker.planSha256='0'.repeat(64),
    v=>v.pointer.schema='unknown',v=>v.pointer.attemptId='../escape',v=>v.binding.attemptId='unrelated',
    v=>v.entries.pop(),v=>v.entries.push('revoked.json')]){
    const value=fixture();change(value);assert.throws(()=>assessNativeVariant(value,parent));
  }
  assert.throws(()=>assessNativeVariant(fixture(),'different-parent'));
  assert.throws(()=>assessNativeVariant(null,parent));
  assert.doesNotThrow(()=>assessNativeVariant(fixture(),parent));
});
test('author plan loader rejects changed/truncated bytes and restores exact descriptor',async()=>{
  const bytes=await fs.readFile(new URL('./browser-variant-plan.json',import.meta.url));
  assert.deepEqual(assertBrowserVariantPlan(bytes),BROWSER_VARIANT_DESCRIPTOR);
  const altered=Buffer.from(bytes);altered[200]^=1;
  assert.throws(()=>assertBrowserVariantPlan(altered),/pinned source/);
  assert.throws(()=>assertBrowserVariantPlan(bytes.subarray(1)),/pinned source/);
  assert.deepEqual(assertBrowserVariantPlan(bytes),BROWSER_VARIANT_DESCRIPTOR);
});
