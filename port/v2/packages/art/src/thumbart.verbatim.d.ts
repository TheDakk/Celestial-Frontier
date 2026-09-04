/* Hand-written types for the auto-lifted ThumbArt body (verbatim v1.8.9). */
type P = Record<string, unknown>;
export function getPlanetSprite(P: P, wantPx?: number): HTMLCanvasElement;
export function installPlanetSpriteFinisher(
  finisher: (surface: HTMLCanvasElement) => HTMLCanvasElement,
): void;
export type ThumbSurfaceKindV1 = 'planet' | 'star' | 'galaxy' | 'moon' | 'comet' | 'belt';
export function installThumbSurfaceFinisher(
  finisher: (
    surface: HTMLCanvasElement,
    kind: ThumbSurfaceKindV1,
    identity: string,
  ) => HTMLCanvasElement,
): void;
export function planetThumb(P: P): string;
export function starThumb(kind: string, col: string, col2?: string | null): string;
export function galaxyThumb(g: P): string;
export function moonThumb(ti: number, seed: number): string;
export function cometThumb(): string;
export function beltThumb(): string;
