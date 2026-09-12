import assert from 'node:assert/strict';
import {test} from 'node:test';
import {prepareKitTextTokens,MAX_KIT_TEXT_TOKENS,imageToImageStart,planarToRgba,placementBox,admitKitEngineJob} from './kit-engine-math.mjs';
import {expandOperandRange,patchGraph,expandPinnedTransformer} from './kit-worker-expansion.mjs';

test('tenfold ceiling retains every token and allocates only the actual rounded sequence',()=>{
  const tokenizer=n=>({encode:()=>({ids:Array.from({length:n},(_,i)=>i+1)}),token_to_id:()=>77});
  assert.equal(MAX_KIT_TEXT_TOKENS,5120);
  const actual=prepareKitTextTokens(tokenizer(1812),'source kit');assert.equal(actual.sequence,1824);assert.equal(actual.ids[1811],1812n);assert.equal(actual.mask[1811],1n);assert.equal(actual.mask[1812],0n);
  assert.equal(prepareKitTextTokens(tokenizer(5120),'source kit').ids[5119],5120n);
  assert.throws(()=>prepareKitTextTokens(tokenizer(5121),'source kit'),/no truncation/);
  assert.throws(()=>prepareKitTextTokens(tokenizer(0),'source kit'),/no truncation/);
  // A silently truncated prompt is not equivalent to an admitted full prompt.
  assert.notEqual(prepareKitTextTokens(tokenizer(512),'source kit').tokenCount,actual.tokenCount);
});
test('low-strength pass preserves source contribution and seed owns only the noise',()=>{
  const initial=Float32Array.from({length:128},(_,i)=>i/128),before=initial.slice();
  const a=imageToImageStart(initial,133,4,.1),b=imageToImageStart(initial,133,4,.1);
  assert.deepEqual(a,b);assert.deepEqual(initial,before);assert.equal(a.sigmas.at(-1),0);assert.ok(a.sigmas[0]<.101);
  assert.notDeepEqual(a.latents,imageToImageStart(initial,134,4,.1).latents);
  assert.notDeepEqual(a.latents,imageToImageStart(initial,133,4,1).latents);
  assert.throws(()=>imageToImageStart(initial,133,4,0));assert.throws(()=>imageToImageStart(new Float32Array([NaN]),133,4,.1));
});
test('key intake refuses a dark full plate and an empty key, preserving a complete foreground object',()=>{
  const w=16,h=16,n=w*h,paint=new Float32Array(n*3);paint.fill(1);paint.fill(-1,n,n*2);
  const key=paint.slice();for(let y=4;y<12;y++)for(let x=4;x<12;x++)for(let c=0;c<3;c++)paint[c*n+y*w+x]=0;
  const result=planarToRgba(paint,w,h,true);assert.deepEqual(result.bounds,{x:4,y:4,width:8,height:8});assert.equal(result.rgba[3],0);assert.equal(result.rgba[(5*w+5)*4+3],255);
  assert.throws(()=>planarToRgba(new Float32Array(n*3).fill(-.8),w,h,true),/isolated key/);
  assert.throws(()=>planarToRgba(key,w,h,true),/empty/);
  const box=placementBox({x:.5,groundY:.8,width:.2},result.bounds,1000,600);assert.deepEqual(box,{x:400,y:280,width:200,height:200});
  assert.throws(()=>placementBox({x:.01,groundY:.1,width:.9},result.bounds,1000,600),/outside/);
});
test('worker expansion preserves element bytes and rejects overlapping patches / corrupt plan before model fetch',async()=>{
  assert.deepEqual([...expandOperandRange(Uint8Array.of(1,2,3,4),2)],[1,2,1,2,1,2,1,2,3,4,3,4,3,4,3,4]);
  assert.deepEqual([...expandOperandRange(Uint8Array.of(1,2),1)],[1,1,1,1,2,2,2,2]);
  assert.throws(()=>expandOperandRange(Uint8Array.of(1,2,3),2));
  assert.deepEqual([...patchGraph(Uint8Array.of(1,2,3),[{offset:1,remove:1,hex:'0405'}],4)],[1,4,5,3]);
  assert.throws(()=>patchGraph(Uint8Array.of(1,2,3),[{offset:1,remove:2,hex:''},{offset:2,remove:1,hex:''}],1),/refused/);
  let calls=0;await assert.rejects(()=>expandPinnedTransformer(async()=>{calls++;return {ok:true,arrayBuffer:async()=>new Uint8Array(142918).buffer};}),/SHA mismatch/);assert.equal(calls,1);
});
test('an unknown recipe cannot reach a GPU stage',()=>{assert.throws(()=>admitKitEngineJob({schema:'cf.kit-engine.v3'}),/schema refused/);});
