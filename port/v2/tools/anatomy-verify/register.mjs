/** IC-1 first cut — chain matching for a painted master against its family template: feet = tips whose ridge
 * walk-back runs thin for a while before entering the body (claw fingers enter thick palm quickly, eye stalks enter
 * from above, spines are short); each foot is assigned to a template leg by SIDE of the body centre and ANGULAR
 * ORDER around it (the guide's leg order is angular on a crab; on a quadruped it is fore/hind by x). Unassigned
 * template legs are reported as hidden candidates. Output is in master pixels. No writer; measurement only. */
import {alphaOf,detectTips,classifyTips} from './tips.mjs';
import {walkBack} from './walkback.mjs';
export function registerFeet(rgba,w,h,{templateLegs,solidAlpha=128,minThinRun=14,palmRatio=3}={}){
  const {alpha,keyed}=alphaOf(rgba,w,h),det=detectTips(alpha,w,h,{solidAlpha}),cls=classifyTips(det,'brachyuran',{}),thin=cls.thinReference,{mask,dt,working:{width:W,height:H,scale,box}}=det;
  // body centre: centroid of the thick core
  let sx=0,sy=0,n=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(mask[i]&&dt[i]>=palmRatio*thin){sx+=x;sy+=y;n++;}}const cx=sx/n,cy=sy/n;
  // Thick blobs: connected components of dt >= palmRatio×thin. The largest is the carapace/body; the others are claw palms.
  const thickLab=new Int32Array(W*H).fill(-1),blobs=[];const st=new Int32Array(W*H);
  for(let s0=0;s0<W*H;s0++){if(!mask[s0]||dt[s0]<palmRatio*thin||thickLab[s0]>=0)continue;const id=blobs.length;let top=0,n=0,sx2=0,sy2=0,x0=W,x1=0,y0=H,y1=0;st[top++]=s0;thickLab[s0]=id;
    while(top){const i=st[--top],x=i%W,y=(i-x)/W;n++;sx2+=x;sy2+=y;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(j>=0&&mask[j]&&dt[j]>=palmRatio*thin&&thickLab[j]<0){thickLab[j]=id;st[top++]=j;}}
    blobs.push({id,n,cx:sx2/n,cy:sy2/n,box:{x0,x1,y0,y1}});}
  const body=blobs.reduce((a,b)=>b.n>a.n?b:a),bodyW=body.box.x1-body.box.x0,bodyH=body.box.y1-body.box.y0;
  const blobAt=(x,y)=>{for(let r=0;r<=6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H&&thickLab[yy*W+xx]>=0)return thickLab[yy*W+xx];}return -1;};
  const cands=[];for(const t of det.tips){if(t.thickness>1.6*thin)continue;const wb=walkBack(det,t,{thin,bodyRatio:palmRatio});if(!wb.entered||wb.thinRun<minThinRun)continue;
    const e=wb.enter,blob=blobAt(e.x,e.y);const eye=blob===body.id&&e.y<cy-.2*bodyH&&Math.abs(e.x-cx)<.35*bodyW&&t.dir.y<-.3;
    cands.push({x:t.x,y:t.y,thickness:t.thickness,thinRun:wb.thinRun,len:wb.length,enter:e,blob,eye,source:'window'});}
  // Limbs whose tip rests against the body: thin components (dt < 1.6×thin) touching the body blob; their far end is a tip.
  const thinLab=new Int32Array(W*H).fill(-1);let nThin=0;const thinComps=[];
  for(let s0=0;s0<W*H;s0++){if(!mask[s0]||dt[s0]>=1.6*thin||thinLab[s0]>=0)continue;const id=nThin++;let top=0;const px=[];st[top++]=s0;thinLab[s0]=id;
    while(top){const i=st[--top];px.push(i);const x=i%W,y=(i-x)/W;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(j>=0&&mask[j]&&dt[j]<1.6*thin&&thinLab[j]<0){thinLab[j]=id;st[top++]=j;}}
    thinComps.push({id,px});}
  for(const c of thinComps){if(c.px.length<40)continue;
    // attachment = component pixels adjacent to any thick pixel; far end = component pixel farthest from the attachment centroid
    let ax=0,ay=0,an=0;for(const i of c.px){const x=i%W,y=(i-x)/W;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(j>=0&&thickLab[j]>=0){ax+=x;ay+=y;an++;break;}}
    if(!an)continue;ax/=an;ay/=an;let far=null,fd=-1;for(const i of c.px){const x=i%W,y=(i-x)/W,d=Math.hypot(x-ax,y-ay);if(d>fd){fd=d;far={x,y};}}
    if(fd<minThinRun)continue;if(cands.some(k=>Math.hypot(k.x-far.x,k.y-far.y)<40))continue;
    const bl=blobAt(Math.round(ax),Math.round(ay));cands.push({x:far.x,y:far.y,thickness:+dt[far.y*W+far.x].toFixed(1),thinRun:Math.round(fd),len:Math.round(fd),enter:{x:Math.round(ax),y:Math.round(ay)},blob:bl,eye:false,source:'thin-component'});}
  // Claw fingers: tips entering the same non-body thick blob (the palm).
  const pincer=new Set();for(const a of cands)if(a.blob>=0&&a.blob!==body.id)for(const b of cands)if(b!==a&&b.blob===a.blob){pincer.add(a);pincer.add(b);}
  const feet=cands.filter(c=>!c.eye&&!pincer.has(c)).map(c=>({...c,side:c.x<cx?'Far':'Near',angle:Math.atan2(c.y-cy,c.x<cx?cx-c.x:c.x-cx)}));
  const toMaster=p=>[Math.round(box.x+(p.x-2)/scale),Math.round(box.y+(p.y-2)/scale)];
  const assigned={},hidden=[],claws={Far:[],Near:[]};for(const c of pincer)claws[c.x<cx?'Far':'Near'].push(toMaster(c));
  for(const side of ['Far','Near']){const ordered=feet.filter(f=>f.side===side).sort((a,b)=>a.angle-b.angle); // ascending: rear/top first
    templateLegs.forEach((leg,k)=>{const f=ordered[k];if(f)assigned[leg+side+'Foot']=toMaster(f);else hidden.push(leg+side);});
    if(ordered.length>templateLegs.length)for(const f of ordered.slice(templateLegs.length))hidden.push('extra:'+side+':'+toMaster(f).join(','));}
  const eyes=cands.filter(c=>c.eye).map(c=>toMaster(c));
  return {keyed,thin,centre:toMaster({x:cx,y:cy}),feet:feet.map(f=>({...f,master:toMaster(f)})),assigned,hidden,claws,eyes};
}
