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

## SESSION HANDOFF — 2026-09-12 · ART KIT V3, FIRST TWO PAINTINGS

Nick resumed from Claude's **completed review**, not the pause checkpoint. Canonical art
statement: [ART_KIT.md](ART_KIT.md), version 3, 35,728 bytes, SHA-256
`2266febc5937b447572358cee6bde66b4a710a87cff1a841e2aabe0c989204a3`.
Never reword its fenced sections. Painted graphics and the local AI engine come first.
Read [CODEX_HANDOFF](audits/CLAUDE_FULL_REVIEW_20260910/CODEX_HANDOFF.md) and
[ART_KIT_INTEGRATION](audits/CLAUDE_FULL_REVIEW_20260910/ART_KIT_INTEGRATION.md).
Nick's September 12 order below overrides older review recommendations.

Verified ownership: OpenAI/Codex, macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`,
`openai/mac`, upstream `origin/openai/mac`. Dirty continuation preserved as signed
checkpoint `77aaeec5bd7c15f5c5b9da772f95ee01c02e055a` (all ten untracked tool files included);
six ZIP files committed verbatim as `bcdf351af9cef3431d916f2c207c0be3949c6ba0`.
Both signatures verified locally. The final adoption batch (two PNGs, exact prompts, decisions and refreshed docs) is STAGED BUT UNCOMMITTED: the configured 1Password signer refused both the initial attempt and one bounded retry with `agent returned an error`. No signer override. Nick must unlock/allow signing, then commit this staged batch before resuming calibration. At import: 15 ahead/0 behind cached origin/openai/mac,
126 ahead/0 behind cached origin/develop. No fetch; .DS_Store left untouched.

**Current stop:** prepare [three decisions](audits/ART_KIT_ADOPTION_20260912/DECISIONS.md)
and show the first `frontier-sheet-01.png` and `frontier-plate-01.png` before any further
calibration. Initial reference prompts use one existing AMBER card and unchanged kit
style. Both images now exist as untouched candidates. Neither is accepted or frozen: the sheet returned 1254×1254 with transparency instead of magenta; the plate returned 1672×941 instead of 2560×1440 and looks too photographic/glowy. Review and exact prompts/hashes are retained in the adoption audit. Root validate passed; engine code is unchanged. Exact prompts and evidence live in
[audits/ART_KIT_ADOPTION_20260912](audits/ART_KIT_ADOPTION_20260912/).

**Program version 3, remaining work in Nick's order:**

1. Obtain feedback on the first two paintings and the Earth line, full star mapping/rows,
   companion clause. Then calibrate the kit's eleven images, accept/freeze/hash.
2. Main deliverable: rebuild `landfall-conditioning.ts` as one interpreter in kit order
   from unchanged game data; repaint six Earth magenta cut-outs and the Earth biome anchor;
   pre-fit offline and hash fitted bytes. Unfreeze steps/seed/size. Per-organism passes,
   plate composite, one low-strength finisher in `stage-worker.mjs`; sessions stay warm
   across landings, VAE encoder built once. Replace OPFS variant storage with in-worker
   expansion. One measured native run, native-size comparison to plate-01 and boxes per
   organism; show Nick the painting.
3. In the engine batch fix only blocking Part K 1–10, 11, 17, 33–35, every fix with a
   negative control. K35's files are tracked, but its missing-file boot control is pending.
   Unit tests must never acquire the checkout lock. Do not resume the checkpoint's
   integrated chain/new pack/`--landfall --variant` attempt or run six-reference sweeps.
4. One probe on Nick's actual target iPhone: maxBufferSize, shader-f16, storage quota,
   memory at transformer load. Device/iOS and connection not yet established. No storage
   or delivery engineering before this result; do not substitute desktop/mobile emulation.
5. Artwork durability: storage.persist/status, iOS add-to-home-screen guidance, PNG export
   via share sheet, protected originals, labelled regeneration after loss.
6. Only after painting acceptance: remaining defects, pack study-assets/WAV pruning,
   stale doc claims and split PR42. Later phone finisher/tier policy, library rollout,
   battle staging, living plates, human audio and view-envelope sharing remain later work.

Engine code and prior failures are unchanged at this first-reference stop. The earlier
600s native aggregate FAIL and species rejection remain evidence. Runtime/test pins and
production v1.8.9 / v2.0 development identity are unchanged. No user-visible release note
is added for unaccepted authoring references.

Startup: official metadata checked September 12; idle Node updated 26.8.1 → 26.8.2 under
shared maintenance lock, no dependency upgrades. Seven capability checks passed; receipt
in adoption audit. Reuse only within this uninterrupted session.

GitHub step **none**. PR42 remains parked, base develop/source openai/mac; no title/body
mutation now (refresh only when split is ready). No push, label, dispatch, merge, release,
deploy, pack build or hosted Actions authorized. Budget doc records UNFROZEN/PUBLIC,
private fallback 3,000; current exact authorized hosted attempts zero. Remote SSH origin
unchanged; no fresh remote authentication/read was needed for these local commits.

Codex: stop with both paintings and local commits/ahead counts for Nick's review; resume
from this program, not PAUSED_CHECKPOINT. Claude Code: no need to open now; these local
commits are not in its checkout. After eventual authorized develop integration, Claude
can fetch/merge origin/develop into its own clean anthropic/mac at its next batch; do not
copy between worktrees. Develop/main/live site unchanged.
