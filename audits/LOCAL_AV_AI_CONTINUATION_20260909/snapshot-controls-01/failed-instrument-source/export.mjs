import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {rolldown} from 'rolldown';
import {acquireWorkspaceLock} from '../workspacelock.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=(file,value)=>fs.writeFile(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});

/** Fresh isolated pure-Node build, source receipt and canonical producer call.
 * Caller owns the foreground toolchain lock. No model, browser or game build. */
export async function exportCanonicalEarthSnapshot(directory){
  const output=path.resolve(directory);await fs.mkdir(output);
  const receipt={schema:'cf.landfall-snapshot-export/v1',status:'FAIL',sources:[],files:[],warnings:[]};
  const sources=new Map();let bundle,release,result;
  const remember=async file=>{
    if(!sources.has(file)){
      const relative=path.relative(root,file);
      if(relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('Snapshot source outside repository');
      const bytes=await fs.readFile(file);sources.set(file,{path:relative.split(path.sep).join('/'),bytes:bytes.length,sha256:sha(bytes)});
    }
  };
  try{
    release=acquireWorkspaceLock('isolated canonical landfall snapshot');
    for(const name of ['entry.ts','export.mjs'])await remember(path.join(here,name));
    for(const name of ['port/v2/package.json','port/v2/package-lock.json','port/v2/tools/workspacelock.mjs'])await remember(path.join(root,name));
    bundle=await rolldown({input:path.join(here,'entry.ts'),platform:'node',
      onLog(level,log,handler){if(level==='warn')receipt.warnings.push({code:log.code,message:log.message});handler(level,log);},
      plugins:[{name:'landfall-source-binding',
        async transform(_code,id){if(!path.isAbsolute(id))throw Error('Virtual snapshot source refused');await remember(id);return null;},
        generateBundle(){for(const id of this.getModuleIds())if(this.getModuleInfo(id)?.isExternal)throw Error('External snapshot module refused: '+id);}
      }]});
    await bundle.write({dir:output,format:'es',entryFileNames:'canonical-producer.mjs',inlineDynamicImports:true});
    const module=await import(pathToFileURL(path.join(output,'canonical-producer.mjs')).href);
    result=module.produceCanonicalEarthSnapshot();
    if(!result?.ok||typeof result.canonicalJson!=='string'||result.canonicalJson.length>128*1024
      ||JSON.stringify(result.snapshot)!==result.canonicalJson)throw Error('Canonical producer result mismatch');
    for(const [file,before]of sources){const bytes=await fs.readFile(file);if(bytes.length!==before.bytes||sha(bytes)!==before.sha256)throw Error('Snapshot source changed during export: '+before.path);}
    await fs.writeFile(path.join(output,'canonical-snapshot.json'),result.canonicalJson,{flag:'wx'});
    receipt.snapshotSha256=sha(result.canonicalJson);
    receipt.sources=[...sources.values()].sort((a,b)=>a.path.localeCompare(b.path));
    for(const name of ['canonical-producer.mjs','canonical-snapshot.json']){const bytes=await fs.readFile(path.join(output,name));receipt.files.push({path:name,bytes:bytes.length,sha256:sha(bytes)});}
    receipt.status='PASS';
  }catch(error){receipt.error=String(error.stack??error);}
  finally{
    try{await bundle?.close();}catch(error){receipt.status='FAIL';receipt.bundleCleanupError=String(error);}
    try{release?.();receipt.workspaceReleased=Boolean(release);}catch(error){receipt.status='FAIL';receipt.workspaceReleased=false;receipt.workspaceCleanupError=String(error);}
    await json(path.join(output,'manifest.json'),receipt);
  }
  if(receipt.status!=='PASS')throw Error('Canonical snapshot export failed: '+(receipt.error??receipt.bundleCleanupError??receipt.workspaceCleanupError));
  return {snapshot:result.snapshot,canonicalJson:result.canonicalJson,receipt};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{if(process.argv.length!==3)throw Error('Usage: export.mjs NEW_OUTPUT_DIRECTORY');const r=await exportCanonicalEarthSnapshot(process.argv[2]);console.log(JSON.stringify({status:r.receipt.status,snapshotSha256:r.receipt.snapshotSha256,sources:r.receipt.sources.length}));}
  catch(error){console.error(String(error.stack??error));process.exitCode=1;}
}
