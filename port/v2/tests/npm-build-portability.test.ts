import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error The executable profile owner intentionally has no declaration shim.
import { checkCommandInvocation } from '../tools/check-profile.mjs';

const BUILD_OWNERS = [
  'arc4recovery.mjs', 'scenemem.mjs', 'print-producer-authorities.mjs',
] as const;

describe('portable npm build invocation', () => {
  it.each(BUILD_OWNERS)('%s uses the shared invocation without putting cwd in shell text', (owner) => {
    const source = readFileSync(new URL(`../tools/${owner}`, import.meta.url), 'utf8');
    expect(source).toContain("import { checkCommandInvocation } from './check-profile.mjs';");
    // Exercise the actual two-statement call site with a fake child, not a browser/build.
    const callSites = [...source.matchAll(
      /const buildInvocation = checkCommandInvocation\('npm', \['run', 'build'\]\);\s*execFileSync\(buildInvocation\.executable, buildInvocation\.args, \{ cwd: appDir, stdio: 'inherit' \}\);/gu,
    )];
    expect(callSites).toHaveLength(1);
    expect(source).not.toContain("? 'npm.cmd' : 'npm'");
    for (const platform of ['win32', 'darwin', 'linux']) {
      const child = vi.fn();
      const appDir = platform === 'win32'
        ? 'C:\\Projects\\game & space %PATH% !literal!\\apps\\game'
        : '/tmp/game & space/apps/game';
      runInNewContext(callSites[0]![0], {
        appDir,
        execFileSync: child,
        checkCommandInvocation: (name: string, args: string[]) => checkCommandInvocation(
          name, args, platform, 'C:\\Windows\\System32\\cmd.exe',
        ),
      });
      expect(child).toHaveBeenCalledExactlyOnceWith(
        platform === 'win32' ? 'C:\\Windows\\System32\\cmd.exe' : 'npm',
        platform === 'win32' ? ['/d', '/s', '/c', 'npm.cmd run build'] : ['run', 'build'],
        { cwd: appDir, stdio: 'inherit' },
      );
    }
  });

  it('refuses shell-active Windows argument tokens before invoking cmd', () => {
    for (const token of ['build & echo injected', '%PATH%', '!PATH!', 'a|b', 'a>b', '"build"']) {
      expect(() => checkCommandInvocation('npm', ['run', token], 'win32', 'cmd.exe'))
        .toThrow(/unsafe token/u);
    }
  });
});
