import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { beforeAll, beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { buildBiomeVistaRenderRequestV1 } from '../apps/game/src/biome-vista-surface.js';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';
import { createLocalAiGameV1, canonicalKitJson } from '../apps/game/src/local-ai-game.js';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 as pin } from '../apps/game/src/local-model-manifest.js';
import type { AiLandfallInputV1, AiLandfallOriginalV1 } from '../apps/game/src/ai-landfall-originals.js';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const mocks = vi.hoisted(() => ({ store: vi.fn(), delivery: vi.fn(), probe: vi.fn(), generate: vi.fn(), runtime: vi.fn(), open: vi.fn(), close: vi.fn() }));
vi.mock('../apps/game/src/ai-landfall-originals.js', async original => ({ ...await original<object>(), createAiLandfallOriginalStoreV1: mocks.store }));
vi.mock('../apps/game/src/local-model-delivery.js', async original => ({ ...await original<object>(), createLocalModelDeliveryV1: mocks.delivery, probeLocalModelCapabilitiesV1: mocks.probe }));
vi.mock('../apps/game/src/local-ai-kit-runtime.js', () => ({ createWarmKitLandfallRuntimeV4: mocks.runtime }));
vi.mock('../apps/game/src/landfall-viewer.js', () => ({ createLandfallViewerV1: () => ({open:mocks.open,close:mocks.close}), captureLandfallFocusReturnV1: () => () => {} }));
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
function deferred<T>() { let resolve!: (x:T)=>void; const promise=new Promise<T>(r=>{resolve=r;});return {promise,resolve}; }
beforeAll(() => installCaptureHooks());
let dom: any;
beforeEach(() => { vi.clearAllMocks();dom=new JSDOM('<body></body>',{url:'http://localhost/'});vi.stubGlobal('document',dom.window.document);vi.stubGlobal('location',new URL('http://localhost/'));vi.stubGlobal('addEventListener',dom.window.addEventListener.bind(dom.window));mocks.probe.mockResolvedValue({supported:true}); });
afterEach(() => {dom.window.close();vi.unstubAllGlobals();});
function canonical() {
 const star={seed:424242,x:560,y:170},address=resolveCF1WorldAddress({galaxy:{seed:999,x:90,y:-60},star,planet:{seed:133}});
 const planet=systemScene(star.seed).planets.find(row=>row.seed===133);if(!address.ok||!planet)throw Error('fixture');
 const built=canonicalWorldRoster(address.address,0);if(!built.ok)throw Error('fixture');
 return {roster:built.roster,request:buildBiomeVistaRenderRequestV1(planet,star.seed,built.roster.worldKey,systemFor(star.seed) as Record<string,unknown>,built.roster)};
}
async function harness() {
 const originals=new Map<string,AiLandfallOriginalV1>();
 const retain=vi.fn(async(input:AiLandfallInputV1,pixels:any)=>{const row={...pixels,input,schema:'cf.ai-landfall-original.v1',originalId:input.recipeKey,sha256:'a'.repeat(64)} as AiLandfallOriginalV1; originals.set(input.recipeKey,row);return row;});
 const read=vi.fn(async(input:AiLandfallInputV1)=>originals.get(input.recipeKey)??null);
 mocks.store.mockReturnValue({retain,read,find:read,close(){}});
 const state={phase:'missing',ready:false},install=vi.fn(async(_options:{signal:AbortSignal;restart?:boolean})=>({...state})),verify=vi.fn(async()=>({...state}));
 mocks.delivery.mockReturnValue({manifest:pin,status:()=>state,install,verify,openFile:async()=>new Blob(['model'])});
 mocks.generate.mockResolvedValue({painting:new Blob(['synthetic painting'],{type:'image/png'}),width:1024,height:576});
 const dispose=vi.fn();mocks.runtime.mockReturnValue({generate:mocks.generate,dispose});
 const files=Object.fromEntries(pin.files.map(f=>[f.path,'/__local_ai/model/'+f.path]));
 const config={modelId:pin.modelId,modelRevision:pin.revision,modelSource:'verified-installed-developer-cache',modelFiles:files};
 const png=readFileSync(new URL('../apps/game/public/__local_ai/inputs/earth-composite.png',import.meta.url));
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>new Response(url.endsWith('runtime.json')?JSON.stringify(config):png)));
 let current=true;const notice=vi.fn(),view=vi.fn(async()=>true),refresh=vi.fn();
 const api=await createLocalAiGameV1({notice,view,refresh,captureView:()=>()=>current});
 const c=canonical(),input=api.prepare(c.request,c.roster);if(!input)throw Error('canonical kit did not compile');
 return {api,input,originals,retain,read,state,install,verify,dispose,notice,view,refresh,setCurrent:(v:boolean)=>{current=v;}};
}
describe('ordinary kit landfall adapter; explicit fake model and storage',()=>{
 it('preloads composite without inference; only kit recipe reaches the retained-original queue',async()=>{
  const h=await harness();expect((await h.api.composite(h.input)).size).toBeGreaterThan(1000);expect(mocks.generate).not.toHaveBeenCalled();
  h.api.enqueue(h.input);await tick();expect(mocks.generate).toHaveBeenCalledOnce();
  const recipe=mocks.generate.mock.calls[0]![0];expect(recipe.schema).toBe('cf.kit-engine.v4');expect(recipe.skipOrganismPasses).toBe(true);expect(recipe.finisherStrength).toBe(.35);
  expect(h.retain).toHaveBeenCalledOnce();expect(h.api.snapshot()[0]?.status).toBe('ready');expect(h.view).toHaveBeenCalledOnce();
  h.api.enqueue(h.input);await tick();expect(mocks.generate).toHaveBeenCalledOnce(); // retained revisit, no accidental new GPU job
 });
 it('reuses one warm runtime for distinct landing identities',async()=>{
  const h=await harness();h.api.enqueue(h.input);await tick();
  h.api.enqueue({...h.input,recipeKey:'next-canonical-landing',snapshotDigest:'b'.repeat(64)});await tick();
  expect(mocks.runtime).toHaveBeenCalledOnce();expect(mocks.generate).toHaveBeenCalledTimes(2);expect(h.dispose).not.toHaveBeenCalled();
 });
 it('View cannot enqueue on a stale route; Inspect reports a changed view',async()=>{
  const h=await harness();h.api.enqueue(h.input);await tick();const id=h.api.snapshot()[0]!.jobId;
  h.view.mockResolvedValue(false);h.view.mockClear();await h.api.action('view',id);expect(h.view).toHaveBeenCalledOnce();expect(mocks.generate).toHaveBeenCalledOnce();expect(h.notice).toHaveBeenCalledWith('Landfall retained',expect.any(String));
  h.setCurrent(false);await h.api.action('inspect',id);expect(mocks.open).not.toHaveBeenCalled();expect(h.notice).toHaveBeenCalledWith('View changed',expect.any(String));
  h.setCurrent(true);await h.api.action('inspect',id);expect(mocks.open).toHaveBeenCalledOnce();
 });
 it('post-bfcache pagehide still cancels a job on the second trip',async()=>{
  const h=await harness();
  for(let i=0;i<2;i++) {
   const wait=deferred<any>();mocks.generate.mockImplementationOnce((_r:any,signal:AbortSignal)=>{signal.addEventListener('abort',()=>wait.resolve({painting:new Blob(['cancel']),width:1024,height:576}));return wait.promise;});
   h.api.enqueue({...h.input,recipeKey:'hide-'+i});await tick();dom.window.dispatchEvent(new dom.window.Event('pagehide'));await tick();expect(h.api.snapshot().at(-1)?.status).toBe('canceled');
  }
  expect(h.retain).not.toHaveBeenCalled();
 });
 it('canceling model preparation resolves quietly; corrupt install exposes and invokes restart',async()=>{
  const h=await harness();h.install.mockImplementationOnce(({signal}:any)=>new Promise((_yes,no)=>signal.addEventListener('abort',()=>no(new DOMException('Paused','AbortError')))) as any);
  const pending=h.api.action('install','');await tick();await h.api.action('stop-download','');await expect(pending).resolves.toBeUndefined();expect(h.notice).not.toHaveBeenCalled();expect(h.api.html()).not.toContain('data-ai-storage-error="Paused');
  h.state.phase='invalid';expect(h.api.html()).toContain('data-ai-act="restart-install"');await h.api.action('restart-install','');expect(h.install.mock.calls.at(-1)?.[0]).toMatchObject({restart:true});
 });
 it('bad composite hash is refused instead of mounting altered source pixels',async()=>{
  const h=await harness();await h.api.composite(h.input); // baseline positive is independently hash checked
  vi.stubGlobal('fetch',vi.fn(async()=>new Response('changed')));
  const api=await createLocalAiGameV1({notice:vi.fn(),view:async()=>false,refresh:()=>{},captureView:()=>()=>true});
  await expect(api.composite(h.input)).rejects.toThrow('Earth composite changed');
 });
 it('canonical recipe identity rejects the old property-order instability',()=>{
  expect(canonicalKitJson({b:2,a:{z:1,y:0}})).toBe(canonicalKitJson({a:{y:0,z:1},b:2}));
  expect(JSON.stringify({b:2,a:1})).not.toBe(JSON.stringify({a:1,b:2}));
 });
});
