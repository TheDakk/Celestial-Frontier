/** In-memory observational contact trace; production source is never written. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {rolldown} from '../../../port/v2/node_modules/rolldown/dist/index.mjs';
const base=import.meta.dirname,root='/Users/nick/Projects/celestial-frontier-openai-mac',owner=path.join(root,'port/v2/apps/game/src/creature-rig-contact.ts');
const out=path.join(base,'contact-diagnosis-01.sources.json');
if(fs.existsSync(out)||fs.existsSync(path.join(base,'contact-diagnosis-01.json')))throw Error('New diagnostic outputs required');
const original=path.join(root,'audits/ARCHETYPE_SPRINT_20260922/07-primate');
const prior=new Map(JSON.parse(fs.readFileSync(path.join(original,'static.json.sources.json'))).map(x=>[x.path,x.sha256]));
const knownDeadCodeOnly=new Map([
 [path.join(root,'port/v2/apps/game/src/motion/body-card.ts'),{prior:'e0cf06e7fd95da0952aa41f64301f774375e9c4415aa4d4a4f7c31dd79065bd3',current:'1ce96d43975b980b80b922dee96c1bdd748f1d30f3b7286bda46add55af66a9a',reason:'Removed unused classifyRealm import and unused realmFromLabel function; reviewed exact git diff from original static HEAD f598f589.'}],
 [path.join(root,'port/v2/apps/game/src/motion/family-templates.ts'),{prior:'1aa8a9c495c8ad24cbb6778d443828e668d81fcdbca5f491302b6dbba0be8c6b',current:'01fb429e30a2ce63d3fd7fc0071db172e99346a2e965e0646f349f70a8cf4690',reason:'Removed unused spine6 local only; reviewed exact git diff from original static HEAD f598f589.'}]
]);
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-primate-contact-')),insertions=[];
let bundle;
try{
 bundle=await rolldown({input:path.join(base,'contact-diagnosis-01.ts'),platform:'node',plugins:[{name:'contact-observer',transform(code,id){
  if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile()){const hash=sha(fs.readFileSync(id));if(prior.has(id)&&hash!==prior.get(id)){const known=knownDeadCodeOnly.get(id);if(!known||known.prior!==prior.get(id)||known.current!==hash)throw Error('Unreviewed static source drift '+id);}sources.set(id,hash);}
  if(id!==owner)return;
  const original=code;
  const add=(needle,insertion)=>{if(code.split(needle).length!==2)throw Error('Unique trace anchor required '+needle);code=code.replace(needle,insertion+needle);insertions.push({needle,insertion});};
  add('   if(compression+shift>scaleLength*.08)',`   (globalThis as any).__primateContactTrace?.('compression',{pass,compression,shift,bound:scaleLength*.08,pose,chains:activeChains.map((c,i)=>{const target=contacts[i]!.endpointTarget,root=transformPoint(matrices[c.hip]!,c.root),dx=target.x-root.x,max=c.chain.lengths.upper+c.chain.lengths.lower,distance=Math.hypot(dx,target.y-root.y);return{id:c.id,root,target,distance,min:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),max,requiredShift:distance<=max?0:target.y-Math.sqrt(max*max-dx*dx)+1e-10-root.y};})});\n`);
  add('    let solved;try{solved=c.chain.solve(root,target);}',`    (globalThis as any).__primateContactTrace?.('solve',{pass,id:c.id,root,target,parent,lengths:c.chain.lengths,distance:Math.hypot(target.x-root.x,target.y-root.y),minimum:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),maximum:c.chain.lengths.upper+c.chain.lengths.lower});\n`);
  add('  const measure=()=>{',`  (globalThis as any).__primateContactTrace?.('measure',{pose,contacts,compression,limits:template.contactLimitsDeg??template.limitsDeg});\n`);
  let restored=code;for(const {insertion}of insertions)restored=restored.replace(insertion,'');if(restored!==original)throw Error('Trace insertions must invert to exact owner source');
  return {code,map:null};
 }}]});
 await bundle.write({file:path.join(scratch,'run.mjs'),format:'es'});
 const r=spawnSync(process.execPath,[path.join(scratch,'run.mjs')],{cwd:root,stdio:'inherit',timeout:60000});process.exitCode=r.status??1;if(r.error)console.error(r.error);
}finally{
 const receipt=[...sources].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256,originalStaticSha256:prior.get(file)??null,exactOriginalStaticBytes:prior.get(file)===sha256,reviewedDeadCodeOnlyChange:knownDeadCodeOnly.get(file)??null}));
 fs.writeFileSync(out,JSON.stringify({scope:'Original module hashes; only exact invertible observational insertions applied in temporary bundle',insertions,sources:receipt},null,2)+'\n',{flag:'wx'});
 if(receipt.some(x=>!x.unchanged))process.exitCode=1;await bundle?.close();fs.rmSync(scratch,{recursive:true});
}
