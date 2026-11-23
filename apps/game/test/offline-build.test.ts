import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { appIconPng } from '../offline/icon';
import { ICONS, buildTable, headLinks, shellFiles, webManifest, workerFile } from '../offline/plugin';
import { build } from './offline-support';

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

describe('the offline shell build', () => {
  it('the shell is the game\'s page and its files: no art pack, no source map, no other page, not the worker', () => {
    expect(shellFiles(['assets/app.js', 'index.html', 'assets/app.js.map', 'art-packs/interface-v1.txt', 'layout.html', 'service-worker.js', 'manifest.webmanifest', 'icons/app-192.png']))
      .toEqual(['assets/app.js', 'icons/app-192.png', 'index.html', 'manifest.webmanifest']);
    expect(() => shellFiles(['assets/app.js', 'layout.html'])).toThrow(/no index\.html/);
  });

  it('a build\'s identity is the same for the same bytes in any order, and new for one changed byte or a changed worker', () => {
    const one = build({ 'index.html': 'a', 'assets/app.js': 'b' });
    expect(build({ 'assets/app.js': 'b', 'index.html': 'a' })).toEqual(one);
    expect(one.files.map((file) => file.path)).toEqual(['/cf/assets/app.js', '/cf/index.html']);
    expect(one.buildId).toMatch(/^[a-f0-9]{64}$/);
    expect(build({ 'index.html': 'a', 'assets/app.js': 'c' }).buildId).not.toBe(one.buildId);
    expect(build({ 'index.html': 'a', 'assets/app.js': 'b' }, 'b'.repeat(64)).buildId).not.toBe(one.buildId);
  });

  it('refuses a table that could not be served', () => {
    const index = { name: 'index.html', bytes: bytes('a') };
    expect(() => buildTable('/cf/', [{ name: 'app.js', bytes: bytes('a') }], 'a'.repeat(64))).toThrow(/no index\.html/);
    expect(() => buildTable('/cf/', [index, index], 'a'.repeat(64))).toThrow(/twice/);
    expect(() => buildTable('/cf/', [index, { name: '../secret', bytes: bytes('a') }], 'a'.repeat(64))).toThrow(/unsafe/);
    expect(() => buildTable('cf/', [index], 'a'.repeat(64))).toThrow(/base/);
    expect(() => buildTable('/cf/', [index], 'nonsense')).toThrow(/worker revision/);
  });

  it('the worker file carries its table ahead of its program', () => {
    const table = build({ 'index.html': 'a' });
    const file = workerFile(table, 'run(CF_SHELL_BUILD);');
    const seen: unknown[] = [];
    new Function('run', file)((value: unknown) => { seen.push(value); });
    expect(seen).toEqual([table]);
  });

  it('every icon is a PNG of its size with the drawing inside it', () => {
    for (const icon of ICONS) {
      const png = appIconPng(icon.size, icon.step);
      expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const view = new DataView(png.buffer);
      expect([view.getUint32(16), view.getUint32(20)]).toEqual([icon.size, icon.size]);
      const length = view.getUint32(33);
      const rows = inflateSync(png.subarray(41, 41 + length));
      expect(rows.length).toBe(icon.size * (1 + icon.size * 3));
      // The corner is the ground; the middle of the drawing is not.
      const pixel = (x: number, y: number): number[] => [...rows.subarray(y * (1 + icon.size * 3) + 1 + x * 3, y * (1 + icon.size * 3) + 4 + x * 3)];
      expect(pixel(0, 0)).toEqual([0x05, 0x07, 0x0d]);
      const inset = (icon.size - 16 * icon.step) >> 1;
      expect(pixel(inset + 7 * icon.step, inset + 5 * icon.step)).toEqual([0xff, 0xf0, 0xa8]);
      // A maskable icon keeps its drawing inside the middle four fifths.
      if (icon.purpose === 'maskable') expect(inset).toBeGreaterThanOrEqual(icon.size / 10);
    }
    expect(() => appIconPng(64, 8)).toThrow(/does not fit/);
  });

  it('the manifest and the page name only files of this build, under its base', () => {
    const manifest = JSON.parse(webManifest('/cf/')) as { start_url: string; scope: string; icons: Array<{ src: string; type: string; sizes: string }> };
    expect([manifest.start_url, manifest.scope]).toEqual(['/cf/', '/cf/']);
    expect(manifest.icons).toEqual([
      { src: '/cf/icons/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/cf/icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/cf/icons/app-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ]);
    const html = headLinks('<head>\n<link rel="icon" href="data:,">\n</head>', '/cf/');
    expect(html).toContain('<link rel="manifest" href="/cf/manifest.webmanifest">');
    expect(html).toContain('<link rel="apple-touch-icon" href="/cf/icons/app-touch-180.png">');
    expect(html).not.toContain('data:,');
    expect(() => headLinks('<head></head>', '/cf/')).toThrow(/no icon line/);
  });
});
