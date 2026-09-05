import { execFileSync } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigEnv, HtmlTagDescriptor, ResolvedConfig, UserConfig } from 'vite';
import {
  __pwaBuildTestOnly,
  celestialFrontierPwaPlugin,
  gameBuildMode,
  pwaWorkerRevisionV1,
  sha256Hex,
} from '../apps/game/pwa-build.js';
import viteConfig from '../apps/game/vite.config.js';
import { assertBuiltGameMode, readBuiltGameMode } from '../tools/build-mode.mjs';

const { files, writes } = vi.hoisted(() => ({
  files: new Map<string, string>(),
  writes: new Map<string, string>(),
}));
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    readFileSync: vi.fn((file: unknown, encoding?: unknown) => {
      const path = String(file);
      if (!path.startsWith('/virtual/cf-build-mode/')) {
        return actual.readFileSync(file as never, encoding as never);
      }
      const source = files.get(path);
      if (source === undefined) throw new Error(`ENOENT: ${path}`);
      return encoding === 'utf8' ? source : Buffer.from(source);
    }),
    writeFileSync: vi.fn((file: unknown, source: unknown) => {
      const path = String(file);
      if (!path.startsWith('/virtual/cf-build-mode/')) throw new Error(`Unexpected write: ${path}`);
      writes.set(path, String(source));
    }),
  };
});

const distDir = '/virtual/cf-build-mode/dist';
const indexPath = `${distDir}/index.html`;
const html = (head: string, body = ''): string => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
const marker = (mode: string): string => `<meta name="cf-build-mode" content="${mode}">`;

// Exercise the plugin's real hooks with only the bundler/file-system boundary mocked.
interface PluginHarness {
  configResolved(config: ResolvedConfig): void;
  transformIndexHtml: {
    handler(source: string, context: { path: string }): string | { html: string; tags: HtmlTagDescriptor[] };
  };
  generateBundle(
    this: { emitFile(asset: { fileName: string; source: string }): void },
    options: object,
    bundle: Record<string, { type: 'asset'; fileName: string; source: string }>,
  ): void;
  writeBundle: { handler(options: { dir: string }): void };
}

function configuredPlugin(mode: string): PluginHarness {
  const plugin = celestialFrontierPwaPlugin() as unknown as PluginHarness;
  plugin.configResolved({ root: '/virtual/cf-build-mode', mode, base: '/', build: { outDir: 'dist' } } as ResolvedConfig);
  return plugin;
}

function transformedHtml(plugin: PluginHarness): string {
  const result = plugin.transformIndexHtml.handler(html(''), { path: '/index.html' });
  if (typeof result === 'string') throw new Error('Index transform did not inject metadata');
  const tags = result.tags.map((tag) => `<${tag.tag} ${Object.entries(tag.attrs ?? {})
    .map(([name, value]) => `${name}="${value}"`).join(' ')}>`).join('');
  return result.html.replace('</head>', `${tags}</head>`);
}

beforeEach(() => {
  files.clear();
  writes.clear();
});

describe('explicit evidence build opt-in', () => {
  it.each(['', 'production', 'development', 'preview', 'test', 'Evidence', 'evidence ', 'evidence'])
    ('defines and marks mode %j without relying on DEV or NODE_ENV', async (mode) => {
      const expected = mode === 'evidence' ? 'evidence' : 'distributable';
      expect(gameBuildMode(mode)).toBe(expected);
      const config = await (viteConfig as (env: ConfigEnv) => UserConfig | Promise<UserConfig>)({ command: 'build', mode });
      expect(config.define?.__CF_EVIDENCE_BUILD__).toBe(String(expected === 'evidence'));
      const plugin = configuredPlugin(mode);
      files.set(indexPath, transformedHtml(plugin));
      expect(assertBuiltGameMode(distDir, expected)).toBe(expected);
      expect(plugin.transformIndexHtml.handler('<html></html>', { path: '/audit.html' })).toBe('<html></html>');
    });

  it('fails closed if HTML transformation runs without resolved build configuration', () => {
    const plugin = celestialFrontierPwaPlugin() as unknown as PluginHarness;
    expect(() => plugin.transformIndexHtml.handler(html(''), { path: '/index.html' })).toThrow('not configured');
  });
});

describe('read-only built-mode admission', () => {
  it('does not load the HTML runtime for source-only imports or early mode rejection', () => {
    const moduleUrl = new URL('../tools/build-mode.mjs', import.meta.url).href;
    const source = `
      import assert from 'node:assert/strict';
      import { createRequire } from 'node:module';
      const require = createRequire(${JSON.stringify(import.meta.url)});
      const jsdom = require.resolve('jsdom');
      assert.equal(require.cache[jsdom], undefined);
      const reader = await import(${JSON.stringify(moduleUrl)});
      assert.equal(require.cache[jsdom], undefined);
      assert.throws(() => reader.assertBuiltGameMode('/not-read', 'invalid'));
      assert.equal(require.cache[jsdom], undefined);
    `;
    expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', source], { stdio: 'pipe' })).not.toThrow();
  });

  it.each([
    ['absent', html('')],
    ['duplicate', html(marker('evidence') + marker('evidence'))],
    ['conflicting', html(marker('evidence') + marker('distributable'))],
    ['invalid', html(marker('production'))],
    ['no content', html('<meta name="cf-build-mode">')],
    ['comment only', html(`<!-- ${marker('evidence')} -->`)],
    ['script only', html(`<script>const decoy = '${marker('evidence')}';</script>`)],
    ['template only', html(`<template>${marker('evidence')}</template>`)],
    ['body only', html('', `<div>${marker('evidence')}</div>`)],
  ])('rejects %s metadata', (_label, source) => {
    files.set(indexPath, source);
    expect(() => readBuiltGameMode(distDir)).toThrow(/cf-build-mode/);
  });

  it('requires the requested mode and ignores non-document decoys', () => {
    files.set(indexPath, html(`${marker('distributable')}<!-- ${marker('evidence')} -->`));
    expect(readBuiltGameMode(distDir)).toBe('distributable');
    expect(() => assertBuiltGameMode(distDir, 'evidence')).toThrow('Expected evidence game build; found distributable');
    expect(() => assertBuiltGameMode(distDir, 'production' as 'evidence')).toThrow('Invalid expected game build mode');
    expect(writes.size).toBe(0);
  });

  it('does not accept a missing built document', () => {
    expect(() => readBuiltGameMode(distDir)).toThrow('ENOENT');
  });
});

describe('mode identity through the exact-byte PWA lifecycle', () => {
  it('hashes each final index marker without changing the sealed worker template or graph', () => {
    const serviceWorkers: string[] = [];
    const revision = pwaWorkerRevisionV1();
    for (const mode of ['production', 'evidence']) {
      const plugin = configuredPlugin(mode);
      const index = transformedHtml(plugin);
      const outputs: Record<string, string> = {
        'index.html': index,
        'assets/species-art.worker-sealed.js': 'self.onmessage = () => {};',
        'assets/biome-vista.worker-sealed.js': 'self.onmessage = () => {};',
        'assets/main.js': 'console.log("game");',
        'assets/main.js.map': '{}',
      };
      const bundle = Object.fromEntries(Object.entries(outputs).map(([fileName, source]) => [
        fileName, { type: 'asset' as const, fileName, source },
      ]));
      const emitted: { fileName: string; source: string }[] = [];
      plugin.generateBundle.call({ emitFile: (asset) => { emitted.push(asset); } }, {}, bundle);
      expect(emitted).toHaveLength(1);
      expect(emitted[0]?.source).toContain(sha256Hex(index));

      // Simulate a bundler finalizer: writeBundle must bind final, not earlier bytes.
      outputs['index.html'] = `${index}\n<!-- final emitted bytes -->\n`;
      for (const [fileName, source] of Object.entries(outputs)) files.set(`${distDir}/${fileName}`, source);
      plugin.writeBundle.handler({ dir: distDir });
      const finalWorker = writes.get(`${distDir}/service-worker.js`);
      const assets = Object.entries(outputs).filter(([fileName]) => !fileName.endsWith('.map'))
        .map(([fileName, source]) => ({ path: `/${fileName}`, sha256: sha256Hex(source) }));
      expect(finalWorker).toBe(__pwaBuildTestOnly.serviceWorkerSource('/', assets));
      expect(finalWorker).not.toContain(sha256Hex(index));
      expect(finalWorker).toContain(`const WORKER_REVISION=${JSON.stringify(revision)};`);
      expect(pwaWorkerRevisionV1()).toBe(revision);
      expect(assertBuiltGameMode(distDir, gameBuildMode(mode))).toBe(gameBuildMode(mode));
      serviceWorkers.push(finalWorker!);
    }
    expect(serviceWorkers[0]).not.toBe(serviceWorkers[1]);
  });
});
