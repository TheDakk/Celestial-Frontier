import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{spawnSync}from'node:child_process';import{createHash}from'node:crypto';
import{rolldown}from'../../port/v2/node_modules/rolldown/dist/index.mjs';
const base=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),insertions=[];
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-bird-trace-'));
const bundle=await rolldown({input:base+'/diagnose.ts',platform:'node',plugins:[{name:'observation-only',transform(code,id){
 if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));
 if(id.endsWith('/motion/grounded-bird.ts')&&process.argv[3]==='faint'){
  const replace=(a,b)=>{if(code.split(a).length!==2)throw Error('Unique faint author anchor');code=code.replace(a,b);};
  replace("['dodge','hit','tame','melee:claw'].includes(action.id)","['dodge','hit','tame','melee:claw','faint'].includes(action.id)");
  replace(' const key=JSON.stringify'," if(action.id==='faint'&&!card.paintedContactSupports)return unchanged;\n const key=JSON.stringify");
  const anchor=' if(fits(base))return finish(action,null);';
  replace(anchor,anchor+`
 if(action.id==='faint'){
  const torso=new Set(['root','pelvis','spine','chest']);
  const scaled=(gain:number)=>freezeAction({...action,poses:action.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,v*(torso.has(j)?gain:1)])),root:{dx:p.root.dx*gain,dy:p.root.dy*gain}}))});
  if(!fits(compile(scaled(0))))return finish(action,null);
  let low=0,high=1;for(let i=0;i<12;i++){const m=(low+high)/2;if(fits(compile(scaled(m))))low=m;else high=m;}
  const gain=low*.9,candidate=scaled(gain);
  return gain>0&&fits(compile(candidate))?finish(candidate,'grounded-bird:painted-faint-gain='+gain):finish(action,null);
 }`);
  return{code,map:null};
 }
 if(!id.endsWith('/creature-rig-contact.ts'))return;
 const original=code;
 const add=(needle,insertion)=>{if(code.split(needle).length!==2)throw Error('Unique trace anchor required');code=code.replace(needle,insertion+needle);insertions.push({needle,insertion});};
 add('   if(compression+shift>scaleLength*.08)',`   (globalThis as any).__contactTrace?.('compression',{pass,compression,shift,bound:scaleLength*.08,pose,chains:activeChains.map((c,i)=>{const target=contacts[i]!.endpointTarget,root=transformPoint(matrices[c.hip]!,c.root),dx=target.x-root.x,max=c.chain.lengths.upper+c.chain.lengths.lower,distance=Math.hypot(dx,target.y-root.y);return{id:c.id,root,target,distance,max,requiredShift:distance<=max?0:target.y-Math.sqrt(max*max-dx*dx)+1e-10-root.y};})});\n`);
 add('   let maxError=0,maxPaintTargetErrorPx=0;',`   (globalThis as any).__contactTrace?.('measure',{pose,contacts,compression,limits:template.contactLimitsDeg??template.limitsDeg});\n`);
 add('   if(shift>scaleLength*.08)',`   (globalThis as any).__contactTrace?.('candidate-compression',{shift,bound:scaleLength*.08,pose});\n`);
 let restored=code;for(const {insertion}of insertions)restored=restored.replace(insertion,'');if(restored!==original)throw Error('Hooks must invert to exact source');
 return{code,map:null};
 }}]});
try{await bundle.write({file:scratch+'/run.mjs',format:'es'});const r=spawnSync(process.execPath,[scratch+'/run.mjs',process.argv[2]??'diagnosis'],{stdio:'inherit',timeout:120000});process.exitCode=r.status??1;
 const receipt=[...sources].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));if(receipt.some(r=>!r.unchanged))throw Error('Source changed');fs.writeFileSync(base+'/'+(process.argv[2]??'diagnosis')+'-instrumentation.json',JSON.stringify({observationOnly:process.argv[3]!=='faint',candidate:process.argv[3]==='faint'?'whole faint torso gain against exact painted supports':null,insertions,sources:receipt},null,2)+'\n',{flag:'wx'});
}finally{await bundle.close();fs.rmSync(scratch,{recursive:true});}
