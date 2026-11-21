import { fileURLToPath } from 'node:url';
import { readRepoFiles } from './tracked-files.mjs';

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


// Words after which a `/` starts a regular-expression literal, not a division.
const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do', 'yield', 'await', 'instanceof']);
const WORD_CHAR = /[A-Za-z0-9_$]/;

/**
 * A small tokenizer for the art packages. Returns `kept` (comments removed, regular-expression literals
 * replaced by `RE`, string literals kept for import detection), `bare` (the same with the contents of
 * string and template text blanked, so only real code is left) and whether a `/` division operator occurs.
 * A `/` is a division when the previous significant token is an operand (identifier, number, `)` or `]`);
 * otherwise it starts a regular expression. Code inside a template's `${ }` is scanned as code.
 */
function scanCode(text) {
  let kept = '';
  let bare = '';
  let division = false;
  let i = 0;
  const emit = (k, b = k) => { kept += k; bare += b; };

  function code(untilBrace) {
    let operand = false;
    let depth = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
      if (c === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2);
        i = end < 0 ? text.length : end + 2;
        emit(' ');
        continue;
      }
      if (c === "'" || c === '"') {
        let j = i + 1;
        while (j < text.length && text[j] !== c && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1;
        emit(text.slice(i, j + 1), c + c);
        i = j + 1;
        operand = true;
        continue;
      }
      if (c === '`') {
        emit('`');
        i++;
        while (i < text.length && text[i] !== '`') {
          if (text[i] === '\\') { emit(text.slice(i, i + 2), ''); i += 2; continue; }
          if (text[i] === '$' && text[i + 1] === '{') { emit('${'); i += 2; code(true); emit('}'); continue; }
          emit(text[i], '');
          i++;
        }
        emit('`');
        i++;
        operand = true;
        continue;
      }
      if (c === '/') {
        if (operand) { division = true; emit('/'); i++; operand = false; continue; }
        let j = i + 1;
        let inClass = false;
        while (j < text.length && text[j] !== '\n' && (inClass || text[j] !== '/')) {
          if (text[j] === '\\') j++;
          else if (text[j] === '[') inClass = true;
          else if (text[j] === ']') inClass = false;
          j++;
        }
        j++;
        while (j < text.length && WORD_CHAR.test(text[j])) j++;
        emit('RE');
        i = j;
        operand = true;
        continue;
      }
      if (c === '{') depth++;
      if (c === '}') {
        if (untilBrace && depth === 0) { i++; return; }
        depth--;
      }
      if (WORD_CHAR.test(c)) {
        let j = i;
        while (j < text.length && WORD_CHAR.test(text[j])) j++;
        const word = text.slice(i, j);
        emit(word);
        i = j;
        operand = !REGEX_AFTER_WORD.has(word);
        continue;
      }
      emit(c);
      i++;
      if (c === ')' || c === ']') operand = true;
      else if (!/\s/.test(c)) operand = false;
    }
  }

  code(false);
  return { kept, bare, division };
}

// Rules for the renderer packages (art-format, art-recipe, art-compose); art-testparts is test support and is not covered.
const ART_USES = [
  ...FORBIDDEN_USES,
  [/\bfetch\s*\(/, 'uses fetch'],
  [/\bXMLHttpRequest\b/, 'uses XMLHttpRequest'],
  [/\bdocument\./, 'uses document'],
  [/\bwindow\./, 'uses window'],
  [/\d\.\d/, 'uses a floating-point literal'],
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
