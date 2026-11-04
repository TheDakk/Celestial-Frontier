/** Explicit single-surface proof for the observed calcified test template.
 * A zero-join body still needs measured geometry; it is never an empty PASS.
 * Uses the caller's unchanged Float32 publication epsilon, in native pixels. */
const need=(ok,message)=>{if(!ok)throw Error('Rigid source surface: '+message);};
export function createSingleRigidSourceSurface({family,record,binding,parts,remainder,meshes}){
 need(family.id==='echinoderm-test'&&record.materials?.surface==='plated','explicit plated test template');
 need(JSON.stringify(family.graph)===JSON.stringify([['centre','root'],['rim','centre']])&&family.anchored===true,'exact test graph');
 need(family.rigid.length===2&&['centre','rim'].every(j=>family.rigid.includes(j)&&family.limitsDeg[j].min===0&&family.limitsDeg[j].max===0),'fixed test controls');
 need(parts.length===1&&parts[0].id===remainder&&parts[0].joint==='centre','one observed centre-owned surface');
 need(binding.paintSkin.vertices.length>=3&&binding.paintSkin.vertices.every(v=>v.weights.length===1&&v.weights[0][0]==='centre'&&v.weights[0][1]===1),'one rigid source field');
 const mesh=meshes.get(parts[0].id),source=Array.from(mesh.positions),n=source.length/2;
 need(Number.isInteger(n)&&n>=3&&source.every(Number.isFinite),'complete nonempty source mesh');
 let axis=1,dist=0;
 for(let i=1;i<n;i++){const d=(source[i*2]-source[0])**2+(source[i*2+1]-source[1])**2;if(d>dist){dist=d;axis=i;}}
 need(dist>1e-8,'nondegenerate rigid axis');
 const dx=source[axis*2]-source[0],dy=source[axis*2+1]-source[1];let area=0;
 for(let i=1;i<n;i++)area=Math.max(area,Math.abs(dx*(source[i*2+1]-source[1])-dy*(source[i*2]-source[0])));
 need(area>1e-8,'two-dimensional rigid surface');
 return{schema:'cf.single-rigid-source-surface/v1',partId:parts[0].id,vertexCount:n,source,anchor:0,axis,policy:'A single source-painted calcified test and its attached spines; all vertices share one rigid transform. Root rotation/translation may move the whole organism; scale, shear, reflection and local deformation fail.'};
}
export function assessSingleRigidSourceSurface(proof,positions,epsilonNativePx,width,height){
 need(proof?.schema==='cf.single-rigid-source-surface/v1'&&Number.isInteger(proof.vertexCount)&&proof.vertexCount>=3&&Array.isArray(proof.source)&&proof.source.length===proof.vertexCount*2&&proof.source.every(Number.isFinite)&&proof.anchor===0&&Number.isInteger(proof.axis)&&proof.axis>0&&proof.axis<proof.vertexCount,'complete authored rigid reference');
 need(Number.isFinite(width)&&width>0&&Number.isFinite(height)&&height>0&&positions?.length===proof.vertexCount*2,'complete published surface');
 need(Number.isFinite(epsilonNativePx)&&epsilonNativePx>0&&Array.from(positions).every(Number.isFinite),'finite native publication');
 const s=proof.source,k=proof.axis*2,ax=positions[0]*width,ay=positions[1]*height;
 const sx=s[k]-s[0],sy=s[k+1]-s[1],px=positions[k]*width-ax,py=positions[k+1]*height-ay;
 const sl=Math.hypot(sx,sy),pl=Math.hypot(px,py);
 need(sl>0&&pl>0,'nondegenerate published axis');
 const cos=(sx*px+sy*py)/(sl*pl),sin=(sx*py-sy*px)/(sl*pl);
 let maxDeviationPx=0,violations=0,worst=null;
 for(let i=0;i<proof.vertexCount;i++){
  const dx=s[i*2]-s[0],dy=s[i*2+1]-s[1],expected=[ax+cos*dx-sin*dy,ay+sin*dx+cos*dy],actual=[positions[i*2]*width,positions[i*2+1]*height],deviation=Math.hypot(actual[0]-expected[0],actual[1]-expected[1]);
  if(deviation>epsilonNativePx)violations++;
  if(deviation>maxDeviationPx){maxDeviationPx=deviation;worst={vertex:i,source:[s[i*2],s[i*2+1]],expected,actual};}
 }
 return{schema:proof.schema,partId:proof.partId,samples:proof.vertexCount,maxDeviationPx,violations,worst,status:violations?'FAIL':'PASS',policy:proof.policy};
}
