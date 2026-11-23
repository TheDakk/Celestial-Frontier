/* Where the words of a map stand, in whole art pixels: the same inputs give the same places on every device. */

/** The words of a caption on as few lines as fit `max`, broken at its spaces; `widthOf` measures one line. A single
 *  word wider than `max` keeps a line to itself. */
export function wrapWords(text: string, widthOf: (line: string) => number, max: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    const last = lines.length - 1;
    const joined = `${lines[last]} ${word}`;
    if (last >= 0 && widthOf(joined) <= max) lines[last] = joined;
    else lines.push(word);
  }
  return lines;
}
