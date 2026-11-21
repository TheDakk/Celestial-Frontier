import { spawnSync } from 'node:child_process';
import { REPO_ROOT } from './tracked-files.mjs';

const start = process.hrtime.bigint();
const steps = [
  ['node', ['tools/clean-branch-check.mjs']],
  ['node', ['tools/purity-check.mjs']],
  ['npm', ['run', 'typecheck']],
  ['npm', ['test']],
];
const elapsed = () => `gate: ${(Number(process.hrtime.bigint() - start) / 1e9).toFixed(1)}s`;
for (const [cmd, args] of steps) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: REPO_ROOT });
  if (r.status !== 0) {
    console.error(`gate: failed at ${cmd} ${args.join(' ')}`);
    console.error(elapsed());
    process.exit(r.status ?? 1);
  }
}
console.log(elapsed());
