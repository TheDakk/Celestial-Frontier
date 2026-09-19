# Audio handoff preparation and actual host qualification — September 15

Nick's latest direct request authorizes a $0 REAPER/Surge/stock-effects production workflow,
approved free packs/public-domain recordings, whole-game coverage and continued production
beyond the first proof. Preserve authentic recordings separately from fictional synthesis and
temporary approximations. This supersedes the earlier C3 original/commissioned-only execution
restriction for this request; no frozen kit wording was changed or re-approved here.

## Required input not located

`celestial-frontier-audio-handoff/CELESTIAL-FRONTIER-AUDIO-HANDOFF.md` and its
`audio-sources.json` were not found in this worktree, the checked Downloads directory or
Claude audit/scratch locations. Nick has been asked for the actual folder path. Neither
file has been read, and the download manifest/schema/approved pack list must not be invented.
The next step is to read and preserve them, then execute their specific production instructions.
The earlier three web candidates are not a substitute for that manifest.

## Actual game inspection

`game-inventory-v2.json` records the current source-bound game vocabulary: 631 fauna,
332 flora, 27 fungi, 20 microbes; 43 biome profiles, 29 weather values; 16 fauna body traits,
18 locomotion traits, 9 skin materials; ten non-null ProcPlan branches; twelve recorded-voice
archetypes; eleven ability themes; six settled creature event kinds and eighteen combat cues.
A ProcPlan branch is not a complete motion-family inventory. The versioned audio route manifest
also retains four compatibility routes; these are not four additional species.

The eleven theme keys are fire, frost, storm, tide, stone, venom, void, sand, chem, psionic,
wild. Values and game hexes remain unchanged. The existing audio taxonomy is coarse kingdom
routing, not authentic animal recording coverage. Its four kingdoms must not be advertised
as species-specific assets. The existing pilot provides eight cues and a limited review screen;
only one exploration music phrase was identified, not a complete adaptive music-state system.

Runtime/owner/rights sources were inspected. New audition playback must use the accessible
finite-voice owner with user gesture, sound preferences, captions, aborts and route/disposal
cleanup. `pilot-pcm.ts` currently accepts 16-bit 48 kHz WAV and 24-second bounds; production
24-bit/Opus assets cannot simply be dropped into that player. Claude-owned modules stay read-only.

## Actual REAPER/Surge work

The installed REAPER 7.80 and Surge XT 1.3.4 are accessible. The Lua script successfully creates
an empty dedicated project, loads Surge XT VST3 and stock ReaEQ/ReaComp, inserts explicit MIDI,
and saves the editable RPP, full synth/effect track state and every exposed synth parameter.
It uses no microphone, source library, purchase, additional software or API service.

- `reaper-qualification`: project/state created, but the first save used option 0 (save copy)
  and the instance did not exit. The saved evidence was retained; only this task-owned process
  was terminated (exit 143). The save call now uses option 8 to assign the project filename.
- `reaper-qualification-02`: corrected preparation exited normally; two actual saved-state
  renders exist and pass format/length/headroom. Their samples differ. The observed oscillator
  Retrigger parameters were off; this result is retained, not labelled deterministic.
- `reaper-qualification-03`: explicit retrigger on for six oscillators, drift off for both
  scenes; preparation/render/replay all exit zero. Two actual 3-second, stereo, 48 kHz/24-bit
  WAVs have 144,000 frames, identical decoded PCM (zero changed samples), and -33.45 dBTP.
  A mutated PCM sample fails the comparison. Original project/render bytes remain unchanged.
  Container hashes differ because metadata differs; no whole-WAV byte identity claim.

This qualifies this saved synth/effects state and host path. It is a quiet diagnostic signal,
not an authentic animal, fictional creature voice, accepted music phrase or general proof for
all Surge patches. No human listening review has occurred. Existing masters/game assets and
all gameplay remain unchanged. The Mac's UI was locked when queried; command-line preparation
and rendering still completed, so no UI inspection or security bypass was needed.

## Status at this stop

| Work | Actual status |
| --- | --- |
| Handoff/manifest read | Blocked: location missing |
| Approved pack / public-domain downloads | 0 attempted, 0 completed; manifest required |
| Creator/license/source retention for downloads | Not started; no files acquired |
| Installed REAPER/Surge access | Verified |
| Lua, editable projects, saved synth states | Implemented and executed for host qualification |
| Rendered audio | Four real WAV renders retained: two differing controls and two matching-PCM results |
| Production species/family/theme/biome/music assets | Not produced; no generic placeholders promoted |
| Actual game-event inventory | Extracted; no new asset-to-event assignments |
| In-game production audition screen | Not implemented; existing eight-cue pilot inspected |
| Listening approval | Not performed; nothing accepted |
| Cost | $0 |

## Continue

Read the missing handoff/manifest first. Then download only their approved sources, retain
originals and creator/license evidence, map authentic species recordings without pretending
relative-family sounds are authentic, and produce the required fictional/material/effect/music
sets through saved-state jobs. The qualified host runner is available now; it is not the full
production job compiler. Implement manifest-aware projects and event mappings, bounded audition
playback and a coverage/status ledger from the actual inventories. Continue all unblocked work
across families/themes/biomes; do not use this first technical proof as the completion boundary.

[Exact local run step](../../port/v2/tools/audio-production/LOCAL_RUN.md).
Root validation/fingerprint passed; existing gameplay/unit sources were not changed. The prior
C2/C3 batch remains staged after signing failed; latest signed b95c4dc0 is 115 ahead upstream,
226 ahead cached origin/develop, zero behind. No new signing retry without a ready agent, GitHub
write, new branch, history rewrite or main.ts hunk. Codex resumes locally when the handoff folder
is available; Claude needs no action or app switch. PR42 parked.
