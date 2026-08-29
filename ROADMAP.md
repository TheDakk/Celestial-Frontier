# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## ▶▶▶ SESSION HANDOFF — 2026-08-29 · LOCAL V2 ROADMAP CAMPAIGN COMPLETE · CLAUDE FABLE REVIEW CANDIDATE ◀◀◀

### Exact current boundary

- **Scope/owner:** OpenAI/Codex desktop on macOS at
  /Users/nick/Projects/celestial-frontier-openai-mac, branch **openai/mac**, upstream
  **origin/openai/mac**. The implementation campaign changed only `port/v2` and current reference
  Markdown; legacy `main.js` / `celestial-frontier.html`, the other-agent worktree and the sibling
  live-site repository remain untouched.
- **Git state:** committed HEAD **7108e22a0c99b6cf01085e5fec3cf2e1c7657c9d**; branch remains
  **116 commits ahead** of `origin/openai/mac`. The worktree is intentionally dirty and shared.
  Preserve every existing user change.
- **Separately staged Glass repair:** the staged preview/Glass evidence-chain repair remains intact.
  `port/v2/tools/glassmatrix.mjs` is staged-and-unstaged (MM). Never reset, discard or casually
  restage it. Bare Glass invocation fails preflight by design without the immutable Slice
  predecessor ID.
- **Integration boundary:** Nick authorized a local commit, push of `openai/mac` and a draft PR toward
  `develop` on 2026-08-29. No exact `actions-budget-approved` battery attempt, PR merge, production
  version bump, preview publication, release, deployment or legacy-game edit is authorized. Actions
  is **UNFROZEN**, but **zero exact hosted attempts are authorized**.
- **Naming:** **Pureforged** is the approved current v2 player-facing name for fully exceptional
  supported fixed crafts. Exceptional remains the material grade; stable internal
  `exceptional-v1` identifiers, receipts and save identity remain unchanged. Frozen v1.8.9
  “Exceptionally Forged” history remains byte-identical.
- **Historical browser certificate:** signed source
  **3f69e88ea8e34fdb8d9913276601b426ada783ae** owns the completed once-only
  Layout → SceneMemory → Compendium → Slice → Glass → Recovery chain: Layout 787/787,
  SceneMemory 44/44, Compendium 78/78, zero-finding Slice, all 12 Glass viewports and the real
  20-minute Recovery observation. This later dirty local candidate does not inherit or relabel it.
- Edge/Chrome/Chromium point versions are provenance only. A compatible browser update never
  requires rebaseline, recalibration or threshold movement.

### Completed dependency-ready local campaign

“Complete” here means every dependency-ready item selected for this local campaign is implemented,
documented and browser-free green. It does not pretend that absent canonical product tables, HUMAN
judgment, physical-device evidence, a fresh immutable browser certificate, whole Gates A–I or a
production release are complete.

- **Universe-wide visual language:** deterministic finishing spans galaxies, systems, planets, all
  43 canonical biomes, fauna, flora, fungi, microbes, ships and bounded effects without changing
  seeds, anatomy, silhouettes, proportions, topology, share identity or interaction geometry.
- **Durable action foundation:** Landing, world Rename, Atlas, Mine, fixed Fabrication, capture,
  Feed, Breed, companion Rename, Field Scout, combat, identity/share/travel/progression, Starter
  Charter, Binder and Frontier-ending writes use their owning receipt/CAS fixed point. Runtime,
  revision, checkpoint and canonical-state proof precede publication; stale, forged, Training-held,
  ambiguous and postcommit-failure paths refuse, roll back or converge read-only without retry or
  optimism.
- **Exploration/economy:** exact-instance Inventory, finite Mine/Skim, Deep Scanners, the connected
  fixed recipes, Pureforged exact-item modifiers, source-proven Search/Survey/Travel/Atlas routes,
  Arc 4 Tame/Scavenge/Sample and first-find rewards are player-live.
- **Companions:** Feed, Breed, Rename and Field Scout preserve exact individual identity and the
  existing creature/genome work. Breed preserves both parents, draws once after successor
  certification, creates one deterministic child only on success, grants that child +2 XP and the
  first canonical unordered species pair +5, supports v1 pair-alias evidence, and keeps exact
  active-play Recovery/overflow/archive authority.
- **Combat/Guardians/Prime:** explorer or eligible living owned fauna/Guardian/Titan champions use
  the deterministic forecast, transcript and one settlement. Conquest, XP, Stardust, injury/loss,
  acquisition, Prime claims, Starter Conquest and progression share the verified fixed point.
  Prime Codex exposes all nine Signature rows; its ninth distinct claim opens five established
  Frontier endings, including the exact Balance predicate and one-choice/unknown-import protection.
- **Presentation/audio:** the timed accessible Combat Chronicle, native HP meters, statistics,
  silent Skip and plain-text Share are live. Exact transcript-owned impact/critical/ability cues use
  the bounded master-Sound combat bus. Tame greeting, Feed acknowledgement, owned-fauna Listen and
  generic no-spoiler biosphere Listen remain explicit, no-autoplay and presentation-only.
- **Progression/records:** the ten-rank ladder, 96 achievements, 68 aggregate rows and 23 true event
  owners are live. Achievement/rank ceremonies occur only after exact committed publication and
  remain silent during boot, replay, Training, convergence and refusal. Settings supports earned
  nameplates and identity-only Explorer rename; valid Share/Follow, Survey, Travel and Atlas
  Favorite own their exact joins.
- **Starter Charters/Binder:** the board owns both progressive Starter chains, next-link reveal,
  explicit Accept and a three-active cap. Landing, Mine, eligible fixed Fabrication, Field Scout and
  verified Conquest settle their authored 10–25 Stardust, supported Gear, achievement and rank
  outcomes atomically. Binder owns six legacy pages and seven non-Paragon 25–150-Stardust claims;
  the Fifty Paragons and imported evidence remain protected.
- **PWA/install boundary:** exact-build inventory/digest, completion-marker-last install,
  current-plus-one-prior retention, per-document pinning and explicit Check/Activate/Reload/Roll
  back controls are locally implemented; physical install/update/rollback remains a later device
  review.
- **Guide/release truth:** the mature Guide remains 41 visible topics, now **34 partial / 7
  unavailable**. **A New Foundation** remains a cumulative **73-bullet**, explicitly unreleased v2
  development bulletin. No current production v2 version or update-popup authority exists.

### Final browser-free evidence

- **Complete v2 suite:** **230 files / 2,315 passed / 1 skipped / 0 failed**.
- **Consolidated campaign focus:** **19 files / 207 passed**. The final semantic-hardening subset
  separately passed **15 files / 139 tests**; the repaired Arc 9 and Chronicle instruments passed
  their direct negative-controlled sets.
- **TypeScript:** root, game-app and worker configurations all pass `npm run typecheck`.
- **Compendium instrument:** `npm run compendiummem:selftest` passes **222 independent product
  controls**.
- **Current authority:** `node tools/print-producer-authorities.mjs` exits 0; SceneMemory,
  Compendium measurement and Compendium producer all match their budgets. The three authority/
  budget files pass **45/45** focused tests.
- **Exact current identities:** Scene build `e556d4223a320511cf48302b3d399d369c74187138f80e44f6af7ed029c588bf`,
  Scene budget `11a2ab04abfa3d9300a55c51a69a781c23ebdf4346b33cde3cabc5623fae9bfc`;
  Compendium measurement `7e9b1e11295ddc5682f9609711422dd3af969a257e3d02cf11848ae8ef6b18b4`,
  producer `053f520c5149e66cbf1ee843c0873a531757b598f5830a7712a728537607890d`,
  budget `5dbb5c80caf63c789fa15fc0acc9e4683613e221a1b1edb413ef980a9d8d2eb4`.
  Numeric ceilings, fixed rulers, historical calibration samples and browser-family policy did not
  change.
- Staged and unstaged diff hygiene is green at this checkpoint.
- **No browser-owning command was run for this moving dirty source.** A fresh clean,
  committed-source immutable browser chain remains post-review work; the historical `3f69e88…`
  certificate is not evidence for these later additions.

### Protected/deferred scope — do not invent

- **Charters/progression:** Discover life, accepted bioscan and weekly wall-week/slate/acceptance/
  rollover authority remain protected. Exactly `daily`, `decade`, `survivor`, `fieldmedic` and
  `gambler` lack true event owners. Achievement reward claims and Fifty Paragons remain unported.
- **Companions/combat:** canonical mission catalogues, care/taste/bond/healing, friendly-duel
  progression, party/retreat and broader Chronicle/Museum history still lack complete approved
  product rules. Preserve the existing creature/genome/ownership structures.
- **Loot/Guardians:** D-ARC6-AFFIX-1 still needs the explicit 40% conquest-imbue coexistence policy.
  D-ARC6-GUARDIAN-REWARD-1 still lacks an authored extra Guardian Gear/material table; do not infer
  either from adjacent systems.
- **Production media/depth:** recorded assets, authored continuous ambience/music, Guardian motifs,
  remaining non-impact combat cues, projects/outposts and later Ascent/Legacy consequences remain
  separately authored work.
- **Polish/evidence:** first-interaction optimization, fresh exact-source Slice/Glass/Recovery,
  real-veteran-save import, screen-reader/device install and phone/tablet frame/heat/battery/true-GPU
  checks remain review/evidence work. HUMAN first-journey, attachment, strategic-combat,
  visual/listening and accessibility judgment cannot be closed by unit tests.

### Claude Fable polish-review package

Review only **`port/v2` plus the current root/reference Markdown diff**. Do not modify legacy v1,
recreate established systems, change deterministic identities, alter save meanings, weaken tests,
move calibrated ceilings, or invent any protected table above. First inspect source and current
references together, then report precise findings with severity, file/line evidence, affected
invariant and the smallest safe correction. Review these axes:

1. gameplay loop clarity, retention pacing and honest No Man’s Sky / Diablo / Path of Exile /
   Pokémon / Minecraft / Satisfactory-inspired depth without manipulative pressure;
2. transaction authority, exact-once rewards, CAS/rollback/convergence, save compatibility and
   deterministic identity;
3. creature/genome/ownership preservation, combat/Guardian/Prime/Charter/Binder progression and
   canonical rule fidelity;
4. UI/accessibility/mobile-first presentation, universe-wide visual cohesion and audio lifecycle;
5. performance, dead/unreachable code, duplicate owners, package boundaries, tests/instruments and
   Markdown/source agreement.

The review should distinguish a product defect from an instrument defect, preserve historical
evidence verbatim and leave policy/HUMAN items explicitly open. OpenAI/Codex repairs accepted
findings only after that review.

### Paired handoff / Git protocol

- **OpenAI/Codex:** commit the complete candidate, including the separately staged Glass repair, push
  only `openai/mac` and create/update its draft PR to `develop`. Do not label, request a hosted
  battery, merge, release or deploy until Nick authorizes the exact next operation.
- **Anthropic/Claude Code:** Nick does not need to open Claude inside this dirty shared worktree.
  After a safe local commit/handoff is explicitly authorized, Claude works only from an
  `anthropic/*` branch/worktree created from that exact candidate—never by copying files out of this
  worktree.
- **GitHub step now:** push the completed `openai/mac` head and create/update a **draft** PR to
  `develop`. No Actions label/dispatch/rerun, merge, release, deploy, publish or version bump.
- **Future OpenAI PR, only after exact authorization:** base **develop**, source **openai/mac**.
  Recompute a copy-ready title/description from the post-review fixed scope.
- **Release status:** `develop`, `main` and the live site are unchanged; no production release or
  deployment is in progress.
