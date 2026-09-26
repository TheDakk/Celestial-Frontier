import {it,expect} from 'vitest';import{templateIdForFamily}from'./family-templates.js';import fs from 'node:fs';
import {compileBodyCard}from'./body-card.js';import{buildTimeline,sampleTimeline,boundedJoint}from'./timeline.js';import{createGsapPlayer}from'./gsap-adapter.js';import{actionsFor}from'./family-actions.js';import{resolveTemplate,isMotionFallback}from'./templates.js';
import {resolveAnatomyInventory}from'../../../../tools/creature-animation/anatomy-inventory.mjs';
import{checkFamilyGeometry}from'../../../../tools/creature-animation/family-record.mjs';
import{familyContractForRecord}from'../../../../tools/creature-animation/family-contracts.mjs';
import{ANATOMY_ATTACKS,compileAnatomyAttack}from'../anatomy-attacks.js';
const records=JSON.parse(fs.readFileSync(new URL('../../../../tools/creature-animation/test-fixtures/family-records.json',import.meta.url),'utf8')).records;
const fixture=(id:string)=>({...structuredClone(records[id]),identity:{...records[id].identity,earthName:null},recipeHash:'synthetic-control'});
it('all 169 library actions stay finite, within joint limits, deterministic and GSAP-parallel through complete clips',()=>{
 let actions=0;for(const id of Object.keys(records)){const c=compileBodyCard(fixture(id));for(const action of Object.keys(actionsFor(id)!)){
  actions++;const tl=buildTimeline(c,action,17),observed:Record<string,number>={};const player=createGsapPlayer(tl,{setJoint(j,r,dx,dy){observed[j]=r;if(j!=='root'&&(dx!==0||dy!==0))throw Error('non-root offset '+j);}},{now:()=>0});
  try{for(let i=0;i<=120;i++){const ms=tl.durationMs*i/120,p=sampleTimeline(tl,ms);player.seek(ms);for(const[j,v]of Object.entries(p.joints)){const l=tl.limitsRad[j]!;if(!Number.isFinite(v)||v<l.min||v>l.max||Math.abs(observed[j]!-v)>=2e-5)throw Error(id+'/'+action+'/'+j+'@'+ms);}}
  expect(buildTimeline(c,action,17)).toEqual(tl);
  }finally{player.stop();}
 }}expect(actions).toBe(169);
});
it('old overshoot is a failing control; removing late clamping reproduces it, including projected asymmetric limits',()=>{
 const c=compileBodyCard(fixture('biped-bird')),tl=buildTimeline(c,'victory',17);
 expect(tl.secondary.some(s=>s.keys.some(k=>k.value>tl.limitsRad[s.joint]!.max))).toBe(true);
 expect(boundedJoint(tl,'wingNearRoot',99)).toBe(tl.limitsRad.wingNearRoot!.max);
 const mirrored=buildTimeline({...c,projectionSigns:{wingNearRoot:-1}},'victory',17);
 expect(mirrored.limitsRad.wingNearRoot).toEqual({min:-c.bounds.limitsDeg.wingNearRoot!.max*Math.PI/180,max:-c.bounds.limitsDeg.wingNearRoot!.min*Math.PI/180});
 expect(()=>boundedJoint(tl,'foreign',0)).toThrow('invalid');expect(()=>boundedJoint(tl,'head',NaN)).toThrow('invalid');
});
it('empty weapons cannot fall through to an invented family bite',()=>{
 const c=compileBodyCard(fixture('fish'));expect(()=>buildTimeline({...c,weapons:[]},'melee',17)).toThrow('no admitted');
});
it('new physical clips require the exact contact parts and settle after anticipation and strike',()=>{
 for(const a of ANATOMY_ATTACKS.filter(a=>['kick','body'].includes(a.verb)||a.family==='fish'&&a.verb==='tail')){
  const c={...compileBodyCard(fixture(a.family)),realm:a.medium[0]==='water'?'aquatic' as const:'land' as const};
  const d={recordHash:c.recipeHash!,source:'synthetic capability control',weapons:[a.weapon]},p=compileAnatomyAttack(c,a.medium[0]!,0,a.verb,d);
  expect(p.timeline.tracks[a.contactJoint]!.some(k=>Math.abs(k.value)>0)).toBe(true);
  const rest=sampleTimeline(p.timeline,p.timeline.durationMs);expect(Object.values(rest.joints).every(v=>Math.abs(v)<1e-8)).toBe(true);
  expect(()=>compileAnatomyAttack({...c,parts:c.parts.filter(j=>j.joint!==a.contactJoint)},a.medium[0]!,0,a.verb,d)).toThrow('no admitted');
 }
});
it('explicitly absent jaws, wings, ears, tails and stings agree between motion and rig intake',()=>{
 const cases:[string,string[]][]=[['quadruped',['external-ears','tail']],['insect',['mandible','wings']],['fish',['jaw','caudal']],['arachnid',['sting','chelicerae']],['biped-bird',['wings','beak']],['primate',['tail']]];
 for(const[id,absent]of cases){const raw=fixture(id),base=resolveTemplate(id);if(isMotionFallback(base))throw Error('fixture');
  const anatomy={schema:'cf.anatomy-presence/v1' as const,absent},t=resolveAnatomyInventory(base,anatomy);raw.anatomy=anatomy;raw.landmarks=Object.fromEntries(Object.entries(raw.landmarks).filter(([j])=>t.joints.includes(j)));raw.clipSetId=t.clipSetId;
  const card=compileBodyCard(raw),contract=familyContractForRecord(raw);expect(contract.joints).toEqual(t.joints);expect((checkFamilyGeometry(raw)as{inside:boolean}).inside).toBe(true);
  for(const action of Object.keys(actionsFor(id)!)){const tl=buildTimeline(card,action,17);expect(Object.keys(tl.tracks).sort()).toEqual([...t.joints].sort());for(const fraction of[0,.25,.5,.75,1])expect(Object.keys(sampleTimeline(tl,tl.durationMs*fraction).joints).sort()).toEqual([...t.joints].sort());}
  const broken=structuredClone(raw);delete broken.landmarks[(t.bodyAxis??['pelvis','chest'])[0]];expect(()=>compileBodyCard(broken)).toThrow('landmark');
  raw.anatomy={schema:'cf.anatomy-presence/v1',absent:['body']};expect(()=>compileBodyCard(raw)).toThrow('mandatory');
 }
});

it('broad marine, crustacean and sessile labels cannot borrow a different anatomical inventory',()=>{
 for(const [family,template]of[['marine','fish'],['crust','arachnid'],['sessile','radial']]){expect(templateIdForFamily(family!)).toBeNull();expect(()=>compileBodyCard({...fixture(template!),family})).toThrow('routes to no motion');}
 expect(templateIdForFamily('fish')).toBe('fish');expect(templateIdForFamily('arachnid')).toBe('arachnid');
});
