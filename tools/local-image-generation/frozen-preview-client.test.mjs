import test,{after,before} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {FROZEN_VITE_CLIENT_PIN,frozenPreviewClientSource,frozenPreviewClientPlugin,createFrozenGameViteServer} from './frozen-preview-client.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const original=await fs.readFile(path.join(ROOT,FROZEN_VITE_CLIENT_PIN.source),'utf8');
const CONNECT='transport.connect(createHMRHandler(handleMessage));';
let release;
after(()=>release?.());

test('served copy disables eager transport while preserving exports, CSS/query helpers and error paths',()=>{
  assert.equal(createHash('sha256').update(original).digest('hex'),FROZEN_VITE_CLIENT_PIN.sha256);
  const corrected=frozenPreviewClientSource(original);assert.ok(!corrected.includes(CONNECT));
  assert.ok(corrected.includes('export { ErrorOverlay, createHotContext, injectQuery, removeStyle, updateStyle };'));
  assert.ok(corrected.includes('throw e;'));assert.ok(corrected.includes('console.error('));
  const expected=original.replace(CONNECT,'/* Celestial Frontier frozen preview: no HMR connection is started. */')
    .replace('console.debug("[vite] connecting...");','console.debug("[cf preview] source frozen; HMR disabled");');
  assert.equal(corrected,expected);
});

test('actual upstream eager-start span constructs transport once; corrected span never starts it',()=>{
  function count(source){const start=source.indexOf('let bundledDevClient;'),end=source.indexOf('function clearOverlayOrReloadOnFirstUpdate()',start);
    assert.ok(start>=0&&end>start);let calls=0;
    new Function('transport','createHMRHandler','handleMessage','setupForwardConsoleHandler','forwardConsole',source.slice(start,end))(
      {connect(){calls++;}},()=>({}),()=>{},()=>{},false);return calls;}
  assert.equal(count(original),1);assert.equal(count(frozenPreviewClientSource(original)),0);
});

test('dependency byte changes, duplicate or missing eager starts refuse instead of suppressing unknown code',()=>{
  for(const changed of [original+'\n',original.replace(CONNECT,''),original.replace(CONNECT,CONNECT+'\n'+CONNECT)])
    assert.throws(()=>frozenPreviewClientSource(changed),/client bytes changed/);
});

test('plugin only transforms the exact installed client and requires a genuinely disabled server',()=>{
  const plugin=frozenPreviewClientPlugin(),config={server:{middlewareMode:true,hmr:false,ws:false,forwardConsole:{enabled:false,unhandledErrors:false,logLevels:[]}}};
  plugin.configResolved(config);assert.equal(plugin.transform(original,'/some/app/client.mjs'),null);
  assert.equal(plugin.transform(original,path.join(ROOT,FROZEN_VITE_CLIENT_PIN.source)).code,frozenPreviewClientSource(original));
  for(const field of ['middlewareMode','hmr','ws','forwardConsole']){const bad=structuredClone(config);bad.server[field]=!bad.server[field];
    assert.throws(()=>plugin.configResolved(bad),/requires disabled/);}
});

test('real frozen Vite middleware serves its transformed client and normal game index without a socket listener',async()=>{
  const vite=await createFrozenGameViteServer(),server=http.createServer((request,response)=>vite.middlewares(request,response,()=>{response.writeHead(404);response.end();}));
  try{
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const base='http://127.0.0.1:'+server.address().port;
    const client=await fetch(base+'/@vite/client');assert.equal(client.status,200);const code=await client.text();
    assert.ok(code.includes('Celestial Frontier frozen preview: no HMR connection is started.'));
    assert.ok(!code.includes(CONNECT));assert.ok(!code.includes('__HMR_PORT__'));
    const index=await fetch(base+'/');assert.equal(index.status,200);assert.match(await index.text(),/src\/main.ts/);
    assert.equal(vite.config.server.ws,false);assert.equal(vite.config.server.hmr,false);assert.equal(vite.config.server.forwardConsole.enabled,false);
  }finally{try{if(server.listening)await new Promise((resolve,reject)=>{server.close(error=>error?reject(error):resolve());server.closeAllConnections();});}finally{await vite.close();}}
});
