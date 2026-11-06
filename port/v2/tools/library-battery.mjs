#!/usr/bin/env node
/* D55 (Dakk 2026-11-04): the per-creature battle battery over EVERY delivered archetype (CF_V2_LIBRARY_ROSTER=all). Run once per
   delivery batch (`node tools/check-profile.mjs --profile=library`) and inside `production`. Three parts so each stays well
   under check-profile's 30-minute child limit as the library grows: the arena SCALE SWEEP, the other arena loops, the matchup
   stagings. The everyday dev/develop run of the same suites uses the bounded roster (apps/game/src/test-roster.fixtures.ts). */
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const V2_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const LIBRARY_BATTERY_PARTS = Object.freeze({
  sweep: Object.freeze(['apps/game/src/battle2/library-arena.test.ts', '-t', 'SCALE SWEEP']),
  arena: Object.freeze(['apps/game/src/battle2/library-arena.test.ts', '-t', '^(?!.*SCALE SWEEP)']),
  matchup: Object.freeze(['apps/game/src/battle2-matchup.test.ts']),
});
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const part = /^--part=(sweep|arena|matchup)$/.exec(process.argv[2] ?? '')?.[1];
  if (!part || process.argv.length !== 3) { console.error('usage: node tools/library-battery.mjs --part=sweep|arena|matchup'); process.exit(2); }
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vitest', 'run', ...LIBRARY_BATTERY_PARTS[part]], { cwd: V2_ROOT, stdio: 'inherit', env: { ...process.env, CF_V2_LIBRARY_ROSTER: 'all' } });
  console.log(`LIBRARY BATTERY: PASS (${part})`);
}
