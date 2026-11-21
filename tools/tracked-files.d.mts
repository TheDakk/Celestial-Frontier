export const REPO_ROOT: string;
export function buildEntries(
  paths: ReadonlyArray<string>,
  read: (path: string) => Buffer,
): Array<{ path: string; text: string | null }>;
export function readRepoFiles(keep?: (path: string) => boolean): Array<{ path: string; text: string | null }>;
