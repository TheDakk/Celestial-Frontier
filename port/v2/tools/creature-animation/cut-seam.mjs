/** Cut-local seam diagnostic. No morphological closing, rest-pivot disc or art changes.
 * A seam is the uncovered bridge between two copies of a once-shared ownership edge.
 * Each copy follows its part's actual pose matrix. Authored exterior notches have no
 * shared edge and cannot enter the measurement merely by moving. This is not a shape
 * or motion acceptance gate; retained native failures are never overwritten. */
const validSize = (w,h) => {
  if (![w,h].every(n=>Number.isSafeInteger(n)&&n>0&&n<=8192)||w*h>64*1024*1024) throw Error('Invalid seam canvas');
};
export function sharedCutEdges(ancestor, descendant, width, height) {
  validSize(width,height);
  if (ancestor.length!==width*height || descendant.length!==width*height) throw Error('Mask size mismatch');
  const edges=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=y*width+x;
    if(ancestor[i]&&descendant[i])throw Error('Overlapping base ownership');
    const opposite=j=>(ancestor[i]&&descendant[j])||(descendant[i]&&ancestor[j]);
    if(x+1<width&&opposite(i+1))edges.push([[x+1,y],[x+1,y+1]]);
    if(y+1<height&&opposite(i+width))edges.push([[x,y+1],[x+1,y+1]]);
  }
  if(!edges.length)throw Error('No shared cut: cannot certify an empty measurement');
  return edges;
}
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const inside=(a,b,c,p)=>{
  const area=cross(a,b,c);if(Math.abs(area)<1e-10)return false;
  const s=Math.sign(area);return s*cross(a,b,p)>=-1e-10&&s*cross(b,c,p)>=-1e-10&&s*cross(c,a,p)>=-1e-10;
};
export function measureCutSeam({edges,ancestorMatrix,descendantMatrix,rgba,width,height,alphaMin=8}) {
  validSize(width,height);
  if(rgba.length!==width*height*4||!Number.isInteger(alphaMin)||alphaMin<0||alphaMin>=255)throw Error('Invalid seam pixels/threshold');
  if(!Array.isArray(edges)||!edges.length||edges.length>width*height*2)throw Error('Missing/bounded shared cut required');
  for(const m of [ancestorMatrix,descendantMatrix])if(!Array.isArray(m)||m.length!==6||!m.every(Number.isFinite)||Math.abs(m[0]*m[3]-m[1]*m[2])<1e-12)throw Error('Invalid pose matrix');
  const project=(m,p)=>{
    if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<0||p[0]>width||p[1]<0||p[1]>height)throw Error('Invalid cut coordinate');
    const x=p[0]/width,y=p[1]/height;
    const out=[(m[0]*x+m[2]*y+m[4])*width,(m[1]*x+m[3]*y+m[5])*height];
    if(out.some(n=>!Number.isFinite(n)||Math.abs(n)>16384))throw Error('Unbounded posed cut');return out;
  };
  const region=new Set();let offCanvas=false;
  for(const e of edges){
    if(!Array.isArray(e)||e.length!==2)throw Error('Invalid cut edge');
    const [a,b,c,d]=[project(ancestorMatrix,e[0]),project(ancestorMatrix,e[1]),project(descendantMatrix,e[1]),project(descendantMatrix,e[0])];
    const xs=[a[0],b[0],c[0],d[0]],ys=[a[1],b[1],c[1],d[1]];
    if(Math.min(...xs)<0||Math.max(...xs)>width||Math.min(...ys)<0||Math.max(...ys)>height)offCanvas=true;
    for(let y=Math.max(0,Math.floor(Math.min(...ys)));y<Math.min(height,Math.ceil(Math.max(...ys)));y++)
      for(let x=Math.max(0,Math.floor(Math.min(...xs)));x<Math.min(width,Math.ceil(Math.max(...xs)));x++)
        if(inside(a,b,c,[x+.5,y+.5])||inside(a,c,d,[x+.5,y+.5]))region.add(y*width+x);
  }
  const missing=[...region].filter(i=>rgba[i*4+3]<=alphaMin).sort((a,b)=>a-b);
  return {sharedEdges:edges.length,bridgePixels:region.size,uncoveredPixels:missing.length,missingPixelIndices:missing,offCanvas,
    status:offCanvas?'INSTRUMENT_FAIL':missing.length?'GAP':'NO_GAP_AT_CUT'};
}
