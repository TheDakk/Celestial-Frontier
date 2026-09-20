/** IC-1 — from the ridge graph to named template legs. Feet candidates are (a) long thin terminal branches (chains.mjs)
 * and (b) LOOP LIMBS: thin non-body edges whose both ends are body junctions (a rear leg whose tip rests against the
 * carapace has no endpoint; its foot is the edge point farthest from the body centre). Per side, the thin cluster is
 * count-driven: the thinnest long chains up to the template's legs per side, while their terminal thickness stays
 * within `thinSpread` of the thinnest. Assignment uses the GUIDE only for order: each guide foot's angle about the
 * guide's carapace centre is the expected angle of that leg; found feet go to the nearest expected angle, greedily
 * by best match, so a hidden leg simply leaves its slot empty. Scored against hand landmarks; not a writer. */
import {alphaOf,detectTips} from './tips.mjs';
import {ridgeGraph} from './ridge.mjs';
import {limbChains,separationPoints} from './chains.mjs';
const ang=(p,c)=>Math.atan2(p[1]-c[1],p[0]-c[0]);
const angDiff=(a,b)=>{let d=Math.abs(a-b)%(2*Math.PI);return d>Math.PI?2*Math.PI-d:d;};
export function assignLegs(rgba,w,h,guide,{legsPerSide=4,thinSpread=1.8,minTerm=16,termFactor=3,loopMinLen=60}={}){
  const {alpha}=alphaOf(rgba,w,h),det=detectTips(alpha,w,h,{solidAlpha:128}),{mask,dt,working:{width:W,height:H,scale,box}}=det;
  const g=ridgeGraph(mask,dt,W,H,{spurFactor:1.5,spurFloor:8}),lc=limbChains(g,dt,W);
  const toM=p=>[box.x+(p[0]-2)/scale,box.y+(p[1]-2)/scale];
  // body centre = centroid of body-edge pixels
  let sx=0,sy=0,n=0;for(const e of g.edges)if(e.meanDt>=lc.bodyDt)for(const i of e.path){sx+=i%W;sy+=Math.floor(i/W);n++;}const centre=[sx/n,sy/n];
  const bodyIds=new Set(lc.bodyNodes.map(b=>b.id));
  // attachment = where the limb leaves the thick region: first pixel along the chain (body → tip) with DT < bodyDt
  const exitPoint=(edges,fromBodyNodeId)=>{let node=fromBodyNodeId;for(const e of edges){const path=(e.a===node)?e.path:[...e.path].reverse();for(const i of path){if(dt[i]<lc.bodyDt)return [i%W,Math.floor(i/W)];}node=(e.a===node)?e.b:e.a;}const last=edges[edges.length-1];const i=last.path[last.path.length-1];return [i%W,Math.floor(i/W)];};
  // (a) terminal-branch candidates
  const seps=separationPoints(lc.chains,g.nodes,centre);
  const cands=[];for(const c of lc.chains){const last=c.edges[c.edges.length-1];if(last.length>=Math.max(minTerm,termFactor*last.meanDt)&&c.endDt<=6){const sp=seps.get(c);cands.push({kind:'end',x:c.endNode.x,y:c.endNode.y,termDt:last.meanDt,term:last.length,attach:[sp.node.x,sp.node.y]});}}
  // (b) loop limbs
  for(const e of g.edges){if(e.meanDt>=lc.bodyDt||e.length<loopMinLen)continue;if(!bodyIds.has(e.a)||!bodyIds.has(e.b))continue;let far=null,fd=-1;for(const i of e.path){const p=[i%W,Math.floor(i/W)],d=Math.hypot(p[0]-centre[0],p[1]-centre[1]);if(d>fd){fd=d;far=p;}}
    if(far&&!cands.some(c=>Math.hypot(c.x-far[0],c.y-far[1])<20)){cands.push({kind:'loop',x:far[0],y:far[1],termDt:e.meanDt,term:e.length,attach:exitPoint([e],e.a)});}}
  // (c) touching limbs: a long non-body edge from a BODY node to a thin non-body JUNCTION far from the body (a rear
  // leg whose tip rests against the carapace or another leg forms a junction there instead of an endpoint)
  const thinAll=cands.map(c=>c.termDt).sort((a,b)=>a-b),thinRef=thinAll[Math.floor(thinAll.length/4)]??6;
  for(const e of g.edges){if(e.meanDt>=lc.bodyDt||e.length<loopMinLen)continue;const aBody=bodyIds.has(e.a),bBody=bodyIds.has(e.b);if(aBody===bBody)continue;const farId=aBody?e.b:e.a,far=g.nodes[farId];if(far.kind!=='junction'||far.dt>1.5*thinRef)continue;
    const d=Math.hypot(far.x-centre[0],far.y-centre[1]);if(d<lc.bodyDt*2)continue;
    // the arriving edge must itself be a limb (thin), not an arm/palm; the tip may rest on the carapace OR on another leg
    if(e.meanDt>2.2*thinRef)continue;
    if(cands.some(c=>Math.hypot(c.x-far.x,c.y-far.y)<20))continue;cands.push({kind:'touch',x:far.x,y:far.y,termDt:far.dt,term:e.length,attach:exitPoint([e],aBody?e.a:e.b)});}
  // Generic appendage classes on the candidates (no family knowledge):
  //  spine  = terminal branch shorter than minLimbTerm (hairs, serrations) → dropped;
  //  fork   = two long candidates whose tips are close AND whose separation points nearly coincide (the two fingers
  //           of a claw, the tines of a forked tail) → removed from the leg pool, kept as forked appendages;
  //  leg    = everything else, ordered per side by the separation angle; the template's count per side caps it.
  const minLimbTerm=30;const pool=cands.filter(c=>c.term>=minLimbTerm||c.kind!=='end');
  const forkOf=new Map();for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){const a=pool[i],b=pool[j];if(!a.attach||!b.attach)continue;
    // working-scale thresholds (512 px longest side): fingertips within ~85 master px, separation within ~40 master px
    if(Math.hypot(a.x-b.x,a.y-b.y)<=35&&Math.hypot(a.attach[0]-b.attach[0],a.attach[1]-b.attach[1])<=16){forkOf.set(a,b);forkOf.set(b,a);}}
  // side by the SEPARATION point (where the limb leaves the body), not the tip: tips of forward limbs cross the midline
  const sideOf=c=>((c.attach?c.attach[0]:c.x)<centre[0]?'Far':'Near');
  const sides={Far:[],Near:[]};for(const c of pool){if(forkOf.has(c))continue;sides[sideOf(c)].push(c);}
  const feet={Far:[],Near:[]},claws={Far:[],Near:[]};for(const c of pool)if(forkOf.has(c))claws[sideOf(c)].push(c);
  // touching-tip candidates are weaker evidence than free tips: they only fill a side whose free-tip legs are fewer
  // than the template count, and only from the rear (tips resting against the body are rear legs; occlusion happens
  // at the claw end and is a hidden slot, not a touch)
  for(const side of ['Far','Near']){const free=sides[side].filter(c=>c.kind!=='touch'),touch=sides[side].filter(c=>c.kind==='touch');
    const need=Math.max(0,legsPerSide-free.length);feet[side]=free.concat(touch.sort((a,b)=>b.term-a.term).slice(0,need));}
  // naming by the ATTACHMENT order along the body: sort each side's feet by the angle of their attachment point about
  // the body centre, rear/top first; leg0 is the most rearward attachment, and gaps fall at the claw end.
  const assigned={},hidden=[];
  for(const side of ['Far','Near']){const list=feet[side].map(f=>({f,a:ang(f.attach??[f.x,f.y],centre)}));
    const key=o=>side==='Near'?(o.a<-Math.PI/2?o.a+2*Math.PI:o.a):(o.a>Math.PI/2?-(o.a-2*Math.PI):-o.a);
    const ordered=list.sort((p,q)=>key(p)-key(q));
    for(let k=0;k<legsPerSide;k++){const name='leg'+k+side+'Foot';const o=ordered[k];if(o)assigned[name]={master:toM([o.f.x,o.f.y]).map(Math.round),kind:o.f.kind,attach:toM(o.f.attach??[o.f.x,o.f.y]).map(Math.round)};else hidden.push('leg'+k+side);}
    if(ordered.length>legsPerSide)for(const o of ordered.slice(legsPerSide))hidden.push('extra:'+side+':'+toM([o.f.x,o.f.y]).map(Math.round).join(','));}
  return {pool:pool.map(c=>({kind:c.kind,tip:toM([c.x,c.y]).map(Math.round),sep:c.attach?toM(c.attach).map(Math.round):null,term:c.term,termDt:c.termDt,fork:forkOf.has(c)})),assigned,hidden,claws:{Far:claws.Far.map(c=>toM([c.x,c.y]).map(Math.round)),Near:claws.Near.map(c=>toM([c.x,c.y]).map(Math.round))},centre:toM(centre).map(Math.round),feetFound:feet.Far.length+feet.Near.length};
}
