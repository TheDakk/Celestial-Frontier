import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=fs.realpathSync(path.resolve(here,'../../../..'));
assert.equal(process.argv.length,3,'Usage: node port/v2/tools/audio-native-mix/build.mjs /absolute/new-build-directory');
const out=path.resolve(process.argv[2]);assert(!fs.existsSync(out),'Build directory must be new');
fs.mkdirSync(out,{recursive:false});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const record=p=>{const bytes=fs.readFileSync(p);return {path:path.relative(repo,p).split(path.sep).join('/'),bytes:bytes.length,sha256:sha(bytes)}};
const manifest={schema:'cf-native-audio-mix-build/v1',status:'RUNNING',startedAt:new Date().toISOString(),sources:[],files:[],virtualModules:[],warnings:[]};
const persist=()=>fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');persist();
let bundle;
try{
  const sources=new Map();
  for(const name of ['entry.ts','index.html','build.mjs','runner.mjs','chain.mjs','tsconfig.json','README.md']){const p=path.join(here,name);sources.set(p,record(p));}
  for(const name of ['port/v2/package.json','port/v2/package-lock.json','port/v2/tools/browsercdp.mjs','port/v2/tools/browserpath.mjs']){const p=path.join(repo,name);sources.set(p,record(p));}
  bundle=await rolldown({input:path.join(here,'entry.ts'),platform:'browser',
    onLog(level,log,handler){if(level==='warn')manifest.warnings.push({code:log.code,message:log.message});handler(level,log);},
    plugins:[{name:'native-mix-source-receipt',
      transform(_code,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile()&&!sources.has(id))sources.set(id,record(id));return null;},
      generateBundle(){for(const id of this.getModuleIds()){const info=this.getModuleInfo(id);assert(!info?.isExternal,'External module in offline proof: '+id);if(!path.isAbsolute(id)||!fs.existsSync(id))manifest.virtualModules.push(id);}}
    }]});
  await bundle.write({dir:out,format:'es',entryFileNames:'bundle.js',chunkFileNames:'chunk-[hash].js',sourcemap:true});
  fs.copyFileSync(path.join(here,'index.html'),path.join(out,'index.html'),fs.constants.COPYFILE_EXCL);
  for(const [p,before] of sources){const after=record(p);assert.deepEqual(after,before,'Source changed during isolated build: '+p);}
  manifest.sources=[...sources.values()].sort((a,b)=>a.path.localeCompare(b.path));
  const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(row=>row.isDirectory()?walk(path.join(dir,row.name)):[path.join(dir,row.name)]);
  manifest.files=walk(out).filter(p=>path.basename(p)!=='manifest.json').map(p=>{const b=fs.readFileSync(p);return{path:path.relative(out,p).split(path.sep).join('/'),bytes:b.length,sha256:sha(b)}}).sort((a,b)=>a.path.localeCompare(b.path));
  assert(manifest.files.some(row=>row.path==='bundle.js'));manifest.status='PASS';
}catch(error){manifest.status='FAIL';manifest.error=String(error.stack??error);process.exitCode=1;}
finally{try{await bundle?.close();}catch(error){manifest.status='FAIL';manifest.cleanupError=String(error);process.exitCode=1;}manifest.finishedAt=new Date().toISOString();persist();}
console.log(JSON.stringify({status:manifest.status,manifest:path.join(out,'manifest.json'),sources:manifest.sources.length,files:manifest.files.length}));
