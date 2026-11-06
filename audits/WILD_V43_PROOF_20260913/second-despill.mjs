import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {despillThenErode} from '../../tools/local-image-generation/edge-despill.mjs';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..');
const req=createRequire(path.join(root,'port/v2/package.json'));
const sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=n=>fs.readFileSync(path.join(out,n));
const write=(n,b)=>fs.writeFileSync(path.join(out,n),b,{flag:'wx'});
const prior=JSON.parse(read('intake.json')),anchors=JSON.parse(read('wild-anchors.json')),fallback=JSON.parse(read('wild-anchors-master-fallback.json'));
const bounds=(raw,w,h)=>{let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(raw[(y*w+x)*4+3]>0){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return{x:x0,y:y0,width:x1-x0+1,height:y1-y0+1};};
for(const d of ['second-pass/keyed','second-pass/registered'])fs.mkdirSync(path.join(out,d),{recursive:true});
const rows=[];
for(const phase of ['travel','impact']){
 const previous=prior.images.find(r=>r.phase===phase),input=read(previous.keyedImage);
 assert.equal(sha(input),previous.keyedSha256);assert.equal(sha(read(previous.image)),previous.imageSha256);
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const corrected=despillThenErode(new Uint8ClampedArray(data),info.width,info.height,8);
 const keyed=await sharp(Buffer.from(corrected.rgba),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
 const keyedImage=`second-pass/keyed/wild-${phase}.png`;write(keyedImage,keyed);
 const {uniformScale,left,top}=previous.registration,scaled=Math.round(info.width*uniformScale);
 const small=await sharp(keyed).resize(scaled,scaled,{kernel:'lanczos3'}).png().toBuffer();
 const registered=await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite([{input:small,left,top}]).png().toBuffer();
 const registeredImage=`second-pass/registered/wild-${phase}.png`;write(registeredImage,registered);
 const rgba=await sharp(registered).ensureAlpha().raw().toBuffer(),box=bounds(rgba,1024,1024);
 const item=anchors.phases.find(p=>p.phase===phase);Object.assign(item,{image:registeredImage,keyedImage:registeredImage,imageSha256:sha(registered),alphaBoundsPixels:box});
 const master=fallback.phases.find(p=>p.phase===phase);Object.assign(master,{keyedImage,keyedImageSha256:sha(keyed),alphaBoundsPixels:bounds(corrected.rgba,info.width,info.height)});
 rows.push({phase,inputImage:previous.keyedImage,inputSha256:sha(input),keyedImage,keyedSha256:sha(keyed),registeredImage,imageSha256:sha(registered),registeredBounds:box,registration:previous.registration,pass:corrected.receipt,masterSha256:previous.imageSha256,masterUnchanged:sha(read(previous.image))===previous.imageSha256,targetUnder40:corrected.receipt.unresolvedEdgePixels<40});
}
write('second-pass/receipt.json',JSON.stringify({sourceCommit:'56509c0c',generationCalls:0,launchUnchanged:true,midNewPasses:0,images:rows,nickVisualAcceptancePending:true},null,2)+'\n');
// Preserve the accepted parser inputs as provenance, then replace only derived fields.
for(const [name,value] of [['wild-anchors.json',anchors],['wild-anchors-master-fallback.json',fallback]]){
 write('second-pass/'+name+'.before',read(name));
 const temp=path.join(out,name+'.tmp');fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,path.join(out,name));
}
const panels=[];
for(let i=0;i<anchors.phases.length;i++){
 const phase=anchors.phases[i];panels.push({input:await sharp(read(phase.image)).resize(512,512).flatten({background:'#24282b'}).png().toBuffer(),left:i*512,top:40});
}
panels.push({input:Buffer.from('<svg width="1536" height="40"><rect width="1536" height="40" fill="#24282b"/>'+anchors.phases.map((p,i)=>`<text x="${i*512+20}" y="27" font-family="sans-serif" font-size="20" fill="white">${p.phase.toUpperCase()}${i?' — second intake':' — unchanged'}</text>`).join('')+'</svg>'),left:0,top:0});
write('second-pass/wild-phases-review.png',await sharp({create:{width:1536,height:552,channels:4,background:'#24282b'}}).composite(panels).png().toBuffer());
// Native 200% crops at the exact review's reported contaminated geometry.
for(const [phase,box] of [['travel',{left:560,top:420,width:340,height:220}],['impact',{left:820,top:380,width:340,height:220}]]){
 const row=rows.find(r=>r.phase===phase);const comps=[];
 for(const [i,file] of [row.inputImage,row.keyedImage].entries())comps.push({input:await sharp(read(file)).extract(box).resize(680,440,{kernel:'nearest'}).flatten({background:'#24282b'}).png().toBuffer(),left:i*680,top:30});
 comps.push({input:Buffer.from('<svg width="1360" height="30"><rect width="1360" height="30" fill="#24282b"/><text x="10" y="22" font-size="18" fill="white">BEFORE · 200%</text><text x="690" y="22" font-size="18" fill="white">AFTER · 200%</text></svg>'),left:0,top:0});
 write(`second-pass/${phase}-fringe-200.png`,await sharp({create:{width:1360,height:470,channels:4,background:'#24282b'}}).composite(comps).png().toBuffer());
}
console.log(JSON.stringify(rows.map(r=>({phase:r.phase,targets:r.pass.targets,corrected:r.pass.corrected.length,unresolved:r.pass.unresolvedEdgePixels,eroded:r.pass.erodedPixels,target:r.targetUnder40})),null,2));
assert.ok(rows.every(r=>r.targetUnder40),'Single pass missed the under-40 target; do not retry automatically');
