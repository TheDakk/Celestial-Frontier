import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createRequire}from'node:module';
import{separateUpperForelegs}from'../C59_REPAIR_20260926/foreleg-side-labels.mjs';
const req=createRequire(path.resolve('port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const root='audits/C59_REPAIR_20260926',prior=JSON.parse(fs.readFileSync('audits/C59_REPAIR_CHECK_20260927/results.json')),rows=[];
const png=async file=>{const{data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});return{labels:Uint8Array.from({length:info.width*info.height},(_,i)=>data[i*4]),width:info.width,height:info.height};};
for(const[id,old]of Object.entries(prior.subjects)){
 const dir=root+'/source-inputs/'+id,record=JSON.parse(fs.readFileSync(dir+'/record.json')),declaration=JSON.parse(fs.readFileSync(dir+'/declaration.json')),src=await png(dir+'/labels.png'),expected=await png(root+'/'+id+'/fit/labels.png'),input={...src,parts:declaration.parts,landmarks:record.landmarks};
 const before=src.labels.slice(),r=separateUpperForelegs(input);assert.deepEqual(r.labels,expected.labels);assert.deepEqual(src.labels,before);assert.equal(r.receipt.changedPixels,old.codexMoved);assert.equal(r.receipt.forelegPixels,old.forelegPixels);assert.equal(separateUpperForelegs({...input,labels:r.labels}).receipt.changedPixels,0);
 const swapped=Object.fromEntries(Object.entries(record.landmarks).map(([k,v])=>[k.includes('Near')?k.replace('Near','Far'):k.includes('Far')?k.replace('Far','Near'):k,v]));assert.throws(()=>separateUpperForelegs({...input,landmarks:swapped}),/exceeds 25%/);assert.deepEqual(src.labels,before);
 rows.push({id,receipt:r.receipt,pixelsDifferent:0,inputChanged:false,idempotent:true,swappedChainRefused:true,independentSwappedShare:old.swappedShareOfForeleg});
}
console.log(JSON.stringify({schema:'cf.foreleg-guard-check/v1',subjects:rows},null,2));
