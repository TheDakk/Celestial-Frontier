import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { REPO_ROOT } from './tracked-files.mjs';

// The TypeScript compiler installed in this repository, run by this same node: no npx, so a missing
// install fails here instead of fetching a compiler from the network.
const TSC = join(REPO_ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

const start = process.hrtime.bigint();
const steps = [
  ['node', ['tools/clean-branch-check.mjs']],
  ['node', ['tools/purity-check.mjs']],
  [process.execPath, [TSC, '-p', 'tsconfig.json'], 'typecheck: ok'],
  [process.execPath, [TSC, '-p', 'apps/diagnostics/tsconfig.json'], 'diagnostics typecheck: ok'],
  [process.execPath, [TSC, '-p', 'packages/audio/tsconfig.json'], 'audio typecheck: ok'],
  [process.execPath, [TSC, '-p', 'packages/persistence/tsconfig.json'], 'persistence typecheck: ok'],
  ['npm', ['test']],
];
const elapsed = () => `gate: ${(Number(process.hrtime.bigint() - start) / 1e9).toFixed(1)}s`;
for (const [cmd, args, okLine] of steps) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: REPO_ROOT });
  if (r.status !== 0) {
    console.error(`gate: failed at ${cmd} ${args.join(' ')}${r.error ? ` (${r.error.message})` : ''}`);
    console.error(elapsed());
    process.exit(r.status ?? 1);
  }
  if (okLine !== undefined) console.log(okLine);
}
console.log(elapsed());
