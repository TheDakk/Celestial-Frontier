/** Packet-local authored influence compilation. No anatomy or texture ownership inference. */
import {hashJSON} from '../../../port/v2/tools/creature-animation/quadruped-template.mjs';
import {familyContractForRecord} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
import {validatePaintSkin} from '../../../port/v2/tools/creature-animation/paint-skin.mjs';
import {smoothSkinWeights} from '../../../port/v2/tools/creature-animation/smooth-skin-weights.mjs';

const need=(ok,message)=>{if(!ok)throw Error('Regional authoring: '+message);};
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
/** Boundary-inclusive source polygon membership, with no proximity tolerance. */
export function insideSourcePolygon(x,y,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [ax,ay]=polygon[j],[bx,by]=polygon[i];
    if((x-ax)*(by-ay)===(y-ay)*(bx-ax)&&x>=Math.min(ax,bx)&&x<=Math.max(ax,bx)&&y>=Math.min(ay,by)&&y<=Math.max(ay,by))return true;
    if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  }
  return inside;
}
const immutableSkin=skin=>({...skin,vertices:skin.vertices.map(({weights,...v})=>v),solver:{...skin.solver,pins:[]}});

/** Regions refer to existing source-space field supports of one declared part.
 * Uncovered supports retain the split's initial weights. A second, shared
 * diffusion pass blends explicit seeds; inherited and explicit pins are restored
 * exactly afterward. No topology, UV, raster, landmark or solver-profile edits. */
export async function compileRegionalInfluences({binding,record,atlas,regions}){
  const {bindingHash,...body}=binding;
  need(await hashJSON(body)===bindingHash,'input binding hash');
  const {recipeHash,...recordBody}=record;
  need(await hashJSON(recordBody)===recipeHash,'input record hash');
  need(binding.recordRecipeHash===record.recipeHash,'record binding');
  need(Array.isArray(regions)&&regions.length>0,'explicit nonempty regionalInfluences required');
  const skin=binding.paintSkin,{width,height}=record.geometry;
  const joints=familyContractForRecord(record).joints,known=new Set(joints);
  need(binding.parts.length>0&&binding.parts.length<=32&&binding.parts.every(p=>p.kind==='part'),'at most 32 actual texture parts');
  validatePaintSkin(skin,binding.parts,width,height,joints);
  need(skin.solver&&Array.isArray(skin.solver.pins),'observed split solver and pins required');
  need(atlas?.rgba?.length===atlas.width*atlas.height*4&&atlas.width===binding.atlasSize.width&&atlas.height===binding.atlasSize.height,'atlas dimensions');
  const before=await hashJSON(immutableSkin(skin)),originalJSON=JSON.stringify(binding);
  const parts=new Map(binding.parts.map(p=>[p.id,p])),fields=new Map(skin.parts.map(p=>[p.id,p]));
  const memberships=new Map(),vertexParts=skin.vertices.map(()=>new Set());
  for(const [id,field]of fields){
    // These are existing source field supports, including the triangle's other
    // corners. They are not newly located joints or newly constructed vertices.
    const indices=new Set([...field.fieldTriangles,...field.vertices.flatMap(v=>v.triangle)]);
    memberships.set(id,indices);for(const i of indices)vertexParts[i].add(id);
  }
  const locks=new Map(skin.solver.pins.map(i=>[i,structuredClone(skin.vertices[i].weights)]));
  const inheritedPins=new Set(locks.keys()),seeds=new Map(),ids=new Set(),rows=[];
  const draft=structuredClone(skin);
  for(const region of regions){
    need(object(region)&&Object.keys(region).every(k=>['id','partId','joint','polygonPx','pin'].includes(k)),'unknown regional field');
    need(typeof region.id==='string'&&/^[a-z0-9][a-z0-9-]{0,119}$/.test(region.id)&&!ids.has(region.id),'unique explicit source-extent id');ids.add(region.id);
    need(parts.has(region.partId)&&fields.has(region.partId),'unknown region part '+region.id);
    need(known.has(region.joint),'unknown region joint '+region.id);
    need(region.pin===undefined||typeof region.pin==='boolean','pin must be explicit boolean '+region.id);
    need(Array.isArray(region.polygonPx)&&region.polygonPx.length>=3&&region.polygonPx.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=width&&p[1]>=0&&p[1]<=height),'bounded pixel polygon '+region.id);
    const area=region.polygonPx.reduce((sum,p,i)=>{const q=region.polygonPx[(i+1)%region.polygonPx.length];return sum+p[0]*q[1]-q[0]*p[1];},0);
    need(Number.isFinite(area)&&area!==0,'nonzero polygon area '+region.id);
    const owner=parts.get(region.partId),b=owner.cutout,f=owner.frame;
    const xs=region.polygonPx.map(p=>p[0]),ys=region.polygonPx.map(p=>p[1]);
    let paintedPixels=0;
    for(let y=Math.max(b.y,Math.floor(Math.min(...ys)));y<Math.min(b.y+b.height,Math.ceil(Math.max(...ys)));y++)for(let x=Math.max(b.x,Math.floor(Math.min(...xs)));x<Math.min(b.x+b.width,Math.ceil(Math.max(...xs)));x++){
      if(atlas.rgba[((f.y+y-b.y)*atlas.width+f.x+x-b.x)*4+3]!==0&&insideSourcePolygon(x+.5,y+.5,region.polygonPx))paintedPixels++;
    }
    need(paintedPixels>0,'region contains no positive-alpha paint of declared part '+region.id);
    const indices=[...memberships.get(region.partId)].filter(i=>{const v=skin.vertices[i];return insideSourcePolygon(v.x,v.y,region.polygonPx);}).sort((a,b)=>a-b);
    need(indices.length>0,'region selects no existing field supports '+region.id);
    let reusedInheritedLocks=0,sharedSupports=0;
    for(const i of indices){
      const prior=seeds.get(i);
      need(!prior||prior.joint===region.joint,'conflicting regional joints at vertex '+i+' ('+prior?.id+' / '+region.id+')');
      const pure=[[region.joint,1]],locked=locks.get(i);
      need(!locked||same(locked,pure),'region conflicts with preserved pin at vertex '+i+' ('+region.id+')');
      if(inheritedPins.has(i))reusedInheritedLocks++;
      if(vertexParts[i].size>1)sharedSupports++;
      seeds.set(i,{joint:region.joint,id:prior?.id??region.id});
      draft.vertices[i].weights=pure;
      if(region.pin===true)locks.set(i,pure);
    }
    rows.push({id:region.id,partId:region.partId,joint:region.joint,pin:region.pin===true,polygonPx:region.polygonPx,paintedPixels,selectedSupports:indices.length,sharedSupports,reusedInheritedLocks,vertexIndices:indices});
  }
  const result=smoothSkinWeights(draft);
  for(const[i,weights]of locks)result.vertices[i].weights=structuredClone(weights);
  result.solver={...skin.solver,pins:[...locks.keys()].sort((a,b)=>a-b)};
  const validated=validatePaintSkin(result,binding.parts,width,height,joints);
  need(await hashJSON(immutableSkin(result))===before,'source coordinates, interpolation, topology, or solver profile changed');
  for(const i of inheritedPins)need(same(result.vertices[i].weights,skin.vertices[i].weights),'inherited lock changed '+i);
  for(const row of rows)need(row.vertexIndices.some(i=>result.vertices[i].weights.some(([j,w])=>j===row.joint&&w>0)),'declared regional influence absent after diffusion '+row.id);
  const represented=new Set(result.vertices.flatMap(v=>v.weights.map(([joint])=>joint)));
  need(joints.every(j=>represented.has(j)),'declared joint lacks any final painted influence: '+joints.filter(j=>!represented.has(j)).join(','));
  need(JSON.stringify(binding)===originalJSON,'input binding mutated');
  const output={...body,paintSkin:result},finalBinding={...output,bindingHash:await hashJSON(output)};
  const changed=result.vertices.reduce((n,v,i)=>n+Number(!same(v.weights,skin.vertices[i].weights)),0);
  return {binding:finalBinding,receipt:{schema:'cf.packet-regional-influences/v1',status:'COMPILED_NOT_MOTION_ACCEPTED',sourceBindingHash:bindingHash,bindingHash:finalBinding.bindingHash,recordRecipeHash:record.recipeHash,atlasSha256:binding.atlasSha256,regionsHash:await hashJSON(regions),regions:rows,seededSupports:seeds.size,changedWeightVectors:changed,inheritedPins:inheritedPins.size,additionalPins:locks.size-inheritedPins.size,totalPins:locks.size,sourceGeometryHashBefore:before,sourceGeometryHashAfter:await hashJSON(immutableSkin(result)),sourceCoordinateChanges:0,topologyChanges:0,sourceUvChanges:0,textureOwnershipChanges:0,solverProfileChanges:0,smoothing:{owner:'smooth-skin-weights.mjs',iterations:32,locksRestoredAfterDiffusion:true},uncoveredSupports:'retain observed-split seed weights before shared diffusion; no required full regional tiling',validated,nativeAcceptance:false}};
}
