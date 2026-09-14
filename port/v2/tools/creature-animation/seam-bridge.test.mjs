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
 writeSeamPose(g,{head:I,earFarTip:[1,0,0,1,.1,0]},20,20,b.pending,parts[2].cutout);assert.ok((area(b.pending,4,5,6)+area(b.pending,4,6,7))*400>=2);assert.ok((area(b.pending,4,5,6)+area(b.pending,4,6,7))*400<2.1);
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

test('subpixel overlap closes the captured strike raster crack; exact-edge control opens it',()=>{
 const old=[[595.5712327822187,713.7847925574466],[595.6894099649049,714.7777850818354],[560.517806754494,640.3874466597154],[561.0058661764202,639.5146362560945]],point=[570.5,661.5];
 const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
 const raster=v=>{const q=v.map(p=>p.map(x=>Math.round(x*256)/256));return [[0,1,2],[0,2,3]].some(t=>{const s=Math.sign(cross(...t.map(i=>q[i])));return t.every((a,i)=>s*cross(q[a],q[t[(i+1)%3]],point)>=0);});};
 assert.equal(raster(old),false);
 const w=1254,g=group();g.edges[0].edge=[[454,718],[454,719]];
 // Reconstruct the two affine columns from independently captured endpoint positions.
 const matrix=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1];return [1,0,dx,dy,(a[0]-454-dx*718)/w,(a[1]-dy*718)/w];};
 const buf=new Float32Array(16);writeSeamPose(g,{head:matrix(old[0],old[1]),earFarTip:matrix(old[3],old[2])},w,w,buf,parts[2].cutout);
 const vertices=Array.from({length:4},(_,i)=>[buf[8+i*2]*w,buf[9+i*2]*w]);assert.equal(raster(vertices),true);
});

test('ancestral contacts resolve pelvis ink to torso and refuse independent siblings',()=>{
 const ps=structuredClone(parts);Object.assign(ps[0],{id:'torso',joint:'spine'});Object.assign(ps[1],{id:'hind-lower',joint:'hindNearKnee'});Object.assign(ps[2],{id:'band-spine-near',joint:'spine'});
 const g=group();Object.assign(g,{id:'band-spine-near',ancestorJoint:'spine'});Object.assign(g.edges[0],{ancestorPart:'torso',sourcePart:'hind-lower',descendantJoint:'hindNearKnee',ancestorOverlap:true});
 const admit=()=>validateSeamBridges([g],ps,20,20,{width:20,height:24},ps.map(p=>p.joint));
 assert.equal(admit(),1); // Old literal-chain walk cannot reach spine from pelvis.
 Object.assign(ps[0],{id:'other-leg',joint:'foreFarRoot'});Object.assign(ps[2],{id:'band-forefarroot-near',joint:'foreFarRoot'});
 Object.assign(g,{id:'band-forefarroot-near',ancestorJoint:'foreFarRoot'});Object.assign(g.edges[0],{ancestorPart:'other-leg'});
 assert.throws(admit,/siblings stay independent/);
});
