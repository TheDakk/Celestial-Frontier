/** Source-only distal branch count; no caller anatomy enters this measurement. */
import {workingMask} from './limb-counter.mjs';
import {erodeAlpha} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
export function distalSprawlCount(mask,w,h,T){
 const{g,W,H,scale}=workingMask(mask,w,h,T.params.longest);if(W!==T.W||H!==T.H)throw Error('Distal count: source grid mismatch');
 // The same measured core radius removes only the proximal collar. Existing
 // independent appendage labels constrain the candidates; no new paint appears.
 const inverse=Uint8Array.from(g,(_,i)=>g[i]&&T.label[i]<0?0:255),outside=erodeAlpha(inverse,W,H,T.coreRadius),eligible=Uint8Array.from(g,(v,i)=>v&&T.label[i]>=0&&outside[i]?1:0),label=new Int32Array(W*H).fill(-1),appendages=[],seen=new Uint8Array(W*H);
 for(let s=0;s<eligible.length;s++){
  if(!eligible[s]||seen[s])continue;const queue=[s],cells=[];seen[s]=1;let sx=0,sy=0,x0=W,x1=-1,y0=H,y1=-1;
  for(let j=0;j<queue.length;j++){const i=queue[j],x=i%W,y=Math.floor(i/W);cells.push(i);sx+=x;sy+=y;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy,k=Y*W+X;if(X>=0&&Y>=0&&X<W&&Y<H&&eligible[k]&&!seen[k]){seen[k]=1;queue.push(k);}}}
  if(cells.length<T.params.minAppendageFrac*T.paint)continue;
  const origins=new Set(cells.map(i=>T.label[i]));if(origins.size!==1)throw Error('Distal count: crossed source components');const parent=T.appendages.find(a=>a.k===[...origins][0]);if(!parent)throw Error('Distal count: missing parent');const dx=sx/cells.length-parent.attach.x,dy=sy/cells.length-parent.attach.y,len=Math.hypot(dx,dy)||1,k=appendages.length;
  for(const i of cells)label[i]=k;
  appendages.push({...parent,k,sourceComponent:parent.k,frac:cells.length/T.paint,pixels:cells.length,box:{x0,x1,y0,y1},dir:{x:dx/len,y:dy/len}});
 }
 return{...T,label,appendages,measurement:'source-distal-collar-v1',collarRadius:T.coreRadius};
}
