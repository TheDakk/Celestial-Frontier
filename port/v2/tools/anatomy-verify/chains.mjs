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
  // chains: DFS from each body node through non-body edges to endpoints; record the path of edges
  const chains=[];const seen=new Set();
  const dfs=(nodeId,pathEdges,visited)=>{const outs=adj.get(nodeId).filter(o=>!isBody(o.e)&&!visited.has(o.i));const node=nodes[nodeId];
    if(!outs.length){if(node.kind==='end'&&pathEdges.length){const len=pathEdges.reduce((a,e)=>a+e.length,0),maxD=Math.max(...pathEdges.map(e=>e.maxDt)),meanD=pathEdges.reduce((a,e)=>a+e.meanDt*e.length,0)/len;chains.push({endNode:node,length:+len.toFixed(1),meanDt:+meanD.toFixed(1),maxDt:+maxD.toFixed(1),endDt:node.dt,edges:pathEdges.slice()});}return;}
    for(const o of outs){visited.add(o.i);pathEdges.push(o.e);dfs(o.to,pathEdges,visited);pathEdges.pop();visited.delete(o.i);}};
  for(const b of bodyNodes){dfs(b,[],new Set());}
  // attach the root (the body node the chain starts from) — first edge endpoint that is a body node
  for(const c of chains){const first=c.edges[0];c.rootNode=nodes[bodyNodes.has(first.a)?first.a:first.b];}
  // de-duplicate chains that share the same endpoint (keep the shortest trunk — the most direct attachment)
  const byEnd=new Map();for(const c of chains){const k=c.endNode.id;if(!byEnd.has(k)||byEnd.get(k).length>c.length)byEnd.set(k,c);}
  return {bodyDt:+bodyDt.toFixed(1),maxDt:+maxDt.toFixed(1),bodyNodes:[...bodyNodes].map(id=>nodes[id]),chains:[...byEnd.values()]};
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
