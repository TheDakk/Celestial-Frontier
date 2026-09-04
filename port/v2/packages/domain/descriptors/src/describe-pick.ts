/* D-ST — owned, explicit card routing over the verbatim descriptor composers.

   The lifted describePick remains the v1.8.9 parity oracle and still reads the
   legacy `st` / `customNames` globals. Production callers use this adapter:
   navigation and custom-name authority enter as parameters, while every card
   body continues to come from the unchanged verbatim composer. */
import { HOME_GAL_SEED, HOME_POS } from '@cf/domain-worldconfig';
import {
  beltDescriptor,
  cmbDescriptor,
  cometDescriptor,
  decoDescriptor,
  dwarfDescriptor,
  galaxyDescriptor,
  moonDescriptor,
  oortDescriptor,
  planetDescriptor,
  protostarDescriptor,
  quasarDescriptor,
  radioDescriptor,
  slimGal,
  starDescriptor,
  supernovaDescriptor,
  visitorDescriptor,
  wormholeDescriptor,
  kuiperDescriptor,
  type Descriptor,
} from './descriptors.verbatim.js';

type Raw = Record<string, unknown>;

export interface DescriptorPick {
  readonly kind: string;
  readonly data?: unknown;
}

export interface DescriptorStarState {
  readonly x: number;
  readonly y: number;
  readonly seed: number;
}

/** The only navigation fields the legacy card router actually consumes. */
export interface DescriptorNavigationState {
  readonly gal: object | null;
  readonly star: DescriptorStarState | null;
}

/** Return null/undefined when a discovery has no player-authored name. */
export type CustomNameLookup = (key: string) => string | null | undefined;

type StarWhere = Readonly<{ x: number; y: number; seed: number }>;
type CardWhere =
  | { type: 'galaxy'; gal: Raw | null }
  | { type: 'star'; gal: Raw | null; star: StarWhere }
  | { type: 'planet'; gal: Raw | null; star: StarWhere; pseed: unknown };

const STAR_REQUIRED = new Set([
  'starsys', 'planet', 'moon', 'comet', 'belt', 'dwarf', 'kuiper', 'oort', 'visitor',
]);

const isRaw = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const starSnapshot = (value: DescriptorStarState | null): StarWhere | null => {
  if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)
      || !Number.isInteger(value.seed)) return null;
  return { x: value.x, y: value.y, seed: value.seed };
};

/**
 * Route one survey pick without reading app-owned globals.
 *
 * Valid v1.8.9 inputs preserve the lifted router's result byte-for-byte. A
 * star-dependent pick without a current star, or a planet/moon pick without
 * its picked planet, fails closed with a null-card outcome.
 */
export function describePickWithState(
  pick: DescriptorPick,
  nav: DescriptorNavigationState,
  customNameFor: CustomNameLookup,
): Descriptor | null {
  const kind = pick.kind;
  const data = pick.data as Raw;
  const currentStar = starSnapshot(nav.star);
  const pickedPlanet = isRaw(data) && isRaw(data.P) ? data.P : null;
  const possibleMoonParent = isRaw(data) && isRaw(data.pl) ? data.pl : null;
  const pickedMoonParent = possibleMoonParent && isRaw(possibleMoonParent.P)
    ? possibleMoonParent : null;
  if (!currentStar && STAR_REQUIRED.has(kind)) return null;
  if (kind === 'planet' && !pickedPlanet) return null;
  if (kind === 'moon' && !pickedMoonParent) return null;

  const currentGalaxy = slimGal(nav.gal as Raw | null);
  let descriptor: Descriptor | null = null;
  let where: CardWhere | null = null;

  if (kind === 'galaxy') {
    descriptor = galaxyDescriptor(data);
    where = { type: 'galaxy', gal: slimGal(data) };
  } else if (kind === 'quasar') {
    descriptor = quasarDescriptor(data);
    where = { type: 'galaxy', gal: slimGal(data) };
  } else if (kind === 'star') {
    const pickedStar = starSnapshot(data as unknown as DescriptorStarState);
    if (!pickedStar) return null;
    descriptor = starDescriptor(pickedStar.seed);
    where = { type: 'star', gal: currentGalaxy, star: pickedStar };
  } else if (kind === 'starsys') {
    descriptor = starDescriptor(data.seed as number);
    where = { type: 'star', gal: currentGalaxy, star: currentStar! };
  } else if (kind === 'planet') {
    descriptor = planetDescriptor(pickedPlanet!, data.sys as Raw, data.pl as Raw);
    where = { type: 'planet', gal: currentGalaxy, star: currentStar!, pseed: pickedPlanet!.seed };
  } else if (kind === 'moon') {
    descriptor = moonDescriptor(pickedMoonParent!, data.m as never);
    where = {
      type: 'planet', gal: currentGalaxy, star: currentStar!,
      pseed: (pickedMoonParent!.P as Raw).seed,
    };
  } else if (kind === 'comet') {
    descriptor = cometDescriptor(currentStar!.seed, data.ci as number, data.cm as Raw);
    where = { type: 'star', gal: currentGalaxy, star: currentStar! };
  } else if (kind === 'belt') {
    descriptor = beltDescriptor(data.sys as Raw, currentStar!.seed);
    where = { type: 'star', gal: currentGalaxy, star: currentStar! };
  } else if (kind === 'deco') {
    descriptor = decoDescriptor(data);
    where = { type: 'galaxy', gal: currentGalaxy };
  } else if (kind === 'worm') {
    descriptor = wormholeDescriptor();
  } else if (kind === 'dwarf') {
    descriptor = dwarfDescriptor(data.dw as Raw);
    where = { type: 'star', gal: currentGalaxy, star: currentStar! };
  } else if (kind === 'kuiper') {
    descriptor = kuiperDescriptor(data.sys as Raw, currentStar!.seed);
    where = { type: 'star', gal: currentGalaxy, star: currentStar! };
  } else if (kind === 'oort') {
    descriptor = oortDescriptor(currentStar!.seed);
    where = { type: 'star', gal: currentGalaxy, star: currentStar! };
  } else if (kind === 'visitor') {
    descriptor = visitorDescriptor(currentStar!.seed);
    where = { type: 'star', gal: currentGalaxy, star: currentStar! };
  } else if (kind === 'radio') {
    descriptor = radioDescriptor(data);
    where = { type: 'galaxy', gal: slimGal(data) };
  } else if (kind === 'snova') {
    descriptor = supernovaDescriptor(data);
    where = { type: 'galaxy', gal: currentGalaxy };
  } else if (kind === 'protostar') {
    descriptor = protostarDescriptor(data);
    where = { type: 'galaxy', gal: currentGalaxy };
  } else if (kind === 'cmb') {
    descriptor = cmbDescriptor();
    where = {
      type: 'galaxy',
      gal: {
        x: HOME_POS.x, y: HOME_POS.y, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
        seed: HOME_GAL_SEED, home: true,
      },
    };
  }

  if (!descriptor) return null;
  descriptor.where = where;
  if (!where) return descriptor;

  const nameKey = where.type === 'planet' ? `p${String(where.pseed)}`
    : where.type === 'star' ? `s${String(where.star.seed)}`
      : where.gal ? `g${String(where.gal.seed)}` : null;
  descriptor._nameKey = nameKey;
  if (!nameKey) return descriptor;

  const customName = customNameFor(nameKey);
  if (customName !== null && customName !== undefined) {
    descriptor._origTitle = descriptor.title;
    descriptor.title = customName;
    descriptor.sub = `${descriptor.sub ? `${descriptor.sub} · ` : ''}named by you`;
  }
  return descriptor;
}
