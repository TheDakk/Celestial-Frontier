import fs from 'node:fs';
import {expect,it} from 'vitest';
import {createContactTravel} from './creature-contact-travel.js';
import {compileBodyCard} from './motion/body-card.js';
import {buildActionTimeline,buildTimeline} from './motion/timeline.js';
import {actionsFor} from './motion/family-actions.js';
const records=JSON.parse(fs.readFileSync(new URL('../../../tools/creature-animation/test-fixtures/family-records.json',import.meta.url),'utf8')).records;
const card=(id:string)=>compileBodyCard({...structuredClone(records[id]),identity:{...records[id].identity,earthName:null},recipeHash:'synthetic-contact-travel-control'});
const position=(s:ReturnType<ReturnType<typeof createContactTravel>['sample']>)=>s.base+s.stride*s.progress;
it('preserves the insect hit backsteps, recovery and exact source waypoint times',()=>{
 const c=card('insect'),timeline=buildTimeline(c,'hit',17),keys=timeline.root.dx,travel=createContactTravel(keys,c.bodyLength);
 expect(keys.map(k=>Math.sign(k.value))).toEqual([0,-1,-1,0]);
 for(let i=1;i<keys.length;i++){
  const a=keys[i-1]!,b=keys[i]!,middle=travel.sample((a.ms+b.ms)/2);
  expect(middle.progress).toBeCloseTo(.5,14);expect(middle.base).toBe(a.value*c.bodyLength);
  expect(middle.stride).toBe(b.value*c.bodyLength-a.value*c.bodyLength);
  expect(Math.sign(middle.stride)).toBe(i===keys.length-1?1:-1);
  expect(travel.sample(b.ms).base).toBe(b.value*c.bodyLength);
  expect(position(travel.sample(b.ms-1e-7))).toBeCloseTo(b.value*c.bodyLength,8);
  expect(position(travel.sample(b.ms+1e-7))).toBeCloseTo(b.value*c.bodyLength,8);
 }
 expect(travel.sample(timeline.durationMs*3)).toEqual({base:0,stride:0,progress:1});
});
it('retains forward approach followed by separate stationary source intervals',()=>{
 const c=card('insect'),timeline=buildTimeline(c,'tame',17),keys=timeline.root.dx,travel=createContactTravel(keys,c.bodyLength);
 const first=travel.sample(keys[1]!.ms/2);expect(first.stride).toBeGreaterThan(0);expect(first.progress).toBe(.5);
 for(let i=2;i<keys.length;i++){
  const a=keys[i-1]!,b=keys[i]!,hold=travel.sample((a.ms+b.ms)/2);
  expect(hold.base).toBe(a.value*c.bodyLength);expect(hold.stride).toBe(0);expect(hold.progress).toBeCloseTo(.5,14);
  expect(travel.sample(a.ms).progress).toBe(0);
 }
 expect(travel.sample(timeline.durationMs*2)).toEqual({base:keys.at(-1)!.value*c.bodyLength,stride:0,progress:1});
});
it('uses compiled body timing, holding during material lag instead of stretching motion to total duration',()=>{
 const c=card('biped-bird'),timeline=buildTimeline(c,'hit',17),travel=createContactTravel(timeline.root.dx,c.bodyLength);
 expect(timeline.durationMs).toBeGreaterThan(timeline.bodyMs);
 const first=timeline.root.dx[1]!;
 expect(travel.sample(first.ms).base).toBe(first.value*c.bodyLength);
 expect(travel.sample(timeline.bodyMs)).toEqual({base:0,stride:0,progress:1});
 expect(travel.sample(timeline.durationMs)).toEqual({base:0,stride:0,progress:1});
 const stretched=createContactTravel(timeline.root.dx.map(k=>({...k,ms:k.ms*timeline.durationMs/timeline.bodyMs})),c.bodyLength);
 expect(position(stretched.sample(timeline.bodyMs))).not.toBe(0);
});
it('converts already compiled motion-scale values once, without guessing root units',()=>{
 const c=card('insect'),scaled={...c,scaleLength:c.bodyLength*2},action=actionsFor('insect')!.hit!;
 const timeline=buildActionTimeline(scaled,{...action,rootUnit:'motion-scale'},17),key=timeline.root.dx[1]!;
 expect(key.value).toBe(action.poses[0]!.root.dx*2);
 const travel=createContactTravel(timeline.root.dx,c.bodyLength);
 expect(travel.sample(key.ms).base).toBe(action.poses[0]!.root.dx*scaled.scaleLength);
});
it('inserts an omitted rest key and snapshots input without erasing a zero-travel interval',()=>{
 const keys=[{ms:100,value:1},{ms:200,value:1}],travel=createContactTravel(keys,.25);
 keys[0]!.ms=10;keys[0]!.value=-99;keys.push({ms:300,value:2});
 expect(travel.sample(0)).toEqual({base:0,stride:.25,progress:0});
 expect(travel.sample(50)).toEqual({base:0,stride:.25,progress:.5});
 expect(travel.sample(150)).toEqual({base:.25,stride:0,progress:.5});
 expect(travel.sample(300)).toEqual({base:.25,stride:0,progress:1});
 expect(createContactTravel([{ms:0,value:0}],1).sample(50)).toEqual({base:0,stride:0,progress:1});
});
it('rejects invalid times, scales, duplicate/reversed keys, nonzero rest and nonfinite displacement',()=>{
 for(const length of [0,-1,NaN,Infinity])expect(()=>createContactTravel([{ms:1,value:1}],length)).toThrow('Contact travel:');
 for(const keys of [[],[{ms:-1,value:0}],[{ms:NaN,value:0}],[{ms:Infinity,value:0}],[{ms:0,value:1}],[{ms:0,value:0},{ms:0,value:0}],[{ms:2,value:0},{ms:1,value:0}],[{ms:1,value:NaN}],[{ms:1,value:Infinity}],[{ms:1,value:Number.MAX_VALUE},{ms:2,value:-Number.MAX_VALUE}]])expect(()=>createContactTravel(keys,1)).toThrow('Contact travel:');
 expect(()=>createContactTravel([{ms:1,value:Number.MAX_VALUE}],2)).toThrow('Contact travel:');
 const travel=createContactTravel([{ms:1,value:1}],1);
 for(const ms of [-1,NaN,Infinity])expect(()=>travel.sample(ms)).toThrow('Contact travel: invalid time');
});
