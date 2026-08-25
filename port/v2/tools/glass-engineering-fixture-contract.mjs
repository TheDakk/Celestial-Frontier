import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, '..', '..', 'baseline-v1.8.9', 'save-fixtures.json');

export const GLASS_VETERAN_ORPHAN_MINE_X = Object.freeze([Object.freeze([201, 4])]);
export const GLASS_VETERAN_ORPHAN_MINED = Object.freeze([Object.freeze([201, 1_753_898_800_000])]);
export const GLASS_VETERAN_SOL_SKIM_X = Object.freeze([Object.freeze([424242, 2])]);
export const GLASS_VETERAN_EARTH_WHERE = Object.freeze({
  type: 'planet',
  gal: Object.freeze({
    x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, seed: 999, home: true,
  }),
  star: Object.freeze({ x: 560, y: 170, seed: 424242 }),
  pseed: 133,
});

const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

function sourceFixture() {
  const parsed = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const fixture = parsed?.inputs?.veteran_rich;
  const earthRows = Array.isArray(fixture?.log)
    ? fixture.log.filter((entry) => entry?.id === 'p133') : [];
  if (!fixture || typeof fixture !== 'object' || Array.isArray(fixture)
    || !exact(fixture.mx, GLASS_VETERAN_ORPHAN_MINE_X)
    || !exact(fixture.minedw, GLASS_VETERAN_ORPHAN_MINED)
    || !exact(fixture.skx, GLASS_VETERAN_SOL_SKIM_X)
    || earthRows.length !== 1
    || !exact(earthRows[0]?.where, GLASS_VETERAN_EARTH_WHERE)) {
    throw new Error('Glass veteran Engineering source fixture drifted');
  }
  return fixture;
}

/** Build the exact legacy-v4 bytes consumed by Glass. Variants exist solely
 * for the real importer/bootstrap test; production Glass always imports the
 * `cleared` export below. No v5 carrier is fabricated by this contract. */
export function glassVeteranPreferenceRaw(variant = 'cleared') {
  if (!['original-orphan', 'mx-only', 'minedw-only', 'cleared'].includes(variant)) {
    throw new Error(`unknown Glass veteran fixture variant: ${JSON.stringify(variant)}`);
  }
  const fixture = sourceFixture();
  fixture.fs = 'fs-xl';
  fixture.tone = 'tone-max';
  fixture.font = 'font-mono';
  fixture.tut = 0;
  fixture.items = [...fixture.items, ['hazmat', 1], ['thermal', 1]];
  fixture.eq = { ...fixture.eq, suit: 'hazmat' };
  fixture.view = null;
  if (variant === 'mx-only' || variant === 'cleared') fixture.minedw = [];
  if (variant === 'minedw-only' || variant === 'cleared') fixture.mx = [];
  return JSON.stringify(fixture);
}

export const GLASS_VETERAN_PREF_RAW = glassVeteranPreferenceRaw('cleared');
export const GLASS_VETERAN_PREF_RAW_SHA256 = '3ea92b8b7fbb87357c1c275105fc1f520618aa9e8a14aeda11ad362e871311b0';

const preferenceRawSha256 = createHash('sha256').update(GLASS_VETERAN_PREF_RAW).digest('hex');
if (preferenceRawSha256 !== GLASS_VETERAN_PREF_RAW_SHA256) {
  throw new Error(`Glass veteran preference raw bytes drifted (${preferenceRawSha256})`);
}

/** Fixed source-bound oracle consumed by Glass. The focused Vitest owner
 * independently recreates every field through the real v4 importer, Arc 2
 * capability bridge, Arc 4 ownership migration, canonical full-roster owner,
 * acquisition compositor, and capture presentation projector. */
export const GLASS_VETERAN_CAPTURE_ORACLE = deepFreeze({
  schema: 'cf-v2-glass-veteran-capture-oracle/v1',
  preferenceRawSha256: GLASS_VETERAN_PREF_RAW_SHA256,
  title: 'Homeworld',
  worldKey: 'CF1|g:999@90,-60|s:424242@560,170|p:133#2',
  ecologyEpoch: 12,
  previewCount: 8,
  fullRosterCount: 21,
  fullRosterFingerprint: 'cwr1:21:6980:bc437ec6',
  contextKey: 'CF1|g:999@90,-60|s:424242@560,170|p:133#2|epoch:12|cwr1:21:6980:bc437ec6',
  contactCapturePoints: 0,
  biosphereYield: {
    yield: 16,
    used: 0,
    remaining: 16,
    cycle: 0,
  },
  odds: {
    tame: {
      eligibleCount: 9,
      overallChance: 0.43333333333333335,
      chanceMin: 0.36,
      chanceMax: 0.6,
    },
    scavenge: {
      eligibleCount: 9,
      overallChance: 0.7486666666666666,
      chanceMin: 0.576,
      chanceMax: 0.95,
    },
    sample: {
      eligibleCount: 3,
      overallChance: 0.7050000000000001,
      chanceMin: 0.54,
      chanceMax: 0.8999999999999999,
    },
  },
});

export function glassEngineeringFixtureOutcome(value) {
  const earthRows = Array.isArray(value?.log)
    ? value.log.filter((entry) => entry?.id === 'p133') : [];
  const checks = Object.freeze({
    legacyV4: !!value && typeof value === 'object' && !Array.isArray(value)
      && !Object.prototype.hasOwnProperty.call(value, 'format')
      && !Object.prototype.hasOwnProperty.call(value, 'extensions'),
    miningCursorCleared: Array.isArray(value?.mx) && value.mx.length === 0,
    miningClockCleared: Array.isArray(value?.minedw) && value.minedw.length === 0,
    solSkimRetained: exact(value?.skx, GLASS_VETERAN_SOL_SKIM_X),
    earthSourceRetained: earthRows.length === 1
      && exact(earthRows[0]?.where, GLASS_VETERAN_EARTH_WHERE),
    trainingSourceSeat: value?.view === null && value?.tut === 0,
  });
  const reasons = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  return Object.freeze({ ok: reasons.length === 0, checks, reasons: Object.freeze(reasons) });
}

const defaultOutcome = glassEngineeringFixtureOutcome(JSON.parse(GLASS_VETERAN_PREF_RAW));
if (!defaultOutcome.ok) {
  throw new Error(`Glass veteran Engineering fixture is incomplete (${defaultOutcome.reasons.join(', ')})`);
}
