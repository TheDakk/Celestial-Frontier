import fs from 'node:fs';
import {compileBodyCard,buildTimeline} from '../../port/v2/apps/game/src/motion/index.ts';
import {withPaintedContactSupports} from '../../port/v2/apps/game/src/motion/painted-supports.ts';
import {createFamilyContactSolver,observedContactSupports} from '../../port/v2/apps/game/src/creature-rig-contact.ts';
import {sampleClip,addPose} from '../../port/v2/apps/game/src/battle2/choreography.ts';
const base='audits/C202_NATIVE_HOLDS_20261004/red-fox-source-01/original-fit',record=JSON.parse(fs.readFileSync(base+'/record.json','utf8')),binding=JSON.parse(fs.readFileSync(base+'/binding.json','utf8')),supports=observedContactSupports(record,binding),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),solver=createFamilyContactSolver(record,supports),gait=buildTimeline(card,'approach',5),idle=buildTimeline(card,'idle',5);
const pose=addPose(sampleClip({source:'timeline',timeline:idle},idle.durationMs*.46875),sampleClip({source:'timeline',timeline:gait},46.6));
let error=null;try{solver.resolve(pose,{actionId:gait.actionId,elapsedMs:46.6,durationMs:gait.durationMs,realm:card.realm,weight:1,travel:'stage',stageDisplacement:0});}catch(e){error=String(e);}
const report={schema:'cf.c202-fox-contact-diagnosis/v1',scope:'Exact retained zero-displacement layered placement sample; audit-only expanded error, unchanged predicates.',error,pose,supports,scaleLength:solver.scaleLength,chains:solver.chains.map(c=>({id:c.id,root:c.root,joint:c.joint,end:c.endPoint,offset:c.offset,lengths:c.chain.lengths}))};
fs.writeFileSync('audits/C202_NATIVE_HOLDS_20261004/contact-diagnosis-01.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(error);
