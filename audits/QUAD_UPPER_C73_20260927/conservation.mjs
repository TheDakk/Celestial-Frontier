import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createRequire}from'node:module';import{createHash}from'node:crypto';
const req=createRequire(path.resolve('port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),sha=b=>createHash('sha256').update(b).digest('hex'),base=import.meta.dirname,rows=[];
for(const[name,id]of[['marmot','11-marmot'],['cattle','13-cattle']]){
 const source=base+'/'+id+'/source-fit',fit=base+'/'+name+'-upper-01/fit',before=fs.readFileSync(source+'/record.json'),after=fs.readFileSync(fit+'/record.json');assert.deepEqual(JSON.parse(before),JSON.parse(after));
 const r=JSON.parse(before),d=JSON.parse(fs.readFileSync(source+'/declaration.json')),read=async p=>(await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true})).data,a=await read(source+'/labels.png'),b=await read(fit+'/labels.png'),rgba=await read(path.resolve(r.source));let changed=0;
 for(let i=0;i<a.length;i+=4){if(a[i]===b[i])continue;changed++;assert.ok(['chest','neck'].includes(d.parts[a[i]-1]?.joint),'foreign owner changed');assert.ok(rgba[i+3]>0,'transparent pixel changed');const y=(Math.floor(i/4/r.geometry.width)+.5)/r.geometry.height;assert.ok(y<r.landmarks.chest[1],'lower body changed');}
 assert.ok(changed>0);rows.push({name,changed,recordRecipeUnchanged:true,masterSha256:sha(fs.readFileSync(path.resolve(r.source))),nonChestNeckChanges:0,transparentChanges:0,lowerBodyChanges:0});
 // Counterexample: the same invariant refuses one falsely edited head pixel.
 const head=d.parts.findIndex(p=>p.joint==='head')+1,at=Array.from({length:a.length/4},(_,i)=>i*4).find(i=>a[i]===head&&rgba[i+3]);assert.notEqual(at,undefined);assert.throws(()=>assert.ok(['chest','neck'].includes(d.parts[a[at]-1]?.joint)));
}
fs.writeFileSync(base+'/conservation.json',JSON.stringify({rows,foreignHeadMutation:'REFUSED'},null,2)+'\n',{flag:'wx'});console.log(rows);
