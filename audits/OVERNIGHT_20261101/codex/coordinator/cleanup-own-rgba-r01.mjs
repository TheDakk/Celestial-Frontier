import fs from'node:fs';import path from'node:path';import{createHash}from'node:crypto';import{createRequire}from'node:module';import{execFileSync}from'node:child_process';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(x,m)=>{if(!x)throw Error(m);};
const base='audits/OVERNIGHT_20261101/codex/coordinator',run=base+'/finishes/050-snowshoe-hare-owner-r02',prepared=run+'/finished/prepared',prefix='o1-050-snowshoe-hare-owner-r02';
const ready=JSON.parse(fs.readFileSync(base+'/ready/050-snowshoe-hare-owner-r02/manifest.json'));
const check=()=>{for(const p of ready.rows)need(sha(fs.readFileSync(p.path))===p.sha256,'protected ready artifact '+p.path);};check();
const req=createRequire(path.resolve('port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),rows=[];
for(const [rawName,pngName]of[[prefix+'-master.rgba',prefix+'-masterPng.png'],[prefix+'-labels.rgba',prefix+'-labels.png']]){
 const raw=prepared+'/'+rawName,png=prepared+'/'+pngName;need(!fs.lstatSync(raw).isSymbolicLink()&&!fs.lstatSync(png).isSymbolicLink(),'plain own scratch files');
 need(!execFileSync('git',['ls-files','--',raw],{encoding:'utf8'}).trim(),'scratch must be untracked');need(!ready.rows.some(p=>p.path===raw),'no pinned ready artifact deletion');
 const bytes=fs.readFileSync(raw),decoded=await sharp(png).ensureAlpha().raw().toBuffer();need(sha(bytes)===sha(decoded),'byte-identical regeneration from retained PNG');rows.push({path:raw,bytes:bytes.length,sha256:sha(bytes),regenerateFrom:{path:png,sha256:sha(fs.readFileSync(png))}});
}
const out=base+'/cleanup-own-rgba-r01.json';need(!fs.existsSync(out),'fresh cleanup receipt');fs.writeFileSync(out,JSON.stringify({status:'VERIFIED_BEFORE_DELETION',rows,protectedReadyPins:ready.rows.length},null,2)+'\n',{flag:'wx'});
for(const row of rows)fs.unlinkSync(row.path);check();fs.writeFileSync(out,JSON.stringify({status:'PASS',rows,bytesRemoved:rows.reduce((n,x)=>n+x.bytes,0),protectedReadyPins:ready.rows.length,protectedPinsUnchanged:true,scope:'Only two regenerable own O1 raw buffers; retained exact decoded PNGs, all originals/finished images/receipts/native evidence untouched'},null,2)+'\n');console.log(fs.readFileSync(out,'utf8'));
