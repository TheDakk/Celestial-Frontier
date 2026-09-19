/** Close only the point where three/four painted owners meet. Separate limb
 * boundaries are never stitched along their length. No new atlas or pigment. */
import {GRAPH} from './quadruped-template.mjs';
const parent=new Map(GRAPH);
export function paintedAncestor(parts,ancestor,descendant){
 const declared=new Map(parts.filter(p=>p.kind==='part').map(p=>[p.joint,p.id]));
 for(let j=parent.get(descendant.joint);j;j=parent.get(j))
  if((declared.get(j)??(['root','pelvis'].includes(j)?'torso':null))===ancestor.id)return true;
 return false;
}
export function ownershipJunctions(owner,parts,width,height,alpha=null){
 if(owner.length!==width*height)throw Error('Junction ownership size');
 const rows=[];
 for(let y=1;y<height;y++)for(let x=1;x<width;x++){
  const cells=[[x-1,y-1],[x,y-1],[x,y],[x-1,y]],ids=[...new Set(cells.map(([a,b])=>owner[b*width+a]))];
  if(ids.includes(0)||ids.length<3)continue;
  const ps=ids.map(i=>parts[i-1]);if(ps.some(p=>!p))throw Error('Unknown junction owner');
  const ancestor=ps.find(a=>ps.every(d=>d===a||paintedAncestor(parts,a,d)));
  if(!ancestor)continue; // Pure sibling crossings remain independent.
  const opaque=ps.filter(p=>p!==ancestor&&cells.some(([x,y])=>parts[owner[y*width+x]-1]===p&&(!alpha||alpha[y*width+x]===255)));
  const source=opaque.find(p=>p.layer==='far')??opaque[0];if(!source)throw Error('Junction has no opaque touching descendant ink');
  const pixel=cells.find(([a,b])=>parts[owner[b*width+a]-1]===source&&(!alpha||alpha[b*width+a]===255));
  rows.push({point:[x,y],ancestorPart:ancestor.id,parts:ps.map(p=>p.id),joints:ps.map(p=>p.joint),sourcePart:source.id,sourcePixel:pixel});
 }
 return rows;
}
export function junctionPoints(junction,matrices,width,height){
 const[x,y]=junction.point;
 return junction.joints.map(j=>{const m=matrices[j];if(!m||m.length!==6||!m.every(Number.isFinite))throw Error('Junction matrix');
  return[(m[0]*x/width+m[2]*y/height+m[4])*width,(m[1]*x/width+m[3]*y/height+m[5])*height];});
}
/** Native alpha, not generated geometry, determines whether the socket is closed. */
export function measureJunctions(junctions,matrices,width,height,rgba,canvasWidth,canvasHeight,origin=[0,0]){
 if(rgba.length!==canvasWidth*canvasHeight*4)throw Error('Junction native pixel size');
 const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]),missing=new Set();let offCanvas=false;
 for(const j of junctions){const ps=junctionPoints(j,matrices,width,height).map(p=>[p[0]+origin[0],p[1]+origin[1]]);
  for(let k=1;k<ps.length-1;k++){const[a,b,c]=[ps[0],ps[k],ps[k+1]],area=cross(a,b,c);if(Math.abs(area)<1e-8)continue;
   const minX=Math.floor(Math.min(a[0],b[0],c[0])),maxX=Math.ceil(Math.max(a[0],b[0],c[0])),minY=Math.floor(Math.min(a[1],b[1],c[1])),maxY=Math.ceil(Math.max(a[1],b[1],c[1]));
   if(minX<0||minY<0||maxX>canvasWidth||maxY>canvasHeight)offCanvas=true;
   const sign=Math.sign(area);for(let y=Math.max(0,minY);y<Math.min(canvasHeight,maxY);y++)for(let x=Math.max(0,minX);x<Math.min(canvasWidth,maxX);x++)
    if([[a,b],[b,c],[c,a]].every(([v,z])=>sign*cross(v,z,[x+.5,y+.5])>=0)&&rgba[(y*canvasWidth+x)*4+3]<=8)missing.add(y*canvasWidth+x);
  }
 }
 return {junctions:junctions.length,uncoveredPixels:missing.size,offCanvas,status:offCanvas?'INSTRUMENT_FAIL':missing.size?'GAP':'NO_GAP_AT_JUNCTION'};
}
