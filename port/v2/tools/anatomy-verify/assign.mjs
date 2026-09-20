/** IC-1 — from the ridge graph to named template legs. Feet candidates are (a) long thin terminal branches (chains.mjs)
 * and (b) LOOP LIMBS: thin non-body edges whose both ends are body junctions (a rear leg whose tip rests against the
 * carapace has no endpoint; its foot is the edge point farthest from the body centre). Per side, the thin cluster is
 * count-driven: the thinnest long chains up to the template's legs per side, while their terminal thickness stays
 * within `thinSpread` of the thinnest. Assignment uses the GUIDE only for order: each guide foot's angle about the
 * guide's carapace centre is the expected angle of that leg; found feet go to the nearest expected angle, greedily
 * by best match, so a hidden leg simply leaves its slot empty. Scored against hand landmarks; not a writer. */
import {alphaOf,detectTips} from './tips.mjs';
import {ridgeGraph} from './ridge.mjs';
import {limbChains} from './chains.mjs';
const ang=(p,c)=>Math.atan2(p[1]-c[1],p[0]-c[0]);
const angDiff=(a,b)=>{let d=Math.abs(a-b)%(2*Math.PI);return d>Math.PI?2*Math.PI-d:d;};
export function assignLegs(rgba,w,h,guide,{legsPerSide=4,thinSpread=1.8,minTerm=16,termFactor=3,loopMinLen=60}={}){
  const {alpha}=alphaOf(rgba,w,h),det=detectTips(alpha,w,h,{solidAlpha:128}),{mask,dt,working:{width:W,height:H,scale,box}}=det;
  const g=ridgeGraph(mask,dt,W,H,{spurFactor:1.5,spurFloor:8}),lc=limbChains(g,dt,W);
  const toM=p=>[box.x+(p[0]-2)/scale,box.y+(p[1]-2)/scale];
  // body centre = centroid of body-edge pixels
  let sx=0,sy=0,n=0;for(const e of g.edges)if(e.meanDt>=lc.bodyDt)for(const i of e.path){sx+=i%W;sy+=Math.floor(i/W);n++;}const centre=[sx/n,sy/n];
  const bodyIds=new Set(lc.bodyNodes.map(b=>b.id));
  // (a) terminal-branch candidates
  const cands=[];for(const c of lc.chains){const last=c.edges[c.edges.length-1];if(last.length>=Math.max(minTerm,termFactor*last.meanDt)&&c.endDt<=6)cands.push({kind:'end',x:c.endNode.x,y:c.endNode.y,termDt:last.meanDt,term:last.length});}
  // (b) loop limbs
  for(const e of g.edges){if(e.meanDt>=lc.bodyDt||e.length<loopMinLen)continue;if(!bodyIds.has(e.a)||!bodyIds.has(e.b))continue;let far=null,fd=-1;for(const i of e.path){const p=[i%W,Math.floor(i/W)],d=Math.hypot(p[0]-centre[0],p[1]-centre[1]);if(d>fd){fd=d;far=p;}}
    if(far&&!cands.some(c=>Math.hypot(c.x-far[0],c.y-far[1])<20))cands.push({kind:'loop',x:far[0],y:far[1],termDt:e.meanDt,term:e.length});}
  // (c) touching limbs: a long non-body edge from a BODY node to a thin non-body JUNCTION far from the body (a rear
  // leg whose tip rests against the carapace or another leg forms a junction there instead of an endpoint)
  const thinAll=cands.map(c=>c.termDt).sort((a,b)=>a-b),thinRef=thinAll[Math.floor(thinAll.length/4)]??6;
  for(const e of g.edges){if(e.meanDt>=lc.bodyDt||e.length<loopMinLen)continue;const aBody=bodyIds.has(e.a),bBody=bodyIds.has(e.b);if(aBody===bBody)continue;const far=g.nodes[aBody?e.b:e.a];if(far.kind!=='junction'||far.dt>2.2*thinRef)continue;
    const d=Math.hypot(far.x-centre[0],far.y-centre[1]);if(d<lc.bodyDt*2)continue;if(cands.some(c=>Math.hypot(c.x-far.x,c.y-far.y)<20))continue;cands.push({kind:'touch',x:far.x,y:far.y,termDt:far.dt,term:e.length});}
  // per side: count-driven thin cluster
  const sides={Far:[],Near:[]};for(const c of cands)sides[c.x<centre[0]?'Far':'Near'].push(c);
  const feet={Far:[],Near:[]},claws={Far:[],Near:[]};
  for(const side of ['Far','Near']){const sorted=sides[side].sort((a,b)=>a.termDt-b.termDt);const thin=sorted[0]?.termDt??1;for(const c of sorted){if(feet[side].length<legsPerSide&&c.termDt<=thinSpread*thin)feet[side].push(c);else claws[side].push(c);}}
  // naming by ORDER only: on each side, sort found feet by angle about the body centre from the rear/top toward the
  // claw end; leg0 is the most rearward, and any missing slots fall at the claw end, where occlusion happens (the
  // species law and all five paintings). The guide contributes nothing here but the leg count.
  const assigned={},hidden=[];
  for(const side of ['Far','Near']){const list=feet[side].map(f=>({f,a:ang([f.x,f.y],centre)}));
    // rear/top first: Near side angles run from -π/2 (top) clockwise to +π/2; Far side mirrored
    const key=o=>side==='Near'?(o.a<-Math.PI/2?o.a+2*Math.PI:o.a):(o.a>Math.PI/2?-(o.a-2*Math.PI):-o.a);
    const ordered=list.sort((p,q)=>key(p)-key(q));
    for(let k=0;k<legsPerSide;k++){const name='leg'+k+side+'Foot';const o=ordered[k];if(o)assigned[name]={master:toM([o.f.x,o.f.y]).map(Math.round),kind:o.f.kind};else hidden.push('leg'+k+side);}}
  return {assigned,hidden,claws:{Far:claws.Far.map(c=>toM([c.x,c.y]).map(Math.round)),Near:claws.Near.map(c=>toM([c.x,c.y]).map(Math.round))},centre:toM(centre).map(Math.round),feetFound:feet.Far.length+feet.Near.length};
}
