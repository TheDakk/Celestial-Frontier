# Codex prompt — Motion anatomy program (Nick, 2026-09-23)

Copy everything below the line into Codex (`/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`).

---

## SPRINT MODE — read this first (Nick, 2026-09-23: "stop waiting… I really want to do a sprint")

Nick is tired of "stop, generate something, stop." For this run and every run after it, until Nick says otherwise:

- **Work in large batches.** Carry the whole program below — every phase, every animal — to completion in one run. Do not
  stop after a generation, a film, a packet, a phase or a commit to report or to ask "shall I continue?". Commit signed
  as you go (small, frequent commits are fine) and KEEP GOING.
- **Decide routine calls yourself.** Numeric tuning, which animal next, how to structure a tool, whether a retained
  refusal needs a second candidate — pick the option you would recommend, record it in the packet in one line, and move
  on. Nick reviews the films at the end; he does not want to approve each step.
- **Batch every question** into the final report. If one item is blocked, write down why and continue with every other
  item; a blocked item never stops the run.
- **Stop only at a real gate:** a push, PR, label, hosted Actions attempt, merge, release or deploy (those still need
  Nick's word); a sealed gate or sealed measurement that would have to be weakened or re-bound; a signing refusal that
  one retry does not clear (then stage everything, write the exact error, and still finish the non-commit work); or
  the whole program being done.
- **Report once, at the end:** what changed, the numbers, the films Nick should watch (Python first), and the batched
  questions.

## Also in this run — three defects from Claude's merge of your sprint (verify each; they are yours)

1. **Sealed crab measurement moved.** `apps/game/src/creature-stance-reach.test.ts` "Freshwater measured gait envelope…" is
   red on your own head: the freshwater crab's measured forward reach is **0.072643** against the sealed bound
   **0.07165**. Bisected on Claude's merged tree: first bad commit **`1dfeec2a`** (Beetle contact repair) — the pre-sprint
   `creature-rig-contact.ts` passes, all four sprint versions fail identically. Either the Beetle repair changed crab
   behaviour it should not (fix it so the crab is untouched), or the change is intended and the bound needs a MEASURED
   re-seal with its reason — not a hand re-bind.
2. **Your `overridecheck` gate is red on your own head.** From `d379e61d` on, `repeated-anatomy.mjs` imports
   `skeleton-pose.mjs` (→ `fixed-attachments.mjs`, `kinematics.ts`) and `myriapod-anatomy.mjs`, so the art tree's source
   closure is 42 art + 5 transitive modules, and the gate refuses: *"fixed-attachments.mjs@258 trusted built-in Object
   member escapes its approved direct-call context"*. Your sentinel test expects 3 transitive modules. Reviewing
   `fixed-attachments.mjs`'s Object use (or narrowing what the art tree imports), then re-running the gate and its
   mutation controls, is yours. Claude's lane keeps its own green gate until yours passes. Nick has approved adopting
   yours then, with the two hdart seal lines set to Claude's committed TypeSafe re-lift values
   (`hdart.verbatim.js` `93d1e79292e68cd2cceab14617005900b1ccf649d2284a83f0ec497ec8e34bcd`,
   `hdportrait.worker.verbatim.js` `50c43aa81272cc3e7950b85cf957d0e5657b3fd2c174fa38b16dd11cdc1b67e3`).
3. **Records carry absolute paths.** Every sprint fit's `record.json` `source` is an absolute path into
   `/Users/nick/Projects/celestial-frontier-openai-mac/…`; nothing else can resolve it. Make the writers emit
   repo-relative sources (Claude's card builder works around it today, and records the master SHA-256 it read).

## Added 2026-09-24 (Claude's night sprint) — four more, verify each

4. **The service worker refuses every painted-arena file.** In a built game, once `service-worker.js` controls the page,
   every same-origin GET that is not in the build marker answers 503 (`pwa-build.ts` fetch handler: *"Resource is not
   part of the selected Celestial Frontier build."*). The marker is `Object.keys(bundle)` at `generateBundle`, and Vite's
   `public/` files never enter the bundle, so all of `apps/game/public/battle2/**` (**133 files, 117 MB**) is refused and
   the painted arena cannot stage: `audits/BATTLE2_LIBRARY_20260924/picker-smoke-03-sw-503/report.json` (*"battle2 asset
   keyed/wild-launch.png: HTTP 503"*). The same run with the worker refused (`--no-sw`, `picker-smoke-03/`) passes. Earlier
   runs `-01`/`-02` passed with the worker served, so a first visit can race ahead of the worker; a controlled page
   always fails. Precaching 117 MB at install is not a phone answer. Recommended: a declared lazy lane in the worker for
   `/battle2/`, every file SHA-256-pinned in the marker like the model delivery lane and cached on first use, and
   leaner arena files. The worker graph is sealed and feeds I5's producer authority, so this is yours. Claude can
   generate the pinned list from the same builder list that ships the files (`tools/morph/build-card-masters.mjs`).
   Tell Claude the shape you want. **Update (day):** `apps/game/public/battle2/MANIFEST.json` already lists every shipped arena file
   with its bytes and SHA-256 (81.4 MB after Claude shipped each keyed cut-out as its alpha only), so the pin list exists.
5. **The Centipede's skin folds at 0.85× presentation scale.** `library-arena.test.ts` SCALE SWEEP plays all 17 archetypes
   through a full bout at 0.85×/1×/1.15×: 16 are clean at every scale; the Centipede refuses at 0.85× with *"ARAP skin:
   unresolved folded triangles"* (also film `chimpanzee-vs-centipede-02`). That one case is pinned as KNOWN with its reason
   and **goes red when you fix it**. Delete the pin in the same commit.
6. **`creature-stance-reach` (item 1) is still open on Claude's tree**, and item 2 (your override gate) still blocks
   adopting your gate. Nothing changed there tonight.
7. **For when Nick picks paintings (not before):** `audits/COVERAGE_STUDY_20260924/README.md`. One painting per body plan
   leaves 454 of 561 Earth species misleading. The ranked plan (138 archetypes) is in `painting-plan.json`: the top 10 (Wall
   Lizard, Cougar, Impala, Marmot, Bass, Cattle, Capuchin, Tang, Wolf, Gull) fix 120 and the top 20 fix 195. Each entry
   carries a `mustPaint` brief. Rules for every new painting: a PLAIN base coat plus its own six-mask set (the morph keeps
   luminance, so a painted mark shows on every species it stands in for). Five rig changes are needed first (primate +
   tail, hopper + tail, decapod cephalopod, arachnid + tail, shelled cephalopod). Also, 53 species have no stand-in because
   their presentation profiles have `candidateTemplates: []`, although the specialized templates exist (crustacean-small,
   annelid, gastropod, bivalve, sessile-filter…). Wiring those profiles is mechanical anatomy-chain work, and you may do
   it in this run.
8. **The painter master ships only to be hashed.** `admitFamilyRecord` (and `admitRecord` for the quadruped) reads the painter
   master's bytes only to compare `hashBytes(cutoutBytes)` with `record.geometry.cutoutAssetHash`; the pixels come from the part
   atlas. That costs 13 MB of shipped arena (16 masters). A proposal for your loader: accept a verified hash from the shipped,
   SHA-256-pinned manifest in place of the bytes (or bind the record to the atlas/binding chain it already checks). Only if you
   agree it keeps the admission's guarantee; Claude will not touch the loader.

## Added 2026-09-24 (day) — after Claude merged `1e9f5920`

9. **Five reds first appear at your `fb1922a0`** (bisected in a scratch worktree; `95c97b08` is clean; `1e9f5920` alone reproduces them):
   `creature-rig-contact-rigid-refusal.test.ts` ×2 (*"Contact: cast@157.58333333333334 exceeds scale compression bound"*, and "expected
   undefined to be an instance of Error": the refusal lost its cause), after the `creature-rig-contact.ts` change;
   `exceptional-crafting-evidence-contract.test.ts` ×2 (*"development-detail baseline red before mutation controls"*) and
   `slicesmoke-sixth-red-contract.test.ts` ×1 (`populated: false`), after the one-line `release-content.ts` addition. Please fix them in your
   lane. Claude's merged tree carries them unchanged.
10. **Item 4 is integrated.** Claude generates `apps/game/battle2-assets.json` from the shipping builder. The arena counted toward your 128 MiB cap
   left ~3 MiB, so the bindings now ship gzip-compressed (arena 48.1 MiB, ~33 MiB headroom). Edge with the worker controlling the page:
   first use, then a cached reload with 0 server requests, plus a cold-pair control (`audits/BATTLE2_LIBRARY_20260924/picker-smoke-06-sw/`).

## Added 2026-09-24 (evening)

11. **The painted art direction now carries to every card (Nick's direction).** Painted stand-ins draw about 560 Earth species and 43% of
   generated creatures (`audits/PAINTED_STAND_INS_20260924/README.md`). Two consequences for you: (a) your I5 Compendium memory
   measurement now sees painted cards for most creatures (bounded caches of 64 thumbs and 8 portraits, plus up to 13 archetype
   card masters); measure it as it is, never rebind. (b) The generated creatures' uncovered body families form a painting list:
   jelly 6.5%, four-winged 6.2%, sturgeon 5.7%, flat fish 4.6%, legless/biped/tripod land bodies 13.3%, lobster 3.3%, mantis, squid,
   cuttlefish, shark, angler and four sessile forms. Weigh it against the Earth plan when Nick orders paintings.

**Nick accepted the archetype sprint art (all thirteen selections).** His direction: *"Animations can be fine-tuned
more. The snake doesn't move exactly like a snake — we need to double-check all the animals and make sure they're
moving appropriately for their anatomy."* This run is **MOTION ANATOMY**: every rigged animal must move the way its
body is built, measured against a written reference, not judged by eye alone. It is one run with no internal stops (see SPRINT MODE above). Standing authority applies (signed commits; no
push, PR, label, hosted attempt, merge, release or deploy without Nick's word; Claude's worktree is read-only).

## Claude's diagnosis (read from `port/v2/apps/game/src/motion/family-actions.ts` at `236b9846`; verify it, don't trust it)

1. **Standing waves where the animal needs travelling waves.** Every rhythmic gait is `loop4(A, mid, -A)`
   (line 29): four keys, one shared time function for every joint. For the wave-bodied chains — serpent `swave`
   (l.132), fish `wave` (l.92), myriapod `mwave` (l.196) — every segment reaches its extreme at the same instant,
   so the S-curve **flips in place**: fixed nodes, zero head→tail phase lag. Real lateral undulation is a wave
   travelling tail-ward along the body (bend(s,t) = A(s)·sin(ωt − 2πs/λ)), which is why the Python reads wrong.
2. **No follow-the-leader.** In real lateral undulation each segment passes through the positions the head
   occupied before it, pushing sideways against contact points. Nothing here asks the body to trace the head's
   path.
3. **Legged gaits are two-phase and 50 % duty.** The footfall *groups* are anatomically right (insect tripod l.109,
   arachnid alternating tetrapod l.148), but four keys give no stance/swing asymmetry, no measured swing lift, and
   no metachronal ripple *within* a side. The centipede needs a **metachronal wave** (leg phase advancing along the
   body) instead of a tetrapod on four pairs. The primate walk, bird walk, frog hop, bat crawl, octopus arm crawl/jet
   and starfish tube-foot glide have never been checked against a reference.
4. The attack verbs have the same gap: e.g. a snake strike launches from an S-coiled neck into a near-straight
   extension of roughly ⅓–½ body length in a very short window, then recoils; the current strike is a generic
   `melee()` curve.

## The run

**M0 — Motion anatomy SPEC** (`audits/MOTION_ANATOMY_20260923/SPEC.md`, committed first). For each rigged body
plan (quadruped Civet + Bear guardian, brachyuran ×5, fish/Salmon, biped-bird/Eagle, insect/Beetle, serpent/Python,
hopper/Tree Frog, primate/Chimpanzee, radial/Starfish, arachnid/Tarantula, cephalopod/Octopus,
flyer-membrane/Fruit Bat, myriapod/Centipede), write the biomechanical reference with sources:
- **Locomotion:** gait type; footfall order and phase offsets; duty factor; swing lift arc; for chains, wave type,
  phase lag per segment, wavelength in body lengths, amplitude envelope along the body (fish: grows toward the tail;
  snake: roughly constant; centipede: undulates only at speed); head stabilisation.
- **Every action verb the template offers** (idle, alert, approach gaits, each melee verb, cast, hit, dodge, faint,
  victory, tame, feed): what it must read as for this anatomy — including what the animal *cannot* do.
- **Targets with tolerances** the instrument can check. Where the game deliberately stylises (arena scale,
  timing), say so and bound it. For the Python, state the choice: lateral undulation reads as "snake" at arena
  scale; rectilinear locomotion is the large-constrictor slow gait; offer both if the rig supports it.

**M1 — The instrument** (`motion-anatomy-audit`, beside the existing static/native harness, using its samples).
Per rig × action it extracts: per-joint angle series → phase lag along each chain (cross-correlation) and a
travelling-vs-standing wave index; path-following error (segment world trajectory against the head's path) for
serpent/myriapod/fish; per-foot contact timeline → phase offsets against the spec's groups, duty factor and swing
lift; head stabilisation; strike extension and speed. **Negative controls in both directions**, retained: today's
standing-wave Python must FAIL the travelling-wave check and a synthetic travelling wave must PASS; a tripod with
one leg swapped must fail; a duty factor forced to 0.5 must fail where the spec says otherwise; the instrument must
refuse a rig whose chain it cannot identify rather than pass it.

**M2 — Audit report before any fix.** One table: every rig × every action × every criterion, PASS/FAIL with the
measured numbers, ranked by how wrong it reads. Commit it as the baseline.

**M3 — Fixes, in severity order.** Expected first: a **travelling-wave builder** for chains (more keys per cycle or a
procedural phase function; family table parameters, not species branches) applied to serpent, fish and the
myriapod body; the Python strike and constrict rebuilt to the spec; then legged gait timing (duty factor, lift,
metachronal ripple, the myriapod metachronal wave); then the per-family verbs the audit ranks. For every fix:
before/after numbers, a re-film, and the unchanged invariants proven — exact rest, 0 changed paint pixels, the
0.25 px contact gates and solver limits unchanged, S2 protected inputs identical where the fix is not meant to touch
them, CPU p95 inside its tier (painted 3.5 ms, guardian 5 ms), determinism (no clock or `Math.random` in motion).
Never weaken a gate to pass. A fix that needs the battle STAGE to change (e.g. passing `stageDisplacement` per tick
for a travelling gait, or a longer approach beat) is Claude's module: record the exact request in the packet and do
not extend your local stage derivatives.

**M4 — For Nick.** One review page: per animal, a before/after film pair (same seed, same opponent) and one row of
the audit's numbers in plain words ("the wave now travels head→tail at 0.8 body lengths per cycle"). Put the
Python first.

**Packet:** `audits/MOTION_ANATOMY_20260923/` (SPEC, instrument README, baseline, per-fix evidence, review page),
signed commits, ROADMAP handoff with paired next steps. Claude merges each signed packet into `anthropic/mac`
(`--no-ff`, hand-reconciled) and re-films the battle stage; you do not need to sync Claude's lane. If 1Password
refuses signing, ask Nick to renew approval with "until quit" and retry once; never commit unsigned.
