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
- **Codex:** merged through `1b01b93e` (accepted derived labels, phone originals, runtime fixes). Earlier: `bfe76a6b` (G5 sizes/transport/stage admission). Before that: `d809c53b` (parked gameplay, the G5 engine and its native proof: five crabs finished, delivered byte-exact, 0 phone model constructions). Before merging again, read `/Users/nick/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md` (read-only) and run `git log HEAD..openai/mac`. Codex's current focus, per Nick: finish the preserved parked gameplay (Forge Training, the living-portrait decision) BEFORE its G5 engine work.
- **Gate:** `node tools/check-profile.mjs --profile=develop` (from `port/v2`) gives **5,645 pass; the ONLY red is I5** (`current-producer-authorities`, "binds every live memory budget").
  - Run it on a QUIET tree. A commit during the run produces a spurious "Source changed during authority read".
  - Also run by hand, all clean this session: `npm run typecheck` (root, app and worker), `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** https://dev-celestialfrontier.github.io serves `14b712e6` (G4; G5 card + stage behind `?finish=1`; Codex's phone originals). Evidence is in `audits/DEV_PUBLISH/14b712e6e14f`.
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
2. **G1:**
   - On Codex's G2 family pilot: **fish 5/5** (RESOLVED); birds, serpents and insects 0/5 each, from layout drift (C47 asks for layout-matched prompts).
   - The five automatic fish **pass Codex's native harness** (0/0 refusals) but **fail visual review** (seam holes; Codex's weld doesn't transfer): C48.
   - Author-side levers are exhausted (v9–v11).
   - Next: re-score each new G2 batch with `run-auto.mjs --targets=`, and run the native harness on its passes.
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

## Current Codex sprint handoff — 2026-09-26, C49/C50 completed batch

### Working state and authority

- Worktree `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`. Signed no-ff merge `f85cac18` integrates Claude through requested `bb770d53`; seven incoming commits verified G. Signed C50 checkpoint `e12a3786`; final evidence/prompt commit carries this handoff (resolve `git log openai/mac`). Claude's block above is preserved byte-identical; older Codex blocks are archived verbatim.
- Read absolute other-lane mailbox at start/end and PARALLEL_GIT_PROTOCOL before each batch. C49–C52 read; write only own TO_CLAUDE. Newer Claude head `54cac950` was observed but not merged here. Shared store needs no relay or push wait.
- Signed own-branch normal push only; budget UNFROZEN, fresh visibility/workflow checks before push. No PR/label/hosted/develop/main/release/deploy/version bump. I5 remains the only accepted battery red; no hosted attempt while red.

### Completed this batch

- **C50 fixed:** 16 MiB buffer for the actual 3,041,940-byte tracked inventory; explicit finisher math helper in preview HELPERS and build/dev names. Exact HTTP and emitted-helper controls pass; actual built helper equals source. Claude C52 reports the shipped desktop path now passes with no workarounds; C51 phone browser delivery also passes. See C50_SHIPPED_FINISH_FIX_20260926 and read-only mailbox snapshot.
- **C49 reviewed:** Perch/Cod/Carp final bindings/split receipts reproduce exactly. Additional exact selected-seam measurement passes all actions and full presentation; original unwelded Perch fails (94.609 px). Native historical producers match signed 91a62a50. Sampled full films and native stills support Nick-review candidates, not admission. `C49_FISH_REVIEW_20260926/{README.md,packet-contract.json,nick-review.png}` specifies durable record/binding/labels/atlas, immutable hashes, weld provenance, selected-seam evidence, native films/stills and visual decision required before registry/library pins. Trout/Herring remain visually refused; measure physical collar width/strain first, no reference shopping.
- **C47 delivered:** nine untouched 1254 originals (three serpents/birds/insects), exact canonical prompts/receipts and sheet in G2_LAYOUT_C47_20260926. Eight author refusals; Robin ADMIT/PASS_STATIC but semantic presence UNRESOLVED (`legFar+legNear`). No native or play admission. True-tail/layout wording improved; fish wording unchanged. Original alpha/pixels untouched; no hand authoring.
- **Fit continuation:** nearest-own-painted-part projection of contact endpoints fails Grouse and worsens Sparrow/Tapir. Mongoose endpoints already correct, so no unchanged rerun. Rejected operation/reports retained in G1_FIT_CONTINUATION_C50_20260926. No adoption, limits/pins/conservation unchanged. Prior Eagle/Sandpiper tail improvements remain; Eagle UNRESOLVED, Sandpiper prior native diagnostic positive but no human acceptance.
- Parked gameplay stays consolidated and complete. Three canonical crab phone originals, 38 source rows and opaque-card fallback from C46 remain. G4 copy unchanged at 120/41/5; no remeasurement.

### Open gates and concrete next work

1. **D26 still open (Nick); no explicit approval received.** Keep alpha===255, original alpha bytes, four-pixel erosion and conservation. Conditional five-crab rerun/Cougar proof remain blocked; old proof is not superseded. If explicitly approved, add alpha<250 exclusion control, rerun/supersede five crabs, then native 1254 Cougar and send the exact original for review.
2. Claude: make the three fish packets durable using C49 packet contract; preserve reviewed binding bytes and disclose final-pair versus full-search reproducibility. Nick: review the three candidates; static/native diagnostic PASS alone is not art acceptance. Do not admit Trout/Herring. Proposed next Salmon diagnostic compares original/single/final weld collar geometry under identical bytes/reference and gates.
3. Four failures remain: Grouse root/contact support topology, Sparrow faint foot angle, Mongoose blended foreFarAnkle, Tapir compression/faint folds. Next read-only diagnostic records the exact first failing target, rest chain, parent transform, support weights and independent feasibility under unchanged bounds; details in continuation README. No more blind joint snapping.
4. G2 new layout originals are available for author investigation. Robin's merged-chain evidence blocks play; serpent core classification and thin insect parts still refuse. No blind repeated generation, no author mutation-battery bypass. D24 old gate stands; D25 reference shopping OFF; G1 unmet, broad generation/S4 parked.
5. New C51 optional efficiency request: pin-only finish identity must be obtained from a generated trusted source pin with decoded-label hash, not caller-provided strings. A future implementation must prove byte-source/key parity and keep full byte preflight before inference/finished-atlas admission. Not implemented in this batch.

### Verification and cleanup

- Browser-free develop profile: **5,646 PASS; I5 only FAIL**, two expected failures/two skips, 563 files. All seven manual owners PASS; root validation 1,010 renders/zero boot errors/unchanged 50-probe fingerprint. Tested source hashes and exact logs in C50 packet. No current-head browser certificate claimed.
- Approved tool startup current, no update. Disk about 222 GiB (minimum40); 26.87 MB ignored rejected-fit scratch pruned after hash inventory, all originals/positive candidates retained. Three permanent worktrees/no stashes/two preview directories; no branch changes beyond requested merge.
- Next Codex: D26 only on explicit answer; otherwise retained fit/collar diagnostics and reviewed packet admission. Next Claude: shared-store merge and C49 durable packets, consume new G2 results. **Nick need not open another app or relay messages.** No PR or hosted attempt requested.
