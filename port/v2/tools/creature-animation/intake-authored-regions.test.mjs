import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import{createRequire}from'node:module';import{spawnSync}from'node:child_process';import{test}from'node:test';import assert from'node:assert/strict';
import{intakeAuthoredPixels}from'./authored-intake.mjs';import{cutAuthoredParts}from'./part-masks.mjs';import{authoredRegionOwners}from'./authored-region-owners.mjs';import{hashBytes,hashJSON}from'./quadruped-template.mjs';
const root=fileURLToPath(new URL('../../../../',import.meta.url)),req=createRequire(import.meta.url),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),read=p=>JSON.parse(fs.readFileSync(p));
function run(packet,out){const r=spawnSync(process.execPath,[fileURLToPath(new URL('intake-authored.mjs',import.meta.url)),packet,out],{cwd:root,encoding:'utf8',timeout:120000});assert.equal(r.status,0,r.stdout+r.stderr);return read(out+'/declaration.json');}
test('opaque same-joint intake preserves every priority owner and exact keyed pixel',async()=>{
 const scratch=fs.mkdtempSync(path.join(root,'audits/.c94-keyed-control-')),packet=path.join(root,'audits/KEYED_REGION_C94_20260927/aphid-packet');
 try{
 const out=scratch+'/fit',d=run(packet,out),author=read(packet+'/authoring.json'),bytes=fs.readFileSync(packet+'/master.png'),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const keyed=intakeAuthoredPixels(new Uint8ClampedArray(data),info.width,info.height),record=read(out+'/record.json'),parts=author.parts.map(p=>({id:p.id,joint:p.joint,layer:p.layer,polygon:p.polygonPx.map(([x,y])=>[x/info.width,y/info.height])})),owners=authoredRegionOwners(parts,author.remainderPart);
 assert(owners.merged);assert.equal(d.schema,'cf.keyed-part-intake/v1');assert.equal(d.keyedRgbaSha256,await hashBytes(keyed.rgba));assert.equal(d.cutoutSha256,await hashBytes(bytes));
 const body={schema:'cf.authored-part-masks/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,parts,remainderPart:author.remainderPart},prior=await cutAuthoredParts(record,bytes,keyed.rgba,{...body,declarationHash:await hashJSON(body)});
 const labels=await sharp(out+'/labels.png').ensureAlpha().raw().toBuffer();for(let i=0;i<prior.labels.length;i++)assert.equal(labels[i*4],prior.labels[i]?owners.ownerIndex[prior.labels[i]-1]+1:0,'priority owner at pixel '+i);
 assert.deepEqual(await sharp(out+'/parts/keyed.png').ensureAlpha().raw().toBuffer(),Buffer.from(keyed.rgba));assert.deepEqual(fs.readFileSync(packet+'/master.png'),bytes);
 const receipt=read(out+'/parts/receipt.json');assert.equal(receipt.atlasDifferentChannels,0);assert.equal(receipt.restDifferentChannels,0);assert.equal(receipt.masterUnchanged,true);
 }finally{fs.rmSync(scratch,{recursive:true});}
});
test('native-alpha Ant retains exact historical labels and part-owner inventory',()=>{
 const scratch=fs.mkdtempSync(path.join(root,'audits/.c94-native-control-')),packet=path.join(root,'audits/G2_REFERENCES_C62_20260927/08-ant');
 try{const d=run(packet,scratch+'/fit'),old=read(packet+'/fit-01/declaration.json');assert.equal(d.schema,'cf.painter-part-intake/v1');assert.equal(d.keyedRgbaSha256,undefined);assert.deepEqual(d.parts,old.parts);assert.deepEqual(fs.readFileSync(scratch+'/fit/labels.png'),fs.readFileSync(packet+'/fit-01/labels.png'));const r=read(scratch+'/fit/label-authoring-receipt.json');assert.equal(r.rgbaChangedChannels,0);assert.equal(r.intake.mode,'delivered alpha preserved byte-for-byte');}finally{fs.rmSync(scratch,{recursive:true});}
});
