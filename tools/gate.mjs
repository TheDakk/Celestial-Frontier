import { spawnSync } from 'node:child_process';

const start = process.hrtime.bigint();
const steps = [
  ['node', ['tools/clean-branch-check.mjs']],
  ['node', ['tools/purity-check.mjs']],
  ['npm', ['run', 'typecheck']],
  ['npm', ['test']],
];
for (const [cmd, args] of steps) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`gate: failed at ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}
const seconds = Number(process.hrtime.bigint() - start) / 1e9;
console.log(`gate: ${seconds.toFixed(1)}s`);
