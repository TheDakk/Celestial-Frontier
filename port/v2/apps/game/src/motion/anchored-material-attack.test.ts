/** D41 anchored material classes: real frozen cards, transcript selection and D31 delivery.
 * CPU regression only. Deep source-owner HOLD remains; this is never source/native admission. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {expect,it} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {castAttackOf,CAST_ATTACK_NOTE} from './cast-attack.js';
import {templateMelees} from './family-actions.js';
import {buildTimeline,resolveActionId,sampleTimeline} from './timeline.js';
import {compileAnatomyAttack} from '../anatomy-attacks.js';
import {turnPlanInputFromTranscriptEvent} from '../battle2/stage.js';
import {buildTurnPlan} from '../battle2/choreography.js';
const root=new URL('../../../../../../',import.meta.url);
const fixtureRoot='audits/C475_DECISIONS_20261019/w1-keyer/radial-materials-r01/fits/';
const cases=[
 {name:'Sea Anemone',fit:'sea-anemone-r04',family:'anchored-soft-polyp',emitter:'oral',recordSha:'bec030559086e7088726bd3812af64dfb74d058a26a20344d19ae14642b321d2'},
 {name:'Deep-Water Coral',fit:'deep-water-coral-r02',family:'anchored-skeleton-soft-polyps',emitter:null,recordSha:'867025a80b7320dfaaf1696805fda5ed69bd8ee419279d27ce9f289217b5705c'},
] as const;
const readRecord=(row:typeof cases[number])=>{
 const bytes=fs.readFileSync(new URL(fixtureRoot+row.fit+'/record.json',root));
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(row.recordSha);
 return JSON.parse(bytes.toString('utf8'));
};
for(const row of cases){
 it(row.name+' compiles the real sting card without inventing physical melee',()=>{
  const record=readRecord(row),card=compileBodyCard(record,record.genome);
  expect(card.template.id).toBe(row.family);
  expect(card.weapons).toEqual(['sting']);
  expect(templateMelees(card.template.id)).toEqual([]);
  expect(()=>resolveActionId(card,'melee')).toThrow(/no admitted/);
  expect(()=>compileAnatomyAttack(card,'water',0)).toThrow(/species\/template mismatch|no admitted/);
  expect(castAttackOf(card)).toMatchObject({family:row.family,emitter:row.emitter,anchored:true});
 });
 it(row.name+' actual transcript fallback selects at-stand cast and preserves combat result',()=>{
  const record=readRecord(row),card=compileBodyCard(record,record.genome);
  let observedPhysicalRefusals=0;
  // Deliberately exercise the same physical-selector fallback used by stage; do not
  // inject a preselected cast or call the cast pulse directly to prove selection.
  const context:any={
   A:{side:'A',name:row.name,card,mass:card.massClass.multiplier,theme:'wild',seed:1},
   B:{side:'B',name:'Wolf',card:null,mass:1,theme:'tide',seed:2},
   arena:{groundLineY:.8,stands:{left:{x:.24,y:.8},right:{x:.76,y:.8}}},
   seed:593405465,anchorsForTheme:()=>null,readyMs:800,commandMs:300,
   attackFor:()=>{try{const a=compileAnatomyAttack(card,'water',0);return{verb:a.attack.verb,timeline:a.timeline,contactMs:a.contactMs,contactJoint:a.attack.contactJoint};}catch{observedPhysicalRefusals++;return null;}},
  };
  const adapted=turnPlanInputFromTranscriptEvent({side:'A',an:row.name,dn:'Wolf',dmg:9,crit:false,hpA:30,hpB:12},context,0);
  expect(adapted.kind).toBe('turn');if(adapted.kind!=='turn')throw Error('Expected real transcript turn');
  expect(observedPhysicalRefusals).toBe(1);
  expect(adapted.input.delivery).toBe('melee');expect(adapted.input.attack).toBeNull();
  const plan=buildTurnPlan(adapted.input);
  expect(plan.delivery).toBe('cast');expect(plan.runUp).toBe(0);
  expect(plan.outcome).toBe('hit');expect(plan.number.text).toBe('9');
  expect(plan.clips.attacker.action.source).toBe('timeline');
  if(plan.clips.attacker.action.source!=='timeline')throw Error('Expected real cast timeline');
  expect(plan.clips.attacker.action.timeline.actionId).toBe('cast');
  expect(plan.clips.attacker.action.timeline.notes).toContain(CAST_ATTACK_NOTE);
 });
 it(row.name+' cast fixes every base and moves every observed soft crown field, with both outcome controls',()=>{
  const record=readRecord(row),card=compileBodyCard(record,record.genome),timeline=buildTimeline(card,'cast',record.identity.seed);
  const mixed=row.family==='anchored-skeleton-soft-polyps';
  const count=mixed?record.anatomy.appendages.polypFields:0;
  const fixed=mixed?['root','skeleton',...Array.from({length:count},(_,i)=>'polyp'+i+'Base')]:['root','base'];
  const soft=mixed?Array.from({length:count},(_,i)=>'polyp'+i+'Tip'):['column','oral','crownFar','crownLeft','crownRight','crownNear'];
  if(mixed){expect(count).toBe(20);expect(soft).toHaveLength(20);}
  expect(timeline.notes).toContain(CAST_ATTACK_NOTE);expect(timeline.clamped).toEqual([]);
  const samples=Array.from({length:121},(_,i)=>sampleTimeline(timeline,timeline.durationMs*i/120));
  const check=(poses:typeof samples)=>{
   for(const pose of poses){expect(pose.root.dx).toBe(0);expect(pose.root.dy).toBe(0);for(const j of fixed)expect(pose.joints[j]??0,j+' must stay fixed').toBe(0);}
   for(const j of soft)expect(Math.max(...poses.map(p=>Math.abs(p.joints[j]??0))),j+' must move').toBeGreaterThan(1e-6);
  };
  check(samples);
  // A zero/all-rigid fallback must fail the SAME outcome observer.
  const frozen=samples.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,soft.includes(j)?0:v]))}));
  expect(()=>check(frozen)).toThrow();
  // An otherwise moving crown must also fail if the fixed skeleton/pedal rotates.
  const displaced=samples.map((p,i)=>i===60?{...p,joints:{...p.joints,[fixed[1]!]:.05}}:p);
  expect(()=>check(displaced)).toThrow();
 });
}
it('new family selection remains scoped and missing observed oral uses painted body centre',()=>{
 const record=readRecord(cases[0]),card=compileBodyCard(record,record.genome);
 expect(castAttackOf({...card,template:{...card.template,id:'radial'}})).toBeNull();
 expect(castAttackOf({...card,parts:card.parts.filter(p=>p.joint!=='oral')})).toMatchObject({emitter:null,anchored:true});
});
