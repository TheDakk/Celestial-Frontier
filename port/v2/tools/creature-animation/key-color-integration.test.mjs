import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';import {pathToFileURL,fileURLToPath} from 'node:url';
const root=process.env.CF_GREEN_SOURCE_ROOT??fileURLToPath(new URL('../../../../',import.meta.url)),work=process.env.CF_GREEN_SCRATCH_ROOT??root+'/audits',moduleRoot=process.env.CF_GREEN_MODULE_ROOT??root;
const load=file=>import(pathToFileURL(moduleRoot+'/'+file).href);
const {buildAuthoredParts}=await load('port/v2/tools/creature-animation/build-authored-parts.mjs');
const {intakeAuthoredPixels}=await load('port/v2/tools/creature-animation/authored-intake.mjs');
const {hashBytes,hashJSON}=await import(pathToFileURL(root+'/port/v2/tools/creature-animation/quadruped-template.mjs').href);
const {sealFamilyRecord}=await import(pathToFileURL(root+'/port/v2/tools/creature-animation/family-record.mjs').href);
const req=createRequire(root+'/port/v2/package.json'),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const old=JSON.parse(fs.readFileSync(root+'/audits/FISH_SEAMS_C78_20260927/inputs/03-sculpin/record.json'));
const read=p=>JSON.parse(fs.readFileSync(p));const outcomes=[];
function field(w,keyColor){const p=new Uint8ClampedArray(w*w*4);for(let y=0;y<w;y++)for(let x=0;x<w;x++)p.set(x>=Math.ceil(w*.04)&&x<Math.floor(w*.96)&&y>=Math.ceil(w*.28)&&y<Math.floor(w*.57)?[150,90,70,255]:keyColor==='green'?[0,255,0,255]:[255,0,255,255],(y*w+x)*4);return p;}
const seal=async b=>({...b,declarationHash:await hashJSON(b)});
test('file builder admits explicit green labels and refuses wrong key, keyed bytes, record binding and original tampering',async()=>{
 const scratch=fs.mkdtempSync(work+'/.green-builder-control-');
 try{
  const w=256,raw=field(w,'green'),master=await sharp(Buffer.from(raw),{raw:{width:w,height:w,channels:4}}).png().toBuffer();
  const r=structuredClone(old);r.geometry.width=w;r.geometry.height=w;r.geometry.cutoutAssetHash=await hashBytes(master);const record=await sealFamilyRecord(r);
  const keyed=intakeAuthoredPixels(raw,w,w,{keyColor:'green'}),labels=Buffer.alloc(raw.length);for(let i=0;i<w*w;i++)labels.set([keyed.alpha[i]?1:0,keyed.alpha[i]?1:0,keyed.alpha[i]?1:0,255],i*4);
  const labelBytes=await sharp(labels,{raw:{width:w,height:w,channels:4}}).png().toBuffer();
  const body={schema:'cf.keyed-part-intake/v2',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,keyedRgbaSha256:await hashBytes(keyed.rgba),keying:{schema:'cf.chroma-key/v1',keyColor:'green'},labelsFile:'labels.png',labelsSha256:await hashBytes(labelBytes),parts:[{id:'body',joint:'root',layer:'near'}]};
  fs.writeFileSync(scratch+'/record.json',JSON.stringify(record));fs.writeFileSync(scratch+'/master.png',master);fs.writeFileSync(scratch+'/labels.png',labelBytes);
  const args={id:'green-key-diagnostic',recordFile:scratch+'/record.json',masterFile:scratch+'/master.png',declarationFile:scratch+'/declaration.json',output:scratch+'/parts'};
  fs.writeFileSync(args.declarationFile,JSON.stringify(await seal(body)));await buildAuthoredParts(args);
  assert.deepEqual(await sharp(scratch+'/parts/keyed.png').ensureAlpha().raw().toBuffer(),Buffer.from(keyed.rgba));assert.deepEqual(fs.readFileSync(args.masterFile),master);
  const receipt=read(scratch+'/parts/receipt.json');assert.equal(receipt.restDifferentChannels,0);assert.equal(receipt.atlasDifferentChannels,0);assert.equal(receipt.masterUnchanged,true);assert.deepEqual(receipt.keying,body.keying);
  for(const [name,change,error] of [['wrong-key',{keying:{schema:'cf.chroma-key/v1',keyColor:'magenta'}},/isolation lost/],['keyed-bytes',{keyedRgbaSha256:'0'.repeat(64)},/changed keyed RGBA/],['record-binding',{recordRecipeHash:'0'.repeat(64)},/binding/],['unknown-key',{keying:{schema:'cf.chroma-key/v1',keyColor:'blue'}},/key provenance/]]){
   fs.writeFileSync(args.declarationFile,JSON.stringify(await seal({...body,...change})));await assert.rejects(buildAuthoredParts({...args,output:scratch+'/'+name}),error);assert.equal(fs.existsSync(scratch+'/'+name),false);
  }
  fs.writeFileSync(args.declarationFile,JSON.stringify(await seal(body)));fs.writeFileSync(args.masterFile,await sharp(Buffer.from(field(w,'magenta')),{raw:{width:w,height:w,channels:4}}).png().toBuffer());await assert.rejects(buildAuthoredParts({...args,output:scratch+'/changed-master'}),/isolation lost|mismatched cut-out/);
  outcomes.push({name:'builder-green',status:'PASS',masterSha256:await hashBytes(master),keyedRgbaSha256:body.keyedRgbaSha256,declarationHash:(await seal(body)).declarationHash,receipt});
 }finally{fs.rmSync(scratch,{recursive:true});}
});
test('author CLI carries explicit green through record, label declaration, provenance and packed output',async()=>{
 const scratch=fs.mkdtempSync(work+'/.green-cli-control-'),packet=scratch+'/packet',out=scratch+'/fit';fs.mkdirSync(packet);
 try{
  const w=1254,raw=field(w,'green'),png=await sharp(Buffer.from(raw),{raw:{width:w,height:w,channels:4}}).png().toBuffer();
  const author={id:'green-key-cli-diagnostic',family:old.kind,keyColor:'green',landmarksPx:Object.fromEntries(Object.entries(old.landmarks).map(([k,p])=>[k,p.map(v=>v*w)])),materials:old.materials,groundLineY:old.geometry.groundLineY,remainderPart:'body',parts:[{id:'head',joint:'head',layer:'near',polygonPx:[[900,0],[1254,0],[1254,1254],[900,1254]]},{id:'body',joint:'root',layer:'near',polygonPx:[[0,0],[1254,0],[1254,1254],[0,1254]]}]};
  fs.writeFileSync(packet+'/master.png',png);fs.writeFileSync(packet+'/authoring.json',JSON.stringify(author));fs.writeFileSync(packet+'/presence.json',JSON.stringify(old.anatomy));fs.writeFileSync(packet+'/subject-source.json',JSON.stringify({name:'Sculpin synthetic green key diagnostic',genome:old.genome,visualKey:old.identity.speciesVisualKey}));
  const p=spawnSync(process.execPath,[moduleRoot+'/port/v2/tools/creature-animation/intake-authored.mjs',packet,out],{cwd:root,encoding:'utf8',timeout:120000});
  assert.equal(p.status,0,p.stdout+p.stderr);const declaration=read(out+'/declaration.json'),record=read(out+'/record.json'),provenance=read(out+'/intake-provenance.json'),labelReceipt=read(out+'/label-authoring-receipt.json');
  for(const v of [declaration,record.provenance,provenance,labelReceipt])assert.deepEqual(v.keying,{schema:'cf.chroma-key/v1',keyColor:'green'});
  assert.equal(declaration.schema,'cf.keyed-part-intake/v2');assert.equal(provenance.status,'FIT_COMPILED');assert.equal(provenance.nativeAcceptance,false);assert.ok(provenance.unchangedInputs.every(i=>i.unchanged));
  const {declarationHash,...body}=declaration;assert.equal(declarationHash,await hashJSON(body));assert.equal(declaration.keyedRgbaSha256,await hashBytes(intakeAuthoredPixels(raw,w,w,{keyColor:'green'}).rgba));
  assert.deepEqual(fs.readFileSync(packet+'/master.png'),png);outcomes.push({name:'cli-green-synthetic',status:'PASS',declaration,provenance,recordRecipeHash:record.recipeHash,stdout:p.stdout});
 }finally{fs.rmSync(scratch,{recursive:true});}
});
process.on('exit',()=>{if(process.env.CF_GREEN_INTEGRATION_EVIDENCE)fs.writeFileSync(process.env.CF_GREEN_INTEGRATION_EVIDENCE,JSON.stringify({schema:'cf.c275-green-integration/v1',cases:outcomes,nativeAcceptance:false,syntheticDiagnosticOnly:true},null,2)+'\n');});
test('stored historical Aphid v1 keyed-RGBA seal admits unchanged without a rebind',async()=>{
 const fit=root+'/audits/KEYED_REGION_C94_20260927/aphid-fit',record=read(fit+'/record.json'),declarationBytes=fs.readFileSync(fit+'/declaration.json'),declaration=JSON.parse(declarationBytes),master=fs.readFileSync(root+'/'+record.source),labelBytes=fs.readFileSync(fit+'/labels.png');
 const {data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true}),fresh=intakeAuthoredPixels(new Uint8ClampedArray(data),info.width,info.height),stored=await sharp(fit+'/parts/keyed.png').ensureAlpha().raw().toBuffer({resolveWithObject:true}),keyed={rgba:new Uint8ClampedArray(stored.data)},labelData=await sharp(labelBytes).ensureAlpha().raw().toBuffer(),labels=Uint8Array.from({length:info.width*info.height},(_,i)=>labelData[i*4]);
 assert.equal(stored.info.width,info.width);assert.equal(stored.info.height,info.height);
 // This C94 packet predates later default-keyer fringe work. Its seal owns the
 // retained keyed bytes, never a newly recomputed or silently rebound image.
 if(process.env.CF_GREEN_HISTORICAL){const before=await import(pathToFileURL(process.env.CF_GREEN_HISTORICAL).href);assert.deepEqual(fresh,before.keyAndDespill(new Uint8ClampedArray(data),info.width,info.height));}

 assert.equal(declaration.schema,'cf.keyed-part-intake/v1');assert.equal(declaration.declarationHash,'610576cc9914b8562553faadfd5d33a4f4b2b5ca155ee4a1e3143d512a438328');assert.equal(await hashBytes(keyed.rgba),'d678ef8f40fbba78aad87ac546bdf4682aeb7c120cdb5e7fd2ea36bc2479bc48');assert.equal(await hashBytes(labelBytes),declaration.labelsSha256);
 const {cutKeyedParts}=await load('port/v2/tools/creature-animation/keyed-part-labels.mjs'),r=await cutKeyedParts(record,master,keyed.rgba,labels,declaration);
 assert.notEqual(await hashBytes(fresh.rgba),declaration.keyedRgbaSha256);
 await assert.rejects(cutKeyedParts(record,master,fresh.rgba,labels,declaration),/changed keyed RGBA/);
 if(process.env.CF_GREEN_HISTORICAL){const baseline=await import(pathToFileURL(root+'/port/v2/tools/creature-animation/keyed-part-labels.mjs').href);await assert.rejects(baseline.cutKeyedParts(record,master,fresh.rgba,labels,declaration),/changed keyed RGBA/);}

 assert.equal(r.receipt.restDifferentChannels,0);assert.equal(r.receipt.declarationHash,declaration.declarationHash);assert.equal(r.receipt.keying,undefined);assert.deepEqual(fs.readFileSync(fit+'/declaration.json'),declarationBytes);
 outcomes.push({name:'stored-aphid-v1',status:'PASS',recordRecipeHash:record.recipeHash,declarationHash:declaration.declarationHash,keyedRgbaSha256:declaration.keyedRgbaSha256,labelsSha256:declaration.labelsSha256,freshRekeySha256:await hashBytes(fresh.rgba),freshRekeyMatchesHistoricalSeal:await hashBytes(fresh.rgba)===declaration.keyedRgbaSha256,preExistingFreshRekeyRefusal:'Keyed labels: changed keyed RGBA',parts:r.parts.length,restDifferentChannels:r.receipt.restDifferentChannels});
});

test('TypeScript green and default keyer callers typecheck while unsupported key is rejected',()=>{
 const scratch=fs.mkdtempSync(path.join(process.env.CF_GREEN_SCRATCH_ROOT??os.tmpdir(),'key-color-types-'));
 try{
  fs.writeFileSync(scratch+'/types.mts',`import {keyAndDespill} from '${moduleRoot}/tools/local-image-generation/kit-contact-math.mjs';
 const rgba=new Uint8ClampedArray(4);
 keyAndDespill(rgba,1,1);
 keyAndDespill(rgba,1,1,{keyColor:'green'});
 keyAndDespill(rgba,1,1,{terrainLayer:true,keyColor:'magenta'});
 // @ts-expect-error unsupported key must remain rejected
 keyAndDespill(rgba,1,1,{keyColor:'blue'});`);
  fs.writeFileSync(scratch+'/tsconfig.json',JSON.stringify({compilerOptions:{noEmit:true,strict:true,skipLibCheck:true,target:'ES2022',module:'NodeNext',moduleResolution:'NodeNext',types:[]},files:['./types.mts']}));
  const cli=path.join(path.dirname(req.resolve('typescript/package.json')),'bin/tsc'),r=spawnSync(process.execPath,[cli,'--project',scratch+'/tsconfig.json'],{cwd:root,encoding:'utf8',timeout:15000});
  assert.equal(r.status,0,r.stdout+r.stderr+(r.error?.message??''));
 }finally{fs.rmSync(scratch,{recursive:true});}
});
