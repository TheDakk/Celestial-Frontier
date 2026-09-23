/** In-memory observational contact trace; production source is never written. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {rolldown} from '../../../port/v2/node_modules/rolldown/dist/index.mjs';
const base=import.meta.dirname,root='/Users/nick/Projects/celestial-frontier-openai-mac',owner=path.join(root,'port/v2/apps/game/src/creature-rig-contact.ts');
const out=path.join(base,'contact-diagnosis-02.sources.json');
if(fs.existsSync(out)||fs.existsSync(path.join(base,'contact-diagnosis-02.json')))throw Error('New diagnostic outputs required');
const prior=new Map(JSON.parse(fs.readFileSync(path.join(base,'static-02.json.sources.json'))).map(x=>[x.path,x.sha256]));
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-frog-contact-')),insertions=[];
let bundle;
try{
 bundle=await rolldown({input:path.join(base,'contact-diagnosis-02.ts'),platform:'node',plugins:[{name:'contact-observer',transform(code,id){
  if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile()){const hash=sha(fs.readFileSync(id));if(prior.has(id)&&hash!==prior.get(id))throw Error('Static source drift '+id);sources.set(id,hash);}
  if(id!==owner)return;
  const original=code;
  const add=(needle,insertion)=>{if(code.split(needle).length!==2)throw Error('Unique trace anchor required '+needle);code=code.replace(needle,insertion+needle);insertions.push({needle,insertion});};
  add('   if(compression+shift>scaleLength*.08)',`   (globalThis as any).__frogContactTrace?.('compression',{pass,compression,shift,bound:scaleLength*.08,pose,chains:activeChains.map((c,i)=>{const target=contacts[i]!.endpointTarget,root=transformPoint(matrices[c.hip]!,c.root),dx=target.x-root.x,max=c.chain.lengths.upper+c.chain.lengths.lower,distance=Math.hypot(dx,target.y-root.y);return{id:c.id,root,target,distance,min:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),max,requiredShift:distance<=max?0:target.y-Math.sqrt(max*max-dx*dx)+1e-10-root.y};})});\n`);
  add('    let solved;try{solved=c.chain.solve(root,target);}',`    (globalThis as any).__frogContactTrace?.('solve',{pass,id:c.id,root,target,parent,lengths:c.chain.lengths,distance:Math.hypot(target.x-root.x,target.y-root.y),minimum:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),maximum:c.chain.lengths.upper+c.chain.lengths.lower});\n`);
  add('  const measure=()=>{',`  (globalThis as any).__frogContactTrace?.('measure',{pose,contacts,compression,limits:template.contactLimitsDeg??template.limitsDeg});\n`);
  let restored=code;for(const {insertion}of insertions)restored=restored.replace(insertion,'');if(restored!==original)throw Error('Trace insertions must invert to exact owner source');
  return {code,map:null};
 }}]});
 await bundle.write({file:path.join(scratch,'run.mjs'),format:'es'});
 const r=spawnSync(process.execPath,[path.join(scratch,'run.mjs')],{cwd:root,stdio:'inherit',timeout:60000});process.exitCode=r.status??1;if(r.error)console.error(r.error);
}finally{
 const receipt=[...sources].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256,comparedWithStatic02:prior.has(file)}));
 fs.writeFileSync(out,JSON.stringify({scope:'Original module hashes; only exact invertible observational insertions applied in temporary bundle',insertions,sources:receipt},null,2)+'\n',{flag:'wx'});
 if(receipt.some(x=>!x.unchanged))process.exitCode=1;await bundle?.close();fs.rmSync(scratch,{recursive:true});
}
