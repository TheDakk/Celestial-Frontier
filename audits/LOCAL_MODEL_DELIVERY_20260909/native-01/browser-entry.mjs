// Tiny synthetic model only. Actual delivery/OPFS/Web Locks owner; no ONNX or model weights.
import {createLocalModelDeliveryV1,probeLocalModelCapabilitiesV1} from '../../../port/v2/apps/game/src/local-model-delivery.ts';
const statusElement=document.querySelector('#status');
const api={bootId:crypto.randomUUID(),kind:'good',states:[],clicks:[],ready:false,capability:null,instance:null,controller:null,operation:null,error:null};
window.deliveryAudit=api;
function publish(state){api.states.push(state);statusElement.textContent=JSON.stringify(state,null,2);}
api.select=async kind=>{
  if(api.operation)throw Error('Cannot change fixture while an operation runs');
  if(!['good','corrupt'].includes(kind))throw Error('Unknown fixture');
  api.kind=kind;
  const response=await fetch('/fixture.json?kind='+kind,{cache:'no-store'});
  if(!response.ok)throw Error('Fixture fetch failed');
  api.instance=createLocalModelDeliveryV1({manifest:await response.json(),baseUrl:location.origin+'/model/'+kind+'/',
    fileTimeoutMs:10000,onStatus:publish});
  return api.instance.verify();
};
api.install=()=>{
  if(api.operation)throw Error('Operation already active');
  api.controller=new AbortController();
  api.operation=api.instance.install({signal:api.controller.signal}).catch(error=>{api.error=String(error);throw error;})
    .finally(()=>{api.operation=null;});
};
api.openAll=async()=>{
  const result=[];
  for(const expected of api.instance.manifest.files){
    const blob=await api.instance.openFile(expected.path);
    // Only the <=2 MiB synthetic fixture is materialized by this observer.
    // The production delivery component returns Blob without this full read.
    const direct=new Uint8Array(await blob.arrayBuffer());
    const hash=bytes=>crypto.subtle.digest('SHA-256',bytes).then(buffer=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join(''));
    const url=URL.createObjectURL(blob);
    try{
      const response=await fetch(url),throughUrl=new Uint8Array(await response.arrayBuffer());
      result.push({path:expected.path,isBlob:blob instanceof Blob,bytes:blob.size,sha256:await hash(direct),
        blobUrlBytes:throughUrl.byteLength,blobUrlSha256:await hash(throughUrl)});
    }finally{URL.revokeObjectURL(url);}
  }
  return result;
};
api.inventory=async()=>{
  const root=await navigator.storage.getDirectory();const files=[];
  async function walk(directory,prefix=''){
    for await(const [name,handle]of directory.entries()){
      if(handle.kind==='directory')await walk(handle,prefix+name+'/');
      else {const file=await handle.getFile();const row={path:prefix+name,bytes:file.size};
        if(name.endsWith('.json'))row.json=JSON.parse(await file.text());files.push(row);}
    }
  }
  await walk(root);return files.sort((a,b)=>a.path.localeCompare(b.path));
};
for(const id of ['install','cancel'])document.querySelector('#'+id).addEventListener('click',event=>{
  api.clicks.push({id,trusted:event.isTrusted});
  try{if(id==='install')api.install();else api.controller?.abort();}catch(error){api.error=String(error);}
});
api.capability=await probeLocalModelCapabilitiesV1();
await api.select('good');api.ready=true;
