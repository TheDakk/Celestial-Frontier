/* gp7collect.mjs — validate and collect the GP7 strip verdicts.

   The strip indexes are the authority on packet order and exact species names.
   This collector fails closed on any missing/misaligned verdict instead of
   letting a partial judge run become a plausible-looking measurement.

   Usage:
     node tools/gp7collect.mjs
     node tools/gp7collect.mjs --selftest
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProceduralNameBridge } from './proceduralnames.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const verdictDir = path.join(root, 'apps', 'game', 'smoke', 'gp7-verdicts');
const LEGAL_BANDS = new Set(['FAIL', 'POLISH', 'PASS']);
const INDEPENDENT_DRIFT_INDICES = new Set([4, 5, 6, 8, 9]);
const proceduralNames = loadProceduralNameBridge(root);

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function portable(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function verdictFilename(set, index) {
  const suffix = set === 'drift' && INDEPENDENT_DRIFT_INDICES.has(index)
    ? '-independent'
    : '';
  return `${set}-${String(index).padStart(3, '0')}${suffix}.json`;
}

function validateIndex(indexData, set, label) {
  assert(Array.isArray(indexData), `${label}: index must be an array`);
  assert(indexData.length > 0, `${label}: index must not be empty`);

  const names = new Set();
  for (let packetIndex = 0; packetIndex < indexData.length; packetIndex++) {
    const packet = indexData[packetIndex];
    const where = `${label} packet ${packetIndex + 1}`;
    assert(packet && typeof packet === 'object' && !Array.isArray(packet),
      `${where}: packet must be an object`);
    assert(typeof packet.family === 'string' && packet.family.trim(),
      `${where}: family must be a nonempty string`);
    assert(Array.isArray(packet.species) && packet.species.length > 0,
      `${where}: species must be a nonempty array`);

    for (let rowIndex = 0; rowIndex < packet.species.length; rowIndex++) {
      const species = packet.species[rowIndex];
      const rowWhere = `${where} species ${rowIndex + 1}`;
      assert(species && typeof species === 'object' && !Array.isArray(species),
        `${rowWhere}: entry must be an object`);
      assert(typeof species.name === 'string' && species.name.trim(),
        `${rowWhere}: name must be a nonempty string`);
      assert(typeof species.set === 'string' && species.set.trim(),
        `${rowWhere}: source set must be a nonempty string`);
      assert(!names.has(species.name),
        `${label}: duplicate species in index: ${JSON.stringify(species.name)}`);
      names.add(species.name);
    }
  }

  return names.size;
}

function validateVerdict(verdict, expected, sourceFile, globalNames) {
  const where = sourceFile;
  assert(verdict && typeof verdict === 'object' && !Array.isArray(verdict),
    `${where}: verdict must be an object`);
  assert(verdict.set === expected.set,
    `${where}: set mismatch; expected ${JSON.stringify(expected.set)}, got ${JSON.stringify(verdict.set)}`);
  assert(verdict.index === expected.index,
    `${where}: index mismatch; expected ${expected.index}, got ${JSON.stringify(verdict.index)}`);
  assert(verdict.family === expected.packet.family,
    `${where}: family mismatch; expected ${JSON.stringify(expected.packet.family)}, got ${JSON.stringify(verdict.family)}`);
  assert(Array.isArray(verdict.rows), `${where}: rows must be an array`);
  assert(verdict.rows.length === expected.packet.species.length,
    `${where}: row count mismatch; expected ${expected.packet.species.length}, got ${verdict.rows.length}`);

  /* Detect duplicates before the positional join so a copied row reports its
     real cause, not merely the first downstream name mismatch. */
  const packetNames = new Set();
  for (let rowIndex = 0; rowIndex < verdict.rows.length; rowIndex++) {
    const row = verdict.rows[rowIndex];
    const rowWhere = `${where} row ${rowIndex + 1}`;
    assert(row && typeof row === 'object' && !Array.isArray(row),
      `${rowWhere}: row must be an object`);
    assert(typeof row.species === 'string' && row.species.length > 0,
      `${rowWhere}: species must be a nonempty string`);
    assert(!packetNames.has(row.species),
      `${where}: duplicate species in verdict: ${JSON.stringify(row.species)}`);
    packetNames.add(row.species);
  }

  const collected = [];
  for (let rowIndex = 0; rowIndex < verdict.rows.length; rowIndex++) {
    const row = verdict.rows[rowIndex];
    const expectedName = expected.packet.species[rowIndex].name;
    const rowWhere = `${where} row ${rowIndex + 1}`;
    assert(row.species === expectedName,
      `${rowWhere}: species order/case mismatch; expected ${JSON.stringify(expectedName)}, got ${JSON.stringify(row.species)}`);
    assert(LEGAL_BANDS.has(row.band),
      `${rowWhere}: invalid band ${JSON.stringify(row.band)}; expected FAIL, POLISH, or PASS`);
    assert(typeof row.why === 'string' && row.why.trim().length > 0,
      `${rowWhere}: why must be a nonempty reason`);
    assert(!globalNames.has(row.species),
      `${where}: duplicate species across verdicts: ${JSON.stringify(row.species)}`);
    globalNames.add(row.species);
    const set = expected.packet.species[rowIndex].set;
    const canonical = proceduralNames.canonicalName(set, row.species);
    collected.push({
      species: canonical,
      ...(canonical === row.species ? {} : { sourceSpecies: row.species }),
      band: row.band,
      why: row.why.trim(),
    });
  }
  return collected;
}

function collectSet({ set, indexData, indexSource, readVerdict }) {
  assert(set === 'drift' || set === 'control', `unsupported set: ${JSON.stringify(set)}`);
  const expectedRows = validateIndex(indexData, set, indexSource);
  const rows = [];
  const selectedVerdictFiles = [];
  const globalNames = new Set();

  for (let offset = 0; offset < indexData.length; offset++) {
    const index = offset + 1;
    const filename = verdictFilename(set, index);
    let verdict;
    try {
      verdict = readVerdict(filename);
    } catch (error) {
      fail(`${filename}: expected verdict is missing or unreadable (${error.message})`);
    }
    assert(verdict !== undefined && verdict !== null,
      `${filename}: expected verdict is missing`);
    rows.push(...validateVerdict(verdict, {
      set,
      index,
      packet: indexData[offset],
    }, filename, globalNames));
    selectedVerdictFiles.push(filename);
  }

  assert(rows.length === expectedRows,
    `${set}: collected row count mismatch; expected ${expectedRows}, got ${rows.length}`);

  const independentFiles = selectedVerdictFiles.filter((filename) => filename.includes('-independent.json'));
  const independentNote = set === 'drift'
    ? ` Independent verdicts were selected for drift indices ${[...INDEPENDENT_DRIFT_INDICES].join(', ')}.`
    : '';
  return {
    generated: `gp7 ${set} re-judge COMPLETE (${indexData.length} validated verdict files, ${rows.length} exact-joined rows).${independentNote}`,
    provenance: {
      index: portable(indexSource),
      verdictDirectory: 'apps/game/smoke/gp7-verdicts',
      selectedVerdictFiles,
      independentVerdictPreference: set === 'drift'
        ? {
            indices: [...INDEPENDENT_DRIFT_INDICES],
            selectedFiles: independentFiles,
            note: 'These independent verdicts supersede the same-index non-independent files.',
          }
        : null,
    },
    rows,
  };
}

function readJson(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    fail(`${portable(path.relative(root, file))}: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${portable(path.relative(root, file))}: invalid JSON (${error.message})`);
  }
}

function collectDiskSet(set) {
  const indexRelative = set === 'drift'
    ? 'apps/game/smoke/rejudge/index.json'
    : 'apps/game/smoke/rejudge-control/index.json';
  const indexFile = path.join(root, ...indexRelative.split('/'));
  return collectSet({
    set,
    indexData: readJson(indexFile),
    indexSource: indexRelative,
    readVerdict(filename) {
      const file = path.join(verdictDir, filename);
      if (!fs.existsSync(file)) fail('file does not exist');
      return readJson(file);
    },
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeSelftestFixture() {
  const indexData = [];
  const verdicts = new Map();
  for (let index = 1; index <= 9; index++) {
    const packet = {
      family: `Fixture Family ${index}`,
      id: String(index).padStart(2, '0'),
      species: [
        { name: `Fixture ${index} Alpha`, set: 'earth-fauna', was: 'FAIL' },
        { name: `Fixture ${index} Beta`, set: 'earth-fauna', was: 'POLISH' },
      ],
    };
    indexData.push(packet);
    const ordinary = {
      set: 'drift', index, family: packet.family,
      rows: packet.species.map((species) => ({
        species: species.name,
        band: 'FAIL',
        why: `Ordinary fixture reason for ${species.name}.`,
      })),
    };
    verdicts.set(`drift-${String(index).padStart(3, '0')}.json`, ordinary);
    if (INDEPENDENT_DRIFT_INDICES.has(index)) {
      const independent = clone(ordinary);
      for (const row of independent.rows) {
        row.band = 'PASS';
        row.why = `Independent fixture reason for ${row.species}.`;
      }
      verdicts.set(`drift-${String(index).padStart(3, '0')}-independent.json`, independent);
    }
  }
  return { indexData, verdicts };
}

function collectSelftestFixture(fixture) {
  return collectSet({
    set: 'drift',
    indexData: fixture.indexData,
    indexSource: 'memory/selftest-index.json',
    readVerdict(filename) {
      if (!fixture.verdicts.has(filename)) fail('in-memory file does not exist');
      return fixture.verdicts.get(filename);
    },
  });
}

function expectRejected(name, mutate, expectedMessage) {
  const fixture = makeSelftestFixture();
  const landed = mutate(fixture);
  assert(landed === true, `SELFTEST ${name}: injected perturbation did not land`);
  let caught = null;
  try {
    collectSelftestFixture(fixture);
  } catch (error) {
    caught = error;
  }
  assert(caught, `SELFTEST ${name}: collector accepted the injected failure`);
  assert(expectedMessage.test(caught.message),
    `SELFTEST ${name}: rejected for the wrong reason: ${caught.message}`);
}

function runSelftest() {
  const good = collectSelftestFixture(makeSelftestFixture());
  assert(good.rows.length === 18, 'SELFTEST pass: expected 18 collected rows');
  assert(good.rows.find((row) => row.species === 'Fixture 4 Alpha')?.band === 'PASS',
    'SELFTEST pass: independent drift verdict was not preferred');
  assert(good.provenance.independentVerdictPreference.selectedFiles.length === 5,
    'SELFTEST pass: expected five independent provenance files');

  expectRejected('missing row', (fixture) => {
    const file = fixture.verdicts.get('drift-001.json');
    const before = file.rows.length;
    file.rows.pop();
    return before === 2 && file.rows.length === 1;
  }, /row count mismatch/);

  expectRejected('reordered name', (fixture) => {
    const file = fixture.verdicts.get('drift-001.json');
    const before = file.rows.map((row) => row.species);
    [file.rows[0], file.rows[1]] = [file.rows[1], file.rows[0]];
    return file.rows[0].species === before[1] && file.rows[1].species === before[0];
  }, /species order\/case mismatch/);

  expectRejected('invalid band', (fixture) => {
    const row = fixture.verdicts.get('drift-001.json').rows[0];
    row.band = 'GOLD';
    return row.band === 'GOLD';
  }, /invalid band/);

  expectRejected('duplicate species', (fixture) => {
    const rows = fixture.verdicts.get('drift-001.json').rows;
    rows[1].species = rows[0].species;
    return rows[1].species === rows[0].species;
  }, /duplicate species in verdict/);

  expectRejected('missing verdict file', (fixture) => {
    return fixture.verdicts.delete('drift-003.json');
  }, /expected verdict is missing or unreadable/);

  console.log('GP7 COLLECTOR SELFTEST PASS');
  console.log('  positive collection + independent preference: PASS');
  console.log('  missing row: rejected');
  console.log('  reordered name/case: rejected');
  console.log('  invalid band: rejected');
  console.log('  duplicate species: rejected');
  console.log('  missing expected verdict file: rejected');
}

function tally(rows) {
  const bands = { FAIL: 0, POLISH: 0, PASS: 0 };
  for (const row of rows) bands[row.band]++;
  return bands;
}

function formatTally(label, result) {
  const bands = tally(result.rows);
  return `${label.padEnd(9)} ${String(result.rows.length).padStart(3)} rows · `
    + `FAIL ${String(bands.FAIL).padStart(3)} · POLISH ${String(bands.POLISH).padStart(3)} · PASS ${String(bands.PASS).padStart(3)}`;
}

function run() {
  const args = process.argv.slice(2);
  for (const argument of args) {
    assert(argument === '--selftest', `unknown argument: ${argument}`);
  }
  if (args.includes('--selftest')) {
    runSelftest();
    return;
  }

  /* Validate both sets completely before writing either output. */
  const drift = collectDiskSet('drift');
  const control = collectDiskSet('control');
  const driftOut = path.join(root, 'reference', 'goldpass7-rejudge.json');
  const controlOut = path.join(root, 'reference', 'goldpass7-control.json');
  fs.writeFileSync(driftOut, JSON.stringify(drift, null, 1) + '\n');
  fs.writeFileSync(controlOut, JSON.stringify(control, null, 1) + '\n');

  console.log('GP7 VERDICT COLLECTION PASS');
  console.log('  ' + formatTally('drift', drift));
  console.log('  ' + formatTally('control', control));
  console.log('  independent drift verdicts selected: '
    + drift.provenance.independentVerdictPreference.selectedFiles.join(', '));
  console.log('  wrote ' + portable(path.relative(root, driftOut)));
  console.log('  wrote ' + portable(path.relative(root, controlOut)));
}

try {
  run();
} catch (error) {
  console.error('GP7 VERDICT COLLECTION FAILED');
  console.error('  ' + error.message);
  process.exitCode = 1;
}
