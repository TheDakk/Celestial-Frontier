# Fauna and biome audio continuation — September 15

The fauna/biome continuation acquired 487 additional source entries (206 Rocky Mountain NPS,
254 individually CC0 iNaturalist recordings and 27 inspected NOAA recordings). There are now
1,579 source entries / 1,575 unique originals; 1,572 fully decode and three damaged originals
are retained in quarantine. 359 new REAPER renders comprise 321 identified recording-reference
excerpts and 38 environment components. Totals: 1,534 validated WAV/Opus pairs, 1,313 unique PCM
treatments, 42 successful editable production projects, 102 retained loop derivatives and 49
instrument stems. $0 spent. The two failed fauna project versions are retained separately.

Identified source-reference coverage is 154 / 631 fauna; 477 still lack an eligible reference.
Broad game names may use explicitly disclosed narrower taxa. This establishes neither exact
behavior calls nor listening approval. All 1,010 Earth identities retain the existing audio owner;
379 non-fauna identities remain fictional sonification. No generic voice fills a recording gap.
All 43 biome profiles now have explicit environment recipes, including gas, ice, cave, volcanic,
underwater and airless profiles. 486 audited routes resolve 484 rendered recipes and two explicit
silences, with zero missing components. Exotic environments are designed sound, not field claims.

## Rights and identity

The supplied manifest is unchanged. Supplemental sources are listed in
`audio-production/manifests/supplemental-sources.json`. Original byte hashes, per-item credits,
recording titles, scientific names, licenses and source evidence are retained. iNaturalist intake
checks the sound's own CC0 license, research-grade taxon, hidden/flagged status and bounded media
budget; an observation/photo license cannot authorize its audio. Geographic coordinates are not
exported to the committed record. NOAA intake admits only the inspected recording-owner subset;
external institutional recordings are excluded despite NOAA hosting. Any supplied speed changes
are recorded and excluded from native-rate fauna reference binding. NPS item credits are preserved.
No CC BY/SA/NC recording was acquired. Nick's license-expansion question is pending, not approved.

`audio-production/manifests/ecology-coverage.json` names all 631 fauna, exact candidate hashes,
reference IDs and the separate unresolved behavior fields. `FAUNA_GAPS.md` lists the 477 missing.
These collections are not an exhaustive search of every public-domain archive. Further licensed
sources or recordings and context/listening review are required; no source availability is invented.

## Defects found and repaired

1. Three MP3 originals fail a full `ffmpeg -xerror` decode. Intake refuses them, preserves their
   bytes and retains the red receipt (`reports/source-decode.json`, `source-quarantine.json`).
   Report construction requires every source measured and every failure explicitly quarantined;
   any recipe referencing a quarantined hash fails. The remaining unique-source subset is clean.
2. An Ash Cicada source decodes at +8.8 dBTP; its first REAPER render clipped before export.
   Merely lowering export gain would keep that distortion. New excerpts receive measured,
   attenuation-only input headroom (at most -9 dBTP) before rendering. 85 of 321 required extra
   attenuation. Source/hash/duration-bound validator rejects old high gains and stale measurements.
3. A Lily Leaf Beetle file named .mp3 contains AAC. FFmpeg decodes it, but REAPER imported it as
   silent WAVE. New reference excerpts are decoded to portable 48 kHz floating-point WAV before
   REAPER; originals are never overwritten. Prepared-media receipts bind original and PCM hashes.
   The final outputs are non-silent and peak-checked (`production-controls.json`). Prior failing
   projects, recipes and partial previews remain in their named evidence/quarantine directories.
4. The former environment fallback could route a gas world to foliage. The exhaustive 43-key
   table now selects pressure/ice-cloud/thermal etc. Controls reject missing routes and assert
   gas worlds have no foliage, cratered worlds remain silent, and underwater suppresses air beds.
5. Earlier acquisition failures are preserved as history but marked resolved only against actual
   clean alternative hashes. Housekeeping archive members remain intentionally excluded. Three
   original NPS page gaps remain; none is silently counted as a usable recording.

## Checks and review

Eight Python control tests and 13 focused TypeScript tests pass; typecheck and root validation
pass. The preceding unchanged wider suite is recorded in AUDIO_GAME_COVERAGE_20260915 (377 files,
4,372 passes, one skip); it was not rerun or relabelled as this continuation. Native-01 passes real
in-game playback/Stop, fake-Stop refusal, weather/music/gas-world recipes, 390px layout and six
WAV/Opus frame-parity examples including the new lion/pressure outputs. Screenshots inspected.
This is local dirty-source diagnosis, not release admission, listening approval or an iPhone test.

Preservation: `preservation.json`. The supplied handoff, kits, accepted art/audio, runtime packs,
player release content and Claude-owned modules are unchanged. No gameplay RNG, new AudioContext,
full-bank decode or ordinary-game asset replacement. Source/master/project media and ZIPs remain
ignored local files; committed ledgers are not an independent backup.

One review prompt: `audio-production/REVIEW_PROMPT.md`. New ZIPs: `review-packs/ecology-20260915`,
17 ZIPs, largest 27.94 MB; 142 focused WAVs plus all 1,534 candidate Opus and 102 loop copies.
All 2,014 packaged entries were re-hashed against the ZIP contents. Raw originals and full portable
project media remain on Nick's Mac. Packaging verification and the final root validation were
performed after ZIP creation; their terminal receipts remain beside this file.
Codex next: source authorization/context review and bounded per-behavior cue work. Claude need not
open its app now; review the consolidated prompt when Nick chooses. No GitHub write, Actions,
new branch, history rewrite, kit edit or asset approval. PR42 remains parked.
