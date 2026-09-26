/** Source-adjacent painted attachment continuity, independent of compiled seam
 * lists, runtime weight sharing or projected bones. Nearest joint attachments
 * and proximal limb-to-axial skin must remain continuous. Distinct limbs and
 * distal limb/body silhouette crossings are measured separately, not welded.
 * Root/pelvis ink belongs to the declared remainder surface. */
import {familyContractForRecord} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
const need=(ok,message)=>{if(!ok)throw Error('Source join continuity: '+message);};
const CELL=32;
const legJoint=joint=>/^(?:fore|hind)(?:Near|Far)(?:Root|Knee|Ankle|Paw)$/.test(joint);
const upperJoint=joint=>/^(?:fore|hind)(?:Near|Far)(?:Root|Knee)$/.test(joint);
// Source paint topology is distinct from bone inheritance: proximal limb ink
// sharing an original edge with the axial body is continuous skin, including
// a neck or tail-root mask. Distinct limbs and distal overlaps stay separate.
const proximalSkin=(a,d)=>(upperJoint(a.joint)&&!legJoint(d.joint))||(!legJoint(a.joint)&&upperJoint(d.joint));
function meshSource(part,skin){
 const positions=Float64Array.from(part.vertices.flatMap(v=>v.triangle.reduce((p,k,i)=>[p[0]+skin.vertices[k].x*v.barycentric[i],p[1]+skin.vertices[k].y*v.barycentric[i]],[0,0]))),bins=new Map();
 for(let t=0;t<part.indices.length;t+=3){const ix=Array.from(part.indices.slice(t,t+3)),xs=ix.map(i=>positions[i*2]),ys=ix.map(i=>positions[i*2+1]);
  for(let y=Math.floor(Math.min(...ys)/CELL);y<=Math.floor(Math.max(...ys)/CELL);y++)for(let x=Math.floor(Math.min(...xs)/CELL);x<=Math.floor(Math.max(...xs)/CELL);x++){const key=x+':'+y;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(t);}}
 return {part,positions,bins};
}
function trianglesNear(mesh,points){const found=new Set();for(const[x,y]of points)for(const t of mesh.bins.get(Math.floor(x/CELL)+':'+Math.floor(y/CELL))??[])found.add(t);return [...found].sort((a,b)=>a-b);}
function barycentric(mesh,point){
 const p=mesh.positions,[x,y]=point;
 for(const t of trianglesNear(mesh,[point])){const ids=Array.from(mesh.part.indices.slice(t,t+3)),[a,b,c]=ids.map(i=>i*2),ux=p[b]-p[a],uy=p[b+1]-p[a+1],vx=p[c]-p[a],vy=p[c+1]-p[a+1],det=ux*vy-uy*vx;if(Math.abs(det)<1e-12)continue;
  const u=((x-p[a])*vy-(y-p[a+1])*vx)/det,v=(ux*(y-p[a+1])-uy*(x-p[a]))/det,w=1-u-v;if(Math.min(w,u,v)>=-1e-8)return {triangle:ids,weights:[w,u,v]};}
 return null;
}
/** Union of both meshes' affine breakpoints along each original unit edge.
 * Endpoint-only or midpoint-only sampling can miss a narrow reopened triangle. */
function edgePoints(a,b,meshes){
 const vertical=a[0]===b[0],axis=vertical?0:1,along=1-axis,start=a[along],span=b[along]-start,values=[0,1];
 for(const mesh of meshes)for(const t of trianglesNear(mesh,[a,b,[(a[0]+b[0])/2,(a[1]+b[1])/2]]))for(let e=0;e<3;e++){
  const ia=mesh.part.indices[t+e]*2,ib=mesh.part.indices[t+(e+1)%3]*2,p=mesh.positions,d=p[ib+axis]-p[ia+axis];
  if(Math.abs(d)<1e-12){if(Math.abs(p[ia+axis]-a[axis])<1e-8)for(const i of [ia,ib]){const v=(p[i+along]-start)/span;if(v>=-1e-8&&v<=1+1e-8)values.push(Math.max(0,Math.min(1,v)));}continue;}
  const u=(a[axis]-p[ia+axis])/d;if(u< -1e-8||u>1+1e-8)continue;const v=(p[ia+along]+u*(p[ib+along]-p[ia+along])-start)/span;if(v>=-1e-8&&v<=1+1e-8)values.push(Math.max(0,Math.min(1,v)));
 }
 values.sort((x,y)=>x-y);return values.filter((v,i)=>!i||v-values[i-1]>1e-9).map(v=>[a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v]);
}
export function createSourceJoinProbe({record,binding,atlas,remainderPartId}){
 need(binding?.recordRecipeHash===record?.recipeHash&&binding.paintSkin,'record / paint skin binding');
 const {width,height}=record.geometry,parts=binding.parts.filter(p=>p.kind==='part'),skin=binding.paintSkin;
 need([width,height].every(n=>Number.isInteger(n)&&n>0&&n<=2048),'source dimensions');
 need(atlas?.rgba?.length===atlas.width*atlas.height*4&&atlas.width===binding.atlasSize.width&&atlas.height===binding.atlasSize.height,'atlas dimensions');
 const family=familyContractForRecord({...record,template:record.template??{id:'quadruped'}});
 const byId=new Map(parts.map(p=>[p.id,p])),declared=new Map(parts.map(p=>[p.joint,p.id])),parent=new Map(family.graph),joints=new Set(family.joints);
 need(byId.size===parts.length&&declared.size===parts.length&&parts.every(p=>joints.has(p.joint)),'unique known source owners');
 const remainder=remainderPartId??binding.sourceJoinTopology?.remainderPartId??(family.id==='quadruped'?parts.find(p=>p.joint==='spine')?.id:undefined);need(byId.has(remainder),'explicit family remainder owner required');
 const ownerAtJoint=j=>{if(!j)return null;if(declared.has(j))return declared.get(j);if(j==='root'||j==='pelvis')return remainder;return ownerAtJoint(parent.get(j));};
 const nearest=p=>ownerAtJoint(parent.get(p.joint));
 const ancestor=(a,d)=>{for(let j=parent.get(d.joint);j;j=parent.get(j))if(ownerAtJoint(j)===a.id)return true;return false;};
 const owner=new Uint16Array(width*height),meshes=new Map();
 for(const[k,p]of parts.entries()){
  const b=p.cutout,f=p.frame,part=skin.parts.find(q=>q.id===p.id);need(part&&b.width===f.width&&b.height===f.height,'native part mesh/frame '+p.id);
  need([b.x,b.y,b.width,b.height,f.x,f.y,f.width,f.height].every(Number.isInteger)&&b.x>=0&&b.y>=0&&b.x+b.width<=width&&b.y+b.height<=height&&f.x>=0&&f.y>=0&&f.x+f.width<=atlas.width&&f.y+f.height<=atlas.height,'source frame bounds');
  meshes.set(p.id,meshSource(part,skin));
  for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++)if(atlas.rgba[((f.y+y)*atlas.width+f.x+x)*4+3]!==0){const i=(b.y+y)*width+b.x+x;need(owner[i]===0,'overlapping base ink');owner[i]=k+1;}
 }
 const joins=new Map(),excluded=new Map();
 const sampleEdge=(row,edge,a,d)=>{for(const point of edgePoints(...edge,[meshes.get(a.id),meshes.get(d.id)])){const key=point.map(v=>v.toFixed(9)).join(',');if(row.seen.has(key))continue;row.seen.add(key);
   const ap=barycentric(meshes.get(a.id),point),dp=barycentric(meshes.get(d.id),point);need(ap&&dp,'source attachment absent from mesh '+row.name+' at '+point.join(','));row.samples.push({source:point,ancestor:ap,descendant:dp});}};
 const visit=(i,j,edge)=>{
  if(!owner[i]||!owner[j]||owner[i]===owner[j])return;
  let a=parts[owner[i]-1],d=parts[owner[j]-1];
  if(nearest(a)===d.id)[a,d]=[d,a];
  const nearestAttachment=nearest(d)===a.id,proximal=family.id==='quadruped'&&proximalSkin(a,d);
  if(!nearestAttachment&&proximal&&upperJoint(a.joint))[a,d]=[d,a];
  if(!nearestAttachment&&!proximal){const ids=[a.id,d.id].sort(),kind=ancestor(a,d)||ancestor(d,a)?'non-nearest ancestral silhouette adjacency':'independent sibling adjacency',key=ids.join('|');a=byId.get(ids[0]);d=byId.get(ids[1]);if(!excluded.has(key))excluded.set(key,{name:key,parts:ids,reason:kind,ancestorPart:a.id,descendantPart:d.id,sourceEdges:0,samples:[],seen:new Set()});const row=excluded.get(key);row.sourceEdges++;sampleEdge(row,edge,a,d);return;}
  const key=a.id+'--'+d.id;if(!joins.has(key))joins.set(key,{name:key,rule:nearestAttachment?'nearest anatomical attachment':'proximal body-skin attachment',ancestorPart:a.id,descendantPart:d.id,ancestorJoint:a.joint,descendantJoint:d.joint,sourceEdges:[],samples:[],seen:new Set()});const join=joins.get(key);join.sourceEdges.push(edge);
  sampleEdge(join,edge,a,d);
 };
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;if(x+1<width)visit(i,i+1,[[x+1,y],[x+1,y+1]]);if(y+1<height)visit(i,i+width,[[x,y+1],[x+1,y+1]]);}
 need(joins.size>0,'empty attachment inventory');
 const result=[...joins.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(({seen,...join})=>join);
 return {schema:'cf.source-join-continuity/v1',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,atlasSha256:binding.atlasSha256,width,height,
  epsilonNativePx:8*Math.pow(2,-23)*Math.max(width,height),epsilonReason:'Eight Float32 ulps at the native image extent cover published-buffer rounding, not a visible-pixel allowance.',
  parts:parts.map(p=>({id:p.id,vertexCount:meshes.get(p.id).part.vertices.length})),joins:result,excluded:[...excluded.values()].sort((a,b)=>a.parts.join('|').localeCompare(b.parts.join('|'))).map(({seen,...row})=>row),
  scope:'Nearest anatomical attachments and proximal limb-to-axial body-skin attachments, independently enumerated from every nonzero source-alpha edge. Distinct limb-to-limb and distal limb-to-body silhouette boundaries are observation-only; they are not required welds.'};
}
export function assessSourceJoinContinuity(probe,positionsByPart){
 const buffers=new Map();for(const part of probe.parts){const p=positionsByPart instanceof Map?positionsByPart.get(part.id):positionsByPart?.[part.id];need(p?.length===part.vertexCount*2&&Array.from(p).every(Number.isFinite),'published mesh '+part.id);buffers.set(part.id,p);}
 const at=(part,sample)=>{const p=buffers.get(part);let x=0,y=0;for(let k=0;k<3;k++){x+=p[sample.triangle[k]*2]*sample.weights[k]*probe.width;y+=p[sample.triangle[k]*2+1]*sample.weights[k]*probe.height;}return [x,y];};
 const measure=join=>{let maxGapPx=0,worst=null,violations=0;for(const sample of join.samples){const a=at(join.ancestorPart,sample.ancestor),d=at(join.descendantPart,sample.descendant),gap=Math.hypot(d[0]-a[0],d[1]-a[1]);if(gap>probe.epsilonNativePx)violations++;if(gap>maxGapPx){maxGapPx=gap;worst={source:sample.source,ancestor:a,descendant:d};}}
  return{name:join.name,rule:join.rule,ancestorJoint:join.ancestorJoint,descendantJoint:join.descendantJoint,sourceEdges:typeof join.sourceEdges==='number'?join.sourceEdges:join.sourceEdges.length,samples:join.samples.length,maxGapPx,violations,worst,status:violations?'GAP':'CONTINUOUS'};};
 const rows=probe.joins.map(measure),excluded=probe.excluded.map(join=>({...measure(join),parts:join.parts,reason:join.reason,status:'OBSERVATION_ONLY'}));
 return {schema:probe.schema,units:'native cut-out pixels',epsilonNativePx:probe.epsilonNativePx,epsilonReason:probe.epsilonReason,sourceEdges:rows.reduce((n,r)=>n+r.sourceEdges,0),samples:rows.reduce((n,r)=>n+r.samples,0),maxGapPx:Math.max(...rows.map(r=>r.maxGapPx)),joins:rows,excluded,status:rows.some(r=>r.violations)?'FAIL':'PASS',scope:probe.scope};
}
