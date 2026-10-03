import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
import {components} from '../C163_REFERENCE_REPAIR_20261002/diagnose-head.mjs';
import {placeRemainderIslands,MAX_SHARE} from '../G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs';
import {authoredRegionOwners} from '../../port/v2/tools/creature-animation/authored-region-owners.mjs';
const base='audits/C183_ISLAND_AUTHORING_20261002',sibling=path.join(os.homedir(),'Projects/celestial-frontier-anthropic-mac'),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p));
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs'),alias=p=>p.replaceAll(os.homedir(),'~');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'}),rows=[];
for(const id of ['10-grouse','20-hornbill','21-parrot','24-weaverbird']){
 const rel='audits/G1_AUTO_AUTHOR_20260926/auto-g2c211/'+id,nativeRel='audits/G1_AUTO_AUTHOR_20260926/native-g2c211/'+id+'/report.json',nativePath=sibling+'/'+nativeRel,native=json(nativePath),recordPin=native.sources.find(s=>s.path.includes('/'+rel+'/')&&s.path.endsWith('/record.json'));
 assert(recordPin,'exact native-selected record');
 const fit=path.dirname(recordPin.path.replace(/^~/,os.homedir())),record=json(fit+'/record.json'),packet=path.dirname(sibling+'/'+record.source),author=json(packet+'/authoring.json');
 assert.equal(sha(read(packet+'/authoring.json')),record.provenance.authoringSha256,'exact selected authoring');
 assert.equal(sha(read(packet+'/master.png')),record.geometry.cutoutAssetHash,'exact source master');
 for(const file of ['record.json','binding.json']){const pin=native.sources.find(s=>s.path.replace(/^~/,os.homedir())===fit+'/'+file);assert(pin,'native exact input '+file);assert.equal(sha(read(fit+'/'+file)),pin.sha256);}
 const out=base+'/'+id;if(fs.existsSync(out+'/original-diagnosis.json')){const previous=json(out+'/original-diagnosis.json');assert.equal(previous.actualNativeFit,alias(fit));for(const pin of previous.inputs)assert.equal(sha(read(pin.snapshot)),pin.sha256);rows.push(previous);continue;}fs.mkdirSync(out);fs.mkdirSync(out+'/original');fs.mkdirSync(out+'/baseline-fit');const inputs=[];
 function copy(src,dst){const bytes=read(src);if(/\.(json|mjs|txt|log)$/.test(src))assert(!bytes.toString().includes(os.homedir()),'input requires privacy-safe source '+alias(src));fs.writeFileSync(dst,bytes,{flag:'wx'});inputs.push({source:alias(src),snapshot:dst,sha256:sha(bytes),bytes:bytes.length});}
 for(const name of ['master.png','authoring.json','subject-source.json','presence.json'])copy(packet+'/'+name,out+'/original/'+name);
 for(const name of ['record.json','binding.json','pre-split-binding.json','declaration.json'])copy(fit+'/'+name,out+'/baseline-fit/'+name);
 function tree(src,dst){fs.mkdirSync(dst);for(const e of fs.readdirSync(src,{withFileTypes:true})){if(e.isDirectory())tree(src+'/'+e.name,dst+'/'+e.name);else copy(src+'/'+e.name,dst+'/'+e.name);}}
 tree(fit+'/parts',out+'/baseline-fit/parts');copy(nativePath,out+'/original-native.json');
 const nativePng=path.dirname(nativePath)+'/turn3-hit-idle-90.png';if(fs.existsSync(nativePng))copy(nativePng,out+'/original-native.png');
 const ownerInfo=authoredRegionOwners(author.parts,author.remainderPart),own=PNG.sync.read(read(fit+'/parts/ownership.png')),key=PNG.sync.read(read(fit+'/parts/keyed.png'));
 const colors=new Map(ownerInfo.ownerParts.map((_,i)=>{const k=i+1;return[`${(k*83)%200+35},${(k*137)%200+35},${(k*47)%200+35}`,k];}));
 const labels=Uint8Array.from({length:own.width*own.height},(_,i)=>{if(!own.data[i*4+3])return 0;const value=colors.get(`${own.data[i*4]},${own.data[i*4+1]},${own.data[i*4+2]}`);assert(value,'known source owner');return value;});
 const rem=ownerInfo.ownerParts.findIndex(p=>p.id===author.remainderPart)+1,cs=components(labels,own.width,own.height,rem,ownerInfo.ownerParts),total=cs.reduce((n,c)=>n+c.pixels,0);let cap;
 try{const c=placeRemainderIslands(labels,own.width,own.height,rem);cap={status:'PASS',islands:c.islands,moved:c.moved};}catch(error){cap={status:'REFUSED',reason:String(error.message)};}
 const masked=Buffer.alloc(key.data.length);for(const c of cs.slice(1))for(const i of c.indices)key.data.copy(masked,i*4,i*4,i*4+4);
 fs.writeFileSync(out+'/original-remainder-islands.png',PNG.sync.write({width:key.width,height:key.height,data:masked}),{flag:'wx'});
 const row={id,packet:out+'/original',fit:out+'/baseline-fit',actualNativeFit:alias(fit),nativeReport:out+'/original-native.json',nativeSourceBound:true,inputs,unchangedCap:MAX_SHARE,cap,remainderPixels:total,components:cs.map(({indices,...c},i)=>({...c,largest:i===0,share:c.pixels/total})),qualityAccepted:false};
 write(out+'/original-diagnosis.json',row);rows.push(row);console.log(JSON.stringify({id,cap,components:row.components.slice(0,6)}));
}
write(base+'/bird-inputs.json',{schema:'cf.c183-island-inputs/v1',rows,nativeRun:false,source:'Exact C211 native-bound painter fits, not another fallback or stale authoring.'});
