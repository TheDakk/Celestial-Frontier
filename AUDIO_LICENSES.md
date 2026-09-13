# Celestial Frontier — Audio Asset Rights Ledger

**STATUS:** eight original opt-in pilot cues and their intake contract, **2026-09-05 local**.
The distribution contains eight PCM16/48 kHz WAVs totaling 9,752,032 bytes. Canonical creature
voices remain synthesized. `port/v2/packages/audio/src/rights.ts` pins machine authority
`arm1-d8353ea7165fd424a6c58e3eb71a2a50`; the pure validator checks supplied joins/bounds and
`packages/audio/test/rights.test.ts` independently reads the actual WAV/header/rights bytes.
Source, processing and measured native REAPER LUFS/true-peak evidence is in
`port/v2/audio-rights/CF_PILOT_C_20260905.md` and JSON. Masters and editable sources remain
private, hashed and backed up. Human listening acceptance remains open.
Adding an entry here does not make an asset player-visible. `AUDIO.md` owns runtime design,
and `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` owns the staged product boundary.

## 1. Rights rule

Only these sources are acceptable:

1. original work owned by the project with a written contributor/source record;
2. public-domain or CC0 material with a retained source/license snapshot; or
3. material with explicit commercial use, derivative-work and redistribution permission
   compatible with shipping the processed bytes inside the offline game.

Attribution-required material is accepted only when the shipped product and source repository
can satisfy the exact attribution. “Free download,” educational access, platform availability,
fair use, a search-result license label, or a recording of an unprotected animal is not proof
that the recording itself may be redistributed.

Prohibited inputs include scraped calls, ripped game/film/music audio, unclear social-media
uploads, cloned human/celebrity/performer voices, biometric voice models, microphone capture
without written consent, and a runtime dependency on remote TTS, generative audio or telemetry.

## 2. Machine-readable manifest contract

The package owns the eight-row original pilot manifest. Every future intake must supply rows
containing:

```ts
type AudioAssetRightsRow = {
  id: string;
  file: string;
  role: 'creature'|'foley'|'combat'|'guardian'|'ship'|'biome'|'music'|'ui';
  sourceUrl: string;
  creator: string;
  licenseId: string;
  licenseSnapshot: string;
  commercialUse: true;
  derivatives: true;
  redistribution: true;
  attribution: string | null;
  acquiredOn: string;
  proofFile: string;
  processing: string[];
  originalSha256: string;
  derivativeSha256: string;
  version: number;
  codec: string;
  durationMs: number;
  sampleRate: number;
  channels: 1 | 2;
  loopStartMs: number | null;
  loopEndMs: number | null;
  integratedLufs: number;
  truePeakDb: number;
  tags: string[];
};
```

The manifest uses stable IDs; gameplay/profile data refers to IDs, never filenames or URLs.
Originals and license proof are retained in an appropriate source archive even when only a
processed derivative ships. Updating a derivative creates a new version/hash; it does not
silently replace the evidence for an older published build.

The current pure validator proves exact row/observation/evidence/reachability joins, hashes and
technical-policy bounds for supplied data, with independent missing-row, hash-drift, license-drift
and orphan controls. The pilot adds concrete filesystem/WAV-header/hash observations and
measured REAPER loudness/peak records. In-memory byte corruption, truncation, proof drift and
restoration controls prevent a self-consistent manifest from substituting for real asset bytes.
No hosted CI acceptance or human listening approval is implied by the local intake checks.

## 3. Catalogue language

An Earth organism mapping is keyed by `kingdom|name`. The current roster has 1,010 deduplicated
Earth identities represented by 1,014 set-qualified compatibility routes. A mapping may point
to a licensed signature recording, a curated family palette, owned foley, synthesis, ecological
ambience or scientific sonification. It must never imply that an authentic call exists for
flora, fungi or microbes, and it must never fall through to an unrelated mammal sound.

## 4. Required gates

CI must fail on:

- a referenced asset without a ledger row or a ledger row without a file;
- duplicate IDs/files, missing required fields or unknown tags;
- a missing/changed license snapshot or proof file;
- a license whose commercial/derivative/redistribution flags are not all explicitly true;
- original or derivative hash mismatch;
- codec, duration, loop, channel, loudness or peak outside the declared technical policy;
- an asset not reachable from any approved palette/profile (orphan); or
- an unmanifested or cross-origin call-home, remote TTS/generative-speech service, microphone or
  recording API, behavioural telemetry, or genome/share-identity network disclosure. Same-origin
  delivery of hash-bound packaged assets and explicitly approved local accessibility APIs are not
  violations.

Negative controls deliberately remove a row, mutate a byte/hash, substitute an incompatible
license, orphan an asset and reference a missing ID. A green validator without those controls
is not evidence.

## 5. Current ledger

No external or recorded audio assets are approved or committed as of 2026-08-24. The pinned
machine-readable manifest is empty and its pure validator/negative controls authorize nothing.
The first asset batch must populate it, add the proof archive convention and real filesystem/media
observations, lock a decoded-memory policy from measurements, extend the necessary negative
controls, and add the corresponding entries here in the same batch.
