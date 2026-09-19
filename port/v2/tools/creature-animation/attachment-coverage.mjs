/** Pixel coverage across declared anatomical sockets. Does not infer anatomy
 * from proximity, fill silhouettes, or treat intentional openings as tears.
 * Endpoints follow the actual published triangles, not joint centres. */
const need=(value,message)=>{if(!value)throw Error('Attachment coverage: '+message);};
export function bindSurfacePoint(surface,point){
 need(surface?.rest?.length%2===0&&surface.indices?.length%3===0&&point?.length===2&&point.every(Number.isFinite),'surface/point');
 const p=surface.rest;for(let k=0;k<surface.indices.length;k+=3){const ids=Array.from(surface.indices.slice(k,k+3)),[a,b,c]=ids.map(i=>i*2),ux=p[b]-p[a],uy=p[b+1]-p[a+1],vx=p[c]-p[a],vy=p[c+1]-p[a+1],det=ux*vy-uy*vx;if(Math.abs(det)<1e-14)continue;
  const x=point[0]-p[a],y=point[1]-p[a+1],u=(x*vy-y*vx)/det,v=(ux*y-uy*x)/det,w=1-u-v;if(Math.min(w,u,v)>=-1e-7)return{indices:ids,weights:[w,u,v],vertexCount:p.length/2};}
 throw Error('Attachment coverage: point outside source surface');
}
export function compileAttachmentCoverage(declarations,surfaces){
 need(Array.isArray(declarations)&&declarations.length>0,'empty inventory');const names=new Set();
 return declarations.map(d=>{need(typeof d.id==='string'&&!names.has(d.id),'duplicate/missing id');names.add(d.id);need(Number.isFinite(d.radiusPx)&&d.radiusPx>=1&&d.radiusPx<=8,'native ribbon radius');
  const endpoint=e=>{need(e&&typeof e.surface==='string'&&surfaces[e.surface],'unknown surface');return{surface:e.surface,...bindSurfacePoint(surfaces[e.surface],e.point)};};
  return{id:d.id,radiusPx:d.radiusPx,from:endpoint(d.from),to:endpoint(d.to)};});
}
export function resolveAttachmentCoverage(compiled,positions,width,height){
 const endpoint=e=>{const p=positions[e.surface];need(p?.length===e.vertexCount*2,'published surface shape');let x=0,y=0;for(let k=0;k<3;k++){x+=p[e.indices[k]*2]*e.weights[k];y+=p[e.indices[k]*2+1]*e.weights[k];}need(Number.isFinite(x)&&Number.isFinite(y),'nonfinite publication');return[x*width,y*height];};
 return compiled.map(d=>({id:d.id,radiusPx:d.radiusPx,from:endpoint(d.from),to:endpoint(d.to)}));
}
export function measureAttachmentCoverage(rgba,width,height,ribbons){
 need(Number.isInteger(width)&&width>0&&Number.isInteger(height)&&height>0&&rgba.length===width*height*4,'render dimensions');need(ribbons.length>0,'empty ribbons');
 const rows=ribbons.map(r=>{const[a,b]=[r.from,r.to];need([...a,...b,r.radiusPx].every(Number.isFinite),'nonfinite ribbon');const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);need(length>=1&&length<=Math.hypot(width,height),'degenerate/outside ribbon');const nx=-dy/length,ny=dx/length,steps=Math.ceil(length*2),across=Math.ceil(r.radiusPx*2),seen=new Set();let missingPixels=0,minAlpha=255,worst=null;
  for(let i=0;i<=steps;i++)for(let j=-across;j<=across;j++){const x=Math.floor(a[0]+dx*i/steps+nx*j/2),y=Math.floor(a[1]+dy*i/steps+ny*j/2);need(x>=0&&y>=0&&x<width&&y<height,'off-canvas attachment');const key=y*width+x;if(seen.has(key))continue;seen.add(key);const alpha=rgba[key*4+3];minAlpha=Math.min(minAlpha,alpha);if(alpha<230){missingPixels++;if(!worst)worst={x,y,alpha};}}
  return{id:r.id,samples:seen.size,missingPixels,minAlpha,worst,status:missingPixels?'GAP':'COVERED',from:a,to:b};});
 return{status:rows.every(r=>r.status==='COVERED')?'PASS':'FAIL',scope:'Opaque native-pixel ribbons between declared interior surface attachments; intentional exterior and mouth openings excluded by anatomy declaration.',rows};
}
