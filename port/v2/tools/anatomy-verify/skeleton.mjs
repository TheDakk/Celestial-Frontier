/** Track T1 slice 2 — thinned-skeleton anatomy counting. The solid silhouette is downscaled to a fixed
 * working size (scale-invariant), thinned to a one-pixel skeleton (Zhang–Suen), and the skeleton's
 * endpoints are classified by where they sit relative to the body box: tips reaching the ground band
 * are feet, tips at the front/back extremes are head/claws/tail candidates. Crossing legs share a
 * junction but keep their own tips, so tips count limbs where components cannot. Deterministic. */
const need=(ok,m)=>{if(!ok)throw Error(m);};
export function downscaleMask(alpha,w,h,{solidAlpha=250,longest=256}={}){
  let minx=w,maxx=-1,miny=h,maxy=-1;for(let i=0;i<w*h;i++)if(alpha[i]>=solidAlpha){const x=i%w,y=(i-x)/w;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;}
  need(maxx>=0,'empty silhouette');const bw=maxx-minx+1,bh=maxy-miny+1,s=longest/Math.max(bw,bh),W=Math.max(8,Math.round(bw*s))+4,H=Math.max(8,Math.round(bh*s))+4;
  const out=new Uint8Array(W*H);
  for(let y=0;y<H-4;y++)for(let x=0;x<W-4;x++){const x0=minx+Math.floor(x/s),x1=Math.min(maxx,minx+Math.floor((x+1)/s)),y0=miny+Math.floor(y/s),y1=Math.min(maxy,miny+Math.floor((y+1)/s));let hit=0,n=0;
    for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++){n++;if(alpha[yy*w+xx]>=solidAlpha)hit++;}out[(y+2)*W+x+2]=hit*2>=n?1:0;}
  return {mask:out,width:W,height:H,scale:s,box:{x:minx,y:miny,width:bw,height:bh}};
}
/** Zhang–Suen thinning on a 0/1 mask (with a 2-px empty border). */
export function thin(mask,W,H){
  const m=Uint8Array.from(mask);const at=(x,y)=>m[y*W+x];let changed=true;
  while(changed){changed=false;
    for(const pass of [0,1]){const del=[];
      for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){if(!at(x,y))continue;
        const p=[at(x,y-1),at(x+1,y-1),at(x+1,y),at(x+1,y+1),at(x,y+1),at(x-1,y+1),at(x-1,y),at(x-1,y-1)];
        const b=p.reduce((a,v)=>a+v,0);if(b<2||b>6)continue;
        let a=0;for(let k=0;k<8;k++)if(!p[k]&&p[(k+1)%8])a++;if(a!==1)continue;
        if(pass===0?(p[0]*p[2]*p[4]||p[2]*p[4]*p[6]):(p[0]*p[2]*p[6]||p[0]*p[4]*p[6]))continue;
        del.push(y*W+x);}
      for(const i of del)m[i]=0;if(del.length)changed=true;}
  }
  return m;
}
/** Prune spurs shorter than `minSpur` (skeleton branches from an endpoint to the first junction). */
export function pruneSpurs(skel,W,H,minSpur){
  const m=Uint8Array.from(skel);const nb=(x,y)=>{const o=[];for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H&&m[yy*W+xx])o.push(yy*W+xx);}return o;};
  let removed=true;while(removed){removed=false;
    for(let i=0;i<W*H;i++){if(!m[i])continue;const x=i%W,y=(i-x)/W;if(nb(x,y).length!==1)continue;
      const path=[i];let cur=i,prev=-1;
      while(path.length<=minSpur){const cx=cur%W,cy=(cur-cx)/W,n=nb(cx,cy).filter(j=>j!==prev);if(n.length!==1)break;prev=cur;cur=n[0];path.push(cur);const cx2=cur%W,cy2=(cur-cx2)/W;if(nb(cx2,cy2).length>2)break;}
      const lx=path[path.length-1]%W,ly=(path[path.length-1]-lx)/W;
      if(path.length<=minSpur&&nb(lx,ly).length>2){for(const j of path.slice(0,-1))m[j]=0;removed=true;}}}
  return m;
}
export function skeletonGraph(skel,W,H){
  const endpoints=[],junctions=[];
  for(let i=0;i<W*H;i++){if(!skel[i])continue;const x=i%W,y=(i-x)/W;let n=0;for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H&&skel[yy*W+xx])n++;}
    if(n===1)endpoints.push({x,y});else if(n>=3)junctions.push({x,y});}
  return {endpoints,junctions,pixels:skel.reduce((a,b)=>a+b,0)};
}
export const EXPECTED_TIPS={
  quadruped:{feet:4},hopper:{feet:4},primate:{feet:2},'biped-bird':{feet:2},'flyer-membrane':{feet:2},insect:{feet:6},arachnid:{feet:8},myriapod:{feet:[8,64]},
  brachyuran:{feet:8,claws:2},'crustacean-clawed':{feet:8,claws:2},'crustacean-small':{feet:10},fish:{feet:0},serpent:{feet:0},cephalopod:{feet:0},
};
/** Count tips: feet = endpoints in the bottom band of the silhouette box; front/back tips by x extremes. */
export function countTips(alpha,w,h,templateId,{solidAlpha=250,longest=256,minSpur=6,groundBand=.22}={}){
  const exp=EXPECTED_TIPS[templateId];need(exp,'no expectation for '+templateId);
  const d=downscaleMask(alpha,w,h,{solidAlpha,longest}),skel=pruneSpurs(thin(d.mask,d.width,d.height),d.width,d.height,minSpur),g=skeletonGraph(skel,d.width,d.height);
  const bottom=(d.height-4)*(1-groundBand)+2;
  const feet=g.endpoints.filter(e=>e.y>=bottom),others=g.endpoints.filter(e=>e.y<bottom);
  const range=v=>Array.isArray(v)?v:[v,v];const [lo,hi]=range(exp.feet);const reasons=[];
  if(feet.length<lo||feet.length>hi)reasons.push(`feet ${feet.length} outside ${lo}-${hi}`);
  return {templateId,counts:{feet:feet.length,otherTips:others.length,junctions:g.junctions.length,skeletonPixels:g.pixels},expected:exp,verdict:reasons.length?'REFUSE':'ADMIT',reasons,working:{width:d.width,height:d.height,scale:d.scale},feet,others,skeleton:skel};
}
