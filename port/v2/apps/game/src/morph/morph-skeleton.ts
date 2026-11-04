// The morph system, step 3 (MORPH_SYSTEM_DESIGN.md M1): proportion → per-joint uniform scales for the pose program.
// Only NON-CONTACT sub-trees scale (head, tail, ears, antennae); legs and every contact chain are untouched, so the
// family contact solver's plants stay exact. A sub-tree root is a joint of the group whose parent is not in the group.
import type { BodyCard } from '../motion/body-card.js';
import type { MorphParamsV1 } from './morph-params.js';
export const MORPH_GROUPS = Object.freeze({ head: 'head', tail: 'tail', ears: 'ears', antennae: 'antennae' } as const);
export function jointScalesV1(card: Pick<BodyCard, 'parts'>, params: MorphParamsV1): Readonly<Record<string, number>> {
  const out: Record<string, number> = {};
  if (params.identity) return Object.freeze(out);
  const groupOf = new Map(card.parts.map((p) => [p.joint, p.group] as const));
  for (const [key, group] of Object.entries(MORPH_GROUPS) as Array<[keyof typeof MORPH_GROUPS, string]>) {
    const s = params.proportion[key]; if (s === 1) continue;
    for (const p of card.parts) if (p.group === group && groupOf.get(p.parent) !== group) out[p.joint] = s;
  }
  return Object.freeze(out);
}
