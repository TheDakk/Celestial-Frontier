/** IC-1 — limb chains from the ridge graph. The body is the connected set of graph edges whose thickness is a large
 * fraction of the painting's maximum; every other edge is limb material. A limb chain is a maximal path from a body
 * node outward to an endpoint through limb edges (branches inside a limb, such as a claw's two fingers, share their
 * trunk). Each chain carries length, mean/max thickness, attachment point and endpoint. Feet are then the chains
 * that are long and thin to the end; a claw is a chain with a thick section that forks into two endpoints; an eye is
 * a short chain from the body top ending in a knob thicker than its stalk. Template counts are applied after. */
export function limbChains(graph,dt,W,{bodyFraction=.45}={}){
  const {nodes,edges}=graph;let maxDt=0;for(const e of edges)maxDt=Math.max(maxDt,e.maxDt);const bodyDt=bodyFraction*maxDt;
  const adj=new Map(nodes.map(n=>[n.id,[]]));edges.forEach((e,i)=>{adj.get(e.a).push({e,i,to:e.b});adj.get(e.b).push({e,i,to:e.a});});
  const isBody=e=>e.meanDt>=bodyDt;const bodyNodes=new Set();for(const e of edges)if(isBody(e)){bodyNodes.add(e.a);bodyNodes.add(e.b);}
  // chains: one per endpoint = its SHORTEST path (by edge length) from the body set through non-body edges. A
  // multi-source Dijkstra from every body node replaces the earlier all-simple-paths DFS, which was exponential once
  // crossing legs and touching tips formed cycles in the limb subgraph (it ran out of memory on the painted crabs the
  // moment the duplicate-edge bug in ridge.mjs was fixed and the true connectivity appeared).
  const dist=new Map(),via=new Map();const queue=[];for(const b of bodyNodes){dist.set(b,0);via.set(b,null);queue.push(b);}
  while(queue.length){queue.sort((p,q)=>dist.get(p)-dist.get(q)||p-q);const u=queue.shift();const du=dist.get(u);
    for(const o of adj.get(u)){if(isBody(o.e))continue;const nd=du+o.e.length;if(!dist.has(o.to)||nd<dist.get(o.to)-1e-9){dist.set(o.to,nd);via.set(o.to,{from:u,e:o.e});if(!queue.includes(o.to))queue.push(o.to);}}}
  const chains=[];
  for(const n of nodes){if(n.kind!=='end'||!dist.has(n.id)||bodyNodes.has(n.id))continue;const pathEdges=[];let cur=n.id;while(via.get(cur)){pathEdges.unshift(via.get(cur).e);cur=via.get(cur).from;}if(!pathEdges.length)continue;
    const len=pathEdges.reduce((a,e)=>a+e.length,0),maxD=Math.max(...pathEdges.map(e=>e.maxDt)),meanD=pathEdges.reduce((a,e)=>a+e.meanDt*e.length,0)/len;chains.push({endNode:n,length:+len.toFixed(1),meanDt:+meanD.toFixed(1),maxDt:+maxD.toFixed(1),endDt:n.dt,edges:pathEdges});}
  // attach the root (the body node the chain starts from) — first edge endpoint that is a body node
  for(const c of chains){const first=c.edges[0];c.rootNode=nodes[bodyNodes.has(first.a)?first.a:first.b];}
  return {bodyDt:+bodyDt.toFixed(1),maxDt:+maxDt.toFixed(1),bodyNodes:[...bodyNodes].map(id=>nodes[id]),chains};
}
/** Classification by the TERMINAL branch (the last edge, from the last junction to the endpoint): a walking foot ends
 * a long thin terminal branch; a claw finger ends a long THICK terminal branch (two per claw); an eye is a short
 * branch ending in a knob; anything else (spines, hairs, fringe) is a stub. The thin reference is the median terminal
 * thickness of the longer half of the chains, so it follows the drawing's line weight. */
export function classifyChains(chains,{minTerm=16,termFactor=3,thickRatio=1.7}={}){
  const rows=chains.map(c=>{const last=c.edges[c.edges.length-1];return {chain:c,term:last.length,termDt:last.meanDt,endDt:c.endDt,maxDt:c.maxDt};});
  const long=rows.filter(r=>r.term>=Math.max(minTerm,termFactor*r.termDt)).sort((a,b)=>a.termDt-b.termDt);
  const lower=long.slice(0,Math.max(1,Math.ceil(long.length/2)));const thinRef=lower.length?lower[Math.floor((lower.length-1)/2)].termDt:1; // thin cluster = lower half
  const out={feet:[],claws:[],eyes:[],stubs:[],thinRef};
  for(const r of rows){const isLong=r.term>=Math.max(minTerm,termFactor*r.termDt);
    if(isLong&&r.termDt<=thickRatio*thinRef&&r.endDt<=6)out.feet.push(r);
    else if(isLong&&r.termDt>thickRatio*thinRef)out.claws.push(r);
    else if(!isLong&&r.endDt>=1.3*r.termDt&&r.endDt>=4)out.eyes.push(r);
    else out.stubs.push(r);}
  return out;
}
/** Separation point of a chain: the last node it shares with ANY other chain walking from the body outward (the
 * point where the limb becomes its own), so neighbouring legs that share trunk edges beside the body still order
 * correctly along the body outline. Returns per chain: the separation node and its angle about `centre`. */
export function separationPoints(chains,nodes,centre){
  const out=new Map();
  for(const c of chains){let sepNode=c.rootNode;let node=c.rootNode.id;
    for(const e of c.edges){const shared=chains.some(o=>o!==c&&o.edges.includes(e));const next=(e.a===node)?e.b:e.a;if(!shared)break;node=next;sepNode=nodes[node];}
    out.set(c,{node:sepNode,angle:Math.atan2(sepNode.y-centre[1],sepNode.x-centre[0])});}
  return out;
}
