import {test} from 'node:test';import assert from 'node:assert/strict';import {maskJointPatch} from './joint-patches.mjs';
test('joint underlap never introduces a rest-visible pixel outside opaque base coverage',()=>{
 const w=20,h=20,sample=new Uint8ClampedArray(w*h*4),coverage=new Uint8Array(w*h);for(let i=0;i<w*h;i++)sample.set([105,76,35,255],i*4);
 for(let y=6;y<15;y++)for(let x=4;x<16;x++)coverage[y*w+x]=255;coverage[10*w+10]=128;
 const before=sample.slice(),out=maskJointPatch(sample,w,h,coverage);assert.deepEqual(sample,before);assert.ok(out.some(x=>x));
 for(let i=0;i<w*h;i++)if(out[i*4+3])assert.equal(coverage[i],255);assert.equal(out[(10*w+10)*4+3],0);
 assert.ok(sample.some((a,i)=>i%4===3&&a&&coverage[(i-3)/4]!==255),'unmasked patch negative control');
 assert.throws(()=>maskJointPatch(sample,w,h,new Uint8Array(1)),/shape/);
});
