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

/* file → the exact legacy expressions allowed there, WITH the recorded
   reason. These are deliberately narrower than a file-wide pattern waiver:
   a newly added `document.*` in either file must still fail the gate. */
const EXCEPTIONS: Record<string, Array<{ forbidden: RegExp; exact: RegExp; why: string }>> = {
  'combatcore/src/combatcore.verbatim.js': [
    { forbidden: /\bdocument\s*\./, exact: /const S2=240,cv=document\.createElement\(''\);cv\.width=cv\.height=S2;/, why: 'playerAvatar canvas is app-coupled and moves to the app layer.' },
    { forbidden: /\bdocument\s*\./, exact: /const W2=360,H2=600,cv=document\.createElement\(''\);cv\.width=W2\*2;cv\.height=H2\*2;/, why: 'paperdollAvatar canvas is app-coupled and moves to the app layer.' },
  ],
  'worldgen/src/worldgen.verbatim.js': [
    { forbidden: /\bdocument\s*\./, exact: /const T=2048, cv2=document\.createElement\(''\); cv2\.width=cv2\.height=T;/, why: 'galaxyHaze is a known legacy render helper awaiting art-layer relocation.' },
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

function scanFile(rel: string, raw: string): string[] {
  let src = codeOnly(raw);
  const hits: string[] = [];
  for (const exception of EXCEPTIONS[rel] || []) {
    const matcher = new RegExp(exception.exact.source, exception.exact.flags.includes('g')
      ? exception.exact.flags : exception.exact.flags + 'g');
    const count = [...src.matchAll(matcher)].length;
    if (count !== 1) {
      hits.push(`legacy exception changed or duplicated (${exception.why}; found ${count})`);
    } else {
      src = src.replace(exception.exact, ' ');
    }
  }
  for (const [re, why] of FORBIDDEN) if (re.test(src)) hits.push(`${re} (${why})`);
  return hits;
}

describe('★ GATE B — no-DOM / no-nondeterminism lint over packages/domain', () => {
  const files = [...walk(domainRoot)];
  it(`scans a sane file set (${files.length} files)`, () => {
    expect(files.length).toBeGreaterThan(20);
  });
  for (const f of files) {
    const rel = path.relative(domainRoot, f).replace(/\\/g, '/');
    it(rel, () => {
      const hits = scanFile(rel, fs.readFileSync(f, 'utf8'));
      expect(hits, hits.join('; ')).toEqual([]);
    });
  }
  it('negative control: an extra DOM access in an exempt file is still rejected', () => {
    const rel = 'combatcore/src/combatcore.verbatim.js';
    const raw = fs.readFileSync(path.join(domainRoot, rel), 'utf8')
      + '\nfunction injectedDomRegression(){ document.body; }\n';
    expect(scanFile(rel, raw).join('; ')).toMatch(/DOM access/);
  });
});
