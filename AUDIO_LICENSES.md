# Celestial Frontier — Audio Asset Rights Ledger

**STATUS:** authoritative empty ledger and intake contract as of **2026-08-13**.
The repository currently contains no committed `.wav`, `.ogg`, `.mp3`, `.m4a`, `.aac`,
`.flac` or `.webm` audio assets; current audible behavior is synthesized at runtime.
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

Before the first media asset lands, add a validated manifest whose rows contain:

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

No external or recorded audio assets are approved or committed as of 2026-08-13. The first
asset batch must add the machine-readable manifest, proof archive convention, validator,
negative controls, decoded-memory budget and the corresponding entries here in the same PR.
