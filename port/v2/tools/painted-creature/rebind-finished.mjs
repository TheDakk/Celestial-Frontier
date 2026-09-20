import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
import {buildPaintSkin} from '../creature-animation/build-paint-skin.mjs';
import {hashBytes,hashJSON} from '../creature-animation/quadruped-template.mjs';import {finishConservation} from './finish-conservation.mjs';
const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
export async function rebindFinished(source,finished,output){
 await fs.mkdir(output);const rows=[];
 for(const id of ['crab','freshwater-crab','mud-crab','vent-crab','coconut-crab']){
  try{const dir=path.join(source,id),record=JSON.parse(await fs.readFile(path.join(dir,'record.json'))),binding=JSON.parse(await fs.readFile(path.join(dir,'binding.json'))),finish=await fs.readFile(path.join(finished,id+'-finished.png')),receipt=JSON.parse(await fs.readFile(path.join(finished,id+'-receipt.json')));
   if(receipt.status!=='PASS'||receipt.sha256!==await hashBytes(finish)||receipt.identity.recordRecipeHash!==record.recipeHash||receipt.identity.cutoutAssetHash!==record.geometry.cutoutAssetHash)throw Error('Unqualified finished original');
   const masterBytes=await fs.readFile(path.resolve(record.source));if(await hashBytes(masterBytes)!==record.geometry.cutoutAssetHash)throw Error('Original master changed');
   const master=await sharp(masterBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),pixels=await sharp(finish).ensureAlpha().raw().toBuffer(),labels=await sharp(path.join(dir,'labels.png')).ensureAlpha().raw().toBuffer();const conservation=finishConservation(master.data,pixels,labels,master.info.width,master.info.height);if(conservation.status!=='PASS')throw Error('Conservation refused');
   const manifest=JSON.parse(await fs.readFile(path.join(dir,'parts/manifest.json'))),atlasFile='parts/atlas/'+manifest.creatureId+'.png',atlasBytes=await fs.readFile(path.join(dir,atlasFile));if(await hashBytes(atlasBytes)!==binding.atlasSha256)throw Error('Atlas source changed');const atlas=await sharp(atlasBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),originalAtlas=Buffer.from(atlas.data);
   const out=path.join(output,id);await fs.cp(dir,out,{recursive:true,errorOnExist:true,force:false});
   for(const part of binding.parts){const f=part.frame,b=part.cutout,file='parts/parts/'+part.id+'.png',raw=await sharp(path.join(dir,file)).ensureAlpha().raw().toBuffer();for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++){const i=(y*b.width+x)*4;if(!raw[i+3])continue;const source=((y+b.y)*master.info.width+x+b.x)*4;for(let c=0;c<3;c++){raw[i+c]=pixels[source+c];atlas.data[((y+f.y)*atlas.info.width+x+f.x)*4+c]=raw[i+c];}}
    const bytes=await sharp(raw,{raw:{width:b.width,height:b.height,channels:4}}).png().toBuffer();await fs.writeFile(path.join(out,file),bytes);manifest.parts.find(p=>p.name===part.id+'.png').sha256=await hashBytes(bytes);
   }
   const newAtlas=atlas.data.equals(originalAtlas)?atlasBytes:await sharp(atlas.data,{raw:{width:atlas.info.width,height:atlas.info.height,channels:4}}).png().toBuffer();await fs.writeFile(path.join(out,atlasFile),newAtlas);await fs.writeFile(path.join(out,'parts/keyed.png'),finish);await fs.writeFile(path.join(out,'parts/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
   const partsBinding=JSON.parse(await fs.readFile(path.join(dir,'parts/binding.json')));const {bindingHash:oldPartsHash,...partsBody}=partsBinding;partsBody.atlasSha256=await hashBytes(newAtlas);await fs.writeFile(path.join(out,'parts/binding.json'),JSON.stringify({...partsBody,bindingHash:await hashJSON(partsBody)},null,2)+'\n');
   const before=await buildPaintSkin(path.join(dir,'parts'),{seamBridges:{groups:[]}},record),after=await buildPaintSkin(path.join(out,'parts'),{seamBridges:{groups:[]}},record);if(JSON.stringify(before.binding.parts)!==JSON.stringify(after.binding.parts)||JSON.stringify(before.binding.paintSkin)!==JSON.stringify(after.binding.paintSkin))throw Error('Recompiled texture geometry changed');
   const {bindingHash,...body}=binding;body.atlasSha256=await hashBytes(newAtlas);const next={...body,bindingHash:await hashJSON(body)};if(JSON.stringify(next.parts)!==JSON.stringify(binding.parts)||JSON.stringify(next.paintSkin)!==JSON.stringify(binding.paintSkin))throw Error('Texture changed geometry');await fs.writeFile(path.join(out,'binding.json'),JSON.stringify(next,null,2)+'\n');
   const proof={id,status:'PASS',painterBindingHash:bindingHash,finishedBindingHash:next.bindingHash,geometryByteIdentical:true,recompiledPaintSkinIdentical:true,recordUnchanged:true,atlasSha256:next.atlasSha256,conservation,source,finished};await fs.writeFile(path.join(out,'finished-rebind.json'),JSON.stringify(proof,null,2)+'\n');rows.push(proof);
  }catch(e){rows.push({id,status:'LEAF_RED',error:String(e)});}
 }
 await fs.writeFile(path.join(output,'rebind-summary.json'),JSON.stringify(rows,null,2)+'\n');return rows;
}
