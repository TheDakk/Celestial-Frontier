import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {assessPatternObservation,patternRequirements} from '../../port/v2/tools/painted-creature/pattern-observation.mjs';
const base=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex');
const notes={
'Tiger Shark':'At full native size, repeated dark near-vertical stripes extend from the blue-grey back down the visible flank; they continue along the tail stalk. Pattern present; the painted near-symmetric tail still needs species/anatomy review and is not accepted by this observation.',
'Whale Shark':'At full native size, many discrete white spots lie in rows between pale intersecting linear markings over the blue-grey back and visible flank; spots continue onto dorsal, pectoral and caudal fins. This is a source-bound pigment observation, not anatomy admission.'
};
const rows=JSON.parse(fs.readFileSync(base+'/pilot-v2.json')),files=[],summary=[];
for(const row of rows){
 const source=JSON.parse(fs.readFileSync(row.packet+'/subject-source.json')),bytes=fs.readFileSync(row.packet+'/master.png'),masterSha256=sha(bytes),required=patternRequirements(source.species);
 if(required.length&&!notes[row.name])throw Error('Unreviewed pattern '+row.name);
 const observation={name:row.name,masterSha256,status:'PRESENT',features:required.map(requirement=>({requirement,status:'PRESENT',observed:notes[row.name]}))};
 const result=assessPatternObservation(source.species,bytes,observation),file=row.packet+'/pattern-check.json';
 fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 files.push({path:file,sha256:sha(fs.readFileSync(file)),bytes:fs.statSync(file).size});summary.push({name:row.name,status:result.status,required:result.required,masterSha256});
}
const prior=fs.readFileSync(base+'/delivery.json');
fs.writeFileSync(base+'/pattern-addendum.json',JSON.stringify({schema:'cf.c197-pattern-addendum/v1',reason:'C176 requested missing unchanged-pipeline pattern observations',priorDeliverySha256:sha(prior),selected:'pilot-v2.json',method:'Full native-size visual review; existing patternRequirements and assessPatternObservation owners unchanged',mastersModified:false,summary,files},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(summary));
