import { basename } from 'node:path';
import type { Plugin } from 'vite';
import { DEV_PREVIEW_HTML_ENV, transformHtml, type DevPreviewHtmlOptions } from '../../tools/devpreview-html.mjs';

/** The development preview's HTML stamp, applied INSIDE the build (last, after every other HTML transform) so the PWA plugin pins
 * the stamped bytes. Active only when tools/devpreview.mjs sets CF_DEV_PREVIEW_HTML; every other build is untouched. Before
 * 2026-09-24 the stamp was written after the build, so every preview package shipped a service worker whose pinned HTML hashes
 * no longer matched and which therefore never installed. */
export function devPreviewHtmlPlugin(env: Readonly<Record<string, string | undefined>> = process.env): Plugin | null {
  const raw = env[DEV_PREVIEW_HTML_ENV];
  if (!raw) return null;
  const options = JSON.parse(raw) as Omit<DevPreviewHtmlOptions, 'entryName'>;
  return {
    name: 'cf-dev-preview-html',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: { order: 'post', handler: (html, ctx) => transformHtml(html, { ...options, entryName: basename(ctx.filename) }) },
  };
}
