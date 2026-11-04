/** Read-only producer comparison. Measures copied bounds independently on a
 * seeded perturbation corpus; compares every joint, parent, limit and clip ID. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import {rolldown} from 'rolldown';
import {FAMILY_CONTRACTS} from './family-contracts.mjs';import {measureFamilyBounds} from './family-record.mjs';
const [sourceArg,outArg]=process.argv.slice(2);if(!sourceArg||!outArg)throw Error('Usage: family-contract-probe.mjs MOTION_DIR NEW_REPORT_JSON');
const source=path.resolve(sourceArg),out=path.resolve(outArg);if(fs.existsSync(out))throw Error('Report must be new');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-family-contract-')),hash=b=>createHash('sha256').update(b).digest('hex');
const provenance=new Map(),report={schema:'cf.family-contract-comparison/v1',status:'RUNNING',scope:'Anatomy contract equivalence; synthetic landmarks only, not painted qualification',families:[]};
try{
 const bundle=await rolldown({input:path.join(source,'index.ts'),platform:'node',plugins:[{name:'read-only-source-receipt',transform(_,id){if(id.startsWith(source)&&fs.statSync(id).isFile())provenance.set(id,hash(fs.readFileSync(id)));}}]});
 try{await bundle.write({dir:scratch,entryFileNames:'producer.mjs',format:'es'});}finally{await bundle.close();}
 const producer=await import(pathToFileURL(path.join(scratch,'producer.mjs')));
 assert.deepEqual([...producer.KNOWN_TEMPLATE_IDS].sort(),FAMILY_CONTRACTS.map(t=>t.id).sort());
 const fixtureFile=new URL('./test-fixtures/family-records.json',import.meta.url),{records}=JSON.parse(fs.readFileSync(fixtureFile));
 for(const template of FAMILY_CONTRACTS){const p=producer.resolveTemplate(template.id),lm=records[template.id].landmarks;
  for(const key of ['graph','joints','legs','clipSetId','limitsDeg'])assert.deepEqual(template[key],p[key],template.id+':'+key);
  assert.deepEqual(template.bodyAxis,p.bodyAxis??['pelvis','chest']);assert.deepEqual(template.bounds.map(({id,min,max})=>({id,min,max})),p.proportions.map(({id,min,max})=>({id,min,max})));
  let seed=731234,maximumError=0;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<65;i++){
   const joints=Object.fromEntries(Object.entries(lm).map(([n,v])=>[n,i?[v[0]+(random()-.5)*.04,v[1]+(random()-.5)*.04]:v]));
   const bones=Object.fromEntries(p.graph.map(([c,a])=>[c,Math.hypot(joints[c][0]-joints[a][0],joints[c][1]-joints[a][1])]));
   const measured=measureFamilyBounds(template,joints);
   for(const bound of p.proportions){const expected=bound.measure(joints,bones),actual=measured.measures[bound.id],delta=Math.abs(actual-expected);assert.ok(delta<1e-12,template.id+':'+bound.id);maximumError=Math.max(maximumError,delta);}
  }
  report.families.push({id:template.id,joints:p.joints.length,geometries:65,maximumError});
 }
 for(const [file,digest]of provenance)assert.equal(hash(fs.readFileSync(file)),digest,'source changed');report.status='PASS';
}catch(e){report.status='FAIL';report.error=String(e.stack??e);process.exitCode=1;}
finally{report.sources=[...provenance].map(([path,sha256])=>({path,sha256}));fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');fs.rmSync(scratch,{recursive:true,force:true});}
console.log(JSON.stringify({status:report.status,families:report.families.length,error:report.error}));
