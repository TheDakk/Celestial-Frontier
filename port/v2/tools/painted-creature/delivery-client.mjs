import inputs from 'virtual:delivery-inputs';
import {createAiCreatureOriginalStoreV1} from '../../apps/game/src/creature-originals.ts';
import {deliverCreaturePngV1} from '../../apps/game/src/creature-delivery.ts';
const state={status:'RUNNING',completed:0,total:inputs.length};window.cfFaunaCensus={state};
try{
 let workers=0,gpuRequests=0;globalThis.Worker=class{constructor(){workers++;throw Error('D1 must not create workers');}};
 Object.defineProperty(navigator,'gpu',{get(){gpuRequests++;throw Error('D1 must not request GPU');},configurable:true});
 const store=createAiCreatureOriginalStoreV1(),rows=[],artifacts={};
 const from64=s=>new Blob([Uint8Array.from(atob(s),c=>c.charCodeAt(0))],{type:'image/png'});
 const render=async blob=>{const bitmap=await createImageBitmap(blob),canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();return {canvas,rgba:ctx.getImageData(0,0,canvas.width,canvas.height).data};};
 const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
 for(const item of inputs){
  const painter=from64(item.painter),finished=from64(item.finished);await store.retain(item.identity,finished,item.receipt);
  const base={store,identity:item.identity,retainedAllowed:true,retainedSha256:item.sha256,painter,painterSha256:item.painterSha256};
  const retained=await deliverCreaturePngV1(base),fallback=await deliverCreaturePngV1({...base,retainedAllowed:false}),missing=await deliverCreaturePngV1({...base,identity:{...item.identity,settingsHash:'0'.repeat(64)}}),wrong=await deliverCreaturePngV1({...base,retainedSha256:'0'.repeat(64)});
  const a=await render(retained.blob),b=await render(finished),p=await render(painter),f=await render(fallback.blob);
  const row={id:item.id,retainedSha256:retained.sha256,painterSha256:fallback.sha256,retainedPixelsIdentical:same(a.rgba,b.rgba),fallbackPixelsIdentical:same(p.rgba,f.rgba),rejectedFinishFallback:fallback.source==='painter',missingFallback:missing.source==='painter',wrongHashFallback:wrong.source==='painter',inferencePasses:retained.inferencePasses+fallback.inferencePasses+missing.inferencePasses+wrong.inferencePasses};
  if(!row.retainedPixelsIdentical||!row.fallbackPixelsIdentical||!row.rejectedFinishFallback||!row.missingFallback||!row.wrongHashFallback||row.inferencePasses)throw Error('D1 outcome '+item.id);
  const c=new OffscreenCanvas(a.canvas.width*2,a.canvas.height),cx=c.getContext('2d');cx.drawImage(p.canvas,0,0);cx.drawImage(a.canvas,a.canvas.width,0);const bytes=new Uint8Array(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));artifacts[item.id+'-delivery.png']=btoa(s);rows.push(row);state.completed++;
 }
 store.close();if(workers||gpuRequests)throw Error('D1 inference capability used');
 window.cfFaunaCensus.report={status:'DIAGNOSTIC_PASS',schema:'cf.creature-delivery-proof/v1',scope:'Desktop native browser executing phone delivery owner; not physical iPhone qualification or visual acceptance',workers,gpuRequests,rows};window.cfFaunaCensus.artifacts=artifacts;state.status='DONE';
}catch(e){state.status='FAIL';state.error=String(e.stack??e);}
