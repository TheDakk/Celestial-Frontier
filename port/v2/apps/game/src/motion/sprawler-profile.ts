/** Low-slung, short-limbed quadrupeds keep their trunk near the support plane.
 * Classification uses observed limb/trunk geometry, never a species-name list.
 * This authors smaller whole curves; contact, mesh, timing and support guards
 * remain authoritative. Stage travel is owned separately by the arena. */
import type {BodyCard} from './body-card.js';
import type {MotionAction} from './actions.js';
const LEGS=['foreNear','foreFar','hindNear','hindFar'] as const;
const TORSO=new Set(['root','pelvis','spine','chest']);
export function isSprawler(card:BodyCard):boolean {
 if(card.template.id!=='quadruped'||!['land','amphibious'].includes(card.realm)||!(card.bodyLength>0))return false;
 return LEGS.every(leg=>{const r=card.landmarks[leg+'Root'],k=card.landmarks[leg+'Knee'],a=card.landmarks[leg+'Ankle'];
  return r&&k&&a&&Math.hypot(k[0]-r[0],k[1]-r[1])/card.bodyLength<=.45&&Math.abs(a[1]-r[1])/card.bodyLength<=.65;
 });
}
export function sprawlerAction(card:BodyCard,action:MotionAction):MotionAction {
 if(!isSprawler(card))return action;
 const fixed=action.id.startsWith('approach:')||['idle','alert','cast','hit','faint','victory','tame','feed'].includes(action.id);
 if(!fixed&&action.id!=='melee:tail')return action;
 const flat=LEGS.some(leg=>card.landmarks[leg+'Ankle']![1]-card.landmarks[leg+'Root']![1]<card.bodyLength*.03);
 const idle=action.id==='idle',faint=action.id==='faint';
 return Object.freeze({...action,poses:Object.freeze(action.poses.map(p=>Object.freeze({...p,
  joints:Object.freeze(Object.fromEntries(Object.entries(p.joints).map(([joint,value])=>{
   const gain=TORSO.has(joint)?(flat||idle?0:.08):joint==='head'||joint==='neck'?(idle||faint?0:.2):joint.startsWith('tail')?.12:joint==='jaw'?1:1;
   return [joint,value*gain];
  }))),root:Object.freeze({dx:flat||idle?0:p.root.dx*.08,dy:flat||idle?0:p.root.dy*.04})
 }))) });
}
