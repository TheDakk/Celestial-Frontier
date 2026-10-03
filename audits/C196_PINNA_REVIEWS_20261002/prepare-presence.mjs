import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import{reviewedExclusions}from'../../port/v2/tools/anatomy-verify/reviewed-exclusions.mjs';
import{earthFaunaProfile}from'../../port/v2/apps/game/src/earth-fauna-profiles.ts';
const base='audits/C196_PINNA_REVIEWS_20261002',source='audits/C196_QUADRUPED_ORIGINALS_20261002',sha=b=>createHash('sha256').update(b).digest('hex');
const observations={
 '12-chameleon':'Full original: green scaled casque and a continuous tooth-edged dorsal crest, independently rotating eye, curled tail and four limb endpoints. No mammalian external pinnae are painted. The casque and jaw fringes remain head tissue. Feet are not reliably natural grasping digit groups and retain their source-anatomy hold; far proximal limb overlap and contact heights remain independent holds.',
 '13-marine-iguana':'Full original: dark pebbled scales, blunt head, row of dorsal spines, broad flattened tail and four clawed limb endpoints. No projecting external pinnae are painted. Actual tympanic area, neck folds and dorsal spines stay present. Tail tip shape and unequal foot heights remain explicit source-anatomy/contact holds.'
};
fs.mkdirSync(base+'/presence',{recursive:true});const manifest=[],controls=[];
for(const[id,observation]of Object.entries(observations)){
 const packet=source+'/'+id,subjectBytes=fs.readFileSync(packet+'/subject-source.json'),subject=JSON.parse(subjectBytes),profile=earthFaunaProfile(subject.name);
 assert(['special-lizard','marine-iguana'].includes(profile.id));
 const review={schema:'cf.reviewed-external-ear-absence/v1',name:subject.name,family:subject.family,masterSha256:sha(fs.readFileSync(packet+'/master.png')),subjectSha256:sha(subjectBytes),promptSha256:sha(fs.readFileSync(packet+'/prompt.txt')),profileId:profile.id,profileSha256:sha(JSON.stringify(profile)),context:{lifeStage:'adult',caste:'not-applicable',pose:'grounded-sprawl-side-right'},review:{reviewer:'OpenAI/Codex',method:'Full-original visual inspection',observation,decisions:[{group:'external-ears',decision:'ABSENT',anatomicalMeaning:'external-pinnae-only',paintingObservation:'No paired projecting mammalian pinnae are depicted. External gills, ear openings and all other actual head/neck paint remain present and are not excluded.'}]},scope:'exact-master-only-no-visual-admission'};
 const admitted=reviewedExclusions({packetDir:packet,review,family:subject.family});assert.deepEqual(admitted.excludedJoints,['earFarRoot','earFarTip','earNearRoot','earNearTip']);
 for(const[key,value]of [['masterSha256','0'.repeat(64)],['promptSha256','0'.repeat(64)],['name','Wolf']]){const r=reviewedExclusions({packetDir:packet,review:{...review,[key]:value},family:subject.family});assert.equal(r.excludedJoints,null);controls.push({id,mutation:key,status:'REFUSED',reason:r.refused});}
 const file=base+'/presence/'+id+'.json';fs.writeFileSync(file,JSON.stringify(review,null,2)+'\n',{flag:'wx'});manifest.push({id,review:file});controls.push({id,positive:'four pinna joints only',status:'PASS'});
}
fs.writeFileSync(base+'/reviewed-presence.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(base+'/presence-controls.json',JSON.stringify({schema:'cf.c196-presence-controls/v1',controls,qualityAccepted:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exactMasterReviews:manifest.length,controls:controls.length}));
