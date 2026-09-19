/** One-texel sampling guard on opaque sewn interiors. The original atlas is
 * immutable. Geometry, source alpha, depth and paint ownership remain unchanged:
 * this plan only supplies the adjacent owner's original opaque pixel to the
 * transparent/filter-padding side of a verified common skin boundary. */
import {createSourceJoinProbe} from '../quadruped-proof/source-join-continuity.mjs';
const need=(ok,why)=>{if(!ok)throw Error('Seam sampling guard: '+why);};
function fieldBasis(part,sample){
 const result=new Map();sample.triangle.forEach((index,i)=>{const vertex=part.vertices[index];vertex.triangle.forEach((source,j)=>{const value=sample.weights[i]*vertex.barycentric[j];result.set(source,(result.get(source)??0)+value);});});return result;
}
function basisDifference(a,b){let max=0;for(const key of new Set([...a.keys(),...b.keys()]))max=Math.max(max,Math.abs((a.get(key)??0)-(b.get(key)??0)));return max;}
export function createOpaqueSeamSamplingGuard({record,binding,atlas}){
 const probe=createSourceJoinProbe({record,binding,atlas}),{width:w,height:h}=record.geometry,aw=atlas.width,ah=atlas.height;
 const parts=binding.parts.filter(p=>p.kind==='part'),byId=new Map(parts.map(p=>[p.id,p])),skinParts=new Map(binding.paintSkin.parts.map(p=>[p.id,p]));
 const sourceOwner=new Int16Array(w*h).fill(-1),atlasFrameOwner=new Int16Array(aw*ah).fill(-1),sourcePixels=new Uint8Array(w*h*4);
 for(const[index,p]of binding.parts.entries()){const f=p.frame;for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++){const q=(f.y+y)*aw+f.x+x;need(atlasFrameOwner[q]===-1,'overlapping atlas frames');atlasFrameOwner[q]=index;}}
 for(const[index,p]of parts.entries()){const f=p.frame,b=p.cutout;for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++){const source=(b.y+y)*w+b.x+x,q=((f.y+y)*aw+f.x+x)*4;if(!atlas.rgba[q+3])continue;need(sourceOwner[source]===-1,'overlapping source owners');sourceOwner[source]=index;sourcePixels.set(atlas.rgba.subarray(q,q+4),source*4);}}
 const writes=new Map(),rows=[];let opaqueEdges=0;
 const add=(receiver,donorIndex,sx,sy)=>{
  if(sx<0||sy<0||sx>=w||sy>=h)return;const source=sy*w+sx;if(sourceOwner[source]!==donorIndex||sourcePixels[source*4+3]!==255)return;
  const b=receiver.cutout,f=receiver.frame,x=f.x+sx-b.x,y=f.y+sy-b.y;
  need(x>=0&&y>=0&&x<aw&&y<ah,'insufficient atlas padding at '+receiver.id);
  need(x>=f.x-1&&y>=f.y-1&&x<=f.x+f.width&&y<=f.y+f.height,'guard exceeds one texel');
  const target=y*aw+x,frameOwner=atlasFrameOwner[target],receiverFrame=binding.parts.indexOf(receiver);
  need(frameOwner===-1||frameOwner===receiverFrame,'guard touches another atlas frame');
  if(frameOwner===receiverFrame)need(atlas.rgba[target*4+3]===0,'guard would overwrite original owned ink');
  const rgba=Array.from(sourcePixels.subarray(source*4,source*4+4)),existing=writes.get(target);
  need(!existing||(existing.partId===receiver.id&&existing.rgba.every((n,i)=>n===rgba[i])),'conflicting atlas padding guards');
  writes.set(target,{x,y,rgba,partId:receiver.id,source:[sx,sy]});
 };
 for(const join of probe.joins){
  const a=byId.get(join.ancestorPart),d=byId.get(join.descendantPart),ai=parts.indexOf(a),di=parts.indexOf(d);let maxBasisDifference=0,count=0;
  for(const sample of join.samples)maxBasisDifference=Math.max(maxBasisDifference,basisDifference(fieldBasis(skinParts.get(a.id),sample.ancestor),fieldBasis(skinParts.get(d.id),sample.descendant)));
  need(maxBasisDifference<=1e-7,'unshared skin field at '+join.name+' ('+maxBasisDifference+')');
  for(const [start,end]of join.sourceEdges){const vertical=start[0]===end[0],px=vertical?start[0]-1:start[0],py=vertical?start[1]:start[1]-1,qx=vertical?start[0]:start[0],qy=vertical?start[1]:start[1],p=py*w+px,q=qy*w+qx;
   if(sourcePixels[p*4+3]!==255||sourcePixels[q*4+3]!==255)continue;
   need((sourceOwner[p]===ai&&sourceOwner[q]===di)||(sourceOwner[p]===di&&sourceOwner[q]===ai),'source edge owner changed');count++;opaqueEdges++;
   // Bilinear footprints can straddle the corner of a stair-step edge. Copy
   // only this sewn neighbor's opaque source ink within the one-texel ring.
   for(const[x,y]of [[px,py],[qx,qy]]){const receiverIndex=sourceOwner[y*w+x],receiver=parts[receiverIndex],donorIndex=receiverIndex===ai?di:ai;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)add(receiver,donorIndex,x+dx,y+dy);
   }
  }
  rows.push({name:join.name,rule:join.rule,opaqueEdges:count,maxBasisDifference});
 }
 const pixels=[...writes.values()].sort((a,b)=>a.y-b.y||a.x-b.x);
 return {pixels,receipt:{schema:'cf.opaque-seam-sampling-guard/v1',sourceAtlasSha256:binding.atlasSha256,bindingHash:binding.bindingHash,guardTexels:pixels.length,opaqueEdges,joins:rows,
  policy:'Decode-time copies of exact opaque adjacent-owner RGBA in a one-texel ring at independently enumerated shared-field skin joins; original bytes, geometry, silhouettes, nonopaque pixels and distinct-limb/depth boundaries remain unchanged.'}};
}
/** Test/offline convenience. Runtime writes only these texels into the decoded
 * canvas rather than round-tripping the original translucent atlas RGBA. */
export function applyOpaqueSeamSamplingGuard(rgba,width,height,plan){
 need(rgba.length===width*height*4,'atlas dimensions');const result=rgba.slice();for(const p of plan.pixels){need(p.x>=0&&p.y>=0&&p.x<width&&p.y<height&&p.rgba[3]===255,'guard pixel');result.set(p.rgba,(p.y*width+p.x)*4);}return result;
}
