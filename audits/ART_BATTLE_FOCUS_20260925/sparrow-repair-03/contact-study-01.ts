import fs from 'node:fs';import path from 'node:path';
import {compileBodyCard,buildTimeline,sampleTimeline,actionsFor} from '../../../port/v2/apps/game/src/motion/index.ts';
import {buildActionTimeline} from '../../../port/v2/apps/game/src/motion/timeline.ts';
import {createFamilyContactSolver,observedContactSupports} from '../../../port/v2/apps/game/src/creature-rig-contact.ts';
import {familyContractForRecord,familyContactChains} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',out=process.argv[2];if(!out||fs.existsSync(out))throw Error('New output required');
const rows=[];
for(const [name,fit] of [['gull','audits/ART_BATTLE_FOCUS_20260925/12-gull/fit-03'],['goose','audits/ART_BATTLE_FOCUS_20260925/15-goose/fit-02'],['heron','audits/ART_BATTLE_FOCUS_20260925/16-heron/fit-01'],['sparrow','audits/ART_BATTLE_FOCUS_20260925/17-sparrow/fit-01'],['eagle','audits/ARCHETYPE_REPAIRS_20260922/03-biped-bird/fit-12']]){
 const r=JSON.parse(fs.readFileSync(path.join(root,fit,'record.json'),'utf8')),b=JSON.parse(fs.readFileSync(path.join(root,fit,'binding.json'),'utf8')),card=compileBodyCard(r,r.genome),def=familyContractForRecord(r);
 const distance=(a,b)=>Math.hypot(r.landmarks[a][0]-r.landmarks[b][0],r.landmarks[a][1]-r.landmarks[b][1]);
 const legLength=Math.min(...familyContactChains(def).map(c=>distance(c.hip,c.knee)+distance(c.knee,c.end))),ratio=legLength/card.bodyLength;
 for(const id of ['melee:claw']){
  const action=actionsFor(card.template.id,card.anatomy)[id],base=buildTimeline(card,id,card.identity.seed);
  const translated={...action,poses:action.poses.map(p=>({...p,root:{dx:p.root.dx*ratio,dy:p.root.dy*ratio}}))};
  const duck={...action,poses:action.poses.map((p,i)=>({...p,joints:i===0?{neck0:15,neck1:10,head:5}: {},root:i===0?{dx:-.12*ratio,dy:.06*ratio}:{dx:0,dy:0}}))};
  for(const [variant,tl]of [['original',base],['leg-scale-translation',buildActionTimeline(card,translated,card.identity.seed)],...(id==='dodge'?[['grounded-duck',buildActionTimeline(card,duck,card.identity.seed)]]:[])])for(const mode of ['rest','observed']){
   const solver=createFamilyContactSolver(r,mode==='observed'?observedContactSupports(r,b):{});let passes=0,first=null;let maxHeadRotation=0;
   for(let i=0;i<=120;i++){const ms=tl.durationMs*i/120,p=sampleTimeline(tl,ms),pose={...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:{rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy}};maxHeadRotation=Math.max(maxHeadRotation,Math.abs(p.joints.head??0));try{solver.resolve(pose,{actionId:id,elapsedMs:ms,durationMs:tl.durationMs,weight:1,realm:card.realm});passes++;}catch(e){first??={i,ms,error:String(e)};}}
   rows.push({name,id,variant,mode,legLength,bodyLength:card.bodyLength,ratio,passes,maxHeadRotation,first});
  }
 }
}
fs.writeFileSync(out,JSON.stringify({scope:'Authored motion alternatives against unchanged actual contact solvers; diagnostic only, no skin or native acceptance',rows},null,2)+'\n');console.log(JSON.stringify(rows.map(({name,id,variant,mode,passes,first})=>({name,id,variant,mode,passes,first})),null,2));
