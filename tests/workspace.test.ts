import { describe, it, expect } from 'vitest';
import pkg from '../package.json' with { type: 'json' };
describe('workspace', () => {
  it('is a private ES module workspace with the three workspace globs', () => {
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.workspaces).toEqual(['packages/domain/*', 'packages/*', 'apps/*']);
  });
  it('pins the toolchain exactly', () => {
    expect(pkg.devDependencies).toEqual({ '@types/node': '26.1.2', typescript: '7.0.2', vitest: '4.1.10' });
  });
});
