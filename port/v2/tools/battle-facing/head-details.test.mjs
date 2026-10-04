import test from'node:test';import assert from'node:assert/strict';import{compileHeadDetails,applyHeadDetails}from'./head-details.mjs';
test('shared joint angles move only their authored head support, leave the attachment still and preserve rest',()=>{
 const rest=new Float32Array([0,0,5,5,5,10,20,10]),d={joint:'ear',pivot:[5,0],bounds:[0,0,10,15],feather:1,direction:1,extent:10},p=compileHeadDetails(rest,[d],['ear']);
 const out=applyHeadDetails(p,{},false,rest.slice());assert.deepEqual(out,rest);
 applyHeadDetails(p,{ear:{rotation:.3}},false,out);assert.deepEqual([...out.slice(0,2)],[0,0]);assert.deepEqual([...out.slice(6)],[20,10]);assert.notDeepEqual(out,rest);
 const reflected=applyHeadDetails(p,{ear:{rotation:.3}},true,rest.slice());assert.ok(reflected[4]>5&&out[4]<5);
 assert.throws(()=>compileHeadDetails(rest,[{...d,joint:'missing'}],['ear']),/Invalid/);assert.throws(()=>compileHeadDetails(rest,[d,d],['ear']),/Invalid/);assert.throws(()=>applyHeadDetails(p,{ear:{rotation:NaN}},false,out),/Nonfinite/);
 // The previous static source head is a failing motion control.
 assert.equal(rest[4],5);assert.notEqual(out[4],rest[4]);
});
import fs from'node:fs';import path from'node:path';import{createRequire}from'node:module';import{triangulateAlpha,GRAPH}from'../creature-animation/quadruped-template.mjs';import{requireHeadSurfaceOrientation,requireHeadReplacementCoverage}from'./head-surface.mjs';
const root=path.resolve(import.meta.dirname,'../../../..'),require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
test('real Civet source supports pass all ear/jaw envelope combinations and retain the neck-removal failure control',()=>{
 const dir=path.join(root,'audits/BATTLE_NECK_REPAIR_20260916/head-04'),b=JSON.parse(fs.readFileSync(dir+'/views.json')),v=b.views[0],png=PNG.sync.read(fs.readFileSync(dir+'/'+v.file)),mesh=triangulateAlpha(Uint8Array.from({length:png.width*png.height},(_,i)=>png.data[i*4+3]),png.width,png.height),areas=[];
 for(let i=0;i<mesh.indices.length;i+=3){const[a,b,c]=mesh.indices.slice(i,i+3).map(k=>k*2),p=mesh.rest;areas.push((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]));}
 const program=compileHeadDetails(mesh.rest,v.details,['jaw','earFarTip','earNearTip']),out=mesh.rest.slice();
 for(const jaw of [0,-.14,-.26,-.4363323129985824])for(const earFarTip of [-.3,0,.3])for(const earNearTip of [-.3,0,.3]){const pose={jaw:{rotation:jaw},earFarTip:{rotation:earFarTip},earNearTip:{rotation:earNearTip}};applyHeadDetails(program,pose,true,out);requireHeadSurfaceOrientation(out,mesh.indices,areas);assert.deepEqual(applyHeadDetails(program,pose,true,out.slice()),out);}
 const parts=JSON.parse(fs.readFileSync(path.join(root,'audits/C2_CONTINUOUS_SKIN_20260916/candidate-10/civet.binding.json'))).parts;
 requireHeadReplacementCoverage(b.replaces,parts,GRAPH);
 const old=JSON.parse(fs.readFileSync(path.join(root,'audits/BATTLE_FACING_20260916/head-03/views.json')));assert.throws(()=>requireHeadReplacementCoverage(old.replaces,parts,GRAPH),/body coverage: neck/);
});
