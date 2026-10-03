import test from 'node:test';import assert from 'node:assert/strict';
import {bindSurfacePoint,compileAttachmentCoverage,resolveAttachmentCoverage,measureAttachmentCoverage} from './attachment-coverage.mjs';
import {FAMILY_CONTRACTS} from './family-contracts.mjs';
const square={rest:new Float32Array([0,0,1,0,1,1,0,1]),indices:[0,1,2,0,2,3]};
const declaration=(a,b)=>[{id:'socket',from:{surface:a,point:[.25,.5]},to:{surface:b,point:[.75,.5]},radiusPx:1}];
const render=(w,h)=>{const rgba=new Uint8Array(w*h*4);for(let i=3;i<rgba.length;i+=4)rgba[i]=255;return rgba;};
test('one-pixel exposed join fails between opaque endpoints; restored pixels pass',()=>{
 const program=compileAttachmentCoverage(declaration('a','b'),{a:square,b:square});
 const ribbons=resolveAttachmentCoverage(program,{a:square.rest,b:square.rest},64,64),rgba=render(64,64);
 assert.equal(measureAttachmentCoverage(rgba,64,64,ribbons).status,'PASS');
 for(let y=30;y<=34;y++)rgba[(y*64+32)*4+3]=0;
 const broken=measureAttachmentCoverage(rgba,64,64,ribbons);assert.equal(broken.status,'FAIL');assert.ok(broken.rows[0].missingPixels>0);
 // Intentional exterior/mouth opening outside the declared socket stays open.
 for(let y=30;y<=34;y++)rgba[(y*64+32)*4+3]=255;rgba[3]=0;
 assert.equal(measureAttachmentCoverage(rgba,64,64,ribbons).status,'PASS');
});
test('published surface displacement is measured, including reflected meshes and non-square scales',()=>{
 const program=compileAttachmentCoverage(declaration('a','b'),{a:square,b:square});
 const shifted=Float32Array.from(square.rest,(n,i)=>n+(i%2?.1:0));const r=resolveAttachmentCoverage(program,{a:square.rest,b:shifted},128,64);
 assert.ok(Math.abs(r[0].to[1]-38.4)<1e-4);assert.equal(r[0].from[1],32);
 assert.deepEqual(bindSurfacePoint({...square,indices:[0,2,1,0,3,2]},[.5,.5]).vertexCount,4);
 assert.throws(()=>bindSurfacePoint(square,[2,2]),/outside/);
 assert.throws(()=>compileAttachmentCoverage([],{}),/empty/);
 assert.throws(()=>compileAttachmentCoverage(declaration('missing','b'),{b:square}),/unknown/);
 const bad=shifted.slice();bad.fill(NaN);assert.throws(()=>resolveAttachmentCoverage(program,{a:bad,b:shifted},64,64),/nonfinite/);
 assert.throws(()=>measureAttachmentCoverage(render(64,64),64,64,[{from:[-2,0],to:[5,0],radiusPx:1}]),/off-canvas/);
});
for(const family of FAMILY_CONTRACTS)test('socket evaluator accepts '+family.id+' vocabulary without quadruped assumptions (synthetic)',()=>{
 const names=family.graph.map(([name])=>name);assert.ok(names.length>=2);const[a,b]=names;
 const program=compileAttachmentCoverage(declaration(a,b),{[a]:square,[b]:square});
 const rgba=render(64,64),ribbons=resolveAttachmentCoverage(program,{[a]:square.rest,[b]:square.rest},64,64);
 assert.equal(measureAttachmentCoverage(rgba,64,64,ribbons).status,'PASS');for(let y=28;y<36;y++)rgba[(y*64+34)*4+3]=0;
 assert.equal(measureAttachmentCoverage(rgba,64,64,ribbons).status,'FAIL');
});
