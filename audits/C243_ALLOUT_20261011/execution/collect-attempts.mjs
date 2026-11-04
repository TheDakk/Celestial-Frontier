/** Retain every measured attempt; select only source-eligible admissions for the next stage. */
import fs from 'node:fs';
import path from 'node:path';
const [pilotFile,tag]=process.argv.slice(2);
if (!pilotFile?.startsWith('audits/C243_ALLOUT_20261011/execution/batch')||!/^c243b\d+/.test(tag??'')) throw Error('usage: collect-attempts.mjs pilot tag');
const read=p=>JSON.parse(fs.readFileSync(p));
const write=(p,x)=>{fs.writeFileSync(p+'.tmp',JSON.stringify(x,null,2)+'\n');fs.renameSync(p+'.tmp',p);};
const pilot=read(pilotFile),batchDir=path.dirname(pilot[0].packet),file=batchDir+'/attempts.json';
const attempts=fs.existsSync(file)?read(file):[];
for(const row of pilot){
 if(path.dirname(row.packet)!==batchDir)throw Error('Mixed batch');
 const m=row.id.match(/^c243b(\d+)r(\d+)c(\d+)-/);if(!m)throw Error('Unexpected candidate id');
 const score=`audits/G1_AUTO_AUTHOR_20260926/auto-${tag}/${row.id}/score.json`;
 const s=read(score),o=read(row.packet+'/visible-anatomy.json'),g=read(row.packet+'/generation.json');
 if(attempts.some(a=>a.id===row.id))continue;
 attempts.push({name:row.name,round:Number(m[2]),candidate:Number(m[3]),id:row.id,masterSha256:g.masterSha256,promptSha256:g.promptSha256,
  sourceEligibility:o.status,framing:o.framing,verdict:s.verdict,static:s.static??null,reasons:s.reasons??[],score,selected:false,nativePending:false});
}
// Explicit source inspection can hold an otherwise numerically passing painting.
// Keep the raw author/static verdict; never convert a visual hold into admission.
for(const a of attempts){
 const holdFile=batchDir+'/'+a.id+'/source-hold.json';
 if(fs.existsSync(holdFile)){
  const hold=read(holdFile);
  if(hold.masterSha256!==a.masterSha256||!hold.reason||hold.status!=='HOLD_SOURCE_IDENTITY')throw Error('Stale or invalid source identity hold');
  a.visualHold=hold.reason;
 }
}
const selected=[];
for(const name of new Set(attempts.map(a=>a.name))){
 const rows=attempts.filter(a=>a.name===name);
 const eligible=rows.filter(a=>a.sourceEligibility==='ELIGIBLE_FOR_INTAKE'&&a.verdict==='ADMIT'&&!a.visualHold);
 // A new repaint does not displace a passing selected fit with a static-red fit.
 const best=eligible.find(a=>a.selected&&a.static==='PASS_STATIC')??eligible.find(a=>a.static==='PASS_STATIC')??eligible.find(a=>a.selected)??eligible[0];
 for(const a of rows){a.selected=a===best;a.nativePending=a===best&&a.static==='PASS_STATIC';}
 if(best?.static==='PASS_STATIC')selected.push(read(batchDir+'/'+best.id+'/pilot.json')[0]);
}
write(file,attempts);write(batchDir+'/pilot-selected.json',selected);
const ledgerFile='audits/C243_ALLOUT_20261011/execution/ledger.json',ledger=read(ledgerFile);
const batch=ledger.batches.find(b=>b.batch===Number(path.basename(batchDir).slice(5)));if(!batch)throw Error('Missing batch ledger');
for(const s of batch.species){
 const rows=attempts.filter(a=>a.name===s.name);if(!rows.length)continue;
 const chosen=rows.find(a=>a.selected);
 s.progress={round:Math.max(...rows.map(a=>a.round)),candidates:rows.length,selected:chosen?.id??null,
  status:chosen?(chosen.static==='PASS_STATIC'?'ADMIT_STATIC_PASS_NATIVE_PENDING':'ADMIT_STATIC_RED_CLASS_FIX_PENDING'):'REPAINT_REFUSED',
  latestReasons:[...rows.at(-1).reasons,...(rows.at(-1).visualHold?['source-identity: '+rows.at(-1).visualHold]:[])]};
}
write(ledgerFile,ledger);
console.log(JSON.stringify({attempts:attempts.length,selected:selected.length,staticPass:attempts.filter(a=>a.selected&&a.static==='PASS_STATIC').length,
 latest:pilot.map(p=>{const a=attempts.find(a=>a.id===p.id);return{name:a.name,verdict:a.verdict,static:a.static,reasons:a.reasons};})}));
