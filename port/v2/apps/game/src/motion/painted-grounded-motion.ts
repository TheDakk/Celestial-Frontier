import type {BodyCard} from './body-card.js';
import type {MotionAction} from './actions.js';
/** Author continuous conservative poses for a grounded single painted view.
 * These gains change the intended motion, never contact or skin admission.
 * No species lookup, source-label rewrite or per-frame refusal suppression. */
export function paintedGroundedMotion(card:BodyCard,action:MotionAction):MotionAction {
 if(!card.paintedContactSupports||!['land','amphibious'].includes(card.realm))return action;
 const family=card.template.id,faint=action.id==='faint',victory=action.id==='victory';
 if(!(faint&&['quadruped','insect','primate'].includes(family)||victory&&['quadruped','insect'].includes(family)))return action;
 const gain=(joint:string):number=>{
  if(faint&&family==='quadruped'){
   if(/^(root|pelvis|spine|chest|fore|hind)/.test(joint))return 0;
   if(/^(neck|head)$/.test(joint))return .15;
   return 1;
  }
  // A painted primate settles on its actual supports instead of collapsing
  // both legs into the torso. Preserve a small coherent lean and distal expression.
  if(faint&&family==='primate')return joint==='root'?.1:/^(pelvis|spine|chest|leg(?:Near|Far)Hip)$/.test(joint)?0:1;
  if(faint&&family==='insect')return /^(root|thorax|abdomen|wing)/.test(joint)?0:joint==='head'?.15:1;
  if(victory&&family==='insect')return /^(thorax|abdomen|wing|leg)/.test(joint)?0:joint==='head'?.15:1;
  if(victory&&family==='quadruped'&&/^(fore|hind|ear)/.test(joint))return 0;
  return victory&&family==='quadruped'&&/^(root|pelvis|spine|chest|neck|head|fore|hind)/.test(joint)?.2:1;
 };
 return {...action,poses:action.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,v*gain(j)])),root:victory||faint?{dx:0,dy:0}:p.root}))};
}
