/** Source-measured torso ownership. No appendage or threshold exemption. */
const inside=(x,y,p)=>{let v=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;};
function hull(points){const ps=[...new Map(points.map(p=>[p.join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lo=[],hi=[];for(const p of ps){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of ps.toReversed()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}return [...lo.slice(0,-1),...hi.slice(0,-1)];}
export function ownMeasuredTorso({target,count,parts,landmarksPx,family,remainderPart}){
 const unchanged=reason=>({parts,evidence:{status:'UNCHANGED',reason}});
 if(!['quadruped','primate','biped-bird'].includes(family)||!count.bodyMask)return unchanged('unsupported family or missing measured core');
 if(parts.at(-1)?.id!==remainderPart||!parts.some(p=>p.joint==='spine')||parts.some(p=>p.id==='measured-torso-core'))return unchanged('no unique existing spine/remainder owner');
 const a=landmarksPx.pelvis,b=landmarksPx.chest;if(!a||!b)return unchanged('no pelvis/chest axis');
 const bodyAt=p=>count.bodyMask[Math.floor(p[1]/count.scale)*count.W+Math.floor(p[0]/count.scale)];
 if(!bodyAt(a)||!bodyAt(b))return unchanged('torso endpoints are not on measured body core');
 const dx=b[0]-a[0],dy=b[1]-a[1],length2=dx*dx+dy*dy;if(length2<1)return unchanged('degenerate torso axis');
 const pts=[];for(let i=0;i<count.bodyMask.length;i++)if(count.bodyMask[i]){const p=[(i%count.W+.5)*count.scale,(Math.floor(i/count.W)+.5)*count.scale],t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length2;if(t>=0&&t<=1)pts.push(p);}
 const polygonPx=hull(pts);if(polygonPx.length<3)return unchanged('no torso area');
 const prior=parts.filter(p=>p.id!==remainderPart);let addedPaintCells=0;
 // Refuse a hull that would sweep in any unowned non-core paint, including a
 // disconnected island, counted limb or small uncounted appendage. Existing
 // semantic owners retain exact priority and polygons.
 for(let i=0;i<count.W*count.H;i++){const x=(i%count.W+.5)*count.scale,y=(Math.floor(i/count.W)+.5)*count.scale;if(!inside(x,y,polygonPx)||!target.mask[Math.floor(y)*target.w+Math.floor(x)]||prior.some(p=>inside(x,y,p.polygonPx)))continue;if(!count.bodyMask[i])return unchanged('hull reaches unowned non-core paint');addedPaintCells++;}
 if(!addedPaintCells)return unchanged('core already owned');
 const region={id:'measured-torso-core',joint:'spine',layer:'near',polygonPx};
 return {parts:[...prior,region,parts.at(-1)],evidence:{status:'OWNED',joint:'spine',addedPaintCells,axis:[a,b],polygonPx,measurement:'unchanged limb-counter morphological body core, clipped between observed pelvis/chest; all previous owners first'}};
}
