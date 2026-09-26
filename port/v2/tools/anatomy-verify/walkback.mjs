/** Track T1 step 3 (first cut) — walk each tip back into the body along the distance-transform ridge and record the
 * path's thickness profile and the point where it enters the body (DT >= bodyRatio × the drawing's thin reference).
 * A walking leg walks a long thin path before entering; a claw finger enters the thick palm within a short walk and
 * shares that palm with its twin; an eye stalk enters the carapace top; a spine enters a limb almost at once.
 * Deterministic greedy ascent on DT with a no-return rule. */
export function walkBack(det,tip,{thin,bodyRatio=3,maxSteps=400}={}){
  const {mask,dt,working:{width:W,height:H}}=det;let x=tip.x,y=tip.y,prev=-1;const path=[];const visited=new Set();
  for(let step=0;step<maxSteps;step++){const i=y*W+x;if(!mask[i])break;visited.add(i);path.push({x,y,dt:+dt[i].toFixed(1)});
    if(dt[i]>=bodyRatio*thin)return {entered:true,length:step,path,enter:{x,y,dt:+dt[i].toFixed(1)},thinRun:path.filter(p=>p.dt<1.6*thin).length};
    // next: the unvisited neighbour with the highest DT that does not move back toward the tip
    let best=-1,bx=x,by=y;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(!mask[j]||visited.has(j))continue;
      const away=(nx-tip.x)*(-tip.dir.x)+(ny-tip.y)*(-tip.dir.y);const score=dt[j]+away*.02;if(score>best){best=score;bx=nx;by=ny;}}
    if(best<0)break;x=bx;y=by;}
  return {entered:false,length:path.length,path,enter:null,thinRun:path.filter(p=>p.dt<1.6*thin).length};
}
