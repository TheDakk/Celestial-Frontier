import fs from 'node:fs';import {performance} from 'node:perf_hooks';
import {measureLayeredStanceReach} from '../../../port/v2/apps/game/src/creature-layered-stance-reach.js';
import {createFamilyContactSolver} from '../../../port/v2/apps/game/src/creature-rig-contact.js';
import {compileBodyCard} from '../../../port/v2/apps/game/src/motion/body-card.js';
import {buildTimeline} from '../../../port/v2/apps/game/src/motion/timeline.js';
import {sampleClip,addPose} from '../../../port/v2/apps/game/src/battle2/choreography.js';
const base='/Users/nick/Projects/celestial-frontier-openai-mac/audits/ART_BATTLE_FOCUS_20260925',rows=[];
for(const fit of['cougar-repair-03/fit-03','14-brown-bear/fit-02','18-ibex/fit-02','11-wolf/fit-03','13-river-otter/fit-02']){
 const record=JSON.parse(fs.readFileSync(base+'/'+fit+'/record.json','utf8')),card=compileBodyCard(record,record.genome),start=performance.now(),m=measureLayeredStanceReach(record,{},.5),loadMs=performance.now()-start;
 const solver=createFamilyContactSolver(record),gait=buildTimeline(card,'approach',5),idle=buildTimeline(card,'idle',5),reach=m.admitted*.9;let refusals=0,first=null,samples=0;
 // Independent shifted lattice plus multiple shorter walks; no resampling of the estimator's exact grid.
 for(let i=0;i<127;i++){const frac=(i+.5)/127,ms=gait.durationMs*frac;for(let k=0;k<19;k++){const p=addPose(sampleClip({source:'timeline',timeline:idle},idle.durationMs*(k+.5)/19),sampleClip({source:'timeline',timeline:gait},ms));for(const fraction of[.25,.5,.75,1]){const d=2*reach*(frac>=.5?frac-.5:frac)*fraction;samples++;try{solver.resolve(p,{actionId:gait.actionId,elapsedMs:ms,durationMs:gait.durationMs,realm:card.realm,travel:'stage',stageDisplacement:d});}catch(e){refusals++;first??={ms,k,d,error:String(e)};}}}}
 rows.push({fit,name:record.identity.earthName,measurement:m,stageReach:reach,measurementLoadMs:loadMs,independent:{samples,refusals,first}});console.log(JSON.stringify(rows.at(-1)));
}
fs.writeFileSync(process.argv[2],JSON.stringify({schema:'cf.layered-reach-proposal/v1',scope:'Sampled contact-only proposal; native publication still required. Existing .5 cap and .9 reserve.',rows},null,2)+'\n',{flag:'wx'});
