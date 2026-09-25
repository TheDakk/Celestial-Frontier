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

test('flat source ownership boundaries weld only when explicitly requested',async()=>{const f=await fixture(true);f.probe.excluded=f.probe.joins;f.probe.joins=[];const a=await splitObservedSurfaces(f.binding,f.record,f.probe),b=await splitObservedSurfaces(f.binding,f.record,f.probe,{preservePaintBoundaries:true});assert.equal(a.binding.paintSkin.vertices.length,6);assert.equal(b.binding.paintSkin.vertices.length,3);assert.equal(b.receipt.preservePaintBoundaries,true);assert.equal(a.receipt.observedExcludedBoundaries,1);assert.equal(a.receipt.weldedExcludedBoundaries,0);assert.equal(a.receipt.independentExcludedBoundaries,1);assert.equal(b.receipt.observedExcludedBoundaries,1);assert.equal(b.receipt.weldedExcludedBoundaries,1);assert.equal(b.receipt.independentExcludedBoundaries,0);assert.equal(b.receipt.excludedOverlaps,1);});
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

test('existing-field contact refresh preserves every non-contact weight, pin and triangle',async()=>{
 const f=await fixture();const recipe={landmarks:f.record.landmarks,geometry:{width:10,height:10}};f.record={...recipe,recipeHash:await hashJSON(recipe)};f.binding.recordRecipeHash=f.record.recipeHash;f.binding.paintSkin.solver={pins:[0],iterations:4};const {bindingHash,...body}=f.binding;f.binding.bindingHash=await hashJSON(body);f.probe.recordRecipeHash=f.record.recipeHash;f.probe.bindingHash=f.binding.bindingHash;const before=structuredClone(f.binding),result=await splitObservedSurfaces(f.binding,f.record,f.probe,{fixedJoints:[],preserveExistingWeights:true,contactEndpoints:['b']}),allowed=new Set(result.receipt.contactPins.flatMap(p=>p.supports));
 assert.deepEqual(f.binding,before);assert.deepEqual(result.binding.paintSkin.parts,before.paintSkin.parts);assert.deepEqual(result.binding.paintSkin.triangles,before.paintSkin.triangles);
 result.binding.paintSkin.vertices.forEach((v,i)=>{assert.equal(v.x,before.paintSkin.vertices[i].x);assert.equal(v.y,before.paintSkin.vertices[i].y);assert.deepEqual(v.weights,allowed.has(i)?[['b',1]]:before.paintSkin.vertices[i].weights);});
 assert.equal(result.receipt.nonContactWeightChanges,0);for(const i of before.paintSkin.solver.pins)assert(result.binding.paintSkin.solver.pins.includes(i));
 await assert.rejects(()=>splitObservedSurfaces(f.binding,f.record,f.probe,{preserveExistingWeights:true,contactEndpoints:['b']}),/cannot change other owners/);
});
test('contact conflict repair releases only neighbouring non-contact pins without changing weights',async()=>{
 const f=await fixture(),recipe={landmarks:f.record.landmarks,geometry:{width:10,height:10}};f.record={...recipe,recipeHash:await hashJSON(recipe)};f.binding.recordRecipeHash=f.record.recipeHash;f.binding.paintSkin.solver={pins:[0,1,2],iterations:4};const {bindingHash,...body}=f.binding;f.binding.bindingHash=await hashJSON(body);f.probe.recordRecipeHash=f.record.recipeHash;f.probe.bindingHash=f.binding.bindingHash;
 const ordinary=await splitObservedSurfaces(f.binding,f.record,f.probe,{fixedJoints:[],preserveExistingWeights:true,contactEndpoints:['b']}),repaired=await splitObservedSurfaces(f.binding,f.record,f.probe,{fixedJoints:[],preserveExistingWeights:true,releaseContactConflicts:true,contactEndpoints:['b']});
 assert.deepEqual(repaired.binding.paintSkin.vertices,ordinary.binding.paintSkin.vertices);assert.deepEqual(repaired.binding.paintSkin.parts,ordinary.binding.paintSkin.parts);assert.deepEqual(repaired.binding.paintSkin.triangles,ordinary.binding.paintSkin.triangles);const locked=new Set(repaired.receipt.contactPins.flatMap(p=>p.supports));assert(repaired.receipt.releasedContactPins.length>0);for(const p of repaired.receipt.releasedContactPins){assert(!locked.has(p.vertex));assert(!repaired.binding.paintSkin.solver.pins.includes(p.vertex));assert(ordinary.binding.paintSkin.solver.pins.includes(p.vertex));}for(const i of locked)assert(repaired.binding.paintSkin.solver.pins.includes(i));
});


test('named continuous paint welds an observed boundary without silently welding other surfaces',async()=>{
 const f=await fixture(true);f.probe.excluded=f.probe.joins;f.probe.joins=[];
 const separate=await splitObservedSurfaces(f.binding,f.record,f.probe),selected=await splitObservedSurfaces(f.binding,f.record,f.probe,{paintBoundaryPairs:[['a','b']]}),all=await splitObservedSurfaces(f.binding,f.record,f.probe,{preservePaintBoundaries:true});
 assert.equal(separate.binding.paintSkin.vertices.length,6);assert.equal(selected.binding.paintSkin.vertices.length,3);assert.deepEqual(selected.binding,all.binding);assert.deepEqual(selected.receipt.paintBoundaryPairs,[['a','b']]);assert.equal(selected.receipt.weldedExcludedBoundaries,1);
 for(const pairs of [[['a','missing']],[['a','a']],[['a','b'],['b','a']],['a']])await assert.rejects(()=>splitObservedSurfaces(f.binding,f.record,f.probe,{paintBoundaryPairs:pairs}),/paint boundary/);
 await assert.rejects(()=>splitObservedSurfaces(f.binding,f.record,{...f.probe,excluded:[]},{paintBoundaryPairs:[['a','b']]}),/one observed/);
 await assert.rejects(()=>splitObservedSurfaces(f.binding,f.record,f.probe,{paintBoundaryPairs:[['a','b']],preservePaintBoundaries:true}),/all or named/);
 await assert.rejects(()=>splitObservedSurfaces(f.binding,f.record,f.probe,{paintBoundaryPairs:[['a','b']],fixedJoints:[],preserveExistingWeights:true}),/cannot change other owners/);
});

test('one authored weld leaves an adjacent undeclared surface independent',async()=>{
 const f=await fixture(true),recipe={landmarks:{...f.record.landmarks,c:[.5,.5]}};f.record={...recipe,recipeHash:await hashJSON(recipe)};
 const {bindingHash,...body}=f.binding;body.recordRecipeHash=f.record.recipeHash;body.parts=[...body.parts,{id:'c',joint:'c',kind:'part'}];body.paintSkin.parts=[...body.paintSkin.parts,{...structuredClone(body.paintSkin.parts[1]),id:'c'}];f.binding={...body,bindingHash:await hashJSON(body)};
 const ab=f.probe.joins[0],bc={...structuredClone(ab),ancestorPart:'b',descendantPart:'c'},probe={recordRecipeHash:f.record.recipeHash,bindingHash:f.binding.bindingHash,joins:[],excluded:[ab,bc]};
 const r=await splitObservedSurfaces(f.binding,f.record,probe,{paintBoundaryPairs:[['a','b']],fixedJoints:[]}),[a,b,c]=r.binding.paintSkin.parts;
 assert.equal(r.binding.paintSkin.vertices.length,6);assert.deepEqual(a.fieldTriangles,b.fieldTriangles);assert(a.fieldTriangles.every(i=>!c.fieldTriangles.includes(i)));assert.equal(r.receipt.weldedExcludedBoundaries,1);assert.equal(r.receipt.independentExcludedBoundaries,1);
});
