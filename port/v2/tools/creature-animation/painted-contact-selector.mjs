/** One source-space selector shared by intake contact locks and runtime support.
 * Preserve the runtime's normalized PER-CORNER arithmetic and strict first-on-
 * equal-distance order. Algebraically equivalent pixel sums choose differently
 * at floating-point ties. This function reads geometry only and never rewrites it.
 */
export function selectPaintedContactVertex(vertices,part,end,width,height){
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0||!Array.isArray(end)||end.length!==2||end.some(v=>!Number.isFinite(v)))throw Error('Painted contact selector: dimensions or endpoint');
 let best,distance=Infinity;
 for(const [vertexIndex,v]of part.vertices.entries()){
  let x=0,y=0;
  for(let k=0;k<3;k++){
   const p=vertices[v.triangle[k]],weight=v.barycentric[k];
   if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(weight))throw Error('Painted contact selector: source vertex');
   x+=p.x*weight/width;y+=p.y*weight/height;
  }
  const d=Math.hypot((x-end[0])*width,(y-end[1])*height);
  if(!Number.isFinite(d))throw Error('Painted contact selector: nonfinite distance');
  if(d<distance){distance=d;best={vertexIndex,rest:[x,y],distancePx:d,vertex:v};}
 }
 return best;
}
