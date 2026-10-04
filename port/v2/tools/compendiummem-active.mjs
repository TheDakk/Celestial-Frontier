/* Read-only admission of one retained, independently verified v2 3+1 epoch.
   No collection, budget rewrite, historical retry, subprocess or workspace lock. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {materializedSources} from './compendiummem-v2-materialize.mjs';
import {sha256, REPORT_INPUT_KEYS} from './compendiummem-contract.mjs';
import {buildCompendiumFixture, stableJson} from './compendiummem-fixture.mjs';
import {samplesFromReports, phases} from './compendiummem-v2.mjs';
import {policy} from './compendiummem-v2-guard.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const compiled=materializedSources();
let contractSource=compiled.outputs['contract.mjs'];
for(const [from,to] of [['./painted.mjs','./compendiummem-v2-painted.mjs'],['./shared/tools/compendiummem-v2-guard.mjs','./compendiummem-v2-guard.mjs']]) {
 const token=JSON.stringify(from);if(contractSource.split(token).length!==2)throw Error('Active contract import drift');
 contractSource=contractSource.replace(token,JSON.stringify(new URL(to,import.meta.url).href));
}
const contract=await import('data:text/javascript;base64,'+Buffer.from(contractSource).toString('base64'));
export const activeCompendiumMeasurementSources=Object.freeze({collector:compiled.manifest.generated['collector.mjs'],outcomeContract:compiled.manifest.generated['contract.mjs']});
const same=(a,b)=>stableJson(a)===stableJson(b),require=(ok,message)=>{if(!ok)throw Error(message)};
const readRegular=file=>{const stat=fs.lstatSync(file);require(stat.isFile()&&!stat.isSymbolicLink(),'Nonregular certificate input');return fs.readFileSync(file)};
const names=['calibration-budget.json','compendium-memory-v2.json','execution.json','instrument/manifest.json','instrument-authority.json',...phases.map(p=>p+'-report.json')];
export function loadActiveCompendiumEvidence(read=readRegular){
 const selector=JSON.parse(read(path.join(root,'port/v2/budgets/compendium-memory-active.json')));
 require(selector.schema==='cf-v2-compendium-active-certificate/v1'&&same(Object.keys(selector).sort(),['epochDirectory','files','schema']),'Invalid active Compendium selector');
 require(/^audits\/[A-Za-z0-9_-]+\/epoch$/.test(selector.epochDirectory),'Invalid certificate directory');
 require(same(Object.keys(selector.files).sort(),[...names].sort()),'Incomplete certificate file inventory');
 const directory=path.join(root,selector.epochDirectory),bytes={},records={};
 for(const name of names){bytes[name]=read(path.join(directory,name));require(sha256(bytes[name])===selector.files[name],'Certificate byte mismatch: '+name);records[name]=JSON.parse(bytes[name]);}
 return {selector,directory,bytes,records};
}
export function readActiveCompendiumBudget(){return loadActiveCompendiumEvidence().records['compendium-memory-v2.json'];}
export function verifyActiveCompendiumCertificate(measurement,producer,{read=readRegular}={}){
 try {
 const {directory,bytes,records}=loadActiveCompendiumEvidence(read),budget=records['compendium-memory-v2.json'],cal=records['calibration-budget.json'],ledger=records['execution.json'],manifest=records['instrument/manifest.json'],authority=records['instrument-authority.json'];
 require(same(manifest,compiled.manifest),'Current generated instrument differs from certificate');
 for(const [name,digest] of Object.entries(manifest.generated))require(sha256(read(path.join(directory,'instrument',name)))===digest,'Retained instrument byte mismatch: '+name);
 require(same(authority.manifest,manifest)&&authority.commit===ledger.instrument.commit&&authority.sha256===ledger.instrument.sha256&&sha256(JSON.stringify(authority.hashes))===authority.sha256,'Instrument provenance mismatch');
 require(ledger.status==='certified'&&ledger.automaticRetries===0&&ledger.v1Unchanged===true&&ledger.v1Sha256===policy.v1Sha256,'Epoch did not certify unchanged history');
 require(ledger.head===budget.source.commit&&ledger.finalSource.head===ledger.head&&ledger.finalSource.status===''&&same(budget.instrument,ledger.instrument)&&budget.epoch===ledger.epoch,'Certificate source/epoch mismatch');
 require(same(ledger.steps.map(s=>s.phase),phases)&&ledger.steps.every(s=>s.exitCode===0&&s.verificationExitCode===0&&s.runId===ledger.epoch+'-'+s.phase),'Incomplete or retried epoch');
 require(same(ledger.commands.map(c=>c.name),['prepare-build','edge-preflight',...phases.flatMap(p=>[p,p+'-verify'])])&&ledger.commands.every(c=>c.exitCode===0),'Epoch command sequence failed');
 const fixture=buildCompendiumFixture(),reports=[];
 for(const [index,phase] of phases.entries()) {
  const b=index===3?budget:cal,validation=contract.validateBudgetRecord(b,fixture.rowsSha256,null,measurement,producer);
  require(validation.ok,'Active budget authority refused: '+validation.errors.join('; '));
  require(b.status===(index===3?'active':'calibration-required'),'Wrong phase budget');
  const expectedBudgetSha256=sha256(bytes[index===3?'compendium-memory-v2.json':'calibration-budget.json']);
  const expectedInputs=Object.fromEntries(REPORT_INPUT_KEYS.map(key=>[key,key==='budget'?expectedBudgetSha256:measurement.inputs[key]]));
  const report=records[phase+'-report.json'];
  require(index===0||same(report.browser,reports[0].browser),'Exact browser provenance changed between phases');
  require(report.status===(index===3?'pass':'calibration')&&report.lifecycle?.status==='complete','Phase lacks successful terminal cleanup');
  const verifyArtifact=item=>{try{const name=path.basename(item.file);if(item.file!=='apps/game/smoke/'+name)return false;const b=read(path.join(directory,name));return b.length===item.bytes&&sha256(b)===item.sha256&&b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));}catch{return false}};
  const result=contract.verifyTerminalReport(report,ledger.steps[index].runId,{allowCalibration:index!==3,verifyArtifact,budgetRecord:b,expectedBudgetSha256,fixture,expectedInputs,expectedSourceIdentity:budget.source});
  require(result.ok,'Raw '+phase+' refused: '+result.errors.join('; '));reports.push(report);
 }
 const samples=samplesFromReports(reports.slice(0,3),contract);
 for(const profile of Object.values(samples))for(const sample of profile)sample.measurementAuthoritySha256=measurement.sha256;
 require(same(samples,budget.calibration.samples),'Active samples differ from raw calibrations');
 require(same({...cal,status:'active',calibration:budget.calibration},budget),'Calibration-to-active budget changed outside measured samples');
 return {ok:true,errors:[],epoch:ledger.epoch,source:ledger.head};
 }catch(error){return {ok:false,errors:[error.message],epoch:null,source:null};}
}
