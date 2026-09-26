/** In-memory observational contact trace; production source is never written. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {rolldown} from '../../../port/v2/node_modules/rolldown/dist/index.mjs';
const base=import.meta.dirname,root='/Users/nick/Projects/celestial-frontier-openai-mac',owner=path.join(root,'port/v2/apps/game/src/creature-rig-contact.ts');
const out=path.join(base,'contact-diagnosis-01.sources.json');
if(fs.existsSync(out)||fs.existsSync(path.join(base,'contact-diagnosis-01.json')))throw Error('New diagnostic outputs required');
const prior=new Map(JSON.parse(fs.readFileSync(path.join(base,'static-01.json.sources.json'))).map(x=>[x.path,x.sha256]));
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-beetle-contact-')),insertions=[],diagnosticSubstitutions=[];
let bundle;
try{
 bundle=await rolldown({input:path.join(base,'contact-diagnosis-01.ts'),platform:'node',plugins:[{name:'contact-observer',transform(code,id){
  if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile()){const hash=sha(fs.readFileSync(id));if(prior.has(id)&&hash!==prior.get(id))throw Error('Static source drift '+id);sources.set(id,hash);}
  if(id!==owner)return;
  const original=code;
  const add=(needle,insertion)=>{if(code.split(needle).length!==2)throw Error('Unique trace anchor required '+needle);code=code.replace(needle,insertion+needle);insertions.push({needle,insertion});};
  add('   if(compression+shift>scaleLength*.08)',`   (globalThis as any).__beetleContactTrace?.('compression',{pass,compression,shift,bound:scaleLength*.08,pose,chains:activeChains.map((c,i)=>{const target=contacts[i]!.endpointTarget,root=transformPoint(matrices[c.hip]!,c.root),dx=target.x-root.x,max=c.chain.lengths.upper+c.chain.lengths.lower,distance=Math.hypot(dx,target.y-root.y);return{id:c.id,root,target,distance,min:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),max,requiredShift:distance<=max?0:target.y-Math.sqrt(max*max-dx*dx)+1e-10-root.y};})});\n`);
  add('    let solved;try{solved=c.chain.solve(root,target);}',`    (globalThis as any).__beetleContactTrace?.('solve',{pass,id:c.id,root,target,parent,lengths:c.chain.lengths,distance:Math.hypot(target.x-root.x,target.y-root.y),minimum:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),maximum:c.chain.lengths.upper+c.chain.lengths.lower});\n`);
  add('   let maxError=0,maxPaintTargetErrorPx=0;',`   (globalThis as any).__beetleContactTrace?.('measure',{pose,contacts,compression,limits:template.contactLimitsDeg??template.limitsDeg});\n`);
  add('  const uncompressedRoot=pose.root;',`  (globalThis as any).__beetleContactTrace?.('setup',{pose,contacts,activeChains:activeChains.map(c=>c.id),phase});\n`);
  add('   if(shift>scaleLength*.08)',`   (globalThis as any).__beetleContactTrace?.('rigid-compression',{pose,contacts,shift,bound:scaleLength*.08,chains:activeChains.map((c,i)=>{const target=contacts[i]!.paintedTarget,root=transformPoint(matrices[c.hip]!,c.root),dx=target.x-root.x,max=rigid[i]!.lengths.upper+rigid[i]!.lengths.lower,distance=Math.hypot(dx,target.y-root.y);return{id:c.id,root,target,distance,min:Math.abs(rigid[i]!.lengths.upper-rigid[i]!.lengths.lower),max,requiredShift:distance<=max?0:target.y-Math.sqrt(max*max-dx*dx)+1e-10-root.y};})});\n`);
  const replace=(needle,replacement)=>{if(code.split(needle).length!==2)throw Error('Unique diagnostic branch anchor required '+needle);code=code.replace(needle,replacement);diagnosticSubstitutions.push({needle,replacement});};
  replace('for(let pass=0;pass<=(hasOffset?3:0);pass++){','for(let pass=0;!(globalThis as any).__beetleDirectRigid&&pass<=(hasOffset?3:0);pass++){');
  replace('let measured=measure();','let measured=(globalThis as any).__beetleDirectRigid?{maxError:Infinity,maxPaintTargetErrorPx:Infinity}:measure();');
  let restored=code;for(const {needle,replacement}of [...diagnosticSubstitutions].reverse())restored=restored.replace(replacement,needle);for(const {insertion}of insertions)restored=restored.replace(insertion,'');if(restored!==original)throw Error('Trace insertions must invert to exact owner source');
  return {code,map:null};
 }}]});
 await bundle.write({file:path.join(scratch,'run.mjs'),format:'es'});
 const r=spawnSync(process.execPath,[path.join(scratch,'run.mjs')],{cwd:root,stdio:'inherit',timeout:60000});process.exitCode=r.status??1;if(r.error)console.error(r.error);
}finally{
 const receipt=[...sources].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256,comparedWithStatic01:prior.has(file)}));
 fs.writeFileSync(out,JSON.stringify({scope:'Original source hashes; reversible observation hooks plus explicit diagnostic branch selecting the existing analytical block from authored root; production source never written',insertions,diagnosticSubstitutions,sources:receipt},null,2)+'\n',{flag:'wx'});
 if(receipt.some(x=>!x.unchanged))process.exitCode=1;await bundle?.close();fs.rmSync(scratch,{recursive:true});
}
