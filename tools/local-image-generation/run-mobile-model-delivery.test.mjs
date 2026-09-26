/** Assessor controls only. No model bytes, browser, inference or qualification. */
import assert from 'node:assert/strict';
import test from 'node:test';
import {compileNativeDeliveryDiagnostic} from './compile-delivery-diagnostic.mjs';
import {createHash} from 'node:crypto';
import {PINNED_LOCAL_MODEL_MANIFEST_V1 as model} from '../../port/v2/apps/game/src/local-model-manifest.ts';
import {assessNativeController,assessNativeReadback,readNativeCommittedPrefix} from './run-mobile-model-delivery.mjs';
const expected=model.files.map((file,index)=>({...file,headSha256:createHash('sha256').update('synthetic-head-'+index).digest('hex'),tailSha256:createHash('sha256').update('synthetic-tail-'+index).digest('hex')}));
const fixture=()=>({status:{ready:true,phase:'ready',error:null,totalBytes:model.totalBytes,verifiedBytes:model.totalBytes,verifiedFiles:model.files.length,totalFiles:model.files.length,manifestSha256:createHash('sha256').update(JSON.stringify(model)).digest('hex')},files:structuredClone(expected)});
test('admits complete ordered synthetic counterpart only; no native inference claim',()=>{assert.doesNotThrow(()=>assessNativeReadback(fixture(),expected));});
test('rejects absent/not-ready/inconsistent-phase/error status',()=>{for(const change of [{ready:false},{phase:'verifying'},{error:'failed'}]){const result=fixture();Object.assign(result.status,change);assert.throws(()=>assessNativeReadback(result,expected));}assert.throws(()=>assessNativeReadback(null,expected));});
test('rejects incomplete and mismatched totals',()=>{for(const field of ['totalBytes','verifiedBytes','verifiedFiles','totalFiles']){const result=fixture();result.status[field]--;assert.throws(()=>assessNativeReadback(result,expected));}});
test('rejects a stale or substituted normalized manifest SHA',()=>{const result=fixture();result.status.manifestSha256='0'.repeat(64);assert.throws(()=>assessNativeReadback(result,expected));});
test('rejects missing, duplicated or reordered Blob carriers',()=>{for(const change of [rows=>rows.pop(),rows=>rows.reverse(),rows=>{rows[1]=rows[0];}]){const result=fixture();change(result.files);assert.throws(()=>assessNativeReadback(result,expected));}});
test('rejects corrupt head/tail and wrong declared Blob length',()=>{for(const field of ['headSha256','tailSha256','bytes']){const result=fixture();result.files[0][field]=field==='bytes'?result.files[0].bytes-1:'0'.repeat(64);assert.throws(()=>assessNativeReadback(result,expected));}});
test('rejects a changed file path even when byte samples match another carrier',()=>{const result=fixture();result.files[0].path='unbound.bin';assert.throws(()=>assessNativeReadback(result,expected));});
test('pinned CLI compiles only the two production owners and preserves the real constructor error code',async()=>{
  const {deliveryModule,shaModule,shaImport,provenance}=await compileNativeDeliveryDiagnostic();
  assert.equal(provenance.compiler.version,'7.0.2');assert.equal(provenance.exitCode,0);
  assert.equal(provenance.sources.length,2);assert.equal(provenance.outputs.length,2);
  assert.equal(provenance.sourcesUnchanged,true);assert.equal(provenance.temporaryRemoved,true);
  const shaUrl='data:text/javascript;base64,'+Buffer.from(shaModule).toString('base64');
  const ownerUrl='data:text/javascript;base64,'+Buffer.from(deliveryModule.replace(shaImport,JSON.stringify(shaUrl))).toString('base64');
  const {createLocalModelDeliveryV1}=await import(ownerUrl);
  assert.throws(()=>createLocalModelDeliveryV1({manifest:{...model,totalBytes:0}}),error=>error.code==='invalid-manifest-total');
  const owner=createLocalModelDeliveryV1({manifest:model});assert.equal(owner.status().ready,false);assert.equal(owner.status().phase,'unknown');assert.equal(owner.manifest.totalBytes,model.totalBytes);
});

const controllerFixture=()=>({controlled:true,controllerState:'activated',controllerScriptURL:'http://127.0.0.1:54321/service-worker.js',origin:'http://127.0.0.1:54321',documentToken:'new-document'});
test('admits exact activated package controller on a new document',()=>{assert.doesNotThrow(()=>assessNativeController(controllerFixture(),'http://127.0.0.1:54321','previous-document'));});
test('rejects uncontrolled, stale-document, substituted-script and wrong-origin controller observations',()=>{
  const origin='http://127.0.0.1:54321';
  for(const mutant of [null,{controlled:false},{controllerState:'activating'},{controllerScriptURL:origin+'/other-worker.js'},
    {controllerScriptURL:origin+'/service-worker.js?stale=1'},{origin:'http://127.0.0.1:54322'},{documentToken:''},{documentToken:'previous-document'}])
    assert.throws(()=>assessNativeController(mutant===null?null:{...controllerFixture(),...mutant},origin,'previous-document'));
});

const markerSha='a'.repeat(64);
function prefixRoot({size=1048576,marker={schema:'cf.local-model-attempt.v1',manifestSha256:markerSha,attemptId:'native-attempt'},error=null}={}){
  const attempt={async getFileHandle(name){assert.equal(name,'f0-c3');if(error)throw error;return {async getFile(){return {size};}};}};
  const directory={async getFileHandle(name){assert.equal(name,'active-'+markerSha+'.json');return {async getFile(){return new Blob([JSON.stringify(marker)]);}};},
    async getDirectoryHandle(name){assert.equal(name,'native-attempt');return attempt;}};
  return {async getDirectoryHandle(name){assert.equal(name,'cf-local-model-delivery-v1');return directory;}};
}
test('live prefix waits for only the exact committed chunk, without directory enumeration',async()=>{
  assert.deepEqual(await readNativeCommittedPrefix(prefixRoot(),markerSha),{attemptId:'native-attempt',chunk:'f0-c3',bytes:1048576});
  assert.equal(await readNativeCommittedPrefix(prefixRoot({size:0}),markerSha),null);
  assert.equal(await readNativeCommittedPrefix(prefixRoot({error:new DOMException('not yet committed','NotFoundError')}),markerSha),null);
  assert.deepEqual(await readNativeCommittedPrefix(prefixRoot(),markerSha),{attemptId:'native-attempt',chunk:'f0-c3',bytes:1048576});
});
test('live prefix refuses corrupt marker/chunk and propagates unrelated storage errors',async()=>{
  for(const marker of [{schema:'wrong',manifestSha256:markerSha,attemptId:'native-attempt'},
    {schema:'cf.local-model-attempt.v1',manifestSha256:'b'.repeat(64),attemptId:'native-attempt'},
    {schema:'cf.local-model-attempt.v1',manifestSha256:markerSha,attemptId:'../foreign'}])
    await assert.rejects(readNativeCommittedPrefix(prefixRoot({marker}),markerSha));
  await assert.rejects(readNativeCommittedPrefix(prefixRoot({size:5}),markerSha));
  await assert.rejects(readNativeCommittedPrefix(prefixRoot({error:new DOMException('refused','NotAllowedError')}),markerSha),{name:'NotAllowedError'});
});
