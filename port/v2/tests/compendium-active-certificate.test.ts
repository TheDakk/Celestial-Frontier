import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {readActiveCompendiumBudget,verifyActiveCompendiumCertificate} from '../tools/compendiummem-active.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const selectorPath=path.join(root,'port/v2/budgets/compendium-memory-active.json');
const selector=JSON.parse(fs.readFileSync(selectorPath,'utf8'));
const directory=path.join(root,selector.epochDirectory);
const budget=readActiveCompendiumBudget();
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const verify=(read?: (file:string)=>Buffer)=>verifyActiveCompendiumCertificate(budget.measurementAuthority,budget.producerAuthority,read?{read}:{});
// Deliberately recompute selector hashes: a semantic refusal must not merely
// be a stale checksum. Original evidence is never written by these controls.
function changed(name:string, mutate:(value:any)=>void){
 const value=JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'));mutate(value);
 const bytes=Buffer.from(JSON.stringify(value));const selected=structuredClone(selector);selected.files[name]=sha(bytes);
 return(file:string):Buffer=>file===selectorPath?Buffer.from(JSON.stringify(selected)):file===path.join(directory,name)?bytes:fs.readFileSync(file);
}
describe('active I5 certificate admission',()=>{
 it('verifies the retained three calibrations and one certification against unchanged current authorities',()=>expect(verify()).toMatchObject({ok:true,errors:[]}));
 for(const [label,name,mutate] of [
  ['stopped epoch','execution.json',(x:any)=>{x.status='stopped';}],
  ['retry','execution.json',(x:any)=>{x.automaticRetries=1;}],
  ['phase reorder','execution.json',(x:any)=>{x.steps.reverse();}],
  ['failed command','execution.json',(x:any)=>{x.commands[2].exitCode=1;}],
  ['changed source','execution.json',(x:any)=>{x.finalSource.head='0'.repeat(40);}],
  ['dirty final source','execution.json',(x:any)=>{x.finalSource.status=' M source';}],
  ['altered history','execution.json',(x:any)=>{x.v1Unchanged=false;}],
  ['altered instrument','instrument/manifest.json',(x:any)=>{x.generated['collector.mjs']='0'.repeat(64);}],
  ['raised ceiling','compendium-memory-v2.json',(x:any)=>{x.ceilings.phone.jsEventListenersMax++;}],
  ['forged sample','compendium-memory-v2.json',(x:any)=>{x.calibration.samples.phone[0].metrics.nodes++;}],
  ['missing outcome','certification-report.json',(x:any)=>{x.outcomes.pop();}],
  ['green summary with red outcome','certification-report.json',(x:any)=>{x.outcomes[0].status='fail';}],
  ['unfinished cleanup','certification-report.json',(x:any)=>{x.lifecycle.status='collecting';}],
  ['changed certification browser','certification-report.json',(x:any)=>{x.browser.revision='changed';}],
  ['stale run','calibration-2-report.json',(x:any)=>{x.runId='another-run';}],
 ] as const)it(`refuses ${label} even after rehashing the selector`,()=>expect(verify(changed(name,mutate)).ok).toBe(false));
 it('refuses missing raw calibration',()=>expect(verify(file=>{if(file.endsWith('/calibration-2-report.json'))throw Error('missing');return fs.readFileSync(file);}).ok).toBe(false));
 it('refuses changed source bytes without updated selector hash',()=>expect(verify(file=>file.endsWith('/execution.json')?Buffer.from('{}'):fs.readFileSync(file)).ok).toBe(false));
 it('refuses corrupted screenshot bytes',()=>expect(verify(file=>{const b=fs.readFileSync(file);if(file.endsWith('.png')){const c=Buffer.from(b);c[c.length-1]=(c[c.length-1]??0)^1;return c;}return b;}).ok).toBe(false));
 it('refuses changed retained collector bytes',()=>expect(verify(file=>{const b=fs.readFileSync(file);return file.endsWith('/instrument/collector.mjs')?Buffer.concat([b,Buffer.from('\n// altered')]):b;}).ok).toBe(false));
 it('refuses current producer or measurement drift',()=>{
  expect(verifyActiveCompendiumCertificate({...budget.measurementAuthority,sha256:'0'.repeat(64)},budget.producerAuthority).ok).toBe(false);
  expect(verifyActiveCompendiumCertificate(budget.measurementAuthority,{...budget.producerAuthority,sha256:'0'.repeat(64)}).ok).toBe(false);
 });
});
