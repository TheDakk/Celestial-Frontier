(() => {
 const rows=[], seen=new WeakSet();
 for(const C of [IDBRequest,IDBOpenDBRequest,IDBTransaction,IDBDatabase])for(const key of Object.getOwnPropertyNames(C.prototype)){
  if(!key.startsWith('on'))continue;const descriptor=Object.getOwnPropertyDescriptor(C.prototype,key);if(!descriptor?.set||!descriptor.configurable)continue;
  Object.defineProperty(C.prototype,key,{...descriptor,set(value){descriptor.set.call(this,value);if(!seen.has(this)){seen.add(this);rows.push({ref:new WeakRef(this),kind:this.constructor.name,stack:new Error().stack});}}});
 }
 globalThis.__cfIdbOwners=()=>rows.flatMap(row=>{const value=row.ref.deref();if(!value)return[];const keys=['onsuccess','onerror','onblocked','onupgradeneeded','oncomplete','onabort','onclose','onversionchange'];return[{kind:row.kind,listeners:keys.filter(k=>typeof value[k]==='function'),state:value.readyState??null,mode:value.mode??null,stores:value.objectStoreNames?Array.from(value.objectStoreNames):[],stack:row.stack}];});
})();
