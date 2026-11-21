import { fileURLToPath } from 'node:url';
import { readRepoFiles } from './tracked-files.mjs';
import { scanCode } from './scan-code.mjs';

const DOMAIN_SRC = /^packages\/domain\/[^/]+\/src\//;
const ART_SRC = /^packages\/(?:art-format|art-recipe|art-compose)\/src\//;
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


// Rules for the renderer packages (art-format, art-recipe, art-compose); art-testparts is test support and is not covered.
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
];
const ALLOWED_DOMAIN_IMPORTS = ['@cf/domain-rand', '@cf/domain-speciestraits'];
const isGameplayImport = (spec) =>
  spec.startsWith('@cf/domain-') && !ALLOWED_DOMAIN_IMPORTS.some((ok) => spec === ok || spec.startsWith(ok + '/'));

function checkArt(path, text) {
  const problems = [];
  const { kept, bare, division } = scanCode(text);
  for (const [re, reason] of ART_USES) if (re.test(bare)) problems.push(`${path}: ${reason}`);
  if (division) problems.push(`${path}: uses division`);
  if (importedSpecifiers(kept).some(isGameplayImport)) problems.push(`${path}: imports a gameplay package`);
  return problems;
}

/** One message per reason per file; text files under packages/domain/<name>/src/ get the gameplay rules and under
 *  packages/art-{format,recipe,compose}/src/ the renderer rules; everything else is ignored. */
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
