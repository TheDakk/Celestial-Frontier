/* Faults planted on a screen so the layout check can be seen to catch each one. Never part of the game. */
import { mountScrollCue } from '../ui';

export const FAULTS = ['clipped', 'overlap', 'small', 'see-through', 'wide-caption', 'no-scroll-cue', 'covered-row'] as const;
export type Fault = typeof FAULTS[number];
/** The kind of problem each planted fault must be reported as. */
export const FAULT_KINDS = Object.freeze({ clipped: 'clipped-text', overlap: 'overlap', small: 'small-target', 'see-through': 'see-through', 'wide-caption': 'wide-caption', 'no-scroll-cue': 'scroll-cue', 'covered-row': 'overlap' } as const);

/** Plants one fault in the app drawn in `host`: a label cut off by its box, two buttons sharing 10 pixels, a 30 pixel
 *  button, a sheet the map shows through, words of the map wider than the view, a list that scrolls and does not
 *  show it, or one whose floating control comes to lie over a row only once it is scrolled. */
export function plantFault(fault: Fault, host: HTMLElement): void {
  const doc = host.ownerDocument;
  const make = <K extends keyof HTMLElementTagNameMap>(tag: K, text: string, style: Partial<CSSStyleDeclaration>): HTMLElementTagNameMap[K] => {
    const el = doc.createElement(tag);
    el.textContent = text;
    el.dataset.fault = fault;
    Object.assign(el.style, style);
    return el;
  };
  if (fault === 'wide-caption') {
    const view = doc.defaultView!;
    host.querySelector('.map-captions')!.append(Object.assign(make('canvas', '', { left: '-30px', top: '240px', width: `${view.innerWidth + 60}px`, height: '16px' }),
      { width: 8, height: 2 }));
    host.querySelector<HTMLElement>('.map-captions canvas[data-fault]')!.dataset.caption = 'a planted caption wider than the view';
    return;
  }
  // A sheet in the middle of the view: solid, but for the fault that makes it see-through.
  const sheet = make('div', '', { position: 'absolute', zIndex: '9', left: '24px', top: '160px', width: '260px', padding: '8px', background: fault === 'see-through' ? 'rgba(10,16,30,.84)' : '#0a101e' });
  if (fault === 'clipped') sheet.append(make('div', 'A label too long for the box it was given', { width: '70px', whiteSpace: 'nowrap', overflow: 'hidden' }));
  if (fault === 'overlap') sheet.append(make('button', 'First', {}), make('button', 'Second', { marginLeft: '-10px' }));
  if (fault === 'small') sheet.append(make('button', 'x', { minWidth: '0', minHeight: '0', width: '30px', height: '30px', padding: '0' }));
  if (fault === 'see-through') sheet.append(make('div', 'A sheet the map shows through', {}));
  if (fault === 'no-scroll-cue') {
    const list = make('div', '', { height: '60px', overflowY: 'auto' });
    list.append(make('div', 'A list longer than its window', { height: '200px' }));
    sheet.append(list);
  }
  if (fault === 'covered-row') {
    const list = make('div', '', { height: '60px', overflowY: 'auto' });
    list.append(make('div', 'A list longer than its window', { height: '200px' }));
    list.prepend(make('button', 'x', { position: 'sticky', top: '0', float: 'right' }));
    list.append(make('button', 'A row at the foot', { float: 'right' }));
    sheet.append(list);
    host.append(sheet);
    mountScrollCue(list);
    return;
  }
  host.append(sheet);
}
