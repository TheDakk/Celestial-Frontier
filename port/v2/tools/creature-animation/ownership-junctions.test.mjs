import test from 'node:test';import assert from 'node:assert/strict';
import {ownershipJunctions,measureJunctions} from './ownership-junctions.mjs';
import {createSeamGeometry,validateSeamBridges,writeSeamPose} from './seam-bridge.mjs';
const I=[1,0,0,1,0,0];
const parts=[['head','head'],['ear','earFarTip'],['jaw','jaw']].map(([id,joint])=>({id,joint,layer:'near',kind:'part',cutout:{x:0,y:0,width:20,height:20},frame:{x:0,y:0,width:20,height:20}}));
const point={point:[10,10],ancestorPart:'head',parts:['head','ear','jaw'],joints:['head','earFarTip','jaw'],sourcePart:'ear',sourcePixel:[10,9]};
test('only real multi-owner interior vertices with a painted ancestor qualify',()=>{
 const owner=Uint8Array.from([1,2,3,3]);assert.equal(ownershipJunctions(owner,parts,2,2).length,1);
 assert.equal(ownershipJunctions(Uint8Array.from([1,2,0,3]),parts,2,2).length,0);
 assert.equal(ownershipJunctions(Uint8Array.from([1,2,2,2]),parts,2,2).length,0);
 const siblings=parts.map((p,i)=>({...p,joint:['foreNearRoot','foreFarRoot','neck'][i]}));
 assert.equal(ownershipJunctions(owner,siblings,2,2).length,0);
 const opaque=Uint8Array.from([255,160,255,255]);assert.equal(ownershipJunctions(owner,parts,2,2,opaque)[0].sourcePart,'jaw');
 assert.throws(()=>ownershipJunctions(owner,parts,2,2,new Uint8Array(4)),/opaque touching descendant/);
});
test('three copies of one point expose a native hole that pair-only geometry misses',()=>{
 const empty=new Uint8Array(20*20*4),pose={head:I,earFarTip:[1,0,0,1,.2,0],jaw:[1,0,0,1,0,.2]};
 const measure=(m,rgba=empty)=>measureJunctions([point],m,20,20,rgba,20,20);
 assert.equal(measure({head:I,earFarTip:I,jaw:I}).uncoveredPixels,0);
 assert.ok(measure(pose).uncoveredPixels>0);const ink=empty.slice();
 for(let y=10;y<14;y++)for(let x=10;x<14;x++)ink[(y*20+x)*4+3]=255;
 assert.equal(measure(pose,ink).uncoveredPixels,0);
 assert.equal(measure({...pose,jaw:[1,0,0,1,0,1]}).status,'INSTRUMENT_FAIL');
});
test('socket triangle has zero rest area, uses only descendant texel and validates all owners',()=>{
 const patch={...parts[0],id:'band',kind:'joint-patch'},ps=[...parts,patch],g={id:'band',ancestorJoint:'head',layer:'near',rigidUnderlap:false,edges:[{ancestorPart:'head',sourcePart:'ear',descendantJoint:'earFarTip',edge:[[10,9],[10,10]],sourcePixel:[10,9],sourceDepthPx:2}],junctions:[point]};
 const admit=x=>validateSeamBridges([x],ps,20,20,{width:20,height:20},['head','jaw','earFarTip']);assert.equal(admit(g),1);
 const mesh=createSeamGeometry(g,ps,20,20,{width:20,height:20});writeSeamPose(g,{head:I,jaw:I,earFarTip:I},20,20,mesh.pending,patch.cutout);
 assert.deepEqual([...mesh.pending.slice(16)],[.5,.5,.5,.5,.5,.5,.5,.5]);assert.deepEqual([...mesh.indices.slice(12)],[8,9,10,8,10,10]);
 assert.ok(Math.abs(mesh.uvs[16]-10.5/20)<1e-7);assert.ok(Math.abs(mesh.uvs[17]-9.5/20)<1e-7);
 const old=createSeamGeometry({...g,junctions:[]},ps,20,20,{width:20,height:20});assert.equal(old.indices.length,12);
 for(const mutation of [{sourcePart:'head'},{sourcePixel:[14,14]},{joints:['head','head','jaw']}])assert.throws(()=>admit({...g,junctions:[{...point,...mutation}]}),/junction/);
});
