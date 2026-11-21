import { describe, it, expect } from 'vitest';
import { buildEntries } from '../tools/tracked-files.mjs';

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
  it('gives null text for a binary file', () => {
    expect(buildEntries(['a.bin'], () => Buffer.from([1, 0, 2]))).toEqual([{ path: 'a.bin', text: null }]);
  });
  it('rethrows any other read error', () => {
    const denied = () => {
      throw Object.assign(new Error('EACCES'), { code: 'EACCES' });
    };
    expect(() => buildEntries(['x.ts'], denied)).toThrow('EACCES');
  });
});
