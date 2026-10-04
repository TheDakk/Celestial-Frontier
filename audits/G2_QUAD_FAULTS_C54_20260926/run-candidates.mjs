import fs from'node:fs';import path from'node:path';import{spawnSync}from'node:child_process';import{createHash}from'node:crypto';import{projectContactEndpoints}from'./project-contact.mjs';
const ROOT=path.resolve(import.meta.dirname,'../..'),rows=JSON.parse(fs.readFileSync(new URL('./contact-ownership.json',import.meta.url))),out=[];
for(const row of rows){const original=JSON.parse(fs.readFileSync(path.join(ROOT,row.packet,'authoring.json'))),candidate=projectContactEndpoints(original,row.points),dir=path.join(import.meta.dirname,row.id);if(!candidate.moves.length){out.push({id:row.id,status:'UNCHANGED_NO_RUN',reason:'No endpoint ownership mismatch; known blended red unchanged'});continue;}
 if(fs.existsSync(dir))throw Error('Fresh candidate required');fs.mkdirSync(path.join(dir,'packet'),{recursive:true});
 const master=fs.readFileSync(path.join(ROOT,row.master));if(createHash('sha256').update(master).digest('hex')!==row.masterSha256)throw Error('source changed');fs.writeFileSync(path.join(dir,'packet/master.png'),master);
 for(const file of['subject-source.json','presence.json'])fs.copyFileSync(path.join(ROOT,row.packet,file),path.join(dir,'packet',file));
 fs.writeFileSync(path.join(dir,'packet/authoring.json'),JSON.stringify(candidate.authoring,null,2)+'\n');fs.writeFileSync(path.join(dir,'operation.json'),JSON.stringify({sourcePacket:row.packet,sourceMasterSha256:row.masterSha256,sourceAuthorSha256:row.authorSha256,moves:candidate.moves},null,2)+'\n');
 let result=spawnSync(process.execPath,['port/v2/tools/creature-animation/intake-authored.mjs',path.join(dir,'packet'),path.join(dir,'fit')],{cwd:ROOT,encoding:'utf8',timeout:900000});fs.writeFileSync(path.join(dir,'intake.log'),result.stdout+result.stderr);
 if(result.status!==0){out.push({id:row.id,status:'INTAKE_REFUSED',moves:candidate.moves});console.log(row.id,'INTAKE_REFUSED');continue;}
 result=spawnSync(process.execPath,['audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',path.join(dir,'fit'),path.join(dir,'static.json')],{cwd:ROOT,encoding:'utf8',timeout:1800000});fs.writeFileSync(path.join(dir,'static.log'),result.stdout+result.stderr);
 const report=JSON.parse(fs.readFileSync(path.join(dir,'static.json'))),refused=[...report.rows.filter(r=>r.status!=='PASS'),...(report.presentation.status!=='PASS'?[{...report.presentation,id:'presentation'}]:[])];
 out.push({id:row.id,status:report.status,moves:candidate.moves,refusals:refused.map(r=>({id:r.id,error:r.firstRefusal?.error?.split('\n')[0]})),sourcePixelRest:report.sourcePixelRest});console.log(row.id,report.status,JSON.stringify(out.at(-1).refusals));
}
fs.writeFileSync(new URL('./summary.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
