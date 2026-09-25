/** Lossless sample accounting for the optional native battle diagnostic.
 * CDP timeDeltas[i] belongs to samples[i]; the first delta starts at startTime.
 * Distinct Wasm modules may all export wasm-function[0]. Keep module identity
 * and the nearest mapped caller instead of treating that name as an owner. */
export function summarizeCpuProfile(profile,resolveSource,{frames,cpuThrottle}){
 const need=(ok,why)=>{if(!ok)throw Error('Battle CPU profile: '+why);};
 need(Array.isArray(profile.nodes)&&Array.isArray(profile.samples)&&Array.isArray(profile.timeDeltas)&&profile.samples.length===profile.timeDeltas.length,'sample/delta inventory');
 need(Number.isInteger(frames)&&frames>0&&Number.isFinite(cpuThrottle)&&cpuThrottle>=1,'capture metadata');
 const nodes=new Map(),parent=new Map(),self=new Map();
 for(const n of profile.nodes){need(Number.isInteger(n.id)&&!nodes.has(n.id)&&n.callFrame&&typeof n.callFrame.functionName==='string','node identity');nodes.set(n.id,n);}
 for(const n of nodes.values())for(const child of n.children??[]){need(nodes.has(child)&&!parent.has(child),'tree ownership');parent.set(child,n.id);}
 const mapped=new Map([...nodes].map(([id,n])=>[id,resolveSource(n.callFrame)]));
 let totalUs=0;
 for(let i=0;i<profile.samples.length;i++){const id=profile.samples[i],delta=profile.timeDeltas[i];need(nodes.has(id)&&Number.isFinite(delta)&&delta>=0,'sample or delta');totalUs+=delta;self.set(id,(self.get(id)??0)+delta);}
 const wasmOwners=new Map(),files=new Map();
 const add=(m,k,v)=>m.set(k,(m.get(k)??0)+v);
 for(const[id,us]of self){const n=nodes.get(id),cf=n.callFrame;let file=mapped.get(id);
  if(cf.url?.startsWith('wasm://')){
   const seen=new Set([id]);let at=parent.get(id),caller=null;
   while(at!==undefined){need(!seen.has(at),'cyclic stack');seen.add(at);const p=nodes.get(at);if(p.callFrame.url&&!p.callFrame.url.startsWith('wasm://')&&mapped.get(at)){caller=mapped.get(at);break;}at=parent.get(at);}
   file='wasm:'+cf.url+'#'+cf.functionName+' via '+(caller??'unmapped');add(wasmOwners,caller??'unmapped',us);
  }
  add(files,file??'unmapped',us);
 }
 const group=f=>/^wasm:/.test(f)?'wasm (orientation / skin kernels)':/arap|skin|paint-skin|mesh/i.test(f)?'skin (ARAP / mesh)':/contact|stance|support|ik|kinemat|solver|gait|motion\//i.test(f)?'rig motion + contact':/creature-rig|parts-rig|fixture-rig/i.test(f)?'rig other':/battle2\//i.test(f)?'stage + choreography':/effects\//.test(f)?'effects':/pixi/i.test(f)?'pixi render':f==='(idle)'?'idle':f==='(gc)'?'garbage collection':'other';
 const groups=new Map();for(const[f,us]of files)add(groups,group(f),us);
 const rows=m=>[...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([file,us])=>({file,us,ms:us/1000,share:totalUs?us/totalUs:0}));
 return {schema:'cf.battle-cpu-profile/v2',totalUs,totalMs:totalUs/1000,samples:profile.samples.length,frames,cpuThrottle,groups:Object.fromEntries([...groups].map(([k,v])=>[k,v/1000])),wasmCallers:rows(wasmOwners),files:rows(files),nodes:[...nodes].map(([id,n])=>({id,parent:parent.get(id)??null,callFrame:n.callFrame,mappedSource:mapped.get(id)??null,selfUs:self.get(id)??0}))};
}
