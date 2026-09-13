// Native ImageBitmap/Canvas2D preparation only. Inference workers are explicit
// audit substitutes; no ONNX/model execution, artwork generation or GPU claim.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {openChromiumCdp} from '../../../port/v2/tools/browsercdp.mjs';
import {exportCanonicalEarthSnapshot} from '../../../port/v2/tools/landfall-snapshot/export.mjs';
import {createProofServer} from '../../../tools/local-image-generation/proof-server.mjs';
import {DEFAULT_CACHE_ROOT} from '../../../tools/local-image-generation/fetch-model.mjs';
import {recheckSourceFiles} from '../../../tools/local-image-generation/source-integrity.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../..');
const hash=b=>createHash('sha256').update(b).digest('hex');
const result={status:'FAIL',startedAt:new Date().toISOString(),scope:'Real native bitmap and Canvas2D; substitute inference workers; no model run or image-quality claim',sources:[],modes:[]};
const destination=path.join(here,'RESULT.json');
await fs.writeFile(path.join(here,'START.json'),JSON.stringify({startedAt:result.startedAt,scope:result.scope},null,2)+'\n',{flag:'wx'});
let server,cdp;
const originals=[
  ['512x288','bed3684dde2c27b8b62ebd2d7ae115a90892ea086d43de2a8bd795697091f8b0'],
  ['480x320','96fe0622f6dca3e0ed1a3052aea75a771bf58294b938387778a8b2435e7b2323'],
];
function verify(row){
  const errors={prepared:'Canceled','invalid-matte':'Invalid explicit reference matte','context-null':'Reference 2D context unavailable','draw-failure':'audit draw failure','read-failure':'audit read failure','decode-cancel':'Canceled'};
  assert.ok(Object.hasOwn(errors,row.mode));assert.equal(row.state,'failed');
  assert.equal(row.error.split('\n')[0],'Error: '+errors[row.mode]);
  assert.equal(row.injectionHits,row.mode==='prepared'?0:1);
  assert.equal(row.png,false);assert.equal(row.paintWrites,0);assert.equal(row.paintingNonzero,0);assert.equal(row.activeWorkers,0);
  assert.ok(row.workers.every(w=>w.terminations===1));
  assert.ok(row.bitmaps.every(b=>b.closeCalls===1&&b.width===0&&b.height===0));
  assert.ok(row.canvases.every(c=>c.width===1&&c.height===1));
  if(row.mode==='prepared'){
    assert.deepEqual(row.workers.map(w=>w.stage),['text','encode','encode','denoise']);
    assert.equal(row.bitmaps.length,2);assert.equal(row.canvases.length,2);
    assert.deepEqual(row.prepared.map(x=>[`${x.width}x${x.height}`,x.pixelSha256]),originals);
  }else{
    assert.deepEqual(row.workers.map(w=>w.stage),['text']);assert.equal(row.prepared.length,0);
    assert.equal(row.bitmaps.length,row.mode==='invalid-matte'?0:1);
    assert.equal(row.canvases.length,['invalid-matte','decode-cancel'].includes(row.mode)?0:1);
  }
}
try{
  const local=['tools/local-image-generation/browser-proof.mjs','tools/local-image-generation/browser-lifecycle.test.mjs','tools/local-image-generation/proof-server.mjs','tools/local-image-generation/source-integrity.mjs',path.relative(root,fileURLToPath(import.meta.url))];
  for(const name of local)result.sources.push({path:name,sha256:hash(await fs.readFile(path.join(root,name)))});
  const canonical=await exportCanonicalEarthSnapshot(path.join(here,'canonical-input'));
  result.canonicalExport=canonical.receipt;result.sources.push(...canonical.receipt.sources);
  const manifest=JSON.parse(await fs.readFile(path.join(root,'tools/local-image-generation/model-manifest.json'),'utf8'));
  server=await createProofServer({cacheDir:path.join(DEFAULT_CACHE_ROOT,manifest.modelId.replace('/','--'),manifest.revision),canonical,identityReference:true});
  result.recipeSha256=hash(JSON.stringify(server.recipe));
  cdp=await openChromiumCdp({label:'CF native reference ownership',userDataPrefix:'cf-ref-ownership-',commandTimeoutMs:45000});
  result.browser=cdp.browser;
  for(const mode of ['prepared','invalid-matte','context-null','draw-failure','read-failure','decode-cancel']){
    const {targetId}=await cdp.send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});
    await cdp.send('Runtime.enable',{},sessionId);await cdp.send('Page.enable',{},sessionId);
    const expression=`(()=>{
      const mode=${JSON.stringify(mode)},state={mode,workers:[],bitmaps:[],canvases:[],injectionHits:0,paintWrites:0};window.ownershipAudit=state;
      const nativeBitmap=window.createImageBitmap.bind(window),NativeCanvas=window.OffscreenCanvas,nativeFetch=window.fetch.bind(window);
      const nativeGetContext=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(...args){
        const context=nativeGetContext.apply(this,args);
        if(this.id==='painting'&&context){const put=context.putImageData.bind(context);context.putImageData=(...values)=>{state.paintWrites++;return put(...values);};}
        return context;
      };
      window.createImageBitmap=async(...args)=>{
        const bitmap=await nativeBitmap(...args),row={bitmap,closeCalls:0};state.bitmaps.push(row);
        const close=bitmap.close.bind(bitmap);bitmap.close=()=>{row.closeCalls++;return close();};
        if(mode==='decode-cancel'){state.injectionHits++;window.cfImageProof.cancel();}return bitmap;
      };
      window.OffscreenCanvas=class extends NativeCanvas{
        constructor(...args){super(...args);state.canvases.push(this);}
        getContext(...args){
          if(mode==='context-null'){state.injectionHits++;return null;}
          const context=super.getContext(...args);
          if(mode==='draw-failure')context.drawImage=()=>{state.injectionHits++;throw Error('audit draw failure');};
          if(mode==='read-failure')context.getImageData=()=>{state.injectionHits++;throw Error('audit read failure');};
          return context;
        }
      };
      window.fetch=async(...args)=>{
        const response=await nativeFetch(...args);
        if(mode==='invalid-matte'&&args[0]==='/recipe.json'){
          const config=await response.json();config.references[0].matte='transparent';state.injectionHits++;
          return {ok:true,json:async()=>config};
        }
        return response;
      };
      window.Worker=class{
        constructor(){this.terminations=0;state.workers.push(this);}
        postMessage(job){this.stage=job.stage;queueMicrotask(()=>{
          if(job.stage==='text'||job.stage==='encode')this.onmessage?.({data:{type:'complete',data:new Float32Array([.1,.2])}});
          else if(job.stage==='denoise')window.cfImageProof.cancel();
          else throw Error('Unexpected audit inference stage');
        });}
        terminate(){this.terminations++;}
      };
    })()`;
    await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:expression},sessionId);
    await cdp.send('Page.navigate',{url:server.url},sessionId);
    const evaluate=async expression=>{
      const response=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
      if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description??response.exceptionDetails.text);
      return response.result.value;
    };
    const deadline=performance.now()+15000;
    while(!await evaluate('!!window.cfImageProof')){if(performance.now()>deadline)throw Error('Page readiness timeout');await new Promise(r=>setTimeout(r,50));}
    await evaluate('window.cfImageProof.generate()');
    const row=await evaluate(`({mode:ownershipAudit.mode,state:cfImageProof.state,error:cfImageProof.error,png:!!cfImageProof.png,
      injectionHits:ownershipAudit.injectionHits,paintWrites:ownershipAudit.paintWrites,
      paintingNonzero:document.getElementById('painting').getContext('2d').getImageData(0,0,768,432).data.reduce((count,value)=>count+(value!==0),0),
      activeWorkers:ownershipAudit.workers.filter(w=>!w.terminations).length,
      workers:ownershipAudit.workers.map(w=>({stage:w.stage,terminations:w.terminations})),
      bitmaps:ownershipAudit.bitmaps.map(b=>({closeCalls:b.closeCalls,width:b.bitmap.width,height:b.bitmap.height})),
      canvases:ownershipAudit.canvases.map(c=>({width:c.width,height:c.height})),
      prepared:cfImageProof.records.filter(x=>x.phase==='reference-prepared')})`);
    result.modes.push(row);verify(row);
    await cdp.send('Target.closeTarget',{targetId});
  }
  const restored=result.modes[0];
  const mutations=[row=>row.bitmaps[0].closeCalls=0,row=>row.bitmaps[0].width=8,row=>row.canvases[0].width=512,
    row=>row.prepared[0].pixelSha256='0'.repeat(64),row=>row.activeWorkers=1,
    row=>row.paintWrites=1,row=>row.paintingNonzero=1,row=>row.png=true];
  result.refusalControls=0;
  for(const mutate of mutations){const bad=structuredClone(restored);mutate(bad);assert.throws(()=>verify(bad));result.refusalControls++;}
  const wrongError=structuredClone(result.modes.find(row=>row.mode==='draw-failure'));
  wrongError.error=result.modes.find(row=>row.mode==='context-null').error;assert.throws(()=>verify(wrongError));result.refusalControls++;
  const missedInjection=structuredClone(result.modes.find(row=>row.mode==='draw-failure'));
  missedInjection.injectionHits=0;assert.throws(()=>verify(missedInjection));result.refusalControls++;
  verify(restored);result.restoredControl=true;
  assert.equal(server.requests.filter(r=>r.path.startsWith('/model/')||r.path==='/stage-worker.mjs').length,0);
  result.status='REFERENCE_PREPARATION_NATIVE_PASS';
}catch(error){result.error=String(error.stack??error);process.exitCode=1;}
finally{
  try{await cdp?.close();result.browserClosed=true;}catch(error){result.cleanupError=String(error);result.status='FAIL';process.exitCode=1;}
  if(server){result.requests=server.requests;try{await server.close();result.serverClosed=true;}catch(error){result.serverError=String(error);result.status='FAIL';process.exitCode=1;}}
  result.sourceIntegrity=await recheckSourceFiles(result.sources.map(row=>({...row,file:path.join(root,row.path)})));
  if(!result.sourceIntegrity.unchanged){result.status='FAIL';process.exitCode=1;}
  result.finishedAt=new Date().toISOString();await fs.writeFile(destination,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:result.status,modes:result.modes.length,error:result.error}));
}
