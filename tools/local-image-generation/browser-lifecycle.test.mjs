import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import {createLandingProgress} from './landing-progress.mjs';

const moduleSource = readFileSync(new URL('./browser-proof.mjs', import.meta.url), 'utf8');
const importLine="import {createLandingProgress} from './landing-progress.mjs';\n";
assert.equal(moduleSource.split(importLine).length,2);
const source=moduleSource.replace(importLine,'');
const flush = () => new Promise(resolve => setImmediate(resolve));
const rgb = () => new Float32Array([-1, 1, -0.5, 0.5, 0, 0.25]);

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function harness({ holdRecipe = false, holdReference = false, ignoreReferenceAbort = false, matte = undefined, modelDerivative = undefined,
  holdBitmap = false, holdPreparation = null, referenceFailure = null, bitmapCloseFailure = false } = {}) {
  const bytes = new Uint8Array([10, 20, 30, 40]);
  const reference = { url: '/reference.png', width: 2, height: 1, matte,
    sha256: createHash('sha256').update(bytes).digest('hex') };
  const config = { width: 2, height: 1, seed: 133, steps: 2, modelDerivative,
    modelRevision: 'fixture-model-revision', chatPrompt: 'fixture prompt', references: [reference] };
  const workers = [], live = new Set(), timers = new Map(), fetches = [], bitmaps = [], canvases = [], trace = [];
  const pendingReference = deferred(), pendingBitmap = deferred(), pendingPreparation = deferred();
  let digestCalls = 0,recipeFailure=false;
  const elements = Object.fromEntries(['events', 'status', 'generate', 'cancel', 'painting', 'landing-progress','landing-meter','landing-label','notice','notice-text','notice-open','planet','explore','planet-panel','journal-panel','roster']
    .map(id => [id, { textContent: '', disabled: false, hidden:false,setAttribute(name,value){this[name]=value;} }]));
  const frames = [];
  const painting = elements.painting;
  painting.getContext = kind => {
    assert.equal(kind, '2d');
    return {
      createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }),
      putImageData: image => {
        frames.push({ pixels: [...image.data], liveWorkers: live.size,
          terminations: workers.map(worker => worker.terminateCalls) });
        trace.push('paint');
      },
    };
  };
  painting.toDataURL = type => {
    assert.equal(type, 'image/png');
    trace.push('publish');
    return 'data:image/png;base64,VM_FIXTURE_ONLY';
  };
  class FakeWorker {
    constructor(url, options) {
      this.url = url; this.options = options; this.terminateCalls = 0;
      workers.push(this); live.add(this);
      trace.push(`worker:${workers.length}`);
    }
    postMessage(job, transfers) { this.job = job; this.transfers = transfers; this.progress('loading');this.progress('loaded'); }
    terminate() { this.terminateCalls++; live.delete(this); trace.push(`terminate:${this.job.stage}`); }
    complete(data = new Float32Array([0.1, 0.2])) {
      if(this.job.stage==='denoise')for(let step=1;step<=this.job.steps;step++)this.onmessage?.({data:{type:'progress',phase:'step',step,steps:this.job.steps}});
      this.onmessage?.({ data: { type: 'complete', data } });
    }
    progress(phase, message = '') { this.onmessage?.({ data: { type: 'progress', phase, message } }); }
  }
  const response = () => ({ ok: true, arrayBuffer: async () => {
    trace.push('reference-body');
    if(holdPreparation==='body')await pendingPreparation.promise;
    return bytes.slice().buffer;
  } });
  const window = {};
  const sandbox = {
    window, createLandingProgress, document: { getElementById: id => elements[id] }, Worker: FakeWorker,
    AbortController, Blob, performance: { now: () => 100 },
    crypto: { subtle: { digest: async (algorithm, input) => {
      assert.equal(algorithm, 'SHA-256');
      digestCalls++;const point=digestCalls===1?'source-hash':'pixel-hash';trace.push(point);
      if(holdPreparation===point)await pendingPreparation.promise;
      const digest = createHash('sha256').update(new Uint8Array(input)).digest();
      return digest.buffer.slice(digest.byteOffset, digest.byteOffset + digest.byteLength);
    } } },
    fetch: async (url, options = {}) => {
      fetches.push({ url, signal: options.signal });
      if (url === '/recipe.json') {
        assert.ok(options.signal instanceof AbortSignal);
        if(holdRecipe)return new Promise((resolve,reject)=>{
          options.signal.addEventListener('abort',()=>reject(new Error('Recipe request aborted')),{once:true});
        });
        return {ok:!recipeFailure,status:recipeFailure?503:200,json:async()=>config};
      }
      assert.equal(url, reference.url);
      assert.ok(options.signal instanceof AbortSignal);
      if (!holdReference) return response();
      if (!ignoreReferenceAbort) {
        options.signal.addEventListener('abort', () => pendingReference.reject(new Error('Reference fetch aborted')), { once: true });
      }
      return pendingReference.promise;
    },
    createImageBitmap: async () => {
      const bitmap = { closed: false, closeCalls: 0, close() {
        this.closeCalls++;this.closed = true;trace.push('bitmap-close');
        if(bitmapCloseFailure)throw Error('Bitmap close fixture failed');
      } };
      bitmaps.push(bitmap);
      if(holdBitmap)await pendingBitmap.promise;
      return bitmap;
    },
    OffscreenCanvas: class {
      constructor(width, height) {
        this._width=width;this._height=height;this.allocatedWidth=width;this.allocatedHeight=height;
        this.dimensionWrites=[];canvases.push(this);
      }
      get width(){return this._width;}
      get height(){return this._height;}
      set width(value){this.dimensionWrites.push(['width',value]);this._width=value;}
      set height(value){this.dimensionWrites.push(['height',value]);this._height=value;}
      getContext(kind) {
        assert.equal(kind, '2d');
        if(referenceFailure==='context-null')return null;
        if(referenceFailure==='context-throw')throw Error('Reference context fixture failed');
        return { fillStyle:'',fillRect(){trace.push('reference-fill:'+this.fillStyle);},
          drawImage() {
            if(referenceFailure==='draw')throw Error('Reference draw fixture failed');
            trace.push('reference-draw');
          }, getImageData: () => {
            if(referenceFailure==='getImageData')throw Error('Reference getImageData fixture failed');
            return { data: new Uint8ClampedArray([0, 64, 128, 255, 255, 191, 159, 255]) };
          } };
      }
    },
    setTimeout: (callback, delay) => { const handle = {}; timers.set(handle, { callback, delay }); return handle; },
    clearTimeout: handle => timers.delete(handle),
  };
  runInNewContext(source, sandbox, { filename: 'actual-browser-proof.mjs' });
  return { proof: window.cfImageProof, elements, workers, live, timers, fetches, frames, bitmaps, canvases, trace,
    setRecipeFailure:value=>{recipeFailure=value;},
    resolveReference: () => pendingReference.resolve(response()),
    resolveBitmap: () => pendingBitmap.resolve(), resolvePreparation: () => pendingPreparation.resolve() };
}

async function reachStage(h, index, { referenceEnabled = true } = {}) {
  const run = h.proof.generate({ referenceEnabled });
  await flush();
  for (let stage = 0; stage < index; stage++) {
    assert.equal(h.workers.length, stage + 1);
    h.workers[stage].complete();
    await flush();
  }
  return { run, worker: h.workers[index] };
}

function assertReferenceResourcesRetired(h) {
  for(const bitmap of h.bitmaps){assert.equal(bitmap.closed,true);assert.equal(bitmap.closeCalls,1);}
  for(const canvas of h.canvases){
    assert.equal(canvas.width,1);assert.equal(canvas.height,1);
    assert.deepEqual(canvas.dimensionWrites,[['width',1],['height',1]]);
  }
}

function assertFailed(h, message) {
  assert.equal(h.proof.state, 'failed');
  assert.match(h.proof.error, message);
  assert.equal(h.proof.png, undefined);
  assert.equal(h.frames.length, 0);
  assert.equal(h.live.size, 0);
  assert.equal(h.timers.size, 0);
  assert.ok(h.workers.every(worker => worker.terminateCalls === 1));
  assert.equal(h.elements.generate.disabled, false);
  assert.equal(h.elements.cancel.disabled, true);
  assertReferenceResourcesRetired(h);
}

test('actual four-stage flow publishes exact decoded pixels only after every worker retires', async () => {
  const h = harness();
  const { run, worker } = await reachStage(h, 3);
  assert.deepEqual(h.workers.map(row => row.job.stage), ['text', 'encode', 'denoise', 'decode']);
  assert.deepEqual(h.fetches.map(row => row.url), ['/recipe.json', '/reference.png']);
  assert.equal(h.bitmaps.length, 1);
  assertReferenceResourcesRetired(h);
  assert.equal(h.canvases.length,1);
  assert.equal(h.canvases[0].allocatedWidth,2);assert.equal(h.canvases[0].allocatedHeight,1);
  // Independent NCHW expected values, copied before scratch retirement.
  const expectedTensor=new Float32Array([-1,1,64/127.5-1,191/127.5-1,128/127.5-1,159/127.5-1]);
  assert.deepEqual([...h.workers[1].job.pixels],[...expectedTensor]);
  const prepared=h.proof.records.find(row=>row.phase==='reference-prepared');
  assert.equal(prepared.width,2);assert.equal(prepared.height,1);
  assert.equal(prepared.pixelSha256,createHash('sha256').update(new Uint8Array(expectedTensor.buffer)).digest('hex'));
  assert.equal(h.workers[2].job.references.length, 1);
  assert.equal(h.workers[2].job.references[0].width, 2);
  assert.equal(h.workers[2].job.references[0].height, 1);
  assert.deepEqual([...h.workers[2].job.embedding], [Math.fround(0.1), Math.fround(0.2)]);
  assert.equal(h.proof.state, 'running');
  assert.equal(h.elements.generate.disabled, true);
  assert.equal(h.proof.png, undefined);
  assert.equal(h.frames.length, 0);
  assert.deepEqual(h.workers.map(row => row.terminateCalls), [1, 1, 1, 0]);
  worker.complete(rgb());
  assert.equal(await run, 'complete');
  assert.deepEqual(h.frames, [{ pixels: [0, 64, 128, 255, 255, 191, 159, 255], liveWorkers: 0, terminations: [1, 1, 1, 1] }]);
  assert.equal(h.proof.png, 'data:image/png;base64,VM_FIXTURE_ONLY');
  assert.deepEqual(h.trace.slice(-3), ['terminate:decode', 'paint', 'publish']);
  assert.equal(h.proof.records.at(-1).phase, 'complete');
  assert.equal(h.proof.records.at(-1).qualityAccepted, false);
  assert.equal(h.elements.generate.disabled, false);
  assert.equal(h.elements.cancel.disabled, true);
  assert.equal(h.timers.size, 0);
});

for (const ignoreReferenceAbort of [false, true]) {
  test(`cancel during pending reference fetch cannot launch an encoder (fetch ignores abort: ${ignoreReferenceAbort})`, async () => {
    const h = harness({ holdReference: true, ignoreReferenceAbort });
    const { run, worker } = await reachStage(h, 0);
    worker.complete(); await flush();
    assert.deepEqual(h.fetches.map(row => row.url), ['/recipe.json', '/reference.png']);
    assert.equal(h.workers.length, 1);
    assert.equal(h.live.size, 0);
    h.proof.cancel();
    assert.equal(h.fetches[1].signal.aborted, true);
    h.resolveReference();
    assert.equal(await run, 'failed');
    assertFailed(h, /aborted|Canceled/);
    assert.equal(h.workers.length, 1);
  });
}

test('gpu-error progress is terminal; a late completion cannot produce another stage or painting', async () => {
  const h = harness();
  const { run, worker } = await reachStage(h, 2);
  worker.progress('gpu-error', 'device lost fixture');
  assert.equal(await run, 'failed');
  assertFailed(h, /WebGPU error: device lost fixture/);
  worker.complete(rgb()); await flush();
  assertFailed(h, /WebGPU error: device lost fixture/);
  assert.deepEqual(h.workers.map(row => row.job.stage), ['text', 'encode', 'denoise']);
});

for (const [index, stage] of ['text', 'encode', 'denoise', 'decode'].entries()) {
  test(`${stage} timeout terminates the exact worker and blocks publication`, async () => {
    const h = harness();
    const { run, worker } = await reachStage(h, index);
    assert.equal(worker.job.stage, stage);
    assert.equal(h.timers.size, 1);
    const deadline = [...h.timers.values()][0];
    assert.equal(deadline.delay, 600000);
    deadline.callback();
    assert.equal(await run, 'failed');
    assertFailed(h, /Stage exceeded10minute deadline/);
    worker.complete(rgb()); await flush();
    assertFailed(h, /Stage exceeded10minute deadline/);
    assert.equal(h.workers.length, index + 1);
  });
}

test('a repeated generation rejects while the first owns its worker and controls', async () => {
  const h = harness();
  const { run } = await reachStage(h, 0);
  await assert.rejects(h.proof.generate(), /Generation already running/);
  assert.equal(h.workers.length, 1);
  assert.equal(h.live.size, 1);
  assert.equal(h.proof.state, 'running');
  assert.equal(h.elements.generate.disabled, true);
  h.proof.cancel();
  assert.equal(await run, 'failed');
  assertFailed(h, /Canceled/);
});

test('reference-disabled generation never fetches or decodes reference data', async () => {
  const h = harness({ holdReference: true });
  const { run, worker } = await reachStage(h, 2, { referenceEnabled: false });
  assert.deepEqual(h.workers.map(row => row.job.stage), ['text', 'denoise', 'decode']);
  assert.deepEqual(h.fetches.map(row => row.url), ['/recipe.json']);
  assert.equal(h.bitmaps.length, 0);
  assert.equal(h.workers[1].job.references.length, 0);
  worker.complete(rgb());
  assert.equal(await run, 'complete');
  assert.equal(h.frames.length, 1);
  assert.equal(h.frames[0].liveWorkers, 0);
  assert.equal(h.timers.size, 0);
});

test('nonfinite decoder pixels fail before canvas publication despite successful worker completion', async () => {
  const h = harness();
  const { run, worker } = await reachStage(h, 3);
  const invalid = rgb(); invalid[1] = NaN;
  worker.complete(invalid);
  assert.equal(await run, 'failed');
  assertFailed(h, /Nonfinite RGB/);
});

test('an explicit reference matte precedes drawing and its prepared tensor is separately hashed',async()=>{
  const h=harness({matte:'#72786e'});const {run}=await reachStage(h,1);
  assert.deepEqual(h.trace.filter(x=>x.startsWith('reference-fill:')||x==='reference-draw'),['reference-fill:#72786e','reference-draw']);
  const prepared=h.proof.records.find(x=>x.phase==='reference-prepared');
  assert.equal(prepared.matte,'#72786e');assert.match(prepared.pixelSha256,/^[a-f0-9]{64}$/);
  h.proof.cancel();assert.equal(await run,'failed');assertFailed(h,/Canceled/);
});
test('invalid reference matte refuses before any reference fetch, bitmap or scratch allocation',async()=>{
  const h=harness({matte:'transparent'});const {run,worker}=await reachStage(h,0);
  worker.complete();assert.equal(await run,'failed');assertFailed(h,/Invalid explicit reference matte/);
  assert.equal(h.workers.length,1);assert.equal(h.bitmaps.length,0);assert.equal(h.canvases.length,0);
  assert.deepEqual(h.fetches.map(row=>row.url),['/recipe.json']);
});

for(const [referenceFailure,message] of [
  ['context-null',/Reference 2D context unavailable/],['context-throw',/Reference context fixture failed/],
  ['draw',/Reference draw fixture failed/],['getImageData',/Reference getImageData fixture failed/],
])test(`reference ${referenceFailure} failure closes bitmap once and retires scratch without an encoder`,async()=>{
  const h=harness({referenceFailure});const {run,worker}=await reachStage(h,0);
  worker.complete();assert.equal(await run,'failed');assertFailed(h,message);
  assert.equal(h.bitmaps.length,1);assert.equal(h.canvases.length,1);assert.equal(h.workers.length,1);
  assert.ok(!h.proof.records.some(row=>row.phase==='reference-prepared'));
});

test('a cleanup error preserves the original preparation fault and still attempts scratch retirement',async()=>{
  const h=harness({referenceFailure:'draw',bitmapCloseFailure:true});const {run,worker}=await reachStage(h,0);
  worker.complete();assert.equal(await run,'failed');assertFailed(h,/Reference draw fixture failed/);
  assert.match(h.proof.error,/Bitmap close fixture failed/);
  assert.equal(h.workers.length,1);assert.equal(h.bitmaps[0].closeCalls,1);assert.equal(h.canvases.length,1);
});

test('cancellation during bitmap decoding closes its late result without allocating scratch or starting an encoder',async()=>{
  const h=harness({holdBitmap:true});const {run,worker}=await reachStage(h,0);
  worker.complete();await flush();assert.equal(h.bitmaps.length,1);assert.equal(h.bitmaps[0].closeCalls,0);
  h.proof.cancel();assert.equal(h.canvases.length,0);h.resolveBitmap();
  assert.equal(await run,'failed');assertFailed(h,/Canceled/);
  assert.equal(h.bitmaps[0].closeCalls,1);assert.equal(h.canvases.length,0);assert.equal(h.workers.length,1);
});

for(const holdPreparation of ['body','source-hash','pixel-hash'])test(`cancellation after awaited ${holdPreparation} blocks later preparation and publication`,async()=>{
  const h=harness({holdPreparation});const {run,worker}=await reachStage(h,0);
  worker.complete();await flush();
  assert.ok(h.trace.includes(holdPreparation==='body'?'reference-body':holdPreparation));
  if(holdPreparation==='pixel-hash'){
    assert.equal(h.bitmaps.length,1);assert.equal(h.canvases.length,1);assertReferenceResourcesRetired(h);
  }else {assert.equal(h.bitmaps.length,0);assert.equal(h.canvases.length,0);}
  h.proof.cancel();h.resolvePreparation();assert.equal(await run,'failed');assertFailed(h,/Canceled/);
  assert.equal(h.workers.length,1);assert.ok(!h.proof.records.some(row=>row.phase==='reference-prepared'));
});

test('the same resource outcome ruler rejects a missed close, double close and unretired canvas',async()=>{
  const h=harness();const {run}=await reachStage(h,1);h.proof.cancel();assert.equal(await run,'failed');
  assertFailed(h,/Canceled/);
  for(const closeCalls of [0,2]){
    h.bitmaps[0].closeCalls=closeCalls;assert.throws(()=>assertReferenceResourcesRetired(h));
    h.bitmaps[0].closeCalls=1;assertReferenceResourcesRetired(h);
  }
  h.canvases[0]._width=2;assert.throws(()=>assertReferenceResourcesRetired(h));
  h.canvases[0]._width=1;assertReferenceResourcesRetired(h);
});


test('profiled flow retains one raw trace per retired stage outside the progress log',async()=>{
  const h=harness();const run=h.proof.generate({referenceEnabled:false,profile:true});await flush();
  for(let i=0;i<3;i++){
    const worker=h.workers[i];assert.equal(worker.job.profile,true);
    if(worker.job.stage==='denoise')for(let step=1;step<=worker.job.steps;step++)worker.onmessage({data:{type:'progress',phase:'step',step,steps:worker.job.steps}});
    worker.onmessage({data:{type:'complete',data:i===2?rgb():new Float32Array([0.1,0.2]),
      nativeProfile:{state:'complete',endedBeforeRelease:true,sessionReleased:true,rawJson:'["fixture-trace-'+i+'"]'}}});
    await flush();
  }
  assert.equal(await run,'complete');assert.equal(h.proof.profiles.length,3);
  assert.deepEqual(Array.from(h.proof.profiles,x=>x.stage),['text','denoise','decode']);
  assert.ok(h.proof.profiles.every(x=>x.rawJson.includes('fixture-trace')));
  assert.ok(!JSON.stringify(h.proof.records).includes('fixture-trace'));
  assert.equal(h.frames.length,1);assert.equal(h.frames[0].liveWorkers,0);
});
for(const field of ['state','endedBeforeRelease','sessionReleased']){
  test('profile publication refuses an incomplete '+field+' boundary',async()=>{
    const h=harness();const run=h.proof.generate({profile:true});await flush();
    const profile={state:'complete',endedBeforeRelease:true,sessionReleased:true,rawJson:'retained-partial-fixture'};
    profile[field]=field==='state'?'failed':false;
    h.workers[0].onmessage({data:{type:'complete',data:new Float32Array([0.1]),nativeProfile:profile}});
    assert.equal(await run,'failed');assertFailed(h,/Native profile incomplete/);
    assert.equal(h.proof.profiles.length,1);assert.equal(h.proof.profiles[0].rawJson,'retained-partial-fixture');
    assert.equal(h.workers.length,1);
  });
}
test('a failed native profile preserves raw evidence before stopping its generation',async()=>{
  const h=harness();const run=h.proof.generate({profile:true});await flush();
  h.workers[0].onmessage({data:{type:'error',message:'profile timed out',nativeProfile:{state:'failed',rawJson:'['}}});
  assert.equal(await run,'failed');assertFailed(h,/profile timed out/);
  assert.equal(h.proof.profiles[0].rawJson,'[');assert.equal(h.workers.length,1);
});


test('Only the explicitly identified derivative reaches the denoiser; other graphs remain canonical',async()=>{
 const h=harness({modelDerivative:{variant:'q8-block32-repacked-v1'}});const {run,worker}=await reachStage(h,3);
 assert.equal(h.workers[2].job.q8Block32,true);
 assert.ok([h.workers[0],h.workers[1],h.workers[3]].every(w=>w.job.q8Block32===undefined));
 worker.complete(rgb());assert.equal(await run,'complete');assert.equal(h.proof.records[0].q8Block32,true);
});
test('Unknown model derivative refuses before launching any inference worker',async()=>{
 const h=harness({modelDerivative:{variant:'unreviewed'}});await h.proof.generate();
 assertFailed(h,/Unknown model derivative/);assert.equal(h.workers.length,0);
});


test('actual Land control keeps journal navigation available and completion requires an explicit return',async()=>{
  const h=harness();const run=h.elements.generate.onclick();await flush();
  assert.equal(h.proof.state,'running');assert.equal(h.elements.generate.hidden,true);
  assert.equal(h.elements['landing-progress'].hidden,false);
  assert.match(h.elements['landing-label'].textContent,/Landing.*ETA estimating/);
  h.elements.explore.onclick();
  assert.equal(h.elements['journal-panel'].hidden,false);assert.equal(h.elements['planet-panel'].hidden,true);
  for(let i=0;i<3;i++){h.workers[i].complete();await flush();}
  assert.equal(h.proof.landing.state,'running');assert.ok(h.elements['landing-meter'].value<1);
  assert.equal(h.elements.notice.hidden,true);assert.equal(h.proof.png,undefined);
  h.workers[3].complete(rgb());assert.equal(await run,'complete');
  assert.equal(h.elements['journal-panel'].hidden,false);assert.equal(h.elements['planet-panel'].hidden,true);
  assert.equal(h.elements.notice.hidden,false);assert.equal(h.elements.painting.hidden,false);
  assert.match(h.elements['notice-text'].textContent,/Earth landing ready/);
  h.elements['notice-open'].onclick();
  assert.equal(h.elements['journal-panel'].hidden,true);assert.equal(h.elements['planet-panel'].hidden,false);
  assert.equal(h.elements.notice.hidden,true);
});

test('returning to cancel never shows a completed landing notice or a working return action',async()=>{
  const h=harness();const run=h.elements.generate.onclick();await flush();h.elements.explore.onclick();
  h.elements.planet.onclick();h.elements.cancel.onclick();assert.equal(await run,'failed');
  assert.equal(h.proof.landing.state,'canceled');assert.equal(h.elements.notice.hidden,true);
  assert.equal(h.elements['landing-progress'].hidden,true);
  h.elements.explore.onclick();h.elements['notice-open'].onclick();assert.equal(h.elements['planet-panel'].hidden,true);
});

test('actual Land control preserves selected reference and profiling options',async()=>{
  const h=harness();h.proof.buttonOptions={referenceEnabled:false,profile:true};
  const run=h.elements.generate.onclick();await flush();assert.equal(h.workers[0].job.profile,true);
  assert.equal(h.proof.records.find(row=>row.phase==='start').referenceEnabled,false);
  h.elements.cancel.onclick();assert.equal(await run,'failed');
});


test('cancel during a stalled recipe request settles without starting a worker or retaining ready state',async()=>{
  const h=harness({holdRecipe:true});const run=h.elements.generate.onclick();await flush();
  assert.equal(h.proof.landing.state,'queued');assert.equal(h.elements['landing-progress'].hidden,false);
  assert.equal(h.workers.length,0);h.elements.cancel.onclick();assert.equal(await run,'failed');
  assert.equal(h.proof.landing.state,'canceled');assert.equal(h.proof.landing.etaLabel,'');
  assert.equal(h.elements['landing-progress'].hidden,true);assert.equal(h.elements.notice.hidden,true);
  assert.equal(h.elements.generate.disabled,false);assert.equal(h.proof.png,undefined);
});

test('a completed landing followed by recipe failure cannot republish its prior complete state',async()=>{
  const h=harness();const {run,worker}=await reachStage(h,3);worker.complete(rgb());assert.equal(await run,'complete');
  assert.equal(h.proof.landing.state,'complete');assert.equal(h.elements.notice.hidden,false);
  h.setRecipeFailure(true);assert.equal(await h.elements.generate.onclick(),'failed');
  assert.equal(h.proof.landing.state,'failed');assert.equal(h.proof.landing.etaLabel,'');
  assert.equal(h.elements.notice.hidden,true);assert.equal(h.elements.painting.hidden,true);assert.equal(h.proof.png,undefined);
  h.elements.explore.onclick();h.elements['notice-open'].onclick();assert.equal(h.elements['planet-panel'].hidden,true);
  assert.equal(h.workers.length,4);assert.equal(h.elements.generate.disabled,false);
});
