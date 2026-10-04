/** Diagnostic only: close a transferred distal part to original silhouette behind its existing proximal edge. */
import {ownerRaster} from '../../port/v2/tools/anatomy-verify/limb-separation.mjs';
import {traceRegion} from '../../port/v2/tools/anatomy-verify/leaf-growth.mjs';
export function closeDistalContour({mask,w,h,parts,remainderPart,partId,joint,parent}){
 const k=parts.findIndex(p=>p.id===partId),rem=parts.findIndex(p=>p.id===remainderPart);if(k<0||rem<0)throw Error('declared owners required');
 const p=parts[k],dx=parent[0]-joint[0],dy=parent[1]-joint[1],length=Math.hypot(dx,dy);if(!length)throw Error('distinct joint direction required');
 const projection=([x,y])=>((x-joint[0])*dx+(y-joint[1])*dy)/length;
 const edges=p.polygonPx.map((a,i)=>{const b=p.polygonPx[(i+1)%p.polygonPx.length];return {a,b,score:(projection(a)+projection(b))/2};}).sort((a,b)=>b.score-a.score);
 const {a,b}=edges[0],cross=([x,y])=>(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]),sign=Math.sign(cross(joint));if(!sign)throw Error('joint lies on proximal cut');
 const own=ownerRaster(parts,w,h),region=new Uint8Array(w*h);let gained=0,original=0;
 for(let i=0;i<region.length;i++){if(!mask[i])continue;const x=i%w+.5,y=Math.floor(i/w)+.5;if(own[i]===k){region[i]=1;original++;}else if((own[i]<0||own[i]===rem)&&sign*cross([x,y])>=0){region[i]=1;gained++;}}
 // A detached rear island is not evidence of this appendage. Keep only regions connected to an original owned seed.
 const reachable=new Uint8Array(w*h),queue=[];for(let i=0;i<region.length;i++)if(region[i]&&own[i]===k){reachable[i]=1;queue.push(i);}
 for(let q=0;q<queue.length;q++){const i=queue[q],x=i%w,y=Math.floor(i/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const j=Y*w+X;if(region[j]&&!reachable[j]){reachable[j]=1;queue.push(j);}}}
 const polygon=traceRegion(reachable,w,h,.5);if(!polygon)throw Error('no contour');
 return {part:{...p,polygonPx:polygon},receipt:{partId,proximalCut:[a,b],joint,parent,originalPixels:original,candidateAddedPixels:gained,rule:'original source alpha behind existing most-proximal transferred edge; original owner pixels seed contour; tracing can reassign boundary pixels; only remainder/unclaimed eligible for growth'}};
}
