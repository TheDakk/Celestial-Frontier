/** Conservative paint-derived tail representation. No inference from a failed score. */
import {countVisibleAnatomy} from '../anatomy-verify/limb-counter.mjs';
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const profiles=new Set(['hoofed-horned','hoofed-unhorned','rabbit-hopper','bear','small-clawed-mammal','suid']);
function hull(points){const ps=[...new Map(points.map(p=>[p.join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(ps.length<3)return [];const lo=[],hi=[];for(const p of ps){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of ps.toReversed()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}return [...lo.slice(0,-1),...hi.slice(0,-1)];}
function clip(poly,projection,cut,greater){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],va=projection(a)-cut,vb=projection(b)-cut,ia=greater?va>=0:va<=0,ib=greater?vb>=0:vb<=0;if(ia)out.push(a);if(ia!==ib){const t=va/(va-vb);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out;}
export function measureCompactTail(mask,w,h,subject){
 if(w!==1254||h!==1254||subject.family!=='quadruped'||!profiles.has(subject.profile?.id))return null;
 if((subject.species?.mustRead??[]).some(s=>/tail/i.test(s)&&/long|plum|bush|quill|tuft|scal/i.test(s)))return null;
 const c=countVisibleAnatomy(mask,w,h),bw=c.bodyBox.x1-c.bodyBox.x0;
 const choices=c.appendages.filter(a=>a.class==='rear'&&a.attach.relX<.15&&a.attach.relY>.2&&a.attach.relY<.65&&a.length/bw>=.08&&a.length/bw<=.28);
 if(choices.length!==1||c.detached.length)return null;
 const a=choices[0],pts=[];for(let i=0;i<c.label.length;i++)if(c.label[i]===a.k)pts.push([(i%c.W+.5)*c.scale,(Math.floor(i/c.W)+.5)*c.scale]);
 const snap=p=>{let best=null,d=Infinity;for(let y=Math.max(1,Math.floor(p[1]-5));y<=Math.min(h-2,p[1]+5);y++)for(let x=Math.max(1,Math.floor(p[0]-5));x<=Math.min(w-2,p[0]+5);x++)if(mask[y*w+x]){const dd=(x-p[0])**2+(y-p[1])**2;if(dd<d){best=[x,y];d=dd;}}return best;};
 const root=snap([a.attach.x*c.scale,a.attach.y*c.scale]);if(!root)return null;
 const far=pts.toSorted((p,q)=>Math.hypot(q[0]-root[0],q[1]-root[1])-Math.hypot(p[0]-root[0],p[1]-root[1]))[0],tip=snap(far);if(!tip)return null;
 const dx=tip[0]-root[0],dy=tip[1]-root[1],length=Math.hypot(dx,dy),project=p=>((p[0]-root[0])*dx+(p[1]-root[1])*dy)/length;
 if(length<12||pts.some(p=>p[0]<101||p[1]<101||p[0]>1153||p[1]>1153))return null;
 // A cut stump has a broad abrupt distal cap; a naturally closed tip tapers.
 const band=t=>pts.filter(p=>project(p)>=length*t&&project(p)<length*(t+.1)).length;
 const base=band(.5),cap=band(.9);if(base<3||cap/base>.7)return null;
 const poly=hull(pts.flatMap(([x,y])=>[[x-2,y-2],[x+2,y-2],[x+2,y+2],[x-2,y+2]])),regions=[{joint:'tail0',polygonPx:clip(poly,project,length*.5,false)},{joint:'tail1',polygonPx:clip(poly,project,length*.5,true)}];
 if(regions.some(r=>r.polygonPx.length<3))return null;
 return {terminal:'tail1',visibility:'entire-root-to-tip',observation:'Measured independent rear paint branch; length/body width 0.08–0.28; upper rear attachment; one tapered closed terminal; no detached or cropped paint. All mandatory limbs remain independently checked.',landmarksPx:{tail0:root,tail1:tip},regions};
}
export function measuredTailReview({mask,w,h,masterBytes,subjectBytes,promptBytes}){const subject=JSON.parse(subjectBytes),tail=measureCompactTail(mask,w,h,subject);if(!tail)return null;const evidence={dimensions:[w,h],compactTail:tail};return {schema:'cf.reviewed-source-representation/v1',name:subject.name,family:subject.family,masterSha256:sha(masterBytes),subjectSha256:sha(subjectBytes),promptSha256:sha(promptBytes),scope:'exact-master-only-no-visual-admission',review:{method:'Measured compact-tail v1',reviewer:'Codex',observation:'Automatic source measurement, not manual visual review; replayed at intake.'},evidence,declarationSha256:sha(JSON.stringify(evidence))};}
