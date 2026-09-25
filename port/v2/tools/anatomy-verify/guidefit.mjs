/** IC-1 second cut — guide-driven registration. The painting was made to match a labelled guide (the painter canvas
 * with landmarks), so: (1) find painted feet (register.mjs), (2) choose the assignment of found feet to guide feet
 * (per side, order-preserving, allowing gaps) that fits a 2-D similarity transform guide→painting with the lowest
 * residual, (3) predict every guide landmark through that transform, (4) refine each prediction on the painting's
 * ridge (nearest solid pixel maximizing DT within a radius), (5) a prediction with no paint within reach is hidden.
 * Deterministic. Scored against hand landmarks; not a writer. */
import {registerFeet} from './register.mjs';
import {alphaOf,detectTips} from './tips.mjs';
/** Least-squares similarity (scale, rotation, translation) from point pairs [[gx,gy],[px,py]]. */
export function fitSimilarity(pairs){
  const n=pairs.length;let gx=0,gy=0,px=0,py=0;for(const [g,p] of pairs){gx+=g[0];gy+=g[1];px+=p[0];py+=p[1];}gx/=n;gy/=n;px/=n;py/=n;
  let sxx=0,sxy=0,syx=0,syy=0,gg=0;for(const [g,p] of pairs){const a=g[0]-gx,b=g[1]-gy,c=p[0]-px,d=p[1]-py;sxx+=a*c;sxy+=a*d;syx+=b*c;syy+=b*d;gg+=a*a+b*b;}
  const cos=sxx+syy,sin=sxy-syx,theta=Math.atan2(sin,cos),s=Math.hypot(cos,sin)/gg;
  const T={s,theta,tx:px-s*(Math.cos(theta)*gx-Math.sin(theta)*gy),ty:py-s*(Math.sin(theta)*gx+Math.cos(theta)*gy)};
  const apply=g=>[T.s*(Math.cos(T.theta)*g[0]-Math.sin(T.theta)*g[1])+T.tx,T.s*(Math.sin(T.theta)*g[0]+Math.cos(T.theta)*g[1])+T.ty];
  let res=0;for(const [g,p] of pairs){const q=apply(g);res+=Math.hypot(q[0]-p[0],q[1]-p[1]);}
  return {...T,apply,residual:res/n};
}
const combos=(arr,k)=>{const out=[];const rec=(start,acc)=>{if(acc.length===k){out.push(acc);return;}for(let i=start;i<arr.length;i++)rec(i+1,[...acc,arr[i]]);};rec(0,[]);return out;};
export function registerWithGuide(rgba,w,h,guideRecord,{templateLegs=['leg0','leg1','leg2','leg3'],refineRadius=.06}={}){
  const gW=guideRecord.geometry.width,gH=guideRecord.geometry.height,G={};for(const [k,v] of Object.entries(guideRecord.landmarks))G[k]=[v[0]*gW,v[1]*gH];
  const reg=registerFeet(rgba,w,h,{templateLegs});
  // candidate feet per side in angular order (master px)
  const sides={Far:reg.feet.filter(f=>f.side==='Far').sort((a,b)=>a.angle-b.angle).map(f=>f.master),Near:reg.feet.filter(f=>f.side==='Near').sort((a,b)=>a.angle-b.angle).map(f=>f.master)};
  const slots=side=>templateLegs.map(l=>l+side+'Foot');
  let best=null;
  const farOpts=combos(slots('Far'),Math.min(sides.Far.length,4)),nearOpts=combos(slots('Near'),Math.min(sides.Near.length,4));
  for(const fo of farOpts)for(const no of nearOpts){
    const pairs=[];fo.forEach((name,i)=>pairs.push([G[name],sides.Far[i]]));no.forEach((name,i)=>pairs.push([G[name],sides.Near[i]]));
    if(pairs.length<3)continue;const T=fitSimilarity(pairs);if(!best||T.residual<best.T.residual)best={T,fo,no,pairs};}
  if(!best)return {status:'INSUFFICIENT',reg};
  // predict every guide landmark, then refine on the painting ridge
  const {alpha}=alphaOf(rgba,w,h),det=detectTips(alpha,w,h,{solidAlpha:128}),{mask,dt,working:{width:W,height:H,scale,box}}=det;
  const toWork=p=>[(p[0]-box.x)*scale+2,(p[1]-box.y)*scale+2],toMaster=p=>[Math.round(box.x+(p[0]-2)/scale),Math.round(box.y+(p[1]-2)/scale)];
  const r=Math.round(refineRadius*Math.max(W,H));
  const predicted={},refined={},hidden=[];
  for(const [name,g] of Object.entries(G)){const p=best.T.apply(g);predicted[name]=p.map(Math.round);const q=toWork(p);let bx=-1,by=-1,bs=-1;
    for(let y=Math.round(q[1])-r;y<=q[1]+r;y++)for(let x=Math.round(q[0])-r;x<=q[0]+r;x++){if(x<0||y<0||x>=W||y>=H||!mask[y*W+x])continue;const d=Math.hypot(x-q[0],y-q[1]);if(d>r)continue;const score=dt[y*W+x]-d*.5;if(score>bs){bs=score;bx=x;by=y;}}
    if(bx<0)hidden.push(name);else refined[name]=toMaster([bx,by]);}
  return {status:'OK',transform:{scale:+best.T.s.toFixed(3),rotationDeg:+(best.T.theta*180/Math.PI).toFixed(1),residualPx:+best.T.residual.toFixed(1)},matched:[...best.fo,...best.no],predicted,refined,hidden,feetFound:reg.feet.length};
}
