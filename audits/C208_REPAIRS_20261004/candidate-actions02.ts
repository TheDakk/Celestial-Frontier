import type {BodyCard} from '../../port/v2/apps/game/src/motion/body-card.js';
import {actionsFor} from '../../port/v2/apps/game/src/motion/family-actions.js';
import {buildTimeline,buildActionTimeline} from '../../port/v2/apps/game/src/motion/timeline.js';
export function candidateTimeline(card:BodyCard,id:string,seed:number){
 const raw=actionsFor(card.template.id,card.anatomy)?.[id];
 if(!raw||!card.paintedContactSupports||!['land','amphibious'].includes(card.realm))return buildTimeline(card,id,seed);
 if(card.template.id==='biped-bird'&&id==='victory'){
  // Grounded folded source expresses victory with a tuck and head lift, never a full flight spread.
  const scales:Record<string,number>={wingNearRoot:0,wingFarRoot:0,wingNearTip:0,wingFarTip:0,spine:.2,neck0:.2,neck1:.2,head:.2,tailFan:.2};
  return buildActionTimeline(card,{...raw,poses:raw.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,v*(scales[j]??1)])),root:{dx:p.root.dx*.2,dy:p.root.dy*.2}}))},seed);
 }
 if(card.template.id==='quadruped'&&id==='faint'){
  const axial=new Set(['root','pelvis','spine','chest','neck','head','jaw']);
  return buildActionTimeline(card,{...raw,poses:raw.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,axial.has(j)?v*.15:v])),root:{dx:p.root.dx*.15,dy:p.root.dy*.15}}))},seed);
 }
 return buildTimeline(card,id,seed);
}
