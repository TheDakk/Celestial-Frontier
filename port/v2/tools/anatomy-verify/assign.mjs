/** IC-1/P5 — from the ridge graph to named template legs, template-driven and family-free. The template descriptor
 * (`template-rest.mjs`) supplies the leg slots (stations × sides from the family contract), the painting conventions
 * of the master format (`view` front/side, `facing`) and the REST RATIOS measured on the family's reference; every
 * length threshold below is a ratio of those through the painting's own body radius R (its maximum thickness), so
 * no working-pixel constant survives. Foot candidates are (a) long thin terminal branches, (b) LOOP LIMBS (thin
 * non-body edges between two body junctions: a leg whose tip rests against the body), (c) TOUCHING tips (a long thin
 * edge from the body to a thin junction far from it). Generic classes on the candidates: spine (too short), fork
 * (two tips close together whose separation points coincide — claw fingers, forked tails), leg (the rest). The body
 * centre and axis come from the SPINE RIDGE (the body edge maximising length × thickness), not a centroid. Legs are
 * then assigned per side (front view: outline order about the centre; side view: stations along the axis, depth by
 * tip height) by exact enumeration under a monotone-order constraint with a family-free cost. Scored against hand
 * landmarks by score.mjs; not a writer. */
import {alphaOf,detectTips} from './tips.mjs';
import {ridgeGraph} from './ridge.mjs';
import {limbChains,separationPoints} from './chains.mjs';
import {templateRest} from './template-rest.mjs';
import {distanceTransform} from './thickness.mjs';
const ang=(p,c)=>Math.atan2(p[1]-c[1],p[0]-c[0]);
/** Backwards-compatible descriptor view: legs per side and slot naming per template (from the contract). */
export const TEMPLATES=new Proxy({},{get:(_,id)=>{if(typeof id!=='string')return undefined;const r=templateRest(id);return {legsPerSide:r.legsPerSide,slotName:(k,side)=>r.slots[side][k].terminal,rest:r};}});
export function assignLegs(rgba,w,h,guide,{template='brachyuran',bodyFraction=null,termFactor=3,thinSpread=1.8,centreMode='spine',units='body',refine='tip',touchInterior=false,touchProfile=false,touchAgainstBody=true,angleWeight=0,slotLenWeight=0,lenMode='exit',loopMode='near',costMode='rest',thickFinger=true,touchBodyDistMax=1e9,spacingWeight=0,gapWeight=0,wristCut=true,wristCuts=2,interiorEdges=0,edgeMinLen=0.3,edgeBlur=0,interiorTipMax=0.5,thickMaxLen=1e9}={}){
  const T=templateRest(template),legsPerSide=T.legsPerSide,slotName=(k,side)=>T.slots[side][k].terminal;
  const {alpha}=alphaOf(rgba,w,h),det=detectTips(alpha,w,h,{solidAlpha:128}),{working:{width:W,height:H,scale,box}}=det;let {mask,dt}=det;let interiorPass=null;
  // INTERIOR-EDGE STAGE (README slice 21): a limb painted over the body is inside the silhouette; its contour is a
  // strong luminance edge. Strong interior contours (Sobel ≥ interiorEdges × the mask's median magnitude, in
  // connected runs ≥ edgeMinLen × rest leg length) are cut out of the working mask before the distance transform,
  // so the folded limb becomes its own thin ridge for the same graph, chains and matcher. 0 = off.
  if(interiorEdges>0){const lum=new Float32Array(W*H);const r=Math.max(1,Math.round(0.5/scale));for(let y=0;y<H;y++)for(let x=0;x<W;x++){const mx=box.x+(x-2)/scale,my=box.y+(y-2)/scale;let sum=0,n=0;for(let yy=Math.round(my-r);yy<=Math.round(my+r);yy++)for(let xx=Math.round(mx-r);xx<=Math.round(mx+r);xx++){if(xx<0||yy<0||xx>=w||yy>=h)continue;const i=(yy*w+xx)*4;if(rgba[i+3]<128)continue;sum+=0.299*rgba[i]+0.587*rgba[i+1]+0.114*rgba[i+2];n++;}lum[y*W+x]=n?sum/n:0;}
    // limb-scale blur (edgeBlur × rest leg thickness × R, box, mask-aware) so paint texture averages out before the gradient
    if(edgeBlur>0){let m=0;for(let i=0;i<W*H;i++)if(dt[i]>m)m=dt[i];const rb=Math.max(1,Math.round(edgeBlur*templateRest(template).legThickness*m));const out=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!mask[i])continue;let sum=0,n=0;for(let yy=y-rb;yy<=y+rb;yy++)for(let xx=x-rb;xx<=x+rb;xx++){if(xx<0||yy<0||xx>=W||yy>=H)continue;const j=yy*W+xx;if(!mask[j])continue;sum+=lum[j];n++;}out[i]=n?sum/n:0;}lum.set(out);}
    const mag=new Float32Array(W*H);const vals=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!mask[i]||dt[i]<2)continue;const gx=lum[i+1]-lum[i-1]+0.5*(lum[i-W+1]-lum[i-W-1]+lum[i+W+1]-lum[i+W-1]),gy=lum[i+W]-lum[i-W]+0.5*(lum[i+W-1]-lum[i-W-1]+lum[i+W+1]-lum[i-W+1]);mag[i]=Math.hypot(gx,gy);vals.push(mag[i]);}
    vals.sort((a,b)=>a-b);const med=vals[Math.floor(vals.length/2)]||1;const thr=interiorEdges*med;const strong=new Uint8Array(W*H);for(let i=0;i<W*H;i++)if(mag[i]>=thr)strong[i]=1;
    // keep connected runs of strong pixels whose extent is at least edgeMinLen × leg length
    const minLen=edgeMinLen*templateRest(template).legLength*(()=>{let m=0;for(let i=0;i<W*H;i++)if(dt[i]>m)m=dt[i];return m;})();const seen=new Uint8Array(W*H);const cut=new Uint8Array(W*H);
    for(let i=0;i<W*H;i++){if(!strong[i]||seen[i])continue;const comp=[i];seen[i]=1;const st=[i];let minx=1e9,maxx=-1,miny=1e9,maxy=-1;while(st.length){const c=st.pop();const x=c%W,y=(c-x)/W;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(strong[j]&&!seen[j]){seen[j]=1;comp.push(j);st.push(j);}}}
      if(Math.hypot(maxx-minx,maxy-miny)>=minLen)for(const j of comp)cut[j]=1;}
    const m2=new Uint8Array(mask);let ncut=0;for(let i=0;i<W*H;i++)if(cut[i]&&m2[i]){m2[i]=0;ncut++;}interiorPass={mask:m2,dt:distanceTransform(m2,W,H)};if(process.env.ASSIGN_DEBUG)console.log('interior edges: median',med.toFixed(1),'thr',thr.toFixed(1),'cut px',ncut,'minLen',minLen.toFixed(0));}
  const g=ridgeGraph(mask,dt,W,H,{spurFactor:1.5,spurFloor:8});
  // body/limb split: the geometric mean of the body radius and the rest proximal leg thickness (P3 note), unless a
  // fraction is passed explicitly for measurement
  let frac=bodyFraction??0.45; // 0.45 R: the slice-11 constant; sqrt(rest proximal thickness) and Otsu are measured variants (README slice 18)
  if(bodyFraction==='rest')frac=Math.sqrt(T.proximalThickness);
  if(bodyFraction==='otsu'){let maxDt=0;for(const e of g.edges)maxDt=Math.max(maxDt,e.maxDt);const bins=32,hist=new Float64Array(bins);for(const e of g.edges){const b=Math.min(bins-1,Math.floor(Math.log(1+e.meanDt)/Math.log(1+maxDt)*bins));hist[b]+=e.length;}
    let total=0,sumAll=0;for(let b=0;b<bins;b++){total+=hist[b];sumAll+=b*hist[b];}let w0=0,s0=0,bestV=-1,bestB=0;for(let b=0;b<bins;b++){w0+=hist[b];if(!w0)continue;const w1=total-w0;if(!w1)break;s0+=b*hist[b];const m0=s0/w0,m1=(sumAll-s0)/w1;const v=w0*w1*(m0-m1)*(m0-m1);if(v>bestV){bestV=v;bestB=b;}}
    frac=(Math.exp((bestB+1)/bins*Math.log(1+maxDt))-1)/maxDt;}
  const lc=limbChains(g,dt,W,{bodyFraction:frac});
  const R=lc.maxDt;const toM=p=>[box.x+(p[0]-2)/scale,box.y+(p[1]-2)/scale];
  // --- thresholds in body units (rest ratios × R) ---
  const legLen=T.legLength*R;                       // rest leg length in working px
  const px=units==='px';                            // 'px' = the slice-16 working-pixel constants, kept for measurement only
  const minLimbTerm=px?30:0.15*legLen;              // shorter terminal branches are spines/hairs
  const loopMinLen=px?60:0.30*legLen;               // a loop limb / touching edge must be a real limb's length
  const endMax=px?6:1.5*T.legThickness*R;           // an end thicker than 1.5× the rest leg is a knob (eye, club), not a foot
  const forkTipMax=px?35:0.20*legLen,forkSepMax=px?16:0.09*legLen; // fingers of one forked appendage
  // --- body axis from the spine ridge: the body edge maximising length × mean thickness ---
  // the spine is the body edge that stays thick end to end (length × MIN thickness); a neck→head edge is long and
  // thick on average but thins at the neck, which is how the Civet's axis first came out vertical
  const bodyEdges=g.edges.filter(e=>e.meanDt>=lc.bodyDt);let spine=null,sv=-1;for(const e of bodyEdges){const v=e.length*e.minDt;if(v>sv){sv=v;spine=e;}}
  let centre,axis;
  if(spine&&centreMode==='spine'){const a=g.nodes[spine.a],b=g.nodes[spine.b];centre=[(a.x+b.x)/2,(a.y+b.y)/2];axis=[b.x-a.x,b.y-a.y];}
  else{let sx=0,sy=0,n=0;for(const e of bodyEdges)for(const i of e.path){sx+=i%W;sy+=Math.floor(i/W);n++;}centre=[sx/n,sy/n];axis=[1,0];}
  {const L=Math.hypot(axis[0],axis[1])||1;axis=[axis[0]/L,axis[1]/L];if(T.facing==='right'&&axis[0]<0)axis=[-axis[0],-axis[1]];if(T.facing==='left'&&axis[0]>0)axis=[-axis[0],-axis[1]];}
  const bodyIds=new Set(lc.bodyNodes.map(b=>b.id));
  // distance (working px, chamfer) from every mask pixel to the thick region (pixels with DT ≥ bodyDt)
  const bodyDist=new Float32Array(W*H).fill(1e9);{const q=[];for(let i=0;i<W*H;i++)if(mask[i]&&dt[i]>=lc.bodyDt){bodyDist[i]=0;q.push(i);}let h=0;while(h<q.length){const i=q[h++];const x=i%W,y=(i-x)/W;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(!mask[j])continue;const nd=bodyDist[i]+(dx&&dy?1.4142:1);if(nd<bodyDist[j]-1e-6){bodyDist[j]=nd;q.push(j);}}}}
  // limb length from the thick-region EXIT (first chain pixel with DT < bodyDt, walking root → tip) to the tip
  const lenFromExit=(edges,rootId)=>{let node=rootId,len=0,out=false,prev=-1;for(const e of edges){const path=(e.a===node)?e.path:[...e.path].reverse();for(const i of path){if(!out&&dt[i]<lc.bodyDt)out=true;if(out&&prev>=0)len+=Math.hypot(i%W-prev%W,Math.floor(i/W)-Math.floor(prev/W));prev=i;}node=(e.a===node)?e.b:e.a;}return len;};
  const exitPoint=(edges,fromBodyNodeId)=>{let node=fromBodyNodeId;for(const e of edges){const path=(e.a===node)?e.path:[...e.path].reverse();for(const i of path){if(dt[i]<lc.bodyDt)return [i%W,Math.floor(i/W)];}node=(e.a===node)?e.b:e.a;}const last=edges[edges.length-1];const i=last.path[last.path.length-1];return [i%W,Math.floor(i/W)];};
  // (a) terminal-branch candidates
  // `len` = path length from the SEPARATION point to the tip (the limb's own length; the shared trunk is not the limb's)
  // TUFT COLLAPSE: a chain whose terminal edge is short (a hair, a tuft, a toe) hanging from a junction whose other
  // outgoing edges are ALL short is a limb ending in a cluster of short branches; the junction is the limb's tip and
  // the stem (chain minus the tuft) its chain. One synthetic chain per such junction. Generic: a claw palm keeps
  // two LONG fingers and is not collapsed.
  const chainsIn=lc.chains.slice();{const seen=new Set();for(const c of lc.chains){const last=c.edges[c.edges.length-1];if(last.length>=minLimbTerm||c.edges.length<2)continue;let node=c.rootNode.id;for(let k=0;k<c.edges.length-1;k++){const e=c.edges[k];node=(e.a===node)?e.b:e.a;}const j=node;if(seen.has(j)||bodyIds.has(j))continue;
      const stem=c.edges[c.edges.length-2];const outs=g.edges.filter(o=>o!==stem&&(o.a===j||o.b===j));if(!outs.length||outs.some(o=>o.length>=minLimbTerm||o.meanDt>=lc.bodyDt))continue;seen.add(j);
      const edges=c.edges.slice(0,-1);const len=edges.reduce((a,e)=>a+e.length,0);const jn=g.nodes[j];chainsIn.push({endNode:jn,length:+len.toFixed(1),meanDt:c.meanDt,maxDt:c.maxDt,endDt:jn.dt,edges,rootNode:c.rootNode,tuft:true});}}
  const seps=separationPoints(chainsIn,g.nodes,centre);
  const cands=[];for(const c of chainsIn){const last=c.tuft?{length:c.length,meanDt:c.meanDt}:c.edges[c.edges.length-1];if(last.length>=termFactor*last.meanDt&&c.endDt<=endMax){const sp=seps.get(c);let node=c.rootNode.id,len=0,own=false;for(const e of c.edges){if(node===sp.node.id)own=true;if(own)len+=e.length;node=(e.a===node)?e.b:e.a;}if(!own)len=c.length;if(lenMode==='exit')len=lenFromExit(c.edges,c.rootNode.id);cands.push({kind:'end',x:c.endNode.x,y:c.endNode.y,termDt:last.meanDt,term:last.length,len,attach:[sp.node.x,sp.node.y],chain:c});}}
  // (b) loop limbs
  const nearBody=id=>{const n=g.nodes[id];const i=Math.round(n.y)*W+Math.round(n.x);return bodyIds.has(id)||(i>=0&&i<W*H&&bodyDist[i]<=0.75*R);};
  for(const e of g.edges){if(e.meanDt>=lc.bodyDt||e.length<loopMinLen)continue;
    if(loopMode==='none')continue;
    if(loopMode==='body'){if(!bodyIds.has(e.a)||!bodyIds.has(e.b))continue;}else{if(!nearBody(e.a)||!nearBody(e.b))continue;}
    // the foot of a loop limb is the path point farthest from the thick region (slice 13 used the centre; a leg folded
    // over the top of the body is nearer the centre at its tip than at its root)
    let far=null,fd=-1;for(const i of e.path){const d=loopMode==='body'?Math.hypot(i%W-centre[0],Math.floor(i/W)-centre[1]):bodyDist[i];if(d>fd){fd=d;far=[i%W,Math.floor(i/W)];}}
    if(loopMode!=='body'&&fd<0.5*loopMinLen)continue; // must protrude from the body by a limb's worth
    if(far&&!cands.some(c=>Math.hypot(c.x-far[0],c.y-far[1])<20)){cands.push({kind:'loop',x:far[0],y:far[1],termDt:e.meanDt,term:e.length,len:e.length/2,attach:exitPoint([e],e.a),edge:e,farIndex:e.path.indexOf(far[1]*W+far[0])});}}
  // (c) touching limbs
  const thinAll=cands.map(c=>c.termDt).sort((a,b)=>a-b),thinRef=thinAll[Math.floor(thinAll.length/4)]??(T.legThickness*R);
  for(const e of g.edges){if(e.meanDt>=lc.bodyDt||e.length<loopMinLen)continue;const aBody=bodyIds.has(e.a),bBody=bodyIds.has(e.b);if(aBody===bBody)continue;const farId=aBody?e.b:e.a,far=g.nodes[farId];if(far.kind!=='junction'||far.dt>2*thinRef)continue;
    const d=Math.hypot(far.x-centre[0],far.y-centre[1]);if(d<lc.bodyDt*2)continue;
    if(e.minDt>1.3*thinRef)continue;
    let diag;{const path=(e.a===farId)?[...e.path].reverse():e.path;const tail=path.slice(Math.floor(path.length*.75));const tailMax=Math.max(...tail.map(i=>dt[i]));const head=path.slice(0,Math.floor(path.length*.5));const headMean=head.reduce((a,i)=>a+dt[i],0)/Math.max(1,head.length);diag={tailMax:+tailMax.toFixed(1),headMean:+headMean.toFixed(1),thinRef:+thinRef.toFixed(1),profileOk:!(tailMax>1.6*thinRef||tailMax>headMean)};if(touchProfile&&!diag.profileOk)continue;}
    if(cands.some(c=>Math.hypot(c.x-far.x,c.y-far.y)<20))continue;const others=g.edges.filter(o=>o!==e&&(o.a===farId||o.b===farId));diag.degree=others.length+1;diag.otherBody=others.filter(o=>o.meanDt>=lc.bodyDt).length;diag.otherLong=others.filter(o=>o.length>=loopMinLen).length;diag.otherMaxDt=+Math.max(0,...others.map(o=>o.maxDt)).toFixed(1);diag.jdt=far.dt;
    // the tip must REST AGAINST THE BODY: another edge at that junction is body-thick (a leg tip pressed to the
    // carapace/torso), and the junction itself is at least leg-thin (a hair meeting the body is not a limb end); a
    // junction among only limb-thick edges is a crossing of two legs, which is not a tip
    if(touchAgainstBody&&(diag.otherMaxDt<lc.bodyDt||far.dt<thinRef))continue;
    // a resting tip rests ON the body: its junction lies within touchBodyDistMax × R of the thick region (a junction on
    // another leg's thick base, 1.4–2.8 R out, passed the thickness test alone — README slice 19 table)
    {const ji=Math.round(far.y)*W+Math.round(far.x);diag.bodyDistR=+(bodyDist[ji]/R).toFixed(2);if(bodyDist[ji]>touchBodyDistMax*R)continue;}
    cands.push({kind:'touch',x:far.x,y:far.y,termDt:far.dt,term:e.length,len:e.length,attach:exitPoint([e],aBody?e.a:e.b),nodeId:farId,diag,edge:e,fromBody:aBody?e.a:e.b});}
  // a touching tip must be a limb END: a junction that another candidate's chain passes through (an ankle fork, a
  // mid-leg crossing) is interior to that limb and is dropped in favour of the chain's own endpoint
  {const interior=new Set();for(const c of cands){if(c.kind!=='end')continue;let node=c.chain.rootNode.id;const es=c.chain.edges;for(let k=0;k<es.length;k++){const e=es[k];node=(e.a===node)?e.b:e.a;let beyond=0;for(let m=k+1;m<es.length;m++)beyond+=es[m].length;if(beyond>=minLimbTerm)interior.add(node);}} // a junction is interior only when the limb continues a limb's worth beyond it
    for(const c of cands)if(c.kind==='touch')c.diag.interior=interior.has(c.nodeId);if(touchInterior)for(let i=cands.length-1;i>=0;i--)if(cands[i].kind==='touch'&&interior.has(cands[i].nodeId))cands.splice(i,1);}
  // INTERIOR PASS: the same graph on the contour-cut mask; a thin terminal chain whose TIP lies inside the original
  // thick region (bodyDist 0 on the uncut mask) is a limb painted over the body. Added as kind 'interior' with the
  // same attributes; the main graph is untouched.
  if(interiorPass){const g2=ridgeGraph(interiorPass.mask,interiorPass.dt,W,H,{spurFactor:1.5,spurFloor:8});const lc2=limbChains(g2,interiorPass.dt,W,{bodyFraction:frac});const seps2=separationPoints(lc2.chains,g2.nodes,centre);let added=0;
    for(const c of lc2.chains){const last=c.edges[c.edges.length-1];const ti=Math.round(c.endNode.y)*W+Math.round(c.endNode.x);if(process.env.INTERIOR_DEBUG){const tm=toM([c.endNode.x,c.endNode.y]).map(Math.round);const tp=process.env.INTERIOR_DEBUG.split(',').map(Number);console.log('  g2 chain tip',tm.join(','),'d→target',Math.round(Math.hypot(tm[0]-tp[0],tm[1]-tp[1])),'term',last.length,'termDt',last.meanDt,'endDt',c.endDt,'endMax',endMax.toFixed(1),'bodyDist/R',(bodyDist[ti]/R).toFixed(2),'len',c.length,'near existing',cands.some(o=>Math.hypot(o.x-c.endNode.x,o.y-c.endNode.y)<=0.25*R));}
      if(last.length<Math.max(minLimbTerm,termFactor*last.meanDt)||c.endDt>endMax)continue;
      // (a) UPGRADE: a main-graph candidate at the same tip whose terminal edge is spine-short (chopped by the body
      //     outline's junctions) is replaced by this chain; (b) otherwise the chain's path must run THROUGH the
      //     original thick region for at least interiorTipMax × R of its length (a limb over the body)
      const near=cands.findIndex(o=>Math.hypot(o.x-c.endNode.x,o.y-c.endNode.y)<=0.25*R);if(process.env.INTERIOR_DEBUG&&near>=0){const o=cands[near];console.log('   near cand',o.kind,'tip',toM([o.x,o.y]).map(Math.round).join(','),'term',o.term,'termDt',o.termDt,'minLimbTerm',minLimbTerm.toFixed(1));}
      if(near>=0){const o=cands[near];const cleaner=o.kind==='end'&&last.meanDt<0.8*o.termDt;if(!(o.kind==='end'&&o.term<minLimbTerm)&&!cleaner)continue;} // spine-short OR a thinner (cleaner) ridge than the outline-merged main chain
      else{let inside=0,node=c.rootNode.id;for(const e of c.edges){for(const i of e.path)if(bodyDist[i]===0)inside++;node=(e.a===node)?e.b:e.a;}if(inside<interiorTipMax*R)continue;}
      const sp=seps2.get(c);const cand={kind:'interior',x:c.endNode.x,y:c.endNode.y,termDt:last.meanDt,term:last.length,len:c.length,attach:[sp.node.x,sp.node.y],chain:c,graph:g2};if(near>=0)cands[near]=cand;else cands.push(cand);added++;}
    if(process.env.ASSIGN_DEBUG)console.log('interior candidates added',added);}
  // two candidates within a quarter body radius are one tip (adjacent tuft junctions, a toe beside its pad): keep the
  // one with the longer limb
  {cands.sort((a,b)=>b.len-a.len);for(let i=cands.length-1;i>=0;i--){for(let j=0;j<i;j++)if(Math.hypot(cands[i].x-cands[j].x,cands[i].y-cands[j].y)<=0.25*R){if(process.env.INTERIOR_DEBUG){const tp=process.env.INTERIOR_DEBUG.split(',').map(Number);const tm=toM([cands[i].x,cands[i].y]);if(Math.hypot(tm[0]-tp[0],tm[1]-tp[1])<60)console.log('   dedupe removed',cands[i].kind,'tip',tm.map(Math.round).join(','),'len',cands[i].len.toFixed(0),'kept',cands[j].kind,'tip',toM([cands[j].x,cands[j].y]).map(Math.round).join(','),'len',cands[j].len.toFixed(0));}cands.splice(i,1);break;}}}
  // generic classes
  const pool=cands.filter(c=>c.term>=minLimbTerm||(c.kind!=='end'&&c.kind!=='interior'));
  const forkOf=new Map();for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){const a=pool[i],b=pool[j];if(!a.attach||!b.attach||a.kind!=='end'||b.kind!=='end')continue; // fingers are endpoints; a touching/loop point never forks
    if(Math.hypot(a.x-b.x,a.y-b.y)<=forkTipMax&&Math.hypot(a.attach[0]-b.attach[0],a.attach[1]-b.attach[1])<=forkSepMax){forkOf.set(a,b);forkOf.set(b,a);}}
  const thinTerms=pool.filter(c=>c.kind==='end').map(c=>c.termDt).sort((a,b)=>a-b),thinRefT=thinTerms[Math.floor(thinTerms.length/3)]??thinRef;
  // a thick single terminal is a finger only when it is finger-SHORT (len ≤ thickMaxLen × rest leg length); a long
  // thick terminal is a leg whose ridge merged with the body outline (the freshwater folded leg, README slice 21)
  const isClaw=c=>forkOf.has(c)||(thickFinger&&c.kind==='end'&&c.termDt>=1.6*thinRefT&&c.len<=thickMaxLen*legLen);
  const legs=pool.filter(c=>!isClaw(c)),clawList=pool.filter(isClaw);
  // --- side rule by view ---
  // front view: side by the SEPARATION point's x about the centre (tips of forward limbs cross the midline)
  // side view: depth is not an x split; it is decided inside the station assignment below (Near = the lower tip)
  const sideFront=c=>((c.attach?c.attach[0]:c.x)<centre[0]?'Far':'Near');
  const assigned={},hidden=[];const feet={Far:[],Near:[]},claws={Far:[],Near:[]};
  const thinOf=cs=>[...cs.map(c=>c.termDt)].sort((a,b)=>a-b)[Math.floor(cs.length/2)]||1,medLenOf=cs=>{const l=[...cs.map(c=>c.term)].sort((a,b)=>a-b);return l[Math.floor(l.length/2)]||1;};
  const restLen=T.legLength*R;
  const unitCost=(c,thin,medLen)=>costMode==='median'?Math.abs(Math.log(c.termDt/thin))*0.8+Math.max(0,1-c.term/medLen)*1.0+(c.kind==='touch'?0.5:c.kind==='loop'?0.3:0)
    :Math.abs(Math.log(c.termDt/thin))*0.4+Math.abs(Math.log(Math.max(1,c.len)/restLen))*0.5+(c.kind==='touch'?0.5:c.kind==='loop'?0.3:0);
  const unusedCostOf=c=>costMode==='median'?0.7:(c.kind==='end'||c.kind==='interior'?1.0:0.5);
  // P6 (tip): the skeleton endpoint sits about one end-radius inside the painted tip; the foot landmark is the tip
  // itself, so push the endpoint outward along the terminal edge's end direction by the end radius until the mask ends
  const refineTip=c=>{if((c.kind!=='end'&&c.kind!=='interior')||refine==='none')return [c.x,c.y];
    if(refine==='far'){ // the terminal landmark = the tip-region pixel farthest from the limb's separation point
      const r=Math.max(3,2.5*c.chain.endDt),sp=c.attach??[c.x,c.y];let best=[c.x,c.y],bd=-1;for(let y=Math.max(0,Math.round(c.y-r));y<=Math.min(H-1,Math.round(c.y+r));y++)for(let x=Math.max(0,Math.round(c.x-r));x<=Math.min(W-1,Math.round(c.x+r));x++){if(!mask[y*W+x]||Math.hypot(x-c.x,y-c.y)>r)continue;const d=Math.hypot(x-sp[0],y-sp[1]);if(d>bd){bd=d;best=[x,y];}}return best;}const e=c.chain.edges[c.chain.edges.length-1];const path=(e.b===c.chain.endNode.id)?e.path:[...e.path].reverse();const r=Math.max(2,Math.round(c.chain.endDt));const back=path[Math.max(0,path.length-1-Math.min(path.length-1,3*r))];const tip=path[path.length-1];
    let dx=tip%W-back%W,dy=Math.floor(tip/W)-Math.floor(back/W);const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;let x=c.x,y=c.y;for(let s=0;s<=r+1;s++){const nx=Math.round(c.x+dx*s),ny=Math.round(c.y+dy*s);if(nx<0||ny<0||nx>=W||ny>=H||!mask[ny*W+nx])break;x=nx;y=ny;}return [x,y];};
  const place=(name,c)=>{const t=refineTip(c);assigned[name]={master:toM(t).map(Math.round),kind:c.kind,attach:toM(c.attach??[c.x,c.y]).map(Math.round),_c:c};};
  if(T.view==='front'){
    for(const c of clawList)claws[sideFront(c)].push(c);
    const sides={Far:[],Near:[]};for(const c of legs)sides[sideFront(c)].push(c);
    for(const side of ['Far','Near']){
      const list=sides[side].map(f=>({f,a:ang(f.attach??[f.x,f.y],centre)}));const key=o=>side==='Near'?(o.a<-Math.PI/2?o.a+2*Math.PI:o.a):(o.a>Math.PI/2?-(o.a-2*Math.PI):-o.a);
      const cs=list.sort((p,q)=>key(p)-key(q)).map(o=>o.f);if(!cs.length){for(let k=0;k<legsPerSide;k++)hidden.push(T.slots[side][k].id);continue;}
      const thin=thinOf(cs),medLen=medLenOf(cs);const emptyCost=k=>k===legsPerSide-1?0.3:k===legsPerSide-2?1.0:1.8,unusedCost=0.7;
      // rest ORDER prior: the template reference's hip angle per slot about the axis midpoint; a candidate pays for
      // the angular distance between its separation point and the slot's rest hip (in units of 45°)
      const angDiff=(a,b)=>{let d=Math.abs(a-b)%(2*Math.PI);return d>Math.PI?2*Math.PI-d:d;};
      // painting-derived ORDER prior (front view): the side's N slots are evenly spaced in angle between the rear
      // anchor (the axis normal pointing to the body's top, the far edge in a front view) and the front anchor (the
      // side's forked appendage separation if one exists, else the axis normal pointing down); a candidate pays for
      // its angular distance from the slot's expected angle in units of one slot spacing. This is what lets an
      // EMPTY REAR slot be recognised when the rear leg has no candidate (the freshwater/vent folded legs).
      let up=[axis[1],-axis[0]];if(up[1]>0)up=[-up[0],-up[1]]; // normal of the axis pointing to smaller y (the body's top)
      const fronts=claws[side];const frontAng=fronts.length?ang(fronts[0].attach??[fronts[0].x,fronts[0].y],centre):Math.atan2(-up[1],-up[0]);
      const unwrap=a=>side==='Near'?(a<-Math.PI/2?a+2*Math.PI:a):(a>Math.PI/2?-(a-2*Math.PI):-a); // same key as the ordering
      const r0=unwrap(Math.atan2(up[1],up[0])),r1=unwrap(frontAng);const span=r1-r0;const expected=k=>r0+span*(k+0.5)/legsPerSide;
      if(process.env.ASSIGN_DEBUG)console.log('spacing',side,{r0:+r0.toFixed(2),r1:+r1.toFixed(2),span:+span.toFixed(2),up:up.map(v=>+v.toFixed(2)),expected:Array.from({length:legsPerSide},(_,k)=>+expected(k).toFixed(2)),cands:cs.map(c=>+unwrap(ang(c.attach??[c.x,c.y],centre)).toFixed(2))});
      const slotCost=(c,k)=>{const sl=T.slots[side][k];let v=0;if(spacingWeight&&Math.abs(span)>1e-6){const a=unwrap(ang(c.attach??[c.x,c.y],centre));v+=spacingWeight*Math.abs(a-expected(k))/Math.abs(span/legsPerSide);}if(sl.restAngle!==undefined&&angleWeight)v+=angleWeight*angDiff(ang(c.attach??[c.x,c.y],centre),sl.restAngle)/(Math.PI/4);if(sl.restLength&&slotLenWeight)v+=slotLenWeight*Math.abs(Math.log(Math.max(1,c.len)/(sl.restLength*R)));return v;};
      // GAP CONSISTENCY (painting-internal): with pitch = the median angular gap between consecutive candidates on the
      // side, an assignment pays |gap/(Δslot) − pitch|/pitch for every consecutive filled pair (an empty slot between
      // two candidates must show as a double gap), and pays when the FRONT slot is left empty although the last
      // candidate separates within one pitch of the claw (the front slot is then visibly occupied)
      const angs=cs.map(c=>unwrap(ang(c.attach??[c.x,c.y],centre)));const gaps=angs.slice(1).map((a,i)=>a-angs[i]).filter(g=>g>1e-3).sort((a,b)=>a-b);const pitch=gaps.length?gaps[Math.floor(gaps.length/2)]:0;
      const gapCost=acc=>{if(!gapWeight||!pitch)return 0;let v=0,prevK=-1,prevJ=-1;acc.forEach((c,k)=>{if(!c)return;const j=cs.indexOf(c);if(prevK>=0){const g=(angs[j]-angs[prevJ])/(k-prevK);v+=Math.abs(g-pitch)/pitch;}prevK=k;prevJ=j;});
        if(!acc[legsPerSide-1]&&prevJ>=0&&fronts.length){const gf=(r1-angs[prevJ])/pitch;v+=Math.max(0,1-gf);}return gapWeight*v;};
      let best=null;const rec=(k,i,used,acc,cost)=>{if(k===legsPerSide){let total=cost+gapCost(acc);const usedSet=new Set(acc.filter(Boolean));for(const c of cs)if(!usedSet.has(c))total+=unusedCostOf(c);if(!best||total<best.cost)best={cost:total,acc:acc.slice()};return;}
        rec(k+1,i,used,acc.concat([null]),cost+emptyCost(k));for(let j=i;j<cs.length;j++)rec(k+1,j+1,used+1,acc.concat([cs[j]]),cost+unitCost(cs[j],thin,medLen)+slotCost(cs[j],k));};
      rec(0,0,0,[],0);
      best.acc.forEach((c,k)=>{if(c)place(slotName(k,side),c);else hidden.push(T.slots[side][k].id);});feet[side]=best.acc.filter(Boolean);}
  }else{
    // side view: slots are stations (rear → front along the axis) × depths (Far, Near). Candidates ordered by their
    // separation point's coordinate along the facing axis. Exact enumeration: each candidate goes to one slot; the
    // station order must be monotone over the candidates' axis coordinate; inside a station the lower tip is Near.
    const u=c=>{const p=c.attach??[c.x,c.y];return (p[0]-centre[0])*axis[0]+(p[1]-centre[1])*axis[1];};
    const cs=legs.slice().sort((p,q)=>u(p)-u(q));const thin=thinOf(cs);const K=legsPerSide;
    // chain appendages of the contract that hang off the axis ends: rear (bodyAxis[0]) slots precede station 0, front
    // (bodyAxis[1]) slots follow the last station; a fork whose tip is body-thick (a head) is body, not an appendage
    const rearApp=T.appendages.filter(a=>a.kind==='chain'&&a.attach===T.contract.bodyAxis[0]&&a.length),frontApp=T.appendages.filter(a=>a.kind==='chain'&&a.attach===T.contract.bodyAxis[1]&&a.length);
    // lengths: a candidate's `len` runs from its separation node on the spine, so subtract the descent through the
    // body (≈ R/2) before comparing with a rest length measured from the attachment landmark
    const lenCost=(c,restRatio)=>Math.abs(Math.log(Math.max(1,c.len-0.5*R)/(restRatio*R)));
    const legCost=c=>Math.abs(Math.log(c.termDt/thin))*0.4+lenCost(c,T.legLength)*(c.kind==='end'?1.0:0.25)+(c.kind==='touch'?0.5:c.kind==='loop'?0.3:0);
    const yLow=cs.length?Math.max(...cs.map(c=>c.y)):0;
    let best=null;const stations=[...rearApp.map(a=>({app:a})),...Array.from({length:K},(_,k)=>({k})),...frontApp.map(a=>({app:a}))];
    const rec=(si,i,acc,cost)=>{if(si===stations.length){const used=acc.flat().filter(Boolean).length;const total=cost+(cs.length-used)*0.7;if(!best||total<best.cost)best={cost:total,acc:acc.map(s=>s.slice())};return;}
      const st=stations[si];
      if(st.app){rec(si+1,i,acc.concat([[null]]),cost+0.8);for(let j=i;j<cs.length;j++)rec(si+1,j+1,acc.concat([[cs[j]]]),cost+lenCost(cs[j],st.app.length)*2.0+(cs[j].kind==='touch'?0.5:cs[j].kind==='loop'?0.3:0));return;}
      rec(si+1,i,acc.concat([[null,null]]),cost+2.0); // empty station: expensive (a whole station missing)
      for(let j=i;j<cs.length;j++){const c=cs[j];const near=c.y>=yLow-0.25*T.legLength*R;
        rec(si+1,j+1,acc.concat([[near?null:c,near?c:null]]),cost+legCost(c)+1.0); // one leg at the station: the other depth hidden
        for(let j2=j+1;j2<cs.length;j2++){const d=cs[j2];const [farC,nearC]=c.y<=d.y?[c,d]:[d,c];rec(si+1,j2+1,acc.concat([[farC,nearC]]),cost+legCost(c)+legCost(d));}}};
    rec(0,0,[],0);
    if(process.env.ASSIGN_DEBUG)console.log('side-view cs',cs.map(c=>({kind:c.kind,tip:toM([c.x,c.y]).map(Math.round),u:+u(c).toFixed(0),y:+c.y.toFixed(0),len:+c.len.toFixed(0),termDt:c.termDt,legCost:+legCost(c).toFixed(2),tailCost:rearApp.length?+(lenCost(c,rearApp[0].length)*2).toFixed(2):null})),'best',best.cost.toFixed(2),'yLow',yLow);
    const others={};
    best.acc.forEach((slot,si)=>{const st=stations[si];if(st.app){if(slot[0]){others[st.app.id]=toM([slot[0].x,slot[0].y]).map(Math.round);}return;}
      [['Far',slot[0]],['Near',slot[1]]].forEach(([side,c])=>{if(c){place(slotName(st.k,side),c);feet[side].push(c);}else hidden.push(T.slots[side][st.k].id);});});
    Object.assign(assigned,Object.fromEntries(Object.entries(others).map(([k,v])=>[k,{master:v,kind:'appendage'}])));
    for(const c of clawList)claws[c.y>=yLow?'Near':'Far'].push(c);
  }
  // --- P6 joints: every interior joint of a slot (knee, ankle …) at the template's rest fraction of the limb's path,
  // measured from the limb's exit from the body to its tip along the ridge path (no straight-line guess) ---
  const pathOf=c=>{if(c.kind==='touch'){const e=c.edge;const path=(e.a===c.fromBody)?e.path:[...e.path].reverse();const pts=[];let out=false;for(const i of path){if(!out&&dt[i]<lc.bodyDt)out=true;if(out)pts.push([i%W,Math.floor(i/W)]);}return pts.length>1?pts:null;}
    if(c.kind==='loop'){const e=c.edge;const k=c.farIndex;if(k<0)return null;const seg=k>=e.path.length/2?e.path.slice(0,k+1):[...e.path].reverse().slice(0,e.path.length-k);const pts=[];let out=false;for(const i of seg){if(!out&&dt[i]<lc.bodyDt)out=true;if(out)pts.push([i%W,Math.floor(i/W)]);}return pts.length>1?pts:null;}
    if(c.kind!=='end'&&c.kind!=='interior')return null;let node=c.chain.rootNode.id;const pts=[];let out=false;for(const e of c.chain.edges){const path=(e.a===node)?e.path:[...e.path].reverse();for(const i of path){if(!out&&dt[i]<lc.bodyDt)out=true;if(out)pts.push([i%W,Math.floor(i/W)]);}node=(e.a===node)?e.b:e.a;}return pts.length>1?pts:null;};
  const joints={};const slotByTerminal=new Map();for(const side of ['Far','Near'])for(const sl of T.slots[side])slotByTerminal.set(sl.terminal,{sl,side});
  for(const [name,a] of Object.entries(assigned)){const e=slotByTerminal.get(name);if(!e||!a._c)continue;const {sl}=e;const c=a._c;const pts=pathOf(c);const tipM=a.master;
    const chainNames=sl.chain;joints[chainNames[chainNames.length-1]]=tipM;
    let cum=[0];if(pts)for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));const total=pts?cum[cum.length-1]:0;
    const at=f=>{if(!pts||!total){const r=a.attach;return [Math.round(r[0]+(tipM[0]-r[0])*f),Math.round(r[1]+(tipM[1]-r[1])*f)];}const d=f*total;let i=0;while(i<cum.length-1&&cum[i+1]<d)i++;return toM(pts[i]).map(Math.round);};
    joints[chainNames[0]]=pts?toM(pts[0]).map(Math.round):a.attach;(sl.jointFractions??[]).forEach((f,k)=>{joints[chainNames[k+1]]=at(f);});}
  // hidden inference — Codex's record rule (openai lane `hidden-anatomy.mjs#inferHiddenLandmarks`, generalized from
  // "leg3 from leg1/leg2" to "a station from the two preceding stations of its side"): root_k = 2·root_{k−1} −
  // root_{k−2}; every interior joint and the terminal are the previous station's vectors from its root REFLECTED
  // about the body-axis line through the new root (segment lengths stay 1:1). Declared-hidden slots only; the
  // compiler never infers presence. Inputs are the compiler's own joints (roots = thick-region exits), so the
  // record's hand-placed roots are not reproduced exactly — the residual is measured, not the rule.
  // the contract's body axis in the painting: front view → the spine ridge's TOP normal (root→carapace is the
  // painting's vertical for a front-on crab), side view → the spine ridge itself (pelvis→chest)
  const inferred={};{let u=axis;if(T.view==='front'){u=[axis[1],-axis[0]];if(u[1]>0)u=[-u[0],-u[1]];}for(const side of ['Far','Near']){const sl=T.slots[side];
    for(let k=2;k<sl.length;k++){if(assigned[sl[k].terminal])continue;const prev=sl[k-1],prev2=sl[k-2];const rootOf=s=>joints[s.chain[0]];const r=rootOf(prev),p=rootOf(prev2);if(!r||!p)continue;
      const root=[2*r[0]-p[0],2*r[1]-p[1]];inferred[sl[k].chain[0]]=root.map(Math.round);
      for(let j=1;j<sl[k].chain.length;j++){const src=joints[prev.chain[j]];if(!src)continue;const v=[src[0]-r[0],src[1]-r[1]];const dot=v[0]*u[0]+v[1]*u[1];inferred[sl[k].chain[j]]=[Math.round(root[0]+2*dot*u[0]-v[0]),Math.round(root[1]+2*dot*u[1]-v[1])];}}}}
  for(const a of Object.values(assigned)){if(a._c){a.path=pathOf(a._c);a.side=undefined;}delete a._c;}
  const fullPath=c=>{if(c.kind!=='end')return pathOf(c);let node=c.chain.rootNode.id;const pts=[];for(const e of c.chain.edges){const path=(e.a===node)?e.path:[...e.path].reverse();for(const i of path)pts.push([i%W,Math.floor(i/W)]);node=(e.a===node)?e.b:e.a;}return pts;};
  const clawEdgeSet=new Set();for(const c of clawList)if(c.kind==='end')for(const e of c.chain.edges)clawEdgeSet.add(e);
  // P3 wrist cut: a forked appendage's ARM is as thick as the body, so its chain roots at a body node past the arm.
  // Walk BODY edges from that root to the spine edge (shortest path by length); the wrist is the DT minimum along
  // the walk; body-edge pixels between the root and the wrist belong to the appendage's ridge, not the body's.
  const armPixels=new Map();if(wristCut&&spine){const badj=new Map();for(const e of g.edges){if(e.meanDt<lc.bodyDt||clawEdgeSet.has(e))continue;if(!badj.has(e.a))badj.set(e.a,[]);if(!badj.has(e.b))badj.set(e.b,[]);badj.get(e.a).push({e,to:e.b});badj.get(e.b).push({e,to:e.a});}
    const goal=new Set([spine.a,spine.b]);for(const c of clawList){if(c.kind!=='end')continue;const start=c.chain.rootNode.id;if(goal.has(start))continue;const dist=new Map([[start,0]]),via=new Map();const q=[start];let hit=null;
      while(q.length){q.sort((a,b)=>dist.get(a)-dist.get(b));const u=q.shift();if(goal.has(u)){hit=u;break;}for(const o of badj.get(u)??[]){const nd=dist.get(u)+o.e.length;if(!dist.has(o.to)||nd<dist.get(o.to)){dist.set(o.to,nd);via.set(o.to,{from:u,e:o.e});if(!q.includes(o.to))q.push(o.to);}}}
      if(hit===null)continue;const edges=[];let cur=hit;while(via.get(cur)){edges.unshift(via.get(cur).e);cur=via.get(cur).from;}
      // pixels from the root outward along the walk; wrist = DT minimum (excluding the first/last 2 px)
      let node=start;const px=[];for(const e of edges){const path=(e.a===node)?e.path:[...e.path].reverse();px.push(...path);node=(e.a===node)?e.b:e.a;}
      // valleys along the walk (local minima of DT smoothed over ±3 px), root → spine: the first is the elbow, the
      // second the base; `wristCuts` selects how many lobes leave the body (1 = elbow cut, 2 = base cut)
      const sm=px.map((_,i)=>{let a=0,n=0;for(let k=-3;k<=3;k++){const j=i+k;if(j>=0&&j<px.length){a+=dt[px[j]];n++;}}return a/n;});const valleys=[];for(let i=3;i<px.length-3;i++)if(sm[i]<sm[i-1]&&sm[i]<=sm[i+1]&&sm[i]<0.97*Math.max(...sm.slice(Math.max(0,i-30),i)))valleys.push(i);
      const wi=valleys.length?valleys[Math.min(valleys.length,wristCuts)-1]:0;if(!wi)continue;const arm=px.slice(0,wi);c.wrist=[px[wi]%W,Math.floor(px[wi]/W)];c.elbow=valleys.length?[px[valleys[0]]%W,Math.floor(px[valleys[0]]/W)]:null;c.armPath=arm.map(i=>[i%W,Math.floor(i/W)]);for(const i of arm)armPixels.set(i,c);}}
  const bodyRidge=[];for(const e of g.edges){if(e.meanDt<lc.bodyDt||clawEdgeSet.has(e))continue;for(const i of e.path){if(armPixels.has(i))continue;bodyRidge.push([i%W,Math.floor(i/W)]);}}
  const clawPaths=clawList.map(c=>({tip:[c.x,c.y],side:T.view==='front'?sideFront(c):null,path:pathOf(c),fullPath:[...(c.armPath??[]).reverse(),...fullPath(c)],wrist:c.wrist?toM(c.wrist).map(Math.round):null,elbow:c.elbow?toM(c.elbow).map(Math.round):null}));
  const usedSet=new Set([...feet.Far,...feet.Near]);
  return {working:{W,H,scale,box,mask,dt,bodyDt:lc.bodyDt,bodyDist},clawPaths,bodyRidge,legsBySide:T.view==='front'?{Far:legs.filter(c=>sideFront(c)==='Far').map(c=>c.kind),Near:legs.filter(c=>sideFront(c)==='Near').map(c=>c.kind)}:null,joints,inferred,pool:pool.map(c=>({kind:c.kind,tip:toM([c.x,c.y]).map(Math.round),sep:c.attach?toM(c.attach).map(Math.round):null,term:c.term,len:+c.len.toFixed(1),termDt:c.termDt,fork:forkOf.has(c),claw:isClaw(c),used:usedSet.has(c),diag:c.diag})),assigned,hidden,claws:{Far:claws.Far.map(c=>toM([c.x,c.y]).map(Math.round)),Near:claws.Near.map(c=>toM([c.x,c.y]).map(Math.round))},centre:toM(centre).map(Math.round),axis:axis.map(v=>+v.toFixed(3)),spine:spine?{a:toM([g.nodes[spine.a].x,g.nodes[spine.a].y]).map(Math.round),b:toM([g.nodes[spine.b].x,g.nodes[spine.b].y]).map(Math.round),len:spine.length,minDt:spine.minDt,meanDt:spine.meanDt}:null,bodyDt:lc.bodyDt,R,feetFound:feet.Far.length+feet.Near.length};
}
