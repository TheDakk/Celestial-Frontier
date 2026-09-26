/** Frozen local evidence server only. Vite8.2.0 still injects its browser client
 * when server.hmr/ws are false. Disable the one eager connection in a served
 * copy, preserving its CSS/query helpers and all real error reporting. */
import fs from 'node:fs/promises';
import {assertTrackedKitSources} from './kit-tracked-inputs.mjs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const FROZEN_VITE_CLIENT_PIN=Object.freeze({version:'8.2.0',
  source:'port/v2/node_modules/vite/dist/client/client.mjs',sha256:'81046c87b1a73014203be2d7f643ee786b8264384952648ebf2ae418008be5d4'});
const CONNECT='transport.connect(createHMRHandler(handleMessage));';
const ANNOUNCE='console.debug("[vite] connecting...");';
const MARKER='/* Celestial Frontier frozen preview: no HMR connection is started. */';
const sha=code=>createHash('sha256').update(code).digest('hex');
const need=(value,message)=>{if(!value)throw Error(message);};
const once=(source,needle)=>source.split(needle).length===2;
export function frozenPreviewClientSource(source){
  need(typeof source==='string'&&sha(source)===FROZEN_VITE_CLIENT_PIN.sha256,'Locked Vite browser client bytes changed');
  need(once(source,CONNECT)&&once(source,ANNOUNCE),'Vite eager connection shape changed');
  // No catch handler, error filter, WebSocket shim, replacement helpers or
  // package mutation. The disabled server has no live-update transport.
  return source.replace(CONNECT,MARKER).replace(ANNOUNCE,'console.debug("[cf preview] source frozen; HMR disabled");');
}
export function frozenPreviewClientPlugin(){
  const client=path.join(ROOT,FROZEN_VITE_CLIENT_PIN.source).replaceAll('\\','/');
  return {name:'cf-frozen-preview-client',apply:'serve',enforce:'pre',
    configResolved(config){need(config.server.middlewareMode===true&&config.server.hmr===false&&config.server.ws===false
      &&config.server.forwardConsole?.enabled===false&&config.server.forwardConsole.unhandledErrors===false
      &&Array.isArray(config.server.forwardConsole.logLevels)&&config.server.forwardConsole.logLevels.length===0,
      'Frozen preview requires disabled HMR, WebSocket and console forwarding');},
    transform(source,id){if(id.split('?')[0].replaceAll('\\','/')!==client)return null;
      return {code:frozenPreviewClientSource(source),map:null};}};
}
/** Shared by the real model preview and its no-inference native boot check. */
export async function createFrozenGameViteServer({mode='evidence',createViteServer}={}){
  need(['evidence','development'].includes(mode),'Invalid frozen preview mode');
  assertTrackedKitSources(ROOT);
  const pkg=JSON.parse(await fs.readFile(path.join(ROOT,'port/v2/node_modules/vite/package.json'),'utf8'));
  need(pkg.version===FROZEN_VITE_CLIENT_PIN.version,'Locked Vite version changed');
  frozenPreviewClientSource(await fs.readFile(path.join(ROOT,FROZEN_VITE_CLIENT_PIN.source),'utf8'));
  const create=createViteServer??(await import(pathToFileURL(path.join(ROOT,'port/v2/node_modules/vite/dist/node/index.js')).href)).createServer;
  const gameRoot=path.join(ROOT,'port/v2/apps/game');
  return create({root:gameRoot,configFile:path.join(gameRoot,'vite.config.ts'),mode,
    plugins:[frozenPreviewClientPlugin()],server:{middlewareMode:true,hmr:false,ws:false,forwardConsole:false,
      fs:{allow:[ROOT]}},appType:'spa'});
}
