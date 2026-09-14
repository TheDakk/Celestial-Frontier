import test from 'node:test';import assert from 'node:assert/strict';
import {validateSeamBridges,createSeamGeometry,writeSeamPose} from './seam-bridge.mjs';
const I=[1,0,0,1,0,0],parts=[{id:'head',joint:'head',layer:'near',kind:'part',cutout:{x:0,y:0,width:10,height:20},frame:{x:0,y:0,width:10,height:20}},
 {id:'ear',joint:'earFarTip',layer:'near',kind:'part',cutout:{x:10,y:0,width:10,height:20},frame:{x:10,y:0,width:10,height:20}},
 {id:'band-head-near',joint:'head',layer:'near',kind:'joint-patch',cutout:{x:10,y:9,width:2,height:2},frame:{x:0,y:20,width:2,height:2}}];
const group=()=>({id:'band-head-near',ancestorJoint:'head',layer:'near',edges:[{ancestorPart:'head',sourcePart:'ear',descendantJoint:'earFarTip',edge:[[10,9],[10,10]],sourcePixel:[10,9],sourceDepthPx:2.5}]});
const area=(p,a,b,c)=>Math.abs((p[b*2]-p[a*2])*(p[c*2+1]-p[a*2+1])-(p[b*2+1]-p[a*2+1])*(p[c*2]-p[a*2]))/2;
test('strip is exactly zero-area at rest, covers moving edge separation, samples only original descendant pixel',()=>{
 const g=group();assert.equal(validateSeamBridges([g],parts,20,20,{width:20,height:24},['head','earFarTip']),1);
 const b=createSeamGeometry(g,parts,20,20,{width:20,height:24});
 writeSeamPose(g,{head:I,earFarTip:I},20,20,b.pending,parts[2].cutout);assert.equal(area(b.pending,4,5,6)+area(b.pending,4,6,7),0);
 writeSeamPose(g,{head:I,earFarTip:[1,0,0,1,.1,0]},20,20,b.pending,parts[2].cutout);assert.ok(Math.abs((area(b.pending,4,5,6)+area(b.pending,4,6,7))*400-2)<1e-5);
 for(let k=8;k<16;k+=2){assert.ok(Math.abs(b.uvs[k]-10.5/20)<1e-7);assert.ok(Math.abs(b.uvs[k+1]-9.5/24)<1e-7);}
 // Holding both edges on the head (the old rigid copy) has no swept coverage.
 writeSeamPose(g,{head:I,earFarTip:I},20,20,b.pending,parts[2].cutout);assert.equal(area(b.pending,4,5,6)+area(b.pending,4,6,7),0);
});
test('source caps, foreign pixels, bad ownership, malformed geometry and nonfinite motion refuse',()=>{
 const g=group(),admit=x=>validateSeamBridges([x],parts,20,20,{width:20,height:24},['head','earFarTip']);
 for(const patch of [{sourceDepthPx:3},{sourcePixel:[18,18]},{sourcePart:'head'},{edge:[[10,9],[10,12]]}])assert.throws(()=>admit({...g,edges:[{...g.edges[0],...patch}]}),/Seam bridge/);
 const b=createSeamGeometry(g,parts,20,20,{width:20,height:24});assert.doesNotThrow(()=>writeSeamPose(g,{head:I,earFarTip:[1,0,0,1,.2,0]},20,20,b.pending,parts[2].cutout)); // source depth is not a new curve-displacement clamp
 assert.throws(()=>writeSeamPose(g,{head:I,earFarTip:[NaN,0,0,1,0,0]},20,20,b.pending,parts[2].cutout),/matrix/);
});
