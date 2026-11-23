// Checks an interface sheet (palette, display font, icons, space elements in the interface sheet format) the way
// the app will use it.
// Usage: node tools/check-interface.mjs <interface.txt>
// Reads only the file given and writes nothing. Exit code 0 only when there is no error.
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The art packages import sibling .ts files without an extension: retry a failed specifier with .ts and /index.ts.
// (The same hook as tools/check-pack.mjs; it only acts when plain resolution fails.)
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.startsWith('.')) throw error;
      const base = specifier.endsWith('.js') ? specifier.slice(0, -3) : specifier;
      for (const candidate of [base + '.ts', base + '/index.ts']) {
        try {
          return nextResolve(candidate, context);
        } catch {
          // try the next candidate
        }
      }
      throw error;
    }
  },
});

const { parseInterfaceSheet, codePointLabel, tierOf, subjectOf, REQUIRED_GLYPHS, REQUIRED_RAMPS, ICON_NAMES, ELEMENT_NAMES, OPTIONAL_ELEMENT_NAMES } = await import('@cf/art-interface');

/** The side of every interface icon, in art pixels. */
export const ICON_SIZE = 16;

/**
 * The faults of a sheet, each as one line; `ok` only when there is none. A sheet that does not parse has only its
 * parse error. Otherwise: a required ramp, glyph, icon or element the sheet lacks; an icon or element name that is
 * not in the shared lists; an icon that is not ICON_SIZE by ICON_SIZE. An
 * optional element (a planet by its type) may be there or not. A size tier (`<element>/x<width>`) of any listed
 * element is accepted; reported are a tier of a name that is not listed, a tier of an optional element the sheet does
 * not draw, a tier not drawn at the width its name gives, and a tier no wider than its element. The forms of one
 * subject (its orientations, its frames, its dimmed form) must carry the same tier widths as the first of them, or
 * the thing would change size as it turns: each that differs is reported, when any of them has a tier at all.
 */
export function checkInterface(text) {
  let sheet;
  try {
    sheet = parseInterfaceSheet(text);
  } catch (error) {
    return { ok: false, parseError: error instanceof Error ? error.message : String(error), problems: [], summary: null };
  }
  const problems = [];
  for (const name of REQUIRED_RAMPS) if (!Object.hasOwn(sheet.palette.ramps, name)) problems.push(`missing ramp ${name}`);
  for (const codePoint of REQUIRED_GLYPHS) if (!sheet.font.glyphs.has(codePoint)) problems.push(`missing glyph ${codePointLabel(codePoint)}`);
  for (const name of ICON_NAMES) if (!sheet.icons.has(name)) problems.push(`missing icon ${name}`);
  for (const [name, icon] of sheet.icons) {
    if (!ICON_NAMES.includes(name)) problems.push(`unknown icon ${name}`);
    if (icon.w !== ICON_SIZE || icon.h !== ICON_SIZE) problems.push(`icon ${name} is ${icon.w} by ${icon.h}, not ${ICON_SIZE} by ${ICON_SIZE}`);
  }
  for (const name of ELEMENT_NAMES) if (!sheet.elements.has(name)) problems.push(`missing element ${name}`);
  const known = [...ELEMENT_NAMES, ...OPTIONAL_ELEMENT_NAMES];
  let tiers = 0;
  const widthsOf = new Map();
  for (const [name, drawing] of sheet.elements) {
    if (known.includes(name)) continue;
    const tier = tierOf(name);
    if (tier === undefined) { problems.push(`unknown element ${name}`); continue; }
    tiers++;
    widthsOf.set(tier.element, [...(widthsOf.get(tier.element) ?? []), tier.width]);
    const element = sheet.elements.get(tier.element);
    if (!known.includes(tier.element)) problems.push(`tier ${name} is of an unknown element ${tier.element}`);
    else if (element === undefined && OPTIONAL_ELEMENT_NAMES.includes(tier.element)) problems.push(`tier ${name} has no element ${tier.element}`);
    else if (drawing.w !== tier.width) problems.push(`tier ${name} is ${drawing.w} wide, not ${tier.width}`);
    else if (element !== undefined && drawing.w <= element.w) problems.push(`tier ${name} is no wider than its element (${element.w})`);
  }
  const forms = new Map();
  for (const name of known) forms.set(subjectOf(name), [...(forms.get(subjectOf(name)) ?? []), name]);
  const ladder = (name) => [...(widthsOf.get(name) ?? [])].sort((a, b) => a - b).join(', ') || 'none';
  for (const [first, ...others] of forms.values()) {
    for (const other of others) {
      if (ladder(other) !== ladder(first)) problems.push(`tiers of ${other} differ from ${first}: ${ladder(other)} against ${ladder(first)}`);
    }
  }
  const summary = { glyphs: sheet.font.glyphs.size, icons: sheet.icons.size, elements: sheet.elements.size - tiers, tiers, line: sheet.font.line };
  return { ok: problems.length === 0, parseError: null, problems, summary };
}

/** The report as text: a first line `check-interface: OK` or `check-interface: FAILED`, then one line per fault. */
export function formatInterfaceReport(report) {
  const lines = [`check-interface: ${report.ok ? 'OK' : 'FAILED'}`];
  if (report.parseError !== null) lines.push(`error: ${report.parseError}`);
  for (const problem of report.problems) lines.push(`error: ${problem}`);
  if (report.summary !== null) {
    const s = report.summary;
    lines.push(`summary: ${s.glyphs} glyphs (line ${s.line}), ${s.icons} icons, ${s.elements} elements, ${s.tiers} size tiers`);
  }
  return lines.join('\n') + '\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (files.length !== 1) {
    console.error('usage: node tools/check-interface.mjs <interface.txt>');
    process.exit(2);
  }
  let text;
  try {
    text = readFileSync(files[0], 'utf8');
  } catch (error) {
    console.error(`check-interface: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
  const report = checkInterface(text);
  process.stdout.write(formatInterfaceReport(report));
  process.exit(report.ok ? 0 : 1);
}
