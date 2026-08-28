import { createHash } from 'node:crypto';

/* Tool-owned Arc 3 Engineering presentation inventory.

   The browser gates intentionally carry an exact independent copy of the
   public catalogue order. Reading the DOM's own count back as the expected
   count would let a missing or duplicated research/recipe row pass
   vacuously. Keep this list synchronized only through a deliberate product
   catalogue change and its corresponding gate review. */

export const ENGINEERING_RESEARCH_IDS = Object.freeze([
  'scan1', 'hull1', 'lab1', 'drive1', 'drive2', 'drive3',
]);

export const ENGINEERING_RECIPE_GROUPS = Object.freeze([
  Object.freeze({
    id: 'part', recipes: Object.freeze([
      'plate', 'wire', 'chip', 'frame', 'lens', 'pellet', 'weave', 'cell', 'cryogel',
    ]),
  }),
  Object.freeze({
    id: 'comp', recipes: Object.freeze([
      'coil', 'navcore', 'hullseg', 'fuelcell', 'servo', 'cryocap',
    ]),
  }),
  Object.freeze({
    id: 'sys', recipes: Object.freeze([
      'jumpdrive', 'array', 'igdrive', 'autoext', 'cscoop',
    ]),
  }),
  Object.freeze({
    id: 'gear', recipes: Object.freeze([
      'rig1', 'rig2', 'rig3', 'fieldsuit', 'hazmat', 'thermal', 'presshull', 'cryoline',
      'struts', 'stabil', 'anchor', 'headlamp', 'visor', 'voidhelm', 'earpiece',
      'resonator', 'meteor', 'compass', 'diplobeacon', 'prismpendant', 'gripgloves',
      'surgeon', 'fieldlegs', 'greaves', 'magboots', 'gravboots', 'cg-proto',
      'cg-genesis', 'cg-void', 'cg-chron', 'cg-dark', 'cg-plasma', 'cg-corona',
    ]),
  }),
  Object.freeze({
    id: 'relic', recipes: Object.freeze([
      'rl-stone', 'rl-ocean', 'rl-flame', 'rl-sky', 'rl-life', 'rl-mind', 'rl-star',
      'rl-void', 'rl-prism',
    ]),
  }),
]);

export const ENGINEERING_RECIPE_IDS = Object.freeze(
  ENGINEERING_RECIPE_GROUPS.flatMap(({ recipes }) => recipes),
);

export const ENGINEERING_ACTION_CONTROL_COUNT = 2
  + ENGINEERING_RESEARCH_IDS.length + ENGINEERING_RECIPE_IDS.length;
export const ENGINEERING_ACTION_KEYS = Object.freeze([
  'mine:', 'skim:', ...ENGINEERING_RESEARCH_IDS.map((id) => `research:${id}`),
  ...ENGINEERING_RECIPE_IDS.map((id) => `fabricate:${id}`),
]);

export const ENGINEERING_REMNANT_ROUTE_TARGET = Object.freeze({
  schema: 'cf-v2-arc3-remnant-route-target/v1',
  galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
  requestedStar: Object.freeze({
    seed: 449521432, x: 734.58, y: -10.77,
  }),
  canonicalStar: Object.freeze({
    seed: 449521432, x: 734.58, y: -10.77, layer: 'coarse',
    parentCell: Object.freeze({ x: 17, y: -1 }),
  }),
  navStarKey: 'CF1|g:999@90,-60|s:449521432@734.58,-10.77',
  neighborhoodRadius: 300,
  sourceWitness: Object.freeze({
    schema: 'cf-v2-tool-star-source-oracle/v1',
    generator: 'WorldGen.starsInCell+systemFor', cellOrdinal: 1,
    kind: 'BH', seed: 449521432, expectedFirstQuantity: 2,
    x: 734.58, y: -10.77, layer: 'coarse',
    parentCell: Object.freeze({ x: 17, y: -1 }),
  }),
});

/* Retain the failed fixture as an explicit two-sided ingress control. Its
   source coordinates are not valid public CF1 bytes; rounding them produces
   a real source star that remains outside the fixture's Stage-1 Jump reach.
   Slice drives both strings through the native Search Enter path before it
   uses the reachable target above. */
export const ENGINEERING_REMNANT_ROUTE_LEGACY_TARGET = Object.freeze({
  rawStar: Object.freeze({
    seed: 3363971653, x: -386.2348864697851, y: 453.95830733468756,
  }),
  canonicalStar: Object.freeze({
    seed: 3363971653, x: -386.23, y: 453.96, layer: 'fine',
    parentCell: Object.freeze({ x: -28, y: 32 }),
  }),
});

/* Exact, source-independent expectations for Glass Matrix's veteran_rich
   fixture after its two deliberate Inventory additions (Hazmat + Thermal).
   These bytes are intentionally not derived from the page read model, DOM,
   catalogue, or action attributes: a coherent product regression must not
   be able to teach the gate its own new answer. */
const researchFixtureRow = (id, status, modelEnabled, disabled) => Object.freeze({
  id, status, modelEnabled, disabled,
});
const recipeFixtureRow = (id, status, effectSupport, modelEnabled, disabled) => Object.freeze({
  id, status, effectSupport, modelEnabled, disabled,
});

export const ENGINEERING_GLASS_RESEARCH_ORACLE = Object.freeze([
  researchFixtureRow('scan1', 'owned', 'false', true),
  researchFixtureRow('hull1', 'owned', 'false', true),
  researchFixtureRow('lab1', 'unavailable', 'false', true),
  researchFixtureRow('drive1', 'unavailable', 'false', true),
  researchFixtureRow('drive2', 'unavailable', 'false', true),
  researchFixtureRow('drive3', 'unavailable', 'false', true),
]);

export const ENGINEERING_GLASS_RECIPE_ORACLE = Object.freeze([
  recipeFixtureRow('plate', 'available', 'live', 'true', false),
  recipeFixtureRow('wire', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('chip', 'available', 'live', 'true', false),
  recipeFixtureRow('frame', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('lens', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('pellet', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('weave', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('cell', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('cryogel', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('coil', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('navcore', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('hullseg', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('fuelcell', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('servo', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('cryocap', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('jumpdrive', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('array', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('igdrive', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('autoext', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('cscoop', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('rig1', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('rig2', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('rig3', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('fieldsuit', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('hazmat', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('thermal', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('presshull', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('cryoline', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('struts', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('stabil', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('anchor', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('headlamp', 'available', 'live', 'true', false),
  recipeFixtureRow('visor', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('voidhelm', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('earpiece', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('resonator', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('meteor', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('compass', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('diplobeacon', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('prismpendant', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('gripgloves', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('surgeon', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('fieldlegs', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('greaves', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('magboots', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('gravboots', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('cg-proto', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('cg-genesis', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('cg-void', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('cg-chron', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('cg-dark', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('cg-plasma', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('cg-corona', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('rl-stone', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('rl-ocean', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('rl-flame', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('rl-sky', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('rl-life', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('rl-mind', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('rl-star', 'unavailable', 'live', 'false', true),
  recipeFixtureRow('rl-void', 'unavailable', 'unavailable', 'false', true),
  recipeFixtureRow('rl-prism', 'unavailable', 'live', 'false', true),
]);
const ENGINEERING_GLASS_ORACLE_SHA256 = '97f6c8a9e093e516cf400f13433e06da43c2820916cf86d5c3dd7f53ba332a39';
const engineeringGlassOracleSha256 = createHash('sha256').update(JSON.stringify({
  research: ENGINEERING_GLASS_RESEARCH_ORACLE,
  recipes: ENGINEERING_GLASS_RECIPE_ORACLE,
})).digest('hex');

const canonicalToolJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalToolJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalToolJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const publicCoordinate = (value) => Number.isFinite(value)
  && Math.round(value * 100) / 100 === value;

const isToolRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const parseToolJson = (raw) => {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  try { return JSON.parse(raw); } catch { return null; }
};
const exactJsonPair = (raw, parsed) => {
  const decoded = parseToolJson(raw);
  return decoded !== null && isToolRecord(parsed)
    && canonicalToolJson(decoded) === canonicalToolJson(parsed)
    && raw === JSON.stringify(parsed);
};
const exactToolKeys = (value, expected) => isToolRecord(value)
  && canonicalToolJson(Object.keys(value).sort()) === canonicalToolJson([...expected].sort());
const V5_TOOL_EXTENSION_LIMITS = Object.freeze({
  jsonBytes: 262_144,
  totalBytes: 1_048_576,
  namespacesPerSegment: 64,
  namespaces: 128,
});
const V5_TOOL_SEGMENT_FIELDS = Object.freeze({
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
const V5_TOOL_SEGMENT_EVIDENCE = Object.freeze([
  Object.freeze({ segment: 'player', raw: 'playerRaw', row: 'playerRow' }),
  Object.freeze({ segment: 'creatures', raw: 'creaturesRaw', row: 'creaturesRow' }),
  Object.freeze({ segment: 'catalog', raw: 'catalogRaw', row: 'catalogRow' }),
  Object.freeze({ segment: 'inventory', raw: 'inventoryRaw', row: 'inventoryRow' }),
  Object.freeze({ segment: 'settings', raw: 'settingsRaw', row: 'settingsRow' }),
]);
const utf8ToolBytes = (value) => new TextEncoder().encode(value).byteLength;
const inspectV5ToolExtensions = (value) => {
  if (!isToolRecord(value)) return null;
  const namespaces = Object.keys(value);
  if (namespaces.length > V5_TOOL_EXTENSION_LIMITS.namespacesPerSegment) return null;
  let jsonBytes = 0;
  for (const namespace of namespaces) {
    const carrier = value[namespace];
    if (!/^[a-z][a-z0-9.-]{0,63}$/.test(namespace)
      || !exactToolKeys(carrier, ['version', 'json'])
      || !Number.isSafeInteger(carrier.version) || carrier.version < 1
      || typeof carrier.json !== 'string'
      || carrier.json.length > V5_TOOL_EXTENSION_LIMITS.jsonBytes) return null;
    const bytes = utf8ToolBytes(carrier.json);
    if (bytes > V5_TOOL_EXTENSION_LIMITS.jsonBytes
      || !isToolRecord(parseToolJson(carrier.json))) return null;
    jsonBytes += bytes;
  }
  return Object.freeze({ namespaces: namespaces.length, jsonBytes });
};
const inspectV5ToolRow = (raw, row, segment) => {
  const hasExtensions = Object.prototype.hasOwnProperty.call(row ?? {}, 'extensions');
  if (!exactJsonPair(raw, row)
    || !(exactToolKeys(row, ['schema', 'segment', 'data'])
      || exactToolKeys(row, ['schema', 'segment', 'data', 'extensions']))
    || row.schema !== 5 || row.segment !== segment || !isToolRecord(row.data)
    || Object.keys(row.data).some((field) => !V5_TOOL_SEGMENT_FIELDS[segment].includes(field))) return null;
  const extensionStats = hasExtensions
    ? inspectV5ToolExtensions(row.extensions)
    : Object.freeze({ namespaces: 0, jsonBytes: 0 });
  return extensionStats === null ? null : Object.freeze({ row, ...extensionStats });
};
export const assessV5ToolRows = (evidence) => {
  const checks = {};
  let totalNamespaces = 0;
  let totalJsonBytes = 0;
  const inspectedRows = [];
  for (const descriptor of V5_TOOL_SEGMENT_EVIDENCE) {
    const inspected = inspectV5ToolRow(
      evidence?.[descriptor.raw], evidence?.[descriptor.row], descriptor.segment,
    );
    checks[`${descriptor.segment}Row`] = inspected !== null;
    if (inspected !== null) {
      inspectedRows.push(inspected.row);
      totalNamespaces += inspected.namespaces;
      totalJsonBytes += inspected.jsonBytes;
    }
  }
  const rowsComplete = Object.values(checks).every((value) => value === true);
  checks.extensionAggregate = rowsComplete
    ? totalNamespaces <= V5_TOOL_EXTENSION_LIMITS.namespaces
      && totalJsonBytes <= V5_TOOL_EXTENSION_LIMITS.totalBytes
    : true;
  const envelope = {};
  let uniqueEnvelopeFields = true;
  if (rowsComplete) {
    for (const row of inspectedRows) {
      for (const [field, value] of Object.entries(row.data)) {
        if (Object.prototype.hasOwnProperty.call(envelope, field)) {
          uniqueEnvelopeFields = false;
        } else envelope[field] = value;
      }
    }
  }
  checks.uniqueEnvelopeFields = rowsComplete ? uniqueEnvelopeFields : true;
  checks.legacyMirror = rowsComplete && uniqueEnvelopeFields
    ? isToolRecord(evidence?.legacy)
      && canonicalToolJson(envelope) === canonicalToolJson(evidence.legacy)
    : true;
  return Object.freeze({
    ok: Object.values(checks).every((value) => value === true),
    checks: Object.freeze(checks),
  });
};
export const v5ToolRowsComplete = (evidence) => assessV5ToolRows(evidence).ok;
const exactCarrier = (row, namespace, version, json, parsed) => {
  const carrier = row?.extensions?.[namespace];
  return version === 1 && carrier?.version === version && carrier?.json === json
    && exactJsonPair(json, parsed);
};
const exactF4ToolAuthority = (evidence) => {
  const authority = evidence?.authority;
  const sessionRng = authority?.sessionRng;
  const draws = sessionRng?.draws;
  if (!exactCarrier(evidence?.playerRow, 'f4.authority', evidence?.authorityVersion,
    evidence?.authorityJson, authority)
    || !exactToolKeys(authority, ['activePlayMs', 'sessionRng'])
    || !Number.isSafeInteger(authority.activePlayMs) || authority.activePlayMs < 0
    || authority.activePlayMs > 10_000_000_000_000
    || !exactToolKeys(sessionRng, ['seed', 'ordinal', 'draws'])
    || !Number.isSafeInteger(sessionRng.seed) || sessionRng.seed < 0
    || sessionRng.seed > 0xffff_ffff
    || !Number.isSafeInteger(sessionRng.ordinal) || sessionRng.ordinal < 0
    || sessionRng.ordinal > 0xffff_ffff || !isToolRecord(draws)) return false;
  const drawEntries = Object.entries(draws);
  if (drawEntries.some(([domain, count]) => domain.length < 1 || domain.length > 64
    || /[\u0000-\u001f\u007f]/.test(domain)
    || !Number.isSafeInteger(count) || count < 0 || count > 0xffff_ffff)) return false;
  const sortedDraws = Object.fromEntries(
    [...drawEntries].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0),
  );
  return evidence.authorityJson === JSON.stringify({
    activePlayMs: authority.activePlayMs,
    sessionRng: {
      seed: sessionRng.seed, ordinal: sessionRng.ordinal, draws: sortedDraws,
    },
  });
};
const exactReceiptShape = (evidence) => {
  if (!Array.isArray(evidence?.receiptKeys) || !Array.isArray(evidence?.receiptRawRows)
    || !Array.isArray(evidence?.receiptRows)
    || evidence.receiptKeys.length !== evidence.receiptRawRows.length
    || evidence.receiptKeys.length !== evidence.receiptRows.length
    || new Set(evidence.receiptKeys).size !== evidence.receiptKeys.length
    || !evidence.receiptKeys.every((key) => typeof key === 'string')
    || !evidence.receiptRawRows.every((raw) => typeof raw === 'string' && raw.length > 0)) return false;
  return evidence.receiptRows.every((row, index) => isToolRecord(row)
    && exactJsonPair(evidence.receiptRawRows[index], row));
};
export const arc3DurableEvidenceComplete = (evidence) => (
  isToolRecord(evidence)
  && typeof evidence.revisionRaw === 'string' && evidence.revisionRaw.length > 0
  && Number.isSafeInteger(evidence.revision) && Number(evidence.revisionRaw) === evidence.revision
  && exactJsonPair(evidence.legacyRaw, evidence.legacy) && evidence.legacy?.v === 4
  && v5ToolRowsComplete(evidence)
  && exactF4ToolAuthority(evidence)
  && exactCarrier(evidence.playerRow, 'arc3.engineering', evidence.engineeringVersion,
    evidence.engineeringJson, evidence.arc3)
  && exactCarrier(evidence.inventoryRow, 'arc2.loot', evidence.arc2Version,
    evidence.arc2Json, evidence.arc2)
  && exactReceiptShape(evidence)
);

export const arc3TrainingEvidenceMode = (evidence) => {
  const carrier = evidence?.playerRow?.extensions?.['arc3.engineering'];
  const present = evidence?.engineeringVersion === 1
    && exactCarrier(evidence?.playerRow, 'arc3.engineering', evidence.engineeringVersion,
      evidence.engineeringJson, evidence.arc3);
  const absent = evidence?.engineeringVersion === null
    && evidence?.engineeringJson === null && evidence?.arc3 === null && carrier === undefined;
  return present ? 'carrier-present' : absent ? 'protected-absent' : null;
};
export const arc3TrainingDurableEvidenceComplete = (evidence) => (
  isToolRecord(evidence)
  && Object.prototype.hasOwnProperty.call(evidence, 'revisionRaw')
  && Object.prototype.hasOwnProperty.call(evidence, 'revision')
  && typeof evidence.revisionRaw === 'string'
  && Number.isSafeInteger(evidence.revision) && evidence.revisionRaw === String(evidence.revision)
  && exactJsonPair(evidence.legacyRaw, evidence.legacy) && evidence.legacy?.v === 4
  && v5ToolRowsComplete(evidence)
  && exactF4ToolAuthority(evidence)
  && Object.prototype.hasOwnProperty.call(evidence, 'engineeringVersion')
  && Object.prototype.hasOwnProperty.call(evidence, 'engineeringJson')
  && Object.prototype.hasOwnProperty.call(evidence, 'arc3')
  && arc3TrainingEvidenceMode(evidence) !== null
  && exactCarrier(evidence.inventoryRow, 'arc2.loot', evidence.arc2Version,
    evidence.arc2Json, evidence.arc2)
  && exactReceiptShape(evidence)
);

const ARC3_ACTION_OWNED_DATA_FIELDS = Object.freeze({
  'mine-world': Object.freeze({
    player: Object.freeze(['at', 'mines', 'asc', 'ascp']),
    inventory: Object.freeze(['cargo', 'mx', 'minedw']),
  }),
  'skim-star': Object.freeze({
    player: Object.freeze(['at', 'hp', 'skims', 'cosmics']),
    inventory: Object.freeze(['cargo', 'skx']),
  }),
  'purchase-research': Object.freeze({
    player: Object.freeze(['at', 'essence']),
    inventory: Object.freeze(['cargo', 'tech']),
  }),
  'fabricate-fixed': Object.freeze({
    player: Object.freeze(['at', 'crafts', 'asc', 'ascp']),
    inventory: Object.freeze(['cargo', 'items']),
  }),
});
const ARC3_MARS_WORLD_KEY = 'CF1|g:999@90,-60|s:424242@560,170|p:134#3';
const ARC3_REMNANT_STAR_KEY = 'CF1|g:999@90,-60|s:449521432@734.58,-10.77';
const sameToolValue = (left, right) => canonicalToolJson(left) === canonicalToolJson(right);
const adjustedToolCountRows = (rows, deltas, { numeric = false } = {}) => {
  if (!Array.isArray(rows)) return null;
  const result = rows.map((row) => Array.isArray(row) && row.length === 2
    ? [row[0], row[1]] : null);
  if (result.some((row) => row === null)) return null;
  const seen = new Set();
  for (const row of result) {
    const [id, count] = row;
    if ((numeric ? !Number.isSafeInteger(id) || id < 0 : typeof id !== 'string' || id.length === 0)
      || !Number.isSafeInteger(count) || count < 0 || seen.has(id)) return null;
    seen.add(id);
  }
  for (const [id, delta] of deltas) {
    const index = result.findIndex((row) => row[0] === id);
    const prior = index < 0 ? 0 : result[index][1];
    const next = prior + delta;
    if (!Number.isSafeInteger(next) || next < 0) return null;
    if (index < 0) result.push([id, next]);
    else result[index][1] = next;
  }
  if (numeric) result.sort((left, right) => left[0] - right[0]);
  return result;
};
const adjustedToolProgress = (progress, deltas) => {
  if (!isToolRecord(progress)) return null;
  const result = structuredClone(progress);
  for (const [id, delta] of Object.entries(deltas)) {
    const prior = result[id] ?? 0;
    const next = prior + delta;
    if (!Number.isSafeInteger(prior) || prior < 0 || !Number.isSafeInteger(next) || next < 0) return null;
    result[id] = next;
  }
  return result;
};
const applyToolStampedRewrite = (expected, before, afterStamp) => {
  if (Object.prototype.hasOwnProperty.call(before, 'conq')) {
    if (!Array.isArray(before.conq)) return false;
    expected.conq = before.conq.map((entry) => {
      if (!Array.isArray(entry) || entry.length !== 2 || !isToolRecord(entry[1])
        || !Number.isFinite(entry[1].t)) return null;
      return [structuredClone(entry[0]), {
        ...structuredClone(entry[1]),
        t: Math.min(Math.max(entry[1].t, afterStamp - 3_600_000), afterStamp),
      }];
    });
    if (expected.conq.some((entry) => entry === null)) return false;
  }
  if (Object.prototype.hasOwnProperty.call(before, 'minedw')) {
    if (!Array.isArray(before.minedw)) return false;
    const floor = Math.max(0, afterStamp - 30 * 600_000);
    expected.minedw = before.minedw.map((entry) => (
      Array.isArray(entry) && entry.length === 2 && Number.isSafeInteger(entry[0])
        && Number.isFinite(entry[1])
        ? [entry[0], Math.min(Math.max(entry[1], floor), afterStamp)] : null
    ));
    if (expected.minedw.some((entry) => entry === null)) return false;
  }
  return true;
};
const exactToolActionLegacy = (before, after, operation) => {
  if (!isToolRecord(before) || !isToolRecord(after)
    || !Number.isSafeInteger(before.at) || !Number.isSafeInteger(after.at)
    || after.at < before.at) return false;
  const expected = structuredClone(before);
  expected.at = after.at;
  if (!applyToolStampedRewrite(expected, before, after.at)) return false;
  if (operation === 'mine-world') {
    expected.cargo = adjustedToolCountRows(before.cargo, [['Ca', 2], ['Cl', 3]]);
    expected.mx = adjustedToolCountRows(before.mx, [[134, 1]], { numeric: true });
    expected.minedw = adjustedToolCountRows(expected.minedw, [[134, after.at]], { numeric: true });
    expected.mines = before.mines + 1;
    expected.ascp = adjustedToolProgress(before.ascp, { 'c1-mine': 1, 'c3-mine': 1 });
  } else if (operation === 'skim-star') {
    expected.cargo = adjustedToolCountRows(before.cargo, [['Crn', 2]]);
    expected.skx = adjustedToolCountRows(before.skx, [[449521432, 1]], { numeric: true });
    expected.hp = before.hp - 3;
    expected.skims = before.skims + 1;
    expected.cosmics = before.cosmics + 1;
  } else if (operation === 'purchase-research') {
    expected.cargo = adjustedToolCountRows(before.cargo, [['Fe', -6], ['Si', -4]]);
    expected.essence = before.essence - 20;
    expected.tech = ENGINEERING_RESEARCH_IDS.filter((id) => (
      before.tech.includes(id) || id === 'scan1'
    ));
  } else if (operation === 'fabricate-fixed') {
    expected.cargo = adjustedToolCountRows(before.cargo, [['Fe', -4]]);
    expected.items = adjustedToolCountRows(before.items, [['plate', 1]]);
    expected.crafts = before.crafts + 1;
    expected.ascp = adjustedToolProgress(before.ascp, { 'c1-part': 1 });
  } else return false;
  return sameToolValue(expected, after);
};
const exactToolActionArc3 = (before, after, operation) => {
  if (!isToolRecord(before) || !isToolRecord(after)
    || !Number.isSafeInteger(before.revision) || after.revision !== before.revision + 1) return false;
  const expected = structuredClone(before);
  expected.revision = after.revision;
  if (operation === 'mine-world') {
    const target = after.worlds?.find((row) => row?.key === ARC3_MARS_WORLD_KEY);
    if (target === undefined || before.worlds?.some((row) => row?.key === ARC3_MARS_WORLD_KEY)) return false;
    expected.worlds = [...before.worlds, structuredClone(target)]
      .sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0);
  } else if (operation === 'skim-star') {
    const target = after.stars?.find((row) => row?.key === ARC3_REMNANT_STAR_KEY);
    if (target === undefined || before.stars?.some((row) => row?.key === ARC3_REMNANT_STAR_KEY)) return false;
    expected.stars = [...before.stars, structuredClone(target)]
      .sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0);
  } else if (operation === 'purchase-research') {
    if (!Array.isArray(before.research) || before.research.includes('scan1')) return false;
    expected.research = ENGINEERING_RESEARCH_IDS.filter((id) => (
      before.research.includes(id) || id === 'scan1'
    ));
  }
  return sameToolValue(expected, after);
};
const adjustedToolStackables = (rows, baseId, delta) => {
  if (!Array.isArray(rows)) return null;
  const result = rows.map((row) => isToolRecord(row)
    && exactToolKeys(row, ['baseId', 'count']) && typeof row.baseId === 'string'
    && Number.isSafeInteger(row.count) && row.count >= 0
    ? { baseId: row.baseId, count: row.count } : null);
  if (result.some((row) => row === null)
    || new Set(result.map((row) => row.baseId)).size !== result.length) return null;
  const index = result.findIndex((row) => row.baseId === baseId);
  const prior = index < 0 ? 0 : result[index].count;
  const next = prior + delta;
  if (!Number.isSafeInteger(next) || next < 0) return null;
  if (index < 0) result.push({ baseId, count: next });
  else result[index].count = next;
  return result;
};
const exactToolActionArc2 = (before, after, operation) => {
  if (operation !== 'fabricate-fixed') return sameToolValue(before, after);
  if (!isToolRecord(before) || !isToolRecord(after) || before.kind !== 'inventory'
    || !isToolRecord(before.inventory) || !Number.isSafeInteger(before.inventory.revision)) return false;
  const expected = structuredClone(before);
  expected.inventory.revision = before.inventory.revision + 1;
  expected.stackableCounts = adjustedToolStackables(before.stackableCounts, 'plate', 1);
  return expected.stackableCounts !== null && sameToolValue(expected, after);
};
const omittedToolRecord = (value, omitted) => Object.fromEntries(
  Object.entries(value ?? {}).filter(([key]) => !omitted.includes(key)),
);
export const arc3ActionUnrelatedEvidencePreserved = (before, after, operation) => {
  const owned = ARC3_ACTION_OWNED_DATA_FIELDS[operation];
  if (owned === undefined || !v5ToolRowsComplete(before) || !v5ToolRowsComplete(after)
    || !exactJsonPair(before?.legacyRaw, before?.legacy)
    || !exactJsonPair(after?.legacyRaw, after?.legacy)) return false;
  const ownedPlayer = owned.player;
  const ownedInventory = owned.inventory;
  const codecPlayer = ['conq'];
  const codecInventory = ['minedw'];
  const ownedLegacy = [...ownedPlayer, ...ownedInventory, ...codecPlayer, ...codecInventory];
  if (canonicalToolJson(omittedToolRecord(before.legacy, ownedLegacy))
    !== canonicalToolJson(omittedToolRecord(after.legacy, ownedLegacy))) return false;
  for (const { segment, row } of V5_TOOL_SEGMENT_EVIDENCE) {
    const omittedData = segment === 'player' ? [...ownedPlayer, ...codecPlayer]
      : segment === 'inventory' ? [...ownedInventory, ...codecInventory] : [];
    if (canonicalToolJson(omittedToolRecord(before[row].data, omittedData))
      !== canonicalToolJson(omittedToolRecord(after[row].data, omittedData))) return false;
    const omittedExtensions = segment === 'player'
      ? ['f4.authority', 'arc3.engineering']
      : segment === 'inventory' && operation === 'fabricate-fixed' ? ['arc2.loot'] : [];
    if (canonicalToolJson(omittedToolRecord(before[row].extensions, omittedExtensions))
      !== canonicalToolJson(omittedToolRecord(after[row].extensions, omittedExtensions))) return false;
  }
  const sameActionCarriers = sameToolValue(before.arc3, after.arc3)
    && sameToolValue(before.arc2, after.arc2);
  if (sameActionCarriers) {
    const withoutAt = (value) => omittedToolRecord(value, ['at']);
    return sameToolValue(withoutAt(before.legacy), withoutAt(after.legacy))
      && Number.isSafeInteger(before.legacy.at) && Number.isSafeInteger(after.legacy.at)
      && after.legacy.at >= before.legacy.at;
  }
  return exactToolActionLegacy(before.legacy, after.legacy, operation)
    && exactToolActionArc3(before.arc3, after.arc3, operation)
    && exactToolActionArc2(before.arc2, after.arc2, operation);
};

const decodeMarkedCf1Payload = (code) => {
  if (typeof code !== 'string') return null;
  const marker = code.indexOf('CF1-');
  if (marker < 0) return null;
  try {
    const parsed = JSON.parse(Buffer.from(code.slice(marker + 4), 'base64url').toString('utf8'));
    return isToolRecord(parsed) ? parsed : null;
  } catch { return null; }
};

const ENGINEERING_POST_LIFECYCLE_SOURCE_ORACLE = Object.freeze({
  galaxyKey: 'CF1|g:999@90,-60',
  starKey: 'CF1|g:999@90,-60|s:380168149@347.25,24.8',
  reach: 880.0000000000001,
});
const exactRenderedReceipt = (receipt, {
  mode, ecologyEpoch, galaxyKey, starKey, worldKey,
}) => (
  isToolRecord(receipt) && Number.isInteger(receipt.serial) && receipt.serial > 0
  && Object.keys(receipt).sort().join(',')
    === 'ecologyEpoch,galaxyKey,mode,serial,starKey,worldKey'
  && Number.isSafeInteger(ecologyEpoch) && ecologyEpoch >= 0
  && receipt.mode === mode && receipt.ecologyEpoch === ecologyEpoch
  && receipt.galaxyKey === galaxyKey
  && receipt.starKey === starKey && receipt.worldKey === worldKey
);
const exactPostLifecycleBiomeSystemSource = (route) => {
  const expected = ENGINEERING_POST_LIFECYCLE_SOURCE_ORACLE;
  return isToolRecord(route) && route.mode === 'system'
    && route.gal === 999 && route.galX === 90 && route.galY === -60 && route.galSize === 78
    && route.star === 380168149 && route.starX === 347.25 && route.starY === 24.8
    && route.planet === null && route.planetOrdinal === null
    && route.navGalaxyKey === expected.galaxyKey && route.navStarKey === expected.starKey
    && route.navWorldKey === null && route.stage === 1 && route.reach === expected.reach
    && Number.isSafeInteger(route.epoch) && route.epoch >= 0
    && route.panelOpen === null && route.cardOpen === false
    && route.shipVisual?.chassisStage === 1
    && canonicalToolJson(route.shipVisual?.installedSystemIds) === canonicalToolJson(['jumpdrive'])
    && canonicalToolJson(route.shipVisual?.hardpoints)
      === canonicalToolJson({ array: false, autoext: false, cscoop: false })
    && route.shipVisual?.provenance === 'owned-items'
    && exactRenderedReceipt(route.renderedScene, {
      mode: 'system', ecologyEpoch: route.epoch, galaxyKey: expected.galaxyKey,
      starKey: expected.starKey, worldKey: null,
    });
};

export const assessArc3RemnantRejectedSearchControl = (evidence = {}) => {
  const expected = ENGINEERING_REMNANT_ROUTE_LEGACY_TARGET;
  const kind = evidence?.kind;
  const before = evidence?.before;
  const after = evidence?.after;
  const target = evidence?.target;
  const expectedTarget = kind === 'full-precision-invalid'
    ? expected.rawStar : kind === 'rounded-charter-blocked' ? expected.canonicalStar : null;
  const invalidCoordinates = !publicCoordinate(expected.rawStar.x)
    || !publicCoordinate(expected.rawStar.y);
  const roundedDistanceFromSol = Math.hypot(
    expected.canonicalStar.x - 560,
    expected.canonicalStar.y - 170,
  );
  const decoded = decodeMarkedCf1Payload(evidence?.code);
  const decodedTarget = decoded && expectedTarget ? {
    galaxy: Array.isArray(decoded.g) ? decoded.g : null,
    star: Array.isArray(decoded.s) ? decoded.s : null,
  } : null;
  const checks = Object.freeze({
    complete: !!(isToolRecord(before) && isToolRecord(after) && isToolRecord(target)),
    target: expectedTarget !== null
      && canonicalToolJson(target) === canonicalToolJson(expectedTarget),
    markedCode: typeof evidence?.code === 'string' && /^CF1-[A-Za-z0-9_-]+$/.test(evidence.code),
    decodedTarget: decoded?.t === 's'
      && canonicalToolJson(Object.keys(decoded).sort()) === canonicalToolJson(['g', 's', 't'])
      && canonicalToolJson(decodedTarget?.galaxy)
        === canonicalToolJson([90, -60, 78, 0, 0.62, 0.5, 999, 1])
      && canonicalToolJson(decodedTarget?.star)
        === canonicalToolJson([expectedTarget?.x, expectedTarget?.y, expectedTarget?.seed]),
    source: exactPostLifecycleBiomeSystemSource(before?.route),
    durableEvidence: arc3DurableEvidenceComplete(before?.raw)
      && arc3DurableEvidenceComplete(after?.raw),
    exactRoute: canonicalToolJson(after?.route) === canonicalToolJson(before?.route),
    exactDurable: canonicalToolJson(after?.raw) === canonicalToolJson(before?.raw),
    correctionFocus: after?.query === evidence?.code && after?.focused === true,
    classification: kind === 'full-precision-invalid'
      ? invalidCoordinates && before?.route?.stage === 1
        && after?.toastSerial === before?.toastSerial
      : kind === 'rounded-charter-blocked'
        ? before?.route?.stage === 1 && roundedDistanceFromSol > 300
          && after?.toastSerial === before?.toastSerial + 1
          && /owned Jump Drive covers the Neighborhood/i.test(after?.toastText ?? '')
          && /Long-Range Array/i.test(after?.toastText ?? '')
        : false,
  });
  const reasons = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([name]) => `legacy remnant Search ${name}`);
  return { ok: reasons.length === 0, checks, reasons };
};

/* A contradiction is positive only when its own local clause is positive.
   The local clause prefix catches a negator immediately before the regex subject
   ("no reward ...") while the match itself catches a negator in the gap
   ("chapter progress alone never mints ..."). Iterate all matches so a
   truthful negated sentence cannot hide a later appended overclaim. Keep
   this function self-contained: Slice and Glass serialize it into their
   generated browser expressions as well as exercising it in Node. */
export const hasUnnegatedSentenceClaim = (text, pattern) => {
  if (!(pattern instanceof RegExp)) return false;
  const flags = pattern.flags.replace(/[gy]/g, '') + 'g';
  const matcher = new RegExp(pattern.source, flags);
  const source = String(text ?? '');
  const negation = /\b(?:never|not|cannot|can\s+not|does\s+not|do\s+not|no|can't|doesn't|don't)\b/i;
  let match;
  while ((match = matcher.exec(source)) !== null) {
    const sentenceStart = Math.max(
      source.lastIndexOf('.', match.index - 1),
      source.lastIndexOf('!', match.index - 1),
      source.lastIndexOf('?', match.index - 1),
      source.lastIndexOf(';', match.index - 1),
    ) + 1;
    const prefix = source.slice(sentenceStart, match.index);
    const lowerPrefix = prefix.toLowerCase();
    let localPrefixStart = Math.max(
      prefix.lastIndexOf(',') + 1,
      prefix.lastIndexOf(':') + 1,
      prefix.lastIndexOf('—') + 1,
    );
    for (const boundary of [' and ', ' but ', ' however ']) {
      const index = lowerPrefix.lastIndexOf(boundary);
      if (index >= 0) localPrefixStart = Math.max(localPrefixStart, index + boundary.length);
    }
    /* A broad claim regex may begin in an earlier, truthfully negated clause
       and finish on the actual positive claim after a semicolon or an
       independent-clause conjunction. Scope polarity to the final claim
       clause inside the match, while leaving comma-separated subjects such
       as "No reward, cost, Charter tick ..." together. */
    const matched = match[0];
    let internalClauseStart = 0;
    const internalBoundaries = /;\s*|\b(?:but|however)\s+|\band\s+(?=(?:it|they|this|that)\b)/gi;
    let boundary;
    while ((boundary = internalBoundaries.exec(matched)) !== null) {
      internalClauseStart = boundary.index + boundary[0].length;
      if (boundary[0].length === 0) internalBoundaries.lastIndex += 1;
    }
    const localClause = internalClauseStart > 0
      ? matched.slice(internalClauseStart)
      : prefix.slice(localPrefixStart) + matched;
    if (!negation.test(localClause)) return true;
    if (match[0].length === 0) matcher.lastIndex += 1;
  }
  return false;
};

export const assessArc3RemnantSkimRoutePrecondition = (evidence = {}) => {
  const target = evidence?.target;
  const current = evidence?.current;
  const surface = evidence?.surface;
  const button = surface?.button;
  const model = surface?.model;
  const diagnostics = surface?.diagnostics;
  const engineering = diagnostics?.engineering;
  const previewStateKey = current?.shipVisual?.stateKey;
  const expected = ENGINEERING_REMNANT_ROUTE_TARGET;
  const decoded = decodeMarkedCf1Payload(target?.code);
  const sourceWitness = evidence?.sourceWitness;
  const preRoute = evidence?.preRoute;
  const neighborhoodRadius = evidence?.neighborhoodRadius;
  const checks = Object.freeze({
    complete: !!(target && typeof target === 'object'
      && current && typeof current === 'object'
      && surface && typeof surface === 'object'
      && surface.button && typeof surface.button === 'object'
      && surface.model && typeof surface.model === 'object'
      && surface.diagnostics && typeof surface.diagnostics === 'object'),
    routeSettled: evidence?.routeError === null,
    authorityReady: evidence?.authorityReady === true,
    target: target?.schema === expected.schema
      && typeof target?.code === 'string' && /^CF1-[A-Za-z0-9_-]+$/.test(target.code)
      && decoded?.t === 's'
      && canonicalToolJson(Object.keys(decoded ?? {}).sort()) === canonicalToolJson(['g', 's', 't'])
      && canonicalToolJson(decoded?.g) === canonicalToolJson([90, -60, 78, 0, 0.62, 0.5, 999, 1])
      && canonicalToolJson(decoded?.s) === canonicalToolJson([
        expected.requestedStar.x, expected.requestedStar.y, expected.requestedStar.seed,
      ])
      && canonicalToolJson(target?.galaxy) === canonicalToolJson(expected.galaxy)
      && canonicalToolJson(target?.requestedStar) === canonicalToolJson(expected.requestedStar)
      && canonicalToolJson(target?.canonicalStar) === canonicalToolJson(expected.canonicalStar)
      && target?.navStarKey === expected.navStarKey,
    sourceOracle: canonicalToolJson(sourceWitness) === canonicalToolJson(expected.sourceWitness),
    reachable: neighborhoodRadius === expected.neighborhoodRadius
      && Math.hypot(
      target?.canonicalStar?.x - 560,
      target?.canonicalStar?.y - 170,
      ) <= neighborhoodRadius,
    preRoute: exactPostLifecycleBiomeSystemSource(preRoute),
    charterOwnership: current?.stage === 1 && current?.shipVisual?.chassisStage === 1
      && canonicalToolJson(current?.shipVisual?.installedSystemIds)
        === canonicalToolJson(['jumpdrive'])
      && canonicalToolJson(current?.shipVisual?.hardpoints)
        === canonicalToolJson({ array: false, autoext: false, cscoop: false })
      && current?.shipVisual?.provenance === 'owned-items',
    current: current?.mode === 'system' && current?.gal === expected.galaxy.seed
      && current?.galX === expected.galaxy.x && current?.galY === expected.galaxy.y
      && current?.star === expected.canonicalStar.seed
      && current?.starX === expected.canonicalStar.x && current?.starY === expected.canonicalStar.y
      && current?.planet === null && current?.navStarKey === expected.navStarKey,
    renderedReceipt: exactRenderedReceipt(current?.renderedScene, {
      mode: 'system', ecologyEpoch: current?.epoch,
      galaxyKey: ENGINEERING_POST_LIFECYCLE_SOURCE_ORACLE.galaxyKey,
      starKey: expected.navStarKey, worldKey: null,
    }) && Number.isInteger(preRoute?.renderedScene?.serial)
      && current.renderedScene.serial > preRoute.renderedScene.serial,
    opening: evidence?.opening?.opened === true && evidence?.opening?.pointer?.trusted === true
      && evidence?.opening?.pointer?.pointerType === 'mouse',
    panel: evidence?.openError === null && surface?.panelOpen === 'shipyard',
    button: button?.exists === true && button?.connected === true && button?.tag === 'BUTTON'
      && button?.operation === 'skim' && button?.id === null,
    model: model?.status === 'ready' && model?.modelEnabled === 'true'
      && model?.disabled === false && model?.ariaDisabled === 'false',
    diagnostics: typeof previewStateKey === 'string' && previewStateKey.length > 0
      && canonicalToolJson(surface?.previewStateKeys) === canonicalToolJson([previewStateKey])
      && diagnostics?.schema === 'cf-v2-shipyard-diagnostics/v1'
      && diagnostics?.status === 'open' && diagnostics?.pendingPreviewWork === 0
      && diagnostics?.stateKey === previewStateKey
      && diagnostics?.activePreviewCount === 1 && diagnostics?.retainedPreviewCount === 0
      && engineering?.schema === 'cf-v2-engineering-panel-diagnostics/v1'
      && engineering?.activeCount === 1 && engineering?.pendingWork === 0
      && engineering?.actionControlCount === ENGINEERING_ACTION_CONTROL_COUNT
      && engineering?.activePreviewCount === 1
      && engineering?.previewStateKey === previewStateKey
      && engineering?.retainedPreviewCount === 0 && engineering?.faultCount === 0,
  });
  const reasons = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([name]) => `remnant Skim route ${name}`);
  return { ok: reasons.length === 0, checks, reasons };
};

/* Pure no-optimism evidence owner shared by Slice and this module's empty/red
   harness. Every hostile shape returns false; no control constructor assumes
   that a prior browser observation was green or complete. */
export const engineeringUiSnapshotComplete = (value) => {
  if (value?.schema !== 'cf-v2-slice-engineering-ui-evidence/v1' || value.panelOpen !== 'shipyard'
    || !Array.isArray(value.renderedFacts?.research) || !Array.isArray(value.renderedFacts?.recipes)
    || !Array.isArray(value.renderedFacts?.opportunities) || !Array.isArray(value.actionAvailability)
    || value.renderedFacts.opportunities.length !== 2
    || value.actionAvailability.length !== ENGINEERING_ACTION_CONTROL_COUNT
    || value.inventoryState?.stateKind !== 'inventory' || !Number.isSafeInteger(value.inventoryState.revision)
    || value.inventoryController?.schema !== 'cf-v2-inventory-sheet-diagnostics/v1') return false;
  return canonicalToolJson(value.renderedFacts.research.map((row) => row?.id))
      === canonicalToolJson(ENGINEERING_RESEARCH_IDS)
    && canonicalToolJson(value.renderedFacts.recipes.map((row) => row?.id))
      === canonicalToolJson(ENGINEERING_RECIPE_IDS)
    && canonicalToolJson(value.actionAvailability.map((row) => `${row?.operation}:${row?.id ?? ''}`))
      === canonicalToolJson(ENGINEERING_ACTION_KEYS);
};

const engineeringRenderedActionModels = (value) => {
  const facts = value?.renderedFacts;
  if (!Array.isArray(facts?.opportunities) || !Array.isArray(facts?.research)
    || !Array.isArray(facts?.recipes)) return null;
  return [...facts.opportunities, ...facts.research, ...facts.recipes].map((row) => ({
    id: row?.id, action: row?.action ?? null,
  }));
};
const engineeringRenderedFactsWithoutActions = (value) => {
  const facts = value?.renderedFacts;
  if (!facts || typeof facts !== 'object') return null;
  const withoutAction = (rows) => Array.isArray(rows) ? rows.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const { action: _action, ...rest } = row;
    return rest;
  }) : null;
  return {
    opportunities: withoutAction(facts.opportunities),
    research: withoutAction(facts.research),
    recipes: withoutAction(facts.recipes),
  };
};

export const assessEngineeringNoOptimismUi = ({ before, during, pending } = {}) => {
  const beforeActions = Array.isArray(before?.actionAvailability) ? before.actionAvailability : null;
  const duringActions = Array.isArray(during?.actionAvailability) ? during.actionAvailability : null;
  const beforeHonest = beforeActions !== null && beforeActions.every((row) => (
    row?.disabled === (row?.modelEnabled !== 'true') && row?.ariaDisabled === String(row.disabled)
  ));
  const duringAvailability = pending === true
    ? during?.pendingVisible === true && during?.ariaBusy === 'true' && duringActions !== null
      && duringActions.every((row) => row?.disabled === true && row?.ariaDisabled === 'true')
    : pending === false && during?.pendingVisible === false && during?.ariaBusy === 'false'
      && canonicalToolJson(duringActions) === canonicalToolJson(beforeActions);
  const checks = Object.freeze({
    complete: engineeringUiSnapshotComplete(before) && engineeringUiSnapshotComplete(during),
    beforeIdle: before?.pendingVisible === false && before?.ariaBusy === 'false',
    beforeAvailabilityHonest: beforeHonest === true,
    renderedFacts: canonicalToolJson(engineeringRenderedFactsWithoutActions(during))
      === canonicalToolJson(engineeringRenderedFactsWithoutActions(before)),
    renderedActionModels: canonicalToolJson(engineeringRenderedActionModels(during))
      === canonicalToolJson(engineeringRenderedActionModels(before)),
    inventoryState: canonicalToolJson(during?.inventoryState) === canonicalToolJson(before?.inventoryState),
    inventoryController: canonicalToolJson(during?.inventoryController)
      === canonicalToolJson(before?.inventoryController),
    pendingAvailability: duringAvailability === true,
  });
  const ok = Object.values(checks).every((value) => value === true);
  return {
    ok, checks,
    reasons: ok ? [] : ['rendered Engineering/Arc 2 read model stayed non-optimistic'],
  };
};

const arc3StorageCarrierProjection = (value) => {
  if (!value || typeof value !== 'object') return null;
  const {
    revision: _revision,
    revisionRaw: _revisionRaw,
    receiptKeys: _receiptKeys,
    receiptRawRows: _receiptRawRows,
    receiptRows: _receiptRows,
    ...carrier
  } = value;
  return carrier;
};
const storageReceiptProjection = (evidence) => ({
  keys: evidence?.receiptKeys,
  rawRows: evidence?.receiptRawRows,
  rows: evidence?.receiptRows,
});

/* Browser-independent verdict for the production storage-error path. Keep
   every terminal clause named so a retained red identifies the swallowed,
   optimistic, or retained owner surface rather than collapsing to one boolean. */
export const assessArc3StorageRefusal = ({
  before, after, beforeState, afterState, beforeUi, afterUi, afterDiagnostics,
  afterPreviewStateKeys, armed, interaction, waitError = null, captureErrors = [],
} = {}) => {
  const coordinatorBefore = beforeState?.engineering?.actionCoordinator;
  const coordinator = afterState?.engineering?.actionCoordinator;
  const fault = coordinator?.lastFault;
  const owner = coordinator?.owner;
  const click = interaction?.clicks?.[0], key = interaction?.keys?.[0];
  const previewStateKey = afterState?.shipVisual?.stateKey;
  const ui = assessEngineeringNoOptimismUi({ before: beforeUi, during: afterUi, pending: false });
  const checks = Object.freeze({
    captured: Array.isArray(captureErrors) && captureErrors.length === 0
      && !!after && !!afterState && !!afterUi && !!afterDiagnostics
      && Array.isArray(afterPreviewStateKeys) && !!interaction,
    waitSettled: waitError === null,
    armedCleared: armed === true && coordinator?.faultArmed?.storageFailure === false,
    durableEvidenceComplete: arc3DurableEvidenceComplete(before)
      && arc3DurableEvidenceComplete(after),
    carrierStable: canonicalToolJson(arc3StorageCarrierProjection(after))
      === canonicalToolJson(arc3StorageCarrierProjection(before)),
    revisionStable: after?.revision === before?.revision
      && after?.revisionRaw === before?.revisionRaw
      && afterState?.engineering?.revision === beforeState?.engineering?.revision,
    receiptsStable: canonicalToolJson(storageReceiptProjection(after))
      === canonicalToolJson(storageReceiptProjection(before)),
    liveSaveStable: canonicalToolJson(afterState?.save) === canonicalToolJson(beforeState?.save),
    outcome: afterState?.engineering?.lastOutcome === 'fabricate-fixed-storage-error',
    ownerReleased: coordinator?.inFlight === false
      && owner?.schema === 'cf-v2-product-action-coordinator-diagnostics/v1'
      && owner?.busy === false && owner?.operation === null,
    holdStable: coordinator?.hold?.schema === 'cf-v2-product-action-hold-diagnostics/v1'
      && canonicalToolJson(coordinator?.hold) === canonicalToolJson(coordinatorBefore?.hold),
    faultIdentity: fault?.schema === 'cf-v2-arc3-action-fault-witness/v1'
      && fault?.operation === 'arc3.fabricate-fixed',
    faultInjection: fault?.injection === 'storage-failure',
    faultSettlement: fault?.phase === 'settled' && fault?.beforeRevision === before?.revision
      && fault?.injectedRevision === null,
    faultOutcome: fault?.outcome === 'storage-error',
    diagnosticsSettled: typeof previewStateKey === 'string' && previewStateKey.length > 0
      && canonicalToolJson(afterPreviewStateKeys) === canonicalToolJson([previewStateKey])
      && afterDiagnostics?.schema === 'cf-v2-shipyard-diagnostics/v1'
      && afterDiagnostics?.status === 'open'
      && afterDiagnostics?.pendingPreviewWork === 0
      && afterDiagnostics?.stateKey === previewStateKey
      && afterDiagnostics?.activePreviewCount === 1
      && afterDiagnostics?.retainedPreviewCount === 0
      && afterDiagnostics?.engineering?.schema === 'cf-v2-engineering-panel-diagnostics/v1'
      && afterDiagnostics?.engineering?.activeCount === 1
      && afterDiagnostics?.engineering?.pendingWork === 0
      && afterDiagnostics?.engineering?.actionControlCount === ENGINEERING_ACTION_CONTROL_COUNT
      && afterDiagnostics?.engineering?.activePreviewCount === 1
      && afterDiagnostics?.engineering?.previewStateKey === previewStateKey
      && afterDiagnostics?.engineering?.retainedPreviewCount === 0
      && afterDiagnostics?.engineering?.faultCount === 0,
    interaction: interaction?.modality === 'keyboard' && interaction?.uiOperation === 'fabricate'
      && interaction?.clicks?.length === 1 && interaction?.keys?.length === 1,
    trustedClick: click?.trusted === true && click?.operation === 'fabricate' && click?.id === 'plate',
    trustedKey: key?.trusted === true && key?.operation === 'fabricate' && key?.id === 'plate'
      && key?.key === 'Enter' && key?.code === 'Enter',
    pointerFree: interaction?.pointer?.length === 0,
    ui: ui.ok,
  });
  const reasons = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([name]) => `storage refusal ${name}`);
  return { ok: reasons.length === 0, reasons, checks, ui };
};

const cloneEvidence = (value) => {
  try { return structuredClone(value); } catch { return null; }
};
export const withEngineeringUiOpportunityStatus = (value, id, status) => {
  const copy = cloneEvidence(value);
  const rows = Array.isArray(copy?.renderedFacts?.opportunities) ? copy.renderedFacts.opportunities : [];
  const row = rows.find((candidate) => candidate?.id === id);
  if (row && typeof row === 'object') {
    row.status = status;
    row.statusText = 'Worked out · Premature rendered mutation control.';
  }
  return copy;
};
export const withEngineeringUiRecipeOwned = (value, id) => {
  const copy = cloneEvidence(value);
  const rows = Array.isArray(copy?.renderedFacts?.recipes) ? copy.renderedFacts.recipes : [];
  const row = rows.find((candidate) => candidate?.id === id);
  if (row?.output && typeof row.output === 'object') {
    const prior = Number(row.output.owned);
    row.output.owned = Number.isFinite(prior) ? String(prior + 1) : 'control-owned';
    if (typeof row.output.text === 'string') {
      row.output.text = row.output.text.replace(/Owned: \d+/, `Owned: ${row.output.owned}`);
    }
  }
  return copy;
};
export const withEngineeringUiInventoryRevision = (value) => {
  const copy = cloneEvidence(value);
  if (copy?.inventoryState && typeof copy.inventoryState === 'object') {
    copy.inventoryState.revision = Number.isSafeInteger(copy.inventoryState.revision)
      ? copy.inventoryState.revision + 1 : 'control-revision';
  }
  return copy;
};
export const withEngineeringUiActionModel = (value) => {
  const copy = cloneEvidence(value);
  const rows = Array.isArray(copy?.renderedFacts?.opportunities)
    ? copy.renderedFacts.opportunities : [];
  if (rows[0]?.action && typeof rows[0].action === 'object') {
    rows[0].action.modelEnabled = rows[0].action.modelEnabled === 'true' ? 'false' : 'true';
  }
  return copy;
};
export const withEngineeringUiInventoryController = (value) => {
  const copy = cloneEvidence(value);
  if (copy?.inventoryController && typeof copy.inventoryController === 'object') {
    copy.inventoryController.pendingWork = Number.isSafeInteger(copy.inventoryController.pendingWork)
      ? copy.inventoryController.pendingWork + 1 : 'control-pending';
  }
  return copy;
};

/* Run the no-optimism classifier outside a browser at import time. Besides
   proving the green path, this makes incomplete/red observations exercise
   every control constructor in sequence: one malformed snapshot must report
   red without preventing the remaining controls from running. */
const engineeringUiSelftestBefore = {
  schema: 'cf-v2-slice-engineering-ui-evidence/v1',
  panelOpen: 'shipyard',
  renderedFacts: {
    opportunities: ['mining', 'skimming'].map((id) => ({
      id, status: 'available', statusText: 'Available',
      action: { operation: id === 'mining' ? 'mine' : 'skim', id: null, modelEnabled: 'false' },
    })),
    research: ENGINEERING_RESEARCH_IDS.map((id) => ({
      id, status: 'unavailable', statusText: 'Unavailable',
      action: { operation: 'research', id, modelEnabled: 'false' },
    })),
    recipes: ENGINEERING_RECIPE_IDS.map((id) => ({
      id, status: 'unavailable', output: { owned: '0', text: 'Owned: 0' },
      action: { operation: 'fabricate', id, modelEnabled: 'false' },
    })),
  },
  actionAvailability: ENGINEERING_ACTION_KEYS.map((key) => {
    const split = key.indexOf(':');
    return {
      operation: key.slice(0, split), id: key.slice(split + 1) || null,
      modelEnabled: 'false', disabled: true, ariaDisabled: 'true',
    };
  }),
  pendingVisible: false,
  ariaBusy: 'false',
  inventoryState: { stateKind: 'inventory', revision: 7 },
  inventoryController: { schema: 'cf-v2-inventory-sheet-diagnostics/v1', pendingWork: 0 },
};
const engineeringUiSelftestIdle = structuredClone(engineeringUiSelftestBefore);
const engineeringUiSelftestPending = structuredClone(engineeringUiSelftestBefore);
engineeringUiSelftestPending.pendingVisible = true;
engineeringUiSelftestPending.ariaBusy = 'true';
const engineeringUiSelftestCases = [
  assessEngineeringNoOptimismUi({
    before: engineeringUiSelftestBefore, during: engineeringUiSelftestIdle, pending: false,
  }),
  assessEngineeringNoOptimismUi({
    before: engineeringUiSelftestBefore, during: engineeringUiSelftestPending, pending: true,
  }),
];
const engineeringUiSelftestMutations = [
  ['renderedFacts', withEngineeringUiOpportunityStatus(engineeringUiSelftestPending, 'mining', 'worked-out')],
  ['renderedFacts', withEngineeringUiRecipeOwned(engineeringUiSelftestPending, 'plate')],
  ['inventoryState', withEngineeringUiInventoryRevision(engineeringUiSelftestPending)],
  ['renderedActionModels', withEngineeringUiActionModel(engineeringUiSelftestPending)],
  ['inventoryController', withEngineeringUiInventoryController(engineeringUiSelftestPending)],
].map(([check, during]) => ({
  check,
  result: assessEngineeringNoOptimismUi({
    before: engineeringUiSelftestBefore, during, pending: true,
  }),
}));
const engineeringUiHostileResults = [undefined, null, {}, {
  schema: 'cf-v2-slice-engineering-ui-evidence/v1', renderedFacts: {},
}, {
  schema: 'cf-v2-slice-engineering-ui-evidence/v1', panelOpen: 'shipyard',
  renderedFacts: { opportunities: [null], research: [null], recipes: [null] },
  actionAvailability: [null],
}].flatMap((value) => [
  withEngineeringUiOpportunityStatus(value, 'mining', 'worked-out'),
  withEngineeringUiRecipeOwned(value, 'plate'),
  withEngineeringUiInventoryRevision(value),
  withEngineeringUiActionModel(value),
  withEngineeringUiInventoryController(value),
].map((during) => assessEngineeringNoOptimismUi({ before: value, during, pending: true })));
const engineeringUiContractSelftestPasses = engineeringUiSelftestCases.every(({ ok }) => ok)
  && engineeringUiSelftestMutations.every(({ check, result }) => (
    result.ok === false && result.checks?.complete === true && result.checks?.[check] === false
      && Object.entries(result.checks).every(([name, value]) => (
        name === check ? value === false : value === true
      ))
  ))
  && engineeringUiHostileResults.length === 25
  && engineeringUiHostileResults.every(({ ok, checks }) => ok === false && checks?.complete === false);

const storageSelftestLegacy = { v: 4, at: 0, cargo: [['Fe', 20]], items: [['jumpdrive', 1]] };
const storageSelftestAuthority = {
  activePlayMs: 1200, sessionRng: { seed: 91, ordinal: 4, draws: { selftest: 1 } },
};
const storageSelftestArc3 = {
  schema: 'cf-v2-engineering-state/v2', revision: 12, worlds: [], stars: [], research: [],
};
const storageSelftestArc2 = {
  kind: 'inventory', inventory: { schema: 'gear-inventory-v1', revision: 1 }, stackableCounts: [],
};
const storageSelftestAuthorityJson = JSON.stringify(storageSelftestAuthority);
const storageSelftestEngineeringJson = JSON.stringify(storageSelftestArc3);
const storageSelftestArc2Json = JSON.stringify(storageSelftestArc2);
const storageSelftestPlayerRow = {
  schema: 5, segment: 'player', data: {
    v: storageSelftestLegacy.v, at: storageSelftestLegacy.at,
  }, extensions: {
    'f4.authority': { version: 1, json: storageSelftestAuthorityJson },
    'arc3.engineering': { version: 1, json: storageSelftestEngineeringJson },
  },
};
const storageSelftestCreaturesRow = {
  schema: 5, segment: 'creatures', data: {},
};
const storageSelftestCatalogRow = {
  schema: 5, segment: 'catalog', data: {}, extensions: {},
};
const storageSelftestInventoryRow = {
  schema: 5, segment: 'inventory', data: {
    cargo: structuredClone(storageSelftestLegacy.cargo),
    items: structuredClone(storageSelftestLegacy.items),
  }, extensions: {
    'arc2.loot': { version: 1, json: storageSelftestArc2Json },
  },
};
const storageSelftestSettingsRow = {
  schema: 5, segment: 'settings', data: {},
};
const storageSelftestReceipt = { ordinal: 4, kind: 'prior', witness: 'prior-receipt' };
const storageSelftestRaw = {
  revisionRaw: '12', revision: 12,
  legacyRaw: JSON.stringify(storageSelftestLegacy), legacy: storageSelftestLegacy,
  playerRaw: JSON.stringify(storageSelftestPlayerRow), playerRow: storageSelftestPlayerRow,
  creaturesRaw: JSON.stringify(storageSelftestCreaturesRow), creaturesRow: storageSelftestCreaturesRow,
  catalogRaw: JSON.stringify(storageSelftestCatalogRow), catalogRow: storageSelftestCatalogRow,
  inventoryRaw: JSON.stringify(storageSelftestInventoryRow), inventoryRow: storageSelftestInventoryRow,
  settingsRaw: JSON.stringify(storageSelftestSettingsRow), settingsRow: storageSelftestSettingsRow,
  authorityVersion: 1, authorityJson: storageSelftestAuthorityJson, authority: storageSelftestAuthority,
  engineeringVersion: 1, engineeringJson: storageSelftestEngineeringJson, arc3: storageSelftestArc3,
  arc2Version: 1, arc2Json: storageSelftestArc2Json, arc2: storageSelftestArc2,
  receiptKeys: ['receipt:4'], receiptRawRows: [JSON.stringify(storageSelftestReceipt)],
  receiptRows: [storageSelftestReceipt],
};
const mutateF4SelftestAuthority = (mutate) => {
  const copy = structuredClone(storageSelftestRaw);
  mutate(copy.authority);
  copy.authorityJson = JSON.stringify(copy.authority);
  copy.playerRow.extensions['f4.authority'].json = copy.authorityJson;
  copy.playerRaw = JSON.stringify(copy.playerRow);
  return copy;
};
const f4ToolAuthoritySelftestControls = [
  mutateF4SelftestAuthority((authority) => { authority.auditDrift = true; }),
  mutateF4SelftestAuthority((authority) => { authority.sessionRng.auditDrift = true; }),
  mutateF4SelftestAuthority((authority) => { authority.sessionRng.draws['bad\u0001domain'] = 1; }),
  mutateF4SelftestAuthority((authority) => { authority.activePlayMs = 10_000_000_000_001; }),
  mutateF4SelftestAuthority((authority) => { authority.sessionRng.seed = 0x1_0000_0000; }),
  mutateF4SelftestAuthority((authority) => { authority.sessionRng.ordinal = 0x1_0000_0000; }),
  mutateF4SelftestAuthority((authority) => {
    authority.sessionRng.draws.selftest = 0x1_0000_0000;
  }),
];
const f4ToolAuthoritySelftestPasses = arc3DurableEvidenceComplete(storageSelftestRaw)
  && f4ToolAuthoritySelftestControls.every((evidence) => (
    v5ToolRowsComplete(evidence) && !arc3DurableEvidenceComplete(evidence)
  ));
const mutateV5SelftestRow = (evidence, segment, mutate) => {
  const descriptor = V5_TOOL_SEGMENT_EVIDENCE.find((entry) => entry.segment === segment);
  const copy = structuredClone(evidence);
  mutate(copy[descriptor.row]);
  copy[descriptor.raw] = JSON.stringify(copy[descriptor.row]);
  return copy;
};
const addV5SelftestCarrier = (evidence, segment, namespace, carrier) => mutateV5SelftestRow(
  evidence, segment, (row) => {
    row.extensions = { ...(isToolRecord(row.extensions) ? row.extensions : {}), [namespace]: carrier };
  },
);
const addV5SelftestCarriers = (evidence, count, jsonForIndex = () => '{}') => {
  let copy = structuredClone(evidence);
  for (const { segment } of V5_TOOL_SEGMENT_EVIDENCE) {
    for (let index = 0; index < count; index++) {
      copy = addV5SelftestCarrier(copy, segment, `audit.${segment}.${index}`, {
        version: 1, json: jsonForIndex(index),
      });
    }
  }
  return copy;
};
const storageSelftestSplitOnlyAt = mutateV5SelftestRow(
  storageSelftestRaw, 'player', (row) => { row.data.at = 1; },
);
const storageSelftestLegacyOnlyAt = (() => {
  const copy = structuredClone(storageSelftestRaw);
  copy.legacy.at = 1;
  copy.legacyRaw = JSON.stringify(copy.legacy);
  return copy;
})();
const storageSelftestDuplicatePlayerKey = (() => {
  const copy = structuredClone(storageSelftestRaw);
  copy.playerRaw = copy.playerRaw.replace(
    '"data":{"v":4,"at":0}', '"data":{"v":4,"v":4,"at":0}',
  );
  return copy;
})();
const v5RowSelftestMutations = [
  ['playerRow', storageSelftestDuplicatePlayerKey],
  ['legacyMirror', storageSelftestSplitOnlyAt],
  ['legacyMirror', storageSelftestLegacyOnlyAt],
  ['playerRow', mutateV5SelftestRow(storageSelftestRaw, 'player', (row) => { row.extra = true; })],
  ['catalogRow', mutateV5SelftestRow(storageSelftestRaw, 'catalog', (row) => { row.data.essence = 1; })],
  ['creaturesRow', mutateV5SelftestRow(storageSelftestRaw, 'creatures', (row) => { row.data.me = 'foreign'; })],
  ['settingsRow', mutateV5SelftestRow(storageSelftestRaw, 'settings', (row) => { row.extensions = []; })],
  ['catalogRow', addV5SelftestCarrier(storageSelftestRaw, 'catalog', 'Audit.drift', { version: 1, json: '{}' })],
  ['inventoryRow', addV5SelftestCarrier(storageSelftestRaw, 'inventory', 'audit.drift', {
    version: 1, json: '{}', extra: true,
  })],
  ['playerRow', addV5SelftestCarrier(storageSelftestRaw, 'player', 'audit.drift', { version: 0, json: '{}' })],
  ['playerRow', addV5SelftestCarrier(storageSelftestRaw, 'player', 'audit.drift', { version: 1, json: 'not-json' })],
  ['playerRow', addV5SelftestCarrier(storageSelftestRaw, 'player', 'audit.drift', { version: 1, json: '[]' })],
  ['playerRow', addV5SelftestCarrier(storageSelftestRaw, 'player', 'audit.drift', {
    version: 1, json: JSON.stringify({ value: 'a'.repeat(V5_TOOL_EXTENSION_LIMITS.jsonBytes) }),
  })],
  ['playerRow', addV5SelftestCarrier(storageSelftestRaw, 'player', 'audit.drift', {
    version: 1, json: JSON.stringify({ value: 'é'.repeat(131_070) }),
  })],
  ['playerRow', (() => {
    let copy = structuredClone(storageSelftestRaw);
    for (let index = 0; index < 63; index++) {
      copy = addV5SelftestCarrier(copy, 'player', `audit.player.${index}`, { version: 1, json: '{}' });
    }
    return copy;
  })()],
  ['extensionAggregate', addV5SelftestCarriers(storageSelftestRaw, 26)],
  ['extensionAggregate', addV5SelftestCarriers(
    storageSelftestRaw, 1, () => JSON.stringify({ value: 'a'.repeat(210_000) }),
  )],
];
const v5RowContractSelftestPasses = assessV5ToolRows(storageSelftestRaw).ok
  && v5RowSelftestMutations.every(([expected, evidence]) => {
    const assessment = assessV5ToolRows(evidence);
    return assessment.ok === false && assessment.checks?.[expected] === false
      && Object.entries(assessment.checks ?? {}).every(([name, value]) => (
        name === expected ? value === false : value === true
      ));
  });
const storageSelftestTrainingAbsent = (() => {
  const copy = structuredClone(storageSelftestRaw);
  delete copy.playerRow.extensions['arc3.engineering'];
  copy.playerRaw = JSON.stringify(copy.playerRow);
  copy.engineeringVersion = null;
  copy.engineeringJson = null;
  copy.arc3 = null;
  return copy;
})();
const storageSelftestTrainingPresentControl = structuredClone(storageSelftestRaw);
delete storageSelftestTrainingPresentControl.engineeringJson;
const storageSelftestTrainingAbsentControl = structuredClone(storageSelftestTrainingAbsent);
storageSelftestTrainingAbsentControl.playerRow.extensions['arc3.engineering'] = {
  version: 1, json: storageSelftestEngineeringJson,
};
storageSelftestTrainingAbsentControl.playerRaw = JSON.stringify(
  storageSelftestTrainingAbsentControl.playerRow,
);
const storageSelftestTrainingAbsentLegacyOnlyAt = (() => {
  const copy = structuredClone(storageSelftestTrainingAbsent);
  copy.legacy.at = 1;
  copy.legacyRaw = JSON.stringify(copy.legacy);
  return copy;
})();
const trainingEvidenceModeSelftestPasses = arc3TrainingDurableEvidenceComplete(storageSelftestRaw)
  && arc3TrainingEvidenceMode(storageSelftestRaw) === 'carrier-present'
  && arc3TrainingDurableEvidenceComplete(storageSelftestTrainingAbsent)
  && arc3TrainingEvidenceMode(storageSelftestTrainingAbsent) === 'protected-absent'
  && !arc3TrainingDurableEvidenceComplete(storageSelftestTrainingPresentControl)
  && !arc3TrainingDurableEvidenceComplete(storageSelftestTrainingAbsentControl)
  && !arc3TrainingDurableEvidenceComplete(storageSelftestSplitOnlyAt)
  && !arc3TrainingDurableEvidenceComplete(storageSelftestTrainingAbsentLegacyOnlyAt);
const arc3ActionOwnedAtSelftest = mutateV5SelftestRow(
  { ...structuredClone(storageSelftestRaw),
    legacy: { ...storageSelftestRaw.legacy, at: 1 },
    legacyRaw: JSON.stringify({ ...storageSelftestRaw.legacy, at: 1 }) },
  'player', (row) => { row.data.at = 1; },
);
const arc3ActionUnrelatedExtensionSelftests = ['player', 'catalog', 'inventory'].map((segment) => (
  addV5SelftestCarrier(storageSelftestRaw, segment, 'audit.drift', {
    version: 1, json: '{"schema":"audit-drift/v1"}',
  })
));
const arc3ActionUnrelatedDataSelftest = mutateV5SelftestRow(
  { ...structuredClone(storageSelftestRaw),
    legacy: { ...storageSelftestRaw.legacy, me: 'synchronized-drift' },
    legacyRaw: JSON.stringify({ ...storageSelftestRaw.legacy, me: 'synchronized-drift' }) },
  'player', (row) => { row.data.me = 'synchronized-drift'; },
);
const synchronizedInventoryFieldSelftest = (field, value) => mutateV5SelftestRow(
  { ...structuredClone(storageSelftestRaw),
    legacy: { ...storageSelftestRaw.legacy, [field]: structuredClone(value) },
    legacyRaw: JSON.stringify({ ...storageSelftestRaw.legacy, [field]: value }) },
  'inventory', (row) => { row.data[field] = structuredClone(value); },
);
const arc3ActionNarrowOwnershipSelftests = Object.freeze({
  mineTech: synchronizedInventoryFieldSelftest('tech', ['scan1']),
  mineSkim: synchronizedInventoryFieldSelftest('skx', [[449521432, 1]]),
  researchMine: synchronizedInventoryFieldSelftest('mx', [[134, 1]]),
  fabricateEquip: synchronizedInventoryFieldSelftest('eq', { helmet: 'headlamp' }),
});
const exactActionLegacySelftestBefore = Object.freeze({
  at: 1_000, conq: Object.freeze([[1, Object.freeze({ t: 0, tier: 1 })]]),
  cargo: Object.freeze([Object.freeze(['Fe', 100]), Object.freeze(['Si', 100])]),
  mx: Object.freeze([]), minedw: Object.freeze([]), skx: Object.freeze([]),
  mines: 10, asc: 0, ascp: Object.freeze({}), hp: 55, skims: 2, cosmics: 1,
  essence: 100, tech: Object.freeze([]), items: Object.freeze([Object.freeze(['plate', 3])]),
  crafts: 2,
});
const exactActionStamp = 4_000_000;
const exactActionStampedBase = Object.freeze({
  ...exactActionLegacySelftestBefore, at: exactActionStamp,
  conq: Object.freeze([[1, Object.freeze({ t: 400_000, tier: 1 })]]),
});
const exactActionLegacySelftestAfter = Object.freeze({
  'mine-world': Object.freeze({
    ...exactActionStampedBase,
    cargo: Object.freeze([
      Object.freeze(['Fe', 100]), Object.freeze(['Si', 100]),
      Object.freeze(['Ca', 2]), Object.freeze(['Cl', 3]),
    ]),
    mx: Object.freeze([Object.freeze([134, 1])]),
    minedw: Object.freeze([Object.freeze([134, exactActionStamp])]),
    mines: 11, ascp: Object.freeze({ 'c1-mine': 1, 'c3-mine': 1 }),
  }),
  'skim-star': Object.freeze({
    ...exactActionStampedBase,
    cargo: Object.freeze([
      Object.freeze(['Fe', 100]), Object.freeze(['Si', 100]), Object.freeze(['Crn', 2]),
    ]),
    skx: Object.freeze([Object.freeze([449521432, 1])]),
    hp: 52, skims: 3, cosmics: 2,
  }),
  'purchase-research': Object.freeze({
    ...exactActionStampedBase,
    cargo: Object.freeze([Object.freeze(['Fe', 94]), Object.freeze(['Si', 96])]),
    essence: 80, tech: Object.freeze(['scan1']),
  }),
  'fabricate-fixed': Object.freeze({
    ...exactActionStampedBase,
    cargo: Object.freeze([Object.freeze(['Fe', 96]), Object.freeze(['Si', 100])]),
    items: Object.freeze([Object.freeze(['plate', 4])]),
    crafts: 3, ascp: Object.freeze({ 'c1-part': 1 }),
  }),
});
const exactActionArc3SelftestBefore = Object.freeze({
  schema: 'cf-v2-engineering-state/v2', revision: 0,
  worlds: Object.freeze([]), stars: Object.freeze([]), research: Object.freeze([]),
});
const exactActionArc3SelftestAfter = Object.freeze({
  'mine-world': Object.freeze({ ...exactActionArc3SelftestBefore, revision: 1,
    worlds: Object.freeze([Object.freeze({ key: ARC3_MARS_WORLD_KEY })]) }),
  'skim-star': Object.freeze({ ...exactActionArc3SelftestBefore, revision: 1,
    stars: Object.freeze([Object.freeze({ key: ARC3_REMNANT_STAR_KEY })]) }),
  'purchase-research': Object.freeze({ ...exactActionArc3SelftestBefore, revision: 1,
    research: Object.freeze(['scan1']) }),
  'fabricate-fixed': Object.freeze({ ...exactActionArc3SelftestBefore, revision: 1 }),
});
const exactActionArc2SelftestBefore = Object.freeze({
  kind: 'inventory', inventory: Object.freeze({ revision: 0, retained: true }),
  stackableCounts: Object.freeze([
    Object.freeze({ baseId: 'plate', count: 3 }), Object.freeze({ baseId: 'wire', count: 2 }),
  ]),
});
const exactActionArc2SelftestAfter = Object.freeze({
  ...exactActionArc2SelftestBefore, inventory: Object.freeze({ revision: 1, retained: true }),
  stackableCounts: Object.freeze([
    Object.freeze({ baseId: 'plate', count: 4 }), Object.freeze({ baseId: 'wire', count: 2 }),
  ]),
});
const exactToolActionTransformSelftestPasses = Object.keys(ARC3_ACTION_OWNED_DATA_FIELDS)
  .every((operation) => exactToolActionLegacy(
    exactActionLegacySelftestBefore, exactActionLegacySelftestAfter[operation], operation,
  ) && exactToolActionArc3(
    exactActionArc3SelftestBefore, exactActionArc3SelftestAfter[operation], operation,
  ) && exactToolActionArc2(
    exactActionArc2SelftestBefore,
    operation === 'fabricate-fixed' ? exactActionArc2SelftestAfter : exactActionArc2SelftestBefore,
    operation,
  ))
  && !exactToolActionLegacy(exactActionLegacySelftestBefore, {
    ...exactActionLegacySelftestAfter['fabricate-fixed'], essence: 99,
  }, 'fabricate-fixed')
  && !exactToolActionLegacy(exactActionLegacySelftestBefore, {
    ...exactActionLegacySelftestAfter['purchase-research'], tech: ['scan1', 'hull1'],
  }, 'purchase-research')
  && !exactToolActionArc3(exactActionArc3SelftestBefore, {
    ...exactActionArc3SelftestAfter['mine-world'], worlds: [
      ...exactActionArc3SelftestAfter['mine-world'].worlds, { key: 'other-world' },
    ],
  }, 'mine-world')
  && !exactToolActionArc2(exactActionArc2SelftestBefore, {
    ...exactActionArc2SelftestAfter,
    stackableCounts: [
      { baseId: 'plate', count: 4 }, { baseId: 'wire', count: 3 },
    ],
  }, 'fabricate-fixed');
const arc3ActionArc2ChangeSelftest = mutateV5SelftestRow(
  storageSelftestRaw, 'inventory', (row) => {
    row.extensions['arc2.loot'].json = '{"schema":"arc2-control/v1"}';
  },
);
const arc3ActionPreservationSelftestPasses = Object.keys(ARC3_ACTION_OWNED_DATA_FIELDS)
  .every((operation) => arc3ActionUnrelatedEvidencePreserved(
    storageSelftestRaw, storageSelftestRaw, operation,
  ) && v5ToolRowsComplete(arc3ActionOwnedAtSelftest)
  && arc3ActionUnrelatedEvidencePreserved(
    storageSelftestRaw, arc3ActionOwnedAtSelftest, operation,
  ) && arc3ActionUnrelatedExtensionSelftests.every((evidence) => (
    v5ToolRowsComplete(evidence)
      && !arc3ActionUnrelatedEvidencePreserved(storageSelftestRaw, evidence, operation)
  )) && v5ToolRowsComplete(arc3ActionUnrelatedDataSelftest)
  && !arc3ActionUnrelatedEvidencePreserved(
    storageSelftestRaw, arc3ActionUnrelatedDataSelftest, operation,
  ))
  && arc3ActionUnrelatedEvidencePreserved(
    storageSelftestRaw, arc3ActionArc2ChangeSelftest, 'fabricate-fixed',
  )
  && !arc3ActionUnrelatedEvidencePreserved(
    storageSelftestRaw, arc3ActionArc2ChangeSelftest, 'mine-world',
  )
  && Object.values(arc3ActionNarrowOwnershipSelftests).every(v5ToolRowsComplete)
  && !arc3ActionUnrelatedEvidencePreserved(
    storageSelftestRaw, arc3ActionNarrowOwnershipSelftests.mineTech, 'mine-world',
  )
  && !arc3ActionUnrelatedEvidencePreserved(
    storageSelftestRaw, arc3ActionNarrowOwnershipSelftests.mineSkim, 'mine-world',
  )
  && !arc3ActionUnrelatedEvidencePreserved(
    storageSelftestRaw, arc3ActionNarrowOwnershipSelftests.researchMine, 'purchase-research',
  )
  && !arc3ActionUnrelatedEvidencePreserved(
    storageSelftestRaw, arc3ActionNarrowOwnershipSelftests.fabricateEquip, 'fabricate-fixed',
  );
const storageSelftestHold = {
  schema: 'cf-v2-product-action-hold-diagnostics/v1', phase: 'released',
  operation: 'arc3.mine-world', sequence: 1,
};
const storageSelftestOwner = {
  schema: 'cf-v2-product-action-coordinator-diagnostics/v1', busy: false, operation: null,
};
const storageSelftestBeforeState = {
  save: { essence: 40, cargo: [['Fe', 20]] },
  shipVisual: { stateKey: 'ship:v1:storage-selftest' },
  engineering: {
    revision: 12,
    actionCoordinator: {
      inFlight: false, owner: storageSelftestOwner, hold: storageSelftestHold,
      faultArmed: { storageFailure: false }, lastFault: null,
    },
  },
};
const storageSelftestAfterState = structuredClone(storageSelftestBeforeState);
storageSelftestAfterState.engineering.lastOutcome = 'fabricate-fixed-storage-error';
storageSelftestAfterState.engineering.actionCoordinator.lastFault = {
  schema: 'cf-v2-arc3-action-fault-witness/v1', operation: 'arc3.fabricate-fixed',
  injection: 'storage-failure', phase: 'settled', beforeRevision: 12,
  injectedRevision: null, outcome: 'storage-error',
};
const storageSelftestInteraction = {
  modality: 'keyboard', uiOperation: 'fabricate', pointer: [],
  clicks: [{ trusted: true, operation: 'fabricate', id: 'plate' }],
  keys: [{ trusted: true, operation: 'fabricate', id: 'plate', key: 'Enter', code: 'Enter' }],
};
const storageSelftestBundle = {
  before: storageSelftestRaw,
  after: structuredClone(storageSelftestRaw),
  beforeState: storageSelftestBeforeState,
  afterState: storageSelftestAfterState,
  beforeUi: engineeringUiSelftestBefore,
  afterUi: engineeringUiSelftestIdle,
  afterPreviewStateKeys: ['ship:v1:storage-selftest'],
  afterDiagnostics: {
    schema: 'cf-v2-shipyard-diagnostics/v1', status: 'open',
    stateKey: 'ship:v1:storage-selftest', activePreviewCount: 1,
    retainedPreviewCount: 0, pendingPreviewWork: 0,
    engineering: {
      schema: 'cf-v2-engineering-panel-diagnostics/v1', activeCount: 1, pendingWork: 0,
      actionControlCount: ENGINEERING_ACTION_CONTROL_COUNT, activePreviewCount: 1,
      previewStateKey: 'ship:v1:storage-selftest', retainedPreviewCount: 0, faultCount: 0,
    },
  },
  armed: true,
  interaction: storageSelftestInteraction,
  waitError: null,
  captureErrors: [],
};
const storageSelftestCoordinatorState = (coordinator) => ({
  ...storageSelftestAfterState,
  engineering: { ...storageSelftestAfterState.engineering, actionCoordinator: coordinator },
});
const storageSelftestCoordinator = storageSelftestAfterState.engineering.actionCoordinator;
const storageSelftestFaultState = (fault) => storageSelftestCoordinatorState({
  ...storageSelftestCoordinator, lastFault: fault,
});
const storageSelftestMissingFourWayPreviewIdentity = (() => {
  const afterState = structuredClone(storageSelftestAfterState);
  const afterDiagnostics = structuredClone(storageSelftestBundle.afterDiagnostics);
  delete afterState.shipVisual.stateKey;
  delete afterDiagnostics.stateKey;
  delete afterDiagnostics.engineering.previewStateKey;
  return { afterState, afterDiagnostics, afterPreviewStateKeys: [] };
})();
const storageSelftestDeleteEvidence = (path) => {
  const remove = (value) => {
    const copy = structuredClone(value);
    let owner = copy;
    for (const key of path.slice(0, -1)) owner = owner?.[key];
    if (owner && typeof owner === 'object') delete owner[path.at(-1)];
    return copy;
  };
  return assessArc3StorageRefusal({
    ...storageSelftestBundle,
    before: remove(storageSelftestBundle.before),
    after: remove(storageSelftestBundle.after),
  });
};
const storageSelftestDeletionCases = [
  ['revisionRaw'], ['legacyRaw'], ['legacy'], ['playerRaw'], ['playerRow'],
  ['playerRow', 'schema'], ['playerRow', 'data'], ['playerRow', 'extensions'],
  ['creaturesRaw'], ['creaturesRow'], ['creaturesRow', 'schema'], ['creaturesRow', 'data'],
  ['catalogRaw'], ['catalogRow'], ['catalogRow', 'schema'], ['catalogRow', 'data'],
  ['inventoryRaw'], ['inventoryRow'], ['inventoryRow', 'schema'], ['inventoryRow', 'data'],
  ['inventoryRow', 'extensions'],
  ['settingsRaw'], ['settingsRow'], ['settingsRow', 'schema'], ['settingsRow', 'data'],
  ['authorityVersion'], ['authorityJson'], ['authority'],
  ['engineeringVersion'], ['engineeringJson'], ['arc3'], ['arc2Version'], ['arc2Json'], ['arc2'],
  ['receiptKeys'], ['receiptRawRows'], ['receiptRows'],
].map((path) => ['durableEvidenceComplete', storageSelftestDeleteEvidence(path)]);
const storageSelftestCases = [
  ['waitSettled', assessArc3StorageRefusal({ ...storageSelftestBundle, waitError: 'timeout' })],
  ['outcome', assessArc3StorageRefusal({ ...storageSelftestBundle,
    afterState: { ...storageSelftestAfterState, engineering: {
      ...storageSelftestAfterState.engineering, lastOutcome: 'fabricate-fixed-rejected' } } })],
  ['faultOutcome', assessArc3StorageRefusal({ ...storageSelftestBundle,
    afterState: storageSelftestFaultState({
      ...storageSelftestCoordinator.lastFault, outcome: 'rejected',
    }) })],
  ['faultSettlement', assessArc3StorageRefusal({ ...storageSelftestBundle,
    afterState: storageSelftestFaultState({
      ...storageSelftestCoordinator.lastFault, phase: 'injecting',
    }) })],
  ['faultInjection', assessArc3StorageRefusal({ ...storageSelftestBundle,
    afterState: storageSelftestFaultState({
      ...storageSelftestCoordinator.lastFault, injection: 'stale-authority',
    }) })],
  ['revisionStable', assessArc3StorageRefusal({ ...storageSelftestBundle,
    after: { ...storageSelftestRaw, revision: 13, revisionRaw: '13' } })],
  ['ownerReleased', assessArc3StorageRefusal({ ...storageSelftestBundle,
    afterState: storageSelftestCoordinatorState({
      ...storageSelftestCoordinator, inFlight: true,
    }) })],
  ['diagnosticsSettled', assessArc3StorageRefusal({ ...storageSelftestBundle,
    afterState: { ...storageSelftestAfterState,
      shipVisual: { ...storageSelftestAfterState.shipVisual,
        stateKey: 'ship:v1:storage-app-control-mismatch' } } })],
  ['diagnosticsSettled', assessArc3StorageRefusal({ ...storageSelftestBundle,
    afterDiagnostics: { ...storageSelftestBundle.afterDiagnostics,
      stateKey: 'ship:v1:storage-outer-control-mismatch' } })],
  ['diagnosticsSettled', assessArc3StorageRefusal({ ...storageSelftestBundle,
    afterDiagnostics: { ...storageSelftestBundle.afterDiagnostics, engineering: {
      ...storageSelftestBundle.afterDiagnostics.engineering,
      previewStateKey: 'ship:v1:storage-inner-control-mismatch',
    } } })],
  ['diagnosticsSettled', assessArc3StorageRefusal({ ...storageSelftestBundle,
    afterPreviewStateKeys: ['ship:v1:storage-dom-control-mismatch'] })],
  ['diagnosticsSettled', assessArc3StorageRefusal({ ...storageSelftestBundle,
    ...storageSelftestMissingFourWayPreviewIdentity })],
  ['trustedKey', assessArc3StorageRefusal({ ...storageSelftestBundle,
    interaction: { ...storageSelftestInteraction,
      keys: [{ ...storageSelftestInteraction.keys[0], id: 'wire' }] } })],
  ['ui', assessArc3StorageRefusal({ ...storageSelftestBundle,
    afterUi: withEngineeringUiRecipeOwned(engineeringUiSelftestIdle, 'plate') })],
  ['durableEvidenceComplete', assessArc3StorageRefusal({ ...storageSelftestBundle,
    before: storageSelftestSplitOnlyAt, after: structuredClone(storageSelftestSplitOnlyAt) })],
  ['durableEvidenceComplete', assessArc3StorageRefusal({ ...storageSelftestBundle,
    before: storageSelftestLegacyOnlyAt, after: structuredClone(storageSelftestLegacyOnlyAt) })],
  ...storageSelftestDeletionCases,
];
const storageContractSelftestPasses = assessArc3StorageRefusal(storageSelftestBundle).ok
  && storageSelftestCases.every(([expected, result]) => result.ok === false
    && result.checks?.[expected] === false
    && Object.entries(result.checks ?? {}).every(([name, value]) => (
      name === expected ? value === false : value === true
    )))
  && assessArc3StorageRefusal().ok === false
  && assessArc3StorageRefusal().checks?.captured === false;

/* Keep the Node-owned verdict for the Mine success path independent of any
   page global. This tiny classifier is evaluated at module load in both
   directions so a browser-only sentinel cannot re-enter the green path. */
export const arc3MineBrowserOutcomePasses = ({ released, assessment, panelOpen }) => (
  released === true && assessment?.ok === true && panelOpen === 'shipyard'
);

const charterDriveClaim = /chapter (?:numbers?|progress)[^.!?]{0,64}(?:alone )?(?:grants?|creates?|mints?)[^.!?]{0,48}(?:drive|system|reach)/i;
const shipyardPublicationClaim = /(?:reward|cost|Charter tick|optimistic panel change)[^.!?]{0,80}publishes? before[^.!?]{0,48}(?:transaction )?commit/i;
const textPolaritySelftest = hasUnnegatedSentenceClaim(
  'Chapter progress alone mints a drive.', charterDriveClaim,
) && ![
  'Chapter numbers or progress alone never mint a drive.',
  'Chapter progress alone does not mint a drive.',
  'Chapter progress alone do not mint a drive.',
  'Chapter progress alone cannot mint a drive.',
  'Chapter progress alone will not mint a drive.',
].some((copy) => hasUnnegatedSentenceClaim(copy, charterDriveClaim))
  && !hasUnnegatedSentenceClaim(
    'No reward, cost, Charter tick, or optimistic panel change publishes before the transaction commits.',
    shipyardPublicationClaim,
  )
  && hasUnnegatedSentenceClaim(
    'A reward, cost, Charter tick, or optimistic panel change publishes before the transaction commits.',
    shipyardPublicationClaim,
  )
  && hasUnnegatedSentenceClaim(
    'No reward publishes before commit. A reward publishes before commit.',
    shipyardPublicationClaim,
  )
  && hasUnnegatedSentenceClaim(
    'Chapter progress does not merely record milestones; it grants system reach.',
    charterDriveClaim,
  )
  && hasUnnegatedSentenceClaim(
    'Chapter progress does not merely record milestones, but it grants system reach.',
    charterDriveClaim,
  );

const encodeRouteSelftestCode = (target) => 'CF1-' + Buffer.from(JSON.stringify({
  t: 's', g: [90, -60, 78, 0, 0.62, 0.5, 999, 1],
  s: [target.x, target.y, target.seed],
})).toString('base64url');
const remnantRouteSelftestPreRoute = {
  mode: 'system', gal: 999, galX: 90, galY: -60, galSize: 78,
  star: 380168149, starX: 347.25, starY: 24.8, planet: null, planetOrdinal: null,
  navGalaxyKey: ENGINEERING_POST_LIFECYCLE_SOURCE_ORACLE.galaxyKey,
  navStarKey: ENGINEERING_POST_LIFECYCLE_SOURCE_ORACLE.starKey,
  navWorldKey: null,
  renderedScene: {
    serial: 7, mode: 'system', ecologyEpoch: 12,
    galaxyKey: ENGINEERING_POST_LIFECYCLE_SOURCE_ORACLE.galaxyKey,
    starKey: ENGINEERING_POST_LIFECYCLE_SOURCE_ORACLE.starKey, worldKey: null,
  },
  epoch: 12, stage: 1, reach: ENGINEERING_POST_LIFECYCLE_SOURCE_ORACLE.reach,
  shipVisual: {
    chassisStage: 1, hardpoints: { array: false, autoext: false, cscoop: false },
    installedSystemIds: ['jumpdrive'], provenance: 'owned-items',
  },
  panelOpen: null, cardOpen: false, cardTitle: 'Oska', save: {},
};
const remnantRouteSelftestOldMarsRoute = {
  ...structuredClone(remnantRouteSelftestPreRoute),
  mode: 'surface', star: 424242, starX: 560, starY: 170,
  planet: 134, planetOrdinal: 3,
  navStarKey: 'CF1|g:999@90,-60|s:424242@560,170',
  navWorldKey: 'CF1|g:999@90,-60|s:424242@560,170|p:134#3',
  renderedScene: {
    ...remnantRouteSelftestPreRoute.renderedScene, mode: 'surface',
    starKey: 'CF1|g:999@90,-60|s:424242@560,170',
    worldKey: 'CF1|g:999@90,-60|s:424242@560,170|p:134#3',
  },
};
const remnantRouteSelftestEvidence = {
  target: { ...ENGINEERING_REMNANT_ROUTE_TARGET,
    code: encodeRouteSelftestCode(ENGINEERING_REMNANT_ROUTE_TARGET.requestedStar) },
  sourceWitness: ENGINEERING_REMNANT_ROUTE_TARGET.sourceWitness,
  neighborhoodRadius: ENGINEERING_REMNANT_ROUTE_TARGET.neighborhoodRadius,
  preRoute: remnantRouteSelftestPreRoute,
  current: {
    mode: 'system', gal: 999, galX: 90, galY: -60,
    star: 449521432, starX: 734.58, starY: -10.77, planet: null,
    navStarKey: ENGINEERING_REMNANT_ROUTE_TARGET.navStarKey,
    epoch: 12, stage: 1,
    shipVisual: {
      stateKey: 'ship:v1:remnant-selftest',
      chassisStage: 1, hardpoints: { array: false, autoext: false, cscoop: false },
      installedSystemIds: ['jumpdrive'], provenance: 'owned-items',
    },
    renderedScene: {
      serial: 8, mode: 'system', ecologyEpoch: 12,
      galaxyKey: ENGINEERING_POST_LIFECYCLE_SOURCE_ORACLE.galaxyKey,
      starKey: ENGINEERING_REMNANT_ROUTE_TARGET.navStarKey, worldKey: null,
    },
  },
  surface: {
    panelOpen: 'shipyard',
    previewStateKeys: ['ship:v1:remnant-selftest'],
    button: { exists: true, connected: true, tag: 'BUTTON', operation: 'skim', id: null },
    model: { status: 'ready', modelEnabled: 'true', disabled: false, ariaDisabled: 'false' },
    diagnostics: {
      schema: 'cf-v2-shipyard-diagnostics/v1', status: 'open',
      stateKey: 'ship:v1:remnant-selftest', activePreviewCount: 1,
      retainedPreviewCount: 0, pendingPreviewWork: 0,
      engineering: {
        schema: 'cf-v2-engineering-panel-diagnostics/v1', activeCount: 1,
        pendingWork: 0, actionControlCount: ENGINEERING_ACTION_CONTROL_COUNT,
        activePreviewCount: 1, previewStateKey: 'ship:v1:remnant-selftest',
        retainedPreviewCount: 0, faultCount: 0,
      },
    },
  },
  routeError: null,
  openError: null,
  authorityReady: true,
  opening: { opened: true, pointer: { trusted: true, pointerType: 'mouse' } },
};
const remnantRouteSelftest = assessArc3RemnantSkimRoutePrecondition(remnantRouteSelftestEvidence);
const remnantRouteEmptySelftest = assessArc3RemnantSkimRoutePrecondition();
const remnantRouteFailureSelftest = assessArc3RemnantSkimRoutePrecondition({
  ...remnantRouteSelftestEvidence,
  current: null,
  surface: { panelOpen: null, button: null, model: null, diagnostics: null },
  routeError: 'route timeout',
  openError: 'panel unavailable',
  authorityReady: false,
});
const remnantRouteTargetControls = [
  { requestedStar: { ...ENGINEERING_REMNANT_ROUTE_TARGET.requestedStar, seed: 449521433 } },
  { canonicalStar: { ...ENGINEERING_REMNANT_ROUTE_TARGET.canonicalStar, x: 734.59 } },
  { canonicalStar: { ...ENGINEERING_REMNANT_ROUTE_TARGET.canonicalStar,
    parentCell: { ...ENGINEERING_REMNANT_ROUTE_TARGET.canonicalStar.parentCell, x: 18 } } },
  { canonicalStar: { ...ENGINEERING_REMNANT_ROUTE_TARGET.canonicalStar, layer: 'fine' } },
].map((drift) => assessArc3RemnantSkimRoutePrecondition({
  ...remnantRouteSelftestEvidence,
  target: { ...remnantRouteSelftestEvidence.target, ...drift },
}));
const remnantRouteWithoutEpoch = structuredClone(remnantRouteSelftestPreRoute);
delete remnantRouteWithoutEpoch.epoch;
const remnantRouteWithoutReceiptEpoch = structuredClone(remnantRouteSelftestPreRoute);
delete remnantRouteWithoutReceiptEpoch.renderedScene.ecologyEpoch;
const remnantCurrentWithoutReceiptEpoch = structuredClone(remnantRouteSelftestEvidence.current);
delete remnantCurrentWithoutReceiptEpoch.renderedScene.ecologyEpoch;
const remnantRouteMissingFourWayPreviewIdentity = (() => {
  const evidence = structuredClone(remnantRouteSelftestEvidence);
  delete evidence.current.shipVisual.stateKey;
  delete evidence.surface.diagnostics.stateKey;
  delete evidence.surface.diagnostics.engineering.previewStateKey;
  evidence.surface.previewStateKeys = [];
  return evidence;
})();
const remnantRouteClauseControls = [
  ['sourceOracle', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    sourceWitness: { ...remnantRouteSelftestEvidence.sourceWitness, kind: 'STAR' },
  })],
  ['reachable', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence, neighborhoodRadius: 250,
  })],
  ['preRoute', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence, preRoute: remnantRouteSelftestOldMarsRoute,
  })],
  ['preRoute', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    preRoute: { ...remnantRouteSelftestPreRoute, star: 380168150 },
  })],
  ['preRoute', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    preRoute: { ...remnantRouteSelftestPreRoute,
      navStarKey: 'CF1|g:999@90,-60|s:380168149@347.25,24.81' },
  })],
  ['preRoute', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence, preRoute: remnantRouteWithoutEpoch,
  })],
  ['preRoute', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence, preRoute: remnantRouteWithoutReceiptEpoch,
  })],
  ['preRoute', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    preRoute: { ...remnantRouteSelftestPreRoute,
      renderedScene: { ...remnantRouteSelftestPreRoute.renderedScene, ecologyEpoch: 13 } },
  })],
  ['renderedReceipt', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    current: { ...remnantRouteSelftestEvidence.current,
      renderedScene: { ...remnantRouteSelftestEvidence.current.renderedScene, serial: 7 } },
  })],
  ['renderedReceipt', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence, current: remnantCurrentWithoutReceiptEpoch,
  })],
  ['renderedReceipt', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    current: { ...remnantRouteSelftestEvidence.current,
      renderedScene: { ...remnantRouteSelftestEvidence.current.renderedScene, ecologyEpoch: 13 } },
  })],
  ['renderedReceipt', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    current: { ...remnantRouteSelftestEvidence.current, epoch: 13 },
  })],
  ['charterOwnership', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    current: { ...remnantRouteSelftestEvidence.current, stage: 2,
      shipVisual: { ...remnantRouteSelftestEvidence.current.shipVisual,
        chassisStage: 2, installedSystemIds: ['jumpdrive', 'array'],
        hardpoints: { ...remnantRouteSelftestEvidence.current.shipVisual.hardpoints, array: true } } },
  })],
  ['diagnostics', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    current: { ...remnantRouteSelftestEvidence.current,
      shipVisual: { ...remnantRouteSelftestEvidence.current.shipVisual,
        stateKey: 'ship:v1:remnant-app-control-mismatch' } },
  })],
  ['diagnostics', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    surface: { ...remnantRouteSelftestEvidence.surface,
      diagnostics: { ...remnantRouteSelftestEvidence.surface.diagnostics,
        stateKey: 'ship:v1:remnant-outer-control-mismatch' } },
  })],
  ['diagnostics', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    surface: { ...remnantRouteSelftestEvidence.surface,
      diagnostics: { ...remnantRouteSelftestEvidence.surface.diagnostics,
        engineering: { ...remnantRouteSelftestEvidence.surface.diagnostics.engineering,
          previewStateKey: 'ship:v1:remnant-inner-control-mismatch' } } },
  })],
  ['diagnostics', assessArc3RemnantSkimRoutePrecondition({
    ...remnantRouteSelftestEvidence,
    surface: { ...remnantRouteSelftestEvidence.surface,
      previewStateKeys: ['ship:v1:remnant-dom-control-mismatch'] },
  })],
  ['diagnostics', assessArc3RemnantSkimRoutePrecondition(
    remnantRouteMissingFourWayPreviewIdentity,
  )],
];
const rejectedRouteSelftestBase = {
  before: {
    route: remnantRouteSelftestPreRoute,
    raw: storageSelftestRaw,
    toastSerial: 2,
  },
};
const rejectedRouteSelftestEvidence = (kind, target, { toastSerial, toastText = '' }) => {
  const code = encodeRouteSelftestCode(target);
  return {
    ...rejectedRouteSelftestBase, kind, target, code,
    after: {
      route: structuredClone(rejectedRouteSelftestBase.before.route),
      raw: structuredClone(rejectedRouteSelftestBase.before.raw),
      toastSerial, toastText, query: code, focused: true,
    },
  };
};
const rejectedRouteFullPrecisionEvidence = rejectedRouteSelftestEvidence(
  'full-precision-invalid', ENGINEERING_REMNANT_ROUTE_LEGACY_TARGET.rawStar,
  { toastSerial: 2 },
);
const rejectedRouteRoundedEvidence = rejectedRouteSelftestEvidence(
  'rounded-charter-blocked', ENGINEERING_REMNANT_ROUTE_LEGACY_TARGET.canonicalStar,
  { toastSerial: 3,
    toastText: 'Your owned Jump Drive covers the Neighborhood. Engineering can fabricate the Long-Range Array.' },
);
const rejectedRouteSelftests = [
  assessArc3RemnantRejectedSearchControl(rejectedRouteFullPrecisionEvidence),
  assessArc3RemnantRejectedSearchControl(rejectedRouteRoundedEvidence),
];
const rejectedRouteRawDeleted = (evidence, key) => {
  const before = structuredClone(evidence.before), after = structuredClone(evidence.after);
  delete before.raw[key]; delete after.raw[key];
  return { ...evidence, before, after };
};
const rejectedRouteSourceDrift = (() => {
  const before = { ...structuredClone(rejectedRouteFullPrecisionEvidence.before),
    route: structuredClone(remnantRouteSelftestOldMarsRoute) };
  const after = { ...structuredClone(rejectedRouteFullPrecisionEvidence.after),
    route: structuredClone(remnantRouteSelftestOldMarsRoute) };
  return { ...rejectedRouteFullPrecisionEvidence, before, after };
})();
const rejectedRouteMarkedDrift = (() => {
  const code = `control ${rejectedRouteFullPrecisionEvidence.code}`;
  return { ...rejectedRouteFullPrecisionEvidence, code,
    after: { ...rejectedRouteFullPrecisionEvidence.after, query: code } };
})();
const rejectedRouteMutationSelftests = [
  ['exactRoute', assessArc3RemnantRejectedSearchControl({
    ...rejectedRouteFullPrecisionEvidence,
    after: { ...rejectedRouteFullPrecisionEvidence.after,
      route: { ...rejectedRouteFullPrecisionEvidence.after.route,
        starX: rejectedRouteFullPrecisionEvidence.after.route.starX + 1 } },
  })],
  ['classification', assessArc3RemnantRejectedSearchControl({
    ...rejectedRouteRoundedEvidence,
    after: { ...rejectedRouteRoundedEvidence.after, toastSerial: 2, toastText: '' },
  })],
  ['markedCode', assessArc3RemnantRejectedSearchControl(rejectedRouteMarkedDrift)],
  ['source', assessArc3RemnantRejectedSearchControl(rejectedRouteSourceDrift)],
  ['durableEvidence', assessArc3RemnantRejectedSearchControl(
    rejectedRouteRawDeleted(rejectedRouteFullPrecisionEvidence, 'legacyRaw'),
  )],
  ['durableEvidence', assessArc3RemnantRejectedSearchControl(
    rejectedRouteRawDeleted(rejectedRouteFullPrecisionEvidence, 'playerRaw'),
  )],
  ['durableEvidence', assessArc3RemnantRejectedSearchControl(
    rejectedRouteRawDeleted(rejectedRouteFullPrecisionEvidence, 'inventoryRaw'),
  )],
];

if (ENGINEERING_RESEARCH_IDS.length !== 6
  || new Set(ENGINEERING_RESEARCH_IDS).size !== ENGINEERING_RESEARCH_IDS.length
  || ENGINEERING_RECIPE_IDS.length !== 62
  || new Set(ENGINEERING_RECIPE_IDS).size !== ENGINEERING_RECIPE_IDS.length
  || ENGINEERING_RECIPE_GROUPS.length !== 5
  || ENGINEERING_ACTION_CONTROL_COUNT !== 70
  || ENGINEERING_REMNANT_ROUTE_TARGET.neighborhoodRadius !== 300
  || ENGINEERING_REMNANT_ROUTE_TARGET.sourceWitness?.schema !== 'cf-v2-tool-star-source-oracle/v1'
  || ENGINEERING_REMNANT_ROUTE_TARGET.sourceWitness?.generator !== 'WorldGen.starsInCell+systemFor'
  || ENGINEERING_REMNANT_ROUTE_TARGET.sourceWitness?.cellOrdinal !== 1
  || ENGINEERING_REMNANT_ROUTE_TARGET.sourceWitness?.kind !== 'BH'
  || ENGINEERING_REMNANT_ROUTE_TARGET.sourceWitness?.expectedFirstQuantity !== 2
  || JSON.stringify(ENGINEERING_GLASS_RESEARCH_ORACLE.map(({ id }) => id))
    !== JSON.stringify(ENGINEERING_RESEARCH_IDS)
  || JSON.stringify(ENGINEERING_GLASS_RECIPE_ORACLE.map(({ id }) => id))
    !== JSON.stringify(ENGINEERING_RECIPE_IDS)
  || engineeringGlassOracleSha256 !== ENGINEERING_GLASS_ORACLE_SHA256
  || ENGINEERING_GLASS_RESEARCH_ORACLE.filter(({ modelEnabled, disabled }) => (
    modelEnabled === 'true' && disabled === false
  )).length !== 0
  || ENGINEERING_GLASS_RECIPE_ORACLE.filter(({ modelEnabled, disabled }) => (
    modelEnabled === 'true' && disabled === false
  )).length !== 3
  || [...ENGINEERING_GLASS_RESEARCH_ORACLE, ...ENGINEERING_GLASS_RECIPE_ORACLE]
    .some(({ modelEnabled, disabled }) => disabled !== (modelEnabled !== 'true'))
  || !arc3MineBrowserOutcomePasses({
    released: true, assessment: { ok: true }, panelOpen: 'shipyard',
  })
  || arc3MineBrowserOutcomePasses({
    released: true, assessment: { ok: false }, panelOpen: 'shipyard',
  })
  || !textPolaritySelftest
  || !remnantRouteSelftest.ok
  || remnantRouteEmptySelftest.ok || remnantRouteEmptySelftest.checks?.complete !== false
  || remnantRouteFailureSelftest.ok || remnantRouteFailureSelftest.checks?.routeSettled !== false
  || remnantRouteFailureSelftest.checks?.button !== false
  || remnantRouteTargetControls.some(({ ok, checks }) => ok || checks?.target !== false
    || Object.entries(checks ?? {}).some(([name, value]) => name !== 'target' && value !== true))
  || remnantRouteClauseControls.some(([expected, { ok, checks }]) => ok || checks?.[expected] !== false
    || Object.entries(checks ?? {}).some(([name, value]) => name !== expected && value !== true))
  || rejectedRouteSelftests.some(({ ok }) => !ok)
  || rejectedRouteMutationSelftests.some(([expected, { ok, checks }]) => ok || checks?.[expected] !== false
    || Object.entries(checks ?? {}).some(([name, value]) => name !== expected && value !== true))
  || !v5RowContractSelftestPasses
  || !f4ToolAuthoritySelftestPasses
  || !trainingEvidenceModeSelftestPasses
  || !exactToolActionTransformSelftestPasses
  || !arc3ActionPreservationSelftestPasses
  || !storageContractSelftestPasses
  || !engineeringUiContractSelftestPasses) {
  throw new Error('Arc 3 Engineering browser contract inventory is malformed');
}
