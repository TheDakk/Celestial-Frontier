import {test} from 'node:test';import assert from 'node:assert/strict';import {maskJointPatch,assertJointPatchInk} from './joint-patches.mjs';
test('joint underlap never introduces a rest-visible pixel outside opaque base coverage',()=>{
 const w=20,h=20,sample=new Uint8ClampedArray(w*h*4),coverage=new Uint8Array(w*h);for(let i=0;i<w*h;i++)sample.set([105,76,35,255],i*4);
 for(let y=6;y<15;y++)for(let x=4;x<16;x++)coverage[y*w+x]=255;coverage[10*w+10]=128;
 const before=sample.slice(),out=maskJointPatch(sample,w,h,coverage);assert.deepEqual(sample,before);assert.ok(out.some(x=>x));
 for(let i=0;i<w*h;i++)if(out[i*4+3])assert.equal(coverage[i],255);assert.equal(out[(10*w+10)*4+3],0);
 assert.ok(sample.some((a,i)=>i%4===3&&a&&coverage[(i-3)/4]!==255),'unmasked patch negative control');
 assert.throws(()=>maskJointPatch(sample,w,h,new Uint8Array(1)),/shape/);
});

test('excluded crop corner key is ignored but retained key ink refuses',()=>{
 const w=20,h=20,sample=new Uint8ClampedArray(w*h*4),coverage=new Uint8Array(w*h).fill(255);
 for(let i=0;i<w*h;i++)sample.set([105,76,35,255],i*4);
 sample.set([255,0,255,255],0);
 assert.throws(()=>assertJointPatchInk(sample,'head'),/key colour/,'old square guard refuses excluded corner');
 assert.doesNotThrow(()=>assertJointPatchInk(maskJointPatch(sample,w,h,coverage),'head'));
 sample.set([255,0,255,255],(10*w+10)*4);
 assert.throws(()=>assertJointPatchInk(maskJointPatch(sample,w,h,coverage),'head'),/key colour/,'retained magenta must still fail');
});
