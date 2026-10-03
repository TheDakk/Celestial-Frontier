/** Native rest and dense current-producer pose qualification. No saved pose
 * archive substitutes for the exact compiler/source bound to this run. */
import {Sprite,Texture,RenderTexture} from 'pixi.js';
import {turnPoseTimes} from './turn-performance.mjs';
import {measureCreatureUpdate} from './creature-update-timing.mjs';
import {createDeformationQuality,assessDeformationQuality} from '../creature-animation/deformation-quality.mjs';
import {createRenderedContactProbe,assessRenderedContacts} from './rendered-contact.mjs';
import {poseMatrices} from '../../apps/game/src/creature-rig-contact.ts';
import {createSourceJoinProbe,assessSourceJoinContinuity} from './source-join-continuity.mjs';
export async function runSkinGates({app,subjects,select,plans,motionPose,image}){
 const rows=[],artifacts={};
 for(const s of subjects){
  select(s.id);const currentPlans=plans(),w=s.record.geometry.width,h=s.record.geometry.height,cw=w*2,ch=h*2,rt=RenderTexture.create({width:cw,height:ch,resolution:1});
  const pixels=node=>{const x=node.x,y=node.y;node.position.set(x+w/2,y+h/2);try{app.renderer.render({container:node,target:rt,clear:true});return Uint8Array.from(app.renderer.extract.pixels({target:rt}).pixels);}finally{node.position.set(x,y);}};
  const save=async(name,rgba)=>{const c=new OffscreenCanvas(cw,ch);c.getContext('2d').putImageData(new ImageData(Uint8ClampedArray.from(rgba),cw,ch),0,0);const b=new Uint8Array(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());let raw='';for(let i=0;i<b.length;i+=8192)raw+=String.fromCharCode(...b.subarray(i,i+8192));artifacts[s.id+'-'+name+'.png']=btoa(raw);};
  const reference=new Sprite(Texture.from(s.paint.canvas)),expected=pixels(reference),poses={},row={id:s.id,runtime:s.row.runtime,restChangedChannels:null,poses,canvas:{width:cw,height:ch,origin:[w/2,h/2],nativeScale:1},updateP95Ms:null,dense:{hz:120,samples:0,firstFailure:null},status:'RUNNING'};
  const plantedAt=ms=>ms===null||ms>=5000||ms<=currentPlans[0].beats.commandEnd||ms>=currentPlans[0].beats.returnEnd;
  const resolve=ms=>ms===null?{}:s.turnContact.resolve(ms).pose;
  try{
   if(!s.binding.paintSkin)throw Error('Skin qualification requires paintSkin candidate');
   const atlas=await image(s.id+'.atlas.png'),quality=s.binding.paintSkin.parts.map(part=>{
    const source=s.binding.parts.find(p=>p.id===part.id),b=source.cutout,f=source.frame,rgba=new Uint8Array(b.width*b.height*4);
    for(let y=0;y<b.height;y++)rgba.set(atlas.rgba.subarray(((f.y+y)*atlas.canvas.width+f.x)*4,((f.y+y)*atlas.canvas.width+f.x+b.width)*4),y*b.width*4);
    const positions=Float64Array.from(part.vertices.flatMap(v=>v.triangle.reduce((p,k,j)=>[p[0]+s.binding.paintSkin.vertices[k].x*v.barycentric[j],p[1]+s.binding.paintSkin.vertices[k].y*v.barycentric[j]],[0,0])));
    const state=createDeformationQuality({positions,indices:part.indices,alpha:{data:rgba,width:b.width,height:b.height,originX:b.x,originY:b.y}}),mesh=s.rig.parts.find(p=>p.id===part.id).display.children[0];
    return{id:part.id,state,mesh};
   });
   const snapshot=v=>JSON.parse(JSON.stringify(v,(_k,x)=>typeof x==='number'&&!Number.isFinite(x)?String(x):x));
   const metrics=()=>quality.map(q=>({id:q.id,...snapshot(assessDeformationQuality(q.state,q.mesh.geometry.getBuffer('aPosition').data,w,h))}));
   row.deformationQuality={scope:'Conservative source-alpha metrics at named native poses; 120 Hz runtime fold admission remains independent. Metrics do not grant art acceptance.',frames:{}};
   s.rig.root.position.set(0,0);s.rig.root.scale.set(w,h);s.rig.applyPose({});const rest=pixels(s.rig.root);row.restChangedChannels=rest.reduce((n,v,i)=>n+(v!==expected[i]),0);await save('rest',rest);row.deformationQuality.frames.rest=metrics();
   if(row.restChangedChannels!==0)throw Error('REST_FAIL: changed channels '+row.restChangedChannels);
   const contactProbe=createRenderedContactProbe({record:s.record,binding:s.binding,atlas:{rgba:atlas.rgba,width:atlas.canvas.width,height:atlas.canvas.height}}),contactMeshes=new Map(contactProbe.feet.map(f=>[f.partId,quality.find(q=>q.id===f.partId).mesh]));
   row.renderedContacts={status:'RUNNING',toleranceNativePx:1,policy:'Every lowest nontransparent source texel per paw column, including fringe; no core-only subset. Each original perspective/raised-paw offset is retained. One native pixel is the maximum planted source-rest displacement, not a stage-scale allowance.',frames:{},dense:{plantedSamples:0,paws:Object.fromEntries(contactProbe.feet.map(f=>[f.joint,{partId:f.partId,contourSamples:f.samples.length,maxRestDisplacementPx:0,maxPawTransformErrorPx:0,maxBoneErrorPx:0,worstAtMs:null}]))},firstFailure:null};
   const contacts=(pose,ms,name)=>{
    const planted=plantedAt(ms),result=assessRenderedContacts(contactProbe,{positionsByPart:new Map([...contactMeshes].map(([id,mesh])=>[id,mesh.geometry.getBuffer('aPosition').data])),matrices:poseMatrices(s.record,pose),planted});
    if(name)row.renderedContacts.frames[name]={atMs:ms,...result};
    if(planted){
     if(!name)row.renderedContacts.dense.plantedSamples++;
     for(const foot of result.feet){const worst=row.renderedContacts.dense.paws[foot.joint];if(foot.maxRestDisplacementPx>worst.maxRestDisplacementPx){worst.maxRestDisplacementPx=foot.maxRestDisplacementPx;worst.worstAtMs=ms;worst.worstRest=foot.worstRest;}worst.maxPawTransformErrorPx=Math.max(worst.maxPawTransformErrorPx,foot.maxPawTransformErrorPx);worst.maxBoneErrorPx=Math.max(worst.maxBoneErrorPx,foot.boneErrorPx);}
     const failed=result.feet.find(f=>f.maxRestDisplacementPx>1);
     if(failed){row.renderedContacts.status='FAIL';row.renderedContacts.firstFailure={atMs:ms,frame:name??'dense',...failed};throw Error('Rendered planted paw drift: '+failed.joint+' at '+ms+' ms, '+failed.maxRestDisplacementPx+' native px (limit 1), bone '+failed.boneErrorPx+' px, source '+JSON.stringify(failed.worstRest?.source));}
    }
    return result;
   };
   const joinProbe=createSourceJoinProbe({record:s.record,binding:s.binding,atlas:{rgba:atlas.rgba,width:atlas.canvas.width,height:atlas.canvas.height}});
   row.sourceJoins={status:'RUNNING',epsilonNativePx:joinProbe.epsilonNativePx,policy:joinProbe.scope,excluded:joinProbe.excluded,frames:{},dense:{samples:0,maxGapPx:0,worstAtMs:null},firstFailure:null};
   const joins=(ms,name)=>{
    const result=assessSourceJoinContinuity(joinProbe,new Map(quality.map(q=>[q.id,q.mesh.geometry.getBuffer('aPosition').data])));
    if(name)row.sourceJoins.frames[name]={atMs:ms,...result};else row.sourceJoins.dense.samples++;
    if(result.maxGapPx>row.sourceJoins.dense.maxGapPx){row.sourceJoins.dense.maxGapPx=result.maxGapPx;row.sourceJoins.dense.worstAtMs=ms;}
    if(result.status!=='PASS'){row.sourceJoins.status='FAIL';row.sourceJoins.firstFailure={atMs:ms,frame:name??'dense',joins:result.joins.filter(j=>j.status!=='CONTINUOUS')};throw Error('Reopened painted attachment at '+ms+' ms: '+row.sourceJoins.firstFailure.joins.map(j=>j.name+' '+j.maxGapPx+' px').join('; '));}
   };
   contacts({},null,'rest');joins(null,'rest');
   // Retain the named full-pose images before a dense admission failure, so a
   // failing diagnostic still contains reviewable whole-creature evidence.
   for(const[name,ms]of Object.entries(turnPoseTimes(currentPlans))){const pose=resolve(ms);poses[name]={atMs:ms,pose};s.rig.applyPose(pose);row.deformationQuality.frames[name]=metrics();await save(name,pixels(s.rig.root));contacts(pose,ms,name);joins(ms,name);}
   const times=[],rigTimes=[];
   for(let i=0;i<=1200;i++){const ms=i*10000/1200;let pose;try{const timed=measureCreatureUpdate(()=>{pose=resolve(ms);const at=performance.now();s.rig.applyPose(pose);return performance.now()-at;});times.push(timed.updateMs);rigTimes.push(timed.result);contacts(pose,ms);joins(ms);row.dense.samples++;}catch(error){row.dense.firstFailure={atMs:ms,pose,reason:String(error.message??error)};throw error;}}
   s.rig.applyPose({});const final=pixels(s.rig.root);row.finalRestChangedChannels=final.reduce((n,v,i)=>n+(v!==expected[i]),0);if(row.finalRestChangedChannels)throw Error('REST_FAIL after dense motion');contacts({},null,'final-rest');joins(null,'final-rest');row.renderedContacts.status='PASS';row.sourceJoins.status='PASS';
   times.sort((a,b)=>a-b);rigTimes.sort((a,b)=>a-b);row.timingScope='producer sampling + contact solve + rig publication';row.updateP95Ms=times[Math.floor(times.length*.95)];row.rigUpdateP95Ms=rigTimes[Math.floor(rigTimes.length*.95)];row.status=row.updateP95Ms<2?'PASS':'UPDATE_BUDGET_FAIL';
  }catch(error){row.status='FAIL';row.error=String(error.stack??error);}
  finally{rows.push(row);reference.destroy({texture:true,textureSource:true});rt.destroy(true);s.rig.root.position.set(-s.record.landmarks.root[0]*s.scale,-s.record.geometry.groundLineY*s.scale);s.rig.root.scale.set(s.scale);}
  if(row.status!=='PASS')return{status:'FAIL',rows,artifacts};
 }
 return{status:'PASS',rows,artifacts,scope:'Native exact rest, source-alpha-supported rendered paw contacts, 120 Hz current Motion producer/contact/shape admission, posed images and creature update budget. Whole-motion appearance remains a visual review.'};
}
