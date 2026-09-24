function forwardProjection(s){const{position:p,triangleDofs,triangleSigns,triangleFloors,triangleMovable}=s;let orientationPasses=0;
 for(let pass=0;pass<s.orientationIterations;pass++){
  let changed=0,progressed=false;for(let k=0;k<triangleDofs.length;k+=3){
   const a=triangleDofs[k],b=triangleDofs[k+1],c=triangleDofs[k+2],triangle=k/3,sign=triangleSigns[triangle],movable=triangleMovable[triangle];
   const area=(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]),constraint=area*sign-triangleFloors[triangle];
   if(constraint>=0)continue;changed++;
   const ax=p[b+1]-p[c+1],ay=p[c]-p[b],bx=p[c+1]-p[a+1],by=p[a]-p[c],cx=p[a+1]-p[b+1],cy=p[b]-p[a];
   const norm=(movable&1?ax*ax+ay*ay:0)+(movable&2?bx*bx+by*by:0)+(movable&4?cx*cx+cy*cy:0);if(norm<1e-20)continue;
   const scale=-constraint*sign/norm;
   if(movable&1){const x=p[a],y=p[a+1];p[a]+=scale*ax;p[a+1]+=scale*ay;if(!Object.is(x,p[a])||!Object.is(y,p[a+1]))progressed=true;}
   if(movable&2){const x=p[b],y=p[b+1];p[b]+=scale*bx;p[b+1]+=scale*by;if(!Object.is(x,p[b])||!Object.is(y,p[b+1]))progressed=true;}
   if(movable&4){const x=p[c],y=p[c+1];p[c]+=scale*cx;p[c+1]+=scale*cy;if(!Object.is(x,p[c])||!Object.is(y,p[c+1]))progressed=true;}
  }
  // Repeating a sweep that changed no Float64 coordinate is an exact no-op,
  // including signed zero. Keep the final orientation refusal: a stalled
  // contradictory contact pose still fails and never publishes its pixels.
  orientationPasses=pass+1;if(!changed||!progressed){s.orientationQueue.stalled=!progressed;break;}
 }
 return orientationPasses;
}

function before(q,a,b){return q.priority[a]>q.priority[b]||(q.priority[a]===q.priority[b]&&a<b);}
function swap(q,i,j){const a=q.heap[i],b=q.heap[j];q.heap[i]=b;q.heap[j]=a;q.location[a]=j;q.location[b]=i;};
function repair(q,pos){while(pos>0){const parent=(pos-1)>>>1;if(!before(q,q.heap[pos],q.heap[parent]))break;swap(q,pos,parent);pos=parent;}for(;;){const left=pos*2+1;if(left>=q.size)break;const right=left+1,best=right<q.size&&before(q,q.heap[right],q.heap[left])?right:left;if(!before(q,q.heap[best],q.heap[pos]))break;swap(q,best,pos);pos=best;}};
function remove(q,t){const pos=q.location[t];if(pos<0)return;const last=q.heap[--q.size];q.location[t]=-1;if(pos<q.size){q.heap[pos]=last;q.location[last]=pos;repair(q,pos);}};
function update(s,t){const q=s.orientationQueue,p=s.position,d=s.triangleDofs,signs=s.triangleSigns,floors=s.triangleFloors,movable=s.triangleMovable;const k=t*3,a=d[k],b=d[k+1],c=d[k+2],area=((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]))*signs[t];
  // Relative residual balances differently sized source triangles. The tiny
  // tolerance terminates roundoff at the positive area floor, not near zero.
  const priority=1-area/floors[t];q.priority[t]=priority;
  if(priority<=1e-12||movable[t]===0){remove(q,t);return;}
  let pos=q.location[t];if(pos<0){pos=q.size++;q.heap[pos]=t;q.location[t]=pos;}repair(q,pos);
 };

/** Deterministic active-set area projection. Topology and scratch are compiled
 * once; a seek starts from the supplied positions, never the previous frame.
 * All families use the same budget and constraints. Hard pins stay fixed. */
export function createOrientationProjector(triangles,vertexCount){
 const count=triangles.length/3,degree=new Uint32Array(vertexCount);
 for(const v of triangles)degree[v]++;
 const starts=new Uint32Array(vertexCount+1);for(let i=0;i<vertexCount;i++)starts[i+1]=starts[i]+degree[i];
 const cursor=starts.slice(),incident=new Uint32Array(triangles.length);for(let t=0;t<count;t++)for(let c=0;c<3;c++)incident[cursor[triangles[t*3+c]]++]=t;
 return{starts,incident,heap:new Uint32Array(count),location:new Int32Array(count),priority:new Float64Array(count),size:0,projections:0,visits:0};
}
export function projectOrientations(s){
 const q=s.orientationQueue,p=s.position,{triangleDofs:d,triangleSigns:signs,triangleFloors:floors,triangleMovable:movable}=s,count=floors.length;
 q.size=0;q.projections=0;q.visits=0;q.stalled=false;q.location.fill(-1);
 // Preserve the established inexpensive solve (and its accepted poses) when
 // it succeeds. Only an unresolved signed fold invokes the active-set repair.
 // Both stages are bounded by orientationIterations; there is no pose retry.
 let fastPasses;
 if(s.orientationKernel){
  // The optional leaf copies back only after a valid result. A runtime trap
  // therefore leaves the input available for the unchanged JS fallback.
  try{fastPasses=s.orientationKernel.run(p,s.orientationIterations);q.stalled=s.orientationKernel.stalled;}
  catch{s.orientationKernel=null;fastPasses=forwardProjection(s);}
 }else fastPasses=forwardProjection(s);
 let folded=false;
 for(let k=0;k<d.length;k+=3){const a=d[k],b=d[k+1],c=d[k+2];if(((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]))*signs[k/3]<=0){folded=true;break;}}
 if(!folded||q.stalled)return fastPasses;
 if(s.orientationActiveKernel){
  // Both position and complete heap state are transactional in the leaf.
  // Preserve the original ordered active solve when the backend is unavailable.
  try{return fastPasses+s.orientationActiveKernel.run(p,q,s.orientationIterations);}
  catch{s.orientationActiveKernel=null;}
 }
 for(let t=0;t<count;t++)update(s,t);
 // The old solver visited every triangle once per pass. Spend that same
 // upper bound on violated constraints, updating only their neighbours.
 const budget=count*s.orientationIterations;
 // Correct to the existing area target, then stop with a half-target safety
 // margin. This hysteresis avoids endless soft-goal relaxation and leaves
 // room for Float32 publication and clipped-part interpolation. Every field
 // and visible part still independently passes its original orientation gate.
 while(q.size&&q.priority[q.heap[0]]>=.5&&q.visits<budget){const t=q.heap[0],k=t*3,a=d[k],b=d[k+1],c=d[k+2],mask=movable[t],sign=signs[t];q.visits++;
  const area=(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]),constraint=area*sign-floors[t];
  const ax=p[b+1]-p[c+1],ay=p[c]-p[b],bx=p[c+1]-p[a+1],by=p[a]-p[c],cx=p[a+1]-p[b+1],cy=p[b]-p[a];
  const norm=(mask&1?ax*ax+ay*ay:0)+(mask&2?bx*bx+by*by:0)+(mask&4?cx*cx+cy*cy:0);
  if(norm<1e-20){remove(q,t);continue;}
  const scale=-constraint*sign/norm;let changed=false;
  if(mask&1){const x=p[a],y=p[a+1];p[a]+=scale*ax;p[a+1]+=scale*ay;changed||=!Object.is(x,p[a])||!Object.is(y,p[a+1]);}
  if(mask&2){const x=p[b],y=p[b+1];p[b]+=scale*bx;p[b+1]+=scale*by;changed||=!Object.is(x,p[b])||!Object.is(y,p[b+1]);}
  if(mask&4){const x=p[c],y=p[c+1];p[c]+=scale*cx;p[c+1]+=scale*cy;changed||=!Object.is(x,p[c])||!Object.is(y,p[c+1]);}
  if(!changed){remove(q,t);continue;}q.projections++;
  for(let corner=0;corner<3;corner++){if(!(mask&(1<<corner)))continue;const v=d[k+corner]/2;for(let i=q.starts[v];i<q.starts[v+1];i++)update(s,q.incident[i]);}
 }
 return fastPasses+Math.ceil(q.visits/count);
}
