# Codex prompt — Motion anatomy program (Nick, 2026-09-23)

Copy everything below the line into Codex (`/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`).

---

**Nick accepted the archetype sprint art (all thirteen selections).** His direction: *"Animations can be fine-tuned
more. The snake doesn't move exactly like a snake — we need to double-check all the animals and make sure they're
moving appropriately for their anatomy."* This run is **MOTION ANATOMY**: every rigged animal must move the way its
body is built, measured against a written reference, not judged by eye alone. It is one run with no internal stops;
halt only on a red you cannot fix without changing a sealed gate. Standing authority applies (signed commits; no
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
