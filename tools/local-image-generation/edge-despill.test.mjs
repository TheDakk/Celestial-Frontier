import {test} from 'node:test';import assert from 'node:assert/strict';
import {despillUnresolvedEdges,despillThenErode} from './edge-despill.mjs';
import {pinkExcess} from './kit-contact-math.mjs';
test('one pass changes only contaminated edge RGB, preserves original/alpha and refuses no-clean-neighbour success',()=>{
 const w=24,h=24,source=new Uint8ClampedArray(w*h*4);
 for(let y=8;y<16;y++)for(let x=4;x<20;x++)source.set([60,90,30,255],(y*w+x)*4);
 const target=(8*w+8)*4;source.set([145,65,135,255],target);const original=source.slice();
 const result=despillUnresolvedEdges(source,w,h);assert.equal(result.receipt.targets,1);assert.equal(result.receipt.corrected.length,1);assert.equal(result.receipt.unresolved.length,0);
 assert.deepEqual(source,original);for(let i=0;i<source.length;i++)if(i<target||i>=target+3)assert.equal(result.rgba[i],source[i]);
 assert.ok(pinkExcess(...source.subarray(target,target+3))>8);assert.ok(pinkExcess(...result.rgba.subarray(target,target+3))<=8);
 const isolated=new Uint8ClampedArray(w*h*4);isolated.set([145,65,135,255],target);
 assert.equal(despillUnresolvedEdges(isolated,w,h).receipt.unresolved.length,1);
 assert.throws(()=>despillUnresolvedEdges(source,w,h,0),/Invalid/);
});

test('explicit target set leaves other pink pixels unchanged and refuses unknown targets',()=>{
 const w=32,h=32,source=new Uint8ClampedArray(w*h*4);for(let y=8;y<24;y++)for(let x=4;x<28;x++)source.set([60,90,30,255],(y*w+x)*4);
 const a=8*w+8,b=8*w+20;source.set([145,65,135,255],a*4);source.set([145,65,135,255],b*4);
 const out=despillUnresolvedEdges(source,w,h,32,[a]);assert.equal(out.receipt.corrected.length,1);
 assert.deepEqual(out.rgba.subarray(b*4,b*4+4),source.subarray(b*4,b*4+4));
 assert.throws(()=>despillUnresolvedEdges(source,w,h,32,[0]),/targeted/);
});


test('second pass samples inward before eroding, preserves input, and counts surviving contamination honestly',()=>{
 const w=32,h=32,source=new Uint8ClampedArray(w*h*4);
 for(let y=5;y<27;y++)for(let x=5;x<27;x++)source.set([85,70,25,255],(y*w+x)*4);
 const p=(7*w+16)*4;source.set([160,60,140,255],p);const original=source.slice();
 const out=despillThenErode(source,w,h,8);
 assert.deepEqual(source,original);assert.deepEqual([...out.rgba.slice(p,p+4)],[85,70,25,255]);
 assert.equal(out.receipt.unresolvedEdgePixels,0);assert.equal(out.receipt.corrected.length,1);
 assert.equal(out.rgba[(5*w+16)*4+3],0);assert.equal(out.rgba[(6*w+16)*4+3],255);
 assert.ok(source[p+2]-source[p+1]>8,'skipped-pass negative control');
 const polluted=source.slice();for(let i=0;i<w*h;i++)if(polluted[i*4+3])polluted.set([160,60,140,255],i*4);
 assert.ok(despillThenErode(polluted,w,h).receipt.unresolvedEdgePixels>40,'no clean neighbour must not report success');
 assert.throws(()=>despillThenErode(source,w,h,32),/Invalid/);
 // A neighbour outside radius eight cannot be borrowed across a detached island.
 const detached=new Uint8ClampedArray(w*h*4);
 for(let y=10;y<15;y++)for(let x=3;x<8;x++)detached.set([160,60,140,255],(y*w+x)*4);
 for(let y=10;y<15;y++)for(let x=20;x<25;x++)detached.set([85,70,25,255],(y*w+x)*4);
 assert.equal(despillThenErode(detached,w,h).receipt.corrected.length,0);
});
