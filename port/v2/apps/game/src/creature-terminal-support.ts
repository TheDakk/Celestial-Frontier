/** An explicitly authored adhesive pad, interpolated on its actual rendered
 * terminal part. No pad detection, nearest eligible replacement or mesh edits. */
import type {CreatureRigRecordV1,CreaturePartsBindingV1} from './creature-rig.js';
import type {WeightedContactSupport} from './creature-rig-contact.js';
import type {ContactChain} from '../../../tools/creature-animation/family-contracts.mjs';
export function terminalPaintedSupport(record:CreatureRigRecordV1,binding:CreaturePartsBindingV1,chain:ContactChain,pad:readonly [number,number]):WeightedContactSupport{
 const skin=binding.paintSkin!,owner=binding.parts.find(p=>p.joint===chain.terminal&&p.kind==='part'),part=skin.parts.find(p=>p.id===owner?.id);
 if(!chain.terminal||!part)throw Error('Contact pad: missing terminal surface '+chain.end);
 const w=record.geometry.width,h=record.geometry.height,pins=new Set(skin.solver?.pins??[]);
 const rendered=part.vertices.map(v=>{const p=[0,0];for(let k=0;k<3;k++){const q=skin.vertices[v.triangle[k]!]!;p[0]!+=q.x/w*v.barycentric[k]!;p[1]!+=q.y/h*v.barycentric[k]!;}return p;});
 for(let i=0;i<part.indices.length;i+=3){
  const indices=part.indices.slice(i,i+3),[a,b,c]=indices.map(index=>rendered[index]!),d=(b![1]!-c![1]!)*(a![0]!-c![0]!)+(c![0]!-b![0]!)*(a![1]!-c![1]!);
  if(d===0)continue;
  const u=((b![1]!-c![1]!)*(pad[0]-c![0]!)+(c![0]!-b![0]!)*(pad[1]-c![1]!))/d,v=((c![1]!-a![1]!)*(pad[0]-c![0]!)+(a![0]!-c![0]!)*(pad[1]-c![1]!))/d,bary=[u,v,1-u-v];
  if(bary.some(n=>n<0||n>1))continue;
  const contributors=new Map<number,number>();
  for(let k=0;k<3;k++){const vertex=part.vertices[indices[k]!]!;for(let j=0;j<3;j++){const index=vertex.triangle[j]!,weight=bary[k]!*vertex.barycentric[j]!;if(weight!==0)contributors.set(index,(contributors.get(index)??0)+weight);}}
  const vertices=[...contributors].filter(([,weight])=>weight!==0).map(([index,barycentric])=>{const vertex=skin.vertices[index]!;return {rest:[vertex.x/w,vertex.y/h] as const,barycentric,weights:vertex.weights.map(([j,n])=>[j,n] as const),index};});
  // A rejected source point never migrates to a more convenient toe. Another
  // rendered triangle may share the exact point; only an exact rigid one fits.
  if(vertices.some(v=>!pins.has(v.index)||v.weights.length!==1||v.weights[0]![0]!==chain.terminal||v.weights[0]![1]!==1))continue;
  const rest:[number,number]=[0,0];for(const p of vertices){rest[0]+=p.rest[0]*p.barycentric;rest[1]+=p.rest[1]*p.barycentric;}
  if(Math.hypot(rest[0]-pad[0],rest[1]-pad[1])>1e-12)throw Error('Contact pad: source interpolation mismatch');
  return {rest:pad,pivotJoint:chain.terminal,surface:{partId:part.id,triangle:indices as [number,number,number],barycentric:bary as [number,number,number]},vertices:vertices.map(({index,...vertex})=>vertex)};
 }
 throw Error('Contact pad: authored point lacks a rigid pinned terminal surface '+chain.end);
}
