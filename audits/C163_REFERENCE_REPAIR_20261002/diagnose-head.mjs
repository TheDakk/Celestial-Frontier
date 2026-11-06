import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {cutAuthoredParts} from '../../port/v2/tools/creature-animation/part-masks.mjs';
import {intakeAuthoredPixels} from '../../port/v2/tools/creature-animation/authored-intake.mjs';
import {placeRemainderIslands,MAX_SHARE} from '../G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs';
const root=path.resolve(import.meta.dirname,'../..'),sibling=path.join(os.homedir(),'Projects/celestial-frontier-anthropic-mac');
const require=createRequire(root+'/port/v2/package.json'),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex'),alias=p=>p.replace(os.homedir(),'~'),read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
export function components(labels,w,h,remainder,parts){
 const seen=new Uint8Array(labels.length),out=[];
 for(let i=0;i<labels.length;i++){
  if(labels[i]!==remainder||seen[i])continue;
  const stack=[i],pixels=[],border=new Map();seen[i]=1;let x0=w,y0=h,x1=0,y1=0;
  while(stack.length){const k=stack.pop(),x=k%w,y=Math.floor(k/w);pixels.push(k);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const n=Y*w+X;if(labels[n]===remainder&&!seen[n]){seen[n]=1;stack.push(n);}else if(Math.abs(dx)+Math.abs(dy)===1&&labels[n]&&labels[n]!==remainder)border.set(parts[labels[n]-1].id,(border.get(parts[labels[n]-1].id)??0)+1);}
  }
  out.push({pixels:pixels.length,bounds:[x0,y0,x1,y1],border:Object.fromEntries([...border].sort((a,b)=>b[1]-a[1])),indices:pixels});
 }
 return out.sort((a,b)=>b.pixels-a.pixels);
}
if(process.argv[1]===import.meta.filename){
 const summaries=[];
 for(const id of ['16-lark','18-hawk']){
  const reportRel=`audits/G1_AUTO_AUTHOR_20260926/native-g2c151/${id}/report.json`,native=json(path.join(root,reportRel));
  const sourceRows=native.sources.filter(s=>s.path.includes('/auto-g2c151/'));
  for(const s of sourceRows)assert.equal(sha(read(s.path.replace(/^~/,os.homedir()))),s.sha256,'exact native input '+s.path);
  const recordInput=sourceRows.find(s=>s.path.endsWith('/record.json')),fit=path.dirname(recordInput.path.replace(/^~/,os.homedir())),packet=path.join(fit,'../packet');
  assert(fit.startsWith(sibling+'/audits/'));
  const out=path.join(import.meta.dirname,id,'original');assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
  const bound=[];
  for(const n of ['master.png','authoring.json','subject-source.json','presence.json']){const b=read(path.join(packet,n));fs.writeFileSync(path.join(out,n),b,{flag:'wx'});bound.push({source:alias(path.join(packet,n)),snapshot:path.relative(root,path.join(out,n)),sha256:sha(b)});}
  for(const n of ['record.json','declaration.json']){const b=read(path.join(fit,n));fs.writeFileSync(path.join(out,n),b,{flag:'wx'});bound.push({source:alias(path.join(fit,n)),snapshot:path.relative(root,path.join(out,n)),sha256:sha(b)});}
  const record=json(path.join(fit,'record.json')),declaration=json(path.join(fit,'declaration.json')),master=read(path.join(packet,'master.png'));
  assert.equal(declaration.schema,'cf.authored-part-masks/v1');
  const {data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true}),keyed=intakeAuthoredPixels(new Uint8ClampedArray(data),info.width,info.height);
  const cut=await cutAuthoredParts(record,master,keyed.rgba,declaration),remainder=cut.parts.findIndex(p=>p.id===declaration.remainderPart)+1;
  const own=await sharp(path.join(fit,'parts/ownership.png')).ensureAlpha().raw().toBuffer();
  for(let i=0;i<cut.labels.length;i++){const k=cut.labels[i];if(k)assert.deepEqual([...own.subarray(i*4,i*4+3)],[(k*83)%200+35,(k*137)%200+35,(k*47)%200+35]);else assert.equal(own[i*4+3],0);}
  let cap;try{const p=placeRemainderIslands(cut.labels,info.width,info.height,remainder);cap={status:'PASS',moved:p.moved,islands:p.islands};}catch(e){cap={status:'REFUSED',reason:e.message};}
  const cs=components(cut.labels,info.width,info.height,remainder,cut.parts),sum=cs.reduce((a,c)=>a+c.pixels,0);
  const row={id,nativeReport:{path:reportRel,sha256:sha(read(path.join(root,reportRel)))},actualNativeFit:alias(fit),exactNativeInputsVerified:sourceRows,recomputedOwnershipEqual:true,inputs:bound,unchangedCap:MAX_SHARE,capOutcome:cap,remainderPixels:sum,components:cs.map(({indices,...c},i)=>({...c,largest:i===0,share:c.pixels/sum})),sourceRgbaChanged:false};
  write(path.join(out,'diagnosis.json'),row);summaries.push(row);
  console.log(JSON.stringify({id,fit:alias(fit),cap,components:row.components}));
 }
 write(path.join(import.meta.dirname,'head-diagnosis.json'),{schema:'cf.c163-head-authoring-diagnosis/v1',summaries,qualityAccepted:false});
}
