import fs from 'node:fs';
import assert from 'node:assert/strict';
const report=JSON.parse(fs.readFileSync('/private/tmp/cf-mag-producer-20260908.json','utf8'));
assert.equal(report.compendium.measurementBudgetMatches,true);
assert.equal(report.compendium.measurement.sha256,'4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12');
const file='port/v2/budgets/compendium-memory-v1.json',old=fs.readFileSync(file,'utf8'),budget=JSON.parse(old),previous=budget.producerAuthority,current=report.compendium.producer;
assert.equal(previous.sha256,'3c8cda1771d6230fb86e773fc0cde86cb3c51686b6cc8fce3141b38a7516e28b');
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,a);return s.replace(a,b);};
const write=(p,s)=>{fs.writeFileSync(p+'.avtmp',s,{flag:'wx'});fs.renameSync(p+'.avtmp',p);};
budget.producerAuthority=current;
budget.calibration.selectionRule+=' Magnetar field presentation (2026-09-08): live producer '+previous.sha256+' becomes '+current.sha256+' after restoring the two canonical static MAG ellipses between existing beams and core, with shared scene cleanup and matching draft graphics copy. '+Object.entries(current.inputs).map(([k,v])=>k+' '+v.relativePath+' '+v.sha256).join('; ')+'. Measurement/ruler/ceilings/history unchanged. Scoped native presentation diagnostics are not a fresh Compendium certificate; SceneMemory remains production-quarantined.';
const test='port/v2/tests/compendium-budget.test.ts';let next=once(fs.readFileSync(test,'utf8'),previous.sha256,current.sha256);
for(const key of Object.keys(current.inputs)){for(const part of ['relativePath','sha256']){if(previous.inputs[key][part]!==current.inputs[key][part])next=once(next,previous.inputs[key][part],current.inputs[key][part]);}}
const updated=JSON.stringify(budget,null,2)+'\n';assert.deepEqual(JSON.parse(old).ceilings,budget.ceilings);assert.deepEqual(JSON.parse(old).measurementAuthority,budget.measurementAuthority);assert.deepEqual(JSON.parse(old).calibration.rulerAuthority,budget.calibration.rulerAuthority);
write(file,updated);write(test,next);
fs.writeFileSync('/private/tmp/cf-mag-refreshed-producer-20260908.json',JSON.stringify({previous:previous.sha256,current,measurementUnchanged:true,rulerUnchanged:true,ceilingsUnchanged:true,sceneMemoryQuarantined:true},null,2)+'\n',{flag:'wx'});
console.log(current.sha256);
