export interface GlyphStrokeContrastInput {
  foreground: unknown;
  background: unknown;
  opacity: unknown;
  strokeWidth: unknown;
  strokeColor: unknown;
  paintOrder: unknown;
}
export interface GlyphStrokeContrastResult {
  eligible: boolean;
  reason: string | null;
  ratio: number | null;
  fill: number[] | null;
  halo: number[] | null;
  outerWidth: number | null;
}
export declare function assessGlyphStrokeContrast(input: GlyphStrokeContrastInput): GlyphStrokeContrastResult;
