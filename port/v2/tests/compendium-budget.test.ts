import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import {
  BASELINE_CALIBRATION_EVIDENCE_SCHEMA,
  BROKEN_BASELINE_EXPECTED_FAULTS, BUDGET_SCHEMA, CEILING_FIELDS,
  CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA,
  COMPENDIUM_BROWSER_AUTHORITY_SCHEMA, COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
  COMPENDIUM_CURRENT_CERTIFICATION_REQUIREMENT,
  COMPENDIUM_FIXED_RULER_AUTHORITY_SCHEMA,
  COMPENDIUM_FIXED_RULER_CALIBRATION_STATUS,
  COMPENDIUM_FIXED_RULER_CEILING_SCOPE,
  COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS,
  EXPECTED_OUTCOMES, OUTCOME_IDS, PROFILES, SAMPLE_METRIC_FIELDS,
  calibrationMetrics, candidateCalibrationEvidence,
  compendiumBrowserAuthorityMatches, compendiumBrowserCapabilityInventoryErrors,
  compendiumBudgetBrowserAuthority,
  compendiumMeasurementAuthority, evaluateProfile, reduceCalibrationEvidence,
  validCompendiumBrowserAuthority, validCompendiumFixedRulerAuthority,
  validateBudgetRecord,
} from '../tools/compendiummem-contract.mjs';
import {
  COMPENDIUM_FIXTURE_SPEC_PATH, buildBrokenBaselineProjection,
  buildCompendiumFixture, stableJson,
} from '../tools/compendiummem-fixture.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const budgetPath = path.join(here, '..', 'budgets', 'compendium-memory-v1.json');
const schemaPath = path.join(here, '..', 'budgets', 'compendium-memory-v1.schema.json');
const retainedLinuxReportPath = path.join(
  v2Root, '..', '..', 'audits', 'PR32_LINUX_MEMORY_REPORT_32441023665.json.gz',
);
const latestHostedFailureEvidence = Object.freeze({
  file: 'PR34_COMPENDIUM_GHA_32677088518_FAILURE.json.gz',
  runId: 'gha-32677088518-1-compendiummem',
  sourceCommit: '8fecd69a9f3c9a8073ec893bd9a45e693d99939a',
  budgetSha256: '208af9558317cae7748f01470dd50e608485d4a197212ecd04db823f7c15a424',
  measurementAuthoritySha256: 'cfc40f891e817c54c5b382cd5ef39ff606a0af27e1c142382c19da3d213edf0a',
  collectorSha256: '50c28928c7aac758c2b19d0a7c52de1d05f730d03e293b0d83fa324cdd300cf7',
  producerAuthoritySha256: '5a316197d9aca27967f4e930f43089d2bbe2b9e4a66a40c207ea59c809405d94',
  rawSha256: '544015e9e8e9e09e6ad6e13c5be40e7629f3e5884e55a147c503234a754f45da',
  gzipSha256: 'cc5ed778f402763f34ceb76785f080b56d61f6067033087b6fe1143a492a28c9',
});
const currentUniversePolishFailureEvidence = Object.freeze({
  file: 'COMPENDIUMMEM_CURRENT_INPUT_FAILURE_20260829_002129399.json.gz',
  runId: '20260828-universe-polish-55126af50f3f-compendium',
  sourceCommit: '55126af50f3f7ab7b4eaeee7d81b28f8881c87fa',
  sourceWorkingTreeSha256:
    'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  budgetSha256: '8c03b86cfb6dbcb4052bf17f584fe5a42d108b20495707c66549d4c8f5352ba9',
  measurementAuthoritySha256:
    '3c811274c4f67cf706b621142db2001d614ba6b1a3c3669daf6ce1dacf67b574',
  producerAuthoritySha256:
    'd97370c081e9431170e7b796264015e8784cc2914719785e1f9ba41c56ea8271',
  rawSha256: 'c5adaca207770251b48b3cadf634d80bd03cb55f589814fd3e93c8c635aba5d8',
  gzipSha256: '25292bcd0ff55a32842c0958d25ae9d299c1ef8470ca6dc7269ccdfd1c092716',
  startedAt: '2026-08-29T00:20:42.718Z',
  endedAt: '2026-08-29T00:21:29.399Z',
  durationMs: 46_681,
  failedOutcomeIds: Object.freeze([
    'phone/heap-ceiling',
    'phone/byte-ceiling',
    'desktop/heap-ceiling',
    'desktop/byte-ceiling',
  ]),
  browser: Object.freeze({
    executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    product: 'Edg/151.0.4129.107',
    revision: '@419e77616b4ed7d0a544b85cb53ccd5b74d5f135',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    js_version: '15.1.23.12',
    protocol_version: '1.3',
  }),
});
const historicalQuiescentContractFailureEvidence = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_QUIESCENT_CONTRACT_FAILURE_20260830_2046000.json.gz',
  runId: '20260830-pr35-2046000-compendium-certification',
  sourceCommit: '2046000873f98318c767db53d2ffb2abac71cc94',
  sourceWorkingTreeSha256:
    'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  budgetSha256: '5d7b54235cf9470cd7f2c042612a402f79edda3c91ee2ba83bfbe21126001d49',
  measurementAuthoritySha256:
    '7e9b1e11295ddc5682f9609711422dd3af969a257e3d02cf11848ae8ef6b18b4',
  producerAuthoritySha256:
    '0de7dc1a95ceeb35738d4cb17e7ccd464aab947848a9fe643e7c69355836bf13',
  collectorSha256: 'c13a489d32de9a54807d0a16412d8fbd3063656b3282e28f48d074c58bb3faab',
  outcomeContractSha256:
    'd007074b956cb1d0135653251df3fd4fc6b5aeb45c946bd2e2121c726516ab64',
  speciesArtBuildGraphSha256:
    '1e79e0b0adf302db88cac95f1cc9e8a5ad500dd6da0d5d104d1f5fb9957f3a91',
  rawBytes: 4_798_248,
  rawSha256: '6a2a45bd8f20491900119a43aa907ae73d1206a41ae921be78e446b5c5f9c5ea',
  gzipBytes: 291_948,
  gzipSha256: '8b3456acc98a2ea6b0f061e34a9d71bfd38ae718eb04989fec6b6f36c84e60c2',
  startedAt: '2026-08-30T04:11:05.995Z',
  endedAt: '2026-08-30T04:12:04.207Z',
  durationMs: 58_212,
  failedOutcomeIds: Object.freeze([
    'phone/warm-precondition',
    'desktop/warm-precondition',
  ]),
  browser: Object.freeze({
    executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    product: 'Edg/152.0.4191.53',
    revision: '@4ee8983fdce2559a0ae8f8376934c5ed353035cd',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',
    js_version: '15.2.23.6',
    protocol_version: '1.3',
  }),
});
const currentUniversePolishCandidateEvidence = [
  {
    runId: '20260829-universe-polish-b65fd5d4a1b7-candidate1',
    file: 'ARC1_COMPENDIUM_UNIVERSE_POLISH_CANDIDATE1_20260829.json.gz',
    rawBytes: 8_683_347,
    rawSha256: 'd259ddbee5e621dd7694302601ac4a4576bd31ba39d184f93874c446683a5135',
    gzipBytes: 455_574,
    gzipSha256: '65c9982ee3339d32b493fe26beb72aa35b2d55cece3b35a981852512ee6cacdc',
  },
  {
    runId: '20260829-universe-polish-b65fd5d4a1b7-candidate2',
    file: 'ARC1_COMPENDIUM_UNIVERSE_POLISH_CANDIDATE2_20260829.json.gz',
    rawBytes: 8_577_843,
    rawSha256: '7d36e634b30a75ae70a15a806dc7288b76815c151110377dbb3717121d36972e',
    gzipBytes: 451_313,
    gzipSha256: '855d823ec0a8866e3f69f8542fd8a1c892ca04760341c3b7b9fa36d9caba66e0',
  },
  {
    runId: '20260829-universe-polish-b65fd5d4a1b7-candidate3',
    file: 'ARC1_COMPENDIUM_UNIVERSE_POLISH_CANDIDATE3_20260829.json.gz',
    rawBytes: 8_581_571,
    rawSha256: '7fbd4375d26063a8e000b63fe652cc4d812696255dc5467641332836a7e7c705',
    gzipBytes: 451_208,
    gzipSha256: 'bf1ad07f82c7e3565644162b7d9195289f844e0be360259689800f4ffa8a9d0c',
  },
] as const;
const currentUniversePolishBaselineEvidence = Object.freeze({
  runId: '20260829-universe-polish-b65fd5d4a1b7-baseline1',
  file: 'ARC1_COMPENDIUM_UNIVERSE_POLISH_BASELINE1_SAMPLE_20260829.json.gz',
  rawBytes: 14_756,
  rawSha256: 'fc9afe2499629e9ad16966b0f8da4b370acf056fbd13a2309a1d0a592e5361aa',
  gzipBytes: 2_868,
  gzipSha256: '353c09949f413d3f4a9a7907167151345475877225033df10156e65c71a978c2',
});
const currentSliceRepairCandidateEvidence = [
  {
    runId: '20260826-slice-repair-candidate1',
    file: 'ARC1_COMPENDIUM_SLICE_REPAIR_CANDIDATE1_20260826.json.gz',
    rawSha256: '8af95c3ec84ce547d938e8574dfa8b6e88911e58170bf74a42f8dab6823bbf42',
    gzipSha256: '70026ce3344cd1f49228a212fff1235ef5bf5ef523376e508f0f17912c582bd0',
  },
  {
    runId: '20260826-slice-repair-candidate2',
    file: 'ARC1_COMPENDIUM_SLICE_REPAIR_CANDIDATE2_20260826.json.gz',
    rawSha256: '22e4fbcbb6f72c7d01d58f6387cf8fc58c97071f74a3be4357c370715994b31a',
    gzipSha256: '3cb9eebd3145a84364107b3b77cdc14c3e2706fdab9fbf4ce24d1157fbe29863',
  },
  {
    runId: '20260826-slice-repair-candidate3',
    file: 'ARC1_COMPENDIUM_SLICE_REPAIR_CANDIDATE3_20260826.json.gz',
    rawSha256: '749ba9301817165ebfe734b4fd6afbba29cc5c7cae0b7e6056910e08dd4b4804',
    gzipSha256: 'd9e926c32ef19f457e1b88f7632211979f9997fd7e8b01469c81a4d38bff8901',
  },
] as const;
const currentSliceRepairBaselineEvidence = Object.freeze({
  runId: '20260826-slice-repair-baseline1',
  file: 'ARC1_COMPENDIUM_SLICE_REPAIR_BASELINE1_SAMPLE_20260826.json.gz',
  rawSha256: '229735ac1b2e3c87551515d001b6a0c8d76e67f7f1d286272c1517de98ae4109',
  gzipSha256: '10d54ef58aa051f1eee384ffbf0dcb771f095ef04dbc95a0b6a958449eba91fa',
});
const historicalPhase4CandidateEvidence = [
  {
    runId: '20260826-phase4-candidate3',
    file: 'ARC1_COMPENDIUM_PHASE4_CANDIDATE3_20260826.json.gz',
    rawSha256: 'ae06ead7d67aa3c76da1c7b99dbef7f653da4780c8e21da758d7d1c71445849c',
    gzipSha256: '383a3b1e597f924bfc5107aaccabb7ccd19b7251121481c446ef92d36a2a0a36',
  },
  {
    runId: '20260826-phase4-candidate5',
    file: 'ARC1_COMPENDIUM_PHASE4_CANDIDATE5_20260826.json.gz',
    rawSha256: '9608f835b28c8fadf8899bb014375b7c6546c9c84b2586d3249f75a8a229aa51',
    gzipSha256: '43e3fef9003340a2ac111d63f3af5422d3af9e8fefb4a0ecaadf240a2830b97a',
  },
  {
    runId: '20260826-phase4-candidate6',
    file: 'ARC1_COMPENDIUM_PHASE4_CANDIDATE6_20260826.json.gz',
    rawSha256: '6a3e7d9b7d638a954620e7ba265a3d7787cc8b7f83954533fe215bc282a7931a',
    gzipSha256: '9e2bb5fbeea3665756e070bd0bc68cfe3383416228a4de99749be2b75b12febe',
  },
] as const;
const historicalPhase4BaselineEvidence = Object.freeze({
  runId: '20260826-phase4-baseline1',
  file: 'ARC1_COMPENDIUM_PHASE4_BASELINE1_SAMPLE_20260826.json.gz',
  rawSha256: '24076ba17f0407029e495f56c807ad35fb13c944a4c6bf8f566ec65f136eaec5',
  gzipSha256: 'faae83b7168bb12c9140f3c80be734990f840b3747559a7be690f7d60d15653c',
  sampleSha256: Object.freeze({
    phone: '21b6b72e9679c2362922f2495878fd42ecfd8dd95e2d69de9849cc125fe95426',
    desktop: '49447f67ea294379cbdf5a85a704d87354cca2201a4ab29c49aa663a7aa31b8d',
  }),
});
const historicalCertificationEvidence = Object.freeze({
  file: 'ARC1_COMPENDIUM_FOCUS_SETTLEMENT_CERTIFICATION_20260823.json.gz',
  runId: '20260823-pr33-focus-settlement-certification',
  sourceCommit: 'e8898bf3a12d094eefc99fe188a217d9e60058a0',
  budgetSha256: '28b958678fa2e95bb7b906cb10bd1a422dfe0b52867400e8722fbf6befddb15d',
  rawSha256: 'd1ea225b913c28a2b9110538d064e3df6609582dc94c875f62a622998ac55071',
  gzipSha256: '8e09255b616f9539a8dee5e180df00c8f03d211f3da7eac82529397a6f3b1966',
});
const supersededRowActivationCertificationEvidence = Object.freeze({
  file: 'PR34_COMPENDIUM_ROW_ACTIVATION_CERTIFICATION_20260823.json.gz',
  runId: '20260823-pr34-row-activation-certification',
  sourceCommit: '7de42c6bb02f4c7af26053fa7a4cf45f5fbdc777',
  budgetSha256: '208af9558317cae7748f01470dd50e608485d4a197212ecd04db823f7c15a424',
  rawSha256: 'ea31612f16c978d30a40d8b6465f89e4e6f10f23b35ae996919e5ed0c7656108',
  gzipSha256: '1c6c12faaf984716c31aecb8b1e5c11767ed998892c6bd4eba9f4edf23a0f1eb',
});
const supersededRenderStableCertificationEvidence = Object.freeze({
  file: 'PR34_COMPENDIUM_RENDER_STABLE_CERTIFICATION_20260823.json.gz',
  runId: '20260823-pr34-render-stable-row-certification',
  sourceCommit: 'd21ba26a7efe8a887cbc0887ac132e19787f4abb',
  budgetSha256: 'faa160b39accde00c34edb3005c938bd8bb4fb68a328bbd0a8c7f628c0a98d3d',
  rawSha256: '42753d5ef5df69d7d30db37ae80ee77ab498567e06e868c2967e01cc33d352c9',
  gzipSha256: 'a2ff5b009a187fabdbc71143dac1b33c4f5f609fbb3c3d81c750fb5857593be1',
});
const PROFILE_NAMES = ['phone', 'desktop'] as const;
const HISTORICAL_RULER_MEASUREMENT_AUTHORITY =
  'cb5cd9f86ac99435028f98af800bc0d89de96bd7db88694214d832eed83fb15d';
const RULER_MEASUREMENT_AUTHORITY =
  'cd1586e200daa0c984b4cfd398e9238f732383eda3815b86b2f8085ce292fa78';
/* Refreshed once, after the final app build. It deliberately remains a
   separate constant from the immutable historical ruler above. */
const EXPECTED_MEASUREMENT_AUTHORITY =
  '20a1b773e7eec309de31772c2b1c0a174c0f175cfc798e573f20a53b966aba2e';
const EXPECTED_OUTCOME_CONTRACT_AUTHORITY =
  '1b17df2e4983b44d929acfb16cb3ed79250ad7c9b68e522418a44fb3a58d6692';
const EXPECTED_COLLECTOR_AUTHORITY =
  'a5afcffd2f75e7cc2db1284194bc3eb76bde22bf4a1b4741f5157ce25339df51';
const HISTORICAL_VISUAL_KEY_INSTRUMENT_FAILURE = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_PLANETSIDE_VISUALKEY_INSTRUMENT_FAILURE_20260830_B2EECFB.json.gz',
  runId: '20260830-pr35-settlement-evidence-b2eecfbd9379-compendium-certification',
  sourceCommit: 'b2eecfbd9379f50c25208ca8bcd72501b07e303c',
  measurementAuthoritySha256:
    '326d3b3515512cf84182ffa8bb8c3b87c5cd5e10913644a67ce22a1a9b68e66b',
  outcomeContractSha256:
    '7ac505e156ec45f38b0dedcb57df6b0157efa5f0af56afdae492a0c1f5fc6c24',
  collectorSha256: 'ece4edc132dbb5c8cf252d5b113ab3855f115aba1e921a8dc005ce762d9a7690',
  rawSha256: '461241011d8c0d80585befaf3a25e631019bc0a3cc0f73bf5b02a7957c815f02',
  gzipSha256: 'b973b596870ae4180a4b82fb9357194548be67c4dad9aa3560c9ec1186538027',
});
const UNIVERSE_POLISH_COLLECTOR_AUTHORITY =
  'c13a489d32de9a54807d0a16412d8fbd3063656b3282e28f48d074c58bb3faab';
const HISTORICAL_RULER_COLLECTOR_AUTHORITY =
  '18e05ddf03551e7ec5d8352280ed5ad43fa6bf684f1ebecca1242890e02c3d88';
const HISTORICAL_MEASUREMENT_AUTHORITY =
  '6a961df806e460d6ed02600f5366485d09d0878efa0129960b683cc4037173c7';
const HISTORICAL_RULER_PRODUCER_AUTHORITY =
  'f7c87f2263bdac4014e5f56be5efc5ceeca7fbd2e32e25549a6b9e0260354224';
const RULER_PRODUCER_AUTHORITY =
  'd97370c081e9431170e7b796264015e8784cc2914719785e1f9ba41c56ea8271';
const PREVIOUS_CHANGED_HEAD_PRODUCER_AUTHORITY =
  'dd4e635b18e7585a2ec8d84b64b454e6884f2323999818f43856c313ee9a53aa';
const RULER_PRODUCER_AUTHORITY_RECORD = Object.freeze({
  schema: 'cf-v2-compendium-producer-authority/v1',
  sha256: RULER_PRODUCER_AUTHORITY,
  inputs: Object.freeze({
    index: Object.freeze({
      relativePath: 'index.html',
      sha256: '259c4ad7beff2242c01cedb1376b5b73d3c5e8663d5f322bb05a1c3e236efaa2',
    }),
    owner: Object.freeze({
      relativePath: 'assets/main-kfW1fe9k.js',
      sha256: '5d166994ccf89218f74d56b0bd537310c18353671eb2246f614abd931d3ecffb',
    }),
    worker: Object.freeze({
      relativePath: 'assets/species-art.worker-szNwNYEk.js',
      sha256: 'cebbbb892d71828eef1b5d90e2c601f0f197ba01d080ceb9050ee1f252848cdf',
    }),
    painter: Object.freeze({
      relativePath: 'assets/speciespainter-EmdmLeiA.js',
      sha256: '570cb72699a577bda85502be46b54bcbdec9ffa41df5702bd5cb865f4bf08eba',
    }),
  }),
});
const HISTORICAL_RULER_PRODUCER_AUTHORITY_RECORD = Object.freeze({
  schema: 'cf-v2-compendium-producer-authority/v1',
  sha256: HISTORICAL_RULER_PRODUCER_AUTHORITY,
  inputs: Object.freeze({
    index: Object.freeze({
      relativePath: 'index.html',
      sha256: '63e07c250141fc25f88a368e4983b15384ae881401c8f93811a8713a537f2395',
    }),
    owner: Object.freeze({
      relativePath: 'assets/main-DZUgE3Xi.js',
      sha256: '8300b53a3300aeff0e2d3916830eaa247164645cbf37a0754a2a48b3c07c9fc5',
    }),
    worker: Object.freeze({
      relativePath: 'assets/species-art.worker-MsuHQ8El.js',
      sha256: '85f4fdf2e8214814466735d3b4f2abbe3b7c7bb601ebe40034dd9ab06d2d7c28',
    }),
    painter: Object.freeze({
      relativePath: 'assets/speciespainter-Bt9w5VDj.js',
      sha256: '85b8e2eae90b245e3d4f03bab6d9cbbe8d1a1baaaf05ba51a719a2ec06807b04',
    }),
  }),
});
/* Refreshed once, after the final app build. Historical samples continue to
   bind their explicit historical producer authorities rather than these live authorities. */
const EXPECTED_PRODUCER_AUTHORITY =
  'af74148c97a41a421592baee801611787f065c60a64bf6da38985bf00bdd79c7';
const EXPECTED_PRODUCER_AUTHORITY_RECORD = Object.freeze({
  schema: 'cf-v2-compendium-producer-authority/v2',
  sha256: EXPECTED_PRODUCER_AUTHORITY,
  inputs: Object.freeze({
    index: Object.freeze({
      relativePath: 'index.html',
      sha256: 'fb55549a2d16716eb431d13f711489f65ec3f712f5ee4e4baaae551f177a4713',
    }),
    owner: Object.freeze({
      relativePath: 'assets/main-B4SvWr2V.js',
      sha256: 'a5a392115cf5505ca90198fb8f91a5f9b90cf70d479672cbcc7ec1d4045bf4ff',
    }),
    worker: Object.freeze({
      relativePath: 'assets/species-art.worker-DnnSDKMy.js',
      sha256: '25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172',
    }),
    painter: Object.freeze({
      relativePath: 'assets/species-art.worker-DnnSDKMy.js',
      sha256: '25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172',
    }),
    serviceWorker: Object.freeze({
      relativePath: 'service-worker.js',
      sha256: '306445aa7b96b4567d4bacb572abd07307e0e373cabdc62f4c85b0d1bac863ed',
    }),
  }),
});
const HISTORICAL_PHASE4_PRODUCER_AUTHORITY = Object.freeze({
  schema: 'cf-v2-compendium-producer-authority/v1',
  sha256: '587d3bdfab471370e625c71d1658e391067881fe824ce14ccfaf7200eb6e4d73',
  inputs: Object.freeze({
    index: Object.freeze({
      relativePath: 'index.html',
      sha256: '19b739e6ce6ca390b1e7d7a8486fc37551987e7178b1a8e2ac0a28c8e03f2600',
    }),
    owner: Object.freeze({
      relativePath: 'assets/main-I89vYRzv.js',
      sha256: '89861d67f9b130dcf55fa24c076f76bff4c90335b4b64419374b0f1e3c08c6b0',
    }),
    worker: Object.freeze({
      relativePath: 'assets/species-art.worker-MsuHQ8El.js',
      sha256: '85f4fdf2e8214814466735d3b4f2abbe3b7c7bb601ebe40034dd9ab06d2d7c28',
    }),
    painter: Object.freeze({
      relativePath: 'assets/speciespainter-Bt9w5VDj.js',
      sha256: '85b8e2eae90b245e3d4f03bab6d9cbbe8d1a1baaaf05ba51a719a2ec06807b04',
    }),
  }),
});
type BrowserAuthority = {
  schema: string;
  scope: string;
  family: string;
  protocolVersion: string;
  capabilityContract: string;
  capabilityContractSha256: string;
};
const EXPECTED_BROWSER_AUTHORITY: BrowserAuthority = {
  schema: COMPENDIUM_BROWSER_AUTHORITY_SCHEMA,
  scope: COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
  family: 'microsoft-edge',
  protocolVersion: '1.3',
  capabilityContract: 'cf-v2-compendium-cdp-capabilities/v1',
  capabilityContractSha256: '35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341',
};
const HISTORICAL_BROWSER_AUTHORITY: BrowserAuthority = Object.freeze({
  ...EXPECTED_BROWSER_AUTHORITY,
  capabilityContractSha256:
    '6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476',
});
type LegacyBrowserAuthority = {
  schema: 'cf-v2-compendium-browser-authority/v1';
  scope: 'arc1a-compendium-memory-only';
  product: string;
  revision: string;
  jsVersion: string;
  protocolVersion: string;
};
const HISTORICAL_EDGE_101_BROWSER_AUTHORITY: LegacyBrowserAuthority = Object.freeze({
  schema: 'cf-v2-compendium-browser-authority/v1',
  scope: 'arc1a-compendium-memory-only',
  product: 'Edg/151.0.4129.101',
  revision: '@cc1d9f4080fd9140611a9600b8d1615db310105d',
  jsVersion: '15.1.23.9',
  protocolVersion: '1.3',
});
const HISTORICAL_EDGE_101_PRODUCER_AUTHORITY =
  '5a316197d9aca27967f4e930f43089d2bbe2b9e4a66a40c207ea59c809405d94';
const EXPECTED_CANDIDATE_RUNS = [
  '20260829-universe-polish-b65fd5d4a1b7-candidate1',
  '20260829-universe-polish-b65fd5d4a1b7-candidate2',
  '20260829-universe-polish-b65fd5d4a1b7-candidate3',
] as const;
const EXPECTED_BASELINE_RUN = '20260829-universe-polish-b65fd5d4a1b7-baseline1';
const historicalSliceRepairCertificationEvidence = Object.freeze({
  file: 'ARC1_COMPENDIUM_SLICE_REPAIR_CERTIFICATION_20260826.json.gz',
  runId: '20260826-slice-repair-certification',
  sourceCommit: '91f4e04410b893c43ee5d261ebfc1fa3be127c29',
  sourceWorkingTreeSha256:
    'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  budgetSha256: '6284a394664c1039c9aca3f3c6d6dc5caf55295a58f4ac1e361974d3b519de52',
  measurementAuthoritySha256:
    'cb5cd9f86ac99435028f98af800bc0d89de96bd7db88694214d832eed83fb15d',
  producerAuthoritySha256:
    'f7c87f2263bdac4014e5f56be5efc5ceeca7fbd2e32e25549a6b9e0260354224',
  rawSha256: '81c27ed5caa12e0c114a788041dfc5d109742bb9d86a256b548a8e9443d46108',
  gzipSha256: '6f3deb0ff3d748c7477c98c094684a3f1a04eb2ac3ffc89a055ec1c372710571',
  startedAt: '2026-08-26T23:42:19.150Z',
  endedAt: '2026-08-26T23:43:03.997Z',
  durationMs: 44_847,
  browser: Object.freeze({
    executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    product: 'Edg/151.0.4129.107',
    revision: '@419e77616b4ed7d0a544b85cb53ccd5b74d5f135',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    js_version: '15.1.23.12',
    protocol_version: '1.3',
  }),
});
const historicalPhase4CertificationEvidence = Object.freeze({
  file: 'ARC1_COMPENDIUM_PHASE4_CERTIFICATION_20260826.json.gz',
  runId: '20260826-phase4-certification',
  sourceCommit: 'd33e540f0d620eac34bdc259b7814db0f11a9006',
  sourceWorkingTreeSha256:
    'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  budgetSha256: 'f4627dbc8e90d93fade801c5bbeb9f8f28146d5b7814e528647119cdeef94116',
  measurementAuthoritySha256:
    'cb5cd9f86ac99435028f98af800bc0d89de96bd7db88694214d832eed83fb15d',
  producerAuthoritySha256:
    '587d3bdfab471370e625c71d1658e391067881fe824ce14ccfaf7200eb6e4d73',
  rawSha256: '3afe41034c78c11e1e59eeeff542e00f21a155f99bfc752afea8736a0eddffcd',
  gzipSha256: '5677d9ed26cef8be087a87b61fca49aa0ef22d1dd273ed1993a5880079173d70',
  startedAt: '2026-08-26T21:26:17.712Z',
  endedAt: '2026-08-26T21:27:02.805Z',
  durationMs: 45_093,
  browser: Object.freeze({
    executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    product: 'Edg/151.0.4129.107',
    revision: '@419e77616b4ed7d0a544b85cb53ccd5b74d5f135',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    js_version: '15.1.23.12',
    protocol_version: '1.3',
  }),
});

type ProfileName = typeof PROFILE_NAMES[number];
type CalibrationSample = {
  runId: string;
  commit: string;
  workingTreeDigest: string;
  inputDigest: string;
  measurementAuthoritySha256: string;
  producerAuthoritySha256?: string;
  sourceState: string;
  sourceChanged: boolean;
  fixtureRowsSha256: string;
  measuredAt: string;
  browser: {
    executable: string;
    product: string;
    revision: string;
    userAgent: string;
    jsVersion: string;
    protocolVersion: string;
  };
  metrics: Record<string, number>;
  evidence: { schema: string };
  observedFaults?: string[];
};
type ProfileCeiling = { rationale: string; [field: string]: string | number };
type ActiveBudgetRecord = {
  status: string;
  browserAuthority: BrowserAuthority;
  measurementAuthority: { sha256: string };
  producerAuthority: { sha256: string };
  calibration: {
    requiredIndependentRunsPerProfile: number;
    selectionRule: string;
    rulerAuthority: {
      schema: string;
      calibrationStatus: string;
      ceilingScope: string;
      measurementAuthoritySha256: string;
      producerAuthoritySha256: string;
      currentCertification: string;
    };
    samples: Record<ProfileName, CalibrationSample[]>;
  };
  pairedBrokenBaseline: {
    status: string;
    commit: string;
    collectorCommit: string | null;
    samples: Record<ProfileName, CalibrationSample[]>;
  };
  ceilings: Record<ProfileName, ProfileCeiling> | null;
};
type RetainedLinuxOutcome = {
  id: string;
  status: string;
  diagnosis?: string;
  evidence?: {
    warmHeapAggregateRange?: number;
    observed?: { portraitEncodedBytesMax?: number };
  };
};
type RetainedLinuxReport = {
  schema: string;
  runId: string;
  status: string;
  source: {
    begin: Record<string, string>;
    end: Record<string, string>;
  };
  inputs: Record<string, string>;
  browser: Record<string, string>;
  budget: {
    status: string;
    path: string;
    sha256: string;
    browserAuthority: BrowserAuthority;
    browserAuthorityMatch: boolean;
    producerAuthority: Record<string, unknown>;
    observedProducerAuthority: Record<string, unknown>;
    producerAuthorityMatch: boolean;
  };
  policy: Record<string, number>;
  lifecycle: { schema: string; status: string };
  outcomes: RetainedLinuxOutcome[];
  findings: string[];
  profiles: Record<ProfileName, Parameters<typeof evaluateProfile>[0]>;
  partialFailure: null;
  blockedOutcomes: string[];
};

const EXPECTED_SAMPLE_OBJECT_SHA256: Record<ProfileName, {
  candidate: readonly string[]; baseline: string;
}> = {
  phone: {
    candidate: [
      '5e14d624dffb03c19412c9a0dbaf942b2bddc6792cfe544edb8b9c0e96cc91c7',
      '133ec04a7866a3ece9409d3690e8605e3e66554cbec891e403db51d4c902ff01',
      '589fe304042f7f13177d65680b538b787aac7494ef543ffc796e6c23dff4e442',
    ],
    baseline: '53f86ca7f9c7ae1b7ba65c98aa191fad7660e554a5e3d18ac2e90e16ab58cc65',
  },
  desktop: {
    candidate: [
      'c06c186b227b081f189c5f91bfd695f0fe25fc1741b5196fe2a6a0e78f329e42',
      'b44f836517c62f2969c0daf690e740532daa91a0dc70e1ae5f43eb61889236ce',
      'a9b5aa27d37ca24b60c408bae7f98c6c7d8a1e02ebcd13ffc9fa45d55397656c',
    ],
    baseline: '2a83265d99d9792fcd00a75acf3ab83c051863a274750a61a4db6f4d0e677be2',
  },
};

const EXPECTED_CEILINGS: Record<ProfileName, Record<string, number>> = {
  phone: {
    mountedRowsMax: 16,
    heapUsedBytesMax: 11_534_336,
    documentsMax: 2.5,
    nodesMax: 960,
    embedderHeapUsedBytesMax: 4_194_304,
    backingStorageBytesMax: 5_242_880,
    heapAggregateBytesMax: 17_825_792,
    jsEventListenersMax: 96,
    liveCacheEntriesMax: 96.5,
    liveDecodedPixelsMax: 1_672_705,
    liveDecodedBytesMax: 6_690_817,
    liveEncodedBytesMax: 3_407_872,
    queuedJobsPeakMax: 24,
    activeJobsPeakMax: 1.5,
    liveLeasesMax: 24,
    liveSubscribersMax: 0.5,
    livePortraitCacheEntriesMax: 1.5,
    livePortraitEncodedBytesMax: 393_216,
    warmHeapAggregateRangeBytesMax: 524_288,
    warmEncodedBytesRangeMax: 0.5,
  },
  desktop: {
    mountedRowsMax: 16,
    heapUsedBytesMax: 15_728_640,
    documentsMax: 2.5,
    nodesMax: 960,
    embedderHeapUsedBytesMax: 4_194_304,
    backingStorageBytesMax: 6_815_744,
    heapAggregateBytesMax: 23_068_672,
    jsEventListenersMax: 96,
    liveCacheEntriesMax: 256.5,
    liveDecodedPixelsMax: 4_460_545,
    liveDecodedBytesMax: 17_842_177,
    liveEncodedBytesMax: 8_912_896,
    queuedJobsPeakMax: 24,
    activeJobsPeakMax: 1.5,
    liveLeasesMax: 24,
    liveSubscribersMax: 0.5,
    livePortraitCacheEntriesMax: 1.5,
    livePortraitEncodedBytesMax: 393_216,
    warmHeapAggregateRangeBytesMax: 524_288,
    warmEncodedBytesRangeMax: 0.5,
  },
};

const RETAINED_LINUX_COMPATIBILITY = Object.freeze({
  runId: '32441023665',
  reportRunId: 'gha-32441023665-1-compendiummem',
  reportSha256: 'a486fe8eb96e9f00cbd3df486079deaa4e9e0987bed01ae870bf2201cbd47e36',
  gzipSha256: 'a3b67e70881b725266a0fb669f027b51141967a4ff2193e011ed3b1d124a0916',
  originalBudgetSha256: '546d3a817073e42910b496895734ae2a01bb4c633af2780ecde1b1ef6570b292',
  source: Object.freeze({
    commit: 'ff38629db5dfb3936c8d0926cfee125f905e2a7b',
    branch: 'detached',
    state: 'committed',
    statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  }),
  phone: Object.freeze({
    warmHeapAggregateRangeBytes: 97_320,
    livePortraitEncodedBytes: 220_530,
  }),
  desktop: Object.freeze({
    livePortraitEncodedBytes: 220_530,
  }),
});
const RETAINED_LINUX_BROWSER_AUTHORITY: LegacyBrowserAuthority = Object.freeze({
  schema: 'cf-v2-compendium-browser-authority/v1',
  scope: COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
  product: 'Edg/151.0.4129.86',
  revision: '@083e754915c9ab93da1d8f7b9c860e4520273900',
  jsVersion: '15.1.23.7',
  protocolVersion: '1.3',
});
const RETAINED_LINUX_PRODUCER_AUTHORITY =
  'd32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900';
const RETAINED_LINUX_COLLECTOR_AUTHORITY =
  '0c7ec3ba5b41f7ee0766c6986a27e75b3c22c00009419fbf540d4de280d6315b';
const RETAINED_LINUX_MEASUREMENT_AUTHORITY =
  '23aacc2cda6b46ae022c7cfaac70929fb2cd1f310fa846208bd5b2486c2c5b92';

function sampleObjectSha256(sample: CalibrationSample): string {
  return createHash('sha256').update(JSON.stringify(sample)).digest('hex');
}

function fileSha256(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function currentMeasurementAuthority(fixtureRowsSha256: string) {
  return compendiumMeasurementAuthority({
    fixtureSpec: fileSha256(COMPENDIUM_FIXTURE_SPEC_PATH),
    fixtureRows: fixtureRowsSha256,
    fixtureGenerator: fileSha256(path.join(v2Root, 'tools', 'compendiummem-fixture.mjs')),
    budgetSchema: fileSha256(schemaPath),
    outcomeContract: fileSha256(path.join(v2Root, 'tools', 'compendiummem-contract.mjs')),
    collector: fileSha256(path.join(v2Root, 'tools', 'compendiummem.mjs')),
    browserCdp: fileSha256(path.join(v2Root, 'tools', 'browsercdp.mjs')),
    browserPath: fileSha256(path.join(v2Root, 'tools', 'browserpath.mjs')),
    workspaceLock: fileSha256(path.join(v2Root, 'tools', 'workspacelock.mjs')),
    package: fileSha256(path.join(v2Root, 'package.json')),
    packageLock: fileSha256(path.join(v2Root, 'package-lock.json')),
    appPackage: fileSha256(path.join(v2Root, 'apps', 'game', 'package.json')),
    baselineSaveFixtures: fileSha256(path.join(
      v2Root, '..', 'baseline-v1.8.9', 'save-fixtures.json',
    )),
    speciesArtBuildGraph: fileSha256(path.join(v2Root, 'tools', 'speciesart-build.mjs')),
    outcomeInventory: createHash('sha256').update(stableJson(EXPECTED_OUTCOMES)).digest('hex'),
  });
}

function authorityKey(sample: CalibrationSample): string {
  const { product, revision, jsVersion, protocolVersion } = sample.browser;
  return [product, revision, jsVersion, protocolVersion].join('\0');
}

function rawBrowserForAuthority(
  authority: BrowserAuthority,
  provenance: Partial<Record<'product' | 'revision' | 'jsVersion' | 'protocolVersion', string>> = {},
): Record<string, string> {
  return {
    executable: '/isolated/microsoft-edge',
    product: provenance.product ?? 'Edg/151.0.4129.101',
    revision: provenance.revision ?? '@cc1d9f4080fd9140611a9600b8d1615db310105d',
    userAgent: 'host-specific user agent',
    jsVersion: provenance.jsVersion ?? '15.1.23.9',
    protocolVersion: provenance.protocolVersion ?? authority.protocolVersion,
  };
}

function strictHeadroomFailures(record: ActiveBudgetRecord): string[] {
  if (!record.ceilings) return ['ceilings'];
  const failures: string[] = [];
  for (const profile of PROFILE_NAMES) {
    for (const [index, ceilingField] of CEILING_FIELDS.entries()) {
      const sampleField = SAMPLE_METRIC_FIELDS[index];
      if (!sampleField) throw new Error(`missing sample metric for ${ceilingField}`);
      const measuredMax = Math.max(...record.calibration.samples[profile]
        .map((sample) => sample.metrics[sampleField] ?? Number.POSITIVE_INFINITY));
      const ceiling = record.ceilings[profile][ceilingField];
      if (typeof ceiling !== 'number' || !(ceiling > measuredMax)) {
        failures.push(`${profile}.${ceilingField}`);
      }
    }
  }
  return failures;
}

describe('Arc 1A Compendium budget authority', () => {
  const fixture = buildCompendiumFixture();
  const baselineProjection = buildBrokenBaselineProjection(fixture);
  const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8')) as Record<string, unknown>;
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as Record<string, unknown>;
  const activeBudget = budget as unknown as ActiveBudgetRecord;
  const liveMeasurementAuthority = currentMeasurementAuthority(fixture.rowsSha256);

  it('owns a strict v2 record and schema bound to the sealed 1,500-row input', () => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.additionalProperties).toBe(false);
    expect(budget.schema).toBe(BUDGET_SCHEMA);
    expect(budget.browserAuthority).toEqual(EXPECTED_BROWSER_AUTHORITY);
    expect(compendiumBudgetBrowserAuthority(budget)).toEqual(EXPECTED_BROWSER_AUTHORITY);
    expect(liveMeasurementAuthority?.sha256).toBe(EXPECTED_MEASUREMENT_AUTHORITY);
    expect(budget.measurementAuthority).toEqual(liveMeasurementAuthority);
    expect(budget.producerAuthority).toEqual(EXPECTED_PRODUCER_AUTHORITY_RECORD);
    expect(validateBudgetRecord(
      budget, fixture.rowsSha256, baselineProjection.rowsSha256, liveMeasurementAuthority,
      EXPECTED_PRODUCER_AUTHORITY_RECORD,
    ))
      .toEqual({ ok: true, errors: [] });
    expect((budget.pairedBrokenBaseline as { projectionRowsSha256: string }).projectionRowsSha256)
      .toBe(baselineProjection.rowsSha256);
  });

  it('retains the exact hosted render-boundary failure and its passive-poll diagnosis', () => {
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', latestHostedFailureEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(latestHostedFailureEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(latestHostedFailureEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as {
      schema: string; runId: string; status: string;
      lifecycle: { schema: string; status: string };
      source: { begin: Record<string, string>; end: Record<string, string> };
      inputs: Record<string, string>;
      browser: Record<string, string>;
      budget: {
        sha256: string; browserAuthorityMatch: boolean; producerAuthorityMatch: boolean;
        producerAuthority: { sha256: string }; observedProducerAuthority: unknown;
      };
      outcomes: unknown[]; findings: string[]; blockedOutcomes: string[];
      partialFailure: {
        classification: string; profile: string; lastCompletedStage: string;
        failingStage: string; command: Record<string, any>;
      };
      profiles: Record<string, {
        completedStages: string[]; commandLedger: Array<Record<string, any>>;
      }>;
    };
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: latestHostedFailureEvidence.runId,
      status: 'product-unanswerable',
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toMatchObject({
      commit: latestHostedFailureEvidence.sourceCommit,
      branch: 'detached', state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    expect(report.inputs.budget).toBe(latestHostedFailureEvidence.budgetSha256);
    expect(report.inputs.collector).toBe(latestHostedFailureEvidence.collectorSha256);
    expect(compendiumMeasurementAuthority(report.inputs)?.sha256)
      .toBe(latestHostedFailureEvidence.measurementAuthoritySha256);
    expect(report.browser).toMatchObject({
      product: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.product,
      revision: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.revision,
      js_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.jsVersion,
      protocol_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.protocolVersion,
    });
    expect(report.budget).toMatchObject({
      sha256: latestHostedFailureEvidence.budgetSha256,
      browserAuthorityMatch: true, producerAuthorityMatch: true,
      producerAuthority: { sha256: latestHostedFailureEvidence.producerAuthoritySha256 },
    });
    expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
    expect(report.outcomes).toEqual([]);
    expect(report.blockedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.findings).toEqual([
      'product: desktop row cmem-0777-filter-beacon: target Runtime.evaluate missed the 51ms deadline while the root heartbeat remained timely',
    ]);
    expect(report.partialFailure).toMatchObject({
      classification: 'product-unanswerable', profile: 'desktop',
      lastCompletedStage: 'pre-detail Back anchor',
      failingStage: 'row cmem-0777-filter-beacon',
      command: {
        label: 'row cmem-0777-filter-beacon', timeoutMs: 51,
        target: { status: 'rejected', timely: false },
        heartbeat: { status: 'fulfilled', timely: true },
      },
    });
    const desktop = report.profiles.desktop!;
    expect(desktop.completedStages).toContain('row cmem-0777-filter-beacon activation receipt');
    expect(desktop.completedStages).toContain('440 detail');
    expect(desktop.completedStages).toContain('settled scroll visibility 777');
    const failedPhaseDeadline = report.partialFailure.command.phaseDeadlineMs;
    const passivePhase = desktop.commandLedger.filter((command) =>
      command.label === 'row cmem-0777-filter-beacon'
      && command.phaseDeadlineMs === failedPhaseDeadline);
    expect(passivePhase).toHaveLength(112);
    expect(passivePhase.slice(0, -1).every((command) =>
      command.target.status === 'fulfilled' && command.target.timely === true)).toBe(true);
    expect(passivePhase.at(-1)).toEqual(report.partialFailure.command);
    expect(report.partialFailure.command.target.durationMs).toBeCloseTo(51.791665, 5);
    expect(report.partialFailure.command.heartbeat.durationMs).toBeCloseTo(2.386498, 5);
  });

  it('retains the exact universe-polish budget red as historical non-sample evidence', () => {
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', currentUniversePolishFailureEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(currentUniversePolishFailureEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(currentUniversePolishFailureEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as {
      schema: string; runId: string; status: string; startedAt: string; endedAt: string;
      durationMs: number; lifecycle: { schema: string; status: string };
      policy: Record<string, number>;
      source: { begin: Record<string, string>; end: Record<string, string> };
      inputs: Record<string, string>; browser: Record<string, string>;
      budget: {
        status: string; path: string; sha256: string;
        browserAuthority: BrowserAuthority; browserAuthorityMatch: boolean;
        producerAuthority: Record<string, unknown>;
        observedProducerAuthority: Record<string, unknown>;
        producerAuthorityMatch: boolean;
      };
      expectedOutcomes: string[];
      outcomes: Array<{ id: string; status: string }>;
      findings: string[]; blockedOutcomes: string[]; partialFailure: unknown;
    };
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: currentUniversePolishFailureEvidence.runId,
      status: 'fail',
      startedAt: currentUniversePolishFailureEvidence.startedAt,
      endedAt: currentUniversePolishFailureEvidence.endedAt,
      durationMs: currentUniversePolishFailureEvidence.durationMs,
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      policy: {
        attemptCount: 1,
        automaticRetries: 0,
        commandTimeoutMs: 2_000,
        targetTimeoutMs: 2_000,
        heartbeatTimeoutMs: 2_000,
        transportTimeoutMs: 5_000,
      },
      blockedOutcomes: [],
      partialFailure: null,
    });
    expect(report.source.begin).toEqual({
      commit: currentUniversePolishFailureEvidence.sourceCommit,
      branch: 'openai/mac',
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workingTreeSha256: currentUniversePolishFailureEvidence.sourceWorkingTreeSha256,
    });
    expect(report.source.end).toEqual(report.source.begin);
    expect(report.inputs.budget).toBe(currentUniversePolishFailureEvidence.budgetSha256);
    expect(report.inputs.collector).toBe(UNIVERSE_POLISH_COLLECTOR_AUTHORITY);
    expect(compendiumMeasurementAuthority(report.inputs)?.sha256)
      .toBe(currentUniversePolishFailureEvidence.measurementAuthoritySha256);
    expect(report.budget).toEqual({
      status: 'active',
      path: 'budgets/compendium-memory-v1.json',
      sha256: currentUniversePolishFailureEvidence.budgetSha256,
      browserAuthority: HISTORICAL_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthority: RULER_PRODUCER_AUTHORITY_RECORD,
      observedProducerAuthority: RULER_PRODUCER_AUTHORITY_RECORD,
      producerAuthorityMatch: true,
    });
    expect(report.budget.producerAuthority).toMatchObject({
      sha256: currentUniversePolishFailureEvidence.producerAuthoritySha256,
    });
    expect(report.browser).toEqual(currentUniversePolishFailureEvidence.browser);
    expect(compendiumBrowserAuthorityMatches(
      report.browser, report.budget.browserAuthority,
    )).toBe(true);
    expect(report.expectedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.filter((outcome) => outcome.status === 'pass')).toHaveLength(74);
    expect(report.outcomes.filter((outcome) => outcome.status === 'fail')
      .map((outcome) => outcome.id)).toEqual(
      currentUniversePolishFailureEvidence.failedOutcomeIds,
    );
    expect(report.outcomes.every((outcome) => ['pass', 'fail'].includes(outcome.status)))
      .toBe(true);
    expect(report.findings).toHaveLength(4);
    expect(activeBudget.status).toBe('active');
    expect(activeBudget.calibration.selectionRule)
      .toContain(currentUniversePolishFailureEvidence.runId);
    expect(activeBudget.calibration.selectionRule)
      .toContain(currentUniversePolishFailureEvidence.rawSha256);
    expect(activeBudget.calibration.selectionRule)
      .toContain(currentUniversePolishFailureEvidence.gzipSha256);
    expect(PROFILE_NAMES.flatMap((profile) => [
      ...activeBudget.calibration.samples[profile],
      ...activeBudget.pairedBrokenBaseline.samples[profile],
    ]).map((sample) => sample.runId)).not.toContain(currentUniversePolishFailureEvidence.runId);
  });

  it('retains the exact PR35 quiescent-contract red without relabeling it as a sample', () => {
    type WarmSnapshot = {
      diagnostics: {
        panel: { open: boolean; mode: string };
        window: {
          start: number; end: number; overscan: number; beforePx: number; afterPx: number;
          mountedRowCount: number; mountedLogicalIds: string[];
          focusedLogicalId: string | null; pinnedLogicalIds: string[];
        };
        surfaces: {
          list: {
            imageCount: number; naturalWidths: number[]; naturalHeights: number[];
            thumbStates: string[]; logicalIds: string[];
          };
          detail: {
            open: boolean; logicalId: string | null;
            naturalWidth: number; naturalHeight: number;
          };
          planetside: {
            visible: boolean; imageCount: number; logicalIds: string[];
            naturalWidths: number[]; naturalHeights: number[]; thumbStates: string[];
          };
        };
        art: {
          deviceClass: string;
          limits: Record<string, number | string>;
          live: {
            cacheEntries: number; decodedPixels: number; decodedBytes: number;
            encodedBytes: number; queuedJobs: number; activeJobs: number;
            leases: number; subscribers: number; portraitCacheEntries: number;
            portraitEncodedBytes: number;
          };
          totals: { jobStarts: number; disposals: number };
          keys: { cached: string[]; leased: string[]; queued: string[]; active: string[] };
        };
        lazyArt: {
          worker: {
            live: boolean; starts: number; ready: number; disposals: number;
            fatals: number; protocolErrors: number;
          };
        };
      };
      raw: {
        mountedRowCount: number; mountedLogicalIds: string[];
        rowRects: Array<Record<string, unknown>>;
        listImages: Array<Record<string, unknown>>;
        planetsideImages: Array<{
          logicalId: string; naturalWidth: number; naturalHeight: number;
          visualKey: string; thumbState: string;
        }>;
        detailNaturalWidth: number; detailNaturalHeight: number;
        detailImageCount: number; detailSrcPresent: boolean;
        activeLogicalId: string | null; focusedOutsideNormalWindow: boolean;
        scrollerHeight: number; scrollTop: number;
      };
    };
    type WarmFailureOutcome = {
      id: string; profile: string; check: string; status: string; diagnosis: string;
      evidence: {
        precondition: WarmSnapshot;
        warm: Array<{
          art: WarmSnapshot['diagnostics']['art']['live'];
          limits: WarmSnapshot['diagnostics']['art']['limits'];
          cachedKeys: string[];
          totals: { jobStarts: number; disposals: number };
          worker: WarmSnapshot['diagnostics']['lazyArt']['worker'];
        }>;
      };
    };
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', historicalQuiescentContractFailureEvidence.file,
    ));
    expect(compressed.byteLength).toBe(historicalQuiescentContractFailureEvidence.gzipBytes);
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(historicalQuiescentContractFailureEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(raw.byteLength).toBe(historicalQuiescentContractFailureEvidence.rawBytes);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(historicalQuiescentContractFailureEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as {
      schema: string; runId: string; status: string; startedAt: string; endedAt: string;
      durationMs: number; lifecycle: { schema: string; status: string };
      policy: Record<string, number>;
      source: { begin: Record<string, string>; end: Record<string, string> };
      inputs: Record<string, string>; browser: Record<string, string>;
      budget: {
        status: string; path: string; sha256: string;
        browserAuthority: BrowserAuthority; browserAuthorityMatch: boolean;
        producerAuthority: Record<string, unknown>;
        observedProducerAuthority: Record<string, unknown>;
        producerAuthorityMatch: boolean;
      };
      expectedOutcomes: string[];
      outcomes: WarmFailureOutcome[];
      findings: string[]; blockedOutcomes: string[]; partialFailure: unknown;
      profiles: Record<ProfileName, {
        phases: { warmCachePrecondition: WarmSnapshot };
        points: { warm: WarmSnapshot[] };
      }>;
    };

    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: historicalQuiescentContractFailureEvidence.runId,
      status: 'fail',
      startedAt: historicalQuiescentContractFailureEvidence.startedAt,
      endedAt: historicalQuiescentContractFailureEvidence.endedAt,
      durationMs: historicalQuiescentContractFailureEvidence.durationMs,
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      policy: {
        attemptCount: 1,
        automaticRetries: 0,
        commandTimeoutMs: 2_000,
        targetTimeoutMs: 2_000,
        heartbeatTimeoutMs: 2_000,
        transportTimeoutMs: 5_000,
      },
      blockedOutcomes: [],
      partialFailure: null,
    });
    expect(report.source.begin).toEqual({
      commit: historicalQuiescentContractFailureEvidence.sourceCommit,
      branch: 'openai/mac',
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workingTreeSha256:
        historicalQuiescentContractFailureEvidence.sourceWorkingTreeSha256,
    });
    expect(report.source.end).toEqual(report.source.begin);
    expect(report.inputs).toEqual({
      fixtureSpec: 'c5792c2c8605765b95170e8d954a157e60c9abfa37500ec93c5e1f81722f69f3',
      fixtureRows: 'daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706',
      fixtureGenerator: 'a1b294f0b8b5958910fd873f49d226f80447ad77381cccfd0acb21c82dc7aece',
      budget: historicalQuiescentContractFailureEvidence.budgetSha256,
      budgetSchema: 'e8671d06e4533f565b695de416626cba0f509eb73e60aa0e3814bf5e53ce65e8',
      outcomeContract: historicalQuiescentContractFailureEvidence.outcomeContractSha256,
      collector: historicalQuiescentContractFailureEvidence.collectorSha256,
      browserCdp: '6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce',
      browserPath: '733ab771f60bead83e8d2af4d95339248f7c9b16879903ea89b817677e4a6bc0',
      workspaceLock: 'e22a4c268ad0ce71a1c9160f45a2386c413c7fbcfc13f0cc457cf084ff0fd606',
      package: '87551923ad5af540270ecbbeef73b97bcf90d82ae66867e59a844f1815a98106',
      packageLock: 'ce2e1138aa77e214021a7b6104db4487fe79ec140bace17f44f47e88abb1d06f',
      appPackage: '11dde72861c2a687f5d238a412946956f1ecb4a4bec7adafa6096c9dcc04329d',
      baselineSaveFixtures:
        'a52bfbdc1c65a418eed07a1e7ba5ffd07b36caf5ce10e587c7d34a717deab2a7',
      speciesArtBuildGraph:
        historicalQuiescentContractFailureEvidence.speciesArtBuildGraphSha256,
      outcomeInventory: 'bd4f8a9ef37538b09582c316837dae05b1bc682cf6cb5f6df0fee4a2621929b0',
    });
    expect(compendiumMeasurementAuthority(report.inputs)?.sha256)
      .toBe(historicalQuiescentContractFailureEvidence.measurementAuthoritySha256);
    expect(report.browser).toEqual(historicalQuiescentContractFailureEvidence.browser);
    expect(report.budget).toEqual({
      status: 'active',
      path: 'budgets/compendium-memory-v1.json',
      sha256: historicalQuiescentContractFailureEvidence.budgetSha256,
      browserAuthority: {
        schema: 'cf-v2-compendium-browser-authority/v2',
        scope: 'arc1a-compendium-memory-only',
        family: 'microsoft-edge',
        protocolVersion: '1.3',
        capabilityContract: 'cf-v2-compendium-cdp-capabilities/v1',
        capabilityContractSha256:
          '6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476',
      },
      browserAuthorityMatch: true,
      producerAuthority: {
        schema: 'cf-v2-compendium-producer-authority/v1',
        sha256: historicalQuiescentContractFailureEvidence.producerAuthoritySha256,
        inputs: {
          index: {
            relativePath: 'index.html',
            sha256: '184b73ee41aa91fd13ba681ca07caad99820621675a7db736084a4c7a24d0b9d',
          },
          owner: {
            relativePath: 'assets/main-CLGcJIQS.js',
            sha256: 'dd407ec15819851084d4df1aa36e6bc8f5c23650cd9d68c82ee756e564b90fda',
          },
          worker: {
            relativePath: 'assets/species-art.worker-szNwNYEk.js',
            sha256: 'cebbbb892d71828eef1b5d90e2c601f0f197ba01d080ceb9050ee1f252848cdf',
          },
          painter: {
            relativePath: 'assets/speciespainter-EmdmLeiA.js',
            sha256: '570cb72699a577bda85502be46b54bcbdec9ffa41df5702bd5cb865f4bf08eba',
          },
        },
      },
      observedProducerAuthority: {
        schema: 'cf-v2-compendium-producer-authority/v1',
        sha256: historicalQuiescentContractFailureEvidence.producerAuthoritySha256,
        inputs: {
          index: {
            relativePath: 'index.html',
            sha256: '184b73ee41aa91fd13ba681ca07caad99820621675a7db736084a4c7a24d0b9d',
          },
          owner: {
            relativePath: 'assets/main-CLGcJIQS.js',
            sha256: 'dd407ec15819851084d4df1aa36e6bc8f5c23650cd9d68c82ee756e564b90fda',
          },
          worker: {
            relativePath: 'assets/species-art.worker-szNwNYEk.js',
            sha256: 'cebbbb892d71828eef1b5d90e2c601f0f197ba01d080ceb9050ee1f252848cdf',
          },
          painter: {
            relativePath: 'assets/speciespainter-EmdmLeiA.js',
            sha256: '570cb72699a577bda85502be46b54bcbdec9ffa41df5702bd5cb865f4bf08eba',
          },
        },
      },
      producerAuthorityMatch: true,
    });
    expect(report.expectedOutcomes).toHaveLength(78);
    expect(createHash('sha256').update(stableJson(report.expectedOutcomes)).digest('hex'))
      .toBe(report.inputs.outcomeInventory);
    expect(report.outcomes.map((outcome) => outcome.id)).toEqual(report.expectedOutcomes);
    expect(report.outcomes.filter((outcome) => outcome.status === 'pass')).toHaveLength(76);
    const failed = report.outcomes.filter((outcome) => outcome.status === 'fail');
    expect(failed.map((outcome) => outcome.id))
      .toEqual(historicalQuiescentContractFailureEvidence.failedOutcomeIds);
    expect(failed.map((outcome) => ({
      id: outcome.id,
      profile: outcome.profile,
      check: outcome.check,
      status: outcome.status,
      diagnosis: outcome.diagnosis,
    }))).toEqual(PROFILE_NAMES.map((profile) => ({
      id: `${profile}/warm-precondition`,
      profile,
      check: 'warm-precondition',
      status: 'fail',
      diagnosis:
        `${profile}: warm measurements were not taken from the full native cache limit with drained work and a released worker`,
    })));
    expect(report.outcomes.every((outcome) => ['pass', 'fail'].includes(outcome.status)))
      .toBe(true);
    expect(report.findings).toEqual(PROFILE_NAMES.map((profile) =>
      `${profile}: warm measurements were not taken from the full native cache limit with drained work and a released worker`));

    const profileEvidence = {
      phone: { encodedBytes: 812_786, nativeCacheLimit: 96, jobStarts: 700,
        disposals: 664, workerStarts: 42 },
      desktop: { encodedBytes: 802_870, nativeCacheLimit: 256, jobStarts: 679,
        disposals: 636, workerStarts: 41 },
    } as const;
    for (const profile of PROFILE_NAMES) {
      const measurement = report.profiles[profile];
      const warmSnapshots = [
        measurement.phases.warmCachePrecondition,
        ...measurement.points.warm,
      ];
      expect(warmSnapshots).toHaveLength(5);
      const firstCachedKeys = [...warmSnapshots[0]!.diagnostics.art.keys.cached].sort();
      const firstLeasedKeys = [...warmSnapshots[0]!.diagnostics.art.keys.leased].sort();
      for (const snapshot of warmSnapshots) {
        const { art, lazyArt, panel, surfaces, window } = snapshot.diagnostics;
        const cachedKeys = art.keys.cached;
        const leasedKeys = art.keys.leased;
        const cachedKeySet = new Set(cachedKeys);
        const leasedKeySet = new Set(leasedKeys);
        const unleasedKeys = cachedKeys.filter((key) => !leasedKeySet.has(key));
        const planetsideImages = snapshot.raw.planetsideImages;
        expect({
          leased: leasedKeys.length,
          unleased: unleasedKeys.length,
          total: cachedKeys.length,
        }).toEqual({ leased: 8, unleased: 17, total: 25 });
        expect(cachedKeySet.size).toBe(25);
        expect(leasedKeySet.size).toBe(8);
        expect(leasedKeys.every((key) => cachedKeySet.has(key))).toBe(true);
        expect([...cachedKeys].sort()).toEqual(firstCachedKeys);
        expect([...leasedKeys].sort()).toEqual(firstLeasedKeys);
        expect(panel).toMatchObject({ open: false, mode: 'closed' });
        expect(window).toEqual({
          start: 0,
          end: 0,
          overscan: 0,
          beforePx: 0,
          afterPx: 0,
          mountedRowCount: 0,
          mountedLogicalIds: [],
          focusedLogicalId: null,
          pinnedLogicalIds: [],
        });
        expect(surfaces.list).toEqual({
          imageCount: 0,
          naturalWidths: [],
          naturalHeights: [],
          thumbStates: [],
          logicalIds: [],
        });
        expect(surfaces.detail).toEqual({
          open: false,
          logicalId: null,
          naturalWidth: 0,
          naturalHeight: 0,
        });
        expect(snapshot.raw).toMatchObject({
          mountedRowCount: 0,
          mountedLogicalIds: [],
          rowRects: [],
          listImages: [],
          detailNaturalWidth: 0,
          detailNaturalHeight: 0,
          detailImageCount: 0,
          detailSrcPresent: false,
          activeLogicalId: null,
          focusedOutsideNormalWindow: false,
          scrollerHeight: 0,
          scrollTop: 0,
        });
        expect(art.deviceClass).toBe(profile);
        expect(art.limits.cacheEntries).toBe(profileEvidence[profile].nativeCacheLimit);
        expect(art.live).toEqual({
          cacheEntries: 25,
          decodedPixels: 25 * 132 * 132,
          decodedBytes: 25 * 132 * 132 * 4,
          encodedBytes: profileEvidence[profile].encodedBytes,
          queuedJobs: 0,
          activeJobs: 0,
          leases: 8,
          subscribers: 0,
          portraitCacheEntries: 0,
          portraitEncodedBytes: 0,
        });
        expect(art.keys.queued).toEqual([]);
        expect(art.keys.active).toEqual([]);
        expect(art.totals).toMatchObject({
          jobStarts: profileEvidence[profile].jobStarts,
          disposals: profileEvidence[profile].disposals,
        });
        expect(lazyArt.worker).toEqual({
          live: false,
          starts: profileEvidence[profile].workerStarts,
          ready: profileEvidence[profile].workerStarts,
          disposals: profileEvidence[profile].workerStarts,
          fatals: 0,
          protocolErrors: 0,
        });
        expect(surfaces.planetside).toMatchObject({ visible: true, imageCount: 8 });
        expect(new Set(surfaces.planetside.logicalIds).size).toBe(8);
        expect(planetsideImages).toHaveLength(8);
        expect(planetsideImages.every((image) => image.naturalWidth === 132
          && image.naturalHeight === 132 && image.thumbState === 'ready')).toBe(true);
        expect(new Set(planetsideImages.map((image) => image.logicalId)).size).toBe(8);
        expect(new Set(planetsideImages.map((image) => image.visualKey)).size).toBe(8);
        expect(planetsideImages.map((image) => image.logicalId))
          .toEqual(surfaces.planetside.logicalIds);
      expect(planetsideImages.map((image) => image.visualKey).sort())
          .toEqual(firstLeasedKeys);
      }
      const replayed = evaluateProfile(measurement, activeBudget, fixture);
      expect(replayed).toHaveLength(39);
      expect(replayed.filter((outcome) => outcome.status === 'fail')
        .map((outcome) => outcome.id)).toEqual([
        `${profile}/lazy-art-not-eager`,
      ]);
      const failedOutcome = failed.find((outcome) => outcome.profile === profile)!;
      expect(failedOutcome.evidence.precondition)
        .toEqual(measurement.phases.warmCachePrecondition);
      expect(failedOutcome.evidence.warm).toEqual(measurement.points.warm.map((snapshot) => ({
        art: snapshot.diagnostics.art.live,
        limits: snapshot.diagnostics.art.limits,
        cachedKeys: [...snapshot.diagnostics.art.keys.cached].sort(),
        totals: {
          jobStarts: snapshot.diagnostics.art.totals.jobStarts,
          disposals: snapshot.diagnostics.art.totals.disposals,
        },
        worker: snapshot.diagnostics.lazyArt.worker,
      })));
    }

    expect(fileSha256(budgetPath))
      .not.toBe(historicalQuiescentContractFailureEvidence.budgetSha256);
    expect(fileSha256(path.join(v2Root, 'tools', 'compendiummem-contract.mjs')))
      .not.toBe(historicalQuiescentContractFailureEvidence.outcomeContractSha256);
    expect(fileSha256(path.join(v2Root, 'tools', 'compendiummem.mjs')))
      .not.toBe(historicalQuiescentContractFailureEvidence.collectorSha256);
    expect(liveMeasurementAuthority?.sha256)
      .not.toBe(historicalQuiescentContractFailureEvidence.measurementAuthoritySha256);
    expect(activeBudget.calibration.selectionRule)
      .toContain(historicalQuiescentContractFailureEvidence.runId);
    expect(activeBudget.calibration.selectionRule)
      .toContain(historicalQuiescentContractFailureEvidence.rawSha256);
    expect(activeBudget.calibration.selectionRule)
      .toContain(historicalQuiescentContractFailureEvidence.gzipSha256);
    expect(PROFILE_NAMES.flatMap((profile) => [
      ...activeBudget.calibration.samples[profile],
      ...activeBudget.pairedBrokenBaseline.samples[profile],
    ]).map((sample) => sample.runId))
      .not.toContain(historicalQuiescentContractFailureEvidence.runId);
  });

  it('keeps strict metric and ceiling schema keys identical to the semantic contract', () => {
    type StrictObjectDefinition = {
      required: string[]; properties: Record<string, unknown>; additionalProperties: boolean;
    };
    const definitions = schema.$defs as {
      browserAuthority: StrictObjectDefinition;
      fixedRulerAuthority: StrictObjectDefinition;
      metrics: StrictObjectDefinition; ceiling: StrictObjectDefinition;
      candidateSample: StrictObjectDefinition; baselineSample: StrictObjectDefinition;
    };
    const measurementAuthority = (schema.properties as {
      measurementAuthority: { properties: { inputs: StrictObjectDefinition } };
    }).measurementAuthority;
    expect(measurementAuthority.properties.inputs.additionalProperties).toBe(false);
    expect([...measurementAuthority.properties.inputs.required].sort())
      .toEqual([...COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS].sort());
    expect(Object.keys(measurementAuthority.properties.inputs.properties).sort())
      .toEqual([...COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS].sort());
    expect(definitions.browserAuthority.additionalProperties).toBe(false);
    expect([...definitions.browserAuthority.required].sort()).toEqual([
      'schema', 'scope', 'family', 'protocolVersion', 'capabilityContract',
      'capabilityContractSha256',
    ].sort());
    expect(Object.keys(definitions.browserAuthority.properties).sort()).toEqual([
      'schema', 'scope', 'family', 'protocolVersion', 'capabilityContract',
      'capabilityContractSha256',
    ].sort());
    expect(definitions.fixedRulerAuthority.additionalProperties).toBe(false);
    expect([...definitions.fixedRulerAuthority.required].sort()).toEqual([
      'schema', 'calibrationStatus', 'ceilingScope', 'measurementAuthoritySha256',
      'producerAuthoritySha256', 'currentCertification',
    ].sort());
    expect(Object.keys(definitions.fixedRulerAuthority.properties).sort()).toEqual([
      'schema', 'calibrationStatus', 'ceilingScope', 'measurementAuthoritySha256',
      'producerAuthoritySha256', 'currentCertification',
    ].sort());
    expect(definitions.metrics.additionalProperties).toBe(false);
    expect([...definitions.metrics.required].sort()).toEqual([...SAMPLE_METRIC_FIELDS].sort());
    expect(Object.keys(definitions.metrics.properties).sort()).toEqual([...SAMPLE_METRIC_FIELDS].sort());
    expect(definitions.ceiling.additionalProperties).toBe(false);
    expect([...definitions.ceiling.required].sort()).toEqual(['rationale', ...CEILING_FIELDS].sort());
    expect(Object.keys(definitions.ceiling.properties).sort()).toEqual(['rationale', ...CEILING_FIELDS].sort());
    expect(definitions.candidateSample.additionalProperties).toBe(false);
    expect(definitions.candidateSample.required).toContain('producerAuthoritySha256');
    expect(definitions.candidateSample.required).toContain('evidence');
    expect(Object.keys(definitions.candidateSample.properties)).not.toContain('observedFaults');
    expect(definitions.baselineSample.additionalProperties).toBe(false);
    expect(definitions.baselineSample.required).toContain('observedFaults');
    expect(definitions.baselineSample.required).toContain('evidence');
    expect(Object.keys(definitions.baselineSample.properties))
      .not.toContain('producerAuthoritySha256');
    expect([...(schema.$defs as { brokenFault: { enum: string[] } }).brokenFault.enum].sort())
      .toEqual([...BROKEN_BASELINE_EXPECTED_FAULTS].sort());
    expect([...(budget.pairedBrokenBaseline as { expectedFaults: string[] }).expectedFaults].sort())
      .toEqual([...BROKEN_BASELINE_EXPECTED_FAULTS].sort());
  });

  it('seals the exact CDP capability inventory used by the version-tolerant ruler', () => {
    const collectorSource = fs.readFileSync(
      path.join(v2Root, 'tools', 'compendiummem.mjs'), 'utf8',
    );
    const browserCdpSource = fs.readFileSync(
      path.join(v2Root, 'tools', 'browsercdp.mjs'), 'utf8',
    );
    expect(compendiumBrowserCapabilityInventoryErrors({
      collectorSource, browserCdpSource,
    })).toEqual([]);
    for (const method of [
      'Emulation.setDeviceMetricsOverride', 'HeapProfiler.collectGarbage',
      'Input.dispatchMouseEvent', 'Memory.getDOMCounters', 'Page.captureScreenshot',
      'Runtime.getHeapUsage', 'Target.createBrowserContext',
    ]) {
      const mutated = collectorSource.replaceAll(`'${method}'`, `'Removed.${method}'`);
      expect(mutated, `${method} mutation must change source`).not.toBe(collectorSource);
      expect(compendiumBrowserCapabilityInventoryErrors({
        collectorSource: mutated, browserCdpSource,
      }).join('\n'), method).toContain(`missing ${method}`);
    }
    expect(compendiumBrowserCapabilityInventoryErrors({
      collectorSource: `${collectorSource}\nconst injected = 'Runtime.compileScript';`,
      browserCdpSource,
    }).join('\n')).toContain('unsealed Runtime.compileScript');
    expect(compendiumBrowserCapabilityInventoryErrors({
      collectorSource,
      browserCdpSource: browserCdpSource.replaceAll('Browser.getVersion', 'Browser.getVersionRemoved'),
    }).join('\n')).toContain('lacks Browser.getVersion provenance');
  });

  it('fails the current producer closed without rebinding historical samples', () => {
    expect(validCompendiumFixedRulerAuthority(activeBudget.calibration.rulerAuthority))
      .toBe(true);
    expect(activeBudget.calibration.rulerAuthority).toEqual({
      schema: COMPENDIUM_FIXED_RULER_AUTHORITY_SCHEMA,
      calibrationStatus: COMPENDIUM_FIXED_RULER_CALIBRATION_STATUS,
      ceilingScope: COMPENDIUM_FIXED_RULER_CEILING_SCOPE,
      measurementAuthoritySha256: activeBudget.status === 'calibration-required'
        ? EXPECTED_MEASUREMENT_AUTHORITY : RULER_MEASUREMENT_AUTHORITY,
      producerAuthoritySha256: activeBudget.status === 'calibration-required'
        ? EXPECTED_PRODUCER_AUTHORITY : RULER_PRODUCER_AUTHORITY,
      currentCertification: COMPENDIUM_CURRENT_CERTIFICATION_REQUIREMENT,
    });
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.browserAuthority).toEqual(EXPECTED_BROWSER_AUTHORITY);
      expect(activeBudget.measurementAuthority.sha256).toBe(EXPECTED_MEASUREMENT_AUTHORITY);
      expect(activeBudget.producerAuthority.sha256).toBe(EXPECTED_PRODUCER_AUTHORITY);
      expect(activeBudget.producerAuthority).toEqual(EXPECTED_PRODUCER_AUTHORITY_RECORD);
      expect(activeBudget.producerAuthority).not.toEqual(HISTORICAL_PHASE4_PRODUCER_AUTHORITY);
      expect(activeBudget.ceilings).toBeNull();
      expect(activeBudget.calibration.requiredIndependentRunsPerProfile).toBe(3);
      for (const profile of PROFILE_NAMES) {
        expect(activeBudget.calibration.samples[profile]).toEqual([]);
        expect(activeBudget.pairedBrokenBaseline.samples[profile]).toEqual([]);
      }
      expect(activeBudget.pairedBrokenBaseline.status).toBe('measurement-required');
      expect(activeBudget.pairedBrokenBaseline.commit)
        .toBe('38447019517147319bd08c598202d097ee866874');
      expect(activeBudget.pairedBrokenBaseline.collectorCommit).toBeNull();
      expect(activeBudget.calibration.selectionRule).toContain('version-tolerant');
      expect(activeBudget.calibration.selectionRule).toContain('provenance only');
      expect(activeBudget.calibration.selectionRule).toContain('do not trigger recalibration');
      expect(activeBudget.calibration.selectionRule).toContain(HISTORICAL_MEASUREMENT_AUTHORITY);
      expect(activeBudget.calibration.selectionRule).toContain('historical');
      expect(activeBudget.calibration.selectionRule).toContain('All earlier samples');
      expect(activeBudget.calibration.selectionRule).toContain('32677088518');
      expect(activeBudget.calibration.selectionRule)
        .toContain(latestHostedFailureEvidence.rawSha256);
      expect(activeBudget.calibration.selectionRule).toContain('113 passive observations');
      expect(activeBudget.calibration.selectionRule).toContain('double-render settlement');
      expect(activeBudget.calibration.selectionRule).toContain(EXPECTED_COLLECTOR_AUTHORITY);
      expect(activeBudget.calibration.selectionRule).toContain(EXPECTED_MEASUREMENT_AUTHORITY);
      expect(activeBudget.calibration.selectionRule).toContain('one attempt');
      expect(activeBudget.calibration.selectionRule).toContain('zero retries');
      expect(activeBudget.calibration.selectionRule).toContain('strict measured headroom');
      expect(activeBudget.calibration.selectionRule)
        .toContain(PREVIOUS_CHANGED_HEAD_PRODUCER_AUTHORITY);
      expect(activeBudget.calibration.selectionRule)
        .toContain(EXPECTED_PRODUCER_AUTHORITY);
      for (const input of Object.values(EXPECTED_PRODUCER_AUTHORITY_RECORD.inputs)) {
        expect(activeBudget.calibration.selectionRule).toContain(input.sha256);
      }
      expect(activeBudget.calibration.selectionRule)
        .toContain(HISTORICAL_PHASE4_PRODUCER_AUTHORITY.sha256);
      for (const runId of EXPECTED_CANDIDATE_RUNS) {
        expect(activeBudget.calibration.selectionRule).toContain(runId);
      }
      expect(activeBudget.calibration.selectionRule).toContain(EXPECTED_BASELINE_RUN);
      expect(activeBudget.calibration.selectionRule)
        .toContain(historicalPhase4CertificationEvidence.sourceCommit);
      expect(activeBudget.calibration.selectionRule)
        .toContain(historicalPhase4CertificationEvidence.budgetSha256);
      expect(activeBudget.calibration.selectionRule)
        .toContain(historicalPhase4CertificationEvidence.runId);
      expect(activeBudget.calibration.selectionRule)
        .toContain(historicalPhase4CertificationEvidence.rawSha256);
      expect(activeBudget.calibration.selectionRule)
        .toContain(historicalPhase4CertificationEvidence.gzipSha256);
      expect(activeBudget.calibration.selectionRule).toContain('strictly historical');
      expect(activeBudget.calibration.selectionRule).toContain('not rebound');
      expect(activeBudget.calibration.selectionRule)
        .toContain('Edge auto-updates do not trigger recalibration');
      expect(activeBudget.calibration.selectionRule)
        .toContain('does not re-pin Gate A');
      expect((budget.measurementAuthority as {
        inputs: { collector: string };
      }).inputs.collector).toBe(EXPECTED_COLLECTOR_AUTHORITY);

      const staleRebind = structuredClone(budget) as Record<string, unknown> & {
        producerAuthority: typeof HISTORICAL_PHASE4_PRODUCER_AUTHORITY;
      };
      staleRebind.producerAuthority = HISTORICAL_PHASE4_PRODUCER_AUTHORITY;
      expect(validateBudgetRecord(
        staleRebind, fixture.rowsSha256, baselineProjection.rowsSha256,
        liveMeasurementAuthority, EXPECTED_PRODUCER_AUTHORITY_RECORD,
      ).errors.join('\n')).toContain(
        'budget producer authority does not match the current built index/owner/worker/painter',
      );
      return;
    }
    expect(activeBudget.status).toBe('active');
    expect(activeBudget.browserAuthority).toEqual(EXPECTED_BROWSER_AUTHORITY);
    expect(activeBudget.ceilings).not.toBeNull();
    expect(activeBudget.measurementAuthority.sha256).toBe(EXPECTED_MEASUREMENT_AUTHORITY);
    expect((budget.measurementAuthority as { inputs: Record<string, string> })
      .inputs.outcomeContract)
      .toBe(EXPECTED_OUTCOME_CONTRACT_AUTHORITY);
    expect((budget.measurementAuthority as { inputs: Record<string, string> })
      .inputs.collector)
      .toBe(EXPECTED_COLLECTOR_AUTHORITY);
    expect(activeBudget.producerAuthority.sha256).toBe(EXPECTED_PRODUCER_AUTHORITY);
    const candidateRuns = activeBudget.calibration.samples.phone.map((sample) => sample.runId);
    expect(candidateRuns).toEqual(EXPECTED_CANDIDATE_RUNS);
    for (const profile of PROFILE_NAMES) {
      expect(activeBudget.calibration.samples[profile].map((sample) => sample.runId))
        .toEqual(candidateRuns);
      expect(new Set(activeBudget.calibration.samples[profile]
        .map((sample) => sample.commit)).size).toBe(1);
      expect(new Set(activeBudget.calibration.samples[profile]
        .map((sample) => sample.inputDigest)).size).toBe(1);
      expect(new Set(activeBudget.calibration.samples[profile]
        .map((sample) => sample.measurementAuthoritySha256))).toEqual(new Set([
        RULER_MEASUREMENT_AUTHORITY,
      ]));
      expect(new Set(activeBudget.calibration.samples[profile]
        .map((sample) => sample.producerAuthoritySha256))).toEqual(new Set([
        RULER_PRODUCER_AUTHORITY,
      ]));
      expect(new Set(activeBudget.calibration.samples[profile]
        .map((sample) => sample.evidence.schema))).toEqual(new Set([
        CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA,
      ]));
      expect(activeBudget.pairedBrokenBaseline.samples[profile]).toHaveLength(1);
      expect(activeBudget.pairedBrokenBaseline.samples[profile][0]
        ?.measurementAuthoritySha256)
        .toBe(RULER_MEASUREMENT_AUTHORITY);
      expect(activeBudget.pairedBrokenBaseline.samples[profile][0]?.evidence.schema)
        .toBe(BASELINE_CALIBRATION_EVIDENCE_SCHEMA);
    }
    expect(activeBudget.pairedBrokenBaseline.status).toBe('measured');
    expect(activeBudget.pairedBrokenBaseline.commit)
      .toBe('38447019517147319bd08c598202d097ee866874');
    expect(activeBudget.pairedBrokenBaseline.collectorCommit)
      .toBe(activeBudget.calibration.samples.phone[0]?.commit);
    expect(activeBudget.pairedBrokenBaseline.samples.phone[0]?.runId)
      .toBe(EXPECTED_BASELINE_RUN);
    expect(activeBudget.pairedBrokenBaseline.samples.desktop[0]?.runId)
      .toBe(EXPECTED_BASELINE_RUN);

    const everySample = PROFILE_NAMES.flatMap((profile) => [
      ...activeBudget.calibration.samples[profile],
      ...activeBudget.pairedBrokenBaseline.samples[profile],
    ]);
    expect(everySample.every((sample) =>
      compendiumBrowserAuthorityMatches(sample.browser, activeBudget.browserAuthority))).toBe(true);
    for (const samples of [
      activeBudget.calibration.samples,
      activeBudget.pairedBrokenBaseline.samples,
    ]) {
      const byRun = new Map<string, Set<string>>();
      for (const profile of PROFILE_NAMES) {
        for (const sample of samples[profile]) {
          if (!byRun.has(sample.runId)) byRun.set(sample.runId, new Set());
          byRun.get(sample.runId)!.add(authorityKey(sample));
        }
      }
      expect([...byRun.values()].every((keys) => keys.size === 1)).toBe(true);
    }
    expect(activeBudget.calibration.selectionRule).toContain('version-tolerant');
    expect(activeBudget.calibration.selectionRule).toContain('raw-capsule');
    expect(activeBudget.calibration.selectionRule).toContain('strictly above');
    expect(activeBudget.calibration.selectionRule).toContain('rational headroom');
    expect(activeBudget.calibration.selectionRule)
      .toContain(PREVIOUS_CHANGED_HEAD_PRODUCER_AUTHORITY);
    expect(activeBudget.calibration.selectionRule)
      .toContain(EXPECTED_PRODUCER_AUTHORITY);
    for (const input of Object.values(EXPECTED_PRODUCER_AUTHORITY_RECORD.inputs)) {
      expect(activeBudget.calibration.selectionRule).toContain(input.sha256);
    }
    expect(activeBudget.calibration.selectionRule).toContain(RULER_PRODUCER_AUTHORITY);
    expect(activeBudget.calibration.selectionRule).toContain('numeric ceilings carry forward');
    expect(activeBudget.calibration.selectionRule).toContain('fresh exact certificate');
    expect(activeBudget.calibration.selectionRule)
      .toContain('does not re-pin the Gate-A/global browser');
    for (const authority of Object.values(HISTORICAL_VISUAL_KEY_INSTRUMENT_FAILURE)) {
      expect(activeBudget.calibration.selectionRule).toContain(authority);
    }
    expect(activeBudget.calibration.selectionRule)
      .toContain('512-character string projector');
    expect(activeBudget.calibration.selectionRule)
      .toContain('never serializes full visual keys');
    expect(activeBudget.calibration.selectionRule)
      .toContain('caps each broker-key array at 256');
    expect(activeBudget.calibration.selectionRule)
      .toContain(EXPECTED_OUTCOME_CONTRACT_AUTHORITY);
    expect(activeBudget.calibration.selectionRule).toContain(EXPECTED_COLLECTOR_AUTHORITY);
    expect(activeBudget.calibration.selectionRule).toContain(EXPECTED_MEASUREMENT_AUTHORITY);
  });

  it('binds active ruler authority while preserving calibration-required and drift controls', () => {
    expect(activeBudget.status).toBe('active');
    expect(activeBudget.calibration.rulerAuthority).toMatchObject({
      measurementAuthoritySha256: RULER_MEASUREMENT_AUTHORITY,
      producerAuthoritySha256: RULER_PRODUCER_AUTHORITY,
    });
    const measurementMismatch =
      'calibration-required fixed ruler measurement authority must match the top-level measurement authority';
    const producerMismatch =
      'calibration-required fixed ruler producer authority must match the top-level producer authority';

    const calibrationRequired = structuredClone(activeBudget);
    calibrationRequired.status = 'calibration-required';
    calibrationRequired.ceilings = null;
    calibrationRequired.calibration.samples = { phone: [], desktop: [] };
    calibrationRequired.calibration.rulerAuthority.measurementAuthoritySha256 =
      EXPECTED_MEASUREMENT_AUTHORITY;
    calibrationRequired.calibration.rulerAuthority.producerAuthoritySha256 =
      EXPECTED_PRODUCER_AUTHORITY;
    calibrationRequired.pairedBrokenBaseline.status = 'measurement-required';
    calibrationRequired.pairedBrokenBaseline.collectorCommit = null;
    calibrationRequired.pairedBrokenBaseline.samples = { phone: [], desktop: [] };
    expect(validateBudgetRecord(
      calibrationRequired, fixture.rowsSha256, baselineProjection.rowsSha256,
      liveMeasurementAuthority, EXPECTED_PRODUCER_AUTHORITY_RECORD,
    )).toEqual({ ok: true, errors: [] });

    const wrongRulerMeasurement = structuredClone(calibrationRequired);
    wrongRulerMeasurement.calibration.rulerAuthority.measurementAuthoritySha256 = '0'.repeat(64);
    expect(validateBudgetRecord(
      wrongRulerMeasurement, fixture.rowsSha256, baselineProjection.rowsSha256,
      liveMeasurementAuthority, EXPECTED_PRODUCER_AUTHORITY_RECORD,
    ).errors).toContain(measurementMismatch);

    const changedMeasurementInputs = {
      ...(budget.measurementAuthority as { inputs: Record<string, string> }).inputs,
      packageLock: '0'.repeat(64),
    };
    const changedMeasurement = compendiumMeasurementAuthority(changedMeasurementInputs);
    expect(changedMeasurement).not.toBeNull();
    expect(changedMeasurement?.sha256).not.toBe(EXPECTED_MEASUREMENT_AUTHORITY);
    const wrongTopLevelMeasurement = structuredClone(calibrationRequired);
    wrongTopLevelMeasurement.measurementAuthority = changedMeasurement!;
    expect(validateBudgetRecord(
      wrongTopLevelMeasurement, fixture.rowsSha256, baselineProjection.rowsSha256,
      changedMeasurement, EXPECTED_PRODUCER_AUTHORITY_RECORD,
    ).errors).toContain(measurementMismatch);

    const wrongRulerProducer = structuredClone(calibrationRequired);
    wrongRulerProducer.calibration.rulerAuthority.producerAuthoritySha256 = '0'.repeat(64);
    expect(validateBudgetRecord(
      wrongRulerProducer, fixture.rowsSha256, baselineProjection.rowsSha256,
      liveMeasurementAuthority, EXPECTED_PRODUCER_AUTHORITY_RECORD,
    ).errors).toContain(producerMismatch);

    const wrongTopLevelProducer = structuredClone(calibrationRequired);
    wrongTopLevelProducer.producerAuthority = HISTORICAL_PHASE4_PRODUCER_AUTHORITY;
    expect(validateBudgetRecord(
      wrongTopLevelProducer, fixture.rowsSha256, baselineProjection.rowsSha256,
      liveMeasurementAuthority, HISTORICAL_PHASE4_PRODUCER_AUTHORITY,
    ).errors).toContain(producerMismatch);

    const activeHistoricalDrift = structuredClone(activeBudget);
    activeHistoricalDrift.measurementAuthority = changedMeasurement!;
    activeHistoricalDrift.producerAuthority = HISTORICAL_PHASE4_PRODUCER_AUTHORITY;
    expect(validateBudgetRecord(
      activeHistoricalDrift, fixture.rowsSha256, baselineProjection.rowsSha256,
      changedMeasurement, HISTORICAL_PHASE4_PRODUCER_AUTHORITY,
    )).toEqual({ ok: true, errors: [] });

    expect(validateBudgetRecord(
      budget, fixture.rowsSha256, baselineProjection.rowsSha256,
      liveMeasurementAuthority, EXPECTED_PRODUCER_AUTHORITY_RECORD,
    )).toEqual({ ok: true, errors: [] });
  });

  it('carries only numeric ceilings across live authority drift and rejects sample rebinding', () => {
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.ceilings).toBeNull();
      expect(activeBudget.calibration.samples).toEqual({ phone: [], desktop: [] });
      expect(activeBudget.pairedBrokenBaseline.samples).toEqual({ phone: [], desktop: [] });
      expect(activeBudget.calibration.rulerAuthority).toMatchObject({
        measurementAuthoritySha256: EXPECTED_MEASUREMENT_AUTHORITY,
        producerAuthoritySha256: EXPECTED_PRODUCER_AUTHORITY,
      });
      expect(validateBudgetRecord(
        budget, fixture.rowsSha256, baselineProjection.rowsSha256,
        liveMeasurementAuthority, EXPECTED_PRODUCER_AUTHORITY_RECORD,
      )).toEqual({ ok: true, errors: [] });
      return;
    }
    const carried = structuredClone(activeBudget);
    carried.producerAuthority = HISTORICAL_PHASE4_PRODUCER_AUTHORITY;
    const changedMeasurementInputs = {
      ...(budget.measurementAuthority as { inputs: Record<string, string> }).inputs,
      packageLock: '0'.repeat(64),
    };
    const changedMeasurement = compendiumMeasurementAuthority(changedMeasurementInputs);
    expect(changedMeasurement).not.toBeNull();
    carried.measurementAuthority = changedMeasurement!;
    expect(carried.measurementAuthority.sha256).not.toBe(RULER_MEASUREMENT_AUTHORITY);
    expect(carried.producerAuthority.sha256).not.toBe(RULER_PRODUCER_AUTHORITY);
    expect(validateBudgetRecord(
      carried, fixture.rowsSha256, baselineProjection.rowsSha256,
      changedMeasurement, HISTORICAL_PHASE4_PRODUCER_AUTHORITY,
    )).toEqual({ ok: true, errors: [] });

    const reboundProducer = structuredClone(carried);
    reboundProducer.calibration.samples.phone[0]!.producerAuthoritySha256 =
      carried.producerAuthority.sha256;
    expect(validateBudgetRecord(
      reboundProducer, fixture.rowsSha256, baselineProjection.rowsSha256,
      changedMeasurement, HISTORICAL_PHASE4_PRODUCER_AUTHORITY,
    ).errors).toContain(
      'candidate calibration samples do not match the fixed ruler producer authority',
    );

    const reboundMeasurement = structuredClone(carried);
    reboundMeasurement.pairedBrokenBaseline.samples.desktop[0]!.measurementAuthoritySha256 =
      changedMeasurement!.sha256;
    expect(validateBudgetRecord(
      reboundMeasurement, fixture.rowsSha256, baselineProjection.rowsSha256,
      changedMeasurement, HISTORICAL_PHASE4_PRODUCER_AUTHORITY,
    ).errors).toContain(
      'paired broken-baseline samples do not match the fixed ruler measurement authority',
    );
  });

  it('pins the exact sealed raw sample objects selected from all four local runs', () => {
    if (activeBudget.status === 'calibration-required') {
      for (const profile of PROFILE_NAMES) {
        expect(activeBudget.calibration.samples[profile]).toEqual([]);
        expect(activeBudget.pairedBrokenBaseline.samples[profile]).toEqual([]);
      }
      return;
    }
    for (const profile of PROFILE_NAMES) {
      expect(activeBudget.calibration.samples[profile].map(sampleObjectSha256))
        .toEqual(EXPECTED_SAMPLE_OBJECT_SHA256[profile].candidate);
      expect(activeBudget.pairedBrokenBaseline.samples[profile].map(sampleObjectSha256))
        .toEqual([EXPECTED_SAMPLE_OBJECT_SHA256[profile].baseline]);
      expect(activeBudget.pairedBrokenBaseline.samples[profile][0]?.observedFaults)
        .toEqual(BROKEN_BASELINE_EXPECTED_FAULTS);
    }
  });

  it('rederives the active universe-polish samples from four immutable carriers', () => {
    for (const [runIndex, evidence] of currentUniversePolishCandidateEvidence.entries()) {
      const compressed = fs.readFileSync(path.join(v2Root, '..', '..', 'audits', evidence.file));
      expect(compressed).toHaveLength(evidence.gzipBytes);
      expect(createHash('sha256').update(compressed).digest('hex')).toBe(evidence.gzipSha256);
      const raw = gunzipSync(compressed);
      expect(raw).toHaveLength(evidence.rawBytes);
      expect(createHash('sha256').update(raw).digest('hex')).toBe(evidence.rawSha256);
      const report = JSON.parse(raw.toString('utf8')) as {
        schema: string; runId: string; status: string; startedAt: string; endedAt: string;
        lifecycle: { status: string }; policy: { attemptCount: number; automaticRetries: number };
        source: { begin: Record<string, string>; end: Record<string, string> };
        inputs: Record<string, string>; browser: Record<string, string>;
        budget: {
          status: string; browserAuthorityMatch: boolean; producerAuthorityMatch: boolean;
          producerAuthority: { sha256: string }; observedProducerAuthority: unknown;
        };
        outcomes: Array<{ status: string }>; findings: string[];
        profiles: Record<ProfileName, Parameters<typeof calibrationMetrics>[0]>;
      };
      expect(report).toMatchObject({
        schema: 'cf-v2-compendium-memory-report/v1',
        runId: evidence.runId,
        status: 'calibration',
        lifecycle: { status: 'complete' },
        policy: { attemptCount: 1, automaticRetries: 0 },
        findings: [],
      });
      expect(report.source.begin).toEqual(report.source.end);
      expect(report.source.begin).toMatchObject({
        commit: 'b65fd5d4a1b7928fc8c722f4e6ac22cc2ef02974',
        branch: 'openai/mac', state: 'committed',
        statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });
      expect(report.budget).toMatchObject({
        status: 'calibration-required', browserAuthorityMatch: true,
        producerAuthorityMatch: true,
        producerAuthority: { sha256: RULER_PRODUCER_AUTHORITY },
      });
      expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
      expect(compendiumMeasurementAuthority(report.inputs)?.sha256)
        .toBe(RULER_MEASUREMENT_AUTHORITY);
      expect(report.outcomes).toHaveLength(78);
      expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
      expect(activeBudget.calibration.selectionRule).toContain(evidence.file);
      expect(activeBudget.calibration.selectionRule).toContain(evidence.rawSha256);
      expect(activeBudget.calibration.selectionRule).toContain(evidence.gzipSha256);

      for (const profile of PROFILE_NAMES) {
        const selected = activeBudget.calibration.samples[profile][runIndex] as
          CalibrationSample & Record<string, unknown>;
        const { measuredAt, ...selectedWithoutTimestamp } = selected;
        const measurement = report.profiles[profile];
        expect(selectedWithoutTimestamp).toEqual({
          runId: report.runId,
          commit: report.source.begin.commit,
          workingTreeDigest: report.source.begin.workingTreeSha256,
          inputDigest: createHash('sha256').update(stableJson(report.inputs)).digest('hex'),
          measurementAuthoritySha256: compendiumMeasurementAuthority(report.inputs)?.sha256,
          producerAuthoritySha256: report.budget.producerAuthority.sha256,
          sourceState: report.source.begin.state,
          sourceChanged: false,
          fixtureRowsSha256: report.inputs.fixtureRows,
          browser: {
            executable: report.browser.executable,
            product: report.browser.product,
            revision: report.browser.revision,
            userAgent: report.browser.user_agent,
            jsVersion: report.browser.js_version,
            protocolVersion: report.browser.protocol_version,
          },
          metrics: calibrationMetrics(measurement),
          evidence: candidateCalibrationEvidence(measurement, { runId: report.runId }),
        });
        expect(Date.parse(String(measuredAt))).toBeGreaterThanOrEqual(Date.parse(report.startedAt));
        expect(Date.parse(String(measuredAt))).toBeLessThanOrEqual(Date.parse(report.endedAt));
        expect(reduceCalibrationEvidence(selected.evidence)?.metrics).toEqual(selected.metrics);
      }
      expect(activeBudget.calibration.samples.phone[runIndex]?.measuredAt)
        .toBe(activeBudget.calibration.samples.desktop[runIndex]?.measuredAt);
    }

    const evidence = currentUniversePolishBaselineEvidence;
    const compressed = fs.readFileSync(path.join(v2Root, '..', '..', 'audits', evidence.file));
    expect(compressed).toHaveLength(evidence.gzipBytes);
    expect(createHash('sha256').update(compressed).digest('hex')).toBe(evidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(raw).toHaveLength(evidence.rawBytes);
    expect(createHash('sha256').update(raw).digest('hex')).toBe(evidence.rawSha256);
    const carrier = JSON.parse(raw.toString('utf8')) as {
      schema: string; runId: string; status: string;
      budgetAuthority: { collectorCommit: string; measurementAuthoritySha256: string };
      baselineSource: { begin: { commit: string }; end: { commit: string } };
      collectorSource: { begin: { commit: string }; end: { commit: string } };
      samples: Record<ProfileName, CalibrationSample>;
    };
    expect(carrier).toMatchObject({
      schema: 'cf-v2-compendium-memory-baseline-sample/v1',
      runId: evidence.runId,
      status: 'paired-broken-baseline-observation-not-a-budget',
      budgetAuthority: {
        collectorCommit: 'b65fd5d4a1b7928fc8c722f4e6ac22cc2ef02974',
        measurementAuthoritySha256: RULER_MEASUREMENT_AUTHORITY,
      },
    });
    expect(carrier.baselineSource.begin.commit).toBe(activeBudget.pairedBrokenBaseline.commit);
    expect(carrier.baselineSource.end).toEqual(carrier.baselineSource.begin);
    expect(carrier.collectorSource.begin.commit)
      .toBe(activeBudget.pairedBrokenBaseline.collectorCommit);
    expect(carrier.collectorSource.end).toEqual(carrier.collectorSource.begin);
    expect(activeBudget.calibration.selectionRule).toContain(evidence.file);
    expect(activeBudget.calibration.selectionRule).toContain(evidence.rawSha256);
    expect(activeBudget.calibration.selectionRule).toContain(evidence.gzipSha256);
    for (const profile of PROFILE_NAMES) {
      expect(activeBudget.pairedBrokenBaseline.samples[profile])
        .toEqual([carrier.samples[profile]]);
      expect(reduceCalibrationEvidence(carrier.samples[profile].evidence)?.metrics)
        .toEqual(carrier.samples[profile].metrics);
      expect(carrier.samples[profile].observedFaults)
        .toEqual(BROKEN_BASELINE_EXPECTED_FAULTS);
    }
  });

  it('rederives retained slice-repair carriers as historical evidence only', () => {
    for (const evidence of currentSliceRepairCandidateEvidence) {
      const compressed = fs.readFileSync(path.join(v2Root, '..', '..', 'audits', evidence.file));
      expect(createHash('sha256').update(compressed).digest('hex')).toBe(evidence.gzipSha256);
      const raw = gunzipSync(compressed);
      expect(createHash('sha256').update(raw).digest('hex')).toBe(evidence.rawSha256);
      const report = JSON.parse(raw.toString('utf8')) as {
        schema: string; runId: string; status: string; startedAt: string; endedAt: string;
        lifecycle: { status: string }; policy: { attemptCount: number; automaticRetries: number };
        source: { begin: Record<string, string>; end: Record<string, string> };
        inputs: Record<string, string>; browser: Record<string, string>;
        budget: {
          status: string; browserAuthorityMatch: boolean; producerAuthorityMatch: boolean;
          producerAuthority: { sha256: string }; observedProducerAuthority: unknown;
        };
        outcomes: Array<{ status: string }>; findings: string[];
        profiles: Record<ProfileName, Parameters<typeof calibrationMetrics>[0]>;
      };
      expect(report).toMatchObject({
        schema: 'cf-v2-compendium-memory-report/v1',
        runId: evidence.runId,
        status: 'calibration',
        lifecycle: { status: 'complete' },
        policy: { attemptCount: 1, automaticRetries: 0 },
        findings: [],
      });
      expect(report.source.begin).toEqual(report.source.end);
      expect(report.source.begin).toMatchObject({
        commit: '8ffd2e2b4a8ba070cb93d3df6a8f4a91a245f527',
        branch: 'openai/mac',
        state: 'committed',
        statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });
      expect(report.budget).toMatchObject({
        status: 'calibration-required',
        browserAuthorityMatch: true,
        producerAuthorityMatch: true,
        producerAuthority: { sha256: HISTORICAL_RULER_PRODUCER_AUTHORITY },
      });
      expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
      expect(compendiumMeasurementAuthority(report.inputs)?.sha256)
        .toBe(HISTORICAL_RULER_MEASUREMENT_AUTHORITY);
      expect(report.outcomes).toHaveLength(78);
      expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);

      for (const profile of PROFILE_NAMES) {
        const measurement = report.profiles[profile];
        const metrics = calibrationMetrics(measurement);
        const evidenceProjection = candidateCalibrationEvidence(
          measurement, { runId: report.runId },
        );
        expect(metrics).toBeDefined();
        expect(evidenceProjection?.schema).toBe(CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA);
        expect(reduceCalibrationEvidence(evidenceProjection)?.metrics).toEqual(metrics);
        expect(activeBudget.calibration.samples[profile].map((sample) => sample.runId))
          .not.toContain(evidence.runId);
      }
    }

    const baselineCompressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', currentSliceRepairBaselineEvidence.file,
    ));
    expect(createHash('sha256').update(baselineCompressed).digest('hex'))
      .toBe(currentSliceRepairBaselineEvidence.gzipSha256);
    const baselineRaw = gunzipSync(baselineCompressed);
    expect(createHash('sha256').update(baselineRaw).digest('hex'))
      .toBe(currentSliceRepairBaselineEvidence.rawSha256);
    const baselineCarrier = JSON.parse(baselineRaw.toString('utf8')) as {
      schema: string; runId: string; status: string;
      budgetAuthority: { collectorCommit: string; measurementAuthoritySha256: string };
      baselineSource: { begin: { commit: string }; end: { commit: string } };
      collectorSource: { begin: { commit: string }; end: { commit: string } };
      samples: Record<ProfileName, CalibrationSample>;
    };
    expect(baselineCarrier).toMatchObject({
      schema: 'cf-v2-compendium-memory-baseline-sample/v1',
      runId: currentSliceRepairBaselineEvidence.runId,
      status: 'paired-broken-baseline-observation-not-a-budget',
      budgetAuthority: {
        collectorCommit: '8ffd2e2b4a8ba070cb93d3df6a8f4a91a245f527',
        measurementAuthoritySha256: HISTORICAL_RULER_MEASUREMENT_AUTHORITY,
      },
    });
    expect(baselineCarrier.baselineSource.begin.commit)
      .toBe(activeBudget.pairedBrokenBaseline.commit);
    expect(baselineCarrier.baselineSource.end).toEqual(baselineCarrier.baselineSource.begin);
    expect(baselineCarrier.collectorSource.begin.commit)
      .toBe('8ffd2e2b4a8ba070cb93d3df6a8f4a91a245f527');
    expect(baselineCarrier.collectorSource.end).toEqual(baselineCarrier.collectorSource.begin);
    for (const profile of PROFILE_NAMES) {
      const selected = activeBudget.pairedBrokenBaseline.samples[profile][0];
      expect(selected?.runId).toBe(EXPECTED_BASELINE_RUN);
      expect(selected).not.toEqual(baselineCarrier.samples[profile]);
      expect(reduceCalibrationEvidence(baselineCarrier.samples[profile].evidence)?.metrics)
        .toEqual(baselineCarrier.samples[profile].metrics);
      expect(baselineCarrier.samples[profile].observedFaults)
        .toEqual(BROKEN_BASELINE_EXPECTED_FAULTS);
    }
  });

  it('retains the prior phase-4 calibration capsules as historical evidence only', () => {
    const calibrationRequired = activeBudget.status === 'calibration-required';
    for (const evidence of historicalPhase4CandidateEvidence) {
      const compressed = fs.readFileSync(path.join(v2Root, '..', '..', 'audits', evidence.file));
      expect(createHash('sha256').update(compressed).digest('hex')).toBe(evidence.gzipSha256);
      const raw = gunzipSync(compressed);
      expect(createHash('sha256').update(raw).digest('hex')).toBe(evidence.rawSha256);
      const report = JSON.parse(raw.toString('utf8')) as {
        schema: string; runId: string; status: string; startedAt: string; endedAt: string;
        lifecycle: { status: string }; source: { begin: Record<string, string>; end: Record<string, string> };
        inputs: Record<string, string>; browser: Record<string, string>;
        budget: { producerAuthority: unknown; observedProducerAuthority: unknown; producerAuthorityMatch: boolean; browserAuthorityMatch: boolean };
        outcomes: Array<{ status: string }>; findings: string[];
        profiles: Record<ProfileName, Parameters<typeof calibrationMetrics>[0]>;
      };
      expect(report).toMatchObject({
        schema: 'cf-v2-compendium-memory-report/v1',
        runId: evidence.runId,
        status: 'calibration',
        lifecycle: { status: 'complete' },
        findings: [],
      });
      expect(report.source.begin).toEqual(report.source.end);
      expect(report.source.begin.state).toBe('committed');
      expect(report.budget.producerAuthorityMatch).toBe(true);
      expect(report.budget.browserAuthorityMatch).toBe(true);
      expect(report.budget.producerAuthority).toEqual(HISTORICAL_PHASE4_PRODUCER_AUTHORITY);
      expect(report.budget.observedProducerAuthority)
        .toEqual(HISTORICAL_PHASE4_PRODUCER_AUTHORITY);
      expect(report.budget.producerAuthority).not.toEqual(budget.producerAuthority);
      expect(report.inputs.collector).toBe(HISTORICAL_RULER_COLLECTOR_AUTHORITY);
      expect(compendiumMeasurementAuthority(report.inputs)?.sha256)
        .toBe(HISTORICAL_RULER_MEASUREMENT_AUTHORITY);
      expect(report.outcomes).toHaveLength(78);
      expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
      for (const profile of PROFILE_NAMES) {
        expect(calibrationMetrics(report.profiles[profile])).toBeDefined();
        expect(candidateCalibrationEvidence(
          report.profiles[profile], { runId: evidence.runId },
        )?.schema).toBe(CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA);
      }
    }

    const baselineCompressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', historicalPhase4BaselineEvidence.file,
    ));
    expect(createHash('sha256').update(baselineCompressed).digest('hex'))
      .toBe(historicalPhase4BaselineEvidence.gzipSha256);
    const baselineRaw = gunzipSync(baselineCompressed);
    expect(createHash('sha256').update(baselineRaw).digest('hex'))
      .toBe(historicalPhase4BaselineEvidence.rawSha256);
    const baselineCarrier = JSON.parse(baselineRaw.toString('utf8')) as {
      runId: string;
      status: string;
      budgetAuthority: { collectorCommit: string; measurementAuthoritySha256: string };
      baselineSource: { begin: { commit: string }; end: { commit: string } };
      collectorSource: { begin: { commit: string }; end: { commit: string } };
      samples: Record<ProfileName, CalibrationSample>;
    };
    expect(baselineCarrier.runId).toBe(historicalPhase4BaselineEvidence.runId);
    expect(baselineCarrier.status).toBe('paired-broken-baseline-observation-not-a-budget');
    expect(baselineCarrier.budgetAuthority.measurementAuthoritySha256)
      .toBe(HISTORICAL_RULER_MEASUREMENT_AUTHORITY);
    expect(baselineCarrier.baselineSource.begin.commit)
      .toBe(activeBudget.pairedBrokenBaseline.commit);
    expect(baselineCarrier.baselineSource.end).toEqual(baselineCarrier.baselineSource.begin);
    expect(baselineCarrier.collectorSource.begin.commit).toBe('6d8f18479cce14dc031608aaa12fca331d1eea20');
    expect(baselineCarrier.collectorSource.end).toEqual(baselineCarrier.collectorSource.begin);
    for (const profile of PROFILE_NAMES) {
      expect(sampleObjectSha256(baselineCarrier.samples[profile]))
        .toBe(historicalPhase4BaselineEvidence.sampleSha256[profile]);
      expect(baselineCarrier.samples[profile].observedFaults)
        .toEqual(BROKEN_BASELINE_EXPECTED_FAULTS);
      if (calibrationRequired) {
        expect(activeBudget.pairedBrokenBaseline.samples[profile]).toEqual([]);
        expect(activeBudget.calibration.selectionRule)
          .toContain(historicalPhase4BaselineEvidence.runId);
      } else {
        expect(activeBudget.pairedBrokenBaseline.samples[profile][0]?.runId)
          .toBe(EXPECTED_BASELINE_RUN);
        expect(activeBudget.pairedBrokenBaseline.samples[profile][0])
          .not.toEqual(baselineCarrier.samples[profile]);
      }
    }
  });

  it('retains the prior slice-repair exact-budget certificate without rebinding it', () => {
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', historicalSliceRepairCertificationEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(historicalSliceRepairCertificationEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(historicalSliceRepairCertificationEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as RetainedLinuxReport & {
      startedAt: string; endedAt: string; durationMs: number; expectedOutcomes: string[];
      reviewPacket: Array<Record<string, unknown>>;
    };
    type CurrentCertificateProfile = {
      reviewPacket: Array<Record<string, unknown>>;
      points: { first: { raw: { mountedRowCount: number } } };
    };
    const requireCurrentCertificateProfile = (
      value: unknown, profile: ProfileName,
    ): CurrentCertificateProfile => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`${profile} certificate profile must be an object`);
      }
      const record = value as Record<string, unknown>;
      const points = record.points;
      if (!Array.isArray(record.reviewPacket)
        || !record.reviewPacket.every((entry) =>
          typeof entry === 'object' && entry !== null && !Array.isArray(entry))
        || typeof points !== 'object' || points === null || Array.isArray(points)) {
        throw new Error(`${profile} certificate profile lacks exact review/point evidence`);
      }
      const first = (points as Record<string, unknown>).first;
      if (typeof first !== 'object' || first === null || Array.isArray(first)) {
        throw new Error(`${profile} certificate profile lacks the first point`);
      }
      const firstRaw = (first as Record<string, unknown>).raw;
      if (typeof firstRaw !== 'object' || firstRaw === null || Array.isArray(firstRaw)) {
        throw new Error(`${profile} certificate profile lacks first-point raw evidence`);
      }
      const mountedRowCount = (firstRaw as Record<string, unknown>).mountedRowCount;
      if (!Number.isSafeInteger(mountedRowCount) || Number(mountedRowCount) < 0) {
        throw new Error(`${profile} certificate profile has invalid mounted-row evidence`);
      }
      return value as CurrentCertificateProfile;
    };
    const certificateProfiles = Object.fromEntries(PROFILE_NAMES.map((profile) => [
      profile, requireCurrentCertificateProfile(report.profiles[profile], profile),
    ])) as Record<ProfileName, CurrentCertificateProfile>;

    expect(Object.keys(report).sort()).toEqual([
      'schema', 'status', 'runId', 'lifecycle', 'startedAt', 'endedAt', 'durationMs',
      'policy', 'source', 'inputs', 'browser', 'budget', 'expectedOutcomes', 'outcomes',
      'findings', 'profiles', 'reviewPacket', 'partialFailure', 'blockedOutcomes',
    ].sort());
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: historicalSliceRepairCertificationEvidence.runId,
      status: 'pass',
      startedAt: historicalSliceRepairCertificationEvidence.startedAt,
      endedAt: historicalSliceRepairCertificationEvidence.endedAt,
      durationMs: historicalSliceRepairCertificationEvidence.durationMs,
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      policy: {
        attemptCount: 1,
        automaticRetries: 0,
        commandTimeoutMs: 2_000,
        targetTimeoutMs: 2_000,
        heartbeatTimeoutMs: 2_000,
        transportTimeoutMs: 5_000,
      },
      findings: [],
      partialFailure: null,
      blockedOutcomes: [],
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toEqual({
      commit: historicalSliceRepairCertificationEvidence.sourceCommit,
      branch: 'openai/mac',
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workingTreeSha256: historicalSliceRepairCertificationEvidence.sourceWorkingTreeSha256,
    });

    expect(fileSha256(budgetPath)).not.toBe(historicalSliceRepairCertificationEvidence.budgetSha256);
    expect(compendiumMeasurementAuthority(report.inputs)?.sha256)
      .toBe(historicalSliceRepairCertificationEvidence.measurementAuthoritySha256);
    expect(historicalSliceRepairCertificationEvidence.measurementAuthoritySha256)
      .toBe(HISTORICAL_RULER_MEASUREMENT_AUTHORITY);
    expect(report.budget).toEqual({
      status: 'active',
      path: 'budgets/compendium-memory-v1.json',
      sha256: historicalSliceRepairCertificationEvidence.budgetSha256,
      browserAuthority: HISTORICAL_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthority: HISTORICAL_RULER_PRODUCER_AUTHORITY_RECORD,
      observedProducerAuthority: HISTORICAL_RULER_PRODUCER_AUTHORITY_RECORD,
      producerAuthorityMatch: true,
    });
    expect(report.budget.producerAuthority.sha256).toBe(HISTORICAL_RULER_PRODUCER_AUTHORITY);
    expect(report.budget.producerAuthority).not.toEqual(activeBudget.producerAuthority);
    expect(report.budget.producerAuthority).not.toEqual(HISTORICAL_PHASE4_PRODUCER_AUTHORITY);
    expect(historicalSliceRepairCertificationEvidence.producerAuthoritySha256)
      .toBe(HISTORICAL_RULER_PRODUCER_AUTHORITY);
    expect(report.browser).toEqual(historicalSliceRepairCertificationEvidence.browser);
    expect(compendiumBrowserAuthorityMatches(
      report.browser, report.budget.browserAuthority,
    )).toBe(true);

    expect(report.expectedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
    expect(report.reviewPacket).toEqual(PROFILE_NAMES.flatMap(
      (profile) => certificateProfiles[profile].reviewPacket,
    ));
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.ceilings).toBeNull();
      expect(activeBudget.calibration.selectionRule)
        .toContain(historicalSliceRepairCertificationEvidence.runId);
      return;
    }
    const historicalCeilings = structuredClone(activeBudget.ceilings!);
    Object.assign(historicalCeilings.phone, {
      heapUsedBytesMax: 10_485_760,
      backingStorageBytesMax: 4_194_304,
      heapAggregateBytesMax: 16_777_216,
      liveEncodedBytesMax: 2_621_440,
      livePortraitEncodedBytesMax: 262_144,
    });
    Object.assign(historicalCeilings.desktop, {
      heapUsedBytesMax: 14_680_064,
      backingStorageBytesMax: 6_291_456,
      heapAggregateBytesMax: 20_971_520,
      liveEncodedBytesMax: 6_815_744,
      livePortraitEncodedBytesMax: 262_144,
    });
    const rulerReplayBudget = {
      ...activeBudget,
      measurementAuthority: { sha256: HISTORICAL_RULER_MEASUREMENT_AUTHORITY },
      producerAuthority: HISTORICAL_RULER_PRODUCER_AUTHORITY_RECORD,
      ceilings: historicalCeilings,
    } as unknown as ActiveBudgetRecord;
    const replayedOutcomes = PROFILE_NAMES.flatMap((profile) => evaluateProfile(
      certificateProfiles[profile], rulerReplayBudget, fixture,
    ));
    expect(replayedOutcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(replayedOutcomes.filter((outcome) => outcome.status === 'pass')).toHaveLength(74);
    expect(replayedOutcomes.filter((outcome) => outcome.status === 'fail')
      .map((outcome) => outcome.id)).toEqual([
      'phone/lazy-art-not-eager',
      'phone/warm-precondition',
      'desktop/lazy-art-not-eager',
      'desktop/warm-precondition',
    ]);
    expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
    expect(report.inputs.outcomeContract)
      .not.toBe(fileSha256(path.join(v2Root, 'tools', 'compendiummem-contract.mjs')));

    const liveProducerReplayFailures = PROFILE_NAMES.flatMap((profile) => evaluateProfile(
      certificateProfiles[profile], activeBudget, fixture,
    ))
      .filter((outcome) => outcome.status === 'fail')
      .map((outcome) => outcome.id);
    expect(liveProducerReplayFailures).toEqual([
      'phone/lazy-art-not-eager',
      'phone/warm-precondition',
      'desktop/lazy-art-not-eager',
      'desktop/warm-precondition',
    ]);

    for (const profile of PROFILE_NAMES) {
      const overCeiling = structuredClone(certificateProfiles[profile]);
      overCeiling.points.first.raw.mountedRowCount =
        Number(rulerReplayBudget.ceilings?.[profile].mountedRowsMax) + 1;
      const mutatedFailures = evaluateProfile(overCeiling, rulerReplayBudget, fixture)
        .filter((outcome) => outcome.status === 'fail')
        .filter((outcome) => !['lazy-art-not-eager', 'warm-precondition']
          .includes(outcome.check))
        .map((outcome) => outcome.id);
      expect(mutatedFailures).toEqual([
        `${profile}/mounted-window-bounded`,
        `${profile}/mounted-natural-dimensions`,
      ]);
    }
  });

  it('retains the prior phase-4 exact-budget certificate without rebinding it', () => {
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', historicalPhase4CertificationEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(historicalPhase4CertificationEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(historicalPhase4CertificationEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as RetainedLinuxReport & {
      startedAt: string; endedAt: string; durationMs: number; expectedOutcomes: string[];
    };

    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: historicalPhase4CertificationEvidence.runId,
      status: 'pass',
      startedAt: historicalPhase4CertificationEvidence.startedAt,
      endedAt: historicalPhase4CertificationEvidence.endedAt,
      durationMs: historicalPhase4CertificationEvidence.durationMs,
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      policy: {
        attemptCount: 1,
        automaticRetries: 0,
        commandTimeoutMs: 2_000,
        targetTimeoutMs: 2_000,
        heartbeatTimeoutMs: 2_000,
        transportTimeoutMs: 5_000,
      },
      findings: [],
      partialFailure: null,
      blockedOutcomes: [],
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toEqual({
      commit: historicalPhase4CertificationEvidence.sourceCommit,
      branch: 'openai/mac',
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workingTreeSha256: historicalPhase4CertificationEvidence.sourceWorkingTreeSha256,
    });

    expect(fileSha256(budgetPath)).not.toBe(historicalPhase4CertificationEvidence.budgetSha256);
    expect(report.inputs.budget).toBe(historicalPhase4CertificationEvidence.budgetSha256);
    expect(report.inputs.collector).toBe(HISTORICAL_RULER_COLLECTOR_AUTHORITY);
    expect(compendiumMeasurementAuthority(report.inputs)?.sha256)
      .toBe(historicalPhase4CertificationEvidence.measurementAuthoritySha256);
    expect(historicalPhase4CertificationEvidence.measurementAuthoritySha256)
      .toBe(HISTORICAL_RULER_MEASUREMENT_AUTHORITY);
    expect(report.budget).toMatchObject({
      status: 'active',
      path: 'budgets/compendium-memory-v1.json',
      sha256: historicalPhase4CertificationEvidence.budgetSha256,
      browserAuthority: HISTORICAL_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthorityMatch: true,
    });
    expect(report.budget.browserAuthority).toEqual(HISTORICAL_BROWSER_AUTHORITY);
    expect(report.budget.browserAuthority).not.toEqual(activeBudget.browserAuthority);
    expect(report.budget.producerAuthority).toEqual(HISTORICAL_PHASE4_PRODUCER_AUTHORITY);
    expect(report.budget.producerAuthority).toMatchObject({
      sha256: historicalPhase4CertificationEvidence.producerAuthoritySha256,
    });
    expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
    expect(report.budget.producerAuthority).not.toEqual(budget.producerAuthority);
    expect(historicalPhase4CertificationEvidence.producerAuthoritySha256)
      .toBe(HISTORICAL_PHASE4_PRODUCER_AUTHORITY.sha256);
    expect(historicalPhase4CertificationEvidence.producerAuthoritySha256)
      .not.toBe(EXPECTED_PRODUCER_AUTHORITY);

    expect(report.browser).toEqual(historicalPhase4CertificationEvidence.browser);
    expect(compendiumBrowserAuthorityMatches(
      report.browser, report.budget.browserAuthority,
    )).toBe(true);
    expect(report.expectedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.ceilings).toBeNull();
      expect(activeBudget.calibration.selectionRule)
        .toContain(historicalPhase4CertificationEvidence.runId);
    } else {
      expect(activeBudget.ceilings).not.toBeNull();
    }
  });

  it('retains the superseded exact-budget certificate without rebinding it', () => {
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', historicalCertificationEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(historicalCertificationEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(historicalCertificationEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as RetainedLinuxReport & {
      expectedOutcomes: string[];
    };
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: historicalCertificationEvidence.runId,
      status: 'pass',
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      findings: [],
      partialFailure: null,
      blockedOutcomes: [],
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toMatchObject({
      commit: historicalCertificationEvidence.sourceCommit,
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    expect(report.inputs.budget).toBe(historicalCertificationEvidence.budgetSha256);
    expect(fileSha256(budgetPath)).not.toBe(historicalCertificationEvidence.budgetSha256);
    expect(report.budget).toMatchObject({
      status: 'active',
      sha256: historicalCertificationEvidence.budgetSha256,
      browserAuthority: HISTORICAL_EDGE_101_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthorityMatch: true,
    });
    expect(report.budget.producerAuthority).toMatchObject({
      sha256: HISTORICAL_EDGE_101_PRODUCER_AUTHORITY,
    });
    expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
    expect(report.budget.producerAuthority).not.toEqual(budget.producerAuthority);
    expect(report.browser).toMatchObject({
      product: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.product,
      revision: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.revision,
      js_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.jsVersion,
      protocol_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.protocolVersion,
    });
    expect(report.expectedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
  });

  it('retains the superseded row-activation certificate without rebinding it', () => {
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', supersededRowActivationCertificationEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(supersededRowActivationCertificationEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(supersededRowActivationCertificationEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as RetainedLinuxReport & {
      expectedOutcomes: string[];
    };
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: supersededRowActivationCertificationEvidence.runId,
      status: 'pass',
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      findings: [],
      partialFailure: null,
      blockedOutcomes: [],
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toMatchObject({
      commit: supersededRowActivationCertificationEvidence.sourceCommit,
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    expect(report.inputs.budget).toBe(supersededRowActivationCertificationEvidence.budgetSha256);
    expect(fileSha256(budgetPath)).not.toBe(
      supersededRowActivationCertificationEvidence.budgetSha256,
    );
    expect(report.budget).toMatchObject({
      status: 'active',
      sha256: supersededRowActivationCertificationEvidence.budgetSha256,
      browserAuthority: HISTORICAL_EDGE_101_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthorityMatch: true,
    });
    expect(report.budget.producerAuthority).toMatchObject({
      sha256: HISTORICAL_EDGE_101_PRODUCER_AUTHORITY,
    });
    expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
    expect(report.budget.producerAuthority).not.toEqual(budget.producerAuthority);
    expect(report.browser).toMatchObject({
      product: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.product,
      revision: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.revision,
      js_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.jsVersion,
      protocol_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.protocolVersion,
    });
    expect(report.expectedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
  });

  it('retains the superseded render-stable certificate without rebinding it', () => {
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', supersededRenderStableCertificationEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(supersededRenderStableCertificationEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(supersededRenderStableCertificationEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as RetainedLinuxReport & {
      expectedOutcomes: string[];
    };
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: supersededRenderStableCertificationEvidence.runId,
      status: 'pass',
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      findings: [],
      partialFailure: null,
      blockedOutcomes: [],
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toMatchObject({
      commit: supersededRenderStableCertificationEvidence.sourceCommit,
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    expect(report.inputs.budget).toBe(supersededRenderStableCertificationEvidence.budgetSha256);
    expect(fileSha256(budgetPath)).not.toBe(
      supersededRenderStableCertificationEvidence.budgetSha256,
    );
    expect(report.budget).toMatchObject({
      status: 'active',
      sha256: supersededRenderStableCertificationEvidence.budgetSha256,
      browserAuthority: HISTORICAL_EDGE_101_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthorityMatch: true,
    });
    expect(report.budget.producerAuthority).toMatchObject({
      sha256: HISTORICAL_EDGE_101_PRODUCER_AUTHORITY,
    });
    expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
    expect(report.budget.producerAuthority).not.toEqual(budget.producerAuthority);
    expect(report.browser).toMatchObject({
      product: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.product,
      revision: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.revision,
      js_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.jsVersion,
      protocol_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.protocolVersion,
    });
    expect(report.expectedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
  });

  it('keeps every active ceiling strictly above its samples and below the broken shape', () => {
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.ceilings).toBeNull();
      return;
    }
    expect(strictHeadroomFailures(activeBudget)).toEqual([]);
    const baselineBreaches: Record<ProfileName, string[]> = {
      phone: [
        'mountedRowsMax', 'heapUsedBytesMax', 'nodesMax',
        'embedderHeapUsedBytesMax', 'backingStorageBytesMax', 'heapAggregateBytesMax',
        'liveCacheEntriesMax', 'liveDecodedPixelsMax', 'liveDecodedBytesMax',
        'liveEncodedBytesMax', 'livePortraitCacheEntriesMax',
        'livePortraitEncodedBytesMax', 'warmHeapAggregateRangeBytesMax',
        'warmEncodedBytesRangeMax',
      ],
      desktop: [
        'mountedRowsMax', 'nodesMax', 'embedderHeapUsedBytesMax',
        'backingStorageBytesMax', 'heapAggregateBytesMax', 'liveCacheEntriesMax',
        'liveDecodedPixelsMax', 'liveDecodedBytesMax', 'liveEncodedBytesMax',
        'livePortraitCacheEntriesMax', 'livePortraitEncodedBytesMax',
        'warmHeapAggregateRangeBytesMax', 'warmEncodedBytesRangeMax',
      ],
    };
    for (const profile of PROFILE_NAMES) {
      const baseline = activeBudget.pairedBrokenBaseline.samples[profile][0];
      const ceiling = activeBudget.ceilings?.[profile];
      expect(baseline).toBeDefined();
      expect(ceiling).toBeDefined();
      const breached = CEILING_FIELDS.filter((ceilingField, index) => {
        const sampleField = SAMPLE_METRIC_FIELDS[index];
        if (!sampleField || !baseline || !ceiling) return false;
        return baseline.metrics[sampleField]! > Number(ceiling[ceilingField]);
      });
      expect(breached).toEqual(baselineBreaches[profile]);
      expect(Object.fromEntries(CEILING_FIELDS.map((field) => [field, ceiling?.[field]])))
        .toEqual(EXPECTED_CEILINGS[profile]);
    }

    for (const profile of PROFILE_NAMES) {
      for (const [index, ceilingField] of CEILING_FIELDS.entries()) {
        const sampleField = SAMPLE_METRIC_FIELDS[index]!;
        const equality = structuredClone(activeBudget);
        const measuredMax = Math.max(...equality.calibration.samples[profile]
          .map((sample) => sample.metrics[sampleField]!));
        equality.ceilings![profile][ceilingField] = measuredMax;
        expect(strictHeadroomFailures(equality)).toContain(`${profile}.${ceilingField}`);
        expect(validateBudgetRecord(
          equality, fixture.rowsSha256, baselineProjection.rowsSha256,
        ).errors.join('\n')).toContain(
          `active ${profile}.${ceilingField} must be strictly above measured ${sampleField} max`,
        );
      }
    }
  });

  it('uses strict sentinels below the next reachable capped resource state', () => {
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.ceilings).toBeNull();
      return;
    }
    const phone = activeBudget.ceilings!.phone;
    const desktop = activeBudget.ceilings!.desktop;
    expect(phone.liveCacheEntriesMax).toBe(96.5);
    expect(desktop.liveCacheEntriesMax).toBe(256.5);
    for (const profile of PROFILE_NAMES) {
      const ceiling = activeBudget.ceilings![profile];
      const samples = activeBudget.calibration.samples[profile];
      expect(ceiling.documentsMax).toBe(2.5);
      expect(ceiling.activeJobsPeakMax).toBe(1.5);
      expect(ceiling.liveSubscribersMax).toBe(0.5);
      expect(ceiling.livePortraitCacheEntriesMax).toBe(1.5);
      expect(ceiling.warmEncodedBytesRangeMax).toBe(0.5);
      expect(ceiling.liveDecodedPixelsMax).toBe(
        Math.max(...samples.map((sample) => sample.metrics.liveDecodedPixels!)) + 1,
      );
      expect(ceiling.liveDecodedBytesMax).toBe(
        Math.max(...samples.map((sample) => sample.metrics.liveDecodedBytes!)) + 1,
      );
    }
  });

  it('binds the retained Linux variance without surrendering paired-baseline discrimination', () => {
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.ceilings).toBeNull();
      return;
    }
    expect(activeBudget.calibration.selectionRule).toContain(RETAINED_LINUX_COMPATIBILITY.runId);
    expect(activeBudget.calibration.selectionRule)
      .toContain(RETAINED_LINUX_COMPATIBILITY.reportSha256);

    const compressedReport = fs.readFileSync(retainedLinuxReportPath);
    expect(createHash('sha256').update(compressedReport).digest('hex'))
      .toBe(RETAINED_LINUX_COMPATIBILITY.gzipSha256);
    const rawReport = gunzipSync(compressedReport);
    expect(createHash('sha256').update(rawReport).digest('hex'))
      .toBe(RETAINED_LINUX_COMPATIBILITY.reportSha256);
    const retainedReport = JSON.parse(rawReport.toString('utf8')) as RetainedLinuxReport;

    expect(retainedReport.schema).toBe('cf-v2-compendium-memory-report/v1');
    expect(retainedReport.runId).toBe(RETAINED_LINUX_COMPATIBILITY.reportRunId);
    expect(retainedReport.status).toBe('fail');
    expect(retainedReport.source.begin).toEqual(RETAINED_LINUX_COMPATIBILITY.source);
    expect(retainedReport.source.end).toEqual(RETAINED_LINUX_COMPATIBILITY.source);
    expect(retainedReport.inputs.budget)
      .toBe(RETAINED_LINUX_COMPATIBILITY.originalBudgetSha256);
    expect(retainedReport.inputs.fixtureRows).toBe(fixture.rowsSha256);
    expect(retainedReport.inputs.collector).toBe(RETAINED_LINUX_COLLECTOR_AUTHORITY);
    expect(compendiumMeasurementAuthority(retainedReport.inputs)?.sha256)
      .toBe(RETAINED_LINUX_MEASUREMENT_AUTHORITY);
    expect(retainedReport.browser).toEqual({
      executable: '/opt/microsoft/msedge/microsoft-edge',
      product: RETAINED_LINUX_BROWSER_AUTHORITY.product,
      revision: RETAINED_LINUX_BROWSER_AUTHORITY.revision,
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
      js_version: RETAINED_LINUX_BROWSER_AUTHORITY.jsVersion,
      protocol_version: RETAINED_LINUX_BROWSER_AUTHORITY.protocolVersion,
    });
    expect(retainedReport.budget).toMatchObject({
      status: 'active',
      path: 'budgets/compendium-memory-v1.json',
      sha256: RETAINED_LINUX_COMPATIBILITY.originalBudgetSha256,
      browserAuthority: RETAINED_LINUX_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthorityMatch: true,
    });
    expect(retainedReport.budget.producerAuthority).toMatchObject({
      sha256: RETAINED_LINUX_PRODUCER_AUTHORITY,
    });
    expect(retainedReport.budget.observedProducerAuthority).toEqual(
      retainedReport.budget.producerAuthority,
    );
    expect(retainedReport.budget.producerAuthority).not.toEqual(budget.producerAuthority);
    expect(retainedReport.policy).toEqual({
      attemptCount: 1,
      automaticRetries: 0,
      commandTimeoutMs: 2_000,
      targetTimeoutMs: 2_000,
      heartbeatTimeoutMs: 2_000,
      transportTimeoutMs: 5_000,
    });
    expect(retainedReport.lifecycle)
      .toEqual({ schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' });
    expect(retainedReport.partialFailure).toBeNull();
    expect(retainedReport.blockedOutcomes).toEqual([]);
    expect(retainedReport.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(retainedReport.outcomes.filter((outcome) => outcome.status === 'pass')).toHaveLength(75);
    const originalFailures = retainedReport.outcomes
      .filter((outcome) => outcome.status === 'fail');
    expect(originalFailures.map((outcome) => outcome.id)).toEqual([
      'phone/warm-plateau', 'phone/byte-ceiling', 'desktop/byte-ceiling',
    ]);
    expect(originalFailures.map((outcome) => outcome.diagnosis)).toEqual(retainedReport.findings);
    const originalFailureById = new Map(originalFailures.map((outcome) => [outcome.id, outcome]));
    expect(originalFailureById.get('phone/warm-plateau')?.evidence?.warmHeapAggregateRange)
      .toBe(RETAINED_LINUX_COMPATIBILITY.phone.warmHeapAggregateRangeBytes);
    expect(originalFailureById.get('phone/byte-ceiling')?.evidence?.observed
      ?.portraitEncodedBytesMax)
      .toBe(RETAINED_LINUX_COMPATIBILITY.phone.livePortraitEncodedBytes);
    expect(originalFailureById.get('desktop/byte-ceiling')?.evidence?.observed
      ?.portraitEncodedBytesMax)
      .toBe(RETAINED_LINUX_COMPATIBILITY.desktop.livePortraitEncodedBytes);

    const replay = (record: ActiveBudgetRecord) => {
      const historicalRecord = structuredClone(record);
      historicalRecord.producerAuthority = retainedReport.budget.producerAuthority as {
        sha256: string;
      };
      return PROFILE_NAMES.flatMap((profile) => evaluateProfile(
        retainedReport.profiles[profile], historicalRecord, fixture,
      ));
    };
    const repairedOutcomes = replay(activeBudget);
    expect(repairedOutcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(repairedOutcomes.filter((outcome) => outcome.status === 'pass')).toHaveLength(74);
    expect(repairedOutcomes.filter((outcome) => outcome.status === 'fail')
      .map((outcome) => outcome.id)).toEqual([
      'phone/lazy-art-not-eager',
      'phone/warm-precondition',
      'desktop/lazy-art-not-eager',
      'desktop/warm-precondition',
    ]);
    expect(retainedReport.inputs.outcomeContract)
      .not.toBe(fileSha256(path.join(v2Root, 'tools', 'compendiummem-contract.mjs')));

    const observations = [
      {
        profile: 'phone' as const,
        ceilingField: 'warmHeapAggregateRangeBytesMax',
        sampleField: 'warmHeapAggregateRangeBytes',
        observed: RETAINED_LINUX_COMPATIBILITY.phone.warmHeapAggregateRangeBytes,
        expectedCeiling: 524_288,
        expectedHeadroom: 426_968,
        expectedFailure: 'phone/warm-plateau',
      },
      {
        profile: 'phone' as const,
        ceilingField: 'livePortraitEncodedBytesMax',
        sampleField: 'livePortraitEncodedBytes',
        observed: RETAINED_LINUX_COMPATIBILITY.phone.livePortraitEncodedBytes,
        expectedCeiling: 393_216,
        expectedHeadroom: 172_686,
        expectedFailure: 'phone/byte-ceiling',
      },
      {
        profile: 'desktop' as const,
        ceilingField: 'livePortraitEncodedBytesMax',
        sampleField: 'livePortraitEncodedBytes',
        observed: RETAINED_LINUX_COMPATIBILITY.desktop.livePortraitEncodedBytes,
        expectedCeiling: 393_216,
        expectedHeadroom: 172_686,
        expectedFailure: 'desktop/byte-ceiling',
      },
    ];
    for (const observation of observations) {
      const ceiling = Number(activeBudget.ceilings![observation.profile][observation.ceilingField]);
      const baseline = activeBudget.pairedBrokenBaseline.samples[observation.profile][0];
      const admitted = (value: number) => Number.isSafeInteger(value) && value <= ceiling;
      expect(ceiling).toBe(observation.expectedCeiling);
      expect(admitted(observation.observed)).toBe(true);
      expect(admitted(ceiling)).toBe(true);
      expect(admitted(ceiling + 1)).toBe(false);
      expect(ceiling - observation.observed).toBe(observation.expectedHeadroom);
      expect(baseline?.metrics[observation.sampleField]).toBeGreaterThan(ceiling);

      const justBelow = structuredClone(activeBudget);
      justBelow.ceilings![observation.profile][observation.ceilingField]
        = observation.observed - 1;
      expect(replay(justBelow).filter((outcome) => outcome.status === 'fail')
        .filter((outcome) => !['lazy-art-not-eager', 'warm-precondition']
          .includes(outcome.check))
        .map((outcome) => outcome.id)).toEqual([observation.expectedFailure]);
    }
  });

  it('requires one explicit version-tolerant Edge compatibility authority', () => {
    expect(validCompendiumBrowserAuthority(activeBudget.browserAuthority)).toBe(true);
    expect(activeBudget.browserAuthority).toEqual(EXPECTED_BROWSER_AUTHORITY);

    const missing = structuredClone(activeBudget) as unknown as {
      browserAuthority?: BrowserAuthority;
    };
    delete missing.browserAuthority;
    expect(validateBudgetRecord(
      missing, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n')).toMatch(/budget browser authority is invalid/);

    const extra = structuredClone(activeBudget) as unknown as {
      browserAuthority: BrowserAuthority & { decoy?: string };
    };
    extra.browserAuthority.decoy = 'not authority';
    expect(validateBudgetRecord(
      extra, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n')).toMatch(/budget browser authority is invalid/);

    for (const field of Object.keys(EXPECTED_BROWSER_AUTHORITY) as Array<
      keyof typeof EXPECTED_BROWSER_AUTHORITY
    >) {
      const missingField = structuredClone(activeBudget) as unknown as {
        browserAuthority: Partial<BrowserAuthority>;
      };
      delete missingField.browserAuthority[field];
      expect(validateBudgetRecord(
        missingField, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n'), `missing browserAuthority.${field}`)
        .toMatch(/budget browser authority is invalid/);
    }

    for (const field of Object.keys(EXPECTED_BROWSER_AUTHORITY) as Array<
      keyof typeof EXPECTED_BROWSER_AUTHORITY
    >) {
      const drifted = structuredClone(activeBudget);
      drifted.browserAuthority[field] = `${drifted.browserAuthority[field]}-other` as never;
      expect(drifted.browserAuthority, `${field} drift must leave the checked-in policy`)
        .not.toEqual(EXPECTED_BROWSER_AUTHORITY);
      const errors = validateBudgetRecord(
        drifted, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n');
      expect(errors, `${field} authority drift`).toMatch(/budget browser authority is invalid/);
    }

    for (const product of [
      'Edg/151.0.4129.93', 'Edg/151.0.4129.101',
      'Edg/151.0.4129.107', 'Edg/999.8.7.6',
    ]) {
      expect(compendiumBrowserAuthorityMatches({
        product, revision: `@${product}`, js_version: `js-${product}`,
        protocol_version: '1.3',
      }, activeBudget.browserAuthority), `${product} should satisfy the same policy`).toBe(true);
    }
    for (const browser of [
      { product: 'Chrome/151.0.4129.107', revision: '@chrome', js_version: '15.1.23.9', protocol_version: '1.3' },
      { product: 'Edg/151.0.4129', revision: '@short', js_version: '15.1.23.9', protocol_version: '1.3' },
      { product: 'Edg/151.0.4129.107', revision: '', js_version: '15.1.23.9', protocol_version: '1.3' },
      { product: 'Edg/151.0.4129.107', revision: '@edge', js_version: '', protocol_version: '1.3' },
      { product: 'Edg/151.0.4129.107', revision: '@edge', js_version: '15.1.23.9', protocol_version: '1.2' },
    ]) {
      expect(compendiumBrowserAuthorityMatches(browser, activeBudget.browserAuthority)).toBe(false);
    }
  });

  it('accepts Edge build drift but rejects browser-family and protocol drift', () => {
    type BrowserOnlySample = { browser: Record<string, string> };
    type MutableRecord = {
      calibration: { samples: Record<ProfileName, BrowserOnlySample[]> };
      pairedBrokenBaseline: { samples: Record<ProfileName, BrowserOnlySample[]> };
    };
    const rawBrowser = rawBrowserForAuthority(EXPECTED_BROWSER_AUTHORITY);
    for (const [collection, mismatchPattern] of [
      ['candidate', /candidate calibration browser does not match/],
      ['baseline', /paired broken-baseline browser does not match/],
    ] as const) {
      const matching = structuredClone(activeBudget) as unknown as MutableRecord;
      const matchingSample = { runId: 'same-run', browser: { ...rawBrowser } };
      if (collection === 'candidate') {
        matching.calibration.samples.phone = [matchingSample];
        matching.calibration.samples.desktop = [structuredClone(matchingSample)];
      } else {
        matching.pairedBrokenBaseline.samples.phone = [matchingSample];
        matching.pairedBrokenBaseline.samples.desktop = [structuredClone(matchingSample)];
      }
      expect(validateBudgetRecord(
        matching, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n'), `${collection} matching authority control`)
        .not.toMatch(mismatchPattern);

      for (const [field, value, rejected] of [
        ['product', 'Edg/777.6.5.4', false],
        ['revision', '@different-edge-revision', false],
        ['jsVersion', '99.8.7.6', false],
        ['product', 'Chrome/151.0.4129.107', true],
        ['protocolVersion', '1.2', true],
      ] as const) {
        const wrong = structuredClone(activeBudget) as unknown as MutableRecord;
        const sample = { runId: 'drift-run', browser: { ...rawBrowser, [field]: value } };
        if (collection === 'candidate') {
          wrong.calibration.samples.phone = [sample];
          wrong.calibration.samples.desktop = [structuredClone(sample)];
        } else {
          wrong.pairedBrokenBaseline.samples.phone = [sample];
          wrong.pairedBrokenBaseline.samples.desktop = [structuredClone(sample)];
        }
        const errors = validateBudgetRecord(
          wrong, fixture.rowsSha256, baselineProjection.rowsSha256,
        ).errors.join('\n');
        if (rejected) expect(errors, `${collection} ${field} incompatibility`).toMatch(mismatchPattern);
        else expect(errors, `${collection} ${field} diagnostic drift`).not.toMatch(mismatchPattern);
      }
    }
  });

  it('allows builds and host provenance to vary across runs but binds each run across profiles', () => {
    type IdentitySample = {
      runId: string;
      commit: string;
      workingTreeDigest: string;
      inputDigest: string;
      fixtureRowsSha256: string;
      measuredAt: string;
      browser?: Record<string, string>;
    };
    type MutableRecord = {
      calibration: { samples: Record<ProfileName, IdentitySample[]> };
    };
    const sample = (run: number): IdentitySample => ({
      runId: `fresh-path-${run}`,
      commit: 'a'.repeat(40),
      workingTreeDigest: 'b'.repeat(64),
      inputDigest: 'c'.repeat(64),
      fixtureRowsSha256: fixture.rowsSha256,
      measuredAt: `2026-08-20T16:00:0${run}.000Z`,
      browser: {
        ...rawBrowserForAuthority(EXPECTED_BROWSER_AUTHORITY, {
          product: `Edg/151.0.4129.${100 + run}`,
          revision: `@edge-revision-${run}`,
          jsVersion: `15.1.23.${run}`,
        }),
        executable: `/private/tmp/cf-edge-fresh-${run}/Microsoft Edge`,
        userAgent: `host provenance ${run}`,
      },
    });
    const freshPaths = structuredClone(activeBudget) as unknown as MutableRecord;
    freshPaths.calibration.samples.phone = [sample(1), sample(2), sample(3)];
    freshPaths.calibration.samples.desktop = [sample(1), sample(2), sample(3)];
    const pairedProvenancePattern = /does not bind one exact browser provenance tuple across profiles/;
    const freshErrors = validateBudgetRecord(
      freshPaths, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n');
    expect(freshErrors).not.toMatch(pairedProvenancePattern);
    expect(new Set(freshPaths.calibration.samples.phone
      .map((entry) => entry.browser?.executable))).toHaveLength(3);
    expect(new Set(freshPaths.calibration.samples.phone
      .map((entry) => entry.browser?.userAgent))).toHaveLength(3);

    for (const field of [
      'executable', 'product', 'revision', 'userAgent', 'jsVersion', 'protocolVersion',
    ] as const) {
      const drifted = structuredClone(freshPaths);
      drifted.calibration.samples.phone[1]!.browser![field]
        = `${drifted.calibration.samples.phone[1]!.browser![field]}-other`;
      const driftErrors = validateBudgetRecord(
        drifted, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n');
      expect(driftErrors, `${field} same-run provenance drift`).toMatch(pairedProvenancePattern);
    }

    const timestampDrift = structuredClone(freshPaths);
    timestampDrift.calibration.samples.phone[1]!.measuredAt = '2026-08-20T17:00:00.000Z';
    expect(validateBudgetRecord(
      timestampDrift, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n')).toMatch(/does not bind one exact measurement timestamp across profiles/);

    const missingBrowser = structuredClone(freshPaths);
    delete missingBrowser.calibration.samples.phone[1]!.browser;
    const missingErrors = validateBudgetRecord(
      missingBrowser, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n');
    expect(missingErrors).toMatch(/browser provenance is incomplete/);
    expect(missingErrors).toMatch(pairedProvenancePattern);
    expect(missingErrors).toMatch(/candidate calibration browser does not match/);

    for (const executable of ['', 'relative/microsoft-edge', '../microsoft-edge']) {
      const relativePath = structuredClone(freshPaths);
      relativePath.calibration.samples.phone[0]!.browser!.executable = executable;
      relativePath.calibration.samples.desktop[0]!.browser!.executable = executable;
      expect(validateBudgetRecord(
        relativePath, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n'), executable).toMatch(/browser provenance is incomplete/);
    }
  });

  it('pins a complete, unique profile/outcome inventory', () => {
    expect(OUTCOME_IDS.length).toBeGreaterThan(30);
    expect(new Set(OUTCOME_IDS).size).toBe(OUTCOME_IDS.length);
    expect(EXPECTED_OUTCOMES).toEqual(PROFILES.flatMap((profile) =>
      OUTCOME_IDS.map((id) => `${profile}/${id}`)));
    expect(new Set(EXPECTED_OUTCOMES).size).toBe(EXPECTED_OUTCOMES.length);
  });

  it('rejects invented active ceilings without measured samples and rationale', () => {
    const forged = structuredClone(budget) as Record<string, unknown> & {
      status: string;
      calibration: { samples: { phone: unknown[]; desktop: unknown[] } };
      ceilings: Record<string, unknown>;
    };
    forged.status = 'active';
    forged.calibration.samples.phone = [];
    forged.calibration.samples.desktop = [];
    forged.ceilings = {
      phone: { rationale: '', mountedRowsMax: 1 },
      desktop: { rationale: '', mountedRowsMax: 1 },
    };
    const result = validateBudgetRecord(forged, fixture.rowsSha256, baselineProjection.rowsSha256);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/three phone calibration samples/);
    expect(result.errors.join('\n')).toMatch(/rationale/);
    expect(result.errors.join('\n')).toMatch(/heapUsedBytesMax/);
  });

  it('rejects a fixture digest from any other generator output', () => {
    const wrong = structuredClone(budget) as Record<string, unknown> & {
      fixture: { rowsSha256: string };
    };
    wrong.fixture.rowsSha256 = '0'.repeat(64);
    expect(validateBudgetRecord(wrong, fixture.rowsSha256, baselineProjection.rowsSha256).errors.join('\n'))
      .toMatch(/does not match the current deterministic input/);
  });

  it('rejects a broken-baseline projection digest from another adapter input', () => {
    const wrong = structuredClone(budget) as Record<string, unknown> & {
      pairedBrokenBaseline: { projectionRowsSha256: string };
    };
    wrong.pairedBrokenBaseline.projectionRowsSha256 = '0'.repeat(64);
    expect(validateBudgetRecord(
      wrong, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n')).toMatch(/projection digest does not match/);
  });
});
