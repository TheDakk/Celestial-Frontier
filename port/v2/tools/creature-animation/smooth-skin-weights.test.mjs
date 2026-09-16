import test from'node:test';import assert from'node:assert/strict';import{smoothSkinWeights}from'./smooth-skin-weights.mjs';
test('smooths actual adjacent influences deterministically without changing topology, positions or original weights',()=>{
 const skin={vertices:[{x:0,y:0,weights:[['spine0',1]]},{x:1,y:0,weights:[['spine1',1]]},{x:0,y:1,weights:[['spine1',1]]}],triangles:[0,1,2],parts:[]},before=structuredClone(skin),a=smoothSkinWeights(skin),b=smoothSkinWeights(skin);
 assert.deepEqual(skin,before);assert.deepEqual(a,b);assert.deepEqual(a.triangles,skin.triangles);
 for(let i=0;i<a.vertices.length;i++){const v=a.vertices[i];assert.equal(v.x,skin.vertices[i].x);assert.equal(v.y,skin.vertices[i].y);assert.equal(v.weights.length,2);assert(Math.abs(v.weights.reduce((s,[,n])=>s+n,0)-1)<1e-12);}
 assert(a.vertices[0].weights.some(([j,n])=>j==='spine1'&&n>.1));assert(!skin.vertices[0].weights.some(([j])=>j==='spine1')); // old abrupt ownership is negative control
});
test('refuses invalid topology or unsupported iterations',()=>{const s={vertices:[],triangles:[0,1,2]};assert.throws(()=>smoothSkinWeights(s),/vertex index/);assert.throws(()=>smoothSkinWeights(s,{iterations:33}),/invalid topology/);});
