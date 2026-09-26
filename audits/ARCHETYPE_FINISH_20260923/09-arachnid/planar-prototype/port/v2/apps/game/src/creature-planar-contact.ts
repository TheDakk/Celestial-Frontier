/** Finite planar translation candidates for rigid two-bone painted contacts.
 * Feasible translations lie inside the original root disk and every outer
 * reach disk, outside every inner disk, and on/under the source y=0 axis.
 * This planner does not solve joints, clamp points or admit a painted pose. */
export interface PlanarReach {readonly center:{readonly x:number;readonly y:number};readonly min:number;readonly max:number;}
export interface PlanarTranslation {readonly x:number;readonly y:number;}
interface Circle {x:number;y:number;r:number;}
export function planarContactCandidates(reach:readonly PlanarReach[],bound:number):readonly PlanarTranslation[]{
 if(!Array.isArray(reach)||!reach.length||!Number.isFinite(bound)||bound<=0)throw Error('Planar contact: finite positive bound and reach inventory required');
 const circles:Circle[]=[{x:0,y:0,r:bound}],annuli=reach.map(a=>{
  if(!a||!a.center||![a.center.x,a.center.y,a.min,a.max].every(Number.isFinite)||a.min<0||a.max<=0||a.min>a.max)throw Error('Planar contact: invalid reach annulus');
  const value={center:{x:a.center.x,y:a.center.y},min:a.min,max:a.max};circles.push({x:a.center.x,y:a.center.y,r:a.max});if(a.min>0)circles.push({x:a.center.x,y:a.center.y,r:a.min});return value;
 });
 const candidates:PlanarTranslation[]=[];
 const add=(x:number,y:number)=>{x=x===0?0:x;y=y===0?0:y;
  if(!Number.isFinite(x)||!Number.isFinite(y)||y<0||Math.hypot(x,y)>bound)return;
  for(const a of annuli){const d=Math.hypot(x-a.center.x,y-a.center.y);if(d<a.min||d>a.max)return;}
  if(!candidates.some(p=>p.x===x&&p.y===y))candidates.push(Object.freeze({x,y}));
 };
 add(0,0);
 for(const c of circles){const d=Math.hypot(c.x,c.y);
  if(d===0){add(c.r,0);add(-c.r,0);add(0,c.r);}else for(const sign of [-1,1]){const s=1+sign*c.r/d;add(c.x*s,c.y*s);}
  const squared=c.r*c.r-c.y*c.y;if(squared>=0){const x=Math.sqrt(squared);add(c.x-x,0);add(c.x+x,0);}
 }
 for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++){
  const a=circles[i]!,b=circles[j]!,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  if(d===0||d>a.r+b.r||d<Math.abs(a.r-b.r))continue;
  const along=(a.r*a.r-b.r*b.r+d*d)/(2*d),squared=a.r*a.r-along*along;if(squared<0)continue;
  const h=Math.sqrt(squared),ux=dx/d,uy=dy/d,x=a.x+ux*along,y=a.y+uy*along;
  add(x-uy*h,y+ux*h);add(x+uy*h,y-ux*h);
 }
 // Boundary arithmetic can be feasible here yet round outside after the
 // actual skeleton transform. Add finite, strict interior alternatives rather
 // than changing any guard: one midpoint per feasible interval on each already
 // feasible nonzero boundary ray. Inner disks split, rather than widen, it.
 for(const direction of candidates.slice()){
  const length=Math.hypot(direction.x,direction.y),a=direction.x*direction.x+direction.y*direction.y;
  if(length===0||!Number.isFinite(a)||a<=0)continue;
  const roots=(center:{x:number;y:number},radius:number):readonly [number,number]|null=>{
   const b=center.x*direction.x+center.y*direction.y,cross=center.x*direction.y-center.y*direction.x,discriminant=a*radius*radius-cross*cross;
   if(!Number.isFinite(discriminant)||discriminant<0)return null;
   const h=Math.sqrt(discriminant),lo=(b-h)/a,hi=(b+h)/a;return Number.isFinite(lo)&&Number.isFinite(hi)?[lo,hi]:null;
  };
  let lo=0,hi=bound/length,possible=true;
  for(const annulus of annuli){const span=roots(annulus.center,annulus.max);if(!span){possible=false;break;}lo=Math.max(lo,span[0]);hi=Math.min(hi,span[1]);if(lo>hi){possible=false;break;}}
  if(!possible||!(hi>lo))continue;
  let intervals:Array<readonly [number,number]>=[[lo,hi]];
  for(const annulus of annuli){if(annulus.min===0)continue;const hole=roots(annulus.center,annulus.min);if(!hole)continue;
   const remaining:Array<readonly [number,number]>=[];
   for(const [start,end]of intervals){if(hole[1]<=start||hole[0]>=end){remaining.push([start,end]);continue;}if(hole[0]>=start)remaining.push([start,Math.min(end,hole[0])]);if(hole[1]<=end)remaining.push([Math.max(start,hole[1]),end]);}
   intervals=remaining;
  }
  for(const [start,end]of intervals){const middle=start+(end-start)/2;if(start<middle&&middle<end)add(direction.x*middle,direction.y*middle);}
 }
 candidates.sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y)||a.x-b.x||a.y-b.y);
 return Object.freeze(candidates);
}
