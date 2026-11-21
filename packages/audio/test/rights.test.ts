import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PILOT_AUDIO_RIGHTS_EVIDENCE,
  PILOT_AUDIO_TECHNICAL_POLICY,
} from '../src/pilot-rights-data.js';
import {
  AUDIO_ASSET_RIGHTS_MANIFEST,
  AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT,
  AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST,
  AUDIO_ASSET_RIGHTS_MANIFEST_VERSION,
  AUDIO_ASSET_ROLES,
  audioAssetRightsManifestDigest,
  auditAudioAssetRightsManifest,
  type AudioAssetObservation,
  type AudioAssetRightsBundle,
  type AudioAssetRightsRow,
  type AudioAssetTechnicalPolicy,
  type AudioRightsEvidenceObservation,
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

const EXPECTED_PILOT_IDS = Object.freeze([
  'cf-pilot-exploration-music', 'cf-pilot-temperate-bed', 'cf-pilot-ui-nav',
  'cf-pilot-ui-refusal', 'cf-pilot-ui-settlement', 'cf-pilot-scout-approach',
  'cf-pilot-scout-landing', 'cf-pilot-combat-contact',
]);
/* fixtures/current/audio-pilot.json was recorded from the unmodified current game by
   `node tools/record-fixtures.mjs --source <current game> --only audio-pilot`. The pilot sound
   files and rights proof files are not on this branch: the recorder read them there and kept
   only what the rights audit observes (each file's sha256, each sound's PCM format and length,
   and the proof file's loudness and loop measurements). */
const RECORDED = JSON.parse(readFileSync(
  new URL('../../../fixtures/current/audio-pilot.json', import.meta.url), 'utf8',
)) as { observations: AudioAssetObservation[]; evidence: AudioRightsEvidenceObservation[] };

function recordedPilotBundle(): AudioAssetRightsBundle {
  return {
    rows: AUDIO_ASSET_RIGHTS_MANIFEST,
    observations: RECORDED.observations.map((observation) => ({ ...observation })),
    evidence: RECORDED.evidence.map((file) => ({ ...file })),
    referencedAssetIds: EXPECTED_PILOT_IDS,
    technicalPolicy: PILOT_AUDIO_TECHNICAL_POLICY,
  };
}

describe('Arc 7/8 audio asset rights foundation', () => {
  it('pins eight original pilot cues, two hashed public evidence files and their explicit policy', () => {
    expect(AUDIO_ASSET_RIGHTS_MANIFEST_VERSION).toBe(1);
    expect(AUDIO_ASSET_ROLES).toEqual([
      'creature', 'foley', 'combat', 'guardian', 'ship', 'biome', 'music', 'ui',
    ]);
    expect(AUDIO_ASSET_RIGHTS_MANIFEST.map((row) => row.id)).toEqual(EXPECTED_PILOT_IDS);
    expect(AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST)
      .toBe('arm1-d8353ea7165fd424a6c58e3eb71a2a50');
    expect(AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT).toEqual({
      version: 1,
      rowCount: 8,
      observedAssetCount: 8,
      evidenceFileCount: 2,
      referencedAssetCount: 8,
      digest: AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST,
      technicalPolicy: 'provided',
    });
    expect(PILOT_AUDIO_TECHNICAL_POLICY).toEqual({
      allowedCodecs: ['pcm-s16le-wav'], allowedSampleRates: [48_000],
      minDurationMs: 100, maxDurationMs: 24_000,
      minIntegratedLufs: -36, maxIntegratedLufs: -20, maxTruePeakDb: -3,
      allowedTags: [
        'pilot', 'loop', 'one-shot', 'exploration', 'temperate', 'wind-rustle',
        'navigation', 'refusal', 'settlement', 'scout', 'approach', 'landing', 'contact',
      ],
    });
    expect(AUDIO_ASSET_RIGHTS_MANIFEST.some((row) => row.role === 'creature')).toBe(false);
    expect(Object.isFrozen(AUDIO_ASSET_RIGHTS_MANIFEST)).toBe(true);
    expect(Object.isFrozen(AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT)).toBe(true);
    for (const row of AUDIO_ASSET_RIGHTS_MANIFEST) {
      expect(Object.isFrozen(row)).toBe(true);
      expect(Object.isFrozen(row.processing)).toBe(true);
      expect(Object.isFrozen(row.tags)).toBe(true);
    }
  });

  it('still accepts an honestly empty caller bundle without pretending a media policy exists', () => {
    const empty: AudioAssetRightsBundle = {
      rows: [], observations: [], evidence: [], referencedAssetIds: [], technicalPolicy: null,
    };
    expect(auditAudioAssetRightsManifest({
      ...empty, expectedDigest: 'arm1-0931a076c139bc332b012b5a235476e9',
    })).toMatchObject({ rowCount: 0, technicalPolicy: 'not-required-empty' });
  });

  it('binds the current rights authority to the recorded bytes of the eight pilot cues and both proof files', () => {
    expect(RECORDED.observations.map((observation) => observation.id)).toEqual(EXPECTED_PILOT_IDS);
    expect(RECORDED.evidence.map((file) => file.file))
      .toEqual(PILOT_AUDIO_RIGHTS_EVIDENCE.map((file) => file.file));
    expect(auditAudioAssetRightsManifest({
      ...recordedPilotBundle(), expectedDigest: AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST,
    })).toEqual(AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT);
  });

  it('rejects a changed sound file, changed native measurements and a changed licence, then restores', () => {
    const media = 'cf-pilot-ui-nav';
    const licence = 'audio-rights/CF_PILOT_C_20260905.md';
    const flip = (hex: string): string => `${hex.slice(0, -1)}${hex.endsWith('0') ? '1' : '0'}`;
    const controls: readonly [string, (bundle: AudioAssetRightsBundle) => AudioAssetRightsBundle, RegExp][] = [
      ['sound file bytes', (bundle) => ({
        ...bundle,
        observations: bundle.observations.map((observation) => {
          const row = observation as AudioAssetObservation;
          return row.id === media ? { ...row, derivativeSha256: flip(row.derivativeSha256) } : row;
        }),
      }), /observation does not match/u],
      ['proof loudness', (bundle) => ({
        ...bundle,
        observations: bundle.observations.map((observation, index) => {
          const row = observation as AudioAssetObservation;
          return index === 0 ? { ...row, integratedLufs: row.integratedLufs + 0.5 } : row;
        }),
      }), /observation does not match/u],
      ['licence bytes', (bundle) => ({
        ...bundle,
        evidence: bundle.evidence.map((evidence) => {
          const file = evidence as AudioRightsEvidenceObservation;
          return file.file === licence ? { ...file, sha256: flip(file.sha256) } : file;
        }),
      }), /manifest digest changed/u],
    ];
    for (const [label, mutate, diagnosis] of controls) {
      expect(() => auditAudioAssetRightsManifest({
        ...mutate(recordedPilotBundle()),
        expectedDigest: AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST,
      }), label).toThrow(diagnosis);
      expect(auditAudioAssetRightsManifest({
        ...recordedPilotBundle(),
        expectedDigest: AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST,
      }), label).toEqual(AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT);
    }
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
