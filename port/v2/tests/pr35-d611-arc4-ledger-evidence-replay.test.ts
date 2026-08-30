import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const AUDIT_ROOT = new URL('../../../audits/', import.meta.url);
const SOURCE = 'd611d18ad12bb8587863846ef3799300d2396e6a';
const RIGHT_SIZED_SOURCE = '7f89bb2a70604da5b79673bd22d25786cab468d2';
const STORAGE_SOURCE = '961d1071d059e0f73e14a6a4ead61f5e4696535b';
const carriers = Object.freeze({
  layout: Object.freeze({
    file: 'ROOT_LAYOUT_PR35_BATTERY_CONSOLIDATION_PASS_20260830_D611D18.json.gz',
    gzipBytes: 5_029,
    rawBytes: 106_976,
    gzipSha256: 'bcf4c524187fda97c7b4cbef8c807b8ffc944965533ef6d6bd75baccf2959e31',
    rawSha256: '37daf338ebf0cb9048e6caae245f8fe6e4cbff1fcfcab226a954485b487a5f98',
  }),
  scene: Object.freeze({
    file: 'ARC1C_SCENEMEM_PR35_BATTERY_CONSOLIDATION_PASS_20260830_D611D18.json.gz',
    gzipBytes: 44_965,
    rawBytes: 786_975,
    gzipSha256: '29d99750ce372e617f3276451209561f0593d5631f49518bbce8d430099880fb',
    rawSha256: '3c7cea08d02dc533ac1ea8c5fbad953f6aef9ed436599763ff7d1da915e461c4',
  }),
  compendium: Object.freeze({
    file: 'ARC1C_COMPENDIUM_PR35_BATTERY_CONSOLIDATION_PASS_20260830_D611D18.json.gz',
    gzipBytes: 452_029,
    rawBytes: 10_849_032,
    gzipSha256: '251ca89cfa08b2663969ffc8acd9f9f2ac32154831b8b46aa0891b1e42cbf9db',
    rawSha256: '04085baecbcb7758876233be8db3ed6e845c1e4b9bc56432164c10c2040a4ae1',
  }),
  slice: Object.freeze({
    file: 'ARC4_SLICE_PR35_PERTAR_LEDGER_ORACLE_RED_20260830_D611D18.json.gz',
    gzipBytes: 218_580,
    rawBytes: 1_953_664,
    gzipSha256: '74501e618f1bbe74b7c3b7c60c0375bcfa7911cf762e857f1bcfcaa54ea664f0',
    rawSha256: '8fa4790b18a6dcaef94bbf0794de99442c67ac448bc723a65adf56c275d3d9c2',
  }),
  sliceLog: Object.freeze({
    file: 'ARC4_SLICE_PR35_PERTAR_LEDGER_ORACLE_RED_20260830_D611D18.log.gz',
    gzipBytes: 100_790,
    rawBytes: 828_312,
    gzipSha256: '7b4c6c6daefbceb585cedc4aac5cff135b4153dd7a6baa9f104fb4fbeea58f9b',
    rawSha256: 'd7b4fbde305a9f6dcf5debe430430a2b56ddb4310b6f328a0689151db0ecc20c',
  }),
  rightSizedScene: Object.freeze({
    file: 'ARC1C_SCENEMEM_PR35_BATTERY_RIGHTSIZING_PASS_20260830_7F89BB2.json.gz',
    gzipBytes: 45_066,
    rawBytes: 787_362,
    gzipSha256: 'd0598401c43cf0d8d0b60f145de501c21ae86d3825d161b88b28f6d95ab2a778',
    rawSha256: '2b825b7ba33152ef882f5601ef7dea2b032ef042903bb7e3824740741e495709',
  }),
  rightSizedCompendium: Object.freeze({
    file: 'ARC1C_COMPENDIUM_PR35_BATTERY_RIGHTSIZING_PASS_20260830_7F89BB2.json.gz',
    gzipBytes: 451_063,
    rawBytes: 10_821_649,
    gzipSha256: '5ea6181267661e15b19005316e7871050113ed25e6bfe32873a93b0a8a708a50',
    rawSha256: 'c4b962d76555d3cdc58383904820db12303d9d93d1b9fc63926aec0f0539db5c',
  }),
  rightSizedSlice: Object.freeze({
    file: 'ARC4_SLICE_PR35_TAME_LEDGER_VARIANT_ORACLE_RED_20260830_7F89BB2.json.gz',
    gzipBytes: 74_024,
    rawBytes: 608_802,
    gzipSha256: 'ad77a941b6b29518e18cfa30faa6be516d124567c78eb4c6b4d46f877dc1edab',
    rawSha256: '751415db662857fd0e03a09fc8d9713d31de7d86db4a6b71fe4fec4587bcfb10',
  }),
  rightSizedSliceLog: Object.freeze({
    file: 'ARC4_SLICE_PR35_TAME_LEDGER_VARIANT_ORACLE_RED_20260830_7F89BB2.log.gz',
    gzipBytes: 34_961,
    rawBytes: 257_710,
    gzipSha256: 'da56722b8962fac1ecfcb21012fa93208c0dab26c44421b1bcc76854da27d97c',
    rawSha256: 'd2d071d20b8bc8d642aa2e8cfc13195b796df045bd64c1f48455dcab8acffc5a',
  }),
  storageScene: Object.freeze({
    file: 'ARC1C_SCENEMEM_PR35_STORAGE_REFUSAL_PREDECESSOR_PASS_20260830_961D107.json.gz',
    gzipBytes: 44_946,
    rawBytes: 786_692,
    gzipSha256: '6c1e2180e6d3523bf5b07021c24ad8aa9f6e67c1e0fc72b2433691afad3144aa',
    rawSha256: '77607fd1b824e12f973a85d82d45f7b09997523125f839a664ba7a42f224c648',
  }),
  storageCompendium: Object.freeze({
    file: 'ARC1C_COMPENDIUM_PR35_STORAGE_REFUSAL_PREDECESSOR_PASS_20260830_961D107.json.gz',
    gzipBytes: 450_967,
    rawBytes: 10_834_118,
    gzipSha256: '3f39cfca848e5aaa790e0f6e27448881d8985501313c2027f78f0064b53d2b36',
    rawSha256: 'cc1b28217c57a0ff90051afcb676d24082c3f0426c0650e504ba0e65ce567799',
  }),
  storageSlice: Object.freeze({
    file: 'ARC4_SLICE_PR35_STORAGE_REFUSAL_TIMEOUT_RED_20260830_961D107.json.gz',
    gzipBytes: 1_689,
    rawBytes: 5_263,
    gzipSha256: '304d65abf8ed652420e282897eefdd9f57a34f7f2b41bed780f3fc27a18e822f',
    rawSha256: '6b69f8bd2445b3e23979e28a89f78f94d8572ea257f99a121dc893a632e57f4a',
  }),
  storageSliceLog: Object.freeze({
    file: 'ARC4_SLICE_PR35_STORAGE_REFUSAL_TIMEOUT_RED_20260830_961D107.log.gz',
    gzipBytes: 1_509,
    rawBytes: 3_745,
    gzipSha256: 'bbc957bd99f265d068d487a184a5a96f0bb8525ba7cbd5724e694f95cc8f328a',
    rawSha256: 'd86d79fa031fb9002ad495a8579993aeb426461395fd116c78ae99458cfb249a',
  }),
});

const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const decoded = Object.fromEntries(Object.entries(carriers).map(([name, carrier]) => {
  const gzip = readFileSync(new URL(carrier.file, AUDIT_ROOT));
  const raw = gunzipSync(gzip);
  return [name, { gzip, raw, value: carrier.file.endsWith('.json.gz')
    ? JSON.parse(raw.toString('utf8')) as Record<string, any> : raw.toString('utf8') }];
})) as Record<string, { gzip: Buffer; raw: Buffer; value: Record<string, any> | string }>;

describe('PR #35 d611 consolidated-chain Arc 4 ledger evidence', () => {
  it('retains every raw/gzip carrier under its exact immutable identity', () => {
    for (const [name, carrier] of Object.entries(carriers)) {
      const evidence = decoded[name]!;
      expect(evidence.gzip.byteLength, `${name} gzip bytes`).toBe(carrier.gzipBytes);
      expect(evidence.raw.byteLength, `${name} raw bytes`).toBe(carrier.rawBytes);
      expect(sha256(evidence.gzip), `${name} gzip hash`).toBe(carrier.gzipSha256);
      expect(sha256(evidence.raw), `${name} raw hash`).toBe(carrier.rawSha256);
    }
  });

  it('preserves the causal five-to-one-to-one scope sequence without retry', () => {
    const layout = decoded.layout!.value as Record<string, any>;
    const scene = decoded.scene!.value as Record<string, any>;
    const compendium = decoded.compendium!.value as Record<string, any>;
    const slice = decoded.slice!.value as Record<string, any>;

    expect(layout.source.begin.commit).toBe(SOURCE);
    expect(layout.source.end.commit).toBe(SOURCE);
    expect(layout.summary).toEqual({
      checks: 787, passed: 787, failed: 0,
      completedViewports: 10, requestedViewports: 10,
    });
    expect(scene).toMatchObject({
      status: 'pass', runId: '20260830-d611d18-battery-consolidation-scenemem',
      durationMs: 12_407,
    });
    expect(scene.source.begin.commit).toBe(SOURCE);
    expect(scene.source.end.commit).toBe(SOURCE);
    expect(scene.outcomes).toHaveLength(44);
    expect(compendium).toMatchObject({
      status: 'pass', runId: '20260830-d611d18-battery-consolidation-compendium',
      durationMs: 71_079,
    });
    expect(compendium.source.begin.commit).toBe(SOURCE);
    expect(compendium.source.end.commit).toBe(SOURCE);
    expect(compendium.outcomes).toHaveLength(78);
    expect(scene.browser).toMatchObject({ product: 'Edg/152.0.4191.53', protocolVersion: '1.3' });
    expect(compendium.browser).toMatchObject({
      product: 'Edg/152.0.4191.53', protocol_version: '1.3',
    });

    expect(slice).toMatchObject({
      status: 'fail', terminal: true, durationMs: 170_889,
      summary: { findingCount: 5, scopeCount: 5 },
      retryPolicy: { automaticRetries: 0 },
      source: { commit: SOURCE, state: 'committed' },
      sourceEnd: { commit: SOURCE, state: 'committed' },
      sourceChange: { detected: false, ending: null },
    });
    expect(slice.findings.map(({ scope }: { scope: string }) => scope)).toEqual([
      'arc-4-tame-greeting-audio-reset',
      'arc-4-tame-greeting-audio',
      'arc-4-precondition',
      'arc-4-sample-hit',
      'harness',
    ]);
    expect(slice.findings[0].message).toContain('"virginRngAndReceipts":false');
    expect(slice.findings[3].message).toContain('"newKeys":["receipt:3","receipt:4"]');
    expect(slice.findings[3].message).toContain('"oneRevision":false');
    expect(slice.findings[4].message).toContain('Arc 4 storage refusal did not reach');
    expect(slice.arc4SuccessEvidence).toMatchObject({
      required: false, ok: null, ledger: null, passMarkerCount: 0,
    });
    expect(decoded.sliceLog!.value).toContain('SLICE SMOKE: FAIL');

    const rightSizedScene = decoded.rightSizedScene!.value as Record<string, any>;
    const rightSizedCompendium = decoded.rightSizedCompendium!.value as Record<string, any>;
    const rightSizedSlice = decoded.rightSizedSlice!.value as Record<string, any>;
    expect(rightSizedScene).toMatchObject({
      status: 'pass',
      runId: '20260830-pr35-7f89bb2-battery-rightsizing-scenemem',
      durationMs: 12_753,
    });
    expect(rightSizedScene.source.begin.commit).toBe(RIGHT_SIZED_SOURCE);
    expect(rightSizedScene.source.end.commit).toBe(RIGHT_SIZED_SOURCE);
    expect(rightSizedScene.outcomes).toHaveLength(44);
    expect(rightSizedCompendium).toMatchObject({
      status: 'pass',
      runId: '20260830-pr35-7f89bb2-battery-rightsizing-compendium',
      durationMs: 63_310,
    });
    expect(rightSizedCompendium.source.begin.commit).toBe(RIGHT_SIZED_SOURCE);
    expect(rightSizedCompendium.source.end.commit).toBe(RIGHT_SIZED_SOURCE);
    expect(rightSizedCompendium.outcomes).toHaveLength(78);
    expect(rightSizedSlice).toMatchObject({
      status: 'fail', terminal: true, durationMs: 159_754,
      summary: { findingCount: 1, scopeCount: 1 },
      retryPolicy: { automaticRetries: 0 },
      source: { commit: RIGHT_SIZED_SOURCE, state: 'committed' },
      sourceEnd: { commit: RIGHT_SIZED_SOURCE, state: 'committed' },
    });
    expect(rightSizedSlice.findings.map(({ scope }: { scope: string }) => scope))
      .toEqual(['arc-4-tame-greeting-audio']);
    const message = rightSizedSlice.findings[0].message as string;
    const bundle = JSON.parse(message.slice(message.indexOf('{'))) as Record<string, any>;
    expect(bundle.checks).toMatchObject({ fixture: false, exactClassifier: true });
    expect(Object.entries(bundle.checks)
      .filter(([name]) => name !== 'fixture')
      .every(([, value]) => value === true)).toBe(true);
    expect(bundle.fixture.setupAssessment.checks).toMatchObject({
      sourceAuthorityPrefix: true,
      actionAuthorityPrefix: false,
      exactSetupRevisionSpan: true,
    });
    expect(bundle.assessment.ok).toBe(true);
    expect(Object.values(bundle.assessment.checks)
      .every((value) => value === true)).toBe(true);
    expect(JSON.parse(bundle.fixture.landedRaw.receiptRows[2].witness))
      .toMatchObject({
        schema: 'cf-v2-arc0-landing-witness/v1',
        stateSuccessorSeal: '10d953c315de7295a53d221ea1d2f93899de8f7ab127db26d3e5cdff170e7533',
        receiptOrdinal: 2,
      });
    expect(decoded.rightSizedSliceLog!.value).toContain('SLICE SMOKE: FAIL');

    const storageScene = decoded.storageScene!.value as Record<string, any>;
    const storageCompendium = decoded.storageCompendium!.value as Record<string, any>;
    const storageSlice = decoded.storageSlice!.value as Record<string, any>;

    expect(storageScene).toMatchObject({
      status: 'pass',
      runId: '20260830-pr35-961d107-battery-rightsizing-scenemem',
      durationMs: 12_912,
    });
    expect(storageScene.source.begin.commit).toBe(STORAGE_SOURCE);
    expect(storageScene.source.end.commit).toBe(STORAGE_SOURCE);
    expect(storageScene.outcomes).toHaveLength(44);

    expect(storageCompendium).toMatchObject({
      status: 'pass',
      runId: '20260830-pr35-961d107-battery-rightsizing-compendium',
      durationMs: 63_695,
    });
    expect(storageCompendium.source.begin.commit).toBe(STORAGE_SOURCE);
    expect(storageCompendium.source.end.commit).toBe(STORAGE_SOURCE);
    expect(storageCompendium.outcomes).toHaveLength(78);

    expect(storageSlice).toMatchObject({
      status: 'fail', terminal: true, durationMs: 171_033,
      summary: { findingCount: 1, scopeCount: 1 },
      retryPolicy: { automaticRetries: 0 },
      source: { commit: STORAGE_SOURCE, state: 'committed' },
      sourceEnd: { commit: STORAGE_SOURCE, state: 'committed' },
      sourceChange: { detected: false, ending: null },
    });
    expect(storageSlice.findings).toEqual([{
      index: 0,
      scope: 'harness',
      message: 'harness: Arc 4 storage refusal did not reach its browser outcome within 10000ms (last null)',
    }]);
    expect(decoded.storageSliceLog!.value).toContain('SLICE SMOKE: FAIL');
  });
});
