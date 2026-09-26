/* D16 parity — the Compendium specimen REVEAL and its queue (v1 `showReveal`, `pendingReveals`, `_revealBlocked`, `_revealFlush`,
 * `rev-x`) — INVENTORY row #39.
 *
 * OUTCOME through real presses in JSDOM:
 * - the exact Main hook (`compendiumRevealBlocked`, the one `compendiumReveal` owner, `compendiumRevealPages`) runs type-stripped over a
 *   real save: only the pages a commit ADDED are revealed, in source order; a measurement fixture reveals nothing;
 * - the queue: Continue walks the pages ("Continue · N more"), "Skip all (N)" and Escape clear the rest, a reveal never pops over an
 *   open modal (it queues and the next input pulse after the modal closes flushes it), the portrait request is cancelled when its
 *   specimen leaves, and focus returns;
 * - both runners (capture, breed) snapshot before the commit and reveal after it (source-checked; their outcome tests run them).
 * Mutation controls break the wiring, never the assertion. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { CompendiumRevealQueueV1, type RevealEntryV1 } from '../apps/game/src/compendium-reveal.js';
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
const HOOK = (source = MAIN) => section(source, '/* D16 (v1 showReveal / pendingReveals / _revealBlocked)', "\nregisterPanel({ id: 'codex'");
const settle = async () => { for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0)); };
const page = (id: string, name: string, hybrid = false): [string, { name: string; kind: string; hybrid: boolean; g: Record<string, unknown> }] => [id, { name, kind: 'Fauna', hybrid, g: { seed: id.length } }];

function dom() {
  const d = new JSDOM('<!doctype html><html><body><button id="opener">open</button><div id="modal" role="dialog" aria-modal="true" hidden></div></body></html>');
  return { d, doc: d.window.document };
}
function runHook(save: { codex: [string, unknown][] }, opts: { fixture?: boolean; source?: string } = {}) {
  const { d, doc } = dom();
  const portraits: { cancelled: boolean }[] = [];
  const art = { requestPortrait: (_o: string, _g: Record<string, unknown>, listener: (a: { url: string } | null) => void) => { const r = { cancelled: false }; portraits.push(r); setTimeout(() => listener({ url: 'data:image/png;base64,AA' }), 0); return { current: null, cancel: () => { r.cancelled = true; } }; } };
  const env: Record<string, unknown> = { document: doc, save, compendiumFixtureRows: opts.fixture ? [] : null, trainingActive: () => false,
    CompendiumRevealQueueV1, speciesArtLoader: art, openPanelId: () => null, codexMode: 'closed', fillCodex: vi.fn(), codexFilter: '' };
  const out = transformSync('main-d16-reveal.ts', HOOK(opts.source));
  if (out.errors.length) throw new Error(JSON.stringify(out.errors));
  const api = new Function('env', `with (env) { ${out.code}; return { compendiumReveal, compendiumRevealPages }; }`)(env) as {
    compendiumReveal: CompendiumRevealQueueV1; compendiumRevealPages: { snapshot(): ReadonlySet<string>; revealSince(b: ReadonlySet<string>): void } };
  const host = () => doc.getElementById('reveal');
  const text = (sel: string) => doc.querySelector(`[data-sel="${sel}"]`)?.textContent ?? null;
  const press = (sel: string) => { const b = doc.querySelector<HTMLElement>(`[data-sel="${sel}"]`); if (!b) throw new Error(`no ${sel}`); b.click(); };
  return { d, doc, api, host, text, press, portraits };
}

describe('D16 — the Compendium reveal queue (v1 #39)', () => {
  it('v1 parity sources: the reveal queues behind a modal, "tap to continue · N more", and rev-x skips all', () => {
    const v1 = readTrackedV1Source().script;
    expect(v1).toContain('if(_revealBlocked()){ pendingReveals.push(entry); return; }');
    expect(v1).toContain("'tap to continue · '+pendingReveals.length+' more — hold to skip all'");
    expect(v1).toContain('pendingReveals.length=0;          /* skip all queued reveals */');
  });

  it('OUTCOME (Main hook, real save): only the pages a commit ADDED are revealed, in order; Continue walks them; the last Continue closes and returns focus', async () => {
    const save = { codex: [page('s1', 'Old Friend')] };
    const m = runHook(save);
    m.doc.getElementById('opener')!.focus();
    const before = m.api.compendiumRevealPages.snapshot();
    save.codex.push(page('s22', 'Ochre Strider'), page('h333', 'Strider Hybrid', true));
    m.api.compendiumRevealPages.revealSince(before);
    expect(m.host()!.hidden).toBe(false);
    expect(m.text('reveal-name')).toBe('Ochre Strider');
    expect(m.text('reveal-title')).toBe('Compendium specimen');
    expect(m.text('reveal-continue')).toBe('Continue · 1 more');
    expect(m.text('reveal-skip')).toBe('Skip all (1)');
    await settle();
    expect(m.doc.querySelector<HTMLImageElement>('[data-sel="reveal-portrait"]')!.dataset.artState).toBe('ready');
    m.press('reveal-continue');
    expect(m.text('reveal-name')).toBe('Strider Hybrid');
    expect(m.text('reveal-title')).toBe('Hybrid specimen');
    expect(m.text('reveal-continue')).toBe('Continue');
    expect(m.portraits[0]!.cancelled).toBe(true); // the first specimen's portrait request left with it
    m.press('reveal-continue');
    expect(m.host()!.hidden).toBe(true);
    expect(m.portraits[1]!.cancelled).toBe(true);
    expect(m.doc.activeElement?.id).toBe('opener');
    expect(m.api.compendiumReveal.state()).toEqual({ showing: null, queued: [] });
    m.d.window.close();
  });

  it('Skip all and Escape clear the queue; a measurement fixture reveals nothing', () => {
    const save = { codex: [] as [string, unknown][] };
    { const m = runHook(save); const b = m.api.compendiumRevealPages.snapshot(); save.codex.push(page('a', 'A'), page('bb', 'B'), page('ccc', 'C'));
      m.api.compendiumRevealPages.revealSince(b); expect(m.text('reveal-skip')).toBe('Skip all (2)'); m.press('reveal-skip');
      expect(m.host()!.hidden).toBe(true); expect(m.api.compendiumReveal.state().queued).toEqual([]); m.d.window.close(); }
    save.codex.length = 0;
    { const m = runHook(save); const b = m.api.compendiumRevealPages.snapshot(); save.codex.push(page('a', 'A'), page('bb', 'B'));
      m.api.compendiumRevealPages.revealSince(b);
      m.host()!.dispatchEvent(new m.d.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(m.host()!.hidden).toBe(true); expect(m.api.compendiumReveal.state()).toEqual({ showing: null, queued: [] }); m.d.window.close(); }
    save.codex.length = 0;
    { const m = runHook(save, { fixture: true }); const b = m.api.compendiumRevealPages.snapshot(); save.codex.push(page('a', 'A'));
      m.api.compendiumRevealPages.revealSince(b); expect(m.host()).toBeNull(); m.d.window.close(); }
  });

  it('ONE VOICE: behind an open modal the reveal queues; the next input pulse after the modal closes shows it', async () => {
    const save = { codex: [] as [string, unknown][] };
    const m = runHook(save), modal = m.doc.getElementById('modal')!;
    modal.hidden = false;
    const b = m.api.compendiumRevealPages.snapshot(); save.codex.push(page('a', 'Waiting One'));
    m.api.compendiumRevealPages.revealSince(b);
    expect(m.host()).toBeNull();
    expect(m.api.compendiumReveal.state().queued).toEqual(['a']);
    m.doc.body.click(); await settle();
    expect(m.api.compendiumReveal.state().queued).toEqual(['a']); // still blocked: nothing pops over the modal
    modal.hidden = true;
    m.doc.body.click(); await settle();
    expect(m.text('reveal-name')).toBe('Waiting One');
    m.d.window.close();
  });

  it('both runners snapshot before their commit and reveal after it; the reveal never runs for a converging (reloading) outcome', () => {
    const capture = section(MAIN, 'async function runCaptureCardAction(', '\n}\n');
    expect(capture).toContain('const revealBefore = compendiumRevealPages.snapshot();');
    expect(capture).toContain("if (copy.convergence === 'none') compendiumRevealPages.revealSince(revealBefore);");
    const breed = section(MAIN, 'async function runCompendiumBreedAction(', '\n}\n');
    expect(breed).toContain('const revealBefore = compendiumRevealPages.snapshot();');
    expect(breed).toContain("if (outcome.kind === 'committed' && copy.convergence === 'none') compendiumRevealPages.revealSince(revealBefore);");
  });

  it('MUTATION CONTROLS: a hook that reveals every page, and a blocked check that ignores open modals, each fail the outcome', async () => {
    const revealsAll = MAIN.replace('if (!before.has(String(id))) compendiumReveal.enqueue(', 'compendiumReveal.enqueue(');
    expect(revealsAll).not.toBe(MAIN);
    { const save = { codex: [page('s1', 'Old Friend')] }, m = runHook(save, { source: revealsAll }); const b = m.api.compendiumRevealPages.snapshot(); save.codex.push(page('s22', 'New One'));
      m.api.compendiumRevealPages.revealSince(b); expect(m.text('reveal-name')).toBe('Old Friend'); m.d.window.close(); }
    const popsOver = MAIN.replace(`return trainingActive() || document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]:not([hidden]):not(#reveal)') !== null;`, 'return trainingActive();');
    expect(popsOver).not.toBe(MAIN);
    { const save = { codex: [] as [string, unknown][] }, m = runHook(save, { source: popsOver }); m.doc.getElementById('modal')!.hidden = false; const b = m.api.compendiumRevealPages.snapshot(); save.codex.push(page('a', 'A'));
      m.api.compendiumRevealPages.revealSince(b); expect(m.host()?.hidden).toBe(false); m.d.window.close(); }
  });

  it('the controller alone: an entry that arrives while one is showing queues behind it (never replaces it)', () => {
    const { d, doc } = dom();
    const q = new CompendiumRevealQueueV1({ document: doc, blocked: () => false });
    const e = (id: string): RevealEntryV1 => ({ logicalId: id, name: id, kind: 'Fauna', hybrid: false, genome: null });
    q.enqueue(e('one')); q.enqueue(e('two'));
    expect(q.state()).toEqual({ showing: 'one', queued: ['two'] });
    q.dispose(); d.window.close();
  });
});
