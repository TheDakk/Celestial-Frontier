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

## SESSION HANDOFF — 2026-09-13 · Pack4 / C2 native rest admission

Nick's cumulative work order and contracts are audits/LONG_SESSION_20260913/WORK_ORDER.md
and CONTRACTS.md. Pack4 committed verbatim6b574220; nine file hashes in pack4-receipt.json.
Previous Codex logs preserved verbatim in LOG-CODEX-PRE-PACK3.md and LOG-CODEX-PRE-PACK4.md.
Pack4 supersedes Pack3 decisions; earlier requirements remain unless explicitly superseded.

C1: Art Kit4.3 approved/adopted, frozen style/4E unchanged. Exactly three Wild generation calls
previously completed. All masters immutable. Launch/travel, MID and registration accepted by
Claude; Nick owns final visual acceptance. One authorized targeted impact pass has now run on
second-pass keyed input, radius8, no erosion. Changed9RGB pixels in the lower-right rectangle;
top-right rectangle had0eligible targets after exclusions and is shown unchanged. No protected,
outside-target or alpha change. Travel optional hole touch skipped. No new painting or global
pass. Current candidates,400%crops, review prompt and receipt are in
 audits/WILD_V43_PROOF_20260913/targeted-pass/.
Both anchors point to current derived bytes; original fallback image SHA still binds its
unchanged master, and keyedImageSha256 binds the corrected copy. Registration identical.
Old110/85totals include intentional paint. Receipt splits pink-band candidates versus excluded
sheen/pale/umber and retains Claude's distinct44/31visual estimates. Under40 is not a gate.
No further correction authorized; C1 is not declared visually complete. Review ZIP:
/private/tmp/cf-wild-pack4-targeted-review-20260913.zip (<30MB), prompt inside.

C2 continues independently. CreatureRigV1 at port/v2/apps/game/src/creature-rig.ts implements
CONTRACTS§2 with record joint names, child-bone/parent-pivot transforms, radians and dx/dy in
body-length units, inherited composeAffine, two depth layers, hash/bounds admission and dispose.
No fixed-grid/continuous-mesh/Blender-projection revival. GSAP3.15.0 and pinned packer remain.
Actual Civet now has22authored base parts and10turnaround-derived hidden joint patches in
one32-part2047×951atlas: audits/C2_PARTS_ATLAS_20260913/civet-patched/. v2head mask fixes crest
ownership. Initial masks/atlas and two refused patch fits remain historical evidence. Original
Civet and turnaround bytes unchanged. part-masks/joint-patches/build-authored-parts tools own
intake; parts-rest-runner provides native master comparison with missing-head negative control.
Next: native rest admission, joint motion/ground checks with Claude Motion timings, authored
fox and fresh procedural parts/atlases, Civet–Platypus turn, three ten-second review captures.
Do not call a static atlas a completed C2proof. Missing body-card fields are explicitly listed
in C2_PARTS_ATLAS README; no hand-typed body card or named-Earth genes overriding anatomy.

Procedural material observer fix9ae342da reads actual spec.alien.skin then painted spec/family
coat. Freshly emit the procedural record; historical incorrect fur record stays historical.
Pack4 LOG-A11 lists stable joints for nine more family templates; observers must emit their
own family vocabulary, never quadruped names for another body plan. Current proof is quadruped.
Claude's A1–A11 engines are complete per Nick on anthropic/mac but not integrated here. Do not
copy or edit motion/, effects/, battle2/, soundkit/, worldlife/ or their tests. Runtime contracts
are binding; announce any main.ts hunk. None changed. Existing24full-suite failures listed in
incoming LOG predate this work and belong to C5; no new full-chain admission now.

C3 follows C2: original rights-recorded quadruped archetype, Wild set, battle set, temperate
rain bed and fur impacts; CONTRACTS§1 names/formats (48k24bitmono dry WAV plus Opus, SHA list).
First sound class stops for Nick; derive Civet/fox/procedural from the one archetype with
Claude's sound engine. Do not substitute placeholder quadruped recordings for accepted sources.
C4: library rollout in approved order, twelve at a time, arenas per biome family; every sheet
stops for Nick's eye. C5: prune on openai/mac first, then three promotion tiers (production UI,
painted landfall engine, research tooling as tools) into develop with MERGE COMMITS. No branches.
LFS migration only on Nick's explicit go; none now. No PR Ready before Civet proof/weather pick/
phone-tier decision. Future develop→main release needs separate exact authorization/full chain.

Rain E remains accepted/active. Retain original/raw finisher, queued second weather ladder and
phone-tier evaluation (up to3redistributable~1GBfinishers on Mac, then one phone attempt).
Klein phone probing stopped; no delivery engineering before phone-tier result. These queued
requirements remain; do not silently discard them under C1–C5. Motion/Sound frozen paragraphs
approved; supplied PROPOSED labels remain verbatim, no kit editing without explicit approval.

Ownership: OpenAI/Codex, macOS, /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac
tracks origin/openai/mac. Packet commit6b574220=79ahead upstream/190ahead cacheddevelop,0behind.
Uninterrupted September12toolchain receipt reused; Node26.8.2. No remote refresh needed.
No GitHub write/Actions attempt authorized despite budget file status. PR42 parked. No merge,
release, deployment, new branch or history rewrite. Claude can continue its disjoint work;
Nick need not open the other app for manual synchronization. Commit scoped work before handoff.


### Immediate resume gate — 1Password signing

Pack4 commit6b574220 is the latest signed HEAD (79aheadupstream/190aheadcacheddevelop).
The targeted-impact/Civet-patch batch is staged and passes focused tests/typecheck/rootvalidate,
but signing failed twice with `1Password: agent returned an error`, including the PTY workaround.
Nick has been asked to unlock1Password/approve its signing prompt. Do not use an unsigned commit.
After signing the staged batch, run the bounded native rest comparison once, outside the macOS
sandbox, with a NEW evidence directory:
`node port/v2/tools/quadruped-proof/parts-rest-runner.mjs audits/C2_PARTS_ATLAS_20260913/native-rest-01`.
It requires clean committed source (.DS_Store excepted), checks actual Pixi pixels and a missing-head
negative control, and records source/browser provenance. It has NOT run yet. Then continue C2
from its actual result. No C3 source or staging has been produced; no GitHub write is needed.


Signing unblocked and verified:1b0b5707. Native-rest-01 stopped before browser launch because
Rolldown produced multiple Pixi chunks but the runner specified output.file. Runner now uses
output.dir with named entry/chunks. Failure retained in native-rest-01/report.json. Next native
attempt uses native-rest-02 on the corrected committed runner; no game/asset change.
