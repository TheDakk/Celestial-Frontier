import fs from 'node:fs';import path from 'node:path';import {it,expect} from 'vitest';
import {compileBodyCard,type ResolvedAnatomyRecord} from './body-card.js';import {buildTimeline,sampleTimeline} from './timeline.js';
import {familyContractForRecord} from '../../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../../tools/creature-animation/skeleton-pose.mjs';
const base=path.resolve(import.meta.dirname,'../../../../../../audits/ANATOMY_COMPLETION_20260917/crab-masks-04');
const point=(m:readonly number[],p:readonly number[])=>[m[0]!*p[0]!+m[2]!*p[1]!+m[4]!,m[1]!*p[0]!+m[3]!*p[1]!+m[5]!] as const;
const angle=(p:readonly number[],f:readonly number[],d:readonly number[])=>Math.atan2((d[0]!-p[0]!)*(f[1]!-p[1]!)-(d[1]!-p[1]!)*(f[0]!-p[0]!),(d[0]!-p[0]!)*(f[0]!-p[0]!)+(d[1]!-p[1]!)*(f[1]!-p[1]!));
for(const id of ['crab','coconut-crab','freshwater-crab','mud-crab','vent-crab'])it(id+' closes actual painted pincer gaps while every walking contact remains fixed, including mirrored source',()=>{
 const source=JSON.parse(fs.readFileSync(path.join(base,id+'-record.json'),'utf8'));
 for(const mirror of [false,true]){
  const r={...source,projection:'source-pincers',landmarks:Object.fromEntries(Object.entries(source.landmarks as Record<string,number[]>).map(([j,p])=>[j,[mirror?1-p[0]!:p[0],p[1]]]))} as ResolvedAnatomyRecord;
  const card=compileBodyCard(r),tl=buildTimeline(card,'melee:pinch',r.identity.seed),program=createSkeletonPoseProgram(familyContractForRecord(r),r.landmarks as Readonly<Record<string,readonly [number,number]>>),lm=r.landmarks;
  const strike=tl.tracks.clawNearDactylRoot!.find(k=>k.value===Math.min(...tl.tracks.clawNearDactylRoot!.map(k=>k.value)))!;
  for(let i=0;i<=120;i++){
   const p=sampleTimeline(tl,tl.durationMs*i/120),pose=Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),m=program.evaluate(pose);
   expect([p.root.dx,p.root.dy]).toEqual([0,0]);
   for(const joint of Object.keys(lm).filter(j=>/^leg.*(Root|Knee|Foot)$/.test(j)))expect(point(m[joint]!,lm[joint]!)).toEqual(lm[joint]);
   for(const side of ['Far','Near']){const prefix='claw'+side,pivot=lm[prefix+'Palm']!,fixed=lm[prefix+'FixedTip']!,moving=point(m[prefix+'DactylTip']!,lm[prefix+'DactylTip']!);const before=angle(pivot,fixed,lm[prefix+'DactylTip']!),now=angle(pivot,fixed,moving);expect(now*Math.sign(before)).toBeGreaterThanOrEqual(-1e-10);}
  }
  // Evaluate the exact canonical strike key in both handed source views.
  const at=tl.tracks.clawNearDactylRoot![2]!.ms,p=sampleTimeline(tl,at),m=program.evaluate(Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])));
  for(const side of ['Far','Near']){const prefix='claw'+side;expect(Math.abs(angle(lm[prefix+'Palm']!,lm[prefix+'FixedTip']!,point(m[prefix+'DactylTip']!,lm[prefix+'DactylTip']!)))).toBeLessThan(1e-10);}
  expect(strike).toBeDefined();expect(tl.clamped).toHaveLength(0);
  const bad=program.evaluate({clawNearDactylRoot:{rotation:-25*Math.PI/180*(card.projectionSigns?.clawNearDactylRoot??1)}});expect(Math.abs(angle(lm.clawNearPalm!,lm.clawNearFixedTip!,point(bad.clawNearDactylTip!,lm.clawNearDactylTip!)))).toBeGreaterThan(1e-3);
 }
});
