/** Frozen active stage of the pre-optimization orientation owner. Setup-only
 * admission oracle and focused test reference; no previous-pose state or retry. */
function before(q,a,b){return q.priority[a]>q.priority[b]||(q.priority[a]===q.priority[b]&&a<b);}
function swap(q,i,j){const a=q.heap[i],b=q.heap[j];q.heap[i]=b;q.heap[j]=a;q.location[a]=j;q.location[b]=i;};
function repair(q,pos){while(pos>0){const parent=(pos-1)>>>1;if(!before(q,q.heap[pos],q.heap[parent]))break;swap(q,pos,parent);pos=parent;}for(;;){const left=pos*2+1;if(left>=q.size)break;const right=left+1,best=right<q.size&&before(q,q.heap[right],q.heap[left])?right:left;if(!before(q,q.heap[best],q.heap[pos]))break;swap(q,best,pos);pos=best;}};
function remove(q,t){const pos=q.location[t];if(pos<0)return;const last=q.heap[--q.size];q.location[t]=-1;if(pos<q.size){q.heap[pos]=last;q.location[last]=pos;repair(q,pos);}};
function update(s,t){const q=s.orientationQueue,p=s.position,d=s.triangleDofs,signs=s.triangleSigns,floors=s.triangleFloors,movable=s.triangleMovable;const k=t*3,a=d[k],b=d[k+1],c=d[k+2],area=((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]))*signs[t];
  const priority=1-area/floors[t];q.priority[t]=priority;
  if(priority<=1e-12||movable[t]===0){remove(q,t);return;}
  let pos=q.location[t];if(pos<0){pos=q.size++;q.heap[pos]=t;q.location[t]=pos;}repair(q,pos);
 };
export function runOrientationActiveReference(s){
 const q=s.orientationQueue,p=s.position,{triangleDofs:d,triangleSigns:signs,triangleFloors:floors,triangleMovable:movable}=s,count=floors.length;
 for(let t=0;t<count;t++)update(s,t);
 const budget=count*s.orientationIterations;
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
 return Math.ceil(q.visits/count);
}
