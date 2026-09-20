/** Presentation-only attacks. CombatCore still owns damage, abilities and themes.
 * Input is an admitted body card; a family alone never supplies missing joints. */
import {appendageCounts} from '../../../tools/creature-animation/repeated-anatomy.mjs';
import type {BodyCard,Weapon} from './motion/body-card.js';
import {actionsFor} from './motion/family-actions.js';
import {buildTimeline,fnv1a} from './motion/timeline.js';
import type {BattleMedium} from './battle-habitat.js';
import {earthFaunaProfile} from './earth-fauna-profiles.js';
export interface AnatomyAttack {
 readonly family:string;readonly verb:string;readonly weapon:Weapon;readonly label:string;
 readonly joints:readonly string[];readonly contactJoint:string;readonly contactPhase?:'strike'|'smear';readonly medium:readonly BattleMedium[];
}
const row=(family:string,verb:string,weapon:Weapon,label:string,joints:string[],contactJoint:string,medium:BattleMedium[]=['ground','air','water'],contactPhase?:'strike'|'smear'):AnatomyAttack=>Object.freeze({family,verb,weapon,label,joints:Object.freeze(joints),contactJoint,medium:Object.freeze(medium),...(contactPhase?{contactPhase}:{})});
export const ANATOMY_ATTACKS:readonly AnatomyAttack[]=Object.freeze([
 row('brachyuran','pinch','claw','Pincer pinch',['clawNearPalm','clawNearFixedTip','clawNearDactylRoot','clawNearDactylTip'],'clawNearDactylTip',['ground','water'],'strike'),
 row('quadruped','bite','bite','Bite',['head','jaw'],'jaw'),
 row('quadruped','claw','claw','Foreclaw rake',['foreNearKnee','foreNearAnkle','foreNearPaw'],'foreNearPaw'),
 row('quadruped','gore','gore','Horn thrust',['neck','head'],'head'),
 row('quadruped','headbutt','headbutt','Headbutt',['neck','head'],'head'),
 row('quadruped','tail','tail','Tail lash',['pelvis','tail0','tail1','tail2','tail3'],'tail3'),
 row('quadruped','kick','kick','Forehoof kick',['foreNearKnee','foreNearAnkle','foreNearPaw'],'foreNearPaw',['ground']),
 row('biped-bird','kick','kick','Grounded foot kick',['legNearKnee','legNearAnkle','legNearFoot'],'legNearFoot',['ground']),
 row('fish','body','body','Swimming body strike',['head','spine0','spine1'],'head',['water']),
 row('fish','tail','tail','Caudal sweep',['spine3','spine4','spine5','caudal'],'caudal',['water']),
 row('insect','body','body','Thorax shove',['thorax','head','abdomen'],'thorax'),
 row('arachnid','body','body','Body shove',['cephalothorax','abdomen'],'cephalothorax',['ground']),
 row('myriapod','body','body','Segment coil shove',['head','seg0','seg1','seg2','seg3'],'seg3',['ground']),
 row('radial','body','body','Bell pulse',['centre','bell'],'bell',['water']),
 row('hopper','kick','claw','Hind-leg kick',['hindNearKnee','hindNearAnkle','hindNearPaw'],'hindNearPaw',['ground','water']),
 row('hopper','bite','bite','Leaping bite',['head','jaw'],'jaw',['ground','water']),
 row('biped-bird','peck','peck','Beak strike',['neck0','neck1','head','beak'],'beak'),
 row('biped-bird','claw','claw','Talon strike',['legNearKnee','legNearAnkle','legNearFoot','wingNearRoot','wingFarRoot'],'legNearFoot'),
 row('fish','bite','bite','Swimming bite',['head','jaw','spine0','spine1'],'jaw',['water']),
 row('insect','mandible','bite','Mandible snap',['head','mandible'],'mandible'),
 row('serpent','strike','bite','Coiled strike',['head','jaw','seg0','seg1'],'jaw',['ground','water']),
 row('serpent','constrict','constrict','Body coil',['seg0','seg1','seg2','seg3'],'seg2',['ground','water']),
 row('arachnid','bite','bite','Chelicera bite',['cheliceraNear','cheliceraFar'],'cheliceraNear',['ground']),
 row('arachnid','sting','sting','Stinger arc',['abdomen','sting'],'sting',['ground']),
 row('radial','sting-arms','sting','Radial arm strike',['bell','arm0Seg0','arm0Seg1','arm0Seg2'],'arm0Seg2',['water']),
 row('myriapod','mandible','bite','Mandible snap',['head','mandible'],'mandible',['ground']),
 row('myriapod','sting','sting','Rear sting',['seg5','seg6','seg7'],'seg7',['ground']),
 row('cephalopod','lash','constrict','Arm lash',['mantle','arm4Seg0','arm4Seg1','arm4Seg2'],'arm4Seg2',['water']),
 row('cephalopod','bite','bite','Beak lunge',['head','mantle'],'head',['water']),
 row('flyer-membrane','bite','bite','Flying bite',['head','jaw','wingNearRoot','wingFarRoot'],'jaw'),
 row('flyer-membrane','claw','claw','Foot rake',['legNearKnee','legNearFoot','wingNearRoot','wingFarRoot'],'legNearFoot'),
 row('primate','punch','claw','Arm strike',['armNearShoulder','armNearElbow','armNearHand'],'armNearHand',['ground']),
 row('primate','bite','bite','Bite',['head','jaw'],'jaw',['ground']),
]);
// Named Earth capabilities need an explicit species declaration, never the
// body-card's generic quadruped default or an arbitrary Earth genome weapon.
const CONDITIONAL_WEAPONS=new Set(['gore','sting']);
export interface WeaponDeclaration {readonly recordHash:string;readonly source:string;readonly weapons:readonly Weapon[];}
export function attackRepertoire(card:BodyCard,medium:BattleMedium,declaration?:WeaponDeclaration){
 const allowed=card.realm==='aquatic'?['water']:card.realm==='aerial'||card.realm==='gas-giant'?['air']:card.realm==='amphibious'?['ground','water']:['ground'];
 if(!allowed.includes(medium))throw Error('Attack anatomy: incompatible physical medium');
 const earth=card.identity.earthName,profile=earth?earthFaunaProfile(earth):undefined,declared=profile?.intendedMoves;
 if(!earth&&(!declaration||declaration.recordHash!==card.recipeHash||!card.recipeHash||!declaration.source.trim()||!Array.isArray(declaration.weapons)||new Set(declaration.weapons).size!==declaration.weapons.length||declaration.weapons.some(w=>!['bite','claw','gore','tail','sting','peck','headbutt','constrict','spit','kick','body'].includes(w))))throw Error('Attack anatomy: hash-bound painter weapon declaration required');
 if(earth&&!profile)throw Error('Attack anatomy: named Earth capability declaration required for '+earth);
 if(profile&&!profile.candidateTemplates.includes(card.template.id))throw Error('Attack anatomy: species/template mismatch for '+earth);
 if(profile&&!profile.media.includes(medium))throw Error('Attack anatomy: incompatible species medium');
 const observed=(weapon:Weapon)=>declaration?.recordHash===card.recipeHash&&Boolean(card.recipeHash)&&Boolean(declaration?.source.trim())&&declaration?.weapons.includes(weapon);
 const joints=new Set(card.parts.map(p=>p.joint)),library=actionsFor(card.template.id,card.anatomy);
 const counts=appendageCounts(card.template.id,card.anatomy);
 const candidates=ANATOMY_ATTACKS.filter(a=>a.family===card.template.id).map(a=>{
  if(a.family!=='cephalopod'||a.verb!=='lash'||!counts)return a;
  const prefix=counts.feedingTentacles?'tentacle0':'arm'+Math.ceil((counts.arms-1)/2);
  return row(a.family,a.verb,a.weapon,counts.feedingTentacles?'Feeding tentacle lash':a.label,['mantle',prefix+'Seg0',prefix+'Seg1',prefix+'Seg2'],prefix+'Seg2',[...a.medium]);
 }),rejected:{verb:string;reason:string}[]=[],attacks:AnatomyAttack[]=[];
 for(const a of candidates){const missing=a.joints.filter(j=>!joints.has(j));const reason=!a.medium.includes(medium)?'medium':(declared?!declared.includes(a.verb):!declaration!.weapons.includes(a.weapon))?'weapon not declared':earth&&CONDITIONAL_WEAPONS.has(a.weapon)&&!observed(a.weapon)?'conditional weapon observation required':missing.length?'missing '+missing.join(','):!library?.['melee:'+a.verb]?'no family motion':null;
  if(reason)rejected.push({verb:a.verb,reason});else attacks.push(a);
 }
 return {attacks,rejected,source:earth?'named Earth declaration + observed joints':'hash-bound painter weapon declaration + observed joints',status:attacks.length?'READY' as const:'UNSUPPORTED' as const};
}
export function compileAnatomyAttack(card:BodyCard,medium:BattleMedium,ordinal:number,requestedVerb?:string,declaration?:WeaponDeclaration){
 if(!Number.isSafeInteger(ordinal)||ordinal<0)throw Error('Attack anatomy: invalid attack ordinal');
 const repertoire=attackRepertoire(card,medium,declaration);
 const index=(parseInt(fnv1a(card.identity.speciesVisualKey),16)+ordinal)%repertoire.attacks.length;
 const attack=requestedVerb?repertoire.attacks.find(a=>a.verb===requestedVerb):repertoire.attacks[index];
 if(!attack)throw Error('Attack anatomy: no admitted move'+(requestedVerb?' '+requestedVerb:''));
 const timeline=buildTimeline(card,'melee:'+attack.verb,card.identity.seed);
 const contactPhase=attack.contactPhase??(attack.verb==='claw'?'strike':'smear'),strike=timeline.phases.find(([name])=>name===contactPhase);
 // Sum actual phase boundaries; duration includes secondary settling and is
// never a valid substitute for the instant the primary strike reaches contact.
 let contactMs=0;for(const [phase,ms]of timeline.phases){contactMs+=ms;if(phase===contactPhase)break;}
 if(!strike)throw Error('Attack anatomy: motion has no contact/smear phase');
 return {schema:'cf.anatomy-attack/v1' as const,attack,contactJoint:attack.contactJoint,timeline,contactMs,contactPhase,medium,ordinal,recordHash:card.recipeHash,repertoire};
}
