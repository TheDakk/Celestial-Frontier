import{transformPoint}from'../creature-animation/kinematics.ts';
const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
/** Source plane joins the chest at its lower painted neck; upper head follows its joint. */
export function deformHeadSurface(rest,mapping,blend,head,chest,out){
 if(rest.length!==out.length||rest.length%2||!Number.isFinite(blend.top)||!Number.isFinite(blend.bottom)||blend.top>=blend.bottom)throw Error('Invalid head surface');
 for(let i=0;i<rest.length;i+=2){const p=transformPoint(mapping,{x:rest[i],y:rest[i+1]}),a=transformPoint(head,p),b=transformPoint(chest,p),w=1-smooth((rest[i+1]-blend.top)/(blend.bottom-blend.top));out[i]=b.x+(a.x-b.x)*w;out[i+1]=b.y+(a.y-b.y)*w;}
 return out;
}
export function requireHeadSurfaceOrientation(positions,indices,restAreas){
 for(let k=0;k<indices.length;k+=3){const a=indices[k]*2,b=indices[k+1]*2,c=indices[k+2]*2,area=(positions[b]-positions[a])*(positions[c+1]-positions[a+1])-(positions[b+1]-positions[a+1])*(positions[c]-positions[a]);
  if(!Number.isFinite(area)||area/restAreas[k/3]<.01)throw Error('Head surface fold at triangle '+k/3);
 }
}
/** A head view may replace only the head subtree. Neck/chest/body ink must survive. */
export function requireHeadReplacementCoverage(replaces,parts,graph,headJoint='head'){
 const parents=new Map(graph),seen=new Set();
 if(!Array.isArray(replaces)||!replaces.length)throw Error('Head replacement inventory');
 for(const id of replaces){const part=parts.find(p=>p.id===id);if(!part||seen.has(id))throw Error('Head replacement missing/duplicate part');seen.add(id);
  let joint=part.joint;const visited=new Set();while(joint!==headJoint&&parents.has(joint)&&!visited.has(joint)){visited.add(joint);joint=parents.get(joint);}
  if(joint!==headJoint)throw Error('Head replacement would remove body coverage: '+id);
 }
}
