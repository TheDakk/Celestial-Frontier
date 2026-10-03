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
import {createSkeletonPoseProgram} from '../../../../tools/creature-animation/skeleton-pose.mjs';
const root=new URL('../../../../../../',import.meta.url),fit='audits/C196_SPECIALIZED_REFERENCES_20261003/01-prawn-contours/fit01',read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const record=read(fit+'/record.json'),baseline=read('audits/C198_PRAWN_ATTACK_20261003/baseline.json');
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
 const c=card();for(const [id,tl]of Object.entries(baseline.prior))expect(JSON.stringify(buildTimeline(c,id,c.identity.seed))).toBe(JSON.stringify(tl));
 for(const row of baseline.unchanged){const c=compileBodyCard(row.record,row.record.genome);for(const[id,tl]of Object.entries(row.timelines))expect(JSON.stringify(buildTimeline(c,id,c.identity.seed))).toBe(JSON.stringify(tl));}
 const idle=actionsFor(c.template.id)!.idle!;expect(smallCrustaceanAttackAction(c,idle)).toBe(idle);
 const melee=actionsFor(c.template.id)!['melee:claw']!;expect(smallCrustaceanAttackAction({...c,template:{...c.template,id:'quadruped'}},melee)).toBe(melee);
});
it('actual battle turn remains physical melee at the observed tip, with transcript outcome and recovery intact',()=>{
 const c=card(),a=compileAnatomyAttack(c,'water',0),p=buildTurnPlan({seed:7,attacker:{side:'left',mass:c.massClass.multiplier,card:c,seed:c.identity.seed,label:'Prawn'},target:{side:'right',mass:1,card:null,seed:2,label:'target'},delivery:'melee',theme:'wild',outcome:'hit',damage:9,effect:null,arena:{groundLineY:.78,stands:{left:{x:.2,y:.78},right:{x:.8,y:.78}}},readyMs:600,commandMs:300,attack:{verb:a.attack.verb,timeline:a.timeline,contactMs:a.contactMs,contactJoint:a.contactJoint}});
 expect(p.delivery).toBe('melee');expect(p.castAttack).toBeUndefined();expect(p.number.text).toBe('9');expect(p.outcome).toBe('hit');expect(p.clips.attacker.action.source).toBe('timeline');
 const end=sampleClip(p.clips.attacker.action,a.timeline.durationMs);expect(Object.values(end).every(k=>k.rotation===0&&(k.dx??0)===0&&(k.dy??0)===0)).toBe(true);expect(p.beats.impactAt-p.beats.actionStart).toBe(a.contactMs);
});
