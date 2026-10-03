import fs from'node:fs';import path from'node:path';import os from'node:os';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{createRequire}from'node:module';
import{components}from'./diagnose-head.mjs';import{placeRemainderIslands,MAX_SHARE}from'../G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs';
const root=path.resolve(import.meta.dirname,'../..'),base='audits/C163_REFERENCE_REPAIR_20261002',require=createRequire(root+'/port/v2/package.json'),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),alias=p=>p.replace(os.homedir(),'~'),expand=p=>p.replace(/^~/,os.homedir());
const gallery=json('audits/GENERATED_GALLERY_20260927/gallery-registry.json'),names=['Chough','Crow','Snowy Owl','Hummingbird','Horse','Wild Ass','Wild Pony'],rows=[];
for(const name of names){
 const prior=base+'/other-heads/'+name.toLowerCase().replaceAll(' ','-')+'/original/diagnosis.json';if(fs.existsSync(prior)){rows.push(json(prior));continue;}
 const entry=gallery.filter(e=>e.name===name).at(-1),reportPath=entry.nativeDir+'/report.json',native=json(reportPath),rs=native.sources.filter(s=>s.path.includes('/auto-')&&s.path.endsWith('/record.json'));assert.equal(rs.length,1,'exact native fit '+name);
 const recordSource=rs[0],fit=path.dirname(expand(recordSource.path));if(!fs.existsSync(fit+'/record.json')){rows.push({name,status:'EXACT_NATIVE_INPUT_MISSING',nativeReport:{path:reportPath,sha256:sha(read(reportPath))},actualNativeFit:alias(fit),missing:recordSource.path,expectedRecordSha256:recordSource.sha256,originalHold:entry.note,qualityAccepted:false});console.log(JSON.stringify(rows.at(-1)));continue;}
 const record=json(fit+'/record.json'),declaration=json(fit+'/declaration.json'),binding=json(fit+'/pre-split-binding.json'),remainderId=binding.sourceJoinTopology.remainderPartId;
 const packet=path.join(fit,'../packet'),id=name.toLowerCase().replaceAll(' ','-'),out=base+'/other-heads/'+id+'/original';assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
 const inputs=[];for(const s of native.sources.filter(s=>s.path.startsWith(alias(fit)+'/')||s.path===alias(path.join(packet,'master.png')))){assert.equal(sha(read(expand(s.path))),s.sha256,'native source hash');inputs.push(s);}
 for(const n of ['record.json','declaration.json'])fs.copyFileSync(fit+'/'+n,out+'/'+n,fs.constants.COPYFILE_EXCL);
 for(const n of ['master.png','authoring.json','subject-source.json','presence.json'])fs.copyFileSync(packet+'/'+n,out+'/'+n,fs.constants.COPYFILE_EXCL);
 const{data:own,info}=await sharp(fit+'/parts/ownership.png').ensureAlpha().raw().toBuffer({resolveWithObject:true}),parts=declaration.parts,color=new Map(parts.map((p,i)=>{const k=i+1;return[`${(k*83)%200+35},${(k*137)%200+35},${(k*47)%200+35}`,k];})),labels=new Uint8Array(info.width*info.height);
 for(let i=0;i<labels.length;i++){if(!own[i*4+3])continue;const k=color.get(`${own[i*4]},${own[i*4+1]},${own[i*4+2]}`);assert(k,'exact existing ownership color');labels[i]=k;}
 const remainder=parts.findIndex(p=>p.id===remainderId)+1;assert(remainder);let cap;try{const p=placeRemainderIslands(labels,info.width,info.height,remainder);cap={status:'PASS',moved:p.moved};}catch(e){cap={status:'REFUSED',reason:e.message};}
 const cs=components(labels,info.width,info.height,remainder,parts),total=cs.reduce((a,c)=>a+c.pixels,0);
 const row={name,id,originalHold:entry.note,nativeReport:{path:reportPath,sha256:sha(read(reportPath))},actualNativeFit:alias(fit),actualDeclarationSchema:declaration.schema,inputs,remainderId,remainderPixels:total,cap,unchangedCap:MAX_SHARE,components:cs.map(({indices,...c},i)=>({...c,largest:i===0,share:c.pixels/total})),qualityAccepted:false};
 fs.writeFileSync(out+'/diagnosis.json',JSON.stringify(row,null,2)+'\n',{flag:'wx'});rows.push(row);console.log(JSON.stringify({name,fit:alias(fit),schema:declaration.schema,cap,components:row.components.filter(c=>c.pixels>40)}));
}
fs.writeFileSync(base+'/other-heads/diagnosis.json',JSON.stringify({schema:'cf.c163-selected-native-head-diagnosis/v1',rows,qualityAccepted:false},null,2)+'\n',{flag:'wx'});
