/** Exact authoring assets for six canonical residents. No inference or game authority. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {speciesVisualKey} from '../../port/v2/packages/art/src/speciesidentity.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const SPECIES_REFERENCE_SET='audits/AI_SPECIES_MOBILE_20260909/references/reference-set-v1.json';
const ORDER=Object.freeze(['Civet','Persimmon','Platypus','Frog',"Devil's Club",'Cranberry']);
const need=(value,message)=>{if(!value)throw Error(message);};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const safe=value=>typeof value==='string'&&value.length<=240&&value.split('/').every(part=>/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(part)&&part!=='.'&&part!=='..');
export function referenceImageDimensions(bytes){
  if(bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.toString('ascii',12,16)==='IHDR')
    return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
  if(bytes.length>=25&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'
    &&bytes.readUInt32LE(4)+8===bytes.length&&bytes.toString('ascii',12,16)==='VP8L'&&bytes[20]===0x2f){
    const bits=bytes.readUInt32LE(21);return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
  }
  throw Error('Unsupported anatomical source image header');
}
async function regular(root,relative,limit){
  need(safe(relative),'Unsafe anatomical source path');const file=path.join(root,relative),stat=await fs.lstat(file);
  need(stat.isFile()&&!stat.isSymbolicLink()&&await fs.realpath(file)===file&&stat.size>0&&stat.size<=limit,'Unsafe anatomical source file');
  const bytes=await fs.readFile(file),after=await fs.lstat(file);
  need(stat.size===bytes.length&&stat.ino===after.ino&&stat.mtimeMs===after.mtimeMs&&stat.ctimeMs===after.ctimeMs,'Anatomical source changed while reading');
  return {file,bytes,stat};
}
export async function loadSpeciesReferenceSet({sourceRoot=ROOT,manifestPath=SPECIES_REFERENCE_SET}={}){
  const root=path.resolve(sourceRoot);need(await fs.realpath(root)===root,'Anatomical source root symlink refused');
  const raw=await regular(root,manifestPath,256*1024),set=JSON.parse(raw.bytes.toString('utf8'));
  need(set.schema==='cf.local-ai-species-reference-set.v1'&&set.qualityAccepted===false
    &&set.referenceStatus==='reviewed-for-conditioning-only'&&Array.isArray(set.references)&&set.references.length===6,'Invalid anatomical reference set');
  need(set.preparation?.width===480&&set.preparation.height===320&&set.preparation.opaqueMatte==='#72786e'
    &&set.preparation.resampling==='browser-high-quality'&&set.preparation.sourcePixelsUnedited===true,'Anatomical preparation changed');
  need(set.sourceSnapshot?.schema==='cf.art.landfall-snapshot.v1'
    &&sha('lfas1:'+JSON.stringify(set.sourceSnapshot))===set.sourceSnapshotDigest,'Anatomical snapshot binding changed');
  need(Array.isArray(set.sourceSnapshot.displayPlan?.residents)&&set.sourceSnapshot.displayPlan.residents.length===6,'Incomplete anatomical snapshot residents');
  const identities=new Set(),targets=new Set(),imageHashes=new Set(),rows=[];let total=0;
  for(const [index,row]of set.references.entries()){
    need(row.imageIndex===index+1&&row.name===ORDER[index]&&typeof row.speciesVisualKey==='string'
      &&row.speciesVisualKey.length>0&&row.speciesVisualKey.length<=4096&&!identities.has(row.speciesVisualKey)
      &&row.fullGenome&&typeof row.fullGenome==='object'&&row.fullGenome._earthName===row.name,'Anatomical order/identity changed');
    const resident=set.sourceSnapshot.displayPlan.residents[index];
    need(resident.name===row.name&&speciesVisualKey(row.fullGenome)===row.speciesVisualKey
      &&speciesVisualKey(resident.genome)===row.speciesVisualKey,'Full anatomical genome/identity mismatch');
    identities.add(row.speciesVisualKey);
    need(safe(row.target)&&row.target.startsWith('__local_ai/')&&!targets.has(row.target)
      &&/\.(png|webp)$/.test(row.target)&&row.width===480&&row.height===320
      &&Number.isSafeInteger(row.sourceWidth)&&Number.isSafeInteger(row.sourceHeight)&&row.sourceWidth>0&&row.sourceHeight>0
      &&row.sourceWidth<=8192&&row.sourceHeight<=8192&&row.sourceWidth*row.sourceHeight<=16777216
      &&row.sourceWidth*2===row.sourceHeight*3,'Anatomical target/geometry changed');targets.add(row.target);
    need(Number.isSafeInteger(row.bytes)&&row.bytes>0&&row.bytes<=16*1024*1024&&/^[a-f0-9]{64}$/.test(row.sha256),'Invalid anatomical source pin');
    need(!imageHashes.has(row.sha256),'Duplicate anatomical source image');imageHashes.add(row.sha256);
    const image=await regular(root,row.source,16*1024*1024);need(image.bytes.length===row.bytes&&sha(image.bytes)===row.sha256,'Anatomical source hash changed');
    const dimensions=referenceImageDimensions(image.bytes);need(dimensions.width===row.sourceWidth&&dimensions.height===row.sourceHeight,'Anatomical decoded header geometry changed');
    total+=row.bytes;need(total<=32*1024*1024,'Anatomical reference set exceeds bound');
    const config=Object.freeze({imageIndex:row.imageIndex,url:'/'+row.target,sha256:row.sha256,width:480,height:320,
      sourceWidth:row.sourceWidth,sourceHeight:row.sourceHeight,speciesVisualKey:row.speciesVisualKey});
    rows.push(Object.freeze({source:row.source,target:row.target,file:image.file,bytes:row.bytes,sha256:row.sha256,stat:image.stat,config}));
  }
  return Object.freeze({manifestPath,manifestSha256:sha(raw.bytes),sourceSnapshotDigest:set.sourceSnapshotDigest,totalBytes:total,
    references:Object.freeze(rows.map(row=>row.config)),files:Object.freeze(rows)});
}
