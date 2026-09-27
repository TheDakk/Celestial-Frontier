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

## CLAUDE SESSION HANDOFF — 2026-09-27 (session 5, overnight) · GENERATED ART IS THE GOAL
Self-contained for a fresh Claude session. Codex's block follows below. Older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md` (session 4's is at its top).

**Dakk's goal (2026-09-26, verbatim):** "Can we get to the generated art? That's the main goal, so that we have the complete Earth creatures having full movement animations and all the procedurally generated animations in their various different battleground biomes." Dakk does ONE full visual pass at the end, so don't stop for per-creature approvals. **Dakk (2026-09-27): run through the night without stopping; nothing waits on him except real gates.**

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit adding this block; every commit is signed G (`git-ssh-sign-cf`). Codex is merged through `b3a34e15` (the I5 instrumentation checkpoint; Codex is running the guarded 3+1 epoch that re-seals the budget).
- **Gate:** from `port/v2`, `node tools/check-profile.mjs --profile=develop` gives 5,647 pass; the only red is I5 (Compendium producer authority: built index/worker/painter hashes versus the sealed budget; Codex's re-seal is pending). Run it on a QUIET tree, plus by hand: `npm run typecheck`, `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** serves `e71d1496`; no player-visible change since.
- **develop** is still `c1791e21`; PR #43 is open; no hosted attempt.
- **Decisions:** D24/D26 DECIDED; D25 open (shopping stays off); D27 open (its pattern-first default is implemented).
- **Progress** (`audits/GENERATED_GALLERY_20260927/coverage.json`, regenerate with `coverage.mjs` after each batch): **78 of 631 Earth species (12.4 %)** have a generated creature passing native with zero hand edits: fish 26/132, quadrupeds 23/205, birds 16/102, snakes 12/22, insects 1/41; every other family 0. None is visually accepted or admitted. Legged gallery proofs use observed supports (38/39 re-verified). Master gallery: `gallery.jpg` (82 tiles). Batches score with ONE command: `score-batch.mjs <batch> <tag>`.

**Session 5 (overnight 2026-09-27), all in `audits/G1_AUTO_AUTHOR_20260926/README.md` unless noted**
- **Serpent strip author:** `port/v2/tools/anatomy-verify/serpent-author.mjs`, runner `--serpent-strips` (USE IT for every serpent batch). **Snakes 0 → 9** static + native, clean at full size. Battery `serpent/battery.mjs`: 59/60 mutants, 9/9 wrong family.
- **Guarded tail labels:** `tail-labels-fit.mjs`, runner `--tail-labels`, off by default. Held-out Herring/Trout pass; welded versions deform in the reaction (not accepted).
- **Codex's foreleg repair checked** (`audits/C59_REPAIR_CHECK_20260927`): exact on all 7; guard proposed at 25 %.
- **C59 scored:** Raccoon, Vulture, Water Snake pass. Bobcat is a real slowdown. The Raven split is wing/tail overlap.
- **legMatch lever rejected** (battery positives 18 → 14; G2 quads unchanged).

**Next, in order (Claude)**
1. Read Codex's mailbox (`/Users/dakk/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) and merge any newer signed `openai/mac` (`--no-ff`; `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing; keep this block).
2. **Score every new G2 batch with ONE command:** `node audits/G1_AUTO_AUTHOR_20260926/score-batch.mjs <batchDir> <fresh-tag>` (out of the sandbox). It covers the pattern gate, the author with the standard flags, native on the passes, sheets, `summary.json` and the gallery registry.
   - Then LOOK at `native-<tag>/fullsize-reaction.png` at full size, edit each new registry note from `unreviewed` to what you see, run `node audits/GENERATED_GALLERY_20260927/gallery.mjs`, record the results in the G1 README, and send Dakk the sheet.
3. **Insects (0 so far):** diagnose the refusals (family floor, antenna/leg coverage, wrong family, facing) the way the snakes were diagnosed, and consider an insect-specific transfer if the references' construction allows it.
4. Admission only after Dakk's end-of-pass approval (`CARD_ARCHETYPES` → build pipeline/pins, through their owners).

**Traps (obey them)**
- **Disk-space law:** ≥ 40 GiB free; newest 2 preview packages only.
- **Inline `//` comments swallow dense one-line JS:** use `/* */`.
- **zsh does not word-split `$var` or `${@:-a b}`:** use arrays (`fish=(a b)`) or `${pr%%:*}` pairs. It bit twice.
- **`Buffer.slice()` is a VIEW:** copy with `Uint8Array.from` before mutating (it corrupted a check once).
- The G1 runner caches fits: use a fresh `--tag`.
- A green number is not visual acceptance: look at full-size reaction stills, not only approach.
- Browser-owning commands need out-of-sandbox execution. Codex's sealed inventories are never rebound by Claude.

## Current Codex sprint handoff — 2026-09-27, C59 repair checkpoint

### Goal, source and authority
- Worktree `/Users/dakk/Projects/celestial-frontier-openai-mac`, branch `openai/mac`. Signed no-ff `1ba92999` merges requested `4b56836d`; incoming Claude session-4 block above preserved byte-identically. Implementation/evidence signed as `55471066`; final verification-only descendant follows.
- Every Earth creature needs its own generated painting and full movement in battle biomes. Dakk reviews once at the end. D24/D26 are live; D25 shopping stays off. Read Claude's absolute read-only mailbox through C59 at run start and batch end; reply only in this lane's TO_CLAUDE.md.
- Signed commits, normal own-branch push only after the local battery with I5 the sole accepted red and fresh budget/workflow check. No PR/label/hosted/develop/main/release/deploy. Disk >=40GiB; last215GiB, three permanent worktrees, no stashes, newest two previews only.

### Delivered repair work
- `audits/C59_REPAIR_20260926`: seven `*-side/fit` candidates correct the elbow flap on Mink/Fisher/SnowLeopard/CloudedLeopard and C54 Tiger/Leopard/Ocelot. Use `foreleg-side-labels.mjs` + `compile-side.mjs`; only opposite-foreleg ownership changes, same-side longitudinal cuts and all other owners preserved. Source pixels/records/recipes/landmarks/limits unchanged. All seven static PASS + native0/0,933–934frames,5.9–7.1ms CPU p95 at4×. Independent exact-label reproduction in candidate-checks.json. Before/after and late-reaction sheets inspected. C54 plain cats remain pattern-refused; other torso defects are not accepted. Broader and upper-only candidates are superseded, not defaults.
- Portable source-input triplets and restore-masters.mjs map ignored input masters back to exact TRACKED canonical originals. Claude can reproduce/adopt only after independent checks; no registry/pin admission occurred.
- Tail compile now calls Claude's assertTailPair before fill; four real pairs and actual wrong-Cod-name compiler refusal pass. C59 independent tail contract acceptance is consumed.
- Bobcat: diagnostic CPU-profile run reproduces850frames against887required,0refusals. Late reaction/return/idle reaches~200ms due ARAP/orientation WASM. Real performance red, not capture error; no lowered floor or accepted retry. Profile and phase table retained.
- Cod/Perch: two observed body/body-1 and body/body-2 welds on exact-tail labels close the large rectangular gill holes in the reviewed frame; static/nativePASS0/0,707frames,4.4ms. Cod belly sliver remains.
- ArcticFox: source-connected smaller remainder-island placement improves head/foreleg shards, static/nativePASS0/0,933frames,7.5ms. Pointed shoulder in lethal reaction remains. Head/spine weld-only is rejected; no whole-fox visual acceptance. Raven hit-reaction tail split confirmed and open.

### Generated paintings ready for Claude
- `audits/G2_C59_20260926/pilot.json`:12 untouched1254 originals, six quadrupeds/three birds/two serpents/one insect, built-in imagegen and exact compiled prompts/receipts. Six pattern-onlyPASS, five NOT_REQUIRED, MountainViper REFUSE (zigzag unresolved). WaterSnake bands/Ladybug spots corrected. Score11eligible; no hand authoring or retrospective prompt changes. Preserve overlapping limb/layout findings and all earlier refusals.

### Verification and next work
- Rootvalidate and focused controls PASS. Quiet signed55471066 battery:5,647testsPASS/1I5failure/2expectedfail/2skip; all7remainingownersPASS. Source and HEAD unchanged; final-battery/REVIEW.md binds logs. Fresh PUBLIC/UNFROZEN workflow check permits a normal own-branch push without hosted triggers. No ruler, solver, joint, compression, source-conservation or sealed baseline changes.
- Superseded films/redundant stills:546,101,803bytes hash-inventoried and pruned only after scoped ignore rules. Final seven foreleg films plus final fish/fox films and three reviewed stills per run retained; report inventories remain original and missing scratch is explained in scratch-prune.json.
- Codex: continue from the signed repair checkpoint; keep Bobcat performance, ArcticFox shoulder, remaining fish/quad faults and Raven tail split open. Existing RedFox/Marmot/Cattle/prior-six repairs, C51 efficiency and I5 retain their queues. Claude: merge signed lane directly, independently check placement candidates and score the twelve-master pilot while respecting refusals. No Dakk relay or app switching needed; no per-creature approval stop.

### Active override — I5 repair, 2026-09-27
Dakk now requests fixing I5. C59 is signed/pushed4b08de117; its generated-art queues remain open. C8 v2 ownership work resumed in audits/I5_REPAIR_20260927. Painted diagnostics add exact retained data-URL bytes; v2 keeps separate raw owner inventories and includes resident buffers.61instrumentcontrols/8paintedproducttests/appTypeScript/rootvalidate PASS. Next: sign this preparation, isolate its exact source in a managed checkout, run one fresh guarded3-calibration/1-certificate epoch, stop on any refusal without retries or limit changes. Only a successful new certificate can replace the active-profile v1 binding. No hosted/PR/label/develop/release. Claude handoff unchanged; own mailbox holds the coordination receipt.

I5 measurement update: signedb3a34e15's fresh epoch stopped at native keyboard entry (four-Tab assumption versus ten current filter chips), after the initial mixed-owner settlements passed. No retries/later phases/certificate. Changed successor derives/validates each native Tab from actual DOM topology, extends worker-error/dedupe controls to the correct owner, and embeds its helper for reproducible replay.63instrumentcontrols plus a native synthetic11-step positive/four-step negative pass. Signed successor c506e1a4 quiet battery is complete:5,647testsPASS, I5authority alone red, all7remainingownersPASS;63instrumentcontrols/native synthetic keyboard/rootvalidate PASS. A separately authorized fresh guarded3+1 epoch on exact c506e1a4 is required before v2 budget/profile admission. Failed source checkout archived;216GiB free. No retry/hosted work. C60 arrived: Claude independently accepted seven foreleg repairs, requests a25% movement guard, serpent-contract review and wing/tail follow-up; those stay queued behind this I5 repair.

Latest batch-end mailbox read: C62. C61 Termite/Cicada motion and same-joint intake merge; C62 folded-wing reference-pool work remain queued after I5. Existing generated-art requests remain open. Claude can consume signed fixes directly; no Dakk relay/app switch is needed.

### Overnight sprint — authorized c506 I5 epoch (2026-09-27)
Signed no-ff08479f97 merges Claude through aaf3ee69, incoming session5 handoff byte-identical. Dakk authorized one fresh c506 epoch; calibration1 stopped INSTRUMENT-FAIL at phone Back focus. No retry/later phase/certificate; unchanged product source/v1 history. Full evidence:audits/I5_C506_EPOCH_20260927. I5 remains open. Continue ordered queue:25%forelegguard/serpent review; hand-authored folded-wing birds/separated-leg quad+insect references; insect motion; fish/fox/chest seams; birds; Bobcat slowdown; Marmot/Cattle/RedFox; repeated24G2 batches. Dakk explicitly permits these reference packets; automatic reference bootstrapping remains rejected. Each item signed/battery/own-branch push/mailbox read+merge, no per-creature stops.

Item1 complete:fixed25%foreleg guard,7byte-identical repairs/7swapped-chainrefusals,6synthetic controls. Serpent battery independently identical10/12positives59/60mutants9/9wrongfamily; thin-profile NaN finding sent to Claude (full author still refuses), Whip erased-tail gap remains. audits/C63_GUARD_REVIEW_20260927. Next:item2 hand-authored layout-matched references, not automatic-reference bootstrapping.

Item2 hand-reference candidates recorded in audits/G2_REFERENCES_C62_20260927:9new species/10exact outputs including Dog framing repair;8manual packets(4birds,Cat/Weasel,Ant/Cricket) allstaticPASS.4nativePASS(Robin,Duck,Cat,Weasel) retain visible lifted wing/ear/neck fragments; Pigeon encoded coverageFAILwith0rigrefusals; Hawk/Ant/Cricket faint foot-limitFAIL. No default-reference/library admission. Dogfar-ear interpretation unresolved; no invented hidden data. Shared same-joint intake now reproduces all1,572,516Beetlelabels and compiles; old-code negativecontrolrefuses. Claude should independently evaluate extra-refs-diagnostic.json with unchanged mutations/held-out targets, not automatically activate the pool. Next:item3 Termite/Cicada contact diagnosis (include newAnt/Cricket samefaint class), then remaining seams/birds/Bobcat/quadfaults and24G2batches. LatestClaudeC65thin-serpentfixmerged; handoffblockunchanged.

Item3:audits/INSECT_CONTACT_C67_20260927 reproduces exact insect failures and extends the existing faint author to source-derived insect root/thorax gain. Termite/Ant/Cricket/Beetle fullstatic+nativePASS0/0 at4×;12controlsPASS with old-author negative controls. No joint/compression/ARAP limit changed. Cicada cast/hit/tame/feed stillRED, nearly straight hind chains exceed the original8%compression. Termite wing-owned abdomen and Cricket/Beetle lifted wing fragments remain visual blockers. No library admission. Next:item4 full-size fish/fox/chest seam repairs, then bird motion/Bobcat/quadfaults and24G2batches. Claude block untouched.

C67 quiet-head verification:5,652PASS/I5soleRED;7ownersPASS. Claude C67 independently adopts Cat/Weasel/Ant/Cricket references,holds birds for compression;corrected fallback-fit native owner clears Goose/Quail,adds Donkey/Lynx alongside Bobcat. Next item4 body seams;item5 includes new bird-reference contact compression. Signed evidence/ownpush,then merge current signed Claude.

Item4 checkpoint:audits/BODY_SEAMS_C68_20260927 has Trout/Herring/Cod axial-remainder candidates,fin-boundary joins,fullstatic/nativePASS0/0;reviewed backs smoother/dorsals attached/Codbellysliver removed. Independent film/held-out review before adoption. Arcticnape candidate passes numbers but leaves cut;not adopted. Tiger/Ocelot/Fisher hairlines:mostlyalpha250–254paint means0eligibleopaque seam guards;D26finisher-only unchanged. Next:item5 bird-reference compression and Raven/Vulture wing-tail ownership,then Bobcat/Donkey/Lynx,quadfaults,G2. ClaudeC68absence proposal requires exact-master/life-stage target evidence,not blanket species-name inheritance.

Item5 partial checkpoint:audits/BIRD_MOTION_C69_20260927 reproduces bird failures. Generic faint author extends to birds;Hawk fullstatic/nativePASS (neck fragment visually open),Dove faintPASS/clawRED,Pigeon/Vulture stillRED.24focusedcontrolsPASS. Hit/tame endpoint-only canonical author misses actual painted-foot compression; proposed source-bound painted-support card input requires coordinated battle2 wiring from Claude, no limit change. Raven/Vulture ownership and Crow/Magpie folds remain. Next:item6 Bobcat/Donkey/Lynx performance,then quadfaults,G2;do not stop at checkpoint.

C70 correction:DO NOT adopt4c230c64 bird faint extension. Full battery found56Goose ARAPrefusals. The smaller motion is not automatically skin-safe; a reduced-reserve follow-up also failed preservation. Productionstance-envelope/timeline restored byte-identically to6f8ef98;candidateandallfailedlogs retained. No bird repair is admitted. Need actual painted-support-aware authoring coordinated with Claude. Continue item6 after restored-source battery/push.

Item6 partial:audits/LATE_REACTION_C70_20260927. Exact runtime field reuse preserves alloutput bytes/guards;Donkey862→894,Lynx874→902nativePASS0/0. Bobcat850→868stillRED(887required);moving faint costs354–363kactivevisits around mixed near-foreleg/spine/hardankle targets. Lynx visual fragments remain.4cachecontrols+11rigcontrolsPASS. ClaudeC71 painted-supportinput merged8c5c6d6. Next item7Marmot/Cattle/RedFox,then24G2originals;return to bird author with actualsupports and Bobcat source geometry.

Item7 diagnostic checkpoint:audits/QUAD_UPPER_C73_20260927. Upper chest/neck axis placement moves26,194Marmot/45,791Cattlepixels,allforeignowners/records/mastersunchanged. Bothstatic/nativePASS933frames0/0;Marmotlargeheadwedge reduced butsmalltuft/forepawfaultremain,Cattlecrouchbackcontinuous buthornfragment/pinhole remain. SpecificCattlerearingpose not established;noacceptance. RedFoxsamecompressionrefusal inrest+observedsupportmodes. Next24G2originals,thenpainted-supportbird author/seams/Bobcat/quadfollowups. I5epochconsumed/stopped,neverretry.

Item8 C74: audits/G2_C72_20260927 holds24 exact1254originals(8fish/8birds/4insects/4snakes),pilot/receipts/geometry/source-boundvisualnotes. FourrequiredpatternPASS,20NOT_REQUIRED;notadmission. Narrowmargins/insectlegambiguity/Grass+Whiptailcurls flagged. Claude scores automatically. Next consumeC71paintedsupports inbirdwholecurveauthor+instrumentparity,thenremainingfaultsandfurther24G2batches.

C75 candidate: source-bound painted-support bird author clears seven contact actions; 21 focused tests, seven old-author negatives. Harness/arena fixture parity included. Goose fullstatic/native observedPASS780frames0/0,p955.5ms4x; small back feather remains. Quail faint19folds/Raven victorytransition8folds/Vulture-Dove-Pigeon faint limits remain. No visual admission. Full quiet battery before push; then C76 broad24G2batch and remaining repairs.

C76: audits/G2_C76_20260927 retains24exact1254originals(8fish/8birds/8quads),pilot/receipts/source-boundvisualnotes. FourpatternPASS/20NOT_REQUIRED;18framingPASS/6REFUSE. No admission; upperlimboverlap/standingposes,wing-tailambiguity,Peccarytusk flagged. C77virtualpaintedfaintprobe: Pigeon/Vulture/Dove/GoosefullstaticPASS,Quail19foldsunchanged;productionnotedited. NextafterC76battery/push: C77native+controls,thenSculpin/fishseamsandremainingfaults/further24G2batches.

C77: exactpainted-supportfaintauthor,wholeconstanttorsogainonlywhenoriginalrefuses;25controlsPASS,actualdisable→4FAIL,sharedarena9PASS. Pigeon/Vulture/Dove/Hawk native0/0(761/774/780/762frames);allretainneck/nape/tailfragments. Quail19faintfolds/Ravenvictoryfoldsremain. No limit/override/pixelchange. audits/BIRD_FAINT_C77_20260927. Fullquietbatterybeforepush;nextSculpin+C72fishseams,thenremainingfaultsandG2.

C78: explicit keyed-label intake preserves original/recipe and exact keyerRGBAhash;10focusedcontrolsPASS,disabledhashguard→1FAIL. Sculpin tail-axis+5observedpectoralwelds closes large openings,static/native707frames0/0. Walleye/Pacu static/native707/0/0,smallerhairlinesremain. Graylingcast3/victory4foldsRED;Carpstillopen. No default/library/visualadmission. audits/FISH_SEAMS_C78_20260927;fullquietbatterybeforepush. NextGrayling/Carp/Paddlefish andwaitingfish,thenremainingfaults/furtherG2.

C79: exact C78 Magpie/Dove native inputs omitted supports and used rest while static used painted. Explicitobserved gives775/780frames0/0; originalMagpie script reproduces exact51refusals/-70.0267knee. No motion/default/limit change; upperback/neck fragments/Dovetailcurl remain. Preservationtest scheduling timeout20s, assertions unchanged. audits/BIRD_NATIVE_INPUT_C79_20260927;fullquietbatterybeforepush. Next Grayling/Carp/Paddlefish, other faults and G2; I5epochstillconsumed/stopped.

C80: Grayling/Carp far-fin folds repaired in packet-only5ring fin collars, root/otherpins/geometry/budgets unchanged; observed near-fin boundaries close Carp opening. Finalgrayling-pectoral-02/carp-pectoral-02 fullstatic/native707/0/0. Paddlefish explicitspine0remainder helper moves1370labels with separate root/foreignowners protected; fullstatic/native707/0/0, small rostrumfleck remains. audits/FISH_FOLD_C80_20260927. IndependentClaudevisualreview pending;no defaultadmission. Fullquietbatterybeforepush; nextremainingfish/wing/insect/quad/Bobcatfaults and24G2. I5epochconsumed/stopped.

C81: audits/G2_C81_20260927 retains24new exact1254originals (8marinefish/8birds/8insects), pilot/receipts/full-originalnotes.5patternPASS/19NOT_REQUIRED;20framingPASS/4REFUSE. Fishidentitynubs/barbel, birdwing-tail/shortcockedtail, insectleg/attachmentfaults explicitlyflagged;noadmission. Claude independentlyacceptedC80Grayling/Carp/Paddlefishgalleryfits. Observed-supportgallery38/39PASS, Donkey886/887refused; Bobcatslowdown/otherfaults remain. Fullquietbatterybeforepush,thenremainingrepairsandfurther24G2;I5consumed/stopped.

C81 final verification: signed e1d801427 quiet develop profile: 5,668 pass, I5 authority sole failure, 2 expected failures, 2 skipped. All seven remaining owners and root validate pass. 204 GiB free. PUBLIC/UNFROZEN and five exact reviewed workflows rechecked; no hosted trigger. All24 exact originals are ready for automatic observed-support scoring; layout/identity refusals remain explicit. No I5 retry.

C82 follow-up: winning Raven/Vulture source overlays establish transferred wing/tail endpoint errors; no blind weld or guessed labels. Donkey side candidate static/native891PASS0/0 but fragments remain; Bobcat side871/887FAIL, broaderlongitudinalcandidate20foldsREJECTED. audits/REPAIR_FOLLOWUP_C82_20260927 retains exact evidence/controls. No runtime/limits changed. Next24G2 thenremainingrepairs;I5stoppedauthorityconsumed.

C82 final verification: signed b28985761 quiet develop profile 5,668PASS/I5soleRED/2expectedfail/2skip; all7remainingowners and rootvalidatePASS. Source/HEAD unchanged and all log hashes verified.204GiBfree; PUBLIC/UNFROZEN/five reviewed workflows rechecked. No limits changed, Bobcat remains refused, Donkey has visual faults. Your C82/C83 read: choose painting-layout clarification (wingtips visibly short of tail where naturally correct; both quad ears/tail clear), not a blind geometry guard. Next C83 24originals; then generalizing existing fish seam steps with per-packet static/native verification. No target hand boundaries, no I5 retry.

C83: audits/G2_C83_20260927 has24newspecies/25exactoriginals,7narrowpatternPASS17NOT_REQUIRED,20framingPASS4REFUSE. Weaverbirdnestpose retainedREFUSE; separatelycompiled standing-v2 selected. Quadears/tails andbirdwinglayoutclarified,source-boundnotes preservefaults. Fullquietbattery before ownpush; nextgeneralfishseam phase plusremaininginsect/ownership/performance queue. I5stillstopped.

C83 final verification: signed b16ee2fa3 quiet develop profile5,668PASS/I5soleRED/2expectedfail/2skip;all7remainingowners and rootvalidatePASS. Source/HEAD unchanged,exactloghashesverified.204GiBfree;PUBLIC/UNFROZEN/five reviewed workflows rechecked.24pilot subjects,25exactoriginals including refusedWeaverbird. No anatomical/library admission,I5retry or hosted work. Next fixedfishrepair recipe across12waitingfits,each with unchangedstatic/native/fullsizereview.
