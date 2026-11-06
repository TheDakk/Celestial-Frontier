import type {BodyCard} from './body-card.js';
import type {MotionAction} from './actions.js';
/** A coherent short recoil/bow source clip. Both painted playback and the
 * contact solver's canonical source-step compiler see the same excursion.
 * This authors motion; it does not change contact targets or any guard. */
export function insectReactionAction(card:BodyCard,action:MotionAction):MotionAction {
 if(card.template.id!=='insect'||card.contactGeometry?.fixedAttachments||!['land','amphibious'].includes(card.realm)||!['hit','tame'].includes(action.id))return action;
 const gain=.25;
 return {...action,poses:action.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,/^(root|thorax|leg)/.test(j)?v*gain:v])),root:{dx:p.root.dx*gain,dy:p.root.dy*gain}}))};
}
