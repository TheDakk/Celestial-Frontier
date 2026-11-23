/* The travel gate: which places a save may go to, and how a pasted world code becomes a place. */
import {
  ascend,
  navFromCanonicalCF1Address,
  parseStrictCF1Code,
  resolveCF1GalaxyAddress,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  ascAllowsCanonicalStar,
  shipVisualStateOf,
  withinReachOf,
  type CanonicalCF1Address,
  type NavState,
  type StrictCF1CodeResult,
} from '@cf/scene';
import type { SaveStateV2 } from '@cf/persistence';

export type NavAuthoritySave = Pick<SaveStateV2, 'primeFill' | 'items' | 'ascCh'>;
export type NavigationAuthorityFailure = 'prime-reach' | 'charter-reach';
export type MapNav = Extract<NavState, { mode: 'galaxy' | 'system' }>;

type ValidStrictCF1Code = Extract<StrictCF1CodeResult, { kind: 'valid' }>;

export function resolveStrictCF1Address(parsed: ValidStrictCF1Code): CanonicalCF1Address | null {
  const resolved = parsed.tier === 'galaxy'
    ? resolveCF1GalaxyAddress(parsed.candidate)
    : parsed.tier === 'star'
      ? resolveCF1StarAddress(parsed.candidate)
      : resolveCF1WorldAddress(parsed.candidate);
  return resolved.ok ? resolved.address : null;
}

/** The ship stage the save's built systems give: 0 Sol only, 1 the ring, 2 the home galaxy, 3 everywhere. */
export function chassisStageFor(authoritySave: NavAuthoritySave, shipLiverySeed: number): number {
  return shipVisualStateOf({
    items: authoritySave.items,
    ascCh: authoritySave.ascCh,
    liverySeed: shipLiverySeed,
  }).chassisStage;
}

export function navigationAuthorityFailureFor(
  authoritySave: NavAuthoritySave,
  target: NavState,
  shipLiverySeed: number,
): NavigationAuthorityFailure | null {
  if (target.mode === 'universe') return null;
  const candidatePrimeCount = Object.keys(authoritySave.primeFill || {}).length;
  const candidateStage = chassisStageFor(authoritySave, shipLiverySeed);
  if (!withinReachOf(candidatePrimeCount, target.gal.x, target.gal.y)) return 'prime-reach';
  if ((target.mode === 'system' || target.mode === 'surface')
    && !ascAllowsCanonicalStar(candidateStage, target.gal, target.star)) return 'charter-reach';
  return null;
}

/** The map a proven place is shown on: a world is reached through its system. */
export function mapNavOf(target: Exclude<NavState, { mode: 'universe' }>): MapNav | null {
  if (target.mode !== 'surface') return target;
  const lifted = ascend(target);
  return lifted.ok && lifted.state.mode === 'system' ? lifted.state : null;
}

/** The place a pasted world code names, proven from the game's own sources; null when the text is not a
 *  code, is malformed, or names no real place. */
export function provenNavForCode(code: string): Exclude<NavState, { mode: 'universe' }> | null {
  const strict = parseStrictCF1Code(code.trim());
  if (strict.kind !== 'valid') return null;
  const address = resolveStrictCF1Address(strict);
  if (address === null) return null;
  const resolved = navFromCanonicalCF1Address(address);
  return resolved.ok ? resolved.state : null;
}
