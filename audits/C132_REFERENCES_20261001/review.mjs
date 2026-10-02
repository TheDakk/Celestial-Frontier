import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {observations} from './manual-observations.mjs';
import {patternRequirements,assessPatternObservation} from '../../port/v2/tools/painted-creature/pattern-observation.mjs';
const base=import.meta.dirname,rows=JSON.parse(fs.readFileSync(base+'/pilot.json')),framing=JSON.parse(fs.readFileSync(base+'/observations.json')),sha=b=>createHash('sha256').update(b).digest('hex'),summary=[];
const visuals={
 '01-gazelle':'Tan and white coat with dark continuous flank band; two complete ringed horns and two separate ears; natural short tail; four complete slender lower legs and cloven hooves. The two far upper attachments remain partly occluded. No gore effector has been authored.',
 '02-gaur':'Dark muscular bovine with white stockings on all four legs, pale grey forehead, two horns, two ears, complete tufted tail and four hoof endpoints. Shoulder ridge is exaggerated and bison-like; retain species-art hold. No horn attack has been authored.',
 '03-dog':'Medium tan/black/cream dog with black nose, two erect ears, complete high plumed tail, four separated lower limbs and four paws. Fur obscures proximal attachment boundaries. Tongue is pink and should stay attached to jaw ownership after conservative keying.',
 '04-cat':'Brown striped tabby with two upright triangular ears, short muzzle, visible slit pupil and whiskers, long complete tail and four pale paws. Far upper limb roots remain body-occluded; no all-visible anatomy claim.'
};
for(const row of rows){
 const bytes=fs.readFileSync(row.master),hash=sha(bytes),species=JSON.parse(fs.readFileSync(row.packet+'/subject-source.json')).species,notes=visuals[row.id]+' '+observations[row.id].notes;
 const pattern=assessPatternObservation(species,bytes,{name:row.name,masterSha256:hash,status:'PRESENT',features:patternRequirements(species).map(requirement=>({requirement,status:'PRESENT',observed:notes}))});
 const review={schema:'cf.c132-reference-visual-review/v1',name:row.name,masterSha256:hash,method:'Full original visual inspection of the exact candidate-02 painting',observation:notes,framing:framing.find(r=>r.id===row.id).framing,status:'CANDIDATE_UNMEASURED',scope:'Manual authoring reference only; no intake/static/native/default-pool/Dakk acceptance.'};
 fs.writeFileSync(row.packet+'/visual-review.json',JSON.stringify(review,null,2)+'\n',{flag:'wx'});fs.writeFileSync(row.packet+'/pattern-check.json',JSON.stringify(pattern,null,2)+'\n',{flag:'wx'});summary.push({name:row.name,pattern:pattern.status,framing:review.framing.status,admission:review.status});
}
fs.writeFileSync(base+'/review-summary.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});console.log(summary);
