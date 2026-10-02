import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';import{createRequire}from'node:module';
import{cutAuthoredParts}from'../../port/v2/tools/creature-animation/part-masks.mjs';
import{intakeAuthoredPixels}from'../../port/v2/tools/creature-animation/authored-intake.mjs';
import{authoredRegionOwners}from'../../port/v2/tools/creature-animation/authored-region-owners.mjs';
import{placeRemainderIslands,MAX_SHARE}from'../G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs';
import{components}from'./diagnose-head.mjs';
const root=path.resolve(import.meta.dirname,'../..'),require=createRequire(root+'/port/v2/package.json'),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp'),sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p));
const inside=(x,y,polygon)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
function raster(author,rgba,w,h){const owners=authoredRegionOwners(author.parts,author.remainderPart),labels=new Uint8Array(w*h),fallback=author.parts.findIndex(p=>p.id===author.remainderPart);for(let i=0;i<labels.length;i++){if(!rgba[i*4+3])continue;const x=i%w+.5,y=Math.floor(i/w)+.5;let p=author.parts.findIndex(p=>inside(x,y,p.polygonPx));if(p<0)p=fallback;labels[i]=owners.ownerIndex[p]+1;}return{labels,parts:owners.ownerParts};}
export function assertConservation(before,after,remainder,allowed){assert.equal(before.length,after.length);const moved={};for(let i=0;i<before.length;i++){assert.equal(Boolean(before[i]),Boolean(after[i]),'paint deletion/addition');if(before[i]!==after[i]){assert.equal(before[i],remainder,'non-remainder ownership theft');assert(allowed.has(after[i]),'unreviewed recipient');moved[after[i]]=(moved[after[i]]??0)+1;}}return moved;}
const rows=[];assert.equal(MAX_SHARE,.05);
for(const id of ['chough','crow','snowy-owl']){
 const dir=path.join(import.meta.dirname,'other-heads',id),old=json(dir+'/original/authoring.json'),next=json(dir+'/candidate/authoring.json'),record=json(dir+'/original/record.json'),declaration=json(dir+'/original/declaration.json'),master=read(dir+'/original/master.png');
 assert.equal(sha(master),sha(read(dir+'/candidate/master.png')));assert.deepEqual(next.landmarksPx,old.landmarksPx);assert.deepEqual(next.parts.slice(0,old.parts.length-1),old.parts.slice(0,-1));assert.deepEqual(next.parts.at(-1),old.parts.at(-1));
 const{data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true}),keyed=intakeAuthoredPixels(new Uint8ClampedArray(data),info.width,info.height),cut=await cutAuthoredParts(record,master,keyed.rgba,declaration),after=raster(next,keyed.rgba,info.width,info.height),replay=raster(next,keyed.rgba,info.width,info.height);
 assert.deepEqual(after.parts,cut.parts.map(({id,joint,layer})=>({id,joint,layer})),'original owner inventory/order');assert.deepEqual(after.labels,replay.labels,'deterministic polygon replay');
 const remainder=cut.parts.findIndex(p=>p.id===old.remainderPart)+1,allowed=new Set(cut.parts.map((p,i)=>['head','neck1','beak','tailFan'].includes(p.joint)?i+1:null).filter(Boolean));
 const moved=assertConservation(cut.labels,after.labels,remainder,allowed),labelImage=await sharp(dir+'/fit01/labels.png').ensureAlpha().raw().toBuffer();
 for(let i=0;i<after.labels.length;i++)assert.equal(after.labels[i],labelImage[i*4],'compiled label equals independent polygon replay');
 const partsKeyed=await sharp(dir+'/fit01/parts/keyed.png').ensureAlpha().raw().toBuffer();assert.deepEqual(partsKeyed,Buffer.from(keyed.rgba),'compiled keyed source unchanged');
 assert.throws(()=>placeRemainderIslands(cut.labels,info.width,info.height,remainder),/> 5%/,'original cap refusal retained');
 const cap=placeRemainderIslands(after.labels,info.width,info.height,remainder),cs=components(after.labels,info.width,info.height,remainder,after.parts);
 const non=after.labels.findIndex((v,i)=>v&&cut.labels[i]!==remainder),bad=Uint8Array.from(after.labels);bad[non]=remainder;assert.throws(()=>assertConservation(cut.labels,bad,remainder,allowed),/non-remainder ownership theft/);
 const deleted=Uint8Array.from(after.labels);deleted[non]=0;assert.throws(()=>assertConservation(cut.labels,deleted,remainder,allowed),/paint deletion/);
 const row={id,masterSha256:sha(master),originalAuthoringSha256:sha(read(dir+'/original/authoring.json')),candidateAuthoringSha256:sha(read(dir+'/candidate/authoring.json')),sourceRgbaChanges:0,paintPixelsRemoved:0,paintPixelsAdded:0,priorNonRemainderOwnersChanged:0,movedPixels:Object.entries(moved).map(([k,n])=>({to:after.parts[Number(k)-1].id,joint:after.parts[Number(k)-1].joint,pixels:n})),deterministicReplay:true,compiledLabelsEqual:true,compiledKeyedSourceEqual:true,unchangedCap:MAX_SHARE,remainingCapOutcome:'PASS',remainingMinorIslands:cap.islands,remainingRemainderComponents:cs.map(({indices,...c})=>c),controls:['original cap refusal reproduced','remove correction restores refusal','non-remainder theft refused','paint deletion refused','independent label replay equals compiled label','exact keyed RGBA equality'],qualityAccepted:false,nativeRun:false};
 fs.writeFileSync(dir+'/ownership-proof.json',JSON.stringify(row,null,2)+'\n',{flag:'wx'});rows.push(row);console.log(JSON.stringify({id,moved:row.movedPixels,cap:'PASS',controls:row.controls.length}));
}
fs.writeFileSync(path.join(import.meta.dirname,'other-heads-ownership-proof.json'),JSON.stringify({schema:'cf.c163-authoring-ownership-proof/v1',rows,qualityAccepted:false},null,2)+'\n',{flag:'wx'});
