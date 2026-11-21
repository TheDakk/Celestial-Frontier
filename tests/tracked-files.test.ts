import { describe, it, expect } from 'vitest';
import { buildEntries } from '../tools/tracked-files.mjs';
import { checkTrackedFiles } from '../tools/clean-branch-check.mjs';
import { checkPurity } from '../tools/purity-check.mjs';

function enoent(path: string): Error {
  return Object.assign(new Error(`ENOENT: no such file or directory, open '${path}'`), { code: 'ENOENT' });
}

describe('tracked-files entry builder', () => {
  it('skips a path whose read throws ENOENT and keeps a normal path', () => {
    const read = (path: string): Buffer => {
      if (path === 'gone.ts') throw enoent(path);
      return Buffer.from(`text of ${path}`);
    };
    expect(buildEntries(['gone.ts', 'kept.ts'], read)).toEqual([{ path: 'kept.ts', text: 'text of kept.ts' }]);
  });
  it('keeps the utf8 text of a file with a NUL byte, NUL bytes included, and marks it binary', () => {
    const home = ['', 'Users', 'someone', ''].join('/');
    const bytes = Buffer.concat([Buffer.from([0x61, 0, 0xc3, 0xa9]), Buffer.from(home)]);
    expect(buildEntries(['a.bin'], () => bytes)).toEqual([{ path: 'a.bin', text: `a\0é${home}`, binary: true }]);
    expect(buildEntries(['t.ts'], () => Buffer.from('é'))).toEqual([{ path: 't.ts', text: 'é' }]);
  });
  it('gives the scanners a NUL file with a home path, and they report it', () => {
    const home = ['', 'Users', 'someone', 'x'].join('/');
    const entries = buildEntries(['packages/domain/x/src/a.ts'], () => Buffer.from(`const p = '${home}';\0`));
    expect(checkTrackedFiles(entries)).toEqual(['packages/domain/x/src/a.ts: home-directory path']);
    expect(checkPurity(entries)).toEqual(['packages/domain/x/src/a.ts: contains a NUL byte']);
  });
  it('gives the clean-branch check a NUL file holding a denied word with a non-ASCII letter, and it reports it', () => {
    const entries = buildEntries(['n.ts'], () => Buffer.from('const who = "Zoë Quux";\0'));
    expect(checkTrackedFiles(entries, ['zoë'])).toEqual(['n.ts: denied word']);
    expect(checkTrackedFiles(entries, ['zoe'])).toEqual([]);
  });
  it('rethrows any other read error', () => {
    const denied = () => {
      throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
    };
    expect(() => buildEntries(['x.ts'], denied)).toThrow('EACCES');
  });
});
