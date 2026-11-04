/* D16 parity — the landing vista's ⛶ view and ⇪ postcard (v1 `_vistaExtras`, `savePostcard`, tap-to-zoom) — INVENTORY rows #9/#10,
 * the ledger's A6 share card.
 *
 * OUTCOME:
 * - the postcard is v1's exact composition (the vista, an 86 px band, the title in Georgia 26 at (24, h+40), the CF1 code in 9 px mono at
 *   (24, h+66), the wordmark right-aligned at (w-24, h+40)), identical for identical inputs (deterministic from the world), capped at
 *   POSTCARD_MAX_WIDTH, named like v1's file;
 * - delivery: the file goes to the share sheet when the device can share files; a dismissed sheet is 'cancelled' (no surprise
 *   download); otherwise a real download anchor; a canvas that yields no PNG is 'failed';
 * - the exact Main block runs type-stripped over JSDOM: the pill row appears only while a vista is on screen, ⛶ Vista enters the view
 *   (body.vista-view), a tap anywhere or Escape steps back without acting on the world, and ⇪ Postcard shares the composed file and
 *   speaks v1's toast. Mutation controls break the wiring. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import * as postcard from '../apps/game/src/vista-postcard.js';
import { readTrackedV1Source } from '../test-support/tracked-v1-source.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const MAIN = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & typeof globalThis & { close(): void } } };
const section = (source: string, start: string, end: string): string => {
  if (source.split(start).length !== 2) throw new Error(`anchor must be unique: ${start}`);
  const left = source.indexOf(start), right = source.indexOf(end, left + start.length);
  if (right <= left) throw new Error(`section missing: ${start}`);
  return source.slice(left, right);
};
const BLOCK = (source = MAIN) => section(source, '/* D16 (v1 _vistaExtras / savePostcard / tap-to-zoom', '\nlet audiovisualPilot: AudiovisualPilot | null = null;');
const settle = async () => { for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0)); };

type Op = readonly [string, ...unknown[]];
function recordingCanvas(width: number, height: number, ops: Op[]): postcard.PostcardCanvasLike {
  const ctx = { fillStyle: '' as unknown, font: '', textAlign: 'left' as CanvasTextAlign,
    fillRect: (...a: number[]) => ops.push(['fillRect', ctx.fillStyle, ...a]),
    drawImage: (_img: unknown, ...a: number[]) => ops.push(['drawImage', ...a]),
    fillText: (t: string, x: number, y: number) => ops.push(['fillText', t, x, y, ctx.font, ctx.fillStyle, ctx.textAlign]) };
  return { width, height, getContext: () => ctx as unknown as postcard.PostcardContextLike, toBlob: (cb) => cb(new Blob(['png'], { type: 'image/png' })) };
}

describe('D16 — vista view and postcard (v1 #9/#10)', () => {
  it('v1 parity sources: the postcard band, fonts, positions, wordmark and file name', () => {
    const v1 = readTrackedV1Source().script;
    expect(v1).toContain('const src=_lastVista.cv, W2=src.width, H2=src.height+86;');
    expect(v1).toContain("g.fillStyle='#ffd96a';g.font='600 26px Georgia,serif';g.textAlign='left';");
    expect(v1).toContain("g.fillText(ttl, 24, src.height+40);");
    expect(v1).toContain("g.fillStyle='#7c86ae';g.font='9px monospace';g.fillText(code, 24, src.height+66);");
    expect(v1).toContain("g.fillText('C E L E S T I A L   F R O N T I E R', W2-24, src.height+40);");
    expect(v1).toContain("const fname=String(ttl).replace(/[^\\w-]+/g,'_')+'-postcard.png';");
    expect(postcard.postcardFileNameV1('Kepler Prime b (II)')).toBe('Kepler_Prime_b_II_-postcard.png');
    expect(postcard.postcardTitleV1(null)).toBe('An uncharted world');
  });

  it('the composition is v1 exactly, deterministic, and caps a desktop-sized vista', () => {
    const vista = { width: 800, height: 450 } as unknown as CanvasImageSource & { width: number; height: number };
    const run = () => { const ops: Op[] = []; let size: [number, number] = [0, 0];
      postcard.composeVistaPostcardV1({ vista, title: 'Mars', shareCode: 'CF1|g:999@90,-60|s:424242@560,170|p:134', createCanvas: (w, h) => { size = [w, h]; return recordingCanvas(w, h, ops); } }); return { ops, size }; };
    const a = run(), b = run();
    expect(a.size).toEqual([800, 450 + 86]);
    expect(a.ops).toEqual(b.ops);
    expect(a.ops).toContainEqual(['drawImage', 0, 0, 800, 450]);
    expect(a.ops).toContainEqual(['fillText', 'Mars', 24, 490, '600 26px Georgia,serif', '#ffd96a', 'left']);
    expect(a.ops).toContainEqual(['fillText', 'CF1|g:999@90,-60|s:424242@560,170|p:134', 24, 516, '9px monospace', '#7c86ae', 'left']);
    expect(a.ops).toContainEqual(['fillText', postcard.POSTCARD_WORDMARK, 776, 490, '600 12px sans-serif', '#aab3d2', 'right']);
    const wide = { width: 3200, height: 1800 } as unknown as CanvasImageSource & { width: number; height: number }; let size: [number, number] = [0, 0];
    postcard.composeVistaPostcardV1({ vista: wide, title: 'x', shareCode: null, createCanvas: (w, h) => { size = [w, h]; return recordingCanvas(w, h, []); } });
    expect(size).toEqual([postcard.POSTCARD_MAX_WIDTH, 900 + 86]);
  });

  it('delivery: the share sheet when files can be shared; a dismissed sheet never downloads; else a real download; no PNG = failed', async () => {
    const { window } = new JSDOM('<!doctype html><html><body></body></html>'), doc = window.document;
    const canvas = recordingCanvas(10, 96, []), urls: string[] = [];
    const env = (nav: NonNullable<postcard.PostcardDeliveryEnvV1['navigator']> | null): postcard.PostcardDeliveryEnvV1 => ({ document: doc, navigator: nav,
      createObjectURL: () => { urls.push('blob:x'); return 'blob:x'; }, revokeObjectURL: () => {}, makeFile: (b, n) => Object.assign(b, { name: n }) as unknown as File });
    const share = vi.fn(async () => {});
    expect(await postcard.deliverVistaPostcardV1(canvas, 'Mars', env({ canShare: () => true, share }))).toBe('shared');
    expect((share.mock.calls[0] as unknown as [ShareData])[0].files![0]!.name).toBe('Mars-postcard.png');
    const abort = vi.fn(async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); });
    expect(await postcard.deliverVistaPostcardV1(canvas, 'Mars', env({ canShare: () => true, share: abort }))).toBe('cancelled');
    expect(urls).toEqual([]);
    const clicks: string[] = []; window.HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) { clicks.push(this.download); };
    expect(await postcard.deliverVistaPostcardV1(canvas, 'Mars', env(null))).toBe('downloaded');
    expect(clicks).toEqual(['Mars-postcard.png']);
    expect(await postcard.deliverVistaPostcardV1({ ...canvas, toBlob: (cb) => cb(null) }, 'Mars', env(null))).toBe('failed');
    window.close();
  });

  function mountMain(opts: { onSurface?: boolean; source?: string } = {}) {
    const d = new JSDOM('<!doctype html><html><body><div id="survey">card</div><canvas id="stage"></canvas></body></html>');
    const win = d.window, doc = win.document, ops: Op[] = [];
    win.HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) { return recordingCanvas(this.width, this.height, ops).getContext('2d'); } as never;
    win.HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) { cb(new win.Blob(['png'], { type: 'image/png' }) as unknown as Blob); };
    const shared: ShareData[] = [];
    const env: Record<string, unknown> = {
      document: doc, nav: { mode: opts.onSurface === false ? 'system' : 'surface' }, trainingActive: () => false,
      surfaceVistaSprite: { visible: true, texture: { source: { resource: { width: 640, height: 360 } } } },
      activeCardWorldAddress: () => ({ key: 'mars' }), worldIdentityName: () => null, worldIdentityState: {}, cardCtx: { p: { name: 'Mars' } },
      cardShareCode: () => 'CF1|mars', toast: vi.fn(), URL: { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} },
      navigator: { canShare: () => true, share: async (data: ShareData) => { shared.push(data); } },
      ...postcard,
    };
    const out = transformSync('main-d16-vista.ts', BLOCK(opts.source));
    if (out.errors.length) throw new Error(JSON.stringify(out.errors));
    const api = new Function('env', `with (env) { ${out.code}; return { syncVistaPills, get viewing() { return vistaViewing; } }; }`)(env) as { syncVistaPills(): void; viewing: boolean };
    api.syncVistaPills();
    const pills = () => doc.querySelector<HTMLElement>('[data-sel="vista-pills"]')!;
    const press = (sel: string) => { const b = doc.querySelector<HTMLElement>(`[data-sel="${sel}"]`); if (!b) throw new Error(`no ${sel}`); b.click(); };
    return { d, doc, env, api, pills, press, shared, ops };
  }

  it('OUTCOME (Main block): the pills show only with a vista on screen; ⛶ enters the view; a tap anywhere and Escape step back without reaching the world', () => {
    { const m = mountMain({ onSurface: false }); expect(m.pills().hidden).toBe(true); m.d.window.close(); }
    const m = mountMain();
    expect(m.pills().hidden).toBe(false);
    m.press('vista-view');
    expect(m.doc.body.classList.contains('vista-view')).toBe(true);
    const worldTap = vi.fn(); m.doc.getElementById('stage')!.addEventListener('click', worldTap);
    m.doc.getElementById('stage')!.click();
    expect(m.doc.body.classList.contains('vista-view')).toBe(false);
    expect(worldTap).not.toHaveBeenCalled(); // the stepping-back tap never acts on the world
    m.press('vista-view');
    m.doc.dispatchEvent(new m.d.window.KeyboardEvent('keydown', { key: 'Escape' }));
    expect(m.doc.body.classList.contains('vista-view')).toBe(false);
    m.d.window.close();
  });

  it('OUTCOME (Main block): ⇪ Postcard shares the composed file named for the world, with v1\'s toast; the vista view survives the press', async () => {
    const m = mountMain();
    m.press('vista-view');
    m.press('vista-postcard'); await settle();
    expect(m.shared).toHaveLength(1);
    expect(m.shared[0]!.files![0]!.name).toBe('Mars-postcard.png');
    expect(m.ops.some((op) => op[0] === 'fillText' && op[1] === 'CF1|mars')).toBe(true);
    expect(m.env.toast).toHaveBeenCalledWith('⇪ Postcard Saved', 'The view and its share code are baked into the image — send it to a friend.');
    expect(m.doc.body.classList.contains('vista-view')).toBe(true);
    m.d.window.close();
  });

  it('MUTATION CONTROLS: an unwired Postcard pill, and a view that ignores the tap-anywhere exit, each fail the outcome', async () => {
    const unwired = MAIN.replace('onPostcard: () => { void saveVistaPostcard(); },', 'onPostcard: () => {},');
    expect(unwired).not.toBe(MAIN);
    { const m = mountMain({ source: unwired }); m.press('vista-postcard'); await settle(); expect(m.shared).toEqual([]); m.d.window.close(); }
    const sticky = MAIN.replace('  event.stopPropagation(); event.preventDefault(); setVistaViewing(false);\n}, true);', '}, true);');
    expect(sticky).not.toBe(MAIN);
    { const m = mountMain({ source: sticky }); m.press('vista-view'); m.doc.getElementById('stage')!.click(); expect(m.doc.body.classList.contains('vista-view')).toBe(true); m.d.window.close(); }
  });
});
