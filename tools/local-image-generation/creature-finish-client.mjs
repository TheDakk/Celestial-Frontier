/** R9 proof page client: runs every recipe in /recipes.json through the
 * creature stage worker, one at a time, and keeps each result's blobs. */
const worker=new Worker('/stage-worker.mjs',{type:'module'});
let status='idle',error=null,sequence=0,current=null;const events=[],results=[];
const record=event=>{events.push({...event,atMs:performance.now(),sequence:++sequence});document.querySelector('#status').textContent=[event.phase??event.type,event.stage??event.creatureId??''].join(' ');};
function finishOne(recipe){
 return new Promise((resolve,reject)=>{
  const requestId='r'+results.length;current={requestId,resolve,reject};
  worker.postMessage({stage:'creature-finish-v1',requestId,recipe,modelFiles:{}});
 });
}
worker.onmessage=({data})=>{
 if(data.type==='progress'){record(data);return;}
 if(!current||data.requestId!==current.requestId){error='Unexpected worker message';status='failed';return;}
 const {resolve,reject}=current;current=null;
 if(data.type==='complete'){record({type:'complete',creatureId:data.creatureId,elapsedMs:data.elapsedMs});resolve(data);}else reject(Error(data.message));
};
worker.onerror=event=>{error=String(event.message??event);status='failed';current?.reject(Error(error));};
window.creatureFinish={
 async start(){if(status!=='idle')throw Error('Exactly one run per proof page');status='running';
  try{const recipes=await fetch('/recipes.json').then(r=>r.json());for(const recipe of recipes){record({phase:'creature-start',creatureId:recipe.creatureId});results.push(await finishOne(recipe));}status='complete';}
  catch(e){error=String(e.stack??e);status='failed';}},
 snapshot(){return {status,error,last:events.at(-1)??null,eventCount:events.length,resultCount:results.length};},
 report(){return {status,error,events,results:results.map(({finished,raw,composite,protectionMask,...facts})=>facts)};},
 async artifact(index,kind){const blob=results[index]?.[kind];if(!blob)throw Error('No artifact '+index+' '+kind);const bytes=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(s);},
 dispose(){worker.terminate();},
};
