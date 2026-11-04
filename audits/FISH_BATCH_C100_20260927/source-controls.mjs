import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import{admitFishSeamSource}from'../G1_AUTO_AUTHOR_20260926/fish-seams-source.mjs';
const root=path.resolve(import.meta.dirname,'../..'),src=path.join(root,'audits/FISH_PIPELINE_C99_20260927/inputs/08-gar'),original=path.join(root,'audits/G1_AUTO_AUTHOR_20260926/auto-g2c90/08-gar'),subjectDir=path.join(root,'audits/G2_C90_20260927/08-gar');
const read=f=>JSON.parse(fs.readFileSync(f)),report=read(path.join(original,'static.json'));
/* Portable test fixture paths only: exact original pinned file bytes/hashes, report outcomes unchanged. Not certification evidence. */
const previous=path.dirname(report.inputs.find(p=>p.path.endsWith('/record.json')).path);report.inputs=report.inputs.map(p=>({...p,path:path.join(src,path.relative(previous,p.path))}));
const data={id:'08-gar',score:read(path.join(original,'score.json')),report,provenance:read(path.join(original,'provenance.json')),subject:read(path.join(subjectDir,'subject-source.json')),subjectBytes:fs.readFileSync(path.join(subjectDir,'subject-source.json')),master:fs.readFileSync(path.join(subjectDir,'master.png')),pattern:read(path.join(subjectDir,'pattern-check.json')),autoRoot:path.dirname(src)};
assert.equal(admitFishSeamSource(data).fit,src);
const cases=[
 ['wrong subject',d=>d.id='other',/subject id/],['wrong family',d=>d.score.family='quadruped',/fish family/],['refused author',d=>d.score.verdict='REFUSE',/author admitted/],
 ['unresolved inventory',d=>d.score.semanticPresence='UNRESOLVED',/semantic inventory resolved/],['unresolved provenance',d=>d.provenance.presence.semantic='UNRESOLVED',/semantic inventory resolved/],
 ['red static',d=>d.report.status='FAIL_STATIC',/full static pass/],['red action behind green summary',d=>d.report.rows[0].status='FAIL',/complete static outcomes/],['red presentation',d=>d.report.presentation.status='FAIL',/complete static outcomes/],
 ['missing pattern',d=>d.pattern.status='MISSING',/pattern gate/],['stale pattern',d=>d.pattern.masterSha256='0'.repeat(64),/pattern bound/],['wrong master',d=>d.master=Buffer.from('wrong'),/exact original master/],['wrong subject bytes',d=>d.subjectBytes=Buffer.from('wrong'),/exact subject record/],
 ['wrong root',d=>d.autoRoot=path.join(src,'parts'),/inside explicit author root/],['stale measured hash',d=>d.report.inputs[1].sha256='0'.repeat(64),/measured input hash/],['missing binding pin',d=>d.report.inputs=d.report.inputs.filter(p=>!p.path.endsWith('/binding.json')),/complete measured input inventory/],['binding substituted',d=>d.report.bindingHash='0'.repeat(64),/measured record\/binding/],
];
for(const[name,change,reason]of cases){const d=structuredClone(data);change(d);assert.throws(()=>admitFishSeamSource(d),reason,name);}
console.log(JSON.stringify({status:'PASS',positive:'Exact pinned Gar source admitted; portability changes only fixture paths',negativeControls:cases.map(([name])=>({name,status:'REFUSED_EXPECTED'}))},null,2));
