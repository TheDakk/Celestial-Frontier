import { parseCatalogueText } from '@cf/art-format';
import type { Catalogue } from '@cf/art-format';

/** The parser's line numbers count through the joined text: one inside the pack being added is told from that pack's first line. */
const fromPackStart = (message: string, linesBefore: number): string =>
  message.replace(/\bline (\d+)/g, (whole: string, n: string) => (Number(n) > linesBefore ? `line ${Number(n) - linesBefore}` : whole));

/**
 * One catalogue of the loaded parts packs: the texts in the order given (the palette first, then each pack), joined by
 * a line end and read by the format's own parser, as the pack checker joins its files. The parser refuses a text as a
 * whole (a second definition of a part, a scaffold, a ramp, a species or a stand-in is refused, never taken over the
 * first), so when the joined text is refused the packs are added one at a time: a pack the catalogue cannot take with
 * those before it is left out whole and reported as `pack <n> of <count>: <the parser's words>`, and the rest still
 * form the catalogue. Never throws.
 */
export function buildCatalogue(texts: readonly string[]): { catalogue: Catalogue; problems: string[] } {
  try {
    return { catalogue: parseCatalogueText(texts.join('\n')), problems: [] };
  } catch { /* some pack is refused: find which */ }
  const problems: string[] = [];
  const taken: string[] = [];
  let catalogue = parseCatalogueText('');
  texts.forEach((text, i) => {
    try {
      catalogue = parseCatalogueText([...taken, text].join('\n'));
      taken.push(text);
    } catch (error) {
      const linesBefore = taken.length === 0 ? 0 : taken.join('\n').split('\n').length;
      problems.push(`pack ${i + 1} of ${texts.length}: ${fromPackStart(error instanceof Error ? error.message : String(error), linesBefore)}`);
    }
  });
  return { catalogue, problems };
}
