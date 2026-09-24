/** In-memory observational hooks only; removal restores exact runtime bytes. */
import fs from'node:fs';import os from'node:os';import path from'node:path';import{spawnSync}from'node:child_process';import{createHash}from'node:crypto';
import{rolldown}from'../../../port/v2/node_modules/rolldown/dist/index.mjs';
const base=import.meta.dirname,root='/Users/nick/Projects/celestial-frontier-openai-mac',owner=path.join(root,'port/v2/apps/game/src/creature-rig-contact.ts'),out=path.join(base,'static-contact-diagnosis02.sources.json');
for(const file of[out,path.join(base,'static-contact-diagnosis02.json')])if(fs.existsSync(file))throw Error('Fresh outputs required');
const sha=b=>createHash('sha256').update(b).digest('hex'),prior=new Map(JSON.parse(fs.readFileSync(path.join(base,'static-03.json.sources.json'))).map(x=>[x.path,x.sha256])),sources=new Map(),insertions=[],scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-compact-first-contact-'));let bundle,exitCode=1;
try{
 bundle=await rolldown({input:path.join(base,'static-contact-diagnosis02.ts'),platform:'node',plugins:[{name:'contact-observer',transform(code,id){
  if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile()){const hash=sha(fs.readFileSync(id));if(prior.has(id)&&hash!==prior.get(id))throw Error('Source differs from retained static '+id);sources.set(id,hash);}
  if(id!==owner)return;const original=code;fs.writeFileSync(path.join(base,'static-contact-diagnosis02-owner.ts'),original,{flag:'wx'});
  const add=(needle,insertion,after=false)=>{if(code.split(needle).length!==2)throw Error('Unique observer anchor required '+needle);code=code.replace(needle,after?needle+insertion:insertion+needle);insertions.push({needle,insertion,after});};
  add('   if(!swing&&!bodyPlanted&&phase.travel',`   (globalThis as any).__compactContactTrace?.('target-detail',{id:c.id,group:c.group,root:c.root,endPoint:c.endPoint,offset:c.offset,lower:c.chain.lengths.lower,swing,at,step,lift,target,sourceTravel,poseRoot:pose.root});\n`);
  add('  if(padDeclaration){',`  (globalThis as any).__compactContactTrace?.('targets',{phase,stance,sourceTravel,gait,progress,cycle,completed,weight,pose,contacts,activeChains:activeChains.map(c=>({id:c.id,group:c.group,endpointOnly:c.endpointOnly}))});\n`);
  add('const c=activeChains[i]!,target=contacts[i]!.endpointTarget,root=transformPoint(matrices[c.hip]!,c.root),dx=target.x-root.x,max=c.chain.lengths.upper+c.chain.lengths.lower;',`\n    (globalThis as any).__compactContactTrace?.('endpoint-reach',{pass,id:c.id,group:c.group,stance:contacts[i]!.stance,compression,root,target,dx,min:Math.abs(c.chain.lengths.upper-c.chain.lengths.lower),max,distance:Math.hypot(dx,target.y-root.y),lengths:c.chain.lengths});`,true);
  add('const c=activeChains[i]!,target=contacts[i]!.paintedTarget,root=transformPoint(matrices[c.hip]!,c.root),dx=target.x-root.x,max=rigid[i]!.lengths.upper+rigid[i]!.lengths.lower;',`\n    (globalThis as any).__compactContactTrace?.('rigid-reach',{id:c.id,group:c.group,stance:contacts[i]!.stance,root,target,dx,min:Math.abs(rigid[i]!.lengths.upper-rigid[i]!.lengths.lower),max,distance:Math.hypot(dx,target.y-root.y),lengths:rigid[i]!.lengths});`,true);
  let restored=code;for(const{insertion}of insertions)restored=restored.replace(insertion,'');if(restored!==original)throw Error('Observer inversion failed');return{code,map:null};
 }}]});
 await bundle.write({file:path.join(scratch,'run.mjs'),format:'es'});const r=spawnSync(process.execPath,[path.join(scratch,'run.mjs')],{cwd:root,stdio:'inherit',timeout:60000});exitCode=r.status??1;if(r.error)console.error(r.error);process.exitCode=exitCode;
}finally{
 const rows=[...sources].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256,staticSha256:prior.get(file)??null,exactStaticBytes:prior.has(file)?sha256===prior.get(file):null}));fs.writeFileSync(out,JSON.stringify({scope:'Bundled exact source inventory and invertible observational insertions. Two contact samples only.',exitCode,insertions,sources:rows},null,2)+'\n',{flag:'wx'});if(rows.some(x=>!x.unchanged))process.exitCode=1;await bundle?.close();fs.rmSync(scratch,{recursive:true});
}
