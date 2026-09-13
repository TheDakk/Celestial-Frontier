import {Container, Matrix, Rectangle, Sprite, Texture} from 'pixi.js';
import {GRAPH, admitRecord, hashBytes, hashJSON} from '../../../tools/creature-animation/quadruped-template.mjs';
import {composeAffine, rotationAround, IDENTITY_AFFINE, type Affine2} from '../../../tools/creature-animation/kinematics.js';

export type CreaturePoseV1 = Readonly<Record<string, {rotation:number; dx?:number; dy?:number}>>;
export interface CreatureRigV1 {
  readonly recipeHash:string;
  readonly templateId:string;
  readonly parts:ReadonlyArray<{id:string;display:Container;pivot:{x:number;y:number};layer:'far'|'near'}>;
  readonly root:Container;
  applyPose(pose:CreaturePoseV1):void;
  readonly bounds:{width:number;height:number;groundLineY:number};
  dispose():void;
}
export interface CreatureRigRecordV1 {
  readonly recipeHash:string;
  readonly template:{id:string;version:number};
  readonly geometry:{width:number;height:number;groundLineY:number;cutoutAssetHash:string};
  readonly landmarks:Readonly<Record<string,readonly [number,number]>>;
}
interface Box {readonly x:number;readonly y:number;readonly width:number;readonly height:number;}
/** Produced offline from masks/joint patches and the pinned, unrotated atlas.
 * No anatomy, poses, genes or clip tuning may be supplied by this binding. */
export interface CreaturePartsBindingV1 {
  readonly schema:'cf.creature-parts/v1';
  readonly bindingHash:string;
  readonly recordRecipeHash:string;
  readonly atlasSha256:string;
  readonly atlasSize:{width:number;height:number};
  readonly parts:ReadonlyArray<{id:string;joint:string;layer:'far'|'near';frame:Box;cutout:Box;kind:'part'|'joint-patch'}>;
}
const requireValue=(ok:unknown,reason:string):void=>{if(!ok)throw Error('Creature rig: '+reason);};
const joints=['root',...GRAPH.map(([child])=>child)];
const parentOf=new Map(GRAPH);
const validBox=(box:Box,w:number,h:number)=>box&&[box.x,box.y,box.width,box.height].every(Number.isInteger)
  &&box.x>=0&&box.y>=0&&box.width>0&&box.height>0&&box.x+box.width<=w&&box.y+box.height<=h;
const shaPattern=/^[a-f0-9]{64}$/;
async function decodeAtlasPng(bytes:Uint8Array):Promise<Texture>{
  const copy=new Uint8Array(bytes.length);copy.set(bytes);
  const bitmap=await createImageBitmap(new Blob([copy.buffer],{type:'image/png'}));
  return Texture.from(bitmap);
}

/** Hash admission precedes image decode and Pixi allocation. The decoder owns a
 * new atlas texture; dispose releases it, never the accepted source master. */
export async function loadCreatureRigV1(recordInput:CreatureRigRecordV1,bindingInput:CreaturePartsBindingV1,
  cutoutBytes:Uint8Array,cutoutAlpha:Uint8Array,atlasBytes:Uint8Array,
  decodeAtlas:(bytes:Uint8Array)=>Promise<Texture>=decodeAtlasPng):Promise<CreatureRigV1>{
  const record=structuredClone(recordInput),binding=structuredClone(bindingInput);
  await admitRecord(record,cutoutBytes,cutoutAlpha);
  requireValue(binding?.schema==='cf.creature-parts/v1','unsupported parts schema');
  const {bindingHash,...body}=binding;
  requireValue(shaPattern.test(bindingHash)&&await hashJSON(body)===bindingHash,'corrupted part binding');
  requireValue(binding.recordRecipeHash===record.recipeHash,'parts belong to another record');
  requireValue(shaPattern.test(binding.atlasSha256)&&await hashBytes(atlasBytes)===binding.atlasSha256,'mismatched atlas hash');
  const {width:w,height:h}=record.geometry,{width:aw,height:ah}=binding.atlasSize;
  requireValue([aw,ah].every(n=>Number.isInteger(n)&&n>0&&n<=2048),'atlas budget');
  requireValue(binding.parts.length>0&&binding.parts.length<=40,'part budget');
  const ids=new Set<string>();
  for(const part of binding.parts){
    requireValue(typeof part.id==='string'&&part.id.length>0&&!ids.has(part.id),'duplicate or empty part id');ids.add(part.id);
    requireValue(joints.includes(part.joint),'unknown part joint: '+part.joint);
    requireValue(part.layer==='far'||part.layer==='near','unknown depth layer');
    requireValue(part.kind==='part'||part.kind==='joint-patch','unknown part kind');
    requireValue(validBox(part.frame,aw,ah)&&validBox(part.cutout,w,h),'part rectangle outside image');
  }
  const atlas=await decodeAtlas(atlasBytes.slice());
  if(atlas.width!==aw||atlas.height!==ah){atlas.destroy(true);throw Error('Creature rig: decoded atlas dimensions');}
  const root=new Container(),far=new Container(),near=new Container();root.addChild(far,near);
  const textures:Texture[]=[];
  const entries=binding.parts.map(part=>{
    const frame=part.frame,box=part.cutout,texture=new Texture({source:atlas.source,frame:new Rectangle(frame.x,frame.y,frame.width,frame.height)});
    textures.push(texture);const sprite=new Sprite(texture),display=new Container();
    sprite.position.set(box.x/w,box.y/h);sprite.scale.set(box.width/w/frame.width,box.height/h/frame.height);
    display.addChild(sprite);(part.layer==='far'?far:near).addChild(display);
    const pivot=record.landmarks[parentOf.get(part.joint)??'root']!;
    return {part,display,pivot:Object.freeze({x:pivot[0],y:pivot[1]})};
  });
  const length=Math.hypot(record.landmarks.chest![0]-record.landmarks.pelvis![0],record.landmarks.chest![1]-record.landmarks.pelvis![1]);
  let disposed=false;
  const parts=Object.freeze(entries.map(({part,display,pivot})=>Object.freeze({id:part.id,display,pivot,layer:part.layer})));
  return Object.freeze({recipeHash:record.recipeHash,templateId:record.template.id,root,parts,
    bounds:Object.freeze({width:1,height:1,groundLineY:record.geometry.groundLineY}),
    applyPose(pose:CreaturePoseV1){
      requireValue(!disposed,'disposed');requireValue(pose&&typeof pose==='object'&&!Array.isArray(pose),'invalid pose');
      // Validate the whole pose before mutating any display object. Missing keys reset to rest.
      for(const [joint,key] of Object.entries(pose)){
        requireValue(joints.includes(joint),'unknown pose joint: '+joint);
        requireValue(key&&Number.isFinite(key.rotation)&&Number.isFinite(key.dx??0)&&Number.isFinite(key.dy??0),'nonfinite pose');
      }
      const matrices:Record<string,Affine2>={};
      for(const joint of joints){
        const parent=parentOf.get(joint),pivot=record.landmarks[parent??'root']!,key=pose[joint];
        const local=key?rotationAround({x:pivot[0],y:pivot[1]},key.rotation,{x:(key.dx??0)*length,y:(key.dy??0)*length}):IDENTITY_AFFINE;
        matrices[joint]=parent?composeAffine(matrices[parent]!,local):local;
      }
      for(const entry of entries)entry.display.setFromMatrix(new Matrix(...matrices[entry.part.joint]!));
    },
    dispose(){if(disposed)return;disposed=true;root.destroy({children:true});for(const texture of textures)texture.destroy(false);atlas.destroy(true);},
  });
}

/** Adapter to Claude's PoseTarget. Keeps the contract's radians/body-length
 * units; timeline evaluation and clocks remain entirely in motion/. */
export function createCreatureRigPoseTarget(rig:CreatureRigV1){
  const pose:Record<string,{rotation:number;dx:number;dy:number}>={};
  return {setJoint(name:string,rotation:number,dx=0,dy=0){
    const next={...pose,[name]:{rotation,dx,dy}};rig.applyPose(next);pose[name]=next[name]!;
  },reset(){rig.applyPose({});for(const name of Object.keys(pose))delete pose[name];}};
}
