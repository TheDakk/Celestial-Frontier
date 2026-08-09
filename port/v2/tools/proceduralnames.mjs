/* proceduralnames.mjs — one checked identity bridge for procedural art.

   The audit/export, art lock, and strip renderer deliberately use three names
   for the same generated creature. Consumers must use this bridge instead of
   re-deriving the join (D-ART-147/D-ART-155):

     full   fauna-h0-s1       — gold-pass/baseline identity
     drift  f0·1#1            — art-lock key without "procedural|"
     render proc:fauna:h0:s1  — audit strip request

   Usage: node tools/proceduralnames.mjs --selftest
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_ROWS = 240;
const KINGDOMS = ['fauna', 'flora', 'fungi', 'microbe'];

function assert(condition, message) {
  if (!condition) throw new Error(`procedural-name bridge: ${message}`);
}

export function buildProceduralNameBridge(rows) {
  assert(Array.isArray(rows), 'map must be an array');
  assert(rows.length === EXPECTED_ROWS,
    `expected ${EXPECTED_ROWS} rows, got ${rows.length}`);

  const byFull = new Map();
  const byDrift = new Map();
  const byRender = new Map();
  for (let offset = 0; offset < rows.length; offset++) {
    const row = rows[offset];
    const where = `row ${offset + 1}`;
    assert(row && typeof row === 'object' && !Array.isArray(row), `${where} must be an object`);
    assert(KINGDOMS.includes(row.kingdom), `${where} has invalid kingdom ${JSON.stringify(row.kingdom)}`);
    assert(Number.isInteger(row.heat) && row.heat >= 0 && row.heat <= 2,
      `${where} has invalid heat ${JSON.stringify(row.heat)}`);
    assert(Number.isInteger(row.seed) && row.seed >= 0 && row.seed < 20,
      `${where} has invalid seed ${JSON.stringify(row.seed)}`);
    assert(Number.isInteger(row.index) && row.index === offset,
      `${where} index must be ${offset}, got ${JSON.stringify(row.index)}`);

    const kingdomIndex = KINGDOMS.indexOf(row.kingdom);
    const expectedIndex = kingdomIndex * 60 + row.heat * 20 + row.seed;
    const expectedFull = `${row.kingdom}-h${row.heat}-s${row.seed}`;
    const expectedCell = `${row.kingdom[0]}${row.heat}·${row.seed}`;
    const expectedLock = `procedural|${expectedCell}#${expectedIndex}`;
    const render = `proc:${row.kingdom}:h${row.heat}:s${row.seed}`;
    assert(row.index === expectedIndex, `${where} formula index mismatch`);
    assert(row.full === expectedFull,
      `${where} full name mismatch; expected ${expectedFull}, got ${JSON.stringify(row.full)}`);
    assert(row.cell === expectedCell,
      `${where} cell name mismatch; expected ${expectedCell}, got ${JSON.stringify(row.cell)}`);
    assert(row.lockKey === expectedLock,
      `${where} lock key mismatch; expected ${expectedLock}, got ${JSON.stringify(row.lockKey)}`);

    const drift = row.lockKey.slice('procedural|'.length);
    assert(!byFull.has(row.full), `${where} duplicates full name ${row.full}`);
    assert(!byDrift.has(drift), `${where} duplicates drift name ${drift}`);
    assert(!byRender.has(render), `${where} duplicates render name ${render}`);
    const identity = Object.freeze({ ...row, drift, render });
    byFull.set(row.full, identity);
    byDrift.set(drift, identity);
    byRender.set(render, identity);
  }

  function requireIdentity(name) {
    const hit = byFull.get(name) || byDrift.get(name) || byRender.get(name);
    assert(hit, `unmapped procedural identity ${JSON.stringify(name)}`);
    return hit;
  }

  return Object.freeze({
    size: rows.length,
    identity(name) { return requireIdentity(name); },
    renderName(set, name) { return set === 'procedural' ? requireIdentity(name).render : name; },
    canonicalName(set, name) { return set === 'procedural' ? requireIdentity(name).full : name; },
    canonicalAny(name) {
      const hit = byFull.get(name) || byDrift.get(name) || byRender.get(name);
      return hit ? hit.full : name;
    },
  });
}

export function loadProceduralNameBridge(root) {
  const file = path.join(root, 'reference', 'procedural-name-map.json');
  return buildProceduralNameBridge(JSON.parse(fs.readFileSync(file, 'utf8')));
}

function expectRejected(label, fn, pattern) {
  let error = null;
  try { fn(); } catch (caught) { error = caught; }
  assert(error, `SELFTEST ${label} accepted the injected failure`);
  assert(pattern.test(error.message), `SELFTEST ${label} failed for the wrong reason: ${error.message}`);
}

function runSelftest() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.join(here, '..');
  const rows = JSON.parse(fs.readFileSync(path.join(root, 'reference', 'procedural-name-map.json'), 'utf8'));
  const good = buildProceduralNameBridge(rows);
  assert(good.renderName('procedural', 'f0·1#121') === 'proc:fungi:h0:s1',
    'SELFTEST positive drift-to-render join failed');
  assert(good.canonicalAny('proc:fungi:h0:s1') === 'fungi-h0-s1',
    'SELFTEST positive render-to-baseline join failed');

  expectRejected('missing row', () => buildProceduralNameBridge(rows.slice(0, -1)), /expected 240 rows/);
  expectRejected('altered join formula', () => {
    const broken = JSON.parse(JSON.stringify(rows));
    broken[121].lockKey = 'procedural|f0·1#120';
    buildProceduralNameBridge(broken);
  }, /lock key mismatch/);
  expectRejected('unmapped drift name', () => good.renderName('procedural', 'f9·99#999'), /unmapped procedural identity/);

  console.log('PROCEDURAL NAME BRIDGE SELFTEST PASS');
  console.log('  live 240-row bridge: PASS');
  console.log('  drift -> render -> baseline identities: PASS');
  console.log('  missing row: rejected');
  console.log('  altered join formula: rejected');
  console.log('  unmapped procedural identity: rejected');
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  if (process.argv.length === 3 && process.argv[2] === '--selftest') runSelftest();
  else {
    console.error('usage: node tools/proceduralnames.mjs --selftest');
    process.exitCode = 2;
  }
}
