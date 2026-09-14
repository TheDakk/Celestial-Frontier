import test from'node:test';import assert from'node:assert/strict';import {ownedInteriorPixel}from'./texture-hinges.mjs';import {createSeamGeometry,validateSeamBridges}from'./seam-bridge.mjs';
const part={id:'ear',kind:'part',joint:'earFarTip',layer:'near',cutout:{x:10,y:10,width:8,height:8},frame:{x:20,y:0,width:8,height:8}};
const edge={ancestorPart:'head',sourcePart:'ear',descendantJoint:'earFarTip',edge:[[10,12],[10,13]],sourcePixel:[10,12],sourceDepthPx:3};
const png=()=>({width:8,height:8,data:new Uint8Array(8*8*4).fill(255)});
test('source walk stops before a transparent hole and never exceeds the original depth cap',()=>{
 const p=png();assert.deepEqual(ownedInteriorPixel(edge,part,p),[13,12]);p.data[(2*8+2)*4+3]=0;assert.deepEqual(ownedInteriorPixel(edge,part,p),[11,12]);
 p.data[(2*8)*4+3]=0;assert.throws(()=>ownedInteriorPixel(edge,part,p),/no owned ink/);
 assert.deepEqual(ownedInteriorPixel({...edge,sourcePixel:[17,12],edge:[[18,12],[18,13]]},part,png()),[14,12]);
});
test('textured hinge omits the duplicate silhouette, maps the source interior, and refuses foreign UVs',()=>{
 const head={...part,id:'head',joint:'head'},patch={...part,id:'band',joint:'head',kind:'joint-patch'},g={id:'band',ancestorJoint:'head',layer:'near',rigidUnderlap:false,edges:[{...edge,interiorPixel:[13,12]}]},parts=[head,part,patch];
 validateSeamBridges([g],parts,32,32,{width:32,height:32},['head','earFarTip']);const mesh=createSeamGeometry(g,parts,32,32,{width:32,height:32});
 assert.deepEqual([...mesh.indices.slice(0,6)],[0,0,0,0,0,0]);assert.equal(mesh.uvs[8],23.5/32);assert.equal(mesh.uvs[12],20.5/32);
 const old=createSeamGeometry({...g,rigidUnderlap:true,edges:[edge]},parts,32,32,{width:32,height:32});assert.notDeepEqual([...old.indices.slice(0,6)],[0,0,0,0,0,0]);assert.equal(old.uvs[8],old.uvs[12]);
 assert.throws(()=>validateSeamBridges([{...g,edges:[{...edge,interiorPixel:[17,17]}]}],parts,32,32,{width:32,height:32},['head','earFarTip']),/normal within cap/);
});
