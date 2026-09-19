import {describe,it,expect} from 'vitest';
import {createCreatureRigPerformance,type CreatureActionPlayer} from './creature-rig-performance.js';
import type {CreaturePoseV1,CreatureRigV1,CreatureRigRecordV1} from './creature-rig.js';
import {Container} from 'pixi.js';
function fixture(names=['root','head','jaw','wingNear','tail0']){
 const calls:CreaturePoseV1[]=[];let disposed=0;
 const record:CreatureRigRecordV1={recipeHash:'fixture',template:{id:'synthetic-body',version:1},geometry:{width:384,height:384,groundLineY:.8,cutoutAssetHash:'fixture'},landmarks:Object.fromEntries(names.map((n,i)=>[n,[i*.1,.5] as const]))};
 const rig:CreatureRigV1={recipeHash:'fixture',templateId:'synthetic-body',parts:[],root:new Container(),bounds:{width:1,height:1,groundLineY:.8},applyPose:p=>calls.push(p),dispose(){}};
 const player=(id:string,sign:number,loop=false):CreatureActionPlayer=>({id,durationMs:1000,loop,seek(ms,t){t.setJoint('root',0,ms/1000,0);names.filter(n=>n!=='root').forEach((n,i)=>t.setJoint(n,sign*ms/1000/(i+1)));},dispose(){disposed++;}});
 return{record,rig,calls,player,disposed:()=>disposed};
}
describe('whole-creature action playback',()=>{
 it('drives every supplied appendage, publishes once, and transitions from exact time across frame rates',()=>{
  const run=(fps:number)=>{const f=fixture(),p=createCreatureRigPerformance(f.record,f.rig,[f.player('idle',1,true),f.player('attack',-1)]);p.play('idle',0,0);for(let t=0;t<375;t+=1000/fps)p.update(t);p.play('attack',375,100);const before=f.calls.length,pose=p.update(425);expect(f.calls.length-before).toBe(1);expect(Object.keys(pose)).toEqual(Object.keys(f.record.landmarks));expect(pose.head!.rotation).toBeCloseTo(.1625);expect(pose.jaw!.rotation).not.toBe(0);expect(pose.wingNear!.rotation).not.toBe(0);return pose;};
  expect(run(30)).toEqual(run(60));expect(run(60)).toEqual(run(120));
 });
 it('retains exact compiled samples after the transition, supports other inventories, and never broadcasts root offsets',()=>{
  const f=fixture(['root','mantle','arm0','arm1','siphon']),p=createCreatureRigPerformance(f.record,f.rig,[f.player('jet',1)]);p.play('jet',0,100);
  const pose=p.update(300);expect(pose.root!.dx).toBe(.3);for(const n of ['mantle','arm0','arm1','siphon']){expect(pose[n]!.rotation).not.toBe(0);expect(pose[n]!.dx).toBe(0);}
 });
 it('rejects broken producers atomically, clears old action joints and does not own a clock or render schedule',()=>{
  const f=fixture(),bad={...f.player('bad',1),seek(_ms:number,t:Parameters<CreatureActionPlayer['seek']>[1]){t.setJoint('foreign',0);}},sparse={...f.player('sparse',1),seek(_ms:number,t:Parameters<CreatureActionPlayer['seek']>[1]){t.setJoint('root',0);}};
  const p=createCreatureRigPerformance(f.record,f.rig,[f.player('idle',1),bad,sparse]);p.play('idle',0,0);p.update(100);const before=f.calls.length;
  expect(()=>p.play('bad',100,10)).toThrow('unknown or duplicate');expect(f.calls.length).toBe(before);expect(p.sample(200).head!.rotation).toBe(.2);
  expect(()=>p.play('missing',200,0)).toThrow('unknown action');p.play('sparse',200,0);expect(p.update(200).head!.rotation).toBe(0);
  expect(()=>p.update(199)).toThrow('time before');expect(()=>p.update(NaN)).toThrow('elapsed');p.reset();expect(f.calls.at(-1)).toEqual({});p.dispose();p.dispose();expect(f.disposed()).toBe(3);expect(()=>p.update(0)).toThrow('disposed');
 });
});
