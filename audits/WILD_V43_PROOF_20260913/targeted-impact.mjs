import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {selectFringeTargets,fringeColourClass} from '../../tools/local-image-generation/fringe-targets.mjs';
import {despillUnresolvedEdges} from '../../tools/local-image-generation/edge-despill.mjs';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..'),req=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex'),read=n=>fs.readFileSync(path.join(out,n));
const destination=path.join(out,'targeted-pass');assert.ok(!fs.existsSync(destination),'One pass only: new output required');fs.mkdirSync(destination);for(const n of ['keyed','registered'])fs.mkdirSync(path.join(destination,n));
const write=(n,b)=>fs.writeFileSync(path.join(destination,n),b,{flag:'wx'}),json=(n,b)=>write(n,JSON.stringify(b,null,2)+'\n');
const previous=JSON.parse(read('second-pass/receipt.json')),anchors=JSON.parse(read('wild-anchors.json')),fallback=JSON.parse(read('wild-anchors-master-fallback.json'));
const rectangles=[{x0:930,x1:1000,y0:845,y1:925},{x0:1040,x1:1095,y0:350,y1:440}],sheenRects=[{x0:705,x1:760,y0:318,y1:340}];
const diagnostics=[];let impact;
for(const phase of ['travel','impact']){
 const prior=previous.images.find(r=>r.phase===phase),input=read(prior.keyedImage);assert.equal(sha(input),prior.keyedSha256);
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,1254);assert.equal(info.height,1254);
 const selection=selectFringeTargets(data,1254,1254,{rectangles:phase==='impact'?rectangles:[],sheenRects:phase==='impact'?sheenRects:[]});
 diagnostics.push({phase,unresolvedDiagnosticTotal:Object.values(selection.counts).reduce((a,b)=>a+b,0),counts:selection.counts,indices:selection.split,reviewerVisualPinkEstimate:phase==='travel'?44:31});
 if(phase==='impact')impact={prior,input,data,selection};
}
const {prior,input,data,selection}=impact;
// Explicit-target call, once. Travel is already accepted; its optional correction is skipped.
const corrected=despillUnresolvedEdges(new Uint8ClampedArray(data),1254,1254,8,selection.targets),allowed=new Set(selection.targets);
let changedRgb=0,alphaChanges=0,protectedChanges=0,outsideChanges=0;
for(let i=0;i<1254*1254;i++){
 const p=i*4,changed=[0,1,2].some(c=>data[p+c]!==corrected.rgba[p+c]);if(changed){changedRgb++;if(!allowed.has(i))outsideChanges++;const kind=fringeColourClass(data[p],data[p+1],data[p+2],i%1254,Math.floor(i/1254),sheenRects);if(kind!=='pinkBand')protectedChanges++;}
 if(data[p+3]!==corrected.rgba[p+3])alphaChanges++;
}
assert.equal(alphaChanges,0);assert.equal(protectedChanges,0);assert.equal(outsideChanges,0);
const keyed=await sharp(Buffer.from(corrected.rgba),{raw:{width:1254,height:1254,channels:4}}).png().toBuffer();write('keyed/wild-impact.png',keyed);
const {uniformScale,left,top}=prior.registration,scaled=Math.round(1254*uniformScale);
const small=await sharp(keyed).resize(scaled,scaled,{kernel:'lanczos3'}).png().toBuffer();
const registered=await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite([{input:small,left,top}]).png().toBuffer();write('registered/wild-impact.png',registered);
const registeredRaw=await sharp(registered).ensureAlpha().raw().toBuffer(),oldRegisteredRaw=await sharp(read(prior.registeredImage)).ensureAlpha().raw().toBuffer();for(let i=3;i<registeredRaw.length;i+=4)assert.equal(registeredRaw[i],oldRegisteredRaw[i]);
const registeredPath='targeted-pass/registered/wild-impact.png',keyedPath='targeted-pass/keyed/wild-impact.png';
const oldAnchor=structuredClone(anchors.phases.find(p=>p.phase==='impact'));Object.assign(anchors.phases.find(p=>p.phase==='impact'),{image:registeredPath,keyedImage:registeredPath,imageSha256:sha(registered)});
Object.assign(fallback.phases.find(p=>p.phase==='impact'),{keyedImage:keyedPath,keyedImageSha256:sha(keyed)});
const after=selectFringeTargets(corrected.rgba,1254,1254,{rectangles,sheenRects});
const receipt={sourceCommit:'6b574220',generationCalls:0,passes:1,mode:'explicit targets; RGB only',radius:8,erosionPixels:0,rectangles,sheenRects,
 classification:{pinkBand:'Historical edge diagnostic min(R,B)-G>8 after protecting the following categories; heuristic count, not visual ground truth.',excludedSheen:'All pixels in the supplied sheen rectangle.',excludedPale:'min(R,G,B)>=120 and HSV saturation<=0.20.',excludedUmber:'max(R,G,B)<=160, R>1.5*B and R>G.',notAnAcceptanceThreshold:true},
 diagnostics,inputImage:prior.keyedImage,inputSha256:sha(input),keyedImage:keyedPath,keyedSha256:sha(keyed),registeredImage:registeredPath,imageSha256:sha(registered),registration:prior.registration,
 registrationUnchanged:JSON.stringify(prior.registration)===JSON.stringify(previous.images.find(r=>r.phase==='impact').registration),perRectangleTargets:selection.perRectangle,pass:corrected.receipt,
 afterCounts:after.counts,remainingTargets:after.targets,changedRgbPixels:changedRgb,alphaChanges,protectedChanges,outsideChanges,registeredAlphaUnchanged:true,alphaBoundsPixels:oldAnchor.alphaBoundsPixels,
 travelUnchanged:true,travelOptionalHolesFilled:0,launchUnchanged:true,midNewPasses:0,masterSha256:prior.masterSha256,masterUnchanged:sha(read('wild-impact.png'))===prior.masterSha256,nickVisualAcceptancePending:true};
json('receipt.json',receipt);
for(const [n,v]of [['wild-anchors.json',anchors],['wild-anchors-master-fallback.json',fallback]]){write(n+'.before',read(n));const temp=path.join(out,n+'.tmp');fs.writeFileSync(temp,JSON.stringify(v,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,path.join(out,n));}
// Current aggregate receipt is separate from immutable first/second-pass records.
const current={...previous,sourceCommit:'6b574220',latestPass:'targeted-pass/receipt.json',images:previous.images.map(r=>r.phase==='impact'?{...r,keyedImage:keyedPath,keyedSha256:sha(keyed),registeredImage:registeredPath,imageSha256:sha(registered),latestColourOnlyPass:'targeted-pass/receipt.json'}:r)};json('registration-receipt.json',current);
for(const [label,b]of rectangles.map((b,i)=>['cluster-'+(i+1),b])){
 const w=b.x1-b.x0+1,h=b.y1-b.y0+1,panels=[];
 for(const [i,bytes]of [input,keyed].entries())panels.push({input:await sharp(bytes).extract({left:b.x0,top:b.y0,width:w,height:h}).resize(w*4,h*4,{kernel:'nearest'}).flatten({background:'#24282b'}).png().toBuffer(),left:i*w*4,top:28});
 panels.push({input:Buffer.from(`<svg width="${w*8}" height="28"><rect width="100%" height="100%" fill="#24282b"/><text x="5" y="20" fill="white">BEFORE ·400%</text><text x="${w*4+5}" y="20" fill="white">AFTER ·400%</text></svg>`),left:0,top:0});write(label+'-400.png',await sharp({create:{width:w*8,height:h*4+28,channels:4,background:'#24282b'}}).composite(panels).png().toBuffer());
}
const panels=[];for(const [i,p]of anchors.phases.entries())panels.push({input:await sharp(read(p.image)).resize(512,512).flatten({background:'#24282b'}).png().toBuffer(),left:i*512,top:40});
panels.push({input:Buffer.from('<svg width="1536" height="40"><rect width="100%" height="100%" fill="#24282b"/>'+['LAUNCH · unchanged','TRAVEL · unchanged','IMPACT · targeted RGB intake'].map((s,i)=>`<text x="${i*512+18}" y="27" font-size="19" font-family="sans-serif" fill="white">${s}</text>`).join('')+'</svg>'),left:0,top:0});write('wild-phases-review.png',await sharp({create:{width:1536,height:552,channels:4,background:'#24282b'}}).composite(panels).png().toBuffer());
console.log(JSON.stringify({diagnostics:diagnostics.map(({indices,...r})=>r),perRectangleTargets:selection.perRectangle,changedRgb,alphaChanges,protectedChanges,outsideChanges,remainingAuthorizedPinkTargets:after.targets.length},null,2));
