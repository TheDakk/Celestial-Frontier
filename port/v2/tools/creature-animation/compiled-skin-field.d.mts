import type {PaintSkin} from './paint-skin.mjs';

declare const compiledSkinFieldBrand: unique symbol;
/** Opaque immutable source snapshot with private reusable frame scratch. */
export interface CompiledSkinField {
  readonly [compiledSkinFieldBrand]: true;
  readonly vertexCount: number;
  readonly jointCount: number;
  readonly weightCount: number;
}
export function createCompiledSkinField(skin: PaintSkin, width: number, height: number): CompiledSkinField;
/** Atomic output publication; current matrix components are read on every call. */
export function applyCompiledSkinField(
  state: CompiledSkinField,
  matrices: Readonly<Record<string, readonly number[] | Float32Array | Float64Array>>,
  output: Float32Array | Float64Array,
): void;
