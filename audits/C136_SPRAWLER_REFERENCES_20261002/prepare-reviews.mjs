import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ELIGIBLE_PROFILES,admitReviewedExternalEarAbsence} from './ear-absence-policy.mjs';
const base='audits/C136_SPRAWLER_REFERENCES_20261002',source='audits/G2_C132_QUADRUPEDS_20261001',sha=b=>createHash('sha256').update(b).digest('hex');
const rows=JSON.parse(fs.readFileSync(source+'/pilot.json')),reviews=[];
fs.mkdirSync(base+'/reviews',{recursive:true});
for(const row of rows){
 const masterBytes=fs.readFileSync(row.master),subjectBytes=fs.readFileSync(row.packet+'/subject-source.json'),promptBytes=fs.readFileSync(row.packet+'/prompt.txt'),subject=JSON.parse(subjectBytes),visualBytes=fs.readFileSync(row.packet+'/visual-review.json'),visual=JSON.parse(visualBytes);
 if(!ELIGIBLE_PROFILES.includes(subject.profile.id)||visual.masterSha256!==sha(masterBytes)||visual.method!=='Full original visual inspection by Codex')throw Error('Source full-original review and independent eligible class required');
 const review={schema:'cf.reviewed-external-ear-absence/v1',name:row.name,family:row.family,masterSha256:sha(masterBytes),subjectSha256:sha(subjectBytes),promptSha256:sha(promptBytes),profileId:subject.profile.id,profileSha256:sha(JSON.stringify(subject.profile)),context:{lifeStage:'adult',caste:'not-applicable',pose:'grounded-sprawl-side-right'},review:{reviewer:'OpenAI/Codex',method:'Full-original visual inspection',observation:visual.observation,decisions:[{group:'external-ears',decision:'ABSENT',anatomicalMeaning:'external-pinnae-only',paintingObservation:'No paired projecting mammalian pinnae are depicted. Any ear opening, tympanum, protective ear flap, casque, horn, neck frill or external gill remains natural head/neck paint; none is a substitute pinna.'}]},priorFullOriginalReview:{path:row.packet+'/visual-review.json',sha256:sha(visualBytes)},scope:'exact-master-only-no-visual-admission',policyStatus:'AUDIT_ONLY_CANDIDATE: production reviewed-presence.mjs still admits tail absence only.'};
 admitReviewedExternalEarAbsence({masterBytes,subjectBytes,promptBytes,review});
 const path=base+'/reviews/'+row.id+'.json';fs.writeFileSync(path,JSON.stringify(review,null,2)+'\n',{flag:'wx'});reviews.push({id:row.id,review:path});
}
fs.writeFileSync(base+'/reviewed-presence.json',JSON.stringify(reviews,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exactMasterReviews:reviews.length,productionAdmission:false}));
