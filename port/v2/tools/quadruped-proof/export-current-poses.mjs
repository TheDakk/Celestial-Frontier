/** Read-only current-producer export; no browser, renderer, inference or checkout lock.
 * node tools/quadruped-proof/export-current-poses.mjs MANIFEST PRODUCER_DIR NEW_OUTPUT
 * Paths are resolved from the caller; manifest asset paths are repository-relative.
 * This is motion evidence, never visual qualification. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {rolldown} from 'rolldown';

export const PRODUCER_SHA256='600e413b90587a5d3b2f40ace148a95e6e692fb82f3b4d2eba2f17b12f0a8660';
const root=path.resolve(import.meta.dirname,'../../../..'),sha=b=>createHash('sha256').update(b).digest('hex');
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');

/** Bind the exact native planning expression, rather than maintaining a copy. */
export function extractNativePlanning(source){
 const one=expression=>{const found=[...source.matchAll(expression)];if(found.length!==1)throw Error('Native planning source shape changed');return found[0][1];};
 const declaration=one(/^ const makePlan=(.+);$/gm),boundsDeclaration=one(/^const bounds=(.+);$/gm);
 const dimensions=[...source.matchAll(/^const W=(\d+),H=(\d+),G=/gm)];
 if(dimensions.length!==1)throw Error('Native stage dimensions changed');
 const [,w,h]=dimensions[0];
 return "import {buildTurnPlan} from 'cf-proof/battle2/choreography.ts';\n"+
  `export const W=${w},H=${h};\nexport const bounds=${boundsDeclaration};\n`+
  `export function createMakePlan({arena,anchors,pb,pl,ps}){const makePlan=${declaration};return makePlan;}\n`;
}

export async function exportCurrentPoses({manifestFile,producerDirectory,outputDirectory}){
 const manifestPath=path.resolve(manifestFile),producer=path.resolve(producerDirectory),output=path.resolve(outputDirectory);
 if(fs.existsSync(output))throw Error('New output directory required');
 const sources=new Map(),remember=p=>{const absolute=path.resolve(p),bytes=fs.readFileSync(absolute),hash=sha(bytes),old=sources.get(absolute);if(old&&old.sha256!==hash)throw Error('Source changed while reading: '+absolute);sources.set(absolute,{path:absolute,sha256:hash});return bytes;};
 const readJson=p=>JSON.parse(remember(p)),image=p=>{const decoded=PNG.sync.read(remember(p));return {width:decoded.width,height:decoded.height,rgba:decoded.data};};
 const pin=remember(path.join(producer,'motion/gsap-adapter.ts'));if(sha(pin)!==PRODUCER_SHA256)throw Error('Unexpected GSAP producer bytes');
 const manifest=readJson(manifestPath);if(JSON.stringify(manifest.results?.map(r=>r.id))!==JSON.stringify(['civet','fox','procedural']))throw Error('Manifest must contain civet, fox and procedural in native order');
 const nativeSource=remember(path.join(import.meta.dirname,'parts-motion-entry.mjs')).toString('utf8'),planning=extractNativePlanning(nativeSource);
 const globalInputs={arena:readJson(path.join(root,'audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json')),anchorDocument:readJson(path.join(root,'audits/WILD_V43_PROOF_20260913/wild-anchors.json')),genome:readJson(path.join(root,'audits/CIVET_2D_PROOF_20260912/procedural-genome.json')),platypus:image(path.join(root,'audits/ART_KIT_ENGINE_FIRST_20260912/masters/platypus.png'))};
 const inputs=manifest.results.map(row=>{
  const record=readJson(path.resolve(root,row.record)),paint=image(path.resolve(root,row.keyed??('audits/C2_PARTS_ATLAS_20260913/'+(row.id==='civet'?'civet-v2':row.id)+'/keyed.png')));
  const bindingPath=path.resolve(root,row.binding??path.join(path.dirname(manifestPath),row.id+'.binding.json'));remember(bindingPath);
  return {id:row.id,record,paint,binding:sources.get(bindingPath)};
 });
 fs.mkdirSync(output,{recursive:true});const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-current-poses-'));
 const report={schema:'cf.current-pose-export/v1',status:'RUNNING',scope:'Current resolved motion only; no skin/shape, rendering, performance or visual acceptance. Node/browser transcendental operations may differ at floating-point roundoff.',runtime:{node:process.version,platform:process.platform,arch:process.arch},manifest:sources.get(manifestPath),producerSha256:PRODUCER_SHA256,planningSha256:sha(planning),subjects:[]};
 const persist=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...report,sources:[...sources.values()].sort((a,b)=>a.path.localeCompare(b.path))},null,2)+'\n');
 try{
  remember(import.meta.filename);
  const bundle=await rolldown({input:path.join(import.meta.dirname,'current-poses-entry.mjs'),platform:'node',plugins:[{name:'current-native-plan-and-producer',resolveId(id){if(id==='current-native-plan')return '\0current-native-plan';if(id.startsWith('cf-proof/')){const p=path.resolve(producer,id.slice(9));if(!p.startsWith(producer+path.sep))throw Error('Producer path escape');return p;}},load(id){if(id==='\0current-native-plan')return planning;},transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())remember(id);}}]});
  try{await bundle.write({dir:scratch,format:'es',entryFileNames:'bundle.mjs',chunkFileNames:'chunk-[hash].mjs'});}finally{await bundle.close();}
  const {exportCurrentSubject}=await import(pathToFileURL(path.join(scratch,'bundle.mjs')).href);
  // Fox first supplies the currently failing dense pose without waiting for peers.
  for(const input of [inputs[1],inputs[0],inputs[2]]){
   const result=exportCurrentSubject({...globalInputs,...input});result.binding=input.binding;
   const data=JSON.stringify(result)+'\n',name=input.id+'-poses.json';fs.writeFileSync(path.join(output,name),data);
   report.subjects.push({id:input.id,file:name,sha256:sha(data),denseSamples:result.dense.length,namedSamples:Object.keys(result.namedPoses).length});persist();
  }
  for(const r of sources.values())if(sha(fs.readFileSync(r.path))!==r.sha256)throw Error('Source changed during export: '+r.path);
  report.status='EXPORTED';report.exactSourceSnapshot=true;return report;
 }catch(error){report.status='FAIL';report.error=String(error.stack??error);throw error;}
 finally{persist();fs.rmSync(scratch,{recursive:true,force:true});}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==5)throw Error('Usage: export-current-poses.mjs MANIFEST PRODUCER_DIR NEW_OUTPUT');
 const result=await exportCurrentPoses({manifestFile:process.argv[2],producerDirectory:process.argv[3],outputDirectory:process.argv[4]});
 console.log(JSON.stringify({status:result.status,subjects:result.subjects,output:path.resolve(process.argv[4])}));
}
