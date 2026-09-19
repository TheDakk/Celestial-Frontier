#!/usr/bin/env node
// Build ownership ends before the unit workers start. No checkout lock in tests.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { collectCurrentProducerAuthorities } from './print-producer-authorities.mjs';
const require = createRequire(import.meta.url);
const report = collectCurrentProducerAuthorities();
const child = spawnSync(process.execPath,
  [path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs'), 'run', ...process.argv.slice(2)], {
    cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'inherit',
    env: {...process.env, CF_UNIT_AUTHORITY_BUILD: JSON.stringify(report.build)},
  });
if (child.error) throw child.error;
process.exitCode = child.status ?? 1;
