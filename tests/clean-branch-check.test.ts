import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { checkTrackedFiles, parseDenyWords } from '../tools/clean-branch-check.mjs';
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
  it.each(['svg', 'bmp', 'ico', 'tif', 'tiff', 'avif', 'heic', 'webm', 'pdf', 'zip', 'PNG', 'psd'])(
    'names a .%s file as media',
    (ext) => {
      expect(checkTrackedFiles([{ path: `a/b.${ext}`, text: null }])).toEqual([`a/b.${ext}: image or media file on the code branch`]);
    },
  );
  it('passes code files whose names merely contain a media word', () => {
    expect(checkTrackedFiles([{ path: 'tools/zip.ts', text: 'x' }, { path: 'a/svg-path.ts', text: 'x' }])).toEqual([]);
  });
  it.each(['notes.markdown', 'docs/page.mdx', 'guide.rst', 'plan.docx', 'docs/plan.MD'])('names %s as a document', (path) => {
    expect(checkTrackedFiles([{ path, text: null }])).toEqual([`${path}: document on the code branch`]);
  });
  it('passes the root documents and code files that only mention document extensions', () => {
    expect(checkTrackedFiles([
      { path: 'README.md', text: 'x' },
      { path: 'CLAUDE.md', text: 'x' },
      { path: 'AGENTS.md', text: 'x' },
      { path: 'tools/rst.ts', text: 'const ext = ".mdx";' },
    ])).toEqual([]);
  });
  it('names a linux home path with no trailing slash', () => {
    const home = ['', 'home', 'someone'].join('/');
    expect(checkTrackedFiles([{ path: 'a.ts', text: `cd ${home}` }, { path: 'b.ts', text: `'${home}'` }])).toEqual([
      'a.ts: home-directory path',
      'b.ts: home-directory path',
    ]);
  });
  it('passes the bare home directory itself', () => {
    const bare = ['', 'home', ''].join('/');
    expect(checkTrackedFiles([{ path: 'a.ts', text: `ls ${bare}; '${bare}'; homes and home` }])).toEqual([]);
  });
  it('names a windows home path with escaped or repeated backslashes, any case', () => {
    const escaped = ['C:', 'Users', 'someone'].join('\\\\');
    const lower = ['c:', 'users', 'someone'].join('\\');
    expect(checkTrackedFiles([{ path: 'e.json', text: `{"p":"${escaped}"}` }, { path: 'l.ts', text: lower }])).toEqual([
      'e.json: home-directory path',
      'l.ts: home-directory path',
    ]);
  });
  it('passes windows text that is not a home path', () => {
    const notHome = ['C:', 'Program Files', 'x'].join('\\\\');
    expect(checkTrackedFiles([{ path: 'w.ts', text: `${notHome} and C: Users` }])).toEqual([]);
  });
  it('names an email address', () => {
    const address = ['some.one', 'example.com'].join('@');
    expect(checkTrackedFiles([{ path: 'a.ts', text: `// contact ${address}` }])).toEqual(['a.ts: email address']);
  });
  it('passes scoped package names and version specifiers', () => {
    const lock = JSON.stringify({
      packages: { 'node_modules/@types/node': { version: '26.1.2' }, 'packages/domain/rand': { name: '@cf/domain-rand' } },
      note: 'install name@1.2.3 or @scope/pkg@4.5.6-beta.1',
    });
    expect(checkTrackedFiles([
      { path: 'package-lock.json', text: lock },
      { path: 'package.json', text: '{"devDependencies":{"@types/node":"26.1.2"}}' },
    ])).toEqual([]);
  });
  it('names a denied word as a whole word, case-insensitively', () => {
    const files = [
      { path: 'a.json', text: '{"note":"approved per Zorblat\'s review"}' },
      { path: 'b.ts', text: 'const who = "ZORBLAT";' },
      { path: 'c.ts', text: 'const z = "Zorblatty"; // longer word, not the denied one' },
      { path: 'd.bin', text: null },
    ];
    expect(checkTrackedFiles(files, ['zorblat'])).toEqual(['a.json: denied word', 'b.ts: denied word']);
    expect(checkTrackedFiles(files)).toEqual([]);
    expect(checkTrackedFiles(files, [])).toEqual([]);
  });
  it('reads deny words from a comma-separated value and ignores empty entries', () => {
    expect(parseDenyWords(undefined)).toEqual(['']);
    const words = parseDenyWords(' zorblat, ,quux ');
    expect(checkTrackedFiles([{ path: 'q.ts', text: 'Quux here' }], words)).toEqual(['q.ts: denied word']);
    expect(checkTrackedFiles([{ path: 'q.ts', text: 'nothing here' }], parseDenyWords(''))).toEqual([]);
  });
  describe.each(['CLAUDE.md', 'AGENTS.md'])('agent file %s', (name) => {
    const read = () => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
    it('exists, fits one page and names Dakk', () => {
      const text = read();
      expect(text.trimEnd().split('\n').length).toBeLessThanOrEqual(60);
      expect(text).toContain('Dakk');
    });
    it.each([
      'Old branches stay untouched. `main` keeps serving the live v1 site until Dakk says otherwise.',
      "No push, pull request, branch deletion, force operation, release or deploy without Dakk's explicit word for that exact action.",
      'Signed commits only.',
      'Assert the outcome, not the code path.',
      'Prove every new check both ways.',
      'Suspect the instrument first.',
      'Judge visuals on stills at real size.',
      'Find every reader and writer of a field before changing it.',
      'A disagreement between a document and the code is a finding.',
    ])('states the rule: %s', (rule) => {
      expect(read()).toContain(rule);
    });
    it('lists references among the things never on this branch', () => {
      expect(read()).toMatch(/## Never on this branch\n- [^\n]*\breferences\b/);
    });
  });
  it('keeps the two agent files identical after the first line', () => {
    const rest = (name: string) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8').split('\n').slice(1).join('\n');
    expect(rest('CLAUDE.md')).toBe(rest('AGENTS.md'));
  });
});
