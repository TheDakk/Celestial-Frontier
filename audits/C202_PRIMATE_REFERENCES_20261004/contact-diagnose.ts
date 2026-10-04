import fs from 'node:fs';
import {compileBodyCard,buildTimeline,createGsapPlayer} from '../../port/v2/apps/game/src/motion/index.ts';
import {withPaintedContactSupports} from '../../port/v2/apps/game/src/motion/painted-supports.ts';
import {createFamilyContactSolver,observedContactSupports} from '../../port/v2/apps/game/src/creature-rig-contact.ts';
const cases=[['01-gorilla-bends','approach:walk',52.5],['01-gorilla-bends','faint',164.66666666666666],['01-gorilla-bends','tame',138.66666666666666],['02-howler-observed','approach:walk',60.3],['02-howler-observed','faint',165.73333333333332],['02-howler-observed','tame',187.73333333333332]] as const;
const rows=[];
for(const [id,action,ms] of cases){
 const base='audits/C202_PRIMATE_REFERENCES_20261004/'+id+'/fit01',record=JSON.parse(fs.readFileSync(base+'/record.json','utf8')),binding=JSON.parse(fs.readFileSync(base+'/binding.json','utf8')),supports=observedContactSupports(record,binding),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),solver=createFamilyContactSolver(record,supports),timeline=buildTimeline(card,action,record.identity.seed);
 const pose:Record<string,{rotation:number,dx:number,dy:number}>={};const player=createGsapPlayer(timeline,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy}}},{now:()=>0});
 try{player.seek(ms);let error=null,result=null;try{result=solver.resolve(pose,{actionId:action,elapsedMs:ms,durationMs:timeline.durationMs,realm:card.realm,weight:1});}catch(e){error=String(e);}
 rows.push({id,action,ms,error,result,scaleLength:solver.scaleLength,chains:solver.chains.map(c=>({id:c.id,root:c.root,joint:c.joint,end:c.endPoint,offset:c.offset,endpointOnly:c.endpointOnly,lengths:c.chain.lengths})),pose,supports});}finally{player.stop();}
}
fs.writeFileSync('audits/C202_PRIMATE_REFERENCES_20261004/contact-diagnosis-01.json',JSON.stringify({schema:'cf.c202-contact-diagnosis/v1',scope:'Audit-only detailed throw message; original runtime guards and all arithmetic unchanged.',rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(rows.map(r=>({id:r.id,action:r.action,error:r.error,scaleLength:r.scaleLength}))));
