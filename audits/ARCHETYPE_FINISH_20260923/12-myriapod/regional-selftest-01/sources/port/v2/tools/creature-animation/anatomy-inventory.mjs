/** Explicit absent/hidden/folded anatomy, shared by the motion producer and rig intake.
 * A hidden but present appendage is NOT absent. Never infer absence from a
 * missing landmark: only the hash-bound record can declare it. */
import {resolveHiddenPresence} from './hidden-anatomy.mjs';
import {expandPlantAnatomy} from './plant-anatomy.mjs';
import {expandRepeatedAnatomy} from './repeated-anatomy.mjs';
const ears=['earFarRoot','earFarTip','earNearRoot','earNearTip'],tail=['tail0','tail1','tail2','tail3'];
const OPTIONAL=Object.freeze({
 quadruped:{tail,'external-ears':ears},hopper:{tail,'external-ears':ears},
 'biped-bird':{wings:['wingFarRoot','wingFarTip','wingNearRoot','wingNearTip'],'tail-fan':['tailFan'],beak:['beak']},
 fish:{jaw:['jaw'],caudal:['caudal'],dorsal:['dorsal'],'paired-pectoral-fins':['pectoralFar','pectoralNear']},
 insect:{mandible:['mandible'],wings:['wingFar','wingNear'],antennae:['antennaFar','antennaNear']},
 serpent:{jaw:['jaw']},arachnid:{sting:['sting'],chelicerae:['cheliceraFar','cheliceraNear']},
 myriapod:{mandible:['mandible'],antennae:['antennaFar','antennaNear']},
 cephalopod:{fins:['finFar','finNear'],eyes:['eyeFar','eyeNear']},
 'flyer-membrane':{tail:['tail0'],'external-ears':['earFarTip','earNearTip']},primate:{tail:['tail0','tail1','tail2']}
});
// Only the constraint belonging to an explicitly absent appendage is removed.
// Body axes, mandatory legs and all remaining geometry bounds stay in force.
const OMITTED_BOUNDS=Object.freeze({'biped-bird':{wings:['wing/torso']},fish:{caudal:['caudal/body']}});
export function resolveAnatomyInventory(template,anatomy){
 if(anatomy===undefined)return template;
 const allowed=anatomy?.schema==='cf.anatomy-presence/v2'?['schema','absent','appendages','growth','hidden','folded']:['schema','absent','growth'];
 if(!anatomy||!['cf.anatomy-presence/v1','cf.anatomy-presence/v2'].includes(anatomy.schema)||!Array.isArray(anatomy.absent)||Object.keys(anatomy).some(k=>!allowed.includes(k)))throw Error('Anatomy inventory: invalid presence declaration');
 // Folded is a species declaration about painted evidence, not a graph edit.
 // Omission means []; never derive it from missing landmarks or missing paint.
 const expanded=expandRepeatedAnatomy(template,anatomy);
 const folded=anatomy.folded===undefined?[]:anatomy.folded;
 if(!Array.isArray(folded)||new Set(folded).size!==folded.length||folded.some(id=>typeof id!=='string'||!expanded.legs?.includes(id)))throw Error('Anatomy inventory: invalid folded leg declaration');
 if(folded.some(id=>anatomy.absent.includes(id)||(Array.isArray(anatomy.hidden)&&anatomy.hidden.includes(id))))throw Error('Anatomy inventory: folded is neither hidden nor absent');
 template=resolveHiddenPresence(expandPlantAnatomy(expanded,anatomy),anatomy);
 if(new Set(anatomy.absent).size!==anatomy.absent.length)throw Error('Anatomy inventory: duplicate absence');
 const removed=new Set(),omittedBounds=new Set();for(const group of anatomy.absent){const names=template.optional?.[group]??OPTIONAL[template.id]?.[group];if(!names)throw Error('Anatomy inventory: mandatory or unknown part '+group);for(const j of names)removed.add(j);for(const id of OMITTED_BOUNDS[template.id]?.[group]??[])omittedBounds.add(id);}
 if(!removed.size)return template;
 const graph=template.graph.filter(([child])=>!removed.has(child));if(graph.some(([,parent])=>removed.has(parent)))throw Error('Anatomy inventory: disconnected child');
 return Object.freeze({...template,...(template.proportions?{proportions:Object.freeze(template.proportions.filter(b=>!omittedBounds.has(b.id)))}:{}),...(template.bounds?{bounds:Object.freeze(template.bounds.filter(b=>!omittedBounds.has(b.id)))}:{}),graph:Object.freeze(graph),joints:Object.freeze(template.joints.filter(j=>!removed.has(j))),limitsDeg:Object.freeze(Object.fromEntries(Object.entries(template.limitsDeg).filter(([j])=>!removed.has(j)))),...(template.contactLimitsDeg?{contactLimitsDeg:Object.freeze(Object.fromEntries(Object.entries(template.contactLimitsDeg).filter(([j])=>!removed.has(j))))}:{}),...(template.secondaryChains?{secondaryChains:Object.freeze(template.secondaryChains.map(c=>({...c,joints:c.joints.filter(j=>!removed.has(j))})).filter(c=>c.joints.length&&!removed.has(c.driver)))}:{})});
}
