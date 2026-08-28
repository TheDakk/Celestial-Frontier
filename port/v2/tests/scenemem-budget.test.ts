import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  evaluateSceneMemory,
  type SceneMemoryBudget,
  type SceneMemoryInput,
  type SceneMemoryProfileMeasurement,
  type SceneMemoryVerdict,
} from '../tools/scenemem-contract.mjs';
import {
  SCENE_MEMORY_BROWSER_AUTHORITY_SCHEMA,
  SCENE_MEMORY_BROWSER_AUTHORITY_SCOPE,
  SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT,
  SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT_SHA256,
  SCENE_MEMORY_BROWSER_PROFILE_CONTRACT,
  SCENE_MEMORY_BROWSER_PROFILE_CONTRACT_SHA256,
  sceneMemoryBrowserAuthorityMatches,
  validateSceneMemoryBudget,
} from '../tools/scenemem.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const budgetPath = path.join(v2Root, 'budgets', 'scene-memory-v2.json');
const auditRoot = path.resolve(v2Root, '..', '..', 'audits');
const CLEAN_WORKING_TREE_SHA256 = 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a';
const CALIBRATION_SOURCE_COMMIT = '6c9ad85577bd90d6af883dd7b3f13556d24eb3ad';
const CALIBRATION_BUILD_SHA256 = '46e473657f3cda06a6e445c1588ae983f270822d3e745f9009e20bed083f9274';
const CALIBRATION_BUILD_FILE_COUNT = 42;
const CALIBRATION_BUILD_FILES_SHA256 = '3d91bfb1fc1457bbac3309e84b998898591cb762c48060c1132c33190c3a2782';
const HISTORICAL_BUILD_SHA256 = '44eb670cc2160c39ff5c159f5f1aec1e68e5d6bae5d02e75bf0e2eec026ff81e';
const HISTORICAL_BUILD_FILE_COUNT = 38;
const HISTORICAL_BUILD_FILES_SHA256 = 'ffd2616047932577db169f05d891ea96054bd2dcc5cb65c1d02a2a3df7f1ca03';
const HISTORICAL_PRE_ACTIVATION_BUDGET_SHA256 =
  '110211c3f53e623f3eff1d6df7b01606225baef6cde9a0682b5460abb04dffe5';
const HISTORICAL_ACTIVATED_BUDGET_SHA256 =
  'e6c4aeea762fc0e36432cda131a0f75dc77fef857ea8bfb852b9188b3aef7375';
const CURRENT_PRE_ACTIVATION_BUDGET_SHA256 =
  '5d27d38ecec990faf7b1cd03d20e917a2465048218e2e4ee33a5a05848d97ce0';
const CURRENT_ACTIVATED_BUDGET_SHA256 =
  'a23a3d802435a6e8d5bc33142f621ddf2914a78a7fb93fb890488ddad3ac8355';
const PROFILE_NAMES = ['phone', 'desktop'] as const;
const CANDIDATES = [
  {
    runId: '20260827-phase4-repair-candidate1',
    file: 'ARC1C_SCENEMEM_REPAIR_CALIBRATION_CANDIDATE1_20260827.json.gz',
    rawSha256: 'd447a5c76bcfbc1e9df87c51f0c35bc6e960c70f6afb31f8bdcf54765efcb39b',
    gzipSha256: 'bd91cbbfba7daf7fd283f2f1d523a34ca0aed1b46a8d5acb6030889b80df75d1',
  },
  {
    runId: '20260827-phase4-repair-candidate2',
    file: 'ARC1C_SCENEMEM_REPAIR_CALIBRATION_CANDIDATE2_20260827.json.gz',
    rawSha256: 'e6ec574ddd5f475158d78bdd960dbd11541e16502b6a6bfce69a5484b34ba7da',
    gzipSha256: '6f7d0a17cc60fda9c8c07d0e41d9206c1ea7d2c63233c0cc3494e03ecfb67a14',
  },
  {
    runId: '20260827-phase4-repair-candidate3',
    file: 'ARC1C_SCENEMEM_REPAIR_CALIBRATION_CANDIDATE3_20260827.json.gz',
    rawSha256: '52d54330efc5ca07ded8645fb1b33e029ed7da11cc18ae892c38e0a0e7ce08f7',
    gzipSha256: '6015b3620aadf55b3abdb807cdc19bb97b85b37e21b3f3d8ba2e6a1ddd59fc82',
  },
] as const;
const HISTORICAL_CALIBRATION_CANDIDATES = [
  {
    runId: 'arc1c-candidate-1',
    file: 'ARC1C_SCENEMEM_CALIBRATION_CANDIDATE1.json.gz',
    rawSha256: '045b43a26852449a810da3be36759c473f809994b3a68d4657af900875d4647b',
    gzipSha256: 'ada50b3cc3f3c143d06ffc42d8e8b0cf3379a57ee17bf2ba1faa7eb11ca3bda0',
  },
  {
    runId: 'arc1c-candidate-2',
    file: 'ARC1C_SCENEMEM_CALIBRATION_CANDIDATE2.json.gz',
    rawSha256: 'd4a51a4422fe4a3ae89223110676fe0f9a7939c8f8892792dd98c0e210e2d958',
    gzipSha256: '80a77eeb21d970add3529a4375738ea2aa9234c2eb8f479a931c56ab2ac43601',
  },
  {
    runId: 'arc1c-candidate-3',
    file: 'ARC1C_SCENEMEM_CALIBRATION_CANDIDATE3.json.gz',
    rawSha256: '4bf113e40fe6e94a4a127aba3256ecca2ab90cc9f7bd3564be00662a44238ff8',
    gzipSha256: '385d4622e669cc0849aced533da50869b01a6b11ef5d06e3e61afe5de910a593',
  },
] as const;
const HISTORICAL_CALIBRATION_SOURCE_COMMIT = 'a4de5007ffc9131b8bc952a0a4cb469d9139039e';
const HISTORICAL_LOCAL_CERTIFICATION = Object.freeze({
  runId: '20260822-arc1-local-certification',
  file: 'ARC1C_SCENEMEM_LOCAL_CERTIFICATION.json.gz',
  sourceCommit: '59530da3bf40965adf9c54f169b310e11ccdd0f8',
  rawSha256: 'e24ceef86d17fb4a47bbb10e58f81d442cac6e3def28923672448f6c47eac3a5',
  gzipSha256: '0d83e6ce339205beb0b5387008ca74ca9b1f95cb22bf61444c439da36405f2a6',
  budgetSha256: '3b71d14ca297ec4d536669d2edf960ac4d01671dd7a0c9eb11a2fb76e4fc43f7',
});
const CURRENT_LOCAL_CERTIFICATION = Object.freeze({
  runId: '20260823-pr33-cross-host-sla-certification',
  file: 'PR33_SCENEMEM_CROSS_HOST_SLA_CERTIFICATION_20260823.json.gz',
  sourceCommit: '7d8dc380cd89ef53aac5a11c3850316e19e1aae9',
  rawSha256: 'd16d40cd4d07f96683490eab920072fb9f3b42e0d0ee54434ffd4d312223f960',
  gzipSha256: '7c4100244abef8d50f93178aab7c8579ae93fa0b6bef76422cc5c0523edac55a',
  budgetSha256: '5c8a6e7568e02d4e31501e4188dba57d3ac6e6ad183882b98ff9c68170771501',
});
const CURRENT_INPUT_BROKEN_BASELINE = Object.freeze({
  runId: '20260827-phase4-successor-scenemem',
  file: 'ARC1C_SCENEMEM_CURRENT_INPUT_FAILURE_20260827_163818607.json.gz',
  sourceCommit: '862a75b316142348636abea442dab15e87393642',
  rawSha256: '3197ca65a1011bf386067d73515a0bcefd17ab91752a2d9d36af5e5dd055dfd7',
  gzipSha256: 'dc6c149341323912f410bd32498cf4eec3128b5f13f2bbad16ba3a72f495cb47',
  budgetSha256: '4cc797eb15277949a411131c1f19a5f72fb4c76154caed18aa274d9b718dd9ad',
  buildSha256: '726ad8ef4db167a18964763934aa5f8f207600ab3f3ba49c9e81e54b58104074',
});
const HOSTED_LINUX_FAILURE = Object.freeze({
  runId: 'gha-32618995487-1-scenemem',
  file: 'PR33_LINUX_SCENEMEM_REPORT_32618995487.json.gz',
  sourceCommit: '715a74a276b5f8f8bcde115bbd15844e4efbac30',
  originalBudgetSha256: '3b71d14ca297ec4d536669d2edf960ac4d01671dd7a0c9eb11a2fb76e4fc43f7',
  rawSha256: 'c59908636e8addd72da019f372089216ad231bb862b718f75f266f6b25347856',
  gzipSha256: '20db9d1671f9324f469fdd3305085b49f7fc44d871d0ddbedf9f6031c25b4b5f',
  artifactId: 9488319243,
  artifactSha256: '39697f623d793e9eb42f99eb78a4f63c93de618bf82d86b651d3a097d33f2493',
});

type ProfileName = typeof PROFILE_NAMES[number];
type BudgetRecord = {
  schema: string;
  authority: {
    browser: Record<string, string>;
    producer: Record<string, string>;
  };
  profiles: Record<ProfileName, SceneMemoryBudget>;
};
type CalibrationReport = {
  schema: string;
  runId: string;
  status: string;
  certification: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  lifecycle: { schema: string; status: string };
  policy: Record<string, number>;
  scope: {
    covered: string[];
    shipyardStatus: string;
    excluded: string[];
  };
  cleanup: Record<string, boolean>;
  source: {
    begin: Record<string, string>;
    end: Record<string, string>;
  };
  browser: Record<string, string>;
  inputs: Record<string, string | null>;
  build: { schema: string; files: unknown[]; sha256: string };
  fixture: { count: number; rowsSha256: string };
  budget?: { schema: string; path: string; sha256: string };
  contractInput: SceneMemoryInput;
  verdict: SceneMemoryVerdict;
  outcomes: Array<{ id: string; pass: boolean; message: string }>;
  findings: unknown[];
  fatalEvents: unknown[];
  profiles: Record<ProfileName, SceneMemoryProfileMeasurement & {
    targetId: string;
    documentToken: string;
    metrics: Record<keyof SceneMemoryBudget, number>;
  }>;
};

const EXPECTED_BROWSER_AUTHORITY = Object.freeze({
  schema: SCENE_MEMORY_BROWSER_AUTHORITY_SCHEMA,
  scope: SCENE_MEMORY_BROWSER_AUTHORITY_SCOPE,
  family: 'microsoft-edge',
  protocolVersion: '1.3',
  capabilityContract: SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT,
  capabilityContractSha256: SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT_SHA256,
  profileContract: SCENE_MEMORY_BROWSER_PROFILE_CONTRACT,
  profileContractSha256: SCENE_MEMORY_BROWSER_PROFILE_CONTRACT_SHA256,
});

const HISTORICAL_EDGE_101_VERSION = Object.freeze({
  product: 'Edg/151.0.4129.101',
  revision: '@cc1d9f4080fd9140611a9600b8d1615db310105d',
  jsVersion: '15.1.23.9',
  protocolVersion: '1.3',
});
const HISTORICAL_LOCAL_EDGE_101_PROVENANCE = Object.freeze({
  executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ...HISTORICAL_EDGE_101_VERSION,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
});
const CALIBRATION_EDGE_107_PROVENANCE = Object.freeze({
  product: 'Edg/151.0.4129.107',
  revision: '@419e77616b4ed7d0a544b85cb53ccd5b74d5f135',
  jsVersion: '15.1.23.12',
  protocolVersion: '1.3',
});

const HISTORICAL_PRODUCER_AUTHORITY = Object.freeze({
  collector: 'c0c626d1b8a4bc577161debf477f97cfa9c8be4d735fecaaa16124afcae2e957',
  browserCdp: '6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce',
  browserPath: '733ab771f60bead83e8d2af4d95339248f7c9b16879903ea89b817677e4a6bc0',
  workspaceLock: 'e22a4c268ad0ce71a1c9160f45a2386c413c7fbcfc13f0cc457cf084ff0fd606',
  fixtureGenerator: 'a1b294f0b8b5958910fd873f49d226f80447ad77381cccfd0acb21c82dc7aece',
  verdictContract: '8019a0f0bf938aa59f45bb6dfaaf56adb77b08073f9d4fa24c2d0592f5bf623d',
  fixtureSpec: 'c5792c2c8605765b95170e8d954a157e60c9abfa37500ec93c5e1f81722f69f3',
  fixtureRows: 'daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706',
  baselineSaveFixtures: 'a52bfbdc1c65a418eed07a1e7ba5ffd07b36caf5ce10e587c7d34a717deab2a7',
  package: '6bad342bf5503275608ebae5c0e730658c82d608cd58f4c1d62a4457f85d673f',
  packageLock: 'a6b7eb9f9439d7c76d7cf0ee154ef6221e9ad73226c7a5f0e893feaf4231a110',
  appPackage: 'd935051fd788aa303363adf84a51bc1b030ae05f488a0058585322465d9b7135',
  buildDist: HISTORICAL_BUILD_SHA256,
  gameHtml: 'dd4b69852e309d7eab44df07dab37ee01b1d157b3948de805f6b1092b2edb538',
  gameMain: 'e493beec8251b013b19c3191a400df74c872a2b75adc9e57eb87f9c9b97062aa',
  shipVisualState: '9bfd27d3d6a75779d3372dfb6386e8e98ef22d92a33b0346819225024c70d762',
  shipyardPreview: 'a3aac0c541a8f824a3625778e89468b5b03653dd29820c3b024fa45a7c753e85',
  planetTextureAttachment: '00e4b63f28cf6fc01c3285eaa6f6e840154eda669e4bf7334aec660d2822857a',
  planetTextureDemand: 'a537aacde361e88b692887e6d2fa67674296d828aa0d297673dc34b147322055',
  sceneTextureOwner: 'db7af3f23c3b7d652df37cb54f1082eea177380aefd4f86bc16365a6adbed709',
  pixiManagedResourceOwner: '2d9eaeb667f5a4a763e25bd8e168b721494dda49c252e2411031a258d2653708',
  pixiBatchTextureArray: '95ea401f9f05a933f17c9a327b94109bfcc46b0a21cc59789a66537a5b62deb3',
  sceneText: '7ea78c599fed72ab1ba65991270b72d642f6ec2f9768f63ad64d280ce9147731',
});
const CALIBRATION_PRODUCER_AUTHORITY = Object.freeze({
  collector: 'dd41b2901185e225197a3e3991dbfca42766154889bffb756900ade3cd22a6a8',
  browserCdp: '6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce',
  browserPath: '733ab771f60bead83e8d2af4d95339248f7c9b16879903ea89b817677e4a6bc0',
  workspaceLock: 'e22a4c268ad0ce71a1c9160f45a2386c413c7fbcfc13f0cc457cf084ff0fd606',
  fixtureGenerator: 'a1b294f0b8b5958910fd873f49d226f80447ad77381cccfd0acb21c82dc7aece',
  verdictContract: '8b36ec211b8d3355a710408c3399d0d7157686f43734e5b47d531f783bef59e5',
  fixtureSpec: 'c5792c2c8605765b95170e8d954a157e60c9abfa37500ec93c5e1f81722f69f3',
  fixtureRows: 'daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706',
  baselineSaveFixtures: 'a52bfbdc1c65a418eed07a1e7ba5ffd07b36caf5ce10e587c7d34a717deab2a7',
  package: '87551923ad5af540270ecbbeef73b97bcf90d82ae66867e59a844f1815a98106',
  packageLock: 'a1f1dc3335714fe40c06a99684a5da9d66ea1a24d9db73594efe5b15c11fcd6e',
  appPackage: '69e7a046ca620dafabb38d0471b59f682fdc5b15433c2207bcf18a218f38c7de',
  buildDist: '46e473657f3cda06a6e445c1588ae983f270822d3e745f9009e20bed083f9274',
  gameHtml: '88074f1c1f360a35f0718386c9619c1801aac1f5abc7b259b606b94cc9d00c30',
  gameMain: '7ff00481432163560c61a8dda931a9b99850b06d5a60199b3a02e2ecb48aa5cf',
  shipVisualState: '9bfd27d3d6a75779d3372dfb6386e8e98ef22d92a33b0346819225024c70d762',
  shipyardPreview: 'a3aac0c541a8f824a3625778e89468b5b03653dd29820c3b024fa45a7c753e85',
  planetTextureAttachment: '751cb34df8ead64fc5ad274a0fd55dfe1af7bb183949ffebcea2ada5de5903e0',
  planetTextureDemand: 'a537aacde361e88b692887e6d2fa67674296d828aa0d297673dc34b147322055',
  sceneTextureOwner: 'db7af3f23c3b7d652df37cb54f1082eea177380aefd4f86bc16365a6adbed709',
  pixiManagedResourceOwner: '2d9eaeb667f5a4a763e25bd8e168b721494dda49c252e2411031a258d2653708',
  pixiBatchTextureArray: '95ea401f9f05a933f17c9a327b94109bfcc46b0a21cc59789a66537a5b62deb3',
  sceneText: '7ea78c599fed72ab1ba65991270b72d642f6ec2f9768f63ad64d280ce9147731',
});
const EXPECTED_PRODUCER_AUTHORITY = Object.freeze({
  ...CALIBRATION_PRODUCER_AUTHORITY,
  buildDist: 'e6d65d40c4b4ed4cb529b22666bf07659986619ee55dc3e991aa15dae43cacd7',
  gameHtml: 'f044b6dc043627ea21e8b3158706d1ed0e9e9bd278c422d0028c46281d1e4233',
  gameMain: 'a113f7090944ca6d3eeb6ec0ab21595068f24edb849e19bd8e8ca36107c8e55b',
});

const SELECTED_PROFILES = Object.freeze({
  phone: Object.freeze({
    heapUsedBytesMax: 12582912,
    embedderHeapUsedBytesMax: 4194304,
    backingStorageBytesMax: 3145728,
    heapAggregateBytesMax: 18874368,
    warmHeapAggregateRangeBytesMax: 524288,
    warmHeapSlopeBytesPerCycleMax: 131072,
    documentsMax: 3.5,
    nodesMax: 704,
    jsEventListenersMax: 80,
    peakActiveLeaseCountMax: 84.5,
    peakLiveTextureCountMax: 74.5,
    peakLiveCanvasBytesMax: 30288705,
    managedTextureCountMax: 48,
    managedTexturePixelsMax: 6553600,
    localCanvasCacheEntriesMax: 0.5,
    peakLocalCanvasCacheEntriesMax: 2.5,
    productRenderTargetsMax: 0.5,
    ringCacheEntriesMax: 0.5,
    peakRingGeometryEntriesMax: 2.5,
    targetElapsedMsMax: 1000,
    heartbeatElapsedMsMax: 100,
  }),
  desktop: Object.freeze({
    heapUsedBytesMax: 12582912,
    embedderHeapUsedBytesMax: 4194304,
    backingStorageBytesMax: 3145728,
    heapAggregateBytesMax: 18874368,
    warmHeapAggregateRangeBytesMax: 524288,
    warmHeapSlopeBytesPerCycleMax: 131072,
    documentsMax: 3.5,
    nodesMax: 704,
    jsEventListenersMax: 80,
    peakActiveLeaseCountMax: 81.5,
    peakLiveTextureCountMax: 72.5,
    peakLiveCanvasBytesMax: 30255937,
    managedTextureCountMax: 48,
    managedTexturePixelsMax: 6291456,
    localCanvasCacheEntriesMax: 0.5,
    peakLocalCanvasCacheEntriesMax: 2.5,
    productRenderTargetsMax: 0.5,
    ringCacheEntriesMax: 0.5,
    peakRingGeometryEntriesMax: 2.5,
    targetElapsedMsMax: 1000,
    heartbeatElapsedMsMax: 100,
  }),
}) satisfies Readonly<Record<ProfileName, SceneMemoryBudget>>;
const PRE_ACTIVATION_PROFILES = Object.freeze({
  phone: Object.freeze({
    ...SELECTED_PROFILES.phone,
    heapUsedBytesMax: 10485760,
    heapAggregateBytesMax: 16777216,
  }),
  desktop: Object.freeze({
    ...SELECTED_PROFILES.desktop,
    heapUsedBytesMax: 10485760,
    heapAggregateBytesMax: 16777216,
  }),
}) satisfies Readonly<Record<ProfileName, SceneMemoryBudget>>;
const ORIGINAL_250_PROFILES = Object.freeze({
  phone: Object.freeze({ ...PRE_ACTIVATION_PROFILES.phone, targetElapsedMsMax: 250 }),
  desktop: Object.freeze({ ...PRE_ACTIVATION_PROFILES.desktop, targetElapsedMsMax: 250 }),
}) satisfies Readonly<Record<ProfileName, SceneMemoryBudget>>;

const BUDGET_FIELDS = Object.keys(SELECTED_PROFILES.phone) as Array<keyof SceneMemoryBudget>;
const ZERO_POINT_FIELDS: Readonly<Partial<Record<keyof SceneMemoryBudget, string>>> = Object.freeze({
  localCanvasCacheEntriesMax: 'localCanvasCacheEntries',
  productRenderTargetsMax: 'productRenderTargets',
  ringCacheEntriesMax: 'ringCacheEntries',
});

const sha256 = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8')) as BudgetRecord;
const loadEvidence = (candidates: ReadonlyArray<{
  runId: string;
  file: string;
  rawSha256: string;
  gzipSha256: string;
}>) => candidates.map((candidate) => {
  const compressed = fs.readFileSync(path.join(auditRoot, candidate.file));
  const raw = gunzipSync(compressed);
  return {
    candidate,
    compressed,
    raw,
    report: JSON.parse(raw.toString('utf8')) as CalibrationReport,
  };
});
const evidence = loadEvidence(CANDIDATES);
const reports = evidence.map(({ report }) => report);
const historicalCalibrationEvidence = loadEvidence(HISTORICAL_CALIBRATION_CANDIDATES);

const profilePoints = (measurement: SceneMemoryProfileMeasurement) => [
  measurement.precondition,
  ...measurement.cycles,
  measurement.bfcache,
];

const authorityProjection = (
  record: Readonly<Record<string, string | null>>,
  authority: Readonly<Record<string, string>>,
): Record<string, string | null> => Object.fromEntries(
  Object.keys(authority).map((field) => [field, record[field] ?? null]),
);

const collectedProfileProjection = (
  report: CalibrationReport,
): SceneMemoryInput['profiles'] => Object.fromEntries(
  PROFILE_NAMES.map((profile) => [profile, {
    precondition: report.profiles[profile].precondition,
    cycles: report.profiles[profile].cycles,
    bfcache: report.profiles[profile].bfcache,
  }]),
) as SceneMemoryInput['profiles'];

const expectExactBuildInventory = (
  report: CalibrationReport,
  expected: { sha256: string; fileCount: number; filesSha256: string },
): void => {
  expect(report.build).toMatchObject({
    schema: 'cf-v2-scene-memory-build/v1',
    sha256: expected.sha256,
  });
  expect(report.build.files).toHaveLength(expected.fileCount);
  expect(sha256(Buffer.from(JSON.stringify(report.build.files)))).toBe(expected.filesSha256);
};

const CALIBRATION_BUILD = Object.freeze({
  sha256: CALIBRATION_BUILD_SHA256,
  fileCount: CALIBRATION_BUILD_FILE_COUNT,
  filesSha256: CALIBRATION_BUILD_FILES_SHA256,
});
const HISTORICAL_BUILD = Object.freeze({
  sha256: HISTORICAL_BUILD_SHA256,
  fileCount: HISTORICAL_BUILD_FILE_COUNT,
  filesSha256: HISTORICAL_BUILD_FILES_SHA256,
});

const metric = (
  report: CalibrationReport,
  profile: ProfileName,
  field: keyof SceneMemoryBudget,
): number => {
  const value = report.profiles[profile].metrics[field];
  if (typeof value !== 'number') throw new Error(`missing ${profile}.${field} calibration metric`);
  return value;
};

const slope = (values: readonly number[]): number => {
  const xMean = (values.length - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index++) {
    const xDelta = index - xMean;
    numerator += xDelta * (values[index]! - yMean);
    denominator += xDelta * xDelta;
  }
  return numerator / denominator;
};

const metricSummary = (
  measurement: SceneMemoryProfileMeasurement,
): Record<keyof SceneMemoryBudget, number> => {
  const points = [measurement.precondition, ...measurement.cycles, measurement.bfcache];
  const warmAggregates = measurement.cycles.map((point) => point.heap.usedSize
    + point.heap.embedderHeapUsedSize + point.heap.backingStorageSize);
  const warmSlope = Math.max(0, ...[
    measurement.cycles.map((point) => point.heap.usedSize),
    measurement.cycles.map((point) => point.heap.embedderHeapUsedSize),
    measurement.cycles.map((point) => point.heap.backingStorageSize),
    warmAggregates,
  ].map(slope));
  const max = (select: (point: typeof points[number]) => number): number =>
    Math.max(...points.map(select));
  return {
    heapUsedBytesMax: max((point) => point.heap.usedSize),
    embedderHeapUsedBytesMax: max((point) => point.heap.embedderHeapUsedSize),
    backingStorageBytesMax: max((point) => point.heap.backingStorageSize),
    heapAggregateBytesMax: max((point) => point.heap.usedSize
      + point.heap.embedderHeapUsedSize + point.heap.backingStorageSize),
    warmHeapAggregateRangeBytesMax: Math.max(...warmAggregates) - Math.min(...warmAggregates),
    warmHeapSlopeBytesPerCycleMax: warmSlope,
    documentsMax: max((point) => point.dom.documents),
    nodesMax: max((point) => point.dom.nodes),
    jsEventListenersMax: max((point) => point.dom.jsEventListeners),
    peakActiveLeaseCountMax: max((point) => point.registry.peakActiveLeaseCount),
    peakLiveTextureCountMax: max((point) => point.registry.peakLiveTextureCount),
    peakLiveCanvasBytesMax: max((point) => point.registry.peakLiveCanvasBytes),
    managedTextureCountMax: max((point) => point.managedTextureCount),
    managedTexturePixelsMax: max((point) => point.managedTexturePixels),
    localCanvasCacheEntriesMax: max((point) => point.localCanvasCacheEntries),
    peakLocalCanvasCacheEntriesMax: max((point) => point.peakLocalCanvasCacheEntries),
    productRenderTargetsMax: max((point) => point.productRenderTargets),
    ringCacheEntriesMax: max((point) => point.ringCacheEntries),
    peakRingGeometryEntriesMax: max((point) => point.peakRingGeometryEntries),
    targetElapsedMsMax: max((point) => point.answerability.target.elapsedMs),
    heartbeatElapsedMsMax: max((point) => point.answerability.heartbeat.elapsedMs),
  };
};

describe('Arc 1C scene-memory active budget', () => {
  it('locks the heap-only activation to one Edge-family capability/profile authority and producer', () => {
    expect(budget).toEqual({
      schema: 'cf-v2-scene-memory-budget/v3',
      authority: {
        browser: EXPECTED_BROWSER_AUTHORITY,
        producer: EXPECTED_PRODUCER_AUTHORITY,
      },
      profiles: SELECTED_PROFILES,
    });
    expect(Object.keys(budget.profiles.phone)).toEqual(BUDGET_FIELDS);
    expect(Object.keys(budget.profiles.desktop)).toEqual(BUDGET_FIELDS);
    expect(validateSceneMemoryBudget(budget)).toEqual({ ok: true, errors: [] });
  });

  it('changes only the two selected heap ceilings in each profile', () => {
    const changes = PROFILE_NAMES.flatMap((profile) => BUDGET_FIELDS
      .filter((field) => PRE_ACTIVATION_PROFILES[profile][field]
        !== SELECTED_PROFILES[profile][field])
      .map((field) => ({
        profile,
        field,
        before: PRE_ACTIVATION_PROFILES[profile][field],
        after: SELECTED_PROFILES[profile][field],
      })));
    expect(changes).toEqual([
      {
        profile: 'phone',
        field: 'heapUsedBytesMax',
        before: 10485760,
        after: 12582912,
      },
      {
        profile: 'phone',
        field: 'heapAggregateBytesMax',
        before: 16777216,
        after: 18874368,
      },
      {
        profile: 'desktop',
        field: 'heapUsedBytesMax',
        before: 10485760,
        after: 12582912,
      },
      {
        profile: 'desktop',
        field: 'heapAggregateBytesMax',
        before: 16777216,
        after: 18874368,
      },
    ]);
    const currentBudgetSha256 = sha256(fs.readFileSync(budgetPath));
    expect(currentBudgetSha256).toBe(CURRENT_ACTIVATED_BUDGET_SHA256);
    expect(currentBudgetSha256).not.toBe(HISTORICAL_ACTIVATED_BUDGET_SHA256);
    const preActivationBudget = { ...budget, profiles: PRE_ACTIVATION_PROFILES };
    const currentPreActivationSha256 = sha256(Buffer.from(
      `${JSON.stringify(preActivationBudget, null, 2)}\n`,
    ));
    expect(currentPreActivationSha256).toBe(CURRENT_PRE_ACTIVATION_BUDGET_SHA256);
    expect(currentPreActivationSha256).not.toBe(HISTORICAL_PRE_ACTIVATION_BUDGET_SHA256);
  });

  it('negative controls: browser capability and profile authority drift cannot validate', () => {
    for (const field of Object.keys(EXPECTED_BROWSER_AUTHORITY)) {
      const missing = structuredClone(budget) as BudgetRecord;
      delete missing.authority.browser[field];
      expect(validateSceneMemoryBudget(missing).ok, `missing ${field}`).toBe(false);
    }
    for (const [field, value] of [
      ['family', 'google-chrome'],
      ['protocolVersion', '1.2'],
      ['capabilityContractSha256', '0'.repeat(64)],
      ['profileContractSha256', '0'.repeat(64)],
    ] as const) {
      const drifted = structuredClone(budget) as BudgetRecord;
      drifted.authority.browser[field] = value;
      expect(validateSceneMemoryBudget(drifted).ok, `${field} drift`).toBe(false);
    }
    const profileMismatch = structuredClone(budget) as BudgetRecord & {
      profiles: BudgetRecord['profiles'] & { tablet?: SceneMemoryBudget };
    };
    profileMismatch.profiles.tablet = profileMismatch.profiles.phone;
    delete (profileMismatch.profiles as Partial<BudgetRecord['profiles']>).phone;
    expect(validateSceneMemoryBudget(profileMismatch).errors).toContain(
      'budget profiles must be exactly phone and desktop',
    );
  });

  it('binds and independently recomputes all three retained clean candidates', () => {
    expect(reports.map((report) => report.runId)).toEqual(
      CANDIDATES.map(({ runId }) => runId),
    );

    for (const { candidate, compressed, raw, report } of evidence) {
      expect(sha256(compressed), `${candidate.runId} gzip`).toBe(candidate.gzipSha256);
      expect(sha256(raw), `${candidate.runId} raw`).toBe(candidate.rawSha256);
      expect(report.schema).toBe('cf-v2-scene-memory-report/v2');
      expect(report.status).toBe('calibration');
      expect(report.certification).toBe('calibration-only-not-certified');
      expect(report.lifecycle).toEqual({
        schema: 'cf-v2-scene-memory-report-lifecycle/v1',
        status: 'complete',
      });
      expect(report.policy).toEqual({
        attemptCount: 1,
        automaticRetries: 0,
        warmupCycles: 4,
        measuredWarmCycles: 4,
        commandTimeoutMs: 5000,
        targetTimeoutMs: 2000,
        heartbeatTimeoutMs: 2000,
      });
      expect(report.scope).toEqual({
        covered: ['universe', 'galaxy', 'galaxy-fine', 'system', 'surface', 'compendium', 'shipyard'],
        shipyardStatus: 'implemented-static',
        excluded: ['Shipyard build writers', 'audio lifecycle', 'true GPU bytes'],
      });
      expect(report.cleanup).toEqual({ browser: true, server: true, workspaceLock: true });
      expect(report.source.begin).toEqual(report.source.end);
      expect(report.source.begin).toMatchObject({
        commit: CALIBRATION_SOURCE_COMMIT,
        branch: 'openai/mac',
        state: 'committed',
        statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        workingTreeSha256: CLEAN_WORKING_TREE_SHA256,
      });
      expect(report.fixture).toEqual({
        count: 1500,
        rowsSha256: CALIBRATION_PRODUCER_AUTHORITY.fixtureRows,
      });
      expectExactBuildInventory(report, CALIBRATION_BUILD);
      expect(report.inputs.budget).toBeNull();
      expect(report.budget).toEqual({ schema: null, path: null, sha256: null });
      expect(Object.keys(report.inputs).sort()).toEqual(
        [...Object.keys(CALIBRATION_PRODUCER_AUTHORITY), 'budget'].sort(),
      );
      expect(authorityProjection(report.inputs, CALIBRATION_PRODUCER_AUTHORITY)).toEqual(
        CALIBRATION_PRODUCER_AUTHORITY,
      );
      expect(authorityProjection(report.browser, CALIBRATION_EDGE_107_PROVENANCE)).toEqual(
        CALIBRATION_EDGE_107_PROVENANCE,
      );
      expect(report.outcomes).toHaveLength(42);
      expect(report.outcomes.every((outcome) => outcome.pass)).toBe(true);
      expect(report.findings).toEqual([]);
      expect(report.fatalEvents).toEqual([]);
      expect(report.contractInput.schema).toBe('cf-v2-scene-memory-input/v3');
      expect(report.contractInput.profiles).toEqual(collectedProfileProjection(report));
      const recomputed = evaluateSceneMemory(report.contractInput);
      expect(recomputed).toEqual(report.verdict);
      expect(recomputed.status).toBe('pass');
      expect(recomputed.outcomes).toEqual(report.outcomes);
      for (const profile of PROFILE_NAMES) {
        expect(metricSummary(report.profiles[profile])).toEqual(report.profiles[profile].metrics);
      }
    }

    expect(new Set(reports.map((report) => report.startedAt)).size).toBe(3);
    expect(new Set(reports.map((report) => report.source.begin.workingTreeSha256))).toEqual(
      new Set([CLEAN_WORKING_TREE_SHA256]),
    );
    expect(new Set(reports.map((report) => report.build.sha256)))
      .toEqual(new Set([CALIBRATION_BUILD_SHA256]));
    for (const profile of PROFILE_NAMES) {
      expect(new Set(reports.map((report) => report.profiles[profile].targetId)).size).toBe(3);
      expect(new Set(reports.map((report) => report.profiles[profile].documentToken)).size).toBe(3);
    }
  });

  it('preserves the original three calibration carriers as immutable historical evidence', () => {
    const historicalReports = historicalCalibrationEvidence.map(({ report }) => report);
    expect(historicalReports.map((report) => report.runId)).toEqual(
      HISTORICAL_CALIBRATION_CANDIDATES.map(({ runId }) => runId),
    );

    for (const { candidate, compressed, raw, report } of historicalCalibrationEvidence) {
      expect(sha256(compressed), `${candidate.runId} historical gzip`)
        .toBe(candidate.gzipSha256);
      expect(sha256(raw), `${candidate.runId} historical raw`).toBe(candidate.rawSha256);
      expect(report.schema).toBe('cf-v2-scene-memory-report/v2');
      expect(report.status).toBe('calibration');
      expect(report.certification).toBe('calibration-only-not-certified');
      expect(report.lifecycle).toEqual({
        schema: 'cf-v2-scene-memory-report-lifecycle/v1',
        status: 'complete',
      });
      expect(report.policy).toEqual({
        attemptCount: 1,
        automaticRetries: 0,
        warmupCycles: 4,
        measuredWarmCycles: 4,
        commandTimeoutMs: 5000,
        targetTimeoutMs: 2000,
        heartbeatTimeoutMs: 2000,
      });
      expect(report.cleanup).toEqual({ browser: true, server: true, workspaceLock: true });
      expect(report.source.begin).toEqual(report.source.end);
      expect(report.source.begin).toEqual({
        commit: HISTORICAL_CALIBRATION_SOURCE_COMMIT,
        branch: 'openai/mac',
        state: 'committed',
        statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        workingTreeSha256: CLEAN_WORKING_TREE_SHA256,
      });
      expect(report.scope).toEqual({
        covered: ['universe', 'galaxy', 'galaxy-fine', 'system', 'surface', 'compendium', 'shipyard'],
        shipyardStatus: 'implemented-static',
        excluded: ['Shipyard build writers', 'audio lifecycle', 'true GPU bytes'],
      });
      expect(report.fixture).toEqual({
        count: 1500,
        rowsSha256: HISTORICAL_PRODUCER_AUTHORITY.fixtureRows,
      });
      expectExactBuildInventory(report, HISTORICAL_BUILD);
      expect(report.inputs.budget).toBeNull();
      expect(report.budget).toEqual({ schema: null, path: null, sha256: null });
      expect(Object.keys(report.inputs).sort()).toEqual(
        [...Object.keys(HISTORICAL_PRODUCER_AUTHORITY), 'budget'].sort(),
      );
      expect(authorityProjection(report.inputs, HISTORICAL_PRODUCER_AUTHORITY)).toEqual(
        HISTORICAL_PRODUCER_AUTHORITY,
      );
      expect(report.browser).toEqual(HISTORICAL_LOCAL_EDGE_101_PROVENANCE);
      expect(report.contractInput.schema).toBe('cf-v2-scene-memory-input/v3');
      expect(report.contractInput.profiles).toEqual(collectedProfileProjection(report));
      expect(report.outcomes).toHaveLength(42);
      expect(report.outcomes.every((outcome) => outcome.pass)).toBe(true);
      expect(report.findings).toEqual([]);
      expect(report.fatalEvents).toEqual([]);
      for (const profile of PROFILE_NAMES) {
        expect(metricSummary(report.profiles[profile])).toEqual(report.profiles[profile].metrics);
      }
      const replay = evaluateSceneMemory(report.contractInput);
      expect(replay).toEqual(report.verdict);
      expect(replay.status).toBe('pass');
      expect(replay.outcomes).toEqual(report.outcomes);
      expect(replay.failures).toEqual([]);
    }

    expect(new Set(historicalReports.map((report) => report.startedAt)).size).toBe(3);
    expect(new Set(historicalReports.map((report) => report.build.sha256)))
      .toEqual(new Set([HISTORICAL_BUILD_SHA256]));
    for (const profile of PROFILE_NAMES) {
      expect(new Set(historicalReports.map((report) => report.profiles[profile].targetId)).size)
        .toBe(3);
      expect(new Set(
        historicalReports.map((report) => report.profiles[profile].documentToken),
      ).size).toBe(3);
    }
  });

  it('keeps the superseded 250 ms local certificate truthful and historical', () => {
    const compressed = fs.readFileSync(path.join(auditRoot, HISTORICAL_LOCAL_CERTIFICATION.file));
    expect(sha256(compressed)).toBe(HISTORICAL_LOCAL_CERTIFICATION.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(sha256(raw)).toBe(HISTORICAL_LOCAL_CERTIFICATION.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as CalibrationReport;

    expect(report.schema).toBe('cf-v2-scene-memory-report/v2');
    expect(report.runId).toBe(HISTORICAL_LOCAL_CERTIFICATION.runId);
    expect(report.status).toBe('pass');
    expect(report.certification).toBe('contract-budget');
    expect(report.lifecycle).toEqual({
      schema: 'cf-v2-scene-memory-report-lifecycle/v1',
      status: 'complete',
    });
    expect(report.policy).toEqual({
      attemptCount: 1,
      automaticRetries: 0,
      warmupCycles: 4,
      measuredWarmCycles: 4,
      commandTimeoutMs: 5000,
      targetTimeoutMs: 2000,
      heartbeatTimeoutMs: 2000,
    });
    expect(report.cleanup).toEqual({ browser: true, server: true, workspaceLock: true });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toEqual({
      commit: HISTORICAL_LOCAL_CERTIFICATION.sourceCommit,
      branch: 'openai/mac',
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workingTreeSha256: CLEAN_WORKING_TREE_SHA256,
    });
    expect(report.scope).toEqual({
      covered: ['universe', 'galaxy', 'galaxy-fine', 'system', 'surface', 'compendium', 'shipyard'],
      shipyardStatus: 'implemented-static',
      excluded: ['Shipyard build writers', 'audio lifecycle', 'true GPU bytes'],
    });
    expect(report.fixture).toEqual({
      count: 1500,
      rowsSha256: HISTORICAL_PRODUCER_AUTHORITY.fixtureRows,
    });
    expectExactBuildInventory(report, HISTORICAL_BUILD);
    expect(authorityProjection(report.inputs, HISTORICAL_PRODUCER_AUTHORITY)).toEqual(
      HISTORICAL_PRODUCER_AUTHORITY,
    );
    expect(authorityProjection(report.browser, HISTORICAL_EDGE_101_VERSION)).toEqual(
      HISTORICAL_EDGE_101_VERSION,
    );
    expect(report.budget).toEqual({
      schema: 'cf-v2-scene-memory-budget/v2',
      path: '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/budgets/scene-memory-v2.json',
      sha256: HISTORICAL_LOCAL_CERTIFICATION.budgetSha256,
    });
    expect(report.inputs.budget).toBe(HISTORICAL_LOCAL_CERTIFICATION.budgetSha256);
    expect(sha256(fs.readFileSync(budgetPath)))
      .not.toBe(HISTORICAL_LOCAL_CERTIFICATION.budgetSha256);
    expect(report.contractInput.budgets).toEqual(ORIGINAL_250_PROFILES);
    expect(report.contractInput.profiles).toEqual(collectedProfileProjection(report));
    expect(report.outcomes).toHaveLength(42);
    expect(report.outcomes.every((outcome) => outcome.pass)).toBe(true);
    expect(report.findings).toEqual([]);
    expect(report.fatalEvents).toEqual([]);
    for (const profile of PROFILE_NAMES) {
      expect(metricSummary(report.profiles[profile])).toEqual(report.profiles[profile].metrics);
    }
    const recomputed = evaluateSceneMemory(report.contractInput);
    expect(recomputed).toEqual(report.verdict);
    expect(recomputed.status).toBe('pass');
    expect(recomputed.outcomes).toEqual(report.outcomes);
    expect(recomputed.failures).toEqual([]);
    const currentBudgetReplay = evaluateSceneMemory({
      ...report.contractInput,
      budgets: budget.profiles,
    });
    expect(currentBudgetReplay.status).toBe('pass');
    expect(currentBudgetReplay.outcomes).toHaveLength(42);
    expect(currentBudgetReplay.failures).toEqual([]);
  });

  it('preserves the exact clean Edge .101 certificate as historical evidence', () => {
    const compressed = fs.readFileSync(path.join(auditRoot, CURRENT_LOCAL_CERTIFICATION.file));
    expect(sha256(compressed)).toBe(CURRENT_LOCAL_CERTIFICATION.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(sha256(raw)).toBe(CURRENT_LOCAL_CERTIFICATION.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as CalibrationReport;

    expect(report.schema).toBe('cf-v2-scene-memory-report/v2');
    expect(report.runId).toBe(CURRENT_LOCAL_CERTIFICATION.runId);
    expect(report.status).toBe('pass');
    expect(report.certification).toBe('contract-budget');
    expect(report.lifecycle).toEqual({
      schema: 'cf-v2-scene-memory-report-lifecycle/v1',
      status: 'complete',
    });
    expect(report.policy).toEqual({
      attemptCount: 1,
      automaticRetries: 0,
      warmupCycles: 4,
      measuredWarmCycles: 4,
      commandTimeoutMs: 5000,
      targetTimeoutMs: 2000,
      heartbeatTimeoutMs: 2000,
    });
    expect(report.cleanup).toEqual({ browser: true, server: true, workspaceLock: true });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toEqual({
      commit: CURRENT_LOCAL_CERTIFICATION.sourceCommit,
      branch: 'openai/mac',
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workingTreeSha256: CLEAN_WORKING_TREE_SHA256,
    });
    expect(report.scope).toEqual({
      covered: ['universe', 'galaxy', 'galaxy-fine', 'system', 'surface', 'compendium', 'shipyard'],
      shipyardStatus: 'implemented-static',
      excluded: ['Shipyard build writers', 'audio lifecycle', 'true GPU bytes'],
    });
    expect(report.fixture).toEqual({
      count: 1500,
      rowsSha256: HISTORICAL_PRODUCER_AUTHORITY.fixtureRows,
    });
    expectExactBuildInventory(report, HISTORICAL_BUILD);
    expect(authorityProjection(report.inputs, HISTORICAL_PRODUCER_AUTHORITY)).toEqual(
      HISTORICAL_PRODUCER_AUTHORITY,
    );
    expect(authorityProjection(report.browser, HISTORICAL_EDGE_101_VERSION)).toEqual(
      HISTORICAL_EDGE_101_VERSION,
    );
    expect(report.budget).toEqual({
      schema: 'cf-v2-scene-memory-budget/v2',
      path: '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/budgets/scene-memory-v2.json',
      sha256: CURRENT_LOCAL_CERTIFICATION.budgetSha256,
    });
    expect(report.inputs.budget).toBe(CURRENT_LOCAL_CERTIFICATION.budgetSha256);
    expect(sha256(fs.readFileSync(budgetPath))).not.toBe(CURRENT_LOCAL_CERTIFICATION.budgetSha256);
    expect(report.contractInput.budgets).toEqual(PRE_ACTIVATION_PROFILES);
    expect(report.contractInput.profiles).toEqual(collectedProfileProjection(report));
    expect(report.outcomes).toHaveLength(42);
    expect(report.outcomes.every((outcome) => outcome.pass)).toBe(true);
    expect(report.findings).toEqual([]);
    expect(report.fatalEvents).toEqual([]);
    for (const profile of PROFILE_NAMES) {
      expect(metricSummary(report.profiles[profile])).toEqual(report.profiles[profile].metrics);
    }
    const recomputed = evaluateSceneMemory(report.contractInput);
    expect(recomputed).toEqual(report.verdict);
    expect(recomputed.status).toBe('pass');
    expect(recomputed.outcomes).toEqual(report.outcomes);
    expect(recomputed.failures).toEqual([]);
    const currentBudgetReplay = evaluateSceneMemory({
      ...report.contractInput,
      budgets: budget.profiles,
    });
    expect(currentBudgetReplay.status).toBe('pass');
    expect(currentBudgetReplay.outcomes).toHaveLength(42);
    expect(currentBudgetReplay.failures).toEqual([]);
  });

  it('preserves and independently replays the eager-Inventory current-input red as the paired broken baseline', () => {
    const compressed = fs.readFileSync(path.join(auditRoot, CURRENT_INPUT_BROKEN_BASELINE.file));
    expect(sha256(compressed)).toBe(CURRENT_INPUT_BROKEN_BASELINE.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(sha256(raw)).toBe(CURRENT_INPUT_BROKEN_BASELINE.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as CalibrationReport;

    expect(report).toMatchObject({
      schema: 'cf-v2-scene-memory-report/v2',
      runId: CURRENT_INPUT_BROKEN_BASELINE.runId,
      status: 'fail',
      certification: 'contract-budget',
      lifecycle: {
        schema: 'cf-v2-scene-memory-report-lifecycle/v1',
        status: 'complete',
      },
      policy: {
        attemptCount: 1,
        automaticRetries: 0,
        warmupCycles: 4,
        measuredWarmCycles: 4,
      },
      cleanup: { browser: true, server: true, workspaceLock: true },
      source: {
        begin: {
          commit: CURRENT_INPUT_BROKEN_BASELINE.sourceCommit,
          branch: 'openai/mac',
          state: 'committed',
          statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          workingTreeSha256: CLEAN_WORKING_TREE_SHA256,
        },
      },
      browser: {
        product: 'Edg/151.0.4129.107',
        revision: '@419e77616b4ed7d0a544b85cb53ccd5b74d5f135',
        jsVersion: '15.1.23.12',
        protocolVersion: '1.3',
      },
      build: {
        schema: 'cf-v2-scene-memory-build/v1',
        sha256: CURRENT_INPUT_BROKEN_BASELINE.buildSha256,
      },
      budget: {
        schema: 'cf-v2-scene-memory-budget/v3',
        sha256: CURRENT_INPUT_BROKEN_BASELINE.budgetSha256,
      },
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.inputs.budget).toBe(CURRENT_INPUT_BROKEN_BASELINE.budgetSha256);
    expect(report.outcomes.filter(({ pass }) => !pass).map(({ id }) => id)).toEqual([
      'phone/heap-dom-budget',
      'desktop/heap-dom-budget',
    ]);
    expect(report.findings).toEqual([
      'phone/heap-dom-budget: heap or DOM ceiling was exceeded',
      'desktop/heap-dom-budget: heap or DOM ceiling was exceeded',
    ]);
    expect(report.fatalEvents).toEqual([]);
    for (const profile of PROFILE_NAMES) {
      expect(metricSummary(report.profiles[profile])).toEqual(report.profiles[profile].metrics);
    }

    const replay = evaluateSceneMemory({
      ...report.contractInput,
      budgets: budget.profiles,
    });
    expect(replay.status).toBe('fail');
    expect(replay.failures.map(({ id }) => id)).toEqual([
      'phone/heap-dom-budget',
      'desktop/heap-dom-budget',
    ]);
    expect(replay.failures[0]?.message).toContain(
      'nodes 898 exceeded ceiling 704',
    );
    expect(replay.failures[0]?.message).toContain(
      'JS event listeners 90 exceeded ceiling 80',
    );
    expect(replay.failures[1]?.message).toContain(
      'nodes 895 exceeded ceiling 704',
    );
    expect(replay.failures[1]?.message).toContain(
      'JS event listeners 89 exceeded ceiling 80',
    );
    for (const failure of replay.failures) expect(failure.message).not.toMatch(/heap/i);

    const pairedReplay = evaluateSceneMemory({
      ...report.contractInput,
      budgets: Object.fromEntries(PROFILE_NAMES.map((profile) => [profile, {
        ...budget.profiles[profile],
        heapUsedBytesMax: Number.MAX_SAFE_INTEGER,
        heapAggregateBytesMax: Number.MAX_SAFE_INTEGER,
      }])) as typeof budget.profiles,
    });
    expect(pairedReplay.failures.map(({ id }) => id)).toEqual([
      'phone/heap-dom-budget',
      'desktop/heap-dom-budget',
    ]);
    for (const failure of pairedReplay.failures) {
      expect(failure.message).not.toMatch(/heap/i);
      expect(failure.message).toContain('nodes');
      expect(failure.message).toContain('JS event listeners');
    }
  });

  it('retains the exact hosted Linux red and replays only its elapsed ruler green', () => {
    const compressed = fs.readFileSync(path.join(auditRoot, HOSTED_LINUX_FAILURE.file));
    expect(sha256(compressed)).toBe(HOSTED_LINUX_FAILURE.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(sha256(raw)).toBe(HOSTED_LINUX_FAILURE.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as CalibrationReport;

    expect(report).toMatchObject({
      schema: 'cf-v2-scene-memory-report/v2',
      runId: HOSTED_LINUX_FAILURE.runId,
      status: 'fail',
      certification: 'contract-budget',
      lifecycle: {
        schema: 'cf-v2-scene-memory-report-lifecycle/v1',
        status: 'complete',
      },
      policy: {
        attemptCount: 1,
        automaticRetries: 0,
        warmupCycles: 4,
        measuredWarmCycles: 4,
        commandTimeoutMs: 5000,
        targetTimeoutMs: 2000,
        heartbeatTimeoutMs: 2000,
      },
      cleanup: { browser: true, server: true, workspaceLock: true },
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toEqual({
      commit: HOSTED_LINUX_FAILURE.sourceCommit,
      branch: 'detached',
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workingTreeSha256: CLEAN_WORKING_TREE_SHA256,
    });
    expect(report.scope).toEqual({
      covered: ['universe', 'galaxy', 'galaxy-fine', 'system', 'surface', 'compendium', 'shipyard'],
      shipyardStatus: 'implemented-static',
      excluded: ['Shipyard build writers', 'audio lifecycle', 'true GPU bytes'],
    });
    expect(report.fixture).toEqual({
      count: 1500,
      rowsSha256: HISTORICAL_PRODUCER_AUTHORITY.fixtureRows,
    });
    expectExactBuildInventory(report, HISTORICAL_BUILD);
    expect(authorityProjection(report.inputs, HISTORICAL_PRODUCER_AUTHORITY)).toEqual(
      HISTORICAL_PRODUCER_AUTHORITY,
    );
    expect(authorityProjection(report.browser, HISTORICAL_EDGE_101_VERSION)).toEqual(
      HISTORICAL_EDGE_101_VERSION,
    );
    expect(report.browser).toMatchObject({
      executable: '/opt/microsoft/msedge/microsoft-edge',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    });
    expect(report.inputs.budget).toBe(HOSTED_LINUX_FAILURE.originalBudgetSha256);
    expect(report.budget).toMatchObject({
      schema: 'cf-v2-scene-memory-budget/v2',
      path: '/home/runner/work/Celestial-Frontier/Celestial-Frontier/port/v2/budgets/scene-memory-v2.json',
      sha256: HOSTED_LINUX_FAILURE.originalBudgetSha256,
    });
    expect(report.contractInput.budgets).toEqual(ORIGINAL_250_PROFILES);
    expect(report.contractInput.profiles).toEqual(collectedProfileProjection(report));
    const targetTimeoutMs = report.policy.targetTimeoutMs;
    if (typeof targetTimeoutMs !== 'number') throw new Error('hosted report target timeout missing');
    expect(targetTimeoutMs).toBe(2000);
    for (const profile of PROFILE_NAMES) {
      expect(metricSummary(report.profiles[profile])).toEqual(report.profiles[profile].metrics);
    }

    const originalReplay = evaluateSceneMemory(report.contractInput);
    expect(originalReplay).toEqual(report.verdict);
    expect(originalReplay.outcomes).toEqual(report.outcomes);
    expect(report.outcomes).toHaveLength(42);
    expect(report.outcomes.filter((outcome) => outcome.pass)).toHaveLength(40);
    expect(report.outcomes.filter((outcome) => !outcome.pass).map((outcome) => outcome.id))
      .toEqual(['phone/answerability', 'desktop/answerability']);
    expect(report.findings).toEqual([
      'phone/answerability: precondition: target deadline; cycle 1: target deadline; cycle 2: target deadline; cycle 3: target deadline; cycle 4: target deadline; bfcache: target deadline',
      'desktop/answerability: precondition: target deadline; cycle 1: target deadline; cycle 2: target deadline; cycle 3: target deadline; cycle 4: target deadline; bfcache: target deadline',
    ]);
    expect(report.fatalEvents).toEqual([]);

    const expectedTimings = {
      phone: [
        [623.1854850000018, 0.7958199999993667],
        [618.7216800000024, 0.7450379999936558],
        [637.6419119999991, 1.564061999997648],
        [620.9491869999911, 1.0488849999965169],
        [626.3161269999982, 1.0095530000107829],
        [647.2180230000085, 1.5142499999928987],
      ],
      desktop: [
        [498.7795749999932, 0.689792999997735],
        [493.4734289999906, 0.9595790000021225],
        [497.8501930000202, 3.5842219999758527],
        [494.5800139999774, 0.9394709999905899],
        [497.75840200000675, 5.9932020000123885],
        [506.8920119999966, 2.318636999989394],
      ],
    } as const;
    for (const profile of PROFILE_NAMES) {
      const points = profilePoints(report.profiles[profile]);
      expect(points.map((point) => [
        point.answerability.target.elapsedMs,
        point.answerability.heartbeat.elapsedMs,
      ])).toEqual(expectedTimings[profile]);
      for (const point of points) {
        expect(point.answerability.target).toMatchObject({ ok: true, laterTicker: true });
        expect(point.answerability.target.tickerAfter)
          .toBe(point.answerability.target.tickerBefore + 1);
        expect(point.answerability.target.documentTokenAfter)
          .toBe(point.answerability.target.documentTokenBefore);
        expect(point.answerability.target.elapsedMs).toBeGreaterThanOrEqual(250);
        expect(point.answerability.target.elapsedMs).toBeLessThan(targetTimeoutMs);
        expect(point.answerability.heartbeat).toMatchObject({ ok: true, independent: true });
        expect(point.answerability.heartbeat.elapsedMs).toBeLessThan(100);
      }
    }
    expect(report.profiles.phone.metrics.targetElapsedMsMax).toBe(647.2180230000085);
    expect(report.profiles.desktop.metrics.targetElapsedMsMax).toBe(506.8920119999966);
    expect(budget.profiles.phone.targetElapsedMsMax).toBe(1000);
    expect(budget.profiles.desktop.targetElapsedMsMax).toBe(1000);
    expect(budget.profiles.phone.targetElapsedMsMax).toBeLessThan(targetTimeoutMs);

    const repaired = evaluateSceneMemory({ ...report.contractInput, budgets: budget.profiles });
    expect(repaired.status).toBe('pass');
    expect(repaired.outcomes).toHaveLength(42);
    expect(repaired.failures).toEqual([]);
    const originalById = new Map(report.outcomes.map((outcome) => [outcome.id, outcome]));
    expect(repaired.outcomes.filter((outcome) =>
      JSON.stringify(outcome) !== JSON.stringify(originalById.get(outcome.id))).map(({ id }) => id))
      .toEqual(['phone/answerability', 'desktop/answerability']);
    expect(sha256(raw)).toBe(HOSTED_LINUX_FAILURE.rawSha256);

    const targetBoundaryInput = (elapsedMs: number): SceneMemoryInput => {
      const input = structuredClone(report.contractInput);
      input.budgets = structuredClone(budget.profiles);
      for (const profile of PROFILE_NAMES) {
        for (const point of profilePoints(input.profiles[profile])) {
          point.answerability.target.elapsedMs = elapsedMs;
        }
      }
      return input;
    };
    expect(evaluateSceneMemory(targetBoundaryInput(999.999)).status).toBe('pass');
    for (const elapsedMs of [1000, 1000.001]) {
      const boundary = evaluateSceneMemory(targetBoundaryInput(elapsedMs));
      expect(boundary.status, `${elapsedMs} ms boundary`).toBe('fail');
      expect(boundary.outcomes.filter((outcome) => !outcome.pass).map(({ id }) => id))
        .toEqual(['phone/answerability', 'desktop/answerability']);
      expect(boundary.failures).toEqual([
        {
          id: 'phone/answerability',
          pass: false,
          message: 'precondition: target deadline; cycle 1: target deadline; cycle 2: target deadline; cycle 3: target deadline; cycle 4: target deadline; bfcache: target deadline',
        },
        {
          id: 'desktop/answerability',
          pass: false,
          message: 'precondition: target deadline; cycle 1: target deadline; cycle 2: target deadline; cycle 3: target deadline; cycle 4: target deadline; bfcache: target deadline',
        },
      ]);
      const boundaryById = new Map(boundary.outcomes.map((outcome) => [outcome.id, outcome]));
      expect(repaired.outcomes.filter(({ id }) => !id.endsWith('/answerability'))
        .every((outcome) => JSON.stringify(outcome) === JSON.stringify(boundaryById.get(outcome.id))))
        .toBe(true);
    }

    const negativeMutations = [
      (input: SceneMemoryInput) => { input.profiles.phone.precondition.answerability.target.ok = false; },
      (input: SceneMemoryInput) => {
        input.profiles.phone.precondition.answerability.target.laterTicker = false;
        input.profiles.phone.precondition.answerability.target.tickerAfter =
          input.profiles.phone.precondition.answerability.target.tickerBefore;
      },
      (input: SceneMemoryInput) => {
        input.profiles.phone.precondition.answerability.target.documentTokenAfter = 'replacement';
      },
      (input: SceneMemoryInput) => { input.profiles.phone.precondition.answerability.heartbeat.ok = false; },
      (input: SceneMemoryInput) => {
        input.profiles.phone.precondition.answerability.heartbeat.independent = false;
      },
    ];
    for (const mutate of negativeMutations) {
      const input = structuredClone(report.contractInput);
      input.budgets = structuredClone(budget.profiles);
      mutate(input);
      expect(evaluateSceneMemory(input).outcomes
        .find(({ id }) => id === 'phone/answerability')?.pass).toBe(false);
    }
    const retainedMemoryRed = structuredClone(report.contractInput);
    retainedMemoryRed.budgets = structuredClone(budget.profiles);
    retainedMemoryRed.profiles.phone.precondition.pending = 1;
    const memoryVerdict = evaluateSceneMemory(retainedMemoryRed);
    expect(memoryVerdict.status).toBe('fail');
    expect(memoryVerdict.outcomes.some((outcome) =>
      !outcome.pass && outcome.id !== 'phone/answerability')).toBe(true);
  });

  it('replays every candidate green with strict headroom over every observed metric', () => {
    for (const report of reports) {
      const replay = evaluateSceneMemory({
        ...report.contractInput,
        budgets: budget.profiles,
      });
      expect(replay.status, report.runId).toBe('pass');
      expect(replay.outcomes).toHaveLength(42);
      expect(replay.outcomes.every((outcome) => outcome.pass)).toBe(true);
    }

    for (const profile of PROFILE_NAMES) {
      for (const field of BUDGET_FIELDS) {
        const observed = Math.max(...reports.map((report) => metric(report, profile, field)));
        expect(budget.profiles[profile][field], `${profile}.${field}`).toBeGreaterThan(observed);
      }
    }
  });

  it('accepts each activated heap ceiling exactly and rejects the next byte', () => {
    for (const profile of PROFILE_NAMES) {
      const heapUsedExact = structuredClone(reports[0]!.contractInput);
      heapUsedExact.budgets = structuredClone(budget.profiles);
      heapUsedExact.profiles[profile].precondition.heap.usedSize = 12582912;
      heapUsedExact.profiles[profile].precondition.heap.embedderHeapUsedSize = 0;
      heapUsedExact.profiles[profile].precondition.heap.backingStorageSize = 0;
      expect(evaluateSceneMemory(heapUsedExact).status, `${profile} exact V8 heap`).toBe('pass');

      const heapUsedNext = structuredClone(heapUsedExact);
      heapUsedNext.profiles[profile].precondition.heap.usedSize = 12582913;
      const heapUsedVerdict = evaluateSceneMemory(heapUsedNext);
      expect(heapUsedVerdict.failures, `${profile} next V8 heap byte`).toEqual([{
        id: `${profile}/heap-dom-budget`,
        pass: false,
        message: 'precondition: V8 heap used bytes 12582913 exceeded ceiling 12582912',
      }]);

      const aggregateExact = structuredClone(reports[0]!.contractInput);
      aggregateExact.budgets = structuredClone(budget.profiles);
      aggregateExact.profiles[profile].precondition.heap.usedSize = 11534336;
      aggregateExact.profiles[profile].precondition.heap.embedderHeapUsedSize = 4194304;
      aggregateExact.profiles[profile].precondition.heap.backingStorageSize = 3145728;
      expect(evaluateSceneMemory(aggregateExact).status, `${profile} exact aggregate heap`)
        .toBe('pass');

      const aggregateNext = structuredClone(aggregateExact);
      aggregateNext.profiles[profile].precondition.heap.usedSize = 11534337;
      const aggregateVerdict = evaluateSceneMemory(aggregateNext);
      expect(aggregateVerdict.failures, `${profile} next aggregate heap byte`).toEqual([{
        id: `${profile}/heap-dom-budget`,
        pass: false,
        message: 'precondition: aggregate heap bytes 18874369 exceeded ceiling 18874368',
      }]);
    }
  });

  it('negative control: rejects every just-below positive observed ceiling independently', () => {
    for (const profile of PROFILE_NAMES) {
      for (const field of BUDGET_FIELDS) {
        const report = reports.reduce((largest, candidate) => (
          metric(candidate, profile, field) > metric(largest, profile, field)
            ? candidate : largest
        ));
        const observed = metric(report, profile, field);
        if (observed === 0) continue;
        const justBelow = observed > 1 ? observed - 0.5 : observed / 2;
        const replay = evaluateSceneMemory({
          ...report.contractInput,
          budgets: {
            ...budget.profiles,
            [profile]: { ...budget.profiles[profile], [field]: justBelow },
          },
        });
        expect(replay.status, `${profile}.${field}`).toBe('fail');
        expect(replay.outcomes.some((outcome) => !outcome.pass), `${profile}.${field}`).toBe(true);
      }
    }
  });

  it('negative control: rejects the next integer for every calibrated zero field', () => {
    for (const profile of PROFILE_NAMES) {
      const observedZeroFields = BUDGET_FIELDS.filter((field) =>
        reports.every((report) => metric(report, profile, field) === 0));
      expect(observedZeroFields).toEqual(Object.keys(ZERO_POINT_FIELDS));

      for (const field of observedZeroFields) {
        const pointField = ZERO_POINT_FIELDS[field];
        if (!pointField) throw new Error(`missing point mutation for ${field}`);
        expect(budget.profiles[profile][field]).toBe(0.5);
        const input = structuredClone(reports[0]!.contractInput);
        const firstCycle = input.profiles[profile].cycles[0] as unknown as Record<string, number>;
        firstCycle[pointField] = 1;
        const replay = evaluateSceneMemory({ ...input, budgets: budget.profiles });
        expect(replay.status, `${profile}.${field}`).toBe('fail');
      }
    }
  });

  it('negative control: producer drift stays red while compatible Edge versions remain portable', () => {
    const report = reports[0]!;
    const staleProducer = { ...report.inputs, shipyardPreview: '0'.repeat(64) };
    const staleBrowser = { ...report.browser, revision: '@stale' };
    expect(authorityProjection(staleProducer, CALIBRATION_PRODUCER_AUTHORITY)).not.toEqual(
      CALIBRATION_PRODUCER_AUTHORITY,
    );
    expect(sceneMemoryBrowserAuthorityMatches(staleBrowser, EXPECTED_BROWSER_AUTHORITY)).toBe(true);
    expect(sceneMemoryBrowserAuthorityMatches({
      ...report.browser,
      product: 'Edg/999.123.4567.89',
      revision: '@synthetic-future',
      jsVersion: '99.1.2.3',
    }, EXPECTED_BROWSER_AUTHORITY)).toBe(true);
    expect(sceneMemoryBrowserAuthorityMatches({
      ...report.browser, product: 'Chrome/151.0.4129.101',
    }, EXPECTED_BROWSER_AUTHORITY)).toBe(false);
    expect(sceneMemoryBrowserAuthorityMatches({
      ...report.browser, protocolVersion: '1.2',
    }, EXPECTED_BROWSER_AUTHORITY)).toBe(false);
    expect(authorityProjection(report.inputs, CALIBRATION_PRODUCER_AUTHORITY)).toEqual(
      CALIBRATION_PRODUCER_AUTHORITY,
    );
    expect(sceneMemoryBrowserAuthorityMatches(report.browser, EXPECTED_BROWSER_AUTHORITY)).toBe(true);
  });
});
