import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  createDirectoryContentsZip, portableZipInvocation,
} from '../tools/speciesexport-support.mjs';

const exporterSource = () => readFileSync(
  fileURLToPath(new URL('../tools/speciesexport.mjs', import.meta.url)), 'utf8',
);

function assessExporterWiring(source: string): string[] {
  const errors: string[] = [];
  const supportImport = source.match(/import\s*\{([^}]+)\}\s*from '\.\/speciesexport-support\.mjs';/u)?.[1] ?? '';
  if (!/\bcreateDirectoryContentsZip\b/u.test(supportImport)) {
    errors.push('support-import:createDirectoryContentsZip');
  }
  const authorityImport = source.match(/import\s*\{([^}]+)\}\s*from '\.\/art-browser-contract\.mjs';/u)?.[1] ?? '';
  for (const symbol of ['withArtBrowserCdp', 'closeArtToolServer']) {
    if (!new RegExp(`\\b${symbol}\\b`, 'u').test(authorityImport)) errors.push(`authority-import:${symbol}`);
  }
  const server = source.indexOf('const server = http.createServer');
  const boundary = source.indexOf('const summary = await withArtBrowserCdp({');
  const archive = source.indexOf('createDirectoryContentsZip(dir, zip);');
  if (server < 0 || boundary < 0 || !(server < boundary)) {
    errors.push('owned-resource-cleanup-boundary');
  }
  if (boundary >= 0 && !source.slice(boundary, archive).includes(
    'cleanup: () => closeArtToolServer(server)')) errors.push('owned-resource-cleanup-boundary');
  if (archive < boundary) errors.push('portable-zip-call');
  if (/Compress-Archive|execSync\s*\(\s*`powershell/iu.test(source)) errors.push('interpolated-shell-zip');
  const boundaryEnd = source.indexOf('\n});', boundary);
  if (boundary >= 0 && boundaryEnd >= 0
    && /process\.exit\s*\(/u.test(source.slice(boundary, boundaryEnd))) {
    errors.push('exit-bypasses-cleanup');
  }
  return errors;
}

describe('speciesexport portable archive and cleanup contract', () => {
  it('binds every owned resource and ZIP write to the tested support boundary', () => {
    expect(assessExporterWiring(exporterSource())).toEqual([]);
  });

  it('rejects protected speciesexport source mutations', () => {
    const source = exporterSource();
    const mutations: Array<[string, string, string]> = [
      ['missing cleanup boundary', source.replace('const summary = await withArtBrowserCdp({', 'const summary = await withForeignBrowserCdp({'), 'owned-resource-cleanup-boundary'],
      ['unowned server', source.replace('cleanup: () => closeArtToolServer(server)', '/* server cleanup removed */'), 'owned-resource-cleanup-boundary'],
      ['direct ZIP omission', source.replace('createDirectoryContentsZip(dir, zip);', 'void zip;'), 'portable-zip-call'],
      ['shell ZIP', `${source}\nexecSync(\`powershell -Command Compress-Archive\`);\n`, 'interpolated-shell-zip'],
      ['early process exit', source.replace('}, async ({ send, provenance }) => {',
        '}, async ({ send, provenance }) => {\n  process.exit(0);'), 'exit-bypasses-cleanup'],
    ];
    for (const [label, mutant, expected] of mutations) {
      expect(assessExporterWiring(mutant), label).toContain(expected);
    }
  });

  it('keeps POSIX paths in argv and Windows paths only in dedicated environment values', () => {
    const source = path.join(path.resolve(tmpdir()), "source with 'quotes' ; $() `ticks` $dollars");
    const output = path.join(path.resolve(tmpdir()), 'output with spaces $().zip');
    const posix = portableZipInvocation(source, output, 'darwin');
    expect(posix).toEqual({
      file: '/usr/bin/zip',
      args: ['-X', '-q', '-r', output, '.'],
      cwd: source,
    });
    const windows = portableZipInvocation(source, output, 'win32');
    expect(windows.file).toBe('powershell.exe');
    expect(windows.args).toHaveLength(4);
    expect(windows.args[3]).toContain('Compress-Archive');
    expect(windows.args[3]).not.toContain(source);
    expect(windows.args[3]).not.toContain(output);
    expect(windows.args.slice(4)).toEqual([]);
    expect(windows.environment).toEqual({
      CF_SPECIES_ZIP_SOURCE: source,
      CF_SPECIES_ZIP_OUTPUT: output,
    });
    expect(() => portableZipInvocation(source, output, 'freebsd' as NodeJS.Platform))
      .toThrow(/unsupported ZIP platform/u);
  });

  it('creates and verifies a nonempty archive through an injected argument-safe runner', () => {
    const temporary = mkdtempSync(path.join(path.resolve(tmpdir()), 'cf-speciesexport-zip-test-'));
    try {
      const source = path.join(temporary, "set with 'quotes' ; shell text");
      const output = path.join(temporary, 'archive with spaces.zip');
      mkdirSync(source);
      writeFileSync(path.join(source, 'portrait one.png'), 'fixture portrait');
      const calls: Array<{ file: string; args: string[]; options: Record<string, unknown> }> = [];
      const result = createDirectoryContentsZip(source, output, {
        platform: 'darwin',
        fileExists(file: string) { return file === '/usr/bin/zip' || existsSync(file); },
        run(file: string, args: string[], options: object) {
          calls.push({ file, args, options: options as Record<string, unknown> });
          writeFileSync(output, 'fixture zip bytes');
        },
      });
      expect(result).toBe(output);
      expect(calls).toEqual([{
        file: '/usr/bin/zip',
        args: ['-X', '-q', '-r', output, '.'],
        options: { cwd: source, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
      }]);
      expect(() => createDirectoryContentsZip(source, output, {
        platform: 'darwin', fileExists: existsSync,
      })).toThrow(/refusing to overwrite existing ZIP/u);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  it('passes hostile Windows path text only through the child environment', () => {
    const temporary = mkdtempSync(path.join(path.resolve(tmpdir()), 'cf-speciesexport-win-test-'));
    try {
      const source = path.join(temporary, 'source $() `ticks` ; semicolon');
      const output = path.join(temporary, 'archive $() `ticks`.zip');
      mkdirSync(source);
      writeFileSync(path.join(source, 'portrait.png'), 'fixture portrait');
      const calls: Array<{ file: string; args: string[]; options: Record<string, unknown> }> = [];
      createDirectoryContentsZip(source, output, {
        platform: 'win32',
        fileExists: existsSync,
        run(file: string, args: string[], options: object) {
          calls.push({ file, args, options: options as Record<string, unknown> });
          writeFileSync(output, 'fixture zip bytes');
        },
      });
      expect(calls).toHaveLength(1);
      expect(calls[0]?.file).toBe('powershell.exe');
      expect(calls[0]?.args).toHaveLength(4);
      expect(calls[0]?.args.join('\n')).not.toContain(source);
      expect(calls[0]?.args.join('\n')).not.toContain(output);
      expect(calls[0]?.options.cwd).toBeUndefined();
      expect(calls[0]?.options.env).toMatchObject({
        CF_SPECIES_ZIP_SOURCE: source,
        CF_SPECIES_ZIP_OUTPUT: output,
      });
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

});
