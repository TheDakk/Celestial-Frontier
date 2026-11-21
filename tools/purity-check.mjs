import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DOMAIN_SRC = /^packages\/domain\/[^/]+\/src\//;
const COMMENTS = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;
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

/** One message per reason per file; only files under packages/domain/<name>/src/ are examined. */
export function checkPurity(files) {
  const problems = [];
  for (const { path, text } of files) {
    if (!DOMAIN_SRC.test(path)) continue;
    const code = text.replace(COMMENTS, '');
    for (const [re, reason] of FORBIDDEN_USES) if (re.test(code)) problems.push(`${path}: ${reason}`);
    const specs = importedSpecifiers(code);
    if (specs.some((s) => s.startsWith('@cf/art'))) problems.push(`${path}: imports an art package`);
    if (specs.some((s) => s === 'pixi.js')) problems.push(`${path}: imports pixi.js`);
  }
  return problems;
}

function readTracked() {
  const paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter((p) => DOMAIN_SRC.test(p));
  return paths.map((path) => ({ path, text: readFileSync(path, 'utf8') }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkPurity(readTracked());
  for (const p of problems) console.error(p);
  if (problems.length > 0) process.exit(1);
  console.log('purity check: ok');
}
