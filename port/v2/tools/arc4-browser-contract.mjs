import { createHash } from 'node:crypto';

/* Arc 4 browser evidence contract.

   This module owns no browser, DOM, storage or product state. Slice Smoke and
   Glass Matrix may collect the plain evidence described here, but every
   verdict is recomputed in Node from exact raw persistence bytes and bounded
   UI observations. A page global, copied PASS bit, preview roster or direct
   planner call therefore cannot become outcome authority. */

export const ARC4_BROWSER_CONTRACT_SCHEMA =
  'cf-v2-arc4-browser-contract/v1';
export const ARC4_CAPTURE_UI_EVIDENCE_SCHEMA =
  'cf-v2-slice-arc4-capture-ui-evidence/v1';
export const ARC4_CAPTURE_GEOMETRY_EVIDENCE_SCHEMA =
  'cf-v2-glass-arc4-capture-geometry/v1';
export const ARC4_CAPTURE_LAYOUT_COORDINATE_SPACE =
  'viewport-plus-ancestor-scroll-offset/v1';
export const ARC4_STALE_FAULT_CAPTURE_SCHEMA =
  'cf-v2-slice-arc4-stale-fault-capture/v1';
export const ARC4_PUBLICATION_FAULT_CAPTURE_SCHEMA =
  'cf-v2-slice-arc4-publication-fault-capture/v1';
export const ARC4_ACTIVE_PLAY_CYCLE_MS = 1_200_000;
export const ARC4_CAPTURE_RECEIPT_KIND = 'capture-attempt';

export const ARC4_CAPTURE_VERBS = Object.freeze([
  'tame', 'scavenge', 'sample',
]);

const ARC4_SHARD_GROUPS = Object.freeze([
  Object.freeze({
    kind: 'catalogSpecies', segment: 'catalog', prefix: 'arc4.ownership.catalog',
  }),
  Object.freeze({
    kind: 'discoveries', segment: 'catalog', prefix: 'arc4.ownership.discoveries',
  }),
  Object.freeze({
    kind: 'creatures', segment: 'creatures', prefix: 'arc4.ownership.creatures',
  }),
  Object.freeze({
    kind: 'specimenLots', segment: 'inventory', prefix: 'arc4.ownership.specimens',
  }),
]);

const ARC4_SEGMENT_ORDER = Object.freeze({
  player: 0, creatures: 1, catalog: 2, inventory: 3, settings: 4,
});

export const ARC4_OWNERSHIP_EXTENSION_TARGETS = Object.freeze([
  Object.freeze({ segment: 'player', namespace: 'arc4.ownership.manifest' }),
  Object.freeze({ segment: 'player', namespace: 'arc4.ownership.progress' }),
  ...ARC4_SHARD_GROUPS.flatMap(({ segment, prefix }) => (
    Array.from({ length: 4 }, (_, index) => Object.freeze({
      segment, namespace: `${prefix}.${index}`,
    }))
  )),
].sort((left, right) => ARC4_SEGMENT_ORDER[left.segment] - ARC4_SEGMENT_ORDER[right.segment]
  || (left.namespace < right.namespace ? -1 : left.namespace > right.namespace ? 1 : 0)));

export const ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET = Object.freeze({
  segment: 'player', namespace: 'arc5.ownership.migration',
});

const ARC5_OWNERSHIP_MIGRATION_PREFIX = 'arc5.ownership.';
const ARC5_OWNERSHIP_MIGRATION_SCHEMA = 'cf-v2-ownership-v1-to-v2/v1';
const ARC5_OWNERSHIP_SOURCE_SCHEMA = 'cf-v2-ownership-state/v1';
const ARC5_OWNERSHIP_TARGET_SCHEMA = 'cf-v2-ownership-state/v2';

const ARC4_PERTAR_WORLD_ADDRESS = Object.freeze({
  format: 'CF1',
  key: 'CF1|g:999@90,-60|s:1347060996@414.31,168.49|p:546621068#3',
  galaxy: Object.freeze({
    seed: 999, x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
    home: true, quasar: false, dwarf: false,
    parentCell: Object.freeze({ x: 0, y: -1 }),
  }),
  star: Object.freeze({
    seed: 1_347_060_996, x: 414.31, y: 168.49,
    layer: 'coarse', parentCell: Object.freeze({ x: 9, y: 4 }),
  }),
  planet: Object.freeze({ seed: 546_621_068, ordinal: 3 }),
});

/* Source-derived from canonicalWorldRoster(resolveCF1WorldAddress(Pertar), 0)
   with canonicalGenomeIdentityV1 + the public ringGrade projection. Keeping
   every row makes candidate selection an independent full-pool oracle rather
   than a relation to the planner's selected result. */
const ARC4_PERTAR_CANDIDATES = Object.freeze([
  [0, 3_207_864_637, '0125930ef083a17f9007e1d703eeaaa01be28b025ed0317a2ba8aa710cf46d6f', 'flora', 1],
  [1, 60_083_744, '78debcbcd5144d1b67a18c7dbb94dd9bd2f45996b2493f2bc775ca3760d2774c', 'flora', 5],
  [2, 3_180_100_172, '5aa6cc216869d67f952d070a46f7169677fe8d99f07833f2675ef3ee88d4c462', 'flora', 2],
  [3, 4_254_775_612, 'bd4f6e86f25e4e4a309ee01ed96f9ea6a215cde08221569e8c8e4bfc9da7fafe', 'flora', 1],
  [4, 3_255_138_372, 'cc92738b504f41f38d8cc46d67c1c5d17ce7c8161485fa493850f1a5c2b260d7', 'fauna', 2],
  [5, 3_650_976_095, '1b7f32606f538497e96bc6242ef2121e7b510bbe3986f10a5c7330fa9fe975c3', 'fauna', 2],
  [6, 2_664_175_683, '4b9e3a195aff2367dd584f5149969421cf8ec19c815d2d98a97404f89a3d1792', 'fauna', 2],
  [7, 2_880_584_378, '401c6deaa58eba25da92556d87ed16503d0cdfdb6a4354d07d3530f37d0638b4', 'fauna', 2],
  [8, 1_898_135_747, '90d2727a7c9245729da3b2bbcd74d3b6fa92b31b1a0fb1fcbdc0f87bd343d217', 'fauna', 1],
  [9, 3_070_841_453, '10ea63c38e78944868c746dabf992d5d66ea66d94090eb7950ffcf57b8741c1e', 'fauna', 4],
  [10, 1_698_654_641, 'ed1ed1b2ee038deaca92ff506191c3312c5c1fce7b7afa0a9a61636d3e452cad', 'fauna', 1],
  [11, 871_870_647, '93e48b60554c81bb876e771fa05f9dffc41138d63501218388f295f5894cc6be', 'fauna', 2],
  [12, 97_082_454, 'a39b83375476e3f5a0b640cbe9b87f5a88e16eb708ac8a4b27293bcb25cc26c5', 'fauna', 4],
  [13, 3_990_056_189, 'a1548a6fb3ea38715b16d65115c3d6c4b5f8248142d4660ecac5bafdcea8252b', 'microbe', 5],
  [14, 2_260_054_195, '82375c7e139e6922c1b2e40f471320b3d6db78e520d1564fa12b3ab776f54418', 'microbe', 2],
  [15, 3_617_060_478, 'c172dc8ab7f0c642aa403e93dfc148e5450a6f925e802484f7d95d895503a176', 'microbe', 1],
  [16, 2_208_234_820, 'b2947f2e9dca1d600c32d8b77f3111c8ffe10a83122ff0ea9b94e21dee51ec10', 'microbe', 3],
  [17, 2_406_822_566, '310cbe43fe85230990aac25609470c05a2f4f3c2790fe6f689cc9f3de08574de', 'flora', 2],
  [18, 47_769_322, '70d144d104714909f78160297578d9b35488be6c196f09e19a4aacfa42c351bc', 'flora', 3],
].map(([sourceOrdinal, seed, digest, kingdom, tier]) => Object.freeze({
  sourceOrdinal,
  legacyCatalogueId: `s${seed}`,
  speciesId: `species-v1:${digest}`,
  genomeIdentity: `genome-v1:${digest}`,
  kingdom,
  tier,
})));

const ARC4_PERTAR_SYSTEM_ITEM_IDS = Object.freeze([
  'jumpdrive', 'array', 'igdrive', 'autoext', 'cscoop',
]);
const ARC4_PERTAR_SOURCE_FACTS = Object.freeze({
  arc2LoadoutFingerprint: 'el1:2644:1286ebff',
  engineeringCapabilityFingerprint: 'ec1:430:ae5789c7',
  legacyAscChapter: 2,
  equippedInstanceIds: Object.freeze([
    'gear1|loot1|legacy-migration|save-v2-user|items-v1|||migration%3Av4-v5|11000',
    'gear1|loot1|legacy-migration|save-v2-user|items-v1|||migration%3Av4-v5|14000',
    'gear1|loot1|legacy-migration|save-v2-user|items-v1|||migration%3Av4-v5|18000',
  ]),
  installedSystemIds: Object.freeze(['jumpdrive']),
  noJumpArc2LootSha256:
    '839b068be90c6ad91ae617e2754d106fbe219f1669267c005e44441357cfe004',
  noJumpArc2LoadoutFingerprint: 'el1:2611:a0596c75',
  noJumpEngineeringCapabilityFingerprint: 'ec1:408:30967972',
  noJumpCapabilityFingerprint: 'ac1:419:7d351b31',
});

export const ARC4_PERTAR_FIXTURE = Object.freeze({
  schema: 'cf-v2-arc4-pertar-fixture/v1',
  galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
  star: Object.freeze({
    seed: 1_347_060_996,
    x: 414.30747968237847,
    y: 168.49130642227829,
  }),
  planet: Object.freeze({ seed: 546_621_068, ordinal: 3 }),
  publicStar: Object.freeze({ seed: 1_347_060_996, x: 414.31, y: 168.49 }),
  worldKey: 'CF1|g:999@90,-60|s:1347060996@414.31,168.49|p:546621068#3',
  address: 'CF1|g:999@90,-60|s:1347060996@414.31,168.49|p:546621068#3',
  worldAddress: ARC4_PERTAR_WORLD_ADDRESS,
  ecologyEpoch: 0,
  previewCount: 8,
  fullRosterCount: 19,
  fullRosterFingerprint: 'cwr1:19:5923:65565395',
  biosphereKey: 'aquatic',
  biosphereYield: 16,
  captureRing: 0,
  arc2LootSha256: '732bd97e8e7a101815d1884909b014de10049652c832925d34da6ff56079eaaa',
  capabilityFingerprint: 'ac1:441:87c0acc2',
  inventoryRevision: 0,
  contactCapturePoints: 30,
  candidates: ARC4_PERTAR_CANDIDATES,
  sessionSeed: 68,
  initialSessionOrdinal: 0,
  initialSessionDraws: Object.freeze({}),
  v4OwnedCounters: Object.freeze({
    before: Object.freeze({ hybrids: 0, best: 0, maxGen: 0, bestRank: 3 }),
    afterFirstHit: Object.freeze({ hybrids: 0, best: 5, maxGen: 2, bestRank: 3 }),
  }),
  v4OwnedCompatibility: Object.freeze({
    before: Object.freeze({
      ever: Object.freeze({ v: 1, hybrids: 0, best: 0, maxGen: 0, scanhits: 0 }),
      br: 3,
    }),
    afterFirstHit: Object.freeze({
      ever: Object.freeze({ v: 1, hybrids: 0, best: 5, maxGen: 2, scanhits: 0 }),
      br: 3,
    }),
  }),
  actions: Object.freeze({
    firstHit: Object.freeze({
      verb: 'sample',
      sourceOrdinal: 13,
      tier: 5,
      chance: 0.445,
      candidateDraw: 0.19538691570051014,
      successDraw: 0.44373711268417537,
      hit: true,
      firstForSpecies: true,
      generation: 2,
      speciesId: 'species-v1:a1548a6fb3ea38715b16d65115c3d6c4b5f8248142d4660ecac5bafdcea8252b',
      kingdom: 'microbe',
      stardustReward: 2,
      remainingAfter: 15,
      hiddenBeyondPreview: true,
    }),
    secondMiss: Object.freeze({
      verb: 'tame',
      sourceOrdinal: 12,
      tier: 4,
      chance: 0.44,
      candidateDraw: 0.9693615839350969,
      successDraw: 0.9086092014331371,
      hit: false,
      firstForSpecies: false,
      speciesId: 'species-v1:a39b83375476e3f5a0b640cbe9b87f5a88e16eb708ac8a4b27293bcb25cc26c5',
      kingdom: 'fauna',
      stardustReward: 0,
      remainingAfter: 14,
    }),
  }),
});

const V5_SEGMENTS = Object.freeze([
  Object.freeze({ segment: 'player', raw: 'playerRaw', row: 'playerRow' }),
  Object.freeze({ segment: 'creatures', raw: 'creaturesRaw', row: 'creaturesRow' }),
  Object.freeze({ segment: 'catalog', raw: 'catalogRaw', row: 'catalogRow' }),
  Object.freeze({ segment: 'inventory', raw: 'inventoryRaw', row: 'inventoryRow' }),
  Object.freeze({ segment: 'settings', raw: 'settingsRaw', row: 'settingsRow' }),
]);

const V5_SEGMENT_FIELDS = Object.freeze({
  player: Object.freeze([
    'v', 'epoch', 'view', 'hp', 'pstats', 'landings', 'chs', 'chw', 'chp',
    'chacc', 'charters', 'notifs', 'me', 'essence', 'conq', 'breeds',
    'breedwins', 'feeds', 'feedfails', 'harvests', 'essenceEarned', 'guardians',
    'paragons', 'nh', 'br', 'at', 'mines', 'crafts', 'minedout', 'skims',
    'cosmics', 'asc', 'ascp', 'names', 'shares', 'jumps', 'anomalies', 'anomKey',
    'events', 'duels', 'duelwins', 'ever', 'ach', 'frontier', 'ending', 'guide',
    'tut', 'rn', 'tsnap',
  ]),
  creatures: Object.freeze([]),
  catalog: Object.freeze([
    'land', 'scout', 'wvo', 'cont', 'seen', 'surveyed', 'gals', 'surf', 'sysv',
    'starK', 'ptypes', 'evts', 'evann', 'log', 'home', 'prime', 'codex',
  ]),
  inventory: Object.freeze([
    'setsc', 'cargo', 'cgx', 'jrn', 'pin', 'ctb', 'minedw', 'mx', 'skx', 'bx',
    'tech', 'items', 'eq', 'ea', 'xpf',
  ]),
  settings: Object.freeze([
    'fs', 'tone', 'font', 'snd', 'fx', 'chart', 'shake', 'sv', 'notif', 'tips',
    'vol', 'gt', 'rm', 'cx', 'vce', 'cbx',
  ]),
});

const own = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key);
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const uint32 = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 0xffff_ffff;
const counter = (value) => Number.isSafeInteger(value) && value >= 0;
const probability = (value) => typeof value === 'number' && Number.isFinite(value)
  && value >= 0 && value <= 1;
const boundedText = (value, maximum = 4_096) => typeof value === 'string'
  && value.length > 0 && value.length <= maximum && !/[\u0000-\u001f\u007f]/u.test(value);
const hexDigest = (value) => typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value);
const sameNumber = (left, right) => typeof left === 'number' && typeof right === 'number'
  && Number.isFinite(left) && Number.isFinite(right) && Object.is(left, right);

const canonicalToolJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalToolJson).join(',')}]`;
  if (record(value)) {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalToolJson(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value);
};

const same = (left, right) => canonicalToolJson(left) === canonicalToolJson(right);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const parseJson = (raw) => {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  try { return JSON.parse(raw); } catch { return null; }
};
const exactRawPair = (raw, parsed) => {
  const decoded = parseJson(raw);
  return decoded !== null && parsed !== null && parsed !== undefined
    && raw === JSON.stringify(parsed) && same(decoded, parsed);
};
const exactKeys = (value, expected) => record(value)
  && same(Object.keys(value).sort(), [...expected].sort());

const assessment = (scope, checks, extra = {}) => {
  const frozen = Object.freeze({ ...checks });
  const reasons = Object.entries(frozen)
    .filter(([, value]) => value !== true)
    .map(([name]) => `${scope} ${name}`);
  return Object.freeze({ ok: reasons.length === 0, checks: frozen, reasons, ...extra });
};

const inspectV5Rows = (evidence) => {
  const rows = {};
  const envelope = {};
  const checks = {};
  let namespaceCount = 0;
  let extensionBytes = 0;
  let uniqueFields = true;
  for (const descriptor of V5_SEGMENTS) {
    const row = evidence?.[descriptor.row];
    const raw = evidence?.[descriptor.raw];
    const validShape = exactRawPair(raw, row)
      && (exactKeys(row, ['schema', 'segment', 'data'])
        || exactKeys(row, ['schema', 'segment', 'data', 'extensions']))
      && row?.schema === 5 && row?.segment === descriptor.segment
      && record(row?.data)
      && Object.keys(row.data).every((field) => V5_SEGMENT_FIELDS[descriptor.segment].includes(field))
      && (!own(row, 'extensions') || record(row.extensions));
    let extensionsValid = validShape;
    if (extensionsValid && own(row, 'extensions')) {
      const namespaces = Object.entries(row.extensions);
      extensionsValid = namespaces.length <= 64;
      for (const [namespace, carrier] of namespaces) {
        if (!extensionsValid) break;
        const parsed = parseJson(carrier?.json);
        const bytes = typeof carrier?.json === 'string'
          ? new TextEncoder().encode(carrier.json).byteLength : Number.POSITIVE_INFINITY;
        extensionsValid = /^[a-z][a-z0-9.-]{0,63}$/u.test(namespace)
          && exactKeys(carrier, ['version', 'json'])
          && Number.isSafeInteger(carrier.version) && carrier.version >= 1
          && bytes <= 262_144 && record(parsed);
        namespaceCount++;
        extensionBytes += bytes;
      }
    }
    checks[`${descriptor.segment}Row`] = validShape && extensionsValid;
    if (validShape && extensionsValid) {
      rows[descriptor.segment] = row;
      for (const [field, value] of Object.entries(row.data)) {
        if (own(envelope, field)) uniqueFields = false;
        else envelope[field] = value;
      }
    }
  }
  const allRows = Object.values(checks).every((value) => value === true);
  checks.extensionAggregate = !allRows
    || (namespaceCount <= 128 && extensionBytes <= 1_048_576);
  checks.uniqueEnvelopeFields = !allRows || uniqueFields;
  checks.v4Envelope = !allRows || !uniqueFields || (
    exactRawPair(evidence?.legacyRaw, evidence?.legacy)
    && evidence?.legacy?.v === 4
    && same(envelope, evidence.legacy)
  );
  return {
    ok: Object.values(checks).every((value) => value === true),
    checks, rows, envelope,
  };
};

const carrierAt = (rows, segment, namespace) => rows?.[segment]?.extensions?.[namespace];
const exactCanonicalCarrier = (carrier) => {
  const parsed = parseJson(carrier?.json);
  return exactKeys(carrier, ['version', 'json']) && carrier.version === 1
    && record(parsed) && carrier.json === canonicalToolJson(parsed)
    ? parsed : null;
};

/* Carrier JSON sorts every object key, while the authoritative state digest
   hashes JSON.stringify() of the domain-registered mirror. Recreate the
   constructors' exact field order before hashing; hashing the parsed carrier
   objects directly would agree for an empty state and diverge on the first
   real catalogue/discovery/progress row. */
const orderedObject = (value, fields, overrides = {}) => {
  if (!exactKeys(value, fields)) return null;
  return Object.fromEntries(fields.map((field) => [
    field, own(overrides, field) ? overrides[field] : value[field],
  ]));
};

const orderedWorldAddress = (value) => {
  const galaxyParent = orderedObject(value?.galaxy?.parentCell, ['x', 'y']);
  const starParent = orderedObject(value?.star?.parentCell, ['x', 'y']);
  const galaxy = orderedObject(value?.galaxy, [
    'seed', 'x', 'y', 'size', 'sp', 'tilt', 'rot', 'home', 'quasar', 'dwarf',
    'parentCell',
  ], { parentCell: galaxyParent });
  const star = orderedObject(value?.star, [
    'seed', 'x', 'y', 'layer', 'parentCell',
  ], { parentCell: starParent });
  const planet = orderedObject(value?.planet, ['seed', 'ordinal']);
  return galaxyParent !== null && starParent !== null && galaxy !== null
    && star !== null && planet !== null
    ? orderedObject(value, ['format', 'key', 'galaxy', 'star', 'planet'], {
      galaxy, star, planet,
    }) : null;
};

const orderedDiscovery = (value) => {
  const provenance = value?.provenance;
  let orderedProvenance = null;
  if (provenance?.kind === 'world') {
    const worldAddress = orderedWorldAddress(provenance.worldAddress);
    if (worldAddress !== null) {
      orderedProvenance = orderedObject(provenance, [
        'kind', 'verb', 'worldKey', 'worldAddress', 'cycle', 'sourceOrdinal',
      ], { worldAddress });
    }
  } else if (provenance?.kind === 'legacy') {
    const legacyLocation = provenance.legacyLocation === null
      ? null : orderedObject(provenance.legacyLocation, ['display']);
    if (provenance.legacyLocation === null || legacyLocation !== null) {
      orderedProvenance = orderedObject(provenance, [
        'kind', 'legacyCodexId', 'legacySourceIndex', 'from',
        'canonicalWorldKey', 'canonicalWorldAddress', 'legacyLocation',
      ], { legacyLocation });
    }
  }
  return orderedProvenance === null ? null : orderedObject(value, [
    'recordId', 'speciesId', 'acquisition', 'provenance', 'firstForSpecies',
  ], { provenance: orderedProvenance });
};

const orderedLineage = (value) => {
  const fields = value?.kind === 'none' ? ['kind', 'generation']
    : value?.kind === 'legacy-parent-seeds'
      ? ['kind', 'generation', 'parentSeeds']
      : value?.kind === 'parent-creatures'
        ? ['kind', 'generation', 'parentCreatureIds'] : null;
  return fields === null ? null : orderedObject(value, fields);
};

const orderedAssignment = (value) => {
  if (value === null) return null;
  const fields = value?.kind === 'mission' ? ['kind', 'missionId']
    : value?.kind === 'recovery' ? ['kind', 'readyAtActivePlayMs'] : null;
  return fields === null ? undefined : orderedObject(value, fields);
};

const orderedBond = (value) => {
  if (value === null) return null;
  if (!Array.isArray(value?.memories)) return undefined;
  const memories = value.memories.map((memory) => orderedObject(memory, [
    'id', 'kind', 'worldKey', 'atActivePlayMs',
  ]));
  if (memories.some((memory) => memory === null)) return undefined;
  return orderedObject(value, [
    'level', 'memories', 'preferredRole', 'worldsSurvived',
    'guardianVictories', 'mementoIds',
  ], { memories });
};

const orderedCreature = (value) => {
  const lineage = orderedLineage(value?.lineage);
  const assignment = orderedAssignment(value?.assignment);
  const bond = orderedBond(value?.bond);
  return lineage === null || assignment === undefined || bond === undefined
    ? null : orderedObject(value, [
      'creatureId', 'speciesId', 'genomeIdentity', 'genome', 'nickname',
      'origin', 'acquisitionRecordId', 'lineage', 'xp', 'hurt', 'fed', 'brood',
      'assignment', 'bond',
    ], { lineage, assignment, bond });
};

const orderedProgress = (value) => {
  const worldAddress = orderedWorldAddress(value?.worldAddress);
  if (worldAddress === null || !Array.isArray(value?.successful)) return null;
  const successful = value.successful.map((row) => orderedObject(
    row, ['speciesId', 'source'],
  ));
  return successful.some((row) => row === null) ? null : orderedObject(value, [
    'worldKey', 'worldAddress', 'cycle', 'used', 'successful',
  ], { worldAddress, successful });
};

const orderedLegacyProtection = (value) => value === null ? null : orderedObject(value, [
  'schema', 'digest', 'jsonBytes', 'codexRows', 'uniqueSpecies', 'bioXRows',
  'scoutCodexId',
]);

const registeredMirrorForDigest = (mirror) => {
  if (!record(mirror)) return null;
  const catalogSpecies = mirror.catalogSpecies?.map((row) => orderedObject(row, [
    'speciesId', 'genomeIdentity', 'kingdom', 'genome', 'alias',
    'firstObservationId',
  ]));
  const discoveries = mirror.discoveries?.map(orderedDiscovery);
  const creatures = mirror.creatures?.map(orderedCreature);
  const specimenLots = mirror.specimenLots?.map((row) => orderedObject(row, [
    'lotId', 'speciesId', 'kind', 'quantity', 'origin', 'acquisitionRecordId',
  ]));
  const biosphereProgress = mirror.biosphereProgress?.map(orderedProgress);
  const legacyBioX = mirror.legacyBioX?.map((row) => orderedObject(row, [
    'legacyPlanetSeed', 'used', 'epochStamp', 'relation', 'canonicalWorldKey',
  ]));
  const legacyProtection = orderedLegacyProtection(mirror.legacyProtection);
  const rows = [
    catalogSpecies, discoveries, creatures, specimenLots, biosphereProgress,
    legacyBioX,
  ];
  if (rows.some((values) => !Array.isArray(values)
      || values.some((value) => value === null))
    || (mirror.legacyProtection !== null && legacyProtection === null)) return null;
  return orderedObject(mirror, [
    'schema', 'version', 'revision', 'mode', 'catalogSpecies', 'discoveries',
    'creatures', 'specimenLots', 'biosphereProgress', 'legacyBioX',
    'scoutCreatureId', 'legacyProtection',
  ], {
    catalogSpecies, discoveries, creatures, specimenLots, biosphereProgress,
    legacyBioX, legacyProtection,
  });
};

const inspectArc4Ownership = (rows) => {
  try {
    const found = [];
    for (const [segment, row] of Object.entries(rows ?? {})) {
      for (const namespace of Object.keys(row?.extensions ?? {})) {
        if (namespace.startsWith('arc4.ownership.')) found.push({ segment, namespace });
      }
    }
    found.sort((left, right) => ARC4_SEGMENT_ORDER[left.segment] - ARC4_SEGMENT_ORDER[right.segment]
      || (left.namespace < right.namespace ? -1 : left.namespace > right.namespace ? 1 : 0));
    if (!same(found, ARC4_OWNERSHIP_EXTENSION_TARGETS)) return null;
    const manifestCarrier = carrierAt(rows, 'player', 'arc4.ownership.manifest');
    const progressCarrier = carrierAt(rows, 'player', 'arc4.ownership.progress');
    const manifest = exactCanonicalCarrier(manifestCarrier);
    const progress = exactCanonicalCarrier(progressCarrier);
    if (!exactKeys(manifest, [
      'schema', 'version', 'revision', 'mode', 'fixedShardCount', 'rowCounts',
      'shardDigests', 'progressDigest', 'stateDigest', 'legacyProtection',
    ]) || manifest.schema !== 'cf-v2-ownership-manifest/v1'
      || manifest.version !== 1 || !counter(manifest.revision)
      || !['current', 'legacy-protected'].includes(manifest.mode)
      || manifest.fixedShardCount !== 4
      || !exactKeys(manifest.rowCounts, [
        'catalogSpecies', 'discoveries', 'creatures', 'specimenLots',
        'biosphereProgress', 'legacyBioX',
      ])
      || Object.values(manifest.rowCounts).some((value) => !counter(value) || value > 60_000)
      || !exactKeys(manifest.shardDigests, ARC4_SHARD_GROUPS.map(({ kind }) => kind))
      || !hexDigest(manifest.progressDigest) || !hexDigest(manifest.stateDigest)
      || !exactKeys(progress, ['schema', 'version', 'revision', 'digest', 'payload'])
      || progress.schema !== 'cf-v2-ownership-progress/v1' || progress.version !== 1
      || progress.revision !== manifest.revision || !hexDigest(progress.digest)
      || !exactKeys(progress.payload, ['biosphereProgress', 'legacyBioX', 'scoutCreatureId'])
      || !Array.isArray(progress.payload.biosphereProgress)
      || !Array.isArray(progress.payload.legacyBioX)
      || progress.payload.biosphereProgress.length !== manifest.rowCounts.biosphereProgress
      || progress.payload.legacyBioX.length !== manifest.rowCounts.legacyBioX
      || sha256(canonicalToolJson(progress.payload)) !== progress.digest
      || progress.digest !== manifest.progressDigest) return null;
    const groups = {};
    for (const group of ARC4_SHARD_GROUPS) {
      const expectedDigests = manifest.shardDigests[group.kind];
      if (!Array.isArray(expectedDigests) || expectedDigests.length !== 4
        || expectedDigests.some((value) => !hexDigest(value))) return null;
      const groupRows = [];
      let start = 0;
      for (let index = 0; index < 4; index++) {
        const shard = exactCanonicalCarrier(carrierAt(
          rows, group.segment, `${group.prefix}.${index}`,
        ));
        if (!exactKeys(shard, [
          'schema', 'version', 'kind', 'revision', 'index', 'count', 'start',
          'end', 'total', 'digest', 'rows',
        ]) || shard.schema !== 'cf-v2-ownership-shard/v1' || shard.version !== 1
          || shard.kind !== group.kind || shard.revision !== manifest.revision
          || shard.index !== index || shard.count !== 4
          || shard.start !== start || !counter(shard.end) || shard.end < shard.start
          || shard.total !== manifest.rowCounts[group.kind]
          || !Array.isArray(shard.rows) || shard.rows.length !== shard.end - shard.start
          || !hexDigest(shard.digest)
          || sha256(canonicalToolJson(shard.rows)) !== shard.digest
          || shard.digest !== expectedDigests[index]) return null;
        groupRows.push(...shard.rows);
        start = shard.end;
      }
      if (start !== manifest.rowCounts[group.kind]) return null;
      groups[group.kind] = groupRows;
    }
    const mirror = {
      schema: 'cf-v2-ownership-state/v1',
      version: 1,
      revision: manifest.revision,
      mode: manifest.mode,
      catalogSpecies: groups.catalogSpecies,
      discoveries: groups.discoveries,
      creatures: groups.creatures,
      specimenLots: groups.specimenLots,
      biosphereProgress: progress.payload.biosphereProgress,
      legacyBioX: progress.payload.legacyBioX,
      scoutCreatureId: progress.payload.scoutCreatureId,
      legacyProtection: manifest.legacyProtection,
    };
    const registeredMirror = registeredMirrorForDigest(mirror);
    if (registeredMirror === null) return null;
    const frozenMirror = Object.freeze(registeredMirror);
    return Object.freeze({
      manifest,
      progress,
      mirror: frozenMirror,
      stateDigestMatches: manifest.stateDigest === sha256(JSON.stringify(frozenMirror)),
    });
  } catch {
    return null;
  }
};

/* Arc 5A persists no second ownership mirror. Its one digest-only carrier is
   useful browser evidence only when this tool independently reconstructs the
   exact registered V1 source and the exact ordered V2 migration mirror. */
const arc5OwnershipTargetMirrorForDigest = (source) => {
  const registeredSource = registeredMirrorForDigest(source);
  if (registeredSource === null
    || registeredSource.schema !== ARC5_OWNERSHIP_SOURCE_SCHEMA
    || registeredSource.version !== 1) return null;
  return Object.freeze({
    schema: ARC5_OWNERSHIP_TARGET_SCHEMA,
    version: 2,
    revision: registeredSource.revision,
    source: registeredSource,
    bredAcquisitions: Object.freeze([]),
    creatures: registeredSource.creatures,
    creatureTombstones: Object.freeze([]),
    specimenLots: registeredSource.specimenLots,
    specimenTombstones: Object.freeze([]),
    scoutCreatureId: registeredSource.scoutCreatureId,
  });
};

const inspectArc5OwnershipMigration = (rows, ownership) => {
  const found = [];
  for (const [segment, row] of Object.entries(rows ?? {})) {
    for (const namespace of Object.keys(row?.extensions ?? {})) {
      if (namespace.startsWith(ARC5_OWNERSHIP_MIGRATION_PREFIX)) {
        found.push({ segment, namespace });
      }
    }
  }
  found.sort((left, right) => ARC4_SEGMENT_ORDER[left.segment] - ARC4_SEGMENT_ORDER[right.segment]
    || (left.namespace < right.namespace ? -1 : left.namespace > right.namespace ? 1 : 0));
  const namespaceInventoryMatches = same(
    found, [ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET],
  );
  const selected = carrierAt(
    rows,
    ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.segment,
    ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace,
  ) ?? (found.length === 1
    ? carrierAt(rows, found[0].segment, found[0].namespace) : null);
  const certificate = exactCanonicalCarrier(selected);
  const certificateShapeMatches = exactKeys(certificate, [
    'schema', 'version', 'sourceSchema', 'sourceVersion', 'sourceRevision',
    'sourceMode', 'sourceDigest', 'targetSchema', 'targetVersion',
    'targetRevision', 'targetMode', 'targetDigest',
  ])
    && certificate.schema === ARC5_OWNERSHIP_MIGRATION_SCHEMA
    && certificate.version === 1
    && certificate.sourceSchema === ARC5_OWNERSHIP_SOURCE_SCHEMA
    && certificate.sourceVersion === 1
    && counter(certificate.sourceRevision)
    && ['current', 'legacy-protected'].includes(certificate.sourceMode)
    && hexDigest(certificate.sourceDigest)
    && certificate.targetSchema === ARC5_OWNERSHIP_TARGET_SCHEMA
    && certificate.targetVersion === 2
    && counter(certificate.targetRevision)
    && ['current', 'legacy-protected'].includes(certificate.targetMode)
    && hexDigest(certificate.targetDigest);
  const source = ownership?.mirror ?? null;
  const target = source === null ? null : arc5OwnershipTargetMirrorForDigest(source);
  const sourceDigest = source === null ? null : sha256(JSON.stringify(source));
  const targetDigest = target === null ? null : sha256(JSON.stringify(target));
  const sourceFixedPointMatches = certificateShapeMatches
    && ownership?.stateDigestMatches === true
    && certificate.sourceRevision === source?.revision
    && certificate.sourceMode === source?.mode
    && certificate.sourceDigest === sourceDigest
    && certificate.sourceDigest === ownership?.manifest?.stateDigest;
  const targetFixedPointMatches = certificateShapeMatches && target !== null
    && certificate.targetRevision === target.revision
    && certificate.targetRevision === certificate.sourceRevision
    && certificate.targetMode === target.source.mode
    && certificate.targetMode === certificate.sourceMode
    && certificate.targetDigest === targetDigest;
  return Object.freeze({
    found: Object.freeze(found),
    carrier: selected ?? null,
    certificate: certificateShapeMatches ? certificate : null,
    source, target, sourceDigest, targetDigest,
    namespaceInventoryMatches,
    certificateShapeMatches,
    sourceFixedPointMatches,
    targetFixedPointMatches,
  });
};

const exactF4Authority = (rows, evidence) => {
  const carrier = carrierAt(rows, 'player', 'f4.authority');
  const authority = exactKeys(carrier, ['version', 'json'])
    && carrier?.version === 1 ? parseJson(carrier.json) : null;
  const rng = authority?.sessionRng;
  if (carrier?.version !== evidence?.authorityVersion
    || carrier?.json !== evidence?.authorityJson
    || !same(authority, evidence?.authority)
    || !exactKeys(authority, ['activePlayMs', 'sessionRng'])
    || !counter(authority.activePlayMs) || authority.activePlayMs > 10_000_000_000_000
    || !exactKeys(rng, ['seed', 'ordinal', 'draws'])
    || !uint32(rng.seed) || !uint32(rng.ordinal) || !record(rng.draws)
    || Object.entries(rng.draws).some(([domain, countValue]) => (
      !boundedText(domain, 64) || !uint32(countValue)
    ))) return false;
  const sortedDraws = Object.fromEntries(Object.entries(rng.draws)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
  /* F4 deliberately uses its public constructor order, not recursively
     canonical carrier order: activePlayMs/sessionRng, then seed/ordinal/draws.
     Draw-domain keys are the one sorted map inside that fixed envelope. */
  return carrier.json === JSON.stringify({
    activePlayMs: authority.activePlayMs,
    sessionRng: { seed: rng.seed, ordinal: rng.ordinal, draws: sortedDraws },
  });
};

const exactReceiptRows = (evidence) => {
  if (!Array.isArray(evidence?.receiptKeys)
    || !Array.isArray(evidence?.receiptRawRows)
    || !Array.isArray(evidence?.receiptRows)
    || evidence.receiptKeys.length !== evidence.receiptRawRows.length
    || evidence.receiptKeys.length !== evidence.receiptRows.length
    || new Set(evidence.receiptKeys).size !== evidence.receiptKeys.length) return false;
  return evidence.receiptRows.every((row, index) => (
    exactKeys(row, ['ordinal', 'kind', 'witness'])
    && uint32(row.ordinal) && boundedText(row.kind, 96)
    && typeof row.witness === 'string' && row.witness.length <= 4_096
    && evidence.receiptKeys[index] === `receipt:${row.ordinal}`
    && exactRawPair(evidence.receiptRawRows[index], row)
  ));
};

const legacyWorldWhere = (address) => ({
  type: 'planet',
  gal: {
    x: address?.galaxy?.x,
    y: address?.galaxy?.y,
    size: address?.galaxy?.size,
    sp: address?.galaxy?.sp,
    tilt: address?.galaxy?.tilt,
    rot: address?.galaxy?.rot,
    seed: address?.galaxy?.seed,
    home: address?.galaxy?.home,
    quasar: address?.galaxy?.quasar,
    dwarf: address?.galaxy?.dwarf,
  },
  star: { x: address?.star?.x, y: address?.star?.y, seed: address?.star?.seed },
  pseed: address?.planet?.seed,
});

const projectLegacyMirror = (mirror) => {
  try {
    if (mirror?.mode !== 'current') return null;
    const discoveries = new Map(mirror.discoveries.map((row) => [row.recordId, row]));
    const creatures = new Map(mirror.creatures.map((row) => [row.acquisitionRecordId, row]));
    const projectionRows = mirror.catalogSpecies.map((species) => {
      const discovery = discoveries.get(species.firstObservationId);
      if (!discovery || discovery.speciesId !== species.speciesId || !uint32(species?.genome?.seed)) {
        throw new Error('catalogue relation');
      }
      const legacyCodexId = `s${species.genome.seed}`;
      const order = discovery.provenance?.kind === 'legacy'
        ? discovery.provenance.legacySourceIndex : discovery.provenance?.sourceOrdinal;
      if (!counter(order)) throw new Error('source order');
      return { species, discovery, legacyCodexId, order };
    }).sort((left, right) => {
      const leftLegacy = left.discovery.provenance.kind === 'legacy';
      const rightLegacy = right.discovery.provenance.kind === 'legacy';
      if (leftLegacy !== rightLegacy) return leftLegacy ? -1 : 1;
      return left.order - right.order
        || (left.legacyCodexId < right.legacyCodexId ? -1
          : left.legacyCodexId > right.legacyCodexId ? 1 : 0);
    });
    if (new Set(projectionRows.map(({ legacyCodexId }) => legacyCodexId)).size
      !== projectionRows.length) return null;
    const biosphereOwners = new Map();
    for (const row of mirror.legacyBioX) {
      if (biosphereOwners.has(row.legacyPlanetSeed)) return null;
      biosphereOwners.set(row.legacyPlanetSeed, `legacy:${row.relation}`);
    }
    for (const row of mirror.biosphereProgress) {
      const seed = row?.worldAddress?.planet?.seed;
      const prior = biosphereOwners.get(seed);
      if (prior !== undefined && prior !== row.worldKey) return null;
      biosphereOwners.set(seed, row.worldKey);
    }
    const names = [];
    const codex = projectionRows.map(({ species, discovery, legacyCodexId }) => {
      const genome = structuredClone(species.genome);
      const creature = creatures.get(discovery.recordId);
      if (creature) {
        genome.gen = creature.lineage.generation;
        if (creature.lineage.kind === 'legacy-parent-seeds') {
          genome.parents = creature.lineage.parentSeeds;
        }
        for (const key of ['xp', 'hurt', 'fed', 'brood', 'assignment', 'bond']) {
          if (creature[key] !== null) genome[key] = creature[key];
        }
      }
      if (species.alias !== null) names.push([`c${legacyCodexId}`, species.alias]);
      const provenance = discovery.provenance;
      const from = provenance.kind === 'legacy'
        ? provenance.from : `Canonical world ${provenance.worldAddress.planet.seed}`;
      const where = provenance.kind === 'legacy'
        ? provenance.legacyLocation?.display ?? null : legacyWorldWhere(provenance.worldAddress);
      return { legacyCodexId, g: genome, f: from, w: where };
    });
    let scout = null;
    if (mirror.scoutCreatureId !== null) {
      const creature = mirror.creatures.find((row) => row.creatureId === mirror.scoutCreatureId);
      const owner = creature && projectionRows.find(({ species }) => (
        species.speciesId === creature.speciesId
      ));
      if (!owner) return null;
      scout = owner.legacyCodexId;
    }
    const bx = [
      ...mirror.legacyBioX.map((row) => [
        row.legacyPlanetSeed, [row.used, row.epochStamp],
      ]),
      ...mirror.biosphereProgress.map((row) => [
        row.worldAddress.planet.seed, [row.used, row.cycle],
      ]),
    ].sort((left, right) => left[0] - right[0]);
    return { codex, names, bx, scout };
  } catch {
    return null;
  }
};

const legacyMirrorMatches = (ownership, legacy) => {
  const projected = projectLegacyMirror(ownership?.mirror);
  if (projected === null || !record(legacy) || !Array.isArray(legacy.codex)
    || !Array.isArray(legacy.names) || !Array.isArray(legacy.bx)
    || (legacy.scout !== null && typeof legacy.scout !== 'string')) return false;
  const actualCodex = legacy.codex.map((entry) => ({
    legacyCodexId: uint32(entry?.g?.seed) ? `s${entry.g.seed}` : null,
    g: entry?.g,
    f: entry?.f,
    w: entry?.w ?? null,
  }));
  const ownedNames = new Set(projected.codex.map(({ legacyCodexId }) => `c${legacyCodexId}`));
  const actualNames = legacy.names.filter((row) => Array.isArray(row)
    && typeof row[0] === 'string' && ownedNames.has(row[0]));
  return same(actualCodex, projected.codex)
    && same(actualNames, projected.names)
    && same(legacy.bx, projected.bx)
    && legacy.scout === projected.scout;
};

const exactEverRecord = (value) => {
  if (!record(value)) return null;
  const fields = own(value, 'arrivals')
    ? ['v', 'hybrids', 'best', 'maxGen', 'scanhits', 'arrivals']
    : ['v', 'hybrids', 'best', 'maxGen', 'scanhits'];
  if (!exactKeys(value, fields) || value.v !== 1
    || !counter(value.hybrids) || !counter(value.best)
    || !counter(value.maxGen) || !counter(value.scanhits)
    || (own(value, 'arrivals') && !counter(value.arrivals))) return null;
  return Object.freeze({
    v: 1,
    hybrids: value.hybrids,
    best: value.best,
    maxGen: value.maxGen,
    scanhits: value.scanhits,
    ...(own(value, 'arrivals') ? { arrivals: value.arrivals } : {}),
  });
};

const inspectArc4V4OwnedCompatibility = (evidence, v5) => {
  const legacyEver = evidence?.legacy?.ever;
  const splitEver = v5?.rows?.player?.data?.ever;
  const legacyBestRank = evidence?.legacy?.br;
  const splitBestRank = v5?.rows?.player?.data?.br;
  const checkedLegacyEver = exactEverRecord(legacyEver);
  const checkedSplitEver = exactEverRecord(splitEver);
  if (checkedLegacyEver === null || checkedSplitEver === null
    || !counter(legacyBestRank) || !counter(splitBestRank)) return null;
  const legacy = Object.freeze({ ever: checkedLegacyEver, br: legacyBestRank });
  const split = Object.freeze({ ever: checkedSplitEver, br: splitBestRank });
  return same(legacy, split) ? Object.freeze({ legacy, split }) : null;
};

const counterProjection = (value) => value === null ? null : Object.freeze({
  legacy: Object.freeze({
    hybrids: value.legacy.ever.hybrids,
    best: value.legacy.ever.best,
    maxGen: value.legacy.ever.maxGen,
    bestRank: value.legacy.br,
  }),
  split: Object.freeze({
    hybrids: value.split.ever.hybrids,
    best: value.split.ever.best,
    maxGen: value.split.ever.maxGen,
    bestRank: value.split.br,
  }),
});

export const assessArc4DurableEvidence = (evidence = {}) => {
  const v5 = inspectV5Rows(evidence);
  const v5RowsComplete = V5_SEGMENTS.every(({ segment }) => (
    v5.checks[`${segment}Row`] === true
  )) && v5.checks.extensionAggregate === true
    && v5.checks.uniqueEnvelopeFields === true;
  const inspectedOwnership = v5RowsComplete ? inspectArc4Ownership(v5.rows) : null;
  const inspectedArc5 = v5RowsComplete
    ? inspectArc5OwnershipMigration(v5.rows, inspectedOwnership) : null;
  const v4OwnedCompatibility = v5RowsComplete
    ? inspectArc4V4OwnedCompatibility(evidence, v5) : null;
  const v4OwnedCounters = counterProjection(v4OwnedCompatibility);
  const checks = {
    captured: record(evidence),
    revision: typeof evidence?.revisionRaw === 'string'
      && counter(evidence?.revision) && evidence.revisionRaw === String(evidence.revision),
    legacyRaw: exactRawPair(evidence?.legacyRaw, evidence?.legacy)
      && evidence?.legacy?.v === 4,
    playerRow: v5.checks.playerRow === true,
    creaturesRow: v5.checks.creaturesRow === true,
    catalogRow: v5.checks.catalogRow === true,
    inventoryRow: v5.checks.inventoryRow === true,
    settingsRow: v5.checks.settingsRow === true,
    extensionAggregate: v5.checks.extensionAggregate === true,
    uniqueEnvelopeFields: v5.checks.uniqueEnvelopeFields === true,
    v4Envelope: v5.checks.v4Envelope === true,
    arc4NamespaceInventory: inspectedOwnership !== null,
    ownershipStateDigest: inspectedOwnership?.stateDigestMatches === true,
    ownershipRevision: inspectedOwnership !== null
      && inspectedOwnership.manifest.revision === evidence?.captureRevision,
    ownershipProjection: inspectedOwnership !== null
      && same(inspectedOwnership.mirror, evidence?.captureState),
    arc5NamespaceInventory: inspectedArc5?.namespaceInventoryMatches === true,
    arc5CertificateShape: inspectedArc5?.certificateShapeMatches === true,
    arc5SourceFixedPoint: inspectedArc5?.sourceFixedPointMatches === true,
    arc5TargetFixedPoint: inspectedArc5?.targetFixedPointMatches === true,
    f4Authority: v5RowsComplete && exactF4Authority(v5.rows, evidence),
    receiptRows: exactReceiptRows(evidence),
    v4Mirror: inspectedOwnership !== null
      && legacyMirrorMatches(inspectedOwnership, evidence?.legacy),
    v4OwnedCounters: v4OwnedCounters !== null,
  };
  return assessment('Arc 4 durable evidence', checks, {
    ownership: inspectedOwnership,
    ownershipV2: inspectedArc5?.target ?? null,
    arc5Migration: inspectedArc5,
    v4OwnedCounters,
    v4OwnedCompatibility,
  });
};

export const arc4DurableEvidenceComplete = (evidence) => (
  assessArc4DurableEvidence(evidence).ok
);

export const projectArc4OwnershipEvidence = (evidence) => {
  const result = assessArc4DurableEvidence(evidence);
  return result.ok ? result.ownership?.mirror ?? null : null;
};

export const projectArc5OwnershipMigrationEvidence = (evidence) => {
  const result = assessArc4DurableEvidence(evidence);
  if (!result.ok || result.arc5Migration?.certificate === null) return null;
  return Object.freeze({
    target: ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
    carrier: result.arc5Migration.carrier,
    certificate: result.arc5Migration.certificate,
    source: result.arc5Migration.source,
    targetMirror: result.arc5Migration.target,
    sourceDigest: result.arc5Migration.sourceDigest,
    targetDigest: result.arc5Migration.targetDigest,
  });
};

export const projectArc4V4OwnedCounters = (evidence) => {
  const result = assessArc4DurableEvidence(evidence);
  return result.ok ? result.v4OwnedCounters : null;
};

/** Complete Arc 4-owned legacy-compatibility projection. The older counter
 * projector above stays byte/shape compatible for Glass consumers. */
export const projectArc4V4OwnedCompatibility = (evidence) => {
  const result = assessArc4DurableEvidence(evidence);
  return result.ok ? result.v4OwnedCompatibility : null;
};

/* One transaction reads all split rows and receipt bytes. The returned value
   deliberately repeats parsed Arc 4/F4 projections: the Node classifier
   binds each repeat back to its exact carrier JSON before using it. */
export const ARC4_DURABLE_READ_EXPRESSION = `(async()=>{const open=indexedDB.open('cf-v2-slice');
  const db=await new Promise((resolve,reject)=>{open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error)});
  try{const tx=db.transaction(['meta','player','creatures','catalog','inventory','settings','receipts'],'readonly'),done=new Promise((resolve,reject)=>{
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Arc 4 evidence read aborted'))});
    const get=(store,key)=>new Promise((resolve,reject)=>{const q=tx.objectStore(store).get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
    const all=(method)=>new Promise((resolve,reject)=>{const q=tx.objectStore('receipts')[method]();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
    const [revisionRaw,legacyRaw,playerRaw,creaturesRaw,catalogRaw,inventoryRaw,settingsRaw,receiptKeys,receiptRawRows]=await Promise.all([
      get('meta','f3:revision'),get('meta','save'),get('player','v5:player'),get('creatures','v5:creatures'),get('catalog','v5:catalog'),get('inventory','v5:inventory'),get('settings','v5:settings'),all('getAllKeys'),all('getAll')]);await done;
    const parse=(raw)=>{try{return JSON.parse(String(raw))}catch{return null}};
    const playerRow=parse(playerRaw),creaturesRow=parse(creaturesRaw),catalogRow=parse(catalogRaw),inventoryRow=parse(inventoryRaw),settingsRow=parse(settingsRaw),legacy=parse(legacyRaw);
    const authorityCarrier=playerRow?.extensions?.['f4.authority']??null,manifestCarrier=playerRow?.extensions?.['arc4.ownership.manifest']??null;
    const authority=authorityCarrier?parse(authorityCarrier.json):null,manifest=manifestCarrier?parse(manifestCarrier.json):null;
    const groups={catalogSpecies:[],discoveries:[],creatures:[],specimenLots:[]};
    for(const [kind,row,prefix] of [['catalogSpecies',catalogRow,'arc4.ownership.catalog'],['discoveries',catalogRow,'arc4.ownership.discoveries'],['creatures',creaturesRow,'arc4.ownership.creatures'],['specimenLots',inventoryRow,'arc4.ownership.specimens']]){
      for(let i=0;i<4;i++){const carrier=row?.extensions?.[prefix+'.'+i],shard=carrier?parse(carrier.json):null;if(Array.isArray(shard?.rows))groups[kind].push(...shard.rows)}}
    const progressCarrier=playerRow?.extensions?.['arc4.ownership.progress']??null,progress=progressCarrier?parse(progressCarrier.json):null;
    const captureState=manifest&&progress?{schema:'cf-v2-ownership-state/v1',version:1,revision:manifest.revision,mode:manifest.mode,catalogSpecies:groups.catalogSpecies,discoveries:groups.discoveries,creatures:groups.creatures,specimenLots:groups.specimenLots,biosphereProgress:progress.payload?.biosphereProgress??null,legacyBioX:progress.payload?.legacyBioX??null,scoutCreatureId:progress.payload?.scoutCreatureId??null,legacyProtection:manifest.legacyProtection}:null;
    return {revisionRaw:revisionRaw===undefined?null:String(revisionRaw),revision:Number(revisionRaw),legacyRaw:legacyRaw===undefined?null:String(legacyRaw),legacy,
      playerRaw:playerRaw===undefined?null:String(playerRaw),playerRow,creaturesRaw:creaturesRaw===undefined?null:String(creaturesRaw),creaturesRow,catalogRaw:catalogRaw===undefined?null:String(catalogRaw),catalogRow,inventoryRaw:inventoryRaw===undefined?null:String(inventoryRaw),inventoryRow,settingsRaw:settingsRaw===undefined?null:String(settingsRaw),settingsRow,
      authorityVersion:authorityCarrier?.version??null,authorityJson:authorityCarrier?.json??null,authority,captureRevision:manifest?.revision??null,captureState,
      receiptKeys:receiptKeys.map(String),receiptRawRows:receiptRawRows.map(String),receiptRows:receiptRawRows.map((raw)=>parse(raw))};
  }finally{db.close()}})()`;

export const buildArc4DurableReadExpression = () => ARC4_DURABLE_READ_EXPRESSION;

export const ARC4_CAPTURE_UI_EXPRESSION = `(()=>{const S=window.__CF_SLICE__,state=S?.api?.state?.(),card=document.getElementById('survey'),mount=card?.querySelector('[data-capture-card-body]'),text=(node)=>(node?.textContent||'').replace(/\\s+/g,' ').trim(),rect=(node)=>{const r=node?.getBoundingClientRect?.();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null},point=(node)=>{const r=node?.getBoundingClientRect?.();if(!r)return null;const x=(r.left+r.right)/2,y=(r.top+r.bottom)/2,hit=document.elementFromPoint(x,y);return {x,y,tag:hit?.tagName??null,verb:hit?.closest?.('[data-capture-action]')?.getAttribute('data-capture-action')??null,close:hit?.closest?.('[data-survey-close]')!==null}},rows=[...mount?.querySelectorAll?.('[data-capture-row]')??[]].map((row)=>{const verb=row.getAttribute('data-capture-row'),button=row.querySelector('button[data-capture-action]'),odds=row.querySelector('[data-capture-odds]');return {verb,status:row.getAttribute('data-status'),semanticKey:row.getAttribute('data-semantic-key'),title:text(row.querySelector('.capture-card-row-title')),detail:text(row.querySelector('[data-capture-detail]')),odds:odds?{text:text(odds),eligibleCount:Number(odds.getAttribute('data-eligible-count')),overallChance:Number(odds.getAttribute('data-overall-chance')),chanceMin:Number(odds.getAttribute('data-chance-min')),chanceMax:Number(odds.getAttribute('data-chance-max'))}:null,button:{exists:!!button,connected:button?.isConnected===true,tag:button?.tagName??null,label:text(button),verb:button?.getAttribute('data-capture-action')??null,focusKey:button?.getAttribute('data-focus-key')??null,modelEnabled:button?.getAttribute('data-model-enabled')??null,disabled:button?.disabled??null,ariaDisabled:button?.getAttribute('aria-disabled')??null,rect:rect(button),point:point(button)}}}),budget=mount?.querySelector('[data-capture-budget]'),status=mount?.querySelector('[data-capture-status]'),close=card?.querySelector('[data-survey-close]');return {schema:'cf-v2-slice-arc4-capture-ui-evidence/v1',cardOpen:card?.style.display!=='none'&&card?.getAttribute('aria-hidden')!=='true',cardTitle:text(card?.querySelector('[data-sel=title]')),planetsideHeading:text(document.querySelector('#planetside .planetside-heading')),cardRect:rect(card),mountCount:card?.querySelectorAll('[data-capture-card-body]').length??0,directCloseCount:card?.querySelectorAll(':scope > .survey-head [data-survey-close]').length??0,close:{exists:!!close,tag:close?.tagName??null,label:close?.getAttribute('aria-label')??null,rect:rect(close),point:point(close)},controller:mount?.getAttribute('data-capture-card-controller')??null,contextKey:mount?.getAttribute('data-capture-context-key')??null,ariaBusy:mount?.getAttribute('aria-busy')??null,summary:text(mount?.querySelector('.capture-card-summary')),budget:budget?{text:text(budget),yield:Number(budget.getAttribute('data-yield')),used:Number(budget.getAttribute('data-used')),remaining:Number(budget.getAttribute('data-remaining')),cycle:Number(budget.getAttribute('data-cycle')),recoveryRemainingActivePlayMs:Number(budget.getAttribute('data-recovery-remaining-active-play-ms'))}:null,rows,status:{hidden:status?.hidden??null,kind:status?.getAttribute('data-kind')??null,convergence:status?.getAttribute('data-convergence')??null,text:text(status)},diagnostics:state?.capture?.card??null,captureState:state?.capture??null,ownershipV2:state?.ownershipV2??null,persistence:state?.persistence??null,activeElement:{verb:document.activeElement?.getAttribute?.('data-capture-action')??null,semanticKey:document.activeElement?.closest?.('[data-semantic-key]')?.getAttribute('data-semantic-key')??null,status:document.activeElement?.matches?.('[data-capture-status]')===true,close:document.activeElement?.matches?.('[data-survey-close]')===true,focusVisible:document.activeElement?.matches?.(':focus-visible')===true}}})()`;

export const buildArc4CaptureUiExpression = () => ARC4_CAPTURE_UI_EXPRESSION;

const captureStateOf = (value) => value?.capture ?? value;
const persistenceStateOf = (value) => value?.persistence ?? null;
const ownershipV2StateOf = (value) => value?.ownershipV2 ?? null;

const arc5AppDiagnosticsShape = (value) => exactKeys(value, [
  'schema', 'stateKind', 'mode', 'protection', 'bootstrapPending',
  'bootstrapOutcome', 'revision', 'sourceRevision', 'sourceDigest',
  'targetDigest', 'acquisitions', 'bredAcquisitions', 'creatures',
  'creatureTombstones', 'specimenLots', 'specimenTombstones', 'biospheres',
])
  && value.schema === 'cf-v2-arc5-app-state/v1'
  && ['loaded', 'unavailable'].includes(value.stateKind)
  && typeof value.bootstrapPending === 'boolean'
  && (value.bootstrapOutcome === null || boundedText(value.bootstrapOutcome, 128))
  && (value.protection === null || boundedText(value.protection, 256))
  && [
    value.acquisitions, value.bredAcquisitions, value.creatures,
    value.creatureTombstones, value.specimenLots, value.specimenTombstones,
    value.biospheres,
  ].every(counter)
  && (value.stateKind === 'loaded'
    ? ['current', 'legacy-protected'].includes(value.mode)
      && counter(value.revision) && counter(value.sourceRevision)
      && hexDigest(value.sourceDigest) && hexDigest(value.targetDigest)
    : value.mode === null && value.revision === null && value.sourceRevision === null
      && value.sourceDigest === null && value.targetDigest === null);

const expectedArc5Outcome = (actual, expected) => expected === undefined
  ? boundedText(actual, 128)
  : Array.isArray(expected) ? expected.includes(actual) : actual === expected;

export const arc5OwnershipV2RuntimeExact = (
  raw, value, { bootstrapOutcome = undefined } = {},
) => {
  const durable = assessArc4DurableEvidence(raw);
  const diagnostic = ownershipV2StateOf(value);
  const migration = durable.arc5Migration;
  const source = migration?.source;
  const target = migration?.target;
  if (!durable.ok || !arc5AppDiagnosticsShape(diagnostic)
    || diagnostic.stateKind !== 'loaded' || target === null) return false;
  return diagnostic.mode === source.mode
    && diagnostic.protection === (source.mode === 'current' ? null : 'legacy-protected')
    && diagnostic.bootstrapPending === false
    && expectedArc5Outcome(diagnostic.bootstrapOutcome, bootstrapOutcome)
    && diagnostic.revision === target.revision
    && diagnostic.sourceRevision === source.revision
    && diagnostic.sourceDigest === migration.sourceDigest
    && diagnostic.targetDigest === migration.targetDigest
    && diagnostic.acquisitions === source.discoveries.length
    && diagnostic.bredAcquisitions === 0
    && diagnostic.creatures === target.creatures.length
    && diagnostic.creatureTombstones === 0
    && diagnostic.specimenLots === target.specimenLots.length
    && diagnostic.specimenTombstones === 0
    && diagnostic.biospheres === source.biosphereProgress.length;
};

const arc5OwnershipV2UnavailableExact = (
  value, { protection = 'committed-publication-reload', bootstrapOutcome } = {},
) => {
  const diagnostic = ownershipV2StateOf(value);
  return arc5AppDiagnosticsShape(diagnostic)
    && diagnostic.stateKind === 'unavailable'
    && diagnostic.protection === protection
    && diagnostic.bootstrapPending === false
    && expectedArc5Outcome(diagnostic.bootstrapOutcome, bootstrapOutcome)
    && diagnostic.acquisitions === 0 && diagnostic.bredAcquisitions === 0
    && diagnostic.creatures === 0 && diagnostic.creatureTombstones === 0
    && diagnostic.specimenLots === 0 && diagnostic.specimenTombstones === 0
    && diagnostic.biospheres === 0;
};

const stableOwnershipV2Projection = (value) => {
  const diagnostic = ownershipV2StateOf(value);
  return diagnostic === null ? null : {
    stateKind: diagnostic.stateKind,
    mode: diagnostic.mode,
    protection: diagnostic.protection,
    bootstrapPending: diagnostic.bootstrapPending,
    bootstrapOutcome: diagnostic.bootstrapOutcome,
    revision: diagnostic.revision,
    sourceRevision: diagnostic.sourceRevision,
    sourceDigest: diagnostic.sourceDigest,
    targetDigest: diagnostic.targetDigest,
    acquisitions: diagnostic.acquisitions,
    bredAcquisitions: diagnostic.bredAcquisitions,
    creatures: diagnostic.creatures,
    creatureTombstones: diagnostic.creatureTombstones,
    specimenLots: diagnostic.specimenLots,
    specimenTombstones: diagnostic.specimenTombstones,
    biospheres: diagnostic.biospheres,
  };
};

const exactUiRows = (value) => Array.isArray(value?.rows)
  && value.rows.length === ARC4_CAPTURE_VERBS.length
  && same(value.rows.map(({ verb }) => verb), ARC4_CAPTURE_VERBS)
  && new Set(value.rows.map(({ verb }) => verb)).size === ARC4_CAPTURE_VERBS.length;

export const arc4CaptureUiSnapshotComplete = (value) => {
  if (value?.schema !== ARC4_CAPTURE_UI_EVIDENCE_SCHEMA
    || value.cardOpen !== true || value.mountCount !== 1 || value.directCloseCount !== 1
    || value.controller !== 'v1' || !boundedText(value.contextKey, 512)
    || !boundedText(value.cardTitle, 256) || !boundedText(value.planetsideHeading, 256)
    || !boundedText(value.summary, 2_048) || !exactUiRows(value)
    || !record(value.status) || !record(value.diagnostics)
    || !arc5AppDiagnosticsShape(value.ownershipV2)
    || value.diagnostics.schema !== 'cf-v2-capture-card-diagnostics/v1'
    || value.diagnostics.attachedMountCount !== 1
    || value.diagnostics.actionControlCount !== 3
    || value.diagnostics.delegatedListenerCount !== 1
    || value.diagnostics.contextKey !== value.contextKey
    || value.close?.exists !== true || value.close?.tag !== 'BUTTON'
    || !/close survey card/i.test(value.close?.label ?? '')) return false;
  if (value.budget !== null && (!record(value.budget)
    || !counter(value.budget.yield) || !counter(value.budget.used)
    || !counter(value.budget.remaining) || !counter(value.budget.cycle)
    || !counter(value.budget.recoveryRemainingActivePlayMs)
    || value.budget.used + value.budget.remaining !== value.budget.yield)) return false;
  return value.rows.every((row) => {
    const button = row?.button;
    const ready = row?.status === 'ready';
    if (!['ready', 'empty', 'depleted', 'unavailable'].includes(row?.status)
      || row?.semanticKey !== `capture:${row?.verb}`
      || !boundedText(row?.title, 256) || !boundedText(row?.detail, 2_048)
      || button?.exists !== true || button?.connected !== true || button?.tag !== 'BUTTON'
      || button?.verb !== row?.verb || button?.focusKey !== `capture:${row?.verb}`
      || !['true', 'false'].includes(button?.modelEnabled)
      || typeof button?.disabled !== 'boolean'
      || button?.ariaDisabled !== String(button.disabled)) return false;
    if (ready) {
      return record(row.odds) && counter(row.odds.eligibleCount) && row.odds.eligibleCount > 0
        && probability(row.odds.overallChance) && row.odds.overallChance > 0
        && probability(row.odds.chanceMin) && row.odds.chanceMin > 0
        && probability(row.odds.chanceMax) && row.odds.chanceMax > 0
        && row.odds.chanceMin <= row.odds.overallChance
        && row.odds.overallChance <= row.odds.chanceMax
        && !/(?:^|\D)0(?:\.0+)?%/u.test(row.odds.text ?? '');
    }
    return row.odds === null;
  });
};

const ARC4_ACTIVE_PLAY_COUNTDOWN_PATTERN = /\b[0-9]+:[0-5][0-9](?= of active play remaining\.)/gu;

const activePlayCountdownText = (activePlayMs) => {
  const seconds = Math.max(0, Math.ceil(activePlayMs / 1_000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
};

const stableBudgetText = (text) => typeof text === 'string'
  ? text.replace(ARC4_ACTIVE_PLAY_COUNTDOWN_PATTERN, '<active-play-countdown>')
  : text;

const exactBudgetCountdownText = (budget) => {
  const matches = typeof budget?.text === 'string'
    ? budget.text.match(ARC4_ACTIVE_PLAY_COUNTDOWN_PATTERN) : null;
  return matches?.length === 1
    && matches[0] === activePlayCountdownText(
      budget.recoveryRemainingActivePlayMs,
    );
};

const uiFacts = (value) => ({
  cardTitle: value?.cardTitle,
  planetsideHeading: value?.planetsideHeading,
  contextKey: value?.contextKey,
  summary: value?.summary,
  /* Normalize only the displayed countdown token. Every surrounding budget
     word remains stable evidence; the exact token and millisecond authority
     stay bound separately by exactActivePlayProjection(). */
  budget: value?.budget === null ? null : {
    text: stableBudgetText(value?.budget?.text),
    yield: value?.budget?.yield,
    used: value?.budget?.used,
    remaining: value?.budget?.remaining,
    cycle: value?.budget?.cycle,
  },
  rows: value?.rows?.map((row) => ({
    verb: row?.verb,
    status: row?.status,
    semanticKey: row?.semanticKey,
    title: row?.title,
    detail: row?.detail,
    odds: row?.odds,
    modelEnabled: row?.button?.modelEnabled,
  })),
});

const uiIdleAvailabilityHonest = (value) => value?.ariaBusy === 'false'
  && value?.diagnostics?.pendingWork === 0
  && value?.diagnostics?.convergenceLatched === false
  && value?.rows?.every((row) => row?.button?.disabled
    === (row?.button?.modelEnabled !== 'true'));

const uiPendingAvailability = (value, verb) => value?.ariaBusy === 'true'
  && value?.status?.hidden === false && value?.status?.kind === 'pending'
  && value?.status?.convergence === 'none'
  && /no capture, attempt spend, compendium page or reward is published until the durable outcome settles/i
    .test(value?.status?.text ?? '')
  && value?.diagnostics?.pendingWork === 1
  && value?.diagnostics?.convergenceLatched === false
  && value?.diagnostics?.lastRequest?.verb === verb
  && value?.diagnostics?.lastOutcome === null
  && value?.rows?.every((row) => row?.button?.disabled === true
    && row?.button?.ariaDisabled === 'true');

const exactRenderedReceipt = (receipt, expected) => record(receipt)
  && counter(receipt.serial)
  && receipt.mode === expected.mode
  && receipt.galaxyKey === expected.galaxyKey
  && receipt.starKey === expected.starKey
  && receipt.worldKey === expected.worldKey;

const exactPertarWorldAddress = (value) => same(
  value, ARC4_PERTAR_FIXTURE.worldAddress,
);

const fnv1a32 = (text) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const inspectPertarArc2Capability = (evidence) => {
  const carrierValue = evidence?.inventoryRow?.extensions?.['arc2.loot'];
  const source = parseJson(carrierValue?.json);
  const inventory = source?.inventory;
  const stackableCounts = source?.stackableCounts;
  if (!exactKeys(carrierValue, ['version', 'json']) || carrierValue.version !== 1
    || carrierValue.json !== JSON.stringify(source)
    || !exactKeys(source, ['kind', 'inventory', 'stackableCounts'])
    || source.kind !== 'inventory'
    || !exactKeys(inventory, [
      'schema', 'revision', 'capacity', 'entries', 'equipped', 'pendingRewards',
    ]) || inventory.schema !== 1 || !counter(inventory.revision)
    || !counter(inventory.capacity) || inventory.capacity < 1
    || !Array.isArray(inventory.entries) || !Array.isArray(inventory.equipped)
    || !Array.isArray(inventory.pendingRewards) || !Array.isArray(stackableCounts)) return null;
  const entries = new Map();
  for (const entry of inventory.entries) {
    const instance = entry?.instance;
    if (!exactKeys(entry, ['instance', 'favorite', 'locked'])
      || typeof entry.favorite !== 'boolean' || typeof entry.locked !== 'boolean'
      || !exactKeys(instance, [
        'schema', 'tableVersion', 'construction', 'instanceId', 'baseId', 'baseName',
        'slot', 'baseTier', 'itemLevel', 'quality', 'rarityTier', 'rarity', 'tags',
        'baseEffects', 'implicits', 'naturalAffixes', 'upgrade', 'sockets',
        'generation', 'legacyAffix', 'provenance',
      ]) || instance.schema !== 1 || instance.tableVersion !== 1
      || !boundedText(instance.instanceId, 512) || entries.has(instance.instanceId)
      || !record(instance.baseEffects) || !Array.isArray(instance.naturalAffixes)) return null;
    entries.set(instance.instanceId, instance);
  }
  const sourceParts = [];
  const inventoryJson = JSON.stringify(inventory);
  const loadoutCanonical = `${inventoryJson}\n${JSON.stringify(stackableCounts)}`;
  const loadoutFingerprint = `el1:${loadoutCanonical.length}:${fnv1a32(loadoutCanonical)
    .toString(16).padStart(8, '0')}`;
  sourceParts.push(`loadout:${loadoutFingerprint}`, `inventory-revision:${inventory.revision}`);
  const equippedIds = [];
  let contactCapturePoints = 0;
  const addContact = (key, value) => {
    if (key !== 'contact') return true;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return false;
    contactCapturePoints += value;
    return Number.isFinite(contactCapturePoints) && contactCapturePoints >= 0;
  };
  const equippedSlots = new Set();
  for (const binding of inventory.equipped) {
    if (!exactKeys(binding, ['slot', 'instanceId'])
      || !boundedText(binding.slot, 64) || !boundedText(binding.instanceId, 512)
      || equippedSlots.has(binding.slot)) return null;
    equippedSlots.add(binding.slot);
    const instance = entries.get(binding.instanceId);
    if (!instance || instance.slot !== binding.slot) return null;
    equippedIds.push(binding.instanceId);
    sourceParts.push(`equipped:${binding.slot}:${binding.instanceId}:${fnv1a32(JSON.stringify(instance))}`);
    for (const [key, value] of Object.entries(instance.baseEffects)) {
      if (!addContact(key, value)) return null;
    }
    for (const affix of instance.naturalAffixes) {
      if (!exactKeys(affix, ['affixId', 'tier', 'value', 'role'])
        || !addContact(affix.affixId, affix.value)) return null;
    }
    if (instance.legacyAffix !== null
      && (!exactKeys(instance.legacyAffix, ['affixId', 'value', 'forBaseId'])
        || !addContact(instance.legacyAffix.affixId, instance.legacyAffix.value))) return null;
  }
  const stackableIds = new Set();
  const systemIds = [];
  for (const row of stackableCounts) {
    if (!exactKeys(row, ['baseId', 'count']) || !boundedText(row.baseId, 128)
      || !counter(row.count) || row.count < 1 || stackableIds.has(row.baseId)) return null;
    stackableIds.add(row.baseId);
    sourceParts.push(`stackable:${row.baseId}:${row.count}`);
    if (ARC4_PERTAR_SYSTEM_ITEM_IDS.includes(row.baseId)) systemIds.push(row.baseId);
  }
  if (!Number.isSafeInteger(contactCapturePoints)) return null;
  const engineeringCanonical = sourceParts.join('\n');
  const engineeringFingerprint = `ec1:${engineeringCanonical.length}:${fnv1a32(
    engineeringCanonical,
  ).toString(16).padStart(8, '0')}`;
  const canonical = [...sourceParts, `contact:${contactCapturePoints}`].join('\n');
  const fingerprint = `ac1:${canonical.length}:${fnv1a32(canonical)
    .toString(16).padStart(8, '0')}`;
  return Object.freeze({
    loadoutFingerprint,
    engineeringFingerprint,
    fingerprint,
    inventoryRevision: inventory.revision,
    equippedInstanceIds: Object.freeze(equippedIds),
    systemIds: Object.freeze(systemIds),
    contactCapturePoints,
  });
};

const exactPertarCapability = (evidence) => {
  const value = inspectPertarArc2Capability(evidence);
  return value !== null
    && sha256(evidence?.inventoryRow?.extensions?.['arc2.loot']?.json ?? '')
      === ARC4_PERTAR_FIXTURE.arc2LootSha256
    && value.fingerprint === ARC4_PERTAR_FIXTURE.capabilityFingerprint
    && value.loadoutFingerprint === ARC4_PERTAR_SOURCE_FACTS.arc2LoadoutFingerprint
    && value.engineeringFingerprint
      === ARC4_PERTAR_SOURCE_FACTS.engineeringCapabilityFingerprint
    && value.inventoryRevision === ARC4_PERTAR_FIXTURE.inventoryRevision
    && same(value.equippedInstanceIds, ARC4_PERTAR_SOURCE_FACTS.equippedInstanceIds)
    && same(value.systemIds, ARC4_PERTAR_SOURCE_FACTS.installedSystemIds)
    && value.contactCapturePoints === ARC4_PERTAR_FIXTURE.contactCapturePoints
    ? value : null;
};

/* Browser-free source-closure oracle for the two seams that prevented the
   mapped Pertar fixture from ever becoming actionable. These rules mirror
   the public Charter ladder and the Arc 3 legacy seed resolver over complete,
   explicit inputs; they neither consult a page nor trust a copied PASS bit. */
const projectArc4PertarShipSource = ({ systemIds, ascChapter } = {}) => {
  if (!Array.isArray(systemIds) || !counter(ascChapter)
    || ascChapter > 3 || new Set(systemIds).size !== systemIds.length
    || systemIds.some((id) => !ARC4_PERTAR_SYSTEM_ITEM_IDS.includes(id))) return null;
  const installed = ARC4_PERTAR_SYSTEM_ITEM_IDS.filter((id) => systemIds.includes(id));
  if (!same(installed, systemIds)) return null;
  const stage = ascChapter >= 3 || installed.includes('igdrive') ? 3
    : installed.includes('array') ? 2
      : installed.includes('jumpdrive') ? 1 : 0;
  return Object.freeze({
    chassisStage: stage,
    installedSystemIds: Object.freeze(installed),
    hardpoints: Object.freeze({
      array: installed.includes('array'),
      autoext: installed.includes('autoext'),
      cscoop: installed.includes('cscoop'),
    }),
    provenance: stage === 3 && ascChapter >= 3 && !installed.includes('igdrive')
      ? 'legacy-charter-refit' : 'owned-items',
  });
};

const arc4PertarRouteAllowedFromShip = (ship) => {
  const stage = ship?.chassisStage;
  if (!counter(stage) || stage > 3) return false;
  if (stage >= 3) return true;
  if (ARC4_PERTAR_FIXTURE.galaxy.seed !== 999) return false;
  if (stage >= 2) return true;
  if (ARC4_PERTAR_FIXTURE.publicStar.seed === 424_242) return true;
  return stage === 1 && Math.hypot(
    ARC4_PERTAR_FIXTURE.publicStar.x - 560,
    ARC4_PERTAR_FIXTURE.publicStar.y - 170,
  ) <= 300;
};

const classifyArc4PertarLegacySkimSources = (skimRows, sourceStarSeeds) => {
  if (!Array.isArray(skimRows) || !Array.isArray(sourceStarSeeds)
    || sourceStarSeeds.some((seed) => !uint32(seed))) return null;
  const sourceCounts = new Map();
  for (const seed of sourceStarSeeds) {
    sourceCounts.set(seed, (sourceCounts.get(seed) ?? 0) + 1);
  }
  const missingStarSeeds = [];
  const ambiguousStarSeeds = [];
  const seen = new Set();
  for (const row of skimRows) {
    if (!Array.isArray(row) || row.length !== 2 || !uint32(row[0])
      || !counter(row[1]) || row[1] < 1 || seen.has(row[0])) return null;
    seen.add(row[0]);
    const matches = sourceCounts.get(row[0]) ?? 0;
    if (matches === 0) missingStarSeeds.push(row[0]);
    else if (matches > 1) ambiguousStarSeeds.push(row[0]);
  }
  const legacyDiagnostics = Object.freeze({
    missingWorldSeeds: Object.freeze([]),
    ambiguousWorldSeeds: Object.freeze([]),
    missingStarSeeds: Object.freeze(missingStarSeeds),
    ambiguousStarSeeds: Object.freeze(ambiguousStarSeeds),
  });
  if (ambiguousStarSeeds.length > 0) return Object.freeze({
    kind: 'protected', reason: 'legacy-refused', detail: 'legacy-seed-ambiguous',
    legacyDiagnostics,
  });
  if (missingStarSeeds.length > 0) return Object.freeze({
    kind: 'protected', reason: 'legacy-refused', detail: 'legacy-seed-missing',
    legacyDiagnostics,
  });
  return Object.freeze({ kind: 'prepared', detail: null, legacyDiagnostics });
};

const mulberry32First = (seed) => {
  let value = seed | 0;
  value = value + 0x6D2B79F5 | 0;
  let mixed = Math.imul(value ^ value >>> 15, 1 | value);
  mixed = mixed + Math.imul(mixed ^ mixed >>> 7, 61 | mixed) ^ mixed;
  return ((mixed ^ mixed >>> 14) >>> 0) / 4_294_967_296;
};

const hashInt = (seed, x, y) => {
  let hash = seed | 0;
  hash = Math.imul(hash ^ (x | 0), 374_761_393);
  hash = Math.imul(hash ^ (y | 0), 668_265_263);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 2_246_822_519);
  hash ^= hash >>> 13;
  return hash >>> 0;
};

const sessionDrawAt = (seed, domain, countValue) => (
  uint32(seed) && uint32(countValue) && boundedText(domain, 64)
    ? mulberry32First(hashInt(seed, fnv1a32(domain), countValue) >>> 0)
    : Number.NaN
);

const captureChanceFromOracle = (verb, tier, ring, contactCapturePoints) => {
  const odds = [
    0.60, 0.45, 0.36, 0.27, 0.19, 0.13, 0.09, 0.06, 0.04, 0.025,
    0.015, 0.010, 0.006, 0.004, 0.0025,
  ];
  if (!ARC4_CAPTURE_VERBS.includes(verb) || !counter(tier) || tier > 14
    || !counter(ring) || ring > 5 || !counter(contactCapturePoints)) return Number.NaN;
  let base = odds[tier];
  if (verb === 'scavenge') base = Math.min(0.95, base * 1.6);
  else if (verb === 'sample') base = Math.min(0.90, base * 1.5);
  base *= Math.pow(0.9, ring);
  const gear = Math.min(0.25, contactCapturePoints * 0.015);
  return Math.max(0.02, Math.min(0.95, base + gear));
};

const captureAttemptOracle = (before, verb) => {
  try {
    if (!ARC4_CAPTURE_VERBS.includes(verb)) return null;
    const v5 = inspectV5Rows(before);
    if (!V5_SEGMENTS.every(({ segment }) => v5.checks[`${segment}Row`] === true)) return null;
    const ownership = inspectArc4Ownership(v5.rows);
    const capability = exactPertarCapability(before);
    const authority = before?.authority;
    const sessionRng = authority?.sessionRng;
    if (ownership === null || capability === null || !counter(authority?.activePlayMs)
      || !uint32(sessionRng?.seed) || !uint32(sessionRng?.ordinal)
      || !record(sessionRng?.draws)) return null;
    const draws = Object.fromEntries(Object.entries(sessionRng.draws)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
    if (Object.values(draws).some((value) => !uint32(value))) return null;
    const checkedSessionRng = {
      seed: sessionRng.seed, ordinal: sessionRng.ordinal, draws,
    };
    const f4AuthorityFingerprint = `f4a1:${sha256(canonicalToolJson({
      activePlayMs: authority.activePlayMs,
      sessionRng: checkedSessionRng,
    }))}`;
    const cycle = Math.floor(authority.activePlayMs / ARC4_ACTIVE_PLAY_CYCLE_MS);
    const snapshotFingerprint = `acs1:${sha256(canonicalToolJson({
      worldKey: ARC4_PERTAR_FIXTURE.worldKey,
      ecologyEpoch: ARC4_PERTAR_FIXTURE.ecologyEpoch,
      fullRosterFingerprint: ARC4_PERTAR_FIXTURE.fullRosterFingerprint,
      biosphereKey: ARC4_PERTAR_FIXTURE.biosphereKey,
      candidates: ARC4_PERTAR_FIXTURE.candidates.map((row) => ({
        sourceOrdinal: row.sourceOrdinal,
        legacyCatalogueId: row.legacyCatalogueId,
        speciesId: row.speciesId,
        genomeIdentity: row.genomeIdentity,
      })),
      capabilityFingerprint: capability.fingerprint,
      inventoryRevision: capability.inventoryRevision,
      contactCapturePoints: capability.contactCapturePoints,
      ownershipDigest: ownership.manifest.stateDigest,
      f4AuthorityFingerprint,
      activePlayMs: authority.activePlayMs,
      cycle,
      captureRing: ARC4_PERTAR_FIXTURE.captureRing,
    }))}`;
    const successful = ownership.mirror.biosphereProgress.find((row) => (
      row.worldKey === ARC4_PERTAR_FIXTURE.worldKey && row.cycle === cycle
    ))?.successful ?? [];
    const successfulKeys = new Set(successful.map((row) => (
      `${row.speciesId}\u0000${row.source}`
    )));
    const matching = (row) => verb === 'tame' ? row.kingdom === 'fauna'
      : verb === 'sample' ? row.kingdom === 'microbe'
        : row.kingdom === 'flora' || row.kingdom === 'fungi';
    const pool = ARC4_PERTAR_FIXTURE.candidates.filter((row) => matching(row)
      && !successfulKeys.has(`${row.speciesId}\u0000${verb}`));
    if (pool.length === 0) return null;
    const candidateDraw = sessionDrawAt(
      sessionRng.seed, 'capture.candidate', draws['capture.candidate'] ?? 0,
    );
    const successDraw = sessionDrawAt(
      sessionRng.seed, 'capture.success', draws['capture.success'] ?? 0,
    );
    if (!probability(candidateDraw) || candidateDraw === 1
      || !probability(successDraw) || successDraw === 1) return null;
    const candidate = pool[(candidateDraw * pool.length) | 0];
    if (!candidate) return null;
    const chance = captureChanceFromOracle(
      verb, candidate.tier, ARC4_PERTAR_FIXTURE.captureRing,
      capability.contactCapturePoints,
    );
    const eventWitness = canonicalToolJson({
      schema: 'cf-v2-capture-event/v1',
      parentDigest: ownership.manifest.stateDigest,
      snapshotFingerprint,
      f4AuthorityFingerprint,
      receiptOrdinal: sessionRng.ordinal,
      worldKey: ARC4_PERTAR_FIXTURE.worldKey,
      ecologyEpoch: ARC4_PERTAR_FIXTURE.ecologyEpoch,
      fullRosterFingerprint: ARC4_PERTAR_FIXTURE.fullRosterFingerprint,
      cycle,
      verb,
      sourceOrdinal: candidate.sourceOrdinal,
      speciesId: candidate.speciesId,
    });
    return Object.freeze({
      event: sha256(eventWitness), eventWitness, candidate, pool: Object.freeze(pool),
      candidateDraw, successDraw, chance, hit: successDraw < chance,
      receiptOrdinal: sessionRng.ordinal, cycle, snapshotFingerprint,
      f4AuthorityFingerprint, capability,
    });
  } catch {
    return null;
  }
};

const ARC4_ACTIVE_PLAY_RENDER_LAG_MAX_MS = 10_000;
const exactRuntimeAtOrAfterRaw = (raw, value) => {
  const runtime = persistenceStateOf(value)?.runtime;
  const activePlayMs = raw?.authority?.activePlayMs;
  return counter(activePlayMs) && counter(runtime?.activePlayMs)
    && runtime.activePlayMs >= activePlayMs
    && runtime?.revision === raw?.revision
    && runtime?.sessionSeed === raw?.authority?.sessionRng?.seed
    && runtime?.sessionOrdinal === raw?.authority?.sessionRng?.ordinal
    && same(runtime?.sessionDraws, raw?.authority?.sessionRng?.draws);
};

const renderedActivePlayMsOf = (ui) => {
  const budget = ui?.budget;
  const cycle = budget?.cycle;
  const countdown = budget?.recoveryRemainingActivePlayMs;
  const nextBoundary = counter(cycle)
    ? (cycle + 1) * ARC4_ACTIVE_PLAY_CYCLE_MS : Number.NaN;
  return Number.isSafeInteger(nextBoundary) && counter(countdown)
    ? nextBoundary - countdown : Number.NaN;
};

const exactUiActivePlayRuntimeLag = (ui) => {
  const budget = ui?.budget;
  const runtime = persistenceStateOf(ui)?.runtime;
  const cycle = budget?.cycle;
  const countdown = budget?.recoveryRemainingActivePlayMs;
  const renderedActivePlayMs = renderedActivePlayMsOf(ui);
  return counter(cycle) && counter(countdown)
    && countdown > 0 && countdown <= ARC4_ACTIVE_PLAY_CYCLE_MS
    && exactBudgetCountdownText(budget)
    && counter(renderedActivePlayMs)
    && cycle === Math.floor(renderedActivePlayMs / ARC4_ACTIVE_PLAY_CYCLE_MS)
    && counter(runtime?.activePlayMs)
    && renderedActivePlayMs <= runtime.activePlayMs
    && runtime.activePlayMs - renderedActivePlayMs
      <= ARC4_ACTIVE_PLAY_RENDER_LAG_MAX_MS;
};

const exactActivePlayProjection = (raw, ui) => {
  const renderedActivePlayMs = renderedActivePlayMsOf(ui);
  return exactRuntimeAtOrAfterRaw(raw, ui)
    && exactUiActivePlayRuntimeLag(ui)
    && counter(raw?.authority?.activePlayMs)
    && raw.authority.activePlayMs <= renderedActivePlayMs;
};

const exactRuntimeCaptureOrder = (raw, state, ui, direction) => {
  const stateRuntime = persistenceStateOf(state)?.runtime;
  const uiRuntime = persistenceStateOf(ui)?.runtime;
  if (!exactRuntimeAtOrAfterRaw(raw, state)
    || !exactRuntimeAtOrAfterRaw(raw, ui)) return false;
  if (direction === 'ui-state') {
    return uiRuntime.activePlayMs <= stateRuntime.activePlayMs
      && stateRuntime.activePlayMs - uiRuntime.activePlayMs
        <= ARC4_ACTIVE_PLAY_RENDER_LAG_MAX_MS;
  }
  if (direction === 'state-ui') {
    return stateRuntime.activePlayMs <= uiRuntime.activePlayMs
      && uiRuntime.activePlayMs - stateRuntime.activePlayMs
        <= ARC4_ACTIVE_PLAY_RENDER_LAG_MAX_MS;
  }
  return false;
};

export const assessArc4CapturePrecondition = ({
  raw, state, ui, routeError = null, authorityReady = false,
  fixture = ARC4_PERTAR_FIXTURE,
} = {}) => {
  const capture = captureStateOf(state);
  const runtime = persistenceStateOf(state)?.runtime;
  const expectedStarKey = fixture.worldKey.slice(0, fixture.worldKey.lastIndexOf('|p:'));
  const expectedGalaxyKey = fixture.worldKey.slice(0, fixture.worldKey.indexOf('|s:'));
  const readyRows = ui?.rows?.filter((row) => row?.status === 'ready') ?? [];
  const checks = {
    captured: !!raw && !!state && !!ui,
    routeSettled: routeError === null,
    durableEvidence: arc4DurableEvidenceComplete(raw),
    fixtureIdentity: same(fixture, ARC4_PERTAR_FIXTURE),
    route: state?.mode === 'surface' && state?.gal === fixture.galaxy.seed
      && state?.galX === fixture.galaxy.x && state?.galY === fixture.galaxy.y
      && state?.star === fixture.publicStar.seed
      && state?.starX === fixture.publicStar.x
      && state?.starY === fixture.publicStar.y
      && state?.planet === fixture.planet.seed
      && state?.planetOrdinal === fixture.planet.ordinal
      && state?.navGalaxyKey === expectedGalaxyKey
      && state?.navStarKey === expectedStarKey
      && state?.navWorldKey === fixture.worldKey,
    renderedReceipt: exactRenderedReceipt(state?.renderedScene, {
      mode: 'surface', galaxyKey: expectedGalaxyKey,
      starKey: expectedStarKey, worldKey: fixture.worldKey,
    }),
    authorityReady: authorityReady === true
      && runtime?.sessionSeed === fixture.sessionSeed
      && runtime?.sessionOrdinal === fixture.initialSessionOrdinal
      && same(runtime?.sessionDraws, fixture.initialSessionDraws)
      && runtime?.revision === raw?.revision
      && runtime?.sessionOrdinal === raw?.authority?.sessionRng?.ordinal
      && same(runtime?.sessionDraws, raw?.authority?.sessionRng?.draws),
    activePlayProjection: exactActivePlayProjection(raw, ui),
    runtimeCaptureOrder: exactRuntimeCaptureOrder(raw, state, ui, 'ui-state'),
    acquisitionSource: exactPertarCapability(raw) !== null,
    ownershipReady: capture?.schema === 'cf-v2-arc4-app-state/v1'
      && capture?.stateKind === 'loaded' && capture?.mode === 'current'
      && capture?.protection === null && capture?.bootstrapPending === false
      && capture?.revision === raw?.captureRevision
      && capture?.actionCoordinator?.inFlight === false,
    ownershipV2Ready: arc5OwnershipV2RuntimeExact(raw, state, {
      bootstrapOutcome: 'committed-published',
    }) && arc5OwnershipV2RuntimeExact(raw, ui, {
      bootstrapOutcome: 'committed-published',
    }),
    uiComplete: arc4CaptureUiSnapshotComplete(ui),
    surfaceCopy: ui?.cardTitle === 'Pertar'
      && ui?.planetsideHeading === 'PLANETSIDE — Biosphere'
      && ui?.contextKey
        === `${fixture.worldKey}|epoch:${fixture.ecologyEpoch}|${fixture.fullRosterFingerprint}`
      && ui?.summary?.includes(`Showing ${fixture.previewCount} of ${fixture.fullRosterCount} life forms.`)
      && ui?.summary?.includes(`draws from all ${fixture.fullRosterCount}, not only this preview`)
      && ui?.summary?.includes('uniformly'),
    finiteYield: ui?.budget?.yield === fixture.biosphereYield
      && ui?.budget?.used === 0 && ui?.budget?.remaining === fixture.biosphereYield
      && /every attempt spends 1, hit or miss/i.test(ui?.budget?.text ?? '')
      && /20-minute active-play cycle/i.test(ui?.budget?.text ?? '')
      && /closing the game does not advance recovery/i.test(ui?.budget?.text ?? ''),
    randomFullPool: readyRows.length > 0 && readyRows.every((row) => (
      /selected at random/i.test(row?.odds?.text ?? '')
      && /full biosphere/i.test(row?.detail ?? '')
    )),
    actionsIdle: uiIdleAvailabilityHonest(ui),
  };
  return assessment('Arc 4 capture precondition', checks);
};

export const assessArc4CapturePendingNoOptimism = ({
  beforeRaw, duringRaw, beforeState, duringState, beforeUi, duringUi,
  interaction, verb,
} = {}) => {
  const beforeCapture = captureStateOf(beforeState);
  const duringCapture = captureStateOf(duringState);
  const coordinator = duringCapture?.actionCoordinator;
  const checks = {
    captured: !!beforeRaw && !!duringRaw && !!beforeState && !!duringState
      && !!beforeUi && !!duringUi && !!interaction,
    durableEvidence: arc4DurableEvidenceComplete(beforeRaw)
      && arc4DurableEvidenceComplete(duringRaw),
    durableStable: same(beforeRaw, duringRaw),
    uiComplete: arc4CaptureUiSnapshotComplete(beforeUi)
      && arc4CaptureUiSnapshotComplete(duringUi),
    activePlayProjection: exactActivePlayProjection(beforeRaw, beforeUi)
      && exactActivePlayProjection(duringRaw, duringUi),
    runtimeCaptureOrder: exactRuntimeCaptureOrder(
      beforeRaw, beforeState, beforeUi, 'ui-state',
    ) && exactRuntimeCaptureOrder(
      duringRaw, duringState, duringUi, 'state-ui',
    ),
    beforeIdle: uiIdleAvailabilityHonest(beforeUi),
    factsStable: same(uiFacts(beforeUi), uiFacts(duringUi)),
    pendingTruth: ARC4_CAPTURE_VERBS.includes(verb)
      && uiPendingAvailability(duringUi, verb),
    liveProjectionStable: beforeCapture?.revision === duringCapture?.revision
      && beforeCapture?.catalogueSpecies === duringCapture?.catalogueSpecies
      && beforeCapture?.discoveries === duringCapture?.discoveries
      && beforeCapture?.creatures === duringCapture?.creatures
      && beforeCapture?.specimenLots === duringCapture?.specimenLots
      && beforeCapture?.biospheres === duringCapture?.biospheres
      && duringCapture?.lastResult === null,
    ownershipV2Stable: arc5OwnershipV2RuntimeExact(beforeRaw, beforeState, {
      bootstrapOutcome: 'committed-published',
    }) && arc5OwnershipV2RuntimeExact(beforeRaw, beforeUi, {
      bootstrapOutcome: 'committed-published',
    }) && arc5OwnershipV2RuntimeExact(duringRaw, duringState, {
      bootstrapOutcome: 'committed-published',
    }) && arc5OwnershipV2RuntimeExact(duringRaw, duringUi, {
      bootstrapOutcome: 'committed-published',
    }) && same(
      stableOwnershipV2Projection(beforeState),
      stableOwnershipV2Projection(duringState),
    ) && same(
      stableOwnershipV2Projection(beforeUi),
      stableOwnershipV2Projection(duringUi),
    ),
    singleFlight: coordinator?.inFlight === true
      && coordinator?.owner?.schema === 'cf-v2-product-action-coordinator-diagnostics/v1'
      && coordinator?.owner?.busy === true
      && coordinator?.owner?.operation === `arc4.capture.${verb}`
      && coordinator?.hold?.phase === 'holding'
      && coordinator?.hold?.operation === `arc4.capture.${verb}`,
    oneTrustedAction: interaction?.pressCount === 1 && interaction?.verb === verb
      && interaction?.trusted === true
      && ['mouse', 'touch', 'keyboard'].includes(interaction?.modality),
  };
  return assessment('Arc 4 pending/no-optimism', checks);
};

const receiptMap = (evidence) => {
  if (!exactReceiptRows(evidence)) return null;
  return new Map(evidence.receiptKeys.map((key, index) => [key, {
    raw: evidence.receiptRawRows[index], row: evidence.receiptRows[index],
  }]));
};

const captureReceiptTransition = (before, after, expected) => {
  const beforeMap = receiptMap(before), afterMap = receiptMap(after);
  if (beforeMap === null || afterMap === null) return null;
  const oracle = captureAttemptOracle(before, expected?.verb);
  const oldStable = [...beforeMap].every(([key, value]) => {
    const next = afterMap.get(key);
    return next?.raw === value.raw && same(next?.row, value.row);
  });
  const newKeys = [...afterMap.keys()].filter((key) => !beforeMap.has(key));
  const expectedOrdinal = before?.authority?.sessionRng?.ordinal;
  const key = `receipt:${expectedOrdinal}`;
  const receipt = newKeys.length === 1 && newKeys[0] === key ? afterMap.get(key) : null;
  const witness = parseJson(receipt?.row?.witness);
  const exactWitness = exactKeys(witness, [
    'schema', 'event', 'candidateDraw', 'successDraw', 'chance', 'hit', 'spent',
    'successorDigest',
  ]) && oracle !== null && witness.schema === 'cf-v2-capture-plan-witness/v1'
    && witness.event === oracle.event && witness.successorDigest
      === inspectArc4Ownership(inspectV5Rows(after).rows)?.manifest?.stateDigest
    && receipt.row.witness === canonicalToolJson(witness)
    && sameNumber(witness.candidateDraw, oracle.candidateDraw)
    && sameNumber(witness.successDraw, oracle.successDraw)
    && sameNumber(witness.chance, oracle.chance)
    && witness.hit === oracle.hit && witness.spent === 1;
  const expectedMatches = oracle !== null
    && (!own(expected, 'sourceOrdinal')
      || expected.sourceOrdinal === oracle.candidate.sourceOrdinal)
    && (!own(expected, 'speciesId') || expected.speciesId === oracle.candidate.speciesId)
    && (!own(expected, 'kingdom') || expected.kingdom === oracle.candidate.kingdom)
    && (!own(expected, 'tier') || expected.tier === oracle.candidate.tier)
    && (!own(expected, 'candidateDraw')
      || sameNumber(expected.candidateDraw, oracle.candidateDraw))
    && (!own(expected, 'successDraw')
      || sameNumber(expected.successDraw, oracle.successDraw))
    && (!own(expected, 'chance') || sameNumber(expected.chance, oracle.chance))
    && (!own(expected, 'hit') || expected.hit === oracle.hit);
  return Object.freeze({
    ok: oldStable && newKeys.length === 1 && receipt !== null
      && exactKeys(receipt.row, ['ordinal', 'kind', 'witness'])
      && receipt.row.ordinal === expectedOrdinal
      && receipt.row.kind === ARC4_CAPTURE_RECEIPT_KIND && exactWitness
      && expectedMatches,
    oldStable, newKeys, receipt, witness, oracle, expectedMatches,
  });
};

const exactF4CaptureTransition = (before, after) => {
  const left = before?.authority, right = after?.authority;
  const leftRng = left?.sessionRng, rightRng = right?.sessionRng;
  if (!left || !right || !leftRng || !rightRng) return false;
  const expectedDraws = { ...leftRng.draws };
  expectedDraws['capture.candidate'] = (expectedDraws['capture.candidate'] ?? 0) + 1;
  expectedDraws['capture.success'] = (expectedDraws['capture.success'] ?? 0) + 1;
  return right.activePlayMs >= left.activePlayMs
    && rightRng.seed === leftRng.seed
    && rightRng.ordinal === leftRng.ordinal + 1
    && same(rightRng.draws, expectedDraws)
    && after?.revision === before?.revision + 1;
};

const omitted = (value, fields) => Object.fromEntries(
  Object.entries(value ?? {}).filter(([field]) => !fields.includes(field)),
);

const arc5PlayerCarrierValidatedBy = (evidence, durableAssessment) => {
  const carrier = evidence?.playerRow?.extensions?.[
    ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
  ];
  const migration = durableAssessment?.arc5Migration;
  return durableAssessment?.ok === true
    && durableAssessment?.checks?.arc5NamespaceInventory === true
    && durableAssessment?.checks?.arc5CertificateShape === true
    && durableAssessment?.checks?.arc5SourceFixedPoint === true
    && durableAssessment?.checks?.arc5TargetFixedPoint === true
    && migration?.namespaceInventoryMatches === true
    && migration?.certificateShapeMatches === true
    && migration?.sourceFixedPointMatches === true
    && migration?.targetFixedPointMatches === true
    && migration?.carrier === carrier;
};

const unrelatedDurableProjection = (
  evidence, durableAssessment, { omitCompatibility = false } = {},
) => {
  const excludeArc5Carrier = arc5PlayerCarrierValidatedBy(evidence, durableAssessment);
  return {
    rows: Object.fromEntries(V5_SEGMENTS.map(({ segment, row }) => {
      const source = evidence?.[row];
      const ownedData = segment === 'player'
        ? ['essence', 'essenceEarned', 'names', 'at', 'conq',
          ...(omitCompatibility ? ['ever', 'br'] : [])]
        : segment === 'catalog' ? ['codex', 'scout']
          : segment === 'inventory' ? ['bx', 'minedw'] : [];
      const extensions = Object.fromEntries(Object.entries(source?.extensions ?? {})
        .filter(([namespace]) => namespace !== 'f4.authority'
          && !namespace.startsWith('arc4.ownership.')
          && !(excludeArc5Carrier
            && segment === ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.segment
            && namespace === ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace)));
      return [segment, {
        schema: source?.schema,
        segment: source?.segment,
        data: omitted(source?.data, ownedData),
        extensions,
      }];
    })),
    legacy: omitted(evidence?.legacy, [
      'codex', 'names', 'bx', 'scout', 'essence', 'essenceEarned', 'at', 'conq', 'minedw',
      ...(omitCompatibility ? ['ever', 'br'] : []),
    ]),
  };
};

const exactArc5CertificateSuccessor = (beforeAssessment, afterAssessment) => {
  const before = beforeAssessment?.arc5Migration;
  const after = afterAssessment?.arc5Migration;
  return beforeAssessment?.ok === true && afterAssessment?.ok === true
    && before?.certificate !== null && after?.certificate !== null
    && before.carrier?.json !== after.carrier?.json
    && after.certificate.sourceRevision === before.certificate.sourceRevision + 1
    && after.certificate.targetRevision === before.certificate.targetRevision + 1
    && after.certificate.sourceRevision === after.source?.revision
    && after.certificate.targetRevision === after.target?.revision
    && after.certificate.sourceDigest === after.sourceDigest
    && after.certificate.sourceDigest === afterAssessment.ownership?.manifest?.stateDigest
    && after.certificate.targetDigest === after.targetDigest;
};

const exactArc4V4FixtureCompatibility = (assessment) => {
  const compatibility = assessment?.v4OwnedCompatibility?.legacy;
  const catalogue = assessment?.ownership?.mirror?.catalogSpecies;
  if (!compatibility || !Array.isArray(catalogue)) return false;
  let expectedBest = 0;
  let expectedHybrids = 0;
  let expectedMaxGen = 0;
  for (const row of catalogue) {
    const candidate = ARC4_PERTAR_FIXTURE.candidates.find((entry) => (
      entry.speciesId === row?.speciesId
    ));
    const genome = row?.genome;
    if (!candidate || !record(genome) || !counter(genome.gen)) return false;
    expectedBest = Math.max(expectedBest, candidate.tier);
    expectedHybrids += own(genome, 'parents') ? 1 : 0;
    expectedMaxGen = Math.max(expectedMaxGen, genome.gen);
  }
  const fixture = ARC4_PERTAR_FIXTURE.v4OwnedCompatibility.before;
  return compatibility.br === fixture.br
    && compatibility.ever.v === fixture.ever.v
    && compatibility.ever.hybrids === expectedHybrids
    && compatibility.ever.best === expectedBest
    && compatibility.ever.maxGen === expectedMaxGen
    && compatibility.ever.scanhits === fixture.ever.scanhits
    && own(compatibility.ever, 'arrivals') === own(fixture.ever, 'arrivals')
    && (!own(fixture.ever, 'arrivals')
      || compatibility.ever.arrivals === fixture.ever.arrivals);
};

const exactArc4V4ActionTransition = (beforeAssessment, afterAssessment, expected) => {
  const before = beforeAssessment?.v4OwnedCompatibility?.legacy;
  const after = afterAssessment?.v4OwnedCompatibility?.legacy;
  if (!before || !after || !expected || typeof expected.hit !== 'boolean') return false;
  const expectedBest = expected.hit === true && expected.firstForSpecies === true
    ? Math.max(before.ever.best, expected.tier) : before.ever.best;
  return exactArc4V4FixtureCompatibility(beforeAssessment)
    && exactArc4V4FixtureCompatibility(afterAssessment)
    && after.br === before.br
    && after.ever.v === before.ever.v
    && after.ever.hybrids === before.ever.hybrids
    && after.ever.best === expectedBest
    && after.ever.maxGen >= before.ever.maxGen
    && after.ever.scanhits === before.ever.scanhits
    && own(after.ever, 'arrivals') === own(before.ever, 'arrivals')
    && (!own(before.ever, 'arrivals') || after.ever.arrivals === before.ever.arrivals);
};

const indexedRows = (rows, key) => {
  if (!Array.isArray(rows)) return null;
  const map = new Map();
  for (const row of rows) {
    const identity = row?.[key];
    if (!boundedText(identity, 160) || map.has(identity)) return null;
    map.set(identity, row);
  }
  return map;
};

const priorRowsPreserved = (beforeRows, afterRows, key) => {
  const before = indexedRows(beforeRows, key), after = indexedRows(afterRows, key);
  return before !== null && after !== null
    && [...before].every(([identity, row]) => same(after.get(identity), row));
};

const expectedProgressTransition = (beforeMirror, afterMirror, expected, hit) => {
  const beforeRows = indexedRows(beforeMirror?.biosphereProgress, 'worldKey');
  const afterRows = indexedRows(afterMirror?.biosphereProgress, 'worldKey');
  if (beforeRows === null || afterRows === null) return false;
  const before = beforeRows.get(ARC4_PERTAR_FIXTURE.worldKey) ?? null;
  const after = afterRows.get(ARC4_PERTAR_FIXTURE.worldKey);
  if (!after || after.used !== (before?.used ?? 0) + 1
    || after.used !== ARC4_PERTAR_FIXTURE.biosphereYield - expected.remainingAfter
    || after.cycle !== (before?.cycle ?? 0)
    || after.worldKey !== ARC4_PERTAR_FIXTURE.worldKey
    || !exactPertarWorldAddress(after.worldAddress)
    || (before !== null && !exactPertarWorldAddress(before.worldAddress))
    || ![...beforeRows].every(([key, row]) => key === ARC4_PERTAR_FIXTURE.worldKey
      || same(afterRows.get(key), row))) return false;
  const priorSuccessful = before?.successful ?? [];
  if (hit) {
    const expectedSuccessful = [...priorSuccessful, {
      speciesId: expected.speciesId, source: expected.verb,
    }].sort((left, right) => {
      const leftKey = `${left.speciesId}\u0000${left.source}`;
      const rightKey = `${right.speciesId}\u0000${right.source}`;
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    });
    return same(after.successful, expectedSuccessful);
  }
  return same(after.successful, priorSuccessful);
};

const exactAppCaptureResult = (state, expected, committedRevision) => {
  const capture = captureStateOf(state);
  const result = capture?.lastResult;
  return capture?.schema === 'cf-v2-arc4-app-state/v1'
    && capture?.stateKind === 'loaded' && capture?.mode === 'current'
    && capture?.protection === null
    && result?.hit === expected.hit
    && (!expected.speciesId || result?.speciesId === expected.speciesId)
    && boundedText(result?.speciesId, 160)
    && boundedText(result?.speciesName, 256)
    && result?.kingdom === (expected.kingdom ?? result?.kingdom)
    && result?.sourceOrdinal === expected.sourceOrdinal
    && result?.tier === expected.tier
    && sameNumber(result?.chance, expected.chance)
    && result?.worldKey === ARC4_PERTAR_FIXTURE.worldKey
    && result?.ecologyEpoch === ARC4_PERTAR_FIXTURE.ecologyEpoch
    && result?.fullRosterFingerprint === ARC4_PERTAR_FIXTURE.fullRosterFingerprint
    && result?.firstForSpecies === expected.firstForSpecies
    && result?.spent === 1 && result?.remainingAfter === expected.remainingAfter
    && result?.stardustReward === expected.stardustReward
    && result?.revision === committedRevision;
};

const settledUiOutcome = (ui, expectedKind, verb) => (
  arc4CaptureUiSnapshotComplete(ui)
  && ui?.ariaBusy === 'false'
  && ui?.diagnostics?.pendingWork === 0
  && ui?.diagnostics?.convergenceLatched === false
  && ui?.diagnostics?.lastRequest?.verb === verb
  && ui?.diagnostics?.lastOutcome?.schema === 'cf-v2-capture-card-outcome/v1'
  && ui?.diagnostics?.lastOutcome?.kind === expectedKind
  && ui?.diagnostics?.lastOutcome?.verb === verb
  && ui?.diagnostics?.lastOutcome?.convergence === 'none'
  && ui?.status?.hidden === false && ui?.status?.kind === expectedKind
  && ui?.status?.convergence === 'none'
);

const actionInteraction = (interaction, expected) => interaction?.pressCount === 1
  && interaction?.verb === expected?.verb && interaction?.trusted === true
  && ['mouse', 'touch', 'keyboard'].includes(interaction?.modality);

const exactSurveyDockActivation = (activation) => {
  const target = activation?.target;
  const interaction = activation?.interaction;
  const trace = interaction?.trace;
  const key = trace?.keys?.[0];
  const click = trace?.clicks?.[0];
  return activation?.armed === true && target?.ok === true
    && target?.id === 'docksurvey' && target?.tag === 'BUTTON'
    && target?.ariaControls === 'survey' && target?.focus === true
    && interaction?.pressCount === 1 && interaction?.trusted === true
    && interaction?.modality === 'keyboard'
    && Array.isArray(trace?.keys) && trace.keys.length === 1
    && key?.trusted === true && key?.id === 'docksurvey'
    && key?.key === 'Enter' && key?.code === 'Enter'
    && Array.isArray(trace?.clicks) && trace.clicks.length === 1
    && click?.trusted === true && click?.id === 'docksurvey';
};

const captureCore = ({ before, after, beforeState, afterState, afterUi, interaction, expected }) => {
  const beforeAssessment = assessArc4DurableEvidence(before);
  const afterAssessment = assessArc4DurableEvidence(after);
  const beforeMirror = beforeAssessment.ownership?.mirror;
  const afterMirror = afterAssessment.ownership?.mirror;
  const receipt = captureReceiptTransition(before, after, expected);
  const v4OwnedCompatibility = exactArc4V4ActionTransition(
    beforeAssessment, afterAssessment, expected,
  );
  return {
    beforeAssessment, afterAssessment, beforeMirror, afterMirror, receipt,
    baseChecks: {
      captured: !!before && !!after && !!beforeState && !!afterState && !!afterUi
        && !!interaction && !!expected,
      durableEvidence: beforeAssessment.ok && afterAssessment.ok,
      arc5CertificateSuccessor: exactArc5CertificateSuccessor(
        beforeAssessment, afterAssessment,
      ),
      oneRevision: after?.revision === before?.revision + 1
        && after?.captureRevision === before?.captureRevision + 1,
      f4Transition: exactF4CaptureTransition(before, after),
      receipt: receipt?.ok === true,
      v4OwnedCompatibility,
      unrelatedDurable: same(
        unrelatedDurableProjection(before, beforeAssessment, { omitCompatibility: true }),
        unrelatedDurableProjection(after, afterAssessment, { omitCompatibility: true }),
      ),
      interaction: actionInteraction(interaction, expected),
      appResult: exactAppCaptureResult(afterState, expected, after?.revision),
      activePlayProjection: exactActivePlayProjection(after, afterUi),
      runtimeCaptureOrder: exactRuntimeAtOrAfterRaw(before, beforeState)
        && exactRuntimeCaptureOrder(after, afterState, afterUi, 'state-ui'),
      ownershipV2Before: arc5OwnershipV2RuntimeExact(before, beforeState, {
        bootstrapOutcome: [
          'committed-published', 'capture-committed-published', 'already-aligned',
        ],
      }),
      runtimeParity: persistenceStateOf(afterState)?.runtime?.revision === after?.revision
        && persistenceStateOf(afterState)?.runtime?.sessionSeed
          === after?.authority?.sessionRng?.seed
        && persistenceStateOf(afterState)?.runtime?.sessionOrdinal
          === after?.authority?.sessionRng?.ordinal
        && same(persistenceStateOf(afterState)?.runtime?.sessionDraws,
          after?.authority?.sessionRng?.draws),
      ownershipV2Live: arc5OwnershipV2RuntimeExact(after, afterState, {
        bootstrapOutcome: 'capture-committed-published',
      }) && arc5OwnershipV2RuntimeExact(after, afterUi, {
        bootstrapOutcome: 'capture-committed-published',
      }),
      progress: expectedProgressTransition(
        beforeMirror, afterMirror, expected, expected?.hit === true,
      ),
    },
  };
};

export const assessArc4CommittedHit = (bundle = {}) => {
  const expected = bundle.expected ?? ARC4_PERTAR_FIXTURE.actions.firstHit;
  const core = captureCore({ ...bundle, expected });
  const before = core.beforeMirror, after = core.afterMirror;
  const newCatalog = after?.catalogSpecies?.filter((row) => !before?.catalogSpecies?.some(
    (prior) => prior.speciesId === row.speciesId,
  )) ?? [];
  const newDiscoveries = after?.discoveries?.filter((row) => !before?.discoveries?.some(
    (prior) => prior.recordId === row.recordId,
  )) ?? [];
  const ownedKind = expected.kingdom === 'fauna' ? 'creatures' : 'specimenLots';
  const ownedKey = expected.kingdom === 'fauna' ? 'creatureId' : 'lotId';
  const newOwned = after?.[ownedKind]?.filter((row) => !before?.[ownedKind]?.some(
    (prior) => prior[ownedKey] === row[ownedKey],
  )) ?? [];
  const result = captureStateOf(bundle.afterState)?.lastResult;
  const beforeCompatibility = core.beforeAssessment.v4OwnedCompatibility?.legacy;
  const afterCompatibility = core.afterAssessment.v4OwnedCompatibility?.legacy;
  const checks = {
    ...core.baseChecks,
    fixtureOutcome: same(expected, ARC4_PERTAR_FIXTURE.actions.firstHit)
      && expected?.hiddenBeyondPreview === true
      && expected.sourceOrdinal >= ARC4_PERTAR_FIXTURE.previewCount,
    priorOwnershipPreserved: priorRowsPreserved(before?.catalogSpecies, after?.catalogSpecies, 'speciesId')
      && priorRowsPreserved(before?.discoveries, after?.discoveries, 'recordId')
      && priorRowsPreserved(before?.creatures, after?.creatures, 'creatureId')
      && priorRowsPreserved(before?.specimenLots, after?.specimenLots, 'lotId'),
    exactCatalogueAddition: newCatalog.length === (expected.firstForSpecies ? 1 : 0)
      && (!expected.firstForSpecies || (newCatalog[0]?.speciesId === expected.speciesId
        && newCatalog[0]?.kingdom === expected.kingdom
        && newCatalog[0]?.genome?.gen === expected.generation
        && newCatalog[0]?.firstObservationId === newDiscoveries[0]?.recordId)),
    exactDiscovery: newDiscoveries.length === 1
      && newDiscoveries[0]?.speciesId === expected.speciesId
      && newDiscoveries[0]?.acquisition === expected.verb
      && newDiscoveries[0]?.firstForSpecies === expected.firstForSpecies
      && newDiscoveries[0]?.provenance?.kind === 'world'
      && newDiscoveries[0]?.provenance?.verb === expected.verb
      && newDiscoveries[0]?.provenance?.worldKey === ARC4_PERTAR_FIXTURE.worldKey
      && exactPertarWorldAddress(newDiscoveries[0]?.provenance?.worldAddress)
      && newDiscoveries[0]?.provenance?.sourceOrdinal === expected.sourceOrdinal,
    discoveryReceiptIdentity: newDiscoveries.length === 1
      && hexDigest(core.receipt?.witness?.event)
      && newDiscoveries[0]?.recordId
        === `discovery-v1:${core.receipt.witness.event}`,
    exactOwnedRow: newOwned.length === 1 && newOwned[0]?.[ownedKey] === result?.ownedRowId
      && newOwned[0]?.speciesId === expected.speciesId
      && newOwned[0]?.acquisitionRecordId === newDiscoveries[0]?.recordId
      && (expected.kingdom === 'fauna'
        ? newOwned[0]?.origin === 'wild'
        : newOwned[0]?.origin === 'wild' && newOwned[0]?.quantity === 1),
    oppositeOwnedKindStable: expected.kingdom === 'fauna'
      ? same(before?.specimenLots, after?.specimenLots)
      : same(before?.creatures, after?.creatures),
    firstReward: bundle.after?.legacy?.essence
        === bundle.before?.legacy?.essence + expected.stardustReward
      && bundle.after?.legacy?.essenceEarned
        === bundle.before?.legacy?.essenceEarned + expected.stardustReward,
    v4OwnedCounters: same(
      beforeCompatibility, ARC4_PERTAR_FIXTURE.v4OwnedCompatibility.before,
    ) && same(
      afterCompatibility, ARC4_PERTAR_FIXTURE.v4OwnedCompatibility.afterFirstHit,
    ),
    uiOutcome: settledUiOutcome(bundle.afterUi, 'committed-hit', expected.verb)
      && bundle.afterUi?.status?.text?.includes(result?.speciesName)
      && bundle.afterUi?.budget?.remaining === expected.remainingAfter
      && /new compendium page/i.test(bundle.afterUi?.status?.text ?? '')
      && /\+2 stardust/i.test(bundle.afterUi?.status?.text ?? ''),
  };
  return assessment('Arc 4 committed hit', checks, {
    receipt: core.receipt,
    durableChecks: {
      before: core.beforeAssessment.checks,
      after: core.afterAssessment.checks,
    },
  });
};

export const assessArc4CommittedMiss = (bundle = {}) => {
  const expected = bundle.expected ?? ARC4_PERTAR_FIXTURE.actions.secondMiss;
  const core = captureCore({ ...bundle, expected });
  const before = core.beforeMirror, after = core.afterMirror;
  const result = captureStateOf(bundle.afterState)?.lastResult;
  const beforeCompatibility = core.beforeAssessment.v4OwnedCompatibility?.legacy;
  const afterCompatibility = core.afterAssessment.v4OwnedCompatibility?.legacy;
  const checks = {
    ...core.baseChecks,
    fixtureOutcome: same(expected, ARC4_PERTAR_FIXTURE.actions.secondMiss),
    noOwnershipGrant: same(before?.catalogSpecies, after?.catalogSpecies)
      && same(before?.discoveries, after?.discoveries)
      && same(before?.creatures, after?.creatures)
      && same(before?.specimenLots, after?.specimenLots),
    noReward: bundle.after?.legacy?.essence === bundle.before?.legacy?.essence
      && bundle.after?.legacy?.essenceEarned === bundle.before?.legacy?.essenceEarned
      && result?.ownedRowId === null && result?.stardustReward === 0,
    v4OwnedCounters: same(beforeCompatibility, afterCompatibility)
      && same(beforeCompatibility, ARC4_PERTAR_FIXTURE.v4OwnedCompatibility.afterFirstHit),
    uiOutcome: settledUiOutcome(bundle.afterUi, 'committed-miss', expected.verb)
      && bundle.afterUi?.status?.text?.includes(result?.speciesName)
      && bundle.afterUi?.budget?.remaining === expected.remainingAfter
      && /no page, creature, specimen, or stardust was added/i
        .test(bundle.afterUi?.status?.text ?? ''),
  };
  return assessment('Arc 4 committed miss', checks, {
    receipt: core.receipt,
    durableChecks: {
      before: core.beforeAssessment.checks,
      after: core.afterAssessment.checks,
    },
  });
};

const exactBurnOwnershipTransition = (beforeMirror, afterMirror, expected, event) => {
  if (!expectedProgressTransition(
    beforeMirror, afterMirror, expected, expected?.hit === true,
  )) return false;
  if (expected.hit !== true) {
    return same(beforeMirror?.catalogSpecies, afterMirror?.catalogSpecies)
      && same(beforeMirror?.discoveries, afterMirror?.discoveries)
      && same(beforeMirror?.creatures, afterMirror?.creatures)
      && same(beforeMirror?.specimenLots, afterMirror?.specimenLots);
  }
  const newCatalogue = afterMirror?.catalogSpecies?.filter((row) => (
    !beforeMirror?.catalogSpecies?.some((prior) => prior.speciesId === row.speciesId)
  )) ?? [];
  const newDiscoveries = afterMirror?.discoveries?.filter((row) => (
    !beforeMirror?.discoveries?.some((prior) => prior.recordId === row.recordId)
  )) ?? [];
  const ownedKind = expected.kingdom === 'fauna' ? 'creatures' : 'specimenLots';
  const ownedKey = expected.kingdom === 'fauna' ? 'creatureId' : 'lotId';
  const newOwned = afterMirror?.[ownedKind]?.filter((row) => (
    !beforeMirror?.[ownedKind]?.some((prior) => prior[ownedKey] === row[ownedKey])
  )) ?? [];
  const discovery = newDiscoveries[0];
  return priorRowsPreserved(beforeMirror?.catalogSpecies, afterMirror?.catalogSpecies, 'speciesId')
    && priorRowsPreserved(beforeMirror?.discoveries, afterMirror?.discoveries, 'recordId')
    && priorRowsPreserved(beforeMirror?.creatures, afterMirror?.creatures, 'creatureId')
    && priorRowsPreserved(beforeMirror?.specimenLots, afterMirror?.specimenLots, 'lotId')
    && newCatalogue.length === (expected.firstForSpecies ? 1 : 0)
    && newDiscoveries.length === 1 && newOwned.length === 1
    && discovery?.recordId === `discovery-v1:${event}`
    && discovery?.speciesId === expected.speciesId
    && discovery?.acquisition === expected.verb
    && discovery?.firstForSpecies === expected.firstForSpecies
    && discovery?.provenance?.kind === 'world'
    && discovery?.provenance?.verb === expected.verb
    && discovery?.provenance?.worldKey === ARC4_PERTAR_FIXTURE.worldKey
    && exactPertarWorldAddress(discovery?.provenance?.worldAddress)
    && discovery?.provenance?.cycle === expected.cycle
    && discovery?.provenance?.sourceOrdinal === expected.sourceOrdinal
    && newOwned[0]?.speciesId === expected.speciesId
    && newOwned[0]?.acquisitionRecordId === discovery.recordId
    && (expected.kingdom === 'fauna'
      ? newOwned[0]?.origin === 'wild'
      : newOwned[0]?.origin === 'wild' && newOwned[0]?.quantity === 1)
    && (expected.firstForSpecies !== true
      || (newCatalogue[0]?.speciesId === expected.speciesId
        && newCatalogue[0]?.kingdom === expected.kingdom
        && newCatalogue[0]?.firstObservationId === discovery.recordId));
};

/** Semantic validator for one of Slice's fourteen real verb-only burn-down
 * settlements. The outcome supplies no randomness authority: candidate,
 * draws, chance, hit and event are all recomputed from the persisted parent. */
export const assessArc4BurnStep = ({
  before, after, beforeUi, outcome, verb, expectedUsed, afterState,
} = {}) => {
  const beforeAssessment = assessArc4DurableEvidence(before);
  const afterAssessment = assessArc4DurableEvidence(after);
  const oracle = captureAttemptOracle(before, verb);
  const beforeMirror = beforeAssessment.ownership?.mirror;
  const afterMirror = afterAssessment.ownership?.mirror;
  const firstForSpecies = oracle !== null && oracle.hit === true
    && !beforeMirror?.catalogSpecies?.some((row) => (
      row.speciesId === oracle.candidate.speciesId
    ));
  const expected = oracle === null ? null : {
    verb,
    sourceOrdinal: oracle.candidate.sourceOrdinal,
    speciesId: oracle.candidate.speciesId,
    kingdom: oracle.candidate.kingdom,
    tier: oracle.candidate.tier,
    chance: oracle.chance,
    candidateDraw: oracle.candidateDraw,
    successDraw: oracle.successDraw,
    hit: oracle.hit,
    firstForSpecies,
    spent: 1,
    remainingAfter: ARC4_PERTAR_FIXTURE.biosphereYield - expectedUsed,
    stardustReward: oracle.hit && firstForSpecies && oracle.candidate.tier >= 5
      ? oracle.candidate.tier - 3 : 0,
    cycle: oracle.cycle,
  };
  const receipt = captureReceiptTransition(before, after, expected);
  const beforeProgress = beforeMirror?.biosphereProgress?.find((row) => (
    row.worldKey === ARC4_PERTAR_FIXTURE.worldKey
  ));
  const afterProgress = afterMirror?.biosphereProgress?.find((row) => (
    row.worldKey === ARC4_PERTAR_FIXTURE.worldKey
  ));
  const v4OwnedCompatibility = exactArc4V4ActionTransition(
    beforeAssessment, afterAssessment, expected,
  );
  const checks = {
    captured: !!before && !!after && !!beforeUi && !!outcome && !!afterState
      && ARC4_CAPTURE_VERBS.includes(verb) && counter(expectedUsed),
    durableEvidence: beforeAssessment.ok && afterAssessment.ok,
    arc5CertificateSuccessor: exactArc5CertificateSuccessor(
      beforeAssessment, afterAssessment,
    ),
    readyVerb: arc4CaptureUiSnapshotComplete(beforeUi)
      && beforeUi?.rows?.some((row) => row?.verb === verb
        && row?.status === 'ready' && row?.button?.modelEnabled === 'true'),
    ownershipV2Before: arc5OwnershipV2RuntimeExact(before, beforeUi, {
      bootstrapOutcome: ['committed-published', 'capture-committed-published'],
    }),
    activePlayProjection: exactActivePlayProjection(before, beforeUi),
    outcome: expected !== null
      && outcome?.kind === 'committed' && outcome?.durability === 'committed'
      && outcome?.convergence === 'none' && outcome?.verb === verb
      && same(outcome?.result, captureStateOf(afterState)?.lastResult)
      && exactAppCaptureResult(afterState, expected, after?.revision),
    oneRevision: after?.revision === before?.revision + 1
      && after?.captureRevision === before?.captureRevision + 1
      && outcome?.result?.revision === after?.revision,
    f4Transition: exactF4CaptureTransition(before, after),
    receipt: receipt?.ok === true,
    ownershipTransition: expected !== null && exactBurnOwnershipTransition(
      beforeMirror, afterMirror, expected, oracle?.event,
    ),
    v4OwnedCompatibility,
    unrelatedDurable: same(
      unrelatedDurableProjection(before, beforeAssessment, { omitCompatibility: true }),
      unrelatedDurableProjection(after, afterAssessment, { omitCompatibility: true }),
    ),
    used: (beforeProgress?.used ?? 0) === expectedUsed - 1
      && afterProgress?.used === expectedUsed,
    liveAuthority: exactRuntimeAtOrAfterRaw(after, afterState),
    ownershipV2Live: arc5OwnershipV2RuntimeExact(after, afterState, {
      bootstrapOutcome: 'capture-committed-published',
    }),
  };
  return assessment('Arc 4 burn step', checks, { expected, oracle, receipt });
};

const stableCaptureProjection = (state) => {
  const capture = captureStateOf(state);
  return {
    stateKind: capture?.stateKind,
    mode: capture?.mode,
    protection: capture?.protection,
    revision: capture?.revision,
    catalogueSpecies: capture?.catalogueSpecies,
    discoveries: capture?.discoveries,
    creatures: capture?.creatures,
    specimenLots: capture?.specimenLots,
    biospheres: capture?.biospheres,
    lastResult: capture?.lastResult,
  };
};

const refusedUiOutcome = (ui, verb, convergence = 'none') => (
  arc4CaptureUiSnapshotComplete(ui)
  && ui?.diagnostics?.lastRequest?.verb === verb
  && ui?.diagnostics?.lastOutcome?.schema === 'cf-v2-capture-card-outcome/v1'
  && ui?.diagnostics?.lastOutcome?.kind === 'refused'
  && ui?.diagnostics?.lastOutcome?.verb === verb
  && ui?.diagnostics?.lastOutcome?.convergence === convergence
  && ui?.status?.hidden === false && ui?.status?.kind === 'refused'
  && ui?.status?.convergence === convergence
  && (convergence === 'none'
    ? ui?.ariaBusy === 'false' && ui?.diagnostics?.pendingWork === 0
      && ui?.diagnostics?.convergenceLatched === false
    : ui?.ariaBusy === 'true' && ui?.diagnostics?.pendingWork === 1
      && ui?.diagnostics?.convergenceLatched === true)
);

export const assessArc4StorageRefusal = ({
  before, after, beforeState, afterState, beforeUi, afterUi, interaction,
  armed = false, verb = 'tame', waitError = null, captureErrors = [],
} = {}) => {
  const capture = captureStateOf(afterState);
  const coordinator = capture?.actionCoordinator;
  const fault = coordinator?.lastFault;
  const checks = {
    captured: Array.isArray(captureErrors) && captureErrors.length === 0
      && !!before && !!after && !!beforeState && !!afterState && !!beforeUi
      && !!afterUi && !!interaction,
    waitSettled: waitError === null,
    durableEvidence: arc4DurableEvidenceComplete(before)
      && arc4DurableEvidenceComplete(after),
    exactDurableStable: same(before, after),
    liveProjectionStable: same(
      omitted(stableCaptureProjection(beforeState), ['lastResult']),
      omitted(stableCaptureProjection(afterState), ['lastResult']),
    ) && capture?.lastResult === null,
    ownershipV2Stable: arc5OwnershipV2RuntimeExact(before, beforeState, {
      bootstrapOutcome: 'capture-committed-published',
    }) && arc5OwnershipV2RuntimeExact(before, beforeUi, {
      bootstrapOutcome: 'capture-committed-published',
    }) && arc5OwnershipV2RuntimeExact(after, afterState, {
      bootstrapOutcome: 'capture-committed-published',
    }) && arc5OwnershipV2RuntimeExact(after, afterUi, {
      bootstrapOutcome: 'capture-committed-published',
    }),
    uiFactsStable: arc4CaptureUiSnapshotComplete(beforeUi)
      && arc4CaptureUiSnapshotComplete(afterUi)
      && same(uiFacts(beforeUi), uiFacts(afterUi)),
    activePlayProjection: exactActivePlayProjection(before, beforeUi)
      && exactActivePlayProjection(after, afterUi),
    runtimeCaptureOrder: exactRuntimeCaptureOrder(
      before, beforeState, beforeUi, 'state-ui',
    ) && exactRuntimeCaptureOrder(
      after, afterState, afterUi, 'state-ui',
    ),
    outcome: typeof capture?.lastOutcome === 'string'
      && capture.lastOutcome.startsWith(`${verb}-refused:`)
      && /storage failure/i.test(capture.lastOutcome),
    uiOutcome: refusedUiOutcome(afterUi, verb, 'none')
      && /nothing was spent/i.test(afterUi?.status?.text ?? ''),
    armedCleared: armed === true
      && coordinator?.faultArmed?.storageFailure === false,
    coordinatorReleased: coordinator?.inFlight === false
      && coordinator?.owner?.schema === 'cf-v2-product-action-coordinator-diagnostics/v1'
      && coordinator?.owner?.busy === false && coordinator?.owner?.operation === null,
    holdReleased: coordinator?.hold?.schema === 'cf-v2-product-action-hold-diagnostics/v1'
      && coordinator?.hold?.phase === 'released',
    faultShape: exactKeys(fault, [
      'schema', 'operation', 'injection', 'phase', 'beforeRevision',
      'injectedRevision', 'outcome',
    ]),
    faultIdentity: fault?.schema === 'cf-v2-arc4-action-fault-witness/v1'
      && fault?.operation === `arc4.capture.${verb}`,
    faultInjection: fault?.injection === 'storage-failure',
    faultSettlement: fault?.phase === 'settled'
      && fault?.beforeRevision === before?.revision
      && fault?.injectedRevision === null,
    faultOutcome: fault?.outcome === 'storage-error',
    interaction: actionInteraction(interaction, { verb }),
  };
  return assessment('Arc 4 storage refusal', checks);
};

const exactPagehideCapture = (faultCapture, schema, priorToken) => {
  const capture = faultCapture?.parsed;
  return typeof faultCapture?.raw === 'string'
    && faultCapture.raw === JSON.stringify(capture)
    && faultCapture?.cleared === true
    && exactKeys(capture, ['schema', 'documentToken', 'fault', 'state', 'ui'])
    && capture.schema === schema && capture.documentToken === priorToken
    && record(capture.state) && record(capture.ui)
    ? capture : null;
};

const exactPagehideTuple = (capture, oldState, oldUi) => {
  const tupleCapture = captureStateOf(capture?.state);
  const tupleUiCapture = captureStateOf(capture?.ui?.captureState);
  return capture !== null
    && same(capture.state, oldState) && same(capture.ui, oldUi)
    && same(tupleCapture, tupleUiCapture)
    && same(ownershipV2StateOf(capture.state), ownershipV2StateOf(capture.ui))
    && same(persistenceStateOf(capture.state), persistenceStateOf(capture.ui))
    && same(capture.fault, tupleCapture?.actionCoordinator?.lastFault)
    && same(capture.fault, tupleUiCapture?.actionCoordinator?.lastFault);
};

const exactRowsAndAuthorityBytes = (left, right) => left?.legacyRaw === right?.legacyRaw
  && V5_SEGMENTS.every(({ raw }) => left?.[raw] === right?.[raw])
  && left?.authorityJson === right?.authorityJson
  && same(left?.receiptKeys, right?.receiptKeys)
  && same(left?.receiptRawRows, right?.receiptRawRows)
  && same(left?.receiptRows, right?.receiptRows);

const exactPertarReloadRoute = (state) => {
  const expectedStarKey = ARC4_PERTAR_FIXTURE.worldKey.slice(
    0, ARC4_PERTAR_FIXTURE.worldKey.lastIndexOf('|p:'),
  );
  const expectedGalaxyKey = ARC4_PERTAR_FIXTURE.worldKey.slice(
    0, ARC4_PERTAR_FIXTURE.worldKey.indexOf('|s:'),
  );
  return state?.mode === 'surface'
    && state?.gal === ARC4_PERTAR_FIXTURE.galaxy.seed
    && state?.galX === ARC4_PERTAR_FIXTURE.galaxy.x
    && state?.galY === ARC4_PERTAR_FIXTURE.galaxy.y
    && state?.star === ARC4_PERTAR_FIXTURE.publicStar.seed
    && state?.starX === ARC4_PERTAR_FIXTURE.publicStar.x
    && state?.starY === ARC4_PERTAR_FIXTURE.publicStar.y
    && state?.planet === ARC4_PERTAR_FIXTURE.planet.seed
    && state?.planetOrdinal === ARC4_PERTAR_FIXTURE.planet.ordinal
    && state?.navGalaxyKey === expectedGalaxyKey
    && state?.navStarKey === expectedStarKey
    && state?.navWorldKey === ARC4_PERTAR_FIXTURE.worldKey
    && exactRenderedReceipt(state?.renderedScene, {
      mode: 'surface', galaxyKey: expectedGalaxyKey,
      starKey: expectedStarKey, worldKey: ARC4_PERTAR_FIXTURE.worldKey,
    });
};

const exactClosedPertarReload = (state) => exactPertarReloadRoute(state)
  && state?.cardOpen === false && state?.cardTitle === null;

const alignedReloadPresentation = (reloaded, reloadedState, reloadedUi) => {
  const progress = projectArc4OwnershipEvidence(reloaded)?.biosphereProgress
    ?.find((row) => row?.worldKey === ARC4_PERTAR_FIXTURE.worldKey) ?? null;
  const uiCapture = captureStateOf(reloadedUi?.captureState);
  return exactPertarReloadRoute(reloadedState)
    && reloadedState?.cardOpen === true
    && reloadedState?.cardTitle === 'Pertar'
    && arc4CaptureUiSnapshotComplete(reloadedUi)
    && reloadedUi?.cardTitle === 'Pertar'
    && reloadedUi?.planetsideHeading === 'PLANETSIDE — Biosphere'
    && reloadedUi?.contextKey
      === `${ARC4_PERTAR_FIXTURE.worldKey}|epoch:${ARC4_PERTAR_FIXTURE.ecologyEpoch}|${ARC4_PERTAR_FIXTURE.fullRosterFingerprint}`
    && reloadedUi?.budget?.yield === ARC4_PERTAR_FIXTURE.biosphereYield
    && exactPertarWorldAddress(progress?.worldAddress)
    && reloadedUi?.budget?.used === progress?.used
    && reloadedUi?.budget?.cycle === progress?.cycle
    && reloadedUi?.budget?.remaining
      === ARC4_PERTAR_FIXTURE.biosphereYield - progress?.used
    && uiIdleAvailabilityHonest(reloadedUi)
    && reloadedUi?.status?.hidden === true
    && reloadedUi?.status?.kind === null
    && reloadedUi?.status?.convergence === null
    && reloadedUi?.diagnostics?.lastRequest === null
    && reloadedUi?.diagnostics?.lastOutcome === null
    && uiCapture?.stateKind === 'loaded' && uiCapture?.mode === 'current'
    && uiCapture?.protection === null
    && uiCapture?.revision === reloaded?.captureRevision
    && same(uiCapture?.card, reloadedUi?.diagnostics);
};

const alignedReload = ({
  committed, reloaded, reloadedState, reloadedUi, priorToken, token,
}) => {
  const runtime = persistenceStateOf(reloadedState)?.runtime;
  const capture = captureStateOf(reloadedState);
  return typeof token === 'string' && token !== priorToken
    && arc4DurableEvidenceComplete(committed)
    && arc4DurableEvidenceComplete(reloaded)
    && reloaded?.revision === committed?.revision
    && reloaded?.revisionRaw === committed?.revisionRaw
    && exactRowsAndAuthorityBytes(committed, reloaded)
    && runtime?.revision === reloaded?.revision
    && runtime?.sessionSeed === reloaded?.authority?.sessionRng?.seed
    && runtime?.sessionOrdinal === reloaded?.authority?.sessionRng?.ordinal
    && same(runtime?.sessionDraws, reloaded?.authority?.sessionRng?.draws)
    && exactActivePlayProjection(reloaded, reloadedUi)
    && exactRuntimeCaptureOrder(
      reloaded, reloadedState, reloadedUi, 'ui-state',
    )
    && runtime?.commits === 0
    && persistenceStateOf(reloadedState)?.bootKind === 'current-v5'
    && persistenceStateOf(reloadedState)?.lastOutcome === null
    && persistenceStateOf(reloadedState)?.bootRouteRepairPending === false
    && reloadedState?.sceneResources?.pendingPersistenceWrites === 0
    && capture?.stateKind === 'loaded' && capture?.mode === 'current'
    && capture?.protection === null && capture?.revision === reloaded?.captureRevision
    && capture?.lastOutcome === null && capture?.lastResult === null
    && capture?.actionCoordinator?.inFlight === false
    && capture?.actionCoordinator?.owner?.busy === false
    && capture?.actionCoordinator?.lastFault === null
    && capture?.card?.pendingWork === 0
    && capture?.card?.convergenceLatched === false
    && capture?.card?.lastRequest === null && capture?.card?.lastOutcome === null
    && arc5OwnershipV2RuntimeExact(reloaded, reloadedState, {
      bootstrapOutcome: 'already-aligned',
    })
    && arc5OwnershipV2RuntimeExact(reloaded, reloadedUi, {
      bootstrapOutcome: 'already-aligned',
    })
    && alignedReloadPresentation(reloaded, reloadedState, reloadedUi);
};

export const assessArc4StaleConvergence = ({
  before, committed, beforeState, oldState, oldUi, reloaded, reloadedState,
  reloadedUi, reloadBeforeActivationState, reloadActivation,
  armed = false, captureArmed = false, faultCapture, interaction,
  priorToken, token, waitError = null,
} = {}) => {
  const pagehide = exactPagehideCapture(
    faultCapture, ARC4_STALE_FAULT_CAPTURE_SCHEMA, priorToken,
  );
  const fault = pagehide?.fault;
  const oldCapture = captureStateOf(oldState);
  const oldCoordinator = oldCapture?.actionCoordinator;
  const oldUiCoordinator = captureStateOf(oldUi?.captureState)?.actionCoordinator;
  const checks = {
    captured: !!before && !!committed && !!beforeState && !!oldState && !!oldUi
      && !!reloaded && !!reloadedState && !!reloadedUi
      && !!reloadBeforeActivationState && !!reloadActivation
      && !!interaction,
    waitSettled: waitError === null,
    actionArmed: armed === true,
    captureArmed: captureArmed === true,
    captureEnvelope: pagehide !== null,
    pagehideTuple: exactPagehideTuple(pagehide, oldState, oldUi),
    beforeRuntime: exactRuntimeAtOrAfterRaw(before, beforeState),
    pagehideRuntime: exactRuntimeCaptureOrder(
      before, oldState, oldUi, 'state-ui',
    ),
    durableEvidence: arc4DurableEvidenceComplete(before)
      && arc4DurableEvidenceComplete(committed)
      && arc4DurableEvidenceComplete(reloaded),
    emptyCasTopology: committed?.revision === before?.revision + 1
      && committed?.revisionRaw === String(committed.revision)
      && exactRowsAndAuthorityBytes(before, committed),
    noCaptureMutation: committed?.captureRevision === before?.captureRevision
      && same(committed?.captureState, before?.captureState),
    ownershipV2Preserved: arc5OwnershipV2RuntimeExact(before, beforeState, {
      bootstrapOutcome: 'capture-committed-published',
    }) && arc5OwnershipV2RuntimeExact(before, oldState, {
      bootstrapOutcome: 'capture-committed-published',
    }) && arc5OwnershipV2RuntimeExact(before, oldUi, {
      bootstrapOutcome: 'capture-committed-published',
    }) && same(
      stableOwnershipV2Projection(beforeState),
      stableOwnershipV2Projection(oldState),
    ),
    oldOutcome: typeof oldCapture?.lastOutcome === 'string'
      && oldCapture.lastOutcome === `${interaction?.verb}-refused:stale`
      && oldCapture?.lastResult === null
      && same(
        omitted(stableCaptureProjection(oldState), ['lastResult']),
        omitted(stableCaptureProjection(beforeState), ['lastResult']),
      ),
    oldUiConvergence: refusedUiOutcome(oldUi, interaction?.verb, 'read-only-reload')
      && /will not retry/i.test(oldUi?.status?.text ?? '')
      && exactActivePlayProjection(before, oldUi),
    faultShape: exactKeys(fault, [
      'schema', 'operation', 'injection', 'phase', 'beforeRevision',
      'injectedRevision', 'outcome',
    ]),
    faultIdentity: fault?.schema === 'cf-v2-arc4-action-fault-witness/v1'
      && fault?.operation === `arc4.capture.${interaction?.verb}`,
    faultInjection: fault?.injection === 'stale-authority',
    faultSettlement: fault?.phase === 'settled'
      && fault?.beforeRevision === before?.revision
      && fault?.injectedRevision === committed?.revision
      && fault?.outcome === 'stale',
    oldOwnerReleased: oldCoordinator?.inFlight === false
      && oldCoordinator?.owner?.busy === false && oldCoordinator?.owner?.operation === null
      && oldCoordinator?.hold?.phase === 'released'
      && oldUiCoordinator?.inFlight === false
      && oldUiCoordinator?.owner?.busy === false
      && oldUiCoordinator?.owner?.operation === null
      && oldUiCoordinator?.hold?.phase === 'released',
    reloadStartsClosed: exactClosedPertarReload(reloadBeforeActivationState),
    reloadActivation: exactSurveyDockActivation(reloadActivation),
    oneNativeAction: actionInteraction(interaction, { verb: interaction?.verb }),
    readOnlyReload: alignedReload({
      committed, reloaded, reloadedState, reloadedUi, priorToken, token,
    }),
  };
  return assessment('Arc 4 stale convergence', checks);
};

const exactRawCaptureOutcome = (before, after, expected) => {
  const beforeAssessment = assessArc4DurableEvidence(before);
  const afterAssessment = assessArc4DurableEvidence(after);
  const beforeMirror = beforeAssessment.ownership?.mirror;
  const afterMirror = afterAssessment.ownership?.mirror;
  const receipt = captureReceiptTransition(before, after, expected);
  const v4OwnedCompatibility = exactArc4V4ActionTransition(
    beforeAssessment, afterAssessment, expected,
  );
  const newDiscoveries = afterMirror?.discoveries?.filter((row) => (
    !beforeMirror?.discoveries?.some((prior) => prior.recordId === row.recordId)
  )) ?? [];
  const hitRows = expected?.hit === true
    ? afterMirror?.discoveries?.length === beforeMirror?.discoveries?.length + 1
      && afterMirror?.catalogSpecies?.length === beforeMirror?.catalogSpecies?.length
        + (expected.firstForSpecies ? 1 : 0)
      && afterMirror?.[expected.kingdom === 'fauna' ? 'creatures' : 'specimenLots']?.length
        === beforeMirror?.[expected.kingdom === 'fauna' ? 'creatures' : 'specimenLots']?.length + 1
      && newDiscoveries.length === 1
      && newDiscoveries[0]?.speciesId === expected.speciesId
      && newDiscoveries[0]?.acquisition === expected.verb
      && newDiscoveries[0]?.provenance?.worldKey === ARC4_PERTAR_FIXTURE.worldKey
      && exactPertarWorldAddress(newDiscoveries[0]?.provenance?.worldAddress)
      && newDiscoveries[0]?.recordId === `discovery-v1:${receipt?.witness?.event}`
    : same(beforeMirror?.catalogSpecies, afterMirror?.catalogSpecies)
      && same(beforeMirror?.discoveries, afterMirror?.discoveries)
      && same(beforeMirror?.creatures, afterMirror?.creatures)
      && same(beforeMirror?.specimenLots, afterMirror?.specimenLots);
  return beforeAssessment.ok && afterAssessment.ok
    && exactArc5CertificateSuccessor(beforeAssessment, afterAssessment)
    && after?.revision === before?.revision + 1
    && after?.captureRevision === before?.captureRevision + 1
    && exactF4CaptureTransition(before, after)
    && receipt?.ok === true
    && v4OwnedCompatibility
    && same(
      unrelatedDurableProjection(before, beforeAssessment, { omitCompatibility: true }),
      unrelatedDurableProjection(after, afterAssessment, { omitCompatibility: true }),
    )
    && expectedProgressTransition(beforeMirror, afterMirror, expected, expected?.hit === true)
    && hitRows;
};

export const assessArc4PublicationConvergence = ({
  before, committed, beforeState, beforeUi, pendingUi, oldState, oldUi,
  reloaded, reloadedState, reloadedUi, reloadBeforeActivationState,
  reloadActivation,
  expected = ARC4_PERTAR_FIXTURE.actions.firstHit,
  armed = false, captureArmed = false, faultCapture, interaction,
  priorToken, token, waitError = null,
} = {}) => {
  const pagehide = exactPagehideCapture(
    faultCapture, ARC4_PUBLICATION_FAULT_CAPTURE_SCHEMA, priorToken,
  );
  const fault = pagehide?.fault;
  const oldCapture = captureStateOf(oldState);
  const oldCoordinator = oldCapture?.actionCoordinator;
  const oldUiCoordinator = captureStateOf(oldUi?.captureState)?.actionCoordinator;
  const checks = {
    captured: !!before && !!committed && !!beforeState && !!beforeUi && !!pendingUi
      && !!oldState && !!oldUi && !!reloaded && !!reloadedState && !!reloadedUi
      && !!reloadBeforeActivationState && !!reloadActivation
      && !!interaction,
    waitSettled: waitError === null,
    actionArmed: armed === true,
    captureArmed: captureArmed === true,
    captureEnvelope: pagehide !== null,
    pagehideTuple: exactPagehideTuple(pagehide, oldState, oldUi),
    beforeRuntime: exactRuntimeAtOrAfterRaw(before, beforeState),
    /* The pagehide tuple's runtime belongs to committed authority even though
       its rendered card facts deliberately remain the certified precommit
       presentation until the replacement document can publish exact truth. */
    pagehideRuntime: exactRuntimeAtOrAfterRaw(committed, oldUi)
      && exactRuntimeCaptureOrder(committed, oldState, oldUi, 'state-ui'),
    fixtureOutcome: same(expected, ARC4_PERTAR_FIXTURE.actions.firstHit),
    committedOutcome: exactRawCaptureOutcome(before, committed, expected),
    ownershipV2Held: arc5OwnershipV2RuntimeExact(before, beforeState, {
      bootstrapOutcome: 'committed-published',
    }) && arc5OwnershipV2RuntimeExact(before, beforeUi, {
      bootstrapOutcome: 'committed-published',
    }) && arc5OwnershipV2RuntimeExact(before, pendingUi, {
      bootstrapOutcome: 'committed-published',
    }),
    v4OwnedCounters: same(
      projectArc4V4OwnedCompatibility(before)?.legacy,
      ARC4_PERTAR_FIXTURE.v4OwnedCompatibility.before,
    ) && same(
      projectArc4V4OwnedCompatibility(committed)?.legacy,
      ARC4_PERTAR_FIXTURE.v4OwnedCompatibility.afterFirstHit,
    ),
    noOldOptimism: oldCapture?.stateKind === 'unavailable'
      && oldCapture?.protection === 'committed-publication-reload'
      && oldCapture?.lastResult === null
      && oldCapture?.lastOutcome === `${expected.verb}-committed-publication-reload`
      && arc5OwnershipV2UnavailableExact(oldState, {
        protection: 'committed-publication-reload',
        bootstrapOutcome: 'committed-publication-reload',
      })
      && arc5OwnershipV2UnavailableExact(oldUi, {
        protection: 'committed-publication-reload',
        bootstrapOutcome: 'committed-publication-reload',
      }),
    preservedUiFacts: arc4CaptureUiSnapshotComplete(beforeUi)
      && arc4CaptureUiSnapshotComplete(pendingUi)
      && arc4CaptureUiSnapshotComplete(oldUi)
      && exactActivePlayProjection(before, beforeUi)
      && exactActivePlayProjection(before, pendingUi)
      && same(uiFacts(beforeUi), uiFacts(pendingUi))
      && same(uiFacts(pendingUi), uiFacts(oldUi)),
    oldUiConvergence: arc4CaptureUiSnapshotComplete(oldUi)
      && oldUi?.diagnostics?.pendingWork === 1
      && oldUi?.diagnostics?.convergenceLatched === true
      && oldUi?.diagnostics?.lastOutcome?.kind === 'committed-unknown'
      && oldUi?.diagnostics?.lastOutcome?.convergence === 'read-only-reload'
      && oldUi?.status?.kind === 'committed-unknown'
      && /do not try again/i.test(oldUi?.status?.text ?? ''),
    oldUiTimeDirection: exactUiActivePlayRuntimeLag(oldUi),
    faultShape: exactKeys(fault, [
      'schema', 'operation', 'injection', 'phase', 'beforeRevision',
      'injectedRevision', 'outcome',
    ]),
    faultIdentity: fault?.schema === 'cf-v2-arc4-action-fault-witness/v1'
      && fault?.operation === `arc4.capture.${expected.verb}`,
    faultSettlement: fault?.injection === 'publication-failure'
      && fault?.phase === 'settled'
      && fault?.beforeRevision === before?.revision
      && fault?.injectedRevision === committed?.revision
      && fault?.outcome === 'committed-publication-reload',
    oldOwnerReleased: oldCoordinator?.inFlight === false
      && oldCoordinator?.owner?.busy === false && oldCoordinator?.owner?.operation === null
      && oldCoordinator?.hold?.phase === 'released'
      && oldUiCoordinator?.inFlight === false
      && oldUiCoordinator?.owner?.busy === false
      && oldUiCoordinator?.owner?.operation === null
      && oldUiCoordinator?.hold?.phase === 'released',
    reloadStartsClosed: exactClosedPertarReload(reloadBeforeActivationState),
    reloadActivation: exactSurveyDockActivation(reloadActivation),
    oneNativeAction: actionInteraction(interaction, expected),
    readOnlyReload: alignedReload({
      committed, reloaded, reloadedState, reloadedUi, priorToken, token,
    }),
  };
  return assessment('Arc 4 publication convergence', checks);
};

const progressForFixture = (evidence) => {
  const progress = projectArc4OwnershipEvidence(evidence)
    ?.biosphereProgress?.find((row) => row?.worldKey === ARC4_PERTAR_FIXTURE.worldKey) ?? null;
  return progress !== null && exactPertarWorldAddress(progress.worldAddress)
    ? progress : null;
};

const receiptBytes = (evidence) => ({
  keys: evidence?.receiptKeys,
  raw: evidence?.receiptRawRows,
  rows: evidence?.receiptRows,
});

const sameCaptureAuthority = (left, right) => left?.captureRevision === right?.captureRevision
  && same(left?.captureState, right?.captureState)
  && same(
    left?.playerRow?.extensions?.[ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace],
    right?.playerRow?.extensions?.[ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace],
  )
  && left?.legacy?.codex !== undefined
  && same(left?.legacy?.codex, right?.legacy?.codex)
  && same(left?.legacy?.names, right?.legacy?.names)
  && same(left?.legacy?.bx, right?.legacy?.bx)
  && left?.legacy?.scout === right?.legacy?.scout
  && same(
    projectArc4V4OwnedCompatibility(left)?.legacy,
    projectArc4V4OwnedCompatibility(right)?.legacy,
  );

const exhaustedLiveParity = (exhaustedRaw, exhaustedState) => {
  const mirror = projectArc4OwnershipEvidence(exhaustedRaw);
  const capture = captureStateOf(exhaustedState);
  const runtime = persistenceStateOf(exhaustedState)?.runtime;
  return mirror !== null && capture?.schema === 'cf-v2-arc4-app-state/v1'
    && exactRuntimeAtOrAfterRaw(exhaustedRaw, exhaustedState)
    && arc5OwnershipV2RuntimeExact(exhaustedRaw, exhaustedState, {
      bootstrapOutcome: 'capture-committed-published',
    })
    && capture?.stateKind === 'loaded' && capture?.mode === 'current'
    && capture?.protection === null && capture?.revision === exhaustedRaw?.captureRevision
    && capture?.catalogueSpecies === mirror.catalogSpecies.length
    && capture?.discoveries === mirror.discoveries.length
    && capture?.creatures === mirror.creatures.length
    && capture?.specimenLots === mirror.specimenLots.length
    && capture?.biospheres === mirror.biosphereProgress.length
    && runtime?.revision === exhaustedRaw?.revision
    && runtime?.sessionSeed === exhaustedRaw?.authority?.sessionRng?.seed
    && runtime?.sessionOrdinal === exhaustedRaw?.authority?.sessionRng?.ordinal
    && same(runtime?.sessionDraws, exhaustedRaw?.authority?.sessionRng?.draws);
};

const exhaustedPresentationChecks = ({
  exhaustedRaw, exhaustedState, exhaustedUi, suppressed,
}) => {
  const exhaustedProgress = progressForFixture(exhaustedRaw);
  const naturalRows = exhaustedUi?.rows?.filter((row) => row?.status !== 'empty') ?? [];
  return {
    exhaustedAuthority: exhaustedProgress?.used === ARC4_PERTAR_FIXTURE.biosphereYield
      && exhaustedUi?.budget?.yield === ARC4_PERTAR_FIXTURE.biosphereYield
      && exhaustedUi?.budget?.used === ARC4_PERTAR_FIXTURE.biosphereYield
      && exhaustedUi?.budget?.remaining === 0
      && naturalRows.length > 0
      && naturalRows.every((row) => row?.status === 'depleted'
        && row?.button?.disabled === true && row?.button?.ariaDisabled === 'true')
      && /no biosphere yield remains/i.test(naturalRows[0]?.detail ?? ''),
    disabledSuppression: suppressed?.verb === 'tame'
      && suppressed?.point?.height >= 44 && suppressed?.point?.width >= 44
      && suppressed?.point?.disabled === true
      && suppressed?.point?.modelEnabled === 'false'
      && suppressed?.pointer?.trusted === true
      && ['mouse', 'touch'].includes(suppressed?.pointer?.pointerType)
      && suppressed?.clickCount === 0
      && same(suppressed?.beforeRaw, exhaustedRaw)
      && same(suppressed?.beforeRaw, suppressed?.afterRaw)
      && same(
        stableCaptureProjection(suppressed?.beforeState),
        stableCaptureProjection(exhaustedState),
      )
      && same(
        stableCaptureProjection(suppressed?.beforeState),
        stableCaptureProjection(suppressed?.afterState),
      )
      && same(
        stableOwnershipV2Projection(suppressed?.beforeState),
        stableOwnershipV2Projection(exhaustedState),
      )
      && same(
        stableOwnershipV2Projection(suppressed?.beforeState),
        stableOwnershipV2Projection(suppressed?.afterState),
      )
      && exactRuntimeAtOrAfterRaw(suppressed?.beforeRaw, suppressed?.beforeState)
      && exactRuntimeAtOrAfterRaw(suppressed?.afterRaw, suppressed?.afterState),
  };
};

/** Finite-yield verdict. This intentionally makes no recovery claim: a
 * browser gate must not forge or wait through the 20-minute active-play
 * boundary merely to reuse the separate recovery classifier below. */
export const assessArc4Exhaustion = ({
  exhaustedRaw, exhaustedState, exhaustedUi, suppressed,
} = {}) => {
  const checks = {
    captured: !!exhaustedRaw && !!exhaustedState && !!exhaustedUi && !!suppressed,
    durableEvidence: arc4DurableEvidenceComplete(exhaustedRaw),
    exhaustedLive: exhaustedLiveParity(exhaustedRaw, exhaustedState),
    ownershipV2Ui: arc5OwnershipV2RuntimeExact(exhaustedRaw, exhaustedUi, {
      bootstrapOutcome: 'capture-committed-published',
    }),
    uiComplete: arc4CaptureUiSnapshotComplete(exhaustedUi),
    activePlayProjection: exactActivePlayProjection(exhaustedRaw, exhaustedUi),
    runtimeCaptureOrder: exactRuntimeCaptureOrder(
      exhaustedRaw, exhaustedState, exhaustedUi, 'state-ui',
    ),
    ...exhaustedPresentationChecks({
      exhaustedRaw, exhaustedState, exhaustedUi, suppressed,
    }),
  };
  return assessment('Arc 4 exhaustion', checks);
};

export const assessArc4ExhaustionRecovery = ({
  exhaustedRaw, exhaustedState, exhaustedUi,
  suppressed, offlineRaw, offlineState, offlineUi, offlineElapsedMs,
  recoveredRaw, recoveredState, recoveredUi,
} = {}) => {
  const exhaustedProgress = progressForFixture(exhaustedRaw);
  const offlineProgress = progressForFixture(offlineRaw);
  const recoveredProgress = progressForFixture(recoveredRaw);
  const exhaustedCycle = exhaustedUi?.budget?.cycle;
  const recoveredReady = recoveredUi?.rows?.filter((row) => row?.status === 'ready') ?? [];
  const exhaustion = exhaustedPresentationChecks({
    exhaustedRaw, exhaustedState, exhaustedUi, suppressed,
  });
  const checks = {
    captured: !!exhaustedRaw && !!exhaustedState && !!exhaustedUi
      && !!suppressed && !!offlineRaw && !!offlineState && !!offlineUi
      && !!recoveredRaw && !!recoveredState && !!recoveredUi,
    durableEvidence: arc4DurableEvidenceComplete(exhaustedRaw)
      && arc4DurableEvidenceComplete(offlineRaw)
      && arc4DurableEvidenceComplete(recoveredRaw),
    exhaustedLive: exhaustedLiveParity(exhaustedRaw, exhaustedState),
    ownershipV2Live: arc5OwnershipV2RuntimeExact(exhaustedRaw, exhaustedUi, {
      bootstrapOutcome: 'capture-committed-published',
    }) && arc5OwnershipV2RuntimeExact(offlineRaw, offlineState, {
      bootstrapOutcome: 'capture-committed-published',
    }) && arc5OwnershipV2RuntimeExact(offlineRaw, offlineUi, {
      bootstrapOutcome: 'capture-committed-published',
    }) && arc5OwnershipV2RuntimeExact(recoveredRaw, recoveredState, {
      bootstrapOutcome: 'capture-committed-published',
    }) && arc5OwnershipV2RuntimeExact(recoveredRaw, recoveredUi, {
      bootstrapOutcome: 'capture-committed-published',
    }),
    uiComplete: arc4CaptureUiSnapshotComplete(exhaustedUi)
      && arc4CaptureUiSnapshotComplete(offlineUi)
      && arc4CaptureUiSnapshotComplete(recoveredUi),
    activePlayProjection: exactActivePlayProjection(exhaustedRaw, exhaustedUi)
      && exactActivePlayProjection(offlineRaw, offlineUi)
      && exactActivePlayProjection(recoveredRaw, recoveredUi),
    runtimeCaptureOrder: exactRuntimeCaptureOrder(
      exhaustedRaw, exhaustedState, exhaustedUi, 'state-ui',
    ) && exactRuntimeCaptureOrder(
      offlineRaw, offlineState, offlineUi, 'state-ui',
    ) && exactRuntimeCaptureOrder(
      recoveredRaw, recoveredState, recoveredUi, 'state-ui',
    ),
    ...exhaustion,
    offlineDoesNotRecover: counter(offlineElapsedMs) && offlineElapsedMs >= 1_000
      && offlineRaw?.authority?.activePlayMs === exhaustedRaw?.authority?.activePlayMs
      && offlineUi?.budget?.cycle === exhaustedCycle
      && offlineUi?.budget?.used === ARC4_PERTAR_FIXTURE.biosphereYield
      && offlineUi?.budget?.remaining === 0
      && sameCaptureAuthority(exhaustedRaw, offlineRaw)
      && same(receiptBytes(exhaustedRaw), receiptBytes(offlineRaw))
      && same(exhaustedProgress, offlineProgress),
    activePlayBoundary: counter(exhaustedCycle)
      && recoveredRaw?.authority?.activePlayMs >= (exhaustedCycle + 1) * ARC4_ACTIVE_PLAY_CYCLE_MS
      && recoveredRaw?.authority?.activePlayMs > offlineRaw?.authority?.activePlayMs
      && recoveredRaw?.authority?.sessionRng?.seed === offlineRaw?.authority?.sessionRng?.seed
      && recoveredRaw?.authority?.sessionRng?.ordinal === offlineRaw?.authority?.sessionRng?.ordinal
      && same(recoveredRaw?.authority?.sessionRng?.draws,
        offlineRaw?.authority?.sessionRng?.draws),
    receiptFreeRecovery: same(receiptBytes(recoveredRaw), receiptBytes(offlineRaw)),
    ownershipStable: sameCaptureAuthority(recoveredRaw, offlineRaw)
      && same(recoveredProgress, offlineProgress),
    recoveredPresentation: recoveredUi?.budget?.cycle === exhaustedCycle + 1
      && recoveredUi?.budget?.yield === ARC4_PERTAR_FIXTURE.biosphereYield
      && recoveredUi?.budget?.used === 0
      && recoveredUi?.budget?.remaining === ARC4_PERTAR_FIXTURE.biosphereYield
      && recoveredReady.length > 0
      && recoveredReady.every((row) => row?.button?.modelEnabled === 'true'
        && row?.button?.disabled === false && row?.button?.ariaDisabled === 'false')
      && /closing the game does not advance recovery/i
        .test(recoveredUi?.budget?.text ?? ''),
    liveProjectionStable: same(
      stableCaptureProjection(exhaustedState),
      stableCaptureProjection(offlineState),
    ) && same(
      omitted(stableCaptureProjection(recoveredState), ['lastResult']),
      omitted(stableCaptureProjection(offlineState), ['lastResult']),
    ),
  };
  return assessment('Arc 4 exhaustion/recovery', checks);
};

const validRect = (value) => record(value)
  && [value.left, value.top, value.right, value.bottom, value.width, value.height]
    .every((entry) => typeof entry === 'number' && Number.isFinite(entry))
  && value.width >= 0 && value.height >= 0
  && Math.abs(value.right - value.left - value.width) <= 0.75
  && Math.abs(value.bottom - value.top - value.height) <= 0.75;

const contained = (inner, outer, tolerance = 0.75) => validRect(inner) && validRect(outer)
  && inner.left >= outer.left - tolerance && inner.right <= outer.right + tolerance
  && inner.top >= outer.top - tolerance && inner.bottom <= outer.bottom + tolerance;

const overlaps = (left, right) => validRect(left) && validRect(right)
  && Math.min(left.right, right.right) - Math.max(left.left, right.left) > 0.75
  && Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 0.75;

const validScrollOffset = (value) => record(value)
  && Number.isFinite(value.left) && Number.isFinite(value.top);

const translatedRect = (value, offset) => validRect(value) && validScrollOffset(offset)
  ? {
    left: value.left + offset.left,
    top: value.top + offset.top,
    right: value.right + offset.left,
    bottom: value.bottom + offset.top,
    width: value.width,
    height: value.height,
  }
  : null;

const sameRect = (left, right, tolerance = 0.75) => validRect(left) && validRect(right)
  && ['left', 'top', 'right', 'bottom', 'width', 'height']
    .every((key) => Math.abs(left[key] - right[key]) <= tolerance);

const exactOwnedPoint = (point, verb = null, close = false) => record(point)
  && Number.isFinite(point.x) && Number.isFinite(point.y)
  && point.tag === 'BUTTON' && point.close === close
  && (close ? point.verb === null : point.verb === verb);

const stableOwnedPoint = (before, after, verb = null, close = false) => (
  exactOwnedPoint(before, verb, close) && exactOwnedPoint(after, verb, close)
  && Math.abs(before.x - after.x) <= 0.75 && Math.abs(before.y - after.y) <= 0.75
);

const focusProof = (value, verb = null, close = false) => value?.modality === 'keyboard'
  && value?.focusVisible === true && value?.decorationPainted === true
  && value?.styleChanged === true
  && (close ? value?.close === true : value?.verb === verb
    && value?.semanticKey === `capture:${verb}`);

export const assessArc4CaptureCardGeometryFocus = ({
  schema, viewport, ui, planetsideRect, controls, close, settlement,
  layoutCoordinateSpace, scrollWidth, clientWidth,
} = {}) => {
  const viewportRect = {
    left: 0, top: 0, right: viewport?.width, bottom: viewport?.height,
    width: viewport?.width, height: viewport?.height,
  };
  const canonicalControls = Array.isArray(controls)
    && same(controls.map(({ verb }) => verb), ARC4_CAPTURE_VERBS);
  const controlsExact = canonicalControls && controls.every((control) => (
    control?.scrollSettled === true
    && validRect(control?.buttonRect) && control.buttonRect.width >= 44
    && control.buttonRect.height >= 44
    && validRect(control?.cardRect)
    && contained(control.buttonRect, control.cardRect)
    && contained(control.buttonRect, viewportRect)
    && validScrollOffset(control?.scrollOffset)
    && sameRect(control?.layoutRect,
      translatedRect(control.buttonRect, control.scrollOffset))
    && stableOwnedPoint(control?.beforePoint, control?.afterRenderPoint, control.verb)
    && control?.accessibleName === ({
      tame: 'Tame', scavenge: 'Scavenge', sample: 'Sample',
    })[control.verb]
    && focusProof(control?.focus, control.verb)
  ));
  const noControlOverlap = canonicalControls && controls.every((control, index) => (
    controls.every((other, otherIndex) => index === otherIndex
      || !overlaps(control.layoutRect, other.layoutRect))
  ));
  const checks = {
    captured: schema === ARC4_CAPTURE_GEOMETRY_EVIDENCE_SCHEMA
      && record(viewport) && !!ui && !!planetsideRect && !!close,
    commonLayoutCoordinates:
      layoutCoordinateSpace === ARC4_CAPTURE_LAYOUT_COORDINATE_SPACE,
    viewport: boundedText(viewport?.name, 80)
      && Number.isFinite(viewport?.width) && viewport.width > 0
      && Number.isFinite(viewport?.height) && viewport.height > 0,
    uiComplete: arc4CaptureUiSnapshotComplete(ui),
    oneSurfaceOneClose: ui?.mountCount === 1 && ui?.directCloseCount === 1,
    horizontalContainment: contained(ui?.cardRect, viewportRect)
      && counter(scrollWidth) && counter(clientWidth) && scrollWidth <= clientWidth,
    stackedSurfaceSeparation: validRect(planetsideRect)
      && !overlaps(ui?.cardRect, planetsideRect),
    controlsExact,
    noControlOverlap,
    closeGeometry: validRect(close?.rect) && close.rect.width >= 44
      && close.rect.height >= 44 && contained(close.rect, ui?.cardRect)
      && contained(close.rect, viewportRect)
      && stableOwnedPoint(close?.beforePoint, close?.afterRenderPoint, null, true)
      && /close survey card/i.test(close?.accessibleName ?? ''),
    closeFocus: focusProof(close?.focus, null, true),
    pendingFocus: settlement === null || settlement === undefined
      || (settlement?.verb === 'sample'
        && settlement?.pending?.activeStatus === true
        && settlement?.pending?.focusVisible === true
        && settlement?.pending?.convergence === 'none'
        && settlement?.reopened?.pendingVisible === true
        && settlement?.reopened?.allActionsDisabled === true
        && settlement?.reopened?.closeHeight >= 44),
    settlementFocus: settlement === null || settlement === undefined
      || (settlement?.settled?.verb === settlement?.verb
        && settlement?.settled?.semanticKey === `capture:${settlement?.verb}`
        && settlement?.settled?.focusVisible === true
        && settlement?.settled?.decorationPainted === true),
    controlsGeometry: controlsExact,
  };
  return assessment('Arc 4 capture-card geometry/focus', checks);
};

export const arc4BrowserOutcomePasses = ({ released, assessment: result, surface }) => (
  released === true && result?.ok === true && surface === 'survey'
);

/* Module-load controls. These fixtures are constructed independently of the
   page and exercise every public verdict in a green and deliberately red
   direction. Each named mutation below changes one clause only; incomplete
   hostile inputs are also required to fail closed without throwing. */

const SELFTEST_EVENTS = Object.freeze([
  '03c6f2d5dd434b91dee56057a27b84a463f0cf906db51af71a53b833a012101b',
  '0232941308ec87f2df001aa5783fe3362a9d0478904a390e3bc0a12b3c09e01f',
]);
const selftestEvent = (ordinal) => SELFTEST_EVENTS[ordinal] ?? null;
const SELFTEST_IDS = Object.freeze({
  discovery: `discovery-v1:${selftestEvent(0)}`,
  lot: `specimen-v1:${'2'.repeat(64)}`,
  genome: `genome-v1:${'3'.repeat(64)}`,
});

const SELFTEST_WORLD_ADDRESS = ARC4_PERTAR_FIXTURE.worldAddress;

const emptyMirror = (revision = 0) => ({
  schema: 'cf-v2-ownership-state/v1', version: 1, revision, mode: 'current',
  catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
  biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  legacyProtection: null,
});

const hitMirror = () => {
  const species = {
    speciesId: ARC4_PERTAR_FIXTURE.actions.firstHit.speciesId,
    kingdom: 'microbe',
    genomeIdentity: SELFTEST_IDS.genome,
    genome: { gen: ARC4_PERTAR_FIXTURE.actions.firstHit.generation, seed: 111 },
    alias: null,
    firstObservationId: SELFTEST_IDS.discovery,
  };
  const discovery = {
    recordId: SELFTEST_IDS.discovery,
    speciesId: species.speciesId,
    acquisition: 'sample',
    firstForSpecies: true,
    provenance: {
      kind: 'world', verb: 'sample', worldKey: ARC4_PERTAR_FIXTURE.worldKey,
      worldAddress: SELFTEST_WORLD_ADDRESS, cycle: 0, sourceOrdinal: 13,
    },
  };
  const lot = {
    lotId: SELFTEST_IDS.lot, speciesId: species.speciesId, kind: 'microbe',
    quantity: 1, origin: 'wild', acquisitionRecordId: discovery.recordId,
  };
  const progress = {
    worldKey: ARC4_PERTAR_FIXTURE.worldKey,
    worldAddress: SELFTEST_WORLD_ADDRESS,
    cycle: 0, used: 1,
    successful: [{ speciesId: species.speciesId, source: 'sample' }],
  };
  return {
    ...emptyMirror(1), catalogSpecies: [species], discoveries: [discovery],
    specimenLots: [lot], biosphereProgress: [progress],
  };
};

const missMirror = () => {
  const mirror = structuredClone(hitMirror());
  mirror.revision = 2;
  mirror.biosphereProgress[0].used = 2;
  return mirror;
};

const exhaustedMirror = () => ({
  ...emptyMirror(16),
  biosphereProgress: [{
    worldKey: ARC4_PERTAR_FIXTURE.worldKey,
    worldAddress: SELFTEST_WORLD_ADDRESS,
    cycle: 0, used: ARC4_PERTAR_FIXTURE.biosphereYield, successful: [],
  }],
});

const carrier = (value) => Object.freeze({
  version: 1, json: canonicalToolJson(value),
});

const arc5MigrationCertificate = (source) => {
  const registeredSource = registeredMirrorForDigest(source);
  const target = registeredSource === null
    ? null : arc5OwnershipTargetMirrorForDigest(registeredSource);
  if (registeredSource === null || target === null) {
    throw new Error('Arc 5 selftest source could not be registered for migration');
  }
  return {
    schema: ARC5_OWNERSHIP_MIGRATION_SCHEMA,
    version: 1,
    sourceSchema: ARC5_OWNERSHIP_SOURCE_SCHEMA,
    sourceVersion: 1,
    sourceRevision: registeredSource.revision,
    sourceMode: registeredSource.mode,
    sourceDigest: sha256(JSON.stringify(registeredSource)),
    targetSchema: ARC5_OWNERSHIP_TARGET_SCHEMA,
    targetVersion: 2,
    targetRevision: target.revision,
    targetMode: target.source.mode,
    targetDigest: sha256(JSON.stringify(target)),
  };
};

const ownershipExtensions = (mirror) => {
  const groupRows = {
    catalogSpecies: mirror.catalogSpecies,
    discoveries: mirror.discoveries,
    creatures: mirror.creatures,
    specimenLots: mirror.specimenLots,
  };
  const shards = {};
  const shardDigests = {};
  for (const group of ARC4_SHARD_GROUPS) {
    const values = groupRows[group.kind];
    shards[group.kind] = [];
    shardDigests[group.kind] = [];
    for (let index = 0; index < 4; index++) {
      const rows = index === 0 ? values : [];
      const start = index === 0 ? 0 : values.length;
      const end = values.length;
      const digest = sha256(canonicalToolJson(rows));
      const shard = {
        schema: 'cf-v2-ownership-shard/v1', version: 1, kind: group.kind,
        revision: mirror.revision, index, count: 4, start, end,
        total: values.length, digest, rows,
      };
      shards[group.kind].push(shard);
      shardDigests[group.kind].push(digest);
    }
  }
  const payload = {
    biosphereProgress: mirror.biosphereProgress,
    legacyBioX: mirror.legacyBioX,
    scoutCreatureId: mirror.scoutCreatureId,
  };
  const progressDigest = sha256(canonicalToolJson(payload));
  const progress = {
    schema: 'cf-v2-ownership-progress/v1', version: 1, revision: mirror.revision,
    digest: progressDigest, payload,
  };
  const reconstructedMirror = registeredMirrorForDigest(
    JSON.parse(canonicalToolJson(mirror)),
  );
  if (reconstructedMirror === null) {
    throw new Error('Arc 4 selftest mirror could not be registered for digest');
  }
  const manifest = {
    schema: 'cf-v2-ownership-manifest/v1', version: 1, revision: mirror.revision,
    mode: mirror.mode, fixedShardCount: 4,
    rowCounts: {
      catalogSpecies: mirror.catalogSpecies.length,
      discoveries: mirror.discoveries.length,
      creatures: mirror.creatures.length,
      specimenLots: mirror.specimenLots.length,
      biosphereProgress: mirror.biosphereProgress.length,
      legacyBioX: mirror.legacyBioX.length,
    },
    shardDigests,
    progressDigest,
    stateDigest: sha256(JSON.stringify(reconstructedMirror)),
    legacyProtection: mirror.legacyProtection,
  };
  const extensions = {
    player: {
      'arc4.ownership.manifest': carrier(manifest),
      'arc4.ownership.progress': carrier(progress),
      [ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace]: carrier(
        arc5MigrationCertificate(reconstructedMirror),
      ),
    },
    creatures: {}, catalog: {}, inventory: {}, settings: {},
  };
  for (const group of ARC4_SHARD_GROUPS) {
    for (let index = 0; index < 4; index++) {
      extensions[group.segment][`${group.prefix}.${index}`] = carrier(shards[group.kind][index]);
    }
  }
  return extensions;
};

const captureReceipt = (before, expected, stateDigest) => {
  const oracle = captureAttemptOracle(before, expected?.verb);
  if (oracle === null) throw new Error('Arc 4 selftest capture oracle was unavailable');
  const witness = canonicalToolJson({
    schema: 'cf-v2-capture-plan-witness/v1',
    event: oracle.event,
    candidateDraw: oracle.candidateDraw,
    successDraw: oracle.successDraw,
    chance: oracle.chance,
    hit: oracle.hit,
    spent: 1,
    successorDigest: stateDigest,
  });
  return { ordinal: oracle.receiptOrdinal, kind: ARC4_CAPTURE_RECEIPT_KIND, witness };
};

const SELFTEST_ARC2_SOURCE_ACTION =
  'loot1|legacy-migration|save-v2-user|items-v1|||migration%3Av4-v5';
const selftestLegacyGearInstance = ({
  ordinal, baseId, baseName, slot, baseTier, rarityTier, rarity, tags,
  baseEffects, generationSeed, legacyAffix = null,
}) => ({
  schema: 1,
  tableVersion: 1,
  construction: 'legacy',
  instanceId: `gear1|${SELFTEST_ARC2_SOURCE_ACTION}|${ordinal}`,
  baseId,
  baseName,
  slot,
  baseTier,
  itemLevel: baseTier,
  quality: 0,
  rarityTier,
  rarity,
  tags,
  baseEffects,
  implicits: Object.keys(baseEffects),
  naturalAffixes: [],
  upgrade: 0,
  sockets: [],
  generation: { seed: generationSeed, ordinal },
  legacyAffix,
  provenance: {
    kind: 'legacy-migration',
    sourceActionId: SELFTEST_ARC2_SOURCE_ACTION,
    receiptId: 'migration:v4-v5',
  },
});

const SELFTEST_ARC2_INSTANCES = Object.freeze([
  selftestLegacyGearInstance({
    ordinal: 11_000, baseId: 'headlamp', baseName: 'Miner’s Headlamp',
    slot: 'helmet', baseTier: 1, rarityTier: 1, rarity: 'uncommon',
    tags: ['gear', 'helmet', 'strike'], baseEffects: { strike: 0.02 },
    generationSeed: 1_345_627_531,
    legacyAffix: { affixId: 'strike', value: 0.05, forBaseId: 'headlamp' },
  }),
  selftestLegacyGearInstance({
    ordinal: 14_000, baseId: 'earpiece', baseName: 'Comms Earpiece',
    slot: 'ears', baseTier: 1, rarityTier: 1, rarity: 'uncommon',
    tags: ['gear', 'ears', 'contact'], baseEffects: { contact: 10 },
    generationSeed: 490_740_286,
  }),
  selftestLegacyGearInstance({
    ordinal: 18_000, baseId: 'diplobeacon', baseName: 'Diplomat’s Beacon',
    slot: 'necklace', baseTier: 2, rarityTier: 3, rarity: 'rare',
    tags: ['gear', 'necklace', 'contact'], baseEffects: { contact: 20 },
    generationSeed: 2_507_706_994,
  }),
]);
const SELFTEST_ARC2_LOOT = Object.freeze({
  kind: 'inventory',
  inventory: Object.freeze({
    schema: 1, revision: 0, capacity: 200,
    entries: Object.freeze(SELFTEST_ARC2_INSTANCES.map((instance) => Object.freeze({
      instance, favorite: false, locked: false,
    }))),
    equipped: Object.freeze(SELFTEST_ARC2_INSTANCES.map((instance) => Object.freeze({
      slot: instance.slot, instanceId: instance.instanceId,
    }))),
    pendingRewards: Object.freeze([]),
  }),
  stackableCounts: Object.freeze([
    Object.freeze({ baseId: 'plate', count: 3 }),
    Object.freeze({ baseId: 'lens', count: 1 }),
    Object.freeze({ baseId: 'cell', count: 2 }),
    Object.freeze({ baseId: 'jumpdrive', count: 1 }),
  ]),
});
const SELFTEST_ARC2_LOOT_CARRIER = Object.freeze({
  version: 1, json: JSON.stringify(SELFTEST_ARC2_LOOT),
});
const SELFTEST_ARC2_LOOT_NO_JUMP = Object.freeze({
  ...SELFTEST_ARC2_LOOT,
  stackableCounts: Object.freeze(SELFTEST_ARC2_LOOT.stackableCounts.filter(
    ({ baseId }) => baseId !== 'jumpdrive',
  )),
});
const SELFTEST_ARC2_LOOT_NO_JUMP_CARRIER = Object.freeze({
  version: 1, json: JSON.stringify(SELFTEST_ARC2_LOOT_NO_JUMP),
});
const selftestArc2Evidence = (carrierValue) => ({
  inventoryRow: { extensions: { 'arc2.loot': carrierValue } },
});
const selftestPertarCapability = inspectPertarArc2Capability(
  selftestArc2Evidence(SELFTEST_ARC2_LOOT_CARRIER),
);
const selftestNoJumpCapability = inspectPertarArc2Capability(
  selftestArc2Evidence(SELFTEST_ARC2_LOOT_NO_JUMP_CARRIER),
);
const selftestPertarShip = projectArc4PertarShipSource({
  systemIds: selftestPertarCapability?.systemIds,
  ascChapter: ARC4_PERTAR_SOURCE_FACTS.legacyAscChapter,
});
const selftestNoJumpShip = projectArc4PertarShipSource({
  systemIds: selftestNoJumpCapability?.systemIds,
  ascChapter: ARC4_PERTAR_SOURCE_FACTS.legacyAscChapter,
});
const selftestEmptySkimSource = classifyArc4PertarLegacySkimSources(
  [], [ARC4_PERTAR_FIXTURE.star.seed],
);
const selftestOrphanSkimSource = classifyArc4PertarLegacySkimSources(
  [[424_242, 2]], [ARC4_PERTAR_FIXTURE.star.seed],
);

const makeDurable = (mirror, {
  revision = mirror.revision,
  activePlayMs = 0,
  seed = ARC4_PERTAR_FIXTURE.sessionSeed,
  ordinal = 0,
  draws = {},
  receipts = [],
  essence = 0,
  essenceEarned = essence,
  ownedCounters = ARC4_PERTAR_FIXTURE.v4OwnedCounters.before,
} = {}) => {
  const ownership = ownershipExtensions(mirror);
  const projected = projectLegacyMirror(mirror);
  if (projected === null) throw new Error('Arc 4 selftest mirror did not project');
  const ever = {
    v: 1,
    hybrids: ownedCounters.hybrids,
    best: ownedCounters.best,
    maxGen: ownedCounters.maxGen,
    scanhits: 0,
  };
  const legacy = {
    v: 4, epoch: 0, at: 0, essence, essenceEarned,
    ever, br: ownedCounters.bestRank,
    names: projected.names,
    codex: projected.codex.map(({ g, f, w }) => ({ g, f, w })),
    scout: projected.scout, bx: projected.bx,
  };
  const authority = {
    activePlayMs,
    sessionRng: {
      seed, ordinal,
      draws: Object.fromEntries(Object.entries(draws)
        .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)),
    },
  };
  const authorityJson = JSON.stringify({
    activePlayMs: authority.activePlayMs,
    sessionRng: {
      seed: authority.sessionRng.seed,
      ordinal: authority.sessionRng.ordinal,
      draws: authority.sessionRng.draws,
    },
  });
  const authorityCarrier = Object.freeze({ version: 1, json: authorityJson });
  const rows = {
    player: {
      schema: 5, segment: 'player',
      data: {
        v: 4, epoch: 0, at: 0, essence, essenceEarned, names: projected.names,
        ever, br: ownedCounters.bestRank,
      },
      extensions: {
        'f4.authority': authorityCarrier,
        ...ownership.player,
      },
    },
    creatures: {
      schema: 5, segment: 'creatures', data: {}, extensions: ownership.creatures,
    },
    catalog: {
      schema: 5, segment: 'catalog',
      data: {
        codex: projected.codex.map(({ g, f, w }) => ({ g, f, w })),
        scout: projected.scout,
      },
      extensions: ownership.catalog,
    },
    inventory: {
      schema: 5, segment: 'inventory', data: { bx: projected.bx },
      extensions: {
        'arc2.loot': SELFTEST_ARC2_LOOT_CARRIER,
        ...ownership.inventory,
      },
    },
    settings: {
      schema: 5, segment: 'settings', data: {}, extensions: ownership.settings,
    },
  };
  const receiptRows = receipts.map((row) => structuredClone(row));
  return {
    revisionRaw: String(revision), revision,
    legacyRaw: JSON.stringify(legacy), legacy,
    playerRaw: JSON.stringify(rows.player), playerRow: rows.player,
    creaturesRaw: JSON.stringify(rows.creatures), creaturesRow: rows.creatures,
    catalogRaw: JSON.stringify(rows.catalog), catalogRow: rows.catalog,
    inventoryRaw: JSON.stringify(rows.inventory), inventoryRow: rows.inventory,
    settingsRaw: JSON.stringify(rows.settings), settingsRow: rows.settings,
    authorityVersion: 1, authorityJson: authorityCarrier.json, authority,
    captureRevision: mirror.revision, captureState: structuredClone(mirror),
    receiptKeys: receiptRows.map(({ ordinal: value }) => `receipt:${value}`),
    receiptRawRows: receiptRows.map((row) => JSON.stringify(row)),
    receiptRows,
  };
};

const withAuthorityActivePlaySelftest = (evidence, activePlayMs) => {
  const next = structuredClone(evidence);
  const authority = structuredClone(next.authority);
  authority.activePlayMs = activePlayMs;
  const authorityJson = JSON.stringify({
    activePlayMs: authority.activePlayMs,
    sessionRng: {
      seed: authority.sessionRng.seed,
      ordinal: authority.sessionRng.ordinal,
      draws: authority.sessionRng.draws,
    },
  });
  next.authority = authority;
  next.authorityJson = authorityJson;
  next.playerRow.extensions['f4.authority'].json = authorityJson;
  next.playerRaw = JSON.stringify(next.playerRow);
  return next;
};

const withRuntimeActivePlaySelftest = (value, activePlayMs) => {
  const next = structuredClone(value);
  next.persistence.runtime.activePlayMs = activePlayMs;
  return next;
};

const withUiActivePlaySelftest = (ui, activePlayMs) => {
  const next = withRuntimeActivePlaySelftest(ui, activePlayMs);
  const cycle = Math.floor(activePlayMs / ARC4_ACTIVE_PLAY_CYCLE_MS);
  next.budget.cycle = cycle;
  next.budget.recoveryRemainingActivePlayMs
    = (cycle + 1) * ARC4_ACTIVE_PLAY_CYCLE_MS - activePlayMs;
  next.budget.text = next.budget.text.replace(
    ARC4_ACTIVE_PLAY_COUNTDOWN_PATTERN,
    activePlayCountdownText(next.budget.recoveryRemainingActivePlayMs),
  );
  return next;
};

const actionCoordinator = ({
  busy = false, operation = null, phase = 'released', fault = null,
  faultArmed = {},
} = {}) => ({
  inFlight: busy,
  owner: {
    schema: 'cf-v2-product-action-coordinator-diagnostics/v1', busy, operation,
  },
  hold: {
    schema: 'cf-v2-product-action-hold-diagnostics/v1', phase, operation,
    sequence: 1,
  },
  faultArmed: {
    storageFailure: false, staleAuthority: false, publicationFailure: false,
    ...faultArmed,
  },
  lastFault: fault,
});

const appCaptureState = (raw, {
  lastOutcome = null, lastResult = null, coordinator = actionCoordinator(),
  unavailable = false, card = null,
} = {}) => ({
  schema: 'cf-v2-arc4-app-state/v1',
  stateKind: unavailable ? 'unavailable' : 'loaded',
  mode: unavailable ? null : raw.captureState.mode,
  protection: unavailable ? 'committed-publication-reload' : null,
  bootstrapPending: false, bootstrapCandidateReady: false, bootstrapOutcome: null,
  revision: unavailable ? null : raw.captureRevision,
  catalogueSpecies: unavailable ? 0 : raw.captureState.catalogSpecies.length,
  discoveries: unavailable ? 0 : raw.captureState.discoveries.length,
  creatures: unavailable ? 0 : raw.captureState.creatures.length,
  specimenLots: unavailable ? 0 : raw.captureState.specimenLots.length,
  biospheres: unavailable ? 0 : raw.captureState.biosphereProgress.length,
  lastOutcome, lastResult, card,
  actionCoordinator: coordinator,
});

const appOwnershipV2State = (raw, {
  unavailable = false, boot = false, bootstrapOutcome = undefined,
} = {}) => {
  const migration = projectArc5OwnershipMigrationEvidence(raw);
  if (migration === null) {
    throw new Error('Arc 5 selftest durable migration evidence is invalid');
  }
  const outcome = bootstrapOutcome ?? (unavailable
    ? 'committed-publication-reload'
    : boot ? 'already-aligned'
      : raw.captureRevision === 0
        ? 'committed-published' : 'capture-committed-published');
  const source = migration.source;
  const target = migration.targetMirror;
  return {
    schema: 'cf-v2-arc5-app-state/v1',
    stateKind: unavailable ? 'unavailable' : 'loaded',
    mode: unavailable ? null : source.mode,
    protection: unavailable ? 'committed-publication-reload' : null,
    bootstrapPending: false,
    bootstrapOutcome: outcome,
    revision: unavailable ? null : target.revision,
    sourceRevision: unavailable ? null : source.revision,
    sourceDigest: unavailable ? null : migration.sourceDigest,
    targetDigest: unavailable ? null : migration.targetDigest,
    acquisitions: unavailable ? 0 : source.discoveries.length,
    bredAcquisitions: 0,
    creatures: unavailable ? 0 : target.creatures.length,
    creatureTombstones: 0,
    specimenLots: unavailable ? 0 : target.specimenLots.length,
    specimenTombstones: 0,
    biospheres: unavailable ? 0 : source.biosphereProgress.length,
  };
};

const runtimeFor = (raw, commits = 0) => ({
  revision: raw.revision,
  sessionSeed: raw.authority.sessionRng.seed,
  sessionOrdinal: raw.authority.sessionRng.ordinal,
  sessionDraws: structuredClone(raw.authority.sessionRng.draws),
  activePlayMs: raw.authority.activePlayMs,
  commits,
});

const appState = (raw, capture, {
  route = true, boot = false,
} = {}) => ({
  ...(route ? {
    mode: 'surface', gal: 999, galX: 90, galY: -60,
    star: ARC4_PERTAR_FIXTURE.publicStar.seed,
    starX: ARC4_PERTAR_FIXTURE.publicStar.x,
    starY: ARC4_PERTAR_FIXTURE.publicStar.y,
    planet: ARC4_PERTAR_FIXTURE.planet.seed,
    planetOrdinal: ARC4_PERTAR_FIXTURE.planet.ordinal,
    navGalaxyKey: 'CF1|g:999@90,-60',
    navStarKey: 'CF1|g:999@90,-60|s:1347060996@414.31,168.49',
    navWorldKey: ARC4_PERTAR_FIXTURE.worldKey,
    renderedScene: {
      serial: 3, mode: 'surface', galaxyKey: 'CF1|g:999@90,-60',
      starKey: 'CF1|g:999@90,-60|s:1347060996@414.31,168.49',
      worldKey: ARC4_PERTAR_FIXTURE.worldKey,
    },
  } : {}),
  cardOpen: true,
  cardTitle: 'Pertar',
  persistence: {
    bootKind: boot ? 'current-v5' : 'current-v5',
    lastOutcome: null, bootRouteRepairPending: false,
    runtime: runtimeFor(raw, 0),
  },
  sceneResources: { pendingPersistenceWrites: 0 },
  capture,
  ownershipV2: appOwnershipV2State(raw, {
    unavailable: capture?.stateKind === 'unavailable', boot,
  }),
});

const uiRow = (verb, {
  status = 'ready', pending = false, eligible = 3,
} = {}) => {
  const label = { tame: 'Tame', scavenge: 'Scavenge', sample: 'Sample' }[verb];
  const pool = { tame: 'fauna', scavenge: 'flora or fungi', sample: 'microbes' }[verb];
  const ready = status === 'ready';
  return {
    verb, status, semanticKey: `capture:${verb}`,
    title: `${label} · ${pool}`,
    detail: ready
      ? `Randomly attempts one of ${eligible} eligible ${pool} from the full biosphere.`
      : status === 'depleted'
        ? 'Worked Out — no Biosphere Yield remains this cycle. No roll or attempt was spent.'
        : `No eligible ${pool}.`,
    odds: ready ? {
      text: `One of ${eligible} eligible ${pool} is selected at random. Overall success chance 44.5%; individual odds range 44%–45%.`,
      eligibleCount: eligible, overallChance: 0.445, chanceMin: 0.44, chanceMax: 0.45,
    } : null,
    button: {
      exists: true, connected: true, tag: 'BUTTON', label, verb,
      focusKey: `capture:${verb}`,
      // The model remains honest while the card's single-flight hold supplies
      // the temporary DOM disablement. Pending must not rewrite eligibility.
      modelEnabled: String(ready),
      disabled: pending || !ready,
      ariaDisabled: String(pending || !ready),
      rect: { left: 30, top: 0, right: 130, bottom: 44, width: 100, height: 44 },
      point: { x: 80, y: 22, tag: 'BUTTON', verb, close: false },
    },
  };
};

const uiSnapshot = (capture, {
  used = 0, cycle = 0, statuses = {}, pendingVerb = null,
  outcome = null, convergence = false, raw = null, boot = false,
} = {}) => {
  const pending = pendingVerb !== null || convergence;
  const rows = ARC4_CAPTURE_VERBS.map((verb) => uiRow(verb, {
    status: statuses[verb] ?? 'ready', pending,
  }));
  const remaining = ARC4_PERTAR_FIXTURE.biosphereYield - used;
  const renderedActivePlayMs = raw?.authority?.activePlayMs
    ?? cycle * ARC4_ACTIVE_PLAY_CYCLE_MS;
  const recoveryRemainingActivePlayMs = (cycle + 1) * ARC4_ACTIVE_PLAY_CYCLE_MS
    - renderedActivePlayMs;
  const diagnostics = {
    schema: 'cf-v2-capture-card-diagnostics/v1', attachedMountCount: 1,
    retainedDomCount: 30, pendingWork: pending ? 1 : 0,
    convergenceLatched: convergence, actionControlCount: 3,
    delegatedListenerCount: 1,
    contextKey: `${ARC4_PERTAR_FIXTURE.worldKey}|epoch:0|${ARC4_PERTAR_FIXTURE.fullRosterFingerprint}`,
    lastRequest: pendingVerb || outcome ? { verb: pendingVerb ?? outcome.verb } : null,
    lastOutcome: outcome,
  };
  return {
    schema: ARC4_CAPTURE_UI_EVIDENCE_SCHEMA, cardOpen: true,
    cardTitle: 'Pertar', planetsideHeading: 'PLANETSIDE — Biosphere',
    cardRect: { left: 10, top: 10, right: 410, bottom: 710, width: 400, height: 700 },
    mountCount: 1, directCloseCount: 1,
    close: {
      exists: true, tag: 'BUTTON', label: 'Close Survey card',
      rect: { left: 350, top: 20, right: 394, bottom: 64, width: 44, height: 44 },
      point: { x: 372, y: 42, tag: 'BUTTON', verb: null, close: true },
    },
    controller: 'v1', contextKey: diagnostics.contextKey,
    ariaBusy: String(pending),
    summary: 'Showing 8 of 19 life forms. Capture draws from all 19, not only this preview. Each action chooses uniformly from every eligible species for that action in the full biosphere.',
    budget: {
      text: `${remaining} of 16 capture attempts remain; ${used} spent this active-play cycle. Tame, Scavenge, and Sample share Biosphere Yield. Every attempt spends 1, hit or miss. Full recovery at the next 20-minute active-play cycle — ${activePlayCountdownText(recoveryRemainingActivePlayMs)} of active play remaining. Closing the game does not advance recovery.`,
      yield: 16, used, remaining, cycle,
      recoveryRemainingActivePlayMs,
    },
    rows,
    status: outcome ? {
      hidden: false, kind: outcome.kind, convergence: outcome.convergence,
      text: `${outcome.title} ${outcome.detail}`,
    } : pendingVerb ? {
      hidden: false, kind: 'pending', convergence: 'none',
      text: `${pendingVerb} attempt pending. No capture, attempt spend, Compendium page or reward is published until the durable outcome settles. Close remains available; reopening stays busy.`,
    } : { hidden: true, kind: null, convergence: null, text: '' },
    diagnostics,
    captureState: capture,
    ownershipV2: appOwnershipV2State(raw, {
      unavailable: capture?.stateKind === 'unavailable', boot,
    }),
    persistence: raw === null ? null : {
      bootKind: 'current-v5', lastOutcome: null, bootRouteRepairPending: false,
      runtime: runtimeFor(raw, 0),
    },
    activeElement: {
      verb: null, semanticKey: null, status: false, close: false, focusVisible: false,
    },
  };
};

const firstExpected = ARC4_PERTAR_FIXTURE.actions.firstHit;
const secondExpected = ARC4_PERTAR_FIXTURE.actions.secondMiss;
const beforeRawSelftest = makeDurable(emptyMirror());
const hitManifestDigest = inspectArc4Ownership(inspectV5Rows(
  makeDurable(hitMirror()),
).rows).manifest.stateDigest;
const hitCarrierOrderedMirror = JSON.parse(canonicalToolJson(hitMirror()));
const hitNaiveCarrierDigest = sha256(JSON.stringify({
  schema: hitCarrierOrderedMirror.schema,
  version: hitCarrierOrderedMirror.version,
  revision: hitCarrierOrderedMirror.revision,
  mode: hitCarrierOrderedMirror.mode,
  catalogSpecies: hitCarrierOrderedMirror.catalogSpecies,
  discoveries: hitCarrierOrderedMirror.discoveries,
  creatures: hitCarrierOrderedMirror.creatures,
  specimenLots: hitCarrierOrderedMirror.specimenLots,
  biosphereProgress: hitCarrierOrderedMirror.biosphereProgress,
  legacyBioX: hitCarrierOrderedMirror.legacyBioX,
  scoutCreatureId: hitCarrierOrderedMirror.scoutCreatureId,
  legacyProtection: hitCarrierOrderedMirror.legacyProtection,
}));
const hitReceiptSelftest = captureReceipt(
  beforeRawSelftest, firstExpected, hitManifestDigest,
);
const hitRawSelftest = makeDurable(hitMirror(), {
  revision: 1, ordinal: 1,
  draws: { 'capture.candidate': 1, 'capture.success': 1 },
  receipts: [hitReceiptSelftest], essence: 2,
  ownedCounters: ARC4_PERTAR_FIXTURE.v4OwnedCounters.afterFirstHit,
});
const missManifestDigest = inspectArc4Ownership(inspectV5Rows(
  makeDurable(missMirror()),
).rows).manifest.stateDigest;
const missReceiptSelftest = captureReceipt(
  hitRawSelftest, secondExpected, missManifestDigest,
);
const missRawSelftest = makeDurable(missMirror(), {
  revision: 2, ordinal: 2,
  draws: { 'capture.candidate': 2, 'capture.success': 2 },
  receipts: [hitReceiptSelftest, missReceiptSelftest], essence: 2,
  ownedCounters: ARC4_PERTAR_FIXTURE.v4OwnedCounters.afterFirstHit,
});
const firstAttemptOracleSelftest = captureAttemptOracle(beforeRawSelftest, 'sample');
const secondAttemptOracleSelftest = captureAttemptOracle(hitRawSelftest, 'tame');
const exactFixtureAttemptOracle = (oracle, expected, event, poolLength) => (
  oracle?.event === event
  && oracle?.candidate?.sourceOrdinal === expected.sourceOrdinal
  && oracle?.candidate?.speciesId === expected.speciesId
  && oracle?.candidate?.kingdom === expected.kingdom
  && oracle?.candidate?.tier === expected.tier
  && oracle?.pool?.length === poolLength
  && sameNumber(oracle?.candidateDraw, expected.candidateDraw)
  && sameNumber(oracle?.successDraw, expected.successDraw)
  && sameNumber(oracle?.chance, expected.chance)
  && oracle?.hit === expected.hit
);

const withManifestStateDigest = (evidence, stateDigest) => {
  const next = structuredClone(evidence);
  const carrierValue = next.playerRow.extensions['arc4.ownership.manifest'];
  const manifest = parseJson(carrierValue.json);
  manifest.stateDigest = stateDigest;
  carrierValue.json = canonicalToolJson(manifest);
  next.playerRaw = JSON.stringify(next.playerRow);
  return next;
};

const withArc5CertificateMutation = (evidence, mutate) => {
  const next = structuredClone(evidence);
  const carrierValue = next.playerRow.extensions[
    ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
  ];
  const certificate = parseJson(carrierValue?.json);
  if (!record(certificate)) {
    throw new Error('Arc 5 selftest certificate mutation target is absent');
  }
  mutate(certificate, carrierValue);
  carrierValue.json = canonicalToolJson(certificate);
  next.playerRaw = JSON.stringify(next.playerRow);
  return next;
};

const withNoncanonicalArc5Certificate = (evidence) => {
  const next = structuredClone(evidence);
  const carrierValue = next.playerRow.extensions[
    ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
  ];
  const certificate = parseJson(carrierValue?.json);
  if (!record(certificate)) {
    throw new Error('Arc 5 selftest noncanonical certificate target is absent');
  }
  carrierValue.json = JSON.stringify(
    Object.fromEntries(Object.entries(certificate).reverse()),
  );
  next.playerRaw = JSON.stringify(next.playerRow);
  return next;
};

const withArc5CarrierReplacement = (evidence, source) => {
  const next = structuredClone(evidence);
  next.playerRow.extensions[ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace]
    = structuredClone(source?.playerRow?.extensions?.[
      ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
    ]);
  next.playerRaw = JSON.stringify(next.playerRow);
  return next;
};

const withReceiptWitness = (evidence, ordinal, fields) => {
  const next = structuredClone(evidence);
  const index = next.receiptRows.findIndex((row) => row?.ordinal === ordinal);
  if (index < 0) throw new Error('Arc 4 selftest receipt mutation target is absent');
  const witness = parseJson(next.receiptRows[index].witness);
  Object.assign(witness, fields);
  next.receiptRows[index].witness = canonicalToolJson(witness);
  next.receiptRawRows[index] = JSON.stringify(next.receiptRows[index]);
  return next;
};

const withReceiptRowMutation = (evidence, ordinal, mutate) => {
  const next = structuredClone(evidence);
  const index = next.receiptRows.findIndex((row) => row?.ordinal === ordinal);
  if (index < 0) throw new Error('Arc 4 selftest receipt-row mutation target is absent');
  mutate(next.receiptRows[index]);
  next.receiptRawRows[index] = JSON.stringify(next.receiptRows[index]);
  return next;
};

const withCoherentV4EverMutation = (evidence, mutate) => {
  const next = structuredClone(evidence);
  const legacyEver = structuredClone(next.legacy.ever);
  const splitEver = structuredClone(next.playerRow.data.ever);
  mutate(legacyEver);
  mutate(splitEver);
  next.legacy.ever = legacyEver;
  next.playerRow.data.ever = splitEver;
  next.legacyRaw = JSON.stringify(next.legacy);
  next.playerRaw = JSON.stringify(next.playerRow);
  return next;
};

const makeHitDurable = (mirror) => {
  const options = {
    revision: 1, ordinal: 1,
    draws: { 'capture.candidate': 1, 'capture.success': 1 },
    essence: 2,
    ownedCounters: ARC4_PERTAR_FIXTURE.v4OwnedCounters.afterFirstHit,
  };
  const provisional = makeDurable(mirror, options);
  const digest = inspectArc4Ownership(inspectV5Rows(provisional).rows).manifest.stateDigest;
  return makeDurable(mirror, {
    ...options, receipts: [captureReceipt(beforeRawSelftest, firstExpected, digest)],
  });
};

const makeCoordinatedHitEventDurable = (event) => {
  const mirror = structuredClone(hitMirror());
  const priorId = mirror.discoveries[0].recordId;
  const nextId = `discovery-v1:${event}`;
  mirror.discoveries[0].recordId = nextId;
  for (const row of mirror.catalogSpecies) {
    if (row.firstObservationId === priorId) row.firstObservationId = nextId;
  }
  for (const row of [...mirror.creatures, ...mirror.specimenLots]) {
    if (row.acquisitionRecordId === priorId) row.acquisitionRecordId = nextId;
  }
  return withReceiptWitness(makeHitDurable(mirror), 0, { event });
};

const idleCaptureSelftest = appCaptureState(beforeRawSelftest);
const beforeStateSelftest = appState(beforeRawSelftest, idleCaptureSelftest);
const beforeUiSelftest = uiSnapshot(idleCaptureSelftest, { raw: beforeRawSelftest });
const hitResultSelftest = {
  hit: true, speciesId: firstExpected.speciesId, speciesName: 'Fixture Microbe',
  kingdom: 'microbe', sourceOrdinal: 13, tier: 5, chance: 0.445,
  worldKey: ARC4_PERTAR_FIXTURE.worldKey, ecologyEpoch: 0,
  fullRosterFingerprint: ARC4_PERTAR_FIXTURE.fullRosterFingerprint,
  firstForSpecies: true, spent: 1, remainingAfter: 15,
  ownedRowId: SELFTEST_IDS.lot, stardustReward: 2, revision: 1,
};
const hitOutcomeSelftest = {
  schema: 'cf-v2-capture-card-outcome/v1', kind: 'committed-hit', verb: 'sample',
  convergence: 'none', title: 'Sampled Fixture Microbe.',
  detail: '44.5% odds. New Compendium page; one specimen lot. Rare Find: +2 Stardust.',
};
const hitCaptureSelftest = appCaptureState(hitRawSelftest, {
  lastOutcome: 'sample-committed:1', lastResult: hitResultSelftest,
});
const hitStateSelftest = appState(hitRawSelftest, hitCaptureSelftest);
const hitUiSelftest = uiSnapshot(hitCaptureSelftest, {
  used: 1, outcome: hitOutcomeSelftest, raw: hitRawSelftest,
});
const missResultSelftest = {
  hit: false, speciesId: secondExpected.speciesId, speciesName: 'Fixture Fauna',
  kingdom: 'fauna', sourceOrdinal: 12, tier: 4, chance: 0.44,
  worldKey: ARC4_PERTAR_FIXTURE.worldKey, ecologyEpoch: 0,
  fullRosterFingerprint: ARC4_PERTAR_FIXTURE.fullRosterFingerprint,
  firstForSpecies: false, spent: 1, remainingAfter: 14,
  ownedRowId: null, stardustReward: 0, revision: 2,
};
const missOutcomeSelftest = {
  schema: 'cf-v2-capture-card-outcome/v1', kind: 'committed-miss', verb: 'tame',
  convergence: 'none', title: 'Fixture Fauna slipped away.',
  detail: '44% odds. No page, creature, specimen, or Stardust was added. 1 Biosphere Yield spent; 14 remain.',
};
const missCaptureSelftest = appCaptureState(missRawSelftest, {
  lastOutcome: 'tame-committed:2', lastResult: missResultSelftest,
});
const missStateSelftest = appState(missRawSelftest, missCaptureSelftest);
const missUiSelftest = uiSnapshot(missCaptureSelftest, {
  used: 2, outcome: missOutcomeSelftest, raw: missRawSelftest,
});
const sampleInteraction = {
  pressCount: 1, verb: 'sample', trusted: true, modality: 'keyboard',
};
const tameInteraction = {
  pressCount: 1, verb: 'tame', trusted: true, modality: 'keyboard',
};
const surveyDockActivationSelftest = {
  armed: true,
  target: {
    ok: true, id: 'docksurvey', tag: 'BUTTON', ariaControls: 'survey', focus: true,
  },
  interaction: {
    pressCount: 1, trusted: true, modality: 'keyboard',
    trace: {
      keys: [{ id: 'docksurvey', trusted: true, key: 'Enter', code: 'Enter' }],
      clicks: [{ id: 'docksurvey', trusted: true }],
    },
  },
};

const pendingCoordinatorSelftest = actionCoordinator({
  busy: true, operation: 'arc4.capture.sample', phase: 'holding',
});
const pendingCaptureSelftest = appCaptureState(beforeRawSelftest, {
  coordinator: pendingCoordinatorSelftest,
});
const pendingStateSelftest = appState(beforeRawSelftest, pendingCaptureSelftest);
const pendingUiSelftest = uiSnapshot(pendingCaptureSelftest, {
  pendingVerb: 'sample', raw: beforeRawSelftest,
});

const storageFaultSelftest = {
  schema: 'cf-v2-arc4-action-fault-witness/v1',
  operation: 'arc4.capture.tame', injection: 'storage-failure',
  phase: 'settled', beforeRevision: hitRawSelftest.revision,
  injectedRevision: null,
  outcome: 'storage-error',
};
const storageOutcomeSelftest = {
  schema: 'cf-v2-capture-card-outcome/v1', kind: 'refused', verb: 'tame',
  convergence: 'none', title: 'Capture unavailable.',
  detail: 'The expedition could not be saved. Nothing was spent.',
};
const storageCaptureSelftest = appCaptureState(hitRawSelftest, {
  lastOutcome: 'tame-refused:slice-smoke injected Arc 4 capture storage failure',
  lastResult: null,
  coordinator: actionCoordinator({ fault: storageFaultSelftest }),
});
const storageStateSelftest = appState(hitRawSelftest, storageCaptureSelftest);
const storageUiSelftest = uiSnapshot(storageCaptureSelftest, {
  used: 1, outcome: storageOutcomeSelftest, raw: hitRawSelftest,
});

const staleCommittedSelftest = structuredClone(hitRawSelftest);
staleCommittedSelftest.revision = hitRawSelftest.revision + 1;
staleCommittedSelftest.revisionRaw = String(staleCommittedSelftest.revision);
const staleFaultSelftest = {
  schema: 'cf-v2-arc4-action-fault-witness/v1',
  operation: 'arc4.capture.tame', injection: 'stale-authority',
  phase: 'settled', beforeRevision: hitRawSelftest.revision,
  injectedRevision: staleCommittedSelftest.revision, outcome: 'stale',
};
const staleOldCaptureSelftest = appCaptureState(hitRawSelftest, {
  lastOutcome: 'tame-refused:stale', lastResult: null,
  coordinator: actionCoordinator({ fault: staleFaultSelftest }),
});
const staleOldStateSelftest = appState(hitRawSelftest, staleOldCaptureSelftest);
const staleOutcomeSelftest = {
  schema: 'cf-v2-capture-card-outcome/v1', kind: 'refused', verb: 'tame',
  convergence: 'read-only-reload', title: 'Expedition changed elsewhere.',
  detail: 'Refreshing from the saved expedition. The action will not retry.',
};
const staleOldUiSelftest = uiSnapshot(staleOldCaptureSelftest, {
  used: 1, outcome: staleOutcomeSelftest, convergence: true,
  raw: hitRawSelftest,
});
const stalePriorTokenSelftest = 'selftest-stale-old-document';
const staleTokenSelftest = 'selftest-stale-new-document';
const stalePagehideSelftest = {
  schema: ARC4_STALE_FAULT_CAPTURE_SCHEMA,
  documentToken: stalePriorTokenSelftest,
  fault: staleFaultSelftest,
  state: staleOldStateSelftest,
  ui: staleOldUiSelftest,
};
const staleFaultEnvelopeSelftest = {
  raw: JSON.stringify(stalePagehideSelftest),
  parsed: stalePagehideSelftest,
  cleared: true,
};
const staleReloadCaptureDraftSelftest = appCaptureState(staleCommittedSelftest);
const staleReloadUiDraftSelftest = uiSnapshot(staleReloadCaptureDraftSelftest, {
  used: 1, raw: staleCommittedSelftest, boot: true,
});
const staleReloadCaptureSelftest = appCaptureState(staleCommittedSelftest, {
  card: staleReloadUiDraftSelftest.diagnostics,
});
const staleReloadStateSelftest = appState(
  staleCommittedSelftest, staleReloadCaptureSelftest, { boot: true },
);
const staleReloadBeforeActivationStateSelftest = {
  ...structuredClone(staleReloadStateSelftest), cardOpen: false, cardTitle: null,
};
const staleReloadUiSelftest = uiSnapshot(staleReloadCaptureSelftest, {
  used: 1, raw: staleCommittedSelftest, boot: true,
});

const publicationFaultSelftest = {
  schema: 'cf-v2-arc4-action-fault-witness/v1',
  operation: 'arc4.capture.sample', injection: 'publication-failure',
  phase: 'settled', beforeRevision: beforeRawSelftest.revision,
  injectedRevision: hitRawSelftest.revision,
  outcome: 'committed-publication-reload',
};
const publicationOldCaptureSelftest = appCaptureState(hitRawSelftest, {
  lastOutcome: 'sample-committed-publication-reload', lastResult: null,
  unavailable: true,
  coordinator: actionCoordinator({ fault: publicationFaultSelftest }),
});
const publicationOldStateSelftest = appState(
  hitRawSelftest, publicationOldCaptureSelftest,
);
const publicationOutcomeSelftest = {
  schema: 'cf-v2-capture-card-outcome/v1', kind: 'committed-unknown',
  verb: 'sample', convergence: 'read-only-reload',
  title: 'Capture saved; display refreshing.',
  detail: 'Do not try again. Reloading the committed expedition read-only.',
};
const publicationOldUiSelftest = uiSnapshot(publicationOldCaptureSelftest, {
  used: 0, outcome: publicationOutcomeSelftest, convergence: true,
  raw: hitRawSelftest,
});
const publicationPriorTokenSelftest = 'selftest-publication-old-document';
const publicationTokenSelftest = 'selftest-publication-new-document';
const publicationPagehideSelftest = {
  schema: ARC4_PUBLICATION_FAULT_CAPTURE_SCHEMA,
  documentToken: publicationPriorTokenSelftest,
  fault: publicationFaultSelftest,
  state: publicationOldStateSelftest,
  ui: publicationOldUiSelftest,
};
const publicationFaultEnvelopeSelftest = {
  raw: JSON.stringify(publicationPagehideSelftest),
  parsed: publicationPagehideSelftest,
  cleared: true,
};
const publicationReloadCaptureDraftSelftest = appCaptureState(hitRawSelftest);
const publicationReloadUiDraftSelftest = uiSnapshot(
  publicationReloadCaptureDraftSelftest, { used: 1, raw: hitRawSelftest, boot: true },
);
const publicationReloadCaptureSelftest = appCaptureState(hitRawSelftest, {
  card: publicationReloadUiDraftSelftest.diagnostics,
});
const publicationReloadStateSelftest = appState(
  hitRawSelftest, publicationReloadCaptureSelftest, { boot: true },
);
const publicationReloadBeforeActivationStateSelftest = {
  ...structuredClone(publicationReloadStateSelftest),
  cardOpen: false, cardTitle: null,
};
const publicationReloadUiSelftest = uiSnapshot(
  publicationReloadCaptureSelftest, { used: 1, raw: hitRawSelftest, boot: true },
);

const exhaustedRawSelftest = makeDurable(exhaustedMirror(), {
  revision: 16, activePlayMs: ARC4_ACTIVE_PLAY_CYCLE_MS - 500,
});
const exhaustedCaptureSelftest = appCaptureState(exhaustedRawSelftest);
const exhaustedStateSelftest = appState(exhaustedRawSelftest, exhaustedCaptureSelftest);
const depletedStatusesSelftest = {
  tame: 'depleted', scavenge: 'depleted', sample: 'depleted',
};
const exhaustedUiSelftest = uiSnapshot(exhaustedCaptureSelftest, {
  used: 16, statuses: depletedStatusesSelftest, raw: exhaustedRawSelftest,
});
const offlineRawSelftest = structuredClone(exhaustedRawSelftest);
const offlineCaptureSelftest = appCaptureState(offlineRawSelftest);
const offlineStateSelftest = appState(offlineRawSelftest, offlineCaptureSelftest);
const offlineUiSelftest = uiSnapshot(offlineCaptureSelftest, {
  used: 16, statuses: depletedStatusesSelftest, raw: offlineRawSelftest,
});
const recoveredRawSelftest = makeDurable(exhaustedMirror(), {
  revision: 17, activePlayMs: ARC4_ACTIVE_PLAY_CYCLE_MS,
});
const recoveredCaptureSelftest = appCaptureState(recoveredRawSelftest, {
  lastResult: null,
});
const recoveredStateSelftest = appState(recoveredRawSelftest, recoveredCaptureSelftest);
const recoveredUiSelftest = uiSnapshot(recoveredCaptureSelftest, {
  used: 0, cycle: 1, raw: recoveredRawSelftest,
});
const suppressedSelftest = {
  verb: 'tame',
  point: { height: 44, width: 100, disabled: true, modelEnabled: 'false' },
  pointer: { trusted: true, pointerType: 'mouse' }, clickCount: 0,
  beforeRaw: exhaustedRawSelftest, afterRaw: structuredClone(exhaustedRawSelftest),
  beforeState: exhaustedStateSelftest,
  afterState: structuredClone(exhaustedStateSelftest),
};

const geometryControlsSelftest = ARC4_CAPTURE_VERBS.map((verb, index) => {
  /* Each action was scrolled to the same viewport band independently. Their
     viewport rectangles therefore overlap by design; only the normalized
     ancestor-scroll coordinate space is shared across all three samples. */
  const top = 200;
  const buttonRect = {
    left: 30, top, right: 130, bottom: top + 44, width: 100, height: 44,
  };
  const scrollOffset = { left: 0, top: index * 70 };
  const layoutRect = translatedRect(buttonRect, scrollOffset);
  const point = {
    x: 80, y: top + 22, tag: 'BUTTON', verb, close: false,
  };
  return {
    verb, scrollSettled: true, buttonRect,
    cardRect: structuredClone(beforeUiSelftest.cardRect),
    scrollOffset, layoutRect,
    beforePoint: point, afterRenderPoint: { ...point },
    accessibleName: ({ tame: 'Tame', scavenge: 'Scavenge', sample: 'Sample' })[verb],
    focus: {
      modality: 'keyboard', verb, semanticKey: `capture:${verb}`,
      focusVisible: true, decorationPainted: true, styleChanged: true,
      close: false,
    },
  };
});
const geometryCloseSelftest = {
  rect: { left: 350, top: 20, right: 394, bottom: 64, width: 44, height: 44 },
  beforePoint: { x: 372, y: 42, tag: 'BUTTON', verb: null, close: true },
  afterRenderPoint: { x: 372, y: 42, tag: 'BUTTON', verb: null, close: true },
  accessibleName: 'Close Survey card',
  focus: {
    modality: 'keyboard', verb: null, semanticKey: null, close: true,
    focusVisible: true, decorationPainted: true, styleChanged: true,
  },
};
const geometrySettlementSelftest = {
  verb: 'sample',
  pending: { activeStatus: true, focusVisible: true, convergence: 'none' },
  reopened: { pendingVisible: true, allActionsDisabled: true, closeHeight: 44 },
  settled: {
    verb: 'sample', semanticKey: 'capture:sample', focusVisible: true,
    decorationPainted: true,
  },
};
const geometryBundleSelftest = {
  schema: ARC4_CAPTURE_GEOMETRY_EVIDENCE_SCHEMA,
  layoutCoordinateSpace: ARC4_CAPTURE_LAYOUT_COORDINATE_SPACE,
  viewport: { name: 'selftest-430x900', width: 430, height: 900 },
  ui: beforeUiSelftest,
  planetsideRect: {
    left: 10, top: 730, right: 410, bottom: 880, width: 400, height: 150,
  },
  controls: geometryControlsSelftest,
  close: geometryCloseSelftest,
  settlement: geometrySettlementSelftest,
  scrollWidth: 430, clientWidth: 430,
};

const preconditionBundleSelftest = {
  raw: beforeRawSelftest, state: beforeStateSelftest, ui: beforeUiSelftest,
  routeError: null, authorityReady: true,
};
const pendingBundleSelftest = {
  beforeRaw: beforeRawSelftest, duringRaw: structuredClone(beforeRawSelftest),
  beforeState: beforeStateSelftest, duringState: pendingStateSelftest,
  beforeUi: beforeUiSelftest, duringUi: pendingUiSelftest,
  interaction: sampleInteraction, verb: 'sample',
};
const hitBundleSelftest = {
  before: beforeRawSelftest, after: hitRawSelftest,
  beforeState: beforeStateSelftest, afterState: hitStateSelftest,
  afterUi: hitUiSelftest, interaction: sampleInteraction,
};
const missBundleSelftest = {
  before: hitRawSelftest, after: missRawSelftest,
  beforeState: hitStateSelftest, afterState: missStateSelftest,
  afterUi: missUiSelftest, interaction: tameInteraction,
  expected: secondExpected,
};
const burnOutcomeSelftest = {
  kind: 'committed', durability: 'committed', convergence: 'none',
  verb: 'sample', result: structuredClone(hitResultSelftest),
};
const burnBundleSelftest = {
  before: beforeRawSelftest, after: hitRawSelftest,
  beforeUi: beforeUiSelftest, outcome: burnOutcomeSelftest,
  verb: 'sample', expectedUsed: 1, afterState: hitStateSelftest,
};
const burnMissOutcomeSelftest = {
  kind: 'committed', durability: 'committed', convergence: 'none',
  verb: 'tame', result: structuredClone(missResultSelftest),
};
const burnUnseenMissBundleSelftest = {
  before: hitRawSelftest, after: missRawSelftest,
  beforeUi: hitUiSelftest, outcome: burnMissOutcomeSelftest,
  verb: 'tame', expectedUsed: 2, afterState: missStateSelftest,
};
const storageBundleSelftest = {
  before: hitRawSelftest, after: structuredClone(hitRawSelftest),
  beforeState: hitStateSelftest, afterState: storageStateSelftest,
  beforeUi: hitUiSelftest, afterUi: storageUiSelftest,
  interaction: tameInteraction, armed: true, verb: 'tame',
};
const storageClockDriftBundleSelftest = {
  ...storageBundleSelftest,
  afterUi: withUiActivePlaySelftest(storageUiSelftest, 1_000),
};
const staleBundleSelftest = {
  before: hitRawSelftest, committed: staleCommittedSelftest,
  beforeState: hitStateSelftest, oldState: staleOldStateSelftest,
  oldUi: staleOldUiSelftest, reloaded: structuredClone(staleCommittedSelftest),
  reloadedState: staleReloadStateSelftest, reloadedUi: staleReloadUiSelftest,
  reloadBeforeActivationState: staleReloadBeforeActivationStateSelftest,
  armed: true, captureArmed: true, faultCapture: staleFaultEnvelopeSelftest,
  reloadActivation: surveyDockActivationSelftest,
  interaction: tameInteraction, priorToken: stalePriorTokenSelftest,
  token: staleTokenSelftest,
};
const publicationBundleSelftest = {
  before: beforeRawSelftest, committed: hitRawSelftest,
  beforeState: beforeStateSelftest,
  beforeUi: beforeUiSelftest, pendingUi: pendingUiSelftest,
  oldState: publicationOldStateSelftest,
  oldUi: publicationOldUiSelftest, reloaded: structuredClone(hitRawSelftest),
  reloadedState: publicationReloadStateSelftest,
  reloadedUi: publicationReloadUiSelftest,
  reloadBeforeActivationState: publicationReloadBeforeActivationStateSelftest,
  armed: true, captureArmed: true,
  reloadActivation: surveyDockActivationSelftest,
  faultCapture: publicationFaultEnvelopeSelftest,
  interaction: sampleInteraction, priorToken: publicationPriorTokenSelftest,
  token: publicationTokenSelftest,
};
const nonzeroActivePlaySelftest = 9_000;
const nonzeroPreconditionRawSelftest = withAuthorityActivePlaySelftest(
  beforeRawSelftest, nonzeroActivePlaySelftest,
);
const nonzeroPreconditionBundleSelftest = {
  ...preconditionBundleSelftest,
  raw: nonzeroPreconditionRawSelftest,
  state: withRuntimeActivePlaySelftest(
    beforeStateSelftest, nonzeroActivePlaySelftest,
  ),
  ui: withUiActivePlaySelftest(beforeUiSelftest, nonzeroActivePlaySelftest),
};
const laggedPreconditionBundleSelftest = {
  ...preconditionBundleSelftest,
  state: withRuntimeActivePlaySelftest(beforeStateSelftest, 25_000),
  ui: withUiActivePlaySelftest(beforeUiSelftest, 20_000),
};
const nonzeroHitRawSelftest = withAuthorityActivePlaySelftest(
  hitRawSelftest, nonzeroActivePlaySelftest,
);
const nonzeroHitBundleSelftest = {
  ...hitBundleSelftest,
  after: nonzeroHitRawSelftest,
  afterState: withRuntimeActivePlaySelftest(
    hitStateSelftest, nonzeroActivePlaySelftest,
  ),
  afterUi: withUiActivePlaySelftest(hitUiSelftest, nonzeroActivePlaySelftest),
};
const outerRevisionHitBundleSelftest = structuredClone(hitBundleSelftest);
outerRevisionHitBundleSelftest.before.revision = 25;
outerRevisionHitBundleSelftest.before.revisionRaw = '25';
outerRevisionHitBundleSelftest.beforeState.persistence.runtime.revision = 25;
outerRevisionHitBundleSelftest.after.revision = 26;
outerRevisionHitBundleSelftest.after.revisionRaw = '26';
outerRevisionHitBundleSelftest.afterState.persistence.runtime.revision = 26;
outerRevisionHitBundleSelftest.afterState.capture.lastOutcome = 'sample-committed:26';
outerRevisionHitBundleSelftest.afterState.capture.lastResult.revision = 26;
outerRevisionHitBundleSelftest.afterUi.persistence.runtime.revision = 26;
outerRevisionHitBundleSelftest.afterUi.captureState.lastOutcome = 'sample-committed:26';
outerRevisionHitBundleSelftest.afterUi.captureState.lastResult.revision = 26;
const nonzeroBurnBundleSelftest = {
  ...burnBundleSelftest,
  after: nonzeroHitRawSelftest,
  afterState: withRuntimeActivePlaySelftest(
    hitStateSelftest, nonzeroActivePlaySelftest,
  ),
};
const committedAheadOldRuntimeSelftest = nonzeroActivePlaySelftest + 137;
const nonzeroPublicationOldStateSelftest = withRuntimeActivePlaySelftest(
  publicationOldStateSelftest, committedAheadOldRuntimeSelftest,
);
const nonzeroPublicationOldUiSelftest = withRuntimeActivePlaySelftest(
  publicationOldUiSelftest, committedAheadOldRuntimeSelftest,
);
const nonzeroPublicationPagehideSelftest = {
  ...publicationPagehideSelftest,
  state: nonzeroPublicationOldStateSelftest,
  ui: nonzeroPublicationOldUiSelftest,
};
const nonzeroPublicationBundleSelftest = {
  ...publicationBundleSelftest,
  committed: nonzeroHitRawSelftest,
  oldState: nonzeroPublicationOldStateSelftest,
  oldUi: nonzeroPublicationOldUiSelftest,
  reloaded: structuredClone(nonzeroHitRawSelftest),
  reloadedState: withRuntimeActivePlaySelftest(
    publicationReloadStateSelftest, nonzeroActivePlaySelftest,
  ),
  reloadedUi: withUiActivePlaySelftest(
    publicationReloadUiSelftest, nonzeroActivePlaySelftest,
  ),
  faultCapture: {
    raw: JSON.stringify(nonzeroPublicationPagehideSelftest),
    parsed: nonzeroPublicationPagehideSelftest,
    cleared: true,
  },
};
const exhaustionBundleSelftest = {
  exhaustedRaw: exhaustedRawSelftest, exhaustedState: exhaustedStateSelftest,
  exhaustedUi: exhaustedUiSelftest, suppressed: suppressedSelftest,
  offlineRaw: offlineRawSelftest, offlineState: offlineStateSelftest,
  offlineUi: offlineUiSelftest, offlineElapsedMs: 5_000,
  recoveredRaw: recoveredRawSelftest, recoveredState: recoveredStateSelftest,
  recoveredUi: recoveredUiSelftest,
};

const positiveSelftestAssessments = Object.freeze({
  durable: assessArc4DurableEvidence(beforeRawSelftest),
  precondition: assessArc4CapturePrecondition(preconditionBundleSelftest),
  preconditionNonzero: assessArc4CapturePrecondition(
    nonzeroPreconditionBundleSelftest,
  ),
  preconditionDurableLag: assessArc4CapturePrecondition(
    laggedPreconditionBundleSelftest,
  ),
  pending: assessArc4CapturePendingNoOptimism(pendingBundleSelftest),
  hit: assessArc4CommittedHit(hitBundleSelftest),
  hitNonzero: assessArc4CommittedHit(nonzeroHitBundleSelftest),
  hitOuterRevision: assessArc4CommittedHit(outerRevisionHitBundleSelftest),
  miss: assessArc4CommittedMiss(missBundleSelftest),
  burn: assessArc4BurnStep(burnBundleSelftest),
  burnUnseenMiss: assessArc4BurnStep(burnUnseenMissBundleSelftest),
  burnNonzero: assessArc4BurnStep(nonzeroBurnBundleSelftest),
  storage: assessArc4StorageRefusal(storageBundleSelftest),
  storageClockDrift: assessArc4StorageRefusal(storageClockDriftBundleSelftest),
  stale: assessArc4StaleConvergence(staleBundleSelftest),
  publication: assessArc4PublicationConvergence(publicationBundleSelftest),
  publicationCommittedAhead: assessArc4PublicationConvergence(
    nonzeroPublicationBundleSelftest,
  ),
  exhaustionOnly: assessArc4Exhaustion(exhaustionBundleSelftest),
  exhaustion: assessArc4ExhaustionRecovery(exhaustionBundleSelftest),
  geometry: assessArc4CaptureCardGeometryFocus(geometryBundleSelftest),
});

for (const [name, result] of Object.entries(positiveSelftestAssessments)) {
  if (result.ok !== true) {
    throw new Error(`Arc 4 browser contract positive selftest failed (${name}): ${result.reasons.join(', ')}; ${JSON.stringify(result)}`);
  }
}

const negativeDurableSelftest = structuredClone(beforeRawSelftest);
negativeDurableSelftest.revisionRaw = '00';
const negativeArc5MissingSelftest = structuredClone(beforeRawSelftest);
delete negativeArc5MissingSelftest.playerRow.extensions[
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
];
negativeArc5MissingSelftest.playerRaw = JSON.stringify(
  negativeArc5MissingSelftest.playerRow,
);
const negativeArc5MisplacedSelftest = structuredClone(beforeRawSelftest);
negativeArc5MisplacedSelftest.settingsRow.extensions[
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
] = negativeArc5MisplacedSelftest.playerRow.extensions[
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
];
delete negativeArc5MisplacedSelftest.playerRow.extensions[
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
];
negativeArc5MisplacedSelftest.playerRaw = JSON.stringify(
  negativeArc5MisplacedSelftest.playerRow,
);
negativeArc5MisplacedSelftest.settingsRaw = JSON.stringify(
  negativeArc5MisplacedSelftest.settingsRow,
);
const negativeArc5DuplicateSelftest = structuredClone(beforeRawSelftest);
negativeArc5DuplicateSelftest.settingsRow.extensions[
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
] = structuredClone(negativeArc5DuplicateSelftest.playerRow.extensions[
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
]);
negativeArc5DuplicateSelftest.settingsRaw = JSON.stringify(
  negativeArc5DuplicateSelftest.settingsRow,
);
const negativeArc5ShapeSelftest = withArc5CertificateMutation(
  beforeRawSelftest, (certificate) => { certificate.extra = true; },
);
const negativeArc5NoncanonicalSelftest = withNoncanonicalArc5Certificate(
  beforeRawSelftest,
);
const negativeArc5SourceDigestSelftest = withArc5CertificateMutation(
  beforeRawSelftest, (certificate) => { certificate.sourceDigest = 'f'.repeat(64); },
);
const negativeArc5TargetDigestSelftest = withArc5CertificateMutation(
  beforeRawSelftest, (certificate) => { certificate.targetDigest = 'e'.repeat(64); },
);
const negativeArc5RetainedOldCertificateSelftest = withArc5CarrierReplacement(
  hitRawSelftest, beforeRawSelftest,
);
const negativeF4SerializerOrderSelftest = structuredClone(beforeRawSelftest);
negativeF4SerializerOrderSelftest.authorityJson = canonicalToolJson(
  negativeF4SerializerOrderSelftest.authority,
);
negativeF4SerializerOrderSelftest.playerRow.extensions['f4.authority'].json
  = negativeF4SerializerOrderSelftest.authorityJson;
negativeF4SerializerOrderSelftest.playerRaw = JSON.stringify(
  negativeF4SerializerOrderSelftest.playerRow,
);
const negativeManifestDigestSelftest = withManifestStateDigest(
  hitRawSelftest, 'f'.repeat(64),
);
const negativeReceiptDigestSelftest = withReceiptWitness(
  hitRawSelftest, 0, { successorDigest: 'e'.repeat(64) },
);
const negativeCoordinatedDigestSelftest = withReceiptWitness(
  negativeManifestDigestSelftest, 0, { successorDigest: 'f'.repeat(64) },
);
const negativeReceiptEventSelftest = makeCoordinatedHitEventDurable('a'.repeat(64));
const negativeV4OnlyCountersSelftest = structuredClone(beforeRawSelftest);
negativeV4OnlyCountersSelftest.legacy.ever = structuredClone(
  negativeV4OnlyCountersSelftest.legacy.ever,
);
negativeV4OnlyCountersSelftest.legacy.ever.hybrids += 1;
negativeV4OnlyCountersSelftest.legacyRaw = JSON.stringify(
  negativeV4OnlyCountersSelftest.legacy,
);
const negativePreconditionSelftest = {
  ...preconditionBundleSelftest, routeError: 'isolated route control',
};
const negativePreconditionFixtureSelftest = {
  ...preconditionBundleSelftest,
  fixture: (() => {
    const fixture = structuredClone(ARC4_PERTAR_FIXTURE);
    fixture.actions.firstHit.successDraw += 0.000_001;
    return fixture;
  })(),
};
const negativePreconditionCycleSelftest = structuredClone(preconditionBundleSelftest);
negativePreconditionCycleSelftest.ui.budget.cycle += 1;
const negativePreconditionCountdownSelftest = structuredClone(preconditionBundleSelftest);
negativePreconditionCountdownSelftest.ui.budget.recoveryRemainingActivePlayMs += 1;
const negativePreconditionActivePlaySelftest = structuredClone(preconditionBundleSelftest);
negativePreconditionActivePlaySelftest.ui.persistence.runtime.activePlayMs
  = ARC4_ACTIVE_PLAY_RENDER_LAG_MAX_MS + 1;
negativePreconditionActivePlaySelftest.state.persistence.runtime.activePlayMs
  = ARC4_ACTIVE_PLAY_RENDER_LAG_MAX_MS + 1;
const negativePreconditionStateRuntimeSelftest = structuredClone(preconditionBundleSelftest);
negativePreconditionStateRuntimeSelftest.state.persistence.runtime.activePlayMs += 123_456;
const negativePreconditionDownwardRuntimeSelftest = structuredClone(
  nonzeroPreconditionBundleSelftest,
);
negativePreconditionDownwardRuntimeSelftest.state.persistence.runtime.activePlayMs = 0;
const negativePreconditionHeadingSelftest = structuredClone(preconditionBundleSelftest);
negativePreconditionHeadingSelftest.ui.planetsideHeading = 'PLANETSIDE — Wrong';
const negativePreconditionCardSelftest = structuredClone(preconditionBundleSelftest);
negativePreconditionCardSelftest.ui.cardTitle = 'Not Pertar';
const negativePreconditionArc5Selftest = structuredClone(preconditionBundleSelftest);
negativePreconditionArc5Selftest.state.ownershipV2.targetDigest = 'f'.repeat(64);
const negativePendingSelftest = structuredClone(pendingBundleSelftest);
negativePendingSelftest.interaction.pressCount = 2;
const negativePendingRetainedResultSelftest = structuredClone(pendingBundleSelftest);
negativePendingRetainedResultSelftest.duringState.capture.lastResult = hitResultSelftest;
const negativePendingStateRuntimeSelftest = structuredClone(pendingBundleSelftest);
negativePendingStateRuntimeSelftest.duringState.persistence.runtime.activePlayMs += 123_456;
const negativePendingArc5Selftest = structuredClone(pendingBundleSelftest);
negativePendingArc5Selftest.duringState.ownershipV2.targetDigest = 'f'.repeat(64);
const negativeHitSelftest = structuredClone(hitBundleSelftest);
negativeHitSelftest.interaction.pressCount = 2;
const negativeHitStateRuntimeSelftest = structuredClone(hitBundleSelftest);
negativeHitStateRuntimeSelftest.afterState.persistence.runtime.activePlayMs += 123_456;
const negativeHitDownwardRuntimeSelftest = structuredClone(nonzeroHitBundleSelftest);
negativeHitDownwardRuntimeSelftest.afterState.persistence.runtime.activePlayMs = 0;
const negativeHitOwnershipRevisionResultSelftest = structuredClone(
  outerRevisionHitBundleSelftest,
);
negativeHitOwnershipRevisionResultSelftest.afterState.capture.lastResult.revision
  = negativeHitOwnershipRevisionResultSelftest.afterState.capture.revision;
const hitAddressMutationSelftest = (mutate, target = 'progress') => {
  const mirror = structuredClone(hitMirror());
  const address = structuredClone(target === 'discovery'
    ? mirror.discoveries[0].provenance.worldAddress
    : mirror.biosphereProgress[0].worldAddress);
  if (target === 'discovery') mirror.discoveries[0].provenance.worldAddress = address;
  else mirror.biosphereProgress[0].worldAddress = address;
  mutate(address);
  return { ...hitBundleSelftest, after: makeHitDurable(mirror) };
};
const negativeProgressCoordinateSelftest = hitAddressMutationSelftest((address) => {
  address.star.x = 414.3;
});
const negativeProgressHierarchySelftest = hitAddressMutationSelftest((address) => {
  address.star.layer = 'fine';
});
const negativeProgressOrdinalSelftest = hitAddressMutationSelftest((address) => {
  address.planet.ordinal = 2;
});
const negativeProgressParentCellSelftest = hitAddressMutationSelftest((address) => {
  address.star.parentCell.x = 8;
});
const negativeDiscoveryAddressSelftest = hitAddressMutationSelftest((address) => {
  address.galaxy.parentCell.y = -2;
}, 'discovery');
const negativeMissSelftest = structuredClone(missBundleSelftest);
negativeMissSelftest.interaction.pressCount = 2;
const negativeMissStateRuntimeSelftest = structuredClone(missBundleSelftest);
negativeMissStateRuntimeSelftest.afterState.persistence.runtime.activePlayMs += 123_456;
const negativeMissReceiptEventSelftest = withReceiptWitness(
  missRawSelftest, 1, { event: 'b'.repeat(64) },
);
const negativeBurnReceiptKindSelftest = withReceiptRowMutation(
  hitRawSelftest, 0, (row) => { row.kind = 'not-capture-attempt'; },
);
const negativeBurnMissFirstForSpeciesSelftest = structuredClone(
  burnUnseenMissBundleSelftest,
);
negativeBurnMissFirstForSpeciesSelftest.outcome.result.firstForSpecies = true;
negativeBurnMissFirstForSpeciesSelftest.afterState.capture.lastResult.firstForSpecies = true;
const negativeBurnReceiptWitnessSelftest = withReceiptRowMutation(
  hitRawSelftest, 0, (row) => { row.witness = 'not-json'; },
);
const negativeBurnReceiptEventSelftest = withReceiptWitness(
  hitRawSelftest, 0, { event: 'c'.repeat(64) },
);
const negativeBurnReceiptDigestSelftest = withReceiptWitness(
  hitRawSelftest, 0, { successorDigest: 'd'.repeat(64) },
);
const incrementScanHits = (ever) => { ever.scanhits += 1; };
const addArrivals = (ever) => { ever.arrivals = 999; };
const incrementMaxGen = (ever) => { ever.maxGen += 1; };
const negativeBurnV4TransitionSelftest = withCoherentV4EverMutation(
  hitRawSelftest, incrementScanHits,
);
const negativeBurnDownwardRuntimeSelftest = structuredClone(nonzeroBurnBundleSelftest);
negativeBurnDownwardRuntimeSelftest.afterState.persistence.runtime.activePlayMs = 0;
const coherentHitV4BundleSelftest = {
  ...hitBundleSelftest,
  before: withCoherentV4EverMutation(beforeRawSelftest, incrementScanHits),
  after: withCoherentV4EverMutation(hitRawSelftest, incrementScanHits),
};
const coherentHitArrivalsBundleSelftest = {
  ...hitBundleSelftest,
  before: withCoherentV4EverMutation(beforeRawSelftest, addArrivals),
  after: withCoherentV4EverMutation(hitRawSelftest, addArrivals),
};
const coherentHitMaxGenBundleSelftest = {
  ...hitBundleSelftest,
  before: withCoherentV4EverMutation(beforeRawSelftest, incrementMaxGen),
  after: withCoherentV4EverMutation(hitRawSelftest, incrementMaxGen),
};
const coherentMissV4BundleSelftest = {
  ...missBundleSelftest,
  before: withCoherentV4EverMutation(hitRawSelftest, incrementScanHits),
  after: withCoherentV4EverMutation(missRawSelftest, incrementScanHits),
};
const coherentPublicationV4BundleSelftest = {
  ...publicationBundleSelftest,
  before: withCoherentV4EverMutation(beforeRawSelftest, incrementScanHits),
  committed: withCoherentV4EverMutation(hitRawSelftest, incrementScanHits),
  reloaded: withCoherentV4EverMutation(hitRawSelftest, incrementScanHits),
};
const coherentBurnV4BundleSelftest = {
  ...burnBundleSelftest,
  before: withCoherentV4EverMutation(beforeRawSelftest, incrementScanHits),
  after: withCoherentV4EverMutation(hitRawSelftest, incrementScanHits),
};
const coherentBurnMaxGenBundleSelftest = {
  ...burnBundleSelftest,
  before: withCoherentV4EverMutation(beforeRawSelftest, incrementMaxGen),
  after: withCoherentV4EverMutation(hitRawSelftest, incrementMaxGen),
};
const negativeStorageSelftest = {
  ...storageBundleSelftest, waitError: 'isolated wait control',
};
const negativeStorageRetainedResultSelftest = structuredClone(storageBundleSelftest);
negativeStorageRetainedResultSelftest.afterState.capture.lastResult = hitResultSelftest;
const negativeStorageStateRuntimeSelftest = structuredClone(storageBundleSelftest);
negativeStorageStateRuntimeSelftest.afterState.persistence.runtime.activePlayMs += 123_456;
const negativeStorageArc5Selftest = structuredClone(storageBundleSelftest);
negativeStorageArc5Selftest.afterState.ownershipV2.targetDigest = 'f'.repeat(64);
const negativeStorageSemanticUiSelftest = structuredClone(
  storageClockDriftBundleSelftest,
);
negativeStorageSemanticUiSelftest.afterUi.summary += ' Contradictory ownership copy.';
const negativeStorageBudgetSemanticUiSelftest = structuredClone(
  storageClockDriftBundleSelftest,
);
negativeStorageBudgetSemanticUiSelftest.afterUi.budget.text
  = negativeStorageBudgetSemanticUiSelftest.afterUi.budget.text.replace(
    'Every attempt spends 1, hit or miss.',
    'Every attempt spends 2, hit or miss.',
  );
const negativeStorageCountdownTextSelftest = structuredClone(
  storageClockDriftBundleSelftest,
);
negativeStorageCountdownTextSelftest.afterUi.budget.text
  = negativeStorageCountdownTextSelftest.afterUi.budget.text.replace(
    ARC4_ACTIVE_PLAY_COUNTDOWN_PATTERN, '99:59',
  );
const negativeStaleSelftest = {
  ...staleBundleSelftest, waitError: 'isolated wait control',
};
const withCoordinatedPagehideOldSurface = (bundle, mutate) => {
  const next = {
    ...bundle,
    oldState: structuredClone(bundle.oldState),
    oldUi: structuredClone(bundle.oldUi),
  };
  mutate(next.oldState, next.oldUi);
  next.oldUi.captureState = structuredClone(captureStateOf(next.oldState));
  next.oldUi.ownershipV2 = structuredClone(ownershipV2StateOf(next.oldState));
  next.oldUi.persistence = structuredClone(persistenceStateOf(next.oldState));
  const parsed = structuredClone(bundle.faultCapture.parsed);
  parsed.state = structuredClone(next.oldState);
  parsed.ui = structuredClone(next.oldUi);
  next.faultCapture = { raw: JSON.stringify(parsed), parsed, cleared: true };
  return next;
};
const withPagehideEnvelopeMutation = (bundle, mutate) => {
  const parsed = structuredClone(bundle.faultCapture.parsed);
  mutate(parsed);
  return {
    ...bundle,
    faultCapture: { raw: JSON.stringify(parsed), parsed, cleared: true },
  };
};
const negativeStaleRetainedResultSelftest = withCoordinatedPagehideOldSurface(
  staleBundleSelftest,
  (oldState) => { oldState.capture.lastResult = hitResultSelftest; },
);
const negativeStaleReloadUiSelftest = structuredClone(staleBundleSelftest);
negativeStaleReloadUiSelftest.reloadedUi.cardTitle = 'Not Pertar';
const negativeStaleArc5PreservationSelftest = withCoordinatedPagehideOldSurface(
  staleBundleSelftest,
  (oldState) => { oldState.ownershipV2.targetDigest = 'f'.repeat(64); },
);
const negativeStaleReloadArc5Selftest = structuredClone(staleBundleSelftest);
negativeStaleReloadArc5Selftest.reloadedState.ownershipV2.targetDigest
  = 'f'.repeat(64);
const negativeStaleReloadActivationSelftest = structuredClone(staleBundleSelftest);
negativeStaleReloadActivationSelftest.reloadActivation.interaction.trace.clicks[0].trusted
  = false;
const negativeStaleReloadStartsOpenSelftest = structuredClone(staleBundleSelftest);
negativeStaleReloadStartsOpenSelftest.reloadBeforeActivationState.cardOpen = true;
negativeStaleReloadStartsOpenSelftest.reloadBeforeActivationState.cardTitle = 'Pertar';
const negativeStaleReloadRawSelftest = {
  ...staleBundleSelftest,
  reloaded: withCoherentV4EverMutation(
    staleBundleSelftest.reloaded, incrementScanHits,
  ),
};
const negativeStaleTupleStateSelftest = withPagehideEnvelopeMutation(
  staleBundleSelftest,
  (parsed) => { parsed.state.capture.revision += 1; },
);
const negativeStaleTupleFaultSelftest = withPagehideEnvelopeMutation(
  staleBundleSelftest,
  (parsed) => { parsed.state.capture.actionCoordinator.lastFault = null; },
);
const negativeStaleTupleUiSelftest = withPagehideEnvelopeMutation(
  staleBundleSelftest,
  (parsed) => { parsed.ui.cardTitle = 'Not tuple Pertar'; },
);
const negativeStaleTupleArc5Selftest = withPagehideEnvelopeMutation(
  staleBundleSelftest,
  (parsed) => { parsed.ui.ownershipV2.targetDigest = 'f'.repeat(64); },
);
const negativeStaleReleasedHoldSelftest = withCoordinatedPagehideOldSurface(
  staleBundleSelftest,
  (oldState) => {
    oldState.capture.actionCoordinator.hold.phase = 'holding';
    oldState.capture.actionCoordinator.hold.operation = 'arc4.capture.tame';
  },
);
const negativePublicationSelftest = {
  ...publicationBundleSelftest, waitError: 'isolated wait control',
};
const negativePublicationReloadUiSelftest = structuredClone(publicationBundleSelftest);
negativePublicationReloadUiSelftest.reloadedUi.planetsideHeading = 'PLANETSIDE — Wrong';
const negativePublicationOldArc5OptimismSelftest
  = withCoordinatedPagehideOldSurface(
    publicationBundleSelftest,
    (oldState) => {
      oldState.ownershipV2 = structuredClone(
        publicationBundleSelftest.beforeState.ownershipV2,
      );
    },
  );
const negativePublicationReloadArc5Selftest = structuredClone(
  publicationBundleSelftest,
);
negativePublicationReloadArc5Selftest.reloadedState.ownershipV2.targetDigest
  = 'f'.repeat(64);
const negativePublicationReloadActivationSelftest = structuredClone(
  publicationBundleSelftest,
);
negativePublicationReloadActivationSelftest.reloadActivation.target.ariaControls
  = 'wrong-surface';
const negativePublicationReloadStartsOpenSelftest = structuredClone(
  publicationBundleSelftest,
);
negativePublicationReloadStartsOpenSelftest.reloadBeforeActivationState.cardOpen
  = true;
negativePublicationReloadStartsOpenSelftest.reloadBeforeActivationState.cardTitle
  = 'Pertar';
const negativePublicationReloadRawSelftest = {
  ...publicationBundleSelftest,
  reloaded: withCoherentV4EverMutation(
    publicationBundleSelftest.reloaded, incrementScanHits,
  ),
};
const negativePublicationTupleStateSelftest = withPagehideEnvelopeMutation(
  publicationBundleSelftest,
  (parsed) => { parsed.state.capture.catalogueSpecies += 1; },
);
const negativePublicationTupleFaultSelftest = withPagehideEnvelopeMutation(
  publicationBundleSelftest,
  (parsed) => { parsed.state.capture.actionCoordinator.lastFault = null; },
);
const negativePublicationTupleUiSelftest = withPagehideEnvelopeMutation(
  publicationBundleSelftest,
  (parsed) => { parsed.ui.planetsideHeading = 'PLANETSIDE — Tuple Wrong'; },
);
const negativePublicationTupleArc5Selftest = withPagehideEnvelopeMutation(
  publicationBundleSelftest,
  (parsed) => { parsed.ui.ownershipV2.bootstrapOutcome = 'false-tuple'; },
);
const negativePublicationReleasedHoldSelftest = withCoordinatedPagehideOldSurface(
  publicationBundleSelftest,
  (oldState) => {
    oldState.capture.actionCoordinator.hold.phase = 'holding';
    oldState.capture.actionCoordinator.hold.operation = 'arc4.capture.sample';
  },
);
const negativePublicationReloadDownwardRuntimeSelftest = structuredClone(
  nonzeroPublicationBundleSelftest,
);
negativePublicationReloadDownwardRuntimeSelftest
  .reloadedState.persistence.runtime.activePlayMs = 0;
const negativePublicationReloadUpwardRuntimeSelftest = structuredClone(
  publicationBundleSelftest,
);
negativePublicationReloadUpwardRuntimeSelftest
  .reloadedState.persistence.runtime.activePlayMs += 123_456;
const negativePublicationPreservedBudgetSelftest
  = withCoordinatedPagehideOldSurface(
    nonzeroPublicationBundleSelftest,
    (_oldState, oldUi) => {
      oldUi.budget.used = 1;
      oldUi.budget.remaining = 15;
      oldUi.budget.text = oldUi.budget.text.replace(
        '16 of 16 capture attempts remain; 0 spent',
        '15 of 16 capture attempts remain; 1 spent',
      );
    },
  );
const negativePublicationOldRuntimeSelftest
  = withCoordinatedPagehideOldSurface(
    nonzeroPublicationBundleSelftest,
    (oldState) => { oldState.persistence.runtime.sessionOrdinal += 1; },
  );
const negativePublicationRenderedFutureSelftest
  = withCoordinatedPagehideOldSurface(
    nonzeroPublicationBundleSelftest,
    (_oldState, oldUi) => {
      const renderedActivePlayMs = committedAheadOldRuntimeSelftest + 1;
      oldUi.budget.recoveryRemainingActivePlayMs
        = ARC4_ACTIVE_PLAY_CYCLE_MS - renderedActivePlayMs;
      oldUi.budget.text = oldUi.budget.text.replace(
        ARC4_ACTIVE_PLAY_COUNTDOWN_PATTERN,
        activePlayCountdownText(oldUi.budget.recoveryRemainingActivePlayMs),
      );
    },
  );
const negativePublicationExcessiveUiLagSelftest
  = withCoordinatedPagehideOldSurface(
    nonzeroPublicationBundleSelftest,
    (oldState) => {
      oldState.persistence.runtime.activePlayMs
        = ARC4_ACTIVE_PLAY_RENDER_LAG_MAX_MS + 1;
    },
  );
const negativeExhaustionSelftest = {
  ...exhaustionBundleSelftest, offlineElapsedMs: 0,
};
const negativeExhaustionSuppressionSelftest = structuredClone(exhaustionBundleSelftest);
negativeExhaustionSuppressionSelftest.suppressed.clickCount = 1;
const negativeExhaustionLiveSelftest = structuredClone(exhaustionBundleSelftest);
const negativeExhaustionLiveRevision = exhaustedRawSelftest.captureRevision + 1;
negativeExhaustionLiveSelftest.exhaustedState.capture.revision
  = negativeExhaustionLiveRevision;
negativeExhaustionLiveSelftest.suppressed.beforeState.capture.revision
  = negativeExhaustionLiveRevision;
negativeExhaustionLiveSelftest.suppressed.afterState.capture.revision
  = negativeExhaustionLiveRevision;
const negativeGeometrySelftest = structuredClone(geometryBundleSelftest);
negativeGeometrySelftest.controls[1].scrollOffset = structuredClone(
  negativeGeometrySelftest.controls[0].scrollOffset,
);
negativeGeometrySelftest.controls[1].layoutRect = structuredClone(
  negativeGeometrySelftest.controls[0].layoutRect,
);
const negativeGeometrySettlementSelftest = structuredClone(geometryBundleSelftest);
negativeGeometrySettlementSelftest.settlement.pending.activeStatus = false;

const isolatedNegativeSelftests = Object.freeze({
  durable: Object.freeze({
    expected: 'revision', result: assessArc4DurableEvidence(negativeDurableSelftest),
  }),
  arc5Missing: Object.freeze({
    expected: Object.freeze([
      'arc5NamespaceInventory', 'arc5CertificateShape',
      'arc5SourceFixedPoint', 'arc5TargetFixedPoint',
    ]),
    result: assessArc4DurableEvidence(negativeArc5MissingSelftest),
  }),
  arc5Misplaced: Object.freeze({
    expected: 'arc5NamespaceInventory',
    result: assessArc4DurableEvidence(negativeArc5MisplacedSelftest),
  }),
  arc5Duplicate: Object.freeze({
    expected: 'arc5NamespaceInventory',
    result: assessArc4DurableEvidence(negativeArc5DuplicateSelftest),
  }),
  arc5Shape: Object.freeze({
    expected: Object.freeze([
      'arc5CertificateShape', 'arc5SourceFixedPoint', 'arc5TargetFixedPoint',
    ]),
    result: assessArc4DurableEvidence(negativeArc5ShapeSelftest),
  }),
  arc5Noncanonical: Object.freeze({
    expected: Object.freeze([
      'arc5CertificateShape', 'arc5SourceFixedPoint', 'arc5TargetFixedPoint',
    ]),
    result: assessArc4DurableEvidence(negativeArc5NoncanonicalSelftest),
  }),
  arc5SourceDigest: Object.freeze({
    expected: 'arc5SourceFixedPoint',
    result: assessArc4DurableEvidence(negativeArc5SourceDigestSelftest),
  }),
  arc5TargetDigest: Object.freeze({
    expected: 'arc5TargetFixedPoint',
    result: assessArc4DurableEvidence(negativeArc5TargetDigestSelftest),
  }),
  arc5RetainedOldCertificate: Object.freeze({
    expected: Object.freeze([
      'durableEvidence', 'arc5CertificateSuccessor', 'unrelatedDurable',
      'ownershipV2Live',
    ]),
    result: assessArc4CommittedHit({
      ...hitBundleSelftest, after: negativeArc5RetainedOldCertificateSelftest,
    }),
  }),
  f4SerializerOrder: Object.freeze({
    expected: 'f4Authority',
    result: assessArc4DurableEvidence(negativeF4SerializerOrderSelftest),
  }),
  manifestStateDigest: Object.freeze({
    expected: Object.freeze(['ownershipStateDigest', 'arc5SourceFixedPoint']),
    result: assessArc4DurableEvidence(negativeManifestDigestSelftest),
  }),
  receiptSuccessorDigest: Object.freeze({
    expected: 'receipt',
    result: assessArc4CommittedHit({
      ...hitBundleSelftest, after: negativeReceiptDigestSelftest,
    }),
  }),
  coordinatedManifestReceiptDigest: Object.freeze({
    expected: Object.freeze([
      'durableEvidence', 'arc5CertificateSuccessor', 'unrelatedDurable',
      'ownershipV2Live',
    ]),
    result: assessArc4CommittedHit({
      ...hitBundleSelftest, after: negativeCoordinatedDigestSelftest,
    }),
  }),
  receiptEventDiscoveryIdentity: Object.freeze({
    expected: Object.freeze(['receipt', 'ownershipV2Live']),
    result: assessArc4CommittedHit({
      ...hitBundleSelftest, after: negativeReceiptEventSelftest,
    }),
  }),
  precondition: Object.freeze({
    expected: 'routeSettled',
    result: assessArc4CapturePrecondition(negativePreconditionSelftest),
  }),
  preconditionFixtureIdentity: Object.freeze({
    expected: 'fixtureIdentity',
    result: assessArc4CapturePrecondition(negativePreconditionFixtureSelftest),
  }),
  preconditionCycle: Object.freeze({
    expected: 'activePlayProjection',
    result: assessArc4CapturePrecondition(negativePreconditionCycleSelftest),
  }),
  preconditionCountdown: Object.freeze({
    expected: 'activePlayProjection',
    result: assessArc4CapturePrecondition(negativePreconditionCountdownSelftest),
  }),
  preconditionActivePlay: Object.freeze({
    expected: 'activePlayProjection',
    result: assessArc4CapturePrecondition(negativePreconditionActivePlaySelftest),
  }),
  preconditionStateRuntime: Object.freeze({
    expected: 'runtimeCaptureOrder',
    result: assessArc4CapturePrecondition(negativePreconditionStateRuntimeSelftest),
  }),
  preconditionDownwardRuntime: Object.freeze({
    expected: 'runtimeCaptureOrder',
    result: assessArc4CapturePrecondition(
      negativePreconditionDownwardRuntimeSelftest,
    ),
  }),
  preconditionHeading: Object.freeze({
    expected: 'surfaceCopy',
    result: assessArc4CapturePrecondition(negativePreconditionHeadingSelftest),
  }),
  preconditionCardIdentity: Object.freeze({
    expected: 'surfaceCopy',
    result: assessArc4CapturePrecondition(negativePreconditionCardSelftest),
  }),
  preconditionArc5: Object.freeze({
    expected: 'ownershipV2Ready',
    result: assessArc4CapturePrecondition(negativePreconditionArc5Selftest),
  }),
  pending: Object.freeze({
    expected: 'oneTrustedAction',
    result: assessArc4CapturePendingNoOptimism(negativePendingSelftest),
  }),
  pendingRetainedResult: Object.freeze({
    expected: 'liveProjectionStable',
    result: assessArc4CapturePendingNoOptimism(negativePendingRetainedResultSelftest),
  }),
  pendingStateRuntime: Object.freeze({
    expected: 'runtimeCaptureOrder',
    result: assessArc4CapturePendingNoOptimism(negativePendingStateRuntimeSelftest),
  }),
  pendingArc5: Object.freeze({
    expected: 'ownershipV2Stable',
    result: assessArc4CapturePendingNoOptimism(negativePendingArc5Selftest),
  }),
  hit: Object.freeze({
    expected: 'interaction', result: assessArc4CommittedHit(negativeHitSelftest),
  }),
  hitStateRuntime: Object.freeze({
    expected: 'runtimeCaptureOrder',
    result: assessArc4CommittedHit(negativeHitStateRuntimeSelftest),
  }),
  hitDownwardRuntime: Object.freeze({
    expected: 'runtimeCaptureOrder',
    result: assessArc4CommittedHit(negativeHitDownwardRuntimeSelftest),
  }),
  hitOwnershipRevisionResult: Object.freeze({
    expected: 'appResult',
    result: assessArc4CommittedHit(negativeHitOwnershipRevisionResultSelftest),
  }),
  progressCoordinate: Object.freeze({
    expected: Object.freeze(['ownershipV2Live', 'progress']),
    result: assessArc4CommittedHit(negativeProgressCoordinateSelftest),
  }),
  progressHierarchy: Object.freeze({
    expected: Object.freeze(['ownershipV2Live', 'progress']),
    result: assessArc4CommittedHit(negativeProgressHierarchySelftest),
  }),
  progressOrdinal: Object.freeze({
    expected: Object.freeze(['ownershipV2Live', 'progress']),
    result: assessArc4CommittedHit(negativeProgressOrdinalSelftest),
  }),
  progressParentCell: Object.freeze({
    expected: Object.freeze(['ownershipV2Live', 'progress']),
    result: assessArc4CommittedHit(negativeProgressParentCellSelftest),
  }),
  discoveryAddress: Object.freeze({
    expected: Object.freeze(['ownershipV2Live', 'exactDiscovery']),
    result: assessArc4CommittedHit(negativeDiscoveryAddressSelftest),
  }),
  miss: Object.freeze({
    expected: 'interaction', result: assessArc4CommittedMiss(negativeMissSelftest),
  }),
  missStateRuntime: Object.freeze({
    expected: 'runtimeCaptureOrder',
    result: assessArc4CommittedMiss(negativeMissStateRuntimeSelftest),
  }),
  missReceiptEvent: Object.freeze({
    expected: 'receipt', result: assessArc4CommittedMiss({
      ...missBundleSelftest, after: negativeMissReceiptEventSelftest,
    }),
  }),
  burnMissFirstForSpecies: Object.freeze({
    expected: 'outcome',
    result: assessArc4BurnStep(negativeBurnMissFirstForSpeciesSelftest),
  }),
  burnReceiptKind: Object.freeze({
    expected: 'receipt', result: assessArc4BurnStep({
      ...burnBundleSelftest, after: negativeBurnReceiptKindSelftest,
    }),
  }),
  burnReceiptWitness: Object.freeze({
    expected: 'receipt', result: assessArc4BurnStep({
      ...burnBundleSelftest, after: negativeBurnReceiptWitnessSelftest,
    }),
  }),
  burnReceiptEvent: Object.freeze({
    expected: 'receipt', result: assessArc4BurnStep({
      ...burnBundleSelftest, after: negativeBurnReceiptEventSelftest,
    }),
  }),
  burnReceiptDigest: Object.freeze({
    expected: 'receipt', result: assessArc4BurnStep({
      ...burnBundleSelftest, after: negativeBurnReceiptDigestSelftest,
    }),
  }),
  burnV4Transition: Object.freeze({
    expected: 'v4OwnedCompatibility', result: assessArc4BurnStep({
      ...burnBundleSelftest, after: negativeBurnV4TransitionSelftest,
    }),
  }),
  burnDownwardRuntime: Object.freeze({
    expected: 'liveAuthority',
    result: assessArc4BurnStep(negativeBurnDownwardRuntimeSelftest),
  }),
  storage: Object.freeze({
    expected: 'waitSettled', result: assessArc4StorageRefusal(negativeStorageSelftest),
  }),
  storageRetainedResult: Object.freeze({
    expected: 'liveProjectionStable',
    result: assessArc4StorageRefusal(negativeStorageRetainedResultSelftest),
  }),
  storageStateRuntime: Object.freeze({
    expected: 'runtimeCaptureOrder',
    result: assessArc4StorageRefusal(negativeStorageStateRuntimeSelftest),
  }),
  storageArc5: Object.freeze({
    expected: 'ownershipV2Stable',
    result: assessArc4StorageRefusal(negativeStorageArc5Selftest),
  }),
  storageSemanticUi: Object.freeze({
    expected: 'uiFactsStable',
    result: assessArc4StorageRefusal(negativeStorageSemanticUiSelftest),
  }),
  storageBudgetSemanticUi: Object.freeze({
    expected: 'uiFactsStable',
    result: assessArc4StorageRefusal(negativeStorageBudgetSemanticUiSelftest),
  }),
  storageCountdownText: Object.freeze({
    expected: 'activePlayProjection',
    result: assessArc4StorageRefusal(negativeStorageCountdownTextSelftest),
  }),
  stale: Object.freeze({
    expected: 'waitSettled', result: assessArc4StaleConvergence(negativeStaleSelftest),
  }),
  staleRetainedResult: Object.freeze({
    expected: 'oldOutcome',
    result: assessArc4StaleConvergence(negativeStaleRetainedResultSelftest),
  }),
  staleReloadUi: Object.freeze({
    expected: 'readOnlyReload',
    result: assessArc4StaleConvergence(negativeStaleReloadUiSelftest),
  }),
  staleArc5Preservation: Object.freeze({
    expected: 'ownershipV2Preserved',
    result: assessArc4StaleConvergence(negativeStaleArc5PreservationSelftest),
  }),
  staleReloadArc5: Object.freeze({
    expected: 'readOnlyReload',
    result: assessArc4StaleConvergence(negativeStaleReloadArc5Selftest),
  }),
  staleReloadActivation: Object.freeze({
    expected: 'reloadActivation',
    result: assessArc4StaleConvergence(negativeStaleReloadActivationSelftest),
  }),
  staleReloadStartsOpen: Object.freeze({
    expected: 'reloadStartsClosed',
    result: assessArc4StaleConvergence(
      negativeStaleReloadStartsOpenSelftest,
    ),
  }),
  staleReloadRaw: Object.freeze({
    expected: 'readOnlyReload',
    result: assessArc4StaleConvergence(negativeStaleReloadRawSelftest),
  }),
  staleTupleState: Object.freeze({
    expected: 'pagehideTuple',
    result: assessArc4StaleConvergence(negativeStaleTupleStateSelftest),
  }),
  staleTupleFault: Object.freeze({
    expected: 'pagehideTuple',
    result: assessArc4StaleConvergence(negativeStaleTupleFaultSelftest),
  }),
  staleTupleUi: Object.freeze({
    expected: 'pagehideTuple',
    result: assessArc4StaleConvergence(negativeStaleTupleUiSelftest),
  }),
  staleTupleArc5: Object.freeze({
    expected: 'pagehideTuple',
    result: assessArc4StaleConvergence(negativeStaleTupleArc5Selftest),
  }),
  staleReleasedHold: Object.freeze({
    expected: 'oldOwnerReleased',
    result: assessArc4StaleConvergence(negativeStaleReleasedHoldSelftest),
  }),
  publication: Object.freeze({
    expected: 'waitSettled',
    result: assessArc4PublicationConvergence(negativePublicationSelftest),
  }),
  publicationReloadUi: Object.freeze({
    expected: 'readOnlyReload',
    result: assessArc4PublicationConvergence(negativePublicationReloadUiSelftest),
  }),
  publicationOldArc5Optimism: Object.freeze({
    expected: 'noOldOptimism',
    result: assessArc4PublicationConvergence(
      negativePublicationOldArc5OptimismSelftest,
    ),
  }),
  publicationReloadArc5: Object.freeze({
    expected: 'readOnlyReload',
    result: assessArc4PublicationConvergence(negativePublicationReloadArc5Selftest),
  }),
  publicationReloadActivation: Object.freeze({
    expected: 'reloadActivation',
    result: assessArc4PublicationConvergence(
      negativePublicationReloadActivationSelftest,
    ),
  }),
  publicationReloadStartsOpen: Object.freeze({
    expected: 'reloadStartsClosed',
    result: assessArc4PublicationConvergence(
      negativePublicationReloadStartsOpenSelftest,
    ),
  }),
  publicationReloadRaw: Object.freeze({
    expected: 'readOnlyReload',
    result: assessArc4PublicationConvergence(
      negativePublicationReloadRawSelftest,
    ),
  }),
  publicationTupleState: Object.freeze({
    expected: 'pagehideTuple',
    result: assessArc4PublicationConvergence(negativePublicationTupleStateSelftest),
  }),
  publicationTupleFault: Object.freeze({
    expected: 'pagehideTuple',
    result: assessArc4PublicationConvergence(negativePublicationTupleFaultSelftest),
  }),
  publicationTupleUi: Object.freeze({
    expected: 'pagehideTuple',
    result: assessArc4PublicationConvergence(negativePublicationTupleUiSelftest),
  }),
  publicationTupleArc5: Object.freeze({
    expected: 'pagehideTuple',
    result: assessArc4PublicationConvergence(negativePublicationTupleArc5Selftest),
  }),
  publicationReleasedHold: Object.freeze({
    expected: 'oldOwnerReleased',
    result: assessArc4PublicationConvergence(negativePublicationReleasedHoldSelftest),
  }),
  publicationReloadDownwardRuntime: Object.freeze({
    expected: 'readOnlyReload',
    result: assessArc4PublicationConvergence(
      negativePublicationReloadDownwardRuntimeSelftest,
    ),
  }),
  publicationReloadUpwardRuntime: Object.freeze({
    expected: 'readOnlyReload',
    result: assessArc4PublicationConvergence(
      negativePublicationReloadUpwardRuntimeSelftest,
    ),
  }),
  publicationPreservedBudget: Object.freeze({
    expected: 'preservedUiFacts',
    result: assessArc4PublicationConvergence(
      negativePublicationPreservedBudgetSelftest,
    ),
  }),
  publicationOldRuntime: Object.freeze({
    expected: 'pagehideRuntime',
    result: assessArc4PublicationConvergence(
      negativePublicationOldRuntimeSelftest,
    ),
  }),
  publicationRenderedFuture: Object.freeze({
    expected: 'oldUiTimeDirection',
    result: assessArc4PublicationConvergence(
      negativePublicationRenderedFutureSelftest,
    ),
  }),
  publicationExcessiveUiLag: Object.freeze({
    expected: 'oldUiTimeDirection',
    result: assessArc4PublicationConvergence(
      negativePublicationExcessiveUiLagSelftest,
    ),
  }),
  exhaustion: Object.freeze({
    expected: 'offlineDoesNotRecover',
    result: assessArc4ExhaustionRecovery(negativeExhaustionSelftest),
  }),
  exhaustionSuppression: Object.freeze({
    expected: 'disabledSuppression',
    result: assessArc4Exhaustion(negativeExhaustionSuppressionSelftest),
  }),
  exhaustionLive: Object.freeze({
    expected: 'exhaustedLive',
    result: assessArc4Exhaustion(negativeExhaustionLiveSelftest),
  }),
  geometry: Object.freeze({
    expected: 'noControlOverlap',
    result: assessArc4CaptureCardGeometryFocus(negativeGeometrySelftest),
  }),
  geometrySettlement: Object.freeze({
    expected: 'pendingFocus',
    result: assessArc4CaptureCardGeometryFocus(negativeGeometrySettlementSelftest),
  }),
});

for (const [name, control] of Object.entries(isolatedNegativeSelftests)) {
  const failed = Object.entries(control.result.checks)
    .filter(([, value]) => value !== true)
    .map(([check]) => check);
  const expected = Array.isArray(control.expected)
    ? control.expected : [control.expected];
  if (control.result.ok !== false || !same(failed, expected)) {
    throw new Error(`Arc 4 browser contract negative selftest was not isolated (${name}): ${failed.join(', ')}`);
  }
}

const coordinatedV4CompatibilitySelftests = Object.freeze({
  hitScanhits: Object.freeze({
    expected: Object.freeze(['v4OwnedCompatibility', 'v4OwnedCounters']),
    result: assessArc4CommittedHit(coherentHitV4BundleSelftest),
  }),
  hitArrivals: Object.freeze({
    expected: Object.freeze(['v4OwnedCompatibility', 'v4OwnedCounters']),
    result: assessArc4CommittedHit(coherentHitArrivalsBundleSelftest),
  }),
  hitMaxGen: Object.freeze({
    expected: Object.freeze(['v4OwnedCompatibility', 'v4OwnedCounters']),
    result: assessArc4CommittedHit(coherentHitMaxGenBundleSelftest),
  }),
  missScanhits: Object.freeze({
    expected: Object.freeze(['v4OwnedCompatibility', 'v4OwnedCounters']),
    result: assessArc4CommittedMiss(coherentMissV4BundleSelftest),
  }),
  publicationScanhits: Object.freeze({
    expected: Object.freeze(['committedOutcome', 'v4OwnedCounters']),
    result: assessArc4PublicationConvergence(coherentPublicationV4BundleSelftest),
  }),
  burnScanhits: Object.freeze({
    expected: Object.freeze(['v4OwnedCompatibility']),
    result: assessArc4BurnStep(coherentBurnV4BundleSelftest),
  }),
  burnMaxGen: Object.freeze({
    expected: Object.freeze(['v4OwnedCompatibility']),
    result: assessArc4BurnStep(coherentBurnMaxGenBundleSelftest),
  }),
});
for (const [name, control] of Object.entries(coordinatedV4CompatibilitySelftests)) {
  const failed = Object.entries(control.result.checks)
    .filter(([, value]) => value !== true)
    .map(([check]) => check);
  if (control.result.ok !== false || !same(failed, control.expected)) {
    throw new Error(`Arc 4 coordinated v4 compatibility control drifted (${name}): ${failed.join(', ')}`);
  }
}

const v4OnlyCountersAssessment = assessArc4DurableEvidence(
  negativeV4OnlyCountersSelftest,
);
const v4OnlyCounterFailures = Object.entries(v4OnlyCountersAssessment.checks)
  .filter(([, value]) => value !== true)
  .map(([name]) => name);
if (!exactRawPair(
  negativeV4OnlyCountersSelftest.legacyRaw,
  negativeV4OnlyCountersSelftest.legacy,
) || v4OnlyCountersAssessment.ok !== false
  || !same(v4OnlyCounterFailures, ['v4Envelope', 'v4OwnedCounters'])) {
  throw new Error(`Arc 4 browser contract v4-only counter control was not coherent: ${v4OnlyCounterFailures.join(', ')}`);
}

const failClosedSelftests = Object.freeze({
  durable: assessArc4DurableEvidence(),
  precondition: assessArc4CapturePrecondition(),
  pending: assessArc4CapturePendingNoOptimism(),
  hit: assessArc4CommittedHit(),
  miss: assessArc4CommittedMiss(),
  burn: assessArc4BurnStep(),
  storage: assessArc4StorageRefusal(),
  stale: assessArc4StaleConvergence(),
  publication: assessArc4PublicationConvergence(),
  exhaustionOnly: assessArc4Exhaustion(),
  exhaustion: assessArc4ExhaustionRecovery(),
  geometry: assessArc4CaptureCardGeometryFocus(),
});

for (const [name, result] of Object.entries(failClosedSelftests)) {
  if (result.ok !== false) {
    throw new Error(`Arc 4 browser contract accepted absent evidence (${name})`);
  }
}

const selftestSourceClosureChecks = Object.freeze({
  correctedCarrier: sha256(SELFTEST_ARC2_LOOT_CARRIER.json)
      === ARC4_PERTAR_FIXTURE.arc2LootSha256
    && selftestPertarCapability?.loadoutFingerprint
      === ARC4_PERTAR_SOURCE_FACTS.arc2LoadoutFingerprint
    && selftestPertarCapability?.engineeringFingerprint
      === ARC4_PERTAR_SOURCE_FACTS.engineeringCapabilityFingerprint
    && selftestPertarCapability?.fingerprint === ARC4_PERTAR_FIXTURE.capabilityFingerprint
    && selftestPertarCapability?.inventoryRevision === ARC4_PERTAR_FIXTURE.inventoryRevision
    && selftestPertarCapability?.contactCapturePoints
      === ARC4_PERTAR_FIXTURE.contactCapturePoints
    && same(selftestPertarCapability?.equippedInstanceIds,
      ARC4_PERTAR_SOURCE_FACTS.equippedInstanceIds)
    && same(selftestPertarCapability?.systemIds,
      ARC4_PERTAR_SOURCE_FACTS.installedSystemIds),
  correctedShip: same(selftestPertarShip, {
    chassisStage: 1,
    installedSystemIds: ['jumpdrive'],
    hardpoints: { array: false, autoext: false, cscoop: false },
    provenance: 'owned-items',
  }),
  correctedRoute: arc4PertarRouteAllowedFromShip(selftestPertarShip) === true,
  jumpOnlyCarrierDelta: same(
    SELFTEST_ARC2_LOOT_NO_JUMP.inventory, SELFTEST_ARC2_LOOT.inventory,
  ) && same(
    SELFTEST_ARC2_LOOT_NO_JUMP.stackableCounts,
    SELFTEST_ARC2_LOOT.stackableCounts.filter(({ baseId }) => baseId !== 'jumpdrive'),
  ) && same(
    SELFTEST_ARC2_LOOT.stackableCounts.filter(({ baseId }) => baseId === 'jumpdrive'),
    [{ baseId: 'jumpdrive', count: 1 }],
  ),
  noJumpCarrier: sha256(SELFTEST_ARC2_LOOT_NO_JUMP_CARRIER.json)
      === ARC4_PERTAR_SOURCE_FACTS.noJumpArc2LootSha256
    && selftestNoJumpCapability?.loadoutFingerprint
      === ARC4_PERTAR_SOURCE_FACTS.noJumpArc2LoadoutFingerprint
    && selftestNoJumpCapability?.engineeringFingerprint
      === ARC4_PERTAR_SOURCE_FACTS.noJumpEngineeringCapabilityFingerprint
    && selftestNoJumpCapability?.fingerprint
      === ARC4_PERTAR_SOURCE_FACTS.noJumpCapabilityFingerprint
    && selftestNoJumpCapability?.contactCapturePoints
      === ARC4_PERTAR_FIXTURE.contactCapturePoints,
  noJumpCaptureRefused: exactPertarCapability(
    selftestArc2Evidence(SELFTEST_ARC2_LOOT_NO_JUMP_CARRIER),
  ) === null,
  noJumpShip: same(selftestNoJumpShip, {
    chassisStage: 0,
    installedSystemIds: [],
    hardpoints: { array: false, autoext: false, cscoop: false },
    provenance: 'owned-items',
  }),
  noJumpRoute: arc4PertarRouteAllowedFromShip(selftestNoJumpShip) === false,
  emptySkimPrepares: same(selftestEmptySkimSource, {
    kind: 'prepared', detail: null,
    legacyDiagnostics: {
      missingWorldSeeds: [], ambiguousWorldSeeds: [],
      missingStarSeeds: [], ambiguousStarSeeds: [],
    },
  }),
  orphanSkimProtected: same(selftestOrphanSkimSource, {
    kind: 'protected', reason: 'legacy-refused', detail: 'legacy-seed-missing',
    legacyDiagnostics: {
      missingWorldSeeds: [], ambiguousWorldSeeds: [],
      missingStarSeeds: [424_242], ambiguousStarSeeds: [],
    },
  }),
  malformedSkimRefused: classifyArc4PertarLegacySkimSources(
    [[424_242, 0]], [ARC4_PERTAR_FIXTURE.star.seed],
  ) === null && projectArc4PertarShipSource({
    systemIds: ['jumpdrive', 'jumpdrive'],
    ascChapter: ARC4_PERTAR_SOURCE_FACTS.legacyAscChapter,
  }) === null,
});
const selftestSourceClosureFailures = Object.entries(selftestSourceClosureChecks)
  .filter(([, passed]) => passed !== true).map(([name]) => name);
if (selftestSourceClosureFailures.length > 0) {
  throw new Error(`Arc 4 Pertar source-closure selftest failed: ${selftestSourceClosureFailures.join(', ')}`);
}

if (ARC4_OWNERSHIP_EXTENSION_TARGETS.length !== 18
  || sha256(canonicalToolJson(ARC4_OWNERSHIP_EXTENSION_TARGETS))
    !== 'cb4bf8df5f5eaca8f57b842a2187c5c5791516dc7d4e389d58f9ab729b15b026'
  || sha256(canonicalToolJson(ARC4_PERTAR_FIXTURE))
    !== '801230daf3f7e627d23a80d5f6e9e711a94be465619068886faee28fc45df021'
  || sha256(canonicalToolJson(ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET))
    !== 'e548f628e5859335b608a12632e66d4220432ab188a76af460fbc5261eefded4'
  || hitNaiveCarrierDigest === hitManifestDigest
  || buildArc4DurableReadExpression() !== ARC4_DURABLE_READ_EXPRESSION
  || buildArc4CaptureUiExpression() !== ARC4_CAPTURE_UI_EXPRESSION
  || !ARC4_DURABLE_READ_EXPRESSION.includes("db.transaction(['meta','player','creatures','catalog','inventory','settings','receipts'],'readonly')")
  || !ARC4_CAPTURE_UI_EXPRESSION.includes("document.getElementById('survey')")
  || !ARC4_CAPTURE_UI_EXPRESSION.includes("#planetside .planetside-heading")
  || !ARC4_CAPTURE_UI_EXPRESSION.includes('ownershipV2:state?.ownershipV2??null')
  || assessArc4CaptureCardGeometryFocus({
    ...geometryBundleSelftest, settlement: undefined,
  }).ok !== true
  || !overlaps(geometryControlsSelftest[0].buttonRect,
    geometryControlsSelftest[1].buttonRect)
  || overlaps(geometryControlsSelftest[0].layoutRect,
    geometryControlsSelftest[1].layoutRect)
  || arc4CaptureUiSnapshotComplete((() => {
    const missing = structuredClone(beforeUiSelftest);
    delete missing.planetsideHeading;
    return missing;
  })()) !== false
  || arc4DurableEvidenceComplete({}) !== false
  || projectArc4OwnershipEvidence({}) !== null
  || projectArc5OwnershipMigrationEvidence({}) !== null
  || projectArc4V4OwnedCounters({}) !== null
  || projectArc4V4OwnedCompatibility({}) !== null
  || !same(projectArc4V4OwnedCounters(beforeRawSelftest), {
    legacy: ARC4_PERTAR_FIXTURE.v4OwnedCounters.before,
    split: ARC4_PERTAR_FIXTURE.v4OwnedCounters.before,
  })
  || projectArc5OwnershipMigrationEvidence(beforeRawSelftest)?.certificate?.sourceDigest
    !== projectArc5OwnershipMigrationEvidence(beforeRawSelftest)?.sourceDigest
  || projectArc5OwnershipMigrationEvidence(beforeRawSelftest)?.certificate?.targetDigest
    !== projectArc5OwnershipMigrationEvidence(beforeRawSelftest)?.targetDigest
  || !same(projectArc4V4OwnedCompatibility(beforeRawSelftest), {
    legacy: ARC4_PERTAR_FIXTURE.v4OwnedCompatibility.before,
    split: ARC4_PERTAR_FIXTURE.v4OwnedCompatibility.before,
  })
  || hitMirror().catalogSpecies[0]?.genome?.gen
    !== ARC4_PERTAR_FIXTURE.actions.firstHit.generation
  || !same(projectArc4V4OwnedCounters(hitRawSelftest), {
    legacy: ARC4_PERTAR_FIXTURE.v4OwnedCounters.afterFirstHit,
    split: ARC4_PERTAR_FIXTURE.v4OwnedCounters.afterFirstHit,
  })
  || !same(projectArc4V4OwnedCompatibility(hitRawSelftest), {
    legacy: ARC4_PERTAR_FIXTURE.v4OwnedCompatibility.afterFirstHit,
    split: ARC4_PERTAR_FIXTURE.v4OwnedCompatibility.afterFirstHit,
  })
  || sha256(SELFTEST_ARC2_LOOT_CARRIER.json)
    !== ARC4_PERTAR_FIXTURE.arc2LootSha256
  || !exactFixtureAttemptOracle(
    firstAttemptOracleSelftest, firstExpected, SELFTEST_EVENTS[0], 4,
  )
  || !exactFixtureAttemptOracle(
    secondAttemptOracleSelftest, secondExpected, SELFTEST_EVENTS[1], 9,
  )
  || parseJson(missReceiptSelftest.witness)?.event
    !== secondAttemptOracleSelftest?.event
  || laggedPreconditionBundleSelftest.raw.authority.activePlayMs !== 0
  || persistenceStateOf(laggedPreconditionBundleSelftest.ui)
    ?.runtime?.activePlayMs !== 20_000
  || persistenceStateOf(laggedPreconditionBundleSelftest.state)
    ?.runtime?.activePlayMs !== 25_000
  || arc4CaptureUiSnapshotComplete({}) !== false
  || arc4BrowserOutcomePasses({
    released: true, assessment: positiveSelftestAssessments.geometry,
    surface: 'survey',
  }) !== true
  || arc4BrowserOutcomePasses({
    released: false, assessment: positiveSelftestAssessments.geometry,
    surface: 'survey',
  }) !== false) {
  throw new Error('Arc 4 browser contract invariant selftest failed');
}
