import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {measureMobileBudget,inspectPwaInventory,pinnedModelDeliveryPolicy} from './mobile-pack.mjs';
import {__pwaBuildTestOnly,pwaWorkerRevisionV1,sha256Hex} from '../../port/v2/apps/game/pwa-build.ts';
const policy=pinnedModelDeliveryPolicy(),url=policy.files[0].url;
const origin='https://game.test',client='client-current';
class Cache {rows=new Map();async match(request){return this.rows.get(typeof request==='string'?request:request.url)?.clone();}
  async put(request,response){this.rows.set(typeof request==='string'?request:request.url,response.clone());}
  async delete(request){return this.rows.delete(typeof request==='string'?request:request.url);}async keys(){return [...this.rows.keys()].map(url=>new Request(url));}}
class Caches {rows=new Map();async open(name){if(!this.rows.has(name))this.rows.set(name,new Cache());return this.rows.get(name);}
  async keys(){return [...this.rows.keys()];}async delete(name){return this.rows.delete(name);}}
async function harness(optional=true){
  const rows={'/index.html':'<html>exact optional fixture</html>','/__local_ai/runtime.json':'{"modelSource":"verified-opfs-only"}'};
  const assets=Object.entries(rows).map(([path,body])=>({path,sha256:sha256Hex(body)}));
  const source=__pwaBuildTestOnly.serviceWorkerSource('/',assets,pwaWorkerRevisionV1(optional?policy:undefined),optional?policy:undefined);
  const listeners=new Map(),caches=new Caches(),fetches=[];const state={available:true};
  const self={location:new URL(origin+'/service-worker.js'),registration:{scope:origin+'/'},
    addEventListener:(name,listener)=>listeners.set(name,listener),clients:{claim:async()=>{},
      matchAll:async()=>[{id:client,type:'window',postMessage(){}}],get:async id=>id===client?{id:client}:null}};
  const fetcher=async request=>{fetches.push({url:request.url,range:request.headers.get('range'),credentials:request.credentials,cache:request.cache});
    if(request.url.startsWith(origin)){const value=rows[new URL(request.url).pathname];if(value===undefined||!state.available)throw Error('offline');
      const response=new Response(value);Object.defineProperty(response,'url',{value:request.url});return response;}
    return new Response(new Uint8Array([1,2,3]),{status:request.headers.has('range')?206:200,headers:{'content-range':'bytes 1-3/4'}});};
  vm.runInNewContext(source,{self,caches,crypto:webcrypto,TextEncoder,Request,Response,URL,fetch:fetcher,Set,Map,console});
  async function dispatch(type,init={}){let pending;listeners.get(type)({...init,waitUntil:value=>pending=value,respondWith:value=>pending=value});return pending;}
  await dispatch('install');await dispatch('activate');
  return {source,caches,fetches,state,dispatch,external:(address=url,options={},owner=client)=>dispatch('fetch',{request:new Request(address,{mode:'cors',credentials:'omit',...options}),clientId:owner})};
}

test('ordinary PWA generated worker revision is byte-identical to signed pre-mobile HEAD',()=>{
  const baseline=execFileSync('git',['show','83ee60f3:port/v2/apps/game/pwa-build.ts'],{encoding:'utf8'});
  const program=stripTypeScriptTypes(baseline.replace(/^import .*\n/gm,'').replace(/^export /gm,''),{mode:'strip'});
  const prior=vm.runInNewContext(program+'\npwaWorkerRevisionV1();',{TextEncoder,TextDecoder,createHash});
  assert.equal(pwaWorkerRevisionV1(),prior);
  assert.notEqual(pwaWorkerRevisionV1(policy),prior);
});

test('combined and retained exact byte boundaries reject invalid counts and +1',()=>{
  assert.equal(measureMobileBudget(134217728,134217728).retainedStaticBytes,268435456);
  for(const args of [[134217729],[1,134217729],[NaN],[0],[-1],[1.5],[Number.MAX_SAFE_INTEGER]])assert.throws(()=>measureMobileBudget(...args));
  assert.equal(measureMobileBudget(100,200).retainedStaticBytes,300);
});

test('exact external model policy rejects changed host, revision, queries, duplicates and oversized files',()=>{
  assert.equal(__pwaBuildTestOnly.modelDeliveryPolicy(policy).files.length,20);
  for(const mutate of [p=>p.files[0].url+='?leak=x',p=>p.files[0].url=p.files[0].url.replace('huggingface.co','attacker.test'),
    p=>p.files[0].url=p.files[0].url.replace('/resolve/3bffc','/resolve/fffff'),p=>p.files.push({...p.files[0]}),
    p=>p.files[0].bytes=2147483649,p=>p.sourceManifestSha256='missing']){
    const changed=structuredClone(policy);mutate(changed);assert.throws(()=>__pwaBuildTestOnly.modelDeliveryPolicy(changed));}
});

test('optional first install pre-caches only exact app/runtime assets; external request is explicit, streaming and uncached',async()=>{
  const run=await harness();assert.equal(run.fetches.length,2);assert.ok(run.fetches.every(row=>row.url.startsWith(origin)));
  const before=[...run.caches.rows.values()].reduce((n,cache)=>n+cache.rows.size,0);
  const response=await run.external();assert.equal(response.status,200);assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3]);
  assert.equal(run.fetches.at(-1).credentials,'omit');assert.equal(run.fetches.at(-1).cache,'no-store');
  assert.equal([...run.caches.rows.values()].reduce((n,cache)=>n+cache.rows.size,0),before);
  const ranged=await run.external(url,{headers:{Range:'bytes=1-'}});assert.equal(ranged.status,206);assert.equal(run.fetches.at(-1).range,'bytes=1-');
});

test('optional model transport refuses unpinned endpoints, query changes, writes, credentials, bad ranges and absent owners without fetching',async()=>{
  const run=await harness(),before=run.fetches.length;
  for(const [address,options,owner,status]of [
    [url+'?q=secret',{},client,403],['https://attacker.test/file',{},client,403],[url.replace('/resolve/3bffc','/resolve/fffff'),{},client,403],
    [url,{method:'POST'},client,405],[url,{credentials:'include'},client,403],
    [url,{headers:{Range:'bytes=1-2'}},client,416],[url,{headers:{Range:'bytes='+policy.files[0].bytes+'-'}},client,416],
    [url,{},'',503],[url,{},'unknown-client',503]])assert.equal((await run.external(address,options,owner)).status,status);
  assert.equal(run.fetches.length,before);assert.equal((await run.external()).status,200);
});

test('ordinary worker retains external refusal and optional exact app/runtime reads survive network loss',async()=>{
  const normal=await harness(false);assert.equal((await normal.external()).status,403);assert.equal(normal.fetches.length,2);
  const run=await harness();run.state.available=false;const before=run.fetches.length;
  const response=await run.dispatch('fetch',{request:new Request(origin+'/__local_ai/runtime.json'),clientId:client});
  assert.equal(response.status,200);assert.equal(await response.text(),'{"modelSource":"verified-opfs-only"}');assert.equal(run.fetches.length,before);
});

test('optional install counts active, prior and candidate payloads and stops without evicting prior data',async()=>{
  const run=await harness(),candidate='cf-v2-build-'+inspectPwaInventory(run.source).buildId;
  await run.caches.delete(candidate);
  const retained=await run.caches.open('cf-v2-build-'+'b'.repeat(64));
  // Synthetic Cache body-length fixture avoids allocating 256MiB in a logic
  // control. Native CacheStorage bytes and device quota are separate evidence.
  let retainedBytes=268435456;
  const body={clone(){return this;},async arrayBuffer(){return {byteLength:retainedBytes};}};
  retained.rows.set(origin+'/retained-fixture',body);
  await assert.rejects(run.dispatch('install'),/exceeds 256 MiB/);
  assert.equal(run.caches.rows.has(candidate),false);assert.equal(retained.rows.size,1);
  retainedBytes=1;await run.dispatch('install');
  assert.equal(run.caches.rows.has(candidate),true);assert.equal(retained.rows.size,1);
});

test('PWA inspector binds table digest and rejects omitted, duplicate or changed assets',async()=>{
  const run=await harness(),good=inspectPwaInventory(run.source);assert.equal(good.assets.length,2);
  for(const source of [run.source.replace('exact-not-present','x').replace('const BUILD_ID="','const BUILD_ID="0'),
    run.source.replace('"path":"/__local_ai/runtime.json"','"path":"/index.html"'),
    run.source.replace('"path":"/__local_ai/runtime.json"','"path":"/omitted.json"')])assert.throws(()=>inspectPwaInventory(source));
});
