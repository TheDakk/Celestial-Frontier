/** Optional local AI/PWA assembly. Never downloads weights, installs packages,
 * publishes, overwrites an output, or changes the ordinary Vite build lane. */
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {verifyRuntimePack,SHIPPED_PACK_LIMIT,RETAINED_UPDATE_LIMIT} from './runtime-pack.mjs';
import {assertIgnoredCache} from './fetch-model.mjs';
import {celestialFrontierPwaPlugin} from '../../port/v2/apps/game/pwa-build.ts';
import {PINNED_LOCAL_MODEL_MANIFEST_V1} from '../../port/v2/apps/game/src/local-model-manifest.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const APP=path.join(ROOT,'port/v2/apps/game');
const MANIFEST='mobile-pack-manifest.json';
const RUNTIME_MANIFEST='runtime-pack-manifest.json';
const SW='service-worker.js';
const PWA_SCHEMA='cf-v2-pwa-build/v1';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
const need=(condition,message)=>{if(!condition)throw Error(message);};
const hex=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const safe=value=>typeof value==='string'&&value.length<=300&&value.split('/').every(part=>/^[A-Za-z0-9_@][A-Za-z0-9_.@-]*$/.test(part)&&part!=='.'&&part!=='..');
const forbidden=value=>/(?:\.onnx(?:\.data)?|\.data|\.map)$/i.test(value)||/(?:^|\/)(?:model-cache|models|\.git)(?:\/|$)/.test(value);
const same=(a,b)=>a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeMs===b.mtimeMs&&a.ctimeMs===b.ctimeMs;
async function regular(file){const stat=await fs.lstat(file);need(stat.isFile()&&!stat.isSymbolicLink()&&await fs.realpath(file)===path.resolve(file),'Unsafe package file: '+file);return stat;}
async function digest(file){const before=await regular(file),digest=createHash('sha256');let bytes=0;
  for await(const chunk of createReadStream(file)){bytes+=chunk.length;need(bytes<=SHIPPED_PACK_LIMIT,'Package file exceeds admission bound');digest.update(chunk);}
  need(bytes===before.size&&same(before,await regular(file)),'Package file changed during measurement');return {bytes,sha256:digest.digest('hex')};}
async function inventory(directory){const rows=[];let entries=0;
  async function walk(folder,prefix='',depth=0){need(depth<=12,'Package directory exceeds depth bound');
    for(const entry of (await fs.readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
      const relative=prefix+entry.name;need(++entries<=2048&&safe(relative)&&!entry.isSymbolicLink(),'Unsafe/excess package entry');
      if(entry.isDirectory())await walk(path.join(folder,entry.name),relative+'/',depth+1);
      else{need(entry.isFile()&&!forbidden(relative),'Model/source-map/unsafe file in browser package');
        if(relative!==MANIFEST)rows.push({path:relative,...await digest(path.join(folder,entry.name))});}
    }}
  await walk(directory);return rows.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);}
async function newOutput(output){need(typeof output==='string','Package output required');const absolute=path.resolve(output);
  if(!absolute.startsWith('/private/tmp/'))await assertIgnoredCache(absolute);
  let ancestor=path.dirname(absolute);while(ancestor!==path.dirname(ancestor)){
    try{const stat=await fs.lstat(ancestor);need(stat.isDirectory()&&!stat.isSymbolicLink(),'Unsafe output ancestor');}catch(error){if(error.code!=='ENOENT')throw error;}
    ancestor=path.dirname(ancestor);}
  try{await fs.lstat(absolute);throw Error('Package output already exists; no overwrite');}catch(error){if(error.code!=='ENOENT')throw error;}return absolute;}
function field(source,name){const expression=new RegExp('^const '+name+'=(.*);$','gm'),matches=[...source.matchAll(expression)];need(matches.length===1,'Missing/duplicate PWA '+name);return JSON.parse(matches[0][1]);}
export function inspectPwaInventory(source){
  const schema=field(source,'SCHEMA'),buildId=field(source,'BUILD_ID'),workerRevision=field(source,'WORKER_REVISION'),base=field(source,'BASE_PATH');
  need(schema===PWA_SCHEMA&&hex(buildId)&&hex(workerRevision)&&base==='/','Unexpected PWA identity/base');
  const matches=[...source.matchAll(/^const ASSETS=Object\.freeze\((.*)\);$/gm)];need(matches.length===1,'Missing/duplicate PWA assets');
  const assets=JSON.parse(matches[0][1]),seen=new Set();need(Array.isArray(assets)&&assets.length>0&&assets.length<=2048,'Invalid PWA assets');
  let canonical=schema+'\nworker\t'+workerRevision+'\n';
  for(const row of [...assets].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)){
    need(row&&typeof row.path==='string'&&row.path.startsWith('/')&&safe(row.path.slice(1))&&hex(row.sha256)&&!seen.has(row.path),'Unsafe/duplicate PWA asset');seen.add(row.path);canonical+=row.path+'\t'+row.sha256+'\n';}
  need(hash(canonical)===buildId,'PWA build identity does not match its exact table');return {buildId,workerRevision,assets};
}
/** Download bytes and retained static response bytes; browser quota/metadata,
 * model OPFS, original artwork and live GPU/RAM remain separate measurements. */
export function measureMobileBudget(currentBytes,priorBytes=currentBytes){
  for(const bytes of [currentBytes,priorBytes])need(Number.isSafeInteger(bytes)&&bytes>0,'Invalid combined package byte count');
  need(currentBytes<=SHIPPED_PACK_LIMIT&&priorBytes<=SHIPPED_PACK_LIMIT,'Combined app/runtime exceeds 128 MiB');
  const retainedStaticBytes=currentBytes+priorBytes;need(retainedStaticBytes<=RETAINED_UPDATE_LIMIT,'Retained app pair exceeds 256 MiB');
  return {currentBytes,priorBytes,retainedStaticBytes,shippedLimitBytes:SHIPPED_PACK_LIMIT,retainedLimitBytes:RETAINED_UPDATE_LIMIT,
    currentHeadroomBytes:SHIPPED_PACK_LIMIT-currentBytes,retainedHeadroomBytes:RETAINED_UPDATE_LIMIT-retainedStaticBytes,
    excludesBrowserStorageOverhead:true,excludesModelAndOriginals:true};
}
export function pinnedModelDeliveryPolicy(){const model=PINNED_LOCAL_MODEL_MANIFEST_V1;
  return {sourceManifestSha256:model.sourceManifestSha256,files:model.files.map(file=>({
    url:'https://huggingface.co/'+model.modelId+'/resolve/'+model.revision+'/'+file.path,...{bytes:file.bytes,sha256:file.sha256}}))};}
export async function mobileRuntimeAssetsPlugin({runtimeDirectory,runtimeManifestSha256}){
  const runtime=await verifyRuntimePack({directory:runtimeDirectory,expectedManifestSha256:runtimeManifestSha256});
  const manifest=JSON.parse(await fs.readFile(path.join(runtimeDirectory,RUNTIME_MANIFEST),'utf8'));
  const files=[...manifest.files.map(row=>row.path),RUNTIME_MANIFEST];
  return {name:'celestial-frontier-optional-installed-ai-assets',apply:'build',
    async buildStart(){for(const name of files){const bytes=await fs.readFile(path.join(runtimeDirectory,name));this.emitFile({type:'asset',fileName:name,source:bytes});}},
    async closeBundle(){await verifyRuntimePack({directory:runtimeDirectory,expectedManifestSha256:runtimeManifestSha256});},runtime};
}
async function runtimeSubset(directory,expectedSha){
  return verifyRuntimePack({directory,expectedManifestSha256:expectedSha,allowApplicationFiles:true});
}

export async function sealMobilePack({directory,runtimeManifestSha256,sourceIdentity,prior}={}){
  need(hex(runtimeManifestSha256),'External runtime manifest SHA required');
  await runtimeSubset(directory,runtimeManifestSha256);
  const files=await inventory(directory),pwa=inspectPwaInventory(await fs.readFile(path.join(directory,SW),'utf8'));
  const expected=new Map(files.filter(row=>row.path!==SW).map(row=>['/'+row.path,row.sha256]));
  need(pwa.assets.length===expected.size&&pwa.assets.every(row=>expected.get(row.path)===row.sha256),'Combined PWA omitted/substituted output');
  const priorResult=prior?await verifyMobilePack(prior):null;
  const manifest={schema:'cf.local-ai-mobile-pack.v1',localDiagnostic:true,publishable:false,sourceIdentity,runtimeManifestSha256,
    buildId:pwa.buildId,workerRevision:pwa.workerRevision,files,modelWeightsIncluded:false,modelAutoDownload:false,
    prior:priorResult?{manifestSha256:prior.expectedManifestSha256,totalBytes:priorResult.totalBytes,buildId:priorResult.buildId}:null,
    distributionQualified:false,physicalPhoneQualified:false,fullModelInstallQualified:false,
    budgetScope:'Exact package files plus final manifest; prior defaults to the same-size successor envelope. Browser metadata, models and originals are excluded.'};
  const bytes=Buffer.from(json(manifest)),payload=files.reduce((sum,row)=>sum+row.bytes,0);measureMobileBudget(payload+bytes.length,priorResult?.totalBytes??payload+bytes.length);
  await fs.writeFile(path.join(directory,MANIFEST),bytes,{flag:'wx'});
  return {directory,manifestSha256:hash(bytes),...await verifyMobilePack({directory,expectedManifestSha256:hash(bytes)})};
}
export async function verifyMobilePack({directory,expectedManifestSha256}={}){
  need(typeof directory==='string'&&hex(expectedManifestSha256),'External mobile manifest SHA required');const root=path.resolve(directory);
  need(await fs.realpath(root)===root,'Mobile pack root symlink refused');const metadata=path.join(root,MANIFEST),stat=await regular(metadata);need(stat.size<=1024*1024,'Oversized mobile manifest');
  const bytes=await fs.readFile(metadata);need(hash(bytes)===expectedManifestSha256,'Mobile manifest SHA mismatch');const manifest=JSON.parse(bytes);
  need(manifest.schema==='cf.local-ai-mobile-pack.v1'&&manifest.localDiagnostic===true&&manifest.publishable===false&&manifest.modelWeightsIncluded===false&&manifest.modelAutoDownload===false
    &&manifest.distributionQualified===false&&manifest.physicalPhoneQualified===false&&manifest.fullModelInstallQualified===false,'Invalid mobile pack qualification');
  const files=await inventory(root);need(JSON.stringify(files)===JSON.stringify(manifest.files),'Mobile package inventory mismatch');
  await runtimeSubset(root,manifest.runtimeManifestSha256);
  const pwa=inspectPwaInventory(await fs.readFile(path.join(root,SW),'utf8')),expected=new Map(files.filter(row=>row.path!==SW).map(row=>['/'+row.path,row.sha256]));
  need(pwa.buildId===manifest.buildId&&pwa.workerRevision===manifest.workerRevision&&pwa.assets.length===expected.size&&pwa.assets.every(row=>expected.get(row.path)===row.sha256),'Mobile PWA table mismatch');
  const totalBytes=files.reduce((sum,row)=>sum+row.bytes,0)+bytes.length,budget=measureMobileBudget(totalBytes,manifest.prior?.totalBytes??totalBytes);
  return {status:'PASS',buildId:pwa.buildId,fileCount:files.length+1,totalBytes,budget,distributionQualified:false,physicalPhoneQualified:false,fullModelInstallQualified:false};
}
export async function buildMobilePack({output,runtimeDirectory,runtimeManifestSha256,localDiagnostic=false,prior}={}){
  need(localDiagnostic===true,'Working-tree assembly requires explicit localDiagnostic; no publication authority');
  const destination=await newOutput(output),runtimePlugin=await mobileRuntimeAssetsPlugin({runtimeDirectory,runtimeManifestSha256});
  const sourceIdentity={head:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),
    branch:execFileSync('git',['branch','--show-current'],{cwd:ROOT,encoding:'utf8'}).trim(),mode:'evidence',workingTree:true};
  need(sourceIdentity.branch==='openai/mac','Unexpected mobile build ownership branch');
  const require=createRequire(path.join(APP,'package.json')),vite=await import(pathToFileURL(require.resolve('vite')).href);
  const loaded=await vite.loadConfigFromFile({command:'build',mode:'evidence'},path.join(APP,'vite.config.ts'),APP);
  need(loaded&&Array.isArray(loaded.config.plugins)&&loaded.config.plugins.length===1&&loaded.config.plugins[0].name==='celestial-frontier-exact-pwa','Default Vite plugin contract changed');
  await vite.build({...loaded.config,root:APP,configFile:false,mode:'evidence',base:'/',
    plugins:[celestialFrontierPwaPlugin({modelDelivery:pinnedModelDeliveryPolicy()}),runtimePlugin],
    build:{...loaded.config.build,outDir:destination,sourcemap:false,emptyOutDir:false}});
  return sealMobilePack({directory:destination,runtimeManifestSha256,sourceIdentity,prior});
}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.wasm':'application/wasm','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.css':'text/css; charset=utf-8','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
/** Dedicated localhost origin only. Unknown assets are real 404s, never HTML.
 * No developer model mirror exists in a package or production fallback. */
export async function createMobilePackServer({directory,expectedManifestSha256}={}){
  const verified=await verifyMobilePack({directory,expectedManifestSha256}),root=path.resolve(directory),manifest=JSON.parse(await fs.readFile(path.join(root,MANIFEST)));
  const rows=new Map([...manifest.files.map(row=>[row.path,row]),[MANIFEST,{bytes:(await fs.stat(path.join(root,MANIFEST))).size,sha256:expectedManifestSha256}]]);
  const requests=[];const server=http.createServer(async(request,response)=>{
    try{const url=new URL(request.url,'http://127.0.0.1'),name=url.pathname==='/'?'index.html':url.pathname.slice(1);
      const row=rows.get(name);requests.push({method:request.method,path:url.pathname,status:row?200:404});
      response.setHeader('Cross-Origin-Opener-Policy','same-origin');response.setHeader('Cross-Origin-Embedder-Policy','require-corp');
      response.setHeader('Cross-Origin-Resource-Policy','same-origin');response.setHeader('X-Content-Type-Options','nosniff');
      response.setHeader('Cache-Control','no-store');
      if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);response.end();return;}
      if(!row||!safe(name)||(url.search&&name!=='index.html')){response.writeHead(404);response.end('Not in this exact local package.');return;}
      const measured=await digest(path.join(root,name));need(measured.bytes===row.bytes&&measured.sha256===row.sha256,'Static package changed after startup');
      response.setHeader('Content-Type',MIME[path.extname(name)]??'application/octet-stream');response.setHeader('Content-Length',row.bytes);
      if(name===SW)response.setHeader('Service-Worker-Allowed','/');response.writeHead(200);
      if(request.method==='HEAD')response.end();else createReadStream(path.join(root,name)).pipe(response);
    }catch(error){if(!response.headersSent)response.writeHead(500);response.end('Static package verification refused.');requests.push({error:String(error.message)});}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {url:'http://127.0.0.1:'+server.address().port+'/',verified,requests,
    close:()=>new Promise((resolve,reject)=>{server.close(error=>error?reject(error):resolve());server.closeAllConnections();})};
}
async function main(){const [mode,...args]=process.argv.slice(2),options={};let localDiagnostic=false;
  for(const arg of args){if(arg==='--local-diagnostic')localDiagnostic=true;else{const matched=/^--(output|runtime|runtime-sha256|sha256)=(.+)$/.exec(arg);need(matched&&!Object.hasOwn(options,matched[1]),'Unknown/duplicate mobile pack argument');options[matched[1]]=matched[2];}}
  need(['build','verify'].includes(mode),'Usage: mobile-pack.mjs build --output=PATH --runtime=PATH --runtime-sha256=SHA --local-diagnostic | verify --output=PATH --sha256=SHA');
  const release=acquireWorkspaceLock('optional combined mobile AI pack '+mode);try{console.log(json(mode==='build'?await buildMobilePack({output:options.output,runtimeDirectory:options.runtime,runtimeManifestSha256:options['runtime-sha256'],localDiagnostic}):await verifyMobilePack({directory:options.output,expectedManifestSha256:options.sha256})));}finally{release();}}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{await main();}catch(error){console.error(error.stack??error);process.exitCode=1;}}
