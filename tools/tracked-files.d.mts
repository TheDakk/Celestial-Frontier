export const REPO_ROOT: string;
/** `binary` is set (true) only for a file holding a NUL byte; its text is still decoded as utf8, NUL bytes kept. */
export interface RepoFile { path: string; text: string; binary?: true }
export function buildEntries(
  paths: ReadonlyArray<string>,
  read: (path: string) => Buffer,
): Array<RepoFile>;
export function readRepoFiles(keep?: (path: string) => boolean): Array<RepoFile>;
