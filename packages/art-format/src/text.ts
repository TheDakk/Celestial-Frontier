import { BONE_RAMP, IRIS_RAMP_COUNT, isOwnRamp, OWN_RAMP_FIRST, PIXEL_CHARS, PIXEL_IRIS, PIXEL_OUTLINE } from './pixels';
import { DRAW_ORDER, EYE_COUNTS, LAYER_NAMES, LIMB_COUNTS } from './types';
import type { Catalogue, LayerName, Palette, Part, PartFrame, Pose, PoseEntry, Scaffold, SizeTier, SlotName, Species } from './types';

const DIRECTIVES = new Set(['palette', 'colour', 'ramp', 'outline', 'eye', 'eyeHighlight', 'glow', 'part', 'frame', 'scaffold', 'pose', 'entry', 'fallback', 'layer', 'species']);
const TIERS: readonly string[] = ['small', 'medium', 'large', 'guardian'];

const NAME = /^[A-Za-z0-9_-]+$/;
const SPECIES_KEY = /^[a-z][a-z0-9]*$/;
/**
 * Names the generated creatures use, which a species key may not take: its parts and ramps are named from the key.
 * The torso type of a family with none (`body`), the leg and eye kinds, head and tail kinds (`h<n>`, `t<n>`), and the
 * colour, iris and bone ramps (`c<n>`, `iris<n>`, `bone`). A torso type of a family is refused by the checker, which knows the gene table.
 * A species' ramps are `<key>`, `<key>-accent`, `<key>-under` and, when present, `<key>-iris` and `<key>-bone`. A key has no hyphen, so
 * none of these can equal a generated ramp (`c<n>`, `c<n>-under`, `iris<n>`, `bone`: `c<n>`, `iris<n>` and `bone` are refused as keys)
 * or another species' ramp.
 */
const GENERATED_NAMES: readonly string[] = ['body', 'leg', 'fore', 'hind', 'mid', 'eye', BONE_RAMP];
const GENERATED_NAME = /^(h|t|c|iris)\d+$/;
/** The fields of a species line, each required once. */
const SPECIES_FIELDS: readonly string[] = ['legs', 'eyes', 'iris', 'tail'];
/** The fields a species line may leave out: `head` (0 or 1; left out, 1) and `template` (a name; left out, the family name). */
const SPECIES_OPTIONAL_FIELDS: readonly string[] = ['head', 'template'];
/**
 * The most colours one palette may define: every colour a screen can show (2^24), so the palette is not limited in
 * practice. The bound only stops a mistyped index from being taken as a colour number.
 */
export const MAX_PALETTE_COLOURS = 0x1000000;
const RESERVED_NAMES: readonly string[] = ['__proto__', 'constructor', 'prototype'];
const nameOk = (name: string): boolean => NAME.test(name) && !RESERVED_NAMES.includes(name);
function checkName(name: string, line: number): string {
  if (!nameOk(name)) throw new Error(`line ${line}: bad name ${name}`);
  return name;
}
/** Records are built without a prototype so an inherited key (toString, hasOwnProperty...) is never read as an entry. */
function record<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function int(s: string | undefined, line: number): number {
  if (s === undefined || !/^-?\d+$/.test(s)) throw new Error(`line ${line}: expected an integer`);
  return parseInt(s, 10);
}

function pair(s: string, line: number): [number, number] {
  const bits = s.split(',');
  if (bits.length !== 2) throw new Error(`line ${line}: expected x,y`);
  return [int(bits[0], line), int(bits[1], line)];
}

/** `name:x,y,name:x,y` -> record; names never contain a colon or comma. */
function attachPoints(s: string, line: number): Record<string, readonly [number, number]> {
  const out = record<readonly [number, number]>();
  if (s === '') return out;
  const bits = s.split(',');
  if (bits.length % 2 !== 0) throw new Error(`line ${line}: bad attach list`);
  for (let i = 0; i < bits.length; i += 2) {
    const head = bits[i] as string;
    const colon = head.indexOf(':');
    if (colon <= 0 || head.indexOf(':', colon + 1) >= 0) throw new Error(`line ${line}: bad attach list`);
    const name = checkName(head.slice(0, colon), line);
    if (name in out) throw new Error(`line ${line}: duplicate attach ${name}`);
    out[name] = [int(head.slice(colon + 1), line), int(bits[i + 1], line)];
  }
  return out;
}

/** Splits `key=value` tokens into a map; only the allowed keys, each at most once. */
function options(tokens: readonly string[], line: number, allowed: readonly string[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const t of tokens) {
    const eq = t.indexOf('=');
    if (eq <= 0) throw new Error(`line ${line}: bad option '${t}'`);
    const key = t.slice(0, eq);
    if (!allowed.includes(key) || m.has(key)) throw new Error(`line ${line}: bad option ${key}`);
    m.set(key, t.slice(eq + 1));
  }
  return m;
}

function colourIndex(s: string | undefined, line: number): number {
  const i = int(s, line);
  if (i < 0 || i >= MAX_PALETTE_COLOURS) throw new Error(`line ${line}: bad colour index ${i}`);
  return i;
}

function parsePartId(id: string): Omit<Part, 'frames'> | undefined {
  const seg = id.split('/');
  if (seg.length !== 5) return undefined;
  const [family, slot, kind, tier, v] = seg as [string, string, string, string, string];
  if (family === '' || kind === '' || !(DRAW_ORDER as readonly string[]).includes(slot) || !TIERS.includes(tier) || !/^v(0|[1-9]\d*)$/.test(v)) return undefined;
  return { id, family, slot: slot as SlotName, tier: tier as SizeTier, kind, variant: parseInt(v.slice(1), 10) };
}

interface OpenFrame { name: string; line: number; anchor: [number, number]; attach: Record<string, readonly [number, number]>; w: number; h: number; data: number[]; layers: Map<LayerName, OpenLayer>; layer?: OpenLayer; }
interface OpenLayer { name: LayerName; line: number; rows: number; data: number[]; }
const GUIDE_LAYERS: readonly string[] = ['flow', 'spots'];
/** The iris ramp (17-20), which the composer alone writes; the own-ramp values above it (21-28, bone and deep) are a part's to draw. */
const isIris = (v: number): boolean => v >= PIXEL_IRIS && v < OWN_RAMP_FIRST;
/**
 * Whether a layer may hold the value: 0 to 15 in a guide layer (flow, spots: counters, not colours); in a hand-drawn
 * pattern or skin layer the colours a part may draw there, 0 to 12 (the hide ramps) and 21 to 28 (bone and deep).
 */
const layerValueOk = (name: string, v: number): boolean => (GUIDE_LAYERS.includes(name) ? v <= 15 : v <= 12 || isOwnRamp(v));

export function parseCatalogueText(text: string): Catalogue {
  const parts = new Map<string, Part>();
  const scaffolds = new Map<string, Scaffold>();
  const fallbacks = new Map<string, string>();
  const species = new Map<string, Species>();
  const colours: number[] = [];
  const ramps = record<readonly [number, number, number, number]>();
  const palette = { outline: 0, eye: 0, eyeHighlight: 0, glow: 0 };
  const definedColours = new Set<number>();
  const usedColours: number[] = [];
  let sawPalette = false;

  let part: { id: string; head: Omit<Part, 'frames'>; frames: Record<string, PartFrame> } | undefined;
  let frame: OpenFrame | undefined;
  let scaffold: { id: string; family: string; tier: SizeTier; origin: readonly [number, number]; poses: Record<string, Pose> } | undefined;
  let pose: { id: string; entries: PoseEntry[]; contact?: readonly [number, number] } | undefined;
  let inPalette = false;

  const closeFrame = (): void => {
    if (part && frame) {
      if (frame.h === 0) throw new Error(`part ${part.id} frame ${frame.name} line ${frame.line}: frame has no rows`);
      const done: PartFrame = { w: frame.w, h: frame.h, pixels: Uint8Array.from(frame.data), anchor: frame.anchor, attach: frame.attach };
      if (frame.layers.size > 0) {
        const layers: Partial<Record<LayerName, Uint8Array>> = {};
        for (const name of LAYER_NAMES) {
          const l = frame.layers.get(name);
          if (!l) continue;
          if (l.rows !== frame.h) throw new Error(`part ${part.id} frame ${frame.name} line ${l.line}: layer ${name} has ${l.rows} rows, frame has ${frame.h}`);
          layers[name] = Uint8Array.from(l.data);
        }
        (done as { layers?: unknown }).layers = layers;
      }
      part.frames[frame.name] = done;
    }
    frame = undefined;
  };
  const closePart = (): void => {
    closeFrame();
    if (part && Object.keys(part.frames).length === 0) throw new Error(`part ${part.id}: no frames`);
    if (part) parts.set(part.id, { ...part.head, frames: part.frames });
    part = undefined;
  };
  const closePose = (): void => {
    if (scaffold && pose) {
      const done: Pose = pose.contact ? { id: pose.id, entries: pose.entries, contact: pose.contact } : { id: pose.id, entries: pose.entries };
      scaffold.poses[pose.id] = done;
    }
    pose = undefined;
  };
  const closeScaffold = (): void => {
    closePose();
    if (scaffold && Object.keys(scaffold.poses).length === 0) throw new Error(`scaffold ${scaffold.id}: no poses`);
    if (scaffold) scaffolds.set(scaffold.id, { ...scaffold });
    scaffold = undefined;
  };
  const closeAll = (): void => { closePart(); closeScaffold(); inPalette = false; };

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const n = i + 1;
    const trimmed = (lines[i] as string).trim();
    if (trimmed.startsWith('#')) continue;
    if (trimmed === '') { closeFrame(); continue; }
    const tok = trimmed.split(/\s+/);
    const word = tok[0] as string;
    const args = tok.slice(1);

    if (!DIRECTIVES.has(word)) {
      if (!frame || !part) {
        if ([...trimmed].every((c) => PIXEL_CHARS.includes(c))) throw new Error(`line ${n}: pixel row outside a frame`);
        throw new Error(`line ${n}: unknown directive '${word}'`);
      }
      const where = `part ${part.id} frame ${frame.name} line ${n}`;
      const row: number[] = [];
      if (frame.layer) {
        const layer = frame.layer;
        for (const c of trimmed) {
          const v = PIXEL_CHARS.indexOf(c);
          if (v < 0 || !layerValueOk(layer.name, v)) throw new Error(`${where}: bad layer value '${c}'`);
          row.push(v);
        }
        if (row.length !== frame.w) throw new Error(`${where}: layer ${layer.name} row width ${row.length} differs from ${frame.w}`);
        layer.data.push(...row);
        layer.rows++;
        continue;
      }
      for (const c of trimmed) {
        const v = PIXEL_CHARS.indexOf(c);
        if (v < 0) throw new Error(`${where}: unknown pixel character '${c}'`);
        if (v === PIXEL_OUTLINE) throw new Error(`${where}: outline value is written by the composer`);
        if (isIris(v)) throw new Error(`${where}: iris value is written by the composer`);
        row.push(v);
      }
      if (frame.w < 0) frame.w = row.length;
      else if (row.length !== frame.w) throw new Error(`${where}: row width ${row.length} differs from ${frame.w}`);
      frame.data.push(...row);
      frame.h++;
      continue;
    }

    if (word === 'layer') {
      if (!frame || !part || frame.h === 0) throw new Error(`line ${n}: layer outside a frame`);
      const name = args[0];
      const where = `part ${part.id} frame ${frame.name} line ${n}`;
      if (args.length !== 1) throw new Error(`line ${n}: bad layer`);
      if (!(LAYER_NAMES as readonly string[]).includes(name as string)) throw new Error(`${where}: unknown layer '${name}'`);
      if (frame.layers.has(name as LayerName)) throw new Error(`${where}: duplicate layer ${name}`);
      frame.layer = { name: name as LayerName, line: n, rows: 0, data: [] };
      frame.layers.set(name as LayerName, frame.layer);
      continue;
    }
    closeFrame();
    const need = (count: number): void => {
      if (args.length !== count) throw new Error(`line ${n}: bad ${word}`);
    };

    switch (word) {
      case 'palette':
        closeAll();
        inPalette = true;
        sawPalette = true;
        break;
      case 'colour': case 'ramp': case 'outline': case 'eye': case 'eyeHighlight': case 'glow':
        if (!inPalette) throw new Error(`line ${n}: ${word} outside a palette`);
        if (word === 'colour') {
          need(2);
          const index = int(args[0], n);
          if (index >= MAX_PALETTE_COLOURS) throw new Error(`palette: more than ${MAX_PALETTE_COLOURS} colours`);
          if (index < 0) throw new Error(`line ${n}: bad colour index ${index}`);
          if (!/^[0-9a-fA-F]{6}$/.test(args[1] as string)) throw new Error(`line ${n}: bad colour`);
          if (definedColours.has(index)) throw new Error(`line ${n}: duplicate colour ${index}`);
          definedColours.add(index);
          while (colours.length <= index) colours.push(0);
          colours[index] = parseInt(args[1] as string, 16);
        } else if (word === 'ramp') {
          need(5);
          const name = checkName(args[0] as string, n);
          if (name in ramps) throw new Error(`line ${n}: duplicate ramp ${name}`);
          const ramp: [number, number, number, number] = [colourIndex(args[1], n), colourIndex(args[2], n), colourIndex(args[3], n), colourIndex(args[4], n)];
          usedColours.push(...ramp);
          ramps[name] = ramp;
        } else {
          need(1);
          const index = colourIndex(args[0], n);
          usedColours.push(index);
          palette[word] = index;
        }
        break;
      case 'part': {
        closeAll();
        need(1);
        const id = args[0] as string;
        const head = parsePartId(id);
        if (!head) throw new Error(`part ${id}: bad id`);
        if (parts.has(id)) throw new Error(`line ${n}: duplicate id ${id}`);
        part = { id, head, frames: record<PartFrame>() };
        break;
      }
      case 'frame': {
        if (!part) throw new Error(`line ${n}: frame outside a part`);
        if (args.length < 1) throw new Error(`line ${n}: bad frame`);
        const name = checkName(args[0] as string, n);
        const opts = options(args.slice(1), n, ['anchor', 'attach']);
        const anchor = opts.get('anchor');
        if (anchor === undefined) throw new Error(`part ${part.id} frame ${name} line ${n}: missing anchor`);
        if (name in part.frames) throw new Error(`part ${part.id} frame ${name} line ${n}: duplicate frame`);
        // Anchor and attach points are not bounds-checked: an attach point may legitimately sit just outside a small part.
        frame = { name, line: n, anchor: pair(anchor, n), attach: attachPoints(opts.get('attach') ?? '', n), w: -1, h: 0, data: [], layers: new Map() };
        break;
      }
      case 'scaffold': {
        closeAll();
        if (args.length < 1) throw new Error(`line ${n}: bad scaffold`);
        const id = args[0] as string;
        const seg = id.split('/');
        if (seg.length !== 3 || seg[0] === '' || seg[1] === '' || !TIERS.includes(seg[2] as string)) throw new Error(`scaffold ${id}: bad id`);
        const origin = options(args.slice(1), n, ['origin']).get('origin');
        if (origin === undefined) throw new Error(`scaffold ${id} line ${n}: missing origin`);
        if (scaffolds.has(id)) throw new Error(`line ${n}: duplicate id ${id}`);
        scaffold = { id, family: seg[0] as string, tier: seg[2] as SizeTier, origin: pair(origin, n), poses: record<Pose>() };
        break;
      }
      case 'pose': {
        if (!scaffold) throw new Error(`line ${n}: pose outside a scaffold`);
        closePose();
        if (args.length < 1) throw new Error(`line ${n}: bad pose`);
        const poseId = checkName(args[0] as string, n);
        if (poseId in scaffold.poses) throw new Error(`scaffold ${scaffold.id} pose ${poseId} line ${n}: duplicate pose`);
        const contact = options(args.slice(1), n, ['contact']).get('contact');
        pose = { id: poseId, entries: [] };
        if (contact !== undefined) pose.contact = pair(contact, n);
        break;
      }
      case 'entry': {
        if (!pose || !scaffold) throw new Error(`line ${n}: entry outside a pose`);
        if (args.length < 5 || args.length > 6) throw new Error(`line ${n}: bad entry`);
        // The one optional field: `legs=<n>` (any slot) or `eyes=<n>` (an eyes entry only).
        let legs: number | undefined;
        let eyes: number | undefined;
        if (args.length === 6) {
          const field = args[5] as string;
          const name = field.startsWith('legs=') ? 'legs' : field.startsWith('eyes=') ? 'eyes' : undefined;
          if (name === undefined) throw new Error(`line ${n}: bad entry`);
          const value = field.slice(5);
          const parsed = /^\d+$/.test(value) ? parseInt(value, 10) : -1;
          if (!((name === 'legs' ? LIMB_COUNTS : EYE_COUNTS) as readonly number[]).includes(parsed)) throw new Error(`line ${n}: bad ${name} '${value}'`);
          if (name === 'legs') legs = parsed;
          else eyes = parsed;
        }
        const slot = args[0] as string;
        if (!(DRAW_ORDER as readonly string[]).includes(slot)) throw new Error(`line ${n}: unknown slot '${slot}'`);
        if (eyes !== undefined && slot !== 'eyes') throw new Error(`line ${n}: eyes= on slot '${slot}': only an eyes entry takes an eye count`);
        const rawIndex = args[1] as string;
        const index = /^-?\d+$/.test(rawIndex) ? parseInt(rawIndex, 10) : -1;
        if (index < 0 || index > 7) throw new Error(`line ${n}: bad entry index ${rawIndex}`);
        if (pose.entries.some((e) => e.slot === slot && e.index === index && e.legs === legs && e.eyes === eyes)) {
          throw new Error(`scaffold ${scaffold.id} pose ${pose.id} line ${n}: duplicate entry ${slot} ${index}`);
        }
        const entry: PoseEntry = { slot: slot as SlotName, index, frame: args[2] as string, dx: int(args[3], n), dy: int(args[4], n) };
        pose.entries.push(legs !== undefined ? { ...entry, legs } : eyes !== undefined ? { ...entry, eyes } : entry);
        break;
      }
      case 'fallback':
        closeAll();
        need(2);
        {
          const family = checkName(args[0] as string, n);
          const id = args[1] as string;
          const target = parsePartId(id);
          if (!target) throw new Error(`line ${n}: bad fallback part id ${id}`);
          const key = `${family}/${target.tier}`;
          if (fallbacks.has(key)) throw new Error(`line ${n}: duplicate fallback ${family} ${target.tier}`);
          fallbacks.set(key, id);
        }
        break;
      case 'species': {
        closeAll();
        if (args.length < 3) throw new Error(`line ${n}: bad species`);
        const key = args[0] as string;
        if (!SPECIES_KEY.test(key)) throw new Error(`line ${n}: bad species key '${key}'`);
        if (GENERATED_NAMES.includes(key) || GENERATED_NAME.test(key)) throw new Error(`line ${n}: species key '${key}' is a name the generated creatures use`);
        const family = checkName(args[1] as string, n);
        const tier = args[2] as string;
        if (!TIERS.includes(tier)) throw new Error(`line ${n}: bad tier '${tier}'`);
        const opts = options(args.slice(3), n, [...SPECIES_FIELDS, ...SPECIES_OPTIONAL_FIELDS]);
        for (const field of SPECIES_FIELDS) if (!opts.has(field)) throw new Error(`species ${key} line ${n}: missing ${field}`);
        const field = (name: string, allowed: readonly number[]): number => {
          const value = opts.get(name) as string;
          const parsed = /^\d+$/.test(value) ? parseInt(value, 10) : -1;
          if (!allowed.includes(parsed)) throw new Error(`line ${n}: bad ${name} '${value}'`);
          return parsed;
        };
        const entry: Species = {
          key, family, tier: tier as SizeTier,
          legs: field('legs', LIMB_COUNTS), eyes: field('eyes', EYE_COUNTS),
          iris: field('iris', Array.from({ length: IRIS_RAMP_COUNT }, (_, i) => i)), tail: field('tail', [0, 1]) === 1,
          head: !opts.has('head') || field('head', [0, 1]) === 1,
          template: opts.has('template') ? checkName(opts.get('template') as string, n) : family,
        };
        if (species.has(key)) throw new Error(`line ${n}: duplicate species ${key}`);
        species.set(key, entry);
        break;
      }
    }
  }
  closeAll();

  for (const [key, id] of fallbacks) {
    const target = parts.get(id);
    if (target === undefined || !Object.hasOwn(target.frames, 'rest')) throw new Error(`fallback ${key.replace('/', ' ')}: part ${id} missing or has no rest frame`);
  }
  if (sawPalette) {
    for (const i of usedColours) if (!definedColours.has(i)) throw new Error(`palette: colour ${i} used but not defined`);
  }
  const finished: Palette = { colours, ramps, ...palette };
  return { parts, scaffolds, palette: finished, fallbacks, species };
}

function pixelChar(v: number): string {
  const c = PIXEL_CHARS[v];
  if (v < 0 || c === undefined) throw new Error(`pixel value ${v} out of range`);
  return c;
}

/** Writes one part in the text form that parseCatalogueText reads. */
export function formatPart(part: Part): string {
  const fail = (why: string): never => { throw new Error(`part ${part.id}: cannot format: ${why}`); };
  const out: string[] = [`part ${part.id}`];
  if (Object.keys(part.frames).length === 0) fail('it has no frames');
  for (const [name, f] of Object.entries(part.frames)) {
    if (!nameOk(name)) fail(`frame name ${name} is not a valid name`);
    if (f.w <= 0 || f.h <= 0) fail(`frame ${name} is ${f.w}x${f.h}, which has no pixels`);
    if (f.pixels.includes(PIXEL_OUTLINE)) fail(`frame ${name} holds the outline value, which only the composer writes`);
    if (f.pixels.some(isIris)) fail(`frame ${name} holds an iris value, which only the composer writes`);
    if (f.pixels.length !== f.w * f.h) fail(`frame ${name} has ${f.pixels.length} pixels, expected ${f.w * f.h}`);
    for (const k of Object.keys(f.attach)) if (!nameOk(k)) fail(`attach name ${k} is not a valid name`);
    const attach = Object.entries(f.attach).map(([k, [x, y]]) => `${k}:${x},${y}`).join(',');
    out.push(`frame ${name} anchor=${f.anchor[0]},${f.anchor[1]}${attach === '' ? '' : ` attach=${attach}`}`);
    for (let y = 0; y < f.h; y++) {
      let row = '';
      for (let x = 0; x < f.w; x++) row += pixelChar(f.pixels[y * f.w + x] as number);
      out.push(row);
    }
    const layers = f.layers ?? {};
    for (const key of Object.keys(layers)) if (!(LAYER_NAMES as readonly string[]).includes(key)) fail(`frame ${name} has an unknown layer ${key}`);
    for (const layerName of LAYER_NAMES) {
      const grid = layers[layerName];
      if (grid === undefined) continue;
      if (grid.length !== f.w * f.h) fail(`frame ${name} layer ${layerName} has ${grid.length} pixels, expected ${f.w * f.h}`);
      if (grid.some((v) => !layerValueOk(layerName, v))) fail(`frame ${name} layer ${layerName} holds a value above ${GUIDE_LAYERS.includes(layerName) ? '15' : '12 that is not bone or deep (21 to 28)'}`);
      out.push(`layer ${layerName}`);
      for (let y = 0; y < f.h; y++) {
        let row = '';
        for (let x = 0; x < f.w; x++) row += pixelChar(grid[y * f.w + x] as number);
        out.push(row);
      }
    }
    out.push('');
  }
  return `${out.join('\n')}\n`;
}
