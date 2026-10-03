/** D31 (Dakk, 2026-10-02, audits/MAILBOX/DECISIONS.md): limbless and sessile families fight with a CAST attack —
 * their ability-theme effect launched from the body, no melee lunge, and a small whole-body pulse as the "attack".
 * This module owns WHICH cards cast (four specialized families with no admitted melee verb), WHERE the effect
 * leaves the body (a declared emitter landmark, else the painted body centre) and the pulse itself.
 *
 * The pulse replaces only the D31 families' own `cast` clip (kit §4 cast: rise, hold, release toward target; kit §5
 * phases rise 180 / hold 120 / release 90 / settle 220, scaled by the mass class through `phaseDurations`). Its
 * amplitudes come from the kit §6 material rule of the body (slick/warty squash 6 %, stretch 4 %, overshoot .15;
 * translucent wobbles twice; rigid materials stop sharply with no stretch). The rig pose has no scale channel, so the
 * squash reads as a gathered body curl (the chord shortens) plus a small root lift on mobile bodies; anchored bodies
 * keep a fixed root. Every value stays inside the template's joint limits (sampled and clamped by the timeline as for
 * every other clip). Directions are chosen from the card's own landmarks (first-order kinematics), never from a
 * species name: the gather lifts the body (or, for an upright anchored body, leans it away from the target) and the
 * release swings it toward the target. Every other family and action returns the authored clip unchanged. */
import { tAt } from './timing.js';
import type { KeyPose, MotionAction } from './actions.js';
import type { BodyCard } from './body-card.js';
import { MATERIAL_RULES, type Material } from './secondary.js';
import { DEG } from './actions.js';
import { specializedTemplate } from '../../../../tools/creature-animation/specialized-templates.mjs';
import { MELEE_ALIAS, templateMelees } from './family-actions.js';

export interface CastAttackFamilyV1 { readonly emitter: string | null; readonly emitterWhy: string; }
/** The D31 families and the landmark their effect leaves from (null = the painted body centre). */
export const CAST_ATTACK_FAMILIES: Readonly<Record<string, CastAttackFamilyV1>> = Object.freeze({
  annelid: Object.freeze({ emitter: null, emitterWhy: 'an annelid declares no mouth landmark: the painted body centre' }),
  'sessile-filter': Object.freeze({ emitter: 'aperture', emitterWhy: 'the declared exhalant aperture (osculum)' }),
  gastropod: Object.freeze({ emitter: 'mouth', emitterWhy: 'the declared mouth' }),
  bivalve: Object.freeze({ emitter: 'siphon', emitterWhy: 'the declared siphon' }),
});
export const CAST_ATTACK_NOTE = 'cast-attack:d31-body-pulse-v1';

export interface CastAttackV1 { readonly family: string; readonly emitter: string | null; readonly reason: string; }
/** The D31 cast for this card, or null (every other family, a portrait, or a card that has an admitted melee verb). */
export function castAttackOf(card: BodyCard | null | undefined): CastAttackV1 | null {
  if (!card) return null;
  const fam = CAST_ATTACK_FAMILIES[card.template.id];
  if (!fam) return null;
  // a D31 family that ever gains an admitted melee verb keeps it: the cast is the answer to "no admitted melee", not an override
  const verbs = templateMelees(card.template.id), alias = MELEE_ALIAS[card.template.id] ?? {};
  if (card.weapons.some((w) => verbs.includes(alias[w] ?? w))) return null;
  const has = fam.emitter !== null && card.parts.some((p) => p.joint === fam.emitter);
  const emitter = has ? fam.emitter : null;
  const reason = `D31 cast: ${card.template.id} has no admitted melee; launch at ${has ? fam.emitterWhy : fam.emitter ? `the body centre (no ${fam.emitter} landmark on this record)` : fam.emitterWhy}`;
  return Object.freeze({ family: card.template.id, emitter, reason });
}

type J = Record<string, number>;
const P = (t: number, ease: KeyPose['ease'], joints: J, dy = 0): KeyPose => ({ t, ease, joints, root: { dx: 0, dy } });
const scaled = (j: J, k: number): J => Object.fromEntries(Object.entries(j).map(([n, v]) => [n, v * k]));

/** First-order screen displacement (image coordinates, y down) of `point` under the pose `deg` (pre-projection degrees). */
function displacement(card: BodyCard, deg: J, owner: string, point: readonly [number, number]): { dx: number; dy: number } {
  const byJoint = new Map(card.parts.map((p) => [p.joint, p]));
  let dx = 0, dy = 0, j: string | undefined = owner;
  while (j && j !== 'root') {
    const part = byJoint.get(j); if (!part) break;
    const th = (deg[j] ?? 0) * DEG * (card.projectionSigns?.[j] ?? 1);
    // rotating about the part's pivot: positive rotation is clockwise on a y-down screen (Pixi)
    dx += -th * (point[1] - part.pivot[1]); dy += th * (point[0] - part.pivot[0]);
    j = part.parent;
  }
  return { dx, dy };
}
/** Mean displacement of the given joints' landmarks (their part tips). */
function meanShift(card: BodyCard, deg: J, joints: readonly string[]): { dx: number; dy: number } {
  const tips = card.parts.filter((p) => joints.includes(p.joint));
  if (!tips.length) return { dx: 0, dy: 0 };
  const s = tips.map((p) => displacement(card, deg, p.joint, p.tip));
  return { dx: s.reduce((a, b) => a + b.dx, 0) / s.length, dy: s.reduce((a, b) => a + b.dy, 0) / s.length };
}
const bodyMaterial = (card: BodyCard): Material => card.materials.body;

/** The D31 pulse for a card's `cast`, or the authored action unchanged. */
export function castAttackAction(card: BodyCard, action: MotionAction): MotionAction {
  if (action.id !== 'cast' || action.family !== 'cast') return action;
  const cast = castAttackOf(card), spec = cast ? specializedTemplate(card.template.id) : null;
  if (!cast || !spec) return action;
  const present = new Set(card.parts.map((p) => p.joint)), rigid = new Set<string>(spec.rigid);
  const live = (names: readonly string[] | undefined): string[] => (names ?? []).filter((n) => present.has(n) && !rigid.has(n));
  const rule = MATERIAL_RULES[bodyMaterial(card)] ?? MATERIAL_RULES.slick;
  // kit §6 → degrees: the gather (squash) and the release reach (stretch); rigid materials keep only a small sharp pulse
  const gather = 6 + 100 * rule.squash, reach = rule.rigid ? 0 : 150 * rule.stretch, overshoot = rule.overshoot;
  const wave = live(spec.roles.wave), soft = live(spec.roles.soft), head = live(spec.roles.head), valves = live(spec.roles.valves), sensors = live(spec.roles.sensors);
  // the body curl: wave chains bow (largest mid-chain), soft chains bend more toward their tip
  const curl: J = {};
  // each chain's weights sum to 2: the whole chain turns about twice the gather angle, however many segments it has (gentle)
  const chain = (names: readonly string[], w: (i: number) => number): void => { const ws = names.map((_, i) => w(i)), sum = ws.reduce((a, b) => a + b, 0) || 1; names.forEach((n, i) => { curl[n] = (2 * ws[i]!) / sum; }); };
  chain(wave, (i) => Math.sin((Math.PI * (i + 0.5)) / wave.length));
  chain(soft, (i) => 0.5 + (0.5 * (i + 1)) / soft.length);
  head.forEach((n) => { curl[n] = n === 'mouth' ? 0 : 0.8; });
  sensors.forEach((n) => { curl[n] = 0.6; });
  const curlJoints = Object.keys(curl), anchored = spec.anchored === true;
  // direction from the card's own landmarks: a mobile body gathers UP (its curl lifts the body); an upright anchored body leans AWAY
  // from the target (body-space forward is +x for either facing; the stage mirrors the holder)
  const probe = meanShift(card, curl, curlJoints);
  const sign = anchored ? (probe.dx > 0 ? -1 : 1) : (probe.dy > 0 ? -1 : 1);
  const rise = scaled(curl, sign * gather);
  // valves open on the gather and clap on the release (the pair separates: opposite signs, the side chosen from the landmarks)
  if (valves.length === 2) {
    const [a, b] = valves as [string, string], open: J = { [a]: 1, [b]: -1 };
    const sa = displacement(card, open, a, card.parts.find((p) => p.joint === a)!.tip), sb = displacement(card, open, b, card.parts.find((p) => p.joint === b)!.tip);
    const ta = card.parts.find((p) => p.joint === a)!.tip, tb = card.parts.find((p) => p.joint === b)!.tip;
    const apart = (ta[0] - tb[0]) * (sa.dx - sb.dx) + (ta[1] - tb[1]) * (sa.dy - sb.dy);
    const vs = apart >= 0 ? 1 : -1;
    rise[a] = vs * gather; rise[b] = -vs * gather;
  }
  // the release snaps the body through rest toward the target by the material's stretch; the mouth opens
  // (an upright anchored body leans through rest toward the target by the stretch; a mobile body snaps out of its gather, nearly flat:
  // lengthening from the gathered curl is its stretch, and it never bows the other way into the ground)
  const release: J = scaled(rise, anchored && reach > 0 ? -reach / gather : 0.15);
  if (head.includes('mouth')) release.mouth = -sign * gather;
  if (valves.length === 2) for (const v of valves) release[v] = -(rise[v] ?? 0) * 0.2;
  const lift = anchored ? 0 : -rule.stretch * 0.5;
  const poses: KeyPose[] = [
    P(tAt('cast', 'rise'), 'ease-in', rise, lift),
    P(tAt('cast', 'hold'), 'sine-in-out', scaled(rise, 1.1), lift),
    P(tAt('cast', 'release'), 'ease-out', release, 0),
  ];
  // settle: the material's overshoot past rest (slick/warty .15), a second damped cycle for translucent; rigid stops dead
  if (!rule.rigid && overshoot > 0) {
    // past rest on the far side of the release: back from a forward lean (anchored), a whisper of the opposite bow (mobile)
    const k = anchored ? overshoot : -overshoot * 0.5;
    poses.push(P(tAt('cast', 'settle', 0.4), 'sine-in-out', scaled(rise, k)));
    if ((rule.wobbleCycles ?? 0) >= 2) poses.push(P(tAt('cast', 'settle', 0.7), 'sine-in-out', scaled(rise, -k * 0.4)));
  }
  poses.push(P(1, rule.rigid ? 'ease-out' : 'back-out', {}));
  return Object.freeze({ id: 'cast', family: 'cast', loop: false, poses: Object.freeze(poses) });
}
