/** Reviewed exclusions for the G1 automatic author (Claude 2026-10-02): an ADMITTED reviewed presence (Codex's
 * `admitReviewedPresence`, bound to the exact master/subject/prompt hashes) → the contract joints its admitted inventory removes.
 * The author then neither authors those joints nor runs the missing-anatomy COVERAGE check on them; every other check is unchanged.
 * Never infers absence: no review, or a review whose admission throws, yields NO exclusion (`excludedJoints: null`), so the author
 * runs exactly as it does without a review. The joint set comes only from the family contract minus the admitted inventory. */
import fs from 'node:fs';
import path from 'node:path';
import {admitReviewedPresence} from '../painted-creature/reviewed-presence.mjs';
import {familyContract} from '../creature-animation/family-contracts.mjs';
import {resolveAnatomyInventory} from '../creature-animation/anatomy-inventory.mjs';

/** `packetDir` holds master.png, subject-source.json and prompt.txt; `family` is the family the author will run.
 * Returns {admitted, excludedJoints: string[] (sorted), refused: null} or {admitted: null, excludedJoints: null, refused: message}. */
export function reviewedExclusions({packetDir, review, family}) {
  try {
    const admitted = admitReviewedPresence({ masterBytes: fs.readFileSync(path.join(packetDir, 'master.png')), subjectBytes: fs.readFileSync(path.join(packetDir, 'subject-source.json')), promptBytes: fs.readFileSync(path.join(packetDir, 'prompt.txt')), review });
    const contract = familyContract(family), allowed = new Set(resolveAnatomyInventory(contract, admitted).joints);
    const excludedJoints = contract.joints.filter((j) => !allowed.has(j)).sort();
    if (!excludedJoints.length) throw Error('Reviewed exclusions: the admitted presence removes no joint of family ' + family);
    return { admitted, excludedJoints, refused: null };
  } catch (e) { return { admitted: null, excludedJoints: null, refused: String(e?.message ?? e).slice(0, 160) }; }
}
