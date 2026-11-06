import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{createRequire}from'node:module';import{separateUpperForelegs}from'./foreleg-side-labels.mjs';
const req=createRequire(new URL('../../port/v2/package.json',import.meta.url)),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),sha=b=>createHash('sha256').update(b).digest('hex'),rows=[];
const decode=async p=>{const r=await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {labels:Uint8Array.from({length:r.info.width*r.info.height},(_,i)=>r.data[i*4]),width:r.info.width,height:r.info.height};};
for(const id of fs.readdirSync(import.meta.dirname).filter(n=>n.endsWith('-side')&&fs.existsSync(path.join(import.meta.dirname,n,'receipt.json')))){
 const dir=path.join(import.meta.dirname,id),receipt=JSON.parse(fs.readFileSync(dir+'/receipt.json')),src=receipt.sourceFit,fit=dir+'/fit',before=await decode(src+'/labels.png'),after=await decode(fit+'/labels.png'),record=JSON.parse(fs.readFileSync(fit+'/record.json')),decl=JSON.parse(fs.readFileSync(fit+'/declaration.json')),parts=decl.parts;
 assert.deepEqual(fs.readFileSync(src+'/record.json'),fs.readFileSync(fit+'/record.json'));
 const rerun=separateUpperForelegs({...before,parts,landmarks:record.landmarks});assert.deepEqual(rerun.labels,after.labels);
 let changed=0;for(let i=0;i<before.labels.length;i++){
  const a=before.labels[i],b=after.labels[i];assert.equal(a===0,b===0);
  if(a!==b){changed++;const x=parts[a-1].joint,y=parts[b-1].joint;assert(x.startsWith('fore')&&y.startsWith('fore'));assert.notEqual(x.includes('Near'),y.includes('Near'));}
 }
 const master=fs.readFileSync(record.source);assert.equal(sha(master),record.geometry.cutoutAssetHash);assert.equal(changed,receipt.gap.changedPixels);
 const st=JSON.parse(fs.readFileSync(dir+'-static.json')),native=JSON.parse(fs.readFileSync(dir+'-native/report.json'));
 assert.equal(st.status,'PASS_STATIC');assert.equal(st.sourcePixelRest.changedVisibleRgbaChannels,0);assert.equal(native.status,'DIAGNOSTIC_PASS');assert.deepEqual(native.capture.refusalsAtEnd,{left:0,right:0});
 rows.push({id,changedPixels:changed,recipeUnchanged:true,sourceSha256:sha(master),labelsSha256:sha(fs.readFileSync(fit+'/labels.png')),exactReproduction:true,onlyOppositeForelegOwnersChanged:true,static:st.status,native:native.status,frames:native.capture.frames,cpuP95Ms:native.capture.cpuP95Ms});
}
assert.equal(rows.length,7);fs.writeFileSync(new URL('./candidate-checks.json',import.meta.url),JSON.stringify(rows,null,2)+'\n');console.log(rows.map(x=>({id:x.id,changedPixels:x.changedPixels,frames:x.frames,cpuP95Ms:x.cpuP95Ms})));
