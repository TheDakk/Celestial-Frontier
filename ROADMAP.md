# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Dakk, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

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
- **Codex:** merged through `e12a3786` (C50 tool fixes). Before: `1b01b93e` (accepted derived labels, phone originals, runtime fixes). Earlier: `bfe76a6b` (G5 sizes/transport/stage admission). Before that: `d809c53b` (parked gameplay, the G5 engine and its native proof: five crabs finished, delivered byte-exact, 0 phone model constructions). Before merging again, read `/Users/dakk/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md` (read-only) and run `git log HEAD..openai/mac`. Codex's current focus, per Dakk: finish the preserved parked gameplay (Forge Training, the living-portrait decision) BEFORE its G5 engine work.
- **Gate:** `node tools/check-profile.mjs --profile=develop` (from `port/v2`) gives **5,646 pass; the ONLY red is I5** (`current-producer-authorities`, "binds every live memory budget").
  - Run it on a QUIET tree. A commit during the run produces a spurious "Source changed during authority read".
  - Also run by hand, all clean this session: `npm run typecheck` (root, app and worker), `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** https://dev-celestialfrontier.github.io serves `c99e3eb7` (G4; G5 card + stage behind `?finish=1`; Codex's C50 tool fixes). Evidence is in `audits/DEV_PUBLISH/c99e3eb7ded7`.
- **develop** is still `c1791e21`. PR #43 is open. No hosted attempt: I5 is red (D5).
- **Disk:** about 230 GiB free. No agent worktrees are live, and the limb-counter branch is merged (it had no worktree). The newest 2 preview packages are kept.

**The priority: the Generated Creature Pipeline** (`audits/GENERATION_PIPELINE_20260926/PROGRAM.md`, Dakk D22/D23)

| Stage | Owner | State now |
|---|---|---|
| **G1 auto-author** | Claude | **v5 adopted, gate NOT met.** Corpus **12/40**. Codex's independent **G2 quadruped pilot: 10/20** ADMIT + PASS_STATIC, zero hand edits. Mutation battery erased **31/34**, duplicated 26/27, flip 34/34, wrong family 34/34 (the limb counter, merged from `claude/t1-limb-counter`). All five of Codex's blocking review findings are fixed. Rejected with numbers: reference shopping (D25) and thin-part nudging. `audits/G1_AUTO_AUTHOR_20260926/README.md` "Session 2". |
| G2 library at scale | Codex | Pilot delivered (20 quadrupeds + 120 derived-mask candidates, `audits/G2_QUADRUPED_PILOT_20260926`). Next families are Codex's. |
| **G3 on-demand delivery** | Claude | Live. **Card path now browser-smoked PASS** (online library cards, offline core fallback, negative control): `audits/G3_ART_DELIVERY_20260926/card-smoke/`. |
| **G4 selection** | Claude | **Landed and live.** `paintedArtV2`, one resolver for card and stage: exact → same Earth profile group → nearest same-anatomy visual-gene variant → v1 stand-in. Sturgeon and Reef Shark now draw sturgeon- and shark-shaped procedural fish. 7 tests with controls. `audits/G4_SELECTION_20260926/README.md`. |
| **G5 finisher in the game** | Claude routes, Codex engine | **Card path in the game behind `?finish=1`** (session 3, on Codex's `bfe76a6b` unblock); stage waits on C45(a). Earlier: **Codex's engine landed (`26a4bc57`, merged). Claude's routing layer v1 landed:** `creature-finish-route.ts` (tier, source, identity, store-only lookup, desktop enqueue, finished → card-master kernel) and the card `finished` hook; 5 tests on real fits with controls. NOT yet wired into `main.ts`: the desktop `createInfer` adapter and `?finish=1` wiring are next. Stage-loader and phone-delivery shapes asked in C41. `audits/G5_ROUTING_20260926/README.md`. |

**Why G1 is still red, and what moves it**
- **The corpus gate (≥ 30/40) is near-unreachable by construction.** 6 singleton families, sparse radial/serpent/insect families, and the hand control itself scores only 30/40.
  - **D24 (Dakk):** measure G1 on the independent G2 pilots instead (recommended gate: ≥ 75 % per family with ≥ 2 references, battery ≥ 90 %).
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
   - **Perch, Cod and Carp:** selective welds fix the seams; Codex reviewed them; durable candidate packets are built (`audits/G1_FISH_PACKETS_20260926/`). They await **Dakk's visual decision**, then registry/library admission by its owners (C53).
   - Next: re-score each new G2 batch with `run-auto.mjs --targets=`, and run the native harness on its passes.
3. **G5:** card AND stage in the game behind `?finish=1`, proven in real browsers:
   - the desktop model run on a crab: shipped path PASS after Codex's C50 fixes (run-03-shipped);
   - the phone delivery path PASS;
   - the stage (picker) PASS with both fighters finished.

   Open:
   - a pin-based identity to spare phone downloads (C51);
   - **D26 (Dakk)** for 1254² masters and a visible finish;
   - Dakk's quality review before the flag defaults on.
4. Only after G1 passes (or D24 redefines it): the parked items (audio Stage 4, the mission-return voice, the Kindred picker, wiring Codex's S4/missions/Outposts numbers).

**Dakk: D26 blocks the 1254 finisher (recommended: approve alpha ≥ 250 for eligibility, with conditions).** Also D24 and D25 in `audits/MAILBOX/DECISIONS.md`. Also still open: the playtest checklist (`?deviceProbe=1`, `?audioReview=1`, a full journey, `?battle2=1&vs=…` pairs).

**Traps (obey them)**
- **Disk-space law:** `df -h /System/Volumes/Data` at batch start and end; stay ≥ 40 GiB free. At most 4 live agent worktrees; remove each with `--force --force` the moment it merges. No large stashes. Newest 2 preview packages only.
- **Merges:** after resolving, run `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing.
- **Inline `//` comments inside one-line JS statements swallow the rest of the line.** This bit twice this session; use `/* */`.
- **G1 runner caches fits:** `run-auto.mjs` skips intake when `fit/` exists. Use a fresh `--tag` after changing the author.
- **The motion kit refuses an unclassified material.** Auto packets need a real kit material: `SPECIES_MATERIAL`, keyed by the Earth profile.
- **Slice-executing tests** run exact `main.ts` regions. New code inside a slice needs its real function added to that test's env.
- **`tools/run-unit-tests.mjs` builds the PWA pack first.** For quick diagnostics, run `node node_modules/vitest/vitest.mjs run <file>` directly.
- **Codex's sealed inventories** (release/Guide bullets, budgets, pins) are never rebound by Claude. Propose bullets in an audit README (the G4 README has one).
- **The lone original clone** at `/Users/dakk/Projects/Celestial-Frontier` is Dakk's (`develop`). Don't edit it.

## Current Codex sprint handoff — 2026-09-26, C54/C55 generated-art batch

### Working state

- `/Users/dakk/Projects/celestial-frontier-openai-mac`, `openai/mac`. Signed no-ff merge98607995 integrates requestedfe344e2b; all12 incoming commits verified G. Claude block above retained byte-identical. Signed implementation/native checkpoint22176bd7; final evidence/library/art commit carries this handoff (resolve openai/mac).
- C53–C55 and DECISIONS D24/D26 read by absolute read-only path; own TO_CLAUDE has measured replies. Newer Claude0ed5c122 read, not merged. Shared Git store needs no Dakk relay or push wait.
- Main goal: every Earth creature has its own generated painting, full movement and battleground-biome presentation. Dakk will do one full visual pass at the end. D24 measures generated G2 paintings per family;40-corpus remains regression. D26 approved. No gates weakened.
- Own normal branch push only under current UNFROZEN/public/no-push-trigger policy; no PR/label/hosted/develop/main/release/deploy/version bump. I5 remains the only accepted required-battery red.

### Completed

- **D26:** finisher alpha≥250 eligibility only, unchanged4px erosion/original alpha/conservation. Both compiler and worker settings bind interiorAlphaMin250; old outputs retain old identities. Alpha249 never-edited/250positive/radius/alpha/settings controls pass.
- **Five-crab native proof:** signed22176bd7,5inferences/1model/10detached buffers/0phone model construction. Independently zero sub250 RGB changes and alpha changes on all5; conservation/cache/delivery/admission pass. Old5proof retained and explicitly superseded for current policy.
- **Native1254 Cougar:**1264 padded work canvas, original1254output, corrupt transfer refused before model.271,622RGB pixels change;1,237,597sub250 pixels and all alpha bytes unchanged. Finished original `audits/D26_FINISH_20260926/cougar-01/cougar-finished.png` retained for Dakk. It uses the audit Cougar identity, not an invented canonical phone key. Flag stays opt-in.
- **Phone originals:**5new canonical crab PNG/receipt pairs in local library; producer hashes checked before publication,613-file manifest regenerated, actual pinned consumer PASS all5 with11fetches.3old keys preserved. No deployment/physical-phone claim.
- **G2 throughput:**24new original1254paintings (12quadrupeds,4birds,4serpents,4insects), exact canonicalC47prompts/identities/tool receipts/hashes, geometric observations and one full review sheet in `G2_THROUGHPUT_C54_20260926`. `pilot.json` ready for Claude's automatic rescore. Original app files and repo masters are byte-identical; no hand authoring/admission.
- **Instrument honesty:** native runner now exits1 when capture reports refusals; real folded Cod control confirms it. Old exit0/FAILreports stay FAIL.

### Tail and fit work — still open

- **Cod candidate:** C55 gap fill left only1observed body-5--caudal edge, plus102root/caudal edges. This is already a normal nearest join, not a missing sibling bridge. `fill-gap-observed.mjs` uses all positive alpha, observed main-boundary distance58px and a1px contour collar:4,550/4,550requested pixels retained,0other-owner changes,96shared edges. Exactrest/staticPASS and native0/0,707frames,4ms at4×. Original pixels/landmarks/limits unchanged. Durable fit/film/stills: TAIL_STALK_C54_20260926/08-cod/cover-04 and native-cover-04.
- **Not a complete fish repair:** other body seams remain; restoring prior5welds makes staticRED. Perch/Carp lose requested pixels when contours fragment; ArcticFox steals other-owner pixels. Final helper refuses all3 before packet write. Wider axial-weight designs static-passCod/Perch but fail additive victory; Carp/ArcticFox also fail. No shared author/split/rig/pin adoption. Claude has exact boundary findings; next: preserve fragmented ownership coverage and prove a genuinely gapped held-out tail with unchanged seam/fold/mutation gates.
- **RedFox/Marmot/Cattle:** automatic projection of mismatched contact-chain landmarks passes static on all3 but RedFox retains identical zero-displacement composite compression refusal. Marmot crouch-head/Cattle rearing-hump remain visual faults, not solved by static leg checks. Measure actual reported head/neck/body surfaces and layered compression next; keep8% bound. Audit G2_QUAD_FAULTS_C54_20260926.
- Prior six-fit queue remains: Eagle/Sandpiper tail candidates retain previous evidence; Grouse/Sparrow/Mongoose/Tapir not fixed. No unchanged retry or silent replacement. C51 pinned-only phone identity is optional efficiency backlog, not required for delivered originals.

### Verification and hygiene

- Full browser-free develop owner:5,647PASS; I5current-producer-authorities alone FAIL;2expected failures/2skips. All7remaining owners PASS (root/app/worker types,artaudit,overridecheck,speccheck,overridecontrol). RootvalidatePASS:1,010renders,0booterrors,50-probe golden fingerprint. Focused adapter/app/engine/route/settings controls pass. Full logs D26_FINISH_20260926/final-battery and final-validate.log.
- Official startup check complete, no eligible tool update. More than220GiB free;366,590,854bytes of own ignored fit/prepared/rejected-film/still scratch pruned with per-file hash inventory. Three permanent worktrees, no stashes, no temporary checkout created. Keep newest2preview packages; current inventory checked at batch end.
- Copy remains120bullets/41Guide/5briefings; no copy or baseline remeasure requested. Claude handoff may contain older D24/D26 wording because Dakk explicitly required verbatim preservation; this Codex block and signed decision rows give current state.

### Paired next steps

Codex owns the remaining tail/general-fit repair and finished-original admission; resume from measured candidates, keep the generated-art program active. Claude can merge signed openai/mac directly, consume D26/new delivery keys and re-score all24 via the retained pilot under D24. Reply only through each lane's own mailbox. Dakk need not open another app or relay notes; no per-species approval pause. Full visual review remains at the end, before enabling the finisher by default.
