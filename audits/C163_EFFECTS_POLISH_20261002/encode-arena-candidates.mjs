import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {encodeArenaPlate,ARENA_WEBP_OPTIONS,sharp,decodeRgba} from '../../port/v2/tools/morph/arena-webp.mjs';
import {validateArenaDelivery} from '../../port/v2/apps/game/src/battle2/arena-delivery.ts';
const sha=b=>createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(fs.readFileSync(p)),write=(p,x)=>fs.writeFileSync(p,x instanceof Uint8Array?x:JSON.stringify(x,null,2)+'\n',{flag:'wx'}),base='audits/C132_ARENAS_20261001';
for(const id of ['marsh-r3','dunesea-r2','freshwater-lake-v3']){
 const dir=base+'/'+id,sourcePath=dir+'/d29/delivery.pending.json',source=json(sourcePath),manifest=structuredClone(source),plates={},runtimes={};
 for(const role of ['far','mid','near']){
  const src=source.plates[role].runtime,png=fs.readFileSync(src);assert.equal(sha(png),source.plates[role].runtimeSha256);
  const a=await encodeArenaPlate(png,role),b=await encodeArenaPlate(png,role);assert.equal(a.receipt.sha256,b.receipt.sha256,'repeat encoded bytes differ');assert.equal(a.decoded.width,1672);assert.equal(a.decoded.height,941);
  const runtime=src.replace(/\.png$/,'.webp');write(runtime,a.webp);plates[role]={source:src,sourceSha256:sha(png),sourceBytes:png.length,webp:runtime,...a.receipt,secondEncodeSha256:b.receipt.sha256};runtimes[role]=a.decoded;
  Object.assign(manifest.plates[role],{runtime,runtimeSha256:a.receipt.sha256,runtimeSource:{path:src,sha256:sha(png)}});assert.equal(sha(fs.readFileSync(src)),sha(png),'PNG changed');
 }
 const recipe=json(source.recipe),acceptance=json(source.acceptance),mechanical=validateArenaDelivery({recipe,plates:runtimes}),registration=validateArenaDelivery({recipe,plates:runtimes,acceptance});assert(mechanical.ok,JSON.stringify(mechanical));assert(!registration.ok);
 const receiptPath=dir+'/d29/webp-receipt.json';manifest.runtimeEncoding='D30 q88 WebP runtime candidate copies; lossless alpha; receipt '+receiptPath;
 const receipt={schema:'cf.c163-arena-webp-candidate/v1',id,qualityAccepted:false,registered:false,nativeProof:false,pngSourceManifest:{path:sourcePath,sha256:sha(fs.readFileSync(sourcePath))},encoder:{path:'port/v2/tools/morph/arena-webp.mjs',sha256:sha(fs.readFileSync('port/v2/tools/morph/arena-webp.mjs')),options:ARENA_WEBP_OPTIONS,sharp:sharp.versions.sharp,webp:sharp.versions.webp},pngBytes:Object.values(plates).reduce((n,p)=>n+p.sourceBytes,0),webpBytes:Object.values(plates).reduce((n,p)=>n+p.bytes,0),plates,mechanical,registration,originalMastersModified:false};
 write(receiptPath,receipt);write(dir+'/d29/delivery.webp.pending.json',manifest);
 const composed=await sharp(fs.readFileSync(plates.far.webp)).composite(['mid','near'].map(role=>({input:fs.readFileSync(plates[role].webp),left:0,top:0}))).png().toBuffer();write(dir+'/arena-composed-webp-review.png',composed);
 console.log(JSON.stringify({id,pngBytes:receipt.pngBytes,webpBytes:receipt.webpBytes,allAlphaIdentical:Object.values(plates).every(p=>p.alphaIdentical),mechanical:mechanical.ok,registered:false}));
}
