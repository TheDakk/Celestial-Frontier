/** Assessor controls only. No model bytes, browser, inference or qualification. */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {PINNED_LOCAL_MODEL_MANIFEST_V1 as model} from '../../port/v2/apps/game/src/local-model-manifest.ts';
import {assessNativeReadback} from './run-mobile-model-delivery.mjs';
const expected=model.files.map((file,index)=>({...file,headSha256:createHash('sha256').update('synthetic-head-'+index).digest('hex'),tailSha256:createHash('sha256').update('synthetic-tail-'+index).digest('hex')}));
const fixture=()=>({status:{ready:true,phase:'ready',error:null,totalBytes:model.totalBytes,verifiedBytes:model.totalBytes,verifiedFiles:model.files.length,totalFiles:model.files.length,manifestSha256:createHash('sha256').update(JSON.stringify(model)).digest('hex')},files:structuredClone(expected)});
test('admits complete ordered synthetic counterpart only; no native inference claim',()=>{assert.doesNotThrow(()=>assessNativeReadback(fixture(),expected));});
test('rejects absent/not-ready/inconsistent-phase/error status',()=>{for(const change of [{ready:false},{phase:'verifying'},{error:'failed'}]){const result=fixture();Object.assign(result.status,change);assert.throws(()=>assessNativeReadback(result,expected));}assert.throws(()=>assessNativeReadback(null,expected));});
test('rejects incomplete and mismatched totals',()=>{for(const field of ['totalBytes','verifiedBytes','verifiedFiles','totalFiles']){const result=fixture();result.status[field]--;assert.throws(()=>assessNativeReadback(result,expected));}});
test('rejects a stale or substituted normalized manifest SHA',()=>{const result=fixture();result.status.manifestSha256='0'.repeat(64);assert.throws(()=>assessNativeReadback(result,expected));});
test('rejects missing, duplicated or reordered Blob carriers',()=>{for(const change of [rows=>rows.pop(),rows=>rows.reverse(),rows=>{rows[1]=rows[0];}]){const result=fixture();change(result.files);assert.throws(()=>assessNativeReadback(result,expected));}});
test('rejects corrupt head/tail and wrong declared Blob length',()=>{for(const field of ['headSha256','tailSha256','bytes']){const result=fixture();result.files[0][field]=field==='bytes'?result.files[0].bytes-1:'0'.repeat(64);assert.throws(()=>assessNativeReadback(result,expected));}});
test('rejects a changed file path even when byte samples match another carrier',()=>{const result=fixture();result.files[0].path='unbound.bin';assert.throws(()=>assessNativeReadback(result,expected));});
test('read-only diagnostic transpilation retains exactly one production SHA import and no side-effect invocation',async()=>{const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),ts=require('typescript');const source=await fs.readFile(new URL('../../port/v2/apps/game/src/local-model-delivery.ts',import.meta.url),'utf8');const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});assert.equal(result.outputText.split("'./local-model-sha256.js'").length,2);assert.match(result.outputText,/export function createLocalModelDeliveryV1\(options\)/);assert.equal(result.diagnostics.length,0);});
