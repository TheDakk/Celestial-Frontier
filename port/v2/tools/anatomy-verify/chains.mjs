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
export function classifyChains(chains,{thinRatio=1.6}={}){
  const thinRef=(()=>{const v=chains.map(c=>c.meanDt).sort((a,b)=>a-b);const lower=v.slice(0,Math.max(1,Math.ceil(v.length/2)));return lower[Math.floor(lower.length/2)]??1;})();
  const out={feet:[],claws:[],eyes:[],stubs:[],thinRef};
  // claws: chains whose maxDt is much larger than thinRef and which fork (another chain shares ≥1 edge)
  const shares=(a,b)=>a.edges.some(e=>b.edges.includes(e));
  for(const c of chains){const forks=chains.some(o=>o!==c&&shares(o,c)&&o.maxDt>=3*thinRef&&c.maxDt>=3*thinRef);
    if(c.length<2*thinRef*3&&c.endDt>c.meanDt*1.3)out.eyes.push(c); // short knob-ended chain
    else if(c.maxDt>=3*thinRef&&forks)out.claws.push(c);
    else if(c.length>=30&&c.meanDt<=thinRatio*thinRef*2)out.feet.push(c);
    else out.stubs.push(c);}
  return out;
}
