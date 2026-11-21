import { PIXEL_CHARS } from './pixels';
import { DRAW_ORDER } from './types';
import type { Catalogue, Palette, Part, PartFrame, Pose, PoseEntry, Scaffold, SizeTier, SlotName } from './types';

const DIRECTIVES = new Set(['palette', 'colour', 'ramp', 'outline', 'eye', 'eyeHighlight', 'glow', 'part', 'frame', 'scaffold', 'pose', 'entry', 'fallback']);
const TIERS: readonly string[] = ['small', 'medium', 'large', 'guardian'];

const NAME = /^[A-Za-z0-9_-]+$/;
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
  if (i < 0 || i > 95) throw new Error(`line ${line}: bad colour index ${i}`);
  return i;
}

function parsePartId(id: string): Omit<Part, 'frames'> | undefined {
  const seg = id.split('/');
  if (seg.length !== 5) return undefined;
  const [family, slot, kind, tier, v] = seg as [string, string, string, string, string];
  if (family === '' || kind === '' || !(DRAW_ORDER as readonly string[]).includes(slot) || !TIERS.includes(tier) || !/^v(0|[1-9]\d*)$/.test(v)) return undefined;
  return { id, family, slot: slot as SlotName, tier: tier as SizeTier, kind, variant: parseInt(v.slice(1), 10) };
}

interface OpenFrame { name: string; line: number; anchor: [number, number]; attach: Record<string, readonly [number, number]>; w: number; h: number; data: number[]; }

export function parseCatalogueText(text: string): Catalogue {
  const parts = new Map<string, Part>();
  const scaffolds = new Map<string, Scaffold>();
  const fallbacks = new Map<string, string>();
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
      part.frames[frame.name] = { w: frame.w < 0 ? 0 : frame.w, h: frame.h, pixels: Uint8Array.from(frame.data), anchor: frame.anchor, attach: frame.attach };
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
      for (const c of trimmed) {
        const v = PIXEL_CHARS.indexOf(c);
        if (v < 0) throw new Error(`${where}: unknown pixel character '${c}'`);
        row.push(v);
      }
      if (frame.w < 0) frame.w = row.length;
      else if (row.length !== frame.w) throw new Error(`${where}: row width ${row.length} differs from ${frame.w}`);
      frame.data.push(...row);
      frame.h++;
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
          if (index >= 96) throw new Error('palette: more than 96 colours');
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
        frame = { name, line: n, anchor: pair(anchor, n), attach: attachPoints(opts.get('attach') ?? '', n), w: -1, h: 0, data: [] };
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
        if (!pose) throw new Error(`line ${n}: entry outside a pose`);
        need(5);
        const slot = args[0] as string;
        if (!(DRAW_ORDER as readonly string[]).includes(slot)) throw new Error(`line ${n}: unknown slot '${slot}'`);
        const rawIndex = args[1] as string;
        const index = /^-?\d+$/.test(rawIndex) ? parseInt(rawIndex, 10) : -1;
        if (index < 0 || index > 7) throw new Error(`line ${n}: bad entry index ${rawIndex}`);
        pose.entries.push({ slot: slot as SlotName, index, frame: args[2] as string, dx: int(args[3], n), dy: int(args[4], n) });
        break;
      }
      case 'fallback':
        closeAll();
        need(2);
        {
          const family = checkName(args[0] as string, n);
          if (fallbacks.has(family)) throw new Error(`line ${n}: duplicate fallback ${family}`);
          fallbacks.set(family, args[1] as string);
        }
        break;
    }
  }
  closeAll();

  if (sawPalette) {
    for (const i of usedColours) if (!definedColours.has(i)) throw new Error(`palette: colour ${i} used but not defined`);
  }
  const finished: Palette = { colours, ramps, ...palette };
  return { parts, scaffolds, palette: finished, fallbacks };
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
  for (const [name, f] of Object.entries(part.frames)) {
    if (!nameOk(name)) fail(`frame name ${name} is not a valid name`);
    if (f.pixels.length !== f.w * f.h) fail(`frame ${name} has ${f.pixels.length} pixels, expected ${f.w * f.h}`);
    for (const k of Object.keys(f.attach)) if (!nameOk(k)) fail(`attach name ${k} is not a valid name`);
    const attach = Object.entries(f.attach).map(([k, [x, y]]) => `${k}:${x},${y}`).join(',');
    out.push(`frame ${name} anchor=${f.anchor[0]},${f.anchor[1]}${attach === '' ? '' : ` attach=${attach}`}`);
    for (let y = 0; y < f.h; y++) {
      let row = '';
      for (let x = 0; x < f.w; x++) row += pixelChar(f.pixels[y * f.w + x] as number);
      out.push(row);
    }
    out.push('');
  }
  return `${out.join('\n')}\n`;
}
