/* conformance.mjs — THE PROPORTION ARC, STAGE 2.

   Renders every Earth species, measures it, and diffs the measurement against
   port/v2/reference/ — the table of what the REAL organism looks like.

   This is the first check on the project that knows what an animal is SUPPOSED
   to be. Everything before it asks a question about one asset in isolation:
   did it paint, is it unique, does it clip, is its aspect plausible. All of
   those can be green while a lizard has a head twice the right size and a face
   you cannot find — which is exactly what happened in wave 22a.

   FINDINGS, most actionable first:
     [A] NO EYE     — the reference says the eye reads, and no eye was found.
                      A creature with no findable face is the loudest defect
                      there is, and nothing measured it until now.
     [P] PROPORTION — measured aspect disagrees with life by more than the band.
     [U] UNROUTED   — the species has named mustRead features and NO override
                      route, so it is drawn by the verbatim engine and those
                      features cannot be expressed at all. Invisible to
                      overridecheck, which only proves keys we DID write reach
                      real species (D-ART-71).

   Usage:
     node tools/conformance.mjs [fauna|flora]        report
     node tools/conformance.mjs fauna --json out.json
     node tools/conformance.mjs --selftest           negative control */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const appDir = path.join(root, 'apps', 'game');
const dist = path.join(appDir, 'dist');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s).replace(/[’‘]/g, "'");

/* ── the bands, and WHY they are these numbers ──────────────────────────────
   A painter is not a photograph and must not be graded like one. These are
   wide enough that an honest stylised drawing passes and narrow enough that
   the failures we have actually shipped — a lizard at 3.7 against a real 1.6,
   a mammal four times as long as deep — do not. They were set by running the
   check against the catalogue and reading the distribution, NOT guessed. */
const ASPECT_LO = 0.55;   /* measured / reference below this = far too tall */
const ASPECT_HI = 1.90;   /* above this = far too elongated */

/* ── the reference ───────────────────────────────────────────────────────── */
function loadRef(kind) {
  const p = path.join(root, 'reference', kind + '.json');
  if (!fs.existsSync(p)) { console.error(`conformance: reference/${kind}.json is missing — run stage 1 first`); process.exit(2); }
  const rows = JSON.parse(fs.readFileSync(p, 'utf8'));
  const m = new Map();
  for (const r of rows) m.set(norm(r.name), r);
  return m;
}

/* ── which species have an override route at all ─────────────────────────────
   Read from the art sources the same way coveragegap does, INCLUDING the
   annotation fix: a regex that stops at the first `=` cannot see a table typed
   with a function, and CANON is typed exactly that way (D-ART-79). */
function routedNames() {
  const SRC = path.join(root, 'packages/art/src');
  const files = fs.readdirSync(SRC).filter((n) => n.endsWith('.ts') && !n.endsWith('.d.ts'));
  if (files.length < 6) { console.error('conformance: only ' + files.length + ' art sources — the PARSER is broken'); process.exit(2); }
  const covered = new Set();
  let sawCanon = false;
  for (const f of files) {
    const t = fs.readFileSync(path.join(SRC, f), 'utf8');
    for (const m of t.matchAll(/(?:export )?const ([A-Z][A-Z0-9_]+)\s*(?::[^;\n]{0,240}?)?=\s*[{[]/g)) {
      if (!/NAME|ICONIC|DUPES|SPEC|CANON|FAM/.test(m[1])) continue;
      if (m[1] === 'CANON') sawCanon = true;
      const open = m.index + m[0].length - 1;
      let d = 0, e = open;
      for (; e < t.length; e++) { const ch = t[e]; if (ch === '{' || ch === '[') d++; else if (ch === '}' || ch === ']') { d--; if (!d) break; } }
      const body = t.slice(open, e + 1);
      let depth = 0, i = 0;
      while (i < body.length) {
        const ch = body[i];
        if (ch === '{' || ch === '[') { depth++; i++; continue; }
        if (ch === '}' || ch === ']') { depth--; i++; continue; }
        if (ch === '/' && body[i + 1] === '*') { const x = body.indexOf('*/', i); i = x < 0 ? body.length : x + 2; continue; }
        if (ch === "'" || ch === '"') {
          let j = i + 1, s = '';
          while (j < body.length && body[j] !== ch) { if (body[j] === '\\') { s += body[j + 1]; j += 2; } else s += body[j++]; }
          if (depth === 1) covered.add(norm(s.replace(/^(fauna|flora|fungi|microbe)\|/, '')));
          i = j + 1; continue;
        }
        i++;
      }
    }
  }
  if (!sawCanon) { console.error('conformance: the CANON map was not discovered — the table-name filter has drifted (D-ART-79)'); process.exit(2); }
  return covered;
}

/* ── GROUND TRUTH FOR THE EYE SENSOR ────────────────────────────────────────
   Species whose rendered portrait a human has looked at and confirmed carries a
   clearly visible eye. The sensor is scored against this before its findings
   are allowed to count for anything.

   ⚠ THIS LIST EXISTS BECAUSE THE SENSOR WAS WRONG FOUR TIMES RUNNING and its
   own self-test never noticed — the self-test exercised the JUDGEMENT with
   synthetic numbers and never the MEASUREMENT. Detector v1 reported 7 eyes on
   an elephant (tusks and toenails) and 0 on the dragonfly. v2 required
   enclosure at a fixed 4px radius, which on a small eye samples back out into
   the bright sclera, and made things WORSE (192 → 300 false negatives). v3 went
   multi-radius. v4 dropped the cluster floor. It still misses animals whose
   eyes are plainly visible.

   So [A] IS NOT A GATE. It is reported as an unvalidated signal, and excluded
   from the finding count, until it scores >= EYE_SENSOR_FLOOR here. Shipping
   300 false "no eye" findings would send the next session chasing ghosts —
   which is the same failure as a check that passes while the thing is broken,
   just pointed the other way. */
const EYE_GROUND_TRUTH = ['Wolf', 'Lion', 'Bear', 'Koala', 'Sand Cat', 'Caracal', 'Possum',
  'Iguana', 'Gecko', 'Kiwi', 'Mudskipper', 'Albatross', 'Kookaburra', 'Spoonbill', 'Owl',
  'Flamingo', 'Fangtooth', 'Deer', 'Tiger', 'Horned Lizard'];
const EYE_SENSOR_FLOOR = 0.90;

export function eyeSensorScore(measured) {
  const m = new Map(measured.map((r) => [norm(r.name), r]));
  const seen = EYE_GROUND_TRUTH.filter((n) => m.has(n));
  const hit = seen.filter((n) => m.get(n).eyes > 0);
  return { hit: hit.length, of: seen.length, ratio: seen.length ? hit.length / seen.length : 0,
    missed: seen.filter((n) => m.get(n).eyes === 0) };
}

/* ── the judgement, kept PURE so the self-test can drive it without a browser ─ */
export function judge(measured, ref, routed, eyeTrusted = true) {
  const out = [];
  for (const m of measured) {
    const r = ref.get(norm(m.name));
    if (!r) { out.push({ kind: 'X', name: m.name, msg: 'measured but has NO reference row' }); continue; }
    /* [A] the face — only when the sensor has earned it */
    if (eyeTrusted && (r.eyes === 'prominent' || r.eyes === 'normal') && m.eyes === 0) {
      out.push({ kind: 'A', name: m.name, sev: r.eyes === 'prominent' ? 3 : 2,
        msg: `reference says the eye is ${r.eyes}, but NO eye was found in the render` });
    }
    /* [P] the proportion.
       ⚠ A SERPENTINE ANIMAL IS NOT MEASURABLE THIS WAY. The reference states
       aspect for the animal laid out straight — an earthworm at 20, an anaconda
       at 6 — but no painter draws a 20:1 subject inside a square frame, and
       ours correctly coil them. Comparing a coiled render to a straight
       reference produced 40-odd findings that were all the instrument's fault.
       Bbox aspect simply carries no information about a coiled body, so the
       check declines to answer rather than answering wrongly. */
    const serpentine = r.posture === 'coiled' || (typeof r.aspect === 'number' && r.aspect >= 4);
    if (serpentine) { /* not measurable from a bounding box — no finding either way */ }
    else if (typeof r.aspect === 'number' && r.aspect > 0 && m.aspect > 0) {
      const k = m.aspect / r.aspect;
      if (k > ASPECT_HI) out.push({ kind: 'P', name: m.name, sev: Math.min(3, 1 + Math.floor(k - ASPECT_HI)),
        msg: `aspect ${m.aspect.toFixed(2)} vs life ${r.aspect} — ${k.toFixed(2)}x too elongated` });
      else if (k < ASPECT_LO) out.push({ kind: 'P', name: m.name, sev: 2,
        msg: `aspect ${m.aspect.toFixed(2)} vs life ${r.aspect} — ${(1 / k).toFixed(2)}x too tall/narrow` });
    }
    /* [U] features the engine cannot express */
    if (routed && !routed.has(norm(m.name)) && Array.isArray(r.mustRead) && r.mustRead.length) {
      out.push({ kind: 'U', name: m.name, sev: 2,
        msg: `NO override route — drawn by the verbatim engine, so these cannot be expressed: ${r.mustRead.join('; ')}` });
    }
  }
  return out;
}

/* ── SELF-TEST: prove the judgement fails when it should ─────────────────────
   Seven checks on this project have passed while the thing they guarded was
   broken. A new one does not get trusted without a control in BOTH directions. */
if (process.argv.includes('--selftest')) {
  const ref = new Map([
    ['Good', { name: 'Good', aspect: 2.0, eyes: 'normal', mustRead: ['a thing'] }],
    ['Blind', { name: 'Blind', aspect: 2.0, eyes: 'prominent', mustRead: ['a thing'] }],
    ['Long', { name: 'Long', aspect: 1.5, eyes: 'normal', mustRead: ['a thing'] }],
    ['Tall', { name: 'Tall', aspect: 2.0, eyes: 'normal', mustRead: ['a thing'] }],
    ['Stray', { name: 'Stray', aspect: 2.0, eyes: 'hidden', mustRead: ['a thing'] }],
  ]);
  const routed = new Set(['Good', 'Blind', 'Long', 'Tall']);
  const measured = [
    { name: 'Good', aspect: 2.1, eyes: 2 },
    { name: 'Blind', aspect: 2.0, eyes: 0 },
    { name: 'Long', aspect: 4.5, eyes: 2 },
    { name: 'Tall', aspect: 0.9, eyes: 2 },
    { name: 'Stray', aspect: 2.0, eyes: 0 },
    { name: 'Ghost', aspect: 1.0, eyes: 1 },
  ];
  const f = judge(measured, ref, routed);
  const has = (k, n) => f.some((x) => x.kind === k && x.name === n);
  const checks = [
    ['a species inside every band produces NO finding', !f.some((x) => x.name === 'Good')],
    ['a prominent-eyed species with no eye is caught', has('A', 'Blind')],
    ['an over-elongated body is caught', has('P', 'Long')],
    ['an over-tall body is caught', has('P', 'Tall')],
    ['an UNROUTED species with mustRead features is caught', has('U', 'Stray')],
    ['a hidden-eyed species is NOT flagged for having no eye', !has('A', 'Stray')],
    ['a measured species with no reference row is reported, not skipped', has('X', 'Ghost')],
  ];
  let bad = 0;
  for (const [what, ok] of checks) { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${what}`); if (!ok) bad++; }
  console.log(bad ? `CONFORMANCE SELFTEST: ${bad} control(s) failed` : 'CONFORMANCE SELFTEST: 7/7 controls hold');
  process.exit(bad ? 1 : 0);
}

/* ── the browser run ─────────────────────────────────────────────────────── */
const kind = process.argv[2] || 'fauna';
const jsonIx = process.argv.indexOf('--json');
const jsonOut = jsonIx > 0 ? process.argv[jsonIx + 1] : null;

execSync('npx vite build', { cwd: appDir, stdio: 'ignore' });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try { const b = fs.readFileSync(p); res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/audit.html?prop=' + encodeURIComponent(kind);

const udd = path.join(os.tmpdir(), 'cf-conf-' + process.pid);
const port = 9533 + (process.pid % 100);
const edge = spawn(EDGE, ['--headless=new', '--no-sandbox', '--no-first-run',
  '--disable-component-extensions-with-background-pages', '--disable-component-update', '--disable-background-networking',
  '--remote-debugging-port=' + port, '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
let ws0 = null;
for (let t = 0; t < 50 && !ws0; t++) { await sleep(400); try { ws0 = (await (await fetch('http://127.0.0.1:' + port + '/json/version')).json()).webSocketDebuggerUrl; } catch { /* boot */ } }
if (!ws0) { console.error('no CDP'); edge.kill(); server.close(); process.exit(2); }
const ws = new WebSocket(ws0);
let mid = 0; const pend = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
await new Promise((r) => { ws.onopen = r; });
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++mid; pend.set(id, { res, rej }); ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params })); });
const t0 = await send('Target.createTarget', { url: 'about:blank' });
const at = await send('Target.attachToTarget', { targetId: t0.targetId, flatten: true });
const sess = at.sessionId;
await send('Runtime.enable', {}, sess);
await send('Page.navigate', { url: URL0 }, sess);
const evalIn = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
  if (r.exceptionDetails) throw new Error('eval threw: ' + String(r.exceptionDetails.exception?.description || '').slice(0, 200));
  return r.result.value;
};
let data = null;
for (let s = 0; s < 1200 && !data; s++) { await sleep(300); data = await evalIn('(window.__CF_PROP__&&window.__CF_PROP__.done)?window.__CF_PROP__:null'); }
ws.close(); edge.kill(); server.close();
if (!data) { console.error('conformance: nothing was measured'); process.exit(1); }

const ref = loadRef(kind);
const routed = routedNames();
const sensor = eyeSensorScore(data.rows);
const eyeTrusted = sensor.of > 0 && sensor.ratio >= EYE_SENSOR_FLOOR;
const findings = judge(data.rows, ref, routed, eyeTrusted);
findings.sort((a, b) => (b.sev || 0) - (a.sev || 0) || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ measured: data.rows, findings }, null, 1));

const by = (k) => findings.filter((f) => f.kind === k);
console.log(`\nCONFORMANCE — ${kind}: ${data.rows.length} rendered, ${ref.size} reference rows, ${findings.length} findings\n`);
if (sensor.of) {
  const pct = (sensor.ratio * 100).toFixed(0);
  if (eyeTrusted) console.log(`  eye sensor: ${sensor.hit}/${sensor.of} ground-truth species detected (${pct}%) — [A] findings COUNT\n`);
  else {
    console.log(`  ⚠ EYE SENSOR NOT TRUSTED: ${sensor.hit}/${sensor.of} ground-truth species detected (${pct}%, floor ${EYE_SENSOR_FLOOR * 100}%).`);
    console.log(`    [A] is SUPPRESSED — it would emit hundreds of false findings. It misses: ${sensor.missed.join(', ')}`);
    console.log(`    ${data.rows.filter((r) => r.eyes === 0).length} of ${data.rows.length} rendered species measured zero eyes; treat that as UNMEASURED, not as fact.\n`);
  }
}
for (const [k, label] of [['A', 'NO READABLE EYE'], ['P', 'PROPORTION vs LIFE'], ['U', 'UNROUTED — features cannot be expressed'], ['X', 'MEASURED WITH NO REFERENCE ROW']]) {
  const g = by(k);
  if (!g.length) continue;
  console.log(`  [${k}] ${label} — ${g.length}`);
  for (const f of g.slice(0, 30)) console.log(`      ${f.name}: ${f.msg}`);
  if (g.length > 30) console.log(`      … and ${g.length - 30} more (use --json for the full list)`);
  console.log('');
}
if (!findings.length) console.log('  clean: every rendered species conforms to its reference row');
