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

## ▶▶▶ SESSION HANDOFF — 2026-08-29 · PR #35 PERMANENT CI-PARITY REPAIR · LOCAL CANDIDATE ◀◀◀

### Exact current boundary

- **Scope/owner:** OpenAI/Codex desktop on macOS at
  /Users/nick/Projects/celestial-frontier-openai-mac, branch **openai/mac**, upstream
  **origin/openai/mac**. The implementation campaign changed `port/v2` and current reference
  Markdown; this repair also adds fail-closed selftest wiring to the two guarded workflows. Legacy
  `main.js` / `celestial-frontier.html`, the other-agent worktree and the sibling live-site
  repository remain untouched.
- **Git/PR boundary:** draft PR **#35** already exists from **`openai/mac` → `develop`**. Its pushed
  candidate is head **390e8708086d413fc7d636441ec0523cf9d4b9ea** against base
  **7a9f4c1370dd84292388d718c38ff34214f6203b**. The current repair is a local descendant and has
  not been pushed. Preserve every existing user change.
- **Consumed hosted attempt:** Nick authorized exactly one `test-battery` run for that head/base with
  `actions-budget-approved`, a 92-minute maximum and no retry. Run **33273328362** is terminal-red
  and consumed; the label was removed, later browser stages were skipped, and PR #35 remains
  Draft/unmerged. No replacement run, changed-head push, merge, version bump, preview publication,
  release or deployment is authorized. Actions is **UNFROZEN**, but **zero exact hosted attempts are
  currently authorized**.
- **Glass boundary:** the earlier Glass evidence-chain repair is part of pushed head `390e870…`.
  Bare Glass invocation still fails preflight by design without the immutable Slice predecessor ID.
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

- **Complete v2 suite:** **233 files / 2,333 passed / 1 skipped / 0 failed** on the repaired working
  candidate. The exact clean committed tracked-only rehearsal remains the final local acceptance
  step; this working-tree result is not hosted or browser authority.
- **Consolidated campaign focus:** **19 files / 207 passed**. The final semantic-hardening subset
  separately passed **15 files / 139 tests**; the repaired Arc 9 and Chronicle instruments passed
  their direct negative-controlled sets.
- **TypeScript:** root, game-app and worker configurations all pass `npm run typecheck`.
- **Compendium instrument:** `npm run compendiummem:selftest` passes **222 independent product
  controls**.
- **Current authority:** `node tools/print-producer-authorities.mjs` exits 0; SceneMemory,
  Compendium measurement and Compendium producer all match their budgets. The three authority/
  budget files pass **45/45** focused tests.
- **Exact current identities:** Scene build `30ac9f97753a8b44fdd75ff0299c48ac5b9b9cced3cd465909b1a598e4f08750`,
  Scene budget `158ed95e0936810ef25c0e21d5eceae9d1a73c7111fa087e58a38aa76c1dc308`;
  Compendium measurement `7e9b1e11295ddc5682f9609711422dd3af969a257e3d02cf11848ae8ef6b18b4`,
  producer `053f520c5149e66cbf1ee843c0873a531757b598f5830a7712a728537607890d`,
  budget `5dbb5c80caf63c789fa15fc0acc9e4683613e221a1b1edb413ef980a9d8d2eb4`.
  Numeric ceilings, fixed rulers, historical calibration samples and browser-family policy did not
  change.
- Staged and unstaged diff hygiene is green at this checkpoint.
- **No browser-owning command was run for this moving dirty source.** A fresh clean,
  committed-source immutable browser chain remains post-review work; the historical `3f69e88…`
  certificate is not evidence for these later additions.

### PR #35 permanent CI-parity repair

- **Tracked-input root cause:** five suites read ignored root `main.js`. It existed on Nick's Mac but
  is absent from both the PR head and base, so the ordinary workspace could pass while a clean
  checkout failed. All legacy-source tests now consume one fail-closed, byte-exact extraction of the
  unique inline script in tracked `celestial-frontier.html`; there is no ignored-file fallback,
  trimming or newline normalization.
- **Linux timeout root cause:** two synchronous evidence selftests inherited Vitest's five-second
  case limit while their child processes had no hard kill. The child contract now has an explicit
  15-second hard timeout below a 20-second outer case and distinguishes timeout, spawn failure,
  nonzero exit and missing success marker. A 24-way contention control reproduced the old failure
  band at 5.711–6.066 seconds and passed 24/24 with zero retries/timeouts.
- **Preauthorization prevention:** `node tools/tracked-input-preflight.mjs` runs only from a clean
  committed candidate, exports the exact index into an owned temporary tree, installs there and
  executes the complete hosted browser-free/static command sequence. It rejects forgotten
  source-owned untracked/ignored tests, excludes dependency-owned `node_modules` tests, rechecks
  HEAD and cleanliness before PASS, allows unrelated ambient and run-generated files, and has
  bidirectional fixture/workflow/order/soft-fail controls. Both guarded
  workflows run its selftest immediately after the v2 install.
- **Gate self-diagnosis:** the first exact clean-commit rehearsal stopped before install because the
  ignored-test scan classified seven `node_modules/ismobilejs` dependency tests as source-owned.
  The classifier now excludes only paths with a literal `node_modules` segment; its synthetic
  control carries a dependency-owned test while source-owned ignored and untracked tests remain
  terminal-red. This was a preflight false positive, not a product-suite failure or hosted retry.
- **Previously hidden static blockers:** `artunused` exposed four unused locals/imports before the
  next hosted attempt. The three test-only findings were removed; the one production local was
  reduced to its validation call. An isolated same-path HEAD/current build comparison proved all 29
  non-map runtime files and PWA build ID byte-identical; only `main-R61RQSgI.js.map` changed by 20
  bytes. SceneMemory's exact build provenance was rebound to that full-dist identity without moving
  a numeric ceiling, browser contract, collector or runtime byte.
- Run `33273328362` remains immutable terminal-red evidence. This repair is not a retry and claims
  no hosted green, browser certificate, HUMAN acceptance, merge, release or deployment authority.

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
6. PR #35's hermetic CI repair specifically: verify `test-support/tracked-v1-source.ts` preserves
   exact committed legacy bytes with no ignored fallback; every `bounded-child` caller pins the
   15-second child / 20-second outer contract and cannot pass on timeout, nonzero or missing marker;
   `tracked-input-preflight.mjs` executes the exact ordered hosted-static plan from only the clean
   committed index, rechecks the candidate before PASS and cannot be softened or bypassed in either
   guarded workflow; and the SceneMemory rebind changes only full-dist source-map provenance while
   all 29 runtime files, the PWA build ID, numeric ceilings, browser contract and collector remain
   unchanged.

The review should distinguish a product defect from an instrument defect, preserve historical
evidence verbatim and leave policy/HUMAN items explicitly open. OpenAI/Codex repairs accepted
findings only after that review.

### Paired handoff / Git protocol

- **OpenAI/Codex:** finish the clean tracked-only rehearsal and commit the local PR #35 repair on
  `openai/mac`. Do not push the changed head, label, request a hosted battery, merge, release or
  deploy until Nick authorizes that exact next operation.
- **Anthropic/Claude Code:** Nick does not need to open Claude inside this dirty shared worktree.
  After a safe local commit/handoff is explicitly authorized, Claude works only from an
  `anthropic/*` branch/worktree created from that exact candidate—never by copying files out of this
  worktree.
- **GitHub step now:** none. PR #35 remains Draft at pushed head `390e870…`; its repair is local.
  A later authorization must name the new full head/base, `actions-budget-approved`, 92-minute
  maximum, one attempt/no retry, label removal and merge-on-green decision.
- **Future OpenAI PR, only after exact authorization:** base **develop**, source **openai/mac**.
  Recompute a copy-ready title/description from the post-review fixed scope.
- **Release status:** `develop`, `main` and the live site are unchanged; no production release or
  deployment is in progress.
