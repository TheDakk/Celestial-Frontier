import type {BodyCard} from './body-card.js';
import type {MotionAction} from './actions.js';
/** A grounded painted bird celebrates with a small head lift, keeping folded
 * wings and tail with the torso. A full flight spread cannot be reconstructed
 * from a folded painting. Timing, contact solver and geometric limits stay owned
 * by the existing pipeline; airborne and unpainted cards keep their actions. */
export function groundedBirdVictoryAction(card:BodyCard,action:MotionAction):MotionAction{
 if(action.id!=='victory'||card.template.id!=='biped-bird'||!card.paintedContactSupports||!['land','amphibious'].includes(card.realm))return action;
 return {...action,poses:action.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,/^(neck[01]|head)$/.test(j)?v*.1:0])),root:{dx:0,dy:0}}))};
}
