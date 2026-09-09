import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {createProofServer} from './proof-server.mjs';
import {fetchModel,assertIgnoredCache,DEFAULT_CACHE_ROOT} from './fetch-model.mjs';
import {parseProofOptions} from './gpu-profile.mjs';
import {recheckSourceFiles} from './source-integrity.mjs';
import {exportCanonicalEarthSnapshot} from '../../port/v2/tools/landfall-snapshot/export.mjs';
const directory=path.dirname(fileURLToPath(import.meta.url));
const runCommand=promisify(execFile);
const options=parseProofOptions(process.argv.slice(2)),{output}=options;
const destination=path.resolve(output);await fs.mkdir(destination,{recursive:true});
const resultPath=path.join(destination,'result.json');
try{await fs.access(resultPath);throw Error('Evidence destination already completed; choose a new directory');}catch(e){if(e.code!=='ENOENT')throw e;}
const manifest=JSON.parse(await fs.readFile(path.join(directory,'model-manifest.json'),'utf8'));
const cacheDir=path.join(DEFAULT_CACHE_ROOT,manifest.modelId.replace('/','--'),manifest.revision);
await assertIgnoredCache(cacheDir);
const receipt={schema:'cf.browser-image-proof-run/v1',startedAt:new Date().toISOString(),status:'FAIL',
  referenceEnabled:options.referenceEnabled,preflight:options.preflight,
  identityReference:options.identityReference,identityOnly:options.identityOnly,profile:options.profile,q8Block32:options.q8Block32,width:options.width,height:options.height,profiles:[],
  modelRevision:manifest.revision,sourceSha256:{},events:[],memory:[],browserEvents:[],qualityAccepted:false};
for(const name of await fs.readdir(directory))if(/\.(mjs|json|html)$/.test(name))receipt.sourceSha256[name]=createHash('sha256').update(await fs.readFile(path.join(directory,name))).digest('hex');
await fs.writeFile(path.join(destination,'start.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
let server,cdp;
try{
  const canonical=await exportCanonicalEarthSnapshot(path.join(destination,'canonical-input'));
  receipt.canonicalExport=canonical.receipt;
  if(!receipt.preflight){
    const verified=await fetchModel({manifest,cacheDir,verifyOnly:true});
    receipt.modelVerification=verified.receipt;
  }
  server=await createProofServer({cacheDir,canonical,identityReference:receipt.identityReference,identityOnly:receipt.identityOnly,width:receipt.width,height:receipt.height,q8Block32:receipt.q8Block32});
  receipt.runtimeFiles=server.runtimeFiles;
  await fs.writeFile(path.join(destination,'recipe.json'),JSON.stringify(server.recipe,null,2)+'\n',{flag:'wx'});
  cdp=await openChromiumCdp({label:'CF browser image inference',userDataPrefix:'cf-browser-image-',commandTimeoutMs:45000,onEvent:event=>{
    if(['Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed'].includes(event.method))receipt.browserEvents.push(event);
  }});
  receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
  const {targetId}=await cdp.send('Target.createTarget',{url:server.url});
  const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});
  await cdp.send('Runtime.enable',{},sessionId);await cdp.send('Log.enable',{},sessionId);
  const evaluate=async expression=>{
    const response=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
    if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description??response.exceptionDetails.text);
    return response.result.value;
  };
  const readyDeadline=performance.now()+15000;
  while(!await evaluate('!!window.cfImageProof')){if(performance.now()>readyDeadline)throw Error('Proof page failed to initialize');await new Promise(r=>setTimeout(r,100));}
  if(receipt.preflight){
    receipt.page=await evaluate(`({state:window.cfImageProof.state,crossOriginIsolated,webgpu:!!navigator.gpu})`);
    if(!receipt.page.crossOriginIsolated||!receipt.page.webgpu)throw Error('Page capability boundary failed');
    const served=await evaluate(`fetch('/recipe.json').then(response=>{if(!response.ok)throw Error('Recipe HTTP failed');return response.json();})`);
    if(JSON.stringify(served)!==JSON.stringify(server.recipe))throw Error('Served canonical recipe mismatch');
    receipt.page.servedRecipeSha256=createHash('sha256').update(JSON.stringify(served)).digest('hex');
    receipt.page.canonicalRecipeMatched=true;
    receipt.status='PREFLIGHT_PASS';
  }else{
    await evaluate(`void window.cfImageProof.generate({referenceEnabled:${receipt.referenceEnabled},profile:${receipt.profile}})`);
    const deadline=performance.now()+25*60*1000;let delivered=0;
    while(true){
      const state=await evaluate(`({state:window.cfImageProof.state,error:window.cfImageProof.error,records:window.cfImageProof.records,heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null})`);
      receipt.events=state.records;receipt.pageHeap=state.heap;
      if(receipt.profile){
        // Retrieve each bounded raw trace once, outside the frequently polled
        // records/DOM text. Save partial red traces too, before propagating failure.
        const pending=await evaluate(`window.cfImageProof.profiles.slice(${receipt.profiles.length})`);
        for(const profile of pending){
          if(receipt.profiles.length>=5)throw Error('Excess profile stages');
          const index=receipt.profiles.length+1;
          if(!['text','encode','denoise','decode'].includes(profile.stage))throw Error('Unexpected profile stage');
          const file=`native-profile-${index}-${profile.stage}.json`;
          const {rawJson,...summary}=profile;
          if(typeof rawJson==='string'){
            await fs.writeFile(path.join(destination,file),rawJson,{flag:'wx'});
            summary.rawFile=file;summary.rawSha256=createHash('sha256').update(rawJson).digest('hex');
          }
          receipt.profiles.push(summary);
          await fs.writeFile(path.join(destination,`native-profile-${index}-${profile.stage}-summary.json`),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
        }
      }
      if(state.records.length>delivered){for(const row of state.records.slice(delivered))console.log(JSON.stringify(row));delivered=state.records.length;
        await fs.writeFile(path.join(destination,'progress.json'),JSON.stringify({events:receipt.events,memory:receipt.memory},null,2)+'\n');}
      const {stdout}=await runCommand('/bin/ps',['-axo','pid=,ppid=,rss=']);
      const rows=stdout.trim().split('\n').map(line=>line.trim().split(/\s+/).map(Number));
      const owned=new Set([cdp.pid]);let grew=true;while(grew){grew=false;for(const [pid,ppid]of rows)if(owned.has(ppid)&&!owned.has(pid)){owned.add(pid);grew=true;}}
      receipt.memory.push({atMs:performance.now(),processCount:owned.size,summedProcessRssKiB:rows.filter(row=>owned.has(row[0])).reduce((sum,row)=>sum+row[2],0)});
      if(state.state==='failed')throw Error(state.error);
      if(state.state==='complete'){
        if(receipt.profile){
          const expectedStages=['text',...(receipt.referenceEnabled?server.recipe.references.map(()=> 'encode'):[]),'denoise','decode'];
          if(JSON.stringify(receipt.profiles.map(x=>x.stage))!==JSON.stringify(expectedStages)
            ||receipt.profiles.some(x=>x.state!=='complete'||!x.endedBeforeRelease||!x.sessionReleased||x.summary?.status!=='COMPLETE'
              ||x.summary.dropped!==0||x.summary.invalid!==0||!x.rawFile))throw Error('Native profile completion contract failed');
        }
        const png=await evaluate('window.cfImageProof.png');if(!png?.startsWith('data:image/png;base64,'))throw Error('No generated PNG');
        const bytes=Buffer.from(png.slice('data:image/png;base64,'.length),'base64');
        receipt.output={file:'raw-output.png',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
        await fs.writeFile(path.join(destination,receipt.output.file),bytes,{flag:'wx'});
        receipt.status='INFERENCE_COMPLETE_REVIEW_PENDING';break;
      }
      if(performance.now()>deadline)throw Error('Overall inference deadline exceeded');
      await new Promise(r=>setTimeout(r,5000));
    }
  }
}catch(error){receipt.error=String(error.stack??error);process.exitCode=1;}
finally{
  try{await cdp?.close();receipt.browserClosed=true;}catch(error){receipt.cleanupError=String(error);process.exitCode=1;receipt.status='FAIL';}
  if(server){receipt.requests=server.requests;try{await server.close();}catch(error){receipt.serverCleanupError=String(error);receipt.status='FAIL';process.exitCode=1;}}
  receipt.finishedAt=new Date().toISOString();
  receipt.memoryMeaning='Sum of owned browser process RSS; shared mappings may count multiple times. Not unique RAM, VRAM or a device qualification.';
  receipt.sourceIntegrity=await recheckSourceFiles([
    ...Object.entries(receipt.sourceSha256).map(([name,hash])=>({path:'tools/local-image-generation/'+name,file:path.join(directory,name),sha256:hash})),
    ...(receipt.canonicalExport?.sources??[]).map(row=>({...row,file:path.resolve(directory,'../..',row.path)})),
  ]);
  receipt.sourceUnchanged=receipt.sourceIntegrity.unchanged;
  if(!receipt.sourceUnchanged){receipt.status='FAIL';process.exitCode=1;}
  await fs.writeFile(resultPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:receipt.status,error:receipt.error,output:receipt.output,resultPath}));
}
