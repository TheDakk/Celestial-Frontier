/** Root-executed proposed-feature outcome tests. No implementation is included here. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'../../../..'),dir=path.join(root,'audits/O2_20261102/w3-tint-queue/d40-donor-exclusion-proposal-r01'),sha=b=>createHash('sha256').update(b).digest('hex');
const moduleFile=process.env.D40_REVIEW_MODULE?path.resolve(process.env.D40_REVIEW_MODULE):path.join(root,'port/v2/tools/creature-animation/post-key-matte.mjs');
const {derivePostKeyMatte}=await import(pathToFileURL(moduleFile).href);
const req=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const px=(r,i)=>[...r.rgba.subarray(i*4,i*4+4)],same=(a,b)=>assert.deepEqual([...a],[...b]);
const original=Uint8ClampedArray.from([136,209,116,255,200,208,186,255,230,220,210,255,118,96,69,255,0,255,0,255]);
const canonical=Uint8ClampedArray.from(original);canonical[19]=0;
const args=()=>({originalRgba:Uint8ClampedArray.from(original),canonicalRgba:Uint8ClampedArray.from(canonical),width:5,height:1,canonicalRgbaSha256:sha(canonical),keyColor:'green',protectedPixels:[3],despillPixels:[0,1]});
const feature=(extra={})=>({...args(),donorExclusionPixels:[1],donorExclusionSource:{width:5,height:1,originalRgbaSha256:sha(original)},...extra});
test('explicit exclusion changes the actual selected material outcome using a real connected donor',()=>{const baseline=derivePostKeyMatte(args()),r=derivePostKeyMatte(feature());assert.deepEqual(px(baseline,0),[200,208,186,169]);assert.deepEqual(px(r,0),[230,220,210,149]);assert.deepEqual(px(r,1),[230,220,210,225]);assert.deepEqual(px(r,2),[230,220,210,255]);assert.deepEqual(px(r,3),[118,96,69,255]);assert.equal(px(r,4)[3],0);assert.deepEqual(r.receipt.reviewedDonorExclusions.unresolvedTargets,[]);});
test('reverse and restore exclusion reverses and restores those exact outcomes',()=>{const a=derivePostKeyMatte(feature()),b=derivePostKeyMatte({...feature(),donorExclusionPixels:[]}),c=derivePostKeyMatte(feature());assert.deepEqual(px(a,0),[230,220,210,149]);assert.deepEqual(px(b,0),[200,208,186,169]);same(a.rgba,c.rgba);});
test('omitted and empty exclusions preserve default raw RGBA and unchanged algorithm receipt',()=>{const a=derivePostKeyMatte(args()),b=derivePostKeyMatte({...args(),donorExclusionPixels:[]});same(a.rgba,b.rgba);assert.deepEqual(a.receipt,b.receipt);assert.equal(Object.hasOwn(b.receipt,'reviewedDonorExclusions'),false);});
test('nonempty exclusions require explicit targets, not blanket recolouring',()=>assert.throws(()=>derivePostKeyMatte(feature({despillPixels:[]})),/target|selection|fringe/i));
test('exclusion alone does not recolour the excluded donor or any outside-target pixel',()=>{const b=derivePostKeyMatte({...args(),despillPixels:[0]}),r=derivePostKeyMatte(feature({despillPixels:[0]}));assert.deepEqual(px(r,0),[230,220,210,149]);for(let i=1;i<5;i++)assert.deepEqual(px(r,i),px(b,i));});
test('source binding, dimensions and index inventory reject wrong proposals',()=>{for(const donorExclusionSource of [undefined,{width:4,height:1,originalRgbaSha256:sha(original)},{width:5,height:1,originalRgbaSha256:'0'.repeat(64)}])assert.throws(()=>derivePostKeyMatte(feature({donorExclusionSource})),/source|hash|donor|dimension/i);for(const donorExclusionPixels of [[1,1],[-1],[5],[4]])assert.throws(()=>derivePostKeyMatte(feature({donorExclusionPixels})),/donor|source|index|selection|duplicate/i);});
test('wrong canonical seal rejects; restoring exact seal restores the valid outcome',()=>{assert.throws(()=>derivePostKeyMatte(feature({canonicalRgbaSha256:'0'.repeat(64)})),/canonical/i);assert.deepEqual(px(derivePostKeyMatte(feature()),0),[230,220,210,149]);});
test('protected opaque biological pigment cannot be selected or donor-excluded',()=>{assert.throws(()=>derivePostKeyMatte(feature({despillPixels:[0,3]})),/protect|conflict/i);assert.throws(()=>derivePostKeyMatte(feature({donorExclusionPixels:[1,3]})),/protect|conflict/i);const r=derivePostKeyMatte(feature());assert.deepEqual(px(r,3),[118,96,69,255]);});
test('no donor preserves exact default RGBA, flags unresolved, and restoration resolves',()=>{const b=derivePostKeyMatte({...args(),protectedPixels:[],despillPixels:[0]}),r=derivePostKeyMatte(feature({protectedPixels:[],despillPixels:[0],donorExclusionPixels:[1,2,3]}));same(r.rgba,b.rgba);assert.deepEqual(r.receipt.reviewedDonorExclusions.unresolvedTargets,[0]);assert.equal(r.receipt.reviewedDonorExclusions.status,'UNRESOLVED');const restored=derivePostKeyMatte(feature({protectedPixels:[],despillPixels:[0],donorExclusionPixels:[1,3]}));assert.deepEqual(restored.receipt.reviewedDonorExclusions.unresolvedTargets,[]);assert.deepEqual(px(restored,0),[230,220,210,149]);});
test('a source gap blocks an otherwise eligible donor across it',()=>{const o=Uint8ClampedArray.from([136,209,116,255,200,208,186,255,0,255,0,255,230,220,210,255]),c=Uint8ClampedArray.from(o);c[11]=0;const input={originalRgba:o,canonicalRgba:c,width:4,height:1,canonicalRgbaSha256:sha(c),keyColor:'green',despillPixels:[0],donorExclusionPixels:[1],donorExclusionSource:{width:4,height:1,originalRgbaSha256:sha(o)}};const r=derivePostKeyMatte(input);assert.deepEqual(px(r,0),[200,208,186,169]);assert.equal(px(r,2)[3],0);assert.deepEqual(r.receipt.reviewedDonorExclusions.unresolvedTargets,[0]);const joined=Uint8ClampedArray.from(o);joined.set([230,220,210,255],8);const joinedCanonical=Uint8ClampedArray.from(joined),s=derivePostKeyMatte({...input,originalRgba:joined,canonicalRgba:joinedCanonical,canonicalRgbaSha256:sha(joinedCanonical),donorExclusionSource:{width:4,height:1,originalRgbaSha256:sha(joined)}});assert.deepEqual(px(s,0),[230,220,210,149]);});
test('a restored target gains no opacity or support versus default',()=>{const c=Uint8ClampedArray.from(canonical);c[3]=0;const input={...feature(),canonicalRgba:c,canonicalRgbaSha256:sha(c)},b=derivePostKeyMatte({...input,donorExclusionPixels:[]}),r=derivePostKeyMatte(input);assert.deepEqual(px(b,0),[200,208,186,169]);assert.deepEqual(px(r,0),[230,220,210,149]);for(let i=0;i<5;i++){assert.ok(r.rgba[i*4+3]<=b.rgba[i*4+3]);assert.equal(r.rgba[i*4+3]>0,b.rgba[i*4+3]>0);}});
test('opaque biological brown/cream/green/coral/magenta remain exact under the selected donor feature',()=>{const o=Uint8ClampedArray.from([209,136,209,255,208,200,208,255,230,220,210,255,118,96,69,255,6,230,9,255,209,82,27,255,196,129,188,255,255,0,255,255]),c=Uint8ClampedArray.from(o);c[31]=0;const r=derivePostKeyMatte({originalRgba:o,canonicalRgba:c,width:8,height:1,canonicalRgbaSha256:sha(c),keyColor:'magenta',despillPixels:[0],protectedPixels:[2,3,4,5,6],donorExclusionPixels:[1],donorExclusionSource:{width:8,height:1,originalRgbaSha256:sha(o)}});for(let i=2;i<=6;i++)assert.deepEqual(px(r,i),[...o.subarray(i*4,i*4+4)]);assert.deepEqual(px(r,0).slice(0,3),[230,220,210]);assert.equal(px(r,7)[3],0);});
const fixtures=JSON.parse(fs.readFileSync(path.join(dir,'historical-fixtures.json'),'utf8'));
for(const row of fixtures.rows)test('historical '+row.name+' exact default RGBA/receipt for omitted and empty exclusions',async()=>{const p=JSON.parse(fs.readFileSync(path.join(root,row.request.path),'utf8'));for(const pin of [p.original,p.canonical,...p.lineage])assert.equal(sha(fs.readFileSync(path.join(root,pin.path))),pin.sha256);const a=await sharp(path.join(root,p.original.path)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(path.join(root,p.canonical.path)).ensureAlpha().raw().toBuffer();const input={originalRgba:a.data,canonicalRgba:b,width:a.info.width,height:a.info.height,canonicalRgbaSha256:p.canonical.rgbaSha256,keyColor:p.keyColor,protectedPixels:p.protectedPixels??[],despillPixels:p.despillPixels??[]};for(const extra of [{},{donorExclusionPixels:[]}]){const r=derivePostKeyMatte({...input,...extra});assert.equal(sha(r.rgba),row.expectedDefaultRgbaSha256);assert.deepEqual(r.receipt,row.expectedAlgorithmReceipt);}});

test('the file boundary forwards reviewed exclusions and rejects a wrong source without writing output',async()=>{
 const {derivePostKeyMatteFile}=await import(process.env.D40_REVIEW_CLI?pathToFileURL(path.resolve(process.env.D40_REVIEW_CLI)).href:'./derive-post-key-matte.mjs');
 const scratch=fs.mkdtempSync(path.join(root,'audits/.d40-recipe-control-'));
 const previous=process.cwd();
 try{
  process.chdir(root);
  const originalFile=path.join(scratch,'original.png'),canonicalFile=path.join(scratch,'canonical.png');
  await sharp(Buffer.from(original),{raw:{width:5,height:1,channels:4}}).png().toFile(originalFile);
  await sharp(Buffer.from(canonical),{raw:{width:5,height:1,channels:4}}).png().toFile(canonicalFile);
  const pin=p=>({path:p,sha256:sha(fs.readFileSync(p))});
  const recipe={schema:'cf.post-key-matte-request/v1',original:pin(originalFile),canonical:{...pin(canonicalFile),rgbaSha256:sha(canonical)},keyColor:'green',protectedPixels:[3],despillPixels:[0,1],donorExclusionPixels:[1],donorExclusionSource:{width:5,height:1,originalRgbaSha256:sha(original)}};
  const recipeFile=path.join(scratch,'recipe.json');fs.writeFileSync(recipeFile,JSON.stringify(recipe));
  const result=await derivePostKeyMatteFile(recipeFile,path.join(scratch,'selected'));
  const rgba=await sharp(path.join(scratch,'selected/master.png')).ensureAlpha().raw().toBuffer();
  assert.deepEqual([...rgba.subarray(0,4)],[230,220,210,149]);
  assert.deepEqual([...rgba.subarray(12,16)],[118,96,69,255]);
  assert.equal(result.derivative.reviewedDonorExclusions.status,'RESOLVED');
  assert.equal(sha(fs.readFileSync(originalFile)),recipe.original.sha256);
  assert.equal(sha(fs.readFileSync(canonicalFile)),recipe.canonical.sha256);
  fs.writeFileSync(recipeFile,JSON.stringify({...recipe,donorExclusionSource:{...recipe.donorExclusionSource,originalRgbaSha256:'0'.repeat(64)}}));
  await assert.rejects(derivePostKeyMatteFile(recipeFile,path.join(scratch,'wrong-source')),/source hash/);
  assert.equal(fs.existsSync(path.join(scratch,'wrong-source')),false);
 }finally{process.chdir(previous);fs.rmSync(scratch,{recursive:true});}
});

test('brown alternate donor cannot increase selected opacity above preserved default D40',()=>{
 const input={...args(),despillPixels:[0]},baseline=derivePostKeyMatte(input);
 const result=derivePostKeyMatte({...input,donorExclusionPixels:[1,2],donorExclusionSource:{width:5,height:1,originalRgbaSha256:sha(original)}});
 assert.deepEqual(px(baseline,0),[200,208,186,169]);assert.deepEqual(px(result,0),[118,96,69,169]);
 for(let i=1;i<5;i++)assert.deepEqual(px(result,i),px(baseline,i));
});
