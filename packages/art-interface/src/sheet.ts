import { PIXEL_CHARS } from '@cf/art-format';
import type { Palette } from '@cf/art-format';

export interface Glyph { readonly w: number; readonly h: number; readonly pixels: Uint8Array }
export interface DisplayFont { readonly line: number; readonly base: number; readonly gap: number; readonly space: number; readonly glyphs: ReadonlyMap<number, Glyph> }
/** `ramps`, on an element that names its own: the ramp of its values 1 to 4, then of 5 to 8, and so on in fours. */
export interface Drawing { readonly w: number; readonly h: number; readonly pixels: Uint8Array; readonly anchor: readonly [number, number];
  readonly ramps?: readonly string[] }
export interface InterfaceSheet { readonly version: 1; readonly palette: Palette; readonly font: DisplayFont;
  readonly icons: ReadonlyMap<string, Drawing>; readonly elements: ReadonlyMap<string, Drawing> }

/** The code point drawn for a character the font has no glyph for. Every sheet has it. */
export const BOX_GLYPH = 0xfffd;
/** The icon drawn for a name the sheet has no icon for. Every sheet has it. */
export const STAND_IN_ICON = 'missing';
/** In an element's list of ramps: the ramp the map gives it, the one nearest its colour there. No palette ramp has this name. */
export const TINT_RAMP = 'tint';
/** How many colours a sheet's palette may number, from 0: a map picture holds one byte a pixel. */
const MAX_SHEET_COLOURS = 256;
/** The most ramps an element may name: its values then run to 20. */
export const MAX_ELEMENT_RAMPS = 5;

const SPACE = 32;
/** The highest pixel value a drawing may hold (two ramps of four), and the highest a glyph may (the first ramp). */
const MAX_VALUE = 8;
const MAX_GLYPH_VALUE = 4;
/** The colours of a ramp: an element's values run four to each ramp it names. */
const RAMP_STEPS = 4;
/** The largest line height, glyph gap, space width and icon size a sheet may ask for. */
const MAX_SIZE = 64;
const DIRECTIVES: readonly string[] = ['interface', 'palette', 'colour', 'ramp', 'font', 'glyph', 'icon', 'element'];
const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const RESERVED_NAMES: readonly string[] = ['constructor', 'prototype'];
const FONT_FIELDS: readonly string[] = ['line', 'base', 'gap', 'space'];

interface Open { kind: 'glyph' | 'icon' | 'element'; label: string; line: number; w: number; h: number; data: number[];
  codePoint: number; name: string; size: number; anchor: readonly [number, number]; ramps: readonly string[] | undefined }

/** `U+0041` for a code point. */
export function codePointLabel(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * Reads an interface sheet, version 1. The first line that is neither blank nor a comment is `interface 1`. Then, in any
 * order: one `palette` section of `colour <index> <rrggbb>` and `ramp <name> <c> <c> <c> <c>` lines; one
 * `font display line=<n> base=<n> gap=<n> space=<n>` line, before the first glyph; and drawings, each a header line
 * followed by its pixel rows and ended by a blank line, another header or the end of the text:
 * `glyph U+<hex>` (values 0 to 4; as wide as its rows; at most `line` rows, placed from the top of the line box),
 * `icon <name> size=<n>` (values 0 to 8; n rows of n) and `element <name> anchor=<x>,<y>` (values 0 to 8: 1 to 4 in
 * the ramp the map gives it, 5 to 8 in the ramp `accent`). An element may instead name its own ramps,
 * `element <name> anchor=<x>,<y> ramps=<ramp>,<ramp>,...`: one to five, each a ramp of the palette or the word `tint`
 * (the ramp the map gives it); its values 1 to 4 take the first, 5 to 8 the second, and so on to four times as many.
 * Rows use the part format's pixel characters; a line starting with `#` is a comment. The space (U+0020) is never
 * drawn in the sheet: the font line's `space` is its width. Every sheet has a glyph U+FFFD (the box) and an icon
 * `missing` (the stand-in).
 * Throws Error('line <n>: <what>') on the first fault.
 */
export function parseInterfaceSheet(text: string): InterfaceSheet {
  const colours: number[] = [];
  const definedColours = new Set<number>();
  const ramps = Object.create(null) as Record<string, readonly [number, number, number, number]>;
  const rampLines: Array<{ name: string; line: number }> = [];
  const rampUses: Array<{ label: string; ramp: string; line: number }> = [];
  const glyphs = new Map<number, Glyph>();
  const icons = new Map<string, Drawing>();
  const elements = new Map<string, Drawing>();
  let metrics: { line: number; base: number; gap: number; space: number } | undefined;
  let sawHeader = false;
  let sawPalette = false;
  let inPalette = false;
  // Held in an object: it is replaced inside the functions below, which a plain variable's narrowing would not see.
  const drawing: { open: Open | undefined } = { open: undefined };

  const fail: (line: number, what: string) => never = (line, what) => {
    throw new Error(`line ${line}: ${what}`);
  };
  const int = (s: string | undefined, line: number): number => {
    if (s === undefined || !/^-?\d+$/.test(s)) fail(line, 'expected an integer');
    return parseInt(s, 10);
  };
  /** A colour number: one a map picture can hold. */
  const colourIndex = (s: string | undefined, line: number): number => {
    const index = int(s, line);
    if (index < 0 || index >= MAX_SHEET_COLOURS) fail(line, `bad colour index ${index}`);
    return index;
  };
  const name = (s: string, line: number, segmented: boolean): string => {
    const segments = segmented ? s.split('/') : [s];
    if (!segments.every((seg) => NAME.test(seg) && !RESERVED_NAMES.includes(seg))) fail(line, `bad name ${s}`);
    return s;
  };
  /** `key=value` tokens as a map; only the allowed keys, each at most once. */
  const options = (tokens: readonly string[], line: number, allowed: readonly string[]): Map<string, string> => {
    const found = new Map<string, string>();
    for (const token of tokens) {
      const eq = token.indexOf('=');
      const key = eq <= 0 ? token : token.slice(0, eq);
      if (eq <= 0 || !allowed.includes(key) || found.has(key)) fail(line, `bad option ${key}`);
      found.set(key, token.slice(eq + 1));
    }
    return found;
  };
  const close = (): void => {
    const done = drawing.open;
    if (done === undefined) return;
    drawing.open = undefined;
    if (done.h === 0) fail(done.line, `${done.label} has no rows`);
    const pixels = Uint8Array.from(done.data);
    if (done.kind === 'glyph') {
      glyphs.set(done.codePoint, { w: done.w, h: done.h, pixels });
      return;
    }
    if (done.kind === 'icon' && (done.w !== done.size || done.h !== done.size)) {
      fail(done.line, `${done.label} is ${done.w} by ${done.h}, not ${done.size} by ${done.size}`);
    }
    (done.kind === 'icon' ? icons : elements).set(done.name, { w: done.w, h: done.h, pixels, anchor: done.anchor, ...(done.ramps === undefined ? {} : { ramps: done.ramps }) });
  };
  const start = (kind: Open['kind'], label: string, line: number, extra: Partial<Open>): void => {
    drawing.open = { kind, label, line, w: -1, h: 0, data: [], codePoint: 0, name: '', size: 0, anchor: [0, 0], ramps: undefined, ...extra };
  };

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const n = i + 1;
    const trimmed = (lines[i] as string).trim();
    if (trimmed.startsWith('#')) continue;
    if (trimmed === '') { close(); continue; }
    const tokens = trimmed.split(/\s+/);
    const word = tokens[0] as string;
    const args = tokens.slice(1);
    if (!sawHeader) {
      if (word !== 'interface' || args.length !== 1 || args[0] !== '1') fail(n, 'expected interface 1');
      sawHeader = true;
      continue;
    }

    if (!DIRECTIVES.includes(word) || (args.length === 0 && word !== 'palette')) {
      const open = drawing.open;
      const row = [...trimmed];
      if (!row.every((c) => PIXEL_CHARS.includes(c))) {
        if (open !== undefined && tokens.length === 1) fail(n, `unknown pixel character '${row.find((c) => !PIXEL_CHARS.includes(c))}'`);
        fail(n, `unknown directive '${word}'`);
      }
      if (open === undefined) fail(n, 'pixel row outside a drawing');
      const most = open.ramps === undefined ? MAX_VALUE : RAMP_STEPS * open.ramps.length;
      for (const c of row) {
        const v = PIXEL_CHARS.indexOf(c);
        if (v > most) fail(n, `pixel value '${c}' is above ${most}`);
        if (open.kind === 'glyph' && v > MAX_GLYPH_VALUE) fail(n, `glyph value '${c}' is above ${MAX_GLYPH_VALUE}`);
        open.data.push(v);
      }
      if (open.w < 0) open.w = row.length;
      else if (row.length !== open.w) fail(n, `row width ${row.length} differs from ${open.w}`);
      open.h++;
      if (open.kind === 'glyph' && metrics !== undefined && open.h > metrics.line) fail(n, `${open.label} is taller than the line (${metrics.line})`);
      continue;
    }

    close();
    if (word !== 'colour' && word !== 'ramp') inPalette = false;
    switch (word) {
      case 'interface':
        fail(n, 'duplicate interface line');
        break;
      case 'palette':
        if (args.length !== 0) fail(n, 'bad palette');
        if (sawPalette) fail(n, 'duplicate palette');
        sawPalette = true;
        inPalette = true;
        break;
      case 'colour': {
        if (!inPalette) fail(n, 'colour outside a palette');
        if (args.length !== 2) fail(n, 'bad colour');
        const index = colourIndex(args[0], n);
        if (!/^[0-9a-fA-F]{6}$/.test(args[1] as string)) fail(n, 'bad colour');
        if (definedColours.has(index)) fail(n, `duplicate colour ${index}`);
        definedColours.add(index);
        while (colours.length <= index) colours.push(0);
        colours[index] = parseInt(args[1] as string, 16);
        break;
      }
      case 'ramp': {
        if (!inPalette) fail(n, 'ramp outside a palette');
        if (args.length !== 5) fail(n, 'bad ramp');
        const rampName = name(args[0] as string, n, false);
        if (rampName === TINT_RAMP) fail(n, `the ramp name ${TINT_RAMP} is kept for an element's tint`);
        if (rampName in ramps) fail(n, `duplicate ramp ${rampName}`);
        const ramp = [colourIndex(args[1], n), colourIndex(args[2], n), colourIndex(args[3], n), colourIndex(args[4], n)] as const;
        ramps[rampName] = ramp;
        rampLines.push({ name: rampName, line: n });
        break;
      }
      case 'font': {
        if (metrics !== undefined) fail(n, 'duplicate font');
        if (args[0] !== 'display') fail(n, 'the font is named display');
        const opts = options(args.slice(1), n, FONT_FIELDS);
        if (opts.size !== FONT_FIELDS.length) fail(n, 'font needs line, base, gap and space');
        const [line, base, gap, space] = FONT_FIELDS.map((field) => int(opts.get(field), n)) as [number, number, number, number];
        if (line < 1 || line > MAX_SIZE) fail(n, `bad font line ${line}`);
        if (base < 1 || base > line) fail(n, `bad font base ${base}`);
        if (gap < 0 || gap > MAX_SIZE) fail(n, `bad font gap ${gap}`);
        if (space < 1 || space > MAX_SIZE) fail(n, `bad font space ${space}`);
        metrics = { line, base, gap, space };
        glyphs.set(SPACE, { w: space, h: 1, pixels: new Uint8Array(space) });
        break;
      }
      case 'glyph': {
        if (metrics === undefined) fail(n, 'glyph before the font');
        const raw = args[0] as string;
        const codePoint = /^U\+[0-9A-Fa-f]{4,6}$/.test(raw) ? parseInt(raw.slice(2), 16) : -1;
        if (args.length !== 1 || codePoint < 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) fail(n, `bad glyph code point ${raw}`);
        if (codePoint === SPACE) fail(n, 'the space comes from the font line');
        const label = `glyph ${codePointLabel(codePoint)}`;
        if (glyphs.has(codePoint)) fail(n, `duplicate ${label}`);
        start('glyph', label, n, { codePoint });
        break;
      }
      case 'icon': {
        const iconName = name(args[0] as string, n, false);
        const size = options(args.slice(1), n, ['size']).get('size');
        if (size === undefined) fail(n, 'icon needs a size');
        const side = int(size, n);
        if (side < 1 || side > MAX_SIZE) fail(n, `bad icon size ${side}`);
        if (icons.has(iconName)) fail(n, `duplicate icon ${iconName}`);
        start('icon', `icon ${iconName}`, n, { name: iconName, size: side });
        break;
      }
      case 'element': {
        const elementName = name(args[0] as string, n, true);
        const opts = options(args.slice(1), n, ['anchor', 'ramps']);
        const anchor = opts.get('anchor');
        if (anchor === undefined) fail(n, 'element needs an anchor');
        const xy = anchor.split(',');
        if (xy.length !== 2) fail(n, 'expected x,y');
        if (elements.has(elementName)) fail(n, `duplicate element ${elementName}`);
        const label = `element ${elementName}`;
        const own = opts.get('ramps')?.split(',').map((ramp) => name(ramp, n, false));
        if (own !== undefined && own.length > MAX_ELEMENT_RAMPS) fail(n, 'an element names one to five ramps');
        for (const ramp of own ?? []) if (ramp !== TINT_RAMP) rampUses.push({ label, ramp, line: n });
        start('element', label, n, { name: elementName, anchor: [int(xy[0], n), int(xy[1], n)], ramps: own });
        break;
      }
    }
  }
  close();

  const last = lines.length;
  if (!sawHeader) fail(1, 'expected interface 1');
  for (const { name: rampName, line } of rampLines) {
    const missing = (ramps[rampName] ?? []).find((index) => !definedColours.has(index));
    if (missing !== undefined) fail(line, `ramp ${rampName} uses colour ${missing}, which is not defined`);
  }
  for (const { label, ramp, line } of rampUses) if (!(ramp in ramps)) fail(line, `${label} names the ramp ${ramp}, which is not defined`);
  if (metrics === undefined) fail(last, 'no font');
  if (!glyphs.has(BOX_GLYPH)) fail(last, `no glyph ${codePointLabel(BOX_GLYPH)}`);
  if (!icons.has(STAND_IN_ICON)) fail(last, `no icon named ${STAND_IN_ICON}`);
  // A sheet's palette has no outline, eye, highlight or glow colour: those four belong to creatures and stay 0.
  const palette: Palette = { colours, ramps, outline: 0, eye: 0, eyeHighlight: 0, glow: 0 };
  return { version: 1, palette, font: { ...metrics, glyphs }, icons, elements };
}
