/** Offline explicit review admission. Never infer absence from a failed fit or reference. */
import fs from 'node:fs';
import {admitReviewedRepresentation} from './reviewed-representation.mjs';
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
  if(review?.schema==='cf.canonical-external-pinnae/v1')return admitCanonicalPinnae({masterBytes,subjectBytes,promptBytes,review});
  if(review?.schema==='cf.canonical-family-anatomy/v1')return admitCanonicalFamily({masterBytes,subjectBytes,promptBytes,review});
  if(review?.schema==='cf.reviewed-adult-mayfly-mouthparts/v1')return admitAdultMayflyMouthparts({masterBytes,subjectBytes,promptBytes,review});
  if(review?.schema==='cf.reviewed-source-representation/v1')return admitReviewedRepresentation({masterBytes,subjectBytes,promptBytes,review});
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
// Biological group facts are resolved against the independent pinned registry,
// never borrowed from a reference's missing paint. Other optional anatomy stays required.
const PINNAE_PROFILES=Object.freeze([...ELIGIBLE_PROFILES,'tortoise','freshwater-turtle','sea-turtle','platypus']);
export function canonicalSprawlerReview({masterBytes,subjectBytes,promptBytes}){
 const subject=JSON.parse(subjectBytes),profile=earthFaunaProfile(subject.name);
 const earlessPinniped=profile?.id==='pinniped'&&['Seal','Walrus'].includes(subject.name);
 if(subject.family!=='quadruped'||!profile||!PINNAE_PROFILES.includes(profile.id)&&!earlessPinniped)return null;
 const canonical=JSON.parse(fs.readFileSync(new URL('../../reference/fauna.json',import.meta.url))).filter(s=>s.name===subject.name);
 if(canonical.length!==1||JSON.stringify(subject.species)!==JSON.stringify(canonical[0])||JSON.stringify(subject.profile)!==JSON.stringify(profile))return null;
 return {schema:'cf.canonical-external-pinnae/v1',name:subject.name,family:'quadruped',masterSha256:sha(masterBytes),subjectSha256:sha(subjectBytes),promptSha256:sha(promptBytes),profileId:profile.id,profileSha256:sha(JSON.stringify(profile)),fact:'external-pinnae-absent',scope:'canonical-group-fact-no-painted-limb-or-motion-exemption'};
}
// These biological facts concern the named adult group, never a missing patch
// of paint. The four ape names also own the existing tailless source requests.
const TAILLESS_APES=Object.freeze(['Gorilla','Chimpanzee','Orangutan','Gibbon']);
export function canonicalFamilyReview({masterBytes,subjectBytes,promptBytes}){
 const subject=JSON.parse(subjectBytes),profile=earthFaunaProfile(subject.name);
 const stingless=subject.family==='arachnid'&&profile?.id==='other-arachnid';
 // This group's lack of a scorpion sting is stage-independent. Adult-only frog/ape/insect rules keep their original stage guard.
 if(!profile||!stingless&&(subject.lifeStage&&subject.lifeStage!=='adult'||!/\badult\b/i.test(String(promptBytes))))return null;
 const canonical=JSON.parse(fs.readFileSync(new URL('../../reference/fauna.json',import.meta.url))).filter(s=>s.name===subject.name);
 if(canonical.length!==1||JSON.stringify(subject.species)!==JSON.stringify(canonical[0])||JSON.stringify(subject.profile)!==JSON.stringify(profile))return null;
 let absentGroups,fact;
 if(subject.family==='hopper'&&profile.id==='frog'&&JSON.stringify(profile.candidateTemplates)==='["hopper"]'){
  absentGroups=['tail','external-ears'];fact='adult-frog-tail-and-external-pinnae-absent';
 }else if(subject.family==='primate'&&profile.id==='primate'&&TAILLESS_APES.includes(subject.name)&&JSON.stringify(profile.candidateTemplates)==='["primate"]'){
  absentGroups=['tail'];fact='ape-tail-absent';
 }else if(subject.family==='arachnid'&&profile.id==='other-arachnid'&&profile.notes.includes('no scorpion tail assigned')&&JSON.stringify(profile.candidateTemplates)==='["arachnid"]'){
  absentGroups=['sting'];fact='non-scorpion-arachnid-sting-absent';
 }else if(subject.family==='insect'&&profile.id==='springtail'&&subject.name==='Springtail'&&/\bwingless\b/i.test(subject.species.note)&&JSON.stringify(profile.candidateTemplates)==='["insect"]'){
  absentGroups=['wings'];fact='springtail-wings-absent';
 }else return null;
 return {schema:'cf.canonical-family-anatomy/v1',name:subject.name,family:subject.family,masterSha256:sha(masterBytes),subjectSha256:sha(subjectBytes),promptSha256:sha(promptBytes),profileId:profile.id,profileSha256:sha(JSON.stringify(profile)),lifeStage:stingless?'stage-independent':'adult',fact,absentGroups,scope:'canonical-group-fact-no-painted-limb-or-motion-exemption'};
}
function admitCanonicalFamily(input){
 const expected=canonicalFamilyReview(input);
 need(expected&&JSON.stringify(Object.keys(input.review).sort())===JSON.stringify(Object.keys(expected).sort()),'supported canonical family and exact fields');
 for(const[key,value]of Object.entries(expected))need(JSON.stringify(input.review[key])===JSON.stringify(value),'canonical family fact '+key);
 const presence={schema:'cf.anatomy-presence/v2',absent:[...expected.absentGroups],hidden:[],folded:[]};
 resolveAnatomyInventory(familyContract(expected.family),presence);return Object.freeze({...presence,absent:Object.freeze(presence.absent),hidden:Object.freeze([]),folded:Object.freeze([])});
}
function admitCanonicalPinnae(input){
 const expected=canonicalSprawlerReview(input);
 need(expected&&JSON.stringify(Object.keys(input.review).sort())===JSON.stringify(Object.keys(expected).sort()),'supported canonical pinna group and exact fields');
 for(const [key,value]of Object.entries(expected))need(input.review[key]===value,'canonical pinna fact '+key);
 const presence={schema:'cf.anatomy-presence/v2',absent:['external-ears'],hidden:[],folded:[]};
 resolveAnatomyInventory(familyContract('quadruped'),presence);return Object.freeze({...presence,absent:Object.freeze(presence.absent),hidden:Object.freeze([]),folded:Object.freeze([])});
}


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

/** Adult Mayfly only: no functional chewing actuator. This is an exact-source
 * visual declaration, not absence inferred from a failed transfer. Naiads and
 * other insects (including other soft-mouth profiles) are deliberately excluded.
 * Biological basis: https://entomology.mgcafe.uky.edu/node/1619 . */
function admitAdultMayflyMouthparts({masterBytes,subjectBytes,promptBytes,review}){
 for(const [key,bytes]of [['master',masterBytes],['subject',subjectBytes],['prompt',promptBytes]])need(review[key+'Sha256']===sha(bytes),'exact '+key+' hash');
 const subject=JSON.parse(subjectBytes),canonical=JSON.parse(fs.readFileSync(new URL('../../reference/fauna.json',import.meta.url))).filter(s=>s.name==='Mayfly'),profile=earthFaunaProfile('Mayfly');
 need(review.name==='Mayfly'&&subject.name==='Mayfly'&&canonical.length===1&&JSON.stringify(subject.species)===JSON.stringify(canonical[0]),'canonical Mayfly only');
 need(review.family==='insect'&&subject.family==='insect'&&JSON.stringify(subject.profile)===JSON.stringify(profile),'unchanged canonical insect profile');
 need(review.scope==='exact-master-only-no-visual-admission','bounded mouthpart review');
 need(review.context?.lifeStage==='adult'&&review.context.pose==='winged-side-right','adult winged source required');
 need(['Codex','Claude','Dakk','TheDakk'].includes(review.review?.reviewer)&&review.review.method==='Full-original visual inspection'&&nonblank(review.review.observation),'explicit visual review');
 need([1,2,3,4].includes(review.review.observedWingSurfaces)&&review.review.visibleChewingJaws===false,'positive winged-stage and mouthpart observation');
 need(JSON.stringify(review.absent)==='["mandible"]','only the chewing mandible actuator');
 const presence={schema:'cf.anatomy-presence/v2',absent:['mandible'],hidden:[],folded:[]},before=familyContract('insect'),after=resolveAnatomyInventory(before,presence);
 need(JSON.stringify(before.joints.filter(j=>!after.joints.includes(j)))==='["mandible"]','only mandible removed');
 return Object.freeze({...presence,absent:Object.freeze(presence.absent),hidden:Object.freeze(presence.hidden),folded:Object.freeze(presence.folded)});
}
