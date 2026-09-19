/** Measure the visible skin, not merely its driving bones. Every source sample
 * is the centre of the lowest nontransparent texel in an authored paw column.
 * Its original perspective/raised-paw offset is retained; there is no shared
 * flattened ground target and no species-specific correction. */
const fail=message=>{throw Error('Rendered paw contact: '+message);};
const finitePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const transform=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
function interpolation(x,y,positions,indices){
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i]*2,b=indices[i+1]*2,c=indices[i+2]*2,ax=positions[a],ay=positions[a+1];
  const ux=positions[b]-ax,uy=positions[b+1]-ay,vx=positions[c]-ax,vy=positions[c+1]-ay,det=ux*vy-uy*vx;
  if(!Number.isFinite(det)||Math.abs(det)<1e-12)continue;
  const u=((x-ax)*vy-(y-ay)*vx)/det,v=(ux*(y-ay)-uy*(x-ax))/det,w=1-u-v;
  if(Math.min(u,v,w)>=-1e-8)return {triangle:[indices[i],indices[i+1],indices[i+2]],weights:[w,u,v]};
 }
 return null;
}
export function createRenderedContactProbe({record,binding,atlas}){
 if(!record?.recipeHash||binding?.recordRecipeHash!==record.recipeHash||!binding.paintSkin)fail('record / skin binding');
 const {width,height,groundLineY}=record.geometry??{};
 if(![width,height].every(n=>Number.isInteger(n)&&n>0)||!Number.isFinite(groundLineY))fail('source geometry');
 if(!atlas||!Number.isInteger(atlas.width)||!Number.isInteger(atlas.height)||atlas.width<=0||atlas.height<=0
  ||!(atlas.rgba instanceof Uint8Array||atlas.rgba instanceof Uint8ClampedArray)||atlas.rgba.length!==atlas.width*atlas.height*4
  ||atlas.width!==binding.atlasSize?.width||atlas.height!==binding.atlasSize?.height)fail('decoded atlas dimensions');
 const joints=Object.keys(record.landmarks).filter(j=>j.endsWith('Paw')).sort();if(!joints.length)fail('no declared paw joints');
 const skin=binding.paintSkin,feet=[];
 for(const joint of joints){
  const landmark=record.landmarks[joint];if(!finitePoint(landmark))fail('paw landmark '+joint);
  const owners=binding.parts.filter(p=>p.kind==='part'&&p.joint===joint);if(owners.length!==1)fail('one painted owner required for '+joint);
  const source=owners[0],part=skin.parts.find(p=>p.id===source.id),box=source.cutout,frame=source.frame;
  if(!part||frame.width!==box.width||frame.height!==box.height||frame.x<0||frame.y<0||frame.x+frame.width>atlas.width||frame.y+frame.height>atlas.height)fail('native painted frame '+joint);
  const rest=Float64Array.from(part.vertices.flatMap(v=>v.triangle.reduce((p,k,i)=>{
   const sourceVertex=skin.vertices[k],weight=v.barycentric[i];if(!sourceVertex||!Number.isFinite(weight))fail('source interpolation');
   return[p[0]+sourceVertex.x*weight,p[1]+sourceVertex.y*weight];
  },[0,0])));
  if(!rest.length||!rest.every(Number.isFinite))fail('source mesh positions');
  const samples=[];
  for(let x=0;x<box.width;x++)for(let y=box.height-1;y>=0;y--){
   const alpha=atlas.rgba[((frame.y+y)*atlas.width+frame.x+x)*4+3];if(alpha===0)continue;
   const sx=box.x+x+.5,sy=box.y+y+.5,fit=interpolation(sx,sy,rest,part.indices);
   if(!fit)fail('painted lower contour missing from mesh: '+joint+' at '+sx+','+sy);
   samples.push({source:[sx,sy],sourceAlpha:alpha,atlasPixel:[frame.x+x,frame.y+y],perspectiveOffsetPx:sy-groundLineY*height,...fit});break;
  }
  if(!samples.length)fail('empty painted paw '+joint);
  feet.push({joint,partId:part.id,landmark:[landmark[0],landmark[1]],vertexCount:part.vertices.length,samples});
 }
 return {schema:'cf.rendered-paw-contact/v1',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,atlasSha256:binding.atlasSha256,
  width,height,groundLineY,feet,scope:'Source-alpha-supported lower-contour skin displacement. No artistic or contact acceptance is inferred.'};
}

/** positionsByPart contains the actual published Pixi aPosition buffers, in
 * normalized cut-out space. Matrices are the corresponding normalized Paw
 * transforms. A fixed bone with drifting paint is explicitly distinguishable. */
export function assessRenderedContacts(probe,{positionsByPart,matrices,planted}){
 if(typeof planted!=='boolean')fail('explicit planted state');
 const {width,height}=probe,feet=[];
 for(const foot of probe.feet){
  const positions=positionsByPart instanceof Map?positionsByPart.get(foot.partId):positionsByPart?.[foot.partId],matrix=matrices?.[foot.joint];
  if(!positions||positions.length!==foot.vertexCount*2||!Array.from(positions).every(Number.isFinite))fail('published mesh '+foot.partId);
  if(!matrix||matrix.length!==6||!Array.from(matrix).every(Number.isFinite))fail('paw matrix '+foot.joint);
  const bone=transform(matrix,...foot.landmark),boneErrorPx=Math.hypot((bone[0]-foot.landmark[0])*width,(bone[1]-foot.landmark[1])*height);
  let maxRestDisplacementPx=0,maxPawTransformErrorPx=0,maxHorizontalDriftPx=0,maxVerticalDriftPx=0,worstRest=null,worstPaw=null;
  for(const sample of foot.samples){
   let x=0,y=0;for(let i=0;i<3;i++){x+=positions[sample.triangle[i]*2]*sample.weights[i]*width;y+=positions[sample.triangle[i]*2+1]*sample.weights[i]*height;}
   const expected=transform(matrix,sample.source[0]/width,sample.source[1]/height),dx=x-sample.source[0],dy=y-sample.source[1];
   const restError=Math.hypot(dx,dy),pawError=Math.hypot(x-expected[0]*width,y-expected[1]*height);
   if(restError>maxRestDisplacementPx){maxRestDisplacementPx=restError;worstRest={source:sample.source,actual:[x,y],perspectiveOffsetPx:sample.perspectiveOffsetPx};}
   if(pawError>maxPawTransformErrorPx){maxPawTransformErrorPx=pawError;worstPaw={source:sample.source,actual:[x,y],expected:[expected[0]*width,expected[1]*height]};}
   maxHorizontalDriftPx=Math.max(maxHorizontalDriftPx,Math.abs(dx));maxVerticalDriftPx=Math.max(maxVerticalDriftPx,Math.abs(dy));
  }
  feet.push({joint:foot.joint,partId:foot.partId,samples:foot.samples.length,boneErrorPx,maxRestDisplacementPx,maxPawTransformErrorPx,maxHorizontalDriftPx,maxVerticalDriftPx,worstRest,worstPaw});
 }
 return {schema:probe.schema,recordRecipeHash:probe.recordRecipeHash,planted,units:'native cut-out pixels',feet,
  maxBoneErrorPx:Math.max(...feet.map(f=>f.boneErrorPx)),maxRenderedRestDisplacementPx:Math.max(...feet.map(f=>f.maxRestDisplacementPx)),maxRenderedPawTransformErrorPx:Math.max(...feet.map(f=>f.maxPawTransformErrorPx)),
  scope:probe.scope};
}
