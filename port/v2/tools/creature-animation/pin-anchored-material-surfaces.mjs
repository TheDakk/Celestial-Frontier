/** Source-owned fixed pedal/skeleton paint for the two anchored material classes.
 * Uses the established fixed-surface pin procedure. No source/UV/face/ruler changes. */
import {familyContractForRecord} from './family-contracts.mjs';
import {hashJSON} from './quadruped-template.mjs';
import {validatePaintSkin} from './paint-skin.mjs';
const need=(ok,m)=>{if(!ok)throw Error('Anchored material fixed surfaces: '+m);};
export async function pinAnchoredMaterialSurfaces(input,record){
 const family=familyContractForRecord(record),id=family.id;
 need(['anchored-soft-polyp','anchored-skeleton-soft-polyps'].includes(id)&&family.anchored===true,'explicit anchored material family');
 const fixed=id==='anchored-soft-polyp'?'base':'skeleton';need(family.rigid.includes(fixed)&&family.limitsDeg[fixed].min===0&&family.limitsDeg[fixed].max===0,'fixed material control');
 const {bindingHash,...body}=input;need(input.recordRecipeHash===record.recipeHash&&await hashJSON(body)===bindingHash,'exact record binding');
 const owners=input.parts.filter(p=>p.kind==='part'&&p.joint===fixed);need(owners.length===1,'one observed fixed material owner');
 const skin=structuredClone(input.paintSkin),pins=new Set(skin.solver.pins),supports=new Set();
 for(const owner of owners){const part=skin.parts.find(p=>p.id===owner.id);need(part?.vertices.length&&part.fieldTriangles?.length===part.indices.length,'complete fixed source material');for(const v of part.vertices)for(const i of v.triangle)supports.add(i);for(const i of part.fieldTriangles)supports.add(i);}
 for(const i of supports){need(skin.vertices[i],'source support');skin.vertices[i].weights=[['root',1]];pins.add(i);}
 skin.solver={...skin.solver,pins:[...pins].sort((a,b)=>a-b)};validatePaintSkin(skin,input.parts,record.geometry.width,record.geometry.height,family.joints);
 const output={...body,paintSkin:skin};return{binding:{...output,bindingHash:await hashJSON(output)},receipt:{schema:'cf.anchored-material-fixed-surfaces/v1',sourceBindingHash:bindingHash,fixedOwner:owners[0].id,fixedSupports:supports.size,sourceCoordinateChanges:0,topologyChanges:0,atlasChanges:0,policy:'Actual full fixed material and existing shared attachment supports inherit unchanged anchored root; distinct soft fields retain their source weights.'}};
}
