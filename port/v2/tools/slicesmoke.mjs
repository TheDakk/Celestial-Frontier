/* slicesmoke.mjs — the Phase 3 slice in a REAL browser (headless Edge over
   raw CDP, the uilayout.js pattern; zero new dependencies).

   PROVES what vite build cannot: the bundle BOOTS (Pixi WebGL init, the
   verbatim painters bake their canvases, IndexedDB opens), renders the
   painterly universe, and DESCENDS into the Milky Way through the real
   survey-card action —
   with zero console errors or uncaught exceptions. Saves screenshots as
   the visual record (the thing a human judges; a smoke can only prove it
   isn't blank).

   Usage: node tools/slicesmoke.mjs   (always rebuilds before measuring) */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
/* Direct runs own the checkout lock. The structured-report wrapper owns one
   longer lease through child execution, screenshot hashing and report write;
   only that direct child may inherit it, after token/PID validation. */
acquireWorkspaceLock('v2 slice build and browser smoke', { inheritFromParent: true });
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const smokeRoot = path.resolve(here, '..', 'apps', 'game', 'smoke');
const OUT = process.env.CF_V2_SLICE_SMOKE_OUTPUT
  ? path.resolve(process.env.CF_V2_SLICE_SMOKE_OUTPUT) : smokeRoot;
const smokePrefix = smokeRoot.endsWith(path.sep) ? smokeRoot : smokeRoot + path.sep;
if (OUT !== smokeRoot && !OUT.startsWith(smokePrefix)) {
  throw new Error(`slice smoke output must remain inside ${smokeRoot}`);
}
const screenshotRunId = process.env.CF_V2_SLICE_SMOKE_RUN_ID || '';
if (screenshotRunId && !/^[a-z0-9][a-z0-9-]{0,95}$/i.test(screenshotRunId)) {
  throw new Error('slice smoke screenshot run ID must be 1–96 ASCII letters, digits or hyphens');
}
const screenshotPath = (stem) => path.join(
  OUT,
  `slice-${screenshotRunId ? screenshotRunId + '-' : ''}${stem}.png`,
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withCodeName = (code, name) => {
  const payload = JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8'));
  payload.n = name;
  return 'CF1-' + Buffer.from(JSON.stringify(payload)).toString('base64url').replace(/=+$/g, '');
};
const withCodeGalaxyPosition = (code, x, y) => {
  const payload = JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8'));
  payload.g[0] = x;
  payload.g[1] = y;
  return 'CF1-' + Buffer.from(JSON.stringify(payload)).toString('base64url').replace(/=+$/g, '');
};
const withCodeGalaxySize = (code, size) => {
  const payload = JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8'));
  payload.g[2] = size;
  return 'CF1-' + Buffer.from(JSON.stringify(payload)).toString('base64url').replace(/=+$/g, '');
};
const withCodeStarPosition = (code, x, y) => {
  const payload = JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8'));
  payload.s[0] = x;
  payload.s[1] = y;
  return 'CF1-' + Buffer.from(JSON.stringify(payload)).toString('base64url').replace(/=+$/g, '');
};
const withCodePlanetSeed = (code, seed) => {
  const payload = JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8'));
  payload.p = seed;
  return 'CF1-' + Buffer.from(JSON.stringify(payload)).toString('base64url').replace(/=+$/g, '');
};
const asGalaxyCode = (code, galaxy = null) => {
  const payload = JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8'));
  payload.t = 'g';
  if (galaxy) {
    payload.g[0] = galaxy.x;
    payload.g[1] = galaxy.y;
    payload.g[6] = galaxy.seed;
  }
  delete payload.s;
  delete payload.p;
  delete payload.n;
  return 'CF1-' + Buffer.from(JSON.stringify(payload)).toString('base64url').replace(/=+$/g, '');
};
const asStarCode = (code) => {
  const payload = JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8'));
  payload.t = 's';
  delete payload.p;
  return 'CF1-' + Buffer.from(JSON.stringify(payload)).toString('base64url').replace(/=+$/g, '');
};
const HOME_GALAXY = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL_STAR = Object.freeze({ seed: 424242, x: 560, y: 170 });
const MERCURY = Object.freeze({ seed: 131, ordinal: 0 });
const EARTH = Object.freeze({ seed: 133, ordinal: 2 });
/* A source-generated galaxy in universe cell (1,-4). Its 1,297.6-unit home
   distance is beyond the zero-Signature 880-unit Solar Reach; unlike the
   former 1e7 tuple, the live resolver must prove this real destination before
   the smoke can observe the reach-law rejection. */
const OUTER_REACH_GALAXY = Object.freeze({ seed: 618554626, x: 472.95, y: -1299.77 });
const outerReachGalaxyView = () => ({
  type: 'galaxy',
  gal: { seed: OUTER_REACH_GALAXY.seed, x: OUTER_REACH_GALAXY.x, y: OUTER_REACH_GALAXY.y },
});
const codeName = (code) => JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8')).n || null;
const codeGalaxySize = (code) => JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8')).g?.[2] ?? null;
/* Legacy decodeWhere repairs these fractional identity bytes into Earth.
   Planet Search must reject them before its tolerant decode/sanitizer. */
const COERCED_EARTH_PLANET_CODE = 'CF1-eyJ0IjoicCIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTkuOSwxXSwicyI6WzU2MCwxNzAsNDI0MjQyLjldLCJwIjoxMzMuOX0';
/* Must be rejected before a base64/JSON decode and must not become a
   Compendium filter just because legacy decodeWhere rejects it generically. */
const CF1_SEARCH_MAX_LENGTH = 8192;
const OVERSIZED_CF1_CODE = 'CF1-' + 'A'.repeat(CF1_SEARCH_MAX_LENGTH);
if (OVERSIZED_CF1_CODE.length <= CF1_SEARCH_MAX_LENGTH) {
  throw new Error('oversized CF1 smoke fixture did not exceed the shared input bound');
}
const VETERAN_RAW = JSON.stringify(JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'save-fixtures.json'), 'utf8',
)).inputs.veteran_rich);
const VETERAN_ARRAY_RAW = (() => {
  const save = JSON.parse(VETERAN_RAW);
  save.items = [...(Array.isArray(save.items) ? save.items : []), ['array', 1]];
  return JSON.stringify(save);
})();
const VETERAN_ATLAS_RAW = (() => {
  const save = JSON.parse(VETERAN_RAW);
  save.log = [...(Array.isArray(save.log) ? save.log : []),
    {
      id: 'legacy-star', title: 'Legacy chart', sub: 'Imported without complete coordinates', badge: 'Legacy',
      where: { type: 'star', gal: { x: 90, y: -60, seed: 999 }, star: { seed: 777 } },
    },
    {
      id: 'forged-earth', title: 'Forged Earth', sub: 'Imported with a stale parent', badge: 'Legacy',
      where: {
        type: 'planet', gal: { x: 90.01, y: -60, seed: 999 },
        star: { x: 560, y: 170, seed: 424242 }, pseed: 133,
      },
    },
  ];
  return JSON.stringify(save);
})();
const STALE_SAVED_ROUTE_RAW = (() => {
  const save = JSON.parse(VETERAN_ATLAS_RAW);
  save.me = 'Field-local Route Repair';
  save.essence = 4321;
  save.view = {
    ...save.view,
    gal: { ...save.view.gal, x: 90.01, size: 3999 },
  };
  return JSON.stringify(save);
})();
const CURRENT_TRAINING_RESTORE_RAW = (() => {
  const save = JSON.parse(VETERAN_ATLAS_RAW);
  const restoreView = save.view;
  save.tut = 0;
  save.tsnap = { view: restoreView };
  save.view = {
    type: 'star', gal: { ...restoreView.gal }, star: { ...restoreView.star },
  };
  return JSON.stringify(save);
})();
const SAVED_AUTH_EXPLORER_NAME = 'Saved Reach Authorization Repair';
const TRAINING_AUTH_EXPLORER_NAME = 'Training Reach Authorization Repair';
const importedExplorerName = (name) => String(name).replace(/[<>&"']/g, '').trim().slice(0, 24);
const OUTER_AUTH_SAVED_ROUTE_RAW = (() => {
  const save = JSON.parse(VETERAN_ATLAS_RAW);
  save.me = SAVED_AUTH_EXPLORER_NAME;
  save.essence = 4321;
  save.prime = {};
  save.view = outerReachGalaxyView();
  save.log = [...save.log, {
    id: 'outer-galaxy', title: 'Outer Reach', sub: 'A proven destination beyond saved reach', badge: 'Remote',
    where: outerReachGalaxyView(),
  }];
  return JSON.stringify(save);
})();
const OUTER_AUTH_TRAINING_RAW = (() => {
  const save = JSON.parse(VETERAN_ATLAS_RAW);
  const home = save.view;
  save.me = TRAINING_AUTH_EXPLORER_NAME;
  save.essence = 3456;
  save.prime = {};
  save.tut = 0;
  save.tsnap = { view: outerReachGalaxyView() };
  save.view = { type: 'star', gal: { ...home.gal }, star: { ...home.star } };
  return JSON.stringify(save);
})();
const VETERAN_STAGE3_RAW = (() => {
  const save = JSON.parse(VETERAN_RAW);
  save.asc = 3;
  save.items = [...(Array.isArray(save.items) ? save.items : []), ['igdrive', 1]];
  save.prime = {};
  return JSON.stringify(save);
})();
/* Malformed chapter position is not a drive entitlement. This fixture has
   Chapter 2 selected but no saved system that can reach a non-Sol world. */
const MALFORMED_C2_REACH_RAW = (() => {
  const save = JSON.parse(VETERAN_RAW);
  save.asc = 1;
  save.items = [];
  save.ascp = {};
  return JSON.stringify(save);
})();
const SATURATED_CHARTER_PROGRESS = Object.freeze({
  'c1-land': 2, 'c1-mine': 8, 'c1-part': 4, 'c1-comp': 2, 'c1-jump': 1,
  'c2-land': 3, 'c2-scan': 2, 'c2-conq': 1, 'c2-array': 1,
  'c3-breed': 1, 'c3-gear': 2, 'c3-mine': 20, 'c3-ig': 1,
});
const INCOMPLETE_CHARTER_PROGRESS = Object.freeze({
  ...SATURATED_CHARTER_PROGRESS,
  'c1-mine': 7,
});
const charterFixtureRaw = (powered, progress = SATURATED_CHARTER_PROGRESS, label = null) => {
  const save = JSON.parse(VETERAN_RAW);
  save.me = label || (powered ? 'Reach-Backed Charter' : 'Unpowered Charter Control');
  save.asc = 0;
  save.ascp = { ...progress };
  save.items = (Array.isArray(save.items) ? save.items : [])
    .filter(([id]) => !['jumpdrive', 'array', 'igdrive'].includes(id));
  if (powered) save.items.push(['jumpdrive', 1], ['array', 1], ['igdrive', 1]);
  save.land = [131];
  /* Export deliberately unions conquered/mined worlds into `land`. Keep this
     fixture ownership-free so an unchanged re-land has one exact byte-level
     membership contract rather than mistaking that canonical union for a bug. */
  save.conq = [];
  save.minedw = [];
  save.mx = [];
  save.view = {
    type: 'star',
    gal: { ...save.view.gal },
    star: { x: 560, y: 170, seed: 424242 },
  };
  return JSON.stringify(save);
};
const SATURATED_CHARTER_RAW = charterFixtureRaw(true);
const UNPOWERED_SATURATED_CHARTER_RAW = charterFixtureRaw(false);
const POWERED_INCOMPLETE_CHARTER_RAW = charterFixtureRaw(
  true, INCOMPLETE_CHARTER_PROGRESS, 'Powered Incomplete Charter Control',
);
const SPARSE_V4_RAW = JSON.stringify({ v: 4, epoch: 0, codex: [], land: [] });
const PARTIAL_V4_RAW = JSON.stringify({
  v: 4, epoch: 0, view: null, codex: [], land: [], items: [], log: [],
  pstats: {}, me: 'Explorer', hp: 1, essence: 0, asc: 0, ascp: {},
});
const ONE_BAD_FIELD_V4_RAW = (() => {
  const save = { ...JSON.parse(VETERAN_RAW), v: 4, me: 'Current Field Repair', essence: 4321 };
  save.cargo = {};
  return JSON.stringify(save);
})();
const STALE_AUTOSAVE_RAW = (() => {
  const save = { ...JSON.parse(VETERAN_ATLAS_RAW), me: 'Stale Autosave Must Lose', essence: 7 };
  return JSON.stringify(save);
})();
const FUTURE_V99_RAW = JSON.stringify({ v: 99, epoch: 0, codex: [], land: [], at: 1 });
const RELEASE_FIXTURE_VERSION = '2.0.0-test';
const INVALID_IMPORT_ERROR = 'That does not load as a Celestial Frontier save — nothing was stored.';
const READ_PRIMARY_EXPRESSION = `new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice');
  q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readonly'),g=tx.objectStore('meta').get('save');
    g.onsuccess=()=>{db.close();resolve(String(g.result||''))}; g.onerror=()=>reject(g.error); }; })`;

/* A smoke that reads a stale build can pass for source that no longer
   exists—the species-audit failure class. Build unconditionally, then drive
   exactly those bytes. */
execSync('npx vite build', { cwd: appDir, stdio: 'inherit' });
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

/* ---- tiny static server over dist (vite preview without the dep surface) ---- */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  try {
    const body = fs.readFileSync(p);
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + server.address().port + '/';
const server2 = http.createServer(server.listeners('request')[0]);
await new Promise((r) => server2.listen(0, '127.0.0.1', r));
const URL2 = 'http://127.0.0.1:' + server2.address().port + '/';   /* different origin ⇒ fresh IndexedDB ⇒ a NEW expedition */
const server3 = http.createServer(server.listeners('request')[0]);
await new Promise((r) => server3.listen(0, '127.0.0.1', r));
const URL3 = 'http://127.0.0.1:' + server3.address().port + '/';   /* isolated fresh-phone navigation outcome */
const server4 = http.createServer(server.listeners('request')[0]);
await new Promise((r) => server4.listen(0, '127.0.0.1', r));
const URL4 = 'http://127.0.0.1:' + server4.address().port + '/';   /* isolated desktop keyboard journey */
const serveDist = server.listeners('request')[0];
let slowSpeciesOpen = false;
const slowSpeciesRequests = [];
const server5 = http.createServer((req, res) => {
  if (req.url?.split('?')[0] === '/seed.html') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<!doctype html><meta charset="utf-8"><title>seed</title>');
    return;
  }
  if (!slowSpeciesOpen && /\/assets\/speciesart-[^/]+\.js(?:\?|$)/.test(req.url || '')) {
    slowSpeciesRequests.push({ req, res });
    return;
  }
  serveDist(req, res);
});
await new Promise((r) => server5.listen(0, '127.0.0.1', r));
const URL5 = 'http://127.0.0.1:' + server5.address().port + '/';   /* isolated, network-gated lazy-art focus outcome */
const releaseSlowSpecies = () => {
  if (slowSpeciesOpen) return;
  slowSpeciesOpen = true;
  for (const request of slowSpeciesRequests.splice(0)) serveDist(request.req, request.res);
};

const events = [];
let browser;
try {
  browser = await openChromiumCdp({
    label: 'slice smoke',
    userDataPrefix: 'cf-slicesmoke',
    commandTimeoutMs: 30000,
    onEvent: (event) => events.push(event),
  });
} catch (error) {
  server.close(); server2.close(); server3.close(); server4.close(); server5.close();
  throw error;
}
const send = browser.send;
/* CDP's `key`/`code` strings are enough for application keydown listeners,
   which is why the canvas journey stayed green, but Chromium's native HTML
   button activation also consumes the platform virtual-key identity. With
   the VK fields omitted, Enter reached our canvas handler while focused
   Guide/Compendium/Atlas buttons never synthesized click. Mirror a real
   keyboard press here; Space carries printable text and activates on keyup. */
const VIRTUAL_KEY = Object.freeze({
  Enter: 13, Space: 32, Escape: 27, Tab: 9,
  ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40,
});
const dispatchKeyPress = async (session, key, code = key, modifiers = 0) => {
  const windowsVirtualKeyCode = VIRTUAL_KEY[code];
  if (!windowsVirtualKeyCode) throw new Error(`no CDP virtual-key mapping for ${JSON.stringify([key, code])}`);
  const active = await send('Runtime.evaluate', {
    expression: `(()=>{const e=document.activeElement;return {tag:e?.tagName||'',role:e?.getAttribute?.('role')||''}})()`,
    returnByValue: true,
  }, session).catch(() => null);
  const tag = active?.result?.value?.tag || '';
  const nativeControl = /^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(tag);
  const text = !(modifiers & 7) && nativeControl ? (key === ' ' ? ' ' : key === 'Enter' ? '\r' : '') : '';
  /* nativeVirtualKeyCode is platform-specific (13 is W on macOS, Enter on
     Windows) and can leave a synthetic key repeating forever. The portable
     Windows VK plus renderer text is sufficient across Chromium hosts. */
  const common = { key, code, modifiers, windowsVirtualKeyCode };
  await send('Input.dispatchKeyEvent', {
    /* `keyDown` is the renderer-level event that exercises native HTML
       default actions. `rawKeyDown` reaches application listeners but, on
       the pinned macOS Chromium build, does not synthesize a focused
       button's Enter click — precisely the keyboard false-green this helper
       exists to avoid. */
    type: text ? 'keyDown' : 'rawKeyDown', ...common,
    ...(text ? { text, unmodifiedText: text } : {}),
  }, session);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...common }, session);
};

const fails = [];
const navKeyInventoryMatchesMode = (state) => {
  const galaxy = state?.navGalaxyKey;
  const star = state?.navStarKey;
  const world = state?.navWorldKey;
  const present = (key) => typeof key === 'string' && key.length > 0;
  if (state?.mode === 'universe') return galaxy === null && star === null && world === null;
  if (state?.mode === 'galaxy') return present(galaxy) && star === null && world === null;
  if (state?.mode === 'system') return present(galaxy) && present(star) && world === null;
  if (state?.mode === 'surface') return present(galaxy) && present(star) && present(world);
  return false;
};
const renderedSceneMatchesNav = (state) => !!state?.renderedScene
  && Number.isInteger(state.renderedScene.serial)
  && state.renderedScene.serial > 0
  && navKeyInventoryMatchesMode(state)
  && state.renderedScene.mode === state.mode
  && state.renderedScene.galaxyKey === state.navGalaxyKey
  && state.renderedScene.starKey === state.navStarKey
  && state.renderedScene.worldKey === state.navWorldKey;
const requireRenderedSceneMatch = (label, state) => {
  if (!renderedSceneMatchesNav(state)) {
    fails.push(`${label}: rendered-scene receipt disagrees with the canonical navigation keys: `
      + JSON.stringify({
        mode: state?.mode,
        nav: [state?.navGalaxyKey, state?.navStarKey, state?.navWorldKey],
        rendered: state?.renderedScene,
      }));
  }
};
const renderedSceneAdvanced = (before, after) => renderedSceneMatchesNav(after)
  && Number.isInteger(before?.renderedScene?.serial)
  && after.renderedScene.serial > before.renderedScene.serial;
const requireRenderedSceneAdvance = (label, before, after) => {
  if (!renderedSceneAdvanced(before, after)) {
    fails.push(`${label}: accepted navigation did not publish a newer draw-tail receipt: `
      + JSON.stringify({
        before: before?.renderedScene,
        after: after?.renderedScene,
        mode: after?.mode,
        nav: [after?.navGalaxyKey, after?.navStarKey, after?.navWorldKey],
      }));
  }
};
const sliceToken = async (session) => {
  try {
    const r = await send('Runtime.evaluate', {
      expression: `typeof window.__CF_SLICE__?.documentToken==='string' ? window.__CF_SLICE__.documentToken : null`,
      returnByValue: true,
    }, session);
    return r.exceptionDetails || typeof r.result.value !== 'string' ? null : r.result.value;
  } catch { return null; /* an execution context may vanish during navigation */ }
};
const waitForSlice = async (session, label, { timeoutMs = 15000, previousToken = null } = {}) => {
  const deadline = Date.now() + timeoutMs;
  let last = 'diagnostic surface absent';
  while (Date.now() < deadline) {
    let r;
    try {
      r = await send('Runtime.evaluate', { expression: `(()=>{ try {
        const S=window.__CF_SLICE__; if(!S||!S.api) return {ready:false,token:null,why:'surface absent'};
        const state=S.api.state();
        return {ready:!!state&&!!state.save&&Array.isArray(state.save.landed),token:S.documentToken,why:'state incomplete'};
      } catch(error) { return {ready:false,token:null,why:String(error&&error.message||error)}; } })()`,
        returnByValue: true, awaitPromise: true }, session);
    } catch (error) {
      last = String(error?.message || error);
      await sleep(50);
      continue;
    }
    if (r.exceptionDetails) last = String(r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'page exception');
    else {
      const value = r.result.value;
      const token = typeof value?.token === 'string' ? value.token : null;
      if (value?.ready && token && (previousToken === null || token !== previousToken)) return token;
      last = value?.ready && token === previousToken ? 'stale document token' : String(value?.why || 'state incomplete');
    }
    await sleep(50);
  }
  throw new Error(`${label} did not expose a ready slice within ${timeoutMs}ms (${last})`);
};
const navigateToSlice = async (session, url, label) => {
  const previousToken = await sliceToken(session);
  await send('Page.navigate', { url }, session);
  return waitForSlice(session, label, { previousToken });
};
try {
  const t = await send('Target.createTarget', { url: 'about:blank' });
  const at = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
  const sess = at.sessionId;
  await send('Runtime.enable', {}, sess);
  await send('Page.enable', {}, sess);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, sess);
  let readinessControlRejected = false;
  try { await waitForSlice(sess, 'about:blank readiness control', { timeoutMs: 150 }); }
  catch { readinessControlRejected = true; }
  if (!readinessControlRejected) fails.push('SLICE READINESS CONTROL FAILED — an about:blank target reported ready');
  await navigateToSlice(sess, URL0, 'desktop boot');
  const desktopToken = await sliceToken(sess);
  let staleReadyControlRejected = false;
  try { await waitForSlice(sess, 'stale-ready readiness control', { timeoutMs: 150, previousToken: desktopToken }); }
  catch { staleReadyControlRejected = true; }
  if (!staleReadyControlRejected) fails.push('SLICE READINESS CONTROL FAILED — the prior document token was accepted as a new boot');
  await sleep(3000);

  const evalIn = async (expr) => {
    let r;
    try { r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess); }
    catch (error) {
      const near = String(expr).replace(/\s+/g, ' ').slice(0, 120);
      throw new Error(`desktop eval failed near ${JSON.stringify(near)}: ${error.message}`);
    }
    if (r.exceptionDetails) {
      const near = String(expr).replace(/\s+/g, ' ').slice(0, 120);
      throw new Error(`page eval threw near ${JSON.stringify(near)}: ${JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text)}`);
    }
    return r.result.value;
  };
  const keyIn = async (key, code = key, modifiers = 0) => {
    await dispatchKeyPress(sess, key, code, modifiers);
    await sleep(40);
  };
  const clickDesktopPoint = async (point) => {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error('desktop pointer point is not finite: ' + JSON.stringify(point));
    }
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1,
    }, sess);
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1,
    }, sess);
    await sleep(80);
  };
  const armDesktopPointerReceipt = async () => evalIn(`(()=>{ window.__cfPanelPointerAbort?.abort();
    delete window.__cfPanelPointer;const controller=new AbortController();window.__cfPanelPointerAbort=controller;
    document.addEventListener('pointerdown',(event)=>{ const target=event.target instanceof Element?event.target:null;
      window.__cfPanelPointer={targetId:target?.id||null,tag:target?.tagName||null,x:event.clientX,y:event.clientY,
        pointerType:event.pointerType||null};window.__cfPanelPointerAbort=null; },
      {capture:true,once:true,signal:controller.signal});return true; })()`);
  const takeDesktopPointerReceipt = async () => evalIn(`(()=>{ const receipt=window.__cfPanelPointer||null;
    window.__cfPanelPointerAbort?.abort();delete window.__cfPanelPointerAbort;delete window.__cfPanelPointer;
    return receipt; })()`);
  const waitDesktopValue = async (label, expr, timeoutMs = 6000) => {
    const deadline = Date.now() + timeoutMs;
    let last = null;
    while (Date.now() < deadline) {
      last = await evalIn(expr);
      if (last) return last;
      await sleep(50);
    }
    throw new Error(`${label} did not reach its browser outcome within ${timeoutMs}ms (last ${JSON.stringify(last)})`);
  };
  let transitionWaitControlRejected = false;
  try { await waitDesktopValue('transition waiter negative control', 'false', 150); }
  catch { transitionWaitControlRejected = true; }
  if (!transitionWaitControlRejected) fails.push('TRANSITION WAITER CONTROL FAILED — a never-true outcome reported ready');

  /* Smoke owns the player-facing scheduler outcome, while glass owns the
     replacement phase/resource-release contract. A published slice is not
     playable until Pixi has serviced at least one tick and remains running.
     Every call deliberately stops the live app, re-runs the same predicate,
     then restores it so a checker that forgets scheduler liveness cannot
     pass either a fresh boot or a replacement boot. */
  const bootTickerOutcomeCheck = `(()=>{ const S=window.__CF_SLICE__,state=S?.api?.state?.();
    const tickerTicks=Number(state?.tickerTicks??0),tickerStarted=S?.app?.ticker?.started===true;
    return {ok:Number.isFinite(tickerTicks)&&tickerTicks>=1&&tickerStarted,
      tickerTicks,tickerStarted,documentToken:typeof S?.documentToken==='string'?S.documentToken:null}; })()`;
  const assertBootTickerRunning = async (label) => {
    const outcome = await waitDesktopValue(`${label} ticker outcome`,
      `(()=>{ const result=${bootTickerOutcomeCheck}; return result.ok?result:null; })()`);
    const tickControl = await evalIn(`(()=>{ const api=window.__CF_SLICE__.api,priorState=api.state;
      let result; try { api.state=()=>({...priorState(),tickerTicks:0}); result=${bootTickerOutcomeCheck}; }
      finally { api.state=priorState; }
      return result; })()`);
    if (tickControl.ok || tickControl.tickerTicks !== 0 || !tickControl.tickerStarted) {
      fails.push(`${label.toUpperCase()} TICK CONTROL FAILED — a running boot with zero serviced ticks stayed green: `
        + JSON.stringify(tickControl));
    }
    const control = await evalIn(`(()=>{ const app=window.__CF_SLICE__.app,wasStarted=app.ticker.started===true;
      app.stop(); let result; try { result=${bootTickerOutcomeCheck}; }
      finally { if(wasStarted) app.start(); }
      return {...result,wasStarted,restarted:app.ticker.started===true}; })()`);
    if (control.ok || control.tickerStarted || !control.wasStarted || !control.restarted) {
      fails.push(`${label.toUpperCase()} TICKER CONTROL FAILED — a deliberately stopped boot stayed green or was not restored: `
        + JSON.stringify(control));
    }
    return outcome;
  };

  /* 1. booted: canvas mounted, HUD says universe */
  await assertBootTickerRunning('fresh first boot');
  const boot = await evalIn(`({ canvas: !!document.querySelector('canvas'), topbar: !!document.getElementById('topbar'), st: window.__CF_SLICE__ ? window.__CF_SLICE__.api.state() : null,
    hintKw: [...document.querySelectorAll('#hintpill .kw')].map((node) => node.textContent) })`);
  if (!boot.canvas) fails.push('no <canvas> — Pixi never mounted');
  if (!boot.topbar) fails.push('no #topbar — the Phase 4 shell is missing');
  if (!boot.st || boot.st.mode !== 'universe') fails.push('not in universe mode at boot: ' + JSON.stringify(boot.st && boot.st.mode));
  if (boot.st && boot.st.panelOpen !== null) fails.push('the v2.0 development identity opened as a shipped production release popup: ' + JSON.stringify(boot.st.panelOpen));
  if (boot.st && (boot.st.releasePending !== null || boot.st.rnSeen !== '0')) {
    fails.push('the v2.0 development draft queued or marked itself seen on a fresh boot: '
      + JSON.stringify({ releasePending: boot.st.releasePending, rnSeen: boot.st.rnSeen }));
  }
  if (boot.st && boot.st.trail !== 'Cosmos') fails.push('trail at boot is not Cosmos: ' + JSON.stringify(boot.st.trail));
  if (boot.st && !(parseFloat(boot.st.topbarH) > 20)) fails.push('--topbar-h not measured: ' + JSON.stringify(boot.st.topbarH));
  if (boot.st && !boot.st.ctx) fails.push('the caption line is empty at boot');
  if (boot.st && !/Make planetfall on 2 worlds of Sol/.test(boot.st.objective)) fails.push('objective chip wrong at fresh boot: ' + JSON.stringify(boot.st.objective));
  if (!boot.hintKw.includes('tap') || !boot.hintKw.includes('zoom')) {
    fails.push('hint action verbs are not highlighted through real .kw nodes: ' + JSON.stringify(boot.hintKw));
  }
  if (boot.st) {
    requireRenderedSceneMatch('FRESH BOOT', boot.st);
    const zeroReceipt = {
      ...boot.st,
      renderedScene: {
        serial: 0, mode: 'universe', galaxyKey: null, starKey: null, worldKey: null,
      },
    };
    if (renderedSceneMatchesNav(zeroReceipt)) {
      fails.push('RENDERED-SCENE RECEIPT CONTROL FAILED — initial universe-shaped serial 0 stayed green');
    }
    const universeForeignKey = {
      ...boot.st,
      navGalaxyKey: 'injected-universe-galaxy',
      renderedScene: { ...boot.st.renderedScene, galaxyKey: 'injected-universe-galaxy' },
    };
    if (renderedSceneMatchesNav(universeForeignKey)) {
      fails.push('RENDERED-SCENE KEY-INVENTORY CONTROL FAILED — universe accepted an agreeing non-null galaxy key');
    }
  }
  const chromeA11yCheck = `(()=>{ const survey=document.getElementById('docksurvey'),card=document.getElementById('survey'),charts=document.getElementById('dockcharts');
    return {surveyControls:survey?.getAttribute('aria-controls')||null,surveyExpanded:survey?.getAttribute('aria-expanded')||null,
      cardHidden:card?.getAttribute('aria-hidden')||null,chartsPressed:charts?.getAttribute('aria-pressed')||null}; })()`;
  const chromeA11y = await evalIn(chromeA11yCheck);
  if (chromeA11y.surveyControls !== 'survey' || chromeA11y.surveyExpanded !== 'false'
    || chromeA11y.cardHidden !== 'true' || chromeA11y.chartsPressed !== 'false') {
    fails.push('DOCK A11Y: initial survey/chart state is not exposed truthfully: ' + JSON.stringify(chromeA11y));
  }
  const chromeA11yCtl = await evalIn(`(()=>{ const survey=document.getElementById('docksurvey'),prior=survey.getAttribute('aria-controls');
    survey.removeAttribute('aria-controls'); const result=${chromeA11yCheck};
    if(prior===null) survey.removeAttribute('aria-controls'); else survey.setAttribute('aria-controls',prior); return result; })()`);
  if (chromeA11yCtl.surveyControls === 'survey') {
    fails.push('DOCK A11Y CONTROL FAILED — removing survey aria-controls stayed green: ' + JSON.stringify(chromeA11yCtl));
  }

  /* 1a-training. a FRESH boot TRAINS (the game's new-expedition rule); the
     classic legs run as a veteran — Skip first, the game's own path, and
     skipping must persist. The full six-step drill runs later on its own
     fresh origin. */
  const tut0 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (!tut0.tutActive || tut0.tutStep !== 'welcome') fails.push('a fresh boot did not open Field Training at welcome: ' + JSON.stringify([tut0.tutActive, tut0.tutStep]));
  const tutCardDock = await evalIn(`(()=>{ const c=document.getElementById('tutcard'); const d=document.getElementById('dock');
    if(!c||!d) return null; const cr=c.getBoundingClientRect(), dr=d.getBoundingClientRect();
    return { clear: cr.bottom <= dr.top + 2, tutBot: getComputedStyle(document.documentElement).getPropertyValue('--tut-bot') }; })()`);
  if (!tutCardDock || !tutCardDock.clear) fails.push('the lesson card covers the dock (CF1806-02 family): ' + JSON.stringify(tutCardDock));
  if (!tutCardDock || !/px/.test(tutCardDock.tutBot)) fails.push('--tut-bot not published (CF1805-01 contract): ' + JSON.stringify(tutCardDock && tutCardDock.tutBot));
  await evalIn(`(()=>{ document.querySelector('[data-sel=tutskip]').click(); return 1; })()`);
  await sleep(300);
  const tut1 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (tut1.tutActive || !tut1.tutDone) fails.push('Skip training did not close + mark done: ' + JSON.stringify([tut1.tutActive, tut1.tutDone]));

  /* 1b-keyboard. The canvas is a real keyboard-operable exploration region,
     not an aria label on an inert WebGL surface. Focusing it selects a
     rendered body; Enter must open that body's ordinary survey card without
     teleporting, and focus must move to the reachable card action. */
  const keyboardFocusCheck = `(()=>{ const canvas=document.querySelector('canvas'),ring=document.getElementById('cosmosfocus');
    const rb=ring?.getBoundingClientRect(); return {canvas:!!canvas,active:document.activeElement===canvas,
      role:canvas?.getAttribute('role'),describedby:canvas?.getAttribute('aria-describedby'),
      target:window.__CF_SLICE__.api.state().keyboardTarget,
      ring:!!ring&&getComputedStyle(ring).display!=='none'&&!!rb&&rb.width>0&&rb.height>0}; })()`;
  await evalIn(`(()=>{ const canvas=document.querySelector('canvas'); canvas?.focus(); return true; })()`);
  const keyboardFocus = await evalIn(keyboardFocusCheck);
  if (!keyboardFocus.canvas || !keyboardFocus.active || keyboardFocus.role !== 'region'
    || keyboardFocus.describedby !== 'cosmoshelp' || !keyboardFocus.target || !keyboardFocus.ring) {
    fails.push('KEYBOARD WORLD focus did not select and visibly identify a rendered target: ' + JSON.stringify(keyboardFocus));
  }
  const keyboardCtl = await evalIn(`(()=>{ const canvas=document.querySelector('canvas'),prior=canvas?.getAttribute('role');
    canvas?.removeAttribute('role'); const result=${keyboardFocusCheck}; if(prior) canvas?.setAttribute('role',prior); return result; })()`);
  if (keyboardCtl.role === 'region') {
    fails.push('KEYBOARD WORLD CONTROL FAILED — removing the canvas region role stayed green: ' + JSON.stringify(keyboardCtl));
  }
  await dispatchKeyPress(sess, 'Enter', 'Enter');
  const keyboardSurvey = await waitDesktopValue('keyboard world survey', `(()=>{ const S=window.__CF_SLICE__,button=document.querySelector('#survey [data-act=travel]');
    const b=button?.getBoundingClientRect(); const hit=b&&document.elementFromPoint((b.left+b.right)/2,(b.top+b.bottom)/2);
    const state=S.api.state(); return state.cardOpen?{mode:state.mode,label:button?.textContent||'',focus:document.activeElement===button,
      actionReachable:!!button&&!!b&&b.height>=44&&!!hit&&button.contains(hit),
      surveyExpanded:document.getElementById('docksurvey')?.getAttribute('aria-expanded'),
      cardHidden:document.getElementById('survey')?.getAttribute('aria-hidden')}:null; })()`);
  if (keyboardSurvey.mode !== 'universe' || keyboardSurvey.label !== 'Enter galaxy'
    || !keyboardSurvey.focus || !keyboardSurvey.actionReachable
    || keyboardSurvey.surveyExpanded !== 'true' || keyboardSurvey.cardHidden !== 'false') {
    fails.push('KEYBOARD WORLD Enter teleported or failed to expose/focus the normal galaxy action: ' + JSON.stringify(keyboardSurvey));
  }
  await keyIn('Escape', 'Escape');
  await waitDesktopValue('keyboard survey close', `!window.__CF_SLICE__.api.state().cardOpen`);
  const keyboardSurveyClosed = await evalIn(chromeA11yCheck);
  if (keyboardSurveyClosed.surveyExpanded !== 'false' || keyboardSurveyClosed.cardHidden !== 'true') {
    fails.push('DOCK A11Y: Escape did not publish the closed survey state: ' + JSON.stringify(keyboardSurveyClosed));
  }

  /* 1c-reduced-motion. Inspect the rendered Pixi graph, not only the saved
     preference. Reduced must hold every sampled transform still across two
     distinct frames; Full is the discriminating positive control and must
     move at least one of those same scene nodes. */
  const sceneMotionSnapshot = async () => evalIn(`(()=>{ const out=[];
    const walk=(node)=>{ if(node!==window.__CF_SLICE__.world) out.push([
      Number((node.x||0).toFixed(6)),Number((node.y||0).toFixed(6)),
      Number((node.rotation||0).toFixed(6)),Number((node.alpha??1).toFixed(6))]);
      for(const child of node.children||[]) walk(child); };
    walk(window.__CF_SLICE__.world); return JSON.stringify(out); })()`);
  await evalIn(`(()=>{ document.getElementById('docksets').click(); document.querySelector('[data-motion="1"]')?.click();
    document.querySelector('#setpanel [data-pnx]')?.click(); return document.body.classList.contains('motion-reduced'); })()`);
  await sleep(150);
  const reducedA = await sceneMotionSnapshot();
  await sleep(600);
  const reducedB = await sceneMotionSnapshot();
  const reducedState = await evalIn(`({mode:window.__CF_SLICE__.api.state().motionMode,reduced:document.body.classList.contains('motion-reduced')})`);
  if (reducedState.mode !== 1 || !reducedState.reduced || reducedA !== reducedB) {
    fails.push('REDUCED MOTION did not freeze the rendered scene graph: ' + JSON.stringify({ reducedState, changed: reducedA !== reducedB }));
  }
  await evalIn(`(()=>{ document.getElementById('docksets').click(); document.querySelector('[data-motion="0"]')?.click();
    document.querySelector('#setpanel [data-pnx]')?.click(); return true; })()`);
  await sleep(120);
  const fullA = await sceneMotionSnapshot();
  await sleep(600);
  const fullB = await sceneMotionSnapshot();
  if (fullA === fullB) fails.push('REDUCED MOTION CONTROL FAILED — Full motion also appeared frozen');
  await evalIn(`(()=>{ document.getElementById('docksets').click(); document.querySelector('[data-motion="-1"]')?.click();
    document.querySelector('#setpanel [data-pnx]')?.click(); return true; })()`);

  /* 1d. THE GOLDEN-LAYOUT GEOMETRY CONTRACT (ui-main-desktop.png positions;
     uilayout.js discipline: measure the REAL boxes, then prove the checker
     can catch a moved element before trusting its pass). */
  const geoCheck = `(()=>{ const W=innerWidth, H=innerHeight;
    const r=(id)=>{ const el=document.getElementById(id); if(!el) return null;
      const b=el.getBoundingClientRect(); return { l:b.left, t:b.top, r:b.right, b:b.bottom, cx:(b.left+b.right)/2, w:b.width, vis: b.width>0&&b.height>0 }; };
    const pc=r('playerchip'), hp=r('hpbar'), pr=r('primechip'), obj=r('objchip'),
      hint=r('hintpill'), ctx=r('ctxbar'), dock=r('dock'), rail=r('raillft'), dcx=r('dockcodex'),
      srch=r('searchbox');
    const bad=[];
    if(!pc || pc.l>80 || pc.t>60) bad.push('playerchip not top-left');
    if(!hp || !pc || hp.t < pc.b-4) bad.push('HP bar not under the player chip');
    if(!srch || !srch.vis || W-srch.r>40 || srch.t>60) bad.push('search bar not top-right');
    if(srch && pc && pc.r > srch.l+4) bad.push('player chip overlaps the search bar');
    if(W>900 && (!pr || Math.abs(pr.cx-W/2)>70 || pr.t>60)) bad.push('Prime Codex pill not top-center');
    if(W<=900 && pr && pr.vis) bad.push('Prime pill should hide on phone (it rides the dock tier in the golden)');
    if(!obj || obj.l>40 || obj.t<H*0.18 || obj.t>H*0.42) bad.push('objective chip not left @~26vh: '+JSON.stringify(obj));
    if(!hint || Math.abs(hint.cx-W/2)>90 || hint.b<H-160) bad.push('hint pill not bottom-center');
    if(ctx && hint && ctx.b>hint.t+6) bad.push('caption not ABOVE the hint pill');
    if(W>900){
      if(!dock || dock.cx<W*0.6) bad.push('desktop cluster not bottom-RIGHT (ROADMAP #11 rail lesson)');
      if(!rail || !rail.vis) bad.push('left rail missing on desktop');
      if(dcx && dcx.vis) bad.push('dock codex should hide on desktop (rail owns it)');
    } else {
      if(!dock || Math.abs(dock.cx-W/2)>60) bad.push('phone dock not bottom-center');
      if(rail && rail.vis) bad.push('left rail should hide on phone');
    }
    return bad; })()`;
  const geo = await evalIn(geoCheck);
  if (geo.length) fails.push('GOLDEN LAYOUT drift: ' + geo.join(' · '));
  /* the self-control: move the objective chip to the right, the checker
     MUST see it (reproduce-the-reported-geometry law), then restore */
  const geoCtl = await evalIn(`(()=>{ const o=document.getElementById('objchip'); o.style.left='900px';
    const bad=${geoCheck}; o.style.left=''; return bad; })()`);
  if (!geoCtl.some((b) => b.includes('objective chip'))) fails.push('GEOMETRY CHECKER CONTROL FAILED — a moved objective chip went unseen');

  /* The HP number is an overlay owned by the track, not a flex sibling that
     can drift beside it. Its translucent dark backing is independent from
     the track's dark fallback, so the label stays readable over both filled
     and depleted portions. Measure the rendered boxes and computed paints. */
  const hpTopbarCheck = `(()=>{ const hp=document.getElementById('hpbar'),track=hp?.querySelector(':scope > .track');
    const fill=track?.querySelector(':scope > .fill'),txt=track?.querySelector(':scope > .txt');
    const tr=track?.getBoundingClientRect(),xr=txt?.getBoundingClientRect();
    const tc=track?getComputedStyle(track):null,xc=txt?getComputedStyle(txt):null;
    const rgba=(value)=>{ const n=String(value||'').match(/[\\d.]+/g)?.map(Number)||[];
      return {r:n[0]??255,g:n[1]??255,b:n[2]??255,a:n[3]??1}; };
    const trackPaint=rgba(tc?.backgroundColor),labelPaint=rgba(xc?.backgroundColor);
    const nested=!!track&&!!fill&&!!txt&&fill.parentElement===track&&txt.parentElement===track;
    const covers=!!tr&&!!xr&&xr.left>=tr.left-0.1&&xr.top>=tr.top-0.1&&xr.right<=tr.right+0.1&&xr.bottom<=tr.bottom+0.1
      &&xr.left-tr.left<=2&&xr.top-tr.top<=2&&tr.right-xr.right<=2&&tr.bottom-xr.bottom<=2;
    const ordered=!!fill&&!!txt&&!!(fill.compareDocumentPosition(txt)&Node.DOCUMENT_POSITION_FOLLOWING);
    const trackDark=trackPaint.a===1&&Math.max(trackPaint.r,trackPaint.g,trackPaint.b)<80;
    const labelBacking=labelPaint.a>0.5&&labelPaint.a<1&&Math.max(labelPaint.r,labelPaint.g,labelPaint.b)<40;
    const independent=tc?.backgroundColor!==xc?.backgroundColor;
    return {ok:nested&&covers&&ordered&&tc?.position==='relative'&&xc?.position==='absolute'&&trackDark&&labelBacking&&independent,
      nested,covers,ordered,trackPosition:tc?.position||null,labelPosition:xc?.position||null,
      trackBg:tc?.backgroundColor||null,labelBg:xc?.backgroundColor||null,trackRect:tr?{x:tr.x,y:tr.y,w:tr.width,h:tr.height}:null,
      labelRect:xr?{x:xr.x,y:xr.y,w:xr.width,h:xr.height}:null}; })()`;
  const hpTopbar = await evalIn(hpTopbarCheck);
  if (!hpTopbar.ok) fails.push('HP TOPBAR: nested label geometry or independent dark backing is broken: ' + JSON.stringify(hpTopbar));
  const hpBackingCtl = await evalIn(`(()=>{ const txt=document.querySelector('#hpbar .track > .txt');
    if(!txt) return {ok:true,missing:true}; const prior=txt.style.background; txt.style.background='transparent';
    const result=${hpTopbarCheck}; if(prior) txt.style.background=prior; else txt.style.removeProperty('background'); return result; })()`);
  if (hpBackingCtl.ok) fails.push('HP TOPBAR CONTROL FAILED — transparent injected label backing stayed green: ' + JSON.stringify(hpBackingCtl));
  const hpNestingCtl = await evalIn(`(()=>{ const hp=document.getElementById('hpbar'),txt=hp?.querySelector('.track > .txt');
    if(!hp||!txt) return {ok:true,missing:true}; const parent=txt.parentNode,next=txt.nextSibling; hp.appendChild(txt);
    const result=${hpTopbarCheck}; parent.insertBefore(txt,next); return result; })()`);
  if (hpNestingCtl.ok) fails.push('HP TOPBAR CONTROL FAILED — label moved outside its track stayed green: ' + JSON.stringify(hpNestingCtl));

  /* 2. not blank — via Pixi's extract, which re-renders the stage (a WebGL
     canvas reads BLACK through 2D drawImage without preserveDrawingBuffer;
     the first run failed on exactly that instrument error) */
  const painted = await evalIn(`(async()=>{ const S=window.__CF_SLICE__; if(!S) return -1;
    /* frame-bounded: the stage's LOCAL bounds now span the observable
       universe (~10,700px) — an unframed extract exceeds the max texture
       size and reads back black while the SCREEN is fine (instrument-first:
       the check went red with a healthy build; renderer.screen bounds it) */
    const px=await S.app.renderer.extract.pixels({ target: S.app.stage, frame: S.app.renderer.screen });
    const d=px.pixels||px;
    let lit=0; for(let i=0;i<d.length;i+=4){ if(d[i]+d[i+1]+d[i+2]>60) lit++; } return lit; })()`);
  if (painted === -1) fails.push('__CF_SLICE__ diagnostics handle missing');
  else if (!(painted > 500)) fails.push('stage nearly blank — ' + painted + ' lit pixels (painters did not paint?)');

  const shot1 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(screenshotPath('universe'), Buffer.from(shot1.data, 'base64'));

  /* 3. SURVEY-FIRST: ONE tap on the Milky Way opens its card and must not
     teleport. The card's explicit travel action performs the dive; this is
     reachable even when the phone card covers the canvas body. */
  const cx = 1280 / 2 + 90, cy = 800 / 2 - 60;
  const click = async () => {
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x: cx, y: cy, button: 'left', clickCount: 1 }, sess);
    }
  };
  await click();
  await sleep(700);
  const st1 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (st1.mode !== 'universe') fails.push('a SINGLE tap descended (survey-first broken): ' + st1.mode);
  if (!st1.cardOpen || !st1.cardTitle) fails.push('single tap did not open the galaxy survey card: ' + JSON.stringify({ open: st1.cardOpen, title: st1.cardTitle }));
  if (st1.keyboardTarget !== null) fails.push('a pointer survey secretly armed the keyboard target: ' + JSON.stringify(st1.keyboardTarget));
  if (typeof st1.epoch !== 'number') fails.push('COSMIC_EPOCH clock not running: ' + JSON.stringify(st1.epoch));
  const nonPlanetRarityCheck = `(()=>{ const card=document.getElementById('survey'),rarity=[...card.querySelectorAll('[data-row="Rarity"]')],
    spectral=card.querySelectorAll('[data-row="Spectral class"]');return {ok:rarity.length===1&&spectral.length===0
      &&(rarity[0].querySelector('span')?.textContent||'').trim()==='Rarity',rarityCount:rarity.length,
      spectralCount:spectral.length,label:(rarity[0]?.querySelector('span')?.textContent||'').trim(),text:rarity[0]?.textContent||''};})()`;
  const galaxyRarity = await evalIn(nonPlanetRarityCheck);
  if (!galaxyRarity.ok) {
    fails.push('GALAXY SURVEY: player-facing card did not replace Spectral class with one plain Rarity row: '
      + JSON.stringify(galaxyRarity));
  }
  const travelCheck = `(()=>{ const button=document.querySelector('#survey [data-act=travel]');
    if(!button) return {ok:false,why:'missing'}; const b=button.getBoundingClientRect();
    const hit=document.elementFromPoint((b.left+b.right)/2,(b.top+b.bottom)/2);
    return {ok:b.width>0&&b.height>=44&&!!hit&&button.contains(hit),label:button.textContent,
      x:(b.left+b.right)/2,y:(b.top+b.bottom)/2,h:b.height}; })()`;
  const travel1 = await evalIn(travelCheck);
  if (!travel1.ok || travel1.label !== 'Enter galaxy') {
    fails.push('galaxy card travel action is missing, undersized, or buried: ' + JSON.stringify(travel1));
  }
  /* Discriminating hit-test control: make the action click-through and
     require the same rendered-outcome probe to turn red, then restore it. */
  if (travel1.ok) {
    const travelCtl = await evalIn(`(()=>{ const button=document.querySelector('#survey [data-act=travel]');
      const prior=button.style.pointerEvents; button.style.pointerEvents='none'; const result=${travelCheck};
      button.style.pointerEvents=prior; return result; })()`);
    if (travelCtl.ok) fails.push('TRAVEL ACTION CONTROL FAILED — injected click-through stayed green: ' + JSON.stringify(travelCtl));
  }
  /* Escape hides but does not invalidate the current card. Reopening it from
     the Survey dock must keep the explicit action usable, and a second
     Escape must be observed before the next body interaction. */
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, sess);
  await sleep(120);
  const closedBeforeDive = await evalIn(`window.__CF_SLICE__.api.state().cardOpen`);
  if (closedBeforeDive) fails.push('Escape did not close the galaxy card before dock reopen');
  await evalIn(`(()=>{ document.getElementById('docksurvey').click(); return true; })()`);
  const reopened = await evalIn(`({state:window.__CF_SLICE__.api.state(),travel:${travelCheck},cardOwnsChrome:document.body.classList.contains('card-open')})`);
  if (reopened.state.mode !== 'universe' || !reopened.state.cardOpen || !reopened.travel.ok || !reopened.cardOwnsChrome) {
    fails.push('Survey dock did not reopen the same usable galaxy action: ' + JSON.stringify(reopened));
  }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, sess);
  await sleep(120);
  const closedAgain = await evalIn(`window.__CF_SLICE__.api.state().cardOpen`);
  if (closedAgain) fails.push('second Escape did not close the reopened galaxy card');
  await click();
  const travel2 = await evalIn(travelCheck);
  if (!travel2.ok) fails.push('second body survey did not restore a usable galaxy action: ' + JSON.stringify(travel2));
  if (travel2.ok) {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: travel2.x, y: travel2.y, button: 'left', clickCount: 1 }, sess);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: travel2.x, y: travel2.y, button: 'left', clickCount: 1 }, sess);
  }
  await sleep(2500);   /* per-seed 512px painterly bake + star field */
  const st2 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (st2.mode !== 'galaxy' || st2.gal !== 999 || st2.galX !== 90 || st2.galY !== -60) {
    fails.push('galaxy card action did not enter the exact Milky Way node: '
      + JSON.stringify([st2.mode, st2.gal, st2.galX, st2.galY]));
  }
  if (!/Milky Way/.test(st2.trail)) fails.push('galaxy trail missing Milky Way: ' + JSON.stringify(st2.trail));
  if (!/stars sharing/.test(st2.ctx)) fails.push('galaxy caption (galaxyStats) missing: ' + JSON.stringify(st2.ctx));
  requireRenderedSceneAdvance('GENERATED MILKY WAY ROUTE', st1, st2);
  const galaxyNullKeyCtl = {
    ...st2,
    navGalaxyKey: null,
    renderedScene: { ...st2.renderedScene, galaxyKey: null },
  };
  if (renderedSceneMatchesNav(galaxyNullKeyCtl)) {
    fails.push('RENDERED-SCENE KEY-INVENTORY CONTROL FAILED — galaxy accepted agreeing null provenance keys');
  }
  const shot2 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(screenshotPath('galaxy'), Buffer.from(shot2.data, 'base64'));

  /* 3a-charter. THE ASCENT GATE, fresh save = stage 0 = SOL ONLY. Select the
     next real generated star through the canvas keyboard surface, survey it,
     then press its live Enter-system action. A fabricated 31337 tuple could
     be rejected by source proof without ever exercising the Charter law. */
  const gateBefore = await evalIn(`(()=>{ const S=window.__CF_SLICE__,before=S.api.state();
    S.app.canvas.focus(); return {mode:before.mode,gal:before.gal,star:before.star}; })()`);
  let gateTarget = null;
  const gateSelections = [];
  for (let attempt = 0; attempt < 32; attempt++) {
    await keyIn('ArrowRight', 'ArrowRight');
    gateTarget = await evalIn(`window.__CF_SLICE__.api.state().keyboardTarget`);
    gateSelections.push(gateTarget);
    if (/^star:/.test(gateTarget || '') && !/:424242:/.test(gateTarget || '')) break;
  }
  const gateTargetIsNonSol = /^star:/.test(gateTarget || '') && !/:424242:/.test(gateTarget || '');
  if (gateTargetIsNonSol) await keyIn('Enter', 'Enter');
  const gateTravel = await evalIn(travelCheck);
  if (gateTravel.ok) await clickDesktopPoint(gateTravel);
  const gatedState = await evalIn(`window.__CF_SLICE__.api.state()`);
  const gated = {
    before: gateBefore,
    target: gateTarget,
    selections: gateSelections,
    action: gateTravel,
    mode: gatedState.mode,
    gal: gatedState.gal,
    star: gatedState.star,
    stage: gatedState.stage,
    toastOn: gatedState.toastOn,
    toastText: gatedState.toastText,
  };
  if (gated.stage !== 0) fails.push('fresh save is not charter stage 0: ' + JSON.stringify(gated.stage));
  if (!gateTargetIsNonSol
    || !gated.action.ok || gated.action.label !== 'Enter system') {
    fails.push('CHARTER GATE SETUP did not select a genuine generated non-Sol star/action: '
      + JSON.stringify(gated));
  }
  const preservedBlockedNav = (state) => state.mode === 'galaxy'
    && state.gal === state.before.gal && state.star === state.before.star;
  if (!preservedBlockedNav(gated)) {
    fails.push('CHARTER GATE BROKEN — a stage-0 blocked dive changed navigation: ' + JSON.stringify(gated));
  }
  /* Negative control: an apparent block that actually entered a system must
     fail the same navigation-outcome predicate before this gate is trusted. */
  if (preservedBlockedNav({ ...gated, mode: 'system', star: 31337 })) {
    fails.push('CHARTER GATE NAVIGATION CONTROL FAILED — a synthetic teleport stayed green');
  }
  if (!gated.toastOn || !/development slice/i.test(gated.toastText)
    || /shipyard|\bbuild\b|mine|fabricat/i.test(gated.toastText)) {
    fails.push('charter block did not expose an honest current-slice reach boundary: ' + JSON.stringify(gated.toastText));
  }
  const gateToastCtl = await evalIn(`(()=>{ const toast=document.getElementById('toast'),prior=toast.innerHTML;
    toast.textContent='Build the Jump Drive at the Shipyard'; const text=toast.textContent||'';
    const ok=/development slice/i.test(text)&&!/shipyard|\\bbuild\\b|mine|fabricat/i.test(text);
    toast.innerHTML=prior; return {ok,text}; })()`);
  if (gateToastCtl.ok) fails.push('CHARTER GATE COPY CONTROL FAILED — injected Shipyard direction stayed green: ' + JSON.stringify(gateToastCtl));
  if (gatedState.cardOpen) await keyIn('Escape', 'Escape');
  const perf = await evalIn(`window.__CF_SLICE__.api.state().galaxyBuildMs`);
  console.log('  (galaxy rebuild: ' + (typeof perf === 'number' ? perf.toFixed(0) : '?') + 'ms)');

  /* 3b. BASE-STAR SURVEY-FIRST: drive the actual Sol sprite, prove one
     pointertap cannot teleport, then enter through the actual card action. */
  const solPoint = await evalIn(`(()=>{ const p=window.__CF_SLICE__.world.toGlobal({x:560,y:170}); return {x:p.x,y:p.y}; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: solPoint.x, y: solPoint.y, button: 'left', clickCount: 1 }, sess);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: solPoint.x, y: solPoint.y, button: 'left', clickCount: 1 }, sess);
  await sleep(300);
  const solSurvey = await evalIn(`({state:window.__CF_SLICE__.api.state(),travel:${travelCheck}})`);
  if (solSurvey.state.mode !== 'galaxy' || solSurvey.state.star !== null || !solSurvey.state.cardOpen
    || !solSurvey.travel.ok || solSurvey.travel.label !== 'Enter system') {
    fails.push('BASE STAR SURVEY-FIRST broken — one Sol tap teleported or lacked its action: ' + JSON.stringify(solSurvey));
  }
  const starRarity = await evalIn(nonPlanetRarityCheck);
  if (!starRarity.ok) {
    fails.push('STAR SURVEY: player-facing card did not replace Spectral class with one plain Rarity row: '
      + JSON.stringify(starRarity));
  }
  if (solSurvey.travel.ok) {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: solSurvey.travel.x, y: solSurvey.travel.y, button: 'left', clickCount: 1 }, sess);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: solSurvey.travel.x, y: solSurvey.travel.y, button: 'left', clickCount: 1 }, sess);
  }
  await sleep(1800);   /* eight painterly surfaces bake */
  const stSys = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (stSys.mode !== 'system' || stSys.star !== 424242 || stSys.starX !== 560 || stSys.starY !== 170) {
    fails.push('Sol card action did not enter the exact base-star node: '
      + JSON.stringify([stSys.mode, stSys.star, stSys.starX, stSys.starY]));
  }
  if (!stSys.trail.includes('Sun (Sol)')) fails.push('system trail missing Sun (Sol): ' + JSON.stringify(stSys.trail));
  if (!/8 worlds orbit Sol/.test(stSys.ctx)) fails.push('Sol caption wrong: ' + JSON.stringify(stSys.ctx));
  requireRenderedSceneAdvance('GENERATED SOL ROUTE', solSurvey.state, stSys);
  /* the DOCK press must LAND (simrun-dom law): charts OFF by default
     (v1.3.6, Nick's call) → press → the chart layer becomes VISIBLE and the
     save field flips */
  if (stSys.chartsOn !== false || stSys.chartsVisible !== false) fails.push('charts not OFF by default: ' + JSON.stringify([stSys.chartsOn, stSys.chartsVisible]));
  const chToggle = await evalIn(`(()=>{ document.getElementById('dockcharts').click(); const s=window.__CF_SLICE__.api.state();
    return { on:s.chartsOn,vis:s.chartsVisible,pressed:document.getElementById('dockcharts').getAttribute('aria-pressed') }; })()`);
  if (!chToggle.on || !chToggle.vis || chToggle.pressed !== 'true') {
    fails.push('DOCK PRESS/A11Y DID NOT LAND — charts state or aria-pressed did not update: ' + JSON.stringify(chToggle));
  }
  const chOff = await evalIn(`(()=>{ document.getElementById('dockcharts').click(); const s=window.__CF_SLICE__.api.state();
    return {on:s.chartsOn,vis:s.chartsVisible,pressed:document.getElementById('dockcharts').getAttribute('aria-pressed')}; })()`);   /* back OFF for the visual record */
  if (chOff.on || chOff.vis || chOff.pressed !== 'false') {
    fails.push('DOCK PRESS/A11Y: second charts press did not publish OFF: ' + JSON.stringify(chOff));
  }
  /* THE ONE-PANEL LAW (UI_PRESENTATION): settings opens → codex opens →
     settings must CLOSE; tap empty space closes; the corner ✕ closes;
     the volume slider drives the REAL save field through the shared bus. */
  const law = await evalIn(`(async()=>{ const S=window.__CF_SLICE__; const st=()=>S.api.state();
    document.getElementById('docksets').click();
    const a = st().panelOpen;
    document.getElementById('dockcodex').click();
    const b = st().panelOpen;
    const setsHidden = document.getElementById('setpanel').style.display === 'none';
    document.getElementById('docksets').click();
    const rst = !!document.getElementById('setrestart');
    const imp = !!document.getElementById('setimport');
    const vol = document.getElementById('setvol');
    vol.value = '30'; vol.dispatchEvent(new Event('input'));
    const v = st().sfxVol;
    document.querySelector('[data-pref="size"][data-value="fs-xl"]')?.click();
    document.querySelector('[data-pref="tone"][data-value="tone-max"]')?.click();
    document.querySelector('[data-pref="font"][data-value="font-mono"]')?.click();
    const stateButtons=[...document.querySelectorAll('#setpanel [aria-pressed]')];
    const groups=[...document.querySelectorAll('#setpanel [role="group"]')];
    const a11y={ok:stateButtons.length===14&&stateButtons.every((b)=>['true','false'].includes(b.getAttribute('aria-pressed')))
      &&groups.length===4&&groups.every((g)=>!!g.getAttribute('aria-label'))
      &&document.querySelector('[data-pref="size"][data-value="fs-xl"]')?.getAttribute('aria-pressed')==='true'
      &&document.querySelector('[data-pref="tone"][data-value="tone-max"]')?.getAttribute('aria-pressed')==='true'
      &&document.querySelector('[data-pref="font"][data-value="font-mono"]')?.getAttribute('aria-pressed')==='true',
      stateCount:stateButtons.length,groupLabels:groups.map((g)=>g.getAttribute('aria-label'))};
    const selected=document.querySelector('[data-pref="size"][data-value="fs-xl"]'),priorPressed=selected?.getAttribute('aria-pressed');
    selected?.removeAttribute('aria-pressed');
    const a11yControl=[...document.querySelectorAll('#setpanel button:is([data-pref],[data-motion]),#setsnd,#setcharts')]
      .every((b)=>['true','false'].includes(b.getAttribute('aria-pressed')));
    if(selected&&priorPressed!==null) selected.setAttribute('aria-pressed',priorPressed);
    const pref={state:st(),classes:[...document.body.classList],font:getComputedStyle(document.body).fontFamily};
    document.querySelector('[data-pref="size"][data-value=""]')?.click();
    document.querySelector('[data-pref="tone"][data-value=""]')?.click();
    document.querySelector('[data-pref="font"][data-value=""]')?.click();
    document.querySelector('#setpanel [data-pnx]').click();
    const c = st().panelOpen;
    return { a, b, setsHidden, v, c, rst, imp, pref, a11y, a11yControl }; })()`);
  if (law.a !== 'set') fails.push('settings panel did not open: ' + JSON.stringify(law.a));
  if (law.b !== 'codex' || !law.setsHidden) fails.push('ONE-PANEL LAW BROKEN — opening codex left settings up: ' + JSON.stringify(law));
  if (Math.abs(law.v - 0.3) > 1e-9) fails.push('volume slider did not drive save.sfxVol: ' + JSON.stringify(law.v));
  if (law.c !== null) fails.push('the corner ✕ did not close the panel: ' + JSON.stringify(law.c));
  if (!law.rst) fails.push('Settings lost the Restart-training control (the game promise)');
  if (!law.imp) fails.push('Settings lost the Bring-expedition import control');
  if (!law.a11y?.ok) fails.push('SETTINGS STATE SEMANTICS: current choices lack pressed/group state: ' + JSON.stringify(law.a11y));
  if (law.a11yControl) fails.push('SETTINGS STATE SEMANTICS CONTROL FAILED — removing aria-pressed stayed green');
  if (law.pref.state.fsMode !== 'fs-xl' || law.pref.state.toneMode !== 'tone-max' || law.pref.state.fontMode !== 'font-mono'
    || !law.pref.classes.includes('fs-xl') || !law.pref.classes.includes('tone-max') || !law.pref.classes.includes('font-mono')
    || !/mono/i.test(law.pref.font)) {
    fails.push('Settings accessibility preferences did not apply to rendered UI and save state: ' + JSON.stringify(law.pref));
  }
  const registeredCloseCheck = `(()=>{ const ids=['setpanel','guidepanel','codexpanel','recpanel','atlaspanel','chpanel'];
    const rows=ids.map(id=>({id,count:document.getElementById(id)?.querySelectorAll(':scope > [data-pnx]').length??-1}));
    return {ok:rows.every(row=>row.count===1),rows};})()`;
  const registeredCloses = await evalIn(registeredCloseCheck);
  if (!registeredCloses.ok) {
    fails.push('PANEL CLOSE INVENTORY: every registered panel must own exactly one direct close: '
      + JSON.stringify(registeredCloses));
  }
  const duplicatePanelCloseCtl = await evalIn(`(()=>{ const panel=document.getElementById('setpanel'),extra=document.createElement('button');
    extra.dataset.pnx='duplicate';extra.textContent='✕';panel.appendChild(extra);const result=${registeredCloseCheck};extra.remove();return result;})()`);
  if (duplicatePanelCloseCtl.ok || duplicatePanelCloseCtl.rows.find((row)=>row.id==='setpanel')?.count !== 2) {
    fails.push('PANEL CLOSE INVENTORY CONTROL FAILED — injected duplicate registered close stayed green: '
      + JSON.stringify(duplicatePanelCloseCtl));
  }
  const panelSwitchFocus = await evalIn(`(()=>{ const sets=document.getElementById('docksets'),guide=document.getElementById('dockguide');
    sets.focus(); sets.click(); guide.focus(); guide.click();
    const switched={panel:window.__CF_SLICE__.api.state().panelOpen,
      setsExpanded:sets.getAttribute('aria-expanded'),guideExpanded:guide.getAttribute('aria-expanded'),
      guideControls:guide.getAttribute('aria-controls')};
    document.querySelector('#guidepanel [data-pnx]')?.click();
    return {...switched,closed:window.__CF_SLICE__.api.state().panelOpen,
      guideExpandedAfter:guide.getAttribute('aria-expanded'),focus:document.activeElement?.id||null}; })()`);
  if (panelSwitchFocus.panel !== 'guide' || panelSwitchFocus.setsExpanded !== 'false'
    || panelSwitchFocus.guideExpanded !== 'true' || panelSwitchFocus.guideControls !== 'guidepanel'
    || panelSwitchFocus.closed !== null || panelSwitchFocus.guideExpandedAfter !== 'false'
    || panelSwitchFocus.focus !== 'dockguide') {
    fails.push('PANEL SWITCH FOCUS/A11Y: Settings → Guide did not close to the exact Guide opener: '
      + JSON.stringify(panelSwitchFocus));
  }

  /* UI-P1: flex spacing belongs to its rail, not to the sky behind it. The
     reported target is the exact 8px root-owned gap—not either registered
     button—so only real-browser pointer input plus elementFromPoint can prove
     this document-level pointerdown law. Declarative boundary inventory and
     independent removal controls keep the old asymmetric #raillft exception
     from surviving beside the new mechanism. */
  const panelBoundarySetup = await evalIn(`(()=>{ const S=window.__CF_SLICE__,before=S.api.state();
    if(before.cardOpen)document.querySelector('#survey [data-survey-close]')?.click();
    if(S.api.state().panelOpen){const panel=[...document.querySelectorAll('.panel')]
      .find((node)=>node.style.display!=='none');panel?.querySelector('[data-pnx]')?.click();}
    const ids=['topbar','raillft','railrgt','dock','survey'];
    const boundaries=ids.map((id)=>({id,present:document.getElementById(id)?.hasAttribute('data-panel-boundary')===true}));
    const state=S.api.state();return {panelOpen:state.panelOpen,cardOpen:state.cardOpen,boundaries};})()`);
  if (panelBoundarySetup.panelOpen !== null || panelBoundarySetup.cardOpen
    || panelBoundarySetup.boundaries.some((row) => !row.present)) {
    fails.push('PANEL BOUNDARY INVENTORY: setup or declared chrome ownership is incomplete: '
      + JSON.stringify(panelBoundarySetup));
  }
  const railGapProbe = (railId, upperId, lowerId) => `(()=>{ const S=window.__CF_SLICE__,
    rail=document.getElementById(${JSON.stringify(railId)}),upper=document.getElementById(${JSON.stringify(upperId)}),
    lower=document.getElementById(${JSON.stringify(lowerId)}),rr=rail?.getBoundingClientRect(),
    ur=upper?.getBoundingClientRect(),lr=lower?.getBoundingClientRect();
    if(!rail||!upper||!lower||!rr||!ur||!lr)return {geometry:false,why:'missing rail fixture'};
    const gap=lr.top-ur.bottom,point={x:(rr.left+rr.right)/2,y:(ur.bottom+lr.top)/2},hit=document.elementFromPoint(point.x,point.y),
      state=S.api.state();
    return {geometry:innerWidth===1280&&innerHeight===800&&getComputedStyle(rail).display==='flex'
        &&rr.width>0&&rr.height>0&&Math.abs(gap-8)<=0.5&&point.x>rr.left&&point.x<rr.right
        &&point.y>rr.top&&point.y<rr.bottom&&hit===rail,
      gap,point,targetId:hit?.id||null,boundary:rail.hasAttribute('data-panel-boundary'),
      panelOpen:state.panelOpen,cardOpen:state.cardOpen};})()`;
  const railButtonPoint = (id) => `(()=>{ const button=document.getElementById(${JSON.stringify(id)}),
    rect=button?.getBoundingClientRect(),x=rect?(rect.left+rect.right)/2:0,y=rect?(rect.top+rect.bottom)/2:0,
    hit=rect?document.elementFromPoint(x,y):null;return {ok:!!button&&!!rect&&rect.width>0&&rect.height>=44
      &&getComputedStyle(button).display!=='none'&&!!hit&&(hit===button||button.contains(hit)),x,y,targetId:hit?.id||null};})()`;
  const openDesktopRailPanel = async (buttonId, panelId, label) => {
    const point = await evalIn(railButtonPoint(buttonId));
    if (!point.ok) {
      fails.push(`${label}: visible rail opener was not browser-mouse hittable: ${JSON.stringify(point)}`);
      return false;
    }
    await clickDesktopPoint(point);
    const opened = await waitDesktopValue(`${label} open`, `window.__CF_SLICE__.api.state().panelOpen===${JSON.stringify(panelId)}`)
      .catch(() => false);
    if (!opened) fails.push(`${label}: browser-mouse rail opener did not open ${panelId}`);
    return !!opened;
  };
  const closeDesktopPanel = async () => {
    await evalIn(`(()=>{ const panel=[...document.querySelectorAll('.panel')].find((node)=>node.style.display!=='none');
      panel?.querySelector('[data-pnx]')?.click();return window.__CF_SLICE__.api.state().panelOpen;})()`);
    await sleep(40);
  };
  const rightGap = railGapProbe('railrgt', 'railatlas', 'railrecords');
  const leftGap = railGapProbe('raillft', 'railcharters', 'railcodex');

  if (await openDesktopRailPanel('railcodex', 'codex', 'RIGHT RAIL GAP')) {
    const before = await evalIn(rightGap);
    if (!before.geometry || before.cardOpen || before.panelOpen !== 'codex') {
      fails.push('RIGHT RAIL GAP: reported 8px root-owned geometry was not established: ' + JSON.stringify(before));
    } else {
      await armDesktopPointerReceipt();
      await clickDesktopPoint(before.point);
      const receipt = await takeDesktopPointerReceipt();
      const after = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state(),button=document.getElementById('railcodex'),
        panel=document.getElementById('codexpanel');return {panelOpen:s.panelOpen,expanded:button?.getAttribute('aria-expanded'),
          hidden:panel?.getAttribute('aria-hidden')};})()`);
      if (!before.boundary || receipt?.targetId !== 'railrgt' || receipt?.pointerType !== 'mouse' || after.panelOpen !== 'codex'
        || after.expanded !== 'true' || after.hidden !== 'false') {
        fails.push('RIGHT RAIL GAP: real root-gap pointer dismissed or desynchronized the active panel: '
          + JSON.stringify({ before, receipt, after }));
      }
    }
    await closeDesktopPanel();
  }
  if (await openDesktopRailPanel('railrecords', 'rec', 'LEFT RAIL GAP')) {
    const before = await evalIn(leftGap);
    if (!before.geometry || before.cardOpen || before.panelOpen !== 'rec') {
      fails.push('LEFT RAIL GAP: symmetric 8px root-owned geometry was not established: ' + JSON.stringify(before));
    } else {
      await armDesktopPointerReceipt();
      await clickDesktopPoint(before.point);
      const receipt = await takeDesktopPointerReceipt();
      const after = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state(),button=document.getElementById('railrecords'),
        panel=document.getElementById('recpanel');return {panelOpen:s.panelOpen,expanded:button?.getAttribute('aria-expanded'),
          hidden:panel?.getAttribute('aria-hidden')};})()`);
      if (!before.boundary || receipt?.targetId !== 'raillft' || receipt?.pointerType !== 'mouse' || after.panelOpen !== 'rec'
        || after.expanded !== 'true' || after.hidden !== 'false') {
        fails.push('LEFT RAIL GAP: real root-gap pointer dismissed or desynchronized the active panel: '
          + JSON.stringify({ before, receipt, after }));
      }
    }
    await closeDesktopPanel();
  }
  const railBoundaryRemovalControl = async ({ railId, gapCheck, buttonId, panelId, label }) => {
    if (!await openDesktopRailPanel(buttonId, panelId, `${label} CONTROL`)) return;
    const prior = await evalIn(`document.getElementById(${JSON.stringify(railId)})?.getAttribute('data-panel-boundary')??null`);
    let before = null, receipt = null;
    try {
      await evalIn(`document.getElementById(${JSON.stringify(railId)})?.removeAttribute('data-panel-boundary')`);
      before = await evalIn(gapCheck);
      await armDesktopPointerReceipt();
      await clickDesktopPoint(before.point);
      receipt = await takeDesktopPointerReceipt();
    } finally {
      await evalIn(`(()=>{ const rail=document.getElementById(${JSON.stringify(railId)}),prior=${JSON.stringify(prior)};
        if(prior===null)rail?.removeAttribute('data-panel-boundary');else rail?.setAttribute('data-panel-boundary',prior);})()`);
    }
    const after = await evalIn(`window.__CF_SLICE__.api.state().panelOpen`);
    if (prior === null || !before?.geometry || before.boundary || before.panelOpen !== panelId
      || receipt?.targetId !== railId || receipt?.pointerType !== 'mouse' || after !== null) {
      fails.push(`${label} CONTROL FAILED — removing only the rail boundary did not recreate dismissal: `
        + JSON.stringify({ prior, before, receipt, after }));
    }
    if (after !== null) await closeDesktopPanel();
  };
  await railBoundaryRemovalControl({
    railId: 'railrgt', gapCheck: rightGap, buttonId: 'railcodex', panelId: 'codex', label: 'RIGHT RAIL BOUNDARY',
  });
  await railBoundaryRemovalControl({
    railId: 'raillft', gapCheck: leftGap, buttonId: 'railrecords', panelId: 'rec', label: 'LEFT RAIL BOUNDARY',
  });

  /* Delegated document listeners are public event boundaries: a synthetic
     or retargeted non-Element target must be ignored, never allowed to throw
     before it can preserve the current panel. This restores the legacy guard
     for both pointerdown dismissal and the delegated Close click. */
  if (await openDesktopRailPanel('railrecords', 'rec', 'PANEL NON-ELEMENT TARGET')) {
    const nonElementTarget = await evalIn(`new Promise((resolve)=>{ const errors=[];
      const onError=(event)=>{errors.push(String(event.error?.message||event.message||'window error'));event.preventDefault();};
      addEventListener('error',onError);document.dispatchEvent(new Event('pointerdown',{bubbles:true}));
      document.dispatchEvent(new Event('click',{bubbles:true}));setTimeout(()=>{removeEventListener('error',onError);
        resolve({errors,panelOpen:window.__CF_SLICE__.api.state().panelOpen});},0);})`);
    if (nonElementTarget.errors.length || nonElementTarget.panelOpen !== 'rec') {
      fails.push('PANEL NON-ELEMENT TARGET: delegated pointer/click handlers threw or changed state: '
        + JSON.stringify(nonElementTarget));
    }
    await closeDesktopPanel();
  }
  /* Search keeps its established outside-dismiss policy in this bounded
     repair. It is interactive glass, but it is not one of the declared panel
     boundaries: a broad `.glass` or top-chrome exemption would silently
     change focus/Escape behavior while fixing the rail. */
  if (await openDesktopRailPanel('railcodex', 'codex', 'SEARCH OUTSIDE DISMISS')) {
    const searchPoint = await evalIn(`(()=>{ const input=document.getElementById('searchbox'),rect=input?.getBoundingClientRect(),
      x=rect?(rect.left+rect.right)/2:0,y=rect?(rect.top+rect.bottom)/2:0,hit=rect?document.elementFromPoint(x,y):null;
      return {ok:!!input&&!!rect&&rect.width>0&&rect.height>0&&hit===input&&!input.hasAttribute('data-panel-boundary'),x,y};})()`);
    let receipt = null;
    if (searchPoint.ok) {
      await armDesktopPointerReceipt();
      await clickDesktopPoint(searchPoint);
      receipt = await takeDesktopPointerReceipt();
    }
    const outcome = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state(),input=document.getElementById('searchbox');
      const result={panelOpen:s.panelOpen,focused:document.activeElement===input,boundary:input?.hasAttribute('data-panel-boundary')===true};
      input?.blur();return result;})()`);
    if (!searchPoint.ok || receipt?.targetId !== 'searchbox' || receipt?.pointerType !== 'mouse'
      || outcome.panelOpen !== null || !outcome.focused || outcome.boundary) {
      fails.push('SEARCH OUTSIDE DISMISS: bounded rail ownership changed established Search dismissal/focus: '
        + JSON.stringify({ searchPoint, receipt, outcome }));
      if (outcome.panelOpen !== null) await closeDesktopPanel();
    }
  }

  /* THE GUIDE IS THE MATURE MANUAL, not a parallel seven-topic summary:
     9 categories / 43 authored stable IDs / 41 legacy-live topics, with
     capability-aware v2 copy, search, cross-links and the complete release
     history. Import remains reachable through Settings. */
  const guideCheck = `(()=>{ const S=window.__CF_SLICE__,panel=document.getElementById('guidepanel');
    const categories=panel?[...panel.querySelectorAll('[data-guide-category]')]:[];
    const builds=[...document.querySelectorAll('[data-sel="guide-build"]')];
    const text=panel?.textContent||'';
    return { open:S.api.state().panelOpen==='guide'&&!!panel&&panel.style.display!=='none',
      categoryCount:categories.length,categoryIds:categories.map((row)=>row.getAttribute('data-guide-category')),
      search:!!panel?.querySelector('#guidesearch'),releases:!!panel?.querySelector('[data-guide-releases]'),
      buildCount:builds.length,buildInsideGuide:builds.length===1&&!!panel?.contains(builds[0]),
      buildText:(builds[0]?.textContent||'').trim(),releasePending:S.api.state().releasePending,
      seen:S.api.state().seenGuide,text,stale:/double[- ]tap|tap twice|travels there instantly/i.test(text) }; })()`;
  await evalIn(`(()=>{ const button=document.getElementById('dockguide'); button.focus(); button.click(); return true; })()`);
  const guide = await evalIn(guideCheck);
  if (!guide.open || guide.categoryCount !== 9 || new Set(guide.categoryIds).size !== 9
    || !guide.search || !guide.releases || guide.buildCount !== 1 || !guide.buildInsideGuide
    || !/Celestial Frontier v2\.0 development/i.test(guide.buildText)
    || guide.releasePending !== null || !guide.seen || guide.stale) {
    fails.push('GUIDE canonical category/search/release surface is incomplete: ' + JSON.stringify(guide));
  }
  const shotGuide = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(screenshotPath('guide'), Buffer.from(shotGuide.data, 'base64'));
  const guideCtl = await evalIn(`(()=>{ const row=document.querySelector('#guidepanel [data-guide-category]');
    const prior=row&&row.getAttribute('data-guide-category'); if(row) row.removeAttribute('data-guide-category');
    const result=${guideCheck}; if(row) row.setAttribute('data-guide-category',prior); return result; })()`);
  if (guideCtl.categoryCount !== 8) {
    fails.push('GUIDE CONTROL FAILED — removing one canonical category stayed green: ' + JSON.stringify(guideCtl));
  }
  /* Negative control in the other direction: append a known-obsolete gesture
     claim without changing topic structure. The same checker must flag the
     stale copy, or its vocabulary guard is only decorative. */
  const guideStaleCtl = await evalIn(`(()=>{ const panel=document.getElementById('guidepanel');
    const marker=document.createElement('span'); marker.textContent='double-tap dives'; panel.appendChild(marker);
    const result=${guideCheck}; marker.remove(); return result; })()`);
  if (!guideStaleCtl.stale) {
    fails.push('GUIDE CONTROL FAILED — injected stale double-tap copy stayed green: ' + JSON.stringify(guideStaleCtl));
  }
  const guideSearch = await evalIn(`(()=>{ const input=document.getElementById('guidesearch'); input.value='landing';
    input.dispatchEvent(new Event('input',{bubbles:true})); const rows=[...document.querySelectorAll('#guidepanel [data-sel=guide-topic]')];
    return {ids:rows.map((r)=>r.getAttribute('data-guide-topic')),availability:rows.map((r)=>r.getAttribute('data-guide-availability'))}; })()`);
  if (!guideSearch.ids.includes('landing')) fails.push('GUIDE search did not resolve the stable landing topic: ' + JSON.stringify(guideSearch));
  /* Inline Guide cross-links were spans in the mature literal. V2 must
     upgrade them to native keyboard actions, not merely make pointer
     delegation notice data-gt. */
  const guideLinkCheck = `(()=>{ const link=document.querySelector('#guidepanel [data-gt="landing"]'),r=link?.getBoundingClientRect();
    const hit=r?document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2):null;
    return {semantic:link?.tagName==='BUTTON'&&link.tabIndex>=0&&r.width>=44&&r.height>=44&&(hit===link||link?.contains(hit)),
      tag:link?.tagName||null,tabIndex:link?.tabIndex??null,width:r?.width||0,height:r?.height||0,hit:hit?.tagName||null,
      focused:document.activeElement===link}; })()`;
  await evalIn(`(()=>{ const input=document.getElementById('guidesearch'); input.value='zoom';
    input.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[data-guide-topic="zoom"]')?.click();
    document.querySelector('#guidepanel [data-gt="landing"]')?.focus(); return true; })()`);
  const guideLink = await evalIn(guideLinkCheck);
  if (!guideLink.semantic || !guideLink.focused) {
    fails.push('GUIDE KEYBOARD LINK: inline topic cross-link is not a focused native action: ' + JSON.stringify(guideLink));
  }
  await keyIn('Enter', 'Enter');
  const guideLinkOutcome = await evalIn(`(()=>{ const panel=document.getElementById('guidepanel'); return {
    title:panel?.querySelector('.guide-topic h4')?.textContent||'',status:panel?.querySelector('[data-guide-status]')?.getAttribute('data-guide-status')||null}; })()`);
  if (!/Landing/.test(guideLinkOutcome.title) || guideLinkOutcome.status !== 'partial') {
    fails.push('GUIDE KEYBOARD LINK: Enter did not open the real Landing topic: ' + JSON.stringify(guideLinkOutcome));
  }
  const guideLinkCtl = await evalIn(`(()=>{ const input=document.getElementById('guidesearch'); input.value='zoom';
    input.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[data-guide-topic="zoom"]')?.click();
    const link=document.querySelector('#guidepanel [data-gt="landing"]'); if(link){ const old=document.createElement('span');
      old.dataset.gt='landing'; old.textContent=link.textContent; link.replaceWith(old); } return ${guideLinkCheck}; })()`);
  if (guideLinkCtl.semantic) {
    fails.push('GUIDE KEYBOARD LINK CONTROL FAILED — injected pointer-only span stayed semantic: ' + JSON.stringify(guideLinkCtl));
  }
  const unavailableGuide = await evalIn(`(()=>{ const input=document.getElementById('guidesearch'); input.value='breeding';
    input.dispatchEvent(new Event('input',{bubbles:true})); const row=document.querySelector('[data-guide-topic="breeding"]');
    row?.click(); const p=document.getElementById('guidepanel'); return {status:p?.querySelector('[data-guide-status]')?.getAttribute('data-guide-status'),text:p?.textContent||''}; })()`);
  if (unavailableGuide.status !== 'unavailable' || !/Not yet available in v2|Not available in this v2 development slice/.test(unavailableGuide.text)
    || /Both parents are consumed by the union/.test(unavailableGuide.text)) {
    fails.push('GUIDE capability boundary advertised an unavailable legacy mechanic: ' + JSON.stringify(unavailableGuide));
  }
  const hpGuide = await evalIn(`(()=>{ const input=document.getElementById('guidesearch'); input.value='HP';
    input.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[data-guide-topic="hp"]')?.click();
    const p=document.getElementById('guidepanel');return {status:p?.querySelector('[data-guide-status]')?.getAttribute('data-guide-status'),text:p?.textContent||''};})()`);
  if (hpGuide.status !== 'partial' || !/read-only expedition fact/i.test(hpGuide.text)
    || !/imported\/current HP/i.test(hpGuide.text) || /Not yet available in v2/.test(hpGuide.text)) {
    fails.push('GUIDE HP boundary did not render the live read-only meter honestly: ' + JSON.stringify(hpGuide));
  }
  /* Charter recovery changes player-facing Guide truth, so prove both affected
     topics render the action contract. Pure content lookup cannot establish
     that fillGuide actually placed the revised body in the live panel. */
  const renderedCharterGuideCheck = (expectedTitle) => `(()=>{ const panel=document.getElementById('guidepanel'),article=panel?.querySelector('.guide-topic'),
    text=article?.textContent||'',title=article?.querySelector('h4')?.textContent?.trim()||'',
    status=article?.querySelector('[data-guide-status]')?.getAttribute('data-guide-status')||null;
    const stale=/only Charter outcome this slice writes|requires (?:a )?(?:real )?(?:newly )?banked landfall|only after a newly changed/i.test(text);
    return {ok:title.includes(${JSON.stringify(expectedTitle)})&&status==='partial'&&/only new Charter goal progress/i.test(text)&&/successful Land action/i.test(text)
      &&/every consecutive imported chapter/i.test(text)&&/saved reach stage/i.test(text)&&/invents no/i.test(text)&&!stale,
      title,status,stale,text};})()`;
  const renderCharterGuideTopic = async (topic, query, expectedTitle) => evalIn(`(()=>{ const input=document.getElementById('guidesearch');
    input.value=${JSON.stringify(query)};input.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('[data-guide-topic=${JSON.stringify(topic)}]')?.click();return ${renderedCharterGuideCheck(expectedTitle)};})()`);
  const chartersGuide = await renderCharterGuideTopic('charters', 'charters', 'Expedition Charters');
  const ascentGuideIdentityCtl = await evalIn(renderedCharterGuideCheck('Chapters'));
  if (ascentGuideIdentityCtl.ok || !/Expedition Charters/.test(ascentGuideIdentityCtl.title)) {
    fails.push('GUIDE ASCENT IDENTITY CONTROL FAILED — leaving the prior Charter article in place stayed green: '
      + JSON.stringify(ascentGuideIdentityCtl));
  }
  const ascentGuide = await renderCharterGuideTopic('ascent', 'ascent', 'Chapters');
  if (!chartersGuide.ok || !ascentGuide.ok) {
    fails.push('GUIDE Charter/Ascent recovery contract did not render in both live topics: '
      + JSON.stringify({ chartersGuide, ascentGuide }));
  }
  const charterGuideStaleCtl = await evalIn(`(()=>{ const article=document.querySelector('#guidepanel .guide-topic'),
    marker=document.createElement('p');marker.textContent='First landfall banks live; it is the only Charter outcome this slice writes.';
    article?.appendChild(marker);const result=${renderedCharterGuideCheck('Chapters')};marker.remove();return result;})()`);
  if (charterGuideStaleCtl.ok || !charterGuideStaleCtl.stale) {
    fails.push('GUIDE CHARTER COPY CONTROL FAILED — injected pre-recovery wording stayed current: '
      + JSON.stringify(charterGuideStaleCtl));
  }
  const renderedTrainingRestoreGuideCheck = (expectedTitle) => `(()=>{ const article=document.querySelector('#guidepanel .guide-topic'),
    text=(article?.textContent||'').replace(/\\s+/g,' ').trim(),title=article?.querySelector('h4')?.textContent?.trim()||'',
    status=article?.querySelector('[data-guide-status]')?.getAttribute('data-guide-status')||null,
    required=['normal Finish or Skip source-verifies and immediately restores the exact pre-Training view',
      'If verification pauses, that exact view stays saved','when Sol can still be verified, Training returns there','reload can restart safely and retry'],
    missing=required.filter((part)=>!text.includes(part)),
    contradictory=/\\balways\\b[^.!?]{0,80}\\brestor(?:e|es|ed)\\b[^.!?]{0,40}\\bimmediately\\b/i.test(text)
      ||/verification[^.!?]{0,48}pauses?[^.!?]{0,72}(?:clear|discard|lose)s?[^.!?]{0,48}(?:view|location)/i.test(text)
      ||/verification[^.!?]{0,48}pauses?[^.!?]{0,96}(?:view|location)[^.!?]{0,48}(?:cleared|discarded|lost)/i.test(text)
      ||/(?:reload|retry|restarts?|resumes?)[^.!?]{0,72}(?:Earth|surface|finish(?:ed)? (?:world|location)|last location)/i.test(text)
      ||/verification pauses[^.!?]{0,160}reload safely restarts Field Training from proven Sol/i.test(text);
    return {ok:title.includes(${JSON.stringify(expectedTitle)})&&status==='partial'&&missing.length===0&&!contradictory,
      title,status,missing,contradictory,text};})()`;
  const renderTrainingRestoreGuideTopic = async (topic, expectedTitle) => evalIn(`(()=>{ const input=document.getElementById('guidesearch');
    input.value=${JSON.stringify(topic)};input.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('[data-guide-topic=${JSON.stringify(topic)}]')?.click();return ${renderedTrainingRestoreGuideCheck(expectedTitle)};})()`);
  const settingsTrainingRestoreGuide = await renderTrainingRestoreGuideTopic('settings', 'Settings');
  const savingTrainingRestoreGuide = await renderTrainingRestoreGuideTopic('saving', 'Your save & reset');
  if (!settingsTrainingRestoreGuide.ok || !savingTrainingRestoreGuide.ok) {
    fails.push('GUIDE Field Training restore/source-verification boundary did not render in Settings and Saving: '
      + JSON.stringify({ settingsTrainingRestoreGuide, savingTrainingRestoreGuide }));
  }
  const trainingRestoreGuideCtl = await evalIn(`(()=>{ const article=document.querySelector('#guidepanel .guide-topic'),
    paragraph=[...article.querySelectorAll('p')].find((node)=>(node.textContent||'').includes('normal Finish or Skip source-verifies')),
    prior=paragraph?.innerHTML||'',marker=document.createElement('p');let missing=null,contradiction=null;
    if(paragraph){paragraph.textContent='During Field Training, Finish or Skip restores the pre-training view.';
      missing=${renderedTrainingRestoreGuideCheck('Your save & reset')};paragraph.innerHTML=prior;}
    marker.textContent='If verification pauses, a reload safely restarts Field Training from proven Sol.';article?.appendChild(marker);
    contradiction=${renderedTrainingRestoreGuideCheck('Your save & reset')};marker.remove();
    const restored=!!paragraph&&paragraph.innerHTML===prior&&${renderedTrainingRestoreGuideCheck('Your save & reset')}.ok;
    return {ok:missing?.ok===false&&missing?.missing?.length>0&&contradiction?.ok===false&&contradiction?.contradictory===true&&restored,
      missing,contradiction,restored};})()`);
  if (!trainingRestoreGuideCtl.ok) {
    fails.push('GUIDE TRAINING RESTORE COPY CONTROL FAILED — missing/absolute recovery copy did not turn the rendered outcome red: '
      + JSON.stringify(trainingRestoreGuideCtl));
  }
  const releaseBaseline = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state();
    return {rnSeen:s.rnSeen,releasePending:s.releasePending}; })()`);
  if (releaseBaseline.rnSeen !== '0' || releaseBaseline.releasePending !== null) {
    fails.push('GUIDE draft release state changed before Release history opened: ' + JSON.stringify(releaseBaseline));
  }
  const releaseGuide = await evalIn(`(()=>{ document.querySelector('#guidepanel [data-guide-releases]')?.click();
    const S=window.__CF_SLICE__,rows=[...document.querySelectorAll('#guidepanel [data-release-index]')],first=rows[0],second=rows[1],s=S.api.state();
    return {count:rows.length,first:first?.textContent||'',second:second?.textContent||'',rnSeen:s.rnSeen,releasePending:s.releasePending}; })()`);
  if (releaseGuide.count !== 57 || !/v2\.0/.test(releaseGuide.first)
    || !/UNRELEASED DEVELOPMENT/.test(releaseGuide.first) || !/v1\.8\.9/.test(releaseGuide.second)
    || releaseGuide.rnSeen !== releaseBaseline.rnSeen || releaseGuide.releasePending !== releaseBaseline.releasePending) {
    fails.push('GUIDE release history did not preserve draft/legacy separation and full inventory: ' + JSON.stringify(releaseGuide));
  }
  const releaseDraftCheck = `(()=>{ const S=window.__CF_SLICE__,panel=document.getElementById('guidepanel'),article=panel?.querySelector('.guide-topic');
    const headings=article?[...article.querySelectorAll('h5')].map((row)=>row.textContent?.trim()||''):[];
    const bulletNodes=article?[...article.querySelectorAll('li')]:[],bullets=bulletNodes.map((row)=>row.textContent?.trim()||'');
    const text=article?.textContent||'',lower=text.toLowerCase(),state=S.api.state(),title=article?.querySelector('[data-guide-heading]')?.textContent||'';
    const first=bulletNodes.find((item)=>/FIRST PLANETFALL COUNTS/.test(item.textContent||'')),
      recovery=bulletNodes.find((item)=>/COMPLETE IMPORTED CHAPTERS MOVE AGAIN/.test(item.textContent||'')),
      training=bulletNodes.find((item)=>/FIELD TRAINING LIVES IN THE NEW SHELL/.test(item.textContent||'')),
      headingFor=(item)=>(item?.parentElement?.previousElementSibling?.textContent||'').trim(),
      firstHeading=headingFor(first),recoveryHeading=headingFor(recovery),
      charterPlacement=!!first&&!!recovery&&first!==recovery&&firstHeading==='Gameplay'&&recoveryHeading==='Bug Fixes',
      trainingText=training?.textContent||'',
      trainingContradiction=/\\balways\\b[^.!?]{0,80}\\brestor(?:e|es|ed)\\b[^.!?]{0,40}\\bimmediately\\b/i.test(trainingText)
        ||/verification[^.!?]{0,48}pauses?[^.!?]{0,72}(?:clear|discard|lose)s?[^.!?]{0,48}(?:view|location)/i.test(trainingText)
        ||/verification[^.!?]{0,48}pauses?[^.!?]{0,96}(?:view|location)[^.!?]{0,48}(?:cleared|discarded|lost)/i.test(trainingText)
        ||/verification pauses[^.!?]{0,160}reload safely restarts Field Training from proven Sol/i.test(trainingText),
      trainingContract=trainingText.includes('A normal Finish or Skip source-verifies and immediately restores the exact pre-Training view')
        &&trainingText.includes('if verification pauses, that exact view stays saved')
        &&trainingText.includes('when Sol can still be verified, Training returns there')
        &&trainingText.includes('reload can restart safely and retry')&&!trainingContradiction;
    const overclaim=/\\b(?:mining|crafting|combat|capture|breeding)\\b[^.!?]{0,80}\\b(?:is|are)\\s+(?:now\\s+)?(?:playable|available|live)\\b/i.test(text)
      ||/\\bv2(?:\\.0)?\\s+(?:port|game|build)\\s+(?:is\\s+)?(?:complete|finished|production[- ]ready|fully ported)\\b/i.test(text)
      ||/\\b(?:all|every)\\s+legacy\\s+(?:system|mechanic|feature)s?\\b[^.!?]{0,80}\\b(?:ported|playable|available|live)\\b/i.test(text);
    return {title,identity:title.includes('v2.0 · A New Foundation'),
      status:article?.querySelector('[data-guide-status]')?.getAttribute('data-guide-status')||null,headings,bulletCount:bullets.length,
      populated:bullets.length===44&&bullets.every((bullet)=>bullet.length>0),
      canonical:JSON.stringify(headings)===JSON.stringify(['New Features & Systems','UI Enhancements','Gameplay','Bug Fixes','Under the Hood']),
      complete:charterPlacement&&trainingContract&&/NEW FOUNDATION/.test(text)&&/ONE SURFACE, ONE CLOSE/.test(text)
        &&/exactly one 44-pixel top-right Close action/.test(text)
        &&/Spacing inside either desktop rail belongs to that command deck and leaves the active panel open/.test(text)
        &&/a genuine empty-sky press still dismisses it/.test(text)
        &&/FIRST PLANETFALL COUNTS/.test(text)&&/Only a world’s first landing banks the live landfall objective/.test(text)
        &&/COMPLETE IMPORTED CHAPTERS MOVE AGAIN/.test(text)&&/incomplete or unpowered records stay put/.test(text)
        &&/RARITY IS NOT A SPECTRAL CLASS/.test(text)&&/DEVELOPMENT PUBLISHING IS ISOLATED/.test(text),
      charterPlacement,firstHeading,recoveryHeading,trainingContract,trainingContradiction,
      honest:!overclaim&&!trainingContradiction&&lower.includes('mechanics that are not yet playable are labelled instead of promised'),
      authority:state.rnSeen==='0'&&state.releasePending===null,rnSeen:state.rnSeen,releasePending:state.releasePending}; })()`;
  await evalIn(`document.querySelector('#guidepanel [data-release-index="0"]')?.click()`);
  const releaseDraft = await evalIn(releaseDraftCheck);
  if (!releaseDraft.identity || releaseDraft.status !== 'draft'
    || !releaseDraft.canonical || !releaseDraft.populated || releaseDraft.bulletCount !== 44 || !releaseDraft.complete
    || !releaseDraft.honest || !releaseDraft.authority || releaseDraft.releasePending !== releaseBaseline.releasePending
    || releaseDraft.rnSeen !== releaseBaseline.rnSeen) {
    fails.push('GUIDE v2.0 development bulletin is incomplete or changed shipped-release state: '
      + JSON.stringify({ ...releaseDraft, baseline: releaseBaseline }));
  }
  const releaseOrderCtl = await evalIn(`(()=>{ const headings=[...document.querySelectorAll('#guidepanel .guide-topic h5')];
    if(headings.length<2)return {canonical:true,error:'missing headings'}; const a=headings[0].textContent,b=headings[1].textContent;
    headings[0].textContent=b;headings[1].textContent=a;const result=${releaseDraftCheck};headings[0].textContent=a;headings[1].textContent=b;return result; })()`);
  if (releaseOrderCtl.canonical) {
    fails.push('GUIDE RELEASE CONTROL FAILED — reordering two v2.0 categories stayed canonical: ' + JSON.stringify(releaseOrderCtl));
  }
  const releaseInventoryCtl = await evalIn(`(()=>{ const row=[...document.querySelectorAll('#guidepanel .guide-topic li')][12];
    if(!row)return {populated:true,error:'missing control row'};const parent=row.parentNode,next=row.nextSibling;row.remove();const result=${releaseDraftCheck};
    parent.insertBefore(row,next);return result; })()`);
  if (releaseInventoryCtl.populated || releaseInventoryCtl.bulletCount !== 43) {
    fails.push('GUIDE RELEASE CONTROL FAILED — removing a middle v2.0 bullet stayed complete: ' + JSON.stringify(releaseInventoryCtl));
  }
  const releaseCloseCopyCtl = await evalIn(`(()=>{ const row=[...document.querySelectorAll('#guidepanel .guide-topic li')]
    .find((item)=>/ONE SURFACE, ONE CLOSE/.test(item.textContent||''));if(!row)return {complete:true,error:'missing sentinel row'};
    const prior=row.textContent;row.textContent=prior.replace('exactly one 44-pixel top-right Close action',
      'Close-action outcome removed');const result=${releaseDraftCheck};row.textContent=prior;return result; })()`);
  if (releaseCloseCopyCtl.complete) {
    fails.push('GUIDE RELEASE CLOSE CONTROL FAILED — removing the original Close outcome stayed complete: '
      + JSON.stringify(releaseCloseCopyCtl));
  }
  const releaseRailCopyCtl = await evalIn(`(()=>{ const row=[...document.querySelectorAll('#guidepanel .guide-topic li')]
    .find((item)=>/ONE SURFACE, ONE CLOSE/.test(item.textContent||''));if(!row)return {complete:true,error:'missing sentinel row'};
    const prior=row.textContent;row.textContent=prior.replace('leaves the active panel open','rail preservation outcome removed');
    const result=${releaseDraftCheck};row.textContent=prior;return result; })()`);
  if (releaseRailCopyCtl.complete) {
    fails.push('GUIDE RELEASE RAIL CONTROL FAILED — removing the rail-preservation outcome stayed complete: '
      + JSON.stringify(releaseRailCopyCtl));
  }
  const releaseSkyCopyCtl = await evalIn(`(()=>{ const row=[...document.querySelectorAll('#guidepanel .guide-topic li')]
    .find((item)=>/ONE SURFACE, ONE CLOSE/.test(item.textContent||''));if(!row)return {complete:true,error:'missing sentinel row'};
    const prior=row.textContent;row.textContent=prior.replace('a genuine empty-sky press still dismisses it',
      'empty-sky dismissal outcome removed');const result=${releaseDraftCheck};row.textContent=prior;return result; })()`);
  if (releaseSkyCopyCtl.complete) {
    fails.push('GUIDE RELEASE EMPTY-SKY CONTROL FAILED — removing the dismissal outcome stayed complete: '
      + JSON.stringify(releaseSkyCopyCtl));
  }
  const releaseCharterCopyCtl = await evalIn(`(()=>{ const rows=[...document.querySelectorAll('#guidepanel .guide-topic li')],
    first=rows.find((item)=>/FIRST PLANETFALL COUNTS/.test(item.textContent||'')),
    recovery=rows.find((item)=>/COMPLETE IMPORTED CHAPTERS MOVE AGAIN/.test(item.textContent||''));
    if(!first||!recovery||first===recovery)return {first:{complete:true},recovery:{complete:true},placement:{complete:true},error:'missing/distinct Charter release rows'};
    const firstText=first.textContent,recoveryText=recovery.textContent,recoveryParent=recovery.parentNode,recoveryNext=recovery.nextSibling;
    first.textContent='First-landfall contract removed';const firstResult=${releaseDraftCheck};first.textContent=firstText;
    recovery.textContent='Imported recovery contract removed';const recoveryResult=${releaseDraftCheck};recovery.textContent=recoveryText;
    first.parentNode.appendChild(recovery);const placementResult=${releaseDraftCheck};recoveryParent.insertBefore(recovery,recoveryNext);
    return {first:firstResult,recovery:recoveryResult,placement:placementResult,
      restored:first.textContent===firstText&&recovery.textContent===recoveryText&&recovery.parentNode===recoveryParent};})()`);
  if (releaseCharterCopyCtl.first.complete || releaseCharterCopyCtl.recovery.complete
    || releaseCharterCopyCtl.placement.complete || releaseCharterCopyCtl.placement.charterPlacement
    || !releaseCharterCopyCtl.restored) {
    fails.push('GUIDE RELEASE CHARTER CONTROL FAILED — changed Charter statements were not both required: '
      + JSON.stringify(releaseCharterCopyCtl));
  }
  const releaseTrainingCopyCtl = await evalIn(`(()=>{ const row=[...document.querySelectorAll('#guidepanel .guide-topic li')]
    .find((item)=>/FIELD TRAINING LIVES IN THE NEW SHELL/.test(item.textContent||''));
    if(!row)return {stale:{complete:true},contradiction:{honest:true},error:'missing Training release row'};const prior=row.textContent;
    row.textContent=prior.replace('if verification pauses, that exact view stays saved, and when Sol can still be verified, Training returns there so a reload can restart safely and retry',
      'if verification pauses, that exact view stays saved and a reload safely restarts Field Training from proven Sol');
    const stale=${releaseDraftCheck};row.textContent=prior+' Finish or Skip always restores immediately, even when verification pauses.';
    const contradiction=${releaseDraftCheck};row.textContent=prior;
    return {stale,contradiction,restored:row.textContent===prior};})()`);
  if (releaseTrainingCopyCtl.stale.complete || releaseTrainingCopyCtl.stale.trainingContract
    || releaseTrainingCopyCtl.contradiction.complete || releaseTrainingCopyCtl.contradiction.honest
    || releaseTrainingCopyCtl.contradiction.trainingContract || !releaseTrainingCopyCtl.restored) {
    fails.push('GUIDE RELEASE TRAINING CONTROL FAILED — stale/contradictory restore claims stayed current: '
      + JSON.stringify(releaseTrainingCopyCtl));
  }
  const releaseVersionCtl = await evalIn(`(()=>{ const heading=document.querySelector('#guidepanel .guide-topic [data-guide-heading]');
    if(!heading)return {identity:true,error:'missing release heading'};const prior=heading.textContent;heading.textContent=prior.replace('v2.0','v2x0');
    const result=${releaseDraftCheck};heading.textContent=prior;return result; })()`);
  if (releaseVersionCtl.identity) {
    fails.push('GUIDE RELEASE CONTROL FAILED — mutating the v2.0 punctuation preserved exact identity: ' + JSON.stringify(releaseVersionCtl));
  }
  const releaseOverclaimCtl = await evalIn(`(()=>{ const row=[...document.querySelectorAll('#guidepanel .guide-topic li')][1];
    if(!row)return {honest:true,error:'missing overclaim control row'};const prior=row.textContent;row.textContent='Mining is now playable.';
    const result=${releaseDraftCheck};row.textContent=prior;return result; })()`);
  if (releaseOverclaimCtl.honest) {
    fails.push('GUIDE RELEASE CONTROL FAILED — an injected unported-feature claim stayed honest: ' + JSON.stringify(releaseOverclaimCtl));
  }
  const releaseAuthorityCtl = await evalIn(`(()=>{ const S=window.__CF_SLICE__,prior=S.api.state;let result;
    try{S.api.state=()=>({...prior(),rnSeen:'2.0'});result=${releaseDraftCheck};}finally{S.api.state=prior;}return result;})()`);
  if (releaseAuthorityCtl.authority || releaseAuthorityCtl.rnSeen === releaseBaseline.rnSeen) {
    fails.push('GUIDE RELEASE CONTROL FAILED — mutating draft seen-state stayed authoritative: ' + JSON.stringify(releaseAuthorityCtl));
  }
  const releaseTailCheck = `(()=>{ const panel=document.getElementById('guidepanel'),items=panel?[...panel.querySelectorAll('.guide-topic li')]:[],tail=items.at(-1);
    if(!panel||!tail)return {ok:false};const p=panel.getBoundingClientRect(),r=tail.getBoundingClientRect(),overflowY=getComputedStyle(panel).overflowY,
      maxScroll=Math.max(0,panel.scrollHeight-panel.clientHeight),scrollable=/^(auto|scroll)$/.test(overflowY)&&maxScroll>0,
      advanced=panel.scrollTop>0&&panel.scrollTop>=maxScroll-2,visible=r.top>=p.top-1&&r.bottom<=p.bottom+1;
    return {ok:scrollable&&advanced&&visible,overflowY,advanced,visible,scrollTop:panel.scrollTop,maxScroll,
      scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,text:tail.textContent||''}; })()`;
  const releaseScrollPoint = await evalIn(`(()=>{ const panel=document.getElementById('guidepanel'),r=panel.getBoundingClientRect();panel.scrollTop=0;
    return {x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};})()`);
  for (let i = 0; i < 3; i++) {
    await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: releaseScrollPoint.x, y: releaseScrollPoint.y,
      deltaX: 0, deltaY: 10000 }, sess);
  }
  await sleep(100);
  const releaseTail = await evalIn(releaseTailCheck);
  if (!releaseTail.ok || !releaseTail.text.toLowerCase().includes('production remains the v1.8.9 main-branch site')) {
    fails.push('GUIDE v2.0 development bulletin tail is not scroll-reachable: ' + JSON.stringify(releaseTail));
  }
  const releaseOverflowPrior = await evalIn(`(()=>{ const panel=document.getElementById('guidepanel'),style=panel.style;
    const prior={value:style.getPropertyValue('overflow-y'),priority:style.getPropertyPriority('overflow-y')};
    style.setProperty('overflow-y','hidden','important');panel.scrollTop=0;return prior;})()`);
  for (let i = 0; i < 3; i++) {
    await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: releaseScrollPoint.x, y: releaseScrollPoint.y,
      deltaX: 0, deltaY: 10000 }, sess);
  }
  await sleep(100);
  const releaseTailCtl = await evalIn(releaseTailCheck);
  await evalIn(`(()=>{ const panel=document.getElementById('guidepanel'),prior=${JSON.stringify(releaseOverflowPrior)};
    if(prior.value)panel.style.setProperty('overflow-y',prior.value,prior.priority);else panel.style.removeProperty('overflow-y');panel.scrollTop=0;})()`);
  if (releaseTailCtl.ok || releaseTailCtl.overflowY !== 'hidden' || releaseTailCtl.scrollTop !== 0) {
    fails.push('GUIDE RELEASE CONTROL FAILED — clipping the expanded bulletin tail stayed reachable: ' + JSON.stringify(releaseTailCtl));
  }
  const guideFocusBack = await evalIn(`(()=>{ document.querySelector('#guidepanel [data-pnx]').click();
    return document.activeElement&&document.activeElement.id; })()`);
  if (guideFocusBack !== 'dockguide') fails.push('closing Guide did not restore focus to its opener: ' + JSON.stringify(guideFocusBack));
  /* Persisted means durable storage plus a new-document restore, not merely a
     synchronous in-memory flag that some later unrelated save might carry. */
  await waitDesktopValue('Guide seen-state storage commit', `new Promise((resolve)=>{ const q=indexedDB.open('cf-v2-slice');
    q.onerror=()=>resolve(null); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readonly'),g=tx.objectStore('meta').get('save');
      g.onsuccess=()=>{ let guide=0; try{guide=JSON.parse(String(g.result||''))?.guide||0}catch{} db.close(); resolve(guide===1?guide:null); };
      g.onerror=()=>{db.close();resolve(null)}; }; })`);
  await navigateToSlice(sess, URL0, 'Guide seen-state reload');
  const guideReload = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (!guideReload.seenGuide) fails.push('GUIDE seen-state did not survive its isolated storage/reload outcome');
  if (guideReload.releasePending !== releaseBaseline.releasePending || guideReload.rnSeen !== releaseBaseline.rnSeen) {
    fails.push('GUIDE draft release changed shipped-release state after persistence/reload: '
      + JSON.stringify({ baseline: releaseBaseline, rnSeenAfter: guideReload.rnSeen,
        releasePending: guideReload.releasePending }));
  }

  const importAccess = await evalIn(`(()=>{ const S=window.__CF_SLICE__;
    document.getElementById('docksets').click();
    const button=document.getElementById('setimport'); if(button) button.click();
    const sheet=document.getElementById('importsheet');
    return { button:!!button, open:!!sheet&&sheet.style.display!=='none', panel:S.api.state().panelOpen,
      focus:document.activeElement&&document.activeElement.id,
      oldDock:!!document.getElementById('docksave'), safety:(sheet?.querySelector('[data-sel=import-safety]')?.textContent||'').trim() }; })()`);
  if (!importAccess.button || !importAccess.open || importAccess.panel !== null
    || importAccess.focus !== 'importtext' || importAccess.oldDock) {
    fails.push('SETTINGS IMPORT path is missing, unfocused, or still duplicated in the dock: ' + JSON.stringify(importAccess));
  }
  if (!/keep that external moderator backup as the authoritative exact copy/i.test(importAccess.safety)
    || !/attempts an additional exact local keepsake/i.test(importAccess.safety)
    || /provided blob is kept byte-for-byte/i.test(importAccess.safety)) {
    fails.push('SETTINGS IMPORT safety copy overpromises browser keepsake durability: ' + JSON.stringify(importAccess.safety));
  }
  /* Drive the visible front door, not the diagnostic importBlob seam. An
     invalid paste must become one exact, visible, assertive atomic alert,
     while the authoritative primary remains byte-for-byte untouched. */
  const preModalRejectRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  const importErrorCheck = `(()=>{ const sheet=document.getElementById('importsheet'),msg=document.getElementById('importmsg');
    const cs=msg?getComputedStyle(msg):null,r=msg?.getBoundingClientRect();
    const text=msg?.textContent||'',visible=!!r&&r.width>0&&r.height>0&&cs?.display!=='none'&&cs?.visibility!=='hidden';
    const role=msg?.getAttribute('role')||null,live=msg?.getAttribute('aria-live')||null,atomic=msg?.getAttribute('aria-atomic')||null;
    const tickerStarted=window.__CF_SLICE__.app.ticker.started===true;
    return {ok:sheet?.style.display!=='none'&&text===${JSON.stringify(INVALID_IMPORT_ERROR)}&&visible&&role==='alert'&&live==='assertive'&&atomic==='true'&&tickerStarted,
      text,visible,role,live,atomic,tickerStarted}; })()`;
  await evalIn(`(()=>{ const input=document.getElementById('importtext'),msg=document.getElementById('importmsg');
    input.value='this is not JSON'; msg.textContent=''; document.getElementById('importgo').click(); return true; })()`);
  const importError = await waitDesktopValue('invalid Import button visible error', `(()=>{ const result=${importErrorCheck}; return result.text?result:null; })()`);
  const postModalRejectRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  if (!importError.ok) fails.push('IMPORT ERROR ALERT: actual invalid button click lacked its exact visible assertive/atomic error: ' + JSON.stringify(importError));
  if (postModalRejectRaw !== preModalRejectRaw) {
    fails.push('IMPORT ERROR ALERT: rejected modal input changed exact primary bytes');
  }
  const importErrorCtl = await evalIn(`(()=>{ const msg=document.getElementById('importmsg');
    if(!msg) return {ok:true,missing:true}; const role=msg.getAttribute('role'),live=msg.getAttribute('aria-live');
    msg.removeAttribute('role'); msg.removeAttribute('aria-live'); const result=${importErrorCheck};
    if(role!==null) msg.setAttribute('role',role); if(live!==null) msg.setAttribute('aria-live',live); return result; })()`);
  if (importErrorCtl.ok) fails.push('IMPORT ERROR ALERT CONTROL FAILED — removed role/live stayed green: ' + JSON.stringify(importErrorCtl));
  const importTickerCtl = await evalIn(`(()=>{ const app=window.__CF_SLICE__.app;app.stop();const result=${importErrorCheck};app.start();return result;})()`);
  if (importTickerCtl.ok || importTickerCtl.tickerStarted) {
    fails.push('IMPORT VALIDATION TICKER CONTROL FAILED — stopped renderer stayed green after rejected pre-claim input: '
      + JSON.stringify(importTickerCtl));
  }
  await evalIn(`(()=>{ document.getElementById('importclose').click(); return true; })()`);
  /* FOCUS RESTORATION: closing returns focus to the opener button */
  const focusBack = await evalIn(`(()=>{ const b=document.getElementById('docksets');
    b.focus(); b.click();
    document.querySelector('#setpanel [data-pnx]').click();
    return document.activeElement && document.activeElement.id; })()`);
  if (focusBack !== 'docksets') fails.push('closing a panel did not restore focus to its opener: ' + JSON.stringify(focusBack));
  /* True empty sky closes, but only when the same target is not deliberately
     classified as owned chrome. This negative control prevents a checker
     that ignores the new boundary metadata from blessing either direction. */
  await evalIn(`(()=>{ document.getElementById('docksets').click(); return 1; })()`);
  await sleep(250);
  const shotSet = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(screenshotPath('settings'), Buffer.from(shotSet.data, 'base64'));
  const emptySky = await evalIn(`(()=>{ const hit=document.elementFromPoint(900,300),state=window.__CF_SLICE__.api.state(),
    scene=JSON.stringify({mode:state.mode,gal:state.gal,star:state.star,planet:state.planet,
      galX:state.galX,galY:state.galY,starX:state.starX,starY:state.starY});
    return {ok:hit instanceof HTMLCanvasElement&&!hit.closest('[data-panel-boundary],.panel,#importsheet'),
      x:900,y:300,tag:hit?.tagName||null,id:hit?.id||null,panelOpen:state.panelOpen,cardOpen:state.cardOpen,
      scene,prior:hit?.getAttribute?.('data-panel-boundary')??null};})()`);
  if (!emptySky.ok || emptySky.panelOpen !== 'set' || emptySky.cardOpen) {
    fails.push('TAP EMPTY SKY: fixed browser coordinate did not resolve to real unowned canvas with Settings open: '
      + JSON.stringify(emptySky));
  } else {
    let shieldReceipt = null, canvasOwned = false, canvasRestore = null;
    try {
      canvasOwned = await evalIn(`(()=>{ const hit=document.elementFromPoint(900,300);
        if(!(hit instanceof HTMLCanvasElement))return false;window.__cfPanelBoundaryCanvas=hit;
        hit.setAttribute('data-panel-boundary','');return true;})()`);
      await armDesktopPointerReceipt();
      await clickDesktopPoint(emptySky);
      shieldReceipt = await takeDesktopPointerReceipt();
    } finally {
      canvasRestore = await evalIn(`(()=>{ const hit=window.__cfPanelBoundaryCanvas,prior=${JSON.stringify(emptySky.prior)};
        if(!(hit instanceof HTMLCanvasElement)){delete window.__cfPanelBoundaryCanvas;return false;}
        if(prior===null)hit.removeAttribute('data-panel-boundary');else hit.setAttribute('data-panel-boundary',prior);
        const restored=(hit.getAttribute('data-panel-boundary')??null)===prior;
        delete window.__cfPanelBoundaryCanvas;return restored;})()`);
    }
    const shielded = await evalIn(`(()=>{ const state=window.__CF_SLICE__.api.state();return {panelOpen:state.panelOpen,
      cardOpen:state.cardOpen,scene:JSON.stringify({mode:state.mode,gal:state.gal,star:state.star,planet:state.planet,
        galX:state.galX,galY:state.galY,starX:state.starX,starY:state.starY})};})()`);
    if (!canvasOwned || !canvasRestore || shieldReceipt?.tag !== 'CANVAS' || shieldReceipt?.pointerType !== 'mouse'
      || shielded.panelOpen !== 'set' || shielded.cardOpen || shielded.scene !== emptySky.scene) {
      fails.push('TAP EMPTY SKY CONTROL FAILED — temporarily owned canvas still dismissed Settings: '
        + JSON.stringify({ emptySky, canvasOwned, canvasRestore, shieldReceipt, shielded }));
      if (shielded.panelOpen === null) await evalIn(`document.getElementById('docksets').click()`);
    }
    await armDesktopPointerReceipt();
    await clickDesktopPoint(emptySky);
    const receipt = await takeDesktopPointerReceipt();
    const tapClose = await evalIn(`(()=>{ const state=window.__CF_SLICE__.api.state();return {panelOpen:state.panelOpen,
      cardOpen:state.cardOpen,scene:JSON.stringify({mode:state.mode,gal:state.gal,star:state.star,planet:state.planet,
        galX:state.galX,galY:state.galY,starX:state.starX,starY:state.starY})};})()`);
    if (receipt?.tag !== 'CANVAS' || receipt?.pointerType !== 'mouse' || tapClose.panelOpen !== null
      || tapClose.cardOpen || tapClose.scene !== emptySky.scene) {
      fails.push('tap-empty-to-close did not close the panel from a real canvas pointer: '
        + JSON.stringify({ emptySky, receipt, tapClose }));
      if (tapClose.panelOpen !== null) await closeDesktopPanel();
    }
  }
  const shot3 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(screenshotPath('sol'), Buffer.from(shot3.data, 'base64'));
  /* Real planet ingress cannot be proven by surveyOn diagnostics alone.
     The read-only lookup identifies exact rendered geometry; CDP pointer and
     keyboard events perform both player actions. A legacy numeric selector
     and the same seed with the wrong source ordinal must identify nothing. */
  const earthGeometry = await evalIn(`(()=>{ const api=window.__CF_SLICE__.api;return {
    exact:(()=>{const target=api.planetScreenTarget(${JSON.stringify(EARTH)});return target?{
      ...target,hit:document.elementFromPoint(target.screenX,target.screenY)===window.__CF_SLICE__.app.canvas}:null;})(),
    legacy:api.planetScreenTarget(133),
    wrong:api.planetScreenTarget({seed:133,ordinal:0})};})()`);
  if (!earthGeometry.exact || earthGeometry.exact.seed !== 133 || earthGeometry.exact.ordinal !== 2
    || !(earthGeometry.exact.width > 0) || !(earthGeometry.exact.height > 0)
    || !earthGeometry.exact.hit || earthGeometry.legacy !== null || earthGeometry.wrong !== null) {
    fails.push('PLANET TARGET LOOKUP: exact rendered Earth was missing or a legacy/wrong ordinal identified a target: '
      + JSON.stringify(earthGeometry));
  }
  if (earthGeometry.exact) await clickDesktopPoint({
    x: earthGeometry.exact.screenX,
    y: earthGeometry.exact.screenY,
  });
  await sleep(250);
  const pointerEarthSurvey = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state();return {
    mode:s.mode,cardOpen:s.cardOpen,title:s.cardTitle,planet:s.planet,ordinal:s.planetOrdinal,
    share:window.__CF_SLICE__.api.cardShareCode()};})()`);
  if (pointerEarthSurvey.mode !== 'system' || !pointerEarthSurvey.cardOpen
    || pointerEarthSurvey.title !== 'Earth' || pointerEarthSurvey.planet !== null
    || pointerEarthSurvey.ordinal !== null || !/^CF1-/.test(pointerEarthSurvey.share || '')) {
    fails.push('PLANET POINTER SURVEY: real rendered Earth pointer did not open the exact pre-Land survey: '
      + JSON.stringify(pointerEarthSurvey));
  }
  if (pointerEarthSurvey.cardOpen) await keyIn('Escape', 'Escape');
  if (await evalIn(`window.__CF_SLICE__.api.state().keyboardTarget!==null`)) await keyIn('Escape', 'Escape');
  await evalIn(`window.__CF_SLICE__.app.canvas.focus()`);
  await keyIn('ArrowRight', 'ArrowRight');
  const keyboardEarthTarget = await evalIn(`window.__CF_SLICE__.api.state().keyboardTarget`);
  if (keyboardEarthTarget !== 'planet:424242:133:2' || /:133:0$/.test(keyboardEarthTarget || '')) {
    fails.push('PLANET KEYBOARD TARGET: first exact system target was not Earth ordinal 2: '
      + JSON.stringify(keyboardEarthTarget));
  }
  await keyIn('Enter', 'Enter');
  const surveyed = await evalIn(`(()=>{ const S=window.__CF_SLICE__;
    const card=document.getElementById('survey');
    const rows=[...card.querySelectorAll('[data-row]')].map(r=>r.getAttribute('data-row'));
    const title=(card.querySelector('[data-sel=title]')||{}).textContent;
    return { ok:S.api.state().cardOpen, visible:card.style.display!=='none', title, rows, n:rows.length,
      keyboardTarget:S.api.state().keyboardTarget, focus:document.activeElement===card.querySelector('[data-act="landcta"]'),
      starCode:S.api.encodeHere(), planetCode:S.api.cardShareCode() }; })()`);
  if (!surveyed.ok || !surveyed.visible || surveyed.keyboardTarget !== null || !surveyed.focus) {
    fails.push('PLANET KEYBOARD SURVEY: real Enter did not open Earth and focus its explicit Land action: '
      + JSON.stringify(surveyed));
  }
  else {
    if (surveyed.title !== 'Earth') fails.push('landed planet 2 of Sol but the card says: ' + JSON.stringify(surveyed.title));
    for (const want of ['Life', 'Civilization']) {
      if (!surveyed.rows.includes(want)) fails.push('survey card missing the "' + want + '" row (rows: ' + surveyed.rows.join(', ') + ')');
    }
    /* Player presentation only: descriptor/parity science may retain its
       deterministic spectral vocabulary internally, but a planet card must
       neither expose that legacy row nor disclose Rarity before landfall. */
    if (surveyed.rows.includes('Spectral class') || surveyed.rows.includes('Rarity')) {
      fails.push('pre-land planet survey exposed internal spectral science or premature Rarity: ' + JSON.stringify(surveyed.rows));
    }
    if (!/^CF1-/.test(surveyed.planetCode || '') || surveyed.planetCode === surveyed.starCode) {
      fails.push('pre-landing planet Share did not bind a distinct planet address: ' + JSON.stringify([surveyed.starCode, surveyed.planetCode]));
    }
  }
  const surveyCloseCheck = `(()=>{ const card=document.getElementById('survey'),closes=card?[...card.querySelectorAll('[data-survey-close]')]:[],
    close=closes[0]||null,foreign=card?[...card.querySelectorAll('[data-pnx]')]:[],c=card?.getBoundingClientRect(),r=close?.getBoundingClientRect(),
    style=close?getComputedStyle(close):null,hit=r?document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2):null;
    const visible=!!r&&r.width>=44&&r.height>=44&&style?.display!=='none'&&style?.visibility!=='hidden';
    const inside=!!c&&!!r&&r.left>=c.left-1&&r.top>=c.top-1&&r.right<=c.right+1&&r.bottom<=c.bottom+1;
    const rightGap=c&&r?c.right-r.right:null,scrollbarGutter=card?Math.max(0,card.offsetWidth-card.clientWidth):0,
      contentRightGap=rightGap===null?null:rightGap-scrollbarGutter,topGap=c&&r?r.top-c.top:null;
    const topRight=inside&&contentRightGap>=-1&&contentRightGap<=20&&topGap>=-1&&topGap<=20;
    const owned=!!close&&!!hit&&(hit===close||close.contains(hit));
    return {ok:!!card&&closes.length===1&&foreign.length===0&&visible&&topRight&&owned,count:closes.length,
      foreignCount:foreign.length,visible,inside,topRight,owned,rightGap,scrollbarGutter,contentRightGap,topGap,
      centre:r?{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2}:null,hit:hit?.hasAttribute?.('data-survey-close')?'survey-close':hit?.tagName||null}; })()`;
  const surveyClose = await evalIn(surveyCloseCheck);
  if (!surveyClose.ok) {
    fails.push('SURVEY CLOSE: Earth card does not own exactly one reachable top-right close: ' + JSON.stringify(surveyClose));
  }
  /* Recreate the reported legacy failure, including its detached upper-left
     generic X. The same predicate must reject both a second close system and
     a sole survey close moved out of its card corner. */
  const duplicateSurveyCloseCtl = await evalIn(`(()=>{ const card=document.getElementById('survey'),extra=document.createElement('button');
    extra.dataset.pnx='legacy-survey';extra.className='surface-close panel-close';extra.textContent='✕';
    extra.style.cssText='position:fixed;left:0;top:0;right:auto;bottom:auto';card.appendChild(extra);
    const result=${surveyCloseCheck};extra.remove();return result;})()`);
  if (duplicateSurveyCloseCtl.ok || duplicateSurveyCloseCtl.foreignCount !== 1) {
    fails.push('SURVEY CLOSE CONTROL FAILED — injected generic duplicate/upper-left X stayed green: '
      + JSON.stringify(duplicateSurveyCloseCtl));
  }
  const misplacedSurveyCloseCtl = await evalIn(`(()=>{ const close=document.querySelector('#survey [data-survey-close]'),prior=close?.getAttribute('style');
    if(close){close.style.setProperty('position','fixed','important');close.style.setProperty('left','0','important');
      close.style.setProperty('top','0','important');close.style.setProperty('right','auto','important');close.style.setProperty('margin','0','important');}
    const result=${surveyCloseCheck};if(close){if(prior===null)close.removeAttribute('style');else close.setAttribute('style',prior);}return result;})()`);
  if (misplacedSurveyCloseCtl.ok || misplacedSurveyCloseCtl.topRight) {
    fails.push('SURVEY CLOSE CONTROL FAILED — injected upper-left survey close stayed green: '
      + JSON.stringify(misplacedSurveyCloseCtl));
  }
  if (surveyClose.ok && surveyClose.centre) {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: surveyClose.centre.x, y: surveyClose.centre.y, button: 'left', clickCount: 1 }, sess);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: surveyClose.centre.x, y: surveyClose.centre.y, button: 'left', clickCount: 1 }, sess);
    await sleep(80);
    const closed = await evalIn(`({closed:!window.__CF_SLICE__.api.state().cardOpen,canvasFocused:document.activeElement===document.querySelector('canvas')})`);
    if (!closed.closed || !closed.canvasFocused) fails.push('SURVEY CLOSE: real pointer press did not close the card and restore its canvas opener: ' + JSON.stringify(closed));
    await evalIn(`document.getElementById('docksurvey')?.click()`);
    await waitDesktopValue('Earth survey reopened from dock after close outcome', `window.__CF_SLICE__.api.state().cardOpen`);
    await evalIn(`document.querySelector('#survey [data-survey-close]')?.click()`);
    const dockRestore = await evalIn(`({closed:!window.__CF_SLICE__.api.state().cardOpen,dockFocused:document.activeElement===document.getElementById('docksurvey')})`);
    if (!dockRestore.closed || !dockRestore.dockFocused) fails.push('SURVEY CLOSE: dock reopen did not return focus to the Survey opener: ' + JSON.stringify(dockRestore));
    await evalIn(`document.getElementById('docksurvey')?.click()`);
    await waitDesktopValue('Earth survey reopened from dock after focus outcome', `window.__CF_SLICE__.api.state().cardOpen`);
  }
  const planetShareCode = surveyed.planetCode;
  /* Share feedback is an outcome, not a swallowed Clipboard promise. Denial
     must select the exact code in Search and say so; success may claim Copy. */
  const deniedCopy = await evalIn(`(async()=>{ const nav=navigator,search=document.getElementById('searchbox');
    Object.defineProperty(nav,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('denied'))}});
    document.querySelector('#survey [data-act="share"]')?.click(); await new Promise(r=>setTimeout(r,30));
    const s=window.__CF_SLICE__.api.state(); const out={toast:s.toastText,value:search.value,active:document.activeElement===search,selected:search.selectionStart===0&&search.selectionEnd===search.value.length};
    delete nav.clipboard; search.blur(); search.value=''; return out; })()`);
  if (!/Copy unavailable/.test(deniedCopy.toast) || deniedCopy.value !== planetShareCode || !deniedCopy.active || !deniedCopy.selected) {
    fails.push('CLIPBOARD DENIAL falsely claimed success or failed to expose the exact code: ' + JSON.stringify(deniedCopy));
  }
  const acceptedCopy = await evalIn(`(async()=>{ let copied=''; Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(v)=>{copied=String(v);return Promise.resolve();}}});
    document.querySelector('#survey [data-act="share"]')?.click(); await new Promise(r=>setTimeout(r,30));
    const toast=window.__CF_SLICE__.api.state().toastText; delete navigator.clipboard; return {copied,toast}; })()`);
  if (acceptedCopy.copied !== planetShareCode || !/Share code copied/.test(acceptedCopy.toast)) {
    fails.push('CLIPBOARD success did not copy the exact card address: ' + JSON.stringify(acceptedCopy));
  }
  /* Same numeric seed is not a complete star identity. The hostile diagnostic
     descent itself must now be rejected, keep the rendered galaxy receipt
     unchanged, and leave the invalidated Earth card unable to reopen/share/
     chart/land. Then the exact source-generated Sol route must still work. */
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, sess);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, sess);
  await waitDesktopValue('stale-card setup ascent', `window.__CF_SLICE__.api.state().mode==='galaxy'`);
  const hostileDescent = await evalIn(`(()=>{ const S=window.__CF_SLICE__,before=S.api.state();
    const accepted=S.api.descendSystem({seed:424242,x:9999,y:9999}),after=S.api.state();
    return {accepted,before,after}; })()`);
  if (hostileDescent.accepted || hostileDescent.after.mode !== 'galaxy'
    || hostileDescent.after.star !== null
    || JSON.stringify(hostileDescent.after.renderedScene) !== JSON.stringify(hostileDescent.before.renderedScene)) {
    fails.push('HOSTILE DIAGNOSTIC DESCENT: forged Sol coordinates changed navigation/render ownership: '
      + JSON.stringify(hostileDescent));
  }
  requireRenderedSceneMatch('HOSTILE DIAGNOSTIC DESCENT REJECTION', hostileDescent.after);
  const staleCardBlocked = await evalIn(`(()=>{ const S=window.__CF_SLICE__;
    const atlasBefore=S.api.state().atlasCount; document.getElementById('docksurvey').click();
    const share=S.api.cardShareCode(); document.querySelector('#survey [data-act="add"]')?.click(); S.api.landHere();
    const s=S.api.state(); return {mode:s.mode,cardOpen:s.cardOpen,share,landed:s.save.landed.slice(),
      atlasBefore,atlasAfter:s.atlasCount,starX:s.starX,starY:s.starY}; })()`);
  if (staleCardBlocked.mode !== 'galaxy' || staleCardBlocked.cardOpen || staleCardBlocked.share !== null
    || staleCardBlocked.atlasAfter !== staleCardBlocked.atlasBefore || staleCardBlocked.landed.includes(133)
    || staleCardBlocked.starX !== null || staleCardBlocked.starY !== null) {
    fails.push('STALE CARD IDENTITY: rejected forged descent let the old Earth card act: ' + JSON.stringify(staleCardBlocked));
  }
  await evalIn(`window.__CF_SLICE__.api.descendSystem(${JSON.stringify(SOL_STAR)})`);
  const canonicalSolAfterHostile = await waitDesktopValue('stale-card return to real Sol', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return s.mode==='system'&&s.starX===560&&s.starY===170?s:null; })()`);
  requireRenderedSceneAdvance('HOSTILE DESCENT RECOVERY TO CANONICAL SOL', hostileDescent.after, canonicalSolAfterHostile);
  await evalIn(`window.__CF_SLICE__.api.__smokePersistNow()`);
  /* The diagnostics wrapper is an ingress boundary too. Neither the legacy
     seed-only selector nor a right seed with the wrong source ordinal may
     open a card, land, bank progression, repaint, or write storage. */
  for (const [ordinalRejection, selectorSource] of [
    ['legacy-number', '133'],
    ['wrong-ordinal', '{seed:133,ordinal:0}'],
  ]) {
    const ordinalBefore = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state();return {
      mode:s.mode,gal:s.gal,star:s.star,planet:s.planet,planetOrdinal:s.planetOrdinal,
      cardOpen:s.cardOpen,cardTitle:s.cardTitle,panel:s.panelOpen,atlas:s.atlasCount,
      objective:s.objective,navGalaxyKey:s.navGalaxyKey,navStarKey:s.navStarKey,navWorldKey:s.navWorldKey,
      renderedScene:s.renderedScene,save:s.save};})()`);
    const ordinalRawBefore = await evalIn(READ_PRIMARY_EXPRESSION);
    const ordinalCalls = await evalIn(`(()=>{ const api=window.__CF_SLICE__.api;return {
      surveyed:api.surveyOn(${selectorSource}),landed:api.landOn(${selectorSource})};})()`);
    const ordinalAfter = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state();return {
      mode:s.mode,gal:s.gal,star:s.star,planet:s.planet,planetOrdinal:s.planetOrdinal,
      cardOpen:s.cardOpen,cardTitle:s.cardTitle,panel:s.panelOpen,atlas:s.atlasCount,
      objective:s.objective,navGalaxyKey:s.navGalaxyKey,navStarKey:s.navStarKey,navWorldKey:s.navWorldKey,
      renderedScene:s.renderedScene,save:s.save};})()`);
    const ordinalRawAfter = await evalIn(READ_PRIMARY_EXPRESSION);
    if (ordinalCalls.surveyed || ordinalCalls.landed
      || JSON.stringify(ordinalAfter) !== JSON.stringify(ordinalBefore)
      || ordinalRawAfter !== ordinalRawBefore) {
      fails.push('PLANET ORDINAL REJECTION (' + ordinalRejection + '): diagnostics changed card/navigation/Land/Charter/ledger/render/storage: '
        + JSON.stringify({ ordinalCalls, before: ordinalBefore, after: ordinalAfter,
          rawStable: ordinalRawAfter === ordinalRawBefore }));
    }
    requireRenderedSceneMatch('PLANET ORDINAL REJECTION (' + ordinalRejection + ')', ordinalAfter);
  }
  const restoredEarthCard = await evalIn(`(()=>{ const S=window.__CF_SLICE__;
    const accepted=S.api.surveyOn(${JSON.stringify(EARTH)}); return {...S.api.state(),accepted}; })()`);
  if (!restoredEarthCard.accepted || !restoredEarthCard.cardOpen || restoredEarthCard.cardTitle !== 'Earth') {
    fails.push('STALE CARD IDENTITY: real Earth card did not recover after rejected forged context: ' + JSON.stringify(restoredEarthCard));
  }
  const exactOrdinalLand = await evalIn(`window.__CF_SLICE__.api.landOn(${JSON.stringify(EARTH)})`);
  if (!exactOrdinalLand) fails.push('PLANET ORDINAL ACCEPTANCE: exact Earth {seed,ordinal} did not survey and Land');
  await sleep(300);
  const landedSurvey = await evalIn(`(()=>{ const S=window.__CF_SLICE__,card=document.getElementById('survey'),
    rarity=[...card.querySelectorAll('[data-row="Rarity"]')],spectral=card.querySelectorAll('[data-row="Spectral class"]');
    return {mode:S.api.state().mode,landed:S.api.state().save.landed.includes(133),rarityCount:rarity.length,
      spectralCount:spectral.length,label:(rarity[0]?.querySelector('span')?.textContent||'').trim(),
      value:(rarity[0]?.textContent||'').replace(/^\\s*Rarity\\s*/,'').trim()};})()`);
  if (landedSurvey.mode !== 'surface' || !landedSurvey.landed || landedSurvey.rarityCount !== 1
    || landedSurvey.spectralCount !== 0 || landedSurvey.label !== 'Rarity' || !landedSurvey.value) {
    fails.push('LANDED PLANET SURVEY: Earth did not disclose exactly one plain Rarity row after landfall: '
      + JSON.stringify(landedSurvey));
  }
  /* THE LIVING PLANETSIDE: Earth's ground survey shows its real roster,
     each specimen wearing an hdart portrait */
  const side = await evalIn(`(()=>{ const el=document.getElementById('planetside');
    if(!el || el.style.display==='none') return { on:false };
    const sp=[...el.querySelectorAll('[data-sel=planetside-sp]')];
    const imgs=sp.filter(x=>x.querySelector('img') && String(x.querySelector('img').src||'').length>2000).length;
    return { on:true, n:sp.length, imgs }; })()`);
  if (!side.on || !(side.n >= 3)) fails.push('the planetside strip did not show Earth’s roster: ' + JSON.stringify(side));
  else if (!(side.imgs >= 3)) fails.push('planetside portraits did not paint: ' + JSON.stringify(side));
  const stSurf = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (stSurf.mode !== 'surface') fails.push('landing did not reach surface mode: ' + stSurf.mode);
  if (!/Earth/.test(stSurf.trail)) fails.push('surface trail missing Earth: ' + JSON.stringify(stSurf.trail));
  if (!stSurf.objective.includes('1 / 2')) fails.push('objective chip did not bank the Sol landfall (want 1 / 2): ' + JSON.stringify(stSurf.objective));
  requireRenderedSceneAdvance('GENERATED EARTH ROUTE', restoredEarthCard, stSurf);
  const renderedReceiptCtl = {
    ...stSurf,
    navWorldKey: `${String(stSurf.navWorldKey)}|injected-mismatch`,
  };
  if (renderedSceneMatchesNav(renderedReceiptCtl)) {
    fails.push('RENDERED-SCENE RECEIPT CONTROL FAILED — an injected world-key mismatch stayed green');
  }
  const surfaceNullKeyCtl = {
    ...stSurf,
    navGalaxyKey: null,
    navStarKey: null,
    navWorldKey: null,
    renderedScene: { ...stSurf.renderedScene, galaxyKey: null, starKey: null, worldKey: null },
  };
  if (renderedSceneMatchesNav(surfaceNullKeyCtl)) {
    fails.push('RENDERED-SCENE KEY-INVENTORY CONTROL FAILED — surface accepted agreeing null provenance keys');
  }
  await sleep(900);
  const shot4 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(screenshotPath('earth'), Buffer.from(shot4.data, 'base64'));

  /* 4. reload: the REAL SAVE survives (importSaveV2 ⇄ exportSaveV2 through
     IndexedDB — not a side JSON). The view must come back AND the landing
     must be in the save's `land` set. */
  await navigateToSlice(sess, URL0, 'desktop persistence reload');
  await sleep(2500);
  const st3 = await evalIn(`window.__CF_SLICE__.api.state()`);
  /* we landed on Earth before reloading — the SURFACE view must come back */
  if (st3.mode !== 'surface' || st3.gal !== 999 || st3.star !== 424242) fails.push('RELOAD lost the view — IndexedDB persistence failed: ' + JSON.stringify([st3.mode, st3.gal, st3.star]));
  requireRenderedSceneMatch('SAVED EARTH RELOAD', st3);
  const saved = await evalIn(`window.__CF_SLICE__.api.state().save`);
  if (!saved) fails.push('api.state().save missing');
  else {
    if (saved.viewType !== 'planet') fails.push('restored savedView.type is not "planet": ' + JSON.stringify(saved.viewType));
    if (!Array.isArray(saved.landed) || !saved.landed.includes(133)) fails.push('Earth (133) not in the save’s landed set after reload: ' + JSON.stringify(saved.landed));
    if (typeof saved.essence !== 'number') fails.push('save.essence is not a number — importSaveV2 did not run');
  }
  /* Negative control for a syntactically-valid truncated primary. The
     importer can harden `{}` into defaults for a fresh in-memory state, but
     boot must classify it as corrupt stored evidence and recover the proven
     backup instead of promoting/writing the truncation over both copies. */
  await evalIn(`new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice');
    q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readwrite');
      tx.objectStore('meta').put('{}','save'); tx.oncomplete=()=>{db.close();resolve(true)}; tx.onerror=()=>reject(tx.error); }; })`);
  await navigateToSlice(sess, URL0, 'desktop sparse-primary recovery');
  await sleep(2500);
  const recoveredSparse = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (recoveredSparse.mode !== 'surface' || !recoveredSparse.save.landed.includes(133)) {
    fails.push('sparse JSON primary was promoted instead of recovering the proven backup: ' + JSON.stringify(recoveredSparse));
  }
  const restoredPrimary = await evalIn(`new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice');
    q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readonly'),g=tx.objectStore('meta').get('save');
      g.onsuccess=()=>{db.close();resolve(String(g.result||''))}; g.onerror=()=>reject(g.error); }; })`);
  if (restoredPrimary === '{}') fails.push('sparse JSON primary remained authoritative after recovery');
  /* The version marker does not make a truncated lookalike complete. This
     exact shape was once blessed by a unit fixture despite no real exporter
     ever writing it; boot must recover the same proven veteran backup. */
  await evalIn(`new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice');
    q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readwrite');
      tx.objectStore('meta').put(${JSON.stringify(SPARSE_V4_RAW)},'save'); tx.oncomplete=()=>{db.close();resolve(true)}; tx.onerror=()=>reject(tx.error); }; })`);
  await navigateToSlice(sess, URL0, 'desktop sparse-v4 primary recovery');
  await sleep(2500);
  const recoveredSparseV4 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (recoveredSparseV4.mode !== 'surface' || !recoveredSparseV4.save.landed.includes(133)) {
    fails.push('sparse v4 lookalike was promoted instead of recovering the proven backup: ' + JSON.stringify(recoveredSparseV4));
  }
  const restoredSparseV4Primary = await evalIn(`new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice');
    q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readonly'),g=tx.objectStore('meta').get('save');
      g.onsuccess=()=>{db.close();resolve(String(g.result||''))}; g.onerror=()=>reject(g.error); }; })`);
  if (restoredSparseV4Primary === SPARSE_V4_RAW) fails.push('sparse v4 lookalike remained authoritative after recovery');
  await evalIn(`new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice');
    q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readwrite');
      tx.objectStore('meta').put(${JSON.stringify(PARTIAL_V4_RAW)},'save'); tx.oncomplete=()=>{db.close();resolve(true)}; tx.onerror=()=>reject(tx.error); }; })`);
  await navigateToSlice(sess, URL0, 'desktop plausible-partial-v4 recovery');
  await sleep(2500);
  const recoveredPartialV4 = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (recoveredPartialV4.mode !== 'surface' || !recoveredPartialV4.save.landed.includes(133)) {
    fails.push('plausible partial v4 was promoted instead of recovering the proven backup: ' + JSON.stringify(recoveredPartialV4));
  }
  await evalIn(`new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice');
    q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readwrite');
      tx.objectStore('meta').put(${JSON.stringify(ONE_BAD_FIELD_V4_RAW)},'save'); tx.oncomplete=()=>{db.close();resolve(true)}; tx.onerror=()=>reject(tx.error); }; })`);
  await navigateToSlice(sess, URL0, 'desktop complete-v4 one-bad-field boot');
  await sleep(2500);
  const oneBadFieldBoot = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (oneBadFieldBoot.save.name !== 'Current Field Repair' || oneBadFieldBoot.save.essence !== 4321 || oneBadFieldBoot.mode !== 'surface') {
    fails.push('ONE BAD FIELD: complete current v4 rolled back instead of retaining progress and sanitizing one field: ' + JSON.stringify(oneBadFieldBoot));
  }

  /* 4a-search. THE SHARE-CODE ROUND TRIP: encode Earth's surface, climb to
     the universe, paste the code in the search bar → travel straight back
     (decodeWhere → the sanitized view → the same charter gates). */
  const shareCode = planetShareCode;
  if (!shareCode || !/^CF1-/.test(shareCode)) fails.push('survey Share did not produce a CF1 planet code: ' + JSON.stringify(shareCode));
  /* Deliberately forge a display-only raw tuple on a valid Earth identity.
     The accepted route must restore source size 78 and re-share 78, never 3999. */
  const namedShareCode = shareCode ? withCodeName(withCodeGalaxySize(shareCode, 3999), 'Blue Earth') : shareCode;
  const validGalaxyShareCode = shareCode ? asGalaxyCode(withCodeGalaxySize(shareCode, 3999)) : shareCode;
  const validStarShareCode = shareCode ? asStarCode(shareCode) : shareCode;
  /* A real generated galaxy, not an impossible 1e7 tuple, distinguishes a
     saved Prime-radius block from strict source rejection. */
  const blockedShareCode = shareCode ? asGalaxyCode(shareCode, OUTER_REACH_GALAXY) : shareCode;
  const invalidPlanetShareCode = shareCode ? withCodePlanetSeed(shareCode, 4294967295) : shareCode;
  /* These two tiers were still routed through tolerant decodeWhere before
     F2. Keep the real seed but spoof one source coordinate so only exact
     galaxy/star regeneration can reject the otherwise plausible address. */
  const forgedGalaxyShareCode = shareCode
    ? withCodeGalaxyPosition(asGalaxyCode(shareCode), 90.01, -60) : shareCode;
  const forgedStarShareCode = shareCode
    ? withCodeStarPosition(asStarCode(shareCode), 560.01, 170) : shareCode;
  /* Same staged reach and the real Sol/Earth members, but a parent galaxy
     coordinate that legacy membership-only handling would have accepted. */
  const forgedPlanetShareCode = shareCode
    ? withCodeName(withCodeGalaxyPosition(shareCode, 90.01, -60), 'Forged Sol Earth') : shareCode;
  /* Repeat planetfall must be navigable without paying chapter progression
     twice. This rich fixture already completed the live landfall boundary,
     so compare the exact objective before/after instead of assuming the
     fresh-save chapter-1 "1 / 2" string. */
  const repeatObjectiveBefore = await evalIn(`window.__CF_SLICE__.api.state().objective`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);
  await sleep(500);
  await evalIn(`window.__CF_SLICE__.api.landOn(${JSON.stringify(EARTH)})`);
  await sleep(500);
  const repeatLand = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (repeatLand.objective !== repeatObjectiveBefore) fails.push('repeat Earth landing changed chapter progression: '
    + JSON.stringify({ before: repeatObjectiveBefore, after: repeatLand.objective }));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, sess);
  await sleep(350);
  await evalIn(`window.__CF_SLICE__.api.landOn(${JSON.stringify(MERCURY)})`);
  await sleep(450);
  const liveGoalBoundaryCheck = `(()=>{ const s=window.__CF_SLICE__.api.state();return {ok:s.mode==='surface'
    &&/next Charter action is not available in this development slice/i.test(s.objective)&&!/mine|fabricat|shipyard|\\bbuild\\b/i.test(s.objective),
    mode:s.mode,objective:s.objective,landed:s.save.landed};})()`;
  const liveGoalBoundary = await evalIn(liveGoalBoundaryCheck);
  if (!liveGoalBoundary.ok || liveGoalBoundary.landed.length < 2) {
    fails.push('OBJECTIVE LIVE BOUNDARY: two real Sol landfalls exposed an unported actionable goal: ' + JSON.stringify(liveGoalBoundary));
  }
  const liveGoalCtl = await evalIn(`(()=>{ const chip=document.getElementById('objchip'),prior=chip.innerHTML;chip.textContent='Mine Sol’s dead worlds 8 times · 0 / 8';
    const result=${liveGoalBoundaryCheck};chip.innerHTML=prior;return result;})()`);
  if (liveGoalCtl.ok) fails.push('OBJECTIVE LIVE BOUNDARY CONTROL FAILED — injected mining directive stayed green: ' + JSON.stringify(liveGoalCtl));
  /* Escape consumes any open surface card while lifting in the same action;
     from outer modes it closes a card before the next press climbs. Drive the
     actual focus law to its outcome rather than assuming card state away. */
  for (let i = 0; i < 5; i++) {
    if (await evalIn(`window.__CF_SLICE__.api.state().mode`) === 'universe') break;
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);
    await sleep(500);
  }
  const preJump = await evalIn(`window.__CF_SLICE__.api.state().mode`);
  if (preJump !== 'universe') fails.push('Escape ladder did not reach the universe before the code jump: ' + preJump);
  const stalePlanetCard = await evalIn(`(()=>{ document.getElementById('docksurvey').click();
    const S=window.__CF_SLICE__, st=S.api.state();
    return { open:st.cardOpen, code:S.api.cardShareCode(), share:!!document.querySelector('#survey [data-act=share]') }; })()`);
  if (stalePlanetCard.open || stalePlanetCard.code !== null || stalePlanetCard.share) {
    fails.push('stale planet card survived outside its system/share context: ' + JSON.stringify(stalePlanetCard));
  }
  /* THE CMB BAND-PICK, while we're at the universe: zoom out to the orange
     ring and tap ON it — the origin card must speak; a tap far INSIDE the
     ring must NOT (the band, not the box) */
  await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.camT.x=0; S.camT.y=0; S.cam.x=0; S.cam.y=0;
    S.camT.z=0.07; S.cam.z=0.07; return 1; })()`);
  await sleep(600);
  const ringX = 1280 / 2 + Math.round(5200 * 0.07), ringY = 800 / 2;
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: 640, y: 400, button: 'left', clickCount: 1 }, sess);
  await sleep(300);
  const inRing = await evalIn(`window.__CF_SLICE__.api.state().cardTitle`);
  if (inRing === 'The Observable Universe') fails.push('a tap far INSIDE the ring opened the CMB card (band-pick became box-pick)');
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: ringX, y: ringY, button: 'left', clickCount: 1 }, sess);
  await sleep(400);
  const cmb = await evalIn(`window.__CF_SLICE__.api.state().cardTitle`);
  if (cmb !== 'The Observable Universe') fails.push('the CMB band tap did not open the origin card: ' + JSON.stringify(cmb));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, sess);   /* close the card (Escape order) */
  await sleep(200);
  /* A real Enter on a non-code zero-result query stays put, opens the
     Compendium's honest empty continuation, and focuses its live close action. */
  const zeroResultQuery = 'zzzz-no-species-can-match-this';
  await evalIn(`(()=>{ const s=document.getElementById('searchbox'); s.value=${JSON.stringify(zeroResultQuery)}; s.focus(); return true; })()`);
  await keyIn('Enter', 'Enter');
  const zeroResultSearchCheck = `(()=>{ const st=window.__CF_SLICE__.api.state(),s=document.getElementById('searchbox');
    const panel=document.getElementById('codexpanel'),close=panel?.querySelector('[data-pnx]'),empty=panel?.querySelector('.empty');
    return {ok:st.mode===${JSON.stringify(preJump)}&&st.panelOpen==='codex'&&!panel?.querySelector('[data-ci]')
        &&/Nothing matches/.test(empty?.textContent||'')&&document.activeElement===close&&s.value===${JSON.stringify(zeroResultQuery)},
      mode:st.mode,panel:st.panelOpen,rows:panel?.querySelectorAll('[data-ci]').length??-1,empty:empty?.textContent||'',
      focusClose:document.activeElement===close,query:s.value}; })()`;
  const zeroResultSearch = await evalIn(zeroResultSearchCheck);
  if (!zeroResultSearch.ok) {
    fails.push('SEARCH ZERO RESULT: non-code Enter moved the camera or missed the focused empty continuation: ' + JSON.stringify(zeroResultSearch));
  }
  const zeroResultFocusCtl = await evalIn(`(()=>{ const close=document.querySelector('#codexpanel [data-pnx]');
    document.getElementById('searchbox').focus(); const result=${zeroResultSearchCheck}; close?.focus(); return result; })()`);
  if (zeroResultFocusCtl.ok) {
    fails.push('SEARCH ZERO-RESULT CONTROL FAILED — removed close focus stayed green: ' + JSON.stringify(zeroResultFocusCtl));
  }
  await evalIn(`(()=>{ document.querySelector('#codexpanel [data-pnx]')?.click(); return true; })()`);   /* the ✕, so a route owns Search */

  /* All rejected CF1 routes are correction outcomes: exact galaxy-only and
     star-only source forgeries (the former tolerant SCN-3 ingress), an absent
     planet, a same-reach forged planet parent, raw fractional identity that
     legacy decode would coerce into Earth, an oversized CF1 before base64
     work, and a genuine galaxy beyond saved Prime reach. Real Enter retains
     exact query/Search focus without navigation, card, render receipt,
     landing, Atlas, custom-name, persisted-view, Charter, reward-ledger,
     raw-IDB, or Compendium-filter side effects. */
  for (const [rejection, rejectedCode] of [
    ['forged-galaxy-only', forgedGalaxyShareCode],
    ['forged-star-only', forgedStarShareCode],
    ['invalid-planet', invalidPlanetShareCode],
    ['forged-parent', forgedPlanetShareCode],
    ['coerced-planet', COERCED_EARTH_PLANET_CODE],
    ['oversized-cf1', OVERSIZED_CF1_CODE],
    ['blocked-prime-reach', blockedShareCode],
  ]) {
    const beforeRejected = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state();return {
      mode:s.mode,gal:s.gal,galX:s.galX,galY:s.galY,galSize:s.galSize,star:s.star,starX:s.starX,starY:s.starY,
      planet:s.planet,planetOrdinal:s.planetOrdinal,cardOpen:s.cardOpen,cardTitle:s.cardTitle,
      navGalaxyKey:s.navGalaxyKey,navStarKey:s.navStarKey,navWorldKey:s.navWorldKey,renderedScene:s.renderedScene,
      atlas:s.atlasCount,codex:s.codexCount,objective:s.objective,save:s.save};})()`);
    const beforeRejectedRaw = await evalIn(READ_PRIMARY_EXPRESSION);
    await evalIn(`(()=>{ const s=document.getElementById('searchbox'); s.value=${JSON.stringify(String(rejectedCode))}; s.focus(); return true; })()`);
    await keyIn('Enter', 'Enter');
    const expectedRejected = JSON.stringify(beforeRejected);
    const expectedRejectedLiteral = JSON.stringify(expectedRejected);
    const rejectedSearchCheck = `(()=>{ const st=window.__CF_SLICE__.api.state(),s=document.getElementById('searchbox');
      return {ok:st.mode===${JSON.stringify(preJump)}&&st.panelOpen===null&&s.value===${JSON.stringify(String(rejectedCode))}
          &&document.activeElement===s&&JSON.stringify({mode:st.mode,gal:st.gal,galX:st.galX,galY:st.galY,galSize:st.galSize,star:st.star,starX:st.starX,starY:st.starY,
            planet:st.planet,planetOrdinal:st.planetOrdinal,cardOpen:st.cardOpen,cardTitle:st.cardTitle,
            navGalaxyKey:st.navGalaxyKey,navStarKey:st.navStarKey,navWorldKey:st.navWorldKey,renderedScene:st.renderedScene,
            atlas:st.atlasCount,codex:st.codexCount,objective:st.objective,save:st.save})===${expectedRejectedLiteral},
        mode:st.mode,panel:st.panelOpen,query:s.value,focus:document.activeElement===s,
        after:{mode:st.mode,gal:st.gal,galX:st.galX,galY:st.galY,galSize:st.galSize,star:st.star,starX:st.starX,starY:st.starY,
          planet:st.planet,planetOrdinal:st.planetOrdinal,cardOpen:st.cardOpen,cardTitle:st.cardTitle,
          navGalaxyKey:st.navGalaxyKey,navStarKey:st.navStarKey,navWorldKey:st.navWorldKey,renderedScene:st.renderedScene,
          atlas:st.atlasCount,codex:st.codexCount,objective:st.objective,save:st.save}}; })()`;
    const rejectedSearch = await evalIn(rejectedSearchCheck);
    const afterRejectedRaw = await evalIn(READ_PRIMARY_EXPRESSION);
    if (!rejectedSearch.ok) {
      fails.push('SEARCH REJECTED CF1 (' + rejection + '): address did not retain exact Search focus/query: ' + JSON.stringify(rejectedSearch));
    }
    requireRenderedSceneMatch('SEARCH REJECTED CF1 (' + rejection + ')', rejectedSearch.after);
    if (afterRejectedRaw !== beforeRejectedRaw) {
      fails.push('SEARCH REJECTED CF1 (' + rejection + '): rejected address changed exact IndexedDB bytes');
    }
    const rejectedFocusCtl = await evalIn(`(()=>{ const s=document.getElementById('searchbox'),other=document.getElementById('dockguide');
      other?.focus(); const result=${rejectedSearchCheck}; s.focus(); return result; })()`);
    if (rejectedFocusCtl.ok) {
      fails.push('SEARCH REJECTED-CF1 CONTROL FAILED (' + rejection + ') — removed Search focus stayed green: '
        + JSON.stringify(rejectedFocusCtl));
    }
    /* Recreate the old tolerant tier outcome without mutating real nav: make
       the audit surface report the spoofed accepted destination while exact
       query/focus remain correction-shaped. The same predicate must turn red
       on the navigation/render snapshot, independently of its focus clause. */
    if (rejection === 'forged-galaxy-only' || rejection === 'forged-star-only') {
      const oldTolerantCtl = await evalIn(`(()=>{ const S=window.__CF_SLICE__,original=S.api.state,live=original();
        const accepted=${rejection === 'forged-galaxy-only'
          ? `{...live,mode:'galaxy',gal:999,galX:90.01,galY:-60,star:null,starX:null,starY:null}`
          : `{...live,mode:'system',gal:999,galX:90,galY:-60,star:424242,starX:560.01,starY:170}`};
        S.api.state=()=>accepted;let result;try{result=${rejectedSearchCheck};}finally{S.api.state=original;}return result;})()`);
      if (oldTolerantCtl.ok) {
        fails.push('SEARCH ' + rejection.toUpperCase() + ' CONTROL FAILED — simulated tolerant accepted ingress stayed green: '
          + JSON.stringify(oldTolerantCtl));
      }
    }
    /* The forged-parent assertion must see the full forbidden effect family,
       not merely generic rejected-route behavior. Poison Atlas, Land, custom
       name, Charter, and reward state; the same predicate must reject it. */
    if (rejection === 'forged-parent') {
      const poisoned = JSON.parse(JSON.stringify(beforeRejected));
      poisoned.atlas += 1;
      poisoned.save.landed.push(133);
      poisoned.save.customNames.push(['p133', 'Forged Sol Earth']);
      poisoned.save.ascCh += 1;
      poisoned.save.essence += 1;
      poisoned.save.stats.landfalls = (poisoned.save.stats.landfalls || 0) + 1;
      const poisonedExpected = JSON.stringify(poisoned);
      const forgedParentCtl = await evalIn(rejectedSearchCheck.replace(
        expectedRejectedLiteral,
        JSON.stringify(poisonedExpected),
      ));
      if (forgedParentCtl.ok) {
        fails.push('SEARCH FORGED-PARENT CONTROL FAILED — poisoned Atlas/Land/name/Charter/reward outcome stayed green: '
          + JSON.stringify(forgedParentCtl));
      }
    }
    /* Negative control for the input-bound branch: if the oversized code
       ever falls through decodeWhere into a normal Compendium search, this
       outcome turns green (panel + its close action own focus) and fails the
       smoke rather than merely assuming the parser did not run. */
    if (rejection === 'oversized-cf1') {
      const oversizedFilterCtl = await evalIn(`(()=>{ const st=window.__CF_SLICE__.api.state(),s=document.getElementById('searchbox'),panel=document.getElementById('codexpanel');
        return {ok:st.panelOpen==='codex'&&!!panel?.querySelector('.empty')&&document.activeElement!==s&&s.value===${JSON.stringify(OVERSIZED_CF1_CODE)},
          panel:st.panelOpen,empty:!!panel?.querySelector('.empty'),focusSearch:document.activeElement===s,query:s.value}; })()`);
      if (oversizedFilterCtl.ok) {
        fails.push('SEARCH OVERSIZED-CF1 CONTROL FAILED — oversized CF1 fell through into a Compendium filter: '
          + JSON.stringify(oversizedFilterCtl));
      }
    }
  }

  /* Strict source proof applies at every tier. A valid galaxy route opens its
     own generated level, replaces forged display size with source size, and
     hands focus back to the canvas with matching nav/render keys. */
  const validGalaxyBefore = await evalIn(`window.__CF_SLICE__.api.state()`);
  await evalIn(`(()=>{ const s=document.getElementById('searchbox'); s.value=${JSON.stringify(String(validGalaxyShareCode))}; s.focus(); return true; })()`);
  await keyIn('Enter', 'Enter');
  const validGalaxySearch = await waitDesktopValue('valid strict CF1 galaxy route', `(()=>{ const st=window.__CF_SLICE__.api.state(),s=document.getElementById('searchbox');
    return st.mode==='galaxy'&&st.gal===999&&!st.cardOpen&&s.value===''&&document.activeElement===window.__CF_SLICE__.app.canvas
      ? {...st,focus:true,query:s.value}:null; })()`);
  if (validGalaxySearch.galSize !== 78) {
    fails.push('SEARCH VALID GALAXY CF1: source metadata did not replace the forged display size: '
      + JSON.stringify({ galSize: validGalaxySearch.galSize }));
  }
  requireRenderedSceneAdvance('SEARCH VALID GALAXY CF1', validGalaxyBefore, validGalaxySearch);
  const validGalaxyFocusCtl = await evalIn(`(()=>{ const other=document.getElementById('dockguide');other?.focus();
    const st=window.__CF_SLICE__.api.state();const s=document.getElementById('searchbox');const ok=st.mode==='galaxy'
      &&st.gal===999&&s.value===''&&document.activeElement===window.__CF_SLICE__.app.canvas;
    window.__CF_SLICE__.app.canvas.focus();return {ok,focus:document.activeElement===window.__CF_SLICE__.app.canvas};})()`);
  if (validGalaxyFocusCtl.ok || !validGalaxyFocusCtl.focus) {
    fails.push('SEARCH VALID GALAXY CONTROL FAILED — removed canvas focus stayed green or was not restored: '
      + JSON.stringify(validGalaxyFocusCtl));
  }

  /* Tail-vs-head control: a same-route Search keeps all keys identical, so a
     receipt recorded before drawing would evade key-only checks. Abort once
     immediately before the draw-tail record; the route/query/focus may still
     complete, but serial advancement must turn red. Then repeat normally and
     require a newer receipt to prove the instrument recovered. */
  const tailAbortArmed = await evalIn(`window.__CF_SLICE__.api.__smokeAbortNextRenderBeforeReceipt()`);
  await evalIn(`(()=>{ const s=document.getElementById('searchbox'); s.value=${JSON.stringify(String(validGalaxyShareCode))}; s.focus(); return true; })()`);
  await keyIn('Enter', 'Enter');
  const tailAbortedGalaxy = await waitDesktopValue('same-route galaxy draw-tail abort control', `(()=>{ const st=window.__CF_SLICE__.api.state(),s=document.getElementById('searchbox');
    return st.mode==='galaxy'&&st.gal===999&&s.value===''&&document.activeElement===window.__CF_SLICE__.app.canvas?st:null; })()`);
  if (!tailAbortArmed
    || tailAbortedGalaxy.renderedScene.serial !== validGalaxySearch.renderedScene.serial
    || renderedSceneAdvanced(validGalaxySearch, tailAbortedGalaxy)) {
    fails.push('RENDERED-SCENE TAIL CONTROL FAILED — aborted same-route draw published or passed a newer receipt: '
      + JSON.stringify({ tailAbortArmed, before: validGalaxySearch.renderedScene,
        after: tailAbortedGalaxy.renderedScene }));
  }
  await evalIn(`(()=>{ const s=document.getElementById('searchbox'); s.value=${JSON.stringify(String(validGalaxyShareCode))}; s.focus(); return true; })()`);
  await keyIn('Enter', 'Enter');
  const tailRecoveredGalaxy = await waitDesktopValue('same-route galaxy draw-tail recovery', `(()=>{ const st=window.__CF_SLICE__.api.state(),s=document.getElementById('searchbox');
    return st.mode==='galaxy'&&st.gal===999&&s.value===''&&document.activeElement===window.__CF_SLICE__.app.canvas
      &&st.renderedScene.serial>${Number(tailAbortedGalaxy.renderedScene.serial)}?st:null; })()`);
  requireRenderedSceneAdvance('RENDERED-SCENE TAIL RECOVERY', tailAbortedGalaxy, tailRecoveredGalaxy);

  /* A valid strict star code must likewise reach Sol and hand focus to the
     exploration canvas, not be mistaken for a rejected address. */
  const validStarBefore = tailRecoveredGalaxy;
  await evalIn(`(()=>{ const s=document.getElementById('searchbox'); s.value=${JSON.stringify(String(validStarShareCode))}; s.focus(); return true; })()`);
  await keyIn('Enter', 'Enter');
  const validStarSearch = await waitDesktopValue('valid CF1 star route', `(()=>{ const st=window.__CF_SLICE__.api.state(),s=document.getElementById('searchbox');
    return st.mode==='system'&&st.star===424242&&!st.cardOpen&&s.value===''&&document.activeElement===window.__CF_SLICE__.app.canvas
      ? {...st,query:s.value,focus:true}:null; })()`);
  if (!validStarSearch || validStarSearch.mode !== 'system') {
    fails.push('SEARCH VALID STAR CF1: strict in-reach star code was not accepted: ' + JSON.stringify(validStarSearch));
  }
  requireRenderedSceneAdvance('SEARCH VALID STAR CF1', validStarBefore, validStarSearch);

  /* The accepted planet route is the other half of the contract. Real Enter
     ends on the newly rendered, connected Land button—never a stale input,
     canvas, or implicit planetfall—and clears the consumed CF1 query. */
  const validPlanetBefore = validStarSearch;
  await evalIn(`(()=>{ const s=document.getElementById('searchbox'); s.value=${JSON.stringify(String(namedShareCode))}; s.focus(); return true; })()`);
  await keyIn('Enter', 'Enter');
  const validPlanetSearchCheck = `(()=>{ const st=window.__CF_SLICE__.api.state(),s=document.getElementById('searchbox');
    const action=document.querySelector('#survey [data-act="landcta"]');
    return {ok:st.mode==='system'&&st.star===424242&&st.galSize===78&&st.cardTitle==='Blue Earth'&&!!action?.isConnected
        &&action.tagName==='BUTTON'&&document.activeElement===action&&s.value==='',mode:st.mode,star:st.star,galSize:st.galSize,title:st.cardTitle,
      navGalaxyKey:st.navGalaxyKey,navStarKey:st.navStarKey,navWorldKey:st.navWorldKey,renderedScene:st.renderedScene,
      action:action?.getAttribute('data-act')||null,tag:action?.tagName||null,focus:document.activeElement===action,query:s.value}; })()`;
  const validPlanetSearch = await waitDesktopValue('valid CF1 keyboard focus handoff', `(()=>{ const result=${validPlanetSearchCheck};
    return result.mode==='system'&&result.title==='Blue Earth'?result:null; })()`);
  if (!validPlanetSearch.ok) {
    fails.push('SEARCH VALID CF1: Enter did not end on the live explicit Land action: ' + JSON.stringify(validPlanetSearch));
  }
  requireRenderedSceneAdvance('SEARCH VALID PLANET CF1', validPlanetBefore, validPlanetSearch);
  const validPlanetFocusCtl = await evalIn(`(()=>{ const action=document.querySelector('#survey [data-act="landcta"]'),s=document.getElementById('searchbox');
    s.focus(); const result=${validPlanetSearchCheck}; action?.focus(); return result; })()`);
  if (validPlanetFocusCtl.ok) {
    fails.push('SEARCH VALID-CF1 CONTROL FAILED — removed Land focus stayed green: ' + JSON.stringify(validPlanetFocusCtl));
  }
  const validPlanetSizeCtl = await evalIn(`(()=>{ const st=window.__CF_SLICE__.api.state(); return {ok:st.galSize===3999,galSize:st.galSize}; })()`);
  if (validPlanetSizeCtl.ok) {
    fails.push('SEARCH VALID-CF1 SIZE CONTROL FAILED — forged raw size survived canonical navigation: ' + JSON.stringify(validPlanetSizeCtl));
  }
  const back = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (back.mode !== 'system' || back.star !== 424242 || back.cardTitle !== 'Blue Earth') {
    fails.push('planet Share did not focus Earth in Sol without bypassing Land: ' + JSON.stringify([back.mode, back.star, back.cardTitle]));
  }
  if (back.objective !== liveGoalBoundary.objective) fails.push('planet Share changed landfall progression without Land: '
    + JSON.stringify({ before: liveGoalBoundary.objective, after: back.objective }));
  const resharedNamedCode = await evalIn(`window.__CF_SLICE__.api.cardShareCode()`);
  if (!resharedNamedCode || codeName(resharedNamedCode) !== 'Blue Earth' || codeGalaxySize(resharedNamedCode) !== 78) {
    fails.push('named CF1 route did not preserve source display metadata through v2 re-share: ' + JSON.stringify(resharedNamedCode));
  }

  /* 4b. THE ZOOM-DRIVEN TRANSITIONS (checkTransitions semantics) — the leg
     the click-descent tests structurally cannot see. We are already in Sol
     after the external planet address focused Earth without landing; ride
     the zoom ladder up and back down. Every step reads camT (intent). */
  const stEsc = back;
  await evalIn(`(()=>{ window.__CF_SLICE__.camT.z = 0.01; return 1; })()`);   /* zoom out hard */
  const stG = await waitDesktopValue('system-to-galaxy zoom', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.mode==='galaxy'&&s.gal===999?s:null; })()`);
  if (stG.mode !== 'galaxy' || stG.gal !== 999) fails.push('zoom-out did not rise system→galaxy: ' + JSON.stringify([stG.mode, stG.gal]));
  await evalIn(`(()=>{ window.__CF_SLICE__.camT.z = 0.05; return 1; })()`);
  const galaxyToUniverseState = `(()=>{ const S=window.__CF_SLICE__,s=S.api.state();return {
    mode:s.mode,gal:s.gal,galX:s.galX,galY:s.galY,star:s.star,starX:s.starX,starY:s.starY,
    cam:{x:S.cam.x,y:S.cam.y,z:S.cam.z},camT:{x:S.camT.x,y:S.camT.y,z:S.camT.z},
    tickerStarted:S.app.ticker.started===true,tickerTicks:s.tickerTicks,
    hidden:document.hidden,focus:document.hasFocus(),toast:s.toastText};})()`;
  let stU;
  try {
    stU = await waitDesktopValue('galaxy-to-universe zoom', `(()=>{ const state=${galaxyToUniverseState};return state.mode==='universe'?state:null; })()`);
  } catch (error) {
    const state = await evalIn(galaxyToUniverseState).catch((diagnosticError) => ({ diagnosticError: String(diagnosticError) }));
    const consoleErrors = events.filter((event) => event.method === 'Runtime.exceptionThrown'
      || (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error'))
      .slice(-3).map((event) => event.params);
    throw new Error('galaxy-to-universe diagnostic: ' + JSON.stringify({ state, consoleErrors })
      + ' · ' + (error instanceof Error ? error.message : String(error)));
  }
  if (stU.mode !== 'universe') fails.push('zoom-out did not rise galaxy→universe: ' + stU.mode);
  /* Negative control: deep zoom in EMPTY space must NOT dive. Waiting a
     fixed interval can pass vacuously on a throttled target if no ticker
     ever reads the injected intent. The first observed tick moves the
     camera and streams the target cell after transition checks; require a
     second distinct ticker turn so checkTransitions has evaluated the empty
     point against that newly streamed cell even when Reduced motion snapped
     the camera to its target on the first turn. */
  await send('Target.activateTarget', { targetId: t.targetId });
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sess);
  await send('Page.bringToFront', {}, sess);
  const emptyStart = await evalIn(`(()=>{ const S=window.__CF_SLICE__; return {x:S.cam.x,y:S.cam.y}; })()`);
  await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.camT.x=5000; S.camT.y=5000; S.camT.z=28; return 1; })()`);
  const emptyObserved = await waitDesktopValue('empty-space zoom ticker observation', `(()=>{
    const S=window.__CF_SLICE__,s=S.api.state(),target={x:5000,y:5000};
    const start=${JSON.stringify(emptyStart)},toward=(S.cam.x-start.x)*(target.x-start.x)+(S.cam.y-start.y)*(target.y-start.y);
    return s.mode!=='universe'||toward>0.01?{state:s,toward,cam:{x:S.cam.x,y:S.cam.y},ticks:S.api.state().tickerTicks}:null;
  })()`);
  const emptyChecked = await waitDesktopValue('empty-space zoom resolved-cell transition check', `(()=>{
    const S=window.__CF_SLICE__,s=S.api.state(),prior=${JSON.stringify(emptyObserved)};
    const later=s.tickerTicks>prior.ticks;
    return s.mode!=='universe'||later?{state:s,later,ticks:s.tickerTicks}:null;
  })()`);
  const stEmpty = emptyChecked.state;
  if (stEmpty.mode !== 'universe') fails.push('CONTROL FAILED — deep zoom in empty space dove somewhere: ' + stEmpty.mode);
  /* zoom INTO the Milky Way at HOME_POS → galaxy */
  await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.camT.x=90; S.camT.y=-60; S.camT.z=28; return 1; })()`);
  const stG2 = await waitDesktopValue('universe-to-galaxy zoom', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.mode==='galaxy'&&s.gal===999?s:null; })()`);
  if (stG2.mode !== 'galaxy' || stG2.gal !== 999) fails.push('zoom-in did not dive universe→galaxy: ' + JSON.stringify([stG2.mode, stG2.gal]));
  /* hold deep over SOL_POS below the dive threshold: the Sun marker + the
     fine-star resolve layer must both be up (Renderer LOD gates) */
  await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.camT.x=560; S.camT.y=170; S.camT.z=8; S.cam.x=560; S.cam.y=170; S.cam.z=8; return 1; })()`);
  const deep = await waitDesktopValue('deep Sol detail layer', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.fine&&s.solVisible?s:null; })()`);
  if (!deep.fine) fails.push('deep zoom did not build the fine-star layer');
  if (!deep.solVisible) fails.push('Sun marker not visible at deep zoom over SOL_POS');
  const shot5 = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(screenshotPath('solmark'), Buffer.from(shot5.data, 'base64'));
  /* and the final dive: past starZ over the Sun → system 424242 */
  await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.camT.z=30; return 1; })()`);
  const stS2 = await waitDesktopValue('galaxy-to-Sol zoom', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.mode==='system'&&s.star===424242?s:null; })()`);
  if (stS2.mode !== 'system' || stS2.star !== 424242) fails.push('zoom-in over the Sun did not dive into Sol: ' + JSON.stringify([stS2.mode, stS2.star]));

  /* 4b0. AUTHORIZATION IS PART OF STORED-ROUTE ACCEPTANCE. This complete
     supported expedition names a real, source-proven outer galaxy but owns
     zero Prime Signatures. Boot must repair only the unauthorized location
     to Cosmos; its identity/progress/history remain the same. The same raw
     outer route in Atlas stays proven/enabled, yet its real pointer action
     must run the common authorization boundary without closing or moving. */
  await evalIn(`new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice');
    q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,tx=db.transaction('meta','readwrite');
      tx.objectStore('meta').put(${JSON.stringify(OUTER_AUTH_SAVED_ROUTE_RAW)},'save');
      tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>reject(tx.error);};})`);
  await navigateToSlice(sess, URL0, 'source-valid saved route beyond saved reach');
  await sleep(2200);
  const outerAuthBoot = await evalIn(`window.__CF_SLICE__.api.state()`);
  const outerAuthBootOutcome = (state) => state.mode === 'universe'
    && state.gal === null && state.star === null && state.planet === null
    && state.save.savedView === null && state.save.viewType === null
    && state.save.name === importedExplorerName(SAVED_AUTH_EXPLORER_NAME) && state.save.essence === 4321
    && JSON.stringify(state.save.landed) === JSON.stringify([133, 134])
    && state.save.customNames.some(([key, name]) => key === 'p133' && name === 'Homeworld')
    && state.save.ascCh === 2 && Object.keys(state.save.primeFill).length === 0
    && state.codexCount === 3 && state.atlasCount === 4 && state.atlasTravelable === 2;
  if (!outerAuthBootOutcome(outerAuthBoot)) {
    fails.push('SAVED ROUTE AUTHORIZATION: source-valid outer location did not fall back home with unrelated ledger intact: '
      + JSON.stringify(outerAuthBoot));
  }
  requireRenderedSceneMatch('SAVED ROUTE AUTHORIZATION FALLBACK', outerAuthBoot);
  if (outerAuthBootOutcome({ ...outerAuthBoot, mode: 'galaxy', gal: OUTER_REACH_GALAXY.seed })
    || outerAuthBootOutcome({
      ...outerAuthBoot, save: { ...outerAuthBoot.save, essence: 0 },
    })) {
    fails.push('SAVED ROUTE AUTHORIZATION CONTROL FAILED — injected unauthorized navigation/progress loss stayed green');
  }
  await evalIn(`window.__CF_SLICE__.api.__smokePersistNow()`);
  const outerAuthRepairedRaw = JSON.parse(await evalIn(READ_PRIMARY_EXPRESSION));
  if (outerAuthRepairedRaw.view !== null
    || outerAuthRepairedRaw.me !== importedExplorerName(SAVED_AUTH_EXPLORER_NAME)
    || outerAuthRepairedRaw.essence !== 4321 || Number(outerAuthRepairedRaw.asc) !== 2
    || Object.keys(outerAuthRepairedRaw.prime || {}).length !== 0
    || !Array.isArray(outerAuthRepairedRaw.log)
    || !outerAuthRepairedRaw.log.some((row) => row?.id === 'outer-galaxy')
    || ![133, 134].every((seed) => outerAuthRepairedRaw.land?.includes(seed))) {
    fails.push('SAVED ROUTE AUTHORIZATION: persisted repair changed more than the view/normal export projection: '
      + JSON.stringify(outerAuthRepairedRaw));
  }
  const outerAtlasSetup = await evalIn(`(()=>{ document.getElementById('railatlas').click();
    const row=document.querySelector('#atlaspanel [data-aid="outer-galaxy"]'),r=row?.getBoundingClientRect(),s=window.__CF_SLICE__.api.state();
    return {row:{exists:!!row,tag:row?.tagName||null,disabled:!!row?.disabled,aria:row?.getAttribute('aria-disabled')||null,
      x:r?(r.left+r.right)/2:null,y:r?(r.top+r.bottom)/2:null,h:r?.height||0},before:s};})()`);
  const outerAtlasRawBefore = await evalIn(READ_PRIMARY_EXPRESSION);
  if (!outerAtlasSetup.row.exists || outerAtlasSetup.row.tag !== 'BUTTON' || outerAtlasSetup.row.disabled
    || outerAtlasSetup.row.aria === 'true' || !(outerAtlasSetup.row.h >= 44)
    || outerAtlasSetup.before.panelOpen !== 'atlas') {
    fails.push('ATLAS AUTHORIZATION SETUP: source-proven outer route was not an enabled real row: '
      + JSON.stringify(outerAtlasSetup));
  } else {
    await clickDesktopPoint({ x: outerAtlasSetup.row.x, y: outerAtlasSetup.row.y });
  }
  await sleep(120);
  const outerAtlasAfter = await evalIn(`window.__CF_SLICE__.api.state()`);
  const outerAtlasRawAfter = await evalIn(READ_PRIMARY_EXPRESSION);
  const atlasAuthStableProjection = (state) => JSON.stringify({
    mode: state.mode, gal: state.gal, galX: state.galX, galY: state.galY,
    star: state.star, starX: state.starX, starY: state.starY,
    planet: state.planet, planetOrdinal: state.planetOrdinal,
    panelOpen: state.panelOpen, cardOpen: state.cardOpen, cardTitle: state.cardTitle,
    renderedScene: state.renderedScene, atlasCount: state.atlasCount, save: state.save,
  });
  const outerAtlasBoundary = outerAtlasAfter.toastSerial > outerAtlasSetup.before.toastSerial
    && /Beyond Your Saved Reach/.test(outerAtlasAfter.toastText)
    && !/Beyond Your Charter/.test(outerAtlasAfter.toastText);
  if (atlasAuthStableProjection(outerAtlasAfter) !== atlasAuthStableProjection(outerAtlasSetup.before)
    || outerAtlasRawAfter !== outerAtlasRawBefore || !outerAtlasBoundary) {
    fails.push('ATLAS AUTHORIZATION: enabled outer route bypassed/closed navigation, changed ledger/storage, or missed its exact boundary: '
      + JSON.stringify({ before: outerAtlasSetup.before, after: outerAtlasAfter,
        rawStable: outerAtlasRawAfter === outerAtlasRawBefore, outerAtlasBoundary }));
  }
  const atlasAuthBypassCtl = {
    ...outerAtlasAfter,
    mode: 'galaxy', gal: OUTER_REACH_GALAXY.seed,
    galX: OUTER_REACH_GALAXY.x, galY: OUTER_REACH_GALAXY.y,
    panelOpen: null,
  };
  if (atlasAuthStableProjection(atlasAuthBypassCtl) === atlasAuthStableProjection(outerAtlasSetup.before)) {
    fails.push('ATLAS AUTHORIZATION CONTROL FAILED — injected direct outer-galaxy bypass stayed green');
  }
  if (outerAtlasAfter.panelOpen === 'atlas') await closeDesktopPanel();

  /* 4b1. STORED-ROUTE FIELD REPAIR. A complete supported expedition with a
     stale same-seed galaxy coordinate must boot safely at Cosmos, repair only
     `view`, and preserve identity, progress, Atlas history, Charter, rewards,
     and names. This drives the raw IndexedDB ingress rather than an in-memory
     resolver probe. */
  await evalIn(`new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice');
    q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,tx=db.transaction('meta','readwrite');
      tx.objectStore('meta').put(${JSON.stringify(STALE_SAVED_ROUTE_RAW)},'save');
      tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>reject(tx.error);};})`);
  await navigateToSlice(sess, URL0, 'stale saved-route field-local fallback');
  await sleep(2200);
  const staleSavedBoot = await evalIn(`window.__CF_SLICE__.api.state()`);
  const staleSavedBootOutcome = (state) => state.mode === 'universe'
    && state.gal === null && state.star === null && state.planet === null
    && state.save.savedView === null && state.save.name === 'Field-local Route Repair'
    && state.save.essence === 4321 && JSON.stringify(state.save.landed) === JSON.stringify([133, 134])
    && state.save.customNames.some(([key, name]) => key === 'p133' && name === 'Homeworld')
    && state.save.ascCh === 2 && state.codexCount === 3 && state.atlasCount === 3;
  if (!staleSavedBootOutcome(staleSavedBoot)) {
    fails.push('SAVED ROUTE FIELD REPAIR: stale location did not fall back to Cosmos with unrelated progress intact: '
      + JSON.stringify(staleSavedBoot));
  }
  requireRenderedSceneMatch('SAVED ROUTE FIELD REPAIR', staleSavedBoot);
  if (staleSavedBootOutcome({ ...staleSavedBoot, mode: 'surface' })
    || staleSavedBootOutcome({
      ...staleSavedBoot, save: { ...staleSavedBoot.save, essence: 0 },
    })) {
    fails.push('SAVED ROUTE FIELD-REPAIR CONTROL FAILED — injected stale navigation/progress loss stayed green');
  }
  await evalIn(`window.__CF_SLICE__.api.__smokePersistNow()`);
  const repairedSavedRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  let repairedSaved = null;
  try { repairedSaved = JSON.parse(repairedSavedRaw); } catch { /* finding below includes the raw failure */ }
  if (!repairedSaved || repairedSaved.view !== null || repairedSaved.me !== 'Field-local Route Repair'
    || repairedSaved.essence !== 4321 || !Array.isArray(repairedSaved.land)
    || ![133, 134].every((seed) => repairedSaved.land.includes(seed))
    || !Array.isArray(repairedSaved.names)
    || !repairedSaved.names.some(([key, name]) => key === 'p133' && name === 'Homeworld')) {
    fails.push('SAVED ROUTE FIELD REPAIR: exact stored replacement did not isolate repair to `view`: '
      + JSON.stringify(repairedSaved));
  }

  /* 4c. GATE C's FRONT DOOR, rehearsed with the veteran fixture: the import
     sheet's own path (api.importBlob = the button's handler) must validate,
     store the veteran, and reboot into its name, stardust and view. Every
     rejected input below owns a before/after exact-primary assertion. */
  const vrRaw = VETERAN_ATLAS_RAW;
  /* a garbage blob must be REFUSED with nothing stored */
  const preGarbageImportRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  const refuse = await evalIn(`window.__CF_SLICE__.api.importBlob('{"not":"a save"' )`).catch(() => 'navigated');
  const postGarbageImportRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  if (refuse === null || refuse === 'navigated' || postGarbageImportRaw !== preGarbageImportRaw) {
    fails.push('importBlob accepted garbage, reloaded, or changed exact primary bytes: '
      + JSON.stringify({ refuse, preserved: postGarbageImportRaw === preGarbageImportRaw }));
  }
  const preSparseImportRaw = postGarbageImportRaw;
  const refuseSparseV4 = await evalIn(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(SPARSE_V4_RAW)})`).catch(() => 'navigated');
  const postSparseImportRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  if (refuseSparseV4 === null || refuseSparseV4 === 'navigated' || postSparseImportRaw !== preSparseImportRaw) {
    fails.push('destructive import accepted or wrote sparse v4 lookalike: ' + JSON.stringify({ refuseSparseV4, preserved: postSparseImportRaw === preSparseImportRaw }));
  }
  const prePartialImportRaw = postSparseImportRaw;
  const refusePartialV4 = await evalIn(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(PARTIAL_V4_RAW)})`).catch(() => 'navigated');
  const postPartialImportRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  if (refusePartialV4 === null || refusePartialV4 === 'navigated' || postPartialImportRaw !== prePartialImportRaw) {
    fails.push('destructive import accepted or wrote plausible partial v4: ' + JSON.stringify({ refusePartialV4, preserved: postPartialImportRaw === prePartialImportRaw }));
  }
  const preFutureImportRaw = postPartialImportRaw;
  const refuseFuture = await evalIn(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(FUTURE_V99_RAW)})`).catch(() => 'navigated');
  const postFutureImportRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  if (refuseFuture === null || refuseFuture === 'navigated' || postFutureImportRaw !== preFutureImportRaw) {
    fails.push('destructive import accepted or wrote future-version bytes: '
      + JSON.stringify({ refuseFuture, preserved: postFutureImportRaw === preFutureImportRaw }));
  }

  /* Drive one valid import through the visible textarea/button with legal
     surrounding JSON whitespace. The live primary may use the checked,
     trimmed candidate, but the best-effort recovery keepsake promises the
     exact submitted textarea text. The injected trimmed-localStorage control
     proves this comparison rejects the defect that prompted the check. */
  const whitespaceImportRaw = ` \n${vrRaw}\n\t`;
  const whitespaceImportToken = await sliceToken(sess);
  const whitespaceImportStart = await evalIn(`(()=>{ document.getElementById('docksets')?.click();
    document.getElementById('setimport')?.click(); const input=document.getElementById('importtext'),go=document.getElementById('importgo');
    if(!(input instanceof HTMLTextAreaElement)||!(go instanceof HTMLButtonElement)) return {started:false,input:!!input,go:!!go};
    input.value=${JSON.stringify(whitespaceImportRaw)}; go.click(); return {started:true,length:input.value.length}; })()`);
  if (!whitespaceImportStart.started || whitespaceImportStart.length !== whitespaceImportRaw.length) {
    fails.push('IMPORT EXACT KEEPSAKE: visible valid-import path did not receive every textarea byte: '
      + JSON.stringify(whitespaceImportStart));
  }
  await waitForSlice(sess, 'desktop exact-keepsake whitespace import', { previousToken: whitespaceImportToken });
  await assertBootTickerRunning('post-import replacement boot');
  const whitespaceKeepsake = await evalIn(`(()=>{ const expected=${JSON.stringify(whitespaceImportRaw)};
    const actual=localStorage.getItem('cf_v2_import_original');
    return {exact:actual===expected,actualLength:actual?.length??null,expectedLength:expected.length,
      leading:actual?.slice(0,2)??null,trailing:actual?.slice(-2)??null}; })()`);
  if (!whitespaceKeepsake.exact) {
    fails.push('IMPORT EXACT KEEPSAKE: valid JSON surrounding whitespace was not retained byte-for-byte after reload: '
      + JSON.stringify(whitespaceKeepsake));
  }
  const whitespaceKeepsakeControl = await evalIn(`(()=>{ const key='cf_v2_import_original',expected=${JSON.stringify(whitespaceImportRaw)};
    const before=localStorage.getItem(key); localStorage.setItem(key,expected.trim());
    const acceptedTrimmed=localStorage.getItem(key)===expected;
    if(before===null)localStorage.removeItem(key);else localStorage.setItem(key,before);
    return {acceptedTrimmed,restored:localStorage.getItem(key)===before}; })()`);
  if (whitespaceKeepsakeControl.acceptedTrimmed || !whitespaceKeepsakeControl.restored) {
    fails.push('IMPORT EXACT KEEPSAKE CONTROL FAILED — injected trimmed storage was accepted or not restored: '
      + JSON.stringify(whitespaceKeepsakeControl));
  }

  /* Real same-tab ordering outcome. The diagnostic arm installs one stale
     autosave as activePersist but gates its repository write. In ONE browser
     turn, start valid import then release stale. Correct code awaits stale
     and writes valid last. Removing importBlob's activePersist await starts
     valid first, stale second, and this post-reload primary/state assertion
     fails with "Stale Autosave Must Lose". */
  const desktopImportToken = await sliceToken(sess);
  const importRace = await evalIn(`(async()=>{ const api=window.__CF_SLICE__.api;
    const armed=api.__smokeArmImportRace(${JSON.stringify(STALE_AUTOSAVE_RAW)});
    if(!armed)return {armed,released:false,duplicate:null};
    void api.importBlob(${JSON.stringify(vrRaw)});
    const duplicate=await api.importBlob(${JSON.stringify(STALE_AUTOSAVE_RAW)});
    return {armed,duplicate,released:api.__smokeReleaseImportRace()}; })()`)
    .catch(() => ({ armed: false, released: false, duplicate: null }));
  if (!importRace.armed || !importRace.released
    || !/another expedition replacement is finishing/i.test(importRace.duplicate || '')) {
    fails.push('IMPORT/AUTOSAVE/DUPLICATE RACE: ordering or unique-operation claim did not hold: ' + JSON.stringify(importRace));
    try { await evalIn(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(vrRaw)})`); }
    catch { /* fallback only keeps later smoke diagnostics reachable */ }
  }
  await waitForSlice(sess, 'desktop veteran import after stale autosave race', { previousToken: desktopImportToken });
  await sleep(2800);
  const vet = await evalIn(`window.__CF_SLICE__.api.state()`);
  const postRacePrimaryRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  let postRacePrimary = null;
  try { postRacePrimary = JSON.parse(postRacePrimaryRaw); } catch { /* finding below carries the raw parse failure */ }
  if (vet.save.name !== 'Dakk') fails.push('veteran import did not boot as Dakk: ' + JSON.stringify(vet.save.name));
  if (vet.save.essence !== 5000) fails.push('veteran essence wrong: ' + JSON.stringify(vet.save.essence));
  if (vet.mode !== 'surface' || vet.gal !== 999 || vet.galX !== 90 || vet.galY !== -60
    || vet.galSize !== 78 || vet.star !== 424242 || vet.starX !== 560 || vet.starY !== 170
    || vet.planet !== 133 || vet.planetOrdinal !== 2
    || vet.save.savedView?.gal?.size !== 78) {
    fails.push('veteran savedView was not source-regenerated with exact hierarchy/ordinal/metadata: '
      + JSON.stringify(vet));
  }
  requireRenderedSceneMatch('VETERAN SAVED ROUTE', vet);
  if (vet.codexCount !== 3) fails.push('veteran Compendium count wrong (want 3): ' + JSON.stringify(vet.codexCount));
  if (!postRacePrimary || postRacePrimary.me !== 'Dakk' || postRacePrimary.essence !== 5000
    || postRacePrimary.me === 'Stale Autosave Must Lose') {
    fails.push('IMPORT/AUTOSAVE/DUPLICATE RACE: imported primary did not remain authoritative after reload/settle: '
      + JSON.stringify({ state: vet.save, storedName: postRacePrimary?.me, storedEssence: postRacePrimary?.essence }));
  }

  /* A current one-key Training snapshot can be perfectly source-proven and
     still unauthorized by the saved expedition. Real Skip must apply the
     same Prime/Charter seam as Search/Atlas: home fallback, snapshot clear,
     and no unrelated ledger loss. */
  const authTrainingSource = JSON.parse(OUTER_AUTH_TRAINING_RAW);
  if (JSON.stringify(Object.keys(authTrainingSource.tsnap || {})) !== JSON.stringify(['view'])) {
    fails.push('TRAINING AUTHORIZATION FIXTURE CONTROL FAILED — tsnap is not exact `{view}`');
  }
  const authTrainingToken = await sliceToken(sess);
  try { await evalIn(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(OUTER_AUTH_TRAINING_RAW)})`); }
  catch { /* successful replacement reloads */ }
  await waitForSlice(sess, 'source-valid Training snapshot beyond saved reach', { previousToken: authTrainingToken });
  await sleep(1800);
  const authTrainingBoot = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (authTrainingBoot.mode !== 'system' || authTrainingBoot.gal !== 999 || authTrainingBoot.star !== 424242
    || !authTrainingBoot.tutActive || authTrainingBoot.tutStep !== 'welcome'
    || Object.keys(authTrainingBoot.tutSnapshotPending || {}).join('|') !== 'view'
    || authTrainingBoot.save.name !== importedExplorerName(TRAINING_AUTH_EXPLORER_NAME)
    || authTrainingBoot.save.essence !== 3456 || Object.keys(authTrainingBoot.save.primeFill).length !== 0) {
    fails.push('TRAINING AUTHORIZATION: exact one-key outer snapshot did not boot pending over the authorized Sol drill: '
      + JSON.stringify(authTrainingBoot));
  }
  requireRenderedSceneMatch('TRAINING AUTHORIZATION BOOT', authTrainingBoot);
  const authTrainingLedger = (state) => JSON.stringify({
    ...state.save,
    viewType: null,
    savedView: null,
  });
  const authTrainingSkip = await evalIn(`(()=>{ const button=document.querySelector('[data-sel="tutskip"]');
    button?.click();return {pressed:!!button};})()`);
  const authTrainingRestored = await waitDesktopValue('unauthorized Training restore home fallback', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return !s.tutActive&&s.tutDone&&s.mode==='universe'&&s.tutSnapshotPending===null?s:null;})()`);
  const authTrainingOutcome = (state) => state.mode === 'universe'
    && state.gal === null && state.star === null && state.planet === null
    && state.tutSnapshotPending === null && state.save.savedView === null
    && authTrainingLedger(state) === authTrainingLedger(authTrainingBoot)
    && renderedSceneAdvanced(authTrainingBoot, state);
  if (!authTrainingSkip.pressed || !authTrainingOutcome(authTrainingRestored)) {
    fails.push('TRAINING AUTHORIZATION: real Skip did not home-fallback/clear while preserving unrelated ledger: '
      + JSON.stringify({ pressed: authTrainingSkip.pressed, before: authTrainingBoot, after: authTrainingRestored }));
  }
  requireRenderedSceneAdvance('TRAINING AUTHORIZATION FALLBACK', authTrainingBoot, authTrainingRestored);
  const authTrainingCtl = {
    ...authTrainingRestored,
    mode: 'galaxy', gal: OUTER_REACH_GALAXY.seed,
    tutSnapshotPending: { view: outerReachGalaxyView() },
  };
  if (authTrainingOutcome(authTrainingCtl)) {
    fails.push('TRAINING AUTHORIZATION CONTROL FAILED — injected outer restore/uncleared snapshot stayed green');
  }
  await evalIn(`window.__CF_SLICE__.api.__smokePersistNow()`);
  const authTrainingRaw = JSON.parse(await evalIn(READ_PRIMARY_EXPRESSION));
  if (Object.prototype.hasOwnProperty.call(authTrainingRaw, 'tsnap') || authTrainingRaw.view !== null
    || authTrainingRaw.me !== importedExplorerName(TRAINING_AUTH_EXPLORER_NAME)
    || authTrainingRaw.essence !== 3456
    || Object.keys(authTrainingRaw.prime || {}).length !== 0) {
    fails.push('TRAINING AUTHORIZATION: home fallback/snapshot clear did not persist without ledger drift: '
      + JSON.stringify(authTrainingRaw));
  }

  /* Current Field Training snapshots have exactly one own key, `view`. Drive
     that persisted shape through import → replacement boot → the real Skip
     action. Completion must source-prove and restore Earth in one action,
     clear the pending snapshot, and leave every expedition ledger unchanged. */
  const trainingRestoreSource = JSON.parse(CURRENT_TRAINING_RESTORE_RAW);
  if (JSON.stringify(Object.keys(trainingRestoreSource.tsnap || {})) !== JSON.stringify(['view'])) {
    fails.push('TRAINING ONE-KEY FIXTURE CONTROL FAILED — current tsnap is not exact `{view}`');
  }
  const trainingRestoreToken = await sliceToken(sess);
  try { await evalIn(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(CURRENT_TRAINING_RESTORE_RAW)})`); }
  catch { /* successful replacement reloads */ }
  await waitForSlice(sess, 'current one-key Training snapshot boot', { previousToken: trainingRestoreToken });
  await sleep(1800);
  const trainingRestoreBoot = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (trainingRestoreBoot.mode !== 'system' || trainingRestoreBoot.gal !== 999
    || trainingRestoreBoot.star !== 424242 || !trainingRestoreBoot.tutActive
    || trainingRestoreBoot.tutStep !== 'welcome'
    || Object.keys(trainingRestoreBoot.tutSnapshotPending || {}).join('|') !== 'view') {
    fails.push('TRAINING ONE-KEY RESTORE: current pending snapshot did not boot in Sol/welcome intact: '
      + JSON.stringify(trainingRestoreBoot));
  }
  requireRenderedSceneMatch('TRAINING SOURCE-ERROR SETUP BOOT', trainingRestoreBoot);
  /* A transient generator failure at restore is not stale-route evidence.
     Recreate the actual defect first: move the in-progress lesson from Sol
     onto Earth with the exact diagnostic selector. Earth is already landed,
     so this setup may change only the route/receipt, never expedition ledger.
     Then drive the real Skip with a one-shot source-error latch: the lesson
     may close, but the run stays incomplete, its exact one-key snapshot
     survives, and the app returns to proven Sol before persistence. Reload
     must reopen Welcome in that same safe system for a normal retry. */
  const trainingRouteNeutralLedger = (state) => JSON.stringify({
    ...state.save,
    viewType: null,
    savedView: null,
  });
  const trainingSurfaceLandAccepted = await evalIn(`window.__CF_SLICE__.api.landOn(${JSON.stringify(EARTH)})`);
  await sleep(180);
  const trainingSourceErrorSurface = await evalIn(`window.__CF_SLICE__.api.state()`);
  if (!trainingSurfaceLandAccepted || trainingSourceErrorSurface.mode !== 'surface'
    || trainingSourceErrorSurface.planet !== 133 || trainingSourceErrorSurface.planetOrdinal !== 2
    || trainingRouteNeutralLedger(trainingSourceErrorSurface) !== trainingRouteNeutralLedger(trainingRestoreBoot)) {
    fails.push('TRAINING SOURCE-ERROR SETUP: exact already-landed Earth route changed unrelated ledger or missed surface: '
      + JSON.stringify({ accepted: trainingSurfaceLandAccepted, before: trainingRestoreBoot,
        after: trainingSourceErrorSurface }));
  }
  requireRenderedSceneAdvance('TRAINING SOURCE-ERROR EARTH SURFACE SETUP', trainingRestoreBoot, trainingSourceErrorSurface);
  await evalIn(`window.__CF_SLICE__.api.__smokePersistNow()`);
  const trainingSourceErrorArmed = await evalIn(`window.__CF_SLICE__.api.__smokeRejectNextTrainingRouteResolution()`);
  const trainingSourceErrorSkip = await evalIn(`(()=>{ const button=document.querySelector('[data-sel="tutskip"]');
    button?.click();return {pressed:!!button};})()`);
  const trainingSourceErrorState = await waitDesktopValue('Training source-error safe Sol outcome', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return !s.tutActive&&!s.tutDone&&s.mode==='system'&&s.star===424242?s:null;})()`);
  const trainingSourceErrorOutcome = (state) => state.mode === 'system'
    && state.gal === 999 && state.galX === 90 && state.galY === -60 && state.galSize === 78
    && state.star === 424242 && state.starX === 560 && state.starY === 170
    && state.planet === null && state.planetOrdinal === null
    && !state.tutActive && !state.tutDone
    && Object.keys(state.tutSnapshotPending || {}).join('|') === 'view'
    && state.save.viewType === 'star' && state.save.savedView?.star?.seed === 424242
    && trainingRouteNeutralLedger(state) === trainingRouteNeutralLedger(trainingSourceErrorSurface)
    && renderedSceneAdvanced(trainingSourceErrorSurface, state);
  if (!trainingSourceErrorArmed || !trainingSourceErrorSkip.pressed
    || !trainingSourceErrorOutcome(trainingSourceErrorState)) {
    fails.push('TRAINING SOURCE ERROR: real Skip did not retain snapshot/incomplete status and return to canonical Sol: '
      + JSON.stringify({ armed: trainingSourceErrorArmed, pressed: trainingSourceErrorSkip.pressed,
        before: trainingSourceErrorSurface, after: trainingSourceErrorState }));
  }
  requireRenderedSceneAdvance('TRAINING SOURCE-ERROR SAFE SOL', trainingSourceErrorSurface, trainingSourceErrorState);
  const trainingSourceErrorControls = [
    { ...trainingSourceErrorState, tutSnapshotPending: null },
    { ...trainingSourceErrorState, mode: 'surface', planet: 133, planetOrdinal: 2 },
    { ...trainingSourceErrorState, renderedScene: trainingSourceErrorSurface.renderedScene },
    { ...trainingSourceErrorState, navGalaxyKey: null, navStarKey: null, navWorldKey: null,
      renderedScene: { ...trainingSourceErrorState.renderedScene, galaxyKey: null, starKey: null, worldKey: null } },
  ];
  if (trainingSourceErrorControls.some(trainingSourceErrorOutcome)) {
    fails.push('TRAINING SOURCE-ERROR CONTROL FAILED — cleared snapshot, non-Sol nav, stale receipt, or null-key literal Sol stayed green');
  }
  await evalIn(`window.__CF_SLICE__.api.__smokePersistNow()`);
  const trainingSourceErrorRaw = JSON.parse(await evalIn(READ_PRIMARY_EXPRESSION));
  if (trainingSourceErrorRaw.tut !== 0
    || JSON.stringify(Object.keys(trainingSourceErrorRaw.tsnap || {})) !== JSON.stringify(['view'])
    || trainingSourceErrorRaw.tsnap?.view?.type !== 'planet' || trainingSourceErrorRaw.tsnap?.view?.pseed !== 133
    || trainingSourceErrorRaw.view?.type !== 'star'
    || trainingSourceErrorRaw.view?.gal?.seed !== 999 || trainingSourceErrorRaw.view?.gal?.x !== 90
    || trainingSourceErrorRaw.view?.gal?.y !== -60 || trainingSourceErrorRaw.view?.gal?.size !== 78
    || trainingSourceErrorRaw.view?.star?.seed !== 424242 || trainingSourceErrorRaw.view?.star?.x !== 560
    || trainingSourceErrorRaw.view?.star?.y !== 170) {
    fails.push('TRAINING SOURCE ERROR: retained one-key snapshot/canonical Sol did not reach raw IndexedDB: '
      + JSON.stringify({ tut: trainingSourceErrorRaw.tut, tsnap: trainingSourceErrorRaw.tsnap,
        view: trainingSourceErrorRaw.view }));
  }
  await navigateToSlice(sess, URL0, 'Training source-error retry reload');
  await sleep(1800);
  const trainingRetryBoot = await evalIn(`window.__CF_SLICE__.api.state()`);
  const trainingRetryBootOutcome = (state) => state.mode === 'system'
    && state.gal === 999 && state.galX === 90 && state.galY === -60 && state.galSize === 78
    && state.star === 424242 && state.starX === 560 && state.starY === 170
    && state.planet === null && !state.tutDone && state.tutActive && state.tutStep === 'welcome'
    && Object.keys(state.tutSnapshotPending || {}).join('|') === 'view'
    && state.save.viewType === 'star' && state.save.savedView?.star?.seed === 424242
    && renderedSceneMatchesNav(state);
  if (!trainingRetryBootOutcome(trainingRetryBoot)) {
    fails.push('TRAINING SOURCE ERROR: reload did not reopen Welcome in canonical Sol with the one-key snapshot: '
      + JSON.stringify(trainingRetryBoot));
  }
  const trainingRetryControls = [
    { ...trainingRetryBoot, tutSnapshotPending: null },
    { ...trainingRetryBoot, star: null, starX: null, starY: null },
    { ...trainingRetryBoot, renderedScene: { ...trainingRetryBoot.renderedScene, serial: 0 } },
  ];
  if (trainingRetryControls.some(trainingRetryBootOutcome)) {
    fails.push('TRAINING SOURCE-ERROR RELOAD CONTROL FAILED — cleared snapshot, non-Sol nav, or serial 0 stayed green');
  }
  const trainingRetryRaw = JSON.parse(await evalIn(READ_PRIMARY_EXPRESSION));
  if (trainingRetryRaw.tut !== 0
    || JSON.stringify(Object.keys(trainingRetryRaw.tsnap || {})) !== JSON.stringify(['view'])
    || trainingRetryRaw.view?.type !== 'star' || trainingRetryRaw.view?.star?.seed !== 424242) {
    fails.push('TRAINING SOURCE ERROR: reload did not retain raw incomplete/snapshot/Sol evidence: '
      + JSON.stringify({ tut: trainingRetryRaw.tut, tsnap: trainingRetryRaw.tsnap, view: trainingRetryRaw.view }));
  }
  /* exportSaveV2's honest first pass unions conquered/mined census into
     `land`: this fixture is 2 in memory before its first write and 6 after
     the source-error persist/reload. Compare the retry against that current
     normalized baseline, not the earlier pre-export veteran snapshot. */
  if (trainingRestoreBoot.save.landed.length !== 2 || trainingRetryBoot.save.landed.length !== 6
    || JSON.stringify(trainingRetryBoot.save.landed) !== JSON.stringify(trainingRetryRaw.land)) {
    fails.push('TRAINING FIRST-PASS LAND NORMALIZATION: expected 2 imported → 6 persisted/reloaded worlds: '
      + JSON.stringify({ imported: trainingRestoreBoot.save.landed,
        raw: trainingRetryRaw.land, reloaded: trainingRetryBoot.save.landed }));
  }
  const trainingLedgerExpected = trainingRouteNeutralLedger(trainingRetryBoot);
  const trainingSkip = await evalIn(`(()=>{ const button=document.querySelector('[data-sel="tutskip"]');
    button?.click();return {pressed:!!button};})()`);
  const trainingRestored = await waitDesktopValue('current one-key Training route restore', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return !s.tutActive&&s.tutDone&&s.mode==='surface'&&s.planet===133?s:null;})()`);
  if (!trainingSkip.pressed || trainingRestored.planetOrdinal !== 2
    || trainingRestored.tutSnapshotPending !== null
    || trainingRouteNeutralLedger(trainingRestored) !== trainingLedgerExpected
    || trainingRestored.atlasCount !== vet.atlasCount) {
    fails.push('TRAINING ONE-KEY RESTORE: one real Skip did not restore the exact source-proven route/ledger: '
      + JSON.stringify({ pressed: trainingSkip.pressed, before: trainingRetryBoot, after: trainingRestored }));
  }
  requireRenderedSceneAdvance('TRAINING ONE-KEY RESTORE', trainingRetryBoot, trainingRestored);
  const currentTrainingRestoreOutcome = (state) => state.mode === 'surface'
    && state.planet === 133 && state.planetOrdinal === 2 && state.tutSnapshotPending === null
    && renderedSceneMatchesNav(state);
  const trainingRestoreCtl = {
    ...trainingRestored,
    tutSnapshotPending: { view: trainingRestored.save.savedView },
  };
  if (currentTrainingRestoreOutcome(trainingRestoreCtl)) {
    fails.push('TRAINING ONE-KEY RESTORE CONTROL FAILED — injected uncleared snapshot stayed green');
  }
  await evalIn(`window.__CF_SLICE__.api.__smokePersistNow()`);
  const trainingRestoredRaw = JSON.parse(await evalIn(READ_PRIMARY_EXPRESSION));
  if (Object.prototype.hasOwnProperty.call(trainingRestoredRaw, 'tsnap')
    || trainingRestoredRaw.view?.type !== 'planet' || trainingRestoredRaw.view?.pseed !== 133) {
    fails.push('TRAINING ONE-KEY RESTORE: cleared snapshot/exact restored route did not reach raw IndexedDB: '
      + JSON.stringify({ tsnap: trainingRestoredRaw.tsnap, view: trainingRestoredRaw.view }));
  }
  const normalizedRecordsLandedCount = trainingRestored.save.landed.length;

  /* A transient saved-route source failure leaves Cosmos rendered while the
     exact raw non-home route is held outside ordinary view writes. Stage that
     otherwise nondeterministic post-boot state from this proven Earth route,
     then press the REAL Settings Restart button. First reject persistence and
     require exact route/hold/snapshot rollback plus byte identity; then retry
     successfully and require the held Earth route—not navToView(Cosmos)—to
     become the one-key snapshot while canonical, proven Sol is persisted. */
  const heldRouteExpected = trainingRestored.save.savedView;
  const heldRouteExpectedJSON = JSON.stringify(heldRouteExpected);
  const heldStageBefore = await evalIn(`window.__CF_SLICE__.api.state()`);
  const heldStageRawBefore = await evalIn(READ_PRIMARY_EXPRESSION);
  const heldStaged = await evalIn(`window.__CF_SLICE__.api.__smokeStageHeldRouteAtHome()`);
  const heldStage = await evalIn(`window.__CF_SLICE__.api.state()`);
  const heldStageRawAfter = await evalIn(READ_PRIMARY_EXPRESSION);
  if (!heldStaged || heldStageBefore.mode !== 'surface' || heldStageBefore.planet !== 133
    || heldStage.mode !== 'universe' || heldStage.gal !== null || heldStage.star !== null || heldStage.planet !== null
    || !heldStage.savedRouteWriteHeld || heldStage.tutSnapshotPending !== null
    || JSON.stringify(heldStage.save.savedView) !== heldRouteExpectedJSON
    || heldStageRawAfter !== heldStageRawBefore || !renderedSceneMatchesNav(heldStage)) {
    fails.push('TRAINING HELD-ROUTE STAGE: diagnostics did not reproduce exact Cosmos/held-route boot state without writing storage: '
      + JSON.stringify({ staged: heldStaged, before: heldStageBefore, after: heldStage,
        rawStable: heldStageRawAfter === heldStageRawBefore }));
  }

  const heldRollbackTokenBefore = await sliceToken(sess);
  const heldRollbackRawBefore = await evalIn(READ_PRIMARY_EXPRESSION);
  const heldRollbackPress = await evalIn(`(()=>{ const api=window.__CF_SLICE__.api;
    document.getElementById('docksets')?.click();const button=document.getElementById('setrestart'),armed=api.__smokeRejectNextPersist();
    button?.click();return {armed,button:!!button};})()`);
  await sleep(500);
  const heldRollback = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state(),button=document.getElementById('setrestart'),toast=document.getElementById('toast'),
    style=toast?getComputedStyle(toast):null,r=toast?.getBoundingClientRect(),title=(toast?.querySelector('[data-sel=toast-title]')?.textContent||'').trim();
    return {state:s,button:!!button,disabled:button?.disabled??null,title,text:toast?.textContent||'',
      visible:!!toast&&toast.style.opacity==='1'&&Number(style?.opacity)>0&&style?.visibility!=='hidden'&&!!r&&r.width>0&&r.height>0};})()`);
  const heldRollbackTokenAfter = await sliceToken(sess);
  const heldRollbackRawAfter = await evalIn(READ_PRIMARY_EXPRESSION);
  const heldRollbackRouteOutcome = (state) => state.mode === heldStage.mode
    && state.gal === heldStage.gal && state.star === heldStage.star && state.planet === heldStage.planet
    && state.navGalaxyKey === heldStage.navGalaxyKey && state.navStarKey === heldStage.navStarKey
    && state.navWorldKey === heldStage.navWorldKey
    && JSON.stringify(state.renderedScene) === JSON.stringify(heldStage.renderedScene)
    && state.tutDone === heldStage.tutDone && state.tutActive === heldStage.tutActive
    && JSON.stringify(state.tutSnapshotPending) === JSON.stringify(heldStage.tutSnapshotPending)
    && state.savedRouteWriteHeld === true
    && JSON.stringify(state.save.savedView) === heldRouteExpectedJSON
    && renderedSceneMatchesNav(state);
  if (!heldRollbackPress.armed || !heldRollbackPress.button || !heldRollbackRouteOutcome(heldRollback.state)
    || heldRollback.disabled !== false || !heldRollback.visible || heldRollback.title !== 'Save unavailable'
    || !/was not restarted/i.test(heldRollback.text)
    || heldRollbackTokenAfter !== heldRollbackTokenBefore || heldRollbackRawAfter !== heldRollbackRawBefore) {
    fails.push('TRAINING HELD-ROUTE RESTART ROLLBACK: real rejected Restart lost nav/view/hold/snapshot or changed exact primary bytes: '
      + JSON.stringify({ press: heldRollbackPress, outcome: heldRollback,
        noReload: heldRollbackTokenAfter === heldRollbackTokenBefore,
        primaryPreserved: heldRollbackRawAfter === heldRollbackRawBefore }));
  }
  const heldRollbackControls = [
    { ...heldRollback.state, savedRouteWriteHeld: false },
    { ...heldRollback.state, save: { ...heldRollback.state.save, savedView: null } },
    { ...heldRollback.state, tutSnapshotPending: { view: null } },
    { ...heldRollback.state, mode: 'system', star: 424242 },
  ];
  if (heldRollbackControls.some(heldRollbackRouteOutcome)) {
    fails.push('TRAINING HELD-ROUTE ROLLBACK CONTROL FAILED — lost hold/view/snapshot/nav rollback stayed green');
  }

  const heldSuccessToken = await sliceToken(sess);
  const heldSuccessPressed = await evalIn(`(()=>{ const button=document.getElementById('setrestart');button?.click();return !!button;})()`);
  await waitForSlice(sess, 'held-route Training Restart success', { previousToken: heldSuccessToken });
  await sleep(1800);
  const heldSuccessState = await evalIn(`window.__CF_SLICE__.api.state()`);
  const heldSuccessRaw = JSON.parse(await evalIn(READ_PRIMARY_EXPRESSION));
  const heldSuccessOutcome = (state, raw) => state.mode === 'system'
    && state.gal === 999 && state.galX === 90 && state.galY === -60 && state.galSize === 78
    && state.star === 424242 && state.starX === 560 && state.starY === 170
    && state.planet === null && state.planetOrdinal === null
    && !state.tutDone && state.tutActive && state.tutStep === 'welcome' && !state.savedRouteWriteHeld
    && JSON.stringify(Object.keys(state.tutSnapshotPending || {})) === JSON.stringify(['view'])
    && JSON.stringify(state.tutSnapshotPending?.view) === heldRouteExpectedJSON
    && state.save.viewType === 'star' && state.save.savedView?.gal?.seed === 999
    && state.save.savedView?.star?.seed === 424242
    && raw?.tut === 0 && JSON.stringify(Object.keys(raw?.tsnap || {})) === JSON.stringify(['view'])
    && JSON.stringify(raw?.tsnap?.view) === heldRouteExpectedJSON
    && raw?.view?.type === 'star' && raw?.view?.gal?.seed === 999 && raw?.view?.star?.seed === 424242
    && renderedSceneMatchesNav(state);
  if (!heldSuccessPressed || !heldSuccessOutcome(heldSuccessState, heldSuccessRaw)) {
    fails.push('TRAINING HELD-ROUTE RESTART SUCCESS: real Restart did not transfer exact held route to one-key snapshot and persist proven Sol: '
      + JSON.stringify({ pressed: heldSuccessPressed, expectedHeld: heldRouteExpected,
        state: heldSuccessState, raw: heldSuccessRaw }));
  }
  const heldSuccessControls = [
    [{ ...heldSuccessState, tutSnapshotPending: { view: null } },
      { ...heldSuccessRaw, tsnap: { view: null } }],
    [{ ...heldSuccessState, navGalaxyKey: null, navStarKey: null, navWorldKey: null,
      renderedScene: { ...heldSuccessState.renderedScene, galaxyKey: null, starKey: null, worldKey: null } }, heldSuccessRaw],
    [{ ...heldSuccessState, savedRouteWriteHeld: true }, heldSuccessRaw],
  ];
  if (heldSuccessControls.some(([state, raw]) => heldSuccessOutcome(state, raw))) {
    fails.push('TRAINING HELD-ROUTE SUCCESS CONTROL FAILED — home snapshot, null-key literal Sol, or uncleared hold stayed green');
  }

  /* Return through the real Skip before the pre-existing ordinary Restart
     rejection/interlock outcome. That original control keeps its proven
     non-held baseline and therefore remains an independent opposite case. */
  const heldSuccessSkip = await evalIn(`(()=>{ const button=document.querySelector('[data-sel="tutskip"]');button?.click();return !!button;})()`);
  const heldSuccessRestored = await waitDesktopValue('held-route Training snapshot restore', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return !s.tutActive&&s.tutDone&&s.mode==='surface'&&s.planet===133&&s.planetOrdinal===2?s:null;})()`);
  if (!heldSuccessSkip || heldSuccessRestored.tutSnapshotPending !== null
    || heldSuccessRestored.savedRouteWriteHeld || JSON.stringify(heldSuccessRestored.save.savedView) !== heldRouteExpectedJSON) {
    fails.push('TRAINING HELD-ROUTE CLEANUP: real Skip did not restore exact held Earth route before the ordinary Restart control: '
      + JSON.stringify({ pressed: heldSuccessSkip, state: heldSuccessRestored }));
  }
  requireRenderedSceneAdvance('TRAINING HELD-ROUTE SNAPSHOT RESTORE', heldSuccessState, heldSuccessRestored);
  await evalIn(`window.__CF_SLICE__.api.__smokePersistNow()`);

  /* Training Restart is transactional UI too. Inject one deterministic
     persist rejection, press the REAL Settings button, and require exact
     tutorial/navigation rollback, no reload, an enabled retry button, the
     visible refusal, and unchanged primary bytes. */
  const restartBefore = await evalIn(`window.__CF_SLICE__.api.state()`);
  const restartBeforeToken = await sliceToken(sess);
  const restartBeforeRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  const restartClick = await evalIn(`(async()=>{ const api=window.__CF_SLICE__.api;
    document.getElementById('docksets').click(); const button=document.getElementById('setrestart');
    const held=api.__smokeArmImportRace(${JSON.stringify(restartBeforeRaw)});
    const armed=api.__smokeRejectNextPersist(); button?.click();
    await Promise.resolve();
    const interlock=await api.importBlob(${JSON.stringify(vrRaw)});
    const released=api.__smokeReleaseImportRace();
    return {armed,held,released,interlock,button:!!button}; })()`);
  await sleep(500);
  const restartOutcomeCheck = `(()=>{ const S=window.__CF_SLICE__,s=S.api.state(),button=document.getElementById('setrestart'),toast=document.getElementById('toast');
    const style=toast?getComputedStyle(toast):null,r=toast?.getBoundingClientRect(),title=(toast?.querySelector('[data-sel=toast-title]')?.textContent||'').trim();
    const visible=!!toast&&toast.style.opacity==='1'&&Number(style?.opacity)>0&&style?.visibility!=='hidden'&&!!r&&r.width>0&&r.height>0;
    const exact=s.mode===${JSON.stringify(restartBefore.mode)}&&s.gal===${JSON.stringify(restartBefore.gal)}
      &&s.star===${JSON.stringify(restartBefore.star)}&&s.planet===${JSON.stringify(restartBefore.planet)}
      &&s.tutDone===${JSON.stringify(restartBefore.tutDone)}&&s.tutActive===${JSON.stringify(restartBefore.tutActive)}
      &&JSON.stringify(s.tutSnapshotPending)===${JSON.stringify(JSON.stringify(restartBefore.tutSnapshotPending))};
    const tickerStarted=S.app.ticker.started===true;
    return {ok:exact&&!!button&&!button.disabled&&visible&&title==='Save unavailable'&&/was not restarted/i.test(toast?.textContent||'')&&tickerStarted,
      exact,button:!!button,disabled:button?.disabled??null,visible,title,text:toast?.textContent||'',tickerStarted,state:s}; })()`;
  const restartOutcome = await evalIn(restartOutcomeCheck);
  const restartAfterToken = await sliceToken(sess);
  const restartAfterRaw = await evalIn(READ_PRIMARY_EXPRESSION);
  if (!restartClick.armed || !restartClick.held || !restartClick.released || !restartClick.button
    || !/another expedition replacement is finishing/i.test(restartClick.interlock || '') || !restartOutcome.ok
    || restartAfterToken !== restartBeforeToken || restartAfterRaw !== restartBeforeRaw) {
    fails.push('TRAINING RESTART/IMPORT INTERLOCK: arbitration, rollback, refusal, or byte outcome drifted: ' + JSON.stringify({
      click: restartClick, outcome: restartOutcome, noReload: restartAfterToken === restartBeforeToken,
      primaryPreserved: restartAfterRaw === restartBeforeRaw,
    }));
  }
  const restartOutcomeCtl = await evalIn(`(()=>{ const button=document.getElementById('setrestart'),toast=document.getElementById('toast');
    const api=window.__CF_SLICE__.api,priorState=api.state,priorDisabled=button?.disabled,priorVisibility=toast?.style.visibility;
    api.state=()=>({...priorState(),tutDone:!${JSON.stringify(restartBefore.tutDone)}});
    if(button)button.disabled=true;if(toast)toast.style.visibility='hidden';const result=${restartOutcomeCheck};
    api.state=priorState;if(button)button.disabled=!!priorDisabled;if(toast)toast.style.visibility=priorVisibility||'';return result;})()`);
  if (restartOutcomeCtl.ok || restartOutcomeCtl.exact) {
    fails.push('TRAINING RESTART REJECTION CONTROL FAILED — injected rollback mutation/disabled button/hidden refusal stayed green: '
      + JSON.stringify(restartOutcomeCtl));
  }
  const restartTickerCtl = await evalIn(`(()=>{ const app=window.__CF_SLICE__.app;app.stop();const result=${restartOutcomeCheck};app.start();return result;})()`);
  if (restartTickerCtl.ok || restartTickerCtl.tickerStarted) {
    fails.push('TRAINING RESTART TICKER CONTROL FAILED — rollback with stopped outgoing ticker stayed green: '
      + JSON.stringify(restartTickerCtl));
  }
  await evalIn(`(()=>{ document.querySelector('#setpanel [data-pnx]')?.click(); return true; })()`);
  /* A non-code Search owns one filtered Compendium visit. Detail → Back
     retains that query and exact row; closing then using the ordinary dock/
     rail entry starts a fresh full-catalogue visit. */
  const search = await evalIn(`(()=>{ const input=document.getElementById('searchbox'); input.value='Toruneeus'; input.focus(); return true; })()`);
  if (search) await keyIn('Enter', 'Enter');
  const codexQuery = await evalIn(`(()=>{ const rows=[...document.querySelectorAll('#codexpanel [data-ci]')],heading=document.querySelector('#codexpanel h3');
    return {panel:window.__CF_SLICE__.api.state().panelOpen,count:rows.length,index:rows[0]?.getAttribute('data-ci')||null,
      heading:heading?.textContent||'',focus:document.activeElement===rows[0]}; })()`);
  if (codexQuery.panel !== 'codex' || codexQuery.count !== 1 || codexQuery.index !== '0'
    || !/Toruneeus/.test(codexQuery.heading) || !codexQuery.focus) {
    fails.push('COMPENDIUM QUERY: non-code Search did not open one focused filtered result: ' + JSON.stringify(codexQuery));
  }
  await keyIn('Enter', 'Enter');
  const codexQueryDetail = await evalIn(`({detail:!!document.querySelector('#codexpanel [data-sel=codex-detail]'),
    backFocus:document.activeElement===document.getElementById('codexback')})`);
  if (!codexQueryDetail.detail || !codexQueryDetail.backFocus) {
    fails.push('COMPENDIUM QUERY: filtered row Enter did not open focused detail: ' + JSON.stringify(codexQueryDetail));
  }
  await keyIn('Enter', 'Enter');
  const codexQueryBack = await evalIn(`(()=>{ const rows=[...document.querySelectorAll('#codexpanel [data-ci]')],heading=document.querySelector('#codexpanel h3');
    return {count:rows.length,index:rows[0]?.getAttribute('data-ci')||null,heading:heading?.textContent||'',
      focus:document.activeElement===rows[0]}; })()`);
  if (codexQueryBack.count !== 1 || codexQueryBack.index !== codexQuery.index
    || !/Toruneeus/.test(codexQueryBack.heading) || !codexQueryBack.focus) {
    fails.push('COMPENDIUM QUERY: Detail → Back lost the query or exact row focus: ' + JSON.stringify(codexQueryBack));
  }
  await evalIn(`(()=>{ document.querySelector('#codexpanel [data-pnx]')?.click(); const opener=document.getElementById('railcodex');
    opener.focus(); opener.click(); return true; })()`);
  const codexFullCheck = `(()=>{ const rows=[...document.querySelectorAll('#codexpanel [data-ci]')],heading=document.querySelector('#codexpanel h3');
    const text=heading?.textContent||''; return {count:rows.length,queryAbsent:!/Toruneeus|[“”]/.test(text),heading:text}; })()`;
  const codexFull = await evalIn(codexFullCheck);
  if (codexFull.count !== 3 || !codexFull.queryAbsent) {
    fails.push('COMPENDIUM QUERY: ordinary reopen retained a stale Search filter: ' + JSON.stringify(codexFull));
  }
  const codexFullCtl = await evalIn(`(()=>{ const heading=document.querySelector('#codexpanel h3'),marker=document.createElement('span');
    marker.textContent=' “Toruneeus”'; heading?.appendChild(marker); const result=${codexFullCheck}; marker.remove(); return result; })()`);
  if (codexFullCtl.queryAbsent) {
    fails.push('COMPENDIUM QUERY CONTROL FAILED — injected stale query heading stayed green: ' + JSON.stringify(codexFullCtl));
  }
  await evalIn(`(()=>{ document.querySelector('#codexpanel [data-pnx]')?.click(); return true; })()`);
  /* 4c-detail. The Compendium rows and Back control are native keyboard
     actions. Drive a REAL Enter, retain the exact row identity across the
     refill, and make both a pointer-only row and undersized Back fail before
     restoring the production DOM. */
  const codexRow = await evalIn(`(()=>{ document.getElementById('dockcodex').click();
    const row=document.querySelector('#codexpanel [data-ci]'),r=row?.getBoundingClientRect();
    row?.focus(); return {ok:row?.tagName==='BUTTON'&&row?.type==='button'&&!!r&&r.height>=44,
      index:row?.getAttribute('data-ci')||null,tag:row?.tagName||null,type:row?.type||null,
      height:r?.height||0,focus:document.activeElement===row}; })()`);
  if (!codexRow.ok || !codexRow.focus || codexRow.index === null) {
    fails.push('COMPENDIUM KEYBOARD: first row is not a focused native 44px action: ' + JSON.stringify(codexRow));
  }
  const codexPointerSetup = await evalIn(`(()=>{ const row=document.querySelector('#codexpanel [data-ci]');
    if(!row) return false; const old=document.createElement('span'); old.id='cf-pointer-codex-row';
    old.tabIndex=0; old.dataset.ci=row.dataset.ci; old.innerHTML=row.innerHTML; old.className=row.className;
    window.__cfNativeCodexRow=row; row.replaceWith(old); old.focus(); return true; })()`);
  if (codexPointerSetup) await keyIn('Enter', 'Enter');
  const codexPointerCtl = await evalIn(`(()=>{ const old=document.getElementById('cf-pointer-codex-row'),native=window.__cfNativeCodexRow;
    const result={detail:!!document.querySelector('#codexpanel [data-sel=codex-detail]'),
      panel:window.__CF_SLICE__.api.state().panelOpen,tag:old?.tagName||null,focus:document.activeElement===old};
    if(old&&native){old.replaceWith(native);native.focus();} delete window.__cfNativeCodexRow; return result; })()`);
  if (!codexPointerSetup || codexPointerCtl.detail || codexPointerCtl.panel !== 'codex'
    || codexPointerCtl.tag !== 'SPAN' || !codexPointerCtl.focus) {
    fails.push('COMPENDIUM CONTROL FAILED — injected pointer-only row responded to real Enter: '
      + JSON.stringify({ codexPointerSetup, codexPointerCtl }));
  }
  await keyIn('Enter', 'Enter');
  const detail = await evalIn(`(()=>{ const det=document.querySelector('#codexpanel [data-sel=codex-detail]');
    const stats=document.querySelectorAll('#codexpanel [data-sel=detail-stat]').length;
    const desc=(document.querySelector('#codexpanel [data-sel=detail-desc]')||{}).textContent||'';
    const port=document.querySelector('#codexpanel [data-sel=detail-portrait]'),back=document.getElementById('codexback');
    const br=back?.getBoundingClientRect(); return {ok:!!det,stats,descLen:desc.trim().length,
      portLen:port?String(port.getAttribute('src')||'').length:0,backNative:back?.tagName==='BUTTON',
      backHeight:br?.height||0,backFocus:document.activeElement===back}; })()`);
  if (!detail.ok || !detail.backNative || detail.backHeight < 44 || !detail.backFocus) {
    fails.push('COMPENDIUM KEYBOARD: Enter did not open detail on a focused 44px Back action: ' + JSON.stringify(detail));
  }
  const shotDet = await send('Page.captureScreenshot', { format: 'png' }, sess);
  fs.writeFileSync(screenshotPath('codex'), Buffer.from(shotDet.data, 'base64'));
  const detailBackSizeCtl = await evalIn(`(()=>{ const back=document.getElementById('codexback'); if(!back)return null;
    const prior=back.getAttribute('style'); back.style.setProperty('min-height','0','important');
    back.style.setProperty('height','20px','important'); back.style.setProperty('max-height','20px','important');
    back.style.setProperty('padding','0','important'); back.style.setProperty('overflow','hidden','important');
    const height=back.getBoundingClientRect().height;
    if(prior===null) back.removeAttribute('style'); else back.setAttribute('style',prior); return {height,ok:height>=44}; })()`);
  if (!detailBackSizeCtl || detailBackSizeCtl.ok) {
    fails.push('COMPENDIUM CONTROL FAILED — injected undersized Back stayed 44px: ' + JSON.stringify(detailBackSizeCtl));
  }
  await keyIn('Enter', 'Enter');
  const detailBack = await evalIn(`(()=>{ const row=document.querySelector('#codexpanel [data-ci="${codexRow.index}"]');
    return {backRows:document.querySelectorAll('#codexpanel [data-ci]').length,
      exact:row?.getAttribute('data-ci')||null,focus:document.activeElement===row}; })()`);
  if (detail.ok && !(detail.portLen > 5000)) {
    fails.push('THE LIVING PORTRAIT did not paint (hdart real-render proof): src length ' + detail.portLen);
  } else if (detail.ok) {
    if (detail.stats !== 5) fails.push('detail card missing the five stat bars: ' + detail.stats);
    if (!(detail.descLen > 20)) fails.push('detail card description empty (describeSpecies silent): ' + detail.descLen);
  }
  if (detailBack.backRows !== 3 || detailBack.exact !== codexRow.index || !detailBack.focus) {
    fails.push('COMPENDIUM KEYBOARD: Back Enter did not restore the exact list-row focus: ' + JSON.stringify(detailBack));
  }
  await evalIn(`(()=>{ document.querySelector('#codexpanel [data-pnx]').click(); return true; })()`);

  /* The Star Atlas uses the same native contract, but its outcome is travel:
     Space and Enter must both route through jumpToView and return focus to
     the canvas. A focusable span and a 20px button are deliberate controls. */
  const atlasRowCheck = `(()=>{ const row=document.querySelector('#atlaspanel [data-aid]'),r=row?.getBoundingClientRect();
    return {ok:row?.tagName==='BUTTON'&&row?.type==='button'&&!!r&&r.height>=44,
      id:row?.getAttribute('data-aid')||null,tag:row?.tagName||null,type:row?.type||null,
      height:r?.height||0,focus:document.activeElement===row}; })()`;
  const atlasRow = await evalIn(`(()=>{ const opener=document.getElementById('railatlas'); opener.focus(); opener.click();
    const row=document.querySelector('#atlaspanel [data-aid]'); row?.focus(); return ${atlasRowCheck}; })()`);
  if (!atlasRow.ok || !atlasRow.focus || atlasRow.id !== 'p133') {
    fails.push('ATLAS KEYBOARD: veteran Earth row is not a focused native 44px action: ' + JSON.stringify(atlasRow));
  }
  const unavailableAtlasRawBefore = await evalIn(READ_PRIMARY_EXPRESSION);
  const unavailableAtlas = await evalIn(`(()=>{ const ids=['legacy-star','forged-earth'],S=window.__CF_SLICE__;
    const shape=()=>{const s=S.api.state();return JSON.stringify({mode:s.mode,gal:s.gal,star:s.star,planet:s.planet,
      panel:s.panelOpen,card:s.cardOpen,atlas:s.atlasCount,save:s.save,rendered:s.renderedScene});};
    const before=shape();const rows=ids.map((id)=>{const row=document.querySelector('#atlaspanel [data-aid="'+id+'"]');
      const result={id,exists:!!row,tag:row?.tagName||null,disabled:!!row?.disabled,
        aria:row?.getAttribute('aria-disabled')||null,honest:/route unavailable/i.test(row?.textContent||'')};
      row?.click();return result;});const after=shape();
    const controlRow=document.querySelector('#atlaspanel [data-aid="forged-earth"]');
    let controlRejected=false;if(controlRow){controlRow.disabled=false;controlRow.removeAttribute('aria-disabled');
      controlRejected=!(controlRow.disabled||controlRow.getAttribute('aria-disabled')==='true');
      controlRow.disabled=true;controlRow.setAttribute('aria-disabled','true');}
    return {rows,stable:before===after,controlRejected};})()`);
  const unavailableAtlasRawAfter = await evalIn(READ_PRIMARY_EXPRESSION);
  if (unavailableAtlas.rows.length !== 2
    || unavailableAtlas.rows.some((row) => !row.exists || row.tag !== 'BUTTON' || !row.disabled
      || row.aria !== 'true' || !row.honest)
    || !unavailableAtlas.stable || !unavailableAtlas.controlRejected
    || unavailableAtlasRawAfter !== unavailableAtlasRawBefore) {
    fails.push('ATLAS UNAVAILABLE ROUTES: incomplete/forged imports were not visible, disabled, honest, and byte-stable: '
      + JSON.stringify({ unavailableAtlas, rawStable: unavailableAtlasRawAfter === unavailableAtlasRawBefore }));
  }
  const atlasPointerSetup = await evalIn(`(()=>{ const row=document.querySelector('#atlaspanel [data-aid]'); if(!row)return false;
    const old=document.createElement('span'); old.id='cf-pointer-atlas-row'; old.tabIndex=0; old.dataset.aid=row.dataset.aid;
    old.innerHTML=row.innerHTML; old.className=row.className; window.__cfNativeAtlasRow=row; row.replaceWith(old); old.focus(); return true; })()`);
  if (atlasPointerSetup) await keyIn('Enter', 'Enter');
  const atlasPointerCtl = await evalIn(`(()=>{ const old=document.getElementById('cf-pointer-atlas-row'),native=window.__cfNativeAtlasRow;
    const s=window.__CF_SLICE__.api.state(); const result={panel:s.panelOpen,mode:s.mode,card:s.cardOpen,
      tag:old?.tagName||null,focus:document.activeElement===old};
    if(old&&native){old.replaceWith(native);native.focus();} delete window.__cfNativeAtlasRow; return result; })()`);
  if (!atlasPointerSetup || atlasPointerCtl.panel !== 'atlas' || atlasPointerCtl.mode !== 'surface'
    || atlasPointerCtl.card || atlasPointerCtl.tag !== 'SPAN' || !atlasPointerCtl.focus) {
    fails.push('ATLAS CONTROL FAILED — injected pointer-only row travelled on real Enter: '
      + JSON.stringify({ atlasPointerSetup, atlasPointerCtl }));
  }
  const atlasSizeCtl = await evalIn(`(()=>{ const row=document.querySelector('#atlaspanel [data-aid]'); if(!row)return null;
    const prior=row.getAttribute('style'); row.style.setProperty('min-height','0','important');
    row.style.setProperty('height','20px','important'); row.style.setProperty('max-height','20px','important');
    row.style.setProperty('padding','0','important'); row.style.setProperty('overflow','hidden','important');
    const height=row.getBoundingClientRect().height;
    if(prior===null) row.removeAttribute('style'); else row.setAttribute('style',prior); row.focus(); return {height,ok:height>=44}; })()`);
  if (!atlasSizeCtl || atlasSizeCtl.ok) {
    fails.push('ATLAS CONTROL FAILED — injected undersized row stayed 44px: ' + JSON.stringify(atlasSizeCtl));
  }
  const atlasTravelLedger = (state) => JSON.stringify({
    ...state.save,
    viewType: null,
    savedView: null,
  });
  const atlasBeforeTravel = await evalIn(`window.__CF_SLICE__.api.state()`);
  await keyIn(' ', 'Space');
  const atlasSpace = await waitDesktopValue('Atlas Space travel', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return s.panelOpen===null&&s.mode==='system'&&s.cardOpen?{...s,focus:document.activeElement===document.querySelector('canvas')}:null; })()`);
  /* The veteran fixture names p133 “Homeworld”. Atlas travel must reopen the
     live customized survey, not regress it to the Atlas row's stale label. */
  if (atlasSpace.star !== 424242 || atlasSpace.starX !== 560 || atlasSpace.starY !== 170
    || atlasSpace.galSize !== 78 || atlasSpace.cardTitle !== 'Homeworld' || !atlasSpace.focus
    || atlasTravelLedger(atlasSpace) !== atlasTravelLedger(atlasBeforeTravel)) {
    fails.push('ATLAS KEYBOARD: Space did not travel to the live Earth survey and return canvas focus: ' + JSON.stringify(atlasSpace));
  }
  requireRenderedSceneAdvance('ATLAS PROVEN SPACE ROUTE', atlasBeforeTravel, atlasSpace);
  const atlasEnterSetup = await evalIn(`(()=>{ const opener=document.getElementById('railatlas'); opener.focus(); opener.click();
    const row=document.querySelector('#atlaspanel [data-aid="p133"]'); row?.focus(); return ${atlasRowCheck}; })()`);
  if (!atlasEnterSetup.ok || !atlasEnterSetup.focus) {
    fails.push('ATLAS KEYBOARD: Earth row did not restore for Enter: ' + JSON.stringify(atlasEnterSetup));
  }
  await keyIn('Enter', 'Enter');
  const atlasEnter = await waitDesktopValue('Atlas Enter travel', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return s.panelOpen===null&&s.mode==='system'&&s.cardOpen?{...s,focus:document.activeElement===document.querySelector('canvas')}:null; })()`);
  if (atlasEnter.star !== 424242 || atlasEnter.starX !== 560 || atlasEnter.starY !== 170
    || atlasEnter.galSize !== 78 || atlasEnter.cardTitle !== 'Homeworld' || !atlasEnter.focus
    || atlasTravelLedger(atlasEnter) !== atlasTravelLedger(atlasBeforeTravel)) {
    fails.push('ATLAS KEYBOARD: Enter did not travel to the live Earth survey and return canvas focus: ' + JSON.stringify(atlasEnter));
  }
  requireRenderedSceneAdvance('ATLAS PROVEN ENTER ROUTE', atlasSpace, atlasEnter);
  /* 4c-records. Records over the real save: counts + the journal empty state */
  const rec = await evalIn(`(()=>{ document.getElementById('dockrecords').click();
    const landed=[...document.querySelectorAll('#recpanel .row')].map(r=>r.textContent).find(t=>/worlds landed/.test(t))||'';
    const jempty=!!document.querySelector('#recpanel [data-sel=journal-empty]');
    const jn=document.querySelectorAll('#recpanel [data-sel=journal-entry]').length;
    document.querySelector('#recpanel [data-pnx]').click();
    return { landed, jempty, jn }; })()`);
  const recordsLandedPattern = new RegExp('worlds landed\\s*' + normalizedRecordsLandedCount + '$');
  if (!recordsLandedPattern.test(rec.landed.trim())) {
    fails.push('Records did not count the stage-normalized ' + normalizedRecordsLandedCount
      + ' landed worlds after first-pass export/reload: ' + JSON.stringify(rec.landed));
  }
  if (!rec.jempty && rec.jn === 0) fails.push('Records journal rendered nothing at all');
  /* CHARTERS: the current-slice projection keeps one live landfall row and
     never renders a legacy mining/fabrication/Shipyard directive. */
  const chp = await evalIn(`(()=>{ document.getElementById('dockcharters').click();
    const chs=[...document.querySelectorAll('#chpanel [data-sel=charter-ch]')];
    const cur=chs.find(c=>c.dataset.chstate==='actionable'||c.dataset.chstate==='boundary'||c.dataset.chstate==='complete');
    const goals=document.querySelectorAll('#chpanel [data-sel=charter-goal]').length;
    const text=document.getElementById('chpanel')?.textContent||'';
    document.querySelector('#chpanel [data-pnx]').click();
    return { n:chs.length, cur:!!cur, goals,text }; })()`);
  if (chp.n !== 1 || !chp.cur || chp.goals > 1 || /mine|fabricat|shipyard|\bbuild\b/i.test(chp.text)) {
    fails.push('Charters panel exposed an unavailable objective or lost its projected record: ' + JSON.stringify(chp));
  }

  /* 4c-release. Exercise the dormant shipped-bulletin path with an explicit
     synthetic fixture. It may open exactly once for this veteran, must focus
     its “All bulletins” Back action, and must persist rnSeen before a fresh document can prove
     that the same version does not reopen. This never changes the product's
     null V2_CURRENT_RELEASE_VERSION. */
  const releaseFixture = await evalIn(`(()=>{ const S=window.__CF_SLICE__,version=${JSON.stringify(RELEASE_FIXTURE_VERSION)};
    const before=S.api.state(),opened=S.api.showReleaseFixture(version),after=S.api.state();
    const heading=document.querySelector('#guidepanel [data-guide-heading]'),back=document.querySelector('#guidepanel [data-sel="guide-body"] [data-guide-releases]');
    return {beforeTraining:before.tutActive,opened,panel:after.panelOpen,rnSeen:after.rnSeen,
      pending:after.releasePending,title:heading?.textContent||'',focus:document.activeElement===back}; })()`);
  if (releaseFixture.beforeTraining || !releaseFixture.opened || releaseFixture.panel !== 'guide'
    || releaseFixture.rnSeen !== RELEASE_FIXTURE_VERSION || releaseFixture.pending !== null
    || !/Browser fixture bulletin/.test(releaseFixture.title) || !releaseFixture.focus) {
    fails.push('RELEASE BULLETIN: veteran synthetic shipped release did not open once with Back focus: '
      + JSON.stringify(releaseFixture));
  }
  const releaseFocusCtl = await evalIn(`(()=>{ const back=document.querySelector('#guidepanel [data-sel="guide-body"] [data-guide-releases]'),close=document.querySelector('#guidepanel [data-pnx]');
    close?.focus(); const failed=document.activeElement!==back; back?.focus(); return {failed,restored:document.activeElement===back}; })()`);
  if (!releaseFocusCtl.failed || !releaseFocusCtl.restored) {
    fails.push('RELEASE BULLETIN CONTROL FAILED — moving focus off Back stayed green: ' + JSON.stringify(releaseFocusCtl));
  }
  await evalIn(`(()=>{ document.querySelector('#guidepanel [data-pnx]')?.click(); return true; })()`);
  const releaseRepeat = await evalIn(`(()=>{ const S=window.__CF_SLICE__; const opened=S.api.showReleaseFixture(${JSON.stringify(RELEASE_FIXTURE_VERSION)});
    const s=S.api.state(); return {opened,panel:s.panelOpen,rnSeen:s.rnSeen}; })()`);
  if (releaseRepeat.opened || releaseRepeat.panel !== null || releaseRepeat.rnSeen !== RELEASE_FIXTURE_VERSION) {
    fails.push('RELEASE BULLETIN: the same veteran fixture opened more than once: ' + JSON.stringify(releaseRepeat));
  }
  await waitDesktopValue('release rnSeen storage commit', `new Promise((resolve)=>{ const q=indexedDB.open('cf-v2-slice');
    q.onerror=()=>resolve(null); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readonly'),g=tx.objectStore('meta').get('save');
      g.onsuccess=()=>{ let rn=null; try{rn=JSON.parse(String(g.result||''))?.rn||null}catch{} db.close();
        resolve(rn===${JSON.stringify(RELEASE_FIXTURE_VERSION)}?rn:null); };
      g.onerror=()=>{db.close();resolve(null)}; }; })`);
  await navigateToSlice(sess, URL0, 'veteran release seen-state reload');
  const releaseReload = await waitDesktopValue('veteran release reload state', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return s.rnSeen===${JSON.stringify(RELEASE_FIXTURE_VERSION)}?s:null; })()`);
  if (releaseReload.panelOpen !== null || releaseReload.tutActive) {
    fails.push('RELEASE BULLETIN: seen fixture reopened automatically after reload: ' + JSON.stringify(releaseReload));
  }
  const releaseReloadRepeat = await evalIn(`(()=>{ const S=window.__CF_SLICE__; const opened=S.api.showReleaseFixture(${JSON.stringify(RELEASE_FIXTURE_VERSION)});
    const s=S.api.state(); return {opened,panel:s.panelOpen,rnSeen:s.rnSeen}; })()`);
  if (releaseReloadRepeat.opened || releaseReloadRepeat.panel !== null
    || releaseReloadRepeat.rnSeen !== RELEASE_FIXTURE_VERSION) {
    fails.push('RELEASE BULLETIN: persisted rnSeen did not suppress the fixture in a new document: '
      + JSON.stringify(releaseReloadRepeat));
  }

  /* 4c-keyboard-journey. One isolated desktop origin drives the complete
     keyboard route through the ordinary survey actions: canvas → galaxy
     card → Enter galaxy → star card → Enter system → Earth card → Land →
     Leave. It then repeats planetfall and proves Escape returns both
     navigation and focus. This avoids contaminating the main landing ledger. */
  const tk = await send('Target.createTarget', { url: 'about:blank' });
  const ak = await send('Target.attachToTarget', { targetId: tk.targetId, flatten: true });
  const ks = ak.sessionId;
  await send('Runtime.enable', {}, ks);
  await send('Page.enable', {}, ks);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, ks);
  await navigateToSlice(ks, URL4, 'desktop keyboard journey boot');
  await sleep(2500);
  const evalK = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, ks);
    if (r.exceptionDetails) throw new Error('keyboard journey eval threw: '
      + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const keyK = async (key, code = key) => {
    await dispatchKeyPress(ks, key, code);
    await sleep(60);
  };
  const waitK = async (label, expr, timeoutMs = 6000) => {
    const deadline = Date.now() + timeoutMs;
    let last = null;
    while (Date.now() < deadline) {
      last = await evalK(expr);
      if (last) return last;
      await sleep(50);
    }
    throw new Error(`${label} did not reach its keyboard outcome within ${timeoutMs}ms (last ${JSON.stringify(last)})`);
  };
  let lastCycleSeen = [];
  const cycleK = async (prefix, limit = 160) => {
    const seen = [];
    for (let i = 0; i < limit; i++) {
      const key = await evalK(`window.__CF_SLICE__.api.state().keyboardTarget`);
      if (typeof key === 'string' && key.startsWith(prefix)) return key;
      if (typeof key === 'string' && !seen.includes(key)) seen.push(key);
      await keyK('ArrowRight', 'ArrowRight');
    }
    lastCycleSeen = seen;
    return null;
  };
  await evalK(`(()=>{ document.querySelector('[data-sel=tutskip]')?.click(); return true; })()`);
  await sleep(250);
  await evalK(`(()=>{ document.querySelector('canvas')?.focus(); return true; })()`);
  const galaxyTarget = await cycleK('galaxy:999:90:-60');
  if (!galaxyTarget) fails.push('KEYBOARD JOURNEY: could not select the Milky Way from the canvas');
  await keyK('Enter', 'Enter');
  const kGalaxyCard = await waitK('keyboard Milky Way card', `(()=>{ const s=window.__CF_SLICE__.api.state(),a=document.querySelector('#survey [data-act=travel]');
    return s.mode==='universe'&&s.cardOpen?{label:a?.textContent||'',focus:document.activeElement===a}:null; })()`);
  if (kGalaxyCard.label !== 'Enter galaxy' || !kGalaxyCard.focus) {
    fails.push('KEYBOARD JOURNEY: galaxy survey did not focus its explicit Enter action: ' + JSON.stringify(kGalaxyCard));
  }
  await keyK('Enter', 'Enter');
  const kGalaxy = await waitK('keyboard enter galaxy', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return s.mode==='galaxy'&&s.gal===999?{focus:document.activeElement===document.querySelector('canvas'),target:s.keyboardTarget}:null; })()`);
  if (!kGalaxy.focus) fails.push('KEYBOARD JOURNEY: Enter galaxy did not return canvas focus: ' + JSON.stringify(kGalaxy));
  const solTarget = await cycleK('star:424242:560:170');
  if (!solTarget) fails.push('KEYBOARD JOURNEY: could not select Sol from the galaxy canvas; cycled ' + JSON.stringify(lastCycleSeen));
  await keyK('Enter', 'Enter');
  const kSolCard = await waitK('keyboard Sol card', `(()=>{ const s=window.__CF_SLICE__.api.state(),a=document.querySelector('#survey [data-act=travel]');
    return s.mode==='galaxy'&&s.cardOpen?{label:a?.textContent||'',focus:document.activeElement===a}:null; })()`);
  if (kSolCard.label !== 'Enter system' || !kSolCard.focus) {
    fails.push('KEYBOARD JOURNEY: star survey did not focus its explicit Enter action: ' + JSON.stringify(kSolCard));
  }
  await keyK('Enter', 'Enter');
  const kSystem = await waitK('keyboard enter Sol', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return s.mode==='system'&&s.star===424242?{focus:document.activeElement===document.querySelector('canvas'),target:s.keyboardTarget}:null; })()`);
  if (!kSystem.focus) fails.push('KEYBOARD JOURNEY: Enter system did not return canvas focus: ' + JSON.stringify(kSystem));
  const earthTarget = await cycleK('planet:424242:133');
  if (!earthTarget) fails.push('KEYBOARD JOURNEY: could not select Earth from the system canvas');
  await keyK('Enter', 'Enter');
  const kEarthCard = await waitK('keyboard Earth card', `(()=>{ const s=window.__CF_SLICE__.api.state(),a=document.querySelector('#survey [data-act=landcta]');
    return s.mode==='system'&&s.cardOpen?{title:s.cardTitle,label:a?.textContent?.trim()||'',focus:document.activeElement===a}:null; })()`);
  if (kEarthCard.title !== 'Earth' || !/Land/.test(kEarthCard.label) || !kEarthCard.focus) {
    fails.push('KEYBOARD JOURNEY: Earth survey did not focus Land: ' + JSON.stringify(kEarthCard));
  }
  await keyK('Enter', 'Enter');
  const kSurface = await waitK('keyboard Earth Land', `(()=>{ const s=window.__CF_SLICE__.api.state(),a=document.querySelector('#survey [data-act=leaveworld]');
    return s.mode==='surface'?{label:a?.textContent?.trim()||'',focus:document.activeElement===a,landed:s.save.landed}:null; })()`);
  if (kSurface.label !== '⬆ Leave world' || !kSurface.focus || !kSurface.landed.includes(133)) {
    fails.push('KEYBOARD JOURNEY: Land did not continue focus to Leave world: ' + JSON.stringify(kSurface));
  }
  await keyK('Enter', 'Enter');
  const kLeave = await waitK('keyboard Leave world', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return s.mode==='system'&&!s.cardOpen?{focus:document.activeElement===document.querySelector('canvas'),landed:s.save.landed}:null; })()`);
  if (!kLeave.focus || !kLeave.landed.includes(133)) {
    fails.push('KEYBOARD JOURNEY: Leave Enter did not return system/canvas focus: ' + JSON.stringify(kLeave));
  }
  const earthAgain = await cycleK('planet:424242:133');
  if (!earthAgain) fails.push('KEYBOARD JOURNEY: Earth could not be selected for the Escape continuity pass');
  await keyK('Enter', 'Enter');
  await waitK('keyboard repeat Earth card', `document.activeElement===document.querySelector('#survey [data-act=landcta]')`);
  await keyK('Enter', 'Enter');
  await waitK('keyboard repeat Earth surface', `document.activeElement===document.querySelector('#survey [data-act=leaveworld]')`);
  await keyK('Escape', 'Escape');
  const kEscape = await waitK('keyboard surface Escape', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return s.mode==='system'&&!s.cardOpen?{focus:document.activeElement===document.querySelector('canvas'),landed:s.save.landed}:null; })()`);
  if (!kEscape.focus || kEscape.landed.filter((seed) => seed === 133).length !== 1) {
    fails.push('KEYBOARD JOURNEY: Escape did not lift once, preserve credit, and return canvas focus: ' + JSON.stringify(kEscape));
  }
  const keyboardFocusCtl = await evalK(`(()=>{ const canvas=document.querySelector('canvas'),other=document.getElementById('dockguide');
    other.focus(); const failed=document.activeElement!==canvas; canvas.focus(); return {failed,restored:document.activeElement===canvas}; })()`);
  if (!keyboardFocusCtl.failed || !keyboardFocusCtl.restored) {
    fails.push('KEYBOARD JOURNEY CONTROL FAILED — moving focus off canvas stayed green: ' + JSON.stringify(keyboardFocusCtl));
  }

  /* DOM-1: exercise the real epoch snapshot path, not merely the clock helper.
     The page-local override advances the same performance.now() source the app
     already owns; navigation destroys it before the reload assertion. */
  await evalK(`new Promise((resolve)=>setTimeout(resolve,500))`);
  const epochAdvance = await evalK(`(()=>{
    const before=window.__CF_SLICE__.api.state().epoch;
    const realNow=performance.now.bind(performance);
    const hadOwnNow=Object.prototype.hasOwnProperty.call(performance,'now');
    const installed=Reflect.defineProperty(performance,'now',{
      configurable:true,value:()=>realNow()+1200000
    });
    const after=window.__CF_SLICE__.api.state().epoch;
    return {before,after,installed,hadOwnNow,own:Object.prototype.hasOwnProperty.call(performance,'now')};
  })()`);
  if (!epochAdvance.installed || !epochAdvance.own
    || epochAdvance.after !== epochAdvance.before + 1) {
    fails.push('EPOCH SNAPSHOT: the page-local 1200-second stimulus did not advance exactly one epoch: '
      + JSON.stringify(epochAdvance));
  }
  const epochPersisted = await evalK(`window.__CF_SLICE__.api.__smokePersistNow()`);
  if (epochPersisted !== true) {
    fails.push('EPOCH SNAPSHOT: the real persistView path rejected the advancing epoch snapshot');
  }
  const epochRaw = await evalK(READ_PRIMARY_EXPRESSION);
  let epochStored = null;
  try { epochStored = JSON.parse(epochRaw).epoch; }
  catch (error) {
    fails.push('EPOCH SNAPSHOT: persisted primary was not valid JSON: ' + String(error?.message || error));
  }
  await navigateToSlice(ks, URL4, 'advancing epoch snapshot reload');
  const epochReload = await evalK(`(()=>({
    epoch:window.__CF_SLICE__.api.state().epoch,
    own:Object.prototype.hasOwnProperty.call(performance,'now')
  }))()`);
  const epochReloaded = epochReload.epoch;
  const epochSnapshotOutcome = (before, live, stored, reloaded) =>
    live === before + 1 && stored === live && reloaded === live;
  if (!epochSnapshotOutcome(epochAdvance.before, epochAdvance.after, epochStored, epochReloaded)) {
    fails.push('EPOCH SNAPSHOT: live advance did not survive real IndexedDB persistence and reload: '
      + JSON.stringify({ ...epochAdvance, stored: epochStored, reloaded: epochReloaded }));
  }
  if (epochReload.own !== epochAdvance.hadOwnNow) {
    fails.push('EPOCH SNAPSHOT: the page-local performance.now shadow crossed the fresh-document boundary: '
      + JSON.stringify({ write: epochAdvance, reload: epochReload }));
  }
  if (epochSnapshotOutcome(epochAdvance.before, epochAdvance.after, epochAdvance.before, epochReloaded)) {
    fails.push('EPOCH SNAPSHOT CONTROL FAILED — substituting the immutable base for stored current() stayed green');
  }
  if (epochSnapshotOutcome(epochAdvance.before, epochAdvance.after, epochStored, epochAdvance.before)) {
    fails.push('EPOCH SNAPSHOT CONTROL FAILED — substituting the pre-advance epoch after reload stayed green');
  }
  await send('Target.closeTarget', { targetId: tk.targetId });

  /* 4c-lazy-focus. Hold the actual Vite species-art chunk at the HTTP
     response boundary, so this cannot become a lucky sleep around the idle
     prefetch. Keyboard-open Compendium while text rows are live, then release
     the exact module request and require the replacement close control to
     retain logical focus after portraits appear. */
  const tLazy = await send('Target.createTarget', { url: URL5 + 'seed.html' });
  const aLazy = await send('Target.attachToTarget', { targetId: tLazy.targetId, flatten: true });
  const lazy = aLazy.sessionId;
  await send('Runtime.enable', {}, lazy);
  await send('Page.enable', {}, lazy);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, lazy);
  let seedReady = false;
  for (let i = 0; i < 100 && !seedReady; i++) {
    try {
      const r = await send('Runtime.evaluate', { expression: `location.pathname==='/seed.html'&&document.readyState!=='loading'`, returnByValue: true }, lazy);
      seedReady = !r.exceptionDetails && r.result.value === true;
    } catch { /* navigation context not installed yet */ }
    if (!seedReady) await sleep(25);
  }
  if (!seedReady) throw new Error('lazy-art seed document did not become ready');
  const seedResult = await send('Runtime.evaluate', { expression: `new Promise((resolve,reject)=>{ const stores=${JSON.stringify([
    'meta', 'player', 'creatures', 'catalog', 'inventory', 'settings', 'journal', 'assetcache',
  ])},q=indexedDB.open('cf-v2-slice',1);
    q.onupgradeneeded=()=>{ const db=q.result; for(const store of stores) if(!db.objectStoreNames.contains(store)) db.createObjectStore(store); };
    q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readwrite');
      tx.objectStore('meta').put(${JSON.stringify(VETERAN_RAW)},'save'); tx.oncomplete=()=>{db.close();resolve(true)};
      tx.onerror=()=>reject(tx.error); }; })`, returnByValue: true, awaitPromise: true }, lazy);
  if (seedResult.exceptionDetails || seedResult.result.value !== true) {
    throw new Error('lazy-art veteran seed failed: ' + JSON.stringify(seedResult.exceptionDetails || seedResult.result));
  }
  await navigateToSlice(lazy, URL5, 'slow species-art veteran boot');
  const evalLazy = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, lazy);
    if (r.exceptionDetails) throw new Error('lazy-art eval threw: '
      + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const waitLazy = async (label, expr, timeoutMs = 8000) => {
    const deadline = Date.now() + timeoutMs;
    let last = null;
    while (Date.now() < deadline) {
      last = await evalLazy(expr);
      if (last) return last;
      await sleep(50);
    }
    throw new Error(`${label} did not reach its lazy-art outcome within ${timeoutMs}ms (last ${JSON.stringify(last)})`);
  };
  await evalLazy(`(()=>{ const opener=document.getElementById('railcodex'); opener.focus(); return true; })()`);
  await dispatchKeyPress(lazy, 'Enter', 'Enter');
  const lazyBefore = await waitLazy('slow Compendium keyboard open', `(()=>{ const s=window.__CF_SLICE__.api.state(),close=document.querySelector('#codexpanel [data-pnx]');
    const rows=[...document.querySelectorAll('#codexpanel [data-ci]')]; if(s.panelOpen!=='codex'||rows.length!==3)return null;
    window.__cfLazyOriginalClose=close; return {rows:rows.length,images:document.querySelectorAll('#codexpanel [data-ci] img').length,
      focus:document.activeElement===close}; })()`);
  let slowRequestObserved = false;
  for (let i = 0; i < 100 && !slowRequestObserved; i++) {
    slowRequestObserved = slowSpeciesRequests.length > 0;
    if (!slowRequestObserved) await sleep(25);
  }
  if (!slowRequestObserved || lazyBefore.images !== 0 || !lazyBefore.focus) {
    fails.push('COMPENDIUM LAZY FOCUS: chunk was not deterministically held before the focused text-only list: '
      + JSON.stringify({ slowRequestObserved, lazyBefore, held: slowSpeciesRequests.length }));
  }
  releaseSlowSpecies();
  const lazyAfter = await waitLazy('slow Compendium art refill', `(()=>{ const close=document.querySelector('#codexpanel [data-pnx]'),
    images=document.querySelectorAll('#codexpanel [data-ci] img').length,replaced=close!==window.__cfLazyOriginalClose;
    return images>=3&&replaced?{images,replaced,focus:document.activeElement===close}:null; })()`);
  if (!lazyAfter.focus) {
    fails.push('COMPENDIUM LAZY FOCUS: portrait refill replaced and lost the logical close focus: ' + JSON.stringify(lazyAfter));
  }
  const lazyFocusCtl = await evalLazy(`(()=>{ const close=document.querySelector('#codexpanel [data-pnx]'),other=document.getElementById('railcodex');
    other.focus(); const failed=document.activeElement!==close; close?.focus(); return {failed,restored:document.activeElement===close}; })()`);
  if (!lazyFocusCtl.failed || !lazyFocusCtl.restored) {
    fails.push('COMPENDIUM LAZY FOCUS CONTROL FAILED — moving focus off the refilled close stayed green: '
      + JSON.stringify(lazyFocusCtl));
  }
  await send('Target.closeTarget', { targetId: tLazy.targetId });

  /* 4d. THE PHONE LEG (emulated): 390×844 @ DPR 3, touch. The physical
     hand-feel stays Nick's; this catches layout, touch wiring and pinch. */
  const t2 = await send('Target.createTarget', { url: 'about:blank' });
  const at2 = await send('Target.attachToTarget', { targetId: t2.targetId, flatten: true });
  const ph = at2.sessionId;
  await send('Runtime.enable', {}, ph);
  await send('Page.enable', {}, ph);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, ph);
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, ph);
  await navigateToSlice(ph, URL0, 'phone veteran boot');
  await sleep(3000);
  const evalPh = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, ph);
    if (r.exceptionDetails) throw new Error('phone eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const phoneCanvasCheck = `(()=>{ const bad=[],canvas=document.querySelector('canvas'),S=window.__CF_SLICE__;
    if(!canvas||!S) return ['canvas/app missing']; const b=canvas.getBoundingClientRect();
    if(Math.abs(b.width-innerWidth)>1||Math.abs(b.height-innerHeight)>1) bad.push('canvas CSS box is not the viewport: '+JSON.stringify([b.width,b.height,innerWidth,innerHeight]));
    if(Math.abs(S.app.screen.width-innerWidth)>1||Math.abs(S.app.screen.height-innerHeight)>1) bad.push('Pixi logical screen is not the viewport');
    if(!(canvas.width>b.width&&canvas.height>b.height)) bad.push('phone backing store is not DPR-scaled');
    return bad; })()`;
  const phBoot = await evalPh(`({ canvas: !!document.querySelector('canvas'), name: window.__CF_SLICE__ ? window.__CF_SLICE__.api.state().save.name : null, w: innerWidth, density:${phoneCanvasCheck} })`);
  if (!phBoot.canvas) fails.push('PHONE: no canvas');
  if (phBoot.w !== 390) fails.push('PHONE: viewport not 390: ' + phBoot.w);
  if (phBoot.name !== 'Dakk') fails.push('PHONE: the veteran save did not follow across targets (IndexedDB): ' + JSON.stringify(phBoot.name));
  if (phBoot.density.length) fails.push('PHONE CANVAS DENSITY drift: ' + phBoot.density.join(' · '));
  const phDensityCtl = await evalPh(`(()=>{ const canvas=document.querySelector('canvas'),priorW=canvas.style.width,priorH=canvas.style.height;
    canvas.style.width=canvas.width+'px'; canvas.style.height=canvas.height+'px'; const bad=${phoneCanvasCheck};
    canvas.style.width=priorW; canvas.style.height=priorH; return bad; })()`);
  if (!phDensityCtl.some((finding) => finding.startsWith('canvas CSS box is not the viewport'))) {
    fails.push('PHONE CANVAS DENSITY CONTROL FAILED — injected DPR-sized CSS canvas stayed green: ' + JSON.stringify(phDensityCtl));
  }
  /* the phone golden: the FULL geometry contract runs here too — the
     player-chip/search overlap hid in a phone-only branch the first time */
  const phGeo = await evalPh(geoCheck);
  if (phGeo.length) fails.push('PHONE GOLDEN LAYOUT drift: ' + phGeo.join(' · '));
  /* The lower-phone stack has four independently-sized surfaces. Assert the
     rendered outcome, including the 4×2 intent and the actual hit target at
     every button centre; merely finding the CSS declarations missed the
     three-row overlap this guards. */
  const phoneChromeCheck = `(()=>{ const bad=[];
    const box=(id)=>{ const el=document.getElementById(id); if(!el) return null;
      const cs=getComputedStyle(el), b=el.getBoundingClientRect();
      if(cs.display==='none'||cs.visibility==='hidden'||b.width<1||b.height<1) return null;
      return { l:b.left,t:b.top,r:b.right,b:b.bottom,w:b.width,h:b.height }; };
    const surface=window.__CF_SLICE__?.api?.state?.().mode==='surface';
    const ids=[...(surface?['planetside']:[]),'ctxbar','hintpill','dock'];
    const boxes=Object.fromEntries(ids.map(id=>[id,box(id)]));
    for(const id of ids) if(!boxes[id]) bad.push(id+' is not visible');
    const overlaps=(a,b)=>a&&b&&a.l<b.r-1&&a.r>b.l+1&&a.t<b.b-1&&a.b>b.t+1;
    for(const [a,b] of [['planetside','ctxbar'],['planetside','hintpill'],['planetside','dock'],['ctxbar','hintpill'],['ctxbar','dock'],['hintpill','dock']]) {
      if(overlaps(boxes[a],boxes[b])) bad.push(a+' overlaps '+b);
    }
    const dock=document.getElementById('dock');
    const buttons=[...dock.querySelectorAll('button')].filter((button)=>box(button.id));
    if(buttons.length!==8) bad.push('dock does not expose eight buttons: '+buttons.length);
    const rows=[];
    for(const button of buttons){ const b=button.getBoundingClientRect();
      let row=rows.find((candidate)=>Math.abs(candidate.top-b.top)<2);
      if(!row){ row={top:b.top,n:0}; rows.push(row); } row.n++;
      if(Math.abs(b.width-44)>1||Math.abs(b.height-44)>1) bad.push(button.id+' is not a 44px target');
      const hit=document.elementFromPoint((b.left+b.right)/2,(b.top+b.bottom)/2);
      if(!hit||!button.contains(hit)) bad.push(button.id+' is not hit-testable at its centre');
    }
    rows.sort((a,b)=>a.top-b.top);
    if(rows.length!==2||rows.some((row)=>row.n!==4)) bad.push('dock is not 4x2: '+JSON.stringify(rows.map((row)=>row.n)));
    if(boxes.dock&&(Math.abs(boxes.dock.w-206)>1||Math.abs(boxes.dock.h-98)>1)) bad.push('dock box is not 206x98: '+JSON.stringify([boxes.dock.w,boxes.dock.h]));
    const published=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-h'));
    if(!boxes.dock||!Number.isFinite(published)||Math.abs(published-boxes.dock.h)>1) bad.push('--dock-h does not match the rendered dock: '+JSON.stringify([published,boxes.dock&&boxes.dock.h]));
    const ctxPublished=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ctx-h'));
    if(!boxes.ctxbar||!Number.isFinite(ctxPublished)||Math.abs(ctxPublished-boxes.ctxbar.h)>1) bad.push('--ctx-h does not match the rendered caption: '+JSON.stringify([ctxPublished,boxes.ctxbar&&boxes.ctxbar.h]));
    return bad; })()`;
  const phChrome = await evalPh(phoneChromeCheck);
  if (phChrome.length) fails.push('PHONE LOWER CHROME drift: ' + phChrome.join(' · '));
  /* Discriminating control: recreate the reported failure by pinning the
     hint into the dock. The outcome checker must turn red, then the inline
     override is removed before the visual record and touch leg continue. */
  const phChromeCtl = await evalPh(`(()=>{ const h=document.getElementById('hintpill'), prev=h.style.bottom;
    h.style.bottom='12px'; const bad=${phoneChromeCheck}; h.style.bottom=prev; return bad; })()`);
  if (!phChromeCtl.some((b) => b === 'hintpill overlaps dock')) {
    fails.push('PHONE LOWER CHROME CONTROL FAILED — an injected hint/dock overlap went unseen: ' + JSON.stringify(phChromeCtl));
  }
  /* Settings import is a true modal outcome. It must cover the high-z phone
     dock, own focus, and consume Escape instead of letting the world behind it
     close a card or ascend. Recreate the old z=11 layering as the control. */
  const phoneImportModalCheck = `(()=>{ const sheet=document.getElementById('importsheet'),dock=document.getElementById('dock'),probe=document.getElementById('dockguide');
    if(!sheet||!dock||!probe) return {ok:false,why:'missing'};
    const b=probe.getBoundingClientRect(),x=(b.left+b.right)/2,y=(b.top+b.bottom)/2,hit=document.elementFromPoint(x,y);
    const ss=getComputedStyle(sheet),ds=getComputedStyle(dock),visible=ss.display!=='none'&&ss.visibility!=='hidden';
    const blocked=!!hit&&sheet.contains(hit),focus=document.activeElement&&document.activeElement.id;
    return {ok:visible&&blocked&&Number(ss.zIndex)>Number(ds.zIndex)&&focus==='importtext',visible,blocked,focus,
      sheetZ:ss.zIndex,dockZ:ds.zIndex,hit:hit&&(hit.id||hit.tagName),mode:window.__CF_SLICE__.api.state().mode}; })()`;
  await evalPh(`(()=>{ document.getElementById('docksets').click(); document.getElementById('setimport').click(); return true; })()`);
  const phoneImportModal = await evalPh(phoneImportModalCheck);
  if (!phoneImportModal.ok) {
    fails.push('PHONE SETTINGS IMPORT: modal did not own focus/stacking over the dock: ' + JSON.stringify(phoneImportModal));
  }
  const phoneImportModalCtl = await evalPh(`(()=>{ const sheet=document.getElementById('importsheet'),dock=document.getElementById('dock'),
    prior=sheet.style.zIndex,priorInert=dock.inert,priorHidden=dock.getAttribute('aria-hidden');
    dock.inert=false;dock.removeAttribute('aria-hidden');sheet.style.zIndex='11'; const result=${phoneImportModalCheck};
    sheet.style.zIndex=prior;dock.inert=priorInert;if(priorHidden===null)dock.removeAttribute('aria-hidden');else dock.setAttribute('aria-hidden',priorHidden);return result; })()`);
  if (phoneImportModalCtl.ok || phoneImportModalCtl.blocked) {
    fails.push('PHONE SETTINGS IMPORT CONTROL FAILED — injected low-z modal still blocked the dock: ' + JSON.stringify(phoneImportModalCtl));
  }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', modifiers: 8 }, ph);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', modifiers: 8 }, ph);
  const phoneImportShiftWrap = await evalPh(`document.activeElement&&document.activeElement.id`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' }, ph);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab' }, ph);
  const phoneImportForwardWrap = await evalPh(`document.activeElement&&document.activeElement.id`);
  if (phoneImportShiftWrap !== 'importclose' || phoneImportForwardWrap !== 'importtext') {
    fails.push('PHONE SETTINGS IMPORT: modal focus did not wrap internally: '
      + JSON.stringify([phoneImportShiftWrap, phoneImportForwardWrap]));
  }
  const phoneImportMode = phoneImportModal.mode;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, ph);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, ph);
  const phoneImportClosed = await evalPh(`(()=>{ const sheet=document.getElementById('importsheet'),s=window.__CF_SLICE__.api.state();
    return {closed:sheet.style.display==='none',mode:s.mode,focus:document.activeElement&&document.activeElement.id}; })()`);
  if (!phoneImportClosed.closed || phoneImportClosed.mode !== phoneImportMode || phoneImportClosed.focus !== 'docksets') {
    fails.push('PHONE SETTINGS IMPORT: Escape did not close only the modal and restore focus: ' + JSON.stringify(phoneImportClosed));
  }
  /* A high-z panel that merely fits the viewport can still bury the dock's
     top row. Open the real Guide at 390×844 and compare rendered rectangles;
     the shared panel cap must leave a visible gap above the measured dock. */
  const phoneGuideClearanceCheck = `(()=>{ const panel=document.getElementById('guidepanel'),dock=document.getElementById('dock');
    if(!panel||!dock) return {ok:false,why:'missing'};
    const p=panel.getBoundingClientRect(),d=dock.getBoundingClientRect(),cs=getComputedStyle(panel);
    const visible=cs.display!=='none'&&cs.visibility!=='hidden'&&p.width>0&&p.height>0;
    const gap=d.top-p.bottom;
    return {ok:visible&&gap>=8,visible,gap,maxHeight:cs.maxHeight,
      panel:{top:p.top,bottom:p.bottom,height:p.height},dock:{top:d.top,bottom:d.bottom,height:d.height}}; })()`;
  await evalPh(`(()=>{ document.getElementById('dockguide').click(); return true; })()`);
  const phoneGuideClearance = await evalPh(phoneGuideClearanceCheck);
  if (!phoneGuideClearance.ok) {
    fails.push('PHONE GUIDE CLEARANCE: the open panel does not clear the measured dock by 8px: ' + JSON.stringify(phoneGuideClearance));
  }
  /* Recreate the superseded shared-panel cap exactly. With the full seven
     topics it extends over the dock; the same rectangle checker must turn
     red before the current cap is restored. */
  const phoneGuideClearanceCtl = await evalPh(`(()=>{ const panel=document.getElementById('guidepanel'),prior=panel.style.maxHeight;
    panel.style.maxHeight='calc(100vh - var(--topbar-h) - 96px)'; const result=${phoneGuideClearanceCheck};
    panel.style.maxHeight=prior; return result; })()`);
  if (phoneGuideClearanceCtl.ok || !(phoneGuideClearanceCtl.gap < 0)) {
    fails.push('PHONE GUIDE CLEARANCE CONTROL FAILED — the injected old max-height did not reproduce dock overlap: '
      + JSON.stringify(phoneGuideClearanceCtl));
  }
  await evalPh(`(()=>{ document.querySelector('#guidepanel [data-pnx]').click(); return true; })()`);
  const phPainted = await evalPh(`(async()=>{ const S=window.__CF_SLICE__;
    const px=await S.app.renderer.extract.pixels({ target: S.app.stage, frame: S.app.renderer.screen });
    const d=px.pixels||px; let lit=0; for(let i=0;i<d.length;i+=4){ if(d[i]+d[i+1]+d[i+2]>60) lit++; } return lit; })()`);
  if (!(phPainted > 300)) fails.push('PHONE: stage nearly blank — ' + phPainted);
  /* pinch: two fingers spread → camT.z must grow (the touch input path, live) */
  const z0 = await evalPh(`window.__CF_SLICE__.camT.z`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 400, id: 1 }, { x: 240, y: 400, id: 2 }] }, ph);
  for (let s = 1; s <= 4; s++) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 150 - s * 15, y: 400, id: 1 }, { x: 240 + s * 15, y: 400, id: 2 }] }, ph);
    await sleep(40);
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, ph);
  await sleep(300);
  const z1 = await evalPh(`window.__CF_SLICE__.camT.z`);
  if (!(z1 > z0 * 1.15)) fails.push('PHONE: pinch-out did not zoom (z ' + z0 + ' → ' + z1 + ')');
  const shotPh = await send('Page.captureScreenshot', { format: 'png' }, ph);
  fs.writeFileSync(screenshotPath('phone'), Buffer.from(shotPh.data, 'base64'));

  /* 4d1. MOBILE SURVEY DESCENT: the fixed survey card can cover the body
     that opened it, so the canonical dive is its explicit 44px action. Drive
     both the body and that button with real browser touch input at 390×844. */
  const tNav = await send('Target.createTarget', { url: 'about:blank' });
  const aNav = await send('Target.attachToTarget', { targetId: tNav.targetId, flatten: true });
  const navPh = aNav.sessionId;
  await send('Runtime.enable', {}, navPh);
  await send('Page.enable', {}, navPh);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, navPh);
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, navPh);
  await navigateToSlice(navPh, URL3, 'fresh-phone navigation boot');
  await sleep(3000);
  const evalNavPh = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, navPh);
    if (r.exceptionDetails) throw new Error('phone navigation eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const waitNavPhValue = async (label, expr, timeoutMs = 6000) => {
    const deadline = Date.now() + timeoutMs;
    let last = null;
    while (Date.now() < deadline) {
      last = await evalNavPh(expr);
      if (last) return last;
      await sleep(50);
    }
    throw new Error(`${label} did not reach its phone outcome within ${timeoutMs}ms (last ${JSON.stringify(last)})`);
  };
  await evalNavPh(`(()=>{ document.querySelector('[data-sel=tutskip]').click(); return true; })()`);
  const freshOriginReady = await waitNavPhValue('fresh empty-surface setup', `(()=>{ const s=window.__CF_SLICE__.api.state();
    return !s.tutActive&&s.codexCount===0?{tutActive:s.tutActive,codexCount:s.codexCount,mode:s.mode}:null; })()`);
  /* This origin is genuinely fresh: prove the empty Compendium and Journal
     surfaces render the honest read-only boundary. The veteran desktop
     origin cannot exercise an empty-state outcome. */
  const freshEmptyCopy = await evalNavPh(`(()=>{ document.getElementById('dockcodex')?.click();
    const codex=document.querySelector('#codexpanel .empty')?.textContent||'';
    const codexOpen=window.__CF_SLICE__.api.state().panelOpen;
    document.querySelector('#codexpanel [data-pnx]')?.click();document.getElementById('dockrecords')?.click();
    const journal=document.querySelector('#recpanel [data-sel="journal-empty"]')?.textContent||'';
    const journalOpen=window.__CF_SLICE__.api.state().panelOpen;
    document.querySelector('#recpanel [data-pnx]')?.click();return {codex,journal,codexOpen,journalOpen};})()`);
  if (freshOriginReady.tutActive || freshOriginReady.codexCount !== 0
    || freshEmptyCopy.codexOpen !== 'codex' || freshEmptyCopy.journalOpen !== 'rec'
    || !/imported discoveries appear here/i.test(freshEmptyCopy.codex) || /fills as you discover/i.test(freshEmptyCopy.codex)
    || !/live Journal writing is not connected/i.test(freshEmptyCopy.journal) || /writes itself/i.test(freshEmptyCopy.journal)) {
    fails.push('FRESH READ-ONLY SURFACES: empty Compendium/Journal copy promises unported writers: ' + JSON.stringify(freshEmptyCopy));
  }
  const phoneGalaxyPoint = await evalNavPh(`(()=>{ const S=window.__CF_SLICE__;
    const p=S.world.toGlobal({x:90,y:-60}); return {x:p.x,y:p.y}; })()`);
  const phoneGalaxyX = phoneGalaxyPoint.x, phoneGalaxyY = phoneGalaxyPoint.y;
  const phoneBodyProbe = await evalNavPh(`(()=>{ const S=window.__CF_SLICE__,canvas=document.querySelector('canvas');
    const el=document.elementFromPoint(${phoneGalaxyX},${phoneGalaxyY});
    window.__cfPhoneBodyEvents=[];
    for(const type of ['pointerdown','pointerup','pointercancel']) canvas.addEventListener(type,(event)=>{
      window.__cfPhoneBodyEvents.push({type,eventX:event.clientX,eventY:event.clientY,pointerType:event.pointerType});
    },{once:true,capture:true});
    return {point:{x:${phoneGalaxyX},y:${phoneGalaxyY}},element:el&&[el.tagName,el.id,el.className],
      canvasPointer:getComputedStyle(canvas).pointerEvents,
      training:S.api.state().tutActive}; })()`);
  const touchNav = async (x, y) => {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }, navPh);
    await sleep(80);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, navPh);
  };
  await touchNav(phoneGalaxyX, phoneGalaxyY);
  await sleep(400);
  const phoneTravelCheck = `(()=>{ const state=window.__CF_SLICE__.api.state();
    const button=document.querySelector('#survey [data-act=travel]');
    if(!button) return {state,ok:false,why:'missing',bodyEvents:window.__cfPhoneBodyEvents||[]}; const b=button.getBoundingClientRect();
    const hit=document.elementFromPoint((b.left+b.right)/2,(b.top+b.bottom)/2);
    return {state,ok:b.width>0&&b.height>=44&&!!hit&&button.contains(hit),label:button.textContent,
      x:(b.left+b.right)/2,y:(b.top+b.bottom)/2,h:b.height,
      bodyHit:(document.elementFromPoint(${phoneGalaxyX},${phoneGalaxyY})||{}).id||''}; })()`;
  const phoneTravel = await evalNavPh(phoneTravelCheck);
  if (phoneTravel.state.mode !== 'universe' || !phoneTravel.state.cardOpen || !phoneTravel.ok
    || phoneTravel.label !== 'Enter galaxy') {
    fails.push('PHONE TRAVEL: one touch did not expose a reachable galaxy action without teleporting: '
      + JSON.stringify({ phoneBodyProbe, phoneTravel }));
  }
  if (phoneTravel.ok) {
    const phoneTravelCtl = await evalNavPh(`(()=>{ const button=document.querySelector('#survey [data-act=travel]');
      const prior=button.style.pointerEvents; button.style.pointerEvents='none'; const result=${phoneTravelCheck};
      button.style.pointerEvents=prior; return result; })()`);
    if (phoneTravelCtl.ok) fails.push('PHONE TRAVEL CONTROL FAILED — injected buried action stayed green: ' + JSON.stringify(phoneTravelCtl));
  }
  if (phoneTravel.ok) {
    await touchNav(phoneTravel.x, phoneTravel.y);
  }
  await sleep(2500);
  const phoneDive = await evalNavPh(`window.__CF_SLICE__.api.state()`);
  if (phoneDive.mode !== 'galaxy' || phoneDive.gal !== 999 || phoneDive.galX !== 90 || phoneDive.galY !== -60) {
    fails.push('PHONE TRAVEL: touching the visible card action did not enter the exact Milky Way node: '
      + JSON.stringify([phoneDive.mode, phoneDive.gal, phoneDive.galX, phoneDive.galY]));
  }

  /* 4d1-planetfall. Touch devices need a complete round trip, not merely a
     way down: survey Earth, touch the real 44px Land action, then touch the
     surface card's real 44px Leave-world action back to system. A desktop
     Escape assertion cannot prove either control exists or can be reached. */
  await evalNavPh(`(()=>{ return window.__CF_SLICE__.api.descendSystem(${JSON.stringify(SOL_STAR)}); })()`);
  await waitNavPhValue('phone Sol setup', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.mode==='system'&&s.star===424242?s:null; })()`);
  await evalNavPh(`(()=>{ return window.__CF_SLICE__.api.surveyOn(${JSON.stringify(EARTH)}); })()`);
  /* Help requested from an open body card must be readable above that card.
     Global panel z cannot change because Training relies on Atlas below the
     survey; prove the Guide-specific z24 layer and recreate z22 as control. */
  const phoneGuideOverCardCheck = `(()=>{ const guide=document.getElementById('guidepanel'),survey=document.getElementById('survey');
    if(!guide||!survey) return {ok:false,why:'missing'}; const g=guide.getBoundingClientRect(),s=survey.getBoundingClientRect();
    const l=Math.max(g.left,s.left),r=Math.min(g.right,s.right),t=Math.max(g.top,s.top),b=Math.min(g.bottom,s.bottom);
    if(!(r>l&&b>t)) return {ok:false,why:'no-overlap',guide:{x:g.x,y:g.y,w:g.width,h:g.height},survey:{x:s.x,y:s.y,w:s.width,h:s.height}};
    const x=(l+r)/2,y=(t+b)/2,hit=document.elementFromPoint(x,y),gz=Number(getComputedStyle(guide).zIndex),sz=Number(getComputedStyle(survey).zIndex);
    return {ok:guide.style.display!=='none'&&gz>sz&&!!hit&&guide.contains(hit),x,y,gz,sz,
      hit:hit&&(hit.id||hit.getAttribute&&hit.getAttribute('data-guide-topic')||hit.tagName)}; })()`;
  await evalNavPh(`(()=>{ document.getElementById('dockguide').click(); return true; })()`);
  const phoneGuideOverCard = await evalNavPh(phoneGuideOverCardCheck);
  if (!phoneGuideOverCard.ok) {
    fails.push('PHONE GUIDE LAYER: Guide did not render above a real Earth survey card: ' + JSON.stringify(phoneGuideOverCard));
  }
  const phoneGuideOverCardCtl = await evalNavPh(`(()=>{ const guide=document.getElementById('guidepanel'),prior=guide.style.zIndex;
    guide.style.zIndex='22'; const result=${phoneGuideOverCardCheck}; guide.style.zIndex=prior; return result; })()`);
  if (phoneGuideOverCardCtl.ok || !(phoneGuideOverCardCtl.gz < phoneGuideOverCardCtl.sz)) {
    fails.push('PHONE GUIDE LAYER CONTROL FAILED — injected z22 Guide stayed above the survey: ' + JSON.stringify(phoneGuideOverCardCtl));
  }
  await evalNavPh(`(()=>{ document.querySelector('#guidepanel [data-pnx]').click(); return true; })()`);
  const phoneCardActionCheck = (act) => `(()=>{ const S=window.__CF_SLICE__,state=S.api.state();
    const button=document.querySelector('#survey [data-act="${act}"]');
    if(!button) return {state,ok:false,why:'missing'};
    const b=button.getBoundingClientRect(),x=(b.left+b.right)/2,y=(b.top+b.bottom)/2;
    const hit=document.elementFromPoint(x,y);
    return {state,ok:b.width>0&&b.height>=44&&!!hit&&button.contains(hit),label:(button.textContent||'').trim(),
      x,y,w:b.width,h:b.height,hit:hit&&(hit.id||hit.getAttribute&&hit.getAttribute('data-act')||hit.tagName)}; })()`;
  const phoneLand = await evalNavPh(phoneCardActionCheck('landcta'));
  if (phoneLand.state.mode !== 'system' || !phoneLand.state.cardOpen || !phoneLand.ok || !/Land/.test(phoneLand.label)) {
    fails.push('PHONE PLANETFALL: Earth did not expose a reachable 44px Land action: ' + JSON.stringify(phoneLand));
  }
  if (phoneLand.ok) await touchNav(phoneLand.x, phoneLand.y);
  const phoneSurface = await waitNavPhValue('phone Earth landing', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.mode==='surface'?s:null; })()`);
  if (!phoneSurface.save.landed.includes(133) || !phoneSurface.objective.includes('1 / 2')) {
    fails.push('PHONE PLANETFALL: touch landing did not bank exactly the first Earth outcome: ' + JSON.stringify(phoneSurface));
  }
  const phoneLeave = await evalNavPh(phoneCardActionCheck('leaveworld'));
  if (!phoneLeave.ok || phoneLeave.label !== '⬆ Leave world') {
    fails.push('PHONE PLANETFALL: surface did not expose its exact reachable 44px Leave-world action: ' + JSON.stringify(phoneLeave));
  }
  /* Both failure directions are required. Missing: remove the routing
     attribute without moving geometry. Buried: keep the element but make its
     centre click through. Restore each mutation before the real touch. */
  if (phoneLeave.ok) {
    const phoneLeaveMissingCtl = await evalNavPh(`(()=>{ const button=document.querySelector('#survey [data-act="leaveworld"]');
      button.removeAttribute('data-act'); const result=${phoneCardActionCheck('leaveworld')};
      button.setAttribute('data-act','leaveworld'); return result; })()`);
    if (phoneLeaveMissingCtl.ok || phoneLeaveMissingCtl.why !== 'missing') {
      fails.push('PHONE LEAVE CONTROL FAILED — an injected missing action stayed green: ' + JSON.stringify(phoneLeaveMissingCtl));
    }
    const phoneLeaveBuriedCtl = await evalNavPh(`(()=>{ const button=document.querySelector('#survey [data-act="leaveworld"]'),prior=button.style.pointerEvents;
      button.style.pointerEvents='none'; const result=${phoneCardActionCheck('leaveworld')};
      button.style.pointerEvents=prior; return result; })()`);
    if (phoneLeaveBuriedCtl.ok) {
      fails.push('PHONE LEAVE CONTROL FAILED — an injected buried action stayed green: ' + JSON.stringify(phoneLeaveBuriedCtl));
    }
    await touchNav(phoneLeave.x, phoneLeave.y);
  }
  const phoneLifted = await waitNavPhValue('phone Leave-world return', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.mode==='system'?s:null; })()`);
  if (phoneLifted.cardOpen || !phoneLifted.save.landed.includes(133) || !phoneLifted.objective.includes('1 / 2')) {
    fails.push('PHONE PLANETFALL: Leave world changed landing credit or left the surface card open: ' + JSON.stringify(phoneLifted));
  }
  /* The HUD/Guide also promise Escape as a lift-off path. Re-land without a
     second reward, then prove ONE Escape consumes the open surface card and
     ascends in the same action rather than merely hiding the card. */
  await evalNavPh(`(()=>{ return window.__CF_SLICE__.api.surveyOn(${JSON.stringify(EARTH)}); })()`);
  const phoneReland = await evalNavPh(phoneCardActionCheck('landcta'));
  if (!phoneReland.ok) fails.push('PHONE ESCAPE LIFT: repeat Earth card lost its Land action: ' + JSON.stringify(phoneReland));
  else await touchNav(phoneReland.x, phoneReland.y);
  await waitNavPhValue('phone repeat Earth landing', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.mode==='surface'&&s.cardOpen?s:null; })()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, navPh);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, navPh);
  const phoneEscapeLifted = await waitNavPhValue('phone single-Escape lift', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.mode==='system'?s:null; })()`);
  if (phoneEscapeLifted.cardOpen || !phoneEscapeLifted.objective.includes('1 / 2')) {
    fails.push('PHONE ESCAPE LIFT: one Escape did not lift cleanly or repeat landing paid again: ' + JSON.stringify(phoneEscapeLifted));
  }
  /* Canvas focus deliberately arms a keyboard target. The first Escape
     releases that target; the next one performs the mode ascent. */
  if (await evalNavPh(`window.__CF_SLICE__.api.state().keyboardTarget!==null`)) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, navPh);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, navPh);
  }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, navPh);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, navPh);
  await waitNavPhValue('phone return to galaxy after planetfall', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.mode==='galaxy'?s:null; })()`);

  /* 4d0-charter. Drive a REAL non-Sol fine-star body and card action while
     this phone origin is still stage 0. The action must flow through the
     Charter gate, remain in the galaxy, and name the honest unavailable
     boundary. This catches a handler that teleports directly around
     descendSystem(). */
  await evalNavPh(`(()=>{ const S=window.__CF_SLICE__; S.camT.x=0; S.camT.y=0; S.camT.z=2;
    S.cam.x=0; S.cam.y=0; S.cam.z=2; return true; })()`);
  await sleep(1600);
  const blockedFineTarget = await evalNavPh(`window.__CF_SLICE__.api.fineStarTarget()`);
  const blockedFineProbe = await evalNavPh(`window.__CF_SLICE__.api.fineStarProbe()`);
  if (!blockedFineTarget) {
    fails.push('CHARTER ACTION SETUP found no real fine-star target: '
      + JSON.stringify({ blockedFineTarget, blockedFineProbe }));
  }
  if (blockedFineTarget) await touchNav(blockedFineTarget.screenX, blockedFineTarget.screenY);
  await sleep(400);
  const blockedFineSurvey = await evalNavPh(`({state:window.__CF_SLICE__.api.state(),travel:${travelCheck}})`);
  if (!blockedFineTarget || blockedFineSurvey.state.mode !== 'galaxy'
    || !blockedFineSurvey.state.cardOpen || !blockedFineSurvey.travel.ok
    || blockedFineSurvey.travel.label !== 'Enter system') {
    fails.push('CHARTER ACTION SETUP did not expose the real fine-star action without teleporting: '
      + JSON.stringify({ blockedFineTarget, blockedFineSurvey }));
  }
  if (blockedFineSurvey.travel.ok) await touchNav(blockedFineSurvey.travel.x, blockedFineSurvey.travel.y);
  await sleep(350);
  const blockedFineDive = await evalNavPh(`window.__CF_SLICE__.api.state()`);
  if (blockedFineDive.mode !== 'galaxy' || blockedFineDive.gal !== 999 || blockedFineDive.star !== null || blockedFineDive.stage !== 0
    || !blockedFineDive.toastOn || !/development slice/i.test(blockedFineDive.toastText)
    || /shipyard|\bbuild\b|mine|fabricat/i.test(blockedFineDive.toastText)) {
    fails.push('CHARTER ACTION BYPASS — a real stage-0 fine-star card action was not blocked: '
      + JSON.stringify(blockedFineDive));
  }

  /* 4d1-fine. Import the stage-2 veteran on this isolated origin, rise back
     to the home galaxy, and drive one deterministic visible fine star with
     real touch. This is the negative control for the old one-tap teleport. */
  const phoneImportToken = await sliceToken(navPh);
  try { await evalNavPh(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(VETERAN_ARRAY_RAW)})`); }
  catch { /* successful import reloads and destroys the evaluation context */ }
  await waitForSlice(navPh, 'fresh-phone veteran import', { previousToken: phoneImportToken });
  await sleep(2800);
  for (let i = 0; i < 2; i++) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, navPh);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, navPh);
    await sleep(800);
  }
  const fineGalaxy = await evalNavPh(`window.__CF_SLICE__.api.state()`);
  if (fineGalaxy.mode !== 'galaxy' || fineGalaxy.gal !== 999 || fineGalaxy.stage < 2) {
    fails.push('FINE STAR SETUP did not reach a veteran-chartered Milky Way: '
      + JSON.stringify([fineGalaxy.mode, fineGalaxy.gal, fineGalaxy.stage]));
  }
  await evalNavPh(`(()=>{ const S=window.__CF_SLICE__; S.camT.x=0; S.camT.y=0; S.camT.z=2;
    S.cam.x=0; S.cam.y=0; S.cam.z=2; return true; })()`);
  await sleep(1600);
  const fineTarget = await evalNavPh(`window.__CF_SLICE__.api.fineStarTarget()`);
  const fineProbe = await evalNavPh(`window.__CF_SLICE__.api.fineStarProbe()`);
  if (!fineTarget || !(fineTarget.width > 0) || !(fineTarget.height > 0)) {
    fails.push('FINE STAR SETUP found no visible hit-testable deterministic target: '
      + JSON.stringify({ fineTarget, fineProbe }));
  }
  if (fineTarget) await touchNav(fineTarget.screenX, fineTarget.screenY);
  await sleep(400);
  const fineSurvey = await evalNavPh(`({state:window.__CF_SLICE__.api.state(),travel:${travelCheck}})`);
  if (!fineTarget || fineSurvey.state.mode !== 'galaxy' || !fineSurvey.state.cardOpen
    || !fineSurvey.travel.ok || fineSurvey.travel.label !== 'Enter system') {
    fails.push('FINE STAR SURVEY-FIRST broken — one touch teleported or lacked its action: '
      + JSON.stringify({ fineTarget, fineSurvey }));
  }
  if (fineSurvey.travel.ok) {
    const fineTravelCtl = await evalNavPh(`(()=>{ const button=document.querySelector('#survey [data-act=travel]');
      const prior=button.style.pointerEvents; button.style.pointerEvents='none'; const result=${travelCheck};
      button.style.pointerEvents=prior; return result; })()`);
    if (fineTravelCtl.ok) fails.push('FINE STAR ACTION CONTROL FAILED — injected buried action stayed green: ' + JSON.stringify(fineTravelCtl));
    await touchNav(fineSurvey.travel.x, fineSurvey.travel.y);
  }
  await sleep(1800);
  const fineDive = await evalNavPh(`window.__CF_SLICE__.api.state()`);
  const canonicalFineTarget = fineTarget ? {
    ...fineTarget,
    x: Math.round(fineTarget.x * 100) / 100,
    y: Math.round(fineTarget.y * 100) / 100,
  } : null;
  if (!fineTarget || fineDive.mode !== 'system' || fineDive.star !== fineTarget.seed
    || fineDive.starX !== canonicalFineTarget.x || fineDive.starY !== canonicalFineTarget.y) {
    fails.push('FINE STAR ACTION did not enter the exact touched target: '
      + JSON.stringify({ fineDive, fineTarget, canonicalFineTarget }));
  }
  /* A saved stage-3 explorer may still meet its imported Prime Signature
     radius boundary. That is not a Charter-system gate: the block must name
     the saved radius and its unavailable expansion without promising that
     Signatures can be collected or written. First create a real ordinary
     Charted toast, then immediately drive the rejected CF1 action: boundary
     copy must supersede it rather than ambient-toast debounce swallowing it. */
  const stage3Token = await sliceToken(navPh);
  try { await evalNavPh(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(VETERAN_STAGE3_RAW)})`); }
  catch { /* successful replacement reloads */ }
  await waitForSlice(navPh, 'stage-3 low-signature route fixture', { previousToken: stage3Token });
  await sleep(2400);
  for (let i = 0; i < 3; i++) {
    if (await evalNavPh(`window.__CF_SLICE__.api.state().mode`) === 'system') break;
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }, navPh);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }, navPh);
    await sleep(350);
  }
  const stage3Charted = await evalNavPh(`(()=>{ const S=window.__CF_SLICE__,before=S.api.state();
    const setup=before.mode==='system'&&S.api.surveyOn(${JSON.stringify(MERCURY)}),add=document.querySelector('#survey [data-act=add]');
    add?.click(); const after=S.api.state();
    return {setup:!!setup,add:!!add,mode:after.mode,toast:after.toastText,toastSerial:after.toastSerial}; })()`);
  if (!stage3Charted.setup || !stage3Charted.add || !/Charted/i.test(stage3Charted.toast)) {
    fails.push('PRIME RADIUS BOUNDARY TOAST SETUP did not produce the real ordinary Charted toast: '
      + JSON.stringify(stage3Charted));
  }
  await evalNavPh(`(()=>{ const s=document.getElementById('searchbox');s.value=${JSON.stringify(String(blockedShareCode))};s.focus();return true;})()`);
  await dispatchKeyPress(navPh, 'Enter', 'Enter');
  await sleep(80);
  const stage3PrimeRadiusBoundaryCheck = `(()=>{ const s=window.__CF_SLICE__.api.state(),q=document.getElementById('searchbox'),toast=s.toastText||'';return {
    ok:s.mode===${JSON.stringify(stage3Charted.mode)}&&s.stage===3&&/Beyond Your Saved Reach/i.test(toast)
      &&/Your saved Prime Signature radius ends here/i.test(toast)
      &&/Prime Signature radius expansion is not available in this development slice/i.test(toast)
      &&!/collect|earn|award|write|next Charter system|Intergalactic Drive|shipyard|\\bbuild\\b|mine|fabricat/i.test(toast)
      &&q.value===${JSON.stringify(String(blockedShareCode))}&&document.activeElement===q,
    mode:s.mode,stage:s.stage,toast,toastSerial:s.toastSerial,query:q.value,focus:document.activeElement===q};})()`;
  const stage3Reach = await evalNavPh(stage3PrimeRadiusBoundaryCheck);
  if (!stage3Reach.ok || stage3Reach.toastSerial !== stage3Charted.toastSerial + 1) {
    fails.push('STAGE-3 PRIME RADIUS: immediate blocked CF1 did not replace ordinary copy with the honest saved-radius boundary: '
      + JSON.stringify({ charted: stage3Charted, blocked: stage3Reach }));
  }
  const stage3BoundaryCtl = await evalNavPh(`(()=>{ const toast=document.getElementById('toast'),prior=toast.innerHTML;
    toast.textContent='⬆ Beyond Your Saved Reach Your saved Prime Signature radius ends here. Prime Signature radius expansion is not available in this development slice. Collect Prime Signatures to expand it.'; const result=${stage3PrimeRadiusBoundaryCheck};toast.innerHTML=prior;return result;})()`);
  if (stage3BoundaryCtl.ok) {
    fails.push('STAGE-3 PRIME RADIUS COPY CONTROL FAILED — injected Signature-collection promise stayed green: '
      + JSON.stringify(stage3BoundaryCtl));
  }
  const stage3CharterBoundaryCtl = await evalNavPh(`(()=>{ const toast=document.getElementById('toast'),prior=toast.innerHTML;
    toast.textContent='⬆ Beyond Your Charter Your saved reach is preserved. The next Charter system is not available in this development slice.'; const result=${stage3PrimeRadiusBoundaryCheck};toast.innerHTML=prior;return result;})()`);
  if (stage3CharterBoundaryCtl.ok) {
    fails.push('STAGE-3 PRIME RADIUS TYPE CONTROL FAILED — injected Charter boundary stayed green: '
      + JSON.stringify(stage3CharterBoundaryCtl));
  }
  /* A forced Share confirmation is allowed to supersede the boundary. The
     SAME blocked route must then restore its explanation, not be mistaken
     for a duplicate merely because its key is still inside the dedupe clock. */
  const stage3ForcedShare = await evalNavPh(`(async()=>{ let copied='';
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(v)=>{copied=String(v);return Promise.resolve();}}});
    const share=document.querySelector('#survey [data-act=share]');share?.click();await new Promise(r=>setTimeout(r,30));
    const s=window.__CF_SLICE__.api.state();delete navigator.clipboard;
    return {share:!!share,copied,toast:s.toastText,toastSerial:s.toastSerial}; })()`);
  if (!stage3ForcedShare.share || !stage3ForcedShare.copied || !/Share code copied/i.test(stage3ForcedShare.toast)
    || stage3ForcedShare.toastSerial !== stage3Reach.toastSerial + 1) {
    fails.push('PRIME RADIUS BOUNDARY TOAST INTERRUPTION: real forced Share did not supersede the first boundary: '
      + JSON.stringify({ boundary: stage3Reach, forcedShare: stage3ForcedShare }));
  }
  await evalNavPh(`(()=>{ const s=document.getElementById('searchbox');s.value=${JSON.stringify(String(blockedShareCode))};s.focus();return true;})()`);
  await dispatchKeyPress(navPh, 'Enter', 'Enter');
  await sleep(80);
  const stage3Restored = await evalNavPh(stage3PrimeRadiusBoundaryCheck);
  if (!stage3Restored.ok || stage3Restored.toastSerial !== stage3ForcedShare.toastSerial + 1) {
    fails.push('PRIME RADIUS BOUNDARY TOAST RESTORE: same blocked CF1 did not restore its explanation after forced Share: '
      + JSON.stringify({ forcedShare: stage3ForcedShare, restored: stage3Restored }));
  }
  await dispatchKeyPress(navPh, 'Enter', 'Enter');
  await sleep(80);
  const stage3Repeat = await evalNavPh(`(()=>{ const s=window.__CF_SLICE__.api.state(),q=document.getElementById('searchbox');return {
    mode:s.mode,toast:s.toastText,toastSerial:s.toastSerial,query:q.value,focus:document.activeElement===q};})()`);
  const dedupedBoundary = (first, repeated) => repeated.mode === first.mode
    && repeated.toast === first.toast && repeated.toastSerial === first.toastSerial
    && repeated.query === first.query && repeated.focus === first.focus;
  if (!dedupedBoundary(stage3Restored, stage3Repeat)) {
    fails.push('PRIME RADIUS BOUNDARY DEBOUNCE: identical rejected route re-announced or changed state: '
      + JSON.stringify({ first: stage3Restored, repeated: stage3Repeat }));
  }
  if (dedupedBoundary(stage3Restored, { ...stage3Repeat, toastSerial: stage3Restored.toastSerial + 1 })) {
    fails.push('PRIME RADIUS BOUNDARY DEBOUNCE CONTROL FAILED — synthetic re-announcement stayed green');
  }

  /* A malformed ascCh cannot stand in for a saved Jump Drive. Import through
     the real front door, open the real Charter board, and prove no non-Sol
     landfall goal reaches the player at stage 0. */
  const malformedChapterToken = await sliceToken(navPh);
  try { await evalNavPh(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(MALFORMED_C2_REACH_RAW)})`); }
  catch { /* successful replacement reloads */ }
  await waitForSlice(navPh, 'malformed Chapter-2 without reach fixture', { previousToken: malformedChapterToken });
  await sleep(2400);
  const malformedProjectionCheck = `(()=>{ const S=window.__CF_SLICE__;
    const s=S.api.state(),panel=document.getElementById('chpanel'),text=panel?.textContent||'',goals=panel?.querySelectorAll('[data-sel=charter-goal]').length||0;
    return {ok:s.stage===0&&goals===0&&!/Land on 3 worlds beyond Sol/i.test(text)
      &&/development slice/i.test(text)&&/next Charter action is not available in this development slice/i.test(s.objective),
      stage:s.stage,goals,text,objective:s.objective};})()`;
  const malformedProjection = await evalNavPh(`(()=>{ document.getElementById('dockcharters')?.click();return ${malformedProjectionCheck};})()`);
  if (!malformedProjection.ok) {
    fails.push('MALFORMED CHAPTER REACH: ascCh without a saved drive exposed impossible Chapter-2 work: '
      + JSON.stringify(malformedProjection));
  }
  const malformedProjectionCtl = await evalNavPh(`(()=>{ const panel=document.getElementById('chpanel'),prior=panel.innerHTML;
    panel.insertAdjacentHTML('beforeend','<div>Land on 3 worlds beyond Sol</div>');const result=${malformedProjectionCheck};panel.innerHTML=prior;return result;})()`);
  if (malformedProjectionCtl.ok) {
    fails.push('MALFORMED CHAPTER REACH CONTROL FAILED — injected non-Sol goal stayed green: '
      + JSON.stringify(malformedProjectionCtl));
  }

  /* A reach-backed imported chapter can already be canonically complete while
     every landfall counter is saturated. Re-land a real, already-landed world
     through the real-browser emulated-phone touch action: chapter recovery must run independently
     of new banking, advance every consecutive completion, persist, and reload
     without adding a landfall or touching the progress/reward ledgers. Matched
     no-reach and powered-incomplete fixtures control entitlement and completeness. */
  const charterRewardLedger = (state) => JSON.stringify({
    reach: state.reach,
    essence: state.save.essence,
    items: state.save.items,
    cargo: state.save.cargo,
    cgx: state.save.cgx,
    stats: state.save.stats,
    journal: state.save.journal,
    claimedSets: state.save.claimedSets,
    techOwned: state.save.techOwned,
    unlocked: state.save.unlocked,
    primeFill: state.save.primeFill,
    frontierUnlocked: state.save.frontierUnlocked,
    chWeek: state.save.chWeek,
    chProg: state.save.chProg,
    chacc: state.save.chacc,
    chDone: state.save.chDone,
  });
  const charterRelandOutcome = (state, baseline, expectedChapter, expectedStage) =>
    state.mode === 'surface' && state.planet === 131
      && state.stage === expectedStage && state.save.ascCh === expectedChapter
      && JSON.stringify(state.save.landed) === baseline.landed
      && JSON.stringify(state.save.ascProg) === baseline.ascProg
      && charterRewardLedger(state) === baseline.rewards;
  const reachBackedCharterReland = async (
    raw, expectedProgress, expectedChapter, expectedStage, label,
  ) => {
    const importToken = await sliceToken(navPh);
    try { await evalNavPh(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(raw)})`); }
    catch { /* successful import replaces the document */ }
    await waitForSlice(navPh, `${label} import`, { previousToken: importToken });
    await waitNavPhValue(`${label} system restore`, `(()=>{ const s=window.__CF_SLICE__.api.state();
      return s.mode==='system'&&s.star===424242?s:null; })()`);
    /* Let the replacement document settle; the powered leg deliberately fires
       a fresh Share notice immediately before Land to prove reconciliation can
       replace an adjacent ambient outcome instead of being swallowed. */
    await sleep(2000);
    const imported = await evalNavPh(`window.__CF_SLICE__.api.state()`);
    const baseline = {
      landed: JSON.stringify(imported.save.landed),
      ascProg: JSON.stringify(imported.save.ascProg),
      rewards: charterRewardLedger(imported),
    };
    if (imported.save.ascCh !== 0 || imported.stage !== expectedStage
      || baseline.landed !== JSON.stringify([131])
      || baseline.ascProg !== JSON.stringify(expectedProgress)) {
      fails.push(`${label}: imported saturated Charter fixture did not retain its exact starting record: `
        + JSON.stringify(imported));
    }

    const surveyed = await evalNavPh(`window.__CF_SLICE__.api.surveyOn(${JSON.stringify(MERCURY)})`);
    const landAction = await evalNavPh(phoneCardActionCheck('landcta'));
    if (!surveyed || !landAction.ok || !/Land/.test(landAction.label)) {
      fails.push(`${label}: real already-landed Mercury card did not expose a reachable Land action: `
        + JSON.stringify({ surveyed, landAction }));
      return;
    }
    if (expectedChapter === 3) {
      const missingAction = await evalNavPh(`(()=>{ const button=document.querySelector('#survey [data-act="landcta"]');
        button.removeAttribute('data-act');const result=${phoneCardActionCheck('landcta')};
        button.setAttribute('data-act','landcta');return result;})()`);
      if (missingAction.ok || missingAction.why !== 'missing') {
        fails.push(`${label} ACTION CONTROL FAILED — injected missing Land action stayed green: `
          + JSON.stringify(missingAction));
      }
      const buriedAction = await evalNavPh(`(()=>{ const button=document.querySelector('#survey [data-act="landcta"]'),prior=button.style.pointerEvents;
        button.style.pointerEvents='none';const result=${phoneCardActionCheck('landcta')};
        button.style.pointerEvents=prior;return result;})()`);
      if (buriedAction.ok) {
        fails.push(`${label} ACTION CONTROL FAILED — injected buried Land action stayed green: `
          + JSON.stringify(buriedAction));
      }
    }
    const beforeTouch = await evalNavPh(`window.__CF_SLICE__.api.state()`);
    if (beforeTouch.mode !== 'system' || beforeTouch.save.ascCh !== 0
      || JSON.stringify(beforeTouch.save.landed) !== baseline.landed
      || JSON.stringify(beforeTouch.save.ascProg) !== baseline.ascProg
      || charterRewardLedger(beforeTouch) !== baseline.rewards
      || beforeTouch.toastSerial !== imported.toastSerial) {
      fails.push(`${label}: Survey/card-open changed Charter or reward state before the Land touch: `
        + JSON.stringify({ imported, beforeTouch }));
    }
    let beforeLand = beforeTouch;
    if (expectedChapter === 3) {
      const adjacentShare = await evalNavPh(`(async()=>{ let copied='';
        Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(value)=>{copied=String(value);return Promise.resolve();}}});
        document.querySelector('#survey [data-act="share"]')?.click();await new Promise((resolve)=>setTimeout(resolve,30));
        const state=window.__CF_SLICE__.api.state();delete navigator.clipboard;return {copied,state};})()`);
      if (!adjacentShare.copied || !/Share code copied/i.test(adjacentShare.state.toastText)
        || adjacentShare.state.toastSerial !== beforeTouch.toastSerial + 1
        || adjacentShare.state.save.ascCh !== 0) {
        fails.push(`${label}: real Share did not establish the adjacent-toast completion control: `
          + JSON.stringify({ beforeTouch, adjacentShare }));
      }
      beforeLand = adjacentShare.state;
    }
    await touchNav(landAction.x, landAction.y);
    const outcome = await waitNavPhValue(`${label} browser-touch re-land`, `(()=>{ const s=window.__CF_SLICE__.api.state();
      return s.mode==='surface'&&s.planet===131?s:null; })()`);
    if (!charterRelandOutcome(outcome, baseline, expectedChapter, expectedStage)) {
      fails.push(`${label}: browser-touch re-land changed credit/rewards or failed the expected Charter recovery: `
        + JSON.stringify({ baseline, outcome }));
    }
    if (expectedChapter === 3
      && (!outcome.toastOn || outcome.toastSerial !== beforeLand.toastSerial + 1
        || !/3 Charter chapters/i.test(outcome.toastText) || !/complete/i.test(outcome.toastText))) {
      fails.push(`${label}: multi-chapter recovery did not replace the adjacent notice with one aggregate: `
        + JSON.stringify({ beforeSerial: beforeLand.toastSerial, toastOn: outcome.toastOn,
          toastSerial: outcome.toastSerial, toastText: outcome.toastText }));
    }
    if (expectedChapter === 0
      && (outcome.toastSerial !== beforeLand.toastSerial || /Charter chapters?.*complete/i.test(outcome.toastText))) {
      fails.push(`${label}: a no-advance control announced an unearned chapter completion: `
        + JSON.stringify({ beforeSerial: beforeLand.toastSerial, toastSerial: outcome.toastSerial,
          toastText: outcome.toastText }));
    }
    /* Predicate controls: the exact same observed outcome must reject both the
       pre-fix no-advance state and a one-chapter-only implementation. */
    for (const badAscCh of expectedChapter === 3 ? [0, 1] : [3]) {
      const control = { ...outcome, save: { ...outcome.save, ascCh: badAscCh } };
      if (charterRelandOutcome(control, baseline, expectedChapter, expectedStage)) {
        fails.push(`${label} CONTROL FAILED — synthetic ascCh ${badAscCh} stayed green`);
      }
    }
    const reachControl = { ...outcome, reach: outcome.reach + 1 };
    const rewardControl = {
      ...outcome,
      save: { ...outcome.save, unlocked: [...outcome.save.unlocked, 'charter-control-reward'] },
    };
    if (charterRelandOutcome(reachControl, baseline, expectedChapter, expectedStage)
      || charterRelandOutcome(rewardControl, baseline, expectedChapter, expectedStage)) {
      fails.push(`${label} CONTROL FAILED — synthetic reach/reward mutation stayed green`);
    }

    const persisted = await waitNavPhValue(`${label} IndexedDB commit`, `(async()=>{
      const raw=await (${READ_PRIMARY_EXPRESSION}),data=JSON.parse(raw);
      return data.asc===${expectedChapter}&&data.view?.type==='planet'&&data.view?.pseed===131
        ?{asc:data.asc,ascp:data.ascp,land:data.land,view:data.view}:null; })()`, 8000);
    if (JSON.stringify(persisted.land) !== baseline.landed
      || JSON.stringify(persisted.ascp) !== baseline.ascProg) {
      fails.push(`${label}: persisted recovery changed landfall/progress bytes: `
        + JSON.stringify({ baseline, persisted }));
    }
    await navigateToSlice(navPh, URL3, `${label} reload`);
    const reloaded = await waitNavPhValue(`${label} reloaded surface`, `(()=>{ const s=window.__CF_SLICE__.api.state();
      return s.mode==='surface'&&s.planet===131?s:null; })()`);
    if (!charterRelandOutcome(reloaded, baseline, expectedChapter, expectedStage)) {
      fails.push(`${label}: committed Charter recovery did not survive reload exactly: `
        + JSON.stringify({ baseline, reloaded }));
    }
  };
  await reachBackedCharterReland(
    SATURATED_CHARTER_RAW, SATURATED_CHARTER_PROGRESS, 3, 3, 'SATURATED CHARTER RECOVERY',
  );
  await reachBackedCharterReland(
    UNPOWERED_SATURATED_CHARTER_RAW, SATURATED_CHARTER_PROGRESS, 0, 0, 'UNPOWERED CHARTER CONTROL',
  );
  await reachBackedCharterReland(
    POWERED_INCOMPLETE_CHARTER_RAW, INCOMPLETE_CHARTER_PROGRESS, 0, 3, 'INCOMPLETE CHARTER CONTROL',
  );

  await send('Target.closeTarget', { targetId: tNav.targetId });

  /* Desktop ordinary panels and Survey coexist. Use a desktop-owned target
     from birth (changing CDP's mobile mode can reload a page), use browser-mouse
     input to activate the visible rail, keep the board open during a browser-mouse
     Land action, and require its DOM to refresh with ascCh. */
  const tPanel = await send('Target.createTarget', { url: 'about:blank' });
  const aPanel = await send('Target.attachToTarget', { targetId: tPanel.targetId, flatten: true });
  const panelSession = aPanel.sessionId;
  await send('Runtime.enable', {}, panelSession);
  await send('Page.enable', {}, panelSession);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
  }, panelSession);
  await navigateToSlice(panelSession, URL4, 'Charter desktop-panel boot');
  const evalPanel = async (expr) => {
    const r = await send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true,
    }, panelSession);
    if (r.exceptionDetails) {
      throw new Error('Charter desktop-panel eval threw: '
        + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    }
    return r.result.value;
  };
  const waitPanelValue = async (label, expr, timeoutMs = 6000) => {
    const deadline = Date.now() + timeoutMs;
    let last = null;
    while (Date.now() < deadline) {
      last = await evalPanel(expr);
      if (last) return last;
      await sleep(50);
    }
    throw new Error(`${label} did not reach its desktop-panel outcome within ${timeoutMs}ms (last ${JSON.stringify(last)})`);
  };
  const panelImportToken = await sliceToken(panelSession);
  try { await evalPanel(`window.__CF_SLICE__.api.importBlob(${JSON.stringify(SATURATED_CHARTER_RAW)})`); }
  catch { /* successful import replaces the document */ }
  await waitForSlice(panelSession, 'CHARTER PANEL REFRESH import', { previousToken: panelImportToken });
  await waitPanelValue('CHARTER PANEL REFRESH system + rail restore', `(()=>{ const s=window.__CF_SLICE__.api.state(),
    rail=document.getElementById('railcharters'),r=rail?.getBoundingClientRect(),
    x=r?(r.left+r.right)/2:0,y=r?(r.top+r.bottom)/2:0,hit=r?document.elementFromPoint(x,y):null;
    return innerWidth===1280&&innerHeight===800&&s.mode==='system'&&s.star===424242&&s.panelOpen===null&&rail&&r.width>0&&r.height>=44
      &&getComputedStyle(rail).display!=='none'&&(hit===rail||rail.contains(hit))?{x,y,state:s}:null;})()`);
  const railAction = await evalPanel(`(()=>{ const rail=document.getElementById('railcharters'),r=rail.getBoundingClientRect();
    return {x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};})()`);
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: railAction.x, y: railAction.y, button: 'left', clickCount: 1,
  }, panelSession);
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: railAction.x, y: railAction.y, button: 'left', clickCount: 1,
  }, panelSession);
  await waitPanelValue('CHARTER PANEL REFRESH rail open', `window.__CF_SLICE__.api.state().panelOpen==='ch'`);
  await evalPanel(`window.__CF_SLICE__.api.surveyOn(${JSON.stringify(MERCURY)})`);
  const charterPanelCheck = `(()=>{ const state=window.__CF_SLICE__.api.state(),panel=document.getElementById('chpanel'),
    text=panel?.textContent||'',record=panel?.querySelector('[data-sel="charter-ch"]');
    return {ok:state.panelOpen==='ch'&&state.save.ascCh===3&&record?.getAttribute('data-chstate')==='complete'
      &&/Charter record/.test(text)&&!/Chapter 1/.test(text),panelOpen:state.panelOpen,ascCh:state.save.ascCh,
      state:record?.getAttribute('data-chstate')||null,text};})()`;
  const panelBefore = await evalPanel(`(()=>{ const s=window.__CF_SLICE__.api.state(),panel=document.getElementById('chpanel');
    return {panelOpen:s.panelOpen,ascCh:s.save.ascCh,text:panel?.textContent||'',land:${phoneCardActionCheck('landcta')}};})()`);
  if (panelBefore.panelOpen !== 'ch' || panelBefore.ascCh !== 0 || !/Chapter 1/.test(panelBefore.text)
    || !panelBefore.land.ok) {
    fails.push('CHARTER PANEL REFRESH: desktop panel/Survey did not coexist before Land: '
      + JSON.stringify(panelBefore));
  } else {
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: panelBefore.land.x, y: panelBefore.land.y, button: 'left', clickCount: 1,
    }, panelSession);
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: panelBefore.land.x, y: panelBefore.land.y, button: 'left', clickCount: 1,
    }, panelSession);
    await waitPanelValue('CHARTER PANEL REFRESH browser mouse Land', `(()=>{ const s=window.__CF_SLICE__.api.state();
      return s.mode==='surface'&&s.save.ascCh===3?s:null;})()`);
    const panelAfter = await evalPanel(charterPanelCheck);
    if (!panelAfter.ok) {
      fails.push('CHARTER PANEL REFRESH: open board stayed on the pre-Land chapter: '
        + JSON.stringify(panelAfter));
    }
    const stalePanelCtl = await evalPanel(`(()=>{ const panel=document.getElementById('chpanel'),prior=panel.innerHTML;
      panel.innerHTML='<div data-sel="charter-ch" data-chstate="complete">Chapter 1 — stale</div>';
      const result=${charterPanelCheck};panel.innerHTML=prior;return result;})()`);
    if (stalePanelCtl.ok) {
      fails.push('CHARTER PANEL REFRESH CONTROL FAILED — injected stale Chapter 1 board stayed green: '
        + JSON.stringify(stalePanelCtl));
    }
  }
  await send('Target.closeTarget', { targetId: tPanel.targetId });

  /* 4d2. THE RESOLUTION MATRIX (uilayout discipline, first slice tier):
     the geometry contract on tablet-portrait and a small phone too — the
     window furniture must sit in the golden places at EVERY size. */
  for (const [vw, vh, name] of [[820, 1180, 'tablet-portrait'], [360, 640, 'small-phone']]) {
    const tR = await send('Target.createTarget', { url: 'about:blank' });
    const aR = await send('Target.attachToTarget', { targetId: tR.targetId, flatten: true });
    const sR = aR.sessionId;
    await send('Runtime.enable', {}, sR);
    await send('Page.enable', {}, sR);
    await send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: 2, mobile: true }, sR);
    await navigateToSlice(sR, URL0, `${name} matrix boot`);
    await sleep(2600);
    const evalR = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sR);
      if (r.exceptionDetails) throw new Error(name + ' eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    };
    const g = await evalR(geoCheck).catch((e) => ['harness: ' + e.message]);
    if (g.length) fails.push('MATRIX ' + name + ' (' + vw + '×' + vh + ') layout drift: ' + g.join(' · '));
    await send('Target.closeTarget', { targetId: tR.targetId });
  }

  /* Protected-save notices are CRITICAL boot outcomes and must bypass the
     ordinary 1.8s toast de-bounce. Exercise them before that window closes,
     and prove neither future nor corrupt bytes are rewritten. */
  const setProtectedPrimary = async (raw, backup) => {
    const backupWrite = backup === undefined
      ? "os.delete('save_bak');"
      : `os.put(${JSON.stringify(backup)},'save_bak');`;
    return evalPh(`new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice');
      q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readwrite'),os=tx.objectStore('meta');
        os.put(${JSON.stringify(raw)},'save'); ${backupWrite} tx.oncomplete=()=>{db.close();resolve(true)}; tx.onerror=()=>reject(tx.error); }; })`);
  };
  const waitProtectedNotice = async (expectedTitle, timeoutMs = 3000) => {
    const deadline = Date.now() + timeoutMs;
    let last = null;
    while (Date.now() < deadline) {
      last = await evalPh(`(()=>{ const title=(document.querySelector('#toast [data-sel=toast-title]')||{}).textContent||'';
        const toast=document.getElementById('toast'),style=toast?getComputedStyle(toast):null;
        const rect=toast?.getBoundingClientRect(),geometry=!!rect&&rect.width>0&&rect.height>0&&rect.right>0&&rect.bottom>0
          &&rect.left<innerWidth&&rect.top<innerHeight;
        const open=!!toast&&toast.style.opacity==='1'&&Number(style.opacity)>0&&style.display!=='none'&&style.visibility!=='hidden'
          &&document.visibilityState==='visible'&&!document.hidden&&geometry;
        return {title,open,inlineOpacity:toast?.style.opacity||'',computedOpacity:style?.opacity||'',visibility:document.visibilityState,
          geometry,rect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null}; })()`);
      if (last.title === expectedTitle && last.open) return last;
      await sleep(50);
    }
    throw new Error(`protected notice ${JSON.stringify(expectedTitle)} was not visibly rendered within ${timeoutMs}ms (last ${JSON.stringify(last)})`);
  };
  let protectedNoticeControlRejected = false;
  try { await waitProtectedNotice('__never_a_real_notice__', 150); }
  catch { protectedNoticeControlRejected = true; }
  if (!protectedNoticeControlRejected) fails.push('PROTECTED NOTICE WAITER CONTROL FAILED — a never-matching title reported visible');
  const protectedBoot = async (raw, expectedTitle, backup) => {
    await setProtectedPrimary(raw, backup);
    /* This is a VISUAL notice gate. Make its page the active renderer before
       reading a CSS transition; background targets may intentionally pause
       animation frames and report computed opacity 0 despite an open toast. */
    await send('Target.activateTarget', { targetId: t2.targetId });
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }, ph);
    await send('Page.bringToFront', {}, ph);
    await navigateToSlice(ph, URL0, 'protected-save boot');
    await send('Page.bringToFront', {}, ph);
    const visual = await waitProtectedNotice(expectedTitle);
    /* A fast read can miss the exact regression this protects: a queued
       preference debounce may overwrite after the notice already looked
       correct. Schedule the ordinary 400ms path, wait beyond it, then drive
       one direct benign persist attempt as well before rereading bytes. */
    const scheduled = await evalPh(`window.__CF_SLICE__.api.__smokePersistAfterDebounce()`);
    await sleep(650);
    const directPersist = await evalPh(`window.__CF_SLICE__.api.__smokePersistNow()`);
    await sleep(100);
    const stored = await evalPh(READ_PRIMARY_EXPRESSION);
    return { ...visual, raw: stored, scheduled, directPersist };
  };
  const futureRaw = FUTURE_V99_RAW;
  const futureBoot = await protectedBoot(futureRaw, 'Update required');
  if (futureBoot.title !== 'Update required' || !futureBoot.open || futureBoot.raw !== futureRaw
    || !futureBoot.scheduled || futureBoot.directPersist !== false) {
    fails.push('FUTURE SAVE PROTECTION was not visible/byte-preserving on fast boot: ' + JSON.stringify(futureBoot));
  }
  await evalPh(`(()=>{ document.getElementById('toast').style.visibility='hidden'; return true; })()`);
  let hiddenNoticeControlRejected = false;
  try { await waitProtectedNotice('Update required', 150); }
  catch { hiddenNoticeControlRejected = true; }
  await evalPh(`(()=>{ document.getElementById('toast').style.removeProperty('visibility'); return true; })()`);
  if (!hiddenNoticeControlRejected) fails.push('PROTECTED NOTICE VISIBILITY CONTROL FAILED — an injected hidden toast reported visible');
  const corruptBoot = await protectedBoot('{}', 'Save protected');
  if (corruptBoot.title !== 'Save protected' || !corruptBoot.open || corruptBoot.raw !== '{}'
    || !corruptBoot.scheduled || corruptBoot.directPersist !== false) {
    fails.push('CORRUPT SAVE PROTECTION was not visible/byte-preserving on fast boot: ' + JSON.stringify(corruptBoot));
  }
  const sparseV4Boot = await protectedBoot(SPARSE_V4_RAW, 'Save protected');
  if (sparseV4Boot.title !== 'Save protected' || !sparseV4Boot.open || sparseV4Boot.raw !== SPARSE_V4_RAW
    || !sparseV4Boot.scheduled || sparseV4Boot.directPersist !== false) {
    fails.push('SPARSE V4 SAVE PROTECTION was not visible/byte-preserving on fast boot: ' + JSON.stringify(sparseV4Boot));
  }
  const partialV4Boot = await protectedBoot(PARTIAL_V4_RAW, 'Save protected');
  if (partialV4Boot.title !== 'Save protected' || !partialV4Boot.open || partialV4Boot.raw !== PARTIAL_V4_RAW
    || !partialV4Boot.scheduled || partialV4Boot.directPersist !== false) {
    fails.push('PLAUSIBLE PARTIAL V4 SAVE PROTECTION was not visible/byte-preserving on fast boot: ' + JSON.stringify(partialV4Boot));
  }
  /* The recovery copy is untrusted storage input too. A future or corrupt
     backup must be classified before it can replace the invalid primary; the
     notice alone is insufficient because it is rendered from the pre-recovery
     read and could look correct after the repository already destroyed it. */
  for (const [label, unsafeBackup] of [
    ['future backup', FUTURE_V99_RAW],
    ['corrupt backup', '{"v":4,"epoch":'],
  ]) {
    try {
      const unsafeRecovery = await protectedBoot('{}', 'Save protected', unsafeBackup);
      if (unsafeRecovery.title !== 'Save protected' || !unsafeRecovery.open || unsafeRecovery.raw !== '{}'
        || !unsafeRecovery.scheduled || unsafeRecovery.directPersist !== false) {
        fails.push(`BACKUP CLASSIFY-BEFORE-SWAP (${label}) did not preserve the invalid primary: `
          + JSON.stringify(unsafeRecovery));
      }
    } catch (error) {
      fails.push(`BACKUP CLASSIFY-BEFORE-SWAP (${label}) changed the protected boot outcome: `
        + String(error instanceof Error ? error.message : error));
    }
  }

  /* Exact historical compatibility: the first IndexedDB slice wrote only
     {nav,view}. It must boot at the same place and immediately migrate to a
     complete v4 save; nearby sparse `{}` remains protected above. A near
     miss whose two route copies disagree is not that historical envelope. */
  const legacyGal = { seed: 999, x: 90, y: -60, size: 72, sp: 4, tilt: 0.5, rot: 0, home: true, quasar: false, dwarf: false };
  const legacyMismatchRaw = JSON.stringify({
    nav: { mode: 'galaxy', gal: { ...legacyGal, x: 90.01 }, star: null, planet: null },
    view: { type: 'galaxy', gal: legacyGal },
  });
  const legacyMismatchBoot = await protectedBoot(legacyMismatchRaw, 'Save protected');
  if (legacyMismatchBoot.title !== 'Save protected' || !legacyMismatchBoot.open
    || legacyMismatchBoot.raw !== legacyMismatchRaw || !legacyMismatchBoot.scheduled
    || legacyMismatchBoot.directPersist !== false) {
    fails.push('LEGACY SLICE CONTROL: mismatched {nav,view} near-miss was accepted or rewritten: '
      + JSON.stringify(legacyMismatchBoot));
  }
  /* Agreement proves the historical two-field envelope shape, not source
     identity. This near-miss agrees byte-for-byte on a forged same-seed
     galaxy coordinate, so it must classify through the compatibility bridge
     and then repair only its route to Cosmos in a full v4 envelope. */
  const legacyForgedGal = { ...legacyGal, x: 90.01 };
  const legacyAgreeingForgedRaw = JSON.stringify({
    nav: { mode: 'galaxy', gal: legacyForgedGal, star: null, planet: null },
    view: { type: 'galaxy', gal: legacyForgedGal },
  });
  await setProtectedPrimary(legacyAgreeingForgedRaw);
  await navigateToSlice(ph, URL0, 'agreeing source-forged legacy slice migration');
  await sleep(900);
  await evalPh(`window.__CF_SLICE__.api.__smokePersistNow()`);
  const legacyAgreeingForged = await evalPh(`new Promise((resolve,reject)=>{ const state=window.__CF_SLICE__.api.state();
    const q=indexedDB.open('cf-v2-slice'); q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result;
      const tx=db.transaction('meta','readonly'),g=tx.objectStore('meta').get('save');
      g.onsuccess=()=>{ const raw=String(g.result||''),saved=JSON.parse(raw||'null'); db.close();
        resolve({...state,raw,v:saved&&saved.v,storedView:saved&&saved.view,
          codex:Array.isArray(saved&&saved.codex),land:Array.isArray(saved&&saved.land)}); };
      g.onerror=()=>reject(g.error); }; })`);
  if (legacyAgreeingForged.mode !== 'universe' || legacyAgreeingForged.gal !== null
    || legacyAgreeingForged.star !== null || legacyAgreeingForged.planet !== null
    || legacyAgreeingForged.save.savedView !== null || legacyAgreeingForged.savedRouteWriteHeld
    || legacyAgreeingForged.v !== 4 || legacyAgreeingForged.storedView !== null
    || legacyAgreeingForged.raw === legacyAgreeingForgedRaw
    || !legacyAgreeingForged.codex || !legacyAgreeingForged.land
    || /Save protected|Update required/.test(legacyAgreeingForged.toastText)
    || !renderedSceneMatchesNav(legacyAgreeingForged)) {
    fails.push('LEGACY SLICE SOURCE REPAIR: agreeing forged {nav,view} did not structurally migrate to clean Cosmos/v4: '
      + JSON.stringify(legacyAgreeingForged));
  }
  const legacyForeignReceiptCtl = {
    ...legacyAgreeingForged,
    renderedScene: {
      ...legacyAgreeingForged.renderedScene,
      mode: 'galaxy',
      galaxyKey: 'injected-forged-legacy-galaxy',
    },
  };
  if (renderedSceneMatchesNav(legacyForeignReceiptCtl)) {
    fails.push('LEGACY SLICE SOURCE-REPAIR CONTROL FAILED — foreign galaxy receipt stayed green at Cosmos');
  }
  const legacySliceRaw = JSON.stringify({
    nav: { mode: 'galaxy', gal: legacyGal, star: null, planet: null },
    view: { type: 'galaxy', gal: legacyGal },
  });
  await setProtectedPrimary(legacySliceRaw);
  await navigateToSlice(ph, URL0, 'legacy slice upgrade boot');
  await sleep(900);
  const legacyUpgrade = await evalPh(`new Promise((resolve,reject)=>{ const state=window.__CF_SLICE__.api.state();
    const q=indexedDB.open('cf-v2-slice'); q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result;
      const tx=db.transaction('meta','readonly'),g=tx.objectStore('meta').get('save');
      g.onsuccess=()=>{ const saved=JSON.parse(String(g.result||'null')); db.close();
        resolve({mode:state.mode,gal:state.gal,galX:state.galX,galY:state.galY,galSize:state.galSize,
          navGalaxyKey:state.navGalaxyKey,navStarKey:state.navStarKey,navWorldKey:state.navWorldKey,
          renderedScene:state.renderedScene,v:saved&&saved.v,epoch:saved&&saved.epoch,view:saved&&saved.view,
          codex:Array.isArray(saved&&saved.codex),land:Array.isArray(saved&&saved.land)}); }; g.onerror=()=>reject(g.error); }; })`);
  if (legacyUpgrade.mode !== 'galaxy' || legacyUpgrade.gal !== 999
    || legacyUpgrade.galX !== 90 || legacyUpgrade.galY !== -60 || legacyUpgrade.galSize !== 78
    || legacyUpgrade.view?.type !== 'galaxy' || legacyUpgrade.view?.gal?.size !== 78
    || legacyUpgrade.v !== 4 || !Number.isFinite(legacyUpgrade.epoch)
    || !legacyUpgrade.codex || !legacyUpgrade.land || !renderedSceneMatchesNav(legacyUpgrade)) {
    fails.push('LEGACY SLICE {nav,view} did not preserve its route and upgrade to the full v4 envelope: '
      + JSON.stringify(legacyUpgrade));
  }

  /* A transient first read is UNKNOWN—not permission to recover a stale
     backup or overwrite a primary that appears on retry. Inject the failure
     at the real IDB request boundary, then press the real canvas: existing
     bytes must cause a reload through the full loader with zero first-page
     primary writes; only a proven-empty retry may authorize the first save. */
  const transientRetryProbe = async (seedRaw) => {
    if (seedRaw === undefined) {
      await evalPh(`new Promise((resolve,reject)=>{ const q=indexedDB.open('cf-v2-slice'); q.onerror=()=>reject(q.error);
        q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readwrite'),os=tx.objectStore('meta');
          os.delete('save'); os.delete('save_bak'); tx.oncomplete=()=>{db.close();resolve(true)}; tx.onerror=()=>reject(tx.error); }; })`);
    } else await setProtectedPrimary(seedRaw);
    const target = await send('Target.createTarget', { url: 'about:blank' });
    const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const retrySession = attached.sessionId;
    await send('Runtime.enable', {}, retrySession);
    await send('Page.enable', {}, retrySession);
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const first = sessionStorage.getItem('__cf_transient_injected') !== '1';
      sessionStorage.setItem('__cf_transient_active', first ? '1' : '0');
      if (!first) return;
      sessionStorage.setItem('__cf_transient_injected', '1');
      sessionStorage.setItem('__cf_transient_primary_writes', '0');
      const get0 = IDBObjectStore.prototype.get;
      IDBObjectStore.prototype.get = function(key) {
        if (this.name === 'meta' && key === 'save' && sessionStorage.getItem('__cf_transient_failed') !== '1') {
          sessionStorage.setItem('__cf_transient_failed', '1');
          throw new DOMException('injected first primary read failure', 'UnknownError');
        }
        return get0.apply(this, arguments);
      };
      const put0 = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function(value, key) {
        if (this.name === 'meta' && key === 'save' && sessionStorage.getItem('__cf_transient_active') === '1') {
          const n = Number(sessionStorage.getItem('__cf_transient_primary_writes') || '0');
          sessionStorage.setItem('__cf_transient_primary_writes', String(n + 1));
        }
        return put0.apply(this, arguments);
      };
    })();` }, retrySession);
    await navigateToSlice(retrySession, URL0, 'transient-read retry boot');
    await sleep(900);
    const retryBootToken = await sliceToken(retrySession);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 30, y: 300, button: 'left', clickCount: 1 }, retrySession);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 30, y: 300, button: 'left', clickCount: 1 }, retrySession);
    if (seedRaw !== undefined) {
      await waitForSlice(retrySession, 'transient-read existing-primary reload', { previousToken: retryBootToken });
    }
    await sleep(seedRaw === undefined ? 900 : 1700);
    const result = await send('Runtime.evaluate', { expression: `new Promise((resolve,reject)=>{ const state=window.__CF_SLICE__.api.state();
      const q=indexedDB.open('cf-v2-slice'); q.onerror=()=>reject(q.error); q.onsuccess=()=>{ const db=q.result;
        const tx=db.transaction('meta','readonly'),g=tx.objectStore('meta').get('save'); g.onsuccess=()=>{
          const raw=g.result===undefined?null:String(g.result); db.close(); resolve({name:state.save.name,
            writes:Number(sessionStorage.getItem('__cf_transient_primary_writes')||'0'), raw}); }; g.onerror=()=>reject(g.error); }; })`,
      returnByValue: true, awaitPromise: true }, retrySession);
    await send('Target.closeTarget', { targetId: target.targetId });
    if (result.exceptionDetails) throw new Error('transient retry probe threw: ' + JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const existingRetry = await transientRetryProbe(vrRaw);
  if (existingRetry.name !== 'Dakk' || existingRetry.writes !== 0) {
    fails.push('TRANSIENT READ retry overwrote/ignored an existing primary instead of reloading it: ' + JSON.stringify(existingRetry));
  }
  const freshRetry = await transientRetryProbe(undefined);
  let freshPayload = null;
  try { freshPayload = JSON.parse(freshRetry.raw); } catch { /* diagnostic below */ }
  if (freshRetry.writes !== 1 || !freshPayload || freshPayload.v !== 4
    || !Array.isArray(freshPayload.codex) || !Array.isArray(freshPayload.land)) {
    fails.push('TRANSIENT READ retry did not authorize exactly one first write after proving the store empty: '
      + JSON.stringify(freshRetry));
  }

  /* 4e-phone. A FRESH PHONE starts with training active. Prove its card
     clears the measured 4x2 dock and does not geometrically bury any 44px
     dock target. The dock is intentionally focus-locked at welcome, so the
     probe temporarily enables pointer hit-testing without clicking anything;
     the training lock is restored before this target closes. */
  const t3p = await send('Target.createTarget', { url: 'about:blank' });
  const at3p = await send('Target.attachToTarget', { targetId: t3p.targetId, flatten: true });
  const trp = at3p.sessionId;
  await send('Runtime.enable', {}, trp);
  await send('Page.enable', {}, trp);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, trp);
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, trp);
  await navigateToSlice(trp, URL2, 'fresh-phone training boot');
  await sleep(3000);
  const evalTp = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, trp);
    if (r.exceptionDetails) throw new Error('phone training eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const phoneTrainingCheck = `(()=>{ const bad=[];
    const card=document.getElementById('tutcard'), dock=document.getElementById('dock');
    const box=(el)=>{ if(!el) return null; const b=el.getBoundingClientRect();
      return b.width>0&&b.height>0 ? {l:b.left,t:b.top,r:b.right,b:b.bottom,w:b.width,h:b.height} : null; };
    const cb=box(card), db=box(dock);
    if(!cb) bad.push('training card is not visible');
    if(!db) bad.push('training dock is not visible');
    if(cb&&db&&cb.l<db.r-1&&cb.r>db.l+1&&cb.t<db.b-1&&cb.b>db.t+1) bad.push('training card overlaps dock');
    const priorDockPointer=dock&&dock.style.pointerEvents, priorDockInert=dock&&dock.hasAttribute('inert');
    if(dock){dock.style.pointerEvents='auto';dock.removeAttribute('inert');}
    const buttons=dock?[...dock.querySelectorAll('button')]:[];
    if(buttons.length!==8) bad.push('training dock does not expose eight buttons: '+buttons.length);
    for(const button of buttons){ const b=button.getBoundingClientRect();
      if(Math.abs(b.width-44)>1||Math.abs(b.height-44)>1) bad.push(button.id+' is not a 44px training target');
      const hit=document.elementFromPoint((b.left+b.right)/2,(b.top+b.bottom)/2);
      if(!hit||!button.contains(hit)) bad.push(button.id+' is buried at its centre during training');
    }
    if(dock){dock.style.pointerEvents=priorDockPointer;if(priorDockInert)dock.setAttribute('inert','');}
    return bad; })()`;
  const phoneTraining = await evalTp(phoneTrainingCheck);
  if (phoneTraining.length) fails.push('PHONE TRAINING/DOCK drift: ' + phoneTraining.join(' · '));
  /* Discriminating control: pin the card to the dock's own bottom inset. The
     same outcome checker must see both the overlap and buried button centres,
     then the exact inline value is restored. */
  const phoneTrainingCtl = await evalTp(`(()=>{ const card=document.getElementById('tutcard'), prev=card.style.bottom;
    card.style.bottom='12px'; const bad=${phoneTrainingCheck}; card.style.bottom=prev; return bad; })()`);
  if (!phoneTrainingCtl.includes('training card overlaps dock')
    || !phoneTrainingCtl.some((finding) => finding.includes('is buried at its centre during training'))) {
    fails.push('PHONE TRAINING/DOCK CONTROL FAILED — injected burial went unseen: ' + JSON.stringify(phoneTrainingCtl));
  }
  await send('Target.closeTarget', { targetId: t3p.targetId });

  /* 4e. THE TRAINING DRILL — the six live lessons end-to-end at the primary
     390×844 PHONE geometry on a FRESH ORIGIN: welcome → find-earth →
     survey-tour → atlas-add → atlas-open → land → graduation, every advance
     on the REAL gameEvent the lesson teaches. This makes the real Land→grad
     Planetside hide/finish-restore proof exercise the mobile-only layout. */
  const t3 = await send('Target.createTarget', { url: 'about:blank' });
  const at3 = await send('Target.attachToTarget', { targetId: t3.targetId, flatten: true });
  const tr = at3.sessionId;
  await send('Runtime.enable', {}, tr);
  await send('Page.enable', {}, tr);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, tr);
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, tr);
  await navigateToSlice(tr, URL2, '390x844 phone training boot');
  await sleep(3000);
  const evalT = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, tr);
    if (r.exceptionDetails) throw new Error('training eval threw: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const keyT = async (key, code = key, modifiers = 0) => {
    await dispatchKeyPress(tr, key, code, modifiers);
    await sleep(40);
  };
  const pointerT = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, tr);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, tr);
    await sleep(80);
  };
  const trainingFocus = `(()=>{ const active=document.activeElement,card=document.getElementById('tutcard');
    const allowed=!!active&&(card?.contains(active)||active.closest('#survey')||active.closest('#dock')
      ||active.closest('#raillft')||active.closest('#railrgt')||active.tagName==='CANVAS');
    return {active:active?.getAttribute('data-sel')||active?.id||active?.tagName||null,allowed,
      step:window.__CF_SLICE__.api.state().tutStep,announcement:document.getElementById('tutlive')?.textContent||''}; })()`;
  const trainingLandLockCheck = `(()=>{ const land=document.querySelector('#survey [data-act=landcta]'),lock=land?.closest('[inert]');
    const r=land?.getBoundingClientRect(),s=window.__CF_SLICE__.api.state();
    return {ok:!!land&&!!lock&&getComputedStyle(land).pointerEvents==='none',lockTag:lock?.tagName||null,
      lockAction:lock?.getAttribute('data-act')||null,pointer:land?getComputedStyle(land).pointerEvents:null,
      x:r?(r.left+r.right)/2:null,y:r?(r.top+r.bottom)/2:null,mode:s.mode,step:s.tutStep,landed:s.save.landed}; })()`;
  const step = async () => evalT(`window.__CF_SLICE__.api.state().tutStep`);
  if (await step() !== 'welcome') fails.push('DRILL: no welcome on the fresh origin: ' + await step());
  const queuedRelease = await evalT(`(()=>{ const S=window.__CF_SLICE__,opened=S.api.showReleaseFixture(${JSON.stringify(RELEASE_FIXTURE_VERSION)}),s=S.api.state();
    return {opened,training:s.tutActive,step:s.tutStep,panel:s.panelOpen,pending:s.releasePending,rnSeen:s.rnSeen}; })()`);
  if (queuedRelease.opened || !queuedRelease.training || queuedRelease.step !== 'welcome'
    || queuedRelease.panel !== null || queuedRelease.pending !== RELEASE_FIXTURE_VERSION
    || queuedRelease.rnSeen === RELEASE_FIXTURE_VERSION) {
    fails.push('RELEASE QUEUE: a fresh-training bulletin overlapped onboarding or marked itself seen: '
      + JSON.stringify(queuedRelease));
  }

  /* Focus lockdown is an OUTCOME gate. At welcome the lesson's real primary
     action receives focus and its persistent live region announces the
     authored instruction. Tab/Shift+Tab must wrap inside the card. */
  const welcomeFocus = await evalT(trainingFocus);
  if (welcomeFocus.active !== 'tutbtn' || !welcomeFocus.allowed
    || !/Field Training, step 1 of 7/i.test(welcomeFocus.announcement)
    || !/Welcome to Sol/i.test(welcomeFocus.announcement)) {
    fails.push('DRILL KEYBOARD: welcome was not focused and announced: ' + JSON.stringify(welcomeFocus));
  }
  await keyT('Tab', 'Tab');
  const welcomeTab = await evalT(trainingFocus);
  await keyT('Tab', 'Tab');
  const welcomeWrap = await evalT(trainingFocus);
  await keyT('Tab', 'Tab', 8);   /* Shift */
  const welcomeReverse = await evalT(trainingFocus);
  if (welcomeTab.active !== 'tutskip' || welcomeWrap.active !== 'tutbtn' || welcomeReverse.active !== 'tutskip'
    || !welcomeTab.allowed || !welcomeWrap.allowed || !welcomeReverse.allowed) {
    fails.push('DRILL KEYBOARD: Tab escaped or failed to wrap the welcome scope: '
      + JSON.stringify({ welcomeTab, welcomeWrap, welcomeReverse }));
  }
  /* Escape during an active lesson is owned by Training, not global
     navigation. Drive the real key: welcome must remain in Sol on the same
     lesson and return focus to Begin rather than ascending. */
  await evalT(`(()=>{ const S=window.__CF_SLICE__;S.api.descendGalaxy(${JSON.stringify(HOME_GALAXY)});S.api.descendSystem(${JSON.stringify(SOL_STAR)});
    document.querySelector('[data-sel=tutbtn]')?.focus();return S.api.state();})()`);
  await sleep(120);
  await keyT('Escape', 'Escape');
  const welcomeEscapeCheck = `(()=>{ const s=window.__CF_SLICE__.api.state(),card=document.getElementById('tutcard'),button=document.querySelector('[data-sel=tutbtn]');
    const style=card?getComputedStyle(card):null,r=card?.getBoundingClientRect(),visible=!!card&&style?.display!=='none'&&style?.visibility!=='hidden'&&!!r&&r.width>0&&r.height>0;
    const active=document.activeElement===button,text=(button?.textContent||'').trim();
    return {ok:s.mode==='system'&&s.gal===999&&s.star===424242&&s.tutStep==='welcome'&&visible&&active&&text==='Begin Training',
      mode:s.mode,gal:s.gal,star:s.star,step:s.tutStep,visible,active,text}; })()`;
  const welcomeEscape = await evalT(welcomeEscapeCheck);
  if (!welcomeEscape.ok) {
    fails.push('DRILL ESCAPE: welcome Escape escaped Training instead of keeping Sol/welcome and refocusing Begin: '
      + JSON.stringify(welcomeEscape));
  }
  const welcomeEscapeCtl = await evalT(`(()=>{ const card=document.getElementById('tutcard'),prior=card?.style.visibility;
    if(card)card.style.visibility='hidden';const result=${welcomeEscapeCheck};if(card)card.style.visibility=prior||'';return result;})()`);
  if (welcomeEscapeCtl.ok) {
    fails.push('DRILL ESCAPE CONTROL FAILED — hiding the retained welcome card stayed green: ' + JSON.stringify(welcomeEscapeCtl));
  }
  const welcomeEscapeBypassCtl = await evalT(`(()=>{ const S=window.__CF_SLICE__;
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));
    const escaped=S.api.state().mode!=='system';if(S.api.state().mode==='universe')S.api.descendGalaxy(${JSON.stringify(HOME_GALAXY)});
    if(S.api.state().mode==='galaxy')S.api.descendSystem(${JSON.stringify(SOL_STAR)});
    document.querySelector('[data-sel=tutbtn]')?.focus();return {escaped,restored:S.api.state().mode};})()`);
  if (!welcomeEscapeBypassCtl.escaped || welcomeEscapeBypassCtl.restored !== 'system') {
    fails.push('DRILL ESCAPE CONTROL FAILED — bypassing the document Training guard did not expose global ascent: '
      + JSON.stringify(welcomeEscapeBypassCtl));
  }

  /* Forbidden chrome must reject both scripted focus and a genuine pointer
     press. The activation assertion reads the panel outcome, not just inert
     spelling. */
  const forbiddenFocus = await evalT(`(()=>{ const button=document.getElementById('docksets'); button.focus();
    const active=document.activeElement; return {dockInert:!!button.closest('[inert]'),
      active:active?.getAttribute('data-sel')||active?.id||active?.tagName||null,
      panel:window.__CF_SLICE__.api.state().panelOpen}; })()`);
  if (!forbiddenFocus.dockInert || !['tutbtn','tutskip'].includes(forbiddenFocus.active) || forbiddenFocus.panel !== null) {
    fails.push('DRILL KEYBOARD: forbidden Settings focus escaped the welcome guard: ' + JSON.stringify(forbiddenFocus));
  }
  const forbiddenPoint = await evalT(`(()=>{ const r=document.getElementById('docksets').getBoundingClientRect();
    return {x:(r.left+r.right)/2,y:(r.top+r.bottom)/2}; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: forbiddenPoint.x, y: forbiddenPoint.y, button: 'left', clickCount: 1 }, tr);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: forbiddenPoint.x, y: forbiddenPoint.y, button: 'left', clickCount: 1 }, tr);
  await sleep(80);
  const forbiddenActivation = await evalT(`({panel:window.__CF_SLICE__.api.state().panelOpen,
    step:window.__CF_SLICE__.api.state().tutStep,active:document.activeElement?.getAttribute('data-sel')||document.activeElement?.id||null})`);
  if (forbiddenActivation.panel !== null || forbiddenActivation.step !== 'welcome') {
    fails.push('DRILL KEYBOARD: pointer activated forbidden Settings chrome: ' + JSON.stringify(forbiddenActivation));
  }

  /* Discriminating failure in both layers: remove native inert and intercept
     focusin before the document guard. The same outcome becomes an escaped
     focus plus an opened forbidden panel, proving the green gate is not an
     attribute census. Restore every mutation before continuing. */
  const focusLockControl = await evalT(`(()=>{ const dock=document.getElementById('dock'),button=document.getElementById('docksets');
    const hadInert=dock.hasAttribute('inert'),pointer=dock.style.pointerEvents,opacity=dock.style.opacity;
    const block=(event)=>event.stopImmediatePropagation(); window.addEventListener('focusin',block,true);
    dock.removeAttribute('inert'); dock.style.pointerEvents='auto'; button.focus(); button.click();
    const escaped=document.activeElement===button||!!document.getElementById('setpanel')?.contains(document.activeElement);
    const activated=window.__CF_SLICE__.api.state().panelOpen==='set';
    document.querySelector('#setpanel [data-pnx]')?.click();
    if(hadInert) dock.setAttribute('inert',''); else dock.removeAttribute('inert');
    dock.style.pointerEvents=pointer; dock.style.opacity=opacity;
    window.removeEventListener('focusin',block,true); document.querySelector('[data-sel=tutbtn]')?.focus();
    return {escaped,activated}; })()`);
  if (!focusLockControl.escaped || !focusLockControl.activated) {
    fails.push('DRILL KEYBOARD CONTROL FAILED — breaking inert + the focus guard did not expose forbidden Settings: '
      + JSON.stringify(focusLockControl));
  }

  await evalT(`(()=>{ document.querySelector('[data-sel=tutbtn]').click(); return 1; })()`);
  await sleep(80);
  if (await step() !== 'find-earth') fails.push('DRILL: Begin did not reach find-earth: ' + await step());
  const findEarthFocus = await evalT(trainingFocus);
  if (findEarthFocus.active !== 'CANVAS' || !findEarthFocus.allowed
    || !/Field Training, step 2 of 7/i.test(findEarthFocus.announcement)
    || !/find home/i.test(findEarthFocus.announcement)) {
    fails.push('DRILL KEYBOARD: find-earth did not focus/announce the canvas lesson: ' + JSON.stringify(findEarthFocus));
  }
  await keyT('Tab', 'Tab');
  const canvasTab = await evalT(trainingFocus);
  await keyT('Tab', 'Tab', 8);   /* Shift returns to the canvas boundary */
  const canvasReverse = await evalT(trainingFocus);
  if (canvasTab.active !== 'tutskip' || canvasReverse.active !== 'CANVAS'
    || !canvasTab.allowed || !canvasReverse.allowed) {
    fails.push('DRILL KEYBOARD: canvas/card Tab scope escaped: ' + JSON.stringify({ canvasTab, canvasReverse }));
  }
  await evalT(`(()=>{ const S=window.__CF_SLICE__;if(S.api.state().mode==='universe')S.api.descendGalaxy(${JSON.stringify(HOME_GALAXY)});
    if(S.api.state().mode==='galaxy')S.api.descendSystem(${JSON.stringify(SOL_STAR)});return S.api.state();})()`);
  await sleep(1500);
  await evalT(`(()=>{ return window.__CF_SLICE__.api.surveyOn(${JSON.stringify(EARTH)}); })()`);   /* tap Earth = survey */
  await sleep(80);
  if (await step() !== 'survey-tour') fails.push('DRILL: surveying Earth did not advance find-earth: ' + await step());
  const surveyTourFocus = await evalT(trainingFocus);
  if (surveyTourFocus.active !== 'tutbtn' || !surveyTourFocus.allowed
    || !/Field Training, step 3 of 7/i.test(surveyTourFocus.announcement)) {
    fails.push('DRILL KEYBOARD: survey-tour did not focus/announce Got It: ' + JSON.stringify(surveyTourFocus));
  }
  /* Same outcome with a live Earth card: Escape must neither hide the card
     nor ascend, and the lesson's Got It action wins focus again. */
  await keyT('Escape', 'Escape');
  const surveyTourEscapeCheck = `(()=>{ const s=window.__CF_SLICE__.api.state(),card=document.getElementById('survey'),button=document.querySelector('[data-sel=tutbtn]');
    const style=card?getComputedStyle(card):null,r=card?.getBoundingClientRect(),visible=!!card&&card.getAttribute('aria-hidden')==='false'
      &&style?.display!=='none'&&style?.visibility!=='hidden'&&!!r&&r.width>0&&r.height>0;
    const active=document.activeElement===button,text=(button?.textContent||'').trim();
    return {ok:s.mode==='system'&&s.gal===999&&s.star===424242&&s.tutStep==='survey-tour'&&s.cardOpen&&s.cardTitle==='Earth'
      &&visible&&active&&text==='Got It',mode:s.mode,gal:s.gal,star:s.star,step:s.tutStep,cardOpen:s.cardOpen,title:s.cardTitle,
      ariaHidden:card?.getAttribute('aria-hidden')||null,visible,active,text}; })()`;
  const surveyTourEscape = await evalT(surveyTourEscapeCheck);
  if (!surveyTourEscape.ok) {
    fails.push('DRILL ESCAPE: survey-tour Escape closed/ascended instead of keeping Earth card and refocusing Got It: '
      + JSON.stringify(surveyTourEscape));
  }
  const surveyTourEscapeCtl = await evalT(`(()=>{ const card=document.getElementById('survey'),prior=card?.getAttribute('aria-hidden');
    card?.setAttribute('aria-hidden','true');const result=${surveyTourEscapeCheck};
    if(card){if(prior===null)card.removeAttribute('aria-hidden');else card.setAttribute('aria-hidden',prior);}return result;})()`);
  if (surveyTourEscapeCtl.ok) {
    fails.push('DRILL ESCAPE CONTROL FAILED — marking the retained Earth card hidden stayed green: ' + JSON.stringify(surveyTourEscapeCtl));
  }
  const surveyTourEscapeBypassCtl = await evalT(`(()=>{ const S=window.__CF_SLICE__;
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));
    const closed=!S.api.state().cardOpen;document.getElementById('docksurvey')?.click();
    document.querySelector('[data-sel=tutbtn]')?.focus();return {closed,restored:S.api.state().cardOpen};})()`);
  if (!surveyTourEscapeBypassCtl.closed || !surveyTourEscapeBypassCtl.restored) {
    fails.push('DRILL ESCAPE CONTROL FAILED — bypassing the document Training guard did not expose global card close: '
      + JSON.stringify(surveyTourEscapeBypassCtl));
  }
  const surveyTourCopy = await evalT(`(document.querySelector('[data-sel=tuttext]')||{}).textContent||''`);
  if (!/press Land on a world card/i.test(surveyTourCopy) || /dive toward a world/i.test(surveyTourCopy)) {
    fails.push('DRILL COPY: survey-tour does not teach the real explicit Land action: ' + JSON.stringify(surveyTourCopy));
  }
  const surveyTourLandLock = await evalT(trainingLandLockCheck);
  if (!surveyTourLandLock.ok || surveyTourLandLock.lockAction !== 'landcta') {
    fails.push('DRILL EARLY LAND: survey-tour did not lock the exact Land action: ' + JSON.stringify(surveyTourLandLock));
  }
  const surveyTourLandCtl = await evalT(`(()=>{ const land=document.querySelector('#survey [data-act=landcta]'),lock=land?.closest('[inert]');
    if(!land||!lock)return null; const inert=lock.hasAttribute('inert'),pointer=lock.style.pointerEvents;
    lock.removeAttribute('inert'); lock.style.pointerEvents='auto'; const result=${trainingLandLockCheck};
    if(inert) lock.setAttribute('inert',''); else lock.removeAttribute('inert'); lock.style.pointerEvents=pointer; return result; })()`);
  if (!surveyTourLandCtl || surveyTourLandCtl.ok || surveyTourLandCtl.pointer === 'none') {
    fails.push('DRILL EARLY LAND CONTROL FAILED — removing the exact survey-tour lock stayed green: '
      + JSON.stringify(surveyTourLandCtl));
  }
  if (surveyTourLandLock.x !== null && surveyTourLandLock.y !== null) {
    await pointerT(surveyTourLandLock.x, surveyTourLandLock.y);
  }
  const surveyTourLandOutcome = await evalT(`window.__CF_SLICE__.api.state()`);
  if (surveyTourLandOutcome.mode !== 'system' || surveyTourLandOutcome.tutStep !== 'survey-tour'
    || surveyTourLandOutcome.save.landed.includes(133)) {
    fails.push('DRILL EARLY LAND: a real pointer press bypassed the survey-tour lock: '
      + JSON.stringify(surveyTourLandOutcome));
  }
  const shotTut = await send('Page.captureScreenshot', { format: 'png' }, tr);
  fs.writeFileSync(screenshotPath('training'), Buffer.from(shotTut.data, 'base64'));
  await keyT('Enter', 'Enter');
  await sleep(80);
  if (await step() !== 'atlas-add') fails.push('DRILL: Got It did not reach atlas-add: ' + await step());
  const atlasAddFocus = await evalT(trainingFocus);
  if (atlasAddFocus.active !== 'BUTTON' || !atlasAddFocus.allowed
    || await evalT(`document.activeElement?.getAttribute('data-act')`) !== 'add'
    || !/Field Training, step 4 of 7/i.test(atlasAddFocus.announcement)) {
    fails.push('DRILL KEYBOARD: atlas-add did not focus/announce the real Add action: ' + JSON.stringify(atlasAddFocus));
  }
  const atlasAddCopy = await evalT(`(()=>{ const text=(document.querySelector('[data-sel=tuttext]')||{}).textContent||'';
    const label=(document.querySelector('#survey [data-act=add]')||{}).textContent||'';
    return {text,label:label.trim()}; })()`);
  if (!/highlighted Star Atlas action/i.test(atlasAddCopy.text)
    || /\+ Add to Star Atlas|Confirm in Star Atlas/i.test(atlasAddCopy.text)
    || atlasAddCopy.label !== '+ Add to Star Atlas') {
    fails.push('DRILL COPY: Atlas instruction is not label-neutral across fresh/replay actions: ' + JSON.stringify(atlasAddCopy));
  }
  const atlasAddLandLock = await evalT(trainingLandLockCheck);
  if (!atlasAddLandLock.ok || atlasAddLandLock.lockAction !== 'landcta') {
    fails.push('DRILL EARLY LAND: atlas-add did not keep the exact Land action locked: ' + JSON.stringify(atlasAddLandLock));
  }
  const atlasAddLandCtl = await evalT(`(()=>{ const land=document.querySelector('#survey [data-act=landcta]'),lock=land?.closest('[inert]');
    if(!land||!lock)return null; const inert=lock.hasAttribute('inert'),pointer=lock.style.pointerEvents;
    lock.removeAttribute('inert'); lock.style.pointerEvents='auto'; const result=${trainingLandLockCheck};
    if(inert) lock.setAttribute('inert',''); else lock.removeAttribute('inert'); lock.style.pointerEvents=pointer; return result; })()`);
  if (!atlasAddLandCtl || atlasAddLandCtl.ok || atlasAddLandCtl.pointer === 'none') {
    fails.push('DRILL EARLY LAND CONTROL FAILED — removing the exact atlas-add lock stayed green: '
      + JSON.stringify(atlasAddLandCtl));
  }
  if (atlasAddLandLock.x !== null && atlasAddLandLock.y !== null) {
    await pointerT(atlasAddLandLock.x, atlasAddLandLock.y);
  }
  const atlasAddLandOutcome = await evalT(`window.__CF_SLICE__.api.state()`);
  if (atlasAddLandOutcome.mode !== 'system' || atlasAddLandOutcome.tutStep !== 'atlas-add'
    || atlasAddLandOutcome.save.landed.includes(133)) {
    fails.push('DRILL EARLY LAND: a real pointer press bypassed the atlas-add lock: '
      + JSON.stringify(atlasAddLandOutcome));
  }
  await keyT('Enter', 'Enter');
  await sleep(80);
  if (await step() !== 'atlas-open') fails.push('DRILL: +Add did not advance (atlas-add event): ' + await step());
  const atlasOpenFocus = await evalT(trainingFocus);
  if (atlasOpenFocus.active !== 'dockatlas' || !atlasOpenFocus.allowed
    || !/Field Training, step 5 of 7/i.test(atlasOpenFocus.announcement)) {
    fails.push('DRILL KEYBOARD: atlas-open did not focus/announce the visible phone Atlas control: '
      + JSON.stringify(atlasOpenFocus));
  }
  const atlasOpenCopy = await evalT(`(document.querySelector('[data-sel=tuttext]')||{}).textContent||''`);
  if (!/returns to its live system survey/i.test(atlasOpenCopy)
    || !/Land remains your choice/i.test(atlasOpenCopy)
    || /travels there instantly/i.test(atlasOpenCopy)) {
    fails.push('DRILL COPY: Atlas travel still implies direct/automatic planetfall: ' + JSON.stringify(atlasOpenCopy));
  }
  const atl = await evalT(`window.__CF_SLICE__.api.state().atlasCount`);
  if (atl !== 1) fails.push('DRILL: Earth did not land in the Atlas: ' + atl);
  await keyT('Enter', 'Enter');
  await sleep(200);
  if (await step() !== 'land') fails.push('DRILL: opening the Atlas did not advance: ' + await step());
  const landFocus = await evalT(`(()=>{ const state=${trainingFocus},land=document.querySelector('#survey [data-act=landcta]');
    const r=land?.getBoundingClientRect(),hit=r&&document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
    return {...state,landFocused:document.activeElement===land,landReachable:!!land&&!!r&&r.width>=44&&r.height>=44
      &&!!hit&&(hit===land||land.contains(hit)),atlasClosed:document.getElementById('atlaspanel').style.display==='none',
      panel:window.__CF_SLICE__.api.state().panelOpen,pending:window.__CF_SLICE__.api.state().releasePending}; })()`);
  if (!landFocus.landFocused || !landFocus.landReachable || !landFocus.atlasClosed || !landFocus.allowed
    || landFocus.panel !== null || landFocus.pending !== RELEASE_FIXTURE_VERSION
    || !/Field Training, step 6 of 7/i.test(landFocus.announcement)) {
    fails.push('DRILL KEYBOARD: land did not become the focused/reachable action after Atlas: ' + JSON.stringify(landFocus));
  }
  const landCopy = await evalT(`(document.querySelector('[data-sel=tuttext]')||{}).textContent||''`);
  if (!/does not simulate.*descent odds or wave-offs/i.test(landCopy)
    || /hostile worlds fight the descent|always shows your odds/i.test(landCopy)) {
    fails.push('DRILL COPY: Land lesson advertises unported descent odds/wave-offs: ' + JSON.stringify(landCopy));
  }
  /* The final lesson allows only Earth's exact Land button. The canvas must
     reject focus/pointer input; breaking that exact lock must expose the
     escaped focus before every attribute and style is restored. */
  const landCanvasLock = await evalT(`(()=>{ const canvas=document.querySelector('canvas'),land=document.querySelector('#survey [data-act=landcta]');
    canvas?.focus(); return {inert:!!canvas?.closest('[inert]'),pointer:canvas?getComputedStyle(canvas).pointerEvents:null,
      refused:document.activeElement===land,active:document.activeElement?.getAttribute('data-act')||document.activeElement?.tagName||null}; })()`);
  if (!landCanvasLock.inert || landCanvasLock.pointer !== 'none' || !landCanvasLock.refused) {
    fails.push('DRILL LAND SCOPE: canvas focus was not refused in favor of exact Earth Land: ' + JSON.stringify(landCanvasLock));
  }
  const landCanvasCtl = await evalT(`(()=>{ const canvas=document.querySelector('canvas'),land=document.querySelector('#survey [data-act=landcta]');
    const inert=canvas.hasAttribute('inert'),pointer=canvas.style.pointerEvents;
    const block=(event)=>event.stopImmediatePropagation(); window.addEventListener('focusin',block,true);
    canvas.removeAttribute('inert'); canvas.style.pointerEvents='auto'; canvas.focus();
    const escaped=document.activeElement===canvas;
    if(inert) canvas.setAttribute('inert',''); else canvas.removeAttribute('inert'); canvas.style.pointerEvents=pointer;
    window.removeEventListener('focusin',block,true); land?.focus(); return {escaped,restored:document.activeElement===land}; })()`);
  if (!landCanvasCtl.escaped || !landCanvasCtl.restored) {
    fails.push('DRILL LAND SCOPE CONTROL FAILED — removing the exact canvas lock did not expose escaped focus: '
      + JSON.stringify(landCanvasCtl));
  }
  await keyT('Enter', 'Enter');
  await sleep(700);
  if (await step() !== 'grad') fails.push('DRILL: landing on Earth did not graduate: ' + await step());
  const trainingSideCheck = `(()=>{ const side=document.getElementById('planetside'),s=window.__CF_SLICE__.api.state(),style=side?getComputedStyle(side):null;
    return {ok:s.mode==='surface'&&s.tutActive&&s.tutStep==='grad'&&style?.display==='none',mode:s.mode,step:s.tutStep,
      active:s.tutActive,display:style?.display||'missing',text:(side?.textContent||'').trim().length};})()`;
  const trainingSide = await evalT(trainingSideCheck);
  if (!trainingSide.ok || !(trainingSide.text > 20)) {
    fails.push('DRILL PLANETSIDE: populated strip was not intentionally hidden during the real land→graduation beat: ' + JSON.stringify(trainingSide));
  }
  const trainingSideCtl = await evalT(`(()=>{ const side=document.getElementById('planetside'),prior=side.getAttribute('style');
    side.style.setProperty('display','block','important');const result=${trainingSideCheck};
    if(prior===null)side.removeAttribute('style');else side.setAttribute('style',prior);return result;})()`);
  if (trainingSideCtl.ok) {
    fails.push('DRILL PLANETSIDE CONTROL FAILED — forcing the strip visible behind graduation stayed green: ' + JSON.stringify(trainingSideCtl));
  }
  const postLandAtlas = await evalT(`({atlasClosed:document.getElementById('atlaspanel').style.display==='none',
    panel:window.__CF_SLICE__.api.state().panelOpen,mode:window.__CF_SLICE__.api.state().mode})`);
  if (!postLandAtlas.atlasClosed || postLandAtlas.panel !== null || postLandAtlas.mode !== 'surface') {
    fails.push('DRILL: product choreography left the Atlas open after real Earth Land: ' + JSON.stringify(postLandAtlas));
  }
  const gradFocus = await evalT(trainingFocus);
  if (gradFocus.active !== 'tutbtn' || !gradFocus.allowed
    || !/Field Training, step 7 of 7/i.test(gradFocus.announcement)) {
    fails.push('DRILL KEYBOARD: graduation was not focused and announced: ' + JSON.stringify(gradFocus));
  }
  await keyT('Enter', 'Enter');
  await sleep(400);
  const done3 = await evalT(`window.__CF_SLICE__.api.state()`);
  if (done3.tutActive || !done3.tutDone) fails.push('DRILL: graduation did not close training: ' + JSON.stringify([done3.tutActive, done3.tutDone]));
  if (done3.mode !== 'surface') fails.push('DRILL: the drill should end planetside: ' + done3.mode);
  const finishFocus = await evalT(`(()=>{ const active=document.activeElement,heading=document.querySelector('#guidepanel [data-guide-heading]'),back=document.querySelector('#guidepanel [data-sel="guide-body"] [data-guide-releases]'); return {
    heading:heading?.textContent||'',backFocus:active===back,insideTraining:!!active?.closest('#tutcard'),
    trainingPresent:!!document.getElementById('tutcard'),inertChrome:document.querySelectorAll('[inert]').length,
    atlasClosed:document.getElementById('atlaspanel').style.display==='none',panel:window.__CF_SLICE__.api.state().panelOpen,
    rnSeen:window.__CF_SLICE__.api.state().rnSeen,pending:window.__CF_SLICE__.api.state().releasePending}; })()`);
  if (!finishFocus.backFocus || !/Browser fixture bulletin/.test(finishFocus.heading)
    || finishFocus.insideTraining || finishFocus.trainingPresent || finishFocus.inertChrome !== 0
    || !finishFocus.atlasClosed || finishFocus.panel !== 'guide'
    || finishFocus.rnSeen !== RELEASE_FIXTURE_VERSION || finishFocus.pending !== null) {
    fails.push('DRILL/RELEASE QUEUE: finish did not unlock Training then open only the queued bulletin: '
      + JSON.stringify(finishFocus));
  }
  let trainingReleaseStored = false;
  for (let i = 0; i < 80 && !trainingReleaseStored; i++) {
    trainingReleaseStored = !!(await evalT(`new Promise((resolve)=>{ const q=indexedDB.open('cf-v2-slice');
      q.onerror=()=>resolve(false); q.onsuccess=()=>{ const db=q.result,tx=db.transaction('meta','readonly'),g=tx.objectStore('meta').get('save');
        g.onsuccess=()=>{ let rn=null; try{rn=JSON.parse(String(g.result||''))?.rn||null}catch{} db.close();
          resolve(rn===${JSON.stringify(RELEASE_FIXTURE_VERSION)}); }; g.onerror=()=>{db.close();resolve(false)}; }; })`));
    if (!trainingReleaseStored) await sleep(50);
  }
  if (!trainingReleaseStored) fails.push('DRILL/RELEASE QUEUE: rnSeen did not persist after the post-Training bulletin');
  await evalT(`(()=>{ document.querySelector('#guidepanel [data-pnx]')?.click(); return true; })()`);
  const restoredSideCheck = `(()=>{ const side=document.getElementById('planetside'),s=window.__CF_SLICE__.api.state(),style=side?getComputedStyle(side):null,r=side?.getBoundingClientRect();
    return {ok:s.mode==='surface'&&!s.tutActive&&style?.display!=='none'&&!!r&&r.width>0&&r.height>0,mode:s.mode,active:s.tutActive,
      display:style?.display||'missing',rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null};})()`;
  const restoredSide = await evalT(restoredSideCheck);
  if (!restoredSide.ok) fails.push('DRILL PLANETSIDE: strip did not return after graduation and bulletin close: ' + JSON.stringify(restoredSide));
  const restoredSideCtl = await evalT(`(()=>{ const side=document.getElementById('planetside'),prior=side.getAttribute('style');
    side.style.setProperty('display','none','important');const result=${restoredSideCheck};
    if(prior===null)side.removeAttribute('style');else side.setAttribute('style',prior);return result;})()`);
  if (restoredSideCtl.ok) fails.push('DRILL PLANETSIDE RESTORE CONTROL FAILED — hiding the restored strip stayed green: ' + JSON.stringify(restoredSideCtl));
  /* the promise: training persists as DONE across reload */
  await navigateToSlice(tr, URL2, 'phone training completion reload');
  await sleep(2500);
  const done4 = await evalT(`window.__CF_SLICE__.api.state()`);
  if (done4.tutActive || done4.panelOpen !== null || done4.rnSeen !== RELEASE_FIXTURE_VERSION) {
    fails.push('DRILL/RELEASE QUEUE: completion or seen-state did not survive reload without another popup: '
      + JSON.stringify(done4));
  }
  const done4Repeat = await evalT(`(()=>{ const S=window.__CF_SLICE__,opened=S.api.showReleaseFixture(${JSON.stringify(RELEASE_FIXTURE_VERSION)}),s=S.api.state();
    return {opened,panel:s.panelOpen,rnSeen:s.rnSeen}; })()`);
  if (done4Repeat.opened || done4Repeat.panel !== null || done4Repeat.rnSeen !== RELEASE_FIXTURE_VERSION) {
    fails.push('DRILL/RELEASE QUEUE: the seen fixture repeated after completion reload: ' + JSON.stringify(done4Repeat));
  }

  /* 5. zero console errors / exceptions across the whole run */
  const errs = events.filter((e) =>
    (e.method === 'Runtime.exceptionThrown') ||
    (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error'));
  if (errs.length) fails.push(errs.length + ' console errors/exceptions, first: ' + JSON.stringify(errs[0].params).slice(0, 300));
} catch (e) {
  const firstPageError = events.find((event) => event.method === 'Runtime.exceptionThrown'
    || (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error'));
  fails.push('harness: ' + e.message + (firstPageError
    ? ' · first page error: ' + JSON.stringify(firstPageError.params).slice(0, 500)
    : ''));
} finally {
  releaseSlowSpecies();
  try { await browser.close(); } catch (e) { fails.push('browser close: ' + e.message); }
  server.close(); server2.close(); server3.close(); server4.close(); server5.close();
}

if (fails.length) { console.error('SLICE SMOKE: FAIL\n  - ' + fails.join('\n  - ')); process.exit(1); }
console.log('SLICE SMOKE: PASS — the GATE D core loop: booted · painted · CANONICAL GUIDE (9 categories / 43 authored / 41 legacy-live topics, capability boundaries, search, full release history, persisted seen state) · one-time shipped-bulletin fixture + Training queue · SETTINGS IMPORT accessible and focused · REGISTERED PANEL CHROME (both real rail gaps stay open; removed ownership closes; true sky closes; non-Element targets fail closed) · COMPLETE KEYBOARD canvas → galaxy → system → Land → Leave/Escape journey · ADVANCING EPOCH SNAPSHOT → RAW IDB → RELOAD · native Compendium query/detail/Back, network-gated lazy-art focus retention, and Atlas Space/Enter travel · rendered Reduced/Full motion outcomes · SURVEY-FIRST (one tap = card; explicit Enter = dive; real 390×844 touch) · early-Land Training locks + exact final Earth action · CHARTER stage-0 gate · Milky Way · Sol · EARTH planetfall · REAL SAVE reload · ZOOM LADDER + empty-space control · Sun marker + fine stars · GATE C veteran/protected-save rehearsal · PHONE Land → Leave round-trip, paint, pinch, responsive chrome · honest clipboard denial/success · zero console errors.');
console.log('screenshots: apps/game/smoke/ slice-universe · slice-galaxy · slice-sol · slice-guide · slice-settings · slice-training · slice-earth · slice-solmark · slice-phone');
process.exit(0);
