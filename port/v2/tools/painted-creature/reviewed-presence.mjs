/** Offline explicit review admission. Never infer absence from a failed fit or reference. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {rolldown} from 'rolldown';
import {fileURLToPath} from 'node:url';
import {familyContract} from '../creature-animation/family-contracts.mjs';
import {resolveAnatomyInventory} from '../creature-animation/anatomy-inventory.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (ok, message) => { if (!ok) throw Error('Reviewed presence: '+message); };
const nonblank = value => typeof value === 'string' && value.trim().length > 0;

/** The v1 tail schema remains restricted to canonical tailless quadrupeds.
 * The distinct ear schema admits exact-master reviewed absence of external pinnae
 * on independently checked reptile/salamander profiles, never missing ear paint.
 * Hidden/folded anatomy and caste-dependent wing absence need separate review policies.
 * Returned presence must feed a NEW automatic author/intake, never patch a sealed record.
 */
export function admitReviewedPresence({masterBytes, subjectBytes, promptBytes, review}) {
  if(review?.schema==='cf.reviewed-external-ear-absence/v1')return admitReviewedExternalEarAbsence({masterBytes,subjectBytes,promptBytes,review});
  need(review?.schema === 'cf.reviewed-optional-absence/v1', 'explicit review schema');
  need(review.masterSha256 === sha(masterBytes), 'exact master hash');
  need(review.subjectSha256 === sha(subjectBytes), 'exact subject hash');
  need(review.promptSha256 === sha(promptBytes), 'exact prompt hash');
  const subject = JSON.parse(subjectBytes);
  const canonical = JSON.parse(fs.readFileSync(new URL('../../reference/fauna.json', import.meta.url)));
  const species = canonical.filter(row => row.name === review.name);
  need(species.length === 1 && subject.name === review.name, 'canonical named subject');
  need(JSON.stringify(subject.species) === JSON.stringify(species[0]), 'unchanged canonical species');
  need(review.family === 'quadruped' && subject.family === review.family && species[0].posture === 'quadruped', 'supported family');
  need(review.context?.lifeStage === 'adult' && review.context.caste === 'not-applicable' && review.context.pose === 'standing-stride-side-right', 'reviewed adult stride context');
  need(nonblank(review.review?.reviewer) && review.review.method === 'Full-original visual inspection' && nonblank(review.review.observation), 'explicit visual review');
  const decisions = review.review.decisions;
  need(Array.isArray(decisions) && decisions.length === 1, 'one explicit absence decision');
  const decision = decisions[0];
  need(decision.group === 'tail' && decision.decision === 'ABSENT' && nonblank(decision.paintingObservation), 'reviewed optional tail only');
  need(species[0].mustRead.includes(decision.canonicalFeature) && /\btailless\b/i.test(decision.canonicalFeature), 'independent canonical tailless evidence');
  const presence = {schema:'cf.anatomy-presence/v2', absent:['tail'], hidden:[], folded:[]};
  resolveAnatomyInventory(familyContract(review.family), presence);
  return Object.freeze({...presence, absent:Object.freeze(presence.absent), hidden:Object.freeze(presence.hidden), folded:Object.freeze(presence.folded)});
}

// Bundle the existing TS registry once so this Node tool retains its Node 20+ support.
// Never trust the target subject's asserted profile as biological eligibility.
const profileBundle=await rolldown({input:fileURLToPath(new URL('../../apps/game/src/earth-fauna-profiles.ts',import.meta.url)),platform:'node'});
let earthFaunaProfile;
try{
 const {output}=await profileBundle.generate({format:'es'});
 if(output.length!==1||output[0].type!=='chunk')throw Error('Reviewed presence: single independent profile module required');
 ({earthFaunaProfile}=await import('data:text/javascript;base64,'+Buffer.from(output[0].code).toString('base64')));
}finally{await profileBundle.close();}
const ELIGIBLE_PROFILES=Object.freeze(['lizard','special-lizard','marine-iguana','crocodilian','salamander']);

function admitReviewedExternalEarAbsence({masterBytes,subjectBytes,promptBytes,review}){
 need(review?.schema==='cf.reviewed-external-ear-absence/v1','explicit ear-absence schema');
 need(review.masterSha256===sha(masterBytes),'exact master hash');
 need(review.subjectSha256===sha(subjectBytes),'exact subject hash');
 need(review.promptSha256===sha(promptBytes),'exact prompt hash');
 const subject=JSON.parse(subjectBytes),canonical=JSON.parse(fs.readFileSync(new URL('../../reference/fauna.json',import.meta.url)));
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
