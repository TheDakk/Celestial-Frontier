import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='audits/C192_I5_EPOCH_20261002',epoch=base+'/epoch',selector='port/v2/budgets/compendium-memory-active.json';
assert.equal(JSON.parse(fs.readFileSync(base+'/invocation.json')).exitCode,0);
const execution=JSON.parse(fs.readFileSync(epoch+'/execution.json'));
assert.equal(execution.steps.length,4);for(const s of execution.steps){assert.equal(s.exitCode,0);assert.equal(s.verificationExitCode,0);}
const prior=fs.readFileSync(selector);fs.writeFileSync(base+'/previous-active-selector.json',prior,{flag:'wx'});
const old=JSON.parse(prior),files=Object.fromEntries(Object.keys(old.files).map(name=>[name,createHash('sha256').update(fs.readFileSync(epoch+'/'+name)).digest('hex')]));
const value={schema:old.schema,epochDirectory:epoch,files};
fs.writeFileSync(selector+'.tmp',JSON.stringify(value,null,2)+'\n',{flag:'wx'});fs.renameSync(selector+'.tmp',selector);
const {readActiveCompendiumBudget,verifyActiveCompendiumCertificate}=await import('../../port/v2/tools/compendiummem-active.mjs');
const budget=readActiveCompendiumBudget(),result=await verifyActiveCompendiumCertificate(budget.measurementAuthority,budget.producerAuthority);
fs.writeFileSync(base+'/activation-replay.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));assert.equal(result.ok,true);
