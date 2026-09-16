import test from 'node:test';import assert from 'node:assert/strict';
import {smoothSkinWeights} from './smooth-skin-weights.mjs';
const source=()=>({vertices:[{x:0,y:0,weights:[['body',1]]},{x:10,y:0,weights:[['leg',1]]},{x:10,y:10,weights:[['foreNearPaw',1]]},{x:0,y:10,weights:[['body',1]]}],triangles:[0,1,2,0,2,3],parts:[]});
test('topology diffusion smooths ownership while leaving planted paw cores exact and source untouched',()=>{
 const s=source(),before=structuredClone(s),out=smoothSkinWeights(s);
 assert.deepEqual(s,before);assert.deepEqual(out.vertices[2].weights,[['foreNearPaw',1]]);assert.deepEqual(out.solver.pins,[2]);
 assert.ok(out.vertices[0].weights.length>1);assert.notDeepEqual(out.vertices[0].weights,s.vertices[0].weights);
 for(const v of out.vertices)assert.ok(Math.abs(v.weights.reduce((n,[,w])=>n+w,0)-1)<1e-12);
 const unprotected=smoothSkinWeights(s,{preserveContacts:false});assert.notDeepEqual(unprotected.vertices[2].weights,[['foreNearPaw',1]]);
});
test('diffusion refuses malformed topology and cannot bleed across disconnected components',()=>{
 const s=source();assert.throws(()=>smoothSkinWeights({...s,triangles:[0,0,2]}),/topology/);
 assert.throws(()=>smoothSkinWeights(s,{fidelity:NaN}),/input/);
 const second=s.vertices.map(v=>({...v,x:v.x+100,weights:[['tail',1]]}));
 const out=smoothSkinWeights({...s,vertices:[...s.vertices,...second],triangles:[...s.triangles,4,5,6,4,6,7]});
 for(const v of out.vertices.slice(0,4))assert.ok(v.weights.every(([j])=>j!=='tail'));
 for(const v of out.vertices.slice(4))assert.deepEqual(v.weights,[['tail',1]]);
});
