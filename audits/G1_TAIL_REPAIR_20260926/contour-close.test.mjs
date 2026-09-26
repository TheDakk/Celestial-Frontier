import test from 'node:test';import assert from 'node:assert/strict';import fs from'node:fs';import{createRequire}from'node:module';
import{closeDistalContour}from'./contour-close.mjs';import{ownerRaster}from'../../port/v2/tools/anatomy-verify/limb-separation.mjs';import{paintMask}from'../../port/v2/tools/anatomy-verify/auto-author.mjs';
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url));const sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const insideOwner=(parts,w,h,rem)=>{const m=ownerRaster(parts,w,h);for(let i=0;i<m.length;i++)if(m[i]<0)m[i]=rem;return m;};
test('same source-evidenced Eagle closure is deterministic; no master/landmark/other-part mutation',async()=>{
 const original=JSON.parse(fs.readFileSync(new URL('../G1_AUTO_AUTHOR_20260926/auto-v10/eagle/packet/authoring.json',import.meta.url)));const before=JSON.stringify(original);
 const {data,info}=await sharp(new URL('../ARCHETYPE_REPAIRS_20260922/03-biped-bird/candidate-12/master.png',import.meta.url).pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});const bytes=Buffer.from(data),mask=paintMask(data,info.width,info.height).mask,saved=mask.slice();
 const input={mask,w:info.width,h:info.height,parts:original.parts,remainderPart:original.remainderPart,partId:'tail',joint:original.landmarksPx.tailFan,parent:original.landmarksPx.pelvis};
 const result=closeDistalContour(input);assert.deepEqual(closeDistalContour(input),result);assert.equal(JSON.stringify(original),before);assert.deepEqual(mask,saved);assert.deepEqual(data,bytes);
 const tail=original.parts.findIndex(p=>p.id==='tail'),rem=original.parts.findIndex(p=>p.id===original.remainderPart),afterParts=original.parts.map((p,k)=>k===tail?result.part:p),a=insideOwner(original.parts,info.width,info.height,rem),b=insideOwner(afterParts,info.width,info.height,rem);let gained=0,lost=0;
 for(let i=0;i<mask.length;i++)if(mask[i]&&a[i]!==b[i]){assert.ok((a[i]===tail&&b[i]===rem)||(a[i]===rem&&b[i]===tail),'only declared tail/remainder can exchange owned paint');if(b[i]===tail)gained++;else lost++;}
 assert.equal(gained,1214);assert.equal(lost,474);assert.ok(gained>lost);
 const erased=mask.slice();for(let i=0;i<erased.length;i++)if(a[i]===tail)erased[i]=0;assert.throws(()=>closeDistalContour({...input,mask:erased}),/no contour/,'erased original tail cannot be rebuilt from nearby body paint');
 const candidate=JSON.parse(fs.readFileSync(new URL('./eagle-packet/authoring.json',import.meta.url)));assert.deepEqual(candidate.parts,afterParts);
});
test('closure refuses missing declared owner or degenerate direction rather than inventing anatomy',()=>{
 const input={mask:new Uint8Array(16*16),w:16,h:16,parts:[{id:'body',joint:'root',polygonPx:[[0,0],[1,0],[0,1]]}],remainderPart:'body',partId:'tail',joint:[1,1],parent:[1,1]};
 assert.throws(()=>closeDistalContour(input),/declared owners/);input.partId='body';assert.throws(()=>closeDistalContour(input),/distinct joint direction/);
});
test('retained baseline is RED; changed tail passes every measured action and blended presentation',()=>{
 const base=JSON.parse(fs.readFileSync(new URL('../G1_AUTO_AUTHOR_20260926/auto-v10/eagle/static.json',import.meta.url)));const fixed=JSON.parse(fs.readFileSync(new URL('./eagle-static-01.json',import.meta.url)));
 assert.equal(base.status,'RED');assert.ok(base.rows.some(r=>r.id==='cast'&&r.status==='RED'));assert.ok(base.rows.some(r=>r.id==='victory'&&r.status==='RED'));
 assert.equal(fixed.status,'PASS_STATIC');assert.equal(fixed.rows.length,14);assert.ok(fixed.rows.every(r=>r.status==='PASS'&&r.samples===121));assert.equal(fixed.presentation.status,'PASS');assert.equal(fixed.sourcePixelRest.changedVisibleRgbaChannels,0);
});
test('detached rear paint cannot replace an erased tail; earlier owners remain protected',()=>{
 const w=40,h=30,mask=new Uint8Array(w*h),rect=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)mask[y*w+x]=1;};rect(14,12,24,19);rect(1,1,10,24);
 const parts=[{id:'wing',joint:'wing',polygonPx:[[18,13],[20,13],[20,16],[18,16]]},{id:'tail',joint:'tail',polygonPx:[[18,12],[24,12],[24,19],[18,19]]},{id:'body',joint:'root',polygonPx:[[0,0],[1,0],[0,1]]}];
 const input={mask,w,h,parts,remainderPart:'body',partId:'tail',joint:[20,15],parent:[35,15]},result=closeDistalContour(input);assert.ok(result.part.polygonPx.every(([x])=>x>=14),'disconnected bigger island must not win tracing');
 const before=insideOwner(parts,w,h,2),after=insideOwner(parts.map(p=>p.id==='tail'?result.part:p),w,h,2);for(let i=0;i<mask.length;i++)if(before[i]===0)assert.equal(after[i],0,'earlier wing owner protected');
 const erased=mask.slice();for(let y=12;y<19;y++)for(let x=14;x<24;x++)erased[y*w+x]=0;
 assert.throws(()=>closeDistalContour({...input,mask:erased}),/no contour/,'rear blob alone cannot invent erased appendage');
 const originalOnly=mask.slice();for(let y=1;y<24;y++)for(let x=1;x<10;x++)originalOnly[y*w+x]=0;
 assert.deepEqual(closeDistalContour({...input,mask:originalOnly}).part,result.part,'unrelated island has zero influence');
});
test('same rule repairs Sandpiper with unchanged master and landmarks and complete static presentation',()=>{
 const base=JSON.parse(fs.readFileSync(new URL('../G1_AUTO_AUTHOR_20260926/auto-v10/sandpiper/static.json',import.meta.url))),fixed=JSON.parse(fs.readFileSync(new URL('./sandpiper-static.json',import.meta.url))),ownership=JSON.parse(fs.readFileSync(new URL('./sandpiper-ownership.json',import.meta.url)));
 assert.equal(base.status,'RED');assert.equal(fixed.status,'PASS_STATIC');assert.equal(fixed.rows.length,14);assert.ok(fixed.rows.every(r=>r.status==='PASS'&&r.samples===121));assert.equal(fixed.presentation.status,'PASS');assert.equal(fixed.presentation.samples,1053);assert.equal(fixed.sourcePixelRest.changedVisibleRgbaChannels,0);assert.equal(ownership.masterIdentical,true);assert.equal(ownership.landmarksIdentical,true);assert.deepEqual(ownership.changes,{'tail -> body':193,'body -> tail':3588});
});
