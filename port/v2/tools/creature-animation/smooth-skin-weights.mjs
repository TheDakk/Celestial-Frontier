/** Shared-surface influence diffusion, after explicit source topology authoring.
 * Does not create attachments or separate overlapping appendages. */
export function smoothSkinWeights(skin,{iterations=32}={}){
 if(!Number.isInteger(iterations)||iterations<1||iterations>32||!Array.isArray(skin.triangles)||skin.triangles.length%3)throw Error('Skin diffusion: invalid topology/profile');
 const neighbors=skin.vertices.map(()=>new Set());for(let i=0;i<skin.triangles.length;i+=3)for(let k=0;k<3;k++){const a=skin.triangles[i+k],b=skin.triangles[i+(k+1)%3];if(!neighbors[a]||!neighbors[b])throw Error('Skin diffusion: vertex index');neighbors[a].add(b);neighbors[b].add(a);}
 const initial=skin.vertices.map(v=>new Map(v.weights));let weights=initial;
 for(let step=0;step<iterations;step++)weights=weights.map((own,i)=>{const sum=new Map();const add=(map,f)=>{for(const[j,n]of map)sum.set(j,(sum.get(j)??0)+n*f);};add(initial[i],.05);add(own,.475);if(neighbors[i].size)for(const other of neighbors[i])add(weights[other],.475/neighbors[i].size);else add(own,.475);
  const entries=[...sum].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)).slice(0,8),total=entries.reduce((s,e)=>s+e[1],0);return new Map(entries.map(([j,n])=>[j,n/total]));});
 return {...skin,vertices:skin.vertices.map((v,i)=>({...v,weights:[...weights[i]]}))};
}
