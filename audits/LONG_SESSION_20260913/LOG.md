# Long-session log

Packages per WORK_ORDER.md. One entry per package on acceptance: commit, evidence paths, what was not done. Per-package drafts live in LOG-A1.md etc. until folded in here.

| Package | Status | Commit | Evidence |
|---|---|---|---|
| A1 motion compiler | accepted (mechanical); open decision: procedural material owner (genome says translucent, painter record says fur) | see git log | audits/LONG_SESSION_20260913/a1-pose-sheets/ (civet, fox, procedural sheets + cards + timelines, byte-identical on re-run); 25 tests |
| A2 effects sequencer | accepted (mechanical); travel mode per theme (melee: hold-and-reveal; projectile: slide) to be set in A3 | see git log | audits/LONG_SESSION_20260913/a2-sequence-sheet/ (12-frame sheet, identical SHA on re-run); 21 tests |
| A5 world-life | accepted (mechanical); wiring to the real plate is A3/A6 | see git log | audits/LONG_SESSION_20260913/a5-life-sheet/ (landfall and arena sheets, replay digest reproduced); 29 tests |
| A4 sound derivation | accepted (mechanical); listening is Nick's | see git log | audits/LONG_SESSION_20260913/a4-voices/ (nine placeholder-archetype WAVs, byte-identical on re-render); 19 tests |
| A3 battle scene v2 | accepted (mechanical); Nick's eye on the capture; fixture rig until C2; main.ts wiring pending | see git log | audits/LONG_SESSION_20260913/a3-battle/proof-run-01/civet-vs-platypus-10s.mp4 + nine beat frames; 25 tests |
| A6 part 1 defects | accepted (mechanical): K19, K20, K21, K22 part 1, K24, K25, K27, K28, K29, K30/31 fixed with negative controls; K22 part 2 (import t:0) left for Nick's decision | uncommitted on anthropic/mac at handoff (Nick commits after review; no git write by the agent) | audits/LONG_SESSION_20260913/LOG-A6-defects.md; smoke 553/0, validate PASS |
| A6 part 2 docs and wiring | built and green on the mechanical gates; Nick's eye on the flagged studies is open: `?battle2=1` (A3 stage over the Chronicle mount) and `?worldlife=1` (A5 layer over the landfall vista); material owner flipped to record-first per CONTRACTS §5; MOTION_KIT/SOUND_KIT marked "matches code as of 2026-09-13" | uncommitted on anthropic/mac at handoff (Nick commits after review); three announced main.ts hunks, listed in LOG-A6-wiring.md | audits/LONG_SESSION_20260913/LOG-A6-wiring.md; tests/battle2-wiring (11), tests/worldlife-wiring (10), tests/motion-body-card (13, record-first controls); typecheck 0; validate PASS; smoke 553/0 |


## Suite baseline note (2026-09-13)

The full `vitest run` on this tree has 24 failing tests in 12 files. All 24 fail identically on Codex's committed head openai/mac 1e65e006 (verified in a temporary detached checkout of that exact commit, then removed): app-chrome-main-wiring (3), compendium-budget (2), current-producer-authorities (suite), evidence-build-runtime (2, needs the evidence build with onnxruntime), exceptional-crafting-evidence-contract (2), guide-release (1), painted-earth-mount-ownership (12), pwa-offline (1), slicesmoke-sixth-red-contract (1), and three `node:test` .mjs files under tools/ that vitest collects with 0 tests. None is caused by the merge or by packages A1 to A6. They belong to Codex's lane (C5 pruning and exact-head admission) and are recorded here so nobody mistakes them for new reds.
| A7 pose editor | accepted (mechanical); Nick's tool | 20f50f70 | audits/LONG_SESSION_20260913/a7-pose-editor/capture-01/; 11 tests |
| B1–B4 batch 2 | built and green (typecheck 0; 26 suites / 220 tests; root validate PASS); live capture REVIEW (602 frames, cues within one frame of their beats; found and fixed the frozen particle count and the pale-on-pale disc); Nick's eye open on the four B3 sheets and the capture; audio port and impact hold decided on Nick's delegation (LOG-B.md) | see git log | audits/LONG_SESSION_20260913/LOG-B.md; b3-family-sheets/; b-batch-capture/proof-run-01/ (A1 procedural evidence refreshed) |
| A11 family motion templates | accepted (mechanical); synthetic landmarks, not anatomy evidence; myriapod, cephalopod, flyer-membrane, primate built in B3 (LOG-B.md) | see git log | audits/LONG_SESSION_20260913/a11-family-sheets/ (nine sheets, byte-identical on re-run); 54 motion tests |

- 2026-09-13 Wild second intake reviewed: travel ACCEPT, impact TARGETED INTAKE FIX (two clusters), registration ACCEPT, no further erosion; response in audits/WILD_V43_PROOF_20260913/second-pass/.
- 2026-09-13 Wild targeted impact pass reviewed: both clusters ACCEPT (tuft rose streak and leaf rim are master paint; my second-pass read corrected); C1 mechanical intake complete pending Nick's eye; response in audits/WILD_V43_PROOF_20260913/targeted-pass/.

## Codex C2 continuation — Pack6

C2 fox/painter source signedc1452f46; Pack6 committed verbatim18bd7368,23paths verified.
Prior local LOG preserved verbatim in LOG-CODEX-PRE-PACK6.md. Signing resolved. Native fox
rest on18bd7368 PASS:22parts,0changedRGBAchannels, missing-head mutant284037channels,
0.0069ms mean empty-pose update. Report/screenshot: ../C2_PARTS_ATLAS_20260913/native-fox-rest-01/.
Not motion acceptance. Native procedural masks next; producer root-broadcast fix still pending
in protected Claude motion/. Audio-owner and240msimpact-hold decisions adopted as supplied.

### Native painter mask observation — first refusal retained

native-painter-parts-01 on cee01f47 refused because capture altered ordinary painter pixels;
no mask/record artifacts admitted. Direct repeated getImageData on the live Canvas2D surface
is the suspected cause (readbacks can change rendering execution). Capture now copies the
surface to a separate willReadFrequently canvas before reading; no draw/RNG command changed.
This hypothesis is not yet native-qualified. The next bounded comparison uses a NEW
native-painter-parts-02 directory on committed source. It records changed-channel count/max
on failure and a deliberately corrupted-pixel control. Typecheck,4focusedtests/rootvalidate
pass. No motion, staging or C3 acceptance. Original refusal remains in report.json.

### Painter readback separation

native-painter-parts-02 on fabfd5e5 still refused370changedchannels,max30. Copying at each
stage did not establish ordinary-render parity; both refusals retained. The authoring wrapper
now completes the ordinary render first, then runs the same seeded winning painter separately
for masks. It returns the original portrait/ink, compares replay anatomy/material, clips mask
labels only where original alpha is transparent, and refuses any missed visible original pixel.
No colour/alpha change to the ordinary master is allowed. This is a bounded observation replay,
not a new creature, model painting, changed parameters or guessed family record. Its native
check uses NEW native-painter-parts-03 on committed source. No motion acceptance claimed.

### Procedural masks and actual Motion compiler — admitted

native-painter-parts-03 on782e827a PASS: ordinary rendered pixels unchanged (0channels),
34714paintedpixels,21parts,31quadruped joints,actualsurface translucent. No new genome or
painting parameters. The separate observation replay supplies labels only; native original
ink remains authoritative. Its hash-bound record/master/labels/declaration are retained there.
Procedural atlas is one543x261image,0changedrest/packedRGBAchannels. Native rig rest next.

body-cards-01 uses the actual read-only Claude compiler and retains source/input hashes,
all3cards and idle/melee/hit timelines. All repeat byte-identically; missing head refuses for
each. Civet small0.85/furred,fox medium1.0/furred,procedural huge1.4/translucent. No cards or
per-creature curves typed by hand. Card notes are empty; source records still lack explicit
mass,locomotion,realm,weapons,luminous and numeric rotation/secondary limits. The compiler
supplies those via named-Earth mapping or procedural genome/template defaults, not our rig.
This is compiler interop only, not GSAP/ground-contact/fps/motion acceptance. Prepared producer
root-offset fix remains blocked by cross-lane ownership. No protected source edited or merged.

## C2 native rest admission across all three records

native-procedural-rest-01 onf5e17fb8 PASS:21parts,0changedRGBAchannels; missing-head negative
6832changedchannels;0.0066ms mean empty-pose update. This completes native REST admission
alongside Civet and fox, not motion/contact/60fps/staging. C2 captures remain blocked on the
prepared Claude GSAP root-offset fix, then shape/contact qualification. Source,atlas hashes,
compiler cards/timelines and all failed observations retained. C3 not started. GitHub none.

## C2 motion continuation — corrected producer admitted

Interop response/probe committed verbatim e92941cb. ZIP also contains protected source/test
files; only the two expressly requested audit paths were imported. Corrected source SHA
6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74 verified read-only in Claude's
tree. Nick identifies64bef82e; supplied response mentions45beca27. Exact file hash matches.
Ownership exception no longer needed; no protected modules changed or merged into this tree.

Record-driven contact solver uses existing two-bone kinematics; planted idle/hit preserves
actual paw positions/perspective offsets, flight passes through. Family compression cap8%body
length; unreachable contacts refuse, never slide the paw. Seven focused rig/contact tests pass
with unconstrained-paw,unreachable-target and wrong-family negatives. Typecheck/rootvalidate
pass. These are mechanical precursor checks, not motion/shape/60fps acceptance.

parts-motion-runner/entry load the3real atlases, current Wild registered images and accepted
arena. Compile actual Claude cards/timelines read-only into a temporary browser bundle; no
source copied into tree. GSAP poses are batched once per frame, constrained by anatomy; same
curves on every creature. Captures contain an outgoing and incoming turn beside accepted rainE,
seeded Pixi8 effects,240msimpacthold,kit choreography. Existing whoosh/ping only; C3 pending.
Native first run is NEW audits/C2_PARTS_MOTION_20260913/proof-01 after commit. All failures kept;
no automatic retry, no kit/main.ts/GitHub edit. Stop at ten-second captures for Nick's eye.

Native proof-01 on200e5d17 passed all3contact admissions (maximum constrained error below
3e-13px; bypassed solver drifts11.14/9.99/10.21px). Capture stopped before media recording:
proof harness called initAudio without required sndOn/sfxVol providers. Corrected to the
existing isolated-proof options (sound on,volume.35). No audio-owner/game/kit change. Failed
report and first Civet plan retained. Next run proof-02 uses corrected committed harness;
no motion image acceptance or encoded video claimed for proof-01.
