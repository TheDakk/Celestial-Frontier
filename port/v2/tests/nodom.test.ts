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

/* This is the Gate B denominator, not a "sane count" proxy. A new, removed,
   renamed, or newly executable domain source must be reviewed here so the
   recursive scan cannot silently lose or gain scope. */
const EXPECTED_DOMAIN_FILES = Object.freeze([
  ['acquisition/src/_snapshot', 'registry.ts'].join('-'),
  'acquisition/src/canonical.ts',
  'acquisition/src/capture-planner.ts',
  'acquisition/src/feed.ts',
  'acquisition/src/index.ts',
  'acquisition/src/legacy.ts',
  'acquisition/src/model-v2-delta.ts',
  'acquisition/src/model-v2.ts',
  'acquisition/src/model.ts',
  'acquisition/src/ownership-v2-internal.ts',
  ['acquisition/src/snapshot', 'internal.ts'].join('-'),
  'acquisition/src/snapshot.ts',
  'biome-profile/src/index.ts',
  'combatcore/src/combatcore.verbatim.js',
  'combatcore/src/index.ts',
  'combatcore/src/lineage-codec.ts',
  'descriptors/src/apphooks.ts',
  'descriptors/src/apphooks.verbatim.js',
  'descriptors/src/describe-pick.ts',
  'descriptors/src/descriptors.verbatim.js',
  'descriptors/src/index.ts',
  'ecology/src/civilization.ts',
  'ecology/src/ecology.verbatim.js',
  'ecology/src/explicit-epoch.ts',
  'ecology/src/index.ts',
  'encutil/src/index.ts',
  'genetics/src/genetics.verbatim.js',
  'genetics/src/index.ts',
  'genome/src/genome.verbatim.js',
  'genome/src/index.ts',
  'loot/src/catalogue.ts',
  'loot/src/economy-ledger.ts',
  'loot/src/engineering-capabilities.ts',
  'loot/src/engineering-loadout-' + 'internal.ts',
  'loot/src/gear.ts',
  'loot/src/index.ts',
  'loot/src/internal.ts',
  'loot/src/inventory.ts',
  'loot/src/legacy-imbue.ts',
  'loot/src/presentation.ts',
  'loot/src/recipe.ts',
  'naming/src/cleanname.verbatim.js',
  'naming/src/index.ts',
  'opportunity/src/index.ts',
  'opportunity/src/planner.ts',
  'opportunity/src/snapshot.ts',
  'opportunity/src/state.ts',
  'planetgen/src/index.ts',
  'planetgen/src/planetgen.verbatim.js',
  'progression/src/auto-extractor.ts',
  'progression/src/index.ts',
  'progression/src/readiness.ts',
  'rand/src/index.ts',
  'sessionrng/src/index.ts',
  'speciestraits/src/index.ts',
  'speciestraits/src/speciestraits.verbatim.js',
  'speciestraits/src/statkeys.verbatim.js',
  'starcatalog/src/index.ts',
  'strays/src/index.ts',
  'strays/src/strays.verbatim.js',
  'surveyphrases/src/index.ts',
  'surveyphrases/src/surveyphrases.verbatim.js',
  'worldconfig/src/index.ts',
  'worldgen/src/index.ts',
  'worldgen/src/worldgen.verbatim.js',
] as const);

/* pattern → why it is forbidden in the domain layer */
const FORBIDDEN: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bdocument\s*\./, 'DOM access'],
  [/\bwindow\s*\./, 'browser global'],
  [/\blocalStorage\b/, 'storage — SaveSystem is app layer'],
  [/\bsessionStorage\b/, 'storage'],
  [/\bnavigator\s*\./, 'browser global'],
  [/\bMath\s*\.\s*random\s*\(/, 'NONDETERMINISM — the cardinal sin (CLAUDE.md rule 1)'],
  [/\bDate\s*\.\s*now\s*\(/, 'device wall clock — forbidden in deterministic domains'],
  [/\bnew\s+Date\s*\(\s*\)/, 'wall clock'],
  [/\brequestAnimationFrame\b/, 'render loop — app layer'],
  [/\bperformance\s*\.\s*now\b/, 'runtime monotonic clock — app-owned/injected, not domain-owned'],
  [/\bfetch\s*\(/, 'network'],
  [/\bXMLHttpRequest\b/, 'network'],
];

/* file → the exact legacy expressions allowed there, WITH the recorded
   reason. These are deliberately narrower than a file-wide pattern waiver:
   a newly added `document.*` in any exempt file must still fail the gate. */
type LegacyException = Readonly<{ forbidden: RegExp; exact: RegExp; why: string }>;
type ExceptionInventory = Readonly<Record<string, ReadonlyArray<LegacyException>>>;

const EXCEPTIONS: ExceptionInventory = {
  'combatcore/src/combatcore.verbatim.js': [
    { forbidden: /\bdocument\s*\./, exact: /const S2=240,cv=document\.createElement\(''\);cv\.width=cv\.height=S2;/, why: 'playerAvatar canvas is app-coupled and moves to the app layer.' },
    { forbidden: /\bdocument\s*\./, exact: /const W2=360,H2=600,cv=document\.createElement\(''\);cv\.width=W2\*2;cv\.height=H2\*2;/, why: 'paperdollAvatar canvas is app-coupled and moves to the app layer.' },
  ],
};

type ApprovedExceptionRow = Readonly<{
  file: string;
  forbiddenSource: string;
  forbiddenFlags: string;
  exactSource: string;
  exactFlags: string;
  why: string;
}>;

/* Independent exact seal for the only two compatibility waivers. Keep the
   scanner configuration readable above; this second representation makes a
   changed reason, widened matcher, added waiver, or removed waiver fail closed. */
const EXPECTED_EXCEPTION_INVENTORY: ReadonlyArray<ApprovedExceptionRow> = Object.freeze([
  Object.freeze({
    file: 'combatcore/src/combatcore.verbatim.js',
    forbiddenSource: String.raw`\bdocument\s*\.`,
    forbiddenFlags: '',
    exactSource: String.raw`const S2=240,cv=document\.createElement\(''\);cv\.width=cv\.height=S2;`,
    exactFlags: '',
    why: 'playerAvatar canvas is app-coupled and moves to the app layer.',
  }),
  Object.freeze({
    file: 'combatcore/src/combatcore.verbatim.js',
    forbiddenSource: String.raw`\bdocument\s*\.`,
    forbiddenFlags: '',
    exactSource: String.raw`const W2=360,H2=600,cv=document\.createElement\(''\);cv\.width=W2\*2;cv\.height=H2\*2;`,
    exactFlags: '',
    why: 'paperdollAvatar canvas is app-coupled and moves to the app layer.',
  }),
]);

function* walk(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'test' && e.name !== 'node_modules') yield* walk(p); }
    else if (/\.(ts|js)$/.test(e.name) && !e.name.endsWith('.d.ts')) yield p;
  }
}

function exactInventoryErrors(
  label: string,
  actual: readonly string[],
  expected: readonly string[],
): string[] {
  const errors: string[] = [];
  const actualCounts = new Map<string, number>();
  for (const row of actual) actualCounts.set(row, (actualCounts.get(row) ?? 0) + 1);
  const expectedSet = new Set(expected);
  for (const row of expected) {
    const count = actualCounts.get(row) ?? 0;
    if (count === 0) errors.push(`missing ${label}: ${row}`);
    else if (count !== 1) errors.push(`duplicate ${label}: ${row} (${count})`);
  }
  for (const row of actualCounts.keys()) {
    if (!expectedSet.has(row)) errors.push(`unexpected ${label}: ${row}`);
  }
  return errors;
}

function exceptionRows(exceptions: ExceptionInventory): ApprovedExceptionRow[] {
  const rows = Object.entries(exceptions).flatMap(([file, entries]) => entries.map((entry) => ({
    file,
    forbiddenSource: entry.forbidden.source,
    forbiddenFlags: entry.forbidden.flags,
    exactSource: entry.exact.source,
    exactFlags: entry.exact.flags,
    why: entry.why,
  })));
  rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return rows;
}

function exceptionInventoryErrors(exceptions: ExceptionInventory): string[] {
  const actual = exceptionRows(exceptions).map((row) => JSON.stringify(row));
  const expected = [...EXPECTED_EXCEPTION_INVENTORY]
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
    .map((row) => JSON.stringify(row));
  return exactInventoryErrors('approved exception', actual, expected);
}

function mutableExceptions(): Record<string, LegacyException[]> {
  return Object.fromEntries(Object.entries(EXCEPTIONS).map(([file, entries]) => [
    file,
    entries.map((entry) => ({ ...entry })),
  ]));
}

function requiredException(
  exceptions: ExceptionInventory,
  file: string,
  index = 0,
): LegacyException {
  const entry = exceptions[file]?.[index];
  if (!entry) throw new Error(`missing test exception ${file}[${index}]`);
  return entry;
}

function requiredMutableExceptionRows(
  exceptions: Record<string, LegacyException[]>,
  file: string,
): LegacyException[] {
  const entries = exceptions[file];
  if (!entries) throw new Error(`missing mutable test exception rows for ${file}`);
  return entries;
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
  const files = [...walk(domainRoot)].sort();
  const relativeFiles = files.map((file) => path.relative(domainRoot, file).replace(/\\/g, '/'));
  it(`scans the exact domain source inventory (${EXPECTED_DOMAIN_FILES.length} files)`, () => {
    expect(exactInventoryErrors('domain source', relativeFiles, EXPECTED_DOMAIN_FILES)).toEqual([]);
  });
  it('negative control: a count-preserving domain source substitution is rejected', () => {
    const mutated: string[] = [...EXPECTED_DOMAIN_FILES];
    const removed = mutated[0];
    const replacement = 'synthetic/src/count-preserving-decoy.ts';
    mutated[0] = replacement;
    expect(exactInventoryErrors('domain source', mutated, EXPECTED_DOMAIN_FILES)).toEqual([
      `missing domain source: ${removed}`,
      `unexpected domain source: ${replacement}`,
    ]);
  });
  for (const f of files) {
    const rel = path.relative(domainRoot, f).replace(/\\/g, '/');
    it(rel, () => {
      const hits = scanFile(rel, fs.readFileSync(f, 'utf8'));
      expect(hits, hits.join('; ')).toEqual([]);
    });
  }
  const deterministicControls = [
    {
      name: 'Math.random',
      source: 'export const hostile = Math . random();',
      diagnostic: '/\\bMath\\s*\\.\\s*random\\s*\\(/ (NONDETERMINISM — the cardinal sin (CLAUDE.md rule 1))',
    },
    {
      name: 'Date.now',
      source: 'export const hostile = Date . now();',
      diagnostic: '/\\bDate\\s*\\.\\s*now\\s*\\(/ (device wall clock — forbidden in deterministic domains)',
    },
    {
      name: 'new Date',
      source: 'export const hostile = new Date();',
      diagnostic: '/\\bnew\\s+Date\\s*\\(\\s*\\)/ (wall clock)',
    },
    {
      name: 'performance.now',
      source: 'export const hostile = performance . now();',
      diagnostic: '/\\bperformance\\s*\\.\\s*now\\b/ (runtime monotonic clock — app-owned/injected, not domain-owned)',
    },
  ] as const;
  for (const control of deterministicControls) {
    it(`negative control: executable ${control.name} is rejected with its exact diagnosis`, () => {
      expect(scanFile('synthetic/src/hostile.ts', control.source)).toEqual([control.diagnostic]);
    });
  }
  it('pins the exact approved exception inventory and reasons', () => {
    expect(exceptionInventoryErrors(EXCEPTIONS)).toEqual([]);
  });
  it('negative control: approved-exception reason drift is rejected', () => {
    const drifted = mutableExceptions();
    const file = 'combatcore/src/combatcore.verbatim.js';
    const entries = requiredMutableExceptionRows(drifted, file);
    const original = requiredException(drifted, file);
    entries[0] = { ...original, why: 'temporary compatibility waiver' };
    const errors = exceptionInventoryErrors(drifted).join('\n');
    expect(errors).toMatch(/missing approved exception/);
    expect(errors).toMatch(/unexpected approved exception/);
    expect(errors).toMatch(/temporary compatibility waiver/);
  });
  it('negative control: broadening an approved exact matcher is rejected', () => {
    const broadened = mutableExceptions();
    const file = 'combatcore/src/combatcore.verbatim.js';
    const entries = requiredMutableExceptionRows(broadened, file);
    const original = requiredException(broadened, file);
    entries[0] = { ...original, exact: /\bdocument\s*\./ };
    const errors = exceptionInventoryErrors(broadened).join('\n');
    expect(errors).toMatch(/missing approved exception/);
    expect(errors).toMatch(/unexpected approved exception/);
    expect(errors).toContain(String.raw`\\bdocument\\s*\\.`);
  });
  it('negative control: changed or duplicated approved exception bytes are rejected', () => {
    const rel = 'combatcore/src/combatcore.verbatim.js';
    const raw = fs.readFileSync(path.join(domainRoot, rel), 'utf8');
    const exact = requiredException(EXCEPTIONS, rel).exact;
    expect([...codeOnly(raw).matchAll(new RegExp(exact.source, 'g'))]).toHaveLength(1);
    const changed = raw.replace('cv.width=cv.height=S2;', 'cv.width=S2;cv.height=S2;');
    expect(changed).not.toBe(raw);
    expect(scanFile(rel, changed).join('; ')).toMatch(/legacy exception changed or duplicated .*found 0/);
    const duplicated = `${raw}\nconst S2=240,cv=document.createElement('');cv.width=cv.height=S2;\n`;
    expect(scanFile(rel, duplicated).join('; ')).toMatch(/legacy exception changed or duplicated .*found 2/);
  });
  it('negative control: an extra DOM access in an exempt file is still rejected', () => {
    const rel = 'combatcore/src/combatcore.verbatim.js';
    const raw = fs.readFileSync(path.join(domainRoot, rel), 'utf8')
      + '\nfunction injectedDomRegression(){ document.body; }\n';
    expect(scanFile(rel, raw).join('; ')).toMatch(/DOM access/);
  });
});
