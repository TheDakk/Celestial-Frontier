/* The galaxy map's passes besides its bodies: the haze of unresolved starlight, and how its stars twinkle and its
   wormhole, pulsar beams and protostars move. */
import { ditherRank } from '@cf/art-interface';
import type { SpaceItem } from '@cf/art-interface';
import { mulberry32 } from '@cf/domain-rand';
import { GCELL } from '@cf/domain-worldconfig';
import { galaxyProfile } from '@cf/domain-worldgen';
import { GR } from '@cf/scene';
import { frameOf, framed, glow, hsl, lit, place, scaled, tone, worldField } from './draw';
import type { PassView } from './draw';
import { angleOf, expOf, lnOf } from './exact';
import { cosSin } from './model';
import type { MapBody } from './model';

const TAU = 6.283185307179586;
const PI = 3.141592653589793;
const CORE = 0xfff0d6;
const ARM = 0xc4d2ff;
const KNOT = hsl(332, 0.75, 0.68);
const GRAIN = [0xffeed6, 0xcedbff, 0xffc4a0] as const;
/** The arm glow, from its wide faint edge to its core: half its width in world units, and its strength. */
const ARM_TIERS = [[34, 0.045], [20, 0.13], [9, 0.26]] as const;
/** One grain of the game's haze picture covers this many world units. */
const GRAIN_SIZE = 2 * GR / 2048;

/** The rings the disk's glow is stepped in, as shares of the galaxy's radius from the rim to the core. */
const DISK_RINGS = [1, 0.85, 0.7, 0.56, 0.42, 0.28, 0.2, 0.13, 0.06, 0.03, 0.012] as const;
/** The game's disk at a share of the radius: its colour (of `shades`, from the core outward) and its strength. */
function diskAt(part: number, shades: readonly number[]): readonly [number, number] {
  const stops = [[0, 0.92], [0.06, 0.5], [0.28, 0.2], [0.7, 0.08], [1, 0]] as const;
  for (let i = 1; i < stops.length; i++) {
    const [from, to] = [stops[i - 1]!, stops[i]!];
    if (part <= to[0]) return [shades[part < 0.03 ? 0 : Math.min(i, shades.length - 1)] ?? 0, from[1] + (to[1] - from[1]) * (part - from[0]) / (to[0] - from[0])];
  }
  return [0, 0];
}

interface Light { x: number; y: number; r: number; colour: number; strength: number }
interface Haze {
  seed: number; hue: number;
  /** The centre line of each arm, from the core outward: where, and how far out. */
  arms: { x: number; y: number; rad: number }[][];
  knots: Light[];
  grain: { x: number; y: number; colour: number; alpha: number; size: number }[];
}

let kept: Haze | null = null;
/** The haze of a galaxy in world units, by the game's own seeded draws. Kept for the galaxy last asked about. */
function hazeOf(seed: number): Haze {
  if (kept?.seed === seed) return kept;
  const { arms: armCount, wind, hue } = galaxyProfile(seed) as { arms: number; wind: number; hue: number };
  const armAngle = (rad: number, m: number): number => lnOf(rad / 18) / wind - TAU * (m + 0.5) / armCount;
  const arms: Haze['arms'] = [];
  for (let m = 0; m < armCount; m++) {
    const line: Haze['arms'][number] = [];
    for (let rad = 26; rad < GR * 0.97; rad *= 1.05) {
      const [cos, sin] = cosSin(armAngle(rad, m));
      line.push({ x: cos * rad, y: sin * rad, rad });
    }
    arms.push(line);
  }
  // The pink star-forming knots that dot the arms.
  const knots: Light[] = [];
  const knotDraw = mulberry32((seed ^ 0x4afb) >>> 0);
  for (let m = 0; m < armCount; m++) for (let i = 0; i < 14; i++) {
    const rad = 70 + knotDraw() * GR * 0.78;
    const [cos, sin] = cosSin(armAngle(rad, m) + (knotDraw() - 0.5) * 0.10);
    const r = (5 + knotDraw() * 11) * GCELL / 14;
    knots.push({ x: cos * rad, y: sin * rad, r: r * 0.7, colour: KNOT, strength: (0.10 + knotDraw() * 0.10) * 0.6 });
  }
  // The grain: single suns sampled from the same density the stars are placed by.
  const grain: Haze['grain'] = [];
  const draw = mulberry32((seed ^ 0x77fe) >>> 0);
  for (let tries = 0; grain.length < 15000 && tries < 230000; tries++) {
    const x = (draw() * 2 - 1) * GR;
    const y = (draw() * 2 - 1) * GR;
    const rad = Math.sqrt(x * x + y * y);
    if (rad >= GR) continue;
    const k = armCount * (lnOf(Math.max(rad, 18) / 18) / wind - angleOf(y, x)) / TAU;
    const offArm = Math.abs((((k % 1) + 1) % 1) - 0.5);
    const density = expOf(-rad / 130) * 3.2 + 0.22 + expOf(-(offArm * offArm) / 0.022) * 1.25 * expOf(-rad / 850);
    if (draw() * 2.6 > density) continue;
    const warm = draw();
    const [colour, alpha] = warm < 0.55 ? [GRAIN[0], 0.18 + draw() * 0.30] : warm < 0.85 ? [GRAIN[1], 0.16 + draw() * 0.28] : [GRAIN[2], 0.16 + draw() * 0.26];
    grain.push({ x, y, colour, alpha, size: 0.5 + draw() });
  }
  kept = { seed, hue, arms, knots, grain };
  return kept;
}

/** The glow along an arm at a distance from its centre line, in widths of the arm: the game's three strokes, eased
 *  into one another, as [distance, strength]. */
const ARM_GLOW = [[0, 0.26], [9, 0.26], [20, 0.13], [34, 0.045], [46, 0]] as const;
/** The game's disk at shares of the radius. */
const DISK_GLOW = [[0, 0.92], [0.06, 0.5], [0.28, 0.2], [0.7, 0.08], [1, 0]] as const;
/** A value along stops that rise in their first number: even between two, and the last beyond them. */
function along(stops: readonly (readonly [number, number])[], at: number): number {
  for (let i = 1; i < stops.length; i++) {
    const [from, to] = [stops[i - 1]!, stops[i]!];
    if (at <= to[0]) return from[1] + (to[1] - from[1]) * (at - from[0]) / (to[0] - from[0]);
  }
  return stops[stops.length - 1]![1];
}
/**
 * The steps the haze is drawn in, from the rim to the core: the strength of the game's glow where each begins, which
 * of the disk's shades it takes (0 the outer disk, 3 the warm core) and how much of that light it carries. The glow
 * is all but gone at the rim, so the first step is hardly lighter than space, and the steps crowd toward the core.
 * No step is a strong light: a star in front of the haze is always brighter than it.
 */
const HAZE_STEPS = [[0.075, 0, 0.09], [0.12, 0, 0.15], [0.18, 1, 0.19], [0.26, 1, 0.24], [0.36, 3, 0.2], [0.5, 3, 0.25], [0.68, 3, 0.3], [0.84, 3, 0.33]] as const;
/** The arms begin 26 units from the centre and reach their full glow by 80. */
const ARM_FROM = 26;
const ARM_FULL = 80;

/** The haze in whole pixels: the disk and the glow along the arms as one field of solid steps, the pink knots as
 *  small lights of two steps, and the grain as single suns. */
function solidHaze(v: PassView, haze: Haze): SpaceItem[] {
  const { arms: armCount, wind } = galaxyProfile(haze.seed) as { arms: number; wind: number };
  const pitch = wind / Math.sqrt(1 + wind * wind);
  const z = v.cam.z;
  const shades = [hsl(haze.hue, 0.45, 0.58), hsl(haze.hue, 0.52, 0.64), hsl(haze.hue, 0.58, 0.76), CORE];
  const steps = HAZE_STEPS.map(([at, shade, light]) => ({ at: Math.round(at * 1000), colour: lit(shades[shade] ?? CORE, light) }));
  const strength = (x: number, y: number): number => {
    const rad = Math.sqrt(x * x + y * y);
    const disk = along(DISK_GLOW, rad / GR);
    if (rad <= ARM_FROM || rad >= GR * 0.97) return disk;
    const turn = armCount * (lnOf(rad / 18) / wind - angleOf(y, x)) / TAU;
    // How far from the centre line of the nearest arm, across it, in world units.
    const across = Math.abs(turn - Math.floor(turn) - 0.5) * (TAU / armCount) * rad * pitch;
    return disk + along(ARM_GLOW, across / (0.55 + 0.45 * expOf(-rad / 700))) * expOf(-rad / 850) * Math.min(1, (rad - ARM_FROM) / (ARM_FULL - ARM_FROM));
  };
  const items: SpaceItem[] = [worldField(v, steps, strength)];
  const onPicture = (x: number, y: number, r: number): boolean => x >= -r && y >= -r && x < v.grid.w + r && y < v.grid.h + r;
  for (const knot of haze.knots) {
    const at = place(v.cam, v.grid, knot.x, knot.y);
    const r = Math.round(knot.r * z);
    if (r < 1 || !onPicture(at.x, at.y, r)) continue;
    items.push(glow(at.x, at.y, r, lit(knot.colour, 0.22)));
    if (r >= 4) items.push(glow(at.x, at.y, r >> 1, lit(knot.colour, 0.38)));
  }
  haze.grain.forEach((grain, i) => {
    const at = place(v.cam, v.grid, grain.x, grain.y);
    if (!onPicture(at.x, at.y, 0)) return;
    const across = grain.size * GRAIN_SIZE * z;
    const colour = lit(grain.colour, 0.25 + grain.alpha);
    // Sized by the camera, a grain three or more pixels across is the light of one sun: a small disc.
    if (across >= 3) items.push(glow(at.x, at.y, Math.round(across / 3), colour));
    // A grain smaller than a pixel is seen in as many of every 16 as it would light, by its own number: no pattern.
    else if ((Math.imul(i, 0x9e3779b1) >>> 28) < Math.round(16 * Math.min(1, across * across) * grain.alpha)) items.push({ kind: 'dot', ...at, colour });
  });
  return items;
}

/**
 * The haze of the galaxy `v.nav` is in, painted under everything else in it: the disk as rings of dither that thicken
 * and warm toward the core, the glow along each arm, the pink knots, and the grain, of which more shows the closer
 * the view. With the view's `solid` it is whole pixels: steps of solid colour that fade out toward the rim.
 */
export function hazeItems(v: PassView): SpaceItem[] {
  if (v.nav.mode !== 'galaxy') return [];
  const haze = hazeOf(v.nav.gal.seed);
  if (v.solid === true) return solidHaze(v, haze);
  const z = v.cam.z;
  const centre = place(v.cam, v.grid, 0, 0);
  const onPicture = (x: number, y: number, r: number): boolean => x >= -r && y >= -r && x < v.grid.w + r && y < v.grid.h + r;
  const items: SpaceItem[] = [];
  const veil = (at: { x: number; y: number }, r: number, colour: number, strength: number): void => {
    const light = tone(colour, strength);
    if (light.level > 0) items.push({ kind: 'veil', ...at, r, ...light, light: true });
  };
  const shades = [CORE, hsl(haze.hue, 0.58, 0.76), hsl(haze.hue, 0.52, 0.64), hsl(haze.hue, 0.45, 0.58)];
  DISK_RINGS.forEach((part, i) => {
    // Each ring is as strong as the game's disk is halfway to the next ring in.
    const [colour, strength] = diskAt((part + (DISK_RINGS[i + 1] ?? 0)) / 2, shades);
    veil(centre, Math.round(GR * part * z), colour, strength);
  });
  for (const [half, strength] of ARM_TIERS) {
    for (const line of haze.arms) {
      for (let i = 1; i < line.length; i++) {
        const [from, to] = [line[i - 1]!, line[i]!];
        const r = half * (0.55 + 0.45 * expOf(-to.rad / 700)) * z;
        const glow = strength * expOf(-to.rad / 850);
        const length = Math.sqrt((to.x - from.x) * (to.x - from.x) + (to.y - from.y) * (to.y - from.y)) * z;
        const steps = Math.max(1, Math.ceil(length / Math.max(1, r)));
        for (let s = 0; s < steps; s++) {
          const at = place(v.cam, v.grid, from.x + (to.x - from.x) * s / steps, from.y + (to.y - from.y) * s / steps);
          if (onPicture(at.x, at.y, Math.round(r))) veil(at, Math.round(r), ARM, glow);
        }
      }
    }
  }
  for (const knot of haze.knots) {
    const at = place(v.cam, v.grid, knot.x, knot.y);
    const r = Math.round(knot.r * z);
    if (onPicture(at.x, at.y, r)) veil(at, r, knot.colour, knot.strength);
  }
  for (const grain of haze.grain) {
    const at = place(v.cam, v.grid, grain.x, grain.y);
    if (!onPicture(at.x, at.y, 0)) continue;
    const across = grain.size * GRAIN_SIZE * z;
    // Sized by the camera, a grain two or more pixels across is the soft light of one sun, as wide as the game draws it.
    if (v.sizing !== undefined && across >= 2) { veil(at, Math.round(across / 2), grain.colour, grain.alpha); continue; }
    // A grain smaller than a pixel is seen in as many pixels as it would light: none from afar, more up close.
    if (ditherRank(at.x, at.y) < Math.round(16 * Math.min(1, across * across) * grain.alpha)) items.push({ kind: 'dot', ...at, colour: scaled(grain.colour, 0.6) });
  }
  return items;
}

/** A body of the galaxy map as time moves it: a bright star breathes, the wormhole and a pulsar's beams turn, a
 *  protostar pulses. With effects off nothing breathes; with motion reduced the breath is held. */
export function stirGalaxyBody(body: MapBody, items: readonly SpaceItem[], v: PassView): SpaceItem[] {
  if (body.kind === 'star') {
    // The stars of the coarse layer brighter than 1.3 twinkle; the fine stars that resolve up close do not.
    if (!v.effects || body.priority === 2 || !(body.ref.s > 1.3)) return [...items];
    const light = v.motion ? 0.82 + 0.18 * cosSin(v.time * 2.4 + body.ref.seed % 97)[1] : 0.9;
    return items.map((item) => item.kind === 'dot' ? { ...item, colour: scaled(item.colour, light) }
      : item.kind === 'disc' ? { ...item, bands: item.bands.map((band) => scaled(band, light)) }
        : item.kind === 'element' && light < 0.82 ? { ...item, name: `${item.name}/dim` } : item);
  }
  const rename = (name: string): string => {
    if (body.kind === 'worm') return framed(name, frameOf(v.time * 1.2, TAU, 4));
    if (body.kind === 'snova' && body.ref.remnant === 'NS') return framed(name, frameOf(v.time * 2.2, PI, 4));
    if (body.kind === 'protostar' && v.effects && v.motion && cosSin(v.time * 3 + body.ref.seed % 7)[1] < 0) return `${name}/dim`;
    return name;
  };
  return items.map((item) => item.kind === 'element' ? { ...item, name: rename(item.name) } : item);
}
