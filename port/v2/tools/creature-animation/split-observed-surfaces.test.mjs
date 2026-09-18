import test from 'node:test';import assert from 'node:assert/strict';
import {splitObservedSurfaces} from './split-observed-surfaces.mjs';import {hashJSON} from './quadruped-template.mjs';
async function fixture(join=false){
 const recipe={landmarks:{a:[0,0],b:[1,1],root:[0,0]}},record={...recipe,recipeHash:await hashJSON(recipe)},vertices=[{x:0,y:0,weights:[['a',1]]},{x:10,y:0,weights:[['a',1]]},{x:0,y:10,weights:[['b',1]]}];
 const parts=['a','b'].map(id=>({id,joint:id,kind:'part'}));
 const skin={vertices,triangles:[0,1,2],parts:parts.map(({id})=>({id,indices:[0,1,2],fieldTriangles:[0,1,2],vertices:vertices.map((_,i)=>({triangle:[0,1,2],barycentric:[+(i===0),+(i===1),+(i===2)]}))}))};
 const b={recordRecipeHash:record.recipeHash,parts,paintSkin:skin},binding={...b,bindingHash:await hashJSON(b)};
 const probe={recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,excluded:[],joins:join?[{ancestorPart:'a',descendantPart:'b',samples:[{ancestor:{triangle:[0,1,2]},descendant:{triangle:[0,1,2]}}]}]:[]};
 return {record,binding,probe};
}
test('projected independent surfaces retain exact source coordinates and cannot inherit opposing paint',async()=>{
 const f=await fixture(),before=structuredClone(f),a=await splitObservedSurfaces(f.binding,f.record,f.probe,{fixedJoints:[],shapeJoints:['a','b']}),b=await splitObservedSurfaces(f.binding,f.record,f.probe,{fixedJoints:[],shapeJoints:['a','b']});
 assert.deepEqual(f,before);assert.deepEqual(a,b);assert.equal(a.binding.paintSkin.vertices.length,6);
 for(const p of a.binding.paintSkin.parts)for(const v of p.vertices)for(const i of v.triangle)assert.deepEqual(a.binding.paintSkin.vertices[i].weights,[[p.id,1]]);
 const [pa,pb]=a.binding.paintSkin.parts;assert.ok(pa.vertices[0].triangle.every(i=>!pb.vertices[0].triangle.includes(i)));
});
test('observed attachments weld all source-supported faces, not independent overlaps',async()=>{const f=await fixture(true),r=await splitObservedSurfaces(f.binding,f.record,f.probe,{fixedJoints:[]});assert.equal(r.binding.paintSkin.vertices.length,3);assert.deepEqual(r.binding.paintSkin.parts[0].fieldTriangles,r.binding.paintSkin.parts[1].fieldTriangles);assert.equal(r.receipt.sharedSupports,3);});
test('corrupted binding/probe, missing source face and conflicting fixed owners refuse',async()=>{const f=await fixture(true);await assert.rejects(()=>splitObservedSurfaces({...f.binding,bindingHash:'wrong'},f.record,f.probe),/binding hash/);await assert.rejects(()=>splitObservedSurfaces(f.binding,f.record,{...f.probe,bindingHash:'wrong'}),/probe binding/);await assert.rejects(()=>splitObservedSurfaces(f.binding,f.record,f.probe,{fixedJoints:['a','b']}),/conflicting fixed/);const b=structuredClone(f.binding);b.paintSkin.parts[0].fieldTriangles=[];const{bindingHash,...body}=b;b.bindingHash=await hashJSON(body);await assert.rejects(()=>splitObservedSurfaces(b,f.record,{...f.probe,bindingHash:b.bindingHash}),/face provenance/);});

test('flat source ownership boundaries weld only when explicitly requested',async()=>{const f=await fixture(true);f.probe.excluded=f.probe.joins;f.probe.joins=[];const a=await splitObservedSurfaces(f.binding,f.record,f.probe),b=await splitObservedSurfaces(f.binding,f.record,f.probe,{preservePaintBoundaries:true});assert.equal(a.binding.paintSkin.vertices.length,6);assert.equal(b.binding.paintSkin.vertices.length,3);assert.equal(b.receipt.preservePaintBoundaries,true);});
test('mutated source recipe and unknown anatomy refuse before compilation',async()=>{const f=await fixture();await assert.rejects(()=>splitObservedSurfaces(f.binding,{...f.record,landmarks:{}},f.probe),/record hash/);await assert.rejects(()=>splitObservedSurfaces(f.binding,f.record,f.probe,{shapeJoints:['invented']}),/unknown joint/);});

test('contact endpoint locks survive diffusion; unpinned shared paint retains mixed influence',async()=>{
 const f=await fixture(true);const recipe={landmarks:f.record.landmarks,geometry:{width:10,height:10}},record={...recipe,recipeHash:await hashJSON(recipe)};
 const {bindingHash,...body}=f.binding;body.recordRecipeHash=record.recipeHash;const binding={...body,bindingHash:await hashJSON(body)},probe={...f.probe,recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash};
 const plain=await splitObservedSurfaces(binding,record,probe,{fixedJoints:[]}),pinned=await splitObservedSurfaces(binding,record,probe,{fixedJoints:[],contactEndpoints:['b']});
 const pin=pinned.receipt.contactPins[0];assert.equal(pin.joint,'b');assert.ok(pin.supports.length);
 for(const i of pin.supports){assert.deepEqual(pinned.binding.paintSkin.vertices[i].weights,[['b',1]]);assert.ok(pinned.binding.paintSkin.solver.pins.includes(i));assert.ok(plain.binding.paintSkin.vertices[i].weights.some(([j,w])=>j!=='b'&&w>0));}
 assert.deepEqual(pinned.binding.paintSkin.vertices.map(v=>[v.x,v.y]),plain.binding.paintSkin.vertices.map(v=>[v.x,v.y]));
 await assert.rejects(()=>splitObservedSurfaces(binding,record,probe,{fixedJoints:['a'],contactEndpoints:['b']}),/contact conflicts/);
});
