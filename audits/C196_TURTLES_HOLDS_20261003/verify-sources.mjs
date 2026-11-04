/** Independent source ownership replay and immutable-byte controls. No motion/native execution. */
import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{createRequire}from'node:module';
import{intakeAuthoredPixels}from'../../port/v2/tools/creature-animation/authored-intake.mjs';
import{authoredRegionOwners}from'../../port/v2/tools/creature-animation/authored-region-owners.mjs';
import{familyContractForRecord}from'../../port/v2/tools/creature-animation/family-contracts.mjs';
const B='audits/C196_TURTLES_HOLDS_20261003',read=p=>fs.readFileSync(p),J=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex'),require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs');
const inside=(x,y,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
function sameAlpha(a,key){for(let i=0;i<key.length/4;i++)assert.equal(Boolean(a[i*4+3]),Boolean(key[i*4+3]),'source alpha changed');}
function input(e){const p=e.path.startsWith('~/')?process.env.HOME+e.path.slice(1):e.path;assert.equal(sha(read(p)),e.sha256,'bound input changed');}
const rows=[];
for(const id of ['01-tortoise','01b-tortoise-far-shin','02-serval-ear-base']){
 const p=`${B}/${id}`,a=J(p+'/authoring.json'),c=J(p+'/correction.json'),fit=p+'/fit01',r=J(fit+'/record.json'),png=PNG.sync.read(read(p+'/master.png'));
 assert.equal(sha(read(c.source)),c.sourceSha256);assert.deepEqual(read(c.source),read(p+'/master.png'));assert.equal(r.geometry.cutoutAssetHash,c.sourceSha256);
 const key=intakeAuthoredPixels(new Uint8ClampedArray(png.data),png.width,png.height).rgba,actual=PNG.sync.read(read(fit+'/parts/keyed.png')).data;assert.deepEqual(Buffer.from(key),actual);
 const owners=authoredRegionOwners(a.parts,a.remainderPart),polys=a.parts.map(p=>p.polygonPx.map(([x,y])=>[x/png.width,y/png.height])),rem=a.parts.findIndex(p=>p.id===a.remainderPart),own=PNG.sync.read(read(fit+'/parts/ownership.png')).data,expected=Buffer.alloc(own.length),counts=owners.ownerParts.map(()=>0);
 for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){const i=y*png.width+x;if(!key[i*4+3])continue;let k=polys.findIndex(poly=>inside((x+.5)/png.width,(y+.5)/png.height,poly));if(k<0)k=rem;const n=owners.ownerIndex[k]+1;counts[n-1]++;expected.set([n*83%200+35,n*137%200+35,n*47%200+35,255],i*4);}
 assert.deepEqual(own,expected,'independent source-owner replay');sameAlpha(own,key);
 const painted=key.findIndex((v,i)=>i%4===3&&v>0)-3,empty=key.findIndex((v,i)=>i%4===3&&v===0)-3;
 const changedKey=Buffer.from(actual);changedKey[painted]^=1;assert.throws(()=>assert.deepEqual(changedKey,Buffer.from(key)));
 const deleted=Buffer.from(own);deleted[painted+3]=0;assert.throws(()=>sameAlpha(deleted,key),/alpha/);
 const added=Buffer.from(own);added[empty+3]=255;assert.throws(()=>sameAlpha(added,key),/alpha/);
 const wrongOwner=Buffer.from(own);wrongOwner[painted]^=1;assert.throws(()=>assert.deepEqual(wrongOwner,expected));
 if(c.priorAuthoring){const old=J(c.priorAuthoring);assert.equal(sha(read(c.priorAuthoring)),c.priorAuthoringSha256);for(const[k,v]of Object.entries(old.landmarksPx))assert.deepEqual(a.landmarksPx[k],v);for(const part of old.parts)if(!c.changedParts.includes(part.id))assert.deepEqual(a.parts.find(p=>p.id===part.id),part);}
 let partition=null;
 if(id.startsWith('01')){
  assert.deepEqual(r.anatomy.absent,['external-ears']);assert.equal(r.materials.surface,'plated');assert.deepEqual(r.materials.joints,a.materials.joints);
  const family=familyContractForRecord(r);assert(!family.joints.some(j=>j.startsWith('ear')));assert.equal(family.legs.length,4);assert(Object.keys(a.materials.joints).every(j=>family.joints.includes(j)));
  for(const joint of ['neck','head',...family.joints.filter(j=>/^(hind|fore|tail)/.test(j))])assert.equal(r.materials.joints[joint],'scaled');
  assert.throws(()=>familyContractForRecord({...r,anatomy:{...r.anatomy,absent:['foreFar']}}),/mandatory or unknown/);
  const rest=r.landmarks;assert(rest.tail3[0]*1254<170&&rest.tail3[1]*1254>690,'real source tail, not shell donor');
  partition={externalEarsAbsent:true,allFourMandatoryLegsRetained:true,unknownMandatoryAbsenceRefused:true,observedExposedJointOverrides:Object.keys(r.materials.joints),shellRigidityQualified:false,remainingRootOwnedSkinFringesHeld:true};
 }
 const st=J(p+'/static-01.json');for(const e of [...st.inputs,...J(p+'/static-01.json.sources.json')])input(e);
 rows.push({id,status:'PASS_CONSERVATION_ONLY',sourceSha256:c.sourceSha256,authoringSha256:sha(read(p+'/authoring.json')),recordSha256:sha(read(fit+'/record.json')),bindingSha256:sha(read(fit+'/binding.json')),keyedRgbaSha256:sha(actual),sourceRgbaChanged:0,independentOwnershipReplay:true,ownerCounts:owners.ownerParts.map((v,i)=>({id:v.id,joint:v.joint,pixels:counts[i]})),unchangedOtherLandmarksAndRegions:!!c.priorAuthoring,partition,staticStatus:st.status,controls:['source RGBA mutation refused','source alpha deletion refused','source alpha addition refused','owner-color mutation refused'],qualityAccepted:false,native:false});
}
const partial=[];
for(const id of ['03-box-turtle-partial','04-pond-turtle-partial','05-snapping-turtle-partial','06-turtle-partial']){
 const p=`${B}/${id}`,r=J(p+'/source-partition.json'),png=PNG.sync.read(read(p+'/master.png')),key=intakeAuthoredPixels(new Uint8ClampedArray(png.data),png.width,png.height).rgba,labels=PNG.sync.read(read(p+'/partial-labels.png')).data,preview=PNG.sync.read(read(p+'/ownership-preview.png')).data;assert.deepEqual(read(r.source),read(p+'/master.png'));assert.equal(sha(read(r.source)),r.sourceSha256);sameAlpha(labels,key);sameAlpha(preview,key);let unknown=0,total=0;
 for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){const i=y*png.width+x;if(!key[i*4+3])continue;total++;const n=r.regions.findIndex(v=>inside(x+.5,y+.5,v.polygonPx))+1;assert.equal(labels[i*4],n);if(!n)unknown++;}
 assert.equal(unknown,r.unassignedSourcePixels);assert.equal(total,r.totalVisibleKeyedPixels);assert(unknown>0);assert(!fs.existsSync(p+'/record.json')&&!fs.existsSync(p+'/fit01'));
 partial.push({id,status:'PASS_PARTIAL_REPLAY_NOT_A_FIT',unassignedSourcePixels:unknown,sourcePixels:total,masterSha256:r.sourceSha256,noInventedFourthLimb:true,qualityAccepted:false});
}
const bundle=J(B+'/review-bundle-receipt.json');for(const e of [...bundle.inputs,bundle.bundle])input(e);
const result={schema:'cf.c196-source-verification/v1',status:'PASS',scope:'Exact source/label/material declaration checks, not anatomical/visual/native admission.',rows,partial,bundleSourceFiles:bundle.inputs.length,qualityAccepted:false,native:false};fs.writeFileSync(B+'/source-verification.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS',fullAuthorings:rows.length,partial:partial.length,bundleSources:bundle.inputs.length}));
