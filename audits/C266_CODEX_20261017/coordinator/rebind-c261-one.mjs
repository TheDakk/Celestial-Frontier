import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {rebindFinished} from '../../AI_FINISH_C121_20261001/rebind-batch.mjs';
import {acquireWorkspaceLock} from '../../../port/v2/tools/workspacelock.mjs';
const slug=process.argv[2];
assert(['grasshopper','dragonfish','freshwater-crab','godwit','tortoise-a04','sea-turtle','fur-seal','goat-a02','shrew','anole-a02','ant','giant-water-bug','box-turtle-a03','pond-turtle','turtle','snapping-turtle','softshell-turtle','sea-lion','dromedary-camel','ibex-a02','water-vole','coati-a02','frilled-lizard-a02','guillemot','ostrich','pelican'].includes(slug),'Only independently reviewed C261 candidates are permitted');
const base='audits/C266_CODEX_20261017/coordinator';
const run=base+'/'+slug+'-finish-01';
const read=p=>JSON.parse(fs.readFileSync(p));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const checkpoint=read(run+'/checkpoint.json');
assert.equal(sha(checkpoint.checkpointReview),checkpoint.checkpointReviewSha256);
assert.equal(read(run+'/finished/result.json').status,'PASS');
const subjects=read(run+'/subjects.json');assert.equal(subjects.length,1);
const release=acquireWorkspaceLock('C395 one conserved finish rebind');
try {
 const rows=await rebindFinished(subjects,run+'/finished',run+'/rebound');
 fs.writeFileSync(run+'/rebind-results.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
 assert.equal(rows.length,1);assert(rows.every(r=>r.status==='PASS'),'Rebind LEAF_RED is not process success');
 const original=read(checkpoint.nativePlan ?? base+'/'+slug+'-01/plan.json')[0];
 assert.equal(original.id,rows[0].id);
 const plan=[{...original,fit:run+'/rebound/'+original.id,nativeDir:run+'/native',nativeReport:run+'/native/report.json',
  finishedMaster:run+'/finished/'+original.id+'-finished.png',finishReceipt:run+'/finished/'+original.id+'-receipt.json',
  checkpointReview:checkpoint.checkpointReview,scope:'Finished texture on byte-identical geometry; independent W3 required'}];
 fs.writeFileSync(run+'/finished-plan.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({status:'PASS',id:original.id,geometryByteIdentical:rows[0].geometryByteIdentical}));
} finally {release();}
