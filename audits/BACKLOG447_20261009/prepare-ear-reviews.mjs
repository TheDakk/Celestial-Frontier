import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {admitReviewedPresence} from '../../port/v2/tools/painted-creature/reviewed-presence.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),base='audits/BACKLOG447_20261009';
const observations={
'c196quadrupedoriginals-01-caiman':'Four splayed legs, long armored tail and low skull. The cheek/eye silhouette has scales and an ear opening region, no protruding mammalian pinna.',
'c196quadrupedoriginals-06-mountain-lizard':'Four bent sprawling legs and long tapered tail. Circular opening behind eye is flush with the scaly head, not an external ear flap.',
'c196quadrupedoriginals-09-agama':'Four sprawling legs, orange throat and dorsal crest. Dark oval auditory opening behind eye is flush; neck spines are not pinnae.',
'c196quadrupedoriginals-10-gila-monster':'Four bent legs, thick beaded tail and blunt low head. Beaded head silhouette shows no protruding pinnae.',
'g2c132quadrupeds-02-crocodile':'Four splayed legs, long flattened skull and armored tail. Dorsal scutes and orbital ridges are visible; external pinnae are absent. Tail/framing concerns are not waived.',
'g2c132quadrupeds-19-gila-monster':'Four sprawling legs and thick tapered tail on a small centered beaded body. Flat round head has no external ear flaps.',
'g2c132quadrupeds-21-chameleon':'Four bent grasping limbs, curled tail and tall continuous median casque. Casque is a head crest, not bilateral pinnae. Tail coil and other geometry remain separately checked.',
'g2c163familyoriginals-02-salamander':'Four splayed limbs, continuous long tail and smooth rounded head. Rounded bulging eye and cheek have no protruding external ear flaps.'};
const pilot=JSON.parse(fs.readFileSync('audits/G1_AUTO_AUTHOR_20260926/pilots/sweep2.json'));fs.mkdirSync(base+'/ear-reviews',{recursive:true});const index=[],controls=[];
for(const [id,observation]of Object.entries(observations)){
 const p=pilot.find(p=>p.id===id);if(!p)throw Error(id);const read=n=>fs.readFileSync(path.join(p.packet,n));
 const subjectBytes=read('subject-source.json'),masterBytes=read('master.png'),promptBytes=read('prompt.txt'),s=JSON.parse(subjectBytes);
 const review={schema:'cf.reviewed-external-ear-absence/v1',name:s.name,family:s.family,masterSha256:sha(masterBytes),subjectSha256:sha(subjectBytes),promptSha256:sha(promptBytes),profileId:s.profile.id,profileSha256:sha(JSON.stringify(s.profile)),context:{lifeStage:'adult',caste:'not-applicable',pose:'grounded-sprawl-side-right'},scope:'exact-master-only-no-visual-admission',review:{reviewer:'Codex',method:'Full-original visual inspection',observation,decisions:[{group:'external-ears',decision:'ABSENT',anatomicalMeaning:'external-pinnae-only',paintingObservation:observation}]}};
 const input={masterBytes,subjectBytes,promptBytes,review};const admitted=admitReviewedPresence(input);if(JSON.stringify(admitted.absent)!=='["external-ears"]')throw Error('inventory');
 const file=base+'/ear-reviews/'+id+'.json';fs.writeFileSync(file,JSON.stringify(review,null,2)+'\n');index.push({id,review:file});
 for(const [name,mutate]of [['changed-master',i=>i.masterBytes=Buffer.concat([i.masterBytes,Buffer.from('x')])],['near-ear-only',i=>i.review.review.decisions[0].group='earNearTip'],['unknown-profile',i=>i.review.profileId='small-rodent'],['unreviewed',i=>i.review.review.observation='']]){
  const i={masterBytes,subjectBytes,promptBytes,review:structuredClone(review)};mutate(i);let rejected=false;try{admitReviewedPresence(i);}catch{rejected=true;}if(!rejected)throw Error(name+' admitted');controls.push({id,control:name,status:'PASS_REJECTED'});
 }
 controls.push({id,control:'exact-positive',status:'PASS'});
}
fs.writeFileSync(base+'/ear-review-index.json',JSON.stringify(index,null,2)+'\n');fs.writeFileSync(base+'/ear-review-controls.json',JSON.stringify(controls,null,2)+'\n');console.log(index.length+' exact-source reviews; '+controls.length+' controls PASS');
