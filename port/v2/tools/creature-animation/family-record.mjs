/** Family-specific admission shared by offline intake and the actual Pixi loader.
 * No family guessing, skeleton fitting, missing-joint synthesis or clip overrides. */
import {checkHiddenLandmarks} from './hidden-anatomy.mjs';
import {measureMotionScale} from './motion-scale.mjs';
import {resolveFixedAttachments,validateFixedPivots} from './fixed-attachments.mjs';
import {familyContractForRecord,familyContactChains} from './family-contracts.mjs';
import {validateTerminalContactPads} from './terminal-contact-pads.mjs';
import {createSkeletonPoseProgram} from './skeleton-pose.mjs';
import {checkGeometry as checkQuadruped,admitRecordContent as admitQuadrupedContent,hashBytes,hashJSON,stableJSON} from './quadruped-template.mjs';
const need=(ok,reason)=>{if(!ok)throw Error('Family admission: '+reason);};
const distance=(j,axis)=>Math.hypot(j[axis[1]][0]-j[axis[0]][0],j[axis[1]][1]-j[axis[0]][1]);
export function measureFamilyBounds(template,landmarks){
 const fixedPivots=validateFixedPivots(template);
 const bones=Object.fromEntries(template.graph.map(([child,parent])=>{const pivot=fixedPivots?.[child];return[child,pivot?Math.hypot(landmarks[child][0]-pivot[0],landmarks[child][1]-pivot[1]):distance(landmarks,[parent,child])];}));
 const measures=Object.fromEntries(template.bounds.map(b=>[b.id,b.kind==='bone-min'?Math.min(...Object.values(bones)):
  b.kind==='bone-max'?Math.max(...Object.values(bones)):b.kind==='distance'?distance(landmarks,b.axis):
  b.bones.reduce((sum,name)=>sum+bones[name],0)/distance(landmarks,b.axis)]));
 return {boneLengths:bones,measures};
}
export function checkFamilyGeometry(record,alpha){
 if(record?.template?.id==='quadruped'&&!record.anatomy){need(!Object.hasOwn(record.geometry??{},'contactPads'),'terminal pads require family anatomy admission');need(!Object.hasOwn(record.geometry??{},'fixedAttachments'),'fixed attachments require compact myriapod admission');return checkQuadruped(record,alpha);}
 const template=resolveFixedAttachments(familyContractForRecord(record),record,alpha);
 validateTerminalContactPads(record,familyContactChains(template),alpha);
 need(record.kind===template.id&&record.template.version===template.version,'unsupported body or template version');
 need(record.clipSetId===template.clipSetId&&!Object.hasOwn(record,'clipOverrides'),'shared clip set required');
 const {width:w,height:h,groundLineY,depthLayers}=record.geometry??{};
 need([w,h].every(n=>Number.isInteger(n)&&n>=128&&n<=2048),'input dimensions');
 createSkeletonPoseProgram(template,record.landmarks); // Exact own inventory, graph and normalized coordinates.
 checkHiddenLandmarks(template,record.landmarks);
 need(Number.isFinite(groundLineY)&&groundLineY>0&&groundLineY<=1,'ground line');
 need(Array.isArray(depthLayers)&&depthLayers.length===2&&depthLayers.every((v,i)=>v.id===['far','near'][i]&&v.order===i),'two depth layers');
 measureMotionScale(template,record.landmarks); // Independent motion-scale admission; body-axis bounds stay unchanged.
 const result=measureFamilyBounds(template,record.landmarks);
 for(const bound of template.bounds){const value=result.measures[bound.id];need(Number.isFinite(value)&&value>=bound.min&&value<=bound.max,'proportion bound: '+bound.id);}
 if(alpha!==undefined){
  need(alpha instanceof Uint8Array&&alpha.length===w*h,'alpha dimensions');
  const radius=Math.ceil(Math.max(w,h)*.012);
  for(const name of template.joints){if(template.hiddenJoints?.includes(name))continue;const p=record.landmarks[name],x=Math.round(p[0]*w),y=Math.round(p[1]*h);let found=false;
   for(let dy=-radius;dy<=radius&&!found;dy++)for(let dx=-radius;dx<=radius;dx++){
    const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&alpha[yy*w+xx]>12){found=true;break;}}
   need(found,'landmark outside painted alpha: '+name);
  }
 }
 return {inside:true,clamped:[],...result,...(template.hiddenJoints?.length?{hiddenJoints:template.hiddenJoints}:{})};
}
export async function sealFamilyRecord(input){
 const {recipeHash:_old,boundsCheck:_bounds,...body}=structuredClone(input);
 const record={...body,boundsCheck:checkFamilyGeometry(body)};
 return {...record,recipeHash:await hashJSON(record)};
}
export async function admitFamilyRecord(record,cutoutBytes,alpha){
 need(await hashBytes(cutoutBytes)===record.geometry?.cutoutAssetHash,'mismatched cut-out hash');
 return admitFamilyRecordContent(record,alpha);
}
/** Shared semantic admission. A caller still needs byte or bundled-pin authority. */
export async function admitFamilyRecordContent(record,alpha){
 const template=familyContractForRecord(record);
 if(template.id==='quadruped'&&!record.anatomy){need(!Object.hasOwn(record.geometry??{},'contactPads'),'terminal pads require family anatomy admission');need(!Object.hasOwn(record.geometry??{},'fixedAttachments'),'fixed attachments require compact myriapod admission');await admitQuadrupedContent(record,alpha);return template;}
 const {recipeHash,...body}=record;
 need(typeof recipeHash==='string'&&await hashJSON(body)===recipeHash,'corrupted landmark / recipe hash');
 const identity=record.identity;
 need(identity&&typeof identity.speciesVisualKey==='string'&&identity.speciesVisualKey.length>5&&Number.isInteger(identity.seed)
  &&typeof identity.ownerId==='string'&&identity.ownerId.length>0,'identity');
 need(record.materials&&typeof record.materials.surface==='string'&&record.materials.surface.length>0,'painter material required');
 need(stableJSON(checkFamilyGeometry(record,alpha))===stableJSON(record.boundsCheck),'stale bounds / lengths');
 return template;
}
