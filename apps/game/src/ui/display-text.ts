import { drawText } from '@cf/art-interface';
import { paintPixels } from '../platform/canvas';
import { hideVisually } from './hidden';
import { currentSheet, interfaceGaps, sheetColours } from './sheet-source';

/** The fixed headings of the app. A test holds every character here to the glyphs the sheet must draw. */
export const DISPLAY_HEADINGS = Object.freeze({
  title: 'Celestial Frontier',
  settings: 'Settings',
});

/**
 * A heading: canvas for the eye, real text for a reader. The canvas holds the text as the current sheet draws it,
 * one canvas pixel per art pixel, and is shown at --display-scale screen pixels each; the text sits beside it,
 * clipped out of sight, so the heading's content is exactly its text.
 */
export function displayText(text: string, opts: { level: 1 | 2 | 3 }): HTMLElement {
  const heading = document.createElement(`h${opts.level}`);
  heading.className = 'display-text';
  const sheet = currentSheet();
  const picture = drawText(sheet.font, text, interfaceGaps);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  paintPixels(canvas, picture, sheetColours(sheet));
  canvas.style.width = `calc(${picture.w}px * var(--display-scale, 2))`;
  canvas.style.height = `calc(${picture.h}px * var(--display-scale, 2))`;
  canvas.style.imageRendering = 'pixelated';
  const reading = document.createElement('span');
  reading.textContent = text;
  hideVisually(reading);
  heading.append(canvas, reading);
  return heading;
}
