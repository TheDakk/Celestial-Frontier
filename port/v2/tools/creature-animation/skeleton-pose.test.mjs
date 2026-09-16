import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSkeletonPoseProgram} from './skeleton-pose.mjs';
import {GRAPH} from './quadruped-template.mjs';
import {composeAffine, rotationAround, IDENTITY_AFFINE, transformPoint} from './kinematics.ts';
const definition = () => ({graph:[['body','root'],['wing','body'],['tip','wing'],['fin','body']],bodyAxis:['body','wing']});
const landmarks = () => ({root:[.2,.4],body:[.3,.4],wing:[.7,.4],tip:[.9,.4],fin:[.3,.8]});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12, `${a} != ${b}`);
test('uses the owner body axis and parent pivot; root displacement applies exactly once',()=>{
 const lm=landmarks(),p=createSkeletonPoseProgram(definition(),lm);
 close(p.bodyLength,.4);
 const translated=p.evaluate({root:{rotation:0,dx:.5,dy:-.25}});
 for(const [name,point]of Object.entries(lm)){const t=transformPoint(translated[name],{x:point[0],y:point[1]});close(t.x,point[0]+.2);close(t.y,point[1]-.1);}
 // The old producer's broadcast translation would multiply motion by depth.
 const broadcast=p.evaluate(Object.fromEntries(p.jointNames.map(n=>[n,{rotation:0,dx:.5,dy:-.25}])));
 assert.ok(Math.abs(broadcast.tip[4]-translated.tip[4])>.5);
 const turned=p.evaluate({wing:{rotation:Math.PI/2}}),tip=transformPoint(turned.tip,{x:.9,y:.4});
 close(tip.x,.3);close(tip.y,1);assert.deepEqual(turned.fin,IDENTITY_AFFINE);
 assert.deepEqual(p.evaluate({}).tip,IDENTITY_AFFINE);
});
test('snapshots template and landmarks; failed frames cannot poison subsequent poses',()=>{
 const def=definition(),lm=landmarks(),p=createSkeletonPoseProgram(def,lm),pose={tip:{rotation:.4}};
 const before=p.evaluate(pose);def.graph[0][1]='missing';lm.wing[0]=.1;lm.tip=[0,0];
 assert.deepEqual(p.evaluate(pose),before);assert.throws(()=>{p.jointNames.push('fake');});
 for(const invalid of [{bad:{rotation:0}},{wing:{rotation:NaN}},{wing:{rotation:0,dx:Infinity}},{tip:{rotation:0,dx:1e40}},null,[]]){
  assert.throws(()=>p.evaluate(invalid));assert.deepEqual(p.evaluate(pose),before);
 }
 const inherited=Object.create({tip:{rotation:1}});assert.deepEqual(p.evaluate(inherited),p.evaluate({}));
 assert.throws(()=>p.evaluate(JSON.parse('{"__proto__":{"rotation":0}}')),/unknown pose joint/);
});
test('refuses malformed topology, ambiguous inventories, hidden prototype joints and bad body axes',()=>{
 for(const graph of [[['body','missing']], [['body','root'],['body','root']], [['root','root']], [['a','b'],['b','a']], [['constructor','root']],[]]){
  assert.throws(()=>createSkeletonPoseProgram({graph,bodyAxis:['root','body']},landmarks()));
 }
 const lm=landmarks();delete lm.tip;assert.throws(()=>createSkeletonPoseProgram(definition(),lm),/inventory/);
 assert.throws(()=>createSkeletonPoseProgram(definition(),{...landmarks(),extra:[.5,.5]}),/inventory/);
 assert.throws(()=>createSkeletonPoseProgram(definition(),{...landmarks(),wing:[NaN,.4]}),/normalized/);
 for(const bodyAxis of [undefined,['root','unknown'],['root','root']])assert.throws(()=>createSkeletonPoseProgram({...definition(),bodyAxis},landmarks()));
 const inherited=Object.create({tip:[.9,.4]});Object.assign(inherited,landmarks());delete inherited.tip;inherited.fake=[.9,.4];
 assert.throws(()=>createSkeletonPoseProgram(definition(),inherited),/normalized landmark/);
});
test('matches the previous quadruped evaluator exactly for all three real records',()=>{
 const root=new URL('../../../../',import.meta.url),manifest=JSON.parse(readFileSync(new URL('audits/C2_CONTINUOUS_SKIN_20260916/candidate-10/manifest.json',root)));
 for(const entry of manifest.results){
  const record=JSON.parse(readFileSync(new URL(entry.record,root))),lm=record.landmarks,names=['root',...GRAPH.map(([n])=>n)],parents=new Map(GRAPH);
  const length=Math.hypot(lm.chest[0]-lm.pelvis[0],lm.chest[1]-lm.pelvis[1]);
  const program=createSkeletonPoseProgram({graph:GRAPH,bodyAxis:['pelvis','chest']},lm);
  for(let step=0;step<40;step++){
   const pose=Object.fromEntries(names.filter((_,i)=>i%3!==step%3).map((n,i)=>[n,{rotation:Math.sin(i+step)*.2,dx:n==='root'?.07:0,dy:n==='root'?-.03:0}]));
   const expected={};for(const joint of names){const parent=parents.get(joint),pivot=lm[parent??'root'],key=pose[joint];const local=key?rotationAround({x:pivot[0],y:pivot[1]},key.rotation,{x:(key.dx??0)*length,y:(key.dy??0)*length}):IDENTITY_AFFINE;expected[joint]=parent?composeAffine(expected[parent],local):local;}
   const actual=program.evaluate(pose);for(const name of names)assert.deepEqual(actual[name],expected[name],entry.id+':'+name);
  }
 }
});
