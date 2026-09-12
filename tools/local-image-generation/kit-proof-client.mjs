import {createWarmKitLandfallRuntimeV4} from '/kit-client.mjs';
const runtime=createWarmKitLandfallRuntimeV4('/stage-worker.mjs'),controller=new AbortController();
let status='idle',result=null,error=null,sequence=0;
const events=[],partial=[],landings=[];
const landingCount=new URLSearchParams(location.search).get('landings')==='2'?2:1;
const record=event=>{const {blob,...facts}=event;events.push({...facts,atMs:performance.now(),sequence:++sequence});if(blob)partial.push({name:event.name,blob});document.querySelector('#status').textContent=[event.phase,event.name??event.stage??''].join(' ');};
window.kitProof={
 async start(){if(status!=='idle')throw Error('Exactly one run per proof page');status='running';try{const recipe=await fetch('/recipe.json').then(r=>r.json());for(let i=0;i<landingCount;i++){record({phase:'landing-start',landing:i+1});result=await runtime.generate(recipe,controller.signal,record);landings.push(result);record({phase:'landing-complete',landing:i+1,elapsedMs:result.elapsedMs,sessionCreates:result.sessionCreates});}status='complete';const image=document.querySelector('#painting');image.src=URL.createObjectURL(result.painting);image.hidden=false;document.querySelector('#status').textContent='Painting ready for native-size review';}catch(e){status='failed';error=String(e.stack??e);document.querySelector('#status').textContent=error;}},
 snapshot(){return {status,error,last:events.at(-1)??null,eventCount:events.length,partialCount:partial.length};},
 report(){const {painting,composite,captures,maskCaptures,protectionMask,...details}=result??{};return {status,error,events,details,landings:landings.map(({painting,composite,captures,maskCaptures,protectionMask,...metrics})=>metrics),partial:partial.map(({name})=>name)};},
 async artifact(kind,index=0){const blob=kind==='landing'?landings[index].painting:kind==='painting'?result.painting:kind==='composite'?result.composite:kind==='partial'?partial[index].blob:kind==='mask'?result.maskCaptures[index].blob:kind==='protection'?result.protectionMask:result.captures[index].blob;const bytes=new Uint8Array(await blob.arrayBuffer());let text='';for(let at=0;at<bytes.length;at+=32768)text+=String.fromCharCode(...bytes.subarray(at,at+32768));return btoa(text);},
 dispose(){controller.abort();runtime.dispose();},
};
