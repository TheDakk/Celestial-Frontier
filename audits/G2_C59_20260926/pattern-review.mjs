import fs from'node:fs';import{createHash}from'node:crypto';import{assessPatternObservation,patternRequirements}from'../../port/v2/tools/painted-creature/pattern-observation.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('./pilot.json',import.meta.url))),notes={
 Raccoon:'Black eye mask and clearly alternating dark/light rings along the visible complete tail.',
 Badger:'A broad pale central face stripe between the dark eye/cheek stripes is visible.',
 Wolverine:'Pale flank stripe sweeps from shoulder along the brown sides toward the tail.',
 Starling:'Many pale feather-tip flecks on dark iridescent breast, wing and back plumage.',
 'Water Snake':'Repeated dark cross-bands wrap the tan keeled body along the shallow S-curve.',
 'Mountain Viper':'Dark diamond/checkered flank markings are visible, but a continuous zigzag dorsal band is not unambiguously resolved.',
 Ladybug:'Clearly visible round black spots on the red domed divided wing cases.'};
const summary=[];for(const row of rows){const p=row.packet,subject=JSON.parse(fs.readFileSync(p+'/subject-source.json')),bytes=fs.readFileSync(p+'/master.png'),required=patternRequirements(subject.species),status=row.name==='Mountain Viper'?'UNRESOLVED':'PRESENT';let observation=null;
 if(required.length){if(!notes[row.name])throw Error('Missing explicit observation');observation={name:row.name,masterSha256:createHash('sha256').update(bytes).digest('hex'),status,method:'Codex visual inspection of exact generated originals and sheet; pattern only, not G1, anatomy or Dakk approval',features:required.map(requirement=>({requirement,status,observed:notes[row.name]}))};fs.writeFileSync(p+'/pattern-review.json',JSON.stringify(observation,null,2)+'\n',{flag:'wx'});}
 const check=assessPatternObservation(subject.species,bytes,observation);fs.writeFileSync(p+'/pattern-check.json',JSON.stringify(check,null,2)+'\n',{flag:'wx'});summary.push({id:row.id,status:check.status,...check.reason?{reason:check.reason}:{}});
}fs.writeFileSync(new URL('./pattern-summary.json',import.meta.url),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});console.log(summary);
