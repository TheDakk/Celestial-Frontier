import {it,expect} from 'vitest';
import {createStrideCadence} from './creature-stage-travel.js';
it('whole cycles cover composed distance, reset stance-local displacement and preserve body-length units in both directions',()=>{
 for(const targetDistancePx of [184.32,-184.32,1,0]){
  const c=createStrideCadence({targetDistancePx,bodyLengthPx:21,gaitDurationMs:800,stanceReachBodyLengths:.1});
  expect(Number.isInteger(c.cycles)).toBe(true);expect(c.maxStanceTravelBodyLengths).toBeLessThanOrEqual(.2);expect(c.durationMs).toBe(c.cycles*800);
  expect(c.sample(c.durationMs).worldDisplacementPx).toBe(targetDistancePx);expect(c.sample(c.durationMs+100).worldDisplacementPx).toBe(targetDistancePx);
  const anchors=new Map<number,number>();let omittedSpread=0;
  for(let i=0;i<c.cycles*40;i++){const s=c.sample(i*20),arenaFoot=s.worldDisplacementPx-s.stageDisplacement*c.bodyLengthPx;
   if(!anchors.has(s.stanceWindow))anchors.set(s.stanceWindow,arenaFoot);expect(Math.abs(arenaFoot-anchors.get(s.stanceWindow)!)).toBeLessThan(1e-9);expect(Math.abs(s.stageDisplacement)).toBeLessThanOrEqual(.2);
   omittedSpread=Math.max(omittedSpread,Math.abs(s.worldDisplacementPx-anchors.get(s.stanceWindow)!));
  }
  if(Math.abs(targetDistancePx)>1)expect(omittedSpread).toBeGreaterThan(.5);
 }
});
it('invalid scales and a pixel-valued replacement are not accepted as evidence of planting',()=>{
 expect(()=>createStrideCadence({targetDistancePx:1,bodyLengthPx:0,gaitDurationMs:1000,stanceReachBodyLengths:.1})).toThrow();
 const c=createStrideCadence({targetDistancePx:184.32,bodyLengthPx:21,gaitDurationMs:800,stanceReachBodyLengths:.1}),s=c.sample(390);
 expect(Math.abs(s.worldDisplacementPx-s.worldDisplacementPx*c.bodyLengthPx)).toBeGreaterThan(.5);
 expect(()=>c.sample(NaN)).toThrow();
});
