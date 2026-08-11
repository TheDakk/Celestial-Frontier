/* Production-derived Earth-lineage continuity evidence.

   This page is intentionally separate from audit.ts: it renders a bounded
   13-lineage x 5-stage matrix through the real makeGenome -> crossGenome ->
   speciesPortrait path and streams review artefacts to the Node driver. It
   never writes _earthBlend or _anchorVal. Machine checks cover provenance,
   determinism, routing, and cache independence; the visual seam decision is
   deliberately left UNREVIEWED for a human looking at the emitted sheets. */
import { speciesPortrait, verbatimSpeciesPortraitForAudit } from '@cf/art/species';
import { _EARTH_NAMES } from '@cf/domain-descriptors';
import { crossGenome } from '@cf/domain-genetics';
import { makeGenome } from '@cf/domain-genome';
import { hashInt } from '@cf/domain-rand';
/* Audit-only route observation: call the exact resolver used by
   speciesPortrait without widening @cf/art's production exports. */
import { resolveOverride } from '../../../packages/art/src/speciesoverrides.js';

type Genome = Record<string, unknown>;
type EarthKingdom = 'fauna' | 'flora' | 'fungi' | 'microbe';
type RouteKind = 'named-owned' | 'named-verbatim' | 'lineage-owned'
  | 'lineage-verbatim' | 'procedural-owned' | 'procedural-verbatim';
interface Crop { id: string; label: string; x: number; y: number; w: 55; h: 55 }
interface LineageSpec {
  id: string;
  species: string;
  display: string;
  kingdom: EarthKingdom;
  challenge: Challenge;
  joins: string;
  crops: Crop[];
}
type Challenge = 'head-graft' | 'dorsal-tail' | 'extra-eyes'
  | 'palette-contrast' | 'bulk-length';
interface QueueItem {
  path: string;
  kind: 'portrait' | 'card' | 'silhouette' | 'lineage-sheet'
    | 'join-atlas' | 'cache-portrait' | 'cache-sheet'
    | 'mixed-portrait' | 'mixed-sheet';
  width: number;
  height: number;
  identity: string;
  url: string;
}
interface MatrixWindow {
  q: QueueItem[];
  done: boolean;
  error: string | null;
  report: Record<string, unknown> | null;
}

const W = window as unknown as Record<string, unknown>;
const log = document.getElementById('log')!;
const say = (message: string): void => { log.textContent = message; };
const params = new URLSearchParams(location.search);
const EMIT = params.get('emit') !== '0';
const REVERSE = params.get('order') === 'reverse';
const state: MatrixWindow = { q: [], done: false, error: null, report: null };
W.__CF_HYBRID_MATRIX__ = state;

const NATIVE = 440;
const CARD = 332;
const STAGE_ORDER = ['pure', 'earth-earth', 'earth-alien', 'next-alien', 'floor'] as const;
const ANCHORS = [1, 0.9, 0.73, 0.46, 0.22] as const;
/* Cache collision evidence must have genuinely different expected pixels.
   Apple's exact named owner is seed/name driven, so AB and BA can have distinct
   full genomes yet correctly paint the same pixels; using it here would make a
   seed-only cache test vacuous. Apple remains in the principal 13x5 matrix. */
const CACHE_SUBSET = new Set(['fruit-bat', 'eagle', 'wolf', 'elephant', 'great-white-shark', 'dragonfly']);
const OWNED_FAUNA_LINEAGES = new Set(['Fruit Bat', 'Eagle', 'Wolf', 'Elephant', 'Chameleon', 'Dragonfly', 'Octopus']);
const GENE_KEYS = ['kingdom', 'color', 'form', 'body', 'loco', 'trait', 'size', 'diet',
  'head', 'limbs', 'skin', 'tail', 'pattern', 'eyes', 'behavior', 'habitat',
  'detail', 'accent', 'lumin', 'heat'] as const;

type MixedOrder = 'earth-first' | 'earth-second' | 'flora-first' | 'microbe-first';
interface MixedRequest {
  ordinal: number;
  id: string;
  kind: 'single-lineage-owner' | 'duplicate-name-owner';
  name: 'Apple' | 'Wolf' | 'Green Algae';
  owner: EarthKingdom;
  other: EarthKingdom;
  order: MixedOrder;
  childKingdom: EarthKingdom;
  salt: number;
}

/* These are deliberately the same real-cross coverage cells as hybridBlendAudit:
   unique flora/fauna owners in both parent orders and both possible child sets,
   then Green Algae's current flora catalogue owner and retained legacy microbe
   route owner in both orders and both child sets. D-CAT-1 removed the microbe
   row from the live roster, but old saves can still carry that set-qualified
   Earth identity, so the route remains an intentional compatibility surface. */
const MIXED_REQUESTS: MixedRequest[] = [
  { ordinal: 1, id: 'apple-earth-first-child-flora', kind: 'single-lineage-owner', name: 'Apple', owner: 'flora', other: 'fauna', order: 'earth-first', childKingdom: 'flora', salt: 1 },
  { ordinal: 2, id: 'apple-earth-first-child-fauna', kind: 'single-lineage-owner', name: 'Apple', owner: 'flora', other: 'fauna', order: 'earth-first', childKingdom: 'fauna', salt: 2 },
  { ordinal: 3, id: 'apple-earth-second-child-flora', kind: 'single-lineage-owner', name: 'Apple', owner: 'flora', other: 'fauna', order: 'earth-second', childKingdom: 'flora', salt: 3 },
  { ordinal: 4, id: 'apple-earth-second-child-fauna', kind: 'single-lineage-owner', name: 'Apple', owner: 'flora', other: 'fauna', order: 'earth-second', childKingdom: 'fauna', salt: 4 },
  { ordinal: 5, id: 'wolf-earth-first-child-fauna', kind: 'single-lineage-owner', name: 'Wolf', owner: 'fauna', other: 'flora', order: 'earth-first', childKingdom: 'fauna', salt: 5 },
  { ordinal: 6, id: 'wolf-earth-first-child-flora', kind: 'single-lineage-owner', name: 'Wolf', owner: 'fauna', other: 'flora', order: 'earth-first', childKingdom: 'flora', salt: 6 },
  { ordinal: 7, id: 'wolf-earth-second-child-fauna', kind: 'single-lineage-owner', name: 'Wolf', owner: 'fauna', other: 'flora', order: 'earth-second', childKingdom: 'fauna', salt: 7 },
  { ordinal: 8, id: 'wolf-earth-second-child-flora', kind: 'single-lineage-owner', name: 'Wolf', owner: 'fauna', other: 'flora', order: 'earth-second', childKingdom: 'flora', salt: 8 },
  ...(['flora-first', 'microbe-first'] as const).flatMap((order, orderIndex) =>
    (['flora', 'microbe'] as const).flatMap((owner, ownerIndex) =>
      (['flora', 'microbe'] as const).map((childKingdom, childIndex) => {
        const ordinal = 9 + orderIndex * 4 + ownerIndex * 2 + childIndex;
        return {
          ordinal,
          id: `green-algae-${order}-owner-${owner}-child-${childKingdom}`,
          kind: 'duplicate-name-owner' as const,
          name: 'Green Algae' as const,
          owner,
          other: owner === 'flora' ? 'microbe' as const : 'flora' as const,
          order,
          childKingdom,
          salt: 20 + orderIndex * 4 + ownerIndex * 2 + childIndex,
        };
      }))),
];

const L: LineageSpec[] = [
  {
    id: 'fruit-bat', species: 'Fruit Bat', display: 'Fruit Bat', kingdom: 'fauna',
    challenge: 'head-graft',
    joins: 'shoulder-wrist-finger membrane; ankle web; ear/head',
    crops: [
      { id: 'left-shoulder', label: 'left shoulder / membrane root', x: 92, y: 185, w: 55, h: 55 },
      { id: 'right-shoulder', label: 'right shoulder / membrane root', x: 293, y: 185, w: 55, h: 55 },
      { id: 'head-ear', label: 'head / ear / tragus', x: 192, y: 105, w: 55, h: 55 },
      { id: 'ankle-web', label: 'ankle / uropatagium', x: 192, y: 286, w: 55, h: 55 },
    ],
  },
  {
    id: 'eagle', species: 'Eagle', display: 'Eagle', kingdom: 'fauna',
    challenge: 'dorsal-tail', joins: 'shoulder/wing root; folded layered feathers; beak/head; belly/leg root',
    crops: [
      { id: 'shoulder-wing-root', label: 'shoulder / wing root', x: 166, y: 166, w: 55, h: 55 },
      { id: 'folded-wing', label: 'folded wing / layered feathers', x: 220, y: 210, w: 55, h: 55 },
      { id: 'beak-head', label: 'beak / head', x: 95, y: 112, w: 55, h: 55 },
      { id: 'belly-leg-root', label: 'belly / leg root', x: 176, y: 286, w: 55, h: 55 },
    ],
  },
  {
    id: 'wolf', species: 'Wolf', display: 'Wolf', kingdom: 'fauna',
    challenge: 'palette-contrast', joins: 'neck/head; ears; four legs; tail',
    crops: [
      { id: 'neck-head', label: 'neck / head', x: 274, y: 161, w: 55, h: 55 },
      { id: 'front-leg', label: 'front leg / chest', x: 271, y: 263, w: 55, h: 55 },
      { id: 'rear-leg', label: 'rear leg / hip', x: 126, y: 267, w: 55, h: 55 },
      { id: 'tail-hip', label: 'tail / hip', x: 80, y: 197, w: 55, h: 55 },
    ],
  },
  {
    id: 'elephant', species: 'Elephant', display: 'Elephant', kingdom: 'fauna',
    challenge: 'head-graft', joins: 'trunk/head; tusk roots; ear/head; pillar legs',
    crops: [
      { id: 'trunk-head', label: 'trunk / face', x: 276, y: 176, w: 55, h: 55 },
      { id: 'tusk-root', label: 'tusk root / cheek', x: 269, y: 216, w: 55, h: 55 },
      { id: 'ear-head', label: 'ear / head', x: 232, y: 154, w: 55, h: 55 },
      { id: 'front-leg', label: 'front leg / chest', x: 250, y: 276, w: 55, h: 55 },
    ],
  },
  {
    id: 'sea-turtle', species: 'Sea Turtle', display: 'Sea Turtle', kingdom: 'fauna',
    challenge: 'extra-eyes', joins: 'shell/neck; four flippers; tail',
    crops: [
      { id: 'neck-shell', label: 'neck / shell', x: 286, y: 194, w: 55, h: 55 },
      { id: 'left-foreflipper', label: 'foreflipper / shell', x: 252, y: 262, w: 55, h: 55 },
      { id: 'rear-flipper', label: 'rear flipper / shell', x: 125, y: 258, w: 55, h: 55 },
      { id: 'tail-shell', label: 'tail / shell', x: 99, y: 211, w: 55, h: 55 },
    ],
  },
  {
    id: 'great-white-shark', species: 'Great White Shark', display: 'Great White Shark', kingdom: 'fauna',
    challenge: 'dorsal-tail', joins: 'pectoral/dorsal fins; head/body; caudal peduncle',
    crops: [
      { id: 'head-body', label: 'head / body', x: 275, y: 191, w: 55, h: 55 },
      { id: 'dorsal-fin', label: 'dorsal fin root', x: 203, y: 135, w: 55, h: 55 },
      { id: 'pectoral-fin', label: 'pectoral fin root', x: 223, y: 245, w: 55, h: 55 },
      { id: 'tail-peduncle', label: 'tail / peduncle', x: 92, y: 198, w: 55, h: 55 },
    ],
  },
  {
    id: 'chameleon', species: 'Chameleon', display: 'Chameleon', kingdom: 'fauna',
    challenge: 'head-graft', joins: 'limb/body; grasping feet; tail; crest/frill',
    crops: [
      { id: 'head-casque', label: 'head / casque', x: 218, y: 125, w: 55, h: 55 },
      { id: 'front-limb-root', label: 'front limb / body root', x: 198, y: 180, w: 55, h: 55 },
      { id: 'rear-foot-grip', label: 'rear foot / branch grip', x: 151, y: 218, w: 55, h: 55 },
      { id: 'tail-body', label: 'tail / body root', x: 124, y: 174, w: 55, h: 55 },
    ],
  },
  {
    id: 'dragonfly', species: 'Dragonfly', display: 'Dragonfly', kingdom: 'fauna',
    challenge: 'extra-eyes', joins: 'upper/lower wing roots; six legs; head/thorax',
    crops: [
      { id: 'upper-wing-root', label: 'upper wing / thorax root', x: 178, y: 120, w: 55, h: 55 },
      { id: 'lower-wing-root', label: 'lower wing / thorax root', x: 178, y: 150, w: 55, h: 55 },
      { id: 'head-thorax', label: 'head / thorax', x: 126, y: 133, w: 55, h: 55 },
      { id: 'legs-thorax', label: 'legs / thorax', x: 145, y: 149, w: 55, h: 55 },
    ],
  },
  {
    id: 'octopus', species: 'Octopus', display: 'Octopus', kingdom: 'fauna',
    challenge: 'bulk-length', joins: 'eight arm roots into mantle/head',
    crops: [
      { id: 'left-arms', label: 'left arm roots', x: 128, y: 251, w: 55, h: 55 },
      { id: 'right-arms', label: 'right arm roots', x: 257, y: 251, w: 55, h: 55 },
      { id: 'mantle-head', label: 'mantle / head', x: 192, y: 153, w: 55, h: 55 },
      { id: 'central-arms', label: 'central arm roots', x: 193, y: 274, w: 55, h: 55 },
    ],
  },
  {
    id: 'apple', species: 'Apple', display: 'Apple', kingdom: 'flora',
    challenge: 'palette-contrast', joins: 'trunk/branch/leaf and fruit organ roots',
    crops: [
      { id: 'trunk-branch', label: 'trunk / branch', x: 193, y: 218, w: 55, h: 55 },
      { id: 'left-branch', label: 'left branch / canopy', x: 132, y: 173, w: 55, h: 55 },
      { id: 'right-branch', label: 'right branch / canopy', x: 254, y: 173, w: 55, h: 55 },
      { id: 'fruit-stem', label: 'fruit / stem / twig', x: 240, y: 130, w: 55, h: 55 },
    ],
  },
  {
    id: 'vanilla-orchid', species: 'Vanilla Orchid', display: 'Orchid (Vanilla Orchid)', kingdom: 'flora',
    challenge: 'head-graft', joins: 'stem/leaf/flower emergence and overlap',
    crops: [
      { id: 'root-stem', label: 'root / stem', x: 193, y: 300, w: 55, h: 55 },
      { id: 'left-leaf', label: 'left leaf / stem', x: 154, y: 226, w: 55, h: 55 },
      { id: 'right-leaf', label: 'right leaf / stem', x: 230, y: 220, w: 55, h: 55 },
      { id: 'flower-stem', label: 'flower / stem', x: 193, y: 129, w: 55, h: 55 },
    ],
  },
  {
    id: 'oyster-mushroom', species: 'Oyster Mushroom', display: 'Mushroom (Oyster Mushroom)', kingdom: 'fungi',
    challenge: 'bulk-length', joins: 'stem/cap/gill connection and colony overlap',
    crops: [
      { id: 'left-cap-stem', label: 'left cap / stem', x: 115, y: 201, w: 55, h: 55 },
      { id: 'centre-cap-stem', label: 'centre cap / stem', x: 193, y: 164, w: 55, h: 55 },
      { id: 'right-cap-stem', label: 'right cap / stem', x: 271, y: 211, w: 55, h: 55 },
      { id: 'colony-base', label: 'colony overlap / base', x: 192, y: 286, w: 55, h: 55 },
    ],
  },
  {
    id: 'amoeba', species: 'Amoeba', display: 'Microbe (Amoeba)', kingdom: 'microbe',
    challenge: 'extra-eyes', joins: 'membrane/pseudopods; nucleus; vacuoles; colony edge',
    crops: [
      { id: 'leading-pseudopod', label: 'leading pseudopod / membrane', x: 20, y: 200, w: 55, h: 55 },
      { id: 'upper-lobes', label: 'upper lobe / membrane', x: 205, y: 92, w: 55, h: 55 },
      { id: 'nucleus', label: 'nucleus / vacuoles', x: 200, y: 190, w: 55, h: 55 },
      { id: 'trailing-lobes', label: 'trailing membrane / satellite edge', x: 345, y: 155, w: 55, h: 55 },
    ],
  },
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function canonical(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return '{' + Object.keys(object).sort()
      .map((key) => JSON.stringify(key) + ':' + canonical(object[key])).join(',') + '}';
  }
  if (value === undefined) return 'undefined';
  return JSON.stringify(value);
}
async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  /* TypeScript 7 correctly keeps Uint8Array's backing store generic over
     ArrayBufferLike. Web Crypto accepts only a BufferSource backed by a real
     ArrayBuffer, so make that boundary explicit instead of asserting away a
     possible SharedArrayBuffer. */
  const input = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(input).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
async function sha256Genome(genome: Genome): Promise<string> {
  return sha256Bytes(new TextEncoder().encode(canonical(genome)));
}
async function pngSha256(url: string): Promise<string> {
  const prefix = 'data:image/png;base64,';
  assert(url.startsWith(prefix), 'renderer returned a non-PNG data URL');
  const binary = atob(url.slice(prefix.length));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return sha256Bytes(bytes);
}
function withoutLineage(genome: Genome): Genome {
  const stripped = { ...genome };
  delete stripped._earthName;
  delete stripped._earthBlend;
  delete stripped._earthBlendKingdom;
  delete stripped._anchorVal;
  delete stripped._src;
  return stripped;
}
function routeName(genome: Genome, owned: string | null): RouteKind {
  if (typeof genome._earthName === 'string') return owned ? 'named-owned' : 'named-verbatim';
  if (typeof genome._earthBlend === 'string') return owned ? 'lineage-owned' : 'lineage-verbatim';
  return owned ? 'procedural-owned' : 'procedural-verbatim';
}
function freshRender(genome: Genome): { url: string; route: RouteKind; owned: boolean } {
  const ownedUrl = resolveOverride(genome);
  return {
    url: ownedUrl ?? verbatimSpeciesPortraitForAudit(genome),
    route: routeName(genome, ownedUrl),
    owned: ownedUrl !== null,
  };
}
async function renderOutcome(genome: Genome): Promise<Record<string, unknown> & { url: string }> {
  const first = freshRender(genome);
  const second = freshRender(genome);
  assert(first.url === second.url, `fresh renderer nondeterminism for seed ${String(genome.seed)}`);
  assert(first.route === second.route, `renderer route nondeterminism for seed ${String(genome.seed)}`);
  const production = speciesPortrait(genome);
  assert(production === first.url, `production cache disagrees with fresh renderer for seed ${String(genome.seed)}`);
  const repeat = speciesPortrait(genome);
  assert(repeat === production, `production repeat changed for seed ${String(genome.seed)}`);
  const portraitSha256 = await pngSha256(production);
  let stripped: Record<string, unknown> | null = null;
  if (typeof genome._earthBlend === 'string') {
    const strippedGenome = withoutLineage(genome);
    const strippedFresh = freshRender(strippedGenome);
    assert(strippedFresh.url !== production,
      `hybrid bypass negative control did not differ for ${String(genome._earthBlend)} seed ${String(genome.seed)}`);
    stripped = {
      route: strippedFresh.route,
      portrait_sha256: await pngSha256(strippedFresh.url),
      differs_from_lineage: true,
    };
  }
  return {
    url: production,
    route: first.route,
    owned: first.owned,
    production_matches_fresh: true,
    repeated_render_stable: true,
    portrait_sha256: portraitSha256,
    stripped_lineage_control: stripped,
  };
}
function sameGenome(a: Genome, b: Genome): boolean { return canonical(a) === canonical(b); }
function expectedAnchor(value: unknown, expected: number, where: string): void {
  assert(typeof value === 'number' && Math.abs(value - expected) < 1e-9,
    `${where}: expected anchor ${expected}, got ${String(value)}`);
}
function challengeSatisfied(challenge: Challenge, pure: Genome, alien: Genome, child: Genome): boolean {
  const src = child._src as Record<string, unknown> | undefined;
  if (!src) return false;
  if (challenge === 'head-graft') {
    const kind = Number(child.head) % 10;
    return src.head === 1 && [3, 5, 7, 9].includes(kind);
  }
  if (challenge === 'extra-eyes') {
    const eyeIndex = Number(child.eyes) % 6;
    return src.eyes === 1 && eyeIndex >= 3;
  }
  if (challenge === 'palette-contrast') {
    return src.color === 1 && Number(child.color) !== Number(pure.color)
      && Math.abs(Number(alien.color) - Number(pure.color)) >= 2;
  }
  if (challenge === 'bulk-length') {
    return (src.size === 1 || src.body === 1)
      && (Number(child.size) !== Number(pure.size) || Number(child.body) !== Number(pure.body));
  }
  const tailKind = Number(child.tail) % 7;
  return src.tail === 1 && [2, 3, 4, 5, 6].includes(tailKind);
}
function alienSeed(row: number, slot: number, attempt: number): number {
  return hashInt(0xA11E57, row * 10000 + slot * 1000 + attempt, 0x4D) >>> 0;
}
function findAlienCross(parent: Genome, pure: Genome, spec: LineageSpec, row: number, slot: number): {
  alien: Genome; child: Genome; attempt: number; heat: number; seed: number;
} {
  for (let attempt = 0; attempt < 512; attempt++) {
    const seed = alienSeed(row, slot, attempt);
    const heat = (row + slot + attempt) % 3;
    const alien = makeGenome(seed, spec.kingdom, heat) as unknown as Genome;
    assert(alien._earthName === undefined && alien._earthBlend === undefined && alien._anchorVal === undefined,
      `${spec.id}: makeGenome returned carried lineage metadata`);
    const child = crossGenome(parent as never, alien as never) as unknown as Genome;
    if (child.kingdom !== spec.kingdom || child._earthBlend !== spec.species
      || child._earthBlendKingdom !== spec.kingdom) continue;
    if (challengeSatisfied(spec.challenge, pure, alien, child)) return { alien, child, attempt, heat, seed };
  }
  throw new Error(`${spec.id}: no ${spec.challenge} alien cross found in 512 deterministic attempts`);
}
function catalogueGenome(spec: LineageSpec): { genome: Genome; catalogueIndex: number; kingdomIndex: number; seed: number } {
  const roster = _EARTH_NAMES as unknown as Record<string, readonly string[]>;
  const kingdoms = Object.keys(roster);
  const kingdomIndex = kingdoms.indexOf(spec.kingdom);
  assert(kingdomIndex >= 0, `${spec.id}: missing catalogue kingdom ${spec.kingdom}`);
  const names = roster[spec.kingdom];
  assert(Array.isArray(names), `${spec.id}: catalogue set ${spec.kingdom} is not an array`);
  const matches = names.reduce<number[]>((found, name, index) => {
    if (name === spec.species) found.push(index);
    return found;
  }, []);
  assert(matches.length === 1,
    `${spec.id}: expected exactly one exact catalogue match for ${spec.kingdom}/${spec.species}, got ${matches.length}`);
  const catalogueIndex = matches[0]!;
  const seed = hashInt(0xEA47, catalogueIndex, kingdomIndex) >>> 0;
  const genome = makeGenome(seed, spec.kingdom, 1) as unknown as Genome;
  genome._earthName = spec.species;
  assert(genome._earthBlend === undefined && genome._anchorVal === undefined,
    `${spec.id}: pure catalogue genome carried hybrid metadata`);
  return { genome, catalogueIndex, kingdomIndex, seed };
}
function earthMateGenome(spec: LineageSpec, row: number, catalogueIndex: number): { genome: Genome; seed: number } {
  const seed = hashInt(0xEA7E, row, catalogueIndex) >>> 0;
  const genome = makeGenome(seed, spec.kingdom, 1) as unknown as Genome;
  genome._earthName = spec.species;
  assert(genome._earthBlend === undefined && genome._anchorVal === undefined,
    `${spec.id}: Earth mate carried hybrid metadata`);
  return { genome, seed };
}
async function imageFrom(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('PNG data URL failed to decode'));
    image.src = url;
  });
}
function canvasUrl(canvas: HTMLCanvasElement): string {
  const url = canvas.toDataURL('image/png');
  assert(url.startsWith('data:image/png;base64,'), 'canvas did not return PNG data');
  return url;
}
async function cardUrl(url: string): Promise<string> {
  const image = await imageFrom(url);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = CARD;
  canvas.getContext('2d')!.drawImage(image, 0, 0, CARD, CARD);
  return canvasUrl(canvas);
}
async function silhouetteUrl(url: string): Promise<string> {
  const image = await imageFrom(url);
  const source = document.createElement('canvas'); source.width = source.height = NATIVE;
  const sc = source.getContext('2d', { willReadFrequently: true })!;
  sc.drawImage(image, 0, 0, NATIVE, NATIVE);
  const pixels = sc.getImageData(0, 0, NATIVE, NATIVE).data;
  const mask = new Uint8Array(NATIVE * NATIVE);
  for (let y = 5; y < NATIVE - 5; y++) {
    for (let x = 5; x < NATIVE - 5; x++) {
      const o = (y * NATIVE + x) * 4;
      const r = pixels[o]!, g = pixels[o + 1]!, b = pixels[o + 2]!;
      const hi = Math.max(r, g, b), lo = Math.min(r, g, b);
      const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
      if (lum > 43 || hi - lo > 24) mask[y * NATIVE + x] = 1;
    }
  }
  /* Two-pixel close: joins the illuminated rim around a dark subject, then
     fills enclosed dark material. This is a contrast silhouette diagnostic,
     not a production subject mask and never awards a seam verdict. */
  for (let pass = 0; pass < 2; pass++) {
    const next = mask.slice();
    for (let y = 1; y < NATIVE - 1; y++) for (let x = 1; x < NATIVE - 1; x++) {
      const i = y * NATIVE + x;
      if (mask[i]) continue;
      let neighbours = 0;
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) neighbours += mask[i + yy * NATIVE + xx]!;
      if (neighbours >= 3) next[i] = 1;
    }
    mask.set(next);
  }
  const outside = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  let head = 0, tail = 0;
  const push = (index: number): void => { if (!outside[index] && !mask[index]) { outside[index] = 1; queue[tail++] = index; } };
  for (let x = 0; x < NATIVE; x++) { push(x); push((NATIVE - 1) * NATIVE + x); }
  for (let y = 0; y < NATIVE; y++) { push(y * NATIVE); push(y * NATIVE + NATIVE - 1); }
  while (head < tail) {
    const index = queue[head++]!;
    const x = index % NATIVE, y = Math.floor(index / NATIVE);
    if (x > 0) push(index - 1); if (x + 1 < NATIVE) push(index + 1);
    if (y > 0) push(index - NATIVE); if (y + 1 < NATIVE) push(index + NATIVE);
  }
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = NATIVE;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#07101a'; c.fillRect(0, 0, NATIVE, NATIVE);
  const output = c.createImageData(NATIVE, NATIVE);
  for (let i = 0; i < mask.length; i++) {
    const filled = mask[i] || !outside[i];
    const o = i * 4;
    output.data[o] = filled ? 235 : 7;
    output.data[o + 1] = filled ? 242 : 16;
    output.data[o + 2] = filled ? 250 : 26;
    output.data[o + 3] = 255;
  }
  c.putImageData(output, 0, 0);
  return canvasUrl(canvas);
}
async function enqueue(item: QueueItem): Promise<void> {
  if (!EMIT) return;
  state.q.push(item);
  while (state.q.length > 6) await new Promise((resolve) => setTimeout(resolve, 40));
}
function makeInputRecord(id: string, genome: Genome, derivation: Record<string, unknown>): Record<string, unknown> {
  return { id, genome, derivation };
}
function exactCatalogueMatches(kingdom: EarthKingdom, name: string): number {
  const roster = _EARTH_NAMES as unknown as Record<EarthKingdom, readonly string[]>;
  const names = roster[kingdom];
  assert(Array.isArray(names), `mixed sentinel: missing Earth catalogue ${kingdom}`);
  return names.filter((candidate) => candidate === name).length;
}
function namedMixedGenome(seed: number, kingdom: EarthKingdom, name: string,
  ownerSource: 'current-catalogue' | 'deduped-legacy-route' = 'current-catalogue'): Genome {
  const matches = exactCatalogueMatches(kingdom, name);
  assert(matches === (ownerSource === 'current-catalogue' ? 1 : 0),
    `mixed sentinel: wrong ${ownerSource} membership for ${kingdom}/${name}`);
  const genome = makeGenome(seed >>> 0, kingdom, 1) as unknown as Genome;
  genome._earthName = name;
  assert(genome._earthBlend === undefined && genome._earthBlendKingdom === undefined
    && genome._anchorVal === undefined, `mixed sentinel: named ${kingdom}/${name} carried hybrid fields`);
  if (ownerSource === 'deduped-legacy-route') {
    const route = freshRender(genome);
    assert(route.owned && route.route === 'named-owned',
      `mixed sentinel: retained legacy owner ${kingdom}/${name} has no named route`);
  }
  return genome;
}
function bareMixedGenome(seed: number, kingdom: EarthKingdom, heat: number): Genome {
  const genome = makeGenome(seed >>> 0, kingdom, heat) as unknown as Genome;
  assert(genome._earthName === undefined && genome._earthBlend === undefined
    && genome._earthBlendKingdom === undefined && genome._anchorVal === undefined,
  `mixed sentinel: bare ${kingdom} input carried lineage fields`);
  return genome;
}
function expectedLineageRoute(owner: EarthKingdom, name: string): RouteKind {
  return owner === 'fauna' && !OWNED_FAUNA_LINEAGES.has(name)
    ? 'lineage-verbatim'
    : 'lineage-owned';
}
function expectedMarkerlessLineageRoute(owner: EarthKingdom): RouteKind {
  return owner === 'fauna' ? 'lineage-verbatim' : 'lineage-owned';
}
async function completeInputRecord(id: string, genome: Genome,
  derivation: Record<string, unknown>): Promise<Record<string, unknown>> {
  return { ...makeInputRecord(id, genome, derivation), genome_sha256: await sha256Genome(genome) };
}
async function mixedControl(genome: Genome, selectedUrl: string): Promise<Record<string, unknown>> {
  const fresh = freshRender(genome);
  const production = speciesPortrait(genome);
  const repeat = speciesPortrait(genome);
  assert(production === fresh.url, `mixed sentinel negative control cache bypass for seed ${String(genome.seed)}`);
  assert(repeat === production, `mixed sentinel negative control nondeterminism for seed ${String(genome.seed)}`);
  return {
    genome,
    genome_sha256: await sha256Genome(genome),
    route: fresh.route,
    portrait_sha256: await pngSha256(production),
    production_matches_fresh: true,
    repeated_render_stable: true,
    differs_from_selected_owner: production !== selectedUrl,
  };
}
async function findMixedSentinel(request: MixedRequest): Promise<Record<string, unknown> & { url: string }> {
  let found: { attempt: number; parents: Genome[]; parentIds: string[]; child: Genome;
    derivations: Record<string, unknown>[] } | null = null;
  for (let attempt = 0; attempt < 2048; attempt++) {
    let parents: Genome[], parentIds: string[], derivations: Record<string, unknown>[];
    if (request.kind === 'single-lineage-owner') {
      const earthSeed = hashInt(0xC2055, request.salt, attempt) >>> 0;
      const wildSeed = hashInt(0xA11E7, request.salt, attempt) >>> 0;
      const heat = attempt % 3;
      const earth = namedMixedGenome(earthSeed, request.owner, request.name);
      const wild = bareMixedGenome(wildSeed, request.other, heat);
      const earthDerivation = {
        kind: 'named-earth-seed-search', formula: 'hashInt(0xC2055,salt,attempt)',
        salt: request.salt, attempt, seed: earthSeed, heat: 1, exact_name_matches: 1,
        owner_source: 'current-catalogue', route_owner: `${request.owner}|${request.name}`,
      };
      const wildDerivation = {
        kind: 'alien-seed-search', formula: 'hashInt(0xA11E7,salt,attempt)',
        salt: request.salt, attempt, seed: wildSeed, heat,
      };
      if (request.order === 'earth-first') {
        parents = [earth, wild]; parentIds = ['earth', 'wild'];
        derivations = [earthDerivation, wildDerivation];
      } else {
        parents = [wild, earth]; parentIds = ['wild', 'earth'];
        derivations = [wildDerivation, earthDerivation];
      }
    } else {
      const floraSeed = hashInt(0x6A1A, request.salt, attempt) >>> 0;
      const microbeSeed = hashInt(0x6A1B, request.salt, attempt) >>> 0;
      const flora = namedMixedGenome(floraSeed, 'flora', 'Green Algae', 'current-catalogue');
      const microbe = namedMixedGenome(microbeSeed, 'microbe', 'Green Algae', 'deduped-legacy-route');
      const floraDerivation = {
        kind: 'named-earth-seed-search', formula: 'hashInt(0x6A1A,salt,attempt)',
        salt: request.salt, attempt, seed: floraSeed, heat: 1, exact_name_matches: 1,
        owner_source: 'current-catalogue', route_owner: 'flora|Green Algae',
      };
      const microbeDerivation = {
        kind: 'legacy-named-route-seed-search', formula: 'hashInt(0x6A1B,salt,attempt)',
        salt: request.salt, attempt, seed: microbeSeed, heat: 1, exact_name_matches: 0,
        owner_source: 'deduped-legacy-route', route_owner: 'microbe|Green Algae',
        route_owner_verified: true,
      };
      if (request.order === 'flora-first') {
        parents = [flora, microbe]; parentIds = ['flora-earth', 'microbe-earth'];
        derivations = [floraDerivation, microbeDerivation];
      } else {
        parents = [microbe, flora]; parentIds = ['microbe-earth', 'flora-earth'];
        derivations = [microbeDerivation, floraDerivation];
      }
    }
    const child = crossGenome(parents[0] as never, parents[1] as never) as unknown as Genome;
    if (child.kingdom === request.childKingdom && child._earthBlend === request.name
      && child._earthBlendKingdom === request.owner) {
      found = { attempt, parents, parentIds, child, derivations };
      break;
    }
  }
  assert(found, `${request.id}: no real mixed-kingdom sentinel found in 2048 deterministic attempts`);
  const repeated = crossGenome(found.parents[0] as never, found.parents[1] as never) as unknown as Genome;
  assert(sameGenome(found.child, repeated), `${request.id}: repeated production cross changed`);
  assert(Array.isArray(found.child.parents)
    && canonical(found.child.parents) === canonical(found.parents.map((parent) => parent.seed)),
  `${request.id}: production parent seed order changed`);
  const anchor = request.kind === 'duplicate-name-owner' ? 0.9 : 0.73;
  expectedAnchor(found.child._anchorVal, anchor, request.id);
  assert(found.child._earthName === undefined && found.child._earthBlend === request.name
    && found.child._earthBlendKingdom === request.owner,
  `${request.id}: selected Earth lineage owner was not preserved`);

  const outcome = await renderOutcome(found.child);
  const expectedRoute = expectedLineageRoute(request.owner, request.name);
  assert(outcome.route === expectedRoute,
    `${request.id}: production route ${String(outcome.route)} did not follow ${request.owner} lineage owner`);
  const strippedGenome = withoutLineage(found.child);
  const strippedControl = await mixedControl(strippedGenome, outcome.url);
  assert(strippedControl.differs_from_selected_owner === true,
    `${request.id}: stripped-lineage injected bypass matched selected-owner pixels`);
  const markerlessGenome = { ...found.child };
  delete markerlessGenome._earthBlendKingdom;
  const markerlessControl = await mixedControl(markerlessGenome, outcome.url);
  const legacyFallbackOwner = request.kind === 'duplicate-name-owner' ? request.childKingdom : request.owner;
  assert(markerlessControl.route === expectedMarkerlessLineageRoute(legacyFallbackOwner),
    `${request.id}: markerless legacy fallback route changed`);

  let counterfactualOwnerControl: Record<string, unknown> | null = null;
  if (request.kind === 'duplicate-name-owner') {
    const counterfactual = { ...found.child, _earthBlendKingdom: request.other };
    counterfactualOwnerControl = await mixedControl(counterfactual, outcome.url);
    assert(counterfactualOwnerControl.route === expectedLineageRoute(request.other, request.name),
      `${request.id}: counterfactual duplicate owner route changed`);
    assert(counterfactualOwnerControl.differs_from_selected_owner === true,
      `${request.id}: duplicate Green Algae owner selection did not change pixels`);
    if (request.childKingdom !== request.owner) {
      assert(markerlessControl.differs_from_selected_owner === true,
        `${request.id}: removing required duplicate owner marker did not change pixels`);
    }
  }

  const inputs = await Promise.all(found.parents.map((parent, index) =>
    completeInputRecord(found!.parentIds[index]!, parent, found!.derivations[index]!)));
  const portraitPath = `mixed-kingdom/${String(request.ordinal).padStart(2, '0')}-${request.id}.png`;
  return {
    ordinal: request.ordinal,
    sentinel_id: request.id,
    sentinel_kind: request.kind,
    species: request.name,
    selected_lineage_owner: request.owner,
    other_parent_kingdom: request.other,
    parent_order: request.order,
    expected_child_kingdom: request.childKingdom,
    search: {
      kind: 'deterministic-seed-search', salt: request.salt, attempt: found.attempt,
      limit: 2048,
    },
    inputs,
    cross: { function: 'crossGenome', parent_a: found.parentIds[0], parent_b: found.parentIds[1] },
    child_genome: found.child,
    child_genome_sha256: await sha256Genome(found.child),
    child_kingdom: found.child.kingdom,
    lineage: found.child._earthBlend,
    lineage_kingdom: found.child._earthBlendKingdom,
    anchor,
    route: outcome.route,
    expected_route: expectedRoute,
    production_matches_fresh: outcome.production_matches_fresh,
    repeated_render_stable: outcome.repeated_render_stable,
    repeated_cross_stable: true,
    portrait_sha256: outcome.portrait_sha256,
    portrait_path: portraitPath,
    stripped_lineage_control: strippedControl,
    missing_owner_marker_control: {
      ...markerlessControl,
      expected_legacy_owner: legacyFallbackOwner,
      required_to_differ: request.kind === 'duplicate-name-owner'
        && request.childKingdom !== request.owner,
    },
    counterfactual_owner_control: counterfactualOwnerControl,
    visual_review_status: 'UNREVIEWED',
    url: outcome.url,
  };
}
async function makeLineageSheet(spec: LineageSpec, cells: Array<Record<string, unknown> & { url: string }>,
  cards: string[], silhouettes: string[]): Promise<{ url: string; width: number; height: number }> {
  const width = NATIVE * 5, height = 1180;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#070a12'; c.fillRect(0, 0, width, height);
  c.fillStyle = '#e9f2ff'; c.font = '700 24px system-ui'; c.textAlign = 'left';
  c.fillText(`${spec.display} - production-derived lineage continuity (UNREVIEWED)`, 18, 31);
  c.fillStyle = '#9fb5ce'; c.font = '14px system-ui';
  c.fillText(`Challenge: ${spec.challenge}; joins: ${spec.joins}`, 18, 55);
  const portraits = await Promise.all(cells.map((cell) => imageFrom(cell.url)));
  const cardImages = await Promise.all(cards.map(imageFrom));
  const silhouetteImages = await Promise.all(silhouettes.map(imageFrom));
  for (let i = 0; i < 5; i++) {
    const cell = cells[i]!;
    const x = i * NATIVE;
    c.fillStyle = '#bcd0e7'; c.font = '600 16px system-ui'; c.textAlign = 'center';
    c.fillText(String(cell.stage_label), x + NATIVE / 2, 82);
    c.fillStyle = '#829ab5'; c.font = '12px ui-monospace, monospace';
    c.fillText(`anchor ${Number(cell.anchor).toFixed(2)} | ${String(cell.route)}`, x + NATIVE / 2, 101);
    c.drawImage(portraits[i]!, x, 112, NATIVE, NATIVE);
    /* No text touches this actual-card-size view. */
    c.drawImage(cardImages[i]!, x + (NATIVE - CARD) / 2, 584, CARD, CARD);
    c.drawImage(silhouetteImages[i]!, x + 110, 944, 220, 220);
  }
  c.fillStyle = '#7189a4'; c.font = '12px system-ui'; c.textAlign = 'left';
  c.fillText('Middle row: unlabelled 332px detail-card view. Bottom: contrast silhouette diagnostic, not a subject mask.', 18, 935);
  return { url: canvasUrl(canvas), width, height };
}
async function makeJoinAtlas(spec: LineageSpec, cells: Array<Record<string, unknown> & { url: string }>): Promise<{ url: string; width: number; height: number }> {
  const tile = 220, left = 190, top = 56, rowGap = 28;
  const width = left + tile * 5, height = top + spec.crops.length * (tile + rowGap);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#070a12'; c.fillRect(0, 0, width, height);
  c.fillStyle = '#e9f2ff'; c.font = '700 20px system-ui'; c.textAlign = 'left';
  c.fillText(`${spec.display} - declared joins at exact 4x`, 12, 28);
  const images = await Promise.all(cells.map((cell) => imageFrom(cell.url)));
  for (let stage = 0; stage < 5; stage++) {
    c.fillStyle = '#9fb5ce'; c.font = '600 13px system-ui'; c.textAlign = 'center';
    c.fillText(String(cells[stage]!.stage_label), left + stage * tile + tile / 2, 49);
  }
  for (let row = 0; row < spec.crops.length; row++) {
    const crop = spec.crops[row]!;
    const y = top + row * (tile + rowGap);
    c.fillStyle = '#9fb5ce'; c.font = '12px system-ui'; c.textAlign = 'left';
    c.fillText(crop.label, 12, y + 96);
    c.fillStyle = '#627a96'; c.font = '11px ui-monospace, monospace';
    c.fillText(`[${crop.x},${crop.y},${crop.w},${crop.h}]`, 12, y + 114);
    for (let stage = 0; stage < 5; stage++) {
      c.imageSmoothingEnabled = false;
      c.drawImage(images[stage]!, crop.x, crop.y, crop.w, crop.h,
        left + stage * tile, y, tile, tile);
      c.imageSmoothingEnabled = true;
      c.strokeStyle = '#31445b'; c.strokeRect(left + stage * tile + 0.5, y + 0.5, tile - 1, tile - 1);
    }
  }
  return { url: canvasUrl(canvas), width, height };
}
async function findCacheControl(spec: LineageSpec, pure: Genome, row: number): Promise<Record<string, unknown> & {
  ab_url: string; ba_url: string;
}> {
  for (let attempt = 0; attempt < 256; attempt++) {
    const seed = hashInt(0xCA6E, row, attempt) >>> 0;
    const heat = (row + attempt) % 3;
    const alien = makeGenome(seed, spec.kingdom, heat) as unknown as Genome;
    const ab = crossGenome(pure as never, alien as never) as unknown as Genome;
    const ba = crossGenome(alien as never, pure as never) as unknown as Genome;
    if (ab.seed !== ba.seed || sameGenome(ab, ba)) continue;
    if (ab._earthBlend !== spec.species || ba._earthBlend !== spec.species
      || ab._earthBlendKingdom !== spec.kingdom || ba._earthBlendKingdom !== spec.kingdom) continue;
    const differingFields = GENE_KEYS.filter((key) => canonical(ab[key]) !== canonical(ba[key]));
    if (!differingFields.length) continue;
    const freshAB = freshRender(ab), freshBA = freshRender(ba);
    if (freshAB.url === freshBA.url) continue;
    /* Exercise the production cache in both orders. REVERSE flips the first
       writer on the reload pass, so a seed-only cache fails one of the runs. */
    const firstGenome = REVERSE ? ba : ab, secondGenome = REVERSE ? ab : ba;
    const firstExpected = REVERSE ? freshBA.url : freshAB.url;
    const secondExpected = REVERSE ? freshAB.url : freshBA.url;
    assert(speciesPortrait(firstGenome) === firstExpected, `${spec.id}: first cache-order render collided`);
    assert(speciesPortrait(secondGenome) === secondExpected, `${spec.id}: second cache-order render collided`);
    assert(speciesPortrait(ab) === freshAB.url && speciesPortrait(ba) === freshBA.url,
      `${spec.id}: repeated cache-order render changed`);
    return {
      lineage_id: spec.id,
      species: spec.species,
      input_order_first: REVERSE ? 'BA' : 'AB',
      alien: makeInputRecord('cache-alien', alien, {
        kind: 'makeGenome', formula: 'hashInt(0xCA6E,row,attempt)', row, attempt, heat, seed,
      }),
      same_seed: true,
      seed: ab.seed,
      different_full_genomes: true,
      differing_fields: differingFields,
      ab_genome: ab,
      ba_genome: ba,
      ab_genome_sha256: await sha256Genome(ab),
      ba_genome_sha256: await sha256Genome(ba),
      ab_portrait_sha256: await pngSha256(freshAB.url),
      ba_portrait_sha256: await pngSha256(freshBA.url),
      cache_independent: true,
      ab_route: freshAB.route,
      ba_route: freshBA.route,
      ab_url: freshAB.url,
      ba_url: freshBA.url,
    };
  }
  throw new Error(`${spec.id}: could not find a same-seed/different-trait cache control`);
}
async function makeCacheSheet(rows: Array<Record<string, unknown> & { ab_url: string; ba_url: string }>): Promise<{ url: string; width: number; height: number }> {
  const tile = 220, label = 240, header = 58, rowH = 246;
  const width = label + tile * 2, height = header + rows.length * rowH;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#070a12'; c.fillRect(0, 0, width, height);
  c.fillStyle = '#e9f2ff'; c.font = '700 20px system-ui'; c.textAlign = 'left';
  c.fillText('Reversed-parent cache controls (same seed, different inherited traits)', 12, 28);
  c.fillStyle = '#9fb5ce'; c.font = '600 13px system-ui'; c.textAlign = 'center';
  c.fillText('Earth x alien (AB)', label + tile / 2, 50);
  c.fillText('Alien x Earth (BA)', label + tile + tile / 2, 50);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const y = header + i * rowH;
    const [ab, ba] = await Promise.all([imageFrom(row.ab_url), imageFrom(row.ba_url)]);
    c.fillStyle = '#c9d9eb'; c.font = '600 14px system-ui'; c.textAlign = 'left';
    c.fillText(String(row.species), 12, y + 92);
    c.fillStyle = '#738ca8'; c.font = '11px ui-monospace, monospace';
    c.fillText(`seed ${String(row.seed)}`, 12, y + 111);
    c.fillText(String((row.differing_fields as string[]).join(', ')).slice(0, 31), 12, y + 130);
    c.drawImage(ab, label, y, tile, tile);
    c.drawImage(ba, label + tile, y, tile, tile);
  }
  return { url: canvasUrl(canvas), width, height };
}

async function makeMixedSheet(rows: Array<Record<string, unknown> & { url: string }>): Promise<{ url: string; width: number; height: number }> {
  assert(rows.length === 16, `mixed sentinel sheet expected 16 rows, got ${rows.length}`);
  const columns = 4, tile = 220, top = 80, rowH = 270;
  const width = columns * tile, height = top + 4 * rowH;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#070a12'; c.fillRect(0, 0, width, height);
  c.fillStyle = '#e9f2ff'; c.font = '700 20px system-ui'; c.textAlign = 'left';
  c.fillText('Mixed-kingdom lineage-owner sentinels (UNREVIEWED)', 12, 27);
  c.fillStyle = '#9fb5ce'; c.font = '12px system-ui';
  c.fillText('Rows 1-2: Apple/Wolf unique owners. Rows 3-4: duplicate Green Algae owners.', 12, 48);
  c.fillText('Labels bind parent order, selected owner, and independently inherited child kingdom.', 12, 65);
  const images = await Promise.all(rows.map((row) => imageFrom(row.url)));
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!;
    const x = (index % columns) * tile, y = top + Math.floor(index / columns) * rowH;
    c.fillStyle = '#bcd0e7'; c.font = '600 11px system-ui'; c.textAlign = 'center';
    c.fillText(`${String(row.species)} | ${String(row.parent_order)}`, x + tile / 2, y + 13);
    c.fillStyle = '#829ab5'; c.font = '10px ui-monospace, monospace';
    c.fillText(`owner ${String(row.selected_lineage_owner)} | child ${String(row.child_kingdom)}`,
      x + tile / 2, y + 29);
    c.drawImage(images[index]!, x, y + 42, tile, tile);
    c.strokeStyle = '#31445b'; c.strokeRect(x + 0.5, y + 42.5, tile - 1, tile - 1);
  }
  return { url: canvasUrl(canvas), width, height };
}

async function run(): Promise<void> {
  assert(L.length === 13, `matrix definition must contain 13 lineages, got ${L.length}`);
  assert(new Set(L.map((row) => row.id)).size === L.length, 'matrix definition has duplicate lineage ids');
  assert(new Set(L.map((row) => `${row.kingdom}\u0000${row.species}`)).size === L.length,
    'matrix definition has duplicate catalogue identities');
  const assets: Array<Omit<QueueItem, 'url'>> = [];
  const lineageReports: Array<Record<string, unknown>> = [];
  const cacheReports: Array<Record<string, unknown> & { ab_url: string; ba_url: string }> = [];
  const mixedReports: Array<Record<string, unknown> & { url: string }> = [];
  const rows = REVERSE ? L.map((row, index) => ({ row, index })).reverse()
    : L.map((row, index) => ({ row, index }));
  for (const [workIndex, item] of rows.entries()) {
    const spec = item.row, row = item.index;
    say(`hybrid matrix ${workIndex + 1}/${L.length}: ${spec.display}`);
    const pureInput = catalogueGenome(spec);
    const earthMateInput = earthMateGenome(spec, row, pureInput.catalogueIndex);
    const earthEarth = crossGenome(pureInput.genome as never, earthMateInput.genome as never) as unknown as Genome;
    expectedAnchor(earthEarth._anchorVal, 0.9, `${spec.id}/earth-earth`);
    assert(earthEarth._earthBlend === spec.species && earthEarth._earthBlendKingdom === spec.kingdom,
      `${spec.id}/earth-earth: lineage owner changed`);
    const alien1 = findAlienCross(pureInput.genome, pureInput.genome, spec, row, 1);
    expectedAnchor(alien1.child._anchorVal, 0.73, `${spec.id}/earth-alien`);
    const alien2 = findAlienCross(alien1.child, pureInput.genome, spec, row, 2);
    expectedAnchor(alien2.child._anchorVal, 0.46, `${spec.id}/next-alien`);
    const alien3 = findAlienCross(alien2.child, pureInput.genome, spec, row, 3);
    expectedAnchor(alien3.child._anchorVal, 0.22, `${spec.id}/floor`);
    assert(sameGenome(earthEarth,
      crossGenome(pureInput.genome as never, earthMateInput.genome as never) as unknown as Genome),
    `${spec.id}/earth-earth: repeated production cross changed`);
    assert(sameGenome(alien1.child,
      crossGenome(pureInput.genome as never, alien1.alien as never) as unknown as Genome),
    `${spec.id}/earth-alien: repeated production cross changed`);
    assert(sameGenome(alien2.child,
      crossGenome(alien1.child as never, alien2.alien as never) as unknown as Genome),
    `${spec.id}/next-alien: repeated production cross changed`);
    assert(sameGenome(alien3.child,
      crossGenome(alien2.child as never, alien3.alien as never) as unknown as Genome),
    `${spec.id}/floor: repeated production cross changed`);
    const genomes = [pureInput.genome, earthEarth, alien1.child, alien2.child, alien3.child];
    const stageLabels = ['Pure Earth', 'Earth x Earth', 'Earth x alien', 'Next alien cross', '0.22 floor'];
    const cells: Array<Record<string, unknown> & { url: string }> = [];
    const cards: string[] = [], silhouettes: string[] = [];
    for (let stageIndex = 0; stageIndex < genomes.length; stageIndex++) {
      const genome = genomes[stageIndex]!;
      assert(stageIndex === 0 ? genome._earthName === spec.species : genome._earthName === undefined,
        `${spec.id}/${STAGE_ORDER[stageIndex]}: pure/hybrid name provenance invalid`);
      assert(stageIndex === 0 ? genome._earthBlend === undefined : genome._earthBlend === spec.species,
        `${spec.id}/${STAGE_ORDER[stageIndex]}: lineage provenance invalid`);
      assert(stageIndex === 0 ? genome._earthBlendKingdom === undefined
        : genome._earthBlendKingdom === spec.kingdom,
      `${spec.id}/${STAGE_ORDER[stageIndex]}: lineage owner provenance invalid`);
      const outcome = await renderOutcome(genome);
      const portraitPath = `portraits/${spec.id}/${String(stageIndex + 1).padStart(2, '0')}-${STAGE_ORDER[stageIndex]}.png`;
      const cardPath = `cards/${spec.id}/${String(stageIndex + 1).padStart(2, '0')}-${STAGE_ORDER[stageIndex]}.png`;
      const silhouettePath = `silhouettes/${spec.id}/${String(stageIndex + 1).padStart(2, '0')}-${STAGE_ORDER[stageIndex]}.png`;
      const card = await cardUrl(outcome.url);
      const silhouette = await silhouetteUrl(outcome.url);
      cards.push(card); silhouettes.push(silhouette);
      const identity = `${spec.id}|${STAGE_ORDER[stageIndex]}`;
      for (const descriptor of [
        { path: portraitPath, kind: 'portrait' as const, width: NATIVE, height: NATIVE, identity, url: outcome.url },
        { path: cardPath, kind: 'card' as const, width: CARD, height: CARD, identity, url: card },
        { path: silhouettePath, kind: 'silhouette' as const, width: NATIVE, height: NATIVE, identity, url: silhouette },
      ]) {
        assets.push({ path: descriptor.path, kind: descriptor.kind, width: descriptor.width, height: descriptor.height, identity });
        await enqueue(descriptor);
      }
      cells.push({
        lineage_id: spec.id,
        identity,
        stage_id: STAGE_ORDER[stageIndex],
        stage_index: stageIndex,
        stage_label: stageLabels[stageIndex],
        anchor: ANCHORS[stageIndex],
        genome,
        genome_sha256: await sha256Genome(genome),
        portrait_path: portraitPath,
        card_path: cardPath,
        silhouette_path: silhouettePath,
        ...outcome,
      });
    }
    assert(new Set(cells.map((cell) => cell.genome_sha256)).size === 5,
      `${spec.id}: duplicate production genome identity across anchor stages`);
    const stagesByPixels = new Map<string, string[]>();
    for (const cell of cells) {
      const hash = String(cell.portrait_sha256);
      const stageIds = stagesByPixels.get(hash) ?? [];
      stageIds.push(String(cell.stage_id));
      stagesByPixels.set(hash, stageIds);
    }
    /* Byte-identical stages are a real continuity finding, not corrupt
       evidence. Preserve every exact genome/hash and mark the visual outcome
       FAIL/OPEN for human review instead of fabricating a differentiator. */
    const pixelIdentityGroups = [...stagesByPixels.entries()]
      .filter(([, stageIds]) => stageIds.length > 1)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([portraitSha256, stageIds]) => ({ portrait_sha256: portraitSha256, stage_ids: stageIds }));
    const sheet = await makeLineageSheet(spec, cells, cards, silhouettes);
    const sheetPath = `lineage-sheets/${String(row + 1).padStart(2, '0')}-${spec.id}.png`;
    const sheetAsset = { path: sheetPath, kind: 'lineage-sheet' as const, width: sheet.width, height: sheet.height, identity: spec.id, url: sheet.url };
    assets.push({ path: sheetPath, kind: sheetAsset.kind, width: sheet.width, height: sheet.height, identity: spec.id });
    await enqueue(sheetAsset);
    const joinAtlas = await makeJoinAtlas(spec, cells);
    const joinPath = `join-atlases/${String(row + 1).padStart(2, '0')}-${spec.id}.png`;
    const joinAsset = { path: joinPath, kind: 'join-atlas' as const, width: joinAtlas.width, height: joinAtlas.height, identity: spec.id, url: joinAtlas.url };
    assets.push({ path: joinPath, kind: joinAsset.kind, width: joinAtlas.width, height: joinAtlas.height, identity: spec.id });
    await enqueue(joinAsset);
    const inputs = [
      makeInputRecord('pure', pureInput.genome, {
        kind: 'catalogue-makeGenome', formula: 'hashInt(0xEA47,catalogueIndex,kingdomIndex)',
        kingdom_index: pureInput.kingdomIndex, catalogue_index: pureInput.catalogueIndex,
        heat: 1, seed: pureInput.seed, exact_name_matches: 1,
      }),
      makeInputRecord('earth-mate', earthMateInput.genome, {
        kind: 'named-earth-makeGenome', formula: 'hashInt(0xEA7E,row,catalogueIndex)',
        row, catalogue_index: pureInput.catalogueIndex, heat: 1, seed: earthMateInput.seed,
      }),
      makeInputRecord('alien-1', alien1.alien, {
        kind: 'alien-seed-search', formula: 'hashInt(0xA11E57,row*10000+slot*1000+attempt,0x4D)',
        row, slot: 1, attempt: alien1.attempt, heat: alien1.heat, seed: alien1.seed,
        predicate: spec.challenge,
      }),
      makeInputRecord('alien-2', alien2.alien, {
        kind: 'alien-seed-search', formula: 'hashInt(0xA11E57,row*10000+slot*1000+attempt,0x4D)',
        row, slot: 2, attempt: alien2.attempt, heat: alien2.heat, seed: alien2.seed,
        predicate: spec.challenge,
      }),
      makeInputRecord('alien-3', alien3.alien, {
        kind: 'alien-seed-search', formula: 'hashInt(0xA11E57,row*10000+slot*1000+attempt,0x4D)',
        row, slot: 3, attempt: alien3.attempt, heat: alien3.heat, seed: alien3.seed,
        predicate: spec.challenge,
      }),
    ];
    for (const input of inputs) input.genome_sha256 = await sha256Genome(input.genome as Genome);
    lineageReports.push({
      ordinal: row + 1,
      lineage_id: spec.id,
      set: `earth-${spec.kingdom}`,
      species: spec.species,
      challenge: spec.challenge,
      crop_contract: { source_pixels: 55, output_pixels: 220, scale: 4,
        coordinates: spec.crops.map(({ x, y, w, h }) => ({ x, y, w, h })) },
      stage_pixel_unique_count: stagesByPixels.size,
      pixel_identity_groups: pixelIdentityGroups,
      anchor_visual_differentiation: pixelIdentityGroups.length
        ? 'FAIL_BYTE_IDENTICAL_STAGES' : 'OPEN_UNREVIEWED',
      inputs,
      crosses: [
        { stage_id: 'earth-earth', parent_a: 'pure', parent_b: 'earth-mate' },
        { stage_id: 'earth-alien', parent_a: 'pure', parent_b: 'alien-1' },
        { stage_id: 'next-alien', parent_a: 'earth-alien', parent_b: 'alien-2' },
        { stage_id: 'floor', parent_a: 'next-alien', parent_b: 'alien-3' },
      ],
      stages: cells.map(({ url: _url, stage_label: _stageLabel, ...cell }) => cell),
      lineage_sheet: sheetPath,
      join_atlas: joinPath,
      visual_review_status: 'UNREVIEWED',
    });
    if (CACHE_SUBSET.has(spec.id)) cacheReports.push(await findCacheControl(spec, pureInput.genome, row));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  lineageReports.sort((a, b) => Number(a.ordinal) - Number(b.ordinal));
  cacheReports.sort((a, b) => String(a.lineage_id).localeCompare(String(b.lineage_id)));
  for (const cache of cacheReports) {
    const id = String(cache.lineage_id);
    for (const order of ['ab', 'ba'] as const) {
      const url = cache[`${order}_url`];
      const relative = `cache-controls/${id}-${order.toUpperCase()}.png`;
      const descriptor = { path: relative, kind: 'cache-portrait' as const, width: NATIVE, height: NATIVE, identity: `${id}|${order.toUpperCase()}`, url };
      assets.push({ path: relative, kind: descriptor.kind, width: NATIVE, height: NATIVE, identity: descriptor.identity });
      await enqueue(descriptor);
      cache[`${order}_portrait_path`] = relative;
    }
  }
  /* Keep the private render URLs available until the comparison sheet has
     been built, but project them out of the public evidence rows. Mutating a
     required-field type with `delete` hid this contract from the app's own
     TypeScript build. */
  const publicCacheReports = cacheReports.map(({ ab_url: _abUrl, ba_url: _baUrl, ...record }) => record);
  /* URLs were deliberately removed from the public report; re-render exact
     cache genomes fresh for the one human comparison sheet. */
  const cacheSheetInput: Array<Record<string, unknown> & { ab_url: string; ba_url: string }> = cacheReports.map((record) => ({
    ...record,
    ab_url: freshRender(record.ab_genome as Genome).url,
    ba_url: freshRender(record.ba_genome as Genome).url,
  }));
  assert(cacheSheetInput.length === 6, `expected six cache controls, got ${cacheSheetInput.length}`);
  const cacheSheet = await makeCacheSheet(cacheSheetInput);
  const cacheSheetPath = 'cache-controls/reversed-parent-sheet.png';
  const cacheSheetAsset = { path: cacheSheetPath, kind: 'cache-sheet' as const, width: cacheSheet.width, height: cacheSheet.height, identity: 'cache-subset', url: cacheSheet.url };
  assets.push({ path: cacheSheetPath, kind: cacheSheetAsset.kind, width: cacheSheet.width, height: cacheSheet.height, identity: cacheSheetAsset.identity });
  await enqueue(cacheSheetAsset);
  const mixedWork = REVERSE ? [...MIXED_REQUESTS].reverse() : MIXED_REQUESTS;
  for (const [index, request] of mixedWork.entries()) {
    say(`mixed lineage-owner sentinel ${index + 1}/${MIXED_REQUESTS.length}: ${request.id}`);
    const record = await findMixedSentinel(request);
    mixedReports.push(record);
    const descriptor = {
      path: String(record.portrait_path), kind: 'mixed-portrait' as const,
      width: NATIVE, height: NATIVE, identity: request.id, url: record.url,
    };
    assets.push({ path: descriptor.path, kind: descriptor.kind, width: descriptor.width,
      height: descriptor.height, identity: descriptor.identity });
    await enqueue(descriptor);
  }
  mixedReports.sort((a, b) => Number(a.ordinal) - Number(b.ordinal));
  assert(mixedReports.length === 16 && new Set(mixedReports.map((row) => row.sentinel_id)).size === 16,
    'mixed sentinel matrix is incomplete or duplicated');
  const mixedSheet = await makeMixedSheet(mixedReports);
  const mixedSheetPath = 'mixed-kingdom/sentinels-sheet.png';
  const mixedSheetAsset = {
    path: mixedSheetPath, kind: 'mixed-sheet' as const, width: mixedSheet.width,
    height: mixedSheet.height, identity: 'mixed-sentinels', url: mixedSheet.url,
  };
  assets.push({ path: mixedSheetPath, kind: mixedSheetAsset.kind, width: mixedSheet.width,
    height: mixedSheet.height, identity: mixedSheetAsset.identity });
  await enqueue(mixedSheetAsset);
  const publicMixedReports = mixedReports.map(({ url: _url, ...record }) => record);
  assert(lineageReports.length === 13, `expected 13 lineage reports, got ${lineageReports.length}`);
  assert(lineageReports.reduce((sum, row) => sum + (row.stages as unknown[]).length, 0) === 65,
    'principal matrix must contain exactly 65 stages');
  assert(new Set(assets.map((asset) => asset.path)).size === assets.length, 'duplicate output asset path');
  assert(new Set(assets.map((asset) => `${asset.kind}\u0000${asset.identity}`)).size === assets.length,
    'duplicate output asset identity');
  /* Work order intentionally reverses on the cache-permutation reload. Report
     descriptors in canonical path order so the reload comparison measures
     genomes/routes/pixels, not incidental queue order. */
  assets.sort((a, b) => a.path.localeCompare(b.path));
  const pixelIdenticalLineages = lineageReports
    .filter((row) => (row.pixel_identity_groups as unknown[]).length > 0)
    .map((row) => String(row.lineage_id));
  state.report = {
    schema: 'cf.hybrid-continuity.browser-report.v4',
    done: true,
    review_status: 'UNREVIEWED',
    visual_continuity_status: 'OPEN',
    machine_anchor_visual_status: pixelIdenticalLineages.length
      ? 'FAIL_BYTE_IDENTICAL_STAGES' : 'OPEN_UNREVIEWED',
    visual_claim: 'No seamlessness or art PASS is awarded by this evidence tool.',
    production_path: 'makeGenome -> crossGenome -> speciesPortrait',
    stage_order: STAGE_ORDER,
    anchor_contract: ANCHORS,
    emit: EMIT,
    render_order: REVERSE ? 'reverse' : 'forward',
    summary: {
      lineages: 13, principal_portraits: 65, cache_controls: 6,
      cache_portraits: 12, mixed_kingdom_sentinels: 16, mixed_portraits: 16,
      assets: assets.length,
      pixel_identical_lineages: pixelIdenticalLineages.length,
      pixel_identical_lineage_ids: pixelIdenticalLineages,
    },
    checks: {
      earth_owner_sources_verified: true,
      no_handwritten_lineage_fields: true,
      cross_genome_provenance: true,
      anchor_values_exact: true,
      production_matches_fresh_route: true,
      repeated_fresh_render_stable: true,
      stripped_lineage_bypass_differs: true,
      stage_genome_identities_distinct: true,
      pixel_identity_groups_accounted: true,
      cache_permutation_independent: true,
      mixed_parent_order_child_kingdom_coverage: true,
      mixed_lineage_owner_preserved: true,
      mixed_production_route_follows_owner: true,
      duplicate_name_owner_pixels_set_specific: true,
      mixed_stripped_lineage_bypass_differs: true,
      mixed_repeated_cross_stable: true,
    },
    lineages: lineageReports,
    cache_controls: publicCacheReports,
    mixed_kingdom_sentinels: publicMixedReports,
    mixed_sentinel_sheet: mixedSheetPath,
    assets,
  };
  state.done = true;
  say(`hybrid continuity evidence ready: 13 lineages, 65 principal portraits, 16 mixed sentinels, ${assets.length} artefacts - continuity OPEN (${pixelIdenticalLineages.length} byte-identical lineage rows)`);
}

run().catch((error: unknown) => {
  state.error = error instanceof Error ? `${error.message}\n${error.stack || ''}` : String(error);
  state.done = true;
  state.report = { schema: 'cf.hybrid-continuity.browser-report.v4', done: true, error: state.error };
  say(`hybrid continuity evidence FAILED: ${state.error}`);
});
