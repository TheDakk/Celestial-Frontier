import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const AUDIT_ROOT = new URL('../../../audits/', import.meta.url);
const SOURCE = 'd611d18ad12bb8587863846ef3799300d2396e6a';
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

  it('preserves three passing predecessors, one terminal five-scope Slice red, and no retry', () => {
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
  });
});
