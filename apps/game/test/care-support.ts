// A page ready for the care actions: past training, the carriers made, with worlds and beasts to act on.
import { SCENE_OWNERSHIP_ADDRESS_RESOLVER } from '@cf/domain-acquisition';
import { classifyRealm, describeSpecies, sapienceTier, type Genome } from '@cf/domain-genome';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { arc4OwnershipLegacyMirrorMatches, readArc4Ownership, type CodexEntry, type SaveStateV2 } from '@cf/persistence';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import { bioscanFenceV1, settleBioscanV1, settleRenameV1, settleScoutV1 } from '../src/care';
import { stageStarterCharterEventV1 } from '../src/guidance';
import { actionPage, type ActionPageOptions } from './action-support';
import { earthRows } from './capture-support';
import { NOW } from './save-support';

const HOME = { seed: 999, x: 90, y: -60 };
function world(galaxy: { seed: number; x: number; y: number }, star: { seed: number; x: number; y: number }, planetSeed: number): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress({ galaxy, star, planet: { seed: planetSeed } });
  if (!resolved.ok) throw new Error(`world ${planetSeed} did not resolve: ${resolved.reason}`);
  return resolved.address;
}
/** A terran world of the home galaxy with a civilization (its card's badge is Civilized); danger 0.469, wound 23. */
export const CIVILIZED = () => world(HOME, { seed: 515201657, x: -336.4370926050469, y: 494.4940868820995 }, 3135761037);
/** A terran world of the home galaxy with a spacefaring civilization (badge Advanced); danger 0.246, wound 19. */
export const ADVANCED = () => world(HOME, { seed: 4052891079, x: -101.48705160291865, y: -45.18662302521989 }, 3661060526);
/** The home world of the first Paragon: an ocean world of four species and no beast, far from home. */
export const PARAGON_HOME = () => world({ seed: 2833478784, x: 385503.1449741684, y: -142745.095927082 }, { seed: 102306174, x: -11.75427312310785, y: 613.6321912351996 }, 3877631020);

/** A terran world of another galaxy, in the outermost region (depth tax 2.5): its strongest beast has power 314, so
    danger (314 - 170) / 520 and a wound of (10 + 314 / 22) x 2.5 = 61. At home's 0.8 the wound would be 19. */
export const FAR = () => world({ seed: 2833478784, x: 385503.1449741684, y: -142745.095927082 }, { seed: 2629704336, x: -210.78917986806482, y: -226.7044459632598 }, 728254392);
/** A venus world with a beast, in a galaxy of the outermost region. At epoch 0 its beast has power 350: danger
    (350 - 170) / 520 + 0.12 and a wound of (10 + 350 / 22) x 2.5 = 65. At epoch 1 the beast is another (279):
    danger 0.3296, wound 57. */
export const VENUS = () => world({ seed: 2868094357, x: -239784.7076361999, y: 733857.9793787561 }, { seed: 2817075071, x: 268.7715036738664, y: 643.8762226877734 }, 2615200176);

/** Earth's danger: its strongest beast has power 284, so (284 - 170) / 520, and a wound of (10 + 284 / 22) x 0.8. */
export const EARTH_DANGER = (284 - 170) / 520;
export const EARTH_WOUND = 18;

/** A session seed whose first hazard value is below `ceiling` (a strike at any danger above it). */
export function strikeSession(ceiling = 0.05): number {
  for (let seed = 1; seed < 2000; seed++) if (createSessionRNG(seed).at('survey.hazard', 0) < ceiling) return seed;
  throw new Error('no session seed strikes');
}
/** A session seed whose first hazard value is at least `floor` (a clear scan at any danger up to it). */
export function clearSession(floor = 0.7): number {
  for (let seed = 1; seed < 2000; seed++) if (createSessionRNG(seed).at('survey.hazard', 0) >= floor) return seed;
  throw new Error('no session seed is clear');
}

/** The Compendium id of row `index` of Earth's roster (rows 11 to 18 are its beasts, 0 to 5 its plants). */
export const earthId = (index: number): string => `s${String(earthRows()[index]!.seed)}`;
/** Row `index` of Earth's roster as a page the expedition already holds, with these fields on its creature. */
export function heldPage(index: number, extra: Record<string, unknown> = {}): [string, CodexEntry] {
  const row = earthRows()[index]!;
  const genome = row as unknown as Genome;
  const id = earthId(index);
  return [id, {
    id, name: String(row._earthName ?? describeSpecies(genome).name), kind: describeSpecies(genome).kind, tier: 0, realm: classifyRealm(genome),
    sapient: sapienceTier(genome), from: 'Earth', hybrid: false, g: { ...row, ...extra }, where: null,
  }];
}

export async function carePage(options: ActionPageOptions & { readonly held?: ReadonlyArray<[string, CodexEntry]>; readonly scout?: string } = {}) {
  const page = await actionPage({
    ...options,
    change: (state: SaveStateV2) => {
      if (options.held !== undefined) state.codex = [...options.held];
      if (options.scout !== undefined) state.scoutId = options.scout;
      options.change?.(state);
    },
  });
  const deps = { door: page.loop, charters: stageStarterCharterEventV1 };
  return {
    ...page,
    /** The fence of the Discover Life row as the stored state shows it now. */
    fence: (address: CanonicalCF1WorldAddress) => bioscanFenceV1(page.durable(), address),
    /** One press of Discover Life on the row shown now, or on the row whose fence is `shown`. */
    scan: (address: CanonicalCF1WorldAddress, shown?: string) =>
      settleBioscanV1(deps, { address, shown: shown ?? bioscanFenceV1(page.durable(), address), codecNow: NOW }),
    deps,
    scout: (speciesId: string) => settleScoutV1(deps, { speciesId, codecNow: NOW }),
    rename: (speciesId: string, rawName: string) => settleRenameV1({ door: page.loop, live: () => page.live }, { speciesId, rawName, codecNow: NOW }),
    /** Whether the stored ownership carrier and the stored state's Compendium, names and scout say the same. */
    carrierAgrees: (): boolean => {
      const read = readArc4Ownership(page.runtime.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
      if (read.kind !== 'loaded') throw new Error(`ownership was ${read.kind}`);
      const { codex, customNames, bioX, scoutId } = page.durable();
      return arc4OwnershipLegacyMirrorMatches(read.state, { codex, customNames, bioX, scoutId });
    },
    /** The creature fields of a page of the stored Compendium. */
    creature: (id: string): Record<string, unknown> | null => page.durable().codex.find(([held]) => held === id)?.[1].g ?? null,
  };
}
export type CarePage = Awaited<ReturnType<typeof carePage>>;
