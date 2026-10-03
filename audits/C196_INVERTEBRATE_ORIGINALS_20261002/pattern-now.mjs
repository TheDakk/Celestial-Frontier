import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {assessPatternObservation,patternRequirements} from '../../port/v2/tools/painted-creature/pattern-observation.mjs';
const base=import.meta.dirname,rows=JSON.parse(fs.readFileSync(base+'/pilot.json')),notes=JSON.parse(fs.readFileSync(base+'/visual-notes.json')),sha=b=>createHash('sha256').update(b).digest('hex');
for(const row of rows){const b=fs.readFileSync(row.master),species=JSON.parse(fs.readFileSync(row.packet+'/subject-source.json')).species,requirements=patternRequirements(species),observation={name:row.name,masterSha256:sha(b),status:'PRESENT',features:requirements.map(requirement=>({requirement,status:'PRESENT',observed:notes[row.name]}))};const result=assessPatternObservation(species,b,observation);fs.writeFileSync(row.packet+'/pattern-check.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(row.name,result.status);}
