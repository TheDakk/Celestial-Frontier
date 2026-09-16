/** Offline geodesic diffusion of ownership weights on the actual alpha mesh.
 * No clip, species tuning, new paint, or changes to the authored anatomy. */
export function smoothSkinWeights(skin,{iterations=32,fidelity=0,preserveContacts=true}={}){
 if(!Array.isArray(skin.triangles)||skin.triangles.length%3||!Number.isInteger(iterations)||iterations<0||iterations>128||!Number.isFinite(fidelity)||fidelity<0||fidelity>1)throw Error('Skin diffusion input');
 const n=skin.vertices.length,joints=[...new Set(skin.vertices.flatMap(v=>v.weights.map(([j])=>j)))].sort(),byJoint=new Map(joints.map((j,i)=>[j,i]));
 const neighbors=Array.from({length:n},()=>new Map());
 for(let t=0;t<skin.triangles.length;t+=3)for(let k=0;k<3;k++){
  const a=skin.triangles[t+k],b=skin.triangles[t+(k+1)%3];if(a===b||!skin.vertices[a]||!skin.vertices[b])throw Error('Skin diffusion topology');
  const p=skin.vertices[a],q=skin.vertices[b],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<=0)throw Error('Skin diffusion zero edge');
  neighbors[a].set(b,1/d);neighbors[b].set(a,1/d);
 }
 const original=new Float64Array(n*joints.length);skin.vertices.forEach((v,i)=>v.weights.forEach(([j,w])=>original[i*joints.length+byJoint.get(j)]=w));
 const pins=[];
 if(preserveContacts)for(let i=0;i<n;i++){
  const contact=skin.vertices[i].weights.find(([joint,weight])=>joint.endsWith('Paw')&&weight>=.8);
  if(contact){pins.push(i);original.fill(0,i*joints.length,(i+1)*joints.length);original[i*joints.length+byJoint.get(contact[0])]=1;}
 }
 const pinned=new Set(pins);
 let current=original.slice(),next=original.slice();
 const adjacency=neighbors.map(ns=>{const total=[...ns.values()].reduce((a,b)=>a+b,0);return [...ns].map(([i,w])=>[i,w/total]);});
 for(let step=0;step<iterations;step++){
  for(let i=0;i<n;i++)for(let j=0;j<joints.length;j++){
   const at=i*joints.length+j;if(pinned.has(i)||!adjacency[i].length){next[at]=original[at];continue;}
   let mean=0;for(const[k,w]of adjacency[i])mean+=current[k*joints.length+j]*w;
   next[at]=fidelity*original[at]+(1-fidelity)*(.5*current[at]+.5*mean);
  }
  [current,next]=[next,current];
 }
 const vertices=skin.vertices.map((v,i)=>{
  const weights=joints.map((j,k)=>[j,current[i*joints.length+k]]).filter(([,w])=>w>1e-8).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,8);
  const sum=weights.reduce((n,[,w])=>n+w,0);return {...v,weights:weights.map(([j,w])=>[j,w/sum])};
 });
 return {...skin,vertices,solver:{iterations:4,globalIterations:4,targetWeight:.35,pins}};
}
