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

## CLAUDE SESSION HANDOFF — 2026-09-26 (session 2) · THE GENERATED CREATURE PIPELINE IS THE PRIORITY
Self-contained for a fresh Claude session. Codex's own block follows below. Older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md`.

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit that adds this block. Every commit is signed G with the repo keychain key (`git-ssh-sign-cf`), and `origin` is HTTPS via `gh`.
- **Codex:** merged through `bd5530d7` (its G2 quadruped pilot). Before merging again, read `/Users/nick/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md` (read-only) and run `git log HEAD..openai/mac`. Codex's current focus, per Nick: finish the preserved parked gameplay (Forge Training, the living-portrait decision) BEFORE its G5 engine work.
- **Gate:** `node tools/check-profile.mjs --profile=develop` (from `port/v2`) gives **5,586 pass; the ONLY red is I5** (`current-producer-authorities`, "binds every live memory budget").
  - Run it on a QUIET tree. A commit during the run produces a spurious "Source changed during authority read".
  - Also run by hand, all clean this session: `npm run typecheck` (root, app and worker), `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** https://dev-celestialfrontier.github.io serves `77623d3f` (G4 is live). Evidence is in `audits/DEV_PUBLISH/77623d3fdd26`.
- **develop** is still `c1791e21`. PR #43 is open. No hosted attempt: I5 is red (D5).
- **Disk:** about 230 GiB free. No agent worktrees are live, and the limb-counter branch is merged (it had no worktree). The newest 2 preview packages are kept.

**The priority: the Generated Creature Pipeline** (`audits/GENERATION_PIPELINE_20260926/PROGRAM.md`, Nick D22/D23)

| Stage | Owner | State now |
|---|---|---|
| **G1 auto-author** | Claude | **v5 adopted, gate NOT met.** Corpus **12/40**. Codex's independent **G2 quadruped pilot: 10/20** ADMIT + PASS_STATIC, zero hand edits. Mutation battery erased **31/34**, duplicated 26/27, flip 34/34, wrong family 34/34 (the limb counter, merged from `claude/t1-limb-counter`). All five of Codex's blocking review findings are fixed. Rejected with numbers: reference shopping (D25) and thin-part nudging. `audits/G1_AUTO_AUTHOR_20260926/README.md` "Session 2". |
| G2 library at scale | Codex | Pilot delivered (20 quadrupeds + 120 derived-mask candidates, `audits/G2_QUADRUPED_PILOT_20260926`). Next families are Codex's. |
| **G3 on-demand delivery** | Claude | Live. **Card path now browser-smoked PASS** (online library cards, offline core fallback, negative control): `audits/G3_ART_DELIVERY_20260926/card-smoke/`. |
| **G4 selection** | Claude | **Landed and live.** `paintedArtV2`, one resolver for card and stage: exact → same Earth profile group → nearest same-anatomy visual-gene variant → v1 stand-in. Sturgeon and Reef Shark now draw sturgeon- and shark-shaped procedural fish. 7 tests with controls. `audits/G4_SELECTION_20260926/README.md`. |
| G5 finisher in the game | Claude routes, Codex engine | **Blocked on a seam (mailbox C40(c)).** Codex's finisher takes an ARCHETYPE master. Per-individual finishing needs Claude's master-space morph plus Codex's finished-master → rig-atlas format under finish-conservation. |

**Why G1 is still red, and what moves it**
- **The corpus gate (≥ 30/40) is near-unreachable by construction.** 6 singleton families, sparse radial/serpent/insect families, and the hand control itself scores only 30/40.
  - **D24 (Nick):** measure G1 on the independent G2 pilots instead (recommended gate: ≥ 75 % per family with ≥ 2 references, battery ≥ 90 %).
- **G2 refusals are dominated by short tails** (Lynx, Brown Bear, Bison, Camel, Wild Boar: the reference tail chain has no paint). Presence never declares an absence, so these refuse. Levers:
  1. G2 prompts that paint the true tail;
  2. independently accepted short-tailed references;
  3. a measured-truncation presence contract (asked of Codex, C40(a)).
- **Admitted packets refused by Codex's stages:** bird ARAP folds (Eagle, Sparrow, Sandpiper), the Grouse surface split, Mongoose/Tapir RED. Asked in C40(b).
- **Thin parts:** ear tips and fins land beside their paint (Marmot, River Otter, Ibex, Heron, Herring). Loosening them exposes erased far-hind legs that no current check sees. The real fix is a far-limb detector (the next Claude lever).

**Next, in order (Claude)**
1. Read Codex's answers to C40 (a)–(d); merge its signed commits. Re-score G1 on any new G2 families as they land (`run-auto.mjs --targets=<pilot.json>`).
2. **G1:** build a far-limb detector, so thin-part placement can relax without leaking erased far legs. Target: the corpus above 12 AND G2 above 10/20, with the battery ≥ 90 % and no flip/wrong-family loss.
3. **G5:** once Codex confirms the finished-original format, build the master-space morph (the individual's own master) and the router. Desktop: enqueue on the landfall job queue and retain in `creature-originals`. Phones: delivered finished originals via `deliverCreaturePngV1`.
4. Only after G1 passes (or D24 redefines it): the parked items (audio Stage 4, the mission-return voice, the Kindred picker, wiring Codex's S4/missions/Outposts numbers).

**Nick (none blocking): D24 and D25** in `audits/MAILBOX/DECISIONS.md`. Also still open: the playtest checklist (`?deviceProbe=1`, `?audioReview=1`, a full journey, `?battle2=1&vs=…` pairs).

**Traps (obey them)**
- **Disk-space law:** `df -h /System/Volumes/Data` at batch start and end; stay ≥ 40 GiB free. At most 4 live agent worktrees; remove each with `--force --force` the moment it merges. No large stashes. Newest 2 preview packages only.
- **Merges:** after resolving, run `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing.
- **Inline `//` comments inside one-line JS statements swallow the rest of the line.** This bit twice this session; use `/* */`.
- **G1 runner caches fits:** `run-auto.mjs` skips intake when `fit/` exists. Use a fresh `--tag` after changing the author.
- **The motion kit refuses an unclassified material.** Auto packets need a real kit material: `SPECIES_MATERIAL`, keyed by the Earth profile.
- **Slice-executing tests** run exact `main.ts` regions. New code inside a slice needs its real function added to that test's env.
- **`tools/run-unit-tests.mjs` builds the PWA pack first.** For quick diagnostics, run `node node_modules/vitest/vitest.mjs run <file>` directly.
- **Codex's sealed inventories** (release/Guide bullets, budgets, pins) are never rebound by Claude. Propose bullets in an audit README (the G4 README has one).
- **The lone original clone** at `/Users/nick/Projects/Celestial-Frontier` is Nick's (`develop`). Don't edit it.

## Current sprint handoff — Generated Creature Pipeline, 2026-09-26

Codex/macOS: /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac → origin/openai/mac.
HTTPS origin; repository keychain signing, every commit G. Claude's worktree is read-only.
D22/D23 and the pipeline PROGRAM.md are current. Mac-only development: never push, merge from
or recreate either retired Windows branch. Read both lane mailboxes at start/end; no Nick relay.

Disk law: check df at every batch boundary, cleanup below60GiB, stop/clean below40GiB.
This batch185GiB before →205GiB after two completed I5 worktrees and38 stale preview packages
removed; newest2 retained and git status unchanged. No own stashes/temp worktrees remain.
Finisher model cache and named recovery/evidence retained. See audits/G_PIPELINE_CODEX_20260926.

Completed C34 copy checkpoint: signed Claude bba9215e merged no-ff (inherited main.ts
changes announced),119 release bullets,41 topics,5 briefings;7ea28e02/C17/D19 retained.
Full develop profile504 tool passes,5,562 unit passes, standingI5 only; all seven manual
owners PASS;81 focused copy tests and native phone/desktop Guide briefings PASS. Root validate PASS.
Own-branch push is explicitly authorized, each measured pack below2GB. No PR/label,
hosted attempt, develop/main merge, release or deploy. Budget UNFROZEN; no hosted authority.

Next order:
1. Sign/push completed copy checkpoint, then G2.
2. G2: ~20 Earth quadruped generated masters from the compiled controlled-layout prompt,
   with exact prompts and visible-anatomy verifier counts. NO new hand authoring. One sheet.
3. Derived six marking masks, unchanged conservation gate.
4. Review Claude G1 auto-author contract against unchanged intake and38 reference packets;
   report field/invariant failures without silent repair.
5. G5 phone-deliverable finished original engine after G3; desktop per individual.
6. Only after G1 PASS: S4 training-only feasibility map, then the ONE authorized fresh epoch
   (declare new untouched corpus before tuning) or one recommended target decision for Nick.
Hand paintings, missions/Outposts numbers, pack diet and I5 are parked until G1 passes.

S4 candidates03/13 remain rejected; prior runtime restored exactly. Old held-out corpora are
consumed and never reused. S4 refusal packet: audits/S4_PRODUCTION_EPOCH_20260926/README.md.
Claude builds G1/G3; Codex supplies G2/masks/G5 and reviews the interface. Shared signed commits
are immediately available; Nick need not open another app. Prior remote openai/mac6cbeefe0;
copy checkpoint f01f911e is signed G and pushed (18,031,040-byte pack). Pre-existing .DS_Store stays untouched.

Remote cleanup complete: only openai/mac, anthropic/mac, develop and main remain. Retired
parked OpenAI tip retained by local archive tag. Free219GiB at copy checkpoint.
G1 contract review delivered (G1_REVIEW.md):12/40 red, all-visible presence lacks independent
counts. Claude G3 has since landed; merge its signed result after this checkpoint for G5.

## Preserved unfinished gameplay — keep visible across handoffs

Signed parked WIP cf1b9a78 is preserved by local tag archive/openai-parked-gameplay-20260904
and the verified191KiB recovery bundle in audits/G_PIPELINE_CODEX_20260926. Remote branch
was deleted at Nick's request; commits were NOT discarded. Batch4 recovered primary gameplay
owners individually. Forge Training remains parked; assess old living-preview behavior against
the current generated-art pipeline before marking it superseded. Weekly lifecycle is now live.
See RECOVERY.md and BATCH4_OVERNIGHT_REPORT_20260905.md for exact disposition; no wholesale
WIP merge. This is an outstanding-work pointer, not a change to G1/G2 priority.


## Latest steering — complete preserved gameplay first

Nick explicitly requests finishing the removed parked branch work now. G2 delivered20 masters/120 candidate masks (10 ADMIT/10 REFUSE, unqualified; ear-as-paw verifier finding), no hand authoring. Audit README retains evidence. Recover Forge Training and assess/recover bounded living portraits against current owners, then resume G5. Existing weekly lifecycle already supersedes the old wall-week WIP. Free233GiB.
