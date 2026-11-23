import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRepoFiles } from './tracked-files.mjs';
import { importedSpecifiers, scanCode } from './scan-code.mjs';

const DOMAIN_SRC = /^packages\/domain\/[^/]+\/src\//;
const SCENE_SRC = /^packages\/scene\/src\//;
const PERSISTENCE_SRC = /^packages\/persistence\/src\//;
const AUDIO_SRC = /^packages\/audio\/src\//;
// Every packages/art-<name>/src/ folder, at any depth below it, except the placeholder parts in art-testparts.
const ART_SRC = /^packages\/art-(?!testparts\/)[^/]+\/src\//;
// The game app, and inside it the one folder that may read the clocks and the browser's entropy.
const APP_SRC = /^apps\/game\/src\//;
const APP_PLATFORM = /^apps\/game\/src\/platform\//;
// The map folder turns world positions into whole art pixels: before it rounds, it may use only operations every
// device computes to the same bits. Of Math, these are the ones; `**` is not one, and Math may be reached no other way.
const APP_SPACE = /^apps\/game\/src\/space\//;
const EXACT_MATH = new Set(['abs', 'floor', 'ceil', 'round', 'trunc', 'min', 'max', 'sqrt', 'imul', 'sign']);
// String and template literals are matched first and kept, so `//` or `/*` inside a string
// does not start a comment; only the comment matches are removed.
const LITERALS_OR_COMMENTS = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;

function stripComments(text) {
  return text.replace(LITERALS_OR_COMMENTS, (m) => (m[0] === '/' ? '' : m));
}

const FORBIDDEN_USES = [
  [/\bMath\.random\b/, 'uses Math.random'],
  [/\bDate\.now\b/, 'uses Date.now'],
  [/\bperformance\.now\b/, 'uses performance.now'],
  [/\bnew\s+Date\s*\(/, 'uses new Date'],
];
// The game app outside its platform folder: no clock and no entropy, however the entropy function is reached.
const APP_USES = [
  ...FORBIDDEN_USES.filter(([, reason]) => reason !== 'uses new Date'),
  [/\bnew\s+Date\b/, 'uses new Date'],
  [/(?<!\bnew\s+)(?<![.\w$])Date\s*\(/, 'calls Date for the time'],
  [/\bperformance\s*(?:\?\.|\.)\s*timeOrigin\b/, 'uses performance.timeOrigin'],
  [/(?:\?\.|\.)\s*timeStamp\b/, 'uses an event time stamp'],
  [/\bgetRandomValues\b/, 'uses crypto.getRandomValues'],
  [/\brandomUUID\b/, 'uses crypto.randomUUID'],
];
// The platform folder is where the clocks and the entropy are read; Math.random stays out even there.
const APP_PLATFORM_USES = FORBIDDEN_USES.filter(([, reason]) => reason === 'uses Math.random');
// Gameplay code never touches the page or draws: drawing belongs to the renderer. The page objects are
// caught through `.`, `?.` or `[`; a property merely named window (`state.window`) is not the page's.
const DOMAIN_USES = [
  ...FORBIDDEN_USES,
  [/\bdocument\s*(?:\?\.|\.|\[)/, 'uses document'],
  [/(?<![.\w$])window\s*(?:\?\.|\.|\[)/, 'uses window'],
  [/\b(?:globalThis|self)\s*(?:\?\.|\.)\s*window\b/, 'uses window'],
  [/\bgetContext\s*(?:\?\.)?\(/, 'uses a canvas'],
  [/\bOffscreenCanvas\b/, 'uses a canvas'],
];
// Gameplay folders and the rules each gets: the domain packages and scene the full gameplay rules;
// persistence (which owns the browser save, so it may touch the page) and audio (which owns the
// browser's sound) the clock and random rules. All four get the art-import rules.
const GAMEPLAY_RULES = [
  [DOMAIN_SRC, DOMAIN_USES],
  [SCENE_SRC, DOMAIN_USES],
  [PERSISTENCE_SRC, FORBIDDEN_USES],
  [AUDIO_SRC, FORBIDDEN_USES],
];

// Rules for the renderer packages (every packages/art-*/src/ except art-testparts, which is test support).
// A floating-point literal in comment-free, string-free code: digit.digit, a leading dot (.5), a trailing dot
// (5. not followed by a name character or another dot) or an exponent (1e-3, 2E5). The lookbehinds keep out
// property access (a.b, v2.x), hex (0xe5), a spread (...x) and 1..toString().
const FLOAT_LITERAL = /\d\.\d|(?<![\w$.\])])\.\d|(?<![\w$.])\d+\.(?![\w$.])|(?<![\w$.])\d+(?:\.\d*)?[eE][+-]?\d+/;
const ART_USES = [
  ...FORBIDDEN_USES,
  [/\bfetch\s*\(/, 'uses fetch'],
  [/\bXMLHttpRequest\b/, 'uses XMLHttpRequest'],
  [/\bdocument\./, 'uses document'],
  [/\bwindow\./, 'uses window'],
  [FLOAT_LITERAL, 'uses a floating-point literal'],
  [/\*\*/, 'uses exponentiation'],
  [/\bnavigator\./, 'uses navigator'],
  [/\blocalStorage\b/, 'uses localStorage'],
  [/\bsessionStorage\b/, 'uses sessionStorage'],
  [/\bsetTimeout\b/, 'uses setTimeout'],
  [/\bsetInterval\b/, 'uses setInterval'],
  [/\bcrypto\./, 'uses crypto'],
  [/\bIntl\b/, 'uses Intl'],
  [/\blocaleCompare\b/, 'uses localeCompare'],
  [/\btoLocale\w*/, 'uses toLocale'],
  [/\bDate\.parse\b/, 'uses Date.parse'],
  [/\bprocess\./, 'uses process'],
];
// Math functions that are exact on integers; any other Math.<name> is reported by name.
const ALLOWED_MATH = new Set(['floor', 'imul', 'max', 'min', 'abs', 'trunc']);
const MATH_USE = /\bMath\s*\.\s*([A-Za-z_$][\w$]*)/g;
const ALLOWED_DOMAIN_IMPORTS = ['@cf/domain-rand', '@cf/domain-speciestraits'];
const ALLOWED_PACKAGE_IMPORTS = ['@cf/art-format', '@cf/art-recipe', '@cf/art-compose', ...ALLOWED_DOMAIN_IMPORTS];
const isPackage = (spec, name) => spec === name || spec.startsWith(name + '/');
const isGameplayImport = (spec) => spec.startsWith('@cf/domain-') && !ALLOWED_DOMAIN_IMPORTS.some((ok) => isPackage(spec, ok));

/** True when the specifier is an allowed package, or a relative path that resolves inside the importing package's src/. */
function importAllowed(path, spec) {
  if (ALLOWED_PACKAGE_IMPORTS.some((ok) => isPackage(spec, ok))) return true;
  if (!spec.startsWith('./') && !spec.startsWith('../')) return false;
  const src = path.slice(0, path.indexOf('/src/') + '/src/'.length);
  const target = posix.normalize(posix.join(posix.dirname(path), spec));
  return target.startsWith(src);
}

function checkArt(path, text) {
  const problems = new Set();
  const { kept, bare, division } = scanCode(text);
  for (const [re, reason] of ART_USES) if (re.test(bare)) problems.add(`${path}: ${reason}`);
  for (const m of bare.matchAll(MATH_USE)) if (!ALLOWED_MATH.has(m[1])) problems.add(`${path}: uses Math.${m[1]}`);
  if (division) problems.add(`${path}: uses division`);
  const specs = importedSpecifiers(kept);
  if (specs.some(isGameplayImport)) problems.add(`${path}: imports a gameplay package`);
  if (specs.some((spec) => !isGameplayImport(spec) && !importAllowed(path, spec))) problems.add(`${path}: imports outside the renderer`);
  return [...problems];
}

/** True for a path the purity check examines. */
const isChecked = (path) => ART_SRC.test(path) || APP_SRC.test(path) || GAMEPLAY_RULES.some(([folder]) => folder.test(path));

/** One message per reason per file; files under packages/domain/<name>/src/ and packages/scene/src/ get the
 *  gameplay rules, under packages/persistence/src/ and packages/audio/src/ the clock, random and art-import
 *  rules, and under packages/art-<name>/src/ (except art-testparts) the renderer rules; files under
 *  apps/game/src/ get the clock, random and entropy rules, and inside its platform/ folder only the
 *  Math.random rule; files under apps/game/src/space/ may use of Math only abs, floor, ceil, round, trunc, min,
 *  max, sqrt, imul and sign, each by its name, and no `**`; everything else is ignored. A NUL byte in any examined file is reported. */
export function checkPurity(files) {
  const problems = [];
  for (const { path, text } of files) {
    if (isChecked(path) && text.includes('\0')) problems.push(`${path}: contains a NUL byte`);
    if (ART_SRC.test(path)) {
      problems.push(...checkArt(path, text));
      continue;
    }
    if (APP_SRC.test(path)) {
      const { bare } = scanCode(text);
      for (const [re, reason] of APP_PLATFORM.test(path) ? APP_PLATFORM_USES : APP_USES) if (re.test(bare)) problems.push(`${path}: ${reason}`);
      if (APP_SPACE.test(path)) {
        const uses = [...bare.matchAll(MATH_USE)];
        for (const name of new Set(uses.map((m) => m[1]).filter((name) => !EXACT_MATH.has(name)))) problems.push(`${path}: uses Math.${name}`);
        if ((bare.match(/(?<![.\w$])Math\b/g) ?? []).length !== uses.length) problems.push(`${path}: uses Math other than by a listed function`);
        if (/\*\*/.test(bare)) problems.push(`${path}: uses exponentiation`);
      }
      continue;
    }
    const rules = GAMEPLAY_RULES.find(([folder]) => folder.test(path))?.[1];
    if (rules === undefined) continue;
    // Forbidden uses are matched against code with comments and string text blanked (a table of quoted v1 lines
    // is not a use); imports are found as before, in the comment-free text that keeps string literals.
    const { bare } = scanCode(text);
    for (const [re, reason] of rules) if (re.test(bare)) problems.push(`${path}: ${reason}`);
    const specs = importedSpecifiers(stripComments(text));
    if (specs.some((s) => s.startsWith('@cf/art'))) problems.push(`${path}: imports an art package`);
    if (specs.some((s) => s === 'pixi.js')) problems.push(`${path}: imports pixi.js`);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkPurity(readRepoFiles(isChecked));
  for (const p of problems) console.error(p);
  if (problems.length > 0) process.exit(1);
  console.log('purity check: ok');
}
