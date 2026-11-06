import {test} from 'node:test';import assert from 'node:assert/strict';
import {keyAndDespill,pinkExcess} from './kit-contact-math.mjs';
import {keyAndDespill as before} from '../../audits/C213_PROGRAM_20261004/phase4-keyer-before.mjs';
const scene=()=>{const w=40,h=40,p=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)p.set([255,0,255,255],i*4);return{w,h,p};};
const box=(s,x0,y0,x1,y1,c)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)s.p.set([...c,255],(y*s.w+x)*4);};
test('connected thin fur donor repairs the reported no-interior case, preserving alpha',()=>{
 const s=scene();box(s,10,8,13,28,[80,75,60]);s.p.set([145,70,135,255],(15*s.w+11)*4);
 const a=before(s.p,s.w,s.h),b=keyAndDespill(s.p,s.w,s.h),i=(15*s.w+11)*4;
 assert.ok(pinkExcess(...a.rgba.subarray(i,i+3))>8);assert.ok(pinkExcess(...b.rgba.subarray(i,i+3))<=8);
 assert.deepEqual(b.alpha,a.alpha);assert.equal(b.receipt.erodedPixels,a.receipt.erodedPixels);assert.ok(b.receipt.narrowEdgeDonors>0);
});
test('no donor across an air gap; no fabricated neutral pixel',()=>{
 const s=scene();box(s,10,8,13,28,[145,70,135]);box(s,15,8,18,28,[80,75,60]);
 const a=before(s.p,s.w,s.h),b=keyAndDespill(s.p,s.w,s.h);assert.deepEqual(b.rgba,a.rgba);assert.ok(b.receipt.unresolvedEdgePixels>0);
});
test('genuine interior pigment and delivered source bytes remain unchanged',()=>{
 const s=scene();box(s,8,8,32,32,[90,50,85]);const original=s.p.slice(),b=keyAndDespill(s.p,s.w,s.h),i=(20*s.w+20)*4;
 assert.deepEqual(s.p,original);assert.deepEqual([...b.rgba.subarray(i,i+4)],[90,50,85,255]);
});
