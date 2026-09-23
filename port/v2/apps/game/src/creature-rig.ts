import {requireVisiblePaintOwner} from '../../../tools/creature-animation/hidden-anatomy.mjs';
import {observedContactSupports} from './creature-rig-contact.js';
import{createCreatureRigFrameTarget}from'./creature-rig-frame.js';
import {compileRigidParentFrames,applyRigidParentFrames} from '../../../tools/creature-animation/rigid-parent-frame.mjs';
import {Container, Matrix, Rectangle, Sprite, Texture, Mesh, MeshGeometry} from 'pixi.js';
import {applyPaintPart,paintPartAreas,assertPaintPartShape,validatePaintSkin,type PaintSkin} from '../../../tools/creature-animation/paint-skin.mjs';
import {validateSeamBridges,createSeamGeometry,writeSeamPose} from '../../../tools/creature-animation/seam-bridge.mjs';
import {createArapScratch,solveArapSkin} from '../../../tools/creature-animation/arap-skin.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../../tools/creature-animation/compiled-skin-field.mjs';
import {createOpaqueSeamSamplingGuard} from '../../../tools/creature-animation/seam-sampling-guard.mjs';
import {hashBytes, hashJSON} from '../../../tools/creature-animation/quadruped-template.mjs';
import {admitFamilyRecord} from '../../../tools/creature-animation/family-record.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';

export type CreaturePoseV1 = Readonly<Record<string, {rotation:number; dx?:number; dy?:number}>>;
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
export interface CreaturePaintContact {readonly joint:string;readonly paintedTarget:{readonly x:number;readonly y:number};readonly stance:boolean;}
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
export interface CreatureRigRecordV1 {
  readonly anatomy?:import('../../../tools/creature-animation/anatomy-inventory.mjs').AnatomyPresence;
  readonly recipeHash:string;
  readonly template:{id:string;version:number};
  readonly geometry:{width:number;height:number;groundLineY:number;cutoutAssetHash:string;contactPads?:{readonly schema:'cf.terminal-pad-support/v1';readonly kind:'adhesive';readonly points:Readonly<Record<string,readonly [number,number]>>}};
  readonly landmarks:Readonly<Record<string,readonly [number,number]>>;
}
interface Box {readonly x:number;readonly y:number;readonly width:number;readonly height:number;}
export interface CreatureSeamGroupV1 {
 readonly id:string;readonly ancestorJoint:string;readonly layer:'far'|'near';readonly rigidUnderlap?:boolean;
 readonly junctions?:ReadonlyArray<{readonly point:readonly [number,number];readonly ancestorPart:string;readonly parts:ReadonlyArray<string>;readonly joints:ReadonlyArray<string>;readonly sourcePart:string;readonly sourcePixel:readonly [number,number]}>;
 readonly edges:ReadonlyArray<{readonly ancestorPart:string;readonly sourcePart:string;readonly descendantJoint:string;readonly ancestorOverlap?:boolean;
 readonly edge:readonly [readonly [number,number],readonly [number,number]];readonly sourcePixel:readonly [number,number];readonly interiorPixel?:readonly [number,number];readonly sourceDepthPx:number}>;
}
/** Produced offline from masks/joint patches and the pinned, unrotated atlas.
 * No anatomy, poses, genes or clip tuning may be supplied by this binding. */
export interface CreaturePartsBindingV1 {
  readonly schema:'cf.creature-parts/v1';
  readonly bindingHash:string;
  readonly recordRecipeHash:string;
  readonly atlasSha256:string;
  readonly atlasSize:{width:number;height:number};
  readonly paintSkin?:PaintSkin;
  /** Hash-bound source owner for root/pelvis ink on non-quadruped skins. */
  readonly sourceJoinTopology?:{readonly remainderPartId:string};
  readonly seamBridges?:{readonly schema:'cf.seam-bridges/v1';readonly groups:ReadonlyArray<CreatureSeamGroupV1>};
  readonly parts:ReadonlyArray<{id:string;joint:string;layer:'far'|'near';frame:Box;cutout:Box;kind:'part'|'joint-patch'}>;
}
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

export interface CreatureRigLoadOptions {
  /** The custom decoder returns a caller-owned cache texture. The caller releases
   * that texture/source only after every borrowing rig has been disposed. */
  readonly borrowedAtlas?:boolean;
}
/** Hash admission precedes image decode and Pixi allocation. By default the rig
 * owns the decoded atlas. Pass a custom decoder and {borrowedAtlas:true} to retain
 * a caller-owned texture/source on disposal or decoded-dimension refusal. */
export async function loadCreatureRigV1(recordInput:CreatureRigRecordV1,bindingInput:CreaturePartsBindingV1,
  cutoutBytes:Uint8Array,cutoutAlpha:Uint8Array,atlasBytes:Uint8Array,
  decodeAtlas:(bytes:Uint8Array)=>Promise<Texture>=decodeAtlasPng,
  options:CreatureRigLoadOptions={}):Promise<CreatureRigV1>{
  const ownsAtlas=options.borrowedAtlas!==true;
  const record=structuredClone(recordInput),binding=structuredClone(bindingInput);
  const template=await admitFamilyRecord(record,cutoutBytes,cutoutAlpha);
  const joints=[...template.joints];
  requireValue(binding?.schema==='cf.creature-parts/v1','unsupported parts schema');
  const {bindingHash,...body}=binding;
  requireValue(shaPattern.test(bindingHash)&&await hashJSON(body)===bindingHash,'corrupted part binding');
  requireValue(binding.recordRecipeHash===record.recipeHash,'parts belong to another record');
  requireValue(shaPattern.test(binding.atlasSha256)&&await hashBytes(atlasBytes)===binding.atlasSha256,'mismatched atlas hash');
  const skeleton=createSkeletonPoseProgram(template,record.landmarks);
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
  const decoded=decodeAtlas===decodeAtlasPng&&skin?await decodeGuardedAtlasPng(atlasBytes.slice(),record,binding):{texture:await decodeAtlas(atlasBytes.slice()),samplingGuard:undefined};
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
