import{Mesh,MeshGeometry,Texture}from'pixi.js';
import{deformHeadSurface,requireHeadSurfaceOrientation,requireHeadReplacementCoverage}from'./head-surface.mjs';
import{IDENTITY_AFFINE}from'../creature-animation/kinematics.ts';
import{compileHeadDetails,applyHeadDetails}from'./head-details.mjs';
import{hashJSON,hashBytes,GRAPH,triangulateAlpha}from'../creature-animation/quadruped-template.mjs';
import{poseMatrices}from'../../apps/game/src/creature-rig-contact.ts';
import{createCreatureRigAim}from'../../apps/game/src/creature-rig-aim.ts';
/** A source-backed view is a separate presentation layer; the accepted rest master remains intact. */
export async function createAuthoredHeadView({record,rig,partsBinding,binding,sourceBytes,viewBytes}){
 const need=(v,s)=>{if(!v)throw Error('Head view: '+s);};
 const {bindingHash,...body}=binding;need(await hashJSON(body)===bindingHash,'corrupted binding');need(record.recipeHash===binding.recordRecipeHash,'wrong record');need(await hashBytes(sourceBytes)===binding.sourceSha256,'wrong turnaround');
 need(binding.joint==='head'&&binding.views.length>0&&binding.views.length<=8,'view inventory');
 requireHeadReplacementCoverage(binding.replaces,partsBinding.parts,GRAPH,binding.joint);
 const replaced=binding.replaces.map(id=>{const p=rig.parts.find(p=>p.id===id);need(p,'missing source part '+id);return p.display;});
 const views=[];for(const v of binding.views){const bytes=viewBytes[v.id];need(bytes&&await hashBytes(bytes)===v.sha256,'wrong view bytes '+v.id);
  need([v.scale,...v.sourcePivot,...v.targetPivot,v.width,v.height].every(Number.isFinite)&&v.scale>0,'alignment');
  const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes).buffer]));need(bitmap.width===v.width&&bitmap.height===v.height,'dimensions');const canvas=new OffscreenCanvas(v.width,v.height),context=canvas.getContext('2d');context.drawImage(bitmap,0,0);const rgba=context.getImageData(0,0,v.width,v.height).data,mesh=triangulateAlpha(Uint8Array.from({length:v.width*v.height},(_,i)=>rgba[i*4+3]),v.width,v.height),positions=mesh.vertices,geometry=new MeshGeometry({positions,uvs:mesh.uvs,indices:mesh.indices}),sprite=new Mesh({geometry,texture:Texture.from(bitmap)});sprite.visible=false;rig.root.addChild(sprite);
  const sx=(v.reflectX?-1:1)*v.scale/record.geometry.width,sy=v.scale/record.geometry.height;
  const mapping=[sx,0,0,sy,v.targetPivot[0]-v.sourcePivot[0]*sx,v.targetPivot[1]-v.sourcePivot[1]*sy];
  // The profile supplies a genuine planar gaze axis. A frontal view has no planar yaw axis.
  const aim=v.id==='profile'?createCreatureRigAim(record,{recordRecipeHash:record.recipeHash,graph:GRAPH,chain:['neck','head'],origin:v.gaze.origin,forward:v.gaze.forward,bodyLength:Math.hypot(record.landmarks.chest[0]-record.landmarks.pelvis[0],record.landmarks.chest[1]-record.landmarks.pelvis[1]),limits:{neck:{min:-.4,max:.4},head:{min:-.5,max:.5}},yaw:{centre:0,halfRange:0}}):null;
  deformHeadSurface(mesh.rest,mapping,v.neckBlend,IDENTITY_AFFINE,IDENTITY_AFFINE,positions);const restAreas=[];for(let k=0;k<mesh.indices.length;k+=3){const a=mesh.indices[k]*2,b=mesh.indices[k+1]*2,c=mesh.indices[k+2]*2;restAreas.push((positions[b]-positions[a])*(positions[c+1]-positions[a+1])-(positions[b+1]-positions[a+1])*(positions[c]-positions[a]));}views.push({spec:v,sprite,mapping,aim,rest:mesh.rest,positions,geometry,indices:mesh.indices,restAreas,detailProgram:compileHeadDetails(mesh.rest,v.details??[],Object.keys(record.landmarks)),detailRest:mesh.rest.slice()});
 }
 let active=false;
 return{attachmentSurfaces(){return Object.fromEntries(views.map(v=>[v.spec.id,{rest:Float32Array.from(v.rest,(n,i)=>n/(i%2?v.spec.height:v.spec.width)),indices:v.indices,positions:v.positions}]));},setVisible(visible){for(const v of views)v.sprite.visible=visible&&v.spec.id==='profile';},aim(pose,target){const v=views.find(v=>v.spec.id==='profile');need(v?.aim,'missing profile');return v.aim.resolve(pose,{...target,yawRadians:0});},
  apply(pose,id='profile'){const selected=views.find(v=>v.spec.id===id);need(selected,'unknown view');const matrices=poseMatrices(record,pose);for(const v of views){v.sprite.visible=v===selected;if(v===selected){applyHeadDetails(v.detailProgram,pose,v.spec.reflectX,v.detailRest);deformHeadSurface(v.detailRest,v.mapping,v.spec.neckBlend,matrices[binding.joint],matrices.chest,v.positions);requireHeadSurfaceOrientation(v.positions,v.indices,v.restAreas);v.geometry.getBuffer('aPosition').update();}}for(const p of replaced)p.visible=false;active=true;},
  restore(){for(const v of views)v.sprite.visible=false;if(active)for(const p of replaced)p.visible=true;active=false;},
  dispose(){for(const v of views){v.sprite.destroy({texture:true,textureSource:true});}for(const p of replaced)p.visible=true;},
 };
}
