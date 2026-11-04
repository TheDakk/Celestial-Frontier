import{remainderComponents}from'./remainder-components.mjs';
/** Paint islands left on the body after priority-polygon transfer. Preserve the
 * largest remainder component as torso; flood each smaller island only from
 * its observed four-neighbour part boundaries. No transparent crossing. */
export function separateUpperForelegs({labels,width,height,parts}) {
 if(labels.length!==width*height)throw Error('Island geometry');const bodies=parts.map((p,i)=>({p,i})).filter(({p})=>p.id==='spine');if(bodies.length!==1)throw Error('Unique spine remainder');
 const remainder=bodies[0].i+1,groups=remainderComponents(labels,width,remainder),out=Uint8Array.from(labels),rows=[];
 const near=p=>{const x=p%width;return[x?p-1:-1,x+1<width?p+1:-1,p-width,p+width].filter(q=>q>=0&&q<labels.length);};
 for(const [k,g]of groups.entries()){
  if(k===0)continue;const set=new Set(g.pixels),queue=[],seen=new Set();
  for(const p of g.pixels){const neighbours=near(p).filter(q=>labels[q]&&labels[q]!==remainder).sort((a,b)=>labels[a]-labels[b]||a-b);if(neighbours.length){out[p]=labels[neighbours[0]];queue.push(p);seen.add(p);}}
  for(let i=0;i<queue.length;i++)for(const q of near(queue[i]))if(set.has(q)&&!seen.has(q)){seen.add(q);out[q]=out[queue[i]];queue.push(q);}
  rows.push({pixels:g.pixels.length,moved:seen.size,boundaryOwners:g.border});
 }
 return{labels:out,receipt:{schema:'cf.remainder-island-placement/v1',method:'four-neighbour source-connected geodesic placement from observed owner edges; largest torso remainder preserved',changedPixels:rows.reduce((n,r)=>n+r.moved,0),largestComponentPreserved:groups[0]?.pixels.length??0,components:rows,otherOwnersChanged:0}};
}
