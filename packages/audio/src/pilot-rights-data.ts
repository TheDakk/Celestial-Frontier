/* Original Batch C intake facts, backed by the sanitized audio-rights proof.
 * Runtime validation stays in rights.ts; filesystem tests independently inspect
 * the shipped bytes and hash both public evidence files. Private masters remain
 * hash-identified sources, never fabricated local filesystem observations. */
import type {
  AudioAssetObservation, AudioAssetRightsRow, AudioAssetTechnicalPolicy,
  AudioRightsEvidenceObservation,
} from './rights.js';

const COMMON = Object.freeze({
  sourceUrl: 'https://surge-synthesizer.github.io/faq/',
  creator: 'Celestial Frontier, authored with Codex in REAPER and Surge XT',
  licenseId: 'LicenseRef-CF-Original-Commissioned-Audio',
  licenseSnapshot: 'audio-rights/CF_PILOT_C_20260905.md',
  commercialUse: true, derivatives: true, redistribution: true,
  attribution: null,
  acquiredOn: '2026-09-06',
  proofFile: 'audio-rights/CF_PILOT_C_20260905.json',
  version: 1,
  codec: 'pcm-s16le-wav',
  sampleRate: 48_000,
} as const);
const PROCESSING = Object.freeze([
  'original score and parameter design; no third-party samples',
  'REAPER 7.79 and Surge XT 1.3.4; verified 80-BPM project save/reopen',
  '48 kHz PCM24 private master render',
  'native LUFS-I/true-peak measured gain; -6 dBTP export target',
  '48 kHz PCM16 export with deterministic TPDF dither',
  'native LUFS-I and true-peak remeasurement of final PCM16 files',
]);

const ROW_DATA = [
  {
    "id": "cf-pilot-exploration-music",
    "file": "apps/game/assets/pilot/audio/cf-pilot-exploration-music.wav",
    "role": "music",
    "originalSha256": "b1e23e92ecaf9dd8cbf4ac398cc005702cebee0faf014814257ea30ab57d61ba",
    "derivativeSha256": "fa144fe615faef75fc426f86a44f299dcf48a1637893ccef9cf95fa2ab40a111",
    "durationMs": 24000,
    "channels": 2,
    "loopStartMs": 0,
    "loopEndMs": 24000,
    "integratedLufs": -25.000264689,
    "truePeakDb": -14.373341779,
    "tags": [
      "pilot",
      "loop",
      "exploration"
    ]
  },
  {
    "id": "cf-pilot-temperate-bed",
    "file": "apps/game/assets/pilot/audio/cf-pilot-temperate-bed.wav",
    "role": "biome",
    "originalSha256": "5f2c3985322e1978681826232cfcf606033f780f2c08e6d21d5cc730adf2c658",
    "derivativeSha256": "36caaa89651e44e92f9faddc53d74104cb9e1f5e11eb5a5757efbbdb978be69c",
    "durationMs": 24000,
    "channels": 2,
    "loopStartMs": 0,
    "loopEndMs": 24000,
    "integratedLufs": -32.000261081,
    "truePeakDb": -19.245628541,
    "tags": [
      "pilot",
      "loop",
      "temperate",
      "wind-rustle"
    ]
  },
  {
    "id": "cf-pilot-ui-nav",
    "file": "apps/game/assets/pilot/audio/cf-pilot-ui-nav.wav",
    "role": "ui",
    "originalSha256": "fc0b4c7e83bb03009f1419a597ece00470f94110a17ae7f55f363017ff50e1ec",
    "derivativeSha256": "14cecfcf6525c0c3637455ae7c711972021814ae5b5caf711baf7c6bb796a4c8",
    "durationMs": 280,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -25.000254451,
    "truePeakDb": -10.560947258,
    "tags": [
      "pilot",
      "one-shot",
      "navigation"
    ]
  },
  {
    "id": "cf-pilot-ui-refusal",
    "file": "apps/game/assets/pilot/audio/cf-pilot-ui-refusal.wav",
    "role": "ui",
    "originalSha256": "f7459b21954dcdeed1bcc5a3a6a70bfa45e21c5fc2558f190148885773b32ce2",
    "derivativeSha256": "3e4fcbd34d6b65583883e31347ef99c4dd538aa07a311fe7612083e3f37b9b20",
    "durationMs": 450,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -25.000261916,
    "truePeakDb": -10.567289421,
    "tags": [
      "pilot",
      "one-shot",
      "refusal"
    ]
  },
  {
    "id": "cf-pilot-ui-settlement",
    "file": "apps/game/assets/pilot/audio/cf-pilot-ui-settlement.wav",
    "role": "ui",
    "originalSha256": "28d3eb6d847894d3a7ab5b85c34815c1624c0af2016cd1dfab1a8418a679d346",
    "derivativeSha256": "40b012b8a0fe9b91de06ec83b70d575f7f90fd1534710e8b4052979f813617d3",
    "durationMs": 700,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -24.000260348,
    "truePeakDb": -10.534047595,
    "tags": [
      "pilot",
      "one-shot",
      "settlement"
    ]
  },
  {
    "id": "cf-pilot-scout-approach",
    "file": "apps/game/assets/pilot/audio/cf-pilot-scout-approach.wav",
    "role": "ship",
    "originalSha256": "ef939d548c6404f3e806400d9551a8634e02faa0a702fbce8af1917b416bc759",
    "derivativeSha256": "ad4020be2cda99df2ba91290965b1d125bf909c4b7279833da51b5b55ad5f373",
    "durationMs": 2400,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -25.000265801,
    "truePeakDb": -10.980523094,
    "tags": [
      "pilot",
      "one-shot",
      "scout",
      "approach"
    ]
  },
  {
    "id": "cf-pilot-scout-landing",
    "file": "apps/game/assets/pilot/audio/cf-pilot-scout-landing.wav",
    "role": "ship",
    "originalSha256": "92f66ac3c2fd15891cb6930dc203ff4be360feed28fe9d9b6ddfa8ddf0c8e26c",
    "derivativeSha256": "6e8e3edf1dca6f232ebb13233e6921a64c33bd33830a5c1358165a764779852a",
    "durationMs": 1400,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -24.405889865,
    "truePeakDb": -5.999940156,
    "tags": [
      "pilot",
      "one-shot",
      "scout",
      "landing"
    ]
  },
  {
    "id": "cf-pilot-combat-contact",
    "file": "apps/game/assets/pilot/audio/cf-pilot-combat-contact.wav",
    "role": "combat",
    "originalSha256": "a86bd3d25883e14629ae81e1478af1db521322855d08a2154506e0be0bc6dd33",
    "derivativeSha256": "fc3bcb5da5ee2a81a45d32de933cea234eb42850b151ba46565d1ad300eb6a20",
    "durationMs": 350,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -25.36839715,
    "truePeakDb": -6.000373097,
    "tags": [
      "pilot",
      "one-shot",
      "contact"
    ]
  }
] as const;

export const PILOT_AUDIO_RIGHTS_ROWS: readonly AudioAssetRightsRow[] = Object.freeze(
  ROW_DATA.map((row) => Object.freeze({
    ...COMMON,
    ...row,
    processing: Object.freeze([...PROCESSING, row.loopStartMs === null
      ? 'short cue crop, mono fold and boundary fades'
      : '24-second settled-cycle loop; circular reflections or periodic noise; 8 ms boundary smoothing']),
    tags: Object.freeze([...row.tags]),
  })),
);

/** Independent retained render observations; final filesystem intake rederives
 * codec/shape/hash from WAV bytes and binds the native-level proof by SHA-256. */
export const PILOT_AUDIO_RIGHTS_OBSERVATIONS: readonly AudioAssetObservation[] = Object.freeze(
  ([
  {
    "id": "cf-pilot-exploration-music",
    "file": "apps/game/assets/pilot/audio/cf-pilot-exploration-music.wav",
    "originalSha256": "b1e23e92ecaf9dd8cbf4ac398cc005702cebee0faf014814257ea30ab57d61ba",
    "derivativeSha256": "fa144fe615faef75fc426f86a44f299dcf48a1637893ccef9cf95fa2ab40a111",
    "codec": "pcm-s16le-wav",
    "durationMs": 24000,
    "sampleRate": 48000,
    "channels": 2,
    "loopStartMs": 0,
    "loopEndMs": 24000,
    "integratedLufs": -25.000264689,
    "truePeakDb": -14.373341779
  },
  {
    "id": "cf-pilot-temperate-bed",
    "file": "apps/game/assets/pilot/audio/cf-pilot-temperate-bed.wav",
    "originalSha256": "5f2c3985322e1978681826232cfcf606033f780f2c08e6d21d5cc730adf2c658",
    "derivativeSha256": "36caaa89651e44e92f9faddc53d74104cb9e1f5e11eb5a5757efbbdb978be69c",
    "codec": "pcm-s16le-wav",
    "durationMs": 24000,
    "sampleRate": 48000,
    "channels": 2,
    "loopStartMs": 0,
    "loopEndMs": 24000,
    "integratedLufs": -32.000261081,
    "truePeakDb": -19.245628541
  },
  {
    "id": "cf-pilot-ui-nav",
    "file": "apps/game/assets/pilot/audio/cf-pilot-ui-nav.wav",
    "originalSha256": "fc0b4c7e83bb03009f1419a597ece00470f94110a17ae7f55f363017ff50e1ec",
    "derivativeSha256": "14cecfcf6525c0c3637455ae7c711972021814ae5b5caf711baf7c6bb796a4c8",
    "codec": "pcm-s16le-wav",
    "durationMs": 280,
    "sampleRate": 48000,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -25.000254451,
    "truePeakDb": -10.560947258
  },
  {
    "id": "cf-pilot-ui-refusal",
    "file": "apps/game/assets/pilot/audio/cf-pilot-ui-refusal.wav",
    "originalSha256": "f7459b21954dcdeed1bcc5a3a6a70bfa45e21c5fc2558f190148885773b32ce2",
    "derivativeSha256": "3e4fcbd34d6b65583883e31347ef99c4dd538aa07a311fe7612083e3f37b9b20",
    "codec": "pcm-s16le-wav",
    "durationMs": 450,
    "sampleRate": 48000,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -25.000261916,
    "truePeakDb": -10.567289421
  },
  {
    "id": "cf-pilot-ui-settlement",
    "file": "apps/game/assets/pilot/audio/cf-pilot-ui-settlement.wav",
    "originalSha256": "28d3eb6d847894d3a7ab5b85c34815c1624c0af2016cd1dfab1a8418a679d346",
    "derivativeSha256": "40b012b8a0fe9b91de06ec83b70d575f7f90fd1534710e8b4052979f813617d3",
    "codec": "pcm-s16le-wav",
    "durationMs": 700,
    "sampleRate": 48000,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -24.000260348,
    "truePeakDb": -10.534047595
  },
  {
    "id": "cf-pilot-scout-approach",
    "file": "apps/game/assets/pilot/audio/cf-pilot-scout-approach.wav",
    "originalSha256": "ef939d548c6404f3e806400d9551a8634e02faa0a702fbce8af1917b416bc759",
    "derivativeSha256": "ad4020be2cda99df2ba91290965b1d125bf909c4b7279833da51b5b55ad5f373",
    "codec": "pcm-s16le-wav",
    "durationMs": 2400,
    "sampleRate": 48000,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -25.000265801,
    "truePeakDb": -10.980523094
  },
  {
    "id": "cf-pilot-scout-landing",
    "file": "apps/game/assets/pilot/audio/cf-pilot-scout-landing.wav",
    "originalSha256": "92f66ac3c2fd15891cb6930dc203ff4be360feed28fe9d9b6ddfa8ddf0c8e26c",
    "derivativeSha256": "6e8e3edf1dca6f232ebb13233e6921a64c33bd33830a5c1358165a764779852a",
    "codec": "pcm-s16le-wav",
    "durationMs": 1400,
    "sampleRate": 48000,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -24.405889865,
    "truePeakDb": -5.999940156
  },
  {
    "id": "cf-pilot-combat-contact",
    "file": "apps/game/assets/pilot/audio/cf-pilot-combat-contact.wav",
    "originalSha256": "a86bd3d25883e14629ae81e1478af1db521322855d08a2154506e0be0bc6dd33",
    "derivativeSha256": "fc3bcb5da5ee2a81a45d32de933cea234eb42850b151ba46565d1ad300eb6a20",
    "codec": "pcm-s16le-wav",
    "durationMs": 350,
    "sampleRate": 48000,
    "channels": 1,
    "loopStartMs": null,
    "loopEndMs": null,
    "integratedLufs": -25.36839715,
    "truePeakDb": -6.000373097
  }
] as const).map((row) => Object.freeze(row)),
);

export const PILOT_AUDIO_RIGHTS_EVIDENCE: readonly AudioRightsEvidenceObservation[] = Object.freeze(
  ([
  {
    "file": "audio-rights/CF_PILOT_C_20260905.md",
    "sha256": "d59affb6141e2495d4c1d911dba4184cf80776635f8ce51a43dd21795615f1d2"
  },
  {
    "file": "audio-rights/CF_PILOT_C_20260905.json",
    "sha256": "9cc0774ea216d505902dbe8a46971c485808e399788452e55a045a9edf84f6aa"
  }
] as const).map((row) => Object.freeze(row)),
);

const POLICY = {
  "allowedCodecs": [
    "pcm-s16le-wav"
  ],
  "allowedSampleRates": [
    48000
  ],
  "minDurationMs": 100,
  "maxDurationMs": 24000,
  "minIntegratedLufs": -36,
  "maxIntegratedLufs": -20,
  "maxTruePeakDb": -3,
  "allowedTags": [
    "pilot",
    "loop",
    "one-shot",
    "exploration",
    "temperate",
    "wind-rustle",
    "navigation",
    "refusal",
    "settlement",
    "scout",
    "approach",
    "landing",
    "contact"
  ]
} as const;
export const PILOT_AUDIO_TECHNICAL_POLICY: AudioAssetTechnicalPolicy = Object.freeze({
  ...POLICY,
  allowedCodecs: Object.freeze([...POLICY.allowedCodecs]),
  allowedSampleRates: Object.freeze([...POLICY.allowedSampleRates]),
  allowedTags: Object.freeze([...POLICY.allowedTags]),
});

export const PILOT_AUDIO_REFERENCED_IDS: readonly string[] = Object.freeze([
  "cf-pilot-exploration-music",
  "cf-pilot-temperate-bed",
  "cf-pilot-ui-nav",
  "cf-pilot-ui-refusal",
  "cf-pilot-ui-settlement",
  "cf-pilot-scout-approach",
  "cf-pilot-scout-landing",
  "cf-pilot-combat-contact"
]);
