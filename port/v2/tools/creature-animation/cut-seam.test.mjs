import test from 'node:test';import assert from 'node:assert/strict';
import {sharedCutEdges,measureCutSeam} from './cut-seam.mjs';
const w=80,h=80,I=[1,0,0,1,0,0];
const masks=()=>{const a=new Uint8Array(w*h),d=a.slice();for(let y=20;y<60;y++)for(let x=10;x<70;x++){
 if(x>=55&&x<59&&y<35)continue;(x<40?a:d)[y*w+x]=1;}return {a,d};};
function render(a,d,dx=0,allDx=0,fill=false){const rgba=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 if(a[y*w+x])rgba[((y*w+x+allDx)*4)+3]=255;
 if(d[y*w+x])rgba[((y*w+x+dx+allDx)*4)+3]=255;
 }if(fill)for(let y=20;y<60;y++)for(let x=40+allDx;x<40+dx+allDx;x++)rgba[(y*w+x)*4+3]=255;return rgba;}
const measured=(a,d,dx,allDx=0,fill=false)=>measureCutSeam({edges:sharedCutEdges(a,d,w,h),ancestorMatrix:[1,0,0,1,allDx/w,0],descendantMatrix:[1,0,0,1,(allDx+dx)/w,0],rgba:render(a,d,dx,allDx,fill),width:w,height:h});
test('intact rest and rigid motion preserve the authored notch; real separation fails',()=>{
 const {a,d}=masks();assert.equal(measured(a,d,0).uncoveredPixels,0);assert.equal(measured(a,d,0,-8).uncoveredPixels,0);
 assert.equal(measured(a,d,6).uncoveredPixels,240);assert.equal(measured(a,d,6,-8).uncoveredPixels,240);
 assert.equal(measured(a,d,6,0,true).uncoveredPixels,0);
});
test('a covered rotated cut passes and removing its support fails on the same geometry',()=>{
 const {a,d}=masks(),edges=sharedCutEdges(a,d,w,h),q=.15,c=Math.cos(q),s=Math.sin(q),M=[c,s,-s,c,.5-c*.5+s*.5,.5-s*.5-c*.5];
 const empty=new Uint8Array(w*h*4),args={edges,ancestorMatrix:I,descendantMatrix:M,width:w,height:h};
 const bad=measureCutSeam({...args,rgba:empty});assert.ok(bad.uncoveredPixels>0);
 for(const i of bad.missingPixelIndices)empty[i*4+3]=255;
 assert.equal(measureCutSeam({...args,rgba:empty}).uncoveredPixels,0);
 // The same rigid rotation applied to both parts produces no bridge at all.
 assert.equal(measureCutSeam({...args,ancestorMatrix:M,rgba:empty}).bridgePixels,0);
});
test('empty, overlapping, malformed and clipped observations refuse rather than pass',()=>{
 const {a,d}=masks();assert.throws(()=>sharedCutEdges(a,a,w,h),/Overlapping/);assert.throws(()=>sharedCutEdges(a,new Uint8Array(w*h),w,h),/No shared/);
 const args={edges:sharedCutEdges(a,d,w,h),ancestorMatrix:I,descendantMatrix:I,rgba:render(a,d),width:w,height:h};
 assert.throws(()=>measureCutSeam({...args,edges:[]}),/Missing/);assert.throws(()=>measureCutSeam({...args,ancestorMatrix:[0,0,0,0,0,0]}),/matrix/);
 assert.equal(measureCutSeam({...args,ancestorMatrix:[1,0,0,1,1,0]}).status,'INSTRUMENT_FAIL');
});

test('transparent diagnostic padding preserves the true gap count and detects canvas escape',()=>{
 const {a,d}=masks(),edges=sharedCutEdges(a,d,w,h),base=measured(a,d,6),rgba=new Uint8Array(w*h*16),small=render(a,d,6);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)rgba[((y+h/2)*w*2+x+w/2)*4+3]=small[(y*w+x)*4+3];
 const args={edges,ancestorMatrix:[1,0,0,1,.25,.25],descendantMatrix:[1,0,0,1,(.5+6/w)/2,.25],width:w*2,height:h*2,rgba};
 assert.equal(measureCutSeam(args).uncoveredPixels,base.uncoveredPixels);assert.equal(measureCutSeam(args).bridgePixels,base.bridgePixels);
 assert.equal(measureCutSeam({...args,descendantMatrix:[1,0,0,1,2,.25]}).status,'INSTRUMENT_FAIL');
});
