import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';
import {cutKeyedParts} from './keyed-part-labels.mjs';import {cutAuthoredParts} from './part-masks.mjs';
import {buildAuthoredParts} from './build-authored-parts.mjs';import {intakeAuthoredPixels} from './authored-intake.mjs';import {hashBytes,hashJSON} from './quadruped-template.mjs';
const root=new URL('../../../../',import.meta.url),require=createRequire(import.meta.url),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const fit=new URL('audits/FISH_SEAMS_C78_20260927/inputs/03-sculpin/',root),record=JSON.parse(fs.readFileSync(new URL('record.json',fit))),original=JSON.parse(fs.readFileSync(new URL('declaration.json',fit))),masterFile=new URL('audits/G2_C72_20260927/03-sculpin/master.png',root),bytes=fs.readFileSync(masterFile);
const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),keyed=intakeAuthoredPixels(new Uint8ClampedArray(data),info.width,info.height),prior=await cutAuthoredParts(record,bytes,keyed.rgba,original);
const seal=async b=>({...structuredClone(b),declarationHash:await hashJSON(b)}),base={schema:'cf.keyed-part-intake/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,keyedRgbaSha256:await hashBytes(keyed.rgba),parts:original.parts.map(({id,joint,layer})=>({id,joint,layer}))};
test('keyed labels reproduce every original Sculpin part without changing any pixel or label',async()=>{
 const before=keyed.rgba.slice(),labels=prior.labels.slice(),r=await cutKeyedParts(record,bytes,keyed.rgba,labels,await seal(base));
 assert.deepEqual(r.labels,prior.labels);assert.deepEqual(keyed.rgba,before);assert.deepEqual(labels,prior.labels);
 for(let i=0;i<r.parts.length;i++){assert.deepEqual(r.parts[i].box,prior.parts[i].box);assert.deepEqual(r.parts[i].rgba,prior.parts[i].rgba);}
 assert.match(r.receipt.owner,/not painter draw stages/);assert.equal(r.receipt.restDifferentChannels,0);
});
test('a changed keyed colour refuses even though original PNG and record still match',async()=>{
 const changed=keyed.rgba.slice(),i=prior.labels.findIndex(v=>v>0);changed[i*4]^=1;
 await assert.rejects(cutKeyedParts(record,bytes,changed,prior.labels,await seal(base)),/changed keyed RGBA/);
});
test('keyed declaration, original identity, missing pixels and background ownership fail closed',async()=>{
 const d=await seal(base);d.parts[0].layer='far';await assert.rejects(cutKeyedParts(record,bytes,keyed.rgba,prior.labels,d),/corrupted/);
 await assert.rejects(cutKeyedParts(record,new Uint8Array([0]),keyed.rgba,prior.labels,await seal(base)),/mismatched cut-out/);
 const lost=prior.labels.slice();lost[lost.findIndex(v=>v>0)]=0;await assert.rejects(cutKeyedParts(record,bytes,keyed.rgba,lost,await seal(base)),/missing/);
 const background=prior.labels.slice();background[0]=1;await assert.rejects(cutKeyedParts(record,bytes,keyed.rgba,background,await seal(base)),/invisible ownership/);
});
test('file builder keys the unchanged opaque master and verifies the exact label file',async()=>{
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-keyed-label-control-'));
 try{
  const rgba=Buffer.alloc(prior.labels.length*4);for(let i=0;i<prior.labels.length;i++)rgba.set([prior.labels[i],prior.labels[i],prior.labels[i],255],i*4);
  const png=await sharp(rgba,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();fs.writeFileSync(scratch+'/labels.png',png);
  fs.writeFileSync(scratch+'/declaration.json',JSON.stringify(await seal({...base,labelsFile:'labels.png',labelsSha256:await hashBytes(png)})));
  const args={id:'sculpin-keyed-control',recordFile:new URL('record.json',fit),masterFile,declarationFile:scratch+'/declaration.json',output:scratch+'/parts'};
  await buildAuthoredParts(args);const actual=await sharp(scratch+'/parts/keyed.png').ensureAlpha().raw().toBuffer();assert.deepEqual(actual,Buffer.from(keyed.rgba));assert.deepEqual(fs.readFileSync(masterFile),bytes);
  fs.writeFileSync(scratch+'/labels.png',new Uint8Array([0]));await assert.rejects(buildAuthoredParts({...args,output:scratch+'/rejected'}),/label hash mismatch/);
  const native=Uint8Array.from(data);native[3]=0;await sharp(native,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(scratch+'/native.png');
  await assert.rejects(buildAuthoredParts({...args,masterFile:scratch+'/native.png',output:scratch+'/native-rejected'}),/opaque original/);
 }finally{fs.rmSync(scratch,{recursive:true});}
});
