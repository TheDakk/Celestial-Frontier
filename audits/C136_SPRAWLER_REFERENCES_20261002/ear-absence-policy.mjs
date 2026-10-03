/** AUDIT-ONLY proposed extension; the production tail-only policy is unchanged.
 * Biology class eligibility never implies painting admission or blanket absence.
 * Every review is explicitly bound to one master, canonical subject and prompt.
 */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {earthFaunaProfile} from '../../port/v2/apps/game/src/earth-fauna-profiles.ts';
import {familyContract} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
import {resolveAnatomyInventory} from '../../port/v2/tools/creature-animation/anatomy-inventory.mjs';
export const ELIGIBLE_PROFILES=Object.freeze(['lizard','special-lizard','marine-iguana','crocodilian','salamander']);
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,message)=>{if(!ok)throw Error('Reviewed external ears: '+message);};
const nonblank=value=>typeof value==='string'&&value.trim().length>0;
export function admitReviewedExternalEarAbsence({masterBytes,subjectBytes,promptBytes,review}){
 need(review?.schema==='cf.reviewed-external-ear-absence/v1','explicit ear-absence schema');
 need(review.masterSha256===sha(masterBytes),'exact master hash');
 need(review.subjectSha256===sha(subjectBytes),'exact subject hash');
 need(review.promptSha256===sha(promptBytes),'exact prompt hash');
 const subject=JSON.parse(subjectBytes),canonical=JSON.parse(fs.readFileSync(new URL('../../port/v2/reference/fauna.json',import.meta.url)));
 const species=canonical.filter(r=>r.name===review.name),profile=earthFaunaProfile(review.name);
 need(species.length===1&&subject.name===review.name,'canonical named subject');
 need(JSON.stringify(subject.species)===JSON.stringify(species[0]),'unchanged canonical species');
 need(profile&&ELIGIBLE_PROFILES.includes(profile.id),'independent reviewed biological class');
 need(JSON.stringify(subject.profile)===JSON.stringify(profile)&&review.profileId===profile.id&&review.profileSha256===sha(JSON.stringify(profile)),'exact pinned Earth profile');
 need(review.family==='quadruped'&&subject.family===review.family&&profile.candidateTemplates.includes('quadruped'),'supported quadruped route');
 need(review.context?.lifeStage==='adult'&&review.context.caste==='not-applicable'&&review.context.pose==='grounded-sprawl-side-right','reviewed adult sprawl context');
 need(nonblank(review.review?.reviewer)&&review.review.method==='Full-original visual inspection'&&nonblank(review.review.observation),'explicit visual review');
 const d=review.review.decisions;
 need(Array.isArray(d)&&d.length===1,'one explicit absence decision');
 need(d[0].group==='external-ears'&&d[0].decision==='ABSENT'&&d[0].anatomicalMeaning==='external-pinnae-only'&&nonblank(d[0].paintingObservation),'reviewed external pinnae only');
 need(review.scope==='exact-master-only-no-visual-admission','bounded review scope');
 const presence={schema:'cf.anatomy-presence/v2',absent:['external-ears'],hidden:[],folded:[]};
 const before=familyContract(review.family),after=resolveAnatomyInventory(before,presence),removed=before.joints.filter(j=>!after.joints.includes(j)).sort();
 need(JSON.stringify(removed)===JSON.stringify(['earFarRoot','earFarTip','earNearRoot','earNearTip']),'only four optional pinna joints removed');
 return Object.freeze({...presence,absent:Object.freeze(presence.absent),hidden:Object.freeze(presence.hidden),folded:Object.freeze(presence.folded)});
}
