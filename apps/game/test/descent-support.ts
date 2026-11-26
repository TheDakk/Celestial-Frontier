// Shared by the descent tests: real worlds of Sol, worn gear as the capability authority, and the recorded
// answers of the legacy game (fixtures/v1/recorded/landing-descent.json, written by tools/record-v1-fixtures.mjs
// from LEGACY celestial-frontier.html 13357-13461 and 13612-13623).
import type { EngineeringCapabilitySnapshot, GearSlot } from '@cf/domain-loot';
import { prepareArc2LootLegacyMigration, readArc2EngineeringLoadout } from '@cf/persistence';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import { loadRecorded } from '../../../tests/support/v1-recorded.js';

const HOME = { seed: 999, x: 90, y: -60 };
const SOL = { seed: 424_242, x: 560, y: 170 };

/** A world of Sol by its seed: 133 is Earth, 132 Venus, 134 Mars. */
export function world(seed: number): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress({ galaxy: HOME, star: SOL, planet: { seed } });
  if (!result.ok) throw new Error(`descent test world did not resolve: ${result.reason}`);
  return result.address;
}

/** The capabilities of an explorer wearing these items, slot by slot, read the way the game reads them: from the
    loot carrier a save's worn gear is stored in. */
export function wearing(equipped: Partial<Record<GearSlot, string>> = {}): EngineeringCapabilitySnapshot {
  const prepared = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: Object.values(equipped).map((id) => [id, 1]), equip: { ...equipped }, equipAff: {} },
    capacity: 12,
  });
  if (prepared.kind !== 'prepared') throw new Error(`descent test gear was ${prepared.kind}`);
  const read = readArc2EngineeringLoadout(prepared.extensions);
  if (read.kind !== 'loaded') throw new Error(`descent test loadout was ${read.kind}`);
  return read.capabilities;
}

export type Token = 'rain' | 'snow' | 'dust' | 'ash' | 'haze';
export interface Planet { seed: number; type: string; band: string }
export interface TiersCase { group: 'tiers'; output: { tiers: Record<string, { p: number; lo: number; hi: number }>; label: string[]; damage: Array<[number, number]> } }
export interface DescentCase {
  group: 'descent';
  input: Planet & { times: number[]; waveOffs: number[] };
  biome: [string, string, number] | null;
  /** Per time, then per wave-off count: [pct, lo, hi, the prompt's storm token]. */
  at: Array<[number, number, number, Token | null]>;
}
export interface GearCase { group: 'gear'; input: Planet & { equip: Partial<Record<GearSlot, string>>; waveOffs: number }; output: number }
export interface RollCase {
  group: 'roll';
  input: Planet & { equip: Partial<Record<GearSlot, string>>; hull1: boolean; hp: number; waveOffs: number; success: number; damage: number };
  /** [landed, health after, wave-offs after, the notice as [title, text] or null, the pct afterwards]. */
  output: [boolean, number, number, [string, string] | null, number];
}
export interface PromptCase { group: 'prompt'; input: Planet & { seconds: number; name: string | null }; output: [string, string] }
export interface SafeCase { group: 'safe'; output: Array<[boolean, number, boolean, number | null, boolean]> }
type Case = TiersCase | DescentCase | GearCase | RollCase | PromptCase | SafeCase;

const cases = loadRecorded('landing-descent').cases as Case[];
export const recorded = <G extends Case['group']>(group: G): Array<Extract<Case, { group: G }>> =>
  cases.filter((c): c is Extract<Case, { group: G }> => c.group === group);
