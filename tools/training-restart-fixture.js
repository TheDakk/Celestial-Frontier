/* Genuine v1.8.9 Field Training restart-checkpoint capture.
 *
 * This is the tracked, repo-relative driver for
 * port/baseline-v1.8.9/training-restart-fixture.json. It seeds the existing
 * veteran_rich load-path fixture, boots the real legacy document through the
 * shared jsdom probe realm, and drives the real Settings -> Restart controls.
 *
 * Usage:
 *   node tools/training-restart-fixture.js --capture  # print candidate JSON
 *   node tools/training-restart-fixture.js --check    # compare live capture
 *
 * Never replace the sealed fixture merely to make --check pass. A mismatch is
 * a legacy-source, fixture-source, harness, action-path, or capture regression
 * that must be diagnosed first. This tool never writes the fixture itself.
 */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { bootProbe, root } = require('./_probeboot.js');

const BASELINE_DIR = path.join(root, 'port', 'baseline-v1.8.9');
const SAVE_FIXTURES_FILE = path.join(BASELINE_DIR, 'save-fixtures.json');
const OUTPUT_FILE = path.join(BASELINE_DIR, 'training-restart-fixture.json');
const GAME_HTML_FILE = path.join(root, 'celestial-frontier.html');
const PROBE_HARNESS_FILE = path.join(root, 'tools', '_probeboot.js');
const CAPTURE_DRIVER_FILE = __filename;
const SAVE_KEY = 'cfcc_save_v2';
const FIXTURE_NAME = 'veteran_rich';
const LEGACY_KEYS = Object.freeze(['st', 'ps', 'ac', 'es', 'c', 'ca', 'cx', 'it', 'eq', 'ea', 'e']);
const ACTION_PATH = Object.freeze([
  'Seed localStorage cfcc_save_v2 with JSON.stringify(inputs.veteran_rich)',
  'Boot the real v1.8.9 document through tools/_probeboot.js',
  'Click #setbtn',
  'Click #retrainopt twice through the real legacy handler',
  'Read JSON.parse(localStorage.cfcc_save_v2).tsnap',
]);
const WALL_CLOCK_SENTINEL = '<capture-wall-clock-ms>';

const mode = process.argv[2];
if ((mode !== '--capture' && mode !== '--check') || process.argv.length !== 3) {
  console.error('usage: node tools/training-restart-fixture.js --capture | --check');
  process.exit(2);
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function requireControl(window, selector) {
  const control = window.document.querySelector(selector);
  if (!control) throw new Error('capture action control missing: ' + selector);
  return control;
}

function readStored(window) {
  const raw = window.localStorage.getItem(SAVE_KEY);
  if (!raw) throw new Error('capture save is missing from localStorage');
  return JSON.parse(raw);
}

function settledSaveManifest(stored) {
  /* The legacy writer refreshes only top-level `at` from Date.now(). Replace
     that one wall-clock sample while retaining its key and every other byte.
     Hash both the complete saved envelope and the surrounding save with the
     independently pinned `tsnap` removed: the latter is the authority for
     which fields the eleven-key checkpoint did not own. */
  if (!Object.prototype.hasOwnProperty.call(stored, 'at')
    || typeof stored.at !== 'number' || !Number.isFinite(stored.at)) {
    throw new Error('settled legacy save did not contain a finite top-level at stamp');
  }
  const normalized = JSON.parse(JSON.stringify(stored));
  normalized.at = WALL_CLOCK_SENTINEL;
  const completeJson = JSON.stringify(normalized);
  const surrounding = { ...normalized };
  delete surrounding.tsnap;
  const surroundingJson = JSON.stringify(surrounding);
  return {
    normalization: { topLevelAt: WALL_CLOCK_SENTINEL },
    topLevelKeyCount: Object.keys(normalized).length,
    normalizedJsonByteLength: Buffer.byteLength(completeJson),
    normalizedSha256: sha256(completeJson),
    surroundingTopLevelKeyCount: Object.keys(surrounding).length,
    normalizedSurroundingJsonByteLength: Buffer.byteLength(surroundingJson),
    normalizedSurroundingSha256: sha256(surroundingJson),
  };
}

async function waitForCheckpoint(window) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const stored = readStored(window);
    const snapshot = stored.tsnap;
    if (stored.tut === 0 && snapshot && typeof snapshot === 'object'
      && JSON.stringify(Object.keys(snapshot)) === JSON.stringify(LEGACY_KEYS)) {
      /* Require the serialized checkpoint to stay unchanged across the save
         debounce instead of sampling a transient pre-restart write. */
      const first = JSON.stringify(snapshot);
      await wait(500);
      const settled = readStored(window);
      if (settled.tut === 0 && JSON.stringify(settled.tsnap) === first) return settled;
    }
    await wait(50);
  }
  throw new Error('timed out waiting for a stable eleven-key Training checkpoint');
}

async function capture() {
  const fixtureFileBytes = fs.readFileSync(SAVE_FIXTURES_FILE);
  const fixtures = JSON.parse(fixtureFileBytes.toString('utf8'));
  if (fixtures.capturedAgainst !== 'v1.8.9') {
    throw new Error('save-fixture source is not the sealed v1.8.9 capture');
  }
  const sourceFixture = fixtures.inputs && fixtures.inputs[FIXTURE_NAME];
  if (!sourceFixture) throw new Error('save fixture missing: ' + FIXTURE_NAME);
  const sourceFixtureJson = JSON.stringify(sourceFixture);
  const { window, errors } = await bootProbe({
    probe: 'savefixtures-probe.js',
    global: '__SAVEFX__',
    quiet: true,
    url: 'https://game.local/celestial-frontier.html',
    beforeBoot: (target) => target.localStorage.setItem(SAVE_KEY, sourceFixtureJson),
  });

  try {
    if (errors.length) throw new Error('legacy probe errors: ' + JSON.stringify(errors));
    requireControl(window, '#setbtn').click();
    const restart = requireControl(window, '#retrainopt');
    restart.click();
    restart.click();
    const stored = await waitForCheckpoint(window);
    if (errors.length) throw new Error('legacy probe errors: ' + JSON.stringify(errors));

    const snapshotJson = JSON.stringify(stored.tsnap);
    return {
      _comment: 'Genuine v1.8.9 Field Training restart checkpoint captured by driving the shipped controls; this is not the older synthetic tut_midtraining save fixture.',
      captureSchema: 'cf-v1.8.9-training-restart-capture/v1',
      capturedAgainst: 'v1.8.9',
      source: {
        fixtureFile: 'save-fixtures.json',
        fixtureName: FIXTURE_NAME,
        fixtureJsonByteLength: Buffer.byteLength(sourceFixtureJson),
        fixtureJsonSha256: sha256(sourceFixtureJson),
        fixtureFileSha256: sha256(fixtureFileBytes),
        gameHtmlFile: '../../celestial-frontier.html',
        gameHtmlSha256: sha256(fs.readFileSync(GAME_HTML_FILE)),
        probeHarnessFile: '../../tools/_probeboot.js',
        probeHarnessSha256: sha256(fs.readFileSync(PROBE_HARNESS_FILE)),
        captureDriverFile: '../../tools/training-restart-fixture.js',
        captureDriverSha256: sha256(fs.readFileSync(CAPTURE_DRIVER_FILE)),
        actionPath: [...ACTION_PATH],
      },
      observedErrors: [],
      observedTut: stored.tut,
      settledSave: settledSaveManifest(stored),
      snapshotJsonByteLength: Buffer.byteLength(snapshotJson),
      snapshotSha256: sha256(snapshotJson),
      snapshot: stored.tsnap,
    };
  } finally {
    window.close();
  }
}

(async () => {
  const observed = await capture();
  if (mode === '--capture') {
    process.stdout.write(JSON.stringify(observed, null, 2) + '\n');
    return;
  }
  const expected = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  if (JSON.stringify(observed) !== JSON.stringify(expected)) {
    console.error('TRAINING RESTART FIXTURE MISMATCH');
    console.error('Run --capture only for diagnosis; do not overwrite the sealed fixture without review.');
    process.exitCode = 1;
    return;
  }
  console.log('TRAINING RESTART FIXTURE PASS — action-derived checkpoint and provenance match');
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
