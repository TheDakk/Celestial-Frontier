import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  extractTrackedV1Script,
  readTrackedV1Source,
} from '../test-support/tracked-v1-source.js';

describe('tracked v1.8.9 source authority', () => {
  it('reads the one tracked inline game script without changing its bytes', () => {
    const source = readTrackedV1Source();
    expect(source.html).toContain(`<script>${source.script}</script>`);
    expect(source.script.startsWith('\n')).toBe(true);
    expect(source.script.endsWith('\n')).toBe(true);
    expect(source.script).toContain('const ITEMS=[');
    expect(source.script).toContain('function _hdVistaEco(g, W, H, hz, opts, seed){');
    expect(Object.isFrozen(source)).toBe(true);
  });

  it('preserves CRLF, leading whitespace, and trailing whitespace verbatim', () => {
    const body = '\r\n  const byteIdentity = true;\r\n\t';
    expect(extractTrackedV1Script(`<html>\r\n<script>${body}</script>\r\n</html>`)).toBe(body);
  });

  it.each([
    ['missing-open', '<html></script></html>'],
    ['missing-close', '<html><script>body</html>'],
    ['duplicate-open', '<script><script>body</script>'],
    ['duplicate-close', '<script>body</script></script>'],
    ['reversed', '</script><script>body'],
    ['empty', '<script></script>'],
    ['whitespace-only', '<script>\r\n\t </script>'],
    ['external-plus-inline', '<script src="game.js"></script><script>body</script>'],
  ])('rejects malformed tracked HTML: %s', (_label, html) => {
    expect(() => extractTrackedV1Script(html)).toThrow(/tracked game HTML/);
  });

  it('has no ignored working-copy fallback in its executable source', () => {
    const helper = readFileSync(
      fileURLToPath(new URL('../test-support/tracked-v1-source.ts', import.meta.url)),
      'utf8',
    );
    expect(helper).not.toMatch(/main\.js/u);
    expect(helper).not.toMatch(/existsSync/u);
  });
});
