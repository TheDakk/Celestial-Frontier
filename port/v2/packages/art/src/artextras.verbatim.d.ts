/* Hand-written types for the auto-lifted renderer-section painters. */
export function decoSprite(dc: Record<string, unknown>): HTMLCanvasElement;
export function _quasarSpr(): HTMLCanvasElement;
export function starSprite(col: string, spike?: boolean): HTMLCanvasElement;
/* system-view small-body painters (v1.4 HD coverage pass) */
export function _rockSet(kind: 'rock' | 'ice'): HTMLCanvasElement[];
export function _ringSprite(seed: number, hue: string): HTMLCanvasElement;
export function _starSurf(seed: number, col: string, kind: string): HTMLCanvasElement;
export function _moonSpr(ti: number, hd: boolean): HTMLCanvasElement;
export function _dwarfSpr(v: number): HTMLCanvasElement;
export function _rogueSpr(): HTMLCanvasElement;
export function _beamSpr(): HTMLCanvasElement;
export function _nsCoreSpr(): HTMLCanvasElement;
export function _bhSpr(): HTMLCanvasElement;
