// Mutation controls for the C13 pin tests: each mutant must turn the suite red; the restored source must be green.
import fs from 'node:fs'; import { spawnSync } from 'node:child_process';
const W = new URL('../../port/v2/', import.meta.url).pathname; // run: node audits/C13_PIN_GENERATOR_20260925/mutation-controls.mjs [test] [wiring]
const run = (file) => { const r = spawnSync('npx', ['vitest', 'run', file], { cwd: W, encoding: 'utf8' }); return /Tests\s+\d+ passed/.test(r.stdout) && !/failed/.test(r.stdout) ? 'GREEN' : 'RED'; };
const mutants = process.argv[3] === 'wiring' ? [
  ['apps/game/src/battle2-wiring.ts', "const pin = getBattle2MasterPin(manifest.creatureId);", "await assets.bytes(auditAssetPath(repoRelativeSource(String((record as { source?: unknown }).source)))); const pin = getBattle2MasterPin(manifest.creatureId);", 'master fetched before the preflight'],
  ['apps/game/src/battle2-wiring.ts', "if (!pin) throw new Battle2PinRefusal('missing-pin'", "if (!pin && false) throw new Battle2PinRefusal('missing-pin'", 'missing pin not refused'],
  ['apps/game/src/battle2-wiring.ts', "const [alphaBytes, bindingTransport, atlas] = await Promise.all([", "await assets.image(alphaAsset); const [alphaBytes, bindingTransport, atlas] = await Promise.all([", 'alpha decoded before the preflight'],
] : [
  ['apps/game/src/battle2-master-pin-admission.ts', 'if (!isBattle2MasterPin(input.pin)) return refuse', 'if (false) return refuse', 'identity check removed'],
  ['apps/game/src/battle2-master-pin-admission.ts', 'if (await hashBytes(input.alpha) !== pin.alphaSha256)', 'if (false)', 'alpha hash removed'],
  ['apps/game/src/battle2-master-pin-admission.ts', "if (await hashBytes(input.bindingBytes) !== pin.bindingSha256)", 'if (false)', 'binding hash removed'],
  ['apps/game/src/battle2-master-pins.generated.ts', 'export function getBattle2MasterPin', 'export const LEAK = BY_ID;\nexport function getBattle2MasterPin', 'mutable map exported'],
  ['apps/game/src/battle2-master-pins.generated.ts', 'return typeof value === \'object\' && value !== null && AUTHORITY.has(value);', "return typeof value === 'object' && value !== null && typeof (value as { creatureId?: unknown }).creatureId === 'string';", 'structural authority'],
  ['tools/morph/battle2-pin-contract.mjs', "if (segments.some((s) => s === '' || s === '.' || s === '..')) return null;", '', 'dot segments allowed'],
];
const test = process.argv[2] ?? 'apps/game/src/battle2-master-pins.test.ts';
for (const [file, from, to, name] of mutants) { const p = W + file, orig = fs.readFileSync(p, 'utf8'); if (orig.split(from).length !== 2) { console.log('NO MATCH', name); continue; }
  fs.writeFileSync(p, orig.replace(from, to)); try { console.log(run(test) === 'RED' ? 'killed  ' : 'SURVIVED', name); } finally { fs.writeFileSync(p, orig); } }
console.log('restored:', run(test));
