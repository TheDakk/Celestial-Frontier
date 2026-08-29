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
     node tools/artlock.mjs --browser=<absolute-path>  explicit browser override
     node tools/artlock.mjs --selftest      negative-control, both directions
*/
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { closeArtToolServer, withArtBrowserCdp } from './art-browser-contract.mjs';
import { classMap, classOf } from './artclass.mjs';
import {
  assertBrowserLaunchAllowed, browserCandidates, findChromiumBrowser,
} from './browserpath.mjs';
import { execSync as _exec } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const appDir = path.join(root, 'apps', 'game');
const distDir = path.join(appDir, 'dist');
const LOCK = path.join(root, 'reference', 'artlock.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const argv = process.argv.slice(2);
const has = (k) => argv.some((a) => a === '--' + k || a.startsWith('--' + k + '='));
const val = (k, d) => { const a = argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const browserArguments = argv.filter((argument) => argument.startsWith('--browser='));
if (argv.includes('--browser') || browserArguments.length > 1) {
  console.error('artlock: --browser requires one exact --browser=<absolute-path> value');
  process.exit(2);
}
const browserOverride = val('browser', undefined);
const MAXDRIFT = Number(val('max', '9999'));
/* how different two 16x16 luminance grids must be before we call it a change.
   Calibrated so re-running an unchanged build reports zero and a one-line
   tweak to one painter reports only the species that painter draws. */
const DRIFT_EPS = Number(val('eps', '0.9'));
/* and how close two DIFFERENT species may look before they are siblings */
/* ⚠ WAVE 42, CODE PASS — `--floor` is a SELFTEST-ONLY knob and its name does not
   say so. It is read at lines 123–124 and nowhere in the production [SAME]
   guard, which gates on HARD / WATCH / CONFUSABLE — so passing `--floor` on a
   real run changes nothing while looking like it tightens the gate. Kept
   (the selftest genuinely uses it) and labelled, rather than deleted: an
   inert option is only dangerous while it looks live. */
const SAME_FLOOR = Number(val('floor', '3.0'));   /* --floor: --selftest only */

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
assertBrowserLaunchAllowed();
const browserFile = findChromiumBrowser(browserCandidates(browserOverride));
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

const { keys, now, nowSil } = await withArtBrowserCdp({
  browserFile,
  tool: 'artlock',
  userDataPrefix: 'cf-artlock',
  startupTimeoutMs: 24_000,
  cleanup: () => closeArtToolServer(server),
}, async ({ send }) => {
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  await send('Runtime.enable', {}, sessionId);
  await send('Page.navigate', { url: URL0 }, sessionId);
  const evalIn = async (expr) => {
    const result = await send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true,
    }, sessionId);
    if (result.exceptionDetails) {
      throw new Error('eval threw: '
        + String(result.exceptionDetails.exception?.description || '').slice(0, 300));
    }
    return result.result.value;
  };
  process.stdout.write('artlock: rendering the catalogue');
  let ready = false;
  for (let s = 0; s < 900 && !ready; s++) {
    await sleep(400);
    ready = await evalIn('!!(window.__CF_AUDIT__&&window.__CF_AUDIT__.done)');
    if (s % 15 === 0) process.stdout.write('.');
  }
  process.stdout.write('\n');
  if (!ready) throw new Error('artlock: the audit never finished');
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
  return { keys, now, nowSil };
});
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

/* ⚠ A BLESS REPORT MUST STATE WHAT IT BLESSED, NOT HOW BIG THE MAP IS.
   `--bless="Crow,Raven,…"` over 22 names printed "BLESSED 1250 assets",
   because it counted `lock.fp` after the edit rather than the entries it
   wrote. A tightly-scoped bless and a catastrophic whole-catalogue bless
   printed the SAME line — and this is the one file in the tree where that
   distinction is the entire safety property. Verified against the git copy of
   the lock: 21 fingerprints actually changed. */
let blessedCount = 0, blessedScope = '';

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
  blessedCount = n;
  blessedScope = names ? n + ' named species' : clsOnly ? 'class ' + clsOnly : 'THE WHOLE CATALOGUE';
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
  /* ★ WAVE 60 — --driftdump writes the changed-since-baseline set as {set,name}
     rows for the cheap re-check (rejudgecards). The lock keys are already
     `set|name`, so a drifted key IS the drift row. This makes the re-check
     measure the ACTUAL current drift, not a stale hand-built list. */
  if (has('driftdump')) {
    const rows = [];
    for (const list of byClass.values()) for (const [k] of list) {
      const i = k.indexOf('|'); rows.push({ set: k.slice(0, i), name: k.slice(i + 1) });
    }
    rows.sort((a, b) => (a.set + a.name).localeCompare(b.set + b.name));
    fs.writeFileSync(path.join(root, 'reference/drift-since-baseline.json'), JSON.stringify(rows, null, 1));
    console.log('\n[DRIFT] wrote reference/drift-since-baseline.json — ' + rows.length + ' changed assets');
  }
  console.log('\n[DRIFT] ' + total + ' of ' + keys.length + ' assets changed since ' + (lock.blessed || 'the lock')
    + (missing ? ' · ' + missing + ' new' : '') + (gone.length ? ' · ' + gone.length + ' VANISHED' : ''));
  console.log('        declared: ' + (touching.size ? [...touching].join(', ') : '(nothing — so nothing may move)'));
  const rows = [...byClass.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [c, list] of rows) {
    const declared = touching.has(c);
    const advisory = c === 'procedural';
    const flag = declared ? 'declared' : advisory ? 'advisory' : '★ UNDECLARED';
    console.log('   ' + String(list.length).padStart(4) + '  ' + c.padEnd(17) + flag);
    /* ★ --which: name the drifted assets even in a DECLARED class. Without it
       the only way to find out what actually moved was to guess from the spec
       tables, and a bless is a claim that a person looked at each one — you
       cannot look at a list you were never shown (D-ART-146). */
    if (has('which') && (declared || advisory)) {
      for (const [k, d] of list.sort((a, b) => b[1] - a[1])) {
        console.log('          ' + d.toFixed(2).padStart(6) + '  ' + k);
      }
    }
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

  /* ★★ [SHAPE] — THE COLOUR-BLIND TIER, AND WHY IT EXISTS.
     Everything above measures `dist`, a 16×16 RGB grid. It is area-weighted
     and it is therefore separated by HUE — which means two species built from
     the SAME construction in different colours score far apart and this gate
     prints reassurance. On 2026-08-03 it printed "0 pairs under HARD 0.6"
     while Nick's independent engine measured Flounder ≈ Halibut at silhouette
     similarity 1.0000. Rendering them settled it: THE SAME BRISTLY TAN EGG
     WITH A FACE. Also Diving Beetle ≈ Water Beetle (one body, green vs brown)
     and Duck ≈ Eider Duck. GOLD_PASS_2026-08-03 had already written the reason
     down — "the [SAME] ratchet misses this because colour separates them; the
     gate measures pictures, not construction" — and the zero still read as
     safety, to me included: I quoted it twice as a result.
     `silDist` was already computed for every asset and used ONLY for drift.
     Comparing it pairwise costs nothing and answers the question colour cannot:
     is this the same SHAPE wearing a different palette?
     ⚠ REPORTED, NOT GATED, on purpose. A new ratchet that fails the build on
     its first run teaches everyone to pass --no-verify; D-ART-97 is this
     project's own scar from gating a number before it was calibrated. It
     prints, it ranks, and a later wave turns it into a ratchet once the
     backlog it names is worked down. */
  const SHAPE = Number(val('shape', '2.0'));   /* 100 pairs today; 35 under 1.0, 9 under 0.5 */
  const shapePairs = [];
  for (let i = 0; i < earth.length; i++) {
    for (let j = i + 1; j < earth.length; j++) {
      const s = silDist(nowSil[earth[i]], nowSil[earth[j]]);
      if (s < SHAPE) shapePairs.push([earth[i], earth[j], s]);
    }
  }
  shapePairs.sort((a, b) => a[2] - b[2]);
  console.log('\n[SHAPE] colour-blind silhouette · ' + shapePairs.length + ' pairs under ' + SHAPE
    + '  (reported, not gated — see the comment)');
  for (const [a, b, s] of shapePairs.slice(0, 12)) {
    console.log('   ' + s.toFixed(2).padStart(6) + '  ' + a.slice(a.indexOf('|') + 1) + '  ≈  ' + b.slice(b.indexOf('|') + 1));
  }
  if (shapePairs.length > 12) console.log('   … and ' + (shapePairs.length - 12) + ' more');
  fs.writeFileSync(path.join(path.dirname(LOCK), 'shapepairs.json'), JSON.stringify(
    shapePairs.map(([a, b, s]) => ({ a: a.slice(a.indexOf('|') + 1), b: b.slice(b.indexOf('|') + 1), shape: Number(s.toFixed(3)) })), null, 1));
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
  /* ★ WAVE 42, CODE PASS H1 — THE CONFUSABLE RATCHET WAS UNREACHABLE UNLESS THE
     WATCH COUNT ROSE. Everything below from `before` to the nowConf FAIL used to
     live inside `else if (pairs.length > was)` — so a change that pushed pairs
     from the 1.5–2.5 band DOWN under the confusable line, without adding new
     WATCH pairs, skipped the gate entirely and could even print "Tightened".
     The comment on the gate says the total "cannot be gamed"; it could, by any
     change that made things worse only among pairs already being watched.
     Hoisted to run on EVERY [SAME] pass, whatever the WATCH count did.
     Negative-controlled both ways (the project law): a doctored lock whose
     stored fingerprints hide a confusable pair — with the WATCH count held
     level so the OLD code provably took the unchecked branch — now FAILs, and
     the undoctored lock still passes. */
  if (was != null) {
    const key = (a, b) => a + ' ' + b;
    const beforeConf = new Set();
    for (let i = 0; i < earth.length; i++) {
      for (let j = i + 1; j < earth.length; j++) {
        if (dist(lock.fp[earth[i]], lock.fp[earth[j]]) < CONFUSABLE) beforeConf.add(key(earth[i], earth[j]));
      }
    }
    const newlyConf = pairs.filter((q) => q[2] < CONFUSABLE && !beforeConf.has(key(q[0], q[1])));
    let nowConf = 0;
    for (const q of pairs) if (q[2] < CONFUSABLE) nowConf++;
    /* (the old code recomputed wasConf with a second O(n^2) loop identical to
       the one above — LOW finding, folded into beforeConf.size) */
    const wasConf = beforeConf.size;
    console.log('   confusable (<' + CONFUSABLE + ') ' + wasConf + ' -> ' + nowConf
      + '  ·  ' + newlyConf.length + ' newly confusable');
    for (const [a, b, dd] of newlyConf.slice(0, 8)) {
      console.log('        ' + dd.toFixed(2) + '  ' + a.slice(a.indexOf('|') + 1) + '  ~  ' + b.slice(b.indexOf('|') + 1));
    }
    if (nowConf > wasConf) {
      console.error('   FAIL: genuinely confusable pairs went ' + wasConf + ' -> ' + nowConf + '.');
      console.error('     Everything moving TOGETHER is what a global pass looks like.');
      console.error('     Derive each from its own reference row (D-ART-83).');
      bad = 1;
    }
  }
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
    /* ★ WAVE 42 — the WATCH-count rise is now REPORT-ONLY. The real gate (the
       confusable total, hoisted above) already ran; this branch's remaining job
       is the history in its comments and the worklist ordering. The 2026-08-02
       lessons stand: a count of threshold crossings is not a measurement, and
       the gate must be on the net confusable TOTAL, not on pairs created. */
    console.log('   (watch count rose ' + was + ' -> ' + pairs.length + ' — reported, not gated; see D-ART-97)');
  } else {
    if (pairs.length < was) console.log('   ratchet: ' + was + ' → ' + pairs.length + ' pairs. Tightened.');
    lock.sameCount = pairs.length;
  }
}

/* ★ WAVE 42, CODE PASS — REFUSE TO WRITE AN EMPTY LOCK. On a machine with no
   reference/artlock.json, `bad` stays 0 through a run that has nothing to
   compare against, and this wrote a lock with an empty `fp` — after which
   DRIFT is permanently vacuous (every asset reads as "new") and [EXPECT] is
   disarmed, on a clone where nobody would think to check. The whole safety net
   silently becomes a no-op, green forever. A first lock is a BLESSING and must
   be asked for. */
if (Object.keys(lock.fp).length === 0 && !has('bless')) {
  console.error('\nartlock: refusing to write an EMPTY lock — that would disarm DRIFT permanently.');
  console.error('   This looks like a first run on a fresh clone. Establish the baseline on purpose:');
  console.error('     node tools/artlock.mjs --bless');
  process.exit(2);
}
if (has('bless') || !bad) {
  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  fs.writeFileSync(LOCK, JSON.stringify(lock, null, 0));
  if (has('bless')) console.log('\nartlock: BLESSED ' + blessedCount + ' of ' + Object.keys(lock.fp).length
    + ' assets — scope: ' + blessedScope);
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
