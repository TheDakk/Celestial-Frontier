/* gliderreview.mjs — fail-closed evidence gate for the Platinum glider repair.

   This is deliberately narrower than the full-reset review workflow. It does
   not render, copy, label, score, or certify art. It accepts the sealed
   pre-edit GP7.1 evidence plus two clean captures of one post-edit commit and
   proves only the mechanical facts needed before a fresh human A/B review:

     node tools/gliderreview.mjs --verify \
       --baseline=<sealed-79ce144-evidence> \
       --current=<fresh-capture-a> --repeat=<fresh-capture-b> \
       --source-commit=<40-hex>
     node tools/gliderreview.mjs --selftest

   Targets must change, must be repeat-exact, and must not collapse into one
   another. Every bat plus same-owner rodent/quadruped controls must remain
   byte-exact. All three roots must carry the same six-field browser provenance.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_SETS,
  NATIVE_SIZE,
  assert,
  cmp,
  hashFile,
  isObject,
  loadEvidence,
  nonempty,
  readJson,
  rowKey,
  sourceFile,
} from './fullresetlayout.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const SEALED_BASELINE_COMMIT = '79ce14460998d653ee753e49e8f8016e754c82e4';
const PREPARATION_SCHEMA = 'cf.gp71.rejudge-preparation.v2';
const SET = 'earth-fauna';
const TARGETS = Object.freeze(['Sugar Glider', 'Flying Squirrel', 'Colugo']);
const CONTROL_GROUPS = Object.freeze({
  bats: Object.freeze(['Bat', 'Fruit Bat', 'Insect-Eating Bat', 'Vampire Bat']),
  'small-rodent-owner': Object.freeze(['Squirrel', 'Ground Squirrel', 'Chipmunk', 'Rabbit']),
  'quadruped-owner': Object.freeze(['Possum', 'Fur Seal', 'Sea Lion', 'Pangolin']),
});
const CONTROLS = Object.freeze(Object.values(CONTROL_GROUPS).flat());
const BROWSER_FIELDS = Object.freeze([
  'executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version',
]);

function exactKeys(value, expected, where) {
  assert(isObject(value), `${where}: must be an object`);
  const actual = Object.keys(value).sort(cmp);
  const wanted = [...expected].sort(cmp);
  assert(JSON.stringify(actual) === JSON.stringify(wanted),
    `${where}: keys must be exactly ${wanted.join(', ')}; got ${actual.join(', ')}`);
}
function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort(cmp).map((key) => [key, stableValue(value[key])]));
}
function stableJson(value) { return JSON.stringify(stableValue(value)); }
function exactHex(value, length, where) {
  const text = nonempty(value, where).toLowerCase();
  assert(new RegExp(`^[0-9a-f]{${length}}$`).test(text), `${where}: expected ${length}-hex`);
  return text;
}
function exactBrowser(raw, where) {
  exactKeys(raw, BROWSER_FIELDS, where);
  const result = {};
  for (const field of BROWSER_FIELDS) result[field] = nonempty(raw[field], `${where}.${field}`);
  const executable = result.executable;
  assert(!executable.includes('\\')
      && (path.posix.isAbsolute(executable) || /^[A-Za-z]:\//.test(executable))
      && path.posix.normalize(executable) === executable,
  `${where}.executable: expected a canonical portable absolute path`);
  return result;
}
function sameBrowser(actual, expected, where) {
  for (const field of BROWSER_FIELDS) {
    assert(actual[field] === expected[field], `${where}: browser provenance differs at ${field}`);
  }
}
function loadPreparation(evidence, label) {
  const file = sourceFile(path.join(evidence.root, 'preparation.json'), `${label} preparation`);
  const raw = readJson(file, `${label} preparation`);
  assert(isObject(raw) && raw.schema === PREPARATION_SCHEMA,
    `${label} preparation: expected schema ${PREPARATION_SCHEMA}`);
  assert(evidence.provenance.capture,
    `${label} preparation: evidence must carry capture provenance`);
  assert(stableJson(raw.capture_provenance) === stableJson(evidence.provenance.capture),
    `${label} preparation: capture provenance differs from evidence manifests`);
  const output = nonempty(raw.output, `${label} preparation.output`);
  assert(output === path.basename(evidence.root) && !output.includes('/') && !output.includes('\\'),
    `${label} preparation.output must equal its evidence-root basename`);
  return { file, sha256: hashFile(file), output, browser: exactBrowser(raw.browser, `${label} preparation browser`) };
}

function record(map, species, label) {
  const row = map.get(rowKey(SET, species));
  assert(row, `${label}: missing exact identity ${SET}/${species}`);
  assert(row.set === SET && row.species === species && row.renderName === species,
    `${label}: identity/render-name mismatch for ${SET}/${species}`);
  return row;
}
function verifyHashes(baseline, current, repeat) {
  const targetRows = [];
  for (const species of TARGETS) {
    const before = record(baseline, species, 'baseline');
    const after = record(current, species, 'current');
    const again = record(repeat, species, 'repeat');
    assert(before.sha256 !== after.sha256,
      `${species}: target is unchanged from sealed pre-edit baseline`);
    assert(after.sha256 === again.sha256,
      `${species}: repeat capture is not byte-exact`);
    targetRows.push({ species, baseline: before.sha256, current: after.sha256 });
  }
  const targetHashes = new Set(targetRows.map((row) => row.current));
  assert(targetHashes.size === TARGETS.length,
    'target collision: Sugar Glider, Flying Squirrel, and Colugo must have three distinct current hashes');

  const controlRows = [];
  for (const species of CONTROLS) {
    const before = record(baseline, species, 'baseline');
    const after = record(current, species, 'current');
    const again = record(repeat, species, 'repeat');
    assert(before.sha256 === after.sha256,
      `${species}: protected negative control drifted from sealed baseline`);
    assert(after.sha256 === again.sha256,
      `${species}: protected negative control is not repeat-exact`);
    assert(!targetHashes.has(after.sha256),
      `${species}: a repaired target collapsed onto a protected control`);
    controlRows.push({ species, sha256: after.sha256 });
  }
  return { targetRows, controlRows };
}

function sourceAnchors() {
  const mammal = fs.readFileSync(path.join(root, 'packages', 'art', 'src', 'mammaloverrides.ts'), 'utf8');
  const quad = fs.readFileSync(path.join(root, 'packages', 'art', 'src', 'quadrupedoverrides.ts'), 'utf8');
  const fauna2 = fs.readFileSync(path.join(root, 'packages', 'art', 'src', 'faunaoverrides2.ts'), 'utf8');
  const router = fs.readFileSync(path.join(root, 'packages', 'art', 'src', 'speciesoverrides.ts'), 'utf8');
  const once = (text, needle, where) => {
    const count = text.split(needle).length - 1;
    assert(count === 1, `${where}: expected one exact owner anchor, got ${count}`);
  };
  once(mammal, "gliderPlan: 'sugar-glider'", 'Sugar Glider spec');
  once(mammal, "gliderPlan: 'colugo'", 'Colugo spec');
  once(quad, "case 'sugar-glider': faunaSugarGlider(c, g, p0, spec); return;", 'Sugar Glider dispatcher');
  once(quad, "case 'colugo': faunaColugo(c, g, p0, spec); return;", 'Colugo dispatcher');
  once(fauna2, "'Flying Squirrel': (c, g, p, n) => flyingSquirrelGlider(c, g, p, n),", 'Flying Squirrel route');
  assert(!/\bpatagium\?:|spec\.patagium|pose\??:\s*[^\n;]*'glide'/.test(mammal + '\n' + quad),
    'legacy quadruped glider fallback remains reachable');
  assert(!/opts\.glide|\bglide\?:|\bglide:\s*true/.test(fauna2),
    'legacy small-rodent glider fallback remains reachable');
  for (const [species, route] of [
    ['Bat', "'fauna|Bat': (c, g, pp) => faunaBat(c, g, speciesHue(pp, '#4a423b'), 'Bat'),"],
    ['Insect-Eating Bat', "'fauna|Insect-Eating Bat': (c, g, pp) => faunaBat(c, g, pp, 'Insect-Eating Bat'),"],
    ['Fruit Bat', "'fauna|Fruit Bat': (c, g, pp) => faunaBat(c, g, speciesHue(pp, '#a1562a'), 'Fruit Bat'),"],
    ['Vampire Bat', "'fauna|Vampire Bat': (c, g, pp) => faunaBat(c, g, speciesHue(pp, '#7a5233'), 'Vampire Bat'),"],
  ]) once(router, route, `${species} protected route`);
}

function snapshot(evidence, preparation) {
  return stableJson({
    identityDigest: evidence.identityDigest,
    identityManifestSha256: evidence.identityManifestSha256,
    portraitManifestSha256: evidence.portraitManifestSha256,
    preparationSha256: preparation.sha256,
    provenance: evidence.provenance,
  });
}
function distinctEvidenceRoots(baseline, current, repeat) {
  const roots = new Set([baseline, current, repeat].map((value) => path.resolve(value)));
  assert(roots.size === 3, 'baseline, current, and repeat must be three distinct evidence roots');
}
function independentCaptureNames(current, repeat) {
  assert(current !== repeat,
    'current and repeat must be independently named captures, not copies of one preparation');
}
function parseArgs(argv) {
  const options = {};
  for (const arg of argv) {
    if (arg === '--verify') {
      assert(options.verify === undefined, 'duplicate --verify'); options.verify = true; continue;
    }
    if (arg === '--selftest') {
      assert(options.selftest === undefined, 'duplicate --selftest'); options.selftest = true; continue;
    }
    if (arg === '--help' || arg === '-h') { options.help = true; continue; }
    const match = /^--(baseline|current|repeat|source-commit)=(.+)$/.exec(arg);
    assert(match, `unknown or malformed argument ${JSON.stringify(arg)}`);
    const key = match[1].replace('-', '');
    assert(options[key] === undefined, `duplicate --${match[1]}`);
    options[key] = match[2];
  }
  return options;
}
function usage() {
  console.log('Usage: node tools/gliderreview.mjs --verify --baseline=<dir> --current=<dir> --repeat=<dir> --source-commit=<40-hex>');
  console.log('       node tools/gliderreview.mjs --selftest');
}

function fixtureMap(overrides = {}) {
  const all = [...TARGETS, ...CONTROLS];
  return new Map(all.filter((species) => overrides[species] !== null).map((species, index) => {
    const sha256 = overrides[species] ?? `${(index + 1).toString(16).padStart(64, '0')}`;
    return [rowKey(SET, species), { set: SET, species, renderName: species, sha256 }];
  }));
}
function expectRejected(label, fn, pattern) {
  let error = null;
  try { fn(); } catch (caught) { error = caught; }
  assert(error, `SELFTEST ${label}: mutation was accepted`);
  assert(pattern.test(error.message), `SELFTEST ${label}: wrong diagnosis (${error.message})`);
}
function runSelftest() {
  sourceAnchors();
  const baseline = fixtureMap();
  const currentOverrides = Object.fromEntries(TARGETS.map((species, index) => [species, `${(100 + index).toString(16).padStart(64, '0')}`]));
  const current = fixtureMap(currentOverrides);
  const repeat = fixtureMap(currentOverrides);
  verifyHashes(baseline, current, repeat);

  expectRejected('unchanged target', () => verifyHashes(baseline, fixtureMap({
    ...currentOverrides, 'Sugar Glider': record(baseline, 'Sugar Glider', 'fixture').sha256,
  }), repeat), /Sugar Glider.*unchanged/);
  expectRejected('target collision', () => {
    const collision = { ...currentOverrides, Colugo: currentOverrides['Flying Squirrel'] };
    verifyHashes(baseline, fixtureMap(collision), fixtureMap(collision));
  }, /target collision/);
  expectRejected('bat drift', () => {
    const drift = fixtureMap({ ...currentOverrides, Bat: 'a'.repeat(64) });
    verifyHashes(baseline, drift, drift);
  }, /Bat.*negative control drifted/);
  expectRejected('same-owner rodent drift', () => {
    const drift = fixtureMap({ ...currentOverrides, Squirrel: 'b'.repeat(64) });
    verifyHashes(baseline, drift, drift);
  }, /Squirrel.*negative control drifted/);
  expectRejected('repeat instability', () => verifyHashes(
    baseline, current, fixtureMap({ ...currentOverrides, Colugo: 'c'.repeat(64) }),
  ), /Colugo.*repeat capture/);
  expectRejected('missing identity', () => verifyHashes(
    baseline, fixtureMap({ ...currentOverrides, Rabbit: null }), repeat,
  ), /missing exact identity.*Rabbit/);
  expectRejected('target/control collapse', () => {
    const squirrelHash = record(baseline, 'Squirrel', 'fixture').sha256;
    const collapse = { ...currentOverrides, 'Sugar Glider': squirrelHash };
    verifyHashes(baseline, fixtureMap(collapse), fixtureMap(collapse));
  }, /collapsed onto a protected control/);
  const browser = {
    executable: '/fixture/browser', product: 'Fixture/1', revision: '@fixture',
    user_agent: 'Fixture UA', js_version: '1', protocol_version: '1.3',
  };
  sameBrowser(browser, { ...browser }, 'SELFTEST browser match');
  expectRejected('browser drift', () => sameBrowser(
    { ...browser, product: 'Fixture/2' }, browser, 'SELFTEST browser drift',
  ), /browser provenance differs at product/);
  distinctEvidenceRoots('/fixture/baseline', '/fixture/current-a', '/fixture/current-b');
  expectRejected('reused evidence root', () => distinctEvidenceRoots(
    '/fixture/baseline', '/fixture/current-a', '/fixture/current-a',
  ), /three distinct evidence roots/);
  independentCaptureNames('capture-a', 'capture-b');
  expectRejected('copied preparation identity', () => independentCaptureNames(
    'capture-a', 'capture-a',
  ), /independently named captures/);
  console.log('GLIDER REVIEW SELFTEST PASS');
  console.log('  positive target/control fixture: PASS');
  console.log('  unchanged/collision/identity/repeat mutations: REJECTED');
  console.log('  bat/same-owner/target-control mutations: REJECTED');
  console.log('  browser provenance mutation: REJECTED');
  console.log('  reused-root/copied-preparation mutations: REJECTED');
}

function loadBoundEvidence(options) {
  const commit = exactHex(options.sourcecommit, 40, '--source-commit');
  assert(commit !== SEALED_BASELINE_COMMIT,
    '--source-commit must be a post-edit commit, not the sealed baseline commit');
  const baseline = loadEvidence(options.baseline, 'sealed baseline', EXPECTED_SETS, NATIVE_SIZE, { mode: 'historical' });
  const current = loadEvidence(options.current, 'current capture', EXPECTED_SETS, NATIVE_SIZE, {
    mode: 'current', expectedCommit: commit,
  });
  const repeat = loadEvidence(options.repeat, 'repeat capture', EXPECTED_SETS, NATIVE_SIZE, {
    mode: 'current', expectedCommit: commit,
  });
  assert(baseline.provenance.status === 'historical_provenanced'
      && baseline.provenance.source_commit === SEALED_BASELINE_COMMIT,
  `sealed baseline must be provenance-bound to ${SEALED_BASELINE_COMMIT}`);
  distinctEvidenceRoots(baseline.root, current.root, repeat.root);
  return { commit, baseline, current, repeat };
}
function verify(options) {
  for (const key of ['baseline', 'current', 'repeat', 'sourcecommit']) {
    assert(options[key], `--verify requires --${key === 'sourcecommit' ? 'source-commit' : key}`);
  }
  sourceAnchors();
  const inputs = loadBoundEvidence(options);
  const baselinePreparation = loadPreparation(inputs.baseline, 'sealed baseline');
  const currentPreparation = loadPreparation(inputs.current, 'current capture');
  const repeatPreparation = loadPreparation(inputs.repeat, 'repeat capture');
  independentCaptureNames(currentPreparation.output, repeatPreparation.output);
  sameBrowser(currentPreparation.browser, baselinePreparation.browser, 'current versus sealed baseline');
  sameBrowser(repeatPreparation.browser, baselinePreparation.browser, 'repeat versus sealed baseline');
  const before = {
    baseline: snapshot(inputs.baseline, baselinePreparation),
    current: snapshot(inputs.current, currentPreparation),
    repeat: snapshot(inputs.repeat, repeatPreparation),
  };
  const result = verifyHashes(inputs.baseline.byKey, inputs.current.byKey, inputs.repeat.byKey);

  const afterInputs = loadBoundEvidence(options);
  const after = {
    baseline: snapshot(afterInputs.baseline, loadPreparation(afterInputs.baseline, 'sealed baseline postflight')),
    current: snapshot(afterInputs.current, loadPreparation(afterInputs.current, 'current capture postflight')),
    repeat: snapshot(afterInputs.repeat, loadPreparation(afterInputs.repeat, 'repeat capture postflight')),
  };
  assert(stableJson(after) === stableJson(before), 'evidence inputs changed during verification');

  console.log('GLIDER REVIEW EVIDENCE PASS');
  console.log(`  sealed baseline commit: ${SEALED_BASELINE_COMMIT}`);
  console.log(`  current/repeat commit: ${inputs.commit}`);
  console.log(`  browser: ${baselinePreparation.browser.product} (${baselinePreparation.browser.executable})`);
  for (const row of result.targetRows) console.log(`  CHANGED ${row.species}: ${row.baseline} -> ${row.current}`);
  for (const [group, species] of Object.entries(CONTROL_GROUPS)) {
    console.log(`  EXACT ${group}: ${species.join(', ')}`);
  }
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { usage(); return; }
  assert(Number(Boolean(options.verify)) + Number(Boolean(options.selftest)) === 1,
    'choose exactly one of --verify or --selftest');
  if (options.selftest) {
    assert(Object.keys(options).length === 1, '--selftest accepts no evidence arguments');
    runSelftest();
  } else verify(options);
}

const directInvocation = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (directInvocation) {
  try { run(); }
  catch (error) {
    console.error('GLIDER REVIEW FAILED');
    console.error(`  ${error.message}`);
    process.exitCode = 1;
  }
}

export { CONTROL_GROUPS, SEALED_BASELINE_COMMIT, TARGETS, verifyHashes };
