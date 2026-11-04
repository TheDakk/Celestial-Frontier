import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=process.env.CF_GREEN_SOURCE_ROOT??fileURLToPath(new URL('../../../../',import.meta.url)),moduleRoot=process.env.CF_GREEN_MODULE_ROOT??root;
const load=file=>import(pathToFileURL(path.join(moduleRoot,file)).href);
const {keyAndDespill}=await load('tools/local-image-generation/kit-contact-math.mjs');
const {intakeAuthoredPixels}=await load('port/v2/tools/creature-animation/authored-intake.mjs');
const {cutKeyedParts}=await load('port/v2/tools/creature-animation/keyed-part-labels.mjs');
const {hashBytes,hashJSON}=await import(pathToFileURL(root+'/port/v2/tools/creature-animation/quadruped-template.mjs').href);
const {sealFamilyRecord}=await import(pathToFileURL(root+'/port/v2/tools/creature-animation/family-record.mjs').href);
const evidence=[];const sha=b=>createHash('sha256').update(b).digest('hex');
function scene(keyColor,w=1254,h=w){const a=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++)a.set(x>=400&&x<850&&y>=400&&y<850?[150,90,70,255]:keyColor==='green'?[0,255,0,255]:[255,0,255,255],(y*w+x)*4);return a;}
for(const keyColor of ['magenta','green'])for(const [name,run] of [['keyAndDespill',keyAndDespill],['intakeAuthoredPixels',intakeAuthoredPixels]]){
 test(`${name} ${keyColor}: matched 1254 geometry removes only the key field`,()=>{
  const input=scene(keyColor),before=input.slice(),result=run(input,1254,1254,{keyColor});
  assert.deepEqual(result.bounds,{x:401,y:401,width:448,height:448});
  assert.deepEqual(result.receipt,{erodedPixels:1796,despilledPixels:0,unresolvedEdgePixels:0});
  assert.equal(result.alpha.filter(a=>a===255).length,200704);assert.deepEqual(input,before);
  assert.deepEqual([...result.rgba.subarray((625*1254+625)*4,(625*1254+625)*4+4)],[150,90,70,255]);
  evidence.push({name,keyColor,width:1254,height:1254,inputSha256:sha(input),rgbaSha256:sha(result.rgba),alphaSha256:sha(result.alpha),bounds:result.bounds,receipt:result.receipt});
 });
}
test('opposite, omitted green and unsupported keys refuse with isolation and support guards',()=>{
 for(const run of [keyAndDespill,intakeAuthoredPixels]){
  assert.throws(()=>run(scene('green'),1254,1254),/isolation lost/);
  assert.throws(()=>run(scene('green'),1254,1254,{keyColor:'magenta'}),/isolation lost/);
  assert.throws(()=>run(scene('magenta'),1254,1254,{keyColor:'green'}),/isolation lost/);
  for(const keyColor of ['blue','GREEN',null,0])assert.throws(()=>run(scene('magenta'),1254,1254,{keyColor}),/key color/);
 }
});
test('default magenta retains the captured historical bytes and complete receipt',()=>{
 for(const run of [keyAndDespill,intakeAuthoredPixels]){
  const got=run(scene('magenta'),1254,1254);
  assert.equal(sha(got.rgba),'08168c548683b6a17dcf4ff1cf3fd187d3751c5b1b9d63399c66737e9b41d7e3');
  assert.equal(sha(got.alpha),'81560ef2e2d3f953e24e7ccb4c0ee3461e348151d16cac1474f96946a67da120');
  assert.deepEqual(got.bounds,{x:401,y:401,width:448,height:448});
  assert.deepEqual(got.receipt,{erodedPixels:1796,despilledPixels:0,unresolvedEdgePixels:0});
 }
});
test('green edge spill is removed while interior color and source input remain exact',()=>{
 const w=40,h=40,p=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++)p.set(x>=6&&x<34&&y>=6&&y<34?[70,60,40,255]:[0,255,0,255],(y*w+x)*4);
 for(let y=7;y<33;y++)p.set([70,145,60,255],(y*w+7)*4);
 const before=p.slice(),r=keyAndDespill(p,w,h,{keyColor:'green'}),i=(20*w+7)*4;
 assert.equal(r.alpha[20*w+6],0);assert.equal(r.alpha[20*w+7],255);assert.ok(r.receipt.despilledPixels>0);assert.equal(r.receipt.unresolvedEdgePixels,0);
 assert.deepEqual([...r.rgba.subarray(i,i+4)],[70,60,40,255]);assert.deepEqual([...r.rgba.subarray((20*w+20)*4,(20*w+20)*4+4)],[70,60,40,255]);assert.deepEqual(p,before);
});
test('explicit key on transparent delivered alpha refuses rather than claim keyed provenance',()=>{
 const p=new Uint8ClampedArray(32*32*4);for(let y=8;y<24;y++)for(let x=8;x<24;x++)p.set([150,90,70,255],(y*32+x)*4);
 assert.deepEqual(intakeAuthoredPixels(p,32,32).rgba,p);
 assert.throws(()=>intakeAuthoredPixels(p,32,32,{keyColor:'green'}),/opaque original/);
});
// Real family admission, raster coverage and hash checks; no mocked record/cutter.
async function bound(){
 const record=JSON.parse(fs.readFileSync(root+'/audits/FISH_SEAMS_C78_20260927/inputs/03-sculpin/record.json'));
 record.geometry.width=256;record.geometry.height=256;
 const bytes=Uint8Array.of(99,50,55,53),w=256,h=256,rgba=new Uint8ClampedArray(w*h*4),labels=new Uint8Array(w*h);
 // Keep the genuine admitted Sculpin landmark inventory inside this diagnostic solid shape.
 for(let y=8;y<h-8;y++)for(let x=8;x<w-8;x++){const i=y*w+x;rgba.set([150,90,70,255],i*4);labels[i]=1;}
 record.geometry.cutoutAssetHash=await hashBytes(bytes);const admitted=await sealFamilyRecord(record);
 const body={schema:'cf.keyed-part-intake/v2',recordRecipeHash:admitted.recipeHash,cutoutSha256:admitted.geometry.cutoutAssetHash,keyedRgbaSha256:await hashBytes(rgba),keying:{schema:'cf.chroma-key/v1',keyColor:'green'},parts:[{id:'body',joint:'root',layer:'near'}]};
 return {record:admitted,bytes,rgba,labels,body,seal:async body=>({...body,declarationHash:await hashJSON(body)})};
}
test('new explicit-key labels bind key color, original, record and every keyed channel',async()=>{
 const f=await bound(),d=await f.seal(f.body),r=await cutKeyedParts(f.record,f.bytes,f.rgba,f.labels,d);
 assert.equal(r.receipt.restDifferentChannels,0);assert.deepEqual(r.receipt.keying,{schema:'cf.chroma-key/v1',keyColor:'green'});assert.deepEqual(r.labels,f.labels);
 const tampered=structuredClone(d);tampered.keying.keyColor='magenta';await assert.rejects(cutKeyedParts(f.record,f.bytes,f.rgba,f.labels,tampered),/corrupted/);
 for(const keying of [undefined,{schema:'cf.chroma-key/v1',keyColor:'blue'},{schema:'cf.chroma-key/v0',keyColor:'green'},{schema:'cf.chroma-key/v1',keyColor:'green',unknown:true}])await assert.rejects(cutKeyedParts(f.record,f.bytes,f.rgba,f.labels,await f.seal({...f.body,keying})),/key provenance/);
 await assert.rejects(cutKeyedParts(f.record,f.bytes,f.rgba,f.labels,await f.seal({...f.body,recordRecipeHash:'0'.repeat(64)})),/binding/);
 await assert.rejects(cutKeyedParts(f.record,Uint8Array.of(1),f.rgba,f.labels,d),/mismatched cut-out/);
 const changed=f.rgba.slice();changed[(100*f.record.geometry.width+100)*4]^=1;await assert.rejects(cutKeyedParts(f.record,f.bytes,changed,f.labels,d),/changed keyed RGBA/);
 const lost=f.labels.slice();lost[100*f.record.geometry.width+100]=0;await assert.rejects(cutKeyedParts(f.record,f.bytes,f.rgba,lost,d),/missing/);
});
process.on('exit',()=>{if(process.env.CF_GREEN_EVIDENCE)fs.writeFileSync(process.env.CF_GREEN_EVIDENCE,JSON.stringify({schema:'cf.c275-green-unit-outcomes/v1',cases:evidence,nativeAcceptance:false},null,2)+'\n');});
for(const keyColor of ['magenta','green'])test(`${keyColor} connected-fringe donor follows only continuous alpha; air gaps and absent clean donors stay unresolved`,()=>{
 const w=80,h=80,background=keyColor==='green'?[0,255,0,255]:[255,0,255,255],spill=keyColor==='green'?[70,145,60,255]:[145,70,135,255],clean=[80,75,60,255];
 const make=()=>{const p=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)p.set(background,i*4);return p;};
 const box=(p,x0,y0,x1,y1,c)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)p.set(c,(y*w+x)*4);};
 const p=make();box(p,20,15,25,55,spill);box(p,20,15,25,24,clean);const before=p.slice(),r=keyAndDespill(p,w,h,{keyColor}),i=(39*w+22)*4;
 assert.deepEqual([...r.rgba.subarray(i,i+4)],clean);assert.ok(r.receipt.connectedFringeDonors>0);assert.deepEqual(p,before);
 for(const separate of [false,true]){const q=make();box(q,20,15,25,55,spill);if(separate)box(q,30,15,35,55,clean);const b=keyAndDespill(q,w,h,{keyColor});assert.deepEqual([...b.rgba.subarray(i,i+4)],spill);assert.ok(b.receipt.unresolvedEdgePixels>0);}
});

test('authored intake never exposes the terrain isolation bypass through key options',()=>{
 const w=200,h=60,p=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)p.set(y<40?[0,255,0,255]:[150,90,70,255],(y*w+x)*4);
 assert.throws(()=>intakeAuthoredPixels(p,w,h,{keyColor:'green',terrainLayer:true}),/unsupported option|isolation lost/);
});
test('inherited and non-enumerable terrain flags cannot bypass authored isolation',()=>{
 const w=200,h=60,p=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++)p.set(y<40?[0,255,0,255]:[150,90,70,255],(y*w+x)*4);
 const inherited=Object.assign(Object.create({terrainLayer:true}),{keyColor:'green'}),nonEnumerable={keyColor:'green'};Object.defineProperty(nonEnumerable,'terrainLayer',{value:true});
 for(const options of [inherited,nonEnumerable])assert.throws(()=>intakeAuthoredPixels(p,w,h,options),/isolation lost/);
});
test('explicit key refuses partially opaque RGBA even without any zero-alpha pixel',()=>{
 const w=32,p=new Uint8ClampedArray(w*w*4);for(let y=0;y<w;y++)for(let x=0;x<w;x++)p.set(x>=8&&x<24&&y>=8&&y<24?[150,90,70,128]:[0,255,0,255],(y*w+x)*4);
 assert.throws(()=>intakeAuthoredPixels(p,w,w,{keyColor:'green'}),/opaque original/);
});
