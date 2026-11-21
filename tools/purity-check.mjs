import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRepoFiles } from './tracked-files.mjs';
import { scanCode } from './scan-code.mjs';

const DOMAIN_SRC = /^packages\/domain\/[^/]+\/src\//;
// Every packages/art-<name>/src/ folder, at any depth below it, except the placeholder parts in art-testparts.
const ART_SRC = /^packages\/art-(?!testparts\/)[^/]+\/src\//;
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
// `from '<spec>'`, bare `import '<spec>'`, and `import('<spec>')`.
const IMPORT_SPEC = /(?:\bfrom\s*|\bimport\s*\(?\s*)(['"])([^'"\n]+)\1/g;

function importedSpecifiers(code) {
  return [...code.matchAll(IMPORT_SPEC)].map((m) => m[2]);
}


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

/** One message per reason per file; text files under packages/domain/<name>/src/ get the gameplay rules and under
 *  packages/art-<name>/src/ (except art-testparts) the renderer rules; everything else is ignored. */
export function checkPurity(files) {
  const problems = [];
  for (const { path, text } of files) {
    if (text === null) continue;
    if (ART_SRC.test(path)) {
      problems.push(...checkArt(path, text));
      continue;
    }
    if (!DOMAIN_SRC.test(path)) continue;
    const code = stripComments(text);
    for (const [re, reason] of FORBIDDEN_USES) if (re.test(code)) problems.push(`${path}: ${reason}`);
    const specs = importedSpecifiers(code);
    if (specs.some((s) => s.startsWith('@cf/art'))) problems.push(`${path}: imports an art package`);
    if (specs.some((s) => s === 'pixi.js')) problems.push(`${path}: imports pixi.js`);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkPurity(readRepoFiles((path) => DOMAIN_SRC.test(path) || ART_SRC.test(path)));
  for (const p of problems) console.error(p);
  if (problems.length > 0) process.exit(1);
  console.log('purity check: ok');
}
