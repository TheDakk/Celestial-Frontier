import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const writeJson=(name,value)=>fs.writeFile(path.join(here,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const sources=new Map();
const remember=async file=>{if(!sources.has(file)){const data=await fs.readFile(file);sources.set(file,{path:path.relative(root,file),bytes:data.length,sha256:sha(data)});}};
const record={schema:'cf.landfall-conditioning-check/v1',status:'FAIL',node:process.version,
  command:'/opt/homebrew/bin/node tools/with-toolchain-lock.mjs --label canonical-conditioning-corrected-check -- /opt/homebrew/bin/node audits/AI_GAME_INTEGRATION_20260909/conditioning-check-02.mjs',
  startedAt:new Date().toISOString(),sources:[],warnings:[],tokenizerExecuted:false,testsExecuted:false};
let release,bundle;
try{
  release=acquireWorkspaceLock('canonical conditioning compiler and focused tests');
  const v2Require=createRequire(path.join(root,'port/v2/package.json'));
  const {rolldown}=await import(pathToFileURL(v2Require.resolve('rolldown')).href);
  record.rolldown=JSON.parse(await fs.readFile(v2Require.resolve('rolldown/package.json'),'utf8')).version;
  for(const file of [fileURLToPath(import.meta.url),path.join(root,'port/v2/apps/game/src/landfall-conditioning.ts'),
    path.join(root,'port/v2/tests/landfall-conditioning.test.ts'),path.join(root,'tools/local-image-generation/model-manifest.json'),
    path.join(root,'tools/local-image-generation/stage-worker.mjs'),path.join(root,'tools/local-image-generation/proof-server.mjs')])await remember(file);
  const virtual='\0canonical-conditioning-review';
  const entry=`import {produceCanonicalEarthSnapshot} from ${JSON.stringify(path.join(root,'port/v2/tools/landfall-snapshot/entry.ts'))};\n`+
    `import {buildLandfallConditioningV1} from ${JSON.stringify(path.join(root,'port/v2/apps/game/src/landfall-conditioning.ts'))};\n`+
    `export const result=buildLandfallConditioningV1(produceCanonicalEarthSnapshot().snapshot);\n`;
  record.virtualEntry={source:entry,sha256:sha(entry)};
  bundle=await rolldown({input:virtual,platform:'node',onLog(level,log,handler){if(level==='warn')record.warnings.push({code:log.code,message:log.message});handler(level,log);},
    plugins:[{name:'canonical-conditioning-review',resolveId(id){if(id===virtual)return id;},load(id){if(id===virtual)return entry;},
      async transform(_code,id){if(path.isAbsolute(id))await remember(id);},
      generateBundle(){for(const id of this.getModuleIds())if(this.getModuleInfo(id)?.isExternal)throw Error('External module refused: '+id);}}]});
  const generated=await bundle.generate({format:'es',codeSplitting:false});
  if(generated.output.length!==1||generated.output[0].type!=='chunk'||generated.output[0].imports.length)throw Error('Unexpected compiler bundle');
  const code=generated.output[0].code,producer=path.join(here,'conditioning-producer-02.mjs');
  await fs.writeFile(producer,code,{flag:'wx'});record.producer={path:path.relative(root,producer),bytes:Buffer.byteLength(code),sha256:sha(code)};
  const {result}=await import(pathToFileURL(producer).href);
  if(!result?.ok||JSON.stringify(result.recipe)!==result.canonicalJson)throw Error('Canonical compiler refused its source snapshot');
  const directory=path.join(root,'tools/local-image-generation');
  const manifest=JSON.parse(await fs.readFile(path.join(directory,'model-manifest.json'),'utf8'));
  const cache=path.join(root,'port/v2/apps/game/smoke/local-image-generation',manifest.modelId.replace('/','--'),manifest.revision);
  const tokenizerFiles=[];
  for(const name of ['tokenizer/tokenizer.json','tokenizer/tokenizer_config.json']){
    const expected=manifest.files.find(row=>row.path===name);if(!expected)throw Error('Missing pinned tokenizer metadata');
    const bytes=await fs.readFile(path.join(cache,name));
    if(bytes.length!==expected.bytes||sha(bytes)!==expected.sha256)throw Error('Pinned tokenizer bytes changed: '+name);
    tokenizerFiles.push({path:name,bytes:bytes.length,sha256:sha(bytes),json:JSON.parse(bytes.toString('utf8'))});
  }
  const runtime=path.join(directory,'node_modules/@huggingface/tokenizers');
  const runtimePackage=JSON.parse(await fs.readFile(path.join(runtime,'package.json'),'utf8'));
  if(runtimePackage.version!=='0.2.0')throw Error('Tokenizer runtime version changed');
  const tokenizerModule=path.join(runtime,'dist/tokenizers.mjs');await remember(tokenizerModule);
  const {Tokenizer}=await import(pathToFileURL(tokenizerModule).href);
  const tokenizer=new Tokenizer(tokenizerFiles[0].json,tokenizerFiles[1].json);
  // Exact existing proof-server wrapper; no truncation or hidden extra template.
  const chatPrompt='<|im_start|>user\n'+result.recipe.prompt+'<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n';
  const worker=await fs.readFile(path.join(directory,'stage-worker.mjs'),'utf8');
  const server=await fs.readFile(path.join(directory,'proof-server.mjs'),'utf8');
  if(!worker.includes('tokenizer.encode(job.chatPrompt,{add_special_tokens:false}).ids')
    ||!server.includes("chatPrompt:'<|im_start|>user\\n'+identityPrompt+'<|im_end|>\\n<|im_start|>assistant\\n<think>\\n\\n</think>\\n\\n'"))
    throw Error('Existing tokenizer/chat source contract changed');
  const ids=tokenizer.encode(chatPrompt,{add_special_tokens:false}).ids;
  record.tokenizerExecuted=true;
  const tokenReceipt={status:ids.length<=512?'PASS':'FAIL',runtime:runtimePackage.version,modelId:manifest.modelId,revision:manifest.revision,
    tokenizerFiles:tokenizerFiles.map(({json,...row})=>row),tokenCount:ids.length,maximumTokens:512,
    addSpecialTokens:false,truncation:false,padding:'right',padTokenId:tokenizer.token_to_id('<|endoftext|>'),
    idsSha256:sha(JSON.stringify(ids)),chatPrompt,chatPromptSha256:sha(chatPrompt),prompt:result.recipe.prompt,
    snapshotSha256:sha(JSON.stringify(result.recipe.sourceSnapshot)),conditioningSha256:sha(result.canonicalJson),
    referenceRequirement:result.recipe.referenceRequirements[0],qualityAccepted:false};
  await writeJson('conditioning-tokenizer-02.json',tokenReceipt);
  record.tokenCount=ids.length;
  if(ids.length>512)throw Error(`Prompt has ${ids.length} tokens; refusing silent truncation beyond512`);
  if(tokenReceipt.padTokenId!==151643)throw Error('Pinned padding token changed');
  const args=['node_modules/vitest/vitest.mjs','run','tests/landfall-conditioning.test.ts','--reporter=verbose'];
  record.testCommand={executable:process.execPath,args,cwd:'port/v2'};
  record.testsExecuted=true;const started=performance.now();
  const test=spawnSync(process.execPath,args,{cwd:path.join(root,'port/v2'),encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024,env:{...process.env,NO_COLOR:'1'}});
  record.testDurationMs=performance.now()-started;record.testExitCode=test.status;record.testSignal=test.signal;
  record.testError=test.error?.message??null;
  await fs.writeFile(path.join(here,'conditioning-tests-02.stdout.log'),test.stdout??'',{flag:'wx'});
  await fs.writeFile(path.join(here,'conditioning-tests-02.stderr.log'),test.stderr??'',{flag:'wx'});
  const stdout=(test.stdout??'').replace(/\x1b\[[0-9;]*m/g,'');
  record.testSummary=stdout.match(/Test Files[^\n]*\n[^\n]*Tests[^\n]*/)?.[0]??null;
  if(test.status!==0||test.error||test.signal)throw Error('Focused compiler test process failed');
  if(!/Tests\s+16 passed \(16\)/.test(stdout))throw Error('Expected all sixteen focused cases');
  for(const [file,before]of sources){const bytes=await fs.readFile(file);if(bytes.length!==before.bytes||sha(bytes)!==before.sha256)throw Error('Source changed during check: '+before.path);}
  record.status='PASS';
}catch(error){record.error=String(error.stack??error);process.exitCode=1;}
finally{
  try{await bundle?.close();}catch(error){record.status='FAIL';record.bundleCleanupError=String(error);process.exitCode=1;}
  try{release?.();record.workspaceReleased=Boolean(release);}catch(error){record.status='FAIL';record.workspaceCleanupError=String(error);process.exitCode=1;}
  record.sources=[...sources.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);record.finishedAt=new Date().toISOString();
  await writeJson('conditioning-check-02.json',record);
  console.log(JSON.stringify({status:record.status,tokenCount:record.tokenCount,testsExecuted:record.testsExecuted,testSummary:record.testSummary,error:record.error}));
}
