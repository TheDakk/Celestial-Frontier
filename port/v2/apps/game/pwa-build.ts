/// <reference types="node" />

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

export const CF_PWA_SCHEMA = 'cf-v2-pwa-build/v1' as const;
export const CF_PWA_SERVICE_WORKER = 'service-worker.js' as const;
export const CF_PWA_MANIFEST = 'manifest.webmanifest' as const;
export const CF_PWA_ICON = 'icons/celestial-frontier.svg' as const;
export const CF_PWA_MASKABLE_ICON = 'icons/celestial-frontier-maskable.svg' as const;

export interface PwaAssetDigestV1 {
  readonly path: string;
  readonly sha256: string;
}

const textEncoder = new TextEncoder();

function normalizeBase(base: string): string {
  if (!base.startsWith('/') || base.startsWith('//') || !base.endsWith('/')) {
    throw new Error(`Celestial Frontier PWA requires an absolute same-origin Vite base; received ${JSON.stringify(base)}`);
  }
  if (base.includes('?') || base.includes('#') || base.includes('\\')) {
    throw new Error(`Celestial Frontier PWA received an invalid Vite base ${JSON.stringify(base)}`);
  }
  return base.replace(/\/+/gu, '/');
}

function assetPath(base: string, fileName: string): string {
  const clean = fileName.replace(/^\/+/, '');
  if (clean.length === 0 || clean.includes('..') || clean.includes('\\')) {
    throw new Error(`Celestial Frontier PWA received an unsafe build path ${JSON.stringify(fileName)}`);
  }
  return `${base}${clean}`.replace(/\/+/gu, '/');
}

export function sha256Hex(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function compareAssetPath(
  left: Readonly<Pick<PwaAssetDigestV1, 'path'>>,
  right: Readonly<Pick<PwaAssetDigestV1, 'path'>>,
): number {
  return left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
}

export function canonicalPwaAssetTableV1(assets: readonly PwaAssetDigestV1[]): string {
  const sorted = [...assets].sort(compareAssetPath);
  const seen = new Set<string>();
  let canonical = `${CF_PWA_SCHEMA}\n`;
  for (const asset of sorted) {
    if (!asset.path.startsWith('/') || asset.path.includes('\t') || asset.path.includes('\n')) {
      throw new Error(`Celestial Frontier PWA received an invalid asset path ${JSON.stringify(asset.path)}`);
    }
    if (!/^[a-f0-9]{64}$/u.test(asset.sha256)) {
      throw new Error(`Celestial Frontier PWA received an invalid digest for ${asset.path}`);
    }
    if (seen.has(asset.path)) throw new Error(`Celestial Frontier PWA received duplicate asset ${asset.path}`);
    seen.add(asset.path);
    canonical += `${asset.path}\t${asset.sha256}\n`;
  }
  if (sorted.length === 0) throw new Error('Celestial Frontier PWA cannot publish an empty asset set');
  return canonical;
}

export function canonicalPwaBuildIdentityV1(
  assets: readonly PwaAssetDigestV1[],
  workerRevision: string,
): string {
  if (!/^[a-f0-9]{64}$/u.test(workerRevision)) {
    throw new Error('Celestial Frontier PWA received an invalid worker revision');
  }
  const assetsOnly = canonicalPwaAssetTableV1(assets);
  return `${CF_PWA_SCHEMA}\nworker\t${workerRevision}\n${assetsOnly.slice(`${CF_PWA_SCHEMA}\n`.length)}`;
}

const WORKER_TEMPLATE_SENTINEL = '0'.repeat(64);
const WORKER_TEMPLATE_BASE = '/__cf_pwa_template__/';
const WORKER_TEMPLATE_ASSETS = Object.freeze([Object.freeze({
  path: `${WORKER_TEMPLATE_BASE}index.html`,
  sha256: WORKER_TEMPLATE_SENTINEL,
})]);

/** Hashes the generated worker program with every build-specific field fixed
 * to a stable sentinel. A worker-logic-only edit therefore receives a new
 * cache/build identity without creating a self-referential digest. */
function workerTemplateSource(): string {
  return serviceWorkerProgram(
    WORKER_TEMPLATE_BASE,
    WORKER_TEMPLATE_ASSETS,
    WORKER_TEMPLATE_SENTINEL,
    WORKER_TEMPLATE_SENTINEL,
  );
}

export function pwaWorkerRevisionV1(): string {
  return sha256Hex(workerTemplateSource());
}

export function pwaBuildIdV1(
  assets: readonly PwaAssetDigestV1[],
  workerRevision = pwaWorkerRevisionV1(),
): string {
  return sha256Hex(canonicalPwaBuildIdentityV1(assets, workerRevision));
}

function iconSvg(maskable: boolean): string {
  const inset = maskable ? 92 : 40;
  const orbit = maskable ? 150 : 126;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Celestial Frontier star compass">
  <defs>
    <radialGradient id="space" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#20365f"/><stop offset=".58" stop-color="#0b1428"/><stop offset="1" stop-color="#05070d"/></radialGradient>
    <linearGradient id="star" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff6b7"/><stop offset=".48" stop-color="#7ee6ff"/><stop offset="1" stop-color="#b679ff"/></linearGradient>
  </defs>
  <rect width="512" height="512" rx="${maskable ? 0 : 104}" fill="url(#space)"/>
  <circle cx="256" cy="256" r="${orbit}" fill="none" stroke="#76cce8" stroke-opacity=".55" stroke-width="12"/>
  <ellipse cx="256" cy="256" rx="${orbit + 34}" ry="${Math.round((orbit + 34) * .42)}" fill="none" stroke="#d0a7ff" stroke-opacity=".72" stroke-width="10" transform="rotate(-22 256 256)"/>
  <path d="M256 ${inset} 294 218 ${512 - inset} 256 294 294 256 ${512 - inset} 218 294 ${inset} 256 218 218Z" fill="url(#star)" stroke="#f5fbff" stroke-width="7" stroke-linejoin="round"/>
  <circle cx="256" cy="256" r="32" fill="#07101e" stroke="#fff0a8" stroke-width="9"/>
  <circle cx="368" cy="151" r="13" fill="#fff0a8"/>
</svg>\n`;
}

function webManifest(base: string): string {
  return `${JSON.stringify({
    id: base,
    name: 'Celestial Frontier',
    short_name: 'Celestial Frontier',
    description: 'Explore, discover, craft, and care for companions across a deterministic universe.',
    lang: 'en',
    dir: 'ltr',
    start_url: base,
    scope: base,
    display: 'standalone',
    orientation: 'any',
    background_color: '#05070d',
    theme_color: '#0b1428',
    categories: ['games', 'entertainment'],
    icons: [
      { src: assetPath(base, CF_PWA_ICON), sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: assetPath(base, CF_PWA_MASKABLE_ICON), sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }, null, 2)}\n`;
}

function serviceWorkerProgram(
  base: string,
  canonicalAssets: readonly PwaAssetDigestV1[],
  buildId: string,
  workerRevision: string,
): string {
  const indexPath = assetPath(base, 'index.html');
  if (!canonicalAssets.some((asset) => asset.path === indexPath)) {
    throw new Error(`Celestial Frontier PWA build is missing ${indexPath}`);
  }

  return `/* ${CF_PWA_SCHEMA} — generated from exact Vite output; do not hand-edit. */
'use strict';
const SCHEMA=${JSON.stringify(CF_PWA_SCHEMA)};
const BUILD_ID=${JSON.stringify(buildId)};
const WORKER_REVISION=${JSON.stringify(workerRevision)};
const BASE_PATH=${JSON.stringify(base)};
const INDEX_PATH=${JSON.stringify(indexPath)};
const ASSETS=Object.freeze(${JSON.stringify(canonicalAssets)});
const CACHE_PREFIX='cf-v2-build-';
const CONTROL_CACHE='cf-v2-pwa-control-v1';
const CONTROL_STATE_PATH='__cf_pwa_control__/state-v1';
const CLIENT_PIN_PATH_PREFIX='__cf_pwa_control__/client-v1/';
const COMPLETE_PATH_PREFIX='__cf_pwa_complete__/';
const HEX64=/^[a-f0-9]{64}$/;

function buildCacheName(buildId){return CACHE_PREFIX+buildId;}
function absolute(path){return new URL(path,self.location.origin).href;}
function markerUrl(buildId){return new URL(COMPLETE_PATH_PREFIX+buildId,self.registration.scope).href;}
function stateUrl(){return new URL(CONTROL_STATE_PATH,self.registration.scope).href;}
function validClientId(value){return typeof value==='string'&&value.length>0&&value.length<=256&&!/[\\u0000-\\u001f\\u007f]/.test(value);}
function clientPinUrl(clientId){if(!validClientId(clientId))throw new Error('Refusing invalid PWA client identity');return new URL(CLIENT_PIN_PATH_PREFIX+encodeURIComponent(clientId),self.registration.scope).href;}
function clientPinPathPrefix(){return new URL(CLIENT_PIN_PATH_PREFIX,self.registration.scope).pathname;}
function canonicalBuildIdentity(assets,workerRevision){
  let value=SCHEMA+'\\nworker\\t'+workerRevision+'\\n';
  for(const asset of [...assets].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)){value+=asset.path+'\\t'+asset.sha256+'\\n';}
  return value;
}
async function sha256(value){
  const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map((byte)=>byte.toString(16).padStart(2,'0')).join('');
}
function markerBody(){return JSON.stringify({schema:SCHEMA,buildId:BUILD_ID,workerRevision:WORKER_REVISION,basePath:BASE_PATH,assets:ASSETS});}
function validAssetShape(asset){return !!asset&&typeof asset.path==='string'&&asset.path.startsWith(BASE_PATH)&&!asset.path.includes('\\t')&&!asset.path.includes('\\n')&&typeof asset.sha256==='string'&&HEX64.test(asset.sha256);}
async function decodeMarker(cache,buildId){
  if(!HEX64.test(buildId))return null;
  const response=await cache.match(markerUrl(buildId));
  if(!response)return null;
  let marker;
  try{marker=await response.json();}catch{return null;}
  if(!marker||marker.schema!==SCHEMA||marker.buildId!==buildId||typeof marker.workerRevision!=='string'||!HEX64.test(marker.workerRevision)||marker.basePath!==BASE_PATH||!Array.isArray(marker.assets)||marker.assets.length===0)return null;
  const seen=new Set();
  for(const asset of marker.assets){if(!validAssetShape(asset)||seen.has(asset.path))return null;seen.add(asset.path);}
  if(!seen.has(INDEX_PATH))return null;
  if(await sha256(canonicalBuildIdentity(marker.assets,marker.workerRevision))!==buildId)return null;
  return marker;
}
async function verifyCompleteBuild(buildId){
  if(!HEX64.test(buildId))return null;
  const cache=await caches.open(buildCacheName(buildId));
  const marker=await decodeMarker(cache,buildId);
  if(!marker)return null;
  for(const asset of marker.assets){
    const response=await cache.match(absolute(asset.path));
    if(!response||!response.ok||await sha256(await response.clone().arrayBuffer())!==asset.sha256)return null;
  }
  return {cache,marker};
}
function validState(value){return !!value&&value.schema===SCHEMA&&typeof value.activeBuildId==='string'&&HEX64.test(value.activeBuildId)&&(value.priorBuildId===null||(typeof value.priorBuildId==='string'&&HEX64.test(value.priorBuildId)&&value.priorBuildId!==value.activeBuildId));}
async function readState(){
  const cache=await caches.open(CONTROL_CACHE);
  const response=await cache.match(stateUrl());
  if(!response)return null;
  try{const value=await response.json();return validState(value)?value:null;}catch{return null;}
}
async function writeState(activeBuildId,priorBuildId){
  const value={schema:SCHEMA,activeBuildId,priorBuildId};
  if(!validState(value))throw new Error('Refusing invalid PWA control state');
  const cache=await caches.open(CONTROL_CACHE);
  await cache.put(stateUrl(),new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}}));
  return value;
}
async function readClientPin(clientId){
  if(!validClientId(clientId))return null;
  const cache=await caches.open(CONTROL_CACHE);
  const response=await cache.match(clientPinUrl(clientId));
  if(!response)return null;
  try{
    const value=await response.json();
    return value&&value.schema===SCHEMA&&value.clientId===clientId&&typeof value.buildId==='string'&&HEX64.test(value.buildId)?value.buildId:null;
  }catch{return null;}
}
async function writeClientPin(clientId,buildId){
  if(!validClientId(clientId)||!HEX64.test(buildId))throw new Error('Refusing invalid PWA client pin');
  const cache=await caches.open(CONTROL_CACHE);
  await cache.put(clientPinUrl(clientId),new Response(JSON.stringify({schema:SCHEMA,clientId,buildId}),{headers:{'content-type':'application/json'}}));
}
async function adoptLateFirstInstallWorker(state,clientId){
  if(state.activeBuildId!==BUILD_ID||state.priorBuildId!==null||!validClientId(clientId))return null;
  /* clients.matchAll() and clients.claim() can both omit a dedicated/shared
     worker until that realm is execution-ready. If worker-client creation and
     registration matching later make its lazy fetch controlled, that fetch
     supplies the one identity clients.get() can wait for and confirm. With no
     retained prior build there is exactly one cache identity to inherit;
     windows, absent clients and every two-build update remain fail-closed. */
  const client=await self.clients.get(clientId);
  if(!client||(client.type!=='worker'&&client.type!=='sharedworker'))return null;
  await writeClientPin(clientId,state.activeBuildId);
  return state.activeBuildId;
}
async function preserveLiveClientBuilds(state,requireActiveOnly){
  const clients=await self.clients.matchAll({type:'all',includeUncontrolled:true});
  const cache=await caches.open(CONTROL_CACHE);
  const liveIds=new Set();
  let safe=true;
  const retain=async(client)=>{
    if(!validClientId(client.id)){safe=false;return;}
    liveIds.add(client.id);
    const pinned=await readClientPin(client.id);
    const buildId=pinned??state.activeBuildId;
    if(pinned===null)await writeClientPin(client.id,buildId);
    if((buildId!==state.activeBuildId&&buildId!==state.priorBuildId)||(requireActiveOnly&&buildId!==state.activeBuildId))safe=false;
  };
  for(const client of clients)await retain(client);
  const prefix=clientPinPathPrefix();
  for(const request of await cache.keys()){
    const url=new URL(request.url);
    if(url.origin!==self.location.origin||!url.pathname.startsWith(prefix))continue;
    let clientId='';
    try{clientId=decodeURIComponent(url.pathname.slice(prefix.length));}catch{clientId='';}
    if(!validClientId(clientId)){await cache.delete(request);continue;}
    if(liveIds.has(clientId))continue;
    const client=await self.clients.get(clientId);
    if(client)await retain(client);else await cache.delete(request);
  }
  return safe;
}
async function pruneBuildCaches(keep){
  const names=await caches.keys();
  await Promise.all(names.map((name)=>name.startsWith(CACHE_PREFIX)&&!keep.has(name)?caches.delete(name):Promise.resolve(false)));
}
async function reply(source,message){if(source&&typeof source.postMessage==='function')source.postMessage(message);}
async function broadcast(message){const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients)client.postMessage(message);}
function statusMessage(state,phase){return {type:'CF_PWA_STATUS',schema:SCHEMA,workerBuildId:BUILD_ID,activeBuildId:state?.activeBuildId??null,priorBuildId:state?.priorBuildId??null,phase};}

self.addEventListener('install',(event)=>{
  event.waitUntil((async()=>{
    const cacheName=buildCacheName(BUILD_ID);
    /* An identical worker may be re-observed by browser recovery machinery.
       A complete same-identity cache is already the exact candidate; never
       delete the selected offline build merely to refetch identical bytes. */
    if(await verifyCompleteBuild(BUILD_ID))return;
    await caches.delete(cacheName);
    const cache=await caches.open(cacheName);
    try{
      for(const asset of ASSETS){
        const request=new Request(absolute(asset.path),{cache:'reload',credentials:'same-origin',redirect:'error'});
        const response=await fetch(request);
        if(!response.ok||response.redirected||new URL(response.url).href!==request.url)throw new Error('PWA asset fetch failed: '+asset.path);
        if(await sha256(await response.clone().arrayBuffer())!==asset.sha256)throw new Error('PWA asset digest mismatch: '+asset.path);
        await cache.put(request,response);
      }
      /* Written last: its presence means every exact response above was fetched and verified. */
      await cache.put(markerUrl(BUILD_ID),new Response(markerBody(),{headers:{'content-type':'application/json'}}));
    }catch(error){await caches.delete(cacheName);throw error;}
  })());
});

self.addEventListener('activate',(event)=>{
  event.waitUntil((async()=>{
    if(!await verifyCompleteBuild(BUILD_ID))throw new Error('Refusing to activate an incomplete PWA build');
    const previous=await readState();
    if(previous&&!await preserveLiveClientBuilds(previous,true))throw new Error('Refusing to evict a build still owned by an open Celestial Frontier document');
    const prior=previous&&previous.activeBuildId!==BUILD_ID&&await verifyCompleteBuild(previous.activeBuildId)?previous.activeBuildId:null;
    const state=await writeState(BUILD_ID,prior);
    await pruneBuildCaches(new Set([buildCacheName(BUILD_ID),...(prior?[buildCacheName(prior)]:[])]));
    if(!previous){
      if(!await preserveLiveClientBuilds(state,false))throw new Error('Refusing invalid first-install client ownership');
      await self.clients.claim();
      /* A worker can be created after the pre-claim snapshot but before the
         claim takes effect. Its entry loaded uncontrolled, so only this
         post-claim reconciliation can pin its first worker-local lazy fetch
         to the exact retained build. Activation remains the fetch barrier. */
      if(!await preserveLiveClientBuilds(state,false))throw new Error('Refusing invalid post-claim client ownership');
    }
    await broadcast(statusMessage(state,'active'));
  })());
});

self.addEventListener('message',(event)=>{
  const message=event.data;
  if(!message||typeof message.type!=='string')return;
  if(message.type==='CF_PWA_GET_STATUS'){
    const phase=message.target==='waiting'?'waiting':'active';
    event.waitUntil((async()=>reply(event.source,statusMessage(await readState(),phase)))());
    return;
  }
  if(message.type==='CF_PWA_ACTIVATE'&&message.buildId===BUILD_ID){
    event.waitUntil((async()=>{
      const state=await readState();
      if(state&&!await preserveLiveClientBuilds(state,true)){
        await reply(event.source,{type:'CF_PWA_ACTIVATE_RESULT',schema:SCHEMA,ok:false,buildId:BUILD_ID,reason:'prior-build-in-use'});return;
      }
      await reply(event.source,{type:'CF_PWA_ACTIVATE_RESULT',schema:SCHEMA,ok:true,buildId:BUILD_ID});
      await self.skipWaiting();
    })());
    return;
  }
  if(message.type==='CF_PWA_ROLLBACK'){
    event.waitUntil((async()=>{
      const state=await readState();
      if(!state||!state.priorBuildId||!await verifyCompleteBuild(state.activeBuildId)||!await verifyCompleteBuild(state.priorBuildId)){
        await reply(event.source,{type:'CF_PWA_ROLLBACK_RESULT',schema:SCHEMA,ok:false,reason:'no-complete-prior-build'});return;
      }
      if(!await preserveLiveClientBuilds(state,false)){
        await reply(event.source,{type:'CF_PWA_ROLLBACK_RESULT',schema:SCHEMA,ok:false,reason:'client-build-ownership-invalid'});return;
      }
      const next=await writeState(state.priorBuildId,state.activeBuildId);
      await pruneBuildCaches(new Set([buildCacheName(next.activeBuildId),buildCacheName(next.priorBuildId)]));
      const result={type:'CF_PWA_ROLLBACK_RESULT',schema:SCHEMA,ok:true,activeBuildId:next.activeBuildId,priorBuildId:next.priorBuildId};
      await reply(event.source,result);await broadcast(result);
    })());
  }
});

self.addEventListener('fetch',(event)=>{
  const request=event.request;
  event.respondWith((async()=>{
    const url=new URL(request.url);
    if(request.method!=='GET')return new Response('Celestial Frontier is local-first; this build has no network write route.',{status:405});
    if(url.origin!==self.location.origin)return new Response('External resources are not part of this Celestial Frontier build.',{status:403});
    const state=await readState();
    if(!state)return new Response('No complete Celestial Frontier build is active.',{status:503});
    const navigation=request.mode==='navigate'||request.destination==='document';
    const workerCreation=request.destination==='worker'||request.destination==='sharedworker';
    if(!navigation&&!validClientId(event.clientId))return new Response('This resource request has no Celestial Frontier document owner.',{status:503});
    let pinned=navigation?null:await readClientPin(event.clientId);
    if(!navigation&&pinned===null)pinned=await adoptLateFirstInstallWorker(state,event.clientId);
    if(!navigation&&pinned===null)return new Response('This document has no retained Celestial Frontier build.',{status:503});
    if(pinned!==null&&pinned!==state.activeBuildId&&pinned!==state.priorBuildId)return new Response('This document no longer owns a retained Celestial Frontier build.',{status:503});
    const selectedBuildId=pinned??state.activeBuildId;
    const cache=await caches.open(buildCacheName(selectedBuildId));
    const marker=await decodeMarker(cache,selectedBuildId);
    if(!marker)return new Response('The selected Celestial Frontier build is incomplete.',{status:503});
    const requestedPath=navigation
      ? (marker.assets.some((asset)=>asset.path===url.pathname&&asset.path.endsWith('.html'))?url.pathname:INDEX_PATH)
      : url.pathname;
    if(!marker.assets.some((asset)=>asset.path===requestedPath))return new Response('Resource is not part of the selected Celestial Frontier build.',{status:503});
    const response=await cache.match(absolute(requestedPath));
    if(!response)return new Response('A required Celestial Frontier build resource is missing.',{status:503});
    if(navigation){
      const nextClientId=validClientId(event.resultingClientId)?event.resultingClientId:event.clientId;
      if(validClientId(nextClientId))await writeClientPin(nextClientId,selectedBuildId);
    }else if(workerCreation){
      if(!validClientId(event.resultingClientId))return new Response('The worker has no retained Celestial Frontier build identity.',{status:503});
      await writeClientPin(event.resultingClientId,selectedBuildId);
    }
    return response;
  })());
});
`;
}

function serviceWorkerSource(
  base: string,
  assets: readonly PwaAssetDigestV1[],
  workerRevision = pwaWorkerRevisionV1(),
): string {
  const canonicalAssets = Object.freeze([...assets].sort(compareAssetPath));
  const buildId = pwaBuildIdV1(canonicalAssets, workerRevision);
  return serviceWorkerProgram(base, canonicalAssets, buildId, workerRevision);
}

function outputBytes(output: { readonly type: string; readonly code?: string; readonly source?: string | Uint8Array }): Uint8Array {
  if (output.type === 'chunk') {
    if (typeof output.code !== 'string') throw new Error('Celestial Frontier PWA received a chunk without code');
    return textEncoder.encode(output.code);
  }
  if (typeof output.source === 'string') return textEncoder.encode(output.source);
  if (output.source instanceof Uint8Array) return output.source;
  throw new Error('Celestial Frontier PWA received an asset without bytes');
}

export function celestialFrontierPwaPlugin(): Plugin {
  let resolved: ResolvedConfig | null = null;
  let base = '/';
  let runtimeFileNames: readonly string[] = Object.freeze([]);
  return {
    name: 'celestial-frontier-exact-pwa',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      resolved = config;
      base = normalizeBase(config.base);
    },
    buildStart() {
      this.emitFile({ type: 'asset', fileName: CF_PWA_MANIFEST, source: webManifest(base) });
      this.emitFile({ type: 'asset', fileName: CF_PWA_ICON, source: iconSvg(false) });
      this.emitFile({ type: 'asset', fileName: CF_PWA_MASKABLE_ICON, source: iconSvg(true) });
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!context.path.endsWith('/index.html') && context.path !== '/index.html') return html;
        return {
          html,
          tags: [
            { tag: 'link', attrs: { rel: 'manifest', href: assetPath(base, CF_PWA_MANIFEST) }, injectTo: 'head' },
            { tag: 'link', attrs: { rel: 'icon', href: assetPath(base, CF_PWA_ICON), type: 'image/svg+xml' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'theme-color', content: '#0b1428' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'cf-pwa-enabled', content: 'true' }, injectTo: 'head' },
          ],
        };
      },
    },
    generateBundle(_options, bundle) {
      if (!resolved) throw new Error('Celestial Frontier PWA plugin was not configured');
      runtimeFileNames = Object.keys(bundle)
        .filter((fileName) => fileName !== CF_PWA_SERVICE_WORKER && !fileName.endsWith('.map'))
        .sort();
      const assets = runtimeFileNames
        .map((fileName) => {
          const output = bundle[fileName];
          if (!output) throw new Error(`Celestial Frontier PWA lost build output ${fileName}`);
          return Object.freeze({
            path: assetPath(base, fileName),
            sha256: sha256Hex(outputBytes(output)),
          });
        })
        .sort(compareAssetPath);
      this.emitFile({
        type: 'asset',
        fileName: CF_PWA_SERVICE_WORKER,
        source: serviceWorkerSource(base, assets),
      });
    },
    writeBundle: {
      order: 'post',
      handler(options) {
        if (!resolved) throw new Error('Celestial Frontier PWA plugin was not configured');
        if (runtimeFileNames.length === 0) throw new Error('Celestial Frontier PWA runtime inventory is empty');
        const outDir = options.dir
          ? resolve(resolved.root, options.dir)
          : resolve(resolved.root, resolved.build.outDir);
        /* Some Vite/Rolldown finalizers append source-map references after
           generateBundle. Hash the bytes that were actually written, then
           replace only the generated worker. This prevents a plausible
           pre-finalization digest from rejecting the real deployed bundle. */
        const assets = runtimeFileNames.map((fileName) => Object.freeze({
          path: assetPath(base, fileName),
          sha256: sha256Hex(readFileSync(resolve(outDir, fileName))),
        }));
        writeFileSync(
          resolve(outDir, CF_PWA_SERVICE_WORKER),
          serviceWorkerSource(base, assets),
          'utf8',
        );
      },
    },
  };
}

export const __pwaBuildTestOnly = Object.freeze({
  assetPath,
  iconSvg,
  normalizeBase,
  serviceWorkerSource,
  workerTemplateSource,
  webManifest,
});
