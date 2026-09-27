import fs from 'node:fs';import path from 'node:path';import {rolldown}from '../../port/v2/node_modules/rolldown/dist/index.mjs';import{spawnSync}from'node:child_process';import{createHash}from'node:crypto';
const dir=import.meta.dirname,receipts=[];const bundle=await rolldown({input:dir+'/diagnose-entry.ts',platform:'node',plugins:[{name:'observe-compression',transform(code,id){
if(!id.endsWith('/creature-rig-contact.ts'))return;
const old="if(compression+shift>scaleLength*.08)throw Error('Contact: '+phase.actionId+'@'+phase.elapsedMs+' exceeds scale compression bound');";
if(code.split(old).length!==2)throw Error('Unique diagnostic patch required');
const next="if(compression+shift>scaleLength*.08)throw Error('Contact: '+JSON.stringify({phase,pass,compression,shift,scaleLength,limit:scaleLength*.08,bodyLength:program.bodyLength,pose,chains:activeChains.map((c,i)=>({id:c.id,root:transformPoint(matrices[c.hip]!,c.root),target:contacts[i]!.endpointTarget,lengths:c.chain.lengths}))})+' exceeds scale compression bound');";
const changed=code.replace(old,next);receipts.push({path:id,sourceSha256:createHash('sha256').update(code).digest('hex'),instrumentedSha256:createHash('sha256').update(changed).digest('hex'),solverChanged:false});return{code:changed,map:null};
}}]});try{await bundle.write({file:dir+'/diagnostic.bundle.mjs',format:'es'});}finally{await bundle.close();}
fs.writeFileSync(dir+'/instrumentation.json',JSON.stringify(receipts,null,2)+'\n');
const r=spawnSync(process.execPath,[dir+'/diagnostic.bundle.mjs',path.resolve(process.argv[2])],{encoding:'utf8',timeout:300000});process.stdout.write(r.stdout);process.stderr.write(r.stderr);process.exitCode=r.status;
