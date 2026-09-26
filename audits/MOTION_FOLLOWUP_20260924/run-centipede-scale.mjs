/** Read source from the absolute Claude lane; never write or run its test runner there. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {fileURLToPath,pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {rolldown} from '../../port/v2/node_modules/rolldown/dist/index.mjs';
const local=fileURLToPath(new URL('../../',import.meta.url)).replace(/\/$/,''),claude='/Users/nick/Projects/celestial-frontier-anthropic-mac',out=path.resolve(process.argv[2]),overlay=process.argv[3]==='local-motion';
if(fs.existsSync(out))throw Error('Fresh diagnostic output required');
const files=new Map(),sha=b=>createHash('sha256').update(b).digest('hex'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cf-centipede-scale-'));
const names=['creature-rig-contact.ts','motion/actions.ts','motion/family-actions.ts','motion/timeline.ts'];
const remap=new Map(names.map(n=>[claude+'/port/v2/apps/game/src/'+n,local+'/port/v2/apps/game/src/'+n]));
let bundle;
try{
 bundle=await rolldown({input:path.join(import.meta.dirname,'centipede-scale.ts'),platform:'node',plugins:[{
  name:'read-only-source-authorities',
  async resolveId(source,importer){if(!overlay)return null;const result=await this.resolve(source,importer,{skipSelf:true});return result&&remap.has(result.id)?remap.get(result.id):null;},
  transform(code,id){if(!path.isAbsolute(id)||!fs.existsSync(id)||!fs.statSync(id).isFile())return null;files.set(id,sha(fs.readFileSync(id)));if((id.startsWith(claude+'/')||id.startsWith(local+'/'))&&!id.includes('/node_modules/'))return {code:code.replaceAll('import.meta.url',JSON.stringify(pathToFileURL(id).href)),map:null};return null;},
 }]});
 await bundle.write({file:path.join(tmp,'probe.mjs'),format:'es',codeSplitting:false});
 const run=spawnSync(process.execPath,[path.join(tmp,'probe.mjs'),out,process.argv[4]??'rest'],{cwd:local,stdio:'inherit',timeout:300000});if(run.error)throw run.error;process.exitCode=run.status??1;
}finally{
 const receipt={overlay:overlay?'local-motion':'none',sources:[...files].map(([file,hash])=>({path:file,sha256:hash,unchanged:sha(fs.readFileSync(file))===hash}))};fs.writeFileSync(out+'.sources.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});if(receipt.sources.some(s=>!s.unchanged))process.exitCode=1;
 await bundle?.close();fs.rmSync(tmp,{recursive:true});
}
