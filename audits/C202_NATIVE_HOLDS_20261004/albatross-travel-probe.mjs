import fs from 'node:fs';
import {compileBodyCard,buildTimeline,sampleTimeline} from '../../port/v2/apps/game/src/motion/index.ts';
import {withPaintedContactSupports} from '../../port/v2/apps/game/src/motion/painted-supports.ts';
import {createFamilyContactSolver,observedContactSupports} from '../../port/v2/apps/game/src/creature-rig-contact.ts';
const b='audits/C202_NATIVE_HOLDS_20261004/albatross-source-01/fit01',J=p=>JSON.parse(fs.readFileSync(p)),record=J(b+'/record.json'),binding=J(b+'/binding.json'),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),solver=createFamilyContactSolver(record,observedContactSupports(record,binding)),timeline=buildTimeline(card,'faint',1),rows=[];
for(const travel of ['solver','stage']){const errors=[];for(let i=0;i<=120;i++){const ms=timeline.durationMs*i/120,p=sampleTimeline(timeline,ms),pose=Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}]));pose.root={...p.root};try{solver.resolve(pose,{actionId:'faint',elapsedMs:ms,durationMs:timeline.durationMs,weight:1,realm:card.realm,travel});}catch(e){errors.push({ms,error:e.message});}}rows.push({travel,errors});}
console.log(JSON.stringify({timelineNotes:timeline.notes,rows},null,2));
