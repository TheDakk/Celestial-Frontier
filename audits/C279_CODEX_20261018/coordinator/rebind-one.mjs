import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {rebindFinished} from '../../AI_FINISH_C121_20261001/rebind-batch.mjs';
import {acquireWorkspaceLock} from '../../../port/v2/tools/workspacelock.mjs';
const run=process.argv[2];assert(run.startsWith('audits/C279_CODEX_20261018/coordinator/finishes/'));assert(!run.includes('..'));
const read=p=>JSON.parse(fs.readFileSync(p));const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const cp=read(run+'/checkpoint.json');assert.equal(sha(cp.checkpointReview),cp.checkpointReviewSha256);const review=read(cp.checkpointReview);assert.equal(review.status,'W2_CLEAN');assert.equal(review.decision.C261FinishEligible,true);assert.equal(read(run+'/finished/result.json').status,'PASS');
const subjects=read(run+'/subjects.json');assert.equal(subjects.length,1);const release=acquireWorkspaceLock('C279 conserved finish rebind');
try{const rows=await rebindFinished(subjects,run+'/finished',run+'/rebound');fs.writeFileSync(run+'/rebind-results.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});assert.equal(rows.length,1);assert(rows.every(r=>r.status==='PASS'),'LEAF_RED refuses');const original=read(cp.nativePlan)[0];assert.equal(original.id,rows[0].id);const plan=[{...original,fit:run+'/rebound/'+original.id,nativeDir:run+'/native',nativeReport:run+'/native/report.json',finishedMaster:run+'/finished/'+original.id+'-finished.png',finishReceipt:run+'/finished/'+original.id+'-receipt.json',checkpointReview:cp.checkpointReview,scope:'Finished texture on byte-identical geometry; independentW3 required'}];fs.writeFileSync(run+'/finished-plan.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS',id:original.id,geometryByteIdentical:rows[0].geometryByteIdentical}));}finally{release();}
