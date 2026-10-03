/** Read-only authoring admission: seal, dimensions and every RGBA channel in the
 * actual packed frames, including hidden underlaps. No native renderer or gate waiver. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {hashJSON, hashBytes} from './quadruped-template.mjs';
const require=createRequire(import.meta.url), sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const requireValue=(ok,message)=>{if(!ok)throw Error('Parts verification: '+message);};
export async function verifyPartsDirectory(directory){
 const binding=JSON.parse(fs.readFileSync(path.join(directory,'binding.json')));
 const {bindingHash,...body}=binding;
 requireValue(await hashJSON(body)===bindingHash,'binding hash');
 requireValue(binding.schema==='cf.creature-parts/v1'&&Array.isArray(binding.parts)&&binding.parts.length>0&&binding.parts.length<=40,'schema / part budget');
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json')));
 requireValue(/^[a-z0-9][a-z0-9_-]{0,79}$/.test(manifest.creatureId),'creature id');
 const atlasBytes=fs.readFileSync(path.join(directory,'atlas',manifest.creatureId+'.png'));
 requireValue(await hashBytes(atlasBytes)===binding.atlasSha256,'atlas hash');
 const atlas=await sharp(atlasBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 requireValue(atlas.info.width===binding.atlasSize.width&&atlas.info.height===binding.atlasSize.height&&atlas.info.channels===4,'atlas dimensions');
 const names=new Set(),sources=new Map();let channels=0;
 for(const part of binding.parts){
  requireValue(/^[a-z0-9][a-z0-9_-]{0,79}$/.test(part.id)&&!names.has(part.id),'part identity');names.add(part.id);
  const rows=manifest.parts.filter(p=>p.name===part.id+'.png');
  requireValue(rows.length===1&&rows[0].path==='parts/'+part.id+'.png','manifest inventory');
  const bytes=fs.readFileSync(path.join(directory,'parts',part.id+'.png'));
  requireValue(await hashBytes(bytes)===rows[0].sha256,'part hash: '+part.id);
  const decoded=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const f=part.frame,b=part.cutout;
  requireValue([f.x,f.y,f.width,f.height].every(Number.isInteger)&&f.x>=0&&f.y>=0&&f.width>0&&f.height>0&&f.x+f.width<=atlas.info.width&&f.y+f.height<=atlas.info.height,'frame bounds: '+part.id);
  requireValue(decoded.info.channels===4&&decoded.info.width===b.width&&decoded.info.height===b.height&&b.width===f.width&&b.height===f.height,'part dimensions: '+part.id);
  for(let y=0;y<f.height;y++){
   const start=((f.y+y)*atlas.info.width+f.x)*4;
   requireValue(decoded.data.subarray(y*f.width*4,(y+1)*f.width*4).equals(atlas.data.subarray(start,start+f.width*4)),'packed pixels differ: '+part.id);channels+=f.width*4;
  }
  sources.set(part.id,bytes);
 }
 requireValue(manifest.parts.length===names.size,'extra manifest part');
 return {binding,sources,receipt:{schema:'cf.parts-byte-verification/v1',bindingHash,atlasSha256:binding.atlasSha256,parts:names.size,comparedChannels:channels,changedChannels:0}};
}
