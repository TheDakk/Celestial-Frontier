/* The build step of the offline shell: it lists the files a build wrote, hashes the bytes that were written,
   and writes the service worker with that table above its program. It also makes the install manifest and the
   home-screen icons. Only the game's own build has it: the development server and the layout check's page
   have no worker. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { rolldown } from 'rolldown';
import type { Plugin, ResolvedConfig } from 'vite';
import { ICON_GROUND, appIconPng } from './icon';
import { PACKS_FOLDER, buildIdentityText, type BuildTable, type ShellFile } from './worker-source';

export const SERVICE_WORKER = 'service-worker.js';
export const WEB_MANIFEST = 'manifest.webmanifest';
/** The icons a build makes: file, size, the step of one art pixel, and what the icon is for. */
export const ICONS = [
  { file: 'icons/app-192.png', size: 192, step: 12, purpose: 'any' },
  { file: 'icons/app-512.png', size: 512, step: 32, purpose: 'any' },
  { file: 'icons/app-maskable-512.png', size: 512, step: 20, purpose: 'maskable' },
  { file: 'icons/app-touch-180.png', size: 180, step: 11, purpose: 'touch' },
] as const;
/** The line of `index.html` the build replaces with its icon and manifest links. */
const ICON_PLACEHOLDER = '<link rel="icon" href="data:,">';

export const sha256Hex = (bytes: Uint8Array | string): string => createHash('sha256').update(bytes).digest('hex');

export function normalizeBase(base: string): string {
  if (!base.startsWith('/') || base.startsWith('//') || !base.endsWith('/') || /[?#\\]/.test(base)) {
    throw new Error(`the offline shell needs an absolute same-origin base; received ${JSON.stringify(base)}`);
  }
  return base.replace(/\/+/g, '/');
}

/** The files of a build that are the shell: everything written except source maps, the worker itself, art
 *  packs (their loader keeps them, by hash, in its own cache) and any page that is not the game's. */
export function shellFiles(written: readonly string[]): string[] {
  const files = written.filter((name) => name !== SERVICE_WORKER && !name.endsWith('.map') && !name.startsWith(PACKS_FOLDER)
    && (!name.endsWith('.html') || name === 'index.html')).sort();
  if (!files.includes('index.html')) throw new Error('the offline shell has no index.html');
  return files;
}

/** The table a worker is built with: every file's address and SHA-256, and the identity they make. */
export function buildTable(base: string, files: ReadonlyArray<{ name: string; bytes: Uint8Array }>, workerRevision: string): BuildTable {
  const basePath = normalizeBase(base);
  if (!/^[a-f0-9]{64}$/.test(workerRevision)) throw new Error('the offline shell received an invalid worker revision');
  const seen = new Set<string>();
  const rows: ShellFile[] = files.map(({ name, bytes }) => {
    if (name === '' || name.startsWith('/') || name.split('/').includes('..') || /[\\\t\n]/.test(name)) throw new Error(`the offline shell received an unsafe file name ${JSON.stringify(name)}`);
    if (seen.has(name)) throw new Error(`the offline shell received ${name} twice`);
    seen.add(name);
    return { path: basePath + name, sha256: sha256Hex(bytes) };
  }).sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  if (!seen.has('index.html')) throw new Error('the offline shell has no index.html');
  return { buildId: sha256Hex(buildIdentityText(rows, workerRevision)), workerRevision, basePath, files: rows };
}

/** The worker file: this build's table, then the worker's program. */
export function workerFile(table: BuildTable, program: string): string {
  return `/* ${table.buildId} */\nconst CF_SHELL_BUILD=${JSON.stringify(table)};\n${program}`;
}

export function webManifest(base: string): string {
  return `${JSON.stringify({
    id: base,
    name: 'Celestial Frontier',
    short_name: 'Celestial Frontier',
    description: 'Explore, discover, craft, and care for companions across a deterministic universe.',
    lang: 'en',
    dir: 'ltr',
    start_url: base,
    scope: base,
    display: 'standalone',
    orientation: 'any',
    background_color: ICON_GROUND,
    theme_color: ICON_GROUND,
    categories: ['games', 'entertainment'],
    icons: ICONS.filter((icon) => icon.purpose !== 'touch').map((icon) => ({ src: base + icon.file, sizes: `${icon.size}x${icon.size}`, type: 'image/png', purpose: icon.purpose })),
  }, null, 2)}\n`;
}

/** The links a built page carries in place of its empty icon. */
export function headLinks(html: string, base: string): string {
  if (!html.includes(ICON_PLACEHOLDER)) throw new Error('index.html has no icon line for the offline shell to replace');
  return html.replace(ICON_PLACEHOLDER, [
    `<link rel="manifest" href="${base}${WEB_MANIFEST}">`,
    `<link rel="icon" type="image/png" href="${base}${ICONS[0].file}">`,
    `<link rel="apple-touch-icon" href="${base}${ICONS[3].file}">`,
  ].join('\n'));
}

/** The worker's program as one classic script. */
async function workerProgram(root: string): Promise<string> {
  const bundle = await rolldown({ input: join(root, 'offline', 'worker.ts'), logLevel: 'silent' });
  try {
    const { output } = await bundle.generate({ format: 'iife' });
    if (output.length !== 1) throw new Error('the offline worker did not build into one file');
    return output[0].code;
  } finally {
    await bundle.close();
  }
}

export function offlineShell(): Plugin {
  let config: ResolvedConfig;
  let base = '/';
  return {
    name: 'cf-offline-shell',
    apply: 'build',
    enforce: 'post',
    configResolved(resolved) {
      config = resolved;
      base = normalizeBase(resolved.base);
    },
    buildStart() {
      this.emitFile({ type: 'asset', fileName: WEB_MANIFEST, source: webManifest(base) });
      for (const icon of ICONS) this.emitFile({ type: 'asset', fileName: icon.file, source: appIconPng(icon.size, icon.step) });
    },
    transformIndexHtml: { order: 'post', handler: (html) => headLinks(html, base) },
    writeBundle: {
      order: 'post',
      // The bytes hashed are the bytes written: a finishing step after `generateBundle` cannot make the table wrong.
      async handler(options, bundle) {
        const outDir = resolve(config.root, options.dir ?? config.build.outDir);
        const program = await workerProgram(config.root);
        const files = shellFiles(Object.keys(bundle)).map((name) => ({ name, bytes: readFileSync(join(outDir, name)) }));
        writeFileSync(join(outDir, SERVICE_WORKER), workerFile(buildTable(base, files, sha256Hex(program)), program), 'utf8');
      },
    },
  };
}
