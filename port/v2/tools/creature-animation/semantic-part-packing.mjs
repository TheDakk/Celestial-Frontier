/** Source ownership is independent of render-part packing. Only explicitly
 * continuous visible source surfaces may use this compiler; it invents no
 * hidden surfaces and never changes the 32 render-part or 64 joint budgets. */
import {familyContractForRecord} from './family-contracts.mjs';
import {requireVisiblePaintOwner} from './hidden-anatomy.mjs';
import {hashBytes,hashJSON} from './quadruped-template.mjs';
import {smoothSkinWeights} from './smooth-skin-weights.mjs';
import {validatePaintSkin} from './paint-skin.mjs';
const need=(ok,message)=>{if(!ok)throw Error('Semantic packing: '+message);};
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
const keys=(value,names)=>plain(value)&&Reflect.ownKeys(value).length===names.length&&names.every(k=>Object.hasOwn(value,k));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function inspect(record,regions,labels,groups,rgba){
 const {width,height}=record?.geometry??{},family=familyContractForRecord(record),known=new Set(family.joints),parent=new Map(family.graph);
 need(known.size<=64,'joint budget');need([width,height].every(v=>Number.isInteger(v)&&v>0&&v<=2048),'source dimensions');
 need(Array.isArray(regions)&&regions.length>0&&regions.length<=64,'semantic region budget');need(Array.isArray(groups)&&groups.length>0&&groups.length<=32,'render part budget');
 need(labels instanceof Uint8Array&&labels.length===width*height,'label dimensions');need(rgba instanceof Uint8Array||rgba instanceof Uint8ClampedArray,'RGBA bytes');need(rgba.length===width*height*4,'RGBA dimensions');
 const ids=new Map(),counts=new Uint32Array(regions.length),regionToRender=new Uint8Array(regions.length+1),renderLabels=new Uint8Array(labels.length),adjacency=new Set();
 for(const[r,region]of regions.entries()){
  need(keys(region,['id','joint','layer'])&&/^[a-z0-9][a-z0-9-]*$/.test(region.id)&&!ids.has(region.id),'region identity');
  need(known.has(region.joint),'unknown semantic joint');requireVisiblePaintOwner(family,region.joint);need(['far','near'].includes(region.layer),'region depth');ids.set(region.id,r);
 }
 const groupIds=new Set(),ordered=[];
 for(const[g,group]of groups.entries()){
  need(keys(group,['id','joint','layer','regions'])&&/^[a-z0-9][a-z0-9-]*$/.test(group.id)&&!groupIds.has(group.id),'render group identity');groupIds.add(group.id);
  need(Array.isArray(group.regions)&&group.regions.length>0&&new Set(group.regions).size===group.regions.length,'group inventory');
  const members=group.regions.map(id=>{need(ids.has(id),'unknown region in group');const r=ids.get(id);need(regionToRender[r+1]===0,'duplicate region assignment');regionToRender[r+1]=g+1;ordered.push(id);return regions[r];});
  need(members.every(r=>r.layer===group.layer),'cross-depth grouping');const joints=new Set(members.map(r=>r.joint));need(joints.has(group.joint),'group joint is not a source owner');
  for(const joint of joints){let at=joint,seen=new Set();while(at!==group.joint){need(at&&!seen.has(at)&&joints.has(at),'disconnected anatomical group');seen.add(at);at=parent.get(at);}}
 }
 need(same(ordered,regions.map(r=>r.id)),'missing, reordered or noncontiguous region inventory');
 for(let i=0;i<labels.length;i++){
  const k=labels[i];need(k<=regions.length,'unknown label');need(Boolean(k)===Boolean(rgba[i*4+3]),'source alpha ownership');if(!k)continue;counts[k-1]++;renderLabels[i]=regionToRender[k];
  for(const q of[i%width+1<width?i+1:-1,i+width<labels.length?i+width:-1])if(q>=0&&labels[q]&&labels[q]!==k){const a=Math.min(k,labels[q]),b=Math.max(k,labels[q]);adjacency.add(a+':'+b);}
 }
 need([...counts].every(n=>n>0),'empty semantic region');
 for(const group of groups){const pending=new Set(group.regions.map(id=>ids.get(id)+1)),seen=new Set([pending.values().next().value]);pending.delete([...seen][0]);let changed=true;while(pending.size&&changed){changed=false;for(const a of pending)if([...seen].some(b=>adjacency.has(Math.min(a,b)+':'+Math.max(a,b)))){pending.delete(a);seen.add(a);changed=true;}}need(pending.size===0,'nonadjacent source group');}
 return {width,height,regions,groups,renderLabels,counts:[...counts],parts:groups.map(({regions,...p})=>p)};
}
/** Snapshot caller input before the first await. Labels remain the original
 * semantic labels; renderLabels is a separate, lossless grouping of that map. */
export async function createSemanticPartPlan({record,regions,labels,groups,rgba}){
 need(labels instanceof Uint8Array,'label byte type');need(rgba instanceof Uint8Array||rgba instanceof Uint8ClampedArray,'RGBA byte type');
 const snapshot=structuredClone({record,regions,groups}),owned=new Uint8Array(labels),pixels=new Uint8ClampedArray(rgba),checked=inspect(snapshot.record,snapshot.regions,owned,snapshot.groups,pixels);
 const body={schema:'cf.semantic-part-ownership/v1',mode:'continuous-visible-source',recordRecipeHash:snapshot.record.recipeHash,width:checked.width,height:checked.height,regions:snapshot.regions,groups:snapshot.groups,labelsSha256:await hashBytes(owned),rgbaSha256:await hashBytes(pixels)};
 return {plan:{...body,planHash:await hashJSON(body),labels:owned},renderLabels:checked.renderLabels,parts:checked.parts,counts:checked.counts};
}
export async function validateSemanticPartPlan(input,record,parts,renderOwner,rgba){
 need(keys(input,['schema','mode','recordRecipeHash','width','height','regions','groups','labelsSha256','rgbaSha256','planHash','labels']),'plan fields');
 need(input.labels instanceof Uint8Array&&renderOwner instanceof Uint8Array,'plan label type');need(rgba instanceof Uint8Array||rgba instanceof Uint8ClampedArray,'RGBA byte type');const p=structuredClone(input),r=structuredClone(record),render=structuredClone(parts),owners=new Uint8Array(renderOwner),pixels=new Uint8ClampedArray(rgba);
 const {labels,planHash,...body}=p;
 need(p.schema==='cf.semantic-part-ownership/v1'&&p.mode==='continuous-visible-source'&&p.recordRecipeHash===r.recipeHash,'plan record binding');
 need(p.width===r.geometry.width&&p.height===r.geometry.height,'plan dimensions');need(await hashJSON(body)===planHash,'plan hash');need(await hashBytes(labels)===p.labelsSha256,'semantic label hash');need(await hashBytes(pixels)===p.rgbaSha256,'source RGBA hash');
 const checked=inspect(r,p.regions,labels,p.groups,pixels);need(same(checked.parts,render.map(({id,joint,layer})=>({id,joint,layer}))),'render inventory');
 need(owners.length===checked.renderLabels.length&&owners.every((v,i)=>v===checked.renderLabels[i]),'grouped label mismatch');
 return {...checked,labels,receipt:{schema:p.schema,mode:p.mode,planHash,semanticRegions:p.regions.length,renderParts:p.groups.length,semanticJoints:[...new Set(p.regions.map(p=>p.joint))],labelsSha256:p.labelsSha256,rgbaSha256:p.rgbaSha256}};
}
/** Finish the explicitly continuous field without replacing semantic weights by
 * the coarser render-part owners. Same diffusion and ARAP profile as ordinary
 * source authoring; no per-asset iteration, target, fold or strain tuning. */
export async function finishSemanticPaintSkin(input,record){
 const binding=structuredClone(input),r=structuredClone(record),{bindingHash,...body}=binding,skin=body.paintSkin,semantic=skin?.semanticOwnership;
 need(await hashJSON(body)===bindingHash&&body.recordRecipeHash===r.recipeHash,'finish binding');need(semantic?.schema==='cf.semantic-part-ownership/v1'&&semantic.mode==='continuous-visible-source','semantic field required');need(!skin.solver,'already finished');
 need(body.parts.length<=32&&skin.triangles?.length>0,'finish budgets/topology');const family=familyContractForRecord(r);validatePaintSkin(skin,body.parts,r.geometry.width,r.geometry.height,family.joints);
 const near=skin.vertices.map(()=>new Set());for(let i=0;i<skin.triangles.length;i+=3)for(let k=0;k<3;k++){const a=skin.triangles[i+k],b=skin.triangles[i+(k+1)%3];near[a].add(b);near[b].add(a);}
 const owner=skin.vertices.map(v=>v.weights.length===1&&v.weights[0][1]===1?v.weights[0][0]:null),boundary=new Set();for(let i=0;i<near.length;i++)if([...near[i]].some(j=>owner[i]!==owner[j]))boundary.add(i);
 let collar=new Set(boundary);for(let k=0;k<3;k++)collar=new Set([...collar,...[...collar].flatMap(i=>[...near[i]])]);
 const pins=[];for(let i=0;i<owner.length;i++)if(owner[i]&&(owner[i]==='root'||!collar.has(i)))pins.push(i);
 const result=smoothSkinWeights(skin);for(const i of pins)result.vertices[i].weights=[[owner[i],1]];result.solver={iterations:4,globalIterations:4,targetWeight:.35,pins};
 const used=new Set(result.vertices.flatMap(v=>v.weights.map(([j])=>j)));need(semantic.semanticJoints.every(j=>used.has(j)),'lost semantic joint influence');validatePaintSkin(result,body.parts,r.geometry.width,r.geometry.height,family.joints);
 const output={...body,paintSkin:result};return{binding:{...output,bindingHash:await hashJSON(output)},receipt:{schema:'cf.semantic-continuous-field-finish/v1',sourceBindingHash:bindingHash,semanticRegions:semantic.semanticRegions,renderParts:body.parts.length,semanticJoints:semantic.semanticJoints,fieldVertices:skin.vertices.length,sourceCoordinateChanges:0,sourceTriangleChanges:0,sourcePixelsChanged:0,profile:result.solver,qualification:false}};
}
