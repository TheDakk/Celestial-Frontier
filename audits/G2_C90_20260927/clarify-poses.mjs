/** Before generation only: reconcile habitual poses with Dakk's controlled reference layout. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex');
const changes={
 Cobra:[['front third of the body reared vertically','front third of the body extended in the requested low open side profile',2],['coiled base with a fixed lidless stare','uncoiled continuous body with a fixed lidless stare',2],['the reared cobra is taller than it is wide','this cobra is in a low open side profile, retaining the flared rib-supported hood behind its head',1]],
 Viper:[['the coil sits low and flat','the uncoiled body follows the requested low open side profile',1]],
 Rattlesnake:[['thick body coiled with the neck reared in an S','thick body extended in one low open S-curve with the head level',2]],
 'Cave Snake':[['limbless coiled rope body','limbless continuous body in one low open shallow S-curve',2]],
 Squirrel:[['bushy plumed tail arched up over the back','bushy plumed tail arched up behind the rump and clear of the back',2],['sitting on the haunches holding food in the forepaws','all four legs planted in a quiet walking stride with complete toes visible and no food',2],['the arched tail makes it read taller than long','the tail remains naturally plumed and arched, held clear of the walking body',1]],
 Meerkat:[['standing bolt upright, propped on the hind legs and tail','all four legs planted in a quiet walking stride, with the complete tail clear of the legs',2],['much taller than wide when sentinel-standing','shown in an isolated quadrupedal walking stance rather than its habitual sentinel stance',1]],
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
