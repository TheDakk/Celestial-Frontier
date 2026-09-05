import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable browser evidence contract intentionally has no declaration shim.
import * as arc4Contract from '../tools/arc4-browser-contract.mjs';

const {
  ARC4_PERTAR_FIXTURE,
  ARC4_PERTAR_DESCENT_LANDING,
  ARC4_PERTAR_DESCENT_DRAWS,
  ARC4_PERTAR_LEDGER_PREFIX_SELFTEST,
  ARC4_PERTAR_PROGRESSION_TAIL_SELFTEST,
  ARC4_PUBLICATION_PROGRESSION_SELFTEST,
  ARC4_CAPTURE_SETTLEMENT_SELFTEST,
} = arc4Contract;

type Assessment = Readonly<{
  ok: boolean;
  checks: Readonly<Record<string, boolean>>;
  reasons: readonly string[];
}>;

type PublicationAssessment = Assessment & Readonly<{
  convergenceReleaseDiagnostics: Assessment;
  publicationBoundary: Readonly<{
    beforeRevision: number;
    actionRevision: number;
    fixedPointRevision: number;
    beforeOrdinal: number;
    actionOrdinal: number;
    fixedPointOrdinal: number;
    actionDraws: Readonly<Record<string, number>>;
    fixedPointDraws: Readonly<Record<string, number>>;
  }>;
}>;

const sliceSource = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);

function section(source: string, start: string, end: string): string {
  expect(source.split(start)).toHaveLength(2);
  expect(source.split(end)).toHaveLength(2);
  const left = source.indexOf(start);
  const right = source.indexOf(end, left + start.length);
  expect(left).toBeGreaterThanOrEqual(0);
  expect(right).toBeGreaterThan(left);
  return source.slice(left, right);
}

const setupOwner = section(
  sliceSource,
  '  const assessArc4PertarFixtureSetup = ({ priorToken, sourceReady, sourceState,',
  '  const installArc4PertarFixture = async (label, raw = ARC4_PERTAR_RAW) => {',
);
const resetOwner = section(
  sliceSource,
  "  const arc4FirstFixture = await installArc4PertarFixture('Arc 4 Pertar seed-68 replacement');",
  '  const arc4TameAudioAssessment = classifyTameGreetingAudioEvidence(',
);
const tameVerdictOwner = section(
  sliceSource,
  '  const arc4TameAudioRehearsalChecks = {',
  '  const arc4FixtureSetupBundle = {',
);
const preconditionOwner = section(
  sliceSource,
  '  const arc4PreconditionBundle = {',
  '  const arc4HitHoldArmed = await evalIn(',
);
const sampleOwner = section(
  sliceSource,
  '  const arc4HitReleased = await evalIn(',
  '  const arc4StorageBeforeState = arc4HitState;',
);
const storageOwner = section(
  sliceSource,
  '  const arc4StorageBeforeState = arc4HitState;',
  "  const arc4StaleFaultKey = 'cf_slice_arc4_stale_fault_capture_v1';",
);
const pressOwner = section(
  sliceSource,
  '  const pressArc4Keyboard = async (verb) => {',
  '  const pressArc4SurveyDockKeyboard = async () => {',
);

function ordered(source: string, needles: readonly string[]): boolean {
  let cursor = -1;
  return needles.every((needle) => {
    const next = source.indexOf(needle, cursor + 1);
    if (next < 0) return false;
    cursor = next;
    return true;
  });
}

function storageRunnerContractPasses(storage: string, press: string): boolean {
  return press.includes('const dispatched = armed === true && target.ok === true')
    && press.includes('&& target.focus === true;')
    && press.includes("if (dispatched) await keyIn('Enter', 'Enter');")
    && press.includes('return { armed, target, dispatched };')
    && storage.includes("captureArc4StoragePhase('pre-arm')")
    && storage.includes("captureArc4StoragePhase('post-arm')")
    && storage.includes("captureArc4StoragePhase('post-press')")
    && storage.includes("captureArc4StoragePhase('deadline')")
    && storage.includes("arc4StorageTargetReady?.verb === 'tame'")
    && storage.includes('arc4StorageTargetReady?.focus === true')
    && storage.includes('arc4StoragePreArmCoordinator?.owner?.busy === false')
    && storage.includes('arc4StoragePreArm.state?.capture?.card?.pendingWork === 0')
    && storage.includes("failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: native Tame")
    && storage.includes('arc4StorageArmed === true')
    && storage.includes('arc4StoragePostArmCoordinator?.faultArmed?.storageFailure === true')
    && storage.includes("failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: storage-failure hook")
    && storage.includes('arc4StoragePress.dispatched !== true')
    && storage.includes("failSliceWithoutCascade('ARC 4 STORAGE ACTION:")
    && storage.includes('arc4StorageWaitError = String(cause?.message || cause);')
    && storage.includes('waitError: arc4StorageWaitError,')
    && storage.includes('captureErrors: arc4StorageCaptureErrors,')
    && storage.includes('snapshots: { preArm: arc4StoragePreArm, postArm: arc4StoragePostArm,')
    && storage.includes('postPress: arc4StoragePostPress, deadline: arc4StorageDeadline },')
    && !storage.includes('waitError: null, captureErrors: []')
    && ordered(storage, [
      "captureArc4StoragePhase('pre-arm')",
      'if (!Object.values(arc4StoragePreArmChecks).every(Boolean)) {',
      "failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: native Tame",
      'window.__CF_SLICE__.api.__smokeRejectNextArc4ActionStorage()',
      "captureArc4StoragePhase('post-arm')",
      'if (!Object.values(arc4StorageArmChecks).every(Boolean)) {',
      "failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: storage-failure hook",
      "const arc4StoragePress = await pressArc4Keyboard('tame');",
      "captureArc4StoragePhase('post-press')",
      'if (arc4StoragePress.armed !== true',
      "failSliceWithoutCascade('ARC 4 STORAGE ACTION:",
      "await waitDesktopValue('Arc 4 storage refusal'",
      'arc4StorageWaitError = String(cause?.message || cause);',
      "captureArc4StoragePhase('deadline')",
      'if (arc4StorageTerminalFailure !== null) {',
      'failSliceWithoutCascade(arc4StorageTerminalFailure);',
      'const arc4StorageFaultControlState = structuredClone(arc4StorageState);',
      "failSliceWithoutCascade('ARC 4 STORAGE REFUSAL CONTROLS:",
    ]);
}

function runnerContractPasses(owners: {
  setup: string;
  reset: string;
  tame: string;
  precondition: string;
  sample: string;
  storage: string;
  press: string;
}): boolean {
  const setupCalls = owners.setup.match(/assessArc4PertarLedgerPrefix\(\{/gu) ?? [];
  return setupCalls.length === 2
    && owners.setup.includes("phase: 'source-ready'")
    && owners.setup.includes("phase: 'action-ready'")
    && owners.setup.includes('sourceAuthorityPrefix: sourceLedgerPrefix.ok === true')
    && owners.setup.includes('actionAuthorityPrefix: actionLedgerPrefix.ok === true')
    && owners.setup.includes('=== wrongOrdinal?.rawBefore?.revision + 1')
    && owners.reset.includes('const arc4TameAudioResetLedger = assessArc4PertarLedgerPrefix({')
    && owners.reset.includes("phase: 'action-ready'")
    && owners.reset.includes('actionReadyLedger: arc4TameAudioResetLedger.ok === true')
    && owners.reset.includes('state: arc4FirstFixture.surface.state,')
    && owners.reset.includes("failSliceWithoutCascade('ARC 4 TAME GREETING AUDIO RESET:")
    && !owners.reset.includes('virginRngAndReceipts')
    && owners.tame.includes("failSliceWithoutCascade('ARC 4 TAME GREETING AUDIO:")
    && owners.precondition.includes("failSliceWithoutCascade('ARC 4 PRECONDITION:")
    && owners.sample.includes('const arc4HitCaptureRevision = arc4PreRaw.revision + 1;')
    && owners.sample.includes('const arc4HitFinalRevision = arc4PreRaw.revision + 2;')
    && owners.sample.includes('const arc4HitFinalOrdinal = arc4PreRaw.authority.sessionRng.ordinal + 2;')
    && owners.sample.includes('arc9-progression-committed:')
    && owners.sample.includes('requireProgressionTail: true,')
    && owners.sample.includes("failSliceWithoutCascade('ARC 4 SAMPLE HIT:")
    && storageRunnerContractPasses(owners.storage, owners.press);
}

const currentOwners = Object.freeze({
  setup: setupOwner,
  reset: resetOwner,
  tame: tameVerdictOwner,
  precondition: preconditionOwner,
  sample: sampleOwner,
  storage: storageOwner,
  press: pressOwner,
});


describe('additive Paragon durable ownership reader', () => {
  const source = readFileSync(new URL('../tools/arc4-browser-contract.mjs', import.meta.url), 'utf8');
  type Discovery = {
    recordId: string; speciesId: string; acquisition: string;
    provenance: Record<string, unknown>; firstForSpecies: boolean;
  };
  type Projection = {
    codex: { legacyCodexId: string; g: Record<string, unknown>; f: string; w: unknown }[];
    names: unknown[]; bx: unknown[]; scout: string | null;
  };
  const readers = (text = source) => new Function('createHash', [
    section(text, 'const own = (value, key) =>', '/* Product decode canonicalizes'),
    section(text, 'const same = (left, right) =>', 'const parseJson = (raw) =>'),
    section(text, 'const exactKeys = (value, expected) =>', 'const assessment = (scope, checks, extra = {}) =>'),
    section(text, 'const orderedObject = (value, fields, overrides = {}) =>', 'const inspectArc4Ownership = (rows) =>'),
    section(text, 'const arc5CreatureId = (value) =>', 'const arc5NullableNumber = (value, maximum) =>'),
    section(text, 'const ARC5_NON_SPECIES_GENOME_FIELDS = new Set([', 'const orderedArc5Receipt = (value) =>'),
    section(text, 'const legacyWorldWhere = (address) =>', 'const legacyMirrorMatches = (ownership, legacy) =>'),
    'return { discovery: orderedDiscovery, mirror: registeredMirrorForDigest, project: projectLegacyMirror, identity: arc5GenomeIdentity };',
  ].join('\n'))(createHash) as {
    discovery: (value: unknown) => Discovery | null;
    mirror: (value: unknown) => unknown;
    project: (value: unknown) => Projection | null;
    identity: (value: unknown) => unknown;
  };
  // Independent serialization fixture, not a claim that Pertar is a Paragon home.
  // Exact home/genome regeneration remains in the existing finder/product controls.
  const world = {
    format: 'CF1', key: 'CF1|g:999@90,-60|s:1347060996@414.31,168.49|p:546621068#3',
    galaxy: { seed: 999, x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
      home: true, quasar: false, dwarf: false, parentCell: { x: 0, y: -1 } },
    star: { seed: 1347060996, x: 414.31, y: 168.49, layer: 'coarse', parentCell: { x: 9, y: 4 } },
    planet: { seed: 546621068, ordinal: 3 },
  };
  const paragon = (index = 0, ordinal = 42, digit = 'a'): Discovery => ({
    recordId: `discovery-v1:${digit.repeat(64)}`,
    speciesId: `species-v1:${digit.repeat(64)}`,
    acquisition: 'paragon',
    provenance: { kind: 'paragon', paragonIndex: index, worldKey: world.key,
      worldAddress: structuredClone(world), receiptOrdinal: ordinal },
    firstForSpecies: true,
  });
  const ordinary = (): Discovery => ({ ...paragon(0, 42, 'b'), acquisition: 'tame',
    provenance: { kind: 'world', verb: 'tame', worldKey: world.key,
      worldAddress: structuredClone(world), cycle: 0, sourceOrdinal: 999 } });
  const legacy = (): Discovery => ({ ...paragon(0, 42, 'c'), acquisition: 'legacy',
    provenance: { kind: 'legacy', legacyCodexId: 's11', legacySourceIndex: 999,
      from: 'Historical source', canonicalWorldKey: null, canonicalWorldAddress: null,
      legacyLocation: { display: 'Historical location' } } });
  const genome = { ep: 12, kingdom: 'fauna', lumin: true, par: 8,
    seed: 1040091444, size: 4, wild: 1 };
  const mirror = (rows: Discovery[], seeds: number[]) => ({
    schema: 'cf-v2-ownership-state/v1', version: 1, revision: 1, mode: 'current',
    catalogSpecies: rows.map((row, index) => ({ speciesId: row.speciesId,
      genomeIdentity: `genome-v1:${row.speciesId.slice('species-v1:'.length)}`,
      kingdom: 'fauna', genome: { ...genome, seed: seeds[index]! }, alias: null,
      firstObservationId: row.recordId })),
    discoveries: rows, creatures: [], specimenLots: [], biosphereProgress: [],
    legacyBioX: [], scoutCreatureId: null, legacyProtection: null,
  });

  it('accepts all fifty indices, exact row/key order and uint32 receipt bounds without rewriting bytes', () => {
    const reader = readers();
    for (let index = 0; index < 50; index++) {
      const expected = paragon(index);
      const shuffled = { ...expected, provenance: Object.fromEntries(
        Object.entries(expected.provenance).reverse(),
      ) };
      expect(reader.discovery(shuffled), `index ${index}`).toEqual(expected);
      expect(JSON.stringify(reader.discovery(shuffled))).toBe(JSON.stringify(expected));
    }
    for (const ordinal of [0, 0xffff_fffe]) expect(reader.discovery(paragon(49, ordinal))).not.toBeNull();
    const input = mirror([paragon()], [1040091444]);
    const prior = JSON.stringify(input);
    expect(JSON.stringify(reader.mirror(input))).toBe(prior);
    expect(reader.project(input)?.codex[0]).toEqual({ legacyCodexId: 's1040091444',
      g: genome, f: 'Paragon site #1', w: {
        type: 'planet', gal: { x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
          seed: 999, home: true, quasar: false, dwarf: false },
        star: { x: 414.31, y: 168.49, seed: 1347060996 }, pseed: 546621068,
      } });
    const digest = createHash('sha256').update(JSON.stringify(genome)).digest('hex');
    expect(reader.identity(genome)).toEqual({ speciesId: `species-v1:${digest}`,
      genomeIdentity: `genome-v1:${digest}`, kingdom: 'fauna' });
    expect(reader.identity({ ...genome, par: 9 })).not.toEqual(reader.identity(genome));
    expect(JSON.stringify(input)).toBe(prior);
  });

  it('rejects missing/extra provenance, invalid identity/range/world binding and restores the valid row', () => {
    const reader = readers();
    const mutations: [string, (row: Discovery) => void][] = [
      ...['kind', 'paragonIndex', 'worldKey', 'worldAddress', 'receiptOrdinal'].map((key) =>
        [`missing ${key}`, (row: Discovery) => { delete row.provenance[key]; }] as [string, (row: Discovery) => void]),
      ...[-1, 50, 0.5, '0', null, NaN].map((value) =>
        [`index ${String(value)}`, (row: Discovery) => { row.provenance.paragonIndex = value; }] as [string, (row: Discovery) => void]),
      ...[-1, 0xffff_ffff, 0.5, '42', null, NaN].map((value) =>
        [`ordinal ${String(value)}`, (row: Discovery) => { row.provenance.receiptOrdinal = value; }] as [string, (row: Discovery) => void]),
      ['extra provenance', (row) => { row.provenance.sourceOrdinal = 42; }],
      ['wrong kind', (row) => { row.provenance.kind = 'invented'; }],
      ['world mismatch', (row) => { row.provenance.worldKey = 'CF1|wrong'; }],
      ['missing planet', (row) => { const address = structuredClone(world) as Record<string, unknown>;
        delete address.planet; row.provenance.worldAddress = address; }],
      ['extra address field', (row) => { row.provenance.worldAddress = { ...world, extra: true }; }],
      ['wrong format', (row) => { row.provenance.worldAddress = { ...world, format: 'CF2' }; }],
      ['capture credit', (row) => { row.acquisition = 'tame'; }],
      ['repeat row', (row) => { row.firstForSpecies = false; }],
      ['bad discovery id', (row) => { row.recordId = 'discovery-v1:bad'; }],
      ['bad species id', (row) => { row.speciesId = 'species-v1:bad'; }],
    ];
    for (const [name, mutate] of mutations) {
      const original = paragon();
      const changed = structuredClone(original);
      mutate(changed);
      expect(changed, name).not.toEqual(original);
      expect(reader.discovery(changed), name).toBeNull();
      expect(reader.mirror(mirror([changed], [1040091444])), name).toBeNull();
      expect(reader.discovery(original), `${name} restored`).toEqual(original);
    }
  });

  it('retains world and legacy acceptance and exact shape rejection', () => {
    const reader = readers();
    for (const row of [ordinary(), legacy()]) {
      expect(reader.discovery(row)).toEqual(row);
      for (const key of Object.keys(row.provenance)) {
        const missing = structuredClone(row);
        delete missing.provenance[key];
        expect(reader.discovery(missing), `${String(row.provenance.kind)} missing ${key}`).toBeNull();
      }
      expect(reader.discovery({ ...row, provenance: { ...row.provenance, extra: true } })).toBeNull();
      expect(reader.discovery({ ...row, extra: true })).toBeNull();
      expect(reader.discovery(row)).toEqual(row);
    }
  });

  it('projects legacy then world then receipt-ordered Paragons, preserving genome/id and deterministic ties', () => {
    const reader = readers();
    const input = mirror([paragon(49, 9, 'd'), ordinary(), paragon(1, 3, 'e'), legacy(), paragon(0, 3)],
      [219484612, 22, 2226934226, 11, 1040091444]);
    const result = reader.project(input);
    expect(result?.codex.map(({ legacyCodexId, f }) => [legacyCodexId, f])).toEqual([
      ['s11', 'Historical source'], ['s22', 'Canonical world 546621068'],
      ['s1040091444', 'Paragon site #1'], ['s2226934226', 'Paragon site #2'],
      ['s219484612', 'Paragon site #50'],
    ]);
    expect(result?.codex[2]?.g).toEqual(genome);
    expect(result?.codex[0]?.w).toBe('Historical location');
    expect(reader.project(mirror([paragon(), ordinary()], [1040091444, 1040091444]))).toBeNull();
  });

  it('negative-controls stale refusal, widened index admission, old ordering and the old label', () => {
    const exactReplace = (old: string, next: string) => {
      expect(source.split(old)).toHaveLength(2);
      return source.replace(old, next);
    };
    const admitted = (reader: ReturnType<typeof readers>) => reader.discovery(paragon(49)) !== null
      && reader.discovery(paragon(50)) === null;
    expect(admitted(readers())).toBe(true);
    expect(admitted(readers(exactReplace("provenance?.kind === 'paragon'", "provenance?.kind === 'never'")))).toBe(false);
    expect(admitted(readers(exactReplace('provenance.paragonIndex < 50', 'provenance.paragonIndex < 51')))).toBe(false);
    const input = mirror([paragon(49, 9), ordinary()], [219484612, 22]);
    const projected = (reader: ReturnType<typeof readers>) => JSON.stringify(reader.project(input)?.codex.map(
      ({ legacyCodexId, f }) => [legacyCodexId, f],
    )) === JSON.stringify([['s22', 'Canonical world 546621068'], ['s219484612', 'Paragon site #50']]);
    expect(projected(readers())).toBe(true);
    expect(projected(readers(exactReplace('left.category - right.category || left.order - right.order', 'left.order - right.order')))).toBe(false);
    expect(projected(readers(exactReplace('`Paragon site #${provenance.paragonIndex + 1}`', '`Canonical world ${provenance.worldAddress.planet.seed}`')))).toBe(false);
    expect(admitted(readers())).toBe(true);
    expect(projected(readers())).toBe(true);
  });
});

describe('current capture settlement receipt binding', () => {
  it('binds every wrapper and Scout fact, rejects noncanonical or historical-only receipts, and restores green', () => {
    const result = ARC4_CAPTURE_SETTLEMENT_SELFTEST as Readonly<{
      positive: boolean;
      controls: Readonly<Record<string, Readonly<{
        mutationApplied: boolean; rejected: boolean; restored: boolean;
      }>>>;
    }>;
    const fields = [
      'schema', 'captureWitness', 'successorDigest', 'ownershipV2Digest',
      'arc5MigrationWritesDigest', 'scoutXp',
      ...[
        'schema', 'firstForSpecies', 'scoutCreatureId', 'xpBefore', 'xpAfter', 'xpAward',
        'sourceParentDigest', 'sourceSuccessorDigest', 'ownershipParentDigest',
        'ownershipSuccessorDigest',
      ].map((key) => `scout.${key}`),
    ];
    expect(Object.keys(result.controls)).toEqual([
      ...fields.flatMap((field) => [`${field}.missing`, `${field}.changed`]),
      'extraWrapperField', 'extraScoutField', 'oldInnerOnly',
      'noncanonicalWrapper', 'noncanonicalInner',
    ]);
    expect(result.positive).toBe(true);
    for (const [name, control] of Object.entries(result.controls)) {
      expect(control, name).toEqual({ mutationApplied: true, rejected: true, restored: true });
    }
  });
});

describe('Slice current capture receipt mutation expectations', () => {
  const expectedFailures = [
    'durableEvidence', 'arc5CarrierSuccessor', 'receipt', 'unrelatedDurable',
    'ownershipV2Live',
  ];
  const exactFailureOwner = section(sliceSource,
    '  const arc4ExactFailureSet = (result, expected) =>',
    '  const arc4MutateStateActivePlay = (state) => {');
  const exactFailureSet = new Function(`${exactFailureOwner}; return arc4ExactFailureSet;`)() as (
    result: { ok: boolean; checks: Record<string, boolean> }, expected: readonly string[],
  ) => boolean;

  it('requires the receipt dependency in all four existing Arc5 migration mutants', () => {
    const owners = [
      ...['arc4HitRetainedArc5Control', 'arc4HitTargetDigestControl',
        'arc4MissRetainedArc5Control'].map((name) => {
        const matches = [...sliceSource.matchAll(new RegExp(
          `arc4ExactFailureSet\\(${name},\\s*(\\[[\\s\\S]*?\\])\\)`, 'gu',
        ))];
        expect(matches, name).toHaveLength(1);
        return matches[0]![1]!;
      }),
      section(sliceSource, '      arc5CarrierSuccessor: {', '      downwardRuntime: {')
        .match(/expected:\s*(\[[\s\S]*?\])/u)![1]!,
    ];
    const failed = { ok: false, checks: Object.fromEntries(expectedFailures.map((key) => [key, false])) };
    for (const owner of owners) {
      const parse = (value: string) => new Function(`return (${value});`)() as string[];
      expect(parse(owner)).toEqual(expectedFailures);
      expect(exactFailureSet(failed, parse(owner))).toBe(true);
      expect(owner.split("'receipt', ")).toHaveLength(2);
      const staleOwner = owner.replace("'receipt', ", '');
      expect(exactFailureSet(failed, parse(staleOwner))).toBe(false);
      expect(exactFailureSet({ ...failed, checks: { ...failed.checks, unexpected: false } },
        parse(owner))).toBe(false);
      expect(exactFailureSet({ ...failed, checks: { ...failed.checks, receipt: true } },
        parse(owner))).toBe(false);
      expect(exactFailureSet(failed, parse(owner))).toBe(true);
    }
  });

  it('mutates the inner event and inner successor digest while retaining the exact settlement envelope', () => {
    const rows = [
      ['event', 'event', 'c', '    const digestControlAfter ='],
      ['digest', 'successorDigest', 'd', '    const v4ControlAfter ='],
    ] as const;
    const inner = { schema: 'cf-v2-capture-plan-witness/v1', event: 'a'.repeat(64),
      candidateDraw: 0.1, successDraw: 0.2, chance: 0.3, hit: true, spent: 1,
      successorDigest: 'b'.repeat(64) };
    const settlement = { schema: 'cf-v2-arc4-capture-settlement-witness/v1',
      captureWitness: JSON.stringify(inner), successorDigest: 'b'.repeat(64),
      ownershipV2Digest: 'e'.repeat(64), arc5MigrationWritesDigest: 'f'.repeat(64),
      scoutXp: { scoutCreatureId: null, xpBefore: null, xpAfter: null, xpAward: 0 } };
    const original = { ordinal: 2, kind: 'capture-attempt', witness: JSON.stringify(settlement) };
    for (const [name, field, digit, end] of rows) {
      const owner = section(sliceSource,
        `    const ${name}ControlAfter = arc4MutateNewReceipt(after, ordinal, (row) => {`, end);
      const run = (source: string) => new Function('after', 'ordinal', 'arc4MutateNewReceipt',
        'canonicalJson', `${source}; return ${name}ControlAfter;`)(original, 2,
        (after: typeof original, ordinal: number, mutate: (row: typeof original) => void) => {
          expect(ordinal).toBe(2);
          const row = structuredClone(after); mutate(row); return row;
        }, JSON.stringify) as typeof original;
      const exact = (row: typeof original) => {
        const outer = JSON.parse(row.witness) as typeof settlement;
        return JSON.stringify({ ...outer, captureWitness: settlement.captureWitness })
            === JSON.stringify(settlement)
          && JSON.stringify(JSON.parse(outer.captureWitness))
            === JSON.stringify({ ...inner, [field]: digit.repeat(64) });
      };
      expect(exact(run(owner))).toBe(true);
      expect(owner.split('JSON.parse(settlement.captureWitness)')).toHaveLength(2);
      expect(exact(run(owner.replace('JSON.parse(settlement.captureWitness)', 'settlement')))).toBe(false);
      expect(original.witness).toBe(JSON.stringify(settlement));
      expect(exact(run(owner))).toBe(true);
    }
  });
});

describe('Slice Arc 4 composed ledger and causal-stop contract', () => {
  it('seals the real Pertar setup prefix and first-Sample progression successor', () => {
    const prefix = ARC4_PERTAR_LEDGER_PREFIX_SELFTEST as Readonly<{
      sourceReady: Assessment;
      actionReady: Assessment;
      actionReadyTameVariant: Assessment;
      controls: Readonly<Record<string, Assessment>>;
    }>;
    const progression = ARC4_PERTAR_PROGRESSION_TAIL_SELFTEST as Readonly<{
      positive: Assessment;
      controls: Readonly<Record<string, Assessment>>;
    }>;

    expect(ARC4_PERTAR_FIXTURE.sourceReadySessionOrdinal).toBe(1);
    expect(ARC4_PERTAR_FIXTURE.actionReadySessionOrdinal).toBe(2);
    expect(ARC4_PERTAR_FIXTURE.actionReadyReceiptKinds).toEqual([
      'arc9-progression-refresh-v1', 'arc0-land',
    ]);
    expect(ARC4_PERTAR_FIXTURE.actions.firstHit.progressionTail).toMatchObject({
      receiptKind: 'arc9-progression-refresh-v1',
      addedAchievementIds: ['rare', 'legend'],
      priorBestRankIndex: 3,
      nextBestRankIndex: 3,
    });
    expect(ARC4_PERTAR_FIXTURE.initialSessionDraws).toEqual({});
    expect(ARC4_PERTAR_DESCENT_DRAWS).toEqual({ 'descent.success': 1, 'descent.damage': 1 });
    expect(ARC4_PERTAR_DESCENT_LANDING).toMatchObject({
      descentWeather: 'rain',
      descent: {
        kind: 'landed', navigation: 'surface', drawsConsumed: 2,
        hpBefore: 55, hpAfter: 55, damage: 0,
        waveOffCountBefore: 0, waveOffCountAfter: 0, persistenceOutcome: 'success',
        policy: { planetType: 'ocean', biomeKey: 'volcisle', baseSuccessPercent: 70,
          stormActive: true, stormAdjustedPercent: 65, successPercent: 65,
          safeReason: null, requiredDomains: ['descent.success', 'descent.damage'] },
      },
      waveOffStateSuccessorSeal: '88ed6120a970c2bda5aaa7e4d4f39be3766293b9a17aa8277141a15c7bc94b56',
      waveOffLegacySuccessorSeal: '9d7ceb80430c32a69624b2ad4a2a9bbe6b4e15366a8021c947058322d8a42e7d',
      arc2LootSuccessorSeal: 'af67a21664d77c83434ddd0ce394c85b4c596ffb672d101540e815c1e2574457',
      waveOffProtectedStateSeal: null,
    });
    expect(prefix.sourceReady.ok).toBe(true);
    expect(prefix.actionReady.ok).toBe(true);
    expect(prefix.actionReadyTameVariant.ok).toBe(true);
    expect(Object.keys(prefix.controls)).toEqual([
      'staleEmptyLedger', 'missingReceipt', 'extraReceipt', 'reorderedReceipts',
      'bootWitness', 'unexpectedSurveyReceipt', 'landingWitness', 'landingStateSuccessorSeal',
      'descentWeather', 'descentOutcome', 'descentPolicy', 'waveOffStateSeal', 'waveOffLegacySeal', 'arc2LootSeal', 'waveOffProtectedSeal', 'missingDescentField', 'extraDescentField', 'descentWitnessOrder', 'authorityDraws', 'runtimeDraws',
      'authorityOrdinal', 'runtimeOrdinal',
    ]);
    expect(Object.values(prefix.controls).every((control) => control.ok === false)).toBe(true);
    expect(progression.positive.ok).toBe(true);
    expect(Object.keys(progression.controls)).toEqual([
      'missingTail', 'extraTail', 'wrongTailWitness', 'wrongAchievementDelta',
      'wrongFinalSpan', 'resultBoundToFinal', 'ownershipAdvancedTwice',
      'progressionConsumedDraw',
    ]);
    expect(Object.values(progression.controls)
      .every((control) => control.ok === false)).toBe(true);
  });

  it('binds publication evidence to Capture R+1 and the progression fixed point to R+2', () => {
    const publication = ARC4_PUBLICATION_PROGRESSION_SELFTEST as Readonly<{
      positive: PublicationAssessment;
      controls: Readonly<Record<string, Readonly<{
        expected: readonly string[];
        nestedExpected: readonly string[] | null;
        result: PublicationAssessment;
      }>>>;
    }>;

    expect(publication.positive.ok).toBe(true);
    expect(publication.positive.publicationBoundary).toEqual({
      beforeRevision: 11,
      actionRevision: 12,
      fixedPointRevision: 13,
      beforeOrdinal: 2,
      actionOrdinal: 3,
      fixedPointOrdinal: 4,
      actionDraws: { 'capture.candidate': 1, 'capture.success': 1,
        'descent.damage': 1, 'descent.success': 1 },
      fixedPointDraws: { 'capture.candidate': 1, 'capture.success': 1,
        'descent.damage': 1, 'descent.success': 1 },
    });
    expect(Object.keys(publication.controls)).toEqual([
      'captureOnlyEndpoint',
      'missingProgressionTail',
      'wrongProgressionWitness',
      'wrongAchievementDelta',
      'wrongFinalSpan',
      'faultBoundToFixedPoint',
      'detailBoundToFixedPoint',
      'witnessBoundToFixedPoint',
      'reloadStateCommitCount',
      'reloadUiCommitCount',
      'reloadStateOutcome',
      'reloadUiOutcome',
      'reloadUnlocked',
      'reloadBestRank',
      'reloadUiBootKind',
      'reloadStateBootKind',
      'reloadUiPending',
      'reloadStatePending',
    ]);
    for (const [name, control] of Object.entries(publication.controls)) {
      const failed = Object.entries(control.result.checks)
        .filter(([, value]) => value !== true)
        .map(([check]) => check);
      const nestedFailed = Object.entries(
        control.result.convergenceReleaseDiagnostics.checks,
      ).filter(([, value]) => value !== true).map(([check]) => check);
      expect(control.result.ok, name).toBe(false);
      expect(failed, name).toEqual(control.expected);
      if (control.nestedExpected !== null) {
        expect(nestedFailed, name).toEqual(control.nestedExpected);
      }
    }
  });

  it('makes the browser runner consume those shared contracts and stop before storage on red', () => {
    expect(runnerContractPasses(currentOwners)).toBe(true);
  });

  it('rejects omission of the progression tail, stale empty-ledger logic, and noncausal failure collection', () => {
    const currentSpan = '=== wrongOrdinal?.rawBefore?.revision + 1';
    expect(setupOwner.split(currentSpan)).toHaveLength(2);
    const obsoleteSurveyWrite = setupOwner.replace(
      currentSpan, '=== wrongOrdinal?.rawBefore?.revision + 2',
    );
    expect(runnerContractPasses({
      ...currentOwners, setup: obsoleteSurveyWrite,
    })).toBe(false);
    expect(runnerContractPasses(currentOwners)).toBe(true);
    expect(runnerContractPasses({
      ...currentOwners,
      sample: sampleOwner.replace(
        'requireProgressionTail: true,',
        'requireProgressionTail: false,',
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      reset: resetOwner.replace(
        'actionReadyLedger: arc4TameAudioResetLedger.ok === true',
        'virginRngAndReceipts: true',
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      sample: sampleOwner.replace(
        "failSliceWithoutCascade('ARC 4 SAMPLE HIT:",
        "fails.push('ARC 4 SAMPLE HIT:",
      ),
    })).toBe(false);
    for (const phase of ['pre-arm', 'post-arm', 'post-press', 'deadline']) {
      expect(runnerContractPasses({
        ...currentOwners,
        storage: storageOwner.replace(
          `captureArc4StoragePhase('${phase}')`,
          `captureArc4StoragePhase('missing-${phase}')`,
        ),
      }), phase).toBe(false);
    }
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner.replace(
        "failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: native Tame",
        "fails.push('ARC 4 STORAGE PRECONDITION: native Tame",
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner.replace(
        "failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: storage-failure hook",
        "fails.push('ARC 4 STORAGE PRECONDITION: storage-failure hook",
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner.replace(
        "failSliceWithoutCascade('ARC 4 STORAGE ACTION:",
        "fails.push('ARC 4 STORAGE ACTION:",
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner.replace(
        'failSliceWithoutCascade(arc4StorageTerminalFailure);',
        'fails.push(arc4StorageTerminalFailure);',
      ),
    })).toBe(false);
    const hookLine = 'const arc4StorageArmed = await evalIn(`window.__CF_SLICE__.api.__smokeRejectNextArc4ActionStorage()`);';
    const pressLine = "const arc4StoragePress = await pressArc4Keyboard('tame');";
    const swappedStorage = storageOwner.replace(hookLine, '__ARC4_STORAGE_HOOK__')
      .replace(pressLine, hookLine)
      .replace('__ARC4_STORAGE_HOOK__', pressLine);
    expect(runnerContractPasses({
      ...currentOwners, storage: swappedStorage,
    })).toBe(false);
    const preArmPhaseLine = "const arc4StoragePreArm = await captureArc4StoragePhase('pre-arm');";
    const postArmPhaseLine = "const arc4StoragePostArm = await captureArc4StoragePhase('post-arm');";
    const swappedPhaseStorage = storageOwner
      .replace(preArmPhaseLine, '__ARC4_STORAGE_PRE_ARM__')
      .replace(postArmPhaseLine, preArmPhaseLine)
      .replace('__ARC4_STORAGE_PRE_ARM__', postArmPhaseLine);
    expect(runnerContractPasses({
      ...currentOwners, storage: swappedPhaseStorage,
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner.replace(
        'postPress: arc4StoragePostPress, deadline: arc4StorageDeadline },',
        'postPress: null, deadline: null },',
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      press: pressOwner.replace(
        'const dispatched = armed === true && target.ok === true\n      && target.focus === true;',
        'const dispatched = armed && target.ok;',
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner
        .replace('waitError: arc4StorageWaitError,', 'waitError: null,')
        .replace('captureErrors: arc4StorageCaptureErrors,', 'captureErrors: [],'),
    })).toBe(false);
  });
});
