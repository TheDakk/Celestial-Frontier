/** Offline explicit review admission. Never infer absence from a failed fit or reference. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {familyContract} from '../creature-animation/family-contracts.mjs';
import {resolveAnatomyInventory} from '../creature-animation/anatomy-inventory.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (ok, message) => { if (!ok) throw Error('Reviewed presence: '+message); };
const nonblank = value => typeof value === 'string' && value.trim().length > 0;

/** v1 admits only reviewed external-tail absence on canonical tailless quadrupeds.
 * Hidden/folded anatomy and caste-dependent wing absence need separate review policies.
 * Returned presence must feed a NEW automatic author/intake, never patch a sealed record.
 */
export function admitReviewedPresence({masterBytes, subjectBytes, promptBytes, review}) {
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
