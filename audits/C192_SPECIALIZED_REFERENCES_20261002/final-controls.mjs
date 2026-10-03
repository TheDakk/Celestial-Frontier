import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { placeRemainderIslands, MAX_SHARE } from '../G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs';
const base='audits/C192_SPECIALIZED_REFERENCES_20261002';
const req=createRequire(path.resolve('port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const pin=p=>({path:p,sha256:sha(read(p))});
assert.equal(MAX_SHARE,.5);
async function decode(fit){
 const d=json(fit+'/declaration.json'),raw=await sharp(fit+'/parts/ownership.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const keys=new Map(d.parts.map((p,i)=>{const k=i+1;return [[(k*83)%200+35,(k*137)%200+35,(k*47)%200+35].join(','),k];}));
 const labels=new Uint8Array(raw.info.width*raw.info.height);
 for(let i=0;i<labels.length;i++)if(raw.data[i*4+3]){const k=keys.get([...raw.data.subarray(i*4,i*4+3)].join(','));assert(k,'known owner colour');labels[i]=k;}
 return {labels,d,w:raw.info.width,h:raw.info.height};
}
const placements=[];
for(const id of ['08-prawn-opaque','09-shrimp-opaque','10-snail-contours']){
 const dir=base+'/'+id,old=await decode(dir+'/fit01'),next=await decode(dir+'/d28/fit');
 assert.deepEqual(old.d.parts.map(p=>p.id),next.d.parts.map(p=>p.id));
 const original=Uint8Array.from(old.labels),r=old.d.parts.findIndex(p=>p.id===old.d.remainderPart)+1;
 assert(r);const expected=placeRemainderIslands(old.labels,old.w,old.h,r);
 assert.deepEqual(old.labels,original,'replay leaves original owners unchanged');
 assert.deepEqual(next.labels,expected.labels,'selected labels equal independent D28 replay');
 let changed=0;for(let i=0;i<old.labels.length;i++)if(old.labels[i]!==next.labels[i]){assert.equal(old.labels[i],r,'only prior remainder may move');changed++;}
 const before=await sharp(dir+'/fit01/parts/keyed.png').ensureAlpha().raw().toBuffer(),after=await sharp(dir+'/d28/fit/parts/keyed.png').ensureAlpha().raw().toBuffer();
 assert.deepEqual(before,after,'all keyed RGBA unchanged');assert.deepEqual(read(dir+'/fit01/record.json'),read(dir+'/d28/fit/record.json'));
 const i=next.labels.findIndex(Boolean),mutant=Uint8Array.from(next.labels);mutant[i]=mutant[i]===1?2:1;
 assert.throws(()=>assert.deepEqual(mutant,expected.labels));
 const deleted=Buffer.from(after);deleted[i*4+3]=0;assert.throws(()=>assert.deepEqual(deleted,before));
 const receipt=json(dir+'/d28/receipt.json');assert.equal(changed,receipt.movedPixels);assert.equal(expected.remainderPixels,receipt.remainderPixels);
 placements.push({id,source:pin(dir+'/master.png'),record:pin(dir+'/d28/fit/record.json'),recipe:json(dir+'/d28/fit/record.json').recipeHash,movedPixels:changed,remainderPixels:expected.remainderPixels,sourceRgbaChanges:0,nonRemainderOwnerChanges:0,replayMismatch:0,mutantOwnerRejected:true,deletedPixelRejected:true});
}
const oldSnail=await decode(base+'/04-snail-mouth/fit01'),newSnail=await decode(base+'/10-snail-contours/fit01'),snailChanges={};
assert.deepEqual(read(base+'/04-snail-mouth/master.png'),read(base+'/10-snail-contours/master.png'));
assert.deepEqual(json(base+'/04-snail-mouth/authoring.json').landmarksPx,json(base+'/10-snail-contours/authoring.json').landmarksPx);
for(let i=0;i<oldSnail.labels.length;i++){
 const a=oldSnail.labels[i]?oldSnail.d.parts[oldSnail.labels[i]-1].joint:null,b=newSnail.labels[i]?newSnail.d.parts[newSnail.labels[i]-1].joint:null;
 assert.equal(Boolean(a),Boolean(b));if(a!==b){const k=a+' -> '+b;snailChanges[k]=(snailChanges[k]??0)+1;}
}
const sources=[];
for(const id of fs.readdirSync(base).filter(n=>/^\d\d-/.test(n)&&n!=='10-snail-contours')){
 const dir=base+'/'+id,g=json(dir+'/generation.json'),sent=read(dir+'/prompt.txt').toString(),canonical=read(dir+'/prompt.canonical.txt').toString();
 const negative=canonical.match(/NEGATIVE\n[\s\S]*?companion brief\./)?.[0];assert(negative,'closed negative block');assert(sent.includes(negative));
 assert(!sent.replace(negative,'NEGATIVE MUTATION').includes(negative));
 assert.equal(sha(read(dir+'/master.png')),g.masterSha256);assert.equal(sha(sent),g.exactSentPromptSha256);assert.equal(sha(canonical),g.canonicalPromptSha256);
 assert.equal(sha(read(dir+'/input-master.png')),g.inputMasterSha256);
 sources.push({id,master:pin(dir+'/master.png'),exactSentPrompt:pin(dir+'/prompt.txt'),negativeSha256:sha(negative),negativeUnchanged:true,negativeMutationRejected:true});
}
const earth='audits/C186_SPECIALIZED_REFERENCES_20261002/01-earthworm-direct',g1='audits/G1_AUTO_AUTHOR_20260926/auto-g2c203r/01-earthworm';
const record=json(earth+'/fit01/record.json'),prov=json(g1+'/provenance.json'),score=json(g1+'/score.json');
function bindEarth(r,p){assert.equal(r.geometry.cutoutAssetHash,sha(read(earth+'/master.png')));assert.equal(p.targetMasterSha256,r.geometry.cutoutAssetHash);assert.equal(r.kind,'annelid');assert.equal(p.identity.family,r.kind);assert.equal(p.identity.name,r.identity.earthName);}
bindEarth(record,prov);assert.throws(()=>bindEarth({...record,kind:'serpent'},prov));assert.throws(()=>bindEarth(record,{...prov,targetMasterSha256:'0'.repeat(64)}));assert.equal(score.family,'annelid');assert.equal(score.verdict,'REFUSE');
const earthworm={files:[earth+'/master.png',earth+'/authoring.json',earth+'/fit01/record.json',g1+'/score.json',g1+'/provenance.json','audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs','port/v2/tools/anatomy-verify/auto-author.mjs'].map(pin),directRecipe:record.recipeHash,declaredFamily:record.kind,autoVerdict:score.verdict,reasons:score.reasons,reference:prov.reference,mismatchedFamilyRejected:true,mismatchedMasterRejected:true,meaning:'The exact same annelid source was refused by contour transfer. A better serpent contour is not a taxonomy edit or permission to bypass G1.'};
const c233=[];
for(const id of ['21-seahorse','22-giant-squid','23-vampire-squid','24-nautilus']){
 const source='audits/C186_CREATURE_SUPPLY_20261002/'+id+'/master.png',auto='audits/G1_AUTO_AUTHOR_20260926/auto-g2c233/'+id,p=json(auto+'/provenance.json'),s=json(auto+'/score.json');
 assert.equal(sha(read(source)),p.targetMasterSha256);c233.push({id,files:[source,auto+'/score.json',auto+'/provenance.json'].map(pin),reference:p.reference,reasons:s.reasons,family:s.family,verdict:s.verdict});
}
const helperFiles=['prepare-helpers.mjs','helper-derivation.json','review-publication.mjs','review-d28.mjs','verify-and-preview.mjs'];
const out={schema:'cf.c192-specialized-final-controls/v1',writer:pin(base+'/final-controls.mjs'),scope:'Audit-only source, label and identity checks. No native, performance, gallery or visual acceptance.',D28:.5,placements,snailObservedOwnerDelta:{sourceAndLandmarksUnchanged:true,jointPixelChanges:snailChanges},sources,earthworm,c233,currentHelpers:helperFiles.map(n=>pin(base+'/'+n)),helperNote:'Historical helper-derivation.json pins the initial copies. These current hashes additionally bind the later cast selector and derived D28 renderer, which select canonical cast or attack-prefixed actions.',qualityAccepted:false,nativeRuns:0};
fs.writeFileSync(base+'/final-controls.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sources:sources.length,D28Placements:placements.length,snailChanges,earthworm:'source-bound annelid',c233:c233.length,status:'PASS_AUDIT_CONTROLS'}));
