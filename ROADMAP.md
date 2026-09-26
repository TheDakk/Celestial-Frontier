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

## CLAUDE SESSION HANDOFF — 2026-09-26 (end of day) · THE GENERATED CREATURE PIPELINE IS THE PRIORITY
Self-contained for a fresh Claude session. Codex's own block follows below; older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md`.

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit that adds this block. Every commit is signed G with the repo keychain key (`git-ssh-sign-cf`), and `origin` is HTTPS via `gh`.
- **Codex:** `openai/mac` last merged at `f01f911e` on Codex's side, and HEAD contains every Codex commit through `6cbeefe0`. Before merging, read Codex's mailbox (`/Users/nick/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) and run `git log HEAD..openai/mac`.
- **Gate** (`node tools/check-profile.mjs --profile=develop` from `port/v2`): **5,579 pass; the ONLY red is I5.** The Guide/release SHA red is fixed by Codex's C28(f) re-measure.
  - The profile stops at the first red, so ALWAYS also run by hand: `npx tsc --noEmit --noUnusedLocals`, the app and worker `tsc`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs` and `npm run overridecontrol`. All are clean.
- **Dev site:** https://dev-celestialfrontier.github.io serves `f1620af4`. Republish with `node tools/deploy-dev.mjs` from `port/v2`, out of the sandbox, on a clean signed head.
- **develop** is still `c1791e21`. PR #43 (`anthropic/mac` → `develop`) is open. No hosted attempt: I5 is red (D5).
- **Branches:** development is Mac-only. The Windows branches and `anthropic/review-batches-1-3-20260905` are deleted; the live docs mark Windows retired. Remote branches are `main`, `develop`, `anthropic/mac`, `openai/mac`, plus three old `openai/*` branches. Two of those are merged; `openai/parked-gameplay-20260904` has 2 unmerged commits (question to Codex, C39).
- **Disk:** about 214 GiB free. Obey the **Disk-space law** in `PARALLEL_GIT_PROTOCOL.md` (it's imperative).

**The priority: the Generated Creature Pipeline** (Nick D22 hybrid generation, D23 pipeline first; `audits/GENERATION_PIPELINE_20260926/PROGRAM.md`)

Nick's vision is that every creature shows its OWN AI-generated painting. Today we have a bridge: 38 archetypes painted by hand-driven AI, and every other creature drawn as the nearest archetype morphed by its genes. The painting-to-rig step (`authoring.json`) is hand-authored by Codex.

| Stage | Owner | State |
|---|---|---|
| G1 auto-author: painting + family → `authoring.json` → Codex's UNCHANGED `intake-authored.mjs` | Claude | **v2 merged: 12/40** admitted + static with zero hand edits. The gate is ≥ 30/40; the hand ceiling on this gate is 30/40. Code: `port/v2/tools/anatomy-verify/auto-author.mjs`; results: `audits/G1_AUTO_AUTHOR_20260926/README.md`. |
| G1 v3: independent limb counter | Claude | **AN AGENT WAS STILL RUNNING at session end**: branch `claude/t1-limb-counter`, worktree `/Users/nick/Projects/Celestial-Frontier/.claude/worktrees/agent-acdb54fa1a91d260e`, latest commit `99b0c771` ("G1 v3: an independent visible-appendage counter …"). **First task of the next session:** see below. |
| G2 library at scale (every Earth fauna + alien variants per family; derived masks) | Codex | Assigned (C35–C38). Pilot: ~20 same-family quadrupeds, plus 3–5 each for radial, serpent, insect and bird. These packets are also G1's missing references. |
| G3 on-demand art delivery | Claude | **Merged + live.** 14 core archetypes in the pack, 24 fetched from a pinned library (manifest pin in bundle and worker, per-file SHA before decode, 128 MiB LRU worker cache, offline reuse). Pack 91.3 → 60.7 MiB. `audits/G3_ART_DELIVERY_20260926/README.md`. **Not browser-smoked:** Compendium cards loading library art, and the offline card fallback. |
| G4 selection (exact species → nearest library variant → stand-in; one card/stage resolver) | Claude | Next, after G1 moves |
| G5 finisher in the game (desktop per individual; phones get delivered finished originals) | Claude routes, Codex engine | After G3 (done) and Codex's finished-original format |

**Everything else built this session is merged and on the dev site** (details in the item list below, -110…-114):
- §20 combat: Auto/Command parties for Guardians/Titans, Break UI, defeat = Recovery, friendly duels + CFB export, and the D17 phase change on EVERY Guardian/Titan fight, solo Auto included.
- 38 painted archetypes with READY spacing, box-to-box travel and motion-envelope band fit; battle2 is the development DEFAULT (`BATTLE2_DEFAULT`, `?battle2=0`).
- D13 companion care, bond and missions (placeholder `MISSION_RATES_V1`); D14 Outposts (placeholder `PROJECT_COSTS_V1`).
- D16 parity complete (Compendium chips, shelves, origin travel, reveal queue, vista + postcard, craft ×5, pin, salvage-all, Prime travel, reset, pop-ups, tooltips, D18 fold option).
- A5 outcome tests.
- Audio Stages 0–3 (original seeded sources, loudness gate, one voice per creature, soundscape).
- `?deviceProbe=1` (codec/perf/heat/memory), `?audioReview=1` (L1 Listening), and A6 localization (Settings).

**Parked by D23 until G1 passes:** audio Stage 4 (Tame/Feed/Compendium on the new voices, star hums, captions), the mission-return voice, the Kindred mission-type picker, the S4 re-tune (Codex: feasibility map first, C37), the placeholder numbers, the pack diet and I5.

**Next, in order (Claude)**
1. **Finish the running T1 agent's work:**
   - If the worktree above still exists, read `audits/G1_AUTO_AUTHOR_20260926/README.md` (a v3 section, if it wrote one) and `git log claude/t1-limb-counter`.
   - Merge the branch (`--no-ff`, signed) ONLY if the full gate stays I5-only.
   - Then remove the worktree: `git worktree remove --force --force <path>` and `git worktree prune`.
   - If the agent stopped mid-way, continue G1 v3 from its last commit. Targets: erase/dup refusals ≥ 90% with no loss in wrong-family/flip refusals; admitted + static above 12/40.
2. **Merge Codex's G2 pilot packets** as they arrive, and re-score G1 on them; they are the missing same-family references. Push G1 toward ≥ 30/40.
3. **G4 selection,** then **G5 finisher routing.**
4. **Browser-smoke G3's card path:** Compendium library art, and the offline fallback.
5. **After G1 passes:** the parked items above. Polish and QA come after Nick's playtest (D21).

**Nick (none blocking):** the playtest checklist (`?deviceProbe=1`, `?audioReview=1`, a full journey, `?battle2=1&vs=…` pairs), then paste the Copy results. Also whether `openai/parked-gameplay-20260904` may be deleted (Codex answers C39 first).

**Traps (obey them)**
- **Disk-space law:** `df -h /System/Volumes/Data` at batch start and end; stay ≥ 40 GiB free. At most 4 live agent worktrees. Remove each one as soon as it merges with `--force --force` (they are LOCKED; a single `--force` silently fails). Never park large stashes. Keep only the newest 2 preview packages.
- **Agent worktrees are cut from `develop` and pre-populated.** Switch to a branch at the lane head first, and give `port/v2/node_modules` a copy-on-write copy (`cp -cR`), never a symlink.
- **Merges:** after resolving, run `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing. Committed conflict markers happened once (859b9bfe, fixed forward in e85318b3). Never `git add -A` straight after a conflicted merge.
- **Slice-executing tests** (A5, D16, arc6, Command, missions, Outposts) run exact `main.ts` regions inside `with(env)`. New code inside a slice needs its real function added to that test's env, or the slice must end at its own block.
- **`tools/run-unit-tests.mjs` builds the PWA pack first.** Over 128 MiB, every test dies with `RangeError`. For quick diagnostics, run `node node_modules/vitest/vitest.mjs run <file>` directly.
- **Codex's sealed inventories** (release/Guide bullets, budgets, pins) are never rebound by Claude. Propose bullets in an audit README; Codex re-measures.
- **Rig loads now take seconds** (layered reach, cached by complete input). Tests that load rigs need explicit timeouts.
- **The lone agent-harness checkout** at `/Users/nick/Projects/Celestial-Frontier` is Nick's original clone (`develop`). Don't edit it.

## Current sprint handoff — 2026-09-26, C28(f) first

Own lane is `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`. Claude’s lane is absolute-path read-only. Repo keychain signing only, every commit G. Read its mailbox at run start/batch end and reply in this lane’s TO_CLAUDE.md. No Nick relay. Explicit authority covers signed no-ff integration of anthropic/mac and measured own-branch pushes below2GB; no PR, label, hosted, develop/main merge, release or deploy.

C28(f)/C17/D19 is implemented in `audits/C28_GUIDE_REMEASURE_20260926/README.md`: integrated signed832dc18b (C32 production phase dispatch plus care/A5);106 measured ordered release bullets; five read-only Advanced Briefings; current care/bond/Recovery/duel/Harvest/Settings copy and mutation controls. Edge390×844/1440×900 native tours PASS; old keyboard-driver refusal retained. The packet owns exact tests, hashes and delivery state. I5 v1 samples untouched; no certificate consumed. Node26.10.0 is the current verified idle-maintenance version.

Candidate03 is REJECTED, never wired. Its sole held-out run on63e61b5f failed normal9.765625pp and Titan25.390625pp; original runtime constants were restored in3c01a70f. `audits/S4_D17_TUNING_20260926/README.md` retains that history. C32 now fixes the production solo-Auto phase bypass; old claims that Claude still owes it are superseded.

## Remaining order (Nick’s latest request)

### What Claude owes next
-114. **The vision batch (D21, 2026-09-26): live on the dev URL `0b4c8dca`.**
- **Merged:** the H1 probe (perf/heat/memory) + A6 localization; battle2 as the development DEFAULT (`BATTLE2_DEFAULT`, `?battle2=0` opts out); D13 missions; D16 final (Compendium chips/shelves, origin travel, reveal queue, vista mode + postcard); D14 Outposts; audio Stages 1–3 (original seeded sources, 0 audio bytes shipped).
- **Placeholders for Codex:** `MISSION_RATES_V1` and `PROJECT_COSTS_V1`.
- **Gate:** 5,555 pass. Reds: I5 and Codex's release SHA.
- **Still running on Claude's side:** audio Stage 4 (Tame/Feed/Compendium on the new voices, star hums, captions), the mission-return voice, and the Kindred mission-type picker.
- **Not yet smoked in a browser:** a Guardian fight on the new no-flag default. The wiring tests cover the gate in both directions.
- **After Nick's playtest:** polish and QA.
-113. **Claude's side complete (2026-09-26).**
- **D15:** the `?deviceProbe=1` codec check and the `?audioReview=1` L1 Listening page.
- **Care XP** mirrors onto the Compendium row.
- **A5:** the Feed and Rare Find capture ledgers, and #57 Titan through the card. The Titan test found and fixed a real bug: every Guardian/Titan WIN reloaded, because of a galaxy-flag shape mismatch.
- **Gate:** 5,464 pass. Reds: I5 and Codex's release SHA.
- **Waiting on others:**
  - Nick: the iPhone codec check and L1 listening (paste the Copy results).
  - Codex: C27–C31 (release re-measure, S4 balance, missions rates, phone reds, new films, pack diet, I5).
  - Outposts are held by Nick until combat and art settle.
-112. **Night 2 (2026-09-25/26).**
- Merged Codex's C22–C25 and S4 work (`bbd24a75`). Codex's pinned loader is in; the wiring was reconciled by hand.
- **Forecast memo fixed:** it keys the complete combat identity.
- **Masters out of the pack:** the arena went from 67.8 to 48.2 MiB. The six budget-held creatures and the Gull are back, the Gull via the one CARD = STAGE tint table (`morph/card-tint.generated.ts`).
- **Air and water bodies** are fitted to their band on the motion envelope.
- **Five more C25 passes wired** (Racer, Eel, Salamander, Rat, Reef Shark): 38 archetypes, arena 59.8 MiB.
- **The Lizard faint refuses only with observed supports.** The game uses rest supports, which give 0 refusals; mailbox C28(e).
- **Merged three isolated agent branches:**
  - D15 audio Stage 0: the loudness gate, one voice card per creature, and the 12 MiB audio section.
  - D13 care + bond stage 1: taste Feed, Rest on the active-play clock, bond levels 0–5, and the Care & bond panel.
  - A5 #11/#92/#81-Land/#73, the CFB export, and the D18 fold option (default unchanged).
- **Gate:** 5,440 pass. Reds: I5 and Codex's release-SHA pin. Every later step is clean.
- **Next for Claude:**
  - Care XP also updates the Compendium row's `g.xp` (my call, for parity with duels).
  - The D15 iPhone codec probe and the `?audioReview=1` Listening page.
  - A5 #57 (Titan) and the capture/Feed ledger tests.
  - Then N4 Outposts once Codex's P0 cost table lands. Wire new candidates as Codex films them on this branch.
- Codex's queue is in mailbox C27–C30.
-111. **C15 wired + stage spacing + four merged lanes (2026-09-25 night).** See this block's summary and `audits/C15_WIRING_20260925/`. Nine creatures wired; seven held with reasons. READY_GAP 0.10, box-to-box run-up to contact, layered reach cached. §20 Command/duels/phase, D16 ×7, A5 ×8 and C13 pins merged. 5,373 pass; only I5 is red (plus the hidden root tsc, which is Codex's).
-110. **§20 Auto Guardian parties live end to end:**
- the engine (S1, parity-locked);
- the party planner (one receipt);
- the Recovery helpers for both carriers, plus the persistence routing and verification;
- the card (stance, two Guardian party slots, "Your plan" forecast), with the plan state in Main;
- the Chronicle prelude.
1. C28(f) DONE and pushed as6cbeefe0(G),120,567,446-byte pack. Delivery receipt in S4 production epoch packet.
2. Fresh S4 epoch: declare untouched evaluation corpus and cohorts BEFORE tuning, use actual production dispatch, candidate03 remains rejected. Normal10–20pp; Titan≤20pp; declared Guardian band; playable Command≥5pp without near-total defeats; solo Auto±5pp v1. No repeated held-out evaluation.
3. C30/C31 audio-section inventory; new Settings/Glass capacity; dev audioReview versus packaged Listening split decision.
4. Decide quadruped observed/rest supports; if observed, fix Lizard final faint (foreFarPaw96°). Rest passes on Claude’s source.
5. D13 stage2a mission rates/≤15% economy instrument, then duplicate/two-tab/reload/clock controls; `rest:` reserved.
6. Sparrow/Honeybee/Cattle phone reds, Bear sixth mask, Herring alpha. Then lossless atlas/binding diet with new honest pins and per-archetype saved bytes.
7. D1 painting Hare onward/third-ten sheet; actual Claude films for Grouse/Sandpiper/Wild Horse plus repaired Herring/Honeybee; tailed-primate and closed-shell-beetle capabilities.
8. D14 P0 costs/scenarios only; no Outposts build.
9. C8/I5 one integrated clean-source v2 epoch, three calibration runs plus one certificate, v1 untouched and growth guard unchanged.

Claude consumes signed packets from the shared object store and owns cards/stage/wiring/picker/republishing. Codex owns art/rig/instruments/rates. Nick need not open another app to relay. Sole standing I5 red does not authorize hosted work or battle2 default; D21 lifts the device wait for development; the certificate still gates production.

Current state: **STOPPED at the S4 measurement gate**, not a user-requested pause.
Candidate13 was frozen on signed59b09881(G), then its ONE held-out attempt exited1 with
ENOSPC while writing Titan evidence. The retained prefix already refuses normal planning
8.69140625pp (<10) and solo Guardian−5.56640625pp (outside±5). No complete certificate;
90m/100m is consumed and MUST NOT be retried/reused.13 and03 are rejected/not admitted.
Read `audits/S4_PRODUCTION_EPOCH_20260926/README.md` and `evaluation13-refusal.json`.

Runtime encounter.ts restored byte-for-byte to c17906b2; Recovery never changed.39 new
instrument controls pass; actual duration/wound mutations refused710/710 and199/710.
Freeze battery:504 Node-tool and5471 Vitest passes; only standingI5 producer mismatch.
All seven manual owners and root validation pass. Restoration checks are in the same packet.

Next Codex: report the refusal and await a newly authorized independent epoch; no tuning
against consumed seeds. Disk capacity must be resolved before new bulky measurements.
Remaining ordered work above is pending, including latest observed signed Claude7964bb0b integration,
missions/Outposts numbers and finalI5. C34 arrived at batch end: vision batch dev0b4c8dca,
additional Guide/release bullets and inventory pins, phone audio CPU (~37ms desktop slices),
and finalI5 on the newly integrated Compendium head. C33/D21 lifts device waiting for DEVELOPMENT battle2;
production remains gated. Next Claude: consume the restoration/evidence checkpoint from the
shared store, NEVER wire the intermediate59b09881 candidate or candidate03; keep its new
vision work separate until integration. No Nick relay or other-app opening needed.
Remote last verified6cbeefe0; no GitHub write/hosted/PR/release/deploy in this resume.
