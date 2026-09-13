// Read-only compiler interop; exact producer/input hashes retained. No copied
// modules in this tree, no body card typed by hand, no per-creature clip edits.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import {rolldown} from 'rolldown';
const motion=path.resolve(process.argv[2]),output=path.resolve(process.argv[3]),root=path.resolve(import.meta.dirname,'../../../..');
if(fs.existsSync(output))throw Error('New body card proof directory required');
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-body-card-')),report={status:'RUNNING',scope:'real producer body cards and timelines only; no GSAP pose or motion acceptance',subjects:[],controls:[]};
const write=(n,v)=>fs.writeFileSync(path.join(output,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
fs.mkdirSync(output,{recursive:true});
try{
 const bundle=await rolldown({input:path.join(motion,'index.ts'),platform:'node',plugins:[{name:'provenance',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));}}]});try{await bundle.write({dir:scratch,entryFileNames:'producer.mjs',chunkFileNames:'chunk-[hash].mjs',format:'es'});}finally{await bundle.close();}
 const {compileBodyCard,buildTimeline}=await import(pathToFileURL(path.join(scratch,'producer.mjs')));
 for(const id of ['civet','fox','procedural']){
  const recordPath=path.join(root,id==='procedural'?'audits/C2_PARTS_ATLAS_20260913/native-painter-parts-03/record.json':'audits/CIVET_2D_PROOF_20260912/'+id+'.landmarks.json');
  const record=JSON.parse(fs.readFileSync(recordPath)),genomePath=path.join(root,'audits/CIVET_2D_PROOF_20260912/procedural-genome.json'),genome=id==='procedural'?JSON.parse(fs.readFileSync(genomePath)):undefined;
  sources.set(recordPath,sha(fs.readFileSync(recordPath)));if(genome)sources.set(genomePath,sha(fs.readFileSync(genomePath)));
  const card=compileBodyCard(record,genome);if(card.kind!=='body-card')throw Error(id+' compiler refused');
  if(JSON.stringify(card)!==JSON.stringify(compileBodyCard(record,genome)))throw Error('Nonrepeatable card');
  write(id+'.body-card.json',card);const timings={};
  for(const action of ['idle','melee','hit']){const tl=buildTimeline(card,action,record.identity.seed);if(JSON.stringify(tl)!==JSON.stringify(buildTimeline(card,action,record.identity.seed)))throw Error('Nonrepeatable timeline');write(id+'.'+action+'.json',tl);timings[action]={durationMs:tl.durationMs,bodyMs:tl.bodyMs,hitstopMs:tl.hitstopMs};}
  const wrong=structuredClone(record);delete wrong.landmarks.head;let refused=false;try{compileBodyCard(wrong,genome);}catch{refused=true;}if(!refused)throw Error('Missing head did not refuse');report.controls.push(id+': missing-head refusal; repeated card/timelines identical');
  report.subjects.push({id,recipeHash:record.recipeHash,massClass:card.massClass,materials:card.materials,notes:card.notes,timings});
 }
 for(const[p,hash]of sources)if(sha(fs.readFileSync(p))!==hash)throw Error('Input changed during proof: '+p);
 report.status='PASS';
}catch(e){report.status='FAIL';report.error=String(e.stack??e);process.exitCode=1;}
finally{report.sources=[...sources].map(([path,sha256])=>({path,sha256}));write('report.json',report);fs.rmSync(scratch,{recursive:true,force:true});}
console.log(JSON.stringify(report,null,2));
