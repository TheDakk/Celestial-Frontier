export interface InterfaceReport {
  ok: boolean;
  /** The parser's message when the sheet does not parse; then `problems` is empty and `summary` null. */
  parseError: string | null;
  /** One line per fault: `missing ramp|glyph|icon|element <name>`, `unknown icon|element <name>`, `icon <name> is <w> by <h>, not 16 by 16`. */
  problems: string[];
  summary: { glyphs: number; icons: number; elements: number; line: number } | null;
}
/** The side of every interface icon, in art pixels. */
export const ICON_SIZE: number;
export function checkInterface(text: string): InterfaceReport;
export function formatInterfaceReport(report: InterfaceReport): string;
