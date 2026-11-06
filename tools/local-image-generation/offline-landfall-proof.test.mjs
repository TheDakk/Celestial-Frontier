/** Byte/identity acceptor controls using a retained real PNG. These do not
 * execute a browser/model or classify the painting's species. */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {assessOfflineOriginal} from './offline-landfall-proof.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const root=new URL('../../audits/AI_SPECIES_MOBILE_20260909/native-generation-01/',import.meta.url);
const bytes=fs.readFileSync(new URL('raw-original.png',root));
const input=JSON.parse(fs.readFileSync(new URL('actual-landfall-input.json',root),'utf8'));
const fixture=()=>({schema:'cf.offline-viewer-original.v1',width:1024,height:576,type:'image/png',
  bytes:bytes.length,sha256:sha(bytes),base64:bytes.toString('base64'),originalId:sha(JSON.stringify(input))+':'+sha(bytes)});
test('admits the actual retained PNG with its full input and returns identical bytes',()=>{
  assert.equal(sha(bytes),'44f03a6c6c2e47c38d93106ce4ba08a3dcd7bac17320fd582aa57b8b6aa4c400');
  assert.deepEqual(assessOfflineOriginal(fixture(),input),bytes);
});
test('rejects absent, malformed, stale content and original identities',()=>{
  for(const change of [null,{schema:'other'},{width:1023},{height:575},{type:'image/jpeg'},{bytes:0},
    {bytes:bytes.length-1},{sha256:'0'.repeat(64)},{originalId:'unrelated'},
    {base64:bytes.subarray(1).toString('base64')},{base64:Buffer.alloc(bytes.length).toString('base64')}])
    assert.throws(()=>assessOfflineOriginal(change===null?null:{...fixture(),...change},input));
  for(const change of [{worldKey:'other'},{environmentId:'other'},{ecologyEpoch:1},{recipeKey:'other'},{snapshotDigest:'other'},{recipeJson:'{}'}])
    assert.throws(()=>assessOfflineOriginal(fixture(),{...input,...change}));
  assert.deepEqual(assessOfflineOriginal(fixture(),input),bytes);
});
test('rejects coherently rehashed wrong PNG magic or declared dimensions',()=>{
  for(const offset of [0,19,23]){
    const changed=Buffer.from(bytes);changed[offset]^=1;const digest=sha(changed);
    assert.throws(()=>assessOfflineOriginal({...fixture(),base64:changed.toString('base64'),sha256:digest,
      originalId:sha(JSON.stringify(input))+':'+digest},input));
  }
});
