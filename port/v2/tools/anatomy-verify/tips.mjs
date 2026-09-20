/** Track T1 step 2 — tip detector. A limb tip is a boundary pixel whose surrounding window is mostly
 * empty: a thin protrusion ends there. Crossing limbs, perspective-shortened far limbs and soft painted
 * edges do not change that. Tips are clustered, given a direction (from the local mass centre outward)
 * and a protrusion length (how far the empty-window condition persists back along the limb), then
 * classified for a template. Deterministic integer/float work on a downscaled mask; every threshold is
 * a recorded parameter. Nothing here admits anything in the game. */
import {keyAndDespill} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
import {downscaleMask} from './skeleton.mjs';
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
export function detectTips(alpha,w,h,{solidAlpha=128,longest=512,windowRadii=[8,14,22,32],fillMax=.22,mergeRadius=12}={}){
  const d=downscaleMask(alpha,w,h,{solidAlpha,longest}),{mask,width:W,height:H}=d,sum=integral(mask,W,H);
  const cands=[];
  for(const R of windowRadii){const area=(2*R+1)**2;
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!mask[i])continue;if(mask[i-1]&&mask[i+1]&&mask[i-W]&&mask[i+W])continue;
      const f=sum(x-R,y-R,x+R+1,y+R+1)/area;if(f<fillMax)cands.push({x,y,f,R});}}
  cands.sort((a,b)=>a.R-b.R||a.f-b.f);const tips=[];
  for(const c of cands){const near=tips.find(t=>Math.hypot(t.x-c.x,t.y-c.y)<=Math.max(mergeRadius,c.R));if(near){near.members++;continue;}tips.push({x:c.x,y:c.y,f:+c.f.toFixed(3),R:c.R,members:1});}
  // Direction: from the mass centre of the solid pixels within 3R to the tip; length: how far back the limb stays thin.
  for(const t of tips){const R=t.R,area=(2*R+1)**2,r=3*R;let sx=0,sy=0,n=0;for(let y=t.y-r;y<=t.y+r;y++)for(let x=t.x-r;x<=t.x+r;x++){if(x<0||y<0||x>=W||y>=H||!mask[y*W+x])continue;sx+=x;sy+=y;n++;}
    const dx=t.x-sx/n,dy=t.y-sy/n,len=Math.hypot(dx,dy)||1;t.dir={x:+(dx/len).toFixed(2),y:+(dy/len).toFixed(2)};
    let steps=0;for(;steps<longest;steps+=2){const px=Math.round(t.x-t.dir.x*steps),py=Math.round(t.y-t.dir.y*steps);if(px<0||py<0||px>=W||py>=H||!mask[py*W+px])break;if(sum(px-R,py-R,px+R+1,py+R+1)/area>.55)break;}t.length=steps;}
  return {tips,working:{width:W,height:H,scale:d.scale,box:d.box},params:{solidAlpha,longest,windowRadii,fillMax,mergeRadius}};
}
export const TEMPLATE_TIPS={
  brachyuran:{feet:8,claws:[1,2],eyes:[0,2]},quadruped:{feet:4,head:1,tail:[0,1],ears:[0,2]},
};
/** Classify tips for a template. Feet: pointing down-ish with a real protrusion. Claws: forward-pointing long tips
 * in the upper-front (brachyuran). Eyes/antennae: short upward tips. Everything else is reported. */
export function classifyTips(det,templateId,{visibleFeet=null,minFootLength=12,minClawLength=10}={}){
  const exp=TEMPLATE_TIPS[templateId];need(exp,'no tip expectation for '+templateId);
  const {tips,working:{height:H}}=det,classes={feet:[],claws:[],eyes:[],other:[]};
  for(const t of tips){
    if(t.dir.y>.35&&t.length>=minFootLength)classes.feet.push(t);
    else if(templateId==='brachyuran'&&t.dir.y<=.35&&t.dir.y>-.6&&t.length>=minClawLength&&t.y<H*.75)classes.claws.push(t);
    else if(t.dir.y<-.35&&t.length<minFootLength*2)classes.eyes.push(t);
    else classes.other.push(t);}
  const range=v=>Array.isArray(v)?v:[v,v];const reasons=[];
  const [flo,fhi]=visibleFeet!==null?[visibleFeet,visibleFeet]:range(exp.feet);
  if(classes.feet.length<flo||classes.feet.length>fhi)reasons.push(`feet ${classes.feet.length} outside ${flo}-${fhi}`);
  if(exp.claws){const [lo,hi]=range(exp.claws).map(v=>v*2);const n=classes.claws.length;if(n<2||n>hi)reasons.push(`claw tips ${n} outside 2-${hi}`);}
  return {templateId,counts:Object.fromEntries(Object.entries(classes).map(([k,v])=>[k,v.length])),verdict:reasons.length?'REFUSE':'ADMIT',reasons,classes};
}
