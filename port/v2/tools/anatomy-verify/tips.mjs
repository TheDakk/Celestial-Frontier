/** Track T1 step 2 — tip detector. A limb tip is a boundary pixel whose surrounding window is mostly
 * empty: a thin protrusion ends there. Crossing limbs, perspective-shortened far limbs and soft painted
 * edges do not change that. Tips are clustered, given a direction (from the local mass centre outward)
 * and a protrusion length (how far the empty-window condition persists back along the limb), then
 * classified for a template. Deterministic integer/float work on a downscaled mask; every threshold is
 * a recorded parameter. Nothing here admits anything in the game. */
import {keyAndDespill} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
import {downscaleMask} from './skeleton.mjs';
import {distanceTransform} from './thickness.mjs';
const need=(ok,m)=>{if(!ok)throw Error(m);};
/** Alpha for any RGBA: keyed masters (opaque magenta field) go through the kit keyer; alpha exports use their alpha. */
export function alphaOf(rgba,w,h){
  let opaque=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i]===255)opaque++;
  if(opaque===w*h)return {alpha:keyAndDespill(new Uint8ClampedArray(rgba.buffer,rgba.byteOffset,rgba.length),w,h).alpha,keyed:true};
  const a=new Uint8Array(w*h);for(let i=0;i<w*h;i++)a[i]=rgba[i*4+3];return {alpha:a,keyed:false};
}
function integral(mask,W,H){const I=new Int32Array((W+1)*(H+1));for(let y=0;y<H;y++){let row=0;for(let x=0;x<W;x++){row+=mask[y*W+x];I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+row;}}return (x0,y0,x1,y1)=>{x0=Math.max(0,x0);y0=Math.max(0,y0);x1=Math.min(W,x1);y1=Math.min(H,y1);if(x1<=x0||y1<=y0)return 0;return I[y1*(W+1)+x1]-I[y0*(W+1)+x1]-I[y1*(W+1)+x0]+I[y0*(W+1)+x0];};}
/** Multi-scale: a thin limb's tip shows at a small window, a thick limb's only at a large one; the union over
 * `windowRadii` (clustered) finds both. Each tip records the smallest radius that found it (its thickness class). */
export function detectTips(alpha,w,h,{solidAlpha=128,longest=512,windowRadii=[8,14,22,32,48,64],fillMax=.22,mergeRadius=12,sameToeMax=90}={}){
  const d=downscaleMask(alpha,w,h,{solidAlpha,longest}),{mask,width:W,height:H}=d,sum=integral(mask,W,H);
  const cands=[];
  for(const R of windowRadii){const area=(2*R+1)**2;
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!mask[i])continue;if(mask[i-1]&&mask[i+1]&&mask[i-W]&&mask[i+W])continue;
      const f=sum(x-R,y-R,x+R+1,y+R+1)/area;if(f<fillMax)cands.push({x,y,f,R});}}
  cands.sort((a,b)=>a.R-b.R||a.f-b.f);const tips=[];
  for(const c of cands){const near=tips.find(t=>Math.hypot(t.x-c.x,t.y-c.y)<=Math.max(mergeRadius,c.R));if(near){near.members++;near.radii.add(c.R);continue;}tips.push({x:c.x,y:c.y,f:+c.f.toFixed(3),R:c.R,members:1,radii:new Set([c.R])});}
  // Direction: from the mass centre of the solid pixels within 3R to the tip; length: how far back the limb stays thin.
  for(const t of tips){const R=t.R,area=(2*R+1)**2,r=3*R;let sx=0,sy=0,n=0;for(let y=t.y-r;y<=t.y+r;y++)for(let x=t.x-r;x<=t.x+r;x++){if(x<0||y<0||x>=W||y>=H||!mask[y*W+x])continue;sx+=x;sy+=y;n++;}
    const dx=t.x-sx/n,dy=t.y-sy/n,len=Math.hypot(dx,dy)||1;t.dir={x:+(dx/len).toFixed(2),y:+(dy/len).toFixed(2)};
    let steps=0;for(;steps<longest;steps+=2){const px=Math.round(t.x-t.dir.x*steps),py=Math.round(t.y-t.dir.y*steps);if(px<0||py<0||px>=W||py>=H||!mask[py*W+px])break;if(sum(px-R,py-R,px+R+1,py+R+1)/area>.55)break;}t.length=steps;}
  // Same-toe merge: two candidates are one tip when the straight path between them stays inside the mask and
  // never crosses anything thicker than ~1.8× the thicker of the two tips (a long tapered toe found at several
  // window sizes). A claw's two fingers fail the test because the thick palm lies between them.
  const dt=distanceTransform(mask,W,H),thick=t=>{let b=0;const r=Math.max(4,t.R);const cx=Math.round(t.x-t.dir.x*r),cy=Math.round(t.y-t.dir.y*r);for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if(x>=0&&y>=0&&x<W&&y<H&&dt[y*W+x]>b)b=dt[y*W+x];return b;};
  for(const t of tips)t.thickness=+thick(t).toFixed(1);
  tips.sort((a,b)=>a.f-b.f);const kept=[];
  for(const t of tips){let dup=false;
    for(const k of kept){const dist=Math.hypot(k.x-t.x,k.y-t.y);if(dist>sameToeMax)continue;const limit=1.8*Math.max(k.thickness,t.thickness,2),n=Math.max(2,Math.ceil(dist));let inside=true;
      for(let i=0;i<=n;i++){const x=Math.round(k.x+(t.x-k.x)*i/n),y=Math.round(k.y+(t.y-k.y)*i/n);if(!mask[y*W+x]||dt[y*W+x]>limit){inside=false;break;}}
      if(inside){k.members+=t.members;k.merged=(k.merged??0)+1;for(const r of t.radii)k.radii.add(r);dup=true;break;}}
    if(!dup)kept.push(t);}
  for(const t of kept){t.radii=[...t.radii].sort((a,b)=>a-b);t.maxRadius=t.radii[t.radii.length-1];}
  return {tips:kept,mask,dt,working:{width:W,height:H,scale:d.scale,box:d.box},params:{solidAlpha,longest,windowRadii,fillMax,mergeRadius,sameToeMax}};
}
export const TEMPLATE_TIPS={
  brachyuran:{feet:8,claws:[1,2],eyes:[0,2]},quadruped:{feet:4,head:1,tail:[0,1],ears:[0,2]},
};
/** Classify tips for a template. A walking foot is a THIN tip (distance-transform thickness within thinRatio of the
 * drawing's thin reference) that a window of at least `footMinRadius` also sees as a tip (spines and hairs vanish
 * inside a leg at that scale), that is not one of a PINCER PAIR (two thin tips within pincerMax px with empty space
 * between them: a claw's fingers), and that does not point upward from the upper body (eye stalks, antennae).
 * Direction otherwise does not matter: rear legs that point up count like legs that point down. */
export function classifyTips(det,templateId,{visibleFeet=null,thinRatio=1.6,footMinRadius=14,pincerMax=70,eyeUp=-.5,palmRatio=2.5}={}){
  const exp=TEMPLATE_TIPS[templateId];need(exp,'no tip expectation for '+templateId);
  const {tips,working:{height:H}}=det,sorted=tips.map(t=>t.thickness).sort((a,b)=>a-b),lower=sorted.slice(0,Math.max(1,Math.ceil(sorted.length/2))),thin=lower[Math.floor(lower.length/2)]??1;
  const bodyTop=Math.min(...tips.map(t=>t.y)),bodyBottom=Math.max(...tips.map(t=>t.y)),upperThird=bodyTop+(bodyBottom-bodyTop)/3;
  const classes={feet:[],pincer:[],eyes:[],spines:[],thick:[]};
  const isThin=t=>t.thickness<=thinRatio*thin;
  const pincer=new Set();
  // A pincer pair: two thin tips close together, with the claw opening (empty space) between them, whose
  // directions DIVERGE (adjacent walking feet point the same way; a claw's fingers converge or splay), and
  // which both reach thick palm (DT >= palmRatio × thin) within a short walk back. Adjacent feet fail the last two.
  const mask=det.mask,W=det.working.width,dt=det.dt,palm=palmRatio*thin;
  const reachesPalm=(t,limit)=>{for(let s=0;s<=limit;s+=2){const x=Math.round(t.x-t.dir.x*s),y=Math.round(t.y-t.dir.y*s);if(x<0||y<0||x>=W||y>=H)return false;if(!mask[y*W+x])return false;if(dt[y*W+x]>=palm)return true;}return false;};
  for(let i=0;i<tips.length;i++)for(let j=i+1;j<tips.length;j++){const a=tips[i],b=tips[j];if(!isThin(a)||!isThin(b))continue;const dist=Math.hypot(a.x-b.x,a.y-b.y);if(dist>pincerMax)continue;
    const dot=a.dir.x*b.dir.x+a.dir.y*b.dir.y;if(dot>.5)continue;
    let empty=0,n=Math.max(4,Math.ceil(dist));for(let k=1;k<n;k++){const x=Math.round(a.x+(b.x-a.x)*k/n),y=Math.round(a.y+(b.y-a.y)*k/n);if(!mask[y*W+x])empty++;}
    if(empty<n*.3)continue;
    if(reachesPalm(a,2*dist)&&reachesPalm(b,2*dist)){pincer.add(a);pincer.add(b);}}
  for(const t of tips){
    if(!isThin(t))classes.thick.push(t);
    else if(pincer.has(t))classes.pincer.push(t);
    else if(t.maxRadius<footMinRadius)classes.spines.push(t);
    else if(t.dir.y<eyeUp&&t.y<upperThird)classes.eyes.push(t);
    else classes.feet.push(t);}
  const range=v=>Array.isArray(v)?v:[v,v];const [flo,fhi]=visibleFeet!==null?[visibleFeet,visibleFeet]:range(exp.feet);const reasons=[];
  if(classes.feet.length<flo||classes.feet.length>fhi)reasons.push(`feet ${classes.feet.length} outside ${flo}-${fhi}`);
  return {templateId,thinReference:thin,counts:Object.fromEntries(Object.entries(classes).map(([k,v])=>[k,v.length])),verdict:reasons.length?'REFUSE':'ADMIT',reasons,classes};
}
