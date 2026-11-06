import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {expect,it} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {actionsFor} from './family-actions.js';
import {buildTimeline,sampleTimeline} from './timeline.js';
import {smallCrustaceanAttackAction} from './small-crustacean-attack.js';
import {castAttackOf,CAST_ATTACK_NOTE} from './cast-attack.js';
import {attackRepertoire,compileAnatomyAttack} from '../anatomy-attacks.js';
import {buildTurnPlan,sampleClip} from '../battle2/choreography.js';
import {familyContractForRecord} from '../../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../../tools/creature-animation/skeleton-pose.mjs';import {archPins} from '../arch-pin.fixtures.js';
/* x64 pins beside the original arm64 captures (arch-pin.fixtures.ts) */
const PINS=archPins(new URL('./small-crustacean-attack.arch-pins.json',import.meta.url));

const root=new URL('../../../../../../',import.meta.url),fit='audits/C196_SPECIALIZED_REFERENCES_20261003/01-prawn-contours/fit01',read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const record=read(fit+'/record.json'),baseline=read('audits/C198_PRAWN_ATTACK_20261003/baseline.json');
/* C266 D33 landed Mussel hashes (valve pair mirrored to open; cast keeps its captured 86871751). */
const BIVALVE_OPENING_HASH:Record<string,string>={"idle":"032a12d8","alert":"610bbf4c","approach:settle":"cba93af8","approach:jet":"2500f13a","hit":"cc3fdfd6","dodge":"d2b36423","faint":"2cbc7d3f","victory":"86e85230","tame":"b330cd49","feed":"d3300852"};
const card=()=>compileBodyCard(record,record.genome),point=(m:readonly number[],p:readonly number[])=>[m[0]!*p[0]!+m[2]!*p[1]!+m[4]!,m[1]!*p[0]!+m[3]!*p[1]!+m[5]!];
it('reproduces C198 weapons[] refusal, then admits the unchanged real Prawn through both selection paths',()=>{
 const c=card();expect(createHash('sha256').update(fs.readFileSync(new URL(fit+'/record.json',root))).digest('hex')).toBe(baseline.recordSha256);
 expect(baseline.failures[0].reason).toBe('motion: no admitted crustacean-small melee for weapons []');
 expect(()=>buildTimeline({...c,weapons:[]},'melee',c.identity.seed)).toThrow('no admitted crustacean-small melee for weapons []');
 const r=attackRepertoire(c,'water');expect(r.attacks.map(a=>a.verb)).toEqual(['claw']);expect(r.attacks[0]?.label).toBe('Foreleg tip strike');
 const p=compileAnatomyAttack(c,'water',0);expect(p.contactJoint).toBe('leg0NearFoot');expect(p.contactPhase).toBe('strike');expect(p.timeline).toEqual(buildTimeline(c,'melee',c.identity.seed));
 expect(c.weapons).toEqual(['claw']);expect(castAttackOf(c)).toBeNull();expect(p.timeline.notes).not.toContain(CAST_ATTACK_NOTE);
 expect(()=>compileAnatomyAttack(c,'water',0,'pinch')).toThrow('no admitted');
});
it('a missing chain, wrong medium, unrelated crustacean or absent/stale procedural observation grants no attack',()=>{
 const c=card();for(const joint of ['head','leg0NearRoot','leg0NearKnee','leg0NearFoot','leg0FarRoot','leg0FarKnee','leg0FarFoot']){
  const broken={...c,parts:c.parts.filter(p=>p.joint!==joint)};expect(attackRepertoire(broken,'water').attacks).toEqual([]);expect(()=>buildTimeline(broken,'melee:claw',1)).toThrow('observed');
 }
 expect(()=>compileAnatomyAttack(c,'ground',0)).toThrow('medium');
 expect(()=>buildTimeline({...c,landmarks:{...c.landmarks,head:c.landmarks.thorax!}},'melee:claw',1)).toThrow('forward axis');
 expect(()=>buildTimeline({...c,landmarks:{...c.landmarks,leg0NearFoot:c.landmarks.leg0NearKnee!}},'melee:claw',1)).toThrow('segments');
 for(const earthName of ['Krill','Copepod','Water Flea','Giant Isopod']){const x=compileBodyCard({...record,identity:{...record.identity,earthName}});expect(x.weapons).toEqual([]);expect(()=>buildTimeline(x,'melee',1)).toThrow('no admitted crustacean-small melee for weapons []');expect(attackRepertoire(x,'water').attacks).toEqual([]);}
 const procedural={...c,identity:{...c.identity,earthName:null}};expect(()=>attackRepertoire(procedural,'water')).toThrow('declaration');expect(()=>attackRepertoire(procedural,'water',{recordHash:'stale',source:'control',weapons:['claw']})).toThrow('declaration');
 expect(attackRepertoire(procedural,'water',{recordHash:c.recipeHash!,source:'exact observed foreleg controls',weapons:['claw']}).attacks).toHaveLength(1);
});
it('actual source and mirrored source gather, extend tips, return exactly, keep other chains still and never clamp',()=>{
 for(const mirror of [false,true]){
  const r={...record,landmarks:Object.fromEntries(Object.entries(record.landmarks as Record<string,number[]>).map(([j,p])=>[j,[mirror?1-p[0]!:p[0],p[1]]]))},c=compileBodyCard(r,r.genome),plan=compileAnatomyAttack(c,'water',0),tl=plan.timeline,program=createSkeletonPoseProgram(familyContractForRecord(r),r.landmarks),direction=mirror?-1:1;
  const posed=(ms:number)=>{const s=sampleTimeline(tl,ms);return program.evaluate(Object.fromEntries(Object.entries(s.joints).map(([j,rotation])=>[j,{rotation}])));};
  const load=posed(tl.phases[0]![1]),strike=posed(plan.contactMs),rest=posed(tl.durationMs);
  for(const side of ['Near','Far']){const j='leg0'+side+'Foot',p=r.landmarks[j]!;expect((point(strike[j]!,p)[0]!-p[0]!)*direction).toBeGreaterThan(.001);expect((point(load[j]!,p)[0]!-p[0]!)*direction).toBeLessThan(-.001);expect(point(rest[j]!,p)).toEqual(p);}
  for(let i=0;i<=240;i++){const sample=sampleTimeline(tl,tl.durationMs*i/240),m=posed(tl.durationMs*i/240);expect(sample.root).toEqual({dx:0,dy:0,rotation:0});for(const j of Object.keys(r.landmarks).filter(j=>!/^leg0(?:Near|Far)(?:Knee|Foot)$/.test(j)))expect(point(m[j]!,r.landmarks[j]!)).toEqual(r.landmarks[j]);for(const[j,angle]of Object.entries(sample.joints)){const limit=tl.limitsRad[j];if(limit){expect(angle).toBeGreaterThanOrEqual(limit.min-1e-12);expect(angle).toBeLessThanOrEqual(limit.max+1e-12);}}}
  expect(tl.clamped).toEqual([]);
  // Deliberately fixed zero curve does not deliver the measured tip extension.
  const requireExtension=(m:readonly number[])=>expect((point(m,r.landmarks.leg0NearFoot!)[0]!-r.landmarks.leg0NearFoot![0]!)*direction).toBeGreaterThan(.001);requireExtension(strike.leg0NearFoot!);expect(()=>requireExtension(program.evaluate({}).leg0NearFoot!)).toThrow();
 }
});
it('unchanged Prawn non-melee curves and all prior-family outcomes remain byte-identical',()=>{
 const c=card();for(const [id,tl]of Object.entries(baseline.prior)){const got=JSON.stringify(buildTimeline(c,id,c.identity.seed));PINS.check('prior/'+id,got,()=>expect(got).toBe(JSON.stringify(tl)));}
 baseline.unchanged.forEach((row:any,ri:number)=>{const c=compileBodyCard(row.record,row.record.genome);for(const[id,tl]of Object.entries(row.timelines) as [string,any][]){
  const after=buildTimeline(c,id,c.identity.seed);
  PINS.check(`unchanged${ri}/${id}`,after,()=>{
  if(c.template.id==='insect'&&['hit','tame'].includes(id)){
   /* C234 3ae4a8380 intentionally quarters canonical source-step/reaction excursion. Independently transform only the captured affected channels; preserve every other byte. */
   const expected=structuredClone(tl) as typeof after;
   const tracks=Object.fromEntries(Object.entries(expected.tracks).map(([j,keys])=>[j,keys.map(k=>({...k,value:k.value*(/^(root|thorax|leg)/.test(j)?.25:1)}))]));
   const updated={...expected,tracks,root:{dx:expected.root.dx.map(k=>({...k,value:k.value*.25})),dy:expected.root.dy.map(k=>({...k,value:k.value*.25}))},notes:[...expected.notes,'insect:coherent-short-reaction-v1'],hash:id==='hit'?'b27563dd':'a932ccb8'};
   expect(after).toEqual(updated);expect(after.root).not.toEqual(expected.root);
  }else if(c.template.id==='serpent'&&id==='victory'){
   /* C262 landing is unchanged. D39 (Dakk2026-10-19) approves ONLY this named captured serpent/victory row's head/jaw re-bind:
     4de0b804 -> 47620037. Independently cap the captured head/jaw key values at12/4deg. Every other track/key property, root lift,
     secondary, limits, phase and timing stays identical to the C262 landed expectation; no baseline file or other row is re-bound. */
   expect(row.record.identity.speciesVisualKey).toBe('synthetic:serpent');
   const expected=structuredClone(tl) as typeof after,landed:Record<string,readonly number[]>={seg0:[0,-0.3895944279244644,-0.4131996359313968,0],seg2:[0,0.3895944279244644,0.4131996359313968,0]};
   const tracks=Object.fromEntries(Object.entries(expected.tracks).map(([j,keys])=>[j,/^seg\d$/.test(j)?keys.map((k,i)=>({...k,value:landed[j]?.[i]??0})):(j==='head'||j==='jaw')?keys.map(k=>{const cap=(j==='head'?12:4)*(Math.PI/180);return {...k,value:Math.max(-cap,Math.min(cap,k.value))};}):keys]));
   expect(after).toEqual({...expected,tracks,notes:[...expected.notes,'serpent:landing-victory-v1'],hash:'47620037'});expect(after.tracks.seg1).not.toEqual(expected.tracks.seg1);
  }else if(c.template.id==='bivalve'&&id!=='cast'){
   /* C266 D33 (Dakk 2026-10-17, bivalve-valve-opening-sign.patch): this Mussel's landmarks say {valveFar:+,valveNear:-} CLOSES the shell,
      so every non-cast pose mirrors ONLY the valve pair to open the gape. Every other channel, limit, phase and timing keeps its byte. */
   const expected=structuredClone(tl) as typeof after;
   const tracks=Object.fromEntries(Object.entries(expected.tracks).map(([j,keys])=>[j,j==='valveFar'||j==='valveNear'?keys.map(k=>({...k,value:k.value===0?k.value:-k.value})):keys]));
   expect(after).toEqual({...expected,tracks,notes:[...expected.notes,'bivalve:landmark-opening-sign-v1'],hash:BIVALVE_OPENING_HASH[id]});
   if(expected.tracks.valveFar!.some(k=>k.value!==0))expect(after.tracks.valveFar).not.toEqual(expected.tracks.valveFar);
  }else expect(JSON.stringify(after)).toBe(JSON.stringify(tl));
  });
 }});
 const idle=actionsFor(c.template.id)!.idle!;expect(smallCrustaceanAttackAction(c,idle)).toBe(idle);
 const melee=actionsFor(c.template.id)!['melee:claw']!;expect(smallCrustaceanAttackAction({...c,template:{...c.template,id:'quadruped'}},melee)).toBe(melee);
});
it('actual battle turn remains physical melee at the observed tip, with transcript outcome and recovery intact',()=>{
 const c=card(),a=compileAnatomyAttack(c,'water',0),p=buildTurnPlan({seed:7,attacker:{side:'left',mass:c.massClass.multiplier,card:c,seed:c.identity.seed,label:'Prawn'},target:{side:'right',mass:1,card:null,seed:2,label:'target'},delivery:'melee',theme:'wild',outcome:'hit',damage:9,effect:null,arena:{groundLineY:.78,stands:{left:{x:.2,y:.78},right:{x:.8,y:.78}}},readyMs:600,commandMs:300,attack:{verb:a.attack.verb,timeline:a.timeline,contactMs:a.contactMs,contactJoint:a.contactJoint}});
 expect(p.delivery).toBe('melee');expect(p.castAttack).toBeUndefined();expect(p.number.text).toBe('9');expect(p.outcome).toBe('hit');expect(p.clips.attacker.action.source).toBe('timeline');
 const end=sampleClip(p.clips.attacker.action,a.timeline.durationMs);expect(Object.values(end).every(k=>k.rotation===0&&(k.dx??0)===0&&(k.dy??0)===0)).toBe(true);expect(p.beats.impactAt-p.beats.actionStart).toBe(a.contactMs);
});
