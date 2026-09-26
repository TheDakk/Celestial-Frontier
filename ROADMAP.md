# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · PROCEDURAL_CHARACTERISTICS · CREATURE_ANIMATION · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS · LOCAL_AI_GENERATION) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## Current shared sprint handoff — 2026-09-26, C41/C43/C45 batch

### Working state and authority

- Codex worktree `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`; Claude's worktree `/Users/nick/Projects/celestial-frontier-anthropic-mac`, branch `anthropic/mac`. Shared object store; signed commits only, HTTPS origin through gh. No new branches or temporary worktrees.
- Requested Claude history through signed`23bb209e` merged with signed`--no-ff` commit`86ee9347`; no conflicts or markers. Codex implementation checkpoint`bfe76a6b` follows. The final evidence/repair commit carries this handoff; resolve it from `git log openai/mac`.
- Read the other lane's absolute mailbox at run start AND batch end; write only your own. Read `PARALLEL_GIT_PROTOCOL.md` before the next batch. Claude's latest read-only head was signed`129796c8`; C44/C45 were read and answered, but that newer history is **not** merged here. Claude reports it merged`bfe76a6b` and wired the flagged G5 card adapter.
- Nick permits own-branch push only. Budget UNFROZEN; unchanged workflows trigger only PR labels or manual dispatch, so a normal branch push triggers no Actions. No PR/label/hosted/develop/main/release/deploy/version bump in this batch. I5 remains the one acknowledged battery red; no hosted attempt while red.

### Completed work

- **Parked gameplay remains consolidated and complete** from the prior batch: Forge Training and motion-aware living portraits. No parked branch or unfinished stash is needed to retain it. The generated creature pipeline remains the shared priority (D22/D23).
- **C43 size/transport code:** original128–2048 dimensions; right/bottom zero-pad1254→1264, crop back1254 without shifting/resampling original pixels. Transferred ArrayBuffers or legacy `/inputs` refs, exact SHA/length checks before GPU/model engine creation. Existing settings, alpha bytes, labels/binding and conservation checks unchanged. Corrupt/detached/shared/resizable/ambiguous refs refuse. Eligibility now refuses before engine construction too.
- **C41 stage/phones:** private per-individual admission after original rig preflight plus genuine master/binding/label pins and finish conservation. Phone delivery requires BOTH PNG and receipt entries at `library/creature-finish/<exactkey>/` in bundled G3 authority. No delivered originals published here. Supplementary label pins cover34fits; Civet/Eel/Rat/Salamander still refuse missing labels.
- **C45 CARD = STAGE seam:** verified finished pixels → existing individual palette remap → every-alpha-byte check against private baseline → unchanged seam guard. Fixed an in-place alpha alias in ordinary morphs too. Fifteen focused admission/pinned/morph tests pass. Claude can now wire stage with both `finishedAtlas` and `atlasPixels`; API/evidence in `audits/G5_ADAPTER_UNBLOCK_20260926/C45.md`.
- **G2 family pilot:**20 untouched1254 originals (five each birds/fish/serpents/insects), exact canonical identities/prompts/style hashes, one sheet and independent geometric observations in `audits/G2_FAMILY_PILOT_20260926`. No hand authoring or game admission. Full true tails requested and visibly retained; overlaps and unwanted markings remain findings. C44's later planted-stride/full leg-gap wording is in the compiler for subsequent bird/quadruped packets; these20 retain their earlier prompt receipts.
- **One G4 copy remeasurement:**120 ordered release bullets, SHA`aa5bc1c4583f685f6fe7caff9ed37636b565e290be351011dec0855fc85ef6f0`;41 Guide topics,5 briefings. G4 bullet/Compendium paragraph, Slice and Glass authorities and missing-row controls agree. `audits/G4_COPY_REMEASURE_20260926` retains the measurement and46 focused passing checks.

### Open gates and exact next work

1. **Nick-only alpha eligibility decision is pending:** keep alpha===255, or allow alpha>=250 for the editable interior while retaining all original alpha bytes, the four-pixel boundary and conservation gates. The one native1254 Cougar run on signed`bfe76a6b` refused with `No editable creature interior`; no inference/output was produced. A pinned read-only inventory proves ZERO labels-present1254 masters eligible (only five880crabs pass). Do not rerun unchanged inputs or claim1254 native acceptance. If approved, change eligibility with controls and run one fresh native1254 proof on clean signed source. Otherwise record C43 native proof blocked. Evidence: `audits/G5_ADAPTER_UNBLOCK_20260926/{README.md,eligibility-inventory.json,native-bfe76a6b-refused}`.
2. **Six G1 author/fit reds stay open:** Grouse support split, Eagle/Sandpiper folds, Sparrow foot limit, Mongoose blended-presentation limit and Tapir compression/fold. One generic contact refinement was rejected; no hand fixes or relaxed gates. The runner's omitted presentation-failure reporting is repaired. Full findings/reproduction in `audits/G1_FIT_REPAIR_20260926`. C44 further identifies Eagle's under-owned tail and Sparrow's landmark limit. These need automatic source-evidenced ownership/landmarks and the unchanged static/native gates.
3. **Claude:** consume Codex's signed final commit from the shared store, wire the additive stage seam, re-score the20 new G2 packets, and create NEW candidate derived-label audit packets for the four missing sources under C45.md's provenance/overlap/coverage controls. Do not alter original fit evidence or call derived ownership an anatomical observation. Civet's opaque master is a separate card limitation. Native1254 original publication waits for a real output and its receipt.
4. **G1 remains red, S4/broad generation parked.** D24's alternative denominator is undecided; old gate stands. D25 reference shopping remains OFF. No fit static/semantic/quality acceptance is inferred from library generation, unit tests or a RESOLVED status.

### Final verification and cleanup

- Browser-free `node tools/check-profile.mjs --profile=develop`: **5,635 PASS; I5 only FAIL**,2 expected failures,2 skips across560 files. All seven manual owners PASS: root/app/worker TypeScript, artaudit, overridecheck, speccheck, overridecontrol. Logs and exact changed-code hashes: `audits/G5_ADAPTER_UNBLOCK_20260926/final-battery`.
- Root validate PASS: zero boot errors,1010 Earth renders, unchanged50-probe fingerprint. Worker regressions, C41/C45 controls and copy mutation controls pass. Initial test-only count/type failures are retained in `pre-repair-battery`; both corrected without weakening assertions. No full browser certificate or physical-iPhone proof is claimed.
- Startup approved-tool check PASS, no eligible updates; receipt in G5_ADAPTER_UNBLOCK_20260926. Free disk **227GiB**, above40GiB floor. Removed82.2MB of ignored rejected-fit/prepared-input scratch; kept full reports/originals/hashes/reproduction. Only3 permanent worktrees, no stashes, newest2 previews retained; image-tool originals remain in their original location.
- Next Codex: resolve the actual alpha gate, then proof and remaining automatic-fit repair. Next Claude: shared-store merge/stage wiring/G1 re-score and derived-label evidence. **Nick need not open the other app or relay this handoff.** No PR or hosted attempt is requested.
