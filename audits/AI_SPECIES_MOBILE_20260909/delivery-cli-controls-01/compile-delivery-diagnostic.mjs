/** Compile the exact production read-only delivery owner using the already pinned
 * TS7 CLI. No compiler API assumptions, package install, browser or model access.
 * This is diagnostic code preparation, never an alternate game implementation. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const invoke=promisify(execFile),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(value,message)=>{if(!value)throw Error(message);};
const sourceNames=['local-model-delivery.ts','local-model-sha256.ts'];
export async function compileNativeDeliveryDiagnostic({receiptDirectory}={}){
  const sourceRoot=path.join(root,'port/v2/apps/game/src'),compilerRoot=path.join(root,'port/v2/node_modules/typescript');
  const installed=JSON.parse(await fs.readFile(path.join(compilerRoot,'package.json'),'utf8'));
  const lock=JSON.parse(await fs.readFile(path.join(root,'port/v2/package-lock.json'),'utf8'));
  need(installed.version==='7.0.2'&&lock.packages['node_modules/typescript']?.version===installed.version,'Diagnostic compiler differs from dependency lock');
  const {default:getExePath}=await import(pathToFileURL(path.join(compilerRoot,'lib/getExePath.js')).href);
  const executable=getExePath();
  const sources=await Promise.all(sourceNames.map(async name=>{const bytes=await fs.readFile(path.join(sourceRoot,name));return {name,bytes,sha256:sha(bytes)};}));
  const provenance={schema:'cf.native-delivery-diagnostic-compile.v1',compiler:{version:installed.version,
    executable,executableSha256:sha(await fs.readFile(executable)),entrySha256:sha(await fs.readFile(path.join(compilerRoot,'bin/tsc')))},
    sources:sources.map(({name,bytes,sha256})=>({path:'port/v2/apps/game/src/'+name,bytes:bytes.length,sha256})),
    command:null,config:null,exitCode:null,stdout:'',stderr:'',outputs:[],sourcesUnchanged:false,temporaryRemoved:false};
  if(receiptDirectory){await fs.mkdir(receiptDirectory,{recursive:false});for(const source of sources)await fs.writeFile(path.join(receiptDirectory,'source-'+source.name),source.bytes,{flag:'wx'});}
  const temporary=await fs.mkdtemp('/private/tmp/cf-delivery-owner-tsc-');
  let output;
  try{
    const compiled=path.join(temporary,'compiled'),project=path.join(temporary,'tsconfig.json');
    const config={compilerOptions:{target:'ES2022',module:'ES2022',moduleResolution:'Bundler',strict:true,
      lib:['ES2022','DOM','DOM.Iterable'],types:[],skipLibCheck:true,noEmitOnError:true,
      rootDir:sourceRoot,outDir:compiled,sourceMap:false,declaration:false,incremental:false},
      files:sourceNames.map(name=>path.join(sourceRoot,name))};
    provenance.config=config;provenance.command=[process.execPath,path.join(compilerRoot,'bin/tsc'),'--project',project,'--pretty','false'];
    await fs.writeFile(project,JSON.stringify(config,null,2)+'\n',{flag:'wx'});
    try{const result=await invoke(provenance.command[0],provenance.command.slice(1),{cwd:temporary,timeout:60000,maxBuffer:1024*1024});
      provenance.exitCode=0;provenance.stdout=result.stdout;provenance.stderr=result.stderr;
    }catch(error){provenance.exitCode=error.code??1;provenance.stdout=error.stdout??'';provenance.stderr=error.stderr??'';throw Error('Exact delivery diagnostic CLI compilation failed: '+provenance.stdout+' '+provenance.stderr,{cause:error});}
    const names=(await fs.readdir(compiled)).sort();
    need(JSON.stringify(names)===JSON.stringify(['local-model-delivery.js','local-model-sha256.js']),'Compiler emitted an unexpected diagnostic file set');
    const contents={};
    for(const name of names){const bytes=await fs.readFile(path.join(compiled,name));need(bytes.length>0&&bytes.length<131072,'Invalid diagnostic output size');
      contents[name]=bytes.toString('utf8');provenance.outputs.push({name,bytes:bytes.length,sha256:sha(bytes)});
      if(receiptDirectory)await fs.writeFile(path.join(receiptDirectory,name),bytes,{flag:'wx'});}
    const imports=[...contents['local-model-delivery.js'].matchAll(/(['"])\.\/local-model-sha256\.js\1/g)];
    need(imports.length===1,'Compiled owner must contain exactly one SHA module import');
    provenance.sourcesUnchanged=(await Promise.all(sources.map(async source=>sha(await fs.readFile(path.join(sourceRoot,source.name)))===source.sha256))).every(Boolean);
    need(provenance.sourcesUnchanged,'Production source changed during diagnostic compilation');
    output={shaModule:contents['local-model-sha256.js'],deliveryModule:contents['local-model-delivery.js'],shaImport:imports[0][0],provenance};
  }finally{
    need(temporary.startsWith('/private/tmp/cf-delivery-owner-tsc-'),'Diagnostic cleanup path changed');
    await fs.rm(temporary,{recursive:true});provenance.temporaryRemoved=true;
    if(receiptDirectory)await fs.writeFile(path.join(receiptDirectory,'compile.json'),JSON.stringify(provenance,null,2)+'\n',{flag:'wx'});
  }
  return output;
}
