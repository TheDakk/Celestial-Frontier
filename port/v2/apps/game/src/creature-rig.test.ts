import {readFileSync} from 'node:fs';
import {performance as timer} from 'node:perf_hooks';
import {expect,it,vi} from 'vitest';
import {Container,Texture,TextureSource} from 'pixi.js';
import {loadCreatureRigV1,createCreatureRigPoseTarget,readCreatureRigRuntimeDiagnostics,type CreaturePartsBindingV1,type CreatureRigV1} from './creature-rig.js';
import {hashBytes,hashJSON} from '../../../tools/creature-animation/quadruped-template.mjs';

const root=new URL('../../../../../',import.meta.url);
const record=JSON.parse(readFileSync(new URL('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json',root),'utf8'));
const master=readFileSync(new URL('audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png',root));
const alpha=new Uint8Array(record.geometry.width*record.geometry.height).fill(255);
const atlasBytes=new Uint8Array([137,80,78,71,13,10,26,10]); // synthetic decode seam; no visual evidence
const parts=['tail1','head','jaw','foreNearPaw'].map((joint,i)=>({id:joint,joint,layer:i===0?'far' as const:'near' as const,
  frame:{x:i*8,y:0,width:8,height:8},cutout:{x:100+i*20,y:200,width:20,height:20},kind:'part' as const}));
const decoder=()=>Promise.resolve(new Texture({source:new TextureSource({width:32,height:8})}));
async function binding():Promise<CreaturePartsBindingV1>{
 const body={schema:'cf.creature-parts/v1' as const,recordRecipeHash:record.recipeHash,atlasSha256:await hashBytes(atlasBytes),atlasSize:{width:32,height:8},parts};
 return {...body,bindingHash:await hashJSON(body)};
}
async function load(){return loadCreatureRigV1(record,await binding(),master,alpha,atlasBytes,decoder);}
const snapshot=(rig:CreatureRigV1)=>rig.parts.map(p=>[p.display.x,p.display.y,p.display.rotation,p.display.scale.x,p.display.scale.y]);

it('creates one atlas worth of actual Pixi parts, fixed depth layers and exact rest transforms',async()=>{
 const rig=await load();
 try{
  expect(readCreatureRigRuntimeDiagnostics(rig)).toEqual({schema:'cf.creature-rig-runtime/v1',sweepBackend:'none',fieldVertices:0,normalPasses:0,robustFallbacks:0});
  expect(readCreatureRigRuntimeDiagnostics({...rig})).toBeNull();
  expect(rig.root).toBeInstanceOf(Container);expect(rig.parts.map(p=>p.id)).toEqual(parts.map(p=>p.id));
  expect(rig.parts[0]!.display.parent).toBe(rig.root.children[0]);
  expect(rig.parts[1]!.display.parent).toBe(rig.root.children[1]);
  expect(rig.parts[1]!.pivot).toEqual({x:record.landmarks.neck[0],y:record.landmarks.neck[1]});
  expect(rig.bounds).toEqual({width:1,height:1,groundLineY:record.geometry.groundLineY});
  expect(snapshot(rig)).toEqual(parts.map(()=>[0,0,0,1,1]));
  rig.applyPose({head:{rotation:.2},jaw:{rotation:-.1},root:{rotation:0,dx:.3,dy:-.1}});
  expect(snapshot(rig)).not.toEqual(parts.map(()=>[0,0,0,1,1]));
  rig.applyPose({});expect(snapshot(rig)).toEqual(parts.map(()=>[0,0,0,1,1]));
 }finally{rig.dispose();}
});
it('uses child-bone/parent-pivot inheritance, radians and body-length offsets; PoseTarget agrees',async()=>{
 const a=await load(),b=await load();
 try{
  const pose={head:{rotation:.4},jaw:{rotation:-.15},root:{rotation:0,dx:.5,dy:-.2}};
  a.applyPose(pose);const target=createCreatureRigPoseTarget(b);
  for(const [joint,key] of Object.entries(pose))target.setJoint(joint,key.rotation,'dx' in key?key.dx:0,'dy' in key?key.dy:0);target.flush();
  expect(snapshot(b)).toEqual(snapshot(a));
  const length=Math.hypot(record.landmarks.chest[0]-record.landmarks.pelvis[0],record.landmarks.chest[1]-record.landmarks.pelvis[1]);
  const head=a.parts.find(p=>p.id==='head')!.display,neck=record.landmarks.neck;
  expect(head.rotation).toBeCloseTo(.4,12);
  expect(head.x).toBeCloseTo(neck[0]-Math.cos(.4)*neck[0]+Math.sin(.4)*neck[1]+.5*length,12);
  expect(head.y).toBeCloseTo(neck[1]-Math.sin(.4)*neck[0]-Math.cos(.4)*neck[1]-.2*length,12);
  expect(a.parts.find(p=>p.id==='jaw')!.display.rotation).toBeCloseTo(.25,12);
  target.reset();expect(snapshot(b)).toEqual(parts.map(()=>[0,0,0,1,1]));
  const before=snapshot(a);expect(()=>a.applyPose({head:{rotation:.5},notAJoint:{rotation:0}})).toThrow('unknown pose joint');expect(snapshot(a)).toEqual(before);
  expect(()=>a.applyPose({head:{rotation:NaN}})).toThrow('nonfinite');expect(snapshot(a)).toEqual(before);
 }finally{a.dispose();b.dispose();}
});
it('refuses altered landmark, cutout, atlas and binding hashes before decoding; bounds refuse a serpent',async()=>{
 const decode=vi.fn(decoder),base=await binding();
 const corrupt=structuredClone(record);corrupt.landmarks.head[0]+=.01;
 await expect(loadCreatureRigV1(corrupt,base,master,alpha,atlasBytes,decode)).rejects.toThrow('corrupted landmark');
 await expect(loadCreatureRigV1(record,base,new Uint8Array([1]),alpha,atlasBytes,decode)).rejects.toThrow('mismatched cut-out');
 await expect(loadCreatureRigV1(record,base,master,alpha,new Uint8Array([2]),decode)).rejects.toThrow('mismatched atlas');
 const stale={...base,parts:base.parts.map((p,i)=>i===0?{...p,frame:{...p.frame,x:p.frame.x+1}}:p)};
 await expect(loadCreatureRigV1(record,stale,master,alpha,atlasBytes,decode)).rejects.toThrow('corrupted part binding');
 const serpent=structuredClone(record);serpent.kind='serpent';const {recipeHash,...body}=serpent;serpent.recipeHash=await hashJSON(body);
 await expect(loadCreatureRigV1(serpent,base,master,alpha,atlasBytes,decode)).rejects.toThrow('unsupported body');
 const missingPaint=new Uint8Array(alpha.length);
 await expect(loadCreatureRigV1(record,base,master,missingPaint,atlasBytes,decode)).rejects.toThrow('landmark outside painted alpha');
 expect(decode).not.toHaveBeenCalled();
});
it('refuses internally resealed bad frames, duplicate parts and budgets; releases only its owned texture',async()=>{
 const base=await binding(),decode=vi.fn(decoder);
 for(const mutant of [
  {...base,parts:base.parts.map((p,i)=>i===0?{...p,frame:{...p.frame,width:99}}:p)},
  {...base,parts:base.parts.map((p,i)=>i===1?{...p,id:base.parts[0]!.id}:p)},
  {...base,parts:Array.from({length:41},()=>base.parts[0]!)},
 ]){
  const {bindingHash,...body}=mutant;const value={...body,bindingHash:await hashJSON(body)};
  await expect(loadCreatureRigV1(record,value,master,alpha,atlasBytes,decode)).rejects.toThrow('Creature rig:');
 }
 expect(decode).not.toHaveBeenCalled();
 const texture=await decoder(),rig=await loadCreatureRigV1(record,base,master,alpha,atlasBytes,()=>Promise.resolve(texture));
 rig.dispose();rig.dispose();expect(texture.destroyed).toBe(true);expect(rig.root.destroyed).toBe(true);
 expect(Texture.EMPTY.destroyed).toBe(false);expect(()=>rig.applyPose({})).toThrow('disposed');
});
it('keeps a borrowed atlas and its source alive while disposing owned atlases',async()=>{
 const base=await binding(),shared=await decoder(),source=shared.source,decode=()=>Promise.resolve(shared);
 const options={borrowedAtlas:true};
 const a=await loadCreatureRigV1(record,base,master,alpha,atlasBytes,decode,options);
 const b=await loadCreatureRigV1(record,base,master,alpha,atlasBytes,decode,{borrowedAtlas:true});
 options.borrowedAtlas=false; // Ownership is captured at load, not read from mutable options at disposal.
 a.dispose();a.dispose();
 expect(a.root.destroyed).toBe(true);expect(shared.destroyed).toBe(false);expect(source.destroyed).toBe(false);
 expect(()=>b.applyPose({head:{rotation:.1}})).not.toThrow();b.dispose();
 expect(shared.destroyed).toBe(false);expect(source.destroyed).toBe(false);
 shared.destroy(true);expect(shared.destroyed).toBe(true);expect(source.destroyed).toBe(true);
 const owned=await decoder(),ownedSource=owned.source;
 const c=await loadCreatureRigV1(record,base,master,alpha,atlasBytes,()=>Promise.resolve(owned));
 c.dispose();expect(owned.destroyed).toBe(true);expect(ownedSource.destroyed).toBe(true);
 for(const borrowedAtlas of [true,false]){
  const wrong=new Texture({source:new TextureSource({width:1,height:1})}),wrongSource=wrong.source;
  await expect(loadCreatureRigV1(record,base,master,alpha,atlasBytes,()=>Promise.resolve(wrong),{borrowedAtlas})).rejects.toThrow('decoded atlas dimensions');
  expect(wrong.destroyed).toBe(!borrowedAtlas);expect(wrongSource.destroyed).toBe(!borrowedAtlas);
  if(borrowedAtlas)wrong.destroy(true);
 }
});
it('replays without clock/RNG reads and keeps a full-graph/40-part update below the 2ms Mac budget',async()=>{
 const base=await binding(),names=Object.keys(record.landmarks);
 const {bindingHash,...body}={...base,atlasSize:{width:320,height:8},parts:Array.from({length:40},(_,i)=>({...parts[0]!,id:'part'+i,joint:names[i%names.length]!,frame:{x:i*8,y:0,width:8,height:8}}))};
 const rig=await loadCreatureRigV1(record,{...body,bindingHash:await hashJSON(body)},master,alpha,atlasBytes,()=>Promise.resolve(new Texture({source:new TextureSource({width:320,height:8})})));
 const random=vi.spyOn(Math,'random').mockImplementation(()=>{throw Error('RNG');});
 const clock=vi.spyOn(Date,'now').mockImplementation(()=>{throw Error('clock');});
 try{
  expect(()=>Date.now()).toThrow('clock');expect(()=>Math.random()).toThrow('RNG');
  const pose=Object.fromEntries(Object.keys(record.landmarks).map(joint=>[joint,{rotation:.01,dx:.02,dy:0}]));
  rig.applyPose(pose);const expected=snapshot(rig);rig.applyPose({});rig.applyPose(pose);expect(snapshot(rig)).toEqual(expected);
  for(let i=0;i<200;i++)rig.applyPose(pose);
  const start=timer.now();for(let i=0;i<1000;i++)rig.applyPose(pose);const mean=(timer.now()-start)/1000;
  expect(mean).toBeLessThan(2);console.log('C2 full-graph/40-part applyPose mean ms:',mean);
 }finally{random.mockRestore();clock.mockRestore();rig.dispose();}
});

it('deforming cut publishes actual Pixi mesh geometry, resets its strip exactly, and refuses overflow atomically',async()=>{
 const original=await binding();
 const adjusted=original.parts.map((p,i)=>({...p,frame:{x:i*20,y:0,width:20,height:20}}));
 const patch={id:'band-head-near',joint:'head',layer:'near' as const,kind:'joint-patch' as const,cutout:{x:140,y:205,width:2,height:2},frame:{x:80,y:0,width:2,height:2}};
 const body={...original,atlasSize:{width:82,height:20},parts:[patch,...adjusted],seamBridges:{schema:'cf.seam-bridges/v1' as const,groups:[{
  id:patch.id,ancestorJoint:'head',layer:'near' as const,edges:[{ancestorPart:'head',sourcePart:'jaw',descendantJoint:'jaw',edge:[[140,205],[140,206]] as const,sourcePixel:[140,205] as const,sourceDepthPx:5}]}]}};
 const {bindingHash,...unsigned}=body,value={...unsigned,bindingHash:await hashJSON(unsigned)};
 const rig=await loadCreatureRigV1(record,value,master,alpha,atlasBytes,()=>Promise.resolve(new Texture({source:new TextureSource({width:82,height:20})})));
 try{
  const mesh=rig.parts.find(p=>p.id===patch.id)!.display.children[0] as import('pixi.js').Mesh;
  rig.applyPose({});const rest=Array.from(mesh.geometry.getBuffer('aPosition').data);
  expect(rest.slice(8,12)).toEqual([rest[14],rest[15],rest[12],rest[13]]);
  rig.applyPose({jaw:{rotation:0,dx:.1}});const moved=Array.from(mesh.geometry.getBuffer('aPosition').data);
  expect(moved.slice(8)).not.toEqual(rest.slice(8));expect(moved.slice(0,8)).toEqual(rest.slice(0,8));
  const displays=snapshot(rig);expect(()=>rig.applyPose({jaw:{rotation:0,dx:1e40}})).toThrow('coordinate bound');
  expect(Array.from(mesh.geometry.getBuffer('aPosition').data)).toEqual(moved);expect(snapshot(rig)).toEqual(displays);
  rig.applyPose({});expect(Array.from(mesh.geometry.getBuffer('aPosition').data)).toEqual(rest);
 }finally{rig.dispose();}
 const changed=structuredClone(unsigned);changed.seamBridges.groups[0]!.edges[0]!.sourceDepthPx=50;
 const decode=vi.fn(decoder);await expect(loadCreatureRigV1(record,{...changed,bindingHash:await hashJSON(changed)},master,alpha,atlasBytes,decode)).rejects.toThrow('depth cap');expect(decode).not.toHaveBeenCalled();
});

it('continuous parts render through one atlas mesh field and reset without per-part rigid transforms',async()=>{
 const original=await binding(),painted=original.parts.map((p,i)=>({...p,frame:{x:i*20,y:0,width:20,height:20}}));
 const skin:import('../../../tools/creature-animation/paint-skin.mjs').PaintSkin={schema:'cf.paint-skin/v1',vertices:[],parts:[]};
 for(const p of painted){const start=skin.vertices.length;for(const [x,y]of [[p.cutout.x,p.cutout.y],[p.cutout.x+20,p.cutout.y],[p.cutout.x,p.cutout.y+20]])skin.vertices.push({x:x!,y:y!,weights:[[p.joint,1]]});
  skin.parts.push({id:p.id,vertices:[0,1,2].map(i=>({triangle:[start,start+1,start+2],barycentric:[i===0?1:0,i===1?1:0,i===2?1:0]})),indices:[0,1,2]});}
 const {bindingHash,...body}={...original,parts:painted,paintSkin:skin,atlasSize:{width:80,height:20}};
 const rig=await loadCreatureRigV1(record,{...body,bindingHash:await hashJSON(body)},master,alpha,atlasBytes,()=>Promise.resolve(new Texture({source:new TextureSource({width:80,height:20})})));
 const geometry=()=>rig.parts.map(p=>Array.from((p.display.children[0] as import('pixi.js').Mesh).geometry.getBuffer('aPosition').data));
 try{rig.applyPose({});const rest=geometry();rig.applyPose({root:{rotation:0,dx:.1}});expect(geometry()).not.toEqual(rest);expect(snapshot(rig)).toEqual(parts.map(()=>[0,0,0,1,1]));
  const moved=geometry();expect(()=>rig.applyPose({root:{rotation:0,dx:1e40}})).toThrow('coordinate bound');expect(geometry()).toEqual(moved);rig.applyPose({});expect(geometry()).toEqual(rest);
 }finally{rig.dispose();}
});

it('refuses a resealed invalid continuous solver before allocating an atlas texture',async()=>{
 const original=await binding(),part={...original.parts[0]!,frame:{x:0,y:0,width:20,height:20}};
 const skin:import('../../../tools/creature-animation/paint-skin.mjs').PaintSkin={schema:'cf.paint-skin/v1',
  vertices:[{x:100,y:200,weights:[['tail1',1]]},{x:120,y:200,weights:[['tail1',1]]},{x:100,y:220,weights:[['tail1',1]]}],
  parts:[{id:part.id,vertices:[0,1,2].map(i=>({triangle:[0,1,2],barycentric:[i===0?1:0,i===1?1:0,i===2?1:0]})),indices:[0,1,2]}],
  triangles:[0,0,1],solver:{iterations:4,globalIterations:4,targetWeight:.35,pins:[]}};
 const {bindingHash,...body}={...original,parts:[part],paintSkin:skin,atlasSize:{width:20,height:20}},decode=vi.fn(decoder);
 const validBody={...body,paintSkin:{...skin,triangles:[0,1,2]}};
 const valid=await loadCreatureRigV1(record,{...validBody,bindingHash:await hashJSON(validBody)},master,alpha,atlasBytes,()=>Promise.resolve(new Texture({source:new TextureSource({width:20,height:20})})));
 try{expect(readCreatureRigRuntimeDiagnostics(valid)).toEqual({schema:'cf.creature-rig-runtime/v1',sweepBackend:'wasm',fieldVertices:3,normalPasses:0,robustFallbacks:0});valid.applyPose({});}finally{valid.dispose();}
 await expect(loadCreatureRigV1(record,{...body,bindingHash:await hashJSON(body)},master,alpha,atlasBytes,decode)).rejects.toThrow('triangle indices');
 expect(decode).not.toHaveBeenCalled();
});
