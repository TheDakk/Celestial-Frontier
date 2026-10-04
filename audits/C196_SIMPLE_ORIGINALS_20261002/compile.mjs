import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {compileLibraryMaster} from './compiler.audit.mjs';
const base='audits/C196_SIMPLE_ORIGINALS_20261002',sha=b=>createHash('sha256').update(b).digest('hex'),rows=[];
for(const[i,name]of ['Earthworm','Sponge','Snail','Mussel'].entries()){
 const id=String(i+1).padStart(2,'0')+'-'+name.toLowerCase(),packet=base+'/'+id,c=await compileLibraryMaster(name,packet),request=JSON.parse(fs.readFileSync(packet+'/request.json'));
 const prompt=fs.readFileSync(packet+'/prompt.txt','utf8'),composition='COMPOSITION PRIORITY: the whole animal occupies only HALF the canvas width AND no more than HALF its height, centered on native 1254 x 1254 pure magenta. About 300 pixels clear margin on every side. Preserve the full natural anatomy; no crop, guides or scenery.';
 const next=composition+'\n\n'+prompt+'\n\n'+composition+'\n';fs.writeFileSync(packet+'/prompt.txt.tmp',next,{flag:'wx'});fs.renameSync(packet+'/prompt.txt.tmp',packet+'/prompt.txt');fs.writeFileSync(packet+'/request.json.tmp',JSON.stringify({...request,basePromptSha256:request.promptSha256,promptSha256:sha(next),auditCompilerExtension:true,purpose:'NEW_SPECIALIZED_SOURCE',templateStatus:'Existing canonical family; audit-only painting vocabulary. No measured semantic presence or admission.'},null,2)+'\n',{flag:'wx'});fs.renameSync(packet+'/request.json.tmp',packet+'/request.json');rows.push({id,name,family:c.family,packet,master:packet+'/master.png',purpose:'NEW_SPECIALIZED_SOURCE'});console.log(id,c.family);
}fs.writeFileSync(base+'/pilot.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
