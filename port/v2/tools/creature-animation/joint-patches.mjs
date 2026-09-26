import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {GRAPH,hashBytes,hashJSON} from './quadruped-template.mjs';import {packRigAtlas} from './rig-atlas.mjs';
const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
/** Texture-only hidden underlap cut from an existing turnaround. Visible rest
 * silhouette and colour are owned by the base parts, never the patch. */
export function maskJointPatch(sample,width,height,covered){
 if(sample.length!==width*height*4||covered.length!==width*height)throw Error('Joint patch shape');
 const out=new Uint8ClampedArray(sample.length),rx=width/2,ry=height/2;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;if(covered[i]!==255||((x+.5-rx)/rx)**2+((y+.5-ry)/ry)**2>1)continue;
  out.set(sample.subarray(i*4,i*4+4),i*4);out[i*4+3]=255;
 }
 return out;
}
export function assertJointPatchInk(rgba,joint){
 for(let i=0;i<rgba.length;i+=4)if(rgba[i+3]&&rgba[i]>150&&rgba[i+2]>150&&Math.min(rgba[i],rgba[i+2])-rgba[i+1]>85)throw Error('Turnaround patch contains key colour: '+joint);
}
export async function addJointPatches({baseDirectory,recordFile,turnaroundFile,patchFile,output}){
 if(fs.existsSync(output))throw Error('Patch output must be new');
 const record=JSON.parse(fs.readFileSync(recordFile)),decl=JSON.parse(fs.readFileSync(patchFile)),source=fs.readFileSync(turnaroundFile),base=JSON.parse(fs.readFileSync(path.join(baseDirectory,'binding.json')));
 const {declarationHash,...body}=decl;if(await hashJSON(body)!==declarationHash)throw Error('Patch declaration hash');
 if(await hashBytes(source)!==decl.turnaroundSha256||decl.recordRecipeHash!==record.recipeHash||base.recordRecipeHash!==record.recipeHash)throw Error('Patch source binding');
 const parent=new Map(GRAPH),layerCoverage={far:new Uint8Array(record.geometry.width*record.geometry.height),near:new Uint8Array(record.geometry.width*record.geometry.height)},w=record.geometry.width,h=record.geometry.height;
 const partBytes=new Map();
 for(const part of base.parts){
  const bytes=fs.readFileSync(path.join(baseDirectory,'parts',part.id+'.png'));partBytes.set(part.id,bytes);
  {const raw=await sharp(bytes).ensureAlpha().raw().toBuffer(),b=part.cutout;for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++)if(raw[(y*b.width+x)*4+3]===255)layerCoverage[part.layer][(y+b.y)*w+x+b.x]=255;}
 }
 const metadata=await sharp(source).metadata(),patches=[];
 for(const p of decl.patches){
  if(!parent.has(p.joint)||!Number.isFinite(p.radius)||p.radius<=0||p.radius>.05||!Array.isArray(p.sourceCentre)||p.sourceCentre.length!==2||!p.sourceCentre.every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw Error('Patch geometry');
  const pivot=record.landmarks[parent.get(p.joint)],r=Math.round(p.radius*w),size=r*2;
  const box={x:Math.round(pivot[0]*w)-r,y:Math.round(pivot[1]*h)-r,width:size,height:size};
  if(box.x<0||box.y<0||box.x+size>w||box.y+size>h)throw Error('Patch outside cutout');
  const sourceSize=Math.round(size*metadata.width/w),sx=Math.round(p.sourceCentre[0]*metadata.width-sourceSize/2),sy=Math.round(p.sourceCentre[1]*metadata.height-sourceSize/2);
  if(sx<0||sy<0||sx+sourceSize>metadata.width||sy+sourceSize>metadata.height)throw Error('Patch outside turnaround');
  const sample=await sharp(source).extract({left:sx,top:sy,width:sourceSize,height:sourceSize}).resize(size,size).ensureAlpha().raw().toBuffer();
  const layer=base.parts.find(part=>part.joint===p.joint)?.layer;if(!layer)throw Error('No painted part for patch joint: '+p.joint);
  const coverage=new Uint8Array(size*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++)coverage[y*size+x]=layerCoverage[layer][(y+box.y)*w+x+box.x];
  const rgba=maskJointPatch(sample,size,size,coverage);if(!rgba.some((a,i)=>i%4===3&&a))throw Error('Empty joint underlap: '+p.joint);
  // Only retained disc pixels can reach the rig; excluded crop corners are not ink.
  assertJointPatchInk(rgba,p.joint);
  const id='patch-'+p.joint.toLowerCase(),bytes=await sharp(Buffer.from(rgba),{raw:{width:size,height:size,channels:4}}).png().toBuffer();partBytes.set(id,bytes);
  patches.push({id,joint:parent.get(p.joint),layer,kind:'joint-patch',cutout:box,sourceRectangle:{x:sx,y:sy,width:sourceSize,height:sourceSize},coveredJoint:p.joint});
 }
 if(base.parts.length+patches.length>40)throw Error('Patch part budget');
 fs.mkdirSync(output);fs.mkdirSync(path.join(output,'parts'));
 const write=(n,b)=>fs.writeFileSync(path.join(output,n),b,{flag:'wx'}),json=(n,b)=>write(n,JSON.stringify(b,null,2)+'\n'),manifest=[];
 for(const [id,b]of partBytes){write('parts/'+id+'.png',b);manifest.push({name:id+'.png',path:'parts/'+id+'.png',sha256:await hashBytes(b)});}
 json('manifest.json',{creatureId:'civet',parts:manifest});packRigAtlas(path.join(output,'manifest.json'),path.join(output,'atlas'));
 const atlas=JSON.parse(fs.readFileSync(path.join(output,'atlas/civet.json'))),atlasBytes=fs.readFileSync(path.join(output,'atlas/civet.png'));
 const result={schema:'cf.creature-parts/v1',recordRecipeHash:record.recipeHash,atlasSha256:await hashBytes(atlasBytes),atlasSize:{width:atlas.meta.size.w,height:atlas.meta.size.h},parts:[...patches,...base.parts].map(p=>{const f=atlas.frames[p.id+'.png'].frame;return{id:p.id,joint:p.joint,layer:p.layer,kind:p.kind,cutout:p.cutout,frame:{x:f.x,y:f.y,width:f.w,height:f.h}};})};
 json('binding.json',{...result,bindingHash:await hashJSON(result)});json('receipt.json',{schema:'cf.joint-underlap/v1',recordRecipeHash:record.recipeHash,turnaroundSha256:decl.turnaroundSha256,declarationHash,patches,partCount:result.parts.length,patchRestPolicy:'patches draw first; every patch pixel under opaque base paint in its own depth layer',baseBindingHash:base.bindingHash,atlasSha256:result.atlasSha256,turnaroundUnchanged:await hashBytes(fs.readFileSync(turnaroundFile))===decl.turnaroundSha256,nativeRestVerified:false});
 return {patches:patches.length,parts:result.parts.length,atlasSize:result.atlasSize};
}
