/** P7 — labels: every painting pixel assigned to a part by GEODESIC distance (inside the mask) to the named ridge
 * paths the matcher produced. Sources: each named leg's path (exit → tip), each claw chain's path, the thick region
 * (body). A leg's pixels split into upper/lower at the knee: the pixel's nearest path sample lies before or after the
 * slot's first interior-joint fraction. Family-free: part ids are `<slotId>-upper|lower`, `claw<Side>`, `body`, the
 * same vocabulary as Codex's declarations, so the two label maps compare part by part (IoU at master scale). Nothing
 * here writes a fit; `scoreLabels` is comparison against Codex's hand labels, never an input. */
import {templateRest} from './template-rest.mjs';
export function labelParts(res,template,{bodyBand=0,seedMode='ridge',legSeedFrom=0}={}){const T=templateRest(template);const {W,H,mask,bodyDist}=res.working;
  const parts=[];const src=new Int32Array(W*H).fill(-1),srcIdx=new Int32Array(W*H).fill(-1),dist=new Float32Array(W*H).fill(1e9);const q=[];
  const seed=(pid,pts)=>{const id=parts.length;parts.push(pid);for(let k=0;k<pts.length;k++){const [x,y]=pts[k].map(Math.round);const i=y*W+x;if(i<0||i>=W*H||!mask[i])continue;if(dist[i]>0){dist[i]=0;src[i]=id;srcIdx[i]=k;q.push(i);}}return id;};
  // body: the thick region
  // body seed: the thick region plus a band around it (bodyBand × R) so the carapace rim is not cut by leg paths
  if(seedMode==='region'){const R=res.R;const pts=[];for(let i=0;i<W*H;i++)if(mask[i]&&bodyDist[i]<=bodyBand*R)pts.push([i%W,Math.floor(i/W)]);seed('body',pts);}
  else seed('body',res.bodyRidge); // 'ridge': the body's own ridge pixels (thick edges not on a claw chain), so the claw arm/palm — as thick as the carapace — is claimed by the claw ridge, not the body
  // legs seed from `legSeedFrom` × R outside the thick region so the carapace rim near a leg root stays body
  const legPaths={};for(const side of ['Far','Near'])for(const sl of T.slots[side]){const a=res.assigned[sl.terminal];if(!a||!a.path)continue;legPaths[sl.id]=a.path;const R=res.R;const pts=a.path.filter(([x,y])=>bodyDist[Math.round(y)*W+Math.round(x)]>=legSeedFrom*R);seed(sl.id,pts.length>1?pts:a.path);}
  res.clawPaths.forEach((c,k)=>{const p=seedMode==='ridge'?(c.fullPath??c.path):c.path;if(p)seed('claw'+(c.side??k),p);});
  // multi-source chamfer Dijkstra (bucketed) inside the mask
  const heap=q.map(i=>[0,i]);const pop=()=>{let b=0;for(let k=1;k<heap.length;k++)if(heap[k][0]<heap[b][0])b=k;const v=heap[b];heap[b]=heap[heap.length-1];heap.pop();return v;};
  // simple O(n log n) via sorted insertion would be slow; use integer-ish buckets on 0.5 px
  const buckets=new Map();const push=(d,i)=>{const b=Math.round(d*2);if(!buckets.has(b))buckets.set(b,[]);buckets.get(b).push(i);};for(const i of q)push(0,i);
  let bmin=0,bmax=0;for(const b of buckets.keys())bmax=Math.max(bmax,b);let processed=0;
  for(let b=0;b<=bmax;b++){const list=buckets.get(b);if(!list)continue;for(let n=0;n<list.length;n++){const i=list[n];const d=dist[i];if(Math.round(d*2)!==b)continue;const x=i%W,y=(i-x)/W;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(!mask[j])continue;const nd=d+(dx&&dy?1.4142:1);if(nd<dist[j]-1e-6){dist[j]=nd;src[j]=src[i];srcIdx[j]=srcIdx[i];const nb=Math.round(nd*2);if(nb>bmax)bmax=nb;push(nd,j);}}}}
  // part ids per pixel: legs split at the knee fraction
  const out=new Uint16Array(W*H);const partIds=['none'];const idOf=new Map();const pid=n=>{if(!idOf.has(n)){idOf.set(n,partIds.length);partIds.push(n);}return idOf.get(n);};
  const kneeIdx={};for(const side of ['Far','Near'])for(const sl of T.slots[side]){const p=legPaths[sl.id];if(!p)continue;const f=(sl.jointFractions??[0.5])[0];let cum=[0];for(let i=1;i<p.length;i++)cum.push(cum[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));const tot=cum[cum.length-1];let k=0;while(k<cum.length-1&&cum[k]<f*tot)k++;kneeIdx[sl.id]=k;}
  for(let i=0;i<W*H;i++){if(!mask[i]||src[i]<0)continue;const name=parts[src[i]];if(name==='body'||name.startsWith('claw'))out[i]=pid(name);else out[i]=pid(name+(srcIdx[i]<kneeIdx[name]?'-upper':'-lower'));}
  return {labels:out,partIds,W,H};
}
/** Compare with Codex's labels.png + declaration.json (red channel = part index + 1). IoU per part at working scale
 * (Codex's map sampled at the working grid); Codex part ids are lower-case `leg0far-upper`, `claw-far-palm`… */
export function scoreLabels(lab,res,codexLabels,codexDecl,masterW){const {W,H,scale,box}=res.working;const toM=p=>[box.x+(p[0]-2)/scale,box.y+(p[1]-2)/scale];
  const mine=name=>name.replace(/^leg(\d)(Far|Near)-(upper|lower)$/,(m,a,b,c)=>'leg'+a+b.toLowerCase()+'-'+c).replace(/^claw(Far|Near)$/,(m,a)=>'claw-'+a.toLowerCase());
  const codexId=new Map(codexDecl.parts.map((p,i)=>[p.id,i+1]));const inter=new Map(),unionA=new Map(),unionB=new Map();
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const [mx,my]=toM([x,y]).map(Math.round);const c=(mx>=0&&my>=0&&mx<masterW&&my<masterW)?codexLabels[my*masterW+mx]:0;const cName=c?codexDecl.parts[c-1].id:null;const cGroup=cName?cName.replace(/^claw-(far|near)-.*$/,'claw-$1'):null;
    const m=lab.labels[i]?mine(lab.partIds[lab.labels[i]]):null;if(m)unionA.set(m,(unionA.get(m)||0)+1);if(cGroup)unionB.set(cGroup,(unionB.get(cGroup)||0)+1);if(m&&m===cGroup)inter.set(m,(inter.get(m)||0)+1);}
  const names=new Set([...unionA.keys(),...unionB.keys()]);const rows=[];for(const n of names){const I=inter.get(n)||0,U=(unionA.get(n)||0)+(unionB.get(n)||0)-I;rows.push({part:n,iou:U?+(I/U).toFixed(2):0,mine:unionA.get(n)||0,codex:unionB.get(n)||0});}
  return rows.sort((a,b)=>a.part.localeCompare(b.part));}
