import { describe, expect, it } from 'vitest';
import { LINE_LIMIT, checkAppStructure } from '../tools/app-structure-check.mjs';
import { readRepoFiles } from '../tools/tracked-files.mjs';

const lines = (n: number): string => 'x\n'.repeat(n);
const run = (path: string, text: string): string[] => checkAppStructure([{ path, text }]);
const SAVE = 'apps/game/src/save/loop.ts';

describe('app structure check: file length', () => {
  it('reports a file under apps/ of 501 lines and passes one of 500', () => {
    expect(LINE_LIMIT).toBe(500);
    expect(run('apps/game/src/a.ts', lines(500))).toEqual([]);
    expect(run('apps/game/src/a.ts', lines(501))).toEqual(['apps/game/src/a.ts: 501 lines, over the limit of 500']);
  });
  it('counts a last line without a line ending, and counts no line after a final line ending', () => {
    expect(run('apps/game/src/a.ts', lines(499) + 'x')).toEqual([]);
    expect(run('apps/game/src/a.ts', lines(500) + 'x')).toHaveLength(1);
    expect(run('apps/game/src/a.ts', 'x\r\n'.repeat(501))).toHaveLength(1);
  });
  it.each(['ts', 'mts', 'mjs', 'js', 'css', 'html'])('covers .%s files in any app, at any depth', (ext) => {
    expect(run(`apps/diagnostics/src/deep/er/a.${ext}`, lines(501))).toHaveLength(1);
    expect(run(`apps/game/a.${ext}`, lines(501))).toHaveLength(1);
  });
  it('ignores files outside apps/ and other extensions', () => {
    expect(run('packages/scene/src/a.ts', lines(501))).toEqual([]);
    expect(run('tools/apps/a.ts', lines(501))).toEqual([]);
    expect(run('apps/game/src/a.json', lines(501))).toEqual([]);
    expect(run('apps/game/src/a.txt', lines(501))).toEqual([]);
    expect(run('apps/game/src/ts', lines(501))).toEqual([]);
  });
});

describe('app structure check: module bounds', () => {
  it('reports an import from one system folder into another', () => {
    expect(run(SAVE, "import { route } from '../nav/route';")).toEqual([`${SAVE}: imports ../nav/route from another system (nav)`]);
    expect(run(SAVE, "import { route } from '../nav';")).toEqual([`${SAVE}: imports ../nav from another system (nav)`]);
    expect(run(SAVE, "import { route } from '../nav/index';")).toHaveLength(1);
    expect(run(SAVE, "export { route } from '../nav/route';")).toHaveLength(1);
    expect(run(SAVE, "import type { Route } from '../nav/route';")).toHaveLength(1);
    expect(run(SAVE, "const nav = await import('../nav/route');")).toHaveLength(1);
    expect(run(SAVE, "import '../nav/route';")).toHaveLength(1);
    expect(run('apps/game/src/save/inner/deep.ts', "import { route } from '../../nav/route';")).toHaveLength(1);
    expect(run(SAVE, "import { route } from './../save/../nav/route';")).toHaveLength(1);
  });
  it('passes own folder, bus, events, platform, ui and packages', () => {
    const text = [
      "import { a } from './boot';",
      "import { b } from './inner/b';",
      "import { c } from '../save/c';",
      "import { createBus } from '../bus';",
      "import type { GameEvents } from '../events';",
      "import { browserClocks } from '../platform/clock';",
      "import { panel } from '../ui/panel';",
      "import { enterGalaxy } from '@cf/scene';",
      "import registry from '../../../../fixtures/v1/content-registry.json';",
      "import { describe } from 'vitest';",
    ].join('\n');
    expect(run(SAVE, text)).toEqual([]);
    expect(run('apps/game/src/save/inner/deep.ts', "import { a } from '../boot';\nimport { b } from '../../bus';")).toEqual([]);
  });
  it('a file directly in src, other than main.ts, follows the same rule', () => {
    expect(run('apps/game/src/events.ts', "import type { Route } from './nav/route';")).toHaveLength(1);
    expect(run('apps/game/src/events.ts', "import type { Bus } from './bus';\nimport type { Clocks } from './platform/clock';")).toEqual([]);
  });
  it('platform and ui are systems too: neither may import another system', () => {
    expect(run('apps/game/src/platform/clock.ts', "import { a } from '../save';")).toHaveLength(1);
    expect(run('apps/game/src/ui/panel.ts', "import { a } from '../save';")).toHaveLength(1);
    expect(run('apps/game/src/ui/panel.ts', "import { a } from '../platform/clock';")).toEqual([]);
  });
  it.each(['apps/game/src/main.ts', 'apps/game/src/screens/map.ts', 'apps/game/src/screens/cards/body.ts'])(
    '%s may import a system index but not a system\'s inner file',
    (path) => {
      const up = path.includes('/cards/') ? '../../' : path.includes('/screens/') ? '../' : './';
      expect(run(path, `import { a } from '${up}save';\nimport { b } from '${up}nav/index';\nimport { c } from '${up}nav/index.ts';\nimport { d } from '${up}platform/clock';`)).toEqual([]);
      expect(run(path, `import { a } from '${up}save/boot';`)).toEqual([`${path}: imports ${up}save/boot, an inner file of another system (save); only its index may be imported`]);
      expect(run(path, `import { a } from '${up}save/inner/index';`)).toHaveLength(1);
    },
  );
  it('a system may not import screens, and a file named like main.ts inside a system gets no exemption', () => {
    expect(run(SAVE, "import { a } from '../screens';")).toHaveLength(1);
    expect(run('apps/game/src/save/main.ts', "import { a } from '../nav';")).toHaveLength(1);
  });
  it('reads imports outside comments only, and reports each import once', () => {
    expect(run(SAVE, "// import { a } from '../nav/a';\n/* import '../nav/b'; */\nconst s = '../nav/c';")).toEqual([]);
    expect(run(SAVE, "import { a } from '../nav/a';\nimport { b } from '../nav/a';\nimport { c } from '../space/c';")).toHaveLength(2);
  });
  it('leaves the other app, tests and non-script files outside the bounds rule', () => {
    expect(run('apps/diagnostics/src/save/a.ts', "import { a } from '../nav/a';")).toEqual([]);
    expect(run('apps/game/test/save.test.ts', "import { a } from '../src/nav/a';")).toEqual([]);
    expect(run('apps/game/src/save/a.css', "@import '../nav/a.css';")).toEqual([]);
  });
});

describe('app structure check: this repository', () => {
  it('the real tree is clean', () => {
    const files = readRepoFiles((path) => path.startsWith('apps/'));
    expect(files.length).toBeGreaterThan(0);
    expect(checkAppStructure(files)).toEqual([]);
  });
});
