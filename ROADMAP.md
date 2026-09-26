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

## Current Codex sprint handoff — 2026-09-26, C46 completed batch

**C50 in progress:** signed mergef85cac18 throughbb770d53, Claude handoff preserved.16MiB tracked inventory and explicit finisher helper preview/build delivery fixed; focused controls PASS (C50_SHIPPED_FINISH_FIX_20260926). Claude can rerun shipped smoke; Codex C49 review/layout/fit continuation and final integrated battery pending. D26 unchanged.

### Working state and authority

- Worktree `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`; signed no-ff merge `375935b6` integrates Claude through `0c208c4c`. Signed implementation/native checkpoint `cf1a24da`; the final evidence/library commit carries this handoff (resolve from `git log openai/mac`). Claude's block above is retained verbatim. Older Codex handoff is verbatim in ROADMAP_ARCHIVE.md.
- Read the other lane's absolute mailbox at start/end; write only `TO_CLAUDE.md` here. C46–C48 read. Claude now has newer signed work through91a62a50, not merged in this batch. Shared Git store needs no push wait or Nick relay. Read PARALLEL_GIT_PROTOCOL before the next batch.
- Own-branch push only. Budget UNFROZEN; repository freshly PUBLIC and workflows have no push trigger. No PR/label/hosted/develop/main/release/deploy/version bump. I5 remains the only accepted battery red; no hosted attempt while red.

### Completed

- C46 derived ownership reviewed independently and accepted for Civet/Eel/Rat/Salamander; genuine record/master/binding/atlas/evidence pins, exact reproduction and corruption controls. Registry/source library38. All FOUR masters are opaque: final card consumer now falls back unless every alpha byte equals its admitted card master. Stage projection retains original atlas alpha before individual morph.
- Fixed runtime contract mismatches without identity/pixel rebinding: canonical individual IDs up to2048 characters (same bound as visual keys), actual worker Uint8ClampedArray output copied byte-exact; malformed/oversize/wrong-type controls pass.
- Three canonical880 crab originals on signedcf1a24da pass native worker/audit-adapter inference, conservation, cache and fresh phone-tier delivery:3inferences/1worker/6detached buffers/0phone model creations. Strict publisher verifies producer/identity/PNG/receipt before writing exact files under `library/creature-finish/<key>/`. After manifest regeneration the ACTUAL bundled-pin consumer admits all three (7fetches).603files/65,315,121library bytes;119,722PNG bytes. See `audits/G5_C46_CONTINUATION_20260926/PHONE_DELIVERY.md` for scope and exact identities. No site deployment, ordinary main.ts native flow, physical phone or quality approval claimed.
- Automatic tail closure makes prior Eagle and Sandpiper packets PASS_STATIC across all actions and full presentations with original pixels/landmarks unchanged. Sandpiper also passes the CURRENT native stage at4×CPU:0/0refusals,780frames,7msCPU p95,13.206083sfilm. Named report/stills in `G1_TAIL_REPAIR_20260926/sandpiper-native-01`; full film retained locally at hash-bound receipt path. Eagle remains UNRESOLVED. No pre-admission bypass or default adoption; broad use needs full same-policy mutation battery. Empty-mask contour bug fixed with controls.
- Six new untouched stride/tail paintings and exact receipts in `G2_STRIDE_PILOT_20260926`: five author refusals and Tapir static failure, zero new admissions. Prior20 family masters retained. G4 copy unchanged120bullets/41Guide/5briefings; no remeasurement. Parked gameplay remains consolidated and complete; generated creature pipeline stays priority.

### Open gates and next work

1. **D26 still open (Nick); explicit answer requested but not received.** Keep alpha===255, original alpha,4-pixel erosion and conservation unchanged. Conditional five-crab rerun/Cougar proof are blocked; old five-crab proof is NOT superseded. If explicitly approved: add alpha<250 never-edited control, rerun/supersede the old five-crab proof, then native1254Cougar and send its original for review. No Cougar original exists from this batch.
2. Four old fit failures remain: Grouse support/fixed-root split, Sparrow faint foot45.1900°, Mongoose blended foreFarAnkle−108.5299°, Tapir tail compression/faint folds. Keep full-presentation failures visible. Eagle's semantic UNRESOLVED also prevents play admission. Sandpiper diagnostic is not Nick quality acceptance.
3. C47/C48: Claude's five automatic G2 fish pass static/native numerical diagnostics but show seam holes; no art acceptance. Recommended bounded hypothesis: selectively weld Carp axial body↔body-1 (547 edges), then assess body↔body-2 (71); keep fins/siblings independent. Preserve UV/pixels/exact rest and every static/contact/fold/seam gate; measure seam gaps before native inspection. No overlap/underpaint workaround: priority masks stay exclusive and duplicate translucent paint changes alpha. Not implemented here.
4. Next G2 layouts: low horizontal S serpents, level head, no downward tail curl, reference-like body thickness; right-facing insects with6separated legs/readable abdomen; birds ground contacts/legs/tail fan apart. Keep successful fish layout. D24 old gate stands; D25 reference shopping OFF. G1 remains unmet; broad generation and S4 remain parked.

### Verification and cleanup

- Full browser-free develop profile: **5,645 PASS; I5 only FAIL**,2expected failures/2skips across562files. All7manual owners PASS: root/app/worker TypeScript, artaudit, overridecheck, speccheck, overridecontrol. Exact logs/source hashes in G5_C46_CONTINUATION_20260926/final-battery. Root validate repeated after final assets:1010renders/0boot errors/unchanged50-probe fingerprint. No full browser certificate claimed.
- Startup approved tools current; no updates. Free disk223GiB (≥40). Pruned80,371,278bytes of ignored rejected-fit/native preparation scratch with retained input/report/hash evidence. Kept positive Eagle/Sandpiper fits, all originals, exact output receipts and named film; three permanent worktrees/no stashes/newest2previews.
- Next Codex: act on D26 only after explicit approval; otherwise selective seam/remaining fit/layout work. Next Claude: merge signed OpenAI work from shared store, consume38sources and three originals; preserve opaque-card fallback and flag. **Nick need not open another app or relay messages.** No PR or hosted attempt requested.
