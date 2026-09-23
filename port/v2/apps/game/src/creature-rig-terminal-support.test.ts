import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {it,expect} from 'vitest';import {Texture,TextureSource,Mesh} from 'pixi.js';
import {observedContactSupports} from './creature-rig-contact.js';
import {loadCreatureRigV1,readCreatureRigContactSupport,readCreatureRigContactEvidence} from './creature-rig.js';
import {familyContractForRecord} from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';

const root=path.resolve(import.meta.dirname,'../../../../..');
const fit='audits/ARCHETYPE_FINISH_20260923/06-hopper/fit-05/';
const read=(file:string)=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const req=createRequire(import.meta.url),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs');

it('the admitted adhesive pad reads the actual published triangle, detects changed paint, and retains publication lifecycle',async()=>{
 const record=read(fit+'record.json'),binding=read(fit+'binding.json'),manifest=read(fit+'parts/manifest.json');
 // Eligibility is checked on the unmodified admitted fit, before creating a rig.
 const supports=observedContactSupports(record,binding);
 expect(Object.keys(supports).sort()).toEqual(Object.keys(record.geometry.contactPads.points).sort());
 expect(Object.keys(supports)).toHaveLength(4);
 const surfaces=Object.entries(supports).map(([joint,support])=>{
  const surface=support.surface;
  if(!surface||!('triangle' in surface))throw Error('Expected actual rendered pad triangle: '+joint);
  expect(surface.triangle).toHaveLength(3);expect(surface.barycentric).toHaveLength(3);
  expect(surface.barycentric.every(weight=>weight>0&&weight<1)).toBe(true);
  expect(binding.parts.find((part:{id:string})=>part.id===surface.partId)?.joint).toBe(support.pivotJoint);
  return {joint,surface};
 });
 const keyed=PNG.sync.read(fs.readFileSync(path.join(root,fit+'parts/keyed.png')));
 const alpha=Uint8Array.from({length:keyed.width*keyed.height},(_,i)=>keyed.data[i*4+3]);
 const rig=await loadCreatureRigV1(record,binding,fs.readFileSync(path.resolve(root,record.source)),alpha,
  fs.readFileSync(path.join(root,fit+'parts/atlas/'+manifest.creatureId+'.png')),
  async()=>new Texture({source:new TextureSource(binding.atlasSize)}));
 const size=[record.geometry.width,record.geometry.height] as const;
 const bodyLength=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks).bodyLength;
 const meshFor=(id:string)=>{
  const part=rig.parts.find(part=>part.id===id);if(!part)throw Error('Missing rendered part '+id);
  const mesh=part.display.children[0];expect(mesh).toBeInstanceOf(Mesh);return mesh as Mesh;
 };
 const dataFor=(id:string)=>{
  const data=meshFor(id).geometry.getBuffer('aPosition').data;
  expect(data).toBeInstanceOf(Float32Array);return data as Float32Array;
 };
 const independent=(surface:typeof surfaces[number]['surface'])=>{
  const data=dataFor(surface.partId);
  const coordinates=surface.triangle.map(index=>[data[index*2]!,data[index*2+1]!] as const);
  expect(coordinates.flat().every(Number.isFinite)).toBe(true);
  return {x:coordinates.reduce((sum,p,i)=>sum+p[0]*surface.barycentric[i]!,0),
   y:coordinates.reduce((sum,p,i)=>sum+p[1]*surface.barycentric[i]!,0)};
 };
 const drift=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot((a.x-b.x)*size[0],(a.y-b.y)*size[1]);
 const snapshot=()=>Object.fromEntries(rig.parts.map(part=>{
  const data=dataFor(part.id);return [part.id,Buffer.from(data.buffer,data.byteOffset,data.byteLength).toString('hex')];
 }));
 let maximumRestErrorPx=0,maximumVertexProxyErrorPx=0,mutantDriftPx=0;
 try{
  for(const {joint} of surfaces)expect(readCreatureRigContactSupport(rig,joint)).toBeNull();
  rig.applyPose({});
  const rest=Object.fromEntries(surfaces.map(({joint,surface})=>{
   const expected=independent(surface),actual=readCreatureRigContactSupport(rig,joint)!;
   expect(actual).toEqual(expected);
   const point=record.geometry.contactPads.points[joint];
   const error=drift(actual,{x:point[0],y:point[1]});expect(error).toBeLessThanOrEqual(.25);
   maximumRestErrorPx=Math.max(maximumRestErrorPx,error);
   const data=dataFor(surface.partId),first=surface.triangle[0];
   maximumVertexProxyErrorPx=Math.max(maximumVertexProxyErrorPx,drift(actual,{x:data[first*2]!,y:data[first*2+1]!}));
   return [joint,actual];
  }));
  expect(maximumVertexProxyErrorPx).toBeGreaterThan(.25);
  expect(readCreatureRigContactSupport(rig,'root')).toBeNull();
  // Exercise the publication path again with a nonzero, rigid translation. The
  // expected body-length translation is independent of the reader and mesh sum.
  for(const [dx,dy] of [[.01,-.005],[-.01,.005]] as const){
   rig.applyPose({root:{rotation:0,dx,dy}});
   for(const {joint,surface} of surfaces){
    const actual=readCreatureRigContactSupport(rig,joint)!;expect(actual).toEqual(independent(surface));
    const point=record.geometry.contactPads.points[joint];
    expect(drift(actual,{x:point[0]+dx*bodyLength,y:point[1]+dy*bodyLength})).toBeLessThanOrEqual(.25);
    expect(drift(actual,rest[joint]!)).toBeGreaterThan(.25);
   }
  }
  // Alter an actual published contributing vertex, not the support model. An
  // observer using the joint or cached LBS result would miss this fault.
  const {joint,surface}=surfaces.find(value=>value.joint==='foreNearAnkle')!;
  const mesh=meshFor(surface.partId),data=dataFor(surface.partId),index=surface.triangle[0]*2,before=data[index]!;
  const anchor=independent(surface);
  try{
   data[index]=before+1/(size[0]*surface.barycentric[0]);mesh.geometry.getBuffer('aPosition').update();
   const actual=readCreatureRigContactSupport(rig,joint)!;expect(actual).toEqual(independent(surface));
   mutantDriftPx=drift(actual,anchor);expect(mutantDriftPx).toBeGreaterThan(.25);
  }finally{data[index]=before;mesh.geometry.getBuffer('aPosition').update();}
  expect(readCreatureRigContactSupport(rig,joint)).toEqual(anchor);
  const beforeFailure=snapshot(),anchors=Object.fromEntries(surfaces.map(({joint})=>[joint,readCreatureRigContactSupport(rig,joint)]));
  expect(()=>rig.applyPose({foreign:{rotation:1}})).toThrow('unknown pose joint');
  expect(snapshot()).toEqual(beforeFailure);
  for(const {joint} of surfaces)expect(readCreatureRigContactSupport(rig,joint)).toEqual(anchors[joint]);
  // A different valid pose fills pending mesh arrays before a deliberately
  // wrong adhesive target refuses. None of that pending geometry may publish.
  const guarded=rig.applyContactPose;if(!guarded)throw Error('Declared pads require guarded publication');
  const nextPose={root:{rotation:0,dx:.02,dy:-.01}};
  const contacts=surfaces.map(({joint})=>{
   const point=record.geometry.contactPads.points[joint];
   return {joint,stance:true,paintedTarget:{x:point[0]+nextPose.root.dx*bodyLength,y:point[1]+nextPose.root.dy*bodyLength}};
  });
  const evidenceBefore=readCreatureRigContactEvidence(rig);
  const badContacts=contacts.map(contact=>contact.joint==='foreNearAnkle'
   ?{...contact,stance:false,paintedTarget:{...contact.paintedTarget,x:contact.paintedTarget.x+1/size[0]}}:contact);
  expect(()=>guarded.call(rig,nextPose,badContacts)).toThrow('published painted pad drift foreNearAnkle');
  expect(snapshot()).toEqual(beforeFailure);
  for(const {joint} of surfaces)expect(readCreatureRigContactSupport(rig,joint)).toEqual(anchors[joint]);
  expect(readCreatureRigContactEvidence(rig)).toEqual(evidenceBefore);
  guarded.call(rig,nextPose,contacts);
  for(const {joint,surface} of surfaces){
   const actual=readCreatureRigContactSupport(rig,joint)!;
   expect(actual).toEqual(independent(surface));
   expect(drift(actual,contacts.find(contact=>contact.joint===joint)!.paintedTarget)).toBeLessThanOrEqual(.25);
   expect(drift(actual,anchors[joint]!)).toBeGreaterThan(.25);
  }
  const admittedEvidence=readCreatureRigContactEvidence(rig)!;
  expect(admittedEvidence.samples).toBe((evidenceBefore?.samples??0)+contacts.length);
  expect(admittedEvidence.maxPaintDriftPx).toBeLessThanOrEqual(.25);
  rig.applyPose({});
  for(const {joint,surface} of surfaces){
   expect(readCreatureRigContactSupport(rig,joint)).toEqual(independent(surface));
   expect(drift(readCreatureRigContactSupport(rig,joint)!,rest[joint]!)).toBeLessThanOrEqual(.25);
  }
 }finally{rig.dispose();}
 for(const {joint} of surfaces)expect(readCreatureRigContactSupport(rig,joint)).toBeNull();
 console.log(JSON.stringify({finding:'actual published terminal triangle support',supports:surfaces.length,maximumRestErrorPx,maximumVertexProxyErrorPx,mutantDriftPx,scope:'Reader/publication controls only; no animation battery, native film or terrain-clearance claim.'}));
},60_000);
