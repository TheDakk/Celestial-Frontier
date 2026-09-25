import {it,expect} from 'vitest';
import {_EARTH_NAMES} from '@cf/domain-descriptors';
import {EARTH_FAUNA_PROFILES,auditEarthFaunaProfiles,earthFaunaProfile} from './earth-fauna-profiles.js';
import {resolvePhysicalHabitat} from './battle-habitat.js';
import {compileBodyCard} from './motion/body-card.js';
import {attackRepertoire} from './anatomy-attacks.js';
import {observeQuadrupedWeapons} from '../../../packages/art/src/quadruped-anatomy.js';
import fs from 'node:fs';
import {SPECIALIZED_TEMPLATES} from '../../../tools/creature-animation/specialized-templates.mjs';
import {familyContractForRecord} from '../../../tools/creature-animation/family-contracts.mjs';
const fixtures=JSON.parse(fs.readFileSync(new URL('../../../tools/creature-animation/test-fixtures/family-records.json',import.meta.url),'utf8')).records;
// Synthetic geometry exercises routing only; it supplies no painted admission.
const specialty=(id:string)=>{
 const t=familyContractForRecord({template:{id}});
 return {kind:id,identity:{speciesVisualKey:'synthetic/'+id,seed:51,ownerId:'contract-control',earthName:null},template:{id,version:1},
  geometry:{cutoutAssetHash:'synthetic',width:1024,height:1024,groundLineY:.85,depthLayers:[{id:'far',order:0},{id:'near',order:1}]},
  landmarks:Object.fromEntries(t.joints.map((j,i)=>[j,[.15+(i%8)*.085,.15+Math.floor(i/8)*.085]])),materials:{surface:'smooth skin'}};
};
const card=(family:string,name:string)=>{const source=fixtures[family]??(family==='brachyuran'?JSON.parse(fs.readFileSync(new URL('../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/record.json',import.meta.url),'utf8')):specialty(family));return compileBodyCard({...source,identity:{...source.identity,earthName:name},recipeHash:'synthetic-control'});};
it('exactly covers the live fauna catalogue; missing, obsolete and duplicated names fail independently',()=>{
 const names=_EARTH_NAMES.fauna;
 expect(auditEarthFaunaProfiles(names)).toMatchObject({status:'PASS',species:631,missing:[],obsolete:[],duplicates:[]});
 expect(auditEarthFaunaProfiles([...names,'Invented animal']).missing).toEqual(['Invented animal']);
 expect(auditEarthFaunaProfiles(names.slice(1)).obsolete).toEqual([names[0]]);
 expect(auditEarthFaunaProfiles([...names,names[0]!]).duplicates).toEqual([names[0]]);
 expect(earthFaunaProfile('__proto__')).toBeUndefined();
});
it('every named species has explicit deterministic habitat intent; candidate wiring grants no weapons',()=>{
 for(const p of EARTH_FAUNA_PROFILES)for(const name of p.names){
  const r={template:{id:p.candidateTemplates[0]??'unsupported'},identity:{earthName:name}};
  const h=resolvePhysicalHabitat(r,{habitat:0,loco:0});expect(h.allowed).toEqual(p.media);expect(h).toEqual(resolvePhysicalHabitat(r));
 }
 expect(earthFaunaProfile('Clam')?.candidateTemplates).toEqual(['bivalve']);
 expect(attackRepertoire(card('bivalve','Clam'),'water')).toMatchObject({status:'UNSUPPORTED',attacks:[]});
 expect(earthFaunaProfile('Butterfly')?.intendedMoves).not.toContain('mandible');
 expect(earthFaunaProfile('Coconut Crab')?.media).toEqual(['ground']);
});
it('no hoof claws, whale walk, penguin flight, spider tail sting, or filter-shark predatory bite',()=>{
 const horse=card('quadruped','Horse');expect(horse.weapons).not.toContain('claw');
 expect(attackRepertoire(horse,'ground').attacks.map(a=>a.verb)).not.toContain('claw');
 const whale=card('fish','Blue Whale');expect(whale.realm).toBe('aquatic');expect(whale.locomotion.gait).toBe('swim');expect(attackRepertoire(whale,'water').attacks.map(a=>a.verb)).toEqual(['body','tail']);
 expect(()=>attackRepertoire(card('biped-bird','Penguin'),'air')).toThrow('medium');
 expect(attackRepertoire(card('arachnid','Spider'),'ground').attacks.map(a=>a.verb)).toEqual(['bite']);
 expect(attackRepertoire(card('fish','Whale Shark'),'water').attacks.map(a=>a.verb)).toEqual(['body']);
 expect(()=>attackRepertoire(card('quadruped','Trout'),'ground')).toThrow('medium');
 expect(()=>attackRepertoire(card('quadruped','Butterfly'),'air')).toThrow('mismatch');
});
it('conditional horns require a matching record declaration; species name does not grant them',()=>{
 const c=card('quadruped','Rhinoceros');expect(attackRepertoire(c,'ground').attacks.map(a=>a.verb)).not.toContain('gore');
 expect(attackRepertoire(c,'ground',{recordHash:'stale',source:'observation',weapons:['gore']}).attacks.map(a=>a.verb)).not.toContain('gore');
});
it('drawn foot branch observes claws only where painted; missing joints and hoof/flipper are negative controls',()=>{
 const points={jaw:[.5,.2],foreNearPaw:[.6,.8]} as const;
 for(const foot of ['paw','plantigrade','claw'])expect(observeQuadrupedWeapons(foot,points).map(w=>w.kind)).toEqual(['bite','claw']);
 for(const foot of ['pad','flipper'])expect(observeQuadrupedWeapons(foot,points).map(w=>w.kind)).toEqual(['bite']);
 for(const foot of ['hoof','cloven'])expect(observeQuadrupedWeapons(foot,points).map(w=>w.kind)).toEqual(['bite','kick']);
 expect(observeQuadrupedWeapons('claw',{})).toEqual([]);
});
it('all catalogue intent rows filter synthetic template cards without borrowing another species weapons',()=>{
 // Deliberately synthetic geometry: this proves routing, not any of the 631 painted fits.
 for(const p of EARTH_FAUNA_PROFILES)for(const name of p.names)for(const template of p.candidateTemplates){
  const c=card(template,name),medium=c.realm==='aerial'?'air':c.realm==='aquatic'?'water':'ground';
  const r=attackRepertoire(c,medium);
  for(const a of r.attacks){expect(p.intendedMoves).toContain(a.verb);expect(a.family).toBe(template);expect(a.joints.every(j=>c.parts.some(part=>part.joint===j))).toBe(true);}
 }
});
it('native painter-emitted weapon receipts are record-bound and preserve ordinary paint',()=>{
 const base=new URL('../../../../../audits/FULL_SPECIES_ATTACKS_20260916/painter-01/',import.meta.url);
 const report=JSON.parse(fs.readFileSync(new URL('report.json',base),'utf8'));expect(report.status).toBe('PASS');
 for(const id of ['procedural-1','procedural-2','procedural-3']){
  const r=JSON.parse(fs.readFileSync(new URL(id+'/record.json',base),'utf8')),d=JSON.parse(fs.readFileSync(new URL(id+'/weapons.json',base),'utf8'));
  expect(report.rows.find((row:{id:string})=>row.id===id).normalPainterChangedChannels).toBe(0);
  expect(d.recordHash).toBe(r.recipeHash);expect(d.weapons).toEqual(r.weapons.map((w:{kind:string})=>w.kind));
  const c=compileBodyCard(r,r.genome);expect(attackRepertoire(c,'ground',d).status).toBe('READY');
  expect(()=>attackRepertoire(c,'ground',{...d,recordHash:'wrong'})).toThrow('declaration');
 }
});

it('wires exactly the 53 previously empty identities without claiming fits or changing habitats/weapons',()=>{
 const before=JSON.parse(fs.readFileSync(new URL('../../../../../audits/MOTION_FOLLOWUP_20260924/item7-before.json',import.meta.url),'utf8')) as {name:string;media:string[];intendedMoves:string[]}[];
 expect(before).toHaveLength(53);expect(new Set(before.map(r=>r.name)).size).toBe(53);
 expect(EARTH_FAUNA_PROFILES.filter(p=>p.needsObservedFit).flatMap(p=>p.names).sort()).toEqual(before.map(r=>r.name).sort());
 expect(EARTH_FAUNA_PROFILES.filter(p=>!p.candidateTemplates.length)).toEqual([]);
 for(const row of before){const p=earthFaunaProfile(row.name)!;expect(p.needsObservedFit).toBe(true);expect(p.media).toEqual(row.media);expect(p.intendedMoves).toEqual(row.intendedMoves);expect(p.candidateTemplates).toHaveLength(1);expect(SPECIALIZED_TEMPLATES[p.candidateTemplates[0]! as keyof typeof SPECIALIZED_TEMPLATES]).toBeDefined();}
 expect(earthFaunaProfile('Sea Squirt')!.candidateTemplates).toEqual(['sessile-filter']);
 expect(earthFaunaProfile('Salp')!.candidateTemplates).toEqual(['colonial-filter']);
 expect(earthFaunaProfile('Fiddler Crab')!.candidateTemplates).toEqual(['brachyuran']);
 expect(earthFaunaProfile('Horseshoe Crab')!.intendedMoves).not.toContain('sting');
 expect(earthFaunaProfile('Fly Larvae')!.candidateTemplates).toEqual(['larva']);
 expect(()=>attackRepertoire(card('arachnid','Fiddler Crab'),'ground')).toThrow('mismatch');
 expect(()=>attackRepertoire(card('fish','Clam'),'water')).toThrow('mismatch');
 const broken=specialty('lobopod');delete broken.landmarks.leg0NearFoot;expect(()=>compileBodyCard({...broken,identity:{...broken.identity,earthName:'Tardigrade'}})).toThrow('landmark');
});
