export function checkTrackedFiles(
  files: ReadonlyArray<{ path: string; text: string | null }>,
  denyWords?: ReadonlyArray<string>,
): string[];
export function parseDenyWords(value: string | undefined): string[];
