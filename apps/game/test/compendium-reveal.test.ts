// @vitest-environment jsdom
// The reveal of a newly catalogued species, and its queue, as the legacy game has them
// (LEGACY celestial-frontier.html: showReveal 15013-15023, the reveal's taps 15208-15213, the flush 14990-14995, Escape 5806).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CompendiumRevealQueueV1, anotherModalOpen, type RevealArtPortV1, type RevealEntryV1 } from '../src/compendium';

const settle = async (): Promise<void> => { for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0)); };
const entry = (logicalId: string, name: string, hybrid = false): RevealEntryV1 => ({ logicalId, name, kind: 'Fauna', realm: 'Land Fauna', from: 'Earth', gen: hybrid ? 2 : 0, hybrid, genome: { seed: logicalId.length } });
const host = (): HTMLElement | null => document.getElementById('reveal');
const text = (sel: string): string | null => document.querySelector(`[data-sel="${sel}"]`)?.textContent ?? null;
const press = (sel: string): void => { const b = document.querySelector<HTMLElement>(`[data-sel="${sel}"]`); if (!b) throw new Error(`no ${sel}`); b.click(); };
const byId = (id: string): HTMLElement => document.getElementById(id)!;

function artPort(): { art: RevealArtPortV1; portraits: Array<{ owner: string; genome: Record<string, unknown>; cancelled: boolean }> } {
  const portraits: Array<{ owner: string; genome: Record<string, unknown>; cancelled: boolean }> = [];
  const art: RevealArtPortV1 = {
    requestPortrait(owner, genome, listener) {
      const request = { owner, genome, cancelled: false };
      portraits.push(request);
      setTimeout(() => listener({ url: 'data:image/png;base64,AA' }), 0);
      return { current: null, cancel: () => { request.cancelled = true; } };
    },
  };
  return { art, portraits };
}

let queue: CompendiumRevealQueueV1 | null = null;
const make = (options: Partial<ConstructorParameters<typeof CompendiumRevealQueueV1>[0]> = {}): CompendiumRevealQueueV1 => {
  queue = new CompendiumRevealQueueV1({ document, blocked: () => anotherModalOpen(document), ...options });
  return queue;
};

beforeEach(() => {
  document.body.innerHTML = '<button id="opener">open</button><div id="modal" role="dialog" aria-modal="true" hidden></div>';
});
afterEach(() => { queue?.dispose(); queue = null; });

describe('the Compendium reveal queue', () => {
  it('LEGACY 15023, 15212-15213: shows one species at a time; a tap walks the rest in order; the last tap closes and returns focus', async () => {
    const { art, portraits } = artPort();
    const drained = vi.fn();
    const q = make({ art, onDrained: drained });
    byId('opener').focus();
    q.enqueue(entry('s22', 'Ochre Strider'));
    q.enqueue(entry('h333', 'Strider Hybrid', true));
    expect(host()!.hidden).toBe(false);
    expect([host()!.getAttribute('role'), host()!.getAttribute('aria-modal'), host()!.getAttribute('aria-labelledby')]).toEqual(['dialog', 'true', 'rev-name']);
    expect(text('reveal-name')).toBe('Ochre Strider');
    expect(byId('rev-name').textContent).toBe('Ochre Strider');
    expect(text('reveal-title')).toBe('Compendium specimen');
    // LEGACY 15049: the realm (or kind) and where it was found; a hybrid reads its generation
    expect(host()!.querySelector('.reveal-kind')!.textContent).toBe('Land Fauna · Earth');
    // LEGACY 15023: one line, and no Skip all button
    expect(text('reveal-continue')).toBe('tap to continue · 1 more — hold to skip all');
    expect(document.querySelector('[data-sel="reveal-skip"]')).toBeNull();
    expect(host()!.querySelectorAll('button').length).toBe(1);
    expect(q.state()).toEqual({ showing: 's22', queued: ['h333'] });
    const portrait = (): HTMLImageElement => document.querySelector<HTMLImageElement>('[data-sel="reveal-portrait"]')!;
    expect(portrait().dataset.artState).toBe('placeholder');
    await settle();
    expect(portrait().dataset.artState).toBe('ready');
    expect(portrait().getAttribute('src')).toBe('data:image/png;base64,AA');
    expect(portraits[0]).toMatchObject({ owner: 'compendium-reveal', genome: { seed: 3 }, cancelled: false });

    press('reveal-name'); // LEGACY 15212: a tap anywhere but the line shows the next
    expect(text('reveal-name')).toBe('Strider Hybrid');
    expect(text('reveal-title')).toBe('Hybrid specimen');
    expect(host()!.querySelector('.reveal-kind')!.textContent).toBe('Hybrid · generation 2');
    expect(text('reveal-continue')).toBe('tap to continue');
    expect(portraits[0]!.cancelled).toBe(true); // the first species' portrait request left with it
    expect(document.activeElement).toBe(host());
    expect(drained).not.toHaveBeenCalled();

    press('reveal-continue'); // LEGACY 15213: with none waiting the line continues like any tap
    expect(host()!.hidden).toBe(true);
    expect(portraits[1]!.cancelled).toBe(true);
    expect(document.activeElement).toBe(byId('opener'));
    expect(q.state()).toEqual({ showing: null, queued: [] });
    expect(drained).toHaveBeenCalledOnce();
  });

  it('a species that arrives while one is showing queues behind it, and the card counts it', () => {
    const q = make();
    q.enqueue(entry('one', 'One'));
    expect(text('reveal-continue')).toBe('tap to continue');
    q.enqueue(entry('two', 'Two'));
    expect(q.state()).toEqual({ showing: 'one', queued: ['two'] });
    expect(text('reveal-name')).toBe('One');
    expect(text('reveal-continue')).toBe('tap to continue · 1 more — hold to skip all');
  });

  it('LEGACY 15208-15210: with more waiting, the line itself skips all: the queue empties and the reveal closes', () => {
    const q = make();
    for (const e of [entry('a', 'A'), entry('bb', 'B'), entry('ccc', 'C')]) q.enqueue(e);
    expect(text('reveal-continue')).toBe('tap to continue · 2 more — hold to skip all');
    press('reveal-continue');
    expect(host()!.hidden).toBe(true);
    expect(q.state()).toEqual({ showing: null, queued: [] });
  });

  it('LEGACY 15212, 14995: a species shown from the queue is titled Hybrid specimen whatever it is', () => {
    const q = make();
    q.enqueue(entry('a', 'A')); q.enqueue(entry('bb', 'Plain'));
    expect(text('reveal-title')).toBe('Compendium specimen');
    press('reveal-name');
    expect(text('reveal-name')).toBe('Plain');
    expect(text('reveal-title')).toBe('Hybrid specimen');
    expect(q.state()).toEqual({ showing: 'bb', queued: [] });
  });

  it('Enter or Space on the card continues, for a player with no pointer', () => {
    const q = make();
    q.enqueue(entry('a', 'A')); q.enqueue(entry('bb', 'B'));
    host()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(q.state()).toEqual({ showing: 'bb', queued: [] });
    host()!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(q.state()).toEqual({ showing: null, queued: [] });
  });

  it('LEGACY 5806: Escape skips all', () => {
    const q = make();
    q.enqueue(entry('a', 'A')); q.enqueue(entry('bb', 'B'));
    host()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(host()!.hidden).toBe(true);
    expect(q.state()).toEqual({ showing: null, queued: [] });
  });

  it('behind another open modal the reveal waits; the next input after that modal closes shows it', async () => {
    const q = make();
    byId('modal').hidden = false;
    q.enqueue(entry('a', 'Waiting One'));
    expect(host()).toBeNull();
    expect(q.state()).toEqual({ showing: null, queued: ['a'] });
    document.body.click(); await settle();
    expect(q.state().queued).toEqual(['a']); // still blocked: nothing pops over the modal
    expect(host()).toBeNull();
    byId('modal').hidden = true;
    document.body.click(); await settle();
    expect(text('reveal-name')).toBe('Waiting One');
    expect(q.state()).toEqual({ showing: 'a', queued: [] });
  });

  it('another modal is an open dialog or a shown modal dialog role, and never the reveal itself', () => {
    // SOURCE apps/game/src/main.ts:4720
    expect(anotherModalOpen(document)).toBe(false);
    byId('modal').hidden = false;
    expect(anotherModalOpen(document)).toBe(true);
    byId('modal').hidden = true;
    const dialog = document.createElement('dialog');
    document.body.append(dialog);
    expect(anotherModalOpen(document)).toBe(false);
    dialog.setAttribute('open', '');
    expect(anotherModalOpen(document)).toBe(true);
    dialog.remove();
    make({ blocked: () => false }).enqueue(entry('a', 'A'));
    expect(host()!.hidden).toBe(false);
    expect(anotherModalOpen(document)).toBe(false);
  });

  it('a name is shown as written, never read as markup', () => {
    make().enqueue({ logicalId: 'x', name: '<img id="planted"> & "Q"', kind: 'Fauna', realm: '<b>Fauna</b>', from: '<i>X</i>', gen: 0, hybrid: false, genome: null });
    expect(text('reveal-name')).toBe('<img id="planted"> & "Q"');
    expect(host()!.querySelector('.reveal-kind')!.textContent).toBe('<b>Fauna</b> · <i>X</i>');
    expect(document.getElementById('planted')).toBeNull();
  });

  it('a species without a genome, or a queue without an art port, asks for no portrait; an art port that throws marks the picture', () => {
    const { art, portraits } = artPort();
    make({ art }).enqueue({ logicalId: 'x', name: 'X', kind: 'Flora', realm: '', from: 'Earth', gen: 0, hybrid: false, genome: null });
    expect(portraits).toEqual([]);
    queue!.dispose();
    make().enqueue(entry('y', 'Y'));
    expect(document.querySelector<HTMLImageElement>('[data-sel="reveal-portrait"]')!.dataset.artState).toBe('placeholder');
    queue!.dispose();
    make({ art: { requestPortrait: () => { throw new Error('no art'); } } }).enqueue(entry('z', 'Z'));
    expect(document.querySelector<HTMLImageElement>('[data-sel="reveal-portrait"]')!.dataset.artState).toBe('error');
    expect(text('reveal-name')).toBe('Z');
  });

  it('a portrait already in hand is shown at once', () => {
    const art: RevealArtPortV1 = { requestPortrait: () => ({ current: { url: 'data:image/png;base64,BB' }, cancel() {} }) };
    make({ art }).enqueue(entry('a', 'A'));
    const img = document.querySelector<HTMLImageElement>('[data-sel="reveal-portrait"]')!;
    expect([img.getAttribute('src'), img.dataset.artState]).toEqual(['data:image/png;base64,BB', 'ready']);
  });

  it('an idle queue owns no input listeners, and a disposed queue cannot be revived', async () => {
    const add = vi.spyOn(document, 'addEventListener'), remove = vi.spyOn(document, 'removeEventListener');
    let blocked = true;
    const q = make({ blocked: () => blocked });
    const pulses = (spy: typeof add | typeof remove): number => spy.mock.calls.filter((c) => c[0] === 'click' || c[0] === 'keydown').length;
    expect(pulses(add)).toBe(0);
    q.enqueue(entry('queued', 'Queued'));
    expect(pulses(add)).toBe(2);
    document.body.click(); blocked = false; await settle();
    expect(q.state().showing).toBe('queued');
    expect(pulses(remove)).toBe(2);
    press('reveal-continue');
    expect(q.state().showing).toBeNull();
    blocked = true; q.enqueue(entry('queued', 'Queued')); document.body.click(); q.dispose(); blocked = false; await settle();
    q.enqueue(entry('queued', 'Queued'));
    expect(q.state()).toEqual({ showing: null, queued: [] });
    expect(host()).toBeNull();
    add.mockRestore(); remove.mockRestore();
  });
});
