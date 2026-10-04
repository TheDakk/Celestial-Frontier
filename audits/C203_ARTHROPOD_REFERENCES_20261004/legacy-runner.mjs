/** Audit-only exact source transforms. Never writes product inputs. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const ROOT=path.resolve(import.meta.dirname,'../..'),DIR=path.relative(ROOT,import.meta.dirname);
const [mode,owner,fit,out]=process.argv.slice(2);
assert(['baseline','toward-steps'].includes(mode));
assert(owner==='legacy');
assert(fit&&out&&process.argv.length===6);
assert(out.startsWith(DIR+'/')&&!fs.existsSync(out)&&!fs.existsSync(out+'.sources.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const files={socket:'port/v2/tools/creature-animation/fixed-attachments.mjs',contact:'port/v2/apps/game/src/creature-rig-contact.ts'};
const substitutions=[
 {path:files.socket,from:'return Object.freeze({...definition,fixedPivots:points});',to:`return Object.freeze({...definition,fixedPivots:points,...definition.anatomyModel===INSECT_MODEL?{contactStance:{...definition.contactStance,...${mode==='toward-steps'?"{swingLift:'toward-socket'}":'{}'},travelSubsteps:{hit:2,tame:2}}}:{}});`},
 {path:files.contact,from:"swingLift!=='toward-socket'||template.id!=='myriapod'||template.anatomyModel!=='myriapod-rigid-trunk-v1'||!template.fixedPivots",to:"swingLift!=='toward-socket'||!((template.id==='myriapod'&&template.anatomyModel==='myriapod-rigid-trunk-v1')||(template.id==='insect'&&template.anatomyModel==='insect-observed-sockets-v1'))||!template.fixedPivots"}
];
const sourceRows=new Map(),changed=new Map(),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-c203-sockets-'));
const {rolldown}=await import(path.join(ROOT,'port/v2/node_modules/rolldown/dist/index.mjs'));
let bundle;
try{
 bundle=await rolldown({input:path.join(ROOT,DIR+'/legacy.ts'),platform:'node',plugins:[{name:'exact-audit-prototype',transform(code,id){
  if(!path.isAbsolute(id)||!fs.existsSync(id)||!fs.statSync(id).isFile())return null;
  const rel=path.relative(ROOT,id),bytes=fs.readFileSync(id);sourceRows.set(rel,{path:rel,sha256:sha(bytes),bytes:bytes.length});
  const sub=mode!=='baseline'&&substitutions.find(s=>s.path===rel);if(!sub)return null;
  assert.equal(code,bytes.toString(),'transform must see original source bytes');assert.equal(code.split(sub.from).length-1,1,'unique source transform '+rel);
  let output=code.replace(sub.from,sub.to);
  if(rel===files.contact){
   const before="template.id!=='myriapod'||template.anatomyModel!=='myriapod-rigid-trunk-v1'||!travelSubsteps";
   const after="!((template.id==='myriapod'&&template.anatomyModel==='myriapod-rigid-trunk-v1')||(template.id==='insect'&&template.anatomyModel==='insect-observed-sockets-v1'&&Reflect.ownKeys(travelSubsteps??{}).length===2&&travelSubsteps?.hit===2&&travelSubsteps?.tame===2))||!travelSubsteps";
   assert.equal(output.split(before).length-1,1);output=output.replace(before,after);sub.steps={from:before,to:after};
  }
  changed.set(rel,{path:rel,originalSha256:sha(bytes),transformedSha256:sha(output),from:sub.from,to:sub.to,...sub.steps?{steps:sub.steps}:{}});return{code:output,map:null};
 }}]});
 await bundle.write({file:path.join(scratch,'run.mjs'),format:'es'});
 assert.equal(changed.size,mode==='baseline'?0:2,'both intended sources transformed');
 const result=spawnSync(process.execPath,[path.join(scratch,'run.mjs'),path.resolve(fit),path.resolve(out)],{cwd:ROOT,encoding:'utf8',timeout:900000});
 const sanitize=s=>s.replaceAll(/\/Users\/[^/\s]+/g,'~');
 fs.writeFileSync(out+'.log',sanitize((result.stdout??'')+(result.stderr??'')),{flag:'wx'});
 if(result.error)throw result.error;
 process.exitCode=result.status??1;
 console.log(JSON.stringify({mode,owner,out,exitCode:process.exitCode}));
}finally{
 const inputs=[...sourceRows.values()].sort((a,b)=>a.path.localeCompare(b.path));
 for(const row of inputs)assert.equal(sha(fs.readFileSync(path.join(ROOT,row.path))),row.sha256,'source changed while audit ran: '+row.path);
 fs.writeFileSync(out+'.sources.json',JSON.stringify({schema:'cf.c203-audit-prototype/v1',mode,owner,productEdited:false,runner:{path:DIR+'/legacy-runner.mjs',sha256:sha(fs.readFileSync(import.meta.filename))},transforms:[...changed.values()],inputs},null,2)+'\n',{flag:'wx'});
 await bundle?.close();fs.rmSync(scratch,{recursive:true});
}
