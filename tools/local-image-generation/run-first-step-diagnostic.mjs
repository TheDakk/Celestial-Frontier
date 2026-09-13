/** One explicit, source-frozen diagnostic. Real pinned Workers and actual product
 * input preparation, with first-step opt-in and intentional product abort. No
 * full painting/UI/offline proof, new model download, or unchanged automatic retry. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {createGamePreviewServer} from './game-preview-server.mjs';
import {recheckSourceFiles} from './source-integrity.mjs';
import {runFirstStepInPage,assessFirstStepEvidence} from './first-step-harness.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(value,message)=>{if(!value)throw Error(message);};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const INPUT='audits/AI_OFFLINE_INTEGRATION_20260909/native-02/actual-landfall-input.json';
const EXPECTED_RECIPE='43d256089080d69bdea6bcf882dd080f95af43d8a6084f60c12204cb7523a06d';
export async function runFirstStepDiagnostic({output}) {
  output=path.resolve(output);need(output.startsWith(path.join(root,'audits')+path.sep),'New repository audit path required');
  await fs.mkdir(output,{recursive:false});
  const receipt={schema:'cf.portable-first-step-run.v1',status:'FAIL',startedAt:new Date().toISOString(),
    scope:'Diagnostic native workers; actual product preparation; exact portable six-reference first step only.',
    sources:[],records:[],browserEvents:[],cleanup:{},qualityAccepted:false,physicalPhoneQualified:false,
    actualModelDownloaded:false,imageGenerated:false,normalInGameQualified:false};
  const write=(file,value)=>fs.writeFile(path.join(output,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
  await write('start.json',receipt);
  let release,preview,cdp,targetId,sessionId,persist=Promise.resolve(),evidenceFailure=null;
  try {
    release=acquireWorkspaceLock('portable first-step diagnostic');
    const sourceNames=[INPUT,'tools/local-image-generation/run-first-step-diagnostic.mjs','tools/local-image-generation/first-step-harness.mjs',
      'tools/local-image-generation/stage-worker.mjs','tools/local-image-generation/pipeline-math.mjs',
      'tools/local-image-generation/denoiser-shapes.mjs','tools/local-image-generation/gpu-profile.mjs',
      'tools/local-image-generation/game-preview-server.mjs','tools/local-image-generation/species-references.mjs',
      'tools/local-image-generation/q8-block32.mjs','tools/local-image-generation/fetch-model.mjs',
      'tools/local-image-generation/package-lock.json','tools/local-image-generation/model-manifest.json',
      'port/v2/apps/game/src/local-ai-runtime.ts','port/v2/apps/game/src/landfall-conditioning.ts',
      'port/v2/apps/game/src/landfall-appearance-snapshot.ts','port/v2/apps/game/src/local-model-sha256.ts',
      'port/v2/apps/game/src/earth-layered-recipe.ts','port/v2/apps/game/src/world-roster.ts',
      'port/v2/packages/art/src/speciesidentity.ts','port/v2/packages/art/src/earth-resident-plan.ts',
      'tools/local-image-generation/frozen-preview-client.mjs','port/v2/node_modules/vite/dist/client/client.mjs',
      'port/v2/apps/game/vite.config.ts','port/v2/package-lock.json','port/v2/tools/browsercdp.mjs',
      'port/v2/tools/workspacelock.mjs','tools/local-image-generation/source-integrity.mjs'];
    for(const relative of sourceNames){const file=path.join(root,relative),bytes=await fs.readFile(file);
      receipt.sources.push({path:relative,file,bytes:bytes.length,sha256:sha(bytes)});}
    await write('source-before.json',receipt.sources);
    const input=JSON.parse(await fs.readFile(path.join(root,INPUT),'utf8')),recipe=JSON.parse(input.recipeJson);
    need(input.recipeKey===EXPECTED_RECIPE&&sha(input.recipeJson)===EXPECTED_RECIPE&&recipe.q8Block32===false
      &&recipe.schema==='cf.ai-landfall-render.v2'&&recipe.references?.length===6,'Exact failed workload required');
    receipt.input=input;await write('input.json',input);
    const binding=JSON.parse(await fs.readFile(path.join(root,'audits/AI_GAME_INTEGRATION_20260909/platypus-reference-binding.json'),'utf8'));
    preview=await createGamePreviewServer({mode:'evidence',q8Block32:false,speciesReferences:true,
      reference:path.join(root,binding.image.path),referenceIdentity:binding.binding.subjectIdentityKey});
    need(preview.config.q8Block32===false&&preview.config.fixture===false,'Portable real model required');
    const referenceBindings=preview.config.references.map(({url,...row})=>row);
    need(JSON.stringify(referenceBindings)===JSON.stringify(recipe.references),'Source reference bindings changed');
    receipt.preview={url:preview.url,config:preview.config,modelFiles:preview.modelFiles,runtimeFiles:preview.runtimeFiles};
    await write('verified-preview.json',receipt.preview);
    cdp=await openChromiumCdp({label:'CF portable first-step diagnostic',userDataPrefix:'cf-first-step-',commandTimeoutMs:30000,
      onEvent:event=>{
        if(event.method==='Runtime.bindingCalled'&&event.sessionId===sessionId&&event.params.name==='cfFirstStepEvidence') {
          try {
            need(event.params.payload.length<32768&&receipt.records.length<200,'First-step event bound exceeded');
            const row=JSON.parse(event.params.payload);receipt.records.push(row);
            // Queue each event directly to disk before terminal retrieval. A lost
            // page or timed-out CDP read cannot erase the last execution boundary.
            persist=persist.then(()=>fs.appendFile(path.join(output,'events.jsonl'),JSON.stringify(row)+'\n'))
              .catch(error=>{evidenceFailure??=error;});
            if(row.stage==='denoise'||row.kind==='observer-error')console.log(JSON.stringify(row));
          } catch(error){evidenceFailure??=error;}
        }
        if(['Runtime.exceptionThrown','Log.entryAdded','Inspector.targetCrashed','Target.targetCrashed'].includes(event.method)) {
          if(receipt.browserEvents.length<200)receipt.browserEvents.push(event);else evidenceFailure??=Error('Browser event overflow');
        }
      }});
    receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
    ({targetId}=await cdp.send('Target.createTarget',{url:'about:blank'}));
    ({sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));
    await cdp.send('Runtime.enable',{},sessionId);await cdp.send('Log.enable',{},sessionId);await cdp.send('Page.enable',{},sessionId);
    await cdp.send('Runtime.addBinding',{name:'cfFirstStepEvidence'},sessionId);
    const evaluate=async expression=>{receipt.pendingExpression={sha256:sha(expression),expression};
      const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
      if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);
      receipt.pendingExpression=null;return r.result.value;};
    // A same-origin JSON document creates no game/Pixi scene. The existing server
    // owns hashes, headers and pinned routes; Vite compiles the actual TS owner.
    await cdp.send('Page.navigate',{url:preview.url+'__local_ai/runtime.json'},sessionId);
    const ready=performance.now()+15000;let capability;
    do {capability=await evaluate('({origin:location.origin,isolated:crossOriginIsolated,gpu:!!navigator.gpu,ready:document.readyState})');
      if(capability.origin===new URL(preview.url).origin&&capability.ready==='complete')break;await delay(100);
    } while(performance.now()<ready);
    need(capability?.isolated&&capability.gpu&&capability.origin===new URL(preview.url).origin,'Diagnostic document not ready');
    receipt.capability=capability;
    await evaluate(`(()=>{globalThis.__cfFirstStep={status:'running'};
      (async()=>{try{const {generateLocalLandfallV1}=await import('/src/local-ai-runtime.ts');
        const config=await fetch('/__local_ai/runtime.json').then(r=>{if(!r.ok)throw Error('Config unavailable');return r.json();});
        const result=await (${runFirstStepInPage.toString()})({input:${JSON.stringify(input)},config,generate:generateLocalLandfallV1,
          emit:row=>cfFirstStepEvidence(JSON.stringify(row))});globalThis.__cfFirstStep={status:'complete',result};
      }catch(error){globalThis.__cfFirstStep={status:'failed',error:String(error.stack??error)};}})();return true;})()`);
    const deadline=performance.now()+720000;let terminal;
    while(performance.now()<deadline) {
      if(evidenceFailure)throw evidenceFailure;
      terminal=await evaluate('globalThis.__cfFirstStep');
      if(terminal?.status==='failed')throw Error(terminal.error);
      if(terminal?.status==='complete')break;
      await delay(500);
    }
    await persist;need(!evidenceFailure,'Persistent first-step evidence failed');
    need(terminal?.status==='complete','Bounded diagnostic did not complete');
    receipt.outcome=terminal.result;receipt.assessment=assessFirstStepEvidence(receipt.records,terminal.result);
    const mutant=structuredClone(receipt.records);mutant.splice(mutant.findIndex(r=>r.message?.phase==='run-complete'),1);
    let rejected=false;try{assessFirstStepEvidence(mutant,terminal.result);}catch{rejected=true;}
    need(rejected,'Missing native execution boundary was accepted');receipt.missingBoundaryRejected=true;
    assessFirstStepEvidence(receipt.records,terminal.result);
    need(!receipt.browserEvents.some(e=>e.method==='Runtime.exceptionThrown'||e.method.endsWith('targetCrashed')),'Native browser exception or crash');
    receipt.status='FIRST_STEP_COMPLETE';
  } catch(error){receipt.status='FAIL';receipt.error=String(error.stack??error);}
  finally {
    await persist;if(evidenceFailure){receipt.status='FAIL';receipt.evidenceError=String(evidenceFailure);}
    if(cdp&&targetId)try{await cdp.send('Target.closeTarget',{targetId});receipt.cleanup.targetClosed=true;}catch(error){receipt.status='FAIL';receipt.cleanup.targetError=String(error);}
    if(cdp)try{await cdp.close();receipt.cleanup.browserAndOwnedProfileRemoved=true;}catch(error){receipt.status='FAIL';receipt.cleanup.browserError=String(error);}
    if(preview)try{receipt.requests=preview.requests;await preview.close();receipt.cleanup.serverClosed=true;}catch(error){receipt.status='FAIL';receipt.cleanup.serverError=String(error);}
    receipt.sourceIntegrity=await recheckSourceFiles(receipt.sources);if(!receipt.sourceIntegrity.unchanged)receipt.status='FAIL';
    if(release)try{release();receipt.cleanup.workspaceReleased=true;}catch(error){receipt.status='FAIL';receipt.cleanup.workspaceError=String(error);}
    receipt.finishedAt=new Date().toISOString();await write('result.json',receipt);
  }
  console.log(JSON.stringify({status:receipt.status,error:receipt.error??null,result:path.join(output,'result.json')}));
  if(receipt.status!=='FIRST_STEP_COMPLETE')process.exitCode=1;
  return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  need(process.argv.length===3&&process.argv[2].startsWith('--output='),'Usage: run-first-step-diagnostic.mjs --output=NEW_AUDIT_DIRECTORY');
  await runFirstStepDiagnostic({output:process.argv[2].slice(9)});
}
