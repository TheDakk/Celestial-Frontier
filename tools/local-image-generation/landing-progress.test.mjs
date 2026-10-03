import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createLandingProgress, MAX_LANDING_PROGRESS_KEY_LENGTH} from './landing-progress.mjs';

function job({key='exact-model-recipe-backend',steps=4,referenceCount=1,nowMs=0}={}) {
  const owner=createLandingProgress();
  owner.begin({key,steps,referenceCount,nowMs});
  let clock=nowMs;
  const emit=(event,atMs=clock+1000)=>{clock=atMs;return owner.observe({...event,atMs});};
  const load=stage=>{emit({stage,type:'progress',phase:'loading'});return emit({stage,type:'progress',phase:'loaded'});};
  const complete=stage=>emit({stage,type:'complete'});
  const text=()=>{load('text');complete('text');};
  const encode=()=>{load('encode');complete('encode');};
  const prepare=()=>{text();for(let i=0;i<referenceCount;i++)encode();load('denoise');};
  const sample=(step,atMs)=>emit({stage:'denoise',type:'progress',phase:'step',step,steps},atMs);
  const finish=(atMs)=>{
    prepare();for(let i=1;i<=steps;i++)sample(i);complete('denoise');load('decode');complete('decode');
    return emit({phase:'complete',qualityAccepted:false},atMs);
  };
  return {owner,emit,load,complete,text,encode,prepare,sample,finish};
}
function refusedWithoutChange(h,event,pattern) {
  const before=h.owner.snapshot();
  assert.throws(()=>h.owner.observe(event),pattern);
  assert.deepEqual(h.owner.snapshot(),before,'rejected evidence changed observable progress');
}

for(const referenceCount of [0,1,2])test(`ordered ${referenceCount}-reference work is ready only after publication`,()=>{
  const h=job({referenceCount});
  assert.equal(h.owner.snapshot().progress,0);
  h.load('text');assert.equal(h.owner.snapshot().progress,0,'loading is not completed work');
  h.complete('text');
  for(let i=0;i<referenceCount;i++)h.encode();
  const beforeSteps=h.owner.snapshot().progress;
  h.load('denoise');assert.equal(h.owner.snapshot().progress,beforeSteps);
  for(let step=1;step<=4;step++){
    const before=h.owner.snapshot().progress;h.sample(step);
    assert.ok(h.owner.snapshot().progress>before);
  }
  assert.equal(h.owner.snapshot().state,'running');
  assert.match(h.owner.snapshot().etaLabel,/finishing image/);
  assert.ok(h.owner.snapshot().progress<1);
  const allSteps=h.owner.snapshot().progress;
  h.emit({stage:'denoise',type:'progress',phase:'profile-complete'});
  h.complete('denoise');assert.equal(h.owner.snapshot().progress,allSteps);
  h.emit({stage:'denoise',phase:'worker-terminated'});
  h.load('decode');assert.equal(h.owner.snapshot().progress,allSteps);
  h.complete('decode');assert.ok(h.owner.snapshot().progress<1);
  assert.notEqual(h.owner.snapshot().etaLabel,'Ready to view');
  const done=h.emit({phase:'complete',qualityAccepted:false});
  assert.equal(done.state,'complete');assert.equal(done.progress,1);assert.equal(done.etaLabel,'Ready to view');
  assert.ok(Object.isFrozen(done));
});

test('unknown and cleanup telemetry cannot change stage, percentage or ETA clock',()=>{
  const h=job();h.finish(50_000);
  h.owner.begin({key:'exact-model-recipe-backend',steps:4,referenceCount:1,nowMs:60_000});
  const before=h.owner.snapshot();
  for(const event of [{phase:'start'}, {phase:'reference-prepared'},
    {stage:'text',phase:'worker-terminated'}, {stage:'future-stage',phase:'new-telemetry'},
    {stage:'denoise',phase:'gpu-error'}, {stage:'text',phase:'unknown'}]){
    h.owner.observe({...event,atMs:999_999});
    assert.deepEqual(h.owner.snapshot(),before);
  }
  h.owner.observe({stage:'text',phase:'loading',atMs:60_001});
  assert.equal(h.owner.snapshot().stageLabel,'Preparing description');
});

test('unknown stage control and malformed active event refuse atomically',()=>{
  const h=job();
  for(const event of [null, {stage:'future-stage',phase:'loading',atMs:1},
    {stage:'future-stage',type:'complete',atMs:1}])
    refusedWithoutChange(h,event,/Invalid landing progress event|Out-of-order landing stage/);
});

test('future-time early completion cannot poison a later valid event',()=>{
  const h=job();
  refusedWithoutChange(h,{phase:'complete',atMs:100_000},/before its stages/);
  h.emit({stage:'text',phase:'loading'},1);
  assert.equal(h.owner.snapshot().state,'running');
});

test('encoder, denoiser and decoder cannot skip their predecessors',()=>{
  const h=job();
  for(const stage of ['encode','denoise','decode'])for(const type of ['loading','complete'])
    refusedWithoutChange(h,{stage,...(type==='complete'?{type}:{phase:type}),atMs:1},/Out-of-order landing stage/);
});

test('real loading then loaded is required before any stage outcome',()=>{
  const h=job();
  refusedWithoutChange(h,{stage:'text',type:'complete',atMs:1},/before worker loaded/);
  refusedWithoutChange(h,{stage:'text',phase:'loaded',atMs:1},/loaded without loading/);
  h.emit({stage:'text',phase:'loading'},1);
  refusedWithoutChange(h,{stage:'text',phase:'loading',atMs:2},/Duplicate landing worker loading/);
  refusedWithoutChange(h,{stage:'text',type:'complete',atMs:2},/before worker loaded/);
  h.emit({stage:'text',phase:'loaded'},2);
  refusedWithoutChange(h,{stage:'text',phase:'loaded',atMs:3},/loaded without loading/);
  h.complete('text');
});

test('repeated encode completion cannot impersonate a second reference',()=>{
  const h=job({referenceCount:2});h.text();h.encode();
  refusedWithoutChange(h,{stage:'encode',type:'complete',atMs:10_000},/before worker loaded/);
  h.encode();
  refusedWithoutChange(h,{stage:'encode',phase:'loading',atMs:20_000},/Out-of-order landing stage/);
  h.load('denoise');assert.equal(h.owner.snapshot().stageLabel,'Painting the world');
});

test('duplicate, skipped, fractional and mismatched denoise steps do not advance work',()=>{
  const h=job();h.prepare();h.sample(1);
  for(const [step,steps] of [[1,4],[3,4],[0,4],[1.5,4],[2,3],[5,4]])
    refusedWithoutChange(h,{stage:'denoise',phase:'step',step,steps,atMs:99_000},/Out-of-order landing step/);
  h.sample(2);h.sample(3);h.sample(4);
  refusedWithoutChange(h,{stage:'denoise',phase:'step',step:5,steps:4,atMs:99_000},/Out-of-order landing step/);
});

test('denoise completion and profiling cannot substitute for missing steps',()=>{
  const h=job();h.prepare();h.sample(1);
  refusedWithoutChange(h,{stage:'denoise',type:'complete',atMs:99_000},/before its steps/);
  refusedWithoutChange(h,{stage:'denoise',phase:'profile-complete',atMs:99_000},/before its steps/);
  refusedWithoutChange(h,{stage:'decode',phase:'loading',atMs:99_000},/Out-of-order landing stage/);
  h.sample(2);assert.match(h.owner.snapshot().stageLabel,/step 2 of 4/);
});

test('step four still requires denoiser completion before decoder starts',()=>{
  const h=job();h.prepare();for(let step=1;step<=4;step++)h.sample(step);
  refusedWithoutChange(h,{stage:'decode',phase:'loading',atMs:99_000},/Out-of-order landing stage/);
  refusedWithoutChange(h,{phase:'complete',atMs:99_000},/before its stages/);
  h.complete('denoise');h.load('decode');
  refusedWithoutChange(h,{phase:'complete',atMs:99_000},/before its stages/);
});

test('phase complete does not impersonate the worker type complete',()=>{
  const h=job();h.load('text');const before=h.owner.snapshot();
  h.emit({stage:'text',phase:'complete'});
  assert.deepEqual(h.owner.snapshot(),before);
  refusedWithoutChange(h,{stage:'text',type:'complete',phase:'loaded',atMs:99_000},/Conflicting landing event kind/);
  h.complete('text');
});

test('nonfinite and backward recognized timestamps refuse without side effects',()=>{
  const h=job({nowMs:100});
  for(const atMs of [NaN,Infinity,-1,99,Number.MAX_SAFE_INTEGER+1])
    refusedWithoutChange(h,{stage:'text',phase:'loading',atMs},/Nonmonotonic/);
  h.emit({stage:'text',phase:'loading'},100);
  h.emit({stage:'text',phase:'loaded'},100);
});

for(const canceled of [false,true])test(`${canceled?'canceled':'failed'} jobs cannot be revived or calibrate a first ETA`,()=>{
  const h=job();h.prepare();h.sample(1);
  const stopped=h.emit({phase:'failed',canceled});
  assert.equal(stopped.state,canceled?'canceled':'failed');assert.equal(stopped.progress,0);assert.equal(stopped.etaLabel,'');
  for(const event of [null,{phase:'complete',atMs:1e6},{stage:'denoise',phase:'step',step:2,steps:4,atMs:1e6}])
    assert.deepEqual(h.owner.observe(event),stopped);
  const restart=h.owner.begin({key:'exact-model-recipe-backend',steps:4,referenceCount:1,nowMs:100_000});
  assert.equal(restart.progress,0);assert.equal(restart.etaLabel,'ETA estimating…');
});

test('completed jobs ignore stale failure/worker events and preserve their exact result',()=>{
  const h=job();const done=h.finish(50_000);
  for(const event of [{phase:'failed',canceled:true,atMs:60_000},{stage:'decode',type:'complete',atMs:60_000},null])
    assert.deepEqual(h.owner.observe(event),done);
});

test('cancellation flag refuses nonboolean truthy values',()=>{
  const h=job();
  refusedWithoutChange(h,{phase:'failed',canceled:'false',atMs:1},/Invalid landing cancellation flag/);
  assert.equal(h.owner.snapshot().state,'queued');
});

test('first-run ETA estimates only measured remaining denoise steps',()=>{
  const h=job();h.prepare();
  assert.equal(h.owner.snapshot().etaLabel,'ETA estimating…');
  h.sample(1,20_000);assert.equal(h.owner.snapshot().etaLabel,'ETA estimating…');
  h.sample(2,30_000);assert.equal(h.owner.snapshot().etaLabel,'ETA about 20s + final processing');
  h.sample(3,40_000);assert.equal(h.owner.snapshot().etaLabel,'ETA about 10s + final processing');
  h.sample(4,50_000);assert.equal(h.owner.snapshot().etaLabel,'ETA finishing image…');
});

test('completed same-key total duration informs a later same-page plan',()=>{
  const h=job();h.finish(50_000);
  const next=h.owner.begin({key:'exact-model-recipe-backend',steps:4,referenceCount:1,nowMs:60_000});
  assert.equal(next.etaLabel,'ETA about 50s');
  h.owner.observe({stage:'text',phase:'loading',atMs:80_000});
  assert.equal(h.owner.snapshot().etaLabel,'ETA about 30s');
  h.owner.observe({stage:'text',phase:'loaded',atMs:120_000});
  assert.equal(h.owner.snapshot().etaLabel,'ETA taking longer than the last landing…');
  assert.equal(h.owner.snapshot().progress,0);
});

for(const change of [{key:'different-model-recipe-backend'},{steps:3},{referenceCount:2}])
  test(`total ETA does not cross changed plan scope ${JSON.stringify(change)}`,()=>{
    const h=job();h.finish(50_000);
    const next=h.owner.begin({key:'exact-model-recipe-backend',steps:4,referenceCount:1,nowMs:60_000,...change});
    assert.equal(next.etaLabel,'ETA estimating…');
  });

test('failed retry never replaces the previous successful total duration',()=>{
  const h=job();h.finish(50_000);
  h.owner.begin({key:'exact-model-recipe-backend',steps:4,referenceCount:1,nowMs:60_000});
  h.owner.observe({phase:'failed',atMs:200_000});
  assert.equal(h.owner.begin({key:'exact-model-recipe-backend',steps:4,referenceCount:1,nowMs:300_000}).etaLabel,'ETA about 50s');
});

test('zero-duration synthetic completion and another owner cannot supply calibration',()=>{
  const h=job({referenceCount:0,steps:1});
  const events=[{stage:'text',phase:'loading'},{stage:'text',phase:'loaded'},{stage:'text',type:'complete'},
    {stage:'denoise',phase:'loading'},{stage:'denoise',phase:'loaded'},
    {stage:'denoise',phase:'step',step:1,steps:1},{stage:'denoise',type:'complete'},
    {stage:'decode',phase:'loading'},{stage:'decode',phase:'loaded'},{stage:'decode',type:'complete'},{phase:'complete'}];
  for(const event of events)h.owner.observe({...event,atMs:0});
  assert.equal(h.owner.begin({key:'exact-model-recipe-backend',steps:1,referenceCount:0,nowMs:100}).etaLabel,'ETA estimating…');
  const other=job();assert.equal(other.owner.snapshot().etaLabel,'ETA estimating…');
});

test('plan guards bound exact keys, dimensions of work and supplied monotonic time',()=>{
  const owner=createLandingProgress();const idle=owner.snapshot();
  const base={key:'valid',steps:4,referenceCount:1,nowMs:0};
  for(const plan of [null,{...base,key:''},{...base,key:'x'.repeat(MAX_LANDING_PROGRESS_KEY_LENGTH+1)},
    ...[0,17,1.5,Infinity].map(steps=>({...base,steps})),
    ...[-1,3,0.5,NaN].map(referenceCount=>({...base,referenceCount})),
    ...[-1,Infinity,Number.MAX_SAFE_INTEGER+1].map(nowMs=>({...base,nowMs}))]){
    assert.throws(()=>owner.begin(plan),/Invalid landing progress plan/);assert.deepEqual(owner.snapshot(),idle);
  }
  const key='canonical-world-and-full-genomes:'.repeat(2000);
  assert.equal(owner.begin({...base,key}).key,key,'large canonical key must remain exact');
  const queued=owner.snapshot();assert.throws(()=>owner.begin(base),/already queued/);assert.deepEqual(owner.snapshot(),queued);
});
