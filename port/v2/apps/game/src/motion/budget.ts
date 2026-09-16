/* Motion Kit §8 budget guard. Structural: parts, bones, atlas and effect
 * limits. Over budget compiles to the reduced variant (secondary parts dropped
 * tip-first, no emitter) and records what was dropped; never a frame drop. */
import type { BodyCard, SecondaryPart } from './body-card.js';

export type DeviceTier = 'desktop' | 'phone';
export const BUDGET = Object.freeze({
  parts: 40, bones: 32, atlas: { desktop: 2048, phone: 1024 }, updateMs: { desktop: 2, phone: 4 },
  effect: { phaseTextures: 3, particles: 200 }, frameRate: { desktop: 60, phone: 30 },
});
export interface EffectLoad { readonly phaseTextures: number; readonly particles: number; }
export interface BudgetInput { readonly tier?: DeviceTier; readonly effect?: EffectLoad; readonly atlasSize?: number; }
export type BudgetResult =
  | { readonly ok: true; readonly parts: number; readonly bones: number; readonly atlas: number }
  | { readonly ok: false; readonly reduced: true; readonly dropped: readonly string[]; readonly card: BodyCard; readonly effect: EffectLoad | null; readonly parts: number; readonly bones: number };

const countParts = (card: BodyCard): number => card.parts.length + 1; // joints incl. root
const countBones = (card: BodyCard): number => card.parts.length;
export function checkBudget(card: BodyCard, input: BudgetInput = {}): BudgetResult {
  const tier = input.tier ?? 'desktop', atlas = BUDGET.atlas[tier];
  const dropped: string[] = [];
  let parts = card.parts, secondaryParts: SecondaryPart[] = [...card.secondaryParts];
  // Drop secondary joints tip-first (ear tips, tail3, tail2, ...) until the rig fits.
  while (parts.length > BUDGET.bones || parts.length + 1 > BUDGET.parts) {
    const victim = secondaryParts.map((s) => ({ s, joint: s.joints[s.joints.length - 1] })).filter((x) => x.joint !== undefined).sort((a, b) => b.s.joints.length - a.s.joints.length)[0];
    if (!victim || victim.joint === undefined) break;
    const joint = victim.joint;
    dropped.push(joint); parts = parts.filter((p) => p.joint !== joint);
    secondaryParts = secondaryParts.map((s) => s === victim.s ? { ...s, joints: s.joints.slice(0, -1), lagOrder: s.lagOrder.slice(0, -1) } : s).filter((s) => s.joints.length > 0);
  }
  let effect: EffectLoad | null = input.effect ?? null;
  if (effect && effect.particles > BUDGET.effect.particles) { dropped.push('emitter'); effect = { ...effect, particles: 0 }; }
  if (effect && effect.phaseTextures > BUDGET.effect.phaseTextures) { dropped.push('phase-textures>' + BUDGET.effect.phaseTextures); effect = { ...effect, phaseTextures: BUDGET.effect.phaseTextures }; }
  if (input.atlasSize !== undefined && input.atlasSize > atlas) dropped.push(`atlas ${input.atlasSize}>${atlas}`);
  if (dropped.length === 0) return { ok: true, parts: countParts(card), bones: countBones(card), atlas };
  const reduced: BodyCard = { ...card, parts, secondaryParts, notes: [...card.notes, 'budget: reduced variant; dropped ' + dropped.join(', ')] };
  return { ok: false, reduced: true, dropped, card: reduced, effect, parts: countParts(reduced), bones: countBones(reduced) };
}
