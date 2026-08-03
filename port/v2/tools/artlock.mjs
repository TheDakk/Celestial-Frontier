/* artlock.mjs — ★ THE SAFETY NET (arc stage 3 wave 4).

   Nick, 2026-08-02: "we want to prevent global passes from affecting this.
   Let's put a safety net in there so that, as we're iterating, it's not
   messing up what we did before: all this cleanup work and re-fixing
   everything."

   WHAT WENT WRONG THAT THIS CATCHES. Three times in this arc a change that
   was meant to touch a handful of animals silently rewrote the whole
   catalogue — a shared band clamped 127 quadruped torsos to the same value,
   and a "small" arithmetic sweep undid a good elephant nobody had asked to
   change. Every gate the project owned stayed green through all of it,
   because every one of them asks a question about a SINGLE asset in
   isolation: did it paint, is it a byte-duplicate, does it fit the frame.
   None of them had any idea what the species was supposed to look like five
   minutes ago, so none of them could see a catalogue-wide drift at all.

   TWO GUARDS, and they fail in opposite directions:

     [DRIFT]  How many species changed since the blessed baseline, and by how
              much. The lock does NOT forbid change — art work is change. It
              makes change COUNTABLE and forces it to be named. Edit three
              animals, see three animals move; see four hundred move and you
              have just run a global pass without meaning to.

     [SAME]   How far apart the species look FROM EACH OTHER. A global clamp
              does not only move everything, it moves everything TOGETHER —
              the failure mode Nick actually saw ("every animal on four legs
              has kind of the same body type… the elephant has adopted the
              wolf body"). This reports the closest-looking pairs in the
              catalogue and fails when any two get closer than the floor.

   Neither guard can be satisfied by a fix that is only correct on paper: the
   input is the rendered pixels of all 1,254 assets (D-ART-88).

   Usage:
     node tools/artlock.mjs                 both guards against the lock
     node tools/artlock.mjs --bless         re-bless the CURRENT render as the
                                            baseline (say why in the commit)
     node tools/artlock.mjs --touching=quadruped   declare the class you edited
     node tools/artlock.mjs --bless=Wolf,Lion      re-bless only these species
     node tools/artlock.mjs --bless --class=quadruped   re-bless one class only
     node tools/artlock.mjs --max=40        allow at most N drifted species
     node tools/artlock.mjs --expect        assert every species whose spec row
                                            you edited ACTUALLY changed
     node tools/artlock.mjs --selftest      negative-control, both directions
*/
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { classMap, classOf } from './artclass.mjs';
import { execSync as _exec } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const appDir = path.join(root, 'apps', 'game');
const distDir = path.join(appDir, 'dist');
const LOCK = path.join(root, 'reference', 'artlock.json');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const argv = process.argv.slice(2);
const has = (k) => argv.some((a) => a === '--' + k || a.startsWith('--' + k + '='));
const val = (k, d) => { const a = argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const MAXDRIFT = Number(val('max', '9999'));
/* how different two 16x16 luminance grids must be before we call it a change.
   Calibrated so re-running an unchanged build reports zero and a one-line
   tweak to one painter reports only the species that painter draws. */
const DRIFT_EPS = Number(val('eps', '0.9'));
/* and how close two DIFFERENT species may look before they are siblings */
const SAME_FLOOR = Number(val('floor', '3.0'));

/** mean absolute channel difference between two 16x16 RGB fingerprints, 0..255.
    Base64 in, so the lock file is a megabyte instead of six. */
const bufOf = (s) => (typeof s === 'string' ? Buffer.from(s, 'base64') : null);
/* ⚠ A MASKED VARIANT OF THIS WAS TRIED AND REVERTED. The hypothesis was sound —
   a portrait is mostly dark field, so two SMALL organisms agree on most pixels
   merely by both being small — but measured against Nick's 115 hand-identified
   template-sharing pairs, masking to the union of the two subjects dropped the
   catch rate from 95/115 to 23/115 at a worse false-positive rate. The
   background is not noise: it encodes SIZE and POSITION, and those are most of
   what separates two species. Do not re-derive the idea without re-running the
   calibration; the plausible fix was the wrong one. */
function dist(a, b) {
  const A = bufOf(a), B = bufOf(b);
  if (!A || !B || A.length !== B.length || A.length === 0) return Infinity;
  let s = 0;
  for (let i = 0; i < A.length; i++) s += Math.abs(A[i] - B[i]);
  return s / A.length;
}


/* ★ D-ART-120 — SHAPE DISTANCE, in percent of the coverage mask that flipped.
   The RGB grid above is area-weighted and therefore blind to thin structures;
   this counts differing BITS in a 64×64 silhouette, where a moved leg flips a
   hundred of them. Reported on the same 0-255-ish scale as `dist` so the two
   can share one epsilon: 1 unit ≈ 0.4% of the mask changed. */
function silDist(a, b) {
  const A = bufOf(a), B = bufOf(b);
  if (!A || !B || A.length !== B.length || A.length === 0) return Infinity;
  let diff = 0;
  for (let i = 0; i < A.length; i++) {
    let x = A[i] ^ B[i];
    while (x) { diff += x & 1; x >>= 1; }
  }
  return (diff / (A.length * 8)) * 255;
}

/* ───────────────────────── the negative control ───────────────────────── */
if (has('selftest')) {
  let pass = 0, fail = 0;
  const ck = (name, got, want) => { if (got === want) { pass++; } else { fail++; console.error('  ✗ ' + name + ': got ' + got + ' want ' + want); } };
  const N = 16 * 16 * 3;
  const grid = (f) => Buffer.from(Array.from({ length: N }, (_, i) => f(i) & 255)).toString('base64');
  const flat = grid(() => 40);
  ck('identical renders are not drift', dist(flat, flat) > DRIFT_EPS, false);
  ck('a one-step shift on every channel IS drift', dist(flat, grid(() => 41)) > DRIFT_EPS, true);
  ck('a big change on 4 channels of 768 is not drift', dist(flat, grid((i) => (i < 4 ? 200 : 40))) > DRIFT_EPS, false);
  ck('a change over a third of the body IS drift', dist(flat, grid((i) => (i < N / 3 ? 90 : 40))) > DRIFT_EPS, true);
  ck('two identical species are too close', dist(flat, flat) < SAME_FLOOR, true);
  ck('two differently-coloured species are not', dist(flat, grid((i) => (i % 3 ? 40 : 190))) < SAME_FLOOR, false);
  ck('a missing fingerprint is infinite drift', dist(flat, null) > DRIFT_EPS, true);
  ck('a truncated fingerprint is infinite drift', dist(flat, Buffer.from([1, 2, 3]).toString('base64')) > DRIFT_EPS, true);
  ck('an empty fingerprint is infinite drift', dist(flat, '') > DRIFT_EPS, true);
  /* ★ D-ART-120 — the SHAPE channel, controlled in both directions. These are
     the controls the colour grid could never pass: a thin structure. */
  const SB = 64 * 64 / 8;
  const mask = (f2) => Buffer.from(Array.from({ length: SB }, (_, i) => f2(i) & 255)).toString('base64');
  const blank = mask(() => 0);
  ck('an identical silhouette is not drift', silDist(blank, blank) > DRIFT_EPS, false);
  ck('a ONE-PIXEL-WIDE limb moving IS drift (the whole point)',
    silDist(blank, mask((i) => (i % 8 === 0 ? 0b00010000 : 0))) > DRIFT_EPS, true);
  ck('a single flipped pixel is NOT drift (noise floor holds)',
    silDist(blank, mask((i) => (i === 0 ? 1 : 0))) > DRIFT_EPS, false);
  ck('a missing silhouette is infinite drift', silDist(blank, null) > DRIFT_EPS, true);
  ck('a truncated silhouette is infinite drift', silDist(blank, mask(() => 0).slice(0, 8)) > DRIFT_EPS, true);
  console.log('artlock --selftest: ' + pass + '/' + (pass + fail) + ' judgement controls');
  console.log(fail ? '  ⚠ the control itself is broken — fix it before trusting a report'
    : '  the DECISION layer holds. ⚠ D-ART-81: this says NOTHING about the fingerprint\n'
      + '    sensor upstream of it. That one is controlled by --bless/re-run being 0.');
  process.exit(fail ? 1 : 0);
}

/* ───────────────────────── render the catalogue ───────────────────────── */
execSync('npx vite build', { cwd: appDir, stdio: 'ignore' });
{
  const newest = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((acc, e) => {
    const p = path.join(dir, e.name);
    return Math.max(acc, e.isDirectory() ? newest(p) : fs.statSync(p).mtimeMs);
  }, 0);
  const srcMs = Math.max(newest(path.join(root, 'packages', 'art', 'src')), newest(path.join(appDir, 'src')));
  if (fs.statSync(path.join(distDir, 'audit.html')).mtimeMs < srcMs) {
    console.error('artlock: THE BUNDLE IS STALE. Refusing to lock code nobody is running.');
    process.exit(2);
  }
}
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try { const b = fs.readFileSync(p); res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/audit.html';

const udd = path.join(os.tmpdir(), 'cf-artlock-' + process.pid);
const port = 9733 + (process.pid % 100);
const edge = spawn(EDGE, ['--headless=new', '--no-sandbox', '--no-first-run',
  '--disable-component-extensions-with-background-pages', '--disable-component-update', '--disable-background-networking',
  '--remote-debugging-port=' + port, '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
let ws0 = null;
for (let t = 0; t < 60 && !ws0; t++) { await sleep(400); try { ws0 = (await (await fetch('http://127.0.0.1:' + port + '/json/version')).json()).webSocketDebuggerUrl; } catch { /* boot */ } }
if (!ws0) { console.error('artlock: no CDP'); edge.kill(); process.exit(2); }
const ws = new WebSocket(ws0);
let mid = 0; const pend = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const q = pend.get(m.id); pend.delete(m.id); m.error ? q.rej(new Error(m.error.message)) : q.res(m.result); } };
await new Promise((r) => { ws.onopen = r; });
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++mid; pend.set(id, { res, rej }); ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params })); });
const t0 = await send('Target.createTarget', { url: 'about:blank' });
const at = await send('Target.attachToTarget', { targetId: t0.targetId, flatten: true });
const sess = at.sessionId;
await send('Runtime.enable', {}, sess);
await send('Page.navigate', { url: URL0 }, sess);
const evalIn = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
  if (r.exceptionDetails) throw new Error('eval threw: ' + String(r.exceptionDetails.exception?.description || '').slice(0, 300));
  return r.result.value;
};
process.stdout.write('artlock: rendering the catalogue');
let ready = false;
for (let s = 0; s < 900 && !ready; s++) {
  await sleep(400);
  ready = await evalIn('!!(window.__CF_AUDIT__&&window.__CF_AUDIT__.done)');
  if (s % 15 === 0) process.stdout.write('.');
}
process.stdout.write('\n');
if (!ready) { console.error('artlock: the audit never finished'); ws.close(); edge.kill(); server.close(); process.exit(2); }
/* pull the fingerprints in chunks — one 1,254-entry object exceeds the CDP
   return-by-value budget and comes back silently truncated */
const keys = await evalIn('Object.keys(window.__CF_FINGERPRINTS__)');
const now = {};
for (let i = 0; i < keys.length; i += 120) {
  const part = await evalIn(`(()=>{const F=window.__CF_FINGERPRINTS__,K=Object.keys(F).slice(${i},${i + 120}),o={};for(const k of K)o[k]=F[k];return o;})()`);
  Object.assign(now, part);
}
/* ★ D-ART-120 — the SILHOUETTE channel, pulled the same chunked way. */
const nowSil = {};
for (let i = 0; i < keys.length; i += 120) {
  const part = await evalIn(`(()=>{const F=window.__CF_SILHOUETTES__||{},K=Object.keys(F).slice(${i},${i + 120}),o={};for(const k of K)o[k]=F[k];return o;})()`);
  Object.assign(nowSil, part);
}
ws.close(); edge.kill(); server.close();
if (Object.keys(now).length !== keys.length) {
  console.error('artlock: fingerprint transfer lost rows (' + Object.keys(now).length + '/' + keys.length + ')');
  process.exit(2);
}
console.log('artlock: fingerprinted ' + keys.length + ' assets (' + Object.keys(nowSil).length + ' silhouettes)');

/* ───────────────────────────── the guards ───────────────────────────── */

/* ───────────────────────────── the guards ───────────────────────────── */
const CLS = classMap();
const clsOf = (k) => classOf(CLS, k);
const lockExists = fs.existsSync(LOCK);
const lock = lockExists ? JSON.parse(fs.readFileSync(LOCK, 'utf8')) : { blessed: null, fp: {}, sameCount: null, hardCount: null };

if (has('bless')) {
  const only = val('bless', '');
  const clsOnly = val('class', '');
  /* ★ A PARTIAL BLESSING IS THE WHOLE POINT. Nick: "if I asked you to do a
     global pass and do retroactive, it's not going to break everything else."
     After an INTENDED pass over one class you re-bless that class and every
     other class stays pinned to the fingerprint it was signed off at — so an
     approved quadruped rework cannot quietly carry the birds along with it. */
  const names = only ? new Set(only.split(',').map((s) => s.trim())) : null;
  let n = 0;
  const next = (names || clsOnly) ? { ...lock.fp } : {};
  const nextSil = (names || clsOnly) ? { ...(lock.sil || {}) } : {};
  /* ⚠ a partial bless used to LEAVE STALE KEYS BEHIND, and the next run
     reported 1,134 assets as having "VANISHED" — a whole-catalogue alarm
     produced entirely by the lock's own bookkeeping. A full bless replaces
     the map; a named bless edits it. */
  for (const k of keys) {
    const bare = k.slice(k.indexOf('|') + 1);
    if (names && !names.has(bare)) continue;
    if (clsOnly && classOf(CLS, k) !== clsOnly) continue;
    next[k] = now[k]; nextSil[k] = nowSil[k]; n++;
  }
  lock.fp = next;
  lock.sil = nextSil;
  lock.blessed = new Date().toISOString().slice(0, 10);
  lock.note = 'Re-blessed by tools/artlock.mjs. A blessing is a CLAIM THAT SOMEONE LOOKED. '
    + 'Never bless to make a red report go green — that is the whole failure this file exists to stop.';
}

let bad = 0;

/* [DRIFT] — SCOPED BY CLASS ------------------------------------------- */
/*  Nick, 2026-08-02: "It only needs to apply to the organisms that we're
    dealing with in that class… we just want to make it so that the global
    passes don't retroactively affect all the earth work we put in."

    That is the right shape, and it is sharper than counting. Editing the
    quadruped painter SHOULD move quadrupeds — that is the work. The alarm is
    when it also moves the BIRDS. So declare what you are touching:

        node tools/artlock.mjs --touching=quadruped

    Drift inside the declared classes is reported and allowed. Drift outside
    them is the failure, because that is precisely the fingerprint of a global
    pass. Nothing declared? Then nothing may move, which is the correct
    default for a run that is only supposed to verify.

    PROCEDURAL IS ADVISORY. Nick: "we obviously want to iterate on the
    procedural stuff and fix the art, but we want the earth catalog to be
    unique." The generated library is meant to keep changing while we work on
    the generator, so its drift is counted and printed and never fails — while
    'verbatim-*' is the opposite: those species are drawn by the byte-verbatim
    engine nobody is allowed to edit, so ANY movement there is a real bug. */
const touching = new Set((val('touching', '') || '').split(',').map((s) => s.trim()).filter(Boolean));
if (!lockExists && !has('bless')) {
  console.log('\n[DRIFT] no lock yet — run `node tools/artlock.mjs --bless` once the art is where you want it.');
} else if (has('bless') && !val('bless', '') && !val('class', '')) {
  console.log('\n[DRIFT] skipped: this run blessed the whole catalogue, so it can only agree with itself.');
} else {
  const byClass = new Map();
  let missing = 0;
  for (const k of keys) {
    const was = lock.fp[k];
    if (!was) { missing++; continue; }          /* a NEW asset is not drift */
    /* ★ D-ART-120 — take the WORSE of colour-mass and SHAPE. The RGB grid is
       area-weighted and cannot see a limb move; the silhouette can. A wave
       that rebuilt four crocodilians' legs and three orthopterans' femurs
       scored 0 on the grid and would have passed silently. */
    const d = Math.max(dist(was, now[k]), silDist((lock.sil || {})[k], nowSil[k]));
    if (d <= DRIFT_EPS) continue;
    const c = clsOf(k);
    if (!byClass.has(c)) byClass.set(c, []);
    byClass.get(c).push([k, d]);
  }
  const gone = Object.keys(lock.fp).filter((k) => !(k in now));
  const total = [...byClass.values()].reduce((a, v) => a + v.length, 0);
  console.log('\n[DRIFT] ' + total + ' of ' + keys.length + ' assets changed since ' + (lock.blessed || 'the lock')
    + (missing ? ' · ' + missing + ' new' : '') + (gone.length ? ' · ' + gone.length + ' VANISHED' : ''));
  console.log('        declared: ' + (touching.size ? [...touching].join(', ') : '(nothing — so nothing may move)'));
  const rows = [...byClass.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [c, list] of rows) {
    const declared = touching.has(c);
    const advisory = c === 'procedural';
    const flag = declared ? 'declared' : advisory ? 'advisory' : '★ UNDECLARED';
    console.log('   ' + String(list.length).padStart(4) + '  ' + c.padEnd(17) + flag);
    if (!declared && !advisory) {
      for (const [k, d] of list.sort((a, b) => b[1] - a[1]).slice(0, 8)) {
        console.log('          ' + d.toFixed(2).padStart(6) + '  ' + k);
      }
      if (list.length > 8) console.log('          … and ' + (list.length - 8) + ' more');
      bad = 1;
    }
  }
  if (gone.length) {
    console.error('   ★ these assets no longer render at all: ' + gone.slice(0, 10).join(' · '));
    bad = 1;
  }
  if (bad) {
    console.error('   ★ FAIL: a class you did not declare moved. Either you meant to touch it —');
    console.error('     add it to --touching and say so in the commit — or you have just run a');
    console.error('     global pass over work that was already signed off (D-ART-83, D-ART-95).');
  }
  const declaredTotal = rows.filter(([c]) => touching.has(c)).reduce((a, [, v]) => a + v.length, 0);
  if (declaredTotal > MAXDRIFT) {
    console.error('   ★ FAIL: ' + declaredTotal + ' assets moved inside the declared classes, --max was ' + MAXDRIFT + '.');
    bad = 1;
  }
}

/* [SAME] — EARTH ONLY, TWO TIERS -------------------------------------- */
/*  The Earth catalogue is the one that has to be unique: each species has a
    real organism behind it and two of them looking alike is always a defect.
    The procedural library is deliberately generated and is judged elsewhere.

    Two thresholds doing two different jobs, because one cannot do both:

      HARD  — pairs this close are the same picture with a different label.
              Always a failure, no grace.
      WATCH — pairs close enough to be worth fixing. There are hundreds today,
              so gating on the absolute count would just be red forever and
              tell us nothing. It is gated as a RATCHET instead: the count may
              go down, never up. That is what stops a global pass quietly
              collapsing distinctions we already paid for.

    Both thresholds were calibrated against ground truth rather than picked:
    Nick's own audit engine independently listed 22 clusters of species that
    share a body template (115 pairs). At WATCH=2.5 this metric catches 95 of
    those 115 while flagging 0.9% of all other pairs — a real separation
    between the two distributions, not a band drawn through the middle. */
const HARD = Number(val('hard', '0.6'));
const WATCH = Number(val('watch', '2.5'));
/* the line below which this metric genuinely discriminates: only 1% of
   unrelated pairs reach even 2.62, and every one of Nick's hand-identified
   template-sharing pairs that this metric agrees with sits well under here */
const CONFUSABLE = Number(val('confusable', '1.5'));
{
  const earth = keys.filter((k) => k.startsWith('earth-'));
  const pairs = [];
  for (let i = 0; i < earth.length; i++) {
    for (let j = i + 1; j < earth.length; j++) {
      const d = dist(now[earth[i]], now[earth[j]]);
      if (d < WATCH) pairs.push([earth[i], earth[j], d]);
    }
  }
  pairs.sort((a, b) => a[2] - b[2]);
  const hard = pairs.filter((p) => p[2] < HARD);
  console.log('\n[SAME] ' + earth.length + ' Earth species · ' + pairs.length + ' pairs under WATCH ' + WATCH
    + ' · ' + hard.length + ' under HARD ' + HARD);
  for (const [a, b, d] of pairs.slice(0, 15)) {
    console.log('   ' + d.toFixed(2).padStart(6) + '  ' + a.slice(a.indexOf('|') + 1) + '  ≈  ' + b.slice(b.indexOf('|') + 1));
  }
  if (pairs.length > 15) console.log('   … and ' + (pairs.length - 15) + ' more pairs to work through');
  /* ★ WAVE 22 — the whole list, to a file. Fifteen lines on screen is right
     for a gate, but the look-alike work needs every pair: the fix for a
     confusable pair is usually ANATOMICAL (two species drawn the same shape,
     with colour asked to carry a distinction it cannot), and that can only be
     worked from the full list. */
  fs.writeFileSync(path.join(root, 'reference/samepairs.json'), JSON.stringify(
    pairs.map(([a, b, d]) => ({
      a: a.slice(a.indexOf('|') + 1), b: b.slice(b.indexOf('|') + 1),
      d: Number(d.toFixed(3)), tier: d < HARD ? 'hard' : d < 1.5 ? 'confusable' : 'watch',
    })), null, 0));
  /* ⚠ HARD IS A RATCHET TOO, and it has to be. There are 33 of these today —
     mostly the songbird cluster, which Nick's own audit found independently —
     so gating on "must be zero" would leave this red from the day it shipped,
     and a gate that is always red is a gate nobody reads. It is gated the same
     way as WATCH: print them every run, never let the number grow. The list is
     a worklist; the ratchet is the guard. */
  const wasHard = lock.hardCount;
  if (hard.length) {
    console.log('   ★ ' + hard.length + ' pairs are effectively the same picture — the worklist:');
    for (const [a, b, d] of hard.slice(0, 10)) {
      console.log('        ' + d.toFixed(2) + '  ' + a.slice(a.indexOf('|') + 1) + '  =  ' + b.slice(b.indexOf('|') + 1));
    }
  }
  if (wasHard != null && hard.length > wasHard) {
    console.error('   ★ FAIL: identical-looking pairs went ' + wasHard + ' → ' + hard.length + '.');
    bad = 1;
  } else if (wasHard != null && hard.length < wasHard) {
    console.log('   ratchet(hard): ' + wasHard + ' → ' + hard.length + '. Tightened.');
  }
  lock.hardCount = Math.min(hard.length, wasHard ?? hard.length);
  const was = lock.sameCount;
  if (was == null) {
    console.log('   (no ratchet recorded yet — this run sets it at ' + pairs.length + ')');
    lock.sameCount = pairs.length;
  } else if (pairs.length > was) {
    /* THE FIRST VERSION FAILED THE BUILD ON THIS COUNT ALONE, AND IT WAS WRONG.
       It fired on wave 6 with 32 "new" look-alikes that turned out to be
       Bullfrog ~ Cat and Mosquito ~ Cat at 2.4 — pairs that wandered across an
       arbitrary line. My own calibration says 1% of entirely UNRELATED pairs
       already sit below 2.62, so the region just under WATCH carries no signal
       and counting crossings of it measures noise, not sameness.
       A COUNT OF THRESHOLD CROSSINGS IS NOT A MEASUREMENT.
       WATCH is still reported — it orders the worklist well — but the gate is
       only on the part where this metric can actually discriminate: a pair
       that THIS CHANGE pushed below the confusable line. HARD, above, is the
       other real gate. A global pass fails both; noise fails neither. */
    const key = (a, b) => a + ' ' + b;
    const before = new Set();
    for (let i = 0; i < earth.length; i++) {
      for (let j = i + 1; j < earth.length; j++) {
        if (dist(lock.fp[earth[i]], lock.fp[earth[j]]) < WATCH) before.add(key(earth[i], earth[j]));
      }
    }
    /* ⚠ THIS REPORTED "0 newly so" WHILE FAILING FOR A RISE OF 2, which is a
       self-contradicting message and therefore useless. The bug: `created` was
       "newly under WATCH", then filtered by CONFUSABLE — so a pair already
       under watch at 1.6 that the change pushed to 1.4 was invisible to it,
       even though that is exactly the event being gated. Ask the question the
       gate is actually asking: newly under CONFUSABLE. */
    const created = pairs.filter((q) => !before.has(key(q[0], q[1])));
    const beforeConf = new Set();
    for (let i = 0; i < earth.length; i++) {
      for (let j = i + 1; j < earth.length; j++) {
        if (dist(lock.fp[earth[i]], lock.fp[earth[j]]) < CONFUSABLE) beforeConf.add(key(earth[i], earth[j]));
      }
    }
    const newlyConf = pairs.filter((q) => q[2] < CONFUSABLE && !beforeConf.has(key(q[0], q[1])));
    /* ⚠ AND THE GATE WAS MIS-SPECIFIED. It failed on any pair the change pushed
       below CONFUSABLE while ignoring every pair the same change pushed APART —
       so a wave that halved the identical-looking pairs (19 -> 9) was blocked by
       21 that had drifted the other way. That is not what Nick asked the net to
       stop; a global pass collapses the catalogue NET, and this one improved it
       net. Gate on the TOTAL under the confusable line, which cannot be gamed:
       everything moving together drives it sharply up. The created list is
       still printed, because it is the worklist. */
    let nowConf = 0;
    for (const q of pairs) if (q[2] < CONFUSABLE) nowConf++;
    let wasConf = 0;
    for (let i = 0; i < earth.length; i++) {
      for (let j = i + 1; j < earth.length; j++) {
        if (dist(lock.fp[earth[i]], lock.fp[earth[j]]) < CONFUSABLE) wasConf++;
      }
    }
    console.log('   confusable (<' + CONFUSABLE + ') ' + wasConf + ' -> ' + nowConf
      + '  ·  ' + newlyConf.length + ' newly confusable');
    for (const [a, b, dd] of (newlyConf.length ? newlyConf : created).slice(0, 8)) {
      console.log('        ' + dd.toFixed(2) + '  ' + a.slice(a.indexOf('|') + 1) + '  ~  ' + b.slice(b.indexOf('|') + 1));
    }
    if (nowConf > wasConf) {
      console.error('   FAIL: genuinely confusable pairs went ' + wasConf + ' -> ' + nowConf + '.');
      console.error('     Everything moving TOGETHER is what a global pass looks like.');
      console.error('     Derive each from its own reference row (D-ART-83).');
      bad = 1;
    }
  } else {
    if (pairs.length < was) console.log('   ratchet: ' + was + ' → ' + pairs.length + ' pairs. Tightened.');
    lock.sameCount = pairs.length;
  }
}

if (has('bless') || !bad) {
  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  fs.writeFileSync(LOCK, JSON.stringify(lock, null, 0));
  if (has('bless')) console.log('\nartlock: BLESSED ' + Object.keys(lock.fp).length + ' assets');
}
/* [EXPECT] — the INVERSE guard -------------------------------------- */
/*  Every other check here asks "did something move that should not have?".
    This asks the opposite, and it is the question two waves needed:
    DID THE THING I EDITED ACTUALLY MOVE? A spec row you changed that renders
    byte-identical is a fix that did not land — wave 13's earShape was ignored
    by every large ear, wave 11's FishSpec.hue was inert for two waves, and in
    both cases the table looked correct so nobody read the painter. */
if (has('expect') && lockExists) {
  let diff = '';
  try {
    diff = _exec('git diff -U0 -- packages/art/src', { cwd: root, encoding: 'utf8' })
      + _exec('git diff -U0 --cached -- packages/art/src', { cwd: root, encoding: 'utf8' });
  } catch { diff = ''; }
  const edited = new Set();
  for (const line of diff.split('\n')) {
    if (!/^[+-]/.test(line) || /^[+-][+-][+-]/.test(line)) continue;
    const m = /^[+-]\s*'([^']+)'\s*:/.exec(line);
    if (m) edited.add(m[1].includes('|') ? m[1].slice(m[1].indexOf('|') + 1) : m[1]);
  }
  if (!edited.size) {
    console.log('\n[EXPECT] no edited spec rows in the diff — nothing to assert.');
  } else {
    const stuck = [], moved = [], absent = [];
    for (const name of edited) {
      const key = Object.keys(now).find((k) => k.slice(k.indexOf('|') + 1) === name);
      if (!key) { absent.push(name); continue; }
      if (!lock.fp[key]) { moved.push(name); continue; }   /* brand new asset */
      /* ⚠ THIS USED DRIFT_EPS AND WAS WRONG. Drift and expectation are opposite
         questions and need opposite sensitivities: DRIFT asks "did the catalogue
         shift?" and must ignore noise, so its threshold is body-scale (D-ART-103).
         EXPECT asks "did this one asset change AT ALL?" — and since every render
         here is deterministic and seeded, an unchanged spec produces a
         BYTE-IDENTICAL fingerprint. Anything else is a change. Borrowing the
         coarse threshold made the guard fail on every legitimate ear-sized edit.
         A threshold is part of a question, not a property of the metric. */
      (lock.fp[key] !== now[key] ? moved : stuck).push(name);
    }
    console.log('\n[EXPECT] ' + edited.size + ' spec rows edited · ' + moved.length
      + ' moved · ' + stuck.length + ' UNCHANGED'
      + (absent.length ? ' · ' + absent.length + ' not in the catalogue' : ''));
    if (absent.length) console.log('   (not rendered: ' + absent.slice(0, 8).join(', ') + ')');
    if (stuck.length) {
      console.error('   FAIL: you edited these rows and the render did not change:');
      for (const n of stuck.slice(0, 14)) console.error('        ' + n);
      if (stuck.length > 14) console.error('        … and ' + (stuck.length - 14) + ' more');
      console.error('     An option the painter ignores on this code path looks exactly like a');
      console.error('     landed fix. Read the painter, not the table (D-ART-100).');
      bad = 1;
    }
  }
}

console.log('\nartlock: ' + (bad ? 'FAIL' : 'ok'));
process.exit(bad);
