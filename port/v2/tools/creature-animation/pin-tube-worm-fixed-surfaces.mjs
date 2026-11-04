/** D41 tube-worm source-field ownership. The observed rigid tube/base stay fixed
 * through their full published paint, including the shared crown collar. This is
 * source fitting: no coordinates, atlas pixels, faces, limits or solver profile change. */
import {familyContractForRecord} from './family-contracts.mjs';
import {hashJSON} from './quadruped-template.mjs';
import {validatePaintSkin} from './paint-skin.mjs';
const need=(ok,message)=>{if(!ok)throw Error('Tube worm fixed surfaces: '+message);};
export async function pinTubeWormFixedSurfaces(input,record){
 const family=familyContractForRecord(record);
 need(family.id==='tube-worm'&&family.anchored===true&&['root','base','tube'].every(j=>family.rigid.includes(j)&&family.limitsDeg[j].min===0&&family.limitsDeg[j].max===0),'fixed anchored tube contract');
 const {bindingHash,...body}=input;
 need(input.recordRecipeHash===record.recipeHash&&await hashJSON(body)===bindingHash,'exact record binding');
 const fixed=new Set(['base','tube']),owners=input.parts.filter(p=>p.kind==='part'&&fixed.has(p.joint));
 need(owners.length===2&&owners.some(p=>p.joint==='base')&&owners.some(p=>p.joint==='tube'),'observed base and tube paint owners');
 const skin=structuredClone(input.paintSkin),pins=new Set(skin.solver.pins),fixedSupports=new Set();
 for(const owner of owners){const part=skin.parts.find(p=>p.id===owner.id);need(part?.vertices.length&&part.fieldTriangles?.length===part.indices.length,'complete rigid source surface '+owner.id);for(const vertex of part.vertices)for(const i of vertex.triangle)fixedSupports.add(i);for(const i of part.fieldTriangles)fixedSupports.add(i);}
 for(const i of fixedSupports){need(skin.vertices[i],'rigid source support');skin.vertices[i].weights=[['root',1]];pins.add(i);}
 skin.solver={...skin.solver,pins:[...pins].sort((a,b)=>a-b)};
 validatePaintSkin(skin,input.parts,record.geometry.width,record.geometry.height,family.joints);
 const output={...body,paintSkin:skin};
 return{binding:{...output,bindingHash:await hashJSON(output)},receipt:{schema:'cf.tube-worm-fixed-surfaces/v1',sourceBindingHash:bindingHash,owners:owners.map(p=>({id:p.id,joint:p.joint})),fixedSupports:fixedSupports.size,sourceCoordinateChanges:0,topologyChanges:0,atlasChanges:0,policy:'Every published base/tube triangle support inherits the unchanged fixed root; the soft crown keeps its remaining authored field and the original shared attachment.'}};
}
