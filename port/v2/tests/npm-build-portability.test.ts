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
      /const buildInvocation = checkCommandInvocation\('npm', \['run', 'build', '--', '--mode', 'evidence'\]\);\s*execFileSync\(buildInvocation\.executable, buildInvocation\.args, \{ cwd: appDir, stdio: 'inherit' \}\);/gu,
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
        platform === 'win32'
          ? ['/d', '/s', '/c', 'npm.cmd run build -- --mode evidence']
          : ['run', 'build', '--', '--mode', 'evidence'],
        { cwd: appDir, stdio: 'inherit' },
      );
    }
  });

  it.each(['slicesmoke.mjs', 'glassmatrix.mjs', 'sliceperf.mjs', 'compendiummem.mjs'])(
    '%s explicitly selects evidence mode with its existing fixed build command', (owner) => {
      const source = readFileSync(new URL(`../tools/${owner}`, import.meta.url), 'utf8');
      const callSites = [...source.matchAll(
        /execSync\('npx vite build --mode evidence', \{ cwd: appDir, stdio: 'inherit' \}\);/gu,
      )];
      expect(callSites).toHaveLength(1);
      const child = vi.fn();
      const appDir = '/tmp/game & space/apps/game';
      runInNewContext(callSites[0]![0], { appDir, execSync: child });
      expect(child).toHaveBeenCalledExactlyOnceWith('npx vite build --mode evidence', {
        cwd: appDir, stdio: 'inherit',
      });
      expect(source).not.toContain("execSync('npx vite build', { cwd: appDir,");
    },
  );

  it('requires the evidence marker before consuming each current build, without changing the historical baseline', () => {
    for (const owner of [...BUILD_OWNERS, 'compendiummem.mjs', 'slicesmoke.mjs', 'glassmatrix.mjs', 'sliceperf.mjs']) {
      const source = readFileSync(new URL(`../tools/${owner}`, import.meta.url), 'utf8');
      expect(source).toContain("import { assertBuiltGameMode } from './build-mode.mjs';");
      if (owner === 'compendiummem.mjs') {
        expect(source).toContain("function candidateProducerAuthorityFromDist() {\n  assertBuiltGameMode(distDir, 'evidence');");
        expect(source).toContain("execFileSync(vite, ['build'], { cwd: baselineApp, stdio: 'inherit' });");
        expect(source).toContain("const builtProducer = candidateProducerAuthorityFromDist();");
      } else if ((BUILD_OWNERS as readonly string[]).includes(owner)) {
        expect(source).toContain("function distIdentity() {\n  assertBuiltGameMode(distDir, 'evidence');");
        expect(source).toMatch(/execFileSync\(buildInvocation\.executable, buildInvocation\.args,[^\n]+\);\n\s*(?:const fixture = buildCompendiumFixture\(\);\s*)?(?:const )?build = distIdentity\(\);/u);
      } else {
        expect(source).toMatch(/execSync\('npx vite build --mode evidence',[^\n]+\);\n\s*assertBuiltGameMode\(dist, 'evidence'\);/u);
      }
    }
  });

  it('refuses shell-active Windows argument tokens before invoking cmd', () => {
    for (const token of ['build & echo injected', '%PATH%', '!PATH!', 'a|b', 'a>b', '"build"']) {
      expect(() => checkCommandInvocation('npm', ['run', token], 'win32', 'cmd.exe'))
        .toThrow(/unsafe token/u);
    }
  });
});
