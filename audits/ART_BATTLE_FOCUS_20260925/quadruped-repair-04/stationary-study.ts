import fs from 'node:fs';import path from 'node:path';
import {compileBodyCard} from '../../../port/v2/apps/game/src/motion/body-card.js';
import {buildTimeline,sampleTimeline} from '../../../port/v2/apps/game/src/motion/timeline.js';
import {faintStanceEnvelope,applyStanceEnvelope} from '../../../port/v2/apps/game/src/motion/stance-envelope.js';
import {createFamilyContactSolver,observedContactSupports} from '../../../port/v2/apps/game/src/creature-rig-contact.js';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',rows=[];
const list=['audits/ANATOMY_SINGLE_RUN_20260919/R3-S/civet-input-01','audits/ART_BATTLE_FOCUS_20260925/quadruped-repair-04/lizard-fit-03','audits/ART_BATTLE_FOCUS_20260925/14-brown-bear/fit-02','audits/ART_BATTLE_FOCUS_20260925/06-impala/fit-01','audits/ART_BATTLE_FOCUS_20260925/07-marmot/fit-01','audits/ART_BATTLE_FOCUS_20260925/09-cattle/fit-04'];
for(const fit of list){const r=JSON.parse(fs.readFileSync(path.join(root,fit,'record.json'),'utf8')),b=JSON.parse(fs.readFileSync(path.join(root,fit,'binding.json'),'utf8')),c=compileBodyCard(r,r.genome);
 for(const id of ['hit','tame']){const tl=buildTimeline(c,id,c.identity.seed),envelope=faintStanceEnvelope(c,{...tl,actionId:'faint'},ms=>sampleTimeline(tl,ms)),candidate=envelope?{...tl,...applyStanceEnvelope(tl,envelope)}:tl,row={fit,name:r.identity.earthName,id,envelope,modes:[]};
  for(const [mode,supports]of [['rest',{}],['observed',observedContactSupports(r,b)]]){const solver=createFamilyContactSolver(r,supports),cases=[];
   for(const [kind,t]of [['original',tl],['geometric-proposal',candidate]]){let passes=0,first=null;for(let i=0;i<=120;i++){const ms=t.durationMs*i/120,p=sampleTimeline(t,ms),pose={...Object.fromEntries(Object.entries(p.joints).filter(([j])=>j!=='root').map(([j,rotation])=>[j,{rotation}])),root:{rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy}};try{solver.resolve(pose,{actionId:id,elapsedMs:ms,durationMs:t.durationMs,weight:1,realm:c.realm});passes++;}catch(e){first??={ms,error:String(e)};}}cases.push({kind,passes,first});}row.modes.push({mode,cases});}
 rows.push(row);console.log(JSON.stringify(row));}
}
fs.writeFileSync(process.argv[2],JSON.stringify({scope:'DIAGNOSIS ONLY: reuse existing geometric faint authoring envelope on hit/tame. No runtime change, no native acceptance.',rows},null,2)+'\n',{flag:'wx'});
