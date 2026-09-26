/** Allocation-free local/global 2D shape projection. The pose owner supplies all
 * targets; this solver neither authors curves nor changes bone transforms.
 * Independent anatomical surfaces must supply independent vertex inventories. */
const need=(ok,why)=>{if(!ok)throw Error('ARAP skin: '+why);};
export function createArapScratch(vertices,triangles,width,height,options={}){
 need(Array.isArray(vertices)&&vertices.length>=3&&vertices.length<=40000,'vertex budget');
 need(Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0,'dimensions');
 need((Array.isArray(triangles)||ArrayBuffer.isView(triangles))&&triangles.length>0&&triangles.length%3===0&&triangles.length<=600000,'triangle budget');
 const n=vertices.length,rest=new Float64Array(n*2),adj=Array.from({length:n},()=>new Set()),areas=new Float64Array(triangles.length/3);
 vertices.forEach((p,i)=>{need(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=width&&p.y<=height,'rest vertex');rest[i*2]=p.x;rest[i*2+1]=p.y;});
 for(let k=0;k<triangles.length;k+=3){const a=triangles[k],b=triangles[k+1],c=triangles[k+2];
  need([a,b,c].every(i=>Number.isInteger(i)&&i>=0&&i<n)&&a!==b&&b!==c&&c!==a,'triangle indices');
  const area=(rest[b*2]-rest[a*2])*(rest[c*2+1]-rest[a*2+1])-(rest[b*2+1]-rest[a*2+1])*(rest[c*2]-rest[a*2]);need(Math.abs(area)>1e-9,'degenerate triangle');areas[k/3]=area;
  for(const [i,j]of [[a,b],[b,c],[c,a]]){adj[i].add(j);adj[j].add(i);}
 }
 need(adj.every(a=>a.size>0),'unconnected vertex');
 const starts=new Uint32Array(n+1);for(let i=0;i<n;i++)starts[i+1]=starts[i]+adj[i].size;
 const neighbours=new Uint32Array(starts[n]),neighbourDofs=new Uint32Array(starts[n]),deltas=new Float64Array(starts[n]*2);
 for(let i=0;i<n;i++){let k=starts[i];for(const j of [...adj[i]].sort((a,b)=>a-b)){neighbours[k]=j;neighbourDofs[k]=j*2;deltas[k*2]=rest[i*2]-rest[j*2];deltas[k*2+1]=rest[i*2+1]-rest[j*2+1];k++;}}
 const iterations=options.iterations??4,globalIterations=options.globalIterations??4,targetWeight=options.targetWeight??.35,orientationIterations=options.orientationIterations??24,minimumAreaRatio=options.minimumAreaRatio??.12;
 need(Number.isInteger(iterations)&&iterations>=1&&iterations<=16&&Number.isInteger(globalIterations)&&globalIterations>=1&&globalIterations<=32,'iteration budget');
 need(Number.isFinite(targetWeight)&&targetWeight>0&&targetWeight<=100,'target weight');
 need(Number.isInteger(orientationIterations)&&orientationIterations>=1&&orientationIterations<=64&&Number.isFinite(minimumAreaRatio)&&minimumAreaRatio>0&&minimumAreaRatio<=.5,'orientation budget');
 const pins=new Uint8Array(n);for(const i of options.pins??[]){need(Number.isInteger(i)&&i>=0&&i<n&&!pins[i],'pin');pins[i]=1;}
 // Compile invariant topology once. Movable rows retain their original order;
 // hard pins are already exact after p.set(t) and no solve may change them.
 const freeDofs=Uint32Array.from(Array.from({length:n},(_,i)=>i).filter(i=>!pins[i]),i=>i*2),lambda=new Float64Array(n),divisor=new Float64Array(n);
 for(let i=0;i<n;i++){const degree=starts[i+1]-starts[i];lambda[i]=degree*targetWeight;divisor[i]=degree*(1+targetWeight);}
 // The repeated global sweep consumes compact movable rows: position dof,
 // degree, original adjacency start, then the first eight neighbor dofs.
 // Wider rows retain the original ordered CSR remainder. No topology is dropped.
 const solveRows=new Uint32Array(freeDofs.length*11),solveDivisors=new Float64Array(freeDofs.length);
 for(let row=0;row<freeDofs.length;row++){const ii=freeDofs[row],i=ii/2,start=starts[i],degree=starts[i+1]-start,base=row*11;solveRows[base]=ii;solveRows[base+1]=degree;solveRows[base+2]=start;solveDivisors[row]=divisor[i];for(let k=0;k<Math.min(8,degree);k++)solveRows[base+3+k]=neighbourDofs[start+k];}
 const triangleDofs=Uint32Array.from(triangles,i=>i*2),triangleSigns=new Int8Array(areas.length),triangleFloors=new Float64Array(areas.length),triangleMovable=new Uint8Array(areas.length);
 for(let k=0;k<areas.length;k++){triangleSigns[k]=Math.sign(areas[k]);triangleFloors[k]=Math.abs(areas[k])*minimumAreaRatio;triangleMovable[k]=(pins[triangles[k*3]]?0:1)|(pins[triangles[k*3+1]]?0:2)|(pins[triangles[k*3+2]]?0:4);}
 let axis=1,axisDistance=0;for(let i=1;i<n;i++){const distance=(rest[i*2]-rest[0])**2+(rest[i*2+1]-rest[1])**2;if(distance>axisDistance){axis=i;axisDistance=distance;}}need(axisDistance>1e-18,'rest axis');
 return {n,width,height,rest,starts,neighbours,neighbourDofs,deltas,pins,freeDofs,lambda,divisor,solveRows,solveDivisors,triangleDofs,triangleSigns,triangleFloors,triangleMovable,iterations,globalIterations,targetWeight,axis,triangles:Uint32Array.from(triangles),areas,orientationIterations,minimumAreaRatio,
  position:new Float64Array(n*2),target:new Float64Array(n*2),rotation:new Float64Array(n*2),rhs:new Float64Array(n*2),
  stats:{rigid:false,maximumTargetErrorPx:0,rmsTargetErrorPx:0,maximumProjectionPx:0,flippedTriangles:0,minimumAreaRatio:1,orientationPasses:0}};
}
/** Targets/output use the rig's normalized cut-out space. Scratch is exclusive
 * to one rig. Repeated seeking is deterministic and never uses its last pose. */
export function solveArapSkin(s,targets,output){
 need(targets?.length===s.n*2&&output?.length===s.n*2,'position buffer');
 const {n,width,height,rest,position:p,target:t,starts,neighbourDofs,deltas,rotation:r,rhs,pins,freeDofs,lambda,divisor,solveRows,solveDivisors,triangleDofs,triangleSigns,triangleFloors,triangleMovable}=s;
 for(let i=0;i<n;i++){const x=targets[i*2],y=targets[i*2+1];need(Number.isFinite(x)&&Number.isFinite(y),'nonfinite target');t[i*2]=x*width;t[i*2+1]=y*height;}
 // Avoid numerical drift for exact rest and uniform rigid poses. This is a
 // geometric identity test, not a reduced-motion shortcut.
 const a=s.axis*2,ux=rest[a]-rest[0],uy=rest[a+1]-rest[1],vx=t[a]-t[0],vy=t[a+1]-t[1],len2=ux*ux+uy*uy;
 const cs=(ux*vx+uy*vy)/len2,sn=(ux*vy-uy*vx)/len2;let rigid=Math.abs(cs*cs+sn*sn-1)<=2e-6;
 if(rigid)for(let i=0;i<n;i++){const x=rest[i*2]-rest[0],y=rest[i*2+1]-rest[1];if(Math.abs(t[i*2]-(t[0]+cs*x-sn*y))>2e-4||Math.abs(t[i*2+1]-(t[1]+sn*x+cs*y))>2e-4){rigid=false;break;}}
 // Approximate affine equality cannot certify orientation: a very thin visible
 // triangle can reflect entirely inside that tolerance. Check every signed
 // triangle before the identity shortcut is allowed to publish any pixels.
 if(rigid)for(let k=0;k<triangleDofs.length;k+=3){const a=triangleDofs[k],b=triangleDofs[k+1],c=triangleDofs[k+2],ratio=((t[b]-t[a])*(t[c+1]-t[a+1])-(t[b+1]-t[a+1])*(t[c]-t[a]))/s.areas[k/3];if(!Number.isFinite(ratio)||ratio<=0){rigid=false;break;}}
 if(rigid){output.set(targets);s.stats.rigid=true;s.stats.maximumTargetErrorPx=0;s.stats.rmsTargetErrorPx=0;s.stats.maximumProjectionPx=0;s.stats.flippedTriangles=0;s.stats.minimumAreaRatio=1;s.stats.orientationPasses=0;return s.stats;}
 s.stats.rigid=false;p.set(t);
 for(let pass=0;pass<s.iterations;pass++){
  for(let i=0;i<n;i++){let dot=0,cross=0;const ix=p[i*2],iy=p[i*2+1];
   for(let k=starts[i];k<starts[i+1];k++){const j=neighbourDofs[k],px=ix-p[j],py=iy-p[j+1],x=deltas[k*2],y=deltas[k*2+1];dot+=x*px+y*py;cross+=x*py-y*px;}
   const length=Math.hypot(dot,cross);r[i*2]=length>1e-12?dot/length:1;r[i*2+1]=length>1e-12?cross/length:0;
  }
  for(let step=0;step<freeDofs.length;step++){const ii=freeDofs[step],i=ii/2,l=lambda[i];let x=l*t[ii],y=l*t[ii+1];
   for(let k=starts[i];k<starts[i+1];k++){const j=neighbourDofs[k],c=(r[ii]+r[j])*.5,q=(r[ii+1]+r[j+1])*.5,dx=deltas[k*2],dy=deltas[k*2+1];x+=c*dx-q*dy;y+=q*dx+c*dy;}
   rhs[ii]=x;rhs[ii+1]=y;
  }
  // Symmetric Gauss-Seidel avoids dependence on arbitrary left-to-right
  // ordering while retaining a fixed, explicitly bounded operation count.
  for(let sweep=0;sweep<s.globalIterations;sweep++){
   for(let step=0;step<freeDofs.length;step++){const base=step*11,ii=solveRows[base],degree=solveRows[base+1];let x=rhs[ii],y=rhs[ii+1],k=0;
    if(degree>=4){const a=solveRows[base+3],b=solveRows[base+4],c=solveRows[base+5],d=solveRows[base+6];x+=p[a];y+=p[a+1];x+=p[b];y+=p[b+1];x+=p[c];y+=p[c+1];x+=p[d];y+=p[d+1];k=4;}
    if(degree>=8){const a=solveRows[base+7],b=solveRows[base+8],c=solveRows[base+9],d=solveRows[base+10];x+=p[a];y+=p[a+1];x+=p[b];y+=p[b+1];x+=p[c];y+=p[c+1];x+=p[d];y+=p[d+1];k=8;}
    const start=solveRows[base+2];for(;k<degree;k++){const j=neighbourDofs[start+k];x+=p[j];y+=p[j+1];}p[ii]=x/solveDivisors[step];p[ii+1]=y/solveDivisors[step];
   }
   for(let step=freeDofs.length-1;step>=0;step--){const base=step*11,ii=solveRows[base],degree=solveRows[base+1];let x=rhs[ii],y=rhs[ii+1],k=0;
    if(degree>=4){const a=solveRows[base+3],b=solveRows[base+4],c=solveRows[base+5],d=solveRows[base+6];x+=p[a];y+=p[a+1];x+=p[b];y+=p[b+1];x+=p[c];y+=p[c+1];x+=p[d];y+=p[d+1];k=4;}
    if(degree>=8){const a=solveRows[base+7],b=solveRows[base+8],c=solveRows[base+9],d=solveRows[base+10];x+=p[a];y+=p[a+1];x+=p[b];y+=p[b+1];x+=p[c];y+=p[c+1];x+=p[d];y+=p[d+1];k=8;}
    const start=solveRows[base+2];for(;k<degree;k++){const j=neighbourDofs[start+k];x+=p[j];y+=p[j+1];}p[ii]=x/solveDivisors[step];p[ii+1]=y/solveDivisors[step];
   }
  }
 }
 // Project only orientation inequalities violated by this pose. Rotating
 // rigid clusters can produce a folded target even with smooth weights; area
 // constraints prevent the remedy from concealing a mirrored piece of paint.
 // This acts on skin vertices, never the pose/bone transforms, and cannot move
 // hard contact handles. A contradictory pinned pose refuses atomically.
 rhs.set(p);let orientationPasses=0;
 for(let pass=0;pass<s.orientationIterations;pass++){
  let changed=0;for(let k=0;k<triangleDofs.length;k+=3){
   const a=triangleDofs[k],b=triangleDofs[k+1],c=triangleDofs[k+2],triangle=k/3,sign=triangleSigns[triangle],movable=triangleMovable[triangle];
   const area=(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]),constraint=area*sign-triangleFloors[triangle];
   if(constraint>=0)continue;changed++;
   const ax=p[b+1]-p[c+1],ay=p[c]-p[b],bx=p[c+1]-p[a+1],by=p[a]-p[c],cx=p[a+1]-p[b+1],cy=p[b]-p[a];
   const norm=(movable&1?ax*ax+ay*ay:0)+(movable&2?bx*bx+by*by:0)+(movable&4?cx*cx+cy*cy:0);if(norm<1e-20)continue;
   const scale=-constraint*sign/norm;if(movable&1){p[a]+=scale*ax;p[a+1]+=scale*ay;}if(movable&2){p[b]+=scale*bx;p[b+1]+=scale*by;}if(movable&4){p[c]+=scale*cx;p[c+1]+=scale*cy;}
  }
  orientationPasses=pass+1;if(!changed)break;
 }
 let flipped=0,minRatio=Infinity;for(let k=0;k<triangleDofs.length;k+=3){const a=triangleDofs[k],b=triangleDofs[k+1],c=triangleDofs[k+2],ratio=((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]))/s.areas[k/3];if(!Number.isFinite(ratio)||ratio<=0)flipped++;minRatio=Math.min(minRatio,ratio);}
 let projection=0;for(let i=0;i<n;i++)projection=Math.max(projection,(p[i*2]-rhs[i*2])**2+(p[i*2+1]-rhs[i*2+1])**2);
 s.stats.flippedTriangles=flipped;s.stats.minimumAreaRatio=minRatio;s.stats.orientationPasses=orientationPasses;s.stats.maximumProjectionPx=Math.sqrt(projection);
 let maximum=0,sum=0;for(let i=0;i<n;i++){need(Number.isFinite(p[i*2])&&Number.isFinite(p[i*2+1]),'nonfinite solution');const e=(p[i*2]-t[i*2])**2+(p[i*2+1]-t[i*2+1])**2;maximum=Math.max(maximum,e);sum+=e;}
 s.stats.maximumTargetErrorPx=Math.sqrt(maximum);s.stats.rmsTargetErrorPx=Math.sqrt(sum/n);
 need(flipped===0,'unresolved folded triangles: '+flipped);
 for(let i=0;i<n;i++){output[i*2]=pins[i]?targets[i*2]:p[i*2]/width;output[i*2+1]=pins[i]?targets[i*2+1]:p[i*2+1]/height;}
 return s.stats;
}
