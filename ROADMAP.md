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

## SESSION HANDOFF — September 17 · verified batch staged; signing blocked

HEAD is still 0426ef4d on openai/mac: 126 ahead of cached origin/openai/mac and 237 ahead of
cached origin/develop. The prepared flora and fauna work is staged. Both signing attempts
failed with `error: 1Password: agent returned an error` (exit 128). Nick was asked to unlock
1Password and approve signing. Restore the configured signer and commit this verified batch;
do not discard it, restart from HEAD, change signers or use an unsigned fallback.
No GitHub writes, branches, merge, release, deployment, history rewrite or LFS migration.
PR42 remains parked; Nick’s explicit no-hosted-writes instruction controls.

Start audits/ANATOMY_COMPLETION_20260917/README.md, ANATOMY_STATUS.md, coverage-final.json and
implementation-summary.json. Signing evidence is in signing-blocker.json. Consolidated review
is audits/ANATOMY_COMPLETION_20260917/CLAUDE_REVIEW_REPORT.md, with the copy-ready
CLAUDE_REVIEW_PROMPT.md and hashed CLAUDE_REVIEW_INPUTS.json beside it. Nick requested the full
review on September 17; it includes the accumulated C1–C5 work since the incorporated band review
and the staged continuation. The original FAUNA_FULL_PASS NEW_SESSION_PROMPT gives the
implementation scope; this handoff supersedes its older counts.

All eleven accepted master hashes have binding artifacts. Persimmon, Cranberry and Devil’s
Club now have actual 8/7/8 branch groups, bark/foliage ownership and fixed-root motion. They
remain visually unqualified: native captures exposed cut tears, leaf distortion and CPU
failures. Cranberry’s boundary repair closes cuts but does not solve shape or performance.
Original accepted master bytes are unchanged. Preserve all failed evidence.

Five actual crab owners now have 26-part, 44-joint source-stage fits. crab-masks-05 proves
ordinary pixel parity and exact fresh-prefix RGBA; 03/04 are earlier successful mask snapshots,
01/02 retain readback failures. crab-fits-02 and the five *-native-02 folders are current-input
motion diagnostics: 12 actions × 121 samples, 601 presentation samples, exact rest, 60 fps and
1.0–1.5 ms rig-update p95. Shared pinch uses the painted gape and preserves all eight walking
contacts. Original and mirrored source-graph outcome tests pass. These are desktop diagnostics,
not visual, walking-stance, hidden-surface, habitat or phone acceptance. Some retained stills
omit text annotations; filenames retain their action identity.

Additional observations preserve seven-pair isopods, four-pair tardigrades with variable painted
folds, four-barrel Salp, single-tube Pyrosome, two-body/four-siphon Sea Squirt and top-view
Horseshoe Crab with hidden walking legs. Of the 58 target species, 12 are observed, five have
bindings and none is newly visually qualified. The other 53 still lack bindings. Continue the
entire remaining roster after saving this batch, not another representative sample.

Native census 01 covers 1,010 Earth entries plus 240 procedural samples: 1,237 nonblank/parity
passes, 13 explicit legacy fallthroughs and 53 topology emissions. The quadruped observer is
separate. This finite census does not exhaust seed space or prove universal animation.
Final checks: 179 regression tests in 29 files, 209 Node tool tests, all three TypeScript
projects, root validation with 1,010 renders and 50 matching determinism probes. Raw logs keep
their original whitespace; source/document diff checks exclude those unchanged log bytes.
The prior full-suite stale Compendium producer certificate remains open; do not repin it.

No version, save, seed, main.ts or reserved effects/battle2/soundkit/worldlife change. Kits
unchanged; retain first-new-class media review and twelve-new-artwork-per-sheet gates.
The uninterrupted September 17 startup receipt is reusable: gh 2.101.0, Blender 5.2.2 and
Homebrew 7.0.3; seven capability checks pass. Updated Blender remains render-unqualified and
unused. Run its bounded synthetic render before any future Blender job.

C1 final Wild approval remains Nick’s. C3 source coverage remains 203/631 with 428 missing;
1,617 WAV/Opus pairs, 43 biomes, 484 rendered routes plus two silences. Rain E is active;
second-weather and phone-finisher decisions remain open. Prior C2/C3 review stays consolidated.
C5 promotion and LFS still require their exact gates.

OpenAI/Codex: restore signing, commit and independently verify this staged batch, then continue
source-owned masks/graphs/actions across the remaining targets and repair flora shape/CPU.
Claude: open now for Nick’s requested consolidated read-only review of this Codex worktree.
Do not pull, merge, copy source into the other lane or assume HEAD includes the staged work.
No PR is needed at this checkpoint. Report actual local commit/ahead state; infer no remote state.
