/** Source-stage capture shared by every topology observer. Authoring only: no
 * allocation/readback without an explicit capture request, no RNG or repaint. */
import type {ArtContext2D} from './speciescanvas.js';
import {readPainterPrefix,verifyPainterPrefix} from './painter-prefix-replay.js';
import {PainterPartCapture,type PaintedPart} from './painter-part-capture.js';
export function createTopologyPartCapture(c:ArtContext2D){
 const masks=new PainterPartCapture(c.canvas.width,c.canvas.height,()=>readPainterPrefix(c));
 const stage=(id:string,joint:string,layer:'far'|'near'='near')=>masks.begin([{id,joint,layer}]);
 const chain=(parts:readonly PaintedPart[],points:readonly(readonly[number,number])[])=>{
  if(points.length!==parts.length+1)throw Error('Topology masks: source chain');
  const m=c.getTransform(),axis:Array<readonly[number,number]>=[];
  // Equal samples per anatomical link preserve the authored elbow/knee split.
  for(let k=0;k<parts.length;k++)for(let i=0;i<32;i++){const a=points[k]!,b=points[k+1]!,t=i/32,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;axis.push([m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);}
  const end=points.at(-1)!;axis.push([m.a*end[0]+m.c*end[1]+m.e,m.b*end[0]+m.d*end[1]+m.f]);
  masks.begin(parts,axis,parts.slice(1).map((_,i)=>(i+1)/parts.length));
 };
 return {stage,chain,finish:()=>({...masks.finish(),replay:verifyPainterPrefix(c)})};
}
export type TopologyPartCapture=ReturnType<typeof createTopologyPartCapture>;
