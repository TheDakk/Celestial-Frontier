import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveFixedAttachments,validateFixedPivots} from './fixed-attachments.mjs';
import {createSkeletonPoseProgram} from './skeleton-pose.mjs';
import {checkFamilyGeometry,measureFamilyBounds,sealFamilyRecord,admitFamilyRecord} from './family-record.mjs';
import {hashJSON} from './quadruped-template.mjs';
import {transformPoint} from './kinematics.ts';
function fixture(){
 const legs=['leg0Far','leg0Near'],graph=[['head','root'],['mandible','head'],['antennaFar','head'],['antennaNear','head'],...legs.flatMap(id=>[[id+'Knee','root'],[id+'Foot',id+'Knee']]),['ultimateFar','root'],['ultimateNear','root']];
 const definition={id:'myriapod',anatomyModel:'myriapod-rigid-trunk-v1',graph,legs,bodyAxis:['root','head'],joints:['root',...graph.map(([j])=>j)],bounds:[{id:'bone-min',kind:'bone-min',min:.001,max:.75},{id:'bone-max',kind:'bone-max',min:.001,max:.75}]};
 const landmarks={root:[.1,.5],head:[.8,.5],mandible:[.85,.53],antennaFar:[.87,.4],antennaNear:[.89,.45],leg0FarKnee:[.34,.67],leg0FarFoot:[.4,.78],leg0NearKnee:[.36,.63],leg0NearFoot:[.44,.73],ultimateFar:[.05,.60],ultimateNear:[.04,.63]};
 const record={geometry:{width:128,height:128,fixedAttachments:{head:[.75,.5],leg0FarKnee:[.3,.5],leg0NearKnee:[.3,.48],ultimateFar:[.1,.55],ultimateNear:[.1,.57]}}};return{definition,landmarks,record};
}
const close=(actual,expected)=>assert(Math.abs(actual-expected)<1e-14,`${actual} != ${expected}`);
test('fixed sockets keep their source location under local rotation and inherit actual root rotation/translation',()=>{
 const{definition,landmarks,record}=fixture(),resolved=resolveFixedAttachments(definition,record),program=createSkeletonPoseProgram(resolved,landmarks),body=.7,root=landmarks.root,rotation=.17,local=-.29,pose={root:{rotation,dx:.02,dy:-.01},leg0FarKnee:{rotation:local},head:{rotation:.25}},matrices=program.evaluate(pose);
 const move=(p,a,o,t=[0,0])=>[o[0]+Math.cos(a)*(p[0]-o[0])-Math.sin(a)*(p[1]-o[1])+t[0],o[1]+Math.sin(a)*(p[0]-o[0])+Math.cos(a)*(p[1]-o[1])+t[1]],socket=record.geometry.fixedAttachments.leg0FarKnee,target=move(socket,rotation,root,[.02*body,-.01*body]);
 assert.deepEqual(program.pivot('leg0FarKnee'),{x:socket[0],y:socket[1]});const actual=transformPoint(matrices.leg0FarKnee,{x:socket[0],y:socket[1]});close(actual.x,target[0]);close(actual.y,target[1]);
 const expectedKnee=move(move(landmarks.leg0FarKnee,local,socket),rotation,root,[.02*body,-.01*body]),knee=transformPoint(matrices.leg0FarKnee,{x:landmarks.leg0FarKnee[0],y:landmarks.leg0FarKnee[1]});close(knee.x,expectedKnee[0]);close(knee.y,expectedKnee[1]);
 const headSocket=record.geometry.fixedAttachments.head,head=transformPoint(matrices.head,{x:headSocket[0],y:headSocket[1]}),expectedHead=move(headSocket,rotation,root,[.02*body,-.01*body]);close(head.x,expectedHead[0]);close(head.y,expectedHead[1]);
 assert.deepEqual(program.jointNames,definition.joints);assert.equal(program.jointNames.includes('socket'),false);assert.throws(()=>program.evaluate({socket:{rotation:0}}),/unknown pose joint/);
});
test('admission bone lengths measure socket-to-knee and knee-to-foot without adding geometry or mutating source',()=>{
 const{definition,landmarks,record}=fixture(),before=structuredClone(record),resolved=resolveFixedAttachments(definition,record),b=measureFamilyBounds(resolved,landmarks),p=record.geometry.fixedAttachments.leg0FarKnee,k=landmarks.leg0FarKnee;
 assert.equal(b.boneLengths.leg0FarKnee,Math.hypot(k[0]-p[0],k[1]-p[1]));assert.notEqual(b.boneLengths.leg0FarKnee,Math.hypot(k[0]-landmarks.root[0],k[1]-landmarks.root[1]));assert.equal(b.boneLengths.leg0FarFoot,Math.hypot(.4-.34,.78-.67));assert.deepEqual(record,before);assert(Object.isFrozen(resolved.fixedPivots)&&Object.isFrozen(resolved.fixedPivots.head));record.geometry.fixedAttachments.head[0]=.7;assert.equal(resolved.fixedPivots.head[0],.75);
});
test('missing, malformed, extra, sparse and nonfinite socket data refuse without a parent-pivot fallback',()=>{
 const{definition,landmarks,record}=fixture();assert.throws(()=>createSkeletonPoseProgram(definition,landmarks),/exact socket inventory/);assert.throws(()=>resolveFixedAttachments(definition,{geometry:{}}),/source socket/);
 for(const value of [undefined,null,{}, {...record.geometry.fixedAttachments,extra:[.2,.2]}, {...record.geometry.fixedAttachments,head:[NaN,.5]}, {...record.geometry.fixedAttachments,head:[1.1,.5]}, {...record.geometry.fixedAttachments,head:Array(2)}])assert.throws(()=>resolveFixedAttachments(definition,{geometry:{fixedAttachments:value}}),/Fixed attachments:/);
 const changed={...definition,graph:definition.graph.map(([j,parent])=>[j,j==='leg0FarKnee'?'head':parent])};assert.throws(()=>resolveFixedAttachments(changed,record),/walking socket graph/);
});
test('foreign-model declarations and source-substituted resolved sockets refuse',()=>{
 const{definition,record}=fixture(),resolved=resolveFixedAttachments(definition,record),changed=structuredClone(record);changed.geometry.fixedAttachments.head[0]+=.01;
 assert.throws(()=>resolveFixedAttachments({...definition,id:'insect'},record),/unsupported anatomy model/);assert.throws(()=>resolveFixedAttachments({...definition,anatomyModel:'unknown'},record),/require compact/);assert.throws(()=>resolveFixedAttachments(resolved,changed),/differ from source/);assert.throws(()=>validateFixedPivots({...resolved,anatomyModel:undefined}),/require compact/);
});
test('source alpha validates the exact socket pixel rather than a nearby substitute',()=>{
 const{definition,record}=fixture(),alpha=new Uint8Array(128*128),index=p=>Math.min(127,Math.floor(p[1]*128))*128+Math.min(127,Math.floor(p[0]*128));for(const p of Object.values(record.geometry.fixedAttachments))alpha[index(p)]=1;
 assert(resolveFixedAttachments(definition,record,alpha));const i=index(record.geometry.fixedAttachments.head);alpha[i]=0;alpha[i+1]=255;assert.throws(()=>resolveFixedAttachments(definition,record,alpha),/socket outside painted alpha: head/);assert.throws(()=>resolveFixedAttachments(definition,record,new Uint8Array(1)),/alpha dimensions/);
});
test('absent socket declarations preserve legacy definition identity and exact parent-pivot matrices',()=>{
 const d={graph:[['head','root']],bodyAxis:['root','head']},lm={root:[.2,.3],head:[.6,.5]};assert.equal(resolveFixedAttachments(d,{}),d);assert.equal(validateFixedPivots(d),null);const p=createSkeletonPoseProgram(d,lm);assert.deepEqual(p.pivot('head'),{x:.2,y:.3});const rest=p.evaluate({});assert.deepEqual(rest.root,[1,0,0,1,0,0]);assert.deepEqual(rest.head,[1,0,0,1,0,0]);
});
test('legacy quadruped shortcuts refuse present socket declarations in geometry, sealing and admission',async()=>{
 const root=new URL('../../../../',import.meta.url),r=JSON.parse(fs.readFileSync(new URL('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json',root))),master=fs.readFileSync(new URL(r.source,root));
 assert.deepEqual(checkFamilyGeometry(r),r.boundsCheck);assert.deepEqual(await sealFamilyRecord(r),r);assert.equal((await admitFamilyRecord(r,master)).id,'quadruped');
 for(const fixedAttachments of [undefined,null,{}, {head:[.5,.5]}]){const changed=structuredClone(r);changed.geometry.fixedAttachments=fixedAttachments;assert.throws(()=>checkFamilyGeometry(changed),/fixed attachments require compact myriapod/i);await assert.rejects(sealFamilyRecord(changed),/fixed attachments require compact myriapod/i);const{recipeHash,...body}=changed;void recipeHash;changed.recipeHash=await hashJSON(body);await assert.rejects(admitFamilyRecord(changed,master),/fixed attachments require compact myriapod/i);}
});
