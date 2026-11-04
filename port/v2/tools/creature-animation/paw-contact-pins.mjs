/** Offline contact constraints from original paw alpha, not a guessed bone disc. */
const need=(ok,why)=>{if(!ok)throw Error('Painted paw pins: '+why);};
export function lowerPawContour(part,rgba,width,height,sourceSha256){
 need(part?.kind==='part'&&part.joint?.endsWith('Paw')&&width===part.cutout.width&&height===part.cutout.height&&rgba.length===width*height*4,'source dimensions/owner');
 const samples=[];for(let x=0;x<width;x++)for(let y=height-1;y>=0;y--)if(rgba[(y*width+x)*4+3]!==0){samples.push([part.cutout.x+x+.5,part.cutout.y+y+.5]);break;}
 need(samples.length>0,'empty paw alpha');return{partId:part.id,joint:part.joint,sourceSha256,samples};
}
export function compilePawContactPins(skin,sourceParts,contours){
 const constraints=new Map(),parts=new Map(skin.parts.map(p=>[p.id,p])),sources=new Map(sourceParts.map(p=>[p.id,p])),seen=new Set(),rows=[];
 for(const contour of contours){const source=sources.get(contour.partId),part=parts.get(contour.partId);need(part&&source?.kind==='part'&&source.joint.endsWith('Paw')&&source.joint===contour.joint&&!seen.has(source.id),'source ownership');seen.add(source.id);
  need(Array.isArray(contour.samples)&&contour.samples.length>0,'empty contact samples');
  const rest=part.vertices.map(v=>v.triangle.reduce((p,k,i)=>[p[0]+skin.vertices[k].x*v.barycentric[i],p[1]+skin.vertices[k].y*v.barycentric[i]],[0,0])),owned=new Set();
  for(const p of contour.samples){need(Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=source.cutout.x&&p[1]>=source.cutout.y&&p[0]<source.cutout.x+source.cutout.width&&p[1]<source.cutout.y+source.cutout.height,'contact sample bounds');let found=null;
   for(let k=0;k<part.indices.length;k+=3){const ids=part.indices.slice(k,k+3),[a,b,c]=ids.map(i=>rest[i]),ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-a[0],vy=c[1]-a[1],det=ux*vy-uy*vx;if(!Number.isFinite(det)||det===0)continue;const u=((p[0]-a[0])*vy-(p[1]-a[1])*vx)/det,v=(ux*(p[1]-a[1])-uy*(p[0]-a[0]))/det;if(Math.min(u,v,1-u-v)>=-1e-8){found=ids;break;}}
   need(found,'source lower contour absent from mesh');
   // All field supports of a covering triangle follow the same paw frame.
   // This protects the contour segment, not only a fortunate sample centre.
   for(const index of found)for(const field of part.vertices[index].triangle){const previous=constraints.get(field);need(!previous||previous===source.joint,'conflicting paw owners at field vertex '+field);constraints.set(field,source.joint);owned.add(field);}
  }
  rows.push({partId:source.id,joint:source.joint,sourceSha256:contour.sourceSha256,samples:contour.samples.length,fieldVertices:owned.size});
 }
 return{constraints,receipt:{schema:'cf.source-paw-contact-pins/v1',samples:rows.reduce((n,r)=>n+r.samples,0),fieldVertices:constraints.size,parts:rows,method:'lowest nonzero-alpha texel centre in every original paw column; all covering triangle field supports hard-pinned to that paw matrix'}};
}
