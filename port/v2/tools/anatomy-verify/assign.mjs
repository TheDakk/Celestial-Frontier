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
  const cands=[];for(const c of lc.chains){const last=c.edges[c.edges.length-1];if(last.length>=Math.max(minTerm,termFactor*last.meanDt)&&c.endDt<=6)cands.push({kind:'end',x:c.endNode.x,y:c.endNode.y,termDt:last.meanDt,term:last.length,attach:[c.rootNode.x,c.rootNode.y]});}
  // (b) loop limbs
  for(const e of g.edges){if(e.meanDt>=lc.bodyDt||e.length<loopMinLen)continue;if(!bodyIds.has(e.a)||!bodyIds.has(e.b))continue;let far=null,fd=-1;for(const i of e.path){const p=[i%W,Math.floor(i/W)],d=Math.hypot(p[0]-centre[0],p[1]-centre[1]);if(d>fd){fd=d;far=p;}}
    if(far&&!cands.some(c=>Math.hypot(c.x-far[0],c.y-far[1])<20)){const bn=g.nodes[e.a];cands.push({kind:'loop',x:far[0],y:far[1],termDt:e.meanDt,term:e.length,attach:[bn.x,bn.y]});}}
  // (c) touching limbs: a long non-body edge from a BODY node to a thin non-body JUNCTION far from the body (a rear
  // leg whose tip rests against the carapace or another leg forms a junction there instead of an endpoint)
  const thinAll=cands.map(c=>c.termDt).sort((a,b)=>a-b),thinRef=thinAll[Math.floor(thinAll.length/4)]??6;
  for(const e of g.edges){if(e.meanDt>=lc.bodyDt||e.length<loopMinLen)continue;const aBody=bodyIds.has(e.a),bBody=bodyIds.has(e.b);if(aBody===bBody)continue;const farId=aBody?e.b:e.a,far=g.nodes[farId];if(far.kind!=='junction'||far.dt>1.5*thinRef)continue;
    const d=Math.hypot(far.x-centre[0],far.y-centre[1]);if(d<lc.bodyDt*2)continue;
    // the limb must END here: no other non-body edge leaves this junction and travels farther from the body centre
    const continues=g.edges.some(o=>o!==e&&(o.a===farId||o.b===farId)&&o.meanDt<lc.bodyDt&&o.length>=30&&(()=>{const other=g.nodes[o.a===farId?o.b:o.a];return Math.hypot(other.x-centre[0],other.y-centre[1])>d+10;})());if(continues)continue;
    if(cands.some(c=>Math.hypot(c.x-far.x,c.y-far.y)<20))continue;const bn=g.nodes[aBody?e.a:e.b];cands.push({kind:'touch',x:far.x,y:far.y,termDt:far.dt,term:e.length,attach:[bn.x,bn.y]});}
  // claw fingers: two long candidates whose chains attach to the body at the same point (shared first edge) and whose
  // tips are close — mark both as claw; also anything whose terminal thickness is far above the median
  for(const c of cands){const chain=lc.chains.find(ch=>Math.hypot(ch.endNode.x-c.x,ch.endNode.y-c.y)<1);c.rootEdge=chain?chain.edges[0]:null;}
  for(let i=0;i<cands.length;i++)for(let j=i+1;j<cands.length;j++){const a=cands[i],b=cands[j];if(a.rootEdge&&a.rootEdge===b.rootEdge&&Math.hypot(a.x-b.x,a.y-b.y)<=90&&a.term>=40&&b.term>=40){a.claw=true;b.claw=true;}}
  // per side: tolerance band around the median terminal thickness of the non-claw long candidates, up to the count
  const sides={Far:[],Near:[]};for(const c of cands)sides[c.x<centre[0]?'Far':'Near'].push(c);
  const feet={Far:[],Near:[]},claws={Far:[],Near:[]};
  const allThin=cands.filter(c=>!c.claw).map(c=>c.termDt).sort((a,b)=>a-b),med=allThin[Math.floor(allThin.length/2)]??6;
  for(const side of ['Far','Near']){const pool=sides[side].filter(c=>!c.claw&&c.termDt<=thinSpread*med).sort((a,b)=>Math.abs(a.termDt-med)-Math.abs(b.termDt-med));
    feet[side]=pool.slice(0,legsPerSide);claws[side]=sides[side].filter(c=>!feet[side].includes(c));}
  // naming by the ATTACHMENT order along the body: sort each side's feet by the angle of their attachment point about
  // the body centre, rear/top first; leg0 is the most rearward attachment, and gaps fall at the claw end.
  const assigned={},hidden=[];
  for(const side of ['Far','Near']){const list=feet[side].map(f=>({f,a:ang(f.attach??[f.x,f.y],centre)}));
    const key=o=>side==='Near'?(o.a<-Math.PI/2?o.a+2*Math.PI:o.a):(o.a>Math.PI/2?-(o.a-2*Math.PI):-o.a);
    const ordered=list.sort((p,q)=>key(p)-key(q));
    for(let k=0;k<legsPerSide;k++){const name='leg'+k+side+'Foot';const o=ordered[k];if(o)assigned[name]={master:toM([o.f.x,o.f.y]).map(Math.round),kind:o.f.kind,attach:toM(o.f.attach??[o.f.x,o.f.y]).map(Math.round)};else hidden.push('leg'+k+side);}}
  return {assigned,hidden,claws:{Far:claws.Far.map(c=>toM([c.x,c.y]).map(Math.round)),Near:claws.Near.map(c=>toM([c.x,c.y]).map(Math.round))},centre:toM(centre).map(Math.round),feetFound:feet.Far.length+feet.Near.length};
}
