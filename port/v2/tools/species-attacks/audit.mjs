/** Live-catalogue presentation audit. Does not invent masters, rigs or visual acceptance. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {rolldown} from 'rolldown';
const root=path.resolve(import.meta.dirname,'../../../..'),out=process.argv[2];
if(!out||fs.existsSync(out))throw Error('Usage: audit.mjs NEW_OUTPUT_DIRECTORY');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-species-attacks-')),sources=new Map(),sha=b=>createHash('sha256').update(b).digest('hex');
try{
 const files={profiles:'apps/game/src/earth-fauna-profiles.ts',attacks:'apps/game/src/anatomy-attacks.ts',descriptors:'packages/domain/descriptors/src/index.ts',habitat:'apps/game/src/battle-habitat.ts'};
 const entry=Object.entries(files).map(([id,p])=>`export * as ${id} from ${JSON.stringify(path.join(root,'port/v2',p))};`).join('\n');
 const b=await rolldown({input:'cf-species-audit',platform:'node',plugins:[{name:'sources',resolveId(id){if(id==='cf-species-audit')return '\0cf-species-audit';},load(id){if(id==='\0cf-species-audit')return entry;},transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));}}]});
 try{await b.write({dir:scratch,format:'es',entryFileNames:'audit.mjs'});}finally{await b.close();}
 const {profiles,attacks,descriptors,habitat}=await import(pathToFileURL(path.join(scratch,'audit.mjs')));
 const audit=profiles.auditEarthFaunaProfiles(descriptors._EARTH_NAMES.fauna);
 if(audit.status!=='PASS')throw Error(JSON.stringify(audit));
 const species=descriptors._EARTH_NAMES.fauna.map(name=>{
  const p=profiles.earthFaunaProfile(name),libraryCandidates=attacks.ANATOMY_ATTACKS.filter(a=>p.candidateTemplates.includes(a.family)&&p.intendedMoves.includes(a.verb));
  const missingMoves=p.intendedMoves.filter(v=>!libraryCandidates.some(a=>a.verb===v));
  return {name,profile:p.id,habitat:habitat.resolvePhysicalHabitat({identity:{earthName:name},template:{id:p.candidateTemplates[0]??'unsupported'}}),candidateTemplates:p.candidateTemplates,intendedMoves:p.intendedMoves,
   libraryCandidates:libraryCandidates.map(a=>({template:a.family,verb:a.verb,requiredJoints:a.joints,contactJoint:a.contactJoint})),missingMoves,notes:p.notes,
   coverage:p.candidateTemplates.length===0?'NEEDS_TOPOLOGY':libraryCandidates.length===0?'NEEDS_MOTION':'CANDIDATE_REQUIRES_FITTED_RECORD',
   visualQualification:'NOT_EVALUATED_BY_THIS_AUDIT'};
 });
 const negativeControls={newSpecies:profiles.auditEarthFaunaProfiles([...descriptors._EARTH_NAMES.fauna,'Unlisted control animal']).status==='FAIL',removedSpecies:profiles.auditEarthFaunaProfiles(descriptors._EARTH_NAMES.fauna.slice(1)).status==='FAIL',duplicateSpecies:profiles.auditEarthFaunaProfiles([...descriptors._EARTH_NAMES.fauna,descriptors._EARTH_NAMES.fauna[0]]).status==='FAIL'};
 if(Object.values(negativeControls).some(v=>!v))throw Error('Coverage negative control failed');
 const report={schema:'cf.full-species-attacks/v1',status:'PASS',scope:'Exact catalogue intent, habitat routing and available motion candidates. No new species animation/painting acceptance.',catalogue:audit,counts:Object.fromEntries(['NEEDS_TOPOLOGY','NEEDS_MOTION','CANDIDATE_REQUIRES_FITTED_RECORD'].map(k=>[k,species.filter(s=>s.coverage===k).length])),negativeControls,species,sources:[...sources].map(([p,sha256])=>({path:path.relative(root,p),sha256}))};
 for(const[p,h]of sources)if(sha(fs.readFileSync(p))!==h)throw Error('Source changed during audit: '+p);
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rows=species.map(s=>'<tr>'+[s.name,s.profile,s.habitat.allowed.join(' / '),s.intendedMoves.join(', ')||'No physical strike declared',s.coverage,s.missingMoves.join(', '),s.notes].map(x=>'<td>'+escape(x)+'</td>').join('')+'</tr>').join('\n');
 fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Full species attack coverage</title><style>body{margin:24px;background:#14252b;color:#eff4ec;font:16px system-ui}a{color:#a9dfdd}input{padding:12px;width:min(90%,500px)}table{border-collapse:collapse;min-width:1100px}td,th{padding:12px;text-align:left;border-bottom:1px solid #42606a}th{background:#20383e}td:nth-child(1){font-weight:bold}.scroll{overflow:auto}p{max-width:950px;line-height:1.5}</style><h1>631 animals · exact species register</h1><p>This board distinguishes intended attacks from finished animation. Every row still needs its own fitted artwork and visual qualification; no generic portrait has been counted as species coverage.</p><p>${escape(JSON.stringify(report.counts))}</p><p><a href="../anatomy-battle/">Current three-creature painted motion proof</a> · <a href="report.json">Source-hashed report</a></p><label>Filter species, habitat or gap <input id="filter" type="search"></label><p id="count">631 rows</p><div class="scroll"><table><thead><tr>${['Species','Profile','Media','Intended attacks','Implementation boundary','Missing clips','Fit notes'].map(x=>'<th>'+x+'</th>').join('')}</tr></thead><tbody>${rows}</tbody></table></div><script>const rows=[...document.querySelectorAll('tbody tr')];document.querySelector('#filter').addEventListener('input',e=>{const q=e.target.value.toLowerCase();let n=0;for(const r of rows){r.hidden=!r.textContent.toLowerCase().includes(q);if(!r.hidden)n++;}document.querySelector('#count').textContent=n+' rows';});</script></html>`);
 console.log(JSON.stringify({status:report.status,catalogue:audit,counts:report.counts}));
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
