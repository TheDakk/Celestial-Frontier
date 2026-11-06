import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import{reviewedExclusions}from'../../port/v2/tools/anatomy-verify/reviewed-exclusions.mjs';
import{earthFaunaProfile}from'../../port/v2/apps/game/src/earth-fauna-profiles.ts';
const base='audits/C163_REFERENCE_REPAIR_20261002',source='audits/G2_C136_REPAIRS_20261002',sha=b=>createHash('sha256').update(b).digest('hex');
const observations={
 '01-giant-salamander':'Full original: broad flat head, wrinkled smooth skin, wide tail and four short sprawling limbs. No projecting external pinnae. The original retains its existing framing refusal and contact-height differences; no limb-count or contact admission is inferred.',
 '02-alpine-salamander':'Full original: black smooth skin, rounded head, continuous tapering tail and short bent limbs. No external pinnae. Perspective separates the far and near foot heights, so the existing single-contact author refusal remains independent of this review.',
 '04-blind-salamander':'Full original: pale smooth skin, long tail fin and branching external gills behind the flattened head. The gills are natural head/neck paint, not ears, and are not removed. Four slender limbs are visible at different heights; ground contact and toe interpretation remain held.',
 '05-axolotl':'Full original: pale spotted smooth skin, broad continuous tail fin, frilled external gills and short limbs. The branched gills stay painted; no external mammalian-style pinnae are present. Eye and gill proportions, toes and ground contacts remain separate anatomy/authoring holds.',
};
fs.mkdirSync(base+'/presence',{recursive:true});const manifest=[],controls=[];
for(const[id,observation]of Object.entries(observations)){
 const packet=source+'/'+id,subjectBytes=fs.readFileSync(packet+'/subject-source.json'),subject=JSON.parse(subjectBytes),profile=earthFaunaProfile(subject.name);
 assert.equal(profile.id,'salamander');
 const review={schema:'cf.reviewed-external-ear-absence/v1',name:subject.name,family:subject.family,masterSha256:sha(fs.readFileSync(packet+'/master.png')),subjectSha256:sha(subjectBytes),promptSha256:sha(fs.readFileSync(packet+'/prompt.txt')),profileId:profile.id,profileSha256:sha(JSON.stringify(profile)),context:{lifeStage:'adult',caste:'not-applicable',pose:'grounded-sprawl-side-right'},review:{reviewer:'OpenAI/Codex',method:'Full-original visual inspection',observation,decisions:[{group:'external-ears',decision:'ABSENT',anatomicalMeaning:'external-pinnae-only',paintingObservation:'No paired projecting mammalian pinnae are depicted. External gills, ear openings and all other actual head/neck paint remain present and are not excluded.'}]},scope:'exact-master-only-no-visual-admission'};
 const admitted=reviewedExclusions({packetDir:packet,review,family:subject.family});assert.deepEqual(admitted.excludedJoints,['earFarRoot','earFarTip','earNearRoot','earNearTip']);
 for(const[key,value]of [['masterSha256','0'.repeat(64)],['promptSha256','0'.repeat(64)],['name','Wolf']]){const r=reviewedExclusions({packetDir:packet,review:{...review,[key]:value},family:subject.family});assert.equal(r.excludedJoints,null);controls.push({id,mutation:key,status:'REFUSED',reason:r.refused});}
 const file=base+'/presence/'+id+'.json';fs.writeFileSync(file,JSON.stringify(review,null,2)+'\n',{flag:'wx'});manifest.push({id,review:file});controls.push({id,positive:'four pinna joints only',status:'PASS'});
}
fs.writeFileSync(base+'/reviewed-presence.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(base+'/presence-controls.json',JSON.stringify({schema:'cf.c163-presence-controls/v1',controls,held:[{id:'03-olm',reason:'The S-curved swimming-like source exposes only two clear limbs and does not establish the policy-required grounded sprawl context. No ear review is fabricated to bypass that context; source painting and author refusal stay unchanged.'}],qualityAccepted:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exactMasterReviews:manifest.length,controls:controls.length,held:'03-olm'}));
