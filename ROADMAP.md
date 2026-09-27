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

## CLAUDE SESSION HANDOFF — 2026-09-26 (session 4, end) · GENERATED ART IS THE GOAL
Self-contained for a fresh Claude session. Codex's block follows below. Older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md` (session 3's is at its top).

**Dakk's goal (2026-09-26, verbatim):** "Can we get to the generated art? That's the main goal, so that we have the complete Earth creatures having full movement animations and all the procedurally generated animations in their various different battleground biomes." Dakk does ONE full visual pass at the end, so don't stop for per-creature approvals; keep the pipeline flowing and keep the review sheets current.

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit adding this block; every commit is signed G (`git-ssh-sign-cf`); `origin` is HTTPS via `gh`. Codex is merged through `2447b472` (no newer signed `openai/mac` at session start).
- **Gate:** from `port/v2`, `node tools/check-profile.mjs --profile=develop`; the ONLY red is I5. Run it on a QUIET tree. Also run by hand: `npm run typecheck`, `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`. This session changed audits/docs only (no `port/v2` source), so the dev site was not republished (still `c99e3eb7`).
- **develop** is still `c1791e21`; PR #43 is open; no hosted attempt (I5 red).
- **Decisions** (`audits/MAILBOX/DECISIONS.md`): D24 and D26 are DECIDED (per-family G1 scoring on G2 paintings; finisher alpha ≥ 250, implemented). D25 is open (reference shopping stays off). **D27 NEW, open:** regenerate patterned cats with the pattern named first (recommended; Codex proceeds unless Dakk objects).

**This session (session 4)**
- **C54 batch scored** (`audits/G1_AUTO_AUTHOR_20260926/README.md`, "G2 C54 batch"): 9/24 ADMIT + PASS_STATIC. Quadrupeds 7/12 (Dingo, Jackal, Lion, Tiger, Leopard, Ocelot, Weasel); birds 2/4 (Goose and Quail, the first birds through static); serpents 0/4; insects 0/4.
- **Native** (`native-g2c54/`): 7/7 quadrupeds DIAGNOSTIC_PASS 0/0. Goose and Quail FAIL native (peck refusals; ARAP folds and the faint foot limit).
- **Looked at full size:** the tails are all full.
  - Fit fault: on Tiger, Leopard and Ocelot, a chest-fur flap hangs below the near elbow in stride (`chest-zoom.jpg`), and the Leopard has a shoulder seam.
  - Painting fault: the five patterned cats have no pattern (D27).
  - The review sheet and the full-size sheets were sent to Dakk.
- **Fish tail** (`audits/TAIL_STALK_BRIDGE_20260926/README.md`):
  - A component-preserving bridge on top of Codex's C55 observed fill. The Cod is byte-identical to Codex's cover-04; the negative controls hold both ways.
  - Perch and Carp now pass ownership, static and native, and with their selective welds the gill hole is gone.
  - NOT adopted: neither is a genuinely gapped tail, and Trout, Herring and Arctic Fox still refuse (the outer contour encloses later-listed owners).

**Next, in order (Claude)**
1. Read Codex's mailbox (`/Users/dakk/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) for its C57 replies. Merge any newer signed `openai/mac` (`--no-ff`; after resolving, run `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing; keep this block).
2. **Score each new G2 batch the same way:**
   - `node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=<fresh> --topk=1 --chains --counter --fallback=2 --targets=<batch>/pilot.json`.
   - Then run native on every ADMIT + PASS_STATIC. Pattern: `audits/G1_AUTO_AUTHOR_20260926/native-g2c54/run.sh` (sequential, out of the sandbox). Land scripts come from `05-cougar`, birds from `15-goose`, fish from `native-g2fam-fish/*-script.json`, each with the names swapped.
   - Build the sheet with `native-g2c54/sheet.mjs` and the full-size crops with `crops.mjs`, then LOOK at tails, legs, heads and elbows. Record the results in the G1 README and send Dakk the sheet.
3. **Tail:** once a genuinely gapped held-out fish exists (a new G2 fish batch, or Codex's), run `fill-gap-bridged.mjs` plus the selective welds and the unchanged gates. Adopt the rule into the author only if it passes without regressing Cod, Perch or Carp.
4. **Birds:** Goose and Quail pass static but fail native. Diagnose peck/faint on the Gull-referenced fits (Codex owns the bird motion repairs; check C44/C57 replies first).
5. **Admission:** only after Dakk's end-of-pass approval, add creatures as LIBRARY archetypes (`tools/morph/build-card-masters.mjs` `CARD_ARCHETYPES`, then the build-shipped pipeline and pins, through their owners).
6. Parked until the generated pipeline flows: audio Stage 4, the mission-return voice, the Kindred picker, Codex's S4/missions/Outposts numbers.

**Traps (obey them)**
- **Disk-space law:** `df -h /System/Volumes/Data` at batch start and end; ≥ 40 GiB free; newest 2 preview packages only; no large stashes; remove merged agent worktrees with `--force --force`.
- **Inline `//` comments inside one-line JS statements swallow the rest of the line.** Use `/* */`.
- **zsh does not word-split `$var`:** `for f in "a b"; set -- $f` silently passes "a b" as one argument (it bit this session). Use `${pr%%:*}` pairs.
- The G1 runner caches fits (it skips intake when `fit/` exists): use a fresh `--tag`.
- **A green number is not visual acceptance.** The elbow flap passed every gate, and the native impact still is washed out by the hit flash (sheets use approach, return-end and reaction).
- Browser-owning commands (native runner, smokes, deploy) need out-of-sandbox execution.
- Codex's sealed inventories (release/Guide copy, pins, budgets) are never rebound by Claude; propose changes in an audit README.
- `tools/run-unit-tests.mjs` builds the PWA pack first; for quick diagnostics run `node node_modules/vitest/vitest.mjs run <file>`.

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
