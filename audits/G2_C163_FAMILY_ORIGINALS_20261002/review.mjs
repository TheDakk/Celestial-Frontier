import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {assessPatternObservation,patternRequirements} from '../../port/v2/tools/painted-creature/pattern-observation.mjs';
const base=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex');
const notes=JSON.parse(fs.readFileSync(base+'/visual-notes.json')),rows=JSON.parse(fs.readFileSync(base+'/pilot.json')),summary=[];
const framing=JSON.parse(fs.readFileSync(base+'/observations.json'));
for(const row of rows){
 const dir=row.packet,bytes=fs.readFileSync(dir+'/master.png'),masterSha256=sha(bytes),species=JSON.parse(fs.readFileSync(dir+'/subject-source.json')).species;
 const request=JSON.parse(fs.readFileSync(dir+'/request.json')),generation=JSON.parse(fs.readFileSync(dir+'/generation.json')),prompt=fs.readFileSync(dir+'/prompt.txt');
 if(masterSha256!==generation.masterSha256||sha(prompt)!==request.promptSha256||sha(prompt)!==generation.promptSha256||!notes[row.name])throw Error('Missing/stale exact receipt or review: '+row.name);
 const requirements=patternRequirements(species);
 const observation={name:row.name,masterSha256,status:'PRESENT',features:requirements.map(requirement=>({requirement,status:'PRESENT',observed:notes[row.name]}))};
 const pattern=assessPatternObservation(species,bytes,observation);
 const review={name:row.name,masterSha256,method:'Full original visual inspection by Codex',observation:notes[row.name],status:'DIAGNOSTIC_NOT_ADMITTED',scope:'Visible identity/layout only; not G1 anatomy, motion or Dakk acceptance',framing:framing.find(r=>r.id===row.id).framing};
 fs.writeFileSync(dir+'/visual-review.json',JSON.stringify(review,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(dir+'/pattern-check.json',JSON.stringify(pattern,null,2)+'\n',{flag:'wx'});
 summary.push({name:row.name,status:pattern.status,framing:review.framing.status});
}
fs.writeFileSync(base+'/pattern-summary.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(summary);
