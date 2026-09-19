import test from'node:test';import assert from'node:assert/strict';
import{deformHeadSurface}from'./head-surface.mjs';import{IDENTITY_AFFINE,rotationAround,transformPoint}from'../creature-animation/kinematics.ts';
test('head follows actual pose but source neck remains attached to chest; rigid old transform fails',()=>{
 const rest=new Float32Array([0,0,0,1,0,2]),mapping=[1,0,0,1,0,0],head=rotationAround({x:0,y:0},.5),chest=IDENTITY_AFFINE;
 const out=deformHeadSurface(rest,mapping,{top:0,bottom:2},head,chest,new Float32Array(6));
 assert.deepEqual([...out.slice(4)],[0,2]);assert.notDeepEqual(transformPoint(head,{x:0,y:2}),{x:out[4],y:out[5]});assert.ok(out[2]<0);assert.ok(out[3]<1);
 const identity=deformHeadSurface(rest,mapping,{top:0,bottom:2},chest,chest,new Float32Array(6));assert.deepEqual(identity,rest);
 assert.throws(()=>deformHeadSurface(rest,mapping,{top:2,bottom:2},head,chest,new Float32Array(6)),/Invalid/);
});
import{requireHeadSurfaceOrientation}from'./head-surface.mjs';
test('actual triangle fold is refused, including the reflected profile view',()=>{
 const indices=new Uint32Array([0,1,2]);requireHeadSurfaceOrientation([0,0,-1,0,0,1],indices,[-1]);
 assert.throws(()=>requireHeadSurfaceOrientation([0,0,1,0,0,1],indices,[-1]),/fold/);
 assert.throws(()=>requireHeadSurfaceOrientation([0,0,-1,0,0,0],indices,[-1]),/fold/);
});
import{requireHeadReplacementCoverage}from'./head-surface.mjs';
test('head replacement cannot cut away the neck or chest; original bad declaration is refused',()=>{
 const graph=[['chest','root'],['neck','chest'],['head','neck'],['jaw','head'],['ear','head']],parts=[{id:'body',joint:'chest'},{id:'neck',joint:'neck'},{id:'head',joint:'head'},{id:'jaw',joint:'jaw'},{id:'ear-near',joint:'ear'}];
 requireHeadReplacementCoverage(['head','jaw','ear-near'],parts,graph);
 for(const id of ['neck','body','missing'])assert.throws(()=>requireHeadReplacementCoverage(['head',id],parts,graph));
 assert.throws(()=>requireHeadReplacementCoverage(['head','head'],parts,graph),/duplicate/);
});
