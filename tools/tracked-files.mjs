import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repository root: the parent of this tools/ folder, whatever the caller's working directory. */
export const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * `{ path, text }` for each path. A file with any NUL byte also gets `binary: true` and its text decoded
 * as latin1 (one character per byte), so every check still reads it.
 * A path whose read fails with ENOENT (deleted since git listed it) is skipped; other errors throw.
 */
export function buildEntries(paths, read) {
  const entries = [];
  for (const path of paths) {
    let buf;
    try {
      buf = read(path);
    } catch (error) {
      if (error && error.code === 'ENOENT') continue;
      throw error;
    }
    entries.push(buf.includes(0) ? { path, text: buf.toString('latin1'), binary: true } : { path, text: buf.toString('utf8') });
  }
  return entries;
}

/** Tracked files plus new, not-yet-added files (respecting .gitignore), read from the repository root. */
export function readRepoFiles(keep = () => true) {
  const paths = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean)
    .filter(keep);
  return buildEntries(paths, (path) => readFileSync(join(REPO_ROOT, path)));
}
