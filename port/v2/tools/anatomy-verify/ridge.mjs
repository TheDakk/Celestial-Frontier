/** IC-1 core primitive — the painting's ridge graph. From the working mask and its exact distance transform:
 * ridge pixels are local maxima of the DT along at least one axis (an approximate medial axis), thinned to one
 * pixel, pruned of spurs shorter than the local radius (boundary artifacts), then read as a graph: nodes are
 * endpoints and junctions (junction pixels clustered within a radius), edges are the pixel chains between them,
 * each carrying its length, DT profile (min/mean/max) and end radii. This is the structure the template graph is
 * matched against; no template knowledge is used here. Deterministic. */
import {thin} from './skeleton.mjs';
export function ridgeGraph(mask,dt,W,H,{minRidgeDt=1.5,spurFactor=1.5,junctionRadius=3,source='mask',spurFloor=12}={}){
  if(source==='mask')return graphFromSkeleton(thin(mask,W,H),mask,dt,W,H,{spurFactor,junctionRadius,spurFloor});
  const ridge=new Uint8Array(W*H);
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!mask[i]||dt[i]<minRidgeDt)continue;const v=dt[i];
    if((v>=dt[i-1]&&v>=dt[i+1]&&(v>dt[i-1]||v>dt[i+1]))||(v>=dt[i-W]&&v>=dt[i+W]&&(v>dt[i-W]||v>dt[i+W]))||(v>=dt[i-W-1]&&v>=dt[i+W+1]&&(v>dt[i-W-1]||v>dt[i+W+1]))||(v>=dt[i-W+1]&&v>=dt[i+W-1]&&(v>dt[i-W+1]||v>dt[i+W-1])))ridge[i]=1;}
  // bridge one-pixel gaps: dilate by one then thin
  const grown=new Uint8Array(W*H);for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!mask[i])continue;if(ridge[i]||ridge[i-1]||ridge[i+1]||ridge[i-W]||ridge[i+W])grown[i]=1;}
  return graphFromSkeleton(thin(grown,W,H),mask,dt,W,H,{spurFactor,junctionRadius});
}
export function graphFromSkeleton(skelIn,mask,dt,W,H,{spurFactor=1.5,junctionRadius=3,spurFloor=12}={}){
  let skel=Uint8Array.from(skelIn);
  const nb=(i)=>{const x=i%W,y=(i-x)/W,o=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&skel[ny*W+nx])o.push(ny*W+nx);}return o;};
  // crossing number: background→skeleton transitions around the pixel (diagonal staircases have 2, junctions ≥3, endpoints 1)
  const cross=(i)=>{const x=i%W,y=(i-x)/W,ring=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]].map(([dx,dy])=>{const nx=x+dx,ny=y+dy;return nx>=0&&ny>=0&&nx<W&&ny<H&&skel[ny*W+nx]?1:0;});let c=0;for(let k=0;k<8;k++)if(!ring[k]&&ring[(k+1)%8])c++;return c;};
  // prune spurs: leaf chains from an endpoint to an ORIGINAL junction (junctions fixed before any deletion, so a
  // walk can never run through a junction whose siblings were already removed) shorter than their own thickness × factor
  const original=Uint8Array.from(skel);const cross0=(i)=>{const x=i%W,y=(i-x)/W,ring=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]].map(([dx,dy])=>{const nx=x+dx,ny=y+dy;return nx>=0&&ny>=0&&nx<W&&ny<H&&original[ny*W+nx]?1:0;});let c=0;for(let k=0;k<8;k++)if(!ring[k]&&ring[(k+1)%8])c++;return c;};
  const junction0=new Uint8Array(W*H);for(let i=0;i<W*H;i++)if(original[i]&&cross0(i)>=3)junction0[i]=1;
  for(let pass=0;pass<2;pass++){for(let i=0;i<W*H;i++){if(!skel[i]||cross(i)!==1)continue;const path=[i];let cur=i,prev=-1,hit=false;
      const nearJ=(i)=>{const x=i%W,y=(i-x)/W;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&junction0[ny*W+nx])return ny*W+nx;}return -1;};
      for(let s=0;s<400;s++){const n=nb(cur).filter(j=>j!==prev&&!path.includes(j));if(!n.length)break;if(n.length>=2){hit=true;break;} // a fork the crossing number missed: stop here
        prev=cur;cur=n[0];path.push(cur);const jn=nearJ(cur);if(jn>=0){if(jn!==cur)path.push(jn);cur=jn;hit=true;break;}}
      // artefact iff the spur's tip never leaves its junction's own disc (a real limb or finger reaches far beyond it)
      if(hit){const j=cur,tip=path[0],reach=Math.hypot(tip%W-j%W,Math.floor(tip/W)-Math.floor(j/W));if(reach<=dt[j]*spurFactor+2||path.length-1<spurFloor){for(const k of path.slice(0,-1))skel[k]=0;}}}}
  // drop skeleton components shorter than the spur floor (thinning fragments along boundaries)
  {const seen=new Uint8Array(W*H);for(let i=0;i<W*H;i++){if(!skel[i]||seen[i])continue;const comp=[i];seen[i]=1;const st=[i];while(st.length){const c=st.pop();for(const j of nb(c))if(!seen[j]){seen[j]=1;comp.push(j);st.push(j);}}if(comp.length<spurFloor*2)for(const j of comp)skel[j]=0;}}
  // nodes
  const deg=new Uint8Array(W*H);for(let i=0;i<W*H;i++)if(skel[i])deg[i]=cross(i);
  const nodeId=new Int32Array(W*H).fill(-1),nodes=[];
  for(let i=0;i<W*H;i++){if(!skel[i]||nodeId[i]>=0||deg[i]===2)continue;const kind=deg[i]<=1?'end':'junction';if(deg[i]===2)continue;
    // cluster junction pixels within junctionRadius
    const members=[i];nodeId[i]=nodes.length;if(kind==='junction'){const st=[i];while(st.length){const c=st.pop();for(const j of nb(c))if(nodeId[j]<0&&deg[j]>=3&&Math.hypot(j%W-i%W,Math.floor(j/W)-Math.floor(i/W))<=junctionRadius){nodeId[j]=nodes.length;members.push(j);st.push(j);}}}
    let sx=0,sy=0,md=0;for(const m of members){sx+=m%W;sy+=Math.floor(m/W);md=Math.max(md,dt[m]);}nodes.push({id:nodes.length,kind,x:sx/members.length,y:sy/members.length,dt:+md.toFixed(1),members});}
  // edges: walk from every node member along degree-2 chains
  const edges=[],seenEdge=new Set();
  for(const node of nodes)for(const m of node.members)for(const start of nb(m)){if(nodeId[start]>=0&&nodeId[start]===node.id)continue;const key=Math.min(m,start)+':'+Math.max(m,start);if(seenEdge.has(key))continue;
    const path=[m],visited=new Set(node.members);let cur=start,prev=m,len=0,minD=1e9,sumD=0,maxD=0;while(true){path.push(cur);visited.add(cur);len+=Math.hypot(cur%W-prev%W,Math.floor(cur/W)-Math.floor(prev/W));const d=dt[cur];minD=Math.min(minD,d);maxD=Math.max(maxD,d);sumD+=d;if(nodeId[cur]>=0&&nodeId[cur]!==node.id)break;const n=nb(cur).filter(j=>!visited.has(j)).sort((p,q)=>((nodeId[q]>=0)-(nodeId[p]>=0))||((Math.abs(p%W-cur%W)+Math.abs(Math.floor(p/W)-Math.floor(cur/W)))-(Math.abs(q%W-cur%W)+Math.abs(Math.floor(q/W)-Math.floor(cur/W)))));if(!n.length)break;prev=cur;cur=n[0];if(path.length>5000)break;}
    const a=node.id,b=nodeId[cur];if(b<0||b===a)continue;const k2=Math.min(path[0],path[1])+':'+Math.max(path[0],path[1]),k3=Math.min(path[path.length-1],path[path.length-2])+':'+Math.max(path[path.length-1],path[path.length-2]);if(seenEdge.has(k3))continue;seenEdge.add(k2);seenEdge.add(k3);
    edges.push({a,b,length:+len.toFixed(1),minDt:+minD.toFixed(1),meanDt:+(sumD/(path.length-1)).toFixed(1),maxDt:+maxD.toFixed(1),path});}
  return {skeleton:skel,nodes,edges};
}
