/** Explicit anatomical absence, shared by the motion producer and rig intake.
 * A hidden but present appendage is NOT absent. Never infer absence from a
 * missing landmark: only the hash-bound record can declare it. */
const OPTIONAL=Object.freeze({hopper:Object.freeze({tail:['tail0','tail1','tail2','tail3'],'external-ears':['earFarRoot','earFarTip','earNearRoot','earNearTip']})});
export function resolveAnatomyInventory(template,anatomy){
 if(anatomy===undefined)return template;
 if(!anatomy||anatomy.schema!=='cf.anatomy-presence/v1'||!Array.isArray(anatomy.absent)||Object.keys(anatomy).some(k=>!['schema','absent'].includes(k)))throw Error('Anatomy inventory: invalid presence declaration');
 if(new Set(anatomy.absent).size!==anatomy.absent.length)throw Error('Anatomy inventory: duplicate absence');
 const removed=new Set();for(const group of anatomy.absent){const names=OPTIONAL[template.id]?.[group];if(!names)throw Error('Anatomy inventory: mandatory or unknown part '+group);for(const j of names)removed.add(j);}
 if(!removed.size)return template;
 const graph=template.graph.filter(([child])=>!removed.has(child));if(graph.some(([,parent])=>removed.has(parent)))throw Error('Anatomy inventory: disconnected child');
 return Object.freeze({...template,graph:Object.freeze(graph),joints:Object.freeze(template.joints.filter(j=>!removed.has(j))),limitsDeg:Object.freeze(Object.fromEntries(Object.entries(template.limitsDeg).filter(([j])=>!removed.has(j)))),...(template.secondaryChains?{secondaryChains:Object.freeze(template.secondaryChains.map(c=>({...c,joints:c.joints.filter(j=>!removed.has(j))})).filter(c=>c.joints.length&&!removed.has(c.driver)))}:{})});
}
