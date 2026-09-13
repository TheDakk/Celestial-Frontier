/* Motion Kit §6 secondary motion by material. Rules are applied from the body
 * card's materials; nothing here is authored per creature. Times in seconds
 * as the kit writes them; the timeline converts to ms. */
export type Material = 'scaled' | 'furred' | 'chitinous' | 'slick' | 'plated' | 'warty' | 'feathered' | 'translucent' | 'crystalline';
export type Realm = 'land' | 'aerial' | 'aquatic' | 'amphibious' | 'gas-giant';
export interface MaterialRule {
  readonly lagS: number;        // per secondary segment, base to tip
  readonly overshoot: number;   // fraction of driver amplitude added on arrival
  readonly damping: number;     // 0..1 settle damping (1 = dead stop)
  readonly squash: number;      // fraction on landing
  readonly stretch: number;     // fraction on launch
  readonly rigid: boolean;      // rigid segments, sharp stops
  readonly quiverS?: number;    // chitinous antenna quiver
  readonly wobbleS?: number;    // translucent wobble on every stop
  readonly wobbleCycles?: number;
  readonly flutter?: boolean;   // feathered wing/tail-fan flutter
  readonly crestLift?: boolean; // feathered crest lift on alert
  readonly glintOnStrike?: boolean; // crystalline painted glint
  readonly heavySettle?: boolean;   // plated
}
export const MATERIAL_RULES: Readonly<Record<Material, MaterialRule>> = Object.freeze({
  furred:      { lagS: 0.08, overshoot: 0.20, damping: 0.55, squash: 0, stretch: 0, rigid: false },
  feathered:   { lagS: 0.06, overshoot: 0.25, damping: 0.50, squash: 0, stretch: 0, rigid: false, flutter: true, crestLift: true },
  scaled:      { lagS: 0.05, overshoot: 0.05, damping: 0.80, squash: 0, stretch: 0, rigid: false },
  slick:       { lagS: 0.06, overshoot: 0.15, damping: 0.60, squash: 0.06, stretch: 0.04, rigid: false },
  warty:       { lagS: 0.06, overshoot: 0.15, damping: 0.60, squash: 0.06, stretch: 0.04, rigid: false },
  chitinous:   { lagS: 0.00, overshoot: 0.00, damping: 1.00, squash: 0, stretch: 0, rigid: true, quiverS: 0.04 },
  plated:      { lagS: 0.00, overshoot: 0.00, damping: 1.00, squash: 0, stretch: 0, rigid: true, heavySettle: true },
  crystalline: { lagS: 0.00, overshoot: 0.00, damping: 1.00, squash: 0, stretch: 0, rigid: true, glintOnStrike: true },
  translucent: { lagS: 0.12, overshoot: 0.35, damping: 0.35, squash: 0.03, stretch: 0.02, rigid: false, wobbleS: 0.12, wobbleCycles: 2 },
});
export const LUMINOUS_PULSE = Object.freeze({ idleMs: 1800, strikeMs: 120 });
export interface MediumRule { readonly damping: number; readonly bobMs: number; readonly drift: boolean; }
export const MEDIUM_RULES: Readonly<Record<Realm, MediumRule>> = Object.freeze({
  land:        { damping: 1.00, bobMs: 0,    drift: false },
  amphibious:  { damping: 0.90, bobMs: 0,    drift: false },
  aquatic:     { damping: 0.75, bobMs: 0,    drift: true },
  aerial:      { damping: 1.00, bobMs: 1400, drift: false },
  'gas-giant': { damping: 0.85, bobMs: 0,    drift: true },
});
/** FA_SKIN name → kit material (the kit shortens "slick and wet" to slick). */
export function materialFromSkinName(name: string): Material | null {
  const n = name.toLowerCase();
  if (/fur/.test(n)) return 'furred';
  if (/scale/.test(n)) return 'scaled';
  if (/feather/.test(n)) return 'feathered';
  if (/chitin/.test(n)) return 'chitinous';
  if (/slick|wet|slime/.test(n)) return 'slick';
  if (/plate/.test(n)) return 'plated';
  if (/wart/.test(n)) return 'warty';
  if (/translucent/.test(n)) return 'translucent';
  if (/crystal/.test(n)) return 'crystalline';
  return null;
}
/** A11 chain-kind rules (kit §6): applied on top of the material when a chain declares its kind. Absent kind = material only (quadruped tails/ears). */
export interface ChainRule { readonly lagS?: number; readonly overshoot?: number; readonly flutterS?: number; readonly quiverS?: number; readonly wobbleS?: number; }
export const CHAIN_RULES: Readonly<Record<string, ChainRule>> = Object.freeze({
  wing:    { flutterS: 0.06 },            // feathered flutter; rigid (chitinous) wings keep sharp stops
  tailfan: { flutterS: 0.06 },
  fin:     { lagS: 0.05, overshoot: 0.10 }, // fin lag, then the medium's damping
  antenna: { quiverS: 0.04 },
  frond:   { lagS: 0.05, overshoot: 0.15 }, // sway lag by segment base→tip
  bell:    { wobbleS: 0.12, overshoot: 0.30 },
  arm:     { lagS: 0.06 },
  tail: {}, ear: {},
});
export interface SecondaryParams {
  readonly partId: string; readonly joint: string; readonly driver: string; readonly order: number;
  readonly lagMs: number; readonly overshoot: number; readonly damping: number;
  readonly squash: number; readonly stretch: number; readonly rigid: boolean;
  readonly quiverMs: number; readonly wobbleMs: number; readonly pulseMs: number;
  readonly kind?: string; readonly flutterMs?: number;
}
export interface SecondaryPartInput { readonly id: string; readonly driver: string; readonly joints: readonly string[]; readonly material: Material; readonly kind?: string; }
/** Per-joint lag/overshoot/squash parameters for one secondary chain. */
export function secondaryParams(part: SecondaryPartInput, realm: Realm, luminous: boolean): SecondaryParams[] {
  const rule = MATERIAL_RULES[part.material], medium = MEDIUM_RULES[realm], chain = part.kind ? CHAIN_RULES[part.kind] ?? {} : null;
  const lagS = chain && !rule.rigid ? chain.lagS ?? rule.lagS : rule.lagS, overshoot = chain && !rule.rigid ? chain.overshoot ?? rule.overshoot : rule.overshoot;
  return part.joints.map((joint, order) => ({
    partId: part.id, joint, driver: part.driver, order,
    lagMs: lagS * 1000 * (order + 1),
    overshoot: overshoot * (1 - order * 0.15),
    damping: Math.min(1, rule.damping * medium.damping),
    squash: rule.squash, stretch: rule.stretch, rigid: rule.rigid,
    quiverMs: Math.max(rule.quiverS ?? 0, chain?.quiverS ?? 0) * 1000, wobbleMs: Math.max(rule.wobbleS ?? 0, chain?.wobbleS ?? 0) * 1000,
    pulseMs: luminous ? LUMINOUS_PULSE.idleMs : 0,
    ...(chain ? { kind: part.kind, flutterMs: rule.flutter && chain.flutterS ? chain.flutterS * 1000 : 0 } : {}),
  }));
}
