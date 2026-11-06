import {compileCreatureFinishV1} from '../../apps/game/src/landfall-conditioning.js';
import {createAiCreatureOriginalStoreV1,obtainCreatureOriginalV1} from '../../apps/game/src/creature-originals.js';
import {finishConservation} from './finish-conservation.mjs';
const sha=async(b:BufferSource)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
const state:any={status:'idle',rows:[],events:[],artifacts:{}};
let worker:Worker,store:ReturnType<typeof createAiCreatureOriginalStoreV1>;
async function paint(recipe:any){return new Promise<any>((resolve,reject)=>{worker.onmessage=({data})=>{if(data.type==='progress'){state.events.push({phase:data.phase,stage:data.stage,elapsedMs:data.elapsedMs});if(state.events.length>500)state.events.shift();}else if(data.type==='complete')resolve(data);else reject(Error(data.message));};worker.onerror=e=>reject(Error(e.message));worker.postMessage({stage:'creature-finish-v1',requestId:state.rows.length,recipe});});}
async function start(){state.status='running';store=createAiCreatureOriginalStoreV1();worker=new Worker('/kit-stage-worker.mjs',{type:'module'});
 try{const inputs=await(await fetch('/inputs.json')).json();for(const input of inputs.subjects){
  state.subject=input.id;const row:any={id:input.id,status:'FAIL'};state.rows.push(row);
  try{const recipe=compileCreatureFinishV1(input),settingsHash=await sha(new TextEncoder().encode(JSON.stringify({settings:recipe.settings,prompt:recipe.prompt,seed:recipe.seed}))),identity={recordRecipeHash:input.recordRecipeHash,cutoutAssetHash:input.cutoutAssetHash,settingsHash,modelHash:inputs.modelHash};
   let result:any,inferences=0;const infer=async()=>{inferences++;result=await paint(recipe);const master=new Uint8Array(await(await fetch(recipe.master.url)).arrayBuffer()),labels=new Uint8Array(await(await fetch(recipe.labels.url)).arrayBuffer());row.conservation=finishConservation(master,result.rgba,labels,recipe.width,recipe.height);if(row.conservation.status!=='PASS')throw Error('Conservation before retention failed');return {blob:result.painting,receipt:JSON.stringify({identity,recipe,elapsedMs:result.elapsedMs,editablePixels:result.editablePixels,protectedTokens:result.protectedTokens})};};
   const first=await obtainCreatureOriginalV1(store,identity,'desktop',infer);if(!first.original)throw Error('Missing original');
   state.artifacts[input.id]=first.original.blob;row.sha256=first.original.sha256;row.identity=identity;row.recipe=recipe;row.details=result?{elapsedMs:result.elapsedMs,editablePixels:result.editablePixels,protectedTokens:result.protectedTokens,sessionCreates:result.sessionCreates}:null;
   const second=await obtainCreatureOriginalV1(store,identity,'desktop',infer);row.retention={first:first.inferencePasses,second:second.inferencePasses,inferences,hashEqual:second.original?.sha256===row.sha256};
   try{await store.retain(identity,first.original.blob,'overwrite mutant');throw Error('Overwrite accepted');}catch(e){if(String(e).includes('Overwrite accepted'))throw e;row.overwriteRefused=true;}
   row.changedSettingsMiss=(await store.find({...identity,settingsHash:'0'.repeat(64)}))===null;
   row.phoneMissing=await obtainCreatureOriginalV1(store,{...identity,settingsHash:'1'.repeat(64)},'phone',()=>{throw Error('Phone inferred');});
   if(input.id===inputs.subjects[0].id){const repeat=await paint(recipe),mutant=await paint({...recipe,seed:(recipe.seed+1)>>>0});const repeatSha=await sha(await repeat.painting.arrayBuffer()),mutantSha=await sha(await mutant.painting.arrayBuffer());row.determinism={repeatSha,seedPlusOneSha:mutantSha,identical:repeatSha===row.sha256,seedLive:mutantSha!==row.sha256,mutantRetained:false};if(!row.determinism.identical||!row.determinism.seedLive)throw Error('Determinism control failed');}
   row.status='PASS';
  }catch(e){row.error=String(e);worker.terminate();worker=new Worker('/kit-stage-worker.mjs',{type:'module'});}
 }state.status='complete';}catch(e){state.status='failed';state.error=String(e);}finally{worker?.terminate();store?.close();}}
(window as any).creatureProof={start,snapshot:()=>({status:state.status,subject:state.subject,rows:state.rows.map((r:any)=>({id:r.id,status:r.status,error:r.error})),last:state.events.at(-1)}),report:()=>({status:state.status,rows:state.rows,events:state.events,error:state.error}),artifact:async(id:string)=>{const bytes=new Uint8Array(await state.artifacts[id].arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}};
