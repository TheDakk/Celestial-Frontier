/* @cf/domain-starcatalog — MODULE 4 of 14.
   main.js `@module StarCatalog [domain]` (v1.8.9). Bodies + tables VERBATIM.
   Parity: golden-seeds `starClass` ×10,000 + baseline `starClass` probe.
   ⚠ The threshold ladder in starClass is the stellar census — every star in
   the universe classifies through these exact cut points. */
import { mulberry32 } from '@cf/domain-rand';
import { SOL_SEED } from '@cf/domain-worldconfig';

export interface StarClass { kind: string; col: string; r: number; }

export function starClass(seed: number): StarClass {
  if (seed === SOL_SEED) return { kind: 'G', col: '#fff4d8', r: 26 };
  const r = mulberry32(seed ^ 0x9e37);
  const c = r();
  if (c < 0.08) return { kind: 'BD', col: '#c98a6a', r: 9 };
  if (c < 0.50) return { kind: 'M', col: '#ff9a6a', r: 16 };
  if (c < 0.63) return { kind: 'K', col: '#ffd9a0', r: 22 };
  if (c < 0.76) return { kind: 'G', col: '#fff4d8', r: 26 };
  if (c < 0.84) return { kind: 'A', col: '#e8efff', r: 34 };
  if (c < 0.875) return { kind: 'B', col: '#9ab8ff', r: 46 };
  if (c < 0.90) return { kind: 'PROTO', col: '#ff9a5a', r: 18 };
  if (c < 0.935) return { kind: 'RG', col: '#ff8a4a', r: 62 };
  if (c < 0.95) return { kind: 'SG', col: '#ff7a50', r: 80 };
  if (c < 0.968) return { kind: 'WD', col: '#eef4ff', r: 7 };
  if (c < 0.982) return { kind: 'NS', col: '#dceaff', r: 5 };
  if (c < 0.989) return { kind: 'MAG', col: '#cfe0ff', r: 5 };
  return { kind: 'BH', col: '#9a86c8', r: 10 };
}

export const KIND_DESC: Readonly<Record<string, string>> = Object.freeze({
  BD: 'a brown dwarf — a failed star too small to ignite',
  M: 'a dim red dwarf — the most common kind of star',
  K: 'an orange dwarf star', G: 'a yellow sun-like star',
  A: 'a hot white star', B: 'a brilliant, short-lived blue giant',
  RG: 'a dying red giant, swollen to enormous size',
  WD: 'a white dwarf — the cooling ember of a dead star',
  NS: 'a neutron star — a city-sized stellar corpse sweeping beams of radiation',
  PROTO: 'a protostar — a star still being born inside its dusty disk',
  SG: 'a red supergiant — a colossal dying star, destined for a supernova',
  MAG: 'a magnetar — the most powerfully magnetic object known',
  BH: 'a stellar-mass black hole — matter spirals in; nothing escapes',
});

export interface SolPlanet { name: string; orb: number; P: Record<string, unknown>; }
export const SOL_PLANETS: readonly SolPlanet[] = Object.freeze([
  { name: 'Mercury', orb: 58, P: { type: 'rocky', seed: 131, sizeMul: 0.55, ring: false, moons: 0 } },
  { name: 'Venus', orb: 84, P: { type: 'venus', seed: 132, hue: 30, sizeMul: 0.8, ring: false, moons: 0 } },
  { name: 'Earth', orb: 112, P: { type: 'terran', seed: 133, seaHue: 210, landHue: 115, iceAmt: 0.5, sizeMul: 0.85, ring: false, moons: 1 } },
  { name: 'Mars', orb: 140, P: { type: 'desert', seed: 134, hue: 20, sizeMul: 0.65, ring: false, moons: 2 } },
  { name: 'Jupiter', orb: 192, P: { type: 'gas', seed: 135, hue: 32, spot: true, spotHue: 12, sizeMul: 2.3, ring: false, moons: 8 } },
  { name: 'Saturn', orb: 236, P: { type: 'gas', seed: 136, hue: 44, spot: false, sizeMul: 2.0, ring: true, moons: 7 } },
  { name: 'Uranus', orb: 272, P: { type: 'ice', seed: 137, sizeMul: 1.3, ring: true, moons: 4 } },
  { name: 'Neptune', orb: 300, P: { type: 'gas', seed: 138, hue: 222, spot: true, spotHue: 230, sizeMul: 1.3, ring: false, moons: 4 } },
]);
