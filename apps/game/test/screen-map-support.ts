import { vi } from 'vitest';
import type { NavState } from '@cf/scene';
import { REGISTRY, bootSave } from '../src/save/index';
import { NOW, SOL_ROUTE } from './save-support';
import { bootPage, runFrames, settled } from './shell-support';

/* What the tests of the map screen share: the page, its map and card, and a player's hands. */
export type Page = Awaited<ReturnType<typeof bootPage>>;
export const canvas = (): HTMLCanvasElement => document.querySelector<HTMLCanvasElement>('canvas.map')!;
export const card = (): HTMLElement => document.querySelector<HTMLElement>('.stage .card')!;
export const cardTitle = (): string | null => (card().hidden ? null : card().querySelector('[data-sel="title"]')!.textContent);
export const cardRows = (): string[][] => [...card().querySelectorAll<HTMLElement>('.survey-row')].map((row) => [row.dataset.row!, row.lastChild!.textContent!]);
export const fire = (target: EventTarget, type: string, init: Record<string, unknown> = {}): void => {
  target.dispatchEvent(Object.assign(new Event(type, { bubbles: true, cancelable: true }), init));
};
export const tap = (x: number, y: number): void => {
  fire(canvas(), 'pointerdown', { pointerId: 1, clientX: x, clientY: y, pointerType: 'mouse' });
  fire(document, 'pointerup', { pointerId: 1, clientX: x, clientY: y, pointerType: 'mouse' });
};
export const key = (target: EventTarget, name: string): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
};
/** The page with the view come to rest on the map it was booted or moved to. */
export const rest = (page: Page): void => runFrames(page, 80);
/** Gives the map the focus as the Tab key does: it takes the first body. */
export async function keyboardFocus(): Promise<void> {
  canvas().blur();
  await settled();
  canvas().focus();
}
export const storedRoute = async (page: Page) =>
  (await bootSave({ backend: page.backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE })).state.savedView;

/** A page looking at the universe, the home galaxy at the centre of the view. */
export async function atUniverse() {
  const page = await bootPage({ width: 800, height: 600 });
  page.nav.ascend();
  const home = (page.nav.nav as Extract<NavState, { mode: 'galaxy' }>).gal;
  page.nav.ascend();
  rest(page);
  const whoosh = vi.spyOn(page.sound, 'whoosh').mockImplementation(() => undefined);
  const ping = vi.spyOn(page.sound, 'ping').mockImplementation(() => undefined);
  return Object.assign(page, { whoosh, ping, home });
}
