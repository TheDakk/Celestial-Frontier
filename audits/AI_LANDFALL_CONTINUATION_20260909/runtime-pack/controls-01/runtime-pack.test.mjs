import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildRuntimePack,verifyRuntimePack,validateRuntimeSourcePins,RUNTIME_SOURCE_PINS,SHIPPED_PACK_LIMIT,RETAINED_UPDATE_LIMIT} from './runtime-pack.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const pins=JSON.parse(await fs.readFile(RUNTIME_SOURCE_PINS,'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
let temporary,sourceRoot,installed,output,releaseWorkspace,sequence=0;
const next=()=>path.join(temporary,'output-'+(++sequence));
before(async()=>{
  releaseWorkspace=acquireWorkspaceLock('static runtime pack controls');
  temporary=await fs.mkdtemp('/private/tmp/cf-runtime-pack-controls-');sourceRoot=path.join(temporary,'source');
  for(const row of pins.files){const target=path.join(sourceRoot,row.source);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(ROOT,row.source),target);}
  console.log('Runtime pack control artifacts: '+temporary);
});
after(async()=>{
  // Only test-owned fixture copies are removed; retain the verified output and
  // manifest for review. No installed package/source is ever written by tests.
  try{if(sourceRoot)await fs.rm(sourceRoot,{recursive:true,force:true});}finally{releaseWorkspace?.();}
});
async function changedSource(source,mutate,run){
  const file=path.join(sourceRoot,source),original=await fs.readFile(file);
  try{await mutate(file,original);await run(file);}finally{await fs.rm(file,{force:true});await fs.writeFile(file,original,{flag:'wx'});}
}
async function absent(file){await assert.rejects(fs.lstat(file),{code:'ENOENT'});}
const options=output=>({output,sourceRoot});

test('builds the exact installed Asyncify closure, verifies all bytes, and repeats deterministically',async()=>{
  output=next();installed=await buildRuntimePack(options(output));
  assert.equal(installed.status,'PASS');assert.equal(installed.distributionQualified,false);
  assert.equal(installed.combinedAppAdmissionQualified,false);assert.equal(installed.retainedUpdateQualified,false);
  assert.ok(installed.totalBytes<SHIPPED_PACK_LIMIT);assert.equal(SHIPPED_PACK_LIMIT,134217728);assert.equal(RETAINED_UPDATE_LIMIT,268435456);
  const manifest=JSON.parse(await fs.readFile(path.join(output,'runtime-pack-manifest.json'),'utf8'));
  assert.equal(manifest.fileCount,manifest.files.length);
  assert.equal(manifest.files.reduce((sum,row)=>sum+row.bytes,0)+installed.manifestBytes,installed.totalBytes);
  assert.ok(manifest.files.some(row=>row.path.endsWith('/ort-wasm-simd-threaded.asyncify.wasm')));
  assert.ok(manifest.closure.some(edge=>edge.kind==='reviewed-lazy-wasm'&&edge.to.endsWith('asyncify.wasm')));
  assert.ok(manifest.files.every(row=>!/(?:\.onnx|\.data|jsep|\.map)$/.test(row.path)));
  assert.ok(manifest.files.some(row=>row.path.endsWith('ThirdPartyNotices.txt')));
  assert.ok(manifest.files.some(row=>row.path.endsWith('diffusers-040c7cd-LICENSE')));
  const config=JSON.parse(await fs.readFile(path.join(output,'__local_ai/runtime.json'),'utf8'));
  assert.equal(config.schema,'cf.local-ai-runtime-pack.v1');assert.equal(config.modelSource,'verified-opfs-only');
  assert.deepEqual(config.modelFiles,{});assert.equal(config.q8Block32,false);assert.equal(config.autoDownload,false);
  assert.equal(config.workerUrl,'/__local_ai/stage-worker.mjs');assert.equal(config.reference.url,'/__local_ai/reference.png');
  assert.equal(config.reference.width,480);assert.equal(config.reference.height,320);assert.equal(config.qualityAccepted,false);
  assert.equal(config.sourceManifestSha256,hash(await fs.readFile(path.join(ROOT,pins.modelManifest))));
  const second=await buildRuntimePack(options(next()));assert.equal(second.manifestSha256,installed.manifestSha256);
  assert.equal(second.totalBytes,installed.totalBytes);
  await assert.rejects(verifyRuntimePack({directory:output}),/external manifest SHA/);
});

test('missing installed lazy WASM refuses output before publication',async()=>{
  const source='tools/local-image-generation/node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.wasm',destination=next();
  await changedSource(source,file=>fs.rm(file),async()=>{await assert.rejects(buildRuntimePack(options(destination)),{code:'ENOENT'});await absent(destination);});
});

test('same-length modified installed tokenizer refuses pinned hash and restored source builds',async()=>{
  const source='tools/local-image-generation/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs',destination=next();
  await changedSource(source,async(file,bytes)=>{const changed=Buffer.from(bytes);changed[0]^=1;await fs.writeFile(file,changed);},
    async()=>{await assert.rejects(buildRuntimePack(options(destination)),/Pinned source SHA mismatch/);await absent(destination);});
  // First successful build above plus this restored build prove the refusal is
  // tied to the changed bytes, not a permanently unusable output/source setup.
  assert.equal((await buildRuntimePack(options(destination))).manifestSha256,installed.manifestSha256);
});

test('changed installed package version or lock integrity refuses without creating output',async()=>{
  for(const source of [pins.dependencies[0].packageJson,pins.packageLock]){
    const destination=next();await changedSource(source,async(file,bytes)=>{
      const data=JSON.parse(bytes);if(source===pins.packageLock)data.packages['node_modules/onnxruntime-web'].integrity='sha512-changed';else data.version='1.29.1';
      await fs.writeFile(file,JSON.stringify(data));},async()=>{await assert.rejects(buildRuntimePack(options(destination)),/Pinned source (?:size|SHA) mismatch/);await absent(destination);});
  }
});

test('missing required license source refuses readiness',async()=>{
  const source=pins.files.find(row=>row.target?.endsWith('onnxruntime-2e2543f-ThirdPartyNotices.txt')).source,destination=next();
  await changedSource(source,file=>fs.rm(file),async()=>{await assert.rejects(buildRuntimePack(options(destination)),{code:'ENOENT'});await absent(destination);});
});

test('source symlinks and output symlink ancestors are refused',async()=>{
  const source='tools/local-image-generation/stage-worker.mjs',destination=next();
  await changedSource(source,async file=>{await fs.rm(file);await fs.symlink(path.join(ROOT,source),file);},
    async()=>{await assert.rejects(buildRuntimePack(options(destination)),/Unsafe source/);await absent(destination);});
  const link=path.join(temporary,'linked-parent');await fs.symlink(temporary,link);
  try{await assert.rejects(buildRuntimePack(options(path.join(link,'child'))),/Unsafe output ancestor/);}finally{await fs.unlink(link);}
});

test('existing output is unchanged instead of being overwritten',async()=>{
  const destination=next();await fs.mkdir(destination);await fs.writeFile(path.join(destination,'retained.txt'),'earlier artifact');
  await assert.rejects(buildRuntimePack(options(destination)),/already exists/);
  assert.deepEqual(await fs.readdir(destination),['retained.txt']);assert.equal(await fs.readFile(path.join(destination,'retained.txt'),'utf8'),'earlier artifact');
});

test('unsafe paths, model targets, duplicate targets and cap inflation are rejected in source pins',()=>{
  for(const bad of ['../escape','/absolute','x/%2e%2e/y','x\\y','x//y']){
    const changed=structuredClone(pins);changed.files[0].source=bad;assert.throws(()=>validateRuntimeSourcePins(changed),/Unsafe/);
  }
  const weighted=structuredClone(pins);weighted.files.find(row=>row.target!==null).target='__local_ai/model.onnx';
  assert.throws(()=>validateRuntimeSourcePins(weighted),/Unsafe\/model/);
  const duplicated=structuredClone(pins),emitted=duplicated.files.filter(row=>row.target!==null);emitted[1].target=emitted[0].target;
  assert.throws(()=>validateRuntimeSourcePins(duplicated),/Unsafe\/model\/duplicate/);
  const tooLarge=structuredClone(pins);tooLarge.files.find(row=>row.target!==null).bytes=SHIPPED_PACK_LIMIT;
  assert.throws(()=>validateRuntimeSourcePins(tooLarge),/128 MiB/);
});

test('new static import is refused even if an explicit fixture pin is updated to its changed bytes',async()=>{
  const source='tools/local-image-generation/stage-worker.mjs',destination=next(),fixturePins=structuredClone(pins);
  await changedSource(source,async(file,bytes)=>{
    const changed=Buffer.concat([Buffer.from("import './unpackaged-helper.mjs';\n"),bytes]);await fs.writeFile(file,changed);
    const row=fixturePins.files.find(row=>row.source===source);row.bytes=changed.length;row.sha256=hash(changed);
  },async()=>{
    const pinsPath=path.join(temporary,'explicit-changed-fixture-pins.json');await fs.writeFile(pinsPath,JSON.stringify(fixturePins));
    await assert.rejects(buildRuntimePack({...options(destination),pinsPath}),/Unpackaged static runtime import/);await absent(destination);
  });
});

test('verifier rejects changed payload and restored payload passes against the same external manifest',async()=>{
  const file=path.join(output,'__local_ai/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs'),original=await fs.readFile(file);
  try{const changed=Buffer.from(original);changed[0]^=1;await fs.writeFile(file,changed);
    await assert.rejects(verifyRuntimePack({directory:output,expectedManifestSha256:installed.manifestSha256}),/Pinned source SHA mismatch/);
  }finally{await fs.writeFile(file,original);}
  assert.equal((await verifyRuntimePack({directory:output,expectedManifestSha256:installed.manifestSha256})).status,'PASS');
});

test('verifier rejects substituted manifest, unsafe manifest paths and unmanifested files',async()=>{
  const file=path.join(output,'runtime-pack-manifest.json'),original=await fs.readFile(file);
  try{const modified=JSON.parse(original);modified.modelSource='developer-cache';const bytes=Buffer.from(JSON.stringify(modified));await fs.writeFile(file,bytes);
    await assert.rejects(verifyRuntimePack({directory:output,expectedManifestSha256:installed.manifestSha256}),/manifest SHA mismatch/);
    modified.modelSource='verified-opfs-only';modified.files[0].path='../escape';const unsafe=Buffer.from(JSON.stringify(modified));await fs.writeFile(file,unsafe);
    await assert.rejects(verifyRuntimePack({directory:output,expectedManifestSha256:hash(unsafe)}),/Unsafe\/duplicate/);
  }finally{await fs.writeFile(file,original);}
  const extra=path.join(output,'unexpected.bin');await fs.writeFile(extra,'not inventoried');
  try{await assert.rejects(verifyRuntimePack({directory:output,expectedManifestSha256:installed.manifestSha256}),/Uninventoried/);}finally{await fs.unlink(extra);}
  assert.equal((await verifyRuntimePack({directory:output,expectedManifestSha256:installed.manifestSha256})).status,'PASS');
});
