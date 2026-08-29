/* speciesexport-support.mjs — argument-safe portable ZIP creation for the
   full-size portrait exporter. Browser/server cleanup lives at the shared
   art-browser ownership boundary. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function fail(message) { throw new Error(`speciesexport: ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }

const WINDOWS_ZIP_ENV = Object.freeze({
  source: 'CF_SPECIES_ZIP_SOURCE',
  output: 'CF_SPECIES_ZIP_OUTPUT',
});
const WINDOWS_ZIP_COMMAND = [
  '$ErrorActionPreference = "Stop"',
  `$Source = $env:${WINDOWS_ZIP_ENV.source}`,
  `$Destination = $env:${WINDOWS_ZIP_ENV.output}`,
  'if ([string]::IsNullOrWhiteSpace($Source) -or [string]::IsNullOrWhiteSpace($Destination)) { throw "ZIP paths are missing" }',
  '$Items = @(Get-ChildItem -LiteralPath $Source -Force)',
  'if ($Items.Count -eq 0) { throw "ZIP source is empty" }',
  'Compress-Archive -LiteralPath $Items.FullName -DestinationPath $Destination -CompressionLevel Optimal',
].join('; ');

export function portableZipInvocation(sourceDirectory, outputFile, platform = process.platform) {
  assert(typeof sourceDirectory === 'string' && path.isAbsolute(sourceDirectory),
    'ZIP source must be an absolute directory path');
  assert(typeof outputFile === 'string' && path.isAbsolute(outputFile),
    'ZIP output must be an absolute path');
  if (platform === 'win32') {
    return Object.freeze({
      file: 'powershell.exe',
      args: Object.freeze([
        '-NoProfile', '-NonInteractive', '-Command',
        WINDOWS_ZIP_COMMAND,
      ]),
      cwd: undefined,
      environment: Object.freeze({
        [WINDOWS_ZIP_ENV.source]: sourceDirectory,
        [WINDOWS_ZIP_ENV.output]: outputFile,
      }),
    });
  }
  assert(platform === 'darwin' || platform === 'linux',
    `unsupported ZIP platform ${JSON.stringify(platform)}`);
  return Object.freeze({
    file: '/usr/bin/zip',
    args: Object.freeze(['-X', '-q', '-r', outputFile, '.']),
    cwd: sourceDirectory,
  });
}

export function createDirectoryContentsZip(sourceDirectory, outputFile, {
  platform = process.platform,
  run = execFileSync,
  fileExists = fs.existsSync,
} = {}) {
  assert(typeof run === 'function' && typeof fileExists === 'function',
    'ZIP dependencies are invalid');
  const source = path.resolve(sourceDirectory);
  const output = path.resolve(outputFile);
  const stat = fs.lstatSync(source, { throwIfNoEntry: false });
  assert(stat?.isDirectory() && !stat.isSymbolicLink(), 'ZIP source is not one real directory');
  assert(fs.readdirSync(source).length > 0, 'ZIP source is empty');
  assert(!fileExists(output), `refusing to overwrite existing ZIP ${output}`);
  const invocation = portableZipInvocation(source, output, platform);
  if (platform !== 'win32') {
    assert(fileExists(invocation.file), `required POSIX ZIP tool is missing: ${invocation.file}`);
  }
  run(invocation.file, [...invocation.args], {
    cwd: invocation.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    ...(invocation.environment === undefined ? {} : {
      env: { ...process.env, ...invocation.environment },
    }),
  });
  const outputStat = fs.lstatSync(output, { throwIfNoEntry: false });
  assert(outputStat?.isFile() && !outputStat.isSymbolicLink() && outputStat.size > 0,
    `ZIP command did not create a nonempty archive at ${output}`);
  return output;
}
