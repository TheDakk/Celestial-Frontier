# G1 auto-author — painting + family → authoring.json (Generated Creature Pipeline, 2026-09-26)

Program: `audits/GENERATION_PIPELINE_20260926/PROGRAM.md` (Dakk D22/D23). Owner: Claude.

**Latest (session 5, 2026-09-27):** the serpent strip author takes snakes from 0 to 9 (static + native); C59 adds Raccoon, Vulture and Water Snake; the tail-label step passes the held-out Herring. **Running total: 34 generated creatures pass native**, none visually accepted yet. Previously, session 4: C54 gave 9 static / 7 native; C56+C57 gave 8 static / 7 native, including the Raven, the first bird (sections below). The exact-label tail contract passed Claude's independent checks with a rig-derived identity guard (`audits/TAIL_LABELS_CHECK_20260926`). D24 scores G1 per family on generated paintings.

**Status (end of session 2, 2026-09-26): the corpus gate (≥ 30/40 admitted with zero hand edits) is NOT met.**
- Adopted author **v5:**
  - **12/40** on the leave-one-subject-out corpus;
  - **10/20** on Codex's independent G2 quadruped pilot (new generated paintings, no hand authoring anywhere).
- The mutation battery meets its target: erased limbs refused **31/34 (91 %)**, duplicated **26/27 (96 %)**, wrong family **34/34**, flipped facing **34/34**.
- Codex's five blocking review findings are fixed (see "Session 2").
- The gate's denominator needs Dakk's decision (**D24**). By construction this corpus cannot reach 30:
  - 6 subjects have no same-family reference;
  - the radial, serpent and insect families have 2–3 dissimilar members each;
  - the hand-authored control itself scores 30/40 on this harness.

## Session 2 (2026-09-26): v3 → v6

| Run | Author | Corpus ADMIT + PASS_STATIC | G2 pilot ADMIT + PASS_STATIC | Mutants: erased / dup / flip / wrong |
|---|---|---:|---:|---|
| v2 | best reference + chains | 12/40 | — | 23/34 · 23/27 · 33/34 · 34/34 |
| v3 (= limb-counter branch, v3d rules) | + independent visible-appendage counter (`limb-counter.mjs`) | 12/40 | — | **31/34 · 26/27 · 34/34 · 34/34** |
| v4 | + Codex review fixes, polygon untangle, labelled fallback | *instrument failure* (below) | — | unchanged (summary-v4) |
| **v5 (adopted)** | + species-group materials | **12/40** | **10/20** | 31/34 · 26/27 · 34/34 · 34/34 |
| v6 (rejected default) | + reference shopping (`--shop=2`) | 15/40 (+marmot, river-otter, herring) | 12/20 (+brown-bear, wild-horse) | **29/34 · 24/27 · 33/34** · 34/34 |
| v7 (salamander, grouse only) | + canvas clamp | salamander: intake now PASSES, static RED (its hand control is RED too); grouse: intake still refused | — | — |

**The limb counter (branch `claude/t1-limb-counter`, merged).**
- It reads paint only:
  - detached islands;
  - protrusions outside an eroded body core (with attachment, extent and a geometric class);
  - separate ground contacts in the bottom band.
- The admission rules are:
  - an extra detached island;
  - an unassigned target appendage ≥ 6 % of the paint;
  - the family floor on the rear class;
  - the ground floor: at least as many ground contacts as the fewest any same-family reference shows.
- The v3d battery reproduced exactly this session (`summary-v3d-repro.json`).

**Adopted fixes (v4/v5), each retained in evidence:**
- **Presence is measured** (Codex finding). Without the counter's visible inventory, the author refuses (`presence-unmeasured`); the skeleton mode is diagnostic only. Nothing is ever declared absent, hidden or folded. A species absence (the lynx's bobtail, a tail-less primate) therefore REFUSES; it is never guessed.
- **id from the corpus row** (never the target's authoring). Identity checks cover subject-source family, profile, genome seed and visualKey.
- **Materials.** Codex's neutral string cannot pass any gate: the motion kit REFUSES an unclassified surface (`body-card` `unsupported-materials`, pinned by `body-card-presence.test.ts`). v4's static therefore refused every subject (the instrument failure above).
  - v5 uses the species group's integument, keyed by the pinned Earth profile id (`SPECIES_MATERIAL` in `run-auto.mjs`): felid → fur, lizard → scales, eel/salamander/frog → smooth skin, cnidarian → translucent.
  - An unmapped group refuses (`materials-unknown`).
  - Side finding for Codex: the Honeybee hand material "chitinous shell with short thoracic fur" maps to *furred*, because `materialFromSkinName` tests `/fur/` first.
- **Outer provenance envelope** (`auto-*/<id>/provenance.json`). It records:
  - automatic transfer;
  - the reference's authoring and master hashes;
  - the target master and subject-source hashes;
  - the profile id, media and hash;
  - the material source;
  - the measured visible inventory.

  It also states that intake's `manualAuthoring=true` / `sourceLandmarksReused=false` are NOT an automatic-origin attestation. Intake itself is unchanged.
- **Geometry-only repairs,** logged per part in evidence:
  - `untanglePolygon` (a self-crossing warped polygon keeps its larger loop);
  - the canvas clamp (vertices past the canvas edge, where there is no paint).
- **`--fallback=N`:** only when an ADMITTED packet is refused by intake/static, try the next-ranked references; each candidate must earn its own ADMIT. It rescued nothing on the corpus (bird ARAP folds and the grouse surface split persist at every rank). It is kept, labelled.
- **`--targets=`:** independent paintings with leave-one-SPECIES-out references (a corpus packet of the same species is never a reference).

**Rejected, with numbers:**
- **Reference shopping** (a verdict-refused author retries ranks 1–2). It admits 3 more corpus subjects and 2 more G2 subjects, but under the identical policy the battery loses erased 31→29, duplicated 26→24 and flip 34→33. It is kept as the option `--shop=N`, off by default (D25).
- **Thin-part nudging** (the v3e family). It admits marmot, river-otter and herring. But their erased far-hind-leg mutants are refused ONLY by the same false ear/tail-tip refusal that rejects the positive: the far hind leg sits behind the near leg, so neither part coverage nor the counter sees it erased. Fixing the thin-part false refusal therefore exposes those erasures. The honest fix is a better far-limb detector, not a looser threshold.
- **Terminal snap distance as an erased-leg signal** (`summary-snapdiag.json`). It is ~0 for erased legs: the spline warp carries the feet onto the warped contour. A dead end.

**G2 quadruped pilot** (`auto-g2-v5/`; Codex's 20 generated masters in the controlled layout; references = the 40 corpus packets, leave-one-species-out; ADMIT + PASS_STATIC is not acceptance: native, finish and Dakk's review still apply):

| Species | Verdict | Static | Reference | First reason / static reds |
|---|---|---|---|---|
| Coyote, Red Fox, Arctic Fox, Fennec Fox, Caracal, Cougar, Marmot | ADMIT | PASS_STATIC | Wolf | |
| Raccoon | ADMIT | PASS_STATIC | Cougar | |
| Cattle, Donkey | ADMIT | PASS_STATIC | Wild Horse | |
| Mongoose | ADMIT | RED | River Otter | |
| Tapir | ADMIT | RED | Brown Bear | melee:tail, faint |
| Lynx | REFUSE | — | Wolf | tail1 covers 26 % paint (reference 95 %): bobtail |
| Brown Bear, Bison, Camel, Wild Boar | REFUSE | — | Wild Horse | tail3 covers 0–12 % (reference 38 %): short tails |
| Badger | REFUSE | — | Cougar | far ear tip covers 10 % |
| Wild Horse | REFUSE | — | Cattle | an unassigned limb-down appendage of 7.5 % |
| Goat | REFUSE | — | Ibex | near ear tip covers 0 % |

The dominant G2 refusal is the **short tail**: the reference's tail chain has no paint. It is correctly refused, because presence never declares an absence. The levers, in order:
1. G2 prompts that paint the species' true tail clearly;
2. a short-tailed reference in the pool (only via admitted, independently accepted packets; never bootstrapped unchecked, per Codex's review);
3. a measured-absence declaration: truncating a tail chain whose paint is measured absent. This needs Codex's intake/presence contract review first.

**G2 family pilot (Codex `9cf27be1`: 5 birds, 5 fish, 5 serpents, 5 insects), scored with the adopted v10 author** (`auto-g2fam-v10/`; leave-one-species-out; zero hand edits):

| Family | ADMIT + PASS_STATIC | Semantic presence | What refuses |
|---|---:|---|---|
| **Fish** (trout, perch, cod, carp, herring) | **5/5** | all RESOLVED | — |
| Birds (hawk, heron, pheasant, robin, kingfisher) | 0/5 | Hawk ADMIT but static RED (`approach:flight`, presentation) | thin foot and tail-fan coverage; the Robin shows one ground contact; the Kingfisher has 12 % unexplained paint |
| Serpents (grass, rat, garter, king, tree snake) | 0/5 | — | every one: an unassigned "appendage" of 9–25 % of the paint. The generated snakes are THIN and posed on a rising diagonal (head raised, tail curled down); the references (Python, Racer) are thick and horizontal, so the counter's body core (the thickest segment) leaves most of a thin S-curve outside it. A layout mismatch, not an anatomy error |
| Insects (ant, beetle, cricket, grasshopper, mantis) | 0/5 | — | Ant: facing (the mirror matches better); Beetle: wrong family (a quadruped matches better); Cricket: antenna coverage; Grasshopper and Mantis: the rear-class family floor (a slender abdomen against the Beetle/Honeybee floor) |

- **The five fish through Codex's native harness** (`native-g2fam-fish/`: `tools/battle2-proof/native-runner.mjs`, mirror match, the Tang's lake script, CPU ×4):
  - **All five DIAGNOSTIC_PASS:** 0/0 rig refusals, 707 frames, CPU p95 3.3–5.6 ms. They are the first creatures through the whole chain (generated painting → automatic authoring → intake → static → native) with zero hand edits.
  - **But visual review FAILS:** the Carp shows a hole behind the head on both fighters, where background shows through a part seam, and the Trout shows a crack at the gill line (`09-carp/turn1-hit-reaction-50.png`, `06-trout/turn0-hit-impact.png`). This is the flat-master sibling seam Codex met on its own Bass fit-03 (a numerical pass and a visual fail).
  - **Codex's accepted weld** (`preservePaintBoundaries: true`, its Bass fit-05 recipe, applied unchanged in `weld-g2fam-fish/weld.mjs`) does NOT transfer to the automatic fits. All five welded fits go static RED (hit/dodge/body/tail), and 4/5 native captures failed ("missing live frames"; possibly a concurrent-browser instrument issue, moot given the static reds). The weld is rejected for automatic packets.
  - **Codex's C48 proposal (selective axial welds via the existing `paintBoundaryPairs`), tried here** (`weld-g2fam-fish/weld-pairs.mjs`, `greedy.sh`, `greedy.log`):
    - Starting from the one axial pair that passes static (`body↔body-1`, or `body↔spine1` on the Salmon-referenced fits), each remaining OBSERVED axial adjacency is added one at a time and kept only if the unchanged static gate still passes.
    - Final welds: Trout 3 pairs, Perch 3, Cod 5, Carp 2, Herring 5. `body↔caudal` folds for every fish; the head has no observed adjacency to the body in any of them.
    - All five finals are PASS_STATIC and native DIAGNOSTIC_PASS (0/0 refusals, 707 frames).
  - **Claude's visual check** (`weld-g2fam-fish/review-final.png`, turn-1 reaction at full resolution):
    - **Perch, Cod and Carp look clean:** no holes or cracks in the frames that showed them before. They are the FIRST fully automatic creatures ready for Dakk's review (generated painting → automatic authoring → intake → selective weld → static → native, zero hand edits).
    - **Trout and Herring (from the Salmon reference):** the extra welds close the cracks but deform the silhouette (a lumpy back and belly on the Herring, a floating dorsal on the Trout). The single-weld versions (`pairs/*-A5`) still crack. Not acceptable yet.
  - Nothing here is play admission: Dakk's visual review and the library/registry admission remain.
- **The G2 quadrupeds through the native harness** (`native-g2-quad/`, v10 author, the Cougar land script, CPU ×4):
  - 9/10 DIAGNOSTIC_PASS with 0/0 refusals. The Red Fox fails "Layered stance reach: zero-displacement composite" (a stage motion refusal, fit side).
  - **Claude's visual notes** (`review-sheet.jpg`, standing plus attack/reaction):
    - Coyote, Fennec, Caracal, Cougar, Raccoon and Donkey look plausible at sheet size;
    - Arctic Fox: black blotches at the tail tip and rump (likely the tail-joint fault);
    - Marmot: the head crumples in the crouch;
    - Cattle: the back humps when rearing.
  - These await Dakk's full-size review (he plans a full visual pass at the end).
- **Fish packets REJECTED by Dakk** (tail stalk crunchy/pinched). The tail joint is the top rig priority (C54).
- **All G2 so far** (quadrupeds + families): **15/40**, with fish 5/5 and quadrupeds 10/20.
- **The pattern:** where the generated painting shares the references' controlled layout (fish; most quadrupeds), the automatic author works with zero hand edits. Where the layout drifts (diagonal snakes, raised bird legs, slender insects), it refuses, correctly. Asked of the G2 prompts in C47.

**Instrument correction (Codex C79): native proofs must use `supports: 'observed'`.**
- My native scripts omitted it, so the native entry tested REST contact supports while static (and the game, for observed-support fits) tests the painted ones.
- The Magpie/Dove "lethal-faint FAIL" was this mismatch: with only `supports: 'observed'` added, both pass native (775/780 frames, 0/0). Codex reproduced the original 51 refusals exactly on the old script.
- `score-batch.mjs` now sets it for every family.
- **Consistency item DONE** (`audits/GENERATED_GALLERY_20260927/observed-rerun.mjs` → `native-observed-rerun/results.json`):
  - All 39 legged gallery creatures (quadrupeds, birds, the Beetle) were re-run with `supports: 'observed'`. Each fit was resolved from the run script / score record that produced it, taking the winning fallback candidate where there is one.
  - **38/39 PASS, and the gallery now points at these proofs.**
  - The Donkey is borderline: 886/887 frames with 0 refusals (a one-frame performance shortfall, the Bobcat class), so it stays on its earlier run with a note.
  - Fish and snakes have no ground-contact chains, so the supports mode does not change their proof.

**Bird references ADOPTED after Codex's painted-support faint author (C77, `1fa7bd3f`)** (`auto-g2bird-faint-c77-*`):
- All 20 G2 birds: 5/20 with the current pool, **8/20 with Codex's 4 bird references**.
- Gained: Robin, Starling, Magpie, Dove, Heron. Lost: Raven (open victory folds) and the G2 Hawk.
- The verdict battery with all 8 hand references was already measured unchanged (`summary-handrefs-c66`).
- **`pilots/reference-pool-extras.json` now includes Robin, Pigeon, Duck and Hawk**, used by `score-batch`.
- **Native** (`native-g2bird-poolv2/`): Heron PASS (the left fighter's far wing hangs away: a wing split). **Magpie and Dove FAIL** in the lethal faint (Magpie `legNearKnee` −70°, Dove `legNearAnkle` 85°; static passes).

**G2 C76 batch (Codex `aeb3f10f`: 8 fish, 8 birds, 8 quadrupeds; scored with `score-batch.mjs`, all 24 incl. the 6 framing-REFUSE, since framing is Dakk's margin request, not an anatomy gate)** (`auto-g2c76/`, `native-g2c76/`):
- **8/24 native PASS:** Pike, Bass, Char, Sturgeon, Paddlefish, Goldfish; Spoonbill, Kestrel.
- **Quadrupeds 0/8:** the far ear tip or tail is not visible (Capybara, Llama, Musk Ox, Okapi, Alpaca), unexplained paint (Agouti, Peccary). Pangolin: `materials-unknown` (profile group `toothless-clawed-mammal` mixes furred anteaters and scaled pangolins; left refused, not guessed).
- Birds refused: Swift, Falcon (extra appendage), Swallow, Crane, Guineafowl, Pheasant (leg coverage).
- **Full-size:** Kestrel clean; Spoonbill has a thin wing crack. The fish are unwelded (cracks on Pike/Bass, the Sturgeon gill line, a small Goldfish crack; Char nearly clean). **The Paddlefish hit fighter fragments (not acceptable).**

**Bird references re-measured after Codex's painted-support bird author (C75, `337e7cf8`)** (`auto-g2bird-painted-base/`, `auto-g2bird-painted-c75/`; all 20 G2 birds):
- Current pool (no bird references): **4/20** (Goose, Quail, Raven, Vulture).
- With Codex's 4 bird references: **4/20** (Goose, Quail, Robin, Starling).
- The painted supports **fixed the Goose and Quail losses** the bird references used to cause. Raven and Vulture still go static RED with them (Codex's open Raven victory folds and Vulture faint limits).
- **Net neutral → bird references stay held.** Re-measure after those two repairs. The gallery already holds all six birds from their best passing runs.

**G2 C72 batch (Codex `b8741e6f`: 8 fish, 8 birds, 4 insects, 4 snakes), scored with `score-batch.mjs` (session 5)** (`auto-g2c72c/`, `native-g2c72c/`):
- **Three instrument problems found on the first two runs and fixed; none was a creature fault:**
  1. **Fish need an aquatic WORLD block in the battle script**, not just lake themes. The stage refused "home arena cannot support both organisms". `score-batch` now bases fish on the `native-g2fam-fish` script.
  2. **This batch's masters are opaque and magenta-keyed**, not transparent. The serpent author read alpha only, so every snake measured length/thickness 1. It now uses the general author's own `paintMask` key when there is no transparency.
  3. **The serpent author lacked the general author's canvas clamp.** Opaque masters go through the authored-mask intake, which refuses vertices outside the canvas (the Racer's head polygon overshoots the body).
  The serpent battery verdicts are identical after both serpent fixes, and the tests pass.
- **Result: 14/24 native DIAGNOSTIC_PASS.** All 8 fish, Ibis and Oystercatcher, and all 4 snakes (King, Grass, Whip, Vine; the first opaque-master snakes).
- **Refused:** Finch/Egret/Stork (leg coverage), Lark/Chough (facing), Ptarmigan (wrong family), Water Strider, Cockroach, Stick Insect. The Carrion Beetle is refused at intake.
- **Full-size:** snakes and both birds look clean. The fish are unwelded: body cracks on Grayling, Walleye and Pacu, and the **Sculpin fragments (not acceptable)**. Minnow, Whitefish, Cichlid and Tetra look acceptable. The fish need the tail-label and axial seam repairs before acceptance.

**Codex's hand-authored reference candidates evaluated (C66 → C67, session 5)** (`audits/G2_REFERENCES_C62_20260927`: Robin, Pigeon, Duck, Hawk, Cat, Weasel, Ant, Cricket; hand observations on NEW originals; `--extra-refs`, leave-one-species-out):
- **Battery with them: unchanged** (18/34 · 34/34 · 34/34 · 31/34 · 26/27; `mutants/summary-handrefs-c66.json`). Hand references cost no safety, unlike the rejected automatic bootstrapping (D28).

| Family | Before → with hand refs | Gained (static) | Lost | Why lost |
|---|---|---|---|---|
| Quadrupeds (50) | 25 → **27** | Caracal, Lynx, Ocelot re-paint, Snow Leopard (C54), Mongoose | Leopard (C54), both Raccoons | the slim Cat/Weasel is chosen for bulky fur → "unexplained paint" 11–19 % |
| Birds (20) | 4 → **2** | Robin, Starling | Goose, Quail, Raven, Vulture | static RED: the contact scale-compression bound in hit/tame (+ Quail folds), the same weakness as Codex's own new bird references |
| Insects (17) | 0 → **1** | Beetle (via Ant) | — | — |

- **Adopted into the default pool:** Cat, Weasel, Ant, Cricket (`pilots/reference-pool-extras.json`; `score-batch.mjs` passes it). Net gains, battery unchanged.
- **Held back:** the four birds, until Codex repairs their contact compression; then re-measure.
- A bulky-mammal reference (raccoon/badger) would recover the two Raccoons.
- **Native on the newly passing creatures** (`native-handrefs/`): Snow Leopard, Caracal, Ocelot, **Starling (a bird)** and Mongoose PASS. Lynx FAIL: 0 refusals, 874/887 frames (the Bobcat slowdown class). Robin FAIL: 9 refusals, 300 ms spikes. The Beetle's first run used the wrong fit (see below).

**Instrument bug found and fixed: fallback winners were battle-tested on the WRONG fit.**
- When `--fallback` admits rank k, the passing fit is in `<id>/fallback-k/fit`. Every native script (the session-3 quad runner, `native-g2c54/run.sh`, tonight's `native-handrefs/run.sh`, and `score-batch.mjs`) used `<id>/fit`, the rank-0 fit that had FAILED static.
- Affected: Donkey (session 3), Weasel/Goose/Quail (C54), Robin and Beetle (hand refs). Their native results measured a static-RED packet.
- `score-batch.mjs` now picks the winning candidate's fit. The six are re-run on the correct fits in `native-fallback-fix/`.
- Lesson: when a runner can admit a fallback, every downstream step must read the admitted candidate's path from `score.json`, never a fixed path.

**Termite abdomen peel: author-ownership diagnosis (C68):**
- Ant-referenced transfers are refused at intake, because the Ant declares `wings` absent and the author never inherits an absence.
- The Termite therefore passes via its Beetle-ref fallback, whose merged elytra (→ `thorax`) cover the wingless abdomen. The thorax owns that paint, so it peels.
- Fix proposed (C68): a reviewed species-level absence table on the Earth profiles. The author inherits a reference's absence only when the target species independently declares the same absence.

**One command per G2 batch (session 5):** `node audits/G1_AUTO_AUTHOR_20260926/score-batch.mjs <batchDir> <tag>` (repo root, OUT of the sandbox because native owns a browser). It runs:
1. The pattern gate → `pilots/<tag>-eligible.json`.
2. `run-auto` with the standard flags (`--topk=1 --chains --counter --fallback=2 --serpent-strips --merge-joint-labels`).
3. Native on every ADMIT + PASS_STATIC, sequentially (the Goose script for birds, the Cougar script otherwise; the stage picks the arena from the habitat). It uses the merge-joint / tail-labels fit when one was built.
4. The review sheet + full-size reaction crops, `native-<tag>/summary.json`, and appends each native PASS to `audits/GENERATED_GALLERY_20260927/gallery-registry.json` (note `unreviewed` until Claude looks).
5. `gallery.mjs` then redraws the master gallery from the registry.

Control: re-running C59 through it must reproduce the manual C59 result (below).

**Measured, not recommended: G2 creatures as extra references (D28 experiment)** (`--extra-refs=<json>`, labelled DIAGNOSTIC in the runner and battery; `pilots/extra-refs-quad-clean.json`: 11 clean, native-passing G2 quadrupeds, leave-one-species-out):
- All 50 G2 quadrupeds: 25 → **24**, with churn: Serval, Ocelot re-paint, Lynx and Wild Horse gained; Leopard, Snow Leopard, both Raccoons and the Weasel's static lost. Several losses come from the G2 Cougar out-ranking the hand Cougar.
- Battery (`mutants/summary-extra-quad.json`): positives 18/34 unchanged, but erased 31 → **30**, duplicated 26 → **25**.
- **Verdict:** bootstrapping references from automatic packets weakens the refusal battery and gains nothing net. **Not recommended.** More HAND-authored references in the missing poses (legs apart; folded-wing birds) remain the lever.

**Birds: the reference pool is the blocker (session 5 diagnosis, no code change)**
- **Four of the seven hand bird references have their wings RAISED** (Goose, Heron, Sparrow, Sandpiper). The generated G2 birds all stand with wings folded.
- **Result:** 17 of 20 G2 birds were authored from the ONE standing, folded-wing reference, the Gull. Every bird admission is a Gull (or Grouse) transfer: Goose, Quail, Raven pass; Hawk, Crow, Dove, Magpie are static RED.
- The false "facing" (Starling, Robin) and "wrong family" (Cardinal, Jay) refusals happen because songbird silhouettes resemble no reference. All six refused songbirds visibly face right, with legs apart.
- **Tried and reverted:** a head-top facing corroboration. On the raised-wing references the highest paint is a wingtip, so a flipped Goose would pass (4/7 references break it).
- **Lever:** 3–4 hand-authored standing, folded-wing bird references (a passerine, a pigeon/dove, a duck, a standing raptor), or admitted G2 birds once independently accepted. Asked in C62.

**Insects: the intake blocker found and fixed (session 5)** (`merge-joint-labels-fit.mjs`, runner `--merge-joint-labels`, labelled; `merge-joint/`, `auto-g2insect-mergejoint/`):
- **Cause:** the corpus Beetle packet authors three regions on ONE joint (`elytron-near`, `elytron-far`, `thorax`). The shipped beetle's intake merged them (`fit-04/label-authoring-receipt.json` regionOwnerMap → `thorax`), but `intake-authored.mjs` does not. So the hand Beetle packet itself, and every insect transferred from it, is refused at the source-join probe ("unique known source owners"). Termite and Cicada were ADMITTED by the author and then died there.
- **Fix:** merge on the label raster (a traced polygon union was tried first and took ~50 px of other owners, so it was rejected), then compile through the unchanged painter-label path. Conservation: only group pixels change owner, to the kept `thorax`.
- **Control:** the hand Beetle packet, after the merge, **matches the shipped `fit-04` owner map on all 1,572,516 pixels** with the same part set.
- **Result on all 17 G2 insects:** Termite and Cicada now compile and reach static, but both are **static RED on motion limits** (Codex's lane, limits unchanged):
  - Termite: only the `legFrontFarFoot` joint limit in faint (−77°).
  - Cicada: the contact scale-compression bound in cast/hit/tame/feed, plus the same faint foot limit.
- The other 15 are author refusals: thin legs and antennae against 3 dissimilar references (Beetle, Honeybee, Dragonfly), and the rear-appendage family floor. **Levers:** more insect references with legs apart, or an insect-specific transfer. Insects stay at 0 native.

**Rejected lever: `legMatch` (session 5)** (`auto-author.mjs` option, runner/battery flag `--leg-match=N`, off by default):
- **The idea:** eight quadrupeds are refused for "an unassigned limb-down appendage" (Hyena, Jaguar, Serval, Caracal, Lynx, Badger, Wolverine, the Ocelot re-paint). The evidence shows the painting's four separate legs against a reference whose near/far legs overlap (e.g. Wild Horse for Serval and Hyena). legMatch picks, among the 3 cheapest references, the first whose MEASURED limb-down count equals the painting's. It chooses before any verdict and never retries after a refusal.
- **Measured:**
  - Battery (`mutants/summary-legmatch3.json` vs the exact baseline reproduction `summary-v10-repro.json`): positives 18 → **14/34**, erased 31 → 32/34, flip/wrong family/duplicated unchanged.
  - All 50 G2 quadrupeds (`auto-g2quad-legmatch3/`): 25 → **25**, with no single subject changed.
- **Verdict:** it costs corpus positives and gains nothing on generated paintings. **Kept off.** The limb-down refusals need a reference pool with legs apart (or a far-leg re-seat), not a different pick from the current pool.

**G2 C59 batch (Codex `4b08de11`: 12 paintings, 1 pattern-REFUSE skipped; scored with v10 + `--serpent-strips`)** (`auto-g2c59-v10s/`, `native-g2c59/`):
- **3/11 ADMIT + PASS_STATIC, and 3/3 native DIAGNOSTIC_PASS:** Raccoon, **Vulture** (the second bird through), and **Water Snake** (the first held-out snake for the strip author).
- **Refused:**
  - Elk (far ear root 19 %), Moose (short tail), Bison (unexplained paint);
  - Badger, Wolverine (limb-down appendage);
  - Starling (facing), Kingfisher (unexplained paint);
  - Ladybug (the insect rear floor).
- **Full-size** (`fullsize-reaction.jpg`): Water Snake and Raccoon look clean. **The Vulture shows a thin pointed feather shard above the left bird's wing** in the reaction (a wing tear).

**Correction:** the C56 Bobcat's native FAIL is a REAL late-motion slowdown, not the capture instrument, per Codex's `C59_REPAIR_20260926/bobcat-diagnosis.json`: 850/887 frames, with lethal reaction/idle ARAP about 200 ms per frame.

**Serpent strip author (session 5, 2026-09-27): snakes 0 → 9** (`port/v2/tools/anatomy-verify/serpent-author.mjs`; runner flag `--serpent-strips`, labelled; `serpent/`, `auto-g2serp-strips-v1/`, `native-serpents/`):

- **Why the general author failed every snake:** it warps the reference's part polygons with a contour spline. From THICK, straight references onto THIN S-curve paintings, that leaves most polygons over background, so every segment reads as "missing anatomy" and the leftover body reads as "extra appendages".
- **How the hand serpent packets are built:** each body segment is a full-height vertical strip; landmarks sit on the observed centreline; head and jaw are small polygons. This works because a side-profile snake is x-monotone. All 10 generated snakes are: 98.6–100 % of each column's paint lies in one run.
- **What the strip author does:**
  1. Measures the target's own centreline and thickness per column.
  2. Picks the serpent reference with the closest thickness ratio.
  3. Transfers the reference's cuts, landmarks and head/jaw polygons by fraction of body length, and by offset (in local thicknesses) from the centreline.
- **Refusals:**
  - detached paint (the main piece holds < 97 %);
  - not x-monotone (coils or overlap);
  - body not continuous (> 1 % of the length without paint, not counting a hair-thin tail tip);
  - not elongated (length/thickness < 8: the wrong-family guard);
  - facing (the right-hand head end must be ≥ 1.15× the tail end);
  - untapered tail (a truncated tail);
  - **blunt head end:** snout ratio > 0.72. Calibrated on 11 positives (0.27–0.59) against their erased-head mutants (0.85–1.12);
  - reference-relative ownership: each part must own ≥ 25 % of the share the same part owns in the reference. Tiny marker parts such as the Racer's `root-patch` stay tiny; this is the v10 marker lesson.
- **Battery** (`serpent/battery.mjs`, fixed before the scored run; `battery.json`):
  - Positives: 10/12 admitted. Boa is refused because its tail curls back under the body (correct). Whip Snake is refused because its hair-thin tail segment owns 1.4 % against the reference's 6 %.
  - Mutants: flip 12/12, erased head 12/12, mid-body cut 12/12, duplicated body 12/12; erased tail 11/12 (a 30 %-shorter Whip Snake still reads as a slender snake). **Total 59/60.**
  - Wrong family: 9/9 refused (quadrupeds, birds, insects).
  - **Caveat:** the snout threshold was calibrated on the same snakes, so the next G2 snake batch is its true held-out test. The C59 Water Snake (below) is the first held-out snake, and it passed.
- **Scored run:**
  - C54 + C56 snakes: **8/10 ADMIT + PASS_STATIC, and 8/8 native DIAGNOSTIC_PASS** (0/0 refusals): Python, Racer, Garter, Tree, Rat, Cottonmouth, Mamba, Grass Snake.
  - C59 Water Snake (held out): ADMIT + PASS_STATIC.
- **Claude's full-size look** (`native-serpents/fullsize-reaction.jpg`, `tail-zoom.jpg`): continuous scaled bodies, clean tapering tails, intact heads, and the Cottonmouth strikes mouth-open. **No seams or tears visible: the cleanest family so far.**
- `semanticPresence` for serpents stays UNRESOLVED (head presence is measured by the snout guard, but not independently confirmed). Play admission waits for Dakk's review.

**Guarded exact-label tail step in the runner** (`tail-labels-fit.mjs`, runner flag `--tail-labels`, labelled; `auto-g2tail-labels-v1/`):
- The step is Codex's compile path plus the rig-derived identity guard.
- It reproduces Codex's Cod and Arctic Fox labels and bindings byte-for-byte, and refuses a wrong tail name before writing anything.
- **Regression + held-out:** all six fits PASS_STATIC. Cod 4,550 / Perch 14 / Carp 109 / Arctic Fox 7,554 px filled, as before.
- **Herring (4,450 px) and Trout (725 px) are NEW:** the polygon route had to refuse both. Both are native DIAGNOSTIC_PASS.
- **Herring is the genuinely gapped held-out fish Codex asked for:** Salmon-referenced, and never in Codex's set.
- Full-size (`TAIL_LABELS_CHECK_20260926/fish-labels-zoom.jpg`): all three tails are full, but unwelded body seams remain (vertical cracks; the Cod's hole behind the fin). - **Greedy selective weld on the labelled fits** (`weld-g2fam-fish/greedy-labels.sh`, the unchanged C48 recipe):
  - Final pairs: Herring `body↔spine1–4`; Trout `body↔spine1–4 + head↔spine0`. Both PASS_STATIC and native DIAGNOSTIC_PASS.
  - Full-size (`TAIL_LABELS_CHECK_20260926/fish-welded-zoom.jpg`): **the approach frames are clean** (the cracks close, tails full). **But in the hit reaction the welded backs go lumpy, and the Trout's dorsal fin floats off its back.** This is the same weld-induced silhouette deformation as the earlier Salmon-referenced Herring/Trout welds.
  - Not acceptable. The body-seam repair for the Salmon-referenced fish stays with Codex.
  - Codex's `cod-gill-two` / `perch-gill-two` (two observed gill welds on the tail labels) close the Cod and Perch holes.

**G2 C56 + C57 batches (Codex `126d8765`: 32 new paintings + 7 pattern re-paints), scored with v10 (session 4, continued)** (`auto-g2c56-v10/`, `auto-g2c57-v10/`, `native-g2c56/`):
- **Pattern gate honoured before scoring** (`pilots/*-pattern-eligible.json`). Six paintings were skipped because Codex's `pattern-check.json` REFUSES them: both Jaguars, the C56 Clouded Leopard, Water Snake, Mountain Viper and Ladybug. 33 were scored.
- **ADMIT + PASS_STATIC: 8/33.**
  - C57 re-paints: Snow Leopard and Clouded Leopard (Cougar ref.).
  - C56: Coyote (Wolf), Bobcat (Brown Bear), Mink (Cougar), Marten (River Otter), Fisher (Cougar), Raven (Gull).
- **Static RED:**
  - Leopard re-paint: `approach:trot` exceeds the contact scale-compression bound.
  - Crow, Magpie, Dove: ARAP folds in faint/presentation.
- **Refused:**
  - Tiger re-paint (the far ear tip covers 6 %), Ocelot re-paint, Caracal, Lynx (limb-down appendage).
  - Robin (facing), Cardinal, Jay (wrong family), Pigeon (unexplained paint).
  - All 6 snakes (thin S-curve appendages).
  - 6 insects (floors and coverage); Cicada ADMIT but intake refused (source-join owners).
  - The earlier plain-coat Tiger, Leopard and Ocelot passed. Their pattern re-paints score worse, so pattern paint and the rig are now in tension for those three.
- **Native (CPU ×4): 7/8 DIAGNOSTIC_PASS**, 0/0 refusals. **The Raven is the first bird through the whole chain.**
  - Bobcat FAIL: 0 rig refusals in 850 frames, but the capture reports "missing live frames" (instrument class). Not retried, per the no-retry rule.
- **Full-size look** (`fullsize-approach.jpg`, `fullsize-reaction.jpg`, `chest-zoom.jpg`, `raven-tail-zoom.jpg`):
  - The pattern re-paints work: real spots and clouds.
  - Coyote and Marten look clean.
  - **Elbow flap on every Cougar-referenced fit:** Mink, Fisher, Snow Leopard, and mildly the Clouded Leopard. This is Codex's C57 diagnosis (the `fore-near-root` distal corners reach 108–116 px lateral).
  - **The Raven's tail splits in the hit reaction**, although its approach is clean.
- **Running total of generated creatures passing native:** 9 (session 3) + 7 (C54) + 7 (C56/C57) = 23. All but the Raven are quadrupeds. None is visually accepted yet: Dakk's end-of-pass review.

**G2 C54 batch (Codex `2447b472`: 24 new paintings), scored with the adopted v10 author (session 4, 2026-09-26)** (`auto-g2c54-v10/`; leave-one-species-out; zero hand edits; the command is in the ROADMAP handoff):

| Family | ADMIT + PASS_STATIC | Native (CPU ×4) | Refusals |
|---|---:|---|---|
| Quadrupeds (12) | **7:** Dingo, Jackal (Wolf ref.); Lion, Tiger, Leopard, Ocelot (Cougar ref.); Weasel (River Otter ref.) | **7/7 DIAGNOSTIC_PASS**, 0/0 refusals (land script, `native-g2c54/`) | Snow Leopard ADMIT but static RED (presentation: `approach:trot` exceeds the contact scale-compression bound, the Red Fox class). Hyena, Jaguar, Serval: an unassigned limb-down appendage of 6–7 %. Stoat: the far ear tip covers 9 % |
| Birds (4) | **2:** Goose, Quail (Gull ref.; semantic presence RESOLVED). The first birds ever to pass static | **0/2.** Goose FAIL (3 peck refusals + missing live frames); Quail FAIL (ARAP folds 19, faint foot joint limit 48°) | Duck: 6.6 % unexplained paint. Partridge: wrong family, and the tail fan covers 18 % |
| Serpents (4) | 0 | — | an unassigned front/rear "appendage" of 9–27 % (the C47 layout drift is unchanged: thin S-curves). Python is also refused on facing |
| Insects (4) | 0 (Termite ADMIT, but intake refused: `Source join continuity: unique known source owners`) | — | Cockroach: the rear family floor and antenna coverage. Locust: the knee covers 29 %. Beetle: facing and wrong family |

- **Total: 9/24 ADMIT + PASS_STATIC, and 7/24 native PASS.** The pattern holds: controlled-layout quadrupeds flow, while serpents and insects are still refused on layout.
- **Claude's visual check at full size** (`native-g2c54/review-sheet.jpg`, `fullsize-approach.jpg`, `fullsize-reaction.jpg`, `chest-zoom.jpg`):
  - Every tail is full: no blotches, knots or pinches. Legs are whole and heads stay intact.
  - Dingo, Jackal, Lion and Weasel look clean.
  - **A fault the gates miss, on the Cougar-referenced cats (Tiger, Leopard, Ocelot):** in stride, a pointed flap of chest fur hangs below the near elbow. The upper-foreleg cut carries chest paint with it. The Leopard also shows a thin seam on the shoulder. Handed to Codex (fit side, C57).
  - **A painting fault:** Tiger, Leopard, Ocelot, Jaguar and Snow Leopard were generated WITHOUT their coat patterns (no stripes, no rosettes, no spots). They read as recoloured cougars. G2 prompt fix: C57 and D27.
- **The fish tail**, with Codex's C55 correction plus a component-preserving bridge: see `audits/TAIL_STALK_BRIDGE_20260926/README.md`. Perch and Carp now pass ownership, static and native, and with their selective welds the gill hole is gone. But neither fish is a genuinely gapped tail, so the rule is not adopted.

**v9–v11 (session 3, continued): four levers tried; one bug fixed, no count change.**

| Lever | Result | Status |
|---|---|---|
| **Near/far limb separator** (`limb-separation.mjs`, measured inside the author on the mutation battery, `summary-v9-sepdiag.json`): contact between the transferred near and far limb regions inside paint, and the image edge there against interior texture | **Dead end.** Erased-far-leg mutants often show MORE contact than the unmutated positives (Wolf 87 vs 14 px on the hind pair, Marmot 108 vs 29, Sparrow 47 vs 16), with the same edge ratio (~2–3). The transferred far-leg polygon lands on the near leg's own paint, so the "edge" is ordinary texture inside one leg; many true positives touch nowhere (contact 0). No threshold separates them. | module kept as an off-by-default diagnostic |
| **Remainder marker** | A real bug: 18 hand packets mark the remainder part with a ≤ 2 px² origin triangle (3 use the full canvas). The author warped that marker like geometry, or clamped it to three identical points (12/40 packets, every failing bird). Markers are now copied verbatim, and a real part transferred off the canvas refuses. | **adopted (v10):** the battery is identical (31/34 · 26/27 · 34/34 · 34/34); static is unchanged at 12/40 and 10/20 |
| **Per-part swap on the Eagle** (`hybrid-eagle-parts/`): each auto polygon replaced by the hand one, one at a time | **The Eagle's red is entirely its TAIL outline.** Only the hand tail turns it PASS_STATIC; the other 15 swaps stay RED on cast and victory. The transferred tail (from the Gull's shorter tail) leaves 27 % of the painted tail to the body part (`tailcov`); the chest leaks 43 %. Landmark/polygon hybrids (`hybrid-v8/`): Eagle = polygons (hand polygons + auto landmarks PASS); Sparrow = mixed (faint is landmark-driven, cast polygon-driven). | handed to Codex's fit repair (C44) |
| **Paint-grown appendage parts** (`leaf-growth.mjs`, `--grow`, run AFTER the verdict so refusals cannot change): unclaimed paint inside a counted appendage goes to its nearest assigned owner part; contact-chain parts never grow | The Eagle's cast/victory reds clear, but hit/kick reds appear. Sparrow, Sandpiper and Brown Bear are unchanged. Growing feet (the first probe) made contact reds. Net zero: fold behaviour is sensitive to exact outlines, and the counter's appendage blob stops short of the tail root. | option, off by default |

**Where this leaves G1:** the author-side levers available without new information are exhausted. What moves the numbers now is on the painting side (C44):
- **G2 paintings posed with near and far limbs apart** (a stride with no overlap). The paint-only counter then sees every leg, semantic presence resolves, and the thin-part and far-leg ambiguities disappear.
- **True tails painted clearly** (short-tailed species refuse by rule).
- **More same-family references,** only via independently accepted packets.

**v8 (session 3): Codex's second review closed in the runner** (`auto-v8/`, `auto-g2-v8/`; results identical to v5: 12/40, 10/20, same subjects).
- **Canonical identity:** the runner now recomputes `speciesVisualKey(genome)` and refuses on disagreement. Provenance `identity.checks` states exactly what was checked. 60/60 agree.
- **Presence narrowed to what is measured.** Each ADMIT's `provenance.json` `presence` records:
  - the geometric inventory (appendages by class, ground contacts, detached islands);
  - that the empty absent/hidden/folded lists are an intake-format necessity, NOT an all-visible attestation;
  - a semantic status. It is **RESOLVED** only when every reference appendage is assigned AND no appendage merges two limb chains; otherwise it is **UNRESOLVED**, with the unassigned and merged chains named. `playAdmission` stays blocked until semantic presence resolves and native + visual review pass.
- **Result** (corrected after Codex's check; the first wording counted only the ADMIT + PASS_STATIC packets): among those 12, RESOLVED for the 6 fish (salmon, sturgeon, bass, tang, reef-shark, pike), and UNRESOLVED for the 6 quadrupeds/birds and all 10 G2 passes. Across ALL admitted packets, Sparrow, Sandpiper, Mongoose and Tapir are RESOLVED; each of them is static-RED. The cause is ALWAYS overlapped near/far limbs (for example `foreFar+foreNear`); no reference appendage is unassigned.
- **The one lever that closes both open G1 findings** (semantic presence and thin-part false refusals): a near/far limb separator for overlapped side-profile limbs.

**Codex's second review (C40 answers, `audits/G1_CONTRACT_REVIEW_20260926`), status:**
- **Canonical identity:** `identity-and-shipped38.json` records that for all 60 subjects (40 corpus + 20 G2) the subject-source `visualKey` equals `speciesVisualKey(genome)`. The runner's identity check is still shape-level; a canonical check in the Node runner is next. It would change no result today.
- **The exact shipped-38 ID/status manifest** is in the same file: 32 evaluable (10 ADMIT + PASS_STATIC under v5) and 6 UNEVALUABLE (5 crabs and Civet: no hand `authoring.json`).
- **Open:** "all-visible attestation still overstates the geometric counter". The counter measures appendage/island/ground counts, not per-part presence, so the presence claim must be narrowed to what it measures (next).
- **Codex:** no D24 denominator change accepted (Dakk decides); D25 stays off; the short-tail truncation contract is refused (zero distal paint is ambiguous).

**Corpus identity (Codex asked):**
- The PROGRAM's "38" was the number of shipped painted archetypes.
- The G1 corpus is the **40** subjects that have a hand-authored `authoring.json`.
- **32** of those are shipped archetypes.
- The **8** extra are hand-authored but not in the card set: Cattle, Brown Bear, Sparrow, Grouse, Sandpiper, Herring, Wild Horse, Honeybee.
- **6** shipped archetypes have NO `authoring.json` and cannot be evaluated by construction. These are the five crabs and Civet, which came from the earlier labelled-parts rigs.
- **On the shipped-32 subset,** v5 admits + passes **10** (salmon, sturgeon, cougar, impala, bass, tang, wolf, gull, reef-shark, pike).

## What it is

- `port/v2/tools/anatomy-verify/auto-author.mjs`: turns a painting plus its family into the exact `authoring.json` Codex hand-writes (id, family, habitat, landmarksPx, groundLineY, materials, remainderPart, parts[{id, joint, layer, polygonPx}], coverage). It also writes a `cf.anatomy-presence/v2` declaration: all-visible, with hidden and folded **never inferred**.
- The output feeds Codex's **unchanged** `port/v2/tools/creature-animation/intake-authored.mjs`.
- **Method: registration by transfer.** There are no creature or family special cases.
  1. The silhouette comes from the master's alpha, or from the magenta key (`keyAndDespill`) for opaque masters.
  2. Its outer contour is matched to each same-family REFERENCE with cyclic dynamic time warping (DTW) on bbox-normalised position plus local turning.
  3. A regularised thin-plate spline built from the matched points carries the reference's landmarks and part polygons.
  4. Landmarks are snapped onto paint.
  5. v2 options:
     - `topK=1`: landmarks from the single best reference, so the skeleton's proportions stay coherent;
     - `chains`: every contract contact chain's knee and end are placed along the painted leg's medial-ridge path, at the reference's bone-length fractions.
- **The verdict uses only the target's visible paint:**
  - `missing-anatomy`: a mapped part covers too little paint;
  - `unexplained-anatomy`: a large painted region no part claims, away from the body;
  - `facing`: the mirrored painting matches the family better;
  - `wrong-family`: another family matches clearly better;
  - `no-reference`: no other hand-authored subject of the family exists.
- **Evaluation corpus (`corpus.json`):** 40 subjects, one canonical hand-authored packet each. The test is **leave-one-subject-out**: a subject's own packets are never its reference, and the author never reads the subject's `authoring.json`. `subject-source.json` (species name and genome, not anatomy) is copied into the auto packet.
- **Materials and habitat are automatic:**
  - Materials: the species group's integument keyed by the pinned Earth profile (v5+; the v1–v3 family default table is retired).
  - Habitat: the Earth fauna profile's media (water → aquatic, ground+water → amphibious, ground → land, air only → aerial). Adult flight stays a declaration.
- **Static gate (`harness/`):** the sprint static gate (`audits/ARCHETYPE_SPRINT_20260922/static.ts` + runner), re-rooted to this worktree. The gate logic is identical; only the import paths and ROOT changed (14 lines). The original hard-codes Codex's worktree and refuses paths outside it.

## Results

| Run | Settings | ADMIT + PASS_STATIC | ADMIT + RED | ADMIT + intake refused | REFUSE |
|---|---|---:|---:|---:|---:|
| **Control** (hand-authored packets, same harness) | — | **30/40** | 8 RED | 2 intake refused | — |
| v1 | median of 3 references | 7/40 | 10 | 1 | 22 |
| **v2** | best reference + contact-chain ridge placement | **12/40** | 4 | 2 | 22 |
| v2 diagnostic | static run on the 14 refused authors | +5 would pass (heron, herring, ibex, racer, river-otter) | 3 | 6 | — |

**v2 per subject** (`auto-v2/summary.json`; landmark error = median distance to the hand landmark, in body lengths):

| Subject | Family | Verdict | Static | Landmark error | Note |
|---|---|---|---|---:|---|
| bass | fish | ADMIT | PASS | 0.056 | |
| cattle | quadruped | ADMIT | PASS | 0.067 | |
| cougar | quadruped | ADMIT | PASS | 0.038 | hand control is RED on this harness |
| gull | biped-bird | ADMIT | PASS | 0.038 | |
| impala | quadruped | ADMIT | PASS | 0.041 | |
| pike | fish | ADMIT | PASS | 0.035 | |
| reef-shark | fish | ADMIT | PASS | 0.049 | |
| salmon | fish | ADMIT | PASS | 0.058 | |
| sturgeon | fish | ADMIT | PASS | 0.035 | |
| tang | fish | ADMIT | PASS | 0.059 | |
| wild-horse | quadruped | ADMIT | PASS | 0.042 | |
| wolf | quadruped | ADMIT | PASS | 0.051 | |
| brown-bear | quadruped | ADMIT | RED | 0.105 | claw, tail, cast, victory (hand control also RED) |
| eagle | biped-bird | ADMIT | RED | 0.039 | alert, cast, victory |
| sandpiper | biped-bird | ADMIT | RED | 0.147 | alert, victory |
| sparrow | biped-bird | ADMIT | RED | 0.054 | faint |
| grouse | biped-bird | ADMIT | intake refused | 0.037 | observed surfaces: contact conflicts with fixed owner |
| salamander | quadruped | ADMIT | intake refused | 0.037 | part-mask polygon |
| heron, herring, ibex, racer, river-otter | — | REFUSE | (diagnostic PASS) | 0.03–0.07 | false refusals: thin parts (shin, dorsal fin, ear tip, head) land beside their paint |
| goose, marmot | — | REFUSE | (diagnostic RED) | 0.04, 0.03 | |
| rat, wall-lizard | quadruped | REFUSE | (diagnostic intake refused) | 0.05, 0.04 | |
| python, eel | serpent | REFUSE | (diagnostic intake refused) | 0.06–0.07 | the three serpents are posed very differently |
| beetle, dragonfly, honeybee | insect | REFUSE | (diagnostic RED / intake) | 0.13–0.14 | three insects with very different wing states |
| starfish, jellyfish | radial | REFUSE | — | 0.16–0.18 | a five-armed star and a bell with 12 arms share no geometry |
| tree-frog, chimpanzee, tarantula, octopus, fruit-bat, centipede | singletons | REFUSE | — | — | no-reference: the only hand-authored subject of their family |

**Mutation battery** (`run-mutants.mjs`, v2 settings, the 34 subjects that have a reference; `mutants/summary-v2.json`). Each mutant is built from the subject's own hand labels, which define the mutation only:

| Mutant | Must REFUSE | Result |
|---|---|---|
| wrong family (authored as another family) | ✔ | **34/34** |
| flipped facing (mirrored painting) | ✔ | **33/34** |
| erased limb (one contact chain, or the largest leaf part, erased) | ✔ | 23/34 |
| duplicated limb (that limb pasted into free canvas) | ✔ | 23/27 (7 not applicable: no free placement) |
| positives (unmutated) | ADMIT | 18/34 (verdict only) |

## What failed, with numbers (retained)

- **Landmark median of three references (v1):** incoherent bone proportions, and contact-solver scale-compression and joint-limit reds. On the eight admitted-red subjects, best-single-reference turned 3 green and chain placement a 4th (cattle).
- **Ridge climb (`--ridge=0.025`):** lowered landmark error (wolf 0.034→0.026, bass 0.048→0.036), but shortened bones below the contract minimum (wolf intake "proportion bound: bone-min"). Not in v2.
- **Skeleton-grown parts** (nearest-bone ownership traced to polygons; `--skeleton`):
  - Codex's authoring convention differs by family: parent→J bone for birds (0.60–0.66 agreement), neither for quadrupeds (≈0.36–0.38).
  - Choosing per part collides: two parts get the same bone.
  - The family-level choice still refused every trial subject on part-share noise.
  - Kept as an option, not used.
- **Bounded part nudge (`--nudge=0.012`):** admits more positives (heron, marmot), but erased-limb refusal falls from 6/10 to 2/8, and flip and wrong family each leak one. The verdict and part placement share one evidence source, so loosening one weakens the other. Rejected.
- **Absolute DTW cost and detour run lengths:** mutants always cost more than their own positive, but the absolute values overlap across subjects (e.g. impala positive 0.0159 > wolf erased 0.0109). Recorded in the evidence; not used as a gate.

## Why the gate is not met, and the next levers

1. **References.**
   - 6 subjects are singletons (the only hand-authored packet of their family), and the radial, serpent and insect families have 2–3 dissimilar members each.
   - Transfer cannot work without a similar reference. The G2 pilot (Codex: about 20 same-family paintings in the controlled layout) is exactly what raises this ceiling, since each new hand-authored or admitted packet becomes a reference.
2. **Thin parts.**
   - Ear tips, shins, fins and heads land a few pixels beside their paint.
   - 5 authors refused only for this would pass static.
   - The fix must not loosen the paint evidence (the nudge did). Candidates:
     - a part-level local registration that must keep each part attached to its own chain's ridge;
     - or a second, independent limb-count verifier (T1's template-graph walk-back) so that placement can relax while counting stays strict.
3. **Limb counting (erased/duplicated) is the verifier's real weakness:** 23/34 and 23/27. It needs T1's counted-visible-anatomy verdict (the README slices before this one), not a threshold on coverage.
4. **Bird motion reds** (eagle, sparrow, sandpiper): faint, cast and victory refusals under the contact solver. Compare the hand bird fits, which also used observed supports.

## Contract for Codex's review

- **Input:** `master.png` (1254², the controlled layout: side profile facing right), the family id, `subject-source.json`.
- **Output:** `authoring.json` (the same schema Codex writes) plus `presence.json` (all-visible) plus `evidence.json` (verdict, reasons, the best reference, per-reference DTW costs, part paint coverage, detours, chain placement).
- **Codex's `intake-authored.mjs`, fit chain and gates are unchanged.**
  - A REFUSE is never fed to intake, except in the labelled diagnostic run.
  - An ADMIT still has to pass intake, static and native gates, and Dakk's visual acceptance.
- **Please review:**
  - (a) whether copying `subject-source.json` is acceptable (species metadata, not anatomy);
  - (b) the materials default table (the free-text `materials.surface`);
  - (c) whether habitat-from-profile is acceptable, or must stay declared;
  - (d) the re-rooted static harness (a diff of 14 path lines against your `static.ts`).

## Reproduce (from the worktree root)

```sh
node audits/G1_AUTO_AUTHOR_20260926/run-control.mjs                                  # hand-authored ceiling
node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=v2 --topk=1 --chains          # the v2 author
node audits/G1_AUTO_AUTHOR_20260926/run-mutants.mjs --tag=v2                         # mutation battery (verdict only)
node audits/G1_AUTO_AUTHOR_20260926/report.mjs auto-v2                               # per-subject table
node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=v5 --topk=1 --chains --counter --fallback=2          # adopted author (corpus)
node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=g2-v5 --topk=1 --chains --counter --fallback=2 --targets=audits/G2_QUADRUPED_PILOT_20260926/pilot.json
node audits/G1_AUTO_AUTHOR_20260926/run-mutants.mjs --tag=v4 --counter                                      # battery for the adopted author
node audits/G1_AUTO_AUTHOR_20260926/run-mutants.mjs --tag=v6-shop2 --counter --shop=2                        # the rejected shopping policy
```

Fits and master copies are regenerable and git-ignored (`.gitignore`). Scores, evidence, generated authoring and presence, and static reports are committed.
