import fs from 'node:fs';import {it,expect} from 'vitest';
import {compileBodyCard} from './body-card.js';import {actionsFor} from './family-actions.js';import {buildTimeline,buildActionTimeline,type MotionTimeline} from './timeline.js';
import {sampleClip} from '../battle2/choreography.js';
import {createSkeletonPoseProgram} from '../../../../tools/creature-animation/skeleton-pose.mjs';
import {familyContractForRecord} from '../../../../tools/creature-animation/family-contracts.mjs';
import {transformPoint} from '../../../../tools/creature-animation/kinematics.js';
/* C262 axial foreground (Codex C367/C370) + C266 motion (eels): the serpent victory must REAR, not hang the trunk below the ground. The skeleton
 * is the parts rig's own (createSkeletonPoseProgram + transformPoint = PartsRig.jointPosition); the clip is the runtime's
 * (buildTimeline). Outcome, not code path: every committed serpent record, plus three negative controls per record. */
const root=new URL('../../../../../../',import.meta.url),read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const fixtures=read('port/v2/tools/creature-animation/test-fixtures/family-records.json').records;
const RECORDS=['audits/C243_ALLOUT_20261011/execution/batch06/round2/ai-finish/rebound-02/c243b06r2c1-19-boa/record.json',
 'audits/C243_ALLOUT_20261011/execution/batch06/round2/ai-finish/rebound-02/c243b06r2c1-22-mountain-viper/record.json',
 'audits/C243_ALLOUT_20261011/execution/batch06/ai-finish/rebound-02/c243b06r1c1-19-boa/record.json',
 'audits/C243_ALLOUT_20261011/execution/batch06/ai-finish/rebound-02/c243b06r1c1-22-mountain-viper/record.json',
 'audits/C243_ALLOUT_20261011/execution/batch06/ai-finish/rebound-02/c243b06r1c1-23-rattlesnake/record.json',
 'audits/C243_ALLOUT_20261011/execution/batch06/ai-finish/rebound-03/c243b06r1c2-24-snake/record.json',
 'audits/ART_BATTLE_FOCUS_20260925/21-racer/fit-01/record.json','audits/ART_BATTLE_FOCUS_20260925/27-eel/fit-01/record.json',
 'audits/ARCHETYPE_SPRINT_20260922/05-serpent/fit-01/record.json',
 // C266 motion: the two filmed eels (turn3-hit-idle-50 trunk hangs vertical and exits the frame) are the same serpent victory
 'audits/C243_ALLOUT_20261011/execution/batch02/round2/ai-finish/rebound-01/c243b02r2c2-12-gulper-eel/record.json',
 'audits/C243_ALLOUT_20261011/execution/batch02/round2/ai-finish/rebound-02/c243b02r2c2-21-moray-eel/record.json'];
const SEGS=Array.from({length:10},(_,k)=>'seg'+k),ENVELOPE={maxSinkBL:.02,maxPosteriorDriftBL:.02,minHeadRiseBL:.06};
const records=():[string,any][]=>[['fixture:serpent',{...structuredClone(fixtures.serpent),identity:{...fixtures.serpent.identity,earthName:null},recipeHash:'synthetic-control'}],...RECORDS.map(p=>[p,read(p)] as [string,any])];
function envelope(record:any,tl:MotionTimeline){
 const prog=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),BL=prog.bodyLength;
 const at=(pose:Parameters<typeof prog.evaluate>[0])=>{const m=prog.evaluate(pose);return Object.fromEntries(Object.entries(record.landmarks as Record<string,[number,number]>).map(([j,l])=>[j,transformPoint(m[j]!,{x:l[0],y:l[1]})]));};
 const rest=at({});let sink=-Infinity,drift=0,rise=-Infinity;
 for(let i=0;i<=120;i++){const p=at(sampleClip({source:'timeline',timeline:tl},tl.durationMs*i/120));
  for(const j of SEGS)sink=Math.max(sink,(p[j]!.y-rest[j]!.y)/BL);
  for(const j of SEGS.slice(5))drift=Math.max(drift,Math.abs(p[j]!.y-rest[j]!.y)/BL);
  rise=Math.max(rise,(rest.head!.y-p.head!.y)/BL);}
 return {sink,drift,rise,pass:sink<=ENVELOPE.maxSinkBL&&drift<=ENVELOPE.maxPosteriorDriftBL&&rise>=ENVELOPE.minHeadRiseBL};
}
const negateSegs=(tl:MotionTimeline):MotionTimeline=>({...tl,tracks:Object.fromEntries(Object.entries(tl.tracks).map(([j,k])=>[j,SEGS.includes(j)?k.map(x=>({...x,value:-x.value})):k]))});
it.each(records())('%s: the victory rears on a landed trunk; the authored, hovering and mirrored controls all fail',(_id,record)=>{
 const card=compileBodyCard(record,record.genome),authored=actionsFor('serpent',card.anatomy)!.victory!,tl=buildTimeline(card,'victory',5);
 const got=envelope(record,tl);
 expect(got,JSON.stringify(got)).toMatchObject({pass:true});
 expect(tl.notes).toContain('serpent:landing-victory-v1');expect(tl.clamped).toEqual([]);
 // control 1 (the defect): the raw authored family victory hangs the trunk ~0.9 body lengths below its rest line
 const raw=envelope(record,buildActionTimeline(card,authored,5));expect(raw.pass).toBe(false);expect(raw.sink).toBeGreaterThan(.5);
 // control 2 (hover): lifting the root without sloping the trunk back down floats the posterior body off its line
 const hover=envelope(record,buildActionTimeline(card,{...authored,poses:authored.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).filter(([j])=>!SEGS.includes(j)))}))},5));
 expect(hover.pass).toBe(false);expect(hover.drift).toBeGreaterThan(ENVELOPE.maxPosteriorDriftBL);
 // control 3 (mirrored sign): the same solved angles with the wrong sign lift the trunk instead of landing it
 const flipped=envelope(record,negateSegs(tl));expect(flipped.pass).toBe(false);
 // C465 intentionally bounds dry victory head/jaw as well. The original
 // minimum head rise, trunk sink/drift rulers and three negative controls stay unchanged.
 expect(tl.root).toEqual(buildActionTimeline(card,authored,5).root);
 for(const[joint,cap]of [['head',12],['jaw',4]]as const)
  expect(Math.max(...tl.tracks[joint]!.map(k=>Math.abs(k.value)*180/Math.PI))).toBeLessThanOrEqual(cap+1e-10);
});
it('changes no other family or serpent action',()=>{
 for(const id of Object.keys(fixtures)){const card=compileBodyCard({...structuredClone(fixtures[id]),identity:{...fixtures[id].identity,earthName:null},recipeHash:'synthetic-control'});
  for(const action of Object.keys(actionsFor(card.template.id,card.anatomy)!)){const tl=buildTimeline(card,action,17);
   expect(tl.notes.includes('serpent:landing-victory-v1'),id+'/'+action).toBe(id==='serpent'&&action==='victory');}}
});
