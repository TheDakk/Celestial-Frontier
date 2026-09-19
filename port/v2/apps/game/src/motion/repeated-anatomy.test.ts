import {it,expect} from 'vitest';
import fs from 'node:fs';
import {compileBodyCard} from './body-card.js';
import {buildTimeline,sampleTimeline} from './timeline.js';
import {createGsapPlayer} from './gsap-adapter.js';
import {actionsFor} from './family-actions.js';
import {resolveTemplate,isMotionFallback} from './templates.js';
import {compileAnatomyAttack} from '../anatomy-attacks.js';
import {resolveAnatomyInventory,type AnatomyPresence} from '../../../../tools/creature-animation/anatomy-inventory.mjs';
import {familyContractForRecord} from '../../../../tools/creature-animation/family-contracts.mjs';
import {checkFamilyGeometry,sealFamilyRecord,admitFamilyRecord} from '../../../../tools/creature-animation/family-record.mjs';
import {createSkeletonPoseProgram} from '../../../../tools/creature-animation/skeleton-pose.mjs';
import {hashBytes} from '../../../../tools/creature-animation/quadruped-template.mjs';
const records=JSON.parse(fs.readFileSync(new URL('../../../../tools/creature-animation/test-fixtures/family-records.json',import.meta.url),'utf8')).records;
const anatomy=(id:string,arms:number,feedingTentacles=0):AnatomyPresence=>({schema:'cf.anatomy-presence/v2',absent:[],appendages:{arms,...id==='cephalopod'?{feedingTentacles}:{}}});
// Synthetic geometry controls only: copied limbs never count as fitted painted masters.
function fixture(id:string,arms:number,feedingTentacles=0){
 const record=structuredClone(records[id]);record.anatomy=anatomy(id,arms,feedingTentacles);record.recipeHash='synthetic-count-control';
 const base=resolveTemplate(id);if(isMotionFallback(base))throw Error('fixture');
 const template=resolveAnatomyInventory(base,record.anatomy),old=record.landmarks;
 record.landmarks=Object.fromEntries(template.joints.map(j=>[j,old[j]??old[j.replace(/^arm(\d+)/,(_,n)=>'arm'+Number(n)%(id==='radial'?6:8)).replace(/^tentacle(\d+)/,(_,n)=>'arm'+(3+Number(n)%2))]]));
 return record;
}
// Each inventory keeps the full 121-sample gate under its own test deadline.
it.each([['radial',2,0],['radial',10,0],['radial',20,0],['cephalopod',2,0],['cephalopod',8,2],['cephalopod',14,4]]as const)('keeps %s (%i arms, %i tentacles) in both owners with complete hierarchy and GSAP parity',(id,arms,tentacles)=>{
  const r=fixture(id,arms,tentacles),c=compileBodyCard(r),contract=familyContractForRecord(r),program=createSkeletonPoseProgram(contract,r.landmarks);
  expect(c.parts.map(p=>[p.joint,p.parent])).toEqual(contract.graph);expect(c.parts).toHaveLength((id==='radial'?2:7)+3*(arms+tentacles));
  expect((checkFamilyGeometry(r)as {inside:boolean}).inside).toBe(true);
  const active=new Set<string>();
  for(const action of Object.keys(actionsFor(id,r.anatomy)!)){
   const tl=buildTimeline(c,action,31),seen:Record<string,{rotation:number;dx:number;dy:number}>={},player=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){seen[j]={rotation,dx,dy};}},{now:()=>0});
   try{for(let i=0;i<=120;i++){
    const ms=tl.durationMs*i/120,p=sampleTimeline(tl,ms);player.seek(ms);
    expect(Object.keys(p.joints).sort()).toEqual([...contract.joints].sort());
    for(const[j,v]of Object.entries(p.joints)){
     const limit=tl.limitsRad[j]!;expect(Number.isFinite(v)&&v>=limit.min&&v<=limit.max).toBe(true);expect(Math.abs(seen[j]!.rotation-v)).toBeLessThan(2e-5);
     if(j!=='root')expect([seen[j]!.dx,seen[j]!.dy]).toEqual([0,0]);if(Math.abs(v)>1e-6)active.add(j);
    }
    expect(Object.values(program.evaluate(seen)).flat().every(Number.isFinite)).toBe(true);
   }expect(buildTimeline(c,action,31)).toEqual(tl);}finally{player.stop();}
  }
  for(const j of contract.joints.filter(j=>/^(arm|tentacle)/.test(j)))expect(active.has(j),id+'/'+j+' static').toBe(true);
});
it('stale fixed-count motion is rejected by the activity control even when the card has all joints',()=>{
 const card=compileBodyCard(fixture('radial',10));
 const {anatomy:removed,...withoutCounts}=card;expect(removed).toBeDefined();
 const fixed=buildTimeline(withoutCounts,'idle',31),current=buildTimeline(card,'idle',31);
 const extra=card.parts.filter(p=>/^arm[6789]/.test(p.joint)).map(p=>p.joint);
 const active=(timeline:typeof current)=>extra.every(j=>timeline.tracks[j]!.some(k=>k.value!==0));
 expect(active(fixed)).toBe(false);expect(active(current)).toBe(true);
});
it('default counts preserve the entire existing authored action library',()=>{
 for(const[id,n]of [['radial',6],['cephalopod',8]]as const){
  expect(actionsFor(id,anatomy(id,n))).toEqual(actionsFor(id));
  const base=resolveTemplate(id);if(isMotionFallback(base))throw Error('fixture');
  const expanded=resolveAnatomyInventory(base,anatomy(id,n));expect(expanded.graph).toEqual(base.graph);expect(expanded.limitsDeg).toEqual(base.limitsDeg);
 }
});
it('refuses dropped extra limbs, invented landmarks, unsupported counts, stale hashes and budgets; legacy six/eight-arm intake is the failing control',async()=>{
 const r=fixture('radial',10),old={...r};delete old.anatomy;
 expect(()=>compileBodyCard(old)).toThrow('joint-inventory');expect(()=>checkFamilyGeometry(old)).toThrow();
 const truncated=structuredClone(r);delete truncated.landmarks.arm9Seg2;expect(()=>compileBodyCard(truncated)).toThrow('arm9Seg2');expect(()=>checkFamilyGeometry(truncated)).toThrow();
 const broken=structuredClone(r);broken.landmarks.arm0Seg2=[.01,.01];expect(()=>checkFamilyGeometry(broken)).toThrow('proportion');
 for(const declaration of [anatomy('radial',0),anatomy('radial',2.5),anatomy('cephalopod',20,4),{schema:'cf.anatomy-presence/v2',absent:[],appendages:{arms:6,legs:4}},{schema:'cf.anatomy-presence/v1',absent:[],appendages:{arms:6}}])expect(()=>compileBodyCard({...r,anatomy:declaration})).toThrow('Anatomy inventory');
 expect(()=>compileBodyCard({...fixture('cephalopod',8,0),anatomy:anatomy('cephalopod',20,4)})).toThrow('64-joint budget');
 expect(()=>compileBodyCard({...structuredClone(records.fish),anatomy:anatomy('radial',6)})).toThrow('unsupported repeated');
 const bytes=new Uint8Array([7,8,9]);r.geometry.cutoutAssetHash=await hashBytes(bytes);
 const sealed=await sealFamilyRecord(r),alpha=new Uint8Array(1024*1024).fill(255);
 await expect(admitFamilyRecord(sealed,bytes,alpha)).resolves.toBeDefined();
 const corrupt=structuredClone(sealed);corrupt.anatomy.appendages.arms=8;await expect(admitFamilyRecord(corrupt,bytes,alpha)).rejects.toThrow('hash');
 await expect(admitFamilyRecord(sealed,new Uint8Array([0]),alpha)).rejects.toThrow('cut-out hash');
});
it('attack contact follows the appendage that actually lashes, including added feeding tentacles',()=>{
 for(const[arms,tentacles,contact]of [[8,0,'arm4Seg2'],[2,0,'arm1Seg2'],[8,2,'tentacle0Seg2']]as const){
  const c=compileBodyCard(fixture('cephalopod',arms,tentacles));const d={recordHash:c.recipeHash!,source:'synthetic anatomy control',weapons:['constrict']as const};
  const p=compileAnatomyAttack(c,'water',0,'lash',d);expect(p.attack.contactJoint).toBe(contact);expect(p.timeline.tracks[contact]!.some(k=>k.value!==0)).toBe(true);
  expect(()=>compileAnatomyAttack({...c,parts:c.parts.filter(j=>j.joint!==contact)},'water',0,'lash',d)).toThrow('no admitted');
  // The previous selector pointed to an arm with no authored lash motion.
  if(arms===8)expect(p.timeline.tracks.arm0Seg2!.every(k=>k.value===0)).toBe(true);
 }
});
it('absence combines with counted appendages without removing another part or changing defaults',()=>{
 const r=fixture('cephalopod',8,2);r.anatomy.absent=['fins','eyes'];for(const j of ['finFar','finNear','eyeFar','eyeNear'])delete r.landmarks[j];
 const c=compileBodyCard(r);expect(c.parts.some(p=>p.joint==='tentacle1Seg2')).toBe(true);expect(c.parts.some(p=>p.joint.startsWith('eye'))).toBe(false);
 expect((checkFamilyGeometry(r)as {inside:boolean}).inside).toBe(true);
});
