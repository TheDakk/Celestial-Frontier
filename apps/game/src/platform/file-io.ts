/** Hands the player `text` as a file to keep, named `name`. */
export function saveTextFile(name: string, text: string): void {
  // Not a text type: a browser may add its own ending to the name of a text file.
  const url = URL.createObjectURL(new Blob([text], { type: 'application/octet-stream' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Asks the player for a file and resolves with its text; null when none was chosen. At most `maxBytes + 1`
 * bytes are read, so a file over the limit arrives as a text over the limit, never whole. A file that
 * cannot be read arrives as an empty text.
 */
export function pickTextFile(maxBytes: number): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.hidden = true;
    const done = (text: string | null): void => {
      input.remove();
      resolve(text);
    };
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file === undefined) done(null);
      else file.slice(0, maxBytes + 1).text().then(done, () => done(''));
    });
    input.addEventListener('cancel', () => done(null));
    document.body.append(input);
    input.click();
  });
}
