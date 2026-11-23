import { iconOrStandIn } from '@cf/art-interface';
import { paintPixels } from '../platform/canvas';
import { currentSheet, interfaceGaps, sheetColours } from './sheet-source';

/** A name from the shared icon list; a name the sheet lacks shows the stand-in. */
export type IconName = string;
export type IconUse = { label: string } | { decorative: true };

/**
 * An icon drawn from the current sheet, one screen pixel per art pixel. With a label it is an image of that
 * name; a decorative one is hidden from a reader.
 */
export function icon(name: IconName, use: IconUse): HTMLElement {
  const el = document.createElement('span');
  el.className = 'icon';
  if ('label' in use) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', use.label);
  } else {
    el.setAttribute('aria-hidden', 'true');
  }
  const sheet = currentSheet();
  const drawing = iconOrStandIn(sheet, name, interfaceGaps);
  const canvas = document.createElement('canvas');
  paintPixels(canvas, drawing, sheetColours(sheet));
  canvas.style.width = `${drawing.w}px`;
  canvas.style.height = `${drawing.h}px`;
  canvas.style.imageRendering = 'pixelated';
  el.append(canvas);
  return el;
}
