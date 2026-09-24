import test from 'node:test';import assert from 'node:assert/strict';
import {selectPaintedContactVertex} from './painted-contact-selector.mjs';
import {splitObservedSurfaces} from './split-observed-surfaces.mjs';
import {hashJSON} from './quadruped-template.mjs';
// Exact source coordinates/barycentrics of fit04 leg5FarFoot's two 5px candidates.
function geometry(){return {vertices:[{x:724,y:509,weights:[['foot',1]]},{x:744,y:509,weights:[['foot',1]]},{x:744,y:548,weights:[['foot',1]]},{x:763.5,y:528.5,weights:[['foot',1]]}],part:{id:'leg',indices:[0,1,2,1,2,3],fieldTriangles:[0,1,2,1,2,3],vertices:[{triangle:[0,1,2],barycentric:[0,.5384615384615384,.46153846153846156]},{triangle:[3,2,1],barycentric:[.41025641025641024,.2564102564102564,.33333333333333337]},{triangle:[0,1,2],barycentric:[1,0,0]}]},end:[748/1254,530/1254],width:1254,height:1254};}
// Independent original runtime arithmetic, intentionally not shared with production.
function oldRuntime(vertices,part,end,w,h){let best,distance=Infinity;for(const[index,v]of part.vertices.entries()){let x=0,y=0;for(let k=0;k<3;k++){const p=vertices[v.triangle[k]],weight=v.barycentric[k];x+=p.x*weight/w;y+=p.y*weight/h;}const d=Math.hypot((x-end[0])*w,(y-end[1])*h);if(d<distance){distance=d;best={vertexIndex:index,rest:[x,y],distancePx:d,vertex:v};}}return best;}
// Unchanged independent static observer uses normalized distance without rescaling.
function staticMark(g){let best;g.part.vertices.forEach((v,index)=>{const xy=[0,0];for(let k=0;k<3;k++){const p=g.vertices[v.triangle[k]];xy[0]+=p.x*v.barycentric[k]/g.width;xy[1]+=p.y*v.barycentric[k]/g.height;}const distance=Math.hypot(xy[0]-g.end[0],xy[1]-g.end[1]);if(!best||distance<best.distance)best={index,xy,distance};});return best;}
function pixelMutant(g){let best;g.part.vertices.forEach((v,index)=>{const xy=[0,0];for(let k=0;k<3;k++){const p=g.vertices[v.triangle[k]];xy[0]+=p.x*v.barycentric[k];xy[1]+=p.y*v.barycentric[k];}const distance=Math.hypot(xy[0]-g.end[0]*g.width,xy[1]-g.end[1]*g.height);if(!best||distance<best.distance)best={index,distance};});return best;}
const select=g=>selectPaintedContactVertex(g.vertices,g.part,g.end,g.width,g.height);
const supports=v=>v.triangle.filter((_,k)=>v.barycentric[k]>1e-10);
function assertLocked(binding,selection){for(const i of supports(selection.vertex)){assert(binding.paintSkin.solver.pins.includes(i),'observed support must be pinned');assert.deepEqual(binding.paintSkin.vertices[i].weights,[['foot',1]]);}}
async function fixture(){const g=geometry(),recipe={landmarks:{root:[0,0],foot:g.end},geometry:{width:g.width,height:g.height}},record={...recipe,recipeHash:await hashJSON(recipe)},body={recordRecipeHash:record.recipeHash,parts:[{id:'leg',joint:'foot',kind:'part'}],paintSkin:{vertices:g.vertices,triangles:[0,1,2,1,2,3],parts:[g.part],solver:{iterations:4,globalIterations:4,targetWeight:.35,pins:[1,2]}}},binding={...body,bindingHash:await hashJSON(body)},probe={recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,joins:[],excluded:[]};return {g,record,binding,probe};}

test('retained five-pixel tie keeps exact runtime winner and independent static observation',()=>{
 const g=geometry(),s=select(g),prior=oldRuntime(g.vertices,g.part,g.end,g.width,g.height),mark=staticMark(g);
 assert.deepEqual(s,prior);assert.equal(s.vertexIndex,1);assert.equal(s.distancePx,4.999999999999989);assert.deepEqual(s.rest,[.5996810207336523,.42025518341307816]);assert.equal(mark.index,s.vertexIndex);assert.deepEqual(mark.xy,s.rest);
 const wrong=pixelMutant(g);assert.equal(wrong.index,0);assert.equal(wrong.distance,5);assert.notEqual(wrong.index,s.vertexIndex,'control must expose the old writer mismatch');
 const uncorrected={paintSkin:{vertices:g.vertices,solver:{pins:[1,2]}}};assert.throws(()=>assertLocked(uncorrected,s),/observed support must be pinned/);
});
test('truly identical distance retains the first vertex rather than last-on-equality',()=>{
 const g=geometry();g.part.vertices=[structuredClone(g.part.vertices[1]),structuredClone(g.part.vertices[1])];const s=select(g);assert.equal(s.vertexIndex,0);assert.equal(s.vertex,g.part.vertices[0]);assert.notEqual(s.vertexIndex,1,'<= distance mutant would select the last duplicate');
});
test('valid nonsquare and fractional geometry keeps runtime operation order bit-for-bit',()=>{
 const g=geometry();g.width=997;g.height=601;g.end=[.731,.831];g.part.vertices[0].barycentric=[-5.551115123125783e-17,.625,.375];
 const before=structuredClone(g),actual=select(g),prior=oldRuntime(g.vertices,g.part,g.end,g.width,g.height);assert.deepEqual(actual,prior);assert.deepEqual(g,before);
 for(let axis=0;axis<2;axis++)assert(Object.is(actual.rest[axis],prior.rest[axis]));assert(Object.is(actual.distancePx,prior.distancePx));
});
test('empty surfaces remain empty and invalid numeric geometry cannot certify a support',()=>{
 const g=geometry();assert.equal(selectPaintedContactVertex(g.vertices,{vertices:[]},g.end,g.width,g.height),undefined);
 for(const n of [NaN,Infinity,-Infinity,0])assert.throws(()=>selectPaintedContactVertex(g.vertices,g.part,g.end,n,g.height),/dimensions/);
 for(const mutate of [g=>g.end[0]=NaN,g=>g.vertices[0].x=Infinity,g=>g.part.vertices[0].barycentric[0]=NaN,g=>g.part.vertices[0].triangle[0]=99]){const x=geometry();mutate(x);assert.throws(()=>select(x),/Painted contact selector:/);}
});
test('ordinary split locks the actual observer support, with no coordinate or source-UV changes',async()=>{
 const {g,record,binding,probe}=await fixture(),before=structuredClone(binding),result=await splitObservedSurfaces(binding,record,probe,{fixedJoints:[],contactEndpoints:['foot']}),part=result.binding.paintSkin.parts[0],selected=selectPaintedContactVertex(result.binding.paintSkin.vertices,part,g.end,g.width,g.height);
 assertLocked(result.binding,selected);assert.equal(result.receipt.contactPins[0].vertex,selected.vertexIndex);assert.deepEqual(result.receipt.contactPins[0].supports,supports(selected.vertex));assert.equal(result.receipt.contactPins[0].distancePx,selected.distancePx);assert.deepEqual(binding,before);
 assert.deepEqual(result.binding.paintSkin.vertices.map(v=>[v.x,v.y]),binding.paintSkin.vertices.map(v=>[v.x,v.y]));assert.deepEqual(part.vertices.map(v=>v.barycentric),g.part.vertices.map(v=>v.barycentric));
});
test('existing-field refresh pins the missing contributing support and preserves all other source state',async()=>{
 const {g,record,binding,probe}=await fixture(),before=structuredClone(binding),selected=select(g),result=await splitObservedSurfaces(binding,record,probe,{fixedJoints:[],contactEndpoints:['foot'],preserveExistingWeights:true});
 assertLocked(result.binding,selected);assert(result.binding.paintSkin.solver.pins.includes(3),'previously unpinned contributing vertex must now be locked');assert.equal(result.binding.paintSkin.solver.pins.length,3);assert.deepEqual(result.binding.paintSkin.parts,before.paintSkin.parts);assert.deepEqual(result.binding.paintSkin.triangles,before.paintSkin.triangles);assert.deepEqual(result.binding.paintSkin.vertices,before.paintSkin.vertices);assert.deepEqual(binding,before);
});
