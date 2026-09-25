import type {CreaturePoseV1,CreaturePaintContact,CreatureRigRecordV1,CreaturePartsBindingV1,Box} from './creature-rig-types.js';
export type {CreaturePoseV1,CreaturePaintContact,CreatureRigRecordV1,CreaturePartsBindingV1,CreatureSeamGroupV1} from './creature-rig-types.js';
import {requireVisiblePaintOwner} from '../../../tools/creature-animation/hidden-anatomy.mjs';
import {observedContactSupports} from './creature-rig-contact.js';
import{createCreatureRigFrameTarget}from'./creature-rig-frame.js';
import {compileRigidParentFrames,applyRigidParentFrames} from '../../../tools/creature-animation/rigid-parent-frame.mjs';
import {BufferImageSource,Container, Matrix, Rectangle, Sprite, Texture, Mesh, MeshGeometry} from 'pixi.js';
import {applyPaintPart,paintPartAreas,assertPaintPartShape,validatePaintSkin} from '../../../tools/creature-animation/paint-skin.mjs';
import {validateSeamBridges,createSeamGeometry,writeSeamPose} from '../../../tools/creature-animation/seam-bridge.mjs';
import {createArapScratch,solveArapSkin} from '../../../tools/creature-animation/arap-skin.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../../tools/creature-animation/compiled-skin-field.mjs';
import {createOpaqueSeamSamplingGuard} from '../../../tools/creature-animation/seam-sampling-guard.mjs';
import {hashBytes, hashJSON} from '../../../tools/creature-animation/quadruped-template.mjs';
import {admitFamilyRecord,admitFamilyRecordContent} from '../../../tools/creature-animation/family-record.mjs';
import {isBattle2MasterPin} from './battle2-master-pins.generated.js';
import {preflightBattle2PinnedBytesV1,Battle2PinRefusal,type Battle2PinnedBytesV1} from './battle2-master-pin-admission.js';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {decodePng} from './morph/png-decode.js';

export interface CreatureRigV1 {
  readonly recipeHash:string;
  readonly templateId:string;
  readonly parts:ReadonlyArray<{id:string;display:Container;pivot:{x:number;y:number};layer:'far'|'near'}>;
  readonly root:Container;
  applyPose(pose:CreaturePoseV1):void;
  /** Opt-in pad records admit their matching painted targets before publication. */
  applyContactPose?(pose:CreaturePoseV1,contacts:readonly CreaturePaintContact[]):void;
  readonly bounds:{width:number;height:number;groundLineY:number};
  dispose():void;
}
const rigContactEvidence=new WeakMap<CreatureRigV1,{samples:number;maxPaintDriftPx:number}>();
export function readCreatureRigContactEvidence(rig:CreatureRigV1){const e=rigContactEvidence.get(rig);return e?Object.freeze({...e,scope:'Actual pending Float32 rendered pad interpolation, admitted before publication; adhesive point anchors, no terrain-clearance claim'}):null;}
interface CreatureRigRuntimeDiagnostics {readonly schema:'cf.creature-rig-runtime/v1';readonly sweepBackend:'wasm'|'js'|'none';readonly fieldVertices:number;readonly normalPasses:number;readonly robustFallbacks:number;}
const rigRuntimeDiagnostics=new WeakMap<CreatureRigV1,Readonly<CreatureRigRuntimeDiagnostics>>();
const rigSupportReaders=new WeakMap<CreatureRigV1,(joint:string)=>Readonly<{x:number;y:number}>|null>();
/** Last successfully published ARAP/Float32 part vertex, in normalized source
 * coordinates. Null before publication, after disposal, or for a non-support.
 * This is the painted surface; neither a joint position nor an LBS prediction. */
export function readCreatureRigContactSupport(rig:CreatureRigV1,joint:string){return rigSupportReaders.get(rig)?.(joint)??null;}
/** Read the admitted backend and live pass counters for this actual loaded rig. */
export function readCreatureRigRuntimeDiagnostics(rig:CreatureRigV1){return rigRuntimeDiagnostics.get(rig)??null;}
const requireValue=(ok:unknown,reason:string):void=>{if(!ok)throw Error('Creature rig: '+reason);};

const validBox=(box:Box,w:number,h:number)=>box&&[box.x,box.y,box.width,box.height].every(Number.isInteger)
  &&box.x>=0&&box.y>=0&&box.width>0&&box.height>0&&box.x+box.width<=w&&box.y+box.height<=h;
const shaPattern=/^[a-f0-9]{64}$/;
async function decodeAtlasPng(bytes:Uint8Array):Promise<Texture>{
  const copy=new Uint8Array(bytes.length);copy.set(bytes);
  const bitmap=await createImageBitmap(new Blob([copy.buffer],{type:'image/png'}));
  return Texture.from(bitmap);
}
/** Preserve the original decode and write only opaque internal guard texels.
 * In particular, never get/put the whole translucent atlas through ImageData. */
async function decodeGuardedAtlasPng(bytes:Uint8Array,record:CreatureRigRecordV1,binding:CreaturePartsBindingV1){
  const copy=new Uint8Array(bytes.length);copy.set(bytes);
  const bitmap=await createImageBitmap(new Blob([copy.buffer],{type:'image/png'}));
  try{
    requireValue(bitmap.width===binding.atlasSize.width&&bitmap.height===binding.atlasSize.height,'decoded atlas dimensions');
    const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),context=canvas.getContext('2d');
    requireValue(context,'atlas sampling guard context');context!.drawImage(bitmap,0,0);
    const original=context!.getImageData(0,0,bitmap.width,bitmap.height).data;
    const plan=createOpaqueSeamSamplingGuard({record,binding,atlas:{rgba:original,width:bitmap.width,height:bitmap.height}});
    for(let first=0;first<plan.pixels.length;){let end=first+1;const start=plan.pixels[first]!;
      while(end<plan.pixels.length&&plan.pixels[end]!.y===start.y&&plan.pixels[end]!.x===plan.pixels[end-1]!.x+1)end++;
      const data=new Uint8ClampedArray((end-first)*4);
      for(let i=first;i<end;i++)data.set(plan.pixels[i]!.rgba,(i-first)*4);
      context!.putImageData(new ImageData(data,end-first,1),start.x,start.y);first=end;
    }
    const derived=await createImageBitmap(canvas);
    return {texture:Texture.from(derived),samplingGuard:plan.receipt};
  }finally{bitmap.close();}
}

/** Morph M2 (additive): decode the atlas EXACTLY in JS (straight alpha — never a canvas round trip), let the
 * individual's remap rewrite hue/chroma, write the opaque seam-guard texels into the same buffer, upload as a buffer
 * texture. Record, binding and atlas bytes stay the accepted archetype's; only this individual's texture differs. */
export async function decodeMorphedAtlas(bytes:Uint8Array,record:CreatureRigRecordV1,binding:CreaturePartsBindingV1,atlasPixels:(rgba:Uint8Array,width:number,height:number)=>Uint8Array){
  const decoded=await decodePng(bytes);
  requireValue(decoded.width===binding.atlasSize.width&&decoded.height===binding.atlasSize.height,'decoded atlas dimensions');
  const rgba=atlasPixels(decoded.rgba,decoded.width,decoded.height);
  requireValue(rgba instanceof Uint8Array&&rgba.length===decoded.rgba.length,'morph atlas pixels size');
  for(let i=3;i<rgba.length;i+=4)requireValue(rgba[i]===decoded.rgba[i],'morph atlas pixels must keep alpha');
  const plan=createOpaqueSeamSamplingGuard({record,binding,atlas:{rgba,width:decoded.width,height:decoded.height}});
  for(const px of plan.pixels){const j=(px.y*decoded.width+px.x)*4;rgba[j]=px.rgba[0]!;rgba[j+1]=px.rgba[1]!;rgba[j+2]=px.rgba[2]!;rgba[j+3]=px.rgba[3]!;}
  const source=new BufferImageSource({resource:rgba,width:decoded.width,height:decoded.height,alphaMode:'premultiply-alpha-on-upload'});
  return {texture:new Texture({source}),samplingGuard:plan.receipt};
}

export interface CreatureRigLoadOptions {
  /** The custom decoder returns a caller-owned cache texture. The caller releases
   * that texture/source only after every borrowing rig has been disposed. */
  readonly borrowedAtlas?:boolean;
  /** Morph M1 (additive): uniform sub-tree scales composed into the skeleton; record/binding bytes unchanged. */
  readonly jointScale?:Readonly<Record<string,number>>;
  /** Morph M2/M3 (additive): the individual's remap over the exactly decoded atlas pixels (alpha must be kept). */
  readonly atlasPixels?:(rgba:Uint8Array,width:number,height:number)=>Uint8Array;
}
/** Hash admission precedes image decode and Pixi allocation. By default the rig
 * owns the decoded atlas. Pass a custom decoder and {borrowedAtlas:true} to retain
 * a caller-owned texture/source on disposal or decoded-dimension refusal. */
export async function loadCreatureRigV1(recordInput:CreatureRigRecordV1,bindingInput:CreaturePartsBindingV1,
  cutoutBytes:Uint8Array,cutoutAlpha:Uint8Array,atlasBytes:Uint8Array,
  decodeAtlas:(bytes:Uint8Array)=>Promise<Texture>=decodeAtlasPng,
  options:CreatureRigLoadOptions={}):Promise<CreatureRigV1>{
  const record=structuredClone(recordInput),binding=structuredClone(bindingInput);
  const template=await admitFamilyRecord(record,cutoutBytes,cutoutAlpha);
  return createAdmittedCreatureRig(record,binding,template,atlasBytes,decodeAtlas,options);
}
/** The only master-free loader: a genuine bundled pin plus its exact bytes.
 * Snapshot caller-owned inputs before awaiting; no receipt-shaped object or
 * caller hash can bypass the preflight, and no alpha array can replace decode. */
export async function loadPinnedCreatureRigV1(input:Battle2PinnedBytesV1,
  decodeAtlas:(bytes:Uint8Array)=>Promise<Texture>=decodeAtlasPng,
  options:CreatureRigLoadOptions={}):Promise<CreatureRigV1>{
  if(!isBattle2MasterPin(input.pin))throw new Battle2PinRefusal('untrusted-pin-authority','not a bundled build pin');
  const snapshot={pin:input.pin,creatureId:input.creatureId,record:structuredClone(input.record),
    alphaPath:input.alphaPath,alpha:input.alpha.slice(),bindingBytes:input.bindingBytes.slice(),
    atlasPath:input.atlasPath,atlas:input.atlas.slice()};
  const admitted=await preflightBattle2PinnedBytesV1(snapshot);
  const decoded=await decodePng(snapshot.alpha);
  const alpha=new Uint8Array(decoded.width*decoded.height);
  for(let i=0;i<alpha.length;i++)alpha[i]=decoded.rgba[i*4+3]!;
  const record=snapshot.record as CreatureRigRecordV1,binding=admitted.binding as CreaturePartsBindingV1;
  const template=await admitFamilyRecordContent(record,alpha);
  return createAdmittedCreatureRig(record,binding,template,snapshot.atlas,decodeAtlas,options);
}
/** One private allocation/admission tail for both byte and build-pin authority. */
async function createAdmittedCreatureRig(record:CreatureRigRecordV1,binding:CreaturePartsBindingV1,
  template:Awaited<ReturnType<typeof admitFamilyRecord>>,atlasBytes:Uint8Array,
  decodeAtlas:(bytes:Uint8Array)=>Promise<Texture>,options:CreatureRigLoadOptions):Promise<CreatureRigV1>{
  const ownsAtlas=options.borrowedAtlas!==true;
  const joints=[...template.joints];
  requireValue(binding?.schema==='cf.creature-parts/v1','unsupported parts schema');
  const {bindingHash,...body}=binding;
  requireValue(shaPattern.test(bindingHash)&&await hashJSON(body)===bindingHash,'corrupted part binding');
  requireValue(binding.recordRecipeHash===record.recipeHash,'parts belong to another record');
  requireValue(shaPattern.test(binding.atlasSha256)&&await hashBytes(atlasBytes)===binding.atlasSha256,'mismatched atlas hash');
  // morph M1 (additive, default none): uniform sub-tree scales composed into the skeleton; record/binding bytes unchanged
  const skeleton=createSkeletonPoseProgram(template,record.landmarks,options.jointScale?{jointScale:options.jointScale}:{});
  const {width:w,height:h}=record.geometry,{width:aw,height:ah}=binding.atlasSize;
  requireValue([aw,ah].every(n=>Number.isInteger(n)&&n>0&&n<=2048),'atlas budget');
  requireValue(binding.parts.length>0&&binding.parts.length<=40,'part budget');
  const ids=new Set<string>();
  for(const part of binding.parts){
    requireValue(typeof part.id==='string'&&part.id.length>0&&!ids.has(part.id),'duplicate or empty part id');ids.add(part.id);
    requireValue(joints.includes(part.joint),'unknown part joint: '+part.joint);
    requireVisiblePaintOwner(template,part.joint);
    requireValue(part.layer==='far'||part.layer==='near','unknown depth layer');
    requireValue(part.kind==='part'||part.kind==='joint-patch','unknown part kind');
    requireValue(validBox(part.frame,aw,ah)&&validBox(part.cutout,w,h),'part rectangle outside image');
  }
  requireValue(!(binding.paintSkin&&binding.seamBridges),'one deformation owner');
  if(binding.paintSkin){requireValue(binding.parts.every(p=>p.frame.width===p.cutout.width&&p.frame.height===p.cutout.height),'paint skin requires native source frames');validatePaintSkin(binding.paintSkin,binding.parts,w,h,joints);for(const v of binding.paintSkin.vertices)for(const [joint,weight] of v.weights)if(weight>0)requireVisiblePaintOwner(template,joint);}
  if(binding.seamBridges!==undefined){
    requireValue(template.id==='quadruped','legacy seam bridge ownership is quadruped-only; use family paint skin');
    requireValue(binding.seamBridges?.schema==='cf.seam-bridges/v1','seam bridge schema');
    validateSeamBridges(binding.seamBridges.groups,binding.parts,w,h,binding.atlasSize,joints);
  }
  const skin=binding.paintSkin,field=skin?new Float32Array(skin.vertices.length*2):null;
  const shape=skin?.solver?createArapScratch(skin.vertices,skin.triangles!,w,h,skin.solver):null;
  const target=shape&&field?field.slice():null;
  const compiledField=skin?createCompiledSkinField(skin,w,h):null;
  const rigidParents=skin?compileRigidParentFrames(skin,binding.parts,template,w,h):[];
  const decoded=options.atlasPixels&&skin?await decodeMorphedAtlas(atlasBytes.slice(),record,binding,options.atlasPixels):decodeAtlas===decodeAtlasPng&&skin?await decodeGuardedAtlasPng(atlasBytes.slice(),record,binding):{texture:await decodeAtlas(atlasBytes.slice()),samplingGuard:undefined};
  const atlas=decoded.texture;
  if(atlas.width!==aw||atlas.height!==ah){if(ownsAtlas)atlas.destroy(true);throw Error('Creature rig: decoded atlas dimensions');}
  const root=new Container(),far=new Container(),near=new Container();root.addChild(far,near);
  const textures:Texture[]=[];
  const bridgeGroups=new Map((binding.seamBridges?.groups??[]).map(group=>[group.id,group]));
  const bridges=(binding.seamBridges?.groups??[]).map(group=>{
    const part=binding.parts.find(p=>p.id===group.id)!;
    const buffers=createSeamGeometry(group,binding.parts,w,h,binding.atlasSize);
    const geometry=new MeshGeometry({positions:buffers.positions,uvs:buffers.uvs,indices:buffers.indices});
    const mesh=new Mesh({geometry,texture:atlas}),display=new Container();display.addChild(mesh);
    (group.layer==='far'?far:near).addChild(display);
    return {group,part,buffers,geometry,display};
  });
  const skins=(skin?.parts??[]).map(part=>{
    const source=binding.parts.find(p=>p.id===part.id)!,uvs=new Float32Array(part.vertices.length*2),positions=uvs.slice(),pending=uvs.slice();
    part.vertices.forEach((v,i)=>{const x=v.triangle.reduce((n,k,j)=>n+skin!.vertices[k]!.x*v.barycentric[j]!,0),y=v.triangle.reduce((n,k,j)=>n+skin!.vertices[k]!.y*v.barycentric[j]!,0);
      uvs[i*2]=(source.frame.x+x-source.cutout.x)/aw;uvs[i*2+1]=(source.frame.y+y-source.cutout.y)/ah;});
    const geometry=new MeshGeometry({positions,uvs,indices:new Uint32Array(part.indices)}),mesh=new Mesh({geometry,texture:atlas}),display=new Container();display.addChild(mesh);
    (source.layer==='far'?far:near).addChild(display);return {part,source,geometry,positions,pending,display,areas:paintPartAreas(part,skin!)};
  });
  const entries=binding.parts.filter(part=>!bridgeGroups.has(part.id)&&!skin).map(part=>{
    const frame=part.frame,box=part.cutout,texture=new Texture({source:atlas.source,frame:new Rectangle(frame.x,frame.y,frame.width,frame.height)});
    textures.push(texture);const sprite=new Sprite(texture),display=new Container();
    sprite.position.set(box.x/w,box.y/h);sprite.scale.set(box.width/w/frame.width,box.height/h/frame.height);
    display.addChild(sprite);(part.layer==='far'?far:near).addChild(display);
    return {part,display,pivot:skeleton.pivot(part.joint)};
  });
  let disposed=false,published=false;
  let supports:ReturnType<typeof observedContactSupports>|undefined;
  const contactEvidence={samples:0,maxPaintDriftPx:0};
  const parts=Object.freeze([...skins.map(({source,display})=>Object.freeze({id:source.id,display,pivot:skeleton.pivot(source.joint),layer:source.layer})),...entries.map(({part,display,pivot})=>Object.freeze({id:part.id,display,pivot,layer:part.layer})),
    ...bridges.map(({group,display})=>Object.freeze({id:group.id,display,pivot:skeleton.pivot(group.ancestorJoint),layer:group.layer}))]);
  const publishPose=(pose:CreaturePoseV1,contacts?:readonly CreaturePaintContact[])=>{
      requireValue(!disposed,'disposed');
      const matrices=skeleton.evaluate(pose);
      if(skin&&field&&compiledField){applyCompiledSkinField(compiledField,matrices,target??field);if(shape&&target)solveArapSkin(shape,target,field);for(const entry of skins)applyPaintPart(entry.part,field,entry.pending);if(rigidParents.length)applyRigidParentFrames(rigidParents,matrices,Object.fromEntries(skins.map(e=>[e.part.id,e.pending])));for(const entry of skins)assertPaintPartShape(entry.part,skin,entry.pending,w,h,entry.areas);}
      let contactMax=0;
      if(contacts){
        requireValue(record.geometry.contactPads,'undeclared terminal pad guard');supports??=observedContactSupports(record,binding);
        requireValue(new Set(contacts.map(c=>c.joint)).size===contacts.length,'duplicate painted contact');
        for(const contact of contacts){
          const surface=supports[contact.joint]?.surface;
          requireValue(surface&&'triangle' in surface,'missing interpolated painted pad');
          requireValue(Number.isFinite(contact.paintedTarget.x)&&Number.isFinite(contact.paintedTarget.y)&&typeof contact.stance==='boolean','invalid painted pad target');
          if(!surface||!('triangle' in surface))throw Error('Creature rig: terminal pad surface required');
          const entry=skins.find(e=>e.part.id===surface.partId);requireValue(entry,'missing pad part');
          let x=0,y=0;for(let k=0;k<3;k++){const index=surface.triangle[k]!;x+=entry!.pending[index*2]!*surface.barycentric[k]!;y+=entry!.pending[index*2+1]!*surface.barycentric[k]!;}
          const drift=Math.hypot((x-contact.paintedTarget.x)*w,(y-contact.paintedTarget.y)*h);
          requireValue(Number.isFinite(drift)&&drift<=.25,'published painted pad drift '+contact.joint+': '+drift);contactMax=Math.max(contactMax,drift);
        }
      }
      // All spans are admitted into private scratch before any visible state changes.
      for(const bridge of bridges)writeSeamPose(bridge.group,matrices,w,h,bridge.buffers.pending,bridge.part.cutout);
      for(const entry of skins){entry.positions.set(entry.pending);entry.geometry.getBuffer('aPosition').update();}
      for(const entry of entries)entry.display.setFromMatrix(new Matrix(...matrices[entry.part.joint]!));
      for(const bridge of bridges){bridge.buffers.positions.set(bridge.buffers.pending);bridge.geometry.getBuffer('aPosition').update();}
      published=true;
      if(contacts){contactEvidence.samples+=contacts.length;contactEvidence.maxPaintDriftPx=Math.max(contactEvidence.maxPaintDriftPx,contactMax);}

  };
  const rig=Object.freeze({recipeHash:record.recipeHash,templateId:record.template.id,root,parts,
    bounds:Object.freeze({width:1,height:1,groundLineY:record.geometry.groundLineY}),
    applyPose(pose:CreaturePoseV1){publishPose(pose);},
    ...(record.geometry.contactPads?{applyContactPose(pose:CreaturePoseV1,contacts:readonly CreaturePaintContact[]){publishPose(pose,contacts);}}:{}),
    dispose(){if(disposed)return;disposed=true;root.destroy({children:true});for(const entry of skins)entry.geometry.destroy();for(const bridge of bridges)bridge.geometry.destroy();for(const texture of textures)texture.destroy(false);if(ownsAtlas)atlas.destroy(true);},
  });
  rigRuntimeDiagnostics.set(rig,Object.freeze({schema:'cf.creature-rig-runtime/v1',sweepBackend:shape?.sweepBackend??'none',fieldVertices:skin?.vertices.length??0,get normalPasses(){return shape?.normalPasses??0;},get robustFallbacks(){return shape?.robustFallbacks??0;}}));
  if(record.geometry.contactPads)rigContactEvidence.set(rig,contactEvidence);
  rigSupportReaders.set(rig,joint=>{
    if(disposed||!published||!skin)return null;
    supports??=observedContactSupports(record,binding);
    const location=supports[joint]?.surface;if(!location)return null;
    const entry=skins.find(e=>e.part.id===location.partId);if(!entry)return null;
    if('vertexIndex' in location)return Object.freeze({x:entry.positions[location.vertexIndex*2]!,y:entry.positions[location.vertexIndex*2+1]!});
    let x=0,y=0;for(let k=0;k<3;k++){const index=location.triangle[k]!;x+=entry.positions[index*2]!*location.barycentric[k]!;y+=entry.positions[index*2+1]!*location.barycentric[k]!;}return Object.freeze({x,y});
  });
  return rig;
}

/** Compatibility name for the explicit sample/flush frame collector.
 * setJoint only queues; the caller owns the frame boundary. */
export function createCreatureRigPoseTarget(rig:CreatureRigV1){return createCreatureRigFrameTarget(rig);}
