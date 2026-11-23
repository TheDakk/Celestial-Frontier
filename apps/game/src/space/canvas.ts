import { paintPixels } from '../platform/canvas';
import type { MapPicture } from './project';

/** Shows a map picture on a canvas: one canvas pixel per art pixel, laid out at the picture's whole-number scale
 *  with hard pixel edges, over the palette's colour 0. */
export function showSpace(canvas: HTMLCanvasElement, picture: MapPicture, colours: readonly number[], dpr: number): void {
  paintPixels(canvas, picture, colours);
  canvas.style.width = `${picture.w * picture.scale / dpr}px`;
  canvas.style.height = `${picture.h * picture.scale / dpr}px`;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.backgroundColor = `#${(colours[0] ?? 0).toString(16).padStart(6, '0')}`;
}
