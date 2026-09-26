import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {rolldown} from 'rolldown';
import {acquireWorkspaceLock} from '../workspacelock.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// CLI authoring build only. Unit tests import the pure compiler, never this lock.
const output=path.resolve(process.argv[2]??'');
if(process.argv.length!==3)throw Error('Usage: kit-export.mjs NEW_OUTPUT_DIRECTORY');
await fs.mkdir(output);
let bundle,release;
try{
  release=acquireWorkspaceLock('pure Art Kit v4 prompt export');
  const sources=new Map();
  const remember=async file=>{
    if(!sources.has(file)){
      const relative=path.relative(root,file);
      if(relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('External source refused');
      const bytes=await fs.readFile(file);sources.set(file,{path:relative,sha256:sha(bytes),bytes:bytes.length});
    }
  };
  for(const name of ['ART_KIT.md','port/v2/tools/landfall-snapshot/kit-export.mjs','port/v2/package-lock.json'])await remember(path.join(root,name));
  bundle=await rolldown({input:path.join(here,'kit-entry.ts'),platform:'node',plugins:[{
    name:'kit-source-receipt',async transform(code,id){if(path.isAbsolute(id))await remember(id);return null;},
    generateBundle(){for(const id of this.getModuleIds())if(this.getModuleInfo(id)?.isExternal)throw Error('External compiler module refused: '+id);}
  }]});
  await bundle.write({dir:output,format:'es',entryFileNames:'kit-compiler.mjs',codeSplitting:false});
  const {compileCanonicalEarthKit}=await import(pathToFileURL(path.join(output,'kit-compiler.mjs')).href);
  const compiled=compileCanonicalEarthKit(await fs.readFile(path.join(root,'ART_KIT.md'),'utf8'));
  for(const row of [...compiled.prompts,...compiled.familyReferences])for(const owner of row.sourceOwners){
    const file=owner.split('#')[0].replace(/^art\//,'port/v2/packages/art/src/');
    await remember(path.join(root,file));
  }
  const files=[];
  const write=async(name,bytes)=>{await fs.writeFile(path.join(output,name),bytes,{flag:'wx'});files.push({path:name,sha256:sha(bytes),bytes:Buffer.byteLength(bytes)});};
  for(const row of [...compiled.prompts,compiled.plate,...compiled.familyReferences])await write(row.key+'-prompt.txt',row.prompt);
  await write('canonical-snapshot.json',JSON.stringify(compiled.sourceSnapshot));
  await write('compiled-inputs.json',JSON.stringify(compiled,null,2)+'\n');
  for(const [file,before]of sources)if(sha(await fs.readFile(file))!==before.sha256)throw Error('Source changed during compilation: '+before.path);
  await write('manifest.json',JSON.stringify({schema:'cf.art.kit-export.v4',sources:[...sources.values()].sort((a,b)=>a.path.localeCompare(b.path)),files},null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',output,subjects:compiled.prompts.map(row=>row.name),sources:sources.size}));
}finally{await bundle?.close();release?.();}
