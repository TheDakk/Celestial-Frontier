import fs from 'node:fs';
import {compileBodyCard} from '../../port/v2/apps/game/src/motion/body-card.ts';
import {withPaintedContactSupports} from '../../port/v2/apps/game/src/motion/painted-supports.ts';
import {buildActionTimeline,sampleTimeline} from '../../port/v2/apps/game/src/motion/timeline.ts';
import {actionsFor} from '../../port/v2/apps/game/src/motion/family-actions.ts';
import {createFamilyContactSolver} from '../../port/v2/apps/game/src/creature-rig-contact.ts';
const dir='audits/INSECT_CONTACT_C67_20260927/26-cicada/fit',read=f=>JSON.parse(fs.readFileSync(dir+'/'+f,'utf8'));
const r=read('record.json'),b=read('binding.json'),card=withPaintedContactSupports(compileBodyCard(r,r.genome),r,b),solver=createFamilyContactSolver(r,card.paintedContactSupports.supports),results=[];
for(const id of ['cast','hit','tame','feed']){
 const action=actionsFor('insect',card.anatomy)[id];
 const scaled=gain=>({...action,poses:action.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,v*(['root','thorax'].includes(j)?gain:1)])),root:{dx:['hit','tame'].includes(id)?p.root.dx:p.root.dx*gain,dy:p.root.dy*gain}}))});
 const test=(gain,samples=128)=>{const tl=buildActionTimeline(card,scaled(gain),card.identity.seed);let maxCompression=0;
  for(let i=0;i<=samples;i++){const ms=tl.durationMs*i/samples,p=sampleTimeline(tl,ms),pose={...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:p.root};
   try{const result=solver.resolve(pose,{actionId:id,elapsedMs:ms,durationMs:tl.durationMs,realm:card.realm,weight:1});maxCompression=Math.max(maxCompression,result.compression??0);}catch(e){return{ok:false,ms,error:String(e),maxCompression};}}
  return{ok:true,maxCompression};};
 const original=test(1),zero=test(0);let low=0,high=1;
 if(!original.ok&&zero.ok)for(let i=0;i<12;i++){const m=(low+high)/2;if(test(m).ok)low=m;else high=m;}
 const gain=original.ok?1:low*.9,result=test(gain,640);results.push({id,original,zero,gain,result});console.log(JSON.stringify(results.at(-1)));
}
fs.writeFileSync('audits/INSECT_CURVE_C85_20260927/probe-preserve-travel.json',JSON.stringify(results,null,2)+'\n',{flag:'wx'});
