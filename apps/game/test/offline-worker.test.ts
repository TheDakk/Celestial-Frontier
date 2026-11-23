import { describe, expect, it } from 'vitest';
import { PACK_CACHE_NAME } from '../src/packs';
import { BUILD_CACHE_PREFIX, PACKS_FOLDER, SHELL_SCHEMA } from '../offline/worker-source';
import { at, build, get, navigate, page, serve, text, worker, world } from './offline-support';

const A = { 'index.html': '<p>one</p>', 'assets/app.js': 'one()', 'manifest.webmanifest': '{}' };
const B = { 'index.html': '<p>two</p>', 'assets/app.js': 'two()', 'manifest.webmanifest': '{}' };
const C = { 'index.html': '<p>three</p>', 'assets/app.js': 'three()', 'manifest.webmanifest': '{}' };

/** The first build installed and running, with one page open on it. */
async function installed() {
  const w = world();
  serve(w, A);
  const tableA = build(A);
  const a = worker(w, tableA);
  const first = page('page-1');
  w.pages.push(first);
  await a.install();
  await a.activate();
  return { w, a, tableA, first };
}

/** A later build installed beside the running one: waiting. */
async function waiting(files: Readonly<Record<string, string>> = B) {
  const base = await installed();
  serve(base.w, files);
  const tableB = build(files);
  const b = worker(base.w, tableB);
  await b.install();
  return { ...base, b, tableB };
}

const state = async (w: ReturnType<typeof world>): Promise<unknown> =>
  JSON.parse(await [...w.caches.stores.get('cf-v2-pixel-shell-control')!.entries()].find(([url]) => url.endsWith('/state'))![1].clone().text());

const pins = (w: ReturnType<typeof world>): string[] => [...w.caches.stores.get('cf-v2-pixel-shell-control')!.keys()]
  .filter((url) => url.includes('/client/')).map((url) => decodeURIComponent(url.split('/client/')[1]!)).sort();

describe('the offline shell worker', () => {
  it('after install, every listed file is answered from the cache with the network failing', async () => {
    const { w, a, tableA } = await installed();
    expect(w.claimed).toBe(1);
    w.server.clear();
    w.fetched.length = 0;

    expect(await text(a.respond(navigate('', 'page-2')))).toBe('200:<p>one</p>');
    for (const file of tableA.files) {
      const name = file.path.slice('/cf/'.length);
      expect(await text(a.respond(get(name, 'page-2')))).toBe(`200:${A[name as keyof typeof A]}`);
    }
    // An address of the app that is no file is the app's page; a query changes nothing.
    expect(await text(a.respond(navigate('?locale=qps-ploc', 'page-3')))).toBe('200:<p>one</p>');
    expect(await text(a.respond(navigate('layout.html', 'page-4')))).toBe('200:<p>one</p>');
    expect(w.fetched).toEqual([]);
  });

  it('answers nothing it does not hold: no file comes from the network in the shell\'s name', async () => {
    const { w, a } = await installed();
    serve(w, { 'assets/other.js': 'other()' });
    w.fetched.length = 0;
    expect((await a.respond(get('assets/other.js', 'page-1'))).status).toBe(503);
    expect((await a.respond(get('layout.html', 'page-1'))).status).toBe(503);
    expect((await a.respond({ ...get('assets/app.js', 'page-1'), method: 'POST' })).status).toBe(405);
    expect((await a.respond({ ...get('assets/app.js', 'page-1'), url: 'https://elsewhere.test/font.woff2' })).status).toBe(403);
    expect(w.fetched).toEqual([]);
  });

  it('a page the browser named no pin for is answered from the active build and pinned to it, so a later build does not change its files', async () => {
    const { w, a } = await installed();
    // The browser gave the page being loaded no identity: nothing could be pinned.
    expect(await text(a.respond({ ...navigate('', ''), clientId: '' }))).toBe('200:<p>one</p>');
    const late = page('page-9');
    w.pages.push(late);
    w.server.clear();
    expect(await text(a.respond(get('assets/app.js', 'page-9')))).toBe('200:one()');
    expect(await text(a.respond(get('manifest.webmanifest', 'page-9')))).toBe('200:{}');
    expect(pins(w)).toEqual(['page-1', 'page-9']);

    serve(w, B);
    const b = worker(w, build(B));
    await b.install();
    await b.activate();
    expect(await text(b.respond(get('assets/app.js', 'page-9')))).toBe('200:one()');
    // A request with no page behind it at all is answered from the active build, and nothing is pinned for it.
    expect(await text(b.respond(get('assets/app.js', '')))).toBe('200:two()');
    expect(pins(w)).toEqual(['page-1', 'page-9']);
  });

  it('a pin that cannot be written does not cost the page its files', async () => {
    const { w, a } = await installed();
    const control = w.caches.stores.get('cf-v2-pixel-shell-control')!;
    const put = control.set.bind(control);
    control.set = (url, response) => {
      if (url.includes('/client/')) throw new Error('the quota is used up');
      return put(url, response);
    };
    w.server.clear();
    expect(await text(a.respond(navigate('', 'page-2')))).toBe('200:<p>one</p>');
    expect(await text(a.respond(get('assets/app.js', 'page-2')))).toBe('200:one()');
    expect(pins(w)).toEqual(['page-1']);
  });

  it('installing a build forgets the pins of pages that have closed', async () => {
    const { w, a } = await installed();
    await a.respond(navigate('', 'page-2'));
    expect(pins(w)).toEqual(['page-1', 'page-2']);
    serve(w, B);
    await worker(w, build(B)).install();
    expect(pins(w)).toEqual(['page-1']);
  });

  it('leaves art packs to their loader: a pack request is not the worker\'s to answer', async () => {
    const { a } = await installed();
    expect(a.owns(get(`${PACKS_FOLDER}interface-v1.txt`, 'page-1'))).toBe(false);
    expect(a.owns(get('assets/app.js', 'page-1'))).toBe(true);
    expect(a.owns(navigate('', 'page-2'))).toBe(true);
  });

  it('a file whose bytes do not match its listed hash fails the install and leaves the old build serving', async () => {
    const { w, a, tableA } = await installed();
    const tableB = build(B);
    serve(w, { ...B, 'assets/app.js': 'two() ' });
    const b = worker(w, tableB);
    await expect(b.install()).rejects.toThrow(/does not match its hash: \/cf\/assets\/app\.js/);
    expect(w.caches.stores.has(BUILD_CACHE_PREFIX + tableB.buildId)).toBe(false);
    await expect(b.activate()).rejects.toThrow(/incomplete/);
    expect(await state(w)).toEqual({ schema: SHELL_SCHEMA, activeBuildId: tableA.buildId, priorBuildId: null });
    w.server.clear();
    expect(await text(a.respond(navigate('', 'page-2')))).toBe('200:<p>one</p>');
    expect(await text(a.respond(get('assets/app.js', 'page-2')))).toBe('200:one()');
  });

  it('a file the server does not answer fails the install the same way', async () => {
    const { w } = await installed();
    serve(w, B);
    w.server.delete(at('manifest.webmanifest'));
    const tableB = build(B);
    await expect(worker(w, tableB).install()).rejects.toThrow();
    expect(w.caches.stores.has(BUILD_CACHE_PREFIX + tableB.buildId)).toBe(false);
  });

  it('a build already held whole is not fetched again', async () => {
    const { w, tableA } = await installed();
    w.fetched.length = 0;
    w.server.clear();
    await worker(w, tableA).install();
    expect(w.fetched).toEqual([]);
  });

  it('a new build waits while a page is open; it serves after activation is asked', async () => {
    const { w, a, b, tableA, tableB, first } = await waiting();
    // Installed beside the running build, and silent.
    expect(await state(w)).toEqual({ schema: SHELL_SCHEMA, activeBuildId: tableA.buildId, priorBuildId: null });
    expect(await text(a.respond(navigate('', 'page-2')))).toBe('200:<p>one</p>');
    expect(w.skipped).toEqual([]);

    // Only its own name activates it.
    await b.message({ type: 'CF_PWA_ACTIVATE', buildId: tableA.buildId }, first);
    await b.message({ type: 'CF_PWA_ACTIVATE' }, first);
    expect(w.skipped).toEqual([]);
    await b.message({ type: 'CF_PWA_ACTIVATE', buildId: tableB.buildId }, first);
    expect(w.skipped).toEqual([tableB.buildId.slice(0, 6)]);
    expect(first.messages.at(-1)).toEqual({ type: 'CF_PWA_ACTIVATE_RESULT', schema: SHELL_SCHEMA, ok: true, buildId: tableB.buildId });

    await b.activate();
    expect(await state(w)).toEqual({ schema: SHELL_SCHEMA, activeBuildId: tableB.buildId, priorBuildId: tableA.buildId });
    // The running page is not claimed, and is told.
    expect(w.claimed).toBe(1);
    expect(first.messages.at(-1)).toMatchObject({ type: 'CF_PWA_STATUS', phase: 'active', activeBuildId: tableB.buildId, priorBuildId: tableA.buildId });
    // The page that was open keeps the build it started with; a page opened now gets the new one.
    w.server.clear();
    expect(await text(b.respond(get('assets/app.js', 'page-1')))).toBe('200:one()');
    expect(await text(b.respond(navigate('', 'page-2')))).toBe('200:<p>two</p>');
    expect(await text(b.respond(get('assets/app.js', 'page-2')))).toBe('200:two()');
    // Reloaded, the old page is a new one.
    expect(await text(b.respond(navigate('', 'page-1b')))).toBe('200:<p>two</p>');
  });

  it('activating a new build never deletes the pack cache, and keeps one build behind', async () => {
    const { w, b, tableA, tableB, first } = await waiting();
    const packs = await w.caches.open(PACK_CACHE_NAME);
    await packs.put(`${at('')}${PACK_CACHE_NAME}/${'c'.repeat(64)}`, new Response('pack bytes'));
    await b.activate();
    expect([...w.caches.stores.keys()].sort()).toEqual([BUILD_CACHE_PREFIX + tableA.buildId, BUILD_CACHE_PREFIX + tableB.buildId, 'cf-v2-pixel-shell-control', PACK_CACHE_NAME].sort());

    // The page reloads into the second build; a third then takes the first one's place.
    w.pages.splice(0, 1, page('page-2'));
    await b.respond(navigate('', 'page-2'));
    serve(w, C);
    const tableC = build(C);
    const c = worker(w, tableC);
    await c.install();
    await c.activate();
    expect([...w.caches.stores.keys()].sort()).toEqual([BUILD_CACHE_PREFIX + tableB.buildId, BUILD_CACHE_PREFIX + tableC.buildId, 'cf-v2-pixel-shell-control', PACK_CACHE_NAME].sort());
    expect(await (await packs.match(`${at('')}${PACK_CACHE_NAME}/${'c'.repeat(64)}`))!.text()).toBe('pack bytes');
    await c.message({ type: 'CF_PWA_ROLLBACK' }, first);
    expect(w.caches.stores.has(PACK_CACHE_NAME)).toBe(true);
  });

  it('a third build is refused while an open page still runs the build it would remove', async () => {
    const { w, b, first } = await waiting();
    await b.activate();
    serve(w, C);
    const tableC = build(C);
    const c = worker(w, tableC);
    await c.install();
    // page-1 never reloaded: it still runs the first build.
    await c.message({ type: 'CF_PWA_ACTIVATE', buildId: tableC.buildId }, first);
    expect(first.messages.at(-1)).toEqual({ type: 'CF_PWA_ACTIVATE_RESULT', schema: SHELL_SCHEMA, ok: false, buildId: tableC.buildId, reason: 'prior-build-in-use' });
    expect(w.skipped).toEqual([]);
    await expect(c.activate()).rejects.toThrow(/still owned/);
    expect(await text(b.respond(get('assets/app.js', 'page-1')))).toBe('200:one()');
  });

  it('rolling back selects the build before, whole, and can be undone', async () => {
    const { w, b, tableA, tableB, first } = await waiting();
    await b.message({ type: 'CF_PWA_ROLLBACK' }, first);
    expect(first.messages.at(-1)).toEqual({ type: 'CF_PWA_ROLLBACK_RESULT', schema: SHELL_SCHEMA, ok: false, reason: 'no-complete-prior-build' });

    await b.activate();
    w.pages.splice(0, 1, page('page-2'));
    await b.respond(navigate('', 'page-2'));
    const second = w.pages[0]!;
    await b.message({ type: 'CF_PWA_ROLLBACK' }, second);
    const result = { type: 'CF_PWA_ROLLBACK_RESULT', schema: SHELL_SCHEMA, ok: true, activeBuildId: tableA.buildId, priorBuildId: tableB.buildId };
    expect(second.messages.slice(-2)).toEqual([result, result]);
    expect(await state(w)).toEqual({ schema: SHELL_SCHEMA, activeBuildId: tableA.buildId, priorBuildId: tableB.buildId });
    w.server.clear();
    // The open page keeps the new build until it reloads; reloaded, it runs the old one.
    expect(await text(b.respond(get('assets/app.js', 'page-2')))).toBe('200:two()');
    expect(await text(b.respond(navigate('', 'page-3')))).toBe('200:<p>one</p>');
    expect(await text(b.respond(get('assets/app.js', 'page-3')))).toBe('200:one()');

    await b.message({ type: 'CF_PWA_ROLLBACK' }, second);
    expect(await state(w)).toEqual({ schema: SHELL_SCHEMA, activeBuildId: tableB.buildId, priorBuildId: tableA.buildId });
  });

  it('a prior build that lost a file is not offered for rollback, and a damaged one is never served', async () => {
    const { w, b, tableA, first } = await waiting();
    await b.activate();
    w.caches.stores.get(BUILD_CACHE_PREFIX + tableA.buildId)!.delete(at('assets/app.js'));
    await b.message({ type: 'CF_PWA_ROLLBACK' }, first);
    expect(first.messages.at(-1)).toMatchObject({ ok: false, reason: 'no-complete-prior-build' });
    expect((await b.respond(get('assets/app.js', 'page-1'))).status).toBe(503);
  });

  it('answers what it is asked about itself, and forgets pages that have closed', async () => {
    const { w, a, b, tableA, tableB, first } = await waiting();
    await b.message({ type: 'CF_PWA_GET_STATUS', target: 'waiting' }, first);
    expect(first.messages.at(-1)).toEqual({ type: 'CF_PWA_STATUS', schema: SHELL_SCHEMA, workerBuildId: tableB.buildId, activeBuildId: tableA.buildId, priorBuildId: null, phase: 'waiting' });
    await a.message({ type: 'CF_PWA_GET_STATUS', target: 'active' }, first);
    expect(first.messages.at(-1)).toMatchObject({ workerBuildId: tableA.buildId, phase: 'active' });

    await a.respond(navigate('', 'page-2'));
    expect(pins(w)).toEqual(['page-1', 'page-2']);
    // page-2 was never opened here: its pin goes at the next activation.
    await b.activate();
    expect(pins(w)).toEqual(['page-1']);
  });
});
