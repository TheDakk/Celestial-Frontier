/** @module prime-travel [app] — the Prime Codex's two travel verbs (v1.8.9 parity, D16; v1 `data-pgo` / `data-tgo`):
 * - a CLAIMED Signature row travels to the world where it was won (`primeFill[id].where`, written by the combat settlement as
 *   the legacy world view), and
 * - an UNCLAIMED Signature whose resonance is STRONG ("in reach") tracks its Titan: the nearest world its Titan waits on,
 *   found by the same deterministic scan as v1 `nearestTitanWorld` (run on tap, never per frame).
 * Both only RESOLVE a canonical world address here; Main travels through the one proven-route owner (search-travel), so the
 * charter gates and route commit are unchanged. Pure and deterministic (Rand hashes only; no Math.random/Date.now). */
import {
  PRIME_SIGNATURES_V1,
  projectPrimeResonanceV1,
  projectTitanPlacementFactsV1,
  type PrimeSignatureIdV1,
} from '@cf/domain-combatcore';
import { TAU, hashInt, mulberry32 } from '@cf/domain-rand';
import { ASC_RING_R, REGIONS, regionAt } from '@cf/domain-strays';
import { GCELL, GR, HOME_GAL_SEED, HOME_POS, SOL_POS, UCELL } from '@cf/domain-worldconfig';
import { galaxiesInCell, galaxyProfile, starsInCell, systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';

const SIGNATURE_IDS = new Set<string>(PRIME_SIGNATURES_V1.map(({ id }) => id));
export const isPrimeSignatureIdV1 = (value: unknown): value is PrimeSignatureIdV1 => typeof value === 'string' && SIGNATURE_IDS.has(value);

/** A claim's saved `where` (legacy world view: `{type:'planet', gal, star, pseed}`) as a canonical world, or null. */
export function primeClaimWorldAddressV1(where: unknown): CanonicalCF1WorldAddress | null {
  if (where === null || typeof where !== 'object') return null;
  const view = where as { type?: unknown; gal?: { seed?: unknown; x?: unknown; y?: unknown }; star?: { seed?: unknown; x?: unknown; y?: unknown }; pseed?: unknown };
  if (view.type !== 'planet' || !view.gal || !view.star) return null;
  try {
    const resolved = resolveCF1WorldAddress({
      galaxy: { seed: view.gal.seed, x: view.gal.x, y: view.gal.y },
      star: { seed: view.star.seed, x: view.star.x, y: view.star.y },
      planet: { seed: view.pseed },
    });
    return resolved.ok ? resolved.address : null;
  } catch { return null; }
}

/** v1 `currentRegion()` index: the last region whose Signature count the explorer has reached. */
export function reachedRegionIndexV1(claimedCount: number): number {
  let reached = 0;
  REGIONS.forEach((region, index) => { if (claimedCount >= region.sigs) reached = index; });
  return reached;
}

/** The Signatures whose Titan is trackable right now (v1: the resonance is `strong`, i.e. in reach). */
export function trackablePrimeSignaturesV1(input: Readonly<{ ascentStage: number; claimedIds: readonly string[] }>): ReadonlySet<PrimeSignatureIdV1> {
  const claimed = new Set(input.claimedIds);
  const reachable = reachedRegionIndexV1(claimed.size);
  return new Set(PRIME_SIGNATURES_V1.filter((definition) => !claimed.has(definition.id)
    && projectPrimeResonanceV1({ signatureId: definition.id, ascentStage: input.ascentStage, reachableRegionIndex: reachable }).reachable)
    .map(({ id }) => id));
}

function titanHere(planetSeed: number, worldType: unknown, regionIndex: number, elem: PrimeSignatureIdV1, claimedIds: readonly PrimeSignatureIdV1[]): boolean {
  if (typeof worldType !== 'string') return false;
  try {
    return projectTitanPlacementFactsV1({ planetSeed: planetSeed >>> 0, worldType, regionIndex, claimedSignatureIds: claimedIds })
      .find((fact) => fact.signatureId === elem)?.present === true;
  } catch { return false; }
}

/** v1 `nearestTitanWorld(elem)` — the same seeded search order, the same bounds, the same first hit — as a canonical world. */
export function nearestTitanWorldV1(elem: PrimeSignatureIdV1, input: Readonly<{ ascentStage: number; claimedIds: readonly string[] }>): CanonicalCF1WorldAddress | null {
  const definition = PRIME_SIGNATURES_V1.find(({ id }) => id === elem);
  if (definition === undefined) return null;
  const claimedIds = input.claimedIds.filter(isPrimeSignatureIdV1);
  const minReg = definition.minimumRegionIndex;
  const found = (gal: { seed: number; x: number; y: number }, star: { seed: number; x: number; y: number }, pseed: number) =>
    primeClaimWorldAddressV1({ type: 'planet', gal, star, pseed });
  try {
    if (minReg === 0) {
      if (input.ascentStage < 1) return null; // the home galaxy is huntable only once the drives open it
      const prof = galaxyProfile(HOME_GAL_SEED);
      const R = input.ascentStage < 2 ? ASC_RING_R : GR * 0.94;
      const rr = mulberry32(hashInt(0x7174, elem.charCodeAt(0), 7) >>> 0);
      for (let i = 0; i < 600; i++) {
        const a = rr() * TAU, dd = Math.sqrt(rr()) * R;
        const cx = Math.floor((SOL_POS.x + Math.cos(a) * dd) / GCELL), cy = Math.floor((SOL_POS.y + Math.sin(a) * dd) / GCELL);
        for (const s of starsInCell(HOME_GAL_SEED, prof, cx, cy).stars) {
          if (Math.hypot(s.x - SOL_POS.x, s.y - SOL_POS.y) > R) continue;
          const sys = systemFor(s.seed); if (!sys.planets) continue;
          for (const pl of sys.planets) {
            if (titanHere(Number(pl.P.seed), pl.P.type, 0, elem, claimedIds)) {
              return found({ seed: HOME_GAL_SEED, x: HOME_POS.x, y: HOME_POS.y }, { seed: s.seed, x: s.x, y: s.y }, Number(pl.P.seed));
            }
          }
        }
      }
      return null;
    }
    if (reachedRegionIndexV1(claimedIds.length) < minReg) return null; // not yet in reach
    const r0 = REGIONS[minReg - 1]?.r ?? 0, r1 = REGIONS[minReg]?.r ?? REGIONS[REGIONS.length - 1]!.r;
    const rr = mulberry32(hashInt(0x7174, elem.charCodeAt(0), 11) >>> 0);
    for (let i = 0; i < 260; i++) {
      const a = rr() * TAU, dd = r0 + rr() * (r1 - r0);
      const gx = HOME_POS.x + Math.cos(a) * dd, gy = HOME_POS.y + Math.sin(a) * dd;
      const reg = regionAt(gx, gy); if (reg < minReg) continue;
      for (const g of galaxiesInCell(Math.floor(gx / UCELL), Math.floor(gy / UCELL))) {
        if (g.quasar || g.dwarf || g.size < 28) continue;
        const gp = galaxyProfile(g.seed), pr = mulberry32(hashInt(g.seed, elem.charCodeAt(0), 3) >>> 0);
        for (let k = 0; k < 24; k++) {
          const cx = Math.floor((pr() * 2 - 1) * g.size / GCELL), cy = Math.floor((pr() * 2 - 1) * g.size / GCELL);
          for (const s of starsInCell(g.seed, gp, cx, cy).stars) {
            const sys = systemFor(s.seed); if (!sys.planets) continue;
            for (const pl of sys.planets) {
              if (titanHere(Number(pl.P.seed), pl.P.type, reg, elem, claimedIds)) {
                return found({ seed: g.seed, x: g.x, y: g.y }, { seed: s.seed, x: s.x, y: s.y }, Number(pl.P.seed));
              }
            }
          }
        }
      }
    }
    return null;
  } catch { return null; }
}
