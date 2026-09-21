/** Count-preserving soft-appendage expansion shared by rig intake and motion.
 * Counts describe painted anatomy, never an instruction to invent landmarks.
 * The existing 64-joint budget and each family's geometric limits still apply. */
import {MAX_SKELETON_JOINTS} from './skeleton-pose.mjs';
const fail=detail=>{throw Error('Anatomy inventory: '+detail);};
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export function appendageCounts(id,anatomy){
 if(anatomy?.schema!=='cf.anatomy-presence/v2')return null;
 const c=anatomy.appendages;
 if(c===undefined&&(Array.isArray(anatomy.hidden)||Array.isArray(anatomy.folded)))return null;
 if(!c||typeof c!=='object'||Array.isArray(c)||!['radial','cephalopod'].includes(id))fail('unsupported repeated topology '+id);
 const allowed=id==='radial'?['arms']:['arms','feedingTentacles'];
 if(Object.keys(c).some(k=>!allowed.includes(k))||!allowed.every(k=>Object.hasOwn(c,k)))fail('unknown or missing appendage count');
 const arms=c.arms,tentacles=id==='radial'?0:c.feedingTentacles;
 if(!Number.isInteger(arms)||arms<2||arms>20||!Number.isInteger(tentacles)||tentacles<0||tentacles>4)fail('invalid appendage count');
 const joints=(id==='radial'?3:8)+3*(arms+tentacles);
 if(joints>MAX_SKELETON_JOINTS)fail(MAX_SKELETON_JOINTS+'-joint budget exceeded: '+joints);
 return {arms,feedingTentacles:tentacles};
}
export function expandRepeatedAnatomy(template,anatomy){
 const counts=appendageCounts(template.id,anatomy);if(!counts)return template;
 const radial=template.id==='radial',parent=radial?'centre':'head',axis=radial?['centre','bell']:['head','mantle'];
 const prefixes=[...Array.from({length:counts.arms},(_,i)=>'arm'+i),...Array.from({length:counts.feedingTentacles},(_,i)=>'tentacle'+i)];
 const repeated=j=>/^arm\d+Seg[012]$/.test(j);
 const graph=template.graph.filter(([j])=>!repeated(j));
 const limits=Object.fromEntries(Object.entries(template.limitsDeg).filter(([j])=>!repeated(j)));
 const min=.3,max=radial?8:6,boundPrefix=radial?'arm/bell:':'arm/body:';
 const bounds=[],proportions=[],chains=[];
 for(const prefix of prefixes){
  const bones=Array.from({length:3},(_,i)=>prefix+'Seg'+i);
  for(let i=0;i<3;i++){graph.push([bones[i],i?bones[i-1]:parent]);limits[bones[i]]={...template.limitsDeg['arm0Seg'+i]};}
  const id=boundPrefix+prefix;
  bounds.push({id,min,max,kind:'ratio',bones,axis});
  proportions.push({id,min,max,measure:(lm,lengths)=>bones.reduce((s,j)=>s+lengths[j],0)/Math.hypot(lm[axis[0]][0]-lm[axis[1]][0],lm[axis[0]][1]-lm[axis[1]][1])});
  chains.push({id:prefix,kind:radial?'arm':'tentacle',driver:parent,joints:bones});
 }
 return freeze({...template,graph,joints:['root',...graph.map(([j])=>j)],limitsDeg:limits,
  ...(template.bounds?{bounds:[...template.bounds.filter(b=>!b.id.startsWith(boundPrefix)),...bounds]}:{}),
  ...(template.proportions?{proportions:[...template.proportions.filter(b=>!b.id.startsWith(boundPrefix)),...proportions]}:{}),
  ...(template.secondaryChains?{secondaryChains:[...template.secondaryChains.filter(c=>!/^arm\d+$/.test(c.id)),...chains]}:{})});
}
