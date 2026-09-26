/** Shared deformation field for alpha-adaptive parts. No new source pixels. */
import{RecoverablePoseError}from'./pose-refusal.mjs';
export function applyPaintSkin(skin,matrices,width,height,output){
 if(output.length!==skin.vertices.length*2)throw Error('Paint skin position buffer');
 for(let i=0;i<skin.vertices.length;i++){
  const v=skin.vertices[i],x=v.x/width,y=v.y/height;let px=0,py=0;
  for(const [joint,weight]of v.weights){const m=matrices[joint];if(!m||!m.every(Number.isFinite))throw Error('Paint skin matrix');px+=(m[0]*x+m[2]*y+m[4])*weight;py+=(m[1]*x+m[3]*y+m[5])*weight;}
  output[i*2]=px;output[i*2+1]=py;
 }
 if(!output.every(Number.isFinite))throw Error('Paint skin overflow');
}
export function applyPaintPart(part,field,output){
 for(let i=0;i<part.vertices.length;i++){
  const v=part.vertices[i];let x=0,y=0;for(let k=0;k<3;k++){x+=field[v.triangle[k]*2]*v.barycentric[k];y+=field[v.triangle[k]*2+1]*v.barycentric[k];}
  output[i*2]=x;output[i*2+1]=y;
 }
}
export function validatePaintSkin(skin,parts,w,h,joints){
 const fail=why=>{throw Error('Paint skin: '+why);};
 if(skin?.schema!=='cf.paint-skin/v1'||!Array.isArray(skin.vertices)||skin.vertices.length<3||skin.vertices.length>40000||!Array.isArray(skin.parts))fail('schema/budget');
 if(skin.solver!==undefined){
  if(!Array.isArray(skin.triangles)||!skin.triangles.length||skin.triangles.length%3||skin.triangles.length>600000||skin.triangles.some(i=>!Number.isInteger(i)||i<0||i>=skin.vertices.length))fail('solver topology');
  const s=skin.solver;
  // Asset data may declare contact pins, not tune the shared projection profile.
  // Orientation defaults remain owned by createArapScratch, including when an
  // extra key would happen to repeat today's default value.
  if(!s||typeof s!=='object'||Array.isArray(s)||(Object.getPrototypeOf(s)!==Object.prototype&&Object.getPrototypeOf(s)!==null)
   ||Reflect.ownKeys(s).length!==4||Reflect.ownKeys(s).some(k=>!['iterations','globalIterations','targetWeight','pins'].includes(k)))fail('shared solver profile keys');
  if(s.iterations!==4||s.globalIterations!==4||s.targetWeight!==.35||!Array.isArray(s.pins)||new Set(s.pins).size!==s.pins.length||s.pins.some(i=>!Number.isInteger(i)||i<0||i>=skin.vertices.length))fail('shared solver profile');
 }
 const known=new Set(joints),ids=new Set();
 for(const v of skin.vertices){if(!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.x<0||v.y<0||v.x>w||v.y>h||!Array.isArray(v.weights)||!v.weights.length||v.weights.length>8)fail('vertex');
  let sum=0;const used=new Set();for(const [j,n]of v.weights){if(!known.has(j)||used.has(j)||!Number.isFinite(n)||n<=0||n>1)fail('weights');used.add(j);sum+=n;}if(Math.abs(sum-1)>1e-8)fail('weight sum');}
 let count=0;
 for(const p of skin.parts){const owner=parts.find(x=>x.id===p.id);if(!owner||owner.kind!=='part'||ids.has(p.id)||!p.vertices?.length||!p.indices?.length)fail('part');ids.add(p.id);count+=p.vertices.length;if(count>200000)fail('part vertex budget');
  for(const v of p.vertices){if(!Array.isArray(v.triangle)||v.triangle.length!==3||v.triangle.some(i=>!Number.isInteger(i)||i<0||i>=skin.vertices.length)||!Array.isArray(v.barycentric)||v.barycentric.length!==3||v.barycentric.some(n=>!Number.isFinite(n)||n< -1e-8||n>1+1e-8)||Math.abs(v.barycentric.reduce((a,b)=>a+b,0)-1)>1e-8)fail('interpolation');
   const x=v.triangle.reduce((n,k,i)=>n+skin.vertices[k].x*v.barycentric[i],0),y=v.triangle.reduce((n,k,i)=>n+skin.vertices[k].y*v.barycentric[i],0),b=owner.cutout;
   if(x<b.x-1e-6||x>b.x+b.width+1e-6||y<b.y-1e-6||y>b.y+b.height+1e-6)fail('UV outside owned frame');}
  if(p.indices.length>1000000||p.indices.length%3||p.indices.some(i=>!Number.isInteger(i)||i<0||i>=p.vertices.length))fail('indices');
  if(paintPartAreas(p,skin).some(a=>!Number.isFinite(a)||a===0))fail('degenerate source triangle');}
 if(parts.filter(p=>p.kind==='part').some(p=>!ids.has(p.id)))fail('missing painted part');
 return{vertices:skin.vertices.length,partVertices:count,parts:ids.size};
}
/** Precomputed signed source areas keep the frame check allocation-free. */
export function paintPartAreas(part,skin){
 const rest=part.vertices.map(v=>v.triangle.reduce((p,k,i)=>[p[0]+skin.vertices[k].x*v.barycentric[i],p[1]+skin.vertices[k].y*v.barycentric[i]],[0,0])),areas=new Float64Array(part.indices.length/3);
 for(let i=0;i<part.indices.length;i+=3){const a=rest[part.indices[i]],b=rest[part.indices[i+1]],c=rest[part.indices[i+2]];areas[i/3]=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}return areas;
}
/** Reject actual foldovers before publication. Texture continuity alone is insufficient. */
export function assertPaintPartShape(part,skin,p,width,height,areas=paintPartAreas(part,skin)){
 for(let i=0;i<part.indices.length;i+=3){const area=areas[i/3];if(!Number.isFinite(area)||area===0)throw Error('Paint skin degenerate source triangle: '+part.id+' '+i/3);
  const a=part.indices[i]*2,b=part.indices[i+1]*2,c=part.indices[i+2]*2,posed=((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]))*width*height;
  if(!Number.isFinite(posed)||posed/area<=0)throw new RecoverablePoseError('PAINT_FOLD','Paint skin folded triangle: '+part.id+' '+i/3);}
}
