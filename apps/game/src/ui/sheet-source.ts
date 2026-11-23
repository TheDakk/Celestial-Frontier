import { parseInterfaceSheet, type Gaps, type InterfaceSheet } from '@cf/art-interface';
import placeholderText from '../../../../packages/art-testparts/src/interface.txt?raw';

let placeholder: InterfaceSheet | undefined;
let pack: InterfaceSheet | null = null;

/** The placeholder sheet carried in the script, parsed once. */
export function placeholderSheet(): InterfaceSheet {
  placeholder ??= parseInterfaceSheet(placeholderText);
  return placeholder;
}

/** Gives the sheet of the loaded `interface` pack, or null to go back to the placeholder. */
export function useSheet(sheet: InterfaceSheet | null): void {
  pack = sheet;
}

/** The sheet display text and icons are drawn from now: the `interface` pack when loaded, else the placeholder. */
export function currentSheet(): InterfaceSheet {
  return pack ?? placeholderSheet();
}

export function sheetState(): 'pack' | 'standin' {
  return pack === null ? 'standin' : 'pack';
}

/** Every glyph and icon asked for that the sheet in use lacked, one entry per use. */
export const interfaceGaps: Gaps = { glyphs: [], icons: [], elements: [] };

/** The colour (0xRRGGBB) of each pixel value of a sheet: 1 to 4 its `ink` ramp, 5 to 8 its `accent` ramp. */
export function sheetColours(sheet: InterfaceSheet): number[] {
  const ramp = (name: string): number[] => {
    const indices = Object.hasOwn(sheet.palette.ramps, name) ? sheet.palette.ramps[name] : undefined;
    return (indices ?? [0, 0, 0, 0]).map((index) => sheet.palette.colours[index] ?? 0);
  };
  return [0, ...ramp('ink'), ...ramp('accent')];
}
