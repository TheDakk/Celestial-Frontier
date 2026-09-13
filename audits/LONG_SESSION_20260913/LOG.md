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
| A11 family motion templates | accepted (mechanical); synthetic landmarks, not anatomy evidence; myriapod, cephalopod, flyer-membrane, primate still unbuilt (registry test names them) | see git log | audits/LONG_SESSION_20260913/a11-family-sheets/ (nine sheets, byte-identical on re-run); 54 motion tests |

- 2026-09-13 Wild second intake reviewed: travel ACCEPT, impact TARGETED INTAKE FIX (two clusters), registration ACCEPT, no further erosion; response in audits/WILD_V43_PROOF_20260913/second-pass/.


## Codex Pack4 / C1 targeted correction — 2026-09-13

Pack4 committed verbatim6b574220; previous local log retained inLOG-CODEX-PRE-PACK4.md;
all9path hashes inpack4-receipt.json. One radius8 explicit-target RGB pass on second-pass
keyed impact:9pixels changed in lower-right rectangle,0eligible in top-right rectangle after
required exclusions. Zero alpha/protected/outside-target changes; no erosion or generation.
Travel/launch/MID and all masters unchanged. Updated hashes in anchors and current registration
receipt; prior receipts retained. Evidence: ../WILD_V43_PROOF_20260913/targeted-pass/.
Mechanical diagnostic split before correction: travel85pink-band,1pale,24umber; impact52pink-band,
9sheen,16pale,8umber. Heuristic counts are not Claude's visual44/31 estimates; both retained.
No under40 target or global retry. Nick retains final image acceptance; unchanged top-right
crop explicitly supplied. Independent C2 continues. No main.ts/kit/Claude-module/GitHub edit.


## Codex C2 — turnaround patches ready for native rest admission

Head-crest polygon corrected;22-part Civet base repacked. Ten existing-turnaround fur underlaps
added beneath opaque base pixels in their own depth layers; one32-part2047×951current atlas.
Two source-fit refusals retained and corrected (magenta source crops; near-only coverage for
far legs). Native rest runner compares to whole master and removes the head as a negative
control; native result follows on a clean committed head. No Motion curves typed, fox/procedural
proof yet, source sound, kit/main.ts/Claude-module/GitHub edit. Evidence: ../C2_PARTS_ATLAS_20260913/.


C2native admission is waiting on local1Password signing, not a new scope approval. Both
signing attempts failed with agent-returned-error; source/evidence staged and preserved.
No native successor run or unsigned-commit bypass. Latest signedHEAD6b574220,79aheadupstream/
190aheadcacheddevelop. Native command and exact resume boundary are inROADMAP.


Signing unblocked: verified1b0b5707,80aheadupstream/191aheadcacheddevelop. Native-rest-01
failed at bundle construction before any browser: output.file cannot emit Pixi dynamic chunks.
Runner corrected to output.dir; failed report preserved. No painting or source asset change.
