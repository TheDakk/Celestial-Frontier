import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
import {hashBytes,hashJSON} from './quadruped-template.mjs';import {cutAuthoredParts,cutPainterParts} from './part-masks.mjs';import {packRigAtlas} from './rig-atlas.mjs';
import {intakeAuthoredPixels} from './authored-intake.mjs';
const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
export async function buildAuthoredParts({id,recordFile,masterFile,declarationFile,output}){
 if(fs.existsSync(output))throw Error('Authored parts output must be new');
 const record=JSON.parse(fs.readFileSync(recordFile)),master=fs.readFileSync(masterFile),declaration=JSON.parse(fs.readFileSync(declarationFile));
 const {data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const painter=declaration.schema==='cf.painter-part-intake/v1';
 const keyed=painter?{rgba:new Uint8ClampedArray(data),alpha:Uint8Array.from({length:info.width*info.height},(_,i)=>data[i*4+3]),receipt:{mode:'native painter alpha; no keyer'}}:intakeAuthoredPixels(new Uint8ClampedArray(data),info.width,info.height);
 let result;
 if(painter){
  if(declaration.labelsFile!=='labels.png')throw Error('Painter labels must be adjacent labels.png');
  const labelBytes=fs.readFileSync(path.join(path.dirname(declarationFile),declaration.labelsFile));
  if(await hashBytes(labelBytes)!==declaration.labelsSha256)throw Error('Painter label hash mismatch');
  const decoded=await sharp(labelBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(decoded.info.width!==info.width||decoded.info.height!==info.height)throw Error('Painter label dimensions');
  const labels=Uint8Array.from({length:info.width*info.height},(_,i)=>decoded.data[i*4]);
  result=await cutPainterParts(record,master,keyed.rgba,labels,declaration);
 }else result=await cutAuthoredParts(record,master,keyed.rgba,declaration);
 fs.mkdirSync(output,{recursive:true});fs.mkdirSync(path.join(output,'parts'));
 const write=(n,b)=>fs.writeFileSync(path.join(output,n),b,{flag:'wx'}),json=(n,b)=>write(n,JSON.stringify(b,null,2)+'\n');
 write('keyed.png',await sharp(Buffer.from(keyed.rgba),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer());
 const manifests=[];
 for(const part of result.parts){const b=await sharp(Buffer.from(part.rgba),{raw:{width:part.box.width,height:part.box.height,channels:4}}).png().toBuffer();write('parts/'+part.id+'.png',b);manifests.push({name:part.id+'.png',path:'parts/'+part.id+'.png',sha256:await hashBytes(b)});}
 json('manifest.json',{creatureId:id,parts:manifests});packRigAtlas(path.join(output,'manifest.json'),path.join(output,'atlas'));
 const atlas=JSON.parse(fs.readFileSync(path.join(output,'atlas',id+'.json'))),atlasBytes=fs.readFileSync(path.join(output,'atlas',id+'.png'));
 const body={schema:'cf.creature-parts/v1',recordRecipeHash:record.recipeHash,atlasSha256:await hashBytes(atlasBytes),atlasSize:{width:atlas.meta.size.w,height:atlas.meta.size.h},parts:result.parts.map(p=>{
  const f=atlas.frames[p.id+'.png'].frame;return {id:p.id,joint:p.joint,layer:p.layer,kind:p.kind,frame:{x:f.x,y:f.y,width:f.w,height:f.h},cutout:p.box};
 })};json('binding.json',{...body,bindingHash:await hashJSON(body)});
 // Independent readback: every packed part must preserve its input bytes in RGBA.
 const packed=await sharp(atlasBytes).ensureAlpha().raw().toBuffer();let different=0;
 for(const p of result.parts){const f=atlas.frames[p.id+'.png'].frame;for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)for(let c=0;c<4;c++)if(p.rgba[(y*f.w+x)*4+c]!==packed[((y+f.y)*atlas.meta.size.w+x+f.x)*4+c])different++;}
 if(different)throw Error('Atlas changed part pixels: '+different);
 const map=new Uint8ClampedArray(keyed.rgba.length);
 for(let i=0;i<result.labels.length;i++)if(result.labels[i]){const k=result.labels[i];map.set([(k*83)%200+35,(k*137)%200+35,(k*47)%200+35,keyed.alpha[i]],i*4);}
 write('ownership.png',await sharp(Buffer.from(map),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer());
 json('receipt.json',{...result.receipt,keyer:keyed.receipt,atlasDifferentChannels:different,masterSha256:await hashBytes(master),masterUnchanged:await hashBytes(fs.readFileSync(masterFile))===await hashBytes(master),jointPatches:'not yet fitted; this atlas proves authored mask coverage only',motionAcceptance:false});
 return {id,parts:result.parts.length,atlasSize:body.atlasSize,restDifferentChannels:0,atlasDifferentChannels:different};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [id,recordFile,masterFile,declarationFile,output]=process.argv.slice(2);if(!output)throw Error('Usage: id record master declaration NEW_OUTPUT');console.log(JSON.stringify(await buildAuthoredParts({id,recordFile,masterFile,declarationFile,output}),null,2));
}
