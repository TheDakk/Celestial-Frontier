// Records answers from the v1 game file for the tests that read that file live in the current game.
// Usage: node tools/record-v1-fixtures.mjs --ref <folder holding celestial-frontier.html> [--only <name>]
// Writes fixtures/v1/recorded/<name>.json, one per test, named after the test. The path is not
// written to any output.
// Each recorder takes from v1 exactly what its test takes, located the way its test locates it, and
// evaluates v1 code the way its test does. This tool is run by hand; no test imports it.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const GAME_HTML = 'celestial-frontier.html';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const occurrences = (text, needle) => text.split(needle).length - 1;

/** The unique inline script, byte for byte, as the current game's test-support/tracked-v1-source.ts extracts it. */
export function extractTrackedV1Script(html) {
  const open = '<script>';
  const close = '</script>';
  const openCount = occurrences(html, open);
  const closeCount = occurrences(html, close);
  if (openCount !== 1 || closeCount !== 1) {
    throw new Error(`tracked game HTML must contain exactly one literal script body (open=${openCount}, close=${closeCount})`);
  }
  const start = html.indexOf(open) + open.length;
  const end = html.indexOf(close, start);
  if (end < start) throw new Error('tracked game HTML script boundaries are reversed');
  const script = html.slice(start, end);
  if (script.trim().length === 0) throw new Error('tracked game HTML script body is empty');
  return script;
}

/* ---- sessionrng: the lexical Math.random census, transcribed from sessionrng.test.ts ---- */

/** Mask comments, quoted strings and template text without changing offsets or newlines. */
function maskCommentsAndStrings(source) {
  const masked = source.split('');
  const frames = [{ kind: 'code', templateBraceDepth: null }];
  const hide = (index) => {
    if (masked[index] !== '\n' && masked[index] !== '\r') masked[index] = ' ';
  };
  for (let index = 0; index < source.length; index++) {
    const frame = frames[frames.length - 1];
    const char = source[index];
    const next = source[index + 1];
    if (frame.kind === 'line-comment') {
      if (char === '\n' || char === '\r') frames.pop();
      else hide(index);
      continue;
    }
    if (frame.kind === 'block-comment') {
      hide(index);
      if (char === '*' && next === '/') {
        hide(index + 1);
        index++;
        frames.pop();
      }
      continue;
    }
    if (frame.kind === 'single' || frame.kind === 'double') {
      hide(index);
      if (char === '\\') {
        if (next !== undefined) hide(++index);
      } else if ((frame.kind === 'single' && char === "'") || (frame.kind === 'double' && char === '"')) {
        frames.pop();
      }
      continue;
    }
    if (frame.kind === 'template') {
      hide(index);
      if (char === '\\') {
        if (next !== undefined) hide(++index);
      } else if (char === '`') {
        frames.pop();
      } else if (char === '$' && next === '{') {
        hide(++index);
        frames.push({ kind: 'code', templateBraceDepth: 1 });
      }
      continue;
    }
    if (frame.kind !== 'code') throw new Error(`unhandled lexical frame ${frame.kind}`);

    if (char === '/' && next === '/') {
      hide(index); hide(++index);
      frames.push({ kind: 'line-comment' });
    } else if (char === '/' && next === '*') {
      hide(index); hide(++index);
      frames.push({ kind: 'block-comment' });
    } else if (char === "'") {
      hide(index);
      frames.push({ kind: 'single' });
    } else if (char === '"') {
      hide(index);
      frames.push({ kind: 'double' });
    } else if (char === '`') {
      hide(index);
      frames.push({ kind: 'template' });
    } else if (frame.templateBraceDepth !== null && char === '{') {
      frame.templateBraceDepth++;
    } else if (frame.templateBraceDepth !== null && char === '}') {
      frame.templateBraceDepth--;
      if (frame.templateBraceDepth === 0) {
        hide(index);
        frames.pop();
      }
    }
  }
  return masked.join('');
}

/** Every executable `Math.random(` with its 1-based line, its occurrence on that line and the trimmed line. */
export function scanExecutableMathRandom(source) {
  const executable = maskCommentsAndStrings(source);
  const starts = [...executable.matchAll(/\bMath\s*\.\s*random\s*\(/g)].map(({ index }) => index);
  const sourceLines = source.split(/\r?\n/);
  const seen = new Map();
  return starts.map((start) => {
    const legacyLine = executable.slice(0, start).split('\n').length;
    const occurrenceOnLine = (seen.get(legacyLine) ?? 0) + 1;
    seen.set(legacyLine, occurrenceOnLine);
    return { legacyLine, occurrenceOnLine, sourceLine: (sourceLines[legacyLine - 1] ?? '').trim() };
  });
}

/* ---- the recorders ---- */

/** One slice from `start` (which must occur once) to the end of the first `end` after it, as companion-care.test.ts cuts. */
function cutUnique(text, start, end) {
  const i = text.indexOf(start);
  if (i < 0) throw new Error(`v1 script has no ${start}`);
  if (text.indexOf(start, i + 1) !== -1) throw new Error(`${start} is not unique in the v1 script`);
  const j = text.indexOf(end, i);
  if (j < 0) throw new Error(`v1 script has no ${end} after ${start}`);
  return text.slice(i, j + end.length);
}

export const recorders = {
  sessionrng: {
    test: 'packages/domain/sessionrng/test/sessionrng.test.ts',
    kind: 'outputs',
    taken: 'Every executable Math.random( in the whole v1 script, found by the test\'s lexer (comments, quoted strings and template text masked): {legacyLine, occurrenceOnLine, sourceLine}, in script order. Lines count from the first byte after <script>.',
    record: ({ script }) => scanExecutableMathRandom(script),
  },
  'loot-catalogue': {
    test: 'packages/domain/loot/test/catalogue.test.ts',
    kind: 'outputs',
    taken: 'The v1 ITEMS literal (script slice from "const ITEMS=" to "\\n];\\nconst ITEM_BY"), evaluated with node:vm, projected to the test\'s 17 fields, in v1 order.',
    record: ({ script }) => {
      const start = script.indexOf('const ITEMS=[');
      const end = script.indexOf('\n];\nconst ITEM_BY', start);
      if (start < 0 || end <= start) throw new Error('v1 script has no ITEMS literal');
      const items = runInNewContext(script.slice(start + 'const ITEMS='.length, end + 2), Object.create(null));
      return items.map((item) => ({
        id: item.id,
        category: item.cat,
        slot: item.slot ?? null,
        name: item.name,
        family: item.fam,
        hue: item.hue,
        description: item.d,
        tier: item.tier,
        authoredRarityTier: item.rar ?? null,
        effects: item.eff ?? {},
        implicits: Object.keys(item.eff ?? {}).sort(),
        materialCost: item.cost,
        partCost: item.parts ?? null,
        stardustCost: item.sd ?? null,
        prerequisiteId: item.req ?? null,
        signatureId: item.sig ?? null,
        unlock: item.unlock ?? null,
      }));
    },
  },
  'acquisition-companion-care': {
    test: 'packages/domain/acquisition/test/companion-care.test.ts',
    kind: 'outputs',
    taken: 'v1 faunaTastes({seed}) for seed = (s*2654435761)>>>0, s = 0..4999, run with new Function over three unique script slices: "function mulberry32(a){" to "/4294967296}}", "const STAT_KEYS=[\'vit\'" to "];", "function faunaTastes(g){" to "dislikes:[ks[4]]};\\n}".',
    record: ({ script }) => {
      const mulberry = cutUnique(script, 'function mulberry32(a){', '/4294967296}}');
      const keys = cutUnique(script, "const STAT_KEYS=['vit'", '];');
      const tastes = cutUnique(script, 'function faunaTastes(g){', 'dislikes:[ks[4]]};\n}');
      const faunaTastes = new Function(`${mulberry}\n${keys}\n${tastes}\nreturn faunaTastes;`)();
      const cases = [];
      for (let s = 0; s < 5_000; s++) {
        const seed = (s * 2654435761) >>> 0;
        const { likes, dislikes } = faunaTastes({ seed });
        cases.push({ seed, likes, dislikes });
      }
      return cases;
    },
  },
  'progression-achievements': {
    test: 'packages/domain/progression/test/achievements.test.ts',
    kind: 'outputs',
    taken: 'The v1 ACH rows (HTML slice from "const ACH=[" to "];\\n/* survey hooks"), matched by the test\'s pattern {id, cat, ic, name, d} with \\uXXXX escapes in name and d decoded: {id, category, icon, name, description}, in v1 order.',
    record: ({ html }) => {
      const begin = html.indexOf('const ACH=[');
      const end = html.indexOf('];\n/* survey hooks', begin);
      if (begin <= 0 || end <= begin) throw new Error('v1 HTML has no ACH table');
      const pattern = /\{id:'([^']+)',\s*cat:'([^']+)',\s*ic:'([^']+)',\s*name:'([^']+)',\s*d:'([^']+)',\s*t:/gu;
      const decode = (value) => value.replace(/\\u([0-9a-f]{4})/giu, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
      return [...html.slice(begin, end).matchAll(pattern)].map((m) => ({
        id: m[1], category: m[2], icon: m[3], name: decode(m[4]), description: decode(m[5]),
      }));
    },
  },
  'persistence-training-checkpoint': {
    test: 'packages/persistence/test/training-checkpoint.test.ts',
    kind: 'hash',
    taken: 'SHA-256 and byte length of the three whole files the test hashes, each named by its path from the v1 folder and by the role whose <role>Sha256 field training-restart-fixture.json stores.',
    record: ({ readV1File }) => [
      ['gameHtml', GAME_HTML],
      ['probeHarness', 'tools/_probeboot.js'],
      ['captureDriver', 'tools/training-restart-fixture.js'],
    ].map(([role, file]) => {
      const bytes = readV1File(file);
      return { role, file, sha256: sha256(bytes), bytes: bytes.length };
    }),
  },
};

/** Builds one fixture object from the v1 folder's files. `readV1File(relativePath)` returns a Buffer. */
export function recordV1Fixture(name, readV1File) {
  const recorder = recorders[name];
  if (!recorder) throw new Error(`no recorder named ${name}`);
  const htmlBytes = readV1File(GAME_HTML);
  const html = htmlBytes.toString('utf8');
  const script = extractTrackedV1Script(html);
  const cases = recorder.record({ html, script, readV1File });
  return {
    kind: recorder.kind,
    source: `${GAME_HTML} sha256:${sha256(htmlBytes)} bytes:${htmlBytes.length}`,
    test: recorder.test,
    provenance: {
      htmlSha256: sha256(htmlBytes),
      htmlBytes: htmlBytes.length,
      scriptSha256: sha256(script),
      scriptBytes: Buffer.byteLength(script),
    },
    taken: recorder.taken,
    cases,
  };
}

/** Stable text: header fields one per line, then one case per line. */
export function serializeFixture(fixture) {
  const { cases, ...header } = fixture;
  const head = Object.entries(header).map(([key, value]) => ` ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
  const body = cases.map((c, i) => `  ${JSON.stringify(c)}${i < cases.length - 1 ? ',' : ''}`);
  return ['{', ...head, ' "cases": [', ...body, ' ]', '}', ''].join('\n');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { ref, only } = parseArgs(process.argv.slice(2));
  const names = only === undefined ? Object.keys(recorders) : [only];
  if (!ref || names.some((name) => !recorders[name])) {
    console.error(`usage: node tools/record-v1-fixtures.mjs --ref <path> [--only <${Object.keys(recorders).join('|')}>]`);
    process.exit(2);
  }
  const root = resolve(ref);
  const readV1File = (file) => readFileSync(join(root, file));
  const outDir = fileURLToPath(new URL('../fixtures/v1/recorded/', import.meta.url));
  mkdirSync(outDir, { recursive: true });
  for (const name of names) {
    const fixture = recordV1Fixture(name, readV1File);
    writeFileSync(join(outDir, `${name}.json`), serializeFixture(fixture));
    console.log(`recorded ${name}: ${fixture.kind}, ${fixture.cases.length} cases`);
  }
}
