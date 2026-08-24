import { describe, expect, it } from 'vitest';
import {
  AUDIO_ASSET_RIGHTS_MANIFEST,
  AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT,
  AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST,
  AUDIO_ASSET_RIGHTS_MANIFEST_VERSION,
  AUDIO_ASSET_ROLES,
  audioAssetRightsManifestDigest,
  auditAudioAssetRightsManifest,
  type AudioAssetRightsBundle,
  type AudioAssetRightsRow,
  type AudioAssetTechnicalPolicy,
} from '../src/index.js';

const POLICY: AudioAssetTechnicalPolicy = Object.freeze({
  allowedCodecs: Object.freeze(['opus']),
  allowedSampleRates: Object.freeze([48_000]),
  minDurationMs: 100,
  maxDurationMs: 10_000,
  minIntegratedLufs: -30,
  maxIntegratedLufs: -10,
  maxTruePeakDb: -1,
  allowedTags: Object.freeze(['fauna', 'short-call']),
});

const ROW: AudioAssetRightsRow = Object.freeze({
  id: 'wolf-contact-v1',
  file: 'audio/creature/wolf-contact-v1.opus',
  role: 'creature',
  sourceUrl: 'https://example.invalid/project-owned/wolf-contact',
  creator: 'Celestial Frontier audio team',
  licenseId: 'project-owned-v1',
  licenseSnapshot: 'audio-rights/licenses/project-owned-v1.txt',
  commercialUse: true,
  derivatives: true,
  redistribution: true,
  attribution: null,
  acquiredOn: '2026-08-24',
  proofFile: 'audio-rights/proofs/wolf-contact-v1.json',
  processing: Object.freeze(['trim', 'normalize']),
  originalSha256: '1'.repeat(64),
  derivativeSha256: '2'.repeat(64),
  version: 1,
  codec: 'opus',
  durationMs: 1_250,
  sampleRate: 48_000,
  channels: 1,
  loopStartMs: null,
  loopEndMs: null,
  integratedLufs: -18,
  truePeakDb: -2,
  tags: Object.freeze(['fauna', 'short-call']),
});

function fixture(): AudioAssetRightsBundle {
  return {
    rows: [{ ...ROW, processing: [...ROW.processing], tags: [...ROW.tags] }],
    observations: [{
      id: ROW.id,
      file: ROW.file,
      originalSha256: ROW.originalSha256,
      derivativeSha256: ROW.derivativeSha256,
      codec: ROW.codec,
      durationMs: ROW.durationMs,
      sampleRate: ROW.sampleRate,
      channels: ROW.channels,
      loopStartMs: ROW.loopStartMs,
      loopEndMs: ROW.loopEndMs,
      integratedLufs: ROW.integratedLufs,
      truePeakDb: ROW.truePeakDb,
    }],
    evidence: [
      { file: ROW.licenseSnapshot, sha256: '3'.repeat(64) },
      { file: ROW.proofFile, sha256: '4'.repeat(64) },
    ],
    referencedAssetIds: [ROW.id],
    technicalPolicy: {
      ...POLICY,
      allowedCodecs: [...POLICY.allowedCodecs],
      allowedSampleRates: [...POLICY.allowedSampleRates],
      allowedTags: [...POLICY.allowedTags],
    },
  };
}

describe('Arc 7/8 audio asset rights foundation', () => {
  it('pins the current authoritative empty ledger without pretending assets or byte policy exist', () => {
    expect(AUDIO_ASSET_RIGHTS_MANIFEST_VERSION).toBe(1);
    expect(AUDIO_ASSET_ROLES).toEqual([
      'creature', 'foley', 'combat', 'guardian', 'ship', 'biome', 'music', 'ui',
    ]);
    expect(AUDIO_ASSET_RIGHTS_MANIFEST).toEqual([]);
    expect(AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST)
      .toBe('arm1-0931a076c139bc332b012b5a235476e9');
    expect(AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT).toEqual({
      version: 1,
      rowCount: 0,
      observedAssetCount: 0,
      evidenceFileCount: 0,
      referencedAssetCount: 0,
      digest: AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST,
      technicalPolicy: 'not-required-empty',
    });
    expect(Object.isFrozen(AUDIO_ASSET_RIGHTS_MANIFEST)).toBe(true);
    expect(Object.isFrozen(AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT)).toBe(true);
  });

  it('accepts one exact hash-bound, proof-bound, reachable asset only under an explicit policy', () => {
    const bundle = fixture();
    const expectedDigest = audioAssetRightsManifestDigest(bundle);
    expect(auditAudioAssetRightsManifest({ ...bundle, expectedDigest })).toEqual({
      version: 1,
      rowCount: 1,
      observedAssetCount: 1,
      evidenceFileCount: 2,
      referencedAssetCount: 1,
      digest: expectedDigest,
      technicalPolicy: 'provided',
    });

    expect(() => audioAssetRightsManifestDigest({
      ...bundle,
      technicalPolicy: null,
    })).toThrow(/explicit measured technical policy/);
  });

  it('fails deliberate missing-row, hash-drift, license-drift, and orphan controls independently', () => {
    const base = fixture();
    const expectedDigest = audioAssetRightsManifestDigest(base);

    expect(() => auditAudioAssetRightsManifest({
      ...base,
      rows: [],
      expectedDigest,
    })).toThrow(/must match exactly/);

    expect(() => auditAudioAssetRightsManifest({
      ...base,
      observations: [{
        ...(base.observations[0] as Record<string, unknown>),
        derivativeSha256: '9'.repeat(64),
      }],
      expectedDigest,
    })).toThrow(/observation does not match/);

    expect(() => auditAudioAssetRightsManifest({
      ...base,
      rows: [{
        ...(base.rows[0] as Record<string, unknown>),
        redistribution: false,
      }],
      expectedDigest,
    })).toThrow(/incompatible rights flags/);

    expect(() => auditAudioAssetRightsManifest({
      ...base,
      referencedAssetIds: [],
      expectedDigest,
    })).toThrow(/must match exactly/);

    expect(() => auditAudioAssetRightsManifest({
      ...base,
      evidence: [base.evidence[0]],
      expectedDigest,
    })).toThrow(/must be observed exactly/);

    expect(() => auditAudioAssetRightsManifest({
      ...base,
      evidence: [
        { ...(base.evidence[0] as Record<string, unknown>), sha256: '8'.repeat(64) },
        base.evidence[1],
      ],
      expectedDigest,
    })).toThrow(/manifest digest changed/);
  });

  it('rejects duplicate/orphan observations and metadata outside the supplied technical policy', () => {
    const base = fixture();
    expect(() => audioAssetRightsManifestDigest({
      ...base,
      observations: [...base.observations, base.observations[0]],
    })).toThrow(/observation ids contains duplicates/);

    expect(() => audioAssetRightsManifestDigest({
      ...base,
      rows: [{ ...(base.rows[0] as Record<string, unknown>), codec: 'mp3' }],
    })).toThrow(/codec is outside/);

    expect(() => audioAssetRightsManifestDigest({
      ...base,
      rows: [{ ...(base.rows[0] as Record<string, unknown>), tags: ['fauna', 'unknown-tag'] }],
    })).toThrow(/tag is outside/);

    expect(() => audioAssetRightsManifestDigest({
      ...base,
      rows: [{
        ...(base.rows[0] as Record<string, unknown>),
        loopStartMs: 900,
        loopEndMs: 800,
      }],
    })).toThrow(/loop points/);

    expect(() => audioAssetRightsManifestDigest({
      ...base,
      evidence: [...base.evidence, {
        file: 'audio-rights/proofs/orphan.json',
        sha256: '5'.repeat(64),
      }],
    })).toThrow(/must be observed exactly/);
  });

  it('rejects a top-level accessor without invoking it and rejects covert toJSON fields', () => {
    const base = fixture();
    let getterReads = 0;
    const accessorBundle = { ...base };
    Object.defineProperty(accessorBundle, 'rows', {
      enumerable: true,
      get: () => {
        getterReads++;
        return base.rows;
      },
    });
    expect(() => audioAssetRightsManifestDigest(accessorBundle)).toThrow(/data property/);
    expect(getterReads).toBe(0);

    expect(() => audioAssetRightsManifestDigest({
      ...base,
      toJSON: () => ({ hidden: true }),
    } as AudioAssetRightsBundle)).toThrow(/unexpected fields/);
  });

  it('reads portable proxy data only through descriptors and fails closed on hostile reflection', () => {
    const base = fixture();
    let valueReads = 0;
    const descriptorSafe = new Proxy(base, {
      get: () => {
        valueReads++;
        throw new Error('bundle getter must not run');
      },
    });
    expect(audioAssetRightsManifestDigest(descriptorSafe))
      .toBe(audioAssetRightsManifestDigest(base));
    expect(valueReads).toBe(0);

    const hostileReflection = new Proxy(base, {
      ownKeys: () => { throw new Error('ownKeys refusal'); },
    });
    expect(() => audioAssetRightsManifestDigest(hostileReflection))
      .toThrow(/could not be inspected/);
  });

  it.each([
    ['malformed', 'https://'],
    ['relative', 'sources/wolf-contact'],
    ['non-HTTPS', 'http://example.invalid/wolf-contact'],
    ['non-canonical', 'https://EXAMPLE.invalid/wolf-contact'],
  ])('rejects a %s source URL independently', (_label, sourceUrl) => {
    const base = fixture();
    expect(() => audioAssetRightsManifestDigest({
      ...base,
      rows: [{ ...(base.rows[0] as Record<string, unknown>), sourceUrl }],
    })).toThrow(/canonical absolute HTTPS URL/);
  });
});
