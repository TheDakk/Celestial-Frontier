/** In-memory observational trace; exact original module identity and unchanged math. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {rolldown} from '../../../port/v2/node_modules/rolldown/dist/index.mjs';
const base=import.meta.dirname,root='/Users/nick/Projects/celestial-frontier-openai-mac',owner=path.join(root,'port/v2/apps/game/src/creature-rig-contact.ts');
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');if(i<3||!a.startsWith('--'))throw Error('Named arguments required');return[a.slice(2,i),a.slice(i+1)];}));
if(!args.fit||!args.out||Object.keys(args).some(k=>!['fit','out'].includes(k)))throw Error('--fit=/absolute/fit-directory --out=/absolute/new-output-prefix required');
const fit=path.resolve(args.fit),output=path.resolve(args.out),out=output+'.sources.json';
if(!fs.existsSync(path.join(fit,'record.json'))||!fs.existsSync(path.join(fit,'binding.json')))throw Error('Complete explicit fit required');
if(['.json','.sources.json','.log'].some(suffix=>fs.existsSync(output+suffix)))throw Error('All outputs must be new');
if(!fs.statSync(path.dirname(output)).isDirectory())throw Error('Existing output directory required');
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-tarantula-contact-')),insertions=[];let bundle;
sources.set(import.meta.filename,sha(fs.readFileSync(import.meta.filename)));
try{
 bundle=await rolldown({input:path.join(base,'contact-qualifier.ts'),platform:'node',plugins:[{name:'contact-observer',transform(code,id){
  if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile()){const hash=sha(fs.readFileSync(id));sources.set(id,hash);}
  if(id!==owner)return;const original=code;
  const add=(needle,insertion)=>{if(code.split(needle).length!==2)throw Error('Unique trace anchor required '+needle);code=code.replace(needle,insertion+needle);insertions.push({needle,insertion});};
  add('  if(padDeclaration){',`  (globalThis as any).__planarSweepTrace?.('targets',{phase,stance,pose,contacts,activeChains:activeChains.map(c=>({id:c.id,endpointOnly:c.endpointOnly}))});\n`);
  add('   for(const translation of candidates){restore();try{',`   (globalThis as any).__planarSweepTrace?.('candidates',{reach,bound,candidates});\n`);
  add('    compression=actual.y;rootAccommodation=',`    (globalThis as any).__planarSweepTrace?.('candidate-pass',{translation,actual,actualNorm,measured});\n`);
  add('attempts.push({translation:{...translation},reason:String(error)});',`(globalThis as any).__planarSweepTrace?.('candidate-refusal',{translation,error:String(error)});`);
  let restored=code;for(const {insertion}of insertions)restored=restored.replace(insertion,'');if(restored!==original)throw Error('Trace must invert to exact owner source');return {code,map:null};
 }}]});
 await bundle.write({file:path.join(scratch,'run.mjs'),format:'es'});
 const r=spawnSync(process.execPath,[path.join(scratch,'run.mjs'),'--fit='+fit,'--out='+output],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:16*1024*1024});fs.writeFileSync(output+'.log',(r.stdout??'')+(r.stderr??'')+(r.error?'\n'+String(r.error):''),{flag:'wx'});process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');process.exitCode=r.status??1;if(r.error)console.error(r.error);
}finally{
 const receipt=[...sources].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));
 fs.writeFileSync(out,JSON.stringify({scope:'Actual bundled source hashes plus runner; only exact invertible observational insertions in a temporary bundle. No static/ARAP/native run.',command:[process.execPath,import.meta.filename,'--fit='+fit,'--out='+output],insertions,sources:receipt},null,2)+'\n',{flag:'wx'});if(receipt.some(x=>!x.unchanged))process.exitCode=1;await bundle?.close();fs.rmSync(scratch,{recursive:true});
}
