import { describe, it, expect } from 'vitest';
import { checkTrackedFiles } from '../tools/clean-branch-check.mjs';
describe('clean-branch check', () => {
  it('passes a clean tree', () => {
    expect(checkTrackedFiles([{ path: 'README.md', text: 'hi' }, { path: 'packages/a/src/i.ts', text: 'export {}' }])).toEqual([]);
  });
  it('names an image file', () => {
    expect(checkTrackedFiles([{ path: 'a/b.png', text: null }])).toEqual(['a/b.png: image or media file on the code branch']);
  });
  it('names a stray document', () => {
    expect(checkTrackedFiles([{ path: 'docs/plan.md', text: 'x' }])).toEqual(['docs/plan.md: document on the code branch']);
  });
  it('names a home path', () => {
    const home = ['', 'Users', 'someone', 'x'].join('/');
    expect(checkTrackedFiles([{ path: 'a.ts', text: `const p='${home}'` }])).toEqual(['a.ts: home-directory path']);
  });
  it('names a linux home path and a windows home path', () => {
    const linux = ['', 'home', 'someone', 'x'].join('/');
    const win = ['C:', 'Users', 'someone'].join('\\');
    expect(checkTrackedFiles([{ path: 'l.ts', text: linux }, { path: 'w.ts', text: win }])).toEqual([
      'l.ts: home-directory path',
      'w.ts: home-directory path',
    ]);
  });
  it('allows the bare word home in prose and documents at the root', () => {
    const prose = ['', 'home', ''].join('/');
    expect(checkTrackedFiles([
      { path: 'a.ts', text: `go ${prose} or just home` },
      { path: 'CLAUDE.md', text: 'x' },
      { path: 'AGENTS.md', text: 'x' },
    ])).toEqual([]);
  });
  it('treats nested README.md as a stray document and skips binary text checks', () => {
    expect(checkTrackedFiles([{ path: 'pkg/README.md', text: 'x' }, { path: 'x.bin', text: null }])).toEqual([
      'pkg/README.md: document on the code branch',
    ]);
  });
});
