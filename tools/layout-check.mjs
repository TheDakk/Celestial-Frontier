// The layout check: builds the page of the layout check, serves it on this machine only, opens it in a Chromium-family
// browser already installed here (headless), and lays out every screen state at six sizes, under touch and mouse, at
// the smallest and largest text size, in English and the pseudo-locale. It fails on clipped text, overlapping
// controls, a control under 44 px under touch, text with no solid surface under it, anything off the screen,
// words of the map wider than the view, and a scroll area with content below its foot that does not show it. Every
// scroll area is checked as it opens and again scrolled to its middle and to its foot.
// Usage: node tools/layout-check.mjs [--selftest] [--plant <fault>]
//   --selftest       only prove the check: each planted fault must be reported as itself and as nothing else
//   --plant <fault>  plant a fault (clipped, overlap, small, see-through, wide-caption, no-scroll-cue, faint-scroll-cue,
//                    covered-row) in every case of the run
// The browser is CF_BROWSER, else the first of the usual Edge, Chrome and Chromium places.
// Exit 0: no problem. Exit 1: problems, each printed with its case. Exit 2: no browser, or the run could not start.
// It uses no network beyond 127.0.0.1, downloads nothing, and is not part of `npm run gate`.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { REPO_ROOT } from './tracked-files.mjs';

const APP = join(REPO_ROOT, 'apps', 'game');
const DIST = join(APP, 'dist-layout');
const VITE = join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const BROWSERS = [
  process.env.CF_BROWSER,
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/microsoft-edge', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];
// The sizes of LAYOUT_SIZES in apps/game/src/layoutcheck/check.ts: two for each size class.
const SIZES = [[360, 640], [390, 844], [844, 390], [768, 1024], [1280, 800], [1920, 1080]];
/** Each planted fault and the kind of problem it must be reported as (FAULT_KINDS in layoutcheck/faults.ts). */
const FAULTS = { clipped: 'clipped-text', overlap: 'overlap', small: 'small-target', 'see-through': 'see-through', 'wide-caption': 'wide-caption', 'no-scroll-cue': 'scroll-cue', 'faint-scroll-cue': 'scroll-cue', 'covered-row': 'overlap' };
const HELD_SAVES = ['newer', 'unavailable'];
const CASE_TIMEOUT_MS = 20_000;
const WORKERS = 6;

const started = process.hrtime.bigint();
const elapsed = () => `${(Number(process.hrtime.bigint() - started) / 1e9).toFixed(1)}s`;
/** The run could not be made: never a pass. */
function cannotRun(message) {
  console.error(`layout check: ${message}`);
  console.error(`layout check: did not run (${elapsed()})`);
  process.exit(2);
}

const args = process.argv.slice(2);
const selftestOnly = args.includes('--selftest');
const plant = args.includes('--plant') ? args[args.indexOf('--plant') + 1] : null;
if (plant !== null && !Object.hasOwn(FAULTS, plant)) cannotRun(`--plant takes one of ${Object.keys(FAULTS).join(', ')}`);

const browserPath = BROWSERS.find((path) => path !== undefined && path !== '' && existsSync(path));
if (browserPath === undefined) cannotRun('no Chromium-family browser found; set CF_BROWSER to the path of Edge, Chrome or Chromium');

const built = spawnSync(process.execPath, [VITE, 'build', '--mode', 'layout'], { cwd: APP, encoding: 'utf8' });
if (built.status !== 0) cannotRun(`the layout page did not build:\n${built.stdout}${built.stderr}`);

// The built page, served to this machine only.
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = createServer((request, response) => {
  const path = normalize(join(DIST, decodeURIComponent((request.url ?? '/').split('?')[0])));
  if (!path.startsWith(DIST) || !existsSync(path) || TYPES[extname(path)] === undefined) { response.statusCode = 404; response.end(); return; }
  response.setHeader('Content-Type', TYPES[extname(path)]);
  response.end(readFileSync(path));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

// The browser, spoken to over a pipe of its own: no port to find or to collide on.
const profile = mkdtempSync(join(tmpdir(), 'cf-layout-'));
const browser = spawn(browserPath, ['--headless=new', '--remote-debugging-pipe', `--user-data-dir=${profile}`, '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
let closing = false;
function close() {
  closing = true;
  browser.kill();
  server.close();
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch { /* the browser may still be letting go of it */ }
}
browser.on('exit', () => { if (!closing) { close(); cannotRun('the browser stopped before the run was over'); } });
browser.on('error', (error) => { close(); cannotRun(`the browser did not start (${error.message})`); });

let nextId = 0;
const waiting = new Map();
const listeners = new Set();
let pending = '';
browser.stdio[4].setEncoding('utf8');
browser.stdio[4].on('data', (chunk) => {
  pending += chunk;
  for (let end = pending.indexOf('\0'); end !== -1; end = pending.indexOf('\0')) {
    const message = JSON.parse(pending.slice(0, end));
    pending = pending.slice(end + 1);
    if (message.id !== undefined) { waiting.get(message.id)?.(message); waiting.delete(message.id); } else for (const listener of listeners) listener(message);
  }
});
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++nextId;
  waiting.set(id, (message) => (message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result)));
  browser.stdio[3].write(`${JSON.stringify({ id, method, params, sessionId })}\0`);
});
const within = (promise, what) => Promise.race([promise, new Promise((_, reject) => { setTimeout(() => reject(new Error(`${what} took over ${CASE_TIMEOUT_MS / 1000} s`)), CASE_TIMEOUT_MS).unref(); })]);

/** A page of its own, that lays out one case at a time and returns what the page found. */
async function openPage() {
  const { browserContextId } = await send('Target.createBrowserContext');
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);
  await page('Page.enable');
  await page('Runtime.enable');
  await page('Emulation.setFocusEmulationEnabled', { enabled: true });
  let loaded = () => {};
  let errors = [];
  listeners.add((message) => {
    if (message.sessionId !== sessionId) return;
    if (message.method === 'Page.loadEventFired') loaded();
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
  });
  return async function run(one) {
    errors = [];
    const [width, height] = one.size;
    await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    const load = new Promise((resolve) => { loaded = resolve; });
    await page('Page.navigate', { url: `${origin}/layout.html?${new URLSearchParams(one.query)}` });
    await within(load, 'loading the page');
    const out = await within(page('Runtime.evaluate', {
      expression: '(async () => JSON.stringify({ fixtures: await window.__cfLayoutReady, problems: await window.__cfLayoutProblems() }))()',
      awaitPromise: true, returnByValue: true,
    }), 'drawing the screen');
    if (out.exceptionDetails) throw new Error(out.exceptionDetails.exception?.description ?? out.exceptionDetails.text);
    const found = JSON.parse(out.result.value);
    return { ...found, problems: [...found.problems, ...errors.map((detail) => ({ kind: 'page-error', ids: [], detail }))] };
  };
}

const nameOf = (one) => `${one.query.fixture} ${one.size.join('x')} ${one.query.input}${one.query.text ? ` text ${one.query.text}` : ''}${one.query.locale === 'en' ? '' : ` ${one.query.locale}`}`
  + `${one.query.save === 'ok' ? '' : ` save ${one.query.save}`}${one.query.fault ? ` fault ${one.query.fault}` : ''}`;
const lineOf = (problem) => `${problem.kind}: ${problem.ids.join(' + ')}${problem.ids.length > 0 ? ' — ' : ''}${problem.detail}`;
const caseOf = (fixture, size, input, more = {}) => ({ size, query: { fixture, input, text: '', locale: 'en', save: 'ok', ...more } });

/** Lays out every case, a few pages at a time; each result is in the order of its case. */
async function layOut(cases, pages) {
  const results = new Array(cases.length);
  let next = 0;
  await Promise.all(pages.map(async (run) => {
    for (let i = next++; i < cases.length; i = next++) results[i] = await run(cases[i]);
  }));
  return results;
}

let exitCode = 0;
try {
  const pages = await Promise.all(Array.from({ length: WORKERS }, openPage));

  // First the check proves itself on one screen: each planted fault adds a report of its own kind that names what was
  // planted, and adds nothing else. What the screen shows without a fault is judged with the rest of the run.
  const phone = [390, 844];
  const proofs = [caseOf('map', phone, 'touch'), ...Object.keys(FAULTS).map((fault) => caseOf('map', phone, 'touch', { fault }))];
  const proved = await layOut(proofs, pages);
  const unplanted = new Set(proved[0].problems.map(lineOf));
  const failures = [];
  proved.slice(1).forEach((result, i) => {
    const fault = proofs[i + 1].query.fault;
    const added = result.problems.filter((problem) => !unplanted.has(lineOf(problem)));
    const named = added.filter((problem) => problem.kind === FAULTS[fault] && problem.ids.some((id) => id.includes(`[data-fault="${fault}"]`) || id.includes('a planted caption')));
    const others = added.filter((problem) => !named.includes(problem));
    if (named.length === 0) failures.push(`the planted fault "${fault}" was not reported as ${FAULTS[fault]} (reported: ${added.map(lineOf).join('; ') || 'nothing'})`);
    else console.log(`selftest: planted "${fault}" is reported — ${lineOf(named[0])}`);
    if (others.length > 0) failures.push(`the planted fault "${fault}" was also reported as: ${others.map(lineOf).join('; ')}`);
  });
  if (failures.length > 0) {
    for (const failure of failures) console.error(`selftest: ${failure}`);
    throw new Error('the check did not prove itself');
  }
  console.log(`selftest: ${Object.keys(FAULTS).length} planted faults are each reported as themselves, and the same screen without them reports none of them (${elapsed()})`);

  if (!selftestOnly) {
    const fixtures = proved[0].fixtures;
    const cases = [];
    for (const size of SIZES) for (const input of ['touch', 'mouse']) {
      for (const fixture of fixtures) for (const text of ['', 'fs-xl']) for (const locale of ['en', 'qps-ploc']) {
        cases.push(caseOf(fixture, size, input, { text, locale, ...(plant === null ? {} : { fault: plant }) }));
      }
      for (const save of HELD_SAVES) cases.push(caseOf('map', size, input, { save, ...(plant === null ? {} : { fault: plant }) }));
    }
    const results = await layOut(cases, pages);
    let problems = 0;
    results.forEach((result, i) => {
      if (result.problems.length === 0) return;
      problems += result.problems.length;
      console.error(`${nameOf(cases[i])}`);
      for (const problem of result.problems) console.error(`  ${lineOf(problem)}`);
    });
    const summary = `${cases.length} cases: ${fixtures.length} screen states and ${HELD_SAVES.length} held-save notices at ${SIZES.length} sizes`;
    if (problems > 0) {
      console.error(`layout check: ${problems} problems in ${results.filter((result) => result.problems.length > 0).length} of ${summary} (${elapsed()})`);
      exitCode = 1;
    } else console.log(`layout check: ok — ${summary}, under touch and mouse (${elapsed()})`);
  }
} catch (error) {
  close();
  cannotRun(error instanceof Error ? error.message : String(error));
}
close();
process.exit(exitCode);
