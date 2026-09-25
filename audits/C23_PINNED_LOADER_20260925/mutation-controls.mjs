import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';
const root=path.resolve('port/v2'),out=import.meta.dirname,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cf-c23-mutants-'));
const cases=[
 ['forged-authority',[['creature-rig.ts',"if(!isBattle2MasterPin(input.pin))throw new Battle2PinRefusal('untrusted-pin-authority','not a bundled build pin');",''],['battle2-master-pin-admission.ts',"if (!isBattle2MasterPin(input.pin)) return refuse('untrusted-pin-authority', 'not a bundled build pin (clone, JSON copy or look-alike)');",'']]],
 ['alpha-hash',[['battle2-master-pin-admission.ts',"if (await hashBytes(input.alpha) !== pin.alphaSha256) refuse('alpha-mismatch', 'alpha bytes differ from the pin');",'']]],
 ['caller-race',[['creature-rig.ts','record:structuredClone(input.record)','record:input.record']]],
];const results=[];
for(const[name,mutations]of cases){const config=tmp+'/'+name+'.mjs';fs.writeFileSync(config,`export default {root:${JSON.stringify(root)},plugins:[{name:'c23-mutant',enforce:'pre',transform(code,id){for(const[file,from,to]of ${JSON.stringify(mutations)})if(id===${JSON.stringify(root+'/apps/game/src/')}+file){if(code.split(from).length!==2)throw Error('unique source mutation required');code=code.replace(from,to);}return code;}}],test:{include:['apps/game/src/creature-rig-pinned.test.ts']}};`);const r=spawnSync(process.execPath,[root+'/node_modules/vitest/vitest.mjs','run','--config',config],{cwd:root,encoding:'utf8',timeout:90000});fs.writeFileSync(out+'/'+name+'.log',r.stdout+r.stderr);results.push({name,exit:r.status,killed:r.status===1});}
fs.writeFileSync(out+'/mutation-results.json',JSON.stringify(results,null,2)+'\n');if(results.some(r=>!r.killed))process.exitCode=1;
