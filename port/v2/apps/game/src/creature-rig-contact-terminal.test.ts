import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {expect,it} from 'vitest';
import type {CreaturePoseV1} from './creature-rig.js';
import {createFamilyContactSolver,observedContactSupports,type WeightedContactSupport} from './creature-rig-contact.js';
import {compileBodyCard} from './motion/body-card.js';
import {buildTimeline} from './motion/timeline.js';
import {createGsapPlayer} from './motion/gsap-adapter.js';
import {familyContractForRecord,familyContactChains} from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {transformPoint,type Affine2} from '../../../tools/creature-animation/kinematics.js';

// A retained, source-authored four-pad record. These tests perform contact math
// only; real ARAP/publication eligibility is checked by its separate owner.
const root=new URL('../../../../../',import.meta.url);
const read=(name:string)=>JSON.parse(readFileSync(new URL('audits/ARCHETYPE_FINISH_20260923/06-hopper/fit-05/'+name,root),'utf8'));
const record=read('record.json'),binding=read('binding.json');
const template=familyContractForRecord(record),chains=familyContactChains(template),program=createSkeletonPoseProgram(template,record.landmarks);
const supports=observedContactSupports(record,binding),card=compileBodyCard(record,record.genome),timeline=buildTimeline(card,'faint',record.identity.seed);
const point=(p:readonly number[])=>({x:p[0]!,y:p[1]!});
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
const playerFor=()=>{let pose:Record<string,{rotation:number;dx:number;dy:number}>={};const player=createGsapPlayer(timeline,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});return {at(ms:number){pose={};player.seek(ms);return pose;},stop:()=>player.stop()};};
const phase=(ms:number)=>({actionId:timeline.actionId,elapsedMs:ms,durationMs:timeline.durationMs,realm:card.realm,weight:1});

/** Reconstruct the rendered triangle through both interpolation stages and
 * field influences, independently of predictContactSupport and the IK owner. */
function renderedPoint(support:WeightedContactSupport,matrices?:Readonly<Record<string,Affine2>>){
 const surface=support.surface;assert(surface&&'triangle' in surface);
 const part=binding.paintSkin.parts.find((p:any)=>p.id===surface.partId);assert(part);
 const out={x:0,y:0};
 for(let i=0;i<3;i++){const render=part.vertices[surface.triangle[i]!];
  for(let j=0;j<3;j++){const field=binding.paintSkin.vertices[render.triangle[j]],weight=surface.barycentric[i]!*render.barycentric[j];
   for(const [joint,influence]of field.weights){const rest={x:field.x/record.geometry.width,y:field.y/record.geometry.height},at=matrices?transformPoint(matrices[joint]!,rest):rest;out.x+=weight*influence*at.x;out.y+=weight*influence*at.y;}
  }
 }return out;
}

it('selects each declared pad inside its actual pinned, terminal-rigid rendered triangle',()=>{
 expect(record.recipeHash).toBe('5357c3e397fbd0d70587424b527de754e7d7fc15988324ba93d85e5e3d692b97');
 expect(binding.bindingHash).toBe('7e3ac04a6e9ddbb3087ebe6df37bfb98e5e47241c4f08a89044341b3a0a85fa2');
 expect(Object.keys(supports).sort()).toEqual(chains.map(c=>c.end).sort());expect(chains).toHaveLength(4);
 const pins=new Set<number>(binding.paintSkin.solver.pins);
 for(const chain of chains){const support=supports[chain.end]!,surface=support.surface;assert(surface&&'triangle'in surface);
  expect(support.rest).toEqual(record.geometry.contactPads.points[chain.end]);expect(support.pivotJoint).toBe(chain.terminal);
  const owner=binding.parts.find((p:any)=>p.id===surface.partId),part=binding.paintSkin.parts.find((p:any)=>p.id===surface.partId);
  expect(owner.joint).toBe(chain.terminal);expect(owner.kind).toBe('part');
  expect(surface.barycentric.every(n=>n>=0&&n<=1)).toBe(true);expect(surface.barycentric.reduce((a,b)=>a+b,0)).toBeCloseTo(1,14);
  for(let i=0;i<3;i++){const vertex=part.vertices[surface.triangle[i]!];for(let j=0;j<3;j++)if(surface.barycentric[i]!*vertex.barycentric[j]!==0){const index=vertex.triangle[j];expect(pins.has(index)).toBe(true);expect(binding.paintSkin.vertices[index].weights).toEqual([[chain.terminal,1]]);}}
  expect(distance(renderedPoint(support),point(support.rest))).toBeLessThan(1e-12);
 }
});

it('retains all four painted pads and original joint/length constraints across canonical faint, including the former refusal',()=>{
 const contact=createFamilyContactSolver(record,supports),player=playerFor();
 const times=[...new Set([...Array.from({length:121},(_,i)=>timeline.durationMs*i/120),307.6666666666667,timeline.bodyMs*.45,timeline.bodyMs])].sort((a,b)=>a-b);
 let maxLengthError=0,maxPaintErrorPx=0,maxCompressionPx=0;const modes=new Set<string>();
 try{for(const ms of times){const input=player.at(ms);let result:ReturnType<typeof contact.resolve>;
  try{result=contact.resolve(input,phase(ms));}catch(error){throw new Error('Canonical faint contact refusal at '+ms+' ms',{cause:error});}
  assert.equal(result.contacts.length,4);const matrices=program.evaluate(result.pose);
  assert((result.compression??0)<=contact.scaleLength*.08,'original compression bound');assert(result.maxError<=1e-8,'original endpoint residual');
  maxCompressionPx=Math.max(maxCompressionPx,(result.compression??0)*record.geometry.height);
  for(const target of result.contacts){const chain=chains.find(c=>c.end===target.joint)!;assert(chain.terminal);assert(target.stance);
   const joints=[chain.hip,chain.knee,chain.end,chain.terminal],world=joints.map(j=>transformPoint(matrices[j]!,point(record.landmarks[j])));
   for(let k=1;k<joints.length;k++){const restLength=distance(point(record.landmarks[joints[k-1]!]),point(record.landmarks[joints[k]!])),error=Math.abs(distance(world[k-1]!,world[k]!)-restLength);maxLengthError=Math.max(maxLengthError,error);assert(error<1e-12,'original bone length '+joints[k]);}
   for(const joint of joints.slice(1)){const limit=(template.contactLimitsDeg??template.limitsDeg)[joint]!,angle=result.pose[joint]!.rotation*180/Math.PI;assert(angle>=limit.min-1e-7&&angle<=limit.max+1e-7,'original local joint limit '+joint+' '+angle);}
   const pad=renderedPoint(supports[target.joint]!,matrices),direct=transformPoint(matrices[chain.terminal]!,point(record.geometry.contactPads.points[target.joint]));
   assert(distance(pad,direct)<1e-12,'rendered interpolation agrees with actual terminal pivot');
   const error=Math.hypot((pad.x-target.paintedTarget.x)*record.geometry.width,(pad.y-target.paintedTarget.y)*record.geometry.height);maxPaintErrorPx=Math.max(maxPaintErrorPx,error);assert(error<=.25,'original painted-point drift bound');
  }
  for(const mode of Object.values(result.padModes??{}))modes.add(mode);
 }}finally{player.stop();}
 expect(times).toContain(307.6666666666667);expect(modes.has('preferred')).toBe(true);expect([...modes].some(m=>m!=='preferred')).toBe(true);
 console.log(JSON.stringify({scope:'fit05 canonical faint contact only; no ARAP or film',samples:times.length,durationMs:timeline.durationMs,timelineHash:timeline.hash,maxLengthError,maxPaintErrorPx,maxCompressionPx,modes:[...modes]}));
});

it('refuses declared pads without observed painted support data',()=>{expect(()=>createFamilyContactSolver(record)).toThrow('observed painted supports required');});
it('refuses a substitute support point even when its pure terminal weights look valid',()=>{
 const changed=structuredClone(supports) as Record<string,WeightedContactSupport>,id=chains[0]!.end,s=changed[id]!;
 changed[id]={...s,rest:[s.rest[0]+1/record.geometry.width,s.rest[1]]};
 expect(()=>createFamilyContactSolver(record,changed)).toThrow('exact terminal-rigid support required');
});
it('refuses endpoint or mixed-joint pivots instead of silently admitting terminal rocking',()=>{
 const id=chains[0]!.end,changed=structuredClone(supports) as Record<string,WeightedContactSupport>,s=changed[id]!;
 changed[id]={...s,pivotJoint:id};expect(()=>createFamilyContactSolver(record,changed)).toThrow('exact terminal-rigid support required');
 changed[id]={...s,vertices:s.vertices.map(v=>({...v,weights:[[s.pivotJoint!,.5],[id,.5]] as const}))};
 expect(()=>createFamilyContactSolver(record,changed)).toThrow('exact terminal-rigid support required');
});
it('preserves rejection of an external impossible body translation',()=>{
 const contact=createFamilyContactSolver(record,supports),player=playerFor();
 try{const ms=307.6666666666667,input:CreaturePoseV1=player.at(ms),bad={...input,root:{rotation:0,...input.root,dx:99}};expect(()=>contact.resolve(bad,phase(ms))).toThrow(/reach|no admitted candidate/);}finally{player.stop();}
});
