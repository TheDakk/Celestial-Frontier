/** IC-1 third cut — root-anchored registration. What a painting preserves from its guide is the BODY: the carapace's
 * box and the order of limb roots along its sides. So: (1) transform guide→painting from the carapace box alone;
 * (2) predict the body-attached joints (leg roots, claw bases, eye roots) through it and snap them to paint;
 * (3) grow each leg outward from its root along the painting's ridge (no global pose assumption), the walk's end is
 * the foot, the knee sits at the guide's segment ratio along the walk; (4) grow each claw outward through thick paint
 * to the palm and take the two nearest thin tips as fingers; (5) an eye is the nearest detected tip above its root;
 * (6) a leg whose walk finds no thin path is hidden. Deterministic; scored, not a writer. */
import {alphaOf,detectTips,classifyTips} from './tips.mjs';
export function registerByRoots(rgba,w,h,guide,{palmRatio=3,maxWalk=900}={}){
  const {alpha}=alphaOf(rgba,w,h),det=detectTips(alpha,w,h,{solidAlpha:128}),cls=classifyTips(det,'brachyuran',{}),thin=cls.thinReference,{mask,dt,working:{width:W,height:H,scale,box}}=det;
  const toM=p=>[Math.round(box.x+(p[0]-2)/scale),Math.round(box.y+(p[1]-2)/scale)];
  // painting thick core box/centroid
  let x0=W,x1=0,y0=H,y1=0,sx=0,sy=0,n=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!mask[i]||dt[i]<palmRatio*thin)continue;n++;sx+=x;sy+=y;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  const cx=sx/n,cy=sy/n,core={x0,x1,y0,y1,w:x1-x0+1,h:y1-y0+1};
  // guide carapace box (working px of the guide are guide px)
  const g=guide.carapaceBox,gW=guide.width;const T=p=>[(p[0]-(g.x0+g.w/2))*(core.w/g.w)+(core.x0+core.w/2),(p[1]-(g.y0+g.h/2))*(core.h/g.h)+(core.y0+core.h/2)];
  const inMask=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&mask[y*W+x];
  const snap=(p,r=20)=>{let best=null,bd=1e9;for(let y=Math.round(p[1])-r;y<=p[1]+r;y++)for(let x=Math.round(p[0])-r;x<=p[0]+r;x++){if(!inMask(x,y))continue;const d=Math.hypot(x-p[0],y-p[1]);if(d<bd){bd=d;best=[x,y];}}return best;};
  const G=guide.landmarks; // guide px
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  // outward ridge walk from a start point with an initial direction; stays out of the thick core once it has left it
  const walk=(start,dir,{allowThick=false})=>{const path=[start];const seen=new Set([start[1]*W+start[0]]);let [x,y]=start,exited=false,heading=dir;
    for(let s=0;s<maxWalk;s++){let best=null,bs=-1e9;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy,j=ny*W+nx;if(!inMask(nx,ny)||seen.has(j))continue;const thick=dt[j]>=palmRatio*thin;if(exited&&thick&&!allowThick)continue;
        const fwd=dx*heading[0]+dy*heading[1];if(!exited&&fwd<0)continue;const score=dt[j]*(exited?1:.3)+fwd*3*(exited?.5:1)+(exited?0:(Math.hypot(nx-cx,ny-cy)-Math.hypot(x-cx,y-cy))*2);if(score>bs){bs=score;best=[nx,ny];}}
      if(!best)break;seen.add(best[1]*W+best[0]);if(!exited&&dt[best[1]*W+best[0]]<palmRatio*thin)exited=true;const hl=Math.hypot(best[0]-x,best[1]-y);heading=[heading[0]*.7+(best[0]-x)/hl*.3,heading[1]*.7+(best[1]-y)/hl*.3];const hn=Math.hypot(heading[0],heading[1]);heading=[heading[0]/hn,heading[1]/hn];[x,y]=best;path.push(best);}
    return {path,exited};};
  const out={roots:{},feet:{},knees:{},claws:{},eyes:{},hidden:[],core:{box:[toM([x0,y0]),toM([x1,y1])],centre:toM([cx,cy])}};
  const arc=path=>{const a=[0];for(let i=1;i<path.length;i++)a.push(a[i-1]+dist(path[i],path[i-1]));return a;};
  for(const side of ['Far','Near'])for(const leg of ['leg0','leg1','leg2','leg3']){const root=G[leg+side+'Root'],knee=G[leg+side+'Knee'],foot=G[leg+side+'Foot'];if(!root||!knee||!foot)continue;
    const pr=T(root),sp=snap(pr);if(!sp){out.hidden.push(leg+side);continue;}out.roots[leg+side+'Root']=toM(sp);
    const d0=[knee[0]-root[0],knee[1]-root[1]],dn=Math.hypot(d0[0],d0[1]),dir=[d0[0]/dn,d0[1]/dn];const wk=walk(sp,dir,{});
    if(!wk.exited||wk.path.length<20){out.hidden.push(leg+side);continue;}
    const a=arc(wk.path),total=a[a.length-1],ratio=dist(root,knee)/(dist(root,knee)+dist(knee,foot));let ki=a.findIndex(v=>v>=total*ratio);if(ki<0)ki=wk.path.length-1;
    out.feet[leg+side+'Foot']=toM(wk.path[wk.path.length-1]);out.knees[leg+side+'Knee']=toM(wk.path[ki]);}
  for(const side of ['Far','Near']){const base=G['claw'+side+'Base'],elbow=G['claw'+side+'Elbow'],palm=G['claw'+side+'Palm'];if(!base)continue;const pb=T(base),sp=snap(pb);if(!sp)continue;out.claws['claw'+side+'Base']=toM(sp);
    const d0=[elbow[0]-base[0],elbow[1]-base[1]],dn=Math.hypot(d0[0],d0[1]);const wk=walk(sp,[d0[0]/dn,d0[1]/dn],{allowThick:true});
    // palm = the point of maximum DT along the walk beyond the first third
    let pi=0,pd=-1;for(let i=Math.floor(wk.path.length/3);i<wk.path.length;i++){const p=wk.path[i],v=dt[p[1]*W+p[0]];if(v>pd){pd=v;pi=i;}}const palmPt=wk.path[pi];out.claws['claw'+side+'Palm']=toM(palmPt);out.claws['claw'+side+'Elbow']=toM(wk.path[Math.floor(pi/2)]);
    const tips=det.tips.filter(t=>t.thickness<=1.6*thin).map(t=>({t,d:dist([t.x,t.y],palmPt)})).filter(o=>o.d<=4*pd).sort((a,b)=>a.d-b.d).slice(0,2);
    tips.forEach((o,i)=>{out.claws['claw'+side+(i?'DactylTip':'FixedTip')]=toM([o.t.x,o.t.y]);});}
  for(const side of ['Far','Near']){const root=G['eye'+side+'Root'];if(!root)continue;const pr=T(root);const cand=det.tips.filter(t=>t.y<pr[1]&&dist([t.x,t.y],pr)<.25*core.w).sort((a,b)=>dist([a.x,a.y],pr)-dist([b.x,b.y],pr))[0];out.eyes['eye'+side+'Root']=toM(snap(pr)??pr);if(cand)out.eyes['eye'+side+'Tip']=toM([cand.x,cand.y]);}
  return out;
}
