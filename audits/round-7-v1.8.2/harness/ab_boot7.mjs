/* Paired cold-boot measurement: same host, alternating builds, fresh context each
   time (no cache carry-over), N reps. Only the paired delta is meaningful. */
import { chromium } from 'playwright';

const BUILDS = { 'v1.7.20': 'http://127.0.0.1:8908/game.html',
                 'v1.8.2': 'http://127.0.0.1:8906/game.html' };
const REPS = 8;
const rows = [];

const br = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
for (let rep = 0; rep < REPS; rep++) {
  for (const [name, url] of Object.entries(BUILDS)) {
    const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: true });
    const p = await ctx.newPage();
    const t0 = Date.now();
    await p.goto(url, { waitUntil: 'load', timeout: 60000 });
    const loadMs = Date.now() - t0;
    // "playable" = the name gate is up and interactive
    let readyMs = null;
    try {
      await p.waitForSelector('#nameok', { state: 'visible', timeout: 30000 });
      readyMs = Date.now() - t0;
    } catch (_) {}
    const nav = await p.evaluate(() => {
      const e = performance.getEntriesByType('navigation')[0];
      if (!e) return null;
      return { dcl: Math.round(e.domContentLoadedEventEnd), load: Math.round(e.loadEventEnd),
               resp: Math.round(e.responseEnd), transfer: e.transferSize || null };
    });
    const fcp = await p.evaluate(() => {
      const e = performance.getEntriesByName('first-contentful-paint')[0];
      return e ? Math.round(e.startTime) : null;
    });
    rows.push({ rep, build: name, loadMs, readyMs, dcl: nav && nav.dcl, fcp });
    console.log(`rep${rep} ${name}  load=${String(loadMs).padStart(5)}ms  ready=${String(readyMs).padStart(5)}ms  DCL=${String(nav && nav.dcl).padStart(5)}ms  FCP=${String(fcp).padStart(5)}ms`);
    await ctx.close();
  }
}
await br.close();

const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
console.log('\n=== paired medians (alternating, same host) ===');
for (const k of ['loadMs', 'readyMs', 'dcl', 'fcp']) {
  const a = med(rows.filter(r => r.build === 'v1.7.19').map(r => r[k]));
  const b = med(rows.filter(r => r.build === 'v1.7.20').map(r => r[k]));
  const d = (a != null && b != null) ? (b - a >= 0 ? '+' : '') + (b - a) : '-';
  console.log(`${k.padEnd(9)} v1.7.19 ${String(a).padStart(6)}ms   v1.7.20 ${String(b).padStart(6)}ms   delta ${d}ms`);
}
