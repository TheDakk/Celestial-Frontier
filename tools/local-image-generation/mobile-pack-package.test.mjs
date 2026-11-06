/** Local package controls require an externally verified, newly built package.
 * Mutants modify only a temporary copy; the original and source stay frozen. */
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyMobilePack,createMobilePackServer} from './mobile-pack.mjs';
const source=process.env.CF_MOBILE_PACKAGE_DIR,expectedManifestSha256=process.env.CF_MOBILE_PACKAGE_SHA;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let directory,release,manifest,server;
before(async()=>{
  assert.equal(typeof source,'string');assert.match(expectedManifestSha256??'',/^[a-f0-9]{64}$/);
  await verifyMobilePack({directory:source,expectedManifestSha256});
  directory=path.join(await fs.mkdtemp('/private/tmp/cf-mobile-package-controls-'),'package');await fs.cp(source,directory,{recursive:true,errorOnExist:true,force:false});
  manifest=JSON.parse(await fs.readFile(path.join(directory,'mobile-pack-manifest.json'),'utf8'));
  console.log('Externally bound source package: '+source+' SHA '+expectedManifestSha256);
  console.log('Control-only package copy retained: '+directory);
});
after(async()=>{try{await server?.close();}finally{release?.();}});
const verify=()=>verifyMobilePack({directory,expectedManifestSha256});
async function change(relative,mutate,run){const file=path.join(directory,relative),original=await fs.readFile(file);
  try{await mutate(file,original);await run();}finally{await fs.rm(file,{force:true});await fs.writeFile(file,original,{flag:'wx'});}}

test('complete app plus six-reference runtime passes exact manifest, PWA table and both static payload limits',async()=>{
  const result=await verify();assert.equal(result.status,'PASS');assert.ok(result.totalBytes<134217728);
  assert.equal(result.budget.retainedStaticBytes,result.totalBytes*2);assert.ok(result.budget.retainedStaticBytes<268435456);
  assert.equal(result.distributionQualified,false);assert.equal(result.physicalPhoneQualified,false);assert.equal(result.fullModelInstallQualified,false);
  assert.equal(manifest.modelWeightsIncluded,false);assert.equal(manifest.modelAutoDownload,false);
  await assert.rejects(verifyMobilePack({directory}),/External mobile manifest SHA/);
});

test('same-length runtime change fails, restoring exact bytes passes',async()=>{
  const relative=manifest.files.find(row=>row.path==='__local_ai/stage-worker.mjs').path;
  await change(relative,async(file,bytes)=>{const changed=Buffer.from(bytes);changed[0]^=1;await fs.writeFile(file,changed);},
    async()=>{await assert.rejects(verify(),/inventory mismatch/);});
  assert.equal((await verify()).status,'PASS');
});

test('runtime/file omission and symlink substitution fail without treating unrelated application files as trusted runtime',async()=>{
  const relative=manifest.files.find(row=>row.path.endsWith('.wasm')).path;
  await change(relative,file=>fs.unlink(file),async()=>{await assert.rejects(verify(),/inventory mismatch/);});
  await change(relative,async file=>{await fs.unlink(file);await fs.symlink(path.join(source,relative),file);},async()=>{await assert.rejects(verify(),/Unsafe/);});
  assert.equal((await verify()).status,'PASS');
});

test('unlisted app files, model weights and source maps refuse readiness',async()=>{
  for(const relative of ['unexpected.js','model.onnx','model.data','source.js.map']){
    const file=path.join(directory,relative);await fs.writeFile(file,'unlisted control',{flag:'wx'});
    try{await assert.rejects(verify(),/inventory mismatch|Model\/source-map/);}finally{await fs.unlink(file);}}
  assert.equal((await verify()).status,'PASS');
});

test('unlisted empty directories are rejected and removal restores the same verified package',async()=>{
  const empty=path.join(directory,'unexpected-empty');await fs.mkdir(empty);
  try{await assert.rejects(verify(),/Uninventoried empty/);}finally{await fs.rmdir(empty);}
  assert.equal((await verify()).status,'PASS');
});

test('substituted manifest or promoted physical-device/distribution flags refuse even with fixture digest updated',async()=>{
  await change('mobile-pack-manifest.json',async(file,bytes)=>{
    const value=JSON.parse(bytes);value.physicalPhoneQualified=true;const changed=Buffer.from(JSON.stringify(value));await fs.writeFile(file,changed);
  },async()=>{
    await assert.rejects(verify(),/manifest SHA mismatch/);
    const changed=await fs.readFile(path.join(directory,'mobile-pack-manifest.json'));
    await assert.rejects(verifyMobilePack({directory,expectedManifestSha256:sha(changed)}),/qualification/);
  });assert.equal((await verify()).status,'PASS');
});

test('local static server has exact headers, MIME, initial query route and genuine missing-asset refusal',async()=>{
  server=await createMobilePackServer({directory,expectedManifestSha256});
  const index=await fetch(server.url+'?localai=1');assert.equal(index.status,200);assert.match(await index.text(),/cf-pwa-enabled/);
  for(const [name,value]of [['cross-origin-opener-policy','same-origin'],['cross-origin-embedder-policy','require-corp'],
    ['cross-origin-resource-policy','same-origin'],['x-content-type-options','nosniff']])assert.equal(index.headers.get(name),value);
  const wasm=manifest.files.find(row=>row.path.endsWith('.wasm'));
  const response=await fetch(new URL(wasm.path,server.url),{method:'HEAD'});assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'application/wasm');assert.equal(Number(response.headers.get('content-length')),wasm.bytes);
  for(const suffix of ['__local_ai/missing.mjs','missing.html','__local_ai/runtime.json?changed=1']){
    const missing=await fetch(server.url+suffix);assert.equal(missing.status,404);assert.doesNotMatch(await missing.text(),/<html/);}
  assert.equal((await fetch(server.url,{method:'POST'})).status,405);
});

test('static server refuses modified bytes after startup and succeeds only after exact restoration',async()=>{
  await change('__local_ai/runtime.json',async(file,bytes)=>{const changed=Buffer.from(bytes);changed[0]^=1;await fs.writeFile(file,changed);},
    async()=>{const response=await fetch(server.url+'__local_ai/runtime.json');assert.equal(response.status,500);});
  assert.equal((await fetch(server.url+'__local_ai/runtime.json')).status,200);
  await server.close();server=null;assert.equal((await verify()).status,'PASS');
});
