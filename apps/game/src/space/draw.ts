/* What the map's producers share: where a world point falls in the picture, colours, and how a soft light of the
   game is drawn in pixel art. */
import type { NavState } from '@cf/scene';
import type { Camera, Viewport } from './camera';
import type { Sizing } from './sizes';

export interface Grid { w: number; h: number }

/** Where a world point falls in the picture, in whole art pixels. */
export function place(cam: Camera, grid: Grid, wx: number, wy: number): { x: number; y: number } {
  return { x: Math.round(grid.w / 2 + (wx - cam.x) * cam.z), y: Math.round(grid.h / 2 + (wy - cam.y) * cam.z) };
}

export const rgbOf = (hex: string): number => parseInt(hex.slice(1), 16);

/** 0xRRGGBB for a hue in degrees and a saturation and lightness from 0 to 1. */
export function hsl(hue: number, saturation: number, lightness: number): number {
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number): number => {
    const k = (n + hue / 30) % 12;
    return Math.round((lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return (channel(0) << 16) | (channel(8) << 8) | channel(4);
}

/** A colour with each channel multiplied by k, from 0 to 1. */
export function scaled(colour: number, k: number): number {
  const channel = (shift: number): number => Math.round(((colour >>> shift) & 255) * k);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

const TONE_STEPS = [0.25, 0.5, 1] as const;
/**
 * A light of `colour` at a strength from 0 to 1 over the dark of space, as pixel art: the colour at a quarter, a half
 * or its full brightness (the lowest step that reaches the strength), and how many of every 16 pixels carry it.
 */
export function tone(colour: number, strength: number): { colour: number; level: number } {
  const step = TONE_STEPS.find((s) => strength <= s) ?? 1;
  return { colour: scaled(colour, step), level: Math.round(16 * Math.min(strength, 1) / step) };
}

/** What the game's settings allow: `effects` is its effects switch, `motion` false when motion is reduced. */
export interface MapPasses { effects: boolean; motion: boolean }

/** What a pass reads. `cam` counts art pixels per world unit and `zoom` screen pixels per world unit; `time` is
 *  already 0 when motion is reduced. */
export interface PassView {
  nav: NavState; cam: Camera; grid: Grid; view: Viewport; zoom: number; time: number;
  reach: number; charts: boolean; effects: boolean; motion: boolean;
  /** Present when the picture sizes its things by the camera. */
  sizing?: Sizing;
  /** A planet's night, light and cloud are whole pixels: no dither on a planet. */
  solid?: boolean;
}

/** The frame of a turning thing drawn in `frames` steps over `period` radians, at `angle`. */
export function frameOf(angle: number, period: number, frames: number): number {
  return ((Math.floor(angle / (period / frames)) % frames) + frames) % frames;
}
/** An element's name at a frame: the first frame is the element itself. */
export const framed = (name: string, frame: number): string => (frame === 0 ? name : `${name}/t${frame}`);
