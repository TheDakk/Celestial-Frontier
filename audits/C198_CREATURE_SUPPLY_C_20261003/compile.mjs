import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {compileLibraryMaster} from '../../port/v2/tools/painted-creature/compile-library-master.mjs';
const base=path.relative(process.cwd(),import.meta.dirname),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p)),roster=read(base+'/roster.json'),coverage=read(base+'/coverage-at-selection.json');
if(roster.length!==24||new Set(roster.map(r=>r.name)).size!==24||coverage.covered!==251)throw Error('Exact selected roster/coverage required');
const accepted=new Set(coverage.families.flatMap(f=>f.names)),prior=new Map();
for(const file of execFileSync('rg',['--files','audits','-g','pilot*.json'],{encoding:'utf8'}).trim().split('\n').filter(f=>!f.includes('/C198_CREATURE_SUPPLY_'))){
 let rows;try{rows=read(file);}catch{continue;}if(!Array.isArray(rows))continue;for(const row of rows){if(typeof row?.name!=='string')continue;const list=prior.get(row.name)??[];list.push({pilot:file,id:row.id,master:row.master??null,packet:row.packet??null});prior.set(row.name,list);}
}
const composition='COMPOSITION PRIORITY: small complete natural animal centered on native 1254 x 1254 pure magenta canvas. Entire silhouette including every tip occupies only the central HALF of the canvas, about 300 pixels empty on all sides. Preserve actual proportions; no crop, floor, shadow, prop or text.';
const rows=[];
for(const[i,row]of roster.entries()){
 const {name,correction}=row;if(accepted.has(name)||!prior.has(name)||!correction)throw Error('Source roster exclusion/provenance '+name);
 const id=String(i+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-'),packet=base+'/'+id,c=await compileLibraryMaster(name,packet),q=read(packet+'/request.json'),canonical=fs.readFileSync(packet+'/prompt.txt','utf8'),appendix='TARGETED SOURCE CORRECTION: '+correction,prompt=composition+'\n'+appendix+'\n\n'+canonical+'\n\n'+appendix+'\n'+composition+'\n',repairReason={correction,priorSources:prior.get(name)};
 if(sha(canonical)!==q.promptSha256)throw Error('Canonical binding');fs.writeFileSync(packet+'/prompt.canonical.txt',canonical,{flag:'wx'});fs.writeFileSync(packet+'/prompt.txt.tmp',prompt,{flag:'wx'});fs.renameSync(packet+'/prompt.txt.tmp',packet+'/prompt.txt');
 fs.writeFileSync(packet+'/request.json.tmp',JSON.stringify({...q,basePromptSha256:q.promptSha256,promptSha256:sha(prompt),batchCompilerSha256:sha(fs.readFileSync(import.meta.filename)),purpose:'TARGETED_SOURCE_REPAINT',repairReason,priorPilotPaths:[...new Set(prior.get(name).map(r=>r.pilot))],auditCompilerExtension:false,sourceCorrection:appendix,compositionCheck:composition,admission:'SOURCE_CANDIDATE_ONLY; no presence, reference-pool, fit or native admission'},null,2)+'\n',{flag:'wx'});fs.renameSync(packet+'/request.json.tmp',packet+'/request.json');
 rows.push({id,name,family:c.family,packet,master:packet+'/master.png',purpose:'TARGETED_SOURCE_REPAINT',repairReason});console.log(id,c.family);
}
fs.writeFileSync(base+'/pilot.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(base+'/selection.json',JSON.stringify({schema:'cf.g2-selection/v1',coveredAtSelection:251,total:24,targetedSourceRepaints:24,newSourceIdentities:0,specialists:[],scope:'Unchanged canonical source compiler; exact source-observability additions disclosed, no runtime or admission claim.',coverageSha256:sha(fs.readFileSync(base+'/coverage-at-selection.json')),rows},null,2)+'\n',{flag:'wx'});
