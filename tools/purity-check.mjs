import { fileURLToPath } from 'node:url';
import { readRepoFiles } from './tracked-files.mjs';

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

/** One message per reason per file; only text files under packages/domain/<name>/src/ are examined. */
export function checkPurity(files) {
  const problems = [];
  for (const { path, text } of files) {
    if (!DOMAIN_SRC.test(path) || text === null) continue;
    const code = text.replace(COMMENTS, '');
    for (const [re, reason] of FORBIDDEN_USES) if (re.test(code)) problems.push(`${path}: ${reason}`);
    const specs = importedSpecifiers(code);
    if (specs.some((s) => s.startsWith('@cf/art'))) problems.push(`${path}: imports an art package`);
    if (specs.some((s) => s === 'pixi.js')) problems.push(`${path}: imports pixi.js`);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkPurity(readRepoFiles((path) => DOMAIN_SRC.test(path)));
  for (const p of problems) console.error(p);
  if (problems.length > 0) process.exit(1);
  console.log('purity check: ok');
}
