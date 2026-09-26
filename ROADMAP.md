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
- **Codex:** merged through `bfe76a6b` (G5 sizes/transport/stage admission). Before that: `d809c53b` (parked gameplay, the G5 engine and its native proof: five crabs finished, delivered byte-exact, 0 phone model constructions). Before merging again, read `/Users/nick/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md` (read-only) and run `git log HEAD..openai/mac`. Codex's current focus, per Nick: finish the preserved parked gameplay (Forge Training, the living-portrait decision) BEFORE its G5 engine work.
- **Gate:** `node tools/check-profile.mjs --profile=develop` (from `port/v2`) gives **5,638 pass; the ONLY red is I5** (`current-producer-authorities`, "binds every live memory budget").
  - Run it on a QUIET tree. A commit during the run produces a spurious "Source changed during authority read".
  - Also run by hand, all clean this session: `npm run typecheck` (root, app and worker), `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** https://dev-celestialfrontier.github.io serves `29b827df` (G4; G5 card + stage behind `?finish=1`). Evidence is in `audits/DEV_PUBLISH/29b827dfecb1`.
- **develop** is still `c1791e21`. PR #43 is open. No hosted attempt: I5 is red (D5).
- **Disk:** about 230 GiB free. No agent worktrees are live, and the limb-counter branch is merged (it had no worktree). The newest 2 preview packages are kept.

**The priority: the Generated Creature Pipeline** (`audits/GENERATION_PIPELINE_20260926/PROGRAM.md`, Nick D22/D23)

| Stage | Owner | State now |
|---|---|---|
| **G1 auto-author** | Claude | **v5 adopted, gate NOT met.** Corpus **12/40**. Codex's independent **G2 quadruped pilot: 10/20** ADMIT + PASS_STATIC, zero hand edits. Mutation battery erased **31/34**, duplicated 26/27, flip 34/34, wrong family 34/34 (the limb counter, merged from `claude/t1-limb-counter`). All five of Codex's blocking review findings are fixed. Rejected with numbers: reference shopping (D25) and thin-part nudging. `audits/G1_AUTO_AUTHOR_20260926/README.md` "Session 2". |
| G2 library at scale | Codex | Pilot delivered (20 quadrupeds + 120 derived-mask candidates, `audits/G2_QUADRUPED_PILOT_20260926`). Next families are Codex's. |
| **G3 on-demand delivery** | Claude | Live. **Card path now browser-smoked PASS** (online library cards, offline core fallback, negative control): `audits/G3_ART_DELIVERY_20260926/card-smoke/`. |
| **G4 selection** | Claude | **Landed and live.** `paintedArtV2`, one resolver for card and stage: exact → same Earth profile group → nearest same-anatomy visual-gene variant → v1 stand-in. Sturgeon and Reef Shark now draw sturgeon- and shark-shaped procedural fish. 7 tests with controls. `audits/G4_SELECTION_20260926/README.md`. |
| **G5 finisher in the game** | Claude routes, Codex engine | **Card path in the game behind `?finish=1`** (session 3, on Codex's `bfe76a6b` unblock); stage waits on C45(a). Earlier: **Codex's engine landed (`26a4bc57`, merged). Claude's routing layer v1 landed:** `creature-finish-route.ts` (tier, source, identity, store-only lookup, desktop enqueue, finished → card-master kernel) and the card `finished` hook; 5 tests on real fits with controls. NOT yet wired into `main.ts`: the desktop `createInfer` adapter and `?finish=1` wiring are next. Stage-loader and phone-delivery shapes asked in C41. `audits/G5_ROUTING_20260926/README.md`. |

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
1. Read Codex's answers to C41 (loader admission, phone delivery) and C43 (worker size + transport); merge its signed commits. Re-score G1 on any new G2 families as they land (`run-auto.mjs --targets=<pilot.json>`).
2. **G1:** Codex's second review is closed in the runner (v8). Four author levers were tried in v9–v11: the separator is a dead end; the remainder-marker bug is fixed; the Eagle's red is its tail outline (handed to Codex); paint-grown parts are net zero. **The author-side levers are exhausted.** Next gains come from the G2 paintings: limbs posed apart and true tails (C44). Re-score each new G2 family with `run-auto.mjs --targets=`.
3. **G5:** card AND stage in the game behind `?finish=1`. The stage uses Codex's C45(a) composition: finished texture, then the individual's morph. Derived ownership evidence for Civet/Eel/Rat/Salamander awaits Codex's review (C46). **Blocked on D26** (Nick: the finisher's alpha = 255 interior rule excludes every 1254 master). Then a real-browser run on a local dev server with the model, and Nick's quality review before the flag is ever on by default.
4. Only after G1 passes (or D24 redefines it): the parked items (audio Stage 4, the mission-return voice, the Kindred picker, wiring Codex's S4/missions/Outposts numbers).

**Nick: D26 blocks the 1254 finisher (recommended: approve alpha ≥ 250 for eligibility, with conditions).** Also D24 and D25 in `audits/MAILBOX/DECISIONS.md`. Also still open: the playtest checklist (`?deviceProbe=1`, `?audioReview=1`, a full journey, `?battle2=1&vs=…` pairs).

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

## Current Codex sprint handoff — 2026-09-26, C46 native checkpoint

- Worktree `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`. Signed no-ff merge `375935b6` integrates Claude through `0c208c4c`; the Claude block above is retained verbatim. Read the other lane's absolute mailbox at start/end; write only `TO_CLAUDE.md` here. Own-branch push only, budget UNFROZEN, no PR/label/hosted/develop/main/release/deploy.
- D26 is **open (Nick)**. The explicit answer was requested and has not arrived. Keep alpha===255, original alpha,4-pixel erosion and conservation unchanged. Conditional five-crab rerun/Cougar proof remain blocked; old five-crab proof is not superseded.
- C46 derived-label review accepted all four genuine maps and original/evidence pins; registry/source library38. All four originals are opaque: final card consumer falls back unless alpha matches admitted card master. Stage finishing retains original atlas alpha and then individual morph.
- Fixed actual runtime contract mismatches: canonical IDs up to2048 characters; worker Uint8ClampedArray output copied byte-exact. New native three-crab production is prepared with canonical runtime identities/model hash; old receipts cannot be relabelled. Run commands and strict publisher/consumer in `audits/G5_C46_CONTINUATION_20260926/PHONE_DELIVERY.md`. Await clean signed native checkpoint; no publication claim yet.
- Automatic tail candidate makes Eagle/Sandpiper PASS_STATIC across full actions/presentations. Eagle remains UNRESOLVED. Run one current Sandpiper native command from `audits/G1_TAIL_REPAIR_20260926/README.md` after the crab browser slot. Four other fit failures remain. No pre-admission coverage bypass, hand polygons or relaxed gates. Empty-mask contour bug fixed with controls.
- Six fresh stride/tail paintings and exact prompts retained in `G2_STRIDE_PILOT_20260926`; unchanged G1 refuses five, Tapir remains static red. D24 old gate stands; D25 reference shopping off. Prior20 four-family originals retained; G4 copy unchanged at120 bullets/41Guide/5briefings, no remeasurement.
- Parked gameplay remains consolidated and complete. Generated creature pipeline stays priority. Root validate and focused contract/alpha/ownership checks pass. Final integrated battery and native results pending this checkpoint; I5 is the only accepted battery red, not an excuse for other failures.
- Startup tools current; no update needed; disk227GiB. No new branches/worktrees. Next Codex: native production/publication, Sandpiper diagnostic, final battery/doc/cleanup/own-push handoff. Next Claude: consume signed shared-store work after mailbox completion. Nick need not open another app or relay messages.
