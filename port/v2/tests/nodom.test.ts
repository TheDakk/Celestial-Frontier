/* ═══ GATE B DELIVERABLE: the no-DOM lint ═══
   The domain layer must run identically in browser, Node, and any future
   runtime: no DOM, no clock, no storage, no nondeterminism. This scans every
   packages/domain source file for forbidden globals.

   EXCEPTIONS ARE EXPLICIT AND EACH CARRIES ITS REASON — an exception without
   a reason is a lint hole, not a policy. */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const domainRoot = path.join(here, '..', 'packages', 'domain');

/* pattern → why it is forbidden in the domain layer */
const FORBIDDEN: Array<[RegExp, string]> = [
  [/\bdocument\s*\./, 'DOM access'],
  [/\bwindow\s*\./, 'browser global'],
  [/\blocalStorage\b/, 'storage — SaveSystem is app layer'],
  [/\bsessionStorage\b/, 'storage'],
  [/\bnavigator\s*\./, 'browser global'],
  [/\bMath\.random\s*\(/, 'NONDETERMINISM — the cardinal sin (CLAUDE.md rule 1)'],
  [/\bDate\.now\s*\(/, 'wall clock — COSMIC_EPOCH is the only time authority'],
  [/\bnew\s+Date\s*\(\s*\)/, 'wall clock'],
  [/\brequestAnimationFrame\b/, 'render loop — app layer'],
  [/\bperformance\s*\.\s*now\b/, 'wall clock'],
  [/\bfetch\s*\(/, 'network'],
  [/\bXMLHttpRequest\b/, 'network'],
];

/* file → allowed patterns there, WITH the recorded reason */
const EXCEPTIONS: Record<string, Array<{ re: RegExp; why: string }>> = {
  'combatcore/src/combatcore.verbatim.js': [
    { re: /\bdocument\s*\./, why: 'playerAvatar/paperdollAvatar draw canvases — app-coupled exports documented in index.ts; no fixture path reaches them. They move to the app layer in Phase 2+.' },
  ],
  'worldgen/src/worldgen.verbatim.js': [
    { re: /\bdocument\s*\./, why: '★ FINDING (2026-07-31): galaxyHaze draws a 2048px canvas INSIDE the WorldGen [domain] module — the source violates its OWN architecture rule ("domain: no DOM"). Only the Renderer (app) calls it; no fixture can serialize a canvas. Carried verbatim; flagged for relocation upstream (main.js) and to the art layer in Phase 4.' },
  ],
};

function* walk(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'test' && e.name !== 'node_modules') yield* walk(p); }
    else if (/\.(ts|js)$/.test(e.name) && !e.name.endsWith('.d.ts')) yield p;
  }
}

/* strip comments and string literals so prose like "no DOM" cannot trip the
   lint — same discipline as the lifter's import detection */
function codeOnly(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

describe('★ GATE B — no-DOM / no-nondeterminism lint over packages/domain', () => {
  const files = [...walk(domainRoot)];
  it(`scans a sane file set (${files.length} files)`, () => {
    expect(files.length).toBeGreaterThan(20);
  });
  for (const f of files) {
    const rel = path.relative(domainRoot, f).replace(/\\/g, '/');
    it(rel, () => {
      const src = codeOnly(fs.readFileSync(f, 'utf8'));
      const allowed = EXCEPTIONS[rel] || [];
      const hits: string[] = [];
      for (const [re, why] of FORBIDDEN) {
        if (!re.test(src)) continue;
        if (allowed.some((a) => String(a.re) === String(re))) continue;
        hits.push(`${re} (${why})`);
      }
      expect(hits, hits.join('; ')).toEqual([]);
    });
  }
});
