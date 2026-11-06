/** Tail-gap placement is meaningful only for a present caudal fan.
 * Explicit intake absence keeps the complete axial tail, not a fabricated fan. */
import {familyContractForRecord} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
import {deriveTailPair,assertTailPair} from '../TAIL_LABELS_CHECK_20260926/tail-identity.mjs';
export function fishSeamTailPlan(record,parts,labels,width){
 if(record.template?.id!=='fish')throw Error('Fish tail plan: fish record required');
 const family=familyContractForRecord(record),absent=!family.joints.includes('caudal');
 if(absent){
  if(!record.anatomy?.absent?.includes('caudal')||Object.hasOwn(record.landmarks,'caudal')||parts.some(p=>p.joint==='caudal'))throw Error('Fish tail plan: absent caudal conflicts with authored inventory');
  return {pair:null,identity:{schema:'cf.fish-tail-absence/v1',absence:'caudal',source:'Explicit validated intake anatomy; axial spine tail retained',tailGapPlacement:false}};
 }
 const pair=deriveTailPair(parts,labels,width);
 return {pair,identity:assertTailPair(parts,labels,width,pair.tail,pair.stalk)};
}
