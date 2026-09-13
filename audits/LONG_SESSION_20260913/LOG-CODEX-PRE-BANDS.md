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
| B5, B8, B10, B11 batch 3 | built and green; residents on the landfall under ?worldlife=1, voices per creature in battle2, phone particle budget, leg-slack diagnostic | see git log | audits/LONG_SESSION_20260913/LOG-B.md (batch 3 section) |
| A11 family motion templates | accepted (mechanical); synthetic landmarks, not anatomy evidence; myriapod, cephalopod, flyer-membrane, primate built in B3 (LOG-B.md) | see git log | audits/LONG_SESSION_20260913/a11-family-sheets/ (nine sheets, byte-identical on re-run); 54 motion tests |

- 2026-09-13 Wild second intake reviewed: travel ACCEPT, impact TARGETED INTAKE FIX (two clusters), registration ACCEPT, no further erosion; response in audits/WILD_V43_PROOF_20260913/second-pass/.
- 2026-09-13 Wild targeted impact pass reviewed: both clusters ACCEPT (tuft rose streak and leaf rim are master paint; my second-pass read corrected); C1 mechanical intake complete pending Nick's eye; response in audits/WILD_V43_PROOF_20260913/targeted-pass/.

## Pack7 bounded C2 repairs — native qualification pending

Pack7 imported verbatim63f16d68, eight requested paths hash-verified; unchanged requested paths
remain exact even though Git lists only five changed files. Producer source from ZIP excluded.
Prior Codex LOG preserved verbatim in LOG-CODEX-PRE-PACK7.md. Fallback ACCEPT as labelled
presentation; articulated C2 FAIL stands until the prescribed gates and Nick's eye pass.

Candidate01 in C2_BOUNDED_REPAIR_20260913 changes Civet head underlap0.025→0.045 and adds
neck0.040 at chest, existing sample centre0.35/0.49 retained. The square-crop guard first
refused253magenta corner pixels outside the actual disc; failure retained. Guard now checks
only retained ink after disc/opaque-rest masking, with excluded-corner and retained-magenta
negative controls. No source painting or radius/pose change beyond the two prescribed patches.

Fox re-observation changes only hindNearKnee(.328,.775),foreFarKnee(.782,.670),
foreNearKnee(.663,.680); hindFar already passes. Normalized points observed against the same
master, including hidden joint-axis alpha tolerance; roots/ankles/paws/ground/material/clip set
unchanged. Rest slack4.23/3.19/4.01/3.23%BL, all≥3%. Hash/bounds/lengths resealed, mask binding
rehashed with identical polygons. Native renderer/real compiler still must verify it.

Rebuilt one deterministic atlas each: Civet33parts2047x1006,fox22parts2038x1085; fox packed
pixels unchanged. Old declarations/records/atlases preserved as controls. Native --repair-gates
measures Civet7400ms full rest head/neck/chest union (no ROI erosion), old0.025negative, zero
restRGBAchange, oldfox1375msrefusal, newfox120Hzscan and actual card legSlack. No8%boundchange.
No new10s capture before these gates pass. No kit/main.ts/protected module/GitHub edit.

## Pack7 native result — Civet FAIL, fox PASS; capture stopped

1873abe0 native-gates-01: both corrected rigs0restRGBAchanges. Fox old1375mscompression
refusal retained; new120Hzscan1200samples passes,max5.0189%BL<8%, actual card alllegs3.19–4.23%
slack and no notes. Civet7400msresthead/neck/chestunion143503pixels: old24473zeroalpha,
new24370,target0FAIL. Count includes vacated outer boundary as well as internal gaps; visible
throat seam independently remains. No third repair, bound relaxation or new10scapture.
Civet/proc contactscanmax5.8267/5.2172% is not shape acceptance. All native failures retained.

RESULT.json, REVIEW_PROMPT.md and native stills are the review handoff. Typecheck,7rig/contact
tests,2patch tests,rootvalidate and diffcheck pass. Review kit/producer hashes unchanged.
Nick's accepted portrait fallback retained. Codex stops for scope/review before more Civet
work; Claude can review this bounded evidence and propose one next correction for Nick.
C3 waits behind proof. No app switch for synchronization, no GitHub/PR42/kit/main.ts change.
