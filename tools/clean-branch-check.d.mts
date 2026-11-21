export function checkTrackedFiles(
  files: ReadonlyArray<{ path: string; text: string }>,
  denyWords?: ReadonlyArray<string>,
): string[];
export function parseDenyWords(value: string | undefined): string[];
