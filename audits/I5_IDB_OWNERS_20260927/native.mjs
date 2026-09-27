/* Real IndexedDB persistence outcomes and terminal listener ownership. Not I5 certification. */
import fs from'node:fs';import http from'node:http';import path from'node:path';import{createRequire}from'node:module';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
import{openChromiumCdp}from'../../port/v2/tools/browsercdp.mjs';
const v2require=createRequire(path.resolve('port/v2/package.json')),{rolldown}=await import(v2require.resolve('rolldown')),root=process.cwd(),out=process.argv[2];if(!out||fs.existsSync(out))throw Error('fresh output required');
const scratch=fs.mkdtempSync('/private/tmp/cf-idb-native-'),source=path.resolve('port/v2/packages/persistence/src/repository.ts'),oldHead='605a6e28ccd3c730ffd9631b36202285e914bc14',old=execFileSync('git',['show',oldHead+':port/v2/packages/persistence/src/repository.ts'],{encoding:'utf8'}),sha=b=>createHash('sha256').update(b).digest('hex');
fs.writeFileSync(scratch+'/entry.mjs',`export{createIndexedDBBackend}from'${source}';`);
for(const name of ['old','new']){const b=await rolldown({input:scratch+'/entry.mjs',plugins:name==='old'?[{name:'immutable-old',load(id){if(id===source)return old;}}]:[]});try{await b.write({file:scratch+'/'+name+'.mjs',format:'es'});}finally{await b.close();}}
const server=http.createServer((q,r)=>{if(q.url==='/'){r.setHeader('Content-Type','text/html');return r.end('<!doctype html><title>IDB owners</title>');}const f=path.join(scratch,path.basename(q.url));if(!fs.existsSync(f)){r.writeHead(404);return r.end();}r.setHeader('Content-Type','text/javascript');r.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={scope:'Native actual storage + listener ownership, held objects expose callback lifetime without depending on GC',oldHead,oldSha256:sha(old),newSha256:sha(fs.readFileSync(source)),callbackOwnerSha256:sha(fs.readFileSync('port/v2/packages/persistence/src/idb-callbacks.ts')),rows:[]};let browser;
try{browser=await openChromiumCdp({label:'IDB terminal ownership',userDataPrefix:'cf-idb-native',startupTimeoutMs:15000});report.browser=browser.browser;
for(const name of ['old','new']){
 const{targetId}=await browser.send('Target.createTarget',{url:'http://127.0.0.1:'+server.address().port+'/'});const{sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});const send=(m,p={})=>browser.send(m,p,sessionId,{timeoutMs:15000});
 await send('Page.enable');const r=await send('Runtime.evaluate',{includeCommandLineAPI:true,awaitPromise:true,returnByValue:true,expression:`(async()=>{
 const inventory=getEventListeners;
 const {createIndexedDBBackend}=await import('/${name}.mjs'),requests=[],txs=[],opens=[],outcomes=[];let forceAbort=false,forceConstraint=false;
 const open=IDBFactory.prototype.open,transaction=IDBDatabase.prototype.transaction,get=IDBObjectStore.prototype.get;
 IDBFactory.prototype.open=function(...args){const r=open.apply(this,args);opens.push(r);return r;};
 IDBDatabase.prototype.transaction=function(...args){const t=transaction.apply(this,args);txs.push(t);if(forceAbort){forceAbort=false;queueMicrotask(()=>t.abort());}return t;};
 IDBObjectStore.prototype.get=function(...args){const r=get.apply(this,args);requests.push(r);return r;};
 const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(forceConstraint){forceConstraint=false;return this.add(...args);}return put.apply(this,args);};
 const b=createIndexedDBBackend('callback-${name}');
 const assert=(ok,label)=>{if(!ok)throw Error(label);outcomes.push(label);};
 await b.apply(['a','b','c','d'].map(key=>({store:'meta',key,value:key})));assert(await b.get('meta','a')==='a','real read');
 assert(await b.compareAndApply(['a','b','c','d'].map(key=>({store:'meta',key,value:key})),[{store:'meta',key:'result',value:'saved'}])===true,'atomic compare commit');
 assert(await b.get('meta','result')==='saved','committed bytes');
 assert(await b.compareAndApply([{store:'meta',key:'a',value:'wrong'}],[{store:'meta',key:'result',value:'CORRUPT'}])===false,'stale compare refused');
 assert(await b.get('meta','result')==='saved','stale write did not mutate');
 forceAbort=true;let aborted=false;try{await b.get('meta','a');}catch{aborted=true;}assert(aborted,'native abort rejected');assert(await b.get('meta','a')==='a','abort left prior data');
 forceConstraint=true;let failed=false;try{await b.apply([{store:'meta',key:'a',value:'CORRUPT'},{store:'meta',key:'result',value:'CORRUPT'}]);}catch{failed=true;}assert(failed,'native request error rejected');assert(await b.get('meta','a')==='a'&&await b.get('meta','result')==='saved','request error rolled back all writes');
 await b.apply([{store:'meta',key:'a',value:undefined}]);assert(await b.get('meta','a')===undefined,'delete committed');await b.clear(['meta']);assert((await b.keys('meta')).length===0,'clear committed');
 globalThis.heldNativeOwners={opens,txs,requests};

 const held= [...opens,...txs,...requests].map(o=>({kind:o.constructor.name,state:o.readyState??null,listeners:Object.entries(inventory(o)).flatMap(([kind,rows])=>rows.map(()=>kind))}));
 const listeners=held.reduce((n,o)=>n+o.listeners.length,0);assert(${JSON.stringify(name)}==='old'?listeners>0:listeners===0,'terminal callback ownership');
 return {outcomes,held,listeners};})()`});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));const beforeGc=await send('Memory.getDOMCounters');const repeated=await send('Runtime.evaluate',{awaitPromise:true,expression:`(async()=>{const {createIndexedDBBackend}=await import('/${name}.mjs');const b=createIndexedDBBackend('repeated-${name}');for(let n=0;n<100;n++)await b.get('meta','a');})()`});if(repeated.exceptionDetails)throw Error(JSON.stringify(repeated.exceptionDetails));const after100=await send('Memory.getDOMCounters');if(name==='new'&&after100.jsEventListeners>beforeGc.jsEventListeners+14)throw Error('per-operation native listener allocation');await send('HeapProfiler.collectGarbage');report.rows.push({name,...r.result.value,beforeGc,after100,afterGc:await send('Memory.getDOMCounters')});await browser.send('Target.closeTarget',{targetId});
}
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
console.log(report.rows.map(({name,listeners,outcomes,beforeGc,afterGc})=>({name,listeners,outcomes,beforeGc,afterGc})));
