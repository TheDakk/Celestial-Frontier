/* artaudit.mjs — THE RETROSPECTIVE. One instrument encoding every defect
   class this morphology pass has actually shipped, run across every wave at
   once, so "did we miss anything?" has an answer instead of a hope.

   Each check exists because the bug it looks for was REAL:
     A  a painter exported but reachable from no table          (a dead painter)
     B  an rng seeded and then discarded (`void r`)             (variation computed, thrown away)
     C  a painter taking `name` and never using it              (D-ART-20: two labels, one animal)
     D  a name-variation helper whose salts don't separate      (D-ART-35: six axes, one number)
     E  name variation applied ONLY to overall size             (D-ART-34: the fit pass erases it)
     F  a table imported but never consulted                    (D-ART-39 — lives in overridecheck)
     G  a tool that enumerates files by name pattern            (the discovery rule IS the assumption)
     H  a tool that reads a build artefact without rebuilding   (D-ART-36: the stale bundle)

   Exits 1 on any finding. Usage: node tools/artaudit.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const SRC = path.join(root, 'packages/art/src');
const TOOLS = here;
const files = fs.readdirSync(SRC).filter((n) => n.endsWith('.ts') && !n.endsWith('.d.ts')).sort();
const text = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(SRC, f), 'utf8')]));
/* The CONSUMERS matter too. Scanning only packages/art made `speciesThumb`
   — exported for the app, not for a table — look unreachable. The audit's
   own false positive, on its first run, exactly as every other instrument
   in this project has managed. */
const consumers = [];
for (const dir of ['apps/game/src', 'packages/art/src']) {
  const p = path.join(root, dir);
  if (!fs.existsSync(p)) continue;
  for (const n of fs.readdirSync(p)) if (/\.(ts|tsx)$/.test(n)) consumers.push(fs.readFileSync(path.join(p, n), 'utf8'));
}
const all = Object.values(text).concat(consumers).join('\n');
const findings = [];
const note = (code, msg) => findings.push(`  [${code}] ${msg}`);

/* ── A · a painter nothing can reach ───────────────────────────────────── */
for (const [f, t] of Object.entries(text)) {
  if (f === 'hdart.verbatim.js' || /verbatim/.test(f)) continue;
  for (const m of t.matchAll(/export function ([a-z][A-Za-z0-9_]*)\s*\(/g)) {
    const fn = m[1];
    if (/^(nameSeed|nseed|mixSalt|nvar|nvf|plantBody|fishBody|insectBody)/.test(fn)) continue;
    /* referenced anywhere other than its own definition line? */
    const uses = [...all.matchAll(new RegExp('\\b' + fn + '\\b', 'g'))].length;
    if (uses <= 1) note('A', `${f}: painter "${fn}" is exported but referenced nowhere — no table can reach it`);
  }
}

/* ── B · an rng seeded and then discarded ──────────────────────────────── */
for (const [f, t] of Object.entries(text)) {
  const lines = t.split('\n');
  lines.forEach((ln, i) => {
    if (!/^\s*void r;\s*$/.test(ln)) return;
    /* A DELIBERATE discard is allowed, but it must say so in a machine-checked
       form and give a reason — `@rng-unused: why`. The dragonfly earned the
       first one: a texture pass was added to it and immediately degraded the
       venated wings the reviews singled out, so its rng stays unspent on
       purpose. Requiring the tag keeps that decision visible instead of
       letting the next unspent rng hide behind it. */
    const above = lines.slice(Math.max(0, i - 10), i).join('\n');
    if (/@rng-unused:\s*\S/.test(above)) return;
    /* find the enclosing function's rng assignment */
    for (let j = i; j >= 0 && i - j < 400; j--) {
      if (/const r = (nrng|rngF|mulberry32)\(/.test(lines[j])) {
        note('B', `${f}:${i + 1}: an rng is seeded at line ${j + 1} and discarded with \`void r\` — this painter's per-species randomness does nothing`);
        break;
      }
      if (/^export function /.test(lines[j])) break;
    }
  });
}

/* ── C · a painter that takes `name` and never uses it ─────────────────── */
for (const [f, t] of Object.entries(text)) {
  for (const m of t.matchAll(/export function ([a-zA-Z0-9_]+)\s*\(([^)]*name[^)]*)\)[^{]*\{/g)) {
    const fn = m[1];
    const start = m.index + m[0].length;
    let d = 1, e = start;
    for (; e < t.length && d > 0; e++) { if (t[e] === '{') d++; else if (t[e] === '}') d--; }
    const body = t.slice(start, e);
    if (!/\bname\b/.test(body)) note('C', `${f}: painter "${fn}" accepts \`name\` but never reads it — two species sharing a spec will render identically`);
  }
}

/* ── D · variation salts that do not actually separate ─────────────────── */
for (const [f, t] of Object.entries(text)) {
  /* the pre-avalanche shape: (hash ^ salt) then a divide, with no mixing */
  if (/\^\s*salt\)\s*>>>\s*0\)\s*\/\s*4294967296/.test(t) && !/mixSalt|mixF/.test(t)) {
    note('D', `${f}: a variation helper XORs a small salt straight into the hash — the salt moves only the lowest byte, so every "independent" axis returns the same number (D-ART-35)`);
  }
}

/* ── E · name variation used only on overall size ──────────────────────── */
for (const [f, t] of Object.entries(text)) {
  const varCalls = [...t.matchAll(/^\s*(?:const|let)\s+(\w+)\s*=\s*S \* [\d.]+[^;]*\b(nvar|nvf|nv|nvq)\(/gm)].map((m) => m[1]);
  const ratioCalls = [...t.matchAll(/\b(nvar|nvf|nv|nvq)\(/g)].length;
  if (varCalls.length && ratioCalls === varCalls.length && varCalls.length < 3) {
    note('E', `${f}: every name-variation call feeds an absolute S-scaled size (${varCalls.join(', ')}) — the fit pass rescales each portrait to fill the frame, so a size-only difference is invisible (D-ART-34)`);
  }
}

/* ── G · a tool that enumerates files by name pattern ──────────────────── */
for (const f of fs.readdirSync(TOOLS).filter((n) => n.endsWith('.mjs'))) {
  const t = fs.readFileSync(path.join(TOOLS, f), 'utf8');
  const m = t.match(/readdirSync\([^)]*\)[\s\S]{0,120}?\.filter\(\([^)]*\)\s*=>\s*\/([^/]+)\/[a-z]*\.test/);
  /* ⚠ THIS EXEMPTION WAS ITSELF THE BUG. It first read `!/\.ts$|\.mjs$/`,
     which matched ANY pattern merely CONTAINING an extension test — so
     `/overrides\d*\.ts$/` was waved through, and coveragegap kept globbing
     filenames and under-reporting coverage by 302 species while this very
     check reported clean. A bare extension filter is fine; anything that
     also constrains the NAME is an assumption. */
  const bare = m && /^\\?\.(ts|mjs|tsx)\$$/.test(m[1]);
  if (m && !bare) {
    note('G', `tools/${f}: enumerates files with the name pattern /${m[1]}/ — a naming rule is an assumption, and it has silently hidden new work three times (D-ART-39)`);
  }
}

/* ── H · a tool that reads dist without rebuilding it ──────────────────── */
for (const f of fs.readdirSync(TOOLS).filter((n) => n.endsWith('.mjs'))) {
  const t = fs.readFileSync(path.join(TOOLS, f), 'utf8');
  if (!/\bdist\b/.test(t)) continue;
  const buildsAlways = /^\s*execSync\('npx vite build'/m.test(t);
  const buildsMaybe = /if \(!fs\.existsSync[^)]*\)\s*execSync\('npx vite build'/.test(t);
  if (buildsMaybe || (!buildsAlways && /audit\.html|index\.html/.test(t))) {
    note('H', `tools/${f}: reads the built bundle without unconditionally rebuilding it — an instrument that reads yesterday's build reports on code nobody is running (D-ART-36)`);
  }
}

console.log(`ART AUDIT: ${files.length} art sources · ${findings.length} findings`);
if (findings.length) {
  console.error('\n★ FINDINGS — each is a defect class this project has actually shipped:\n');
  for (const x of findings) console.error(x);
  process.exit(1);
}
console.log('  clean: no dead painters · no discarded rngs · no unused name params ·');
console.log('         no degenerate salts · no size-only variation · no pattern-globbed');
console.log('         file discovery · no stale-bundle readers');
