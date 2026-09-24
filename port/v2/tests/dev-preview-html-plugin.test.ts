/* The development preview's HTML stamp runs INSIDE the build (2026-09-24): written after the build, it broke every preview package's
 * service worker (the pinned HTML hashes no longer matched, so the worker never installed and the painted arena could not be
 * cached). The plugin is inert unless tools/devpreview.mjs sets the env var, and it produces exactly transformHtml's output. */
import { describe, expect, it } from 'vitest';
import { devPreviewHtmlPlugin } from '../apps/game/dev-preview-html-plugin.js';
import { DEV_PREVIEW_HTML_ENV, transformHtml } from '../tools/devpreview-html.mjs';

const HTML = '<!doctype html><html><head><title>x</title></head><body><script type="module" crossorigin src="/assets/main-abc.js"></script><link rel="manifest" href="/manifest.webmanifest"></body></html>';
const STAMP = { expectedOrigin: 'https://dev-celestialfrontier.github.io', commit: 'a'.repeat(40), shortCommit: 'a'.repeat(12), clean: true, publishable: false, developmentVersion: '2.0.0-dev', buildId: 'develop-aaaaaaaaaaaa' };

describe('dev preview HTML stamp inside the build', () => {
  it('is inert without the env var (every ordinary build is untouched)', () => {
    expect(devPreviewHtmlPlugin({})).toBeNull();
  });
  it('with the env var it stamps each HTML entry exactly as transformHtml does, last (post), build only', () => {
    const plugin = devPreviewHtmlPlugin({ [DEV_PREVIEW_HTML_ENV]: JSON.stringify(STAMP) })!;
    expect(plugin.apply).toBe('build'); expect(plugin.enforce).toBe('post');
    const hook = plugin.transformIndexHtml as { order: string; handler: (html: string, ctx: { filename: string }) => string };
    expect(hook.order).toBe('post');
    const out = hook.handler(HTML, { filename: '/x/apps/game/audit.html' });
    expect(out).toBe(transformHtml(HTML, { ...STAMP, entryName: 'audit.html' }));
    expect(out).toContain('data-cf-dev-loader'); expect(out).not.toMatch(/<script type="module"[^>]*\ssrc=/);
    // control: stamping twice is refused (the old post-build rewrite would now fail loudly instead of silently re-hashing)
    expect(() => hook.handler(out, { filename: '/x/index.html' })).toThrow(/expected exactly one built module entry/);
  });
});
