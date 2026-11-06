/** Own local probe page only; user starts once in ordinary Safari. */
import './kit-proof-client.mjs';
let used=false,sending=false,lastSequence=-1;
const post=async(route,data)=>{const response=await fetch(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!response.ok)throw Error('Probe recorder refused '+route);};
const note=document.querySelector('#status'),button=document.querySelector('#start');
const adapter=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});
let storage;try{storage=await navigator.storage.estimate();}catch(e){storage={unavailable:String(e)};}
const capabilities={userAgent:navigator.userAgent,secureContext:isSecureContext,crossOriginIsolated,webgpu:!!navigator.gpu,adapterAvailable:!!adapter,maxBufferSize:adapter?.limits.maxBufferSize??null,maxStorageBufferBindingSize:adapter?.limits.maxStorageBufferBindingSize??null,shaderF16:adapter?.features.has('shader-f16')??null,storage,jsHeap:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize}:null,nativeGpuMemory:null};
await post('/probe-ready',capabilities);
button.disabled=!(capabilities.secureContext&&capabilities.crossOriginIsolated&&capabilities.adapterAvailable&&capabilities.shaderF16);
note.textContent=button.disabled?'Required secure WebGPU capability unavailable':'Secure page ready. Tap Start probe once and leave this page open.';
button.addEventListener('click',async()=>{
 if(used)return;used=true;button.disabled=true;
 try{
  await post('/probe-start',capabilities);
  const interval=setInterval(async()=>{if(sending)return;sending=true;try{const r=window.kitProof.report(),seq=r.events.at(-1)?.sequence??0;if(seq!==lastSequence){await post('/probe-progress',r);lastSequence=seq;}else await post('/probe-heartbeat',{});}catch(e){note.textContent='Recorder connection lost: '+String(e);}finally{sending=false;}},3000);
  await window.kitProof.start();clearInterval(interval);
  while(sending)await new Promise(r=>setTimeout(r,25));
  const report=window.kitProof.report();
  if(report.status==='complete'){report.painting=await window.kitProof.artifact('painting');report.finisherOriginal=await window.kitProof.artifact('finisher-original');}
  await post('/probe-result',report);window.kitProof.dispose();note.textContent=report.status==='complete'?'Probe complete. Measurements and painting saved on the Mac.':'Probe stopped. First failure saved on the Mac.';
 }catch(e){note.textContent=String(e);try{await post('/probe-result',{status:'failed',error:String(e),events:window.kitProof.report().events});}catch{}window.kitProof.dispose();}
},{once:true});
