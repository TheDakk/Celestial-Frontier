import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanCode } from '../tools/scan-code.mjs';
import { readRepoFiles } from '../tools/tracked-files.mjs';

/*
 * Package tests stay inside their bounds: no file in a test/ folder under packages/ imports from apps/ or
 * reads a path outside the repository. Tests that need more than one package live in tests/cross/.
 *
 * What is checked: every string literal in the file's code (comments removed; quoted strings and
 * template literals without a `${}` substitution). Each literal is one specifier or path argument,
 * whatever it is passed to: import, export-from, import(), require(), new URL(), readFileSync and so on.
 * - Imports from apps/: a literal that resolves into the repository's apps/ folder (a relative literal
 *   resolved from the test file's folder, or one starting `apps/`), or that names an app package
 *   (the `name` in any apps/<name>/package.json), alone or with a subpath.
 * - Reads a path outside the repository: an absolute path, or a relative literal (`./` or `../`) that,
 *   resolved from the test file's folder, climbs above the repository root. An absolute path is a
 *   literal starting `file:`, `~/` or a drive letter (`C:\`, `C:/`), or a literal of path characters
 *   (letters, digits, `.`, `_`, `-`, `@`) that starts with `/` and has two or more segments
 *   (`/tmp/a`) or one segment with a file extension (`/a.json`).
 *
 * What it cannot detect: a path built at run time (path.join or path.resolve over separate segments,
 * string concatenation, a template literal with a substitution, process.cwd(), os.homedir(), an
 * environment variable); a relative path that the reader resolves against something other than the
 * test file's folder (a read relative to the working directory); an absolute path of one segment with no
 * extension (`/tmp`) or with other characters in it (a space); a path read on the test's behalf by a
 * helper outside those test/ folders; and a symbolic link inside the repository that points outside it.
 * Shorter slash-led strings are left alone on purpose: tests use them as id fragments (`'/eyes/'`, `'/v0'`).
 */

const PACKAGE_TEST = /^packages\/(?:.+\/)?test\//;
const SCRIPT = /\.(?:[cm]?[jt]s|tsx|jsx)$/;
const ABSOLUTE = /^(?:file:|~\/|[A-Za-z]:[\\/]|\/[\w.@-]+(?:\/[\w.@-]+)+\/?$|\/[\w@-]+\.\w+$)/;
const RELATIVE = /^\.{1,2}(?:\/|$)/;

type Entry = { path: string; text: string };

/** The text of every quoted string and every template literal without a substitution in `code`. */
function stringLiterals(code: string): string[] {
  const found: string[] = [];
  let i = 0;
  const quoted = (quote: string): void => {
    let value = '';
    for (i++; i < code.length && code[i] !== quote && code[i] !== '\n'; i++) {
      value += code[i] === '\\' ? code[i] + (code[++i] ?? '') : code[i];
    }
    i++;
    found.push(value);
  };
  const template = (): void => {
    let value = '';
    let plain = true;
    for (i++; i < code.length && code[i] !== '`'; i++) {
      if (code[i] === '\\') value += code[i] + (code[++i] ?? '');
      else if (code[i] === '$' && code[i + 1] === '{') { plain = false; i += 2; scan(true); i--; }
      else value += code[i];
    }
    i++;
    if (plain) found.push(value);
  };
  // Leaves `i` just past the `}` that closes a template substitution when `untilBrace` is set.
  function scan(untilBrace: boolean): void {
    let depth = 0;
    while (i < code.length) {
      const c = code[i]!;
      if (c === "'" || c === '"') { quoted(c); continue; }
      if (c === '`') { template(); continue; }
      if (c === '{') depth++;
      if (c === '}') {
        if (untilBrace && depth === 0) { i++; return; }
        depth--;
      }
      i++;
    }
  }
  scan(false);
  return found;
}

/** One message per out-of-bounds literal; `appNames` are the package names of the apps. */
function findOutOfBounds(files: ReadonlyArray<Entry>, appNames: ReadonlyArray<string>): string[] {
  const problems: string[] = [];
  for (const { path: file, text } of files) {
    if (!PACKAGE_TEST.test(file) || !SCRIPT.test(file)) continue;
    for (const literal of stringLiterals(scanCode(text).kept)) {
      if (ABSOLUTE.test(literal)) {
        problems.push(`${file}: absolute path ${JSON.stringify(literal)}`);
        continue;
      }
      if (appNames.some((name) => literal === name || literal.startsWith(`${name}/`))) {
        problems.push(`${file}: imports app package ${JSON.stringify(literal)}`);
        continue;
      }
      const target = RELATIVE.test(literal)
        ? path.posix.normalize(path.posix.join(path.posix.dirname(file), literal))
        : literal.startsWith('apps/') ? literal : null;
      if (target === null) continue;
      if (target === '..' || target.startsWith('../')) {
        problems.push(`${file}: path outside the repository ${JSON.stringify(literal)}`);
      } else if (target === 'apps' || target.startsWith('apps/')) {
        problems.push(`${file}: path into apps/ ${JSON.stringify(literal)}`);
      }
    }
  }
  return problems;
}

function repoState(): { files: Entry[]; appNames: string[] } {
  // A file with a NUL byte comes back with its text too (decoded as latin1), so no test file is skipped.
  const files = readRepoFiles((p) => PACKAGE_TEST.test(p) || /^apps\/[^/]+\/package\.json$/.test(p));
  const appNames = files
    .filter((f) => /^apps\/[^/]+\/package\.json$/.test(f.path))
    .map((f) => (JSON.parse(f.text) as { name: string }).name);
  return { files, appNames };
}

describe('package test bounds', () => {
  it('no package test imports from apps/ or reads a path outside the repository', () => {
    const { files, appNames } = repoState();
    // The instrument sees the real tree: package tests and at least one app package.
    expect(files.filter((f) => PACKAGE_TEST.test(f.path) && SCRIPT.test(f.path)).length).toBeGreaterThan(50);
    expect(appNames.length).toBeGreaterThan(0);
    expect(findOutOfBounds(files, appNames)).toEqual([]);
  });

  it('flags each kind of out-of-bounds literal (controls)', () => {
    const at = (text: string, file = 'packages/domain/x/test/a.test.ts') => findOutOfBounds([{ path: file, text }], ['@cf/game']);
    expect(at("import { a } from '../../../../apps/game/src/a.js';")).toEqual([
      "packages/domain/x/test/a.test.ts: path into apps/ \"../../../../apps/game/src/a.js\""]);
    expect(at("const a = await import('@cf/game/src/a.js');")).toEqual([
      "packages/domain/x/test/a.test.ts: imports app package \"@cf/game/src/a.js\""]);
    expect(at('readFileSync("apps/game/a.json")')).toEqual([
      'packages/domain/x/test/a.test.ts: path into apps/ "apps/game/a.json"']);
    expect(at("new URL('../../../../../outside.json', import.meta.url)")).toEqual([
      "packages/domain/x/test/a.test.ts: path outside the repository \"../../../../../outside.json\""]);
    expect(at('readFileSync(`/tmp/outside.json`)')).toEqual([
      'packages/domain/x/test/a.test.ts: absolute path "/tmp/outside.json"']);
    expect(at("new URL('file:///tmp/a')")).toEqual([
      "packages/domain/x/test/a.test.ts: absolute path \"file:///tmp/a\""]);
    expect(at("import x from '../../../../apps/a.js'", 'packages/scene/test/deep/a.test.ts')).toEqual([
      "packages/scene/test/deep/a.test.ts: path into apps/ \"../../../../apps/a.js\""]);
    // A quoted literal inside a template substitution is still seen; the template itself is not a literal.
    expect(at("const a = `${read('/tmp/a')}/${b}`; const c = `x`;")).toEqual([
      'packages/domain/x/test/a.test.ts: absolute path "/tmp/a"']);
  });

  it('passes in-bounds literals and ignores comments and files outside package tests (controls)', () => {
    const at = (text: string, file = 'packages/domain/x/test/a.test.ts') => findOutOfBounds([{ path: file, text }], ['@cf/game']);
    expect(at([
      "import { canon } from '../../../../tests/support/parity.js';",
      "readFileSync(new URL('../../../../fixtures/current/a.json', import.meta.url));",
      "import { a } from '../src/index.js'; import { b } from '@cf/domain-rand';",
      "path.join(here, '..', '..'); s.split('/'); const n = '~8 billion'; const g = '@cf/gamer';",
      "id.includes('/eyes/') || id.endsWith('/v0'); const note = '/* not a path */';",
      "// import '../../../../../outside.js'",
      "/* readFileSync('/tmp/a') */",
    ].join('\n'))).toEqual([]);
    expect(at("import '/tmp/a.js'", 'tests/cross/a.test.ts')).toEqual([]);
    expect(at("import '/tmp/a.js'", 'packages/domain/x/src/a.ts')).toEqual([]);
    expect(at("import '/tmp/a.js'", 'packages/domain/x/test/data.json')).toEqual([]);
  });
});
