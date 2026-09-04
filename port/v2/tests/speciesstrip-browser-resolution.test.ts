import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  fileURLToPath(new URL('../tools/speciesstrip.mjs', import.meta.url)),
  'utf8',
);

describe('species-strip browser resolution', () => {
  it('uses the shared executable resolver instead of a platform/version path', () => {
    expect(source).toContain(
      "import { assertBrowserLaunchAllowed, findChromiumBrowser } from './browserpath.mjs';",
    );
    expect(source).not.toMatch(/Program Files|Microsoft Edge\.app|Google Chrome\.app|msedge\.exe/u);

    const guard = source.indexOf('assertBrowserLaunchAllowed();');
    const resolve = source.indexOf('const browserFile = findChromiumBrowser();');
    const spawn = source.indexOf("const edge = spawn(browserFile, ['--headless=new'");
    expect(guard).toBeGreaterThan(-1);
    expect(resolve).toBeGreaterThan(guard);
    expect(spawn).toBeGreaterThan(resolve);
  });
});
