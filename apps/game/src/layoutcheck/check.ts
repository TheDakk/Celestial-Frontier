/* What is wrong with a laid-out screen, decided from its boxes alone: the page measures (`probe`), this judges. */
import type { InputMode } from '../events';

/**
 * One thing on a screen, in CSS pixels of the view: a control's box, or the box of the letters of a text. `overflowX` and `overflowY` are how far its content runs past its
 * own box. `ancestors` are the ids of the boxes it lies inside. `allow` excuses it: `scroll` (it is a scroll area, so
 * its content is meant to be longer than it), `overlap`, `small`. `inScroll` is true inside a scroll area, where being
 * out of sight is being scrolled away. `backed` is true when a solid surface lies under its text. `caption` marks
 * words lettered on the map, which stand on the map itself and may run off its edge.
 */
export interface Box {
  id: string; x: number; y: number; w: number; h: number;
  interactive: boolean; hasText: boolean; overflowX: number; overflowY: number;
  ancestors: readonly string[]; allow: readonly ('scroll' | 'overlap' | 'small')[];
  inScroll: boolean; backed: boolean; caption: boolean;
}
export type LayoutProblemKind = 'clipped-text' | 'overlap' | 'small-target' | 'off-screen' | 'see-through' | 'wide-caption';
export interface LayoutProblem { kind: LayoutProblemKind; ids: readonly string[]; detail: string }
/** The view, and how much of each side the device keeps for itself. */
export interface LayoutViewport { w: number; h: number; safe?: { top: number; right: number; bottom: number; left: number } }

/** The sizes every screen is laid out at: two for each size class. */
export const LAYOUT_SIZES = Object.freeze([
  { w: 360, h: 640 }, { w: 390, h: 844 },      // compact
  { w: 844, h: 390 }, { w: 768, h: 1024 },     // medium
  { w: 1280, h: 800 }, { w: 1920, h: 1080 },   // wide
] as const);

/** A control under touch is at least this wide and this high. */
export const TOUCH_TARGET_PX = 44;
/** Measurements within a pixel are the same. */
const SLACK = 1;

const px = (value: number): string => String(Math.round(value * 10) / 10);

/**
 * Every fault of a screen:
 * - clipped-text: text whose content is wider or taller than its box by more than a pixel, unless it is a scroll area;
 * - off-screen: a box that leaves the view less its safe area by more than a pixel (not inside a scroll area, and not
 *   words of the map);
 * - overlap: two controls, or a control and text, neither inside the other, sharing more than a pixel each way;
 * - small-target: under touch, a control narrower or shorter than 44 pixels;
 * - see-through: text with no solid surface under it, so whatever is behind shows through it;
 * - wide-caption: words of the map wider than the view.
 */
export function checkLayout(boxes: readonly Box[], viewport: LayoutViewport, input: InputMode): LayoutProblem[] {
  const problems: LayoutProblem[] = [];
  const safe = viewport.safe ?? { top: 0, right: 0, bottom: 0, left: 0 };
  for (const box of boxes) {
    if (box.caption) {
      if (box.w > viewport.w + SLACK) problems.push({ kind: 'wide-caption', ids: [box.id], detail: `${px(box.w)} px wide in a view of ${px(viewport.w)}` });
      continue;
    }
    if (box.hasText && !box.allow.includes('scroll') && (box.overflowX > SLACK || box.overflowY > SLACK)) {
      problems.push({ kind: 'clipped-text', ids: [box.id], detail: `content runs ${px(Math.max(box.overflowX, 0))} px past its width and ${px(Math.max(box.overflowY, 0))} px past its height` });
    }
    if (box.hasText && !box.backed) problems.push({ kind: 'see-through', ids: [box.id], detail: 'no solid surface lies under this text' });
    const out = Math.max(safe.left - box.x, safe.top - box.y, box.x + box.w - (viewport.w - safe.right), box.y + box.h - (viewport.h - safe.bottom));
    if (!box.inScroll && out > SLACK) problems.push({ kind: 'off-screen', ids: [box.id], detail: `${px(out)} px outside the view` });
    if (input === 'touch' && box.interactive && !box.allow.includes('small') && (box.w < TOUCH_TARGET_PX || box.h < TOUCH_TARGET_PX)) {
      problems.push({ kind: 'small-target', ids: [box.id], detail: `${px(box.w)} by ${px(box.h)} px, under ${TOUCH_TARGET_PX}` });
    }
  }
  const excused = (box: Box): boolean => box.caption || box.allow.includes('overlap');
  const controls = boxes.filter((box) => box.interactive && !excused(box));
  const texts = boxes.filter((box) => box.hasText && !box.interactive && !excused(box));
  controls.forEach((a, i) => {
    for (const b of [...controls.slice(i + 1), ...texts]) {
      if (a.ancestors.includes(b.id) || b.ancestors.includes(a.id)) continue;
      const across = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const down = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (across > SLACK && down > SLACK) problems.push({ kind: 'overlap', ids: [a.id, b.id], detail: `they share ${px(across)} by ${px(down)} px` });
    }
  });
  return problems;
}
