/* @cf/domain-naming — MODULE 3 of 14.
   main.js `@module Naming [domain]` (v1.8.9). Bodies VERBATIM + types.
   Parity: baseline.json `names` probe (properName/galaxyName/starName slots).
   NOTE speciesName is NOT here — it belongs to the Genome module. */
import { mulberry32, hashInt } from '@cf/domain-rand';
import { HOME_GAL_SEED, SOL_SEED } from '@cf/domain-worldconfig';

const SYL = ['an', 'dro', 'vel', 'tar', 'ka', 'ri', 'os', 'um', 'ze', 'phy', 'lon', 'ae', 'cy', 'gn', 'ur', 'sa', 'or', 'ion', 'per', 'sei'];

export function properName(seed: number, parts: number): string {
  const r = mulberry32(seed ^ 0x5f3759df);
  let s = '';
  for (let i = 0; i < parts; i++) s += SYL[Math.floor(r() * SYL.length)];
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function galaxyName(seed: number): string { return seed === HOME_GAL_SEED ? 'Milky Way' : properName(seed, 3) + ' Galaxy'; }
export function starName(seed: number): string { return seed === SOL_SEED ? 'Sun (Sol)' : 'Star ' + properName(seed, 2) + '-' + (hashInt(seed, 7, 7) % 900 + 100); }
