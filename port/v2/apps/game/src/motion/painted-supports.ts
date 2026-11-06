/** Source-bound painted contact supports on the compiled BodyCard (Claude, C70 → C71, 2026-09-27).
 * The runtime parts rig of a fit declared `contactSupports: 'observed'` publishes against the painted support vertices
 * (`observedContactSupports(record, binding)`), but canonical motion authors that probe contact from the card alone only saw the
 * anatomical endpoints. So an authored curve could fit the endpoints and still exceed the unchanged runtime guard at the painted foot
 * (Codex C70: Goose hit .021845883 + .003815768 > .025393703). This attaches the SAME supports the runtime uses, bound to the exact
 * record recipe and binding identity, so an author can test its whole curve against what publication will check. It changes no
 * landmark, weight, limit or guard; consumers stay responsible for their own refusal paths. */
import type { BodyCard } from './body-card.js';
import type { CreatureRigRecordV1, CreaturePartsBindingV1 } from '../creature-rig-types.js';
import { observedContactSupports } from '../creature-rig-contact.js';

/** Returns a new frozen card carrying `paintedContactSupports`. Throws on any identity disagreement: the card, record and binding must
 * describe the same recipe. Mixed per-vertex skin weights are preserved exactly (the object is the one the runtime computes). */
export function withPaintedContactSupports(card: BodyCard, record: CreatureRigRecordV1, binding: CreaturePartsBindingV1): BodyCard {
  if (!card.recipeHash) throw new Error('Painted supports: the card has no recipe hash');
  if (record.recipeHash !== card.recipeHash) throw new Error('Painted supports: record recipe disagrees with the card');
  if (binding.recordRecipeHash !== card.recipeHash) throw new Error('Painted supports: binding recipe disagrees with the card');
  if (typeof binding.bindingHash !== 'string' || !binding.bindingHash) throw new Error('Painted supports: binding identity missing');
  const supports = observedContactSupports(record, binding);
  return Object.freeze({ ...card, paintedContactSupports: Object.freeze({ recipeHash: card.recipeHash, bindingHash: binding.bindingHash, supports }) });
}
