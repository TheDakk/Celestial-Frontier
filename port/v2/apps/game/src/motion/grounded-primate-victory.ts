import type {BodyCard} from './body-card.js';
import type {MotionAction} from './actions.js';
/** A grounded painted primate celebrates with a supported arms, a head nod and tail gesture.
 * Large cumulative torso/head rotations fold a single painted neck into raised
 * arms. Keep the torso coherent and reduce whole curves, preserving timing.
 * Contact, skin and joint guards remain unchanged. */
export function groundedPrimateVictoryAction(card:BodyCard,action:MotionAction):MotionAction {
 if(action.id!=='victory'||card.template.id!=='primate'||!card.paintedContactSupports||!['land','amphibious'].includes(card.realm))return action;
 const gain=(j:string)=>/^(root|pelvis|spine|chest)$/.test(j)?0:/^(neck|head)$/.test(j)?.15:/^arm/.test(j)?0:/^tail/.test(j)?.2:1;
 return {...action,poses:action.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,v*gain(j)])),root:{dx:0,dy:0}}))};
}
