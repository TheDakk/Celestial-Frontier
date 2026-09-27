/** Before generation only: reconcile habitual poses with Dakk's controlled reference layout. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex');
const changes={
 Swan:[['large white body floating high on the water','large white body standing naturally on both webbed feet for this isolated reference, no water',2]],
 Cormorant:[['wings held open to dry in a heraldic pose','long wings folded naturally above the stiff wedge tail for this standing reference, not the habitual drying display',2]],
 Bittern:[['dagger bill pointed straight up in the reed-mimic freeze pose','dagger bill held level and pointing right for this standing side-profile reference, not the habitual reed-mimic freeze pose',2]],
 Aphid:[['needle beak stuck into a stem','needle beak clearly present beneath the head, without a stem or other prop in this isolated reference',2]],
};
const receipts=[];
for(const row of JSON.parse(fs.readFileSync(base+'/pilot.json'))){
 if(!changes[row.name])continue;
 const p=row.packet;if(fs.existsSync(p+'/generation.json'))throw Error('No retrospective prompt edits');
 const original=fs.readFileSync(p+'/prompt.txt','utf8'),request=JSON.parse(fs.readFileSync(p+'/request.json')),subject=fs.readFileSync(p+'/subject-source.json');
 if(sha(original)!==request.promptSha256)throw Error('Exact original prompt required');let next=original;
 for(const[a,b,count]of changes[row.name]){if(next.split(a).length-1!==count)throw Error('Nonunique pose clause '+row.name+': '+a);next=next.replaceAll(a,b);}
 fs.writeFileSync(p+'/before-pose-prompt.txt',original,{flag:'wx'});fs.writeFileSync(p+'/before-pose-request.json',JSON.stringify(request,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(p+'/prompt.txt.tmp',next,{flag:'wx'});fs.renameSync(p+'/prompt.txt.tmp',p+'/prompt.txt');
 fs.writeFileSync(p+'/request.json.tmp',JSON.stringify({...request,prePosePromptSha256:sha(original),promptSha256:sha(next),poseClarifications:changes[row.name]},null,2)+'\n',{flag:'wx'});fs.renameSync(p+'/request.json.tmp',p+'/request.json');
 if(!fs.readFileSync(p+'/subject-source.json').equals(subject))throw Error('Canonical identity changed');
 receipts.push({name:row.name,before:sha(original),after:sha(next),subjectUnchanged:true,changes:changes[row.name]});
}
fs.writeFileSync(base+'/pose-clarifications.json',JSON.stringify(receipts,null,2)+'\n',{flag:'wx'});console.log(receipts.map(r=>r.name));
