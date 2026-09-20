import {it,expect} from 'vitest';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {compileBodyCard,type BodyCard} from './motion/body-card.js';
import {ANATOMY_ATTACKS,attackRepertoire as rawRepertoire,compileAnatomyAttack as rawCompile,type WeaponDeclaration} from './anatomy-attacks.js';
const declaration=(c:BodyCard):WeaponDeclaration=>({recordHash:c.recipeHash!,source:'synthetic contract control, not painted species qualification',weapons:c.weapons});
const attackRepertoire=(c:BodyCard,m:Parameters<typeof rawRepertoire>[1])=>rawRepertoire(c,m,declaration(c));
const compileAnatomyAttack=(c:BodyCard,m:Parameters<typeof rawRepertoire>[1],ordinal:number,verb?:string)=>rawCompile(c,m,ordinal,verb,declaration(c));
import {templateMelees} from './motion/family-actions.js';
import {sampleTimeline} from './motion/timeline.js';
const fixtures=JSON.parse(fs.readFileSync(new URL('../../../tools/creature-animation/test-fixtures/family-records.json',import.meta.url),'utf8')).records;
const read=(name:string)=>JSON.parse(fs.readFileSync(new URL('../../../../../audits/'+name,import.meta.url),'utf8'));
const card=(family:string)=>{const source=fixtures[family]??(family==='brachyuran'?read('ANATOMY_COMPLETION_20260917/crab-fits-03/crab/record.json'):undefined);const r={...source,...(family==='brachyuran'?{habitat:{realm:'land',source:'synthetic ground control'}}:{}),identity:{...source.identity,earthName:null},recipeHash:createHash('sha256').update(JSON.stringify(source)).digest('hex')};return compileBodyCard(r);};
const medium=(c:BodyCard)=>c.realm==='aquatic'?'water' as const:c.realm==='aerial'||c.realm==='gas-giant'?'air' as const:'ground' as const;
it('every implemented family melee has an anatomy row, with plants explicitly unsupported',()=>{
 for(const family of Object.keys(fixtures)){
  expect(ANATOMY_ATTACKS.filter(a=>a.family===family).map(a=>a.verb).sort()).toEqual(templateMelees(family).sort());
  const c=card(family),r=attackRepertoire(c,medium(c));
  expect(r.status).toBe(family.startsWith('plant-')?'UNSUPPORTED':'READY');
  for(const a of r.attacks){const plan=compileAnatomyAttack(c,medium(c),0,a.verb);expect(plan.timeline.actionId).toBe('melee:'+a.verb);expect(plan.contactMs).toBeLessThan(plan.timeline.durationMs);for(let t=0;t<=plan.timeline.durationMs;t+=17)expect(Object.values(sampleTimeline(plan.timeline,t).joints).every(Number.isFinite)).toBe(true);}
 }
});
it('missing paw, beak and wing cannot acquire a claw/peck from a family name',()=>{
 for(const [family,joint,verb]of[['quadruped','foreNearPaw','claw'],['biped-bird','beak','peck'],['biped-bird','wingNearRoot','claw']]){
  const c=card(family!);const broken={...c,parts:c.parts.filter(p=>p.joint!==joint)};
  expect(attackRepertoire(broken,medium(c)).attacks.some(a=>a.verb===verb)).toBe(false);
  expect(()=>compileAnatomyAttack(broken,medium(c),0,verb)).toThrow('no admitted');
 }
});
it('aquatic and aerial motion stay in their medium; unknown Earth capability never uses generic bite/claw',()=>{
 const f=card('fish'),b=card('biped-bird');expect(()=>attackRepertoire(f,'ground')).toThrow('medium');expect(()=>attackRepertoire({...b,realm:'aerial'},'ground')).toThrow('medium');
 const q=card('quadruped');expect(()=>attackRepertoire({...q,identity:{...q.identity,earthName:'Unlisted animal'}},'ground')).toThrow('declaration');
 expect(()=>compileAnatomyAttack(q,'ground',0,'gore')).toThrow('no admitted');
});
it('same species and ordinal replay; repertoire can vary moves without changing damage or anatomy',()=>{
 const c=card('quadruped'),before=JSON.stringify(c),a=compileAnatomyAttack(c,'ground',0);expect(a).toEqual(compileAnatomyAttack(c,'ground',0));expect(compileAnatomyAttack(c,'ground',1).attack.verb).not.toBe(a.attack.verb);expect(JSON.stringify(c)).toBe(before);expect(()=>compileAnatomyAttack(c,'ground',NaN)).toThrow('ordinal');
});
it('actual painted observations admit only recorded weapons; contact uses authored pose, not 42% of settling duration',()=>{
 const declarations=read('ANATOMY_ATTACKS_20260916/weapon-declarations.json');for(const [id,dir]of [['rosette','rig-approved-05'],['broad','rig-broad-02'],['crystal','rig-crystalline-02']]){const r=read('PAINTED_VARIATION_MOTION_20260916/'+dir+'/record.json'),c=compileBodyCard(r,r.genome),d=declarations[id!];for(const verb of d.weapons){const p=rawCompile(c,'ground',0,verb,d);expect(p.attack.contactJoint).toBe(verb==='claw'?'foreNearPaw':'jaw');expect(p.contactMs).not.toBeCloseTo(p.timeline.durationMs*.42);expect(p.timeline.tracks[p.attack.contactJoint]).toBeDefined();}expect(()=>rawCompile(c,'ground',0,'gore',d)).toThrow('no admitted');if(id==='crystal')expect(()=>rawCompile(c,'ground',0,'claw',d)).toThrow('no admitted');}
});

it('generic family weapons are not proof of painted claws; absent/stale declarations refuse',()=>{const c=card('quadruped');expect(()=>rawRepertoire(c,'ground')).toThrow('declaration');expect(()=>rawRepertoire(c,'ground',{...declaration(c),recordHash:'wrong'})).toThrow('declaration');const noClaw={...declaration(c),weapons:['bite'] as const};expect(rawRepertoire(c,'ground',noClaw).attacks.map(a=>a.verb)).toEqual(['bite']);});

it('all physical motion rows compile with explicit synthetic weapon declarations and required contact tracks',()=>{for(const a of ANATOMY_ATTACKS){const source=card(a.family),m=a.medium.includes(medium(source))?medium(source):a.medium[0]!,c={...source,realm:m==='water'?'aquatic' as const:m==='air'?'aerial' as const:'land' as const},p=rawCompile(c,m,0,a.verb,{...declaration(c),weapons:[a.weapon]});expect(p.timeline.tracks[a.contactJoint]).toBeDefined();expect(p.repertoire.attacks.some(x=>x.verb===a.verb)).toBe(true);}});

it('actual bird talon strike uses airborne body and feet; fish bite stays aquatic',()=>{const bird=compileBodyCard(read('HABITAT_BATTLE_20260916/airbird-05/record.json'));const p=rawCompile(bird,'air',0,'claw');expect(p.attack.contactJoint).toBe('legNearFoot');expect(p.timeline.tracks.wingNearRoot!.some(k=>k.value!==0)).toBe(true);expect(p.timeline.tracks.legNearKnee!.some(k=>k.value!==0)).toBe(true);const fishRecord=read('FAMILY_REAL_CREATURE_REVIEW_20260916/fish-04/record.json'),fish=compileBodyCard(fishRecord),d={recordHash:fish.recipeHash!,source:'authored fish jaw observation',weapons:['bite'] as const};expect(rawCompile(fish,'water',0,'bite',d).attack.contactJoint).toBe('jaw');expect(()=>rawCompile(fish,'air',0,'bite',d)).toThrow('medium');});
