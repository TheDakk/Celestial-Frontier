/* Measures a laid-out screen for the layout check: every control, every piece of text and every word of the map
   becomes a box. It reads what the browser laid out and decides nothing. */
import type { Box, ScrollArea } from './check';

const CONTROLS = 'button, input, select, textarea, a[href], [role="button"]';
const ALLOWED = ['scroll', 'overlap', 'small'] as const;

/** The opacity of a computed colour: `rgb(1, 2, 3)` is solid; `rgba(1, 2, 3, 0.5)` and `rgb(1 2 3 / 50%)` are not. */
export function alphaOf(colour: string): number {
  const inner = /\(([^)]*)\)/.exec(colour)?.[1];
  if (inner === undefined) return colour === 'transparent' || colour === '' ? 0 : 1;
  const alpha = (inner.includes('/') ? inner.split('/')[1] : inner.split(',')[3])?.trim();
  if (alpha === undefined) return 1;
  return alpha.endsWith('%') ? Number.parseFloat(alpha) / 100 : Number.parseFloat(alpha);
}

const scrolls = (style: CSSStyleDeclaration): boolean => /auto|scroll/.test(`${style.overflowX} ${style.overflowY}`);
const clips = (style: CSSStyleDeclaration): boolean => /hidden|clip/.test(`${style.overflowX} ${style.overflowY}`);
const hasOwnText = (el: Element): boolean => [...el.childNodes].some((node) => node.nodeType === 3 && (node.nodeValue ?? '').trim() !== '');

/** The foot of the bar held at the head of a scroll area, where one covers `el`: a child of the area that stays as it
 *  scrolls, is solid and is as wide as it. What scrolls under such a bar is out of sight; a control that merely floats
 *  over the rows covers nothing. Null when `el` is in the bar or the area has none. */
function headBarFoot(area: Element, el: Element, view: Window): number | null {
  for (const bar of area.children) {
    const style = view.getComputedStyle(bar);
    if (style.position !== 'sticky' || style.top === 'auto' || alphaOf(style.backgroundColor) !== 1 || Number.parseFloat(style.opacity) < 1) continue;
    const rect = bar.getBoundingClientRect();
    if (rect.width < area.clientWidth - 1) continue;
    return bar.contains(el) ? null : rect.bottom;
  }
  return null;
}

/** A name a person can find the element by: its tag, what marks it, and the start of its text. */
function nameOf(el: Element): string {
  const marks = ['data-caption', 'data-screen', 'data-set', 'data-value', 'data-act', 'data-row', 'data-notice', 'data-fault', 'aria-label']
    .flatMap((name) => (el.hasAttribute(name) ? [`[${name}="${el.getAttribute(name)}"]`] : []));
  const cls = typeof el.className === 'string' && el.className !== '' ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
  const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ');
  return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls}${marks.slice(0, 2).join('')}${text === '' ? '' : ` "${text.length > 28 ? `${text.slice(0, 28)}…` : text}"`}`;
}

/** The box of an element's own letters: its text as the browser set it (a heading drawn on a canvas: that canvas),
 *  kept inside the element where the element cuts its content off. */
function lettersOf(el: Element, own: DOMRect, cut: boolean): { left: number; top: number; right: number; bottom: number; width: number; height: number } {
  const range = el.ownerDocument.createRange();
  const rects = [...el.childNodes].flatMap((node) => {
    if (node.nodeType === 1 && (node as Element).tagName === 'CANVAS') return [(node as Element).getBoundingClientRect()];
    if (node.nodeType !== 3 || (node.nodeValue ?? '').trim() === '') return [];
    range.selectNodeContents(node);
    return [...range.getClientRects()];
  });
  if (rects.length === 0) return own;
  const bound = (pick: (rect: DOMRect) => number, most: (...values: number[]) => number): number => most(...rects.map(pick));
  let [left, top, right, bottom] = [bound((r) => r.left, Math.min), bound((r) => r.top, Math.min), bound((r) => r.right, Math.max), bound((r) => r.bottom, Math.max)];
  if (cut) [left, top, right, bottom] = [Math.max(left, own.left), Math.max(top, own.top), Math.min(right, own.right), Math.min(bottom, own.bottom)];
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

/** Whether a solid surface lies under an element's text: its own or an ancestor's inside `host`, with nothing
 *  see-through between, or else a solid thing of the page beneath its middle. A canvas is a picture, not a surface. */
function backed(el: Element, host: Element, view: Window): boolean {
  for (let at: Element | null = el; at !== null && at !== host; at = at.parentElement) {
    const style = view.getComputedStyle(at);
    if (Number.parseFloat(style.opacity) < 1) return false;
    if (at.tagName !== 'CANVAS' && alphaOf(style.backgroundColor) === 1) return true;
  }
  const rect = el.getBoundingClientRect();
  const under = el.ownerDocument.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  return under.some((other) => other !== host && host.contains(other) && !el.contains(other) && !other.contains(el) && other.tagName !== 'CANVAS'
    && alphaOf(view.getComputedStyle(other).backgroundColor) === 1 && Number.parseFloat(view.getComputedStyle(other).opacity) === 1);
}

/** Every box of the screen drawn in `host`: controls, elements holding text of their own, display headings and the
 *  words of the map. Things that are not shown (hidden, without size, or a pixel kept for a reader) are left out. */
export function collectBoxes(host: HTMLElement): Box[] {
  const view = host.ownerDocument.defaultView!;
  const found: Array<{ el: Element; box: Box }> = [];
  const names = new Map<string, number>();
  for (const el of host.querySelectorAll<HTMLElement>('*')) {
    const caption = el.matches('canvas[data-caption]');
    const interactive = el.matches(CONTROLS);
    const hasText = caption || hasOwnText(el) || el.matches('.display-text') || (el instanceof view.HTMLInputElement && (el.placeholder !== '' || el.value !== ''));
    if (!interactive && !hasText) continue;
    const own = el.getBoundingClientRect();
    if (own.width <= 1 || own.height <= 1 || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const style = view.getComputedStyle(el);
    const rect = interactive || caption ? own : lettersOf(el, own, clips(style) || scrolls(style));
    // How far the content runs past the element's own box, or the element past the nearest box that cuts it off.
    let overflowX = style.display === 'inline' ? 0 : el.scrollWidth - el.clientWidth;
    let overflowY = style.display === 'inline' ? 0 : el.scrollHeight - el.clientHeight;
    // Inside a scroll area only the part in its window is on the screen: the rest is scrolled away.
    let [left, top, right, bottom] = [rect.left, rect.top, rect.right, rect.bottom];
    let inScroll = false;
    for (let at = el.parentElement; at !== null && at !== host.parentElement; at = at.parentElement) {
      const outer = view.getComputedStyle(at);
      const cut = at.getBoundingClientRect();
      if (scrolls(outer)) {
        inScroll = true;
        [left, top, right, bottom] = [Math.max(left, cut.left), Math.max(top, cut.top, headBarFoot(at, el, view) ?? cut.top), Math.min(right, cut.right), Math.min(bottom, cut.bottom)];
      } else if (clips(outer) && !inScroll) {
        overflowX = Math.max(overflowX, cut.left - own.left, own.right - cut.right);
        overflowY = Math.max(overflowY, cut.top - own.top, own.bottom - cut.bottom);
      }
    }
    if (right - left <= 1 || bottom - top <= 1) continue;
    const scrolledPartly = right - left < rect.width || bottom - top < rect.height;
    const allowed = (el.closest('[data-layout-allow]')?.getAttribute('data-layout-allow') ?? '').split(/\s+/);
    const base = nameOf(el);
    const count = (names.get(base) ?? 0) + 1;
    names.set(base, count);
    found.push({ el, box: {
      id: count === 1 ? base : `${base} (${count})`, x: left, y: top, w: right - left, h: bottom - top,
      interactive, hasText, overflowX, overflowY, ancestors: [],
      // A scroll area's content is meant to be longer than it; a control half scrolled away is cut, not small.
      allow: ALLOWED.filter((excuse) => allowed.includes(excuse) || (excuse === 'scroll' && scrolls(style)) || (excuse === 'small' && scrolledPartly)),
      inScroll, backed: caption || !hasText || backed(el, host, view), caption,
    } });
  }
  return found.map(({ el, box }) => ({ ...box, ancestors: found.filter((other) => other.el !== el && other.el.contains(el)).map((other) => other.box.id) }));
}

/** Every scroll area shown in `host` that scrolls down: how much of its content lies below its window, and whether
 *  a cue is drawn along its foot: a line along the foot of the area itself, and a generated box at the end of its
 *  content, held to the foot of its window. */
export function collectScrollAreas(host: HTMLElement): ScrollArea[] {
  const view = host.ownerDocument.defaultView!;
  const areas: ScrollArea[] = [];
  for (const el of host.querySelectorAll<HTMLElement>('*')) {
    if (!/auto|scroll/.test(view.getComputedStyle(el).overflowY) || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const foot = view.getComputedStyle(el, '::after');
    areas.push({
      id: nameOf(el), below: el.scrollHeight - el.clientHeight - el.scrollTop,
      cue: view.getComputedStyle(el).boxShadow.includes('inset') && foot.content !== 'none' && foot.position === 'sticky' && Number.parseFloat(foot.height) > 0 && foot.backgroundImage !== 'none',
    });
  }
  return areas;
}

/** The scroll areas shown in `host` with content below their window: the ones a player can scroll down. */
export function scrollableAreas(host: HTMLElement): HTMLElement[] {
  const view = host.ownerDocument.defaultView!;
  return [...host.querySelectorAll<HTMLElement>('*')].filter((el) => /auto|scroll/.test(view.getComputedStyle(el).overflowY)
    && el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && el.scrollHeight - el.clientHeight > 1);
}
