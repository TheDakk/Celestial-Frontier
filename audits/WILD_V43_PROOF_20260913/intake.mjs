import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {keyAndDespill} from '../../tools/local-image-generation/kit-contact-math.mjs';
const out=path.dirname(fileURLToPath(import.meta.url)), root=path.resolve(out,'../..');
const req=createRequire(path.join(root,'port/v2/package.json'));
const sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(name,b)=>fs.writeFileSync(path.join(out,name),b,{flag:'wx'});
const size=1024, origin=[.20,.55], contact=[.80,.55];
// Visual measurements on delivered masters: launch root, travel start/tip,
// impact convergence. Empty anchors are virtual; no painted marker is invented.
const fit={
 launch:{source:[.135,.60],target:origin,scale:.40,origin:[.135,.60],contact:[.80,.55]},
 travel:{source:[.12,.55],target:origin,scale:.60/(.95-.12),origin:[.12,.55],contact:[.95,.55]},
 impact:{source:[.87,.56],target:contact,scale:.50,origin:[.20,.55],contact:[.87,.56]},
};
for(const d of ['keyed','registered'])fs.mkdirSync(path.join(out,d),{recursive:true});
const rows=[];
for(const phase of ['launch','travel','impact']){
 const name=`wild-${phase}`,bytes=fs.readFileSync(path.join(out,name+'.png'));
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,info.height);assert.ok(info.width>=384);
 const keyed=keyAndDespill(new Uint8ClampedArray(data),info.width,info.height);
 const png=await sharp(Buffer.from(keyed.rgba),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
 write('keyed/'+name+'.png',png);
 const f=fit[phase],scaled=Math.round(size*f.scale),ratio=scaled/info.width;
 const left=Math.round(size*f.target[0]-info.width*f.source[0]*ratio);
 const top=Math.round(size*f.target[1]-info.height*f.source[1]*ratio);
 const small=await sharp(png).resize(scaled,scaled,{kernel:'lanczos3'}).png().toBuffer();
 // The scaled full canvas must fit, so neither subject nor stray fragments are cropped.
 assert.ok(left>=0&&top>=0&&left+scaled<=size&&top+scaled<=size,phase);
 const registered=await sharp({create:{width:size,height:size,channels:4,background:'#00000000'}}).composite([{input:small,left,top}]).png().toBuffer();
 write('registered/'+name+'.png',registered);
 const mapped=f.source.map((n,i)=>(n*info.width*ratio+[left,top][i])/size);
 assert.ok(mapped.every((n,i)=>Math.abs(n-f.target[i])*size<=.51));
 rows.push({phase,image:name+'.png',imageSha256:sha(bytes),canvasSize:{width:info.width,height:info.height},originAnchor:f.origin,contactAnchor:f.contact,keyedImage:'keyed/'+name+'.png',keyedSha256:sha(png),alphaBoundsPixels:keyed.bounds,keyer:keyed.receipt,registeredImage:'registered/'+name+'.png',registeredSha256:sha(registered),registration:{uniformScale:ratio,left,top,sourceAnchorNormalized:f.source,targetAnchorNormalized:f.target,mappedAnchorNormalized:mapped,anchorResidualPixels:mapped.map((n,i)=>(n-f.target[i])*size),method:'visual anchor measurement; uniform downscale and translation of keyed copy; no paint changes, rotation, warping or cropping'},qualityAccepted:false});
 assert.equal(sha(fs.readFileSync(path.join(out,name+'.png'))),sha(bytes));
}
const anchors={schema:'cf.effect-sequence-anchors/v1',sequenceId:'wild-maw-proof-v43',theme:'wild',abilityId:'maw',abilityName:'Savage Maw',canvasSize:{width:size,height:size},coordinateSpace:'normalized full canvas; top-left origin',phaseOrder:['launch','travel','impact'],direction:'left-to-right',originAnchor:origin,contactAnchor:contact,phases:rows.map(r=>({phase:r.phase,image:r.registeredImage,keyedImage:r.registeredImage,imageSha256:r.registeredSha256,canvasSize:{width:size,height:size},originAnchor:origin,contactAnchor:contact,qualityAccepted:false})),qualityAccepted:false,registration:'Shared 1024-square intake canvas; visible launch/travel origins and impact contact aligned within half a pixel. Empty anchors are virtual. Visual motion acceptance pending; generated masters did not obey requested occupied bounds.'};
write('wild-anchors.json',JSON.stringify(anchors,null,2)+'\n');
write('wild-anchors-master-fallback.json',JSON.stringify({...anchors,sequenceId:'wild-maw-proof-v43-master-fallback',canvasSize:rows[0].canvasSize,phases:rows.map(r=>({phase:r.phase,image:r.image,keyedImage:r.keyedImage,imageSha256:r.imageSha256,canvasSize:r.canvasSize,originAnchor:r.originAnchor,contactAnchor:r.contactAnchor,alphaBoundsPixels:r.alphaBoundsPixels,qualityAccepted:false})),registration:'Original master fallback uses visually measured per-phase anchors; common registration is not claimed for these originals.'},null,2)+'\n');
write('intake.json',JSON.stringify({images:rows,generationCalls:3,rerolls:0,originalsUnchanged:true,qualityAccepted:false},null,2)+'\n');
for(const [label,folder,bg] of [['masters','', '#FF00FF'],['registered','registered/','#24282b']]){
 const panels=[];
 for(let i=0;i<rows.length;i++){
  const image=await sharp(path.join(out,folder+rows[i].image)).resize(512,512).flatten({background:bg}).png().toBuffer();
  panels.push({input:image,left:i*512,top:40});
 }
 const labels=Buffer.from('<svg width="1536" height="40"><rect width="1536" height="40" fill="#24282b"/>'+rows.map((r,i)=>`<text x="${i*512+20}" y="27" font-family="sans-serif" font-size="20" fill="white">${r.phase.toUpperCase()}</text>`).join('')+'</svg>');
 panels.push({input:labels,left:0,top:0});
 write('wild-'+label+'-review.png',await sharp({create:{width:1536,height:552,channels:4,background:bg}}).composite(panels).png().toBuffer());
}
// Re-verify the already-completed one-pass MID result, without applying another pass.
const prior=path.join(root,'audits/ARENA_V1_ACCEPTANCE_20260912');
const receipt=JSON.parse(fs.readFileSync(path.join(prior,'despill-receipt.json')));
assert.equal(sha(fs.readFileSync(path.join(prior,'arena-mid-despilled.png'))),receipt.outputSha256);
assert.equal(sha(fs.readFileSync(path.join(prior,'arena-template-v1.png'))),receipt.compositeSha256);
const old=await sharp(path.join(root,'audits/ARENA_EFFECTS_V42_PROOF_20260912/keyed/arena-mid.png')).ensureAlpha().raw().toBuffer();
const corrected=await sharp(path.join(prior,'arena-mid-despilled.png')).ensureAlpha().raw().toBuffer();
assert.equal(old.length,corrected.length);let changed=0;
for(let i=0;i<old.length;i+=4){assert.equal(old[i+3],corrected[i+3]);if(old[i]!==corrected[i]||old[i+1]!==corrected[i+1]||old[i+2]!==corrected[i+2])changed++;}
assert.equal(changed,190);
write('mid-verification.json',JSON.stringify({existingCommit:'07c93945',passesPreviouslyApplied:1,newPasses:0,changedRgbPixels:changed,alphaUnchanged:true,verifiedOutputSha256:receipt.outputSha256,verifiedCompositeSha256:receipt.compositeSha256},null,2)+'\n');
console.log(JSON.stringify(rows.map(r=>({phase:r.phase,size:r.canvasSize,bounds:r.alphaBoundsPixels,registration:r.registration,keyer:r.keyer})),null,2));
