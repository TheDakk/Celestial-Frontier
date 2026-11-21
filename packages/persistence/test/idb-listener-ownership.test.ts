import { describe, expect, it } from 'vitest';
import { createIndexedDBBackend } from '../src/repository.js';

const fakeEvents = {
  addEventListener(this: unknown, kind: string, listener: (event: unknown) => void) { (this as Record<string, unknown>)[`on${kind}`] = () => listener({target:this,type:kind}); },
  removeEventListener(this: unknown, kind: string, listener: unknown) { const t=this as Record<string, unknown>; void listener;t[`on${kind}`]=null; },
};
type Handler = (() => void) | null;
type Request = { result: unknown; error: Error | null; onsuccess: Handler; onerror: Handler; onblocked: Handler; onupgradeneeded: Handler };
type Tx = { db: unknown; error: Error | null; oncomplete: Handler; onerror: Handler; onabort: Handler; abort(): void; objectStore(): { get(): Request; put(value: string, key: string): void } };
function fixture(mode: 'success' | 'stale' | 'error' | 'abort' | 'request-error') {
  const requests: Request[] = [], transactions: Tx[] = [], writes: string[] = [], registrations: Handler[][] = [];
  const makeRequest = (result: unknown): Request => { const req={result,error:null,onsuccess:null,onerror:null,onblocked:null,onupgradeneeded:null};requests.push(req);return Object.assign(req, fakeEvents); };
  const captures = new Map<string, (event: unknown) => void>();
  const emit = (target: unknown, type: string) => captures.get(type)?.({target,type});
  const db = { addEventListener:(type:string, fn:(event:unknown)=>void, capture:boolean)=>{expect(capture).toBe(true);expect(captures.has(type)).toBe(false);captures.set(type,fn);}, objectStoreNames:{contains:()=>true},onclose:null,onversionchange:null,
    transaction: () => {
      const tx: Tx = {db,error:null,oncomplete:null,onerror:null,onabort:null,
        abort:()=>{tx.error=new Error('aborted');queueMicrotask(()=>emit(tx,'abort'));},
        objectStore:()=>({get:()=>{const req=Object.assign(makeRequest(mode==='stale'?'changed':'expected'),{transaction:tx});queueMicrotask(()=>{if(mode==='request-error'){req.error=new Error('request failure');emit(req,'error');}else emit(req,'success');});return Object.assign(req, fakeEvents);},put:(value,key)=>writes.push(key+'='+value)})};
      transactions.push(tx);
      // Requests created synchronously after transaction creation settle before the terminal event.
      queueMicrotask(()=>queueMicrotask(()=>{registrations.push([tx.oncomplete,tx.onerror,tx.onabort]);if(tx.error)return;if(mode==='error'){tx.error=new Error('write failure');emit(tx,'error');}else if(mode==='abort')tx.abort();else emit(tx,'complete');}));return Object.assign(tx, fakeEvents);
    }};
  const opening=makeRequest(db),factory={open:()=>{queueMicrotask(()=>opening.onsuccess?.());return opening;}} as unknown as IDBFactory;
  return {factory,requests,transactions,writes,opening,registrations,captures};
}
const expectReleased=(f:ReturnType<typeof fixture>)=>{
  expect(f.transactions.length).toBeGreaterThan(0);
  for(const tx of f.transactions)expect([tx.oncomplete,tx.onerror,tx.onabort]).toEqual([null,null,null]);
  for(const req of f.requests)expect([req.onsuccess,req.onerror,req.onblocked,req.onupgradeneeded]).toEqual([null,null,null,null]);
};
describe('IndexedDB native callback ownership',()=>{
  for(const mode of ['success','error','abort'] as const)it(`releases read transaction and open callbacks after ${mode}`,async()=>{
    const previous=globalThis.indexedDB,f=fixture(mode);globalThis.indexedDB=f.factory;
    try{const pending=createIndexedDBBackend('ownership').get('meta','x');
      if(mode==='success')await expect(pending).resolves.toBe('expected');else await expect(pending).rejects.toThrow(mode==='error'?'write failure':'aborted');
      expectReleased(f);
    }finally{globalThis.indexedDB=previous;}
  });
  for(const mode of ['success','stale','request-error','error','abort'] as const)it(`releases compare/write callbacks after ${mode} with the same outcome`,async()=>{
    const previous=globalThis.indexedDB,f=fixture(mode);globalThis.indexedDB=f.factory;
    try{const pending=createIndexedDBBackend('ownership').compareAndApply([{store:'meta',key:'a',value:'expected'},{store:'meta',key:'b',value:'expected'}],[{store:'meta',key:'result',value:'saved'}]);
      if(mode==='success'){await expect(pending).resolves.toBe(true);expect(f.writes).toEqual(['result=saved']);}
      else if(mode==='stale'){await expect(pending).resolves.toBe(false);expect(f.writes).toEqual([]);}
      else await expect(pending).rejects.toThrow(mode==='error'?'write failure':'aborted');
      expectReleased(f);
    }finally{globalThis.indexedDB=previous;}
  });
});

it('independent concurrent reads reuse native dispatchers without sharing their promise state',async()=>{
 const prior=globalThis.indexedDB,f=fixture('success');globalThis.indexedDB=f.factory;
 try{const backend=createIndexedDBBackend('shared-owner');expect(await Promise.all([backend.get('meta','a'),backend.get('meta','b')])).toEqual(['expected','expected']);
 expect(f.registrations).toEqual([[null,null,null],[null,null,null]]);expect([...f.captures.keys()].sort()).toEqual(['abort','complete','error','success']);expectReleased(f);
 }finally{globalThis.indexedDB=prior;}
});

it('released operation state cannot receive later database events', async () => {
  const {ownIdbCallbacks}=await import('../src/idb-callbacks.js');
  const captures=new Map<string,(event:unknown)=>void>();
  const db={addEventListener:(kind:string,fn:(event:unknown)=>void)=>captures.set(kind,fn)};
  const tx={db} as unknown as IDBTransaction;
  let completions=0;
  const release=ownIdbCallbacks(tx,{complete:()=>{completions++;}});
  captures.get('complete')!({target:tx,type:'complete'});
  expect(completions).toBe(1);
  release();release();
  captures.get('complete')!({target:tx,type:'complete'});
  expect(completions).toBe(1);
});
